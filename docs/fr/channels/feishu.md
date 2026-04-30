---
read_when:
    - Vous souhaitez connecter un bot Feishu/Lark
    - Vous configurez le canal Feishu
summary: Présentation, fonctionnalités et configuration du bot Feishu
title: Feishu
x-i18n:
    generated_at: "2026-04-30T07:12:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37de7cbb12821f119ca1a06fcdb8e80a07752e1cbfc462344d24750fbf13147a
    source_path: channels/feishu.md
    workflow: 16
---

# Feishu / Lark

Feishu/Lark est une plateforme de collaboration tout-en-un où les équipes discutent, partagent des documents, gèrent des calendriers et travaillent ensemble.

**Statut :** prêt pour la production pour les messages directs aux bots et les discussions de groupe. WebSocket est le mode par défaut ; le mode webhook est facultatif.

---

## Démarrage rapide

<Note>
Nécessite OpenClaw 2026.4.25 ou une version ultérieure. Exécutez `openclaw --version` pour vérifier. Mettez à niveau avec `openclaw update`.
</Note>

<Steps>
  <Step title="Exécuter l’assistant de configuration du canal">
  ```bash
  openclaw channels login --channel feishu
  ```
  Scannez le code QR avec votre application mobile Feishu/Lark pour créer automatiquement un bot Feishu/Lark.
  </Step>
  
  <Step title="Une fois la configuration terminée, redémarrer le Gateway pour appliquer les modifications">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## Contrôle d’accès

### Messages directs

Configurez `dmPolicy` pour contrôler qui peut envoyer un message direct au bot :

- `"pairing"` — les utilisateurs inconnus reçoivent un code d’appairage ; approuvez via la CLI
- `"allowlist"` — seuls les utilisateurs listés dans `allowFrom` peuvent discuter (par défaut : propriétaire du bot uniquement)
- `"open"` — autorise les messages directs publics uniquement lorsque `allowFrom` inclut `"*"` ; avec des entrées restrictives, seuls les utilisateurs correspondants peuvent discuter
- `"disabled"` — désactive tous les messages directs

**Approuver une demande d’appairage :**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Discussions de groupe

**Politique de groupe** (`channels.feishu.groupPolicy`) :

| Valeur        | Comportement                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `"open"`      | Répondre à tous les messages dans les groupes                                                            |
| `"allowlist"` | Répondre uniquement aux groupes dans `groupAllowFrom` ou explicitement configurés sous `groups.<chat_id>` |
| `"disabled"`  | Désactiver tous les messages de groupe ; les entrées explicites `groups.<chat_id>` ne remplacent pas ce réglage         |

Par défaut : `allowlist`

**Exigence de mention** (`channels.feishu.requireMention`) :

- `true` — exiger une @mention (par défaut)
- `false` — répondre sans @mention
- Remplacement par groupe : `channels.feishu.groups.<chat_id>.requireMention`
- Les mentions de diffusion uniquement `@all` et `@_all` ne sont pas traitées comme des mentions du bot. Un message qui mentionne à la fois `@all` et le bot directement compte tout de même comme une mention du bot.

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
      // Group IDs look like: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

En mode `allowlist`, vous pouvez également admettre un groupe en ajoutant une entrée explicite `groups.<chat_id>`. Les entrées explicites ne remplacent pas `groupPolicy: "disabled"`. Les valeurs par défaut avec caractère générique sous `groups.*` configurent les groupes correspondants, mais ne les admettent pas à elles seules.

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

## Obtenir les ID de groupe/utilisateur

### ID de groupe (`chat_id`, format : `oc_xxx`)

Ouvrez le groupe dans Feishu/Lark, cliquez sur l’icône de menu dans l’angle supérieur droit, puis accédez à **Paramètres**. L’ID du groupe (`chat_id`) est listé sur la page des paramètres.

![Obtenir l’ID du groupe](/images/feishu-get-group-id.png)

### ID utilisateur (`open_id`, format : `ou_xxx`)

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

| Commande  | Description                 |
| --------- | --------------------------- |
| `/status` | Afficher le statut du bot             |
| `/reset`  | Réinitialiser la session actuelle   |
| `/model`  | Afficher ou changer le modèle d’IA |

<Note>
Feishu/Lark ne prend pas en charge les menus de commandes slash natifs ; envoyez donc ces commandes comme des messages texte simples.
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

`defaultAccount` contrôle le compte utilisé lorsque les API sortantes ne spécifient pas d’`accountId`.
`accounts.<id>.tts` utilise la même forme que `messages.tts` et se fusionne en profondeur avec
la configuration TTS globale ; les configurations Feishu multi-bots peuvent ainsi conserver les identifiants
de fournisseur partagés globalement tout en remplaçant uniquement la voix, le modèle, le persona ou le mode automatique
par compte.

### Limites de messages

- `textChunkLimit` — taille des fragments de texte sortants (par défaut : `2000` caractères)
- `mediaMaxMb` — limite de téléversement/téléchargement des médias (par défaut : `30` Mo)

### Streaming

Feishu/Lark prend en charge les réponses en streaming via des cartes interactives. Lorsqu’il est activé, le bot met à jour la carte en temps réel pendant qu’il génère le texte.

```json5
{
  channels: {
    feishu: {
      streaming: true, // enable streaming card output (default: true)
      blockStreaming: true, // enable block-level streaming (default: true)
    },
  },
}
```

Définissez `streaming: false` pour envoyer la réponse complète dans un seul message.

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

Feishu/Lark prend en charge ACP pour les messages directs et les messages de fils de groupe. ACP Feishu/Lark est piloté par commandes texte : il n’existe pas de menus de commandes slash natifs ; utilisez donc les messages `/acp ...` directement dans la conversation.

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

Dans un message direct ou un fil Feishu/Lark :

```text
/acp spawn codex --thread here
```

`--thread here` fonctionne pour les messages directs et les messages de fil Feishu/Lark. Les messages de suivi dans la conversation liée sont acheminés directement vers cette session ACP.

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
- `match.peer.id` : Open ID utilisateur (`ou_xxx`) ou ID de groupe (`oc_xxx`)

Consultez [Obtenir les ID de groupe/utilisateur](#get-groupuser-ids) pour des conseils de recherche.

---

## Référence de configuration

Configuration complète : [Configuration du Gateway](/fr/gateway/configuration)

| Paramètre                                         | Description                                                                      | Valeur par défaut |
| ------------------------------------------------- | -------------------------------------------------------------------------------- | ----------------- |
| `channels.feishu.enabled`                         | Activer/désactiver le canal                                                      | `true`            |
| `channels.feishu.domain`                          | Domaine d’API (`feishu` ou `lark`)                                               | `feishu`          |
| `channels.feishu.connectionMode`                  | Transport des événements (`websocket` ou `webhook`)                              | `websocket`       |
| `channels.feishu.defaultAccount`                  | Compte par défaut pour le routage sortant                                        | `default`         |
| `channels.feishu.verificationToken`               | Requis pour le mode Webhook                                                      | —                 |
| `channels.feishu.encryptKey`                      | Requis pour le mode Webhook                                                      | —                 |
| `channels.feishu.webhookPath`                     | Chemin de route Webhook                                                          | `/feishu/events`  |
| `channels.feishu.webhookHost`                     | Hôte de liaison Webhook                                                          | `127.0.0.1`       |
| `channels.feishu.webhookPort`                     | Port de liaison Webhook                                                          | `3000`            |
| `channels.feishu.accounts.<id>.appId`             | ID d’application                                                                 | —                 |
| `channels.feishu.accounts.<id>.appSecret`         | Secret d’application                                                             | —                 |
| `channels.feishu.accounts.<id>.domain`            | Remplacement du domaine par compte                                               | `feishu`          |
| `channels.feishu.accounts.<id>.tts`               | Remplacement TTS par compte                                                      | `messages.tts`    |
| `channels.feishu.dmPolicy`                        | Politique de messages directs                                                    | `allowlist`       |
| `channels.feishu.allowFrom`                       | Liste d’autorisation des messages directs (liste `open_id`)                      | [BotOwnerId]      |
| `channels.feishu.groupPolicy`                     | Politique de groupe                                                              | `allowlist`       |
| `channels.feishu.groupAllowFrom`                  | Liste d’autorisation de groupe                                                   | —                 |
| `channels.feishu.requireMention`                  | Exiger une @mention dans les groupes                                             | `true`            |
| `channels.feishu.groups.<chat_id>.requireMention` | Remplacement de @mention par groupe ; les ID explicites admettent aussi le groupe en mode liste d’autorisation | hérité            |
| `channels.feishu.groups.<chat_id>.enabled`        | Activer/désactiver un groupe spécifique                                          | `true`            |
| `channels.feishu.textChunkLimit`                  | Taille des fragments de message                                                  | `2000`            |
| `channels.feishu.mediaMaxMb`                      | Limite de taille des médias                                                      | `30`              |
| `channels.feishu.streaming`                       | Sortie de carte en streaming                                                     | `true`            |
| `channels.feishu.blockStreaming`                  | Streaming au niveau des blocs                                                    | `true`            |
| `channels.feishu.typingIndicator`                 | Envoyer des réactions de saisie                                                  | `true`            |
| `channels.feishu.resolveSenderNames`              | Résoudre les noms d’affichage des expéditeurs                                    | `true`            |

---

## Types de messages pris en charge

### Réception

- ✅ Texte
- ✅ Texte riche (publication)
- ✅ Images
- ✅ Fichiers
- ✅ Audio
- ✅ Vidéo/média
- ✅ Autocollants

Les messages audio entrants Feishu/Lark sont normalisés sous forme de placeholders de média au lieu de JSON `file_key` brut. Lorsque `tools.media.audio` est configuré, OpenClaw télécharge la ressource de note vocale et exécute la transcription audio partagée avant le tour de l’agent, afin que l’agent reçoive la transcription parlée. Si Feishu inclut directement le texte de transcription dans la charge utile audio, ce texte est utilisé sans autre appel ASR. Sans fournisseur de transcription audio, l’agent reçoit tout de même un placeholder `<media:audio>` ainsi que la pièce jointe enregistrée, et non la charge utile brute de la ressource Feishu.

### Envoi

- ✅ Texte
- ✅ Images
- ✅ Fichiers
- ✅ Audio
- ✅ Vidéo/média
- ✅ Cartes interactives (y compris les mises à jour en streaming)
- ⚠️ Texte riche (mise en forme de style publication ; ne prend pas en charge toutes les fonctionnalités d’édition Feishu/Lark)

Les bulles audio natives Feishu/Lark utilisent le type de message Feishu `audio` et nécessitent un média téléversé en Ogg/Opus (`file_type: "opus"`). Les médias `.opus` et `.ogg` existants sont envoyés directement comme audio natif. MP3/WAV/M4A et les autres formats audio probables sont transcodés en Ogg/Opus 48 kHz avec `ffmpeg` uniquement lorsque la réponse demande une livraison vocale (`audioAsVoice` / outil de message `asVoice`, y compris les réponses de notes vocales TTS). Les pièces jointes MP3 ordinaires restent des fichiers normaux. Si `ffmpeg` est absent ou si la conversion échoue, OpenClaw revient à une pièce jointe de fichier et journalise la raison.

### Fils et réponses

- ✅ Réponses en ligne
- ✅ Réponses dans le fil
- ✅ Les réponses média restent conscientes du fil lorsqu’elles répondent à un message de fil

Pour `groupSessionScope: "group_topic"` et `"group_topic_sender"`, les groupes de sujets natifs Feishu/Lark utilisent le `thread_id` de l’événement (`omt_*`) comme clé canonique de session de sujet. Les réponses de groupe normales qu’OpenClaw transforme en fils continuent d’utiliser l’ID du message racine de la réponse (`om_*`), afin que le premier tour et le tour de suivi restent dans la même session.

---

## Connexe

- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Appairage](/fr/channels/pairing) — authentification par messages directs et flux d’appairage
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et filtrage par mention
- [Routage des canaux](/fr/channels/channel-routing) — routage des sessions pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et durcissement
