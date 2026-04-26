---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'Routage multi-agent : agents isolés, comptes de canal et liaisons'
title: Routage multi-agent
x-i18n:
    generated_at: "2026-04-26T11:27:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 845149ac1076d4746cc5038bd4444c2fc6117710f724b8cabdc31dc9ef6abbe8
    source_path: concepts/multi-agent.md
    workflow: 15
---

Exécutez plusieurs agents _isolés_ — chacun avec son propre espace de travail, répertoire d’état (`agentDir`) et historique de session — ainsi que plusieurs comptes de canal (par ex. deux comptes WhatsApp) dans une seule Gateway en cours d’exécution. Les messages entrants sont acheminés vers le bon agent via des liaisons.

Un **agent** ici correspond à tout le périmètre d’une persona : fichiers d’espace de travail, profils d’authentification, registre de modèles et magasin de sessions. `agentDir` est le répertoire d’état sur disque qui contient cette configuration par agent dans `~/.openclaw/agents/<agentId>/`. Une **liaison** associe un compte de canal (par ex. un espace de travail Slack ou un numéro WhatsApp) à l’un de ces agents.

## Qu’est-ce que « un agent » ?

Un **agent** est un cerveau entièrement délimité avec son propre :

- **Espace de travail** (fichiers, AGENTS.md/SOUL.md/USER.md, notes locales, règles de persona).
- **Répertoire d’état** (`agentDir`) pour les profils d’authentification, le registre de modèles et la configuration par agent.
- **Magasin de sessions** (historique de chat + état de routage) sous `~/.openclaw/agents/<agentId>/sessions`.

Les profils d’authentification sont **par agent**. Chaque agent lit depuis son propre :

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` est aussi ici le chemin de rappel inter-session le plus sûr : il renvoie une vue bornée et nettoyée, pas un vidage brut de transcription. Le rappel de l’assistant retire les balises de réflexion, l’échafaudage `<relevant-memories>`, les charges utiles XML d’appels d’outils en texte brut (y compris `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` et les blocs tronqués d’appels d’outils), l’échafaudage dégradé des appels d’outils, les jetons de contrôle de modèle ASCII/pleine largeur divulgués, et le XML mal formé d’appels d’outils MiniMax avant expurgation/troncature.
</Note>

<Warning>
Les identifiants d’accès de l’agent principal **ne** sont **pas** partagés automatiquement. Ne réutilisez jamais `agentDir` entre agents (cela provoque des collisions d’authentification/session). Si vous voulez partager des identifiants, copiez `auth-profiles.json` dans l’`agentDir` de l’autre agent.
</Warning>

Les Skills sont chargés depuis l’espace de travail de chaque agent plus des racines partagées comme `~/.openclaw/skills`, puis filtrés par la liste d’autorisation effective des Skills de l’agent lorsqu’elle est configurée. Utilisez `agents.defaults.skills` pour une base partagée et `agents.list[].skills` pour un remplacement par agent. Voir [Skills : par agent vs partagés](/fr/tools/skills#per-agent-vs-shared-skills) et [Skills : listes d’autorisation des Skills d’agent](/fr/tools/skills#agent-skill-allowlists).

La Gateway peut héberger **un agent** (par défaut) ou **plusieurs agents** côte à côte.

<Note>
**Remarque sur l’espace de travail :** l’espace de travail de chaque agent est le **cwd par défaut**, pas un sandbox strict. Les chemins relatifs se résolvent dans l’espace de travail, mais les chemins absolus peuvent atteindre d’autres emplacements de l’hôte sauf si le sandboxing est activé. Voir [Sandboxing](/fr/gateway/sandboxing).
</Note>

## Chemins (carte rapide)

- Config : `~/.openclaw/openclaw.json` (ou `OPENCLAW_CONFIG_PATH`)
- Répertoire d’état : `~/.openclaw` (ou `OPENCLAW_STATE_DIR`)
- Espace de travail : `~/.openclaw/workspace` (ou `~/.openclaw/workspace-<agentId>`)
- Répertoire d’agent : `~/.openclaw/agents/<agentId>/agent` (ou `agents.list[].agentDir`)
- Sessions : `~/.openclaw/agents/<agentId>/sessions`

### Mode agent unique (par défaut)

Si vous ne faites rien, OpenClaw exécute un seul agent :

- `agentId` vaut par défaut **`main`**.
- Les sessions sont saisies sous la forme `agent:main:<mainKey>`.
- L’espace de travail vaut par défaut `~/.openclaw/workspace` (ou `~/.openclaw/workspace-<profile>` lorsque `OPENCLAW_PROFILE` est défini).
- L’état vaut par défaut `~/.openclaw/agents/main/agent`.

## Assistant d’agent

Utilisez l’assistant d’agent pour ajouter un nouvel agent isolé :

```bash
openclaw agents add work
```

Ajoutez ensuite des `bindings` (ou laissez l’assistant le faire) pour acheminer les messages entrants.

Vérifiez avec :

```bash
openclaw agents list --bindings
```

## Démarrage rapide

<Steps>
  <Step title="Créer chaque espace de travail d’agent">
    Utilisez l’assistant ou créez les espaces de travail manuellement :

    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    Chaque agent reçoit son propre espace de travail avec `SOUL.md`, `AGENTS.md` et éventuellement `USER.md`, ainsi qu’un `agentDir` dédié et un magasin de sessions sous `~/.openclaw/agents/<agentId>`.

  </Step>
  <Step title="Créer des comptes de canal">
    Créez un compte par agent sur vos canaux préférés :

    - Discord : un bot par agent, activez Message Content Intent, copiez chaque token.
    - Telegram : un bot par agent via BotFather, copiez chaque token.
    - WhatsApp : associez chaque numéro de téléphone par compte.

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    Voir les guides de canal : [Discord](/fr/channels/discord), [Telegram](/fr/channels/telegram), [WhatsApp](/fr/channels/whatsapp).

  </Step>
  <Step title="Ajouter les agents, comptes et liaisons">
    Ajoutez les agents sous `agents.list`, les comptes de canal sous `channels.<channel>.accounts`, et reliez-les avec `bindings` (exemples ci-dessous).
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

Avec **plusieurs agents**, chaque `agentId` devient une **persona entièrement isolée** :

- **Différents numéros de téléphone/comptes** (par `accountId` de canal).
- **Différentes personnalités** (via des fichiers d’espace de travail par agent comme `AGENTS.md` et `SOUL.md`).
- **Authentification + sessions séparées** (aucun échange croisé sauf activation explicite).

Cela permet à **plusieurs personnes** de partager un serveur Gateway tout en gardant leurs « cerveaux » IA et leurs données isolés.

## Recherche mémoire QMD inter-agent

Si un agent doit rechercher dans les transcriptions de session QMD d’un autre agent, ajoutez des collections supplémentaires sous `agents.list[].memorySearch.qmd.extraCollections`. Utilisez `agents.defaults.memorySearch.qmd.extraCollections` uniquement lorsque chaque agent doit hériter des mêmes collections de transcriptions partagées.

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

Le chemin de collection supplémentaire peut être partagé entre agents, mais le nom de collection reste explicite lorsque le chemin est en dehors de l’espace de travail de l’agent. Les chemins à l’intérieur de l’espace de travail restent circonscrits à l’agent afin que chaque agent conserve son propre ensemble de recherche de transcriptions.

## Un numéro WhatsApp, plusieurs personnes (répartition DM)

Vous pouvez acheminer **différents DM WhatsApp** vers différents agents tout en restant sur **un seul compte WhatsApp**. Faites la correspondance sur l’E.164 de l’expéditeur (comme `+15551234567`) avec `peer.kind: "direct"`. Les réponses continuent toutefois à provenir du même numéro WhatsApp (pas d’identité d’expéditeur par agent).

<Note>
Les discussions directes se rabattent sur la **clé de session principale** de l’agent, donc une véritable isolation nécessite **un agent par personne**.
</Note>

Exemple :

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

Remarques :

- Le contrôle d’accès DM est **global par compte WhatsApp** (appairage/allowlist), pas par agent.
- Pour les groupes partagés, liez le groupe à un agent ou utilisez [Groupes de diffusion](/fr/channels/broadcast-groups).

## Règles de routage (comment les messages choisissent un agent)

Les liaisons sont **déterministes** et **la plus spécifique l’emporte** :

<Steps>
  <Step title="Correspondance peer">
    ID exact de DM/groupe/canal.
  </Step>
  <Step title="Correspondance parentPeer">
    Héritage de fil.
  </Step>
  <Step title="guildId + rôles">
    Routage par rôles Discord.
  </Step>
  <Step title="guildId">
    Discord.
  </Step>
  <Step title="teamId">
    Slack.
  </Step>
  <Step title="Correspondance accountId pour un canal">
    Secours par compte.
  </Step>
  <Step title="Correspondance au niveau du canal">
    `accountId: "*"`.
  </Step>
  <Step title="Agent par défaut">
    Secours vers `agents.list[].default`, sinon la première entrée de la liste, par défaut : `main`.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Départage et sémantique AND">
    - Si plusieurs liaisons correspondent dans le même niveau, la première dans l’ordre de configuration l’emporte.
    - Si une liaison définit plusieurs champs de correspondance (par exemple `peer` + `guildId`), tous les champs spécifiés sont requis (sémantique `AND`).
  </Accordion>
  <Accordion title="Détail du périmètre de compte">
    - Une liaison qui omet `accountId` correspond uniquement au compte par défaut.
    - Utilisez `accountId: "*"` pour un secours à l’échelle du canal sur tous les comptes.
    - Si vous ajoutez ensuite la même liaison pour le même agent avec un identifiant de compte explicite, OpenClaw fait évoluer la liaison existante limitée au canal vers un périmètre de compte au lieu de la dupliquer.
  </Accordion>
</AccordionGroup>

## Plusieurs comptes / numéros de téléphone

Les canaux qui prennent en charge **plusieurs comptes** (par ex. WhatsApp) utilisent `accountId` pour identifier chaque connexion. Chaque `accountId` peut être routé vers un agent différent, de sorte qu’un seul serveur puisse héberger plusieurs numéros de téléphone sans mélanger les sessions.

Si vous voulez un compte par défaut à l’échelle du canal lorsque `accountId` est omis, définissez `channels.<channel>.defaultAccount` (facultatif). S’il n’est pas défini, OpenClaw se rabat sur `default` s’il est présent, sinon sur le premier identifiant de compte configuré (trié).

Les canaux courants prenant en charge ce modèle incluent :

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `bluebubbles`, `zalo`, `zalouser`, `nostr`, `feishu`

## Concepts

- `agentId` : un « cerveau » (espace de travail, authentification par agent, magasin de sessions par agent).
- `accountId` : une instance de compte de canal (par ex. compte WhatsApp `"personal"` vs `"biz"`).
- `binding` : achemine les messages entrants vers un `agentId` par `(channel, accountId, peer)` et éventuellement des identifiants guild/team.
- Les discussions directes se rabattent sur `agent:<agentId>:<mainKey>` (principal par agent ; `session.mainKey`).

## Exemples de plateforme

<AccordionGroup>
  <Accordion title="Bots Discord par agent">
    Chaque compte bot Discord est associé à un `accountId` unique. Liez chaque compte à un agent et conservez des allowlists par bot.

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

    - Invitez chaque bot dans la guilde et activez Message Content Intent.
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
    Liez chaque compte avant de démarrer la gateway :

    ```bash
    openclaw channels login --channel whatsapp --account personal
    openclaw channels login --channel whatsapp --account biz
    ```

    `~/.openclaw/openclaw.json` (JSON5) :

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

      // Routage déterministe : la première correspondance l’emporte (la plus spécifique d’abord).
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

        // Remplacement facultatif par pair (exemple : envoyer un groupe spécifique à l’agent work).
        {
          agentId: "work",
          match: {
            channel: "whatsapp",
            accountId: "personal",
            peer: { kind: "group", id: "1203630...@g.us" },
          },
        },
      ],

      // Désactivé par défaut : la messagerie d’agent à agent doit être explicitement activée + mise en allowlist.
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
              // Remplacement facultatif. Par défaut : ~/.openclaw/credentials/whatsapp/personal
              // authDir: "~/.openclaw/credentials/whatsapp/personal",
            },
            biz: {
              // Remplacement facultatif. Par défaut : ~/.openclaw/credentials/whatsapp/biz
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
  <Tab title="WhatsApp quotidien + travail approfondi Telegram">
    Répartir par canal : acheminer WhatsApp vers un agent rapide du quotidien et Telegram vers un agent Opus.

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

    Remarques :

    - Si vous avez plusieurs comptes pour un canal, ajoutez `accountId` à la liaison (par exemple `{ channel: "whatsapp", accountId: "personal" }`).
    - Pour acheminer un seul DM/groupe vers Opus tout en gardant le reste sur chat, ajoutez une liaison `match.peer` pour ce pair ; les correspondances de pair l’emportent toujours sur les règles globales du canal.

  </Tab>
  <Tab title="Même canal, un pair vers Opus">
    Gardez WhatsApp sur l’agent rapide, mais acheminez un DM vers Opus :

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

    Les liaisons de pair l’emportent toujours, alors placez-les au-dessus de la règle globale du canal.

  </Tab>
  <Tab title="Agent familial lié à un groupe WhatsApp">
    Liez un agent familial dédié à un seul groupe WhatsApp, avec filtrage par mention et politique d’outils plus stricte :

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

    Remarques :

    - Les listes allow/deny d’outils concernent les **outils**, pas les Skills. Si un Skill doit exécuter un binaire, assurez-vous que `exec` est autorisé et que le binaire existe dans le sandbox.
    - Pour un filtrage plus strict, définissez `agents.list[].groupChat.mentionPatterns` et gardez les allowlists de groupe activées pour le canal.

  </Tab>
</Tabs>

## Configuration sandbox et outils par agent

Chaque agent peut avoir ses propres restrictions sandbox et outils :

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // Pas de sandbox pour l’agent personnel
        },
        // Pas de restrictions d’outils - tous les outils sont disponibles
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // Toujours dans un sandbox
          scope: "agent",  // Un conteneur par agent
          docker: {
            // Configuration facultative exécutée une seule fois après la création du conteneur
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // Outil read uniquement
          deny: ["exec", "write", "edit", "apply_patch"],    // Refuser les autres
        },
      },
    ],
  },
}
```

<Note>
`setupCommand` se trouve sous `sandbox.docker` et s’exécute une fois à la création du conteneur. Les remplacements `sandbox.docker.*` par agent sont ignorés lorsque le périmètre résolu est `"shared"`.
</Note>

**Avantages :**

- **Isolation de sécurité** : restreindre les outils pour les agents non fiables.
- **Contrôle des ressources** : mettre certains agents en sandbox tout en gardant les autres sur l’hôte.
- **Politiques flexibles** : permissions différentes par agent.

<Note>
`tools.elevated` est **global** et basé sur l’expéditeur ; il n’est pas configurable par agent. Si vous avez besoin de frontières par agent, utilisez `agents.list[].tools` pour refuser `exec`. Pour le ciblage de groupe, utilisez `agents.list[].groupChat.mentionPatterns` afin que les @mentions correspondent proprement à l’agent visé.
</Note>

Voir [Sandbox et outils multi-agent](/fr/tools/multi-agent-sandbox-tools) pour des exemples détaillés.

## Lié

- [Agents ACP](/fr/tools/acp-agents) — exécuter des harnais de code externes
- [Routage des canaux](/fr/channels/channel-routing) — comment les messages sont acheminés vers les agents
- [Présence](/fr/concepts/presence) — présence et disponibilité de l’agent
- [Session](/fr/concepts/session) — isolation et routage de session
- [Sous-agents](/fr/tools/subagents) — lancer des exécutions d’agent en arrière-plan
