---
read_when:
    - Configuration de l’intégration du chat Twitch pour OpenClaw
sidebarTitle: Twitch
summary: 'Bot de chat Twitch : installation, identifiants, contrôle d’accès, actualisation des jetons'
title: Twitch
x-i18n:
    generated_at: "2026-07-12T02:26:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 70890c0c6a648a06ad47c35016571a57c3e518296ef95311e75e32c81e60e2db
    source_path: channels/twitch.md
    workflow: 16
---

Prise en charge du chat Twitch via l’interface de chat (IRC) de Twitch, au moyen du client Twurple. OpenClaw se connecte avec un compte de bot Twitch, rejoint un canal par compte configuré et répond dans ce canal.

## Installation

Twitch est distribué en tant que Plugin officiel ; il ne fait pas partie de l’installation principale.

<Tabs>
  <Tab title="Registre npm">
    ```bash
    openclaw plugins install @openclaw/twitch
    ```
  </Tab>
  <Tab title="Copie de travail locale">
    ```bash
    openclaw plugins install ./path/to/local/twitch-plugin
    ```
  </Tab>
</Tabs>

`plugins install` enregistre et active le Plugin. Sélectionner Twitch pendant `openclaw onboard` ou `openclaw channels add` l’installe à la demande. Utilisez le nom de paquet seul pour suivre la version actuelle ; épinglez une version exacte uniquement pour obtenir des installations reproductibles. Nécessite OpenClaw 2026.4.10 ou une version ultérieure.

Détails : [Plugins](/fr/tools/plugin)

## Configuration rapide

<Steps>
  <Step title="Installer le Plugin">
    Consultez la section [Installation](#install) ci-dessus.
  </Step>
  <Step title="Créer un compte de bot Twitch">
    Créez un compte Twitch dédié au bot (ou utilisez un compte existant).
  </Step>
  <Step title="Générer les identifiants">
    Utilisez [Twitch Token Generator](https://twitchtokengenerator.com/) :

    - Sélectionnez **Bot Token**
    - Vérifiez que les autorisations `chat:read` et `chat:write` sont sélectionnées
    - Copiez le **Client ID** et l’**Access Token**

  </Step>
  <Step title="Trouver votre identifiant utilisateur Twitch">
    Utilisez [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) pour convertir un nom d’utilisateur en identifiant utilisateur Twitch.
  </Step>
  <Step title="Configurer le jeton">
    - Variable d’environnement : `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (compte par défaut uniquement)
    - Ou configuration : `channels.twitch.accessToken`

    Si les deux sont définis, la configuration est prioritaire (la variable d’environnement sert uniquement de solution de repli pour le compte par défaut).

  </Step>
  <Step title="Démarrer le Gateway">
    ```bash
    openclaw gateway run
    ```
  </Step>
</Steps>

<Warning>
Ajoutez un contrôle d’accès (`allowFrom` ou `allowedRoles`) pour empêcher les utilisateurs non autorisés de déclencher le bot. La valeur par défaut de `requireMention` est `true`.
</Warning>

Configuration minimale :

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Compte Twitch du bot (utilisé pour l’authentification)
      accessToken: "oauth:abc123...", // Jeton d’accès OAuth (ou utilisez la variable d’environnement OPENCLAW_TWITCH_ACCESS_TOKEN)
      clientId: "xyz789...", // Identifiant client provenant du générateur de jetons
      channel: "yourchannel", // Canal Twitch dont rejoindre le chat (obligatoire)
      allowFrom: ["123456789"], // (recommandé) Votre identifiant utilisateur Twitch uniquement
    },
  },
}
```

## Présentation

- Un canal Twitch détenu par le Gateway.
- Routage déterministe : les réponses sont toujours renvoyées vers le canal Twitch d’où provient le message.
- Chaque canal rejoint correspond à une clé de session de groupe isolée `agent:<agentId>:twitch:group:<channel>`.
- `username` désigne le compte du bot (celui qui s’authentifie) et `channel` le salon de discussion à rejoindre. Chaque entrée de compte rejoint exactement un canal.
- Les jetons fonctionnent avec ou sans le préfixe `oauth:` ; OpenClaw normalise les deux formes (l’assistant de configuration attend la forme `oauth:`).

## Actualisation du jeton (facultatif)

Les jetons provenant de [Twitch Token Generator](https://twitchtokengenerator.com/) ne peuvent pas être actualisés par OpenClaw : régénérez-les lorsqu’ils expirent (ils durent quelques heures ; aucun enregistrement d’application n’est nécessaire).

Pour une actualisation automatique, créez votre propre application dans la [console de développement Twitch](https://dev.twitch.tv/console) et ajoutez :

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

Lorsque les deux sont définis, le Plugin utilise un fournisseur d’authentification avec actualisation qui renouvelle les jetons avant leur expiration et journalise chaque actualisation. Sans `refreshToken`, il journalise `token refresh disabled (no refresh token)` ; sans `clientSecret`, il utilise à la place un jeton statique (non actualisé).

## Prise en charge de plusieurs comptes

Utilisez `channels.twitch.accounts` avec des identifiants propres à chaque compte. Consultez [Configuration](/fr/gateway/configuration) pour connaître le modèle commun.

Exemple (un compte de bot dans deux canaux) :

```json5
{
  channels: {
    twitch: {
      accounts: {
        channel1: {
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "yourchannel",
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
Chaque entrée de compte nécessite son propre `accessToken` (la variable d’environnement couvre uniquement le compte par défaut). Un compte rejoint exactement un canal ; rejoindre deux canaux nécessite donc deux comptes. `channels.twitch.defaultAccount` détermine le compte par défaut.
</Note>

## Contrôle d’accès

`allowFrom` est une liste d’autorisation stricte d’identifiants utilisateur Twitch. Lorsqu’elle est définie, `allowedRoles` est ignoré ; ne définissez pas `allowFrom` pour utiliser à la place l’accès fondé sur les rôles.

**Rôles disponibles :** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

<Tabs>
  <Tab title="Liste d’autorisation d’identifiants utilisateur (la plus sûre)">
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
  <Tab title="Fondé sur les rôles">
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
  </Tab>
  <Tab title="Désactiver l’exigence de mention @">
    Par défaut, `requireMention` vaut `true`. Pour répondre à tous les messages autorisés :

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

<Note>
**Pourquoi utiliser des identifiants utilisateur ?** Les noms d’utilisateur peuvent changer, ce qui permet l’usurpation d’identité. Les identifiants utilisateur sont permanents.

Trouvez le vôtre à l’aide du [convertisseur de nom d’utilisateur en identifiant](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/).
</Note>

## Dépannage

Commencez par exécuter les commandes de diagnostic :

```bash
openclaw doctor
openclaw channels status --probe
```

<AccordionGroup>
  <Accordion title="Le bot ne répond pas aux messages">
    - **Vérifiez le contrôle d’accès :** assurez-vous que votre identifiant utilisateur figure dans `allowFrom`, ou supprimez temporairement `allowFrom` et définissez `allowedRoles: ["all"]` pour effectuer un test.
    - **Vérifiez le filtre de mention :** avec `requireMention: true` (valeur par défaut), les messages doivent mentionner le nom d’utilisateur du bot avec @.
    - **Vérifiez que le bot se trouve dans le canal :** le bot rejoint uniquement le canal indiqué dans `channel`.

  </Accordion>
  <Accordion title="Problèmes de jeton">
    Erreurs `Failed to connect` ou erreurs d’authentification :

    - Vérifiez que `accessToken` contient la valeur du jeton d’accès OAuth (le préfixe `oauth:` est facultatif)
    - Vérifiez que le jeton possède les autorisations `chat:read` et `chat:write`
    - Si vous utilisez l’actualisation du jeton, vérifiez que `clientSecret` et `refreshToken` sont définis

  </Accordion>
  <Accordion title="L’actualisation du jeton ne fonctionne pas">
    Recherchez les événements d’actualisation dans les journaux :

    ```text
    Using env token source for mybot
    Access token refreshed for user 123456 (expires in 14400s)
    ```

    Si vous voyez `token refresh disabled (no refresh token)` :

    - Assurez-vous que `clientSecret` est fourni
    - Assurez-vous que `refreshToken` est fourni

  </Accordion>
</AccordionGroup>

## Configuration

### Configuration du compte

<ParamField path="username" type="string" required>
  Nom d’utilisateur du bot (le compte utilisé pour l’authentification).
</ParamField>
<ParamField path="accessToken" type="string" required>
  Jeton d’accès OAuth avec `chat:read` et `chat:write` (configuration ou variable d’environnement pour le compte par défaut).
</ParamField>
<ParamField path="clientId" type="string" required>
  Identifiant client Twitch (provenant du générateur de jetons ou de votre application). Facultatif dans le schéma, mais obligatoire pour se connecter.
</ParamField>
<ParamField path="channel" type="string" required>
  Canal à rejoindre.
</ParamField>
<ParamField path="enabled" type="boolean" default="true">
  Active ce compte.
</ParamField>
<ParamField path="clientSecret" type="string">
  Facultatif : permet l’actualisation automatique du jeton.
</ParamField>
<ParamField path="refreshToken" type="string">
  Facultatif : permet l’actualisation automatique du jeton.
</ParamField>
<ParamField path="expiresIn" type="number">
  Délai d’expiration du jeton en secondes (suivi de l’actualisation).
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  Horodatage de l’obtention du jeton (suivi de l’actualisation).
</ParamField>
<ParamField path="allowFrom" type="string[]">
  Liste d’autorisation d’identifiants utilisateur. Lorsqu’elle est définie, les rôles sont ignorés.
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  Contrôle d’accès fondé sur les rôles.
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  Exige une mention @ pour déclencher le bot.
</ParamField>
<ParamField path="responsePrefix" type="string">
  Remplacement du préfixe des réponses sortantes pour ce compte.
</ParamField>

### Options du fournisseur

- `channels.twitch.enabled` - Activer ou désactiver le démarrage du canal
- `channels.twitch.username` / `accessToken` / `clientId` / `channel` - Configuration simplifiée pour un seul compte (compte `default` implicite ; prioritaire sur `accounts.default`)
- `channels.twitch.accounts.<accountName>` - Configuration de plusieurs comptes (tous les champs de compte ci-dessus)
- `channels.twitch.defaultAccount` - Nom du compte utilisé par défaut
- `channels.twitch.markdown.tables` - Mode de rendu des tableaux Markdown (`off` | `bullets` | `code` | `block`)

Exemple complet :

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "yourchannel",
      clientSecret: "secret123...",
      refreshToken: "refresh456...",
      allowFrom: ["123456789"],
      accounts: {
        second: {
          username: "mybot",
          accessToken: "oauth:def456...",
          clientId: "uvw012...",
          channel: "your_channel",
          enabled: true,
          expiresIn: 14400,
          obtainmentTimestamp: 1706092800000,
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

## Actions de l’outil

L’agent peut envoyer des messages Twitch au moyen de l’action `send` de l’outil de messagerie :

```json5
{
  channel: "twitch",
  action: "send",
  to: "#mychannel",
  message: "Hello Twitch!",
}
```

`to` est facultatif et utilise par défaut le `channel` configuré pour le compte.

## Sécurité et exploitation

- **Traitez les jetons comme des mots de passe** : ne validez jamais de jetons dans git.
- **Utilisez l’actualisation automatique des jetons** pour les bots fonctionnant sur de longues périodes.
- **Utilisez des listes d’autorisation d’identifiants utilisateur** plutôt que des noms d’utilisateur pour le contrôle d’accès.
- **Surveillez les journaux** pour suivre les événements d’actualisation des jetons et l’état de la connexion.
- **Limitez autant que possible la portée des jetons** : demandez uniquement `chat:read` et `chat:write`.
- **En cas de blocage** : redémarrez le Gateway après avoir vérifié qu’aucun autre processus ne détient la session.

## Limites

- **500 caractères** par message ; les réponses plus longues sont découpées aux limites des mots.
- Le Markdown est supprimé avant l’envoi (le chat Twitch utilise du texte brut ; les sauts de ligne deviennent des espaces).
- OpenClaw n’ajoute aucune limitation de débit propre ; le client de chat Twurple gère les limites de débit de Twitch.

## Pages connexes

- [Routage des canaux](/fr/channels/channel-routing) — routage des sessions pour les messages
- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et filtrage par mention
- [Appairage](/fr/channels/pairing) — authentification par message privé et processus d’appairage
- [Sécurité](/fr/gateway/security) — modèle d’accès et renforcement de la sécurité
