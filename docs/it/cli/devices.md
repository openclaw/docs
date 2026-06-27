---
read_when:
    - Stai approvando le richieste di associazione del dispositivo
    - Devi ruotare o revocare i token dei dispositivi
summary: Riferimento CLI per `openclaw devices` (associazione del dispositivo + rotazione/revoca dei token)
title: Dispositivi
x-i18n:
    generated_at: "2026-06-27T17:18:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08d6945af4fa2403a97dfec94af7bbd0dc746efe90d3e5b4c9f5c5d6d27d70a4
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
attualmente approvato del dispositivo quando il dispositivo è già associato. Questo rende espliciti gli
upgrade di ambito/ruolo invece di farli sembrare come se l'associazione fosse stata persa.

### `openclaw devices remove <deviceId>`

Rimuove una voce di dispositivo associato.

Quando sei autenticato con un token di dispositivo associato, i chiamanti non amministratori possono
rimuovere solo la voce del dispositivo **proprio**. Rimuovere un altro dispositivo richiede
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
oppure usa `openclaw devices approve --latest` per visualizzare in anteprima l'upgrade esatto prima
di approvarlo.

Se il Gateway è configurato esplicitamente con
`gateway.nodes.pairing.autoApproveCidrs`, le prime richieste `role: node` da IP
client corrispondenti possono essere approvate prima che compaiano in questo elenco. Questa policy
è disabilitata per impostazione predefinita e non si applica mai ai client operatore/browser o alle richieste di upgrade.

L'approvazione di ruoli dispositivo node o altri ruoli non operatore richiede `operator.admin`.
`operator.pairing` è sufficiente per le approvazioni dei dispositivi operatore solo quando gli
ambiti operatore richiesti restano entro gli ambiti propri del chiamante. Vedi
[Ambiti operatore](/it/gateway/operator-scopes) per i controlli al momento dell'approvazione.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

## Approvazione al primo avvio di Paperclip / `openclaw_gateway`

Quando un nuovo agente Paperclip si connette per la prima volta tramite l'adapter `openclaw_gateway`, il Gateway può richiedere un'approvazione una tantum dell'associazione del dispositivo prima che le esecuzioni possano riuscire. Se Paperclip segnala `openclaw_gateway_pairing_required`, approva il dispositivo in sospeso e riprova.

Per i gateway locali, visualizza in anteprima l'ultima richiesta in sospeso:

```bash
openclaw devices approve --latest
```

L'anteprima stampa il comando `openclaw devices approve <requestId>` esatto. Verifica i dettagli della richiesta, quindi riesegui quel comando con l'ID richiesta per approvarla.

Per gateway remoti o credenziali esplicite, passa le stesse opzioni durante l'anteprima e l'approvazione:

```bash
openclaw devices approve --latest --url <gateway-ws-url> --token <gateway-token>
```

Per evitare di riapprovare dopo i riavvii, mantieni una chiave dispositivo persistente nella configurazione dell'adapter Paperclip invece di generare una nuova identità effimera a ogni esecuzione:

```json
{
  "adapterConfig": {
    "devicePrivateKeyPem": "<ed25519-private-key-pkcs8-pem>"
  }
}
```

Se l'approvazione continua a fallire, esegui prima `openclaw devices list` per confermare che esista una richiesta in sospeso.

### `openclaw devices reject <requestId>`

Rifiuta una richiesta di associazione dispositivo in sospeso.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Ruota un token dispositivo per un ruolo specifico (aggiornando facoltativamente gli ambiti).
Il ruolo di destinazione deve già esistere nel contratto di associazione approvato di quel dispositivo;
la rotazione non può emettere un nuovo ruolo non approvato.
Se ometti `--scope`, le riconnessioni successive con il token ruotato memorizzato riutilizzano gli
ambiti approvati nella cache di quel token. Se passi valori `--scope` espliciti, questi
diventano l'insieme di ambiti memorizzato per le riconnessioni future con token nella cache.
I chiamanti con dispositivo associato non amministratori possono ruotare solo il token del dispositivo **proprio**.
L'insieme di ambiti del token di destinazione deve restare entro gli ambiti operatore propri della sessione
del chiamante; la rotazione non può emettere o preservare un token operatore più ampio di quello che il
chiamante ha già.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Restituisce i metadati di rotazione come JSON. Se il chiamante sta ruotando il proprio token mentre
è autenticato con quel token dispositivo, la risposta include anche il token sostitutivo
così il client può conservarlo prima di riconnettersi. Le rotazioni condivise/admin
non restituiscono il token bearer.

### `openclaw devices revoke --device <id> --role <role>`

Revoca un token dispositivo per un ruolo specifico.

I chiamanti con dispositivo associato non amministratori possono revocare solo il token del dispositivo **proprio**.
Revocare il token di un altro dispositivo richiede `operator.admin`.
Anche l'insieme di ambiti del token di destinazione deve rientrare negli ambiti
operatore propri della sessione del chiamante; i chiamanti solo per associazione non possono revocare token operatore admin/write.

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
Quando imposti `--url`, la CLI non ripiega su configurazione o credenziali dell'ambiente. Passa `--token` o `--password` esplicitamente. La mancanza di credenziali esplicite è un errore.
</Warning>

## Note

- La rotazione del token restituisce un nuovo token (sensibile). Trattalo come un segreto.
- Questi comandi richiedono l'ambito `operator.pairing` (o `operator.admin`). Alcune
  approvazioni richiedono anche che il chiamante disponga degli ambiti operatore che il
  dispositivo di destinazione emetterebbe o erediterebbe. I ruoli dispositivo non operatore richiedono
  `operator.admin`; vedi [Ambiti operatore](/it/gateway/operator-scopes).
- `gateway.nodes.pairing.autoApproveCidrs` è una policy Gateway opt-in solo per
  l'associazione di nuovi dispositivi node; non modifica l'autorità di approvazione della CLI.
- La rotazione e la revoca dei token restano all'interno dell'insieme di ruoli di associazione approvato e
  della baseline degli ambiti approvati per quel dispositivo. Una voce di token nella cache fuori posto non
  concede un obiettivo di gestione token.
- Per le sessioni con token di dispositivo associato, la gestione tra dispositivi è riservata agli amministratori:
  `remove`, `rotate` e `revoke` sono limitati a sé stessi a meno che il chiamante abbia
  `operator.admin`.
- Anche la mutazione dei token è contenuta dagli ambiti del chiamante: una sessione solo per associazione non può
  ruotare o revocare un token che attualmente porta `operator.admin` o
  `operator.write`.
- `devices clear` è intenzionalmente vincolato da `--yes`.
- Se l'ambito di associazione non è disponibile su local loopback (e non viene passato alcun `--url` esplicito), list/approve può usare un fallback di associazione locale.
- `devices approve` richiede un ID richiesta esplicito prima di emettere token; omettere `requestId` o passare `--latest` mostra solo l'anteprima della richiesta in sospeso più recente.

## Checklist di recupero dal disallineamento dei token

Usala quando Control UI o altri client continuano a fallire con `AUTH_TOKEN_MISMATCH`, `AUTH_DEVICE_TOKEN_MISMATCH` o `AUTH_SCOPE_MISMATCH`.

1. Conferma l'origine corrente del token gateway:

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

4. Se la rotazione non è sufficiente, rimuovi l'associazione obsoleta e approva di nuovo:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. Riprova la connessione del client con il token/password condiviso corrente.

Note:

- La normale precedenza di autenticazione alla riconnessione è prima token/password condiviso esplicito, poi `deviceToken` esplicito, poi token dispositivo memorizzato, poi token bootstrap.
- Il recupero attendibile da `AUTH_TOKEN_MISMATCH` può inviare temporaneamente insieme sia il token condiviso sia il token dispositivo memorizzato per l'unico nuovo tentativo limitato.
- `AUTH_SCOPE_MISMATCH` significa che il token dispositivo è stato riconosciuto ma non porta l'insieme di ambiti richiesto; correggi il contratto di approvazione di associazione/ambito prima di cambiare l'autenticazione gateway condivisa.

Correlati:

- [Risoluzione dei problemi di autenticazione Dashboard](/it/web/dashboard#if-you-see-unauthorized-1008)
- [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Correlati

- [Riferimento CLI](/it/cli)
- [Nodi](/it/nodes)
