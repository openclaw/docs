---
read_when:
    - Configurazione di un plugin di canale (autenticazione, controllo degli accessi, più account)
    - Risoluzione dei problemi relativi alle chiavi di configurazione per canale
    - Verifica dei criteri per i messaggi diretti, dei criteri per i gruppi o del filtro delle menzioni
summary: 'Configurazione dei canali: controllo degli accessi, associazione e chiavi specifiche per canale in Slack, Discord, Telegram, WhatsApp, Matrix, iMessage e altri servizi'
title: Configurazione — canali
x-i18n:
    generated_at: "2026-07-16T14:19:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8d2363844e203e0c44ad9fe5d7a6a994fc654517e0488cffb836ddc9d1cdcb29
    source_path: gateway/config-channels.md
    workflow: 16
---

Chiavi di configurazione per canale sotto `channels.*`: accesso a messaggi diretti e gruppi, configurazioni multi-account, filtro basato sulle menzioni e chiavi specifiche per Slack, Discord, Telegram, WhatsApp, Matrix, iMessage e altri Plugin di canale.

Per agenti, strumenti, runtime del Gateway e altre chiavi di primo livello, consultare il [riferimento della configurazione](/it/gateway/configuration-reference).

## Canali

Ogni canale si avvia automaticamente quando esiste la relativa sezione di configurazione (a meno che `enabled: false`). Telegram e iMessage sono inclusi nel pacchetto principale `openclaw`. Gli altri canali ufficiali (Discord, Slack, WhatsApp, Matrix, Microsoft Teams, IRC, Google Chat, Signal, Mattermost e altri) si installano come Plugin separati con `openclaw plugins install <spec>`; consultare [Canali](/it/channels) per l'elenco completo e le specifiche di installazione.

### Accesso a messaggi diretti e gruppi

Tutti i canali supportano criteri per i messaggi diretti e per i gruppi:

| Criterio per i messaggi diretti | Comportamento                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (predefinito) | I mittenti sconosciuti ricevono un codice di associazione monouso; il proprietario deve approvarlo |
| `allowlist`         | Solo mittenti in `allowFrom` (o nell'archivio degli elementi consentiti associati)             |
| `open`              | Consente tutti i messaggi diretti in entrata (richiede `allowFrom: ["*"]`)             |
| `disabled`          | Ignora tutti i messaggi diretti in entrata                                          |

| Criterio per i gruppi          | Comportamento                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (predefinito) | Solo i gruppi che corrispondono all'elenco degli elementi consentiti configurato          |
| `open`                | Ignora gli elenchi dei gruppi consentiti (il filtro basato sulle menzioni continua ad applicarsi) |
| `disabled`            | Blocca tutti i messaggi di gruppi/stanze                          |

<Note>
`channels.defaults.groupPolicy` imposta il valore predefinito quando `groupPolicy` di un provider non è impostato.
I codici di associazione scadono dopo 1 ora. Le richieste di associazione in sospeso sono limitate a **3 per account** (nell'ambito del canale e dell'ID account).
Se manca completamente un blocco del provider (`channels.<provider>` assente), il criterio di runtime per i gruppi ricorre a `allowlist` (chiusura in caso di errore), con un avviso all'avvio.
</Note>

### Sostituzioni del modello per canale

Utilizzare `channels.modelByChannel` per associare specifici ID canale o interlocutori dei messaggi diretti a un modello. I valori accettano `provider/model` o alias di modelli configurati. La mappatura del canale si applica solo quando una sessione non dispone già di una sostituzione attiva del modello (ad esempio, una impostata tramite `/model`).

Per le conversazioni di gruppo/thread, le chiavi sono ID gruppo specifici del canale, ID argomento o nomi di canale. Per le conversazioni con messaggi diretti (DM), le chiavi sono identificatori degli interlocutori derivati dall'identità del mittente del canale (`nativeDirectUserId`, `origin.from`, `origin.to`, `OriginatingTo`, `From` o `SenderId`). La forma esatta della chiave dipende dal canale:

| Canale  | Forma della chiave DM         | Esempio                                      |
| -------- | ------------------- | -------------------------------------------- |
| Discord  | ID utente non elaborato         | `987654321`                                  |
| Feishu   | `feishu:ou_...`     | `feishu:ou_a8b6cab7e945387de5f253775d9b4d85` |
| Matrix   | ID utente Matrix      | `@user:matrix.org`                           |
| Slack    | `user:U...`         | `user:U12345`                                |
| Telegram | ID utente non elaborato         | `123456789`                                  |
| WhatsApp | numero di telefono o JID | `15551234567`                                |

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-5.6-sol",
        "user:U12345": "openai/gpt-5.4-mini",
      },
      telegram: {
        "-1001234567890": "openai/gpt-5.4-mini",
        "-1001234567890:topic:99": "anthropic/claude-sonnet-4-6",
        "123456789": "openai/gpt-4.1",
      },
    },
  },
}
```

Le chiavi specifiche per i messaggi diretti corrispondono solo nelle conversazioni con messaggi diretti; non influiscono sull'instradamento di gruppi/thread.

### Valori predefiniti dei canali e Heartbeat

Utilizzare `channels.defaults` per condividere tra i provider il comportamento del criterio per i gruppi e dell'Heartbeat:

```json5
{
  channels: {
    defaults: {
      groupPolicy: "allowlist", // open | allowlist | disabled
      contextVisibility: "all", // all | allowlist | allowlist_quote
      heartbeat: {
        showOk: false,
        showAlerts: true,
        useIndicator: true,
      },
    },
  },
}
```

- `channels.defaults.groupPolicy`: criterio di riserva per i gruppi quando `groupPolicy` a livello di provider non è impostato.
- `channels.defaults.contextVisibility`: modalità predefinita di visibilità del contesto supplementare per tutti i canali. Valori: `all` (predefinito, include tutto il contesto di citazioni/thread/cronologia), `allowlist` (include solo il contesto dei mittenti consentiti), `allowlist_quote` (come l'elenco degli elementi consentiti, ma mantiene il contesto esplicito di citazione/risposta). Sostituzione per canale: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: include gli stati integri dei canali nell'output dell'Heartbeat (valore predefinito `false`).
- `channels.defaults.heartbeat.showAlerts`: include gli stati degradati/di errore nell'output dell'Heartbeat (valore predefinito `true`).
- `channels.defaults.heartbeat.useIndicator`: visualizza un output compatto dell'Heartbeat in stile indicatore (valore predefinito `true`).

### WhatsApp

WhatsApp funziona tramite il canale web del Gateway (Baileys Web). Si avvia automaticamente quando esiste una sessione collegata.

```json5
{
  web: {
    enabled: true,
    heartbeatSeconds: 60,
    whatsapp: {
      keepAliveIntervalMs: 25000,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
    },
    reconnect: {
      initialMs: 2000,
      maxMs: 30000,
      factor: 1.8,
      jitter: 0.25,
      maxAttempts: 12, // 0 = retry forever
    },
  },
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      streaming: { chunkMode: "length" }, // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // blue ticks (false in self-chat mode)
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

- `web.whatsapp.keepAliveIntervalMs` (valore predefinito `25000`), `connectTimeoutMs` (valore predefinito `60000`) e `defaultQueryTimeoutMs` (valore predefinito `60000`) regolano il socket Baileys.
- Valori predefiniti di `web.reconnect`: `initialMs: 2000`, `maxMs: 30000`, `factor: 1.8`, `jitter: 0.25`, `maxAttempts: 12`. `maxAttempts: 0` esegue nuovi tentativi all'infinito anziché rinunciare.
- Le voci `bindings[]` di primo livello con `type: "acp"` configurano associazioni ACP persistenti per i messaggi diretti e i gruppi di WhatsApp. Utilizzare un numero diretto E.164 o un JID di gruppo WhatsApp in `match.peer.id`. La semantica dei campi è condivisa in [Agenti ACP](/it/tools/acp-agents#persistent-channel-bindings).

<Accordion title="WhatsApp multi-account">

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        default: {},
        personal: {},
        biz: {
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

- I comandi in uscita utilizzano per impostazione predefinita l'account `default`, se presente; altrimenti, il primo ID account configurato (in ordine).
- Il valore facoltativo `channels.whatsapp.defaultAccount` sostituisce la selezione predefinita dell'account di riserva quando corrisponde a un ID account configurato.
- La directory di autenticazione Baileys legacy per account singolo viene migrata da `openclaw doctor` in `whatsapp/default`.
- Sostituzioni per account: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

</Accordion>

### Telegram

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "your-bot-token",
      dmPolicy: "pairing",
      allowFrom: ["tg:123456789"],
      groups: {
        "*": { requireMention: true },
        "-1001234567890": {
          allowFrom: ["@admin"],
          systemPrompt: "Keep answers brief.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "Stay on topic.",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all | batched
      linkPreview: true,
      streaming: { mode: "partial" }, // off | partial | block | progress (default: partial)
      actions: { reactions: true, sendMessage: true },
      reactionNotifications: "own", // off | own | all
      mediaMaxMb: 100,
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
      network: {
        autoSelectFamily: true,
        dnsResultOrder: "ipv4first",
      },
      apiRoot: "https://api.telegram.org",
      trustedLocalFileRoots: ["/srv/telegram-bot-api-data"],
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Token del bot: `channels.telegram.botToken` o `channels.telegram.tokenFile` (solo file normale; i collegamenti simbolici vengono rifiutati), con `TELEGRAM_BOT_TOKEN` come riserva per l'account predefinito.
- `apiRoot` è esclusivamente la radice dell'API Bot di Telegram. Utilizzare `https://api.telegram.org` o la propria radice self-hosted/proxy, non `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` rimuove un suffisso finale `/bot<TOKEN>` aggiunto accidentalmente.
- Per un server API Bot self-hosted in modalità `--local`, `trustedLocalFileRoots` elenca i percorsi dell'host che OpenClaw può leggere. Montare il volume dati del server sull'host OpenClaw e configurarne la radice dei dati o la directory per token; i percorsi del contenitore sotto `/var/lib/telegram-bot-api` vengono mappati in tali radici. Gli altri percorsi assoluti continuano a essere rifiutati.
- Il valore facoltativo `channels.telegram.defaultAccount` sostituisce la selezione predefinita dell'account quando corrisponde a un ID account configurato.
- Nelle configurazioni multi-account (2 o più ID account), impostare un valore predefinito esplicito (`channels.telegram.defaultAccount` o `channels.telegram.accounts.default`) per evitare l'instradamento di riserva; `openclaw doctor` genera un avviso quando manca o non è valido.
- `configWrites: false` blocca le scritture della configurazione avviate da Telegram (migrazioni degli ID dei supergruppi, `/config set|unset`).
- Le voci `bindings[]` di primo livello con `type: "acp"` configurano associazioni ACP persistenti per gli argomenti dei forum (utilizzare il valore canonico `chatId:topic:topicId` in `match.peer.id`). La semantica dei campi è condivisa in [Agenti ACP](/it/tools/acp-agents#persistent-channel-bindings).
- Le anteprime dei flussi di Telegram utilizzano `sendMessage` + `editMessageText` (funziona nelle chat dirette e di gruppo).
- `network.dnsResultOrder` usa come valore predefinito `"ipv4first"` per evitare i comuni errori di recupero IPv6.
- Criterio per i nuovi tentativi: consultare [Criterio per i nuovi tentativi](/it/concepts/retry).

### Discord

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "your-bot-token",
      mediaMaxMb: 100,
      allowBots: false,
      actions: {
        reactions: true,
        stickers: true,
        polls: true,
        permissions: true,
        messages: true,
        threads: true,
        pins: true,
        search: true,
        memberInfo: true,
        roleInfo: true,
        roles: false,
        channelInfo: true,
        voiceStatus: true,
        events: true,
        moderation: false,
      },
      replyToMode: "off", // off | first | all | batched
      dmPolicy: "pairing",
      allowFrom: ["1234567890", "123456789012345678"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["openclaw-dm"] },
      guilds: {
        "123456789012345678": {
          slug: "friends-of-openclaw",
          requireMention: false,
          ignoreOtherMentions: true,
          reactionNotifications: "own",
          users: ["987654321098765432"],
          channels: {
            general: { allow: true },
            help: {
              allow: true,
              requireMention: true,
              users: ["987654321098765432"],
              skills: ["docs"],
              systemPrompt: "Solo risposte brevi.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      suppressEmbeds: true,
      streaming: {
        mode: "progress", // off | partial | block | progress (valore predefinito di Discord: progress)
        chunkMode: "length", // length | newline
        progress: {
          label: "auto",
          maxLines: 8,
          maxLineChars: 120,
          toolProgress: true,
        },
      },
      maxLinesPerMessage: 17,
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSessions: true,
        defaultSpawnContext: "fork",
      },
      voice: {
        enabled: true,
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        connectTimeoutMs: 30000,
        reconnectGraceMs: 15000,
        tts: {
          provider: "openai",
          openai: { voice: "alloy" },
        },
      },
      execApprovals: {
        enabled: "auto", // true | false | "auto"
        approvers: ["987654321098765432"],
        agentFilter: ["default"],
        sessionFilter: ["discord:"],
        target: "dm", // dm | channel | both
        cleanupAfterResolve: false,
      },
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

- Token: `channels.discord.token`, con `DISCORD_BOT_TOKEN` come soluzione di riserva per l'account predefinito.
- Le chiamate dirette in uscita che forniscono un `token` Discord esplicito utilizzano quel token per la chiamata; le impostazioni di tentativi e criteri dell'account continuano a provenire dall'account selezionato nell'istantanea di runtime attiva.
- Il valore facoltativo `channels.discord.defaultAccount` sostituisce la selezione dell'account predefinito quando corrisponde all'ID di un account configurato.
- Utilizzare `user:<id>` (DM) o `channel:<id>` (canale della gilda) come destinazioni di consegna; gli ID numerici senza prefisso vengono rifiutati.
- Gli slug delle gilde sono in minuscolo, con gli spazi sostituiti da `-`; le chiavi dei canali utilizzano il nome convertito in slug (senza `#`). Preferire gli ID delle gilde.
- I messaggi creati dai bot vengono ignorati per impostazione predefinita. `allowBots: true` li abilita; utilizzare `allowBots: "mentions"` per accettare solo i messaggi dei bot che menzionano il bot (i messaggi del bot stesso vengono comunque filtrati).
- I canali che supportano i messaggi in entrata creati dai bot possono utilizzare la [protezione condivisa dai cicli dei bot](/it/channels/bot-loop-protection). Impostare `channels.defaults.botLoopProtection` per i budget di base delle coppie, quindi sostituire l'impostazione per il canale o l'account solo quando una superficie richiede limiti diversi.
- `channels.discord.guilds.<id>.ignoreOtherMentions` (e le sostituzioni a livello di canale) scarta i messaggi che menzionano un altro utente o ruolo ma non il bot (esclusi @everyone/@here).
- `channels.discord.mentionAliases` associa il testo stabile `@handle` in uscita agli ID utente Discord prima dell'invio, consentendo di menzionare in modo deterministico i membri noti del team anche quando la cache temporanea della directory è vuota. Le sostituzioni per account si trovano in `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (valore predefinito `17`) suddivide i messaggi con molte righe anche quando contengono meno di 2000 caratteri.
- `channels.discord.suppressEmbeds` ha come valore predefinito `true`, pertanto gli URL in uscita non vengono espansi nelle anteprime dei link di Discord, a meno che l'opzione non venga disabilitata. I payload `embeds` espliciti vengono comunque inviati normalmente; le chiamate agli strumenti per singolo messaggio possono sostituire il comportamento con `suppressEmbeds`.
- `channels.discord.threadBindings` controlla l'instradamento associato ai thread di Discord:
  - `enabled`: sostituzione Discord per le funzionalità delle sessioni associate ai thread (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` e consegna/instradamento associati)
  - `idleHours`: sostituzione Discord, in ore, per la rimozione automatica del focus dopo un periodo di inattività (`0` la disabilita)
  - `maxAgeHours`: sostituzione Discord, in ore, per la durata massima assoluta (`0` la disabilita)
  - `spawnSessions`: opzione per la creazione e l'associazione automatica dei thread da parte di `sessions_spawn({ thread: true })` e della generazione di thread ACP (valore predefinito: `true`)
  - `defaultSpawnContext`: contesto nativo del sottoagente per le generazioni associate ai thread (`"fork"` per impostazione predefinita)
- Le voci `bindings[]` di primo livello con `type: "acp"` configurano associazioni ACP persistenti per canali e thread (utilizzare l'ID del canale/thread in `match.peer.id`). La semantica dei campi è condivisa in [Agenti ACP](/it/tools/acp-agents#persistent-channel-bindings).
- `channels.discord.ui.components.accentColor` imposta il colore principale per i contenitori dei componenti Discord v2.
- `channels.discord.agentComponents.ttlMs` controlla per quanto tempo i callback dei componenti Discord inviati rimangono registrati. Valore predefinito `1800000` (30 minuti), massimo `86400000` (24 ore). Le sostituzioni per account si trovano in `channels.discord.accounts.<accountId>.agentComponents.ttlMs`. Preferire il TTL più breve compatibile con il flusso di lavoro.
- `channels.discord.voice` abilita le conversazioni nei canali vocali Discord e le sostituzioni facoltative per partecipazione automatica, LLM e TTS. Le configurazioni Discord esclusivamente testuali lasciano la voce disabilitata per impostazione predefinita; impostare `channels.discord.voice.enabled=true` per abilitarla.
- `channels.discord.voice.model` sostituisce facoltativamente il modello LLM utilizzato per le risposte nei canali vocali Discord.
- `channels.discord.voice.daveEncryption` (valore predefinito `true`) e `channels.discord.voice.decryptionFailureTolerance` (valore predefinito `24`) vengono passati alle opzioni DAVE di `@discordjs/voice`.
- `channels.discord.voice.connectTimeoutMs` controlla l'attesa iniziale dello stato Ready di `@discordjs/voice` per `/vc join` e i tentativi di partecipazione automatica (valore predefinito `30000`).
- `channels.discord.voice.reconnectGraceMs` controlla quanto tempo può impiegare una sessione vocale disconnessa per entrare nella segnalazione di riconnessione prima che OpenClaw la elimini (valore predefinito `15000`).
- La riproduzione vocale di Discord non viene interrotta dall'evento di inizio conversazione di un altro utente. Per evitare cicli di feedback, OpenClaw ignora le nuove acquisizioni vocali durante la riproduzione TTS.
- OpenClaw tenta inoltre di ripristinare la ricezione vocale abbandonando e riunendosi a una sessione vocale dopo ripetuti errori di decifratura.
- `channels.discord.streaming` è la chiave canonica della modalità di streaming. Il valore predefinito di Discord è `streaming.mode: "progress"`, così l'avanzamento degli strumenti e del lavoro viene visualizzato in un unico messaggio di anteprima modificato; impostare `streaming.mode: "off"` per disabilitarlo. Le chiavi piatte precedenti (`streamMode`, `chunkMode`, `blockStreaming`, `draftChunk`, `blockStreamingCoalesce`) non vengono più lette durante il runtime; eseguire `openclaw doctor --fix` per migrare la configurazione persistente.
- `channels.discord.autoPresence` associa la disponibilità del runtime alla presenza del bot (integro => online, degradato => inattivo, esaurito => non disturbare) e consente sostituzioni facoltative del testo di stato.
- `channels.discord.guilds.<id>.presenceEvents` instrada gli arrivi di disponibilità delle persone in un canale Discord configurato come eventi di sistema dell'agente. I membri idonei devono poter visualizzare `channelId`; i thread pubblici ereditano la visibilità del canale principale, mentre quelli privati richiedono inoltre l'appartenenza o Manage Threads. `users` può restringere ulteriormente il pubblico. Inizializza i membri attualmente online dalle istantanee complete di `GUILD_CREATE`, instrada le transizioni osservate da offline a online e considera un primo segnale online successivo per un membro mai visto come nuova disponibilità, senza affermare se sia passato online o si sia unito dopo l'istantanea. Per le gilde che superano il limite di 75,000 membri per istantanea di Discord è prima necessario un aggiornamento offline esplicito. Parametri di limitazione: `reconnectSuppressSeconds` (finestra di quiete dopo una nuova sessione Gateway mentre viene ricostruito lo stato di presenza della gilda, valore predefinito 300, `0` la disabilita) e `burstLimit`/`burstWindowSeconds` (limite per gilda alla frequenza degli eventi accodati correttamente, valore predefinito 8 eventi per finestra mobile di 60s). Le sessioni riprese non avviano la finestra di soppressione della riconnessione. Il periodo di attesa esistente per un nuovo saluto allo stesso utente rimane di otto ore. Richiede `channels.discord.intents.presence=true`, il Presence Intent privilegiato nel Developer Portal di Discord e un Heartbeat dell'agente abilitato.
- `channels.discord.dangerouslyAllowNameMatching` riabilita la corrispondenza modificabile di nomi/tag (modalità di compatibilità di emergenza).
- `channels.discord.execApprovals`: consegna nativa di Discord delle approvazioni di esecuzione e autorizzazione degli approvatori.
  - `enabled`: `true`, `false` o `"auto"` (valore predefinito). In modalità automatica, le approvazioni di esecuzione si attivano quando gli approvatori possono essere risolti da `approvers` o `commands.ownerAllowFrom`.
  - `approvers`: ID utente Discord autorizzati ad approvare le richieste di esecuzione. Se omesso, utilizza `commands.ownerAllowFrom` come soluzione di riserva.
  - `agentFilter`: elenco facoltativo degli ID agente consentiti. Omettere per inoltrare le approvazioni per tutti gli agenti.
  - `sessionFilter`: modelli facoltativi delle chiavi di sessione (sottostringa o espressione regolare).
  - `target`: destinazione a cui inviare le richieste di approvazione. `"dm"` (valore predefinito) le invia nei DM degli approvatori, `"channel"` le invia al canale di origine, `"both"` le invia a entrambi. Quando la destinazione include `"channel"`, i pulsanti possono essere utilizzati solo dagli approvatori risolti.
  - `cleanupAfterResolve`: quando è `true`, elimina i DM di approvazione dopo l'approvazione, il rifiuto o la scadenza.

**Modalità di notifica delle reazioni:** `off` (nessuna), `own` (messaggi del bot, valore predefinito), `all` (tutti i messaggi), `allowlist` (da `guilds.<id>.users` su tutti i messaggi).

### Google Chat

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      audienceType: "app-url", // app-url | project-number
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890",
      dm: {
        enabled: true,
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": { allow: true, requireMention: true },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

- JSON dell'account di servizio: incorporato (`serviceAccount`) o basato su file (`serviceAccountFile`).
- È supportato anche il SecretRef dell'account di servizio (`serviceAccountRef`).
- Variabili d'ambiente di riserva: `GOOGLE_CHAT_SERVICE_ACCOUNT` o `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE` (solo account predefinito).
- Utilizzare `spaces/<spaceId>` o `users/<userId>` come destinazioni di consegna.
- `channels.googlechat.dangerouslyAllowNameMatching` riabilita la corrispondenza modificabile dell'identità principale basata sull'indirizzo email (modalità di compatibilità di emergenza).

### Slack

```json5
{
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      appToken: "xapp-...",
      socketMode: {
        clientPingTimeout: 15000,
        serverPingTimeout: 30000,
        pingPongLoggingEnabled: false,
      },
      dmPolicy: "pairing",
      allowFrom: ["U123", "U456", "*"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["G123"] },
      channels: {
        C123: { enabled: true, requireMention: true, allowBots: false },
        "#general": {
          enabled: true,
          requireMention: true,
          allowBots: false,
          users: ["U123"],
          skills: ["docs"],
          systemPrompt: "Solo risposte brevi.",
        },
      },
      historyLimit: 50,
      allowBots: false,
      reactionNotifications: "own",
      reactionAllowlist: ["U123"],
      replyToMode: "off", // disattivata | prima | tutte | in batch
      thread: {
        historyScope: "thread", // thread | canale
        inheritParent: false,
        initialHistoryLimit: 20,
      },
      actions: {
        reactions: true,
        messages: true,
        pins: true,
        memberInfo: true,
        emojiList: true,
      },
      slashCommand: {
        enabled: true,
        name: "openclaw",
        sessionPrefix: "slack:slash",
        ephemeral: true,
      },
      typingReaction: "hourglass_flowing_sand",
      unfurlLinks: false,
      unfurlMedia: false,
      textChunkLimit: 4000,
      streaming: {
        mode: "partial", // disattivata | parziale | blocco | avanzamento
        chunkMode: "length", // lunghezza | nuova riga
        nativeTransport: true, // usa l'API di streaming nativa di Slack quando mode=partial
      },
      mediaMaxMb: 20,
      execApprovals: {
        enabled: "auto", // true | false | "auto"
        approvers: ["U123"],
        agentFilter: ["default"],
        sessionFilter: ["slack:"],
        target: "dm", // dm | canale | entrambi
      },
    },
  },
}
```

- La **modalità Socket** richiede sia `botToken` sia `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` per il fallback alle variabili d'ambiente dell'account predefinito).
- La **modalità HTTP** richiede `botToken` più `signingSecret` (a livello radice o per account).
- `enterpriseOrgInstall: true` abilita per un account il percorso degli eventi a livello di organizzazione di Slack Enterprise Grid. All'avvio, il token del bot viene verificato con `auth.test` e
  l'avvio non riesce quando la modalità configurata non corrisponde all'identità di installazione di Slack.
  I DM Enterprise devono essere disabilitati oppure usare `dmPolicy: "open"` con un
  `allowFrom: ["*"]` effettivo. Le policy per canali e utenti devono usare ID Slack stabili;
  i nomi modificabili e i prefissi di canale non supportati causano il fallimento dell'avvio. La V1 gestisce soltanto
  eventi diretti in modalità Socket o HTTP `message` e `app_mention` con risposte
  immediate; relay, comandi, interazioni, App Home, listener degli eventi di reazione,
  elementi fissati, strumenti di azione, approvazioni native, binding, consegna differita e
  invii proattivi non sono disponibili. La conferma di ricezione, l'indicazione di digitazione e
  le reazioni di stato gestite dal listener restano disponibili con `reactions:write`; le notifiche
  delle reazioni in entrata e gli strumenti di azione per le reazioni non sono disponibili. Consultare
  [Installazioni a livello di organizzazione di Enterprise Grid](/it/channels/slack#enterprise-grid-org-wide-installs)
  per il manifesto con privilegi minimi, il flusso di configurazione e tutte le limitazioni.
- `socketMode` inoltra l'ottimizzazione del trasporto in modalità Socket dell'SDK Slack all'API pubblica del ricevitore Bolt. Usarlo solo quando si analizzano timeout ping/pong o comportamenti di websocket obsoleti. Il valore predefinito di `clientPingTimeout` è `15000`; `serverPingTimeout` e `pingPongLoggingEnabled` vengono inoltrati solo se configurati.
- `botToken`, `appToken`, `signingSecret` e `userToken` accettano stringhe
  di testo normale oppure oggetti SecretRef.
- Le istantanee degli account Slack espongono campi relativi a origine e stato per ciascuna credenziale, come
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` e, in modalità HTTP,
  `signingSecretStatus`. `configured_unavailable` indica che l'account è
  configurato tramite SecretRef, ma il percorso corrente del comando o del runtime non ha potuto
  risolvere il valore del segreto.
- `configWrites: false` blocca le scritture della configurazione avviate da Slack.
- Il valore facoltativo `channels.slack.defaultAccount` sostituisce la selezione dell'account predefinito quando corrisponde all'ID di un account configurato.
- `channels.slack.streaming.mode` è la chiave canonica della modalità di streaming di Slack (valore predefinito `"partial"`). `channels.slack.streaming.nativeTransport` controlla il trasporto di streaming nativo di Slack (valore predefinito `true`). I valori precedenti `streamMode`, il valore booleano `streaming`, `chunkMode`, `blockStreaming`, `blockStreamingCoalesce` e `nativeStreaming` non vengono più letti durante l'esecuzione; eseguire `openclaw doctor --fix` per migrare la configurazione persistente a `streaming.{mode,chunkMode,block.enabled,block.coalesce,nativeTransport}`.
- `unfurlLinks` e `unfurlMedia` inoltrano i valori booleani `chat.postMessage` di Slack per l'espansione di link e contenuti multimediali nelle risposte del bot. Il valore predefinito di `unfurlLinks` è `false`, affinché i link in uscita del bot non vengano espansi in linea se non abilitati; `unfurlMedia` viene omesso se non è configurato. Impostare uno dei due valori in `channels.slack.accounts.<accountId>` per sostituire il valore di primo livello per un singolo account.
- Usare `user:<id>` (DM) o `channel:<id>` per le destinazioni di consegna.

**Modalità di notifica delle reazioni:** `off`, `own` (predefinita), `all`, `allowlist` (da `reactionAllowlist`).

**Isolamento della sessione per thread:** `thread.historyScope` è specifico per thread (impostazione predefinita) oppure condiviso nell'intero canale. `thread.inheritParent` copia la trascrizione del canale padre nei nuovi thread. `thread.initialHistoryLimit` (valore predefinito `20`) limita il numero di messaggi esistenti del thread recuperati all'avvio di una nuova sessione del thread; `0` disabilita il recupero della cronologia dei thread.

- Lo streaming nativo di Slack e lo stato del thread in stile assistente Slack "sta scrivendo..." richiedono come destinazione della risposta un thread. Per impostazione predefinita, i DM di primo livello restano fuori dai thread, quindi possono comunque essere trasmessi tramite le anteprime delle bozze di Slack con pubblicazione e modifica, anziché mostrare l'anteprima nativa di streaming/stato in stile thread.
- `typingReaction` aggiunge una reazione temporanea al messaggio Slack in entrata mentre è in corso una risposta, quindi la rimuove al completamento. Usare uno shortcode emoji di Slack come `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: consegna nativa di Slack al client di approvazione e autorizzazione degli approvatori dell'esecuzione. Stesso schema di Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID utente Slack), `agentFilter`, `sessionFilter` e `target` (`"dm"`, `"channel"` oppure `"both"`). Le approvazioni dei Plugin possono usare questo percorso client nativo per le richieste provenienti da Slack quando gli approvatori del Plugin Slack vengono risolti; la consegna nativa Slack delle approvazioni dei Plugin può inoltre essere abilitata tramite `approvals.plugin` per le sessioni provenienti da Slack o le destinazioni Slack. Le approvazioni dei Plugin usano gli approvatori del Plugin Slack definiti in `allowFrom` e l'instradamento predefinito, non gli approvatori dell'esecuzione.

| Gruppo di azioni | Impostazione predefinita | Note                              |
| ---------------- | ------------------------ | --------------------------------- |
| reactions        | abilitato                | Reagire + elencare le reazioni    |
| messages         | abilitato                | Leggere/inviare/modificare/eliminare |
| pins             | abilitato                | Fissare/rimuovere/elencare        |
| memberInfo       | abilitato                | Informazioni sul membro           |
| emojiList        | abilitato                | Elenco di emoji personalizzate    |

### Mattermost

Mattermost viene installato come Plugin separato, allo stesso modo di Discord, Slack e WhatsApp:

```bash
openclaw plugins install @openclaw/mattermost
```

Consultare [npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost) per i dist-tag correnti prima di fissare una versione.

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
      chatmode: "oncall", // oncall | onmessage | onchar
      oncharPrefixes: [">", "!"],
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
      commands: {
        native: true, // attivazione esplicita
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // URL esplicito facoltativo per distribuzioni con proxy inverso/pubbliche
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      streaming: { chunkMode: "length" },
    },
  },
}
```

Modalità di chat: `oncall` (risponde alla menzione con @, predefinita), `onmessage` (ogni messaggio), `onchar` (messaggi che iniziano con il prefisso di attivazione).

Quando i comandi nativi di Mattermost sono abilitati:

- `commands.callbackPath` deve essere un percorso (ad esempio `/api/channels/mattermost/command`), non un URL completo.
- `commands.callbackUrl` deve risolversi nell'endpoint del Gateway OpenClaw ed essere raggiungibile dal server Mattermost.
- I callback slash nativi vengono autenticati con i token specifici per comando restituiti
  da Mattermost durante la registrazione del comando slash. Se la registrazione non riesce o non viene
  attivato alcun comando, OpenClaw rifiuta i callback con
  `Unauthorized: invalid command token.`
- Per gli host di callback privati, tailnet o interni, Mattermost potrebbe richiedere
  che `ServiceSettings.AllowedUntrustedInternalConnections` includa l'host o il dominio del callback.
  Usare valori di host o dominio, non URL completi.
- `channels.mattermost.configWrites`: consente o nega le scritture della configurazione avviate da Mattermost.
- `channels.mattermost.requireMention`: richiede `@mention` prima di rispondere nei canali.
- `channels.mattermost.groups.<channelId>.requireMention`: sostituzione per canale del requisito di menzione (`"*"` per l'impostazione predefinita).
- Il valore facoltativo `channels.mattermost.defaultAccount` sostituisce la selezione dell'account predefinito quando corrisponde all'ID di un account configurato.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // associazione facoltativa dell'account
      dmPolicy: "pairing",
      allowFrom: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      configWrites: true,
      reactionNotifications: "own", // off | own | all | allowlist
      reactionAllowlist: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      historyLimit: 50,
    },
  },
}
```

**Modalità di notifica delle reazioni:** `off`, `own` (predefinita), `all`, `allowlist` (da `reactionAllowlist`).

- `channels.signal.account`: vincola l'avvio del canale a una specifica identità dell'account Signal.
- `channels.signal.configWrites`: consente o nega le scritture della configurazione avviate da Signal.
- Il valore facoltativo `channels.signal.defaultAccount` sostituisce la selezione dell'account predefinito quando corrisponde all'ID di un account configurato.

### iMessage

OpenClaw avvia `imsg rpc` (JSON-RPC tramite stdio). Non sono richiesti daemon né porte. Questo è il percorso preferito per le nuove configurazioni iMessage di OpenClaw quando l'host può concedere le autorizzazioni per il database di Messaggi e per Automazione.

Il supporto per BlueBubbles è stato rimosso. `channels.bluebubbles` non è una superficie di configurazione del runtime supportata nell'attuale OpenClaw. Migrare le vecchie configurazioni a `channels.imessage`; consultare [Rimozione di BlueBubbles e percorso iMessage tramite imsg](/it/announcements/bluebubbles-imessage) per la versione breve e [Migrazione da BlueBubbles](/it/channels/imessage-from-bluebubbles) per la tabella di conversione completa.

Se il Gateway non è in esecuzione sul Mac con accesso effettuato a Messaggi, mantenere `channels.imessage.enabled=true` e impostare `channels.imessage.cliPath` su un wrapper SSH che esegua `imsg "$@"` su tale Mac. Il percorso locale predefinito `imsg` è disponibile solo su macOS.

Prima di affidarsi a un wrapper SSH per gli invii in produzione, verificare un `imsg send` in uscita tramite quello stesso wrapper. Alcuni stati TCC di macOS assegnano l'autorizzazione di Automazione di Messaggi a `/usr/libexec/sshd-keygen-wrapper`; ciò può consentire il funzionamento delle letture e delle verifiche mentre gli invii non riescono con AppleEvents `-1743`. Consultare la sezione sulla risoluzione dei problemi del wrapper SSH in [iMessage](/it/channels/imessage).

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
      remoteHost: "user@gateway-host",
      dmPolicy: "pairing",
      allowFrom: ["+15555550123", "user@example.com", "chat_id:123"],
      historyLimit: 50,
      includeAttachments: false,
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      mediaMaxMb: 16,
      service: "auto",
      sendTransport: "auto",
      region: "US",
      actions: {
        reactions: true,
        edit: true,
        unsend: true,
        reply: true,
        sendWithEffect: true,
        sendAttachment: true,
      },
    },
  },
}
```

- Il valore facoltativo `channels.imessage.defaultAccount` sostituisce la selezione predefinita dell'account quando corrisponde all'ID di un account configurato.
- Richiede l'accesso completo al disco per il database di Messaggi.
- Preferire le destinazioni `chat_id:<id>`. Usare `imsg chats --limit 20` per elencare le chat.
- `cliPath` può puntare a un wrapper SSH; impostare `remoteHost` (`host` o `user@host`) per recuperare gli allegati tramite SCP.
- `attachmentRoots` e `remoteAttachmentRoots` limitano i percorsi degli allegati in ingresso (valore predefinito: `/Users/*/Library/Messages/Attachments`).
- SCP usa la verifica rigorosa della chiave host, quindi assicurarsi che la chiave dell'host relay esista già in `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: consente o nega le scritture della configurazione avviate da iMessage.
- `channels.imessage.sendTransport`: trasporto di invio RPC `imsg` preferito per le normali risposte in uscita. `auto` (valore predefinito) usa il bridge IMCore per le chat esistenti quando è in esecuzione, quindi ricorre ad AppleScript; `bridge` richiede la consegna tramite API privata; `applescript` forza il percorso pubblico di automazione di Messaggi.
- `channels.imessage.actions.*`: abilita le azioni dell'API privata soggette anche ai controlli di `imsg status` / `openclaw channels status --probe`.
- `channels.imessage.includeAttachments` è disattivato per impostazione predefinita; impostarlo su `true` per ricevere contenuti multimediali in ingresso nei turni dell'agente.
- Il recupero dei messaggi in ingresso dopo il riavvio di un bridge/Gateway è automatico (deduplicazione GUID più un limite di età per l'arretrato obsoleto). Le configurazioni `channels.imessage.catchup.enabled: true` esistenti continuano a essere rispettate come profilo di compatibilità deprecato; `catchup` è disabilitato per impostazione predefinita.
- `channels.imessage.groups`: registro dei gruppi e impostazioni per gruppo. Con `groupPolicy: "allowlist"`, configurare chiavi `chat_id` esplicite oppure una voce jolly `"*"` affinché i messaggi di gruppo possano superare il controllo del registro.
- Le voci `bindings[]` di primo livello con `type: "acp"` possono associare le conversazioni iMessage a sessioni ACP persistenti. Usare un handle normalizzato o una destinazione chat esplicita (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) in `match.peer.id`. Semantica dei campi condivisi: [Agenti ACP](/it/tools/acp-agents#persistent-channel-bindings).

<Accordion title="Esempio di wrapper SSH per iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix è supportato da un Plugin e configurato in `channels.matrix`.

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
      encryption: true,
      initialSyncLimit: 20,
      defaultAccount: "ops",
      accounts: {
        ops: {
          name: "Ops",
          userId: "@ops:example.org",
          accessToken: "syt_ops_xxx",
        },
        alerts: {
          userId: "@alerts:example.org",
          password: "secret",
          proxy: "http://127.0.0.1:7891",
        },
      },
    },
  },
}
```

- L'autenticazione tramite token usa `accessToken`; l'autenticazione tramite password usa `userId` + `password`.
- `channels.matrix.proxy` instrada il traffico HTTP di Matrix attraverso un proxy HTTP(S) esplicito. Gli account denominati possono sostituirlo con `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` consente homeserver privati/interni. `proxy` e questa abilitazione esplicita della rete sono controlli indipendenti.
- `channels.matrix.defaultAccount` seleziona l'account preferito nelle configurazioni con più account.
- `channels.matrix.autoJoin` usa come valore predefinito `"off"`, pertanto le stanze alle quali si è invitati e i nuovi inviti simili a messaggi diretti vengono ignorati finché non si imposta `autoJoin: "allowlist"` con `autoJoinAllowlist` o `autoJoin: "always"`.
- `channels.matrix.execApprovals`: consegna nativa di Matrix delle approvazioni di esecuzione e autorizzazione degli approvatori.
  - `enabled`: `true`, `false` o `"auto"` (valore predefinito). In modalità automatica, le approvazioni di esecuzione si attivano quando è possibile determinare gli approvatori da `approvers` o `commands.ownerAllowFrom`.
  - `approvers`: ID utente Matrix (ad esempio `@owner:example.org`) autorizzati ad approvare le richieste di esecuzione.
  - `agentFilter`: elenco facoltativo degli ID agente consentiti. Ometterlo per inoltrare le approvazioni per tutti gli agenti.
  - `sessionFilter`: modelli facoltativi delle chiavi di sessione (sottostringa o espressione regolare).
  - `target`: destinazione a cui inviare le richieste di approvazione. `"dm"` (valore predefinito), `"channel"` (stanza di origine) o `"both"`.
  - Sostituzioni per account: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` controlla il raggruppamento dei messaggi diretti di Matrix in sessioni: `per-user` (valore predefinito) li condivide in base all'interlocutore instradato, mentre `per-room` isola ogni stanza di messaggi diretti.
- I controlli di stato di Matrix e le ricerche in tempo reale nella directory usano la stessa politica proxy del traffico di runtime.
- La configurazione completa di Matrix, le regole di destinazione e gli esempi di configurazione sono documentati in [Matrix](/it/channels/matrix).

### Microsoft Teams

Microsoft Teams è supportato da un Plugin e configurato in `channels.msteams`.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, criteri per team/canale:
      // consultare /channels/msteams
    },
  },
}
```

- Percorsi delle chiavi principali trattati qui: `channels.msteams`, `channels.msteams.configWrites`.
- La configurazione completa di Teams (credenziali, Webhook, politica per messaggi diretti/gruppi, sostituzioni per team/canale) è documentata in [Microsoft Teams](/it/channels/msteams).

### IRC

IRC è supportato da un Plugin e configurato in `channels.irc`.

```json5
{
  channels: {
    irc: {
      enabled: true,
      dmPolicy: "pairing",
      configWrites: true,
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "${IRC_NICKSERV_PASSWORD}",
        register: false,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

- Percorsi delle chiavi principali trattati qui: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- Il valore facoltativo `channels.irc.defaultAccount` sostituisce la selezione predefinita dell'account quando corrisponde all'ID di un account configurato.
- La configurazione completa del canale IRC (host/porta/TLS/canali/elenchi di elementi consentiti/controllo delle menzioni) è documentata in [IRC](/it/channels/irc).

### Più account (tutti i canali)

È possibile eseguire più account per canale (ciascuno con il proprio `accountId`):

```json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Bot principale",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "Bot degli avvisi",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```

- `default` viene usato quando `accountId` è omesso (CLI + instradamento).
- I token di ambiente si applicano solo all'account **predefinito**.
- Le impostazioni di base del canale si applicano a tutti gli account, salvo sostituzioni specifiche per account.
- Usare `bindings[].match.accountId` per instradare ciascun account verso un agente diverso.
- Se si aggiunge un account non predefinito tramite `openclaw channels add` (o durante l'onboarding del canale) mentre si usa ancora una configurazione del canale di primo livello con un singolo account, OpenClaw sposta prima i valori di primo livello relativi all'account singolo nella mappa degli account del canale, affinché l'account originale continui a funzionare. La maggior parte dei canali li sposta in `channels.<channel>.accounts.default`; Matrix può invece conservare una destinazione denominata/predefinita esistente corrispondente.
- Le associazioni esistenti relative al solo canale (senza `accountId`) continuano a corrispondere all'account predefinito; le associazioni specifiche per account restano facoltative.
- `openclaw doctor --fix` corregge anche le strutture miste spostando i valori di primo livello relativi all'account singolo nell'account promosso scelto per quel canale. La maggior parte dei canali usa `accounts.default`; Matrix può invece conservare una destinazione denominata/predefinita esistente corrispondente.

### Altri canali Plugin

Molti canali Plugin sono configurati come `channels.<id>` e documentati nelle rispettive pagine dedicate (ad esempio Feishu, LINE, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Twitch e Zalo).
Consultare l'indice completo dei canali: [Canali](/it/channels).

### Controllo delle menzioni nelle chat di gruppo

Per impostazione predefinita, i messaggi di gruppo **richiedono una menzione** (menzione nei metadati o modelli di espressioni regolari sicuri). Si applica alle chat di gruppo di WhatsApp, Telegram, Discord, Google Chat e iMessage.

Le risposte visibili sono controllate separatamente. Per impostazione predefinita, le normali richieste dirette di gruppo, di canale e del WebChat interno prevedono la consegna finale automatica: il testo finale dell'assistente viene pubblicato tramite il percorso legacy delle risposte visibili. Abilitare `messages.visibleReplies: "message_tool"` o `messages.groupChat.visibleReplies: "message_tool"` quando l'output visibile deve essere pubblicato solo dopo che l'agente ha chiamato `message(action=send)`. Se il modello restituisce una risposta finale sostanziale senza chiamare lo strumento di messaggistica in una modalità abilitata per il solo strumento, tale testo finale rimane privato, il log dettagliato del Gateway registra i metadati del payload soppresso e OpenClaw accoda un singolo nuovo tentativo di recupero chiedendo al modello di consegnare la stessa risposta tramite `message(action=send)`.

Le risposte visibili tramite il solo strumento richiedono un modello/runtime che chiami gli strumenti in modo affidabile e sono consigliate per le stanze ambientali condivise con modelli di ultima generazione come GPT-5.6 Sol. Alcuni modelli meno capaci possono restituire il testo finale, ma non comprendere che l'output visibile nell'origine deve essere inviato con `message(action=send)`. Per impostazione predefinita, OpenClaw recupera il caso comune di una risposta finale non consegnata solo quando il contenuto finale è sostanziale, il turno di origine non era un evento della stanza, la politica di invio non ha negato la consegna e non è già stata inviata alcuna risposta all'origine. Il recupero è limitato a un solo nuovo tentativo; disabilita la persistenza per il prompt sintetico del nuovo tentativo e lo esclude dal raggruppamento della raccolta, impedendone l'unione con prompt accodati non correlati. Se anche il nuovo tentativo resta non consegnato o non può essere accodato, OpenClaw consegna soltanto un messaggio diagnostico sanificato, ad esempio "Ho generato una risposta, ma non è stato possibile consegnarla a questa chat. Riprovare." Il testo finale privato originale non viene mai contrassegnato per la consegna automatica all'origine. Per i modelli che lasciano ripetutamente risposte non consegnate, usare `"automatic"` affinché il turno finale dell'assistente costituisca il percorso della risposta visibile, passare a un modello più capace nelle chiamate agli strumenti, esaminare il log dettagliato del Gateway per il riepilogo del payload soppresso oppure impostare `messages.groupChat.visibleReplies: "automatic"` per usare risposte finali visibili per ogni richiesta di gruppo/canale.

Se lo strumento di messaggistica non è disponibile secondo la politica degli strumenti attiva, OpenClaw ricorre alle risposte visibili automatiche anziché sopprimere silenziosamente la risposta. `openclaw doctor` segnala questa mancata corrispondenza.

Questa regola si applica al normale testo finale dell'agente. Le associazioni delle conversazioni gestite da un Plugin usano la risposta restituita dal Plugin proprietario come risposta visibile per i turni rivendicati del thread associato; il Plugin non deve chiamare `message(action=send)` per tali risposte delle associazioni.

**Risoluzione dei problemi: la @menzione di gruppo attiva l'indicatore di digitazione, poi non accade nulla (nessun errore)**

Sintomo: una @menzione in un gruppo/canale mostra l'indicatore di digitazione e il log del Gateway riporta `dispatch complete (queuedFinal=false, replies=0)`, ma nella stanza non viene recapitato alcun messaggio. I messaggi diretti allo stesso agente ricevono normalmente una risposta.

Causa: la modalità di risposta visibile per gruppi/canali viene risolta in `"message_tool"`, quindi OpenClaw esegue il turno ma sopprime il testo finale dell'assistente, a meno che l'agente non chiami `message(action=send)`. In questa modalità non esiste alcun contratto `NO_REPLY`; se non viene chiamato lo strumento per i messaggi, il testo finale originale rimane privato. Per i turni sorgente sostanziali, OpenClaw ora tenta un singolo nuovo tentativo di recupero protetto; le note brevi, il silenzio esplicito, gli eventi della stanza, i turni rifiutati dalla politica di invio e quelli già recapitati non vengono ritentati. Per impostazione predefinita, i normali turni di gruppo e canale usano `"automatic"`, quindi questo sintomo si presenta solo quando `messages.groupChat.visibleReplies` (o l'impostazione globale `messages.visibleReplies`) è impostato esplicitamente su `"message_tool"`. L'impostazione dell'harness `defaultVisibleReplies` non si applica in questo caso: il resolver per gruppi/canali la ignora; influisce solo sulle chat dirette/sorgente (l'harness Codex sopprime in questo modo i messaggi finali delle chat dirette).

Soluzione: scegliere un modello con maggiore capacità di chiamare strumenti, rimuovere l'override esplicito `"message_tool"` per ripristinare il valore predefinito `"automatic"`, oppure impostare `messages.groupChat.visibleReplies: "automatic"` per forzare risposte visibili per ogni richiesta di gruppo/canale. Un messaggio finale sostanziale rimasto bloccato non dovrebbe più concludersi con un successo silenzioso; dovrebbe recuperare tramite un singolo nuovo tentativo `message(action=send)` oppure mostrare la diagnostica sanitizzata dell'errore di recapito. Il Gateway ricarica automaticamente la configurazione `messages` dopo il salvataggio del file; riavviare il Gateway solo quando il monitoraggio dei file o il ricaricamento della configurazione è disabilitato nella distribuzione.

**Tipi di menzione:**

- **Menzioni nei metadati**: @-menzioni native della piattaforma. Ignorate nella modalità di chat con sé stessi di WhatsApp.
- **Pattern testuali**: pattern regex sicuri in `agents.list[].groupChat.mentionPatterns`. I pattern non validi e le ripetizioni annidate non sicure vengono ignorati.
- Il filtro delle menzioni viene applicato solo quando il rilevamento è possibile (menzioni native o almeno un pattern).

```json5
{
  messages: {
    visibleReplies: "automatic", // forza le precedenti risposte finali automatiche per le chat dirette/sorgente
    groupChat: {
      historyLimit: 50,
      unmentionedInbound: "room_event", // le conversazioni della stanza sempre attive e senza menzioni diventano contesto silenzioso
      visibleReplies: "message_tool", // adesione esplicita; richiede message(action=send) per risposte visibili nella stanza
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` imposta il valore predefinito globale. I canali possono eseguire l'override con `channels.<channel>.historyLimit` (anche per singolo account). Impostare `0` per disabilitare.

`messages.groupChat.unmentionedInbound: "room_event"` invia i messaggi di gruppo/canale sempre attivi e senza menzioni come contesto silenzioso della stanza sui canali supportati. I messaggi con menzioni, i comandi e i messaggi diretti restano richieste dell'utente. Consultare [Eventi ambientali della stanza](/it/channels/ambient-room-events) per esempi completi relativi a Discord, Slack e Telegram.

`messages.visibleReplies` è il valore predefinito globale per gli eventi sorgente; `messages.groupChat.visibleReplies` ne esegue l'override per gli eventi sorgente di gruppo/canale. Quando `messages.visibleReplies` non è impostato, le chat dirette/sorgente usano il valore predefinito del runtime o dell'harness selezionato, ma i turni diretti interni di WebChat usano il recapito finale automatico per garantire la parità dei prompt di Pi/Codex. Impostare `messages.visibleReplies: "message_tool"` per richiedere intenzionalmente `message(action=send)` per un output visibile. Le liste di elementi consentiti dei canali e il filtro delle menzioni continuano a determinare se un evento viene elaborato.

#### Limiti della cronologia dei messaggi diretti

```json5
{
  channels: {
    telegram: {
      dmHistoryLimit: 30,
      dms: {
        "123456789": { historyLimit: 50 },
      },
    },
  },
}
```

Risoluzione: override per messaggio diretto → valore predefinito del provider → nessun limite (tutti conservati).

Questo resolver legge `channels.<provider>.dmHistoryLimit` e `channels.<provider>.dms.<id>.historyLimit` per qualsiasi canale la cui chiave di sessione segua il formato standard `provider:direct:<id>` (o quello precedente `provider:dm:<id>`), quindi funziona sia con i canali inclusi sia con i canali Plugin, non soltanto con un elenco fisso.

#### Modalità di chat con sé stessi

Includere il proprio numero in `allowFrom` per abilitare la modalità di chat con sé stessi (ignora le @-menzioni native e risponde solo ai pattern testuali):

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: { mentionPatterns: ["reisponde", "@openclaw"] },
      },
    ],
  },
}
```

### Comandi (gestione dei comandi di chat)

```json5
{
  commands: {
    native: "auto", // registra i comandi nativi quando supportati
    nativeSkills: "auto", // registra i comandi Skills nativi quando supportati
    text: true, // analizza i /comandi nei messaggi di chat
    bash: false, // consente ! (alias: /bash)
    bashForegroundMs: 2000,
    config: false, // consente /config
    mcp: false, // consente /mcp
    plugins: false, // consente /plugins
    debug: false, // consente /debug
    restart: true, // consente /restart e le richieste esterne di riavvio SIGUSR1
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw", // raw | hash
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<Accordion title="Dettagli dei comandi">

- Questo blocco configura le superfici dei comandi. Per il catalogo corrente dei comandi integrati e inclusi, consultare [Comandi slash](/it/tools/slash-commands).
- Questa pagina è un **riferimento per le chiavi di configurazione**, non il catalogo completo dei comandi. I comandi gestiti da canali/Plugin, come QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, associazione dispositivi `/pair`, memoria `/dreaming`, controllo telefonico `/phone` e Talk `/voice`, sono documentati nelle rispettive pagine dei canali/Plugin e in [Comandi slash](/it/tools/slash-commands).
- I comandi testuali devono essere messaggi **autonomi** preceduti da `/`.
- `native: "auto"` abilita i comandi nativi per Discord/Telegram e li lascia disabilitati per Slack.
- `nativeSkills: "auto"` abilita i comandi Skills nativi per Discord/Telegram e li lascia disabilitati per Slack.
- Override per canale: `channels.discord.commands.native` (booleano o `"auto"`). Per Discord, `false` evita la registrazione e la pulizia dei comandi nativi durante l'avvio.
- È possibile eseguire l'override della registrazione delle Skills native per canale con `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` aggiunge ulteriori voci al menu del bot Telegram.
- `bash: true` abilita `! <cmd>` per la shell dell'host. Richiede `tools.elevated.enabled` e che il mittente sia presente in `tools.elevated.allowFrom.<channel>`.
- `config: true` abilita `/config` (legge/scrive `openclaw.json`). Per i client `chat.send` del Gateway, le scritture persistenti `/config set|unset` richiedono anche `operator.admin`; il comando di sola lettura `/config show` resta disponibile ai normali client operatore con ambito di scrittura.
- `mcp: true` abilita `/mcp` per la configurazione dei server MCP gestiti da OpenClaw in `mcp.servers`.
- `plugins: true` abilita `/plugins` per l'individuazione, l'installazione e i controlli di abilitazione/disabilitazione dei Plugin.
- `channels.<provider>.configWrites` controlla le modifiche alla configurazione per canale (valore predefinito: true).
- Per i canali con più account, `channels.<provider>.accounts.<id>.configWrites` controlla anche le scritture destinate a tale account (ad esempio `/allowlist --config --account <id>` o `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` disabilita `/restart` e le richieste esterne di riavvio `SIGUSR1`. Valore predefinito: `true`.
- `ownerAllowFrom` è la lista esplicita degli elementi consentiti per i comandi riservati al proprietario e le azioni dei canali soggette all'autorizzazione del proprietario. È distinta da `allowFrom`.
- `ownerDisplay: "hash"` applica un hash agli ID dei proprietari nel prompt di sistema. Impostare `ownerDisplaySecret` per controllare l'hashing.
- `allowFrom` è specifico per provider. Quando è impostato, costituisce l'**unica** fonte di autorizzazione (le liste di elementi consentiti/l'associazione dei canali e `useAccessGroups` vengono ignorati).
- `useAccessGroups: false` consente ai comandi di ignorare le politiche dei gruppi di accesso quando `allowFrom` non è impostato.
- Mappa della documentazione dei comandi:
  - catalogo integrato e incluso: [Comandi slash](/it/tools/slash-commands)
  - superfici dei comandi specifiche dei canali: [Canali](/it/channels)
  - comandi QQ Bot: [QQ Bot](/it/channels/qqbot)
  - comandi di associazione: [Associazione](/it/channels/pairing)
  - comando per le schede LINE: [LINE](/it/channels/line)
  - Dreaming della memoria: [Dreaming](/it/concepts/dreaming)

</Accordion>

---

## Contenuti correlati

- [Riferimento della configurazione](/it/gateway/configuration-reference) — chiavi di primo livello
- [Configurazione — agenti](/it/gateway/config-agents)
- [Panoramica dei canali](/it/channels)
