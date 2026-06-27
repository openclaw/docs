---
read_when:
    - Modifier le comportement des discussions de groupe ou le filtrage par mention
    - Limiter les mentionPatterns à des conversations de groupe spécifiques
sidebarTitle: Groups
summary: Comportement des discussions de groupe sur les différentes surfaces (Discord/iMessage/Matrix/Microsoft Teams/QQBot/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Groupes
x-i18n:
    generated_at: "2026-06-27T17:10:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 48660e36ac642956842d453fd4caf2cbd7f4193efee9ac864fd7cf700c3c43b6
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw traite les discussions de groupe de manière cohérente sur toutes les surfaces : Discord, iMessage, Matrix, Microsoft Teams, QQBot, Signal, Slack, Telegram, WhatsApp, Zalo.

Pour les salons toujours actifs qui doivent fournir un contexte discret sauf si l’agent envoie explicitement un message visible, consultez [Événements de salon ambiant](/fr/channels/ambient-room-events).

## Introduction débutant (2 minutes)

OpenClaw « vit » sur vos propres comptes de messagerie. Il n’y a pas d’utilisateur bot WhatsApp séparé. Si **vous** êtes dans un groupe, OpenClaw peut voir ce groupe et y répondre.

Comportement par défaut :

- Les groupes sont restreints (`groupPolicy: "allowlist"`).
- Les réponses nécessitent une mention, sauf si vous désactivez explicitement le filtrage par mention.
- Les réponses visibles dans les groupes/canaux utilisent l’outil `message` par défaut.

Traduction : les expéditeurs autorisés peuvent déclencher OpenClaw en le mentionnant.

<Note>
**TL;DR**

- **L’accès aux DM** est contrôlé par `*.allowFrom`.
- **L’accès aux groupes** est contrôlé par `*.groupPolicy` + des listes d’autorisation (`*.groups`, `*.groupAllowFrom`).
- **Le déclenchement des réponses** est contrôlé par le filtrage par mention (`requireMention`, `/activation`).

</Note>

Flux rapide (ce qui arrive à un message de groupe) :

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
mention/reply/command/DM -> user request
always-on group chatter -> user request, or room event when configured
```

## Réponses visibles

Pour les demandes normales de groupe/canal, OpenClaw utilise par défaut `messages.groupChat.visibleReplies: "automatic"`. Le texte final de l’assistant est publié via l’ancien chemin de réponse visible, sauf si vous configurez le salon pour une sortie uniquement via l’outil de message.

Utilisez `messages.groupChat.visibleReplies: "message_tool"` lorsqu’un salon partagé doit laisser l’agent décider quand parler en appelant `message(action=send)`. Cela fonctionne le mieux pour les salons de groupe adossés à des modèles de dernière génération fiables avec les outils, comme GPT 5.5. Si le modèle n’utilise pas cet outil et renvoie un texte final substantiel, OpenClaw garde ce texte final privé au lieu de le publier dans le salon.

Utilisez `"automatic"` pour les modèles ou runtimes plus faibles qui ne comprennent pas de manière fiable la livraison uniquement par outil. En mode automatique, le texte final de l’assistant est le chemin de réponse visible source, donc un modèle qui ne peut pas appeler systématiquement `message(action=send)` peut quand même répondre normalement.

En mode automatique, les réponses finales en texte normal sont publiées directement dans le salon. Si la réponse visible nécessite des fichiers, des images ou d’autres pièces jointes, l’agent peut tout de même utiliser `message(action=send)` pour cette pièce jointe au lieu d’essayer de la faire passer par la réponse textuelle finale.

Si l’outil de message n’est pas disponible sous la politique d’outils active, OpenClaw revient aux réponses visibles automatiques au lieu de supprimer silencieusement la réponse. `openclaw doctor` avertit de cette incohérence.

Pour les discussions directes et tout autre événement source, utilisez `messages.visibleReplies: "message_tool"` afin d’appliquer globalement le même comportement de réponse visible uniquement par outil. Les tours directs WebChat internes utilisent par défaut la livraison automatique de réponse finale afin que Pi et Codex reçoivent le même contrat de réponse visible. Définissez `messages.visibleReplies: "message_tool"` pour exiger intentionnellement `message(action=send)` pour la sortie visible. `messages.groupChat.visibleReplies` reste le remplacement plus spécifique pour les salons de groupe/canal.

Cela remplace l’ancien modèle qui forçait le modèle à répondre `NO_REPLY` pour la plupart des tours en mode observation. En mode uniquement par outil, le prompt ne définit pas de contrat `NO_REPLY`. Ne rien faire de visible signifie simplement ne pas appeler l’outil de message.

Les liaisons de conversation détenues par un Plugin sont l’exception. Une fois qu’un Plugin lie un fil et revendique le tour entrant, la réponse renvoyée par le Plugin est la réponse de liaison visible ; elle n’a pas besoin de `message(action=send)`. Cette réponse est une sortie du runtime du Plugin, et non le texte final privé du modèle.

Les indicateurs de saisie sont toujours envoyés pour les demandes directes de groupe. Les événements de salon ambiant toujours actifs, lorsqu’ils sont activés, restent stricts et discrets sauf si l’agent appelle l’outil de message.

Les sessions suppriment par défaut les résumés détaillés d’outils/progression. Utilisez `/verbose on` pour afficher ces résumés pour la session actuelle pendant le débogage, et `/verbose off` pour revenir au comportement limité à la réponse finale. Le même état détaillé s’applique aux discussions directes, groupes, canaux et sujets de forum.

Pour soumettre les échanges de groupe toujours actifs non mentionnés comme contexte de salon discret au lieu de demandes utilisateur, utilisez [Événements de salon ambiant](/fr/channels/ambient-room-events) :

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
    },
  },
}
```

La valeur par défaut est `unmentionedInbound: "user_request"`.

Les messages mentionnés, commandes, demandes d’arrêt et DM restent des demandes utilisateur.

Pour exiger que la sortie visible passe par l’outil de message pour les demandes de groupe/canal :

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
}
```

Le Gateway recharge à chaud la configuration `messages` après l’enregistrement du fichier. Redémarrez uniquement lorsque la surveillance des fichiers ou le rechargement de la configuration est désactivé dans le déploiement.

Pour exiger que la sortie visible passe par l’outil de message pour chaque discussion source :

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Les commandes slash natives (Discord, Telegram et autres surfaces avec prise en charge des commandes natives) contournent `visibleReplies: "message_tool"` et répondent toujours visiblement afin que l’interface de commande native du canal reçoive la réponse attendue. Cela s’applique uniquement aux tours de commandes natives validées ; les commandes `/...` saisies en texte et les tours de discussion ordinaires suivent toujours la valeur par défaut de groupe configurée.

## Visibilité du contexte et listes d’autorisation

Deux contrôles différents interviennent dans la sécurité des groupes :

- **Autorisation de déclenchement** : qui peut déclencher l’agent (`groupPolicy`, `groups`, `groupAllowFrom`, listes d’autorisation propres au canal).
- **Visibilité du contexte** : quel contexte supplémentaire est injecté dans le modèle (texte de réponse, citations, historique du fil, métadonnées transférées).

Par défaut, OpenClaw privilégie le comportement normal des discussions et conserve le contexte majoritairement tel qu’il est reçu. Cela signifie que les listes d’autorisation décident principalement qui peut déclencher des actions, et ne constituent pas une limite universelle de rédaction pour chaque extrait cité ou historique.

<AccordionGroup>
  <Accordion title="Le comportement actuel dépend du canal">
    - Certains canaux appliquent déjà un filtrage basé sur l’expéditeur pour le contexte supplémentaire dans des chemins spécifiques (par exemple l’amorçage de fils Slack, les recherches de réponses/fils Matrix).
    - D’autres canaux transmettent encore le contexte de citation/réponse/transfert tel qu’il est reçu.

  </Accordion>
  <Accordion title="Direction de renforcement (prévue)">
    - `contextVisibility: "all"` (par défaut) conserve le comportement actuel tel que reçu.
    - `contextVisibility: "allowlist"` filtre le contexte supplémentaire pour ne garder que les expéditeurs autorisés.
    - `contextVisibility: "allowlist_quote"` correspond à `allowlist` avec une exception explicite de citation/réponse.

    Tant que ce modèle de renforcement n’est pas implémenté de manière cohérente sur tous les canaux, attendez-vous à des différences selon la surface.

  </Accordion>
</AccordionGroup>

![Flux des messages de groupe](/images/groups-flow.svg)

Si vous voulez...

| Objectif                                     | Ce qu’il faut définir                                      |
| -------------------------------------------- | ---------------------------------------------------------- |
| Autoriser tous les groupes mais répondre seulement aux @mentions | `groups: { "*": { requireMention: true } }`                |
| Désactiver toutes les réponses de groupe     | `groupPolicy: "disabled"`                                  |
| Seulement des groupes spécifiques            | `groups: { "<group-id>": { ... } }` (sans clé `"*"` )      |
| Vous seul pouvez déclencher dans les groupes | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| Réutiliser un ensemble d’expéditeurs de confiance entre canaux | `groupAllowFrom: ["accessGroup:operators"]`                |

Pour les listes d’autorisation d’expéditeurs réutilisables, consultez [Groupes d’accès](/fr/channels/access-groups).

## Clés de session

- Les sessions de groupe utilisent des clés de session `agent:<agentId>:<channel>:group:<id>` (les salons/canaux utilisent `agent:<agentId>:<channel>:channel:<id>`).
- Les sujets de forum Telegram ajoutent `:topic:<threadId>` à l’identifiant de groupe afin que chaque sujet ait sa propre session.
- Les discussions directes utilisent la session principale (ou une session par expéditeur si configuré).
- Les Heartbeats sont ignorés pour les sessions de groupe.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Modèle : DM personnels + groupes publics (agent unique)

Oui — cela fonctionne bien si votre trafic « personnel » correspond aux **DM** et votre trafic « public » aux **groupes**.

Pourquoi : en mode agent unique, les DM arrivent généralement dans la clé de session **principale** (`agent:main:main`), tandis que les groupes utilisent toujours des clés de session **non principales** (`agent:main:<channel>:group:<id>`). Si vous activez le sandboxing avec `mode: "non-main"`, ces sessions de groupe s’exécutent dans le backend de sandbox configuré, tandis que votre session DM principale reste sur l’hôte. Docker est le backend par défaut si vous n’en choisissez pas.

Cela vous donne un « cerveau » d’agent unique (espace de travail + mémoire partagés), mais deux postures d’exécution :

- **DM** : outils complets (hôte)
- **Groupes** : sandbox + outils restreints

<Note>
Si vous avez besoin d’espaces de travail/personas réellement séparés (« personnel » et « public » ne doivent jamais se mélanger), utilisez un second agent + des liaisons. Consultez [Routage multi-agent](/fr/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="DM sur l’hôte, groupes en sandbox">
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
  <Tab title="Les groupes ne voient qu’un dossier autorisé">
    Vous voulez que « les groupes ne puissent voir que le dossier X » au lieu de « aucun accès à l’hôte » ? Gardez `workspaceAccess: "none"` et montez uniquement les chemins autorisés dans la sandbox :

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

Connexe :

- Clés de configuration et valeurs par défaut : [Configuration du Gateway](/fr/gateway/config-agents#agentsdefaultssandbox)
- Déboguer pourquoi un outil est bloqué : [Sandbox vs politique d’outils vs élevé](/fr/gateway/sandbox-vs-tool-policy-vs-elevated)
- Détails des montages bind : [Sandboxing](/fr/gateway/sandboxing#custom-bind-mounts)

## Libellés d’affichage

- Les libellés d’interface utilisent `displayName` lorsqu’il est disponible, formaté comme `<channel>:<token>`.
- `#room` est réservé aux salons/canaux ; les discussions de groupe utilisent `g-<slug>` (minuscules, espaces -> `-`, conserver `#@+._-`).

## Politique de groupe

Contrôlez la manière dont les messages de groupe/salon sont traités par canal :

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // identifiant utilisateur Telegram numérique (l’assistant de configuration peut résoudre @username)
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
        GUILD_ID: { channels: { help: { allow: true } } },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { allow: true } },
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

| Stratégie     | Comportement                                                                 |
| ------------- | ---------------------------------------------------------------------------- |
| `"open"`      | Les groupes contournent les listes d’autorisation ; le filtrage par mention s’applique toujours. |
| `"disabled"`  | Bloque entièrement tous les messages de groupe.                              |
| `"allowlist"` | Autorise uniquement les groupes/salons qui correspondent à la liste d’autorisation configurée. |

<AccordionGroup>
  <Accordion title="Notes par canal">
    - `groupPolicy` est distinct du filtrage par mention (qui exige des @mentions).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo : utilisez `groupAllowFrom` (repli : `allowFrom` explicite).
    - Signal : `groupAllowFrom` peut correspondre soit à l’identifiant de groupe Signal entrant, soit au téléphone/UUID de l’expéditeur.
    - Les approbations d’association en message direct (entrées de stockage `*-allowFrom`) s’appliquent uniquement à l’accès en message direct ; l’autorisation de l’expéditeur en groupe reste explicite dans les listes d’autorisation de groupe.
    - Discord : la liste d’autorisation utilise `channels.discord.guilds.<id>.channels`.
    - Slack : la liste d’autorisation utilise `channels.slack.channels`.
    - Matrix : la liste d’autorisation utilise `channels.matrix.groups`. Préférez les ID de salon ou les alias ; la recherche de nom de salon rejoint fonctionne au mieux, et les noms non résolus sont ignorés à l’exécution. Utilisez `channels.matrix.groupAllowFrom` pour restreindre les expéditeurs ; les listes d’autorisation `users` par salon sont également prises en charge.
    - Les messages directs de groupe sont contrôlés séparément (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - La liste d’autorisation Telegram peut correspondre à des ID utilisateur (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) ou à des noms d’utilisateur (`"@alice"` ou `"alice"`) ; les préfixes sont insensibles à la casse.
    - La valeur par défaut est `groupPolicy: "allowlist"` ; si votre liste d’autorisation de groupes est vide, les messages de groupe sont bloqués.
    - Sécurité à l’exécution : lorsqu’un bloc de fournisseur est totalement absent (`channels.<provider>` absent), la stratégie de groupe revient à un mode fermé en cas d’échec (généralement `allowlist`) au lieu d’hériter de `channels.defaults.groupPolicy`.

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
  <Step title="Filtrage par mention">
    Filtrage par mention (`requireMention`, `/activation`).
  </Step>
</Steps>

## Filtrage par mention (par défaut)

Les messages de groupe exigent une mention, sauf remplacement par groupe. Les valeurs par défaut résident par sous-système sous `*.groups."*"`.

Répondre à un message du bot compte comme une mention implicite lorsque le canal prend en charge les métadonnées de réponse. Citer un message du bot peut également compter comme une mention implicite sur les canaux qui exposent les métadonnées de citation. Les cas intégrés actuels incluent Telegram, WhatsApp, Slack, Discord, Microsoft Teams et ZaloUser.

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

## Portée des motifs de mention configurés

Les `mentionPatterns` configurés sont des déclencheurs de repli regex. Utilisez-les lorsque la
plateforme n’expose pas de mention native du bot, ou lorsque vous voulez qu’un texte brut tel
que `openclaw:` compte comme une mention. Les mentions natives de plateforme sont distinctes :
lorsque Discord, Slack, Telegram, Matrix ou un autre canal peut prouver que le message
a explicitement mentionné le bot, cette mention native déclenche toujours même si
les motifs regex configurés sont refusés.

Par défaut, les motifs de mention configurés s’appliquent partout où ce canal transmet
les faits de fournisseur et de conversation à la détection de mention. Pour éviter que des motifs larges
ne réveillent l’agent dans chaque groupe, limitez-les par canal avec
`channels.<channel>.mentionPatterns`.

Utilisez `mode: "deny"` lorsque les motifs de mention regex doivent être désactivés par défaut pour un
canal, puis activez-les dans des salons précis avec `allowIn` :

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

Utilisez le `mode: "allow"` par défaut (ou omettez `mode`) lorsque les motifs de mention regex
doivent s’appliquer largement, puis désactivez-les dans les salons bruyants avec `denyIn` :

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

Résolution de la stratégie :

| Champ           | Effet                                                                                                                |
| --------------- | -------------------------------------------------------------------------------------------------------------------- |
| `mode: "allow"` | Les motifs de mention regex sont activés sauf si l’ID de conversation figure dans `denyIn`. C’est la valeur par défaut. |
| `mode: "deny"`  | Les motifs de mention regex sont désactivés sauf si l’ID de conversation figure dans `allowIn`.                       |
| `allowIn`       | ID de conversation où les motifs de mention regex sont activés en mode refus.                                        |
| `denyIn`        | ID de conversation où les motifs de mention regex sont désactivés. `denyIn` l’emporte sur `allowIn` si les deux incluent le même ID. |

Stratégie regex à portée limitée prise en charge aujourd’hui :

| Canal    | ID utilisés dans `allowIn` / `denyIn`                              |
| -------- | ------------------------------------------------------------------ |
| Discord  | ID de canaux Discord.                                              |
| Matrix   | ID de salons Matrix.                                               |
| Slack    | ID de canaux Slack.                                                |
| Telegram | ID de discussions de groupe, ou `chatId:topic:threadId` pour les sujets de forum. |
| WhatsApp | ID de conversations WhatsApp comme `123@g.us`.                     |

Les configurations de canal au niveau du compte peuvent définir la même stratégie sous
`channels.<channel>.accounts.<accountId>.mentionPatterns` lorsque ce canal
prend en charge plusieurs comptes. La stratégie de compte est prioritaire sur la stratégie
de canal de niveau supérieur pour ce compte.

<AccordionGroup>
  <Accordion title="Notes sur le filtrage par mention">
    - Les `mentionPatterns` sont des motifs regex sûrs et insensibles à la casse ; les motifs invalides et les formes dangereuses à répétition imbriquée sont ignorés.
    - Les surfaces qui fournissent des mentions explicites passent toujours ; les motifs regex configurés sont un repli.
    - `channels.<channel>.mentionPatterns.mode: "deny"` désactive par défaut les motifs de mention configurés pour ce canal ; réactivez certaines conversations avec `allowIn`.
    - `channels.<channel>.mentionPatterns.denyIn` désactive les motifs de mention configurés pour des ID de conversation précis, tandis que les @mentions natives de la plateforme passent toujours.
    - Remplacement par agent : `agents.list[].groupChat.mentionPatterns` (utile lorsque plusieurs agents partagent un groupe).
    - Le filtrage par mention n’est appliqué que lorsque la détection de mention est possible (mentions natives ou `mentionPatterns` configurés).
    - L’inscription d’un groupe ou d’un expéditeur sur liste d’autorisation ne désactive pas le filtrage par mention ; définissez le `requireMention` de ce groupe sur `false` lorsque tous les messages doivent déclencher.
    - Le contexte automatique d’invite de discussion de groupe transporte à chaque tour l’instruction de réponse silencieuse résolue ; les fichiers d’espace de travail ne doivent pas dupliquer la mécanique `NO_REPLY`.
    - Les groupes où les réponses silencieuses automatiques sont autorisées traitent les tours de modèle propres vides ou uniquement de raisonnement comme silencieux, équivalents à `NO_REPLY`. Les discussions directes ne reçoivent jamais de consigne `NO_REPLY`, et les réponses de groupe uniquement via outil de message restent silencieuses en n’appelant pas `message(action=send)`.
    - Le bavardage ambiant de groupe toujours actif utilise par défaut la sémantique de requête utilisateur. Définissez `messages.groupChat.unmentionedInbound: "room_event"` pour l’envoyer plutôt comme contexte silencieux. Consultez [Événements de salon ambiants](/fr/channels/ambient-room-events) pour des exemples de configuration.
    - Les événements de salon ne sont pas stockés comme de fausses requêtes utilisateur, et le texte privé de l’assistant issu d’événements de salon sans outil de message n’est pas rejoué comme historique de discussion.
    - Les valeurs par défaut de Discord résident dans `channels.discord.guilds."*"` (remplaçables par guilde/canal).
    - Le contexte d’historique de groupe est encapsulé uniformément entre les canaux. Les groupes filtrés par mention conservent les messages ignorés en attente ; les groupes toujours actifs peuvent aussi conserver les messages de salon traités récemment lorsque le canal le prend en charge. Utilisez `messages.groupChat.historyLimit` pour la valeur globale par défaut et `channels.<channel>.historyLimit` (ou `channels.<channel>.accounts.*.historyLimit`) pour les remplacements. Définissez `0` pour désactiver.

  </Accordion>
</AccordionGroup>

## Restrictions d’outils par groupe/canal (facultatif)

Certaines configurations de canal prennent en charge la restriction des outils disponibles **dans un groupe/salon/canal spécifique**.

- `tools` : autoriser/refuser des outils pour tout le groupe.
- `toolsBySender` : remplacements par expéditeur dans le groupe. Utilisez des préfixes de clé explicites : `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` et le joker `"*"`. Les ID de canal utilisent les ID de canal OpenClaw canoniques ; les alias tels que `teams` sont normalisés en `msteams`. Les anciennes clés sans préfixe sont toujours acceptées et correspondent uniquement à `id:`.

Ordre de résolution (le plus spécifique l’emporte) :

<Steps>
  <Step title="toolsBySender de groupe">
    Correspondance `toolsBySender` de groupe/canal.
  </Step>
  <Step title="tools de groupe">
    `tools` de groupe/canal.
  </Step>
  <Step title="toolsBySender par défaut">
    Correspondance `toolsBySender` par défaut (`"*"`).
  </Step>
  <Step title="tools par défaut">
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
Les restrictions d’outils par groupe/canal sont appliquées en plus de la stratégie globale/par agent des outils (le refus l’emporte toujours). Certains canaux utilisent une imbrication différente pour les salons/canaux (par exemple, Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Listes d’autorisation de groupe

Lorsque `channels.whatsapp.groups`, `channels.telegram.groups` ou `channels.imessage.groups` est configuré, les clés agissent comme liste d’autorisation de groupe. Utilisez `"*"` pour autoriser tous les groupes tout en définissant le comportement de mention par défaut.

<Warning>
Confusion fréquente : l’approbation d’appairage par message privé n’est pas la même chose que l’autorisation de groupe. Pour les canaux qui prennent en charge l’appairage par message privé, le stockage d’appairage déverrouille uniquement les messages privés. Les commandes de groupe nécessitent toujours une autorisation explicite de l’expéditeur du groupe via des listes d’autorisation de configuration telles que `groupAllowFrom` ou le repli de configuration documenté pour ce canal.
</Warning>

Intentions courantes (copier/coller) :

<Tabs>
  <Tab title="Désactiver toutes les réponses de groupe">
    ```json5
    {
      channels: { whatsapp: { groupPolicy: "disabled" } },
    }
    ```
  </Tab>
  <Tab title="Autoriser uniquement des groupes spécifiques (WhatsApp)">
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
  <Tab title="Autoriser tous les groupes mais exiger une mention">
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

Les propriétaires de groupe peuvent activer ou désactiver l’activation par groupe :

- `/activation mention`
- `/activation always`

Le propriétaire est déterminé par `channels.whatsapp.allowFrom` (ou par le numéro E.164 du bot lui-même si ce champ n’est pas défini). Envoyez la commande sous forme de message autonome. Les autres surfaces ignorent actuellement `/activation`.

## Champs de contexte

Les charges utiles entrantes de groupe définissent :

- `ChatType=group`
- `GroupSubject` (si connu)
- `GroupMembers` (si connu)
- `WasMentioned` (résultat du filtrage par mention)
- Les sujets de forum Telegram incluent également `MessageThreadId` et `IsForum`.

Le prompt système de l’agent inclut une introduction de groupe au premier tour d’une nouvelle session de groupe. Il rappelle au modèle de répondre comme un humain, de réduire les lignes vides, de respecter l’espacement normal d’une conversation et d’éviter de saisir des séquences littérales `\n`. Les groupes non Telegram déconseillent également les tableaux Markdown ; les consignes de texte enrichi Telegram proviennent du prompt du canal Telegram. Les noms de groupe et libellés de participants provenant du canal sont rendus comme des métadonnées non fiables dans un bloc délimité, et non comme des instructions système en ligne.

## Spécificités iMessage

- Préférez `chat_id:<id>` pour le routage ou les listes d’autorisation.
- Lister les conversations : `imsg chats --limit 20`.
- Les réponses de groupe retournent toujours au même `chat_id`.

## Prompts système WhatsApp

Consultez [WhatsApp](/fr/channels/whatsapp#system-prompts) pour les règles canoniques des prompts système WhatsApp, y compris la résolution des prompts de groupe et directs, le comportement des jokers et la sémantique de remplacement au niveau du compte.

## Spécificités WhatsApp

Consultez [Messages de groupe](/fr/channels/group-messages) pour le comportement propre à WhatsApp (injection d’historique, détails de gestion des mentions).

## Connexe

- [Groupes de diffusion](/fr/channels/broadcast-groups)
- [Routage des canaux](/fr/channels/channel-routing)
- [Messages de groupe](/fr/channels/group-messages)
- [Appairage](/fr/channels/pairing)
