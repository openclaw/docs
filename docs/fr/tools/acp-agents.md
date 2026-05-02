---
read_when:
    - Exécuter des harnais de codage via ACP
    - Configurer des sessions ACP liées à une conversation sur les canaux de messagerie
    - Lier une conversation de canal de messagerie à une session ACP persistante
    - Dépannage du backend ACP, du câblage Plugin ou de la livraison des complétions
    - Utiliser les commandes /acp depuis la conversation
sidebarTitle: ACP agents
summary: Exécuter des harnais de codage externes (Claude Code, Cursor, Gemini CLI, Codex ACP explicite, OpenClaw ACP, OpenCode) via le service dorsal ACP
title: Agents ACP
x-i18n:
    generated_at: "2026-05-02T07:20:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 36a1c58b22d0f615e20e84fcdb15c39800825ee0bad64c966d6f14d44d3c1458
    source_path: tools/acp-agents.md
    workflow: 16
---

Les sessions [Agent Client Protocol (ACP)](https://agentclientprotocol.com/)
permettent à OpenClaw d’exécuter des harnais de codage externes (par exemple Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI et d’autres
harnais ACPX pris en charge) via un Plugin backend ACP.

Chaque création de session ACP est suivie comme une [tâche en arrière-plan](/fr/automation/tasks).

<Note>
**ACP est le chemin des harnais externes, pas le chemin Codex par défaut.** Le
Plugin natif de serveur d’application Codex possède les contrôles `/codex ...` et le
runtime intégré `agentRuntime.id: "codex"` ; ACP possède
les contrôles `/acp ...` et les sessions `sessions_spawn({ runtime: "acp" })`.

Si vous voulez que Codex ou Claude Code se connecte comme client MCP externe
directement aux conversations de canal OpenClaw existantes, utilisez
[`openclaw mcp serve`](/fr/cli/mcp) plutôt qu’ACP.
</Note>

## Quelle page me faut-il ?

| Vous voulez…                                                                                    | Utilisez ceci                         | Notes                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lier ou contrôler Codex dans la conversation actuelle                                           | `/codex bind`, `/codex threads`       | Chemin natif du serveur d’application Codex lorsque le Plugin `codex` est activé ; inclut les réponses de chat liées, le transfert d’images, les contrôles de modèle/rapide/autorisations, d’arrêt et d’orientation. ACP est une solution de repli explicite |
| Exécuter Claude Code, Gemini CLI, Codex ACP explicite ou un autre harnais externe _via_ OpenClaw | Cette page                            | Sessions liées au chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tâches en arrière-plan, contrôles de runtime                                                                       |
| Exposer une session OpenClaw Gateway _comme_ serveur ACP pour un éditeur ou un client           | [`openclaw acp`](/fr/cli/acp)            | Mode pont. L’IDE/client parle ACP à OpenClaw via stdio/WebSocket                                                                                                                              |
| Réutiliser une CLI IA locale comme modèle de repli texte uniquement                             | [Backends CLI](/fr/gateway/cli-backends) | Pas ACP. Aucun outil OpenClaw, aucun contrôle ACP, aucun runtime de harnais                                                                                                                   |

## Est-ce que cela fonctionne dès l’installation ?

Généralement oui. Les nouvelles installations sont livrées avec le Plugin de runtime
`acpx` groupé activé par défaut, avec un binaire `acpx` épinglé local au Plugin
qu’OpenClaw sonde et autorépare immédiatement après que l’écouteur HTTP du Gateway
est actif. Exécutez `/acp doctor` pour vérifier l’état de préparation.

OpenClaw n’enseigne la création ACP aux agents que lorsque ACP est **réellement
utilisable** : ACP doit être activé, l’envoi ne doit pas être désactivé, la session
actuelle ne doit pas être bloquée par le bac à sable, et un backend de runtime doit être
chargé. Si ces conditions ne sont pas remplies, les Skills du Plugin ACP et les
indications ACP `sessions_spawn` restent masquées afin que l’agent ne suggère pas
un backend indisponible.

<AccordionGroup>
  <Accordion title="Points à surveiller au premier lancement">
    - Si `plugins.allow` est défini, il s’agit d’un inventaire de Plugins restrictif et il **doit** inclure `acpx` ; sinon, la valeur par défaut groupée est volontairement bloquée et `/acp doctor` signale l’entrée manquante dans la liste d’autorisation.
    - L’adaptateur Codex ACP groupé est livré avec le Plugin `acpx` et lancé localement lorsque c’est possible.
    - D’autres adaptateurs de harnais cibles peuvent encore être récupérés à la demande avec `npx` la première fois que vous les utilisez.
    - L’authentification du fournisseur doit toujours exister sur l’hôte pour ce harnais.
    - Si l’hôte n’a pas npm ou d’accès réseau, les récupérations d’adaptateurs au premier lancement échouent jusqu’à ce que les caches soient préchauffés ou que l’adaptateur soit installé autrement.

  </Accordion>
  <Accordion title="Prérequis de runtime">
    ACP lance un véritable processus de harnais externe. OpenClaw possède le routage,
    l’état des tâches en arrière-plan, la livraison, les liaisons et la politique ; le harnais
    possède sa connexion fournisseur, son catalogue de modèles, son comportement de système de fichiers et
    ses outils natifs.

    Avant d’incriminer OpenClaw, vérifiez :

    - `/acp doctor` signale un backend activé et sain.
    - L’identifiant cible est autorisé par `acp.allowedAgents` lorsque cette liste d’autorisation est définie.
    - La commande du harnais peut démarrer sur l’hôte Gateway.
    - L’authentification du fournisseur est présente pour ce harnais (`claude`, `codex`, `gemini`, `opencode`, `droid`, etc.).
    - Le modèle sélectionné existe pour ce harnais — les identifiants de modèle ne sont pas portables entre harnais.
    - Le `cwd` demandé existe et est accessible, ou omettez `cwd` et laissez le backend utiliser sa valeur par défaut.
    - Le mode d’autorisation correspond au travail. Les sessions non interactives ne peuvent pas cliquer sur les invites d’autorisation natives ; les exécutions de codage lourdes en écriture/exécution nécessitent donc généralement un profil d’autorisation ACPX capable de progresser sans interface.

  </Accordion>
</AccordionGroup>

Les outils de Plugins OpenClaw et les outils OpenClaw intégrés ne sont **pas** exposés
aux harnais ACP par défaut. Activez les ponts MCP explicites dans
[Agents ACP — configuration](/fr/tools/acp-agents-setup) uniquement lorsque le harnais
doit appeler ces outils directement.

## Cibles de harnais prises en charge

Avec le backend `acpx` groupé, utilisez ces identifiants de harnais comme cibles `/acp spawn <id>`
ou `sessions_spawn({ runtime: "acp", agentId: "<id>" })` :

| Identifiant de harnais | Backend typique                               | Notes                                                                               |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Adaptateur Claude Code ACP                     | Nécessite l’authentification Claude Code sur l’hôte.                                |
| `codex`    | Adaptateur Codex ACP                           | Repli ACP explicite uniquement lorsque `/codex` natif est indisponible ou qu’ACP est demandé. |
| `copilot`  | Adaptateur GitHub Copilot ACP                  | Nécessite l’authentification CLI/runtime Copilot.                                   |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | Remplacez la commande acpx si une installation locale expose un point d’entrée ACP différent. |
| `droid`    | Factory Droid CLI                              | Nécessite l’authentification Factory/Droid ou `FACTORY_API_KEY` dans l’environnement du harnais. |
| `gemini`   | Adaptateur Gemini CLI ACP                      | Nécessite l’authentification Gemini CLI ou la configuration d’une clé API.           |
| `iflow`    | iFlow CLI                                      | La disponibilité de l’adaptateur et le contrôle du modèle dépendent de la CLI installée. |
| `kilocode` | Kilo Code CLI                                  | La disponibilité de l’adaptateur et le contrôle du modèle dépendent de la CLI installée. |
| `kimi`     | Kimi/Moonshot CLI                              | Nécessite l’authentification Kimi/Moonshot sur l’hôte.                              |
| `kiro`     | Kiro CLI                                       | La disponibilité de l’adaptateur et le contrôle du modèle dépendent de la CLI installée. |
| `opencode` | Adaptateur OpenCode ACP                        | Nécessite l’authentification OpenCode CLI/fournisseur.                              |
| `openclaw` | Pont OpenClaw Gateway via `openclaw acp`       | Permet à un harnais compatible ACP de reparler à une session OpenClaw Gateway.       |
| `pi`       | Runtime Pi/OpenClaw intégré                    | Utilisé pour les expérimentations de harnais natifs OpenClaw.                       |
| `qwen`     | Qwen Code / Qwen CLI                           | Nécessite une authentification compatible Qwen sur l’hôte.                          |

Les alias d’agents acpx personnalisés peuvent être configurés dans acpx lui-même, mais la
politique OpenClaw vérifie toujours `acp.allowedAgents` et tout mappage
`agents.list[].runtime.acp.agent` avant l’envoi.

## Guide opérationnel

Flux `/acp` rapide depuis le chat :

<Steps>
  <Step title="Créer">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`, ou
    `/acp spawn codex --bind here` explicite.
  </Step>
  <Step title="Travailler">
    Continuez dans la conversation ou le fil lié (ou ciblez explicitement
    la clé de session).
  </Step>
  <Step title="Vérifier l’état">
    `/acp status`
  </Step>
  <Step title="Ajuster">
    `/acp model <provider/model>`,
    `/acp permissions <profile>`,
    `/acp timeout <seconds>`.
  </Step>
  <Step title="Orienter">
    Sans remplacer le contexte : `/acp steer tighten logging and continue`.
  </Step>
  <Step title="Arrêter">
    `/acp cancel` (tour actuel) ou `/acp close` (session + liaisons).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Détails du cycle de vie">
    - La création crée ou reprend une session de runtime ACP, enregistre les métadonnées ACP dans le magasin de sessions OpenClaw et peut créer une tâche en arrière-plan lorsque l’exécution est possédée par le parent.
    - Les sessions ACP possédées par le parent sont traitées comme un travail en arrière-plan même lorsque la session de runtime est persistante ; l’achèvement et la livraison entre surfaces passent par le notificateur de tâche parent plutôt que de se comporter comme une session de chat normale destinée à l’utilisateur.
    - La maintenance des tâches ferme les sessions ACP ponctuelles terminales ou orphelines possédées par le parent. Les sessions ACP persistantes sont conservées tant qu’une liaison de conversation active subsiste ; les sessions persistantes obsolètes sans liaison active sont fermées afin qu’elles ne puissent pas être reprises silencieusement après la fin de la tâche propriétaire ou la disparition de son enregistrement de tâche.
    - Les messages de suivi liés vont directement à la session ACP jusqu’à ce que la liaison soit fermée, perde le focus, soit réinitialisée ou expire.
    - Les commandes Gateway restent locales. `/acp ...`, `/status` et `/unfocus` ne sont jamais envoyés comme texte d’invite normal à un harnais ACP lié.
    - `cancel` abandonne le tour actif lorsque le backend prend en charge l’annulation ; cela ne supprime pas la liaison ni les métadonnées de session.
    - `close` termine la session ACP du point de vue d’OpenClaw et supprime la liaison. Un harnais peut encore conserver son propre historique amont s’il prend en charge la reprise.
    - Les workers de runtime inactifs peuvent être nettoyés après `acp.runtime.ttlMinutes` ; les métadonnées de session stockées restent disponibles pour `/acp sessions`.

  </Accordion>
  <Accordion title="Règles de routage Codex natif">
    Déclencheurs en langage naturel qui doivent être routés vers le **Plugin Codex natif**
    lorsqu’il est activé :

    - "Liez ce canal Discord à Codex."
    - "Attachez ce chat au fil Codex `<id>`."
    - "Affichez les fils Codex, puis liez celui-ci."

    La liaison de conversation Codex native est le chemin de contrôle de chat par défaut.
    Les outils dynamiques OpenClaw s’exécutent toujours via OpenClaw, tandis que
    les outils natifs Codex comme shell/apply-patch s’exécutent dans Codex.
    Pour les événements d’outils natifs Codex, OpenClaw injecte un relais de hook natif
    par tour afin que les hooks de Plugin puissent bloquer `before_tool_call`, observer
    `after_tool_call` et router les événements Codex `PermissionRequest`
    via les approbations OpenClaw. Les hooks Codex `Stop` sont relayés vers
    OpenClaw `before_agent_finalize`, où les Plugins peuvent demander un passage de modèle
    supplémentaire avant que Codex finalise sa réponse. Le relais reste
    volontairement conservateur : il ne modifie pas les arguments des outils natifs Codex
    et ne réécrit pas les enregistrements de fil Codex. Utilisez ACP explicite uniquement
    lorsque vous voulez le modèle de runtime/session ACP. La limite de prise en charge
    Codex intégrée est documentée dans le
    [contrat de prise en charge du harnais Codex v1](/fr/plugins/codex-harness#v1-support-contract).

  </Accordion>
  <Accordion title="Aide-mémoire pour la sélection du modèle, du fournisseur et de l’exécution">
    - `openai-codex/*` — route OAuth/abonnement PI Codex.
    - `openai/*` plus `agentRuntime.id: "codex"` — exécution intégrée native du serveur d’application Codex.
    - `/codex ...` — contrôle natif de conversation Codex.
    - `/acp ...` ou `runtime: "acp"` — contrôle ACP/acpx explicite.

  </Accordion>
  <Accordion title="Déclencheurs en langage naturel pour le routage ACP">
    Déclencheurs qui doivent router vers l’exécution ACP :

    - "Exécute ceci comme une session Claude Code ACP ponctuelle et résume le résultat."
    - "Utilise Gemini CLI pour cette tâche dans un fil, puis garde les suivis dans ce même fil."
    - "Exécute Codex via ACP dans un fil en arrière-plan."

    OpenClaw choisit `runtime: "acp"`, résout le harnais `agentId`,
    se lie à la conversation ou au fil actuel lorsque cela est pris en charge, et
    route les suivis vers cette session jusqu’à sa fermeture ou son expiration. Codex ne
    suit ce chemin que lorsque ACP/acpx est explicite ou que le Plugin Codex
    natif n’est pas disponible pour l’opération demandée.

    Pour `sessions_spawn`, `runtime: "acp"` n’est annoncé que lorsque ACP
    est activé, que le demandeur n’est pas placé en sandbox et qu’un backend
    d’exécution ACP est chargé. `acp.dispatch.enabled=false` suspend la répartition
    automatique des fils ACP, mais ne masque ni ne bloque les appels explicites
    `sessions_spawn({ runtime: "acp" })`. Il cible des identifiants de harnais ACP tels que `codex`,
    `claude`, `droid`, `gemini` ou `opencode`. Ne transmettez pas un identifiant
    d’agent de configuration OpenClaw normal provenant de `agents_list`, sauf si cette entrée est
    explicitement configurée avec `agents.list[].runtime.type="acp"` ;
    sinon, utilisez l’exécution de sous-agent par défaut. Lorsqu’un agent OpenClaw
    est configuré avec `runtime.type="acp"`, OpenClaw utilise
    `runtime.acp.agent` comme identifiant de harnais sous-jacent.

  </Accordion>
</AccordionGroup>

## ACP contre sous-agents

Utilisez ACP lorsque vous voulez une exécution de harnais externe. Utilisez le **serveur d’application Codex
natif** pour la liaison et le contrôle de conversation Codex lorsque le Plugin `codex`
est activé. Utilisez les **sous-agents** lorsque vous voulez des
exécutions déléguées natives d’OpenClaw.

| Domaine       | Session ACP                           | Exécution de sous-agent             |
| ------------- | ------------------------------------- | ----------------------------------- |
| Exécution     | Plugin backend ACP (par exemple acpx) | Exécution native de sous-agent OpenClaw |
| Clé de session | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`   |
| Commandes principales | `/acp ...`                            | `/subagents ...`                    |
| Outil de lancement | `sessions_spawn` avec `runtime:"acp"` | `sessions_spawn` (exécution par défaut) |

Voir aussi [Sous-agents](/fr/tools/subagents).

## Comment ACP exécute Claude Code

Pour Claude Code via ACP, la pile est :

1. Plan de contrôle de session ACP OpenClaw.
2. Plugin d’exécution `acpx` intégré.
3. Adaptateur Claude ACP.
4. Mécanique d’exécution/de session côté Claude.

ACP Claude est une **session de harnais** avec contrôles ACP, reprise de session,
suivi des tâches en arrière-plan et liaison facultative de conversation/fil.

Les backends CLI sont des exécutions de secours locales textuelles distinctes — voir
[Backends CLI](/fr/gateway/cli-backends).

Pour les opérateurs, la règle pratique est :

- **Vous voulez `/acp spawn`, des sessions liables, des contrôles d’exécution ou un travail de harnais persistant ?** Utilisez ACP.
- **Vous voulez un secours textuel local simple via le CLI brut ?** Utilisez les backends CLI.

## Sessions liées

### Modèle mental

- **Surface de chat** — là où les personnes continuent de parler (canal Discord, sujet Telegram, discussion iMessage).
- **Session ACP** — l’état d’exécution durable Codex/Claude/Gemini vers lequel OpenClaw route.
- **Fil/sujet enfant** — une surface de messagerie supplémentaire facultative créée uniquement par `--thread ...`.
- **Espace de travail d’exécution** — l’emplacement du système de fichiers (`cwd`, checkout de dépôt, espace de travail backend) où le harnais s’exécute. Indépendant de la surface de chat.

### Liaisons à la conversation actuelle

`/acp spawn <harness> --bind here` épingle la conversation actuelle à la
session ACP lancée — pas de fil enfant, même surface de chat. OpenClaw conserve
la propriété du transport, de l’authentification, de la sécurité et de la livraison. Les messages de suivi dans cette
conversation sont routés vers la même session ; `/new` et `/reset` réinitialisent la
session sur place ; `/acp close` supprime la liaison.

Exemples :

```text
/codex bind                                              # liaison native Codex, route les futurs messages ici
/codex model gpt-5.4                                     # ajuste le fil Codex natif lié
/codex stop                                              # contrôle le tour Codex natif actif
/acp spawn codex --bind here                             # secours ACP explicite pour Codex
/acp spawn codex --thread auto                           # peut créer un fil/sujet enfant et s’y lier
/acp spawn codex --bind here --cwd /workspace/repo       # même liaison de chat, Codex s’exécute dans /workspace/repo
```

<AccordionGroup>
  <Accordion title="Règles de liaison et exclusivité">
    - `--bind here` et `--thread ...` sont mutuellement exclusifs.
    - `--bind here` ne fonctionne que sur les canaux qui annoncent la liaison à la conversation actuelle ; sinon OpenClaw renvoie un message clair indiquant que ce n’est pas pris en charge. Les liaisons persistent après les redémarrages du Gateway.
    - Sur Discord, `spawnSessions` contrôle la création de fils enfants pour `--thread auto|here` — pas `--bind here`.
    - Si vous lancez vers un autre agent ACP sans `--cwd`, OpenClaw hérite par défaut de l’espace de travail de **l’agent cible**. Les chemins hérités manquants (`ENOENT`/`ENOTDIR`) reviennent au comportement par défaut du backend ; les autres erreurs d’accès (par exemple `EACCES`) apparaissent comme des erreurs de lancement.
    - Les commandes de gestion du Gateway restent locales dans les conversations liées — les commandes `/acp ...` sont traitées par OpenClaw même lorsque le texte de suivi normal est routé vers la session ACP liée ; `/status` et `/unfocus` restent également locales chaque fois que la gestion des commandes est activée pour cette surface.

  </Accordion>
  <Accordion title="Sessions liées à un fil">
    Lorsque les liaisons de fils sont activées pour un adaptateur de canal :

    - OpenClaw lie un fil à une session ACP cible.
    - Les messages de suivi dans ce fil sont routés vers la session ACP liée.
    - La sortie ACP est renvoyée au même fil.
    - La suppression du focus, la fermeture, l’archivage, l’expiration par inactivité ou l’expiration par âge maximal supprime la liaison.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` et `/unfocus` sont des commandes Gateway, pas des prompts envoyés au harnais ACP.

    Indicateurs de fonctionnalité requis pour ACP lié à un fil :

    - `acp.enabled=true`
    - `acp.dispatch.enabled` est activé par défaut (définissez `false` pour suspendre la répartition automatique des fils ACP ; les appels explicites `sessions_spawn({ runtime: "acp" })` fonctionnent toujours).
    - Lancement de sessions de fil par adaptateur de canal activé (par défaut : `true`) :
      - Discord : `channels.discord.threadBindings.spawnSessions=true`
      - Telegram : `channels.telegram.threadBindings.spawnSessions=true`

    La prise en charge des liaisons de fils est propre à chaque adaptateur. Si l’adaptateur de canal
    actif ne prend pas en charge les liaisons de fils, OpenClaw renvoie un message clair
    indiquant que ce n’est pas pris en charge ou pas disponible.

  </Accordion>
  <Accordion title="Canaux prenant en charge les fils">
    - Tout adaptateur de canal qui expose une capacité de liaison de session/fil.
    - Prise en charge intégrée actuelle : fils/canaux **Discord**, sujets **Telegram** (sujets de forum dans les groupes/supergroupes et sujets de DM).
    - Les canaux Plugin peuvent ajouter une prise en charge via la même interface de liaison.

  </Accordion>
</AccordionGroup>

## Liaisons de canal persistantes

Pour les workflows non éphémères, configurez les liaisons ACP persistantes dans
les entrées de premier niveau `bindings[]`.

### Modèle de liaison

<ParamField path="bindings[].type" type='"acp"'>
  Marque une liaison de conversation ACP persistante.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Identifie la conversation cible. Formes par canal :

- **Canal/fil Discord :** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Sujet de forum Telegram :** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/groupe BlueBubbles :** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Préférez `chat_id:*` ou `chat_identifier:*` pour les liaisons de groupe stables.
- **DM/groupe iMessage :** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Préférez `chat_id:*` pour les liaisons de groupe stables.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  L’identifiant de l’agent OpenClaw propriétaire.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  Remplacement ACP facultatif.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  Libellé facultatif destiné à l’opérateur.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  Répertoire de travail d’exécution facultatif.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  Remplacement de backend facultatif.
</ParamField>

### Valeurs d’exécution par défaut par agent

Utilisez `agents.list[].runtime` pour définir les valeurs ACP par défaut une fois par agent :

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (identifiant de harnais, par exemple `codex` ou `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Priorité des remplacements pour les sessions ACP liées :**

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

- OpenClaw s’assure que la session ACP configurée existe avant utilisation.
- Les messages dans ce canal ou ce sujet sont routés vers la session ACP configurée.
- Dans les conversations liées, `/new` et `/reset` réinitialisent sur place la même clé de session ACP.
- Les liaisons d’exécution temporaires (par exemple créées par des flux de focus de fil) continuent de s’appliquer lorsqu’elles sont présentes.
- Pour les lancements ACP inter-agents sans `cwd` explicite, OpenClaw hérite de l’espace de travail de l’agent cible depuis la configuration de l’agent.
- Les chemins d’espace de travail hérités manquants reviennent au cwd par défaut du backend ; les échecs d’accès non liés à une absence apparaissent comme des erreurs de lancement.

## Démarrer des sessions ACP

Deux façons de démarrer une session ACP :

<Tabs>
  <Tab title="Depuis sessions_spawn">
    Utilisez `runtime: "acp"` pour démarrer une session ACP depuis un tour d’agent ou
    un appel d’outil.

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
    `runtime` vaut par défaut `subagent`, définissez donc explicitement `runtime: "acp"`
    pour les sessions ACP. Si `agentId` est omis, OpenClaw utilise
    `acp.defaultAgent` lorsqu’il est configuré. `mode: "session"` nécessite
    `thread: true` pour conserver une conversation liée persistante.
    </Note>

  </Tab>
  <Tab title="From /acp command">
    Utilisez `/acp spawn` pour un contrôle opérateur explicite depuis le chat.

    ```text
    /acp spawn codex --mode persistent --thread auto
    /acp spawn codex --mode oneshot --thread off
    /acp spawn codex --bind here
    /acp spawn codex --thread here
    ```

    Options clés :

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
  Prompt initial envoyé à la session ACP.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  Doit être `"acp"` pour les sessions ACP.
</ParamField>
<ParamField path="agentId" type="string">
  Identifiant du harnais cible ACP. Se rabat sur `acp.defaultAgent` s’il est défini.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Demande le flux de liaison de fil de discussion lorsqu’il est pris en charge.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` est ponctuel ; `"session"` est persistant. Si `thread: true` et
  `mode` est omis, OpenClaw peut utiliser par défaut un comportement persistant selon
  le chemin runtime. `mode: "session"` nécessite `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Répertoire de travail runtime demandé (validé par la politique du backend/runtime).
  S’il est omis, la création ACP hérite de l’espace de travail de l’agent cible
  lorsqu’il est configuré ; les chemins hérités manquants se rabattent sur les valeurs
  par défaut du backend, tandis que les erreurs d’accès réelles sont renvoyées.
</ParamField>
<ParamField path="label" type="string">
  Libellé destiné à l’opérateur utilisé dans le texte de session/bannière.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Reprend une session ACP existante au lieu d’en créer une nouvelle. L’agent
  rejoue l’historique de sa conversation via `session/load`. Nécessite
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` diffuse les résumés de progression initiaux de l’exécution ACP vers la
  session demandeuse sous forme d’événements système. Les réponses acceptées incluent
  `streamLogPath` pointant vers un journal JSONL limité à la session
  (`<sessionId>.acp-stream.jsonl`) que vous pouvez suivre pour l’historique complet du relais.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Interrompt le tour enfant ACP après N secondes. `0` conserve le tour sur le chemin
  sans expiration du Gateway. La même valeur est appliquée à l’exécution Gateway
  et au runtime ACP afin que les harnais bloqués ou ayant épuisé leur quota
  n’occupent pas indéfiniment la voie de l’agent parent.
</ParamField>
<ParamField path="model" type="string">
  Remplacement explicite du modèle pour la session enfant ACP. Les créations Codex ACP
  normalisent les références OpenClaw Codex comme `openai-codex/gpt-5.4` vers la
  configuration de démarrage Codex ACP avant `session/new` ; les formes slash comme
  `openai-codex/gpt-5.4/high` définissent aussi l’effort de raisonnement Codex ACP.
  Les autres harnais doivent annoncer les `models` ACP et prendre en charge
  `session/set_model` ; sinon OpenClaw/acpx échoue clairement au lieu de se rabattre
  silencieusement sur la valeur par défaut de l’agent cible.
</ParamField>
<ParamField path="thinking" type="string">
  Effort explicite de réflexion/raisonnement. Pour Codex ACP, `minimal` correspond à
  un effort faible, `low`/`medium`/`high`/`xhigh` correspondent directement, et `off`
  omet le remplacement de démarrage de l’effort de raisonnement.
</ParamField>

## Modes de liaison et de fil de discussion à la création

<Tabs>
  <Tab title="--bind here|off">
    | Mode   | Comportement                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | Lie la conversation active actuelle en place ; échoue si aucune n’est active. |
    | `off`  | Ne crée pas de liaison de conversation actuelle.                          |

    Notes :

    - `--bind here` est le chemin opérateur le plus simple pour « adosser ce canal ou ce chat à Codex ».
    - `--bind here` ne crée pas de fil enfant.
    - `--bind here` est disponible uniquement sur les canaux qui exposent la prise en charge de la liaison de conversation actuelle.
    - `--bind` et `--thread` ne peuvent pas être combinés dans le même appel `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Mode   | Comportement                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | Dans un fil actif : lie ce fil. Hors d’un fil : crée/lie un fil enfant lorsque c’est pris en charge. |
    | `here` | Exige le fil actif actuel ; échoue si vous n’êtes pas dans un fil.                                                  |
    | `off`  | Aucune liaison. La session démarre sans liaison.                                                                 |

    Notes :

    - Sur les surfaces sans liaison de fil, le comportement par défaut est effectivement `off`.
    - La création liée à un fil nécessite la prise en charge de la politique du canal :
      - Discord : `channels.discord.threadBindings.spawnSessions=true`
      - Telegram : `channels.telegram.threadBindings.spawnSessions=true`
    - Utilisez `--bind here` lorsque vous voulez épingler la conversation actuelle sans créer de fil enfant.

  </Tab>
</Tabs>

## Modèle de livraison

Les sessions ACP peuvent être soit des espaces de travail interactifs, soit
du travail en arrière-plan détenu par le parent. Le chemin de livraison dépend
de cette forme.

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    Les sessions interactives sont destinées à continuer à dialoguer sur une surface
    de chat visible :

    - `/acp spawn ... --bind here` lie la conversation actuelle à la session ACP.
    - `/acp spawn ... --thread ...` lie un fil/sujet de canal à la session ACP.
    - Les `bindings[].type="acp"` configurés et persistants routent les conversations correspondantes vers la même session ACP.

    Les messages suivants dans la conversation liée sont routés directement vers la
    session ACP, et la sortie ACP est renvoyée au même
    canal/fil/sujet.

    Ce qu’OpenClaw envoie au harnais :

    - Les suivis liés normaux sont envoyés comme texte de prompt, avec des pièces jointes seulement lorsque le harnais/backend les prend en charge.
    - Les commandes de gestion `/acp` et les commandes Gateway locales sont interceptées avant l’envoi ACP.
    - Les événements d’achèvement générés par le runtime sont matérialisés par cible. Les agents OpenClaw reçoivent l’enveloppe de contexte runtime interne d’OpenClaw ; les harnais ACP externes reçoivent un prompt simple avec le résultat enfant et l’instruction. L’enveloppe brute `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` ne doit jamais être envoyée aux harnais externes ni conservée comme texte de transcription utilisateur ACP.
    - Les entrées de transcription ACP utilisent le texte déclencheur visible par l’utilisateur ou le prompt d’achèvement simple. Les métadonnées d’événement internes restent structurées dans OpenClaw lorsque c’est possible et ne sont pas traitées comme du contenu de chat rédigé par l’utilisateur.

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    Les sessions ACP ponctuelles créées par une autre exécution d’agent sont des enfants
    en arrière-plan, similaires à des sous-agents :

    - Le parent demande du travail avec `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - L’enfant s’exécute dans sa propre session de harnais ACP.
    - Les tours enfants s’exécutent sur la même voie d’arrière-plan que les créations de sous-agents natives, donc un harnais ACP lent ne bloque pas le travail sans rapport de la session principale.
    - L’achèvement est signalé via le chemin d’annonce d’achèvement de tâche. OpenClaw convertit les métadonnées d’achèvement internes en prompt ACP simple avant de les envoyer à un harnais externe, afin que les harnais ne voient pas les marqueurs de contexte runtime propres à OpenClaw.
    - Le parent reformule le résultat enfant avec une voix d’assistant normale lorsqu’une réponse destinée à l’utilisateur est utile.

    Ne traitez **pas** ce chemin comme un chat pair à pair entre parent
    et enfant. L’enfant dispose déjà d’un canal d’achèvement vers le
    parent.

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` peut cibler une autre session après la création. Pour les sessions
    paires normales, OpenClaw utilise un chemin de suivi agent à agent (A2A)
    après l’injection du message :

    - Attendre la réponse de la session cible.
    - Autoriser éventuellement le demandeur et la cible à échanger un nombre limité de tours de suivi.
    - Demander à la cible de produire un message d’annonce.
    - Livrer cette annonce au canal ou au fil visible.

    Ce chemin A2A est un repli pour les envois pairs où l’expéditeur a besoin d’un
    suivi visible. Il reste activé lorsqu’une session sans rapport peut
    voir et envoyer un message à une cible ACP, par exemple avec des paramètres
    `tools.sessions.visibility` larges.

    OpenClaw ignore le suivi A2A uniquement lorsque le demandeur est le
    parent de son propre enfant ACP ponctuel détenu par le parent. Dans ce cas,
    exécuter A2A en plus de l’achèvement de tâche peut réveiller le parent avec le
    résultat de l’enfant, renvoyer la réponse du parent à l’enfant, et
    créer une boucle d’écho parent/enfant. Le résultat `sessions_send` indique
    `delivery.status="skipped"` pour ce cas d’enfant détenu, car le
    chemin d’achèvement est déjà responsable du résultat.

  </Accordion>
  <Accordion title="Resume an existing session">
    Utilisez `resumeSessionId` pour continuer une session ACP précédente au lieu de
    repartir de zéro. L’agent rejoue l’historique de sa conversation via
    `session/load`, ce qui lui permet de reprendre avec le contexte complet de ce qui précède.

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Cas d’usage courants :

    - Transférer une session Codex de votre ordinateur portable à votre téléphone — dites à votre agent de reprendre là où vous vous étiez arrêté.
    - Continuer une session de codage que vous avez démarrée interactivement dans le CLI, désormais sans interface via votre agent.
    - Reprendre un travail interrompu par un redémarrage du gateway ou une expiration d’inactivité.

    Notes :

    - `resumeSessionId` ne s’applique que lorsque `runtime: "acp"` ; le runtime de sous-agent par défaut ignore ce champ réservé à ACP.
    - `streamTo` ne s’applique que lorsque `runtime: "acp"` ; le runtime de sous-agent par défaut ignore ce champ réservé à ACP.
    - `resumeSessionId` est un identifiant de reprise ACP/harnais local à l’hôte, pas une clé de session de canal OpenClaw ; OpenClaw vérifie toujours la politique de création ACP et la politique de l’agent cible avant l’envoi, tandis que le backend ACP ou le harnais détient l’autorisation de charger cet identifiant amont.
    - `resumeSessionId` restaure l’historique de conversation ACP amont ; `thread` et `mode` s’appliquent toujours normalement à la nouvelle session OpenClaw que vous créez, donc `mode: "session"` nécessite toujours `thread: true`.
    - L’agent cible doit prendre en charge `session/load` (Codex et Claude Code le font).
    - Si l’identifiant de session est introuvable, la création échoue avec une erreur claire — aucun repli silencieux vers une nouvelle session.

  </Accordion>
  <Accordion title="Post-deploy smoke test">
    Après un déploiement du gateway, exécutez une vérification de bout en bout en direct
    au lieu de vous fier aux tests unitaires :

    1. Vérifiez la version et le commit du gateway déployé sur l’hôte cible.
    2. Ouvrez une session de pont ACPX temporaire vers un agent en direct.
    3. Demandez à cet agent d’appeler `sessions_spawn` avec `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` et la tâche `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Vérifiez `accepted=yes`, un vrai `childSessionKey` et l’absence d’erreur de validation.
    5. Nettoyez la session de pont temporaire.

    Conservez le gate sur `mode: "run"` et omettez `streamTo: "parent"` —
    les chemins `mode: "session"` liés à un fil et relais de flux sont des passes
    d’intégration distinctes et plus riches.

  </Accordion>
</AccordionGroup>

## Compatibilité avec le bac à sable

Les sessions ACP s’exécutent actuellement sur le runtime hôte, **pas** dans le
bac à sable OpenClaw.

<Warning>
**Limite de sécurité :**

- Le harnais externe peut lire/écrire selon ses propres autorisations CLI et le `cwd` sélectionné.
- La politique de sandbox d’OpenClaw n’encapsule **pas** l’exécution du harnais ACP.
- OpenClaw applique toujours les garde-fous de fonctionnalités ACP, les agents autorisés, la propriété des sessions, les liaisons de canaux et la politique de livraison du Gateway.
- Utilisez `runtime: "subagent"` pour le travail natif OpenClaw soumis au sandbox.

</Warning>

Limites actuelles :

- Si la session demandeuse est sandboxée, les lancements ACP sont bloqués à la fois pour `sessions_spawn({ runtime: "acp" })` et `/acp spawn`.
- `sessions_spawn` avec `runtime: "acp"` ne prend pas en charge `sandbox: "require"`.

## Résolution de la cible de session

La plupart des actions `/acp` acceptent une cible de session facultative (`session-key`,
`session-id` ou `session-label`).

**Ordre de résolution :**

1. Argument de cible explicite (ou `--session` pour `/acp steer`)
   - essaie la clé
   - puis l’identifiant de session au format UUID
   - puis le libellé
2. Liaison du fil actuel (si cette conversation/ce fil est lié à une session ACP).
3. Repli sur la session demandeuse actuelle.

Les liaisons de conversation actuelle et les liaisons de fil participent toutes deux à
l’étape 2.

Si aucune cible n’est résolue, OpenClaw renvoie une erreur claire
(`Unable to resolve session target: ...`).

## Contrôles ACP

| Commande             | Ce qu’elle fait                                         | Exemple                                                       |
| -------------------- | ------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Crée une session ACP ; liaison actuelle ou liaison de fil facultative. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Annule le tour en cours pour la session cible.          | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Envoie une instruction de pilotage à la session en cours. | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Ferme la session et détache les cibles de fil.          | `/acp close`                                                  |
| `/acp status`        | Affiche le backend, le mode, l’état, les options d’exécution et les capacités. | `/acp status`                                                 |
| `/acp set-mode`      | Définit le mode d’exécution pour la session cible.      | `/acp set-mode plan`                                          |
| `/acp set`           | Écrit une option générique de configuration d’exécution. | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Définit la surcharge du répertoire de travail d’exécution. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Définit le profil de politique d’approbation.           | `/acp permissions strict`                                     |
| `/acp timeout`       | Définit le délai d’expiration d’exécution (secondes).   | `/acp timeout 120`                                            |
| `/acp model`         | Définit la surcharge du modèle d’exécution.             | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Supprime les surcharges d’options d’exécution de session. | `/acp reset-options`                                          |
| `/acp sessions`      | Liste les sessions ACP récentes depuis le store.        | `/acp sessions`                                               |
| `/acp doctor`        | Santé du backend, capacités, correctifs actionnables.   | `/acp doctor`                                                 |
| `/acp install`       | Affiche les étapes déterministes d’installation et d’activation. | `/acp install`                                                |

`/acp status` affiche les options d’exécution effectives ainsi que les
identifiants de session au niveau de l’exécution et du backend. Les erreurs de
contrôle non pris en charge apparaissent clairement lorsqu’un backend ne possède
pas une capacité. `/acp sessions` lit le store pour la session actuellement liée
ou demandeuse ; les jetons de cible (`session-key`, `session-id` ou
`session-label`) sont résolus via la découverte de sessions du gateway, y compris
les racines `session.store` personnalisées par agent.

### Mappage des options d’exécution

`/acp` fournit des commandes pratiques et un setter générique. Opérations
équivalentes :

| Commande                     | Correspond à                         | Notes                                                                                                                                                                          |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | clé de configuration d’exécution `model` | Pour Codex ACP, OpenClaw normalise `openai-codex/<model>` en identifiant de modèle de l’adaptateur et mappe les suffixes de raisonnement avec barre oblique comme `openai-codex/gpt-5.4/high` vers `reasoning_effort`. |
| `/acp set thinking <level>`  | clé de configuration d’exécution `thinking` | Pour Codex ACP, OpenClaw envoie le `reasoning_effort` correspondant lorsque l’adaptateur en prend un en charge.                                                               |
| `/acp permissions <profile>` | clé de configuration d’exécution `approval_policy` | —                                                                                                                                                                              |
| `/acp timeout <seconds>`     | clé de configuration d’exécution `timeout` | —                                                                                                                                                                              |
| `/acp cwd <path>`            | surcharge du cwd d’exécution         | Mise à jour directe.                                                                                                                                                          |
| `/acp set <key> <value>`     | générique                            | `key=cwd` utilise le chemin de surcharge du cwd.                                                                                                                               |
| `/acp reset-options`         | efface toutes les surcharges d’exécution | —                                                                                                                                                                              |

## Harnais acpx, configuration du Plugin et autorisations

Pour la configuration du harnais acpx (alias Claude Code / Codex / Gemini CLI),
les ponts MCP plugin-tools et OpenClaw-tools, ainsi que les modes
d’autorisation ACP, consultez
[Agents ACP — configuration](/fr/tools/acp-agents-setup).

## Dépannage

| Symptôme                                                                    | Cause probable                                                                                                                        | Correction                                                                                                                                                                                                 |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Plugin backend manquant, désactivé ou bloqué par `plugins.allow`.                                                                     | Installez et activez le Plugin backend, incluez `acpx` dans `plugins.allow` lorsque cette liste d’autorisation est définie, puis exécutez `/acp doctor`.                                                    |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP désactivé globalement.                                                                                                            | Définissez `acp.enabled=true`.                                                                                                                                                                             |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Répartition automatique depuis les messages de fil normaux désactivée.                                                                | Définissez `acp.dispatch.enabled=true` pour reprendre le routage automatique des fils ; les appels explicites `sessions_spawn({ runtime: "acp" })` fonctionnent toujours.                                  |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent absent de la liste d’autorisation.                                                                                              | Utilisez un `agentId` autorisé ou mettez à jour `acp.allowedAgents`.                                                                                                                                       |
| `/acp doctor` reports backend not ready right after startup                 | Plugin backend manquant, désactivé, bloqué par une politique d’autorisation/refus, ou exécutable configuré indisponible.              | Installez/activez le Plugin backend, relancez `/acp doctor` et inspectez l’installation backend ou l’erreur de politique s’il reste défaillant.                                                            |
| Commande du harness introuvable                                             | La CLI de l’adaptateur n’est pas installée, le Plugin externe est manquant, ou la récupération `npx` au premier lancement a échoué pour un adaptateur autre que Codex. | Exécutez `/acp doctor`, installez/préchauffez l’adaptateur sur l’hôte Gateway, ou configurez explicitement la commande d’agent acpx.                                                                        |
| Modèle introuvable depuis le harness                                        | L’identifiant de modèle est valide pour un autre fournisseur/harness, mais pas pour cette cible ACP.                                   | Utilisez un modèle listé par ce harness, configurez le modèle dans le harness, ou omettez le remplacement.                                                                                                  |
| Erreur d’authentification fournisseur depuis le harness                     | OpenClaw est sain, mais la CLI/le fournisseur cible n’est pas connecté.                                                               | Connectez-vous ou fournissez la clé fournisseur requise dans l’environnement de l’hôte Gateway.                                                                                                            |
| `Unable to resolve session target: ...`                                     | Jeton de clé/id/libellé incorrect.                                                                                                    | Exécutez `/acp sessions`, copiez la clé/le libellé exact, puis réessayez.                                                                                                                                  |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` utilisé sans conversation active pouvant être liée.                                                                      | Déplacez-vous vers le chat/canal cible et réessayez, ou utilisez un spawn non lié.                                                                                                                          |
| `Conversation bindings are unavailable for <channel>.`                      | L’adaptateur ne dispose pas de la capacité de liaison ACP à la conversation actuelle.                                                  | Utilisez `/acp spawn ... --thread ...` lorsque c’est pris en charge, configurez les `bindings[]` de premier niveau, ou passez à un canal pris en charge.                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` utilisé hors contexte de fil.                                                                                         | Déplacez-vous vers le fil cible ou utilisez `--thread auto`/`off`.                                                                                                                                         |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Un autre utilisateur possède la cible de liaison active.                                                                               | Reliez en tant que propriétaire ou utilisez une autre conversation ou un autre fil.                                                                                                                         |
| `Thread bindings are unavailable for <channel>.`                            | L’adaptateur ne dispose pas de la capacité de liaison de fil.                                                                          | Utilisez `--thread off` ou passez à un adaptateur/canal pris en charge.                                                                                                                                    |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Le runtime ACP est côté hôte ; la session requérante est sandboxée.                                                                    | Utilisez `runtime="subagent"` depuis les sessions sandboxées, ou exécutez le spawn ACP depuis une session non sandboxée.                                                                                    |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` demandé pour le runtime ACP.                                                                                      | Utilisez `runtime="subagent"` pour exiger le sandboxing, ou utilisez ACP avec `sandbox="inherit"` depuis une session non sandboxée.                                                                         |
| `Cannot apply --model ... did not advertise model support`                  | Le harness cible n’expose pas le changement générique de modèle ACP.                                                                  | Utilisez un harness qui annonce ACP `models`/`session/set_model`, utilisez des références de modèle ACP Codex, ou configurez le modèle directement dans le harness s’il dispose de son propre indicateur de démarrage. |
| Métadonnées ACP manquantes pour la session liée                             | Métadonnées de session ACP obsolètes/supprimées.                                                                                      | Recréez avec `/acp spawn`, puis reliez/remettez au focus le fil.                                                                                                                                           |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` bloque les écritures/exec dans une session ACP non interactive.                                                       | Définissez `plugins.entries.acpx.config.permissionMode` sur `approve-all` et redémarrez Gateway. Consultez [Configuration des permissions](/fr/tools/acp-agents-setup#permission-configuration).              |
| La session ACP échoue tôt avec peu de sortie                                | Les invites de permission sont bloquées par `permissionMode`/`nonInteractivePermissions`.                                             | Consultez les journaux Gateway pour `AcpRuntimeError`. Pour des permissions complètes, définissez `permissionMode=approve-all` ; pour une dégradation gracieuse, définissez `nonInteractivePermissions=deny`. |
| La session ACP se bloque indéfiniment après avoir terminé le travail        | Le processus du harness s’est terminé, mais la session ACP n’a pas signalé l’achèvement.                                              | Surveillez avec `ps aux \| grep acpx` ; tuez manuellement les processus obsolètes.                                                                                                                          |
| Le harness voit `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                     | L’enveloppe d’événement interne a fui à travers la frontière ACP.                                                                     | Mettez à jour OpenClaw et relancez le flux d’achèvement ; les harnesses externes ne doivent recevoir que des prompts d’achèvement simples.                                                                 |

## Connexe

- [Agents ACP — configuration](/fr/tools/acp-agents-setup)
- [Envoi à l’agent](/fr/tools/agent-send)
- [Backends CLI](/fr/gateway/cli-backends)
- [Harness Codex](/fr/plugins/codex-harness)
- [Outils de sandbox multi-agent](/fr/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (mode pont)](/fr/cli/acp)
- [Sous-agents](/fr/tools/subagents)
