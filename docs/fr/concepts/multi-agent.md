---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'Routage multi-agent : agents isolés, comptes de canal et liaisons'
title: Routage multi-agent
x-i18n:
    generated_at: "2026-05-11T20:32:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7fd194cbe0938cc6ef6dd9b9803d2b1fe6f3e0777f4df7c407c692fd9f743c59
    source_path: concepts/multi-agent.md
    workflow: 16
---

Exécutez plusieurs agents _isolés_ — chacun avec son propre workspace, son répertoire d’état (`agentDir`) et son historique de session — ainsi que plusieurs comptes de canaux (par exemple deux WhatsApps) dans un seul Gateway en cours d’exécution. Les messages entrants sont acheminés vers le bon agent via des liaisons.

Ici, un **agent** est le périmètre complet propre à une persona : fichiers de workspace, profils d’authentification, registre de modèles et magasin de sessions. `agentDir` est le répertoire d’état sur disque qui contient cette configuration propre à l’agent dans `~/.openclaw/agents/<agentId>/`. Une **liaison** associe un compte de canal (par exemple un workspace Slack ou un numéro WhatsApp) à l’un de ces agents.

## Qu’est-ce qu’un « agent » ?

Un **agent** est un cerveau entièrement délimité avec ses propres éléments :

- **Workspace** (fichiers, AGENTS.md/SOUL.md/USER.md, notes locales, règles de persona).
- **Répertoire d’état** (`agentDir`) pour les profils d’authentification, le registre de modèles et la configuration propre à l’agent.
- **Magasin de sessions** (historique de chat + état de routage) sous `~/.openclaw/agents/<agentId>/sessions`.

Les profils d’authentification sont **propres à chaque agent**. Chaque agent lit les siens depuis :

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` est aussi ici le chemin de rappel intersessions le plus sûr : il renvoie une vue bornée et nettoyée, pas un vidage brut de transcription. Le rappel de l’assistant retire les balises de raisonnement, l’échafaudage `<relevant-memories>`, les charges utiles XML d’appels d’outils en texte brut (y compris `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` et les blocs d’appels d’outils tronqués), l’échafaudage d’appels d’outils dégradé, les jetons de contrôle de modèle ASCII/pleine chasse divulgués et le XML d’appel d’outil MiniMax mal formé avant masquage/troncature.
</Note>

<Warning>
Ne réutilisez jamais `agentDir` entre plusieurs agents (cela provoque des collisions d’authentification/de sessions). Les agents
peuvent lire les profils d’authentification de l’agent par défaut/principal lorsqu’ils n’ont pas
de profil local, mais OpenClaw ne clone pas les jetons d’actualisation OAuth dans le
magasin de l’agent secondaire. Si vous voulez un compte OAuth indépendant, connectez-vous depuis
cet agent ; si vous copiez les identifiants manuellement, copiez uniquement les profils statiques portables
`api_key` ou `token`.
</Warning>

Les Skills sont chargées depuis chaque workspace d’agent plus les racines partagées comme `~/.openclaw/skills`, puis filtrées par la liste d’autorisation effective des Skills de l’agent lorsqu’elle est configurée. Utilisez `agents.defaults.skills` pour une base partagée et `agents.list[].skills` pour un remplacement propre à l’agent. Voir [Skills : propres à l’agent ou partagées](/fr/tools/skills#per-agent-vs-shared-skills) et [Skills : listes d’autorisation des Skills d’agent](/fr/tools/skills#agent-skill-allowlists).

Le Gateway peut héberger **un agent** (par défaut) ou **plusieurs agents** côte à côte.

<Note>
**Note sur le workspace :** le workspace de chaque agent est le **cwd par défaut**, pas un bac à sable strict. Les chemins relatifs sont résolus dans le workspace, mais les chemins absolus peuvent atteindre d’autres emplacements de l’hôte sauf si le sandboxing est activé. Voir [Sandboxing](/fr/gateway/sandboxing).
</Note>

## Chemins (carte rapide)

- Configuration : `~/.openclaw/openclaw.json` (ou `OPENCLAW_CONFIG_PATH`)
- Répertoire d’état : `~/.openclaw` (ou `OPENCLAW_STATE_DIR`)
- Workspace : `~/.openclaw/workspace` (ou `~/.openclaw/workspace-<agentId>`)
- Répertoire d’agent : `~/.openclaw/agents/<agentId>/agent` (ou `agents.list[].agentDir`)
- Sessions : `~/.openclaw/agents/<agentId>/sessions`

### Mode agent unique (par défaut)

Si vous ne faites rien, OpenClaw exécute un seul agent :

- `agentId` vaut par défaut **`main`**.
- Les sessions sont indexées sous la forme `agent:main:<mainKey>`.
- Le workspace vaut par défaut `~/.openclaw/workspace` (ou `~/.openclaw/workspace-<profile>` lorsque `OPENCLAW_PROFILE` est défini).
- L’état vaut par défaut `~/.openclaw/agents/main/agent`.

## Assistant d’agent

Utilisez l’assistant d’agent pour ajouter un nouvel agent isolé :

```bash
openclaw agents add work
```

Ajoutez ensuite des `bindings` (ou laissez l’assistant le faire) pour router les messages entrants.

Vérifiez avec :

```bash
openclaw agents list --bindings
```

## Démarrage rapide

<Steps>
  <Step title="Create each agent workspace">
    Utilisez l’assistant ou créez les workspaces manuellement :

    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    Chaque agent reçoit son propre workspace avec `SOUL.md`, `AGENTS.md` et un `USER.md` facultatif, ainsi qu’un `agentDir` dédié et un magasin de sessions sous `~/.openclaw/agents/<agentId>`.

  </Step>
  <Step title="Create channel accounts">
    Créez un compte par agent sur vos canaux préférés :

    - Discord : un bot par agent, activez Message Content Intent, copiez chaque jeton.
    - Telegram : un bot par agent via BotFather, copiez chaque jeton.
    - WhatsApp : associez chaque numéro de téléphone par compte.

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    Voir les guides des canaux : [Discord](/fr/channels/discord), [Telegram](/fr/channels/telegram), [WhatsApp](/fr/channels/whatsapp).

  </Step>
  <Step title="Add agents, accounts, and bindings">
    Ajoutez les agents sous `agents.list`, les comptes de canaux sous `channels.<channel>.accounts`, puis connectez-les avec des `bindings` (exemples ci-dessous).
  </Step>
  <Step title="Restart and verify">
    ```bash
    openclaw gateway restart
    openclaw agents list --bindings
    openclaw channels status --probe
    ```
  </Step>
</Steps>

## Plusieurs agents = plusieurs personnes, plusieurs personnalités

Avec **plusieurs agents**, chaque `agentId` devient une **persona entièrement isolée** :

- **Numéros de téléphone/comptes différents** (`accountId` par canal).
- **Personnalités différentes** (fichiers de workspace propres à l’agent comme `AGENTS.md` et `SOUL.md`).
- **Authentification + sessions séparées** (aucun échange croisé sauf activation explicite).

Cela permet à **plusieurs personnes** de partager un même serveur Gateway tout en gardant leurs « cerveaux » d’IA et leurs données isolés.

## Recherche mémoire QMD entre agents

Si un agent doit rechercher dans les transcriptions de sessions QMD d’un autre agent, ajoutez des collections supplémentaires sous `agents.list[].memorySearch.qmd.extraCollections`. Utilisez `agents.defaults.memorySearch.qmd.extraCollections` uniquement lorsque chaque agent doit hériter des mêmes collections de transcriptions partagées.

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
            extraCollections: [{ path: "notes" }], // resolves inside workspace -> collection named "notes-main"
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

Le chemin de collection supplémentaire peut être partagé entre agents, mais le nom de collection reste explicite lorsque le chemin est situé hors du workspace de l’agent. Les chemins à l’intérieur du workspace restent limités à l’agent afin que chaque agent conserve son propre ensemble de recherche de transcriptions.

## Un numéro WhatsApp, plusieurs personnes (répartition des MP)

Vous pouvez router **différents MP WhatsApp** vers différents agents tout en restant sur **un seul compte WhatsApp**. Faites correspondre l’expéditeur E.164 (comme `+15551234567`) avec `peer.kind: "direct"`. Les réponses proviennent toujours du même numéro WhatsApp (pas d’identité d’expéditeur propre à chaque agent).

<Note>
Les chats directs se replient sur la **clé de session principale** de l’agent, donc une véritable isolation nécessite **un agent par personne**.
</Note>

Exemple :

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

Notes :

- Le contrôle d’accès aux MP est **global par compte WhatsApp** (appairage/liste d’autorisation), pas propre à chaque agent.
- Pour les groupes partagés, liez le groupe à un seul agent ou utilisez les [groupes de diffusion](/fr/channels/broadcast-groups).

## Règles de routage (comment les messages choisissent un agent)

Les liaisons sont **déterministes** et **la plus spécifique l’emporte** :

<Steps>
  <Step title="peer match">
    ID exact de MP/groupe/canal.
  </Step>
  <Step title="parentPeer match">
    Héritage de fil.
  </Step>
  <Step title="guildId + roles">
    Routage par rôle Discord.
  </Step>
  <Step title="guildId">
    Discord.
  </Step>
  <Step title="teamId">
    Slack.
  </Step>
  <Step title="accountId match for a channel">
    Repli par compte.
  </Step>
  <Step title="Channel-level match">
    `accountId: "*"`.
  </Step>
  <Step title="Default agent">
    Repli vers `agents.list[].default`, sinon la première entrée de la liste, par défaut : `main`.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Tie-breaking and AND semantics">
    - Si plusieurs liaisons correspondent au même niveau, la première dans l’ordre de configuration l’emporte.
    - Si une liaison définit plusieurs champs de correspondance (par exemple `peer` + `guildId`), tous les champs spécifiés sont requis (sémantique `AND`).

  </Accordion>
  <Accordion title="Account-scope detail">
    - Une liaison qui omet `accountId` correspond uniquement au compte par défaut.
    - Utilisez `accountId: "*"` comme repli à l’échelle du canal pour tous les comptes.
    - Si vous ajoutez plus tard la même liaison pour le même agent avec un identifiant de compte explicite, OpenClaw met à niveau la liaison existante limitée au canal vers une liaison limitée au compte au lieu de la dupliquer.

  </Accordion>
</AccordionGroup>

## Plusieurs comptes / numéros de téléphone

Les canaux qui prennent en charge **plusieurs comptes** (par exemple WhatsApp) utilisent `accountId` pour identifier chaque connexion. Chaque `accountId` peut être routé vers un agent différent, de sorte qu’un seul serveur peut héberger plusieurs numéros de téléphone sans mélanger les sessions.

Si vous voulez un compte par défaut à l’échelle du canal lorsque `accountId` est omis, définissez `channels.<channel>.defaultAccount` (facultatif). Lorsqu’il n’est pas défini, OpenClaw se replie sur `default` s’il est présent, sinon sur le premier identifiant de compte configuré (trié).

Les canaux courants qui prennent en charge ce modèle incluent :

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `zalo`, `zalouser`, `nostr`, `feishu`

## Concepts

- `agentId` : un « cerveau » (workspace, authentification propre à l’agent, magasin de sessions propre à l’agent).
- `accountId` : une instance de compte de canal (par exemple compte WhatsApp `"personal"` ou `"biz"`).
- `binding` : route les messages entrants vers un `agentId` par `(channel, accountId, peer)` et éventuellement des identifiants de guilde/d’équipe.
- Les chats directs se replient sur `agent:<agentId>:<mainKey>` (« principal » propre à l’agent ; `session.mainKey`).

## Exemples de plateformes

<AccordionGroup>
  <Accordion title="Discord bots per agent">
    Chaque compte de bot Discord correspond à un `accountId` unique. Liez chaque compte à un agent et gardez les listes d’autorisation propres à chaque bot.

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

    - Invitez chaque bot dans le serveur et activez Message Content Intent.
    - Les tokens se trouvent dans `channels.discord.accounts.<id>.token` (le compte par défaut peut utiliser `DISCORD_BOT_TOKEN`).

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

    - Créez un bot par agent avec BotFather et copiez chaque token.
    - Les tokens se trouvent dans `channels.telegram.accounts.<id>.botToken` (le compte par défaut peut utiliser `TELEGRAM_BOT_TOKEN`).

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

      // Deterministic routing: first match wins (most-specific first).
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

        // Optional per-peer override (example: send a specific group to work agent).
        {
          agentId: "work",
          match: {
            channel: "whatsapp",
            accountId: "personal",
            peer: { kind: "group", id: "1203630...@g.us" },
          },
        },
      ],

      // Off by default: agent-to-agent messaging must be explicitly enabled + allowlisted.
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
              // Optional override. Default: ~/.openclaw/credentials/whatsapp/personal
              // authDir: "~/.openclaw/credentials/whatsapp/personal",
            },
            biz: {
              // Optional override. Default: ~/.openclaw/credentials/whatsapp/biz
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
    Répartissez par canal : acheminez WhatsApp vers un agent rapide pour le quotidien et Telegram vers un agent Opus.

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
        { agentId: "chat", match: { channel: "whatsapp" } },
        { agentId: "opus", match: { channel: "telegram" } },
      ],
    }
    ```

    Notes :

    - Si vous avez plusieurs comptes pour un canal, ajoutez `accountId` à la liaison (par exemple `{ channel: "whatsapp", accountId: "personal" }`).
    - Pour acheminer un seul DM/groupe vers Opus tout en gardant le reste sur chat, ajoutez une liaison `match.peer` pour ce pair ; les correspondances de pair l’emportent toujours sur les règles à l’échelle du canal.

  </Tab>
  <Tab title="Même canal, un pair vers Opus">
    Gardez WhatsApp sur l’agent rapide, mais acheminez un DM vers Opus :

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
          match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551234567" } },
        },
        { agentId: "chat", match: { channel: "whatsapp" } },
      ],
    }
    ```

    Les liaisons de pair l’emportent toujours ; conservez-les donc au-dessus de la règle à l’échelle du canal.

  </Tab>
  <Tab title="Agent familial lié à un groupe WhatsApp">
    Liez un agent familial dédié à un seul groupe WhatsApp, avec filtrage par mention et une politique d’outils plus stricte :

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

    Notes :

    - Les listes d’autorisation/de refus d’outils sont des **outils**, pas des Skills. Si une Skill doit exécuter un binaire, assurez-vous que `exec` est autorisé et que le binaire existe dans le bac à sable.
    - Pour un filtrage plus strict, définissez `agents.list[].groupChat.mentionPatterns` et gardez les listes d’autorisation de groupes activées pour le canal.

  </Tab>
</Tabs>

## Configuration du bac à sable et des outils par agent

Chaque agent peut avoir son propre bac à sable et ses propres restrictions d’outils :

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // No sandbox for personal agent
        },
        // No tool restrictions - all tools available
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // Always sandboxed
          scope: "agent",  // One container per agent
          docker: {
            // Optional one-time setup after container creation
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // Only read tool
          deny: ["exec", "write", "edit", "apply_patch"],    // Deny others
        },
      },
    ],
  },
}
```

<Note>
`setupCommand` se trouve sous `sandbox.docker` et s’exécute une seule fois lors de la création du conteneur. Les substitutions `sandbox.docker.*` par agent sont ignorées lorsque le périmètre résolu est `"shared"`.
</Note>

**Avantages :**

- **Isolation de sécurité** : restreindre les outils pour les agents non approuvés.
- **Contrôle des ressources** : placer certains agents dans un bac à sable tout en gardant les autres sur l’hôte.
- **Politiques flexibles** : autorisations différentes par agent.

<Note>
`tools.elevated` est **global** et basé sur l’expéditeur ; il n’est pas configurable par agent. Si vous avez besoin de limites par agent, utilisez `agents.list[].tools` pour refuser `exec`. Pour le ciblage de groupe, utilisez `agents.list[].groupChat.mentionPatterns` afin que les @mentions correspondent clairement à l’agent prévu.
</Note>

Consultez [Bac à sable et outils multi-agent](/fr/tools/multi-agent-sandbox-tools) pour des exemples détaillés.

## Connexe

- [Agents ACP](/fr/tools/acp-agents) — exécuter des harnais de codage externes
- [Routage des canaux](/fr/channels/channel-routing) — comment les messages sont acheminés vers les agents
- [Présence](/fr/concepts/presence) — présence et disponibilité des agents
- [Session](/fr/concepts/session) — isolation et routage des sessions
- [Sous-agents](/fr/tools/subagents) — lancer des exécutions d’agents en arrière-plan
