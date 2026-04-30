---
read_when:
    - Vous souhaitez connecter un bot Yuanbao
    - Vous configurez le canal Yuanbao
summary: Présentation du bot Yuanbao, fonctionnalités et configuration
title: Yuanbao
x-i18n:
    generated_at: "2026-04-30T07:15:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: d82b6d275ae8aa4cc5e62321772c5ba2b5044c6058be0d2e5215cdb1488118e9
    source_path: channels/yuanbao.md
    workflow: 16
---

# Yuanbao

Tencent Yuanbao est la plateforme d’assistant IA de Tencent. Le Plugin de canal OpenClaw
connecte les bots Yuanbao à OpenClaw via WebSocket afin qu’ils puissent interagir avec les utilisateurs
par messages directs et discussions de groupe.

**État :** prêt pour la production pour les DM de bot et les discussions de groupe. WebSocket est le seul mode de connexion pris en charge.

---

## Démarrage rapide

> **Nécessite OpenClaw 2026.4.10 ou une version ultérieure.** Exécutez `openclaw --version` pour vérifier. Mettez à niveau avec `openclaw update`.

<Steps>
  <Step title="Ajoutez le canal Yuanbao avec vos identifiants">
  ```bash
  openclaw channels add --channel yuanbao --token "appKey:appSecret"
  ```
  La valeur `--token` utilise le format `appKey:appSecret` séparé par deux-points. Vous pouvez les obtenir depuis l’application Yuanbao en créant un robot dans les paramètres de votre application.
  </Step>

  <Step title="Une fois la configuration terminée, redémarrez le gateway pour appliquer les modifications">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

### Configuration interactive (alternative)

Vous pouvez également utiliser l’assistant interactif :

```bash
openclaw channels login --channel yuanbao
```

Suivez les invites pour saisir votre App ID et votre App Secret.

---

## Contrôle d’accès

### Messages directs

Configurez `dmPolicy` pour contrôler qui peut envoyer un DM au bot :

- `"pairing"` — les utilisateurs inconnus reçoivent un code d’appairage ; approuvez via la CLI
- `"allowlist"` — seuls les utilisateurs listés dans `allowFrom` peuvent discuter
- `"open"` — autoriser tous les utilisateurs (par défaut)
- `"disabled"` — désactiver tous les DM

**Approuver une demande d’appairage :**

```bash
openclaw pairing list yuanbao
openclaw pairing approve yuanbao <CODE>
```

### Discussions de groupe

**Exigence de mention** (`channels.yuanbao.requireMention`) :

- `true` — exiger une @mention (par défaut)
- `false` — répondre sans @mention

Répondre au message du bot dans une discussion de groupe est traité comme une mention implicite.

---

## Exemples de configuration

### Configuration de base avec une politique de DM ouverte

```json5
{
  channels: {
    yuanbao: {
      appKey: "your_app_key",
      appSecret: "your_app_secret",
      dm: {
        policy: "open",
      },
    },
  },
}
```

### Restreindre les DM à des utilisateurs spécifiques

```json5
{
  channels: {
    yuanbao: {
      appKey: "your_app_key",
      appSecret: "your_app_secret",
      dm: {
        policy: "allowlist",
        allowFrom: ["user_id_1", "user_id_2"],
      },
    },
  },
}
```

### Désactiver l’exigence de @mention dans les groupes

```json5
{
  channels: {
    yuanbao: {
      requireMention: false,
    },
  },
}
```

### Optimiser la distribution des messages sortants

```json5
{
  channels: {
    yuanbao: {
      // Send each chunk immediately without buffering
      outboundQueueStrategy: "immediate",
    },
  },
}
```

### Ajuster la stratégie de fusion de texte

```json5
{
  channels: {
    yuanbao: {
      outboundQueueStrategy: "merge-text",
      minChars: 2800, // buffer until this many chars
      maxChars: 3000, // force split above this limit
      idleMs: 5000, // auto-flush after idle timeout (ms)
    },
  },
}
```

---

## Commandes courantes

| Commande   | Description                              |
| ---------- | ---------------------------------------- |
| `/help`    | Afficher les commandes disponibles       |
| `/status`  | Afficher l’état du bot                   |
| `/new`     | Démarrer une nouvelle session            |
| `/stop`    | Arrêter l’exécution en cours             |
| `/restart` | Redémarrer OpenClaw                      |
| `/compact` | Compacter le contexte de la session      |

> Yuanbao prend en charge les menus natifs de commandes slash. Les commandes sont synchronisées automatiquement avec la plateforme au démarrage du gateway.

---

## Dépannage

### Le bot ne répond pas dans les discussions de groupe

1. Assurez-vous que le bot est ajouté au groupe
2. Assurez-vous de @mentionner le bot (requis par défaut)
3. Vérifiez les journaux : `openclaw logs --follow`

### Le bot ne reçoit pas les messages

1. Assurez-vous que le bot est créé et approuvé dans l’application Yuanbao
2. Assurez-vous que `appKey` et `appSecret` sont correctement configurés
3. Assurez-vous que le gateway est en cours d’exécution : `openclaw gateway status`
4. Vérifiez les journaux : `openclaw logs --follow`

### Le bot envoie des réponses vides ou de secours

1. Vérifiez si le modèle IA renvoie du contenu valide
2. La réponse de secours par défaut est : "暂时无法解答，你可以换个问题问问我哦"
3. Personnalisez-la via `channels.yuanbao.fallbackReply`

### App Secret divulgué

1. Réinitialisez l’App Secret dans YuanBao APP
2. Mettez à jour la valeur dans votre configuration
3. Redémarrez le gateway : `openclaw gateway restart`

---

## Configuration avancée

### Plusieurs comptes

```json5
{
  channels: {
    yuanbao: {
      defaultAccount: "main",
      accounts: {
        main: {
          appKey: "key_xxx",
          appSecret: "secret_xxx",
          name: "Primary bot",
        },
        backup: {
          appKey: "key_yyy",
          appSecret: "secret_yyy",
          name: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` contrôle le compte utilisé lorsque les API sortantes ne spécifient pas d’`accountId`.

### Limites de messages

- `maxChars` — nombre maximal de caractères d’un message unique (par défaut : `3000` caractères)
- `mediaMaxMb` — limite de téléversement/téléchargement de médias (par défaut : `20` Mo)
- `overflowPolicy` — comportement lorsque le message dépasse la limite : `"split"` (par défaut) ou `"stop"`

### Streaming

Yuanbao prend en charge la sortie en streaming au niveau des blocs. Lorsqu’elle est activée, le bot envoie le texte par fragments au fil de la génération.

```json5
{
  channels: {
    yuanbao: {
      disableBlockStreaming: false, // block streaming enabled (default)
    },
  },
}
```

Définissez `disableBlockStreaming: true` pour envoyer la réponse complète dans un seul message.

### Contexte d’historique des discussions de groupe

Contrôlez le nombre de messages historiques inclus dans le contexte IA pour les discussions de groupe :

```json5
{
  channels: {
    yuanbao: {
      historyLimit: 100, // default: 100, set 0 to disable
    },
  },
}
```

### Mode de réponse citée

Contrôlez la façon dont le bot cite les messages lorsqu’il répond dans les discussions de groupe :

```json5
{
  channels: {
    yuanbao: {
      replyToMode: "first", // "off" | "first" | "all" (default: "first")
    },
  },
}
```

| Valeur    | Comportement                                                    |
| --------- | --------------------------------------------------------------- |
| `"off"`   | Aucune réponse citée                                            |
| `"first"` | Citer uniquement la première réponse par message entrant (par défaut) |
| `"all"`   | Citer chaque réponse                                            |

### Injection d’indication Markdown

Par défaut, le bot injecte des instructions dans le prompt système pour empêcher le modèle IA d’envelopper toute la réponse dans des blocs de code markdown.

```json5
{
  channels: {
    yuanbao: {
      markdownHintEnabled: true, // default: true
    },
  },
}
```

### Mode de débogage

Activez la sortie de journaux non nettoyée pour des ID de bot spécifiques :

```json5
{
  channels: {
    yuanbao: {
      debugBotIds: ["bot_user_id_1", "bot_user_id_2"],
    },
  },
}
```

### Routage multi-agent

Utilisez `bindings` pour router les DM ou groupes Yuanbao vers différents agents.

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
        channel: "yuanbao",
        peer: { kind: "direct", id: "user_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "yuanbao",
        peer: { kind: "group", id: "group_zzz" },
      },
    },
  ],
}
```

Champs de routage :

- `match.channel` : `"yuanbao"`
- `match.peer.kind` : `"direct"` (DM) ou `"group"` (discussion de groupe)
- `match.peer.id` : ID utilisateur ou code de groupe

---

## Référence de configuration

Configuration complète : [Configuration du Gateway](/fr/gateway/configuration)

| Paramètre                                  | Description                                      | Par défaut                              |
| ------------------------------------------ | ------------------------------------------------ | -------------------------------------- |
| `channels.yuanbao.enabled`                 | Activer/désactiver le canal                      | `true`                                 |
| `channels.yuanbao.defaultAccount`          | Compte par défaut pour le routage sortant        | `default`                              |
| `channels.yuanbao.accounts.<id>.appKey`    | App Key (utilisée pour la signature et la génération de tickets) | —                                      |
| `channels.yuanbao.accounts.<id>.appSecret` | App Secret (utilisé pour la signature)           | —                                      |
| `channels.yuanbao.accounts.<id>.token`     | Jeton pré-signé (ignore la signature automatique des tickets) | —                                      |
| `channels.yuanbao.accounts.<id>.name`      | Nom d’affichage du compte                        | —                                      |
| `channels.yuanbao.accounts.<id>.enabled`   | Activer/désactiver un compte spécifique          | `true`                                 |
| `channels.yuanbao.dm.policy`               | Politique de DM                                  | `open`                                 |
| `channels.yuanbao.dm.allowFrom`            | Liste d’autorisation DM (liste d’ID utilisateur) | —                                      |
| `channels.yuanbao.requireMention`          | Exiger une @mention dans les groupes             | `true`                                 |
| `channels.yuanbao.overflowPolicy`          | Gestion des messages longs (`split` ou `stop`)   | `split`                                |
| `channels.yuanbao.replyToMode`             | Stratégie de réponse citée de groupe (`off`, `first`, `all`) | `first`                                |
| `channels.yuanbao.outboundQueueStrategy`   | Stratégie sortante (`merge-text` ou `immediate`) | `merge-text`                           |
| `channels.yuanbao.minChars`                | Merge-text : nombre min. de caractères pour déclencher l’envoi | `2800`                                 |
| `channels.yuanbao.maxChars`                | Merge-text : nombre max. de caractères par message | `3000`                                 |
| `channels.yuanbao.idleMs`                  | Merge-text : délai d’inactivité avant vidage automatique (ms) | `5000`                                 |
| `channels.yuanbao.mediaMaxMb`              | Limite de taille des médias (Mo)                 | `20`                                   |
| `channels.yuanbao.historyLimit`            | Entrées de contexte d’historique de discussion de groupe | `100`                                  |
| `channels.yuanbao.disableBlockStreaming`   | Désactiver la sortie en streaming au niveau des blocs | `false`                                |
| `channels.yuanbao.fallbackReply`           | Réponse de secours lorsque l’IA ne renvoie aucun contenu | `暂时无法解答，你可以换个问题问问我哦` |
| `channels.yuanbao.markdownHintEnabled`     | Injecter des instructions anti-enveloppement markdown | `true`                                 |
| `channels.yuanbao.debugBotIds`             | ID de bot en liste blanche de débogage (journaux non nettoyés) | `[]`                                   |

---

## Types de messages pris en charge

### Réception

- ✅ Texte
- ✅ Images
- ✅ Fichiers
- ✅ Audio / Voix
- ✅ Vidéo
- ✅ Stickers / Émojis personnalisés
- ✅ Éléments personnalisés (cartes de lien, etc.)

### Envoi

- ✅ Texte (avec prise en charge de markdown)
- ✅ Images
- ✅ Fichiers
- ✅ Audio
- ✅ Vidéo
- ✅ Stickers

### Fils et réponses

- ✅ Réponses citées (configurables via `replyToMode`)
- ❌ Réponses en fil (non prises en charge par la plateforme)

---

## Connexe

- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Appairage](/fr/channels/pairing) — authentification DM et flux d’appairage
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et verrouillage par mention
- [Routage de canal](/fr/channels/channel-routing) — routage de session pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et renforcement
