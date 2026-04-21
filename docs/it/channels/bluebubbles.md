---
read_when:
    - Configurazione del canale BlueBubbles
    - Risoluzione dei problemi di abbinamento del Webhook
    - Configurazione di iMessage su macOS
summary: iMessage tramite server macOS BlueBubbles (invio/ricezione REST, digitazione, reazioni, abbinamento, azioni avanzate).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-21T08:21:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: b3d8d617fc86ca1b191ff4dd2ae26b464e4d3f456a79c67b484a3a76d75de0d2
    source_path: channels/bluebubbles.md
    workflow: 15
---

# BlueBubbles (REST macOS)

Stato: plugin incluso che comunica con il server macOS BlueBubbles tramite HTTP. **Consigliato per l'integrazione con iMessage** grazie alla sua API più ricca e alla configurazione più semplice rispetto al canale imsg legacy.

## Plugin incluso

Le versioni correnti di OpenClaw includono BlueBubbles, quindi le normali build pacchettizzate non
richiedono un passaggio separato `openclaw plugins install`.

## Panoramica

- Viene eseguito su macOS tramite l'app helper BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Consigliato/testato: macOS Sequoia (15). macOS Tahoe (26) funziona; la modifica al momento non funziona su Tahoe e gli aggiornamenti dell'icona del gruppo possono risultare riusciti ma non sincronizzarsi.
- OpenClaw comunica con esso tramite la sua API REST (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- I messaggi in arrivo arrivano tramite Webhook; le risposte in uscita, gli indicatori di digitazione, le conferme di lettura e i tapback sono chiamate REST.
- Gli allegati e gli sticker vengono acquisiti come contenuti multimediali in entrata (e mostrati all'agente quando possibile).
- L'abbinamento/allowlist funziona allo stesso modo degli altri canali (`/channels/pairing` ecc.) con `channels.bluebubbles.allowFrom` + codici di abbinamento.
- Le reazioni vengono esposte come eventi di sistema proprio come in Slack/Telegram, così gli agenti possono "menzionarle" prima di rispondere.
- Funzionalità avanzate: modifica, annullamento invio, risposte in thread, effetti dei messaggi, gestione dei gruppi.

## Avvio rapido

1. Installa il server BlueBubbles sul tuo Mac (segui le istruzioni su [bluebubbles.app/install](https://bluebubbles.app/install)).
2. Nella configurazione di BlueBubbles, abilita la web API e imposta una password.
3. Esegui `openclaw onboard` e seleziona BlueBubbles, oppure configura manualmente:

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

4. Punta i Webhook BlueBubbles al tuo Gateway (esempio: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
5. Avvia il Gateway; registrerà il gestore del Webhook e inizierà l'abbinamento.

Nota sulla sicurezza:

- Imposta sempre una password per il Webhook.
- L'autenticazione del Webhook è sempre obbligatoria. OpenClaw rifiuta le richieste Webhook BlueBubbles a meno che non includano una password/guid che corrisponda a `channels.bluebubbles.password` (ad esempio `?password=<password>` o `x-password`), indipendentemente dalla topologia loopback/proxy.
- L'autenticazione tramite password viene controllata prima di leggere/analizzare i corpi completi dei Webhook.

## Mantenere attiva Messages.app (configurazioni VM / headless)

Alcune configurazioni macOS VM / always-on possono far sì che Messages.app vada in “idle” (gli eventi in arrivo si fermano finché l'app non viene aperta/portata in primo piano). Una soluzione semplice consiste nel **dare un colpetto a Messages ogni 5 minuti** usando un AppleScript + LaunchAgent.

### 1) Salva l'AppleScript

Salvalo come:

- `~/Scripts/poke-messages.scpt`

Script di esempio (non interattivo; non ruba il focus):

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

### 2) Installa un LaunchAgent

Salvalo come:

- `~/Library/LaunchAgents/com.user.poke-messages.plist`

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

Note:

- Viene eseguito **ogni 300 secondi** e **all'accesso**.
- La prima esecuzione può attivare i prompt macOS di **Automation** (`osascript` → Messages). Approvali nella stessa sessione utente che esegue il LaunchAgent.

Caricalo:

```bash
launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
```

## Onboarding

BlueBubbles è disponibile nell'onboarding interattivo:

```
openclaw onboard
```

La procedura guidata richiede:

- **URL del server** (obbligatorio): indirizzo del server BlueBubbles (es. `http://192.168.1.100:1234`)
- **Password** (obbligatoria): password API dalle impostazioni di BlueBubbles Server
- **Percorso Webhook** (facoltativo): predefinito `/bluebubbles-webhook`
- **Criterio DM**: pairing, allowlist, open o disabled
- **Allow list**: numeri di telefono, email o destinazioni chat

Puoi anche aggiungere BlueBubbles tramite CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Controllo accessi (DM + gruppi)

DM:

- Predefinito: `channels.bluebubbles.dmPolicy = "pairing"`.
- I mittenti sconosciuti ricevono un codice di abbinamento; i messaggi vengono ignorati finché non vengono approvati (i codici scadono dopo 1 ora).
- Approva tramite:
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- L'abbinamento è lo scambio di token predefinito. Dettagli: [Pairing](/it/channels/pairing)

Gruppi:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (predefinito: `allowlist`).
- `channels.bluebubbles.groupAllowFrom` controlla chi può attivare nei gruppi quando è impostato `allowlist`.

### Arricchimento dei nomi dei contatti (macOS, facoltativo)

I Webhook di gruppo BlueBubbles spesso includono solo gli indirizzi grezzi dei partecipanti. Se invece vuoi che il contesto `GroupMembers` mostri i nomi dei contatti locali, puoi attivare facoltativamente l'arricchimento dai Contatti locali su macOS:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` abilita la ricerca. Predefinito: `false`.
- Le ricerche vengono eseguite solo dopo che accesso al gruppo, autorizzazione dei comandi e mention gating hanno permesso il passaggio del messaggio.
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

### Mention gating (gruppi)

BlueBubbles supporta il mention gating per le chat di gruppo, in linea con il comportamento di iMessage/WhatsApp:

- Usa `agents.list[].groupChat.mentionPatterns` (oppure `messages.groupChat.mentionPatterns`) per rilevare le menzioni.
- Quando `requireMention` è abilitato per un gruppo, l'agente risponde solo quando viene menzionato.
- I comandi di controllo inviati da mittenti autorizzati aggirano il mention gating.

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

### Command gating

- I comandi di controllo (es. `/config`, `/model`) richiedono autorizzazione.
- Usa `allowFrom` e `groupAllowFrom` per determinare l'autorizzazione dei comandi.
- I mittenti autorizzati possono eseguire i comandi di controllo anche senza menzionare nei gruppi.

### Prompt di sistema per gruppo

Ogni voce sotto `channels.bluebubbles.groups.*` accetta una stringa `systemPrompt` facoltativa. Il valore viene iniettato nel prompt di sistema dell'agente a ogni turno che gestisce un messaggio in quel gruppo, così puoi impostare regole di persona o comportamento per gruppo senza modificare i prompt dell'agente:

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

La chiave corrisponde a qualunque valore BlueBubbles riporti come `chatGuid` / `chatIdentifier` / `chatId` numerico per il gruppo, e una voce jolly `"*"` fornisce un valore predefinito per ogni gruppo senza una corrispondenza esatta (lo stesso schema usato da `requireMention` e dai criteri degli strumenti per gruppo). Le corrispondenze esatte hanno sempre la precedenza sul jolly. I DM ignorano questo campo; usa invece la personalizzazione del prompt a livello agente o account.

#### Esempio pratico: risposte in thread e reazioni tapback (Private API)

Con la BlueBubbles Private API abilitata, i messaggi in entrata arrivano con ID messaggio brevi (ad esempio `[[reply_to:5]]`) e l'agente può chiamare `action=reply` per rispondere in thread a un messaggio specifico oppure `action=react` per aggiungere un tapback. Un `systemPrompt` per gruppo è un modo affidabile per fare in modo che l'agente scelga lo strumento corretto:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "Quando rispondi in questo gruppo, chiama sempre action=reply con il",
            "messageId [[reply_to:N]] dal contesto in modo che la tua risposta venga messa in thread",
            "sotto il messaggio che l'ha attivata. Non inviare mai un nuovo messaggio scollegato.",
            "",
            "Per brevi conferme ('ok', 'ricevuto', 'ci penso io'), usa",
            "action=react con un'emoji tapback appropriata (❤️, 👍, 😂, ‼️, ❓)",
            "invece di inviare una risposta di testo.",
          ].join(" "),
        },
      },
    },
  },
}
```

Le reazioni tapback e le risposte in thread richiedono entrambe la BlueBubbles Private API; consulta [Azioni avanzate](#azioni-avanzate) e [ID messaggio](#message-ids-short-vs-full) per i meccanismi sottostanti.

## Binding conversazione ACP

Le chat BlueBubbles possono essere trasformate in workspace ACP persistenti senza cambiare il livello di trasporto.

Flusso rapido per l'operatore:

- Esegui `/acp spawn codex --bind here` all'interno del DM o del gruppo consentito.
- I messaggi futuri nella stessa conversazione BlueBubbles verranno instradati alla sessione ACP generata.
- `/new` e `/reset` reimpostano sul posto la stessa sessione ACP associata.
- `/acp close` chiude la sessione ACP e rimuove il binding.

Sono supportati anche i binding persistenti configurati tramite voci `bindings[]` di primo livello con `type: "acp"` e `match.channel: "bluebubbles"`.

`match.peer.id` può usare qualsiasi formato di destinazione BlueBubbles supportato:

- handle DM normalizzato come `+15555550123` o `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Per binding di gruppo stabili, preferisci `chat_id:*` o `chat_identifier:*`.

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

Consulta [ACP Agents](/it/tools/acp-agents) per il comportamento condiviso dei binding ACP.

## Digitazione + conferme di lettura

- **Indicatori di digitazione**: inviati automaticamente prima e durante la generazione della risposta.
- **Conferme di lettura**: controllate da `channels.bluebubbles.sendReadReceipts` (predefinito: `true`).
- **Indicatori di digitazione**: OpenClaw invia eventi di inizio digitazione; BlueBubbles cancella automaticamente la digitazione all'invio o al timeout (l'arresto manuale tramite DELETE non è affidabile).

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
        edit: true, // modifica i messaggi inviati (macOS 13+, non funzionante su macOS 26 Tahoe)
        unsend: true, // annulla l'invio dei messaggi (macOS 13+)
        reply: true, // risposte in thread tramite GUID del messaggio
        sendWithEffect: true, // effetti dei messaggi (slam, loud, ecc.)
        renameGroup: true, // rinomina le chat di gruppo
        setGroupIcon: true, // imposta l'icona/foto della chat di gruppo (instabile su macOS 26 Tahoe)
        addParticipant: true, // aggiungi partecipanti ai gruppi
        removeParticipant: true, // rimuovi partecipanti dai gruppi
        leaveGroup: true, // abbandona le chat di gruppo
        sendAttachment: true, // invia allegati/media
      },
    },
  },
}
```

Azioni disponibili:

- **react**: aggiunge/rimuove reazioni tapback (`messageId`, `emoji`, `remove`)
- **edit**: modifica un messaggio inviato (`messageId`, `text`)
- **unsend**: annulla l'invio di un messaggio (`messageId`)
- **reply**: risponde a un messaggio specifico (`messageId`, `text`, `to`)
- **sendWithEffect**: invia con effetto iMessage (`text`, `to`, `effectId`)
- **renameGroup**: rinomina una chat di gruppo (`chatGuid`, `displayName`)
- **setGroupIcon**: imposta l'icona/foto di una chat di gruppo (`chatGuid`, `media`) — instabile su macOS 26 Tahoe (l'API può restituire successo ma l'icona non si sincronizza).
- **addParticipant**: aggiunge qualcuno a un gruppo (`chatGuid`, `address`)
- **removeParticipant**: rimuove qualcuno da un gruppo (`chatGuid`, `address`)
- **leaveGroup**: abbandona una chat di gruppo (`chatGuid`)
- **upload-file**: invia media/file (`to`, `buffer`, `filename`, `asVoice`)
  - Memo vocali: imposta `asVoice: true` con audio **MP3** o **CAF** per inviare come messaggio vocale iMessage. BlueBubbles converte MP3 → CAF quando invia memo vocali.
- Alias legacy: `sendAttachment` continua a funzionare, ma `upload-file` è il nome di azione canonico.

### ID messaggio (brevi vs completi)

OpenClaw può mostrare ID messaggio _brevi_ (ad es. `1`, `2`) per risparmiare token.

- `MessageSid` / `ReplyToId` possono essere ID brevi.
- `MessageSidFull` / `ReplyToIdFull` contengono gli ID completi del provider.
- Gli ID brevi sono in memoria; possono scadere al riavvio o con l'espulsione dalla cache.
- Le azioni accettano `messageId` brevi o completi, ma gli ID brevi genereranno un errore se non sono più disponibili.

Usa gli ID completi per automazioni persistenti e archiviazione:

- Template: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Contesto: `MessageSidFull` / `ReplyToIdFull` nei payload in entrata

Consulta [Configuration](/it/gateway/configuration) per le variabili dei template.

## Streaming a blocchi

Controlla se le risposte vengono inviate come singolo messaggio o trasmesse in streaming a blocchi:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // abilita lo streaming a blocchi (disattivato per impostazione predefinita)
    },
  },
}
```

## Media + limiti

- Gli allegati in entrata vengono scaricati e memorizzati nella cache dei media.
- Limite media tramite `channels.bluebubbles.mediaMaxMb` per i media in entrata e in uscita (predefinito: 8 MB).
- Il testo in uscita viene suddiviso in blocchi secondo `channels.bluebubbles.textChunkLimit` (predefinito: 4000 caratteri).

## Riferimento configurazione

Configurazione completa: [Configuration](/it/gateway/configuration)

Opzioni del provider:

- `channels.bluebubbles.enabled`: abilita/disabilita il canale.
- `channels.bluebubbles.serverUrl`: URL di base dell'API REST BlueBubbles.
- `channels.bluebubbles.password`: password API.
- `channels.bluebubbles.webhookPath`: percorso dell'endpoint Webhook (predefinito: `/bluebubbles-webhook`).
- `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (predefinito: `pairing`).
- `channels.bluebubbles.allowFrom`: allowlist DM (handle, email, numeri E.164, `chat_id:*`, `chat_guid:*`).
- `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (predefinito: `allowlist`).
- `channels.bluebubbles.groupAllowFrom`: allowlist mittenti di gruppo.
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`: su macOS, arricchisce facoltativamente i partecipanti di gruppo senza nome dai Contatti locali dopo il superamento dei controlli. Predefinito: `false`.
- `channels.bluebubbles.groups`: configurazione per gruppo (`requireMention`, ecc.).
- `channels.bluebubbles.sendReadReceipts`: invia conferme di lettura (predefinito: `true`).
- `channels.bluebubbles.blockStreaming`: abilita lo streaming a blocchi (predefinito: `false`; richiesto per le risposte in streaming).
- `channels.bluebubbles.textChunkLimit`: dimensione dei blocchi in uscita in caratteri (predefinito: 4000).
- `channels.bluebubbles.sendTimeoutMs`: timeout per richiesta in ms per gli invii di testo in uscita tramite `/api/v1/message/text` (predefinito: 30000). Aumentalo su configurazioni macOS 26 in cui gli invii iMessage Private API possono bloccarsi per oltre 60 secondi all'interno del framework iMessage; ad esempio `45000` o `60000`. Sonde, ricerche chat, reazioni, modifiche e controlli di integrità mantengono attualmente il timeout più breve di 10 s; l'estensione della copertura a reazioni e modifiche è prevista in seguito. Override per account: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
- `channels.bluebubbles.chunkMode`: `length` (predefinito) divide solo quando viene superato `textChunkLimit`; `newline` divide sulle righe vuote (confini dei paragrafi) prima della suddivisione per lunghezza.
- `channels.bluebubbles.mediaMaxMb`: limite dei media in entrata/uscita in MB (predefinito: 8).
- `channels.bluebubbles.mediaLocalRoots`: allowlist esplicita di directory locali assolute consentite per i percorsi media locali in uscita. L'invio di percorsi locali è negato per impostazione predefinita se questo non è configurato. Override per account: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
- `channels.bluebubbles.historyLimit`: numero massimo di messaggi di gruppo per il contesto (0 disabilita).
- `channels.bluebubbles.dmHistoryLimit`: limite cronologia DM.
- `channels.bluebubbles.actions`: abilita/disabilita azioni specifiche.
- `channels.bluebubbles.accounts`: configurazione multi-account.

Opzioni globali correlate:

- `agents.list[].groupChat.mentionPatterns` (oppure `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Indirizzamento / destinazioni di consegna

Preferisci `chat_guid` per un instradamento stabile:

- `chat_guid:iMessage;-;+15555550123` (preferito per i gruppi)
- `chat_id:123`
- `chat_identifier:...`
- Handle diretti: `+15555550123`, `user@example.com`
  - Se un handle diretto non ha una chat DM esistente, OpenClaw ne creerà una tramite `POST /api/v1/chat/new`. Questo richiede che la BlueBubbles Private API sia abilitata.

## Sicurezza

- Le richieste Webhook vengono autenticate confrontando i parametri di query o gli header `guid`/`password` con `channels.bluebubbles.password`.
- Mantieni segreti la password API e l'endpoint Webhook (trattali come credenziali).
- Non esiste alcuna bypass localhost per l'autenticazione Webhook BlueBubbles. Se fai da proxy al traffico Webhook, mantieni la password BlueBubbles nella richiesta end-to-end. `gateway.trustedProxies` non sostituisce qui `channels.bluebubbles.password`. Consulta [Gateway security](/it/gateway/security#reverse-proxy-configuration).
- Abilita HTTPS + regole firewall sul server BlueBubbles se lo esponi fuori dalla LAN.

## Risoluzione dei problemi

- Se gli eventi di digitazione/lettura smettono di funzionare, controlla i log Webhook BlueBubbles e verifica che il percorso del Gateway corrisponda a `channels.bluebubbles.webhookPath`.
- I codici di abbinamento scadono dopo un'ora; usa `openclaw pairing list bluebubbles` e `openclaw pairing approve bluebubbles <code>`.
- Le reazioni richiedono la BlueBubbles private API (`POST /api/v1/message/react`); assicurati che la versione del server la esponga.
- Modifica/annullamento invio richiedono macOS 13+ e una versione compatibile del server BlueBubbles. Su macOS 26 (Tahoe), la modifica al momento non funziona a causa di cambiamenti della private API.
- Gli aggiornamenti dell'icona del gruppo possono essere instabili su macOS 26 (Tahoe): l'API può restituire successo ma la nuova icona non si sincronizza.
- OpenClaw nasconde automaticamente le azioni note come non funzionanti in base alla versione macOS del server BlueBubbles. Se la modifica compare ancora su macOS 26 (Tahoe), disabilitala manualmente con `channels.bluebubbles.actions.edit=false`.
- Per informazioni su stato/integrità: `openclaw status --all` oppure `openclaw status --deep`.

Per il riferimento generale al flusso dei canali, consulta [Channels](/it/channels) e la guida [Plugins](/it/tools/plugin).

## Correlati

- [Channels Overview](/it/channels) — tutti i canali supportati
- [Pairing](/it/channels/pairing) — autenticazione DM e flusso di abbinamento
- [Groups](/it/channels/groups) — comportamento delle chat di gruppo e mention gating
- [Channel Routing](/it/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Security](/it/gateway/security) — modello di accesso e hardening
