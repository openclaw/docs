---
read_when:
    - Stai approvando richieste di associazione dei dispositivi
    - Devi ruotare o revocare i token dei dispositivi
summary: Riferimento CLI per `openclaw devices` (associazione dei dispositivi + rotazione/revoca del token)
title: Dispositivi
x-i18n:
    generated_at: "2026-04-24T08:33:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: c4ae835807ba4b0aea1073b9a84410a10fa0394d7d34e49d645071108cea6a35
    source_path: cli/devices.md
    workflow: 15
---

# `openclaw devices`

Gestisci richieste di associazione dei dispositivi e token con ambito dispositivo.

## Comandi

### `openclaw devices list`

Elenca le richieste di associazione in sospeso e i dispositivi associati.

```
openclaw devices list
openclaw devices list --json
```

L’output delle richieste in sospeso mostra l’accesso richiesto accanto all’accesso
attualmente approvato del dispositivo quando il dispositivo è già associato. Questo rende espliciti gli upgrade di scope/ruolo invece di far sembrare che l’associazione sia andata persa.

### `openclaw devices remove <deviceId>`

Rimuovi una voce di dispositivo associato.

Quando sei autenticato con un token di dispositivo associato, i chiamanti non admin possono
rimuovere solo **la propria** voce di dispositivo. La rimozione di un altro dispositivo richiede
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

Approva una richiesta di associazione dispositivo in sospeso tramite `requestId` esatto. Se `requestId`
viene omesso o viene passato `--latest`, OpenClaw stampa solo la richiesta in sospeso selezionata
ed esce; riesegui l’approvazione con l’ID richiesta esatto dopo aver verificato i dettagli.

Nota: se un dispositivo ritenta l’associazione con dettagli di autenticazione cambiati (ruolo/scope/chiave pubblica), OpenClaw sostituisce la precedente voce in sospeso ed emette un nuovo
`requestId`. Esegui `openclaw devices list` subito prima dell’approvazione per usare l’ID corrente.

Se il dispositivo è già associato e richiede scope più ampi o un ruolo più ampio,
OpenClaw mantiene l’approvazione esistente e crea una nuova richiesta di upgrade
in sospeso. Controlla le colonne `Requested` e `Approved` in `openclaw devices list`
oppure usa `openclaw devices approve --latest` per visualizzare in anteprima l’upgrade esatto prima di approvarlo.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

Rifiuta una richiesta di associazione dispositivo in sospeso.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Ruota un token di dispositivo per un ruolo specifico (aggiornando facoltativamente gli scope).
Il ruolo di destinazione deve già esistere nel contratto di associazione approvato di quel dispositivo;
la rotazione non può generare un nuovo ruolo non approvato.
Se ometti `--scope`, le riconnessioni successive con il token ruotato memorizzato riutilizzano gli
scope approvati in cache di quel token. Se passi valori `--scope` espliciti, questi
diventano l’insieme di scope memorizzato per le future riconnessioni con token in cache.
I chiamanti non admin con dispositivo associato possono ruotare solo **il proprio**
token di dispositivo. Inoltre, tutti i valori `--scope` espliciti devono restare entro gli
scope operatore della sessione del chiamante; la rotazione non può generare un token operatore
più ampio di quello che il chiamante già possiede.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Restituisce il nuovo payload del token come JSON.

### `openclaw devices revoke --device <id> --role <role>`

Revoca un token di dispositivo per un ruolo specifico.

I chiamanti non admin con dispositivo associato possono revocare solo **il proprio** token di dispositivo.
La revoca del token di un altro dispositivo richiede `operator.admin`.

```
openclaw devices revoke --device <deviceId> --role node
```

Restituisce il risultato della revoca come JSON.

## Opzioni comuni

- `--url <url>`: URL WebSocket del Gateway (usa come predefinito `gateway.remote.url` quando configurato).
- `--token <token>`: token del Gateway (se richiesto).
- `--password <password>`: password del Gateway (autenticazione con password).
- `--timeout <ms>`: timeout RPC.
- `--json`: output JSON (consigliato per gli script).

Nota: quando imposti `--url`, la CLI non usa credenziali di fallback da configurazione o ambiente.
Passa `--token` oppure `--password` esplicitamente. L’assenza di credenziali esplicite è un errore.

## Note

- La rotazione del token restituisce un nuovo token (sensibile). Trattalo come un segreto.
- Questi comandi richiedono lo scope `operator.pairing` (oppure `operator.admin`).
- La rotazione del token resta all’interno dell’insieme di ruoli di associazione approvati e della baseline di scope approvati
  per quel dispositivo. Una voce di token in cache fuori posto non concede un nuovo
  obiettivo di rotazione.
- Per le sessioni con token di dispositivo associato, la gestione tra dispositivi è solo admin:
  `remove`, `rotate` e `revoke` sono consentiti solo su sé stessi a meno che il chiamante non abbia
  `operator.admin`.
- `devices clear` è intenzionalmente protetto da `--yes`.
- Se lo scope pairing non è disponibile su local loopback (e non viene passato `--url` esplicito), list/approve può usare un fallback pairing locale.
- `devices approve` richiede un ID richiesta esplicito prima di generare token; omettere `requestId` o passare `--latest` mostra solo in anteprima la richiesta in sospeso più recente.

## Checklist di recupero da deriva del token

Usala quando Control UI o altri client continuano a fallire con `AUTH_TOKEN_MISMATCH` o `AUTH_DEVICE_TOKEN_MISMATCH`.

1. Conferma la sorgente del token del gateway corrente:

```bash
openclaw config get gateway.auth.token
```

2. Elenca i dispositivi associati e identifica l’ID del dispositivo interessato:

```bash
openclaw devices list
```

3. Ruota il token operatore per il dispositivo interessato:

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. Se la rotazione non basta, rimuovi l’associazione obsoleta e approva di nuovo:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. Riprova la connessione del client con il token/password condiviso corrente.

Note:

- La precedenza normale di autenticazione in riconnessione è prima token/password condiviso esplicito, poi `deviceToken` esplicito, poi token di dispositivo memorizzato, poi token bootstrap.
- Il recupero attendibile da `AUTH_TOKEN_MISMATCH` può inviare temporaneamente insieme sia il token condiviso sia il token di dispositivo memorizzato per quell’unico retry limitato.

Correlati:

- [Risoluzione dei problemi di autenticazione della dashboard](/it/web/dashboard#if-you-see-unauthorized-1008)
- [Risoluzione dei problemi del gateway](/it/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Correlati

- [Riferimento CLI](/it/cli)
- [Node](/it/nodes)
