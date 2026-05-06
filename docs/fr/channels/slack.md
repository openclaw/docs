---
read_when:
    - Configuration de Slack ou débogage du mode socket/HTTP de Slack
summary: Configuration de Slack et comportement à l’exécution (Socket Mode + URL de requête HTTP)
title: Slack
x-i18n:
    generated_at: "2026-05-06T17:52:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3afcedca5004c18949206eee2b2620d07a02c76ef663bea80f29ec2591f737b
    source_path: channels/slack.md
    workflow: 16
---

Prêt pour la production pour les messages privés et les canaux via les intégrations d’app Slack. Le mode par défaut est Socket Mode ; les URL de requête HTTP sont également prises en charge.

<CardGroup cols={3}>
  <Card title="Jumelage" icon="link" href="/fr/channels/pairing">
    Les messages privés Slack utilisent par défaut le mode de jumelage.
  </Card>
  <Card title="Commandes slash" icon="terminal" href="/fr/tools/slash-commands">
    Comportement natif des commandes et catalogue des commandes.
  </Card>
  <Card title="Dépannage des canaux" icon="wrench" href="/fr/channels/troubleshooting">
    Diagnostics inter-canaux et guides de réparation.
  </Card>
</CardGroup>

## Choisir Socket Mode ou les URL de requête HTTP

Les deux transports sont prêts pour la production et offrent la parité fonctionnelle pour la messagerie, les commandes slash, App Home et l’interactivité. Choisissez selon la forme de déploiement, pas selon les fonctionnalités.

| Point                        | Socket Mode (par défaut)                                                            | URL de requête HTTP                                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| URL publique du Gateway      | Non requise                                                                         | Requise (DNS, TLS, proxy inverse ou tunnel)                                                                    |
| Réseau sortant               | Le WSS sortant vers `wss-primary.slack.com` doit être accessible                     | Pas de WS sortant ; HTTPS entrant uniquement                                                                   |
| Jetons nécessaires           | Jeton de bot (`xoxb-...`) + jeton au niveau de l’app (`xapp-...`) avec `connections:write` | Jeton de bot (`xoxb-...`) + secret de signature                                                                |
| Ordinateur de développement / derrière un pare-feu | Fonctionne tel quel                                                                  | Nécessite un tunnel public (ngrok, Cloudflare Tunnel, Tailscale Funnel) ou un Gateway de préproduction          |
| Mise à l’échelle horizontale | Une session Socket Mode par app et par hôte ; plusieurs Gateway nécessitent des apps Slack distinctes | Gestionnaire POST sans état ; plusieurs réplicas Gateway peuvent partager une app derrière un équilibreur de charge |
| Plusieurs comptes sur un Gateway | Pris en charge ; chaque compte ouvre son propre WS                                  | Pris en charge ; chaque compte nécessite un `webhookPath` unique (par défaut `/slack/events`) afin que les inscriptions n’entrent pas en collision |
| Transport des commandes slash | Livraison via la connexion WS ; `slash_commands[].url` est ignoré                   | Slack envoie des requêtes POST vers `slash_commands[].url` ; le champ est requis pour que la commande soit distribuée |
| Signature des requêtes       | Non utilisée (l’authentification est le jeton au niveau de l’app)                   | Slack signe chaque requête ; OpenClaw vérifie avec `signingSecret`                                             |
| Récupération après perte de connexion | Le SDK Slack se reconnecte automatiquement ; les réglages de transport de délai pong du gateway s’appliquent | Pas de connexion persistante à perdre ; les nouvelles tentatives sont effectuées par requête depuis Slack       |

<Note>
  **Choisissez Socket Mode** pour les hôtes à Gateway unique, les ordinateurs de développement et les réseaux sur site qui peuvent joindre `*.slack.com` en sortie mais ne peuvent pas accepter de HTTPS entrant.

**Choisissez les URL de requête HTTP** lorsque vous exécutez plusieurs réplicas Gateway derrière un équilibreur de charge, lorsque le WSS sortant est bloqué mais que le HTTPS entrant est autorisé, ou lorsque vous terminez déjà les webhooks Slack sur un proxy inverse.
</Note>

## Configuration rapide

<Tabs>
  <Tab title="Socket Mode (par défaut)">
    <Steps>
      <Step title="Créer une nouvelle app Slack">
        Ouvrez [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → sélectionnez votre espace de travail → collez l’un des manifestes ci-dessous → **Next** → **Create**.

        <CodeGroup>

```json Recommandé
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
          **Recommandé** correspond à l’ensemble complet des fonctionnalités du plugin Slack inclus : App Home, commandes slash, fichiers, réactions, épingles, messages privés de groupe et lectures d’emoji/groupes d’utilisateurs. Choisissez **Minimal** lorsque la politique de l’espace de travail restreint les portées — il couvre les messages privés, l’historique des canaux/groupes, les mentions et les commandes slash, mais retire les fichiers, les réactions, les épingles, les messages privés de groupe (`mpim:*`), `emoji:read` et `usergroups:read`. Consultez la [liste de contrôle du manifeste et des portées](#manifest-and-scope-checklist) pour la justification de chaque portée et les options additives comme des commandes slash supplémentaires.
        </Note>

        Une fois que Slack a créé l’app :

        - **Basic Information → App-Level Tokens → Generate Token and Scopes** : ajoutez `connections:write`, enregistrez, copiez la valeur `xapp-...`.
        - **Install App → Install to Workspace** : copiez le jeton OAuth d’utilisateur bot `xoxb-...`.

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

        Solution de repli via env (compte par défaut uniquement) :

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
        Ouvrez [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → sélectionnez votre espace de travail → collez l’un des manifestes ci-dessous → remplacez `https://gateway-host.example.com/slack/events` par l’URL publique de votre Gateway → **Next** → **Create**.

        <CodeGroup>

```json Recommandé
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
          **Recommandé** correspond à l’ensemble complet des fonctionnalités du plugin Slack inclus ; **Minimal** retire les fichiers, les réactions, les épingles, les MP de groupe (`mpim:*`), `emoji:read` et `usergroups:read` pour les espaces de travail restrictifs. Consultez la [liste de contrôle du manifeste et des portées](#manifest-and-scope-checklist) pour la justification de chaque portée.
        </Note>

        <Info>
          Les trois champs d’URL (`slash_commands[].url`, `event_subscriptions.request_url` et `interactivity.request_url` / `message_menu_options_url`) pointent tous vers le même point de terminaison OpenClaw. Le schéma du manifeste Slack exige qu’ils soient nommés séparément, mais OpenClaw route selon le type de charge utile ; un seul `webhookPath` (par défaut `/slack/events`) suffit donc. Les commandes slash sans `slash_commands[].url` resteront silencieusement sans effet en mode HTTP.
        </Info>

        Une fois l’application créée par Slack :

        - **Informations de base → Identifiants de l’application** : copiez le **secret de signature** pour la vérification des requêtes.
        - **Installer l’application → Installer dans l’espace de travail** : copiez le jeton OAuth d’utilisateur bot `xoxb-...`.

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
        Utilisez des chemins de Webhook uniques pour le HTTP multi-compte

        Attribuez à chaque compte un `webhookPath` distinct (par défaut `/slack/events`) afin que les enregistrements n’entrent pas en conflit.
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

## Réglage du transport en mode Socket

OpenClaw définit par défaut le délai d’expiration du pong du client du SDK Slack à 15 secondes pour le mode Socket. Ne remplacez les paramètres de transport que lorsque vous avez besoin d’un réglage propre à l’espace de travail ou à l’hôte :

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

Utilisez ceci uniquement pour les espaces de travail en mode Socket qui journalisent des délais d’expiration pong/server-ping du WebSocket Slack ou qui s’exécutent sur des hôtes présentant une privation connue de la boucle d’événements. `clientPingTimeout` est l’attente du pong après l’envoi d’un ping client par le SDK ; `serverPingTimeout` est l’attente des pings serveur Slack. Les messages et événements de l’application restent un état applicatif, pas des signaux de disponibilité du transport.

## Liste de contrôle du manifeste et des portées

Le manifeste de base de l’application Slack est le même pour le mode Socket et les URL de requête HTTP. Seul le bloc `settings` (et l’`url` de la commande slash) diffère.

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

Exposez différentes fonctionnalités qui étendent les valeurs par défaut ci-dessus.

Le manifeste par défaut active l’onglet **Accueil** de l’accueil de l’application Slack et s’abonne à `app_home_opened`. Lorsqu’un membre de l’espace de travail ouvre l’onglet Accueil, OpenClaw publie une vue Accueil par défaut sûre avec `views.publish` ; aucune charge utile de conversation ni configuration privée n’est incluse. L’onglet **Messages** reste activé pour les messages directs Slack.

<AccordionGroup>
  <Accordion title="Commandes slash natives facultatives">

    Plusieurs [commandes slash natives](#commands-and-slash-behavior) peuvent être utilisées à la place d’une seule commande configurée, avec quelques nuances :

    - Utilisez `/agentstatus` au lieu de `/status`, car la commande `/status` est réservée.
    - Pas plus de 25 commandes slash peuvent être disponibles à la fois.

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
  <Accordion title="Portées d’auteur facultatives (opérations d’écriture)">
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

- `botToken` + `appToken` sont requis pour Socket Mode.
- Le mode HTTP nécessite `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` et `userToken` acceptent les chaînes
  en texte clair ou les objets SecretRef.
- Les jetons de configuration remplacent le repli env.
- Le repli env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` s’applique uniquement au compte par défaut.
- `userToken` (`xoxp-...`) est uniquement configurable (pas de repli env) et utilise par défaut un comportement en lecture seule (`userTokenReadOnly: true`).

Comportement de l’instantané d’état :

- L’inspection du compte Slack suit les champs `*Source` et `*Status`
  par identifiant (`botToken`, `appToken`, `signingSecret`, `userToken`).
- L’état est `available`, `configured_unavailable` ou `missing`.
- `configured_unavailable` signifie que le compte est configuré via SecretRef
  ou une autre source de secret non intégrée, mais que le chemin de commande/d’exécution actuel
  n’a pas pu résoudre la valeur réelle.
- En mode HTTP, `signingSecretStatus` est inclus ; en Socket Mode, la
  paire requise est `botTokenStatus` + `appTokenStatus`.

<Tip>
Pour les actions/lectures d’annuaire, le jeton utilisateur peut être préféré lorsqu’il est configuré. Pour les écritures, le jeton de bot reste préféré ; les écritures avec jeton utilisateur ne sont autorisées que lorsque `userTokenReadOnly: false` et que le jeton de bot est indisponible.
</Tip>

## Actions et barrières

Les actions Slack sont contrôlées par `channels.slack.actions.*`.

Groupes d’actions disponibles dans l’outillage Slack actuel :

| Groupe     | Par défaut |
| ---------- | ---------- |
| messages   | activé     |
| reactions  | activé     |
| pins       | activé     |
| memberInfo | activé     |
| emojiList  | activé     |

Les actions de message Slack actuelles incluent `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` et `emoji-list`. `download-file` accepte les ID de fichiers Slack affichés dans les espaces réservés de fichiers entrants et renvoie des aperçus d’images pour les images ou des métadonnées de fichier local pour les autres types de fichiers.

## Contrôle d’accès et routage

<Tabs>
  <Tab title="Politique DM">
    `channels.slack.dmPolicy` contrôle l’accès DM. `channels.slack.allowFrom` est la liste d’autorisation DM canonique.

    - `pairing` (par défaut)
    - `allowlist`
    - `open` (nécessite que `channels.slack.allowFrom` inclue `"*"`)
    - `disabled`

    Indicateurs DM :

    - `dm.enabled` (true par défaut)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (hérité)
    - `dm.groupEnabled` (DM de groupe false par défaut)
    - `dm.groupChannels` (liste d’autorisation MPIM facultative)

    Priorité multi-comptes :

    - `channels.slack.accounts.default.allowFrom` s’applique uniquement au compte `default`.
    - Les comptes nommés héritent de `channels.slack.allowFrom` lorsque leur propre `allowFrom` n’est pas défini.
    - Les comptes nommés n’héritent pas de `channels.slack.accounts.default.allowFrom`.

    Les anciens `channels.slack.dm.policy` et `channels.slack.dm.allowFrom` sont toujours lus pour compatibilité. `openclaw doctor --fix` les migre vers `dmPolicy` et `allowFrom` lorsqu’il peut le faire sans modifier l’accès.

    L’association dans les DM utilise `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Politique de canal">
    `channels.slack.groupPolicy` contrôle le traitement des canaux :

    - `open`
    - `allowlist`
    - `disabled`

    La liste d’autorisation des canaux se trouve sous `channels.slack.channels` et **doit utiliser des ID de canal Slack stables** (par exemple `C12345678`) comme clés de configuration.

    Note d’exécution : si `channels.slack` est complètement absent (configuration uniquement env), l’exécution se replie sur `groupPolicy="allowlist"` et journalise un avertissement (même si `channels.defaults.groupPolicy` est défini).

    Résolution nom/ID :

    - les entrées de liste d’autorisation de canaux et les entrées de liste d’autorisation DM sont résolues au démarrage lorsque l’accès au jeton le permet
    - les entrées de noms de canal non résolues sont conservées telles que configurées mais ignorées pour le routage par défaut
    - l’autorisation entrante et le routage de canal utilisent d’abord l’ID par défaut ; la correspondance directe nom d’utilisateur/slug nécessite `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Les clés basées sur le nom (`#channel-name` ou `channel-name`) ne correspondent **pas** avec `groupPolicy: "allowlist"`. La recherche de canal utilise d’abord l’ID par défaut, donc une clé basée sur le nom ne sera jamais routée correctement et tous les messages de ce canal seront bloqués silencieusement. Cela diffère de `groupPolicy: "open"`, où la clé de canal n’est pas requise pour le routage et où une clé basée sur le nom semble fonctionner.

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
    Les messages de canal sont soumis à une barrière de mention par défaut.

    Sources de mention :

    - mention explicite de l’application (`<@botId>`)
    - mention de groupe d’utilisateurs Slack (`<!subteam^S...>`) lorsque l’utilisateur bot est membre de ce groupe d’utilisateurs ; nécessite `usergroups:read`
    - motifs regex de mention (`agents.list[].groupChat.mentionPatterns`, repli `messages.groupChat.mentionPatterns`)
    - comportement implicite de réponse à un fil de bot (désactivé lorsque `thread.requireExplicitMention` vaut `true`)

    Contrôles par canal (`channels.slack.channels.<id>` ; noms uniquement via résolution au démarrage ou `dangerouslyAllowNameMatching`) :

    - `requireMention`
    - `users` (liste d’autorisation)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - format de clé `toolsBySender` : `id:`, `e164:`, `username:`, `name:` ou caractère générique `"*"`
      (les anciennes clés sans préfixe correspondent toujours uniquement à `id:`)

    `allowBots` est conservateur pour les canaux et les canaux privés : les messages de salon rédigés par un bot ne sont acceptés que lorsque le bot émetteur est explicitement listé dans la liste d’autorisation `users` de ce salon, ou lorsqu’au moins un ID de propriétaire Slack explicite provenant de `channels.slack.allowFrom` est actuellement membre du salon. Les caractères génériques et les entrées de propriétaire par nom d’affichage ne satisfont pas la présence du propriétaire. La présence du propriétaire utilise Slack `conversations.members` ; assurez-vous que l’application dispose de la portée de lecture correspondante pour le type de salon (`channels:read` pour les canaux publics, `groups:read` pour les canaux privés). Si la recherche de membre échoue, OpenClaw abandonne le message de salon rédigé par le bot.

  </Tab>
</Tabs>

## Fils, sessions et balises de réponse

- Les DM sont routés comme `direct` ; les canaux comme `channel` ; les MPIM comme `group`.
- Les liaisons de route Slack acceptent les ID de pairs bruts ainsi que les formes de cible Slack telles que `channel:C12345678`, `user:U12345678` et `<@U12345678>`.
- Avec `session.dmScope=main` par défaut, les DM Slack se replient sur la session principale de l’agent.
- Sessions de canal : `agent:<agentId>:slack:channel:<channelId>`.
- Les réponses de fil peuvent créer des suffixes de session de fil (`:thread:<threadTs>`) le cas échéant.
- La valeur par défaut de `channels.slack.thread.historyScope` est `thread` ; la valeur par défaut de `thread.inheritParent` est `false`.
- `channels.slack.thread.initialHistoryLimit` contrôle combien de messages de fil existants sont récupérés lorsqu’une nouvelle session de fil démarre (par défaut `20` ; définissez `0` pour désactiver).
- `channels.slack.thread.requireExplicitMention` (`false` par défaut) : lorsque `true`, supprime les mentions implicites dans les fils afin que le bot ne réponde qu’aux mentions `@bot` explicites dans les fils, même lorsque le bot a déjà participé au fil. Sans cela, les réponses dans un fil auquel le bot a participé contournent la barrière `requireMention`.

Contrôles de fil de réponse :

- `channels.slack.replyToMode` : `off|first|all|batched` (`off` par défaut)
- `channels.slack.replyToModeByChatType` : par `direct|group|channel`
- repli hérité pour les discussions directes : `channels.slack.dm.replyToMode`

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
- repli sur l’emoji d’identité de l’agent (`agents.list[].identity.emoji`, sinon "👀")

Notes :

- Slack attend des shortcodes (par exemple `"eyes"`).
- Utilisez `""` pour désactiver la réaction pour le compte Slack ou globalement.

## Diffusion de texte en continu

`channels.slack.streaming` contrôle le comportement d’aperçu en direct :

- `off` : désactiver la diffusion d’aperçu en direct.
- `partial` (par défaut) : remplacer le texte d’aperçu par la dernière sortie partielle.
- `block` : ajouter des mises à jour d’aperçu par fragments.
- `progress` : afficher le texte d’état de progression pendant la génération, puis envoyer le texte final.
- `streaming.preview.toolProgress` : lorsque l’aperçu de brouillon est actif, route les mises à jour d’outil/de progression vers le même message d’aperçu modifié (par défaut : `true`). Définissez `false` pour conserver des messages d’outil/de progression séparés.
- `streaming.preview.commandText` / `streaming.progress.commandText` : définissez sur `status` pour conserver des lignes compactes de progression d’outil tout en masquant le texte brut de commande/exec (par défaut : `raw`).

Masquer le texte brut de commande/exec tout en conservant des lignes de progression compactes :

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

`channels.slack.streaming.nativeTransport` contrôle la diffusion de texte native Slack lorsque `channels.slack.streaming.mode` est `partial` (par défaut : `true`).

- Un fil de réponse doit être disponible pour que la diffusion de texte native et l’état de fil d’assistant Slack apparaissent. La sélection du fil suit toujours `replyToMode`.
- Les racines de canal, de discussion de groupe et de DM de premier niveau peuvent toujours utiliser l’aperçu de brouillon normal lorsque la diffusion native est indisponible ou qu’aucun fil de réponse n’existe.
- Les DM Slack de premier niveau restent hors fil par défaut, donc ils n’affichent pas l’aperçu de flux/état natif de style fil de Slack ; OpenClaw publie et modifie plutôt un aperçu de brouillon dans le DM.
- Les médias et charges utiles non textuelles se replient sur la livraison normale.
- Les finaux de média/erreur annulent les modifications d’aperçu en attente ; les finaux de texte/bloc éligibles ne sont vidés que lorsqu’ils peuvent modifier l’aperçu sur place.
- Si la diffusion échoue au milieu de la réponse, OpenClaw se replie sur la livraison normale pour les charges utiles restantes.

Utiliser l’aperçu de brouillon au lieu de la diffusion de texte native Slack :

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

- `channels.slack.streamMode` (`replace | status_final | append`) est un alias d’exécution hérité pour `channels.slack.streaming.mode`.
- le booléen `channels.slack.streaming` est un alias d’exécution hérité pour `channels.slack.streaming.mode` et `channels.slack.streaming.nativeTransport`.
- l’ancien `channels.slack.nativeStreaming` est un alias d’exécution pour `channels.slack.streaming.nativeTransport`.
- Exécutez `openclaw doctor --fix` pour réécrire la configuration de streaming Slack persistée vers les clés canoniques.

## Repli de la réaction de saisie

`typingReaction` ajoute une réaction temporaire au message Slack entrant pendant qu’OpenClaw traite une réponse, puis la supprime lorsque l’exécution se termine. C’est surtout utile en dehors des réponses dans un fil, qui utilisent un indicateur d’état « is typing... » par défaut.

Ordre de résolution :

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Notes :

- Slack attend des shortcodes (par exemple `"hourglass_flowing_sand"`).
- La réaction est fournie au mieux et le nettoyage est tenté automatiquement une fois le chemin de réponse ou d’échec terminé.

## Médias, découpage et livraison

<AccordionGroup>
  <Accordion title="Pièces jointes entrantes">
    Les pièces jointes de fichiers Slack sont téléchargées depuis des URL privées hébergées par Slack (flux de requête authentifié par jeton) et écrites dans le magasin de médias lorsque la récupération réussit et que les limites de taille le permettent. Les placeholders de fichiers incluent le `fileId` Slack afin que les agents puissent récupérer le fichier original avec `download-file`.

    Les téléchargements utilisent des délais d’expiration bornés pour l’inactivité et la durée totale. Si la récupération d’un fichier Slack se bloque ou échoue, OpenClaw continue de traiter le message et se rabat sur le placeholder de fichier.

    La limite de taille entrante à l’exécution est définie par défaut sur `20MB`, sauf remplacement par `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Texte et fichiers sortants">
    - les fragments de texte utilisent `channels.slack.textChunkLimit` (4000 par défaut)
    - `channels.slack.chunkMode="newline"` active un découpage donnant la priorité aux paragraphes
    - les envois de fichiers utilisent les API de téléversement Slack et peuvent inclure des réponses dans un fil (`thread_ts`)
    - la limite de médias sortants suit `channels.slack.mediaMaxMb` lorsqu’elle est configurée ; sinon, les envois de canal utilisent les valeurs par défaut par type MIME du pipeline média

  </Accordion>

  <Accordion title="Cibles de livraison">
    Cibles explicites préférées :

    - `user:<id>` pour les messages directs
    - `channel:<id>` pour les canaux

    Les messages directs Slack contenant uniquement du texte ou des blocs peuvent être publiés directement vers des ID utilisateur ; les téléversements de fichiers et les envois dans un fil ouvrent d’abord le message direct via les API de conversation Slack, car ces chemins nécessitent un ID de conversation concret.

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

- Le mode automatique des commandes natives est **désactivé** pour Slack, donc `commands.native: "auto"` n’active pas les commandes natives Slack.

```txt
/help
```

Les menus d’arguments natifs utilisent une stratégie de rendu adaptative qui affiche une modale de confirmation avant d’envoyer une valeur d’option sélectionnée :

- jusqu’à 5 options : blocs de boutons
- 6 à 100 options : menu de sélection statique
- plus de 100 options : sélection externe avec filtrage asynchrone des options lorsque les gestionnaires d’options d’interactivité sont disponibles
- limites Slack dépassées : les valeurs d’option encodées se rabattent sur des boutons

```txt
/think
```

Les sessions slash utilisent des clés isolées comme `agent:<agentId>:slack:slash:<userId>` et acheminent toujours les exécutions de commandes vers la session de conversation cible avec `CommandTargetSessionKey`.

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

Une fois l’option activée, les agents peuvent émettre des directives de réponse propres à Slack :

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Ces directives sont compilées en Slack Block Kit et acheminent les clics ou les sélections via le chemin d’événements d’interaction Slack existant.

Notes :

- Il s’agit d’une interface utilisateur propre à Slack. Les autres canaux ne traduisent pas les directives Slack Block Kit dans leurs propres systèmes de boutons.
- Les valeurs de rappel interactif sont des jetons opaques générés par OpenClaw, et non des valeurs brutes rédigées par l’agent.
- Si les blocs interactifs générés dépassent les limites de Slack Block Kit, OpenClaw se rabat sur la réponse textuelle originale au lieu d’envoyer une charge utile de blocs invalide.

## Approbations exec dans Slack

Slack peut agir comme client d’approbation natif avec des boutons et interactions interactifs, au lieu de se rabattre sur l’interface Web ou le terminal.

- Les approbations exec utilisent `channels.slack.execApprovals.*` pour le routage natif des messages directs/canaux.
- Les approbations de Plugin peuvent toujours se résoudre via la même surface de boutons native Slack lorsque la demande arrive déjà dans Slack et que le type d’ID d’approbation est `plugin:`.
- L’autorisation de l’approbateur reste appliquée : seuls les utilisateurs identifiés comme approbateurs peuvent approuver ou refuser des demandes via Slack.

Cela utilise la même surface partagée de boutons d’approbation que les autres canaux. Lorsque `interactivity` est activé dans les paramètres de votre application Slack, les invites d’approbation s’affichent sous forme de boutons Block Kit directement dans la conversation.
Lorsque ces boutons sont présents, ils constituent l’expérience d’approbation principale ; OpenClaw
ne doit inclure une commande manuelle `/approve` que lorsque le résultat de l’outil indique que les
approbations par chat sont indisponibles ou que l’approbation manuelle est le seul chemin.

Chemin de configuration :

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (facultatif ; se rabat sur `commands.ownerAllowFrom` lorsque possible)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, par défaut : `dm`)
- `agentFilter`, `sessionFilter`

Slack active automatiquement les approbations exec natives lorsque `enabled` n’est pas défini ou vaut `"auto"` et qu’au moins un
approbateur est résolu. Définissez `enabled: false` pour désactiver explicitement Slack comme client d’approbation natif.
Définissez `enabled: true` pour forcer les approbations natives lorsque des approbateurs sont résolus.

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

Le transfert partagé `approvals.exec` est distinct. Utilisez-le uniquement lorsque les invites d’approbation exec doivent également être
acheminées vers d’autres chats ou des cibles hors bande explicites. Le transfert partagé `approvals.plugin` est également
distinct ; les boutons natifs Slack peuvent toujours résoudre les approbations de Plugin lorsque ces demandes arrivent déjà
dans Slack.

La commande `/approve` dans le même chat fonctionne aussi dans les canaux Slack et les messages directs qui prennent déjà en charge les commandes. Voir [Approbations exec](/fr/tools/exec-approvals) pour le modèle complet de transfert d’approbations.

## Événements et comportement opérationnel

- Les modifications/suppressions de messages sont mappées vers des événements système.
- Les diffusions de fil (« Also send to channel » pour les réponses dans un fil) sont traitées comme des messages utilisateur normaux.
- Les événements d’ajout/suppression de réactions sont mappés vers des événements système.
- Les événements d’arrivée/départ de membre, de création/renommage de canal et d’ajout/suppression d’épingle sont mappés vers des événements système.
- `channel_id_changed` peut migrer les clés de configuration de canal lorsque `configWrites` est activé.
- Les métadonnées de sujet/objectif de canal sont traitées comme un contexte non fiable et peuvent être injectées dans le contexte de routage.
- L’amorçage du démarreur de fil et du contexte initial d’historique de fil est filtré par les listes d’autorisation d’expéditeurs configurées, le cas échéant.
- Les actions de bloc et les interactions de modale émettent des événements système structurés `Slack interaction: ...` avec des champs de charge utile riches :
  - actions de bloc : valeurs sélectionnées, libellés, valeurs de sélecteur et métadonnées `workflow_*`
  - événements de modale `view_submission` et `view_closed` avec métadonnées de canal routé et entrées de formulaire

## Référence de configuration

Référence principale : [Référence de configuration - Slack](/fr/gateway/config-channels#slack).

<Accordion title="Champs Slack à fort signal">

- mode/authentification : `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- accès aux messages directs : `dm.enabled`, `dmPolicy`, `allowFrom` (hérité : `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- bascule de compatibilité : `dangerouslyAllowNameMatching` (solution de secours ; gardez-la désactivée sauf nécessité)
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
    - liste d’autorisation de canaux (`channels.slack.channels`) — **les clés doivent être des ID de canal** (`C12345678`), pas des noms (`#channel-name`). Les clés basées sur les noms échouent silencieusement avec `groupPolicy: "allowlist"`, car le routage des canaux se fait par ID en priorité par défaut. Pour trouver un ID : faites un clic droit sur le canal dans Slack → **Copy link** — la valeur `C...` à la fin de l’URL est l’ID du canal.
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
    - `channels.slack.dmPolicy` (ou l’ancien `channels.slack.dm.policy`)
    - approbations d’association / entrées de liste d’autorisation
    - événements de messages directs Slack Assistant : les journaux détaillés mentionnant `drop message_changed`
      signifient généralement que Slack a envoyé un événement de fil Assistant modifié sans
      expéditeur humain récupérable dans les métadonnées du message

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode ne se connecte pas">
    Validez les jetons de bot et d’application ainsi que l’activation de Socket Mode dans les paramètres de l’application Slack.

    Si `openclaw channels status --probe --json` affiche `botTokenStatus` ou
    `appTokenStatus: "configured_unavailable"`, le compte Slack est
    configuré, mais l’environnement d’exécution actuel n’a pas pu résoudre la
    valeur adossée à SecretRef.

  </Accordion>

  <Accordion title="Le mode HTTP ne reçoit pas d’événements">
    Validez :

    - le secret de signature
    - le chemin de Webhook
    - les URL de requête Slack (Events + Interactivity + Slash Commands)
    - un `webhookPath` unique par compte HTTP

    Si `signingSecretStatus: "configured_unavailable"` apparaît dans les instantanés de compte,
    le compte HTTP est configuré, mais l’environnement d’exécution actuel n’a pas pu
    résoudre le secret de signature adossé à SecretRef.

  </Accordion>

  <Accordion title="Les commandes natives/slash ne se déclenchent pas">
    Vérifiez ce que vous vouliez utiliser :

    - mode de commande native (`channels.slack.commands.native: true`) avec les commandes slash correspondantes enregistrées dans Slack
    - ou mode de commande slash unique (`channels.slack.slashCommand.enabled: true`)

    Vérifiez aussi `commands.useAccessGroups` et les listes d’autorisation de canaux/utilisateurs.

  </Accordion>
</AccordionGroup>

## Référence de vision pour les pièces jointes

Slack peut joindre les médias téléchargés au tour de l’agent lorsque les téléchargements de fichiers Slack réussissent et que les limites de taille le permettent. Les fichiers image peuvent passer par le chemin de compréhension des médias ou être transmis directement à un modèle de réponse compatible avec la vision ; les autres fichiers sont conservés comme contexte de fichier téléchargeable plutôt que traités comme entrée image.

### Types de médias pris en charge

| Type de média                  | Source               | Comportement actuel                                                              | Notes                                                                                 |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Images JPEG / PNG / GIF / WebP | URL de fichier Slack | Téléchargées et jointes au tour pour une prise en charge compatible avec la vision | Limite par fichier : `channels.slack.mediaMaxMb` (20 Mo par défaut)                   |
| Fichiers PDF                   | URL de fichier Slack | Téléchargés et exposés comme contexte de fichier pour des outils tels que `download-file` ou `pdf` | L’entrée Slack ne convertit pas automatiquement les PDF en entrée image-vision |
| Autres fichiers                | URL de fichier Slack | Téléchargés lorsque possible et exposés comme contexte de fichier                  | Les fichiers binaires ne sont pas traités comme entrée image                           |
| Réponses de fil                | Fichiers du message initial | Les fichiers du message racine peuvent être hydratés comme contexte lorsque la réponse n’a pas de média direct | Les messages initiaux contenant uniquement des fichiers utilisent un placeholder de pièce jointe |
| Messages multi-images          | Plusieurs fichiers Slack | Chaque fichier est évalué indépendamment                                          | Le traitement Slack est limité à huit fichiers par message                            |

### Pipeline entrant

Lorsqu’un message Slack avec des pièces jointes de fichier arrive :

1. OpenClaw télécharge le fichier depuis l’URL privée de Slack à l’aide du jeton du bot (`xoxb-...`).
2. Le fichier est écrit dans le magasin de médias en cas de succès.
3. Les chemins des médias téléchargés et les types de contenu sont ajoutés au contexte entrant.
4. Les chemins de modèle/outil compatibles avec les images peuvent utiliser les pièces jointes image depuis ce contexte.
5. Les fichiers non image restent disponibles comme métadonnées de fichier ou références de média pour les outils qui peuvent les traiter.

### Héritage des pièces jointes de la racine du fil

Lorsqu’un message arrive dans un fil (avec un parent `thread_ts`) :

- Si la réponse elle-même n’a pas de média direct et que le message racine inclus contient des fichiers, Slack peut hydrater les fichiers racine comme contexte du message initial du fil.
- Les pièces jointes directes de la réponse ont priorité sur les pièces jointes du message racine.
- Un message racine qui ne contient que des fichiers et pas de texte est représenté avec un placeholder de pièce jointe afin que le fallback puisse tout de même inclure ses fichiers.

### Gestion de plusieurs pièces jointes

Lorsqu’un seul message Slack contient plusieurs pièces jointes de fichier :

- Chaque pièce jointe est traitée indépendamment par le pipeline de médias.
- Les références de médias téléchargés sont agrégées dans le contexte du message.
- L’ordre de traitement suit l’ordre des fichiers Slack dans la charge utile de l’événement.
- L’échec du téléchargement d’une pièce jointe ne bloque pas les autres.

### Limites de taille, de téléchargement et de modèle

- **Limite de taille** : 20 Mo par fichier par défaut. Configurable via `channels.slack.mediaMaxMb`.
- **Échecs de téléchargement** : Les fichiers que Slack ne peut pas servir, les URL expirées, les fichiers inaccessibles, les fichiers trop volumineux et les réponses HTML d’authentification/connexion Slack sont ignorés au lieu d’être signalés comme formats non pris en charge.
- **Modèle de vision** : L’analyse d’image utilise le modèle de réponse actif lorsqu’il prend en charge la vision, ou le modèle d’image configuré dans `agents.defaults.imageModel`.

### Limites connues

| Scénario                               | Comportement actuel                                                          | Contournement                                                              |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| URL de fichier Slack expirée           | Fichier ignoré ; aucune erreur affichée                                      | Reverser le fichier dans Slack                                             |
| Modèle de vision non configuré         | Les pièces jointes image sont stockées comme références de média, mais ne sont pas analysées comme images | Configurer `agents.defaults.imageModel` ou utiliser un modèle de réponse compatible avec la vision |
| Images très volumineuses (> 20 Mo par défaut) | Ignorées selon la limite de taille                                            | Augmenter `channels.slack.mediaMaxMb` si Slack le permet                   |
| Pièces jointes transférées/partagées   | Le texte et les médias image/fichier hébergés par Slack sont traités au mieux | Repartager directement dans le fil OpenClaw                                |
| Pièces jointes PDF                     | Stockées comme contexte de fichier/média, sans routage automatique via la vision image | Utiliser `download-file` pour les métadonnées de fichier ou l’outil `pdf` pour l’analyse PDF |

### Documentation associée

- [Pipeline de compréhension des médias](/fr/nodes/media-understanding)
- [Outil PDF](/fr/tools/pdf)
- Epic : [#51349](https://github.com/openclaw/openclaw/issues/51349) — Activation de la vision pour les pièces jointes Slack
- Tests de régression : [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Vérification en direct : [#51354](https://github.com/openclaw/openclaw/issues/51354)

## Associé

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/fr/channels/pairing">
    Associer un utilisateur Slack à la passerelle.
  </Card>
  <Card title="Groups" icon="users" href="/fr/channels/groups">
    Comportement des canaux et des DM de groupe.
  </Card>
  <Card title="Channel routing" icon="route" href="/fr/channels/channel-routing">
    Router les messages entrants vers les agents.
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
