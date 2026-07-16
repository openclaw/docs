---
read_when:
    - Modification du comportement des discussions de groupe ou du filtrage par mention
    - Limitation de mentionPatterns à des conversations de groupe spécifiques
sidebarTitle: Groups
summary: Comportement des discussions de groupe sur les différentes plateformes (Discord/iMessage/Matrix/Microsoft Teams/QQBot/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Groupes
x-i18n:
    generated_at: "2026-07-16T13:03:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2a708915ca9383d59b1bd2204b59a4df1de4caf677e68c9b7279f773275d67ee
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw applique les mêmes règles de groupe à tous les canaux prenant en charge les groupes, notamment Discord, iMessage, Matrix, Microsoft Teams, QQBot, Signal, Slack, Telegram, WhatsApp et Zalo.

Pour les salons toujours actifs qui doivent fournir un contexte discret, sauf si l’agent envoie explicitement un message visible, consultez [Événements de salon ambiants](/fr/channels/ambient-room-events).

## Présentation pour débutants (2 minutes)

OpenClaw « vit » sur vos propres comptes de messagerie. Il n’existe pas d’utilisateur bot WhatsApp distinct : si **vous** êtes dans un groupe, OpenClaw peut voir ce groupe et y répondre.

Comportement par défaut :

- Les groupes sont restreints (`groupPolicy: "allowlist"`) ; les expéditeurs des groupes sont bloqués jusqu’à leur ajout à la liste d’autorisation.
- Les réponses nécessitent une mention, sauf si vous désactivez cette exigence pour un groupe.
- Le texte de la réponse finale est automatiquement publié dans le salon (`visibleReplies: "automatic"`).

En clair : les expéditeurs figurant dans la liste d’autorisation peuvent déclencher OpenClaw en le mentionnant.

<Note>
**En bref**

- L’**accès aux messages privés** est contrôlé par `*.allowFrom`.
- L’**accès aux groupes** est contrôlé par `*.groupPolicy` et les listes d’autorisation (`*.groups`, `*.groupAllowFrom`).
- Le **déclenchement des réponses** est contrôlé par l’exigence de mention (`requireMention`, `/activation`).

</Note>

Flux rapide (traitement d’un message de groupe) :

```text
groupPolicy ? désactivée -> ignorer
groupPolicy ? liste d’autorisation -> groupe autorisé ? non -> ignorer
requireMention ? oui -> mentionné ? non -> stocker uniquement comme contexte
mention/réponse/commande/message privé -> requête utilisateur
conversation d’un groupe toujours actif -> requête utilisateur, ou événement de salon si configuré
```

## Réponses visibles

Pour les requêtes ordinaires de groupe ou de canal, OpenClaw utilise par défaut `messages.groupChat.visibleReplies: "automatic"` : le texte final de l’assistant est publié dans le salon comme réponse visible.

Utilisez `messages.groupChat.visibleReplies: "message_tool"` lorsqu’un salon partagé doit laisser l’agent décider quand intervenir en appelant `message(action=send)`. Ce mode fonctionne mieux avec des modèles qui utilisent les outils de manière fiable (par exemple GPT-5.6 Sol). Si le modèle omet l’outil et renvoie un texte final substantiel, OpenClaw conserve ce texte en privé au lieu de le publier dans le salon.

Utilisez `"automatic"` pour les modèles ou environnements d’exécution qui ne respectent pas de manière fiable l’envoi exclusivement par outil : les textes finaux ordinaires sont publiés directement dans le salon, et l’agent peut toujours appeler `message(action=send)` pour les fichiers, images ou autres pièces jointes qui ne peuvent pas accompagner le texte final.

Si l’outil de messagerie n’est pas disponible avec la politique d’outils active, OpenClaw revient aux réponses visibles automatiques au lieu de supprimer silencieusement la réponse. `openclaw doctor` signale cette incohérence.

Pour les conversations directes et tout autre événement source, `messages.visibleReplies: "message_tool"` applique globalement le même comportement exclusivement par outil ; `messages.groupChat.visibleReplies` reste la dérogation plus spécifique pour les salons de groupe ou de canal. Les échanges directs du WebChat interne utilisent par défaut l’envoi automatique de la réponse finale afin que Pi et Codex bénéficient du même contrat de réponse visible.

Le mode exclusivement par outil remplace l’ancien modèle qui imposait au modèle de répondre `NO_REPLY` pour la plupart des échanges en mode observation. Dans ce mode, le prompt ne définit aucun contrat `NO_REPLY` ; ne rien rendre visible signifie simplement ne pas appeler l’outil de messagerie.

Les liaisons de conversation détenues par un plugin constituent l’exception. Dès qu’un plugin lie un fil de discussion et prend en charge l’échange entrant, la réponse renvoyée par le plugin devient la réponse visible de la liaison ; elle n’a pas besoin de `message(action=send)`. Cette réponse est une sortie de l’environnement d’exécution du plugin, et non le texte final privé du modèle.

Les indicateurs de saisie sont toujours envoyés pour les requêtes directes de groupe. Lorsqu’ils sont activés, les événements ambiants des salons toujours actifs restent stricts et silencieux, sauf si l’agent appelle l’outil de messagerie.

Par défaut, les sessions masquent les résumés détaillés des outils et de la progression. Utilisez `/verbose on` (ou `/verbose full`) pour les afficher dans la session actuelle pendant le débogage, et `/verbose off` pour revenir au comportement limité à la réponse finale. L’état détaillé est propre à chaque session et fonctionne de la même manière dans les conversations directes, les groupes, les canaux et les sujets de forum.

Pour soumettre les conversations non mentionnées des groupes toujours actifs comme contexte discret du salon plutôt que comme requêtes utilisateur, utilisez [Événements de salon ambiants](/fr/channels/ambient-room-events) :

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
    },
  },
}
```

La valeur par défaut est `unmentionedInbound: "user_request"`. Les messages avec mention, les commandes, les demandes d’annulation et les messages privés restent des requêtes utilisateur.

Pour imposer que la sortie visible passe par l’outil de messagerie pour les requêtes de groupe ou de canal :

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

Les échanges de commande contournent `visibleReplies: "message_tool"` et répondent toujours de manière visible : les commandes slash natives (Discord, Telegram et autres interfaces prenant en charge les commandes natives) ainsi que les commandes textuelles `/...` autorisées publient leur réponse dans la conversation source. Dans les groupes, les échanges textuels `/...` non autorisés restent exclusivement traités par l’outil de messagerie ; les échanges de conversation ordinaires suivent la valeur par défaut configurée.

## Visibilité du contexte et listes d’autorisation

La sécurité des groupes repose sur deux contrôles distincts :

- **Autorisation de déclenchement** : qui peut déclencher l’agent (`groupPolicy`, `groups`, `groupAllowFrom`, listes d’autorisation propres aux canaux).
- **Visibilité du contexte** : quel contexte supplémentaire est injecté dans le modèle (texte de réponse ou de citation, historique du fil de discussion, métadonnées transférées).

Par défaut, OpenClaw conserve le contexte tel qu’il est reçu : les listes d’autorisation déterminent qui peut déclencher des actions, et non les extraits cités ou historiques visibles par le modèle. Pour filtrer également le contexte supplémentaire, définissez `contextVisibility` :

| Mode                | Comportement                                                                         |
| ------------------- | -------------------------------------------------------------------------------- |
| `"all"` (par défaut)   | Conserver le contexte supplémentaire tel qu’il est reçu.                                           |
| `"allowlist"`       | Injecter uniquement le contexte d’historique, de fil, de citation ou de transfert provenant d’expéditeurs autorisés.     |
| `"allowlist_quote"` | `allowlist`, tout en conservant le message explicitement cité ou auquel il est répondu, quel que soit l’expéditeur. |

Définissez cette valeur par canal (`channels.<channel>.contextVisibility`), par compte (`channels.<channel>.accounts.<accountId>.contextVisibility`) ou globalement (`channels.defaults.contextVisibility`). Les canaux qui récupèrent du contexte supplémentaire (Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp) appliquent la politique lors de la création du contexte entrant ; les combinaisons de politiques inconnues échouent de manière sécurisée et omettent le contexte.

![Flux des messages de groupe](/images/groups-flow.svg)

Si vous souhaitez...

| Objectif                                         | Valeur à définir                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| Autoriser tous les groupes, mais répondre uniquement aux @mentions | `groups: { "*": { requireMention: true } }`                |
| Désactiver toutes les réponses de groupe                    | `groupPolicy: "disabled"`                                  |
| Autoriser uniquement certains groupes                         | `groups: { "<group-id>": { ... } }` (sans clé `"*"`)         |
| Vous seul pouvez déclencher l’agent dans les groupes               | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| Réutiliser un même ensemble d’expéditeurs de confiance sur plusieurs canaux | `groupAllowFrom: ["accessGroup:operators"]`                |

Pour les listes d’autorisation d’expéditeurs réutilisables, consultez [Groupes d’accès](/fr/channels/access-groups).

## Clés de session

- Les sessions de groupe utilisent des clés de session `agent:<agentId>:<channel>:group:<id>` (les salons et canaux utilisent `agent:<agentId>:<channel>:channel:<id>`).
- Les sujets de forum Telegram ajoutent `:topic:<threadId>` à l’identifiant du groupe afin que chaque sujet dispose de sa propre session.
- Les conversations directes utilisent la session principale (ou des sessions propres à chaque expéditeur si `session.dmScope` est configuré).
- Les Heartbeats s’exécutent dans la session de heartbeat configurée (par défaut : la session principale de l’agent) ; les sessions de groupe n’exécutent pas leurs propres heartbeats.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Modèle : messages privés personnels et groupes publics (agent unique)

Oui, cela fonctionne bien si votre trafic « personnel » correspond aux **messages privés** et votre trafic « public » aux **groupes**.

Explication : en mode agent unique, les messages privés arrivent généralement dans la clé de session **principale** (`agent:main:main`), tandis que les groupes utilisent toujours des clés de session **non principales** (`agent:main:<channel>:group:<id>`). Si vous activez l’environnement isolé avec `mode: "non-main"`, ces sessions de groupe s’exécutent dans le moteur d’environnement isolé configuré, tandis que votre session principale de messages privés reste sur l’hôte. Docker est le moteur par défaut si vous n’en choisissez aucun.

Vous disposez ainsi d’un seul « cerveau » d’agent (espace de travail et mémoire partagés), mais de deux modes d’exécution :

- **Messages privés** : outils complets (hôte)
- **Groupes** : environnement isolé et outils restreints

<Note>
Si vous avez besoin d’espaces de travail ou de personnalités réellement distincts (« personnel » et « public » ne doivent jamais se mélanger), utilisez un deuxième agent et des liaisons. Consultez [Routage multi-agent](/fr/concepts/multi-agent).
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
  <Tab title="Les groupes voient uniquement un dossier autorisé">
    Vous souhaitez que « les groupes puissent uniquement voir le dossier X » plutôt que « aucun accès à l’hôte » ? Conservez `workspaceAccess: "none"` et montez uniquement les chemins autorisés dans l’environnement isolé :

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
                // cheminHôte:cheminConteneur:mode
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
- Déterminer pourquoi un outil est bloqué : [Environnement isolé ou politique d’outils ou mode élevé](/fr/gateway/sandbox-vs-tool-policy-vs-elevated)
- Détails des montages liés : [Environnement isolé](/fr/gateway/sandboxing#custom-bind-mounts)

## Libellés d’affichage

- Les libellés de l’interface utilisateur utilisent `displayName` lorsque cette valeur est disponible, avec le format `<channel>:<token>`.
- `#room` est réservé aux salons et canaux ; les conversations de groupe utilisent `g-<slug>` (minuscules, espaces remplacés par `-`, conserver `#@+._-`). Les identifiants opaques très longs sont raccourcis en un jeton stable afin d’éviter d’exposer les identifiants de routage complets dans l’interface utilisateur.

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

| Politique        | Comportement                                                     |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | Les groupes contournent les listes d’autorisation ; le filtrage par mention s’applique toujours.      |
| `"disabled"`  | Bloque entièrement tous les messages de groupe.                           |
| `"allowlist"` | Autorise uniquement les groupes/salons correspondant à la liste d’autorisation configurée. |

<AccordionGroup>
  <Accordion title="Remarques par canal">
    - `groupPolicy` est distinct du filtrage par mention (qui exige des @mentions).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo : utilisez `groupAllowFrom` (solution de repli : `allowFrom` explicite).
    - Signal : `groupAllowFrom` peut correspondre soit à l’identifiant du groupe Signal entrant, soit au numéro de téléphone/UUID de l’expéditeur.
    - Les approbations d’association des messages privés (entrées du stockage `*-allowFrom`) s’appliquent uniquement à l’accès aux messages privés ; l’autorisation des expéditeurs dans les groupes reste explicitement définie par les listes d’autorisation des groupes.
    - Discord : la liste d’autorisation utilise `channels.discord.guilds.<id>.channels`.
    - Slack : la liste d’autorisation utilise `channels.slack.channels`.
    - Matrix : la liste d’autorisation utilise `channels.matrix.groups`. Utilisez des identifiants de salon (`!room:server`) ou des alias (`#alias:server`) ; les clés de nom de salon ne correspondent qu’avec `channels.matrix.dangerouslyAllowNameMatching: true`, et les entrées non résolues sont ignorées à l’exécution. Utilisez `channels.matrix.groupAllowFrom` pour restreindre les expéditeurs ; les listes d’autorisation par salon `users` sont également prises en charge.
    - Les messages privés de groupe sont contrôlés séparément (`channels.discord.dm.*`, `channels.slack.dm.*` : `groupEnabled`, `groupChannels`).
    - Telegram : les listes d’autorisation des expéditeurs acceptent uniquement des identifiants utilisateur numériques (`"123456789"` ; les préfixes `telegram:`/`tg:` sont supprimés sans tenir compte de la casse). Les entrées `@username` ne correspondent pas à l’exécution et génèrent un avertissement dans le journal ; la configuration résout `@username` en identifiants. Les identifiants de discussion négatifs doivent figurer sous `channels.telegram.groups`, et non dans les listes d’autorisation des expéditeurs.
    - La valeur par défaut est `groupPolicy: "allowlist"` ; si la liste d’autorisation de vos groupes est vide, les messages de groupe sont bloqués.
    - Sécurité à l’exécution : lorsqu’un bloc de fournisseur est entièrement absent (`channels.<provider>` absent), la politique de groupe se ferme de manière sécurisée sur `allowlist` au lieu d’hériter de `channels.defaults.groupPolicy`, et le Gateway journalise cette solution de repli une fois par compte.

  </Accordion>
</AccordionGroup>

Modèle mental rapide (ordre d’évaluation des messages de groupe) :

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="Listes d’autorisation des groupes">
    Listes d’autorisation des groupes (`*.groups`, `*.groupAllowFrom`, liste d’autorisation propre au canal).
  </Step>
  <Step title="Filtrage par mention">
    Filtrage par mention (`requireMention`, `/activation`).
  </Step>
</Steps>

## Filtrage par mention (par défaut)

Les messages de groupe nécessitent une mention, sauf remplacement pour un groupe particulier. Les valeurs par défaut sont définies par sous-système sous `*.groups."*"`.

Répondre à un message du bot compte comme une mention implicite lorsque le canal expose les métadonnées de réponse ; citer un message du bot peut également compter sur les canaux qui exposent les métadonnées de citation. Cas intégrés actuels : Discord, Microsoft Teams, QQBot, Slack, Telegram, WhatsApp et Zalo personnel.

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

## Définir la portée des motifs de mention configurés

Les `mentionPatterns` configurés sont des déclencheurs de repli sous forme d’expressions régulières. Utilisez-les lorsque la
plateforme n’expose pas de mention native du bot, ou lorsque vous souhaitez qu’un texte brut tel
que `openclaw:` compte comme une mention. Les mentions natives de la plateforme sont distinctes :
lorsque Discord, Slack, Telegram, Matrix, Signal ou un autre canal peut établir que le message
mentionne explicitement le bot, cette mention native déclenche toujours l’agent même si
les motifs d’expression régulière configurés sont refusés.

Par défaut, les motifs de mention configurés s’appliquent partout où le canal transmet les informations sur le fournisseur et la conversation à la détection des mentions. Pour éviter que des motifs généraux réveillent l’agent dans chaque groupe, définissez leur portée par canal avec `channels.<channel>.mentionPatterns`.

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

| Champ           | Effet                                                                                                                |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| `mode: "allow"` | Les motifs de mention sous forme d’expressions régulières sont activés, sauf si l’identifiant de conversation figure dans `denyIn`. Il s’agit de la valeur par défaut.                    |
| `mode: "deny"`  | Les motifs de mention sous forme d’expressions régulières sont désactivés, sauf si l’identifiant de conversation figure dans `allowIn`.                                       |
| `allowIn`       | Identifiants de conversation pour lesquels les motifs de mention sous forme d’expressions régulières sont activés en mode de refus.                                               |
| `denyIn`        | Identifiants de conversation pour lesquels les motifs de mention sous forme d’expressions régulières sont désactivés. `denyIn` prévaut sur `allowIn` si les deux contiennent le même identifiant. |

Politique actuelle de portée des expressions régulières prise en charge :

| Canal  | Identifiants utilisés dans `allowIn` / `denyIn`                             |
| -------- | ------------------------------------------------------------ |
| Discord  | Identifiants de canal Discord.                                         |
| Matrix   | Identifiants de salon Matrix.                                             |
| Slack    | Identifiants de canal Slack.                                           |
| Telegram | Identifiants de discussion de groupe, ou `chatId:topic:threadId` pour les sujets de forum. |
| WhatsApp | Identifiants de conversation WhatsApp tels que `123@g.us`.                |

Les configurations de canal au niveau du compte peuvent définir la même politique sous `channels.<channel>.accounts.<accountId>.mentionPatterns` lorsque ce canal prend en charge plusieurs comptes. Pour ce compte, la politique du compte prévaut sur la politique globale du canal.

<AccordionGroup>
  <Accordion title="Remarques sur le filtrage par mention">
    - `mentionPatterns` sont des motifs d’expression régulière sûrs et insensibles à la casse ; les motifs non valides et les formes dangereuses à répétitions imbriquées sont ignorés (avec un avertissement).
    - Priorité des motifs : `agents.list[].groupChat.mentionPatterns` (utile lorsque plusieurs agents partagent un groupe) remplace `messages.groupChat.mentionPatterns` ; lorsqu’aucun des deux n’est défini, les motifs sont dérivés du nom/de l’emoji de l’identité de l’agent.
    - Le filtrage par mention n’est appliqué que lorsque la détection des mentions est possible (mentions natives ou `mentionPatterns` configurés).
    - L’ajout d’un groupe ou d’un expéditeur à une liste d’autorisation ne désactive pas le filtrage par mention ; définissez le `requireMention` de ce groupe sur `false` lorsque tous les messages doivent déclencher l’agent.
    - Le contexte automatique de l’invite de discussion de groupe inclut à chaque tour l’instruction résolue de réponse silencieuse ; les fichiers de l’espace de travail ne doivent pas dupliquer les mécanismes de `NO_REPLY`.
    - Les groupes dans lesquels les réponses silencieuses automatiques sont autorisées traitent comme silencieux les tours du modèle entièrement vides ou contenant uniquement du raisonnement, ce qui équivaut à `NO_REPLY`. Les discussions directes ne reçoivent jamais les indications de `NO_REPLY`, et les réponses de groupe utilisant uniquement l’outil de messagerie restent silencieuses en n’appelant pas `message(action=send)`.
    - Les conversations ambiantes permanentes des groupes utilisent par défaut la sémantique des demandes utilisateur. Définissez `messages.groupChat.unmentionedInbound: "room_event"` pour les soumettre plutôt comme contexte silencieux. Consultez [Événements ambiants des salons](/fr/channels/ambient-room-events) pour obtenir des exemples de configuration.
    - Les événements de salon ne sont pas stockés comme de fausses demandes utilisateur, et le texte privé de l’assistant issu d’événements de salon sans outil de messagerie n’est pas rejoué dans l’historique de discussion.
    - Les valeurs par défaut de Discord se trouvent dans `channels.discord.guilds."*"` (remplaçables par serveur/canal).
    - Le contexte de l’historique des groupes est encapsulé uniformément sur tous les canaux. Les groupes filtrés par mention conservent les messages ignorés en attente ; les groupes toujours actifs peuvent également conserver les messages récents déjà traités du salon lorsque le canal le permet. Utilisez `messages.groupChat.historyLimit` comme valeur globale par défaut et `channels.<channel>.historyLimit` (ou `channels.<channel>.accounts.*.historyLimit`) pour les remplacements. Définissez `0` pour désactiver cette fonction.

  </Accordion>
</AccordionGroup>

## Restrictions des outils par groupe/canal (facultatif)

Certaines configurations de canal permettent de restreindre les outils disponibles **dans un groupe/salon/canal précis**.

- `tools` : autorise/refuse des outils pour l’ensemble du groupe (`allow`, `alsoAllow`, `deny` ; le refus prévaut).
- `toolsBySender` : remplacements par expéditeur au sein du groupe. Utilisez des préfixes de clé explicites : `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` et le caractère générique `"*"`. Les identifiants de canal utilisent les identifiants de canal OpenClaw canoniques ; les alias tels que `teams` sont normalisés en `msteams`. Les anciennes clés sans préfixe sont toujours acceptées, correspondent uniquement comme `id:` et génèrent un avertissement d’obsolescence dans le journal.

Ordre de résolution (le plus précis prévaut) :

<Steps>
  <Step title="toolsBySender du groupe">
    Correspondance `toolsBySender` du groupe/canal.
  </Step>
  <Step title="Outils du groupe">
    `tools` du groupe/canal.
  </Step>
  <Step title="toolsBySender par défaut">
    Correspondance `toolsBySender` par défaut (`"*"`).
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
Les restrictions d’outils pour les groupes/canaux s’appliquent en plus de la politique globale/de l’agent relative aux outils (un refus reste prioritaire). Certains canaux utilisent une imbrication différente pour les salons/canaux (par exemple, Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Listes d’autorisation de groupes

Lorsque `channels.whatsapp.groups`, `channels.telegram.groups` ou `channels.imessage.groups` est configuré, les clés font office de liste d’autorisation de groupes. Utilisez `"*"` pour autoriser tous les groupes tout en définissant le comportement par défaut des mentions.

<Warning>
Confusion fréquente : l’approbation de l’association des messages privés n’est pas identique à l’autorisation de groupe. Pour les canaux qui prennent en charge l’association des messages privés, le stockage des associations déverrouille uniquement les messages privés. Les commandes de groupe nécessitent toujours une autorisation explicite de l’expéditeur dans la configuration, au moyen de listes d’autorisation telles que `groupAllowFrom` ou du mécanisme de repli de configuration documenté pour ce canal.
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

Les propriétaires de groupes peuvent activer ou désactiver l’activation pour chaque groupe à l’aide d’un message autonome :

- `/activation mention`
- `/activation always`

`/activation` est une commande principale réservée au propriétaire et s’applique uniquement aux discussions de groupe. Le propriétaire est l’expéditeur qui correspond à `commands.ownerAllowFrom` ; les listes `allowFrom` du canal contrôlent uniquement l’accès ordinaire au canal et aux commandes. Le mode enregistré remplace le paramètre `requireMention` de ce groupe sur les canaux qui le consultent (Google Chat, QQBot, Telegram, WhatsApp), et l’introduction de l’invite système du groupe reflète partout le mode actif.

## Champs de contexte

Les charges utiles entrantes des groupes définissent :

- `ChatType=group`
- `GroupSubject` (si connu)
- `GroupMembers` (si connu)
- `WasMentioned` (résultat du filtrage par mention)
- Les sujets de forum Telegram incluent également `MessageThreadId` et `IsForum`.

L’invite système de l’agent inclut une introduction de groupe lors du premier tour d’une nouvelle session de groupe (et après une modification de `/activation`). Elle rappelle au modèle de répondre comme un humain, de réduire au minimum les lignes vides, de respecter l’espacement habituel des discussions et d’éviter de saisir des séquences `\n` littérales. Les canaux dont le mode de tableau déclaré ne préserve pas les tableaux natifs ou bruts déconseillent également les tableaux Markdown. Les noms de groupes et les libellés de participants provenant des canaux sont rendus sous forme de métadonnées non fiables dans un bloc délimité, et non comme des instructions système intégrées.

## Particularités d’iMessage

- Privilégiez `chat_id:<id>` pour le routage ou l’ajout à une liste d’autorisation.
- Répertorier les discussions : `imsg chats --limit 20`.
- Les réponses de groupe sont toujours renvoyées vers le même `chat_id`.

## Invites système de WhatsApp

Consultez [WhatsApp](/fr/channels/whatsapp#system-prompts) pour connaître les règles canoniques des invites système de WhatsApp, notamment la résolution des invites de groupe et directes, le comportement des caractères génériques et la sémantique de remplacement au niveau du compte.

## Particularités de WhatsApp

Consultez [Messages de groupe](/fr/channels/group-messages) pour connaître le comportement propre à WhatsApp (injection de l’historique, détails de la gestion des mentions).

## Pages associées

- [Groupes de diffusion](/fr/channels/broadcast-groups)
- [Routage des canaux](/fr/channels/channel-routing)
- [Messages de groupe](/fr/channels/group-messages)
- [Association](/fr/channels/pairing)
