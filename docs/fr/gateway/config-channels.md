---
read_when:
    - Configuration d’un Plugin de canal (authentification, contrôle d’accès, comptes multiples)
    - Dépannage des clés de configuration par canal
    - Audit de la politique des DM, de la politique de groupe ou du filtrage des mentions
summary: 'Configuration des canaux : contrôle d’accès, appairage, clés par canal sur Slack, Discord, Telegram, WhatsApp, Matrix, iMessage et plus encore'
title: Configuration — canaux
x-i18n:
    generated_at: "2026-04-30T07:25:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: e16ab50020711aac8e06cd234739ac7b566420cf7ce8621c0aca12c22484f07f
    source_path: gateway/config-channels.md
    workflow: 16
---

Configuration par canal sous `channels.*`. Couvre l’accès aux DM et aux groupes,
les configurations multi-comptes, le filtrage par mention et les clés par canal pour Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage et les autres plugins de canal groupés.

Pour les agents, les outils, le runtime Gateway et les autres clés de premier niveau, consultez
[Référence de configuration](/fr/gateway/configuration-reference).

## Canaux

Chaque canal démarre automatiquement lorsque sa section de configuration existe (sauf si `enabled: false`).

### Accès aux DM et aux groupes

Tous les canaux prennent en charge les politiques de DM et les politiques de groupe :

| Politique de DM     | Comportement                                                   |
| ------------------- | -------------------------------------------------------------- |
| `pairing` (default) | Les expéditeurs inconnus reçoivent un code d’appairage unique ; le propriétaire doit approuver |
| `allowlist`         | Seulement les expéditeurs dans `allowFrom` (ou le magasin d’autorisations appairé) |
| `open`              | Autoriser tous les DM entrants (nécessite `allowFrom: ["*"]`)  |
| `disabled`          | Ignorer tous les DM entrants                                   |

| Politique de groupe   | Comportement                                             |
| --------------------- | -------------------------------------------------------- |
| `allowlist` (default) | Seulement les groupes correspondant à la liste d’autorisation configurée |
| `open`                | Contourner les listes d’autorisation de groupe (le filtrage par mention s’applique toujours) |
| `disabled`            | Bloquer tous les messages de groupe/salon                |

<Note>
`channels.defaults.groupPolicy` définit la valeur par défaut lorsque le `groupPolicy` d’un fournisseur n’est pas défini.
Les codes d’appairage expirent après 1 heure. Les demandes d’appairage DM en attente sont limitées à **3 par canal**.
Si un bloc fournisseur est entièrement absent (`channels.<provider>` absent), la politique de groupe du runtime revient à `allowlist` (échec fermé) avec un avertissement au démarrage.
</Note>

### Remplacements de modèle par canal

Utilisez `channels.modelByChannel` pour associer des ID de canal spécifiques à un modèle. Les valeurs acceptent `provider/model` ou des alias de modèle configurés. La correspondance de canal s’applique lorsqu’une session ne dispose pas déjà d’un remplacement de modèle (par exemple, défini via `/model`).

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

### Valeurs par défaut des canaux et Heartbeat

Utilisez `channels.defaults` pour le comportement partagé de politique de groupe et de Heartbeat entre les fournisseurs :

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

- `channels.defaults.groupPolicy` : politique de groupe de repli lorsqu’un `groupPolicy` au niveau du fournisseur n’est pas défini.
- `channels.defaults.contextVisibility` : mode de visibilité par défaut du contexte supplémentaire pour tous les canaux. Valeurs : `all` (par défaut, inclut tout le contexte cité/de fil/d’historique), `allowlist` (inclut seulement le contexte provenant d’expéditeurs autorisés), `allowlist_quote` (identique à allowlist, mais conserve le contexte explicite de citation/réponse). Remplacement par canal : `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk` : inclure les états de canaux sains dans la sortie de Heartbeat.
- `channels.defaults.heartbeat.showAlerts` : inclure les états dégradés/en erreur dans la sortie de Heartbeat.
- `channels.defaults.heartbeat.useIndicator` : rendre une sortie Heartbeat compacte de type indicateur.

### WhatsApp

WhatsApp s’exécute via le canal web du Gateway (Baileys Web). Il démarre automatiquement lorsqu’une session liée existe.

```json5
{
  web: {
    whatsapp: {
      keepAliveIntervalMs: 25000,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
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
  web: {
    enabled: true,
    heartbeatSeconds: 60,
    reconnect: {
      initialMs: 2000,
      maxMs: 120000,
      factor: 1.4,
      jitter: 0.2,
      maxAttempts: 0,
    },
  },
}
```

<Accordion title="WhatsApp multi-comptes">

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

- Les commandes sortantes utilisent par défaut le compte `default` s’il est présent ; sinon, le premier identifiant de compte configuré (trié).
- `channels.whatsapp.defaultAccount`, optionnel, remplace cette sélection de compte par défaut de repli lorsqu’il correspond à un identifiant de compte configuré.
- L’ancien répertoire d’authentification Baileys mono-compte est migré par `openclaw doctor` vers `whatsapp/default`.
- Remplacements par compte : `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

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

- Jeton du bot : `channels.telegram.botToken` ou `channels.telegram.tokenFile` (fichier normal uniquement ; les liens symboliques sont rejetés), avec `TELEGRAM_BOT_TOKEN` comme repli pour le compte par défaut.
- `apiRoot` est uniquement la racine de l’API Bot Telegram. Utilisez `https://api.telegram.org` ou votre racine auto-hébergée/proxy, pas `https://api.telegram.org/bot<TOKEN>` ; `openclaw doctor --fix` supprime un suffixe accidentel final `/bot<TOKEN>`.
- `channels.telegram.defaultAccount`, optionnel, remplace la sélection de compte par défaut lorsqu’il correspond à un identifiant de compte configuré.
- Dans les configurations multi-comptes (2 identifiants de compte ou plus), définissez une valeur par défaut explicite (`channels.telegram.defaultAccount` ou `channels.telegram.accounts.default`) pour éviter le routage de repli ; `openclaw doctor` avertit lorsqu’elle est absente ou non valide.
- `configWrites: false` bloque les écritures de configuration initiées par Telegram (migrations d’ID de supergroupe, `/config set|unset`).
- Les entrées `bindings[]` de premier niveau avec `type: "acp"` configurent des liaisons ACP persistantes pour les sujets de forum (utilisez le format canonique `chatId:topic:topicId` dans `match.peer.id`). La sémantique des champs est partagée dans [Agents ACP](/fr/tools/acp-agents#channel-specific-settings).
- Les aperçus de flux Telegram utilisent `sendMessage` + `editMessageText` (fonctionne dans les conversations directes et de groupe).
- Politique de nouvelle tentative : consultez [Politique de nouvelle tentative](/fr/concepts/retry).

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
      streaming: "off", // off | partial | block | progress (progress maps to partial on Discord)
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
        spawnSubagentSessions: false, // opt-in for sessions_spawn({ thread: true })
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

- Jeton : `channels.discord.token`, avec `DISCORD_BOT_TOKEN` comme solution de repli pour le compte par défaut.
- Les appels sortants directs qui fournissent un `token` Discord explicite utilisent ce jeton pour l’appel ; les paramètres de nouvelle tentative/de stratégie du compte proviennent toujours du compte sélectionné dans l’instantané d’exécution actif.
- `channels.discord.defaultAccount`, facultatif, remplace la sélection du compte par défaut lorsqu’il correspond à un identifiant de compte configuré.
- Utilisez `user:<id>` (MP) ou `channel:<id>` (canal de guilde) pour les cibles de livraison ; les identifiants numériques nus sont rejetés.
- Les slugs de guilde sont en minuscules avec les espaces remplacés par `-` ; les clés de canal utilisent le nom sous forme de slug (sans `#`). Préférez les identifiants de guilde.
- Les messages rédigés par des bots sont ignorés par défaut. `allowBots: true` les active ; utilisez `allowBots: "mentions"` pour n’accepter que les messages de bots qui mentionnent le bot (les propres messages restent filtrés).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (et les remplacements au niveau du canal) supprime les messages qui mentionnent un autre utilisateur ou rôle mais pas le bot (hors @everyone/@here).
- `maxLinesPerMessage` (17 par défaut) divise les messages longs même lorsqu’ils font moins de 2000 caractères.
- `channels.discord.threadBindings` contrôle le routage Discord lié aux fils :
  - `enabled` : remplacement Discord pour les fonctionnalités de session liées aux fils (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, et livraison/routage liés)
  - `idleHours` : remplacement Discord pour le désaxage automatique après inactivité, en heures (`0` désactive)
  - `maxAgeHours` : remplacement Discord pour l’âge maximal strict, en heures (`0` désactive)
  - `spawnSubagentSessions` : commutateur d’activation pour la création/liaison automatique de fils par `sessions_spawn({ thread: true })`
- Les entrées `bindings[]` de niveau supérieur avec `type: "acp"` configurent des liaisons ACP persistantes pour les canaux et les fils (utilisez l’identifiant du canal/fil dans `match.peer.id`). La sémantique des champs est partagée dans [Agents ACP](/fr/tools/acp-agents#channel-specific-settings).
- `channels.discord.ui.components.accentColor` définit la couleur d’accentuation pour les conteneurs de composants Discord v2.
- `channels.discord.voice` active les conversations de canaux vocaux Discord et les remplacements facultatifs de jonction automatique, LLM et TTS.
- `channels.discord.voice.model` remplace facultativement le modèle LLM utilisé pour les réponses de canal vocal Discord.
- `channels.discord.voice.daveEncryption` et `channels.discord.voice.decryptionFailureTolerance` sont transmis aux options DAVE de `@discordjs/voice` (`true` et `24` par défaut).
- OpenClaw tente en outre de récupérer la réception vocale en quittant/rejoignant une session vocale après des échecs de déchiffrement répétés.
- `channels.discord.streaming` est la clé canonique du mode de flux. Les anciennes valeurs `streamMode` et booléennes `streaming` sont migrées automatiquement.
- `channels.discord.autoPresence` associe la disponibilité d’exécution à la présence du bot (healthy => online, degraded => idle, exhausted => dnd) et permet des remplacements facultatifs du texte de statut.
- `channels.discord.dangerouslyAllowNameMatching` réactive la correspondance mutable par nom/tag (mode de compatibilité d’urgence).
- `channels.discord.execApprovals` : livraison d’approbation d’exécution native Discord et autorisation des approbateurs.
  - `enabled` : `true`, `false` ou `"auto"` (par défaut). En mode automatique, les approbations d’exécution s’activent lorsque les approbateurs peuvent être résolus depuis `approvers` ou `commands.ownerAllowFrom`.
  - `approvers` : identifiants d’utilisateurs Discord autorisés à approuver les demandes d’exécution. Se rabat sur `commands.ownerAllowFrom` en cas d’omission.
  - `agentFilter` : liste d’autorisation facultative d’identifiants d’agents. Omettez-la pour transférer les approbations pour tous les agents.
  - `sessionFilter` : motifs facultatifs de clés de session (sous-chaîne ou regex).
  - `target` : où envoyer les invites d’approbation. `"dm"` (par défaut) envoie aux MP des approbateurs, `"channel"` envoie au canal d’origine, `"both"` envoie aux deux. Lorsque la cible inclut `"channel"`, les boutons ne sont utilisables que par les approbateurs résolus.
  - `cleanupAfterResolve` : lorsque `true`, supprime les MP d’approbation après approbation, refus ou expiration du délai.

**Modes de notification par réaction :** `off` (aucune), `own` (messages du bot, par défaut), `all` (tous les messages), `allowlist` (depuis `guilds.<id>.users` sur tous les messages).

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

- JSON de compte de service : en ligne (`serviceAccount`) ou basé sur un fichier (`serviceAccountFile`).
- SecretRef de compte de service est également pris en charge (`serviceAccountRef`).
- Solutions de repli d’environnement : `GOOGLE_CHAT_SERVICE_ACCOUNT` ou `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Utilisez `spaces/<spaceId>` ou `users/<userId>` pour les cibles de livraison.
- `channels.googlechat.dangerouslyAllowNameMatching` réactive la correspondance mutable des principaux par e-mail (mode de compatibilité d’urgence).

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

- **Mode socket** nécessite à la fois `botToken` et `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` comme solution de repli d’environnement pour le compte par défaut).
- **Mode HTTP** nécessite `botToken` plus `signingSecret` (à la racine ou par compte).
- `socketMode` transmet le réglage du transport Socket Mode du SDK Slack à l’API publique du récepteur Bolt. Utilisez-le uniquement lors de l’investigation de délais d’expiration ping/pong ou d’un comportement websocket obsolète.
- `botToken`, `appToken`, `signingSecret` et `userToken` acceptent des chaînes en texte clair
  ou des objets SecretRef.
- Les instantanés de comptes Slack exposent des champs de source/statut par identifiant tels que
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` et, en mode HTTP,
  `signingSecretStatus`. `configured_unavailable` signifie que le compte est
  configuré via SecretRef mais que le chemin de commande/d’exécution actuel n’a pas pu
  résoudre la valeur du secret.
- `configWrites: false` bloque les écritures de configuration initiées par Slack.
- `channels.slack.defaultAccount`, facultatif, remplace la sélection du compte par défaut lorsqu’il correspond à un identifiant de compte configuré.
- `channels.slack.streaming.mode` est la clé canonique du mode de flux Slack. `channels.slack.streaming.nativeTransport` contrôle le transport de flux natif de Slack. Les anciennes valeurs `streamMode`, booléennes `streaming` et `nativeStreaming` sont migrées automatiquement.
- Utilisez `user:<id>` (MP) ou `channel:<id>` pour les cibles de livraison.

**Modes de notification par réaction :** `off`, `own` (par défaut), `all`, `allowlist` (depuis `reactionAllowlist`).

**Isolation des sessions de fil :** `thread.historyScope` est propre au fil (par défaut) ou partagé sur le canal. `thread.inheritParent` copie la transcription du canal parent vers les nouveaux fils.

- Le flux natif Slack plus le statut de fil de style assistant Slack « is typing... » nécessitent une cible de fil de réponse. Les MP de niveau supérieur restent hors fil par défaut ; ils utilisent donc `typingReaction` ou la livraison normale au lieu de l’aperçu de style fil.
- `typingReaction` ajoute une réaction temporaire au message Slack entrant pendant qu’une réponse est en cours, puis la supprime à la fin. Utilisez un shortcode d’emoji Slack tel que `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals` : livraison d’approbation d’exécution native Slack et autorisation des approbateurs. Même schéma que Discord : `enabled` (`true`/`false`/`"auto"`), `approvers` (identifiants d’utilisateurs Slack), `agentFilter`, `sessionFilter` et `target` (`"dm"`, `"channel"` ou `"both"`).

| Groupe d’actions | Par défaut | Notes                       |
| ---------------- | ---------- | --------------------------- |
| reactions        | activé     | Réagir + lister les réactions |
| messages         | activé     | Lire/envoyer/modifier/supprimer |
| pins             | activé     | Épingler/désépingler/lister |
| memberInfo       | activé     | Infos du membre             |
| emojiList        | activé     | Liste d’emojis personnalisés |

### Mattermost

Mattermost est fourni comme Plugin intégré dans les versions actuelles d’OpenClaw. Les builds plus anciens ou
personnalisés peuvent installer un package npm actuel avec
`openclaw plugins install @openclaw/mattermost` ; si npm signale que le
package appartenant à OpenClaw est obsolète, utilisez le Plugin intégré ou un checkout local
jusqu’à la publication d’un package npm plus récent.

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

Modes de chat : `oncall` (répond à une @mention, par défaut), `onmessage` (chaque message), `onchar` (messages commençant par un préfixe déclencheur).

Lorsque les commandes natives Mattermost sont activées :

- `commands.callbackPath` doit être un chemin (par exemple `/api/channels/mattermost/command`), pas une URL complète.
- `commands.callbackUrl` doit résoudre vers le point de terminaison Gateway OpenClaw et être joignable depuis le serveur Mattermost.
- Les rappels slash natifs sont authentifiés avec les jetons par commande retournés
  par Mattermost lors de l’enregistrement des commandes slash. Si l’enregistrement échoue ou si aucune
  commande n’est activée, OpenClaw rejette les rappels avec
  `Unauthorized: invalid command token.`
- Pour les hôtes de rappel privés/tailnet/internes, Mattermost peut exiger que
  `ServiceSettings.AllowedUntrustedInternalConnections` inclue l’hôte/domaine de rappel.
  Utilisez des valeurs d’hôte/domaine, pas des URL complètes.
- `channels.mattermost.configWrites` : autorise ou refuse les écritures de configuration initiées par Mattermost.
- `channels.mattermost.requireMention` : exige `@mention` avant de répondre dans les canaux.
- `channels.mattermost.groups.<channelId>.requireMention` : remplacement de filtrage par mention propre au canal (`"*"` par défaut).
- `channels.mattermost.defaultAccount`, facultatif, remplace la sélection du compte par défaut lorsqu’il correspond à un identifiant de compte configuré.

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

**Modes de notification des réactions :** `off`, `own` (par défaut), `all`, `allowlist` (depuis `reactionAllowlist`).

- `channels.signal.account` : épingle le démarrage du canal à une identité de compte Signal spécifique.
- `channels.signal.configWrites` : autorise ou refuse les écritures de configuration initiées par Signal.
- Le paramètre facultatif `channels.signal.defaultAccount` remplace la sélection de compte par défaut lorsqu’il correspond à un ID de compte configuré.

### BlueBubbles

BlueBubbles est le chemin recommandé pour iMessage (adossé à un Plugin, configuré sous `channels.bluebubbles`).

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

- Chemins de clés principaux couverts ici : `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- Le paramètre facultatif `channels.bluebubbles.defaultAccount` remplace la sélection de compte par défaut lorsqu’il correspond à un ID de compte configuré.
- Les entrées de premier niveau `bindings[]` avec `type: "acp"` peuvent lier des conversations BlueBubbles à des sessions ACP persistantes. Utilisez un identifiant BlueBubbles ou une chaîne cible (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) dans `match.peer.id`. Sémantique des champs partagés : [Agents ACP](/fr/tools/acp-agents#channel-specific-settings).
- La configuration complète du canal BlueBubbles est documentée dans [BlueBubbles](/fr/channels/bluebubbles).

### iMessage

OpenClaw lance `imsg rpc` (JSON-RPC sur stdio). Aucun démon ni port n’est requis.

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

- Le paramètre facultatif `channels.imessage.defaultAccount` remplace la sélection de compte par défaut lorsqu’il correspond à un ID de compte configuré.

- Nécessite Full Disk Access à la base de données Messages.
- Préférez les cibles `chat_id:<id>`. Utilisez `imsg chats --limit 20` pour lister les discussions.
- `cliPath` peut pointer vers un wrapper SSH ; définissez `remoteHost` (`host` ou `user@host`) pour récupérer les pièces jointes par SCP.
- `attachmentRoots` et `remoteAttachmentRoots` limitent les chemins des pièces jointes entrantes (par défaut : `/Users/*/Library/Messages/Attachments`).
- SCP utilise une vérification stricte des clés d’hôte ; assurez-vous donc que la clé d’hôte du relais existe déjà dans `~/.ssh/known_hosts`.
- `channels.imessage.configWrites` : autorise ou refuse les écritures de configuration initiées par iMessage.
- Les entrées de premier niveau `bindings[]` avec `type: "acp"` peuvent lier des conversations iMessage à des sessions ACP persistantes. Utilisez un identifiant normalisé ou une cible de discussion explicite (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) dans `match.peer.id`. Sémantique des champs partagés : [Agents ACP](/fr/tools/acp-agents#channel-specific-settings).

<Accordion title="Exemple de wrapper SSH iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix est adossé à un Plugin et configuré sous `channels.matrix`.

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

- L’authentification par jeton utilise `accessToken` ; l’authentification par mot de passe utilise `userId` + `password`.
- `channels.matrix.proxy` achemine le trafic HTTP Matrix via un proxy HTTP(S) explicite. Les comptes nommés peuvent le remplacer avec `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` autorise les homeservers privés/internes. `proxy` et cette activation réseau sont des contrôles indépendants.
- `channels.matrix.defaultAccount` sélectionne le compte préféré dans les configurations multicomptes.
- `channels.matrix.autoJoin` vaut `off` par défaut ; les salons sur invitation et les nouvelles invitations de type DM sont donc ignorés jusqu’à ce que vous définissiez `autoJoin: "allowlist"` avec `autoJoinAllowlist` ou `autoJoin: "always"`.
- `channels.matrix.execApprovals` : livraison des approbations d’exécution natives Matrix et autorisation des approbateurs.
  - `enabled` : `true`, `false` ou `"auto"` (par défaut). En mode automatique, les approbations d’exécution s’activent lorsque les approbateurs peuvent être résolus depuis `approvers` ou `commands.ownerAllowFrom`.
  - `approvers` : ID utilisateur Matrix (par exemple `@owner:example.org`) autorisés à approuver les demandes d’exécution.
  - `agentFilter` : liste d’autorisation facultative d’ID d’agent. Omettez-la pour transférer les approbations pour tous les agents.
  - `sessionFilter` : modèles facultatifs de clés de session (sous-chaîne ou expression régulière).
  - `target` : destination des invites d’approbation. `"dm"` (par défaut), `"channel"` (salon d’origine) ou `"both"`.
  - Remplacements par compte : `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` contrôle la façon dont les DM Matrix se regroupent en sessions : `per-user` (par défaut) partage par pair routé, tandis que `per-room` isole chaque salon DM.
- Les sondes de statut Matrix et les recherches d’annuaire en direct utilisent la même politique de proxy que le trafic d’exécution.
- La configuration complète de Matrix, les règles de ciblage et les exemples de configuration sont documentés dans [Matrix](/fr/channels/matrix).

### Microsoft Teams

Microsoft Teams est adossé à un Plugin et configuré sous `channels.msteams`.

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

- Chemins de clés principaux couverts ici : `channels.msteams`, `channels.msteams.configWrites`.
- La configuration complète de Teams (identifiants, Webhook, politique DM/groupe, remplacements par équipe/par canal) est documentée dans [Microsoft Teams](/fr/channels/msteams).

### IRC

IRC est adossé à un Plugin et configuré sous `channels.irc`.

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

- Chemins de clés principaux couverts ici : `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- Le paramètre facultatif `channels.irc.defaultAccount` remplace la sélection de compte par défaut lorsqu’il correspond à un ID de compte configuré.
- La configuration complète du canal IRC (hôte/port/TLS/canaux/listes d’autorisation/contrôle par mention) est documentée dans [IRC](/fr/channels/irc).

### Multicompte (tous les canaux)

Exécutez plusieurs comptes par canal (chacun avec son propre `accountId`) :

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

- `default` est utilisé lorsque `accountId` est omis (CLI + routage).
- Les jetons d’environnement s’appliquent uniquement au compte **par défaut**.
- Les paramètres de canal de base s’appliquent à tous les comptes sauf s’ils sont remplacés par compte.
- Utilisez `bindings[].match.accountId` pour router chaque compte vers un agent différent.
- Si vous ajoutez un compte non par défaut via `openclaw channels add` (ou l’intégration du canal) tout en conservant une configuration de canal de premier niveau à compte unique, OpenClaw promeut d’abord les valeurs de compte unique de premier niveau à portée de compte dans la carte des comptes du canal afin que le compte d’origine continue de fonctionner. La plupart des canaux les déplacent dans `channels.<channel>.accounts.default` ; Matrix peut plutôt conserver une cible nommée/par défaut correspondante existante.
- Les liaisons existantes limitées au canal (sans `accountId`) continuent de correspondre au compte par défaut ; les liaisons à portée de compte restent facultatives.
- `openclaw doctor --fix` répare également les formes mixtes en déplaçant les valeurs de compte unique de premier niveau à portée de compte dans le compte promu choisi pour ce canal. La plupart des canaux utilisent `accounts.default` ; Matrix peut plutôt conserver une cible nommée/par défaut correspondante existante.

### Autres canaux de Plugin

De nombreux canaux de Plugin sont configurés comme `channels.<id>` et documentés dans leurs pages de canal dédiées (par exemple Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat et Twitch).
Voir l’index complet des canaux : [Canaux](/fr/channels).

### Contrôle des mentions dans les discussions de groupe

Les messages de groupe exigent par défaut une **mention obligatoire** (mention de métadonnées ou modèles regex sûrs). S’applique aux discussions de groupe WhatsApp, Telegram, Discord, Google Chat et iMessage.

Les réponses visibles sont contrôlées séparément. Les salons de groupe/canal utilisent par défaut `messages.groupChat.visibleReplies: "message_tool"` : OpenClaw traite toujours le tour, mais les réponses finales normales restent privées et la sortie visible dans le salon nécessite `message(action=send)`. Définissez `"automatic"` uniquement lorsque vous voulez le comportement hérité où les réponses normales sont republiées dans le salon. Pour appliquer le même comportement de réponse visible uniquement via outil aux discussions directes aussi, définissez `messages.visibleReplies: "message_tool"`.

**Types de mentions :**

- **Mentions de métadonnées** : @-mentions natives de la plateforme. Ignorées en mode auto-discussion WhatsApp.
- **Modèles de texte** : modèles regex sûrs dans `agents.list[].groupChat.mentionPatterns`. Les modèles invalides et les répétitions imbriquées non sûres sont ignorés.
- Le contrôle par mention n’est appliqué que lorsque la détection est possible (mentions natives ou au moins un modèle).

```json5
{
  messages: {
    visibleReplies: "automatic", // global default for direct/source chats
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

`messages.groupChat.historyLimit` définit la valeur globale par défaut. Les canaux peuvent la remplacer avec `channels.<channel>.historyLimit` (ou par compte). Définissez `0` pour désactiver.

`messages.visibleReplies` est la valeur globale par défaut pour les tours de source ; `messages.groupChat.visibleReplies` la remplace pour les tours de source de groupe/canal. Les listes d’autorisation de canal et le contrôle par mention décident toujours si un tour est traité.

#### Limites d’historique des DM

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

Résolution : remplacement par DM → valeur par défaut du fournisseur → aucune limite (tout est conservé).

Pris en charge : `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Mode auto-discussion

Incluez votre propre numéro dans `allowFrom` pour activer le mode auto-discussion (ignore les @-mentions natives, répond uniquement aux modèles de texte) :

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

### Commandes (gestion des commandes de discussion)

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

<Accordion title="Command details">

- Ce bloc configure les surfaces de commandes. Pour le catalogue actuel des commandes intégrées et groupées, consultez [Commandes slash](/fr/tools/slash-commands).
- Cette page est une **référence des clés de configuration**, et non le catalogue complet des commandes. Les commandes propres aux canaux/plugins, telles que QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, l’appairage d’appareil `/pair`, la mémoire `/dreaming`, le contrôle du téléphone `/phone` et Talk `/voice`, sont documentées dans leurs pages de canal/plugin ainsi que dans [Commandes slash](/fr/tools/slash-commands).
- Les commandes textuelles doivent être des messages **autonomes** commençant par `/`.
- `native: "auto"` active les commandes natives pour Discord/Telegram et les laisse désactivées pour Slack.
- `nativeSkills: "auto"` active les commandes de Skills natives pour Discord/Telegram et les laisse désactivées pour Slack.
- Remplacer par canal : `channels.discord.commands.native` (booléen ou `"auto"`). `false` efface les commandes précédemment enregistrées.
- Remplacer l’enregistrement des Skills natives par canal avec `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` ajoute des entrées supplémentaires au menu du bot Telegram.
- `bash: true` active `! <cmd>` pour le shell de l’hôte. Nécessite `tools.elevated.enabled` et un expéditeur dans `tools.elevated.allowFrom.<channel>`.
- `config: true` active `/config` (lit/écrit `openclaw.json`). Pour les clients Gateway `chat.send`, les écritures persistantes `/config set|unset` nécessitent également `operator.admin`; `/config show`, en lecture seule, reste disponible pour les clients opérateurs normaux avec périmètre d’écriture.
- `mcp: true` active `/mcp` pour la configuration des serveurs MCP gérés par OpenClaw sous `mcp.servers`.
- `plugins: true` active `/plugins` pour la découverte de plugins, l’installation et les contrôles d’activation/désactivation.
- `channels.<provider>.configWrites` contrôle les mutations de configuration par canal (par défaut : true).
- Pour les canaux multi-comptes, `channels.<provider>.accounts.<id>.configWrites` contrôle aussi les écritures ciblant ce compte (par exemple `/allowlist --config --account <id>` ou `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` désactive `/restart` et les actions de l’outil de redémarrage du Gateway. Par défaut : `true`.
- `ownerAllowFrom` est la liste d’autorisation explicite du propriétaire pour les commandes/outils réservés au propriétaire. Elle est séparée de `allowFrom`.
- `ownerDisplay: "hash"` hache les identifiants de propriétaire dans le prompt système. Définissez `ownerDisplaySecret` pour contrôler le hachage.
- `allowFrom` est défini par fournisseur. Lorsqu’il est défini, c’est la **seule** source d’autorisation (les listes d’autorisation/l’appairage de canal et `useAccessGroups` sont ignorés).
- `useAccessGroups: false` permet aux commandes de contourner les politiques de groupes d’accès lorsque `allowFrom` n’est pas défini.
- Carte de la documentation des commandes :
  - catalogue intégré et groupé : [Commandes slash](/fr/tools/slash-commands)
  - surfaces de commandes propres aux canaux : [Canaux](/fr/channels)
  - commandes QQ Bot : [QQ Bot](/fr/channels/qqbot)
  - commandes d’appairage : [Appairage](/fr/channels/pairing)
  - commande de carte LINE : [LINE](/fr/channels/line)
  - Dreaming de mémoire : [Dreaming](/fr/concepts/dreaming)

</Accordion>

---

## Connexe

- [Référence de configuration](/fr/gateway/configuration-reference) — clés de premier niveau
- [Configuration — agents](/fr/gateway/config-agents)
- [Vue d’ensemble des canaux](/fr/channels)
