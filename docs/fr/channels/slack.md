---
read_when:
    - Configurer Slack ou déboguer le mode socket/HTTP de Slack
summary: Configuration de Slack et comportement à l’exécution (Socket Mode + URL de requête HTTP)
title: Slack
x-i18n:
    generated_at: "2026-04-12T06:49:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4b80c1a612b8815c46c675b688639c207a481f367075996dde3858a83637313b
    source_path: channels/slack.md
    workflow: 15
---

# Slack

Statut : prêt pour la production pour les messages privés + les canaux via les intégrations d’application Slack. Le mode par défaut est Socket Mode ; les URL de requête HTTP sont également prises en charge.

<CardGroup cols={3}>
  <Card title="Appairage" icon="link" href="/fr/channels/pairing">
    Les messages privés Slack utilisent par défaut le mode d’appairage.
  </Card>
  <Card title="Commandes slash" icon="terminal" href="/fr/tools/slash-commands">
    Comportement natif des commandes et catalogue des commandes.
  </Card>
  <Card title="Dépannage des canaux" icon="wrench" href="/fr/channels/troubleshooting">
    Diagnostics inter-canaux et guides de réparation.
  </Card>
</CardGroup>

## Configuration rapide

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Créer une nouvelle application Slack">
        Dans les paramètres de l’application Slack, appuyez sur le bouton **[Create New App](https://api.slack.com/apps/new)** :

        - choisissez **from a manifest** et sélectionnez un espace de travail pour votre application
        - collez le [manifeste d’exemple](#manifest-and-scope-checklist) ci-dessous, puis poursuivez la création
        - générez un **App-Level Token** (`xapp-...`) avec `connections:write`
        - installez l’application et copiez le **Bot Token** (`xoxb-...`) affiché
      </Step>

      <Step title="Configurer OpenClaw">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: "xapp-...",
      botToken: "xoxb-...",
    },
  },
}
```

        Variable d’environnement de secours (compte par défaut uniquement) :

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Démarrer la passerelle">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Request URLs">
    <Steps>
      <Step title="Créer une nouvelle application Slack">
        Dans les paramètres de l’application Slack, appuyez sur le bouton **[Create New App](https://api.slack.com/apps/new)** :

        - choisissez **from a manifest** et sélectionnez un espace de travail pour votre application
        - collez le [manifeste d’exemple](#manifest-and-scope-checklist) et mettez à jour les URL avant de créer
        - enregistrez le **Signing Secret** pour la vérification des requêtes
        - installez l’application et copiez le **Bot Token** (`xoxb-...`) affiché

      </Step>

      <Step title="Configurer OpenClaw">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: "xoxb-...",
      signingSecret: "your-signing-secret",
      webhookPath: "/slack/events",
    },
  },
}
```

        <Note>
        Utilisez des chemins de webhook uniques pour le mode HTTP multi-compte

        Donnez à chaque compte un `webhookPath` distinct (par défaut `/slack/events`) afin d’éviter les collisions d’enregistrement.
        </Note>

      </Step>

      <Step title="Démarrer la passerelle">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Liste de vérification du manifeste et des scopes

<Tabs>
  <Tab title="Socket Mode (default)">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Connecteur Slack pour OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw",
      "always_online": true
    },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Envoyer un message à OpenClaw",
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
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
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

  </Tab>

  <Tab title="HTTP Request URLs">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Connecteur Slack pour OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw",
      "always_online": true
    },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Envoyer un message à OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
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
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
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

  </Tab>
</Tabs>

### Paramètres de manifeste supplémentaires

Présentez différentes fonctionnalités qui étendent les valeurs par défaut ci-dessus.

<AccordionGroup>
  <Accordion title="Commandes slash natives facultatives">

    Plusieurs [commandes slash natives](#commands-and-slash-behavior) peuvent être utilisées à la place d’une seule commande configurée, avec quelques subtilités :

    - Utilisez `/agentstatus` au lieu de `/status`, car la commande `/status` est réservée.
    - Il n’est pas possible de rendre disponibles plus de 25 commandes slash à la fois.

    Remplacez votre section `features.slash_commands` existante par un sous-ensemble des [commandes disponibles](/fr/tools/slash-commands#command-list) :

    <Tabs>
      <Tab title="Socket Mode (default)">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Démarrer une nouvelle session",
        "usage_hint": "[model]"
      },
      {
        "command": "/reset",
        "description": "Réinitialiser la session actuelle"
      },
      {
        "command": "/compact",
        "description": "Compacter le contexte de la session",
        "usage_hint": "[instructions]"
      },
      {
        "command": "/stop",
        "description": "Arrêter l’exécution en cours"
      },
      {
        "command": "/session",
        "description": "Gérer l’expiration de la liaison de fil",
        "usage_hint": "idle <duration|off> or max-age <duration|off>"
      },
      {
        "command": "/think",
        "description": "Définir le niveau de réflexion",
        "usage_hint": "<off|minimal|low|medium|high|xhigh>"
      },
      {
        "command": "/verbose",
        "description": "Activer ou désactiver la sortie détaillée",
        "usage_hint": "on|off|full"
      },
      {
        "command": "/fast",
        "description": "Afficher ou définir le mode rapide",
        "usage_hint": "[status|on|off]"
      },
      {
        "command": "/reasoning",
        "description": "Activer ou désactiver la visibilité du raisonnement",
        "usage_hint": "[on|off|stream]"
      },
      {
        "command": "/elevated",
        "description": "Activer ou désactiver le mode élevé",
        "usage_hint": "[on|off|ask|full]"
      },
      {
        "command": "/exec",
        "description": "Afficher ou définir les valeurs par défaut d’exécution",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
      },
      {
        "command": "/model",
        "description": "Afficher ou définir le modèle",
        "usage_hint": "[name|#|status]"
      },
      {
        "command": "/models",
        "description": "Lister les fournisseurs ou les modèles d’un fournisseur",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
      },
      {
        "command": "/help",
        "description": "Afficher le résumé d’aide court"
      },
      {
        "command": "/commands",
        "description": "Afficher le catalogue de commandes généré"
      },
      {
        "command": "/tools",
        "description": "Afficher ce que l’agent actuel peut utiliser en ce moment",
        "usage_hint": "[compact|verbose]"
      },
      {
        "command": "/agentstatus",
        "description": "Afficher l’état d’exécution, y compris l’utilisation/le quota du fournisseur lorsque disponible"
      },
      {
        "command": "/tasks",
        "description": "Lister les tâches d’arrière-plan actives/récentes pour la session actuelle"
      },
      {
        "command": "/context",
        "description": "Expliquer comment le contexte est assemblé",
        "usage_hint": "[list|detail|json]"
      },
      {
        "command": "/whoami",
        "description": "Afficher votre identité d’expéditeur"
      },
      {
        "command": "/skill",
        "description": "Exécuter une compétence par son nom",
        "usage_hint": "<name> [input]"
      },
      {
        "command": "/btw",
        "description": "Poser une question secondaire sans modifier le contexte de la session",
        "usage_hint": "<question>"
      },
      {
        "command": "/usage",
        "description": "Contrôler le pied de page d’utilisation ou afficher le résumé des coûts",
        "usage_hint": "off|tokens|full|cost"
      }
    ]
```

      </Tab>
      <Tab title="HTTP Request URLs">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Démarrer une nouvelle session",
        "usage_hint": "[model]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/reset",
        "description": "Réinitialiser la session actuelle",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/compact",
        "description": "Compacter le contexte de la session",
        "usage_hint": "[instructions]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/stop",
        "description": "Arrêter l’exécution en cours",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/session",
        "description": "Gérer l’expiration de la liaison de fil",
        "usage_hint": "idle <duration|off> or max-age <duration|off>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/think",
        "description": "Définir le niveau de réflexion",
        "usage_hint": "<off|minimal|low|medium|high|xhigh>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/verbose",
        "description": "Activer ou désactiver la sortie détaillée",
        "usage_hint": "on|off|full",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/fast",
        "description": "Afficher ou définir le mode rapide",
        "usage_hint": "[status|on|off]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/reasoning",
        "description": "Activer ou désactiver la visibilité du raisonnement",
        "usage_hint": "[on|off|stream]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/elevated",
        "description": "Activer ou désactiver le mode élevé",
        "usage_hint": "[on|off|ask|full]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/exec",
        "description": "Afficher ou définir les valeurs par défaut d’exécution",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/model",
        "description": "Afficher ou définir le modèle",
        "usage_hint": "[name|#|status]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/models",
        "description": "Lister les fournisseurs ou les modèles d’un fournisseur",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/help",
        "description": "Afficher le résumé d’aide court",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/commands",
        "description": "Afficher le catalogue de commandes généré",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tools",
        "description": "Afficher ce que l’agent actuel peut utiliser en ce moment",
        "usage_hint": "[compact|verbose]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/agentstatus",
        "description": "Afficher l’état d’exécution, y compris l’utilisation/le quota du fournisseur lorsque disponible",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tasks",
        "description": "Lister les tâches d’arrière-plan actives/récentes pour la session actuelle",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/context",
        "description": "Expliquer comment le contexte est assemblé",
        "usage_hint": "[list|detail|json]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/whoami",
        "description": "Afficher votre identité d’expéditeur",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/skill",
        "description": "Exécuter une compétence par son nom",
        "usage_hint": "<name> [input]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/btw",
        "description": "Poser une question secondaire sans modifier le contexte de la session",
        "usage_hint": "<question>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/usage",
        "description": "Contrôler le pied de page d’utilisation ou afficher le résumé des coûts",
        "usage_hint": "off|tokens|full|cost",
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Scopes d’auteur facultatifs (opérations d’écriture)">
    Ajoutez le scope bot `chat:write.customize` si vous souhaitez que les messages sortants utilisent l’identité de l’agent actif (nom d’utilisateur et icône personnalisés) au lieu de l’identité par défaut de l’application Slack.

    Si vous utilisez une icône emoji, Slack attend la syntaxe `:emoji_name:`.

  </Accordion>
  <Accordion title="Scopes de jeton utilisateur facultatifs (opérations de lecture)">
    Si vous configurez `channels.slack.userToken`, les scopes de lecture typiques sont :

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

- `botToken` + `appToken` sont requis pour Socket Mode.
- Le mode HTTP nécessite `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` et `userToken` acceptent des chaînes en texte brut
  ou des objets SecretRef.
- Les jetons de config remplacent la variable d’environnement de secours.
- La variable d’environnement de secours `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` s’applique uniquement au compte par défaut.
- `userToken` (`xoxp-...`) est uniquement configurable dans la config (pas de variable d’environnement de secours) et utilise par défaut un comportement en lecture seule (`userTokenReadOnly: true`).

Comportement de l’instantané d’état :

- L’inspection du compte Slack suit les champs `*Source` et `*Status`
  par identifiant (`botToken`, `appToken`, `signingSecret`, `userToken`).
- L’état est `available`, `configured_unavailable` ou `missing`.
- `configured_unavailable` signifie que le compte est configuré via SecretRef
  ou une autre source de secret non inline, mais que le chemin de commande/d’exécution actuel
  n’a pas pu résoudre la valeur réelle.
- En mode HTTP, `signingSecretStatus` est inclus ; en Socket Mode, la
  paire requise est `botTokenStatus` + `appTokenStatus`.

<Tip>
Pour les lectures d’actions/répertoires, le jeton utilisateur peut être privilégié lorsqu’il est configuré. Pour les écritures, le jeton bot reste privilégié ; les écritures avec jeton utilisateur ne sont autorisées que lorsque `userTokenReadOnly: false` et que le jeton bot n’est pas disponible.
</Tip>

## Actions et contrôles

Les actions Slack sont contrôlées par `channels.slack.actions.*`.

Groupes d’actions disponibles dans l’outillage Slack actuel :

| Group      | Default |
| ---------- | ------- |
| messages   | enabled |
| reactions  | enabled |
| pins       | enabled |
| memberInfo | enabled |
| emojiList  | enabled |

Les actions de message Slack actuelles incluent `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` et `emoji-list`.

## Contrôle d’accès et routage

<Tabs>
  <Tab title="Politique des messages privés">
    `channels.slack.dmPolicy` contrôle l’accès aux messages privés (héritage : `channels.slack.dm.policy`) :

    - `pairing` (par défaut)
    - `allowlist`
    - `open` (nécessite que `channels.slack.allowFrom` inclue `"*"` ; héritage : `channels.slack.dm.allowFrom`)
    - `disabled`

    Indicateurs de messages privés :

    - `dm.enabled` (true par défaut)
    - `channels.slack.allowFrom` (préféré)
    - `dm.allowFrom` (héritage)
    - `dm.groupEnabled` (messages privés de groupe false par défaut)
    - `dm.groupChannels` (liste d’autorisation MPIM facultative)

    Priorité multi-compte :

    - `channels.slack.accounts.default.allowFrom` s’applique uniquement au compte `default`.
    - Les comptes nommés héritent de `channels.slack.allowFrom` lorsque leur propre `allowFrom` n’est pas défini.
    - Les comptes nommés n’héritent pas de `channels.slack.accounts.default.allowFrom`.

    L’appairage dans les messages privés utilise `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Politique des canaux">
    `channels.slack.groupPolicy` contrôle la gestion des canaux :

    - `open`
    - `allowlist`
    - `disabled`

    La liste d’autorisation des canaux se trouve sous `channels.slack.channels` et doit utiliser des identifiants de canal stables.

    Note d’exécution : si `channels.slack` est complètement absent (configuration par variables d’environnement uniquement), l’exécution revient à `groupPolicy="allowlist"` et journalise un avertissement (même si `channels.defaults.groupPolicy` est défini).

    Résolution nom/ID :

    - les entrées de liste d’autorisation de canaux et les entrées de liste d’autorisation de messages privés sont résolues au démarrage lorsque l’accès au jeton le permet
    - les entrées de nom de canal non résolues sont conservées telles que configurées mais ignorées pour le routage par défaut
    - l’autorisation entrante et le routage des canaux utilisent par défaut les ID en priorité ; la correspondance directe sur nom d’utilisateur/slug nécessite `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="Mentions et utilisateurs de canal">
    Les messages de canal sont contrôlés par mention par défaut.

    Sources de mention :

    - mention explicite de l’application (`<@botId>`)
    - motifs regex de mention (`agents.list[].groupChat.mentionPatterns`, repli sur `messages.groupChat.mentionPatterns`)
    - comportement implicite de réponse à un fil du bot (désactivé lorsque `thread.requireExplicitMention` est `true`)

    Contrôles par canal (`channels.slack.channels.<id>` ; noms uniquement via résolution au démarrage ou `dangerouslyAllowNameMatching`) :

    - `requireMention`
    - `users` (liste d’autorisation)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - format de clé `toolsBySender` : `id:`, `e164:`, `username:`, `name:` ou joker `"*"`
      (les clés héritées sans préfixe sont toujours mappées uniquement vers `id:`)

  </Tab>
</Tabs>

## Fils, sessions et balises de réponse

- Les messages privés sont routés comme `direct` ; les canaux comme `channel` ; les MPIM comme `group`.
- Avec la valeur par défaut `session.dmScope=main`, les messages privés Slack sont regroupés dans la session principale de l’agent.
- Sessions de canal : `agent:<agentId>:slack:channel:<channelId>`.
- Les réponses dans les fils peuvent créer des suffixes de session de fil (`:thread:<threadTs>`) lorsque cela s’applique.
- La valeur par défaut de `channels.slack.thread.historyScope` est `thread` ; la valeur par défaut de `thread.inheritParent` est `false`.
- `channels.slack.thread.initialHistoryLimit` contrôle le nombre de messages de fil existants récupérés lorsqu’une nouvelle session de fil démarre (valeur par défaut `20` ; définissez `0` pour désactiver).
- `channels.slack.thread.requireExplicitMention` (par défaut `false`) : lorsque `true`, supprime les mentions implicites dans les fils afin que le bot ne réponde qu’aux mentions explicites `@bot` à l’intérieur des fils, même lorsque le bot a déjà participé au fil. Sans cela, les réponses dans un fil auquel le bot a participé contournent le contrôle `requireMention`.

Contrôles de fil de réponse :

- `channels.slack.replyToMode`: `off|first|all|batched` (par défaut `off`)
- `channels.slack.replyToModeByChatType`: par `direct|group|channel`
- repli hérité pour les discussions directes : `channels.slack.dm.replyToMode`

Les balises de réponse manuelles sont prises en charge :

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Remarque : `replyToMode="off"` désactive **tout** le fil de réponse dans Slack, y compris les balises explicites `[[reply_to_*]]`. Cela diffère de Telegram, où les balises explicites sont toujours honorées en mode `"off"`. La différence reflète les modèles de fil des plateformes : les fils Slack masquent les messages du canal, tandis que les réponses Telegram restent visibles dans le flux principal de discussion.

## Réactions d’accusé de réception

`ackReaction` envoie un emoji d’accusé de réception pendant qu’OpenClaw traite un message entrant.

Ordre de résolution :

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- repli sur l’emoji d’identité de l’agent (`agents.list[].identity.emoji`, sinon `"👀"`)

Remarques :

- Slack attend des shortcodes (par exemple `"eyes"`).
- Utilisez `""` pour désactiver la réaction pour le compte Slack ou globalement.

## Streaming de texte

`channels.slack.streaming` contrôle le comportement d’aperçu en direct :

- `off` : désactiver le streaming d’aperçu en direct.
- `partial` (par défaut) : remplacer le texte d’aperçu par la dernière sortie partielle.
- `block` : ajouter des mises à jour d’aperçu par blocs.
- `progress` : afficher un texte d’état de progression pendant la génération, puis envoyer le texte final.

`channels.slack.streaming.nativeTransport` contrôle le streaming de texte natif de Slack lorsque `channels.slack.streaming.mode` est `partial` (par défaut : `true`).

- Un fil de réponse doit être disponible pour que le streaming de texte natif et l’état du fil assistant Slack apparaissent. La sélection du fil suit toujours `replyToMode`.
- Les racines de canaux et de discussions de groupe peuvent toujours utiliser l’aperçu de brouillon normal lorsque le streaming natif n’est pas disponible.
- Les messages privés Slack de niveau supérieur restent hors fil par défaut ; ils n’affichent donc pas l’aperçu de style fil. Utilisez des réponses dans des fils ou `typingReaction` si vous souhaitez y afficher une progression visible.
- Les médias et les charges utiles non textuelles reviennent à la livraison normale.
- Si le streaming échoue au milieu d’une réponse, OpenClaw revient à la livraison normale pour les charges utiles restantes.

Utiliser l’aperçu de brouillon au lieu du streaming de texte natif de Slack :

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

- `channels.slack.streamMode` (`replace | status_final | append`) est migré automatiquement vers `channels.slack.streaming.mode`.
- le booléen `channels.slack.streaming` est migré automatiquement vers `channels.slack.streaming.mode` et `channels.slack.streaming.nativeTransport`.
- l’ancienne clé `channels.slack.nativeStreaming` est migrée automatiquement vers `channels.slack.streaming.nativeTransport`.

## Repli avec réaction de saisie

`typingReaction` ajoute une réaction temporaire au message Slack entrant pendant qu’OpenClaw traite une réponse, puis la supprime lorsque l’exécution se termine. Cela est particulièrement utile en dehors des réponses dans des fils, qui utilisent un indicateur d’état par défaut « is typing... ».

Ordre de résolution :

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Remarques :

- Slack attend des shortcodes (par exemple `"hourglass_flowing_sand"`).
- La réaction est effectuée au mieux, et le nettoyage est tenté automatiquement une fois la réponse envoyée ou en cas d’échec.

## Médias, découpage et livraison

<AccordionGroup>
  <Accordion title="Pièces jointes entrantes">
    Les pièces jointes Slack sont téléchargées depuis des URL privées hébergées par Slack (flux de requêtes authentifiées par jeton) et écrites dans le stockage média lorsque la récupération réussit et que les limites de taille le permettent.

    Le plafond de taille d’entrée à l’exécution est de `20MB` par défaut, sauf remplacement par `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Texte et fichiers sortants">
    - les morceaux de texte utilisent `channels.slack.textChunkLimit` (par défaut 4000)
    - `channels.slack.chunkMode="newline"` active le découpage prioritairement par paragraphe
    - les envois de fichiers utilisent les API d’upload Slack et peuvent inclure des réponses dans des fils (`thread_ts`)
    - le plafond média sortant suit `channels.slack.mediaMaxMb` lorsqu’il est configuré ; sinon, les envois de canal utilisent les valeurs par défaut par type MIME du pipeline média
  </Accordion>

  <Accordion title="Cibles de livraison">
    Cibles explicites préférées :

    - `user:<id>` pour les messages privés
    - `channel:<id>` pour les canaux

    Les messages privés Slack sont ouverts via les API de conversation Slack lors de l’envoi vers des cibles utilisateur.

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

Les commandes natives nécessitent des [paramètres de manifeste supplémentaires](#additional-manifest-settings) dans votre application Slack et sont activées avec `channels.slack.commands.native: true` ou `commands.native: true` dans les configurations globales.

- Le mode automatique des commandes natives est **désactivé** pour Slack, donc `commands.native: "auto"` n’active pas les commandes natives Slack.

```txt
/help
```

Les menus d’arguments natifs utilisent une stratégie de rendu adaptative qui affiche une fenêtre modale de confirmation avant d’envoyer la valeur d’option sélectionnée :

- jusqu’à 5 options : blocs de boutons
- de 6 à 100 options : menu de sélection statique
- plus de 100 options : sélection externe avec filtrage asynchrone des options lorsque des gestionnaires d’options d’interactivité sont disponibles
- limites Slack dépassées : les valeurs d’option encodées reviennent à des boutons

```txt
/think
```

Les sessions de commandes slash utilisent des clés isolées comme `agent:<agentId>:slack:slash:<userId>` et continuent à router les exécutions de commandes vers la session de conversation cible en utilisant `CommandTargetSessionKey`.

## Réponses interactives

Slack peut afficher des contrôles de réponse interactive rédigés par l’agent, mais cette fonctionnalité est désactivée par défaut.

L’activer globalement :

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

Ou l’activer pour un seul compte Slack :

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

Ces directives sont compilées en Slack Block Kit et renvoient les clics ou sélections via le chemin d’événements d’interaction Slack existant.

Remarques :

- Il s’agit d’une interface propre à Slack. Les autres canaux ne traduisent pas les directives Slack Block Kit dans leurs propres systèmes de boutons.
- Les valeurs de rappel interactif sont des jetons opaques générés par OpenClaw, et non des valeurs brutes rédigées par l’agent.
- Si les blocs interactifs générés dépassent les limites de Slack Block Kit, OpenClaw revient à la réponse texte d’origine au lieu d’envoyer une charge utile de blocs invalide.

## Approbations exec dans Slack

Slack peut agir comme un client d’approbation natif avec boutons interactifs et interactions, au lieu de revenir à l’interface Web ou au terminal.

- Les approbations exec utilisent `channels.slack.execApprovals.*` pour le routage natif en message privé/canal.
- Les approbations de plugin peuvent toujours être résolues via la même surface de boutons native Slack lorsque la demande arrive déjà dans Slack et que le type d’identifiant d’approbation est `plugin:`.
- L’autorisation des approbateurs est toujours appliquée : seuls les utilisateurs identifiés comme approbateurs peuvent approuver ou refuser des demandes via Slack.

Cela utilise la même surface de boutons d’approbation partagée que les autres canaux. Lorsque `interactivity` est activé dans les paramètres de votre application Slack, les invites d’approbation s’affichent comme des boutons Block Kit directement dans la conversation.
Lorsque ces boutons sont présents, ils constituent l’expérience utilisateur d’approbation principale ; OpenClaw
ne doit inclure une commande manuelle `/approve` que lorsque le résultat de l’outil indique que les
approbations par chat ne sont pas disponibles ou que l’approbation manuelle est la seule voie possible.

Chemin de config :

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (facultatif ; revient à `commands.ownerAllowFrom` lorsque possible)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, par défaut : `dm`)
- `agentFilter`, `sessionFilter`

Slack active automatiquement les approbations exec natives lorsque `enabled` n’est pas défini ou vaut `"auto"` et qu’au moins un
approbateur est résolu. Définissez `enabled: false` pour désactiver explicitement Slack comme client d’approbation natif.
Définissez `enabled: true` pour forcer l’activation des approbations natives lorsque des approbateurs sont résolus.

Comportement par défaut sans configuration explicite des approbations exec Slack :

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Une configuration native Slack explicite n’est nécessaire que lorsque vous souhaitez remplacer les approbateurs, ajouter des filtres ou
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

Le transfert partagé `approvals.exec` est distinct. Utilisez-le uniquement lorsque les invites d’approbation exec doivent aussi
être routées vers d’autres discussions ou des cibles explicites hors bande. Le transfert partagé `approvals.plugin` est également
distinct ; les boutons natifs Slack peuvent toujours résoudre les approbations de plugin lorsque ces demandes arrivent déjà
dans Slack.

La commande `/approve` dans le même chat fonctionne aussi dans les canaux et messages privés Slack qui prennent déjà en charge les commandes. Voir [Approbations exec](/fr/tools/exec-approvals) pour le modèle complet de transfert des approbations.

## Événements et comportement opérationnel

- Les modifications/suppressions de messages et les diffusions de fils sont mappées en événements système.
- Les événements d’ajout/suppression de réactions sont mappés en événements système.
- Les événements de jonction/départ de membres, de création/renommage de canaux et d’ajout/suppression d’épingles sont mappés en événements système.
- `channel_id_changed` peut migrer les clés de configuration de canal lorsque `configWrites` est activé.
- Les métadonnées de sujet/objectif de canal sont traitées comme un contexte non fiable et peuvent être injectées dans le contexte de routage.
- L’auteur du fil et l’initialisation du contexte d’historique du fil sont filtrés par les listes d’autorisation d’expéditeurs configurées lorsque cela s’applique.
- Les actions de bloc et interactions modales émettent des événements système structurés `Slack interaction: ...` avec des champs de charge utile riches :
  - actions de bloc : valeurs sélectionnées, libellés, valeurs de sélecteur et métadonnées `workflow_*`
  - événements modaux `view_submission` et `view_closed` avec métadonnées de canal routées et entrées de formulaire

## Pointeurs de référence de configuration

Référence principale :

- [Référence de configuration - Slack](/fr/gateway/configuration-reference#slack)

  Champs Slack à fort signal :
  - mode/auth : `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
  - accès DM : `dm.enabled`, `dmPolicy`, `allowFrom` (héritage : `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
  - interrupteur de compatibilité : `dangerouslyAllowNameMatching` (option de dernier recours ; laissez-le désactivé sauf nécessité)
  - accès aux canaux : `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
  - fils/historique : `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
  - livraison : `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`
  - opérations/fonctionnalités : `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

## Dépannage

<AccordionGroup>
  <Accordion title="Aucune réponse dans les canaux">
    Vérifiez, dans l’ordre :

    - `groupPolicy`
    - liste d’autorisation des canaux (`channels.slack.channels`)
    - `requireMention`
    - liste d’autorisation `users` par canal

    Commandes utiles :

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="Messages privés ignorés">
    Vérifiez :

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (ou l’ancienne clé `channels.slack.dm.policy`)
    - approbations d’appairage / entrées de liste d’autorisation

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Le mode socket ne se connecte pas">
    Validez les jetons bot + app et l’activation de Socket Mode dans les paramètres de l’application Slack.

    Si `openclaw channels status --probe --json` affiche `botTokenStatus` ou
    `appTokenStatus: "configured_unavailable"`, le compte Slack est
    configuré, mais l’exécution actuelle n’a pas pu résoudre la
    valeur adossée à SecretRef.

  </Accordion>

  <Accordion title="Le mode HTTP ne reçoit pas d’événements">
    Validez :

    - signing secret
    - chemin de webhook
    - URL de requête Slack (événements + interactivité + commandes slash)
    - `webhookPath` unique par compte HTTP

    Si `signingSecretStatus: "configured_unavailable"` apparaît dans les instantanés de compte,
    le compte HTTP est configuré, mais l’exécution actuelle n’a pas pu
    résoudre le signing secret adossé à SecretRef.

  </Accordion>

  <Accordion title="Les commandes natives/slash ne se déclenchent pas">
    Vérifiez si vous vouliez :

    - le mode de commandes natives (`channels.slack.commands.native: true`) avec les commandes slash correspondantes enregistrées dans Slack
    - ou le mode à commande slash unique (`channels.slack.slashCommand.enabled: true`)

    Vérifiez également `commands.useAccessGroups` ainsi que les listes d’autorisation de canaux/utilisateurs.

  </Accordion>
</AccordionGroup>

## Associé

- [Appairage](/fr/channels/pairing)
- [Groupes](/fr/channels/groups)
- [Sécurité](/fr/gateway/security)
- [Routage des canaux](/fr/channels/channel-routing)
- [Dépannage](/fr/channels/troubleshooting)
- [Configuration](/fr/gateway/configuration)
- [Commandes slash](/fr/tools/slash-commands)
