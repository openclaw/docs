---
read_when:
    - Configurazione di Mattermost
    - Debug del routing di Mattermost
summary: Configurazione del bot Mattermost e configurazione di OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-04-23T08:23:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9421ae903caed5c9dc3b19ca8558725f11bbe553a20bd4d3f0fb6e7eecccd92
    source_path: channels/mattermost.md
    workflow: 15
---

# Mattermost

Stato: plugin incluso (token bot + eventi WebSocket). Sono supportati canali, gruppi e DM.
Mattermost è una piattaforma di messaggistica per team self-hostable; consulta il sito ufficiale su
[mattermost.com](https://mattermost.com) per dettagli sul prodotto e download.

## Plugin incluso

Mattermost è distribuito come plugin incluso nelle attuali release di OpenClaw, quindi le normali
build pacchettizzate non richiedono un'installazione separata.

Se stai usando una build meno recente o un'installazione personalizzata che esclude Mattermost,
installalo manualmente:

Installa tramite CLI (registro npm):

```bash
openclaw plugins install @openclaw/mattermost
```

Checkout locale (quando esegui da un repository git):

```bash
openclaw plugins install ./path/to/local/mattermost-plugin
```

Dettagli: [Plugin](/it/tools/plugin)

## Configurazione rapida

1. Assicurati che il plugin Mattermost sia disponibile.
   - Le attuali release pacchettizzate di OpenClaw lo includono già.
   - Le installazioni meno recenti/personalizzate possono aggiungerlo manualmente con i comandi sopra.
2. Crea un account bot Mattermost e copia il **token bot**.
3. Copia l'**URL di base** di Mattermost (ad esempio, `https://chat.example.com`).
4. Configura OpenClaw e avvia il Gateway.

Configurazione minima:

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
    },
  },
}
```

## Comandi slash nativi

I comandi slash nativi sono opzionali. Quando sono abilitati, OpenClaw registra i comandi slash `oc_*` tramite
l'API Mattermost e riceve callback POST sul server HTTP del Gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Usare quando Mattermost non può raggiungere direttamente il gateway (reverse proxy/URL pubblico).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

Note:

- `native: "auto"` per impostazione predefinita è disabilitato per Mattermost. Imposta `native: true` per abilitarlo.
- Se `callbackUrl` viene omesso, OpenClaw ne deriva uno da host/porta del gateway + `callbackPath`.
- Per configurazioni multi-account, `commands` può essere impostato al livello superiore oppure sotto
  `channels.mattermost.accounts.<id>.commands` (i valori dell'account sovrascrivono i campi di livello superiore).
- Le callback dei comandi vengono validate con i token per comando restituiti da
  Mattermost quando OpenClaw registra i comandi `oc_*`.
- Le callback slash falliscono in modalità chiusa se la registrazione non è riuscita, l'avvio è stato parziale oppure
  il token della callback non corrisponde a uno dei comandi registrati.
- Requisito di raggiungibilità: l'endpoint di callback deve essere raggiungibile dal server Mattermost.
  - Non impostare `callbackUrl` su `localhost` a meno che Mattermost non sia eseguito sullo stesso host/spazio dei nomi di rete di OpenClaw.
  - Non impostare `callbackUrl` sul tuo URL di base Mattermost a meno che quell'URL non faccia reverse proxy di `/api/channels/mattermost/command` verso OpenClaw.
  - Un controllo rapido è `curl https://<gateway-host>/api/channels/mattermost/command`; una richiesta GET dovrebbe restituire `405 Method Not Allowed` da OpenClaw, non `404`.
- Requisito allowlist di uscita di Mattermost:
  - Se la callback punta ad indirizzi privati/tailnet/interni, imposta Mattermost
    `ServiceSettings.AllowedUntrustedInternalConnections` in modo che includa l'host/dominio della callback.
  - Usa voci host/dominio, non URL completi.
    - Corretto: `gateway.tailnet-name.ts.net`
    - Errato: `https://gateway.tailnet-name.ts.net`

## Variabili d'ambiente (account predefinito)

Imposta queste sul host del gateway se preferisci usare variabili d'ambiente:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

Le variabili d'ambiente si applicano solo all'account **predefinito** (`default`). Gli altri account devono usare valori di configurazione.

`MATTERMOST_URL` non può essere impostato da un `.env` dello spazio di lavoro; vedi [file `.env` dello spazio di lavoro](/it/gateway/security).

## Modalità chat

Mattermost risponde automaticamente ai DM. Il comportamento nei canali è controllato da `chatmode`:

- `oncall` (predefinito): risponde nei canali solo quando viene menzionato con @.
- `onmessage`: risponde a ogni messaggio del canale.
- `onchar`: risponde quando un messaggio inizia con un prefisso trigger.

Esempio di configurazione:

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"],
    },
  },
}
```

Note:

- `onchar` risponde comunque alle menzioni @ esplicite.
- `channels.mattermost.requireMention` viene rispettato per le configurazioni legacy, ma è preferibile `chatmode`.

## Thread e sessioni

Usa `channels.mattermost.replyToMode` per controllare se le risposte nei canali e nei gruppi restano nel
canale principale oppure avviano un thread sotto il post che le ha attivate.

- `off` (predefinito): risponde in un thread solo quando il post in ingresso è già in uno.
- `first`: per i post di canale/gruppo di primo livello, avvia un thread sotto quel post e instrada la
  conversazione verso una sessione con ambito del thread.
- `all`: oggi per Mattermost ha lo stesso comportamento di `first`.
- I messaggi diretti ignorano questa impostazione e restano senza thread.

Esempio di configurazione:

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
    },
  },
}
```

Note:

- Le sessioni con ambito del thread usano l'id del post attivante come radice del thread.
- `first` e `all` sono attualmente equivalenti perché una volta che Mattermost ha una radice del thread,
  i chunk successivi e i contenuti multimediali continuano nello stesso thread.

## Controllo degli accessi (DM)

- Predefinito: `channels.mattermost.dmPolicy = "pairing"` (i mittenti sconosciuti ricevono un codice di pairing).
- Approva tramite:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- DM pubblici: `channels.mattermost.dmPolicy="open"` più `channels.mattermost.allowFrom=["*"]`.

## Canali (gruppi)

- Predefinito: `channels.mattermost.groupPolicy = "allowlist"` (vincolato alla menzione).
- Aggiungi mittenti alla allowlist con `channels.mattermost.groupAllowFrom` (si consigliano gli ID utente).
- Le sovrascritture di menzione per canale si trovano sotto `channels.mattermost.groups.<channelId>.requireMention`
  oppure `channels.mattermost.groups["*"].requireMention` per un valore predefinito.
- La corrispondenza `@username` è mutabile ed è abilitata solo quando `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Canali aperti: `channels.mattermost.groupPolicy="open"` (vincolato alla menzione).
- Nota di runtime: se `channels.mattermost` è completamente assente, il runtime torna a `groupPolicy="allowlist"` per i controlli di gruppo (anche se è impostato `channels.defaults.groupPolicy`).

Esempio:

```json5
{
  channels: {
    mattermost: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
    },
  },
}
```

## Destinazioni per la consegna in uscita

Usa questi formati di destinazione con `openclaw message send` o cron/webhook:

- `channel:<id>` per un canale
- `user:<id>` per un DM
- `@username` per un DM (risolto tramite l'API Mattermost)

Gli ID opachi senza prefisso (come `64ifufp...`) sono **ambigui** in Mattermost (ID utente vs ID canale).

OpenClaw li risolve dando **priorità all'utente**:

- Se l'ID esiste come utente (`GET /api/v4/users/<id>` riesce), OpenClaw invia un **DM** risolvendo il canale diretto tramite `/api/v4/channels/direct`.
- Altrimenti l'ID viene trattato come **ID canale**.

Se hai bisogno di un comportamento deterministico, usa sempre i prefissi espliciti (`user:<id>` / `channel:<id>`).

## Riprova del canale DM

Quando OpenClaw invia a una destinazione DM Mattermost e deve prima risolvere il canale diretto,
per impostazione predefinita ritenta i fallimenti transitori nella creazione del canale diretto.

Usa `channels.mattermost.dmChannelRetry` per regolare questo comportamento globalmente per il plugin Mattermost,
oppure `channels.mattermost.accounts.<id>.dmChannelRetry` per un singolo account.

```json5
{
  channels: {
    mattermost: {
      dmChannelRetry: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        timeoutMs: 30000,
      },
    },
  },
}
```

Note:

- Questo si applica solo alla creazione del canale DM (`/api/v4/channels/direct`), non a ogni chiamata API Mattermost.
- I tentativi si applicano a fallimenti transitori come limiti di frequenza, risposte 5xx ed errori di rete o timeout.
- Gli errori client 4xx diversi da `429` vengono trattati come permanenti e non vengono ritentati.

## Streaming di anteprima

Mattermost trasmette il ragionamento, l'attività degli strumenti e il testo parziale della risposta in un singolo **post di anteprima bozza** che viene finalizzato sul posto quando la risposta finale può essere inviata in sicurezza. L'anteprima si aggiorna sullo stesso id del post invece di riempire il canale con messaggi per chunk. I finali multimediali/di errore annullano le modifiche di anteprima in sospeso e usano la consegna normale invece di svuotare un post di anteprima usa e getta.

Abilita tramite `channels.mattermost.streaming`:

```json5
{
  channels: {
    mattermost: {
      streaming: "partial", // off | partial | block | progress
    },
  },
}
```

Note:

- `partial` è la scelta abituale: un post di anteprima che viene modificato man mano che la risposta cresce, poi finalizzato con la risposta completa.
- `block` usa chunk bozza in stile append all'interno del post di anteprima.
- `progress` mostra un'anteprima di stato durante la generazione e pubblica la risposta finale solo al completamento.
- `off` disabilita lo streaming di anteprima.
- Se il flusso non può essere finalizzato sul posto (ad esempio il post è stato eliminato a metà del flusso), OpenClaw torna a inviare un nuovo post finale così la risposta non va mai persa.
- I payload di solo ragionamento vengono soppressi dai post del canale, incluso il testo che arriva come blockquote `> Reasoning:`. Imposta `/reasoning on` per vedere il ragionamento in altre superfici; il post finale Mattermost mantiene solo la risposta.
- Vedi [Streaming](/it/concepts/streaming#preview-streaming-modes) per la matrice di mappatura dei canali.

## Reazioni (strumento messaggio)

- Usa `message action=react` con `channel=mattermost`.
- `messageId` è l'id del post Mattermost.
- `emoji` accetta nomi come `thumbsup` o `:+1:` (i due punti sono facoltativi).
- Imposta `remove=true` (booleano) per rimuovere una reazione.
- Gli eventi di aggiunta/rimozione reazione vengono inoltrati come eventi di sistema alla sessione agente instradata.

Esempi:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Configurazione:

- `channels.mattermost.actions.reactions`: abilita/disabilita le azioni di reazione (predefinito true).
- Sovrascrittura per account: `channels.mattermost.accounts.<id>.actions.reactions`.

## Pulsanti interattivi (strumento messaggio)

Invia messaggi con pulsanti cliccabili. Quando un utente fa clic su un pulsante, l'agente riceve la
selezione e può rispondere.

Abilita i pulsanti aggiungendo `inlineButtons` alle capacità del canale:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

Usa `message action=send` con un parametro `buttons`. I pulsanti sono un array 2D (righe di pulsanti):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

Campi del pulsante:

- `text` (obbligatorio): etichetta visualizzata.
- `callback_data` (obbligatorio): valore reinviato al clic (usato come ID azione).
- `style` (facoltativo): `"default"`, `"primary"` o `"danger"`.

Quando un utente fa clic su un pulsante:

1. Tutti i pulsanti vengono sostituiti con una riga di conferma (ad esempio, "✓ **Yes** selected by @user").
2. L'agente riceve la selezione come messaggio in ingresso e risponde.

Note:

- Le callback dei pulsanti usano la verifica HMAC-SHA256 (automatica, nessuna configurazione necessaria).
- Mattermost rimuove i dati di callback dalle proprie risposte API (funzionalità di sicurezza), quindi tutti i pulsanti
  vengono rimossi al clic — la rimozione parziale non è possibile.
- Gli ID azione che contengono trattini o underscore vengono sanificati automaticamente
  (limitazione del routing Mattermost).

Configurazione:

- `channels.mattermost.capabilities`: array di stringhe di capacità. Aggiungi `"inlineButtons"` per
  abilitare la descrizione dello strumento pulsanti nel prompt di sistema dell'agente.
- `channels.mattermost.interactions.callbackBaseUrl`: URL di base esterno facoltativo per le callback
  dei pulsanti (ad esempio `https://gateway.example.com`). Usalo quando Mattermost non può
  raggiungere direttamente il gateway sul suo host di bind.
- Nelle configurazioni multi-account, puoi anche impostare lo stesso campo sotto
  `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
- Se `interactions.callbackBaseUrl` viene omesso, OpenClaw deriva l'URL di callback da
  `gateway.customBindHost` + `gateway.port`, poi usa come fallback `http://localhost:<port>`.
- Regola di raggiungibilità: l'URL di callback dei pulsanti deve essere raggiungibile dal server Mattermost.
  `localhost` funziona solo quando Mattermost e OpenClaw vengono eseguiti sullo stesso host/spazio dei nomi di rete.
- Se la destinazione della callback è privata/tailnet/interna, aggiungi il suo host/dominio a Mattermost
  `ServiceSettings.AllowedUntrustedInternalConnections`.

### Integrazione API diretta (script esterni)

Gli script esterni e i webhook possono pubblicare pulsanti direttamente tramite l'API REST di Mattermost
invece di passare attraverso lo strumento `message` dell'agente. Usa `buildButtonAttachments()` del
plugin quando possibile; se pubblichi JSON grezzo, segui queste regole:

**Struttura del payload:**

```json5
{
  channel_id: "<channelId>",
  message: "Choose an option:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // alphanumeric only — see below
            type: "button", // required, or clicks are silently ignored
            name: "Approve", // display label
            style: "primary", // optional: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // must match button id (for name lookup)
                action: "approve",
                // ... any custom fields ...
                _token: "<hmac>", // see HMAC section below
              },
            },
          },
        ],
      },
    ],
  },
}
```

**Regole critiche:**

1. Gli allegati vanno in `props.attachments`, non negli `attachments` di primo livello (altrimenti vengono ignorati silenziosamente).
2. Ogni azione richiede `type: "button"` — senza di esso, i clic vengono assorbiti silenziosamente.
3. Ogni azione richiede un campo `id` — Mattermost ignora le azioni senza ID.
4. L'`id` dell'azione deve essere **solo alfanumerico** (`[a-zA-Z0-9]`). Trattini e underscore rompono
   il routing lato server delle azioni di Mattermost (restituisce 404). Rimuovili prima dell'uso.
5. `context.action_id` deve corrispondere all'`id` del pulsante in modo che il messaggio di conferma mostri il
   nome del pulsante (ad esempio "Approve") invece di un ID grezzo.
6. `context.action_id` è obbligatorio — il gestore delle interazioni restituisce 400 senza di esso.

**Generazione del token HMAC:**

Il gateway verifica i clic dei pulsanti con HMAC-SHA256. Gli script esterni devono generare token
che corrispondano alla logica di verifica del gateway:

1. Deriva il segreto dal token del bot:
   `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
2. Costruisci l'oggetto context con tutti i campi **tranne** `_token`.
3. Serializza con **chiavi ordinate** e **senza spazi** (il gateway usa `JSON.stringify`
   con chiavi ordinate, che produce output compatto).
4. Firma: `HMAC-SHA256(key=secret, data=serializedContext)`
5. Aggiungi il digest esadecimale risultante come `_token` nel context.

Esempio Python:

```python
import hmac, hashlib, json

secret = hmac.new(
    b"openclaw-mattermost-interactions",
    bot_token.encode(), hashlib.sha256
).hexdigest()

ctx = {"action_id": "mybutton01", "action": "approve"}
payload = json.dumps(ctx, sort_keys=True, separators=(",", ":"))
token = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()

context = {**ctx, "_token": token}
```

Problemi comuni con HMAC:

- `json.dumps` di Python aggiunge spazi per impostazione predefinita (`{"key": "val"}`). Usa
  `separators=(",", ":")` per corrispondere all'output compatto di JavaScript (`{"key":"val"}`).
- Firma sempre **tutti** i campi del context (escluso `_token`). Il gateway rimuove `_token` e poi
  firma tutto ciò che rimane. Firmare un sottoinsieme causa un fallimento di verifica silenzioso.
- Usa `sort_keys=True` — il gateway ordina le chiavi prima della firma e Mattermost può
  riordinare i campi del context quando memorizza il payload.
- Deriva il segreto dal token del bot (deterministico), non da byte casuali. Il segreto
  deve essere lo stesso tra il processo che crea i pulsanti e il gateway che verifica.

## Adattatore directory

Il plugin Mattermost include un adattatore directory che risolve i nomi di canali e utenti
tramite l'API Mattermost. Questo abilita le destinazioni `#channel-name` e `@username` in
`openclaw message send` e nelle consegne cron/webhook.

Non è necessaria alcuna configurazione — l'adattatore usa il token del bot dalla configurazione dell'account.

## Multi-account

Mattermost supporta più account sotto `channels.mattermost.accounts`:

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Primary", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Alerts", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

## Risoluzione dei problemi

- Nessuna risposta nei canali: assicurati che il bot sia nel canale e menzionalo (oncall), usa un prefisso trigger (onchar) oppure imposta `chatmode: "onmessage"`.
- Errori di autenticazione: controlla il token del bot, l'URL di base e se l'account è abilitato.
- Problemi multi-account: le variabili d'ambiente si applicano solo all'account `default`.
- I comandi slash nativi restituiscono `Unauthorized: invalid command token.`: OpenClaw
  non ha accettato il token della callback. Cause tipiche:
  - la registrazione del comando slash è fallita o si è completata solo parzialmente all'avvio
  - la callback sta colpendo il gateway/account sbagliato
  - Mattermost ha ancora vecchi comandi che puntano a una destinazione di callback precedente
  - il gateway si è riavviato senza riattivare i comandi slash
- Se i comandi slash nativi smettono di funzionare, controlla i log per
  `mattermost: failed to register slash commands` oppure
  `mattermost: native slash commands enabled but no commands could be registered`.
- Se `callbackUrl` viene omesso e i log avvertono che la callback è stata risolta in
  `http://127.0.0.1:18789/...`, quell'URL probabilmente è raggiungibile solo quando
  Mattermost viene eseguito sullo stesso host/spazio dei nomi di rete di OpenClaw. Imposta invece un
  `commands.callbackUrl` esplicito e raggiungibile esternamente.
- I pulsanti appaiono come riquadri bianchi: l'agente potrebbe inviare dati dei pulsanti malformati. Controlla che ogni pulsante abbia sia i campi `text` sia `callback_data`.
- I pulsanti vengono renderizzati ma i clic non fanno nulla: verifica che `AllowedUntrustedInternalConnections` nella configurazione del server Mattermost includa `127.0.0.1 localhost` e che `EnablePostActionIntegration` sia `true` in ServiceSettings.
- I pulsanti restituiscono 404 al clic: probabilmente l'`id` del pulsante contiene trattini o underscore. Il router delle azioni di Mattermost si rompe con ID non alfanumerici. Usa solo `[a-zA-Z0-9]`.
- Il gateway registra `invalid _token`: mancata corrispondenza HMAC. Controlla di firmare tutti i campi del context (non un sottoinsieme), di usare chiavi ordinate e JSON compatto (senza spazi). Vedi la sezione HMAC sopra.
- Il gateway registra `missing _token in context`: il campo `_token` non è nel context del pulsante. Assicurati che sia incluso quando costruisci il payload di integrazione.
- La conferma mostra un ID grezzo invece del nome del pulsante: `context.action_id` non corrisponde all'`id` del pulsante. Imposta entrambi allo stesso valore sanificato.
- L'agente non conosce i pulsanti: aggiungi `capabilities: ["inlineButtons"]` alla configurazione del canale Mattermost.

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Pairing](/it/channels/pairing) — autenticazione DM e flusso di pairing
- [Gruppi](/it/channels/groups) — comportamento della chat di gruppo e vincolo di menzione
- [Instradamento dei canali](/it/channels/channel-routing) — instradamento della sessione per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e hardening
