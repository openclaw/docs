---
read_when:
    - Configurazione del canale BlueBubbles
    - Risoluzione dei problemi di pairing del webhook
    - Configurazione di iMessage su macOS
summary: iMessage tramite server macOS BlueBubbles (invio/ricezione REST, digitazione, reazioni, pairing, azioni avanzate).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-05T13:42:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: ed8e59a165bdfb8fd794ee2ad6e4dacd44aa02d512312c5f2fd7d15f863380bb
    source_path: channels/bluebubbles.md
    workflow: 15
---

# BlueBubbles (REST macOS)

Stato: plugin incluso che comunica con il server macOS BlueBubbles tramite HTTP. **Consigliato per l'integrazione con iMessage** grazie alla sua API più ricca e alla configurazione più semplice rispetto al canale imsg legacy.

## Plugin incluso

Le attuali release di OpenClaw includono BlueBubbles, quindi le normali build pacchettizzate non
richiedono un passaggio separato `openclaw plugins install`.

## Panoramica

- Funziona su macOS tramite l'app helper BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Consigliato/testato: macOS Sequoia (15). macOS Tahoe (26) funziona; la modifica è attualmente non funzionante su Tahoe e gli aggiornamenti dell'icona di gruppo possono risultare riusciti ma non sincronizzarsi.
- OpenClaw comunica con esso tramite la sua API REST (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- I messaggi in ingresso arrivano tramite webhook; le risposte in uscita, gli indicatori di digitazione, le conferme di lettura e i tapback sono chiamate REST.
- Gli allegati e gli sticker vengono acquisiti come media in ingresso (e mostrati all'agente quando possibile).
- Il pairing/la allowlist funziona come per gli altri canali (`/channels/pairing` ecc.) con `channels.bluebubbles.allowFrom` + codici di pairing.
- Le reazioni vengono mostrate come eventi di sistema proprio come in Slack/Telegram, così gli agenti possono "menzionarle" prima di rispondere.
- Funzionalità avanzate: modifica, annullamento invio, thread di risposta, effetti messaggio, gestione dei gruppi.

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

4. Punta i webhook BlueBubbles al tuo gateway (esempio: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
5. Avvia il gateway; registrerà il gestore del webhook e avvierà il pairing.

Nota sulla sicurezza:

- Imposta sempre una password per il webhook.
- L'autenticazione del webhook è sempre obbligatoria. OpenClaw rifiuta le richieste webhook BlueBubbles a meno che non includano una password/guid che corrisponda a `channels.bluebubbles.password` (ad esempio `?password=<password>` o `x-password`), indipendentemente dalla topologia loopback/proxy.
- L'autenticazione tramite password viene verificata prima di leggere/analizzare i corpi completi dei webhook.

## Mantenere attiva Messages.app (VM / configurazioni headless)

Alcune configurazioni macOS VM / always-on possono portare Messages.app a entrare in stato di “idle” (gli eventi in ingresso si interrompono finché l'app non viene aperta/portata in primo piano). Un semplice workaround consiste nel **sollecitare Messages ogni 5 minuti** usando un AppleScript + LaunchAgent.

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
- La prima esecuzione può attivare richieste macOS di **Automazione** (`osascript` → Messages). Approvale nella stessa sessione utente che esegue il LaunchAgent.

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

- **URL del server** (obbligatorio): indirizzo del server BlueBubbles (ad es. `http://192.168.1.100:1234`)
- **Password** (obbligatoria): password API dalle impostazioni di BlueBubbles Server
- **Percorso webhook** (facoltativo): valore predefinito `/bluebubbles-webhook`
- **Criterio DM**: pairing, allowlist, open o disabled
- **Allow list**: numeri di telefono, email o destinazioni chat

Puoi anche aggiungere BlueBubbles tramite CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Controllo accessi (DM + gruppi)

DM:

- Predefinito: `channels.bluebubbles.dmPolicy = "pairing"`.
- I mittenti sconosciuti ricevono un codice di pairing; i messaggi vengono ignorati finché non vengono approvati (i codici scadono dopo 1 ora).
- Approva tramite:
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- Il pairing è lo scambio di token predefinito. Dettagli: [Pairing](/channels/pairing)

Gruppi:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (predefinito: `allowlist`).
- `channels.bluebubbles.groupAllowFrom` controlla chi può attivare nei gruppi quando è impostato `allowlist`.

### Arricchimento dei nomi contatto (macOS, facoltativo)

I webhook di gruppo BlueBubbles spesso includono solo gli indirizzi grezzi dei partecipanti. Se invece vuoi che il contesto `GroupMembers` mostri i nomi dei contatti locali, puoi attivare facoltativamente l'arricchimento dai Contatti locali su macOS:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` abilita la ricerca. Predefinito: `false`.
- Le ricerche vengono eseguite solo dopo che accesso al gruppo, autorizzazione dei comandi e gating delle menzioni hanno consentito il passaggio del messaggio.
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

### Gating delle menzioni (gruppi)

BlueBubbles supporta il gating delle menzioni per le chat di gruppo, in linea con il comportamento di iMessage/WhatsApp:

- Usa `agents.list[].groupChat.mentionPatterns` (oppure `messages.groupChat.mentionPatterns`) per rilevare le menzioni.
- Quando `requireMention` è abilitato per un gruppo, l'agente risponde solo quando viene menzionato.
- I comandi di controllo dei mittenti autorizzati bypassano il gating delle menzioni.

Configurazione per gruppo:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // default for all groups
        "iMessage;-;chat123": { requireMention: false }, // override for specific group
      },
    },
  },
}
```

### Gating dei comandi

- I comandi di controllo (ad es. `/config`, `/model`) richiedono autorizzazione.
- Usa `allowFrom` e `groupAllowFrom` per determinare l'autorizzazione ai comandi.
- I mittenti autorizzati possono eseguire comandi di controllo anche senza menzione nei gruppi.

## Binding conversazione ACP

Le chat BlueBubbles possono essere trasformate in workspace ACP persistenti senza cambiare il livello di trasporto.

Flusso rapido per l'operatore:

- Esegui `/acp spawn codex --bind here` all'interno del DM o del gruppo consentito.
- I messaggi futuri in quella stessa conversazione BlueBubbles verranno instradati alla sessione ACP generata.
- `/new` e `/reset` reimpostano sul posto la stessa sessione ACP associata.
- `/acp close` chiude la sessione ACP e rimuove il binding.

I binding persistenti configurati sono supportati anche tramite voci `bindings[]` di primo livello con `type: "acp"` e `match.channel: "bluebubbles"`.

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

Consulta [ACP Agents](/tools/acp-agents) per il comportamento condiviso del binding ACP.

## Digitazione + conferme di lettura

- **Indicatori di digitazione**: inviati automaticamente prima e durante la generazione della risposta.
- **Conferme di lettura**: controllate da `channels.bluebubbles.sendReadReceipts` (predefinito: `true`).
- **Indicatori di digitazione**: OpenClaw invia eventi di avvio digitazione; BlueBubbles cancella automaticamente la digitazione all'invio o al timeout (l'arresto manuale tramite DELETE non è affidabile).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // disable read receipts
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
        reactions: true, // tapbacks (default: true)
        edit: true, // edit sent messages (macOS 13+, broken on macOS 26 Tahoe)
        unsend: true, // unsend messages (macOS 13+)
        reply: true, // reply threading by message GUID
        sendWithEffect: true, // message effects (slam, loud, etc.)
        renameGroup: true, // rename group chats
        setGroupIcon: true, // set group chat icon/photo (flaky on macOS 26 Tahoe)
        addParticipant: true, // add participants to groups
        removeParticipant: true, // remove participants from groups
        leaveGroup: true, // leave group chats
        sendAttachment: true, // send attachments/media
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
- **setGroupIcon**: imposta l'icona/foto di una chat di gruppo (`chatGuid`, `media`) — può essere instabile su macOS 26 Tahoe (l'API può restituire successo ma l'icona non si sincronizza).
- **addParticipant**: aggiunge qualcuno a un gruppo (`chatGuid`, `address`)
- **removeParticipant**: rimuove qualcuno da un gruppo (`chatGuid`, `address`)
- **leaveGroup**: esce da una chat di gruppo (`chatGuid`)
- **upload-file**: invia media/file (`to`, `buffer`, `filename`, `asVoice`)
  - Memo vocali: imposta `asVoice: true` con audio **MP3** o **CAF** per inviare un messaggio vocale iMessage. BlueBubbles converte MP3 → CAF durante l'invio dei memo vocali.
- Alias legacy: `sendAttachment` continua a funzionare, ma `upload-file` è il nome canonico dell'azione.

### ID messaggio (brevi vs completi)

OpenClaw può esporre ID messaggio _brevi_ (ad es. `1`, `2`) per risparmiare token.

- `MessageSid` / `ReplyToId` possono essere ID brevi.
- `MessageSidFull` / `ReplyToIdFull` contengono gli ID completi del provider.
- Gli ID brevi sono in memoria; possono scadere al riavvio o con l'espulsione della cache.
- Le azioni accettano `messageId` brevi o completi, ma gli ID brevi restituiranno errore se non sono più disponibili.

Usa gli ID completi per automazioni e archiviazione persistenti:

- Template: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Contesto: `MessageSidFull` / `ReplyToIdFull` nei payload in ingresso

Consulta [Configuration](/gateway/configuration) per le variabili template.

## Streaming a blocchi

Controlla se le risposte vengono inviate come un singolo messaggio o in streaming a blocchi:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // enable block streaming (off by default)
    },
  },
}
```

## Media + limiti

- Gli allegati in ingresso vengono scaricati e archiviati nella cache dei media.
- Limite dei media tramite `channels.bluebubbles.mediaMaxMb` per i media in ingresso e in uscita (predefinito: 8 MB).
- Il testo in uscita viene suddiviso in blocchi secondo `channels.bluebubbles.textChunkLimit` (predefinito: 4000 caratteri).

## Riferimento configurazione

Configurazione completa: [Configuration](/gateway/configuration)

Opzioni del provider:

- `channels.bluebubbles.enabled`: abilita/disabilita il canale.
- `channels.bluebubbles.serverUrl`: URL base dell'API REST BlueBubbles.
- `channels.bluebubbles.password`: password API.
- `channels.bluebubbles.webhookPath`: percorso endpoint del webhook (predefinito: `/bluebubbles-webhook`).
- `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (predefinito: `pairing`).
- `channels.bluebubbles.allowFrom`: allowlist DM (handle, email, numeri E.164, `chat_id:*`, `chat_guid:*`).
- `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (predefinito: `allowlist`).
- `channels.bluebubbles.groupAllowFrom`: allowlist dei mittenti di gruppo.
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`: su macOS, arricchisce facoltativamente i partecipanti senza nome dei gruppi dai Contatti locali dopo il superamento del gating. Predefinito: `false`.
- `channels.bluebubbles.groups`: configurazione per gruppo (`requireMention`, ecc.).
- `channels.bluebubbles.sendReadReceipts`: invia conferme di lettura (predefinito: `true`).
- `channels.bluebubbles.blockStreaming`: abilita lo streaming a blocchi (predefinito: `false`; necessario per le risposte in streaming).
- `channels.bluebubbles.textChunkLimit`: dimensione dei blocchi in uscita in caratteri (predefinito: 4000).
- `channels.bluebubbles.chunkMode`: `length` (predefinito) divide solo quando supera `textChunkLimit`; `newline` divide sulle righe vuote (confini di paragrafo) prima della suddivisione per lunghezza.
- `channels.bluebubbles.mediaMaxMb`: limite media in ingresso/uscita in MB (predefinito: 8).
- `channels.bluebubbles.mediaLocalRoots`: allowlist esplicita di directory locali assolute consentite per i percorsi di media locali in uscita. L'invio tramite percorso locale è negato per impostazione predefinita a meno che questo non sia configurato. Override per account: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
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

- Le richieste webhook vengono autenticate confrontando i parametri query o header `guid`/`password` con `channels.bluebubbles.password`.
- Mantieni segreti la password API e l'endpoint webhook (trattali come credenziali).
- Non esiste alcun bypass localhost per l'autenticazione webhook BlueBubbles. Se fai proxy del traffico webhook, mantieni la password BlueBubbles nella richiesta end-to-end. `gateway.trustedProxies` non sostituisce qui `channels.bluebubbles.password`. Consulta [Gateway security](/gateway/security#reverse-proxy-configuration).
- Abilita HTTPS + regole firewall sul server BlueBubbles se lo esponi al di fuori della tua LAN.

## Risoluzione dei problemi

- Se gli eventi di digitazione/lettura smettono di funzionare, controlla i log del webhook BlueBubbles e verifica che il percorso del gateway corrisponda a `channels.bluebubbles.webhookPath`.
- I codici di pairing scadono dopo un'ora; usa `openclaw pairing list bluebubbles` e `openclaw pairing approve bluebubbles <code>`.
- Le reazioni richiedono la BlueBubbles private API (`POST /api/v1/message/react`); assicurati che la versione del server la esponga.
- Modifica/annullamento invio richiedono macOS 13+ e una versione compatibile del server BlueBubbles. Su macOS 26 (Tahoe), la modifica è attualmente non funzionante a causa di cambiamenti della private API.
- Gli aggiornamenti dell'icona di gruppo possono essere instabili su macOS 26 (Tahoe): l'API può restituire successo ma la nuova icona non si sincronizza.
- OpenClaw nasconde automaticamente le azioni note come non funzionanti in base alla versione macOS del server BlueBubbles. Se la modifica compare ancora su macOS 26 (Tahoe), disabilitala manualmente con `channels.bluebubbles.actions.edit=false`.
- Per informazioni su stato/salute: `openclaw status --all` o `openclaw status --deep`.

Per un riferimento generale sul flusso dei canali, consulta [Channels](/channels) e la guida [Plugins](/tools/plugin).

## Correlati

- [Channels Overview](/channels) — tutti i canali supportati
- [Pairing](/channels/pairing) — autenticazione DM e flusso di pairing
- [Groups](/channels/groups) — comportamento delle chat di gruppo e gating delle menzioni
- [Channel Routing](/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Security](/gateway/security) — modello di accesso e hardening
