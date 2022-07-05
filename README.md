**under development, not ready, not even experimental**

# Mitel LDAP proxy

This service listens as a very basic LDAP server and forwards requests of a Mitel/Aastra/OpenCom/OIP/whatever telephony
system (PBX) to a less insane and easier to maintain and load storage backend (like a MySQL/MariaDB database).

The idea is to have a MariaDB which can be the target of an ETL process. This database consists of two simple
tables `persons` and `numbers`:

```sql
CREATE TABLE `persons` (
 `id` int(11) NOT NULL,
 `givenname` varchar(255) DEFAULT NULL,
 `surname` varchar(255) DEFAULT NULL,
 PRIMARY KEY (`id`),
 KEY `id` (`id`),
 FULLTEXT KEY `givenname` (`givenname`),
 FULLTEXT KEY `surname` (`surname`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
```

`id` is not generated but should just be the ID of the external system (object ID, serial ID, row ID, whatever it is
called).

```sql
CREATE TABLE `numbers` (
 `id` int(11) NOT NULL,
 `person_id` int(11) DEFAULT NULL,
 `type` varchar(255) DEFAULT NULL,
 `number` varchar(255) DEFAULT NULL,
 PRIMARY KEY (`id`),
 KEY `id` (`id`),
 KEY `person_id` (`person_id`),
 KEY `number` (`number`),
 KEY `type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
```

Again, `id` is not generated but should just be the ID of the external system. `person_id` references the `id` in
the `persons` table. We did not make it a foreign key constraint because this usually complicates things in a ETL
process; this way it can just be replaced, removed, updated in either way without enforcing the correct order. Of
course, we rely on the data to be consistent (ensure to delete data missing in the external system et cetera!).

`type` can be at most three values and maps to the attributes wanted by the PBX:

* `telephonnumber` (i.e. a business number)
* `home` (i.e. a private number)
* the somewhat ambiguous `mobile` (maybe that's from a decade, where nobody could think of private mobiles and hence
  always meant to be a business number?)

`number` MUST be in E.164 format (e.g. `+4930123456`). Any weird parantheses, slashes or whatever (e.g. `+49 (30) 1234-56` or `030/1234 56`) will cause failing lookups. Do not even replace `+` with `00` (e.g. `0049` instead of `+49`), because that's just not what the PBX is looking up.

## Run

Running the service if fairly simple as long as NodeJS is installed (which should ship with `npm`). As of writing this,
18.4.0 is the current NodeJS version (but I developed it with NodeJS 12.13 because that was already installed, and I
don't care enough about ECMAScript development.)

```bash
npm install
tsc && node build/server.js # `npm run-script run` would do the same
```

## Test

The PBX will usually query only two filters. You can test those with `ldapsearch`.

```bash
ldapsearch -H ldap://localhost:10389 -D cn=sauron -w supersecret -LLL -x -b dc=baraddur,dc=mordor "(|(sn=Sa*))"
ldapsearch -H ldap://localhost:10389 -D cn=sauron -w supersecret -LLL -x -b dc=baraddur,dc=mordor "(|(mobile=+4930666)(homephone=+4930666)(telephonenumber=+4930666))"
```

## References
<https://www.manualslib.de/manual/74859/Aastra-Opencom-X320.html?page=228#manual>
<https://productdocuments.mitel.com/doc_finder/DocFinder/syd-0431_de.pdf?get&DNR=syd-0431?get&DNR=syd-0431>