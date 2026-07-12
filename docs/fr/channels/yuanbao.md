---
read_when:
    - Vous souhaitez connecter un bot Yuanbao
    - Vous configurez le canal Yuanbao
summary: Présentation, fonctionnalités et configuration du bot Yuanbao
title: Yuanbao
x-i18n:
    generated_at: "2026-07-12T02:26:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 43488834f588530206b290cb0fb185fd1fe2e1f214ab4a4ccccc49b9b549b6ac
    source_path: channels/yuanbao.md
    workflow: 16
---

Tencent Yuanbao est la plateforme d’assistant IA de Tencent. Le plugin `openclaw-plugin-yuanbao`, maintenu par la communauté, connecte les bots Yuanbao à OpenClaw via WebSocket pour les messages directs et les discussions de groupe.

**État :** prêt pour la production pour les messages directs aux bots et les discussions de groupe. WebSocket est le seul mode de connexion pris en charge. Ce plugin est maintenu par l’équipe Tencent Yuanbao en tant qu’entrée de catalogue externe, et non par le cœur d’OpenClaw ; les détails de configuration et de comportement ci-dessous (au-delà de l’installation et de l’interface CLI générique) proviennent de la documentation propre au plugin et n’ont pas été vérifiés par rapport au code source du cœur d’OpenClaw.

## Démarrage rapide

Nécessite OpenClaw 2026.4.10 ou une version ultérieure. Vérifiez avec `openclaw --version` ; effectuez la mise à niveau avec `openclaw update`.

<Steps>
  <Step title="Ajouter le canal Yuanbao avec vos identifiants">
  ```bash
  openclaw channels add --channel yuanbao --token "appKey:appSecret"
  ```
  `--token` utilise le format `appKey:appSecret`, séparé par deux-points. Obtenez ces valeurs depuis l’application Yuanbao en créant un bot dans les paramètres de votre application.
  </Step>

  <Step title="Redémarrer le Gateway pour appliquer la modification">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

### Configuration interactive (alternative)

```bash
openclaw channels login --channel yuanbao
```

Suivez les invites pour saisir votre App ID et votre App Secret.

## Contrôle d’accès

### Messages directs

`channels.yuanbao.dm.policy` :

| Valeur           | Comportement                                                                  |
| ---------------- | ----------------------------------------------------------------------------- |
| `open` (défaut)  | Autoriser tous les utilisateurs                                               |
| `pairing`        | Les utilisateurs inconnus reçoivent un code d’appairage ; approuver via la CLI |
| `allowlist`      | Seuls les utilisateurs figurant dans `allowFrom` peuvent discuter             |
| `disabled`       | Désactiver tous les messages directs                                          |

Approuver une demande d’appairage :

```bash
openclaw pairing list yuanbao
openclaw pairing approve yuanbao <CODE>
```

### Discussions de groupe

`channels.yuanbao.requireMention` (`true` par défaut) : exiger une @mention avant que le bot réponde dans un groupe. Répondre au propre message du bot est considéré comme une mention implicite.

## Exemples de configuration

Configuration de base avec une politique de messages directs ouverte :

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

Limiter les messages directs à certains utilisateurs :

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

Désactiver l’exigence de @mention dans les groupes :

```json5
{
  channels: {
    yuanbao: {
      requireMention: false,
    },
  },
}
```

Réglage de la distribution sortante :

```json5
{
  channels: {
    yuanbao: {
      outboundQueueStrategy: "merge-text",
      minChars: 2800, // mettre en mémoire tampon jusqu’à ce nombre de caractères
      maxChars: 3000, // forcer le découpage au-delà de cette limite
      idleMs: 5000, // vider automatiquement après le délai d’inactivité (ms)
    },
  },
}
```

Définissez `outboundQueueStrategy: "immediate"` pour envoyer chaque fragment sans mise en mémoire tampon.

## Commandes courantes

| Commande   | Description                              |
| ---------- | ---------------------------------------- |
| `/help`    | Afficher les commandes disponibles       |
| `/status`  | Afficher l’état du bot                   |
| `/new`     | Démarrer une nouvelle session            |
| `/stop`    | Arrêter l’exécution en cours             |
| `/restart` | Redémarrer OpenClaw                      |
| `/compact` | Compacter le contexte de la session      |

Yuanbao prend en charge les menus natifs de commandes avec barre oblique ; les commandes sont automatiquement synchronisées avec la plateforme au démarrage du Gateway.

## Dépannage

**Le bot ne répond pas dans les discussions de groupe :**

1. Vérifiez que le bot a été ajouté au groupe
2. Vérifiez que vous @mentionnez le bot (requis par défaut)
3. Consultez les journaux : `openclaw logs --follow`

**Le bot ne reçoit pas les messages :**

1. Vérifiez que le bot est créé et approuvé dans l’application Yuanbao
2. Vérifiez que `appKey` et `appSecret` sont correctement configurés
3. Vérifiez que le Gateway est en cours d’exécution : `openclaw gateway status`
4. Consultez les journaux : `openclaw logs --follow`

**Le bot envoie des réponses vides ou de secours :**

1. Vérifiez si le modèle d’IA renvoie un contenu valide
2. Réponse de secours par défaut : "暂时无法解答，你可以换个问题问问我哦"
3. Personnalisez-la avec `channels.yuanbao.fallbackReply`

**L’App Secret a été divulgué :**

1. Réinitialisez l’App Secret dans l’application Yuanbao
2. Mettez à jour la valeur dans votre configuration
3. Redémarrez le Gateway : `openclaw gateway restart`

## Configuration avancée

### Comptes multiples

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

`defaultAccount` détermine le compte utilisé lorsque les API sortantes ne spécifient pas d’`accountId`.

### Limites des messages

- `maxChars` : nombre maximal de caractères d’un message unique (`3000` par défaut)
- `mediaMaxMb` : limite de téléversement/téléchargement des médias (`20` Mo par défaut)
- `overflowPolicy` : comportement lorsqu’un message dépasse la limite, `"split"` (par défaut) ou `"stop"`

### Diffusion en continu

Yuanbao prend en charge la sortie en continu par blocs ; le bot envoie le texte par fragments à mesure qu’il le génère.

```json5
{
  channels: {
    yuanbao: {
      disableBlockStreaming: false, // diffusion en continu par blocs activée (par défaut)
    },
  },
}
```

Définissez `disableBlockStreaming: true` pour envoyer la réponse complète dans un seul message.

### Contexte de l’historique des discussions de groupe

```json5
{
  channels: {
    yuanbao: {
      historyLimit: 100, // valeur par défaut : 100, définir sur 0 pour désactiver
    },
  },
}
```

Détermine le nombre de messages historiques inclus dans le contexte de l’IA pour les discussions de groupe.

### Mode de réponse

```json5
{
  channels: {
    yuanbao: {
      replyToMode: "first", // "off" | "first" | "all" (valeur par défaut : "first")
    },
  },
}
```

| Valeur  | Comportement                                                          |
| ------- | --------------------------------------------------------------------- |
| `off`   | Aucune réponse avec citation                                          |
| `first` | Citer uniquement la première réponse par message entrant (par défaut) |
| `all`   | Citer chaque réponse                                                   |

### Injection d’une indication Markdown

Par défaut, le bot injecte une instruction dans l’invite système afin d’empêcher le modèle d’envelopper l’intégralité de la réponse dans un bloc de code Markdown.

```json5
{
  channels: {
    yuanbao: {
      markdownHintEnabled: true, // valeur par défaut : true
    },
  },
}
```

### Mode de débogage

```json5
{
  channels: {
    yuanbao: {
      debugBotIds: ["bot_user_id_1", "bot_user_id_2"],
    },
  },
}
```

Active une sortie de journal non expurgée pour les identifiants de bots répertoriés.

### Routage multi-agent

Utilisez `bindings` pour acheminer les messages directs ou les groupes Yuanbao vers différents agents :

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

- `match.channel` : `"yuanbao"`
- `match.peer.kind` : `"direct"` (message direct) ou `"group"` (discussion de groupe)
- `match.peer.id` : identifiant utilisateur ou code de groupe

## Référence de configuration

Configuration complète : [Configuration du Gateway](/fr/gateway/configuration)

| Paramètre                                  | Description                                                        | Valeur par défaut                     |
| ------------------------------------------ | ------------------------------------------------------------------ | ------------------------------------- |
| `channels.yuanbao.enabled`                 | Activer/désactiver le canal                                        | `true`                                |
| `channels.yuanbao.defaultAccount`          | Compte par défaut pour le routage sortant                          | `default`                             |
| `channels.yuanbao.accounts.<id>.appKey`    | App Key (signature + génération de ticket)                         | -                                     |
| `channels.yuanbao.accounts.<id>.appSecret` | App Secret (signature)                                             | -                                     |
| `channels.yuanbao.accounts.<id>.token`     | Jeton présigné (ignore la signature automatique du ticket)        | -                                     |
| `channels.yuanbao.accounts.<id>.name`      | Nom d’affichage du compte                                          | -                                     |
| `channels.yuanbao.accounts.<id>.enabled`   | Activer/désactiver un compte spécifique                            | `true`                                |
| `channels.yuanbao.dm.policy`               | Politique des messages directs                                     | `open`                                |
| `channels.yuanbao.dm.allowFrom`            | Liste d’autorisation des messages directs (liste d’identifiants)   | -                                     |
| `channels.yuanbao.requireMention`          | Exiger une @mention dans les groupes                               | `true`                                |
| `channels.yuanbao.overflowPolicy`          | Gestion des messages longs (`split` ou `stop`)                     | `split`                               |
| `channels.yuanbao.replyToMode`             | Stratégie de réponse dans les groupes (`off`, `first`, `all`)      | `first`                               |
| `channels.yuanbao.outboundQueueStrategy`   | Stratégie sortante (`merge-text` ou `immediate`)                   | `merge-text`                          |
| `channels.yuanbao.minChars`                | Fusion de texte : nombre minimal de caractères déclenchant l’envoi | `2800`                                |
| `channels.yuanbao.maxChars`                | Fusion de texte : nombre maximal de caractères par message         | `3000`                                |
| `channels.yuanbao.idleMs`                  | Fusion de texte : délai d’inactivité avant vidage automatique (ms) | `5000`                                |
| `channels.yuanbao.mediaMaxMb`              | Limite de taille des médias (Mo)                                   | `20`                                  |
| `channels.yuanbao.historyLimit`            | Nombre d’entrées du contexte d’historique des discussions de groupe | `100`                               |
| `channels.yuanbao.disableBlockStreaming`   | Désactiver la sortie en continu par blocs                          | `false`                               |
| `channels.yuanbao.fallbackReply`           | Réponse de secours lorsque le modèle ne renvoie aucun contenu      | `暂时无法解答，你可以换个问题问问我哦` |
| `channels.yuanbao.markdownHintEnabled`     | Injecter des instructions empêchant l’enveloppement Markdown      | `true`                                |
| `channels.yuanbao.debugBotIds`             | Identifiants de bots autorisés pour le débogage (journaux non expurgés) | `[]`                             |

## Types de messages pris en charge

**Réception :** texte, images, fichiers, audio/voix, vidéo, autocollants/émojis personnalisés, éléments personnalisés (cartes de liens).

**Envoi :** texte (Markdown), images, fichiers, audio, vidéo, autocollants.

**Fils de discussion et réponses :** réponses avec citation (configurables via `replyToMode`) ; les réponses dans les fils de discussion ne sont pas prises en charge par la plateforme.

## Voir aussi

- [Vue d’ensemble des canaux](/fr/channels) - tous les canaux pris en charge
- [Appairage](/fr/channels/pairing) - authentification des messages directs et processus d’appairage
- [Groupes](/fr/channels/groups) - comportement des discussions de groupe et contrôle par mention
- [Routage des canaux](/fr/channels/channel-routing) - routage des sessions pour les messages
- [Sécurité](/fr/gateway/security) - modèle d’accès et renforcement
