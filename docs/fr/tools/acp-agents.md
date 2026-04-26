---
read_when:
    - Exécution de harnesses de codage via ACP
    - Configuration de sessions ACP liées à la conversation sur les canaux de messagerie
    - Liaison d'une conversation de canal de messagerie à une session ACP persistante
    - Dépannage du backend ACP, du câblage du Plugin ou de la livraison des complétions
    - Utilisation des commandes /acp depuis le chat
sidebarTitle: ACP agents
summary: Exécutez des harnesses de codage externes (Claude Code, Cursor, Gemini CLI, Codex ACP explicite, OpenClaw ACP, OpenCode) via le backend ACP
title: Agents ACP
x-i18n:
    generated_at: "2026-04-26T11:38:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: e3b8550be4cf0da2593b0770e302833e1722820d3c922e5508a253685cd0cb6b
    source_path: tools/acp-agents.md
    workflow: 15
---

Les sessions [Agent Client Protocol (ACP)](https://agentclientprotocol.com/)
permettent à OpenClaw d'exécuter des harnesses de codage externes (par exemple Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI et d'autres
harnesses ACPX pris en charge) via un Plugin backend ACP.

Chaque création de session ACP est suivie comme une [tâche d'arrière-plan](/fr/automation/tasks).

<Note>
**ACP est le chemin de harness externe, pas le chemin Codex par défaut.** Le
Plugin natif Codex app-server gère les contrôles `/codex ...` et le
runtime intégré `agentRuntime.id: "codex"` ; ACP gère
les contrôles `/acp ...` et les sessions `sessions_spawn({ runtime: "acp" })`.

Si vous voulez que Codex ou Claude Code se connecte comme client MCP externe
directement à des conversations de canal OpenClaw existantes, utilisez
[`openclaw mcp serve`](/fr/cli/mcp) au lieu d'ACP.
</Note>

## Quelle page me faut-il ?

| Vous voulez…                                                                                   | Utilisez                              | Remarques                                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lier ou contrôler Codex dans la conversation actuelle                                           | `/codex bind`, `/codex threads`       | Chemin natif Codex app-server lorsque le Plugin `codex` est activé ; inclut les réponses de chat liées, le transfert d'images, le modèle/rapide/autorisations, l'arrêt et les contrôles de pilotage. ACP est une solution de repli explicite |
| Exécuter Claude Code, Gemini CLI, Codex ACP explicite ou un autre harness externe _via_ OpenClaw | Cette page                            | Sessions liées au chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tâches d'arrière-plan, contrôles de runtime                                                                     |
| Exposer une session OpenClaw Gateway _en tant que_ serveur ACP pour un éditeur ou un client     | [`openclaw acp`](/fr/cli/acp)            | Mode pont. L'IDE/le client parle ACP à OpenClaw via stdio/WebSocket                                                                                                                          |
| Réutiliser un CLI IA local comme modèle de secours texte uniquement                            | [CLI Backends](/fr/gateway/cli-backends) | Pas ACP. Pas d'outils OpenClaw, pas de contrôles ACP, pas de runtime de harness                                                                                                              |

## Est-ce que cela fonctionne immédiatement ?

En général oui. Les nouvelles installations livrent le Plugin runtime `acpx` intégré
activé par défaut avec un binaire `acpx` épinglé local au Plugin, qu'OpenClaw sonde
et auto-répare au démarrage. Exécutez `/acp doctor` pour un contrôle d'état.

OpenClaw n'informe les agents de la création ACP que lorsque ACP est **vraiment
utilisable** : ACP doit être activé, le dispatch ne doit pas être désactivé, la
session actuelle ne doit pas être bloquée par le sandbox, et un backend de runtime doit être
chargé. Si ces conditions ne sont pas remplies, les Skills du Plugin ACP et les
indications ACP de `sessions_spawn` restent masquées afin que l'agent ne suggère pas
un backend indisponible.

<AccordionGroup>
  <Accordion title="Pièges du premier lancement">
    - Si `plugins.allow` est défini, il s'agit d'un inventaire restrictif de Plugins et il **doit** inclure `acpx` ; sinon la valeur intégrée par défaut est volontairement bloquée et `/acp doctor` signale l'entrée manquante dans la liste d'autorisation.
    - Les adaptateurs de harness cible (Codex, Claude, etc.) peuvent être récupérés à la demande avec `npx` la première fois que vous les utilisez.
    - L'authentification du fournisseur doit toujours exister sur l'hôte pour ce harness.
    - Si l'hôte n'a pas npm ou pas d'accès réseau, la récupération initiale des adaptateurs échoue jusqu'à ce que les caches soient préchauffés ou que l'adaptateur soit installé autrement.
  </Accordion>
  <Accordion title="Prérequis du runtime">
    ACP lance un véritable processus de harness externe. OpenClaw gère le routage,
    l'état des tâches d'arrière-plan, la livraison, les liaisons et la politique ; le harness
    gère sa connexion fournisseur, son catalogue de modèles, son comportement sur le système de fichiers et
    ses outils natifs.

    Avant d'incriminer OpenClaw, vérifiez :

    - que `/acp doctor` signale un backend activé et sain.
    - que l'ID cible est autorisé par `acp.allowedAgents` lorsque cette liste d'autorisation est définie.
    - que la commande du harness peut démarrer sur l'hôte Gateway.
    - que l'authentification du fournisseur est présente pour ce harness (`claude`, `codex`, `gemini`, `opencode`, `droid`, etc.).
    - que le modèle sélectionné existe pour ce harness — les ID de modèle ne sont pas portables entre les harnesses.
    - que le `cwd` demandé existe et est accessible, ou omettez `cwd` et laissez le backend utiliser sa valeur par défaut.
    - que le mode d'autorisation correspond au travail. Les sessions non interactives ne peuvent pas cliquer sur les invites d'autorisation natives, donc les exécutions de codage avec beaucoup d'écriture/exécution nécessitent généralement un profil d'autorisation ACPX capable de continuer sans interface.

  </Accordion>
</AccordionGroup>

Les outils du Plugin OpenClaw et les outils OpenClaw intégrés ne sont **pas** exposés aux
harnesses ACP par défaut. Activez les ponts MCP explicites dans
[ACP agents — setup](/fr/tools/acp-agents-setup) uniquement lorsque le harness
doit appeler directement ces outils.

## Cibles de harness prises en charge

Avec le backend `acpx` intégré, utilisez ces ID de harness comme cibles de `/acp spawn <id>`
ou `sessions_spawn({ runtime: "acp", agentId: "<id>" })` :

| ID du harness | Backend typique                                | Remarques                                                                            |
| ------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------ |
| `claude`      | Adaptateur ACP Claude Code                     | Nécessite une authentification Claude Code sur l'hôte.                               |
| `codex`       | Adaptateur ACP Codex                           | Solution de repli ACP explicite uniquement lorsque `/codex` natif n'est pas disponible ou qu'ACP est demandé. |
| `copilot`     | Adaptateur ACP GitHub Copilot                  | Nécessite une authentification CLI/runtime Copilot.                                  |
| `cursor`      | ACP Cursor CLI (`cursor-agent acp`)            | Remplacez la commande acpx si une installation locale expose un autre point d'entrée ACP. |
| `droid`       | Factory Droid CLI                              | Nécessite une authentification Factory/Droid ou `FACTORY_API_KEY` dans l'environnement du harness. |
| `gemini`      | Adaptateur ACP Gemini CLI                      | Nécessite une authentification Gemini CLI ou une configuration de clé API.           |
| `iflow`       | iFlow CLI                                      | La disponibilité de l'adaptateur et le contrôle du modèle dépendent du CLI installé. |
| `kilocode`    | Kilo Code CLI                                  | La disponibilité de l'adaptateur et le contrôle du modèle dépendent du CLI installé. |
| `kimi`        | Kimi/Moonshot CLI                              | Nécessite une authentification Kimi/Moonshot sur l'hôte.                             |
| `kiro`        | Kiro CLI                                       | La disponibilité de l'adaptateur et le contrôle du modèle dépendent du CLI installé. |
| `opencode`    | Adaptateur ACP OpenCode                        | Nécessite une authentification CLI/provider OpenCode.                                |
| `openclaw`    | Pont OpenClaw Gateway via `openclaw acp`       | Permet à un harness compatible ACP de reparler à une session OpenClaw Gateway.       |
| `pi`          | Pi/runtime OpenClaw intégré                    | Utilisé pour les expérimentations de harness natives OpenClaw.                       |
| `qwen`        | Qwen Code / Qwen CLI                           | Nécessite une authentification compatible Qwen sur l'hôte.                           |

Des alias d'agent acpx personnalisés peuvent être configurés dans acpx lui-même, mais la
politique OpenClaw vérifie toujours `acp.allowedAgents` ainsi que tout mappage
`agents.list[].runtime.acp.agent` avant le dispatch.

## Guide opérateur

Flux rapide `/acp` depuis le chat :

<Steps>
  <Step title="Lancer">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`, ou
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Travailler">
    Continuez dans la conversation ou le thread lié (ou ciblez explicitement la
    clé de session).
  </Step>
  <Step title="Vérifier l'état">
    `/acp status`
  </Step>
  <Step title="Ajuster">
    `/acp model <provider/model>`,
    `/acp permissions <profile>`,
    `/acp timeout <seconds>`.
  </Step>
  <Step title="Piloter">
    Sans remplacer le contexte : `/acp steer resserre la journalisation et continue`.
  </Step>
  <Step title="Arrêter">
    `/acp cancel` (tour actuel) ou `/acp close` (session + liaisons).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Détails du cycle de vie">
    - Le lancement crée ou reprend une session de runtime ACP, enregistre les métadonnées ACP dans le magasin de sessions OpenClaw et peut créer une tâche d'arrière-plan lorsque l'exécution appartient au parent.
    - Les messages de suivi liés vont directement à la session ACP jusqu'à ce que la liaison soit fermée, défocalisée, réinitialisée ou expirée.
    - Les commandes Gateway restent locales. `/acp ...`, `/status` et `/unfocus` ne sont jamais envoyées comme texte de prompt normal à un harness ACP lié.
    - `cancel` interrompt le tour actif lorsque le backend prend en charge l'annulation ; cela ne supprime pas la liaison ni les métadonnées de session.
    - `close` termine la session ACP du point de vue d'OpenClaw et supprime la liaison. Un harness peut néanmoins conserver son propre historique amont s'il prend en charge la reprise.
    - Les workers de runtime inactifs peuvent être nettoyés après `acp.runtime.ttlMinutes` ; les métadonnées de session stockées restent disponibles pour `/acp sessions`.
  </Accordion>
  <Accordion title="Règles de routage Codex natives">
    Déclencheurs en langage naturel qui doivent être routés vers le **Plugin Codex
    natif** lorsqu'il est activé :

    - « Lier ce canal Discord à Codex. »
    - « Attacher ce chat au thread Codex `<id>`. »
    - « Afficher les threads Codex, puis lier celui-ci. »

    La liaison de conversation Codex native est le chemin de contrôle de chat par défaut.
    Les outils dynamiques OpenClaw continuent à s'exécuter via OpenClaw, tandis que
    les outils natifs Codex comme shell/apply-patch s'exécutent dans Codex.
    Pour les événements d'outils natifs Codex, OpenClaw injecte un relais de hook natif
    par tour afin que les hooks du Plugin puissent bloquer `before_tool_call`, observer
    `after_tool_call` et acheminer les événements Codex `PermissionRequest`
    via les approbations OpenClaw. Les hooks Codex `Stop` sont relayés vers
    OpenClaw `before_agent_finalize`, où les Plugins peuvent demander un passage
    supplémentaire du modèle avant que Codex ne finalise sa réponse. Le relais reste
    volontairement conservateur : il ne modifie pas les arguments des outils natifs Codex
    et ne réécrit pas les enregistrements de thread Codex. Utilisez ACP explicite seulement
    lorsque vous voulez le modèle de runtime/session ACP. La frontière de prise en charge Codex intégrée est documentée dans le
    [contrat de support Codex harness v1](/fr/plugins/codex-harness#v1-support-contract).

  </Accordion>
  <Accordion title="Aide-mémoire de sélection modèle / provider / runtime">
    - `openai-codex/*` — route PI Codex OAuth/abonnement.
    - `openai/*` plus `agentRuntime.id: "codex"` — runtime intégré natif Codex app-server.
    - `/codex ...` — contrôle natif de conversation Codex.
    - `/acp ...` ou `runtime: "acp"` — contrôle ACP/acpx explicite.
  </Accordion>
  <Accordion title="Déclencheurs en langage naturel pour le routage ACP">
    Déclencheurs qui doivent être routés vers le runtime ACP :

    - « Exécute ceci comme une session ACP Claude Code one-shot et résume le résultat. »
    - « Utilise Gemini CLI pour cette tâche dans un thread, puis conserve les suivis dans ce même thread. »
    - « Exécute Codex via ACP dans un thread d'arrière-plan. »

    OpenClaw choisit `runtime: "acp"`, résout le `agentId` du harness,
    se lie à la conversation ou au thread actuel lorsque c'est pris en charge, et
    achemine les suivis vers cette session jusqu'à sa fermeture/expiration. Codex ne
    suit ce chemin que lorsque ACP/acpx est explicite ou que le Plugin Codex
    natif n'est pas disponible pour l'opération demandée.

    Pour `sessions_spawn`, `runtime: "acp"` n'est annoncé que lorsque ACP
    est activé, que le demandeur n'est pas sandboxé et qu'un backend de runtime ACP
    est chargé. Il cible des ID de harness ACP tels que `codex`,
    `claude`, `droid`, `gemini` ou `opencode`. Ne transmettez pas un ID d'agent OpenClaw de configuration normal issu de `agents_list` à moins que cette entrée ne soit
    explicitement configurée avec `agents.list[].runtime.type="acp"` ;
    sinon, utilisez le runtime de sous-agent par défaut. Lorsqu'un agent OpenClaw
    est configuré avec `runtime.type="acp"`, OpenClaw utilise
    `runtime.acp.agent` comme ID de harness sous-jacent.

  </Accordion>
</AccordionGroup>

## ACP versus sous-agents

Utilisez ACP lorsque vous voulez un runtime de harness externe. Utilisez le **Codex
app-server natif** pour la liaison/le contrôle de conversation Codex lorsque le Plugin `codex`
est activé. Utilisez les **sous-agents** lorsque vous voulez des
exécutions déléguées natives OpenClaw.

| Domaine       | Session ACP                           | Exécution de sous-agent            |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | Plugin backend ACP (par exemple acpx) | Runtime de sous-agent natif OpenClaw |
| Clé de session | `agent:<agentId>:acp:<uuid>`         | `agent:<agentId>:subagent:<uuid>`  |
| Commandes principales | `/acp ...`                    | `/subagents ...`                   |
| Outil de lancement | `sessions_spawn` avec `runtime:"acp"` | `sessions_spawn` (runtime par défaut) |

Voir aussi [Sub-agents](/fr/tools/subagents).

## Comment ACP exécute Claude Code

Pour Claude Code via ACP, la pile est la suivante :

1. Plan de contrôle de session ACP OpenClaw.
2. Plugin runtime `acpx` intégré.
3. Adaptateur ACP Claude.
4. Mécanisme de runtime/session côté Claude.

ACP Claude est une **session de harness** avec contrôles ACP, reprise de session,
suivi de tâche d'arrière-plan et liaison optionnelle à une conversation/un thread.

Les backends CLI sont des runtimes de secours locaux texte uniquement distincts — voir
[CLI Backends](/fr/gateway/cli-backends).

Pour les opérateurs, la règle pratique est la suivante :

- **Vous voulez `/acp spawn`, des sessions pouvant être liées, des contrôles de runtime ou un travail de harness persistant ?** Utilisez ACP.
- **Vous voulez un simple secours texte local via le CLI brut ?** Utilisez les backends CLI.

## Sessions liées

### Modèle mental

- **Surface de chat** — l'endroit où les gens continuent de parler (canal Discord, sujet Telegram, chat iMessage).
- **Session ACP** — l'état durable du runtime Codex/Claude/Gemini vers lequel OpenClaw achemine.
- **Thread/sujet enfant** — une surface de messagerie supplémentaire facultative créée uniquement par `--thread ...`.
- **Espace de travail du runtime** — l'emplacement du système de fichiers (`cwd`, extraction du dépôt, espace de travail backend) où le harness s'exécute. Indépendant de la surface de chat.

### Liaisons à la conversation actuelle

`/acp spawn <harness> --bind here` épingle la conversation actuelle à la
session ACP lancée — pas de thread enfant, même surface de chat. OpenClaw continue
de gérer le transport, l'authentification, la sécurité et la livraison. Les messages
de suivi dans cette conversation sont acheminés vers la même session ; `/new` et `/reset` réinitialisent la
session en place ; `/acp close` supprime la liaison.

Exemples :

```text
/codex bind                                              # liaison Codex native, acheminer les futurs messages ici
/codex model gpt-5.4                                     # ajuster le thread Codex natif lié
/codex stop                                              # contrôler le tour Codex natif actif
/acp spawn codex --bind here                             # solution de repli ACP explicite pour Codex
/acp spawn codex --thread auto                           # peut créer un thread/sujet enfant et s'y lier
/acp spawn codex --bind here --cwd /workspace/repo       # même liaison de chat, Codex s'exécute dans /workspace/repo
```

<AccordionGroup>
  <Accordion title="Règles de liaison et exclusivité">
    - `--bind here` et `--thread ...` sont mutuellement exclusifs.
    - `--bind here` ne fonctionne que sur les canaux qui annoncent la liaison à la conversation actuelle ; sinon, OpenClaw renvoie un message clair d'absence de prise en charge. Les liaisons persistent après les redémarrages de la gateway.
    - Sur Discord, `spawnAcpSessions` n'est requis que lorsque OpenClaw doit créer un thread enfant pour `--thread auto|here` — pas pour `--bind here`.
    - Si vous lancez vers un autre agent ACP sans `--cwd`, OpenClaw hérite par défaut de l'espace de travail de **l'agent cible**. Les chemins hérités manquants (`ENOENT`/`ENOTDIR`) reviennent à la valeur par défaut du backend ; les autres erreurs d'accès (par exemple `EACCES`) apparaissent comme des erreurs de lancement.
    - Les commandes de gestion Gateway restent locales dans les conversations liées — les commandes `/acp ...` sont traitées par OpenClaw même lorsque le texte de suivi normal est acheminé vers la session ACP liée ; `/status` et `/unfocus` restent également locaux chaque fois que la gestion des commandes est activée pour cette surface.
  </Accordion>
  <Accordion title="Sessions liées à un thread">
    Lorsque les liaisons de thread sont activées pour un adaptateur de canal :

    - OpenClaw lie un thread à une session ACP cible.
    - Les messages de suivi dans ce thread sont acheminés vers la session ACP liée.
    - La sortie ACP est renvoyée dans ce même thread.
    - La défocalisation/fermeture/archivage/expiration sur délai d'inactivité ou âge maximal supprime la liaison.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` et `/unfocus` sont des commandes Gateway, pas des prompts envoyés au harness ACP.

    Indicateurs de fonctionnalité requis pour l'ACP lié à un thread :

    - `acp.enabled=true`
    - `acp.dispatch.enabled` est activé par défaut (définissez `false` pour suspendre le dispatch ACP).
    - Indicateur de création de thread ACP de l'adaptateur de canal activé (spécifique à l'adaptateur) :
      - Discord : `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram : `channels.telegram.threadBindings.spawnAcpSessions=true`

    La prise en charge de la liaison de thread est spécifique à l'adaptateur. Si l'adaptateur de canal actif
    ne prend pas en charge les liaisons de thread, OpenClaw renvoie un message clair
    indiquant que cela n'est pas pris en charge/disponible.

  </Accordion>
  <Accordion title="Canaux prenant en charge les threads">
    - Tout adaptateur de canal qui expose une capacité de liaison session/thread.
    - Prise en charge intégrée actuelle : threads/canaux **Discord**, sujets **Telegram** (sujets de forum dans les groupes/supergroupes et sujets de DM).
    - Les canaux Plugin peuvent ajouter la prise en charge via la même interface de liaison.
  </Accordion>
</AccordionGroup>

## Liaisons de canal persistantes

Pour les workflows non éphémères, configurez des liaisons ACP persistantes dans
des entrées `bindings[]` de niveau supérieur.

### Modèle de liaison

<ParamField path="bindings[].type" type='"acp"'>
  Marque une liaison de conversation ACP persistante.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Identifie la conversation cible. Formes par canal :

- **Canal/thread Discord :** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Sujet de forum Telegram :** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/groupe BlueBubbles :** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Préférez `chat_id:*` ou `chat_identifier:*` pour des liaisons de groupe stables.
- **DM/groupe iMessage :** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Préférez `chat_id:*` pour des liaisons de groupe stables.
  </ParamField>
  <ParamField path="bindings[].agentId" type="string">
  L'ID d'agent OpenClaw propriétaire.
  </ParamField>
  <ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  Remplacement ACP facultatif.
  </ParamField>
  <ParamField path="bindings[].acp.label" type="string">
  Libellé facultatif visible par l'opérateur.
  </ParamField>
  <ParamField path="bindings[].acp.cwd" type="string">
  Répertoire de travail du runtime facultatif.
  </ParamField>
  <ParamField path="bindings[].acp.backend" type="string">
  Remplacement de backend facultatif.
  </ParamField>

### Valeurs par défaut du runtime par agent

Utilisez `agents.list[].runtime` pour définir les valeurs ACP par défaut une seule fois par agent :

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (ID du harness, par exemple `codex` ou `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Priorité des remplacements pour les sessions ACP liées :**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. Valeurs ACP globales par défaut (par exemple `acp.backend`)

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

- OpenClaw s'assure que la session ACP configurée existe avant utilisation.
- Les messages dans ce canal ou ce sujet sont acheminés vers la session ACP configurée.
- Dans les conversations liées, `/new` et `/reset` réinitialisent en place la même clé de session ACP.
- Les liaisons de runtime temporaires (par exemple créées par des flux de focalisation de thread) s'appliquent toujours lorsqu'elles sont présentes.
- Pour les lancements ACP inter-agents sans `cwd` explicite, OpenClaw hérite de l'espace de travail de l'agent cible depuis la configuration de l'agent.
- Les chemins d'espace de travail hérités manquants reviennent à la valeur `cwd` par défaut du backend ; les échecs d'accès non liés à une absence apparaissent comme des erreurs de lancement.

## Démarrer des sessions ACP

Deux façons de démarrer une session ACP :

<Tabs>
  <Tab title="Depuis sessions_spawn">
    Utilisez `runtime: "acp"` pour démarrer une session ACP à partir d'un tour d'agent ou
    d'un appel d'outil.

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
    `runtime` utilise par défaut `subagent`, donc définissez explicitement `runtime: "acp"`
    pour les sessions ACP. Si `agentId` est omis, OpenClaw utilise
    `acp.defaultAgent` lorsqu'il est configuré. `mode: "session"` nécessite
    `thread: true` pour conserver une conversation liée persistante.
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

    Indicateurs principaux :

    - `--mode persistent|oneshot`
    - `--bind here|off`
    - `--thread auto|here|off`
    - `--cwd <absolute-path>`
    - `--label <name>`

    Voir [Slash commands](/fr/tools/slash-commands).

  </Tab>
</Tabs>

### Paramètres `sessions_spawn`

<ParamField path="task" type="string" required>
  Prompt initial envoyé à la session ACP.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  Doit être `"acp"` pour les sessions ACP.
</ParamField>
<ParamField path="agentId" type="string">
  ID du harness ACP cible. Revient à `acp.defaultAgent` s'il est défini.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Demande le flux de liaison à un thread lorsque c'est pris en charge.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` est one-shot ; `"session"` est persistant. Si `thread: true` et
  que `mode` est omis, OpenClaw peut adopter un comportement persistant par défaut selon
  le chemin de runtime. `mode: "session"` nécessite `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Répertoire de travail demandé pour le runtime (validé par la politique du backend/runtime).
  S'il est omis, le lancement ACP hérite de l'espace de travail de l'agent cible
  lorsqu'il est configuré ; les chemins hérités manquants reviennent aux
  valeurs par défaut du backend, tandis que les véritables erreurs d'accès sont renvoyées.
</ParamField>
<ParamField path="label" type="string">
  Libellé visible par l'opérateur utilisé dans le texte de session/bannière.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Reprend une session ACP existante au lieu d'en créer une nouvelle. L'agent
  rejoue son historique de conversation via `session/load`. Nécessite
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` retransmet les résumés de progression de l'exécution ACP initiale vers la
  session demandeuse sous forme d'événements système. Les réponses acceptées incluent
  `streamLogPath` pointant vers un journal JSONL scoped à la session
  (`<sessionId>.acp-stream.jsonl`) que vous pouvez suivre pour obtenir l'historique complet du relais.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Interrompt le tour enfant ACP après N secondes. `0` maintient le tour sur le
  chemin sans délai d'expiration de la gateway. La même valeur est appliquée à l'exécution Gateway
  et au runtime ACP afin que des harnesses bloqués/quota épuisé n'occupent pas
  indéfiniment la voie de l'agent parent.
</ParamField>
<ParamField path="model" type="string">
  Remplacement explicite du modèle pour la session enfant ACP. Les lancements Codex ACP
  normalisent les références Codex OpenClaw telles que `openai-codex/gpt-5.4` en configuration de démarrage Codex
  ACP avant `session/new` ; les formes avec slash telles que
  `openai-codex/gpt-5.4/high` définissent également l'effort de raisonnement Codex ACP.
  Les autres harnesses doivent annoncer ACP `models` et prendre en charge
  `session/set_model` ; sinon OpenClaw/acpx échoue clairement au lieu
  de revenir silencieusement à la valeur par défaut de l'agent cible.
</ParamField>
<ParamField path="thinking" type="string">
  Effort explicite de thinking/raisonnement. Pour Codex ACP, `minimal` correspond à
  un effort faible, `low`/`medium`/`high`/`xhigh` correspondent directement, et `off`
  omet le remplacement de démarrage de l'effort de raisonnement.
</ParamField>

## Modes de liaison et de thread au lancement

<Tabs>
  <Tab title="--bind here|off">
    | Mode   | Comportement                                                           |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | Lie en place la conversation active actuelle ; échoue si aucune n'est active. |
    | `off`  | Ne crée pas de liaison à la conversation actuelle.                     |

    Remarques :

    - `--bind here` est le chemin opérateur le plus simple pour « faire de ce canal ou chat un espace soutenu par Codex ».
    - `--bind here` ne crée pas de thread enfant.
    - `--bind here` n'est disponible que sur les canaux qui exposent la prise en charge de la liaison à la conversation actuelle.
    - `--bind` et `--thread` ne peuvent pas être combinés dans le même appel `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Mode   | Comportement                                                                                            |
    | ------ | ------------------------------------------------------------------------------------------------------- |
    | `auto` | Dans un thread actif : lie ce thread. En dehors d'un thread : crée/lie un thread enfant lorsque c'est pris en charge. |
    | `here` | Exige le thread actif actuel ; échoue si vous n'êtes pas dans un thread.                               |
    | `off`  | Aucune liaison. La session démarre sans être liée.                                                      |

    Remarques :

    - Sur les surfaces sans liaison de thread, le comportement par défaut est en pratique `off`.
    - Le lancement lié à un thread nécessite la prise en charge de la politique du canal :
      - Discord : `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram : `channels.telegram.threadBindings.spawnAcpSessions=true`
    - Utilisez `--bind here` lorsque vous voulez épingler la conversation actuelle sans créer de thread enfant.

  </Tab>
</Tabs>

## Modèle de livraison

Les sessions ACP peuvent être soit des espaces de travail interactifs, soit du
travail d'arrière-plan appartenant au parent. Le chemin de livraison dépend de cette forme.

<AccordionGroup>
  <Accordion title="Sessions ACP interactives">
    Les sessions interactives sont destinées à continuer à parler sur une surface de chat
    visible :

    - `/acp spawn ... --bind here` lie la conversation actuelle à la session ACP.
    - `/acp spawn ... --thread ...` lie un thread/sujet de canal à la session ACP.
    - Les `bindings[].type="acp"` persistants configurés acheminent les conversations correspondantes vers la même session ACP.

    Les messages de suivi dans la conversation liée sont acheminés directement vers la
    session ACP, et la sortie ACP est renvoyée vers ce même
    canal/thread/sujet.

    Ce qu'OpenClaw envoie au harness :

    - Les suivis liés normaux sont envoyés comme texte de prompt, avec les pièces jointes uniquement lorsque le harness/backend les prend en charge.
    - Les commandes de gestion `/acp` et les commandes Gateway locales sont interceptées avant le dispatch ACP.
    - Les événements de complétion générés par le runtime sont matérialisés par cible. Les agents OpenClaw reçoivent l'enveloppe de contexte de runtime interne d'OpenClaw ; les harnesses ACP externes reçoivent un prompt simple avec le résultat enfant et l'instruction. L'enveloppe brute `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` ne doit jamais être envoyée à des harnesses externes ni conservée comme texte de transcription utilisateur ACP.
    - Les entrées de transcription ACP utilisent le texte déclencheur visible par l'utilisateur ou le prompt de complétion simple. Les métadonnées d'événements internes restent structurées dans OpenClaw lorsque c'est possible et ne sont pas traitées comme contenu de chat rédigé par l'utilisateur.

  </Accordion>
  <Accordion title="Sessions ACP one-shot appartenant au parent">
    Les sessions ACP one-shot lancées par une autre exécution d'agent sont des
    enfants d'arrière-plan, similaires aux sous-agents :

    - Le parent demande du travail avec `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - L'enfant s'exécute dans sa propre session de harness ACP.
    - Les tours enfant s'exécutent sur la même voie d'arrière-plan que celle utilisée par les lancements de sous-agents natifs, afin qu'un harness ACP lent ne bloque pas le travail non lié de la session principale.
    - La complétion remonte via le chemin d'annonce de fin de tâche. OpenClaw convertit les métadonnées internes de complétion en un prompt ACP simple avant de l'envoyer à un harness externe, afin que les harnesses ne voient pas les marqueurs de contexte de runtime réservés à OpenClaw.
    - Le parent réécrit le résultat enfant dans une voix d'assistant normale lorsqu'une réponse visible par l'utilisateur est utile.

    **Ne traitez pas** ce chemin comme un chat pair à pair entre parent
    et enfant. L'enfant dispose déjà d'un canal de complétion vers le
    parent.

  </Accordion>
  <Accordion title="Livraison sessions_send et A2A">
    `sessions_send` peut cibler une autre session après le lancement. Pour les sessions pair normales,
    OpenClaw utilise un chemin de suivi agent-à-agent (A2A)
    après l'injection du message :

    - Attendre la réponse de la session cible.
    - Éventuellement laisser le demandeur et la cible échanger un nombre limité de tours de suivi.
    - Demander à la cible de produire un message d'annonce.
    - Remettre cette annonce au canal ou thread visible.

    Ce chemin A2A est une solution de repli pour les envois pair où l'expéditeur a besoin d'un
    suivi visible. Il reste activé lorsqu'une session non liée peut
    voir et envoyer des messages à une cible ACP, par exemple sous des paramètres larges
    `tools.sessions.visibility`.

    OpenClaw saute le suivi A2A uniquement lorsque le demandeur est le
    parent de son propre enfant ACP one-shot appartenant au parent. Dans ce cas,
    exécuter A2A en plus de la complétion de tâche peut réveiller le parent avec le
    résultat de l'enfant, renvoyer la réponse du parent dans l'enfant, et
    créer une boucle d'écho parent/enfant. Le résultat `sessions_send` signale
    `delivery.status="skipped"` pour ce cas d'enfant possédé parce que le
    chemin de complétion est déjà responsable du résultat.

  </Accordion>
  <Accordion title="Reprendre une session existante">
    Utilisez `resumeSessionId` pour continuer une session ACP précédente au lieu
    d'en démarrer une nouvelle. L'agent rejoue son historique de conversation via
    `session/load`, ce qui lui permet de reprendre avec tout le contexte précédent.

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Cas d'utilisation courants :

    - Transférer une session Codex de votre ordinateur portable à votre téléphone — dites à votre agent de reprendre là où vous vous êtes arrêté.
    - Continuer une session de codage démarrée de façon interactive dans le CLI, maintenant sans interface via votre agent.
    - Reprendre un travail interrompu par un redémarrage de gateway ou un délai d'inactivité.

    Remarques :

    - `resumeSessionId` nécessite `runtime: "acp"` — renvoie une erreur si utilisé avec le runtime de sous-agent.
    - `resumeSessionId` restaure l'historique de conversation ACP amont ; `thread` et `mode` s'appliquent toujours normalement à la nouvelle session OpenClaw que vous créez, donc `mode: "session"` exige toujours `thread: true`.
    - L'agent cible doit prendre en charge `session/load` (Codex et Claude Code le font).
    - Si l'ID de session est introuvable, le lancement échoue avec une erreur claire — aucun retour silencieux vers une nouvelle session.

  </Accordion>
  <Accordion title="Test fumée après déploiement">
    Après un déploiement de gateway, exécutez une vérification live de bout en bout plutôt que
    de vous fier aux tests unitaires :

    1. Vérifiez la version et le commit de la gateway déployée sur l'hôte cible.
    2. Ouvrez une session de pont ACPX temporaire vers un agent live.
    3. Demandez à cet agent d'appeler `sessions_spawn` avec `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` et la tâche `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Vérifiez `accepted=yes`, une vraie `childSessionKey` et l'absence d'erreur de validateur.
    5. Nettoyez la session de pont temporaire.

    Conservez le contrôle sur `mode: "run"` et ignorez `streamTo: "parent"` —
    les chemins `mode: "session"` liés à un thread et de relais de flux sont des passes d'intégration
    séparées et plus riches.

  </Accordion>
</AccordionGroup>

## Compatibilité sandbox

Les sessions ACP s'exécutent actuellement sur le runtime hôte, **pas** à l'intérieur du
sandbox OpenClaw.

<Warning>
**Frontière de sécurité :**

- Le harness externe peut lire/écrire selon ses propres autorisations CLI et le `cwd` sélectionné.
- La politique sandbox d'OpenClaw **n'encapsule pas** l'exécution du harness ACP.
- OpenClaw applique toujours les garde-fous de fonctionnalité ACP, les agents autorisés, la propriété des sessions, les liaisons de canal et la politique de livraison Gateway.
- Utilisez `runtime: "subagent"` pour un travail natif OpenClaw avec sandbox appliqué.
  </Warning>

Limites actuelles :

- Si la session demandeuse est sandboxée, les lancements ACP sont bloqués à la fois pour `sessions_spawn({ runtime: "acp" })` et `/acp spawn`.
- `sessions_spawn` avec `runtime: "acp"` ne prend pas en charge `sandbox: "require"`.

## Résolution de la cible de session

La plupart des actions `/acp` acceptent une cible de session facultative (`session-key`,
`session-id` ou `session-label`).

**Ordre de résolution :**

1. Argument de cible explicite (ou `--session` pour `/acp steer`)
   - essaie d'abord la clé
   - puis l'ID de session au format UUID
   - puis le libellé
2. Liaison du thread actuel (si cette conversation/ce thread est lié à une session ACP).
3. Repli vers la session demandeuse actuelle.

Les liaisons à la conversation actuelle et les liaisons de thread participent toutes deux à
l'étape 2.

Si aucune cible n'est résolue, OpenClaw renvoie une erreur claire
(`Unable to resolve session target: ...`).

## Contrôles ACP

| Commande             | Ce qu'elle fait                                           | Exemple                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Crée une session ACP ; liaison actuelle ou liaison à un thread facultative. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Annule le tour en cours pour la session cible.            | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Envoie une instruction de pilotage à la session en cours. | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Ferme la session et délie les cibles de thread.           | `/acp close`                                                  |
| `/acp status`        | Affiche le backend, le mode, l'état, les options de runtime et les capacités. | `/acp status`                                                 |
| `/acp set-mode`      | Définit le mode de runtime pour la session cible.         | `/acp set-mode plan`                                          |
| `/acp set`           | Écriture générique d'une option de configuration du runtime. | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Définit le remplacement du répertoire de travail du runtime. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Définit le profil de politique d'approbation.             | `/acp permissions strict`                                     |
| `/acp timeout`       | Définit le délai d'expiration du runtime (secondes).      | `/acp timeout 120`                                            |
| `/acp model`         | Définit le remplacement du modèle de runtime.             | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Supprime les remplacements d'options de runtime de la session. | `/acp reset-options`                                          |
| `/acp sessions`      | Liste les sessions ACP récentes depuis le store.          | `/acp sessions`                                               |
| `/acp doctor`        | Santé du backend, capacités, correctifs exploitables.     | `/acp doctor`                                                 |
| `/acp install`       | Affiche les étapes d'installation et d'activation déterministes. | `/acp install`                                                |

`/acp status` affiche les options de runtime effectives ainsi que les identifiants de session au niveau du runtime et
au niveau du backend. Les erreurs de contrôle non pris en charge apparaissent
clairement lorsqu'un backend ne dispose pas d'une capacité. `/acp sessions` lit le
store pour la session actuellement liée ou demandeuse ; les jetons cibles
(`session-key`, `session-id` ou `session-label`) sont résolus via la
découverte de session gateway, y compris les racines personnalisées `session.store`
par agent.

### Mappage des options de runtime

`/acp` dispose de commandes de commodité et d'un setter générique. Opérations
équivalentes :

| Commande                     | Correspond à                         | Remarques                                                                                                                                                                       |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | Clé de configuration runtime `model` | Pour Codex ACP, OpenClaw normalise `openai-codex/<model>` vers l'ID de modèle de l'adaptateur et mappe les suffixes de raisonnement slash tels que `openai-codex/gpt-5.4/high` vers `reasoning_effort`. |
| `/acp set thinking <level>`  | Clé de configuration runtime `thinking` | Pour Codex ACP, OpenClaw envoie le `reasoning_effort` correspondant lorsque l'adaptateur en prend un en charge.                                                                |
| `/acp permissions <profile>` | Clé de configuration runtime `approval_policy` | —                                                                                                                                                                               |
| `/acp timeout <seconds>`     | Clé de configuration runtime `timeout` | —                                                                                                                                                                               |
| `/acp cwd <path>`            | Remplacement `cwd` du runtime        | Mise à jour directe.                                                                                                                                                            |
| `/acp set <key> <value>`     | Générique                            | `key=cwd` utilise le chemin de remplacement `cwd`.                                                                                                                              |
| `/acp reset-options`         | efface tous les remplacements de runtime | —                                                                                                                                                                               |

## Harness acpx, configuration du Plugin et autorisations

Pour la configuration du harness acpx (alias Claude Code / Codex / Gemini CLI
), les ponts MCP des plugin-tools et des outils OpenClaw, et les modes
d'autorisation ACP, voir
[ACP agents — setup](/fr/tools/acp-agents-setup).

## Dépannage

| Symptôme                                                                    | Cause probable                                                                  | Correctif                                                                                                                                                                 |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Plugin backend manquant, désactivé ou bloqué par `plugins.allow`.               | Installez et activez le Plugin backend, incluez `acpx` dans `plugins.allow` lorsque cette liste d'autorisation est définie, puis exécutez `/acp doctor`.               |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP est désactivé globalement.                                                  | Définissez `acp.enabled=true`.                                                                                                                                            |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Le dispatch depuis les messages normaux du thread est désactivé.                | Définissez `acp.dispatch.enabled=true`.                                                                                                                                   |
| `ACP agent "<id>" is not allowed by policy`                                 | L'agent n'est pas dans la liste d'autorisation.                                 | Utilisez un `agentId` autorisé ou mettez à jour `acp.allowedAgents`.                                                                                                     |
| `/acp doctor` reports backend not ready right after startup                 | La sonde de dépendance du Plugin ou l'auto-réparation est toujours en cours.    | Attendez un peu et relancez `/acp doctor` ; si l'état reste dégradé, inspectez l'erreur d'installation du backend et la politique allow/deny du Plugin.                |
| Harness command not found                                                   | Le CLI de l'adaptateur n'est pas installé ou la récupération `npx` du premier lancement a échoué. | Installez/préchauffez l'adaptateur sur l'hôte Gateway, ou configurez explicitement la commande de l'agent acpx.                                                         |
| Model-not-found from the harness                                            | L'ID de modèle est valide pour un autre provider/harness mais pas pour cette cible ACP. | Utilisez un modèle listé par ce harness, configurez le modèle dans le harness, ou omettez le remplacement.                                                              |
| Vendor auth error from the harness                                          | OpenClaw est sain, mais le CLI/provider cible n'est pas connecté.               | Connectez-vous ou fournissez la clé provider requise dans l'environnement de l'hôte Gateway.                                                                             |
| `Unable to resolve session target: ...`                                     | Mauvais jeton de clé/ID/libellé.                                                | Exécutez `/acp sessions`, copiez la clé/le libellé exact, puis réessayez.                                                                                                |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` a été utilisé sans conversation active pouvant être liée.         | Déplacez-vous vers le chat/canal cible et réessayez, ou utilisez un lancement sans liaison.                                                                              |
| `Conversation bindings are unavailable for <channel>.`                      | L'adaptateur ne prend pas en charge la liaison ACP à la conversation actuelle.  | Utilisez `/acp spawn ... --thread ...` lorsque c'est pris en charge, configurez `bindings[]` au niveau supérieur, ou passez à un canal pris en charge.                  |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` a été utilisé en dehors d'un contexte de thread.                | Déplacez-vous vers le thread cible ou utilisez `--thread auto`/`off`.                                                                                                    |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Un autre utilisateur est propriétaire de la cible de liaison active.            | Reliez à nouveau en tant que propriétaire ou utilisez une autre conversation ou un autre thread.                                                                         |
| `Thread bindings are unavailable for <channel>.`                            | L'adaptateur ne prend pas en charge la liaison de thread.                       | Utilisez `--thread off` ou passez à un adaptateur/canal pris en charge.                                                                                                  |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Le runtime ACP est côté hôte ; la session demandeuse est sandboxée.             | Utilisez `runtime="subagent"` depuis des sessions sandboxées, ou lancez ACP depuis une session non sandboxée.                                                            |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` est demandé pour le runtime ACP.                            | Utilisez `runtime="subagent"` pour un sandbox obligatoire, ou utilisez ACP avec `sandbox="inherit"` depuis une session non sandboxée.                                    |
| `Cannot apply --model ... did not advertise model support`                  | Le harness cible n'expose pas le changement de modèle ACP générique.            | Utilisez un harness qui annonce ACP `models`/`session/set_model`, utilisez des références de modèle Codex ACP, ou configurez directement le modèle dans le harness s'il a son propre indicateur de démarrage. |
| Missing ACP metadata for bound session                                      | Métadonnées de session ACP périmées/supprimées.                                 | Recréez avec `/acp spawn`, puis reliez/recentrez le thread.                                                                                                               |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` bloque les écritures/exécutions dans une session ACP non interactive. | Définissez `plugins.entries.acpx.config.permissionMode` sur `approve-all` et redémarrez la gateway. Voir [Permission configuration](/fr/tools/acp-agents-setup#permission-configuration). |
| ACP session fails early with little output                                  | Les invites d'autorisation sont bloquées par `permissionMode`/`nonInteractivePermissions`. | Vérifiez les journaux de la gateway pour `AcpRuntimeError`. Pour des autorisations complètes, définissez `permissionMode=approve-all` ; pour une dégradation élégante, définissez `nonInteractivePermissions=deny`. |
| ACP session stalls indefinitely after completing work                       | Le processus harness s'est terminé mais la session ACP n'a pas signalé la fin.  | Surveillez avec `ps aux \| grep acpx` ; tuez manuellement les processus périmés.                                                                                          |
| Harness sees `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | L'enveloppe d'événement interne a fuité à travers la frontière ACP.             | Mettez à jour OpenClaw et relancez le flux de complétion ; les harnesses externes ne doivent recevoir que des prompts de complétion simples.                             |

## Liens connexes

- [ACP agents — setup](/fr/tools/acp-agents-setup)
- [Agent send](/fr/tools/agent-send)
- [CLI Backends](/fr/gateway/cli-backends)
- [Codex harness](/fr/plugins/codex-harness)
- [Multi-agent sandbox tools](/fr/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (mode pont)](/fr/cli/acp)
- [Sub-agents](/fr/tools/subagents)
