---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'Routage multi-agent : agents isolés, comptes de canal et liaisons'
title: Routage multi-agent
x-i18n:
    generated_at: "2026-04-30T07:22:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67adea74d5f97feff3f816cc4c34c9429e7659289013e5a7c7623bd185a50a31
    source_path: concepts/multi-agent.md
    workflow: 16
---

Exécutez plusieurs agents _isolés_ — chacun avec son propre espace de travail, répertoire d’état (`agentDir`) et historique de session — ainsi que plusieurs comptes de canal (par exemple deux comptes WhatsApp) dans un seul Gateway en cours d’exécution. Les messages entrants sont routés vers le bon agent via des bindings.

Un **agent**, ici, correspond au périmètre complet d’une persona : fichiers de l’espace de travail, profils d’authentification, registre des modèles et stockage des sessions. `agentDir` est le répertoire d’état sur disque qui contient cette configuration propre à l’agent dans `~/.openclaw/agents/<agentId>/`. Un **binding** associe un compte de canal (par exemple un espace de travail Slack ou un numéro WhatsApp) à l’un de ces agents.

## Qu’est-ce qu’« un agent » ?

Un **agent** est un cerveau entièrement délimité, avec son propre :

- **Espace de travail** (fichiers, AGENTS.md/SOUL.md/USER.md, notes locales, règles de persona).
- **Répertoire d’état** (`agentDir`) pour les profils d’authentification, le registre des modèles et la configuration propre à l’agent.
- **Stockage des sessions** (historique de chat + état de routage) sous `~/.openclaw/agents/<agentId>/sessions`.

Les profils d’authentification sont **propres à chaque agent**. Chaque agent lit depuis son propre fichier :

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` est ici aussi le chemin de rappel intersessions le plus sûr : il renvoie une vue bornée et assainie, pas une extraction brute de transcript. Le rappel de l’assistant supprime les balises de réflexion, l’échafaudage `<relevant-memories>`, les charges utiles XML d’appels d’outils en texte brut (y compris `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` et les blocs d’appels d’outils tronqués), l’échafaudage d’appels d’outils déclassé, les jetons de contrôle de modèle ASCII/pleine chasse divulgués et le XML d’appels d’outils MiniMax mal formé avant la suppression des informations sensibles et la troncature.
</Note>

<Warning>
Ne réutilisez jamais `agentDir` entre plusieurs agents (cela provoque des collisions d’authentification et de session). Les agents
peuvent lire les profils d’authentification de l’agent par défaut/principal lorsqu’ils n’ont pas
de profil local, mais OpenClaw ne clone pas les jetons de rafraîchissement OAuth dans le
stockage de l’agent secondaire. Si vous voulez un compte OAuth indépendant, connectez-vous depuis
cet agent ; si vous copiez des identifiants manuellement, copiez uniquement les profils statiques portables
`api_key` ou `token`.
</Warning>

Les Skills sont chargées depuis chaque espace de travail d’agent ainsi que depuis les racines partagées comme `~/.openclaw/skills`, puis filtrées par la liste d’autorisation effective des compétences de l’agent lorsqu’elle est configurée. Utilisez `agents.defaults.skills` pour une base partagée et `agents.list[].skills` pour un remplacement propre à l’agent. Consultez [Skills : par agent ou partagées](/fr/tools/skills#per-agent-vs-shared-skills) et [Skills : listes d’autorisation des compétences d’agent](/fr/tools/skills#agent-skill-allowlists).

Le Gateway peut héberger **un agent** (par défaut) ou **plusieurs agents** côte à côte.

<Note>
**Note sur l’espace de travail :** l’espace de travail de chaque agent est le **cwd par défaut**, pas un sandbox strict. Les chemins relatifs se résolvent à l’intérieur de l’espace de travail, mais les chemins absolus peuvent atteindre d’autres emplacements de l’hôte sauf si le sandboxing est activé. Consultez [Sandboxing](/fr/gateway/sandboxing).
</Note>

## Chemins (carte rapide)

- Configuration : `~/.openclaw/openclaw.json` (ou `OPENCLAW_CONFIG_PATH`)
- Répertoire d’état : `~/.openclaw` (ou `OPENCLAW_STATE_DIR`)
- Espace de travail : `~/.openclaw/workspace` (ou `~/.openclaw/workspace-<agentId>`)
- Répertoire de l’agent : `~/.openclaw/agents/<agentId>/agent` (ou `agents.list[].agentDir`)
- Sessions : `~/.openclaw/agents/<agentId>/sessions`

### Mode agent unique (par défaut)

Si vous ne faites rien, OpenClaw exécute un seul agent :

- `agentId` vaut **`main`** par défaut.
- Les sessions sont indexées sous la forme `agent:main:<mainKey>`.
- L’espace de travail vaut `~/.openclaw/workspace` par défaut (ou `~/.openclaw/workspace-<profile>` quand `OPENCLAW_PROFILE` est défini).
- L’état vaut `~/.openclaw/agents/main/agent` par défaut.

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
  <Step title="Créer chaque espace de travail d’agent">
    Utilisez l’assistant ou créez les espaces de travail manuellement :

    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    Chaque agent obtient son propre espace de travail avec `SOUL.md`, `AGENTS.md` et éventuellement `USER.md`, ainsi qu’un `agentDir` dédié et un stockage de sessions sous `~/.openclaw/agents/<agentId>`.

  </Step>
  <Step title="Créer les comptes de canal">
    Créez un compte par agent sur vos canaux préférés :

    - Discord : un bot par agent, activez Message Content Intent, copiez chaque jeton.
    - Telegram : un bot par agent via BotFather, copiez chaque jeton.
    - WhatsApp : associez chaque numéro de téléphone par compte.

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    Consultez les guides de canaux : [Discord](/fr/channels/discord), [Telegram](/fr/channels/telegram), [WhatsApp](/fr/channels/whatsapp).

  </Step>
  <Step title="Ajouter les agents, les comptes et les bindings">
    Ajoutez les agents sous `agents.list`, les comptes de canal sous `channels.<channel>.accounts`, puis connectez-les avec `bindings` (exemples ci-dessous).
  </Step>
  <Step title="Redémarrer et vérifier">
    ```bash
    openclaw gateway restart
    openclaw agents list --bindings
    openclaw channels status --probe
    ```
  </Step>
</Steps>

## Plusieurs agents = plusieurs personnes, plusieurs personnalités

Avec **plusieurs agents**, chaque `agentId` devient une **persona entièrement isolée** :

- **Numéros de téléphone/comptes différents** (par `accountId` de canal).
- **Personnalités différentes** (fichiers d’espace de travail propres à l’agent comme `AGENTS.md` et `SOUL.md`).
- **Authentification + sessions séparées** (aucune communication croisée sauf activation explicite).

Cela permet à **plusieurs personnes** de partager un seul serveur Gateway tout en gardant leurs « cerveaux » d’IA et leurs données isolés.

## Recherche de mémoire QMD interagents

Si un agent doit rechercher dans les transcripts de session QMD d’un autre agent, ajoutez des collections supplémentaires sous `agents.list[].memorySearch.qmd.extraCollections`. Utilisez `agents.defaults.memorySearch.qmd.extraCollections` uniquement lorsque chaque agent doit hériter des mêmes collections de transcripts partagées.

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

Le chemin de collection supplémentaire peut être partagé entre agents, mais le nom de la collection reste explicite lorsque le chemin est en dehors de l’espace de travail de l’agent. Les chemins situés dans l’espace de travail restent propres à l’agent afin que chaque agent conserve son propre ensemble de recherche de transcripts.

## Un numéro WhatsApp, plusieurs personnes (séparation des DM)

Vous pouvez router **différents DM WhatsApp** vers différents agents tout en restant sur **un seul compte WhatsApp**. Faites correspondre l’expéditeur E.164 (comme `+15551234567`) avec `peer.kind: "direct"`. Les réponses proviennent toujours du même numéro WhatsApp (pas d’identité d’expéditeur propre à l’agent).

<Note>
Les chats directs se replient sur la **clé de session principale** de l’agent ; une véritable isolation nécessite donc **un agent par personne**.
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

- Le contrôle d’accès aux DM est **global par compte WhatsApp** (appairage/liste d’autorisation), pas par agent.
- Pour les groupes partagés, associez le groupe à un seul agent ou utilisez [Groupes de diffusion](/fr/channels/broadcast-groups).

## Règles de routage (comment les messages choisissent un agent)

Les bindings sont **déterministes** et **le plus spécifique l’emporte** :

<Steps>
  <Step title="Correspondance peer">
    Identifiant exact de DM/groupe/canal.
  </Step>
  <Step title="Correspondance parentPeer">
    Héritage de thread.
  </Step>
  <Step title="guildId + rôles">
    Routage par rôle Discord.
  </Step>
  <Step title="guildId">
    Discord.
  </Step>
  <Step title="teamId">
    Slack.
  </Step>
  <Step title="Correspondance accountId pour un canal">
    Repli par compte.
  </Step>
  <Step title="Correspondance au niveau du canal">
    `accountId: "*"`.
  </Step>
  <Step title="Agent par défaut">
    Repli vers `agents.list[].default`, sinon première entrée de liste, par défaut : `main`.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Départage et sémantique AND">
    - Si plusieurs bindings correspondent au même niveau, le premier dans l’ordre de configuration l’emporte.
    - Si un binding définit plusieurs champs de correspondance (par exemple `peer` + `guildId`), tous les champs spécifiés sont requis (sémantique `AND`).

  </Accordion>
  <Accordion title="Détail de portée du compte">
    - Un binding qui omet `accountId` correspond uniquement au compte par défaut.
    - Utilisez `accountId: "*"` pour un repli à l’échelle du canal sur tous les comptes.
    - Si vous ajoutez plus tard le même binding pour le même agent avec un identifiant de compte explicite, OpenClaw met à niveau le binding existant limité au canal vers une portée de compte au lieu de le dupliquer.

  </Accordion>
</AccordionGroup>

## Plusieurs comptes / numéros de téléphone

Les canaux qui prennent en charge **plusieurs comptes** (par exemple WhatsApp) utilisent `accountId` pour identifier chaque connexion. Chaque `accountId` peut être routé vers un agent différent, ce qui permet à un seul serveur d’héberger plusieurs numéros de téléphone sans mélanger les sessions.

Si vous voulez un compte par défaut à l’échelle du canal lorsque `accountId` est omis, définissez `channels.<channel>.defaultAccount` (facultatif). S’il n’est pas défini, OpenClaw se replie sur `default` s’il est présent, sinon sur le premier identifiant de compte configuré (trié).

Les canaux courants qui prennent en charge ce modèle incluent :

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `bluebubbles`, `zalo`, `zalouser`, `nostr`, `feishu`

## Concepts

- `agentId` : un « cerveau » (espace de travail, authentification propre à l’agent, stockage de sessions propre à l’agent).
- `accountId` : une instance de compte de canal (par exemple le compte WhatsApp `"personal"` par rapport à `"biz"`).
- `binding` : route les messages entrants vers un `agentId` par `(channel, accountId, peer)` et éventuellement par identifiants de serveur/équipe.
- Les chats directs se replient sur `agent:<agentId>:<mainKey>` (« main » propre à l’agent ; `session.mainKey`).

## Exemples de plateformes

<AccordionGroup>
  <Accordion title="Bots Discord par agent">
    Chaque compte de bot Discord correspond à un `accountId` unique. Associez chaque compte à un agent et conservez les listes d’autorisation par bot.

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

    - Invitez chaque bot dans la guilde et activez l’Intent de contenu des messages.
    - Les jetons se trouvent dans `channels.discord.accounts.<id>.token` (le compte par défaut peut utiliser `DISCORD_BOT_TOKEN`).

  </Accordion>
  <Accordion title="Telegram bots per agent">
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

  </Accordion>
  <Accordion title="WhatsApp numbers per agent">
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
  <Tab title="WhatsApp daily + Telegram deep work">
    Séparez par canal : routez WhatsApp vers un agent quotidien rapide et Telegram vers un agent Opus.

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

    Remarques :

    - Si vous avez plusieurs comptes pour un canal, ajoutez `accountId` à l’association (par exemple `{ channel: "whatsapp", accountId: "personal" }`).
    - Pour router un seul message direct/groupe vers Opus tout en gardant le reste sur chat, ajoutez une association `match.peer` pour ce pair ; les correspondances de pair priment toujours sur les règles à l’échelle du canal.

  </Tab>
  <Tab title="Same channel, one peer to Opus">
    Gardez WhatsApp sur l’agent rapide, mais routez un message direct vers Opus :

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

    Les associations de pair priment toujours, gardez-les donc au-dessus de la règle à l’échelle du canal.

  </Tab>
  <Tab title="Family agent bound to a WhatsApp group">
    Associez un agent familial dédié à un seul groupe WhatsApp, avec un filtrage par mention et une politique d’outils plus stricte :

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

    Remarques :

    - Les listes d’autorisation/refus d’outils concernent les **outils**, pas les Skills. Si une Skill doit exécuter un binaire, assurez-vous que `exec` est autorisé et que le binaire existe dans le sandbox.
    - Pour un filtrage plus strict, définissez `agents.list[].groupChat.mentionPatterns` et gardez les listes d’autorisation de groupe activées pour le canal.

  </Tab>
</Tabs>

## Configuration du sandbox et des outils par agent

Chaque agent peut avoir ses propres restrictions de sandbox et d’outils :

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
`setupCommand` se trouve sous `sandbox.docker` et s’exécute une fois lors de la création du conteneur. Les substitutions `sandbox.docker.*` par agent sont ignorées lorsque la portée résolue est `"shared"`.
</Note>

**Avantages :**

- **Isolation de sécurité** : restreignez les outils pour les agents non approuvés.
- **Contrôle des ressources** : placez certains agents dans un sandbox tout en gardant les autres sur l’hôte.
- **Politiques flexibles** : permissions différentes par agent.

<Note>
`tools.elevated` est **global** et basé sur l’expéditeur ; il n’est pas configurable par agent. Si vous avez besoin de limites par agent, utilisez `agents.list[].tools` pour refuser `exec`. Pour le ciblage de groupe, utilisez `agents.list[].groupChat.mentionPatterns` afin que les @mentions correspondent clairement à l’agent prévu.
</Note>

Consultez [Sandbox et outils multi-agent](/fr/tools/multi-agent-sandbox-tools) pour des exemples détaillés.

## Connexe

- [Agents ACP](/fr/tools/acp-agents) — exécution de harnais de codage externes
- [Routage des canaux](/fr/channels/channel-routing) — comment les messages sont routés vers les agents
- [Présence](/fr/concepts/presence) — présence et disponibilité des agents
- [Session](/fr/concepts/session) — isolation et routage des sessions
- [Sous-agents](/fr/tools/subagents) — lancement d’exécutions d’agents en arrière-plan
