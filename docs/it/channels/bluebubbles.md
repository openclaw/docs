---
read_when:
    - Configurazione del canale BlueBubbles
    - Risoluzione dei problemi di associazione del Webhook
    - Configurazione di iMessage su macOS
sidebarTitle: BlueBubbles
summary: iMessage tramite server macOS BlueBubbles (invio/ricezione REST, digitazione, reazioni, associazione, azioni avanzate).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-26T11:23:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9a9eef02110f9e40f60c0bbd413c7ad7e33c377a7cf9ca2ae43aa170100ff77
    source_path: channels/bluebubbles.md
    workflow: 15
---

Stato: Plugin incluso che comunica con il server macOS BlueBubbles tramite HTTP. **Consigliato per l'integrazione con iMessage** grazie alla sua API più ricca e alla configurazione più semplice rispetto al canale imsg legacy.

<Note>
Le versioni attuali di OpenClaw includono BlueBubbles, quindi le normali build pacchettizzate non richiedono un passaggio separato `openclaw plugins install`.
</Note>

## Panoramica

- Funziona su macOS tramite l'app helper BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Consigliato/testato: macOS Sequoia (15). macOS Tahoe (26) funziona; la modifica è attualmente non funzionante su Tahoe e gli aggiornamenti dell'icona del gruppo possono risultare riusciti ma non sincronizzarsi.
- OpenClaw comunica con esso tramite la sua API REST (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- I messaggi in ingresso arrivano tramite Webhook; le risposte in uscita, gli indicatori di digitazione, le conferme di lettura e i tapback sono chiamate REST.
- Gli allegati e gli sticker vengono acquisiti come contenuti multimediali in ingresso (e mostrati all'agente quando possibile).
- Le risposte automatiche TTS che sintetizzano audio MP3 o CAF vengono recapitate come bolle memo vocali di iMessage invece che come semplici allegati di file.
- L'associazione/lista consentiti funziona allo stesso modo degli altri canali (`/channels/pairing` ecc.) con `channels.bluebubbles.allowFrom` + codici di associazione.
- Le reazioni vengono mostrate come eventi di sistema proprio come in Slack/Telegram, così gli agenti possono "menzionarle" prima di rispondere.
- Funzionalità avanzate: modifica, annullamento invio, thread di risposta, effetti dei messaggi, gestione dei gruppi.

## Avvio rapido

<Steps>
  <Step title="Install BlueBubbles">
    Installa il server BlueBubbles sul tuo Mac (segui le istruzioni su [bluebubbles.app/install](https://bluebubbles.app/install)).
  </Step>
  <Step title="Enable the web API">
    Nella configurazione di BlueBubbles, abilita l'API web e imposta una password.
  </Step>
  <Step title="Configure OpenClaw">
    Esegui `openclaw onboard` e seleziona BlueBubbles, oppure configura manualmente:

    ```json5
    {
      channels: {
        bluebubbles: {
          enabled: true,
          serverUrl: "http://192.168.1.100:1234",
          password: "example-password",
          webhookPath: "/bluebubbles-webhook",
        },
      },
    }
    ```

  </Step>
  <Step title="Point webhooks at the gateway">
    Punta i Webhook al tuo Gateway (esempio: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
  </Step>
  <Step title="Start the gateway">
    Avvia il Gateway; registrerà il gestore Webhook e inizierà l'associazione.
  </Step>
</Steps>

<Warning>
**Sicurezza**

- Imposta sempre una password per il Webhook.
- L'autenticazione del Webhook è sempre obbligatoria. OpenClaw rifiuta le richieste Webhook BlueBubbles a meno che non includano una password/guid che corrisponda a `channels.bluebubbles.password` (ad esempio `?password=<password>` o `x-password`), indipendentemente dalla topologia loopback/proxy.
- L'autenticazione tramite password viene verificata prima della lettura/analisi dei corpi completi dei Webhook.

</Warning>

## Mantenere attivo Messages.app (configurazioni VM / headless)

Alcune configurazioni macOS VM / sempre attive possono finire con Messages.app in stato "idle" (gli eventi in ingresso si interrompono finché l'app non viene aperta/portata in primo piano). Una semplice soluzione alternativa è **stimolare Messages ogni 5 minuti** usando un AppleScript + LaunchAgent.

<Steps>
  <Step title="Save the AppleScript">
    Salva questo come `~/Scripts/poke-messages.scpt`:

    ```applescript
    try
      tell application "Messages"
        if not running then
          launch
        end if

        -- Touch the scripting interface to keep the process responsive.
        set _chatCount to (count of chats)
      end tell
    on error
      -- Ignore transient failures (first-run prompts, locked session, etc).
    end try
    ```

  </Step>
  <Step title="Install a LaunchAgent">
    Salva questo come `~/Library/LaunchAgents/com.user.poke-messages.plist`:

    ```xml
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
      <dict>
        <key>Label</key>
        <string>com.user.poke-messages</string>

        <key>ProgramArguments</key>
        <array>
          <string>/bin/bash</string>
          <string>-lc</string>
          <string>/usr/bin/osascript &quot;$HOME/Scripts/poke-messages.scpt&quot;</string>
        </array>

        <key>RunAtLoad</key>
        <true/>

        <key>StartInterval</key>
        <integer>300</integer>

        <key>StandardOutPath</key>
        <string>/tmp/poke-messages.log</string>
        <key>StandardErrorPath</key>
        <string>/tmp/poke-messages.err</string>
      </dict>
    </plist>
    ```

    Questo viene eseguito **ogni 300 secondi** e **all'accesso**. La prima esecuzione può attivare le richieste macOS di **Automazione** (`osascript` → Messages). Approvale nella stessa sessione utente che esegue il LaunchAgent.

  </Step>
  <Step title="Load it">
    ```bash
    launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
    launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
    ```
  </Step>
</Steps>

## Onboarding

BlueBubbles è disponibile nell'onboarding interattivo:

```
openclaw onboard
```

La procedura guidata richiede:

<ParamField path="Server URL" type="string" required>
  Indirizzo del server BlueBubbles (ad esempio `http://192.168.1.100:1234`).
</ParamField>
<ParamField path="Password" type="string" required>
  Password API dalle impostazioni di BlueBubbles Server.
</ParamField>
<ParamField path="Webhook path" type="string" default="/bluebubbles-webhook">
  Percorso dell'endpoint Webhook.
</ParamField>
<ParamField path="DM policy" type="string">
  `pairing`, `allowlist`, `open` o `disabled`.
</ParamField>
<ParamField path="Allow list" type="string[]">
  Numeri di telefono, email o destinazioni chat.
</ParamField>

Puoi anche aggiungere BlueBubbles tramite CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Controllo degli accessi (DM + gruppi)

<Tabs>
  <Tab title="DMs">
    - Predefinito: `channels.bluebubbles.dmPolicy = "pairing"`.
    - I mittenti sconosciuti ricevono un codice di associazione; i messaggi vengono ignorati fino all'approvazione (i codici scadono dopo 1 ora).
    - Approva tramite:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - L'associazione è lo scambio di token predefinito. Dettagli: [Associazione](/it/channels/pairing)

  </Tab>
  <Tab title="Groups">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (predefinito: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom` controlla chi può attivare nei gruppi quando è impostato `allowlist`.

  </Tab>
</Tabs>

### Arricchimento dei nomi dei contatti (macOS, facoltativo)

I Webhook di gruppo di BlueBubbles spesso includono solo indirizzi grezzi dei partecipanti. Se vuoi che il contesto `GroupMembers` mostri invece i nomi dei contatti locali, puoi attivare facoltativamente l'arricchimento dai Contatti locali su macOS:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` abilita la ricerca. Predefinito: `false`.
- Le ricerche vengono eseguite solo dopo che l'accesso al gruppo, l'autorizzazione dei comandi e il filtro delle menzioni hanno consentito il passaggio del messaggio.
- Vengono arricchiti solo i partecipanti telefonici senza nome.
- I numeri di telefono grezzi restano il fallback quando non viene trovata alcuna corrispondenza locale.

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### Filtro delle menzioni (gruppi)

BlueBubbles supporta il filtro delle menzioni per le chat di gruppo, in linea con il comportamento di iMessage/WhatsApp:

- Usa `agents.list[].groupChat.mentionPatterns` (oppure `messages.groupChat.mentionPatterns`) per rilevare le menzioni.
- Quando `requireMention` è abilitato per un gruppo, l'agente risponde solo quando viene menzionato.
- I comandi di controllo dei mittenti autorizzati bypassano il filtro delle menzioni.

Configurazione per gruppo:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // predefinito per tutti i gruppi
        "iMessage;-;chat123": { requireMention: false }, // override per un gruppo specifico
      },
    },
  },
}
```

### Filtro dei comandi

- I comandi di controllo (ad esempio `/config`, `/model`) richiedono autorizzazione.
- Usa `allowFrom` e `groupAllowFrom` per determinare l'autorizzazione dei comandi.
- I mittenti autorizzati possono eseguire i comandi di controllo anche senza menzionare nei gruppi.

### Prompt di sistema per gruppo

Ogni voce sotto `channels.bluebubbles.groups.*` accetta una stringa facoltativa `systemPrompt`. Il valore viene iniettato nel prompt di sistema dell'agente a ogni turno che gestisce un messaggio in quel gruppo, così puoi impostare regole di persona o comportamento per gruppo senza modificare i prompt dell'agente:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "Mantieni le risposte sotto le 3 frasi. Rispecchia il tono informale del gruppo.",
        },
      },
    },
  },
}
```

La chiave corrisponde a qualunque valore BlueBubbles riporti come `chatGuid` / `chatIdentifier` / `chatId` numerico per il gruppo, e una voce jolly `"*"` fornisce un valore predefinito per ogni gruppo senza una corrispondenza esatta (lo stesso schema usato da `requireMention` e dalle policy degli strumenti per gruppo). Le corrispondenze esatte hanno sempre la priorità sul jolly. I DM ignorano questo campo; usa invece la personalizzazione del prompt a livello di agente o account.

#### Esempio pratico: risposte in thread e reazioni tapback (Private API)

Con la Private API BlueBubbles abilitata, i messaggi in ingresso arrivano con ID messaggio brevi (ad esempio `[[reply_to:5]]`) e l'agente può chiamare `action=reply` per inserire la risposta in un messaggio specifico oppure `action=react` per aggiungere un tapback. Un `systemPrompt` per gruppo è un modo affidabile per fare in modo che l'agente scelga lo strumento corretto:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "Quando rispondi in questo gruppo, chiama sempre action=reply con il",
            "messageId [[reply_to:N]] dal contesto in modo che la tua risposta venga inserita nel thread",
            "sotto il messaggio che l'ha attivata. Non inviare mai un nuovo messaggio scollegato.",
            "",
            "Per conferme brevi ('ok', 'ricevuto', 'ci penso io'), usa",
            "action=react con un'emoji tapback appropriata (❤️, 👍, 😂, ‼️, ❓)",
            "invece di inviare una risposta testuale.",
          ].join(" "),
        },
      },
    },
  },
}
```

Le reazioni tapback e le risposte in thread richiedono entrambe la Private API BlueBubbles; vedi [Azioni avanzate](#advanced-actions) e [ID messaggio](#message-ids-short-vs-full) per il funzionamento sottostante.

## Associazioni conversazione ACP

Le chat BlueBubbles possono essere trasformate in workspace ACP persistenti senza modificare il livello di trasporto.

Flusso operativo rapido:

- Esegui `/acp spawn codex --bind here` all'interno del DM o della chat di gruppo consentita.
- I messaggi futuri nella stessa conversazione BlueBubbles verranno instradati verso la sessione ACP avviata.
- `/new` e `/reset` reimpostano sul posto la stessa sessione ACP associata.
- `/acp close` chiude la sessione ACP e rimuove l'associazione.

Sono supportate anche associazioni persistenti configurate tramite voci `bindings[]` di primo livello con `type: "acp"` e `match.channel: "bluebubbles"`.

`match.peer.id` può usare qualsiasi formato di destinazione BlueBubbles supportato:

- handle DM normalizzato come `+15555550123` o `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Per associazioni di gruppo stabili, preferisci `chat_id:*` o `chat_identifier:*`.

Esempio:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "bluebubbles",
        accountId: "default",
        peer: { kind: "dm", id: "+15555550123" },
      },
      acp: { label: "codex-imessage" },
    },
  ],
}
```

Vedi [Agenti ACP](/it/tools/acp-agents) per il comportamento condiviso delle associazioni ACP.

## Digitazione + conferme di lettura

- **Indicatori di digitazione**: inviati automaticamente prima e durante la generazione della risposta.
- **Conferme di lettura**: controllate da `channels.bluebubbles.sendReadReceipts` (predefinito: `true`).
- **Indicatori di digitazione**: OpenClaw invia eventi di avvio digitazione; BlueBubbles cancella automaticamente la digitazione all'invio o al timeout (l'arresto manuale tramite DELETE non è affidabile).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // disabilita le conferme di lettura
    },
  },
}
```

## Azioni avanzate

BlueBubbles supporta azioni avanzate sui messaggi quando abilitate nella configurazione:

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapback (predefinito: true)
        edit: true, // modifica dei messaggi inviati (macOS 13+, non funzionante su macOS 26 Tahoe)
        unsend: true, // annulla invio dei messaggi (macOS 13+)
        reply: true, // risposte in thread tramite GUID del messaggio
        sendWithEffect: true, // effetti messaggio (slam, loud, ecc.)
        renameGroup: true, // rinomina chat di gruppo
        setGroupIcon: true, // imposta icona/foto della chat di gruppo (instabile su macOS 26 Tahoe)
        addParticipant: true, // aggiunge partecipanti ai gruppi
        removeParticipant: true, // rimuove partecipanti dai gruppi
        leaveGroup: true, // esce dalle chat di gruppo
        sendAttachment: true, // invia allegati/media
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Azioni disponibili">
    - **react**: aggiunge/rimuove reazioni tapback (`messageId`, `emoji`, `remove`). L'insieme nativo di tapback di iMessage è `love`, `like`, `dislike`, `laugh`, `emphasize` e `question`. Quando un agente sceglie un'emoji al di fuori di questo insieme (ad esempio `👀`), lo strumento di reazione usa come fallback `love` così il tapback viene comunque visualizzato invece di far fallire l'intera richiesta. Le reazioni di conferma configurate continuano invece a essere validate in modo rigoroso e restituiscono errore per valori sconosciuti.
    - **edit**: modifica un messaggio inviato (`messageId`, `text`).
    - **unsend**: annulla l'invio di un messaggio (`messageId`).
    - **reply**: risponde a un messaggio specifico (`messageId`, `text`, `to`).
    - **sendWithEffect**: invia con effetto iMessage (`text`, `to`, `effectId`).
    - **renameGroup**: rinomina una chat di gruppo (`chatGuid`, `displayName`).
    - **setGroupIcon**: imposta l'icona/foto di una chat di gruppo (`chatGuid`, `media`) — instabile su macOS 26 Tahoe (l'API può restituire successo ma l'icona non si sincronizza).
    - **addParticipant**: aggiunge qualcuno a un gruppo (`chatGuid`, `address`).
    - **removeParticipant**: rimuove qualcuno da un gruppo (`chatGuid`, `address`).
    - **leaveGroup**: esce da una chat di gruppo (`chatGuid`).
    - **upload-file**: invia media/file (`to`, `buffer`, `filename`, `asVoice`).
      - Memo vocali: imposta `asVoice: true` con audio **MP3** o **CAF** per inviare un messaggio vocale iMessage. BlueBubbles converte MP3 → CAF quando invia memo vocali.
    - Alias legacy: `sendAttachment` continua a funzionare, ma `upload-file` è il nome canonico dell'azione.

  </Accordion>
</AccordionGroup>

### ID messaggio (brevi vs completi)

OpenClaw può mostrare ID messaggio _brevi_ (ad esempio `1`, `2`) per risparmiare token.

- `MessageSid` / `ReplyToId` possono essere ID brevi.
- `MessageSidFull` / `ReplyToIdFull` contengono gli ID completi del provider.
- Gli ID brevi sono in memoria; possono scadere dopo un riavvio o dopo lo svuotamento della cache.
- Le azioni accettano `messageId` brevi o completi, ma gli ID brevi restituiscono errore se non sono più disponibili.

Usa gli ID completi per automazioni e archiviazione persistenti:

- Template: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Contesto: `MessageSidFull` / `ReplyToIdFull` nei payload in ingresso

Vedi [Configurazione](/it/gateway/configuration) per le variabili di template.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Fusione dei DM split-send (comando + URL in un'unica composizione)

Quando un utente digita insieme un comando e un URL in iMessage — ad esempio `Dump https://example.com/article` — Apple divide l'invio in **due consegne Webhook separate**:

1. Un messaggio di testo (`"Dump"`).
2. Un balloon di anteprima URL (`"https://..."`) con immagini di anteprima OG come allegati.

I due Webhook arrivano a OpenClaw a circa 0,8-2,0 s di distanza nella maggior parte delle configurazioni. Senza fusione, l'agente riceve solo il comando al turno 1, risponde (spesso con "inviami l'URL") e vede l'URL solo al turno 2 — momento in cui il contesto del comando è già andato perso.

`channels.bluebubbles.coalesceSameSenderDms` consente in un DM di unire Webhook consecutivi dello stesso mittente in un unico turno dell'agente. Le chat di gruppo continuano invece a usare il per-messaggio, così viene preservata la struttura dei turni multiutente.

<Tabs>
  <Tab title="Quando abilitarlo">
    Abilitalo quando:

    - distribuisci Skills che si aspettano `comando + payload` in un unico messaggio (dump, paste, save, queue, ecc.).
    - i tuoi utenti incollano URL, immagini o contenuti lunghi insieme ai comandi.
    - puoi accettare la latenza aggiuntiva del turno DM (vedi sotto).

    Lascialo disabilitato quando:

    - hai bisogno della latenza minima per trigger DM composti da una sola parola.
    - tutti i tuoi flussi sono comandi one-shot senza payload successivi.

  </Tab>
  <Tab title="Abilitazione">
    ```json5
    {
      channels: {
        bluebubbles: {
          coalesceSameSenderDms: true, // attiva esplicitamente (predefinito: false)
        },
      },
    }
    ```

    Con il flag attivo e senza un valore esplicito `messages.inbound.byChannel.bluebubbles`, la finestra di debounce si amplia a **2500 ms** (il valore predefinito senza fusione è 500 ms). La finestra più ampia è necessaria — la cadenza split-send di Apple di 0,8-2,0 s non rientra nel valore predefinito più stretto.

    Per regolare manualmente la finestra:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500 ms funziona per la maggior parte delle configurazioni; aumenta a 4000 ms se il tuo Mac è lento
            // o sotto pressione di memoria (in quel caso l'intervallo osservato può superare i 2 s).
            bluebubbles: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Compromessi">
    - **Latenza aggiuntiva per i comandi di controllo DM.** Con il flag attivo, i messaggi di comando di controllo DM (come `Dump`, `Save`, ecc.) ora attendono fino alla finestra di debounce prima dell'invio, nel caso stia arrivando un Webhook con payload. I comandi nelle chat di gruppo restano immediati.
    - **L'output unito è limitato** — il testo unito è limitato a 4000 caratteri con un marcatore esplicito `…[truncated]`; gli allegati sono limitati a 20; le voci sorgente sono limitate a 10 (oltre quel limite vengono mantenuti il primo e l'ultimo). Ogni `messageId` sorgente raggiunge comunque il dedupe in ingresso, così un successivo replay MessagePoller di qualsiasi evento individuale viene riconosciuto come duplicato.
    - **Attivazione esplicita, per canale.** Gli altri canali (Telegram, WhatsApp, Slack, …) non sono interessati.

  </Tab>
</Tabs>

### Scenari e cosa vede l'agente

| Composizione utente                                                 | Consegna Apple             | Flag disattivato (predefinito)          | Flag attivato + finestra 2500 ms                                          |
| ------------------------------------------------------------------- | -------------------------- | --------------------------------------- | -------------------------------------------------------------------------- |
| `Dump https://example.com` (un solo invio)                          | 2 Webhook a ~1 s di distanza | Due turni agente: solo "Dump", poi URL  | Un turno: testo unito `Dump https://example.com`                           |
| `Save this 📎image.jpg caption` (allegato + testo)                  | 2 Webhook                  | Due turni                               | Un turno: testo + immagine                                                 |
| `/status` (comando standalone)                                      | 1 Webhook                  | Invio immediato                         | **Attende fino alla finestra, poi invia**                                  |
| URL incollato da solo                                               | 1 Webhook                  | Invio immediato                         | Invio immediato (solo una voce nel bucket)                                 |
| Testo + URL inviati come due messaggi separati deliberati, a minuti di distanza | 2 Webhook fuori finestra   | Due turni                               | Due turni (la finestra scade tra i due)                                    |
| Flusso rapido (>10 piccoli DM nella finestra)                       | N Webhook                  | N turni                                 | Un turno, output limitato (primo + ultimo, con limiti testo/allegati applicati) |

### Risoluzione dei problemi della fusione split-send

Se il flag è attivo e gli split-send arrivano comunque come due turni, controlla ogni livello:

<AccordionGroup>
  <Accordion title="Configurazione effettivamente caricata">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    Poi `openclaw gateway restart` — il flag viene letto alla creazione del registro debounce.

  </Accordion>
  <Accordion title="Finestra di debounce abbastanza ampia per la tua configurazione">
    Guarda il log del server BlueBubbles in `~/Library/Logs/bluebubbles-server/main.log`:

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    Misura l'intervallo tra l'invio del testo in stile `"Dump"` e il successivo invio `"https://..."; Attachments:`. Aumenta `messages.inbound.byChannel.bluebubbles` in modo da coprire comodamente quell'intervallo.

  </Accordion>
  <Accordion title="I timestamp JSONL di sessione ≠ arrivo del Webhook">
    I timestamp degli eventi di sessione (`~/.openclaw/agents/<id>/sessions/*.jsonl`) riflettono quando il Gateway consegna un messaggio all'agente, **non** quando è arrivato il Webhook. Un secondo messaggio in coda etichettato `[Queued messages while agent was busy]` significa che il primo turno era ancora in esecuzione quando è arrivato il secondo Webhook — il bucket di fusione era già stato scaricato. Regola la finestra rispetto al log del server BB, non al log della sessione.
  </Accordion>
  <Accordion title="Pressione di memoria che rallenta l'invio della risposta">
    Su macchine più piccole (8 GB), i turni dell'agente possono richiedere abbastanza tempo da far scaricare il bucket di fusione prima del completamento della risposta, e l'URL finisce come secondo turno in coda. Controlla `memory_pressure` e `ps -o rss -p $(pgrep openclaw-gateway)`; se il Gateway supera ~500 MB RSS e il compressore è attivo, chiudi altri processi pesanti oppure passa a un host più grande.
  </Accordion>
  <Accordion title="Gli invii con citazione di risposta seguono un percorso diverso">
    Se l'utente ha toccato `Dump` come **risposta** a un URL-balloon esistente (iMessage mostra un badge "1 Reply" sul balloon Dump), l'URL si trova in `replyToBody`, non in un secondo Webhook. La fusione non si applica — è una questione di skill/prompt, non del debouncer.
  </Accordion>
</AccordionGroup>

## Block streaming

Controlla se le risposte vengono inviate come messaggio singolo o trasmesse in streaming a blocchi:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // abilita il block streaming (disattivato per impostazione predefinita)
    },
  },
}
```

## Media + limiti

- Gli allegati in ingresso vengono scaricati e archiviati nella cache media.
- Limite media tramite `channels.bluebubbles.mediaMaxMb` per media in ingresso e in uscita (predefinito: 8 MB).
- Il testo in uscita viene suddiviso in blocchi secondo `channels.bluebubbles.textChunkLimit` (predefinito: 4000 caratteri).

## Riferimento configurazione

Configurazione completa: [Configurazione](/it/gateway/configuration)

<AccordionGroup>
  <Accordion title="Connessione e Webhook">
    - `channels.bluebubbles.enabled`: abilita/disabilita il canale.
    - `channels.bluebubbles.serverUrl`: URL base dell'API REST BlueBubbles.
    - `channels.bluebubbles.password`: password API.
    - `channels.bluebubbles.webhookPath`: percorso dell'endpoint Webhook (predefinito: `/bluebubbles-webhook`).

  </Accordion>
  <Accordion title="Policy di accesso">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (predefinito: `pairing`).
    - `channels.bluebubbles.allowFrom`: allowlist DM (handle, email, numeri E.164, `chat_id:*`, `chat_guid:*`).
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (predefinito: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom`: allowlist dei mittenti di gruppo.
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: su macOS, arricchisce facoltativamente i partecipanti di gruppo senza nome dai Contatti locali dopo il superamento dei controlli. Predefinito: `false`.
    - `channels.bluebubbles.groups`: configurazione per gruppo (`requireMention`, ecc.).

  </Accordion>
  <Accordion title="Consegna e suddivisione">
    - `channels.bluebubbles.sendReadReceipts`: invia conferme di lettura (predefinito: `true`).
    - `channels.bluebubbles.blockStreaming`: abilita il block streaming (predefinito: `false`; necessario per le risposte in streaming).
    - `channels.bluebubbles.textChunkLimit`: dimensione dei blocchi in uscita in caratteri (predefinito: 4000).
    - `channels.bluebubbles.sendTimeoutMs`: timeout per richiesta in ms per gli invii di testo in uscita tramite `/api/v1/message/text` (predefinito: 30000). Aumentalo su configurazioni macOS 26 in cui gli invii iMessage con Private API possono bloccarsi per oltre 60 secondi all'interno del framework iMessage; ad esempio `45000` o `60000`. Sonde, ricerche chat, reazioni, modifiche e controlli di integrità mantengono attualmente il valore predefinito più breve di 10 s; l'estensione della copertura a reazioni e modifiche è prevista in un passaggio successivo. Override per account: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
    - `channels.bluebubbles.chunkMode`: `length` (predefinito) divide solo quando viene superato `textChunkLimit`; `newline` divide sulle righe vuote (confini di paragrafo) prima della suddivisione per lunghezza.

  </Accordion>
  <Accordion title="Media e cronologia">
    - `channels.bluebubbles.mediaMaxMb`: limite dei media in ingresso/uscita in MB (predefinito: 8).
    - `channels.bluebubbles.mediaLocalRoots`: allowlist esplicita di directory locali assolute consentite per i percorsi media locali in uscita. Per impostazione predefinita, l'invio tramite percorso locale viene negato se questo valore non è configurato. Override per account: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
    - `channels.bluebubbles.coalesceSameSenderDms`: unisce Webhook DM consecutivi dello stesso mittente in un unico turno agente, così lo split-send testo+URL di Apple arriva come un solo messaggio (predefinito: `false`). Vedi [Fusione dei DM split-send](#coalescing-split-send-dms-command--url-in-one-composition) per scenari, regolazione della finestra e compromessi. Quando è abilitato senza un valore esplicito `messages.inbound.byChannel.bluebubbles`, amplia la finestra debounce in ingresso predefinita da 500 ms a 2500 ms.
    - `channels.bluebubbles.historyLimit`: massimo numero di messaggi di gruppo per il contesto (0 disabilita).
    - `channels.bluebubbles.dmHistoryLimit`: limite cronologia DM.

  </Accordion>
  <Accordion title="Azioni e account">
    - `channels.bluebubbles.actions`: abilita/disabilita azioni specifiche.
    - `channels.bluebubbles.accounts`: configurazione multi-account.

  </Accordion>
</AccordionGroup>

Opzioni globali correlate:

- `agents.list[].groupChat.mentionPatterns` (oppure `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Indirizzamento / destinazioni di consegna

Preferisci `chat_guid` per un instradamento stabile:

- `chat_guid:iMessage;-;+15555550123` (preferito per i gruppi)
- `chat_id:123`
- `chat_identifier:...`
- Handle diretti: `+15555550123`, `user@example.com`
  - Se un handle diretto non ha una chat DM esistente, OpenClaw ne creerà una tramite `POST /api/v1/chat/new`. Questo richiede che la Private API BlueBubbles sia abilitata.

### Instradamento iMessage vs SMS

Quando lo stesso handle ha sia una chat iMessage sia una chat SMS sul Mac (ad esempio un numero di telefono registrato su iMessage ma che ha ricevuto anche fallback con bolle verdi), OpenClaw preferisce la chat iMessage e non esegue mai in modo silenzioso il downgrade a SMS. Per forzare la chat SMS, usa un prefisso di destinazione esplicito `sms:` (ad esempio `sms:+15555550123`). Gli handle senza una chat iMessage corrispondente continuano a inviare tramite qualunque chat venga riportata da BlueBubbles.

## Sicurezza

- Le richieste Webhook vengono autenticate confrontando i parametri query o le intestazioni `guid`/`password` con `channels.bluebubbles.password`.
- Mantieni segreti la password API e l'endpoint Webhook (trattali come credenziali).
- Non esiste alcun bypass localhost per l'autenticazione Webhook BlueBubbles. Se instradi il traffico Webhook tramite proxy, mantieni la password BlueBubbles nella richiesta end-to-end. `gateway.trustedProxies` non sostituisce qui `channels.bluebubbles.password`. Vedi [Sicurezza del Gateway](/it/gateway/security#reverse-proxy-configuration).
- Abilita HTTPS + regole firewall sul server BlueBubbles se lo esponi al di fuori della tua LAN.

## Risoluzione dei problemi

- Se gli eventi di digitazione/lettura smettono di funzionare, controlla i log Webhook BlueBubbles e verifica che il percorso del Gateway corrisponda a `channels.bluebubbles.webhookPath`.
- I codici di associazione scadono dopo un'ora; usa `openclaw pairing list bluebubbles` e `openclaw pairing approve bluebubbles <code>`.
- Le reazioni richiedono la Private API BlueBubbles (`POST /api/v1/message/react`); assicurati che la versione del server la esponga.
- Modifica/annullamento invio richiedono macOS 13+ e una versione compatibile del server BlueBubbles. Su macOS 26 (Tahoe), la modifica è attualmente non funzionante a causa di cambiamenti nella private API.
- Gli aggiornamenti dell'icona del gruppo possono essere instabili su macOS 26 (Tahoe): l'API può restituire successo ma la nuova icona non si sincronizza.
- OpenClaw nasconde automaticamente le azioni note come non funzionanti in base alla versione macOS del server BlueBubbles. Se la modifica appare ancora su macOS 26 (Tahoe), disabilitala manualmente con `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` abilitato ma gli split-send (ad esempio `Dump` + URL) arrivano ancora come due turni: consulta la checklist [risoluzione dei problemi della fusione split-send](#split-send-coalescing-troubleshooting) — le cause comuni sono una finestra debounce troppo stretta, timestamp del log di sessione interpretati erroneamente come arrivo del Webhook, oppure un invio come citazione di risposta (che usa `replyToBody`, non un secondo Webhook).
- Per informazioni su stato/integrità: `openclaw status --all` oppure `openclaw status --deep`.

Per il riferimento al flusso generale dei canali, vedi [Canali](/it/channels) e la guida [Plugin](/it/tools/plugin).

## Correlati

- [Instradamento canale](/it/channels/channel-routing) — instradamento della sessione per i messaggi
- [Panoramica canali](/it/channels) — tutti i canali supportati
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e filtro delle menzioni
- [Associazione](/it/channels/pairing) — autenticazione DM e flusso di associazione
- [Sicurezza](/it/gateway/security) — modello di accesso e hardening
