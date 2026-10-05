#!/usr/bin/env node
// Jira Cloud automation for the CampusEats project (Experiment 6, applied).
// Credentials come from ../../.env (JIRA_URL, JIRA_EMAIL, JIRA_TOKEN) and are never printed.
//
//   node scripts/jira/jira.mjs check                       verify credentials
//   node scripts/jira/jira.mjs setup                       project, backlog, points, sprints
//   node scripts/jira/jira.mjs start-sprint 1              start sprint 1 (1-based)
//   node scripts/jira/jira.mjs complete-sprint 1
//   node scripts/jira/jira.mjs move CE-3 "In Progress"     transition an issue
//   node scripts/jira/jira.mjs link CE-3 <url> <title>     attach a PR / build link
//   node scripts/jira/jira.mjs comment CE-3 "text"
//   node scripts/jira/jira.mjs status                      list issues with status

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const backlog = JSON.parse(readFileSync(join(here, 'backlog.json'), 'utf8'))
const KEY = backlog.project.key

function loadEnv() {
  const env = {}
  for (const line of readFileSync(join(here, '..', '..', '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/)
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
  for (const k of ['JIRA_URL', 'JIRA_EMAIL', 'JIRA_TOKEN']) {
    if (!env[k] || /YOUR-SITE|your-atlassian|paste-api-token/.test(env[k])) {
      throw new Error(`${k} is not set in .env`)
    }
  }
  return { ...env, JIRA_URL: env.JIRA_URL.replace(/\/$/, '') }
}

const env = loadEnv()
const AUTH = 'Basic ' + Buffer.from(`${env.JIRA_EMAIL}:${env.JIRA_TOKEN}`).toString('base64')

async function jira(path, { method = 'GET', body, ok = [] } = {}) {
  const res = await fetch(env.JIRA_URL + path, {
    method,
    headers: { Authorization: AUTH, Accept: 'application/json', 'Content-Type': 'application/json' },
    body: body && JSON.stringify(body),
  })
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok && !ok.includes(res.status)) {
    const detail = data?.errorMessages?.join('; ') || JSON.stringify(data?.errors || data)
    throw new Error(`${method} ${path} -> ${res.status}: ${detail}`)
  }
  return { status: res.status, data }
}

// Atlassian Document Format helpers
const text = (t) => ({ type: 'text', text: t })
const para = (t) => ({ type: 'paragraph', content: [text(t)] })
const doc = (...content) => ({ type: 'doc', version: 1, content })
const bullets = (items) => ({
  type: 'bulletList',
  content: items.map((i) => ({ type: 'listItem', content: [para(i)] })),
})
const heading = (t) => ({ type: 'heading', attrs: { level: 3 }, content: [text(t)] })

function description(issue) {
  const parts = [para(issue.story)]
  if (issue.criteria) parts.push(heading('Acceptance criteria'), bullets(issue.criteria))
  parts.push(para(`Owner: ${issue.owner[0].toUpperCase()}${issue.owner.slice(1)} · Branch: feature/${issue.key}-…`))
  return doc(...parts)
}

async function me() {
  return (await jira('/rest/api/3/myself')).data
}

async function board() {
  const { data } = await jira(`/rest/agile/1.0/board?projectKeyOrId=${KEY}`)
  if (!data.values.length) throw new Error(`No board found for ${KEY}`)
  return data.values[0]
}

async function sprints(boardId) {
  const { data } = await jira(`/rest/agile/1.0/board/${boardId}/sprint?maxResults=50`)
  return data.values
}

async function ensureProject(user) {
  const existing = await jira(`/rest/api/3/project/${KEY}`, { ok: [404] })
  if (existing.status === 200) {
    console.log(`Project ${KEY} already exists`)
    return
  }
  await jira('/rest/api/3/project', {
    method: 'POST',
    body: {
      key: KEY,
      name: backlog.project.name,
      projectTypeKey: 'software',
      projectTemplateKey: 'com.pyxis.greenhopper.jira:gh-simplified-scrum-classic',
      leadAccountId: user.accountId,
      assigneeType: 'UNASSIGNED',
      description: 'CampusEats - canteen pre-order and token system (ASD&D mini project)',
    },
  })
  console.log(`Created Scrum project ${KEY}`)
}

async function findIssue(key) {
  return (await jira(`/rest/api/3/issue/${key}?fields=summary,status,labels`, { ok: [404] })).data
}

async function setup() {
  const user = await me()
  console.log(`Signed in as ${user.displayName}`)
  await ensureProject(user)
  const b = await board()

  const ordered = [...backlog.issues].sort((a, b) => Number(a.key.slice(3)) - Number(b.key.slice(3)))
  for (const issue of ordered) {
    const found = await findIssue(issue.key)
    if (found?.fields?.summary) {
      console.log(`${issue.key} exists: ${found.fields.summary}`)
      continue
    }
    const { data } = await jira('/rest/api/3/issue', {
      method: 'POST',
      body: {
        fields: {
          project: { key: KEY },
          issuetype: { name: issue.type },
          summary: issue.summary,
          description: description(issue),
          labels: [`owner-${issue.owner}`, `sprint-${issue.sprint + 1}`],
          assignee: { accountId: user.accountId },
        },
      },
    })
    if (data.key !== issue.key) console.warn(`  ! expected ${issue.key} but Jira created ${data.key}`)
    console.log(`Created ${data.key} [${issue.type}] ${issue.summary}`)
    if (issue.points) {
      await jira(`/rest/agile/1.0/issue/${data.key}/estimation?boardId=${b.id}`, {
        method: 'PUT',
        body: { value: String(issue.points) },
      })
    }
  }

  const existing = await sprints(b.id)
  for (const [i, s] of backlog.sprints.entries()) {
    let sprint = existing.find((e) => e.name === s.name)
    if (!sprint) {
      sprint = (await jira('/rest/agile/1.0/sprint', { method: 'POST', body: { name: s.name, goal: s.goal, originBoardId: b.id } })).data
      console.log(`Created sprint ${s.name}`)
    }
    const keys = backlog.issues.filter((x) => x.sprint === i).map((x) => x.key)
    if (sprint.state !== 'closed') {
      await jira(`/rest/agile/1.0/sprint/${sprint.id}/issue`, { method: 'POST', body: { issues: keys } })
      console.log(`  ${keys.length} issues in ${s.name}: ${keys.join(', ')}`)
    }
  }
  console.log(`Board: ${env.JIRA_URL}/jira/software/c/projects/${KEY}/boards/${b.id}`)
}

async function sprintState(n, state) {
  const b = await board()
  const s = (await sprints(b.id)).find((x) => x.name === backlog.sprints[n - 1].name)
  if (!s) throw new Error(`Sprint ${n} not found`)
  const body = { state }
  if (state === 'active') {
    body.startDate = new Date().toISOString()
    body.endDate = new Date(Date.now() + 7 * 86400000).toISOString()
  }
  await jira(`/rest/agile/1.0/sprint/${s.id}`, { method: 'POST', body })
  console.log(`${s.name} -> ${state}`)
}

async function move(key, target) {
  const { data } = await jira(`/rest/api/3/issue/${key}/transitions`)
  const t = data.transitions.find((x) => x.to.name.toLowerCase() === target.toLowerCase() || x.name.toLowerCase() === target.toLowerCase())
  if (!t) throw new Error(`${key}: no transition to "${target}". Available: ${data.transitions.map((x) => x.to.name).join(', ')}`)
  await jira(`/rest/api/3/issue/${key}/transitions`, { method: 'POST', body: { transition: { id: t.id } } })
  console.log(`${key} -> ${t.to.name}`)
}

async function link(key, url, title) {
  await jira(`/rest/api/3/issue/${key}/remotelink`, {
    method: 'POST',
    body: { globalId: url, object: { url, title, icon: { url16x16: 'https://github.com/favicon.ico', title: 'GitHub' } } },
  })
  console.log(`${key} linked to ${title}`)
}

async function comment(key, body) {
  await jira(`/rest/api/3/issue/${key}/comment`, { method: 'POST', body: { body: doc(para(body)) } })
  console.log(`${key} comment added`)
}

async function status() {
  const jql = encodeURIComponent(`project = ${KEY} ORDER BY key ASC`)
  const { data } = await jira(`/rest/api/3/search/jql?jql=${jql}&fields=summary,status,labels,issuetype&maxResults=100`)
  for (const i of data.issues) {
    const owner = (i.fields.labels.find((l) => l.startsWith('owner-')) || '').replace('owner-', '')
    console.log(`${i.key.padEnd(6)} ${i.fields.status.name.padEnd(12)} ${owner.padEnd(8)} ${i.fields.summary}`)
  }
}

const [command, ...rest] = process.argv.slice(2)
const commands = {
  check: async () => console.log(`OK - signed in to ${env.JIRA_URL} as ${(await me()).displayName}`),
  setup,
  'start-sprint': () => sprintState(Number(rest[0]), 'active'),
  'complete-sprint': () => sprintState(Number(rest[0]), 'closed'),
  move: () => move(rest[0], rest[1]),
  link: () => link(rest[0], rest[1], rest.slice(2).join(' ')),
  comment: () => comment(rest[0], rest.slice(1).join(' ')),
  status,
}

if (!commands[command]) {
  console.log('Usage: node scripts/jira/jira.mjs <check|setup|start-sprint N|complete-sprint N|move KEY STATUS|link KEY URL TITLE|comment KEY TEXT|status>')
  process.exit(1)
}
commands[command]().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
