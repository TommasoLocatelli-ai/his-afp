# UF14 Task 1 - Migrazione Architetturale

## Obiettivo

L'obiettivo della task e stato migliorare la sicurezza infrastrutturale del progetto, separando in modo netto l'area di presentazione dall'area che gestisce logica applicativa e dati sanitari.

In questo modo il traffico non passa piu liberamente tra tutti i componenti, ma viene controllato da un unico punto di ingresso.

## Stato Iniziale E Stato Finale

All'inizio l'infrastruttura era basata su una rete unica: questa configurazione era semplice da gestire ma poco adatta a un contesto con dati sensibili, perche aumentava la visibilita reciproca tra i servizi.

Con la migrazione e stata adottata una struttura a piu livelli, con una zona dedicata alla distribuzione dei frontend e una zona separata per i servizi interni. Il collegamento tra le due zone e stato mantenuto solo attraverso il gateway.

Il risultato e una separazione piu robusta, che riduce il rischio di accessi non desiderati verso i componenti critici.

## Interventi Principali

Le modifiche sono state applicate ai file di orchestrazione e di routing, in particolare in [docker-compose.yml](../docker-compose.yml) e in [gateway/default.conf](../gateway/default.conf).

In sintesi, e stato fatto quanto segue:

1. definizione di reti distinte per livelli funzionali diversi
2. assegnazione dei frontend alla sola area di frontiera
3. isolamento dei servizi interni nell'area protetta
4. mantenimento del gateway come unico punto di attraversamento
5. rimozione dell'esposizione diretta del database verso l'esterno

## Motivazione Della Migrazione

La migrazione era necessaria per allineare il sistema a un criterio minimo di sicurezza coerente con il dominio sanitario.

Una rete piatta puo essere accettabile in ambienti di laboratorio, ma non e adeguata quando il requisito principale e proteggere il dato clinico. La separazione a livelli riduce la probabilità che un attacco riesca e rende il controllo del traffico piu prevedibile.

## Verifica Dell'Implementazione

La validazione e stata eseguita con test che si sono concentrati su due aspetti:

1. il gateway rimane l'unico componente esposto verso l'esterno
2. i frontend non possono raggiungere direttamente il livello dati

E stata inoltre verificata la continuita del servizio applicativo attraverso il gateway, per confermare che la segmentazione non introducesse regressioni funzionali.
