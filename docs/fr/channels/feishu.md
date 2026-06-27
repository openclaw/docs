---
read_when:
    - Vous voulez connecter un bot Feishu/Lark
    - Vous configurez le canal Feishu
summary: Présentation, fonctionnalités et configuration du bot Feishu
title: Feishu
x-i18n:
    generated_at: "2026-06-27T17:09:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a12e91ff42b17ee99f07c10933d65a407db8ed9de2ac7bc6028d7004aa4e346
    source_path: channels/feishu.md
    workflow: 16
---

Feishu/Lark est une plateforme de collaboration tout-en-un où les équipes discutent, partagent des documents, gèrent des calendriers et travaillent ensemble.

**État :** prêt pour la production pour les messages privés du bot + les discussions de groupe. WebSocket est le mode par défaut ; le mode webhook est facultatif.

---

## Démarrage rapide

<Note>
Nécessite OpenClaw 2026.5.29 ou version ultérieure. Exécutez `openclaw --version` pour vérifier. Mettez à niveau avec `openclaw update`.
</Note>

<Steps>
  <Step title="Run the channel setup wizard">
  ```bash
  openclaw channels login --channel feishu
  ```
  Choisissez la configuration manuelle pour coller un App ID et un App Secret depuis Feishu Open Platform, ou choisissez la configuration par QR code pour créer automatiquement un bot. Si l’application mobile Feishu nationale ne réagit pas au QR code, relancez la configuration et choisissez la configuration manuelle.
  </Step>
  
  <Step title="After setup completes, restart the gateway to apply the changes">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## Contrôle d’accès

### Messages directs

Configurez `dmPolicy` pour contrôler qui peut envoyer un message direct au bot :

- `"pairing"` - les utilisateurs inconnus reçoivent un code d’appairage ; approuvez via la CLI
- `"allowlist"` - seuls les utilisateurs listés dans `allowFrom` peuvent discuter
- `"open"` - autorise les messages directs publics uniquement lorsque `allowFrom` inclut `"*"` ; avec des entrées restrictives, seuls les utilisateurs correspondants peuvent discuter
- `"disabled"` - désactive tous les messages directs

**Approuver une demande d’appairage :**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Discussions de groupe

**Politique de groupe** (`channels.feishu.groupPolicy`) :

| Valeur        | Comportement                                                                                              |
| ------------- | --------------------------------------------------------------------------------------------------------- |
| `"open"`      | Répondre à tous les messages dans les groupes                                                             |
| `"allowlist"` | Répondre uniquement aux groupes dans `groupAllowFrom` ou explicitement configurés sous `groups.<chat_id>` |
| `"disabled"`  | Désactiver tous les messages de groupe ; les entrées explicites `groups.<chat_id>` ne remplacent pas ceci |

Par défaut : `allowlist`

**Exigence de mention** (`channels.feishu.requireMention`) :

- `true` - exiger une @mention (par défaut)
- `false` - répondre sans @mention
- Remplacement par groupe : `channels.feishu.groups.<chat_id>.requireMention`
- Les mentions de diffusion uniquement `@all` et `@_all` ne sont pas traitées comme des mentions du bot. Un message qui mentionne à la fois `@all` et le bot directement compte toujours comme une mention du bot.

---

## Exemples de configuration de groupe

### Autoriser tous les groupes, aucune @mention requise

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
      // Group IDs look like: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

En mode `allowlist`, vous pouvez aussi admettre un groupe en ajoutant une entrée explicite `groups.<chat_id>`. Les entrées explicites ne remplacent pas `groupPolicy: "disabled"`. Les valeurs par défaut génériques sous `groups.*` configurent les groupes correspondants, mais elles n’admettent pas les groupes à elles seules.

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

### Restreindre les expéditeurs dans un groupe

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // User open_ids look like: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

---

<a id="get-groupuser-ids"></a>

## Obtenir les identifiants de groupe/utilisateur

### Identifiants de groupe (`chat_id`, format : `oc_xxx`)

Ouvrez le groupe dans Feishu/Lark, cliquez sur l’icône de menu dans l’angle supérieur droit, puis accédez à **Paramètres**. L’identifiant du groupe (`chat_id`) est indiqué sur la page des paramètres.

![Obtenir l’identifiant de groupe](/images/feishu-get-group-id.png)

### Identifiants utilisateur (`open_id`, format : `ou_xxx`)

Démarrez le Gateway, envoyez un message direct au bot, puis vérifiez les journaux :

```bash
openclaw logs --follow
```

Recherchez `open_id` dans la sortie du journal. Vous pouvez aussi vérifier les demandes d’appairage en attente :

```bash
openclaw pairing list feishu
```

---

## Commandes courantes

| Commande  | Description                          |
| --------- | ------------------------------------ |
| `/status` | Afficher l’état du bot               |
| `/reset`  | Réinitialiser la session actuelle    |
| `/model`  | Afficher ou changer le modèle d’IA   |

<Note>
Feishu/Lark ne prend pas en charge les menus natifs de commandes slash ; envoyez donc ces commandes comme des messages en texte brut.
</Note>

---

## Dépannage

### Le bot ne répond pas dans les discussions de groupe

1. Assurez-vous que le bot est ajouté au groupe
2. Assurez-vous de @mentionner le bot (requis par défaut)
3. Vérifiez que `groupPolicy` n’est pas `"disabled"`
4. Vérifiez les journaux : `openclaw logs --follow`

### Le bot ne reçoit pas les messages

1. Assurez-vous que le bot est publié et approuvé dans Feishu Open Platform / Lark Developer
2. Assurez-vous que l’abonnement aux événements inclut `im.message.receive_v1`
3. Assurez-vous que la **connexion persistante** (WebSocket) est sélectionnée
4. Assurez-vous que toutes les portées d’autorisation requises sont accordées
5. Assurez-vous que le Gateway est en cours d’exécution : `openclaw gateway status`
6. Vérifiez les journaux : `openclaw logs --follow`

### La configuration par QR code ne réagit pas dans l’application mobile Feishu

1. Relancez la configuration : `openclaw channels login --channel feishu`
2. Choisissez la configuration manuelle
3. Dans Feishu Open Platform, créez une application auto-construite et copiez son App ID et son App Secret
4. Collez ces identifiants dans l’assistant de configuration

### App Secret divulgué

1. Réinitialisez l’App Secret dans Feishu Open Platform / Lark Developer
2. Mettez à jour la valeur dans votre configuration
3. Redémarrez le Gateway : `openclaw gateway restart`

---

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
`accounts.<id>.tts` utilise la même forme que `messages.tts` et fusionne en profondeur avec
la configuration TTS globale, de sorte que les configurations Feishu multi-bots puissent conserver les identifiants
de fournisseurs partagés globalement tout en remplaçant uniquement la voix, le modèle, le persona ou le mode automatique
par compte.

### Limites des messages

- `textChunkLimit` - taille des segments de texte sortants (par défaut : `2000` caractères)
- `mediaMaxMb` - limite de téléversement/téléchargement des médias (par défaut : `30` Mo)

### Diffusion en continu

Feishu/Lark prend en charge les réponses en streaming via des cartes interactives. Lorsque cette option est activée, le bot met à jour la carte en temps réel pendant qu’il génère le texte.

```json5
{
  channels: {
    feishu: {
      streaming: true, // enable streaming card output (default: true)
      blockStreaming: true, // opt into completed-block streaming
    },
  },
}
```

Définissez `streaming: false` pour envoyer la réponse complète dans un seul message. `blockStreaming` est désactivé par défaut ; activez-le uniquement lorsque vous voulez que les blocs assistant terminés soient envoyés avant la réponse finale.

### Optimisation des quotas

Réduisez le nombre d’appels à l’API Feishu/Lark avec deux indicateurs facultatifs :

- `typingIndicator` (par défaut `true`) : définissez `false` pour ignorer les appels de réaction de saisie
- `resolveSenderNames` (par défaut `true`) : définissez `false` pour ignorer les recherches de profil d’expéditeur

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

Feishu/Lark prend en charge ACP pour les messages directs et les messages de fil de discussion de groupe. ACP Feishu/Lark est piloté par commandes textuelles - il n’y a pas de menus natifs de commandes slash, utilisez donc les messages `/acp ...` directement dans la conversation.

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

#### Créer ACP depuis une discussion

Dans un message direct ou un fil Feishu/Lark :

```text
/acp spawn codex --thread here
```

`--thread here` fonctionne pour les messages directs et les messages de fil Feishu/Lark. Les messages suivants dans la conversation liée sont acheminés directement vers cette session ACP.

### Routage multi-agent

Utilisez `bindings` pour acheminer les messages directs ou groupes Feishu/Lark vers différents agents.

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
- `match.peer.kind` : `"direct"` (message direct) ou `"group"` (discussion de groupe)
- `match.peer.id` : Open ID utilisateur (`ou_xxx`) ou identifiant de groupe (`oc_xxx`)

Consultez [Obtenir les identifiants de groupe/utilisateur](#get-groupuser-ids) pour des conseils de recherche.

---

## Isolation d’agent par utilisateur (création dynamique d’agent)

Activez `dynamicAgentCreation` pour créer automatiquement des **instances d’agent isolées** pour chaque utilisateur de message direct. Chaque utilisateur obtient son propre :

- Répertoire de workspace indépendant
- `USER.md` / `SOUL.md` / `MEMORY.md` séparés
- Historique de conversation privé
- Skills et état isolés

C’est essentiel pour les bots publics lorsque vous voulez que chaque utilisateur bénéficie de sa propre expérience d’assistant IA privé.

<Note>
Les liaisons dynamiques incluent l’`accountId` Feishu normalisé, de sorte que les comptes par défaut et nommés acheminent chaque expéditeur vers le bon agent dynamique.

Si un compte nommé a créé un agent dynamique non délimité sur une version plus ancienne, cet agent hérité compte toujours dans `maxAgents`. Confirmez qu’il n’est pas utilisé par le compte par défaut avant de le supprimer, ou augmentez temporairement `maxAgents` ; OpenClaw ne peut pas inférer en toute sécurité quel compte possède un état hérité ambigu.
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
    // Critical: makes each user's DM their "main session"
    // Automatically loads USER.md / SOUL.md / MEMORY.md
    // For stronger isolation, use "per-channel-peer" instead
    dmScope: "main",
  },
}
```

### Fonctionnement

Lorsqu’un nouvel utilisateur envoie son premier message direct :

1. Le channel génère un `agentId` unique : `feishu-{user_open_id}` pour le compte par défaut, ou un condensé d’identité limité avec préfixe de compte pour un compte nommé
2. Crée un nouveau workspace au chemin `workspaceTemplate`
3. Enregistre l’agent et crée une liaison pour cet utilisateur
4. L’assistant de workspace garantit les fichiers de bootstrap (`AGENTS.md`, `SOUL.md`, `USER.md`, etc.) au premier accès
5. Achemine tous les futurs messages de cet utilisateur vers son agent dédié

### Options de configuration

| Paramètre                                                | Description                                         | Valeur par défaut                    |
| -------------------------------------------------------- | --------------------------------------------------- | ------------------------------------ |
| `channels.feishu.dynamicAgentCreation.enabled`           | Active la création automatique d’agents par utilisateur | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | Modèle de chemin pour les espaces de travail d’agent dynamiques | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | Modèle de nom du répertoire d’agent                 | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | Nombre maximal d’agents dynamiques à créer          | illimité                             |

Variables de modèle :

- `{agentId}` - l’ID d’agent généré (par exemple, `feishu-ou_xxxxxx` ou `feishu-support-<identity_digest>`)
- `{userId}` - le Feishu open_id de l’expéditeur (par exemple, `ou_xxxxxx`)

### Portée de session

`session.dmScope` contrôle la façon dont les messages directs sont associés aux sessions d’agent. Il s’agit d’un **paramètre global** qui affecte tous les canaux.

| Valeur                       | Comportement                                                        | Idéal pour                                                        |
| ---------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `"main"`                     | Le DM de chaque utilisateur correspond à la session principale de son agent | Bots mono-utilisateur où vous voulez que `USER.md` / `SOUL.md` se chargent automatiquement |
| `"per-channel-peer"`         | Chaque combinaison (canal + utilisateur) obtient une session distincte | Bots publics multi-utilisateurs nécessitant une isolation renforcée |
| `"per-account-channel-peer"` | Chaque combinaison (compte + canal + utilisateur) obtient une session distincte | Bots multi-comptes nécessitant une isolation de session au niveau du compte |

**Compromis** : utiliser `"main"` active le chargement automatique des fichiers d’amorçage (`USER.md`, `SOUL.md`, `MEMORY.md`), mais signifie que tous les DM sur tous les canaux partagent le même schéma de clé de session. Pour les bots publics multi-utilisateurs où l’isolation est plus importante que le chargement automatique de l’amorçage, envisagez `"per-channel-peer"` et gérez les fichiers d’amorçage manuellement.

<Note>
Utilisez `"per-account-channel-peer"` lorsque des comptes Feishu nommés doivent conserver des sessions séparées pour le même expéditeur. Les liaisons dynamiques préservent la portée du compte.
</Note>

```json5
{
  session: {
    // For single-user personal bots: enables auto bootstrap loading
    dmScope: "main",

    // For public multi-user bots: stronger isolation
    // dmScope: "per-channel-peer",
  },
}
```

### Déploiement multi-utilisateur typique

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
    // Choose dmScope based on your isolation needs:
    // "main" for bootstrap auto-loading, "per-channel-peer" for stronger isolation
    dmScope: "main",
  },
  bindings: [], // Empty - dynamic agents auto-bind
}
```

### Vérification

Consultez les journaux du Gateway pour confirmer que la création dynamique fonctionne :

```
feishu: creating dynamic agent "feishu-ou_xxxxxx" for user ou_xxxxxx
workspace: /Users/you/.openclaw/workspace-feishu-ou_xxxxxx
feishu: dynamic agent created, new route: agent:feishu-ou_xxxxxx:main
```

Lister tous les espaces de travail créés :

```bash
ls -la ~/.openclaw/workspace-*
```

### Remarques

- **Isolation de l’espace de travail** : chaque utilisateur obtient son propre répertoire d’espace de travail et sa propre instance d’agent. Les utilisateurs ne peuvent pas voir l’historique des conversations ni les fichiers des autres dans le flux de messagerie normal.
- **Limite de sécurité** : il s’agit d’un mécanisme d’isolation du contexte de messagerie, pas d’une limite de sécurité contre des colocataires hostiles. Le processus de l’agent et l’environnement hôte sont partagés.
- **`bindings` doit être vide** : les agents dynamiques enregistrent automatiquement leurs propres liaisons
- **Chemin de mise à niveau** : les liaisons manuelles existantes continuent de fonctionner avec les agents dynamiques
- **`session.dmScope` est global** : cela affecte tous les canaux, pas seulement Feishu

---

## Référence de configuration

Configuration complète : [Configuration du Gateway](/fr/gateway/configuration)

| Paramètre                                                | Description                                                                      | Valeur par défaut                    |
| -------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------ |
| `channels.feishu.enabled`                                | Activer/désactiver le canal                                                      | `true`                               |
| `channels.feishu.domain`                                 | Domaine de l’API (`feishu` ou `lark`)                                            | `feishu`                             |
| `channels.feishu.connectionMode`                         | Transport d’événements (`websocket` ou `webhook`)                                | `websocket`                          |
| `channels.feishu.defaultAccount`                         | Compte par défaut pour le routage sortant                                        | `default`                            |
| `channels.feishu.verificationToken`                      | Requis pour le mode webhook                                                      | -                                    |
| `channels.feishu.encryptKey`                             | Requis pour le mode webhook                                                      | -                                    |
| `channels.feishu.webhookPath`                            | Chemin de route Webhook                                                          | `/feishu/events`                     |
| `channels.feishu.webhookHost`                            | Hôte de liaison du Webhook                                                       | `127.0.0.1`                          |
| `channels.feishu.webhookPort`                            | Port de liaison du Webhook                                                       | `3000`                               |
| `channels.feishu.accounts.<id>.appId`                    | ID d’application                                                                 | -                                    |
| `channels.feishu.accounts.<id>.appSecret`                | Secret d’application                                                             | -                                    |
| `channels.feishu.accounts.<id>.domain`                   | Remplacement du domaine par compte                                               | `feishu`                             |
| `channels.feishu.accounts.<id>.tts`                      | Remplacement TTS par compte                                                      | `messages.tts`                       |
| `channels.feishu.dmPolicy`                               | Stratégie DM                                                                     | `pairing`                            |
| `channels.feishu.allowFrom`                              | Liste d’autorisation DM (liste open_id)                                          | -                                    |
| `channels.feishu.groupPolicy`                            | Stratégie de groupe                                                              | `allowlist`                          |
| `channels.feishu.groupAllowFrom`                         | Liste d’autorisation de groupe                                                   | -                                    |
| `channels.feishu.requireMention`                         | Exiger une @mention dans les groupes                                             | `true`                               |
| `channels.feishu.groups.<chat_id>.requireMention`        | Remplacement de @mention par groupe ; les ID explicites admettent aussi le groupe en mode liste d’autorisation | hérité                               |
| `channels.feishu.groups.<chat_id>.enabled`               | Activer/désactiver un groupe spécifique                                          | `true`                               |
| `channels.feishu.dynamicAgentCreation.enabled`           | Active la création automatique d’agents par utilisateur                          | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | Modèle de chemin pour les espaces de travail d’agent dynamiques                  | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | Modèle de nom du répertoire d’agent                                              | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | Nombre maximal d’agents dynamiques à créer                                       | illimité                             |
| `channels.feishu.textChunkLimit`                         | Taille des fragments de message                                                  | `2000`                               |
| `channels.feishu.mediaMaxMb`                             | Limite de taille des médias                                                      | `30`                                 |
| `channels.feishu.streaming`                              | Sortie de carte en streaming                                                     | `true`                               |
| `channels.feishu.blockStreaming`                         | Streaming des réponses par blocs terminés                                        | `false`                              |
| `channels.feishu.typingIndicator`                        | Envoyer des réactions de saisie                                                  | `true`                               |
| `channels.feishu.resolveSenderNames`                     | Résoudre les noms d’affichage des expéditeurs                                    | `true`                               |
| `channels.feishu.tools.bitable`                          | Activer les outils Bitable/Base                                                  | `true`                               |
| `channels.feishu.tools.base`                             | Alias pour `channels.feishu.tools.bitable` ; `bitable` explicite l’emporte lorsque les deux sont définis | `true`                               |
| `channels.feishu.accounts.<id>.tools.bitable`            | Garde d’outil Bitable/Base par compte                                            | hérité                               |
| `channels.feishu.accounts.<id>.tools.base`               | Alias par compte pour `tools.bitable`                                            | hérité                               |

---

## Types de messages pris en charge

### Réception

- ✅ Texte
- ✅ Texte enrichi (publication)
- ✅ Images
- ✅ Fichiers
- ✅ Audio
- ✅ Vidéo/média
- ✅ Autocollants

Les messages audio entrants Feishu/Lark sont normalisés sous forme de marqueurs de médias plutôt que de JSON `file_key` brut. Lorsque `tools.media.audio` est configuré, OpenClaw télécharge la ressource de note vocale et exécute la transcription audio partagée avant le tour de l’agent, afin que l’agent reçoive la transcription orale. Si Feishu inclut directement le texte de transcription dans la charge utile audio, ce texte est utilisé sans autre appel ASR. Sans fournisseur de transcription audio, l’agent reçoit tout de même un marqueur `<media:audio>` plus la pièce jointe enregistrée, et non la charge utile brute de la ressource Feishu.

### Envoi

- ✅ Texte
- ✅ Images
- ✅ Fichiers
- ✅ Audio
- ✅ Vidéo/média
- ✅ Cartes interactives (y compris les mises à jour en streaming)
- ⚠️ Texte enrichi (mise en forme de type publication ; ne prend pas en charge toutes les capacités de création Feishu/Lark)

Les bulles audio natives Feishu/Lark utilisent le type de message Feishu `audio` et nécessitent
un média téléversé en Ogg/Opus (`file_type: "opus"`). Les médias `.opus` et `.ogg` existants
sont envoyés directement comme audio natif. Les formats MP3/WAV/M4A et autres formats audio probables sont
transcodés en Ogg/Opus 48 kHz avec `ffmpeg` uniquement lorsque la réponse demande une
livraison vocale (`audioAsVoice` / outil de message `asVoice`, y compris les réponses
de notes vocales TTS). Les pièces jointes MP3 ordinaires restent des fichiers classiques. Si `ffmpeg` est absent ou si
la conversion échoue, OpenClaw revient à une pièce jointe de fichier et journalise la raison.

### Fils et réponses

- ✅ Réponses en ligne
- ✅ Réponses dans les fils
- ✅ Les réponses média restent conscientes du fil lorsqu’elles répondent à un message de fil

Pour `groupSessionScope: "group_topic"` et `"group_topic_sender"`, les groupes de sujets
Feishu/Lark natifs utilisent l’événement `thread_id` (`omt_*`) comme clé canonique
de session de sujet. Si un événement natif de démarrage de sujet omet `thread_id`, OpenClaw
l’hydrate depuis Feishu avant de router le tour. Les réponses de groupe normales qu’
OpenClaw transforme en fils continuent d’utiliser l’ID du message racine de réponse (`om_*`) afin que le
premier tour et le tour de suivi restent dans la même session.

---

## Connexe

- [Présentation des canaux](/fr/channels) - tous les canaux pris en charge
- [Association](/fr/channels/pairing) - authentification par DM et flux d’association
- [Groupes](/fr/channels/groups) - comportement des discussions de groupe et filtrage par mention
- [Routage des canaux](/fr/channels/channel-routing) - routage de session pour les messages
- [Sécurité](/fr/gateway/security) - modèle d’accès et durcissement
