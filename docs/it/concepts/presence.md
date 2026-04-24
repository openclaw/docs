---
read_when:
    - Debug della scheda Istanze
    - Indagare righe di istanza duplicate o obsolete
    - Modificare la connessione WS del Gateway o i beacon degli eventi di sistema
summary: Come vengono prodotti, uniti e visualizzati gli elementi di presenza di OpenClaw
title: Presenza
x-i18n:
    generated_at: "2026-04-24T08:37:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2f33a7d4a3d5e5555c68a7503b3a4f75c12db94d260e5546cfc26ca8a12de0f9
    source_path: concepts/presence.md
    workflow: 15
---

La “presenza” di OpenClaw è una vista leggera, best-effort, di:

- il **Gateway** stesso, e
- i **client connessi al Gateway** (app Mac, WebChat, CLI, ecc.)

La presenza viene usata principalmente per visualizzare la scheda **Istanze** dell'app macOS e per
fornire una rapida visibilità operativa.

## Campi della presenza (cosa compare)

Le voci di presenza sono oggetti strutturati con campi come:

- `instanceId` (facoltativo ma fortemente consigliato): identità stabile del client (di solito `connect.client.instanceId`)
- `host`: nome host leggibile
- `ip`: indirizzo IP best-effort
- `version`: stringa di versione del client
- `deviceFamily` / `modelIdentifier`: indizi hardware
- `mode`: `ui`, `webchat`, `cli`, `backend`, `probe`, `test`, `node`, ...
- `lastInputSeconds`: “secondi dall'ultimo input utente” (se noto)
- `reason`: `self`, `connect`, `node-connected`, `periodic`, ...
- `ts`: timestamp dell'ultimo aggiornamento (ms dall'epoch)

## Producer (da dove viene la presenza)

Le voci di presenza sono prodotte da più sorgenti e **unite**.

### 1) Voce self del Gateway

Il Gateway inizializza sempre una voce “self” all'avvio così le UI mostrano l'host del gateway
anche prima che si connetta qualsiasi client.

### 2) Connessione WebSocket

Ogni client WS inizia con una richiesta `connect`. Dopo un handshake riuscito, il
Gateway esegue un upsert di una voce di presenza per quella connessione.

#### Perché i comandi CLI one-off non compaiono

La CLI spesso si connette per comandi brevi e one-off. Per evitare spam nell'elenco
Istanze, `client.mode === "cli"` **non** viene trasformato in una voce di presenza.

### 3) Beacon `system-event`

I client possono inviare beacon periodici più ricchi tramite il metodo `system-event`. L'app
Mac usa questo meccanismo per segnalare nome host, IP e `lastInputSeconds`.

### 4) Connessioni Node (role: node)

Quando un Node si connette tramite il WebSocket del Gateway con `role: node`, il Gateway
esegue un upsert di una voce di presenza per quel Node (stesso flusso degli altri client WS).

## Regole di merge + deduplica (perché `instanceId` è importante)

Le voci di presenza sono archiviate in una singola mappa in memoria:

- Le voci sono indicate da una **chiave di presenza**.
- La chiave migliore è un `instanceId` stabile (da `connect.client.instanceId`) che sopravvive ai riavvii.
- Le chiavi sono case-insensitive.

Se un client si riconnette senza un `instanceId` stabile, può comparire come
riga **duplicata**.

## TTL e dimensione limitata

La presenza è intenzionalmente effimera:

- **TTL:** le voci più vecchie di 5 minuti vengono rimosse
- **Numero massimo di voci:** 200 (le più vecchie vengono eliminate per prime)

Questo mantiene l'elenco aggiornato ed evita una crescita illimitata della memoria.

## Avvertenza su remoto/tunnel (IP loopback)

Quando un client si connette tramite un tunnel SSH / un inoltro di porta locale, il Gateway può
vedere l'indirizzo remoto come `127.0.0.1`. Per evitare di sovrascrivere un buon IP segnalato dal client,
gli indirizzi remoti loopback vengono ignorati.

## Consumer

### Scheda Istanze su macOS

L'app macOS visualizza l'output di `system-presence` e applica un piccolo indicatore
di stato (Active/Idle/Stale) in base all'età dell'ultimo aggiornamento.

## Suggerimenti di debug

- Per vedere l'elenco grezzo, chiama `system-presence` sul Gateway.
- Se vedi duplicati:
  - conferma che i client inviino un `client.instanceId` stabile nell'handshake
  - conferma che i beacon periodici usino lo stesso `instanceId`
  - controlla se nella voce derivata dalla connessione manca `instanceId` (in questo caso i duplicati sono previsti)

## Correlati

- [Indicatori di digitazione](/it/concepts/typing-indicators)
- [Streaming e chunking](/it/concepts/streaming)
