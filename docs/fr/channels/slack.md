---
read_when:
    - Configurer Slack ou déboguer le mode socket/HTTP de Slack
summary: Configuration de Slack et comportement à l’exécution (Socket Mode + URL de requête HTTP)
title: Slack
x-i18n:
    generated_at: "2026-04-25T13:42:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: d8d177cad1e795ecccf31cff486b9c8036bf91b22d122e8afbd9cfaf7635e4ea
    source_path: channels/slack.md
    workflow: 15
---

Prêt pour la production pour les messages privés et les canaux via les intégrations d’application Slack. Le mode par défaut est Socket Mode ; les URL de requête HTTP sont également prises en charge.

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
  <Tab title="Socket Mode (par défaut)">
    <Steps>
      <Step title="Créer une nouvelle application Slack">
        Dans les paramètres de l’application Slack, appuyez sur le bouton **[Create New App](https://api.slack.com/apps/new)** :

        - choisissez **from a manifest** et sélectionnez un espace de travail pour votre application
        - collez l’[exemple de manifeste](#manifest-and-scope-checklist) ci-dessous et poursuivez la création
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

      <Step title="Démarrer la Gateway">

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
        - collez l’[exemple de manifeste](#manifest-and-scope-checklist) et mettez à jour les URL avant de créer
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
        Utilisez des chemins Webhook uniques pour le mode HTTP multi-comptes

        Attribuez à chaque compte un `webhookPath` distinct (par défaut `/slack/events`) afin d’éviter les conflits d’enregistrement.
        </Note>

      </Step>

      <Step title="Démarrer la Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Liste de contrôle du manifeste et des scopes

Le manifeste d’application Slack de base est identique pour Socket Mode et les URL de requête HTTP. Seul le bloc `settings` (et l’`url` de la commande slash) diffère.

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

### Paramètres supplémentaires du manifeste

Présente différentes fonctionnalités qui étendent les valeurs par défaut ci-dessus.

<AccordionGroup>
  <Accordion title="Commandes slash natives optionnelles">

    Plusieurs [commandes slash natives](#commands-and-slash-behavior) peuvent être utilisées à la place d’une seule commande configurée, avec quelques nuances :

    - Utilisez `/agentstatus` au lieu de `/status` car la commande `/status` est réservée.
    - Il n’est pas possible de rendre disponibles plus de 25 commandes slash à la fois.

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
  <Accordion title="Scopes d’attribution optionnels (opérations d’écriture)">
    Ajoutez le scope bot `chat:write.customize` si vous souhaitez que les messages sortants utilisent l’identité de l’agent actif (nom d’utilisateur et icône personnalisés) au lieu de l’identité par défaut de l’application Slack.

    Si vous utilisez une icône emoji, Slack attend la syntaxe `:emoji_name:`.
  </Accordion>
  <Accordion title="Scopes de jeton utilisateur optionnels (opérations de lecture)">
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
- Le mode HTTP nécessite `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` et `userToken` acceptent des chaînes en clair
  ou des objets SecretRef.
- Les jetons de configuration remplacent la variable d’environnement de secours.
- La variable d’environnement de secours `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` s’applique uniquement au compte par défaut.
- `userToken` (`xoxp-...`) est uniquement configurable dans la configuration (pas de secours via variable d’environnement) et utilise par défaut un comportement en lecture seule (`userTokenReadOnly: true`).

Comportement de l’instantané de statut :

- L’inspection des comptes Slack suit des champs `*Source` et `*Status`
  par identifiant d’authentification (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Le statut est `available`, `configured_unavailable` ou `missing`.
- `configured_unavailable` signifie que le compte est configuré via SecretRef
  ou une autre source de secret non inline, mais que la commande ou le chemin d’exécution actuel
  n’a pas pu résoudre la valeur réelle.
- En mode HTTP, `signingSecretStatus` est inclus ; en Socket Mode, la
  paire requise est `botTokenStatus` + `appTokenStatus`.

<Tip>
Pour les actions/lectures d’annuaire, le jeton utilisateur peut être privilégié lorsqu’il est configuré. Pour les écritures, le jeton bot reste privilégié ; les écritures avec jeton utilisateur ne sont autorisées que lorsque `userTokenReadOnly: false` et que le jeton bot n’est pas disponible.
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

Les actions de message Slack actuellement prises en charge incluent `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` et `emoji-list`. `download-file` accepte les ID de fichier Slack affichés dans les espaces réservés de fichiers entrants et renvoie des aperçus d’image pour les images ou des métadonnées de fichier local pour les autres types de fichiers.

## Contrôle d’accès et routage

<Tabs>
  <Tab title="Politique de messages privés">
    `channels.slack.dmPolicy` contrôle l’accès aux messages privés (hérité : `channels.slack.dm.policy`) :

    - `pairing` (par défaut)
    - `allowlist`
    - `open` (nécessite que `channels.slack.allowFrom` inclue `"*"` ; hérité : `channels.slack.dm.allowFrom`)
    - `disabled`

    Indicateurs de messages privés :

    - `dm.enabled` (par défaut true)
    - `channels.slack.allowFrom` (préféré)
    - `dm.allowFrom` (hérité)
    - `dm.groupEnabled` (messages privés de groupe désactivés par défaut)
    - `dm.groupChannels` (liste d’autorisation MPIM optionnelle)

    Priorité multi-comptes :

    - `channels.slack.accounts.default.allowFrom` s’applique uniquement au compte `default`.
    - Les comptes nommés héritent de `channels.slack.allowFrom` lorsque leur propre `allowFrom` n’est pas défini.
    - Les comptes nommés n’héritent pas de `channels.slack.accounts.default.allowFrom`.

    L’appairage dans les messages privés utilise `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Politique de canal">
    `channels.slack.groupPolicy` contrôle la gestion des canaux :

    - `open`
    - `allowlist`
    - `disabled`

    La liste d’autorisation des canaux se trouve sous `channels.slack.channels` et doit utiliser des ID de canal stables.

    Remarque d’exécution : si `channels.slack` est complètement absent (configuration par variable d’environnement uniquement), l’exécution utilise `groupPolicy="allowlist"` comme valeur de repli et consigne un avertissement (même si `channels.defaults.groupPolicy` est défini).

    Résolution nom/ID :

    - les entrées de liste d’autorisation des canaux et des messages privés sont résolues au démarrage lorsque l’accès par jeton le permet
    - les entrées non résolues basées sur des noms de canal sont conservées telles que configurées mais ignorées pour le routage par défaut
    - l’autorisation entrante et le routage des canaux sont basés sur les ID par défaut ; la correspondance directe par nom d’utilisateur/slug nécessite `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="Mentions et utilisateurs des canaux">
    Les messages de canal sont soumis à une exigence de mention par défaut.

    Sources de mention :

    - mention explicite de l’application (`<@botId>`)
    - motifs regex de mention (`agents.list[].groupChat.mentionPatterns`, repli `messages.groupChat.mentionPatterns`)
    - comportement implicite de réponse dans un fil au bot (désactivé lorsque `thread.requireExplicitMention` est `true`)

    Contrôles par canal (`channels.slack.channels.<id>` ; noms uniquement via résolution au démarrage ou `dangerouslyAllowNameMatching`) :

    - `requireMention`
    - `users` (liste d’autorisation)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - format de clé `toolsBySender` : `id:`, `e164:`, `username:`, `name:` ou joker `"*"`
      (les anciennes clés non préfixées correspondent toujours à `id:` uniquement)

  </Tab>
</Tabs>

## Fils, sessions et balises de réponse

- Les messages privés sont routés comme `direct` ; les canaux comme `channel` ; les MPIM comme `group`.
- Avec la valeur par défaut `session.dmScope=main`, les messages privés Slack sont regroupés dans la session principale de l’agent.
- Sessions de canal : `agent:<agentId>:slack:channel:<channelId>`.
- Les réponses dans un fil peuvent créer des suffixes de session de fil (`:thread:<threadTs>`) lorsque cela s’applique.
- `channels.slack.thread.historyScope` vaut `thread` par défaut ; `thread.inheritParent` vaut `false` par défaut.
- `channels.slack.thread.initialHistoryLimit` contrôle le nombre de messages de fil existants récupérés lorsqu’une nouvelle session de fil démarre (par défaut `20` ; définissez `0` pour désactiver).
- `channels.slack.thread.requireExplicitMention` (par défaut `false`) : lorsque défini sur `true`, supprime les mentions implicites dans les fils afin que le bot ne réponde qu’aux mentions explicites `@bot` dans les fils, même lorsque le bot a déjà participé au fil. Sans cela, les réponses dans un fil auquel le bot a participé contournent l’exigence `requireMention`.

Contrôles des réponses dans les fils :

- `channels.slack.replyToMode`: `off|first|all|batched` (par défaut `off`)
- `channels.slack.replyToModeByChatType`: par `direct|group|channel`
- valeur de repli héritée pour les conversations directes : `channels.slack.dm.replyToMode`

Les balises de réponse manuelles sont prises en charge :

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Remarque : `replyToMode="off"` désactive **tout** le threading des réponses dans Slack, y compris les balises explicites `[[reply_to_*]]`. Cela diffère de Telegram, où les balises explicites sont toujours respectées en mode `"off"` — les fils Slack masquent les messages du canal alors que les réponses Telegram restent visibles en ligne.

## Réactions d’accusé de réception

`ackReaction` envoie un emoji d’accusé de réception pendant qu’OpenClaw traite un message entrant.

Ordre de résolution :

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- repli sur l’emoji de l’identité de l’agent (`agents.list[].identity.emoji`, sinon "👀")

Remarques :

- Slack attend des shortcodes (par exemple `"eyes"`).
- Utilisez `""` pour désactiver la réaction pour le compte Slack ou globalement.

## Streaming de texte

`channels.slack.streaming` contrôle le comportement d’aperçu en direct :

- `off` : désactiver le streaming d’aperçu en direct.
- `partial` (par défaut) : remplacer le texte d’aperçu par la dernière sortie partielle.
- `block` : ajouter des mises à jour d’aperçu par blocs.
- `progress` : afficher un texte d’état de progression pendant la génération, puis envoyer le texte final.
- `streaming.preview.toolProgress` : lorsque l’aperçu brouillon est actif, acheminer les mises à jour d’outil/progression dans le même message d’aperçu modifié (par défaut : `true`). Définissez `false` pour conserver des messages d’outil/progression séparés.

`channels.slack.streaming.nativeTransport` contrôle le streaming de texte natif Slack lorsque `channels.slack.streaming.mode` est `partial` (par défaut : `true`).

- Un fil de réponse doit être disponible pour que le streaming de texte natif et l’état de fil assistant Slack apparaissent. La sélection du fil suit toujours `replyToMode`.
- Les racines de canaux et de conversations de groupe peuvent toujours utiliser l’aperçu brouillon normal lorsque le streaming natif n’est pas disponible.
- Les messages privés Slack de niveau supérieur restent hors fil par défaut, ils n’affichent donc pas d’aperçu de style fil ; utilisez des réponses dans les fils ou `typingReaction` si vous souhaitez une progression visible à cet endroit.
- Les médias et charges utiles non textuelles reviennent à la livraison normale.
- Les messages finaux média/erreur annulent les modifications d’aperçu en attente ; les messages finaux texte/bloc éligibles ne sont vidés que lorsqu’ils peuvent modifier l’aperçu sur place.
- Si le streaming échoue au milieu d’une réponse, OpenClaw revient à la livraison normale pour les charges utiles restantes.

Utilisez l’aperçu brouillon au lieu du streaming de texte natif Slack :

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

`typingReaction` ajoute une réaction temporaire au message Slack entrant pendant qu’OpenClaw traite une réponse, puis la supprime lorsque l’exécution se termine. Cela est particulièrement utile en dehors des réponses dans un fil, qui utilisent un indicateur d’état par défaut « is typing... ».

Ordre de résolution :

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Remarques :

- Slack attend des shortcodes (par exemple `"hourglass_flowing_sand"`).
- La réaction est appliquée au mieux, et le nettoyage est tenté automatiquement une fois la réponse ou le chemin d’échec terminé.

## Médias, segmentation et livraison

<AccordionGroup>
  <Accordion title="Pièces jointes entrantes">
    Les pièces jointes de fichiers Slack sont téléchargées depuis des URL privées hébergées par Slack (flux de requête authentifié par jeton) et écrites dans le stockage média lorsque la récupération réussit et que les limites de taille le permettent. Les espaces réservés de fichier incluent le `fileId` Slack afin que les agents puissent récupérer le fichier d’origine avec `download-file`.

    Le plafond de taille entrante à l’exécution est de `20MB` par défaut, sauf remplacement par `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Texte et fichiers sortants">
    - les segments de texte utilisent `channels.slack.textChunkLimit` (par défaut 4000)
    - `channels.slack.chunkMode="newline"` active un découpage privilégiant d’abord les paragraphes
    - les envois de fichiers utilisent les API de téléversement Slack et peuvent inclure des réponses dans les fils (`thread_ts`)
    - le plafond de média sortant suit `channels.slack.mediaMaxMb` lorsqu’il est configuré ; sinon, les envois du canal utilisent les valeurs par défaut par type MIME du pipeline média
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

Les commandes natives nécessitent des [paramètres supplémentaires du manifeste](#additional-manifest-settings) dans votre application Slack et sont activées avec `channels.slack.commands.native: true` ou `commands.native: true` dans les configurations globales.

- Le mode automatique des commandes natives est **désactivé** pour Slack, donc `commands.native: "auto"` n’active pas les commandes natives Slack.

```txt
/help
```

Les menus d’arguments des commandes natives utilisent une stratégie de rendu adaptative qui affiche une boîte de dialogue de confirmation avant d’envoyer une valeur d’option sélectionnée :

- jusqu’à 5 options : blocs de boutons
- 6 à 100 options : menu de sélection statique
- plus de 100 options : sélection externe avec filtrage asynchrone des options lorsque des gestionnaires d’options d’interactivité sont disponibles
- limites Slack dépassées : les valeurs d’option encodées reviennent à des boutons

```txt
/think
```

Les sessions slash utilisent des clés isolées comme `agent:<agentId>:slack:slash:<userId>` et continuent d’acheminer les exécutions de commande vers la session de conversation cible à l’aide de `CommandTargetSessionKey`.

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

Lorsqu’elle est activée, les agents peuvent émettre des directives de réponse réservées à Slack :

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Ces directives sont compilées en Slack Block Kit et acheminent les clics ou sélections via le chemin d’événement d’interaction Slack existant.

Remarques :

- Il s’agit d’une interface spécifique à Slack. Les autres canaux ne traduisent pas les directives Slack Block Kit dans leurs propres systèmes de boutons.
- Les valeurs de rappel interactif sont des jetons opaques générés par OpenClaw, et non des valeurs brutes rédigées par l’agent.
- Si les blocs interactifs générés dépassent les limites de Slack Block Kit, OpenClaw revient à la réponse texte d’origine au lieu d’envoyer une charge utile de blocs invalide.

## Approbations Exec dans Slack

Slack peut servir de client d’approbation natif avec boutons interactifs et interactions, au lieu de revenir à l’interface Web ou au terminal.

- Les approbations Exec utilisent `channels.slack.execApprovals.*` pour le routage natif DM/canal.
- Les approbations de Plugin peuvent toujours être résolues via la même interface native Slack lorsque la demande arrive déjà dans Slack et que le type d’ID d’approbation est `plugin:`.
- L’autorisation de l’approbateur est toujours appliquée : seuls les utilisateurs identifiés comme approbateurs peuvent approuver ou refuser des demandes via Slack.

Cela utilise la même interface partagée de boutons d’approbation que les autres canaux. Lorsque `interactivity` est activé dans les paramètres de votre application Slack, les invites d’approbation s’affichent sous forme de boutons Block Kit directement dans la conversation.
Lorsque ces boutons sont présents, ils constituent l’expérience d’approbation principale ; OpenClaw
ne doit inclure une commande manuelle `/approve` que lorsque le résultat de l’outil indique que les
approbations par chat ne sont pas disponibles ou que l’approbation manuelle est la seule possibilité.

Chemin de configuration :

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (optionnel ; utilise `commands.ownerAllowFrom` comme repli lorsque possible)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, par défaut : `dm`)
- `agentFilter`, `sessionFilter`

Slack active automatiquement les approbations Exec natives lorsque `enabled` n’est pas défini ou vaut `"auto"` et qu’au moins un
approbateur est résolu. Définissez `enabled: false` pour désactiver explicitement Slack en tant que client d’approbation natif.
Définissez `enabled: true` pour forcer l’activation des approbations natives lorsque des approbateurs sont résolus.

Comportement par défaut sans configuration explicite des approbations Exec Slack :

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Une configuration native Slack explicite n’est nécessaire que si vous souhaitez remplacer les approbateurs, ajouter des filtres ou
activer la livraison vers le chat d’origine :

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
être acheminées vers d’autres conversations ou des cibles explicites hors bande. Le transfert partagé `approvals.plugin` est également
distinct ; les boutons natifs Slack peuvent toujours résoudre les approbations de Plugin lorsque ces demandes arrivent déjà
dans Slack.

La commande `/approve` dans la même conversation fonctionne également dans les canaux et messages privés Slack qui prennent déjà en charge les commandes. Voir [Exec approvals](/fr/tools/exec-approvals) pour le modèle complet de transfert des approbations.

## Événements et comportement opérationnel

- Les modifications/suppressions de messages sont mappées en événements système.
- Les diffusions de fils (« Also send to channel » dans les réponses de fil) sont traitées comme des messages utilisateur normaux.
- Les événements d’ajout/suppression de réaction sont mappés en événements système.
- Les événements de jonction/quitter de membre, de création/renommage de canal et d’ajout/suppression d’épingle sont mappés en événements système.
- `channel_id_changed` peut migrer les clés de configuration de canal lorsque `configWrites` est activé.
- Les métadonnées de sujet/objectifs du canal sont traitées comme un contexte non fiable et peuvent être injectées dans le contexte de routage.
- Le message initial du fil et l’initialisation du contexte de l’historique du fil sont filtrés par les listes d’autorisation d’expéditeurs configurées lorsqu’elles s’appliquent.
- Les actions de blocs et interactions modales émettent des événements système structurés `Slack interaction: ...` avec des champs de charge utile enrichis :
  - actions de blocs : valeurs sélectionnées, libellés, valeurs de sélecteur et métadonnées `workflow_*`
  - événements modaux `view_submission` et `view_closed` avec métadonnées de canal routées et entrées de formulaire

## Référence de configuration

Référence principale : [Référence de configuration - Slack](/fr/gateway/config-channels#slack).

<Accordion title="Champs Slack à fort impact">

- mode/auth : `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- accès aux messages privés : `dm.enabled`, `dmPolicy`, `allowFrom` (hérité : `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- bascule de compatibilité : `dangerouslyAllowNameMatching` (solution de dernier recours ; laissez désactivé sauf nécessité)
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
    - événements de message privé Slack Assistant : des journaux verbeux mentionnant `drop message_changed`
      signifient généralement que Slack a envoyé un événement de fil Assistant modifié sans
      expéditeur humain récupérable dans les métadonnées du message

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Le mode Socket ne se connecte pas">
    Validez les jetons bot + app ainsi que l’activation de Socket Mode dans les paramètres de l’application Slack.

    Si `openclaw channels status --probe --json` affiche `botTokenStatus` ou
    `appTokenStatus: "configured_unavailable"`, le compte Slack est
    configuré mais l’exécution actuelle n’a pas pu résoudre la valeur
    adossée à SecretRef.

  </Accordion>

  <Accordion title="Le mode HTTP ne reçoit pas les événements">
    Validez :

    - signing secret
    - chemin Webhook
    - URL de requête Slack (Events + Interactivity + Slash Commands)
    - `webhookPath` unique par compte HTTP

    Si `signingSecretStatus: "configured_unavailable"` apparaît dans les
    instantanés de compte, le compte HTTP est configuré mais l’exécution actuelle n’a pas pu
    résoudre le signing secret adossé à SecretRef.

  </Accordion>

  <Accordion title="Les commandes natives/slash ne se déclenchent pas">
    Vérifiez si votre intention était :

    - le mode de commande native (`channels.slack.commands.native: true`) avec les commandes slash correspondantes enregistrées dans Slack
    - ou le mode à commande slash unique (`channels.slack.slashCommand.enabled: true`)

    Vérifiez également `commands.useAccessGroups` ainsi que les listes d’autorisation de canal/utilisateur.

  </Accordion>
</AccordionGroup>

## Liens associés

<CardGroup cols={2}>
  <Card title="Appairage" icon="link" href="/fr/channels/pairing">
    Appairer un utilisateur Slack à la Gateway.
  </Card>
  <Card title="Groupes" icon="users" href="/fr/channels/groups">
    Comportement des canaux et des messages privés de groupe.
  </Card>
  <Card title="Routage des canaux" icon="route" href="/fr/channels/channel-routing">
    Acheminer les messages entrants vers les agents.
  </Card>
  <Card title="Sécurité" icon="shield" href="/fr/gateway/security">
    Modèle de menace et durcissement.
  </Card>
  <Card title="Configuration" icon="sliders" href="/fr/gateway/configuration">
    Structure de configuration et ordre de priorité.
  </Card>
  <Card title="Commandes slash" icon="terminal" href="/fr/tools/slash-commands">
    Catalogue et comportement des commandes.
  </Card>
</CardGroup>
