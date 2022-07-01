**under development, not ready, not even experimental**

# Mitel LDAP proxy
This service listens as a very basic LDAP server and forwards requests of a Mitel/Aastra/OpenCom/whatever telephony system to a less insane storage backend (like a MySQL/MariaDB database).

## Run
```bash
npm install
node server.js
```

## Test
Simple query:
```bash
ldapsearch -H ldap://localhost:1389 -x -b dc=baraddur,dc=mordor objectclass=*
```

With password:
```bash
ldapsearch -H ldap://localhost:1389 -D cn=sauron -w supersecret      -x -b dc=baraddur,dc=mordor objectclass=*
ldapsearch -H ldap://localhost:1389 -D cn=sauron -w supersecret -LLL -x -b dc=baraddur,dc=mordor objectclass=*
ldapsearch -H ldap://localhost:1389 -D cn=sauron -w supersecret -LLL -x -b dc=baraddur,dc=mordor
```

## References
<https://www.manualslib.de/manual/74859/Aastra-Opencom-X320.html?page=228#manual>