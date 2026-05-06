import sqlite3
import os

# id int primary
# name varchar
# position varchar
# age int
# salary int
os.remove('Company.db')

conn = sqlite3.connect('Company.db')
c = conn.cursor()

c.execute('''CREATE TABLE IF NOT EXISTS employees(id INTEGER PRIMARY KEY, name TEXT, position TEXT, age INTEGER, salary INTEGER)''')
conn.commit()

c.execute('''INSERT INTO employees(id, name, position, salary, age) VALUES(1,"Georgiou","Sales",800,25)''')
conn.commit()

employees_data =   [[2,"Ioannou","Sales",850,28],
                    [3,"Kali","Secretariat",700,22],
                    [4,"Konti","Support",950,35],
                    [5,"Vrettos","Administration",1400,42],
                    [6,"Alexiou","Sales",850,30],
                    [7,"Kokkinos","Support",900,34],
                    [8,"Halatsis","Secretariat",1037,38],
                    [9,"Grigoradou","Administration",1180,40],
                    [10,"Anastasiou","Sales",980,44]]

c.executemany('''INSERT INTO employees(id, name, position, salary, age) VALUES(?,?,?,?,?)''', employees_data)
conn.commit()

c.execute('''UPDATE employees SET salary = salary + salary * 1.10 WHERE position = "Sales"''')
conn.commit()

for i in c.execute('''SELECT * FROM employees WHERE name LIKE "K%" ORDER BY age DESC'''):
    print("Task 7:", i)

for i in c.execute('''SELECT * FROM employees WHERE age >= 35 AND salary < 1000'''):
    print("Task 8:", i)

conn.close()