---
read_when:
    - Stai approvando richieste di pairing dei dispositivi
    - Devi ruotare o revocare token dei dispositivi
summary: Riferimento CLI per `openclaw devices` (pairing dei dispositivi + rotazione/revoca dei token)
title: devices
x-i18n:
    generated_at: "2026-04-05T13:47:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: e2f9fcb8e3508a703590f87caaafd953a5d3557e11c958cbb2be1d67bb8720f4
    source_path: cli/devices.md
    workflow: 15
---

# `openclaw devices`

Gestisci richieste di pairing dei dispositivi e token con ambito dispositivo.

## Comandi

### `openclaw devices list`

Elenca le richieste di pairing in sospeso e i dispositivi associati.

```
openclaw devices list
openclaw devices list --json
```

L'output delle richieste in sospeso include il ruolo e gli ambiti richiesti, così le approvazioni possono
essere esaminate prima dell'approvazione.

### `openclaw devices remove <deviceId>`

Rimuovi una voce di dispositivo associato.

Quando sei autenticato con un token di dispositivo associato, i chiamanti non admin possono
rimuovere solo la **propria** voce di dispositivo. La rimozione di un altro dispositivo richiede
`operator.admin`.

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

Cancella in blocco i dispositivi associati.

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

Approva una richiesta di pairing del dispositivo in sospeso. Se `requestId` viene omesso, OpenClaw
approva automaticamente la richiesta in sospeso più recente.

Nota: se un dispositivo ritenta il pairing con dettagli di autenticazione modificati (ruolo/ambiti/chiave
pubblica), OpenClaw sostituisce la precedente voce in sospeso ed emette un nuovo
`requestId`. Esegui `openclaw devices list` subito prima dell'approvazione per usare l'ID
corrente.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

Rifiuta una richiesta di pairing del dispositivo in sospeso.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Ruota un token di dispositivo per un ruolo specifico, aggiornando facoltativamente gli ambiti.
Il ruolo di destinazione deve già esistere nel contratto di pairing approvato di quel dispositivo;
la rotazione non può creare un nuovo ruolo non approvato.
Se ometti `--scope`, le riconnessioni successive con il token ruotato memorizzato riutilizzano
gli ambiti approvati memorizzati nella cache di quel token. Se passi valori `--scope` espliciti, questi
diventano l'insieme di ambiti memorizzato per le future riconnessioni con token memorizzato nella cache.
I chiamanti non admin con dispositivo associato possono ruotare solo il token del **proprio**
dispositivo.
Inoltre, eventuali valori `--scope` espliciti devono rimanere entro gli ambiti operatore della
sessione del chiamante; la rotazione non può creare un token operatore più ampio di quello che il chiamante
possiede già.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Restituisce il nuovo payload del token come JSON.

### `openclaw devices revoke --device <id> --role <role>`

Revoca un token di dispositivo per un ruolo specifico.

I chiamanti non admin con dispositivo associato possono revocare solo il token del **proprio**
dispositivo. La revoca del token di un altro dispositivo richiede `operator.admin`.

```
openclaw devices revoke --device <deviceId> --role node
```

Restituisce il risultato della revoca come JSON.

## Opzioni comuni

- `--url <url>`: URL WebSocket del gateway (usa `gateway.remote.url` come predefinito quando configurato).
- `--token <token>`: token del gateway (se richiesto).
- `--password <password>`: password del gateway (autenticazione con password).
- `--timeout <ms>`: timeout RPC.
- `--json`: output JSON (consigliato per gli script).

Nota: quando imposti `--url`, la CLI non usa credenziali di fallback dalla configurazione o dall'ambiente.
Passa esplicitamente `--token` o `--password`. L'assenza di credenziali esplicite è un errore.

## Note

- La rotazione del token restituisce un nuovo token (sensibile). Trattalo come un segreto.
- Questi comandi richiedono l'ambito `operator.pairing` (o `operator.admin`).
- La rotazione del token resta all'interno dell'insieme di ruoli approvati dal pairing e della baseline
  di ambiti approvati per quel dispositivo. Una voce stray del token nella cache non concede un nuovo
  target di rotazione.
- Per le sessioni con token di dispositivo associato, la gestione tra dispositivi è riservata agli admin:
  `remove`, `rotate` e `revoke` sono limitati al proprio dispositivo a meno che il chiamante non abbia
  `operator.admin`.
- `devices clear` è intenzionalmente protetto da `--yes`.
- Se l'ambito di pairing non è disponibile su local loopback (e non viene passato alcun `--url` esplicito), list/approve possono usare un fallback di pairing locale.
- `devices approve` seleziona automaticamente la richiesta in sospeso più recente quando ometti `requestId` o passi `--latest`.

## Checklist di recupero da deriva del token

Usala quando Control UI o altri client continuano a fallire con `AUTH_TOKEN_MISMATCH` o `AUTH_DEVICE_TOKEN_MISMATCH`.

1. Conferma la sorgente corrente del token del gateway:

```bash
openclaw config get gateway.auth.token
```

2. Elenca i dispositivi associati e identifica l'ID del dispositivo interessato:

```bash
openclaw devices list
```

3. Ruota il token operatore per il dispositivo interessato:

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. Se la rotazione non basta, rimuovi il pairing obsoleto e approva di nuovo:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. Riprova la connessione del client con il token/password condiviso corrente.

Note:

- La precedenza normale dell'autenticazione di riconnessione è token/password condiviso esplicito per primo, poi `deviceToken` esplicito, poi token del dispositivo memorizzato, poi token bootstrap.
- Il recupero attendibile da `AUTH_TOKEN_MISMATCH` può inviare temporaneamente insieme sia il token condiviso sia il token del dispositivo memorizzato per quel solo tentativo delimitato.

Correlati:

- [Dashboard auth troubleshooting](/web/dashboard#if-you-see-unauthorized-1008)
- [Gateway troubleshooting](/gateway/troubleshooting#dashboard-control-ui-connectivity)
