import mysql.connector

db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="8520",
    database="jewelry_db"
)

cursor = db.cursor()
print("Database Connected Successfully!")
