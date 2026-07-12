---
read_when:
    - Modification du comportement des discussions de groupe ou du filtrage des mentions
    - Limiter mentionPatterns à des conversations de groupe spécifiques
sidebarTitle: Groups
summary: Comportement des discussions de groupe sur les différentes plateformes (Discord/iMessage/Matrix/Microsoft Teams/QQBot/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Groupes
x-i18n:
    generated_at: "2026-07-12T15:01:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b19356e801e0b44c8409b1eef59a32357977104d46a138934757c4e8a00ed44c
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw applique les mêmes règles de groupe à tous les canaux prenant en charge les groupes, notamment Discord, iMessage, Matrix, Microsoft Teams, QQBot, Signal, Slack, Telegram, WhatsApp et Zalo.

Pour les salons toujours actifs qui doivent fournir un contexte discret, sauf si l’agent envoie explicitement un message visible, consultez [Événements de salon ambiant](/fr/channels/ambient-room-events).

## Introduction pour débutants (2 minutes)

OpenClaw « réside » dans vos propres comptes de messagerie. Il n’existe pas d’utilisateur bot WhatsApp distinct : si **vous** faites partie d’un groupe, OpenClaw peut voir ce groupe et y répondre.

Comportement par défaut :

- Les groupes sont restreints (`groupPolicy: "allowlist"`) ; les expéditeurs des groupes sont bloqués jusqu’à leur ajout à la liste d’autorisation.
- Les réponses nécessitent une mention, sauf si vous désactivez le filtrage par mention pour un groupe.
- Le texte de la réponse finale est publié automatiquement dans le salon (`visibleReplies: "automatic"`).

Autrement dit : les expéditeurs figurant dans la liste d’autorisation peuvent déclencher OpenClaw en le mentionnant.

<Note>
**En bref**

- **L’accès aux messages privés** est contrôlé par `*.allowFrom`.
- **L’accès aux groupes** est contrôlé par `*.groupPolicy` et les listes d’autorisation (`*.groups`, `*.groupAllowFrom`).
- **Le déclenchement des réponses** est contrôlé par le filtrage par mention (`requireMention`, `/activation`).

</Note>

Déroulement rapide (traitement d’un message de groupe) :

```text
groupPolicy ? disabled -> ignorer
groupPolicy ? allowlist -> groupe autorisé ? non -> ignorer
requireMention ? oui -> mentionné ? non -> stocker uniquement comme contexte
mention/réponse/commande/message privé -> requête utilisateur
conversation de groupe toujours active -> requête utilisateur, ou événement de salon si configuré
```

## Réponses visibles

Pour les requêtes normales de groupe ou de canal, OpenClaw utilise par défaut `messages.groupChat.visibleReplies: "automatic"` : le texte final de l’assistant est publié dans le salon en tant que réponse visible.

Utilisez `messages.groupChat.visibleReplies: "message_tool"` lorsqu’un salon partagé doit laisser l’agent décider quand intervenir en appelant `message(action=send)`. Ce mode fonctionne mieux avec les modèles qui utilisent les outils de manière fiable (par exemple GPT-5.6 Sol). Si le modèle omet l’outil et renvoie un texte final substantiel, OpenClaw conserve ce texte en privé au lieu de le publier dans le salon.

Utilisez `"automatic"` pour les modèles ou les environnements d’exécution qui ne respectent pas de manière fiable l’envoi exclusivement par outil : les textes finaux ordinaires sont publiés directement dans le salon, et l’agent peut toujours appeler `message(action=send)` pour les fichiers, images ou autres pièces jointes qui ne peuvent pas accompagner le texte final.

Si l’outil de messagerie n’est pas disponible selon la politique d’outils active, OpenClaw revient aux réponses visibles automatiques au lieu de supprimer silencieusement la réponse. `openclaw doctor` signale cette incohérence.

Pour les conversations directes et tout autre événement source, `messages.visibleReplies: "message_tool"` applique globalement le même comportement d’envoi exclusivement par outil ; `messages.groupChat.visibleReplies` reste la substitution plus spécifique pour les salons de groupe ou de canal. Les interactions directes dans le WebChat interne utilisent par défaut l’envoi automatique de la réponse finale, afin que Pi et Codex bénéficient du même contrat de réponse visible.

Le mode d’envoi exclusivement par outil remplace l’ancien modèle qui consistait à forcer le modèle à répondre `NO_REPLY` pour la plupart des interactions en mode d’observation. Dans ce mode, l’invite ne définit aucun contrat `NO_REPLY` ; ne rien rendre visible signifie simplement ne pas appeler l’outil de messagerie.

Les liaisons de conversation gérées par un Plugin constituent l’exception. Dès qu’un Plugin lie un fil de discussion et revendique l’interaction entrante, la réponse renvoyée par le Plugin constitue la réponse visible de la liaison ; elle ne nécessite pas `message(action=send)`. Cette réponse est une sortie de l’environnement d’exécution du Plugin, et non le texte final privé du modèle.

Les indicateurs de saisie sont toujours envoyés pour les requêtes directes de groupe. Lorsqu’ils sont activés, les événements ambiants des salons toujours actifs restent strictement silencieux, sauf si l’agent appelle l’outil de messagerie.

Par défaut, les sessions masquent les résumés détaillés des outils et de la progression. Utilisez `/verbose on` (ou `/verbose full`) pour les afficher dans la session actuelle pendant le débogage, et `/verbose off` pour revenir à un comportement limité aux réponses finales. L’état détaillé est propre à chaque session et fonctionne de la même manière dans les conversations directes, les groupes, les canaux et les sujets de forum.

Pour soumettre les conversations de groupe toujours actives et sans mention comme contexte discret de salon plutôt que comme requêtes utilisateur, utilisez [Événements de salon ambiant](/fr/channels/ambient-room-events) :

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
    },
  },
}
```

La valeur par défaut est `unmentionedInbound: "user_request"`. Les messages comportant une mention, les commandes, les demandes d’interruption et les messages privés restent des requêtes utilisateur.

Pour exiger que les sorties visibles des requêtes de groupe ou de canal passent par l’outil de messagerie :

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
}
```

Pour l’exiger dans toutes les conversations sources :

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Le Gateway prend en compte les modifications de la configuration `messages` sans redémarrage après l’enregistrement du fichier. Redémarrez uniquement si le rechargement de la configuration est désactivé (`gateway.reload.mode: "off"`).

Les interactions de commande contournent `visibleReplies: "message_tool"` et répondent toujours de manière visible : les commandes slash natives (Discord, Telegram et les autres interfaces prenant en charge les commandes natives), ainsi que les commandes textuelles `/...` autorisées, publient leur réponse dans la conversation source. Dans les groupes, les interactions textuelles `/...` non autorisées restent limitées à l’outil de messagerie ; les interactions de conversation ordinaires suivent la valeur par défaut configurée.

## Visibilité du contexte et listes d’autorisation

La sécurité des groupes repose sur deux contrôles distincts :

- **Autorisation de déclenchement** : qui peut déclencher l’agent (`groupPolicy`, `groups`, `groupAllowFrom`, listes d’autorisation propres au canal).
- **Visibilité du contexte** : quel contexte complémentaire est injecté dans le modèle (texte de réponse ou de citation, historique du fil de discussion, métadonnées transférées).

Par défaut, OpenClaw conserve le contexte tel qu’il est reçu : les listes d’autorisation déterminent qui peut déclencher des actions, et non quels extraits cités ou historiques le modèle peut voir. Pour filtrer également le contexte complémentaire, définissez `contextVisibility` :

| Mode                | Comportement                                                                                                         |
| ------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `"all"` (par défaut)   | Conserver le contexte complémentaire tel qu’il est reçu.                                                            |
| `"allowlist"`       | Injecter uniquement l’historique, les fils de discussion, les citations et le contexte transféré provenant d’expéditeurs figurant dans la liste d’autorisation. |
| `"allowlist_quote"` | Appliquer `allowlist` et conserver en plus le message explicitement cité ou auquel il est répondu, quel que soit son expéditeur. |

Définissez cette option par canal (`channels.<channel>.contextVisibility`), par compte (`channels.<channel>.accounts.<accountId>.contextVisibility`) ou globalement (`channels.defaults.contextVisibility`). Les canaux qui récupèrent un contexte complémentaire (Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp) appliquent la politique lors de la création du contexte entrant ; les combinaisons de politiques inconnues échouent en mode fermé et omettent le contexte.

![Flux des messages de groupe](/images/groups-flow.svg)

Si vous souhaitez...

| Objectif                                                     | Paramètre à définir                                        |
| ------------------------------------------------------------ | ---------------------------------------------------------- |
| Autoriser tous les groupes, mais répondre uniquement aux @mentions | `groups: { "*": { requireMention: true } }`                |
| Désactiver toutes les réponses de groupe                     | `groupPolicy: "disabled"`                                  |
| Autoriser uniquement certains groupes                        | `groups: { "<group-id>": { ... } }` (sans clé `"*"`)       |
| Vous seul pouvez déclencher l’agent dans les groupes          | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| Réutiliser un même ensemble d’expéditeurs de confiance sur plusieurs canaux | `groupAllowFrom: ["accessGroup:operators"]`                |

Pour les listes d’autorisation d’expéditeurs réutilisables, consultez [Groupes d’accès](/fr/channels/access-groups).

## Clés de session

- Les sessions de groupe utilisent des clés de session `agent:<agentId>:<channel>:group:<id>` (les salons et canaux utilisent `agent:<agentId>:<channel>:channel:<id>`).
- Les sujets de forum Telegram ajoutent `:topic:<threadId>` à l’identifiant du groupe, afin que chaque sujet dispose de sa propre session.
- Les conversations directes utilisent la session principale (ou des sessions par expéditeur si `session.dmScope` est configuré).
- Les Heartbeats s’exécutent dans la session de Heartbeat configurée (par défaut, la session principale de l’agent) ; les sessions de groupe n’exécutent pas leurs propres Heartbeats.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Modèle : messages privés personnels et groupes publics (agent unique)

Oui — cela fonctionne bien si votre trafic « personnel » correspond à des **messages privés** et votre trafic « public » à des **groupes**.

Pourquoi : en mode agent unique, les messages privés aboutissent généralement à la clé de session **principale** (`agent:main:main`), tandis que les groupes utilisent toujours des clés de session **non principales** (`agent:main:<channel>:group:<id>`). Si vous activez l’environnement isolé avec `mode: "non-main"`, ces sessions de groupe s’exécutent dans le moteur d’environnement isolé configuré, tandis que votre session principale de messages privés reste sur l’hôte. Docker est le moteur par défaut si vous n’en choisissez pas.

Vous disposez ainsi d’un seul « cerveau » d’agent (espace de travail et mémoire partagés), mais de deux modes d’exécution :

- **Messages privés** : tous les outils (hôte)
- **Groupes** : environnement isolé et outils restreints

<Note>
Si vous avez besoin d’espaces de travail ou de personnalités réellement distincts (« personnel » et « public » ne doivent jamais se mélanger), utilisez un second agent et des liaisons. Consultez [Routage multi-agent](/fr/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="Messages privés sur l’hôte, groupes isolés">
    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main", // les groupes/canaux ne sont pas principaux -> isolés
            scope: "session", // isolation la plus forte (un conteneur par groupe/canal)
            workspaceAccess: "none",
          },
        },
      },
      tools: {
        sandbox: {
          tools: {
            // Si allow n’est pas vide, tout le reste est bloqué (deny reste prioritaire).
            allow: ["group:messaging", "group:sessions"],
            deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Les groupes voient uniquement un dossier figurant dans la liste d’autorisation">
    Vous préférez que « les groupes ne puissent voir que le dossier X » plutôt que « aucun accès à l’hôte » ? Conservez `workspaceAccess: "none"` et montez uniquement les chemins figurant dans la liste d’autorisation dans l’environnement isolé :

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

Pages associées :

- Clés de configuration et valeurs par défaut : [Configuration du Gateway](/fr/gateway/config-agents#agentsdefaultssandbox)
- Comprendre pourquoi un outil est bloqué : [Environnement isolé, politique d’outils et mode élevé](/fr/gateway/sandbox-vs-tool-policy-vs-elevated)
- Détails des montages liés : [Environnement isolé](/fr/gateway/sandboxing#custom-bind-mounts)

## Libellés d’affichage

- Les libellés de l’interface utilisent `displayName` lorsqu’il est disponible, au format `<channel>:<token>`.
- `#room` est réservé aux salons et canaux ; les conversations de groupe utilisent `g-<slug>` (minuscules, espaces -> `-`, conserver `#@+._-`). Les identifiants opaques très longs sont raccourcis en un jeton stable afin d’éviter d’exposer les identifiants de routage complets dans l’interface.

## Politique de groupe

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
      groupAllowFrom: ["123456789"], // identifiant utilisateur Telegram numérique (la configuration résout @username)
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
| `"open"`      | Les groupes contournent les listes d’autorisation ; l’exigence de mention reste applicable. |
| `"disabled"`  | Bloque entièrement tous les messages de groupe.                              |
| `"allowlist"` | Autorise uniquement les groupes/salons correspondant à la liste d’autorisation configurée. |

<AccordionGroup>
  <Accordion title="Remarques propres à chaque canal">
    - `groupPolicy` est distincte de l’exigence de mention (qui nécessite des @mentions).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo : utilisez `groupAllowFrom` (solution de repli : `allowFrom` explicite).
    - Signal : `groupAllowFrom` peut correspondre soit à l’identifiant du groupe Signal entrant, soit au téléphone/UUID de l’expéditeur.
    - Les approbations d’association des messages privés (entrées du stockage `*-allowFrom`) s’appliquent uniquement à l’accès aux messages privés ; l’autorisation des expéditeurs de groupe reste explicitement définie par les listes d’autorisation de groupe.
    - Discord : la liste d’autorisation utilise `channels.discord.guilds.<id>.channels`.
    - Slack : la liste d’autorisation utilise `channels.slack.channels`.
    - Matrix : la liste d’autorisation utilise `channels.matrix.groups`. Utilisez des identifiants de salon (`!room:server`) ou des alias (`#alias:server`) ; les clés de nom de salon ne correspondent qu’avec `channels.matrix.dangerouslyAllowNameMatching: true`, et les entrées non résolues sont ignorées à l’exécution. Utilisez `channels.matrix.groupAllowFrom` pour restreindre les expéditeurs ; les listes d’autorisation `users` propres à chaque salon sont également prises en charge.
    - Les messages privés de groupe sont contrôlés séparément (`channels.discord.dm.*`, `channels.slack.dm.*` : `groupEnabled`, `groupChannels`).
    - Telegram : les listes d’autorisation d’expéditeurs acceptent uniquement les identifiants utilisateur numériques (`"123456789"` ; les préfixes `telegram:`/`tg:` sont supprimés sans tenir compte de la casse). Les entrées `@username` ne correspondent pas à l’exécution et consignent un avertissement ; la configuration résout `@username` en identifiants. Les identifiants de discussion négatifs doivent figurer sous `channels.telegram.groups`, et non dans les listes d’autorisation d’expéditeurs.
    - La valeur par défaut est `groupPolicy: "allowlist"` ; si votre liste d’autorisation de groupe est vide, les messages de groupe sont bloqués.
    - Sécurité à l’exécution : lorsqu’un bloc de fournisseur est totalement absent (`channels.<provider>` absent), la politique de groupe se ferme de manière sécurisée sur `allowlist` au lieu d’hériter de `channels.defaults.groupPolicy`, et le Gateway consigne une fois par compte l’utilisation de cette valeur de repli.

  </Accordion>
</AccordionGroup>

Modèle mental rapide (ordre d’évaluation des messages de groupe) :

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="Listes d’autorisation de groupe">
    Listes d’autorisation de groupe (`*.groups`, `*.groupAllowFrom`, liste d’autorisation propre au canal).
  </Step>
  <Step title="Exigence de mention">
    Exigence de mention (`requireMention`, `/activation`).
  </Step>
</Steps>

## Exigence de mention (par défaut)

Les messages de groupe nécessitent une mention, sauf remplacement pour un groupe donné. Les valeurs par défaut se trouvent dans chaque sous-système sous `*.groups."*"`.

Répondre à un message du bot compte comme une mention implicite lorsque le canal fournit les métadonnées de réponse ; citer un message du bot peut également compter sur les canaux qui fournissent les métadonnées de citation. Cas intégrés actuels : Discord, Microsoft Teams, QQBot, Slack, Telegram, WhatsApp et Zalo personnel.

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

## Limiter la portée des motifs de mention configurés

Les `mentionPatterns` configurés sont des déclencheurs de secours sous forme d’expressions régulières. Utilisez-les lorsque la plateforme ne fournit pas de mention native du bot, ou lorsqu’un texte brut tel que `openclaw:` doit compter comme une mention. Les mentions natives de la plateforme sont distinctes : lorsque Discord, Slack, Telegram, Matrix ou un autre canal peut établir que le message mentionne explicitement le bot, cette mention native déclenche toujours l’agent, même là où les motifs d’expressions régulières configurés sont refusés.

Par défaut, les motifs de mention configurés s’appliquent partout où le canal transmet les informations relatives au fournisseur et à la conversation à la détection des mentions. Pour éviter que des motifs larges n’activent l’agent dans chaque groupe, limitez leur portée par canal avec `channels.<channel>.mentionPatterns`.

Utilisez `mode: "deny"` lorsque les motifs de mention sous forme d’expressions régulières doivent être désactivés par défaut pour un canal, puis activez-les dans des salons précis avec `allowIn` :

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

Utilisez la valeur par défaut `mode: "allow"` (ou omettez `mode`) lorsque les motifs de mention sous forme d’expressions régulières doivent s’appliquer largement, puis désactivez-les dans les salons bruyants avec `denyIn` :

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

| Champ           | Effet                                                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `mode: "allow"` | Les motifs de mention sous forme d’expressions régulières sont activés sauf si l’identifiant de conversation figure dans `denyIn`. Il s’agit de la valeur par défaut. |
| `mode: "deny"`  | Les motifs de mention sous forme d’expressions régulières sont désactivés sauf si l’identifiant de conversation figure dans `allowIn`. |
| `allowIn`       | Identifiants de conversation où les motifs de mention sous forme d’expressions régulières sont activés en mode deny.           |
| `denyIn`        | Identifiants de conversation où les motifs de mention sous forme d’expressions régulières sont désactivés. `denyIn` l’emporte sur `allowIn` si les deux contiennent le même identifiant. |

Politique d’expressions régulières à portée limitée actuellement prise en charge :

| Canal    | Identifiants utilisés dans `allowIn` / `denyIn`                         |
| -------- | ---------------------------------------------------------------------- |
| Discord  | Identifiants de canal Discord.                                         |
| Matrix   | Identifiants de salon Matrix.                                          |
| Slack    | Identifiants de canal Slack.                                           |
| Telegram | Identifiants de discussion de groupe, ou `chatId:topic:threadId` pour les sujets de forum. |
| WhatsApp | Identifiants de conversation WhatsApp tels que `123@g.us`.             |

Les configurations de canal au niveau du compte peuvent définir la même politique sous `channels.<channel>.accounts.<accountId>.mentionPatterns` lorsque ce canal prend en charge plusieurs comptes. La politique du compte est prioritaire sur la politique de canal de premier niveau pour ce compte.

<AccordionGroup>
  <Accordion title="Remarques sur l’exigence de mention">
    - Les `mentionPatterns` sont des motifs d’expressions régulières sécurisés et insensibles à la casse ; les motifs non valides et les formes de répétition imbriquée non sécurisées sont ignorés (avec un avertissement).
    - Priorité des motifs : `agents.list[].groupChat.mentionPatterns` (utile lorsque plusieurs agents partagent un groupe) remplace `messages.groupChat.mentionPatterns` ; lorsque ni l’un ni l’autre n’est défini, les motifs sont dérivés du nom/de l’émoji de l’identité de l’agent.
    - L’exigence de mention n’est appliquée que lorsque la détection des mentions est possible (mentions natives ou `mentionPatterns` configurés).
    - L’ajout d’un groupe ou d’un expéditeur à une liste d’autorisation ne désactive pas l’exigence de mention ; définissez la valeur `requireMention` de ce groupe sur `false` lorsque tous les messages doivent déclencher l’agent.
    - Le contexte automatique de l’invite de discussion de groupe inclut l’instruction résolue de réponse silencieuse à chaque tour ; les fichiers de l’espace de travail ne doivent pas dupliquer les mécanismes `NO_REPLY`.
    - Les groupes dans lesquels les réponses silencieuses automatiques sont autorisées traitent les tours de modèle entièrement vides ou contenant uniquement du raisonnement comme silencieux, de manière équivalente à `NO_REPLY`. Les discussions directes ne reçoivent jamais d’instructions `NO_REPLY`, et les réponses de groupe utilisant uniquement l’outil de messagerie restent silencieuses en n’appelant pas `message(action=send)`.
    - Les échanges ambiants permanents des groupes utilisent par défaut la sémantique des requêtes utilisateur. Définissez `messages.groupChat.unmentionedInbound: "room_event"` pour les soumettre plutôt comme contexte silencieux. Consultez [Événements ambiants de salon](/fr/channels/ambient-room-events) pour obtenir des exemples de configuration.
    - Les événements de salon ne sont pas stockés comme de fausses requêtes utilisateur, et le texte privé de l’assistant issu d’événements de salon sans outil de messagerie n’est pas rejoué dans l’historique de discussion.
    - Les valeurs par défaut de Discord se trouvent dans `channels.discord.guilds."*"` (remplaçables par serveur/canal).
    - Le contexte de l’historique de groupe est encapsulé uniformément sur tous les canaux. Les groupes soumis à l’exigence de mention conservent les messages ignorés en attente ; les groupes toujours actifs peuvent également conserver les messages de salon traités récemment lorsque le canal le permet. Utilisez `messages.groupChat.historyLimit` pour la valeur globale par défaut et `channels.<channel>.historyLimit` (ou `channels.<channel>.accounts.*.historyLimit`) pour les remplacements. Définissez `0` pour désactiver cette fonction.

  </Accordion>
</AccordionGroup>

## Restrictions des outils par groupe/canal (facultatif)

Certaines configurations de canal permettent de restreindre les outils disponibles **dans un groupe/salon/canal précis**.

- `tools` : autorise/refuse des outils pour l’ensemble du groupe (`allow`, `alsoAllow`, `deny` ; le refus l’emporte).
- `toolsBySender` : remplacements par expéditeur au sein du groupe. Utilisez des préfixes de clé explicites : `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` et le caractère générique `"*"`. Les identifiants de canal utilisent les identifiants de canal OpenClaw canoniques ; les alias tels que `teams` sont normalisés en `msteams`. Les anciennes clés sans préfixe sont encore acceptées, correspondent uniquement comme `id:` et consignent un avertissement d’obsolescence.

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

Lorsque `channels.whatsapp.groups`, `channels.telegram.groups` ou `channels.imessage.groups` est configuré, les clés servent de liste d’autorisation de groupe. Utilisez `"*"` pour autoriser tous les groupes tout en définissant le comportement par défaut relatif aux mentions.

<Warning>
Confusion fréquente : l’approbation de l’association en message privé n’est pas identique à l’autorisation de groupe. Pour les canaux qui prennent en charge l’association en message privé, le registre des associations déverrouille uniquement les messages privés. Les commandes de groupe nécessitent toujours une autorisation explicite de l’expéditeur du groupe provenant des listes d’autorisation de la configuration, telles que `groupAllowFrom`, ou du mécanisme de repli documenté dans la configuration de ce canal.
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

Les propriétaires de groupes peuvent modifier l’activation de chaque groupe avec un message autonome :

- `/activation mention`
- `/activation always`

`/activation` est une commande centrale réservée au propriétaire et s’applique uniquement aux discussions de groupe. Le propriétaire est l’expéditeur qui correspond à la valeur `allowFrom` / `commands.ownerAllowFrom` du canal (lorsqu’aucune liste d’autorisation n’est configurée, l’identifiant propre du compte est considéré comme celui du propriétaire). Le mode enregistré remplace la valeur `requireMention` de ce groupe sur les canaux qui le consultent (Google Chat, QQBot, Telegram, WhatsApp), et l’introduction de l’invite système du groupe reflète partout le mode actif.

## Champs de contexte

Les charges utiles entrantes des groupes définissent :

- `ChatType=group`
- `GroupSubject` (s’il est connu)
- `GroupMembers` (s’ils sont connus)
- `WasMentioned` (résultat du filtrage par mention)
- Les sujets de forum Telegram incluent également `MessageThreadId` et `IsForum`.

L’invite système de l’agent inclut une introduction de groupe lors du premier tour d’une nouvelle session de groupe (ainsi qu’après les modifications apportées avec `/activation`). Elle rappelle au modèle de répondre comme un humain, de réduire au minimum les lignes vides, de respecter l’espacement habituel des discussions et d’éviter de saisir des séquences `\n` littérales. Les groupes autres que Telegram déconseillent également les tableaux Markdown ; les consignes relatives au texte enrichi de Telegram proviennent de l’invite du canal Telegram. Les noms de groupes et les libellés de participants provenant du canal sont affichés comme des métadonnées non fiables dans des blocs délimités, et non comme des instructions système intégrées.

## Particularités d’iMessage

- Privilégiez `chat_id:<id>` pour le routage ou l’ajout à une liste d’autorisation.
- Répertorier les discussions : `imsg chats --limit 20`.
- Les réponses de groupe sont toujours renvoyées au même `chat_id`.

## Invites système de WhatsApp

Consultez [WhatsApp](/fr/channels/whatsapp#system-prompts) pour connaître les règles de référence des invites système de WhatsApp, notamment la résolution des invites de groupe et directes, le comportement des caractères génériques et la sémantique des remplacements propres au compte.

## Particularités de WhatsApp

Consultez [Messages de groupe](/fr/channels/group-messages) pour connaître le comportement propre à WhatsApp (injection de l’historique et détails de la gestion des mentions).

## Voir aussi

- [Groupes de diffusion](/fr/channels/broadcast-groups)
- [Routage des canaux](/fr/channels/channel-routing)
- [Messages de groupe](/fr/channels/group-messages)
- [Association](/fr/channels/pairing)
