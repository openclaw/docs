---
read_when:
    - Exécuter des harnais de codage via ACP
    - Configurer des sessions ACP liées à une conversation sur les canaux de messagerie
    - Liaison d’une conversation de canal de messagerie à une session ACP persistante
    - Dépannage du backend ACP, du câblage du Plugin ou de la livraison des complétions
    - Utiliser les commandes /acp depuis le chat
sidebarTitle: ACP agents
summary: Exécuter des harnais de codage externes (Claude Code, Cursor, Gemini CLI, Codex ACP explicite, OpenClaw ACP, OpenCode) via le backend ACP
title: Agents ACP
x-i18n:
    generated_at: "2026-05-07T13:27:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: e5cdb853d2cec2c7466fff5f1e046b38bf9bac8b2b62f208ad3465a666272631
    source_path: tools/acp-agents.md
    workflow: 16
---

[Les sessions Agent Client Protocol (ACP)](https://agentclientprotocol.com/)
permettent à OpenClaw d’exécuter des environnements de codage externes (par exemple Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI, et d’autres
environnements ACPX pris en charge) via un Plugin de backend ACP.

Chaque création de session ACP est suivie comme une [tâche en arrière-plan](/fr/automation/tasks).

<Note>
**ACP est le chemin des environnements externes, pas le chemin Codex par défaut.** Le
Plugin de serveur d’application Codex natif possède les contrôles `/codex ...` et le
runtime intégré `agentRuntime.id: "codex"` ; ACP possède
les contrôles `/acp ...` et les sessions `sessions_spawn({ runtime: "acp" })`.

Si vous voulez que Codex ou Claude Code se connecte comme client MCP externe
directement à des conversations de canal OpenClaw existantes, utilisez
[`openclaw mcp serve`](/fr/cli/mcp) plutôt qu’ACP.
</Note>

## Quelle page me faut-il ?

| Vous voulez…                                                                                    | Utilisez ceci                         | Notes                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lier ou contrôler Codex dans la conversation actuelle                                           | `/codex bind`, `/codex threads`       | Chemin du serveur d’application Codex natif lorsque le Plugin `codex` est activé ; inclut les réponses de chat liées, le transfert d’images, le modèle/rapide/autorisations, l’arrêt et les contrôles de pilotage. ACP est un repli explicite |
| Exécuter Claude Code, Gemini CLI, Codex ACP explicite ou un autre environnement externe _via_ OpenClaw | Cette page                            | Sessions liées au chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tâches en arrière-plan, contrôles de runtime                                                                                   |
| Exposer une session OpenClaw Gateway _comme_ serveur ACP pour un éditeur ou un client           | [`openclaw acp`](/fr/cli/acp)            | Mode pont. L’IDE/client parle ACP à OpenClaw via stdio/WebSocket                                                                                                                            |
| Réutiliser une CLI d’IA locale comme modèle de repli en texte seul                              | [Backends CLI](/fr/gateway/cli-backends) | Pas ACP. Aucun outil OpenClaw, aucun contrôle ACP, aucun runtime d’environnement                                                                                                                               |

## Cela fonctionne-t-il immédiatement ?

Oui, après l’installation du Plugin officiel de runtime ACP :

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Les extractions de source peuvent utiliser le Plugin d’espace de travail local `extensions/acpx` après
`pnpm install`. Exécutez `/acp doctor` pour vérifier l’état de préparation.

OpenClaw n’enseigne aux agents la création ACP que lorsque ACP est **réellement
utilisable** : ACP doit être activé, la répartition ne doit pas être désactivée, la session
actuelle ne doit pas être bloquée par le sandbox, et un backend de runtime doit être
chargé. Si ces conditions ne sont pas remplies, les Skills du Plugin ACP et les indications
ACP de `sessions_spawn` restent masquées afin que l’agent ne suggère pas
un backend indisponible.

<AccordionGroup>
  <Accordion title="Pièges de la première exécution">
    - Si `plugins.allow` est défini, il s’agit d’un inventaire de Plugins restrictif et il **doit** inclure `acpx` ; sinon le backend ACP installé est intentionnellement bloqué et `/acp doctor` signale l’entrée de liste d’autorisation manquante.
    - L’adaptateur ACP Codex est préparé avec le Plugin `acpx` et lancé localement lorsque c’est possible.
    - Codex ACP s’exécute avec un `CODEX_HOME` isolé ; OpenClaw copie uniquement les entrées de projet fiables depuis la configuration Codex de l’hôte et approuve l’espace de travail actif, en laissant l’authentification, les notifications et les hooks sur la configuration de l’hôte.
    - D’autres adaptateurs d’environnements cibles peuvent encore être récupérés à la demande avec `npx` la première fois que vous les utilisez.
    - L’authentification du fournisseur doit toujours exister sur l’hôte pour cet environnement.
    - Si l’hôte n’a pas accès à npm ou au réseau, les récupérations d’adaptateur de première exécution échouent jusqu’à ce que les caches soient préchauffés ou que l’adaptateur soit installé autrement.

  </Accordion>
  <Accordion title="Prérequis du runtime">
    ACP lance un véritable processus d’environnement externe. OpenClaw possède le routage,
    l’état des tâches en arrière-plan, la livraison, les liaisons et la politique ; l’environnement
    possède sa connexion fournisseur, son catalogue de modèles, son comportement de système de fichiers et
    ses outils natifs.

    Avant d’incriminer OpenClaw, vérifiez :

    - `/acp doctor` signale un backend activé et sain.
    - L’id cible est autorisé par `acp.allowedAgents` lorsque cette liste d’autorisation est définie.
    - La commande de l’environnement peut démarrer sur l’hôte Gateway.
    - L’authentification du fournisseur est présente pour cet environnement (`claude`, `codex`, `gemini`, `opencode`, `droid`, etc.).
    - Le modèle sélectionné existe pour cet environnement - les ids de modèles ne sont pas portables entre les environnements.
    - Le `cwd` demandé existe et est accessible, ou omettez `cwd` et laissez le backend utiliser sa valeur par défaut.
    - Le mode d’autorisation correspond au travail. Les sessions non interactives ne peuvent pas cliquer sur les invites d’autorisation natives ; les exécutions de codage qui écrivent/exécutent beaucoup nécessitent donc généralement un profil d’autorisation ACPX capable de progresser sans interface.

  </Accordion>
</AccordionGroup>

Les outils du Plugin OpenClaw et les outils OpenClaw intégrés ne sont **pas** exposés aux
environnements ACP par défaut. Activez les ponts MCP explicites dans
[Agents ACP - configuration](/fr/tools/acp-agents-setup) uniquement lorsque l’environnement
doit appeler ces outils directement.

## Cibles d’environnement prises en charge

Avec le backend `acpx`, utilisez ces ids d’environnement comme cibles `/acp spawn <id>`
ou `sessions_spawn({ runtime: "acp", agentId: "<id>" })` :

| Id d’environnement | Backend typique                              | Notes                                                                               |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Adaptateur ACP Claude Code                     | Nécessite l’authentification Claude Code sur l’hôte.                                              |
| `codex`    | Adaptateur ACP Codex                           | Repli ACP explicite uniquement lorsque `/codex` natif est indisponible ou qu’ACP est demandé. |
| `copilot`  | Adaptateur ACP GitHub Copilot                  | Nécessite l’authentification CLI/runtime Copilot.                                                  |
| `cursor`   | ACP Cursor CLI (`cursor-agent acp`)            | Remplacez la commande acpx si une installation locale expose un autre point d’entrée ACP.    |
| `droid`    | Factory Droid CLI                              | Nécessite l’authentification Factory/Droid ou `FACTORY_API_KEY` dans l’environnement de l’environnement.        |
| `gemini`   | Adaptateur ACP Gemini CLI                      | Nécessite l’authentification Gemini CLI ou la configuration d’une clé API.                                          |
| `iflow`    | iFlow CLI                                      | La disponibilité de l’adaptateur et le contrôle du modèle dépendent de la CLI installée.                 |
| `kilocode` | Kilo Code CLI                                  | La disponibilité de l’adaptateur et le contrôle du modèle dépendent de la CLI installée.                 |
| `kimi`     | Kimi/Moonshot CLI                              | Nécessite l’authentification Kimi/Moonshot sur l’hôte.                                            |
| `kiro`     | Kiro CLI                                       | La disponibilité de l’adaptateur et le contrôle du modèle dépendent de la CLI installée.                 |
| `opencode` | Adaptateur ACP OpenCode                        | Nécessite l’authentification CLI/fournisseur OpenCode.                                                |
| `openclaw` | Pont OpenClaw Gateway via `openclaw acp`       | Permet à un environnement compatible ACP de reparler à une session OpenClaw Gateway.                 |
| `pi`       | Runtime OpenClaw Pi/intégré                    | Utilisé pour les expérimentations d’environnements natifs OpenClaw.                                       |
| `qwen`     | Qwen Code / Qwen CLI                           | Nécessite une authentification compatible Qwen sur l’hôte.                                          |

Les alias d’agents acpx personnalisés peuvent être configurés dans acpx lui-même, mais la politique OpenClaw
vérifie toujours `acp.allowedAgents` et toute correspondance
`agents.list[].runtime.acp.agent` avant la répartition.

## Guide d’exploitation

Flux `/acp` rapide depuis le chat :

<Steps>
  <Step title="Créer">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`, ou explicitement
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Travailler">
    Continuez dans la conversation ou le fil lié (ou ciblez explicitement la clé
    de session).
  </Step>
  <Step title="Vérifier l’état">
    `/acp status`
  </Step>
  <Step title="Ajuster">
    `/acp model <provider/model>`,
    `/acp permissions <profile>`,
    `/acp timeout <seconds>`.
  </Step>
  <Step title="Piloter">
    Sans remplacer le contexte : `/acp steer tighten logging and continue`.
  </Step>
  <Step title="Arrêter">
    `/acp cancel` (tour actuel) ou `/acp close` (session + liaisons).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Détails du cycle de vie">
    - La création crée ou reprend une session de runtime ACP, enregistre les métadonnées ACP dans le magasin de sessions OpenClaw, et peut créer une tâche en arrière-plan lorsque l’exécution appartient au parent.
    - Les sessions ACP appartenant au parent sont traitées comme du travail en arrière-plan même lorsque la session de runtime est persistante ; l’achèvement et la livraison inter-surfaces passent par le notificateur de tâche parent plutôt que de se comporter comme une session de chat normale destinée à l’utilisateur.
    - La maintenance des tâches ferme les sessions ACP ponctuelles terminales ou orphelines appartenant au parent. Les sessions ACP persistantes sont conservées tant qu’une liaison de conversation active reste présente ; les sessions persistantes obsolètes sans liaison active sont fermées afin qu’elles ne puissent pas être reprises silencieusement après la fin de la tâche propriétaire ou la disparition de son enregistrement de tâche.
    - Les messages de suivi liés vont directement à la session ACP jusqu’à ce que la liaison soit fermée, défocalisée, réinitialisée ou expirée.
    - Les commandes Gateway restent locales. `/acp ...`, `/status` et `/unfocus` ne sont jamais envoyées comme texte d’invite normal à un environnement ACP lié.
    - `cancel` interrompt le tour actif lorsque le backend prend en charge l’annulation ; cela ne supprime pas la liaison ni les métadonnées de session.
    - `close` met fin à la session ACP du point de vue d’OpenClaw et supprime la liaison. Un environnement peut toujours conserver son propre historique amont s’il prend en charge la reprise.
    - Le Plugin acpx nettoie les arborescences de processus d’enveloppe et d’adaptateur appartenant à OpenClaw après `close`, et récupère les orphelins ACPX obsolètes appartenant à OpenClaw lors du démarrage de Gateway.
    - Les workers de runtime inactifs sont éligibles au nettoyage après `acp.runtime.ttlMinutes` ; les métadonnées de session stockées restent disponibles pour `/acp sessions`.

  </Accordion>
  <Accordion title="Règles de routage Codex natif">
    Déclencheurs en langage naturel qui doivent router vers le **Plugin Codex
    natif** lorsqu’il est activé :

    - « Lie ce canal Discord à Codex. »
    - « Attache ce chat au fil Codex `<id>`. »
    - « Affiche les fils Codex, puis lie celui-ci. »

    La liaison native des conversations Codex est le chemin de contrôle du chat par défaut.
    Les outils dynamiques OpenClaw s’exécutent toujours via OpenClaw, tandis que
    les outils natifs de Codex comme shell/apply-patch s’exécutent dans Codex.
    Pour les événements d’outils natifs de Codex, OpenClaw injecte un relais de
    hook natif par tour afin que les hooks de Plugin puissent bloquer `before_tool_call`, observer
    `after_tool_call` et acheminer les événements Codex `PermissionRequest`
    via les approbations OpenClaw. Les hooks Codex `Stop` sont relayés vers
    OpenClaw `before_agent_finalize`, où les Plugins peuvent demander un passage
    de modèle supplémentaire avant que Codex ne finalise sa réponse. Le relais reste
    volontairement conservateur : il ne modifie pas les arguments des outils natifs
    de Codex et ne réécrit pas les enregistrements de thread Codex. Utilisez ACP explicite uniquement
    lorsque vous voulez le modèle d’exécution/session ACP. La frontière de prise en charge de Codex
    intégré est documentée dans le
    [contrat de prise en charge du harnais Codex v1](/fr/plugins/codex-harness#v1-support-contract).

  </Accordion>
  <Accordion title="Aide-mémoire de sélection modèle / fournisseur / runtime">
    - `openai-codex/*` - ancienne route de modèle Codex OAuth/abonnement réparée par doctor.
    - `openai/*` - runtime intégré du serveur d’application natif Codex pour les tours d’agent OpenAI.
    - `/codex ...` - contrôle natif de conversation Codex.
    - `/acp ...` ou `runtime: "acp"` - contrôle ACP/acpx explicite.

  </Accordion>
  <Accordion title="Déclencheurs en langage naturel pour le routage ACP">
    Déclencheurs qui doivent router vers le runtime ACP :

    - "Exécute ceci comme une session Claude Code ACP ponctuelle et résume le résultat."
    - "Utilise Gemini CLI pour cette tâche dans un thread, puis conserve les suivis dans ce même thread."
    - "Exécute Codex via ACP dans un thread en arrière-plan."

    OpenClaw choisit `runtime: "acp"`, résout le `agentId` du harnais,
    se lie à la conversation ou au thread en cours lorsque c’est pris en charge, et
    route les suivis vers cette session jusqu’à sa fermeture/expiration. Codex ne
    suit ce chemin que lorsque ACP/acpx est explicite ou que le Plugin Codex natif
    n’est pas disponible pour l’opération demandée.

    Pour `sessions_spawn`, `runtime: "acp"` n’est annoncé que lorsque ACP
    est activé, que le demandeur n’est pas sandboxé et qu’un backend de runtime ACP
    est chargé. `acp.dispatch.enabled=false` met en pause le dispatch automatique
    des threads ACP, mais ne masque ni ne bloque les appels explicites
    `sessions_spawn({ runtime: "acp" })`. Il cible les identifiants de harnais ACP tels que `codex`,
    `claude`, `droid`, `gemini` ou `opencode`. Ne passez pas un id d’agent
    de configuration OpenClaw normal provenant de `agents_list`, sauf si cette entrée est
    explicitement configurée avec `agents.list[].runtime.type="acp"` ;
    sinon, utilisez le runtime de sous-agent par défaut. Lorsqu’un agent OpenClaw
    est configuré avec `runtime.type="acp"`, OpenClaw utilise
    `runtime.acp.agent` comme identifiant de harnais sous-jacent.

  </Accordion>
</AccordionGroup>

## ACP versus sous-agents

Utilisez ACP lorsque vous voulez un runtime de harnais externe. Utilisez le **serveur d’application Codex
natif** pour la liaison/le contrôle de conversation Codex lorsque le Plugin `codex`
est activé. Utilisez les **sous-agents** lorsque vous voulez des exécutions déléguées
natives d’OpenClaw.

| Zone          | Session ACP                           | Exécution de sous-agent             |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | Plugin de backend ACP (par exemple acpx) | Runtime de sous-agent natif OpenClaw |
| Clé de session | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Commandes principales | `/acp ...`                            | `/subagents ...`                   |
| Outil de lancement | `sessions_spawn` avec `runtime:"acp"` | `sessions_spawn` (runtime par défaut) |

Voir aussi [Sous-agents](/fr/tools/subagents).

## Comment ACP exécute Claude Code

Pour Claude Code via ACP, la pile est :

1. Plan de contrôle de session ACP OpenClaw.
2. Plugin de runtime officiel `@openclaw/acpx`.
3. Adaptateur ACP Claude.
4. Mécanismes de runtime/session côté Claude.

ACP Claude est une **session de harnais** avec contrôles ACP, reprise de session,
suivi des tâches en arrière-plan et liaison facultative à une conversation/un thread.

Les backends CLI sont des runtimes de repli locaux séparés en texte seul - voir
[Backends CLI](/fr/gateway/cli-backends).

Pour les opérateurs, la règle pratique est :

- **Vous voulez `/acp spawn`, des sessions liables, des contrôles de runtime ou un travail de harnais persistant ?** Utilisez ACP.
- **Vous voulez un simple repli texte local via la CLI brute ?** Utilisez les backends CLI.

## Sessions liées

### Modèle mental

- **Surface de chat** - là où les personnes continuent de parler (canal Discord, sujet Telegram, chat iMessage).
- **Session ACP** - l’état durable de runtime Codex/Claude/Gemini vers lequel OpenClaw route.
- **Thread/sujet enfant** - une surface de messagerie supplémentaire facultative créée uniquement par `--thread ...`.
- **Espace de travail du runtime** - l’emplacement du système de fichiers (`cwd`, checkout de dépôt, espace de travail backend) où le harnais s’exécute. Indépendant de la surface de chat.

### Liaisons à la conversation actuelle

`/acp spawn <harness> --bind here` épingle la conversation actuelle à la
session ACP lancée - pas de thread enfant, même surface de chat. OpenClaw continue
de gérer le transport, l’authentification, la sécurité et la livraison. Les messages de suivi dans cette
conversation sont routés vers la même session ; `/new` et `/reset` réinitialisent la
session sur place ; `/acp close` supprime la liaison.

Exemples :

```text
/codex bind                                              # liaison Codex native, route les futurs messages ici
/codex model gpt-5.4                                     # ajuste le thread Codex natif lié
/codex stop                                              # contrôle le tour Codex natif actif
/acp spawn codex --bind here                             # repli ACP explicite pour Codex
/acp spawn codex --thread auto                           # peut créer un thread/sujet enfant et s’y lier
/acp spawn codex --bind here --cwd /workspace/repo       # même liaison de chat, Codex s’exécute dans /workspace/repo
```

<AccordionGroup>
  <Accordion title="Règles de liaison et exclusivité">
    - `--bind here` et `--thread ...` sont mutuellement exclusifs.
    - `--bind here` ne fonctionne que sur les canaux qui annoncent la liaison à la conversation actuelle ; OpenClaw renvoie sinon un message clair indiquant que ce n’est pas pris en charge. Les liaisons persistent après les redémarrages du Gateway.
    - Sur Discord, `spawnSessions` contrôle la création de threads enfants pour `--thread auto|here` - pas `--bind here`.
    - Si vous lancez vers un autre agent ACP sans `--cwd`, OpenClaw hérite par défaut de l’espace de travail de **l’agent cible**. Les chemins hérités manquants (`ENOENT`/`ENOTDIR`) retombent sur la valeur par défaut du backend ; les autres erreurs d’accès (par exemple `EACCES`) apparaissent comme des erreurs de lancement.
    - Les commandes de gestion du Gateway restent locales dans les conversations liées - les commandes `/acp ...` sont traitées par OpenClaw même lorsque le texte de suivi normal est routé vers la session ACP liée ; `/status` et `/unfocus` restent également locales chaque fois que la gestion des commandes est activée pour cette surface.

  </Accordion>
  <Accordion title="Sessions liées à un thread">
    Lorsque les liaisons de thread sont activées pour un adaptateur de canal :

    - OpenClaw lie un thread à une session ACP cible.
    - Les messages de suivi dans ce thread sont routés vers la session ACP liée.
    - La sortie ACP est renvoyée dans le même thread.
    - Le désenfocage/la fermeture/l’archivage/le délai d’inactivité ou l’expiration par âge maximal supprime la liaison.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` et `/unfocus` sont des commandes Gateway, pas des prompts adressés au harnais ACP.

    Indicateurs de fonctionnalité requis pour ACP lié à un thread :

    - `acp.enabled=true`
    - `acp.dispatch.enabled` est activé par défaut (définissez `false` pour mettre en pause le dispatch automatique des threads ACP ; les appels explicites `sessions_spawn({ runtime: "acp" })` fonctionnent toujours).
    - Lancements de sessions de thread par adaptateur de canal activés (par défaut : `true`) :
      - Discord : `channels.discord.threadBindings.spawnSessions=true`
      - Telegram : `channels.telegram.threadBindings.spawnSessions=true`

    La prise en charge de la liaison de thread dépend de l’adaptateur. Si l’adaptateur de canal
    actif ne prend pas en charge les liaisons de thread, OpenClaw renvoie un message clair
    indiquant que ce n’est pas pris en charge/disponible.

  </Accordion>
  <Accordion title="Canaux prenant en charge les threads">
    - Tout adaptateur de canal qui expose la capacité de liaison session/thread.
    - Prise en charge intégrée actuelle : threads/canaux **Discord**, sujets **Telegram** (sujets de forum dans les groupes/supergroupes et sujets de DM).
    - Les canaux de Plugin peuvent ajouter la prise en charge via la même interface de liaison.

  </Accordion>
</AccordionGroup>

## Liaisons de canal persistantes

Pour les workflows non éphémères, configurez des liaisons ACP persistantes dans
les entrées de premier niveau `bindings[]`.

### Modèle de liaison

<ParamField path="bindings[].type" type='"acp"'>
  Marque une liaison persistante de conversation ACP.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Identifie la conversation cible. Formes par canal :

- **Canal/thread Discord :** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Sujet de forum Telegram :** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/groupe BlueBubbles :** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Préférez `chat_id:*` ou `chat_identifier:*` pour des liaisons de groupe stables.
- **DM/groupe iMessage :** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Préférez `chat_id:*` pour des liaisons de groupe stables.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  L’id de l’agent OpenClaw propriétaire.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  Remplacement ACP facultatif.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  Libellé facultatif destiné à l’opérateur.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  Répertoire de travail du runtime facultatif.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  Remplacement de backend facultatif.
</ParamField>

### Valeurs par défaut du runtime par agent

Utilisez `agents.list[].runtime` pour définir les valeurs par défaut ACP une fois par agent :

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (identifiant de harnais, par exemple `codex` ou `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Priorité des remplacements pour les sessions ACP liées :**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. Valeurs par défaut ACP globales (par exemple `acp.backend`)

### Exemple

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
      {
        id: "claude",
        runtime: {
          type: "acp",
          acp: { agent: "claude", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
    {
      type: "acp",
      agentId: "claude",
      match: {
        channel: "telegram",
        accountId: "default",
        peer: { kind: "group", id: "-1001234567890:topic:42" },
      },
      acp: { cwd: "/workspace/repo-b" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "discord", accountId: "default" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "telegram", accountId: "default" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": { requireMention: false },
          },
        },
      },
    },
    telegram: {
      groups: {
        "-1001234567890": {
          topics: { "42": { requireMention: false } },
        },
      },
    },
  },
}
```

### Comportement

- OpenClaw garantit que la session ACP configurée existe avant utilisation.
- Les messages dans ce canal ou ce sujet sont acheminés vers la session ACP configurée.
- Dans les conversations liées, `/new` et `/reset` réinitialisent sur place la même clé de session ACP.
- Les liaisons d’exécution temporaires (par exemple créées par des flux de ciblage de fil) continuent de s’appliquer lorsqu’elles sont présentes.
- Pour les lancements ACP inter-agents sans `cwd` explicite, OpenClaw hérite l’espace de travail de l’agent cible depuis la configuration de l’agent.
- Les chemins d’espace de travail hérités manquants se replient sur le cwd par défaut du backend ; les échecs d’accès non manquants apparaissent comme des erreurs de lancement.

## Démarrer des sessions ACP

Deux façons de démarrer une session ACP :

<Tabs>
  <Tab title="Depuis sessions_spawn">
    Utilisez `runtime: "acp"` pour démarrer une session ACP depuis un tour
    d’agent ou un appel d’outil.

    ```json
    {
      "task": "Open the repo and summarize failing tests",
      "runtime": "acp",
      "agentId": "codex",
      "thread": true,
      "mode": "session"
    }
    ```

    <Note>
    `runtime` vaut `subagent` par défaut ; définissez donc explicitement
    `runtime: "acp"` pour les sessions ACP. Si `agentId` est omis,
    OpenClaw utilise `acp.defaultAgent` lorsqu’il est configuré.
    `mode: "session"` nécessite `thread: true` pour conserver une
    conversation liée persistante.
    </Note>

  </Tab>
  <Tab title="Depuis la commande /acp">
    Utilisez `/acp spawn` pour un contrôle opérateur explicite depuis le chat.

    ```text
    /acp spawn codex --mode persistent --thread auto
    /acp spawn codex --mode oneshot --thread off
    /acp spawn codex --bind here
    /acp spawn codex --thread here
    ```

    Indicateurs clés :

    - `--mode persistent|oneshot`
    - `--bind here|off`
    - `--thread auto|here|off`
    - `--cwd <absolute-path>`
    - `--label <name>`

    Consultez [Commandes slash](/fr/tools/slash-commands).

  </Tab>
</Tabs>

### Paramètres de `sessions_spawn`

<ParamField path="task" type="string" required>
  Invite initiale envoyée à la session ACP.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  Doit être `"acp"` pour les sessions ACP.
</ParamField>
<ParamField path="agentId" type="string">
  Identifiant du harnais cible ACP. Se replie sur `acp.defaultAgent` s’il est défini.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Demande un flux de liaison de fil lorsque c’est pris en charge.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` est à usage unique ; `"session"` est persistant. Si `thread: true`
  et que `mode` est omis, OpenClaw peut utiliser par défaut un comportement
  persistant selon le chemin d’exécution. `mode: "session"` nécessite
  `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Répertoire de travail d’exécution demandé (validé par la politique du
  backend/de l’exécution). S’il est omis, le lancement ACP hérite l’espace
  de travail de l’agent cible lorsqu’il est configuré ; les chemins hérités
  manquants se replient sur les valeurs par défaut du backend, tandis que les
  véritables erreurs d’accès sont renvoyées.
</ParamField>
<ParamField path="label" type="string">
  Libellé visible par l’opérateur utilisé dans le texte de session/bannière.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Reprend une session ACP existante au lieu d’en créer une nouvelle. L’agent
  rejoue son historique de conversation via `session/load`. Nécessite
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` diffuse les résumés de progression de l’exécution ACP initiale
  vers la session demandeuse sous forme d’événements système. Les réponses
  acceptées incluent `streamLogPath`, qui pointe vers un journal JSONL limité
  à la session (`<sessionId>.acp-stream.jsonl`) que vous pouvez suivre pour
  l’historique complet du relais.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Interrompt le tour enfant ACP après N secondes. `0` conserve le tour sur le
  chemin sans délai d’expiration du Gateway. La même valeur est appliquée à
  l’exécution Gateway et à l’exécution ACP afin que les harnais bloqués ou à
  quota épuisé n’occupent pas indéfiniment la voie de l’agent parent.
</ParamField>
<ParamField path="model" type="string">
  Remplacement explicite du modèle pour la session enfant ACP. Les lancements
  Codex ACP normalisent les références OpenClaw Codex comme
  `openai-codex/gpt-5.4` vers la configuration de démarrage Codex ACP avant
  `session/new` ; les formes slash comme `openai-codex/gpt-5.4/high`
  définissent aussi l’effort de raisonnement Codex ACP. Les autres harnais
  doivent annoncer les `models` ACP et prendre en charge `session/set_model` ;
  sinon OpenClaw/acpx échoue clairement au lieu de se replier silencieusement
  sur la valeur par défaut de l’agent cible.
</ParamField>
<ParamField path="thinking" type="string">
  Effort explicite de réflexion/raisonnement. Pour Codex ACP, `minimal` se
  mappe sur un effort faible, `low`/`medium`/`high`/`xhigh` se mappent
  directement, et `off` omet le remplacement de démarrage de l’effort de
  raisonnement.
</ParamField>

## Modes de liaison et de fil de lancement

<Tabs>
  <Tab title="--bind here|off">
    | Mode   | Comportement                                                               |
    | ------ | -------------------------------------------------------------------------- |
    | `here` | Lie sur place la conversation active actuelle ; échoue si aucune n’est active. |
    | `off`  | Ne crée pas de liaison avec la conversation actuelle.                       |

    Notes :

    - `--bind here` est le chemin opérateur le plus simple pour « adosser ce canal ou ce chat à Codex ».
    - `--bind here` ne crée pas de fil enfant.
    - `--bind here` n’est disponible que sur les canaux qui exposent la prise en charge de la liaison de conversation actuelle.
    - `--bind` et `--thread` ne peuvent pas être combinés dans le même appel `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Mode   | Comportement                                                                                              |
    | ------ | --------------------------------------------------------------------------------------------------------- |
    | `auto` | Dans un fil actif : lie ce fil. Hors d’un fil : crée/lie un fil enfant lorsque c’est pris en charge.       |
    | `here` | Exige un fil actif actuel ; échoue si vous n’en êtes pas dans un.                                          |
    | `off`  | Aucune liaison. La session démarre sans liaison.                                                          |

    Notes :

    - Sur les surfaces sans liaison de fil, le comportement par défaut est effectivement `off`.
    - Le lancement lié à un fil nécessite la prise en charge par la politique du canal :
      - Discord : `channels.discord.threadBindings.spawnSessions=true`
      - Telegram : `channels.telegram.threadBindings.spawnSessions=true`
    - Utilisez `--bind here` lorsque vous voulez épingler la conversation actuelle sans créer de fil enfant.

  </Tab>
</Tabs>

## Modèle de livraison

Les sessions ACP peuvent être soit des espaces de travail interactifs, soit
des travaux en arrière-plan appartenant au parent. Le chemin de livraison
dépend de cette forme.

<AccordionGroup>
  <Accordion title="Sessions ACP interactives">
    Les sessions interactives sont destinées à poursuivre l’échange sur une
    surface de chat visible :

    - `/acp spawn ... --bind here` lie la conversation actuelle à la session ACP.
    - `/acp spawn ... --thread ...` lie un fil/sujet de canal à la session ACP.
    - Les `bindings[].type="acp"` configurées de manière persistante acheminent les conversations correspondantes vers la même session ACP.

    Les messages de suivi dans la conversation liée sont acheminés directement
    vers la session ACP, et la sortie ACP est renvoyée vers le même
    canal/fil/sujet.

    Ce qu’OpenClaw envoie au harnais :

    - Les suivis liés normaux sont envoyés comme texte d’invite, avec des pièces jointes uniquement lorsque le harnais/backend les prend en charge.
    - Les commandes de gestion `/acp` et les commandes locales Gateway sont interceptées avant l’envoi ACP.
    - Les événements de complétion générés à l’exécution sont matérialisés par cible. Les agents OpenClaw reçoivent l’enveloppe de contexte d’exécution interne d’OpenClaw ; les harnais ACP externes reçoivent une invite simple avec le résultat enfant et l’instruction. L’enveloppe brute `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` ne doit jamais être envoyée à des harnais externes ni conservée comme texte de transcription utilisateur ACP.
    - Les entrées de transcription ACP utilisent le texte de déclenchement visible par l’utilisateur ou l’invite de complétion simple. Les métadonnées d’événement internes restent structurées dans OpenClaw lorsque c’est possible et ne sont pas traitées comme du contenu de chat rédigé par l’utilisateur.

  </Accordion>
  <Accordion title="Sessions ACP à usage unique appartenant au parent">
    Les sessions ACP à usage unique lancées par une autre exécution d’agent
    sont des enfants en arrière-plan, semblables à des sous-agents :

    - Le parent demande le travail avec `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - L’enfant s’exécute dans sa propre session de harnais ACP.
    - Les tours enfants s’exécutent sur la même voie d’arrière-plan que les lancements de sous-agents natifs, afin qu’un harnais ACP lent ne bloque pas le travail sans rapport de la session principale.
    - La complétion est rapportée par le chemin d’annonce de complétion de tâche. OpenClaw convertit les métadonnées de complétion internes en invite ACP simple avant de les envoyer à un harnais externe, afin que les harnais ne voient pas les marqueurs de contexte d’exécution propres à OpenClaw.
    - Le parent reformule le résultat enfant dans une voix d’assistant normale lorsqu’une réponse visible par l’utilisateur est utile.

    Ne traitez **pas** ce chemin comme un chat pair-à-pair entre parent et
    enfant. L’enfant dispose déjà d’un canal de complétion vers le parent.

  </Accordion>
  <Accordion title="sessions_send et livraison A2A">
    `sessions_send` peut cibler une autre session après le lancement. Pour les
    sessions de pairs normales, OpenClaw utilise un chemin de suivi
    agent-à-agent (A2A) après avoir injecté le message :

    - Attendre la réponse de la session cible.
    - Laisser éventuellement le demandeur et la cible échanger un nombre borné de tours de suivi.
    - Demander à la cible de produire un message d’annonce.
    - Livrer cette annonce au canal ou au fil visible.

    Ce chemin A2A est un repli pour les envois entre pairs lorsque l’expéditeur
    a besoin d’un suivi visible. Il reste activé lorsqu’une session sans rapport
    peut voir et envoyer un message à une cible ACP, par exemple avec des
    paramètres larges de `tools.sessions.visibility`.

    OpenClaw ignore le suivi A2A uniquement lorsque le demandeur est le parent
    de son propre enfant ACP à usage unique appartenant au parent. Dans ce cas,
    exécuter A2A en plus de la complétion de tâche peut réveiller le parent avec
    le résultat de l’enfant, transférer la réponse du parent vers l’enfant et
    créer une boucle d’écho parent/enfant. Le résultat de `sessions_send`
    signale `delivery.status="skipped"` pour ce cas d’enfant détenu, car le
    chemin de complétion est déjà responsable du résultat.

  </Accordion>
  <Accordion title="Reprendre une session existante">
    Utilisez `resumeSessionId` pour continuer une session ACP précédente au lieu
    de repartir de zéro. L’agent rejoue son historique de conversation via
    `session/load`, ce qui lui permet de reprendre avec tout le contexte
    antérieur.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Cas d’utilisation courants :

    - Transférer une session Codex de votre ordinateur portable à votre téléphone : dites à votre agent de reprendre là où vous vous étiez arrêté.
    - Continuer une session de codage démarrée interactivement dans la CLI, désormais sans interface via votre agent.
    - Reprendre un travail interrompu par un redémarrage du Gateway ou un délai d’inactivité.

    Notes :

    - `resumeSessionId` ne s’applique que lorsque `runtime: "acp"` ; l’exécution de sous-agent par défaut ignore ce champ propre à ACP.
    - `streamTo` ne s’applique que lorsque `runtime: "acp"` ; l’exécution de sous-agent par défaut ignore ce champ propre à ACP.
    - `resumeSessionId` est un identifiant de reprise ACP/harnais local à l’hôte, pas une clé de session de canal OpenClaw ; OpenClaw vérifie toujours la politique de lancement ACP et la politique de l’agent cible avant l’envoi, tandis que le backend ou le harnais ACP possède l’autorisation de chargement de cet identifiant amont.
    - `resumeSessionId` restaure l’historique de conversation ACP amont ; `thread` et `mode` continuent de s’appliquer normalement à la nouvelle session OpenClaw que vous créez, donc `mode: "session"` nécessite toujours `thread: true`.
    - L’agent cible doit prendre en charge `session/load` (Codex et Claude Code le font).
    - Si l’identifiant de session est introuvable, le lancement échoue avec une erreur claire, sans repli silencieux vers une nouvelle session.

  </Accordion>
  <Accordion title="Test smoke post-déploiement">
    Après un déploiement du Gateway, exécutez une vérification de bout en bout
    en conditions réelles au lieu de faire confiance aux tests unitaires :

    1. Vérifiez la version du Gateway déployée et le commit sur l’hôte cible.
    2. Ouvrez une session temporaire de pont ACPX vers un agent en direct.
    3. Demandez à cet agent d’appeler `sessions_spawn` avec `runtime: "acp"`, `agentId: "codex"`, `mode: "run"`, et la tâche `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Vérifiez `accepted=yes`, un vrai `childSessionKey`, et l’absence d’erreur de validateur.
    5. Nettoyez la session temporaire de pont.

    Conservez le gate sur `mode: "run"` et ignorez `streamTo: "parent"` -
    les chemins thread-bound `mode: "session"` et stream-relay sont des passes
    d’intégration enrichies distinctes.

  </Accordion>
</AccordionGroup>

## Compatibilité du sandbox

Les sessions ACP s’exécutent actuellement sur le runtime de l’hôte, **pas** à l’intérieur du
sandbox OpenClaw.

<Warning>
**Frontière de sécurité :**

- Le harness externe peut lire/écrire selon ses propres permissions CLI et le `cwd` sélectionné.
- La politique de sandbox d’OpenClaw **n’enveloppe pas** l’exécution du harness ACP.
- OpenClaw applique toujours les gates de fonctionnalité ACP, les agents autorisés, la propriété des sessions, les liaisons de canal et la politique de livraison du Gateway.
- Utilisez `runtime: "subagent"` pour le travail natif OpenClaw appliqué par sandbox.

</Warning>

Limitations actuelles :

- Si la session requérante est sandboxée, les spawns ACP sont bloqués pour `sessions_spawn({ runtime: "acp" })` comme pour `/acp spawn`.
- `sessions_spawn` avec `runtime: "acp"` ne prend pas en charge `sandbox: "require"`.

## Résolution de la cible de session

La plupart des actions `/acp` acceptent une cible de session facultative (`session-key`,
`session-id`, ou `session-label`).

**Ordre de résolution :**

1. Argument de cible explicite (ou `--session` pour `/acp steer`)
   - essaie la clé
   - puis l’identifiant de session en forme d’UUID
   - puis le libellé
2. Liaison du thread actuel (si cette conversation/ce thread est lié à une session ACP).
3. Repli sur la session requérante actuelle.

Les liaisons de conversation actuelle et les liaisons de thread participent toutes deux à
l’étape 2.

Si aucune cible n’est résolue, OpenClaw renvoie une erreur claire
(`Unable to resolve session target: ...`).

## Contrôles ACP

| Commande             | Ce qu’elle fait                                          | Exemple                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Créer une session ACP ; liaison actuelle ou liaison de thread facultative. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Annuler le tour en cours pour la session cible.           | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Envoyer une instruction de pilotage à la session en cours. | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Fermer la session et délier les cibles de thread.         | `/acp close`                                                  |
| `/acp status`        | Afficher backend, mode, état, options de runtime, capacités. | `/acp status`                                                 |
| `/acp set-mode`      | Définir le mode de runtime pour la session cible.         | `/acp set-mode plan`                                          |
| `/acp set`           | Écrire une option de configuration de runtime générique.  | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Définir le remplacement du répertoire de travail du runtime. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Définir le profil de politique d’approbation.             | `/acp permissions strict`                                     |
| `/acp timeout`       | Définir le délai d’expiration du runtime (secondes).      | `/acp timeout 120`                                            |
| `/acp model`         | Définir le remplacement du modèle de runtime.             | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Supprimer les remplacements d’options de runtime de session. | `/acp reset-options`                                          |
| `/acp sessions`      | Lister les sessions ACP récentes depuis le store.         | `/acp sessions`                                               |
| `/acp doctor`        | Santé du backend, capacités, correctifs exploitables.     | `/acp doctor`                                                 |
| `/acp install`       | Afficher des étapes d’installation et d’activation déterministes. | `/acp install`                                                |

`/acp status` affiche les options de runtime effectives ainsi que les identifiants de session au niveau du runtime et
au niveau du backend. Les erreurs de contrôle non pris en charge apparaissent
clairement lorsqu’un backend ne dispose pas d’une capacité. `/acp sessions` lit le
store pour la session actuellement liée ou requérante ; les jetons de cible
(`session-key`, `session-id`, ou `session-label`) se résolvent via
la découverte de sessions du Gateway, y compris les racines `session.store`
personnalisées par agent.

### Mappage des options de runtime

`/acp` propose des commandes de commodité et un setter générique. Opérations
équivalentes :

| Commande                     | Mappe vers                            | Notes                                                                                                                                                                          |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | clé de configuration de runtime `model` | Pour Codex ACP, OpenClaw normalise `openai-codex/<model>` vers l’identifiant de modèle de l’adaptateur et mappe les suffixes de raisonnement avec barre oblique comme `openai-codex/gpt-5.4/high` vers `reasoning_effort`. |
| `/acp set thinking <level>`  | clé de configuration de runtime `thinking` | Pour Codex ACP, OpenClaw envoie le `reasoning_effort` correspondant lorsque l’adaptateur en prend un en charge.                                                                |
| `/acp permissions <profile>` | clé de configuration de runtime `approval_policy` | -                                                                                                                                                                              |
| `/acp timeout <seconds>`     | clé de configuration de runtime `timeout` | -                                                                                                                                                                              |
| `/acp cwd <path>`            | remplacement du cwd de runtime        | Mise à jour directe.                                                                                                                                                           |
| `/acp set <key> <value>`     | générique                             | `key=cwd` utilise le chemin de remplacement du cwd.                                                                                                                            |
| `/acp reset-options`         | efface tous les remplacements de runtime | -                                                                                                                                                                              |

## Harness acpx, configuration du plugin et permissions

Pour la configuration du harness acpx (alias Claude Code / Codex / Gemini CLI),
les ponts MCP plugin-tools et OpenClaw-tools, et les modes de permission
ACP, consultez
[Agents ACP - configuration](/fr/tools/acp-agents-setup).

## Dépannage

| Symptôme                                                                     | Cause probable                                                                                                         | Correction                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Plugin backend manquant, désactivé ou bloqué par `plugins.allow`.                                                       | Installez et activez le Plugin backend, incluez `acpx` dans `plugins.allow` lorsque cette liste d’autorisation est définie, puis exécutez `/acp doctor`.                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP désactivé globalement.                                                                                                 | Définissez `acp.enabled=true`.                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Répartition automatique depuis les messages de fil normaux désactivée.                                                               | Définissez `acp.dispatch.enabled=true` pour reprendre le routage automatique des fils ; les appels explicites `sessions_spawn({ runtime: "acp" })` fonctionnent toujours.                                      |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent absent de la liste d’autorisation.                                                                                                | Utilisez un `agentId` autorisé ou mettez à jour `acp.allowedAgents`.                                                                                                                     |
| `/acp doctor` signale que le backend n’est pas prêt juste après le démarrage                 | Le Plugin backend est manquant, désactivé, bloqué par une stratégie d’autorisation/refus, ou son exécutable configuré est indisponible.        | Installez/activez le Plugin backend, réexécutez `/acp doctor` et examinez l’erreur d’installation ou de stratégie du backend s’il reste défaillant.                                           |
| Commande de harnais introuvable                                                   | La CLI de l’adaptateur n’est pas installée, le Plugin externe est manquant, ou la récupération `npx` au premier lancement a échoué pour un adaptateur non-Codex. | Exécutez `/acp doctor`, installez/préchauffez l’adaptateur sur l’hôte Gateway, ou configurez explicitement la commande de l’agent acpx.                                                      |
| Modèle introuvable depuis le harnais                                            | L’identifiant de modèle est valide pour un autre fournisseur/harnais, mais pas pour cette cible ACP.                                                | Utilisez un modèle listé par ce harnais, configurez le modèle dans le harnais, ou omettez la substitution.                                                                            |
| Erreur d’authentification du fournisseur depuis le harnais                                          | OpenClaw est sain, mais la CLI/le fournisseur cible n’est pas connecté.                                                     | Connectez-vous ou fournissez la clé fournisseur requise dans l’environnement de l’hôte Gateway.                                                                                             |
| `Unable to resolve session target: ...`                                     | Jeton de clé/d’identifiant/de libellé incorrect.                                                                                                | Exécutez `/acp sessions`, copiez la clé/le libellé exact, puis réessayez.                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` utilisé sans conversation active pouvant être liée.                                                            | Déplacez-vous vers la discussion/le canal cible et réessayez, ou utilisez un lancement non lié.                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | L’adaptateur ne dispose pas de la capacité de liaison ACP à la conversation actuelle.                                                             | Utilisez `/acp spawn ... --thread ...` lorsque c’est pris en charge, configurez `bindings[]` au niveau supérieur, ou passez à un canal pris en charge.                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` utilisé hors d’un contexte de fil.                                                                         | Déplacez-vous vers le fil cible ou utilisez `--thread auto`/`off`.                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Un autre utilisateur possède la cible de liaison active.                                                                           | Reliez en tant que propriétaire ou utilisez une autre conversation ou un autre fil.                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                            | L’adaptateur ne dispose pas de la capacité de liaison de fil.                                                                               | Utilisez `--thread off` ou passez à un adaptateur/canal pris en charge.                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Le runtime ACP est côté hôte ; la session demandeuse est en sandbox.                                                              | Utilisez `runtime="subagent"` depuis les sessions en sandbox, ou lancez ACP depuis une session non sandboxée.                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` demandé pour le runtime ACP.                                                                         | Utilisez `runtime="subagent"` pour une mise en sandbox obligatoire, ou utilisez ACP avec `sandbox="inherit"` depuis une session non sandboxée.                                                      |
| `Cannot apply --model ... did not advertise model support`                  | Le harnais cible n’expose pas le changement générique de modèle ACP.                                                        | Utilisez un harnais qui annonce ACP `models`/`session/set_model`, utilisez des références de modèle Codex ACP, ou configurez le modèle directement dans le harnais s’il possède son propre indicateur de démarrage. |
| Métadonnées ACP manquantes pour la session liée                                      | Métadonnées de session ACP obsolètes/supprimées.                                                                                    | Recréez avec `/acp spawn`, puis reliez à nouveau/mettez le fil au focus.                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` bloque les écritures/l’exécution dans une session ACP non interactive.                                                    | Définissez `plugins.entries.acpx.config.permissionMode` sur `approve-all` et redémarrez le Gateway. Consultez [Configuration des permissions](/fr/tools/acp-agents-setup#permission-configuration). |
| La session ACP échoue tôt avec peu de sortie                                  | Les invites de permission sont bloquées par `permissionMode`/`nonInteractivePermissions`.                                        | Vérifiez les journaux du Gateway pour `AcpRuntimeError`. Pour des permissions complètes, définissez `permissionMode=approve-all` ; pour une dégradation gracieuse, définissez `nonInteractivePermissions=deny`.        |
| La session ACP reste bloquée indéfiniment après avoir terminé le travail                       | Le processus de harnais s’est terminé, mais la session ACP n’a pas signalé son achèvement.                                                    | Mettez OpenClaw à jour ; le nettoyage acpx actuel supprime les processus d’enveloppe obsolètes et les processus d’adaptateur appartenant à OpenClaw à la fermeture et au démarrage du Gateway.                                             |
| Le harnais voit `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | Une enveloppe d’événement interne a fui au-delà de la frontière ACP.                                                                | Mettez OpenClaw à jour et réexécutez le flux d’achèvement ; les harnais externes doivent recevoir uniquement des invites d’achèvement simples.                                                          |

## Associé

- [Agents ACP - configuration](/fr/tools/acp-agents-setup)
- [Envoi à l’agent](/fr/tools/agent-send)
- [Backends CLI](/fr/gateway/cli-backends)
- [Harnais Codex](/fr/plugins/codex-harness)
- [Outils de sandbox multi-agent](/fr/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (mode pont)](/fr/cli/acp)
- [Sous-agents](/fr/tools/subagents)
