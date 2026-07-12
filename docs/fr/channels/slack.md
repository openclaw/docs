---
read_when:
    - Configuration de Slack ou débogage du mode socket, HTTP ou relais de Slack
summary: Configuration de Slack et comportement à l’exécution (mode Socket, URL de requête HTTP et mode relais)
title: Slack
x-i18n:
    generated_at: "2026-07-12T15:07:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c29d2dccefc54d3972fd8ff4edccfdc3779c030a8d51f29a750a0057d9f0998e
    source_path: channels/slack.md
    workflow: 16
---

La prise en charge de Slack couvre les messages privés et les canaux via les intégrations d’app Slack. Le transport par défaut est Socket Mode ; les URL de requête HTTP sont également prises en charge. Le mode relais est destiné aux déploiements gérés dans lesquels un routeur de confiance contrôle l’entrée Slack.

<CardGroup cols={3}>
  <Card title="Association" icon="link" href="/fr/channels/pairing">
    Les messages privés Slack utilisent par défaut le mode d’association.
  </Card>
  <Card title="Commandes slash" icon="terminal" href="/fr/tools/slash-commands">
    Comportement des commandes natives et catalogue des commandes.
  </Card>
  <Card title="Dépannage des canaux" icon="wrench" href="/fr/channels/troubleshooting">
    Diagnostics intercanaux et procédures de réparation.
  </Card>
</CardGroup>

## Choisir un transport

Socket Mode et les URL de requête HTTP offrent les mêmes fonctionnalités pour la messagerie, les commandes slash, App Home et l’interactivité. Choisissez en fonction de la topologie du déploiement, et non des fonctionnalités.

| Point à considérer           | Socket Mode (par défaut)                                                                                                                             | URL de requête HTTP                                                                                             |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| URL publique du Gateway      | Non requise                                                                                                                                          | Requise (DNS, TLS, proxy inverse ou tunnel)                                                                    |
| Réseau sortant               | Le WSS sortant vers `wss-primary.slack.com` doit être accessible                                                                                     | Aucun WS sortant ; HTTPS entrant uniquement                                                                    |
| Jetons requis                | Jeton de bot + App-Level Token avec `connections:write`                                                                                              | Jeton de bot + Signing Secret                                                                                   |
| Ordinateur de développement / derrière un pare-feu | Fonctionne tel quel                                                                                                                   | Nécessite un tunnel public (ngrok, Cloudflare Tunnel, Tailscale Funnel) ou un Gateway de préproduction          |
| Mise à l’échelle horizontale | Une session Socket Mode par app et par hôte ; plusieurs Gateway nécessitent des apps Slack distinctes                                               | Gestionnaire POST sans état ; plusieurs répliques du Gateway peuvent partager une app derrière un répartiteur de charge |
| Plusieurs comptes sur un Gateway | Pris en charge ; chaque compte ouvre son propre WS                                                                                              | Pris en charge ; chaque compte nécessite un `webhookPath` unique (par défaut `/slack/events`) afin d’éviter les collisions entre les inscriptions |
| Transport des commandes slash | Acheminées via la connexion WS ; `slash_commands[].url` est ignoré                                                                                  | Slack envoie des requêtes POST à `slash_commands[].url` ; le champ est requis pour distribuer la commande       |
| Signature des requêtes       | Non utilisée (l’authentification repose sur l’App-Level Token)                                                                                       | Slack signe chaque requête ; OpenClaw effectue la vérification avec `signingSecret`                             |
| Récupération après une interruption de connexion | La reconnexion automatique du SDK Slack est activée ; OpenClaw redémarre également les sessions Socket Mode défaillantes avec une temporisation exponentielle bornée. Le réglage du transport pour l’expiration des pong s’applique. | Aucune connexion persistante susceptible d’être interrompue ; les nouvelles tentatives sont effectuées par Slack pour chaque requête |

<Note>
  **Choisissez Socket Mode** pour les hôtes dotés d’un seul Gateway, les ordinateurs de développement et les réseaux sur site qui peuvent accéder à `*.slack.com` en sortie, mais ne peuvent pas accepter de connexions HTTPS entrantes.

**Choisissez les URL de requête HTTP** lorsque vous exécutez plusieurs répliques du Gateway derrière un répartiteur de charge, lorsque le WSS sortant est bloqué mais que le HTTPS entrant est autorisé, ou lorsque vous terminez déjà les Webhook Slack au niveau d’un proxy inverse.
</Note>

<Warning>
  Slack peut maintenir plusieurs connexions Socket Mode pour une même app et distribuer chaque charge utile à n’importe laquelle de ces connexions. Des Gateway OpenClaw distincts partageant une app Slack doivent donc disposer d’une configuration équivalente pour le routage et l’autorisation. Dans le cas contraire, utilisez une app Slack distincte par Gateway, une entrée relais unique ou des URL de requête HTTP derrière un répartiteur de charge. Consultez [Utilisation de Socket Mode](https://docs.slack.dev/apis/events-api/using-socket-mode#using-multiple-connections).
</Warning>

### Mode relais

Le mode relais sépare l’entrée Slack du Gateway OpenClaw. Un routeur de confiance contrôle l’unique connexion Slack Socket Mode, choisit un Gateway de destination et transfère un événement typé via un websocket authentifié. Le Gateway continue d’utiliser son propre jeton de bot pour les appels sortants à l’API Web Slack.

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

L’URL du relais doit utiliser `wss://`, sauf si elle cible localhost. Traitez le jeton de porteur et la table de routage du routeur comme faisant partie de la limite d’autorisation Slack : les événements routés entrent dans le gestionnaire de messages Slack normal en tant qu’activations autorisées. Une `slack_identity` fournie par le routeur dans la trame websocket `hello` peut définir le nom d’utilisateur et l’icône sortants par défaut ; une identité explicite fournie par l’appelant reste prioritaire. La connexion relais se reconnecte avec la même temporisation exponentielle bornée que Socket Mode et efface l’identité fournie par le routeur à chaque déconnexion.

### Installations à l’échelle d’une organisation Enterprise Grid

Un compte Slack peut recevoir des messages de tous les espaces de travail couverts par une
installation à l’échelle d’une organisation Enterprise Grid. Choisissez Socket Mode direct ou les
URL de requête HTTP ; le mode relais n’est pas pris en charge pour les comptes d’entreprise. Les deux
manifestes de moindre privilège ci-dessous activent uniquement le chemin d’événements V1 `message` et `app_mention`,
les réponses immédiates et les réactions d’état gérées par l’écouteur.

#### Socket Mode

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
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

Demandez à un Enterprise Grid Org Admin ou Org Owner d’approuver l’app, de l’installer au
niveau de l’organisation et de choisir les espaces de travail couverts par l’installation.
Vérifiez que l’app est disponible dans chaque espace de travail prévu avant de démarrer
OpenClaw. Générez un jeton au niveau de l’app avec `connections:write` pour Socket Mode,
puis copiez le jeton de bot depuis l’installation de l’organisation. Configurez le compte qui
utilise le jeton de bot installé pour l’organisation :

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

Utilisez le mode HTTP lorsque le Gateway dispose d’un point de terminaison HTTPS public et n’ouvre pas de
connexion Socket Mode. Remplacez l’URL d’exemple par l’URL publique
`webhookPath` du Gateway (par défaut `/slack/events`) :

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
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

Demandez à un Enterprise Grid Org Admin ou Org Owner d’approuver l’app, de l’installer au
niveau de l’organisation et de choisir les espaces de travail couverts par l’installation.
Après que Slack a vérifié la Request URL, copiez le jeton de bot de l’installation de l’organisation et
le **Basic Information -> App Credentials -> Signing Secret** de l’app. Configurez
le compte d’entreprise avec le même chemin de Request URL :

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

Au démarrage, OpenClaw vérifie `enterpriseOrgInstall` avec `auth.test` de Slack.
Un jeton installé pour l’organisation sans l’indicateur, ou un jeton d’espace de travail avec l’indicateur,
fait échouer le démarrage. Slack reste la source de vérité pour déterminer les espaces de travail ayant
accordé l’installation ; OpenClaw applique ensuite les politiques configurées relatives aux canaux, aux utilisateurs,
aux messages privés et aux mentions à chaque événement distribué. Enterprise V1 rejette tous les événements
`message` et `app_mention` créés par des bots avant leur distribution, quelle que soit la valeur de
`allowBots`, car les installations d’organisation ne fournissent pas d’identité de bot stable et qualifiée par
espace de travail pour empêcher les boucles.

La prise en charge des entreprises est volontairement limitée aux événements directs Socket Mode ou HTTP
`message` et `app_mention` ainsi qu’à leurs réponses immédiates. Le mode relais,
les commandes slash, les interactions, App Home, les écouteurs d’événements de réaction, les épingles, les
outils d’action Slack, les approbations natives Slack, les liaisons, la distribution mise en file d’attente ou planifiée
et les envois proactifs ne sont pas disponibles pour un compte d’entreprise. Les réactions sortantes
d’accusé de réception, de saisie et d’état sont prises en charge par le client Slack
géré par l’écouteur et nécessitent `reactions:write` ; les notifications de réaction
entrantes et les outils d’action de réaction restent indisponibles.

Les réponses immédiates réutilisent le comportement standard de distribution Slack pour les fragments,
les médias, les métadonnées, l’identité de secours, les aperçus de liens et les accusés de réception, mais uniquement tant que le
client validé géré par l’écouteur reste dans le tour d’événement actif. La
file d’attente d’envoi en mémoire et les enregistrements de participation aux fils de discussion sont partitionnés selon
l’espace de travail de cet événement ; le client lui-même n’est jamais sérialisé ni conservé.

Les clés de stratégie de canal et les entrées `dm.groupChannels` doivent utiliser des ID de canal Slack bruts et stables ou la
forme `channel:<id>`. OpenClaw normalise les deux formes en ID de canal brut pour la
correspondance à l’exécution ; les préfixes `slack:`, `group:` et `mpim:` empêchent le démarrage.
Les entrées de stratégie utilisateur doivent utiliser des ID utilisateur Slack stables ; les noms, identifiants textuels, noms d’affichage
et adresses e-mail empêchent le démarrage. Les ID doivent utiliser le préfixe et le corps canoniques en majuscules de Slack
(par exemple, `C0123456789` ou `U0123456789`) ; les variantes en minuscules et
les imitations courtes empêchent le démarrage. Les comptes Enterprise ne peuvent pas activer
`dangerouslyAllowNameMatching`. Les comptes Enterprise peuvent définir le paramètre global
`mentionPatterns.mode`, mais `mentionPatterns.allowIn` et
`mentionPatterns.denyIn` empêchent le démarrage, car les ID de canal Slack bruts ne sont pas
qualifiés par espace de travail et peuvent être réutilisés dans plusieurs espaces de travail. Les installations dans un espace de travail
conservent le comportement existant des motifs de mention délimités. Chaque espace de travail accepté
dispose d’une identité distincte pour le routage, la session, la transcription, la déduplication, l’historique et le cache,
même lorsque les ID Slack se chevauchent. Dans le flux `message`, les messages utilisateur ordinaires
et les événements `file_share` créés par des utilisateurs sont pris en charge ; les autres sous-types de message sont
rejetés avant l’autorisation ou le traitement des événements système.

Les messages privés Enterprise doivent être soit désactivés (`dm.enabled=false` ou
`dmPolicy="disabled"`), soit explicitement ouverts avec `dmPolicy="open"` et
une valeur `allowFrom` effective pour le compte contenant la valeur littérale `"*"`. Une liste d’autorisation vide
ou des ID propres à certains utilisateurs sans `"*"` empêchent le démarrage. L’association et
les listes d’autorisation de messages privés par utilisateur sont rejetées, car les ID utilisateur Slack ne sont pas
qualifiés par espace de travail dans ces magasins d’autorisation. La stratégie de canal et d’expéditeur
continue de s’appliquer aux messages des canaux.

## Installation

```bash
openclaw plugins install @openclaw/slack
```

`plugins install` enregistre et active le Plugin. Il ne fait rien tant que vous n’avez pas configuré l’application Slack et les paramètres de canal ci-dessous. Consultez [Plugins](/fr/tools/plugin) pour connaître les règles générales d’installation des Plugins.

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
          **Recommended** correspond à l’ensemble complet des fonctionnalités du Plugin Slack : App Home, commandes slash, fichiers, réactions, épingles, messages privés de groupe et lecture des émojis/groupes d’utilisateurs. Choisissez **Minimal** lorsque la stratégie de l’espace de travail limite les portées : il couvre les messages privés, l’historique des canaux/groupes, les mentions et les commandes slash, mais exclut les fichiers, les réactions, les épingles, les messages privés de groupe (`mpim:*`), `emoji:read` et `usergroups:read`. Consultez la [liste de contrôle du manifeste et des portées](#manifest-and-scope-checklist) pour connaître la justification de chaque portée et les options supplémentaires, telles que des commandes slash additionnelles.
        </Note>

        Une fois l’application créée par Slack :

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

        Solution de repli par variables d’environnement (compte par défaut uniquement) :

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

  <Tab title="URL des requêtes HTTP">
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
          **Recommandé** correspond à l’ensemble complet des fonctionnalités du Plugin Slack ; **Minimal** exclut les fichiers, les réactions, les épingles, les messages privés de groupe (`mpim:*`), `emoji:read` et `usergroups:read` pour les espaces de travail soumis à des restrictions. Consultez la [liste de contrôle du manifeste et des portées](#manifest-and-scope-checklist) pour connaître la justification de chaque portée.
        </Note>

        <Info>
          Les trois champs d’URL (`slash_commands[].url`, `event_subscriptions.request_url` et `interactivity.request_url` / `message_menu_options_url`) pointent tous vers le même point de terminaison OpenClaw. Le schéma de manifeste de Slack exige qu’ils soient nommés séparément, mais OpenClaw effectue le routage selon le type de charge utile ; un seul `webhookPath` (par défaut `/slack/events`) suffit donc. En mode HTTP, les commandes slash sans `slash_commands[].url` ne font silencieusement rien.
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

        Attribuez à chaque compte un `webhookPath` distinct (par défaut `/slack/events`) afin d’éviter les collisions entre les inscriptions.
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

OpenClaw définit par défaut à 15 secondes le délai d’attente des réponses pong du client SDK Slack en mode Socket. Ne remplacez les paramètres de transport que lorsqu’un réglage propre à l’espace de travail ou à l’hôte est nécessaire :

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

Utilisez cette configuration uniquement pour les espaces de travail en mode Socket qui consignent des expirations de délai liées aux réponses pong ou aux pings du serveur sur le WebSocket Slack, ou qui s’exécutent sur des hôtes connus pour subir une saturation de la boucle d’événements. `clientPingTimeout` correspond au délai d’attente d’une réponse pong après l’envoi d’un ping client par le SDK ; `serverPingTimeout` correspond au délai d’attente des pings du serveur Slack. Les messages et événements de l’application restent un état applicatif, et non des signaux de disponibilité du transport.

Remarques :

- `socketMode` est ignoré en mode HTTP Request URL.
- Les paramètres de base de `channels.slack.socketMode` s’appliquent à tous les comptes Slack, sauf s’ils sont remplacés. Les remplacements propres à un compte utilisent `channels.slack.accounts.<accountId>.socketMode` ; comme il s’agit du remplacement d’un objet, incluez chaque champ de réglage du mode Socket souhaité pour ce compte.
- Seul `clientPingTimeout` dispose d’une valeur par défaut OpenClaw (`15000`). `serverPingTimeout` et `pingPongLoggingEnabled` ne sont transmis au SDK Slack que lorsqu’ils sont configurés.
- Le délai progressif entre les redémarrages du mode Socket commence autour de 2 secondes et est plafonné à environ 30 secondes. Les échecs récupérables de démarrage, d’attente du démarrage et de déconnexion sont retentés jusqu’à l’arrêt du canal. Les erreurs permanentes de compte et d’identifiants, telles qu’une authentification non valide, des jetons révoqués ou des portées manquantes, échouent immédiatement au lieu d’être retentées indéfiniment.

## Liste de contrôle du manifeste et des portées

Le manifeste de base de l’application Slack est identique pour le mode Socket et les HTTP Request URLs. Seuls le bloc `settings` et l’`url` de la commande slash diffèrent.

Manifeste de base (mode Socket par défaut) :

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

Le manifeste par défaut active l’onglet **Home** de Slack App Home et s’abonne à `app_home_opened`. Lorsqu’un membre de l’espace de travail ouvre l’onglet Home, OpenClaw publie une vue d’accueil sécurisée par défaut avec `views.publish` ; aucune charge utile de conversation ni configuration privée n’est incluse. Lorsque le mode de commande slash unique est activé, l’indication de commande utilise `channels.slack.slashCommand.name` ; les installations utilisant des commandes natives ou aucune commande slash omettent cette indication. L’onglet **Messages** reste activé pour les messages privés Slack. Le manifeste active également les fils de discussion de l’assistant Slack avec `features.assistant_view`, `assistant:write`, `assistant_thread_started` et `assistant_thread_context_changed` ; les fils de discussion de l’assistant sont acheminés vers leurs propres sessions de fil OpenClaw et conservent le contexte de fil fourni par Slack à la disposition de l’agent.

<AccordionGroup>
  <Accordion title="Commandes slash natives facultatives">

    Plusieurs [commandes slash natives](#commands-and-slash-behavior) peuvent être utilisées à la place d’une seule commande configurée, avec quelques nuances :

    - Utilisez `/agentstatus` au lieu de `/status`, car la commande `/status` est réservée.
    - Une application Slack ne peut pas enregistrer plus de 25 commandes slash simultanément (limite de la plateforme Slack).

    Remplacez votre section `features.slash_commands` existante par un sous-ensemble des [commandes disponibles](/fr/tools/slash-commands#command-list) :

    <Tabs>
      <Tab title="Mode Socket (par défaut)">

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
      "description": "Afficher l’état de l’environnement d’exécution, notamment l’utilisation/le quota du fournisseur lorsque ces informations sont disponibles"
    },
    {
      "command": "/tasks",
      "description": "Répertorier les tâches d’arrière-plan actives/récentes de la session actuelle"
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
  <Accordion title="Portées de création facultatives (opérations d’écriture)">
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
- Le mode HTTP nécessite `botToken` + `signingSecret`.
- Le mode relais nécessite `botToken` ainsi que `relay.url`, `relay.authToken` et `relay.gatewayId` ; il n’utilise ni jeton d’application ni secret de signature.
- `botToken`, `appToken`, `signingSecret`, `relay.authToken` et `userToken` acceptent des chaînes
  en texte brut ou des objets SecretRef.
- Les jetons de configuration remplacent les valeurs de repli des variables d’environnement.
- Les valeurs de repli des variables d’environnement `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN` et `SLACK_USER_TOKEN` s’appliquent chacune uniquement au compte par défaut.
- `userToken` adopte par défaut un comportement en lecture seule (`userTokenReadOnly: true`).

Comportement de l’instantané d’état :

- L’inspection du compte Slack suit les champs `*Source` et `*Status`
  de chaque identifiant (`botToken`, `appToken`, `signingSecret`, `userToken`).
- L’état est `available`, `configured_unavailable` ou `missing`.
- `configured_unavailable` signifie que le compte est configuré au moyen de SecretRef
  ou d’une autre source de secrets non intégrée, mais que le chemin actuel de la commande ou de l’environnement d’exécution
  n’a pas pu résoudre la valeur réelle.
- En mode HTTP, `signingSecretStatus` est inclus ; en mode Socket, la
  paire requise est `botTokenStatus` + `appTokenStatus`.

<Tip>
Pour les actions et les lectures d’annuaire, le jeton utilisateur peut être privilégié lorsqu’il est configuré. Pour les écritures, le jeton de bot reste privilégié ; les écritures avec le jeton utilisateur ne sont autorisées que lorsque `userTokenReadOnly: false` et que le jeton de bot est indisponible.
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

Les actions de message Slack actuelles comprennent `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` et `emoji-list`. `download-file` accepte les identifiants de fichiers Slack affichés dans les espaces réservés des fichiers entrants et renvoie des aperçus pour les images ou les métadonnées des fichiers locaux pour les autres types de fichiers.

## Contrôle d’accès et routage

<Tabs>
  <Tab title="Politique des messages privés">
    `channels.slack.dmPolicy` contrôle l’accès aux messages privés. `channels.slack.allowFrom` est la liste d’autorisation canonique des messages privés.

    - `pairing` (valeur par défaut)
    - `allowlist`
    - `open` (nécessite que `channels.slack.allowFrom` contienne `"*"`)
    - `disabled`

    Indicateurs des messages privés :

    - `dm.enabled` (true par défaut)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (obsolète)
    - `dm.groupEnabled` (false par défaut pour les messages privés de groupe)
    - `dm.groupChannels` (liste d’autorisation MPIM facultative)

    Priorité pour plusieurs comptes :

    - `channels.slack.accounts.default.allowFrom` s’applique uniquement au compte `default`.
    - Les comptes nommés héritent de `channels.slack.allowFrom` lorsque leur propre `allowFrom` n’est pas défini.
    - Les comptes nommés n’héritent pas de `channels.slack.accounts.default.allowFrom`.

    Les anciens paramètres `channels.slack.dm.policy` et `channels.slack.dm.allowFrom` sont toujours lus à des fins de compatibilité. `openclaw doctor --fix` les migre vers `dmPolicy` et `allowFrom` lorsqu’il peut le faire sans modifier les accès.

    L’association dans les messages privés utilise `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Politique des canaux">
    `channels.slack.groupPolicy` contrôle la gestion des canaux :

    - `open`
    - `allowlist`
    - `disabled`

    La liste d’autorisation des canaux se trouve sous `channels.slack.channels` et **doit utiliser des ID de canal Slack stables** (par exemple `C12345678`) comme clés de configuration.

    Remarque sur l’exécution : si `channels.slack` est entièrement absent (configuration uniquement par variables d’environnement), l’exécution revient à `groupPolicy="allowlist"` et consigne un avertissement (même si `channels.defaults.groupPolicy` est défini).

    Résolution des noms et ID :

    - les entrées des listes d’autorisation des canaux et des messages privés sont résolues au démarrage lorsque l’accès par jeton le permet
    - les entrées de noms de canaux non résolues sont conservées telles qu’elles sont configurées, mais ignorées par défaut pour le routage
    - l’autorisation des messages entrants et le routage des canaux utilisent les ID en priorité par défaut ; la correspondance directe avec les noms d’utilisateur ou les slugs nécessite `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Les clés basées sur le nom (`#channel-name` ou `channel-name`) ne correspondent **pas** avec `groupPolicy: "allowlist"`. La recherche de canal utilise les ID en priorité par défaut ; une clé basée sur le nom ne sera donc jamais routée correctement et tous les messages de ce canal seront bloqués silencieusement. Ce comportement diffère de `groupPolicy: "open"`, où la clé du canal n’est pas requise pour le routage et où une clé basée sur le nom semble fonctionner.

    Utilisez toujours l’ID du canal Slack comme clé. Pour le trouver : faites un clic droit sur le canal dans Slack → **Copy link** — l’ID (`C...`) apparaît à la fin de l’URL.

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

    Incorrect (bloqué silencieusement avec `groupPolicy: "allowlist"`) :

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
    - mention d’un groupe d’utilisateurs Slack (`<!subteam^S...>`) lorsque l’utilisateur du bot est membre de ce groupe d’utilisateurs ; nécessite `usergroups:read`
    - motifs d’expressions régulières de mention (`agents.list[].groupChat.mentionPatterns`, avec repli sur `messages.groupChat.mentionPatterns`)
    - comportement implicite des fils de discussion répondant au bot (désactivé lorsque `thread.requireExplicitMention` vaut `true`)

    Contrôles par canal (`channels.slack.channels.<id>` ; noms uniquement via la résolution au démarrage ou `dangerouslyAllowNameMatching`) :

    - `requireMention`
    - `ignoreOtherMentions`
    - `replyToMode` (`off|first|all|batched` ; remplace le mode de réponse du compte ou du type de discussion pour ce canal)
    - `users` (liste d’autorisation)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - format des clés de `toolsBySender` : `channel:`, `id:`, `e164:`, `username:`, `name:`, ou caractère générique `"*"`
      (les anciennes clés sans préfixe correspondent toujours uniquement à `id:`)

    `ignoreOtherMentions` (`false` par défaut) ignore les messages de canal qui mentionnent un autre utilisateur ou groupe d’utilisateurs, mais pas ce bot. Les messages privés et les messages privés de groupe (MPIM) ne sont pas affectés. Le filtre nécessite un ID d’utilisateur de bot résolu à partir de `auth.test` ; si cette identité n’est pas disponible (par exemple, une identité reposant uniquement sur un jeton utilisateur), le contrôle échoue en mode ouvert et les messages sont transmis sans modification.

    `allowBots` applique une politique prudente pour les canaux et les canaux privés : les messages de salon rédigés par des bots ne sont acceptés que lorsque le bot expéditeur figure explicitement dans la liste d’autorisation `users` de ce salon, ou lorsqu’au moins un ID de propriétaire Slack explicite provenant de `channels.slack.allowFrom` est actuellement membre du salon. Les caractères génériques et les entrées de propriétaire basées sur le nom d’affichage ne satisfont pas à l’exigence de présence d’un propriétaire. La présence d’un propriétaire utilise `conversations.members` de Slack ; assurez-vous que l’application dispose de la portée de lecture correspondant au type de salon (`channels:read` pour les canaux publics, `groups:read` pour les canaux privés). Si la recherche des membres échoue, OpenClaw ignore le message de salon rédigé par un bot.

    Les messages Slack acceptés et rédigés par des bots utilisent la [protection partagée contre les boucles de bots](/fr/channels/bot-loop-protection). Configurez `channels.defaults.botLoopProtection` pour le budget par défaut, puis remplacez-le par `channels.slack.botLoopProtection` ou `channels.slack.channels.<id>.botLoopProtection` lorsqu’un espace de travail ou un canal nécessite une limite différente.

  </Tab>
</Tabs>

## Fils de discussion, sessions et balises de réponse

- Les messages privés sont acheminés comme `direct` ; les canaux comme `channel` ; les conversations privées à plusieurs comme `group`.
- Les liaisons de routage Slack acceptent les identifiants bruts des correspondants ainsi que les formats de cible Slack tels que `channel:C12345678`, `user:U12345678` et `<@U12345678>`.
- Avec la valeur par défaut `session.dmScope=main`, les messages privés Slack sont regroupés dans la session principale de l’agent.
- Sessions de canal : `agent:<agentId>:slack:channel:<channelId>`.
- Les messages ordinaires de premier niveau dans un canal restent dans la session propre au canal, même lorsque `replyToMode` n’est pas défini sur `off`.
- Les réponses dans les fils Slack utilisent le `thread_ts` Slack parent comme suffixe de session (`:thread:<threadTs>`), même lorsque les réponses dans les fils sont désactivées pour les messages sortants avec `replyToMode="off"`.
- OpenClaw initialise une racine de canal de premier niveau admissible dans `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>` lorsqu’il est prévu que cette racine lance un fil Slack visible, afin que la racine et les réponses ultérieures du fil partagent une même session OpenClaw. Cela s’applique aux événements `app_mention`, aux correspondances explicites avec le bot ou avec les motifs de mention configurés, ainsi qu’aux canaux avec `requireMention: false` et un `replyToMode` différent de `off`.
- La valeur par défaut de `channels.slack.thread.historyScope` est `thread` ; celle de `thread.inheritParent` est `false`.
- `channels.slack.thread.initialHistoryLimit` détermine le nombre de messages existants du fil qui sont récupérés au démarrage d’une nouvelle session de fil (valeur par défaut : `20` ; définissez `0` pour désactiver cette récupération).
- `channels.slack.thread.requireExplicitMention` (valeur par défaut : `false`) : avec `true`, supprime les mentions implicites dans les fils afin que le bot ne réponde qu’aux mentions explicites `@bot` à l’intérieur des fils, même s’il a déjà participé au fil. Sans cette option, les réponses dans un fil auquel le bot a participé contournent le contrôle `requireMention`.

Contrôles des réponses dans les fils :

- `channels.slack.channels.<id>.replyToMode` : remplacement par canal pour les messages de canal ou de canal privé Slack
- `channels.slack.replyToMode` : `off|first|all|batched` (valeur par défaut : `off`)
- `channels.slack.replyToModeByChatType` : par `direct|group|channel`
- solution de repli héritée pour les conversations directes : `channels.slack.dm.replyToMode`

Les balises de réponse manuelles sont prises en charge :

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Pour les réponses explicites dans un fil Slack envoyées par l’outil `message`, définissez `replyBroadcast: true` avec `action: "send"` et `threadId` ou `replyTo` afin de demander à Slack de diffuser également la réponse du fil dans le canal parent. Cela correspond à l’indicateur `reply_broadcast` de `chat.postMessage` dans Slack et n’est pris en charge que pour les envois de texte ou de Block Kit, pas pour les téléversements de médias.

Lorsqu’un appel à l’outil `message` s’exécute dans un fil Slack et cible le même canal, OpenClaw hérite normalement du fil Slack actuel selon le `replyToMode` effectif du compte, du type de conversation ou du canal. Les réponses automatiques et les appels `send` ou `upload-file` vers le même canal utilisent le même remplacement par canal. Définissez `topLevel: true` avec `action: "send"` ou `action: "upload-file"` pour forcer la création d’un nouveau message dans le canal parent. `threadId: null` est également accepté pour désactiver l’utilisation du fil et publier au premier niveau.

<Note>
`replyToMode="off"` désactive les réponses Slack sortantes dans les fils, y compris les balises explicites `[[reply_to_*]]`. Il ne fusionne pas les sessions entrantes des fils Slack : les messages déjà publiés dans un fil Slack sont toujours acheminés vers la session `:thread:<threadTs>`. Cela diffère de Telegram, où les balises explicites sont toujours respectées en mode `"off"`. Les fils Slack masquent les messages dans le canal, tandis que les réponses Telegram restent visibles dans le flux.
</Note>

## Réactions d’accusé de réception

`ackReaction` envoie un emoji d’accusé de réception pendant qu’OpenClaw traite un message entrant. `ackReactionScope` détermine _quand_ cet emoji est réellement envoyé.

Par défaut, l’accusé de réception reste statique tandis que l’état natif du fil d’assistant de Slack affiche la progression avec des messages de chargement successifs. Définissez `messages.statusReactions.enabled: true` pour activer le cycle de vie des réactions en attente/réflexion/outil/terminé/erreur.

### Emoji (`ackReaction`)

Ordre de résolution :

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- solution de repli sur l’emoji d’identité de l’agent (`agents.list[].identity.emoji`, sinon `"eyes"` / 👀)

Remarques :

- Slack attend des codes courts (par exemple `"eyes"`).
- Utilisez `""` pour désactiver la réaction pour le compte Slack ou globalement.

### Portée (`messages.ackReactionScope`)

Le fournisseur Slack lit la portée depuis `messages.ackReactionScope` (valeur par défaut : `"group-mentions"`). Il n’existe actuellement aucun remplacement au niveau d’un compte ou d’un canal Slack ; la valeur est globale au Gateway.

Valeurs :

- `"all"` : réagir dans les messages privés et les groupes, y compris aux événements ambiants des salons.
- `"direct"` : réagir uniquement dans les messages privés.
- `"group-all"` : réagir à chaque message de groupe, à l’exception des événements ambiants des salons (aucun message privé).
- `"group-mentions"` (valeur par défaut) : réagir dans les groupes, mais uniquement lorsque le bot est mentionné (ou dans les éléments de groupe pouvant être mentionnés qui ont activé cette option). **Les messages privés sont exclus.**
- `"off"` / `"none"` : ne jamais réagir.

<Note>
La portée par défaut (`"group-mentions"`) ne déclenche pas de réaction d’accusé de réception dans les messages directs ni lors des événements ambiants des salons. Pour voir la valeur `ackReaction` configurée (par exemple `"eyes"`) sur les messages privés Slack entrants et les événements de salons silencieux, définissez `messages.ackReactionScope` sur `"all"`. `messages.ackReactionScope` est lu au démarrage du fournisseur Slack ; un redémarrage du Gateway est donc nécessaire pour appliquer la modification.
</Note>

```json5
{
  messages: {
    ackReaction: "eyes",
    ackReactionScope: "all", // réagir dans les messages privés et les groupes
  },
}
```

## Diffusion progressive du texte

`channels.slack.streaming` contrôle le comportement de l’aperçu en direct :

- `off` : désactiver la diffusion progressive de l’aperçu en direct.
- `partial` (valeur par défaut) : remplacer le texte de l’aperçu par la dernière sortie partielle.
- `block` : ajouter des mises à jour d’aperçu par fragments.
- `progress` : afficher un texte d’état de progression pendant la génération, puis envoyer le texte final.
- `streaming.preview.toolProgress` : lorsque l’aperçu du brouillon est actif, acheminer les mises à jour des outils et de progression dans le même message d’aperçu modifié (valeur par défaut : `true`). Définissez `false` pour conserver des messages distincts pour les outils et la progression.
- `streaming.preview.commandText` / `streaming.progress.commandText` : définir sur `status` pour conserver des lignes compactes de progression des outils tout en masquant le texte brut des commandes ou de leur exécution (valeur par défaut : `raw`).

Masquer le texte brut des commandes ou de leur exécution tout en conservant des lignes de progression compactes :

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

`channels.slack.streaming.nativeTransport` contrôle la diffusion progressive native du texte de Slack lorsque `channels.slack.streaming.mode` est défini sur `partial` (valeur par défaut : `true`).

Les cartes de tâches de progression natives de Slack sont facultatives en mode de progression. Définissez `channels.slack.streaming.progress.nativeTaskCards` sur `true` avec `channels.slack.streaming.mode="progress"` pour envoyer une carte native Slack de plan ou de tâche pendant l’exécution du travail, puis mettre à jour la même carte de tâche à la fin. Sans cet indicateur, le mode de progression conserve le comportement d’aperçu de brouillon portable.

- Un fil de réponse doit être disponible pour que la diffusion progressive native du texte et l’état du fil d’assistant Slack apparaissent. La sélection du fil continue de suivre `replyToMode`.
- Les canaux, les conversations de groupe et les racines de messages privés de premier niveau peuvent continuer à utiliser l’aperçu de brouillon normal lorsque la diffusion progressive native n’est pas disponible ou qu’aucun fil de réponse n’existe.
- Les messages privés Slack de premier niveau restent en dehors des fils par défaut ; ils n’affichent donc pas l’aperçu natif de diffusion progressive ou d’état propre aux fils de Slack. OpenClaw publie et modifie à la place un aperçu de brouillon dans le message privé.
- Les médias et les charges utiles autres que textuelles utilisent la livraison normale comme solution de repli.
- Les résultats finaux contenant des médias ou des erreurs annulent les modifications d’aperçu en attente ; les résultats finaux de texte ou de blocs admissibles ne sont finalisés que lorsqu’ils peuvent modifier l’aperçu sur place.
- Si la diffusion progressive échoue en cours de réponse, OpenClaw utilise la livraison normale comme solution de repli pour les charges utiles restantes.

Utiliser l’aperçu de brouillon plutôt que la diffusion progressive native du texte de Slack :

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
- Les clés de premier niveau `channels.slack.chunkMode` et `channels.slack.nativeStreaming` sont des alias hérités de `channels.slack.streaming.chunkMode` et `channels.slack.streaming.nativeTransport`.
- Les alias hérités ne sont pas lus lors de l’exécution ; exécutez `openclaw doctor --fix` pour réécrire la configuration persistante de diffusion progressive Slack avec les clés canoniques.

## Réaction de saisie comme solution de repli

`typingReaction` ajoute une réaction temporaire au message Slack entrant pendant qu’OpenClaw traite une réponse, puis la supprime à la fin de l’exécution. Cela est particulièrement utile en dehors des réponses dans les fils, qui utilisent par défaut un indicateur d’état « saisie en cours... ».

Ordre de résolution :

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Remarques :

- Slack attend des codes courts (par exemple `"hourglass_flowing_sand"`).
- La réaction est appliquée au mieux et son nettoyage est tenté automatiquement une fois le traitement de la réponse ou de l’échec terminé.

## Entrée vocale

Pour parler à OpenClaw dans Slack actuellement, envoyez un clip audio Slack à l’application OpenClaw. Le microphone de dictée de Slackbot est une fonctionnalité distincte appartenant à Slack, et non une API d’application.

- La **[dictée vocale de Slackbot](https://slack.com/help/articles/202026038-How-to-use-Slackbot)** se trouve dans la conversation Slackbot privée de l’utilisateur. Slack transforme l’enregistrement en requête Slackbot, mais n’émet aucun fichier audio, événement de dictée, requête ou marqueur de source d’entrée vers des applications Slack tierces par l’intermédiaire de l’API Events. Le Plugin Slack d’OpenClaw ne peut ni l’activer ni la recevoir.
- Les **[clips audio Slack](https://slack.com/help/articles/4406235165587-Record-audio-and-video-clips-in-Slack)** sont des fichiers stockés par Slack qui peuvent être publiés dans un message privé, un canal ou un fil OpenClaw. OpenClaw télécharge un clip accessible avec le jeton du bot, normalise les métadonnées MIME du clip fournies par Slack et le transmet au [pipeline partagé de transcription audio](/fr/nodes/audio). Le manifeste d’application recommandé inclut la portée `files:read` requise.

Les clips audio et la dictée Slackbot ont des implications différentes en matière de confidentialité : les clips suivent la politique de conservation des fichiers de Slack et OpenClaw les télécharge pour les transcrire, tandis que Slack indique que l’audio de dictée n’est pas stocké.

Dans un canal avec `requireMention: true`, un clip audio sans légende peut satisfaire le contrôle en prononçant un motif de mention configuré (`agents.list[].groupChat.mentionPatterns`, avec repli sur `messages.groupChat.mentionPatterns`). OpenClaw autorise l’expéditeur avant de télécharger ou de transcrire le clip, puis ne l’admet que si la transcription correspond. Une transcription spéculative ayant échoué ou ne correspondant pas est supprimée avec le clip téléchargé ; elle n’est pas conservée dans l’historique du canal. L’identité Slack native `@bot` ne peut pas être déduite de la parole ; configurez donc un motif de nom prononcé ou incluez une mention saisie. Si la répétition de la transcription est activée, elle n’est envoyée qu’après l’admission.

## Médias, segmentation et livraison

<AccordionGroup>
  <Accordion title="Pièces jointes entrantes">
    Les pièces jointes Slack sont téléchargées depuis des URL privées hébergées par Slack (flux de requêtes authentifiées par jeton), puis écrites dans le stockage des médias lorsque la récupération réussit et que les limites de taille le permettent. Les espaces réservés aux fichiers incluent le `fileId` Slack afin que les agents puissent récupérer le fichier d’origine avec `download-file`.

    Les téléchargements utilisent des délais d’expiration d’inactivité et totaux bornés. Si la récupération d’un fichier Slack se bloque ou échoue, OpenClaw poursuit le traitement du message et utilise l’espace réservé au fichier comme solution de repli.

    La limite de taille entrante à l’exécution est de `20MB` par défaut, sauf si elle est remplacée par `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Texte et fichiers sortants">
    - les segments de texte utilisent `channels.slack.textChunkLimit` (valeur par défaut : `8000`, plafonnée à la propre limite de longueur des messages de Slack)
    - `channels.slack.streaming.chunkMode="newline"` active un découpage donnant la priorité aux paragraphes
    - les envois de fichiers utilisent les API de téléversement de Slack et peuvent inclure des réponses dans des fils de discussion (`thread_ts`)
    - pour les longues légendes de fichiers, le premier segment de texte compatible avec Slack est utilisé comme commentaire du téléversement, puis les segments restants sont envoyés sous forme de messages de suivi
    - la limite des médias sortants suit `channels.slack.mediaMaxMb` lorsqu’elle est configurée ; sinon, les envois du canal utilisent les valeurs par défaut selon le type MIME définies par le pipeline multimédia

  </Accordion>

  <Accordion title="Cibles de livraison">
    Cibles explicites recommandées :

    - `user:<id>` pour les messages privés
    - `channel:<id>` pour les canaux

    Les messages privés Slack contenant uniquement du texte ou des blocs peuvent être publiés directement à partir des identifiants utilisateur ; les téléversements de fichiers et les envois dans des fils de discussion ouvrent d’abord le message privé au moyen des API de conversation de Slack, car ces chemins nécessitent un identifiant de conversation concret.

  </Accordion>
</AccordionGroup>

## Commandes et comportement des commandes slash

Les commandes slash apparaissent dans Slack sous la forme d’une seule commande configurée ou de plusieurs commandes natives. Configurez `channels.slack.slashCommand` pour modifier les valeurs par défaut des commandes :

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Les commandes natives nécessitent des [paramètres de manifeste supplémentaires](#additional-manifest-settings) dans votre application Slack et sont plutôt activées avec `channels.slack.commands.native: true` ou `commands.native: true` dans les configurations globales.

- Le mode automatique des commandes natives est **désactivé** pour Slack ; `commands.native: "auto"` n’active donc pas les commandes natives de Slack.

```txt
/help
```

Les menus d’arguments natifs sont rendus sous l’une des formes suivantes, par ordre de priorité :

- 3 à 5 options suffisamment courtes : un menu de débordement (« ... »)
- plus de 100 options, avec filtrage asynchrone disponible : sélection externe
- 1 à 2 options, ou toute option dont la valeur encodée est trop longue pour une sélection : blocs de boutons
- sinon (6 à 100 options, ou plus de 100 sans filtrage asynchrone) : menu de sélection statique, découpé par groupes de 100 options par menu

```txt
/think
```

Les sessions slash utilisent des clés isolées telles que `agent:<agentId>:slack:slash:<userId>` et acheminent toujours l’exécution des commandes vers la session de la conversation cible à l’aide de `CommandTargetSessionKey`.

## Graphiques natifs

Le bloc Block Kit public [`data_visualization`](https://docs.slack.dev/reference/block-kit/blocks/data-visualization-block/)
de Slack affiche des graphiques linéaires, à barres, en aires et en secteurs dans les messages. OpenClaw associe le bloc
`chart` de `presentation` portable à cette structure native ; aucune portée OAuth supplémentaire,
aucun téléversement de fichier, aucun moteur de rendu d’image ni aucune configuration Slack ne sont requis au-delà de
l’accès habituel aux messages `chat:write`.

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
- lignes/barres/aires : 1 à 12 séries aux noms uniques et 1 à 20 catégories partagées
- libellés des segments, catégories et séries : 20 caractères
- chaque série doit contenir une valeur finie pour chaque catégorie ; les valeurs
  autres que celles des graphiques en secteurs peuvent être négatives

Chaque graphique natif comporte également une représentation textuelle de premier niveau pour les lecteurs
d’écran, les notifications, la mise en miroir des sessions et les clients qui ne peuvent pas afficher le
bloc. Les envois de présentation standard vers d’autres canaux OpenClaw reçoivent ces mêmes
données déterministes du graphique sous forme de texte, sauf s’ils déclarent prendre en charge les graphiques natifs. Si
Slack rejette le graphique avec `invalid_blocks` pendant un déploiement progressif, OpenClaw
supprime les blocs de données natifs rejetés, conserve les contrôles voisins et envoie
la représentation complète du graphique sous forme de texte visible.

Slack accepte actuellement jusqu’à deux blocs `data_visualization` par message. Lorsqu’une
présentation contient plus de deux graphiques valides, OpenClaw conserve leur ordre
et poursuit le rendu natif dans des messages de suivi, avec au maximum deux
graphiques dans chaque message.

Le [lancement pour les développeurs](https://docs.slack.dev/changelog/2026/06/16/block-kit-data-visualization-block/)
de Slack présente le bloc comme une fonctionnalité Block Kit destinée aux applications et n’indique aucune restriction
liée à une offre payante. Les conditions d’éligibilité Business+/Enterprise s’appliquent à
la génération automatique de graphiques par IA de Slackbot, qui est distincte de l’envoi par une application
d’un graphique Block Kit déjà structuré. Les graphiques sont des blocs réservés aux messages, et non au contenu d’App
Home, des fenêtres modales ou de Canvas.

## Tableaux natifs

Le bloc Block Kit [`data_table`](https://docs.slack.dev/reference/block-kit/blocks/data-table-block/) actuel de Slack
affiche des lignes et des colonnes structurées dans les messages. OpenClaw associe un bloc
`table` de `presentation` portable explicite à `data_table` ; il n’utilise pas l’ancien
[bloc `table`](https://docs.slack.dev/reference/block-kit/blocks/table-block/) de Slack.
Aucune portée OAuth ni configuration Slack supplémentaire n’est requise au-delà de l’accès
normal aux messages `chat:write`.

```json
{
  "blocks": [
    {
      "type": "table",
      "caption": "Pipeline ouvert",
      "headers": ["Compte", "Étape", "ARR"],
      "rows": [
        ["Acme", "Gagné", 125000],
        ["Globex", "Examen", 82000]
      ],
      "rowHeaderColumnIndex": 0
    }
  ]
}
```

OpenClaw associe les cellules d’en-tête et de chaîne aux cellules `raw_text` de Slack. Les cellules numériques
sont associées à `raw_number`, la valeur numérique finie étant préservée pour le tri
et le filtrage natifs. `rowHeaderColumnIndex`, lorsqu’il est présent, désigne cette
colonne indexée à partir de zéro comme en-têtes de ligne Slack.

Les limites publiées par Slack pour `data_table` sont appliquées avant le rendu natif :

- 1 à 20 colonnes
- 1 à 100 lignes de données, plus la ligne d’en-tête
- le même nombre de cellules dans chaque ligne
- au maximum 10 000 caractères cumulés dans toutes les cellules de tableau d’un même message

Plusieurs blocs de tableau valides peuvent être rendus nativement tant que le message reste
dans la limite cumulée de caractères. Un tableau qui ne peut pas être rendu dans
l’enveloppe native devient un texte complet et déterministe au lieu de perdre des lignes ou
des cellules. Si ce texte dépasse la taille d’un message Slack, les envois et les réponses aux commandes slash utilisent
des segments de texte ordonnés. Les modifications de tableau échouent avec une erreur de taille explicite au lieu de
tronquer silencieusement les lignes d’un message existant.

Chaque tableau natif produit à partir d’une présentation portable comporte également une représentation
textuelle de premier niveau pour les lecteurs d’écran, les notifications, la mise en miroir des sessions et
les clients qui ne peuvent pas afficher le bloc. Les valeurs brutes des graphiques et des tableaux restent littérales
dans la solution de repli, afin que les données de cellule telles que `<@U123>` ne deviennent pas une mention Slack.
Si Slack rejette les blocs natifs de graphique ou de tableau avec `invalid_blocks`, OpenClaw
supprime tous les blocs de données natifs en une seule étape de récupération limitée, conserve les
blocs frères valides tels que les boutons et les sélecteurs, puis envoie le texte visible complet des graphiques
et des tableaux avec la mise en forme Slack désactivée. La remise des commandes slash
suit le budget de cinq appels `response_url` de Slack sur l’ensemble de la commande. Avant chaque
lot de réponses, elle sélectionne un plan complet compatible avec les appels restants ou échoue
avant de publier ce lot.

Seuls les blocs de tableau `presentation` explicites sont promus en tableaux natifs.
Les tableaux Markdown à barres verticales restent du texte tel qu’il a été rédigé ; OpenClaw ne déduit pas la structure
du tableau ni les types de cellules. Les producteurs Slack natifs de confiance existants peuvent continuer
à transmettre des blocs bruts via `channelData.slack.blocks` ; OpenClaw dérive un texte de repli
à partir des cellules `data_table` brutes valides, tandis que les blocs personnalisés mal formés peuvent
se réduire à leur légende ou à la solution de repli générale de Block Kit. Les sorties portables de l’agent, de la CLI
et des plugins doivent utiliser `presentation`.

## Réponses interactives

Slack peut afficher des contrôles de réponse interactifs créés par l’agent, mais cette fonctionnalité est désactivée par défaut.
Pour les nouvelles sorties d’agent, de CLI et de plugin, privilégiez les boutons ou les blocs de sélection
`presentation` partagés. Ils utilisent le même chemin d’interaction Slack
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

Lorsqu’elle est activée, les agents peuvent encore émettre des directives de réponse obsolètes propres à Slack :

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Ces directives sont compilées en Block Kit Slack et acheminent les clics ou les sélections
par le chemin d’événement d’interaction Slack existant. Conservez-les pour les anciennes
invites et les mécanismes d’échappement propres à Slack ; utilisez la présentation partagée pour les nouveaux
contrôles portables.

Les API du compilateur de directives sont également obsolètes pour le nouveau code producteur :

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

Utilisez les charges utiles `presentation` et `buildSlackPresentationBlocks(...)` pour les nouveaux
contrôles rendus dans Slack.

Remarques :

- Il s’agit d’une ancienne interface utilisateur propre à Slack. Les autres canaux ne traduisent pas les directives Block
  Kit de Slack dans leurs propres systèmes de boutons.
- Les valeurs de rappel interactif sont des jetons opaques générés par OpenClaw, et non des valeurs brutes créées par l’agent.
- Si les blocs interactifs générés dépassent les limites de Block Kit Slack, OpenClaw revient à la réponse textuelle d’origine au lieu d’envoyer une charge utile de blocs non valide.

### Soumissions de fenêtres modales gérées par les plugins

Les plugins Slack qui enregistrent un gestionnaire interactif peuvent également recevoir les événements de cycle de vie
`view_submission` et `view_closed` des fenêtres modales avant qu’OpenClaw ne compacte
la charge utile pour l’événement système visible par l’agent. Utilisez l’un de ces modèles de routage
lors de l’ouverture d’une fenêtre modale Slack :

- Définissez `callback_id` sur `openclaw:<namespace>:<payload>`.
- Ou conservez un `callback_id` existant et placez `pluginInteractiveData:
"<namespace>:<payload>"` dans le `private_metadata` de la fenêtre modale.

Le gestionnaire reçoit `ctx.interaction.kind` sous la forme `view_submission` ou
`view_closed`, les `inputs` normalisées et l’objet `stateValues` brut complet provenant de
Slack. Le routage uniquement par identifiant de rappel suffit à appeler le gestionnaire du plugin ; incluez
les champs existants de routage utilisateur/session du `private_metadata` de la fenêtre modale lorsque celle-ci
doit également produire un événement système visible par l’agent. L’agent reçoit un
événement système compact et expurgé `Slack interaction: ...`. Si le gestionnaire renvoie
`systemEvent.summary`, `systemEvent.reference` ou `systemEvent.data`, ces
champs sont inclus dans cet événement compact afin que l’agent puisse référencer
le stockage géré par le plugin sans voir la charge utile complète du formulaire.

## Approbations natives dans Slack

Slack peut servir de client d’approbation natif avec des boutons et des interactions, au lieu de revenir à l’interface Web ou au terminal.

- Les approbations d’exécution et de plugin peuvent s’afficher sous forme d’invites Block Kit natives de Slack.
- `channels.slack.execApprovals.*` reste la configuration d’activation du client natif d’approbation d’exécution et de routage vers les messages privés ou les canaux.
- Les messages privés d’approbation d’exécution utilisent `channels.slack.execApprovals.approvers` ou `commands.ownerAllowFrom`.
- Les approbations de plugin utilisent des boutons natifs de Slack lorsque Slack est activé comme client d’approbation natif pour la session d’origine, ou lorsque `approvals.plugin` est acheminé vers la session Slack d’origine ou une cible Slack.
- Les messages privés d’approbation de plugin utilisent les approbateurs de plugins Slack provenant de `channels.slack.allowFrom`, de la valeur `allowFrom` du compte nommé ou de la route par défaut du compte.
- L’autorisation de l’approbateur reste appliquée : les approbateurs d’exécution uniquement ne peuvent pas approuver les demandes de plugin, sauf s’ils sont également approbateurs de plugins.

Cela utilise la même interface partagée de boutons d’approbation que les autres canaux. Lorsque `interactivity` est activé dans les paramètres de votre application Slack, les demandes d’approbation s’affichent sous forme de boutons Block Kit directement dans la conversation.
Lorsque ces boutons sont présents, ils constituent l’interface principale d’approbation ; OpenClaw
ne doit inclure une commande manuelle `/approve` que lorsque le résultat de l’outil indique que les
approbations dans le chat ne sont pas disponibles ou que l’approbation manuelle est la seule option.

Chemin de configuration :

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (facultatif ; utilise `commands.ownerAllowFrom` comme solution de repli lorsque cela est possible)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, valeur par défaut : `dm`)
- `agentFilter`, `sessionFilter`

Slack active automatiquement les approbations d’exécution natives lorsque `enabled` n’est pas défini ou vaut `"auto"` et qu’au moins un
approbateur d’exécution est résolu. Slack peut également gérer les approbations natives de plugins via ce chemin de client
natif lorsque les approbateurs de plugins Slack sont résolus et que la demande correspond aux filtres du client natif. Définissez
`enabled: false` pour désactiver explicitement Slack en tant que client d’approbation natif. Définissez `enabled: true` pour
forcer l’activation des approbations natives lorsque les approbateurs sont résolus. La désactivation des approbations d’exécution Slack ne désactive pas
la remise des approbations natives de plugins Slack activée via `approvals.plugin` ; la remise des approbations de
plugins utilise plutôt les approbateurs de plugins Slack.

Comportement par défaut sans configuration explicite des approbations d’exécution Slack :

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Une configuration native Slack explicite n’est nécessaire que si vous souhaitez remplacer les approbateurs, ajouter des filtres ou
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

Le transfert partagé `approvals.exec` est distinct. Utilisez-le uniquement lorsque les demandes d’approbation d’exécution doivent également
être acheminées vers d’autres chats ou des cibles hors bande explicites. Le transfert partagé `approvals.plugin` est également
distinct ; la remise native Slack ne désactive cette solution de repli que lorsque Slack peut gérer nativement la demande
d’approbation du plugin.

La commande `/approve` dans le même chat fonctionne également dans les canaux et les messages privés Slack qui prennent déjà en charge les commandes. Consultez [Approbations d’exécution](/fr/tools/exec-approvals) pour le modèle complet de transfert des approbations.

## Événements et comportement opérationnel

- Les modifications et suppressions de messages sont converties en événements système.
- Les diffusions de fil de discussion (réponses de fil « Also send to channel ») sont traitées comme des messages utilisateur normaux.
- Les événements d’ajout et de suppression de réactions sont convertis en événements système.
- Les arrivées et départs de membres, la création et le renommage de canaux, ainsi que l’ajout et la suppression d’épingles sont convertis en événements système.
- `channel_id_changed` peut migrer les clés de configuration des canaux lorsque `configWrites` est activé.
- Les métadonnées de sujet et d’objectif du canal sont traitées comme un contexte non fiable et peuvent être injectées dans le contexte de routage.
- L’amorçage du contexte à partir du message initial et de l’historique initial du fil est filtré par les listes d’autorisation d’expéditeurs configurées, le cas échéant.
- Les actions de blocs, les raccourcis et les interactions avec les fenêtres modales émettent des événements système structurés `Slack interaction: ...` contenant des champs de charge utile détaillés :
  - actions de blocs : valeurs sélectionnées, libellés, valeurs de sélecteur et métadonnées `workflow_*`
  - raccourcis globaux : métadonnées de rappel et d’acteur, acheminées vers la session directe de l’acteur
  - raccourcis de message : contexte du rappel, de l’acteur, du canal, du fil et du message sélectionné
  - événements modaux `view_submission` et `view_closed` avec métadonnées du canal acheminé et entrées de formulaire

Définissez des raccourcis globaux ou de message dans la configuration de votre application Slack et utilisez un ID de rappel non vide. OpenClaw accuse réception des charges utiles de raccourci correspondantes, applique la même politique d’expéditeur pour les messages privés et les canaux que pour les autres interactions Slack, puis met en file d’attente l’événement nettoyé pour la session d’agent acheminée. Les ID de déclencheur et les URL de réponse sont masqués dans le contexte de l’agent.

## Référence de configuration

Référence principale : [Référence de configuration — Slack](/fr/gateway/config-channels#slack).

<Accordion title="Champs Slack les plus importants">

- mode/authentification : `mode`, `enterpriseOrgInstall`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- accès aux messages privés : `dm.enabled`, `dmPolicy`, `allowFrom` (ancien : `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- option de compatibilité : `dangerouslyAllowNameMatching` (mesure d’urgence ; laissez-la désactivée sauf nécessité)
- accès aux canaux : `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- fils/historique : `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- remise : `textChunkLimit`, `streaming.chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- aperçus : `unfurlLinks` (valeur par défaut : `false`), `unfurlMedia` pour contrôler les aperçus des liens et médias de `chat.postMessage` ; définissez `unfurlLinks: true` pour réactiver les aperçus de liens
- opérations/fonctionnalités : `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Dépannage

<AccordionGroup>
  <Accordion title="Aucune réponse dans les canaux">
    Vérifiez, dans l’ordre :

    - `groupPolicy`
    - liste d’autorisation des canaux (`channels.slack.channels`) — **les clés doivent être des ID de canal** (`C12345678`), et non des noms (`#channel-name`). Les clés basées sur les noms échouent silencieusement avec `groupPolicy: "allowlist"`, car le routage des canaux utilise par défaut les ID en priorité. Pour trouver un ID : faites un clic droit sur le canal dans Slack → **Copy link** — la valeur `C...` à la fin de l’URL est l’ID du canal.
    - `requireMention`
    - liste d’autorisation `users` propre au canal
    - `messages.groupChat.visibleReplies` : les demandes normales de groupe/canal utilisent par défaut `"automatic"`. Si vous avez choisi `"message_tool"` et que les journaux affichent du texte de l’assistant sans appel à `message(action=send)`, le modèle n’a pas utilisé le chemin visible de l’outil de messagerie. Dans ce mode, le texte final reste privé ; consultez le journal détaillé du Gateway pour rechercher les métadonnées de charge utile supprimées, ou définissez la valeur sur `"automatic"` si vous souhaitez que chaque réponse finale normale de l’assistant soit publiée via l’ancien chemin.
    - `messages.groupChat.unmentionedInbound` : si sa valeur est `"room_event"`, les échanges autorisés du canal qui ne mentionnent personne constituent un contexte ambiant et restent silencieux, sauf si l’agent appelle l’outil `message`. Consultez [Événements ambiants de salon](/fr/channels/ambient-room-events).

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
    - `channels.slack.dmPolicy` (ou l’ancienne option `channels.slack.dm.policy`)
    - approbations d’association / entrées de liste d’autorisation (`dmPolicy: "open"` exige toujours `channels.slack.allowFrom: ["*"]`)
    - les messages privés de groupe utilisent la gestion MPIM ; activez `channels.slack.dm.groupEnabled` et, si cette option est configurée, incluez le MPIM dans `channels.slack.dm.groupChannels`
    - événements de messages privés de Slack Assistant : les journaux détaillés mentionnant `drop message_changed`
      signifient généralement que Slack a envoyé un événement de fil Assistant modifié sans
      expéditeur humain récupérable dans les métadonnées du message

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Le mode Socket ne se connecte pas">
    Validez les jetons du bot et de l’application ainsi que l’activation de Socket Mode dans les paramètres de l’application Slack.
    Le jeton au niveau de l’application nécessite `connections:write`, et le jeton OAuth Bot User
    utilisé comme jeton de bot doit appartenir à la même application et au même espace de travail Slack que le jeton d’application.

    Si `openclaw channels status --probe --json` affiche `botTokenStatus` ou
    `appTokenStatus: "configured_unavailable"`, le compte Slack est
    configuré, mais l’environnement d’exécution actuel n’a pas pu résoudre la valeur
    fournie par SecretRef.

    Les journaux tels que `slack socket mode failed to start; retry ...` indiquent des échecs
    de démarrage récupérables. Les portées manquantes, les jetons révoqués et une authentification non valide provoquent plutôt
    un échec immédiat. Un journal `slack token mismatch ...` signifie que le jeton du bot et le jeton de l’application
    semblent appartenir à des applications Slack différentes ; corrigez les identifiants de l’application Slack.

  </Accordion>

  <Accordion title="Le mode HTTP ne reçoit pas les événements">
    Validez :

    - secret de signature
    - chemin du webhook
    - URL de requête Slack (Events + Interactivity + Slash Commands)
    - `webhookPath` unique pour chaque compte HTTP
    - l’URL publique termine TLS et transmet les requêtes au chemin du Gateway
    - le chemin `request_url` de l’application Slack correspond exactement à `channels.slack.webhookPath` (valeur par défaut : `/slack/events`)

    Si `signingSecretStatus: "configured_unavailable"` apparaît dans les instantanés
    du compte, le compte HTTP est configuré, mais l’environnement d’exécution actuel n’a pas pu
    résoudre le secret de signature fourni par SecretRef.

    Un journal répété `slack: webhook path ... already registered` signifie que deux comptes HTTP
    utilisent le même `webhookPath` ; attribuez un chemin distinct à chaque compte.

  </Accordion>

  <Accordion title="Les commandes natives/slash ne se déclenchent pas">
    Vérifiez ce que vous souhaitiez utiliser :

    - le mode de commandes natives (`channels.slack.commands.native: true`) avec les commandes slash correspondantes enregistrées dans Slack
    - ou le mode de commande slash unique (`channels.slack.slashCommand.enabled: true`)

    Slack ne crée ni ne supprime automatiquement les commandes slash. `commands.native: "auto"` n’active pas les commandes natives Slack ; utilisez `true` et créez les commandes correspondantes dans l’application Slack. En mode HTTP, chaque commande slash Slack doit inclure l’URL du Gateway. En Socket Mode, les charges utiles des commandes arrivent via le websocket et Slack ignore `slash_commands[].url`.

    Vérifiez également `commands.useAccessGroups`, l’autorisation des messages privés, les listes d’autorisation
    des canaux et les listes d’autorisation `users` propres aux canaux. Slack renvoie des erreurs éphémères pour
    les expéditeurs de commandes slash bloqués, notamment :

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## Référence des pièces jointes multimédias

Slack peut joindre les médias téléchargés au tour de l’agent lorsque le téléchargement des fichiers Slack réussit et que les limites de taille le permettent. Les extraits audio peuvent être transcrits, les fichiers image peuvent passer par le chemin de compréhension des médias ou être transmis directement à un modèle de réponse prenant en charge la vision, et les autres fichiers restent disponibles comme contexte de fichier téléchargeable.

### Types de médias pris en charge

| Type de média                  | Source               | Comportement actuel                                                               | Remarques                                                                 |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Extraits audio Slack           | URL de fichier Slack | Téléchargés et acheminés via la transcription audio partagée                      | Nécessite `files:read` et un modèle ou une CLI `tools.media.audio` fonctionnel |
| Images JPEG / PNG / GIF / WebP | URL de fichier Slack | Téléchargées et jointes au tour pour un traitement prenant en charge la vision    | Limite par fichier : `channels.slack.mediaMaxMb` (valeur par défaut : 20 MB) |
| Fichiers PDF                   | URL de fichier Slack | Téléchargés et exposés comme contexte de fichier pour des outils tels que `download-file` ou `pdf` | Les entrées Slack ne convertissent pas automatiquement les PDF en données d’entrée visuelles |
| Autres fichiers                | URL de fichier Slack | Téléchargés lorsque cela est possible et exposés comme contexte de fichier        | Les fichiers binaires ne sont pas traités comme des données d’entrée d’image |
| Réponses de fil                | Fichiers du message initial du fil | Les fichiers du message racine peuvent être chargés comme contexte lorsque la réponse ne contient aucun média direct | Les messages initiaux contenant uniquement des fichiers utilisent un espace réservé de pièce jointe |
| Messages multifichiers         | Plusieurs fichiers Slack | Chaque fichier est évalué indépendamment                                          | Le traitement Slack est limité à huit fichiers par message                |

### Pipeline entrant

Lorsqu’un message Slack contenant des pièces jointes arrive :

1. OpenClaw télécharge le fichier depuis l’URL privée de Slack à l’aide du jeton du bot.
2. Le fichier est écrit dans le stockage multimédia en cas de réussite.
3. Les chemins et les types de contenu des médias téléchargés sont ajoutés au contexte entrant.
4. Les clips audio sont acheminés vers le pipeline de transcription partagé ; les parcours de modèles et d’outils prenant en charge les images peuvent utiliser les pièces jointes d’image issues du même contexte.
5. Les autres fichiers restent disponibles sous forme de métadonnées de fichier ou de références multimédias pour les outils capables de les traiter.

### Héritage des pièces jointes du message racine d’un fil

Lorsqu’un message arrive dans un fil (avec un parent `thread_ts`) :

- Si la réponse elle-même ne contient aucun média direct et que le message racine inclus comporte des fichiers, Slack peut charger les fichiers racine comme contexte de démarrage du fil.
- Les fichiers racine ne sont chargés que lors de l’initialisation d’une session de fil nouvelle ou réinitialisée. Les réponses ultérieures contenant uniquement du texte réutilisent le contexte de session existant et ne joignent pas de nouveau les fichiers racine en tant que nouveaux médias.
- Les pièces jointes directes de la réponse ont priorité sur celles du message racine.
- Un message racine qui contient uniquement des fichiers et aucun texte est représenté par un espace réservé de pièce jointe afin que le mécanisme de repli puisse tout de même inclure ses fichiers.

### Gestion de plusieurs pièces jointes

Lorsqu’un même message Slack contient plusieurs fichiers joints :

- Chaque pièce jointe est traitée indépendamment par le pipeline multimédia.
- Les références des médias téléchargés sont regroupées dans le contexte du message.
- L’ordre de traitement suit l’ordre des fichiers de Slack dans la charge utile de l’événement.
- L’échec du téléchargement d’une pièce jointe ne bloque pas les autres.

### Limites de taille, de téléchargement et de modèle

- **Taille maximale** : 20 Mo par fichier par défaut. Configurable via `channels.slack.mediaMaxMb`.
- **Limite de transcription audio** : `tools.media.audio.maxBytes` s’applique également lorsque le fichier téléchargé est envoyé à un fournisseur de transcription ou à une CLI.
- **Échecs de téléchargement** : les fichiers que Slack ne peut pas fournir, les URL expirées, les fichiers inaccessibles ou trop volumineux et les réponses HTML d’authentification ou de connexion de Slack sont ignorés au lieu d’être signalés comme des formats non pris en charge.
- **Modèle de vision** : l’analyse des images utilise le modèle de réponse actif lorsqu’il prend en charge la vision, ou le modèle d’image configuré dans `agents.defaults.imageModel`.

### Limites connues

| Scénario                                      | Comportement actuel                                                                   | Solution de contournement                                                                    |
| --------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| URL de fichier Slack expirée                        | Fichier ignoré ; aucune erreur affichée                                                       | Téléversez de nouveau le fichier dans Slack                                                   |
| Transcription audio indisponible               | Le clip reste joint, mais aucune transcription n’est produite                                | Configurez `tools.media.audio` ou installez une CLI locale de transcription prise en charge  |
| Un clip sans légende ne franchit pas le filtre de mention | Ignoré après une transcription spéculative privée ; transcription et téléchargement supprimés | Configurez un modèle de mention du nom prononcé, ajoutez une mention textuelle du bot ou utilisez un message privé |
| Modèle de vision non configuré                   | Les pièces jointes d’image sont stockées comme références multimédias, mais ne sont pas analysées comme des images       | Configurez `agents.defaults.imageModel` ou utilisez un modèle de réponse prenant en charge la vision    |
| Images très volumineuses (> 20 Mo par défaut)        | Ignorées conformément à la taille maximale                                                               | Augmentez `channels.slack.mediaMaxMb` si Slack le permet                          |
| Pièces jointes transférées/partagées                  | Le texte et les médias d’image ou de fichier hébergés par Slack sont traités au mieux                             | Partagez-les de nouveau directement dans le fil OpenClaw                                      |
| Pièces jointes PDF                               | Stockées comme contexte de fichier/média, sans être automatiquement acheminées vers la vision par image        | Utilisez `download-file` pour les métadonnées de fichier ou l’outil `pdf` pour l’analyse des PDF      |

### Documentation associée

- [Pipeline de compréhension des médias](/fr/nodes/media-understanding)
- [Audio et notes vocales](/fr/nodes/audio)
- [Outil PDF](/fr/tools/pdf)

## Voir aussi

<CardGroup cols={2}>
  <Card title="Appairage" icon="link" href="/fr/channels/pairing">
    Associez un utilisateur Slack au Gateway.
  </Card>
  <Card title="Groupes" icon="users" href="/fr/channels/groups">
    Comportement des canaux et des messages privés de groupe.
  </Card>
  <Card title="Routage des canaux" icon="route" href="/fr/channels/channel-routing">
    Acheminez les messages entrants vers les agents.
  </Card>
  <Card title="Sécurité" icon="shield" href="/fr/gateway/security">
    Modèle de menaces et renforcement de la sécurité.
  </Card>
  <Card title="Configuration" icon="sliders" href="/fr/gateway/configuration">
    Structure et priorité de la configuration.
  </Card>
  <Card title="Commandes slash" icon="terminal" href="/fr/tools/slash-commands">
    Catalogue et comportement des commandes.
  </Card>
</CardGroup>
