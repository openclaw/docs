---
read_when:
    - Configuration de l’intégration du chat Twitch pour OpenClaw
sidebarTitle: Twitch
summary: Configuration et mise en place du bot de chat Twitch
title: Twitch
x-i18n:
    generated_at: "2026-04-30T07:15:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 897079687a243c9c2ce2be63167e59f4413bbd89735fb79f03928547023bd787
    source_path: channels/twitch.md
    workflow: 16
---

Prise en charge du chat Twitch via une connexion IRC. OpenClaw se connecte en tant qu’utilisateur Twitch (compte bot) pour recevoir et envoyer des messages dans des chaînes.

## Plugin groupé

<Note>
Twitch est fourni comme Plugin groupé dans les versions actuelles d’OpenClaw ; les builds empaquetés normaux n’ont donc pas besoin d’une installation séparée.
</Note>

Si vous utilisez un build plus ancien ou une installation personnalisée qui exclut Twitch, installez un package npm actuel lorsqu’il est publié :

<Tabs>
  <Tab title="Registre npm">
    ```bash
    openclaw plugins install @openclaw/twitch
    ```
  </Tab>
  <Tab title="Checkout local">
    ```bash
    openclaw plugins install ./path/to/local/twitch-plugin
    ```
  </Tab>
</Tabs>

Si npm signale que le package détenu par OpenClaw est obsolète, utilisez un build
OpenClaw empaqueté actuel ou le chemin de checkout local jusqu’à ce qu’un package npm plus récent soit
publié.

Détails : [Plugins](/fr/tools/plugin)

## Configuration rapide (débutant)

<Steps>
  <Step title="Vérifier que le Plugin est disponible">
    Les versions OpenClaw empaquetées actuelles l’incluent déjà. Les installations plus anciennes ou personnalisées peuvent l’ajouter manuellement avec les commandes ci-dessus.
  </Step>
  <Step title="Créer un compte bot Twitch">
    Créez un compte Twitch dédié au bot (ou utilisez un compte existant).
  </Step>
  <Step title="Générer les identifiants">
    Utilisez [Twitch Token Generator](https://twitchtokengenerator.com/) :

    - Sélectionnez **Bot Token**
    - Vérifiez que les portées `chat:read` et `chat:write` sont sélectionnées
    - Copiez le **Client ID** et l’**Access Token**

  </Step>
  <Step title="Trouver votre ID utilisateur Twitch">
    Utilisez [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) pour convertir un nom d’utilisateur en ID utilisateur Twitch.
  </Step>
  <Step title="Configurer le jeton">
    - Env : `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (compte par défaut uniquement)
    - Ou configuration : `channels.twitch.accessToken`

    Si les deux sont définis, la configuration est prioritaire (le repli env concerne uniquement le compte par défaut).

  </Step>
  <Step title="Démarrer le Gateway">
    Démarrez le Gateway avec la chaîne configurée.
  </Step>
</Steps>

<Warning>
Ajoutez un contrôle d’accès (`allowFrom` ou `allowedRoles`) pour empêcher des utilisateurs non autorisés de déclencher le bot. La valeur par défaut de `requireMention` est `true`.
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

## Présentation

- Une chaîne Twitch détenue par le Gateway.
- Routage déterministe : les réponses retournent toujours vers Twitch.
- Chaque compte correspond à une clé de session isolée `agent:<agentId>:twitch:<accountName>`.
- `username` est le compte du bot (celui qui s’authentifie), `channel` est le salon de chat à rejoindre.

## Configuration (détaillée)

### Générer les identifiants

Utilisez [Twitch Token Generator](https://twitchtokengenerator.com/) :

- Sélectionnez **Bot Token**
- Vérifiez que les portées `chat:read` et `chat:write` sont sélectionnées
- Copiez le **Client ID** et l’**Access Token**

<Note>
Aucune inscription manuelle d’application n’est nécessaire. Les jetons expirent après plusieurs heures.
</Note>

### Configurer le bot

<Tabs>
  <Tab title="Variable env (compte par défaut uniquement)">
    ```bash
    OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
    ```
  </Tab>
  <Tab title="Configuration">
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

Si l’env et la configuration sont tous deux définis, la configuration est prioritaire.

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

Préférez `allowFrom` pour une liste d’autorisation stricte. Utilisez plutôt `allowedRoles` si vous voulez un accès basé sur les rôles.

**Rôles disponibles :** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

<Note>
**Pourquoi des ID utilisateur ?** Les noms d’utilisateur peuvent changer, ce qui permet l’usurpation d’identité. Les ID utilisateur sont permanents.

Trouvez votre ID utilisateur Twitch : [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (Convertir votre nom d’utilisateur Twitch en ID)
</Note>

## Actualisation des jetons (facultatif)

Les jetons de [Twitch Token Generator](https://twitchtokengenerator.com/) ne peuvent pas être actualisés automatiquement ; régénérez-les lorsqu’ils expirent.

Pour l’actualisation automatique des jetons, créez votre propre application Twitch dans la [Twitch Developer Console](https://dev.twitch.tv/console) et ajoutez à la configuration :

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

Le bot actualise automatiquement les jetons avant expiration et journalise les événements d’actualisation.

## Prise en charge de plusieurs comptes

Utilisez `channels.twitch.accounts` avec des jetons par compte. Consultez [Configuration](/fr/gateway/configuration) pour le modèle partagé.

Exemple (un compte bot dans deux chaînes) :

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
Chaque compte a besoin de son propre jeton (un jeton par chaîne).
</Note>

## Contrôle d’accès

<Tabs>
  <Tab title="Liste d’autorisation d’ID utilisateur (la plus sécurisée)">
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

    `allowFrom` est une liste d’autorisation stricte. Lorsqu’elle est définie, seuls ces ID utilisateur sont autorisés. Si vous voulez un accès basé sur les rôles, laissez `allowFrom` non défini et configurez plutôt `allowedRoles`.

  </Tab>
  <Tab title="Désactiver l’obligation de @mention">
    Par défaut, `requireMention` vaut `true`. Pour désactiver cette obligation et répondre à tous les messages :

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

Commencez par exécuter les commandes de diagnostic :

```bash
openclaw doctor
openclaw channels status --probe
```

<AccordionGroup>
  <Accordion title="Le bot ne répond pas aux messages">
    - **Vérifiez le contrôle d’accès :** assurez-vous que votre ID utilisateur est dans `allowFrom`, ou supprimez temporairement `allowFrom` et définissez `allowedRoles: ["all"]` pour tester.
    - **Vérifiez que le bot est dans la chaîne :** le bot doit rejoindre la chaîne indiquée dans `channel`.

  </Accordion>
  <Accordion title="Problèmes de jeton">
    « Failed to connect » ou erreurs d’authentification :

    - Vérifiez que `accessToken` est la valeur du jeton d’accès OAuth (commence généralement par le préfixe `oauth:`)
    - Vérifiez que le jeton possède les portées `chat:read` et `chat:write`
    - Si vous utilisez l’actualisation des jetons, vérifiez que `clientSecret` et `refreshToken` sont définis

  </Accordion>
  <Accordion title="L’actualisation des jetons ne fonctionne pas">
    Consultez les journaux pour les événements d’actualisation :

    ```
    Using env token source for mybot
    Access token refreshed for user 123456 (expires in 14400s)
    ```

    Si vous voyez « token refresh disabled (no refresh token) » :

    - Vérifiez que `clientSecret` est fourni
    - Vérifiez que `refreshToken` est fourni

  </Accordion>
</AccordionGroup>

## Configuration

### Configuration du compte

<ParamField path="username" type="string">
  Nom d’utilisateur du bot.
</ParamField>
<ParamField path="accessToken" type="string">
  Jeton d’accès OAuth avec `chat:read` et `chat:write`.
</ParamField>
<ParamField path="clientId" type="string">
  Client ID Twitch (depuis Token Generator ou votre application).
</ParamField>
<ParamField path="channel" type="string" required>
  Chaîne à rejoindre.
</ParamField>
<ParamField path="enabled" type="boolean" default="true">
  Activer ce compte.
</ParamField>
<ParamField path="clientSecret" type="string">
  Facultatif : pour l’actualisation automatique des jetons.
</ParamField>
<ParamField path="refreshToken" type="string">
  Facultatif : pour l’actualisation automatique des jetons.
</ParamField>
<ParamField path="expiresIn" type="number">
  Expiration du jeton en secondes.
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  Horodatage d’obtention du jeton.
</ParamField>
<ParamField path="allowFrom" type="string[]">
  Liste d’autorisation d’ID utilisateur.
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  Contrôle d’accès basé sur les rôles.
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  Exiger @mention.
</ParamField>

### Options du fournisseur

- `channels.twitch.enabled` - Activer/désactiver le démarrage de la chaîne
- `channels.twitch.username` - Nom d’utilisateur du bot (configuration simplifiée à compte unique)
- `channels.twitch.accessToken` - Jeton d’accès OAuth (configuration simplifiée à compte unique)
- `channels.twitch.clientId` - Client ID Twitch (configuration simplifiée à compte unique)
- `channels.twitch.channel` - Chaîne à rejoindre (configuration simplifiée à compte unique)
- `channels.twitch.accounts.<accountName>` - Configuration multi-comptes (tous les champs de compte ci-dessus)

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

- `send` - Envoyer un message à une chaîne

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

- **Traitez les jetons comme des mots de passe** — Ne validez jamais de jetons dans git.
- **Utilisez l’actualisation automatique des jetons** pour les bots de longue durée.
- **Utilisez des listes d’autorisation d’ID utilisateur** au lieu des noms d’utilisateur pour le contrôle d’accès.
- **Surveillez les journaux** pour les événements d’actualisation des jetons et l’état de la connexion.
- **Limitez les portées des jetons au minimum** — Ne demandez que `chat:read` et `chat:write`.
- **Si vous êtes bloqué** : redémarrez le Gateway après avoir confirmé qu’aucun autre processus ne possède la session.

## Limites

- **500 caractères** par message (découpé automatiquement aux limites de mots).
- Markdown est supprimé avant le découpage.
- Aucune limitation de débit (utilise les limites de débit intégrées de Twitch).

## Connexe

- [Routage des chaînes](/fr/channels/channel-routing) — routage de session pour les messages
- [Vue d’ensemble des chaînes](/fr/channels) — toutes les chaînes prises en charge
- [Groupes](/fr/channels/groups) — comportement de chat de groupe et filtrage par mention
- [Association](/fr/channels/pairing) — authentification par DM et flux d’association
- [Sécurité](/fr/gateway/security) — modèle d’accès et durcissement
