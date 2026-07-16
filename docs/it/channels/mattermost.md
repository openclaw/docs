---
read_when:
    - Configurazione di Mattermost
    - Debug del routing di Mattermost
sidebarTitle: Mattermost
summary: Configurazione del bot Mattermost e configurazione di OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-07-16T14:00:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e7d2233e26c6c0a510a264001a1e0d3e528d8645ffbe2affa3f1672304185ef5
    source_path: channels/mattermost.md
    workflow: 16
---

Stato: plugin scaricabile (token del bot + eventi WebSocket). Sono supportati canali, canali privati, DM di gruppo e DM. Mattermost è una piattaforma self-hosted per la messaggistica di gruppo ([mattermost.com](https://mattermost.com)).

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
  <Step title="Verificare che il plugin sia disponibile">
    Installare `@openclaw/mattermost` con il comando precedente, quindi riavviare il Gateway se è già in esecuzione.
  </Step>
  <Step title="Creare un bot Mattermost">
    Creare un account bot Mattermost, copiare il **token del bot** e aggiungere il bot ai team e ai canali che deve leggere.
  </Step>
  <Step title="Copiare l'URL di base">
    Copiare l'**URL di base** di Mattermost (ad esempio, `https://chat.example.com`). Un eventuale `/api/v4` finale viene rimosso automaticamente.
  </Step>
  <Step title="Configurare OpenClaw e avviare il gateway">
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
Per Mattermost self-hosted su un indirizzo privato/LAN/tailnet: le richieste in uscita all'API di Mattermost passano attraverso una protezione SSRF che blocca per impostazione predefinita gli IP privati e interni. Abilitare esplicitamente con `channels.mattermost.network.dangerouslyAllowPrivateNetwork: true` (per account: `channels.mattermost.accounts.<id>.network.dangerouslyAllowPrivateNetwork`).
</Note>

## Comandi slash nativi

I comandi slash nativi devono essere abilitati esplicitamente. Quando sono abilitati, OpenClaw registra i comandi slash `oc_*` in ogni team di cui il bot è membro e riceve le richieste POST di callback sul server HTTP del gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Utilizzare quando Mattermost non può raggiungere direttamente il gateway (proxy inverso/URL pubblico).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

Comandi registrati: `/oc_status`, `/oc_model`, `/oc_models`, `/oc_new`, `/oc_help`, `/oc_think`, `/oc_reasoning`, `/oc_verbose`, `/oc_queue`. Con `nativeSkills: true`, anche i comandi delle skill vengono registrati come `/oc_<skill>`.

<AccordionGroup>
  <Accordion title="Note sul comportamento">
    - `native` e `nativeSkills` hanno come valore predefinito `"auto"`, che per Mattermost viene interpretato come disabilitato. Impostarli esplicitamente su `true`.
    - `callbackPath` ha come valore predefinito `/api/channels/mattermost/command`.
    - Se `callbackUrl` viene omesso, OpenClaw ricava `http://<gateway.customBindHost or localhost>:<gateway.port, default 18789><callbackPath>`. Per gli host di associazione con caratteri jolly (`0.0.0.0`, `::`) viene utilizzato come ripiego `localhost`.
    - Nelle configurazioni con più account, `commands` può essere impostato al livello superiore o sotto `channels.mattermost.accounts.<id>.commands` (i valori dell'account prevalgono sui campi di livello superiore).
    - I comandi slash esistenti con lo stesso trigger, creati da altre integrazioni, non vengono modificati (la registrazione li ignora); i comandi creati dal bot vengono aggiornati o ricreati quando cambia l'URL di callback.
    - Le callback dei comandi vengono convalidate con i token specifici di ciascun comando restituiti da Mattermost quando OpenClaw registra i comandi `oc_*`.
    - OpenClaw aggiorna la registrazione corrente dei comandi Mattermost prima di accettare ogni callback; in questo modo, i token obsoleti di comandi slash eliminati o rigenerati non vengono più accettati senza dover riavviare il gateway.
    - La convalida della callback non viene autorizzata se l'API di Mattermost non può confermare che il comando sia ancora corrente; le convalide non riuscite vengono memorizzate brevemente nella cache, le ricerche simultanee vengono accorpate e l'avvio di nuove ricerche viene limitato per comando per contenere la pressione degli attacchi di replay.
    - Le callback slash non vengono autorizzate se la registrazione non è riuscita, l'avvio è stato parziale o il token della callback non corrisponde al token registrato del comando risolto (un token valido per un comando non può raggiungere la convalida a monte per un comando diverso).
    - Le callback accettate ricevono una risposta temporanea "Elaborazione in corso..."; la risposta effettiva arriva come messaggio normale.

  </Accordion>
  <Accordion title="Requisito di raggiungibilità">
    L'endpoint di callback deve essere raggiungibile dal server Mattermost.

    - Non impostare `callbackUrl` su `localhost` a meno che Mattermost non sia in esecuzione sullo stesso host/spazio dei nomi di rete di OpenClaw.
    - Non impostare `callbackUrl` sull'URL di base di Mattermost, a meno che tale URL non inoltri tramite proxy inverso `/api/channels/mattermost/command` a OpenClaw.
    - Una verifica rapida consiste nell'usare `curl https://<gateway-host>/api/channels/mattermost/command`; una richiesta GET deve restituire `405 Method Not Allowed` da OpenClaw, non `404`.

  </Accordion>
  <Accordion title="Elenco consentito per il traffico in uscita di Mattermost">
    Se le callback puntano a indirizzi privati/tailnet/interni, impostare `ServiceSettings.AllowedUntrustedInternalConnections` di Mattermost in modo da includere l'host o il dominio della callback.

    Utilizzare voci host/dominio, non URL completi.

    - Corretto: `gateway.tailnet-name.ts.net`
    - Errato: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## Variabili di ambiente (account predefinito)

Se si preferiscono le variabili di ambiente, impostare quanto segue sull'host del gateway:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
Le variabili di ambiente si applicano solo all'account **predefinito** (`default`). Gli altri account devono utilizzare i valori di configurazione.

`MATTERMOST_URL` non può essere impostato da un `.env` dell'area di lavoro; vedere [File .env dell'area di lavoro](/it/gateway/security).
</Note>

## Modalità di chat

Mattermost risponde automaticamente ai DM. Il comportamento nei canali è controllato da `chatmode`:

<Tabs>
  <Tab title="oncall (predefinita)">
    Rispondere nei canali solo quando viene menzionato con @.
  </Tab>
  <Tab title="onmessage">
    Rispondere a ogni messaggio del canale.
  </Tab>
  <Tab title="onchar">
    Rispondere quando un messaggio inizia con un prefisso di attivazione.
  </Tab>
</Tabs>

Esempio di configurazione:

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"], // valore predefinito
    },
  },
}
```

Note:

- `onchar` risponde comunque alle menzioni @ esplicite.
- `channels.mattermost.requireMention` viene ancora rispettato, ma è preferibile `chatmode`. Le impostazioni `groups.<channelId>.requireMention` specifiche per canale prevalgono su entrambe.
- Dopo che il bot invia una risposta visibile nel thread di un canale, ai messaggi successivi nello stesso thread viene risposto senza una nuova menzione @ o il prefisso `onchar`, consentendo alle conversazioni multi-turno nel thread di proseguire. La partecipazione viene ricordata per 7 giorni dall'ultima risposta del bot nel thread e persiste dopo il riavvio del gateway. I thread che il bot ha solo osservato non sono interessati; per richiedere nuovamente una menzione esplicita, avviare un nuovo messaggio di primo livello.

## Thread e sessioni

Utilizzare `channels.mattermost.replyToMode` per controllare se le risposte nei canali e nei gruppi rimangono nel canale principale o avviano un thread sotto il post che le ha attivate.

- `off` (valore predefinito): rispondere in un thread solo quando il post in ingresso si trova già in un thread.
- `first`: per i post di primo livello nei canali/gruppi, avviare un thread sotto il post e instradare la conversazione verso una sessione con ambito limitato al thread.
- `all` e `batched`: attualmente hanno lo stesso comportamento di `first` per Mattermost, perché, una volta che Mattermost dispone di una radice del thread, i segmenti successivi e i contenuti multimediali continuano nello stesso thread.
- Per impostazione predefinita, i messaggi diretti utilizzano `off` anche quando è impostato `replyToMode`.

Utilizzare `channels.mattermost.replyToModeByChatType` per sostituire la modalità per le chat `direct`, `group` o `channel`. Impostare `direct` per abilitare i thread nei messaggi diretti:

- `off` (valore predefinito): i messaggi diretti rimangono senza thread in un'unica sessione continua.
- `first`, `all` o `batched`: ogni messaggio diretto di primo livello avvia un thread Mattermost associato a una nuova sessione indipendente.

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

- Le sessioni con ambito limitato al thread utilizzano l'ID del post di attivazione come radice del thread.
- `first` e `all` sono attualmente equivalenti perché, una volta che Mattermost dispone di una radice del thread, i segmenti successivi e i contenuti multimediali continuano nello stesso thread.
- Le sostituzioni per tipo di chat hanno la precedenza su `replyToMode`. Senza una sostituzione `direct`, le distribuzioni esistenti mantengono i DM lineari, senza thread.

## Controllo degli accessi (DM)

- Valore predefinito: `channels.mattermost.dmPolicy = "pairing"` (i mittenti sconosciuti ricevono un codice di associazione). Altri valori: `allowlist`, `open`, `disabled`.
- Approvare tramite:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- DM pubblici: `channels.mattermost.dmPolicy="open"` più `channels.mattermost.allowFrom=["*"]` (lo schema di configurazione impone il carattere jolly).
- `channels.mattermost.allowFrom` accetta ID utente (consigliati) e voci `accessGroup:<name>`. Vedere [Gruppi di accesso](/it/channels/access-groups).

## Canali (gruppi)

- Valore predefinito: `channels.mattermost.groupPolicy = "allowlist"` (accesso subordinato alla menzione).
- Inserire i mittenti nell'elenco consentito con `channels.mattermost.groupAllowFrom` (ID utente consigliati).
- `channels.mattermost.groupAllowFrom` accetta voci `accessGroup:<name>`. Vedere [Gruppi di accesso](/it/channels/access-groups).
- Le sostituzioni delle menzioni per canale si trovano sotto `channels.mattermost.groups.<channelId>.requireMention`, oppure sotto `channels.mattermost.groups["*"].requireMention` per un valore predefinito.
- La corrispondenza `@username` è modificabile ed è abilitata solo quando `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Canali aperti: `channels.mattermost.groupPolicy="open"` (accesso subordinato alla menzione).
- Ordine di risoluzione: `channels.mattermost.groupPolicy`, quindi `channels.defaults.groupPolicy`, quindi `"allowlist"`.
- Nota sul runtime: se la sezione `channels.mattermost` è completamente assente, durante l'esecuzione i controlli dei gruppi non vengono autorizzati e viene applicato `groupPolicy="allowlist"` (anche se è impostato `channels.defaults.groupPolicy`), registrando un avviso una sola volta.

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

Utilizzare questi formati di destinazione con `openclaw message send` o cron/webhook:

| Destinazione                         | Invia a                                                       |
| ----------------------------------- | ------------------------------------------------------------- |
| `channel:<id>`                      | Canale per ID                                                 |
| `channel:<name>` o `#channel-name` | Canale per nome, cercato nei team a cui appartiene il bot     |
| `user:<id>` o `mattermost:<id>`    | DM con tale utente                                            |
| `@username`                         | DM (nome utente risolto tramite l'API di Mattermost)          |

Gli invii in uscita supportano al massimo un allegato per messaggio; suddividere più file in invii separati.

<Warning>
Gli ID opachi senza prefisso (come `64ifufp...`) sono **ambigui** in Mattermost (ID utente o ID canale).

OpenClaw li risolve dando **priorità all'utente**:

- Se l'ID esiste come utente (`GET /api/v4/users/<id>` riesce), OpenClaw invia un **DM** risolvendo il canale diretto tramite `/api/v4/channels/direct`.
- In caso contrario, l'ID viene trattato come **ID canale**.

Se è necessario un comportamento deterministico, utilizzare sempre i prefissi espliciti (`user:<id>` / `channel:<id>`).
</Warning>

## Nuovo tentativo per il canale DM

Quando OpenClaw invia a un destinatario DM di Mattermost e deve prima risolvere il canale diretto, per impostazione predefinita ritenta gli errori temporanei di creazione del canale diretto.

Usare `channels.mattermost.dmChannelRetry` per regolare questo comportamento globalmente per il plugin Mattermost oppure `channels.mattermost.accounts.<id>.dmChannelRetry` per un singolo account. Valori predefiniti:

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

- Questo si applica solo alla creazione del canale DM (`/api/v4/channels/direct`), non a ogni chiamata API di Mattermost.
- I nuovi tentativi usano un backoff esponenziale con jitter e si applicano agli errori temporanei, come limiti di frequenza, risposte 5xx ed errori di rete o timeout.
- Gli errori client 4xx diversi da `429` sono considerati permanenti e non vengono ritentati.

## Streaming dell'anteprima

Mattermost trasmette il ragionamento, l'attività degli strumenti e il testo parziale della risposta in un **post di anteprima in bozza**, che viene finalizzato sul posto quando la risposta definitiva può essere inviata in sicurezza. In modalità `partial`, l'anteprima viene aggiornata sullo stesso ID del post anziché riempire il canale di messaggi per ogni frammento. In modalità `block`, l'anteprima alterna blocchi di testo completato e di attività degli strumenti, in modo che i blocchi precedenti rimangano visibili come post separati invece di essere sovrascritti da quello successivo. Le risposte finali contenenti contenuti multimediali o errori annullano le modifiche dell'anteprima in sospeso e usano la consegna normale anziché pubblicare un post di anteprima usa e getta.

Lo streaming dell'anteprima è **attivo per impostazione predefinita** in modalità `partial`. Configurarlo tramite `channels.mattermost.streaming.mode` (i valori scalari/booleani legacy `streaming` vengono migrati da `openclaw doctor --fix`):

```json5
{
  channels: {
    mattermost: {
      streaming: { mode: "partial" }, // off | partial | block | progress
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Modalità di streaming">
    - `partial` (predefinita): un singolo post di anteprima che viene modificato man mano che la risposta cresce, quindi finalizzato con la risposta completa.
    - `block` alterna l'anteprima tra blocchi di testo completato e di attività degli strumenti, in modo che ogni blocco rimanga visibile come post separato invece di essere sovrascritto sul posto. Gli aggiornamenti paralleli e consecutivi degli strumenti condividono il post corrente dell'attività degli strumenti.
    - `progress` mostra un'anteprima dello stato durante la generazione e pubblica la risposta finale solo al completamento.
    - `off` disattiva lo streaming dell'anteprima. Con `streaming.block.enabled: true`, i blocchi completati dell'assistente vengono comunque consegnati come normali risposte a blocchi (post separati), anziché come un singolo post finale aggregato.

  </Accordion>
  <Accordion title="Note sul comportamento dello streaming">
    - Se lo stream non può essere finalizzato sul posto (ad esempio, se il post è stato eliminato durante lo streaming), OpenClaw ricorre all'invio di un nuovo post finale, così la risposta non viene mai persa.
    - I payload contenenti solo il ragionamento vengono esclusi dai post del canale, incluso il testo che arriva come citazione `> Thinking`. Impostare `/reasoning on` per visualizzare il ragionamento in altre superfici; il post finale di Mattermost contiene solo la risposta.
    - Consultare [Streaming](/it/concepts/streaming#preview-streaming-modes) per la matrice di associazione dei canali.

  </Accordion>
</AccordionGroup>

## Reazioni (strumento messaggi)

- Usare `message action=react` con `channel=mattermost`.
- `messageId` è l'ID del post Mattermost.
- `emoji` accetta nomi come `thumbsup` o `:+1:` (i due punti sono facoltativi).
- Impostare `remove=true` (booleano) per rimuovere una reazione.
- Gli eventi di aggiunta/rimozione delle reazioni vengono inoltrati come eventi di sistema alla sessione dell'agente instradata, nel rispetto degli stessi controlli dei criteri DM/gruppo applicati ai messaggi.

Esempi:

```text
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Configurazione:

- `channels.mattermost.actions.reactions`: abilita/disabilita le azioni di reazione (valore predefinito: true).
- Override per account: `channels.mattermost.accounts.<id>.actions.reactions`.

## Pulsanti interattivi (strumento messaggi)

Inviare messaggi con pulsanti cliccabili. Quando un utente fa clic su un pulsante, l'agente riceve la selezione e può rispondere.

I pulsanti provengono dal payload semantico `presentation` (nelle normali risposte dell'agente e in `message action=send`). OpenClaw visualizza i pulsanti con valore come pulsanti interattivi di Mattermost, mantiene visibili i pulsanti URL nel testo del messaggio e converte i menu di selezione in testo leggibile.

```text
message action=send channel=mattermost target=channel:<channelId> presentation={"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"yes"},{"label":"No","value":"no"}]}]}
```

Campi dei pulsanti di presentazione:

<ParamField path="label" type="string" required>
  Etichetta visualizzata (alias: `text`).
</ParamField>
<ParamField path="value" type="string">
  Valore restituito al clic, usato come ID dell'azione (alias: `callback_data`, `callbackData`). Obbligatorio per un pulsante cliccabile, a meno che non sia impostato `url`.
</ParamField>
<ParamField path="url" type="string">
  Pulsante di collegamento; visualizzato come testo `label: url` nel corpo del messaggio anziché come pulsante interattivo.
</ParamField>
<ParamField path="style" type='"primary" | "secondary" | "success" | "danger"'>
  Stile del pulsante. Mattermost applica lo stile predefinito ai valori che non supporta.
</ParamField>

Per indicare il supporto dei pulsanti nel prompt di sistema dell'agente, aggiungere `inlineButtons` alle funzionalità del canale:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

Quando un utente fa clic su un pulsante:

<Steps>
  <Step title="Controllo dell'accesso">
    Chi fa clic deve superare gli stessi controlli dei criteri DM/gruppo applicati al mittente di un messaggio; i clic non autorizzati ricevono una notifica effimera e vengono ignorati.
  </Step>
  <Step title="Pulsanti sostituiti dalla conferma">
    Tutti i pulsanti vengono sostituiti da una riga di conferma (ad esempio, "✓ **Yes** selezionato da @user").
  </Step>
  <Step title="L'agente riceve la selezione">
    L'agente riceve la selezione come messaggio in entrata (oltre a un evento di sistema) e risponde.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Note sull'implementazione">
    - I callback dei pulsanti usano la verifica HMAC-SHA256 (automatica, non richiede configurazione).
    - L'intero blocco dell'allegato viene sostituito al clic, pertanto tutti i pulsanti vengono rimossi insieme: la rimozione parziale non è possibile.
    - Gli ID delle azioni contenenti trattini o caratteri di sottolineatura vengono normalizzati automaticamente (limitazione dell'instradamento di Mattermost).
    - I clic il cui `action_id` non corrisponde a un'azione del post originale vengono rifiutati con `403` ("Azione sconosciuta").

  </Accordion>
  <Accordion title="Configurazione e raggiungibilità">
    - `channels.mattermost.capabilities`: array di stringhe di funzionalità. Aggiungere `"inlineButtons"` per abilitare la descrizione dello strumento dei pulsanti nel prompt di sistema dell'agente.
    - `channels.mattermost.interactions.callbackBaseUrl`: URL di base esterno facoltativo per i callback dei pulsanti (ad esempio `https://gateway.example.com`). Usarlo quando Mattermost non può raggiungere direttamente il Gateway presso il relativo host di associazione.
    - Nelle configurazioni con più account, è possibile impostare lo stesso campo anche in `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - Se `interactions.callbackBaseUrl` viene omesso, OpenClaw deriva l'URL di callback da `gateway.customBindHost` + `gateway.port` (valore predefinito: 18789), quindi ricorre a `http://localhost:<port>`. Il percorso del callback è `/mattermost/interactions/<accountId>`.
    - Regola di raggiungibilità: l'URL di callback del pulsante deve essere raggiungibile dal server Mattermost. `localhost` funziona solo quando Mattermost e OpenClaw sono in esecuzione nello stesso host/spazio dei nomi di rete.
    - `channels.mattermost.interactions.allowedSourceIps`: elenco degli IP di origine consentiti per i callback dei pulsanti. Senza di esso, vengono accettate solo le origini di loopback (`127.0.0.1`, `::1`); pertanto, un server Mattermost remoto deve essere aggiunto all'elenco qui, altrimenti i relativi clic vengono rifiutati con `403`. Dietro un proxy inverso, impostare anche `gateway.trustedProxies` affinché l'IP reale del client venga derivato dalle intestazioni inoltrate.
    - Se la destinazione del callback è privata, su tailnet o interna, aggiungerne l'host/dominio a `ServiceSettings.AllowedUntrustedInternalConnections` di Mattermost.

  </Accordion>
</AccordionGroup>

### Integrazione API diretta (script esterni)

Gli script esterni e i webhook possono pubblicare pulsanti direttamente tramite l'API REST di Mattermost anziché passare dallo strumento `message` dell'agente. È preferibile usare lo strumento `message` di OpenClaw. Per le integrazioni dirette, importare `buildButtonAttachments` da `@openclaw/mattermost/api.js`; se si pubblica JSON non elaborato, seguire queste regole:

**Struttura del payload:**

```json5
{
  channel_id: "<channelId>",
  message: "Scegliere un'opzione:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // solo caratteri alfanumerici - vedere sotto
            type: "button", // obbligatorio, altrimenti i clic vengono ignorati senza avviso
            name: "Approva", // etichetta visualizzata
            style: "primary", // facoltativo: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // deve corrispondere all'ID del pulsante
                action: "approve",
                // ... eventuali campi personalizzati ...
                _token: "<hmac>", // vedere la sezione HMAC sotto
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

1. Gli allegati vanno in `props.attachments`, non in `attachments` di primo livello (altrimenti vengono ignorati senza avviso).
2. Ogni azione richiede `type: "button"`: senza di esso, i clic vengono ignorati senza avviso.
3. Ogni azione richiede un campo `id`: Mattermost ignora le azioni senza ID.
4. Il valore `id` dell'azione deve contenere **solo caratteri alfanumerici** (`[a-zA-Z0-9]`). I trattini e i caratteri di sottolineatura interrompono l'instradamento delle azioni lato server di Mattermost (restituisce 404). Rimuoverli prima dell'uso.
5. `context.action_id` deve corrispondere al valore `id` del pulsante; il Gateway rifiuta i clic il cui `action_id` non esiste nel post.
6. `context.action_id` è obbligatorio: il gestore delle interazioni restituisce 400 senza di esso.
7. L'IP di origine del callback deve essere consentito (vedere `interactions.allowedSourceIps` sopra).

</Warning>

**Generazione del token HMAC**

Il Gateway verifica i clic sui pulsanti con HMAC-SHA256. Gli script esterni devono generare token che corrispondano alla logica di verifica del Gateway:

<Steps>
  <Step title="Derivare il segreto dal token del bot">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`, codificato in esadecimale.
  </Step>
  <Step title="Creare l'oggetto di contesto">
    Creare l'oggetto di contesto con tutti i campi **tranne** `_token`.
  </Step>
  <Step title="Serializzare con le chiavi ordinate">
    Serializzare con le **chiavi ordinate ricorsivamente** e **senza spazi** (il Gateway rende canonici anche gli oggetti annidati e produce JSON compatto).
  </Step>
  <Step title="Firmare il payload">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Aggiungere il token">
    Aggiungere il digest esadecimale risultante come `_token` nel contesto.
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
  <Accordion title="Problemi comuni con HMAC">
    - `json.dumps` di Python aggiunge spazi per impostazione predefinita (`{"key": "val"}`). Usare `separators=(",", ":")` per ottenere lo stesso output compatto di JavaScript (`{"key":"val"}`).
    - Firmare sempre **tutti** i campi del contesto (tranne `_token`). Il Gateway rimuove `_token`, quindi firma tutti i campi rimanenti. La firma di un sottoinsieme causa un errore di verifica silenzioso.
    - Usare `sort_keys=True`: il Gateway ordina le chiavi prima della firma e Mattermost potrebbe riordinare i campi del contesto quando archivia il payload.
    - Derivare il segreto dal token del bot (in modo deterministico), non da byte casuali. Il segreto deve essere lo stesso nel processo che crea i pulsanti e nel Gateway che esegue la verifica.

  </Accordion>
</AccordionGroup>

## Adattatore della directory

Il Plugin Mattermost include un adattatore della directory che risolve i nomi dei canali e degli utenti tramite l'API di Mattermost. Ciò abilita le destinazioni `#channel-name` e `@username` in `openclaw message send` e nelle consegne Cron/Webhook.

Non è necessaria alcuna configurazione: l'adattatore usa il token del bot dalla configurazione dell'account.

## Account multipli

Mattermost supporta più account in `channels.mattermost.accounts`:

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

I valori dell'account sostituiscono i campi di primo livello; `channels.mattermost.defaultAccount` seleziona l'account da usare quando non ne viene specificato alcuno.

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Nessuna risposta nei canali">
    Assicurarsi che il bot sia nel canale e menzionarlo (oncall), usare un prefisso di attivazione (onchar) oppure impostare `chatmode: "onmessage"`.
  </Accordion>
  <Accordion title="Errori di autenticazione o relativi agli account multipli">
    - Controllare il token del bot, l'URL di base e che l'account sia abilitato.
    - Problemi con gli account multipli: le variabili di ambiente si applicano solo all'account `default`.
    - Gli host Mattermost privati/LAN richiedono `network.dangerouslyAllowPrivateNetwork: true` (la protezione SSRF blocca per impostazione predefinita gli IP privati).

  </Accordion>
  <Accordion title="I comandi slash nativi non funzionano">
    - `Unauthorized: invalid command token.`: OpenClaw non ha accettato il token di callback. Cause tipiche:
      - la registrazione del comando slash non è riuscita o è stata completata solo parzialmente all'avvio
      - il callback raggiunge il Gateway o l'account errato
      - Mattermost contiene ancora vecchi comandi che puntano a una destinazione di callback precedente
      - il Gateway è stato riavviato senza riattivare i comandi slash
    - Se i comandi slash nativi smettono di funzionare, controllare nei log la presenza di `mattermost: failed to register slash commands` o `mattermost: native slash commands enabled but no commands could be registered`.
    - Se `callbackUrl` viene omesso e i log avvertono che il callback è stato risolto in un URL di loopback come `http://localhost:18789/...`, tale URL è probabilmente raggiungibile solo quando Mattermost viene eseguito nello stesso host o spazio dei nomi di rete di OpenClaw. Impostare invece un `commands.callbackUrl` esplicito e raggiungibile dall'esterno.

  </Accordion>
  <Accordion title="Problemi con i pulsanti">
    - I pulsanti appaiono come riquadri bianchi o non appaiono affatto: i dati del pulsante non sono validi. Ogni pulsante di presentazione richiede un `label` e un `value` (i pulsanti privi di uno dei due vengono ignorati).
    - I pulsanti vengono visualizzati, ma i clic non producono alcun effetto: verificare che il Gateway sia raggiungibile dal server Mattermost, che l'IP del server Mattermost sia incluso in `channels.mattermost.interactions.allowedSourceIps` (senza questa impostazione viene accettato solo il loopback) e che `ServiceSettings.AllowedUntrustedInternalConnections` includa l'host del callback per le destinazioni private.
    - I pulsanti restituiscono 404 al clic: il valore `id` del pulsante probabilmente contiene trattini o caratteri di sottolineatura. Il router delle azioni di Mattermost non funziona con ID non alfanumerici. Usare solo `[a-zA-Z0-9]`.
    - Il Gateway registra `rejected callback source`: il clic proviene da un IP esterno a `interactions.allowedSourceIps`. Aggiungere il server Mattermost o il punto di ingresso alla lista consentita e impostare `gateway.trustedProxies` dietro un proxy inverso.
    - Il Gateway registra `invalid _token`: mancata corrispondenza HMAC. Verificare di firmare tutti i campi del contesto (non un sottoinsieme), usare chiavi ordinate e JSON compatto (senza spazi). Consultare la sezione HMAC precedente.
    - Il Gateway registra `missing _token in context`: il campo `_token` non è presente nel contesto del pulsante. Assicurarsi che sia incluso durante la creazione del payload dell'integrazione.
    - Il Gateway rifiuta il clic con `Unknown action`: `context.action_id` non corrisponde ad alcun `id` di azione nel post. Impostare entrambi sullo stesso valore normalizzato.
    - L'agente non propone pulsanti: aggiungere `capabilities: ["inlineButtons"]` alla configurazione del canale Mattermost.

  </Accordion>
</AccordionGroup>

## Argomenti correlati

- [Instradamento dei canali](/it/channels/channel-routing) - instradamento delle sessioni per i messaggi
- [Panoramica dei canali](/it/channels) - tutti i canali supportati
- [Gruppi](/it/channels/groups) - comportamento delle chat di gruppo e controllo tramite menzioni
- [Associazione](/it/channels/pairing) - autenticazione dei messaggi diretti e flusso di associazione
- [Sicurezza](/it/gateway/security) - modello di accesso e rafforzamento della sicurezza
