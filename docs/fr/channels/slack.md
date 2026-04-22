---
read_when:
    - Configurer Slack ou déboguer le mode socket/HTTP de Slack
summary: Configuration de Slack et comportement à l’exécution (Socket Mode + URL de requête HTTP)
title: Slack
x-i18n:
    generated_at: "2026-04-22T04:20:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: e80b1ff7dfe3124916f9a4334badc9a742a0d0843b37c77838ede9f830920ff7
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
    Diagnostics inter-canaux et procédures de réparation.
  </Card>
</CardGroup>

## Configuration rapide

<Tabs>
  <Tab title="Socket Mode (par défaut)">
    <Steps>
      <Step title="Créer une nouvelle application Slack">
        Dans les paramètres de l’application Slack, appuyez sur le bouton **[Create New App](https://api.slack.com/apps/new)** :

        - choisissez **from a manifest** et sélectionnez un espace de travail pour votre application
        - collez le [manifeste d’exemple](#manifest-and-scope-checklist) ci-dessous et poursuivez la création
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

        Variable d’environnement de repli (compte par défaut uniquement) :

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Démarrer gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="URL de requête HTTP">
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
        Utilisez des chemins de Webhook uniques pour le mode HTTP multi-comptes

        Attribuez à chaque compte un `webhookPath` distinct (par défaut `/slack/events`) afin que les enregistrements n’entrent pas en collision.
        </Note>

      </Step>

      <Step title="Démarrer gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Liste de contrôle du manifeste et des scopes

<Tabs>
  <Tab title="Socket Mode (par défaut)">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
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

  <Tab title="URL de requête HTTP">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
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
        "description": "Send a message to OpenClaw",
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

### Paramètres supplémentaires du manifeste

Exposez différentes fonctionnalités qui étendent les valeurs par défaut ci-dessus.

<AccordionGroup>
  <Accordion title="Commandes slash natives facultatives">

    Plusieurs [commandes slash natives](#commands-and-slash-behavior) peuvent être utilisées à la place d’une seule commande configurée, avec quelques nuances :

    - Utilisez `/agentstatus` au lieu de `/status`, car la commande `/status` est réservée.
    - Pas plus de 25 commandes slash ne peuvent être rendues disponibles en même temps.

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
        "description": "List providers or models for a provider",
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
        "description": "Gérer l’expiration de la liaison au fil",
        "usage_hint": "idle <duration|off> or max-age <duration|off>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/think",
        "description": "Définir le niveau de réflexion",
        "usage_hint": "<level>",
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
        "description": "Afficher ce que l’agent actuel peut utiliser maintenant",
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
        "description": "Exécuter une skill par nom",
        "usage_hint": "<name> [input]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/btw",
        "description": "Poser une question annexe sans modifier le contexte de la session",
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
  <Accordion title="Scopes d’attribution facultatifs (opérations d’écriture)">
    Ajoutez le scope bot `chat:write.customize` si vous voulez que les messages sortants utilisent l’identité de l’agent actif (nom d’utilisateur et icône personnalisés) au lieu de l’identité par défaut de l’application Slack.

    Si vous utilisez une icône emoji, Slack attend la syntaxe `:emoji_name:`.

  </Accordion>
  <Accordion title="Scopes facultatifs de jeton utilisateur (opérations de lecture)">
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

## Modèle de jeton

- `botToken` + `appToken` sont requis pour Socket Mode.
- Le mode HTTP requiert `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` et `userToken` acceptent des chaînes en texte brut
  ou des objets SecretRef.
- Les jetons de configuration remplacent la variable d’environnement de repli.
- La variable d’environnement de repli `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` s’applique uniquement au compte par défaut.
- `userToken` (`xoxp-...`) est disponible uniquement dans la configuration (pas de variable d’environnement de repli) et utilise par défaut un comportement en lecture seule (`userTokenReadOnly: true`).

Comportement de l’instantané d’état :

- L’inspection des comptes Slack suit des champs `*Source` et `*Status`
  par identifiant (`botToken`, `appToken`, `signingSecret`, `userToken`).
- L’état est `available`, `configured_unavailable` ou `missing`.
- `configured_unavailable` signifie que le compte est configuré via SecretRef
  ou une autre source de secret non inline, mais que le chemin actuel de commande/d’exécution
  n’a pas pu résoudre la valeur réelle.
- En mode HTTP, `signingSecretStatus` est inclus ; en Socket Mode, la
  paire requise est `botTokenStatus` + `appTokenStatus`.

<Tip>
Pour les lectures d’actions/de répertoire, le jeton utilisateur peut être privilégié lorsqu’il est configuré. Pour les écritures, le jeton bot reste privilégié ; les écritures avec jeton utilisateur ne sont autorisées que lorsque `userTokenReadOnly: false` et que le jeton bot n’est pas disponible.
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

Les actions actuelles sur les messages Slack incluent `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` et `emoji-list`.

## Contrôle d’accès et routage

<Tabs>
  <Tab title="Politique des messages privés">
    `channels.slack.dmPolicy` contrôle l’accès aux messages privés (hérité : `channels.slack.dm.policy`) :

    - `pairing` (par défaut)
    - `allowlist`
    - `open` (nécessite que `channels.slack.allowFrom` inclue `"*"` ; hérité : `channels.slack.dm.allowFrom`)
    - `disabled`

    Indicateurs de messages privés :

    - `dm.enabled` (true par défaut)
    - `channels.slack.allowFrom` (préféré)
    - `dm.allowFrom` (hérité)
    - `dm.groupEnabled` (les messages privés de groupe sont false par défaut)
    - `dm.groupChannels` (liste d’autorisation MPIM facultative)

    Priorité multi-comptes :

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

    Remarque d’exécution : si `channels.slack` est complètement absent (configuration uniquement via env), l’exécution se replie sur `groupPolicy="allowlist"` et consigne un avertissement (même si `channels.defaults.groupPolicy` est défini).

    Résolution nom/ID :

    - les entrées de liste d’autorisation des canaux et des messages privés sont résolues au démarrage lorsque l’accès par jeton le permet
    - les entrées de nom de canal non résolues sont conservées telles que configurées mais ignorées par défaut pour le routage
    - l’autorisation entrante et le routage des canaux sont par défaut basés d’abord sur l’ID ; la correspondance directe par nom d’utilisateur/slug nécessite `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="Mentions et utilisateurs du canal">
    Les messages de canal sont filtrés par mention par défaut.

    Sources de mention :

    - mention explicite de l’application (`<@botId>`)
    - motifs regex de mention (`agents.list[].groupChat.mentionPatterns`, repli sur `messages.groupChat.mentionPatterns`)
    - comportement implicite de réponse à un fil du bot (désactivé lorsque `thread.requireExplicitMention` vaut `true`)

    Contrôles par canal (`channels.slack.channels.<id>` ; noms uniquement via résolution au démarrage ou `dangerouslyAllowNameMatching`) :

    - `requireMention`
    - `users` (liste d’autorisation)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - format de clé `toolsBySender` : `id:`, `e164:`, `username:`, `name:` ou joker `"*"`
      (les clés héritées sans préfixe sont toujours mappées vers `id:` uniquement)

  </Tab>
</Tabs>

## Fils, sessions et balises de réponse

- Les messages privés sont routés comme `direct` ; les canaux comme `channel` ; les MPIM comme `group`.
- Avec le `session.dmScope=main` par défaut, les messages privés Slack sont regroupés dans la session principale de l’agent.
- Sessions de canal : `agent:<agentId>:slack:channel:<channelId>`.
- Les réponses dans les fils peuvent créer des suffixes de session de fil (`:thread:<threadTs>`) lorsque cela s’applique.
- `channels.slack.thread.historyScope` vaut par défaut `thread` ; `thread.inheritParent` vaut par défaut `false`.
- `channels.slack.thread.initialHistoryLimit` contrôle combien de messages de fil existants sont récupérés lorsqu’une nouvelle session de fil commence (valeur par défaut `20` ; définissez `0` pour désactiver).
- `channels.slack.thread.requireExplicitMention` (valeur par défaut `false`) : lorsque cette valeur est `true`, les mentions implicites de fil sont supprimées afin que le bot ne réponde qu’aux mentions explicites `@bot` dans les fils, même si le bot a déjà participé au fil. Sans cela, les réponses dans un fil auquel le bot a participé contournent le filtrage `requireMention`.

Contrôles de réponse dans les fils :

- `channels.slack.replyToMode`: `off|first|all|batched` (par défaut `off`)
- `channels.slack.replyToModeByChatType`: par `direct|group|channel`
- repli hérité pour les conversations directes : `channels.slack.dm.replyToMode`

Les balises manuelles de réponse sont prises en charge :

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Remarque : `replyToMode="off"` désactive **toutes** les réponses dans les fils dans Slack, y compris les balises explicites `[[reply_to_*]]`. Cela diffère de Telegram, où les balises explicites sont toujours honorées en mode `"off"`. La différence reflète les modèles de fils des plateformes : les fils Slack masquent les messages du canal, tandis que les réponses Telegram restent visibles dans le flux principal de discussion.

## Réactions d’accusé de réception

`ackReaction` envoie un emoji d’accusé de réception pendant qu’OpenClaw traite un message entrant.

Ordre de résolution :

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- repli sur l’emoji d’identité de l’agent (`agents.list[].identity.emoji`, sinon "👀")

Remarques :

- Slack attend des shortcodes (par exemple `"eyes"`).
- Utilisez `""` pour désactiver la réaction pour le compte Slack ou globalement.

## Streaming de texte

`channels.slack.streaming` contrôle le comportement d’aperçu en direct :

- `off` : désactiver le streaming d’aperçu en direct.
- `partial` (par défaut) : remplacer le texte d’aperçu par la dernière sortie partielle.
- `block` : ajouter des mises à jour d’aperçu segmentées.
- `progress` : afficher un texte d’état de progression pendant la génération, puis envoyer le texte final.
- `streaming.preview.toolProgress` : lorsque l’aperçu brouillon est actif, acheminer les mises à jour d’outil/progression dans le même message d’aperçu modifié (par défaut : `true`). Définissez `false` pour conserver des messages d’outil/progression séparés.

`channels.slack.streaming.nativeTransport` contrôle le streaming de texte natif de Slack lorsque `channels.slack.streaming.mode` vaut `partial` (par défaut : `true`).

- Un fil de réponse doit être disponible pour que le streaming de texte natif et l’état de fil assistant de Slack apparaissent. La sélection du fil suit toujours `replyToMode`.
- Les racines de canal et de discussion de groupe peuvent toujours utiliser l’aperçu brouillon normal lorsque le streaming natif n’est pas disponible.
- Les messages privés Slack de niveau supérieur restent hors fil par défaut ; ils n’affichent donc pas l’aperçu de type fil. Utilisez des réponses en fil ou `typingReaction` si vous voulez une progression visible dans ce cas.
- Les médias et les charges utiles non textuelles reviennent au mode de livraison normal.
- Les finaux média/erreur annulent les modifications d’aperçu en attente sans vider de brouillon temporaire ; les finaux texte/bloc éligibles ne sont vidés que lorsqu’ils peuvent modifier l’aperçu sur place.
- Si le streaming échoue en cours de réponse, OpenClaw revient au mode de livraison normal pour les charges utiles restantes.

Utiliser l’aperçu brouillon au lieu du streaming de texte natif de Slack :

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
- l’ancien `channels.slack.nativeStreaming` est migré automatiquement vers `channels.slack.streaming.nativeTransport`.

## Repli de réaction de saisie

`typingReaction` ajoute une réaction temporaire au message Slack entrant pendant qu’OpenClaw traite une réponse, puis la supprime lorsque l’exécution se termine. Cela est surtout utile en dehors des réponses dans les fils, qui utilisent un indicateur d’état « is typing... » par défaut.

Ordre de résolution :

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Remarques :

- Slack attend des shortcodes (par exemple `"hourglass_flowing_sand"`).
- La réaction est appliquée au mieux, et le nettoyage est tenté automatiquement une fois la réponse terminée ou après un échec.

## Médias, segmentation et livraison

<AccordionGroup>
  <Accordion title="Pièces jointes entrantes">
    Les pièces jointes de fichiers Slack sont téléchargées depuis des URL privées hébergées par Slack (flux de requêtes authentifiées par jeton) et écrites dans le stockage média lorsque la récupération réussit et que les limites de taille le permettent.

    Le plafond de taille entrant à l’exécution est de `20MB` par défaut, sauf remplacement par `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Texte et fichiers sortants">
    - les segments de texte utilisent `channels.slack.textChunkLimit` (4000 par défaut)
    - `channels.slack.chunkMode="newline"` active la division d’abord par paragraphes
    - les envois de fichiers utilisent les API d’upload Slack et peuvent inclure des réponses dans les fils (`thread_ts`)
    - le plafond des médias sortants suit `channels.slack.mediaMaxMb` lorsqu’il est configuré ; sinon, les envois de canal utilisent les valeurs par défaut par type MIME du pipeline média
  </Accordion>

  <Accordion title="Cibles de livraison">
    Cibles explicites recommandées :

    - `user:<id>` pour les messages privés
    - `channel:<id>` pour les canaux

    Les messages privés Slack sont ouverts via les API de conversation Slack lors de l’envoi vers des cibles utilisateur.

  </Accordion>
</AccordionGroup>

## Commandes et comportement des commandes slash

Les commandes slash apparaissent dans Slack soit comme une commande configurée unique, soit comme plusieurs commandes natives. Configurez `channels.slack.slashCommand` pour modifier les valeurs par défaut des commandes :

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Les commandes natives nécessitent des [paramètres supplémentaires du manifeste](#additional-manifest-settings) dans votre application Slack et sont activées avec `channels.slack.commands.native: true` ou `commands.native: true` dans les configurations globales à la place.

- Le mode auto des commandes natives est **désactivé** pour Slack ; ainsi `commands.native: "auto"` n’active pas les commandes natives Slack.

```txt
/help
```

Les menus d’arguments natifs utilisent une stratégie de rendu adaptative qui affiche une fenêtre modale de confirmation avant d’envoyer la valeur d’option sélectionnée :

- jusqu’à 5 options : blocs de boutons
- 6 à 100 options : menu de sélection statique
- plus de 100 options : sélection externe avec filtrage asynchrone des options lorsque les gestionnaires d’options d’interactivité sont disponibles
- limites Slack dépassées : les valeurs d’option encodées reviennent à des boutons

```txt
/think
```

Les sessions slash utilisent des clés isolées telles que `agent:<agentId>:slack:slash:<userId>` et routent toujours les exécutions de commande vers la session de conversation cible en utilisant `CommandTargetSessionKey`.

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

Lorsqu’elle est activée, les agents peuvent émettre des directives de réponse propres à Slack :

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Ces directives sont compilées en Slack Block Kit et font remonter les clics ou sélections via le chemin d’événement d’interaction Slack existant.

Remarques :

- Il s’agit d’une interface spécifique à Slack. Les autres canaux ne traduisent pas les directives Slack Block Kit dans leurs propres systèmes de boutons.
- Les valeurs de rappel interactif sont des jetons opaques générés par OpenClaw, et non des valeurs brutes rédigées par l’agent.
- Si les blocs interactifs générés dépassent les limites de Slack Block Kit, OpenClaw revient à la réponse texte d’origine au lieu d’envoyer une charge utile de blocs invalide.

## Approbations Exec dans Slack

Slack peut servir de client d’approbation natif avec boutons interactifs et interactions, au lieu de revenir à l’interface Web ou au terminal.

- Les approbations Exec utilisent `channels.slack.execApprovals.*` pour le routage natif message privé/canal.
- Les approbations de Plugin peuvent toujours être résolues via la même surface de boutons native Slack lorsque la demande arrive déjà dans Slack et que le type d’identifiant d’approbation est `plugin:`.
- L’autorisation des approbateurs est toujours appliquée : seuls les utilisateurs identifiés comme approbateurs peuvent approuver ou refuser des demandes via Slack.

Cela utilise la même surface partagée de boutons d’approbation que les autres canaux. Lorsque `interactivity` est activé dans les paramètres de votre application Slack, les invites d’approbation s’affichent comme des boutons Block Kit directement dans la conversation.
Lorsque ces boutons sont présents, ils constituent l’UX principale d’approbation ; OpenClaw
ne doit inclure une commande manuelle `/approve` que lorsque le résultat de l’outil indique que les
approbations par chat ne sont pas disponibles ou que l’approbation manuelle est la seule voie possible.

Chemin de configuration :

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (facultatif ; repli sur `commands.ownerAllowFrom` lorsque possible)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, par défaut : `dm`)
- `agentFilter`, `sessionFilter`

Slack active automatiquement les approbations Exec natives lorsque `enabled` n’est pas défini ou vaut `"auto"` et qu’au moins un
approbateur est résolu. Définissez `enabled: false` pour désactiver explicitement Slack comme client d’approbation natif.
Définissez `enabled: true` pour forcer l’activation des approbations natives lorsque des approbateurs sont résolus.

Comportement par défaut sans configuration explicite des approbations Exec Slack :

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Une configuration native Slack explicite n’est nécessaire que si vous voulez remplacer les approbateurs, ajouter des filtres ou
opter pour la livraison dans la conversation d’origine :

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

Le transfert partagé `approvals.exec` est distinct. Utilisez-le uniquement lorsque les invites d’approbation Exec doivent aussi
être routées vers d’autres conversations ou vers des cibles explicites hors bande. Le transfert partagé `approvals.plugin` est également
distinct ; les boutons natifs Slack peuvent toujours résoudre les approbations de Plugin lorsque ces demandes arrivent déjà
dans Slack.

Le `/approve` dans la même conversation fonctionne également dans les canaux et messages privés Slack qui prennent déjà en charge les commandes. Voir [Approbations Exec](/fr/tools/exec-approvals) pour le modèle complet de transfert des approbations.

## Événements et comportement opérationnel

- Les modifications/suppressions de messages/diffusions de fil sont mappées vers des événements système.
- Les événements d’ajout/suppression de réaction sont mappés vers des événements système.
- Les événements d’arrivée/départ de membre, de création/renommage de canal et d’ajout/suppression d’épingle sont mappés vers des événements système.
- `channel_id_changed` peut migrer les clés de configuration de canal lorsque `configWrites` est activé.
- Les métadonnées de sujet/objectif de canal sont traitées comme un contexte non fiable et peuvent être injectées dans le contexte de routage.
- L’initialisateur de fil et l’amorçage du contexte initial d’historique du fil sont filtrés par les listes d’autorisation d’expéditeurs configurées lorsque cela s’applique.
- Les actions de bloc et interactions modales émettent des événements système structurés `Slack interaction: ...` avec des champs de charge utile riches :
  - actions de bloc : valeurs sélectionnées, libellés, valeurs de sélecteur et métadonnées `workflow_*`
  - événements modaux `view_submission` et `view_closed` avec métadonnées de canal routées et entrées de formulaire

## Pointeurs vers la référence de configuration

Référence principale :

- [Référence de configuration - Slack](/fr/gateway/configuration-reference#slack)

  Champs Slack à fort signal :
  - mode/authentification : `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
  - accès message privé : `dm.enabled`, `dmPolicy`, `allowFrom` (hérité : `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
  - bascule de compatibilité : `dangerouslyAllowNameMatching` (mode d’urgence ; laissez désactivé sauf nécessité)
  - accès canal : `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
  - fils/historique : `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
  - livraison : `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
  - opérations/fonctionnalités : `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

## Dépannage

<AccordionGroup>
  <Accordion title="Aucune réponse dans les canaux">
    Vérifiez, dans l’ordre :

    - `groupPolicy`
    - la liste d’autorisation des canaux (`channels.slack.channels`)
    - `requireMention`
    - la liste d’autorisation `users` par canal

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
    - `channels.slack.dmPolicy` (ou l’ancien `channels.slack.dm.policy`)
    - les approbations d’appairage / les entrées de liste d’autorisation

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Le mode socket ne se connecte pas">
    Validez les jetons bot + app ainsi que l’activation de Socket Mode dans les paramètres de l’application Slack.

    Si `openclaw channels status --probe --json` affiche `botTokenStatus` ou
    `appTokenStatus: "configured_unavailable"`, le compte Slack est
    configuré, mais l’exécution actuelle n’a pas pu résoudre la valeur
    soutenue par SecretRef.

  </Accordion>

  <Accordion title="Le mode HTTP ne reçoit pas d’événements">
    Validez :

    - le signing secret
    - le chemin de Webhook
    - les URL de requête Slack (événements + interactivité + commandes slash)
    - un `webhookPath` unique par compte HTTP

    Si `signingSecretStatus: "configured_unavailable"` apparaît dans les instantanés
    de compte, le compte HTTP est configuré mais l’exécution actuelle n’a pas
    pu résoudre le signing secret soutenu par SecretRef.

  </Accordion>

  <Accordion title="Les commandes natives/slash ne se déclenchent pas">
    Vérifiez si vous vouliez :

    - le mode de commande native (`channels.slack.commands.native: true`) avec les commandes slash correspondantes enregistrées dans Slack
    - ou le mode de commande slash unique (`channels.slack.slashCommand.enabled: true`)

    Vérifiez également `commands.useAccessGroups` ainsi que les listes d’autorisation de canal/utilisateur.

  </Accordion>
</AccordionGroup>

## Liens connexes

- [Appairage](/fr/channels/pairing)
- [Groupes](/fr/channels/groups)
- [Sécurité](/fr/gateway/security)
- [Routage des canaux](/fr/channels/channel-routing)
- [Dépannage](/fr/channels/troubleshooting)
- [Configuration](/fr/gateway/configuration)
- [Commandes slash](/fr/tools/slash-commands)
