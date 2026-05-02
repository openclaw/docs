---
read_when:
    - Exécution de harnais de codage via ACP
    - Configuration de sessions ACP liées à la conversation sur les canaux de messagerie
    - Associer une conversation d’un canal de messagerie à une session ACP persistante
    - Dépannage du composant serveur ACP, du câblage du plugin ou de la livraison des complétions
    - Utilisation des commandes /acp depuis le chat
sidebarTitle: ACP agents
summary: Exécuter des harnais de codage externes (Claude Code, Cursor, Gemini CLI, Codex ACP explicite, OpenClaw ACP, OpenCode) via le backend ACP
title: Agents ACP
x-i18n:
    generated_at: "2026-05-02T21:03:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: ec2404924cbb4c4cd0d94485bc7d8ea586c0ef5f4380e72d5212c8bd9d868c20
    source_path: tools/acp-agents.md
    workflow: 16
---

  Les sessions [Agent Client Protocol (ACP)](https://agentclientprotocol.com/)
  permettent à OpenClaw d’exécuter des harnais de codage externes (par exemple Pi, Claude Code,
  Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI, et d’autres
  harnais ACPX pris en charge) via un plugin backend ACP.

  Chaque lancement de session ACP est suivi comme une [tâche en arrière-plan](/fr/automation/tasks).

  <Note>
  **ACP est le chemin des harnais externes, pas le chemin Codex par défaut.** Le
  plugin serveur d’application Codex natif possède les contrôles `/codex ...` et le
  runtime intégré `agentRuntime.id: "codex"` ; ACP possède les
  contrôles `/acp ...` et les sessions `sessions_spawn({ runtime: "acp" })`.

  Si vous voulez que Codex ou Claude Code se connecte comme client MCP externe
  directement à des conversations de canal OpenClaw existantes, utilisez
  [`openclaw mcp serve`](/fr/cli/mcp) au lieu d’ACP.
  </Note>

  ## Quelle page dois-je consulter ?

  | Vous voulez…                                                                                    | Utilisez ceci                         | Notes                                                                                                                                                                                         |
  | ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | Lier ou contrôler Codex dans la conversation actuelle                                            | `/codex bind`, `/codex threads`       | Chemin serveur d’application Codex natif lorsque le plugin `codex` est activé ; inclut les réponses de chat liées, le transfert d’images, le modèle/rapide/autorisations, l’arrêt et les contrôles d’orientation. ACP est une solution de repli explicite |
  | Exécuter Claude Code, Gemini CLI, Codex ACP explicite ou un autre harnais externe _via_ OpenClaw | Cette page                            | Sessions liées au chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tâches en arrière-plan, contrôles de runtime                                                                      |
  | Exposer une session OpenClaw Gateway _comme_ serveur ACP pour un éditeur ou un client            | [`openclaw acp`](/fr/cli/acp)            | Mode pont. L’IDE/client parle ACP à OpenClaw via stdio/WebSocket                                                                                                                              |
  | Réutiliser une CLI d’IA locale comme modèle de secours texte uniquement                          | [Backends CLI](/fr/gateway/cli-backends) | Pas ACP. Aucun outil OpenClaw, aucun contrôle ACP, aucun runtime de harnais                                                                                                                   |

  ## Cela fonctionne-t-il prêt à l’emploi ?

  Oui, après installation du plugin runtime ACP officiel :

  ```bash
  openclaw plugins install @openclaw/acpx
  openclaw config set plugins.entries.acpx.enabled true
  ```

  Les extractions source peuvent utiliser le plugin d’espace de travail local `extensions/acpx` après
  `pnpm install`. Exécutez `/acp doctor` pour vérifier la préparation.

  OpenClaw n’informe les agents du lancement ACP que lorsqu’ACP est **réellement
  utilisable** : ACP doit être activé, la répartition ne doit pas être désactivée, la session
  actuelle ne doit pas être bloquée par le sandbox, et un backend de runtime doit être
  chargé. Si ces conditions ne sont pas réunies, les Skills du plugin ACP et les
  indications ACP de `sessions_spawn` restent masquées afin que l’agent ne suggère pas
  un backend indisponible.

  <AccordionGroup>
  <Accordion title="Points à surveiller au premier lancement">
    - Si `plugins.allow` est défini, il s’agit d’un inventaire restrictif de plugins et il **doit** inclure `acpx` ; sinon, le backend ACP installé est volontairement bloqué et `/acp doctor` signale l’entrée manquante dans la liste d’autorisation.
    - L’adaptateur Codex ACP est préparé avec le plugin `acpx` et lancé localement lorsque c’est possible.
    - D’autres adaptateurs de harnais cibles peuvent encore être récupérés à la demande avec `npx` lors de leur première utilisation.
    - L’authentification du fournisseur doit toujours exister sur l’hôte pour ce harnais.
    - Si l’hôte n’a pas npm ni d’accès réseau, les récupérations d’adaptateurs au premier lancement échouent jusqu’à ce que les caches soient préchauffés ou que l’adaptateur soit installé autrement.

  </Accordion>
  <Accordion title="Prérequis de runtime">
    ACP lance un véritable processus de harnais externe. OpenClaw possède le routage,
    l’état des tâches en arrière-plan, la livraison, les liaisons et la politique ; le harnais
    possède sa connexion au fournisseur, son catalogue de modèles, son comportement de système de fichiers et
    ses outils natifs.

    Avant d’accuser OpenClaw, vérifiez :

    - `/acp doctor` signale un backend activé et sain.
    - L’id cible est autorisé par `acp.allowedAgents` lorsque cette liste d’autorisation est définie.
    - La commande de harness peut démarrer sur l’hôte du Gateway.
    - L’authentification du fournisseur est présente pour ce harness (`claude`, `codex`, `gemini`, `opencode`, `droid`, etc.).
    - Le modèle sélectionné existe pour ce harness — les ids de modèle ne sont pas portables d’un harness à l’autre.
    - Le `cwd` demandé existe et est accessible, ou omettez `cwd` et laissez le backend utiliser sa valeur par défaut.
    - Le mode d’autorisation correspond au travail. Les sessions non interactives ne peuvent pas cliquer sur les invites d’autorisation natives ; les exécutions de codage intensives en écriture/exécution nécessitent donc généralement un profil d’autorisation ACPX capable de continuer sans interface.

  </Accordion>
</AccordionGroup>

Les outils de Plugin OpenClaw et les outils OpenClaw intégrés ne sont **pas** exposés aux
harnesses ACP par défaut. Activez les ponts MCP explicites dans
[Agents ACP — configuration](/fr/tools/acp-agents-setup) uniquement lorsque le harness
doit appeler ces outils directement.

## Cibles de harness prises en charge

Avec le backend `acpx`, utilisez ces ids de harness comme cibles `/acp spawn <id>`
ou `sessions_spawn({ runtime: "acp", agentId: "<id>" })` :

| Id de harness | Backend typique                                | Notes                                                                               |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Adaptateur ACP Claude Code                        | Nécessite l’authentification Claude Code sur l’hôte.                                              |
| `codex`    | Adaptateur ACP Codex                              | Repli ACP explicite uniquement lorsque `/codex` natif est indisponible ou qu’ACP est demandé. |
| `copilot`  | Adaptateur ACP GitHub Copilot                     | Nécessite l’authentification CLI/runtime Copilot.                                                  |
| `cursor`   | ACP Cursor CLI (`cursor-agent acp`)            | Remplacez la commande acpx si une installation locale expose un point d’entrée ACP différent.    |
| `droid`    | Factory Droid CLI                              | Nécessite l’authentification Factory/Droid ou `FACTORY_API_KEY` dans l’environnement du harness.        |
| `gemini`   | Adaptateur ACP Gemini CLI                         | Nécessite l’authentification Gemini CLI ou la configuration d’une clé API.                                          |
| `iflow`    | iFlow CLI                                      | La disponibilité de l’adaptateur et le contrôle du modèle dépendent de la CLI installée.                 |
| `kilocode` | Kilo Code CLI                                  | La disponibilité de l’adaptateur et le contrôle du modèle dépendent de la CLI installée.                 |
| `kimi`     | Kimi/Moonshot CLI                              | Nécessite l’authentification Kimi/Moonshot sur l’hôte.                                            |
| `kiro`     | Kiro CLI                                       | La disponibilité de l’adaptateur et le contrôle du modèle dépendent de la CLI installée.                 |
| `opencode` | Adaptateur ACP OpenCode                           | Nécessite l’authentification OpenCode CLI/fournisseur.                                                |
| `openclaw` | Pont OpenClaw Gateway via `openclaw acp` | Permet à un harness compatible ACP de communiquer avec une session OpenClaw Gateway.                 |
| `pi`       | Runtime OpenClaw Pi/intégré                   | Utilisé pour les expérimentations de harness natives OpenClaw.                                       |
| `qwen`     | Qwen Code / Qwen CLI                           | Nécessite une authentification compatible Qwen sur l’hôte.                                          |

Des alias d’agent acpx personnalisés peuvent être configurés dans acpx lui-même, mais la
politique OpenClaw vérifie toujours `acp.allowedAgents` et tout mappage
`agents.list[].runtime.acp.agent` avant l’envoi.

## Runbook opérateur

Flux `/acp` rapide depuis le chat :

<Steps>
  <Step title="Démarrer">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`, ou explicitement
    `/acp spawn codex --bind here`.
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
    - Le démarrage crée ou reprend une session runtime ACP, enregistre les métadonnées ACP dans le magasin de sessions OpenClaw, et peut créer une tâche en arrière-plan lorsque l’exécution appartient au parent.
    - Les sessions ACP appartenant au parent sont traitées comme du travail en arrière-plan même lorsque la session runtime est persistante ; l’achèvement et la livraison entre surfaces passent par le notificateur de tâche parent plutôt que de se comporter comme une session de chat normale visible par l’utilisateur.
    - La maintenance des tâches ferme les sessions ACP ponctuelles terminales ou orphelines appartenant au parent. Les sessions ACP persistantes sont conservées tant qu’une liaison de conversation active demeure ; les sessions persistantes obsolètes sans liaison active sont fermées afin qu’elles ne puissent pas être reprises silencieusement une fois la tâche propriétaire terminée ou son enregistrement de tâche disparu.
    - Les messages de suivi liés vont directement à la session ACP jusqu’à ce que la liaison soit fermée, perde le focus, soit réinitialisée ou expire.
    - Les commandes Gateway restent locales. `/acp ...`, `/status` et `/unfocus` ne sont jamais envoyés comme texte d’invite normal à un harness ACP lié.
    - `cancel` interrompt le tour actif lorsque le backend prend en charge l’annulation ; cela ne supprime pas la liaison ni les métadonnées de session.
    - `close` met fin à la session ACP du point de vue d’OpenClaw et supprime la liaison. Un harness peut tout de même conserver son propre historique amont s’il prend en charge la reprise.
    - Les workers runtime inactifs peuvent être nettoyés après `acp.runtime.ttlMinutes` ; les métadonnées de session stockées restent disponibles pour `/acp sessions`.

  </Accordion>
  <Accordion title="Règles de routage Codex natif">
    Déclencheurs en langage naturel qui doivent être routés vers le **Plugin Codex
    natif** lorsqu’il est activé :

    - "Lier ce canal Discord à Codex."
    - "Attacher ce chat au fil Codex `<id>`."
    - "Afficher les fils Codex, puis lier celui-ci."

    La liaison de conversation Codex native est le chemin de contrôle de chat par défaut.
    Les outils dynamiques OpenClaw s’exécutent toujours via OpenClaw, tandis que
    les outils natifs Codex tels que shell/apply-patch s’exécutent dans Codex.
    Pour les événements d’outils natifs Codex, OpenClaw injecte un relais de hook natif
    par tour afin que les hooks de Plugin puissent bloquer `before_tool_call`, observer
    `after_tool_call` et router les événements Codex `PermissionRequest`
    via les approbations OpenClaw. Les hooks Codex `Stop` sont relayés vers
    OpenClaw `before_agent_finalize`, où les plugins peuvent demander une passe de modèle supplémentaire
    avant que Codex finalise sa réponse. Le relais reste
    délibérément conservateur : il ne modifie pas les arguments d’outils natifs Codex
    et ne réécrit pas les enregistrements de fil Codex. Utilisez ACP explicite uniquement
    lorsque vous voulez le modèle runtime/session ACP. La frontière de prise en charge Codex
    intégrée est documentée dans le
    [contrat de prise en charge du harness Codex v1](/fr/plugins/codex-harness#v1-support-contract).

  </Accordion>
  <Accordion title="Aide-mémoire de sélection du modèle / fournisseur / runtime">
    - `openai-codex/*` — route OAuth/abonnement PI Codex.
    - `openai/*` plus `agentRuntime.id: "codex"` — runtime intégré natif du serveur d’application Codex.
    - `/codex ...` — contrôle de conversation Codex natif.
    - `/acp ...` ou `runtime: "acp"` — contrôle ACP/acpx explicite.

  </Accordion>
  <Accordion title="Déclencheurs en langage naturel du routage ACP">
    Déclencheurs qui doivent router vers le runtime ACP :

    - "Exécute ceci comme une session ACP Claude Code ponctuelle et résume le résultat."
    - "Utilise Gemini CLI pour cette tâche dans un fil, puis conserve les suivis dans ce même fil."
    - "Exécute Codex via ACP dans un fil en arrière-plan."

    OpenClaw choisit `runtime: "acp"`, résout le harnais `agentId`,
    se lie à la conversation ou au fil actuel lorsque c’est pris en charge, et
    route les suivis vers cette session jusqu’à sa fermeture/expiration. Codex
    suit ce chemin uniquement lorsque ACP/acpx est explicite ou que le plugin
    Codex natif n’est pas disponible pour l’opération demandée.

    Pour `sessions_spawn`, `runtime: "acp"` est annoncé uniquement lorsque ACP
    est activé, que le demandeur n’est pas sandboxé et qu’un backend de runtime
    ACP est chargé. `acp.dispatch.enabled=false` met en pause la répartition
    automatique des fils ACP, mais ne masque ni ne bloque les appels explicites
    `sessions_spawn({ runtime: "acp" })`. Il cible des ids de harnais ACP comme `codex`,
    `claude`, `droid`, `gemini` ou `opencode`. Ne transmettez pas un id d’agent
    de configuration OpenClaw normal issu de `agents_list`, sauf si cette entrée est
    explicitement configurée avec `agents.list[].runtime.type="acp"`;
    sinon, utilisez le runtime de sous-agent par défaut. Lorsqu’un agent OpenClaw
    est configuré avec `runtime.type="acp"`, OpenClaw utilise
    `runtime.acp.agent` comme id de harnais sous-jacent.

  </Accordion>
</AccordionGroup>

## ACP versus sous-agents

Utilisez ACP lorsque vous voulez un runtime de harnais externe. Utilisez le
**serveur d’application Codex natif** pour la liaison/le contrôle de conversation Codex
lorsque le plugin `codex` est activé. Utilisez les **sous-agents** lorsque vous
voulez des exécutions déléguées natives OpenClaw.

| Zone          | Session ACP                           | Exécution de sous-agent            |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | Plugin backend ACP (par exemple acpx) | Runtime de sous-agent natif OpenClaw |
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
suivi des tâches en arrière-plan et liaison facultative à une conversation/un fil.

Les backends CLI sont des runtimes de repli locaux textuels séparés — voir
[Backends CLI](/fr/gateway/cli-backends).

Pour les opérateurs, la règle pratique est :

- **Vous voulez `/acp spawn`, des sessions liables, des contrôles de runtime ou un travail de harnais persistant ?** Utilisez ACP.
- **Vous voulez un simple repli texte local via le CLI brut ?** Utilisez les backends CLI.

## Sessions liées

### Modèle mental

- **Surface de chat** — l’endroit où les personnes continuent de discuter (canal Discord, sujet Telegram, discussion iMessage).
- **Session ACP** — l’état durable du runtime Codex/Claude/Gemini vers lequel OpenClaw route.
- **Fil/sujet enfant** — une surface de messagerie supplémentaire facultative créée uniquement par `--thread ...`.
- **Espace de travail du runtime** — l’emplacement du système de fichiers (`cwd`, checkout du dépôt, espace de travail backend) où le harnais s’exécute. Indépendant de la surface de chat.

### Liaisons à la conversation actuelle

`/acp spawn <harness> --bind here` épingle la conversation actuelle à la
session ACP lancée — pas de fil enfant, même surface de chat. OpenClaw conserve
la propriété du transport, de l’authentification, de la sécurité et de la livraison.
Les messages de suivi dans cette conversation sont routés vers la même session ;
`/new` et `/reset` réinitialisent la session en place ; `/acp close` supprime la liaison.

Exemples :

```text
/codex bind                                              # liaison Codex native, router les futurs messages ici
/codex model gpt-5.4                                     # régler le fil Codex natif lié
/codex stop                                              # contrôler le tour Codex natif actif
/acp spawn codex --bind here                             # repli ACP explicite pour Codex
/acp spawn codex --thread auto                           # peut créer un fil/sujet enfant et s’y lier
/acp spawn codex --bind here --cwd /workspace/repo       # même liaison de chat, Codex s’exécute dans /workspace/repo
```

<AccordionGroup>
  <Accordion title="Règles de liaison et exclusivité">
    - `--bind here` et `--thread ...` sont mutuellement exclusifs.
    - `--bind here` fonctionne uniquement sur les canaux qui annoncent la liaison à la conversation actuelle ; sinon OpenClaw renvoie un message clair indiquant que ce n’est pas pris en charge. Les liaisons persistent après les redémarrages du Gateway.
    - Sur Discord, `spawnSessions` contrôle la création de fils enfants pour `--thread auto|here` — pas `--bind here`.
    - Si vous lancez vers un autre agent ACP sans `--cwd`, OpenClaw hérite par défaut de l’espace de travail de **l’agent cible**. Les chemins hérités manquants (`ENOENT`/`ENOTDIR`) se replient sur la valeur par défaut du backend ; les autres erreurs d’accès (par ex. `EACCES`) apparaissent comme des erreurs de lancement.
    - Les commandes de gestion du Gateway restent locales dans les conversations liées — les commandes `/acp ...` sont traitées par OpenClaw même lorsque le texte de suivi normal est routé vers la session ACP liée ; `/status` et `/unfocus` restent aussi locales chaque fois que la gestion des commandes est activée pour cette surface.

  </Accordion>
  <Accordion title="Sessions liées à un fil">
    Lorsque les liaisons de fil sont activées pour un adaptateur de canal :

    - OpenClaw lie un fil à une session ACP cible.
    - Les messages de suivi dans ce fil sont routés vers la session ACP liée.
    - La sortie ACP est renvoyée au même fil.
    - Unfocus/fermeture/archivage/expiration après inactivité ou par âge maximal supprime la liaison.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` et `/unfocus` sont des commandes Gateway, pas des prompts envoyés au harnais ACP.

    Indicateurs de fonctionnalité requis pour ACP lié à un fil :

    - `acp.enabled=true`
    - `acp.dispatch.enabled` est activé par défaut (définissez `false` pour mettre en pause la répartition automatique des fils ACP ; les appels explicites `sessions_spawn({ runtime: "acp" })` fonctionnent toujours).
    - Lancements de sessions de fil par adaptateur de canal activés (par défaut : `true`) :
      - Discord : `channels.discord.threadBindings.spawnSessions=true`
      - Telegram : `channels.telegram.threadBindings.spawnSessions=true`

    La prise en charge de la liaison de fil dépend de l’adaptateur. Si l’adaptateur
    de canal actif ne prend pas en charge les liaisons de fil, OpenClaw renvoie
    un message clair indiquant que ce n’est pas pris en charge ou indisponible.

  </Accordion>
  <Accordion title="Canaux prenant en charge les fils">
    - Tout adaptateur de canal qui expose une capacité de liaison de session/fil.
    - Prise en charge intégrée actuelle : fils/canaux **Discord**, sujets **Telegram** (sujets de forum dans les groupes/supergroupes et sujets de messages directs).
    - Les canaux de plugin peuvent ajouter la prise en charge via la même interface de liaison.

  </Accordion>
</AccordionGroup>

## Liaisons de canal persistantes

Pour les workflows non éphémères, configurez des liaisons ACP persistantes dans
les entrées de premier niveau `bindings[]`.

### Modèle de liaison

<ParamField path="bindings[].type" type='"acp"'>
  Marque une liaison de conversation ACP persistante.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Identifie la conversation cible. Formes par canal :

- **Canal/fil Discord :** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Sujet de forum Telegram :** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **Message direct/groupe BlueBubbles :** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Préférez `chat_id:*` ou `chat_identifier:*` pour des liaisons de groupe stables.
- **Message direct/groupe iMessage :** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Préférez `chat_id:*` pour des liaisons de groupe stables.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  L’id de l’agent OpenClaw propriétaire.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  Remplacement ACP facultatif.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  Libellé facultatif visible par l’opérateur.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  Répertoire de travail facultatif du runtime.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  Remplacement facultatif du backend.
</ParamField>

### Valeurs par défaut du runtime par agent

Utilisez `agents.list[].runtime` pour définir une fois les valeurs par défaut ACP par agent :

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id de harnais, par ex. `codex` ou `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Ordre de priorité des remplacements pour les sessions liées ACP :**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. Valeurs par défaut ACP globales (par ex. `acp.backend`)

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
- Les messages dans ce canal ou sujet sont routés vers la session ACP configurée.
- Dans les conversations liées, `/new` et `/reset` réinitialisent la même clé de session ACP en place.
- Les liaisons temporaires de runtime (par exemple créées par des flux de focus de fil) s’appliquent toujours lorsqu’elles sont présentes.
- Pour les lancements ACP entre agents sans `cwd` explicite, OpenClaw hérite de l’espace de travail de l’agent cible depuis la configuration de l’agent.
- Les chemins d’espace de travail hérités manquants se replient sur le cwd par défaut du backend ; les échecs d’accès non liés à un chemin manquant apparaissent comme des erreurs de lancement.

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
    `runtime` vaut `subagent` par défaut ; définissez donc explicitement `runtime: "acp"`
    pour les sessions ACP. Si `agentId` est omis, OpenClaw utilise
    `acp.defaultAgent` lorsqu’il est configuré. `mode: "session"` nécessite
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
  Invite initiale envoyée à la session ACP.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  Doit être `"acp"` pour les sessions ACP.
</ParamField>
<ParamField path="agentId" type="string">
  Identifiant du harnais ACP cible. Se replie sur `acp.defaultAgent` s’il est défini.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Demande le flux de liaison de fil de discussion là où il est pris en charge.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` est ponctuel ; `"session"` est persistant. Si `thread: true` et
  que `mode` est omis, OpenClaw peut utiliser par défaut un comportement persistant selon
  le chemin d’exécution. `mode: "session"` nécessite `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Répertoire de travail demandé pour l’exécution (validé par la politique
  du backend/runtime). S’il est omis, le lancement ACP hérite de l’espace de travail
  de l’agent cible lorsqu’il est configuré ; les chemins hérités manquants se replient sur
  les valeurs par défaut du backend, tandis que les vraies erreurs d’accès sont renvoyées.
</ParamField>
<ParamField path="label" type="string">
  Libellé destiné à l’opérateur utilisé dans le texte de session/bannière.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Reprendre une session ACP existante au lieu d’en créer une nouvelle. L’
  agent rejoue son historique de conversation via `session/load`. Nécessite
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` diffuse les résumés de progression de l’exécution ACP initiale vers la
  session demandeuse sous forme d’événements système. Les réponses acceptées incluent
  `streamLogPath`, qui pointe vers un journal JSONL à portée de session
  (`<sessionId>.acp-stream.jsonl`) que vous pouvez suivre pour obtenir tout l’historique du relais.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Interrompt le tour enfant ACP après N secondes. `0` conserve le tour sur le
  chemin sans délai d’expiration du gateway. La même valeur est appliquée à l’exécution Gateway
  et au runtime ACP afin que les harnais bloqués ou ayant épuisé leur quota n’
  occupent pas indéfiniment la voie de l’agent parent.
</ParamField>
<ParamField path="model" type="string">
  Remplacement explicite du modèle pour la session enfant ACP. Les lancements Codex ACP
  normalisent les références OpenClaw Codex telles que `openai-codex/gpt-5.4` vers la configuration
  de démarrage Codex ACP avant `session/new` ; les formes slash telles que
  `openai-codex/gpt-5.4/high` définissent aussi l’effort de raisonnement Codex ACP.
  Les autres harnais doivent annoncer les `models` ACP et prendre en charge
  `session/set_model` ; sinon OpenClaw/acpx échoue clairement au lieu de
  se replier silencieusement sur la valeur par défaut de l’agent cible.
</ParamField>
<ParamField path="thinking" type="string">
  Effort explicite de réflexion/raisonnement. Pour Codex ACP, `minimal` correspond à
  un effort faible, `low`/`medium`/`high`/`xhigh` correspondent directement, et `off`
  omet le remplacement d’effort de raisonnement au démarrage.
</ParamField>

## Modes de liaison de spawn et de fil de discussion

<Tabs>
  <Tab title="--bind here|off">
    | Mode   | Comportement                                                           |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | Lie la conversation active actuelle sur place ; échoue si aucune n’est active. |
    | `off`  | Ne crée pas de liaison de conversation actuelle.                       |

    Notes :

    - `--bind here` est le chemin opérateur le plus simple pour « adosser ce canal ou ce chat à Codex ».
    - `--bind here` ne crée pas de fil enfant.
    - `--bind here` est uniquement disponible sur les canaux qui exposent la prise en charge de la liaison de conversation actuelle.
    - `--bind` et `--thread` ne peuvent pas être combinés dans le même appel `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Mode   | Comportement                                                                                       |
    | ------ | -------------------------------------------------------------------------------------------------- |
    | `auto` | Dans un fil actif : lie ce fil. Hors d’un fil : crée/lie un fil enfant lorsque c’est pris en charge. |
    | `here` | Exige le fil actif actuel ; échoue si vous n’en êtes pas dans un.                                  |
    | `off`  | Aucune liaison. La session démarre sans liaison.                                                   |

    Notes :

    - Sur les surfaces sans liaison de fil, le comportement par défaut est effectivement `off`.
    - Le lancement lié à un fil nécessite la prise en charge de la politique du canal :
      - Discord : `channels.discord.threadBindings.spawnSessions=true`
      - Telegram : `channels.telegram.threadBindings.spawnSessions=true`
    - Utilisez `--bind here` lorsque vous voulez épingler la conversation actuelle sans créer de fil enfant.

  </Tab>
</Tabs>

## Modèle de livraison

Les sessions ACP peuvent être des espaces de travail interactifs ou un
travail en arrière-plan détenu par le parent. Le chemin de livraison dépend de cette forme.

<AccordionGroup>
  <Accordion title="Sessions ACP interactives">
    Les sessions interactives sont destinées à poursuivre l’échange sur une surface
    de chat visible :

    - `/acp spawn ... --bind here` lie la conversation actuelle à la session ACP.
    - `/acp spawn ... --thread ...` lie un fil/sujet de canal à la session ACP.
    - Les `bindings[].type="acp"` configurées de façon persistante acheminent les conversations correspondantes vers la même session ACP.

    Les messages de suivi dans la conversation liée sont acheminés directement vers la
    session ACP, et la sortie ACP est renvoyée vers le même
    canal/fil/sujet.

    Ce qu’OpenClaw envoie au harnais :

    - Les suivis liés normaux sont envoyés comme texte d’invite, plus les pièces jointes uniquement lorsque le harnais/backend les prend en charge.
    - Les commandes de gestion `/acp` et les commandes Gateway locales sont interceptées avant l’envoi ACP.
    - Les événements de complétion générés par le runtime sont matérialisés par cible. Les agents OpenClaw reçoivent l’enveloppe de contexte runtime interne d’OpenClaw ; les harnais ACP externes reçoivent une invite simple avec le résultat enfant et l’instruction. L’enveloppe brute `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` ne doit jamais être envoyée à des harnais externes ni conservée comme texte de transcript utilisateur ACP.
    - Les entrées de transcript ACP utilisent le texte déclencheur visible par l’utilisateur ou l’invite de complétion simple. Les métadonnées d’événements internes restent structurées dans OpenClaw lorsque c’est possible et ne sont pas traitées comme du contenu de chat rédigé par l’utilisateur.

  </Accordion>
  <Accordion title="Sessions ACP ponctuelles détenues par le parent">
    Les sessions ACP ponctuelles lancées par une autre exécution d’agent sont des enfants
    en arrière-plan, similaires à des sous-agents :

    - Le parent demande du travail avec `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - L’enfant s’exécute dans sa propre session de harnais ACP.
    - Les tours enfants s’exécutent sur la même voie d’arrière-plan que celle utilisée par les lancements de sous-agents natifs, afin qu’un harnais ACP lent ne bloque pas le travail non lié de la session principale.
    - Les rapports de complétion reviennent par le chemin d’annonce de complétion de tâche. OpenClaw convertit les métadonnées de complétion internes en une invite ACP simple avant de les envoyer à un harnais externe, afin que les harnais ne voient pas les marqueurs de contexte runtime propres à OpenClaw.
    - Le parent reformule le résultat enfant avec une voix d’assistant normale lorsqu’une réponse visible par l’utilisateur est utile.

    Ne traitez **pas** ce chemin comme un chat pair-à-pair entre parent
    et enfant. L’enfant dispose déjà d’un canal de complétion vers le
    parent.

  </Accordion>
  <Accordion title="sessions_send et livraison A2A">
    `sessions_send` peut cibler une autre session après le lancement. Pour les sessions
    pair normales, OpenClaw utilise un chemin de suivi agent-à-agent (A2A)
    après avoir injecté le message :

    - Attendre la réponse de la session cible.
    - Autoriser facultativement le demandeur et la cible à échanger un nombre borné de tours de suivi.
    - Demander à la cible de produire un message d’annonce.
    - Livrer cette annonce au canal ou au fil visible.

    Ce chemin A2A est un repli pour les envois pair où l’émetteur a besoin d’un
    suivi visible. Il reste activé lorsqu’une session non liée peut
    voir et envoyer un message à une cible ACP, par exemple avec de larges
    paramètres `tools.sessions.visibility`.

    OpenClaw ignore le suivi A2A uniquement lorsque le demandeur est le
    parent de son propre enfant ACP ponctuel détenu par le parent. Dans ce cas,
    exécuter A2A en plus de la complétion de tâche peut réveiller le parent avec le
    résultat de l’enfant, transférer la réponse du parent vers l’enfant, et
    créer une boucle d’écho parent/enfant. Le résultat de `sessions_send` indique
    `delivery.status="skipped"` pour ce cas d’enfant détenu, car le
    chemin de complétion est déjà responsable du résultat.

  </Accordion>
  <Accordion title="Reprendre une session existante">
    Utilisez `resumeSessionId` pour continuer une session ACP précédente au lieu de
    repartir de zéro. L’agent rejoue son historique de conversation via
    `session/load`, ce qui lui permet de reprendre avec le contexte complet de ce qui précède.

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Cas d’utilisation courants :

    - Transférer une session Codex de votre ordinateur portable à votre téléphone — dites à votre agent de reprendre là où vous vous étiez arrêté.
    - Continuer une session de codage commencée interactivement dans la CLI, désormais sans interface interactive via votre agent.
    - Reprendre un travail interrompu par un redémarrage du gateway ou un délai d’inactivité.

    Notes :

    - `resumeSessionId` s’applique uniquement lorsque `runtime: "acp"` ; le runtime de sous-agent par défaut ignore ce champ propre à ACP.
    - `streamTo` s’applique uniquement lorsque `runtime: "acp"` ; le runtime de sous-agent par défaut ignore ce champ propre à ACP.
    - `resumeSessionId` est un identifiant de reprise ACP/harnais local à l’hôte, et non une clé de session de canal OpenClaw ; OpenClaw vérifie toujours la politique de lancement ACP et la politique de l’agent cible avant l’envoi, tandis que le backend ACP ou le harnais détient l’autorisation de charger cet identifiant amont.
    - `resumeSessionId` restaure l’historique de conversation ACP amont ; `thread` et `mode` s’appliquent toujours normalement à la nouvelle session OpenClaw que vous créez, donc `mode: "session"` nécessite toujours `thread: true`.
    - L’agent cible doit prendre en charge `session/load` (Codex et Claude Code le font).
    - Si l’identifiant de session est introuvable, le lancement échoue avec une erreur claire — aucun repli silencieux vers une nouvelle session.

  </Accordion>
  <Accordion title="Test de fumée après déploiement">
    Après un déploiement du gateway, exécutez une vérification de bout en bout en direct plutôt que
    de vous fier aux tests unitaires :

    1. Vérifiez la version et le commit du gateway déployé sur l’hôte cible.
    2. Ouvrez une session de pont ACPX temporaire vers un agent en direct.
    3. Demandez à cet agent d’appeler `sessions_spawn` avec `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` et la tâche `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Vérifiez `accepted=yes`, un vrai `childSessionKey` et l’absence d’erreur de validation.
    5. Nettoyez la session de pont temporaire.

    Gardez le contrôle sur `mode: "run"` et omettez `streamTo: "parent"` —
    les chemins `mode: "session"` liés à un fil et de relais de flux sont des passes
    d’intégration plus riches séparées.

  </Accordion>
</AccordionGroup>

## Compatibilité avec le sandbox

Les sessions ACP s’exécutent actuellement sur le runtime hôte, **pas** dans le
sandbox OpenClaw.

<Warning>
**Limite de sécurité :**

- Le harnais externe peut lire/écrire selon ses propres autorisations CLI et le `cwd` sélectionné.
- La politique de bac à sable d’OpenClaw n’encapsule **pas** l’exécution du harnais ACP.
- OpenClaw applique toujours les garde-fous de fonctionnalités ACP, les agents autorisés, la propriété des sessions, les liaisons de canaux et la politique de livraison du Gateway.
- Utilisez `runtime: "subagent"` pour le travail natif OpenClaw soumis à l’application du bac à sable.

</Warning>

Limites actuelles :

- Si la session demandeuse est en bac à sable, les lancements ACP sont bloqués pour `sessions_spawn({ runtime: "acp" })` comme pour `/acp spawn`.
- `sessions_spawn` avec `runtime: "acp"` ne prend pas en charge `sandbox: "require"`.

## Résolution de la cible de session

La plupart des actions `/acp` acceptent une cible de session facultative (`session-key`,
`session-id` ou `session-label`).

**Ordre de résolution :**

1. Argument de cible explicite (ou `--session` pour `/acp steer`)
   - essaie la clé
   - puis l’id de session au format UUID
   - puis le libellé
2. Liaison du fil actuel (si cette conversation/ce fil est lié à une session ACP).
3. Repli sur la session demandeuse actuelle.

Les liaisons de conversation actuelle et les liaisons de fil participent toutes deux à
l’étape 2.

Si aucune cible n’est résolue, OpenClaw renvoie une erreur claire
(`Unable to resolve session target: ...`).

## Contrôles ACP

| Commande             | Ce qu’elle fait                                          | Exemple                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Crée une session ACP ; liaison actuelle ou liaison de fil facultative. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Annule le tour en cours pour la session cible.            | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Envoie une instruction de pilotage à la session en cours. | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Ferme la session et dissocie les cibles du fil.           | `/acp close`                                                  |
| `/acp status`        | Affiche le backend, le mode, l’état, les options d’exécution et les capacités. | `/acp status`                                                 |
| `/acp set-mode`      | Définit le mode d’exécution pour la session cible.        | `/acp set-mode plan`                                          |
| `/acp set`           | Écrit une option de configuration d’exécution générique.  | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Définit le remplacement du répertoire de travail d’exécution. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Définit le profil de politique d’approbation.             | `/acp permissions strict`                                     |
| `/acp timeout`       | Définit le délai d’expiration d’exécution (secondes).     | `/acp timeout 120`                                            |
| `/acp model`         | Définit le remplacement du modèle d’exécution.            | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Supprime les remplacements d’options d’exécution de la session. | `/acp reset-options`                                          |
| `/acp sessions`      | Liste les sessions ACP récentes depuis le magasin.        | `/acp sessions`                                               |
| `/acp doctor`        | Santé du backend, capacités, corrections actionnables.    | `/acp doctor`                                                 |
| `/acp install`       | Affiche les étapes déterministes d’installation et d’activation. | `/acp install`                                                |

`/acp status` affiche les options d’exécution effectives ainsi que les identifiants de session au niveau de l’exécution et au niveau du backend. Les erreurs de contrôle non pris en charge apparaissent clairement quand un backend ne dispose pas d’une capacité. `/acp sessions` lit le magasin pour la session actuellement liée ou demandeuse ; les jetons de cible (`session-key`, `session-id` ou `session-label`) sont résolus via la découverte de sessions du Gateway, y compris les racines `session.store` personnalisées par agent.

### Mappage des options d’exécution

`/acp` propose des commandes pratiques et un modificateur générique. Opérations équivalentes :

| Commande                     | Correspond à                         | Remarques                                                                                                                                                                      |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | clé de configuration d’exécution `model` | Pour Codex ACP, OpenClaw normalise `openai-codex/<model>` vers l’id de modèle de l’adaptateur et mappe les suffixes de raisonnement avec barre oblique comme `openai-codex/gpt-5.4/high` vers `reasoning_effort`. |
| `/acp set thinking <level>`  | clé de configuration d’exécution `thinking` | Pour Codex ACP, OpenClaw envoie le `reasoning_effort` correspondant lorsque l’adaptateur en prend un en charge.                                                                |
| `/acp permissions <profile>` | clé de configuration d’exécution `approval_policy` | —                                                                                                                                                                              |
| `/acp timeout <seconds>`     | clé de configuration d’exécution `timeout` | —                                                                                                                                                                              |
| `/acp cwd <path>`            | remplacement du cwd d’exécution      | Mise à jour directe.                                                                                                                                                          |
| `/acp set <key> <value>`     | générique                            | `key=cwd` utilise le chemin de remplacement du cwd.                                                                                                                           |
| `/acp reset-options`         | efface tous les remplacements d’exécution | —                                                                                                                                                                              |

## Harnais acpx, configuration du Plugin et autorisations

Pour la configuration du harnais acpx (alias Claude Code / Codex / Gemini CLI), les passerelles MCP plugin-tools et OpenClaw-tools, et les modes d’autorisation ACP, consultez
[Agents ACP — configuration](/fr/tools/acp-agents-setup).

## Dépannage

| Symptôme                                                                    | Cause probable                                                                                                         | Correctif                                                                                                                                                                        |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Plugin backend manquant, désactivé ou bloqué par `plugins.allow`.                                                      | Installez et activez le Plugin backend, incluez `acpx` dans `plugins.allow` lorsque cette liste d’autorisation est définie, puis exécutez `/acp doctor`.                         |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP désactivé globalement.                                                                                             | Définissez `acp.enabled=true`.                                                                                                                                                   |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Répartition automatique depuis les messages de fil normaux désactivée.                                                  | Définissez `acp.dispatch.enabled=true` pour reprendre le routage automatique des fils ; les appels explicites `sessions_spawn({ runtime: "acp" })` fonctionnent toujours.        |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent absent de la liste d’autorisation.                                                                               | Utilisez un `agentId` autorisé ou mettez à jour `acp.allowedAgents`.                                                                                                             |
| `/acp doctor` signale que le backend n’est pas prêt juste après le démarrage | Le Plugin backend est manquant, désactivé, bloqué par une politique d’autorisation/refus, ou son exécutable configuré est indisponible. | Installez/activez le Plugin backend, relancez `/acp doctor` et inspectez l’erreur d’installation du backend ou de politique s’il reste défaillant.                               |
| Commande de harnais introuvable                                             | La CLI d’adaptateur n’est pas installée, le Plugin externe est manquant, ou la récupération `npx` au premier lancement a échoué pour un adaptateur non-Codex. | Exécutez `/acp doctor`, installez/préchauffez l’adaptateur sur l’hôte Gateway, ou configurez explicitement la commande de l’agent acpx.                                           |
| Modèle introuvable depuis le harnais                                        | L’identifiant de modèle est valide pour un autre fournisseur/harnais, mais pas pour cette cible ACP.                    | Utilisez un modèle listé par ce harnais, configurez le modèle dans le harnais, ou omettez la surcharge.                                                                          |
| Erreur d’authentification fournisseur depuis le harnais                     | OpenClaw est sain, mais la CLI/le fournisseur cible n’est pas connecté.                                                 | Connectez-vous ou fournissez la clé fournisseur requise dans l’environnement de l’hôte Gateway.                                                                                  |
| `Unable to resolve session target: ...`                                     | Mauvais jeton de clé/id/libellé.                                                                                       | Exécutez `/acp sessions`, copiez la clé/le libellé exact, puis réessayez.                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` utilisé sans conversation active pouvant être liée.                                                       | Allez dans le chat/canal cible et réessayez, ou utilisez un spawn non lié.                                                                                                       |
| `Conversation bindings are unavailable for <channel>.`                      | L’adaptateur ne dispose pas de la capacité de liaison ACP à la conversation actuelle.                                   | Utilisez `/acp spawn ... --thread ...` lorsque c’est pris en charge, configurez `bindings[]` au niveau supérieur, ou passez à un canal pris en charge.                           |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` utilisé hors d’un contexte de fil.                                                                      | Allez dans le fil cible ou utilisez `--thread auto`/`off`.                                                                                                                       |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Un autre utilisateur possède la cible de liaison active.                                                               | Recréez la liaison en tant que propriétaire ou utilisez une autre conversation ou un autre fil.                                                                                  |
| `Thread bindings are unavailable for <channel>.`                            | L’adaptateur ne dispose pas de la capacité de liaison de fil.                                                          | Utilisez `--thread off` ou passez à un adaptateur/canal pris en charge.                                                                                                         |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Le runtime ACP est côté hôte ; la session demandeuse est en bac à sable.                                                | Utilisez `runtime="subagent"` depuis les sessions en bac à sable, ou lancez le spawn ACP depuis une session non mise en bac à sable.                                             |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` demandé pour le runtime ACP.                                                                       | Utilisez `runtime="subagent"` pour exiger la mise en bac à sable, ou utilisez ACP avec `sandbox="inherit"` depuis une session non mise en bac à sable.                           |
| `Cannot apply --model ... did not advertise model support`                  | Le harnais cible n’expose pas le changement de modèle ACP générique.                                                   | Utilisez un harnais qui annonce ACP `models`/`session/set_model`, utilisez les références de modèle ACP Codex, ou configurez le modèle directement dans le harnais s’il dispose de son propre indicateur de démarrage. |
| Métadonnées ACP manquantes pour la session liée                             | Métadonnées de session ACP obsolètes/supprimées.                                                                       | Recréez avec `/acp spawn`, puis recréez la liaison ou focalisez le fil.                                                                                                         |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` bloque les écritures/exec dans une session ACP non interactive.                                        | Définissez `plugins.entries.acpx.config.permissionMode` sur `approve-all` et redémarrez le Gateway. Consultez [Configuration des autorisations](/fr/tools/acp-agents-setup#permission-configuration). |
| La session ACP échoue tôt avec peu de sortie                                | Les invites d’autorisation sont bloquées par `permissionMode`/`nonInteractivePermissions`.                             | Vérifiez les journaux Gateway pour `AcpRuntimeError`. Pour des autorisations complètes, définissez `permissionMode=approve-all` ; pour une dégradation progressive, définissez `nonInteractivePermissions=deny`. |
| La session ACP reste bloquée indéfiniment après avoir terminé le travail    | Le processus du harnais s’est terminé, mais la session ACP n’a pas signalé l’achèvement.                               | Surveillez avec `ps aux \| grep acpx` ; tuez manuellement les processus obsolètes.                                                                                              |
| Le harnais voit `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                     | L’enveloppe d’événement interne a fui à travers la frontière ACP.                                                      | Mettez à jour OpenClaw et relancez le flux d’achèvement ; les harnais externes doivent recevoir uniquement des invites d’achèvement simples.                                    |

## Associés

- [Agents ACP — configuration](/fr/tools/acp-agents-setup)
- [Envoi à un agent](/fr/tools/agent-send)
- [Backends CLI](/fr/gateway/cli-backends)
- [Harnais Codex](/fr/plugins/codex-harness)
- [Outils de bac à sable multi-agents](/fr/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (mode pont)](/fr/cli/acp)
- [Sous-agents](/fr/tools/subagents)
