---
read_when:
    - Configurer Slack ou déboguer le mode socket/HTTP de Slack
summary: Configuration de Slack et comportement à l’exécution (mode Socket + URL de requêtes HTTP)
title: Slack
x-i18n:
    generated_at: "2026-05-04T07:02:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: d4a91fc1ae5f1e03f714308be54e164ef204809e74efabed8dc75c3035c14228
    source_path: channels/slack.md
    workflow: 16
---

Prêt pour la production pour les MD et les canaux via les intégrations d’app Slack. Le mode par défaut est Socket Mode ; les URL de requête HTTP sont également prises en charge.

<CardGroup cols={3}>
  <Card title="Appairage" icon="link" href="/fr/channels/pairing">
    Les MD Slack utilisent par défaut le mode d’appairage.
  </Card>
  <Card title="Commandes slash" icon="terminal" href="/fr/tools/slash-commands">
    Comportement des commandes natives et catalogue de commandes.
  </Card>
  <Card title="Dépannage des canaux" icon="wrench" href="/fr/channels/troubleshooting">
    Diagnostics intercanaux et procédures de réparation.
  </Card>
</CardGroup>

## Configuration rapide

<Tabs>
  <Tab title="Socket Mode (par défaut)">
    <Steps>
      <Step title="Créer une nouvelle app Slack">
        Dans les paramètres de l’app Slack, appuyez sur le bouton **[Create New App](https://api.slack.com/apps/new)** :

        - choisissez **from a manifest** et sélectionnez un espace de travail pour votre app
        - collez l’[exemple de manifeste](#manifest-and-scope-checklist) ci-dessous et continuez pour créer
        - générez un **App-Level Token** (`xapp-...`) avec `connections:write`
        - installez l’app et copiez le **Bot Token** (`xoxb-...`) affiché

      </Step>

      <Step title="Configurer OpenClaw">

        Configuration SecretRef recommandée :

```bash
export SLACK_APP_TOKEN=xapp-...
export SLACK_BOT_TOKEN=xoxb-...
cat > slack.socket.patch.json5 <<'JSON5'
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
    },
  },
}
JSON5
openclaw config patch --file ./slack.socket.patch.json5 --dry-run
openclaw config patch --file ./slack.socket.patch.json5
```

        Solution de repli avec variables d’environnement (compte par défaut uniquement) :

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Démarrer le Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="URL de requête HTTP">
    <Steps>
      <Step title="Créer une nouvelle app Slack">
        Dans les paramètres de l’app Slack, appuyez sur le bouton **[Create New App](https://api.slack.com/apps/new)** :

        - choisissez **from a manifest** et sélectionnez un espace de travail pour votre app
        - collez l’[exemple de manifeste](#manifest-and-scope-checklist) et mettez à jour les URL avant de créer
        - enregistrez le **Signing Secret** pour la vérification des requêtes
        - installez l’app et copiez le **Bot Token** (`xoxb-...`) affiché

      </Step>

      <Step title="Configurer OpenClaw">

        Configuration SecretRef recommandée :

```bash
export SLACK_BOT_TOKEN=xoxb-...
export SLACK_SIGNING_SECRET=...
cat > slack.http.patch.json5 <<'JSON5'
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      signingSecret: { source: "env", provider: "default", id: "SLACK_SIGNING_SECRET" },
      webhookPath: "/slack/events",
    },
  },
}
JSON5
openclaw config patch --file ./slack.http.patch.json5 --dry-run
openclaw config patch --file ./slack.http.patch.json5
```

        <Note>
        Utilisez des chemins Webhook uniques pour le HTTP multicomptes

        Donnez à chaque compte un `webhookPath` distinct (`/slack/events` par défaut) afin que les inscriptions n’entrent pas en conflit.
        </Note>

      </Step>

      <Step title="Démarrer le Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Réglage du transport Socket Mode

OpenClaw définit par défaut le délai d’attente pong du client Slack SDK à 15 secondes pour Socket Mode. Remplacez les paramètres de transport uniquement lorsque vous avez besoin d’un réglage propre à un espace de travail ou à un hôte :

```json5
{
  channels: {
    slack: {
      mode: "socket",
      socketMode: {
        clientPingTimeout: 20000,
        serverPingTimeout: 30000,
        pingPongLoggingEnabled: false,
      },
    },
  },
}
```

Utilisez cela uniquement pour les espaces de travail Socket Mode qui journalisent des délais d’attente de pong websocket Slack ou de ping serveur, ou qui s’exécutent sur des hôtes avec une famine connue de la boucle d’événements. `clientPingTimeout` est l’attente du pong après l’envoi d’un ping client par le SDK ; `serverPingTimeout` est l’attente des pings serveur Slack. Les messages et événements de l’app restent un état applicatif, pas des signaux de disponibilité du transport.

## Liste de contrôle du manifeste et des portées

Le manifeste de base de l’app Slack est le même pour Socket Mode et les URL de requête HTTP. Seul le bloc `settings` (et l’`url` de la commande slash) diffère.

Manifeste de base (Socket Mode par défaut) :

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

Pour le **mode URL de requête HTTP**, remplacez `settings` par la variante HTTP et ajoutez `url` à chaque commande slash. URL publique requise :

```json
{
  "features": {
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

### Paramètres de manifeste supplémentaires

Exposez différentes fonctionnalités qui étendent les paramètres par défaut ci-dessus.

Le manifeste par défaut active l’onglet **Home** de Slack App Home et s’abonne à `app_home_opened`. Lorsqu’un membre de l’espace de travail ouvre l’onglet Home, OpenClaw publie une vue Home sûre par défaut avec `views.publish` ; aucune charge utile de conversation ni configuration privée n’est incluse. L’onglet **Messages** reste activé pour les MD Slack.

<AccordionGroup>
  <Accordion title="Commandes slash natives facultatives">

    Plusieurs [commandes slash natives](#commands-and-slash-behavior) peuvent être utilisées au lieu d’une seule commande configurée, avec certaines nuances :

    - Utilisez `/agentstatus` au lieu de `/status`, car la commande `/status` est réservée.
    - Pas plus de 25 commandes slash peuvent être disponibles simultanément.

    Remplacez votre section `features.slash_commands` existante par un sous-ensemble des [commandes disponibles](/fr/tools/slash-commands#command-list) :

    <Tabs>
      <Tab title="Socket Mode (par défaut)">

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "Start a new session",
      "usage_hint": "[model]"
    },
    {
      "command": "/reset",
      "description": "Reset the current session"
    },
    {
      "command": "/compact",
      "description": "Compact the session context",
      "usage_hint": "[instructions]"
    },
    {
      "command": "/stop",
      "description": "Stop the current run"
    },
    {
      "command": "/session",
      "description": "Manage thread-binding expiry",
      "usage_hint": "idle <duration|off> or max-age <duration|off>"
    },
    {
      "command": "/think",
      "description": "Set the thinking level",
      "usage_hint": "<level>"
    },
    {
      "command": "/verbose",
      "description": "Toggle verbose output",
      "usage_hint": "on|off|full"
    },
    {
      "command": "/fast",
      "description": "Show or set fast mode",
      "usage_hint": "[status|on|off]"
    },
    {
      "command": "/reasoning",
      "description": "Toggle reasoning visibility",
      "usage_hint": "[on|off|stream]"
    },
    {
      "command": "/elevated",
      "description": "Toggle elevated mode",
      "usage_hint": "[on|off|ask|full]"
    },
    {
      "command": "/exec",
      "description": "Show or set exec defaults",
      "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
    },
    {
      "command": "/model",
      "description": "Show or set the model",
      "usage_hint": "[name|#|status]"
    },
    {
      "command": "/models",
      "description": "List providers/models",
      "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
    },
    {
      "command": "/help",
      "description": "Show the short help summary"
    },
    {
      "command": "/commands",
      "description": "Show the generated command catalog"
    },
    {
      "command": "/tools",
      "description": "Show what the current agent can use right now",
      "usage_hint": "[compact|verbose]"
    },
    {
      "command": "/agentstatus",
      "description": "Show runtime status, including provider usage/quota when available"
    },
    {
      "command": "/tasks",
      "description": "List active/recent background tasks for the current session"
    },
    {
      "command": "/context",
      "description": "Explain how context is assembled",
      "usage_hint": "[list|detail|json]"
    },
    {
      "command": "/whoami",
      "description": "Show your sender identity"
    },
    {
      "command": "/skill",
      "description": "Run a skill by name",
      "usage_hint": "<name> [input]"
    },
    {
      "command": "/btw",
      "description": "Ask a side question without changing session context",
      "usage_hint": "<question>"
    },
    {
      "command": "/side",
      "description": "Ask a side question without changing session context",
      "usage_hint": "<question>"
    },
    {
      "command": "/usage",
      "description": "Control the usage footer or show cost summary",
      "usage_hint": "off|tokens|full|cost"
    }
  ]
}
```

      </Tab>
      <Tab title="URL de requête HTTP">
        Utilisez la même liste `slash_commands` que pour Socket Mode ci-dessus, et ajoutez `"url": "https://gateway-host.example.com/slack/events"` à chaque entrée. Exemple :

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "Start a new session",
      "usage_hint": "[model]",
      "url": "https://gateway-host.example.com/slack/events"
    },
    {
      "command": "/help",
      "description": "Show the short help summary",
      "url": "https://gateway-host.example.com/slack/events"
    }
  ]
}
```

        Répétez cette valeur `url` sur chaque commande de la liste.

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Portées d’attribution facultatives (opérations d’écriture)">
    Ajoutez la portée de bot `chat:write.customize` si vous voulez que les messages sortants utilisent l’identité de l’agent actif (nom d’utilisateur et icône personnalisés) au lieu de l’identité par défaut de l’application Slack.

    Si vous utilisez une icône emoji, Slack attend la syntaxe `:emoji_name:`.

  </Accordion>
  <Accordion title="Portées facultatives du jeton utilisateur (opérations de lecture)">
    Si vous configurez `channels.slack.userToken`, les portées de lecture typiques sont :

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (si vous dépendez des lectures de recherche Slack)

  </Accordion>
</AccordionGroup>

## Modèle de jetons

- `botToken` + `appToken` sont requis pour le mode Socket.
- Le mode HTTP requiert `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` et `userToken` acceptent les chaînes en texte clair
  ou les objets SecretRef.
- Les jetons de configuration remplacent le repli env.
- Le repli env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` s’applique uniquement au compte par défaut.
- `userToken` (`xoxp-...`) est uniquement configurable (aucun repli env) et utilise par défaut un comportement en lecture seule (`userTokenReadOnly: true`).

Comportement de l’instantané d’état :

- L’inspection du compte Slack suit les champs `*Source` et `*Status`
  par identifiant (`botToken`, `appToken`, `signingSecret`, `userToken`).
- L’état est `available`, `configured_unavailable` ou `missing`.
- `configured_unavailable` signifie que le compte est configuré via SecretRef
  ou une autre source de secret non inline, mais que le chemin de commande/d’exécution actuel
  n’a pas pu résoudre la valeur réelle.
- En mode HTTP, `signingSecretStatus` est inclus ; en mode Socket, la
  paire requise est `botTokenStatus` + `appTokenStatus`.

<Tip>
Pour les actions/lectures de répertoire, le jeton utilisateur peut être préféré lorsqu’il est configuré. Pour les écritures, le jeton de bot reste préféré ; les écritures avec jeton utilisateur ne sont autorisées que lorsque `userTokenReadOnly: false` et que le jeton de bot est indisponible.
</Tip>

## Actions et garde-fous

Les actions Slack sont contrôlées par `channels.slack.actions.*`.

Groupes d’actions disponibles dans l’outillage Slack actuel :

| Groupe     | Valeur par défaut |
| ---------- | ----------------- |
| messages   | activé |
| reactions  | activé |
| pins       | activé |
| memberInfo | activé |
| emojiList  | activé |

Les actions de message Slack actuelles incluent `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` et `emoji-list`. `download-file` accepte les ID de fichiers Slack affichés dans les placeholders de fichiers entrants et renvoie des aperçus d’image pour les images ou les métadonnées de fichier local pour les autres types de fichiers.

## Contrôle d’accès et routage

<Tabs>
  <Tab title="Politique de DM">
    `channels.slack.dmPolicy` contrôle l’accès aux DM. `channels.slack.allowFrom` est la liste d’autorisation canonique des DM.

    - `pairing` (par défaut)
    - `allowlist`
    - `open` (requiert que `channels.slack.allowFrom` inclue `"*"`)
    - `disabled`

    Indicateurs DM :

    - `dm.enabled` (true par défaut)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (hérité)
    - `dm.groupEnabled` (DM de groupe false par défaut)
    - `dm.groupChannels` (liste d’autorisation MPIM facultative)

    Priorité multicomptes :

    - `channels.slack.accounts.default.allowFrom` s’applique uniquement au compte `default`.
    - Les comptes nommés héritent de `channels.slack.allowFrom` lorsque leur propre `allowFrom` n’est pas défini.
    - Les comptes nommés n’héritent pas de `channels.slack.accounts.default.allowFrom`.

    Les anciens `channels.slack.dm.policy` et `channels.slack.dm.allowFrom` sont toujours lus pour compatibilité. `openclaw doctor --fix` les migre vers `dmPolicy` et `allowFrom` lorsqu’il peut le faire sans modifier l’accès.

    L’appairage dans les DM utilise `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Politique de canal">
    `channels.slack.groupPolicy` contrôle la gestion des canaux :

    - `open`
    - `allowlist`
    - `disabled`

    La liste d’autorisation des canaux se trouve sous `channels.slack.channels` et **doit utiliser des ID de canaux Slack stables** (par exemple `C12345678`) comme clés de configuration.

    Note d’exécution : si `channels.slack` est totalement absent (configuration env uniquement), l’exécution se rabat sur `groupPolicy="allowlist"` et journalise un avertissement (même si `channels.defaults.groupPolicy` est défini).

    Résolution nom/ID :

    - les entrées de liste d’autorisation de canaux et les entrées de liste d’autorisation de DM sont résolues au démarrage lorsque l’accès au jeton le permet
    - les entrées de noms de canaux non résolues sont conservées telles que configurées, mais ignorées par défaut pour le routage
    - l’autorisation entrante et le routage des canaux privilégient l’ID par défaut ; la correspondance directe par nom d’utilisateur/slug requiert `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Les clés basées sur le nom (`#channel-name` ou `channel-name`) ne correspondent **pas** sous `groupPolicy: "allowlist"`. La recherche de canal privilégie l’ID par défaut, donc une clé basée sur le nom ne sera jamais routée correctement et tous les messages dans ce canal seront bloqués silencieusement. Cela diffère de `groupPolicy: "open"`, où la clé de canal n’est pas requise pour le routage et où une clé basée sur le nom semble fonctionner.

    Utilisez toujours l’ID du canal Slack comme clé. Pour le trouver : faites un clic droit sur le canal dans Slack → **Copier le lien** — l’ID (`C...`) apparaît à la fin de l’URL.

    Correct :

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            C12345678: { allow: true, requireMention: true },
          },
        },
      },
    }
    ```

    Incorrect (bloqué silencieusement avec `groupPolicy: "allowlist"`):

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            "#eng-my-channel": { allow: true, requireMention: true },
          },
        },
      },
    }
    ```
    </Warning>

  </Tab>

  <Tab title="Mentions et utilisateurs de canal">
    Les messages de canal sont soumis à une exigence de mention par défaut.

    Sources de mention :

    - mention explicite de l’application (`<@botId>`)
    - mention de groupe d’utilisateurs Slack (`<!subteam^S...>`) lorsque l’utilisateur bot est membre de ce groupe d’utilisateurs ; nécessite `usergroups:read`
    - motifs regex de mention (`agents.list[].groupChat.mentionPatterns`, repli `messages.groupChat.mentionPatterns`)
    - comportement implicite de fil en réponse au bot (désactivé lorsque `thread.requireExplicitMention` vaut `true`)

    Contrôles par canal (`channels.slack.channels.<id>` ; noms uniquement via la résolution au démarrage ou `dangerouslyAllowNameMatching`) :

    - `requireMention`
    - `users` (liste d’autorisation)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - format de clé `toolsBySender` : `id:`, `e164:`, `username:`, `name:`, ou caractère générique `"*"`
      (les anciennes clés sans préfixe correspondent toujours uniquement à `id:`)

    `allowBots` est conservateur pour les canaux et les canaux privés : les messages de salon rédigés par des bots sont acceptés uniquement lorsque le bot expéditeur est explicitement listé dans la liste d’autorisation `users` de ce salon, ou lorsqu’au moins un ID de propriétaire Slack explicite provenant de `channels.slack.allowFrom` est actuellement membre du salon. Les caractères génériques et les entrées de propriétaire basées sur le nom d’affichage ne satisfont pas la présence du propriétaire. La présence du propriétaire utilise Slack `conversations.members` ; assurez-vous que l’application dispose du périmètre de lecture correspondant au type de salon (`channels:read` pour les canaux publics, `groups:read` pour les canaux privés). Si la recherche des membres échoue, OpenClaw ignore le message de salon rédigé par le bot.

  </Tab>
</Tabs>

## Fils, sessions et balises de réponse

- Les DM sont acheminés comme `direct` ; les canaux comme `channel` ; les MPIM comme `group`.
- Les liaisons de route Slack acceptent les ID de pairs bruts ainsi que les formes de cible Slack telles que `channel:C12345678`, `user:U12345678` et `<@U12345678>`.
- Avec la valeur par défaut `session.dmScope=main`, les DM Slack sont regroupés dans la session principale de l’agent.
- Sessions de canal : `agent:<agentId>:slack:channel:<channelId>`.
- Les réponses dans un fil peuvent créer des suffixes de session de fil (`:thread:<threadTs>`) le cas échéant.
- La valeur par défaut de `channels.slack.thread.historyScope` est `thread` ; celle de `thread.inheritParent` est `false`.
- `channels.slack.thread.initialHistoryLimit` contrôle combien de messages de fil existants sont récupérés lorsqu’une nouvelle session de fil démarre (par défaut `20` ; définissez `0` pour désactiver).
- `channels.slack.thread.requireExplicitMention` (par défaut `false`) : lorsque défini sur `true`, supprime les mentions implicites dans les fils afin que le bot réponde uniquement aux mentions explicites `@bot` dans les fils, même lorsque le bot a déjà participé au fil. Sans cela, les réponses dans un fil auquel le bot a participé contournent le contrôle `requireMention`.

Contrôles des fils de réponse :

- `channels.slack.replyToMode` : `off|first|all|batched` (par défaut `off`)
- `channels.slack.replyToModeByChatType` : par `direct|group|channel`
- repli hérité pour les conversations directes : `channels.slack.dm.replyToMode`

Les balises de réponse manuelles sont prises en charge :

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` désactive **tous** les fils de réponse dans Slack, y compris les balises explicites `[[reply_to_*]]`. Cela diffère de Telegram, où les balises explicites restent honorées en mode `"off"`. Les fils Slack masquent les messages du canal, tandis que les réponses Telegram restent visibles en ligne.
</Note>

## Réactions d’accusé de réception

`ackReaction` envoie un emoji d’accusé de réception pendant qu’OpenClaw traite un message entrant.

Ordre de résolution :

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- repli sur l’emoji d’identité de l’agent (`agents.list[].identity.emoji`, sinon "👀")

Notes :

- Slack attend des shortcodes (par exemple `"eyes"`).
- Utilisez `""` pour désactiver la réaction pour le compte Slack ou globalement.

## Diffusion de texte en continu

`channels.slack.streaming` contrôle le comportement de l’aperçu en direct :

- `off` : désactiver la diffusion de l’aperçu en direct.
- `partial` (par défaut) : remplacer le texte d’aperçu par la dernière sortie partielle.
- `block` : ajouter des mises à jour d’aperçu par fragments.
- `progress` : afficher un texte d’état de progression pendant la génération, puis envoyer le texte final.
- `streaming.preview.toolProgress` : lorsque l’aperçu de brouillon est actif, acheminer les mises à jour d’outil/de progression vers le même message d’aperçu modifié (par défaut : `true`). Définissez `false` pour conserver des messages d’outil/de progression séparés.
- `streaming.preview.commandText` / `streaming.progress.commandText` : définir sur `status` pour conserver des lignes compactes de progression d’outil tout en masquant le texte brut de commande/d’exécution (par défaut : `raw`).

Masquer le texte brut de commande/d’exécution tout en conservant des lignes compactes de progression :

```json
{
  "channels": {
    "slack": {
      "streaming": {
        "mode": "progress",
        "progress": {
          "toolProgress": true,
          "commandText": "status"
        }
      }
    }
  }
}
```

`channels.slack.streaming.nativeTransport` contrôle la diffusion native de texte Slack lorsque `channels.slack.streaming.mode` vaut `partial` (par défaut : `true`).

- Un fil de réponse doit être disponible pour que la diffusion native de texte et l’état de fil de l’assistant Slack apparaissent. La sélection du fil suit toujours `replyToMode`.
- Les racines de canaux, de conversations de groupe et de DM de premier niveau peuvent toujours utiliser l’aperçu de brouillon normal lorsque la diffusion native est indisponible ou qu’aucun fil de réponse n’existe.
- Les DM Slack de premier niveau restent hors fil par défaut ; ils n’affichent donc pas l’aperçu de diffusion/état natif de style fil de Slack. OpenClaw publie et modifie plutôt un aperçu de brouillon dans le DM.
- Les médias et les charges utiles non textuelles reviennent à la livraison normale.
- Les finaux média/erreur annulent les modifications d’aperçu en attente ; les finaux texte/bloc éligibles ne sont vidés que lorsqu’ils peuvent modifier l’aperçu en place.
- Si la diffusion échoue au milieu d’une réponse, OpenClaw revient à la livraison normale pour les charges utiles restantes.

Utiliser l’aperçu de brouillon au lieu de la diffusion native de texte Slack :

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "partial",
        nativeTransport: false,
      },
    },
  },
}
```

Clés héritées :

- `channels.slack.streamMode` (`replace | status_final | append`) est automatiquement migré vers `channels.slack.streaming.mode`.
- le booléen `channels.slack.streaming` est automatiquement migré vers `channels.slack.streaming.mode` et `channels.slack.streaming.nativeTransport`.
- l’ancien `channels.slack.nativeStreaming` est automatiquement migré vers `channels.slack.streaming.nativeTransport`.

## Repli de réaction de saisie

`typingReaction` ajoute une réaction temporaire au message Slack entrant pendant qu’OpenClaw traite une réponse, puis la retire lorsque l’exécution se termine. C’est surtout utile en dehors des réponses de fil, qui utilisent un indicateur d’état par défaut « is typing... ».

Ordre de résolution :

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Notes :

- Slack attend des shortcodes (par exemple `"hourglass_flowing_sand"`).
- La réaction est appliquée au mieux et le nettoyage est tenté automatiquement une fois le chemin de réponse ou d’échec terminé.

## Médias, découpage et livraison

<AccordionGroup>
  <Accordion title="Inbound attachments">
    Les pièces jointes de fichier Slack sont téléchargées depuis les URL privées hébergées par Slack (flux de requête authentifiée par jeton) et écrites dans le magasin de médias lorsque la récupération réussit et que les limites de taille le permettent. Les placeholders de fichier incluent le `fileId` Slack afin que les agents puissent récupérer le fichier original avec `download-file`.

    Les téléchargements utilisent des délais d’inactivité et totaux bornés. Si la récupération de fichier Slack se bloque ou échoue, OpenClaw continue à traiter le message et se rabat sur le placeholder de fichier.

    Le plafond de taille entrante à l’exécution vaut par défaut `20MB`, sauf s’il est remplacé par `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Outbound text and files">
    - les fragments de texte utilisent `channels.slack.textChunkLimit` (4000 par défaut)
    - `channels.slack.chunkMode="newline"` active un découpage donnant la priorité aux paragraphes
    - les envois de fichiers utilisent les API de téléversement Slack et peuvent inclure des réponses de fil (`thread_ts`)
    - le plafond de médias sortants suit `channels.slack.mediaMaxMb` lorsqu’il est configuré ; sinon les envois de canal utilisent les valeurs par défaut par type MIME du pipeline média

  </Accordion>

  <Accordion title="Delivery targets">
    Cibles explicites préférées :

    - `user:<id>` pour les DM
    - `channel:<id>` pour les canaux

    Les DM Slack contenant uniquement du texte ou des blocs peuvent publier directement vers des ID utilisateur ; les téléversements de fichiers et les envois dans des fils ouvrent d’abord le DM via les API de conversation Slack, car ces chemins nécessitent un ID de conversation concret.

  </Accordion>
</AccordionGroup>

## Commandes et comportement slash

Les commandes slash apparaissent dans Slack soit comme une commande configurée unique, soit comme plusieurs commandes natives. Configurez `channels.slack.slashCommand` pour modifier les valeurs par défaut des commandes :

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Les commandes natives nécessitent des [paramètres de manifeste supplémentaires](#additional-manifest-settings) dans votre application Slack et sont activées avec `channels.slack.commands.native: true` ou `commands.native: true` dans les configurations globales à la place.

- Le mode automatique des commandes natives est **désactivé** pour Slack ; `commands.native: "auto"` n’active donc pas les commandes natives Slack.

```txt
/help
```

Les menus d’arguments natifs utilisent une stratégie de rendu adaptative qui affiche une fenêtre modale de confirmation avant de distribuer une valeur d’option sélectionnée :

- jusqu’à 5 options : blocs de boutons
- 6 à 100 options : menu de sélection statique
- plus de 100 options : sélection externe avec filtrage asynchrone des options lorsque les gestionnaires d’options d’interactivité sont disponibles
- limites Slack dépassées : les valeurs d’option encodées se rabattent sur des boutons

```txt
/think
```

Les sessions slash utilisent des clés isolées comme `agent:<agentId>:slack:slash:<userId>` et acheminent toujours les exécutions de commandes vers la session de conversation cible avec `CommandTargetSessionKey`.

## Réponses interactives

Slack peut afficher des contrôles de réponse interactive rédigés par l’agent, mais cette fonctionnalité est désactivée par défaut.

Activez-la globalement :

```json5
{
  channels: {
    slack: {
      capabilities: {
        interactiveReplies: true,
      },
    },
  },
}
```

Ou activez-la pour un seul compte Slack :

```json5
{
  channels: {
    slack: {
      accounts: {
        ops: {
          capabilities: {
            interactiveReplies: true,
          },
        },
      },
    },
  },
}
```

Une fois activée, les agents peuvent émettre des directives de réponse propres à Slack :

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Ces directives sont compilées en Slack Block Kit et réacheminent les clics ou sélections via le chemin d’événement d’interaction Slack existant.

Notes :

- Il s’agit d’une interface propre à Slack. Les autres canaux ne traduisent pas les directives Slack Block Kit dans leurs propres systèmes de boutons.
- Les valeurs de rappel interactives sont des jetons opaques générés par OpenClaw, et non des valeurs brutes rédigées par l’agent.
- Si les blocs interactifs générés dépassaient les limites de Slack Block Kit, OpenClaw se rabat sur la réponse textuelle originale au lieu d’envoyer une charge utile de blocs invalide.

## Approbations d’exécution dans Slack

Slack peut agir comme client d’approbation natif avec des boutons et interactions interactifs, au lieu de se rabattre sur l’interface Web ou le terminal.

- Les approbations d’exécution utilisent `channels.slack.execApprovals.*` pour le routage DM/canal natif.
- Les approbations de Plugin peuvent toujours se résoudre via la même surface de boutons native Slack lorsque la requête arrive déjà dans Slack et que le type d’ID d’approbation est `plugin:`.
- L’autorisation des approbateurs reste appliquée : seuls les utilisateurs identifiés comme approbateurs peuvent approuver ou refuser des requêtes via Slack.

Cela utilise la même surface partagée de boutons d’approbation que les autres canaux. Lorsque `interactivity` est activé dans les paramètres de votre application Slack, les invites d’approbation s’affichent comme des boutons Block Kit directement dans la conversation.
Lorsque ces boutons sont présents, ils constituent l’UX d’approbation principale ; OpenClaw
ne doit inclure une commande `/approve` manuelle que lorsque le résultat de l’outil indique que les approbations
par chat sont indisponibles ou que l’approbation manuelle est le seul chemin.

Chemin de configuration :

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (facultatif ; se rabat sur `commands.ownerAllowFrom` lorsque possible)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, valeur par défaut : `dm`)
- `agentFilter`, `sessionFilter`

Slack active automatiquement les approbations d’exécution natives lorsque `enabled` n’est pas défini ou vaut `"auto"` et qu’au moins un
approbateur est résolu. Définissez `enabled: false` pour désactiver explicitement Slack comme client d’approbation natif.
Définissez `enabled: true` pour forcer les approbations natives lorsque des approbateurs sont résolus.

Comportement par défaut sans configuration explicite d’approbation d’exécution Slack :

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

La configuration native Slack explicite n’est nécessaire que lorsque vous souhaitez remplacer les approbateurs, ajouter des filtres ou
opter pour la livraison dans le chat d’origine :

```json5
{
  channels: {
    slack: {
      execApprovals: {
        enabled: true,
        approvers: ["U12345678"],
        target: "both",
      },
    },
  },
}
```

Le transfert partagé `approvals.exec` est distinct. Utilisez-le uniquement lorsque les invites d’approbation d’exécution doivent aussi
être routées vers d’autres chats ou des cibles hors bande explicites. Le transfert partagé `approvals.plugin` est également
distinct ; les boutons natifs Slack peuvent toujours résoudre les approbations de Plugin lorsque ces requêtes arrivent déjà
dans Slack.

`/approve` dans le même chat fonctionne aussi dans les canaux Slack et les DM qui prennent déjà en charge les commandes. Consultez [Approbations d’exécution](/fr/tools/exec-approvals) pour le modèle complet de transfert d’approbation.

## Événements et comportement opérationnel

- Les modifications/suppressions de messages sont mappées vers des événements système.
- Les diffusions de fil (réponses de fil « Also send to channel ») sont traitées comme des messages utilisateur normaux.
- Les événements d’ajout/retrait de réaction sont mappés vers des événements système.
- Les événements d’arrivée/départ de membre, de création/renommage de canal et d’ajout/retrait d’épingle sont mappés vers des événements système.
- `channel_id_changed` peut migrer les clés de configuration de canal lorsque `configWrites` est activé.
- Les métadonnées de sujet/objectif de canal sont traitées comme du contexte non fiable et peuvent être injectées dans le contexte de routage.
- Le démarrage de fil et l’amorçage du contexte d’historique initial de fil sont filtrés par les listes d’autorisation d’expéditeurs configurées lorsqu’elles s’appliquent.
- Les actions de bloc et les interactions modales émettent des événements système structurés `Slack interaction: ...` avec des champs de charge utile riches :
  - actions de bloc : valeurs sélectionnées, libellés, valeurs de sélecteur et métadonnées `workflow_*`
  - événements modaux `view_submission` et `view_closed` avec métadonnées de canal routées et entrées de formulaire

## Référence de configuration

Référence principale : [Référence de configuration - Slack](/fr/gateway/config-channels#slack).

<Accordion title="High-signal Slack fields">

- mode/authentification : `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- accès DM : `dm.enabled`, `dmPolicy`, `allowFrom` (hérité : `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- bascule de compatibilité : `dangerouslyAllowNameMatching` (option d’urgence ; gardez-la désactivée sauf nécessité)
- accès aux canaux : `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- fils/historique : `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- livraison : `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- opérations/fonctionnalités : `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Dépannage

<AccordionGroup>
  <Accordion title="No replies in channels">
    Vérifiez, dans l’ordre :

    - `groupPolicy`
    - liste d’autorisation de canaux (`channels.slack.channels`) — **les clés doivent être des ID de canal** (`C12345678`), pas des noms (`#channel-name`). Les clés basées sur le nom échouent silencieusement sous `groupPolicy: "allowlist"` parce que le routage de canal privilégie les ID par défaut. Pour trouver un ID : faites un clic droit sur le canal dans Slack → **Copy link** — la valeur `C...` à la fin de l’URL est l’ID du canal.
    - `requireMention`
    - liste d’autorisation `users` par canal

    Commandes utiles :

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="DM messages ignored">
    Vérifiez :

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (ou l’ancien `channels.slack.dm.policy`)
    - approbations d’appairage / entrées de liste d’autorisation
    - Événements DM de Slack Assistant : les journaux détaillés mentionnant `drop message_changed`
      signifient généralement que Slack a envoyé un événement de fil Assistant modifié sans
      expéditeur humain récupérable dans les métadonnées du message

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode not connecting">
    Validez les jetons bot + app et l’activation de Socket Mode dans les paramètres de l’application Slack.

    Si `openclaw channels status --probe --json` affiche `botTokenStatus` ou
    `appTokenStatus: "configured_unavailable"`, le compte Slack est
    configuré, mais l’exécution actuelle n’a pas pu résoudre la valeur adossée à SecretRef.

  </Accordion>

  <Accordion title="HTTP mode not receiving events">
    Validez :

    - le secret de signature
    - le chemin Webhook
    - les URL de requête Slack (événements + interactivité + commandes slash)
    - `webhookPath` unique par compte HTTP

    Si `signingSecretStatus: "configured_unavailable"` apparaît dans les instantanés de compte,
    le compte HTTP est configuré, mais l’exécution actuelle n’a pas pu
    résoudre le secret de signature adossé à SecretRef.

  </Accordion>

  <Accordion title="Native/slash commands not firing">
    Vérifiez ce que vous vouliez utiliser :

    - mode de commande native (`channels.slack.commands.native: true`) avec des commandes slash correspondantes enregistrées dans Slack
    - ou mode de commande slash unique (`channels.slack.slashCommand.enabled: true`)

    Vérifiez également `commands.useAccessGroups` et les listes d’autorisation de canal/utilisateur.

  </Accordion>
</AccordionGroup>

## Référence de vision des pièces jointes

Slack peut joindre les médias téléchargés au tour de l’agent lorsque les téléchargements de fichiers Slack réussissent et que les limites de taille le permettent. Les fichiers image peuvent passer par le chemin de compréhension des médias ou directement vers un modèle de réponse compatible avec la vision ; les autres fichiers sont conservés comme contexte de fichier téléchargeable plutôt que traités comme entrée image.

### Types de médias pris en charge

| Type de média                  | Source               | Comportement actuel                                                               | Notes                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Images JPEG / PNG / GIF / WebP | URL de fichier Slack | Téléchargées et jointes au tour pour une prise en charge compatible avec la vision | Limite par fichier : `channels.slack.mediaMaxMb` (par défaut 20 Mo)       |
| Fichiers PDF                   | URL de fichier Slack | Téléchargés et exposés comme contexte de fichier pour des outils tels que `download-file` ou `pdf` | L’entrée Slack ne convertit pas automatiquement les PDF en entrée de vision d’image |
| Autres fichiers                | URL de fichier Slack | Téléchargés lorsque c’est possible et exposés comme contexte de fichier           | Les fichiers binaires ne sont pas traités comme entrée d’image            |
| Réponses de fil                | Fichiers du message initial du fil | Les fichiers du message racine peuvent être hydratés comme contexte lorsque la réponse n’a pas de média direct | Les messages initiaux ne contenant que des fichiers utilisent un placeholder de pièce jointe |
| Messages multi-images          | Plusieurs fichiers Slack | Chaque fichier est évalué indépendamment                                          | Le traitement Slack est limité à huit fichiers par message                |

### Pipeline entrant

Lorsqu’un message Slack avec des pièces jointes de fichier arrive :

1. OpenClaw télécharge le fichier depuis l’URL privée de Slack à l’aide du token de bot (`xoxb-...`).
2. Le fichier est écrit dans le stockage des médias en cas de réussite.
3. Les chemins des médias téléchargés et les types de contenu sont ajoutés au contexte entrant.
4. Les chemins de modèle/outil compatibles avec l’image peuvent utiliser les pièces jointes d’image depuis ce contexte.
5. Les fichiers non image restent disponibles comme métadonnées de fichier ou références média pour les outils capables de les traiter.

### Héritage des pièces jointes de la racine du fil

Lorsqu’un message arrive dans un fil (avec un parent `thread_ts`) :

- Si la réponse elle-même n’a pas de média direct et que le message racine inclus contient des fichiers, Slack peut hydrater les fichiers racine comme contexte du message initial du fil.
- Les pièces jointes directes de la réponse sont prioritaires sur les pièces jointes du message racine.
- Un message racine qui ne contient que des fichiers et aucun texte est représenté avec un placeholder de pièce jointe afin que le fallback puisse toujours inclure ses fichiers.

### Gestion de plusieurs pièces jointes

Lorsqu’un seul message Slack contient plusieurs pièces jointes de fichier :

- Chaque pièce jointe est traitée indépendamment via le pipeline média.
- Les références des médias téléchargés sont agrégées dans le contexte du message.
- L’ordre de traitement suit l’ordre des fichiers Slack dans la charge utile de l’événement.
- L’échec du téléchargement d’une pièce jointe ne bloque pas les autres.

### Limites de taille, de téléchargement et de modèle

- **Limite de taille** : 20 Mo par fichier par défaut. Configurable via `channels.slack.mediaMaxMb`.
- **Échecs de téléchargement** : Les fichiers que Slack ne peut pas servir, les URL expirées, les fichiers inaccessibles, les fichiers trop volumineux et les réponses HTML d’authentification/connexion Slack sont ignorés au lieu d’être signalés comme formats non pris en charge.
- **Modèle de vision** : L’analyse d’image utilise le modèle de réponse actif lorsqu’il prend en charge la vision, ou le modèle d’image configuré dans `agents.defaults.imageModel`.

### Limites connues

| Scénario                               | Comportement actuel                                                          | Solution de contournement                                                   |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| URL de fichier Slack expirée           | Fichier ignoré ; aucune erreur affichée                                      | Téléverser à nouveau le fichier dans Slack                                 |
| Modèle de vision non configuré         | Les pièces jointes d’image sont stockées comme références média, mais ne sont pas analysées comme images | Configurer `agents.defaults.imageModel` ou utiliser un modèle de réponse compatible avec la vision |
| Images très volumineuses (> 20 Mo par défaut) | Ignorées selon la limite de taille                                           | Augmenter `channels.slack.mediaMaxMb` si Slack l’autorise                  |
| Pièces jointes transférées/partagées   | Le texte et les médias image/fichier hébergés par Slack sont traités au mieux | Repartager directement dans le fil OpenClaw                                |
| Pièces jointes PDF                     | Stockées comme contexte de fichier/média, sans routage automatique via la vision d’image | Utiliser `download-file` pour les métadonnées de fichier ou l’outil `pdf` pour l’analyse PDF |

### Documentation associée

- [Pipeline de compréhension des médias](/fr/nodes/media-understanding)
- [Outil PDF](/fr/tools/pdf)
- Épopée : [#51349](https://github.com/openclaw/openclaw/issues/51349) — Activation de la vision pour les pièces jointes Slack
- Tests de régression : [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Vérification en direct : [#51354](https://github.com/openclaw/openclaw/issues/51354)

## Associé

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/fr/channels/pairing">
    Associer un utilisateur Slack au Gateway.
  </Card>
  <Card title="Groups" icon="users" href="/fr/channels/groups">
    Comportement des canaux et des MP de groupe.
  </Card>
  <Card title="Channel routing" icon="route" href="/fr/channels/channel-routing">
    Router les messages entrants vers des agents.
  </Card>
  <Card title="Security" icon="shield" href="/fr/gateway/security">
    Modèle de menace et durcissement.
  </Card>
  <Card title="Configuration" icon="sliders" href="/fr/gateway/configuration">
    Agencement et précédence de la configuration.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/fr/tools/slash-commands">
    Catalogue et comportement des commandes.
  </Card>
</CardGroup>
