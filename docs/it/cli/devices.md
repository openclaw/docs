---
read_when:
    - Stai approvando richieste di associazione dei dispositivi
    - È necessario ruotare o revocare i token dei dispositivi
summary: Riferimento CLI per `openclaw devices` (associazione del dispositivo + rotazione/revoca del token)
title: Dispositivi
x-i18n:
    generated_at: "2026-05-03T21:28:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: fa92fd3ffc671c827fa98870bf9df89f3be90adec167fd8ea32698cf2e69991a
    source_path: cli/devices.md
    workflow: 16
---

# `openclaw devices`

Gestisci le richieste di associazione dei dispositivi e i token con ambito dispositivo.

## Comandi

### `openclaw devices list`

Elenca le richieste di associazione in sospeso e i dispositivi associati.

```
openclaw devices list
openclaw devices list --json
```

L'output delle richieste in sospeso mostra l'accesso richiesto accanto all'accesso
attualmente approvato del dispositivo quando il dispositivo è già associato. Questo rende gli
upgrade di ambito/ruolo espliciti invece di far sembrare che l'associazione sia stata persa.

### `openclaw devices remove <deviceId>`

Rimuovi una voce di dispositivo associato.

Quando sei autenticato con un token di dispositivo associato, i chiamanti non amministratori possono
rimuovere solo la voce del **proprio** dispositivo. La rimozione di un altro dispositivo richiede
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
viene omesso o viene passato `--latest`, OpenClaw stampa solo la richiesta in sospeso
selezionata ed esce; riesegui l'approvazione con l'ID richiesta esatto dopo aver verificato
i dettagli.

<Note>
Se un dispositivo ritenta l'associazione con dettagli di autenticazione modificati (ruolo, ambiti o chiave pubblica), OpenClaw sostituisce la voce in sospeso precedente ed emette un nuovo `requestId`. Esegui `openclaw devices list` subito prima dell'approvazione per usare l'ID corrente.
</Note>

Se il dispositivo è già associato e richiede ambiti più ampi o un ruolo più ampio,
OpenClaw mantiene l'approvazione esistente e crea una nuova richiesta di upgrade
in sospeso. Controlla le colonne `Requested` e `Approved` in `openclaw devices list`
oppure usa `openclaw devices approve --latest` per vedere in anteprima l'upgrade esatto prima di
approvarlo.

Se il Gateway è configurato esplicitamente con
`gateway.nodes.pairing.autoApproveCidrs`, le prime richieste `role: node` da
IP client corrispondenti possono essere approvate prima che compaiano in questo elenco. Questa policy
è disabilitata per impostazione predefinita e non si applica mai ai client operatore/browser o alle richieste di upgrade.

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

Ruota un token dispositivo per un ruolo specifico (eventualmente aggiornando gli ambiti).
Il ruolo di destinazione deve già esistere nel contratto di associazione approvato di quel dispositivo;
la rotazione non può creare un nuovo ruolo non approvato.
Se ometti `--scope`, le riconnessioni successive con il token ruotato memorizzato riutilizzano gli
ambiti approvati memorizzati nella cache di quel token. Se passi valori `--scope` espliciti, questi
diventano l'insieme di ambiti memorizzato per le riconnessioni future con token memorizzato nella cache.
I chiamanti con dispositivo associato non amministratori possono ruotare solo il token del **proprio** dispositivo.
L'insieme di ambiti del token di destinazione deve rimanere entro gli ambiti operatore della sessione del
chiamante; la rotazione non può creare o preservare un token operatore più ampio di quello che il
chiamante possiede già.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Restituisce i metadati di rotazione come JSON. Se il chiamante sta ruotando il proprio token mentre
è autenticato con quel token dispositivo, la risposta include anche il token sostitutivo
così che il client possa conservarlo prima della riconnessione. Le rotazioni condivise/amministrative
non riportano il bearer token.

### `openclaw devices revoke --device <id> --role <role>`

Revoca un token dispositivo per un ruolo specifico.

I chiamanti con dispositivo associato non amministratori possono revocare solo il token del **proprio** dispositivo.
La revoca del token di un altro dispositivo richiede `operator.admin`.
Anche l'insieme di ambiti del token di destinazione deve rientrare negli ambiti operatore della
sessione del chiamante; i chiamanti solo associazione non possono revocare token operatore admin/write.

```
openclaw devices revoke --device <deviceId> --role node
```

Restituisce il risultato della revoca come JSON.

## Opzioni comuni

- `--url <url>`: URL WebSocket del Gateway (predefinito a `gateway.remote.url` quando configurato).
- `--token <token>`: token del Gateway (se richiesto).
- `--password <password>`: password del Gateway (autenticazione con password).
- `--timeout <ms>`: timeout RPC.
- `--json`: output JSON (consigliato per gli script).

<Warning>
Quando imposti `--url`, la CLI non ricorre alle credenziali di configurazione o di ambiente. Passa `--token` o `--password` esplicitamente. Le credenziali esplicite mancanti sono un errore.
</Warning>

## Note

- La rotazione del token restituisce un nuovo token (sensibile). Trattalo come un segreto.
- Questi comandi richiedono l'ambito `operator.pairing` (o `operator.admin`). Alcune
  approvazioni richiedono anche che il chiamante possieda gli ambiti operatore che il dispositivo
  di destinazione creerebbe o erediterebbe; vedi [Ambiti operatore](/it/gateway/operator-scopes).
- `gateway.nodes.pairing.autoApproveCidrs` è una policy Gateway facoltativa solo per
  l'associazione di nuovi dispositivi node; non modifica l'autorità di approvazione della CLI.
- Rotazione e revoca dei token restano all'interno dell'insieme di ruoli di associazione approvati e
  della baseline di ambiti approvati per quel dispositivo. Una voce di token memorizzata nella cache anomala non
  concede un target di gestione token.
- Per le sessioni con token di dispositivo associato, la gestione tra dispositivi è riservata agli amministratori:
  `remove`, `rotate` e `revoke` sono limitati al proprio dispositivo salvo che il chiamante abbia
  `operator.admin`.
- Anche la mutazione del token è contenuta dagli ambiti del chiamante: una sessione solo associazione non può
  ruotare o revocare un token che attualmente include `operator.admin` o
  `operator.write`.
- `devices clear` è intenzionalmente protetto da `--yes`.
- Se l'ambito di associazione non è disponibile su local loopback (e non viene passato alcun `--url` esplicito), list/approve può usare un fallback di associazione locale.
- `devices approve` richiede un ID richiesta esplicito prima di creare token; omettere `requestId` o passare `--latest` mostra solo un'anteprima della richiesta in sospeso più recente.

## Checklist di ripristino della deriva dei token

Usala quando Control UI o altri client continuano a fallire con `AUTH_TOKEN_MISMATCH` o `AUTH_DEVICE_TOKEN_MISMATCH`.

1. Conferma l'origine corrente del token del Gateway:

```bash
openclaw config get gateway.auth.token
```

2. Elenca i dispositivi associati e identifica l'id del dispositivo interessato:

```bash
openclaw devices list
```

3. Ruota il token operatore per il dispositivo interessato:

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. Se la rotazione non basta, rimuovi l'associazione obsoleta e approva di nuovo:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. Riprova la connessione del client con il token/password condiviso corrente.

Note:

- La normale precedenza dell'autenticazione alla riconnessione è prima token/password condiviso esplicito, poi `deviceToken` esplicito, poi token dispositivo memorizzato, poi token di bootstrap.
- Il ripristino `AUTH_TOKEN_MISMATCH` attendibile può inviare temporaneamente sia il token condiviso sia il token dispositivo memorizzato insieme per l'unico nuovo tentativo limitato.

Correlati:

- [Risoluzione dei problemi di autenticazione della dashboard](/it/web/dashboard#if-you-see-unauthorized-1008)
- [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Correlati

- [Riferimento CLI](/it/cli)
- [Nodes](/it/nodes)
