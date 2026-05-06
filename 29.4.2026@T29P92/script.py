import sqlite3

conn = sqlite3.connect('movies.db')
c = conn.cursor()

c.execute ('''CREATE TABLE IF NOT EXISTS 
library(id INTEGER PRIMARY KEY, 
title TEXT, 
release_year DATE, 
time INTEGER, 
three_d BOOLEAN)''')

conn.commit()

c.execute('''INSERT INTO library (id, title, release_year, time, three_d) VALUES (1, "The Dark Knight",2008,152,0)''')

lib =  [[2,"The Godfather",1972,175,0],
            [3,"Amelie",2001,122,0],
            [4, "The Sting",1973,129,0],
            [5,"How to Train Your Dragon",2010,98,1],
            [6,"Avatar",2009,162,1],
            [7,"Gravity",2013,90,1],
            [8,"Toy Story 3",2010,103,1],
            [9,"Cloudy With a Chance of Meatballs",2009,90,0],
            [10,"Casablanca",1942,102,0]]

c.executemany('''INSERT INTO library (id, 
                title, 
                release_year, 
                time, 
                three_d) 
                VALUES (?, ?, ?, ?, ?)''', lib)
conn.commit()

c.execute('''SELECT title, time FROM library ORDER BY release_year DESC''')
print("##################")
for row in c.fetchall():
    print(f"{row[0]} - {row[1]} λεπτά")
print("##############")

for i in c.execute('''SELECT title, time FROM library ORDER BY release_year DESC'''):
    print("Task 6:", i)

for i in c.execute('''SELECT title FROM library WHERE title LIKE "T%"'''):
    print("Task 7:", i[0])

for i in c.execute('''SELECT * FROM library WHERE three_d = 1 AND time > 100'''):
    print("Task 8:", i)

conn.close()
 