---
read_when:
    - Configurazione del canale BlueBubbles
    - Risoluzione dei problemi di abbinamento del Webhook
    - Configurazione di iMessage su macOS
summary: iMessage tramite il server macOS BlueBubbles (invio/ricezione REST, digitazione, reazioni, abbinamento, azioni avanzate).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-23T08:23:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1c1670bb453a1f78bb8e35e4b7065ceeba46ce93180e1288745621f8c4179c9
    source_path: channels/bluebubbles.md
    workflow: 15
---

# BlueBubbles (REST macOS)

Stato: Plugin incluso che comunica con il server macOS BlueBubbles tramite HTTP. **Consigliato per l'integrazione con iMessage** grazie alla sua API più ricca e alla configurazione più semplice rispetto al canale imsg legacy.

## Plugin incluso

Le attuali versioni di OpenClaw includono BlueBubbles, quindi le normali build pacchettizzate non richiedono un passaggio separato con `openclaw plugins install`.

## Panoramica

- Funziona su macOS tramite l'app helper BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Consigliato/testato: macOS Sequoia (15). macOS Tahoe (26) funziona; attualmente la modifica è interrotta su Tahoe e gli aggiornamenti dell'icona del gruppo possono segnalare successo ma non sincronizzarsi.
- OpenClaw comunica con esso tramite la sua API REST (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- I messaggi in arrivo arrivano tramite Webhook; le risposte in uscita, gli indicatori di digitazione, le conferme di lettura e i tapback sono chiamate REST.
- Gli allegati e gli sticker vengono acquisiti come contenuti multimediali in ingresso (e mostrati all'agente quando possibile).
- L'abbinamento/allowlist funziona allo stesso modo degli altri canali (`/channels/pairing` ecc.) con `channels.bluebubbles.allowFrom` + codici di abbinamento.
- Le reazioni vengono esposte come eventi di sistema proprio come Slack/Telegram, così gli agenti possono "menzionarle" prima di rispondere.
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

4. Punta i Webhook di BlueBubbles al tuo Gateway (esempio: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
5. Avvia il Gateway; registrerà il gestore del Webhook e inizierà l'abbinamento.

Nota sulla sicurezza:

- Imposta sempre una password per il Webhook.
- L'autenticazione del Webhook è sempre obbligatoria. OpenClaw rifiuta le richieste Webhook BlueBubbles a meno che non includano una password/guid che corrisponda a `channels.bluebubbles.password` (ad esempio `?password=<password>` o `x-password`), indipendentemente dalla topologia loopback/proxy.
- L'autenticazione con password viene verificata prima di leggere/analizzare i corpi completi dei Webhook.

## Mantenere attivo Messages.app (configurazioni VM / headless)

Alcune configurazioni macOS VM / always-on possono finire con Messages.app in stato “idle” (gli eventi in ingresso si fermano finché l'app non viene aperta/portata in primo piano). Una semplice soluzione consiste nel **sollecitare Messages ogni 5 minuti** usando un AppleScript + LaunchAgent.

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

- Questo viene eseguito **ogni 300 secondi** e **all'accesso**.
- La prima esecuzione può attivare prompt macOS **Automation** (`osascript` → Messages). Approvali nella stessa sessione utente che esegue il LaunchAgent.

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

- **URL del server** (obbligatorio): indirizzo del server BlueBubbles (ad esempio `http://192.168.1.100:1234`)
- **Password** (obbligatoria): password API dalle impostazioni di BlueBubbles Server
- **Percorso Webhook** (facoltativo): predefinito `/bluebubbles-webhook`
- **Criterio DM**: pairing, allowlist, open o disabled
- **Lista di autorizzazione**: numeri di telefono, email o destinazioni chat

Puoi anche aggiungere BlueBubbles tramite CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Controllo degli accessi (DM + gruppi)

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

### Arricchimento del nome contatto (macOS, facoltativo)

I Webhook di gruppo BlueBubbles spesso includono solo indirizzi grezzi dei partecipanti. Se vuoi che il contesto `GroupMembers` mostri invece i nomi dei contatti locali, puoi attivare l'arricchimento dai Contatti locali su macOS:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` abilita la ricerca. Predefinito: `false`.
- Le ricerche vengono eseguite solo dopo che l'accesso al gruppo, l'autorizzazione del comando e il gating delle menzioni hanno consentito il passaggio del messaggio.
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
- I comandi di controllo da mittenti autorizzati bypassano il gating delle menzioni.

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

### Gating dei comandi

- I comandi di controllo (ad esempio `/config`, `/model`) richiedono autorizzazione.
- Usa `allowFrom` e `groupAllowFrom` per determinare l'autorizzazione dei comandi.
- I mittenti autorizzati possono eseguire comandi di controllo anche senza menzionare nei gruppi.

### Prompt di sistema per gruppo

Ogni voce sotto `channels.bluebubbles.groups.*` accetta una stringa `systemPrompt` facoltativa. Il valore viene iniettato nel prompt di sistema dell'agente a ogni turno che gestisce un messaggio in quel gruppo, così puoi impostare persona o regole comportamentali per gruppo senza modificare i prompt dell'agente:

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

Con la Private API di BlueBubbles abilitata, i messaggi in ingresso arrivano con ID messaggio brevi (ad esempio `[[reply_to:5]]`) e l'agente può chiamare `action=reply` per inserire la risposta in un messaggio specifico oppure `action=react` per aggiungere un tapback. Un `systemPrompt` per gruppo è un modo affidabile per far sì che l'agente scelga lo strumento corretto:

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
            "Per brevi conferme ('ok', 'ricevuto', 'ci penso io'), usa",
            "action=react con un'emoji tapback appropriata (❤️, 👍, 😂, ‼️, ❓)",
            "invece di inviare una risposta testuale.",
          ].join(" "),
        },
      },
    },
  },
}
```

Le reazioni tapback e le risposte in thread richiedono entrambe la BlueBubbles Private API; vedi [Azioni avanzate](#advanced-actions) e [ID messaggio](#message-ids-short-vs-full) per il funzionamento sottostante.

## Associazioni conversazione ACP

Le chat BlueBubbles possono essere trasformate in workspace ACP durevoli senza modificare il livello di trasporto.

Flusso operativo rapido:

- Esegui `/acp spawn codex --bind here` all'interno del DM o della chat di gruppo consentita.
- I messaggi futuri nella stessa conversazione BlueBubbles verranno instradati alla sessione ACP avviata.
- `/new` e `/reset` reimpostano sul posto la stessa sessione ACP associata.
- `/acp close` chiude la sessione ACP e rimuove l'associazione.

Sono supportate anche associazioni persistenti configurate tramite voci `bindings[]` di livello superiore con `type: "acp"` e `match.channel: "bluebubbles"`.

`match.peer.id` può usare qualsiasi formato di destinazione BlueBubbles supportato:

- handle DM normalizzato come `+15555550123` o `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Per associazioni stabili ai gruppi, preferisci `chat_id:*` o `chat_identifier:*`.

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

Vedi [ACP Agents](/it/tools/acp-agents) per il comportamento condiviso delle associazioni ACP.

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
        reply: true, // thread di risposta tramite GUID del messaggio
        sendWithEffect: true, // effetti messaggio (slam, loud, ecc.)
        renameGroup: true, // rinomina le chat di gruppo
        setGroupIcon: true, // imposta l'icona/foto della chat di gruppo (instabile su macOS 26 Tahoe)
        addParticipant: true, // aggiunge partecipanti ai gruppi
        removeParticipant: true, // rimuove partecipanti dai gruppi
        leaveGroup: true, // esce dalle chat di gruppo
        sendAttachment: true, // invia allegati/contenuti multimediali
      },
    },
  },
}
```

Azioni disponibili:

- **react**: aggiunge/rimuove reazioni tapback (`messageId`, `emoji`, `remove`). Il set nativo di tapback di iMessage è `love`, `like`, `dislike`, `laugh`, `emphasize` e `question`. Quando un agente sceglie un'emoji al di fuori di questo set (ad esempio `👀`), lo strumento di reazione usa come fallback `love` in modo che il tapback venga comunque visualizzato invece di far fallire l'intera richiesta. Le reazioni di conferma configurate continuano a essere validate rigorosamente e restituiscono errore per valori sconosciuti.
- **edit**: modifica un messaggio inviato (`messageId`, `text`)
- **unsend**: annulla l'invio di un messaggio (`messageId`)
- **reply**: risponde a un messaggio specifico (`messageId`, `text`, `to`)
- **sendWithEffect**: invia con un effetto iMessage (`text`, `to`, `effectId`)
- **renameGroup**: rinomina una chat di gruppo (`chatGuid`, `displayName`)
- **setGroupIcon**: imposta l'icona/foto di una chat di gruppo (`chatGuid`, `media`) — instabile su macOS 26 Tahoe (l'API può restituire successo ma l'icona non si sincronizza).
- **addParticipant**: aggiunge una persona a un gruppo (`chatGuid`, `address`)
- **removeParticipant**: rimuove una persona da un gruppo (`chatGuid`, `address`)
- **leaveGroup**: esce da una chat di gruppo (`chatGuid`)
- **upload-file**: invia contenuti multimediali/file (`to`, `buffer`, `filename`, `asVoice`)
  - Memo vocali: imposta `asVoice: true` con audio **MP3** o **CAF** per inviarlo come messaggio vocale iMessage. BlueBubbles converte MP3 → CAF durante l'invio dei memo vocali.
- Alias legacy: `sendAttachment` continua a funzionare, ma `upload-file` è il nome d'azione canonico.

### ID messaggio (brevi vs completi)

OpenClaw può esporre ID messaggio _brevi_ (ad esempio `1`, `2`) per risparmiare token.

- `MessageSid` / `ReplyToId` possono essere ID brevi.
- `MessageSidFull` / `ReplyToIdFull` contengono gli ID completi del provider.
- Gli ID brevi sono in memoria; possono scadere al riavvio o con l'espulsione della cache.
- Le azioni accettano `messageId` brevi o completi, ma gli ID brevi restituiranno errore se non sono più disponibili.

Usa gli ID completi per automazioni e archiviazione durevoli:

- Template: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Contesto: `MessageSidFull` / `ReplyToIdFull` nei payload in ingresso

Vedi [Configurazione](/it/gateway/configuration) per le variabili dei template.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Coalescenza dei DM con invio suddiviso (comando + URL in un'unica composizione)

Quando un utente digita insieme un comando e un URL in iMessage — ad esempio `Dump https://example.com/article` — Apple divide l'invio in **due consegne Webhook separate**:

1. Un messaggio di testo (`"Dump"`).
2. Un balloon di anteprima URL (`"https://..."`) con immagini di anteprima OG come allegati.

I due Webhook arrivano a OpenClaw a distanza di ~0,8-2,0 s nella maggior parte delle configurazioni. Senza coalescenza, l'agente riceve il solo comando al turno 1, risponde (spesso "inviami l'URL") e vede l'URL solo al turno 2 — quando il contesto del comando è già andato perso.

`channels.bluebubbles.coalesceSameSenderDms` abilita per un DM l'unione di Webhook consecutivi dello stesso mittente in un unico turno agente. Le chat di gruppo continuano invece a usare la chiave per messaggio, così viene preservata la struttura dei turni multiutente.

### Quando abilitarla

Abilitala quando:

- distribuisci Skills che si aspettano `comando + payload` in un unico messaggio (dump, paste, save, queue, ecc.).
- i tuoi utenti incollano URL, immagini o contenuti lunghi insieme ai comandi.
- puoi accettare la latenza aggiuntiva del turno DM (vedi sotto).

Lasciala disabilitata quando:

- hai bisogno della latenza minima dei comandi per trigger DM composti da una sola parola.
- tutti i tuoi flussi sono comandi one-shot senza payload successivi.

### Abilitazione

```json5
{
  channels: {
    bluebubbles: {
      coalesceSameSenderDms: true, // attiva esplicitamente (predefinito: false)
    },
  },
}
```

Con il flag attivo e senza un `messages.inbound.byChannel.bluebubbles` esplicito, la finestra di debounce si amplia a **2500 ms** (il valore predefinito senza coalescenza è 500 ms). La finestra più ampia è necessaria: la cadenza di invio suddiviso di Apple di 0,8-2,0 s non rientra nel valore predefinito più stretto.

Per regolare manualmente la finestra:

```json5
{
  messages: {
    inbound: {
      byChannel: {
        // 2500 ms funziona per la maggior parte delle configurazioni; aumenta a 4000 ms se il tuo Mac è lento
        // o sotto pressione di memoria (in quel caso il divario osservato può superare i 2 s).
        bluebubbles: 2500,
      },
    },
  },
}
```

### Compromessi

- **Latenza aggiuntiva per i comandi di controllo nei DM.** Con il flag attivo, i messaggi di comando di controllo nei DM (come `Dump`, `Save`, ecc.) ora attendono fino alla finestra di debounce prima dell'invio, nel caso stia arrivando un Webhook con payload. I comandi nelle chat di gruppo continuano a essere inviati istantaneamente.
- **L'output unito è limitato** — il testo unito è limitato a 4000 caratteri con un marcatore esplicito `…[truncated]`; gli allegati sono limitati a 20; le voci di origine sono limitate a 10 (oltre tale numero vengono mantenuti il primo e gli ultimi). Ogni `messageId` di origine raggiunge comunque la deduplica in ingresso, così un successivo replay MessagePoller di qualsiasi singolo evento viene riconosciuto come duplicato.
- **Attivazione esplicita, per canale.** Gli altri canali (Telegram, WhatsApp, Slack, …) non sono interessati.

### Scenari e cosa vede l'agente

| Composizione dell'utente                                           | Consegna Apple             | Flag disattivato (predefinito)          | Flag attivato + finestra di 2500 ms                                       |
| ------------------------------------------------------------------ | -------------------------- | --------------------------------------- | ------------------------------------------------------------------------- |
| `Dump https://example.com` (un solo invio)                         | 2 Webhook a ~1 s di distanza | Due turni agente: "Dump" da solo, poi URL | Un turno: testo unito `Dump https://example.com`                          |
| `Save this 📎image.jpg caption` (allegato + testo)                 | 2 Webhook                  | Due turni                               | Un turno: testo + immagine                                                |
| `/status` (comando standalone)                                     | 1 Webhook                  | Invio istantaneo                        | **Attende fino alla finestra, poi invia**                                 |
| URL incollato da solo                                              | 1 Webhook                  | Invio istantaneo                        | Invio istantaneo (solo una voce nel bucket)                               |
| Testo + URL inviati come due messaggi separati intenzionalmente, a minuti di distanza | 2 Webhook fuori finestra | Due turni                               | Due turni (la finestra scade tra i due)                                   |
| Raffica rapida (>10 piccoli DM dentro la finestra)                 | N Webhook                  | N turni                                 | Un turno, output limitato (primo + ultimi, con limiti su testo/allegati) |

### Risoluzione dei problemi della coalescenza per invio suddiviso

Se il flag è attivo e gli invii suddivisi continuano ad arrivare come due turni, controlla ogni livello:

1. **Configurazione effettivamente caricata.**

   ```
   grep coalesceSameSenderDms ~/.openclaw/openclaw.json
   ```

   Poi `openclaw gateway restart` — il flag viene letto alla creazione del registro di debouncer.

2. **Finestra di debounce abbastanza ampia per la tua configurazione.** Controlla il log del server BlueBubbles in `~/Library/Logs/bluebubbles-server/main.log`:

   ```
   grep -E "Dispatching event to webhook" main.log | tail -20
   ```

   Misura il divario tra l'invio del testo tipo `"Dump"` e il successivo invio `"https://..."; Attachments:`. Aumenta `messages.inbound.byChannel.bluebubbles` in modo da coprire comodamente quel divario.

3. **I timestamp JSONL della sessione ≠ arrivo del Webhook.** I timestamp degli eventi di sessione (`~/.openclaw/agents/<id>/sessions/*.jsonl`) riflettono quando il Gateway consegna un messaggio all'agente, **non** quando è arrivato il Webhook. Un secondo messaggio in coda etichettato `[Queued messages while agent was busy]` significa che il primo turno era ancora in esecuzione quando è arrivato il secondo Webhook — il bucket di coalescenza era già stato svuotato. Regola la finestra in base al log del server BB, non al log della sessione.

4. **Pressione di memoria che rallenta l'invio della risposta.** Su macchine più piccole (8 GB), i turni dell'agente possono richiedere abbastanza tempo da far sì che il bucket di coalescenza venga svuotato prima del completamento della risposta, e l'URL finisca come secondo turno in coda. Controlla `memory_pressure` e `ps -o rss -p $(pgrep openclaw-gateway)`; se il Gateway supera ~500 MB RSS e il compressore è attivo, chiudi altri processi pesanti o passa a un host più capiente.

5. **Gli invii con citazione di risposta seguono un percorso diverso.** Se l'utente ha toccato `Dump` come **risposta** a un balloon URL esistente (iMessage mostra un badge "1 Reply" sulla bolla Dump), l'URL si trova in `replyToBody`, non in un secondo Webhook. La coalescenza non si applica — è una questione di Skill/prompt, non di debouncer.

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

## Contenuti multimediali + limiti

- Gli allegati in ingresso vengono scaricati e memorizzati nella cache multimediale.
- Limite dei contenuti multimediali tramite `channels.bluebubbles.mediaMaxMb` per media in ingresso e in uscita (predefinito: 8 MB).
- Il testo in uscita viene suddiviso in blocchi secondo `channels.bluebubbles.textChunkLimit` (predefinito: 4000 caratteri).

## Riferimento configurazione

Configurazione completa: [Configurazione](/it/gateway/configuration)

Opzioni del provider:

- `channels.bluebubbles.enabled`: abilita/disabilita il canale.
- `channels.bluebubbles.serverUrl`: URL di base della REST API di BlueBubbles.
- `channels.bluebubbles.password`: password API.
- `channels.bluebubbles.webhookPath`: percorso dell'endpoint Webhook (predefinito: `/bluebubbles-webhook`).
- `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (predefinito: `pairing`).
- `channels.bluebubbles.allowFrom`: allowlist DM (handle, email, numeri E.164, `chat_id:*`, `chat_guid:*`).
- `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (predefinito: `allowlist`).
- `channels.bluebubbles.groupAllowFrom`: allowlist dei mittenti nei gruppi.
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`: su macOS, arricchisce facoltativamente i partecipanti senza nome nei gruppi dai Contatti locali dopo il superamento del gating. Predefinito: `false`.
- `channels.bluebubbles.groups`: configurazione per gruppo (`requireMention`, ecc.).
- `channels.bluebubbles.sendReadReceipts`: invia conferme di lettura (predefinito: `true`).
- `channels.bluebubbles.blockStreaming`: abilita lo streaming a blocchi (predefinito: `false`; richiesto per le risposte in streaming).
- `channels.bluebubbles.textChunkLimit`: dimensione dei blocchi in uscita in caratteri (predefinito: 4000).
- `channels.bluebubbles.sendTimeoutMs`: timeout per richiesta in ms per l'invio di testo in uscita tramite `/api/v1/message/text` (predefinito: 30000). Aumentalo su configurazioni macOS 26 in cui gli invii iMessage tramite Private API possono bloccarsi per oltre 60 secondi all'interno del framework iMessage; ad esempio `45000` o `60000`. Sonde, ricerche chat, reazioni, modifiche e controlli di integrità attualmente mantengono il valore predefinito più breve di 10 s; l'estensione della copertura a reazioni e modifiche è pianificata come seguito. Override per account: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
- `channels.bluebubbles.chunkMode`: `length` (predefinito) divide solo quando viene superato `textChunkLimit`; `newline` divide sulle righe vuote (confini dei paragrafi) prima della suddivisione per lunghezza.
- `channels.bluebubbles.mediaMaxMb`: limite dei media in ingresso/uscita in MB (predefinito: 8).
- `channels.bluebubbles.mediaLocalRoots`: allowlist esplicita di directory locali assolute consentite per i percorsi di media locali in uscita. Per impostazione predefinita, gli invii tramite percorso locale vengono negati a meno che questo non sia configurato. Override per account: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
- `channels.bluebubbles.coalesceSameSenderDms`: unisce Webhook DM consecutivi dello stesso mittente in un unico turno agente, così l'invio suddiviso testo+URL di Apple arriva come singolo messaggio (predefinito: `false`). Vedi [Coalescenza dei DM con invio suddiviso](#coalescing-split-send-dms-command--url-in-one-composition) per scenari, regolazione della finestra e compromessi. Quando abilitato senza un `messages.inbound.byChannel.bluebubbles` esplicito, amplia la finestra di debounce predefinita in ingresso da 500 ms a 2500 ms.
- `channels.bluebubbles.historyLimit`: numero massimo di messaggi di gruppo per il contesto (0 disabilita).
- `channels.bluebubbles.dmHistoryLimit`: limite della cronologia DM.
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

### Instradamento iMessage vs SMS

Quando lo stesso handle ha sia una chat iMessage sia una chat SMS sul Mac (ad esempio un numero di telefono registrato su iMessage ma che ha ricevuto anche fallback con bolla verde), OpenClaw preferisce la chat iMessage e non passa mai silenziosamente a SMS. Per forzare la chat SMS, usa un prefisso di destinazione `sms:` esplicito (ad esempio `sms:+15555550123`). Gli handle senza una chat iMessage corrispondente continuano a inviare tramite qualunque chat BlueBubbles segnali.

## Sicurezza

- Le richieste Webhook vengono autenticate confrontando i parametri di query o gli header `guid`/`password` con `channels.bluebubbles.password`.
- Mantieni segreti la password API e l'endpoint Webhook (trattali come credenziali).
- Non esiste bypass localhost per l'autenticazione Webhook BlueBubbles. Se fai proxy del traffico Webhook, mantieni la password BlueBubbles nella richiesta end-to-end. `gateway.trustedProxies` qui non sostituisce `channels.bluebubbles.password`. Vedi [Sicurezza del Gateway](/it/gateway/security#reverse-proxy-configuration).
- Abilita HTTPS + regole firewall sul server BlueBubbles se lo esponi al di fuori della tua LAN.

## Risoluzione dei problemi

- Se gli eventi di digitazione/lettura smettono di funzionare, controlla i log Webhook BlueBubbles e verifica che il percorso del Gateway corrisponda a `channels.bluebubbles.webhookPath`.
- I codici di abbinamento scadono dopo un'ora; usa `openclaw pairing list bluebubbles` e `openclaw pairing approve bluebubbles <code>`.
- Le reazioni richiedono la BlueBubbles private API (`POST /api/v1/message/react`); assicurati che la versione del server la esponga.
- Modifica/annullamento invio richiedono macOS 13+ e una versione compatibile del server BlueBubbles. Su macOS 26 (Tahoe), la modifica è attualmente non funzionante a causa di cambiamenti nella private API.
- Gli aggiornamenti dell'icona del gruppo possono essere instabili su macOS 26 (Tahoe): l'API può restituire successo ma la nuova icona non si sincronizza.
- OpenClaw nasconde automaticamente le azioni note come non funzionanti in base alla versione macOS del server BlueBubbles. Se la modifica continua a comparire su macOS 26 (Tahoe), disabilitala manualmente con `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` abilitato ma gli invii suddivisi (ad esempio `Dump` + URL) continuano ad arrivare come due turni: consulta la checklist di [risoluzione dei problemi della coalescenza per invio suddiviso](#split-send-coalescing-troubleshooting) — le cause comuni sono una finestra di debounce troppo stretta, timestamp del log di sessione interpretati erroneamente come arrivo del Webhook, oppure un invio con citazione di risposta (che usa `replyToBody`, non un secondo Webhook).
- Per informazioni su stato/integrità: `openclaw status --all` oppure `openclaw status --deep`.

Per un riferimento generale al flusso di lavoro dei canali, vedi [Canali](/it/channels) e la guida [Plugin](/it/tools/plugin).

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Pairing](/it/channels/pairing) — autenticazione DM e flusso di abbinamento
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e gating delle menzioni
- [Instradamento dei canali](/it/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e hardening
