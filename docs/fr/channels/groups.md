---
read_when:
    - Modifier le comportement des discussions de groupe ou le filtrage par mention
sidebarTitle: Groups
summary: Comportement des discussions de groupe selon les surfaces (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Groupes
x-i18n:
    generated_at: "2026-04-26T11:23:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 837055b3cd044ebe3ef9aefe29e36f6471f48025d32169c43b9c5b04a8ac639c
    source_path: channels/groups.md
    workflow: 15
---

OpenClaw traite les discussions de groupe de manière cohérente selon les surfaces : Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Introduction pour débutants (2 minutes)

OpenClaw « vit » sur vos propres comptes de messagerie. Il n’y a pas d’utilisateur bot WhatsApp séparé. Si **vous** êtes dans un groupe, OpenClaw peut voir ce groupe et y répondre.

Comportement par défaut :

- Les groupes sont restreints (`groupPolicy: "allowlist"`).
- Les réponses nécessitent une mention, sauf si vous désactivez explicitement le filtrage par mention.

En clair : les expéditeurs autorisés par liste d’autorisation peuvent déclencher OpenClaw en le mentionnant.

<Note>
**En bref**

- L’**accès aux DM** est contrôlé par `*.allowFrom`.
- L’**accès aux groupes** est contrôlé par `*.groupPolicy` + les listes d’autorisation (`*.groups`, `*.groupAllowFrom`).
- Le **déclenchement des réponses** est contrôlé par le filtrage par mention (`requireMention`, `/activation`).
  </Note>

Flux rapide (ce qui se passe pour un message de groupe) :

```
groupPolicy? disabled -> ignorer
groupPolicy? allowlist -> groupe autorisé ? non -> ignorer
requireMention? yes -> mentionné ? non -> stocker pour le contexte uniquement
sinon -> répondre
```

## Visibilité du contexte et listes d’autorisation

Deux contrôles différents interviennent dans la sécurité des groupes :

- **Autorisation de déclenchement** : qui peut déclencher l’agent (`groupPolicy`, `groups`, `groupAllowFrom`, listes d’autorisation spécifiques au canal).
- **Visibilité du contexte** : quel contexte supplémentaire est injecté dans le modèle (texte de réponse, citations, historique de fil, métadonnées de transfert).

Par défaut, OpenClaw privilégie un comportement de discussion normal et conserve le contexte en grande partie tel qu’il a été reçu. Cela signifie que les listes d’autorisation déterminent principalement qui peut déclencher des actions, et non une limite universelle de masquage pour chaque extrait cité ou historique.

<AccordionGroup>
  <Accordion title="Le comportement actuel dépend du canal">
    - Certains canaux appliquent déjà un filtrage basé sur l’expéditeur pour le contexte supplémentaire dans certains chemins (par exemple, amorçage de fil Slack, recherches de réponse/fil Matrix).
    - D’autres canaux transmettent encore le contexte de citation/réponse/transfert tel qu’il a été reçu.
  </Accordion>
  <Accordion title="Orientation de durcissement (prévue)">
    - `contextVisibility: "all"` (par défaut) conserve le comportement actuel tel que reçu.
    - `contextVisibility: "allowlist"` filtre le contexte supplémentaire aux expéditeurs autorisés par liste d’autorisation.
    - `contextVisibility: "allowlist_quote"` correspond à `allowlist` avec une exception explicite pour une citation/réponse.

    Tant que ce modèle de durcissement n’est pas implémenté de manière cohérente sur tous les canaux, attendez-vous à des différences selon la surface.

  </Accordion>
</AccordionGroup>

![Flux des messages de groupe](/images/groups-flow.svg)

Si vous voulez...

| Objectif                                     | Paramètre à définir                                        |
| -------------------------------------------- | ---------------------------------------------------------- |
| Autoriser tous les groupes mais ne répondre qu’aux @mentions | `groups: { "*": { requireMention: true } }`                |
| Désactiver toutes les réponses en groupe     | `groupPolicy: "disabled"`                                  |
| Seulement des groupes spécifiques            | `groups: { "<group-id>": { ... } }` (sans clé `"*"`)       |
| Vous seul pouvez déclencher dans les groupes | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Clés de session

- Les sessions de groupe utilisent des clés de session `agent:<agentId>:<channel>:group:<id>` (les salons/canaux utilisent `agent:<agentId>:<channel>:channel:<id>`).
- Les sujets de forum Telegram ajoutent `:topic:<threadId>` à l’identifiant du groupe afin que chaque sujet ait sa propre session.
- Les discussions directes utilisent la session principale (ou une session par expéditeur si cela est configuré).
- Les Heartbeat sont ignorés pour les sessions de groupe.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Modèle : DM personnels + groupes publics (agent unique)

Oui — cela fonctionne bien si votre trafic « personnel » correspond aux **DM** et votre trafic « public » aux **groupes**.

Pourquoi : en mode agent unique, les DM arrivent généralement dans la clé de session **principale** (`agent:main:main`), tandis que les groupes utilisent toujours des clés de session **non principales** (`agent:main:<channel>:group:<id>`). Si vous activez le sandboxing avec `mode: "non-main"`, ces sessions de groupe s’exécutent dans le backend de sandbox configuré, tandis que votre session DM principale reste sur l’hôte. Docker est le backend par défaut si vous n’en choisissez pas un.

Cela vous donne un seul « cerveau » d’agent (espace de travail + mémoire partagés), mais deux modes d’exécution :

- **DM** : outils complets (hôte)
- **Groupes** : sandbox + outils restreints

<Note>
Si vous avez besoin d’espaces de travail/personas réellement séparés (« personnel » et « public » ne doivent jamais se mélanger), utilisez un second agent + des bindings. Voir [Routage multi-agent](/fr/concepts/multi-agent).
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
  <Tab title="Les groupes ne voient qu’un dossier autorisé par liste d’autorisation">
    Vous voulez « les groupes ne peuvent voir que le dossier X » au lieu de « aucun accès à l’hôte » ? Conservez `workspaceAccess: "none"` et montez uniquement les chemins autorisés par liste d’autorisation dans le sandbox :

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

Liens utiles :

- Clés de configuration et valeurs par défaut : [Configuration du Gateway](/fr/gateway/config-agents#agentsdefaultssandbox)
- Déboguer pourquoi un outil est bloqué : [Sandbox vs stratégie d’outil vs Elevated](/fr/gateway/sandbox-vs-tool-policy-vs-elevated)
- Détails sur les bind mounts : [Sandboxing](/fr/gateway/sandboxing#custom-bind-mounts)

## Libellés d’affichage

- Les libellés de l’interface utilisent `displayName` lorsqu’il est disponible, au format `<channel>:<token>`.
- `#room` est réservé aux salons/canaux ; les discussions de groupe utilisent `g-<slug>` (minuscules, espaces -> `-`, conserver `#@+._-`).

## Politique de groupe

Contrôlez la manière dont les messages de groupe/salon sont gérés par canal :

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

| Politique     | Comportement                                                |
| ------------- | ----------------------------------------------------------- |
| `"open"`      | Les groupes contournent les listes d’autorisation ; le filtrage par mention s’applique toujours. |
| `"disabled"`  | Bloque entièrement tous les messages de groupe.             |
| `"allowlist"` | Autorise uniquement les groupes/salons correspondant à la liste d’autorisation configurée. |

<AccordionGroup>
  <Accordion title="Notes par canal">
    - `groupPolicy` est distinct du filtrage par mention (qui exige des @mentions).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo : utilisez `groupAllowFrom` (repli : `allowFrom` explicite).
    - Les approbations d’association DM (entrées stockées dans `*-allowFrom`) s’appliquent uniquement à l’accès DM ; l’autorisation des expéditeurs de groupe reste explicitement liée aux listes d’autorisation de groupe.
    - Discord : la liste d’autorisation utilise `channels.discord.guilds.<id>.channels`.
    - Slack : la liste d’autorisation utilise `channels.slack.channels`.
    - Matrix : la liste d’autorisation utilise `channels.matrix.groups`. Préférez les identifiants ou alias de salon ; la recherche par nom de salon rejoint est effectuée au mieux, et les noms non résolus sont ignorés à l’exécution. Utilisez `channels.matrix.groupAllowFrom` pour restreindre les expéditeurs ; des listes d’autorisation `users` par salon sont également prises en charge.
    - Les DM de groupe sont contrôlés séparément (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - La liste d’autorisation Telegram peut correspondre à des identifiants utilisateur (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) ou à des noms d’utilisateur (`"@alice"` ou `"alice"`) ; les préfixes sont insensibles à la casse.
    - La valeur par défaut est `groupPolicy: "allowlist"` ; si votre liste d’autorisation de groupe est vide, les messages de groupe sont bloqués.
    - Sécurité à l’exécution : lorsqu’un bloc de fournisseur est totalement absent (`channels.<provider>` absent), la politique de groupe revient à un mode fermé par défaut en cas d’échec (généralement `allowlist`) au lieu d’hériter de `channels.defaults.groupPolicy`.
  </Accordion>
</AccordionGroup>

Modèle mental rapide (ordre d’évaluation pour les messages de groupe) :

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="Listes d’autorisation de groupe">
    Listes d’autorisation de groupe (`*.groups`, `*.groupAllowFrom`, liste d’autorisation spécifique au canal).
  </Step>
  <Step title="Filtrage par mention">
    Filtrage par mention (`requireMention`, `/activation`).
  </Step>
</Steps>

## Filtrage par mention (par défaut)

Les messages de groupe nécessitent une mention, sauf substitution au niveau du groupe. Les valeurs par défaut se trouvent par sous-système dans `*.groups."*"`.

Répondre à un message de bot compte comme une mention implicite lorsque le canal prend en charge les métadonnées de réponse. Citer un message de bot peut également compter comme une mention implicite sur les canaux qui exposent des métadonnées de citation. Les cas intégrés actuels incluent Telegram, WhatsApp, Slack, Discord, Microsoft Teams et ZaloUser.

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
    - `mentionPatterns` sont des motifs regex sûrs insensibles à la casse ; les motifs invalides et les formes non sûres de répétition imbriquée sont ignorés.
    - Les surfaces qui fournissent des mentions explicites continuent de fonctionner ; les motifs servent de solution de repli.
    - Substitution par agent : `agents.list[].groupChat.mentionPatterns` (utile lorsque plusieurs agents partagent un groupe).
    - Le filtrage par mention n’est appliqué que lorsque la détection de mention est possible (mentions natives ou `mentionPatterns` configurés).
    - Les groupes où les réponses silencieuses sont autorisées traitent les tours de modèle vides ou contenant uniquement du raisonnement comme silencieux, équivalents à `NO_REPLY`. Les discussions directes traitent toujours les réponses vides comme un tour d’agent échoué.
    - Les valeurs par défaut de Discord se trouvent dans `channels.discord.guilds."*"` (surchargeables par serveur/canal).
    - Le contexte de l’historique de groupe est encapsulé uniformément sur tous les canaux et est **pending-only** (messages ignorés en raison du filtrage par mention) ; utilisez `messages.groupChat.historyLimit` pour la valeur par défaut globale et `channels.<channel>.historyLimit` (ou `channels.<channel>.accounts.*.historyLimit`) pour les substitutions. Définissez `0` pour désactiver.
  </Accordion>
</AccordionGroup>

## Restrictions des outils de groupe/canal (optionnel)

Certaines configurations de canal permettent de restreindre quels outils sont disponibles **à l’intérieur d’un groupe/salon/canal spécifique**.

- `tools` : autoriser/refuser des outils pour l’ensemble du groupe.
- `toolsBySender` : substitutions par expéditeur au sein du groupe. Utilisez des préfixes de clé explicites : `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` et le joker `"*"`. Les clés historiques sans préfixe sont toujours acceptées et sont mises en correspondance comme `id:` uniquement.

Ordre de résolution (le plus spécifique l’emporte) :

<Steps>
  <Step title="ToolsBySender du groupe">
    Correspondance `toolsBySender` du groupe/canal.
  </Step>
  <Step title="Tools du groupe">
    `tools` du groupe/canal.
  </Step>
  <Step title="ToolsBySender par défaut">
    Correspondance `toolsBySender` par défaut (`"*"`).
  </Step>
  <Step title="Tools par défaut">
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
Les restrictions d’outils de groupe/canal s’appliquent en plus de la stratégie d’outils globale/de l’agent (deny l’emporte toujours). Certains canaux utilisent une imbrication différente pour les salons/canaux (par exemple Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Listes d’autorisation de groupe

Lorsque `channels.whatsapp.groups`, `channels.telegram.groups` ou `channels.imessage.groups` est configuré, les clés agissent comme une liste d’autorisation de groupe. Utilisez `"*"` pour autoriser tous les groupes tout en définissant le comportement de mention par défaut.

<Warning>
Confusion fréquente : l’approbation d’association DM n’est pas la même chose que l’autorisation de groupe. Pour les canaux qui prennent en charge l’association DM, le magasin d’association déverrouille uniquement les DM. Les commandes de groupe exigent toujours une autorisation explicite de l’expéditeur du groupe à partir des listes d’autorisation de configuration telles que `groupAllowFrom` ou du mécanisme de repli de configuration documenté pour ce canal.
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
  <Tab title="Déclenchement réservé au propriétaire (WhatsApp)">
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

## Activation (réservée au propriétaire)

Les propriétaires de groupe peuvent basculer l’activation par groupe :

- `/activation mention`
- `/activation always`

Le propriétaire est déterminé par `channels.whatsapp.allowFrom` (ou l’E.164 propre du bot si non défini). Envoyez la commande comme message autonome. Les autres surfaces ignorent actuellement `/activation`.

## Champs de contexte

Les payloads entrants de groupe définissent :

- `ChatType=group`
- `GroupSubject` (si connu)
- `GroupMembers` (si connus)
- `WasMentioned` (résultat du filtrage par mention)
- Les sujets de forum Telegram incluent également `MessageThreadId` et `IsForum`.

Notes spécifiques au canal :

- BlueBubbles peut éventuellement enrichir les participants de groupe macOS sans nom à partir de la base de données locale Contacts avant de renseigner `GroupMembers`. Cette fonctionnalité est désactivée par défaut et ne s’exécute qu’une fois le filtrage normal des groupes passé.

Le prompt système de l’agent inclut une introduction de groupe au premier tour d’une nouvelle session de groupe. Il rappelle au modèle de répondre comme un humain, d’éviter les tableaux Markdown, de limiter les lignes vides et de suivre un espacement normal de discussion, et d’éviter de taper des séquences littérales `\n`. Les noms de groupe et libellés de participants issus du canal sont rendus comme des métadonnées non fiables encadrées, et non comme des instructions système en ligne.

## Spécificités iMessage

- Préférez `chat_id:<id>` lors du routage ou de la mise en liste d’autorisation.
- Lister les discussions : `imsg chats --limit 20`.
- Les réponses de groupe reviennent toujours au même `chat_id`.

## Prompts système WhatsApp

Voir [WhatsApp](/fr/channels/whatsapp#system-prompts) pour les règles canoniques des prompts système WhatsApp, y compris la résolution des prompts de groupe et directs, le comportement des jokers et la sémantique des substitutions de compte.

## Spécificités WhatsApp

Voir [Messages de groupe](/fr/channels/group-messages) pour le comportement propre à WhatsApp (injection d’historique, détails de gestion des mentions).

## Lié

- [Groupes de diffusion](/fr/channels/broadcast-groups)
- [Routage des canaux](/fr/channels/channel-routing)
- [Messages de groupe](/fr/channels/group-messages)
- [Association](/fr/channels/pairing)
