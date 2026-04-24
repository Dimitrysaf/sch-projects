import sqlite3

conn = sqlite3.connect('example2.db')
cursor = conn.cursor()

cursor.execute('''CREATE TABLE IF NOT EXISTS 
                users(id INTEGER PRIMARY KEY,
                name TEXT,
                phone TEXT,
                email TEXT,
                password TEXT)''')
conn.commit()
conn.close()

db = sqlite3.connect('example2.db')
cursor = db.cursor()
name1 = 'Panagioris'
phone1 = '2105666858'
email1 = 'panos@example.com'
password1 = '12345'

name2 = 'Ioannis'
phone2 = '2105657241'
email2 = 'john@example.com'
password2 = 'abcdef'

cursor.execute('''INSERT INTO users(name, phone, email, password) VALUES (?,?,?,?)''', (name1, phone1, email1, password1))
print('First user inserted')

cursor.execute('''INSERT INTO users(name, phone, email, password) VALUES (?,?,?,?)''', (name2, phone2, email2, password2))
print('Second user inserted')

cursor.execute('''SELECT * FROM users''')
users = cursor.fetchall()

for user in users:
    print()

db.commit()