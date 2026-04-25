---
read_when:
    - Exécuter des harnais de code via ACP
    - Configurer des sessions ACP liées aux conversations sur les canaux de messagerie
    - Associer une conversation de canal de messagerie à une session ACP persistante
    - Dépannage du backend ACP et du câblage du Plugin
    - Débogage de la livraison des complétions ACP ou des boucles agent à agent
    - Utiliser les commandes /acp depuis le chat
summary: Utiliser les sessions de runtime ACP pour Claude Code, Cursor, Gemini CLI, le fallback ACP Codex explicite, OpenClaw ACP et les autres agents de harnais
title: Agents ACP
x-i18n:
    generated_at: "2026-04-25T13:58:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 54f23bbfbd915147771b642e899ef2a660cacff2f8ae54facd6ba4cee946b2a1
    source_path: tools/acp-agents.md
    workflow: 15
---

Les sessions [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) permettent à OpenClaw d’exécuter des harnais de code externes (par exemple Pi, Claude Code, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI et d’autres harnais ACPX pris en charge) via un Plugin backend ACP.

Si vous demandez à OpenClaw en langage naturel d’associer ou de contrôler Codex dans la conversation en cours, OpenClaw doit utiliser le Plugin natif app-server Codex (`/codex bind`, `/codex threads`, `/codex resume`). Si vous demandez `/acp`, ACP, acpx ou une session enfant d’arrière-plan Codex ACP explicite, OpenClaw peut toujours faire passer Codex via ACP. Chaque lancement de session ACP est suivi comme une [tâche d’arrière-plan](/fr/automation/tasks).

Si vous demandez à OpenClaw en langage naturel de « démarrer Claude Code dans un fil » ou d’utiliser un autre harnais externe, OpenClaw doit acheminer cette demande vers le runtime ACP (et non vers le runtime natif de sous-agent).

Si vous voulez que Codex ou Claude Code se connecte comme client MCP externe directement
à des conversations de canal OpenClaw existantes, utilisez plutôt [`openclaw mcp serve`](/fr/cli/mcp)
qu’ACP.

## Quelle page me faut-il ?

Il existe trois surfaces proches qu’il est facile de confondre :

| Vous voulez...                                                                                  | Utiliser                              | Notes                                                                                                                                                      |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Associer ou contrôler Codex dans la conversation en cours                                       | `/codex bind`, `/codex threads`       | Chemin natif app-server Codex ; inclut les réponses de chat associées, le transfert d’images, les contrôles modèle/rapide/autorisations, stop et pilotage. ACP est un fallback explicite |
| Exécuter Claude Code, Gemini CLI, Codex ACP explicite ou un autre harnais externe _via_ OpenClaw | Cette page : agents ACP               | Sessions liées au chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tâches d’arrière-plan, contrôles du runtime                                  |
| Exposer une session Gateway OpenClaw _en tant que_ serveur ACP pour un éditeur ou un client     | [`openclaw acp`](/fr/cli/acp)            | Mode pont. L’IDE/client parle ACP à OpenClaw via stdio/WebSocket                                                                                           |
| Réutiliser une CLI IA locale comme modèle de fallback texte uniquement                          | [Backends CLI](/fr/gateway/cli-backends) | Pas ACP. Pas d’outils OpenClaw, pas de contrôles ACP, pas de runtime de harnais                                                                           |

## Est-ce que cela fonctionne immédiatement ?

En général, oui. Les nouvelles installations sont livrées avec le Plugin de runtime `acpx` inclus activé par défaut, avec un binaire `acpx` épinglé local au Plugin que OpenClaw sonde et auto-répare au démarrage. Exécutez `/acp doctor` pour une vérification de disponibilité.

Points d’attention au premier lancement :

- Les adaptateurs de harnais cibles (Codex, Claude, etc.) peuvent être récupérés à la demande avec `npx` lors de la première utilisation.
- L’authentification du fournisseur doit toujours exister sur l’hôte pour ce harnais.
- Si l’hôte n’a ni npm ni accès réseau, les récupérations d’adaptateurs au premier lancement échouent tant que les caches ne sont pas préchauffés ou que l’adaptateur n’est pas installé autrement.

## Guide opérateur

Flux rapide `/acp` depuis le chat :

1. **Lancer** — `/acp spawn claude --bind here`, `/acp spawn gemini --mode persistent --thread auto` ou `/acp spawn codex --bind here` explicite
2. **Travailler** dans la conversation ou le fil associé (ou cibler explicitement la clé de session).
3. **Vérifier l’état** — `/acp status`
4. **Ajuster** — `/acp model <provider/model>`, `/acp permissions <profile>`, `/acp timeout <seconds>`
5. **Piloter** sans remplacer le contexte — `/acp steer tighten logging and continue`
6. **Arrêter** — `/acp cancel` (tour en cours) ou `/acp close` (session + associations)

Déclencheurs en langage naturel qui doivent être acheminés vers le Plugin natif Codex :

- « Associe ce canal Discord à Codex. »
- « Attache ce chat au fil Codex `<id>`. »
- « Montre les fils Codex, puis associe celui-ci. »

L’association native de conversation Codex est le chemin de contrôle par chat par défaut. Les
outils dynamiques OpenClaw continuent de s’exécuter via OpenClaw, tandis que les outils
natifs Codex tels que shell/apply-patch s’exécutent dans Codex. Pour les événements
d’outils natifs Codex, OpenClaw injecte un relais de hook natif par tour afin que les hooks du Plugin puissent bloquer
`before_tool_call`, observer `after_tool_call` et acheminer les événements Codex
`PermissionRequest` via les approbations OpenClaw. Le relais v1 est
délibérément conservateur : il ne modifie pas les arguments des outils natifs Codex,
ne réécrit pas les enregistrements de fils Codex et ne filtre pas les réponses finales ni les hooks Stop. Utilisez ACP explicite
uniquement lorsque vous voulez le modèle de runtime/session ACP. La limite de prise en charge Codex intégrée
est documentée dans le
[contrat de prise en charge v1 du harnais Codex](/fr/plugins/codex-harness#v1-support-contract).

Déclencheurs en langage naturel qui doivent être acheminés vers le runtime ACP :

- « Exécute ceci comme une session ACP Claude Code one-shot et résume le résultat. »
- « Utilise Gemini CLI pour cette tâche dans un fil, puis garde les suivis dans ce même fil. »
- « Exécute Codex via ACP dans un fil d’arrière-plan. »

OpenClaw choisit `runtime: "acp"`, résout le `agentId` du harnais, l’associe à la conversation ou au fil en cours lorsque c’est pris en charge, et achemine les suivis vers cette session jusqu’à la fermeture/l’expiration. Codex ne suit ce chemin que lorsque ACP est explicite ou que le runtime d’arrière-plan demandé a encore besoin d’ACP.

## ACP versus sous-agents

Utilisez ACP quand vous voulez un runtime de harnais externe. Utilisez l’app-server natif Codex pour l’association/le contrôle de conversation Codex. Utilisez les sous-agents quand vous voulez des exécutions déléguées natives OpenClaw.

| Domaine       | Session ACP                           | Exécution de sous-agent             |
| ------------- | ------------------------------------- | ----------------------------------- |
| Runtime       | Plugin backend ACP (par exemple acpx) | Runtime natif de sous-agent OpenClaw |
| Clé de session | `agent:<agentId>:acp:<uuid>`         | `agent:<agentId>:subagent:<uuid>`   |
| Commandes principales | `/acp ...`                    | `/subagents ...`                    |
| Outil de lancement | `sessions_spawn` avec `runtime:"acp"` | `sessions_spawn` (runtime par défaut) |

Voir aussi [Sous-agents](/fr/tools/subagents).

## Comment ACP exécute Claude Code

Pour Claude Code via ACP, la pile est :

1. Plan de contrôle de session ACP OpenClaw
2. Plugin de runtime `acpx` inclus
3. Adaptateur ACP Claude
4. Mécanisme de runtime/session côté Claude

Distinction importante :

- ACP Claude est une session de harnais avec contrôles ACP, reprise de session, suivi de tâche d’arrière-plan et association facultative à une conversation/un fil.
- Les backends CLI sont des runtimes de fallback locaux distincts en texte uniquement. Voir [Backends CLI](/fr/gateway/cli-backends).

Pour les opérateurs, la règle pratique est :

- vous voulez `/acp spawn`, des sessions associables, des contrôles de runtime ou un travail de harnais persistant : utilisez ACP
- vous voulez un simple fallback texte local via la CLI brute : utilisez les backends CLI

## Sessions associées

### Associations à la conversation actuelle

`/acp spawn <harness> --bind here` épingle la conversation actuelle à la session ACP lancée — pas de fil enfant, même surface de chat. OpenClaw conserve la maîtrise du transport, de l’authentification, de la sécurité et de la livraison ; les messages de suivi dans cette conversation sont acheminés vers la même session ; `/new` et `/reset` réinitialisent la session sur place ; `/acp close` supprime l’association.

Modèle mental :

- **surface de chat** — l’endroit où les personnes continuent de parler (canal Discord, sujet Telegram, chat iMessage).
- **session ACP** — l’état de runtime durable Codex/Claude/Gemini vers lequel OpenClaw achemine.
- **fil/sujet enfant** — surface de messagerie supplémentaire facultative créée uniquement par `--thread ...`.
- **espace de travail du runtime** — l’emplacement du système de fichiers (`cwd`, checkout du dépôt, espace de travail backend) où le harnais s’exécute. Indépendant de la surface de chat.

Exemples :

- `/codex bind` — conserver ce chat, lancer ou attacher l’app-server natif Codex, acheminer les futurs messages ici.
- `/codex model gpt-5.4`, `/codex fast on`, `/codex permissions yolo` — ajuster le fil natif Codex associé depuis le chat.
- `/codex stop` ou `/codex steer focus on the failing tests first` — contrôler le tour natif Codex actif.
- `/acp spawn codex --bind here` — fallback ACP explicite pour Codex.
- `/acp spawn codex --thread auto` — OpenClaw peut créer un fil/sujet enfant et s’y associer.
- `/acp spawn codex --bind here --cwd /workspace/repo` — même association de chat, Codex s’exécute dans `/workspace/repo`.

Notes :

- `--bind here` et `--thread ...` sont mutuellement exclusifs.
- `--bind here` fonctionne uniquement sur les canaux qui annoncent l’association à la conversation actuelle ; sinon OpenClaw renvoie un message clair indiquant que ce n’est pas pris en charge. Les associations persistent après les redémarrages de Gateway.
- Sur Discord, `spawnAcpSessions` n’est requis que lorsque OpenClaw doit créer un fil enfant pour `--thread auto|here` — pas pour `--bind here`.
- Si vous lancez vers un autre agent ACP sans `--cwd`, OpenClaw hérite par défaut de l’espace de travail de **l’agent cible**. Les chemins hérités manquants (`ENOENT`/`ENOTDIR`) reviennent au défaut du backend ; les autres erreurs d’accès (par ex. `EACCES`) apparaissent comme des erreurs de lancement.

### Sessions associées à un fil

Lorsque les associations de fil sont activées pour un adaptateur de canal, les sessions ACP peuvent être associées à des fils :

- OpenClaw associe un fil à une session ACP cible.
- Les messages de suivi dans ce fil sont acheminés vers la session ACP associée.
- La sortie ACP est livrée dans le même fil.
- Perte de focus/fermeture/archivage/expiration pour inactivité ou âge maximal supprime l’association.

La prise en charge de l’association à un fil dépend de l’adaptateur. Si l’adaptateur de canal actif ne prend pas en charge les associations à des fils, OpenClaw renvoie un message clair indiquant que ce n’est pas pris en charge/disponible.

Indicateurs de fonctionnalité requis pour ACP associé à un fil :

- `acp.enabled=true`
- `acp.dispatch.enabled` est activé par défaut (définissez `false` pour suspendre la distribution ACP)
- Indicateur d’adaptateur de canal pour le lancement ACP dans un fil activé (spécifique à l’adaptateur)
  - Discord : `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram : `channels.telegram.threadBindings.spawnAcpSessions=true`

### Canaux prenant en charge les fils

- Tout adaptateur de canal exposant une capacité d’association de session/fil.
- Prise en charge intégrée actuelle :
  - Fils/canaux Discord
  - Sujets Telegram (sujets de forum dans les groupes/supergroupes et sujets de MP)
- Les canaux Plugin peuvent ajouter la prise en charge via la même interface d’association.

## Paramètres spécifiques au canal

Pour les workflows non éphémères, configurez des associations ACP persistantes dans des entrées `bindings[]` de niveau supérieur.

### Modèle d’association

- `bindings[].type="acp"` marque une association persistante de conversation ACP.
- `bindings[].match` identifie la conversation cible :
  - Canal ou fil Discord : `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Sujet de forum Telegram : `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - Chat MP/groupe BlueBubbles : `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`

    Préférez `chat_id:*` ou `chat_identifier:*` pour des associations de groupe stables.
  - Chat MP/groupe iMessage : `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`

    Préférez `chat_id:*` pour des associations de groupe stables.
- `bindings[].agentId` est l’identifiant de l’agent OpenClaw propriétaire.
- Les remplacements ACP facultatifs se trouvent sous `bindings[].acp` :
  - `mode` (`persistent` ou `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Valeurs par défaut du runtime par agent

Utilisez `agents.list[].runtime` pour définir une fois les valeurs par défaut ACP par agent :

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (identifiant du harnais, par exemple `codex` ou `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

Ordre de priorité des remplacements pour les sessions ACP associées :

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. valeurs par défaut ACP globales (par exemple `acp.backend`)

Exemple :

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

Comportement :

- OpenClaw s’assure que la session ACP configurée existe avant utilisation.
- Les messages dans ce canal ou ce sujet sont acheminés vers la session ACP configurée.
- Dans les conversations associées, `/new` et `/reset` réinitialisent sur place la même clé de session ACP.
- Les associations temporaires de runtime (par exemple créées par des flux de focus sur fil) continuent de s’appliquer lorsqu’elles sont présentes.
- Pour les lancements ACP inter-agents sans `cwd` explicite, OpenClaw hérite de l’espace de travail de l’agent cible depuis la configuration de l’agent.
- Les chemins d’espace de travail hérités manquants reviennent au `cwd` par défaut du backend ; les échecs d’accès sur des chemins existants apparaissent comme des erreurs de lancement.

## Démarrer des sessions ACP (interfaces)

### Depuis `sessions_spawn`

Utilisez `runtime: "acp"` pour démarrer une session ACP depuis un tour d’agent ou un appel d’outil.

```json
{
  "task": "Open the repo and summarize failing tests",
  "runtime": "acp",
  "agentId": "codex",
  "thread": true,
  "mode": "session"
}
```

Notes :

- `runtime` vaut par défaut `subagent`, donc définissez explicitement `runtime: "acp"` pour les sessions ACP.
- Si `agentId` est omis, OpenClaw utilise `acp.defaultAgent` lorsqu’il est configuré.
- `mode: "session"` requiert `thread: true` pour conserver une conversation persistante associée.

Détails de l’interface :

- `task` (obligatoire) : prompt initial envoyé à la session ACP.
- `runtime` (obligatoire pour ACP) : doit être `"acp"`.
- `agentId` (facultatif) : identifiant du harnais ACP cible. Revient à `acp.defaultAgent` s’il est défini.
- `thread` (facultatif, `false` par défaut) : demande un flux d’association à un fil lorsque c’est pris en charge.
- `mode` (facultatif) : `run` (one-shot) ou `session` (persistant).
  - la valeur par défaut est `run`
  - si `thread: true` et que `mode` est omis, OpenClaw peut adopter un comportement persistant par défaut selon le chemin du runtime
  - `mode: "session"` requiert `thread: true`
- `cwd` (facultatif) : répertoire de travail demandé pour le runtime (validé par la politique du backend/runtime). S’il est omis, le lancement ACP hérite de l’espace de travail de l’agent cible lorsqu’il est configuré ; les chemins hérités manquants reviennent aux valeurs par défaut du backend, tandis que les véritables erreurs d’accès sont renvoyées.
- `label` (facultatif) : libellé visible par l’opérateur utilisé dans le texte de session/bannière.
- `resumeSessionId` (facultatif) : reprend une session ACP existante au lieu d’en créer une nouvelle. L’agent rejoue son historique de conversation via `session/load`. Requiert `runtime: "acp"`.
- `streamTo` (facultatif) : `"parent"` diffuse les résumés de progression de l’exécution ACP initiale vers la session demandeuse sous forme d’événements système.
  - Lorsqu’elle est disponible, la réponse acceptée inclut `streamLogPath` pointant vers un journal JSONL à portée de session (`<sessionId>.acp-stream.jsonl`) que vous pouvez suivre pour l’historique complet du relais.
- `model` (facultatif) : remplacement explicite du modèle pour la session enfant ACP. Pris en compte pour `runtime: "acp"` afin que l’enfant utilise le modèle demandé au lieu de revenir silencieusement au modèle par défaut de l’agent cible.

## Modèle de livraison

Les sessions ACP peuvent être soit des espaces de travail interactifs, soit du travail d’arrière-plan appartenant au parent. Le chemin de livraison dépend de cette forme.

### Sessions ACP interactives

Les sessions interactives sont conçues pour continuer à dialoguer sur une surface de chat visible :

- `/acp spawn ... --bind here` associe la conversation actuelle à la session ACP.
- `/acp spawn ... --thread ...` associe un fil/sujet de canal à la session ACP.
- Les `bindings[].type="acp"` persistants configurés acheminent les conversations correspondantes vers la même session ACP.

Les messages de suivi dans la conversation associée sont acheminés directement vers la session ACP, et la sortie ACP est livrée dans ce même canal/fil/sujet.

### Sessions ACP one-shot appartenant au parent

Les sessions ACP one-shot lancées par une autre exécution d’agent sont des enfants d’arrière-plan, similaires aux sous-agents :

- Le parent demande du travail avec `sessions_spawn({ runtime: "acp", mode: "run" })`.
- L’enfant s’exécute dans sa propre session de harnais ACP.
- L’achèvement est signalé via le chemin interne d’annonce de fin de tâche.
- Le parent réécrit le résultat de l’enfant avec une voix d’assistant normale lorsqu’une réponse destinée à l’utilisateur est utile.

Ne traitez pas ce chemin comme un chat pair à pair entre parent et enfant. L’enfant dispose déjà d’un canal de fin vers le parent.

### `sessions_send` et la livraison A2A

`sessions_send` peut cibler une autre session après le lancement. Pour les sessions pair normales, OpenClaw utilise un chemin de suivi agent à agent (A2A) après injection du message :

- attendre la réponse de la session cible
- éventuellement laisser le demandeur et la cible échanger un nombre limité de tours de suivi
- demander à la cible de produire un message d’annonce
- livrer cette annonce au canal ou fil visible

Ce chemin A2A sert de fallback pour les envois entre pairs lorsque l’expéditeur a besoin d’un suivi visible. Il reste activé lorsqu’une session non liée peut voir et envoyer un message à une cible ACP, par exemple avec des paramètres larges `tools.sessions.visibility`.

OpenClaw ignore le suivi A2A uniquement lorsque le demandeur est le parent de son propre enfant ACP one-shot appartenant au parent. Dans ce cas, exécuter A2A en plus de la fin de tâche peut réveiller le parent avec le résultat de l’enfant, renvoyer la réponse du parent dans l’enfant et créer une boucle d’écho parent/enfant. Le résultat de `sessions_send` signale `delivery.status="skipped"` pour ce cas d’enfant possédé, car le chemin de fin est déjà responsable du résultat.

### Reprendre une session existante

Utilisez `resumeSessionId` pour continuer une session ACP précédente au lieu de repartir de zéro. L’agent rejoue son historique de conversation via `session/load`, de sorte qu’il reprend avec le contexte complet de ce qui précède.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Cas d’utilisation courants :

- Transférer une session Codex de votre ordinateur portable à votre téléphone — dites à votre agent de reprendre là où vous vous êtes arrêté
- Continuer une session de code démarrée de façon interactive dans la CLI, maintenant en mode headless via votre agent
- Reprendre un travail interrompu par un redémarrage de Gateway ou un délai d’inactivité

Notes :

- `resumeSessionId` requiert `runtime: "acp"` — renvoie une erreur s’il est utilisé avec le runtime de sous-agent.
- `resumeSessionId` restaure l’historique de conversation ACP amont ; `thread` et `mode` s’appliquent toujours normalement à la nouvelle session OpenClaw que vous créez, donc `mode: "session"` requiert toujours `thread: true`.
- L’agent cible doit prendre en charge `session/load` (Codex et Claude Code le prennent en charge).
- Si l’identifiant de session est introuvable, le lancement échoue avec une erreur claire — pas de fallback silencieux vers une nouvelle session.

<Accordion title="Test smoke après déploiement">

Après un déploiement de Gateway, effectuez une vérification live end-to-end au lieu de faire confiance uniquement aux tests unitaires :

1. Vérifiez la version et le commit du Gateway déployé sur l’hôte cible.
2. Ouvrez une session de pont ACPX temporaire vers un agent live.
3. Demandez à cet agent d’appeler `sessions_spawn` avec `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` et la tâche `Reply with exactly LIVE-ACP-SPAWN-OK`.
4. Vérifiez `accepted=yes`, une vraie `childSessionKey` et l’absence d’erreur de validateur.
5. Nettoyez la session de pont temporaire.

Conservez la vérification sur `mode: "run"` et ignorez `streamTo: "parent"` — les chemins `mode: "session"` associés à un fil et de relais de flux sont des passes d’intégration plus riches et distinctes.

</Accordion>

## Compatibilité avec la sandbox

Les sessions ACP s’exécutent actuellement sur le runtime hôte, pas dans la sandbox OpenClaw.

Limitations actuelles :

- Si la session demandeuse est en sandbox, les lancements ACP sont bloqués pour `sessions_spawn({ runtime: "acp" })` comme pour `/acp spawn`.
  - Erreur : `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` avec `runtime: "acp"` ne prend pas en charge `sandbox: "require"`.
  - Erreur : `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Utilisez `runtime: "subagent"` lorsque vous avez besoin d’une exécution imposée par sandbox.

### Depuis la commande `/acp`

Utilisez `/acp spawn` pour un contrôle opérateur explicite depuis le chat lorsque nécessaire.

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

Voir [Commandes slash](/fr/tools/slash-commands).

## Résolution de la cible de session

La plupart des actions `/acp` acceptent une cible de session facultative (`session-key`, `session-id` ou `session-label`).

Ordre de résolution :

1. Argument de cible explicite (ou `--session` pour `/acp steer`)
   - essaie d’abord la clé
   - puis l’identifiant de session en forme UUID
   - puis le libellé
2. Association du fil actuel (si cette conversation/ce fil est associé à une session ACP)
3. Fallback vers la session demandeuse actuelle

Les associations à la conversation actuelle et les associations à un fil participent toutes deux à l’étape 2.

Si aucune cible n’est résolue, OpenClaw renvoie une erreur claire (`Unable to resolve session target: ...`).

## Modes d’association au lancement

`/acp spawn` prend en charge `--bind here|off`.

| Mode   | Comportement                                                               |
| ------ | -------------------------------------------------------------------------- |
| `here` | Associe sur place la conversation active actuelle ; échoue si aucune n’est active. |
| `off`  | Ne crée pas d’association à la conversation actuelle.                      |

Notes :

- `--bind here` est le chemin opérateur le plus simple pour « rendre ce canal ou ce chat adossé à Codex ».
- `--bind here` ne crée pas de fil enfant.
- `--bind here` est disponible uniquement sur les canaux exposant la prise en charge de l’association à la conversation actuelle.
- `--bind` et `--thread` ne peuvent pas être combinés dans le même appel `/acp spawn`.

## Modes de fil au lancement

`/acp spawn` prend en charge `--thread auto|here|off`.

| Mode   | Comportement                                                                                                  |
| ------ | ------------------------------------------------------------------------------------------------------------- |
| `auto` | Dans un fil actif : associe ce fil. Hors d’un fil : crée/associe un fil enfant lorsque c’est pris en charge. |
| `here` | Exige un fil actif actuel ; échoue si vous n’êtes pas dans un fil.                                            |
| `off`  | Aucune association. La session démarre sans être associée.                                                    |

Notes :

- Sur les surfaces sans association à un fil, le comportement par défaut revient en pratique à `off`.
- Le lancement avec association à un fil requiert la prise en charge de la politique du canal :
  - Discord : `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram : `channels.telegram.threadBindings.spawnAcpSessions=true`
- Utilisez `--bind here` lorsque vous voulez épingler la conversation actuelle sans créer de fil enfant.

## Contrôles ACP

| Commande             | Ce qu’elle fait                                           | Exemple                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Crée une session ACP ; association actuelle ou à un fil facultative. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Annule le tour en cours pour la session cible.            | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Envoie une instruction de pilotage à la session en cours. | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Ferme la session et détache les cibles de fil.            | `/acp close`                                                  |
| `/acp status`        | Affiche le backend, le mode, l’état, les options de runtime et les capacités. | `/acp status`                                                 |
| `/acp set-mode`      | Définit le mode de runtime pour la session cible.         | `/acp set-mode plan`                                          |
| `/acp set`           | Écriture générique d’une option de configuration du runtime. | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Définit le remplacement du répertoire de travail du runtime. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Définit le profil de politique d’approbation.             | `/acp permissions strict`                                     |
| `/acp timeout`       | Définit le délai d’expiration du runtime (secondes).      | `/acp timeout 120`                                            |
| `/acp model`         | Définit le remplacement du modèle du runtime.             | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Supprime les remplacements d’options du runtime de la session. | `/acp reset-options`                                          |
| `/acp sessions`      | Liste les sessions ACP récentes depuis le stockage.       | `/acp sessions`                                               |
| `/acp doctor`        | Santé du backend, capacités, corrections exploitables.    | `/acp doctor`                                                 |
| `/acp install`       | Affiche des étapes déterministes d’installation et d’activation. | `/acp install`                                                |

`/acp status` affiche les options effectives du runtime ainsi que les identifiants de session au niveau du runtime et du backend. Les erreurs de contrôle non pris en charge apparaissent clairement lorsqu’un backend ne dispose pas d’une capacité. `/acp sessions` lit le stockage pour la session actuellement associée ou demandeuse ; les jetons cibles (`session-key`, `session-id` ou `session-label`) sont résolus via la découverte de sessions Gateway, y compris les racines personnalisées `session.store` par agent.

## Mappage des options de runtime

`/acp` fournit des commandes pratiques ainsi qu’un setter générique.

Opérations équivalentes :

- `/acp model <id>` correspond à la clé de configuration runtime `model`.
- `/acp permissions <profile>` correspond à la clé de configuration runtime `approval_policy`.
- `/acp timeout <seconds>` correspond à la clé de configuration runtime `timeout`.
- `/acp cwd <path>` met à jour directement le remplacement du cwd du runtime.
- `/acp set <key> <value>` est le chemin générique.
  - Cas particulier : `key=cwd` utilise le chemin de remplacement du cwd.
- `/acp reset-options` efface tous les remplacements du runtime pour la session cible.

## Harnais acpx, configuration du Plugin et autorisations

Pour la configuration du harnais acpx (alias Claude Code / Codex / Gemini CLI), les
ponts MCP plugin-tools et OpenClaw-tools, ainsi que les modes d’autorisation ACP, voir
[Agents ACP — configuration](/fr/tools/acp-agents-setup).

## Dépannage

| Symptôme                                                                    | Cause probable                                                                  | Correctif                                                                                                                                                                  |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Le Plugin backend est absent ou désactivé.                                      | Installez et activez le Plugin backend, puis exécutez `/acp doctor`.                                                                                                      |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP est désactivé globalement.                                                  | Définissez `acp.enabled=true`.                                                                                                                                             |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | La distribution depuis les messages de fil normaux est désactivée.              | Définissez `acp.dispatch.enabled=true`.                                                                                                                                    |
| `ACP agent "<id>" is not allowed by policy`                                 | L’agent n’est pas dans la liste d’autorisation.                                 | Utilisez un `agentId` autorisé ou mettez à jour `acp.allowedAgents`.                                                                                                      |
| `Unable to resolve session target: ...`                                     | Mauvais jeton clé/id/libellé.                                                   | Exécutez `/acp sessions`, copiez la clé/le libellé exact, puis réessayez.                                                                                                 |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` a été utilisé sans conversation active pouvant être associée.     | Déplacez-vous vers le chat/canal cible et réessayez, ou utilisez un lancement sans association.                                                                           |
| `Conversation bindings are unavailable for <channel>.`                      | L’adaptateur n’a pas la capacité d’association ACP à la conversation actuelle.  | Utilisez `/acp spawn ... --thread ...` lorsque c’est pris en charge, configurez des `bindings[]` de niveau supérieur, ou passez à un canal pris en charge.               |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` a été utilisé hors d’un contexte de fil.                        | Déplacez-vous vers le fil cible ou utilisez `--thread auto`/`off`.                                                                                                        |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Un autre utilisateur possède la cible d’association active.                     | Réassociez en tant que propriétaire ou utilisez une autre conversation ou un autre fil.                                                                                   |
| `Thread bindings are unavailable for <channel>.`                            | L’adaptateur n’a pas la capacité d’association à un fil.                        | Utilisez `--thread off` ou passez à un adaptateur/canal pris en charge.                                                                                                   |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Le runtime ACP est côté hôte ; la session demandeuse est en sandbox.            | Utilisez `runtime="subagent"` depuis des sessions en sandbox, ou lancez ACP depuis une session non sandboxée.                                                            |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` a été demandé pour le runtime ACP.                          | Utilisez `runtime="subagent"` pour un sandboxing obligatoire, ou utilisez ACP avec `sandbox="inherit"` depuis une session non sandboxée.                                 |
| Métadonnées ACP manquantes pour la session associée                         | Métadonnées de session ACP obsolètes/supprimées.                                | Recréez avec `/acp spawn`, puis réassociez/redonnez le focus au fil.                                                                                                      |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` bloque les écritures/exécutions dans une session ACP non interactive. | Définissez `plugins.entries.acpx.config.permissionMode` sur `approve-all` et redémarrez Gateway. Voir [Configuration des autorisations](/fr/tools/acp-agents-setup#permission-configuration). |
| La session ACP échoue tôt avec peu de sortie                                | Les invites d’autorisation sont bloquées par `permissionMode`/`nonInteractivePermissions`. | Vérifiez les journaux Gateway pour `AcpRuntimeError`. Pour des autorisations complètes, définissez `permissionMode=approve-all` ; pour une dégradation gracieuse, définissez `nonInteractivePermissions=deny`. |
| La session ACP reste bloquée indéfiniment après la fin du travail           | Le processus du harnais s’est terminé mais la session ACP n’a pas signalé sa fin. | Surveillez avec `ps aux \| grep acpx` ; tuez manuellement les processus obsolètes.                                                                                        |

## Lié

- [Sous-agents](/fr/tools/subagents)
- [Outils sandbox multi-agents](/fr/tools/multi-agent-sandbox-tools)
- [Envoi d’agent](/fr/tools/agent-send)
