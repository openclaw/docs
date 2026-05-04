---
read_when:
    - Configuration de Slack ou débogage du mode socket/HTTP de Slack
summary: Configuration de Slack et comportement à l’exécution (mode Socket + URL de requête HTTP)
title: Slack
x-i18n:
    generated_at: "2026-05-04T02:22:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2be45f03511a64373b1f4316c59800eeeef8baccb4c00454b49999258b2e546b
    source_path: channels/slack.md
    workflow: 16
---

Prêt pour la production pour les DM et les canaux via les intégrations d’application Slack. Le mode par défaut est Socket Mode ; les URL de requête HTTP sont également prises en charge.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/fr/channels/pairing">
    Les DM Slack utilisent le mode d’association par défaut.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/fr/tools/slash-commands">
    Comportement des commandes natives et catalogue des commandes.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/fr/channels/troubleshooting">
    Diagnostics inter-canaux et guides de réparation.
  </Card>
</CardGroup>

## Configuration rapide

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Create a new Slack app">
        Dans les paramètres de l’application Slack, appuyez sur le bouton **[Create New App](https://api.slack.com/apps/new)** :

        - choisissez **from a manifest** et sélectionnez un espace de travail pour votre application
        - collez le [manifeste d’exemple](#manifest-and-scope-checklist) ci-dessous et continuez pour créer
        - générez un **App-Level Token** (`xapp-...`) avec `connections:write`
        - installez l’application et copiez le **Bot Token** (`xoxb-...`) affiché

      </Step>

      <Step title="Configure OpenClaw">

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

        Repli par variable d’environnement (compte par défaut uniquement) :

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Request URLs">
    <Steps>
      <Step title="Create a new Slack app">
        Dans les paramètres de l’application Slack, appuyez sur le bouton **[Create New App](https://api.slack.com/apps/new)** :

        - choisissez **from a manifest** et sélectionnez un espace de travail pour votre application
        - collez le [manifeste d’exemple](#manifest-and-scope-checklist) et mettez à jour les URL avant la création
        - enregistrez le **Signing Secret** pour la vérification des requêtes
        - installez l’application et copiez le **Bot Token** (`xoxb-...`) affiché

      </Step>

      <Step title="Configure OpenClaw">

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

        Attribuez à chaque compte un `webhookPath` distinct (`/slack/events` par défaut) afin que les enregistrements n’entrent pas en conflit.
        </Note>

      </Step>

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Réglage du transport Socket Mode

OpenClaw définit par défaut le délai d’attente pong du client SDK Slack à 15 secondes pour Socket Mode. Ne remplacez les paramètres de transport que lorsque vous avez besoin d’un réglage propre à l’espace de travail ou à l’hôte :

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

Utilisez cela uniquement pour les espaces de travail Socket Mode qui journalisent des délais d’attente pong/websocket ou server-ping Slack, ou qui s’exécutent sur des hôtes avec une famine connue de la boucle d’événements. `clientPingTimeout` est l’attente du pong après que le SDK a envoyé un ping client ; `serverPingTimeout` est l’attente des pings serveur Slack. Les messages et événements d’application restent de l’état applicatif, pas des signaux de vivacité du transport.

## Liste de contrôle du manifeste et des portées

Le manifeste de base de l’application Slack est le même pour Socket Mode et les URL de requête HTTP. Seul le bloc `settings` (et l’`url` de la commande slash) diffère.

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

Pour le **mode URL de requête HTTP**, remplacez `settings` par la variante HTTP et ajoutez `url` à chaque commande slash. Une URL publique est requise :

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

### Paramètres supplémentaires du manifeste

Exposez différentes fonctionnalités qui étendent les valeurs par défaut ci-dessus.

Le manifeste par défaut active l’onglet **Home** de Slack App Home et s’abonne à `app_home_opened`. Lorsqu’un membre de l’espace de travail ouvre l’onglet Home, OpenClaw publie une vue Home sûre par défaut avec `views.publish` ; aucune charge utile de conversation ni configuration privée n’est incluse. L’onglet **Messages** reste activé pour les DM Slack.

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    Plusieurs [commandes slash natives](#commands-and-slash-behavior) peuvent être utilisées à la place d’une seule commande configurée, avec quelques nuances :

    - Utilisez `/agentstatus` au lieu de `/status`, car la commande `/status` est réservée.
    - Pas plus de 25 commandes slash ne peuvent être rendues disponibles à la fois.

    Remplacez votre section `features.slash_commands` existante par un sous-ensemble des [commandes disponibles](/fr/tools/slash-commands#command-list) :

    <Tabs>
      <Tab title="Socket Mode (default)">

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
      <Tab title="HTTP Request URLs">
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
  <Accordion title="Portées d’auteur facultatives (opérations d’écriture)">
    Ajoutez la portée de bot `chat:write.customize` si vous voulez que les messages sortants utilisent l’identité de l’agent actif (nom d’utilisateur et icône personnalisés) au lieu de l’identité par défaut de l’application Slack.

    Si vous utilisez une icône emoji, Slack attend la syntaxe `:emoji_name:`.

  </Accordion>
  <Accordion title="Portées facultatives de jeton utilisateur (opérations de lecture)">
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

## Modèle de jeton

- `botToken` + `appToken` sont requis pour le Socket Mode.
- Le mode HTTP nécessite `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` et `userToken` acceptent des chaînes en texte brut
  ou des objets SecretRef.
- Les jetons de configuration remplacent le recours aux variables d’environnement.
- Le recours aux variables d’environnement `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` s’applique uniquement au compte par défaut.
- `userToken` (`xoxp-...`) est uniquement configurable (aucun recours aux variables d’environnement) et utilise par défaut un comportement en lecture seule (`userTokenReadOnly: true`).

Comportement de l’instantané d’état :

- L’inspection des comptes Slack suit les champs `*Source` et `*Status`
  par identifiant d’accès (`botToken`, `appToken`, `signingSecret`, `userToken`).
- L’état est `available`, `configured_unavailable` ou `missing`.
- `configured_unavailable` signifie que le compte est configuré via SecretRef
  ou une autre source de secret non intégrée, mais que la commande ou le chemin d’exécution actuel
  n’a pas pu résoudre la valeur réelle.
- En mode HTTP, `signingSecretStatus` est inclus ; en Socket Mode, la
  paire requise est `botTokenStatus` + `appTokenStatus`.

<Tip>
Pour les actions et les lectures d’annuaire, le jeton utilisateur peut être préféré lorsqu’il est configuré. Pour les écritures, le jeton de bot reste préféré ; les écritures avec jeton utilisateur ne sont autorisées que lorsque `userTokenReadOnly: false` et que le jeton de bot est indisponible.
</Tip>

## Actions et contrôles

Les actions Slack sont contrôlées par `channels.slack.actions.*`.

Groupes d’actions disponibles dans l’outillage Slack actuel :

| Groupe     | Par défaut |
| ---------- | ---------- |
| messages   | activé     |
| reactions  | activé     |
| pins       | activé     |
| memberInfo | activé     |
| emojiList  | activé     |

Les actions de message Slack actuelles incluent `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` et `emoji-list`. `download-file` accepte les ID de fichiers Slack affichés dans les placeholders de fichiers entrants et renvoie des aperçus d’image pour les images ou des métadonnées de fichier local pour les autres types de fichiers.

## Contrôle d’accès et routage

<Tabs>
  <Tab title="Politique de MP">
    `channels.slack.dmPolicy` contrôle l’accès aux MP. `channels.slack.allowFrom` est la liste d’autorisation canonique des MP.

    - `pairing` (par défaut)
    - `allowlist`
    - `open` (nécessite que `channels.slack.allowFrom` inclue `"*"`)
    - `disabled`

    Options de MP :

    - `dm.enabled` (true par défaut)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (hérité)
    - `dm.groupEnabled` (MP de groupe false par défaut)
    - `dm.groupChannels` (liste d’autorisation MPIM facultative)

    Précédence multi-comptes :

    - `channels.slack.accounts.default.allowFrom` s’applique uniquement au compte `default`.
    - Les comptes nommés héritent de `channels.slack.allowFrom` lorsque leur propre `allowFrom` n’est pas défini.
    - Les comptes nommés n’héritent pas de `channels.slack.accounts.default.allowFrom`.

    Les anciens `channels.slack.dm.policy` et `channels.slack.dm.allowFrom` sont toujours lus pour compatibilité. `openclaw doctor --fix` les migre vers `dmPolicy` et `allowFrom` lorsqu’il peut le faire sans modifier l’accès.

    L’association dans les MP utilise `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Politique de canal">
    `channels.slack.groupPolicy` contrôle la gestion des canaux :

    - `open`
    - `allowlist`
    - `disabled`

    La liste d’autorisation des canaux se trouve sous `channels.slack.channels` et **doit utiliser des ID de canal Slack stables** (par exemple `C12345678`) comme clés de configuration.

    Note d’exécution : si `channels.slack` est complètement absent (configuration uniquement par variables d’environnement), l’exécution revient à `groupPolicy="allowlist"` et journalise un avertissement (même si `channels.defaults.groupPolicy` est défini).

    Résolution nom/ID :

    - les entrées de liste d’autorisation de canal et les entrées de liste d’autorisation de MP sont résolues au démarrage lorsque l’accès par jeton le permet
    - les entrées de nom de canal non résolues sont conservées comme configurées, mais ignorées par défaut pour le routage
    - l’autorisation entrante et le routage des canaux sont centrés sur l’ID par défaut ; la correspondance directe par nom d’utilisateur ou slug nécessite `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Les clés basées sur le nom (`#channel-name` ou `channel-name`) ne correspondent **pas** avec `groupPolicy: "allowlist"`. La recherche de canal est centrée sur l’ID par défaut, donc une clé basée sur le nom ne sera jamais routée correctement et tous les messages de ce canal seront bloqués silencieusement. Cela diffère de `groupPolicy: "open"`, où la clé du canal n’est pas requise pour le routage et où une clé basée sur le nom semble fonctionner.

    Utilisez toujours l’ID de canal Slack comme clé. Pour le trouver : faites un clic droit sur le canal dans Slack → **Copier le lien** — l’ID (`C...`) apparaît à la fin de l’URL.

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

    Incorrect (bloqué silencieusement avec `groupPolicy: "allowlist"`) :

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
    Les messages de canal sont soumis à une mention par défaut.

    Sources de mention :

    - mention explicite de l’application (`<@botId>`)
    - mention de groupe d’utilisateurs Slack (`<!subteam^S...>`) lorsque l’utilisateur bot est membre de ce groupe d’utilisateurs ; nécessite `usergroups:read`
    - motifs regex de mention (`agents.list[].groupChat.mentionPatterns`, recours à `messages.groupChat.mentionPatterns`)
    - comportement implicite des fils répondant au bot (désactivé lorsque `thread.requireExplicitMention` vaut `true`)

    Contrôles par canal (`channels.slack.channels.<id>` ; noms uniquement via la résolution au démarrage ou `dangerouslyAllowNameMatching`) :

    - `requireMention`
    - `users` (liste d’autorisation)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - format de clé `toolsBySender` : caractères génériques `id:`, `e164:`, `username:`, `name:` ou `"*"`
      (les anciennes clés sans préfixe correspondent toujours uniquement à `id:`)

    `allowBots` est conservateur pour les canaux et les canaux privés : les messages de salon rédigés par un bot ne sont acceptés que lorsque le bot expéditeur est explicitement répertorié dans la liste d’autorisation `users` de ce salon, ou lorsqu’au moins un ID de propriétaire Slack explicite provenant de `channels.slack.allowFrom` est actuellement membre du salon. Les caractères génériques et les entrées de propriétaire par nom d’affichage ne satisfont pas la présence du propriétaire. La présence du propriétaire utilise Slack `conversations.members` ; assurez-vous que l’application dispose de la portée de lecture correspondante pour le type de salon (`channels:read` pour les canaux publics, `groups:read` pour les canaux privés). Si la recherche de membres échoue, OpenClaw abandonne le message de salon rédigé par un bot.

  </Tab>
</Tabs>

## Fils, sessions et balises de réponse

- Les MP sont routés comme `direct` ; les canaux comme `channel` ; les MPIM comme `group`.
- Les liaisons de route Slack acceptent les ID bruts de pair ainsi que les formes de cible Slack comme `channel:C12345678`, `user:U12345678` et `<@U12345678>`.
- Avec `session.dmScope=main` par défaut, les MP Slack sont regroupés dans la session principale de l’agent.
- Sessions de canal : `agent:<agentId>:slack:channel:<channelId>`.
- Les réponses de fil peuvent créer des suffixes de session de fil (`:thread:<threadTs>`) le cas échéant.
- La valeur par défaut de `channels.slack.thread.historyScope` est `thread` ; la valeur par défaut de `thread.inheritParent` est `false`.
- `channels.slack.thread.initialHistoryLimit` contrôle combien de messages de fil existants sont récupérés lorsqu’une nouvelle session de fil démarre (par défaut `20` ; définissez `0` pour désactiver).
- `channels.slack.thread.requireExplicitMention` (par défaut `false`) : lorsque `true`, supprime les mentions implicites dans les fils afin que le bot ne réponde qu’aux mentions explicites `@bot` dans les fils, même lorsque le bot a déjà participé au fil. Sans cela, les réponses dans un fil auquel le bot a participé contournent le contrôle `requireMention`.

Contrôles des fils de réponse :

- `channels.slack.replyToMode` : `off|first|all|batched` (par défaut `off`)
- `channels.slack.replyToModeByChatType` : par `direct|group|channel`
- recours hérité pour les conversations directes : `channels.slack.dm.replyToMode`

Les balises de réponse manuelles sont prises en charge :

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` désactive **tous** les fils de réponse dans Slack, y compris les balises explicites `[[reply_to_*]]`. Cela diffère de Telegram, où les balises explicites sont toujours honorées en mode `"off"`. Les fils Slack masquent les messages du canal, tandis que les réponses Telegram restent visibles en ligne.
</Note>

## Réactions d’accusé de réception

`ackReaction` envoie un emoji d’accusé de réception pendant qu’OpenClaw traite un message entrant.

Ordre de résolution :

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- recours à l’emoji de l’identité de l’agent (`agents.list[].identity.emoji`, sinon "👀")

Notes :

- Slack attend des shortcodes (par exemple `"eyes"`).
- Utilisez `""` pour désactiver la réaction pour le compte Slack ou globalement.

## Diffusion du texte

`channels.slack.streaming` contrôle le comportement d’aperçu en direct :

- `off` : désactiver la diffusion d’aperçu en direct.
- `partial` (par défaut) : remplacer le texte d’aperçu par la dernière sortie partielle.
- `block` : ajouter des mises à jour d’aperçu par fragments.
- `progress` : afficher le texte d’état de progression pendant la génération, puis envoyer le texte final.
- `streaming.preview.toolProgress` : lorsque l’aperçu de brouillon est actif, router les mises à jour d’outil/progression vers le même message d’aperçu modifié (par défaut : `true`). Définissez `false` pour conserver des messages d’outil/progression séparés.

`channels.slack.streaming.nativeTransport` contrôle la diffusion de texte native Slack lorsque `channels.slack.streaming.mode` vaut `partial` (par défaut : `true`).

- Un fil de réponse doit être disponible pour que la diffusion de texte native et l’état de fil d’assistant Slack apparaissent. La sélection du fil suit toujours `replyToMode`.
- Les canaux, les discussions de groupe et les racines de MP de premier niveau peuvent toujours utiliser l’aperçu de brouillon normal lorsque la diffusion native est indisponible ou qu’aucun fil de réponse n’existe.
- Les MP Slack de premier niveau restent hors fil par défaut ; ils n’affichent donc pas l’aperçu de flux/état natif de style fil de Slack ; OpenClaw publie et modifie plutôt un aperçu de brouillon dans le MP.
- Les médias et les charges utiles non textuelles reviennent à la livraison normale.
- Les résultats finaux de média/erreur annulent les modifications d’aperçu en attente ; les résultats finaux de texte/bloc admissibles ne sont envoyés que lorsqu’ils peuvent modifier l’aperçu sur place.
- Si la diffusion échoue au milieu d’une réponse, OpenClaw revient à la livraison normale pour les charges utiles restantes.

Utilisez l’aperçu de brouillon au lieu de la diffusion de texte native Slack :

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

Anciennes clés :

- `channels.slack.streamMode` (`replace | status_final | append`) est migré automatiquement vers `channels.slack.streaming.mode`.
- le booléen `channels.slack.streaming` est migré automatiquement vers `channels.slack.streaming.mode` et `channels.slack.streaming.nativeTransport`.
- l’ancien `channels.slack.nativeStreaming` est migré automatiquement vers `channels.slack.streaming.nativeTransport`.

## Recours par réaction de saisie

`typingReaction` ajoute une réaction temporaire au message Slack entrant pendant qu’OpenClaw traite une réponse, puis la supprime lorsque l’exécution se termine. C’est particulièrement utile en dehors des réponses de fil, qui utilisent un indicateur d’état par défaut "est en train d’écrire...".

Ordre de résolution :

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Notes :

- Slack attend des shortcodes (par exemple `"hourglass_flowing_sand"`).
- La réaction est appliquée au mieux, et le nettoyage est tenté automatiquement une fois le chemin de réponse ou d’échec terminé.

## Médias, découpage en fragments et livraison

<AccordionGroup>
  <Accordion title="Pièces jointes entrantes">
    Les pièces jointes Slack sont téléchargées depuis des URL privées hébergées par Slack (flux de requête authentifié par jeton) et écrites dans le magasin de médias lorsque la récupération réussit et que les limites de taille le permettent. Les espaces réservés de fichier incluent le `fileId` Slack afin que les agents puissent récupérer le fichier d’origine avec `download-file`.

    Les téléchargements utilisent des délais d’expiration bornés pour l’inactivité et la durée totale. Si la récupération de fichier Slack se bloque ou échoue, OpenClaw continue de traiter le message et revient à l’espace réservé du fichier.

    La limite de taille entrante à l’exécution est par défaut de `20MB`, sauf remplacement par `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Texte et fichiers sortants">
    - les fragments de texte utilisent `channels.slack.textChunkLimit` (4000 par défaut)
    - `channels.slack.chunkMode="newline"` active un découpage donnant la priorité aux paragraphes
    - les envois de fichiers utilisent les API d’import Slack et peuvent inclure des réponses de fil (`thread_ts`)
    - la limite de médias sortants suit `channels.slack.mediaMaxMb` lorsqu’elle est configurée ; sinon, les envois de canal utilisent les valeurs par défaut par type MIME du pipeline de médias

  </Accordion>

  <Accordion title="Cibles de livraison">
    Cibles explicites préférées :

    - `user:<id>` pour les messages directs
    - `channel:<id>` pour les canaux

    Les messages directs Slack contenant uniquement du texte ou des blocs peuvent être publiés directement vers des identifiants utilisateur ; les imports de fichiers et les envois en fil ouvrent d’abord le message direct via les API de conversation Slack, car ces chemins nécessitent un identifiant de conversation concret.

  </Accordion>
</AccordionGroup>

## Commandes et comportement des commandes slash

Les commandes slash apparaissent dans Slack soit comme une seule commande configurée, soit comme plusieurs commandes natives. Configurez `channels.slack.slashCommand` pour modifier les valeurs par défaut des commandes :

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Les commandes natives nécessitent des [paramètres de manifeste supplémentaires](#additional-manifest-settings) dans votre application Slack et sont plutôt activées avec `channels.slack.commands.native: true` ou `commands.native: true` dans les configurations globales.

- Le mode automatique des commandes natives est **désactivé** pour Slack, donc `commands.native: "auto"` n’active pas les commandes natives Slack.

```txt
/help
```

Les menus d’arguments natifs utilisent une stratégie de rendu adaptative qui affiche une fenêtre modale de confirmation avant de distribuer la valeur d’option sélectionnée :

- jusqu’à 5 options : blocs de boutons
- 6 à 100 options : menu de sélection statique
- plus de 100 options : sélection externe avec filtrage asynchrone des options lorsque des gestionnaires d’options d’interactivité sont disponibles
- limites Slack dépassées : les valeurs d’option encodées reviennent à des boutons

```txt
/think
```

Les sessions slash utilisent des clés isolées comme `agent:<agentId>:slack:slash:<userId>` et routent toujours les exécutions de commandes vers la session de conversation cible à l’aide de `CommandTargetSessionKey`.

## Réponses interactives

Slack peut afficher des contrôles de réponse interactifs rédigés par l’agent, mais cette fonctionnalité est désactivée par défaut.

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

Lorsqu’elle est activée, les agents peuvent émettre des directives de réponse propres à Slack :

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Ces directives sont compilées en Slack Block Kit et routent les clics ou les sélections via le chemin d’événements d’interaction Slack existant.

Remarques :

- Il s’agit d’une interface propre à Slack. Les autres canaux ne traduisent pas les directives Slack Block Kit dans leurs propres systèmes de boutons.
- Les valeurs de rappel interactif sont des jetons opaques générés par OpenClaw, et non des valeurs brutes rédigées par l’agent.
- Si les blocs interactifs générés dépassaient les limites de Slack Block Kit, OpenClaw revient à la réponse textuelle d’origine au lieu d’envoyer une charge utile de blocs invalide.

## Approbations d’exécution dans Slack

Slack peut agir comme client d’approbation natif avec des boutons et interactions interactifs, au lieu de revenir à l’interface web ou au terminal.

- Les approbations d’exécution utilisent `channels.slack.execApprovals.*` pour le routage natif des messages directs/canaux.
- Les approbations de Plugin peuvent toujours se résoudre via la même surface de boutons native Slack lorsque la demande arrive déjà dans Slack et que le type d’identifiant d’approbation est `plugin:`.
- L’autorisation de l’approbateur reste appliquée : seuls les utilisateurs identifiés comme approbateurs peuvent approuver ou refuser des demandes via Slack.

Cela utilise la même surface partagée de boutons d’approbation que les autres canaux. Lorsque `interactivity` est activé dans les paramètres de votre application Slack, les invites d’approbation s’affichent sous forme de boutons Block Kit directement dans la conversation.
Lorsque ces boutons sont présents, ils constituent l’expérience d’approbation principale ; OpenClaw
ne doit inclure une commande manuelle `/approve` que lorsque le résultat de l’outil indique que les
approbations par chat sont indisponibles ou que l’approbation manuelle est le seul chemin.

Chemin de configuration :

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (facultatif ; revient à `commands.ownerAllowFrom` lorsque possible)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, par défaut : `dm`)
- `agentFilter`, `sessionFilter`

Slack active automatiquement les approbations d’exécution natives lorsque `enabled` n’est pas défini ou vaut `"auto"` et qu’au moins un
approbateur est résolu. Définissez `enabled: false` pour désactiver explicitement Slack comme client d’approbation natif.
Définissez `enabled: true` pour forcer l’activation des approbations natives lorsque des approbateurs sont résolus.

Comportement par défaut sans configuration explicite des approbations d’exécution Slack :

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Une configuration native Slack explicite n’est nécessaire que lorsque vous souhaitez remplacer les approbateurs, ajouter des filtres ou
opter pour la livraison vers le chat d’origine :

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

Le transfert partagé `approvals.exec` est séparé. Utilisez-le uniquement lorsque les invites d’approbation d’exécution doivent aussi
être routées vers d’autres chats ou des cibles explicites hors bande. Le transfert partagé `approvals.plugin` est également
séparé ; les boutons natifs Slack peuvent toujours résoudre les approbations de Plugin lorsque ces demandes arrivent déjà
dans Slack.

La commande `/approve` dans le même chat fonctionne également dans les canaux et messages directs Slack qui prennent déjà en charge les commandes. Consultez [Approbations d’exécution](/fr/tools/exec-approvals) pour le modèle complet de transfert des approbations.

## Événements et comportement opérationnel

- Les modifications/suppressions de messages sont mappées en événements système.
- Les diffusions de fil (réponses de fil « Envoyer aussi au canal ») sont traitées comme des messages utilisateur normaux.
- Les événements d’ajout/suppression de réactions sont mappés en événements système.
- Les événements d’arrivée/départ de membres, de création/renommage de canal et d’ajout/suppression d’épingles sont mappés en événements système.
- `channel_id_changed` peut migrer les clés de configuration de canal lorsque `configWrites` est activé.
- Les métadonnées de sujet/objectif de canal sont traitées comme du contexte non approuvé et peuvent être injectées dans le contexte de routage.
- L’amorçage du contexte de démarreur de fil et d’historique initial de fil est filtré par les listes d’autorisation d’expéditeurs configurées, le cas échéant.
- Les actions de blocs et les interactions de modales émettent des événements système structurés `Slack interaction: ...` avec des champs de charge utile riches :
  - actions de blocs : valeurs sélectionnées, libellés, valeurs de sélecteur et métadonnées `workflow_*`
  - événements de modale `view_submission` et `view_closed` avec métadonnées de canal routées et entrées de formulaire

## Référence de configuration

Référence principale : [Référence de configuration - Slack](/fr/gateway/config-channels#slack).

<Accordion title="Champs Slack à fort signal">

- mode/authentification : `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- accès aux messages directs : `dm.enabled`, `dmPolicy`, `allowFrom` (héritage : `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- bascule de compatibilité : `dangerouslyAllowNameMatching` (solution d’urgence ; laissez désactivé sauf nécessité)
- accès aux canaux : `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- fils/historique : `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- livraison : `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- opérations/fonctionnalités : `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Dépannage

<AccordionGroup>
  <Accordion title="Aucune réponse dans les canaux">
    Vérifiez, dans l’ordre :

    - `groupPolicy`
    - liste d’autorisation des canaux (`channels.slack.channels`) — **les clés doivent être des identifiants de canal** (`C12345678`), pas des noms (`#channel-name`). Les clés fondées sur les noms échouent silencieusement avec `groupPolicy: "allowlist"`, car le routage de canal utilise d’abord les identifiants par défaut. Pour trouver un identifiant : faites un clic droit sur le canal dans Slack → **Copier le lien** — la valeur `C...` à la fin de l’URL est l’identifiant du canal.
    - `requireMention`
    - liste d’autorisation `users` propre au canal

    Commandes utiles :

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="Messages directs ignorés">
    Vérifiez :

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (ou l’héritage `channels.slack.dm.policy`)
    - approbations d’association / entrées de liste d’autorisation
    - Événements de message direct de l’assistant Slack : les journaux détaillés mentionnant `drop message_changed`
      signifient généralement que Slack a envoyé un événement de fil Assistant modifié sans
      expéditeur humain récupérable dans les métadonnées du message

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Le mode socket ne se connecte pas">
    Validez les jetons de bot et d’application ainsi que l’activation du Socket Mode dans les paramètres de l’application Slack.

    Si `openclaw channels status --probe --json` affiche `botTokenStatus` ou
    `appTokenStatus: "configured_unavailable"`, le compte Slack est
    configuré, mais l’exécution actuelle n’a pas pu résoudre la valeur adossée à SecretRef.

  </Accordion>

  <Accordion title="Le mode HTTP ne reçoit pas les événements">
    Validez :

    - le secret de signature
    - le chemin Webhook
    - les URL de requête Slack (événements + interactivité + commandes slash)
    - un `webhookPath` unique par compte HTTP

    Si `signingSecretStatus: "configured_unavailable"` apparaît dans les
    instantanés de compte, le compte HTTP est configuré, mais l’exécution actuelle n’a pas pu
    résoudre le secret de signature adossé à SecretRef.

  </Accordion>

  <Accordion title="Les commandes natives/slash ne se déclenchent pas">
    Vérifiez ce que vous aviez l’intention d’utiliser :

    - le mode de commande native (`channels.slack.commands.native: true`) avec des commandes slash correspondantes enregistrées dans Slack
    - ou le mode de commande slash unique (`channels.slack.slashCommand.enabled: true`)

    Vérifiez également `commands.useAccessGroups` ainsi que les listes d’autorisation de canaux/utilisateurs.

  </Accordion>
</AccordionGroup>

## Référence de vision pour les pièces jointes

Slack peut joindre les médias téléchargés au tour de l’agent lorsque les téléchargements de fichiers Slack réussissent et que les limites de taille le permettent. Les fichiers image peuvent passer par le chemin de compréhension des médias ou directement vers un modèle de réponse compatible vision ; les autres fichiers sont conservés comme contexte de fichier téléchargeable plutôt que traités comme entrée image.

### Types de médias pris en charge

| Type de média                  | Source               | Comportement actuel                                                              | Notes                                                                     |
| ------------------------------ | -------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Images JPEG / PNG / GIF / WebP | URL de fichier Slack | Téléchargées et jointes au tour pour une gestion compatible avec la vision       | Limite par fichier : `channels.slack.mediaMaxMb` (20 Mo par défaut)       |
| Fichiers PDF                   | URL de fichier Slack | Téléchargés et exposés comme contexte de fichier pour des outils comme `download-file` ou `pdf` | Le flux entrant Slack ne convertit pas automatiquement les PDF en entrée de vision d’image |
| Autres fichiers                | URL de fichier Slack | Téléchargés lorsque possible et exposés comme contexte de fichier                | Les fichiers binaires ne sont pas traités comme entrée d’image            |
| Réponses de fil                | Fichiers du message initial du fil | Les fichiers du message racine peuvent être hydratés comme contexte lorsque la réponse n’a aucun média direct | Les messages initiaux contenant uniquement des fichiers utilisent un espace réservé de pièce jointe |
| Messages multi-images          | Plusieurs fichiers Slack | Chaque fichier est évalué indépendamment                                        | Le traitement Slack est limité à huit fichiers par message                |

### Pipeline entrant

Lorsqu’un message Slack avec des pièces jointes de fichier arrive :

1. OpenClaw télécharge le fichier depuis l’URL privée de Slack à l’aide du jeton du bot (`xoxb-...`).
2. Le fichier est écrit dans le stockage média en cas de succès.
3. Les chemins des médias téléchargés et les types de contenu sont ajoutés au contexte entrant.
4. Les chemins de modèle ou d’outil compatibles avec les images peuvent utiliser les pièces jointes d’image de ce contexte.
5. Les fichiers non image restent disponibles comme métadonnées de fichier ou références média pour les outils capables de les gérer.

### Héritage des pièces jointes de la racine du fil

Lorsqu’un message arrive dans un fil (avec un parent `thread_ts`) :

- Si la réponse elle-même n’a aucun média direct et que le message racine inclus contient des fichiers, Slack peut hydrater les fichiers racine comme contexte du message initial du fil.
- Les pièces jointes directes de la réponse ont priorité sur les pièces jointes du message racine.
- Un message racine qui ne contient que des fichiers et aucun texte est représenté avec un espace réservé de pièce jointe afin que le repli puisse toujours inclure ses fichiers.

### Gestion de plusieurs pièces jointes

Lorsqu’un seul message Slack contient plusieurs pièces jointes de fichier :

- Chaque pièce jointe est traitée indépendamment via le pipeline média.
- Les références média téléchargées sont agrégées dans le contexte du message.
- L’ordre de traitement suit l’ordre des fichiers Slack dans la charge utile de l’événement.
- L’échec du téléchargement d’une pièce jointe ne bloque pas les autres.

### Limites de taille, de téléchargement et de modèle

- **Limite de taille** : 20 Mo par fichier par défaut. Configurable via `channels.slack.mediaMaxMb`.
- **Échecs de téléchargement** : Les fichiers que Slack ne peut pas servir, les URL expirées, les fichiers inaccessibles, les fichiers trop volumineux et les réponses HTML d’authentification/connexion Slack sont ignorés au lieu d’être signalés comme formats non pris en charge.
- **Modèle de vision** : L’analyse d’image utilise le modèle de réponse actif lorsqu’il prend en charge la vision, ou le modèle d’image configuré dans `agents.defaults.imageModel`.

### Limites connues

| Scénario                               | Comportement actuel                                                         | Solution de contournement                                                   |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| URL de fichier Slack expirée           | Fichier ignoré ; aucune erreur affichée                                      | Retéléverser le fichier dans Slack                                          |
| Modèle de vision non configuré         | Les pièces jointes d’image sont stockées comme références média, mais ne sont pas analysées comme images | Configurer `agents.defaults.imageModel` ou utiliser un modèle de réponse compatible avec la vision |
| Images très volumineuses (> 20 Mo par défaut) | Ignorées selon la limite de taille                                           | Augmenter `channels.slack.mediaMaxMb` si Slack l’autorise                   |
| Pièces jointes transférées/partagées   | Le texte et les médias image/fichier hébergés par Slack sont traités au mieux | Repartager directement dans le fil OpenClaw                                 |
| Pièces jointes PDF                     | Stockées comme contexte fichier/média, sans routage automatique par la vision d’image | Utiliser `download-file` pour les métadonnées de fichier ou l’outil `pdf` pour l’analyse PDF |

### Documentation associée

- [Pipeline de compréhension des médias](/fr/nodes/media-understanding)
- [Outil PDF](/fr/tools/pdf)
- Épopée : [#51349](https://github.com/openclaw/openclaw/issues/51349) — Activation de la vision pour les pièces jointes Slack
- Tests de régression : [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Vérification en direct : [#51354](https://github.com/openclaw/openclaw/issues/51354)

## Associé

<CardGroup cols={2}>
  <Card title="Appairage" icon="link" href="/fr/channels/pairing">
    Associer un utilisateur Slack au Gateway.
  </Card>
  <Card title="Groupes" icon="users" href="/fr/channels/groups">
    Comportement des canaux et des MP de groupe.
  </Card>
  <Card title="Routage des canaux" icon="route" href="/fr/channels/channel-routing">
    Acheminer les messages entrants vers les agents.
  </Card>
  <Card title="Sécurité" icon="shield" href="/fr/gateway/security">
    Modèle de menace et durcissement.
  </Card>
  <Card title="Configuration" icon="sliders" href="/fr/gateway/configuration">
    Structure et priorité de la configuration.
  </Card>
  <Card title="Commandes slash" icon="terminal" href="/fr/tools/slash-commands">
    Catalogue et comportement des commandes.
  </Card>
</CardGroup>
