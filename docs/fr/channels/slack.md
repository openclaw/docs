---
read_when:
    - Configuration de Slack ou débogage du mode socket, HTTP ou relais de Slack
summary: Configuration de Slack et comportement à l’exécution (mode Socket, URL de requête HTTP et mode relais)
title: Slack
x-i18n:
    generated_at: "2026-06-27T17:12:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 95acddb569b1ddc184609f0918336a7465d409351a0406f48fd5dd92a79ca9d6
    source_path: channels/slack.md
    workflow: 16
---

Prêt pour la production pour les messages directs et les canaux via les intégrations d’application Slack. Le mode par défaut est Socket Mode ; les URLs de requête HTTP sont également prises en charge. Le mode relais est destiné aux déploiements gérés où un routeur de confiance possède l’entrée Slack.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/fr/channels/pairing">
    Les messages directs Slack utilisent le mode d’association par défaut.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/fr/tools/slash-commands">
    Comportement natif des commandes et catalogue de commandes.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/fr/channels/troubleshooting">
    Diagnostics inter-canaux et procédures de réparation.
  </Card>
</CardGroup>

## Choisir Socket Mode ou les URLs de requête HTTP

Les deux transports sont prêts pour la production et atteignent la parité fonctionnelle pour la messagerie, les commandes slash, App Home et l’interactivité. Choisissez en fonction de la forme du déploiement, pas des fonctionnalités.

| Préoccupation                | Socket Mode (par défaut)                                                                                                                             | URLs de requête HTTP                                                                                           |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| URL publique du Gateway      | Non requise                                                                                                                                          | Requise (DNS, TLS, proxy inverse ou tunnel)                                                                    |
| Réseau sortant               | Le WSS sortant vers `wss-primary.slack.com` doit être joignable                                                                                      | Pas de WS sortant ; HTTPS entrant uniquement                                                                   |
| Jetons nécessaires           | Jeton de bot + jeton au niveau de l’application avec `connections:write`                                                                             | Jeton de bot + secret de signature                                                                             |
| Ordinateur de développement / derrière un pare-feu | Fonctionne tel quel                                                                                                                   | Nécessite un tunnel public (ngrok, Cloudflare Tunnel, Tailscale Funnel) ou un Gateway de préproduction         |
| Mise à l’échelle horizontale | Une session Socket Mode par application et par hôte ; plusieurs Gateways nécessitent des applications Slack distinctes                               | Gestionnaire POST sans état ; plusieurs réplicas de Gateway peuvent partager une application derrière un équilibreur de charge |
| Multi-compte sur un Gateway  | Pris en charge ; chaque compte ouvre son propre WS                                                                                                   | Pris en charge ; chaque compte nécessite un `webhookPath` unique (`/slack/events` par défaut) afin que les enregistrements n’entrent pas en collision |
| Transport des commandes slash | Livré via la connexion WS ; `slash_commands[].url` est ignoré                                                                                       | Slack envoie des POST vers `slash_commands[].url` ; le champ est requis pour que la commande soit distribuée   |
| Signature des requêtes       | Non utilisée (l’authentification est le jeton au niveau de l’application)                                                                            | Slack signe chaque requête ; OpenClaw vérifie avec `signingSecret`                                             |
| Récupération après coupure de connexion | La reconnexion automatique du SDK Slack est activée ; OpenClaw redémarre aussi les sessions Socket Mode échouées avec un backoff borné. Le réglage de transport par délai d’expiration pong s’applique. | Pas de connexion persistante à perdre ; les nouvelles tentatives sont par requête depuis Slack                 |

<Note>
  **Choisissez Socket Mode** pour les hôtes à Gateway unique, les ordinateurs de développement et les réseaux sur site qui peuvent joindre `*.slack.com` en sortie mais ne peuvent pas accepter de HTTPS entrant.

**Choisissez les URLs de requête HTTP** lorsque vous exécutez plusieurs réplicas de Gateway derrière un équilibreur de charge, lorsque le WSS sortant est bloqué mais que le HTTPS entrant est autorisé, ou lorsque vous terminez déjà les webhooks Slack sur un proxy inverse.
</Note>

### Mode relais

Le mode relais sépare l’entrée Slack du gateway OpenClaw. Un routeur de confiance possède la
connexion Slack Socket Mode unique, choisit un gateway de destination et transmet un événement
typé via un websocket authentifié. Le gateway continue d’utiliser son jeton de bot pour les
appels sortants à l’API Web Slack.

```json5
{
  channels: {
    slack: {
      mode: "relay",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      relay: {
        url: "wss://router.example.com/gateway/ws",
        authToken: { source: "env", provider: "default", id: "SLACK_RELAY_AUTH_TOKEN" },
        gatewayId: "team-gateway",
      },
    },
  },
}
```

L’URL du relais doit utiliser `wss://` sauf si elle cible localhost. Traitez le jeton bearer et
la table de routage du routeur comme faisant partie de la frontière d’autorisation Slack : les événements routés entrent dans le
gestionnaire normal des messages Slack comme des activations autorisées. Une `slack_identity`
fournie par le routeur dans la trame websocket `hello` peut définir le nom d’utilisateur et l’icône sortants par défaut ; une identité explicite
fournie par l’appelant reste prioritaire. La connexion relais se reconnecte avec le même
délai de backoff borné que Socket Mode et efface l’identité fournie par le routeur chaque fois
qu’elle se déconnecte.

## Installation

Installez Slack avant de configurer le canal :

```bash
openclaw plugins install @openclaw/slack
```

`plugins install` enregistre et active le plugin. Le plugin ne fait toujours rien tant que vous n’avez pas configuré l’application Slack et les paramètres de canal ci-dessous. Consultez [Plugins](/fr/tools/plugin) pour le comportement général des plugins et les règles d’installation.

## Configuration rapide

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Create a new Slack app">
        Ouvrez [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → sélectionnez votre espace de travail → collez l’un des manifestes ci-dessous → **Next** → **Create**.

        <CodeGroup>

```json Recommended
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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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

```json Minimal
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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
        "message.channels",
        "message.groups",
        "message.im"
      ]
    }
  }
}
```

        </CodeGroup>

        <Note>
          **Recommended** correspond à l’ensemble complet de fonctionnalités du plugin Slack : App Home, commandes slash, fichiers, réactions, épingles, messages directs de groupe et lectures des emojis/groupes d’utilisateurs. Choisissez **Minimal** lorsque la politique de l’espace de travail restreint les portées — il couvre les messages directs, l’historique des canaux/groupes, les mentions et les commandes slash, mais exclut les fichiers, les réactions, les épingles, les messages directs de groupe (`mpim:*`), `emoji:read` et `usergroups:read`. Consultez la [liste de contrôle du manifeste et des portées](#manifest-and-scope-checklist) pour la justification portée par portée et les options additives comme les commandes slash supplémentaires.
        </Note>

        Après la création de l’application par Slack :

        - **Basic Information -> App-Level Tokens -> Generate Token and Scopes** : ajoutez `connections:write`, enregistrez, copiez le jeton au niveau de l’application.
        - **Install App -> Install to Workspace** : copiez le jeton OAuth de l’utilisateur bot.

      </Step>

      <Step title="Configure OpenClaw">

        Configuration SecretRef recommandée :

```bash
export SLACK_APP_TOKEN=slack-app-token-example
export SLACK_BOT_TOKEN=slack-bot-token-example
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

        Repli env (compte par défaut uniquement) :

```bash
SLACK_APP_TOKEN=slack-app-token-example
SLACK_BOT_TOKEN=slack-bot-token-example
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
        Ouvrez [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → sélectionnez votre espace de travail → collez l’un des manifestes ci-dessous → remplacez `https://gateway-host.example.com/slack/events` par votre URL Gateway publique → **Next** → **Create**.

        <CodeGroup>

```json Recommended
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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
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

```json Minimal
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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
        "message.channels",
        "message.groups",
        "message.im"
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

        </CodeGroup>

        <Note>
          **Recommandé** correspond à l’ensemble complet de fonctionnalités du plugin Slack ; **Minimal** supprime les fichiers, les réactions, les épingles, les messages directs de groupe (`mpim:*`), `emoji:read` et `usergroups:read` pour les espaces de travail restrictifs. Consultez la [liste de contrôle du manifeste et des portées](#manifest-and-scope-checklist) pour connaître la justification de chaque portée.
        </Note>

        <Info>
          Les trois champs d’URL (`slash_commands[].url`, `event_subscriptions.request_url` et `interactivity.request_url` / `message_menu_options_url`) pointent tous vers le même point de terminaison OpenClaw. Le schéma de manifeste Slack exige qu’ils soient nommés séparément, mais OpenClaw route selon le type de charge utile ; un seul `webhookPath` (par défaut `/slack/events`) suffit donc. Les commandes slash sans `slash_commands[].url` ne feront silencieusement rien en mode HTTP.
        </Info>

        Une fois l’application créée par Slack :

        - **Basic Information → App Credentials** : copiez le **Signing Secret** pour la vérification des requêtes.
        - **Install App -> Install to Workspace** : copiez le Bot User OAuth Token.

      </Step>

      <Step title="Configure OpenClaw">

        Configuration SecretRef recommandée :

```bash
export SLACK_BOT_TOKEN=slack-bot-token-example
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
        Utiliser des chemins Webhook uniques pour le HTTP multicompte

        Donnez à chaque compte un `webhookPath` distinct (par défaut `/slack/events`) afin que les enregistrements n’entrent pas en conflit.
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

## Réglage du transport en mode Socket

OpenClaw définit par défaut le délai d’attente pong du client SDK Slack à 15 secondes pour le mode Socket. Remplacez les paramètres de transport uniquement lorsque vous avez besoin d’un réglage propre à un espace de travail ou à un hôte :

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

Utilisez ceci uniquement pour les espaces de travail en mode Socket qui consignent des délais d’attente websocket pong/server-ping de Slack ou qui s’exécutent sur des hôtes présentant une famine connue de la boucle d’événements. `clientPingTimeout` est l’attente du pong après l’envoi d’un ping client par le SDK ; `serverPingTimeout` est l’attente des pings serveur Slack. Les messages et événements de l’application restent de l’état applicatif, pas des signaux de vivacité du transport.

Remarques :

- `socketMode` est ignoré en mode HTTP Request URL.
- Les paramètres de base `channels.slack.socketMode` s’appliquent à tous les comptes Slack sauf remplacement. Les remplacements par compte utilisent `channels.slack.accounts.<accountId>.socketMode` ; comme il s’agit d’un remplacement d’objet, incluez chaque champ de réglage de socket souhaité pour ce compte.
- Seul `clientPingTimeout` possède une valeur par défaut OpenClaw (`15000`). `serverPingTimeout` et `pingPongLoggingEnabled` ne sont transmis au SDK Slack que lorsqu’ils sont configurés.
- Le délai de reprise au redémarrage du mode Socket commence autour de 2 secondes et plafonne autour de 30 secondes. Les échecs récupérables de démarrage, d’attente de démarrage et de déconnexion réessaient jusqu’à l’arrêt du canal. Les erreurs permanentes de compte et d’identifiants, comme une authentification invalide, des jetons révoqués ou des portées manquantes, échouent rapidement au lieu de réessayer indéfiniment.

## Liste de contrôle du manifeste et des portées

Le manifeste de base de l’application Slack est le même pour le mode Socket et les HTTP Request URLs. Seul le bloc `settings` (et l’`url` de commande slash) diffère.

Manifeste de base (mode Socket par défaut) :

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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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

Pour le **mode HTTP Request URLs**, remplacez `settings` par la variante HTTP et ajoutez `url` à chaque commande slash. URL publique requise :

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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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

Exposez différentes fonctionnalités qui étendent les valeurs par défaut ci-dessus.

Le manifeste par défaut active l’onglet **Accueil** de Slack App Home et s’abonne à `app_home_opened`. Lorsqu’un membre de l’espace de travail ouvre l’onglet Accueil, OpenClaw publie une vue d’accueil par défaut sûre avec `views.publish` ; aucune charge utile de conversation ni configuration privée n’est incluse. L’onglet **Messages** reste activé pour les messages directs Slack. Le manifeste active également les fils d’assistant Slack avec `features.assistant_view`, `assistant:write`, `assistant_thread_started` et `assistant_thread_context_changed` ; les fils d’assistant sont routés vers leurs propres sessions de fil OpenClaw et gardent le contexte de fil fourni par Slack disponible pour l’agent.

<AccordionGroup>
  <Accordion title="Commandes slash natives facultatives">

    Plusieurs [commandes slash natives](#commands-and-slash-behavior) peuvent être utilisées au lieu d’une seule commande configurée, avec quelques nuances :

    - Utilisez `/agentstatus` au lieu de `/status`, car la commande `/status` est réservée.
    - Pas plus de 25 commandes slash peuvent être disponibles simultanément.

    Remplacez votre section `features.slash_commands` existante par un sous-ensemble des [commandes disponibles](/fr/tools/slash-commands#command-list) :

    <Tabs>
      <Tab title="Mode Socket (par défaut)">

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
      "command": "/approve",
      "description": "Approve or deny pending approval requests",
      "usage_hint": "<id> <decision>"
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
        Utilisez la même liste `slash_commands` que pour le mode Socket ci-dessus, et ajoutez `"url": "https://gateway-host.example.com/slack/events"` à chaque entrée. Exemple :

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
  <Accordion title="Portées de jeton utilisateur facultatives (opérations de lecture)">
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
- Le mode relais nécessite `botToken` ainsi que `relay.url`, `relay.authToken` et `relay.gatewayId` ; il n’utilise pas de jeton d’application ni de secret de signature.
- `botToken`, `appToken`, `signingSecret`, `relay.authToken` et `userToken` acceptent des chaînes en texte brut
  ou des objets SecretRef.
- Les jetons de configuration remplacent le repli env.
- Le repli env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` s’applique uniquement au compte par défaut.
- `userToken` est uniquement configurable (pas de repli env) et utilise par défaut un comportement en lecture seule (`userTokenReadOnly: true`).

Comportement de l’instantané de statut :

- L’inspection de compte Slack suit les champs `*Source` et `*Status`
  par identifiant (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Le statut est `available`, `configured_unavailable` ou `missing`.
- `configured_unavailable` signifie que le compte est configuré via SecretRef
  ou une autre source de secret non inline, mais que le chemin de commande/runtime actuel
  n’a pas pu résoudre la valeur réelle.
- En mode HTTP, `signingSecretStatus` est inclus ; en mode Socket, la
  paire requise est `botTokenStatus` + `appTokenStatus`.

<Tip>
Pour les actions/lectures d’annuaire, le jeton utilisateur peut être préféré lorsqu’il est configuré. Pour les écritures, le jeton de bot reste préféré ; les écritures avec jeton utilisateur ne sont autorisées que lorsque `userTokenReadOnly: false` et que le jeton de bot est indisponible.
</Tip>

## Actions et garde-fous

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
    `channels.slack.dmPolicy` contrôle l’accès aux DM. `channels.slack.allowFrom` est la liste d’autorisation canonique des DM.

    - `pairing` (par défaut)
    - `allowlist`
    - `open` (nécessite que `channels.slack.allowFrom` inclue `"*"`)
    - `disabled`

    Indicateurs de DM :

    - `dm.enabled` (true par défaut)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (hérité)
    - `dm.groupEnabled` (DM de groupe désactivés par défaut)
    - `dm.groupChannels` (liste d’autorisation MPIM facultative)

    Priorité multi-compte :

    - `channels.slack.accounts.default.allowFrom` s’applique uniquement au compte `default`.
    - Les comptes nommés héritent de `channels.slack.allowFrom` lorsque leur propre `allowFrom` n’est pas défini.
    - Les comptes nommés n’héritent pas de `channels.slack.accounts.default.allowFrom`.

    Les anciens `channels.slack.dm.policy` et `channels.slack.dm.allowFrom` sont encore lus pour compatibilité. `openclaw doctor --fix` les migre vers `dmPolicy` et `allowFrom` lorsqu’il peut le faire sans modifier l’accès.

    L’appairage dans les DM utilise `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Channel policy">
    `channels.slack.groupPolicy` contrôle la gestion des canaux :

    - `open`
    - `allowlist`
    - `disabled`

    La liste d’autorisation des canaux se trouve sous `channels.slack.channels` et **doit utiliser des ID de canal Slack stables** (par exemple `C12345678`) comme clés de configuration.

    Note d’exécution : si `channels.slack` est complètement absent (configuration uniquement par variables d’environnement), le runtime revient à `groupPolicy="allowlist"` et journalise un avertissement (même si `channels.defaults.groupPolicy` est défini).

    Résolution nom/ID :

    - les entrées de liste d’autorisation des canaux et les entrées de liste d’autorisation des DM sont résolues au démarrage lorsque l’accès par jeton le permet
    - les entrées de nom de canal non résolues sont conservées telles que configurées, mais ignorées par défaut pour le routage
    - l’autorisation entrante et le routage des canaux privilégient les ID par défaut ; la correspondance directe par nom d’utilisateur/slug nécessite `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Les clés basées sur le nom (`#channel-name` ou `channel-name`) ne correspondent **pas** avec `groupPolicy: "allowlist"`. La recherche de canal privilégie les ID par défaut, donc une clé basée sur le nom ne sera jamais routée correctement et tous les messages de ce canal seront bloqués silencieusement. Cela diffère de `groupPolicy: "open"`, où la clé de canal n’est pas requise pour le routage et une clé basée sur le nom semble fonctionner.

    Utilisez toujours l’ID de canal Slack comme clé. Pour le trouver : faites un clic droit sur le canal dans Slack → **Copy link** — l’ID (`C...`) apparaît à la fin de l’URL.

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

  <Tab title="Mentions and channel users">
    Les messages de canal exigent une mention par défaut.

    Sources de mention :

    - mention explicite de l’application (`<@botId>`)
    - mention de groupe d’utilisateurs Slack (`<!subteam^S...>`) lorsque l’utilisateur bot est membre de ce groupe d’utilisateurs ; nécessite `usergroups:read`
    - motifs d’expression régulière de mention (`agents.list[].groupChat.mentionPatterns`, repli `messages.groupChat.mentionPatterns`)
    - comportement implicite de réponse au bot dans le fil (désactivé lorsque `thread.requireExplicitMention` vaut `true`)

    Contrôles par canal (`channels.slack.channels.<id>` ; noms uniquement via la résolution au démarrage ou `dangerouslyAllowNameMatching`) :

    - `requireMention`
    - `users` (liste d’autorisation)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - format de clé `toolsBySender` : `channel:`, `id:`, `e164:`, `username:`, `name:`, ou caractère générique `"*"`
      (les anciennes clés sans préfixe correspondent toujours uniquement à `id:`)

    `allowBots` est conservateur pour les canaux et les canaux privés : les messages de salon rédigés par un bot ne sont acceptés que lorsque le bot expéditeur est explicitement listé dans la liste d'autorisation `users` de ce salon, ou lorsqu'au moins un ID de propriétaire Slack explicite provenant de `channels.slack.allowFrom` est actuellement membre du salon. Les caractères génériques et les entrées de propriétaire sous forme de nom d'affichage ne satisfont pas la présence du propriétaire. La présence du propriétaire utilise `conversations.members` de Slack ; assurez-vous que l'application dispose de la portée de lecture correspondante pour le type de salon (`channels:read` pour les canaux publics, `groups:read` pour les canaux privés). Si la recherche des membres échoue, OpenClaw supprime le message de salon rédigé par le bot.

    Les messages Slack rédigés par un bot et acceptés utilisent la [protection contre les boucles de bot](/fr/channels/bot-loop-protection) partagée. Configurez `channels.defaults.botLoopProtection` pour le budget par défaut, puis remplacez-le par `channels.slack.botLoopProtection` ou `channels.slack.channels.<id>.botLoopProtection` lorsqu'un espace de travail ou un canal nécessite une limite différente.

  </Tab>
</Tabs>

## Fils de discussion, sessions et balises de réponse

- Les MP sont routés comme `direct` ; les canaux comme `channel` ; les MPIM comme `group`.
- Les liaisons de route Slack acceptent les ID de pairs bruts ainsi que les formes de cible Slack comme `channel:C12345678`, `user:U12345678` et `<@U12345678>`.
- Avec la valeur par défaut `session.dmScope=main`, les MP Slack sont regroupés dans la session principale de l'agent.
- Sessions de canal : `agent:<agentId>:slack:channel:<channelId>`.
- Les messages ordinaires de niveau supérieur dans un canal restent sur la session par canal, même lorsque `replyToMode` n'est pas `off`.
- Les réponses dans un fil Slack utilisent le `thread_ts` Slack parent pour les suffixes de session (`:thread:<threadTs>`), même lorsque le filage des réponses sortantes est désactivé avec `replyToMode="off"`.
- OpenClaw amorce une racine de canal de niveau supérieur éligible dans `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>` lorsque cette racine devrait démarrer un fil Slack visible, afin que la racine et les réponses ultérieures du fil partagent une seule session OpenClaw. Cela s'applique aux événements `app_mention`, aux correspondances explicites de bot ou de motif de mention configuré, ainsi qu'aux canaux `requireMention: false` avec un `replyToMode` différent de `off`.
- La valeur par défaut de `channels.slack.thread.historyScope` est `thread` ; celle de `thread.inheritParent` est `false`.
- `channels.slack.thread.initialHistoryLimit` contrôle combien de messages existants du fil sont récupérés lorsqu'une nouvelle session de fil démarre (par défaut `20` ; définissez `0` pour désactiver).
- `channels.slack.thread.requireExplicitMention` (par défaut `false`) : lorsque la valeur est `true`, supprime les mentions implicites dans les fils afin que le bot ne réponde qu'aux mentions explicites `@bot` dans les fils, même lorsque le bot a déjà participé au fil. Sans cela, les réponses dans un fil auquel le bot a participé contournent le filtrage `requireMention`.

Contrôles du filage des réponses :

- `channels.slack.replyToMode` : `off|first|all|batched` (par défaut `off`)
- `channels.slack.replyToModeByChatType` : par `direct|group|channel`
- solution de repli héritée pour les conversations directes : `channels.slack.dm.replyToMode`

Les balises de réponse manuelles sont prises en charge :

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Pour les réponses explicites dans un fil Slack depuis l'outil `message`, définissez `replyBroadcast: true` avec `action: "send"` et `threadId` ou `replyTo` afin de demander à Slack de diffuser également la réponse du fil dans le canal parent. Cela correspond au drapeau `reply_broadcast` de `chat.postMessage` de Slack et n'est pris en charge que pour les envois de texte ou Block Kit, pas pour les téléversements de médias.

Lorsqu'un appel à l'outil `message` s'exécute dans un fil Slack et cible le même canal, OpenClaw hérite normalement du fil Slack actuel conformément à `replyToMode`. Définissez `topLevel: true` sur `action: "send"` ou `action: "upload-file"` pour forcer à la place un nouveau message dans le canal parent. `threadId: null` est accepté comme la même désactivation de niveau supérieur.

<Note>
`replyToMode="off"` désactive le filage des réponses Slack sortantes, y compris les balises explicites `[[reply_to_*]]`. Il n'aplatit pas les sessions de fil Slack entrantes : les messages déjà publiés dans un fil Slack sont toujours routés vers la session `:thread:<threadTs>`. Cela diffère de Telegram, où les balises explicites sont toujours honorées en mode `"off"`. Les fils Slack masquent les messages dans le canal, tandis que les réponses Telegram restent visibles en ligne.
</Note>

## Réactions d'accusé de réception

`ackReaction` envoie un emoji d'accusé de réception pendant qu'OpenClaw traite un message entrant. `ackReactionScope` décide _quand_ cet emoji est réellement envoyé.

### Emoji (`ackReaction`)

Ordre de résolution :

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- emoji de l'identité de l'agent en solution de repli (`agents.list[].identity.emoji`, sinon `"eyes"` / 👀)

Notes :

- Slack attend des codes courts (par exemple `"eyes"`).
- Utilisez `""` pour désactiver la réaction pour le compte Slack ou globalement.

### Portée (`messages.ackReactionScope`)

Le fournisseur Slack lit la portée depuis `messages.ackReactionScope` (par défaut `"group-mentions"`). Il n'existe aujourd'hui aucun remplacement au niveau du compte Slack ou du canal Slack ; la valeur est globale au Gateway.

Valeurs :

- `"all"` : réagir dans les MP et les groupes.
- `"direct"` : réagir uniquement dans les MP.
- `"group-all"` : réagir à chaque message de groupe (pas dans les MP).
- `"group-mentions"` (par défaut) : réagir dans les groupes, mais seulement lorsque le bot est mentionné (ou dans les éléments mentionnables de groupe qui ont opté pour cela). **Les MP sont exclus.**
- `"off"` / `"none"` : ne jamais réagir.

<Note>
La portée par défaut (`"group-mentions"`) ne déclenche pas de réactions d'accusé de réception dans les messages directs. Pour voir le `ackReaction` configuré (par exemple `"eyes"`) sur les MP Slack entrants, définissez `messages.ackReactionScope` sur `"direct"` ou `"all"`. `messages.ackReactionScope` est lu au démarrage du fournisseur Slack ; un redémarrage du Gateway est donc nécessaire pour que la modification prenne effet.
</Note>

```json5
{
  messages: {
    ackReaction: "eyes",
    ackReactionScope: "all", // réagir dans les MP et les groupes
  },
}
```

## Diffusion de texte en streaming

`channels.slack.streaming` contrôle le comportement de l'aperçu en direct :

- `off` : désactiver la diffusion de l'aperçu en direct.
- `partial` (par défaut) : remplacer le texte de l'aperçu par la dernière sortie partielle.
- `block` : ajouter des mises à jour d'aperçu fragmentées.
- `progress` : afficher le texte d'état de progression pendant la génération, puis envoyer le texte final.
- `streaming.preview.toolProgress` : lorsque l'aperçu de brouillon est actif, router les mises à jour d'outil/de progression vers le même message d'aperçu modifié (par défaut : `true`). Définissez `false` pour conserver des messages d'outil/de progression séparés.
- `streaming.preview.commandText` / `streaming.progress.commandText` : définissez sur `status` pour conserver des lignes de progression d'outil compactes tout en masquant le texte brut de commande/d'exécution (par défaut : `raw`).

Masquer le texte brut de commande/d'exécution tout en conservant des lignes de progression compactes :

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

`channels.slack.streaming.nativeTransport` contrôle la diffusion de texte native Slack lorsque `channels.slack.streaming.mode` vaut `partial` (par défaut : `true`).

Les cartes de tâches de progression natives Slack sont optionnelles pour le mode progression. Définissez `channels.slack.streaming.progress.nativeTaskCards` sur `true` avec `channels.slack.streaming.mode="progress"` pour envoyer une carte de plan/tâche native Slack pendant l'exécution du travail, puis mettre à jour la même carte de tâche à la fin. Sans ce drapeau, le mode progression conserve le comportement portable d'aperçu de brouillon.

- Un fil de réponse doit être disponible pour que la diffusion de texte native et l'état de fil de l'assistant Slack apparaissent. La sélection du fil suit toujours `replyToMode`.
- Les racines de canal, de conversation de groupe et de MP de niveau supérieur peuvent toujours utiliser l'aperçu de brouillon normal lorsque la diffusion native est indisponible ou qu'aucun fil de réponse n'existe.
- Les MP Slack de niveau supérieur restent sans fil par défaut ; ils n'affichent donc pas l'aperçu de diffusion/d'état natif de style fil de Slack. OpenClaw publie et modifie plutôt un aperçu de brouillon dans le MP.
- Les médias et charges utiles non textuelles reviennent à la livraison normale.
- Les finaux de média/erreur annulent les modifications d'aperçu en attente ; les finaux texte/bloc éligibles ne sont vidés que lorsqu'ils peuvent modifier l'aperçu sur place.
- Si la diffusion échoue au milieu d'une réponse, OpenClaw revient à la livraison normale pour les charges utiles restantes.

Utiliser l'aperçu de brouillon au lieu de la diffusion de texte native Slack :

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

Activer les cartes de tâches de progression natives Slack :

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "progress",
        progress: {
          nativeTaskCards: true,
          render: "rich",
        },
      },
    },
  },
}
```

Clés héritées :

- `channels.slack.streamMode` (`replace | status_final | append`) est un alias d'exécution hérité pour `channels.slack.streaming.mode`.
- le booléen `channels.slack.streaming` est un alias d'exécution hérité pour `channels.slack.streaming.mode` et `channels.slack.streaming.nativeTransport`.
- l'ancien `channels.slack.nativeStreaming` est un alias d'exécution pour `channels.slack.streaming.nativeTransport`.
- Exécutez `openclaw doctor --fix` pour réécrire la configuration de streaming Slack persistée avec les clés canoniques.

## Solution de repli de réaction de saisie

`typingReaction` ajoute une réaction temporaire au message Slack entrant pendant qu'OpenClaw traite une réponse, puis la supprime lorsque l'exécution se termine. C'est surtout utile en dehors des réponses dans un fil, qui utilisent un indicateur d'état par défaut "est en train d'écrire...".

Ordre de résolution :

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Notes :

- Slack attend des codes courts (par exemple `"hourglass_flowing_sand"`).
- La réaction est effectuée au mieux et le nettoyage est tenté automatiquement une fois le chemin de réponse ou d'échec terminé.

## Médias, découpage et livraison

<AccordionGroup>
  <Accordion title="Pièces jointes entrantes">
    Les pièces jointes de fichiers Slack sont téléchargées depuis des URL privées hébergées par Slack (flux de requête authentifié par jeton) et écrites dans le magasin de médias lorsque la récupération réussit et que les limites de taille le permettent. Les espaces réservés de fichier incluent le `fileId` Slack afin que les agents puissent récupérer le fichier d'origine avec `download-file`.

    Les téléchargements utilisent des délais d'expiration bornés pour l'inactivité et la durée totale. Si la récupération d'un fichier Slack se bloque ou échoue, OpenClaw continue de traiter le message et revient à l'espace réservé du fichier.

    Le plafond de taille entrante à l'exécution vaut par défaut `20MB`, sauf remplacement par `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Texte et fichiers sortants">
    - les fragments de texte utilisent `channels.slack.textChunkLimit` (par défaut 4000)
    - `channels.slack.chunkMode="newline"` active le découpage en privilégiant les paragraphes
    - les envois de fichiers utilisent les API de téléversement Slack et peuvent inclure des réponses dans un fil (`thread_ts`)
    - le plafond des médias sortants suit `channels.slack.mediaMaxMb` lorsqu'il est configuré ; sinon, les envois de canal utilisent les valeurs par défaut par type MIME du pipeline média

  </Accordion>

  <Accordion title="Cibles de livraison">
    Cibles explicites préférées :

    - `user:<id>` pour les MP
    - `channel:<id>` pour les canaux

    Les MP Slack texte/bloc uniquement peuvent publier directement vers des ID utilisateur ; les téléversements de fichiers et les envois avec fil ouvrent d'abord le MP via les API de conversation Slack, car ces chemins nécessitent un ID de conversation concret.

  </Accordion>
</AccordionGroup>

## Commandes et comportement slash

Les commandes slash apparaissent dans Slack soit comme une seule commande configurée, soit comme plusieurs commandes natives. Configurez `channels.slack.slashCommand` pour modifier les valeurs par défaut des commandes :

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Les commandes natives nécessitent des [paramètres de manifeste supplémentaires](#additional-manifest-settings) dans votre application Slack et sont activées avec `channels.slack.commands.native: true` ou `commands.native: true` dans les configurations globales à la place.

- Le mode automatique des commandes natives est **désactivé** pour Slack, donc `commands.native: "auto"` n'active pas les commandes natives Slack.

```txt
/help
```

Les menus d'arguments natifs utilisent une stratégie de rendu adaptative qui affiche une fenêtre modale de confirmation avant de distribuer une valeur d'option sélectionnée :

- jusqu'à 5 options : blocs de boutons
- 6 à 100 options : menu de sélection statique
- plus de 100 options : sélection externe avec filtrage asynchrone des options lorsque les gestionnaires d'options d'interactivité sont disponibles
- limites Slack dépassées : les valeurs d'option encodées reviennent à des boutons

```txt
/think
```

Les sessions slash utilisent des clés isolées comme `agent:<agentId>:slack:slash:<userId>` et acheminent toujours les exécutions de commandes vers la session de conversation cible avec `CommandTargetSessionKey`.

## Réponses interactives

Slack peut afficher des contrôles de réponse interactive rédigés par l’agent, mais cette fonctionnalité est désactivée par défaut.
Pour les nouvelles sorties d’agent, de CLI et de Plugin, privilégiez les boutons ou blocs de sélection partagés
`presentation`. Ils utilisent le même chemin d’interaction Slack
tout en se dégradant aussi sur les autres canaux.

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

Une fois activée, les agents peuvent toujours émettre des directives de réponse obsolètes propres à Slack :

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Ces directives sont compilées en Slack Block Kit et acheminent les clics ou sélections
via le chemin d’événement d’interaction Slack existant. Conservez-les pour les anciens
prompts et les solutions de secours propres à Slack ; utilisez la présentation partagée pour les nouveaux
contrôles portables.

Les API du compilateur de directives sont également obsolètes pour le nouveau code producteur :

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

Utilisez les charges utiles `presentation` et `buildSlackPresentationBlocks(...)` pour les nouveaux
contrôles affichés dans Slack.

Remarques :

- Il s’agit d’une interface utilisateur héritée propre à Slack. Les autres canaux ne traduisent pas les directives Slack Block
  Kit dans leurs propres systèmes de boutons.
- Les valeurs de rappel interactif sont des jetons opaques générés par OpenClaw, et non des valeurs brutes rédigées par l’agent.
- Si les blocs interactifs générés dépassaient les limites de Slack Block Kit, OpenClaw revient à la réponse textuelle d’origine au lieu d’envoyer une charge utile de blocs invalide.

### Soumissions de modales appartenant aux Plugins

Les plugins Slack qui enregistrent un gestionnaire interactif peuvent aussi recevoir les événements de cycle de vie de modale
`view_submission` et `view_closed` avant qu’OpenClaw compacte
la charge utile pour l’événement système visible par l’agent. Utilisez l’un de ces modèles de routage
lors de l’ouverture d’une modale Slack :

- Définissez `callback_id` sur `openclaw:<namespace>:<payload>`.
- Ou conservez un `callback_id` existant et placez `pluginInteractiveData:
"<namespace>:<payload>"` dans le `private_metadata` de la modale.

Le gestionnaire reçoit `ctx.interaction.kind` sous la forme `view_submission` ou
`view_closed`, les `inputs` normalisées, et l’objet brut complet `stateValues` provenant de
Slack. Le routage par callback-id seul suffit à invoquer le gestionnaire du Plugin ; incluez
les champs de routage utilisateur/session `private_metadata` existants de la modale lorsque celle-ci
doit aussi produire un événement système visible par l’agent. L’agent reçoit un
événement système compact et expurgé `Slack interaction: ...`. Si le gestionnaire renvoie
`systemEvent.summary`, `systemEvent.reference` ou `systemEvent.data`, ces
champs sont inclus dans cet événement compact afin que l’agent puisse référencer
le stockage appartenant au Plugin sans voir la charge utile complète du formulaire.

## Approbations natives dans Slack

Slack peut agir comme client d’approbation natif avec des boutons et interactions interactifs, au lieu de revenir à l’interface Web ou au terminal.

- Les approbations d’exécution et de Plugin peuvent s’afficher comme des prompts Slack-native Block Kit.
- `channels.slack.execApprovals.*` reste la configuration d’activation du client d’approbation d’exécution natif et de routage DM/canal.
- Les DM d’approbation d’exécution utilisent `channels.slack.execApprovals.approvers` ou `commands.ownerAllowFrom`.
- Les approbations de Plugin utilisent des boutons Slack-native lorsque Slack est activé comme client d’approbation natif pour la session d’origine, ou lorsque `approvals.plugin` route vers la session Slack d’origine ou vers une cible Slack.
- Les DM d’approbation de Plugin utilisent les approbateurs de Plugin Slack provenant de `channels.slack.allowFrom`, de `allowFrom` de compte nommé, ou de la route par défaut du compte.
- L’autorisation des approbateurs reste appliquée : les approbateurs d’exécution uniquement ne peuvent pas approuver les requêtes de Plugin sauf s’ils sont aussi approbateurs de Plugin.

Cela utilise la même surface partagée de bouton d’approbation que les autres canaux. Lorsque `interactivity` est activé dans les paramètres de votre application Slack, les prompts d’approbation s’affichent comme des boutons Block Kit directement dans la conversation.
Lorsque ces boutons sont présents, ils constituent l’expérience d’approbation principale ; OpenClaw
ne doit inclure une commande manuelle `/approve` que lorsque le résultat de l’outil indique que les approbations
par chat ne sont pas disponibles ou que l’approbation manuelle est le seul chemin.

Chemin de configuration :

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (facultatif ; revient à `commands.ownerAllowFrom` lorsque possible)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, par défaut : `dm`)
- `agentFilter`, `sessionFilter`

Slack active automatiquement les approbations d’exécution natives lorsque `enabled` n’est pas défini ou vaut `"auto"` et qu’au moins un
approbateur d’exécution est résolu. Slack peut aussi gérer les approbations de Plugin natives via ce chemin de client natif
lorsque les approbateurs de Plugin Slack sont résolus et que la requête correspond aux filtres du client natif. Définissez
`enabled: false` pour désactiver explicitement Slack comme client d’approbation natif. Définissez `enabled: true` pour
forcer l’activation des approbations natives lorsque les approbateurs sont résolus. Désactiver les approbations d’exécution Slack ne désactive pas
la livraison native des approbations de Plugin Slack activée via `approvals.plugin` ; la livraison des approbations de Plugin
utilise plutôt les approbateurs de Plugin Slack.

Comportement par défaut sans configuration explicite d’approbation d’exécution Slack :

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

La configuration explicite Slack-native n’est nécessaire que lorsque vous voulez remplacer les approbateurs, ajouter des filtres ou
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

Le transfert partagé `approvals.exec` est distinct. Utilisez-le uniquement lorsque les prompts d’approbation d’exécution doivent aussi
être routés vers d’autres chats ou vers des cibles hors bande explicites. Le transfert partagé `approvals.plugin` est également
distinct ; la livraison native Slack supprime ce repli uniquement lorsque Slack peut gérer la requête d’approbation de Plugin
nativement.

`/approve` dans le même chat fonctionne aussi dans les canaux Slack et les DM qui prennent déjà en charge les commandes. Consultez [Approbations d’exécution](/fr/tools/exec-approvals) pour le modèle complet de transfert des approbations.

## Événements et comportement opérationnel

- Les modifications/suppressions de messages sont mappées en événements système.
- Les diffusions de fil (« Envoyer également au canal » pour les réponses de fil) sont traitées comme des messages utilisateur normaux.
- Les événements d’ajout/suppression de réaction sont mappés en événements système.
- Les événements d’arrivée/départ de membre, de création/renommage de canal et d’ajout/suppression d’épingle sont mappés en événements système.
- `channel_id_changed` peut migrer les clés de configuration de canal lorsque `configWrites` est activé.
- Les métadonnées de sujet/objectif de canal sont traitées comme un contexte non fiable et peuvent être injectées dans le contexte de routage.
- Le message initial de fil et l’amorçage du contexte d’historique initial du fil sont filtrés par les listes d’autorisation d’expéditeurs configurées lorsque cela s’applique.
- Les actions de bloc, raccourcis et interactions de modale émettent des événements système structurés `Slack interaction: ...` avec des champs de charge utile riches :
  - actions de bloc : valeurs sélectionnées, libellés, valeurs de sélecteur et métadonnées `workflow_*`
  - raccourcis globaux : métadonnées de rappel et d’acteur, routées vers la session directe de l’acteur
  - raccourcis de message : contexte de rappel, d’acteur, de canal, de fil et de message sélectionné
  - événements de modale `view_submission` et `view_closed` avec métadonnées de canal routées et entrées de formulaire

Définissez des raccourcis globaux ou de message dans la configuration de votre application Slack et utilisez n’importe quel ID de rappel non vide. OpenClaw acquitte les charges utiles de raccourci correspondantes, applique la même politique d’expéditeur DM/canal que les autres interactions Slack, et met en file l’événement nettoyé pour la session d’agent routée. Les ID de déclenchement et les URL de réponse sont expurgés du contexte de l’agent.

## Référence de configuration

Référence principale : [Référence de configuration - Slack](/fr/gateway/config-channels#slack).

<Accordion title="Champs Slack à fort signal">

- mode/authentification : `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- accès DM : `dm.enabled`, `dmPolicy`, `allowFrom` (hérité : `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- bascule de compatibilité : `dangerouslyAllowNameMatching` (mesure d’urgence ; laissez désactivé sauf nécessité)
- accès canal : `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- fils/historique : `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- livraison : `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- aperçus : `unfurlLinks` (par défaut : `false`), `unfurlMedia` pour le contrôle des aperçus de liens/médias de `chat.postMessage` ; définissez `unfurlLinks: true` pour réactiver les aperçus de liens
- opérations/fonctionnalités : `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Dépannage

<AccordionGroup>
  <Accordion title="Aucune réponse dans les canaux">
    Vérifiez, dans l’ordre :

    - `groupPolicy`
    - liste d’autorisation de canal (`channels.slack.channels`) — **les clés doivent être des ID de canal** (`C12345678`), pas des noms (`#channel-name`). Les clés basées sur le nom échouent silencieusement sous `groupPolicy: "allowlist"` car le routage de canal utilise les ID en priorité par défaut. Pour trouver un ID : faites un clic droit sur le canal dans Slack → **Copier le lien** — la valeur `C...` à la fin de l’URL est l’ID du canal.
    - `requireMention`
    - liste d’autorisation `users` par canal
    - `messages.groupChat.visibleReplies` : les requêtes normales de groupe/canal utilisent `"automatic"` par défaut. Si vous avez opté pour `"message_tool"` et que les journaux affichent du texte d’assistant sans appel `message(action=send)`, le modèle a manqué le chemin visible de l’outil de message. Le texte final reste privé dans ce mode ; inspectez le journal verbeux du Gateway pour les métadonnées de charge utile supprimées, ou définissez la valeur sur `"automatic"` si vous voulez que chaque réponse finale normale de l’assistant soit publiée via le chemin hérité.
    - `messages.groupChat.unmentionedInbound` : si sa valeur est `"room_event"`, les échanges de canal autorisés sans mention sont un contexte ambiant et restent silencieux sauf si l’agent appelle l’outil `message`. Consultez [Événements ambiants de salon](/fr/channels/ambient-room-events).

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

    Commandes utiles :

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="Messages DM ignorés">
    Vérifiez :

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (ou l’hérité `channels.slack.dm.policy`)
    - approbations d’association / entrées de liste d’autorisation (`dmPolicy: "open"` nécessite toujours `channels.slack.allowFrom: ["*"]`)
    - les DM de groupe utilisent la gestion MPIM ; activez `channels.slack.dm.groupEnabled` et, si configuré, incluez le MPIM dans `channels.slack.dm.groupChannels`
    - événements de DM Slack Assistant : les journaux verbeux mentionnant `drop message_changed`
      signifient généralement que Slack a envoyé un événement de fil Assistant modifié sans
      expéditeur humain récupérable dans les métadonnées du message

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode ne se connecte pas">
    Validez les jetons bot + app et l’activation de Socket Mode dans les paramètres de l’application Slack.
    L’App-Level Token nécessite `connections:write`, et le jeton Bot User OAuth Token
    doit appartenir à la même application Slack / au même espace de travail que le jeton d’application.

    Si `openclaw channels status --probe --json` affiche `botTokenStatus` ou
    `appTokenStatus: "configured_unavailable"`, le compte Slack est
    configuré mais l’environnement d’exécution actuel n’a pas pu résoudre la valeur adossée à SecretRef.

    Les journaux tels que `slack socket mode failed to start; retry ...` sont des échecs
    de démarrage récupérables. Les scopes manquants, les tokens révoqués et une authentification invalide échouent rapidement
    à la place. Un journal `slack token mismatch ...` signifie que le token du bot et le token de l’application
    semblent appartenir à des applications Slack différentes ; corrigez les identifiants de l’application Slack.

  </Accordion>

  <Accordion title="Le mode HTTP ne reçoit pas d’événements">
    Validez :

    - le secret de signature
    - le chemin Webhook
    - les URL de requête Slack (événements + interactivité + commandes slash)
    - un `webhookPath` unique par compte HTTP
    - l’URL publique termine TLS et transmet les requêtes au chemin Gateway
    - le chemin `request_url` de l’application Slack correspond exactement à `channels.slack.webhookPath` (par défaut `/slack/events`)

    Si `signingSecretStatus: "configured_unavailable"` apparaît dans les instantanés
    de compte, le compte HTTP est configuré, mais le runtime actuel n’a pas pu
    résoudre le secret de signature adossé à SecretRef.

    Un journal répété `slack: webhook path ... already registered` signifie que deux comptes HTTP
    utilisent le même `webhookPath` ; attribuez un chemin distinct à chaque compte.

  </Accordion>

  <Accordion title="Les commandes natives/slash ne se déclenchent pas">
    Vérifiez ce que vous aviez prévu :

    - le mode de commande natif (`channels.slack.commands.native: true`) avec les commandes slash correspondantes enregistrées dans Slack
    - ou le mode commande slash unique (`channels.slack.slashCommand.enabled: true`)

    Slack ne crée ni ne supprime automatiquement les commandes slash. `commands.native: "auto"` n’active pas les commandes natives Slack ; utilisez `true` et créez les commandes correspondantes dans l’application Slack. En mode HTTP, chaque commande slash Slack doit inclure l’URL Gateway. En Socket Mode, les charges utiles de commande arrivent via le websocket et Slack ignore `slash_commands[].url`.

    Vérifiez aussi `commands.useAccessGroups`, l’autorisation des DM, les listes d’autorisation de canaux,
    et les listes d’autorisation `users` par canal. Slack renvoie des erreurs éphémères pour
    les expéditeurs de commandes slash bloqués, notamment :

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## Référence de vision des pièces jointes

Slack peut joindre des médias téléchargés au tour de l’agent lorsque les téléchargements de fichiers Slack réussissent et que les limites de taille le permettent. Les fichiers image peuvent passer par le chemin de compréhension multimédia ou directement vers un modèle de réponse compatible avec la vision ; les autres fichiers sont conservés comme contexte de fichier téléchargeable plutôt que traités comme entrée image.

### Types de médias pris en charge

| Type de média                 | Source               | Comportement actuel                                                                 | Notes                                                                     |
| ----------------------------- | -------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Images JPEG / PNG / GIF / WebP | URL de fichier Slack | Téléchargées et jointes au tour pour une gestion compatible avec la vision          | Limite par fichier : `channels.slack.mediaMaxMb` (par défaut 20 MB)       |
| Fichiers PDF                  | URL de fichier Slack | Téléchargés et exposés comme contexte de fichier pour des outils tels que `download-file` ou `pdf` | L’entrée Slack ne convertit pas automatiquement les PDF en entrée de vision d’image |
| Autres fichiers               | URL de fichier Slack | Téléchargés lorsque possible et exposés comme contexte de fichier                   | Les fichiers binaires ne sont pas traités comme entrée image              |
| Réponses de fil               | Fichiers du message de départ du fil | Les fichiers du message racine peuvent être hydratés comme contexte lorsque la réponse n’a pas de média direct | Les messages de départ contenant uniquement des fichiers utilisent un placeholder de pièce jointe |
| Messages multi-images         | Plusieurs fichiers Slack | Chaque fichier est évalué indépendamment                                            | Le traitement Slack est limité à huit fichiers par message                |

### Pipeline entrant

Lorsqu’un message Slack avec des pièces jointes arrive :

1. OpenClaw télécharge le fichier depuis l’URL privée de Slack à l’aide du token du bot.
2. Le fichier est écrit dans le magasin de médias en cas de réussite.
3. Les chemins des médias téléchargés et les types de contenu sont ajoutés au contexte entrant.
4. Les chemins de modèles/outils capables de traiter les images peuvent utiliser les pièces jointes image depuis ce contexte.
5. Les fichiers non image restent disponibles comme métadonnées de fichier ou références média pour les outils qui peuvent les gérer.

### Héritage des pièces jointes de la racine du fil

Lorsqu’un message arrive dans un fil (avec un parent `thread_ts`) :

- Si la réponse elle-même n’a pas de média direct et que le message racine inclus contient des fichiers, Slack peut hydrater les fichiers racine comme contexte de départ du fil.
- Les pièces jointes directes de la réponse ont priorité sur les pièces jointes du message racine.
- Un message racine qui contient uniquement des fichiers et aucun texte est représenté par un placeholder de pièce jointe afin que le repli puisse toujours inclure ses fichiers.

### Gestion de plusieurs pièces jointes

Lorsqu’un seul message Slack contient plusieurs pièces jointes de fichier :

- Chaque pièce jointe est traitée indépendamment par le pipeline multimédia.
- Les références média téléchargées sont agrégées dans le contexte du message.
- L’ordre de traitement suit l’ordre des fichiers Slack dans la charge utile de l’événement.
- L’échec du téléchargement d’une pièce jointe ne bloque pas les autres.

### Limites de taille, de téléchargement et de modèle

- **Limite de taille** : 20 MB par fichier par défaut. Configurable via `channels.slack.mediaMaxMb`.
- **Échecs de téléchargement** : Les fichiers que Slack ne peut pas servir, les URL expirées, les fichiers inaccessibles, les fichiers trop volumineux et les réponses HTML d’authentification/connexion Slack sont ignorés au lieu d’être signalés comme formats non pris en charge.
- **Modèle de vision** : L’analyse d’image utilise le modèle de réponse actif lorsqu’il prend en charge la vision, ou le modèle d’image configuré dans `agents.defaults.imageModel`.

### Limites connues

| Scénario                               | Comportement actuel                                                           | Solution de contournement                                                   |
| -------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| URL de fichier Slack expirée           | Fichier ignoré ; aucune erreur affichée                                       | Téléversez de nouveau le fichier dans Slack                                  |
| Modèle de vision non configuré         | Les pièces jointes image sont stockées comme références média, mais ne sont pas analysées comme images | Configurez `agents.defaults.imageModel` ou utilisez un modèle de réponse compatible avec la vision |
| Images très volumineuses (> 20 MB par défaut) | Ignorées selon la limite de taille                                            | Augmentez `channels.slack.mediaMaxMb` si Slack le permet                     |
| Pièces jointes transférées/partagées   | Le texte et les médias image/fichier hébergés par Slack sont traités au mieux | Repartagez directement dans le fil OpenClaw                                  |
| Pièces jointes PDF                     | Stockées comme contexte fichier/média, non routées automatiquement via la vision d’image | Utilisez `download-file` pour les métadonnées de fichier ou l’outil `pdf` pour l’analyse PDF |

### Documentation associée

- [Pipeline de compréhension multimédia](/fr/nodes/media-understanding)
- [Outil PDF](/fr/tools/pdf)
- Epic : [#51349](https://github.com/openclaw/openclaw/issues/51349) — activation de la vision pour les pièces jointes Slack
- Tests de régression : [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Vérification en direct : [#51354](https://github.com/openclaw/openclaw/issues/51354)

## Associé

<CardGroup cols={2}>
  <Card title="Appairage" icon="link" href="/fr/channels/pairing">
    Appairez un utilisateur Slack au Gateway.
  </Card>
  <Card title="Groupes" icon="users" href="/fr/channels/groups">
    Comportement des canaux et des DM de groupe.
  </Card>
  <Card title="Routage des canaux" icon="route" href="/fr/channels/channel-routing">
    Acheminez les messages entrants vers les agents.
  </Card>
  <Card title="Sécurité" icon="shield" href="/fr/gateway/security">
    Modèle de menace et durcissement.
  </Card>
  <Card title="Configuration" icon="sliders" href="/fr/gateway/configuration">
    Structure et précédence de la configuration.
  </Card>
  <Card title="Commandes slash" icon="terminal" href="/fr/tools/slash-commands">
    Catalogue et comportement des commandes.
  </Card>
</CardGroup>
