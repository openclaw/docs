---
read_when:
    - Vous souhaitez connecter un bot Feishu/Lark
    - Vous configurez le canal Feishu
summary: Présentation du bot Feishu, fonctionnalités et configuration
title: Feishu
x-i18n:
    generated_at: "2026-07-16T12:54:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 007f3db63fe70b9e7f0267043e47555af7dd55e73c8fd78156b1c9190360b858
    source_path: channels/feishu.md
    workflow: 16
---

OpenClaw se connecte à Feishu/Lark (la plateforme de collaboration tout-en-un) par l’intermédiaire du plugin officiel `@openclaw/feishu` : messages privés avec le bot, discussions de groupe, réponses en streaming dans des cartes et outils Feishu pour les documents, les wikis, le stockage Drive et Bitable.

**État :** prêt pour la production pour les messages privés avec le bot et les discussions de groupe. WebSocket est le transport d’événements par défaut (aucune URL publique requise) ; le mode Webhook est facultatif.

## Démarrage rapide

<Note>
Nécessite OpenClaw 2026.5.29 ou une version ultérieure. Exécutez `openclaw --version` pour vérifier. Effectuez la mise à niveau avec `openclaw update`.
</Note>

<Steps>
  <Step title="Exécuter l’assistant de configuration du canal">
  ```bash
  openclaw channels login --channel feishu
  ```
  Cette commande installe le plugin `@openclaw/feishu` s’il est absent, puis vous guide tout au long de la configuration :

- **Configuration manuelle** : collez un App ID et un App Secret provenant de Feishu Open Platform (`https://open.feishu.cn`) ou de Lark Developer (`https://open.larksuite.com`).
- **Configuration par code QR** : scannez un code QR dans l’application Feishu pour créer automatiquement un bot. Ce processus limite les messages privés à votre propre compte (`dmPolicy: "allowlist"` avec votre `open_id`).

L’assistant demande également le domaine de l’API (Feishu ou Lark) et la politique de groupe. Si l’application mobile Feishu destinée au marché chinois ne réagit pas au code QR, relancez la configuration et choisissez la configuration manuelle.
</Step>

  <Step title="Une fois la configuration terminée, redémarrer le Gateway pour appliquer les modifications">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

## Contrôle d’accès

### Messages privés

Configurez `channels.feishu.dmPolicy` (valeur par défaut : `pairing`) pour contrôler qui peut envoyer des messages privés au bot :

| Valeur         | Comportement                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------- |
| `"pairing"`   | Les utilisateurs inconnus reçoivent un code d’association ; approuvez-les via la CLI                                                         |
| `"allowlist"` | Seuls les utilisateurs répertoriés dans `allowFrom` peuvent discuter                                                                     |
| `"open"`      | Messages privés publics ; la validation de la configuration exige que `allowFrom` contienne `"*"`. Les entrées sans caractère générique restreignent toujours l’accès |

**Approuver une demande d’association :**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Discussions de groupe

**Politique de groupe** (`channels.feishu.groupPolicy`, valeur par défaut : `allowlist`) :

| Valeur         | Comportement                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `"open"`      | Répondre à tous les messages dans les groupes                                                            |
| `"allowlist"` | Répondre uniquement aux groupes figurant dans `groupAllowFrom` ou explicitement configurés sous `groups.<chat_id>` |
| `"disabled"`  | Désactiver tous les messages de groupe ; les entrées explicites de `groups.<chat_id>` ne remplacent pas ce paramètre         |

**Mention obligatoire** (`channels.feishu.requireMention`) :

- Par défaut : une @mention est obligatoire, sauf lorsque la politique de groupe effective est `"open"` ; dans ce cas, la valeur par défaut est `false` afin que les messages ne pouvant pas contenir de mentions (par exemple, les images) parviennent tout de même à l’agent.
- Définissez explicitement `true` ou `false` pour remplacer ce comportement ; remplacement par groupe : `channels.feishu.groups.<chat_id>.requireMention`.
- Les mentions de diffusion uniquement `@all` et `@_all` ne sont pas considérées comme des mentions du bot. Un message qui mentionne à la fois `@all` et directement le bot compte toujours comme une mention du bot.

## Exemples de configuration des groupes

### Autoriser tous les groupes sans exiger de @mention

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open", // requireMention prend par défaut la valeur false avec "open"
    },
  },
}
```

### Autoriser tous les groupes tout en exigeant une @mention

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

### Autoriser uniquement des groupes précis

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // Les identifiants de groupe ressemblent à ceci : oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

En mode `allowlist`, vous pouvez également autoriser un groupe en ajoutant une entrée explicite dans `groups.<chat_id>`. Les entrées explicites ne remplacent pas `groupPolicy: "disabled"`. Les valeurs par défaut génériques sous `groups.*` configurent les groupes correspondants, mais ne les autorisent pas à elles seules.

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groups: {
        oc_xxx: {
          requireMention: false,
        },
      },
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
          // Les open_id des utilisateurs ressemblent à ceci : ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

`channels.feishu.groupSenderAllowFrom` définit la même liste d’expéditeurs autorisés pour tous les groupes ; une valeur `allowFrom` propre à un groupe est prioritaire.

<a id="get-groupuser-ids"></a>

## Obtenir les identifiants de groupe et d’utilisateur

### Identifiants de groupe (`chat_id`, format : `oc_xxx`)

Ouvrez le groupe dans Feishu/Lark, cliquez sur l’icône de menu dans le coin supérieur droit, puis accédez à **Settings**. L’identifiant du groupe (`chat_id`) figure sur la page des paramètres.

![Obtenir l’identifiant du groupe](/images/feishu-get-group-id.png)

### Identifiants d’utilisateur (`open_id`, format : `ou_xxx`)

Démarrez le Gateway, envoyez un message privé au bot, puis consultez les journaux :

```bash
openclaw logs --follow
```

Recherchez `open_id` dans la sortie des journaux. Vous pouvez également consulter les demandes d’association en attente :

```bash
openclaw pairing list feishu
```

## Commandes courantes

| Commande   | Description                 |
| --------- | --------------------------- |
| `/status` | Afficher l’état du bot             |
| `/reset`  | Réinitialiser la session actuelle   |
| `/model`  | Afficher ou changer le modèle d’IA |

<Note>
Feishu/Lark ne prend pas en charge les menus natifs de commandes slash ; envoyez donc ces commandes sous forme de messages en texte brut.
</Note>

## Résolution des problèmes

### Le bot ne répond pas dans les discussions de groupe

1. Vérifiez que le bot est ajouté au groupe
2. Vérifiez que vous @mentionnez le bot (obligatoire par défaut)
3. Vérifiez que `groupPolicy` n’est pas défini sur `"disabled"`
4. Consultez les journaux : `openclaw logs --follow`

### Le bot ne reçoit pas les messages

1. Vérifiez que le bot est publié et approuvé dans Feishu Open Platform / Lark Developer
2. Vérifiez que l’abonnement aux événements inclut `im.message.receive_v1`
3. Vérifiez que **persistent connection** (WebSocket) est sélectionné
4. Vérifiez que toutes les étendues d’autorisation requises sont accordées
5. Vérifiez que le Gateway est en cours d’exécution : `openclaw gateway status`
6. Consultez les journaux : `openclaw logs --follow`

### La configuration par code QR ne réagit pas dans l’application mobile Feishu

1. Relancez la configuration : `openclaw channels login --channel feishu`
2. Choisissez la configuration manuelle
3. Dans Feishu Open Platform, créez une application personnalisée et copiez son App ID et son App Secret
4. Collez ces identifiants dans l’assistant de configuration

### Fuite de l’App Secret

1. Réinitialisez l’App Secret dans Feishu Open Platform / Lark Developer
2. Mettez à jour la valeur dans votre configuration
3. Redémarrez le Gateway : `openclaw gateway restart`

## Configuration avancée

### Plusieurs comptes

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
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
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

`defaultAccount` détermine le compte utilisé lorsque les API sortantes ne précisent pas d’`accountId`. Les entrées de compte héritent des paramètres de premier niveau ; la plupart des clés de premier niveau peuvent être remplacées pour chaque compte.
`accounts.<id>.tts` utilise la même structure que `messages.tts` et est fusionné récursivement avec la configuration TTS globale. Ainsi, les configurations Feishu à plusieurs bots peuvent conserver globalement les identifiants partagés des fournisseurs tout en remplaçant uniquement la voix, le modèle, la persona ou le mode automatique pour chaque compte.

### Limites des messages

- `textChunkLimit` - taille des segments de texte sortants (valeur par défaut : `4000` caractères)
- `streaming.chunkMode` - `"length"` (valeur par défaut) découpe à la limite ; `"newline"` privilégie les sauts de ligne
- `mediaMaxMb` - limite de téléversement et de téléchargement des médias (valeur par défaut : `30` Mo)

### Streaming

Feishu/Lark prend en charge les réponses en streaming au moyen de cartes interactives (API de streaming de Card Kit). Lorsqu’il est activé, le bot met à jour la carte en temps réel à mesure qu’il génère le texte.

```json5
{
  channels: {
    feishu: {
      streaming: {
        mode: "partial", // sortie de carte en streaming (valeur par défaut : "partial")
        block: { enabled: true }, // activer le streaming des blocs terminés
      },
    },
  },
}
```

Définissez `streaming.mode: "off"` pour envoyer la réponse complète dans un seul message ; `renderMode: "raw"` (texte brut au lieu de cartes) désactive également les cartes en streaming. `streaming.block.enabled` est désactivé par défaut ; activez-le uniquement si vous souhaitez envoyer les blocs terminés de l’assistant avant la réponse finale. L’ancienne valeur booléenne `streaming` et les clés de premier niveau `blockStreaming` / `blockStreamingCoalesce` / `chunkMode` sont migrées vers cette structure imbriquée par `openclaw doctor --fix`.

### Optimisation des quotas

Réduisez le nombre d’appels à l’API Feishu/Lark grâce à deux indicateurs facultatifs :

- `typingIndicator` (valeur par défaut : `true`) : définissez `false` pour ignorer les appels de réaction de saisie
- `resolveSenderNames` (valeur par défaut : `true`) : définissez `false` pour ignorer les recherches de profil de l’expéditeur

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

### Portée des sessions de groupe et fils de discussion thématiques

`channels.feishu.groupSessionScope` (au niveau supérieur, par compte ou par groupe) détermine la manière dont les messages de groupe sont associés aux sessions d’agent :

| Valeur                  | Session                                                          |
| ---------------------- | ---------------------------------------------------------------- |
| `"group"` (valeur par défaut)    | Une session par discussion de groupe                                       |
| `"group_sender"`       | Une session par combinaison (groupe + expéditeur)                                 |
| `"group_topic"`        | Une session par fil de discussion thématique ; utilise à défaut la session du groupe    |
| `"group_topic_sender"` | Une session par combinaison (thème + expéditeur) ; utilise à défaut la combinaison (groupe + expéditeur) |

Pour les portées thématiques, les groupes thématiques natifs de Feishu/Lark utilisent l’événement `thread_id` (`omt_*`) comme clé canonique de session thématique. Si un événement natif initiant un thème omet `thread_id`, OpenClaw récupère cette valeur auprès de Feishu avant d’acheminer l’interaction. Les réponses de groupe ordinaires qu’OpenClaw transforme en fils de discussion continuent d’utiliser l’identifiant du message racine de la réponse (`om_*`), afin que la première interaction et les suivantes restent dans la même session.

Définissez `replyInThread: "enabled"` (au niveau supérieur ou par groupe) pour que les réponses du bot créent ou poursuivent un fil de discussion thématique Feishu au lieu de répondre directement dans la discussion. `topicSessionMode` est le prédécesseur obsolète de `groupSessionScope` ; privilégiez `groupSessionScope`.

### Outils de l’espace de travail Feishu

Le plugin fournit des outils d’agent pour les documents Feishu, les discussions, la base de connaissances, le stockage cloud, les autorisations et Bitable, ainsi que les Skills correspondantes (`feishu-doc`, `feishu-drive`, `feishu-perm`, `feishu-wiki`). Les familles d’outils sont contrôlées par `channels.feishu.tools` :

| Clé             | Outils                                         | Valeur par défaut             |
| --------------- | --------------------------------------------- | ------------------- |
| `tools.doc`     | opérations sur les documents `feishu_doc`              | `true`              |
| `tools.chat`    | informations de discussion `feishu_chat` + requêtes sur les membres      | `true`              |
| `tools.wiki`    | base de connaissances `feishu_wiki` (nécessite `doc`) | `true`              |
| `tools.drive`   | stockage cloud `feishu_drive`                  | `true`              |
| `tools.perm`    | gestion des autorisations `feishu_perm`           | `false` (sensible) |
| `tools.scopes`  | diagnostic des portées de l’application `feishu_app_scopes`     | `true`              |
| `tools.bitable` | opérations Bitable/Base `feishu_bitable_*`    | `true`              |

`tools.base` est un alias de `tools.bitable` ; la valeur explicite de `bitable` prévaut lorsque les deux sont définies. Les contrôles propres à chaque compte se trouvent sous `accounts.<id>.tools`.

Accordez `drive:drive.metadata:readonly` pour les recherches directes `feishu_drive info` en dehors du répertoire
racine, sauf si l’application dispose déjà de la portée complète `drive:drive`. Sans l’une de ces portées, `info`
maintient la recherche héritée dans le répertoire racine disponible via `drive:drive:readonly`.

### Sessions ACP

Feishu/Lark prend en charge ACP pour les messages privés et les messages de fil de discussion de groupe. ACP sur Feishu/Lark fonctionne au moyen de commandes textuelles : il n’existe aucun menu natif de commandes slash, utilisez donc les messages `/acp ...` directement dans la conversation.

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

#### Lancer ACP depuis une discussion

Dans un message privé ou un fil de discussion Feishu/Lark :

```text
/acp spawn codex --thread here
```

`--thread here` fonctionne pour les messages privés et les messages de fil de discussion Feishu/Lark. Les messages suivants dans la conversation liée sont acheminés directement vers cette session ACP.

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

- `match.channel` : `"feishu"`
- `match.peer.kind` : `"direct"` (message privé) ou `"group"` (discussion de groupe)
- `match.peer.id` : Open ID de l’utilisateur (`ou_xxx`) ou ID du groupe (`oc_xxx`)

Consultez [Obtenir les ID de groupe/utilisateur](#get-groupuser-ids) pour obtenir des conseils de recherche.

## Isolation des agents par utilisateur (création dynamique d’agents)

Activez `dynamicAgentCreation` pour créer automatiquement des **instances d’agent isolées** pour chaque utilisateur de messages privés. Chaque utilisateur dispose de ses propres éléments :

- Répertoire d’espace de travail indépendant
- `USER.md` / `SOUL.md` / `MEMORY.md` distincts
- Historique de conversation privé
- Skills et état isolés

Cette fonctionnalité est essentielle pour les bots publics lorsque vous souhaitez offrir à chaque utilisateur sa propre expérience privée d’assistant IA.

<Note>
Les liaisons dynamiques incluent le `accountId` Feishu normalisé, afin que les comptes par défaut et nommés acheminent chaque expéditeur vers l’agent dynamique approprié.

Si un compte nommé a créé un agent dynamique sans portée dans une ancienne version, cet agent hérité est toujours comptabilisé dans `maxAgents`. Vérifiez qu’il n’est pas utilisé par le compte par défaut avant de le supprimer, ou augmentez temporairement `maxAgents` ; OpenClaw ne peut pas déterminer de manière fiable quel compte possède un état hérité ambigu.
</Note>

### Configuration rapide

```json5
{
  channels: {
    feishu: {
      dmPolicy: "open",
      allowFrom: ["*"],
      dynamicAgentCreation: {
        enabled: true,
        workspaceTemplate: "~/.openclaw/workspace-{agentId}",
        agentDirTemplate: "~/.openclaw/agents/{agentId}/agent",
      },
    },
  },
  session: {
    // Critique : fait du message privé de chaque utilisateur sa « session principale »
    // Charge automatiquement USER.md / SOUL.md / MEMORY.md
    // Pour une isolation renforcée, utilisez plutôt "per-channel-peer"
    dmScope: "main",
  },
}
```

### Fonctionnement

Lorsqu’un nouvel utilisateur envoie son premier message privé :

1. Le canal génère un `agentId` unique : `feishu-{user_open_id}` pour le compte par défaut, ou un condensat d’identité limité et préfixé par le compte pour un compte nommé
2. Crée un nouvel espace de travail au chemin `workspaceTemplate`
3. Enregistre l’agent et crée une liaison pour cet utilisateur
4. L’assistant d’espace de travail garantit la présence des fichiers d’amorçage (`AGENTS.md`, `SOUL.md`, `USER.md`, etc.) lors du premier accès
5. Achemine tous les futurs messages de cet utilisateur vers son agent dédié

### Options de configuration

| Paramètre                                                  | Description                                | Valeur par défaut                              |
| -------------------------------------------------------- | ------------------------------------------ | ------------------------------------ |
| `channels.feishu.dynamicAgentCreation.enabled`           | Activer la création automatique d’agents par utilisateur   | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | Modèle de chemin pour les espaces de travail des agents dynamiques | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | Modèle de nom du répertoire d’agent              | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | Nombre maximal d’agents dynamiques à créer | illimité                            |

Variables du modèle :

- `{agentId}` - l’ID d’agent généré (par exemple, `feishu-ou_xxxxxx` ou `feishu-support-<identity_digest>`)
- `{userId}` - l’open_id Feishu de l’expéditeur (par exemple, `ou_xxxxxx`)

### Portée de session

`session.dmScope` contrôle la manière dont les messages directs sont associés aux sessions d’agent. Il s’agit d’un **paramètre global** qui affecte tous les canaux.

| Valeur                        | Comportement                                                            | Idéal pour                                                           |
| ---------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `"main"`                     | Le message privé de chaque utilisateur est associé à la session principale de son agent                   | Bots mono-utilisateur pour lesquels vous souhaitez charger automatiquement `USER.md` / `SOUL.md` |
| `"per-peer"`                 | Chaque interlocuteur dispose d’une session distincte (quel que soit le canal)           | Isolation fondée uniquement sur l’identité de l’expéditeur                            |
| `"per-channel-peer"`         | Chaque combinaison (canal + utilisateur) dispose d’une session distincte           | Bots publics multi-utilisateurs nécessitant une isolation renforcée                  |
| `"per-account-channel-peer"` | Chaque combinaison (compte + canal + utilisateur) dispose d’une session distincte | Bots multicomptes nécessitant une isolation des sessions au niveau du compte         |

**Compromis** : l’utilisation de `"main"` active le chargement automatique des fichiers d’amorçage (`USER.md`, `SOUL.md`, `MEMORY.md`), mais signifie que tous les messages privés de tous les canaux partagent le même modèle de clé de session. Pour les bots publics multi-utilisateurs où l’isolation importe davantage que le chargement automatique des fichiers d’amorçage, envisagez `"per-channel-peer"` et gérez manuellement les fichiers d’amorçage.

<Note>
Utilisez `"per-account-channel-peer"` lorsque les comptes Feishu nommés doivent conserver des sessions distinctes pour un même expéditeur. Les liaisons dynamiques préservent la portée du compte.
</Note>

### Déploiement multi-utilisateur type

```json5
{
  channels: {
    feishu: {
      appId: "cli_xxx",
      appSecret: "xxx",
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "open",
      requireMention: true,
      dynamicAgentCreation: {
        enabled: true,
        workspaceTemplate: "~/.openclaw/workspace-{agentId}",
        agentDirTemplate: "~/.openclaw/agents/{agentId}/agent",
      },
    },
  },
  session: {
    // Choisissez dmScope selon vos besoins d’isolation :
    // "main" pour le chargement automatique des fichiers d’amorçage, "per-channel-peer" pour une isolation renforcée
    dmScope: "main",
  },
  bindings: [], // Vide : les agents dynamiques se lient automatiquement
}
```

### Vérification

Consultez les journaux du Gateway pour confirmer que la création dynamique fonctionne :

```text
feishu: création de l’agent dynamique "feishu-ou_xxxxxx" pour l’utilisateur ou_xxxxxx
  espace de travail : /home/user/.openclaw/workspace-feishu-ou_xxxxxx
  répertoire de l’agent : /home/user/.openclaw/agents/feishu-ou_xxxxxx/agent
```

Répertoriez tous les espaces de travail créés :

```bash
ls -la ~/.openclaw/workspace-*
```

### Remarques

- **Isolation des espaces de travail** : chaque utilisateur dispose de son propre répertoire d’espace de travail et de sa propre instance d’agent. Les utilisateurs ne peuvent pas consulter l’historique des conversations ni les fichiers des autres utilisateurs dans le flux de messagerie normal.
- **Limite de sécurité** : il s’agit d’un mécanisme d’isolation du contexte de messagerie, et non d’une limite de sécurité entre cotenants hostiles. Le processus de l’agent et l’environnement hôte sont partagés.
- **Les écritures de configuration doivent rester activées** : la création dynamique d’agents écrit les agents et les liaisons dans la configuration ; elle est ignorée lorsque `channels.feishu.configWrites` vaut `false` (valeur par défaut : activée).
- **`bindings` doit être vide** : les agents dynamiques enregistrent automatiquement leurs propres liaisons
- **Chemin de mise à niveau** : les liaisons manuelles existantes continuent de fonctionner parallèlement aux agents dynamiques
- **`session.dmScope` est global** : cela affecte tous les canaux, pas seulement Feishu

## Référence de configuration

Configuration complète : [Configuration du Gateway](/fr/gateway/configuration)

| Paramètre                                                | Description                                                                          | Valeur par défaut                   |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------ |
| `channels.feishu.enabled`                                | Activer/désactiver le canal                                                          | `true`                               |
| `channels.feishu.domain`                                 | Domaine de l’API (`feishu`, `lark` ou URL de base `https://`)                             | `feishu`                             |
| `channels.feishu.connectionMode`                         | Transport des événements (`websocket` ou `webhook`)                                           | `websocket`                          |
| `channels.feishu.defaultAccount`                         | Compte par défaut pour le routage sortant                                            | `default`                            |
| `channels.feishu.verificationToken`                      | Requis pour le mode Webhook                                                          | -                                    |
| `channels.feishu.encryptKey`                             | Requis pour le mode Webhook                                                          | -                                    |
| `channels.feishu.webhookPath`                            | Chemin de la route Webhook                                                           | `/feishu/events`                     |
| `channels.feishu.webhookHost`                            | Hôte d’écoute du Webhook                                                             | `127.0.0.1`                          |
| `channels.feishu.webhookPort`                            | Port d’écoute du Webhook                                                             | `3000`                               |
| `channels.feishu.accounts.<id>.appId`                    | ID de l’application                                                                  | -                                    |
| `channels.feishu.accounts.<id>.appSecret`                | Secret de l’application                                                              | -                                    |
| `channels.feishu.accounts.<id>.domain`                   | Remplacement du domaine par compte                                                   | `feishu`                             |
| `channels.feishu.accounts.<id>.tts`                      | Remplacement de la synthèse vocale par compte                                        | `messages.tts`                       |
| `channels.feishu.dmPolicy`                               | Politique des messages privés (`pairing`, `allowlist`, `open`)                                           | `pairing`                            |
| `channels.feishu.allowFrom`                              | Liste d’autorisation des messages privés (liste d’open_id)                           | -                                    |
| `channels.feishu.groupPolicy`                            | Politique de groupe (`open`, `allowlist`, `disabled`)                                       | `allowlist`                          |
| `channels.feishu.groupAllowFrom`                         | Liste d’autorisation des groupes                                                     | -                                    |
| `channels.feishu.groupSenderAllowFrom`                   | Liste d’autorisation des expéditeurs appliquée à tous les groupes                    | -                                    |
| `channels.feishu.requireMention`                         | Exiger une @mention dans les groupes                                                 | `true` (`false` lorsque la politique est `open`)  |
| `channels.feishu.groups.<chat_id>.requireMention`        | Remplacement de la règle de @mention par groupe ; les ID explicites autorisent également le groupe en mode liste d’autorisation     | hérité                               |
| `channels.feishu.groups.<chat_id>.enabled`               | Activer/désactiver un groupe spécifique                                              | `true`                               |
| `channels.feishu.groups.<chat_id>.allowFrom`             | Liste d’autorisation des expéditeurs par groupe (remplace `groupSenderAllowFrom`)                        | -                                    |
| `channels.feishu.groupSessionScope`                      | Mappage des sessions de groupe (`group`, `group_sender`, `group_topic`, `group_topic_sender`) | `group`                              |
| `channels.feishu.replyInThread`                          | Les réponses du bot créent ou poursuivent les fils de discussion thématiques (`disabled`, `enabled`)                    | `disabled`                           |
| `channels.feishu.reactionNotifications`                  | Événements de réaction entrants (`off`, `own`, `all`)                                        | `own`                                |
| `channels.feishu.dynamicAgentCreation.enabled`           | Activer la création automatique d’un agent par utilisateur                           | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | Modèle de chemin pour les espaces de travail dynamiques des agents                   | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | Modèle de nom du répertoire de l’agent                                                | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | Nombre maximal d’agents dynamiques à créer                                           | illimité                             |
| `channels.feishu.textChunkLimit`                         | Taille des segments de message                                                       | `4000`                               |
| `channels.feishu.streaming.chunkMode`                    | Découpage en segments (`length` ou `newline`)                                              | `length`                             |
| `channels.feishu.mediaMaxMb`                             | Limite de taille des médias                                                          | `30`                                 |
| `channels.feishu.renderMode`                             | Rendu des réponses (`auto`, `raw`, `card`)                                              | `auto`                               |
| `channels.feishu.streaming.mode`                         | Sortie des cartes en streaming (`partial` ou `off`)                                           | `partial`                            |
| `channels.feishu.streaming.block.enabled`                | Diffusion des réponses par blocs terminés                                            | `false`                              |
| `channels.feishu.typingIndicator`                        | Envoyer des réactions de saisie                                                      | `true`                               |
| `channels.feishu.resolveSenderNames`                     | Résoudre les noms d’affichage des expéditeurs                                        | `true`                               |
| `channels.feishu.configWrites`                           | Autoriser les écritures de configuration initiées par le canal (requises par les agents dynamiques)                     | `true`                               |
| `channels.feishu.tools.doc`                              | Activer les outils de gestion des documents                                          | `true`                               |
| `channels.feishu.tools.chat`                             | Activer les outils d’informations sur les discussions                                | `true`                               |
| `channels.feishu.tools.wiki`                             | Activer les outils de base de connaissances (nécessite `doc`)                                         | `true`                               |
| `channels.feishu.tools.drive`                            | Activer les outils de stockage cloud                                                 | `true`                               |
| `channels.feishu.tools.perm`                             | Activer les outils de gestion des autorisations                                      | `false`                              |
| `channels.feishu.tools.scopes`                           | Activer l’outil de diagnostic des portées de l’application                           | `true`                               |
| `channels.feishu.tools.bitable`                          | Activer les outils Bitable/Base                                                      | `true`                               |
| `channels.feishu.tools.base`                             | Alias de `channels.feishu.tools.bitable` ; la valeur explicite de `bitable` prévaut lorsque les deux sont définies     | `true`                               |
| `channels.feishu.accounts.<id>.tools.bitable`            | Contrôle des outils Bitable/Base par compte                                          | hérité                               |
| `channels.feishu.accounts.<id>.tools.base`               | Alias par compte de `tools.bitable`                                                | hérité                               |

## Types de messages pris en charge

### Réception

- ✅ Texte
- ✅ Texte enrichi (publication)
- ✅ Images
- ✅ Fichiers
- ✅ Audio
- ✅ Vidéo/média
- ✅ Autocollants

Les messages audio Feishu/Lark entrants sont normalisés sous forme d’espaces réservés de médias plutôt
que de données JSON `file_key` brutes. Lorsque `tools.media.audio` est configuré, OpenClaw
télécharge la ressource de la note vocale et exécute la transcription audio partagée avant le
tour de l’agent, afin que celui-ci reçoive la transcription des paroles. Si Feishu inclut
directement le texte de la transcription dans la charge utile audio, ce texte est utilisé sans autre
appel ASR. Sans fournisseur de transcription audio, l’agent reçoit tout de même un espace réservé
`<media:audio>` accompagné de la pièce jointe enregistrée, et non la charge utile brute de la
ressource Feishu.

### Envoi

- ✅ Texte
- ✅ Images
- ✅ Fichiers
- ✅ Audio
- ✅ Vidéo/média
- ✅ Cartes interactives (y compris les mises à jour en streaming)
- ⚠️ Texte enrichi (mise en forme de type publication ; ne prend pas en charge toutes les fonctionnalités de création de Feishu/Lark)

Les bulles audio Feishu/Lark natives utilisent le type de message Feishu `audio` et nécessitent
un média téléversé au format Ogg/Opus (`file_type: "opus"`). Les médias `.opus` et `.ogg` existants
sont envoyés directement sous forme audio native. Les formats MP3/WAV/M4A et autres formats probablement audio sont
transcodés en Ogg/Opus à 48kHz avec `ffmpeg` uniquement lorsque la réponse demande une diffusion
vocale (`audioAsVoice` / outil de messagerie `asVoice`, y compris les réponses sous forme de notes
vocales de synthèse vocale). Les pièces jointes MP3 ordinaires restent des fichiers classiques. Si `ffmpeg` est absent ou si
la conversion échoue, OpenClaw utilise à la place une pièce jointe et consigne la raison.

### Fils de discussion et réponses

- ✅ Réponses intégrées
- ✅ Réponses dans les fils de discussion
- ✅ Les réponses contenant des médias restent associées au fil lorsqu’elles répondent à un message de ce fil

Le routage des sessions des groupes thématiques est décrit dans
[Portée des sessions de groupe et fils de discussion thématiques](#group-session-scope-and-topic-threads).

## Voir aussi

- [Vue d’ensemble des canaux](/fr/channels) - tous les canaux pris en charge
- [Appairage](/fr/channels/pairing) - authentification des messages privés et processus d’appairage
- [Groupes](/fr/channels/groups) - comportement des discussions de groupe et contrôle par mention
- [Routage des canaux](/fr/channels/channel-routing) - routage des sessions pour les messages
- [Sécurité](/fr/gateway/security) - modèle d’accès et renforcement de la sécurité
