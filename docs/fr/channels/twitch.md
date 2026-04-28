---
read_when:
    - Configurer l’intégration du chat Twitch pour OpenClaw
sidebarTitle: Twitch
summary: Configuration et configuration initiale du bot de discussion Twitch
title: Twitch
x-i18n:
    generated_at: "2026-04-26T11:24:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1d5f4bbad04e04cccc82fc1e2b1057acae3bf7b7684a8e7a4b1f54101731974a
    source_path: channels/twitch.md
    workflow: 15
---

Prise en charge du chat Twitch via une connexion IRC. OpenClaw se connecte en tant qu’utilisateur Twitch (compte bot) pour recevoir et envoyer des messages dans des canaux.

## Plugin inclus

<Note>
Twitch est fourni comme Plugin inclus dans les versions actuelles d’OpenClaw ; les builds packagés normaux ne nécessitent donc pas d’installation séparée.
</Note>

Si vous utilisez un build plus ancien ou une installation personnalisée qui exclut Twitch, installez-le manuellement :

<Tabs>
  <Tab title="registre npm">
    ```bash
    openclaw plugins install @openclaw/twitch
    ```
  </Tab>
  <Tab title="checkout local">
    ```bash
    openclaw plugins install ./path/to/local/twitch-plugin
    ```
  </Tab>
</Tabs>

Détails : [Plugins](/fr/tools/plugin)

## Configuration rapide (débutant)

<Steps>
  <Step title="Vérifier que le Plugin est disponible">
    Les versions packagées actuelles d’OpenClaw l’incluent déjà. Les installations anciennes/personnalisées peuvent l’ajouter manuellement avec les commandes ci-dessus.
  </Step>
  <Step title="Créer un compte bot Twitch">
    Créez un compte Twitch dédié pour le bot (ou utilisez un compte existant).
  </Step>
  <Step title="Générer les identifiants">
    Utilisez [Twitch Token Generator](https://twitchtokengenerator.com/) :

    - Sélectionnez **Bot Token**
    - Vérifiez que les portées `chat:read` et `chat:write` sont sélectionnées
    - Copiez le **Client ID** et le **Access Token**

  </Step>
  <Step title="Trouver votre identifiant utilisateur Twitch">
    Utilisez [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) pour convertir un nom d’utilisateur en identifiant utilisateur Twitch.
  </Step>
  <Step title="Configurer le token">
    - Env : `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (compte par défaut uniquement)
    - Ou config : `channels.twitch.accessToken`

    Si les deux sont définis, la config est prioritaire (la variable d’environnement ne sert de repli que pour le compte par défaut).

  </Step>
  <Step title="Démarrer le gateway">
    Démarrez le gateway avec le canal configuré.
  </Step>
</Steps>

<Warning>
Ajoutez un contrôle d’accès (`allowFrom` ou `allowedRoles`) pour empêcher les utilisateurs non autorisés de déclencher le bot. `requireMention` est défini sur `true` par défaut.
</Warning>

Configuration minimale :

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Bot's Twitch account
      accessToken: "oauth:abc123...", // OAuth Access Token (or use OPENCLAW_TWITCH_ACCESS_TOKEN env var)
      clientId: "xyz789...", // Client ID from Token Generator
      channel: "vevisk", // Which Twitch channel's chat to join (required)
      allowFrom: ["123456789"], // (recommended) Your Twitch user ID only - get it from https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/
    },
  },
}
```

## Ce que c’est

- Un canal Twitch appartenant au Gateway.
- Routage déterministe : les réponses reviennent toujours vers Twitch.
- Chaque compte est mappé à une clé de session isolée `agent:<agentId>:twitch:<accountName>`.
- `username` est le compte du bot (celui qui s’authentifie), `channel` est le salon de chat à rejoindre.

## Configuration (détaillée)

### Générer les identifiants

Utilisez [Twitch Token Generator](https://twitchtokengenerator.com/) :

- Sélectionnez **Bot Token**
- Vérifiez que les portées `chat:read` et `chat:write` sont sélectionnées
- Copiez le **Client ID** et le **Access Token**

<Note>
Aucun enregistrement manuel d’application n’est nécessaire. Les tokens expirent au bout de quelques heures.
</Note>

### Configurer le bot

<Tabs>
  <Tab title="Variable d’environnement (compte par défaut uniquement)">
    ```bash
    OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
    ```
  </Tab>
  <Tab title="Config">
    ```json5
    {
      channels: {
        twitch: {
          enabled: true,
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "vevisk",
        },
      },
    }
    ```
  </Tab>
</Tabs>

Si la variable d’environnement et la config sont toutes deux définies, la config est prioritaire.

### Contrôle d’accès (recommandé)

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // (recommended) Your Twitch user ID only
    },
  },
}
```

Préférez `allowFrom` pour une liste d’autorisation stricte. Utilisez `allowedRoles` à la place si vous voulez un accès basé sur les rôles.

**Rôles disponibles :** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

<Note>
**Pourquoi les identifiants utilisateur ?** Les noms d’utilisateur peuvent changer, ce qui permet l’usurpation d’identité. Les identifiants utilisateur sont permanents.

Trouvez votre identifiant utilisateur Twitch : [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (Convert your Twitch username to ID)
</Note>

## Actualisation du token (facultatif)

Les tokens de [Twitch Token Generator](https://twitchtokengenerator.com/) ne peuvent pas être actualisés automatiquement ; régénérez-les lorsqu’ils expirent.

Pour l’actualisation automatique du token, créez votre propre application Twitch dans la [Twitch Developer Console](https://dev.twitch.tv/console) et ajoutez à la config :

```json5
{
  channels: {
    twitch: {
      clientSecret: "your_client_secret",
      refreshToken: "your_refresh_token",
    },
  },
}
```

Le bot actualise automatiquement les tokens avant leur expiration et journalise les événements d’actualisation.

## Prise en charge de plusieurs comptes

Utilisez `channels.twitch.accounts` avec des tokens par compte. Voir [Configuration](/fr/gateway/configuration) pour le modèle partagé.

Exemple (un compte bot dans deux canaux) :

```json5
{
  channels: {
    twitch: {
      accounts: {
        channel1: {
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "vevisk",
        },
        channel2: {
          username: "openclaw",
          accessToken: "oauth:def456...",
          clientId: "uvw012...",
          channel: "secondchannel",
        },
      },
    },
  },
}
```

<Note>
Chaque compte a besoin de son propre token (un token par canal).
</Note>

## Contrôle d’accès

<Tabs>
  <Tab title="Liste d’autorisation par identifiant utilisateur (le plus sûr)">
    ```json5
    {
      channels: {
        twitch: {
          accounts: {
            default: {
              allowFrom: ["123456789", "987654321"],
            },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Basé sur les rôles">
    ```json5
    {
      channels: {
        twitch: {
          accounts: {
            default: {
              allowedRoles: ["moderator", "vip"],
            },
          },
        },
      },
    }
    ```

    `allowFrom` est une liste d’autorisation stricte. Lorsqu’elle est définie, seuls ces identifiants utilisateur sont autorisés. Si vous voulez un accès basé sur les rôles, laissez `allowFrom` non défini et configurez plutôt `allowedRoles`.

  </Tab>
  <Tab title="Désactiver l’exigence de @mention">
    Par défaut, `requireMention` vaut `true`. Pour le désactiver et répondre à tous les messages :

    ```json5
    {
      channels: {
        twitch: {
          accounts: {
            default: {
              requireMention: false,
            },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## Dépannage

Exécutez d’abord les commandes de diagnostic :

```bash
openclaw doctor
openclaw channels status --probe
```

<AccordionGroup>
  <Accordion title="Le bot ne répond pas aux messages">
    - **Vérifiez le contrôle d’accès :** assurez-vous que votre identifiant utilisateur figure dans `allowFrom`, ou supprimez temporairement `allowFrom` et définissez `allowedRoles: ["all"]` pour tester.
    - **Vérifiez que le bot est dans le canal :** le bot doit rejoindre le canal spécifié dans `channel`.

  </Accordion>
  <Accordion title="Problèmes de token">
    Erreurs « Failed to connect » ou d’authentification :

    - Vérifiez que `accessToken` correspond à la valeur du token d’accès OAuth (commence généralement par le préfixe `oauth:`)
    - Vérifiez que le token possède les portées `chat:read` et `chat:write`
    - Si vous utilisez l’actualisation du token, vérifiez que `clientSecret` et `refreshToken` sont définis

  </Accordion>
  <Accordion title="L’actualisation du token ne fonctionne pas">
    Vérifiez les journaux pour les événements d’actualisation :

    ```
    Using env token source for mybot
    Access token refreshed for user 123456 (expires in 14400s)
    ```

    Si vous voyez « token refresh disabled (no refresh token) » :

    - Assurez-vous que `clientSecret` est fourni
    - Assurez-vous que `refreshToken` est fourni

  </Accordion>
</AccordionGroup>

## Config

### Config du compte

<ParamField path="username" type="string">
  Nom d’utilisateur du bot.
</ParamField>
<ParamField path="accessToken" type="string">
  Token d’accès OAuth avec `chat:read` et `chat:write`.
</ParamField>
<ParamField path="clientId" type="string">
  Twitch Client ID (depuis Token Generator ou votre application).
</ParamField>
<ParamField path="channel" type="string" required>
  Canal à rejoindre.
</ParamField>
<ParamField path="enabled" type="boolean" default="true">
  Active ce compte.
</ParamField>
<ParamField path="clientSecret" type="string">
  Facultatif : pour l’actualisation automatique du token.
</ParamField>
<ParamField path="refreshToken" type="string">
  Facultatif : pour l’actualisation automatique du token.
</ParamField>
<ParamField path="expiresIn" type="number">
  Expiration du token en secondes.
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  Horodatage d’obtention du token.
</ParamField>
<ParamField path="allowFrom" type="string[]">
  Liste d’autorisation des identifiants utilisateur.
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  Contrôle d’accès basé sur les rôles.
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  Exiger une @mention.
</ParamField>

### Options du fournisseur

- `channels.twitch.enabled` - Activer/désactiver le démarrage du canal
- `channels.twitch.username` - Nom d’utilisateur du bot (config simplifiée à compte unique)
- `channels.twitch.accessToken` - Token d’accès OAuth (config simplifiée à compte unique)
- `channels.twitch.clientId` - Twitch Client ID (config simplifiée à compte unique)
- `channels.twitch.channel` - Canal à rejoindre (config simplifiée à compte unique)
- `channels.twitch.accounts.<accountName>` - Config multi-comptes (tous les champs de compte ci-dessus)

Exemple complet :

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "vevisk",
      clientSecret: "secret123...",
      refreshToken: "refresh456...",
      allowFrom: ["123456789"],
      allowedRoles: ["moderator", "vip"],
      accounts: {
        default: {
          username: "mybot",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "your_channel",
          enabled: true,
          clientSecret: "secret123...",
          refreshToken: "refresh456...",
          expiresIn: 14400,
          obtainmentTimestamp: 1706092800000,
          allowFrom: ["123456789", "987654321"],
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

## Actions d’outil

L’agent peut appeler `twitch` avec l’action :

- `send` - Envoyer un message à un canal

Exemple :

```json5
{
  action: "twitch",
  params: {
    message: "Hello Twitch!",
    to: "#mychannel",
  },
}
```

## Sécurité et exploitation

- **Traitez les tokens comme des mots de passe** — Ne committez jamais de tokens dans git.
- **Utilisez l’actualisation automatique du token** pour les bots de longue durée.
- **Utilisez des listes d’autorisation par identifiant utilisateur** au lieu de noms d’utilisateur pour le contrôle d’accès.
- **Surveillez les journaux** pour les événements d’actualisation du token et l’état de la connexion.
- **Réduisez au minimum les portées des tokens** — Ne demandez que `chat:read` et `chat:write`.
- **Si vous êtes bloqué** : redémarrez le gateway après avoir vérifié qu’aucun autre processus ne possède la session.

## Limites

- **500 caractères** par message (découpés automatiquement aux limites des mots).
- Le Markdown est supprimé avant le découpage.
- Pas de limitation de débit (utilise les limites de débit intégrées de Twitch).

## Lié

- [Routage des canaux](/fr/channels/channel-routing) — routage des sessions pour les messages
- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et filtrage par mention
- [Association](/fr/channels/pairing) — authentification DM et flux d’association
- [Sécurité](/fr/gateway/security) — modèle d’accès et durcissement
