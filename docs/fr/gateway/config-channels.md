---
read_when:
    - Configuration d’un plugin de canal (authentification, contrôle d’accès, comptes multiples)
    - Dépannage des clés de configuration propres à chaque canal
    - Audit de la politique des messages privés, de la politique de groupe ou du filtrage des mentions
summary: 'Configuration des canaux : contrôle d’accès, association et clés propres à chaque canal pour Slack, Discord, Telegram, WhatsApp, Matrix, iMessage et bien plus encore'
title: Configuration — canaux
x-i18n:
    generated_at: "2026-07-16T13:16:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8d2363844e203e0c44ad9fe5d7a6a994fc654517e0488cffb836ddc9d1cdcb29
    source_path: gateway/config-channels.md
    workflow: 16
---

Clés de configuration propres à chaque canal sous `channels.*` : accès aux messages privés et aux groupes, configurations multicompte, filtrage par mention et clés propres à chaque canal pour Slack, Discord, Telegram, WhatsApp, Matrix, iMessage et les autres plugins de canal.

Pour les agents, les outils, l’environnement d’exécution du Gateway et les autres clés de premier niveau, consultez la [référence de configuration](/fr/gateway/configuration-reference).

## Canaux

Chaque canal démarre automatiquement lorsque sa section de configuration existe (sauf si `enabled: false`). Telegram et iMessage sont inclus dans le paquet principal `openclaw`. Les autres canaux officiels (Discord, Slack, WhatsApp, Matrix, Microsoft Teams, IRC, Google Chat, Signal, Mattermost, entre autres) s’installent sous forme de plugins distincts avec `openclaw plugins install <spec>` ; consultez [Canaux](/fr/channels) pour obtenir la liste complète et les spécifications d’installation.

### Accès aux messages privés et aux groupes

Tous les canaux prennent en charge des politiques pour les messages privés et les groupes :

| Politique des messages privés | Comportement                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (par défaut) | Les expéditeurs inconnus reçoivent un code d’association à usage unique ; le propriétaire doit l’approuver |
| `allowlist`         | Uniquement les expéditeurs figurant dans `allowFrom` (ou dans le registre des autorisations associées)             |
| `open`              | Autoriser tous les messages privés entrants (nécessite `allowFrom: ["*"]`)             |
| `disabled`          | Ignorer tous les messages privés entrants                                          |

| Politique des groupes          | Comportement                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (par défaut) | Uniquement les groupes correspondant à la liste d’autorisation configurée          |
| `open`                | Ignorer les listes d’autorisation des groupes (le filtrage par mention reste applicable) |
| `disabled`            | Bloquer tous les messages de groupe/salon                          |

<Note>
`channels.defaults.groupPolicy` définit la valeur par défaut lorsque le paramètre `groupPolicy` d’un fournisseur n’est pas défini.
Les codes d’association expirent après 1 heure. Le nombre de demandes d’association en attente est limité à **3 par compte** (selon le canal et l’identifiant du compte).
Si un bloc de fournisseur est entièrement absent (`channels.<provider>` absent), la politique de groupe de l’environnement d’exécution utilise `allowlist` comme solution de repli (fermeture sécurisée), avec un avertissement au démarrage.
</Note>

### Remplacements de modèle par canal

Utilisez `channels.modelByChannel` pour associer des identifiants de canal précis ou des correspondants de messages privés à un modèle. Les valeurs acceptent `provider/model` ou des alias de modèle configurés. Le mappage de canal s’applique uniquement lorsqu’une session ne possède pas déjà un remplacement de modèle actif (par exemple, défini via `/model`).

Pour les conversations de groupe ou de fil, les clés sont des identifiants de groupe, des identifiants de sujet ou des noms de canal propres au canal. Pour les conversations par message privé, les clés sont des identifiants de correspondant dérivés de l’identité de l’expéditeur du canal (`nativeDirectUserId`, `origin.from`, `origin.to`, `OriginatingTo`, `From` ou `SenderId`). La forme exacte de la clé dépend du canal :

| Canal  | Forme de la clé de message privé         | Exemple                                      |
| -------- | ------------------- | -------------------------------------------- |
| Discord  | identifiant utilisateur brut         | `987654321`                                  |
| Feishu   | `feishu:ou_...`     | `feishu:ou_a8b6cab7e945387de5f253775d9b4d85` |
| Matrix   | identifiant utilisateur Matrix      | `@user:matrix.org`                           |
| Slack    | `user:U...`         | `user:U12345`                                |
| Telegram | identifiant utilisateur brut         | `123456789`                                  |
| WhatsApp | numéro de téléphone ou JID | `15551234567`                                |

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

Les clés propres aux messages privés correspondent uniquement aux conversations par message privé ; elles n’affectent pas le routage des groupes ou des fils.

### Valeurs par défaut des canaux et Heartbeat

Utilisez `channels.defaults` pour partager le comportement de la politique de groupe et du Heartbeat entre les fournisseurs :

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

- `channels.defaults.groupPolicy` : politique de groupe de repli lorsqu’un paramètre `groupPolicy` au niveau du fournisseur n’est pas défini.
- `channels.defaults.contextVisibility` : mode par défaut de visibilité du contexte supplémentaire pour tous les canaux. Valeurs : `all` (par défaut, inclut tout le contexte des citations, fils et historiques), `allowlist` (inclut uniquement le contexte des expéditeurs figurant sur la liste d’autorisation), `allowlist_quote` (identique à la liste d’autorisation, mais conserve le contexte explicite des citations et réponses). Remplacement par canal : `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk` : inclut les états sains des canaux dans la sortie du Heartbeat (valeur par défaut : `false`).
- `channels.defaults.heartbeat.showAlerts` : inclut les états dégradés ou en erreur dans la sortie du Heartbeat (valeur par défaut : `true`).
- `channels.defaults.heartbeat.useIndicator` : produit une sortie de Heartbeat compacte sous forme d’indicateurs (valeur par défaut : `true`).

### WhatsApp

WhatsApp fonctionne par l’intermédiaire du canal web du Gateway (Baileys Web). Il démarre automatiquement lorsqu’une session liée existe.

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

- `web.whatsapp.keepAliveIntervalMs` (valeur par défaut : `25000`), `connectTimeoutMs` (valeur par défaut : `60000`) et `defaultQueryTimeoutMs` (valeur par défaut : `60000`) ajustent le socket Baileys.
- Valeurs par défaut de `web.reconnect` : `initialMs: 2000`, `maxMs: 30000`, `factor: 1.8`, `jitter: 0.25`, `maxAttempts: 12`. `maxAttempts: 0` réessaie indéfiniment au lieu d’abandonner.
- Les entrées `bindings[]` de premier niveau avec `type: "acp"` configurent des liaisons ACP persistantes pour les messages privés et les groupes WhatsApp. Utilisez un numéro direct au format E.164 ou un JID de groupe WhatsApp dans `match.peer.id`. La sémantique des champs est commune et décrite dans [Agents ACP](/fr/tools/acp-agents#persistent-channel-bindings).

<Accordion title="WhatsApp multicompte">

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

- Les commandes sortantes utilisent par défaut le compte `default` s’il est présent ; sinon, le premier identifiant de compte configuré (par ordre de tri).
- Le paramètre facultatif `channels.whatsapp.defaultAccount` remplace cette sélection de compte par défaut de repli lorsqu’il correspond à un identifiant de compte configuré.
- L’ancien répertoire d’authentification Baileys à compte unique est migré par `openclaw doctor` vers `whatsapp/default`.
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

- Jeton du bot : `channels.telegram.botToken` ou `channels.telegram.tokenFile` (fichier normal uniquement ; les liens symboliques sont refusés), avec `TELEGRAM_BOT_TOKEN` comme solution de repli pour le compte par défaut.
- `apiRoot` correspond uniquement à la racine de l’API Telegram Bot. Utilisez `https://api.telegram.org` ou la racine de votre instance auto-hébergée ou de votre proxy, et non `https://api.telegram.org/bot<TOKEN>` ; `openclaw doctor --fix` supprime un suffixe final `/bot<TOKEN>` ajouté par erreur.
- Pour un serveur Bot API auto-hébergé en mode `--local`, `trustedLocalFileRoots` répertorie les chemins de l’hôte qu’OpenClaw peut lire. Montez le volume de données du serveur sur l’hôte OpenClaw et configurez soit sa racine de données, soit le répertoire propre à chaque jeton ; les chemins de conteneur sous `/var/lib/telegram-bot-api` sont mappés vers ces racines. Les autres chemins absolus restent refusés.
- Le paramètre facultatif `channels.telegram.defaultAccount` remplace la sélection du compte par défaut lorsqu’il correspond à un identifiant de compte configuré.
- Dans les configurations multicompte (au moins 2 identifiants de compte), définissez explicitement un compte par défaut (`channels.telegram.defaultAccount` ou `channels.telegram.accounts.default`) afin d’éviter le routage de repli ; `openclaw doctor` émet un avertissement si ce paramètre est absent ou non valide.
- `configWrites: false` bloque les écritures de configuration lancées par Telegram (migrations des identifiants de supergroupe, `/config set|unset`).
- Les entrées `bindings[]` de premier niveau avec `type: "acp"` configurent des liaisons ACP persistantes pour les sujets de forum (utilisez la valeur canonique `chatId:topic:topicId` dans `match.peer.id`). La sémantique des champs est commune et décrite dans [Agents ACP](/fr/tools/acp-agents#persistent-channel-bindings).
- Les aperçus de flux Telegram utilisent `sendMessage` + `editMessageText` (fonctionne dans les conversations privées et de groupe).
- `network.dnsResultOrder` utilise par défaut `"ipv4first"` afin d’éviter les échecs courants de récupération via IPv6.
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
      streaming: {
        mode: "progress", // off | partial | block | progress (Discord default: progress)
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

- Jeton : `channels.discord.token`, avec `DISCORD_BOT_TOKEN` comme solution de repli pour le compte par défaut.
- Les appels sortants directs qui fournissent un `token` Discord explicite utilisent ce jeton pour l'appel ; les paramètres de nouvelle tentative et de politique du compte proviennent toujours du compte sélectionné dans l'instantané d'exécution actif.
- La valeur facultative `channels.discord.defaultAccount` remplace la sélection du compte par défaut lorsqu'elle correspond à l'identifiant d'un compte configuré.
- Utilisez `user:<id>` (message privé) ou `channel:<id>` (canal de serveur) comme cibles de livraison ; les identifiants numériques seuls sont rejetés.
- Les slugs de serveur sont en minuscules, les espaces étant remplacés par `-` ; les clés de canal utilisent le nom converti en slug (sans `#`). Privilégiez les identifiants de serveur.
- Les messages rédigés par des bots sont ignorés par défaut. `allowBots: true` les active ; utilisez `allowBots: "mentions"` pour n'accepter que les messages de bots qui mentionnent le bot (ses propres messages restent filtrés).
- Les canaux qui prennent en charge les messages entrants rédigés par des bots peuvent utiliser la [protection partagée contre les boucles de bots](/fr/channels/bot-loop-protection). Définissez `channels.defaults.botLoopProtection` pour les budgets de base par paire, puis remplacez les valeurs au niveau du canal ou du compte uniquement lorsqu'une surface nécessite des limites différentes.
- `channels.discord.guilds.<id>.ignoreOtherMentions` (ainsi que les remplacements au niveau du canal) élimine les messages qui mentionnent un autre utilisateur ou rôle, mais pas le bot (à l'exception de @everyone/@here).
- `channels.discord.mentionAliases` associe le texte stable `@handle` sortant à des identifiants d'utilisateurs Discord avant l'envoi, afin que les coéquipiers connus puissent être mentionnés de manière déterministe même lorsque le cache temporaire de l'annuaire est vide. Les remplacements propres à chaque compte se trouvent sous `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (valeur par défaut : `17`) fractionne les messages longs en hauteur même lorsqu'ils contiennent moins de 2000 caractères.
- `channels.discord.suppressEmbeds` utilise `true` par défaut, afin que les URL sortantes ne soient pas développées en aperçus de liens Discord, sauf si cette option est désactivée. Les charges utiles `embeds` explicites sont toujours envoyées normalement ; les appels d'outils par message peuvent remplacer ce comportement avec `suppressEmbeds`.
- `channels.discord.threadBindings` contrôle le routage Discord lié aux fils de discussion :
  - `enabled` : remplacement Discord pour les fonctionnalités de session liées aux fils de discussion (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, ainsi que la livraison et le routage liés)
  - `idleHours` : remplacement Discord du retrait automatique de la focalisation après une période d'inactivité, en heures (`0` le désactive)
  - `maxAgeHours` : remplacement Discord de l'âge maximal absolu, en heures (`0` le désactive)
  - `spawnSessions` : commutateur pour la création et la liaison automatiques de fils de discussion par `sessions_spawn({ thread: true })` et ACP (valeur par défaut : `true`)
  - `defaultSpawnContext` : contexte natif du sous-agent pour les créations liées aux fils de discussion (`"fork"` par défaut)
- Les entrées `bindings[]` de premier niveau contenant `type: "acp"` configurent les liaisons ACP persistantes pour les canaux et les fils de discussion (utilisez l'identifiant du canal ou du fil de discussion dans `match.peer.id`). La sémantique des champs est commune avec celle des [agents ACP](/fr/tools/acp-agents#persistent-channel-bindings).
- `channels.discord.ui.components.accentColor` définit la couleur d'accentuation des conteneurs de composants Discord v2.
- `channels.discord.agentComponents.ttlMs` contrôle la durée pendant laquelle les rappels des composants Discord envoyés restent enregistrés. Valeur par défaut : `1800000` (30 minutes) ; maximum : `86400000` (24 heures). Les remplacements propres à chaque compte se trouvent sous `channels.discord.accounts.<accountId>.agentComponents.ttlMs`. Privilégiez le TTL le plus court qui convienne au flux de travail.
- `channels.discord.voice` active les conversations dans les canaux vocaux Discord, ainsi que les remplacements facultatifs de connexion automatique, de LLM et de TTS. Les configurations Discord exclusivement textuelles laissent la voix désactivée par défaut ; définissez `channels.discord.voice.enabled=true` pour l'activer.
- `channels.discord.voice.model` remplace éventuellement le modèle LLM utilisé pour les réponses dans les canaux vocaux Discord.
- `channels.discord.voice.daveEncryption` (valeur par défaut : `true`) et `channels.discord.voice.decryptionFailureTolerance` (valeur par défaut : `24`) sont transmis aux options DAVE de `@discordjs/voice`.
- `channels.discord.voice.connectTimeoutMs` contrôle l'attente initiale de l'état Ready de `@discordjs/voice` pour `/vc join` et les tentatives de connexion automatique (valeur par défaut : `30000`).
- `channels.discord.voice.reconnectGraceMs` contrôle le délai accordé à une session vocale déconnectée pour passer en signalisation de reconnexion avant qu'OpenClaw ne la détruise (valeur par défaut : `15000`).
- La lecture vocale de Discord n'est pas interrompue par l'événement de début de parole d'un autre utilisateur. Pour éviter les boucles de rétroaction, OpenClaw ignore toute nouvelle capture vocale pendant la lecture TTS.
- OpenClaw tente également de rétablir la réception vocale en quittant puis en rejoignant à nouveau une session vocale après des échecs de déchiffrement répétés.
- `channels.discord.streaming` est la clé canonique du mode de diffusion. Discord utilise `streaming.mode: "progress"` par défaut, afin que la progression des outils et des tâches apparaisse dans un unique message d'aperçu modifié ; définissez `streaming.mode: "off"` pour la désactiver. Les anciennes clés à plat (`streamMode`, `chunkMode`, `blockStreaming`, `draftChunk`, `blockStreamingCoalesce`) ne sont plus lues à l'exécution ; lancez `openclaw doctor --fix` pour migrer la configuration persistante.
- `channels.discord.autoPresence` associe la disponibilité à l'exécution à la présence du bot (opérationnel => en ligne, dégradé => inactif, épuisé => ne pas déranger) et permet de remplacer facultativement le texte de statut.
- `channels.discord.guilds.<id>.presenceEvents` achemine les arrivées de disponibilité humaine vers un canal Discord configuré sous forme d'événements système de l'agent. Les membres admissibles doivent pouvoir consulter `channelId` ; les fils de discussion publics héritent de la visibilité de leur parent, tandis que les fils privés exigent en plus une adhésion ou l'autorisation Manage Threads. `users` peut restreindre davantage cette audience. Cette option initialise les membres actuellement en ligne à partir d'instantanés `GUILD_CREATE` complets, achemine les transitions observées de hors ligne à en ligne et considère le premier signal en ligne ultérieur d'un membre encore inconnu comme une nouvelle disponibilité, sans affirmer s'il s'est connecté ou a rejoint le serveur après l'instantané. Les serveurs dépassant la limite d'instantané de 75 000 membres de Discord nécessitent d'abord une mise à jour hors ligne explicite. Paramètres de limitation : `reconnectSuppressSeconds` (période de silence après une nouvelle session Gateway pendant la reconstruction de l'état de présence du serveur, valeur par défaut : 300 ; `0` la désactive) et `burstLimit`/`burstWindowSeconds` (limite, par serveur, du débit d'événements placés avec succès dans la file d'attente, valeur par défaut : 8 événements par fenêtre glissante de 60 s). Les sessions reprises ne déclenchent pas la période de suppression de reconnexion. Le délai de nouvelle salutation par utilisateur reste de huit heures. Cette fonctionnalité nécessite `channels.discord.intents.presence=true`, l'intention privilégiée Presence Intent dans le Developer Portal de Discord, ainsi qu'un Heartbeat d'agent activé.
- `channels.discord.dangerouslyAllowNameMatching` réactive la correspondance modifiable des noms et des tags (mode de compatibilité d'urgence).
- `channels.discord.execApprovals` : remise native Discord des demandes d'approbation d'exécution et autorisation des approbateurs.
  - `enabled` : `true`, `false` ou `"auto"` (valeur par défaut). En mode automatique, les approbations d'exécution sont activées lorsque les approbateurs peuvent être déterminés à partir de `approvers` ou de `commands.ownerAllowFrom`.
  - `approvers` : identifiants d'utilisateurs Discord autorisés à approuver les demandes d'exécution. Utilise `commands.ownerAllowFrom` comme solution de repli en cas d'omission.
  - `agentFilter` : liste d'autorisation facultative d'identifiants d'agents. Omettez-la pour transmettre les approbations de tous les agents.
  - `sessionFilter` : motifs facultatifs de clés de session (sous-chaîne ou expression régulière).
  - `target` : emplacement auquel envoyer les demandes d'approbation. `"dm"` (valeur par défaut) les envoie dans les messages privés des approbateurs, `"channel"` les envoie dans le canal d'origine et `"both"` les envoie aux deux emplacements. Lorsque la cible comprend `"channel"`, seuls les approbateurs déterminés peuvent utiliser les boutons.
  - `cleanupAfterResolve` : lorsque la valeur est `true`, supprime les messages privés d'approbation après une approbation, un refus ou une expiration.

**Modes de notification des réactions :** `off` (aucune), `own` (messages du bot, valeur par défaut), `all` (tous les messages), `allowlist` (provenant de `guilds.<id>.users` sur tous les messages).

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

- JSON du compte de service : intégré (`serviceAccount`) ou stocké dans un fichier (`serviceAccountFile`).
- La référence secrète du compte de service est également prise en charge (`serviceAccountRef`).
- Solutions de repli par variables d'environnement : `GOOGLE_CHAT_SERVICE_ACCOUNT` ou `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE` (compte par défaut uniquement).
- Utilisez `spaces/<spaceId>` ou `users/<userId>` comme cibles de livraison.
- `channels.googlechat.dangerouslyAllowNameMatching` réactive la correspondance modifiable de l'identité principale de messagerie (mode de compatibilité d'urgence).

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
          systemPrompt: "Réponses courtes uniquement.",
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
        mode: "partial", // off | partial | block | progress
        chunkMode: "length", // length | newline
        nativeTransport: true, // utiliser l’API de streaming native de Slack lorsque mode=partial
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

- Le **mode Socket** nécessite à la fois `botToken` et `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` pour le repli par défaut sur les variables d’environnement du compte).
- Le **mode HTTP** nécessite `botToken` ainsi que `signingSecret` (à la racine ou par compte).
- `enterpriseOrgInstall: true` inscrit un compte dans le chemin d’événements à l’échelle de
  l’organisation Slack Enterprise Grid. Au démarrage, le jeton du bot est vérifié avec `auth.test` et
  le démarrage échoue lorsque le mode configuré ne correspond pas à l’identité d’installation de Slack.
  Les messages privés Enterprise doivent être désactivés ou utiliser `dmPolicy: "open"` avec un
  `allowFrom: ["*"]` effectif. Les politiques de canaux et d’utilisateurs doivent utiliser des identifiants Slack stables ;
  les noms modifiables et les préfixes de canaux non pris en charge font échouer le démarrage. La V1 ne gère que
  les événements directs `message` et `app_mention` en mode Socket ou HTTP avec des réponses
  immédiates ; le relais, les commandes, les interactions, App Home, les écouteurs d’événements de réaction,
  les épingles, les outils d’action, les approbations natives, les liaisons, la livraison différée et
  les envois proactifs ne sont pas disponibles. Les accusés de réception, la saisie et
  les réactions de statut gérés par l’écouteur restent disponibles avec `reactions:write` ; les notifications de
  réactions entrantes et les outils d’action de réaction ne sont pas disponibles. Consultez
  [Installations à l’échelle de l’organisation Enterprise Grid](/fr/channels/slack#enterprise-grid-org-wide-installs)
  pour le manifeste de moindre privilège, le processus de configuration et l’ensemble des restrictions.
- `socketMode` transmet les réglages du transport en mode Socket du SDK Slack à l’API publique du récepteur Bolt. Utilisez-le uniquement pour étudier les délais d’expiration ping/pong ou le comportement d’une connexion WebSocket obsolète. `clientPingTimeout` utilise par défaut `15000` ; `serverPingTimeout` et `pingPongLoggingEnabled` ne sont transmis que lorsqu’ils sont configurés.
- `botToken`, `appToken`, `signingSecret` et `userToken` acceptent des chaînes
  en texte brut ou des objets SecretRef.
- Les instantanés des comptes Slack exposent des champs de source et d’état propres à chaque identifiant d’accès, tels que
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` et, en mode HTTP,
  `signingSecretStatus`. `configured_unavailable` signifie que le compte est
  configuré au moyen de SecretRef, mais que le chemin actuel de commande ou d’exécution n’a pas pu
  résoudre la valeur du secret.
- `configWrites: false` bloque les écritures de configuration initiées par Slack.
- Le paramètre facultatif `channels.slack.defaultAccount` remplace la sélection du compte par défaut lorsqu’il correspond à l’identifiant d’un compte configuré.
- `channels.slack.streaming.mode` est la clé canonique du mode de flux Slack (`"partial"` par défaut). `channels.slack.streaming.nativeTransport` contrôle le transport de streaming natif de Slack (`true` par défaut). Les anciennes valeurs `streamMode`, la valeur booléenne `streaming`, `chunkMode`, `blockStreaming`, `blockStreamingCoalesce` et `nativeStreaming` ne sont plus lues à l’exécution ; exécutez `openclaw doctor --fix` pour migrer la configuration persistante vers `streaming.{mode,chunkMode,block.enabled,block.coalesce,nativeTransport}`.
- `unfurlLinks` et `unfurlMedia` transmettent les valeurs booléennes `chat.postMessage` de Slack pour le déploiement des liens et des médias dans les réponses du bot. `unfurlLinks` utilise par défaut `false`, afin que les liens sortants du bot ne se déploient pas directement dans le contenu sauf si cette fonction est activée ; `unfurlMedia` est omis sauf s’il est configuré. Définissez l’une ou l’autre valeur dans `channels.slack.accounts.<accountId>` afin de remplacer la valeur de premier niveau pour un compte.
- Utilisez `user:<id>` (message privé) ou `channel:<id>` pour les cibles de livraison.

**Modes de notification des réactions :** `off`, `own` (par défaut), `all`, `allowlist` (provenant de `reactionAllowlist`).

**Isolation des sessions de fil :** `thread.historyScope` est propre à chaque fil (par défaut) ou partagé dans l’ensemble du canal. `thread.inheritParent` copie la transcription du canal parent dans les nouveaux fils. `thread.initialHistoryLimit` (`20` par défaut) limite le nombre de messages existants du fil récupérés lorsqu’une nouvelle session de fil démarre ; `0` désactive la récupération de l’historique du fil.

- Le streaming natif de Slack et l’état de fil « is typing... » de type assistant Slack nécessitent une cible de réponse dans un fil. Les messages privés de premier niveau restent hors fil par défaut ; ils peuvent donc continuer à être diffusés au moyen des aperçus de brouillons Slack publiés puis modifiés, au lieu d’afficher l’aperçu natif de flux ou d’état propre aux fils.
- `typingReaction` ajoute une réaction temporaire au message Slack entrant pendant la génération d’une réponse, puis la supprime une fois celle-ci terminée. Utilisez un code court d’émoji Slack tel que `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals` : livraison du client d’approbation native de Slack et autorisation des approbateurs d’exécution. Même schéma que Discord : `enabled` (`true`/`false`/`"auto"`), `approvers` (identifiants utilisateur Slack), `agentFilter`, `sessionFilter` et `target` (`"dm"`, `"channel"` ou `"both"`). Les approbations de Plugin peuvent utiliser ce chemin de client natif pour les requêtes provenant de Slack lorsque les approbateurs du Plugin Slack sont résolus ; la livraison native Slack des approbations de Plugin peut également être activée au moyen de `approvals.plugin` pour les sessions provenant de Slack ou les cibles Slack. Les approbations de Plugin utilisent les approbateurs du Plugin Slack définis dans `allowFrom` et le routage par défaut, et non les approbateurs d’exécution.

| Groupe d’actions | Valeur par défaut | Remarques                            |
| ---------------- | ------------------ | ------------------------------------ |
| reactions        | enabled            | Réagir et répertorier les réactions |
| messages         | enabled            | Lire/envoyer/modifier/supprimer      |
| pins             | enabled            | Épingler/désépingler/répertorier     |
| memberInfo       | enabled            | Informations sur le membre          |
| emojiList        | enabled            | Liste des émojis personnalisés       |

### Mattermost

Mattermost s’installe comme un Plugin distinct, de la même manière que Discord, Slack et WhatsApp :

```bash
openclaw plugins install @openclaw/mattermost
```

Consultez [npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost) pour connaître les balises de distribution actuelles avant de fixer une version.

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
        native: true, // activation explicite
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // URL explicite facultative pour les déploiements avec proxy inverse/publics
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      streaming: { chunkMode: "length" },
    },
  },
}
```

Modes de discussion : `oncall` (répondre lors d’une mention @, par défaut), `onmessage` (chaque message), `onchar` (messages commençant par le préfixe de déclenchement).

Lorsque les commandes natives Mattermost sont activées :

- `commands.callbackPath` doit être un chemin (par exemple `/api/channels/mattermost/command`), et non une URL complète.
- `commands.callbackUrl` doit se résoudre vers le point de terminaison du Gateway OpenClaw et être accessible depuis le serveur Mattermost.
- Les rappels de commandes slash natives sont authentifiés à l’aide des jetons propres à chaque commande renvoyés
  par Mattermost lors de l’enregistrement de la commande slash. Si l’enregistrement échoue ou qu’aucune
  commande n’est activée, OpenClaw rejette les rappels avec
  `Unauthorized: invalid command token.`
- Pour les hôtes de rappel privés, internes ou du réseau Tailscale, Mattermost peut exiger que
  `ServiceSettings.AllowedUntrustedInternalConnections` inclue l’hôte ou le domaine de rappel.
  Utilisez des valeurs d’hôte ou de domaine, et non des URL complètes.
- `channels.mattermost.configWrites` : autoriser ou refuser les écritures de configuration initiées par Mattermost.
- `channels.mattermost.requireMention` : exiger `@mention` avant de répondre dans les canaux.
- `channels.mattermost.groups.<channelId>.requireMention` : remplacement, propre à chaque canal, de l’exigence de mention (`"*"` pour la valeur par défaut).
- Le paramètre facultatif `channels.mattermost.defaultAccount` remplace la sélection du compte par défaut lorsqu’il correspond à l’identifiant d’un compte configuré.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // liaison facultative au compte
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

**Modes de notification des réactions :** `off`, `own` (par défaut), `all`, `allowlist` (provenant de `reactionAllowlist`).

- `channels.signal.account` : associer le démarrage du canal à l’identité d’un compte Signal précis.
- `channels.signal.configWrites` : autoriser ou refuser les écritures de configuration initiées par Signal.
- Le paramètre facultatif `channels.signal.defaultAccount` remplace la sélection du compte par défaut lorsqu’il correspond à l’identifiant d’un compte configuré.

### iMessage

OpenClaw lance `imsg rpc` (JSON-RPC via les entrées et sorties standard). Aucun démon ni port n’est requis. Il s’agit du chemin recommandé pour les nouvelles configurations OpenClaw avec iMessage lorsque l’hôte peut accorder les autorisations d’accès à la base de données de Messages et d’automatisation.

La prise en charge de BlueBubbles a été supprimée. `channels.bluebubbles` n’est pas une surface de configuration d’exécution prise en charge dans la version actuelle d’OpenClaw. Migrez les anciennes configurations vers `channels.imessage` ; consultez [Suppression de BlueBubbles et chemin imsg pour iMessage](/fr/announcements/bluebubbles-imessage) pour la version courte et [Migration depuis BlueBubbles](/fr/channels/imessage-from-bluebubbles) pour le tableau de correspondance complet.

Si le Gateway ne s’exécute pas sur le Mac connecté à Messages, conservez `channels.imessage.enabled=true` et définissez `channels.imessage.cliPath` sur un wrapper SSH qui exécute `imsg "$@"` sur ce Mac. Le chemin local `imsg` par défaut est réservé à macOS.

Avant de vous fier à un wrapper SSH pour les envois en production, vérifiez un envoi sortant `imsg send` au moyen de ce wrapper précis. Certains états TCC de macOS attribuent l’automatisation de Messages à `/usr/libexec/sshd-keygen-wrapper`, ce qui peut permettre le fonctionnement des lectures et des sondes tout en faisant échouer les envois avec AppleEvents `-1743` ; consultez la section de dépannage du wrapper SSH dans [iMessage](/fr/channels/imessage).

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

- Le paramètre facultatif `channels.imessage.defaultAccount` remplace la sélection de compte par défaut lorsqu’il correspond à l’identifiant d’un compte configuré.
- Nécessite un accès complet au disque pour la base de données de Messages.
- Privilégiez les cibles `chat_id:<id>`. Utilisez `imsg chats --limit 20` pour répertorier les conversations.
- `cliPath` peut pointer vers un wrapper SSH ; définissez `remoteHost` (`host` ou `user@host`) pour récupérer les pièces jointes par SCP.
- `attachmentRoots` et `remoteAttachmentRoots` limitent les chemins des pièces jointes entrantes (valeur par défaut : `/Users/*/Library/Messages/Attachments`).
- SCP utilise une vérification stricte de la clé d’hôte ; assurez-vous donc que la clé de l’hôte relais existe déjà dans `~/.ssh/known_hosts`.
- `channels.imessage.configWrites` : autorise ou refuse les écritures de configuration initiées depuis iMessage.
- `channels.imessage.sendTransport` : transport d’envoi RPC `imsg` privilégié pour les réponses sortantes normales. `auto` (valeur par défaut) utilise le pont IMCore pour les conversations existantes lorsqu’il est en cours d’exécution, puis se rabat sur AppleScript ; `bridge` exige une distribution par API privée ; `applescript` impose le chemin d’automatisation public de Messages.
- `channels.imessage.actions.*` : active les actions de l’API privée, également contrôlées par `imsg status` / `openclaw channels status --probe`.
- `channels.imessage.includeAttachments` est désactivé par défaut ; définissez-le sur `true` avant d’attendre des médias entrants dans les tours de l’agent.
- La récupération entrante après un redémarrage du pont ou du Gateway est automatique (déduplication par GUID et limite d’âge pour l’arriéré obsolète). Les configurations `channels.imessage.catchup.enabled: true` existantes restent prises en charge en tant que profil de compatibilité obsolète ; `catchup` est désactivé par défaut.
- `channels.imessage.groups` : registre des groupes et paramètres propres à chaque groupe. Avec `groupPolicy: "allowlist"`, configurez soit des clés `chat_id` explicites, soit une entrée générique `"*"`, afin que les messages de groupe puissent franchir le contrôle du registre.
- Les entrées `bindings[]` de niveau supérieur comportant `type: "acp"` peuvent lier des conversations iMessage à des sessions ACP persistantes. Utilisez un identifiant normalisé ou une cible de conversation explicite (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) dans `match.peer.id`. Sémantique des champs partagés : [Agents ACP](/fr/tools/acp-agents#persistent-channel-bindings).

<Accordion title="Exemple de wrapper SSH pour iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix repose sur un Plugin et se configure sous `channels.matrix`.

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
- `channels.matrix.proxy` achemine le trafic HTTP de Matrix via un proxy HTTP(S) explicite. Les comptes nommés peuvent le remplacer avec `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` autorise les serveurs domestiques privés ou internes. `proxy` et cette activation réseau sont des contrôles indépendants.
- `channels.matrix.defaultAccount` sélectionne le compte privilégié dans les configurations multicomptes.
- `channels.matrix.autoJoin` utilise `"off"` par défaut ; les salons auxquels le compte est invité et les nouvelles invitations de type message privé sont donc ignorés jusqu’à ce que vous définissiez `autoJoin: "allowlist"` avec `autoJoinAllowlist` ou `autoJoin: "always"`.
- `channels.matrix.execApprovals` : distribution native Matrix des demandes d’approbation d’exécution et autorisation des approbateurs.
  - `enabled` : `true`, `false` ou `"auto"` (valeur par défaut). En mode automatique, les approbations d’exécution s’activent lorsque les approbateurs peuvent être déterminés à partir de `approvers` ou `commands.ownerAllowFrom`.
  - `approvers` : identifiants utilisateur Matrix (par exemple `@owner:example.org`) autorisés à approuver les demandes d’exécution.
  - `agentFilter` : liste facultative des identifiants d’agent autorisés. Omettez-la pour transférer les approbations de tous les agents.
  - `sessionFilter` : motifs facultatifs de clés de session (sous-chaîne ou expression régulière).
  - `target` : destination des demandes d’approbation. `"dm"` (valeur par défaut), `"channel"` (salon d’origine) ou `"both"`.
  - Remplacements propres à chaque compte : `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` détermine le regroupement des messages privés Matrix en sessions : `per-user` (valeur par défaut) les partage par interlocuteur routé, tandis que `per-room` isole chaque salon de messages privés.
- Les sondes d’état Matrix et les recherches en direct dans l’annuaire utilisent la même politique de proxy que le trafic d’exécution.
- La configuration complète de Matrix, les règles de ciblage et les exemples de configuration sont documentés dans [Matrix](/fr/channels/matrix).

### Microsoft Teams

Microsoft Teams repose sur un Plugin et se configure sous `channels.msteams`.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, team/channel policies:
      // voir /channels/msteams
    },
  },
}
```

- Principaux chemins de clés présentés ici : `channels.msteams`, `channels.msteams.configWrites`.
- La configuration complète de Teams (identifiants, Webhook, politique de messages privés et de groupes, remplacements par équipe et par canal) est documentée dans [Microsoft Teams](/fr/channels/msteams).

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

- Principaux chemins de clés présentés ici : `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- Le paramètre facultatif `channels.irc.defaultAccount` remplace la sélection de compte par défaut lorsqu’il correspond à l’identifiant d’un compte configuré.
- La configuration complète du canal IRC (hôte, port, TLS, canaux, listes d’autorisation et contrôle par mention) est documentée dans [IRC](/fr/channels/irc).

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
- Les paramètres de base du canal s’appliquent à tous les comptes, sauf s’ils sont remplacés au niveau du compte.
- Utilisez `bindings[].match.accountId` pour acheminer chaque compte vers un agent différent.
- Si vous ajoutez un compte autre que celui par défaut via `openclaw channels add` (ou l’intégration guidée du canal) alors que vous utilisez encore une configuration de canal monocompte de niveau supérieur, OpenClaw transfère d’abord les valeurs monocomptes de niveau supérieur propres au compte vers la table des comptes du canal afin que le compte d’origine continue de fonctionner. La plupart des canaux les déplacent dans `channels.<channel>.accounts.default` ; Matrix peut conserver à la place une cible nommée ou par défaut existante et correspondante.
- Les liaisons existantes limitées au canal (sans `accountId`) continuent de correspondre au compte par défaut ; les liaisons propres à un compte restent facultatives.
- `openclaw doctor --fix` répare également les structures mixtes en déplaçant les valeurs monocomptes de niveau supérieur propres au compte vers le compte promu choisi pour ce canal. La plupart des canaux utilisent `accounts.default` ; Matrix peut conserver à la place une cible nommée ou par défaut existante et correspondante.

### Autres canaux de Plugin

De nombreux canaux de Plugin sont configurés comme `channels.<id>` et documentés dans leurs pages dédiées (par exemple Feishu, LINE, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Twitch et Zalo).
Consultez l’index complet des canaux : [Canaux](/fr/channels).

### Contrôle par mention dans les discussions de groupe

Par défaut, les messages de groupe **exigent une mention** (mention dans les métadonnées ou motifs d’expression régulière sûrs). Cela s’applique aux discussions de groupe WhatsApp, Telegram, Discord, Google Chat et iMessage.

Les réponses visibles sont contrôlées séparément. Par défaut, les requêtes directes normales de groupe, de canal et de WebChat interne distribuent automatiquement la réponse finale : le texte final de l’assistant est publié par le chemin hérité des réponses visibles. Activez `messages.visibleReplies: "message_tool"` ou `messages.groupChat.visibleReplies: "message_tool"` lorsque la sortie visible ne doit être publiée qu’après l’appel de `message(action=send)` par l’agent. Si le modèle renvoie une réponse finale substantielle sans appeler l’outil de messagerie dans un mode activé exclusivement réservé aux outils, ce texte final reste privé, le journal détaillé du Gateway consigne les métadonnées de la charge utile supprimée et OpenClaw met en file d’attente une seule nouvelle tentative de récupération demandant au modèle de distribuer la même réponse via `message(action=send)`.

Les réponses visibles exclusivement réservées aux outils nécessitent un modèle ou un environnement d’exécution qui appelle les outils de manière fiable. Elles sont recommandées pour les salons ambiants partagés avec les modèles de dernière génération tels que GPT-5.6 Sol. Certains modèles moins performants peuvent produire un texte final, mais ne pas comprendre que la sortie visible dans la source doit être envoyée avec `message(action=send)`. Par défaut, OpenClaw récupère le cas courant d’une réponse finale bloquée uniquement lorsque celle-ci est substantielle, que le tour source n’était pas un événement de salon, que la politique d’envoi n’a pas refusé la distribution et qu’aucune réponse n’a déjà été envoyée à la source. La récupération est limitée à une seule nouvelle tentative ; elle empêche la persistance de l’invite de nouvelle tentative synthétique et exclut cette tentative du regroupement de collecte afin qu’elle ne puisse pas fusionner avec des invites sans rapport placées dans la file d’attente. Si la nouvelle tentative reste également bloquée ou ne peut pas être mise en file d’attente, OpenClaw distribue uniquement un diagnostic épuré tel que « J’ai généré une réponse, mais je n’ai pas pu la distribuer dans cette discussion. Veuillez réessayer. » Le texte final privé d’origine n’est jamais marqué pour une distribution automatique à la source. Pour les modèles qui bloquent les réponses à répétition, utilisez `"automatic"` afin que le tour final de l’assistant constitue le chemin de réponse visible, passez à un modèle plus performant pour l’appel d’outils, examinez le journal détaillé du Gateway pour obtenir le résumé de la charge utile supprimée ou définissez `messages.groupChat.visibleReplies: "automatic"` afin d’utiliser des réponses finales visibles pour chaque requête de groupe ou de canal.

Si l’outil de messagerie n’est pas disponible avec la politique d’outils active, OpenClaw se rabat sur les réponses visibles automatiques au lieu de supprimer silencieusement la réponse. `openclaw doctor` avertit de cette incompatibilité.

Cette règle s’applique au texte final normal de l’agent. Les liaisons de conversation détenues par un Plugin utilisent la réponse renvoyée par le Plugin propriétaire comme réponse visible pour les tours des fils liés qu’il revendique ; le Plugin n’a pas besoin d’appeler `message(action=send)` pour ces réponses de liaison.

**Dépannage : une @mention de groupe déclenche l’indicateur de saisie, puis plus rien (sans erreur)**

Symptôme : une @mention dans un groupe ou un canal affiche l’indicateur de saisie et le journal du Gateway signale `dispatch complete (queuedFinal=false, replies=0)`, mais aucun message n’arrive dans le salon. Les messages privés adressés au même agent reçoivent une réponse normale.

Cause : le mode de réponse visible des groupes/canaux est résolu en `"message_tool"`. OpenClaw exécute donc le tour, mais masque le texte final de l’assistant, sauf si l’agent appelle `message(action=send)`. Il n’existe aucun contrat `NO_REPLY` dans ce mode ; en l’absence d’appel à l’outil de messagerie, le texte final d’origine reste privé. Pour les tours sources substantiels, OpenClaw tente désormais une nouvelle fois la récupération avec une protection ; les notes courtes, le silence explicite, les événements de salon, les tours dont la politique d’envoi interdit la livraison et les tours déjà livrés ne font pas l’objet d’une nouvelle tentative. Par défaut, les tours normaux de groupe et de canal utilisent `"automatic"`. Ce symptôme n’apparaît donc que lorsque `messages.groupChat.visibleReplies` (ou le paramètre global `messages.visibleReplies`) est explicitement défini sur `"message_tool"`. Le paramètre `defaultVisibleReplies` du harnais ne s’applique pas ici — le résolveur de groupe/canal l’ignore ; il affecte uniquement les discussions directes/sources (le harnais Codex masque ainsi les réponses finales des discussions directes).

Correction : choisissez un modèle plus fiable pour l’appel d’outils, supprimez le remplacement explicite `"message_tool"` afin de revenir à la valeur par défaut `"automatic"`, ou définissez `messages.groupChat.visibleReplies: "automatic"` pour forcer les réponses visibles à chaque requête de groupe/canal. Une réponse finale substantielle bloquée ne devrait plus se terminer par un succès silencieux ; elle devrait soit être récupérée au moyen d’une nouvelle tentative `message(action=send)`, soit afficher le diagnostic nettoyé d’échec de livraison. Le Gateway recharge à chaud la configuration `messages` après l’enregistrement du fichier ; ne redémarrez le Gateway que si la surveillance des fichiers ou le rechargement de la configuration est désactivé dans le déploiement.

**Types de mentions :**

- **Mentions dans les métadonnées** : mentions @ natives de la plateforme. Ignorées dans le mode de discussion avec soi-même de WhatsApp.
- **Motifs textuels** : motifs d’expression régulière sûrs dans `agents.list[].groupChat.mentionPatterns`. Les motifs non valides et les répétitions imbriquées dangereuses sont ignorés.
- Le filtrage par mention n’est appliqué que lorsque la détection est possible (mentions natives ou au moins un motif).

```json5
{
  messages: {
    visibleReplies: "automatic", // forcer les anciennes réponses finales automatiques pour les discussions directes/sources
    groupChat: {
      historyLimit: 50,
      unmentionedInbound: "room_event", // les échanges permanents du salon sans mention deviennent un contexte silencieux
      visibleReplies: "message_tool", // activation explicite ; exiger message(action=send) pour les réponses visibles du salon
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` définit la valeur globale par défaut. Les canaux peuvent la remplacer avec `channels.<channel>.historyLimit` (ou par compte). Définissez `0` pour désactiver cette fonctionnalité.

`messages.groupChat.unmentionedInbound: "room_event"` transmet les messages permanents de groupe/canal sans mention comme contexte silencieux du salon sur les canaux pris en charge. Les messages avec mention, les commandes et les messages directs restent des requêtes utilisateur. Consultez [Événements ambiants de salon](/fr/channels/ambient-room-events) pour des exemples complets concernant Discord, Slack et Telegram.

`messages.visibleReplies` est la valeur globale par défaut des événements sources ; `messages.groupChat.visibleReplies` la remplace pour les événements sources de groupe/canal. Lorsque `messages.visibleReplies` n’est pas défini, les discussions directes/sources utilisent la valeur par défaut de l’environnement d’exécution ou du harnais sélectionné, mais les tours directs internes de WebChat utilisent la livraison finale automatique afin d’assurer la parité des invites Pi/Codex. Définissez `messages.visibleReplies: "message_tool"` pour exiger intentionnellement `message(action=send)` afin de produire une sortie visible. Les listes d’autorisation des canaux et le filtrage par mention déterminent toujours si un événement est traité.

#### Limites de l’historique des messages directs

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

Résolution : remplacement par message direct → valeur par défaut du fournisseur → aucune limite (tous conservés).

Ce résolveur lit `channels.<provider>.dmHistoryLimit` et `channels.<provider>.dms.<id>.historyLimit` pour tout canal dont la clé de session respecte le format standard `provider:direct:<id>` (ou l’ancien format `provider:dm:<id>`). Il fonctionne donc aussi bien avec les canaux intégrés qu’avec les canaux de Plugin, et non uniquement avec une liste fixe.

#### Mode de discussion avec soi-même

Ajoutez votre propre numéro à `allowFrom` pour activer le mode de discussion avec soi-même (ignore les mentions @ natives et répond uniquement aux motifs textuels) :

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

### Commandes (traitement des commandes de discussion)

```json5
{
  commands: {
    native: "auto", // enregistrer les commandes natives lorsqu’elles sont prises en charge
    nativeSkills: "auto", // enregistrer les commandes Skills natives lorsqu’elles sont prises en charge
    text: true, // analyser les /commandes dans les messages de discussion
    bash: false, // autoriser ! (alias : /bash)
    bashForegroundMs: 2000,
    config: false, // autoriser /config
    mcp: false, // autoriser /mcp
    plugins: false, // autoriser /plugins
    debug: false, // autoriser /debug
    restart: true, // autoriser /restart et les requêtes externes de redémarrage SIGUSR1
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

- Ce bloc configure les interfaces de commande. Pour consulter le catalogue actuel des commandes intégrées et groupées, voir [Commandes avec barre oblique](/fr/tools/slash-commands).
- Cette page est une **référence des clés de configuration**, et non le catalogue complet des commandes. Les commandes appartenant aux canaux/Plugins, comme les commandes QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, d’association d’appareils `/pair`, de mémoire `/dreaming`, de contrôle téléphonique `/phone` et Talk `/voice`, sont documentées dans les pages de leurs canaux/Plugins ainsi que dans [Commandes avec barre oblique](/fr/tools/slash-commands).
- Les commandes textuelles doivent être des messages **autonomes** commençant par `/`.
- `native: "auto"` active les commandes natives pour Discord/Telegram et les laisse désactivées pour Slack.
- `nativeSkills: "auto"` active les commandes Skills natives pour Discord/Telegram et les laisse désactivées pour Slack.
- Remplacement par canal : `channels.discord.commands.native` (valeur booléenne ou `"auto"`). Pour Discord, `false` ignore l’enregistrement et le nettoyage des commandes natives au démarrage.
- Remplacez l’enregistrement des Skills natifs par canal avec `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` ajoute des entrées supplémentaires au menu du bot Telegram.
- `bash: true` active `! <cmd>` pour l’interpréteur de commandes de l’hôte. Nécessite `tools.elevated.enabled` et que l’expéditeur figure dans `tools.elevated.allowFrom.<channel>`.
- `config: true` active `/config` (lit/écrit `openclaw.json`). Pour les clients `chat.send` du Gateway, les écritures persistantes `/config set|unset` nécessitent également `operator.admin` ; la commande en lecture seule `/config show` reste accessible aux clients opérateurs normaux disposant d’une portée d’écriture.
- `mcp: true` active `/mcp` pour la configuration des serveurs MCP gérée par OpenClaw sous `mcp.servers`.
- `plugins: true` active `/plugins` pour les contrôles de découverte, d’installation, d’activation et de désactivation des Plugins.
- `channels.<provider>.configWrites` contrôle les modifications de configuration par canal (valeur par défaut : true).
- Pour les canaux à plusieurs comptes, `channels.<provider>.accounts.<id>.configWrites` contrôle également les écritures qui ciblent ce compte (par exemple `/allowlist --config --account <id>` ou `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` désactive `/restart` et les requêtes externes de redémarrage `SIGUSR1`. Valeur par défaut : `true`.
- `ownerAllowFrom` est la liste d’autorisation explicite des propriétaires pour les commandes réservées aux propriétaires et les actions de canal soumises à leur autorisation. Elle est distincte de `allowFrom`.
- `ownerDisplay: "hash"` hache les identifiants des propriétaires dans l’invite système. Définissez `ownerDisplaySecret` pour contrôler le hachage.
- `allowFrom` est propre à chaque fournisseur. Lorsqu’il est défini, il constitue l’**unique** source d’autorisation (les listes d’autorisation/l’association du canal et `useAccessGroups` sont ignorées).
- `useAccessGroups: false` permet aux commandes de contourner les politiques des groupes d’accès lorsque `allowFrom` n’est pas défini.
- Carte de la documentation des commandes :
  - catalogue intégré et groupé : [Commandes avec barre oblique](/fr/tools/slash-commands)
  - interfaces de commande propres aux canaux : [Canaux](/fr/channels)
  - commandes QQ Bot : [QQ Bot](/fr/channels/qqbot)
  - commandes d’association : [Association](/fr/channels/pairing)
  - commande de carte LINE : [LINE](/fr/channels/line)
  - rêve de la mémoire : [Dreaming](/fr/concepts/dreaming)

</Accordion>

---

## Contenu associé

- [Référence de la configuration](/fr/gateway/configuration-reference) — clés de premier niveau
- [Configuration — agents](/fr/gateway/config-agents)
- [Vue d’ensemble des canaux](/fr/channels)
