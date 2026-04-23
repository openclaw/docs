---
read_when:
    - Stai approvando richieste di pairing del dispositivo
    - Devi ruotare o revocare i token del dispositivo
summary: Riferimento CLI per `openclaw devices` (pairing del dispositivo + rotazione/revoca del token)
title: dispositivi
x-i18n:
    generated_at: "2026-04-23T08:26:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8e58d2dff7fc22a11ff372f4937907977dab0ffa9f971b9c0bffeb3e347caf66
    source_path: cli/devices.md
    workflow: 15
---

# `openclaw devices`

Gestisci richieste di pairing dei dispositivi e token con ambito dispositivo.

## Comandi

### `openclaw devices list`

Elenca le richieste di pairing in attesa e i dispositivi associati.

```
openclaw devices list
openclaw devices list --json
```

L’output delle richieste in attesa mostra l’accesso richiesto accanto all’accesso
attualmente approvato del dispositivo quando il dispositivo è già associato. In questo modo gli upgrade di ambito/ruolo risultano espliciti invece di sembrare una perdita del pairing.

### `openclaw devices remove <deviceId>`

Rimuovi una voce di un dispositivo associato.

Quando sei autenticato con un token di dispositivo associato, i chiamanti non admin possono
rimuovere solo **la propria** voce dispositivo. Per rimuovere un altro dispositivo è richiesto
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

Approva una richiesta di pairing del dispositivo in attesa tramite `requestId` esatto. Se `requestId`
viene omesso o viene passato `--latest`, OpenClaw stampa solo la richiesta in attesa selezionata
ed esce; riesegui l’approvazione con l’ID richiesta esatto dopo aver verificato i dettagli.

Nota: se un dispositivo ritenta il pairing con dettagli di autenticazione cambiati (ruolo/ambiti/chiave pubblica), OpenClaw sostituisce la precedente voce in attesa ed emette un nuovo
`requestId`. Esegui `openclaw devices list` subito prima dell’approvazione per usare l’ID corrente.

Se il dispositivo è già associato e richiede ambiti più ampi o un ruolo più ampio,
OpenClaw mantiene l’approvazione esistente e crea una nuova richiesta di upgrade in attesa.
Controlla le colonne `Requested` e `Approved` in `openclaw devices list`
oppure usa `openclaw devices approve --latest` per vedere in anteprima l’upgrade esatto prima
di approvarlo.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

Rifiuta una richiesta di pairing del dispositivo in attesa.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Ruota un token dispositivo per un ruolo specifico, aggiornando facoltativamente gli ambiti.
Il ruolo di destinazione deve già esistere nel contratto di pairing approvato di quel dispositivo;
la rotazione non può emettere un nuovo ruolo non approvato.
Se ometti `--scope`, le riconnessioni successive con il token ruotato memorizzato riutilizzano gli ambiti approvati in cache di quel token. Se passi valori `--scope` espliciti, questi
diventano l’insieme di ambiti memorizzato per le future riconnessioni con token in cache.
I chiamanti non admin con dispositivo associato possono ruotare solo **il proprio** token dispositivo.
Inoltre, eventuali valori `--scope` espliciti devono restare entro gli ambiti operator del chiamante stesso;
la rotazione non può emettere un token operator più ampio di quello che il chiamante possiede già.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Restituisce il nuovo payload del token come JSON.

### `openclaw devices revoke --device <id> --role <role>`

Revoca un token dispositivo per un ruolo specifico.

I chiamanti non admin con dispositivo associato possono revocare solo **il proprio** token dispositivo.
Per revocare il token di un altro dispositivo è richiesto `operator.admin`.

```
openclaw devices revoke --device <deviceId> --role node
```

Restituisce il risultato della revoca come JSON.

## Opzioni comuni

- `--url <url>`: URL WebSocket del Gateway (usa come predefinito `gateway.remote.url` quando configurato).
- `--token <token>`: token del Gateway (se richiesto).
- `--password <password>`: password del Gateway (autenticazione con password).
- `--timeout <ms>`: timeout RPC.
- `--json`: output JSON (consigliato per lo scripting).

Nota: quando imposti `--url`, la CLI non usa il fallback alle credenziali di configurazione o ambiente.
Passa `--token` o `--password` esplicitamente. La mancanza di credenziali esplicite è un errore.

## Note

- La rotazione del token restituisce un nuovo token (sensibile). Trattalo come un segreto.
- Questi comandi richiedono l’ambito `operator.pairing` (o `operator.admin`).
- La rotazione del token resta all’interno dell’insieme di ruoli approvati nel pairing e della baseline di ambiti approvati per quel dispositivo. Una voce di token in cache non prevista non concede un nuovo target di rotazione.
- Per le sessioni con token di dispositivo associato, la gestione tra dispositivi è riservata agli admin:
  `remove`, `rotate` e `revoke` sono consentiti solo su sé stessi a meno che il chiamante non abbia
  `operator.admin`.
- `devices clear` è intenzionalmente protetto da `--yes`.
- Se l’ambito pairing non è disponibile su local loopback (e non viene passato `--url` esplicito), `list`/`approve` possono usare un fallback di pairing locale.
- `devices approve` richiede un ID richiesta esplicito prima di emettere token; omettere `requestId` o passare `--latest` mostra solo in anteprima la richiesta in attesa più recente.

## Checklist di recupero da drift del token

Usa questa procedura quando Control UI o altri client continuano a fallire con `AUTH_TOKEN_MISMATCH` o `AUTH_DEVICE_TOKEN_MISMATCH`.

1. Conferma la sorgente corrente del token del Gateway:

```bash
openclaw config get gateway.auth.token
```

2. Elenca i dispositivi associati e identifica l’ID del dispositivo interessato:

```bash
openclaw devices list
```

3. Ruota il token operator per il dispositivo interessato:

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

- La normale precedenza di autenticazione in riconnessione è prima token/password condiviso esplicito, poi `deviceToken` esplicito, poi token dispositivo memorizzato, poi bootstrap token.
- Il recupero affidabile da `AUTH_TOKEN_MISMATCH` può inviare temporaneamente insieme sia il token condiviso sia il token dispositivo memorizzato per quell’unico tentativo delimitato.

Correlati:

- [Risoluzione dei problemi di autenticazione Dashboard](/it/web/dashboard#if-you-see-unauthorized-1008)
- [Risoluzione dei problemi Gateway](/it/gateway/troubleshooting#dashboard-control-ui-connectivity)
