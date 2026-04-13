---
read_when:
    - Vous voulez connecter un bot Feishu/Lark
    - Vous configurez le canal Feishu
summary: Aperçu du bot Feishu, fonctionnalités et configuration
title: Feishu
x-i18n:
    generated_at: "2026-04-13T12:36:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 77fcf95a3fab534ed898bc157d76bf8bdfa8bf8a918d6af84c0db19890916c1a
    source_path: channels/feishu.md
    workflow: 15
---

# Feishu / Lark

Feishu/Lark est une plateforme de collaboration tout-en-un où les équipes discutent, partagent des documents, gèrent des calendriers et travaillent ensemble.

**Statut :** prêt pour la production pour les DM de bot et les discussions de groupe. WebSocket est le mode par défaut ; le mode webhook est facultatif.

---

## Démarrage rapide

> **Nécessite OpenClaw 2026.4.10 ou version ultérieure.** Exécutez `openclaw --version` pour vérifier. Mettez à jour avec `openclaw update`.

<Steps>
  <Step title="Exécuter l’assistant de configuration du canal">
  ```bash
  openclaw channels login --channel feishu
  ```
  Scannez le code QR avec votre application mobile Feishu/Lark pour créer automatiquement un bot Feishu/Lark.
  </Step>
  
  <Step title="Une fois la configuration terminée, redémarrez la Gateway pour appliquer les modifications">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## Contrôle d’accès

### Messages directs

Configurez `dmPolicy` pour contrôler qui peut envoyer des DM au bot :

- `"pairing"` — les utilisateurs inconnus reçoivent un code d’association ; approuvez-le via la CLI
- `"allowlist"` — seuls les utilisateurs listés dans `allowFrom` peuvent discuter (par défaut : propriétaire du bot uniquement)
- `"open"` — autoriser tous les utilisateurs
- `"disabled"` — désactiver tous les DM

**Approuver une demande d’association :**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Discussions de groupe

**Politique de groupe** (`channels.feishu.groupPolicy`) :

| Value         | Behavior                                   |
| ------------- | ------------------------------------------ |
| `"open"`      | Répondre à tous les messages dans les groupes |
| `"allowlist"` | Répondre uniquement aux groupes de `groupAllowFrom` |
| `"disabled"`  | Désactiver tous les messages de groupe     |

Par défaut : `allowlist`

**Exigence de mention** (`channels.feishu.requireMention`) :

- `true` — exiger une @mention (par défaut)
- `false` — répondre sans @mention
- Remplacement par groupe : `channels.feishu.groups.<chat_id>.requireMention`

---

## Exemples de configuration de groupe

### Autoriser tous les groupes, sans @mention requise

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### Autoriser tous les groupes, tout en exigeant une @mention

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
      requireMention: true,
    },
  },
}
```

### Autoriser uniquement certains groupes

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // Les ID de groupe ressemblent à : oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

### Restreindre les expéditeurs dans un groupe

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // Les open_id utilisateur ressemblent à : ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

---

## Obtenir les ID de groupe/utilisateur

### ID de groupe (`chat_id`, format : `oc_xxx`)

Ouvrez le groupe dans Feishu/Lark, cliquez sur l’icône de menu en haut à droite, puis accédez à **Settings**. L’ID du groupe (`chat_id`) est affiché sur la page des paramètres.

![Get Group ID](/images/feishu-get-group-id.png)

### ID utilisateur (`open_id`, format : `ou_xxx`)

Démarrez la Gateway, envoyez un DM au bot, puis consultez les journaux :

```bash
openclaw logs --follow
```

Recherchez `open_id` dans la sortie des journaux. Vous pouvez aussi consulter les demandes d’association en attente :

```bash
openclaw pairing list feishu
```

---

## Commandes courantes

| Commande  | Description                        |
| --------- | ---------------------------------- |
| `/status` | Afficher le statut du bot          |
| `/reset`  | Réinitialiser la session en cours  |
| `/model`  | Afficher ou changer le modèle d’IA |

> Feishu/Lark ne prend pas en charge les menus natifs de commandes slash ; envoyez donc ces commandes comme de simples messages texte.

---

## Dépannage

### Le bot ne répond pas dans les discussions de groupe

1. Assurez-vous que le bot est ajouté au groupe
2. Assurez-vous de @mentionner le bot (requis par défaut)
3. Vérifiez que `groupPolicy` n’est pas `"disabled"`
4. Consultez les journaux : `openclaw logs --follow`

### Le bot ne reçoit pas les messages

1. Assurez-vous que le bot est publié et approuvé dans Feishu Open Platform / Lark Developer
2. Assurez-vous que l’abonnement aux événements inclut `im.message.receive_v1`
3. Assurez-vous que la **connexion persistante** (WebSocket) est sélectionnée
4. Assurez-vous que toutes les autorisations requises sont accordées
5. Assurez-vous que la Gateway est en cours d’exécution : `openclaw gateway status`
6. Consultez les journaux : `openclaw logs --follow`

### App Secret divulgué

1. Réinitialisez l’App Secret dans Feishu Open Platform / Lark Developer
2. Mettez à jour la valeur dans votre configuration
3. Redémarrez la Gateway : `openclaw gateway restart`

---

## Configuration avancée

### Comptes multiples

```json5
{
  channels: {
    feishu: {
      defaultAccount: "main",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          name: "Bot principal",
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "Bot de secours",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` contrôle quel compte est utilisé lorsque les API sortantes ne spécifient pas de `accountId`.

### Limites des messages

- `textChunkLimit` — taille des segments de texte sortants (par défaut : `2000` caractères)
- `mediaMaxMb` — limite d’envoi/téléchargement des médias (par défaut : `30` MB)

### Streaming

Feishu/Lark prend en charge les réponses en streaming via des cartes interactives. Lorsqu’elle est activée, le bot met à jour la carte en temps réel à mesure qu’il génère le texte.

```json5
{
  channels: {
    feishu: {
      streaming: true, // activer la sortie par carte en streaming (par défaut : true)
      blockStreaming: true, // activer le streaming au niveau des blocs (par défaut : true)
    },
  },
}
```

Définissez `streaming: false` pour envoyer la réponse complète dans un seul message.

### Optimisation du quota

Réduisez le nombre d’appels à l’API Feishu/Lark avec deux drapeaux facultatifs :

- `typingIndicator` (par défaut `true`) : définissez `false` pour ignorer les appels de réaction de saisie
- `resolveSenderNames` (par défaut `true`) : définissez `false` pour ignorer les recherches de profil de l’expéditeur

```json5
{
  channels: {
    feishu: {
      typingIndicator: false,
      resolveSenderNames: false,
    },
  },
}
```

### Sessions ACP

Feishu/Lark prend en charge ACP pour les DM et les messages de fil de groupe. ACP sur Feishu/Lark fonctionne via des commandes texte — il n’existe pas de menus natifs de commandes slash, utilisez donc directement des messages `/acp ...` dans la conversation.

#### Liaison ACP persistante

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "direct", id: "ou_1234567890" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "group", id: "oc_group_chat:topic:om_topic_root" },
      },
      acp: { label: "codex-feishu-topic" },
    },
  ],
}
```

#### Lancer ACP depuis la discussion

Dans un DM ou un fil Feishu/Lark :

```text
/acp spawn codex --thread here
```

`--thread here` fonctionne pour les DM et les messages de fil Feishu/Lark. Les messages suivants dans la conversation liée sont routés directement vers cette session ACP.

### Routage multi-agent

Utilisez `bindings` pour router les DM ou groupes Feishu/Lark vers différents agents.

```json5
{
  agents: {
    list: [
      { id: "main" },
      { id: "agent-a", workspace: "/home/user/agent-a" },
      { id: "agent-b", workspace: "/home/user/agent-b" },
    ],
  },
  bindings: [
    {
      agentId: "agent-a",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "feishu",
        peer: { kind: "group", id: "oc_zzz" },
      },
    },
  ],
}
```

Champs de routage :

- `match.channel` : `"feishu"`
- `match.peer.kind` : `"direct"` (DM) ou `"group"` (discussion de groupe)
- `match.peer.id` : Open ID utilisateur (`ou_xxx`) ou ID de groupe (`oc_xxx`)

Consultez [Obtenir les ID de groupe/utilisateur](#get-groupuser-ids) pour des conseils de recherche.

---

## Référence de configuration

Configuration complète : [Configuration de la Gateway](/fr/gateway/configuration)

| Setting                                           | Description                                | Default          |
| ------------------------------------------------- | ------------------------------------------ | ---------------- |
| `channels.feishu.enabled`                         | Activer/désactiver le canal                | `true`           |
| `channels.feishu.domain`                          | Domaine API (`feishu` ou `lark`)           | `feishu`         |
| `channels.feishu.connectionMode`                  | Transport d’événement (`websocket` ou `webhook`) | `websocket`      |
| `channels.feishu.defaultAccount`                  | Compte par défaut pour le routage sortant  | `default`        |
| `channels.feishu.verificationToken`               | Requis pour le mode webhook                | —                |
| `channels.feishu.encryptKey`                      | Requis pour le mode webhook                | —                |
| `channels.feishu.webhookPath`                     | Chemin de route du webhook                 | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Hôte de liaison du webhook                 | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Port de liaison du webhook                 | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | ID d’application                           | —                |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret                                 | —                |
| `channels.feishu.accounts.<id>.domain`            | Remplacement de domaine par compte         | `feishu`         |
| `channels.feishu.dmPolicy`                        | Politique de DM                            | `allowlist`      |
| `channels.feishu.allowFrom`                       | Liste d’autorisation DM (liste d’`open_id`) | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | Politique de groupe                        | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | Liste d’autorisation des groupes           | —                |
| `channels.feishu.requireMention`                  | Exiger une @mention dans les groupes       | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | Remplacement de @mention par groupe        | inherited        |
| `channels.feishu.groups.<chat_id>.enabled`        | Activer/désactiver un groupe spécifique    | `true`           |
| `channels.feishu.textChunkLimit`                  | Taille des segments de message             | `2000`           |
| `channels.feishu.mediaMaxMb`                      | Limite de taille des médias                | `30`             |
| `channels.feishu.streaming`                       | Sortie de carte en streaming               | `true`           |
| `channels.feishu.blockStreaming`                  | Streaming au niveau des blocs              | `true`           |
| `channels.feishu.typingIndicator`                 | Envoyer des réactions de saisie            | `true`           |
| `channels.feishu.resolveSenderNames`              | Résoudre les noms d’affichage des expéditeurs | `true`           |

---

## Types de messages pris en charge

### Réception

- ✅ Texte
- ✅ Texte enrichi (post)
- ✅ Images
- ✅ Fichiers
- ✅ Audio
- ✅ Vidéo/média
- ✅ Autocollants

### Envoi

- ✅ Texte
- ✅ Images
- ✅ Fichiers
- ✅ Audio
- ✅ Vidéo/média
- ✅ Cartes interactives (y compris les mises à jour en streaming)
- ⚠️ Texte enrichi (mise en forme de type post ; ne prend pas en charge toutes les capacités de rédaction Feishu/Lark)

### Fils et réponses

- ✅ Réponses en ligne
- ✅ Réponses dans les fils
- ✅ Les réponses média restent compatibles avec les fils lors d’une réponse à un message de fil

---

## Lié

- [Aperçu des canaux](/fr/channels) — tous les canaux pris en charge
- [Association](/fr/channels/pairing) — authentification DM et flux d’association
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et contrôle par mention
- [Routage des canaux](/fr/channels/channel-routing) — routage des sessions pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et durcissement
