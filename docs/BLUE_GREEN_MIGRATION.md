# Migrazione Blue/Green del Backend

## Obiettivo

L’obiettivo è avere due versioni del backend, `sio-backend-blue` e `sio-backend-green`, collegate allo stesso database. Il gateway sceglie quale versione usare.

## Prima

Prima c’era un solo backend: per aggiornarlo bisognava fermarlo e sostituirlo, con il rischio di una breve interruzione.

## Dopo

Nel file [docker-compose.yml](../docker-compose.yml) ci sono due servizi backend distinti:

```yaml
sio-backend-blue:
sio-backend-green:
```

Entrambi usano la stessa immagine e lo stesso database. Il gateway punta di default a `sio-backend-blue`.

Per passare alla green basta cambiare la riga nel file [gateway/default.conf](../gateway/default.conf).

## Cutover verso Green

Sostituire questa riga:

```nginx
proxy_pass http://sio-backend-blue:3000;
```

con questa:

```nginx
proxy_pass http://sio-backend-green:3000;
```

Dopo la modifica basta ricaricare il gateway.

## Rollback verso Blue

Per tornare alla blue si rimette la riga con `sio-backend-blue` e si ricarica NGINX.

## Test

1. Avviare lo stack con `docker compose up -d --build`.
2. Provare `curl http://localhost/api/health` passando dal gateway.
3. Cambiare la riga del gateway sulla green e ricaricare NGINX.
4. Ripetere la richiesta per vedere il cambio.
5. Ripristinare la blue per il rollback.

## Dato persistito

Se la green salva un dato nel database, quel dato resta anche dopo il ritorno alla blue, perché entrambe usano lo stesso database.