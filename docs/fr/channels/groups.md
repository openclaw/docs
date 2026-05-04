---
read_when:
    - Modifier le comportement des discussions de groupe ou le filtrage des mentions
sidebarTitle: Groups
summary: Comportement des discussions de groupe sur les différentes surfaces (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Groupes
x-i18n:
    generated_at: "2026-05-04T02:21:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: dea506c011a5d8f6155b2f56aacb236482cb8c5b7457001cb2171fd45932443d
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw traite les discussions de groupe de façon cohérente sur toutes les surfaces : Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Introduction pour débutants (2 minutes)

OpenClaw « vit » sur vos propres comptes de messagerie. Il n’existe pas d’utilisateur bot WhatsApp séparé. Si **vous** êtes dans un groupe, OpenClaw peut voir ce groupe et y répondre.

Comportement par défaut :

- Les groupes sont restreints (`groupPolicy: "allowlist"`).
- Les réponses nécessitent une mention, sauf si vous désactivez explicitement le filtrage par mention.
- Les réponses finales normales dans les groupes/canaux sont privées par défaut. La sortie visible dans la salle utilise l’outil `message`.

Traduction : les expéditeurs autorisés peuvent déclencher OpenClaw en le mentionnant.

<Note>
**TL;DR**

- **L’accès aux DM** est contrôlé par `*.allowFrom`.
- **L’accès aux groupes** est contrôlé par `*.groupPolicy` + les listes d’autorisation (`*.groups`, `*.groupAllowFrom`).
- **Le déclenchement des réponses** est contrôlé par le filtrage par mention (`requireMention`, `/activation`).

</Note>

Flux rapide (ce qui arrive à un message de groupe) :

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## Réponses visibles

Pour les salles de groupe/canal, OpenClaw utilise par défaut `messages.groupChat.visibleReplies: "message_tool"`.
`openclaw doctor --fix` écrit cette valeur par défaut dans les configurations de canaux configurés qui ne l’indiquent pas.
Cela signifie que l’agent traite toujours le tour et peut mettre à jour l’état de la mémoire/session, mais sa réponse finale normale n’est pas automatiquement publiée dans la salle. Pour parler de façon visible, l’agent utilise `message(action=send)`.

Cette valeur par défaut dépend d’un modèle/environnement d’exécution qui appelle les outils de manière fiable. Si les journaux affichent
du texte assistant mais `didSendViaMessagingTool: false`, le modèle a répondu
en privé au lieu d’appeler l’outil de messagerie. Ce n’est pas un échec
d’envoi Discord/Slack/Telegram. Utilisez un modèle fiable pour les appels d’outils dans
les sessions de groupe/canal, ou définissez
`messages.groupChat.visibleReplies: "automatic"` pour rétablir les anciennes
réponses finales visibles.

Si l’outil de messagerie n’est pas disponible avec la politique d’outils active, OpenClaw revient
aux réponses visibles automatiques au lieu de supprimer silencieusement la réponse.
`openclaw doctor` avertit de cette incohérence.

Pour les discussions directes et tout autre tour source, utilisez `messages.visibleReplies: "message_tool"` afin d’appliquer globalement le même comportement de réponse visible uniquement via outil. Les harnais peuvent aussi choisir cette valeur comme valeur par défaut non définie ; le harnais Codex le fait pour les discussions directes en mode Codex. `messages.groupChat.visibleReplies` reste la surcharge plus spécifique pour les salles de groupe/canal.

Cela remplace l’ancien modèle qui forçait le modèle à répondre `NO_REPLY` pour la plupart des tours en mode observation. En mode uniquement via outil, ne rien rendre visible signifie simplement ne pas appeler l’outil de messagerie.

Les indicateurs de saisie sont toujours envoyés pendant que l’agent travaille en mode uniquement via outil. Le mode de saisie de groupe par défaut passe de "message" à "instant" pour ces tours, car il se peut qu’il n’y ait jamais de texte de message assistant normal avant que l’agent décide d’appeler ou non l’outil de messagerie. La configuration explicite du mode de saisie reste prioritaire.

Pour rétablir les anciennes réponses finales automatiques pour les salles de groupe/canal :

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

Le Gateway recharge à chaud la configuration `messages` après l’enregistrement du fichier. Redémarrez uniquement
lorsque la surveillance des fichiers ou le rechargement de configuration est désactivé dans le déploiement.

Pour exiger que la sortie visible passe par l’outil de messagerie pour chaque discussion source :

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Les commandes slash natives (Discord, Telegram et autres surfaces avec prise en charge native des commandes) contournent `visibleReplies: "message_tool"` et répondent toujours de façon visible afin que l’interface de commande native du canal reçoive la réponse attendue. Cela s’applique uniquement aux tours de commande native validés ; les commandes `/...` saisies en texte et les tours de discussion ordinaires suivent toujours la valeur par défaut de groupe configurée.

## Visibilité du contexte et listes d’autorisation

Deux contrôles distincts interviennent dans la sécurité des groupes :

- **Autorisation de déclenchement** : qui peut déclencher l’agent (`groupPolicy`, `groups`, `groupAllowFrom`, listes d’autorisation propres au canal).
- **Visibilité du contexte** : quel contexte supplémentaire est injecté dans le modèle (texte de réponse, citations, historique de fil, métadonnées transférées).

Par défaut, OpenClaw privilégie le comportement normal de discussion et conserve le contexte principalement tel qu’il est reçu. Cela signifie que les listes d’autorisation déterminent surtout qui peut déclencher des actions, et ne constituent pas une frontière universelle de caviardage pour chaque extrait cité ou historique.

<AccordionGroup>
  <Accordion title="Le comportement actuel est propre au canal">
    - Certains canaux appliquent déjà un filtrage fondé sur l’expéditeur pour le contexte supplémentaire dans des chemins spécifiques (par exemple l’amorçage de fils Slack, les recherches de réponses/fils Matrix).
    - D’autres canaux transmettent encore le contexte de citation/réponse/transfert tel qu’il est reçu.

  </Accordion>
  <Accordion title="Orientation de durcissement (prévue)">
    - `contextVisibility: "all"` (par défaut) conserve le comportement actuel tel que reçu.
    - `contextVisibility: "allowlist"` filtre le contexte supplémentaire selon les expéditeurs autorisés.
    - `contextVisibility: "allowlist_quote"` correspond à `allowlist` avec une exception explicite supplémentaire pour les citations/réponses.

    Tant que ce modèle de durcissement n’est pas mis en œuvre de manière cohérente sur tous les canaux, attendez-vous à des différences selon la surface.

  </Accordion>
</AccordionGroup>

![Flux des messages de groupe](/images/groups-flow.svg)

Si vous voulez...

| Objectif                                      | Paramètre à définir                                      |
| -------------------------------------------- | ---------------------------------------------------------- |
| Autoriser tous les groupes mais répondre uniquement aux @mentions | `groups: { "*": { requireMention: true } }`                |
| Désactiver toutes les réponses de groupe     | `groupPolicy: "disabled"`                                  |
| Uniquement des groupes spécifiques           | `groups: { "<group-id>": { ... } }` (pas de clé `"*"` )    |
| Seul vous pouvez déclencher dans les groupes | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| Réutiliser un même ensemble d’expéditeurs de confiance sur plusieurs canaux | `groupAllowFrom: ["accessGroup:operators"]`                |

Pour les listes d’autorisation d’expéditeurs réutilisables, consultez [Groupes d’accès](/fr/channels/access-groups).

## Clés de session

- Les sessions de groupe utilisent des clés de session `agent:<agentId>:<channel>:group:<id>` (les salles/canaux utilisent `agent:<agentId>:<channel>:channel:<id>`).
- Les sujets de forum Telegram ajoutent `:topic:<threadId>` à l’identifiant de groupe afin que chaque sujet ait sa propre session.
- Les discussions directes utilisent la session principale (ou une session par expéditeur si configuré).
- Les Heartbeats sont ignorés pour les sessions de groupe.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Modèle : DM personnels + groupes publics (agent unique)

Oui — cela fonctionne bien si votre trafic « personnel » correspond aux **DM** et votre trafic « public » aux **groupes**.

Pourquoi : en mode agent unique, les DM arrivent généralement dans la clé de session **principale** (`agent:main:main`), tandis que les groupes utilisent toujours des clés de session **non principales** (`agent:main:<channel>:group:<id>`). Si vous activez le sandboxing avec `mode: "non-main"`, ces sessions de groupe s’exécutent dans le backend de sandbox configuré, tandis que votre session DM principale reste sur l’hôte. Docker est le backend par défaut si vous n’en choisissez pas.

Cela vous donne un seul « cerveau » d’agent (espace de travail + mémoire partagés), mais deux postures d’exécution :

- **DM** : outils complets (hôte)
- **Groupes** : sandbox + outils restreints

<Note>
Si vous avez besoin d’espaces de travail/personas réellement séparés (« personnel » et « public » ne doivent jamais se mélanger), utilisez un second agent + des bindings. Consultez [Routage multi-agent](/fr/concepts/multi-agent).
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
    Vous voulez que « les groupes puissent seulement voir le dossier X » au lieu de « aucun accès à l’hôte » ? Gardez `workspaceAccess: "none"` et montez uniquement les chemins autorisés dans la sandbox :

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

Liens associés :

- Clés de configuration et valeurs par défaut : [Configuration du Gateway](/fr/gateway/config-agents#agentsdefaultssandbox)
- Déboguer pourquoi un outil est bloqué : [Sandbox vs politique d’outils vs élévation](/fr/gateway/sandbox-vs-tool-policy-vs-elevated)
- Détails des montages bind : [Sandboxing](/fr/gateway/sandboxing#custom-bind-mounts)

## Libellés d’affichage

- Les libellés de l’interface utilisent `displayName` lorsqu’il est disponible, au format `<channel>:<token>`.
- `#room` est réservé aux salles/canaux ; les discussions de groupe utilisent `g-<slug>` (minuscules, espaces -> `-`, conserver `#@+._-`).

## Politique de groupe

Contrôlez la manière dont les messages de groupe/salle sont traités par canal :

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // numeric Telegram user id (wizard can resolve @username)
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

| Politique     | Comportement                                                  |
| ------------- | ------------------------------------------------------------- |
| `"open"`      | Les groupes contournent les listes d’autorisation ; le filtrage par mention s’applique toujours. |
| `"disabled"`  | Bloque entièrement tous les messages de groupe.               |
| `"allowlist"` | Autorise uniquement les groupes/salles qui correspondent à la liste d’autorisation configurée. |

<AccordionGroup>
  <Accordion title="Notes par canal">
    - `groupPolicy` est distinct du filtrage par mention (qui nécessite des @mentions).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo : utilisez `groupAllowFrom` (solution de repli : `allowFrom` explicite).
    - Signal : `groupAllowFrom` peut correspondre soit à l’identifiant du groupe Signal entrant, soit au téléphone/UUID de l’expéditeur.
    - Les approbations d’appairage en MP (entrées de stockage `*-allowFrom`) s’appliquent uniquement à l’accès en MP ; l’autorisation des expéditeurs de groupe reste explicite via les listes d’autorisation de groupes.
    - Discord : la liste d’autorisation utilise `channels.discord.guilds.<id>.channels`.
    - Slack : la liste d’autorisation utilise `channels.slack.channels`.
    - Matrix : la liste d’autorisation utilise `channels.matrix.groups`. Préférez les identifiants ou alias de salles ; la recherche par nom de salle rejointe est faite au mieux, et les noms non résolus sont ignorés à l’exécution. Utilisez `channels.matrix.groupAllowFrom` pour restreindre les expéditeurs ; les listes d’autorisation `users` par salle sont également prises en charge.
    - Les MP de groupe sont contrôlés séparément (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - La liste d’autorisation Telegram peut correspondre à des identifiants utilisateur (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) ou à des noms d’utilisateur (`"@alice"` ou `"alice"`) ; les préfixes ne tiennent pas compte de la casse.
    - La valeur par défaut est `groupPolicy: "allowlist"` ; si votre liste d’autorisation de groupes est vide, les messages de groupe sont bloqués.
    - Sécurité à l’exécution : lorsqu’un bloc de fournisseur est complètement absent (`channels.<provider>` absent), la stratégie de groupe revient à un mode fermé en cas d’échec (généralement `allowlist`) au lieu d’hériter de `channels.defaults.groupPolicy`.

  </Accordion>
</AccordionGroup>

Modèle mental rapide (ordre d’évaluation des messages de groupe) :

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="Listes d’autorisation de groupes">
    Listes d’autorisation de groupes (`*.groups`, `*.groupAllowFrom`, liste d’autorisation propre au canal).
  </Step>
  <Step title="Filtrage par mention">
    Filtrage par mention (`requireMention`, `/activation`).
  </Step>
</Steps>

## Filtrage par mention (par défaut)

Les messages de groupe nécessitent une mention, sauf remplacement par groupe. Les valeurs par défaut résident par sous-système sous `*.groups."*"`.

Répondre à un message du bot compte comme une mention implicite lorsque le canal prend en charge les métadonnées de réponse. Citer un message du bot peut aussi compter comme une mention implicite sur les canaux qui exposent les métadonnées de citation. Les cas intégrés actuels incluent Telegram, WhatsApp, Slack, Discord, Microsoft Teams et ZaloUser.

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

<AccordionGroup>
  <Accordion title="Notes sur le filtrage par mention">
    - `mentionPatterns` sont des motifs regex sûrs, insensibles à la casse ; les motifs invalides et les formes de répétition imbriquée non sûres sont ignorés.
    - Les surfaces qui fournissent des mentions explicites passent quand même ; les motifs servent de solution de repli.
    - Remplacement par agent : `agents.list[].groupChat.mentionPatterns` (utile lorsque plusieurs agents partagent un groupe).
    - Le filtrage par mention n’est appliqué que lorsque la détection de mention est possible (mentions natives ou `mentionPatterns` configurés).
    - Autoriser un groupe ou un expéditeur ne désactive pas le filtrage par mention ; définissez `requireMention` du groupe à `false` lorsque tous les messages doivent déclencher une réponse.
    - Le contexte d’invite de discussion de groupe transporte l’instruction de réponse silencieuse résolue à chaque tour ; les fichiers d’espace de travail ne doivent pas dupliquer les mécanismes `NO_REPLY`.
    - Les groupes où les réponses silencieuses sont autorisées traitent les tours de modèle propres, vides ou composés uniquement de raisonnement comme silencieux, équivalents à `NO_REPLY`. Les discussions directes font de même uniquement lorsque les réponses silencieuses directes sont explicitement autorisées ; sinon, les réponses vides restent des tours d’agent échoués.
    - Les valeurs par défaut de Discord résident dans `channels.discord.guilds."*"` (remplaçables par guilde/canal).
    - Le contexte d’historique de groupe est encapsulé uniformément sur tous les canaux et est **uniquement en attente** (messages ignorés à cause du filtrage par mention) ; utilisez `messages.groupChat.historyLimit` pour la valeur globale par défaut et `channels.<channel>.historyLimit` (ou `channels.<channel>.accounts.*.historyLimit`) pour les remplacements. Définissez `0` pour désactiver.

  </Accordion>
</AccordionGroup>

## Restrictions d’outils par groupe/canal (facultatif)

Certaines configurations de canaux permettent de restreindre les outils disponibles **dans un groupe, une salle ou un canal spécifique**.

- `tools` : autorise/refuse des outils pour tout le groupe.
- `toolsBySender` : remplacements par expéditeur au sein du groupe. Utilisez des préfixes de clés explicites : `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>`, et le caractère générique `"*"`. Les anciennes clés sans préfixe sont toujours acceptées et ne correspondent qu’à `id:`.

Ordre de résolution (le plus spécifique l’emporte) :

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
Les restrictions d’outils par groupe/canal sont appliquées en plus de la stratégie globale/d’agent pour les outils (le refus l’emporte toujours). Certains canaux utilisent une imbrication différente pour les salles/canaux (par exemple, Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Listes d’autorisation de groupes

Lorsque `channels.whatsapp.groups`, `channels.telegram.groups` ou `channels.imessage.groups` est configuré, les clés agissent comme une liste d’autorisation de groupes. Utilisez `"*"` pour autoriser tous les groupes tout en définissant le comportement de mention par défaut.

<Warning>
Confusion fréquente : l’approbation d’appairage en MP n’est pas la même chose que l’autorisation de groupe. Pour les canaux qui prennent en charge l’appairage en MP, le stockage d’appairage déverrouille uniquement les MP. Les commandes de groupe nécessitent toujours une autorisation explicite de l’expéditeur du groupe via des listes d’autorisation de configuration comme `groupAllowFrom` ou la solution de repli de configuration documentée pour ce canal.
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

Les propriétaires de groupe peuvent basculer l’activation par groupe :

- `/activation mention`
- `/activation always`

Le propriétaire est déterminé par `channels.whatsapp.allowFrom` (ou par le numéro E.164 propre au bot lorsqu’il n’est pas défini). Envoyez la commande comme message autonome. Les autres surfaces ignorent actuellement `/activation`.

## Champs de contexte

Les charges utiles entrantes de groupe définissent :

- `ChatType=group`
- `GroupSubject` (si connu)
- `GroupMembers` (si connus)
- `WasMentioned` (résultat du filtrage par mention)
- Les sujets de forum Telegram incluent également `MessageThreadId` et `IsForum`.

Notes propres aux canaux :

- BlueBubbles peut, facultativement, enrichir les participants de groupes macOS sans nom à partir de la base de données locale Contacts avant de remplir `GroupMembers`. Cette option est désactivée par défaut et ne s’exécute qu’après la réussite du filtrage normal de groupe.

L’invite système de l’agent inclut une introduction de groupe au premier tour d’une nouvelle session de groupe. Elle rappelle au modèle de répondre comme un humain, d’éviter les tableaux Markdown, de minimiser les lignes vides, de respecter l’espacement normal d’une discussion et d’éviter de saisir des séquences littérales `\n`. Les noms de groupes et libellés de participants issus du canal sont rendus comme métadonnées non fiables dans des blocs de code, et non comme instructions système en ligne.

## Spécificités d’iMessage

- Préférez `chat_id:<id>` lors du routage ou de l’ajout à une liste d’autorisation.
- Lister les discussions : `imsg chats --limit 20`.
- Les réponses de groupe reviennent toujours au même `chat_id`.

## Invites système WhatsApp

Consultez [WhatsApp](/fr/channels/whatsapp#system-prompts) pour les règles canoniques des invites système WhatsApp, y compris la résolution des invites de groupe et directes, le comportement des caractères génériques et la sémantique de remplacement par compte.

## Spécificités de WhatsApp

Consultez [Messages de groupe](/fr/channels/group-messages) pour le comportement propre à WhatsApp (injection d’historique, détails de gestion des mentions).

## Connexe

- [Groupes de diffusion](/fr/channels/broadcast-groups)
- [Routage des canaux](/fr/channels/channel-routing)
- [Messages de groupe](/fr/channels/group-messages)
- [Appairage](/fr/channels/pairing)
