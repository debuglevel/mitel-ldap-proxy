**under development, not ready, not even experimental**

# Mitel LDAP proxy
This service listens as a very basic LDAP server and forwards requests of a Mitel/Aastra/OpenCom/whatever telephony system to a less insane storage backend (like a MySQL/MariaDB database).

## Run
```bash
npm install
node server.js
```

## Test
```bash
ldapsearch -H ldap://localhost:1389 -x -b dc=example objectclass=*
```