import bcrypt

plain_password = "mysecret"  # pick your password
hashed = bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt())
print(hashed.decode("utf-8"))
