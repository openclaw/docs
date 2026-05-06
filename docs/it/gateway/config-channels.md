---
read_when:
    - Configurazione di un Plugin di canale (autenticazione, controllo degli accessi, multi-account)
    - Risoluzione dei problemi relativi alle chiavi di configurazione per canale
    - Verifica dei criteri per i DM, dei criteri di gruppo o del controllo delle menzioni
summary: 'Configurazione dei canali: controllo degli accessi, associazione, chiavi per canale su Slack, Discord, Telegram, WhatsApp, Matrix, iMessage e altro ancora'
title: Configurazione — canali
x-i18n:
    generated_at: "2026-05-06T17:55:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9be70fd706bcf5acfd06b99632c97f4affb854c6aed02558f70c0403247c448
    source_path: gateway/config-channels.md
    workflow: 16
---

Configurazione per canale delle chiavi sotto `channels.*`. Copre l'accesso a DM e gruppi,
configurazioni multi-account, filtro delle menzioni e chiavi per canale per Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage e gli altri plugin di canale inclusi.

Per agenti, strumenti, runtime del gateway e altre chiavi di primo livello, consulta
[Riferimento di configurazione](/it/gateway/configuration-reference).

## Canali

Ogni canale si avvia automaticamente quando esiste la relativa sezione di configurazione (a meno che `enabled: false`).

### Accesso a DM e gruppi

Tutti i canali supportano criteri per DM e criteri per gruppi:

| Criterio DM         | Comportamento                                                 |
| ------------------- | ------------------------------------------------------------- |
| `pairing` (default) | I mittenti sconosciuti ricevono un codice di abbinamento monouso; il proprietario deve approvare |
| `allowlist`         | Solo i mittenti in `allowFrom` (o nello store allow degli abbinati) |
| `open`              | Consente tutti i DM in ingresso (richiede `allowFrom: ["*"]`) |
| `disabled`          | Ignora tutti i DM in ingresso                                |

| Criterio gruppo       | Comportamento                                           |
| --------------------- | ------------------------------------------------------- |
| `allowlist` (default) | Solo gruppi che corrispondono all'allowlist configurata |
| `open`                | Ignora le allowlist dei gruppi (il filtro delle menzioni resta applicato) |
| `disabled`            | Blocca tutti i messaggi di gruppo/stanza                |

<Note>
`channels.defaults.groupPolicy` imposta il valore predefinito quando `groupPolicy` di un provider non è impostato.
I codici di abbinamento scadono dopo 1 ora. Le richieste di abbinamento DM in sospeso sono limitate a **3 per canale**.
Se manca del tutto un blocco provider (`channels.<provider>` assente), il criterio gruppo del runtime ripiega su `allowlist` (fail-closed) con un avviso all'avvio.
</Note>

### Override del modello del canale

Usa `channels.modelByChannel` per fissare ID canale specifici a un modello. I valori accettano `provider/model` o alias di modello configurati. La mappatura del canale si applica quando una sessione non ha già un override del modello (per esempio, impostato tramite `/model`).

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-4.1",
      },
      telegram: {
        "-1001234567890": "openai/gpt-4.1-mini",
        "-1001234567890:topic:99": "anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

### Impostazioni predefinite del canale e Heartbeat

Usa `channels.defaults` per comportamento condiviso di criterio gruppo e Heartbeat tra provider:

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

- `channels.defaults.groupPolicy`: criterio gruppo di fallback quando un `groupPolicy` a livello di provider non è impostato.
- `channels.defaults.contextVisibility`: modalità predefinita di visibilità del contesto supplementare per tutti i canali. Valori: `all` (predefinito, include tutto il contesto citato/thread/cronologia), `allowlist` (include solo il contesto da mittenti in allowlist), `allowlist_quote` (come allowlist ma mantiene il contesto esplicito di citazione/risposta). Override per canale: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: include gli stati dei canali sani nell'output Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: include gli stati degradati/di errore nell'output Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: rende l'output Heartbeat compatto in stile indicatore.

### WhatsApp

WhatsApp viene eseguito tramite il canale web del gateway (Baileys Web). Si avvia automaticamente quando esiste una sessione collegata.

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
      maxMs: 120000,
      factor: 1.4,
      jitter: 0.2,
      maxAttempts: 0,
    },
  },
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
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

<Accordion title="Multi-account WhatsApp">

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

- I comandi in uscita usano per impostazione predefinita l'account `default`, se presente; altrimenti il primo ID account configurato (ordinato).
- L'opzione `channels.whatsapp.defaultAccount` sovrascrive la selezione dell'account predefinito di fallback quando corrisponde a un ID account configurato.
- La directory di autenticazione Baileys legacy a singolo account viene migrata da `openclaw doctor` in `whatsapp/default`.
- Override per account: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

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
      streaming: "partial", // off | partial | block | progress (default: off; opt in explicitly to avoid preview-edit rate limits)
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
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Token bot: `channels.telegram.botToken` o `channels.telegram.tokenFile` (solo file regolare; symlink rifiutati), con `TELEGRAM_BOT_TOKEN` come fallback per l'account predefinito.
- `apiRoot` è solo la radice della Telegram Bot API. Usa `https://api.telegram.org` o la tua radice self-hosted/proxy, non `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` rimuove un suffisso finale accidentale `/bot<TOKEN>`.
- L'opzione `channels.telegram.defaultAccount` sovrascrive la selezione dell'account predefinito quando corrisponde a un ID account configurato.
- Nelle configurazioni multi-account (2+ ID account), imposta un predefinito esplicito (`channels.telegram.defaultAccount` o `channels.telegram.accounts.default`) per evitare il routing di fallback; `openclaw doctor` avvisa quando manca o non è valido.
- `configWrites: false` blocca le scritture di configurazione avviate da Telegram (migrazioni degli ID supergruppo, `/config set|unset`).
- Le voci `bindings[]` di primo livello con `type: "acp"` configurano binding ACP persistenti per gli argomenti del forum (usa il formato canonico `chatId:topic:topicId` in `match.peer.id`). La semantica dei campi è condivisa in [Agenti ACP](/it/tools/acp-agents#persistent-channel-bindings).
- Le anteprime di streaming di Telegram usano `sendMessage` + `editMessageText` (funziona nelle chat dirette e di gruppo).
- Criterio di retry: consulta [Criterio di retry](/it/concepts/retry).

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
              systemPrompt: "Short answers only.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      chunkMode: "length", // length | newline
      streaming: "off", // off | partial | block | progress
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

- Token: `channels.discord.token`, con `DISCORD_BOT_TOKEN` come ripiego per l'account predefinito.
- Le chiamate in uscita dirette che forniscono un `token` Discord esplicito usano quel token per la chiamata; le impostazioni di riprova/criteri dell'account provengono comunque dall'account selezionato nello snapshot di runtime attivo.
- `channels.discord.defaultAccount` facoltativo sovrascrive la selezione dell'account predefinito quando corrisponde a un ID account configurato.
- Usa `user:<id>` (DM) o `channel:<id>` (canale della guild) per le destinazioni di consegna; gli ID numerici semplici vengono rifiutati.
- Gli slug delle guild sono in minuscolo con gli spazi sostituiti da `-`; le chiavi dei canali usano il nome convertito in slug (senza `#`). Preferisci gli ID delle guild.
- I messaggi creati dai bot sono ignorati per impostazione predefinita. `allowBots: true` li abilita; usa `allowBots: "mentions"` per accettare solo i messaggi dei bot che menzionano il bot (i propri messaggi vengono comunque filtrati).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (e le sovrascritture dei canali) scarta i messaggi che menzionano un altro utente o ruolo ma non il bot (esclusi @everyone/@here).
- `channels.discord.mentionAliases` mappa il testo `@handle` stabile in uscita agli ID utente Discord prima dell'invio, così i compagni di squadra noti possono essere menzionati in modo deterministico anche quando la cache temporanea della directory è vuota. Le sovrascritture per account si trovano sotto `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (predefinito 17) divide i messaggi lunghi in altezza anche quando sono sotto i 2000 caratteri.
- `channels.discord.threadBindings` controlla l'instradamento Discord vincolato ai thread:
  - `enabled`: sovrascrittura Discord per le funzionalità di sessione vincolate ai thread (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` e consegna/instradamento vincolati)
  - `idleHours`: sovrascrittura Discord per l'annullamento automatico del focus per inattivita in ore (`0` disabilita)
  - `maxAgeHours`: sovrascrittura Discord per l'eta massima rigida in ore (`0` disabilita)
  - `spawnSessions`: interruttore per `sessions_spawn({ thread: true })` e creazione/associazione automatica dei thread da generazione thread ACP (predefinito: `true`)
  - `defaultSpawnContext`: contesto subagente nativo per generazioni vincolate ai thread (`"fork"` per impostazione predefinita)
- Le voci `bindings[]` di primo livello con `type: "acp"` configurano associazioni ACP persistenti per canali e thread (usa l'ID del canale/thread in `match.peer.id`). La semantica dei campi e condivisa in [Agenti ACP](/it/tools/acp-agents#persistent-channel-bindings).
- `channels.discord.ui.components.accentColor` imposta il colore di accento per i contenitori Discord components v2.
- `channels.discord.voice` abilita le conversazioni nei canali vocali Discord e le sovrascritture facoltative di ingresso automatico + LLM + TTS. Le configurazioni Discord solo testuali lasciano la voce disattivata per impostazione predefinita; imposta `channels.discord.voice.enabled=true` per aderire.
- `channels.discord.voice.model` sovrascrive facoltativamente il modello LLM usato per le risposte nei canali vocali Discord.
- `channels.discord.voice.daveEncryption` e `channels.discord.voice.decryptionFailureTolerance` vengono passati alle opzioni DAVE di `@discordjs/voice` (`true` e `24` per impostazione predefinita).
- `channels.discord.voice.connectTimeoutMs` controlla l'attesa iniziale di Ready di `@discordjs/voice` per `/vc join` e i tentativi di ingresso automatico (`30000` per impostazione predefinita).
- `channels.discord.voice.reconnectGraceMs` controlla quanto tempo puo impiegare una sessione vocale disconnessa per entrare nella segnalazione di riconnessione prima che OpenClaw la distrugga (`15000` per impostazione predefinita).
- OpenClaw tenta inoltre il ripristino della ricezione vocale uscendo da una sessione vocale e rientrandovi dopo ripetuti errori di decrittazione.
- `channels.discord.streaming` e la chiave canonica della modalita di flusso. I valori legacy `streamMode` e booleani `streaming` restano alias di runtime; esegui `openclaw doctor --fix` per riscrivere la configurazione persistita.
- `channels.discord.autoPresence` mappa la disponibilita di runtime alla presenza del bot (sano => online, degradato => inattivo, esaurito => dnd) e consente sovrascritture facoltative del testo di stato.
- `channels.discord.dangerouslyAllowNameMatching` riabilita la corrispondenza mutabile di nome/tag (modalita di compatibilita di emergenza).
- `channels.discord.execApprovals`: consegna delle approvazioni exec nativa di Discord e autorizzazione degli approvatori.
  - `enabled`: `true`, `false` o `"auto"` (predefinito). In modalita automatica, le approvazioni exec si attivano quando gli approvatori possono essere risolti da `approvers` o `commands.ownerAllowFrom`.
  - `approvers`: ID utente Discord autorizzati ad approvare le richieste exec. Ripiega su `commands.ownerAllowFrom` quando omesso.
  - `agentFilter`: allowlist facoltativa di ID agente. Ometti per inoltrare le approvazioni per tutti gli agenti.
  - `sessionFilter`: pattern facoltativi di chiavi sessione (sottostringa o regex).
  - `target`: dove inviare le richieste di approvazione. `"dm"` (predefinito) invia ai DM degli approvatori, `"channel"` invia al canale di origine, `"both"` invia a entrambi. Quando la destinazione include `"channel"`, i pulsanti sono utilizzabili solo dagli approvatori risolti.
  - `cleanupAfterResolve`: quando `true`, elimina i DM di approvazione dopo approvazione, rifiuto o timeout.

**Modalita di notifica delle reazioni:** `off` (nessuna), `own` (messaggi del bot, predefinito), `all` (tutti i messaggi), `allowlist` (da `guilds.<id>.users` su tutti i messaggi).

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

- JSON dell'account di servizio: inline (`serviceAccount`) o basato su file (`serviceAccountFile`).
- E supportato anche SecretRef per l'account di servizio (`serviceAccountRef`).
- Ripieghi env: `GOOGLE_CHAT_SERVICE_ACCOUNT` o `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Usa `spaces/<spaceId>` o `users/<userId>` per le destinazioni di consegna.
- `channels.googlechat.dangerouslyAllowNameMatching` riabilita la corrispondenza mutabile dei principal email (modalita di compatibilita di emergenza).

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
        C123: { allow: true, requireMention: true, allowBots: false },
        "#general": {
          allow: true,
          requireMention: true,
          allowBots: false,
          users: ["U123"],
          skills: ["docs"],
          systemPrompt: "Short answers only.",
        },
      },
      historyLimit: 50,
      allowBots: false,
      reactionNotifications: "own",
      reactionAllowlist: ["U123"],
      replyToMode: "off", // off | first | all | batched
      thread: {
        historyScope: "thread", // thread | channel
        inheritParent: false,
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
      textChunkLimit: 4000,
      chunkMode: "length",
      streaming: {
        mode: "partial", // off | partial | block | progress
        nativeTransport: true, // use Slack native streaming API when mode=partial
      },
      mediaMaxMb: 20,
      execApprovals: {
        enabled: "auto", // true | false | "auto"
        approvers: ["U123"],
        agentFilter: ["default"],
        sessionFilter: ["slack:"],
        target: "dm", // dm | channel | both
      },
    },
  },
}
```

- **Socket mode** richiede sia `botToken` sia `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` per il ripiego env dell'account predefinito).
- **Modalita HTTP** richiede `botToken` piu `signingSecret` (alla radice o per account).
- `socketMode` passa la regolazione del trasporto Socket Mode dell'SDK Slack all'API pubblica del ricevitore Bolt. Usalo solo quando indaghi timeout ping/pong o comportamento websocket obsoleto.
- `botToken`, `appToken`, `signingSecret` e `userToken` accettano stringhe in chiaro
  o oggetti SecretRef.
- Gli snapshot degli account Slack espongono campi source/status per credenziale, come
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` e, in modalita HTTP,
  `signingSecretStatus`. `configured_unavailable` significa che l'account e
  configurato tramite SecretRef, ma il percorso comando/runtime corrente non ha potuto
  risolvere il valore del segreto.
- `configWrites: false` blocca le scritture di configurazione avviate da Slack.
- `channels.slack.defaultAccount` facoltativo sovrascrive la selezione dell'account predefinito quando corrisponde a un ID account configurato.
- `channels.slack.streaming.mode` e la chiave canonica della modalita di flusso Slack. `channels.slack.streaming.nativeTransport` controlla il trasporto di streaming nativo di Slack. I valori legacy `streamMode`, booleani `streaming` e `nativeStreaming` restano alias di runtime; esegui `openclaw doctor --fix` per riscrivere la configurazione persistita.
- Usa `user:<id>` (DM) o `channel:<id>` per le destinazioni di consegna.

**Modalita di notifica delle reazioni:** `off`, `own` (predefinito), `all`, `allowlist` (da `reactionAllowlist`).

**Isolamento delle sessioni thread:** `thread.historyScope` e per thread (predefinito) o condiviso in tutto il canale. `thread.inheritParent` copia la trascrizione del canale padre nei nuovi thread.

- Lo streaming nativo Slack insieme allo stato thread in stile assistente Slack "is typing..." richiede una destinazione thread di risposta. I DM di primo livello restano fuori thread per impostazione predefinita, quindi possono comunque trasmettere in streaming tramite anteprime di bozze Slack pubblicate e modificate invece di mostrare l'anteprima nativa di stream/stato in stile thread.
- `typingReaction` aggiunge una reazione temporanea al messaggio Slack in ingresso mentre e in esecuzione una risposta, poi la rimuove al completamento. Usa uno shortcode emoji Slack come `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: consegna delle approvazioni exec nativa di Slack e autorizzazione degli approvatori. Stesso schema di Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID utente Slack), `agentFilter`, `sessionFilter` e `target` (`"dm"`, `"channel"` o `"both"`).

| Gruppo di azioni | Predefinito | Note                   |
| ------------ | ------- | ---------------------- |
| reactions    | abilitato | Reagisci + elenca reazioni |
| messages     | abilitato | Leggi/invia/modifica/elimina  |
| pins         | abilitato | Fissa/rimuovi/elenca         |
| memberInfo   | abilitato | Informazioni membro            |
| emojiList    | abilitato | Elenco emoji personalizzate      |

### Mattermost

Mattermost viene distribuito come Plugin incluso nelle versioni correnti di OpenClaw. Le build piu vecchie o
personalizzate possono installare un pacchetto npm corrente con
`openclaw plugins install @openclaw/mattermost`. Controlla
[npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost)
per i dist-tag correnti prima di fissare una versione.

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
        native: true, // opt-in
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Optional explicit URL for reverse-proxy/public deployments
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

Modalita chat: `oncall` (risponde alla @-menzione, predefinito), `onmessage` (ogni messaggio), `onchar` (messaggi che iniziano con il prefisso trigger).

Quando i comandi nativi Mattermost sono abilitati:

- `commands.callbackPath` deve essere un percorso (ad esempio `/api/channels/mattermost/command`), non un URL completo.
- `commands.callbackUrl` deve risolvere all'endpoint Gateway di OpenClaw ed essere raggiungibile dal server Mattermost.
- I callback slash nativi sono autenticati con i token per comando restituiti
  da Mattermost durante la registrazione dei comandi slash. Se la registrazione non riesce o nessun
  comando viene attivato, OpenClaw rifiuta i callback con
  `Unauthorized: invalid command token.`
- Per host di callback privati/tailnet/interni, Mattermost potrebbe richiedere
  che `ServiceSettings.AllowedUntrustedInternalConnections` includa l'host/dominio del callback.
  Usa valori host/dominio, non URL completi.
- `channels.mattermost.configWrites`: consente o nega le scritture di configurazione avviate da Mattermost.
- `channels.mattermost.requireMention`: richiede `@mention` prima di rispondere nei canali.
- `channels.mattermost.groups.<channelId>.requireMention`: override per canale del gating basato su menzione (`"*"` per il valore predefinito).
- `channels.mattermost.defaultAccount` opzionale sovrascrive la selezione dell'account predefinito quando corrisponde a un id account configurato.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // optional account binding
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
- `channels.signal.configWrites`: consente o nega le scritture di configurazione avviate da Signal.
- `channels.signal.defaultAccount` opzionale sovrascrive la selezione dell'account predefinito quando corrisponde a un id account configurato.

### BlueBubbles

BlueBubbles è il percorso iMessage consigliato (basato su Plugin, configurato in `channels.bluebubbles`).

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, group controls, and advanced actions:
      // see /channels/bluebubbles
    },
  },
}
```

- Percorsi chiave core trattati qui: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- `channels.bluebubbles.defaultAccount` opzionale sovrascrive la selezione dell'account predefinito quando corrisponde a un id account configurato.
- Le voci `bindings[]` di primo livello con `type: "acp"` possono collegare conversazioni BlueBubbles a sessioni ACP persistenti. Usa un handle BlueBubbles o una stringa di destinazione (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) in `match.peer.id`. Semantica dei campi condivisi: [Agenti ACP](/it/tools/acp-agents#persistent-channel-bindings).
- La configurazione completa del canale BlueBubbles è documentata in [BlueBubbles](/it/channels/bluebubbles).

### iMessage

OpenClaw avvia `imsg rpc` (JSON-RPC su stdio). Non sono richiesti daemon o porte.

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
      region: "US",
    },
  },
}
```

- `channels.imessage.defaultAccount` opzionale sovrascrive la selezione dell'account predefinito quando corrisponde a un id account configurato.

- Richiede Full Disk Access al DB di Messages.
- Preferisci destinazioni `chat_id:<id>`. Usa `imsg chats --limit 20` per elencare le chat.
- `cliPath` può puntare a un wrapper SSH; imposta `remoteHost` (`host` o `user@host`) per il recupero degli allegati tramite SCP.
- `attachmentRoots` e `remoteAttachmentRoots` limitano i percorsi degli allegati in ingresso (predefinito: `/Users/*/Library/Messages/Attachments`).
- SCP usa il controllo rigoroso della chiave host, quindi assicurati che la chiave host del relay esista già in `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: consente o nega le scritture di configurazione avviate da iMessage.
- Le voci `bindings[]` di primo livello con `type: "acp"` possono collegare conversazioni iMessage a sessioni ACP persistenti. Usa un handle normalizzato o una destinazione chat esplicita (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) in `match.peer.id`. Semantica dei campi condivisi: [Agenti ACP](/it/tools/acp-agents#persistent-channel-bindings).

<Accordion title="iMessage SSH wrapper example">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix è basato su Plugin e configurato in `channels.matrix`.

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
- `channels.matrix.proxy` instrada il traffico HTTP Matrix tramite un proxy HTTP(S) esplicito. Gli account nominati possono sovrascriverlo con `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` consente homeserver privati/interni. `proxy` e questa opzione di rete sono controlli indipendenti.
- `channels.matrix.defaultAccount` seleziona l'account preferito nelle configurazioni multi-account.
- `channels.matrix.autoJoin` ha come valore predefinito `off`, quindi le stanze con invito e i nuovi inviti in stile DM vengono ignorati finché non imposti `autoJoin: "allowlist"` con `autoJoinAllowlist` o `autoJoin: "always"`.
- `channels.matrix.execApprovals`: consegna delle approvazioni exec nativa di Matrix e autorizzazione degli approvatori.
  - `enabled`: `true`, `false` o `"auto"` (predefinito). In modalità automatica, le approvazioni exec si attivano quando gli approvatori possono essere risolti da `approvers` o `commands.ownerAllowFrom`.
  - `approvers`: ID utente Matrix (ad es. `@owner:example.org`) autorizzati ad approvare richieste exec.
  - `agentFilter`: allowlist opzionale di ID agente. Omettilo per inoltrare le approvazioni per tutti gli agenti.
  - `sessionFilter`: pattern opzionali di chiavi sessione (sottostringa o regex).
  - `target`: dove inviare le richieste di approvazione. `"dm"` (predefinito), `"channel"` (stanza di origine) o `"both"`.
  - Override per account: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` controlla come i DM Matrix vengono raggruppati in sessioni: `per-user` (predefinito) condivide in base al peer instradato, mentre `per-room` isola ogni stanza DM.
- Le sonde di stato Matrix e le ricerche live nella directory usano la stessa policy proxy del traffico runtime.
- La configurazione completa di Matrix, le regole di targeting e gli esempi di configurazione sono documentati in [Matrix](/it/channels/matrix).

### Microsoft Teams

Microsoft Teams è basato su Plugin e configurato in `channels.msteams`.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, team/channel policies:
      // see /channels/msteams
    },
  },
}
```

- Percorsi chiave core trattati qui: `channels.msteams`, `channels.msteams.configWrites`.
- La configurazione completa di Teams (credenziali, Webhook, policy DM/gruppo, override per team/per canale) è documentata in [Microsoft Teams](/it/channels/msteams).

### IRC

IRC è basato su Plugin e configurato in `channels.irc`.

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

- Percorsi chiave core trattati qui: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- `channels.irc.defaultAccount` opzionale sovrascrive la selezione dell'account predefinito quando corrisponde a un id account configurato.
- La configurazione completa del canale IRC (host/porta/TLS/canali/allowlist/gating basato su menzione) è documentata in [IRC](/it/channels/irc).

### Multi-account (tutti i canali)

Esegui più account per canale (ciascuno con il proprio `accountId`):

```json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Primary bot",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "Alerts bot",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```

- `default` viene usato quando `accountId` è omesso (CLI + routing).
- I token env si applicano solo all'account **predefinito**.
- Le impostazioni di base del canale si applicano a tutti gli account, salvo override per account.
- Usa `bindings[].match.accountId` per instradare ogni account a un agente diverso.
- Se aggiungi un account non predefinito tramite `openclaw channels add` (o onboarding del canale) mentre sei ancora su una configurazione di canale di primo livello a singolo account, OpenClaw promuove prima i valori di primo livello a singolo account con ambito account nella mappa degli account del canale, così l'account originale continua a funzionare. La maggior parte dei canali li sposta in `channels.<channel>.accounts.default`; Matrix può invece preservare una destinazione nominata/predefinita corrispondente già esistente.
- I binding esistenti solo per canale (senza `accountId`) continuano a corrispondere all'account predefinito; i binding con ambito account restano opzionali.
- `openclaw doctor --fix` ripara anche forme miste spostando i valori di primo livello a singolo account con ambito account nell'account promosso scelto per quel canale. La maggior parte dei canali usa `accounts.default`; Matrix può invece preservare una destinazione nominata/predefinita corrispondente già esistente.

### Altri canali Plugin

Molti canali Plugin sono configurati come `channels.<id>` e documentati nelle rispettive pagine dedicate dei canali (ad esempio Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat e Twitch).
Vedi l'indice completo dei canali: [Canali](/it/channels).

### Gating basato su menzione nelle chat di gruppo

Per impostazione predefinita, i messaggi di gruppo **richiedono una menzione** (menzione nei metadati o pattern regex sicuri). Si applica alle chat di gruppo WhatsApp, Telegram, Discord, Google Chat e iMessage.

Le risposte visibili sono controllate separatamente. Le stanze di gruppo/canale hanno come valore predefinito `messages.groupChat.visibleReplies: "message_tool"`: OpenClaw elabora comunque il turno, ma le normali risposte finali restano private e l'output visibile nella stanza richiede `message(action=send)`. Imposta `"automatic"` solo quando vuoi il comportamento legacy in cui le risposte normali vengono pubblicate nella stanza. Per applicare lo stesso comportamento di risposta visibile solo tramite strumento anche alle chat dirette, imposta `messages.visibleReplies: "message_tool"`; anche l'harness Codex usa quel comportamento solo tramite strumento come valore predefinito non impostato per le chat dirette.

Le risposte visibili solo tramite strumento richiedono un modello/runtime che chiami gli strumenti in modo affidabile. Se
il log della sessione mostra testo dell'assistente con `didSendViaMessagingTool: false`, il
modello ha prodotto una risposta finale privata invece di chiamare lo strumento messaggi.
Passa a un modello più forte nelle chiamate agli strumenti per quel canale, oppure imposta
`messages.groupChat.visibleReplies: "automatic"` per ripristinare le risposte finali visibili legacy.

Se lo strumento messaggi non è disponibile nella policy strumenti attiva, OpenClaw torna alle risposte visibili automatiche invece di sopprimere silenziosamente la risposta. `openclaw doctor` avvisa di questa mancata corrispondenza.

Il Gateway ricarica a caldo la configurazione `messages` dopo il salvataggio del file. Riavvia solo quando il monitoraggio dei file o il ricaricamento della configurazione è disabilitato nel deployment.

**Tipi di menzione:**

- **Menzioni nei metadati**: @-mention native della piattaforma. Ignorate nella modalità chat con se stessi di WhatsApp.
- **Pattern testuali**: pattern regex sicuri in `agents.list[].groupChat.mentionPatterns`. I pattern non validi e la ripetizione annidata non sicura vengono ignorati.
- Il filtro delle menzioni viene applicato solo quando il rilevamento è possibile (menzioni native o almeno un pattern).

```json5
{
  messages: {
    visibleReplies: "automatic", // global default for direct/source chats; Codex harness defaults unset direct chats to message_tool
    groupChat: {
      historyLimit: 50,
      visibleReplies: "message_tool", // default; use "automatic" for legacy final replies
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` imposta il valore predefinito globale. I canali possono sovrascriverlo con `channels.<channel>.historyLimit` (o per account). Imposta `0` per disabilitarlo.

`messages.visibleReplies` è il valore predefinito globale del turno sorgente; `messages.groupChat.visibleReplies` lo sovrascrive per i turni sorgente di gruppo/canale. Quando `messages.visibleReplies` non è impostato, un harness può fornire il proprio valore predefinito diretto/sorgente; l'harness Codex usa come valore predefinito `message_tool`. Gli elenchi consentiti dei canali e il filtro delle menzioni decidono comunque se un turno viene elaborato.

#### Limiti della cronologia dei DM

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

Risoluzione: sovrascrittura per DM → valore predefinito del provider → nessun limite (tutto conservato).

Supportati: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Modalità chat con se stessi

Includi il tuo numero in `allowFrom` per abilitare la modalità chat con se stessi (ignora le @-mention native, risponde solo ai pattern testuali):

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

### Comandi (gestione dei comandi in chat)

```json5
{
  commands: {
    native: "auto", // register native commands when supported
    nativeSkills: "auto", // register native skill commands when supported
    text: true, // parse /commands in chat messages
    bash: false, // allow ! (alias: /bash)
    bashForegroundMs: 2000,
    config: false, // allow /config
    mcp: false, // allow /mcp
    plugins: false, // allow /plugins
    debug: false, // allow /debug
    restart: true, // allow /restart + gateway restart tool
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

- Questo blocco configura le superfici dei comandi. Per l'attuale catalogo di comandi integrati e inclusi, consulta [Comandi slash](/it/tools/slash-commands).
- Questa pagina è un **riferimento delle chiavi di configurazione**, non il catalogo completo dei comandi. I comandi di proprietà dei canali/Plugin, come QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, associazione dispositivo `/pair`, memoria `/dreaming`, controllo telefono `/phone` e Talk `/voice`, sono documentati nelle rispettive pagine di canale/Plugin e in [Comandi slash](/it/tools/slash-commands).
- I comandi testuali devono essere messaggi **autonomi** con `/` iniziale.
- `native: "auto"` attiva i comandi nativi per Discord/Telegram, lascia Slack disattivato.
- `nativeSkills: "auto"` attiva i comandi Skills nativi per Discord/Telegram, lascia Slack disattivato.
- Sovrascrivi per canale: `channels.discord.commands.native` (booleano o `"auto"`). Per Discord, `false` salta la registrazione dei comandi nativi e la pulizia durante l'avvio.
- Sovrascrivi la registrazione nativa delle Skills per canale con `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` aggiunge voci extra al menu del bot Telegram.
- `bash: true` abilita `! <cmd>` per la shell host. Richiede `tools.elevated.enabled` e il mittente in `tools.elevated.allowFrom.<channel>`.
- `config: true` abilita `/config` (legge/scrive `openclaw.json`). Per i client Gateway `chat.send`, le scritture persistenti `/config set|unset` richiedono anche `operator.admin`; `/config show` in sola lettura resta disponibile ai normali client operatore con ambito di scrittura.
- `mcp: true` abilita `/mcp` per la configurazione dei server MCP gestiti da OpenClaw sotto `mcp.servers`.
- `plugins: true` abilita `/plugins` per rilevamento, installazione e controlli di abilitazione/disabilitazione dei Plugin.
- `channels.<provider>.configWrites` controlla le mutazioni della configurazione per canale (valore predefinito: true).
- Per i canali multi-account, `channels.<provider>.accounts.<id>.configWrites` controlla anche le scritture che mirano a quell'account (per esempio `/allowlist --config --account <id>` o `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` disabilita `/restart` e le azioni dello strumento di riavvio del Gateway. Valore predefinito: `true`.
- `ownerAllowFrom` è l'elenco consentito esplicito dei proprietari per comandi/strumenti riservati al proprietario. È separato da `allowFrom`.
- `ownerDisplay: "hash"` esegue l'hashing degli ID dei proprietari nel prompt di sistema. Imposta `ownerDisplaySecret` per controllare l'hashing.
- `allowFrom` è per provider. Quando è impostato, è l'**unica** fonte di autorizzazione (gli elenchi consentiti/associazioni dei canali e `useAccessGroups` vengono ignorati).
- `useAccessGroups: false` consente ai comandi di bypassare le policy dei gruppi di accesso quando `allowFrom` non è impostato.
- Mappa della documentazione dei comandi:
  - catalogo integrato e incluso: [Comandi slash](/it/tools/slash-commands)
  - superfici dei comandi specifiche dei canali: [Canali](/it/channels)
  - comandi QQ Bot: [QQ Bot](/it/channels/qqbot)
  - comandi di associazione: [Associazione](/it/channels/pairing)
  - comando scheda LINE: [LINE](/it/channels/line)
  - Dreaming della memoria: [Dreaming](/it/concepts/dreaming)

</Accordion>

---

## Correlati

- [Riferimento della configurazione](/it/gateway/configuration-reference) — chiavi di primo livello
- [Configurazione — agenti](/it/gateway/config-agents)
- [Panoramica dei canali](/it/channels)
