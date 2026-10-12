# Experiment 1 - Version Control Operations Using Git
# Commands in the order they were run in PowerShell (see screenshots/01.png - 25.png).

# --- Identity ---
git config --global user.name "dhruvh6"
git config --global user.email "<email>"

# --- Create and initialise the repository ---
mkdir git_experiment_20
cd git_experiment_20
git init

# --- First commit ---
echo "Version 1.0" > app.txt
git status
git add app.txt
git commit -m "Initial commit"

# --- Modify, diff, commit all ---
echo "Version 2.0 update" >> app.txt
git diff
git commit -a -m "Updated app.txt"
git log --oneline

# --- Branching and merging ---
git branch feature-update
git switch feature-update
echo "New feature code" > feature.txt
git add feature.txt
git commit -m "Added feature file"
git switch master
git merge feature-update

# --- Remote, amend, reset, revert, push ---
git remote add origin https://github.com/dhruvh6/git_experiment_20.git
git commit --amend -m "Corrected commit message"
git reset --soft HEAD~1
git stash
git revert HEAD --no-edit
git push -u origin master

# --- File management ---
git mv app.txt application.txt
git status --short
git rm --cached notes.txt
git commit -m "Removed notes.txt from tracking"

# --- Stash ---
git stash
git stash list
git stash pop

# --- Inspect remotes and branches ---
git remote -v
git branch -a

# --- Clone and pull ---
cd ..
git clone https://github.com/dhruvh6/git_experiment_20.git demo_copy
cd git_experiment_20
git pull origin master
