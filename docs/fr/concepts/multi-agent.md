---
read_when: You want multiple agents with separate workspaces, auth, and sessions in one Gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'Routage multi-agent : limites des agents, comptes de canaux et liaisons'
title: Routage multi-agents
x-i18n:
    generated_at: "2026-07-12T15:13:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 265a1f3d9d9b4957c99c71f391ce4f5abba6b70561570f8bbe8cb9964ece1cfc
    source_path: concepts/multi-agent.md
    workflow: 16
---

Exécutez plusieurs agents _isolés_ dans un même processus Gateway, chacun avec son propre espace de travail, son propre répertoire d’état (`agentDir`) et son propre historique de sessions stocké dans SQLite, ainsi que plusieurs comptes de canal (par exemple, deux numéros WhatsApp). Les messages entrants sont acheminés vers l’agent approprié au moyen de **liaisons**.

Un **agent** représente le périmètre complet d’une persona : fichiers de l’espace de travail, profils d’authentification, registre de modèles et stockage des sessions. Une **liaison** associe un compte de canal (un espace de travail Slack, un numéro WhatsApp, etc.) à l’un de ces agents.

## Qu’est-ce qu’un agent

Chaque agent possède ses propres éléments :

- **Espace de travail** : fichiers, `AGENTS.md`/`SOUL.md`/`USER.md`, notes locales, règles de persona.
- **Répertoire d’état** (`agentDir`) : profils d’authentification, registre de modèles, configuration propre à l’agent.
- **Stockage des sessions** : historique des conversations et état du routage dans `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`.

Les profils d’authentification sont propres à chaque agent et sont lus depuis :

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` est la méthode la plus sûre pour récupérer des informations entre les sessions : elle renvoie une vue limitée et expurgée, et non une copie brute de la transcription. Elle supprime les signatures des blocs de réflexion, les détails des charges utiles des résultats d’outils, la structure `<relevant-memories>`, les balises XML d’appel d’outil (`<tool_call>`, `<function_call>` et leurs formes plurielles ou rétrogradées) ainsi que le XML d’appel d’outil MiniMax, puis tronque et limite la sortie en fonction de sa taille en octets.
</Note>

<Warning>
Ne réutilisez jamais un même `agentDir` pour plusieurs agents : cela provoque des collisions entre les états d’authentification et de session. Lorsque les identifiants OAuth locaux d’un agent secondaire ont expiré ou que leur actualisation échoue, OpenClaw consulte les identifiants de l’agent principal/par défaut correspondant au même identifiant de profil et adopte le jeton le plus récent, sans copier le jeton d’actualisation dans le stockage de l’agent secondaire. Si vous souhaitez utiliser un compte OAuth totalement indépendant, connectez-vous depuis cet agent. Si vous copiez manuellement des identifiants, copiez uniquement les profils statiques portables `api_key` ou `token` : les données d’actualisation OAuth ne sont pas portables par défaut (`copyToAgents` permet d’autoriser explicitement un profil).
</Warning>

Les Skills sont chargées depuis l’espace de travail de chaque agent ainsi que depuis des racines partagées telles que `~/.openclaw/skills`, puis filtrées selon la liste d’autorisation de Skills effective de l’agent. Utilisez `agents.defaults.skills` pour définir une base de référence partagée et `agents.list[].skills` pour effectuer un remplacement propre à chaque agent (les entrées explicites remplacent la valeur par défaut, elles ne sont pas fusionnées). Consultez [Skills : propres à chaque agent ou partagées](/fr/tools/skills#per-agent-vs-shared-skills) et [Skills : listes d’autorisation des agents](/fr/tools/skills#agent-allowlists).

Le stockage géré par un Plugin suit la configuration de ce Plugin ; l’ajout d’un second agent ne sépare pas automatiquement tous les stockages globaux des Plugins. Par exemple, configurez des [coffres Memory Wiki propres à chaque agent](/fr/concepts/multi-agent#per-agent-memory-wiki-vaults) lorsque les personas ne doivent pas partager les connaissances de wiki compilées.

<Note>
**Remarque sur l’espace de travail :** l’espace de travail de chaque agent est le **répertoire de travail actuel par défaut**, et non un bac à sable strict. Les chemins relatifs sont résolus dans l’espace de travail, mais les chemins absolus peuvent accéder à d’autres emplacements de l’hôte, sauf si l’isolation en bac à sable est activée. Consultez [Isolation en bac à sable](/fr/gateway/sandboxing).
</Note>

## Chemins

| Élément                          | Valeur par défaut                                                                     | Remplacement                                                                             |
| -------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Configuration                    | `~/.openclaw/openclaw.json`                                                            | `OPENCLAW_CONFIG_PATH`                                                                   |
| Répertoire d’état                | `~/.openclaw`                                                                          | `OPENCLAW_STATE_DIR`                                                                     |
| Espace de travail de l’agent par défaut | `~/.openclaw/workspace` (ou `workspace-<profile>` lorsque `OPENCLAW_PROFILE` est défini) | `agents.list[].workspace`, puis `agents.defaults.workspace`, ou `OPENCLAW_WORKSPACE_DIR` |
| Espace de travail des autres agents | `<stateDir>/workspace-<agentId>` (ou `<agents.defaults.workspace>/<agentId>` lorsqu’il est défini) | `agents.list[].workspace`                                                                |
| Répertoire de l’agent            | `~/.openclaw/agents/<agentId>/agent`                                                   | `agents.list[].agentDir`                                                                 |
| Sessions et transcriptions       | `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`                             | —                                                                                        |
| Artefacts de session hérités/archivés | `~/.openclaw/agents/<agentId>/sessions`                                                | —                                                                                        |

### Mode agent unique (par défaut)

Si vous ne configurez rien, OpenClaw exécute un seul agent :

- La valeur par défaut de `agentId` est `main`.
- Les sessions utilisent des clés de la forme `agent:main:<mainKey>` (la valeur par défaut de `mainKey` est `main`).
- L’espace de travail par défaut est `~/.openclaw/workspace` (ou `workspace-<profile>` lorsque `OPENCLAW_PROFILE` est défini sur une valeur autre que `default`).
- L’état est stocké par défaut dans `~/.openclaw/agents/main/agent`.

## Assistant de gestion des agents

Ajoutez un nouvel agent isolé :

```bash
openclaw agents add work
```

Options : `--workspace <dir>`, `--model <id>`, `--agent-dir <dir>`, `--bind <channel[:accountId]>` (répétable), `--non-interactive` (nécessite `--workspace`).

Ajoutez des `bindings` pour acheminer les messages entrants (l’assistant vous propose de le faire), puis vérifiez :

```bash
openclaw agents list --bindings
```

## Démarrage rapide

<Steps>
  <Step title="Créer l’espace de travail de chaque agent">
    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    Chaque agent dispose de son propre espace de travail avec `SOUL.md`, `AGENTS.md` et éventuellement `USER.md`, ainsi que d’un `agentDir` dédié et d’un stockage de sessions sous `~/.openclaw/agents/<agentId>`.

  </Step>
  <Step title="Créer les comptes de canal">
    Créez un compte par agent sur les canaux de votre choix :

    - Discord : un bot par agent, activez Message Content Intent et copiez chaque jeton.
    - Telegram : un bot par agent via BotFather, puis copiez chaque jeton.
    - WhatsApp : associez chaque numéro de téléphone au compte correspondant.

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    Consultez les guides des canaux : [Discord](/fr/channels/discord), [Telegram](/fr/channels/telegram), [WhatsApp](/fr/channels/whatsapp).

  </Step>
  <Step title="Ajouter les agents, les comptes et les liaisons">
    Ajoutez les agents sous `agents.list`, les comptes de canal sous `channels.<channel>.accounts`, puis reliez-les avec `bindings` (voir les exemples ci-dessous).
  </Step>
  <Step title="Redémarrer et vérifier">
    ```bash
    openclaw gateway restart
    openclaw agents list --bindings
    openclaw channels status --probe
    ```
  </Step>
</Steps>

## Plusieurs agents, plusieurs personas

Chaque `agentId` configuré constitue une limite de persona distincte pour l’état principal de l’agent :

- Comptes différents par canal (selon `accountId`).
- Personnalités différentes (`AGENTS.md`/`SOUL.md` propres à chaque agent).
- Authentification et sessions séparées, l’accès entre agents n’étant activé que par des fonctionnalités explicites ou par la configuration d’un Plugin.

Cela permet à plusieurs personnes de partager un même Gateway tout en conservant séparément l’état principal de chaque agent.

## Coffres Memory Wiki propres à chaque agent

Memory Wiki utilise par défaut un coffre global unique. Pour séparer les connaissances compilées d’un agent d’assistance de celles d’un agent marketing, définissez `plugins.entries.memory-wiki.config.vault.scope` sur `agent` :

```json5
{
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vault: {
            scope: "agent",
            path: "~/.openclaw/wiki",
          },
        },
      },
    },
  },
}
```

Le chemin configuré correspond au répertoire parent. OpenClaw lui ajoute l’identifiant normalisé de l’agent, produisant des chemins tels que `~/.openclaw/wiki/support` et `~/.openclaw/wiki/marketing`. Les opérations de la CLI et du Gateway limitées à un agent nécessitent de spécifier explicitement un agent lorsque plusieurs agents sont configurés. Consultez [Coffres Memory Wiki propres à chaque agent](/fr/plugins/memory-wiki#per-agent-vaults) pour plus de détails sur le filtrage du pont, la migration et les limites de confiance.

## Recherche de mémoire QMD entre agents

Pour permettre à un agent de rechercher les transcriptions de sessions QMD d’un autre agent, ajoutez des collections supplémentaires sous `agents.list[].memorySearch.qmd.extraCollections`. Utilisez `agents.defaults.memorySearch.qmd.extraCollections` lorsque tous les agents doivent partager les mêmes collections.

```json5
{
  agents: {
    defaults: {
      workspace: "~/workspaces/main",
      memorySearch: {
        qmd: {
          extraCollections: [{ path: "~/agents/family/sessions", name: "family-sessions" }],
        },
      },
    },
    list: [
      {
        id: "main",
        workspace: "~/workspaces/main",
        memorySearch: {
          qmd: {
            extraCollections: [{ path: "notes" }], // résolu dans l’espace de travail -> collection nommée "notes-main"
          },
        },
      },
      { id: "family", workspace: "~/workspaces/family" },
    ],
  },
  memory: {
    backend: "qmd",
    qmd: { includeDefaultMemory: false },
  },
}
```

Le chemin d’une collection supplémentaire peut être partagé entre plusieurs agents, mais son `name` reste explicite lorsque le chemin se trouve hors de l’espace de travail de l’agent. Les chemins situés dans l’espace de travail restent propres à l’agent afin que chacun conserve son propre ensemble de recherche de transcriptions.

## Un numéro WhatsApp, plusieurs personnes (répartition des messages privés)

Acheminez différents messages privés WhatsApp vers différents agents sur **un seul** compte WhatsApp en faisant correspondre l’expéditeur au format E.164 (`+15551234567`) avec `peer.kind: "direct"`. Les réponses proviennent toujours du même numéro WhatsApp : il n’existe pas d’identité d’expéditeur propre à chaque agent.

<Note>
Par défaut, les conversations directes sont regroupées sous la clé de session principale de l’agent ; une isolation réelle nécessite donc un agent par personne.
</Note>

```json5
{
  agents: {
    list: [
      { id: "alex", workspace: "~/.openclaw/workspace-alex" },
      { id: "mia", workspace: "~/.openclaw/workspace-mia" },
    ],
  },
  bindings: [
    {
      agentId: "alex",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230001" } },
    },
    {
      agentId: "mia",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230002" } },
    },
  ],
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551230001", "+15551230002"],
    },
  },
}
```

Le contrôle d’accès aux messages privés (association/liste d’autorisation) est global pour chaque compte WhatsApp, et non propre à chaque agent. Pour les groupes partagés, associez le groupe à un seul agent ou utilisez les [Groupes de diffusion](/fr/channels/broadcast-groups).

## Règles de routage

Les liaisons sont déterministes et la correspondance la plus spécifique l’emporte. Consultez [Routage des canaux](/fr/channels/channel-routing#routing-rules-how-an-agent-is-chosen) pour connaître l’ordre complet des niveaux (pair exact, pair parent, caractère générique de pair, serveur+rôles, serveur, équipe, compte, canal, agent par défaut). Voici quelques règles importantes :

- Si plusieurs liaisons correspondent au même niveau, la première dans l’ordre de la configuration l’emporte.
- Si une liaison définit plusieurs champs de correspondance (par exemple `peer` + `guildId`), tous les champs spécifiés doivent correspondre (sémantique `AND`).
- Une liaison qui omet `accountId` correspond uniquement au compte par défaut, et non à tous les comptes. Utilisez `accountId: "*"` pour définir une solution de repli à l’échelle du canal, ou `accountId: "<name>"` pour un compte précis. L’ajout de la même liaison avec un identifiant de compte explicite met à niveau la liaison existante limitée au canal au lieu de la dupliquer.

## Plusieurs comptes / numéros de téléphone

Les canaux qui prennent en charge plusieurs comptes (par exemple WhatsApp) utilisent `accountId` pour identifier chaque connexion. Chaque `accountId` est acheminé vers son propre agent, ce qui permet à un serveur d’héberger plusieurs numéros de téléphone sans mélanger les sessions.

Définissez `channels.<channel>.defaultAccount` pour choisir le compte utilisé lorsque `accountId` est omis. Si cette valeur n’est pas définie, OpenClaw utilise `default` s’il existe ; sinon, il utilise le premier identifiant de compte configuré selon l’ordre de tri.

Canaux prenant en charge plusieurs comptes : `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `mattermost`, `matrix`, `nextcloud-talk`, `nostr`, `signal`, `slack`, `telegram`, `whatsapp`, `zalo`, `zalouser`.

## Concepts

- `agentId` : un « cerveau » (espace de travail, authentification propre à l’agent, stockage de sessions propre à l’agent).
- `accountId` : une instance de compte de canal (par exemple, le compte WhatsApp `personal` par rapport à `biz`).
- `binding` : achemine les messages entrants vers un `agentId` selon `(channel, accountId, peer)`, et éventuellement selon les identifiants de serveur/d’équipe.
- Les conversations directes sont regroupées dans `agent:<agentId>:<mainKey>` (session « principale » propre à l’agent ; voir `session.mainKey`).

## Exemples par plateforme

<AccordionGroup>
  <Accordion title="Bots Discord par agent">
    Chaque compte de bot Discord correspond à un `accountId` unique. Associez chaque compte à un agent et conservez des listes d’autorisation propres à chaque bot.

    ```json5
    {
      agents: {
        list: [
          { id: "main", workspace: "~/.openclaw/workspace-main" },
          { id: "coding", workspace: "~/.openclaw/workspace-coding" },
        ],
      },
      bindings: [
        { agentId: "main", match: { channel: "discord", accountId: "default" } },
        { agentId: "coding", match: { channel: "discord", accountId: "coding" } },
      ],
      channels: {
        discord: {
          groupPolicy: "allowlist",
          accounts: {
            default: {
              token: "DISCORD_BOT_TOKEN_MAIN",
              guilds: {
                "123456789012345678": {
                  channels: {
                    "222222222222222222": { allow: true, requireMention: false },
                  },
                },
              },
            },
            coding: {
              token: "DISCORD_BOT_TOKEN_CODING",
              guilds: {
                "123456789012345678": {
                  channels: {
                    "333333333333333333": { allow: true, requireMention: false },
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

    - Invitez chaque bot sur le serveur et activez Message Content Intent.
    - Les jetons se trouvent dans `channels.discord.accounts.<id>.token` (le compte par défaut peut utiliser `DISCORD_BOT_TOKEN`).

  </Accordion>
  <Accordion title="Bots Telegram par agent">
    ```json5
    {
      agents: {
        list: [
          { id: "main", workspace: "~/.openclaw/workspace-main" },
          { id: "alerts", workspace: "~/.openclaw/workspace-alerts" },
        ],
      },
      bindings: [
        { agentId: "main", match: { channel: "telegram", accountId: "default" } },
        { agentId: "alerts", match: { channel: "telegram", accountId: "alerts" } },
      ],
      channels: {
        telegram: {
          accounts: {
            default: {
              botToken: "123456:ABC...",
              dmPolicy: "pairing",
            },
            alerts: {
              botToken: "987654:XYZ...",
              dmPolicy: "allowlist",
              allowFrom: ["tg:123456789"],
            },
          },
        },
      },
    }
    ```

    - Créez un bot par agent avec BotFather et copiez chaque jeton.
    - Les jetons se trouvent dans `channels.telegram.accounts.<id>.botToken` (le compte par défaut peut utiliser `TELEGRAM_BOT_TOKEN`).
    - Pour plusieurs bots dans le même groupe Telegram, invitez chaque bot et mentionnez celui qui doit répondre.
    - Désactivez Privacy Mode de BotFather pour chaque bot de groupe (`/setprivacy` -> Disable), puis supprimez et ajoutez de nouveau le bot afin que Telegram applique le paramètre.
    - Autorisez les groupes avec `channels.telegram.groups`, ou utilisez `groupPolicy: "open"` uniquement pour les déploiements de groupes de confiance.
    - Placez les identifiants utilisateur des expéditeurs dans `groupAllowFrom`. Les identifiants de groupe et de supergroupe doivent figurer dans `channels.telegram.groups`, et non dans `groupAllowFrom`.
    - Associez selon `accountId` afin que chaque bot achemine les messages vers son propre agent.

  </Accordion>
  <Accordion title="Numéros WhatsApp par agent">
    Associez chaque compte avant de démarrer le Gateway :

    ```bash
    openclaw channels login --channel whatsapp --account personal
    openclaw channels login --channel whatsapp --account biz
    ```

    `~/.openclaw/openclaw.json` (JSON5) :

    ```js
    {
      agents: {
        list: [
          {
            id: "home",
            default: true,
            name: "Home",
            workspace: "~/.openclaw/workspace-home",
            agentDir: "~/.openclaw/agents/home/agent",
          },
          {
            id: "work",
            name: "Work",
            workspace: "~/.openclaw/workspace-work",
            agentDir: "~/.openclaw/agents/work/agent",
          },
        ],
      },

      // Routage déterministe : la première correspondance l’emporte (la plus précise en premier).
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

        // Remplacement facultatif par pair (exemple : envoyer un groupe précis à l’agent de travail).
        {
          agentId: "work",
          match: {
            channel: "whatsapp",
            accountId: "personal",
            peer: { kind: "group", id: "1203630...@g.us" },
          },
        },
      ],

      // Désactivé par défaut : la messagerie entre agents doit être explicitement activée et autorisée.
      tools: {
        agentToAgent: {
          enabled: false,
          allow: ["home", "work"],
        },
      },

      channels: {
        whatsapp: {
          accounts: {
            personal: {
              // Remplacement facultatif. Valeur par défaut : ~/.openclaw/credentials/whatsapp/personal
              // authDir: "~/.openclaw/credentials/whatsapp/personal",
            },
            biz: {
              // Remplacement facultatif. Valeur par défaut : ~/.openclaw/credentials/whatsapp/biz
              // authDir: "~/.openclaw/credentials/whatsapp/biz",
            },
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## Modèles courants

<Tabs>
  <Tab title="WhatsApp au quotidien + travail approfondi sur Telegram">
    Répartissez par canal : acheminez WhatsApp vers un agent rapide pour les tâches quotidiennes et Telegram vers un agent Opus.

    ```json5
    {
      agents: {
        list: [
          {
            id: "chat",
            name: "Everyday",
            workspace: "~/.openclaw/workspace-chat",
            model: "anthropic/claude-sonnet-4-6",
          },
          {
            id: "opus",
            name: "Deep Work",
            workspace: "~/.openclaw/workspace-opus",
            model: "anthropic/claude-opus-4-6",
          },
        ],
      },
      bindings: [
        { agentId: "chat", match: { channel: "whatsapp", accountId: "*" } },
        { agentId: "opus", match: { channel: "telegram", accountId: "*" } },
      ],
    }
    ```

    Ces exemples utilisent `accountId: "*"` afin que les associations continuent de fonctionner si vous ajoutez des comptes ultérieurement. Pour acheminer un seul message direct/groupe vers Opus tout en conservant le reste sur l’agent de conversation, ajoutez une association `match.peer` pour cette pair — les correspondances de pair l’emportent toujours sur les règles couvrant l’ensemble du canal.

  </Tab>
  <Tab title="Même canal, une pair vers Opus">
    Conservez WhatsApp sur l’agent rapide, mais acheminez un message direct vers Opus :

    ```json5
    {
      agents: {
        list: [
          {
            id: "chat",
            name: "Everyday",
            workspace: "~/.openclaw/workspace-chat",
            model: "anthropic/claude-sonnet-4-6",
          },
          {
            id: "opus",
            name: "Deep Work",
            workspace: "~/.openclaw/workspace-opus",
            model: "anthropic/claude-opus-4-6",
          },
        ],
      },
      bindings: [
        {
          agentId: "opus",
          match: { channel: "whatsapp", accountId: "*", peer: { kind: "direct", id: "+15551234567" } },
        },
        { agentId: "chat", match: { channel: "whatsapp", accountId: "*" } },
      ],
    }
    ```

    Les associations de pair l’emportent toujours ; conservez-les donc au-dessus de la règle couvrant l’ensemble du canal.

  </Tab>
  <Tab title="Agent familial associé à un groupe WhatsApp">
    Associez un agent familial dédié à un seul groupe WhatsApp, avec une obligation de mention et une politique d’outils plus stricte :

    ```json5
    {
      agents: {
        list: [
          {
            id: "family",
            name: "Family",
            workspace: "~/.openclaw/workspace-family",
            identity: { name: "Family Bot" },
            groupChat: {
              mentionPatterns: ["@family", "@familybot", "@Family Bot"],
            },
            sandbox: {
              mode: "all",
              scope: "agent",
            },
            tools: {
              allow: [
                "exec",
                "read",
                "sessions_list",
                "sessions_history",
                "sessions_send",
                "sessions_spawn",
                "session_status",
              ],
              deny: ["write", "edit", "apply_patch", "browser", "canvas", "nodes", "cron"],
            },
          },
        ],
      },
      bindings: [
        {
          agentId: "family",
          match: {
            channel: "whatsapp",
            peer: { kind: "group", id: "120363999999999999@g.us" },
          },
        },
      ],
    }
    ```

    Les listes d’autorisation/de refus d’outils concernent des **outils**, et non des Skills. Si une compétence doit exécuter un binaire, vérifiez que `exec` est autorisé et que le binaire existe dans le bac à sable. Pour un filtrage plus strict, définissez `agents.list[].groupChat.mentionPatterns` et conservez les listes d’autorisation de groupes activées pour le canal.

  </Tab>
</Tabs>

## Configuration du bac à sable et des outils par agent

Chaque agent peut disposer de ses propres restrictions de bac à sable et d’outils :

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // Aucun bac à sable pour l’agent personnel
        },
        // Aucune restriction d’outil : tous les outils sont disponibles
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // Toujours dans un bac à sable
          scope: "agent",  // Un conteneur par agent
          docker: {
            // Configuration initiale facultative après la création du conteneur
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // Uniquement l’outil de lecture
          deny: ["exec", "write", "edit", "apply_patch"],    // Refuser les autres
        },
      },
    ],
  },
}
```

<Note>
`setupCommand` se trouve sous `sandbox.docker` et s’exécute une fois lors de la création du conteneur. Les remplacements `sandbox.docker.*` propres à l’agent sont ignorés lorsque la portée résolue est `"shared"`.
</Note>

Cela vous offre :

- **Isolation de sécurité** : restreignez les outils pour les agents non fiables.
- **Contrôle des ressources** : placez certains agents dans un bac à sable tout en conservant les autres sur l’hôte.
- **Politiques flexibles** : définissez des autorisations différentes pour chaque agent.

<Note>
`tools.elevated` comporte à la fois une porte globale (`tools.elevated.enabled`/`allowFrom`) et une porte propre à l’agent (`agents.list[].tools.elevated.enabled`/`allowFrom`). La porte propre à l’agent peut uniquement restreindre davantage la porte globale : les deux doivent autoriser un expéditeur pour que les commandes avec privilèges élevés puissent s’exécuter. Pour cibler un groupe, utilisez `agents.list[].groupChat.mentionPatterns` afin que les @mentions correspondent clairement à l’agent prévu.
</Note>

Consultez [Bac à sable et outils multi-agents](/fr/tools/multi-agent-sandbox-tools) pour obtenir des exemples détaillés.

## Rubriques associées

- [Agents ACP](/fr/tools/acp-agents) — exécution de harnais de programmation externes
- [Routage des canaux](/fr/channels/channel-routing) — acheminement des messages vers les agents
- [Présence](/fr/concepts/presence) — présence et disponibilité des agents
- [Session](/fr/concepts/session) — isolation et routage des sessions
- [Sous-agents](/fr/tools/subagents) — lancement d’exécutions d’agents en arrière-plan
