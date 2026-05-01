---
read_when:
    - Configurazione del canale BlueBubbles
    - Risoluzione dei problemi di associazione del Webhook
    - Configurazione di iMessage su macOS
sidebarTitle: BlueBubbles
summary: iMessage tramite server macOS BlueBubbles (invio/ricezione REST, digitazione, reazioni, associazione, azioni avanzate).
title: BlueBubbles
x-i18n:
    generated_at: "2026-05-01T08:28:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 499cc2a46db6e0eddfb897e96ec4b3e4a39ba9f2f6da8e7485c1c46562de4145
    source_path: channels/bluebubbles.md
    workflow: 16
---

Stato: Plugin in bundle che comunica con il server macOS BlueBubbles tramite HTTP. **Consigliato per l'integrazione con iMessage** grazie alla sua API più ricca e alla configurazione più semplice rispetto al canale imsg legacy.

<Note>
Le versioni attuali di OpenClaw includono BlueBubbles, quindi le build pacchettizzate normali non richiedono un passaggio `openclaw plugins install` separato.
</Note>

## Panoramica

- Funziona su macOS tramite l'app helper BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Consigliato/testato: macOS Sequoia (15). macOS Tahoe (26) funziona; la modifica è attualmente interrotta su Tahoe e gli aggiornamenti dell'icona di gruppo possono segnalare successo ma non sincronizzarsi.
- OpenClaw comunica con esso tramite la sua API REST (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- I messaggi in ingresso arrivano tramite Webhook; le risposte in uscita, gli indicatori di digitazione, le conferme di lettura e i tapback sono chiamate REST.
- Allegati e sticker vengono acquisiti come media in ingresso (e mostrati all'agente quando possibile).
- Le risposte Auto-TTS che sintetizzano audio MP3 o CAF vengono consegnate come fumetti di memo vocali iMessage invece che come semplici allegati file.
- L'associazione/allowlist funziona come per gli altri canali (`/channels/pairing` ecc.) con `channels.bluebubbles.allowFrom` + codici di associazione.
- Le reazioni vengono mostrate come eventi di sistema proprio come Slack/Telegram, così gli agenti possono "menzionarle" prima di rispondere.
- Funzionalità avanzate: modifica, annullamento invio, thread di risposte, effetti dei messaggi, gestione dei gruppi.

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
    Punta i Webhook di BlueBubbles al tuo gateway (esempio: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
  </Step>
  <Step title="Start the gateway">
    Avvia il gateway; registrerà il gestore Webhook e avvierà l'associazione.
  </Step>
</Steps>

<Warning>
**Sicurezza**

- Imposta sempre una password per il Webhook.
- L'autenticazione del Webhook è sempre richiesta. OpenClaw rifiuta le richieste Webhook di BlueBubbles a meno che includano una password/guid che corrisponde a `channels.bluebubbles.password` (per esempio `?password=<password>` o `x-password`), indipendentemente dalla topologia loopback/proxy.
- L'autenticazione tramite password viene verificata prima di leggere/analizzare i corpi completi dei Webhook.

</Warning>

## Mantenere Messages.app attiva (VM / configurazioni headless)

Alcune configurazioni macOS VM / sempre attive possono ritrovarsi con Messages.app in stato "inattivo" (gli eventi in ingresso si interrompono finché l'app non viene aperta/portata in primo piano). Una semplice soluzione alternativa consiste nel **sollecitare Messages ogni 5 minuti** usando un AppleScript + LaunchAgent.

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

    Questo viene eseguito **ogni 300 secondi** e **all'accesso**. La prima esecuzione può attivare richieste di autorizzazione **Automazione** di macOS (`osascript` → Messages). Approvale nella stessa sessione utente che esegue il LaunchAgent.

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
  Indirizzo del server BlueBubbles (ad es. `http://192.168.1.100:1234`).
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
    - I mittenti sconosciuti ricevono un codice di associazione; i messaggi vengono ignorati finché non sono approvati (i codici scadono dopo 1 ora).
    - Approva tramite:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - L'associazione è lo scambio di token predefinito. Dettagli: [Associazione](/it/channels/pairing)

  </Tab>
  <Tab title="Groups">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (predefinito: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom` controlla chi può attivare nei gruppi quando `allowlist` è impostato.

  </Tab>
</Tabs>

### Arricchimento dei nomi dei contatti (macOS, facoltativo)

I Webhook di gruppo BlueBubbles spesso includono solo indirizzi grezzi dei partecipanti. Se vuoi che il contesto `GroupMembers` mostri invece i nomi dei contatti locali, puoi attivare l'arricchimento tramite Contatti locali su macOS:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` abilita la ricerca. Predefinito: `false`.
- Le ricerche vengono eseguite solo dopo che l'accesso al gruppo, l'autorizzazione dei comandi e il gating delle menzioni hanno consentito il passaggio del messaggio.
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

BlueBubbles supporta il gating delle menzioni per le chat di gruppo, corrispondente al comportamento di iMessage/WhatsApp:

- Usa `agents.list[].groupChat.mentionPatterns` (o `messages.groupChat.mentionPatterns`) per rilevare le menzioni.
- Quando `requireMention` è abilitato per un gruppo, l'agente risponde solo quando viene menzionato.
- I comandi di controllo da mittenti autorizzati bypassano il gating delle menzioni.

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
- Usa `allowFrom` e `groupAllowFrom` per determinare l'autorizzazione dei comandi.
- I mittenti autorizzati possono eseguire comandi di controllo anche senza menzionare nei gruppi.

### Prompt di sistema per gruppo

Ogni voce sotto `channels.bluebubbles.groups.*` accetta una stringa `systemPrompt` facoltativa. Il valore viene iniettato nel prompt di sistema dell'agente a ogni turno che gestisce un messaggio in quel gruppo, così puoi impostare regole di persona o comportamento per gruppo senza modificare i prompt dell'agente:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "Keep responses under 3 sentences. Mirror the group's casual tone.",
        },
      },
    },
  },
}
```

La chiave corrisponde a qualunque valore BlueBubbles riporti come `chatGuid` / `chatIdentifier` / `chatId` numerico per il gruppo, e una voce jolly `"*"` fornisce un valore predefinito per ogni gruppo senza una corrispondenza esatta (lo stesso modello usato da `requireMention` e dalle policy degli strumenti per gruppo). Le corrispondenze esatte hanno sempre la precedenza sul jolly. I DM ignorano questo campo; usa invece la personalizzazione del prompt a livello di agente o di account.

#### Esempio svolto: risposte in thread e reazioni tapback (API privata)

Con l'API privata di BlueBubbles abilitata, i messaggi in ingresso arrivano con ID messaggio brevi (per esempio `[[reply_to:5]]`) e l'agente può chiamare `action=reply` per inserire la risposta in thread sotto un messaggio specifico oppure `action=react` per aggiungere un tapback. Un `systemPrompt` per gruppo è un modo affidabile per far scegliere all'agente lo strumento corretto:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "When replying in this group, always call action=reply with the",
            "[[reply_to:N]] messageId from context so your response threads",
            "under the triggering message. Never send a new unlinked message.",
            "",
            "For short acknowledgements ('ok', 'got it', 'on it'), use",
            "action=react with an appropriate tapback emoji (❤️, 👍, 😂, ‼️, ❓)",
            "instead of sending a text reply.",
          ].join(" "),
        },
      },
    },
  },
}
```

Le reazioni tapback e le risposte in thread richiedono entrambe l'API privata di BlueBubbles; consulta [Azioni avanzate](#advanced-actions) e [ID messaggio](#message-ids-short-vs-full) per la meccanica sottostante.

## Binding conversazione ACP

Le chat BlueBubbles possono essere trasformate in workspace ACP durevoli senza cambiare il livello di trasporto.

Flusso rapido per l'operatore:

- Esegui `/acp spawn codex --bind here` nel DM o nella chat di gruppo consentita.
- I messaggi futuri nella stessa conversazione BlueBubbles vengono instradati alla sessione ACP creata.
- `/new` e `/reset` reimpostano sul posto la stessa sessione ACP associata.
- `/acp close` chiude la sessione ACP e rimuove il binding.

Sono supportati anche binding persistenti configurati tramite voci `bindings[]` di livello superiore con `type: "acp"` e `match.channel: "bluebubbles"`.

`match.peer.id` può usare qualsiasi forma di destinazione BlueBubbles supportata:

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

Consulta [Agenti ACP](/it/tools/acp-agents) per il comportamento condiviso dei binding ACP.

## Digitazione + conferme di lettura

- **Indicatori di digitazione**: inviati automaticamente prima e durante la generazione della risposta.
- **Conferme di lettura**: controllate da `channels.bluebubbles.sendReadReceipts` (predefinito: `true`).
- **Indicatori di digitazione**: OpenClaw invia eventi di inizio digitazione; BlueBubbles cancella automaticamente la digitazione all'invio o al timeout (l'arresto manuale tramite DELETE non è affidabile).

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

<AccordionGroup>
  <Accordion title="Azioni disponibili">
    - **react**: aggiunge/rimuove reazioni tapback (`messageId`, `emoji`, `remove`). Il set tapback nativo di iMessage è `love`, `like`, `dislike`, `laugh`, `emphasize` e `question`. Quando un agent sceglie un'emoji fuori da quel set (per esempio `👀`), lo strumento di reazione ripiega su `love` così il tapback viene comunque visualizzato invece di far fallire l'intera richiesta. Le reazioni di ack configurate sono comunque validate in modo rigoroso e generano errore su valori sconosciuti.
    - **edit**: modifica un messaggio inviato (`messageId`, `text`).
    - **unsend**: annulla l'invio di un messaggio (`messageId`).
    - **reply**: risponde a un messaggio specifico (`messageId`, `text`, `to`).
    - **sendWithEffect**: invia con effetto iMessage (`text`, `to`, `effectId`).
    - **renameGroup**: rinomina una chat di gruppo (`chatGuid`, `displayName`).
    - **setGroupIcon**: imposta l'icona/foto di una chat di gruppo (`chatGuid`, `media`) — instabile su macOS 26 Tahoe (l'API può restituire esito positivo ma l'icona non si sincronizza).
    - **addParticipant**: aggiunge qualcuno a un gruppo (`chatGuid`, `address`).
    - **removeParticipant**: rimuove qualcuno da un gruppo (`chatGuid`, `address`).
    - **leaveGroup**: abbandona una chat di gruppo (`chatGuid`).
    - **upload-file**: invia media/file (`to`, `buffer`, `filename`, `asVoice`).
      - Memo vocali: imposta `asVoice: true` con audio **MP3** o **CAF** per inviare come messaggio vocale iMessage. BlueBubbles converte MP3 → CAF quando invia memo vocali.
    - Alias legacy: `sendAttachment` funziona ancora, ma `upload-file` è il nome canonico dell'azione.

  </Accordion>
</AccordionGroup>

### ID dei messaggi (brevi vs completi)

OpenClaw può esporre ID messaggio _brevi_ (ad es. `1`, `2`) per risparmiare token.

- `MessageSid` / `ReplyToId` possono essere ID brevi.
- `MessageSidFull` / `ReplyToIdFull` contengono gli ID completi del provider.
- Gli ID brevi sono in memoria; possono scadere al riavvio o all'espulsione dalla cache.
- Le azioni accettano `messageId` breve o completo, ma gli ID brevi genereranno errore se non sono più disponibili.

Usa gli ID completi per automazioni e archiviazione durevoli:

- Template: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Contesto: `MessageSidFull` / `ReplyToIdFull` nei payload in ingresso

Vedi [Configurazione](/it/gateway/configuration) per le variabili dei template.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Coalescenza dei DM con invio diviso (comando + URL in un'unica composizione)

Quando un utente digita insieme un comando e un URL in iMessage — ad es. `Dump https://example.com/article` — Apple divide l'invio in **due consegne Webhook separate**:

1. Un messaggio di testo (`"Dump"`).
2. Un fumetto di anteprima URL (`"https://..."`) con immagini di anteprima OG come allegati.

I due Webhook arrivano a OpenClaw a circa 0,8-2,0 s di distanza nella maggior parte delle configurazioni. Senza coalescenza, l'agent riceve il solo comando al turno 1, risponde (spesso "mandami l'URL") e vede l'URL solo al turno 2 — a quel punto il contesto del comando è già perso.

`channels.bluebubbles.coalesceSameSenderDms` abilita per un DM l'unione di Webhook consecutivi dello stesso mittente in un singolo turno dell'agent. Le chat di gruppo continuano a usare una chiave per messaggio, così la struttura dei turni multiutente viene preservata.

<Tabs>
  <Tab title="Quando abilitare">
    Abilita quando:

    - Distribuisci skills che si aspettano `command + payload` in un unico messaggio (dump, paste, save, queue, ecc.).
    - I tuoi utenti incollano URL, immagini o contenuti lunghi insieme ai comandi.
    - Puoi accettare la latenza aggiuntiva dei turni DM (vedi sotto).

    Lascia disabilitato quando:

    - Ti serve latenza minima dei comandi per trigger DM di una sola parola.
    - Tutti i tuoi flussi sono comandi una tantum senza payload successivi.

  </Tab>
  <Tab title="Abilitazione">
    ```json5
    {
      channels: {
        bluebubbles: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    Con il flag attivo e senza `messages.inbound.byChannel.bluebubbles` esplicito, la finestra di debounce si amplia a **2500 ms** (il valore predefinito senza coalescenza è 500 ms). La finestra più ampia è necessaria — la cadenza split-send di Apple di 0,8-2,0 s non rientra nel valore predefinito più stretto.

    Per regolare personalmente la finestra:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500 ms works for most setups; raise to 4000 ms if your Mac is slow
            // or under memory pressure (observed gap can stretch past 2 s then).
            bluebubbles: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Compromessi">
    - **Latenza aggiunta per i comandi di controllo DM.** Con il flag attivo, i messaggi di comando di controllo DM (come `Dump`, `Save`, ecc.) ora attendono fino alla finestra di debounce prima dell'invio, nel caso stia arrivando un Webhook con payload. I comandi nelle chat di gruppo mantengono l'invio istantaneo.
    - **L'output unito è limitato** — il testo unito è limitato a 4000 caratteri con un marcatore esplicito `…[truncated]`; gli allegati sono limitati a 20; le voci sorgente sono limitate a 10 (oltre quel limite vengono mantenute la prima e le più recenti). Ogni `messageId` sorgente raggiunge comunque la deduplicazione in ingresso, quindi un replay successivo da MessagePoller di un singolo evento viene riconosciuto come duplicato.
    - **Opt-in, per canale.** Gli altri canali (Telegram, WhatsApp, Slack, …) non sono interessati.

  </Tab>
</Tabs>

### Scenari e cosa vede l'agent

| L'utente compone                                                   | Apple consegna            | Flag disattivo (predefinito)                 | Flag attivo + finestra 2500 ms                                          |
| ------------------------------------------------------------------ | ------------------------- | -------------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (un invio)                              | 2 Webhook a circa 1 s di distanza | Due turni dell'agent: solo "Dump", poi URL | Un turno: testo unito `Dump https://example.com`                        |
| `Save this 📎image.jpg caption` (allegato + testo)                 | 2 Webhook                 | Due turni                                    | Un turno: testo + immagine                                              |
| `/status` (comando autonomo)                                       | 1 Webhook                 | Invio istantaneo                             | **Attende fino alla finestra, poi invia**                               |
| URL incollato da solo                                              | 1 Webhook                 | Invio istantaneo                             | Invio istantaneo (solo una voce nel bucket)                             |
| Testo + URL inviati come due messaggi separati deliberati, a minuti di distanza | 2 Webhook fuori finestra | Due turni                                    | Due turni (la finestra scade tra i due)                                 |
| Flood rapido (>10 piccoli DM dentro la finestra)                   | N Webhook                 | N turni                                      | Un turno, output limitato (prima + più recenti, limiti testo/allegati applicati) |

### Risoluzione dei problemi della coalescenza split-send

Se il flag è attivo e gli split-send arrivano ancora come due turni, controlla ogni livello:

<AccordionGroup>
  <Accordion title="Configurazione effettivamente caricata">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    Poi `openclaw gateway restart` — il flag viene letto alla creazione del registro dei debouncer.

  </Accordion>
  <Accordion title="Finestra di debounce abbastanza ampia per la tua configurazione">
    Guarda il log del server BlueBubbles in `~/Library/Logs/bluebubbles-server/main.log`:

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    Misura l'intervallo tra il dispatch del testo stile `"Dump"` e il dispatch successivo `"https://..."; Attachments:`. Aumenta `messages.inbound.byChannel.bluebubbles` fino a coprire comodamente quell'intervallo.

  </Accordion>
  <Accordion title="Timestamp JSONL di sessione ≠ arrivo del Webhook">
    I timestamp degli eventi di sessione (`~/.openclaw/agents/<id>/sessions/*.jsonl`) riflettono quando il Gateway consegna un messaggio all'agent, **non** quando è arrivato il Webhook. Un secondo messaggio in coda taggato `[Queued messages while agent was busy]` significa che il primo turno era ancora in esecuzione quando è arrivato il secondo Webhook — il bucket di coalescenza era già stato svuotato. Regola la finestra in base al log del server BB, non al log di sessione.
  </Accordion>
  <Accordion title="Pressione di memoria che rallenta il dispatch della risposta">
    Su macchine più piccole (8 GB), i turni dell'agent possono richiedere abbastanza tempo perché il bucket di coalescenza venga svuotato prima del completamento della risposta, e l'URL arrivi come secondo turno in coda. Controlla `memory_pressure` e `ps -o rss -p $(pgrep openclaw-gateway)`; se il Gateway supera circa 500 MB RSS e il compressore è attivo, chiudi altri processi pesanti o passa a un host più grande.
  </Accordion>
  <Accordion title="Gli invii con citazione di risposta seguono un percorso diverso">
    Se l'utente ha toccato `Dump` come **risposta** a un fumetto URL esistente (iMessage mostra un badge "1 Reply" sul fumetto Dump), l'URL vive in `replyToBody`, non in un secondo Webhook. La coalescenza non si applica — è una questione di skill/prompt, non del debouncer.
  </Accordion>
</AccordionGroup>

## Streaming a blocchi

Controlla se le risposte vengono inviate come messaggio singolo o in streaming a blocchi:

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
- Limite media tramite `channels.bluebubbles.mediaMaxMb` per media in ingresso e in uscita (predefinito: 8 MB).
- Il testo in uscita viene suddiviso in chunk fino a `channels.bluebubbles.textChunkLimit` (predefinito: 4000 caratteri).

## Riferimento di configurazione

Configurazione completa: [Configurazione](/it/gateway/configuration)

<AccordionGroup>
  <Accordion title="Connessione e Webhook">
    - `channels.bluebubbles.enabled`: abilita/disabilita il canale.
    - `channels.bluebubbles.serverUrl`: URL di base dell'API REST BlueBubbles.
    - `channels.bluebubbles.password`: password API.
    - `channels.bluebubbles.webhookPath`: percorso dell'endpoint Webhook (predefinito: `/bluebubbles-webhook`).

  </Accordion>
  <Accordion title="Criterio di accesso">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (predefinito: `pairing`).
    - `channels.bluebubbles.allowFrom`: allowlist DM (handle, email, numeri E.164, `chat_id:*`, `chat_guid:*`).
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (predefinito: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom`: allowlist dei mittenti di gruppo.
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: su macOS, opzionalmente arricchisce i partecipanti di gruppo senza nome dai Contatti locali dopo il superamento del gating. Predefinito: `false`.
    - `channels.bluebubbles.groups`: configurazione per gruppo (`requireMention`, ecc.).

  </Accordion>
  <Accordion title="Consegna e suddivisione in blocchi">
    - `channels.bluebubbles.sendReadReceipts`: Invia conferme di lettura (predefinito: `true`).
    - `channels.bluebubbles.blockStreaming`: Abilita lo streaming a blocchi (predefinito: `false`; richiesto per le risposte in streaming).
    - `channels.bluebubbles.textChunkLimit`: Dimensione dei blocchi in uscita in caratteri (predefinito: 4000).
    - `channels.bluebubbles.sendTimeoutMs`: Timeout per richiesta in ms per gli invii di testo in uscita tramite `/api/v1/message/text` (predefinito: 30000). Aumentalo nelle configurazioni macOS 26 in cui gli invii iMessage tramite Private API possono bloccarsi per oltre 60 secondi all'interno del framework iMessage; per esempio `45000` o `60000`. Probe, ricerche chat, reazioni, modifiche e controlli di integrità mantengono attualmente il valore predefinito più breve di 10 s; l'estensione della copertura a reazioni e modifiche è prevista come attività successiva. Override per account: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
    - `channels.bluebubbles.chunkMode`: `length` (predefinito) suddivide solo quando viene superato `textChunkLimit`; `newline` suddivide sulle righe vuote (confini di paragrafo) prima della suddivisione per lunghezza.

  </Accordion>
  <Accordion title="Media e cronologia">
    - `channels.bluebubbles.mediaMaxMb`: Limite dei media in ingresso/uscita in MB (predefinito: 8).
    - `channels.bluebubbles.mediaLocalRoots`: Allowlist esplicita di directory locali assolute consentite per i percorsi dei media locali in uscita. Gli invii da percorsi locali sono negati per impostazione predefinita a meno che questa opzione non sia configurata. Override per account: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
    - `channels.bluebubbles.coalesceSameSenderDms`: Unisce Webhook DM consecutivi dello stesso mittente in un unico turno dell'agente, così l'invio separato testo+URL di Apple arriva come un singolo messaggio (predefinito: `false`). Vedi [Unione dei DM inviati separatamente](#coalescing-split-send-dms-command--url-in-one-composition) per scenari, regolazione della finestra e compromessi. Quando abilitato senza un `messages.inbound.byChannel.bluebubbles` esplicito, amplia la finestra di debounce predefinita in ingresso da 500 ms a 2500 ms.
    - `channels.bluebubbles.historyLimit`: Numero massimo di messaggi di gruppo per il contesto (0 disabilita).
    - `channels.bluebubbles.dmHistoryLimit`: Limite della cronologia DM.
    - `channels.bluebubbles.replyContextApiFallback`: Quando una risposta in ingresso arriva senza `replyToBody`/`replyToSender` e la cache in memoria del contesto di risposta non trova una corrispondenza, recupera il messaggio originale dall'API HTTP di BlueBubbles come fallback best-effort (predefinito: `false`). Utile per distribuzioni multi-istanza che condividono un account BlueBubbles, dopo riavvii del processo o dopo l'espulsione da una cache TTL/LRU di lunga durata. Il recupero è protetto da SSRF dalla stessa policy di ogni altra richiesta del client BlueBubbles, non genera mai errori e popola la cache così le risposte successive ammortizzano il costo. Override per account: `channels.bluebubbles.accounts.<accountId>.replyContextApiFallback`. Un'impostazione a livello di canale si propaga agli account che omettono il flag.

  </Accordion>
  <Accordion title="Azioni e account">
    - `channels.bluebubbles.actions`: Abilita/disabilita azioni specifiche.
    - `channels.bluebubbles.accounts`: Configurazione multi-account.

  </Accordion>
</AccordionGroup>

Opzioni globali correlate:

- `agents.list[].groupChat.mentionPatterns` (o `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Indirizzamento / destinazioni di consegna

Preferisci `chat_guid` per un instradamento stabile:

- `chat_guid:iMessage;-;+15555550123` (preferito per i gruppi)
- `chat_id:123`
- `chat_identifier:...`
- Handle diretti: `+15555550123`, `user@example.com`
  - Se un handle diretto non ha una chat DM esistente, OpenClaw ne creerà una tramite `POST /api/v1/chat/new`. Questo richiede che la Private API di BlueBubbles sia abilitata.

### Instradamento iMessage rispetto a SMS

Quando lo stesso handle ha sia una chat iMessage sia una chat SMS sul Mac (per esempio un numero di telefono registrato a iMessage ma che ha ricevuto anche fallback con bolle verdi), OpenClaw preferisce la chat iMessage e non effettua mai automaticamente il downgrade a SMS. Per forzare la chat SMS, usa un prefisso di destinazione `sms:` esplicito (per esempio `sms:+15555550123`). Gli handle senza una chat iMessage corrispondente vengono comunque inviati tramite qualsiasi chat segnalata da BlueBubbles.

## Sicurezza

- Le richieste Webhook vengono autenticate confrontando i parametri di query o gli header `guid`/`password` con `channels.bluebubbles.password`.
- Mantieni segreti la password dell'API e l'endpoint Webhook (trattali come credenziali).
- Non esiste bypass localhost per l'autenticazione Webhook di BlueBubbles. Se esegui il proxy del traffico Webhook, mantieni la password BlueBubbles nella richiesta end-to-end. `gateway.trustedProxies` non sostituisce `channels.bluebubbles.password` qui. Vedi [Sicurezza del Gateway](/it/gateway/security#reverse-proxy-configuration).
- Abilita HTTPS e regole firewall sul server BlueBubbles se lo esponi al di fuori della LAN.

## Risoluzione dei problemi

- Se gli eventi di digitazione/lettura smettono di funzionare, controlla i log Webhook di BlueBubbles e verifica che il percorso del gateway corrisponda a `channels.bluebubbles.webhookPath`.
- I codici di abbinamento scadono dopo un'ora; usa `openclaw pairing list bluebubbles` e `openclaw pairing approve bluebubbles <code>`.
- Le reazioni richiedono la Private API di BlueBubbles (`POST /api/v1/message/react`); assicurati che la versione del server la esponga.
- Modifica/annullamento dell'invio richiedono macOS 13+ e una versione compatibile del server BlueBubbles. Su macOS 26 (Tahoe), la modifica è attualmente non funzionante a causa di modifiche alla Private API.
- Gli aggiornamenti dell'icona del gruppo possono essere instabili su macOS 26 (Tahoe): l'API può restituire successo ma la nuova icona potrebbe non sincronizzarsi.
- OpenClaw nasconde automaticamente le azioni note come non funzionanti in base alla versione macOS del server BlueBubbles. Se la modifica appare ancora su macOS 26 (Tahoe), disabilitala manualmente con `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` abilitato ma gli invii separati (ad esempio `Dump` + URL) arrivano ancora come due turni: consulta la checklist di [risoluzione dei problemi dell'unione degli invii separati](#split-send-coalescing-troubleshooting) — cause comuni sono una finestra di debounce troppo stretta, timestamp dei log di sessione letti erroneamente come arrivo del Webhook, o l'invio di una citazione di risposta (che usa `replyToBody`, non un secondo Webhook).
- Per informazioni su stato/integrità: `openclaw status --all` o `openclaw status --deep`.

Per un riferimento generale sul flusso di lavoro dei canali, vedi [Canali](/it/channels) e la guida [Plugins](/it/tools/plugin).

## Correlati

- [Instradamento dei canali](/it/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e controllo delle menzioni
- [Abbinamento](/it/channels/pairing) — autenticazione DM e flusso di abbinamento
- [Sicurezza](/it/gateway/security) — modello di accesso e rafforzamento
