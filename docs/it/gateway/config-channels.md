---
read_when:
    - Configurazione di un Plugin di canale (autenticazione, controllo degli accessi, multi-account)
    - Risoluzione dei problemi delle chiavi di configurazione per canale
    - Audit della policy dei DM, della policy dei gruppi o del controllo delle menzioni
summary: 'Configurazione dei canali: controllo degli accessi, abbinamento, chiavi per canale su Slack, Discord, Telegram, WhatsApp, Matrix, iMessage e altro'
title: Configurazione — canali
x-i18n:
    generated_at: "2026-07-01T13:05:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ba84406a296db7a37ce44381b5a1ebccd7f4d3c32375b116f6da3da5def9340b
    source_path: gateway/config-channels.md
    workflow: 16
---

Chiavi di configurazione per canale sotto `channels.*`. Copre l'accesso a DM e gruppi,
configurazioni multi-account, controllo tramite menzione e chiavi per canale per Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage e gli altri plugin di canale inclusi.

Per agenti, strumenti, runtime del gateway e altre chiavi di primo livello, vedi
[Riferimento di configurazione](/it/gateway/configuration-reference).

## Canali

Ogni canale si avvia automaticamente quando esiste la relativa sezione di configurazione (a meno che `enabled: false`).

### Accesso a DM e gruppi

Tutti i canali supportano criteri per DM e criteri per gruppi:

| Criterio DM         | Comportamento                                                  |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (default) | I mittenti sconosciuti ricevono un codice di pairing monouso; il proprietario deve approvare |
| `allowlist`         | Solo i mittenti in `allowFrom` (o nell'archivio allow associato) |
| `open`              | Consenti tutti i DM in ingresso (richiede `allowFrom: ["*"]`)    |
| `disabled`          | Ignora tutti i DM in ingresso                                   |

| Criterio gruppo       | Comportamento                                            |
| --------------------- | -------------------------------------------------------- |
| `allowlist` (default) | Solo i gruppi che corrispondono all'allowlist configurata |
| `open`                | Ignora le allowlist dei gruppi (il controllo tramite menzione resta applicato) |
| `disabled`            | Blocca tutti i messaggi di gruppi/stanze                  |

<Note>
`channels.defaults.groupPolicy` imposta il valore predefinito quando `groupPolicy` di un provider non è impostato.
I codici di pairing scadono dopo 1 ora. Le richieste di pairing DM in sospeso sono limitate a **3 per canale**.
Se manca completamente un blocco provider (`channels.<provider>` assente), il criterio di gruppo del runtime torna a `allowlist` (chiusura in caso di errore) con un avviso all'avvio.
</Note>

### Override del modello per canale

Usa `channels.modelByChannel` per fissare ID di canale specifici o peer di messaggi diretti a un modello. I valori accettano `provider/model` o alias di modello configurati. La mappatura del canale si applica quando una sessione non ha già un override del modello (ad esempio, impostato tramite `/model`).

Per conversazioni di gruppo/thread, le chiavi sono ID gruppo specifici del canale, ID topic o nomi di canale. Per conversazioni di messaggi diretti (DM), le chiavi sono identificatori peer derivati dall'identità del mittente del canale (`nativeDirectUserId`, `origin.from`, `origin.to`, `OriginatingTo`, `From` o `SenderId`). La forma esatta della chiave dipende dal canale:

| Canale   | Forma chiave DM      | Esempio                                      |
| -------- | -------------------- | -------------------------------------------- |
| Slack    | `user:U...`          | `user:U12345`                                |
| Telegram | ID utente grezzo     | `123456789`                                  |
| Discord  | ID utente grezzo     | `987654321`                                  |
| WhatsApp | numero di telefono o JID | `15551234567`                            |
| Matrix   | ID utente Matrix     | `@user:matrix.org`                           |
| Feishu   | `feishu:ou_...`      | `feishu:ou_a8b6cab7e945387de5f253775d9b4d85` |

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-5.5",
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

Le chiavi specifiche per DM corrispondono solo nelle conversazioni di messaggi diretti; non influiscono sul routing di gruppi/thread.

### Valori predefiniti dei canali e Heartbeat

Usa `channels.defaults` per il comportamento condiviso di criteri di gruppo e Heartbeat tra provider:

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

- `channels.defaults.groupPolicy`: criterio di gruppo di fallback quando `groupPolicy` a livello di provider non è impostato.
- `channels.defaults.contextVisibility`: modalità predefinita di visibilità del contesto supplementare per tutti i canali. Valori: `all` (predefinito, include tutto il contesto citato/thread/cronologia), `allowlist` (include solo il contesto da mittenti in allowlist), `allowlist_quote` (come allowlist ma conserva il contesto esplicito di citazione/risposta). Override per canale: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: include gli stati dei canali integri nell'output di Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: include gli stati degradati/di errore nell'output di Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: renderizza l'output Heartbeat compatto in stile indicatore.

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

- Le voci `bindings[]` di primo livello con `type: "acp"` configurano associazioni ACP persistenti per DM e gruppi WhatsApp. Usa un numero diretto E.164 o un JID di gruppo WhatsApp in `match.peer.id`. La semantica dei campi è condivisa in [Agenti ACP](/it/tools/acp-agents#persistent-channel-bindings).

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

- I comandi in uscita usano per impostazione predefinita l'account `default` se presente; altrimenti il primo ID account configurato (ordinato).
- `channels.whatsapp.defaultAccount` opzionale sostituisce quella selezione dell'account predefinito di fallback quando corrisponde a un ID account configurato.
- La directory auth Baileys legacy per account singolo viene migrata da `openclaw doctor` in `whatsapp/default`.
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
      streaming: "partial", // off | partial | block | progress (default: partial)
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

- Token del bot: `channels.telegram.botToken` o `channels.telegram.tokenFile` (solo file regolare; symlink rifiutati), con `TELEGRAM_BOT_TOKEN` come fallback per l'account predefinito.
- `apiRoot` è solo la root della Telegram Bot API. Usa `https://api.telegram.org` o la tua root self-hosted/proxy, non `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` rimuove un suffisso finale accidentale `/bot<TOKEN>`.
- `channels.telegram.defaultAccount` opzionale sostituisce la selezione dell'account predefinito quando corrisponde a un ID account configurato.
- Nelle configurazioni multi-account (2+ ID account), imposta un valore predefinito esplicito (`channels.telegram.defaultAccount` o `channels.telegram.accounts.default`) per evitare il routing di fallback; `openclaw doctor` avvisa quando manca o non è valido.
- `configWrites: false` blocca le scritture di configurazione avviate da Telegram (migrazioni ID supergruppo, `/config set|unset`).
- Le voci `bindings[]` di primo livello con `type: "acp"` configurano associazioni ACP persistenti per i topic dei forum (usa `chatId:topic:topicId` canonico in `match.peer.id`). La semantica dei campi è condivisa in [Agenti ACP](/it/tools/acp-agents#persistent-channel-bindings).
- Le anteprime stream di Telegram usano `sendMessage` + `editMessageText` (funziona nelle chat dirette e di gruppo).
- Criterio di retry: vedi [Criterio di retry](/it/concepts/retry).

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
      suppressEmbeds: true,
      chunkMode: "length", // length | newline
      streaming: {
        mode: "progress", // off | partial | block | progress (Discord default: progress)
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

- Token: `channels.discord.token`, con `DISCORD_BOT_TOKEN` come fallback per l'account predefinito.
- Le chiamate dirette in uscita che forniscono un `token` Discord esplicito usano quel token per la chiamata; le impostazioni di riprova/policy dell'account provengono comunque dall'account selezionato nello snapshot del runtime attivo.
- L'opzione facoltativa `channels.discord.defaultAccount` sovrascrive la selezione dell'account predefinito quando corrisponde a un ID account configurato.
- Usa `user:<id>` (DM) o `channel:<id>` (canale della gilda) per le destinazioni di consegna; gli ID numerici semplici vengono rifiutati.
- Gli slug delle gilde sono in minuscolo con gli spazi sostituiti da `-`; le chiavi dei canali usano il nome in formato slug (senza `#`). Preferisci gli ID delle gilde.
- I messaggi scritti dai bot vengono ignorati per impostazione predefinita. `allowBots: true` li abilita; usa `allowBots: "mentions"` per accettare solo i messaggi dei bot che menzionano il bot (i messaggi propri vengono comunque filtrati).
- I canali che supportano messaggi in ingresso scritti da bot possono usare la [protezione dai loop dei bot](/it/channels/bot-loop-protection) condivisa. Imposta `channels.defaults.botLoopProtection` per i budget di coppia di base, poi sovrascrivi il canale o l'account solo quando una superficie richiede limiti diversi.
- `channels.discord.guilds.<id>.ignoreOtherMentions` (e le sovrascritture dei canali) scarta i messaggi che menzionano un altro utente o ruolo ma non il bot (esclusi @everyone/@here).
- `channels.discord.mentionAliases` mappa il testo stabile in uscita `@handle` agli ID utente Discord prima dell'invio, così i compagni di team noti possono essere menzionati in modo deterministico anche quando la cache temporanea della directory è vuota. Le sovrascritture per account si trovano in `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (predefinito 17) divide i messaggi alti anche quando sono sotto i 2000 caratteri.
- `channels.discord.suppressEmbeds` è predefinito a `true`, quindi gli URL in uscita non si espandono nelle anteprime dei link Discord a meno che l'opzione non venga disabilitata. I payload `embeds` espliciti vengono comunque inviati normalmente; le chiamate agli strumenti per messaggio possono sovrascrivere con `suppressEmbeds`.
- `channels.discord.threadBindings` controlla il routing associato ai thread Discord:
  - `enabled`: sovrascrittura Discord per le funzionalità di sessione associate ai thread (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` e consegna/routing associati)
  - `idleHours`: sovrascrittura Discord per la rimozione automatica del focus per inattività in ore (`0` disabilita)
  - `maxAgeHours`: sovrascrittura Discord per l'età massima rigida in ore (`0` disabilita)
  - `spawnSessions`: interruttore per `sessions_spawn({ thread: true })` e creazione/associazione automatica dei thread ACP thread-spawn (predefinito: `true`)
  - `defaultSpawnContext`: contesto nativo del subagente per gli spawn associati ai thread (`"fork"` per impostazione predefinita)
- Le voci di primo livello `bindings[]` con `type: "acp"` configurano associazioni ACP persistenti per canali e thread (usa l'ID del canale/thread in `match.peer.id`). La semantica dei campi è condivisa in [Agenti ACP](/it/tools/acp-agents#persistent-channel-bindings).
- `channels.discord.ui.components.accentColor` imposta il colore di accento per i contenitori dei componenti Discord v2.
- `channels.discord.agentComponents.ttlMs` controlla per quanto tempo i callback dei componenti Discord inviati restano registrati. Il valore predefinito è `1800000` (30 minuti), il massimo è `86400000` (24 ore) e le sovrascritture per account si trovano in `channels.discord.accounts.<accountId>.agentComponents.ttlMs`. Valori più lunghi mantengono utilizzabili più a lungo vecchi pulsanti/selettori/moduli, quindi preferisci il TTL più breve adatto al workflow.
- `channels.discord.voice` abilita le conversazioni nei canali vocali Discord e sovrascritture facoltative per join automatico + LLM + TTS. Le configurazioni Discord solo testo lasciano la voce disattivata per impostazione predefinita; imposta `channels.discord.voice.enabled=true` per abilitarla.
- `channels.discord.voice.model` sovrascrive facoltativamente il modello LLM usato per le risposte nei canali vocali Discord.
- `channels.discord.voice.daveEncryption` e `channels.discord.voice.decryptionFailureTolerance` passano alle opzioni DAVE di `@discordjs/voice` (`true` e `24` per impostazione predefinita).
- `channels.discord.voice.connectTimeoutMs` controlla l'attesa iniziale dello stato Ready di `@discordjs/voice` per `/vc join` e i tentativi di join automatico (`30000` per impostazione predefinita).
- `channels.discord.voice.reconnectGraceMs` controlla quanto tempo può impiegare una sessione vocale disconnessa a entrare nella segnalazione di riconnessione prima che OpenClaw la distrugga (`15000` per impostazione predefinita).
- La riproduzione vocale Discord non viene interrotta dall'evento di inizio parlato di un altro utente. Per evitare loop di feedback, OpenClaw ignora la nuova acquisizione vocale mentre TTS è in riproduzione.
- OpenClaw tenta inoltre il recupero della ricezione vocale lasciando e rientrando in una sessione vocale dopo errori di decifratura ripetuti.
- `channels.discord.streaming` è la chiave canonica della modalità di stream. Discord usa per impostazione predefinita `streaming.mode: "progress"`, così l'avanzamento di strumenti/lavoro appare in un unico messaggio di anteprima modificato; imposta `streaming.mode: "off"` per disabilitarlo. I valori legacy `streamMode` e booleani `streaming` restano alias di runtime; esegui `openclaw doctor --fix` per riscrivere la configurazione persistita.
- `channels.discord.autoPresence` mappa la disponibilità del runtime alla presenza del bot (healthy => online, degraded => idle, exhausted => dnd) e consente sovrascritture facoltative del testo di stato.
- `channels.discord.dangerouslyAllowNameMatching` riabilita la corrispondenza mutabile di nome/tag (modalità di compatibilità break-glass).
- `channels.discord.execApprovals`: consegna nativa Discord delle approvazioni exec e autorizzazione degli approvatori.
  - `enabled`: `true`, `false` o `"auto"` (predefinito). In modalità automatica, le approvazioni exec si attivano quando gli approvatori possono essere risolti da `approvers` o `commands.ownerAllowFrom`.
  - `approvers`: ID utente Discord autorizzati ad approvare richieste exec. Ripiega su `commands.ownerAllowFrom` quando omesso.
  - `agentFilter`: allowlist facoltativa degli ID agente. Ometti per inoltrare le approvazioni per tutti gli agenti.
  - `sessionFilter`: pattern facoltativi delle chiavi di sessione (sottostringa o regex).
  - `target`: dove inviare i prompt di approvazione. `"dm"` (predefinito) invia ai DM degli approvatori, `"channel"` invia al canale di origine, `"both"` invia a entrambi. Quando target include `"channel"`, i pulsanti sono utilizzabili solo dagli approvatori risolti.
  - `cleanupAfterResolve`: quando `true`, elimina i DM di approvazione dopo approvazione, rifiuto o timeout.

**Modalità di notifica delle reazioni:** `off` (nessuna), `own` (messaggi del bot, predefinita), `all` (tutti i messaggi), `allowlist` (da `guilds.<id>.users` su tutti i messaggi).

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
- È supportato anche SecretRef dell'account di servizio (`serviceAccountRef`).
- Fallback env: `GOOGLE_CHAT_SERVICE_ACCOUNT` o `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Usa `spaces/<spaceId>` o `users/<userId>` per le destinazioni di consegna.
- `channels.googlechat.dangerouslyAllowNameMatching` riabilita la corrispondenza mutabile del principal email (modalità di compatibilità break-glass).

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
      unfurlLinks: false,
      unfurlMedia: false,
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

- La **modalità Socket** richiede sia `botToken` sia `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` per il fallback env dell'account predefinito).
- La **modalità HTTP** richiede `botToken` più `signingSecret` (alla radice o per account).
- `socketMode` inoltra la regolazione del trasporto Socket Mode dell'SDK Slack all'API pubblica del receiver Bolt. Usalo solo quando indaghi su timeout ping/pong o comportamento di websocket obsoleti. Il valore predefinito di `clientPingTimeout` è `15000`; `serverPingTimeout` e `pingPongLoggingEnabled` vengono passati solo quando configurati.
- `botToken`, `appToken`, `signingSecret` e `userToken` accettano stringhe
  in testo normale o oggetti SecretRef.
- Gli snapshot degli account Slack espongono campi origine/stato per credenziale, come
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` e, in modalità HTTP,
  `signingSecretStatus`. `configured_unavailable` significa che l'account è
  configurato tramite SecretRef, ma il comando/percorso runtime corrente non è riuscito
  a risolvere il valore del segreto.
- `configWrites: false` blocca le scritture di configurazione avviate da Slack.
- L'opzione facoltativa `channels.slack.defaultAccount` sovrascrive la selezione dell'account predefinito quando corrisponde a un id account configurato.
- `channels.slack.streaming.mode` è la chiave canonica della modalità di stream Slack. `channels.slack.streaming.nativeTransport` controlla il trasporto di streaming nativo di Slack. I valori legacy `streamMode`, boolean `streaming` e `nativeStreaming` restano alias runtime; esegui `openclaw doctor --fix` per riscrivere la configurazione persistita.
- `unfurlLinks` e `unfurlMedia` inoltrano i booleani di unfurl per link e media di `chat.postMessage` di Slack per le risposte del bot. Il valore predefinito di `unfurlLinks` è `false`, così i link in uscita del bot non si espandono inline a meno che non siano abilitati; `unfurlMedia` viene omesso a meno che non sia configurato. Imposta uno dei due valori in `channels.slack.accounts.<accountId>` per sovrascrivere il valore di primo livello per un account.
- Usa `user:<id>` (DM) o `channel:<id>` per le destinazioni di consegna.

**Modalità di notifica delle reazioni:** `off`, `own` (predefinita), `all`, `allowlist` (da `reactionAllowlist`).

**Isolamento delle sessioni thread:** `thread.historyScope` è per thread (predefinito) o condiviso nel canale. `thread.inheritParent` copia la trascrizione del canale padre nei nuovi thread.

- Lo streaming nativo Slack più lo stato del thread in stile assistente Slack "is typing..." richiedono una destinazione thread di risposta. I DM di primo livello restano fuori thread per impostazione predefinita, quindi possono comunque usare lo stream tramite anteprime Slack di bozza con pubblicazione e modifica invece di mostrare l'anteprima stream/stato nativa in stile thread.
- `typingReaction` aggiunge una reazione temporanea al messaggio Slack in ingresso mentre una risposta è in esecuzione, poi la rimuove al completamento. Usa uno shortcode emoji Slack come `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: consegna client di approvazione nativa Slack e autorizzazione degli approvatori exec. Stesso schema di Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID utente Slack), `agentFilter`, `sessionFilter` e `target` (`"dm"`, `"channel"` o `"both"`). Le approvazioni dei Plugin possono usare questo percorso client nativo per richieste originate da Slack quando gli approvatori del Plugin Slack vengono risolti; la consegna di approvazioni Plugin nativa Slack può anche essere abilitata tramite `approvals.plugin` per sessioni originate da Slack o destinazioni Slack. Le approvazioni dei Plugin usano gli approvatori del Plugin Slack da `allowFrom` e il routing predefinito, non gli approvatori exec.

| Gruppo di azioni | Predefinito | Note                  |
| ------------ | ------- | ---------------------- |
| reactions    | abilitato | Reagisci + elenca reazioni |
| messages     | abilitato | Leggi/invia/modifica/elimina  |
| pins         | abilitato | Fissa/rimuovi fissaggio/elenca         |
| memberInfo   | abilitato | Informazioni membro            |
| emojiList    | abilitato | Elenco emoji personalizzate      |

### Mattermost

Mattermost viene distribuito come Plugin in bundle nelle release OpenClaw correnti. Build più vecchie o
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

Modalità chat: `oncall` (risponde su @-mention, predefinita), `onmessage` (ogni messaggio), `onchar` (messaggi che iniziano con il prefisso trigger).

Quando i comandi nativi Mattermost sono abilitati:

- `commands.callbackPath` deve essere un percorso (ad esempio `/api/channels/mattermost/command`), non un URL completo.
- `commands.callbackUrl` deve risolvere all'endpoint Gateway di OpenClaw ed essere raggiungibile dal server Mattermost.
- Le callback slash native vengono autenticate con i token per comando restituiti
  da Mattermost durante la registrazione del comando slash. Se la registrazione fallisce o nessun
  comando viene attivato, OpenClaw rifiuta le callback con
  `Unauthorized: invalid command token.`
- Per host di callback privati/tailnet/interni, Mattermost può richiedere
  che `ServiceSettings.AllowedUntrustedInternalConnections` includa l'host/dominio di callback.
  Usa valori host/dominio, non URL completi.
- `channels.mattermost.configWrites`: consente o nega le scritture di configurazione avviate da Mattermost.
- `channels.mattermost.requireMention`: richiede `@mention` prima di rispondere nei canali.
- `channels.mattermost.groups.<channelId>.requireMention`: override per canale del gate basato su menzione (`"*"` per il predefinito).
- L'opzione facoltativa `channels.mattermost.defaultAccount` sovrascrive la selezione dell'account predefinito quando corrisponde a un id account configurato.

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

- `channels.signal.account`: vincola l'avvio del canale a una specifica identità account Signal.
- `channels.signal.configWrites`: consente o nega le scritture di configurazione avviate da Signal.
- L'opzione facoltativa `channels.signal.defaultAccount` sovrascrive la selezione dell'account predefinito quando corrisponde a un id account configurato.

### iMessage

OpenClaw avvia `imsg rpc` (JSON-RPC su stdio). Non sono richiesti daemon o porte. Questo è il percorso preferito per le nuove configurazioni OpenClaw iMessage quando l'host può concedere le autorizzazioni per il database Messaggi e Automation.

Il supporto BlueBubbles è stato rimosso. `channels.bluebubbles` non è una superficie di configurazione runtime supportata in OpenClaw corrente. Migra le vecchie configurazioni a `channels.imessage`; usa [Rimozione di BlueBubbles e il percorso iMessage imsg](/it/announcements/bluebubbles-imessage) per la versione breve e [Arrivare da BlueBubbles](/it/channels/imessage-from-bluebubbles) per la tabella di traduzione completa.

Se il Gateway non è in esecuzione sul Mac Messaggi con accesso effettuato, mantieni `channels.imessage.enabled=true` e imposta `channels.imessage.cliPath` su un wrapper SSH che esegue `imsg "$@"` su quel Mac. Il percorso locale predefinito `imsg` è solo macOS.

Prima di affidarti a un wrapper SSH per invii in produzione, verifica un `imsg send` in uscita tramite quello stesso wrapper. Alcuni stati TCC macOS assegnano l'Automation di Messaggi a `/usr/libexec/sshd-keygen-wrapper`, il che può far funzionare letture e probe mentre gli invii falliscono con AppleEvents `-1743`; vedi [Gli invii del wrapper SSH falliscono con AppleEvents -1743](/it/channels/imessage#ssh-wrapper-sends-fail-with-appleevents-1743).

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

- L'opzione facoltativa `channels.imessage.defaultAccount` sovrascrive la selezione dell'account predefinito quando corrisponde a un id account configurato.

- Richiede Full Disk Access al DB Messaggi.
- Preferisci destinazioni `chat_id:<id>`. Usa `imsg chats --limit 20` per elencare le chat.
- `cliPath` può puntare a un wrapper SSH; imposta `remoteHost` (`host` o `user@host`) per il recupero degli allegati tramite SCP.
- `attachmentRoots` e `remoteAttachmentRoots` limitano i percorsi degli allegati in ingresso (predefinito: `/Users/*/Library/Messages/Attachments`).
- SCP usa il controllo rigoroso delle chiavi host, quindi assicurati che la chiave host del relay esista già in `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: consente o nega le scritture di configurazione avviate da iMessage.
- `channels.imessage.sendTransport`: trasporto di invio RPC `imsg` preferito per le normali risposte in uscita. `auto` (predefinito) usa il bridge IMCore per le chat esistenti quando è in esecuzione, poi ripiega su AppleScript; `bridge` richiede la consegna tramite API privata; `applescript` forza il percorso pubblico di automazione Messaggi.
- `channels.imessage.actions.*`: abilita azioni API private che sono anche soggette a gate tramite `imsg status` / `openclaw channels status --probe`.
- `channels.imessage.includeAttachments` è disattivato per impostazione predefinita; impostalo su `true` prima di aspettarti media in ingresso nei turni dell'agente.
- Il recupero in ingresso dopo un riavvio di bridge/gateway è automatico (dedupe GUID più un limite di età per backlog obsoleto). Le configurazioni esistenti `channels.imessage.catchup.enabled: true` sono ancora rispettate come profilo di compatibilità deprecato.
- `channels.imessage.groups`: registro dei gruppi e impostazioni per gruppo. Con `groupPolicy: "allowlist"`, configura chiavi `chat_id` esplicite oppure una voce wildcard `"*"` affinché i messaggi di gruppo possano superare il gate del registro.
- Le voci `bindings[]` di primo livello con `type: "acp"` possono associare conversazioni iMessage a sessioni ACP persistenti. Usa un handle normalizzato o una destinazione chat esplicita (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) in `match.peer.id`. Semantica dei campi condivisi: [Agenti ACP](/it/tools/acp-agents#persistent-channel-bindings).

<Accordion title="Esempio di wrapper SSH iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix è supportato da Plugin e configurato sotto `channels.matrix`.

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

- L'autenticazione con token usa `accessToken`; l'autenticazione con password usa `userId` + `password`.
- `channels.matrix.proxy` instrada il traffico HTTP di Matrix tramite un proxy HTTP(S) esplicito. Gli account con nome possono sovrascriverlo con `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` consente homeserver privati/interni. `proxy` e questa opzione di rete sono controlli indipendenti.
- `channels.matrix.defaultAccount` seleziona l'account preferito nelle configurazioni multi-account.
- `channels.matrix.autoJoin` ha valore predefinito `off`, quindi le stanze con invito e i nuovi inviti in stile DM vengono ignorati finché non imposti `autoJoin: "allowlist"` con `autoJoinAllowlist` oppure `autoJoin: "always"`.
- `channels.matrix.execApprovals`: consegna nativa Matrix delle approvazioni exec e autorizzazione degli approvatori.
  - `enabled`: `true`, `false` o `"auto"` (predefinito). In modalità auto, le approvazioni exec si attivano quando gli approvatori possono essere risolti da `approvers` o `commands.ownerAllowFrom`.
  - `approvers`: ID utente Matrix (ad es. `@owner:example.org`) autorizzati ad approvare richieste exec.
  - `agentFilter`: allowlist facoltativa di ID agente. Omettila per inoltrare le approvazioni per tutti gli agenti.
  - `sessionFilter`: pattern facoltativi di chiave sessione (sottostringa o regex).
  - `target`: dove inviare le richieste di approvazione. `"dm"` (predefinito), `"channel"` (stanza di origine) o `"both"`.
  - Override per account: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` controlla come i DM Matrix vengono raggruppati in sessioni: `per-user` (predefinito) condivide per peer instradato, mentre `per-room` isola ogni stanza DM.
- I probe di stato Matrix e le ricerche live nella directory usano la stessa policy proxy del traffico runtime.
- La configurazione Matrix completa, le regole di targeting e gli esempi di configurazione sono documentati in [Matrix](/it/channels/matrix).

### Microsoft Teams

Microsoft Teams è supportato da Plugin e configurato sotto `channels.msteams`.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, policy team/canale:
      // see /channels/msteams
    },
  },
}
```

- Percorsi chiave core trattati qui: `channels.msteams`, `channels.msteams.configWrites`.
- La configurazione completa di Teams (credenziali, webhook, policy DM/gruppo, override per team/per canale) è documentata in [Microsoft Teams](/it/channels/msteams).

### IRC

IRC è supportato da Plugin e configurato sotto `channels.irc`.

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
- `channels.irc.defaultAccount` facoltativo sovrascrive la selezione dell'account predefinito quando corrisponde a un ID account configurato.
- La configurazione completa del canale IRC (host/porta/TLS/canali/allowlist/gating delle menzioni) è documentata in [IRC](/it/channels/irc).

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

- `default` viene usato quando `accountId` viene omesso (CLI + routing).
- I token env si applicano solo all'account **default**.
- Le impostazioni di base del canale si applicano a tutti gli account salvo override per account.
- Usa `bindings[].match.accountId` per instradare ogni account a un agente diverso.
- Se aggiungi un account non predefinito tramite `openclaw channels add` (o onboarding del canale) mentre sei ancora su una configurazione di canale top-level a singolo account, OpenClaw prima promuove i valori top-level a singolo account con ambito account nella mappa degli account del canale, così l'account originale continua a funzionare. La maggior parte dei canali li sposta in `channels.<channel>.accounts.default`; Matrix può invece preservare un target esistente con nome/predefinito corrispondente.
- I binding esistenti solo per canale (senza `accountId`) continuano a corrispondere all'account predefinito; i binding con ambito account restano facoltativi.
- `openclaw doctor --fix` ripara anche le forme miste spostando i valori top-level a singolo account con ambito account nell'account promosso scelto per quel canale. La maggior parte dei canali usa `accounts.default`; Matrix può invece preservare un target esistente con nome/predefinito corrispondente.

### Altri canali Plugin

Molti canali Plugin sono configurati come `channels.<id>` e documentati nelle loro pagine canale dedicate (per esempio Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat e Twitch).
Vedi l'indice completo dei canali: [Canali](/it/channels).

### Gating delle menzioni nelle chat di gruppo

I messaggi di gruppo richiedono per impostazione predefinita **una menzione** (menzione nei metadati o pattern regex sicuri). Si applica alle chat di gruppo di WhatsApp, Telegram, Discord, Google Chat e iMessage.

Le risposte visibili sono controllate separatamente. Le richieste dirette normali di gruppo, canale e WebChat interno hanno come impostazione predefinita la consegna finale automatica: il testo finale dell'assistente viene pubblicato tramite il percorso legacy di risposta visibile. Scegli `messages.visibleReplies: "message_tool"` o `messages.groupChat.visibleReplies: "message_tool"` quando l'output visibile deve essere pubblicato solo dopo che l'agente chiama `message(action=send)`. Se il modello restituisce testo finale senza chiamare lo strumento messaggio in una modalità solo-strumento attivata, quel testo finale resta privato e il log verboso del Gateway registra i metadati del payload soppresso.

Le risposte visibili solo-strumento richiedono un modello/runtime che chiami gli strumenti in modo affidabile e sono consigliate per stanze condivise ambientali sui modelli di ultima generazione come GPT 5.5. Alcuni modelli più deboli possono rispondere con testo finale ma non capire che l'output visibile alla sorgente deve essere inviato con `message(action=send)`. Per quei modelli, usa `"automatic"` così il turno finale dell'assistente è il percorso di risposta visibile. Se il log della sessione mostra testo dell'assistente con `didSendViaMessagingTool: false`, il modello ha prodotto testo finale privato invece di chiamare lo strumento messaggio. Passa a un modello più forte nella chiamata agli strumenti per quel canale, ispeziona il log verboso del Gateway per il riepilogo del payload soppresso oppure imposta `messages.groupChat.visibleReplies: "automatic"` per usare risposte finali visibili per ogni richiesta di gruppo/canale.

Se lo strumento messaggio non è disponibile nella policy degli strumenti attiva, OpenClaw ripiega sulle risposte visibili automatiche invece di sopprimere silenziosamente la risposta. `openclaw doctor` avvisa di questa mancata corrispondenza.

Questa regola si applica al normale testo finale dell'agente. I binding di conversazione posseduti da Plugin usano la risposta restituita dal Plugin proprietario come risposta visibile per i turni bound-thread rivendicati; il Plugin non deve chiamare `message(action=send)` per quelle risposte di binding.

**Risoluzione dei problemi: la @menzione di gruppo attiva la digitazione poi silenzio (nessun errore)**

Sintomo: una @menzione di gruppo/canale mostra l'indicatore di digitazione e il log del gateway riporta `dispatch complete (queuedFinal=false, replies=0)`, ma nessun messaggio arriva nella stanza. I DM allo stesso agente rispondono normalmente.

Causa: la modalità di risposta visibile di gruppo/canale si risolve in `"message_tool"`, quindi OpenClaw esegue il turno ma sopprime il testo finale dell'assistente a meno che l'agente non chiami `message(action=send)`. Non esiste alcun contratto `NO_REPLY` in questa modalità; nessuna chiamata allo strumento messaggio significa nessuna risposta alla sorgente. Non c'è errore perché la soppressione è il comportamento configurato. I normali turni di gruppo e canale hanno valore predefinito `"automatic"`, quindi questo sintomo appare solo quando `messages.groupChat.visibleReplies` (o `messages.visibleReplies` globale) è impostato esplicitamente su `"message_tool"`. Harness `defaultVisibleReplies` non si applica qui — il resolver di gruppo/canale lo ignora; influisce solo sulle chat dirette/sorgente (l'harness Codex sopprime in quel modo i finali delle chat dirette).

Correzione: scegli un modello più forte nella chiamata agli strumenti, rimuovi l'override esplicito `"message_tool"` per tornare al valore predefinito `"automatic"`, oppure imposta `messages.groupChat.visibleReplies: "automatic"` per forzare risposte visibili per ogni richiesta di gruppo/canale. Il Gateway ricarica a caldo la configurazione `messages` dopo il salvataggio del file; riavvia il Gateway solo quando il controllo dei file o il ricaricamento della configurazione è disabilitato nella distribuzione.

**Tipi di menzione:**

- **Menzioni nei metadati**: @-menzioni native della piattaforma. Ignorate in modalità self-chat di WhatsApp.
- **Pattern di testo**: pattern regex sicuri in `agents.list[].groupChat.mentionPatterns`. I pattern non validi e la ripetizione annidata non sicura vengono ignorati.
- Il gating delle menzioni viene applicato solo quando il rilevamento è possibile (menzioni native o almeno un pattern).

```json5
{
  messages: {
    visibleReplies: "automatic", // force old automatic final replies for direct/source chats
    groupChat: {
      historyLimit: 50,
      unmentionedInbound: "room_event", // always-on unmentioned room chatter becomes quiet context
      visibleReplies: "message_tool", // opt-in; require message(action=send) for visible room replies
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` imposta il valore predefinito globale. I canali possono sovrascriverlo con `channels.<channel>.historyLimit` (o per account). Imposta `0` per disabilitare.

`messages.groupChat.unmentionedInbound: "room_event"` invia messaggi di gruppo/canale always-on senza menzione come contesto stanza silenzioso sui canali supportati. I messaggi con menzione, i comandi e i messaggi diretti restano richieste utente. Vedi [Eventi stanza ambientali](/it/channels/ambient-room-events) per esempi completi di Discord, Slack e Telegram.

`messages.visibleReplies` è il valore predefinito globale per gli eventi sorgente; `messages.groupChat.visibleReplies` lo sovrascrive per gli eventi sorgente di gruppo/canale. Quando `messages.visibleReplies` non è impostato, le chat dirette/sorgente usano il runtime selezionato o il valore predefinito dell'harness, ma i turni diretti del WebChat interno usano la consegna finale automatica per parità di prompt Pi/Codex. Imposta `messages.visibleReplies: "message_tool"` per richiedere intenzionalmente `message(action=send)` per l'output visibile. Le allowlist dei canali e il gating delle menzioni decidono comunque se un evento viene elaborato.

#### Limiti della cronologia DM

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

Risoluzione: override per DM → valore predefinito del provider → nessun limite (tutto conservato).

Supportati: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Modalità self-chat

Includi il tuo numero in `allowFrom` per abilitare la modalità self-chat (ignora le @-menzioni native, risponde solo ai pattern di testo):

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

### Comandi (gestione dei comandi chat)

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

- Questo blocco configura le superfici dei comandi. Per l'attuale catalogo dei comandi integrati e in bundle, vedi [Comandi slash](/it/tools/slash-commands).
- Questa pagina è un **riferimento delle chiavi di configurazione**, non il catalogo completo dei comandi. I comandi di proprietà del canale/Plugin come QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, associazione dispositivo `/pair`, memoria `/dreaming`, controllo telefono `/phone` e Talk `/voice` sono documentati nelle rispettive pagine di canale/Plugin più [Comandi slash](/it/tools/slash-commands).
- I comandi testuali devono essere messaggi **autonomi** con `/` iniziale.
- `native: "auto"` attiva i comandi nativi per Discord/Telegram, lascia Slack disattivato.
- `nativeSkills: "auto"` attiva i comandi Skills nativi per Discord/Telegram, lascia Slack disattivato.
- Override per canale: `channels.discord.commands.native` (bool o `"auto"`). Per Discord, `false` salta la registrazione e la pulizia dei comandi nativi durante l'avvio.
- Override della registrazione delle Skills native per canale con `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` aggiunge voci extra al menu del bot Telegram.
- `bash: true` abilita `! <cmd>` per la shell dell'host. Richiede `tools.elevated.enabled` e mittente in `tools.elevated.allowFrom.<channel>`.
- `config: true` abilita `/config` (legge/scrive `openclaw.json`). Per i client gateway `chat.send`, anche le scritture persistenti `/config set|unset` richiedono `operator.admin`; `/config show` in sola lettura resta disponibile per i normali client operatore con ambito di scrittura.
- `mcp: true` abilita `/mcp` per la configurazione dei server MCP gestiti da OpenClaw sotto `mcp.servers`.
- `plugins: true` abilita `/plugins` per individuazione, installazione e controlli di abilitazione/disabilitazione dei plugin.
- `channels.<provider>.configWrites` controlla le mutazioni della configurazione per canale (predefinito: true).
- Per i canali multi-account, `channels.<provider>.accounts.<id>.configWrites` controlla anche le scritture destinate a quell'account (ad esempio `/allowlist --config --account <id>` o `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` disabilita `/restart` e le azioni degli strumenti di riavvio gateway. Predefinito: `true`.
- `ownerAllowFrom` è la allowlist esplicita del proprietario per i comandi riservati al proprietario e le azioni del canale protette dal proprietario. È separata da `allowFrom`.
- `ownerDisplay: "hash"` calcola l'hash degli ID proprietario nel prompt di sistema. Imposta `ownerDisplaySecret` per controllare l'hashing.
- `allowFrom` è per provider. Quando impostata, è l'**unica** fonte di autorizzazione (allowlist/associazione del canale e `useAccessGroups` vengono ignorati).
- `useAccessGroups: false` consente ai comandi di ignorare le policy dei gruppi di accesso quando `allowFrom` non è impostato.
- Mappa della documentazione dei comandi:
  - catalogo integrato e in bundle: [Comandi slash](/it/tools/slash-commands)
  - superfici dei comandi specifiche del canale: [Canali](/it/channels)
  - comandi QQ Bot: [QQ Bot](/it/channels/qqbot)
  - comandi di associazione: [Associazione](/it/channels/pairing)
  - comando scheda LINE: [LINE](/it/channels/line)
  - dreaming della memoria: [Dreaming](/it/concepts/dreaming)

</Accordion>

---

## Correlati

- [Riferimento della configurazione](/it/gateway/configuration-reference) — chiavi di primo livello
- [Configurazione — agenti](/it/gateway/config-agents)
- [Panoramica dei canali](/it/channels)
