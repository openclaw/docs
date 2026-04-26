---
read_when:
    - Vous souhaitez connecter un bot Feishu/Lark
    - Vous configurez le canal Feishu
summary: Vue d’ensemble du bot Feishu, fonctionnalités et configuration
title: Feishu
x-i18n:
    generated_at: "2026-04-26T11:22:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 95a50a7cd7b290afe0a0db3a1b39c7305f6a0e7d0702597fb9a50b5a45afa855
    source_path: channels/feishu.md
    workflow: 15
---

# Feishu / Lark

Feishu/Lark est une plateforme de collaboration tout-en-un où les équipes discutent, partagent des documents, gèrent des calendriers et travaillent ensemble.

**Statut :** prêt pour la production pour les messages privés du bot et les discussions de groupe. WebSocket est le mode par défaut ; le mode Webhook est facultatif.

---

## Démarrage rapide

> **Nécessite OpenClaw 2026.4.25 ou version ultérieure.** Exécutez `openclaw --version` pour vérifier. Mettez à jour avec `openclaw update`.

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

Configurez `dmPolicy` pour contrôler qui peut envoyer des messages privés au bot :

- `"pairing"` — les utilisateurs inconnus reçoivent un code d’association ; approuvez-le via la CLI
- `"allowlist"` — seuls les utilisateurs listés dans `allowFrom` peuvent discuter (par défaut : uniquement le propriétaire du bot)
- `"open"` — autoriser tous les utilisateurs
- `"disabled"` — désactiver tous les messages privés

**Approuver une demande d’association :**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Discussions de groupe

**Politique de groupe** (`channels.feishu.groupPolicy`) :

| Value         | Comportement                               |
| ------------- | ------------------------------------------ |
| `"open"`      | Répond à tous les messages dans les groupes |
| `"allowlist"` | Répond uniquement aux groupes dans `groupAllowFrom` |
| `"disabled"`  | Désactive tous les messages de groupe      |

Par défaut : `allowlist`

**Obligation de mention** (`channels.feishu.requireMention`) :

- `true` — nécessite une @mention (par défaut)
- `false` — répond sans @mention
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

### Restreindre les expéditeurs dans un groupe

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

Ouvrez le groupe dans Feishu/Lark, cliquez sur l’icône de menu en haut à droite, puis allez dans **Settings**. L’ID du groupe (`chat_id`) est affiché sur la page des paramètres.

![Get Group ID](/images/feishu-get-group-id.png)

### ID utilisateur (`open_id`, format : `ou_xxx`)

Démarrez la Gateway, envoyez un message privé au bot, puis vérifiez les journaux :

```bash
openclaw logs --follow
```

Recherchez `open_id` dans la sortie des journaux. Vous pouvez également vérifier les demandes d’association en attente :

```bash
openclaw pairing list feishu
```

---

## Commandes courantes

| Command   | Description                      |
| --------- | -------------------------------- |
| `/status` | Affiche le statut du bot         |
| `/reset`  | Réinitialise la session en cours |
| `/model`  | Affiche ou change le modèle d’IA |

> Feishu/Lark ne prend pas en charge nativement les menus de commandes slash ; envoyez donc celles-ci sous forme de messages texte simples.

---

## Dépannage

### Le bot ne répond pas dans les discussions de groupe

1. Assurez-vous que le bot a été ajouté au groupe
2. Assurez-vous de @mentionner le bot (obligatoire par défaut)
3. Vérifiez que `groupPolicy` n’est pas défini sur `"disabled"`
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
          name: "Primary bot",
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` contrôle quel compte est utilisé lorsque les API sortantes ne spécifient pas d’`accountId`.
`accounts.<id>.tts` utilise la même structure que `messages.tts` et fusionne en profondeur par-dessus la configuration TTS globale ; ainsi, les configurations Feishu multi-bot peuvent conserver globalement des identifiants de fournisseur partagés tout en remplaçant uniquement la voix, le modèle, la persona ou le mode automatique par compte.

### Limites de message

- `textChunkLimit` — taille des segments de texte sortants (par défaut : `2000` caractères)
- `mediaMaxMb` — limite d’envoi/téléchargement des médias (par défaut : `30` Mo)

### Streaming

Feishu/Lark prend en charge les réponses en streaming via des cartes interactives. Lorsqu’il est activé, le bot met à jour la carte en temps réel pendant qu’il génère le texte.

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

Réduisez le nombre d’appels d’API Feishu/Lark avec deux indicateurs facultatifs :

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

Feishu/Lark prend en charge ACP pour les messages privés et les messages de fil de groupe. L’ACP Feishu/Lark est piloté par commandes texte — il n’existe pas de menus de commandes slash natifs, utilisez donc directement des messages `/acp ...` dans la conversation.

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

Dans un message privé ou un fil Feishu/Lark :

```text
/acp spawn codex --thread here
```

`--thread here` fonctionne pour les messages privés et les messages de fil Feishu/Lark. Les messages de suivi dans la conversation liée sont routés directement vers cette session ACP.

### Routage multi-agent

Utilisez `bindings` pour router les messages privés ou les groupes Feishu/Lark vers différents agents.

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
- `match.peer.kind` : `"direct"` (message privé) ou `"group"` (discussion de groupe)
- `match.peer.id` : Open ID utilisateur (`ou_xxx`) ou ID de groupe (`oc_xxx`)

Consultez [Obtenir les ID de groupe/utilisateur](#get-groupuser-ids) pour des conseils de recherche.

---

## Référence de configuration

Configuration complète : [Configuration de la Gateway](/fr/gateway/configuration)

| Setting                                           | Description                                     | Default          |
| ------------------------------------------------- | ----------------------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | Activer/désactiver le canal                     | `true`           |
| `channels.feishu.domain`                          | Domaine d’API (`feishu` ou `lark`)              | `feishu`         |
| `channels.feishu.connectionMode`                  | Transport des événements (`websocket` ou `webhook`) | `websocket`      |
| `channels.feishu.defaultAccount`                  | Compte par défaut pour le routage sortant       | `default`        |
| `channels.feishu.verificationToken`               | Requis pour le mode webhook                     | —                |
| `channels.feishu.encryptKey`                      | Requis pour le mode webhook                     | —                |
| `channels.feishu.webhookPath`                     | Chemin de route webhook                         | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Hôte de liaison webhook                         | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Port de liaison webhook                         | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | App ID                                          | —                |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret                                      | —                |
| `channels.feishu.accounts.<id>.domain`            | Remplacement de domaine par compte              | `feishu`         |
| `channels.feishu.accounts.<id>.tts`               | Remplacement TTS par compte                     | `messages.tts`   |
| `channels.feishu.dmPolicy`                        | Politique des messages privés                   | `allowlist`      |
| `channels.feishu.allowFrom`                       | Liste d’autorisation des messages privés (liste d’`open_id`) | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | Politique de groupe                             | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | Liste d’autorisation des groupes                | —                |
| `channels.feishu.requireMention`                  | Exiger une @mention dans les groupes            | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | Remplacement de @mention par groupe             | inherited        |
| `channels.feishu.groups.<chat_id>.enabled`        | Activer/désactiver un groupe spécifique         | `true`           |
| `channels.feishu.textChunkLimit`                  | Taille des segments de message                  | `2000`           |
| `channels.feishu.mediaMaxMb`                      | Limite de taille des médias                     | `30`             |
| `channels.feishu.streaming`                       | Sortie par carte en streaming                   | `true`           |
| `channels.feishu.blockStreaming`                  | Streaming au niveau des blocs                   | `true`           |
| `channels.feishu.typingIndicator`                 | Envoyer des réactions de saisie                 | `true`           |
| `channels.feishu.resolveSenderNames`              | Résoudre les noms d’affichage des expéditeurs   | `true`           |

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

Les messages audio Feishu/Lark entrants sont normalisés sous forme d’espaces réservés média au lieu de JSON `file_key` brut. Lorsque `tools.media.audio` est configuré, OpenClaw télécharge la ressource de note vocale et exécute la transcription audio partagée avant le tour de l’agent, de sorte que l’agent reçoive la transcription de la parole. Si Feishu inclut directement le texte transcrit dans la charge utile audio, ce texte est utilisé sans autre appel ASR. Sans fournisseur de transcription audio, l’agent reçoit quand même un espace réservé `<media:audio>` ainsi que la pièce jointe enregistrée, et non la charge utile de ressource Feishu brute.

### Envoi

- ✅ Texte
- ✅ Images
- ✅ Fichiers
- ✅ Audio
- ✅ Vidéo/média
- ✅ Cartes interactives (y compris les mises à jour en streaming)
- ⚠️ Texte enrichi (formatage de style post ; ne prend pas en charge toutes les capacités de création Feishu/Lark)

Les bulles audio Feishu/Lark natives utilisent le type de message Feishu `audio` et nécessitent un média Ogg/Opus téléversé (`file_type: "opus"`). Les médias `.opus` et `.ogg` existants sont envoyés directement comme audio natif. Les formats MP3/WAV/M4A et autres formats audio probables sont transcodés en Ogg/Opus 48 kHz avec `ffmpeg` uniquement lorsque la réponse demande une diffusion vocale (`audioAsVoice` / outil de message `asVoice`, y compris les réponses de note vocale TTS). Les pièces jointes MP3 ordinaires restent des fichiers classiques. Si `ffmpeg` est absent ou si la conversion échoue, OpenClaw bascule vers une pièce jointe de fichier et consigne la raison.

### Fils et réponses

- ✅ Réponses en ligne
- ✅ Réponses dans les fils
- ✅ Les réponses média conservent la prise en compte du fil lors d’une réponse à un message de fil

Pour `groupSessionScope: "group_topic"` et `"group_topic_sender"`, les groupes de sujets Feishu/Lark natifs utilisent l’événement `thread_id` (`omt_*`) comme clé de session de sujet canonique. Les réponses de groupe normales qu’OpenClaw transforme en fils continuent d’utiliser l’ID du message racine de réponse (`om_*`) afin que le premier tour et le tour de suivi restent dans la même session.

---

## Liens connexes

- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Association](/fr/channels/pairing) — authentification par message privé et flux d’association
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et contrôle par mention
- [Routage des canaux](/fr/channels/channel-routing) — routage de session pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et renforcement de la sécurité
