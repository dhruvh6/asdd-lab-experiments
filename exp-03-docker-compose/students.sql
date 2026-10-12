-- Run inside the database container:
--   docker exec -it mysqlserver mysql -u student -p      (password: student123)

SHOW DATABASES;
USE studentdb;

CREATE TABLE students (roll INT PRIMARY KEY, name VARCHAR(50), batch VARCHAR(20));
INSERT INTO students VALUES (2401036, 'Dhruv Hemdev', 'T1');

SHOW TABLES;
SELECT * FROM students;
