---
read_when:
    - Modification du comportement des discussions de groupe ou du filtrage des mentions
    - Limiter mentionPatterns à des conversations de groupe spécifiques
sidebarTitle: Groups
summary: Comportement des discussions de groupe sur les différentes plateformes (Discord/iMessage/Matrix/Microsoft Teams/QQBot/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Groupes
x-i18n:
    generated_at: "2026-07-12T02:36:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b19356e801e0b44c8409b1eef59a32357977104d46a138934757c4e8a00ed44c
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw applique les mêmes règles de groupe à tous les canaux prenant en charge les groupes, notamment Discord, iMessage, Matrix, Microsoft Teams, QQBot, Signal, Slack, Telegram, WhatsApp et Zalo.

Pour les salons permanents qui doivent fournir un contexte discret, sauf si l’agent envoie explicitement un message visible, consultez [Événements ambiants de salon](/fr/channels/ambient-room-events).

## Introduction pour débutants (2 minutes)

OpenClaw « réside » dans vos propres comptes de messagerie. Il n’existe pas d’utilisateur bot WhatsApp distinct : si **vous** appartenez à un groupe, OpenClaw peut voir ce groupe et y répondre.

Comportement par défaut :

- Les groupes sont restreints (`groupPolicy: "allowlist"`) ; les expéditeurs des groupes sont bloqués jusqu’à leur ajout à la liste d’autorisation.
- Les réponses nécessitent une mention, sauf si vous désactivez ce filtrage pour un groupe.
- Le texte de la réponse finale est publié automatiquement dans le salon (`visibleReplies: "automatic"`).

Autrement dit : les expéditeurs figurant dans la liste d’autorisation peuvent déclencher OpenClaw en le mentionnant.

<Note>
**En bref**

- **L’accès aux DM** est contrôlé par `*.allowFrom`.
- **L’accès aux groupes** est contrôlé par `*.groupPolicy` et les listes d’autorisation (`*.groups`, `*.groupAllowFrom`).
- **Le déclenchement des réponses** est contrôlé par le filtrage des mentions (`requireMention`, `/activation`).

</Note>

Déroulement rapide (traitement d’un message de groupe) :

```text
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
mention/reply/command/DM -> user request
always-on group chatter -> user request, or room event when configured
```

## Réponses visibles

Pour les requêtes normales provenant d’un groupe ou d’un canal, OpenClaw utilise par défaut `messages.groupChat.visibleReplies: "automatic"` : le texte final de l’assistant est publié dans le salon en tant que réponse visible.

Utilisez `messages.groupChat.visibleReplies: "message_tool"` lorsqu’un salon partagé doit permettre à l’agent de décider quand intervenir en appelant `message(action=send)`. Ce mode fonctionne mieux avec les modèles qui utilisent les outils de manière fiable, par exemple GPT-5.6 Sol. Si le modèle n’utilise pas l’outil et renvoie un texte final substantiel, OpenClaw conserve ce texte en privé au lieu de le publier dans le salon.

Utilisez `"automatic"` pour les modèles ou environnements d’exécution qui ne respectent pas de manière fiable la remise exclusivement par outil : les textes finaux ordinaires sont publiés directement dans le salon, et l’agent peut toujours appeler `message(action=send)` pour les fichiers, images ou autres pièces jointes qui ne peuvent pas accompagner le texte final.

Si l’outil de messagerie n’est pas disponible selon la stratégie d’outils active, OpenClaw revient aux réponses visibles automatiques au lieu de supprimer silencieusement la réponse. `openclaw doctor` signale cette incohérence.

Pour les conversations directes et tout autre événement source, `messages.visibleReplies: "message_tool"` applique globalement le même comportement reposant exclusivement sur l’outil ; `messages.groupChat.visibleReplies` reste le remplacement plus spécifique pour les salons de groupe ou de canal. Les échanges directs du WebChat interne utilisent par défaut la remise automatique de la réponse finale afin que Pi et Codex bénéficient du même contrat de réponse visible.

Le mode reposant exclusivement sur l’outil remplace l’ancien mécanisme qui imposait au modèle de répondre `NO_REPLY` pour la plupart des échanges en mode d’observation silencieuse. Dans ce mode, l’invite ne définit aucun contrat `NO_REPLY` ; ne rien rendre visible signifie simplement ne pas appeler l’outil de messagerie.

Les liaisons de conversation appartenant à un Plugin constituent l’exception. Dès qu’un Plugin lie un fil et prend en charge l’échange entrant, la réponse renvoyée par le Plugin constitue la réponse visible de la liaison ; elle ne nécessite pas `message(action=send)`. Cette réponse est une sortie de l’environnement d’exécution du Plugin, et non le texte final privé du modèle.

Les indicateurs de saisie sont toujours envoyés pour les requêtes directes de groupe. Lorsqu’ils sont activés, les événements ambiants des salons permanents restent stricts et silencieux, sauf si l’agent appelle l’outil de messagerie.

Par défaut, les sessions suppriment les résumés détaillés des outils et de la progression. Utilisez `/verbose on` (ou `/verbose full`) pour les afficher dans la session actuelle pendant le débogage, puis `/verbose off` pour revenir à un comportement limité à la réponse finale. L’état détaillé est propre à chaque session et fonctionne de la même manière dans les conversations directes, les groupes, les canaux et les sujets de forum.

Pour transmettre les échanges non mentionnés d’un groupe permanent sous forme de contexte discret du salon plutôt que de requêtes utilisateur, utilisez [Événements ambiants de salon](/fr/channels/ambient-room-events) :

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
    },
  },
}
```

La valeur par défaut est `unmentionedInbound: "user_request"`. Les messages mentionnés, les commandes, les demandes d’interruption et les DM restent des requêtes utilisateur.

Pour imposer le passage de toute sortie visible par l’outil de messagerie pour les requêtes de groupe ou de canal :

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
}
```

Pour l’imposer à toutes les conversations sources :

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Le Gateway prend en compte les modifications de configuration de `messages` sans redémarrage après l’enregistrement du fichier. Redémarrez uniquement si le rechargement de la configuration est désactivé (`gateway.reload.mode: "off"`).

Les échanges de commande contournent `visibleReplies: "message_tool"` et répondent toujours visiblement : les commandes à barre oblique natives (Discord, Telegram et les autres interfaces prenant en charge les commandes natives), ainsi que les commandes textuelles `/...` autorisées, publient leur réponse dans la conversation source. Dans les groupes, les échanges textuels `/...` non autorisés restent limités à l’outil de messagerie ; les échanges ordinaires suivent la valeur par défaut configurée.

## Visibilité du contexte et listes d’autorisation

Deux contrôles distincts interviennent dans la sécurité des groupes :

- **Autorisation de déclenchement** : qui peut déclencher l’agent (`groupPolicy`, `groups`, `groupAllowFrom`, listes d’autorisation propres au canal).
- **Visibilité du contexte** : quel contexte complémentaire est injecté dans le modèle (texte de réponse ou de citation, historique du fil, métadonnées de transfert).

Par défaut, OpenClaw conserve le contexte tel qu’il est reçu : les listes d’autorisation déterminent qui peut déclencher des actions, et non les extraits cités ou historiques visibles par le modèle. Pour filtrer également le contexte complémentaire, définissez `contextVisibility` :

| Mode                | Comportement                                                                                                      |
| ------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `"all"` (par défaut) | Conserver le contexte complémentaire tel qu’il est reçu.                                                         |
| `"allowlist"`       | Injecter uniquement le contexte d’historique, de fil, de citation ou de transfert provenant d’expéditeurs autorisés. |
| `"allowlist_quote"` | Appliquer `allowlist` et conserver en plus le message explicitement cité ou auquel il est répondu, quel que soit son expéditeur. |

Définissez cette option par canal (`channels.<channel>.contextVisibility`), par compte (`channels.<channel>.accounts.<accountId>.contextVisibility`) ou globalement (`channels.defaults.contextVisibility`). Les canaux qui récupèrent du contexte complémentaire (Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp) appliquent cette stratégie lors de la construction du contexte entrant ; les combinaisons de stratégies inconnues échouent de manière sécurisée et omettent le contexte.

![Flux des messages de groupe](/images/groups-flow.svg)

Si vous souhaitez...

| Objectif                                                               | Configuration                                               |
| ---------------------------------------------------------------------- | ----------------------------------------------------------- |
| Autoriser tous les groupes, mais répondre uniquement aux @mentions     | `groups: { "*": { requireMention: true } }`                 |
| Désactiver toutes les réponses de groupe                               | `groupPolicy: "disabled"`                                   |
| Autoriser uniquement certains groupes                                  | `groups: { "<group-id>": { ... } }` (sans clé `"*"`)        |
| Être la seule personne pouvant déclencher l’agent dans les groupes     | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]`  |
| Réutiliser un ensemble d’expéditeurs de confiance sur plusieurs canaux | `groupAllowFrom: ["accessGroup:operators"]`                 |

Pour les listes d’autorisation d’expéditeurs réutilisables, consultez [Groupes d’accès](/fr/channels/access-groups).

## Clés de session

- Les sessions de groupe utilisent des clés de session `agent:<agentId>:<channel>:group:<id>` (les salons et canaux utilisent `agent:<agentId>:<channel>:channel:<id>`).
- Les sujets de forum Telegram ajoutent `:topic:<threadId>` à l’identifiant du groupe afin que chaque sujet possède sa propre session.
- Les conversations directes utilisent la session principale, ou des sessions propres à chaque expéditeur si `session.dmScope` est configuré.
- Les Heartbeats s’exécutent dans la session Heartbeat configurée (par défaut, la session principale de l’agent) ; les sessions de groupe n’exécutent pas leurs propres Heartbeats.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Modèle : DM personnels et groupes publics (agent unique)

Oui — cette configuration fonctionne bien si votre trafic « personnel » passe par des **DM** et votre trafic « public » par des **groupes**.

Explication : en mode agent unique, les DM arrivent généralement dans la clé de session **principale** (`agent:main:main`), tandis que les groupes utilisent toujours des clés de session **non principales** (`agent:main:<channel>:group:<id>`). Si vous activez l’isolation avec `mode: "non-main"`, ces sessions de groupe s’exécutent dans le moteur d’isolation configuré, tandis que votre session principale de DM reste sur l’hôte. Docker est le moteur par défaut si vous n’en choisissez aucun.

Vous disposez ainsi d’un seul « cerveau » d’agent (espace de travail et mémoire partagés), mais de deux modes d’exécution :

- **DM** : ensemble complet d’outils (hôte)
- **Groupes** : environnement isolé et outils restreints

<Note>
Si vous avez besoin d’espaces de travail ou de personnalités réellement distincts (« personnel » et « public » ne doivent jamais se mélanger), utilisez un second agent et des liaisons. Consultez [Routage multi-agent](/fr/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="DM sur l’hôte, groupes isolés">
    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main", // groups/channels are non-main -> sandboxed
            scope: "session", // strongest isolation (one container per group/channel)
            workspaceAccess: "none",
          },
        },
      },
      tools: {
        sandbox: {
          tools: {
            // If allow is non-empty, everything else is blocked (deny still wins).
            allow: ["group:messaging", "group:sessions"],
            deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Les groupes voient uniquement un dossier autorisé">
    Vous souhaitez que « les groupes puissent uniquement voir le dossier X » plutôt que de leur interdire tout accès à l’hôte ? Conservez `workspaceAccess: "none"` et montez uniquement les chemins autorisés dans l’environnement isolé :

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",
            scope: "session",
            workspaceAccess: "none",
            docker: {
              binds: [
                // hostPath:containerPath:mode
                "/home/user/FriendsShared:/data:ro",
              ],
            },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

Voir aussi :

- Clés de configuration et valeurs par défaut : [Configuration du Gateway](/fr/gateway/config-agents#agentsdefaultssandbox)
- Déterminer pourquoi un outil est bloqué : [Environnement isolé, stratégie d’outils et mode privilégié](/fr/gateway/sandbox-vs-tool-policy-vs-elevated)
- Détails des montages liés : [Isolation](/fr/gateway/sandboxing#custom-bind-mounts)

## Libellés d’affichage

- Les libellés de l’interface utilisent `displayName` lorsqu’il est disponible, au format `<channel>:<token>`.
- `#room` est réservé aux salons et aux canaux ; les conversations de groupe utilisent `g-<slug>` (minuscules, espaces remplacés par `-`, conservation de `#@+._-`). Les identifiants opaques très longs sont raccourcis en un jeton stable afin d’éviter d’exposer les identifiants de routage complets dans l’interface.

## Stratégie de groupe

Contrôlez le traitement des messages de groupe ou de salon pour chaque canal :

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // numeric Telegram user id (setup resolves @username)
    },
    signal: {
      groupPolicy: "disabled",
      groupAllowFrom: ["+15551234567"],
    },
    imessage: {
      groupPolicy: "disabled",
      groupAllowFrom: ["chat_id:123"],
    },
    msteams: {
      groupPolicy: "disabled",
      groupAllowFrom: ["user@org.com"],
    },
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        GUILD_ID: { channels: { help: { enabled: true } } },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { enabled: true } },
    },
    matrix: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["@owner:example.org"],
      groups: {
        "!roomId:example.org": { enabled: true },
        "#alias:example.org": { enabled: true },
      },
    },
  },
}
```

| Politique     | Comportement                                                                 |
| ------------- | ---------------------------------------------------------------------------- |
| `"open"`      | Les groupes contournent les listes d’autorisation ; le filtrage par mention s’applique toujours. |
| `"disabled"`  | Bloque entièrement tous les messages de groupe.                              |
| `"allowlist"` | Autorise uniquement les groupes/salons correspondant à la liste d’autorisation configurée. |

<AccordionGroup>
  <Accordion title="Remarques propres à chaque canal">
    - `groupPolicy` est distinct du filtrage par mention (qui nécessite des @mentions).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo : utilisez `groupAllowFrom` (solution de repli : `allowFrom` explicite).
    - Signal : `groupAllowFrom` peut correspondre soit à l’identifiant du groupe Signal entrant, soit au téléphone/UUID de l’expéditeur.
    - Les approbations d’association des messages directs (entrées du stockage `*-allowFrom`) s’appliquent uniquement à l’accès aux messages directs ; l’autorisation des expéditeurs de groupe reste explicitement définie par les listes d’autorisation de groupe.
    - Discord : la liste d’autorisation utilise `channels.discord.guilds.<id>.channels`.
    - Slack : la liste d’autorisation utilise `channels.slack.channels`.
    - Matrix : la liste d’autorisation utilise `channels.matrix.groups`. Utilisez des identifiants de salon (`!room:server`) ou des alias (`#alias:server`) ; les clés de nom de salon ne correspondent que si `channels.matrix.dangerouslyAllowNameMatching: true`, et les entrées non résolues sont ignorées à l’exécution. Utilisez `channels.matrix.groupAllowFrom` pour restreindre les expéditeurs ; les listes d’autorisation `users` par salon sont également prises en charge.
    - Les messages directs de groupe sont contrôlés séparément (`channels.discord.dm.*`, `channels.slack.dm.*` : `groupEnabled`, `groupChannels`).
    - Telegram : les listes d’autorisation d’expéditeurs acceptent uniquement les identifiants utilisateur numériques (`"123456789"` ; les préfixes `telegram:`/`tg:` sont supprimés sans tenir compte de la casse). Les entrées `@username` ne correspondent pas à l’exécution et génèrent un avertissement dans les journaux ; la configuration résout `@username` en identifiants. Les identifiants de discussion négatifs doivent figurer sous `channels.telegram.groups`, et non dans les listes d’autorisation d’expéditeurs.
    - La valeur par défaut est `groupPolicy: "allowlist"` ; si votre liste d’autorisation de groupe est vide, les messages de groupe sont bloqués.
    - Sécurité à l’exécution : lorsqu’un bloc de fournisseur est entièrement absent (`channels.<provider>` absent), la politique de groupe se ferme de manière sécurisée sur `allowlist` au lieu d’hériter de `channels.defaults.groupPolicy`, et le Gateway consigne cette solution de repli une fois par compte.

  </Accordion>
</AccordionGroup>

Modèle mental rapide (ordre d’évaluation des messages de groupe) :

<Steps>
  <Step title="Politique de groupe">
    `groupPolicy` (ouvert/désactivé/liste d’autorisation).
  </Step>
  <Step title="Listes d’autorisation de groupe">
    Listes d’autorisation de groupe (`*.groups`, `*.groupAllowFrom`, liste d’autorisation propre au canal).
  </Step>
  <Step title="Filtrage par mention">
    Filtrage par mention (`requireMention`, `/activation`).
  </Step>
</Steps>

## Filtrage par mention (par défaut)

Les messages de groupe nécessitent une mention, sauf remplacement pour un groupe donné. Les valeurs par défaut se trouvent dans chaque sous-système sous `*.groups."*"`.

Répondre à un message du bot compte comme une mention implicite lorsque le canal fournit les métadonnées de réponse ; citer un message du bot peut également compter sur les canaux qui fournissent des métadonnées de citation. Cas intégrés actuels : Discord, Microsoft Teams, QQBot, Slack, Telegram, WhatsApp et Zalo personnel.

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
        "123@g.us": { requireMention: false },
      },
    },
    telegram: {
      groups: {
        "*": { requireMention: true },
        "123456789": { requireMention: false },
      },
    },
    imessage: {
      groups: {
        "*": { requireMention: true },
        "123": { requireMention: false },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw", "\\+15555550123"],
          historyLimit: 50,
        },
      },
    ],
  },
}
```

## Restreindre la portée des motifs de mention configurés

Les `mentionPatterns` configurés sont des déclencheurs de repli basés sur des expressions régulières. Utilisez-les lorsque la plateforme ne fournit pas de mention native du bot, ou lorsqu’un texte brut tel que `openclaw:` doit compter comme une mention. Les mentions natives de la plateforme sont distinctes : lorsque Discord, Slack, Telegram, Matrix ou un autre canal peut établir que le message mentionne explicitement le bot, cette mention native déclenche toujours l’agent, même lorsque les motifs d’expression régulière configurés sont refusés.

Par défaut, les motifs de mention configurés s’appliquent partout où le canal transmet les informations sur le fournisseur et la conversation à la détection des mentions. Pour éviter que des motifs larges ne réveillent l’agent dans chaque groupe, restreignez leur portée par canal avec `channels.<channel>.mentionPatterns`.

Utilisez `mode: "deny"` lorsque les motifs de mention par expression régulière doivent être désactivés par défaut pour un canal, puis activez-les dans des salons précis avec `allowIn` :

```json5
{
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b", "\\bops bot\\b"],
    },
  },
  channels: {
    slack: {
      mentionPatterns: {
        mode: "deny",
        allowIn: ["C0123OPS"],
      },
    },
  },
}
```

Utilisez le `mode: "allow"` par défaut (ou omettez `mode`) lorsque les motifs de mention par expression régulière doivent s’appliquer largement, puis désactivez-les dans les salons bruyants avec `denyIn` :

```json5
{
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b"],
    },
  },
  channels: {
    telegram: {
      mentionPatterns: {
        denyIn: ["-1001234567890", "-1001234567890:topic:42"],
      },
    },
  },
}
```

Résolution de la politique :

| Champ           | Effet                                                                                                                               |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `mode: "allow"` | Les motifs de mention par expression régulière sont activés, sauf si l’identifiant de conversation figure dans `denyIn`. C’est la valeur par défaut. |
| `mode: "deny"`  | Les motifs de mention par expression régulière sont désactivés, sauf si l’identifiant de conversation figure dans `allowIn`.        |
| `allowIn`       | Identifiants de conversation pour lesquels les motifs de mention par expression régulière sont activés en mode de refus.            |
| `denyIn`        | Identifiants de conversation pour lesquels les motifs de mention par expression régulière sont désactivés. `denyIn` l’emporte sur `allowIn` si les deux contiennent le même identifiant. |

Politique d’expressions régulières à portée limitée actuellement prise en charge :

| Canal     | Identifiants utilisés dans `allowIn` / `denyIn`                                  |
| --------- | -------------------------------------------------------------------------------- |
| Discord   | Identifiants de canal Discord.                                                    |
| Matrix    | Identifiants de salon Matrix.                                                     |
| Slack     | Identifiants de canal Slack.                                                      |
| Telegram  | Identifiants de discussion de groupe, ou `chatId:topic:threadId` pour les sujets de forum. |
| WhatsApp  | Identifiants de conversation WhatsApp tels que `123@g.us`.                        |

Les configurations de canal au niveau du compte peuvent définir la même politique sous `channels.<channel>.accounts.<accountId>.mentionPatterns` lorsque ce canal prend en charge plusieurs comptes. Pour ce compte, la politique du compte est prioritaire sur la politique générale du canal.

<AccordionGroup>
  <Accordion title="Remarques sur le filtrage par mention">
    - Les `mentionPatterns` sont des expressions régulières sûres et insensibles à la casse ; les motifs non valides et les formes dangereuses à répétitions imbriquées sont ignorés (avec un avertissement).
    - Priorité des motifs : `agents.list[].groupChat.mentionPatterns` (utile lorsque plusieurs agents partagent un groupe) remplace `messages.groupChat.mentionPatterns` ; lorsque ni l’un ni l’autre n’est défini, les motifs sont dérivés du nom/de l’émoji de l’identité de l’agent.
    - Le filtrage par mention n’est appliqué que lorsque la détection des mentions est possible (mentions natives ou `mentionPatterns` configurés).
    - L’ajout d’un groupe ou d’un expéditeur à une liste d’autorisation ne désactive pas le filtrage par mention ; définissez `requireMention` sur `false` pour ce groupe lorsque tous les messages doivent déclencher l’agent.
    - Le contexte automatique de l’invite de discussion de groupe inclut à chaque tour l’instruction résolue de réponse silencieuse ; les fichiers de l’espace de travail ne doivent pas dupliquer le mécanisme `NO_REPLY`.
    - Les groupes dans lesquels les réponses silencieuses automatiques sont autorisées traitent les tours du modèle entièrement vides ou contenant uniquement du raisonnement comme silencieux, de manière équivalente à `NO_REPLY`. Les discussions directes ne reçoivent jamais d’instruction `NO_REPLY`, et les réponses de groupe utilisant uniquement l’outil de messagerie restent silencieuses en n’appelant pas `message(action=send)`.
    - Les conversations ambiantes et permanentes des groupes utilisent par défaut la sémantique des requêtes utilisateur. Définissez `messages.groupChat.unmentionedInbound: "room_event"` pour les soumettre plutôt comme contexte silencieux. Consultez [Événements ambiants de salon](/fr/channels/ambient-room-events) pour des exemples de configuration.
    - Les événements de salon ne sont pas stockés comme de fausses requêtes utilisateur, et le texte privé de l’assistant provenant d’événements de salon sans outil de messagerie n’est pas rejoué dans l’historique de discussion.
    - Les valeurs par défaut de Discord se trouvent dans `channels.discord.guilds."*"` (remplaçables par serveur/canal).
    - Le contexte de l’historique de groupe est encapsulé uniformément sur tous les canaux. Les groupes filtrés par mention conservent les messages ignorés en attente ; les groupes permanents peuvent également conserver les messages récents de salon déjà traités lorsque le canal le permet. Utilisez `messages.groupChat.historyLimit` comme valeur globale par défaut et `channels.<channel>.historyLimit` (ou `channels.<channel>.accounts.*.historyLimit`) pour les remplacements. Définissez `0` pour désactiver cette fonctionnalité.

  </Accordion>
</AccordionGroup>

## Restrictions des outils par groupe/canal (facultatif)

Certaines configurations de canal permettent de restreindre les outils disponibles **dans un groupe/salon/canal précis**.

- `tools` : autorise/refuse des outils pour l’ensemble du groupe (`allow`, `alsoAllow`, `deny` ; le refus l’emporte).
- `toolsBySender` : remplacements par expéditeur au sein du groupe. Utilisez des préfixes de clé explicites : `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` et le caractère générique `"*"`. Les identifiants de canal utilisent les identifiants de canal OpenClaw canoniques ; les alias tels que `teams` sont normalisés en `msteams`. Les anciennes clés sans préfixe restent acceptées, correspondent uniquement comme `id:` et génèrent un avertissement d’obsolescence dans les journaux.

Ordre de résolution (le plus précis l’emporte) :

<Steps>
  <Step title="toolsBySender du groupe">
    Correspondance avec `toolsBySender` du groupe/canal.
  </Step>
  <Step title="Outils du groupe">
    `tools` du groupe/canal.
  </Step>
  <Step title="toolsBySender par défaut">
    Correspondance avec `toolsBySender` par défaut (`"*"`).
  </Step>
  <Step title="Outils par défaut">
    `tools` par défaut (`"*"`).
  </Step>
</Steps>

Exemple (Telegram) :

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { tools: { deny: ["exec"] } },
        "-1001234567890": {
          tools: { deny: ["exec", "read", "write"] },
          toolsBySender: {
            "id:123456789": { alsoAllow: ["exec"] },
          },
        },
      },
    },
  },
}
```

<Note>
Les restrictions des outils par groupe/canal s’appliquent en plus de la politique globale/des outils de l’agent (le refus l’emporte toujours). Certains canaux utilisent une imbrication différente pour les salons/canaux (par exemple, Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Listes d’autorisation de groupe

Lorsque `channels.whatsapp.groups`, `channels.telegram.groups` ou `channels.imessage.groups` est configuré, les clés servent de liste d’autorisation de groupe. Utilisez `"*"` pour autoriser tous les groupes tout en définissant le comportement par défaut des mentions.

<Warning>
Confusion fréquente : l’approbation de l’appairage en message privé n’est pas équivalente à l’autorisation de groupe. Pour les canaux qui prennent en charge l’appairage en message privé, le registre d’appairage déverrouille uniquement les messages privés. Les commandes de groupe nécessitent toujours une autorisation explicite de l’expéditeur dans le groupe, définie par des listes d’autorisation de configuration telles que `groupAllowFrom` ou par la configuration de repli documentée pour ce canal.
</Warning>

Intentions courantes (copier-coller) :

<Tabs>
  <Tab title="Désactiver toutes les réponses de groupe">
    ```json5
    {
      channels: { whatsapp: { groupPolicy: "disabled" } },
    }
    ```
  </Tab>
  <Tab title="Autoriser uniquement certains groupes (WhatsApp)">
    ```json5
    {
      channels: {
        whatsapp: {
          groups: {
            "123@g.us": { requireMention: true },
            "456@g.us": { requireMention: false },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Autoriser tous les groupes, mais exiger une mention">
    ```json5
    {
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Déclencheurs réservés au propriétaire (WhatsApp)">
    ```json5
    {
      channels: {
        whatsapp: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15551234567"],
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## Activation (propriétaire uniquement)

Les propriétaires de groupe peuvent basculer le mode d’activation de chaque groupe avec un message autonome :

- `/activation mention`
- `/activation always`

`/activation` est une commande principale réservée au propriétaire et ne s’applique qu’aux discussions de groupe. Le propriétaire est l’expéditeur qui correspond à la valeur `allowFrom` / `commands.ownerAllowFrom` du canal (lorsqu’aucune liste d’autorisation n’est configurée, l’identifiant propre au compte est considéré comme celui du propriétaire). Le mode enregistré remplace la valeur `requireMention` de ce groupe sur les canaux qui le consultent (Google Chat, QQBot, Telegram, WhatsApp), et l’introduction de l’invite système du groupe reflète partout le mode actif.

## Champs de contexte

Les charges utiles entrantes des groupes définissent :

- `ChatType=group`
- `GroupSubject` (s’il est connu)
- `GroupMembers` (s’ils sont connus)
- `WasMentioned` (résultat du filtrage par mention)
- Les sujets de forum Telegram incluent également `MessageThreadId` et `IsForum`.

L’invite système de l’agent inclut une introduction de groupe au premier tour d’une nouvelle session de groupe (ainsi qu’après une modification avec `/activation`). Elle rappelle au modèle de répondre comme un humain, de réduire au minimum les lignes vides, de respecter l’espacement habituel des discussions et d’éviter de saisir des séquences `\n` littérales. Les groupes autres que Telegram déconseillent également les tableaux Markdown ; les recommandations de texte enrichi de Telegram proviennent de l’invite du canal Telegram. Les noms de groupe et les libellés de participants provenant du canal sont affichés sous forme de métadonnées non fiables dans des blocs délimités, et non comme des instructions système intégrées.

## Particularités d’iMessage

- Préférez `chat_id:<id>` pour le routage ou l’ajout à une liste d’autorisation.
- Répertoriez les discussions : `imsg chats --limit 20`.
- Les réponses de groupe sont toujours renvoyées au même `chat_id`.

## Invites système de WhatsApp

Consultez [WhatsApp](/fr/channels/whatsapp#system-prompts) pour connaître les règles de référence des invites système WhatsApp, notamment la résolution des invites de groupe et directes, le comportement des caractères génériques et la sémantique des remplacements propres au compte.

## Particularités de WhatsApp

Consultez [Messages de groupe](/fr/channels/group-messages) pour le comportement propre à WhatsApp (injection de l’historique et détails de gestion des mentions).

## Pages connexes

- [Groupes de diffusion](/fr/channels/broadcast-groups)
- [Routage des canaux](/fr/channels/channel-routing)
- [Messages de groupe](/fr/channels/group-messages)
- [Appairage](/fr/channels/pairing)
