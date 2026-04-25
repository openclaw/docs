---
read_when:
    - Vous souhaitez connecter un bot Feishu/Lark
    - Vous configurez le canal Feishu
summary: Présentation du bot Feishu, fonctionnalités et configuration
title: Feishu
x-i18n:
    generated_at: "2026-04-25T13:41:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b9cebcedf05a517b03a15ae306cece1a3c07f772c48c54b7ece05ef892d05d2
    source_path: channels/feishu.md
    workflow: 15
---

# Feishu / Lark

Feishu/Lark est une plateforme de collaboration tout-en-un où les équipes discutent, partagent des documents, gèrent des calendriers et travaillent ensemble.

**Statut :** prêt pour la production pour les messages privés du bot et les conversations de groupe. WebSocket est le mode par défaut ; le mode Webhook est optionnel.

---

## Démarrage rapide

> **Nécessite OpenClaw 2026.4.25 ou une version ultérieure.** Exécutez `openclaw --version` pour vérifier. Mettez à jour avec `openclaw update`.

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

### Messages privés

Configurez `dmPolicy` pour contrôler qui peut envoyer un message privé au bot :

- `"pairing"` — les utilisateurs inconnus reçoivent un code d’appairage ; approuvez via la CLI
- `"allowlist"` — seuls les utilisateurs répertoriés dans `allowFrom` peuvent discuter (par défaut : propriétaire du bot uniquement)
- `"open"` — autoriser tous les utilisateurs
- `"disabled"` — désactiver tous les messages privés

**Approuver une demande d’appairage :**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Conversations de groupe

**Politique de groupe** (`channels.feishu.groupPolicy`) :

| Value         | Behavior                                   |
| ------------- | ------------------------------------------ |
| `"open"`      | Répondre à tous les messages dans les groupes |
| `"allowlist"` | Répondre uniquement aux groupes dans `groupAllowFrom` |
| `"disabled"`  | Désactiver tous les messages de groupe                 |

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

### Autoriser uniquement des groupes spécifiques

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

### Restreindre les expéditeurs au sein d’un groupe

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // Les open_id des utilisateurs ressemblent à : ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

---

<a id="get-groupuser-ids"></a>

## Obtenir les ID de groupe/utilisateur

### ID de groupe (`chat_id`, format : `oc_xxx`)

Ouvrez le groupe dans Feishu/Lark, cliquez sur l’icône de menu en haut à droite, puis accédez à **Settings**. L’ID du groupe (`chat_id`) est affiché sur la page des paramètres.

![Get Group ID](/images/feishu-get-group-id.png)

### ID utilisateur (`open_id`, format : `ou_xxx`)

Démarrez la Gateway, envoyez ensuite un message privé au bot, puis consultez les journaux :

```bash
openclaw logs --follow
```

Recherchez `open_id` dans la sortie des journaux. Vous pouvez également consulter les demandes d’appairage en attente :

```bash
openclaw pairing list feishu
```

---

## Commandes courantes

| Command   | Description                 |
| --------- | --------------------------- |
| `/status` | Afficher le statut du bot             |
| `/reset`  | Réinitialiser la session en cours   |
| `/model`  | Afficher ou changer le modèle d’IA |

> Feishu/Lark ne prend pas en charge les menus natifs de commandes slash, envoyez donc ces commandes sous forme de messages texte simples.

---

## Dépannage

### Le bot ne répond pas dans les conversations de groupe

1. Assurez-vous que le bot a été ajouté au groupe
2. Assurez-vous de @mentionner le bot (requis par défaut)
3. Vérifiez que `groupPolicy` n’est pas `"disabled"`
4. Vérifiez les journaux : `openclaw logs --follow`

### Le bot ne reçoit pas les messages

1. Assurez-vous que le bot est publié et approuvé dans Feishu Open Platform / Lark Developer
2. Assurez-vous que l’abonnement aux événements inclut `im.message.receive_v1`
3. Assurez-vous que la **connexion persistante** (WebSocket) est sélectionnée
4. Assurez-vous que toutes les autorisations requises ont été accordées
5. Assurez-vous que la Gateway est en cours d’exécution : `openclaw gateway status`
6. Vérifiez les journaux : `openclaw logs --follow`

### Fuite de l’App Secret

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

Feishu/Lark prend en charge les réponses en streaming via des cartes interactives. Lorsqu’il est activé, le bot met à jour la carte en temps réel à mesure qu’il génère du texte.

```json5
{
  channels: {
    feishu: {
      streaming: true, // activer la sortie de carte en streaming (par défaut : true)
      blockStreaming: true, // activer le streaming au niveau des blocs (par défaut : true)
    },
  },
}
```

Définissez `streaming: false` pour envoyer la réponse complète dans un seul message.

### Optimisation du quota

Réduisez le nombre d’appels API Feishu/Lark avec deux indicateurs optionnels :

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

Feishu/Lark prend en charge ACP pour les messages privés et les messages de fil de groupe. ACP sur Feishu/Lark est piloté par des commandes textuelles — il n’y a pas de menus natifs de commandes slash, utilisez donc directement des messages `/acp ...` dans la conversation.

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

#### Lancer ACP depuis la conversation

Dans un message privé ou un fil Feishu/Lark :

```text
/acp spawn codex --thread here
```

`--thread here` fonctionne pour les messages privés et les messages de fil Feishu/Lark. Les messages suivants dans la conversation liée sont acheminés directement vers cette session ACP.

### Routage multi-agent

Utilisez `bindings` pour acheminer les messages privés ou les groupes Feishu/Lark vers différents agents.

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

- `match.channel`: `"feishu"`
- `match.peer.kind`: `"direct"` (message privé) ou `"group"` (conversation de groupe)
- `match.peer.id`: Open ID utilisateur (`ou_xxx`) ou ID de groupe (`oc_xxx`)

Consultez [Obtenir les ID de groupe/utilisateur](#get-groupuser-ids) pour des conseils de recherche.

---

## Référence de configuration

Configuration complète : [Configuration de la Gateway](/fr/gateway/configuration)

| Setting                                           | Description                                | Default          |
| ------------------------------------------------- | ------------------------------------------ | ---------------- |
| `channels.feishu.enabled`                         | Activer/désactiver le canal                 | `true`           |
| `channels.feishu.domain`                          | Domaine API (`feishu` ou `lark`)            | `feishu`         |
| `channels.feishu.connectionMode`                  | Transport des événements (`websocket` ou `webhook`) | `websocket`      |
| `channels.feishu.defaultAccount`                  | Compte par défaut pour le routage sortant       | `default`        |
| `channels.feishu.verificationToken`               | Requis pour le mode Webhook                  | —                |
| `channels.feishu.encryptKey`                      | Requis pour le mode Webhook                  | —                |
| `channels.feishu.webhookPath`                     | Chemin de route Webhook                         | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Hôte de liaison Webhook                          | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Port de liaison Webhook                          | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | ID de l’application                                     | —                |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret                                 | —                |
| `channels.feishu.accounts.<id>.domain`            | Remplacement du domaine par compte                | `feishu`         |
| `channels.feishu.dmPolicy`                        | Politique de message privé                                  | `allowlist`      |
| `channels.feishu.allowFrom`                       | Liste d’autorisation des messages privés (liste de `open_id`)                | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | Politique de groupe                               | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | Liste d’autorisation de groupe                            | —                |
| `channels.feishu.requireMention`                  | Exiger une @mention dans les groupes                 | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | Remplacement de @mention par groupe                | hérité        |
| `channels.feishu.groups.<chat_id>.enabled`        | Activer/désactiver un groupe spécifique            | `true`           |
| `channels.feishu.textChunkLimit`                  | Taille des segments de message                         | `2000`           |
| `channels.feishu.mediaMaxMb`                      | Limite de taille des médias                           | `30`             |
| `channels.feishu.streaming`                       | Sortie de carte en streaming                      | `true`           |
| `channels.feishu.blockStreaming`                  | Streaming au niveau des blocs                      | `true`           |
| `channels.feishu.typingIndicator`                 | Envoyer des réactions de saisie                      | `true`           |
| `channels.feishu.resolveSenderNames`              | Résoudre les noms d’affichage des expéditeurs               | `true`           |

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
- ⚠️ Texte enrichi (formatage de type post ; ne prend pas en charge toutes les capacités de rédaction Feishu/Lark)

Les bulles audio natives Feishu/Lark utilisent le type de message Feishu `audio` et nécessitent un média Ogg/Opus téléversé (`file_type: "opus"`). Les médias `.opus` et `.ogg` existants sont envoyés directement comme audio natif. Les formats MP3/WAV/M4A et autres formats audio probables sont transcodés en Ogg/Opus 48 kHz avec `ffmpeg` uniquement lorsque la réponse demande une livraison vocale (`audioAsVoice` / outil de message `asVoice`, y compris les réponses de note vocale TTS). Les pièces jointes MP3 ordinaires restent des fichiers classiques. Si `ffmpeg` est absent ou si la conversion échoue, OpenClaw revient à une pièce jointe de fichier et consigne la raison.

### Fils et réponses

- ✅ Réponses intégrées
- ✅ Réponses dans les fils
- ✅ Les réponses média restent compatibles avec les fils lors d’une réponse à un message de fil

Pour `groupSessionScope: "group_topic"` et `"group_topic_sender"`, les groupes de sujets natifs Feishu/Lark utilisent l’événement `thread_id` (`omt_*`) comme clé canonique de session de sujet. Les réponses de groupe normales qu’OpenClaw transforme en fils continuent d’utiliser l’ID du message racine de la réponse (`om_*`) afin que le premier tour et le tour de suivi restent dans la même session.

---

## Liens associés

- [Aperçu des canaux](/fr/channels) — tous les canaux pris en charge
- [Appairage](/fr/channels/pairing) — authentification par message privé et flux d’appairage
- [Groupes](/fr/channels/groups) — comportement des conversations de groupe et contrôle par mention
- [Routage des canaux](/fr/channels/channel-routing) — routage de session pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et durcissement
