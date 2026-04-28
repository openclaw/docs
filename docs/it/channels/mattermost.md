---
read_when:
    - Configurazione di Mattermost
    - Debug del routing di Mattermost
sidebarTitle: Mattermost
summary: Configurazione del bot Mattermost e di OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-04-26T11:23:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 22916fcff2eeccf53055f2ebf60fc621d595991d0ca4cd148015b61cce09c52f
    source_path: channels/mattermost.md
    workflow: 15
---

Stato: Plugin incluso nel bundle (token bot + eventi WebSocket). Sono supportati canali, gruppi e DM. Mattermost è una piattaforma di messaggistica per team self-hostable; consulta il sito ufficiale su [mattermost.com](https://mattermost.com) per dettagli sul prodotto e download.

## Plugin incluso nel bundle

<Note>
Mattermost è incluso come Plugin nel bundle nelle versioni correnti di OpenClaw, quindi le normali build pacchettizzate non richiedono un'installazione separata.
</Note>

Se utilizzi una build meno recente o un'installazione personalizzata che esclude Mattermost, installalo manualmente:

<Tabs>
  <Tab title="registro npm">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="checkout locale">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

Dettagli: [Plugin](/it/tools/plugin)

## Configurazione rapida

<Steps>
  <Step title="Assicurati che il Plugin sia disponibile">
    Le versioni pacchettizzate correnti di OpenClaw lo includono già nel bundle. Le installazioni meno recenti o personalizzate possono aggiungerlo manualmente con i comandi sopra.
  </Step>
  <Step title="Crea un bot Mattermost">
    Crea un account bot Mattermost e copia il **token del bot**.
  </Step>
  <Step title="Copia l'URL di base">
    Copia l'**URL di base** di Mattermost (ad esempio `https://chat.example.com`).
  </Step>
  <Step title="Configura OpenClaw e avvia il Gateway">
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

  </Step>
</Steps>

## Comandi slash nativi

I comandi slash nativi sono opt-in. Quando sono abilitati, OpenClaw registra i comandi slash `oc_*` tramite l'API Mattermost e riceve callback POST sul server HTTP del Gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Usare quando Mattermost non può raggiungere direttamente il Gateway (proxy inverso/URL pubblico).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Note sul comportamento">
    - `native: "auto"` è disabilitato per impostazione predefinita per Mattermost. Imposta `native: true` per abilitarlo.
    - Se `callbackUrl` viene omesso, OpenClaw ne ricava uno da host/porta del Gateway + `callbackPath`.
    - Per configurazioni multi-account, `commands` può essere impostato al livello superiore oppure sotto `channels.mattermost.accounts.<id>.commands` (i valori dell'account sovrascrivono i campi di livello superiore).
    - Le callback dei comandi vengono validate con i token per comando restituiti da Mattermost quando OpenClaw registra i comandi `oc_*`.
    - Le callback slash vengono rifiutate in modalità fail closed se la registrazione non è riuscita, l'avvio è stato parziale oppure il token della callback non corrisponde a uno dei comandi registrati.

  </Accordion>
  <Accordion title="Requisito di raggiungibilità">
    L'endpoint di callback deve essere raggiungibile dal server Mattermost.

    - Non impostare `callbackUrl` su `localhost` a meno che Mattermost non venga eseguito sullo stesso host/spazio dei nomi di rete di OpenClaw.
    - Non impostare `callbackUrl` sull'URL di base di Mattermost a meno che quell'URL non faccia da proxy inverso per `/api/channels/mattermost/command` verso OpenClaw.
    - Un controllo rapido è `curl https://<gateway-host>/api/channels/mattermost/command`; una GET dovrebbe restituire `405 Method Not Allowed` da OpenClaw, non `404`.

  </Accordion>
  <Accordion title="Allowlist di uscita di Mattermost">
    Se la callback punta a indirizzi privati/tailnet/interni, imposta `Mattermost ServiceSettings.AllowedUntrustedInternalConnections` in modo da includere l'host/dominio della callback.

    Usa voci host/dominio, non URL completi.

    - Corretto: `gateway.tailnet-name.ts.net`
    - Errato: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## Variabili d'ambiente (account predefinito)

Impostale sull'host del Gateway se preferisci usare variabili d'ambiente:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
Le variabili d'ambiente si applicano solo all'account **predefinito** (`default`). Gli altri account devono usare valori di configurazione.

`MATTERMOST_URL` non può essere impostata da un workspace `.env`; vedi [File `.env` del workspace](/it/gateway/security).
</Note>

## Modalità chat

Mattermost risponde automaticamente ai DM. Il comportamento nei canali è controllato da `chatmode`:

<Tabs>
  <Tab title="oncall (predefinito)">
    Risponde solo quando viene @menzionato nei canali.
  </Tab>
  <Tab title="onmessage">
    Risponde a ogni messaggio del canale.
  </Tab>
  <Tab title="onchar">
    Risponde quando un messaggio inizia con un prefisso trigger.
  </Tab>
</Tabs>

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

- `onchar` risponde comunque alle @menzioni esplicite.
- `channels.mattermost.requireMention` è rispettato per le configurazioni legacy, ma è preferibile `chatmode`.

## Thread e sessioni

Usa `channels.mattermost.replyToMode` per controllare se le risposte in canali e gruppi restano nel canale principale oppure avviano un thread sotto il post che ha attivato la risposta.

- `off` (predefinito): risponde in un thread solo se il post in ingresso si trova già in un thread.
- `first`: per i post di livello superiore in canali/gruppi, avvia un thread sotto quel post e instrada la conversazione verso una sessione con ambito thread.
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

- Le sessioni con ambito thread usano l'id del post che ha attivato la risposta come radice del thread.
- `first` e `all` sono attualmente equivalenti perché, una volta che Mattermost ha una radice di thread, i chunk successivi e i media continuano nello stesso thread.

## Controllo degli accessi (DM)

- Predefinito: `channels.mattermost.dmPolicy = "pairing"` (i mittenti sconosciuti ricevono un codice di pairing).
- Approva tramite:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- DM pubblici: `channels.mattermost.dmPolicy="open"` più `channels.mattermost.allowFrom=["*"]`.

## Canali (gruppi)

- Predefinito: `channels.mattermost.groupPolicy = "allowlist"` (protetto da menzione).
- Inserisci i mittenti in allowlist con `channels.mattermost.groupAllowFrom` (si consigliano gli ID utente).
- Le sostituzioni per menzione per canale si trovano sotto `channels.mattermost.groups.<channelId>.requireMention` oppure `channels.mattermost.groups["*"].requireMention` come valore predefinito.
- La corrispondenza `@username` è mutabile ed è abilitata solo quando `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Canali aperti: `channels.mattermost.groupPolicy="open"` (protetto da menzione).
- Nota di runtime: se `channels.mattermost` manca completamente, il runtime torna a `groupPolicy="allowlist"` per i controlli di gruppo (anche se `channels.defaults.groupPolicy` è impostato).

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

## Target per la consegna in uscita

Usa questi formati target con `openclaw message send` oppure Cron/Webhook:

- `channel:<id>` per un canale
- `user:<id>` per un DM
- `@username` per un DM (risolto tramite l'API Mattermost)

<Warning>
Gli ID opachi senza prefisso (come `64ifufp...`) sono **ambigui** in Mattermost (ID utente vs ID canale).

OpenClaw li risolve con priorità all'utente:

- Se l'ID esiste come utente (`GET /api/v4/users/<id>` ha esito positivo), OpenClaw invia un **DM** risolvendo il canale diretto tramite `/api/v4/channels/direct`.
- Altrimenti l'ID viene trattato come **ID canale**.

Se hai bisogno di un comportamento deterministico, usa sempre i prefissi espliciti (`user:<id>` / `channel:<id>`).
</Warning>

## Retry del canale DM

Quando OpenClaw invia a un target DM Mattermost e deve prima risolvere il canale diretto, per impostazione predefinita ritenta in caso di errori transitori nella creazione del canale diretto.

Usa `channels.mattermost.dmChannelRetry` per regolare globalmente questo comportamento per il Plugin Mattermost, oppure `channels.mattermost.accounts.<id>.dmChannelRetry` per un singolo account.

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
- I retry si applicano a errori transitori come rate limit, risposte 5xx ed errori di rete o timeout.
- Gli errori client 4xx diversi da `429` vengono trattati come permanenti e non vengono ritentati.

## Streaming di anteprima

Mattermost trasmette pensieri, attività degli strumenti e testo parziale della risposta in un singolo **post di anteprima bozza** che viene finalizzato sul posto quando la risposta finale è sicura da inviare. L'anteprima si aggiorna sullo stesso id del post invece di riempire il canale con messaggi per ogni chunk. I finali con media/errori annullano le modifiche di anteprima in sospeso e usano la consegna normale invece di pubblicare un post di anteprima usa e getta.

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

<AccordionGroup>
  <Accordion title="Modalità di streaming">
    - `partial` è la scelta più comune: un post di anteprima che viene modificato man mano che la risposta cresce, poi finalizzato con la risposta completa.
    - `block` usa chunk bozza in stile append all'interno del post di anteprima.
    - `progress` mostra un'anteprima di stato durante la generazione e pubblica la risposta finale solo al completamento.
    - `off` disabilita lo streaming di anteprima.

  </Accordion>
  <Accordion title="Note sul comportamento dello streaming">
    - Se lo stream non può essere finalizzato sul posto (per esempio se il post viene eliminato durante lo stream), OpenClaw torna a inviare un nuovo post finale in modo che la risposta non vada mai persa.
    - I payload composti solo da ragionamento vengono soppressi dai post del canale, incluso il testo che arriva come blockquote `> Reasoning:`. Imposta `/reasoning on` per vedere il ragionamento in altre superfici; il post finale di Mattermost mantiene solo la risposta.
    - Vedi [Streaming](/it/concepts/streaming#preview-streaming-modes) per la matrice di mappatura dei canali.

  </Accordion>
</AccordionGroup>

## Reazioni (strumento message)

- Usa `message action=react` con `channel=mattermost`.
- `messageId` è l'id del post Mattermost.
- `emoji` accetta nomi come `thumbsup` oppure `:+1:` (i due punti sono facoltativi).
- Imposta `remove=true` (booleano) per rimuovere una reazione.
- Gli eventi di aggiunta/rimozione delle reazioni vengono inoltrati come eventi di sistema alla sessione agente instradata.

Esempi:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Configurazione:

- `channels.mattermost.actions.reactions`: abilita/disabilita le azioni di reazione (predefinito true).
- Override per account: `channels.mattermost.accounts.<id>.actions.reactions`.

## Pulsanti interattivi (strumento message)

Invia messaggi con pulsanti cliccabili. Quando un utente fa clic su un pulsante, l'agente riceve la selezione e può rispondere.

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

<ParamField path="text" type="string" required>
  Etichetta visualizzata.
</ParamField>
<ParamField path="callback_data" type="string" required>
  Valore rinviato al clic (usato come ID azione).
</ParamField>
<ParamField path="style" type='"default" | "primary" | "danger"'>
  Stile del pulsante.
</ParamField>

Quando un utente fa clic su un pulsante:

<Steps>
  <Step title="Pulsanti sostituiti con conferma">
    Tutti i pulsanti vengono sostituiti con una riga di conferma (ad esempio, "✓ **Yes** selected by @user").
  </Step>
  <Step title="L'agente riceve la selezione">
    L'agente riceve la selezione come messaggio in entrata e risponde.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Note di implementazione">
    - Le callback dei pulsanti usano la verifica HMAC-SHA256 (automatica, nessuna configurazione necessaria).
    - Mattermost rimuove i dati di callback dalle sue risposte API (funzionalità di sicurezza), quindi tutti i pulsanti vengono rimossi al clic: la rimozione parziale non è possibile.
    - Gli ID azione che contengono trattini o underscore vengono sanificati automaticamente (limitazione del routing di Mattermost).

  </Accordion>
  <Accordion title="Configurazione e raggiungibilità">
    - `channels.mattermost.capabilities`: array di stringhe di capacità. Aggiungi `"inlineButtons"` per abilitare la descrizione dello strumento pulsanti nel prompt di sistema dell'agente.
    - `channels.mattermost.interactions.callbackBaseUrl`: URL di base esterno facoltativo per le callback dei pulsanti (ad esempio `https://gateway.example.com`). Usalo quando Mattermost non può raggiungere direttamente il Gateway al suo host di bind.
    - Nelle configurazioni multi-account, puoi impostare lo stesso campo anche sotto `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - Se `interactions.callbackBaseUrl` viene omesso, OpenClaw ricava l'URL di callback da `gateway.customBindHost` + `gateway.port`, poi ripiega su `http://localhost:<port>`.
    - Regola di raggiungibilità: l'URL di callback del pulsante deve essere raggiungibile dal server Mattermost. `localhost` funziona solo quando Mattermost e OpenClaw vengono eseguiti sullo stesso host/spazio dei nomi di rete.
    - Se il target della callback è privato/tailnet/interno, aggiungi il suo host/dominio a `Mattermost ServiceSettings.AllowedUntrustedInternalConnections`.

  </Accordion>
</AccordionGroup>

### Integrazione API diretta (script esterni)

Gli script esterni e i Webhook possono pubblicare pulsanti direttamente tramite l'API REST di Mattermost invece di passare attraverso lo strumento `message` dell'agente. Usa `buildButtonAttachments()` dal Plugin quando possibile; se pubblichi JSON grezzo, segui queste regole:

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
            id: "mybutton01", // solo alfanumerico — vedi sotto
            type: "button", // obbligatorio, altrimenti i clic vengono ignorati silenziosamente
            name: "Approve", // etichetta visualizzata
            style: "primary", // facoltativo: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // deve corrispondere all'id del pulsante (per la ricerca del nome)
                action: "approve",
                // ... eventuali campi personalizzati ...
                _token: "<hmac>", // vedi la sezione HMAC qui sotto
              },
            },
          },
        ],
      },
    ],
  },
}
```

<Warning>
**Regole critiche**

1. Gli allegati vanno in `props.attachments`, non in `attachments` a livello superiore (ignorati silenziosamente).
2. Ogni azione richiede `type: "button"` — senza di esso, i clic vengono assorbiti silenziosamente.
3. Ogni azione richiede un campo `id` — Mattermost ignora le azioni senza ID.
4. L'`id` dell'azione deve essere **solo alfanumerico** (`[a-zA-Z0-9]`). Trattini e underscore rompono il routing lato server di Mattermost (restituisce 404). Rimuovili prima dell'uso.
5. `context.action_id` deve corrispondere all'`id` del pulsante affinché il messaggio di conferma mostri il nome del pulsante (ad esempio "Approve") invece di un ID grezzo.
6. `context.action_id` è obbligatorio — senza di esso il gestore di interazione restituisce 400.
</Warning>

**Generazione del token HMAC**

Il Gateway verifica i clic dei pulsanti con HMAC-SHA256. Gli script esterni devono generare token che corrispondano alla logica di verifica del Gateway:

<Steps>
  <Step title="Deriva il segreto dal token del bot">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="Costruisci l'oggetto context">
    Costruisci l'oggetto context con tutti i campi **tranne** `_token`.
  </Step>
  <Step title="Serializza con chiavi ordinate">
    Serializza con **chiavi ordinate** e **senza spazi** (il Gateway usa `JSON.stringify` con chiavi ordinate, che produce output compatto).
  </Step>
  <Step title="Firma il payload">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Aggiungi il token">
    Aggiungi il digest esadecimale risultante come `_token` nel context.
  </Step>
</Steps>

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

<AccordionGroup>
  <Accordion title="Errori comuni con HMAC">
    - `json.dumps` di Python aggiunge spazi per impostazione predefinita (`{"key": "val"}`). Usa `separators=(",", ":")` per corrispondere all'output compatto di JavaScript (`{"key":"val"}`).
    - Firma sempre **tutti** i campi del context (escluso `_token`). Il Gateway rimuove `_token` e poi firma tutto ciò che resta. Firmare un sottoinsieme causa un errore di verifica silenzioso.
    - Usa `sort_keys=True` — il Gateway ordina le chiavi prima di firmare, e Mattermost può riordinare i campi del context quando memorizza il payload.
    - Deriva il segreto dal token del bot (deterministico), non da byte casuali. Il segreto deve essere lo stesso tra il processo che crea i pulsanti e il Gateway che li verifica.

  </Accordion>
</AccordionGroup>

## Adattatore directory

Il Plugin Mattermost include un adattatore directory che risolve i nomi di canale e utente tramite l'API Mattermost. Questo abilita i target `#channel-name` e `@username` in `openclaw message send` e nelle consegne Cron/Webhook.

Non è necessaria alcuna configurazione: l'adattatore usa il token del bot dalla configurazione dell'account.

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

<AccordionGroup>
  <Accordion title="Nessuna risposta nei canali">
    Assicurati che il bot sia nel canale e menzionalo (oncall), usa un prefisso trigger (onchar), oppure imposta `chatmode: "onmessage"`.
  </Accordion>
  <Accordion title="Errori di autenticazione o multi-account">
    - Controlla il token del bot, l'URL di base e se l'account è abilitato.
    - Problemi multi-account: le variabili d'ambiente si applicano solo all'account `default`.

  </Accordion>
  <Accordion title="I comandi slash nativi non funzionano">
    - `Unauthorized: invalid command token.`: OpenClaw non ha accettato il token della callback. Cause tipiche:
      - la registrazione del comando slash non è riuscita o è stata completata solo parzialmente all'avvio
      - la callback sta raggiungendo il Gateway/account sbagliato
      - Mattermost ha ancora vecchi comandi che puntano a un target di callback precedente
      - il Gateway si è riavviato senza riattivare i comandi slash
    - Se i comandi slash nativi smettono di funzionare, controlla i log per `mattermost: failed to register slash commands` oppure `mattermost: native slash commands enabled but no commands could be registered`.
    - Se `callbackUrl` viene omesso e i log avvisano che la callback è stata risolta in `http://127.0.0.1:18789/...`, probabilmente quell'URL è raggiungibile solo quando Mattermost viene eseguito sullo stesso host/spazio dei nomi di rete di OpenClaw. Imposta invece un `commands.callbackUrl` esplicito e raggiungibile esternamente.

  </Accordion>
  <Accordion title="Problemi con i pulsanti">
    - I pulsanti appaiono come riquadri bianchi: l'agente potrebbe inviare dati dei pulsanti malformati. Controlla che ogni pulsante abbia sia i campi `text` sia `callback_data`.
    - I pulsanti vengono renderizzati ma i clic non fanno nulla: verifica che `AllowedUntrustedInternalConnections` nella configurazione del server Mattermost includa `127.0.0.1 localhost`, e che `EnablePostActionIntegration` sia `true` in ServiceSettings.
    - I pulsanti restituiscono 404 al clic: l'`id` del pulsante probabilmente contiene trattini o underscore. Il router delle azioni di Mattermost si rompe con ID non alfanumerici. Usa solo `[a-zA-Z0-9]`.
    - Il Gateway registra `invalid _token`: mancata corrispondenza HMAC. Controlla di firmare tutti i campi del context (non un sottoinsieme), di usare chiavi ordinate e JSON compatto (senza spazi). Vedi la sezione HMAC sopra.
    - Il Gateway registra `missing _token in context`: il campo `_token` non è nel context del pulsante. Assicurati che sia incluso durante la costruzione del payload di integrazione.
    - La conferma mostra l'ID grezzo invece del nome del pulsante: `context.action_id` non corrisponde all'`id` del pulsante. Imposta entrambi allo stesso valore sanificato.
    - L'agente non conosce i pulsanti: aggiungi `capabilities: ["inlineButtons"]` alla configurazione del canale Mattermost.

  </Accordion>
</AccordionGroup>

## Correlati

- [Routing del canale](/it/channels/channel-routing) — routing della sessione per i messaggi
- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e protezione tramite menzione
- [Abbinamento](/it/channels/pairing) — autenticazione DM e flusso di pairing
- [Sicurezza](/it/gateway/security) — modello di accesso e hardening
