---
read_when:
    - Configurer Slack ou déboguer le mode socket/HTTP de Slack
summary: Configuration de Slack et comportement d’exécution (Socket Mode + URL de requête HTTP)
title: Slack
x-i18n:
    generated_at: "2026-05-02T06:59:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 60e06b138e1579156ccd07bb6db1a25009be970d072ba500b61810c5b78fd01d
    source_path: channels/slack.md
    workflow: 16
---

Prêt pour la production pour les messages directs et les canaux via les intégrations d’app Slack. Le mode par défaut est Socket Mode ; les URL de requête HTTP sont également prises en charge.

<CardGroup cols={3}>
  <Card title="Appairage" icon="link" href="/fr/channels/pairing">
    Les messages directs Slack utilisent par défaut le mode d’appairage.
  </Card>
  <Card title="Commandes slash" icon="terminal" href="/fr/tools/slash-commands">
    Comportement natif des commandes et catalogue des commandes.
  </Card>
  <Card title="Dépannage des canaux" icon="wrench" href="/fr/channels/troubleshooting">
    Diagnostics intercanaux et guides de réparation.
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

        Repli par variables d’environnement (compte par défaut uniquement) :

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
        - collez l’[exemple de manifeste](#manifest-and-scope-checklist) et mettez à jour les URL avant la création
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

        Donnez à chaque compte un `webhookPath` distinct (`/slack/events` par défaut) afin que les enregistrements n’entrent pas en collision.
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

OpenClaw définit par défaut le délai d’attente pong du client SDK Slack à 15 secondes pour Socket Mode. Remplacez les paramètres de transport uniquement lorsque vous avez besoin d’un réglage propre à l’espace de travail ou à l’hôte :

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

Utilisez cela uniquement pour les espaces de travail Socket Mode qui journalisent des délais d’attente pong/ping serveur du websocket Slack, ou qui s’exécutent sur des hôtes présentant une famine connue de la boucle d’événements. `clientPingTimeout` est l’attente du pong après l’envoi d’un ping client par le SDK ; `serverPingTimeout` est l’attente des pings du serveur Slack. Les messages et événements de l’app restent de l’état applicatif, pas des signaux de disponibilité du transport.

## Manifeste et liste de contrôle des portées

Le manifeste de base de l’app Slack est identique pour Socket Mode et les URL de requête HTTP. Seul le bloc `settings` (et l’`url` de la commande slash) diffère.

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
        /* same as Socket Mode */
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

Exposez différentes fonctionnalités qui étendent les valeurs par défaut ci-dessus.

Le manifeste par défaut active l’onglet **Home** de Slack App Home et s’abonne à `app_home_opened`. Lorsqu’un membre de l’espace de travail ouvre l’onglet Home, OpenClaw publie une vue Home sûre par défaut avec `views.publish` ; aucune charge utile de conversation ni configuration privée n’est incluse. L’onglet **Messages** reste activé pour les messages directs Slack.

<AccordionGroup>
  <Accordion title="Commandes slash natives facultatives">

    Plusieurs [commandes slash natives](#commands-and-slash-behavior) peuvent être utilisées à la place d’une seule commande configurée, avec les nuances suivantes :

    - Utilisez `/agentstatus` au lieu de `/status`, car la commande `/status` est réservée.
    - Pas plus de 25 commandes slash peuvent être mises à disposition à la fois.

    Remplacez votre section `features.slash_commands` existante par un sous-ensemble des [commandes disponibles](/fr/tools/slash-commands#command-list) :

    <Tabs>
      <Tab title="Socket Mode (par défaut)">

```json
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
        "command": "/usage",
        "description": "Control the usage footer or show cost summary",
        "usage_hint": "off|tokens|full|cost"
      }
    ]
```

      </Tab>
      <Tab title="URL de requête HTTP">
        Utilisez la même liste `slash_commands` que pour Socket Mode ci-dessus, et ajoutez `"url": "https://gateway-host.example.com/slack/events"` à chaque entrée. Exemple :

```json
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
      // ...repeat for every command with the same `url` value
    ]
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Portées d’attribution facultatives (opérations d’écriture)">
    Ajoutez la portée de bot `chat:write.customize` si vous voulez que les messages sortants utilisent l’identité de l’agent actif (nom d’utilisateur et icône personnalisés) au lieu de l’identité par défaut de l’app Slack.

    Si vous utilisez une icône emoji, Slack attend la syntaxe `:emoji_name:`.

  </Accordion>
  <Accordion title="Optional user-token scopes (read operations)">
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
- Le mode HTTP nécessite `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` et `userToken` acceptent les chaînes
  en texte clair ou les objets SecretRef.
- Les jetons de configuration remplacent le repli env.
- Le repli env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` s’applique uniquement au compte par défaut.
- `userToken` (`xoxp-...`) est uniquement configurable (pas de repli env) et utilise par défaut un comportement en lecture seule (`userTokenReadOnly: true`).

Comportement de l’instantané d’état :

- L’inspection des comptes Slack suit les champs `*Source` et `*Status`
  par identifiant (`botToken`, `appToken`, `signingSecret`, `userToken`).
- L’état est `available`, `configured_unavailable` ou `missing`.
- `configured_unavailable` signifie que le compte est configuré via SecretRef
  ou une autre source secrète non inline, mais que le chemin de commande/runtime actuel
  n’a pas pu résoudre la valeur réelle.
- En mode HTTP, `signingSecretStatus` est inclus ; en mode Socket, la
  paire requise est `botTokenStatus` + `appTokenStatus`.

<Tip>
Pour les actions/lectures d’annuaire, le jeton utilisateur peut être préféré lorsqu’il est configuré. Pour les écritures, le jeton de bot reste préféré ; les écritures avec jeton utilisateur ne sont autorisées que lorsque `userTokenReadOnly: false` et que le jeton de bot est indisponible.
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
  <Tab title="DM policy">
    `channels.slack.dmPolicy` contrôle l’accès aux messages directs. `channels.slack.allowFrom` est la liste d’autorisation canonique pour les messages directs.

    - `pairing` (par défaut)
    - `allowlist`
    - `open` (nécessite que `channels.slack.allowFrom` inclue `"*"`)
    - `disabled`

    Indicateurs de messages directs :

    - `dm.enabled` (true par défaut)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (hérité)
    - `dm.groupEnabled` (messages directs de groupe désactivés par défaut)
    - `dm.groupChannels` (liste d’autorisation MPIM facultative)

    Priorité multicomptes :

    - `channels.slack.accounts.default.allowFrom` s’applique uniquement au compte `default`.
    - Les comptes nommés héritent de `channels.slack.allowFrom` quand leur propre `allowFrom` n’est pas défini.
    - Les comptes nommés n’héritent pas de `channels.slack.accounts.default.allowFrom`.

    Les anciennes clés `channels.slack.dm.policy` et `channels.slack.dm.allowFrom` sont encore lues pour compatibilité. `openclaw doctor --fix` les migre vers `dmPolicy` et `allowFrom` lorsqu’il peut le faire sans modifier l’accès.

    L’appairage dans les messages directs utilise `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Channel policy">
    `channels.slack.groupPolicy` contrôle la gestion des canaux :

    - `open`
    - `allowlist`
    - `disabled`

    La liste d’autorisation des canaux se trouve sous `channels.slack.channels` et **doit utiliser des ID de canal Slack stables** (par exemple `C12345678`) comme clés de configuration.

    Note runtime : si `channels.slack` est complètement absent (configuration uniquement par env), le runtime se rabat sur `groupPolicy="allowlist"` et journalise un avertissement (même si `channels.defaults.groupPolicy` est défini).

    Résolution nom/ID :

    - les entrées de liste d’autorisation de canaux et les entrées de liste d’autorisation de messages directs sont résolues au démarrage lorsque l’accès au jeton le permet
    - les entrées de noms de canaux non résolues sont conservées telles qu’elles sont configurées, mais ignorées par défaut pour le routage
    - l’autorisation entrante et le routage de canal utilisent d’abord l’ID par défaut ; la correspondance directe par nom d’utilisateur/slug nécessite `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Les clés basées sur le nom (`#channel-name` ou `channel-name`) ne correspondent **pas** sous `groupPolicy: "allowlist"`. La recherche de canal utilise d’abord l’ID par défaut, donc une clé basée sur le nom ne sera jamais routée avec succès et tous les messages dans ce canal seront bloqués silencieusement. Cela diffère de `groupPolicy: "open"`, où la clé de canal n’est pas requise pour le routage et où une clé basée sur le nom semble fonctionner.

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

    Incorrect (bloqué silencieusement sous `groupPolicy: "allowlist"`) :

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

  <Tab title="Mentions and channel users">
    Les messages de canal exigent une mention par défaut.

    Sources de mention :

    - mention explicite de l’app (`<@botId>`)
    - mention de groupe d’utilisateurs Slack (`<!subteam^S...>`) lorsque l’utilisateur bot est membre de ce groupe d’utilisateurs ; nécessite `usergroups:read`
    - motifs regex de mention (`agents.list[].groupChat.mentionPatterns`, repli `messages.groupChat.mentionPatterns`)
    - comportement implicite de réponse à un thread du bot (désactivé lorsque `thread.requireExplicitMention` est `true`)

    Contrôles par canal (`channels.slack.channels.<id>` ; noms uniquement via résolution au démarrage ou `dangerouslyAllowNameMatching`) :

    - `requireMention`
    - `users` (liste d’autorisation)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - format de clé `toolsBySender` : `id:`, `e164:`, `username:`, `name:` ou caractère générique `"*"`
      (les anciennes clés sans préfixe correspondent encore uniquement à `id:`)

    `allowBots` est conservateur pour les canaux et les canaux privés : les messages de salon rédigés par des bots ne sont acceptés que lorsque le bot émetteur est explicitement répertorié dans la liste d’autorisation `users` de ce salon, ou lorsqu’au moins un ID de propriétaire Slack explicite issu de `channels.slack.allowFrom` est actuellement membre du salon. Les caractères génériques et les entrées de propriétaire par nom d’affichage ne satisfont pas la présence du propriétaire. La présence du propriétaire utilise `conversations.members` de Slack ; assurez-vous que l’app dispose de la portée de lecture correspondante pour le type de salon (`channels:read` pour les canaux publics, `groups:read` pour les canaux privés). Si la recherche des membres échoue, OpenClaw supprime le message de salon rédigé par le bot.

  </Tab>
</Tabs>

## Threads, sessions et balises de réponse

- Les messages directs sont routés comme `direct` ; les canaux comme `channel` ; les MPIM comme `group`.
- Les liaisons de route Slack acceptent les ID de pairs bruts ainsi que les formes de cible Slack telles que `channel:C12345678`, `user:U12345678` et `<@U12345678>`.
- Avec la valeur par défaut `session.dmScope=main`, les messages directs Slack sont regroupés dans la session principale de l’agent.
- Sessions de canal : `agent:<agentId>:slack:channel:<channelId>`.
- Les réponses de thread peuvent créer des suffixes de session de thread (`:thread:<threadTs>`) le cas échéant.
- La valeur par défaut de `channels.slack.thread.historyScope` est `thread` ; celle de `thread.inheritParent` est `false`.
- `channels.slack.thread.initialHistoryLimit` contrôle le nombre de messages de thread existants récupérés lorsqu’une nouvelle session de thread démarre (par défaut `20` ; définissez `0` pour désactiver).
- `channels.slack.thread.requireExplicitMention` (`false` par défaut) : lorsque `true`, supprime les mentions implicites dans les threads afin que le bot ne réponde qu’aux mentions explicites `@bot` dans les threads, même lorsque le bot a déjà participé au thread. Sans cela, les réponses dans un thread auquel le bot a participé contournent le contrôle `requireMention`.

Contrôles du threading de réponse :

- `channels.slack.replyToMode` : `off|first|all|batched` (`off` par défaut)
- `channels.slack.replyToModeByChatType` : par `direct|group|channel`
- repli hérité pour les discussions directes : `channels.slack.dm.replyToMode`

Les balises de réponse manuelles sont prises en charge :

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` désactive **tout** threading de réponse dans Slack, y compris les balises explicites `[[reply_to_*]]`. Cela diffère de Telegram, où les balises explicites sont encore respectées en mode `"off"`. Les threads Slack masquent les messages du canal, tandis que les réponses Telegram restent visibles inline.
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

## Streaming de texte

`channels.slack.streaming` contrôle le comportement d’aperçu en direct :

- `off` : désactiver le streaming d’aperçu en direct.
- `partial` (par défaut) : remplacer le texte d’aperçu par la dernière sortie partielle.
- `block` : ajouter des mises à jour d’aperçu par blocs.
- `progress` : afficher le texte d’état de progression pendant la génération, puis envoyer le texte final.
- `streaming.preview.toolProgress` : lorsque l’aperçu de brouillon est actif, router les mises à jour d’outil/progression dans le même message d’aperçu modifié (par défaut : `true`). Définissez `false` pour conserver des messages d’outil/progression séparés.

`channels.slack.streaming.nativeTransport` contrôle le streaming de texte natif Slack lorsque `channels.slack.streaming.mode` est `partial` (par défaut : `true`).

- Un thread de réponse doit être disponible pour que le streaming de texte natif et l’état de thread assistant Slack apparaissent. La sélection du thread suit toujours `replyToMode`.
- Les racines de canaux et de discussions de groupe peuvent toujours utiliser l’aperçu de brouillon normal lorsque le streaming natif est indisponible.
- Les messages directs Slack de premier niveau restent hors thread par défaut, ils n’affichent donc pas l’aperçu de style thread ; utilisez des réponses de thread ou `typingReaction` si vous voulez une progression visible à cet endroit.
- Les médias et charges utiles non textuelles se rabattent sur la livraison normale.
- Les finaux de médias/erreurs annulent les modifications d’aperçu en attente ; les finaux de texte/bloc admissibles ne sont vidés que lorsqu’ils peuvent modifier l’aperçu en place.
- Si le streaming échoue au milieu d’une réponse, OpenClaw se rabat sur la livraison normale pour les charges utiles restantes.

Utiliser l’aperçu de brouillon au lieu du streaming de texte natif Slack :

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
- l’ancienne clé `channels.slack.nativeStreaming` est migrée automatiquement vers `channels.slack.streaming.nativeTransport`.

## Repli de réaction de saisie

`typingReaction` ajoute une réaction temporaire au message Slack entrant pendant qu’OpenClaw traite une réponse, puis la supprime lorsque l’exécution se termine. C’est surtout utile en dehors des réponses de thread, qui utilisent un indicateur d’état par défaut « est en train d’écrire... ».

Ordre de résolution :

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Notes :

- Slack attend des shortcodes (par exemple `"hourglass_flowing_sand"`).
- La réaction est au mieux de l’effort disponible et le nettoyage est tenté automatiquement une fois le chemin de réponse ou d’échec terminé.

## Médias, découpage en morceaux et livraison

<AccordionGroup>
  <Accordion title="Pièces jointes entrantes">
    Les pièces jointes Slack sont téléchargées depuis des URL privées hébergées par Slack (flux de requêtes authentifiées par jeton) et écrites dans le stockage de médias lorsque la récupération réussit et que les limites de taille le permettent. Les espaces réservés de fichiers incluent le `fileId` Slack afin que les agents puissent récupérer le fichier d’origine avec `download-file`.

    Les téléchargements utilisent des délais d’expiration bornés pour l’inactivité et la durée totale. Si la récupération de fichiers Slack se bloque ou échoue, OpenClaw continue de traiter le message et revient à l’espace réservé du fichier.

    Le plafond de taille entrante à l’exécution est de `20MB` par défaut, sauf remplacement par `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Texte et fichiers sortants">
    - les fragments de texte utilisent `channels.slack.textChunkLimit` (4000 par défaut)
    - `channels.slack.chunkMode="newline"` active le découpage prioritaire par paragraphe
    - les envois de fichiers utilisent les API de téléversement Slack et peuvent inclure des réponses de fil (`thread_ts`)
    - le plafond des médias sortants suit `channels.slack.mediaMaxMb` lorsqu’il est configuré ; sinon, les envois de canal utilisent les valeurs par défaut par catégorie MIME du pipeline média

  </Accordion>

  <Accordion title="Cibles de livraison">
    Cibles explicites préférées :

    - `user:<id>` pour les messages directs
    - `channel:<id>` pour les canaux

    Les messages directs Slack limités au texte et aux blocs peuvent publier directement vers des ID utilisateur ; les téléversements de fichiers et les envois en fil ouvrent d’abord la conversation directe via les API de conversations Slack, car ces chemins nécessitent un ID de conversation concret.

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

Les commandes natives nécessitent [des paramètres de manifeste supplémentaires](#additional-manifest-settings) dans votre application Slack et sont plutôt activées avec `channels.slack.commands.native: true` ou `commands.native: true` dans les configurations globales.

- Le mode automatique des commandes natives est **désactivé** pour Slack, donc `commands.native: "auto"` n’active pas les commandes natives Slack.

```txt
/help
```

Les menus d’arguments natifs utilisent une stratégie de rendu adaptatif qui affiche une fenêtre modale de confirmation avant d’envoyer la valeur d’option sélectionnée :

- jusqu’à 5 options : blocs de boutons
- 6 à 100 options : menu de sélection statique
- plus de 100 options : sélection externe avec filtrage asynchrone des options lorsque des gestionnaires d’options d’interactivité sont disponibles
- limites Slack dépassées : les valeurs d’option encodées se rabattent sur des boutons

```txt
/think
```

Les sessions de commandes slash utilisent des clés isolées comme `agent:<agentId>:slack:slash:<userId>` et acheminent toujours les exécutions de commandes vers la session de conversation cible avec `CommandTargetSessionKey`.

## Réponses interactives

Slack peut afficher des contrôles de réponse interactive définis par l’agent, mais cette fonctionnalité est désactivée par défaut.

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

Une fois la fonctionnalité activée, les agents peuvent émettre des directives de réponse propres à Slack :

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Ces directives sont compilées en Slack Block Kit et réacheminent les clics ou les sélections via le chemin d’événements d’interaction Slack existant.

Notes :

- Il s’agit d’une interface utilisateur propre à Slack. Les autres canaux ne traduisent pas les directives Slack Block Kit vers leurs propres systèmes de boutons.
- Les valeurs de rappel interactif sont des jetons opaques générés par OpenClaw, et non des valeurs brutes définies par l’agent.
- Si les blocs interactifs générés dépassaient les limites de Slack Block Kit, OpenClaw revient à la réponse textuelle d’origine au lieu d’envoyer une charge utile de blocs invalide.

## Approbations d’exécution dans Slack

Slack peut agir comme un client d’approbation natif avec des boutons interactifs et des interactions, au lieu de revenir à l’interface Web ou au terminal.

- Les approbations d’exécution utilisent `channels.slack.execApprovals.*` pour le routage natif des messages directs et des canaux.
- Les approbations de Plugin peuvent toujours être résolues via la même surface de boutons native Slack lorsque la demande arrive déjà dans Slack et que le type d’ID d’approbation est `plugin:`.
- L’autorisation des approbateurs reste appliquée : seuls les utilisateurs identifiés comme approbateurs peuvent approuver ou refuser des demandes via Slack.

Cela utilise la même surface partagée de boutons d’approbation que les autres canaux. Lorsque `interactivity` est activé dans les paramètres de votre application Slack, les invites d’approbation s’affichent comme des boutons Block Kit directement dans la conversation.
Lorsque ces boutons sont présents, ils constituent l’expérience d’approbation principale ; OpenClaw
ne doit inclure une commande manuelle `/approve` que lorsque le résultat de l’outil indique que les approbations par chat
sont indisponibles ou que l’approbation manuelle est le seul chemin possible.

Chemin de configuration :

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (facultatif ; se rabat sur `commands.ownerAllowFrom` lorsque c’est possible)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, par défaut : `dm`)
- `agentFilter`, `sessionFilter`

Slack active automatiquement les approbations d’exécution natives lorsque `enabled` n’est pas défini ou vaut `"auto"` et qu’au moins un
approbateur peut être résolu. Définissez `enabled: false` pour désactiver explicitement Slack comme client d’approbation natif.
Définissez `enabled: true` pour forcer l’activation des approbations natives lorsque des approbateurs peuvent être résolus.

Comportement par défaut sans configuration explicite des approbations d’exécution Slack :

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Une configuration native Slack explicite n’est nécessaire que lorsque vous voulez remplacer les approbateurs, ajouter des filtres ou
opter pour la livraison vers la conversation d’origine :

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

Le transfert partagé `approvals.exec` est distinct. Utilisez-le uniquement lorsque les invites d’approbation d’exécution doivent également
être acheminées vers d’autres conversations ou des cibles hors bande explicites. Le transfert partagé `approvals.plugin` est également
distinct ; les boutons natifs Slack peuvent toujours résoudre les approbations de plugin lorsque ces demandes arrivent déjà
dans Slack.

La commande `/approve` dans la même conversation fonctionne aussi dans les canaux Slack et les messages directs qui prennent déjà en charge les commandes. Consultez [Approbations d’exécution](/fr/tools/exec-approvals) pour le modèle complet de transfert des approbations.

## Événements et comportement opérationnel

- Les modifications/suppressions de messages sont converties en événements système.
- Les diffusions de fil (réponses de fil « Envoyer également au canal ») sont traitées comme des messages utilisateur normaux.
- Les événements d’ajout/suppression de réactions sont convertis en événements système.
- Les événements d’arrivée/départ de membres, de création/renommage de canal et d’ajout/suppression d’épingles sont convertis en événements système.
- `channel_id_changed` peut migrer les clés de configuration de canal lorsque `configWrites` est activé.
- Les métadonnées de sujet/d’objectif du canal sont traitées comme du contexte non fiable et peuvent être injectées dans le contexte de routage.
- Le message initial du fil et l’amorçage initial du contexte d’historique du fil sont filtrés par les listes d’autorisation d’expéditeurs configurées lorsque applicable.
- Les actions de blocs et les interactions de modales émettent des événements système structurés `Slack interaction: ...` avec des champs de charge utile riches :
  - actions de blocs : valeurs sélectionnées, libellés, valeurs de sélecteur et métadonnées `workflow_*`
  - événements modaux `view_submission` et `view_closed` avec métadonnées du canal routé et entrées de formulaire

## Référence de configuration

Référence principale : [Référence de configuration - Slack](/fr/gateway/config-channels#slack).

<Accordion title="Champs Slack à fort signal">

- mode/authentification : `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- accès aux messages directs : `dm.enabled`, `dmPolicy`, `allowFrom` (hérité : `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- bascule de compatibilité : `dangerouslyAllowNameMatching` (dernier recours ; garder désactivé sauf besoin)
- accès aux canaux : `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- fils/historique : `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- livraison : `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- exploitation/fonctionnalités : `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Dépannage

<AccordionGroup>
  <Accordion title="Aucune réponse dans les canaux">
    Vérifiez, dans l’ordre :

    - `groupPolicy`
    - liste d’autorisation des canaux (`channels.slack.channels`) — **les clés doivent être des ID de canal** (`C12345678`), pas des noms (`#channel-name`). Les clés basées sur des noms échouent silencieusement sous `groupPolicy: "allowlist"` parce que le routage des canaux privilégie les ID par défaut. Pour trouver un ID : faites un clic droit sur le canal dans Slack → **Copier le lien** — la valeur `C...` à la fin de l’URL est l’ID du canal.
    - `requireMention`
    - liste d’autorisation `users` par canal

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
    - `channels.slack.dmPolicy` (ou l’hérité `channels.slack.dm.policy`)
    - approbations d’association / entrées de liste d’autorisation
    - événements de messages directs Slack Assistant : les journaux détaillés mentionnant `drop message_changed`
      signifient généralement que Slack a envoyé un événement de fil Assistant modifié sans
      expéditeur humain récupérable dans les métadonnées du message

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Le mode Socket ne se connecte pas">
    Validez les jetons de bot et d’application ainsi que l’activation du mode Socket dans les paramètres de l’application Slack.

    Si `openclaw channels status --probe --json` affiche `botTokenStatus` ou
    `appTokenStatus: "configured_unavailable"`, le compte Slack est
    configuré, mais l’environnement d’exécution actuel n’a pas pu résoudre la
    valeur adossée à SecretRef.

  </Accordion>

  <Accordion title="Le mode HTTP ne reçoit pas d’événements">
    Validez :

    - secret de signature
    - chemin du Webhook
    - URL de requête Slack (événements + interactivité + commandes slash)
    - `webhookPath` unique par compte HTTP

    Si `signingSecretStatus: "configured_unavailable"` apparaît dans les instantanés de compte, le compte HTTP est configuré, mais l’environnement d’exécution actuel n’a pas pu résoudre le secret de signature adossé à SecretRef.

  </Accordion>

  <Accordion title="Les commandes natives/slash ne se déclenchent pas">
    Vérifiez si vous vouliez utiliser :

    - le mode de commandes natives (`channels.slack.commands.native: true`) avec les commandes slash correspondantes enregistrées dans Slack
    - ou le mode de commande slash unique (`channels.slack.slashCommand.enabled: true`)

    Vérifiez également `commands.useAccessGroups` et les listes d’autorisation de canaux/utilisateurs.

  </Accordion>
</AccordionGroup>

## Référence de vision des pièces jointes

Slack peut joindre les médias téléchargés au tour de l’agent lorsque les téléchargements de fichiers Slack réussissent et que les limites de taille le permettent. Les fichiers image peuvent être transmis par le chemin de compréhension des médias ou directement à un modèle de réponse compatible avec la vision ; les autres fichiers sont conservés comme contexte de fichier téléchargeable plutôt que traités comme entrée d’image.

### Types de médias pris en charge

| Type de média                  | Source               | Comportement actuel                                                             | Notes                                                                                           |
| ------------------------------ | -------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Images JPEG / PNG / GIF / WebP | URL de fichier Slack | Téléchargées et jointes au tour pour une gestion compatible avec la vision       | Plafond par fichier : `channels.slack.mediaMaxMb` (20 Mo par défaut)                            |
| Fichiers PDF                   | URL de fichier Slack | Téléchargés et exposés comme contexte de fichier pour des outils comme `download-file` ou `pdf` | L’entrée Slack ne convertit pas automatiquement les PDF en entrée de vision par image            |
| Autres fichiers                | URL de fichier Slack | Téléchargés lorsque c’est possible et exposés comme contexte de fichier          | Les fichiers binaires ne sont pas traités comme entrée d’image                                  |
| Réponses de fil                | Fichiers du message initial du fil | Les fichiers du message racine peuvent être hydratés comme contexte lorsque la réponse n’a aucun média direct | Les messages initiaux composés uniquement de fichiers utilisent un emplacement réservé de pièce jointe |
| Messages multi-images          | Plusieurs fichiers Slack | Chaque fichier est évalué indépendamment                                         | Le traitement Slack est plafonné à huit fichiers par message                                    |

### Pipeline entrant

Lorsqu’un message Slack avec des pièces jointes de fichier arrive :

1. OpenClaw télécharge le fichier depuis l’URL privée de Slack en utilisant le jeton du bot (`xoxb-...`).
2. Le fichier est écrit dans le magasin de médias en cas de réussite.
3. Les chemins des médias téléchargés et les types de contenu sont ajoutés au contexte entrant.
4. Les chemins de modèle ou d’outil compatibles avec les images peuvent utiliser les pièces jointes d’image depuis ce contexte.
5. Les fichiers non image restent disponibles comme métadonnées de fichier ou références de média pour les outils capables de les gérer.

### Héritage des pièces jointes de la racine du fil

Lorsqu’un message arrive dans un fil (avec un parent `thread_ts`) :

- Si la réponse elle-même n’a aucun média direct et que le message racine inclus contient des fichiers, Slack peut hydrater les fichiers racine comme contexte du message initial du fil.
- Les pièces jointes directes de la réponse ont priorité sur les pièces jointes du message racine.
- Un message racine qui ne contient que des fichiers et aucun texte est représenté avec un emplacement réservé de pièce jointe afin que le repli puisse toujours inclure ses fichiers.

### Gestion des pièces jointes multiples

Lorsqu’un seul message Slack contient plusieurs pièces jointes de fichier :

- Chaque pièce jointe est traitée indépendamment par le pipeline média.
- Les références de médias téléchargés sont agrégées dans le contexte du message.
- L’ordre de traitement suit l’ordre des fichiers Slack dans la charge utile de l’événement.
- L’échec du téléchargement d’une pièce jointe ne bloque pas les autres.

### Limites de taille, de téléchargement et de modèle

- **Plafond de taille** : 20 Mo par fichier par défaut. Configurable via `channels.slack.mediaMaxMb`.
- **Échecs de téléchargement** : Les fichiers que Slack ne peut pas servir, les URL expirées, les fichiers inaccessibles, les fichiers trop volumineux et les réponses HTML d’authentification/connexion Slack sont ignorés au lieu d’être signalés comme formats non pris en charge.
- **Modèle de vision** : L’analyse d’image utilise le modèle de réponse actif lorsqu’il prend en charge la vision, ou le modèle d’image configuré dans `agents.defaults.imageModel`.

### Limites connues

| Scénario                               | Comportement actuel                                                        | Solution de contournement                                                   |
| -------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| URL de fichier Slack expirée           | Fichier ignoré ; aucune erreur affichée                                     | Téléverser à nouveau le fichier dans Slack                                    |
| Modèle de vision non configuré         | Les pièces jointes d’image sont stockées comme références de média, mais ne sont pas analysées comme images | Configurer `agents.defaults.imageModel` ou utiliser un modèle de réponse compatible avec la vision |
| Images très volumineuses (> 20 Mo par défaut) | Ignorées selon le plafond de taille                                         | Augmenter `channels.slack.mediaMaxMb` si Slack le permet                      |
| Pièces jointes transférées/partagées   | Le texte et les médias d’image/fichier hébergés par Slack sont traités au mieux | Partager à nouveau directement dans le fil OpenClaw                           |
| Pièces jointes PDF                     | Stockées comme contexte de fichier/média, sans routage automatique via la vision par image | Utiliser `download-file` pour les métadonnées de fichier ou l’outil `pdf` pour l’analyse PDF |

### Documentation associée

- [Pipeline de compréhension des médias](/fr/nodes/media-understanding)
- [Outil PDF](/fr/tools/pdf)
- Épopée : [#51349](https://github.com/openclaw/openclaw/issues/51349) — activation de la vision pour les pièces jointes Slack
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
    Router les messages entrants vers les agents.
  </Card>
  <Card title="Security" icon="shield" href="/fr/gateway/security">
    Modèle de menace et durcissement.
  </Card>
  <Card title="Configuration" icon="sliders" href="/fr/gateway/configuration">
    Structure et précédence de la configuration.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/fr/tools/slash-commands">
    Catalogue et comportement des commandes.
  </Card>
</CardGroup>
