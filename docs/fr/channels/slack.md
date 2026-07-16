---
read_when:
    - Configuration de Slack ou débogage du mode socket, HTTP ou relais de Slack
summary: Configuration de Slack et comportement à l’exécution (mode Socket, URL de requête HTTP et mode relais)
title: Slack
x-i18n:
    generated_at: "2026-07-16T12:57:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b0b3c4ddcd4ea46448bf4fcba4713a92cd487a3ab69077f6b808fbcc65608c7f
    source_path: channels/slack.md
    workflow: 16
---

La prise en charge de Slack couvre les messages privés et les canaux au moyen d’intégrations d’application Slack. Le transport par défaut est Socket Mode ; les URL de requête HTTP sont également prises en charge. Le mode relais est destiné aux déploiements gérés dans lesquels un routeur de confiance prend en charge le trafic entrant Slack.

<CardGroup cols={3}>
  <Card title="Association" icon="link" href="/fr/channels/pairing">
    Les messages privés Slack utilisent par défaut le mode d’association.
  </Card>
  <Card title="Commandes slash" icon="terminal" href="/fr/tools/slash-commands">
    Comportement des commandes natives et catalogue de commandes.
  </Card>
  <Card title="Dépannage des canaux" icon="wrench" href="/fr/channels/troubleshooting">
    Diagnostics multicanaux et procédures de réparation.
  </Card>
</CardGroup>

## Choisir un transport

Socket Mode et les URL de requête HTTP offrent les mêmes fonctionnalités pour la messagerie, les commandes slash, App Home et l’interactivité. Choisissez selon l’architecture du déploiement, et non selon les fonctionnalités.

| Considération                | Socket Mode (par défaut)                                                                                                                             | URL de requête HTTP                                                                                             |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| URL publique du Gateway      | Non requise                                                                                                                                          | Requise (DNS, TLS, proxy inverse ou tunnel)                                                                     |
| Réseau sortant               | Le WSS sortant vers `wss-primary.slack.com` doit être accessible                                                                                          | Aucun WS sortant ; HTTPS entrant uniquement                                                                     |
| Jetons requis                | Jeton de bot + jeton au niveau de l’application avec `connections:write`                                                                              | Jeton de bot + Signing Secret                                                                                    |
| Ordinateur de développement / derrière un pare-feu | Fonctionne tel quel                                                                                                                   | Nécessite un tunnel public (ngrok, Cloudflare Tunnel, Tailscale Funnel) ou un Gateway de préproduction          |
| Mise à l’échelle horizontale | Une session Socket Mode par application et par hôte ; plusieurs Gateway nécessitent des applications Slack distinctes                               | Gestionnaire POST sans état ; plusieurs réplicas du Gateway peuvent partager une application derrière un répartiteur de charge |
| Plusieurs comptes sur un Gateway | Pris en charge ; chaque compte ouvre son propre WS                                                                                              | Pris en charge ; chaque compte nécessite un `webhookPath` unique (`/slack/events` par défaut) afin d’éviter les collisions entre les enregistrements |
| Transport des commandes slash | Acheminées par la connexion WS ; `slash_commands[].url` est ignoré                                                                                     | Slack envoie des requêtes POST à `slash_commands[].url` ; le champ est requis pour distribuer la commande          |
| Signature des requêtes       | Non utilisée (l’authentification repose sur le jeton au niveau de l’application)                                                                     | Slack signe chaque requête ; OpenClaw effectue la vérification avec `signingSecret`                          |
| Récupération après une interruption de connexion | La reconnexion automatique du SDK Slack est activée ; OpenClaw redémarre également les sessions Socket Mode défaillantes avec un délai exponentiel borné. Le réglage du transport pour l’expiration des pong s’applique. | Aucune connexion persistante susceptible d’être interrompue ; les nouvelles tentatives sont effectuées par Slack pour chaque requête |

<Note>
  **Choisissez Socket Mode** pour les hôtes avec un seul Gateway, les ordinateurs de développement et les réseaux sur site qui peuvent joindre `*.slack.com` en sortie, mais ne peuvent pas accepter de connexions HTTPS entrantes.

**Choisissez les URL de requête HTTP** si vous exécutez plusieurs réplicas du Gateway derrière un répartiteur de charge, si le WSS sortant est bloqué mais que le HTTPS entrant est autorisé, ou si vous terminez déjà les Webhook Slack au niveau d’un proxy inverse.
</Note>

<Warning>
  Slack peut maintenir plusieurs connexions Socket Mode pour une même application et acheminer chaque charge utile vers n’importe laquelle de ces connexions. Des Gateway OpenClaw distincts qui partagent une application Slack doivent donc disposer d’une configuration équivalente pour le routage et l’autorisation. Sinon, utilisez une application Slack distincte pour chaque Gateway, un point d’entrée relais unique ou des URL de requête HTTP derrière un répartiteur de charge. Consultez [Utilisation de Socket Mode](https://docs.slack.dev/apis/events-api/using-socket-mode#using-multiple-connections).
</Warning>

### Mode relais

Le mode relais sépare le trafic entrant Slack du Gateway OpenClaw. Un routeur de confiance prend en charge l’unique connexion Slack Socket Mode, choisit un Gateway de destination et transmet un événement typé par un websocket authentifié. Le Gateway continue d’utiliser son propre jeton de bot pour les appels sortants à l’API Web Slack.

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

L’URL du relais doit utiliser `wss://`, sauf si elle cible localhost. Considérez le jeton porteur et la table de routage du routeur comme faisant partie de la frontière d’autorisation Slack : les événements routés entrent dans le gestionnaire de messages Slack normal en tant qu’activations autorisées. Un `slack_identity` fourni par le routeur dans la trame websocket `hello` peut définir le nom d’utilisateur et l’icône sortants par défaut ; une identité explicite fournie par l’appelant reste prioritaire. La connexion relais se reconnecte avec les mêmes délais exponentiels bornés que Socket Mode et efface l’identité fournie par le routeur à chaque déconnexion.

### Installations à l’échelle d’une organisation Enterprise Grid

Un compte Slack peut recevoir des messages de chaque espace de travail couvert par une installation Enterprise Grid à l’échelle de l’organisation. Choisissez directement Socket Mode ou les URL de requête HTTP ; le mode relais n’est pas pris en charge pour les comptes d’entreprise. Les deux manifestes à privilèges minimaux ci-dessous activent uniquement le chemin d’événements V1 `message` et `app_mention`, les réponses immédiates et les réactions de statut prises en charge par l’écouteur.

#### Socket Mode

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Connecteur Slack pour OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "channels:history",
        "channels:read",
        "chat:write",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "mpim:history",
        "mpim:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "org_deploy_enabled": true,
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim"
      ]
    }
  }
}
```

Demandez à un Enterprise Grid Org Admin ou Org Owner d’approuver l’application, de l’installer au niveau de l’organisation et de choisir les espaces de travail couverts par l’installation. Vérifiez que l’application est disponible dans chaque espace de travail prévu avant de démarrer OpenClaw. Générez un jeton au niveau de l’application avec `connections:write` pour Socket Mode, puis copiez le jeton de bot depuis l’installation de l’organisation. Configurez le compte qui utilise le jeton de bot installé au niveau de l’organisation :

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      enterpriseOrgInstall: true,
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "allowlist",
      channels: {
        C0123456789: { requireMention: true },
      },
    },
  },
}
```

#### URL de requête HTTP

Utilisez le mode HTTP lorsque le Gateway dispose d’un point de terminaison HTTPS public et n’ouvre pas de connexion Socket Mode. Remplacez l’URL d’exemple par l’URL publique `webhookPath` du Gateway (`/slack/events` par défaut) :

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Connecteur Slack pour OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "channels:history",
        "channels:read",
        "chat:write",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "mpim:history",
        "mpim:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "org_deploy_enabled": true,
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim"
      ]
    }
  }
}
```

Demandez à un Enterprise Grid Org Admin ou Org Owner d’approuver l’application, de l’installer au niveau de l’organisation et de choisir les espaces de travail couverts par l’installation. Une fois que Slack a vérifié la Request URL, copiez le jeton de bot de l’installation de l’organisation et le **Basic Information -> App Credentials -> Signing Secret** de l’application. Configurez le compte d’entreprise avec le même chemin de Request URL :

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      enterpriseOrgInstall: true,
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      signingSecret: {
        source: "env",
        provider: "default",
        id: "SLACK_SIGNING_SECRET",
      },
      webhookPath: "/slack/events",
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "allowlist",
      channels: {
        C0123456789: { requireMention: true },
      },
    },
  },
}
```

Au démarrage, OpenClaw vérifie `enterpriseOrgInstall` avec le `auth.test` de Slack. Un jeton installé au niveau de l’organisation sans l’indicateur, ou un jeton d’espace de travail avec l’indicateur, entraîne l’échec du démarrage. Slack reste la source de vérité concernant les espaces de travail qui ont accordé l’installation ; OpenClaw applique ensuite les politiques configurées relatives aux canaux, aux utilisateurs, aux messages privés et aux mentions à chaque événement acheminé. Enterprise V1 rejette tous les événements `message` et `app_mention` créés par des bots avant leur distribution, indépendamment de `allowBots`, car les installations au niveau de l’organisation ne fournissent pas d’identité de bot stable et qualifiée par espace de travail permettant d’éviter les boucles.

La prise en charge des comptes d’entreprise est volontairement limitée aux événements directs Socket Mode ou HTTP `message` et `app_mention` et à leurs réponses immédiates. Le mode relais, les commandes slash, les interactions, App Home, les écouteurs d’événements de réaction, les éléments épinglés, les outils d’action Slack, les approbations natives de Slack, les liaisons, les envois mis en file d’attente ou planifiés et les envois proactifs ne sont pas disponibles pour un compte d’entreprise. Les réactions sortantes d’accusé de réception, de saisie et de statut sont prises en charge par le client Slack détenu par l’écouteur et nécessitent `reactions:write` ; les notifications de réaction entrantes et les outils d’action de réaction restent indisponibles.

Les réponses immédiates réutilisent le comportement de remise Slack standard pour les fragments,
les médias, les métadonnées, le repli d’identité, les aperçus de liens et les accusés de réception, mais uniquement tant que le
client validé appartenant à l’écouteur reste dans le traitement actif de l’événement. La
file d’envoi en mémoire et les enregistrements de participation aux fils de discussion sont partitionnés selon l’espace de travail de cet
événement ; le client lui-même n’est jamais sérialisé ni conservé.

Les clés de politique de canal et les entrées `dm.groupChannels` doivent utiliser des identifiants de canal Slack bruts et stables ou la
forme `channel:<id>`. OpenClaw normalise les deux formes en identifiant de canal brut pour
la mise en correspondance à l’exécution ; les préfixes `slack:`, `group:` et `mpim:` empêchent le démarrage.
Les entrées de politique utilisateur doivent utiliser des identifiants utilisateur Slack stables ; les noms, slugs, noms d’affichage
et adresses e-mail empêchent le démarrage. Les identifiants doivent utiliser le préfixe canonique en majuscules
et le corps de Slack (par exemple, `C0123456789` ou `U0123456789`) ; les variantes en minuscules et
les identifiants courts ressemblants empêchent le démarrage. Les comptes Enterprise ne peuvent pas activer
`dangerouslyAllowNameMatching`. Les comptes Enterprise peuvent définir la valeur globale
`mentionPatterns.mode`, mais `mentionPatterns.allowIn` et
`mentionPatterns.denyIn` empêchent le démarrage, car les identifiants de canal Slack seuls ne sont pas
qualifiés par espace de travail et peuvent être réutilisés dans plusieurs espaces de travail. Les installations dans un espace de travail
conservent le comportement existant des motifs de mention délimités. Chaque espace de travail accepté
dispose d’identités distinctes pour le routage, la session, la transcription, la déduplication, l’historique et le cache,
même lorsque les identifiants Slack se chevauchent. Dans le flux `message`, les messages utilisateur ordinaires
et les événements `file_share` créés par des utilisateurs sont pris en charge ; les autres sous-types de message sont
rejetés avant l’autorisation ou le traitement des événements système.

Les messages privés Enterprise doivent soit être désactivés (`dm.enabled=false` ou
`dmPolicy="disabled"`), soit être explicitement ouverts avec `dmPolicy="open"` et
un compte `allowFrom` effectif contenant la valeur littérale `"*"`. Une liste d’autorisation vide
ou des identifiants propres à des utilisateurs sans `"*"` empêchent le démarrage. L’appairage et
les listes d’autorisation de messages privés par utilisateur sont rejetés, car les identifiants utilisateur Slack ne sont pas
qualifiés par espace de travail dans ces magasins d’autorisation. La politique de canal et d’expéditeur
continue de s’appliquer aux messages de canal.

## Installation

```bash
openclaw plugins install @openclaw/slack
```

`plugins install` enregistre et active le plugin. Il ne fait rien tant que vous n’avez pas configuré l’application Slack et les paramètres de canal ci-dessous. Consultez [Plugins](/fr/tools/plugin) pour connaître les règles générales d’installation des plugins.

## Configuration rapide

Les manifestes de cette section créent une installation limitée à un espace de travail. Pour une
installation à l’échelle d’une organisation Enterprise Grid, utilisez plutôt le
[manifeste et le flux de travail à l’échelle de l’organisation](#enterprise-grid-org-wide-installs) dédiés.

<Tabs>
  <Tab title="Mode Socket (par défaut)">
    <Steps>
      <Step title="Créer une nouvelle application Slack">
        Ouvrez [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → sélectionnez votre espace de travail → collez l’un des manifestes ci-dessous → **Next** → **Create**.

        <CodeGroup>

```json Recommended
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Connecteur Slack pour OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw connecte les fils de discussion de l’assistant Slack aux agents OpenClaw.",
      "suggested_prompts": [
        { "title": "Que pouvez-vous faire ?", "message": "En quoi pouvez-vous m’aider ?" },
        {
          "title": "Résumer ce canal",
          "message": "Résumez l’activité récente de ce canal."
        },
        { "title": "Rédiger une réponse", "message": "Aidez-moi à rédiger une réponse." }
      ]
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
    "description": "Connecteur Slack pour OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw connecte les fils de discussion de l’assistant Slack aux agents OpenClaw.",
      "suggested_prompts": [
        { "title": "Que pouvez-vous faire ?", "message": "En quoi pouvez-vous m’aider ?" },
        {
          "title": "Résumer ce canal",
          "message": "Résumez l’activité récente de ce canal."
        },
        { "title": "Rédiger une réponse", "message": "Aidez-moi à rédiger une réponse." }
      ]
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
          **Recommandé** correspond à l’ensemble complet des fonctionnalités du plugin Slack : App Home, commandes slash, fichiers, réactions, épingles, messages privés de groupe et lectures des emoji/groupes d’utilisateurs. Choisissez **Minimal** lorsque la politique de l’espace de travail restreint les portées : il couvre les messages privés, l’historique des canaux/groupes, les mentions et les commandes slash, mais exclut les fichiers, les réactions, les épingles, les messages privés de groupe (`mpim:*`), `emoji:read` et `usergroups:read`. Consultez la [liste de contrôle du manifeste et des portées](#manifest-and-scope-checklist) pour connaître la justification de chaque portée et les options additives telles que des commandes slash supplémentaires.
        </Note>

        Après la création de l’application par Slack :

        - **Basic Information -> App-Level Tokens -> Generate Token and Scopes** : ajoutez `connections:write`, enregistrez, puis copiez l’App-Level Token.
        - **Install App -> Install to Workspace** : copiez le Bot User OAuth Token.

      </Step>

      <Step title="Configurer OpenClaw">

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

        Repli sur les variables d’environnement (compte par défaut uniquement) :

```bash
SLACK_APP_TOKEN=slack-app-token-example
SLACK_BOT_TOKEN=slack-bot-token-example
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
      <Step title="Créer une nouvelle application Slack">
        Ouvrez [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → sélectionnez votre espace de travail → collez l’un des manifestes ci-dessous → remplacez `https://gateway-host.example.com/slack/events` par l’URL publique de votre Gateway → **Next** → **Create**.

        <CodeGroup>

```json Recommended
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Connecteur Slack pour OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw connecte les fils de discussion de l’assistant Slack aux agents OpenClaw.",
      "suggested_prompts": [
        { "title": "Que pouvez-vous faire ?", "message": "En quoi pouvez-vous m’aider ?" },
        {
          "title": "Résumer ce canal",
          "message": "Résumez l’activité récente de ce canal."
        },
        { "title": "Rédiger une réponse", "message": "Aidez-moi à rédiger une réponse." }
      ]
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
    "description": "Connecteur Slack pour OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw connecte les fils de discussion de l’assistant Slack aux agents OpenClaw.",
      "suggested_prompts": [
        { "title": "Que pouvez-vous faire ?", "message": "En quoi pouvez-vous m’aider ?" },
        {
          "title": "Résumer ce canal",
          "message": "Résumez l’activité récente de ce canal."
        },
        { "title": "Rédiger une réponse", "message": "Aidez-moi à rédiger une réponse." }
      ]
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
          La configuration **recommandée** correspond à l’ensemble complet des fonctionnalités du plugin Slack ; la configuration **minimale** exclut les fichiers, les réactions, les épingles, les messages privés de groupe (`mpim:*`), `emoji:read` et `usergroups:read` pour les espaces de travail soumis à des restrictions. Consultez la [liste de contrôle du manifeste et des portées](#manifest-and-scope-checklist) pour connaître la justification de chaque portée.
        </Note>

        <Info>
          Les trois champs d’URL (`slash_commands[].url`, `event_subscriptions.request_url` et `interactivity.request_url` / `message_menu_options_url`) pointent tous vers le même point de terminaison OpenClaw. Le schéma du manifeste de Slack exige qu’ils soient nommés séparément, mais OpenClaw effectue le routage selon le type de charge utile ; un seul `webhookPath` (`/slack/events` par défaut) suffit donc. En mode HTTP, les commandes slash sans `slash_commands[].url` ne produisent silencieusement aucun effet.
        </Info>

        Après la création de l’application par Slack :

        - **Basic Information → App Credentials** : copiez le **Signing Secret** pour vérifier les requêtes.
        - **Install App -> Install to Workspace** : copiez le Bot User OAuth Token.

      </Step>

      <Step title="Configurer OpenClaw">

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
        Utilisez des chemins de Webhook uniques pour le mode HTTP multicomptes

        Attribuez à chaque compte un `webhookPath` distinct (`/slack/events` par défaut) afin que les enregistrements n’entrent pas en conflit.
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

Par défaut, OpenClaw définit à 15 secondes le délai d’attente du pong du client SDK Slack pour Socket Mode. Ne remplacez les paramètres de transport que si un réglage propre à l’espace de travail ou à l’hôte est nécessaire :

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

Utilisez cette configuration uniquement pour les espaces de travail en Socket Mode qui consignent des délais d’attente de pong ou de ping serveur de la connexion WebSocket Slack, ou qui s’exécutent sur des hôtes présentant un blocage connu de la boucle d’événements. `clientPingTimeout` correspond à l’attente du pong après l’envoi d’un ping client par le SDK ; `serverPingTimeout` correspond à l’attente des pings du serveur Slack. Les messages et événements de l’application restent des états applicatifs, et non des signaux indiquant que le transport est opérationnel.

Remarques :

- `socketMode` est ignoré en mode HTTP Request URL.
- Les paramètres `channels.slack.socketMode` de base s’appliquent à tous les comptes Slack, sauf s’ils sont remplacés. Les remplacements propres à chaque compte utilisent `channels.slack.accounts.<accountId>.socketMode` ; comme il s’agit d’un remplacement d’objet, incluez tous les champs de réglage Socket souhaités pour ce compte.
- Seul `clientPingTimeout` possède une valeur par défaut OpenClaw (`15000`). `serverPingTimeout` et `pingPongLoggingEnabled` ne sont transmis au SDK Slack que lorsqu’ils sont configurés.
- Le délai de reprise progressive après redémarrage de Socket Mode commence autour de 2 secondes et est plafonné à environ 30 secondes. Les échecs récupérables de démarrage, d’attente de démarrage et de déconnexion sont réessayés jusqu’à l’arrêt du canal. Les erreurs permanentes de compte et d’identifiants, telles qu’une authentification non valide, des jetons révoqués ou des portées manquantes, échouent immédiatement au lieu d’être réessayées indéfiniment.

## Liste de contrôle du manifeste et des portées

Le manifeste de base de l’application Slack est identique pour Socket Mode et les HTTP Request URLs. Seuls le bloc `settings` et le `url` de la commande slash diffèrent.

Manifeste de base (Socket Mode par défaut) :

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Connecteur Slack pour OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw connecte les fils de discussion de l’assistant Slack aux agents OpenClaw.",
      "suggested_prompts": [
        { "title": "Que pouvez-vous faire ?", "message": "En quoi pouvez-vous m’aider ?" },
        {
          "title": "Résumer ce canal",
          "message": "Résumez l’activité récente de ce canal."
        },
        { "title": "Rédiger une réponse", "message": "Aidez-moi à rédiger une réponse." }
      ]
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

Pour le **mode HTTP Request URLs**, remplacez `settings` par la variante HTTP et ajoutez `url` à chaque commande slash. Une URL publique est requise :

```json
{
  "features": {
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Envoyer un message à OpenClaw",
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

### Paramètres supplémentaires du manifeste

Exposez différentes fonctionnalités qui étendent les valeurs par défaut ci-dessus.

Le manifeste par défaut active l’onglet **Home** de Slack App Home et s’abonne à `app_home_opened`. Lorsqu’un membre de l’espace de travail ouvre l’onglet Home, OpenClaw publie une vue d’accueil sûre par défaut avec `views.publish` ; aucune charge utile de conversation ni configuration privée n’y est incluse. Lorsque le mode à commande slash unique est activé, l’indication de commande utilise `channels.slack.slashCommand.name` ; les installations utilisant des commandes natives ou aucune commande slash omettent cette indication. L’onglet **Messages** reste activé pour les messages privés Slack. Le manifeste active également les fils de discussion de l’assistant Slack avec `features.assistant_view`, `assistant:write`, `assistant_thread_started` et `assistant_thread_context_changed` ; les fils de discussion de l’assistant sont acheminés vers leurs propres sessions de fil de discussion OpenClaw et conservent le contexte de fil fourni par Slack à la disposition de l’agent.

<AccordionGroup>
  <Accordion title="Commandes slash natives facultatives">

    Plusieurs [commandes slash natives](#commands-and-slash-behavior) peuvent être utilisées à la place d’une commande configurée unique, avec quelques nuances :

    - Utilisez `/agentstatus` à la place de `/status`, car la commande `/status` est réservée.
    - Une application Slack ne peut pas enregistrer plus de 25 commandes slash simultanément (limite de la plateforme Slack).

    Remplacez votre section `features.slash_commands` existante par un sous-ensemble des [commandes disponibles](/fr/tools/slash-commands#command-list) :

    <Tabs>
      <Tab title="Socket Mode (par défaut)">

```json
{
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
      "description": "Arrêter l’exécution actuelle"
    },
    {
      "command": "/session",
      "description": "Gérer l’expiration de la liaison au fil de discussion",
      "usage_hint": "idle <duration|off> or max-age <duration|off>"
    },
    {
      "command": "/think",
      "description": "Définir le niveau de réflexion",
      "usage_hint": "<level>"
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
      "command": "/approve",
      "description": "Approuver ou refuser les demandes d’approbation en attente",
      "usage_hint": "<id> <decision>"
    },
    {
      "command": "/model",
      "description": "Afficher ou définir le modèle",
      "usage_hint": "[name|#|status]"
    },
    {
      "command": "/models",
      "description": "Répertorier les fournisseurs/modèles",
      "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
    },
    {
      "command": "/help",
      "description": "Afficher le résumé succinct de l’aide"
    },
    {
      "command": "/commands",
      "description": "Afficher le catalogue de commandes généré"
    },
    {
      "command": "/tools",
      "description": "Afficher ce que l’agent actuel peut utiliser maintenant",
      "usage_hint": "[compact|verbose]"
    },
    {
      "command": "/agentstatus",
      "description": "Afficher l’état d’exécution, notamment l’utilisation/le quota du fournisseur lorsqu’ils sont disponibles"
    },
    {
      "command": "/tasks",
      "description": "Répertorier les tâches en arrière-plan actives/récentes de la session actuelle"
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
      "description": "Poser une question annexe sans modifier le contexte de la session",
      "usage_hint": "<question>"
    },
    {
      "command": "/side",
      "description": "Poser une question annexe sans modifier le contexte de la session",
      "usage_hint": "<question>"
    },
    {
      "command": "/usage",
      "description": "Contrôler le pied de page d’utilisation ou afficher le récapitulatif des coûts",
      "usage_hint": "off|tokens|full|cost"
    }
  ]
}
```

      </Tab>
      <Tab title="URL des requêtes HTTP">
        Utilisez la même liste `slash_commands` que pour le mode Socket ci-dessus et ajoutez `"url": "https://gateway-host.example.com/slack/events"` à chaque entrée. Exemple :

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "Démarrer une nouvelle session",
      "usage_hint": "[model]",
      "url": "https://gateway-host.example.com/slack/events"
    },
    {
      "command": "/help",
      "description": "Afficher le résumé succinct de l’aide",
      "url": "https://gateway-host.example.com/slack/events"
    }
  ]
}
```

        Répétez cette valeur `url` pour chaque commande de la liste.

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Portées d’auteur facultatives (opérations d’écriture)">
    Ajoutez la portée de bot `chat:write.customize` si vous souhaitez que les messages sortants utilisent l’identité de l’agent actif (nom d’utilisateur et icône personnalisés) au lieu de l’identité par défaut de l’application Slack.

    Si vous utilisez une icône emoji, Slack attend la syntaxe `:emoji_name:`.

  </Accordion>
  <Accordion title="Portées facultatives du jeton utilisateur (opérations de lecture)">
    Si vous configurez `channels.slack.userToken`, les portées de lecture habituelles sont :

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
- Le mode relais requiert `botToken` ainsi que `relay.url`, `relay.authToken` et `relay.gatewayId` ; il n’utilise ni jeton d’application ni secret de signature.
- `botToken`, `appToken`, `signingSecret`, `relay.authToken` et `userToken` acceptent des chaînes
  en texte brut ou des objets SecretRef.
- Les jetons de configuration remplacent les valeurs de repli des variables d’environnement.
- Les valeurs de repli des variables d’environnement `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN` et `SLACK_USER_TOKEN` ne s’appliquent chacune qu’au compte par défaut.
- `userToken` adopte par défaut un comportement en lecture seule (`userTokenReadOnly: true`).

Comportement de l’instantané d’état :

- L’inspection des comptes Slack suit les champs `*Source` et `*Status`
  pour chaque identifiant d’accès (`botToken`, `appToken`, `signingSecret`, `userToken`).
- L’état est `available`, `configured_unavailable` ou `missing`.
- `configured_unavailable` signifie que le compte est configuré au moyen de SecretRef
  ou d’une autre source de secrets non intégrée, mais que le chemin de commande/d’exécution actuel
  n’a pas pu résoudre la valeur réelle.
- En mode HTTP, `signingSecretStatus` est inclus ; en mode Socket, la
  paire requise est `botTokenStatus` + `appTokenStatus`.

<Tip>
Pour les actions/lectures d’annuaire, le jeton utilisateur peut être privilégié lorsqu’il est configuré. Pour les écritures, le jeton de bot reste privilégié ; les écritures avec un jeton utilisateur ne sont autorisées que lorsque `userTokenReadOnly: false` et que le jeton de bot est indisponible.
</Tip>

## Actions et contrôles

Les actions Slack sont contrôlées par `channels.slack.actions.*`.

Groupes d’actions disponibles dans les outils Slack actuels :

| Groupe     | Valeur par défaut |
| ---------- | ----------------- |
| messages   | activé            |
| reactions  | activé            |
| pins       | activé            |
| memberInfo | activé            |
| emojiList  | activé            |

Les actions actuelles sur les messages Slack comprennent `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` et `emoji-list`. `download-file` accepte les identifiants de fichiers Slack affichés dans les espaces réservés des fichiers entrants et renvoie des aperçus pour les images ou les métadonnées du fichier local pour les autres types de fichiers.

## Contrôle d’accès et routage

<Tabs>
  <Tab title="Politique des messages privés">
    `channels.slack.dmPolicy` contrôle l’accès aux messages privés. `channels.slack.allowFrom` est la liste d’autorisation canonique des messages privés.

    - `pairing` (par défaut)
    - `allowlist`
    - `open` (requiert que `channels.slack.allowFrom` comprenne `"*"`)
    - `disabled`

    Options des messages privés :

    - `dm.enabled` (valeur par défaut : true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (ancien)
    - `dm.groupEnabled` (valeur par défaut des messages privés de groupe : false)
    - `dm.groupChannels` (liste d’autorisation MPIM facultative)

    Priorité entre plusieurs comptes :

    - `channels.slack.accounts.default.allowFrom` s’applique uniquement au compte `default`.
    - Les comptes nommés héritent de `channels.slack.allowFrom` lorsque leur propre valeur `allowFrom` n’est pas définie.
    - Les comptes nommés n’héritent pas de `channels.slack.accounts.default.allowFrom`.

    Les anciennes valeurs `channels.slack.dm.policy` et `channels.slack.dm.allowFrom` sont toujours lues à des fins de compatibilité. `openclaw doctor --fix` les migre vers `dmPolicy` et `allowFrom` lorsqu’il peut le faire sans modifier l’accès.

    L’appairage dans les messages privés utilise `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Politique des canaux">
    `channels.slack.groupPolicy` contrôle la gestion des canaux :

    - `open`
    - `allowlist`
    - `disabled`

    La liste d’autorisation des canaux se trouve sous `channels.slack.channels` et **doit utiliser des identifiants de canal Slack stables** (par exemple `C12345678`) comme clés de configuration.

    Remarque sur l’exécution : si `channels.slack` est complètement absent (configuration uniquement par variables d’environnement), l’exécution utilise `groupPolicy="allowlist"` comme valeur de repli et consigne un avertissement (même si `channels.defaults.groupPolicy` est défini).

    Résolution des noms/identifiants :

    - les entrées des listes d’autorisation des canaux et des messages privés sont résolues au démarrage lorsque l’accès par jeton le permet
    - les entrées de nom de canal non résolues sont conservées telles qu’elles sont configurées, mais ignorées par défaut pour le routage
    - l’autorisation entrante et le routage des canaux privilégient par défaut les identifiants ; la correspondance directe des noms d’utilisateur/slugs requiert `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Les clés fondées sur le nom (`#channel-name` ou `channel-name`) ne correspondent **pas** sous `groupPolicy: "allowlist"`. La recherche du canal privilégie par défaut l’identifiant ; une clé fondée sur le nom ne sera donc jamais correctement routée et tous les messages de ce canal seront silencieusement bloqués. Cela diffère de `groupPolicy: "open"`, où la clé du canal n’est pas requise pour le routage et où une clé fondée sur le nom semble fonctionner.

    Utilisez toujours l’identifiant du canal Slack comme clé. Pour le trouver : faites un clic droit sur le canal dans Slack → **Copy link** — l’identifiant (`C...`) apparaît à la fin de l’URL.

    Correct :

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            C12345678: { enabled: true, requireMention: true },
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
            "#eng-my-channel": { enabled: true, requireMention: true },
          },
        },
      },
    }
    ```
    </Warning>

  </Tab>

  <Tab title="Mentions et utilisateurs des canaux">
    Par défaut, les messages des canaux nécessitent une mention.

    Sources des mentions :

    - mention explicite de l’application (`<@botId>`)
    - mention d’un groupe d’utilisateurs Slack (`<!subteam^S...>`) lorsque l’utilisateur bot appartient à ce groupe d’utilisateurs ; requiert `usergroups:read`
    - motifs d’expression régulière de mention (`agents.list[].groupChat.mentionPatterns`, valeur de repli `messages.groupChat.mentionPatterns`)
    - comportement implicite de réponse au fil de discussion du bot (désactivé lorsque `thread.requireExplicitMention` vaut `true`)

    Contrôles par canal (`channels.slack.channels.<id>` ; noms uniquement au moyen de la résolution au démarrage ou de `dangerouslyAllowNameMatching`) :

    - `requireMention`
    - `ignoreOtherMentions`
    - `replyToMode` (`off|first|all|batched` ; remplace le mode de réponse du compte/type de conversation pour ce canal)
    - `users` (liste d’autorisation)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - format de clé `toolsBySender` : `channel:`, `id:`, `e164:`, `username:`, `name:` ou caractère générique `"*"`
      (les anciennes clés sans préfixe correspondent toujours uniquement à `id:`)

    `ignoreOtherMentions` (valeur par défaut : `false`) ignore les messages de canal qui mentionnent un autre utilisateur ou groupe d’utilisateurs, mais pas ce bot. Les messages privés et les messages privés de groupe (MPIM) ne sont pas affectés. Le filtre nécessite un ID utilisateur de bot résolu à partir de `auth.test` ; si cette identité n’est pas disponible (par exemple, une identité reposant uniquement sur un jeton utilisateur), le contrôle échoue en mode ouvert et les messages sont transmis sans modification.

    `allowBots` est prudent pour les canaux et les canaux privés : les messages de salon rédigés par un bot ne sont acceptés que si le bot expéditeur figure explicitement dans la liste d’autorisation `users` de ce salon, ou si au moins un ID de propriétaire Slack explicite provenant de `channels.slack.allowFrom` correspond actuellement à un membre du salon. Les caractères génériques et les entrées de propriétaire utilisant un nom d’affichage ne permettent pas d’établir la présence d’un propriétaire. La présence du propriétaire utilise `conversations.members` de Slack ; vérifiez que l’application dispose de la portée de lecture correspondant au type de salon (`channels:read` pour les canaux publics, `groups:read` pour les canaux privés). Si la recherche des membres échoue, OpenClaw ignore le message de salon rédigé par un bot.

    Les messages Slack acceptés rédigés par un bot utilisent la [protection partagée contre les boucles de bots](/fr/channels/bot-loop-protection). Configurez `channels.defaults.botLoopProtection` pour le budget par défaut, puis remplacez cette valeur avec `channels.slack.botLoopProtection` ou `channels.slack.channels.<id>.botLoopProtection` lorsqu’un espace de travail ou un canal nécessite une limite différente.

  </Tab>
</Tabs>

## Fils de discussion, sessions et balises de réponse

- Les messages privés sont acheminés en tant que `direct` ; les canaux en tant que `channel` ; les MPIM en tant que `group`.
- Les liaisons de routage Slack acceptent les ID bruts des pairs ainsi que les formes de cible Slack telles que `channel:C12345678`, `user:U12345678` et `<@U12345678>`.
- Avec la valeur par défaut `session.dmScope=main`, les messages privés Slack sont regroupés dans la session principale de l’agent.
- Sessions de canal : `agent:<agentId>:slack:channel:<channelId>`.
- Les messages ordinaires de premier niveau dans les canaux restent dans la session propre au canal, même lorsque `replyToMode` n’est pas `off`.
- Les réponses dans les fils Slack utilisent le `thread_ts` Slack parent pour les suffixes de session (`:thread:<threadTs>`), même lorsque les réponses sortantes dans les fils sont désactivées avec `replyToMode="off"`.
- OpenClaw initialise une racine de canal de premier niveau admissible dans `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>` lorsque cette racine est censée démarrer un fil Slack visible, afin que la racine et les réponses ultérieures du fil partagent une même session OpenClaw. Cela s’applique aux événements `app_mention`, aux correspondances explicites de mention du bot ou de motifs de mention configurés, ainsi qu’aux canaux `requireMention: false` dont le `replyToMode` n’est pas `off`.
- La valeur par défaut de `channels.slack.thread.historyScope` est `thread` ; celle de `thread.inheritParent` est `false`.
- `channels.slack.thread.initialHistoryLimit` détermine le nombre de messages existants du fil récupérés au démarrage d’une nouvelle session de fil (valeur par défaut : `20` ; définissez `0` pour désactiver cette fonction).
- `channels.slack.thread.requireExplicitMention` (valeur par défaut : `false`) : lorsque la valeur est `true`, supprime les mentions implicites dans les fils afin que le bot réponde uniquement aux mentions explicites `@bot` dans les fils, même s’il a déjà participé au fil. Sans cette option, les réponses dans un fil auquel le bot a participé contournent le contrôle `requireMention`.

Paramètres des réponses dans les fils :

- `channels.slack.channels.<id>.replyToMode` : remplacement propre au canal pour les messages des canaux et canaux privés Slack
- `channels.slack.replyToMode` : `off|first|all|batched` (valeur par défaut : `off`)
- `channels.slack.replyToModeByChatType` : par `direct|group|channel`
- solution de repli héritée pour les conversations directes : `channels.slack.dm.replyToMode`

Les balises de réponse manuelles sont prises en charge :

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Pour les réponses explicites dans les fils Slack envoyées avec l’outil `message`, définissez `replyBroadcast: true` avec `action: "send"` et `threadId` ou `replyTo` afin de demander à Slack de diffuser également la réponse du fil dans le canal parent. Cela correspond à l’indicateur `reply_broadcast` de `chat.postMessage` dans Slack et n’est pris en charge que pour les envois de texte ou Block Kit, pas pour les téléversements de médias.

Lorsqu’un appel de l’outil `message` s’exécute dans un fil Slack et cible le même canal, OpenClaw hérite normalement du fil Slack actuel conformément au paramètre `replyToMode` effectif du compte, du type de conversation ou du canal. Les réponses automatiques et les appels `send` ou `upload-file` dans le même canal utilisent le même remplacement propre au canal. Définissez `topLevel: true` sur `action: "send"` ou `action: "upload-file"` pour forcer l’envoi d’un nouveau message dans le canal parent. `threadId: null` est accepté comme désactivation équivalente au premier niveau.

<Note>
`replyToMode="off"` désactive les réponses sortantes dans les fils Slack, y compris les balises explicites `[[reply_to_*]]`. Il n’aplatit pas les sessions entrantes des fils Slack : les messages déjà publiés dans un fil Slack sont toujours acheminés vers la session `:thread:<threadTs>`. Ce comportement diffère de Telegram, où les balises explicites sont toujours respectées en mode `"off"`. Les fils Slack masquent les messages du canal, tandis que les réponses Telegram restent visibles dans le fil de conversation.
</Note>

## Réactions d’accusé de réception

`ackReaction` envoie un emoji d’accusé de réception pendant qu’OpenClaw traite un message entrant. `ackReactionScope` détermine _quand_ cet emoji est réellement envoyé.

Par défaut, l’accusé de réception reste statique tandis que l’état natif du fil d’assistant de Slack affiche la progression à l’aide de messages de chargement alternés. Définissez `messages.statusReactions.enabled: true` pour activer à la place le cycle de vie des réactions en attente/réflexion/outil/terminé/erreur.

### Emoji (`ackReaction`)

Ordre de résolution :

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- emoji de l’identité de l’agent comme solution de repli (`agents.list[].identity.emoji`, sinon `"eyes"` / 👀)

Remarques :

- Slack attend des codes courts (par exemple `"eyes"`).
- Utilisez `""` pour désactiver la réaction pour le compte Slack ou globalement.

### Portée (`messages.ackReactionScope`)

Le fournisseur Slack lit la portée depuis `messages.ackReactionScope` (valeur par défaut : `"group-mentions"`). Il n’existe actuellement aucun remplacement au niveau du compte ou du canal Slack ; cette valeur est globale au Gateway.

Valeurs :

- `"all"` : réagir dans les messages privés et les groupes, y compris aux événements ambiants des salons.
- `"direct"` : réagir uniquement dans les messages privés.
- `"group-all"` : réagir à chaque message de groupe, à l’exception des événements ambiants des salons (aucun message privé).
- `"group-mentions"` (valeur par défaut) : réagir dans les groupes, mais uniquement lorsque le bot est mentionné (ou dans les éléments mentionnables de groupe ayant accepté cette fonction). **Les messages privés sont exclus.**
- `"off"` / `"none"` : ne jamais réagir.

<Note>
La portée par défaut (`"group-mentions"`) ne déclenche pas de réactions d’accusé de réception dans les messages directs ni pour les événements ambiants des salons. Pour voir le paramètre `ackReaction` configuré (par exemple `"eyes"`) dans les messages privés Slack entrants et les événements silencieux des salons, définissez `messages.ackReactionScope` sur `"all"`. `messages.ackReactionScope` est lu au démarrage du fournisseur Slack ; un redémarrage du Gateway est donc nécessaire pour que la modification prenne effet.
</Note>

```json5
{
  messages: {
    ackReaction: "eyes",
    ackReactionScope: "all", // réagir dans les messages privés et les groupes
  },
}
```

## Diffusion du texte en continu

`channels.slack.streaming` contrôle le comportement de l’aperçu en direct :

- `off` : désactiver la diffusion en continu de l’aperçu en direct.
- `partial` (valeur par défaut) : remplacer le texte de l’aperçu par la dernière sortie partielle.
- `block` : ajouter les mises à jour d’aperçu par fragments.
- `progress` : afficher le texte d’état de progression pendant la génération, puis envoyer le texte final.
- `streaming.preview.toolProgress` : lorsque l’aperçu du brouillon est actif, acheminer les mises à jour d’outil et de progression dans le même message d’aperçu modifié (valeur par défaut : `true`). Définissez `false` pour conserver des messages d’outil et de progression distincts.
- `streaming.preview.commandText` / `streaming.progress.commandText` : définissez sur `status` pour conserver des lignes compactes de progression des outils tout en masquant le texte brut des commandes et des exécutions (valeur par défaut : `raw`).

Masquer le texte brut des commandes et des exécutions tout en conservant des lignes de progression compactes :

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

`channels.slack.streaming.nativeTransport` contrôle la diffusion native du texte dans Slack lorsque `channels.slack.streaming.mode` est `partial` (valeur par défaut : `true`).

Les cartes de tâches de progression natives de Slack sont facultatives en mode progression. Définissez `channels.slack.streaming.progress.nativeTaskCards` sur `true` avec `channels.slack.streaming.mode="progress"` pour envoyer une carte native de planification ou de tâche Slack pendant l’exécution du travail, puis mettre à jour cette même carte une fois le travail terminé. Sans cet indicateur, le mode progression conserve le comportement portable de l’aperçu du brouillon.

- Un fil de réponse doit être disponible pour que la diffusion native du texte et l’état du fil d’assistant Slack apparaissent. La sélection du fil continue de suivre `replyToMode`.
- Les racines de canal, de conversation de groupe et de message privé de premier niveau peuvent toujours utiliser l’aperçu de brouillon normal lorsque la diffusion native est indisponible ou qu’aucun fil de réponse n’existe.
- Les messages privés Slack de premier niveau restent hors fil par défaut ; ils n’affichent donc pas l’aperçu natif de diffusion ou d’état de type fil de Slack. OpenClaw publie et modifie plutôt un aperçu de brouillon dans le message privé.
- Les médias et les charges utiles non textuelles utilisent la livraison normale comme solution de repli.
- Les résultats finaux contenant un média ou une erreur annulent les modifications d’aperçu en attente ; les résultats finaux admissibles contenant du texte ou des blocs ne sont appliqués que s’ils peuvent modifier l’aperçu sur place.
- Si la diffusion échoue en cours de réponse, OpenClaw utilise la livraison normale comme solution de repli pour les charges utiles restantes.

Utiliser l’aperçu de brouillon au lieu de la diffusion native du texte dans Slack :

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

Activer les cartes de tâches de progression natives de Slack :

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

- `channels.slack.streamMode` (`replace | status_final | append`) est un alias hérité de `channels.slack.streaming.mode`.
- La valeur booléenne `channels.slack.streaming` est un alias hérité de `channels.slack.streaming.mode` et `channels.slack.streaming.nativeTransport`.
- Les valeurs de premier niveau `channels.slack.chunkMode` et `channels.slack.nativeStreaming` sont des alias hérités de `channels.slack.streaming.chunkMode` et `channels.slack.streaming.nativeTransport`.
- Les alias hérités ne sont pas lus lors de l’exécution ; exécutez `openclaw doctor --fix` pour réécrire la configuration persistante de diffusion Slack avec les clés canoniques.

## Réaction de saisie comme solution de repli

`typingReaction` ajoute une réaction temporaire au message Slack entrant pendant qu’OpenClaw traite une réponse, puis la supprime à la fin de l’exécution. Cette option est particulièrement utile en dehors des réponses dans les fils, qui utilisent un indicateur d’état « is typing... » par défaut.

Ordre de résolution :

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Remarques :

- Slack attend des codes courts (par exemple `"hourglass_flowing_sand"`).
- La réaction est fournie au mieux et son nettoyage est automatiquement tenté après la fin de la réponse ou du parcours d’échec.

## Entrée vocale

Pour parler à OpenClaw dans Slack aujourd’hui, envoyez un clip audio Slack à l’application OpenClaw. Le microphone de dictée de Slackbot est une fonctionnalité distincte appartenant à Slack, et non une API d’application.

- **La [dictée vocale de Slackbot](https://slack.com/help/articles/202026038-How-to-use-Slackbot)** s’effectue dans la conversation Slackbot privée de l’utilisateur. Slack transforme l’enregistrement en invite Slackbot, mais ne transmet aucun fichier audio, événement de dictée, invite ni marqueur de source d’entrée aux applications Slack tierces par l’intermédiaire de l’API Events. Le plugin Slack d’OpenClaw ne peut ni l’activer ni la recevoir.
- **Les [clips audio Slack](https://slack.com/help/articles/4406235165587-Record-audio-and-video-clips-in-Slack)** sont des fichiers Slack stockés qui peuvent être publiés dans un message privé OpenClaw, un canal ou un fil de discussion. OpenClaw télécharge un clip accessible à l’aide du jeton du bot, normalise les métadonnées MIME du clip fournies par Slack et l’envoie dans le [pipeline partagé de transcription audio](/fr/nodes/audio). Le manifeste d’application recommandé inclut le champ d’application `files:read` requis.

Les clips audio et la dictée Slackbot ont des implications différentes en matière de confidentialité : les clips suivent la politique de conservation des fichiers de Slack et OpenClaw les télécharge pour les transcrire, tandis que Slack indique que l’audio de la dictée n’est pas stocké.

Dans un canal avec `requireMention: true`, un clip audio sans légende peut satisfaire la condition en prononçant un motif de mention configuré (`agents.list[].groupChat.mentionPatterns`, avec repli sur `messages.groupChat.mentionPatterns`). OpenClaw autorise l’expéditeur avant de télécharger ou de transcrire le clip, puis ne l’accepte que si la transcription correspond. Une transcription spéculative ayant échoué ou ne correspondant pas est supprimée avec le clip téléchargé ; elle n’est pas conservée dans l’historique du canal. L’identité Slack native `@bot` ne peut pas être déduite de la voix ; configurez donc un motif de nom prononcé ou incluez une mention saisie. Si la répétition de la transcription est activée, celle-ci n’est envoyée qu’après l’acceptation.

## Médias, découpage et distribution

<AccordionGroup>
  <Accordion title="Pièces jointes entrantes">
    Les pièces jointes Slack sont téléchargées depuis des URL privées hébergées par Slack (flux de requête authentifié par jeton) et écrites dans le stockage de médias lorsque la récupération réussit et que les limites de taille le permettent. Les espaces réservés de fichiers incluent le `fileId` Slack afin que les agents puissent récupérer le fichier d’origine avec `download-file`.

    Les téléchargements utilisent des délais d’expiration bornés pour l’inactivité et la durée totale. Si la récupération d’un fichier Slack se bloque ou échoue, OpenClaw poursuit le traitement du message et utilise l’espace réservé du fichier comme solution de repli.

    La limite de taille entrante à l’exécution est de `20MB` par défaut, sauf remplacement par `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Texte et fichiers sortants">
    - les fragments de texte utilisent `channels.slack.textChunkLimit` (`8000` par défaut, plafonné à la limite de longueur des messages de Slack)
    - `channels.slack.streaming.chunkMode="newline"` active le découpage donnant la priorité aux paragraphes
    - les envois de fichiers utilisent les API de téléversement de Slack et peuvent inclure des réponses dans un fil de discussion (`thread_ts`)
    - les longues légendes de fichiers utilisent le premier fragment de texte compatible avec Slack comme commentaire du téléversement et envoient les fragments restants sous forme de messages de suivi
    - la limite des médias sortants suit `channels.slack.mediaMaxMb` lorsqu’elle est configurée ; sinon, les envois dans les canaux utilisent les valeurs par défaut selon le type MIME du pipeline multimédia

  </Accordion>

  <Accordion title="Cibles de distribution">
    Cibles explicites recommandées :

    - `user:<id>` pour les messages privés
    - `channel:<id>` pour les canaux

    Les messages privés Slack ne contenant que du texte ou des blocs peuvent être publiés directement vers des identifiants utilisateur ; les téléversements de fichiers et les envois dans des fils de discussion ouvrent d’abord le message privé au moyen des API de conversation Slack, car ces chemins nécessitent un identifiant de conversation concret.

  </Accordion>
</AccordionGroup>

## Commandes et comportement des commandes slash

Les commandes slash apparaissent dans Slack soit sous la forme d’une commande configurée unique, soit sous celle de plusieurs commandes natives. Configurez `channels.slack.slashCommand` pour modifier les valeurs par défaut des commandes :

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Les commandes natives nécessitent des [paramètres de manifeste supplémentaires](#additional-manifest-settings) dans votre application Slack et sont plutôt activées avec `channels.slack.commands.native: true` ou `commands.native: true` dans les configurations globales.

- Le mode automatique des commandes natives est **désactivé** pour Slack ; `commands.native: "auto"` n’active donc pas les commandes natives Slack.

```txt
/help
```

Les menus d’arguments natifs sont affichés sous l’une des formes suivantes, par ordre de priorité :

- 3 à 5 options suffisamment courtes : un menu de dépassement (« ... »)
- plus de 100 options, avec filtrage asynchrone disponible : sélection externe
- 1 à 2 options, ou toute option dont la valeur encodée est trop longue pour une sélection : blocs de boutons
- sinon (6 à 100 options, ou plus de 100 sans filtrage asynchrone) : menu de sélection statique, découpé en groupes de 100 options par menu

```txt
/think
```

Les sessions de commandes slash utilisent des clés isolées telles que `agent:<agentId>:slack:slash:<userId>` et acheminent toujours l’exécution des commandes vers la session de conversation cible au moyen de `CommandTargetSessionKey`.

## Graphiques natifs

Le [bloc Block Kit `data_visualization` public de Slack](https://docs.slack.dev/reference/block-kit/blocks/data-visualization-block/)
affiche des graphiques en courbes, à barres, en aires et en secteurs dans les messages. OpenClaw associe le bloc
`presentation` `chart` portable à cette forme native ; aucun champ d’application OAuth supplémentaire,
téléversement de fichier, moteur de rendu d’image ni configuration Slack n’est requis en plus de l’accès normal aux messages
`chat:write`.

```json
{
  "blocks": [
    {
      "type": "chart",
      "chartType": "bar",
      "title": "Chiffre d’affaires trimestriel",
      "categories": ["T1", "T2"],
      "series": [{ "name": "Chiffre d’affaires", "values": [120, 145] }],
      "xLabel": "Trimestre"
    }
  ]
}
```

Les limites de Slack sont appliquées avant le rendu natif :

- titre et libellés d’axes facultatifs : 50 caractères
- secteurs : 1 à 12 segments positifs
- courbes/barres/aires : 1 à 12 séries portant des noms uniques et 1 à 20 catégories partagées
- libellés de segment, de catégorie et de série : 20 caractères
- chaque série doit contenir une valeur finie pour chaque catégorie ; les valeurs autres que celles des graphiques en secteurs
  peuvent être négatives

Chaque graphique natif comporte également une représentation textuelle de premier niveau pour les lecteurs
d’écran, les notifications, la mise en miroir des sessions et les clients qui ne peuvent pas afficher le
bloc. Les présentations standard envoyées à d’autres canaux OpenClaw reçoivent ces mêmes
données graphiques déterministes sous forme de texte, sauf s’ils annoncent la prise en charge native des graphiques. Si
Slack rejette le graphique avec `invalid_blocks` pendant un déploiement progressif, OpenClaw
supprime les blocs de données natifs rejetés, conserve les contrôles voisins et envoie
la représentation complète du graphique sous forme de texte visible.

Slack accepte actuellement jusqu’à deux blocs `data_visualization` par message. Lorsqu’une
présentation contient plus de deux graphiques valides, OpenClaw conserve leur ordre
et poursuit le rendu natif dans des messages de suivi, avec au maximum deux
graphiques dans chaque message.

L’[annonce destinée aux développeurs](https://docs.slack.dev/changelog/2026/06/16/block-kit-data-visualization-block/)
de Slack décrit le bloc comme une fonctionnalité Block Kit destinée aux applications et ne publie aucune
restriction liée à une formule payante. Les conditions d’éligibilité Business+/Enterprise s’appliquent à
la génération automatique de graphiques par l’IA de Slackbot, qui est distincte de l’envoi par une application
d’un graphique Block Kit déjà structuré. Les graphiques sont des blocs réservés aux messages, et non au contenu
d’App Home, de fenêtres modales ou de Canvas.

## Tableaux natifs

Le [bloc Block Kit `data_table` actuel de Slack](https://docs.slack.dev/reference/block-kit/blocks/data-table-block/)
affiche des lignes et des colonnes structurées dans les messages. OpenClaw associe un bloc
`presentation` `table` portable explicite à `data_table` ; il n’utilise pas
l’ancien [bloc `table` de Slack](https://docs.slack.dev/reference/block-kit/blocks/table-block/).
Aucun champ d’application OAuth ni aucune configuration Slack supplémentaire n’est requis en plus de l’accès normal aux messages
`chat:write`.

```json
{
  "blocks": [
    {
      "type": "table",
      "caption": "Pipeline ouvert",
      "headers": ["Compte", "Étape", "ARR"],
      "rows": [
        ["Acme", "Gagné", 125000],
        ["Globex", "Révision", 82000]
      ],
      "rowHeaderColumnIndex": 0
    }
  ]
}
```

OpenClaw associe les en-têtes et les cellules de chaîne aux cellules `raw_text` de Slack. Les cellules numériques
sont associées à `raw_number`, la valeur numérique finie étant conservée pour le tri
et le filtrage natifs. `rowHeaderColumnIndex`, lorsqu’il est présent, désigne cette
colonne indexée à partir de zéro comme en-têtes de lignes Slack.

Les limites `data_table` publiées par Slack sont appliquées avant le rendu natif :

- 1 à 20 colonnes
- 1 à 100 lignes de données, plus la ligne d’en-tête
- le même nombre de cellules dans chaque ligne
- au maximum 10 000 caractères cumulés dans toutes les cellules de tableau d’un message

Plusieurs blocs de tableau valides peuvent être affichés nativement tant que le message respecte
la limite globale de caractères. Un tableau qui ne peut pas être affiché dans les
limites natives devient un texte déterministe complet au lieu de perdre des lignes ou des
cellules. Si ce texte dépasse la taille d’un message Slack, les envois et les réponses aux commandes slash utilisent
des fragments de texte ordonnés. Les modifications de tableaux échouent avec une erreur de taille explicite au lieu de
tronquer silencieusement les lignes d’un message existant.

Chaque tableau natif produit à partir d’une présentation portable comporte également une représentation
textuelle de premier niveau pour les lecteurs d’écran, les notifications, la mise en miroir des sessions et les
clients qui ne peuvent pas afficher le bloc. Les valeurs brutes des graphiques et tableaux restent littérales
dans la solution de repli, afin que les données de cellules telles que `<@U123>` ne deviennent pas une mention Slack.
Si Slack rejette des blocs natifs de graphique ou de tableau avec `invalid_blocks`, OpenClaw
supprime tous les blocs de données natifs en une seule étape de récupération bornée, conserve les
blocs voisins valides tels que les boutons et les sélections, puis envoie le texte visible complet des graphiques
et tableaux avec le formatage Slack désactivé. La distribution des commandes slash
suit le budget de cinq appels `response_url` de Slack pour l’ensemble de la commande. Avant chaque
lot de réponses, elle sélectionne un plan complet qui respecte le nombre d’appels restants ou échoue
avant de publier ce lot.

Seuls les blocs de tableau `presentation` explicites sont promus en tableaux natifs.
Les tableaux Markdown à barres verticales restent du texte rédigé ; OpenClaw ne tente pas de déduire la structure
du tableau ni les types de cellules. Les producteurs Slack natifs approuvés existants peuvent continuer
à transmettre des blocs bruts par `channelData.slack.blocks` ; OpenClaw dérive un texte de repli
à partir des cellules `data_table` brutes valides, tandis que les blocs personnalisés mal formés peuvent
être réduits à leur légende ou à la solution de repli générale de Block Kit. Les sorties portables des agents, de la CLI
et des plugins doivent utiliser `presentation`.

## Réponses interactives

Slack peut afficher des contrôles de réponse interactifs créés par les agents, mais cette fonctionnalité est désactivée par défaut.
Pour les nouvelles sorties d’agents, de la CLI et de plugins, privilégiez les boutons partagés
`presentation` ou les blocs de sélection. Ils utilisent le même chemin d’interaction Slack
tout en proposant également une solution de repli sur les autres canaux.

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

Ou activez-la uniquement pour un compte Slack :

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

Lorsqu’elle est activée, les agents peuvent toujours émettre les directives de réponse obsolètes propres à Slack :

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Ces directives sont compilées en Block Kit Slack et acheminent les clics ou les sélections
par le chemin d’événements d’interaction Slack existant. Conservez-les pour les anciennes
invites et les solutions de contournement propres à Slack ; utilisez la présentation partagée pour les nouveaux
contrôles portables.

Les API du compilateur de directives sont également obsolètes pour le nouveau code producteur :

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

Utilisez les charges utiles `presentation` et `buildSlackPresentationBlocks(...)` pour les nouveaux
contrôles affichés dans Slack.

Remarques :

- Il s’agit d’une ancienne interface utilisateur propre à Slack. Les autres canaux ne traduisent pas les directives Slack Block
  Kit dans leurs propres systèmes de boutons.
- Les valeurs des rappels interactifs sont des jetons opaques générés par OpenClaw, et non des valeurs brutes produites par l’agent.
- Si les blocs interactifs générés dépassent les limites de Slack Block Kit, OpenClaw revient à la réponse textuelle d’origine au lieu d’envoyer une charge utile de blocs non valide.

### Soumissions de fenêtres modales gérées par les plugins

Les plugins Slack qui enregistrent un gestionnaire interactif peuvent également recevoir les événements de cycle de vie modaux
`view_submission` et `view_closed` avant qu’OpenClaw ne compacte
la charge utile pour l’événement système visible par l’agent. Utilisez l’un de ces schémas de routage
lors de l’ouverture d’une fenêtre modale Slack :

- Définissez `callback_id` sur `openclaw:<namespace>:<payload>`.
- Ou conservez un `callback_id` existant et placez `pluginInteractiveData:
"<namespace>:<payload>"` dans le `private_metadata` de la fenêtre modale.

Le gestionnaire reçoit `ctx.interaction.kind` sous la forme de `view_submission` ou
`view_closed`, le `inputs` normalisé et l’objet brut `stateValues` complet provenant de
Slack. Un routage reposant uniquement sur l’identifiant de rappel suffit à invoquer le gestionnaire du plugin ; incluez
les champs de routage utilisateur/session `private_metadata` de la fenêtre modale existante lorsque
celle-ci doit également produire un événement système visible par l’agent. L’agent reçoit un
événement système `Slack interaction: ...` compact et expurgé. Si le gestionnaire renvoie
`systemEvent.summary`, `systemEvent.reference` ou `systemEvent.data`, ces
champs sont inclus dans cet événement compact afin que l’agent puisse référencer
le stockage géré par le plugin sans voir la charge utile complète du formulaire.

## Approbations natives dans Slack

Slack peut servir de client d’approbation natif avec des boutons et interactions, au lieu de revenir à l’interface Web ou au terminal.

- Les approbations d’exécution et de plugins peuvent s’afficher sous forme d’invites Slack Block Kit natives.
- `channels.slack.execApprovals.*` reste la configuration d’activation du client natif d’approbation d’exécution et de routage vers les messages privés/canaux.
- Les messages privés d’approbation d’exécution utilisent `channels.slack.execApprovals.approvers` ou `commands.ownerAllowFrom`.
- Les approbations de plugins utilisent des boutons Slack natifs lorsque Slack est activé comme client d’approbation natif pour la session d’origine, ou lorsque `approvals.plugin` route vers la session Slack d’origine ou une cible Slack.
- Les messages privés d’approbation de plugins utilisent les approbateurs de plugins Slack provenant de `channels.slack.allowFrom`, de `allowFrom` pour le compte nommé, ou de la route par défaut du compte.
- L’autorisation des approbateurs reste appliquée : les approbateurs limités aux exécutions ne peuvent pas approuver les demandes de plugins, sauf s’ils sont également approbateurs de plugins.

Cette fonctionnalité utilise la même surface partagée de boutons d’approbation que les autres canaux. Lorsque `interactivity` est activé dans les paramètres de votre application Slack, les invites d’approbation s’affichent sous forme de boutons Block Kit directement dans la conversation.
Lorsque ces boutons sont présents, ils constituent l’expérience d’approbation principale ; OpenClaw
ne doit inclure une commande manuelle `/approve` que lorsque le résultat de l’outil indique que les approbations
par chat sont indisponibles ou que l’approbation manuelle est la seule voie possible.

Chemin de configuration :

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (facultatif ; revient à `commands.ownerAllowFrom` lorsque cela est possible)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, valeur par défaut : `dm`)
- `agentFilter`, `sessionFilter`

Slack active automatiquement les approbations d’exécution natives lorsque `enabled` n’est pas défini ou vaut `"auto"`, et qu’au moins un
approbateur d’exécution est trouvé. Slack peut également gérer les approbations de plugins natives par l’intermédiaire de ce
client natif lorsque des approbateurs de plugins Slack sont trouvés et que la demande correspond aux filtres du client natif. Définissez
`enabled: false` pour désactiver explicitement Slack comme client d’approbation natif. Définissez `enabled: true` pour
forcer l’activation des approbations natives lorsque des approbateurs sont trouvés. La désactivation des approbations d’exécution Slack ne désactive pas
la remise des approbations de plugins Slack natives activée par `approvals.plugin` ; la remise des approbations
de plugins utilise plutôt les approbateurs de plugins Slack.

Comportement par défaut sans configuration explicite des approbations d’exécution Slack :

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Une configuration Slack native explicite n’est nécessaire que pour remplacer les approbateurs, ajouter des filtres ou
activer la remise dans le chat d’origine :

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
être routées vers d’autres chats ou des cibles hors bande explicites. Le transfert partagé `approvals.plugin` est également
distinct ; la remise native Slack ne supprime cette solution de repli que lorsque Slack peut gérer nativement la demande
d’approbation de plugin.

La commande `/approve` dans le même chat fonctionne également dans les canaux et messages privés Slack qui prennent déjà en charge les commandes. Consultez [Approbations d’exécution](/fr/tools/exec-approvals) pour le modèle complet de transfert des approbations.

## Événements et comportement opérationnel

- Les modifications et suppressions de messages sont converties en événements système.
- Les diffusions de fil de discussion (réponses de fil « Also send to channel ») sont traitées comme des messages utilisateur normaux.
- Les événements d’ajout et de suppression de réactions sont convertis en événements système.
- Les événements d’arrivée et de départ de membres, de création et de renommage de canaux, ainsi que d’ajout et de suppression d’épingles sont convertis en événements système.
- Une interrogation facultative de la présence peut convertir la transition de `away` à `active` d’un participant humain observé en un événement dans la session Slack admissible la plus récemment active du participant. Cette fonctionnalité est désactivée par défaut.
- `channel_id_changed` peut migrer les clés de configuration de canal lorsque `configWrites` est activé.
- Les métadonnées de sujet et d’objectif du canal sont traitées comme du contexte non fiable et peuvent être injectées dans le contexte de routage.
- L’amorçage du contexte à partir du message initial du fil et de son historique initial est filtré, le cas échéant, selon les listes d’expéditeurs autorisés configurées.
- Les actions de blocs, les raccourcis et les interactions avec des fenêtres modales émettent des événements système `Slack interaction: ...` structurés avec des champs de charge utile détaillés :
  - actions de blocs : valeurs sélectionnées, libellés, valeurs de sélecteurs et métadonnées `workflow_*`
  - raccourcis globaux : métadonnées de rappel et d’acteur, routées vers la session directe de l’acteur
  - raccourcis de message : contexte du rappel, de l’acteur, du canal, du fil et du message sélectionné
  - événements modaux `view_submission` et `view_closed` avec métadonnées du canal routé et entrées du formulaire

Définissez des raccourcis globaux ou de message dans la configuration de votre application Slack et utilisez n’importe quel identifiant de rappel non vide. OpenClaw accuse réception des charges utiles de raccourcis correspondantes, applique la même politique d’expéditeurs pour les messages privés et les canaux que pour les autres interactions Slack, puis met en file d’attente l’événement assaini pour la session d’agent routée. Les identifiants de déclenchement et les URL de réponse sont expurgés du contexte de l’agent.

### Événements de présence

Slack n’envoie pas les changements de présence par l’API Events ni par Socket Mode. OpenClaw peut à la place interroger [`users.getPresence`](https://docs.slack.dev/reference/methods/users.getPresence/) pour les participants humains dont les messages ont passé les vérifications habituelles d’accès et de routage Slack.

```json5
{
  channels: {
    slack: {
      presenceEvents: { mode: "auto" },
      channels: {
        C0123456789: { presenceEvents: { mode: "on" } },
        C0987654321: { presenceEvents: { mode: "off" } },
      },
    },
  },
}
```

- `off` (valeur par défaut) : aucun minuteur de présence ni appel à l’API Slack.
- `auto` : surveille les messages privés, les MPIM et les fils Slack actifs au cours des dernières 24 heures, avec au maximum 8 participants humains observés. Les sessions de canal de premier niveau sont exclues.
- `on` : surveille les mêmes conversations sans limite de participants et inclut les sessions de canal de premier niveau. Utilisez un remplacement par canal pour forcer ou supprimer la surveillance d’un canal.

OpenClaw interroge au maximum 45 utilisateurs uniques par minute et par compte Slack, initialise le premier résultat sans réveiller l’agent et ne le réveille que lors d’une transition observée de `away` à `active`. Un délai de récupération persistant de 8 heures s’applique par compte Slack et par utilisateur, même si cette personne participe à plusieurs fils. L’événement est uniquement routé vers la conversation admissible la plus récemment active de cette personne et demande à l’agent de consulter la mémoire, le wiki et le contexte de fuseau horaire connu avant de décider s’il doit envoyer une courte salutation. L’agent peut rester silencieux.

Le jeton du bot nécessite `users:read`, qui est déjà inclus dans le manifeste recommandé. Les événements de présence ne sont pas disponibles pour les installations Enterprise Grid à l’échelle de l’organisation.

## Référence de configuration

Référence principale : [Référence de configuration — Slack](/fr/gateway/config-channels#slack).

<Accordion title="Champs Slack les plus pertinents">

- mode/authentification : `mode`, `enterpriseOrgInstall`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- accès aux messages privés : `dm.enabled`, `dmPolicy`, `allowFrom` (ancien : `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- option de compatibilité : `dangerouslyAllowNameMatching` (solution d’urgence ; laissez-la désactivée sauf nécessité)
- accès aux canaux : `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- fils/historique : `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- réveils liés à la présence : `presenceEvents.mode`, `channels.*.presenceEvents.mode` (`off|auto|on` ; valeur par défaut `off`)
- remise : `textChunkLimit`, `streaming.chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- aperçus : `unfurlLinks` (valeur par défaut : `false`), `unfurlMedia` pour le contrôle des aperçus de liens et de médias `chat.postMessage` ; définissez `unfurlLinks: true` pour réactiver les aperçus de liens
- exploitation/fonctionnalités : `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Dépannage

<AccordionGroup>
  <Accordion title="Aucune réponse dans les canaux">
    Vérifiez, dans l’ordre :

    - `groupPolicy`
    - liste des canaux autorisés (`channels.slack.channels`) — **les clés doivent être des identifiants de canal** (`C12345678`), et non des noms (`#channel-name`). Les clés basées sur le nom échouent silencieusement avec `groupPolicy: "allowlist"`, car le routage des canaux repose par défaut d’abord sur l’identifiant. Pour trouver un identifiant : cliquez avec le bouton droit sur le canal dans Slack → **Copy link** — la valeur `C...` à la fin de l’URL est l’identifiant du canal.
    - `requireMention`
    - liste `users` autorisée par canal
    - `messages.groupChat.visibleReplies` : les requêtes normales de groupe/canal utilisent `"automatic"` par défaut. Si vous avez activé `"message_tool"` et que les journaux affichent le texte de l’assistant sans appel à `message(action=send)`, le modèle n’a pas utilisé la voie visible de l’outil de messagerie. Dans ce mode, le texte final reste privé ; examinez le journal détaillé du Gateway pour rechercher les métadonnées de charge utile supprimées, ou définissez cette option sur `"automatic"` si vous souhaitez que chaque réponse finale normale de l’assistant soit publiée par l’ancienne voie.
    - `messages.groupChat.unmentionedInbound` : si cette valeur est `"room_event"`, les échanges non mentionnés dans les canaux autorisés constituent du contexte ambiant et restent silencieux, sauf si l’agent appelle l’outil `message`. Consultez [Événements ambiants des salons](/fr/channels/ambient-room-events).

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

  <Accordion title="Messages privés ignorés">
    Vérifiez :

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (ou l’ancien `channels.slack.dm.policy`)
    - approbations d’association / entrées de la liste d’autorisation (`dmPolicy: "open"` nécessite toujours `channels.slack.allowFrom: ["*"]`)
    - les MP de groupe utilisent la gestion MPIM ; activez `channels.slack.dm.groupEnabled` et, si elle est configurée, incluez la MPIM dans `channels.slack.dm.groupChannels`
    - événements de MP de l’Assistant Slack : les journaux détaillés mentionnant `drop message_changed`
      signifient généralement que Slack a envoyé un événement modifié de fil de discussion de l’Assistant sans
      expéditeur humain récupérable dans les métadonnées du message

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Le mode Socket ne se connecte pas">
    Validez les jetons du bot et de l’application ainsi que l’activation de Socket Mode dans les paramètres de l’application Slack.
    L’App-Level Token nécessite `connections:write`, et le jeton de bot Bot User OAuth Token
    doit appartenir à la même application Slack et au même espace de travail que le jeton d’application.

    Si `openclaw channels status --probe --json` affiche `botTokenStatus` ou
    `appTokenStatus: "configured_unavailable"`, le compte Slack est
    configuré, mais l’environnement d’exécution actuel n’a pas pu résoudre la valeur
    fondée sur SecretRef.

    Les journaux tels que `slack socket mode failed to start; retry ...` correspondent à des échecs de
    démarrage récupérables. Les portées manquantes, les jetons révoqués et une authentification non valide provoquent
    plutôt un échec immédiat. Un journal `slack token mismatch ...` signifie que le jeton du bot et le jeton d’application
    semblent appartenir à des applications Slack différentes ; corrigez les identifiants de l’application Slack.

  </Accordion>

  <Accordion title="Le mode HTTP ne reçoit pas les événements">
    Validez :

    - secret de signature
    - chemin du Webhook
    - URL de requête Slack (Events + Interactivity + Slash Commands)
    - `webhookPath` unique pour chaque compte HTTP
    - l’URL publique termine TLS et transmet les requêtes au chemin du Gateway
    - le chemin `request_url` de l’application Slack correspond exactement à `channels.slack.webhookPath` (valeur par défaut : `/slack/events`)

    Si `signingSecretStatus: "configured_unavailable"` apparaît dans les instantanés
    du compte, le compte HTTP est configuré, mais l’environnement d’exécution actuel n’a pas pu
    résoudre le secret de signature fondé sur SecretRef.

    Un journal `slack: webhook path ... already registered` répété signifie que deux comptes
    HTTP utilisent le même `webhookPath` ; attribuez un chemin distinct à chaque compte.

  </Accordion>

  <Accordion title="Les commandes natives/slash ne se déclenchent pas">
    Vérifiez si vous souhaitiez utiliser :

    - le mode de commandes natives (`channels.slack.commands.native: true`) avec les commandes slash correspondantes enregistrées dans Slack
    - ou le mode de commande slash unique (`channels.slack.slashCommand.enabled: true`)

    Slack ne crée ni ne supprime automatiquement les commandes slash. `commands.native: "auto"` n’active pas les commandes natives Slack ; utilisez `true` et créez les commandes correspondantes dans l’application Slack. En mode HTTP, chaque commande slash Slack doit inclure l’URL du Gateway. En mode Socket, les charges utiles des commandes arrivent par le websocket et Slack ignore `slash_commands[].url`.

    Vérifiez également `commands.useAccessGroups`, l’autorisation des MP, les listes d’autorisation des canaux,
    ainsi que les listes d’autorisation `users` propres à chaque canal. Slack renvoie des erreurs éphémères pour
    les expéditeurs bloqués de commandes slash, notamment :

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## Référence des pièces jointes multimédias

Slack peut joindre les médias téléchargés au tour de l’agent lorsque le téléchargement des fichiers Slack réussit et que les limites de taille le permettent. Les extraits audio peuvent être transcrits, les fichiers image peuvent passer par le parcours de compréhension des médias ou être transmis directement à un modèle de réponse prenant en charge la vision, et les autres fichiers restent disponibles comme contexte de fichier téléchargeable.

### Types de médias pris en charge

| Type de média                  | Source               | Comportement actuel                                                               | Remarques                                                                 |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Extraits audio Slack           | URL de fichier Slack | Téléchargés et acheminés par la transcription audio partagée                      | Nécessite `files:read` et un modèle ou une CLI `tools.media.audio` opérationnel |
| Images JPEG / PNG / GIF / WebP | URL de fichier Slack | Téléchargées et jointes au tour pour un traitement prenant en charge la vision    | Limite par fichier : `channels.slack.mediaMaxMb` (20 Mo par défaut)                |
| Fichiers PDF                   | URL de fichier Slack | Téléchargés et exposés comme contexte de fichier pour des outils tels que `download-file` ou `pdf` | La réception Slack ne convertit pas automatiquement les PDF en entrée visuelle d’image |
| Autres fichiers                | URL de fichier Slack | Téléchargés lorsque cela est possible et exposés comme contexte de fichier        | Les fichiers binaires ne sont pas traités comme des entrées d’image       |
| Réponses dans un fil           | Fichiers du message initial | Les fichiers du message racine peuvent être chargés comme contexte lorsque la réponse ne contient aucun média direct | Les messages initiaux contenant uniquement des fichiers utilisent un espace réservé de pièce jointe |
| Messages multifichiers         | Plusieurs fichiers Slack | Chaque fichier est évalué indépendamment                                      | Le traitement Slack est limité à huit fichiers par message                |

### Pipeline entrant

Lorsqu’un message Slack contenant des pièces jointes arrive :

1. OpenClaw télécharge le fichier depuis l’URL privée de Slack à l’aide du jeton du bot.
2. Le fichier est enregistré dans le stockage de médias en cas de réussite.
3. Les chemins et les types de contenu des médias téléchargés sont ajoutés au contexte entrant.
4. Les extraits audio sont acheminés vers le pipeline de transcription partagé ; les parcours de modèle ou d’outil prenant en charge les images peuvent utiliser les pièces jointes d’image du même contexte.
5. Les autres fichiers restent disponibles sous forme de métadonnées de fichier ou de références multimédias pour les outils capables de les traiter.

### Héritage des pièces jointes du message racine d’un fil

Lorsqu’un message arrive dans un fil (avec un parent `thread_ts`) :

- Si la réponse elle-même ne contient aucun média direct et que le message racine inclus contient des fichiers, Slack peut charger les fichiers racines comme contexte du message initial du fil.
- Les fichiers racines ne sont chargés que lors de l’initialisation d’une session de fil nouvelle ou réinitialisée. Les réponses ultérieures contenant uniquement du texte réutilisent le contexte de session existant et ne joignent pas de nouveau les fichiers racines comme nouveaux médias.
- Les pièces jointes directes de la réponse ont priorité sur celles du message racine.
- Un message racine qui contient uniquement des fichiers et aucun texte est représenté par un espace réservé de pièce jointe afin que le mécanisme de secours puisse tout de même inclure ses fichiers.

### Gestion de plusieurs pièces jointes

Lorsqu’un seul message Slack contient plusieurs pièces jointes :

- Chaque pièce jointe est traitée indépendamment par le pipeline multimédia.
- Les références des médias téléchargés sont regroupées dans le contexte du message.
- L’ordre de traitement suit l’ordre des fichiers Slack dans la charge utile de l’événement.
- L’échec du téléchargement d’une pièce jointe ne bloque pas les autres.

### Limites de taille, de téléchargement et de modèle

- **Limite de taille** : 20 Mo par fichier par défaut. Configurable via `channels.slack.mediaMaxMb`.
- **Limite de transcription audio** : `tools.media.audio.maxBytes` s’applique également lorsque le fichier téléchargé est envoyé à un fournisseur de transcription ou à une CLI.
- **Échecs de téléchargement** : les fichiers que Slack ne peut pas fournir, les URL expirées, les fichiers inaccessibles ou trop volumineux, ainsi que les réponses HTML d’authentification/de connexion Slack, sont ignorés au lieu d’être signalés comme des formats non pris en charge.
- **Modèle de vision** : l’analyse d’image utilise le modèle de réponse actif lorsqu’il prend en charge la vision, ou le modèle d’image configuré dans `agents.defaults.imageModel`.

### Limites connues

| Scénario                                      | Comportement actuel                                                               | Solution de contournement                                                        |
| --------------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| URL de fichier Slack expirée                  | Fichier ignoré ; aucune erreur affichée                                           | Téléversez de nouveau le fichier dans Slack                                      |
| Transcription audio indisponible              | L’extrait reste joint, mais aucune transcription n’est produite                   | Configurez `tools.media.audio` ou installez une CLI locale de transcription prise en charge |
| Un extrait sans légende ne franchit pas le filtre de mention | Rejeté après une transcription spéculative privée ; transcription et téléchargement supprimés | Configurez un modèle de mention du nom prononcé, ajoutez une mention textuelle du bot ou utilisez un MP |
| Modèle de vision non configuré                | Les pièces jointes d’image sont stockées comme références multimédias, mais ne sont pas analysées comme images | Configurez `agents.defaults.imageModel` ou utilisez un modèle de réponse prenant en charge la vision |
| Images très volumineuses (> 20 Mo par défaut) | Ignorées en raison de la limite de taille                                         | Augmentez `channels.slack.mediaMaxMb` si Slack le permet                                 |
| Pièces jointes transférées/partagées          | Le texte et les médias d’image/fichier hébergés par Slack sont traités au mieux    | Partagez-les de nouveau directement dans le fil OpenClaw                         |
| Pièces jointes PDF                            | Stockées comme contexte de fichier/média, sans acheminement automatique vers la vision d’image | Utilisez `download-file` pour les métadonnées de fichier ou l’outil `pdf` pour analyser les PDF |

### Documentation associée

- [Pipeline de compréhension des médias](/fr/nodes/media-understanding)
- [Audio et notes vocales](/fr/nodes/audio)
- [Outil PDF](/fr/tools/pdf)

## Voir aussi

<CardGroup cols={2}>
  <Card title="Association" icon="link" href="/fr/channels/pairing">
    Associez un utilisateur Slack au Gateway.
  </Card>
  <Card title="Groupes" icon="users" href="/fr/channels/groups">
    Comportement des canaux et des MP de groupe.
  </Card>
  <Card title="Routage des canaux" icon="route" href="/fr/channels/channel-routing">
    Acheminez les messages entrants vers les agents.
  </Card>
  <Card title="Sécurité" icon="shield" href="/fr/gateway/security">
    Modèle de menace et durcissement.
  </Card>
  <Card title="Configuration" icon="sliders" href="/fr/gateway/configuration">
    Structure et ordre de priorité de la configuration.
  </Card>
  <Card title="Commandes slash" icon="terminal" href="/fr/tools/slash-commands">
    Catalogue et comportement des commandes.
  </Card>
</CardGroup>
