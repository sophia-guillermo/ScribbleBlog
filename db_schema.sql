PRAGMA foreign_keys=ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS users (
user_id INTEGER PRIMARY KEY AUTOINCREMENT,
full_name TEXT NOT NULL,
username TEXT NOT NULL,
password TEXT NOT NULL,
role TEXT NOT NULL,
blog_title TEXT NULL,
blog_subtitle TEXT NULL
);

CREATE TABLE IF NOT EXISTS articles (
article_id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id INTEGER,
title TEXT NOT NULL,
subtitle TEXT NOT NULL,
article_body TEXT NOT NULL,
status INTEGER NOT NULL DEFAULT 0 CHECK (status IN (0, 1)),
creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
published TIMESTAMP DEFAULT NULL,
last_modified TIMESTAMP DEFAULT NULL,
likes INTEGER DEFAULT 0 NOT NULL,
FOREIGN KEY(user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS comments (
comment_id INTEGER PRIMARY KEY AUTOINCREMENT,
article_id INTEGER NOT NULL,
user_id INTEGER NOT NULL,
comment_body TEXT NOT NULL,
posted TIMESTAMP NOT NULL,
FOREIGN KEY(article_id) REFERENCES articles(article_id)
FOREIGN KEY(user_id) REFERENCES users(user_id)
);

-- Starter data in users - 2 authors and 1 readers
INSERT INTO users(full_name,username,password,role,blog_title,blog_subtitle) VALUES('Michael Jordan','AirJordan1963','AJordan#23','author','Balling through the years','My basketball journey from 1984-2003');
INSERT INTO users(full_name,username,password,role,blog_title,blog_subtitle) VALUES('Albert Einstein','EMcSquare','MrHighIQ@205','author','Devising theory of relativity','Revolutionizing the understanding of space, time, gravity, and the universe');
INSERT INTO users(full_name,username,password,role) VALUES('Ryan Reynolds','Reyzilla76','Deadpool2Soon!','reader');

-- Starter data in articles - 2 articles, 1 for each author
INSERT INTO articles(user_id,title,subtitle,article_body,status,creation,published,last_modified,likes) VALUES(1,'Drafting Season','3rd pick, averaging 33 points','In 1984, I was drafted by the Chicago Bulls. In my first season as a professional, I led the league in scoring and was named Rookie of the Year.',1,'2023-07-21 01:33:46','2023-07-22 05:22:09','2023-07-22 05:19:10',5);
INSERT INTO articles(user_id,title,subtitle,article_body,status,creation,published,last_modified,likes) VALUES(2,'After graduation in 1900','Application turndowns','I would have found a job, long ago if Weber had not played a dishonest game with me.',1,'2023-07-22 11:46:46',CURRENT_TIMESTAMP,'2023-07-22 11:57:03',2);

-- Starter data in comments - 2 comments, 1 for each article
INSERT INTO comments(article_id,user_id,comment_body,posted) VALUES(1,3,'Excellent start to your career!','2023-07-22 07:27:49');
INSERT INTO comments(article_id,user_id,comment_body,posted) VALUES(2,3,'Sorry to hear that.',CURRENT_TIMESTAMP);

COMMIT;

