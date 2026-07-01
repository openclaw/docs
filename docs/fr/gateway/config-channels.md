---
read_when:
    - Configurer un Plugin de canal (authentification, contrôle d’accès, multicompte)
    - Dépannage des clés de configuration par canal
    - Audit de la politique des DM, de la politique de groupe ou du filtrage des mentions
summary: 'Configuration des canaux : contrôle d’accès, appairage, clés par canal dans Slack, Discord, Telegram, WhatsApp, Matrix, iMessage, et plus encore'
title: Configuration — canaux
x-i18n:
    generated_at: "2026-07-01T13:00:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ba84406a296db7a37ce44381b5a1ebccd7f4d3c32375b116f6da3da5def9340b
    source_path: gateway/config-channels.md
    workflow: 16
---

Clés de configuration par canal sous `channels.*`. Couvre l’accès aux DM et aux groupes,
les configurations multi-comptes, le filtrage par mention, et les clés par canal pour Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage et les autres plugins de canal groupés.

Pour les agents, les outils, l’exécution du Gateway et les autres clés de premier niveau, consultez la
[référence de configuration](/fr/gateway/configuration-reference).

## Canaux

Chaque canal démarre automatiquement lorsque sa section de configuration existe (sauf si `enabled: false`).

### Accès aux DM et aux groupes

Tous les canaux prennent en charge les politiques de DM et les politiques de groupe :

| Politique de DM       | Comportement                                                    |
| --------------------- | --------------------------------------------------------------- |
| `pairing` (par défaut) | Les expéditeurs inconnus reçoivent un code d’appairage à usage unique ; le propriétaire doit approuver |
| `allowlist`           | Seuls les expéditeurs dans `allowFrom` (ou le stockage d’autorisation appairé) |
| `open`                | Autorise tous les DM entrants (nécessite `allowFrom: ["*"]`)    |
| `disabled`            | Ignore tous les DM entrants                                     |

| Politique de groupe      | Comportement                                             |
| ------------------------ | -------------------------------------------------------- |
| `allowlist` (par défaut) | Uniquement les groupes correspondant à la liste d’autorisation configurée |
| `open`                   | Contourne les listes d’autorisation de groupes (le filtrage par mention s’applique toujours) |
| `disabled`               | Bloque tous les messages de groupe/salon                 |

<Note>
`channels.defaults.groupPolicy` définit la valeur par défaut lorsque le `groupPolicy` d’un fournisseur n’est pas défini.
Les codes d’appairage expirent après 1 heure. Les demandes d’appairage DM en attente sont limitées à **3 par canal**.
Si un bloc fournisseur est entièrement absent (`channels.<provider>` absent), la politique de groupe à l’exécution revient à `allowlist` (échec fermé) avec un avertissement au démarrage.
</Note>

### Remplacements de modèle par canal

Utilisez `channels.modelByChannel` pour associer des ID de canal spécifiques ou des pairs de message direct à un modèle. Les valeurs acceptent `provider/model` ou des alias de modèle configurés. Le mappage du canal s’applique lorsqu’une session n’a pas déjà de remplacement de modèle (par exemple, défini via `/model`).

Pour les conversations de groupe/fil, les clés sont des ID de groupe propres au canal, des ID de sujet ou des noms de canal. Pour les conversations en message direct (DM), les clés sont des identifiants de pair dérivés de l’identité de l’expéditeur du canal (`nativeDirectUserId`, `origin.from`, `origin.to`, `OriginatingTo`, `From` ou `SenderId`). La forme exacte de la clé dépend du canal :

| Canal    | Forme de clé DM     | Exemple                                      |
| -------- | ------------------- | -------------------------------------------- |
| Slack    | `user:U...`         | `user:U12345`                                |
| Telegram | ID utilisateur brut | `123456789`                                  |
| Discord  | ID utilisateur brut | `987654321`                                  |
| WhatsApp | numéro de téléphone ou JID | `15551234567`                         |
| Matrix   | ID utilisateur Matrix | `@user:matrix.org`                         |
| Feishu   | `feishu:ou_...`     | `feishu:ou_a8b6cab7e945387de5f253775d9b4d85` |

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

Les clés propres aux DM ne correspondent que dans les conversations en message direct ; elles n’affectent pas le routage de groupe/fil.

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
- `channels.defaults.contextVisibility` : mode de visibilité du contexte supplémentaire par défaut pour tous les canaux. Valeurs : `all` (par défaut, inclut tout le contexte cité/fil/historique), `allowlist` (inclut uniquement le contexte des expéditeurs autorisés), `allowlist_quote` (identique à allowlist, mais conserve le contexte explicite de citation/réponse). Remplacement par canal : `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk` : inclut les statuts de canal sains dans la sortie Heartbeat.
- `channels.defaults.heartbeat.showAlerts` : inclut les statuts dégradés/erreur dans la sortie Heartbeat.
- `channels.defaults.heartbeat.useIndicator` : affiche une sortie Heartbeat compacte de type indicateur.

### WhatsApp

WhatsApp s’exécute via le canal web du Gateway (Baileys Web). Il démarre automatiquement lorsqu’une session liée existe.

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

- Les entrées `bindings[]` de premier niveau avec `type: "acp"` configurent des liaisons ACP persistantes pour les DM et les groupes WhatsApp. Utilisez un numéro direct E.164 ou un JID de groupe WhatsApp dans `match.peer.id`. La sémantique des champs est partagée dans [Agents ACP](/fr/tools/acp-agents#persistent-channel-bindings).

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

- Les commandes sortantes utilisent par défaut le compte `default` s’il est présent ; sinon, le premier ID de compte configuré (trié).
- Le paramètre facultatif `channels.whatsapp.defaultAccount` remplace cette sélection de compte par défaut de repli lorsqu’il correspond à un ID de compte configuré.
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

- Jeton de bot : `channels.telegram.botToken` ou `channels.telegram.tokenFile` (fichier normal uniquement ; les liens symboliques sont rejetés), avec `TELEGRAM_BOT_TOKEN` comme repli pour le compte par défaut.
- `apiRoot` est uniquement la racine de l’API Bot Telegram. Utilisez `https://api.telegram.org` ou votre racine auto-hébergée/proxy, pas `https://api.telegram.org/bot<TOKEN>` ; `openclaw doctor --fix` supprime un suffixe final `/bot<TOKEN>` accidentel.
- Le paramètre facultatif `channels.telegram.defaultAccount` remplace la sélection de compte par défaut lorsqu’il correspond à un ID de compte configuré.
- Dans les configurations multi-comptes (2+ ID de compte), définissez une valeur par défaut explicite (`channels.telegram.defaultAccount` ou `channels.telegram.accounts.default`) afin d’éviter un routage de repli ; `openclaw doctor` avertit lorsqu’elle est absente ou invalide.
- `configWrites: false` bloque les écritures de configuration initiées par Telegram (migrations d’ID de supergroupe, `/config set|unset`).
- Les entrées `bindings[]` de premier niveau avec `type: "acp"` configurent des liaisons ACP persistantes pour les sujets de forum (utilisez le `chatId:topic:topicId` canonique dans `match.peer.id`). La sémantique des champs est partagée dans [Agents ACP](/fr/tools/acp-agents#persistent-channel-bindings).
- Les aperçus de flux Telegram utilisent `sendMessage` + `editMessageText` (fonctionne dans les discussions directes et de groupe).
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

- Jeton : `channels.discord.token`, avec `DISCORD_BOT_TOKEN` comme solution de repli pour le compte par défaut.
- Les appels sortants directs qui fournissent un `token` Discord explicite utilisent ce jeton pour l’appel ; les paramètres de nouvelle tentative et de stratégie du compte proviennent toujours du compte sélectionné dans l’instantané d’exécution actif.
- L’option facultative `channels.discord.defaultAccount` remplace la sélection du compte par défaut lorsqu’elle correspond à un ID de compte configuré.
- Utilisez `user:<id>` (DM) ou `channel:<id>` (salon de serveur) pour les cibles de livraison ; les ID numériques seuls sont rejetés.
- Les slugs de serveurs sont en minuscules, avec les espaces remplacés par `-` ; les clés de salon utilisent le nom slugifié (sans `#`). Préférez les ID de serveur.
- Les messages rédigés par des bots sont ignorés par défaut. `allowBots: true` les active ; utilisez `allowBots: "mentions"` pour n’accepter que les messages de bots qui mentionnent le bot (les propres messages restent filtrés).
- Les canaux qui prennent en charge les messages entrants rédigés par des bots peuvent utiliser la [protection contre les boucles de bots](/fr/channels/bot-loop-protection) partagée. Définissez `channels.defaults.botLoopProtection` pour les budgets de paires de référence, puis remplacez le canal ou le compte uniquement lorsqu’une surface nécessite des limites différentes.
- `channels.discord.guilds.<id>.ignoreOtherMentions` (et les remplacements au niveau des salons) ignore les messages qui mentionnent un autre utilisateur ou rôle, mais pas le bot (à l’exception de @everyone/@here).
- `channels.discord.mentionAliases` associe un texte `@handle` sortant stable à des ID d’utilisateurs Discord avant l’envoi, afin que les coéquipiers connus puissent être mentionnés de façon déterministe même lorsque le cache de répertoire transitoire est vide. Les remplacements par compte se trouvent sous `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (17 par défaut) découpe les messages hauts même lorsqu’ils font moins de 2000 caractères.
- `channels.discord.suppressEmbeds` vaut `true` par défaut, afin que les URL sortantes ne se développent pas en aperçus de liens Discord sauf si cette option est désactivée. Les charges utiles `embeds` explicites sont toujours envoyées normalement ; les appels d’outils par message peuvent remplacer ce comportement avec `suppressEmbeds`.
- `channels.discord.threadBindings` contrôle le routage Discord lié aux fils :
  - `enabled` : remplacement Discord pour les fonctionnalités de session liées aux fils (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, et livraison/routage liés)
  - `idleHours` : remplacement Discord pour la défocalisation automatique après inactivité, en heures (`0` désactive)
  - `maxAgeHours` : remplacement Discord pour l’âge maximal strict, en heures (`0` désactive)
  - `spawnSessions` : interrupteur pour `sessions_spawn({ thread: true })` et la création/liaison automatique de fils pour ACP thread-spawn (par défaut : `true`)
  - `defaultSpawnContext` : contexte de sous-agent natif pour les lancements liés à un fil (`"fork"` par défaut)
- Les entrées `bindings[]` de premier niveau avec `type: "acp"` configurent des liaisons ACP persistantes pour les canaux et les fils (utilisez l’ID de canal/fil dans `match.peer.id`). La sémantique des champs est partagée dans [Agents ACP](/fr/tools/acp-agents#persistent-channel-bindings).
- `channels.discord.ui.components.accentColor` définit la couleur d’accentuation des conteneurs de composants Discord v2.
- `channels.discord.agentComponents.ttlMs` contrôle la durée pendant laquelle les callbacks de composants Discord envoyés restent enregistrés. La valeur par défaut est `1800000` (30 minutes), le maximum est `86400000` (24 heures), et les remplacements par compte se trouvent sous `channels.discord.accounts.<accountId>.agentComponents.ttlMs`. Des valeurs plus longues gardent les anciens boutons/sélecteurs/formulaires utilisables plus longtemps ; préférez donc le TTL le plus court adapté au flux de travail.
- `channels.discord.voice` active les conversations dans les canaux vocaux Discord ainsi que les remplacements facultatifs auto-join + LLM + TTS. Les configurations Discord uniquement textuelles laissent la voix désactivée par défaut ; définissez `channels.discord.voice.enabled=true` pour l’activer.
- `channels.discord.voice.model` remplace facultativement le modèle LLM utilisé pour les réponses dans les canaux vocaux Discord.
- `channels.discord.voice.daveEncryption` et `channels.discord.voice.decryptionFailureTolerance` sont transmis aux options DAVE de `@discordjs/voice` (`true` et `24` par défaut).
- `channels.discord.voice.connectTimeoutMs` contrôle l’attente initiale Ready de `@discordjs/voice` pour `/vc join` et les tentatives d’auto-join (`30000` par défaut).
- `channels.discord.voice.reconnectGraceMs` contrôle le délai dont dispose une session vocale déconnectée pour entrer en signalisation de reconnexion avant qu’OpenClaw ne la détruise (`15000` par défaut).
- La lecture vocale Discord n’est pas interrompue par l’événement de début de parole d’un autre utilisateur. Pour éviter les boucles de retour audio, OpenClaw ignore les nouvelles captures vocales pendant la lecture TTS.
- OpenClaw tente également de récupérer la réception vocale en quittant puis rejoignant une session vocale après des échecs de déchiffrement répétés.
- `channels.discord.streaming` est la clé canonique du mode de flux. Discord utilise par défaut `streaming.mode: "progress"` afin que la progression des outils/du travail apparaisse dans un seul message d’aperçu modifié ; définissez `streaming.mode: "off"` pour le désactiver. Les anciennes valeurs `streamMode` et les valeurs booléennes `streaming` restent des alias d’exécution ; exécutez `openclaw doctor --fix` pour réécrire la configuration persistée.
- `channels.discord.autoPresence` associe la disponibilité d’exécution à la présence du bot (healthy => online, degraded => idle, exhausted => dnd) et permet des remplacements facultatifs du texte de statut.
- `channels.discord.dangerouslyAllowNameMatching` réactive la correspondance mutable par nom/tag (mode de compatibilité d’urgence).
- `channels.discord.execApprovals` : livraison d’approbations exec native Discord et autorisation des approbateurs.
  - `enabled` : `true`, `false` ou `"auto"` (par défaut). En mode auto, les approbations exec s’activent lorsque les approbateurs peuvent être résolus depuis `approvers` ou `commands.ownerAllowFrom`.
  - `approvers` : ID d’utilisateurs Discord autorisés à approuver les demandes exec. Se rabat sur `commands.ownerAllowFrom` en cas d’omission.
  - `agentFilter` : liste d’autorisation facultative d’ID d’agents. Omettez-la pour transférer les approbations de tous les agents.
  - `sessionFilter` : motifs facultatifs de clés de session (sous-chaîne ou expression régulière).
  - `target` : où envoyer les demandes d’approbation. `"dm"` (par défaut) les envoie aux DM des approbateurs, `"channel"` les envoie au canal d’origine, `"both"` les envoie aux deux. Lorsque la cible inclut `"channel"`, les boutons ne sont utilisables que par les approbateurs résolus.
  - `cleanupAfterResolve` : lorsque `true`, supprime les DM d’approbation après approbation, refus ou expiration.

**Modes de notification de réaction :** `off` (aucune), `own` (messages du bot, par défaut), `all` (tous les messages), `allowlist` (depuis `guilds.<id>.users` sur tous les messages).

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
- `channels.googlechat.dangerouslyAllowNameMatching` réactive la correspondance mutable par principal d’e-mail (mode de compatibilité d’urgence).

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

- Le **mode socket** nécessite à la fois `botToken` et `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` pour le repli env du compte par défaut).
- Le **mode HTTP** nécessite `botToken` plus `signingSecret` (à la racine ou par compte).
- `socketMode` transmet le réglage du transport Socket Mode du SDK Slack à l’API publique du récepteur Bolt. Utilisez-le uniquement lorsque vous investiguez des délais d’expiration ping/pong ou un comportement de websocket obsolète. `clientPingTimeout` vaut `15000` par défaut ; `serverPingTimeout` et `pingPongLoggingEnabled` ne sont transmis que s’ils sont configurés.
- `botToken`, `appToken`, `signingSecret` et `userToken` acceptent des chaînes en texte brut
  ou des objets SecretRef.
- Les instantanés de compte Slack exposent des champs source/statut par identifiant, comme
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` et, en mode HTTP,
  `signingSecretStatus`. `configured_unavailable` signifie que le compte est
  configuré via SecretRef mais que le chemin de commande/runtime actuel n’a pas pu
  résoudre la valeur du secret.
- `configWrites: false` bloque les écritures de configuration initiées par Slack.
- `channels.slack.defaultAccount` optionnel remplace la sélection du compte par défaut lorsqu’il correspond à un identifiant de compte configuré.
- `channels.slack.streaming.mode` est la clé canonique du mode de flux Slack. `channels.slack.streaming.nativeTransport` contrôle le transport de streaming natif de Slack. Les valeurs héritées `streamMode`, le booléen `streaming` et `nativeStreaming` restent des alias runtime ; exécutez `openclaw doctor --fix` pour réécrire la configuration persistée.
- `unfurlLinks` et `unfurlMedia` transmettent les booléens de déroulement des liens et médias `chat.postMessage` de Slack pour les réponses du bot. `unfurlLinks` vaut `false` par défaut afin que les liens sortants du bot ne se développent pas en ligne sauf activation ; `unfurlMedia` est omis sauf s’il est configuré. Définissez l’une ou l’autre valeur dans `channels.slack.accounts.<accountId>` pour remplacer la valeur de premier niveau pour un compte.
- Utilisez `user:<id>` (DM) ou `channel:<id>` pour les cibles de livraison.

**Modes de notification de réaction :** `off`, `own` (par défaut), `all`, `allowlist` (depuis `reactionAllowlist`).

**Isolation des sessions de fil :** `thread.historyScope` est par fil (par défaut) ou partagé dans tout le canal. `thread.inheritParent` copie la transcription du canal parent vers les nouveaux fils.

- Le streaming natif Slack et le statut de fil de type assistant Slack « is typing... » nécessitent une cible de fil de réponse. Les DM de premier niveau restent hors fil par défaut, ils peuvent donc toujours diffuser via les aperçus Slack de publication brouillon puis édition au lieu d’afficher l’aperçu de flux/statut natif de style fil.
- `typingReaction` ajoute une réaction temporaire au message Slack entrant pendant qu’une réponse est en cours, puis la supprime à la fin. Utilisez un shortcode d’emoji Slack comme `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals` : livraison client d’approbation native Slack et autorisation des approbateurs exec. Même schéma que Discord : `enabled` (`true`/`false`/`"auto"`), `approvers` (identifiants d’utilisateur Slack), `agentFilter`, `sessionFilter` et `target` (`"dm"`, `"channel"` ou `"both"`). Les approbations Plugin peuvent utiliser ce chemin de client natif pour les requêtes d’origine Slack lorsque les approbateurs du Plugin Slack sont résolus ; la livraison d’approbation Plugin native Slack peut aussi être activée via `approvals.plugin` pour les sessions d’origine Slack ou les cibles Slack. Les approbations Plugin utilisent les approbateurs du Plugin Slack depuis `allowFrom` et le routage par défaut, pas les approbateurs exec.

| Groupe d’actions | Par défaut | Notes                  |
| ------------ | ------- | ---------------------- |
| reactions    | enabled | Réagir + lister les réactions |
| messages     | enabled | Lire/envoyer/modifier/supprimer  |
| pins         | enabled | Épingler/désépingler/lister         |
| memberInfo   | enabled | Informations sur le membre            |
| emojiList    | enabled | Liste d’emojis personnalisés      |

### Mattermost

Mattermost est fourni comme Plugin intégré dans les versions actuelles d’OpenClaw. Les builds plus anciens ou
personnalisés peuvent installer un paquet npm actuel avec
`openclaw plugins install @openclaw/mattermost`. Consultez
[npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost)
pour les dist-tags actuels avant d’épingler une version.

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

Modes de chat : `oncall` (répondre sur @-mention, par défaut), `onmessage` (chaque message), `onchar` (messages commençant par un préfixe déclencheur).

Lorsque les commandes natives Mattermost sont activées :

- `commands.callbackPath` doit être un chemin (par exemple `/api/channels/mattermost/command`), pas une URL complète.
- `commands.callbackUrl` doit résoudre vers le point de terminaison Gateway d’OpenClaw et être joignable depuis le serveur Mattermost.
- Les callbacks slash natifs sont authentifiés avec les jetons par commande renvoyés
  par Mattermost lors de l’enregistrement des commandes slash. Si l’enregistrement échoue ou si aucune
  commande n’est activée, OpenClaw rejette les callbacks avec
  `Unauthorized: invalid command token.`
- Pour les hôtes de callback privés/tailnet/internes, Mattermost peut nécessiter
  que `ServiceSettings.AllowedUntrustedInternalConnections` inclue l’hôte/domaine de callback.
  Utilisez des valeurs d’hôte/domaine, pas des URL complètes.
- `channels.mattermost.configWrites` : autoriser ou refuser les écritures de configuration initiées par Mattermost.
- `channels.mattermost.requireMention` : exiger `@mention` avant de répondre dans les canaux.
- `channels.mattermost.groups.<channelId>.requireMention` : remplacement du filtrage par mention par canal (`"*"` pour la valeur par défaut).
- `channels.mattermost.defaultAccount` optionnel remplace la sélection du compte par défaut lorsqu’il correspond à un identifiant de compte configuré.

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

**Modes de notification de réaction :** `off`, `own` (par défaut), `all`, `allowlist` (depuis `reactionAllowlist`).

- `channels.signal.account` : épingler le démarrage du canal à une identité de compte Signal spécifique.
- `channels.signal.configWrites` : autoriser ou refuser les écritures de configuration initiées par Signal.
- `channels.signal.defaultAccount` optionnel remplace la sélection du compte par défaut lorsqu’il correspond à un identifiant de compte configuré.

### iMessage

OpenClaw lance `imsg rpc` (JSON-RPC sur stdio). Aucun démon ni port requis. C’est le chemin recommandé pour les nouvelles configurations iMessage OpenClaw lorsque l’hôte peut accorder les permissions de base de données Messages et d’Automatisation.

La prise en charge de BlueBubbles a été supprimée. `channels.bluebubbles` n’est pas une surface de configuration runtime prise en charge dans OpenClaw actuel. Migrez les anciennes configurations vers `channels.imessage` ; utilisez [Suppression de BlueBubbles et chemin iMessage imsg](/fr/announcements/bluebubbles-imessage) pour la version courte et [Venir de BlueBubbles](/fr/channels/imessage-from-bluebubbles) pour la table de traduction complète.

Si le Gateway ne s’exécute pas sur le Mac Messages connecté, gardez `channels.imessage.enabled=true` et définissez `channels.imessage.cliPath` sur un wrapper SSH qui exécute `imsg "$@"` sur ce Mac. Le chemin local par défaut `imsg` est réservé à macOS.

Avant de vous appuyer sur un wrapper SSH pour les envois en production, vérifiez un `imsg send` sortant via ce wrapper exact. Certains états TCC de macOS attribuent l’Automatisation Messages à `/usr/libexec/sshd-keygen-wrapper`, ce qui peut permettre aux lectures et aux sondes de fonctionner tandis que les envois échouent avec AppleEvents `-1743` ; consultez [Les envois du wrapper SSH échouent avec AppleEvents -1743](/fr/channels/imessage#ssh-wrapper-sends-fail-with-appleevents-1743).

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

- `channels.imessage.defaultAccount` optionnel remplace la sélection du compte par défaut lorsqu’il correspond à un identifiant de compte configuré.

- Nécessite l’Accès complet au disque pour la base de données Messages.
- Préférez les cibles `chat_id:<id>`. Utilisez `imsg chats --limit 20` pour lister les chats.
- `cliPath` peut pointer vers un wrapper SSH ; définissez `remoteHost` (`host` ou `user@host`) pour la récupération des pièces jointes via SCP.
- `attachmentRoots` et `remoteAttachmentRoots` restreignent les chemins de pièces jointes entrantes (par défaut : `/Users/*/Library/Messages/Attachments`).
- SCP utilise une vérification stricte des clés d’hôte ; assurez-vous donc que la clé de l’hôte relais existe déjà dans `~/.ssh/known_hosts`.
- `channels.imessage.configWrites` : autoriser ou refuser les écritures de configuration initiées par iMessage.
- `channels.imessage.sendTransport` : transport d’envoi RPC `imsg` préféré pour les réponses sortantes normales. `auto` (par défaut) utilise le pont IMCore pour les chats existants lorsqu’il est en cours d’exécution, puis se replie sur AppleScript ; `bridge` nécessite une livraison par API privée ; `applescript` force le chemin d’automatisation public de Messages.
- `channels.imessage.actions.*` : activer les actions d’API privée qui sont aussi contrôlées par `imsg status` / `openclaw channels status --probe`.
- `channels.imessage.includeAttachments` est désactivé par défaut ; définissez-le sur `true` avant d’attendre des médias entrants dans les tours d’agent.
- La récupération entrante après un redémarrage du pont/Gateway est automatique (déduplication GUID plus barrière d’âge pour backlog obsolète). Les configurations existantes `channels.imessage.catchup.enabled: true` sont toujours honorées comme profil de compatibilité déprécié.
- `channels.imessage.groups` : registre de groupes et paramètres par groupe. Avec `groupPolicy: "allowlist"`, configurez soit des clés `chat_id` explicites, soit une entrée générique `"*"` afin que les messages de groupe puissent franchir le contrôle du registre.
- Les entrées de premier niveau `bindings[]` avec `type: "acp"` peuvent lier des conversations iMessage à des sessions ACP persistantes. Utilisez un identifiant normalisé ou une cible de chat explicite (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) dans `match.peer.id`. Sémantique des champs partagés : [Agents ACP](/fr/tools/acp-agents#persistent-channel-bindings).

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
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` autorise les homeservers privés/internes. `proxy` et cette option réseau explicite sont des contrôles indépendants.
- `channels.matrix.defaultAccount` sélectionne le compte préféré dans les configurations multicomptes.
- `channels.matrix.autoJoin` vaut `off` par défaut, donc les salons sur invitation et les nouvelles invitations de type DM sont ignorés jusqu’à ce que vous définissiez `autoJoin: "allowlist"` avec `autoJoinAllowlist` ou `autoJoin: "always"`.
- `channels.matrix.execApprovals` : livraison des approbations d’exécution natives Matrix et autorisation des approbateurs.
  - `enabled` : `true`, `false` ou `"auto"` (par défaut). En mode auto, les approbations d’exécution s’activent lorsque les approbateurs peuvent être résolus depuis `approvers` ou `commands.ownerAllowFrom`.
  - `approvers` : identifiants utilisateur Matrix (par ex. `@owner:example.org`) autorisés à approuver les demandes d’exécution.
  - `agentFilter` : liste d’autorisation optionnelle d’identifiants d’agent. Omettez-la pour transmettre les approbations à tous les agents.
  - `sessionFilter` : motifs optionnels de clés de session (sous-chaîne ou regex).
  - `target` : destination des invites d’approbation. `"dm"` (par défaut), `"channel"` (salon d’origine) ou `"both"`.
  - Remplacements par compte : `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` contrôle la manière dont les DM Matrix sont regroupés en sessions : `per-user` (par défaut) partage par pair acheminé, tandis que `per-room` isole chaque salon DM.
- Les sondes d’état Matrix et les recherches d’annuaire en direct utilisent la même politique de proxy que le trafic d’exécution.
- La configuration Matrix complète, les règles de ciblage et les exemples de configuration sont documentés dans [Matrix](/fr/channels/matrix).

### Microsoft Teams

Microsoft Teams repose sur un Plugin et se configure sous `channels.msteams`.

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
- La configuration Teams complète (identifiants, webhook, politique de DM/groupe, remplacements par équipe/par canal) est documentée dans [Microsoft Teams](/fr/channels/msteams).

### IRC

IRC repose sur un Plugin et se configure sous `channels.irc`.

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
- `channels.irc.defaultAccount` optionnel remplace la sélection de compte par défaut lorsqu’il correspond à un identifiant de compte configuré.
- La configuration complète du canal IRC (hôte/port/TLS/canaux/listes d’autorisation/filtrage par mention) est documentée dans [IRC](/fr/channels/irc).

### Multicomptes (tous les canaux)

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
- Les jetons d’environnement ne s’appliquent qu’au compte **default**.
- Les paramètres de canal de base s’appliquent à tous les comptes sauf remplacement par compte.
- Utilisez `bindings[].match.accountId` pour acheminer chaque compte vers un agent différent.
- Si vous ajoutez un compte non par défaut via `openclaw channels add` (ou l’intégration du canal) tout en restant sur une configuration de canal de premier niveau à compte unique, OpenClaw promeut d’abord les valeurs de premier niveau à compte unique propres au compte dans la carte des comptes du canal afin que le compte d’origine continue de fonctionner. La plupart des canaux les déplacent vers `channels.<channel>.accounts.default` ; Matrix peut à la place conserver une cible nommée/par défaut correspondante existante.
- Les liaisons existantes limitées au canal (sans `accountId`) continuent de correspondre au compte par défaut ; les liaisons propres au compte restent optionnelles.
- `openclaw doctor --fix` répare aussi les formes mixtes en déplaçant les valeurs de premier niveau à compte unique propres au compte vers le compte promu choisi pour ce canal. La plupart des canaux utilisent `accounts.default` ; Matrix peut à la place conserver une cible nommée/par défaut correspondante existante.

### Autres canaux de Plugin

De nombreux canaux de Plugin sont configurés comme `channels.<id>` et documentés dans leurs pages de canal dédiées (par exemple Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat et Twitch).
Consultez l’index complet des canaux : [Canaux](/fr/channels).

### Filtrage des mentions dans les discussions de groupe

Les messages de groupe exigent par défaut une **mention obligatoire** (mention de métadonnées ou motifs regex sûrs). S’applique aux discussions de groupe WhatsApp, Telegram, Discord, Google Chat et iMessage.

Les réponses visibles sont contrôlées séparément. Les requêtes directes normales de groupe, de canal et WebChat internes utilisent par défaut la livraison finale automatique : le texte final de l’assistant est publié via l’ancien chemin de réponse visible. Activez `messages.visibleReplies: "message_tool"` ou `messages.groupChat.visibleReplies: "message_tool"` lorsque la sortie visible ne doit être publiée qu’après l’appel par l’agent à `message(action=send)`. Si le modèle renvoie un texte final sans appeler l’outil de message dans un mode outil uniquement activé, ce texte final reste privé et le journal détaillé du Gateway enregistre les métadonnées de charge utile supprimées.

Les réponses visibles outil uniquement nécessitent un modèle/runtime qui appelle les outils de manière fiable, et sont recommandées pour les salons ambiants partagés sur les modèles de dernière génération comme GPT 5.5. Certains modèles plus faibles peuvent répondre par texte final mais ne pas comprendre que la sortie visible par la source doit être envoyée avec `message(action=send)`. Pour ces modèles, utilisez `"automatic"` afin que le tour final de l’assistant soit le chemin de réponse visible. Si le journal de session affiche du texte d’assistant avec `didSendViaMessagingTool: false`, le modèle a produit du texte final privé au lieu d’appeler l’outil de message. Passez à un modèle plus fort en appel d’outils pour ce canal, inspectez le journal détaillé du Gateway pour le résumé de la charge utile supprimée, ou définissez `messages.groupChat.visibleReplies: "automatic"` pour utiliser les réponses finales visibles pour chaque requête de groupe/canal.

Si l’outil de message est indisponible sous la politique d’outils active, OpenClaw revient aux réponses visibles automatiques au lieu de supprimer silencieusement la réponse. `openclaw doctor` avertit de cette incompatibilité.

Cette règle s’applique au texte final normal de l’agent. Les liaisons de conversation détenues par un Plugin utilisent la réponse renvoyée par le Plugin propriétaire comme réponse visible pour les tours de thread lié revendiqués ; le Plugin n’a pas besoin d’appeler `message(action=send)` pour ces réponses de liaison.

**Dépannage : une @mention de groupe déclenche la saisie puis le silence (aucune erreur)**

Symptôme : une @mention de groupe/canal affiche l’indicateur de saisie et le journal du Gateway indique `dispatch complete (queuedFinal=false, replies=0)`, mais aucun message n’arrive dans le salon. Les DM au même agent répondent normalement.

Cause : le mode de réponse visible de groupe/canal se résout en `"message_tool"`, donc OpenClaw exécute le tour mais supprime le texte final de l’assistant sauf si l’agent appelle `message(action=send)`. Il n’existe pas de contrat `NO_REPLY` dans ce mode ; pas d’appel à l’outil de message signifie pas de réponse à la source. Il n’y a pas d’erreur, car la suppression est le comportement configuré. Les tours normaux de groupe et de canal utilisent `"automatic"` par défaut, donc ce symptôme n’apparaît que lorsque `messages.groupChat.visibleReplies` (ou le `messages.visibleReplies` global) est explicitement défini sur `"message_tool"`. Le `defaultVisibleReplies` du harness ne s’applique pas ici — le résolveur de groupe/canal l’ignore ; il n’affecte que les discussions directes/source (le harness Codex supprime ainsi les finales des discussions directes).

Correction : choisissez un modèle plus fort en appel d’outils, supprimez le remplacement explicite `"message_tool"` pour revenir à la valeur par défaut `"automatic"`, ou définissez `messages.groupChat.visibleReplies: "automatic"` pour forcer les réponses visibles pour chaque requête de groupe/canal. Le Gateway recharge à chaud la configuration `messages` après l’enregistrement du fichier ; redémarrez le Gateway uniquement lorsque la surveillance de fichiers ou le rechargement de configuration est désactivé dans le déploiement.

**Types de mentions :**

- **Mentions de métadonnées** : @mentions natives de la plateforme. Ignorées dans le mode self-chat WhatsApp.
- **Motifs de texte** : motifs regex sûrs dans `agents.list[].groupChat.mentionPatterns`. Les motifs invalides et les répétitions imbriquées dangereuses sont ignorés.
- Le filtrage par mention n’est appliqué que lorsque la détection est possible (mentions natives ou au moins un motif).

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

`messages.groupChat.historyLimit` définit la valeur par défaut globale. Les canaux peuvent la remplacer avec `channels.<channel>.historyLimit` (ou par compte). Définissez `0` pour désactiver.

`messages.groupChat.unmentionedInbound: "room_event"` soumet les messages de groupe/canal toujours actifs sans mention comme contexte silencieux de salon sur les canaux pris en charge. Les messages mentionnés, les commandes et les messages directs restent des requêtes utilisateur. Consultez [Événements de salon ambiants](/fr/channels/ambient-room-events) pour des exemples complets Discord, Slack et Telegram.

`messages.visibleReplies` est la valeur par défaut globale pour les événements source ; `messages.groupChat.visibleReplies` la remplace pour les événements source de groupe/canal. Lorsque `messages.visibleReplies` n’est pas défini, les discussions directes/source utilisent la valeur par défaut du runtime ou du harness sélectionné, mais les tours directs WebChat internes utilisent la livraison finale automatique pour la parité des prompts Pi/Codex. Définissez `messages.visibleReplies: "message_tool"` pour exiger intentionnellement `message(action=send)` pour la sortie visible. Les listes d’autorisation de canal et le filtrage par mention décident toujours si un événement est traité.

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

#### Mode self-chat

Incluez votre propre numéro dans `allowFrom` pour activer le mode self-chat (ignore les @mentions natives, ne répond qu’aux motifs de texte) :

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

### Commandes (gestion des commandes de chat)

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

<Accordion title="Détails des commandes">

- Ce bloc configure les surfaces de commande. Pour le catalogue actuel des commandes intégrées et groupées, consultez [Commandes slash](/fr/tools/slash-commands).
- Cette page est une **référence des clés de configuration**, pas le catalogue complet des commandes. Les commandes appartenant aux canaux/plugins, comme QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, l’appairage d’appareils `/pair`, la mémoire `/dreaming`, le contrôle du téléphone `/phone` et Talk `/voice`, sont documentées dans leurs pages de canal/plugin ainsi que dans [Commandes slash](/fr/tools/slash-commands).
- Les commandes textuelles doivent être des messages **autonomes** commençant par `/`.
- `native: "auto"` active les commandes natives pour Discord/Telegram et laisse Slack désactivé.
- `nativeSkills: "auto"` active les commandes Skills natives pour Discord/Telegram et laisse Slack désactivé.
- Remplacement par canal : `channels.discord.commands.native` (booléen ou `"auto"`). Pour Discord, `false` ignore l’enregistrement et le nettoyage des commandes natives au démarrage.
- Remplacez l’enregistrement des Skills natives par canal avec `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` ajoute des entrées supplémentaires au menu du bot Telegram.
- `bash: true` active `! <cmd>` pour le shell de l’hôte. Nécessite `tools.elevated.enabled` et l’expéditeur dans `tools.elevated.allowFrom.<channel>`.
- `config: true` active `/config` (lit/écrit `openclaw.json`). Pour les clients Gateway `chat.send`, les écritures persistantes `/config set|unset` exigent aussi `operator.admin`; `/config show` en lecture seule reste disponible pour les clients opérateurs normaux ayant un périmètre d’écriture.
- `mcp: true` active `/mcp` pour la configuration de serveur MCP gérée par OpenClaw sous `mcp.servers`.
- `plugins: true` active `/plugins` pour la découverte, l’installation et les contrôles d’activation/désactivation des plugins.
- `channels.<provider>.configWrites` contrôle les mutations de configuration par canal (par défaut : true).
- Pour les canaux multicomptes, `channels.<provider>.accounts.<id>.configWrites` contrôle aussi les écritures qui ciblent ce compte (par exemple `/allowlist --config --account <id>` ou `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` désactive `/restart` et les actions d’outil de redémarrage du Gateway. Par défaut : `true`.
- `ownerAllowFrom` est la liste d’autorisation explicite du propriétaire pour les commandes réservées au propriétaire et les actions de canal contrôlées par le propriétaire. Elle est distincte de `allowFrom`.
- `ownerDisplay: "hash"` hache les identifiants de propriétaire dans le prompt système. Définissez `ownerDisplaySecret` pour contrôler le hachage.
- `allowFrom` est propre à chaque fournisseur. Lorsqu’il est défini, c’est la **seule** source d’autorisation (les listes d’autorisation/appairages de canal et `useAccessGroups` sont ignorés).
- `useAccessGroups: false` permet aux commandes de contourner les politiques de groupes d’accès lorsque `allowFrom` n’est pas défini.
- Carte de la documentation des commandes :
  - catalogue intégré et groupé : [Commandes slash](/fr/tools/slash-commands)
  - surfaces de commande propres aux canaux : [Canaux](/fr/channels)
  - commandes QQ Bot : [QQ Bot](/fr/channels/qqbot)
  - commandes d’appairage : [Appairage](/fr/channels/pairing)
  - commande de carte LINE : [LINE](/fr/channels/line)
  - Dreaming de la mémoire : [Dreaming](/fr/concepts/dreaming)

</Accordion>

---

## Associé

- [Référence de configuration](/fr/gateway/configuration-reference) — clés de premier niveau
- [Configuration — agents](/fr/gateway/config-agents)
- [Vue d’ensemble des canaux](/fr/channels)
