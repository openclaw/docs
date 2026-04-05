---
read_when:
    - Debug della scheda Instances
    - Stai analizzando righe di istanza duplicate o obsolete
    - Stai modificando la connessione WS del gateway o i beacon degli eventi di sistema
summary: Come vengono prodotte, unite e visualizzate le voci di presenza di OpenClaw
title: Presenza
x-i18n:
    generated_at: "2026-04-05T13:50:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: a004a1f87be08699c1b2cba97cad8678ce5e27baa425f59eaa18006fdcff26e7
    source_path: concepts/presence.md
    workflow: 15
---

# Presenza

La “presenza” di OpenClaw è una vista leggera, best effort, di:

- il **Gateway** stesso, e
- i **client connessi al Gateway** (app Mac, WebChat, CLI, ecc.)

La presenza viene usata principalmente per visualizzare la scheda **Instances** dell'app macOS e per
fornire una rapida visibilità operativa.

## Campi della presenza (cosa viene mostrato)

Le voci di presenza sono oggetti strutturati con campi come:

- `instanceId` (facoltativo ma fortemente consigliato): identità stabile del client (di solito `connect.client.instanceId`)
- `host`: nome host leggibile
- `ip`: indirizzo IP best effort
- `version`: stringa di versione del client
- `deviceFamily` / `modelIdentifier`: indizi sull'hardware
- `mode`: `ui`, `webchat`, `cli`, `backend`, `probe`, `test`, `node`, ...
- `lastInputSeconds`: “secondi dall'ultimo input utente” (se noto)
- `reason`: `self`, `connect`, `node-connected`, `periodic`, ...
- `ts`: timestamp dell'ultimo aggiornamento (ms dall'epoca Unix)

## Producer (da dove proviene la presenza)

Le voci di presenza vengono prodotte da più fonti e **unite**.

### 1) Voce self del Gateway

Il Gateway inizializza sempre una voce “self” all'avvio, così le UI mostrano l'host del gateway
ancora prima che si connetta qualsiasi client.

### 2) Connessione WebSocket

Ogni client WS inizia con una richiesta `connect`. Dopo un handshake riuscito, il
Gateway esegue l'upsert di una voce di presenza per quella connessione.

#### Perché i comandi CLI una tantum non compaiono

La CLI spesso si connette per comandi brevi, una tantum. Per evitare di riempire di rumore l'elenco
Instances, `client.mode === "cli"` **non** viene trasformato in una voce di presenza.

### 3) Beacon `system-event`

I client possono inviare beacon periodici più ricchi tramite il metodo `system-event`. L'app Mac
usa questo meccanismo per riportare nome host, IP e `lastInputSeconds`.

### 4) Connessioni dei nodi (role: node)

Quando un nodo si connette tramite il WebSocket del Gateway con `role: node`, il Gateway
esegue l'upsert di una voce di presenza per quel nodo (stesso flusso degli altri client WS).

## Regole di unione + deduplicazione (perché `instanceId` è importante)

Le voci di presenza sono archiviate in un'unica mappa in memoria:

- Le voci sono indicizzate da una **chiave di presenza**.
- La chiave migliore è un `instanceId` stabile (da `connect.client.instanceId`) che sopravvive ai riavvii.
- Le chiavi non distinguono tra maiuscole e minuscole.

Se un client si riconnette senza un `instanceId` stabile, può comparire come una riga
**duplicata**.

## TTL e dimensione limitata

La presenza è intenzionalmente effimera:

- **TTL:** le voci più vecchie di 5 minuti vengono eliminate
- **Numero massimo di voci:** 200 (le più vecchie vengono eliminate per prime)

Questo mantiene l'elenco aggiornato ed evita una crescita illimitata della memoria.

## Avvertenza per connessioni remote/tunnel (IP loopback locali)

Quando un client si connette tramite un tunnel SSH / inoltro di porta locale, il Gateway può
vedere l'indirizzo remoto come `127.0.0.1`. Per evitare di sovrascrivere un buon IP riportato dal client,
gli indirizzi remoti loopback locali vengono ignorati.

## Consumer

### Scheda Instances di macOS

L'app macOS visualizza l'output di `system-presence` e applica un piccolo indicatore di stato
(Active/Idle/Stale) in base all'età dell'ultimo aggiornamento.

## Suggerimenti per il debug

- Per vedere l'elenco grezzo, chiama `system-presence` sul Gateway.
- Se vedi duplicati:
  - conferma che i client inviino un `client.instanceId` stabile nell'handshake
  - conferma che i beacon periodici usino lo stesso `instanceId`
  - controlla se alla voce derivata dalla connessione manca `instanceId` (i duplicati sono previsti)
