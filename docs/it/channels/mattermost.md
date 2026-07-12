---
read_when:
    - Configurazione di Mattermost
    - Debug del routing di Mattermost
sidebarTitle: Mattermost
summary: Configurazione del bot Mattermost e configurazione di OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-07-12T06:50:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 246535ff433a678624d997db640d2531d6ce434ea064a23b98abe8a9e7e6a117
    source_path: channels/mattermost.md
    workflow: 16
---

Stato: plugin scaricabile (token del bot + eventi WebSocket). Sono supportati canali, canali privati, messaggi diretti di gruppo e messaggi diretti. Mattermost è una piattaforma di messaggistica per team che può essere ospitata autonomamente ([mattermost.com](https://mattermost.com)).

## Installazione

<Tabs>
  <Tab title="Registro npm">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="Checkout locale">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

Dettagli: [Plugin](/it/tools/plugin)

## Configurazione rapida

<Steps>
  <Step title="Assicurarsi che il plugin sia disponibile">
    Installa `@openclaw/mattermost` con il comando precedente, quindi riavvia il Gateway se è già in esecuzione.
  </Step>
  <Step title="Creare un bot Mattermost">
    Crea un account bot Mattermost, copia il **token del bot** e aggiungi il bot ai team e ai canali che deve leggere.
  </Step>
  <Step title="Copiare l'URL di base">
    Copia l'**URL di base** di Mattermost (ad esempio, `https://chat.example.com`). L'eventuale `/api/v4` finale viene rimosso automaticamente.
  </Step>
  <Step title="Configurare OpenClaw e avviare il Gateway">
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

    Alternativa non interattiva:

    ```bash
    openclaw channels add --channel mattermost --bot-token <token> --http-url https://chat.example.com
    ```

  </Step>
</Steps>

<Note>
Mattermost ospitato autonomamente su un indirizzo privato/LAN/tailnet: le richieste in uscita verso l'API di Mattermost passano attraverso una protezione SSRF che blocca per impostazione predefinita gli IP privati e interni. Abilita esplicitamente l'accesso con `channels.mattermost.network.dangerouslyAllowPrivateNetwork: true` (per account: `channels.mattermost.accounts.<id>.network.dangerouslyAllowPrivateNetwork`).
</Note>

## Comandi slash nativi

I comandi slash nativi sono facoltativi. Quando sono abilitati, OpenClaw registra i comandi slash `oc_*` in ogni team di cui il bot è membro e riceve le chiamate POST di callback sul server HTTP del Gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Da usare quando Mattermost non può raggiungere direttamente il Gateway (proxy inverso/URL pubblico).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

Comandi registrati: `/oc_status`, `/oc_model`, `/oc_models`, `/oc_new`, `/oc_help`, `/oc_think`, `/oc_reasoning`, `/oc_verbose`, `/oc_queue`. Con `nativeSkills: true`, anche i comandi delle Skills vengono registrati come `/oc_<skill>`.

<AccordionGroup>
  <Accordion title="Note sul comportamento">
    - Il valore predefinito di `native` e `nativeSkills` è `"auto"`, che per Mattermost viene interpretato come disabilitato. Impostali esplicitamente su `true`.
    - Il valore predefinito di `callbackPath` è `/api/channels/mattermost/command`.
    - Se `callbackUrl` viene omesso, OpenClaw ricava `http://<gateway.customBindHost or localhost>:<gateway.port, default 18789><callbackPath>`. Gli host di associazione con caratteri jolly (`0.0.0.0`, `::`) usano `localhost` come ripiego.
    - Nelle configurazioni con più account, `commands` può essere impostato al livello superiore o in `channels.mattermost.accounts.<id>.commands` (i valori dell'account sostituiscono i campi di livello superiore).
    - I comandi slash esistenti con lo stesso trigger, creati da altre integrazioni, non vengono modificati (la registrazione li ignora); i comandi creati dal bot vengono aggiornati o ricreati quando cambia l'URL di callback.
    - Le callback dei comandi vengono convalidate mediante i token specifici per comando restituiti da Mattermost quando OpenClaw registra i comandi `oc_*`.
    - OpenClaw aggiorna la registrazione corrente dei comandi Mattermost prima di accettare ogni callback, quindi i token obsoleti di comandi slash eliminati o rigenerati cessano di essere accettati senza dover riavviare il Gateway.
    - La convalida delle callback non consente l'accesso se l'API di Mattermost non può confermare che il comando sia ancora corrente; le convalide non riuscite vengono memorizzate brevemente nella cache, le ricerche simultanee vengono accorpate e l'avvio di nuove ricerche è soggetto a un limite di frequenza per comando, così da contenere la pressione dei tentativi di ripetizione.
    - Le callback slash non consentono l'accesso quando la registrazione non è riuscita, l'avvio è stato parziale o il token della callback non corrisponde al token registrato del comando risolto (un token valido per un comando non può raggiungere la convalida a monte per un comando diverso).
    - Le callback accettate ricevono una conferma con una risposta temporanea "Elaborazione in corso..."; la risposta effettiva arriva come messaggio normale.

  </Accordion>
  <Accordion title="Requisito di raggiungibilità">
    L'endpoint di callback deve essere raggiungibile dal server Mattermost.

    - Non impostare `callbackUrl` su `localhost`, a meno che Mattermost non sia in esecuzione sullo stesso host o nello stesso spazio dei nomi di rete di OpenClaw.
    - Non impostare `callbackUrl` sull'URL di base di Mattermost, a meno che tale URL non inoltri tramite proxy inverso `/api/channels/mattermost/command` a OpenClaw.
    - Per una verifica rapida, usa `curl https://<gateway-host>/api/channels/mattermost/command`; una richiesta GET deve restituire `405 Method Not Allowed` da OpenClaw, non `404`.

  </Accordion>
  <Accordion title="Elenco consentito per il traffico in uscita di Mattermost">
    Se la callback è indirizzata a indirizzi privati/tailnet/interni, imposta `ServiceSettings.AllowedUntrustedInternalConnections` di Mattermost in modo da includere l'host o il dominio della callback.

    Usa voci host/dominio, non URL completi.

    - Corretto: `gateway.tailnet-name.ts.net`
    - Errato: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## Variabili d'ambiente (account predefinito)

Se preferisci le variabili d'ambiente, impostale sull'host del Gateway:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
Le variabili d'ambiente si applicano solo all'account **predefinito** (`default`). Gli altri account devono usare i valori di configurazione.

`MATTERMOST_URL` non può essere impostato da un file `.env` dell'area di lavoro; consulta [File .env dell'area di lavoro](/it/gateway/security).
</Note>

## Modalità di chat

Mattermost risponde automaticamente ai messaggi diretti. Il comportamento nei canali è controllato da `chatmode`:

<Tabs>
  <Tab title="oncall (predefinita)">
    Risponde solo quando viene menzionato con @ nei canali.
  </Tab>
  <Tab title="onmessage">
    Risponde a ogni messaggio del canale.
  </Tab>
  <Tab title="onchar">
    Risponde quando un messaggio inizia con un prefisso di attivazione.
  </Tab>
</Tabs>

Esempio di configurazione:

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"], // predefinito
    },
  },
}
```

Note:

- `onchar` risponde comunque alle menzioni @ esplicite.
- `channels.mattermost.requireMention` continua a essere rispettato, ma è preferibile `chatmode`. Le impostazioni `groups.<channelId>.requireMention` specifiche per canale hanno la precedenza su entrambi.
- Dopo che il bot invia una risposta visibile in una discussione del canale, i messaggi successivi nella stessa discussione ricevono risposta senza una nuova menzione @ o un prefisso `onchar`, così le conversazioni a più turni nella discussione possono proseguire. La partecipazione viene ricordata per 7 giorni dall'ultima risposta del bot in quella discussione e persiste dopo il riavvio del Gateway. Le discussioni che il bot ha soltanto osservato non sono interessate; avvia un nuovo messaggio di primo livello per richiedere nuovamente una menzione esplicita.

## Discussioni e sessioni

Usa `channels.mattermost.replyToMode` per controllare se le risposte nei canali e nei gruppi rimangono nel canale principale o avviano una discussione sotto il post che le ha attivate.

- `off` (predefinito): risponde in una discussione solo quando il post in entrata appartiene già a una discussione.
- `first`: per i post di primo livello di canali o gruppi, avvia una discussione sotto quel post e instrada la conversazione verso una sessione relativa alla discussione.
- `all` e `batched`: attualmente hanno lo stesso comportamento di `first` per Mattermost, perché, una volta che Mattermost dispone di un post radice della discussione, i segmenti e i contenuti multimediali successivi continuano nella stessa discussione.
- Il valore predefinito per i messaggi diretti è `off`, anche quando `replyToMode` è impostato.

Usa `channels.mattermost.replyToModeByChatType` per sostituire la modalità nelle chat `direct`, `group` o `channel`. Imposta `direct` per abilitare le discussioni nei messaggi diretti:

- `off` (predefinito): i messaggi diretti rimangono senza discussioni in un'unica sessione continua.
- `first`, `all` o `batched`: ogni messaggio diretto di primo livello avvia una discussione Mattermost associata a una nuova sessione indipendente.

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
      replyToModeByChatType: {
        direct: "first",
      },
    },
  },
}
```

Note:

- Le sessioni relative alle discussioni usano l'ID del post che le ha attivate come radice della discussione.
- `first` e `all` sono attualmente equivalenti perché, una volta che Mattermost dispone di un post radice della discussione, i segmenti e i contenuti multimediali successivi continuano nella stessa discussione.
- Le sostituzioni specifiche per tipo di chat hanno la precedenza su `replyToMode`. Senza una sostituzione per `direct`, le installazioni esistenti mantengono i messaggi diretti lineari, senza discussioni.

## Controllo degli accessi (messaggi diretti)

- Valore predefinito: `channels.mattermost.dmPolicy = "pairing"` (i mittenti sconosciuti ricevono un codice di associazione). Altri valori: `allowlist`, `open`, `disabled`.
- Approva tramite:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Messaggi diretti pubblici: `channels.mattermost.dmPolicy="open"` insieme a `channels.mattermost.allowFrom=["*"]` (lo schema di configurazione impone il carattere jolly).
- `channels.mattermost.allowFrom` accetta ID utente (consigliati) e voci `accessGroup:<name>`. Consulta [Gruppi di accesso](/it/channels/access-groups).

## Canali (gruppi)

- Valore predefinito: `channels.mattermost.groupPolicy = "allowlist"` (richiede una menzione).
- Inserisci i mittenti nell'elenco consentito con `channels.mattermost.groupAllowFrom` (sono consigliati gli ID utente).
- `channels.mattermost.groupAllowFrom` accetta voci `accessGroup:<name>`. Consulta [Gruppi di accesso](/it/channels/access-groups).
- Le sostituzioni delle menzioni specifiche per canale si trovano in `channels.mattermost.groups.<channelId>.requireMention` oppure, per un valore predefinito, in `channels.mattermost.groups["*"].requireMention`.
- La corrispondenza di `@username` è modificabile ed è abilitata solo quando `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Canali aperti: `channels.mattermost.groupPolicy="open"` (richiede una menzione).
- Ordine di risoluzione: `channels.mattermost.groupPolicy`, quindi `channels.defaults.groupPolicy`, infine `"allowlist"`.
- Nota sull'esecuzione: se la sezione `channels.mattermost` è completamente assente, durante i controlli dei gruppi l'esecuzione usa in modo restrittivo `groupPolicy="allowlist"` (anche se `channels.defaults.groupPolicy` è impostato) e registra un avviso una sola volta.

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

## Destinazioni per l'invio in uscita

Usa questi formati di destinazione con `openclaw message send` o Cron/Webhook:

| Destinazione                         | Recapito                                                        |
| ----------------------------------- | --------------------------------------------------------------- |
| `channel:<id>`                      | Canale per ID                                                   |
| `channel:<name>` o `#channel-name`  | Canale per nome, cercato nei team a cui appartiene il bot       |
| `user:<id>` o `mattermost:<id>`     | Messaggio diretto con tale utente                               |
| `@username`                         | Messaggio diretto (nome utente risolto tramite l'API Mattermost) |

Gli invii in uscita supportano al massimo un allegato per messaggio; suddividi più file in invii separati.

<Warning>
Gli ID opachi senza prefisso (come `64ifufp...`) sono **ambigui** in Mattermost (ID utente o ID canale).

OpenClaw li risolve dando la **precedenza all'utente**:

- Se l'ID esiste come utente (`GET /api/v4/users/<id>` riesce), OpenClaw invia un **messaggio diretto** risolvendo il canale diretto tramite `/api/v4/channels/direct`.
- Altrimenti, l'ID viene trattato come **ID canale**.

Se hai bisogno di un comportamento deterministico, usa sempre i prefissi espliciti (`user:<id>` / `channel:<id>`).
</Warning>

## Nuovo tentativo per il canale dei messaggi diretti

Quando OpenClaw invia a una destinazione di messaggistica diretta Mattermost e deve prima risolvere il canale diretto, per impostazione predefinita riprova in caso di errori temporanei nella creazione del canale diretto.

Usa `channels.mattermost.dmChannelRetry` per regolare questo comportamento globalmente per il plugin Mattermost oppure `channels.mattermost.accounts.<id>.dmChannelRetry` per un singolo account. Valori predefiniti:

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

- Questo si applica solo alla creazione dei canali DM (`/api/v4/channels/direct`), non a tutte le chiamate API di Mattermost.
- I nuovi tentativi usano un backoff esponenziale con jitter e si applicano agli errori transitori, come limiti di frequenza, risposte 5xx ed errori di rete o timeout.
- Gli errori client 4xx diversi da `429` sono considerati permanenti e non vengono ripetuti.

## Streaming dell'anteprima

Mattermost trasmette in streaming il ragionamento, l'attività degli strumenti e il testo parziale della risposta in un **post di anteprima in bozza**, che viene finalizzato sul posto quando la risposta definitiva può essere inviata in sicurezza. In modalità `partial`, l'anteprima viene aggiornata usando lo stesso ID del post, anziché sommergere il canale con un messaggio per ogni frammento. In modalità `block`, l'anteprima alterna blocchi di testo completato e di attività degli strumenti, così i blocchi precedenti rimangono visibili come post separati anziché essere sovrascritti da quello successivo. Le risposte finali contenenti contenuti multimediali o errori annullano le modifiche dell'anteprima in sospeso e usano la consegna normale, anziché pubblicare un post di anteprima usa e getta.

Lo streaming dell'anteprima è **attivo per impostazione predefinita** in modalità `partial`. Configuralo tramite `channels.mattermost.streaming` (una stringa di modalità, un valore booleano o un oggetto come `{ mode: "progress" }`):

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
    - `partial` (predefinita): un singolo post di anteprima che viene modificato mentre la risposta cresce, quindi finalizzato con la risposta completa.
    - `block` alterna l'anteprima tra blocchi di testo completato e di attività degli strumenti, così ogni blocco rimane visibile come post separato anziché essere sovrascritto sul posto. Gli aggiornamenti paralleli e consecutivi degli strumenti condividono il post corrente dell'attività degli strumenti.
    - `progress` mostra un'anteprima dello stato durante la generazione e pubblica la risposta finale solo al completamento.
    - `off` disabilita lo streaming dell'anteprima. Con `blockStreaming: true`, i blocchi completati dell'assistente vengono comunque consegnati come normali risposte a blocchi (post separati), anziché come un unico post finale aggregato.

  </Accordion>
  <Accordion title="Note sul comportamento dello streaming">
    - Se lo stream non può essere finalizzato sul posto, ad esempio perché il post è stato eliminato durante lo streaming, OpenClaw ricorre all'invio di un nuovo post finale, così la risposta non va mai persa.
    - I payload contenenti solo il ragionamento non vengono pubblicati nei post del canale, incluso il testo che arriva come citazione `> Thinking`. Imposta `/reasoning on` per visualizzare il ragionamento in altre interfacce; il post finale di Mattermost mantiene solo la risposta.
    - Consulta [Streaming](/it/concepts/streaming#preview-streaming-modes) per la matrice di mappatura dei canali.

  </Accordion>
</AccordionGroup>

## Reazioni (strumento per i messaggi)

- Usa `message action=react` con `channel=mattermost`.
- `messageId` è l'ID del post di Mattermost.
- `emoji` accetta nomi come `thumbsup` o `:+1:` (i due punti sono facoltativi).
- Imposta `remove=true` (valore booleano) per rimuovere una reazione.
- Gli eventi di aggiunta/rimozione delle reazioni vengono inoltrati come eventi di sistema alla sessione dell'agente instradata, con gli stessi controlli delle politiche DM/gruppo applicati ai messaggi.

Esempi:

```text
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Configurazione:

- `channels.mattermost.actions.reactions`: abilita/disabilita le azioni di reazione (valore predefinito: true).
- Sostituzione per account: `channels.mattermost.accounts.<id>.actions.reactions`.

## Pulsanti interattivi (strumento per i messaggi)

Invia messaggi con pulsanti selezionabili. Quando un utente seleziona un pulsante, l'agente riceve la selezione e può rispondere.

I pulsanti provengono dal payload semantico `presentation` (nelle normali risposte dell'agente e in `message action=send`). OpenClaw visualizza i pulsanti con valore come pulsanti interattivi di Mattermost, mantiene visibili nel testo del messaggio i pulsanti URL e converte i menu di selezione in testo leggibile.

```text
message action=send channel=mattermost target=channel:<channelId> presentation={"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"yes"},{"label":"No","value":"no"}]}]}
```

Campi dei pulsanti di presentazione:

<ParamField path="label" type="string" required>
  Etichetta visualizzata (alias: `text`).
</ParamField>
<ParamField path="value" type="string">
  Valore restituito alla selezione, usato come ID dell'azione (alias: `callback_data`, `callbackData`). Obbligatorio per un pulsante selezionabile, a meno che non sia impostato `url`.
</ParamField>
<ParamField path="url" type="string">
  Pulsante di collegamento; viene visualizzato come testo `label: url` nel corpo del messaggio anziché come pulsante interattivo.
</ParamField>
<ParamField path="style" type='"primary" | "secondary" | "success" | "danger"'>
  Stile del pulsante. Mattermost applica lo stile predefinito ai valori non supportati.
</ParamField>

Per indicare il supporto dei pulsanti nel prompt di sistema dell'agente, aggiungi `inlineButtons` alle funzionalità del canale:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

Quando un utente seleziona un pulsante:

<Steps>
  <Step title="Controllo dell'accesso">
    Chi seleziona il pulsante deve superare gli stessi controlli delle politiche DM/gruppo applicati al mittente di un messaggio; le selezioni non autorizzate ricevono una notifica temporanea e vengono ignorate.
  </Step>
  <Step title="Pulsanti sostituiti con una conferma">
    Tutti i pulsanti vengono sostituiti con una riga di conferma, ad esempio "✓ **Sì** selezionato da @user".
  </Step>
  <Step title="L'agente riceve la selezione">
    L'agente riceve la selezione come messaggio in ingresso, insieme a un evento di sistema, e risponde.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Note sull'implementazione">
    - I callback dei pulsanti usano la verifica HMAC-SHA256 (automatica, senza configurazione).
    - Alla selezione viene sostituito l'intero blocco dell'allegato, quindi tutti i pulsanti vengono rimossi insieme: la rimozione parziale non è possibile.
    - Gli ID delle azioni contenenti trattini o caratteri di sottolineatura vengono sanificati automaticamente (limitazione dell'instradamento di Mattermost).
    - Le selezioni il cui `action_id` non corrisponde a un'azione del post originale vengono rifiutate con `403` ("Azione sconosciuta").

  </Accordion>
  <Accordion title="Configurazione e raggiungibilità">
    - `channels.mattermost.capabilities`: array di stringhe delle funzionalità. Aggiungi `"inlineButtons"` per abilitare la descrizione dello strumento per i pulsanti nel prompt di sistema dell'agente.
    - `channels.mattermost.interactions.callbackBaseUrl`: URL di base esterno facoltativo per i callback dei pulsanti, ad esempio `https://gateway.example.com`. Usalo quando Mattermost non può raggiungere direttamente il Gateway tramite il relativo host di binding.
    - Nelle configurazioni con più account, puoi impostare lo stesso campo anche in `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - Se `interactions.callbackBaseUrl` viene omesso, OpenClaw ricava l'URL di callback da `gateway.customBindHost` + `gateway.port` (valore predefinito: 18789), quindi ripiega su `http://localhost:<port>`. Il percorso di callback è `/mattermost/interactions/<accountId>`.
    - Regola di raggiungibilità: l'URL di callback dei pulsanti deve essere raggiungibile dal server Mattermost. `localhost` funziona solo quando Mattermost e OpenClaw sono in esecuzione sullo stesso host/spazio dei nomi di rete.
    - `channels.mattermost.interactions.allowedSourceIps`: elenco di indirizzi IP di origine consentiti per i callback dei pulsanti. Senza questa opzione, vengono accettate solo le origini local loopback (`127.0.0.1`, `::1`), quindi un server Mattermost remoto deve essere aggiunto qui all'elenco degli indirizzi consentiti, altrimenti le sue selezioni vengono rifiutate con `403`. Dietro un proxy inverso, imposta anche `gateway.trustedProxies`, così l'IP reale del client viene ricavato dalle intestazioni inoltrate.
    - Se la destinazione del callback è privata, interna o nella tailnet, aggiungi il relativo host/dominio a `ServiceSettings.AllowedUntrustedInternalConnections` di Mattermost.

  </Accordion>
</AccordionGroup>

### Integrazione API diretta (script esterni)

Gli script esterni e i Webhook possono pubblicare direttamente i pulsanti tramite l'API REST di Mattermost anziché passare dallo strumento `message` dell'agente. Quando possibile, usa `buildButtonAttachments()` del Plugin; se pubblichi JSON non elaborato, segui queste regole:

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
            id: "mybutton01", // alphanumeric only - see below
            type: "button", // required, or clicks are silently ignored
            name: "Approve", // display label
            style: "primary", // optional: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // must match button id
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

<Warning>
**Regole fondamentali**

1. Gli allegati vanno in `props.attachments`, non in `attachments` al livello principale (in tal caso vengono ignorati senza notifiche).
2. Ogni azione richiede `type: "button"`; senza questo campo, le selezioni vengono ignorate senza notifiche.
3. Ogni azione richiede un campo `id`: Mattermost ignora le azioni senza ID.
4. L'`id` dell'azione deve essere **esclusivamente alfanumerico** (`[a-zA-Z0-9]`). I trattini e i caratteri di sottolineatura interrompono l'instradamento delle azioni lato server di Mattermost (restituisce 404). Rimuovili prima dell'uso.
5. `context.action_id` deve corrispondere all'`id` del pulsante; il Gateway rifiuta le selezioni il cui `action_id` non esiste nel post.
6. `context.action_id` è obbligatorio: senza di esso, il gestore delle interazioni restituisce 400.
7. L'IP di origine del callback deve essere consentito (vedi `interactions.allowedSourceIps` sopra).

</Warning>

**Generazione del token HMAC**

Il Gateway verifica le selezioni dei pulsanti con HMAC-SHA256. Gli script esterni devono generare token che corrispondano alla logica di verifica del Gateway:

<Steps>
  <Step title="Deriva il segreto dal token del bot">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`, con codifica esadecimale.
  </Step>
  <Step title="Crea l'oggetto di contesto">
    Crea l'oggetto di contesto con tutti i campi **tranne** `_token`.
  </Step>
  <Step title="Serializza con le chiavi ordinate">
    Serializza con **chiavi ordinate ricorsivamente** e **senza spazi** (anche il Gateway rende canonici gli oggetti annidati e produce JSON compatto).
  </Step>
  <Step title="Firma il payload">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Aggiungi il token">
    Aggiungi al contesto il digest esadecimale risultante come `_token`.
  </Step>
</Steps>

Esempio in Python:

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
    - Per impostazione predefinita, `json.dumps` di Python aggiunge spazi (`{"key": "val"}`). Usa `separators=(",", ":")` per ottenere lo stesso output compatto di JavaScript (`{"key":"val"}`).
    - Firma sempre **tutti** i campi del contesto, escluso `_token`. Il Gateway rimuove `_token`, quindi firma tutto ciò che rimane. Firmare solo un sottoinsieme causa un errore di verifica senza notifiche.
    - Usa `sort_keys=True`: il Gateway ordina le chiavi prima della firma e Mattermost potrebbe riordinare i campi del contesto durante l'archiviazione del payload.
    - Deriva il segreto dal token del bot in modo deterministico, anziché usare byte casuali. Il segreto deve essere identico nel processo che crea i pulsanti e nel Gateway che esegue la verifica.

  </Accordion>
</AccordionGroup>

## Adattatore della directory

Il Plugin Mattermost include un adattatore della directory che risolve i nomi dei canali e degli utenti tramite l'API Mattermost. Questo abilita le destinazioni `#channel-name` e `@username` in `openclaw message send` e nelle consegne Cron/Webhook.

Non è necessaria alcuna configurazione: l'adattatore usa il token del bot presente nella configurazione dell'account.

## Più account

Mattermost supporta più account in `channels.mattermost.accounts`:

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Principale", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Avvisi", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

I valori dell'account sostituiscono i campi di primo livello; `channels.mattermost.defaultAccount` seleziona l'account da utilizzare quando non ne viene specificato uno.

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Nessuna risposta nei canali">
    Assicurati che il bot sia nel canale e menzionalo (oncall), usa un prefisso di attivazione (onchar) oppure imposta `chatmode: "onmessage"`.
  </Accordion>
  <Accordion title="Errori di autenticazione o relativi a più account">
    - Controlla il token del bot, l'URL di base e che l'account sia abilitato.
    - Problemi con più account: le variabili di ambiente si applicano solo all'account `default`.
    - Gli host Mattermost privati/LAN richiedono `network.dangerouslyAllowPrivateNetwork: true` (per impostazione predefinita, la protezione SSRF blocca gli IP privati).

  </Accordion>
  <Accordion title="I comandi slash nativi non funzionano">
    - `Unauthorized: invalid command token.`: OpenClaw non ha accettato il token di callback. Cause tipiche:
      - la registrazione del comando slash non è riuscita o è stata completata solo parzialmente all'avvio
      - la callback raggiunge il Gateway o l'account errato
      - Mattermost conserva ancora vecchi comandi che puntano a una destinazione di callback precedente
      - il Gateway è stato riavviato senza riattivare i comandi slash
    - Se i comandi slash nativi smettono di funzionare, controlla nei log la presenza di `mattermost: failed to register slash commands` o `mattermost: native slash commands enabled but no commands could be registered`.
    - Se `callbackUrl` viene omesso e i log avvisano che la callback è stata risolta in un URL local loopback come `http://localhost:18789/...`, probabilmente tale URL è raggiungibile solo quando Mattermost viene eseguito nello stesso host/spazio dei nomi di rete di OpenClaw. Imposta invece un `commands.callbackUrl` esplicito e raggiungibile dall'esterno.

  </Accordion>
  <Accordion title="Problemi con i pulsanti">
    - I pulsanti appaiono come riquadri bianchi o non appaiono affatto: i dati del pulsante non sono validi. Ogni pulsante di presentazione richiede un `label` e un `value` (i pulsanti privi di uno dei due vengono ignorati).
    - I pulsanti vengono visualizzati, ma i clic non producono alcun effetto: verifica che il Gateway sia raggiungibile dal server Mattermost, che l'IP del server Mattermost sia incluso in `channels.mattermost.interactions.allowedSourceIps` (senza questa impostazione viene accettato solo il local loopback) e che `ServiceSettings.AllowedUntrustedInternalConnections` includa l'host di callback per le destinazioni private.
    - I pulsanti restituiscono un errore 404 al clic: probabilmente l'`id` del pulsante contiene trattini o trattini bassi. Il router delle azioni di Mattermost non funziona con ID non alfanumerici. Usa esclusivamente `[a-zA-Z0-9]`.
    - Nei log del Gateway compare `rejected callback source`: il clic proviene da un IP non incluso in `interactions.allowedSourceIps`. Aggiungi il server Mattermost o il tuo ingresso all'elenco dei consentiti e imposta `gateway.trustedProxies` se utilizzi un proxy inverso.
    - Nei log del Gateway compare `invalid _token`: mancata corrispondenza HMAC. Verifica di firmare tutti i campi del contesto (non solo un sottoinsieme), di usare chiavi ordinate e JSON compatto (senza spazi). Consulta la sezione HMAC precedente.
    - Nei log del Gateway compare `missing _token in context`: il campo `_token` non è presente nel contesto del pulsante. Assicurati che venga incluso durante la creazione del payload dell'integrazione.
    - Il Gateway rifiuta il clic con `Unknown action`: `context.action_id` non corrisponde all'`id` di alcuna azione nel post. Imposta entrambi sullo stesso valore normalizzato.
    - L'agente non propone pulsanti: aggiungi `capabilities: ["inlineButtons"]` alla configurazione del canale Mattermost.

  </Accordion>
</AccordionGroup>

## Contenuti correlati

- [Instradamento dei canali](/it/channels/channel-routing) - instradamento delle sessioni per i messaggi
- [Panoramica dei canali](/it/channels) - tutti i canali supportati
- [Gruppi](/it/channels/groups) - comportamento delle chat di gruppo e controllo tramite menzioni
- [Associazione](/it/channels/pairing) - autenticazione dei messaggi diretti e flusso di associazione
- [Sicurezza](/it/gateway/security) - modello di accesso e protezione avanzata
