---
read_when:
    - Exécution des harness de coding via ACP
    - Configuration de sessions ACP liées à une conversation sur des canaux de messagerie
    - Liaison d’une conversation de canal de messagerie à une session ACP persistante
    - Résolution des problèmes du backend ACP et du câblage du Plugin
    - Débogage de la remise des complétions ACP ou des boucles agent-à-agent
    - Utilisation des commandes `/acp` depuis le chat
summary: Utilisez les sessions runtime ACP pour Codex, Claude Code, Cursor, Gemini CLI, OpenClaw ACP et les autres agents harness
title: Agents ACP
x-i18n:
    generated_at: "2026-04-22T04:27:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 71ae74200cb7581a68c4593fd7e510378267daaf7acbcd7667cde56335ebadea
    source_path: tools/acp-agents.md
    workflow: 15
---

# Agents ACP

Les sessions [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) permettent à OpenClaw d’exécuter des harness de coding externes (par exemple Pi, Claude Code, Codex, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI et d’autres harness ACPX pris en charge) via un Plugin backend ACP.

Si vous demandez à OpenClaw en langage naturel de « lancer ceci dans Codex » ou de « démarrer Claude Code dans un fil », OpenClaw doit router cette demande vers le runtime ACP (et non vers le runtime natif de sous-agent). Chaque lancement de session ACP est suivi comme une [tâche de fond](/fr/automation/tasks).

Si vous voulez que Codex ou Claude Code se connecte directement comme client MCP externe
à des conversations de canal OpenClaw existantes, utilisez [`openclaw mcp serve`](/cli/mcp)
au lieu d’ACP.

## Quelle page me faut-il ?

Il y a trois surfaces proches qu’il est facile de confondre :

| Vous voulez...                                                                     | Utiliser                              | Remarques                                                                                                       |
| ---------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Exécuter Codex, Claude Code, Gemini CLI ou un autre harness externe _via_ OpenClaw | Cette page : Agents ACP               | Sessions liées au chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tâches de fond, contrôles runtime |
| Exposer une session Gateway OpenClaw _comme_ serveur ACP pour un éditeur ou un client | [`openclaw acp`](/cli/acp)            | Mode bridge. L’IDE/client parle ACP à OpenClaw via stdio/WebSocket                                              |
| Réutiliser une CLI IA locale comme modèle de secours texte uniquement              | [CLI Backends](/fr/gateway/cli-backends) | Pas ACP. Pas d’outils OpenClaw, pas de contrôles ACP, pas de runtime harness                                    |

## Est-ce que cela fonctionne immédiatement ?

Généralement, oui.

- Les nouvelles installations livrent désormais le Plugin runtime `acpx` intégré activé par défaut.
- Le Plugin `acpx` intégré préfère son binaire `acpx` épinglé local au plugin.
- Au démarrage, OpenClaw sonde ce binaire et le répare automatiquement si nécessaire.
- Commencez par `/acp doctor` si vous voulez un contrôle rapide de l’état de préparation.

Ce qui peut encore se produire lors de la première utilisation :

- Un adaptateur de harness cible peut être récupéré à la demande avec `npx` la première fois que vous utilisez ce harness.
- L’authentification du fournisseur doit toujours exister sur l’hôte pour ce harness.
- Si l’hôte n’a pas d’accès npm/réseau, les récupérations d’adaptateur à la première exécution peuvent échouer jusqu’à ce que les caches soient préchauffés ou que l’adaptateur soit installé autrement.

Exemples :

- `/acp spawn codex` : OpenClaw doit être prêt à amorcer `acpx`, mais l’adaptateur ACP Codex peut quand même nécessiter une récupération à la première exécution.
- `/acp spawn claude` : même histoire pour l’adaptateur ACP Claude, plus l’authentification côté Claude sur cet hôte.

## Flux opérateur rapide

Utilisez ceci si vous voulez un guide pratique `/acp` :

1. Lancez une session :
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. Travaillez dans la conversation ou le fil lié (ou ciblez explicitement cette clé de session).
3. Vérifiez l’état runtime :
   - `/acp status`
4. Ajustez les options runtime selon les besoins :
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. Réorientez une session active sans remplacer le contexte :
   - `/acp steer resserre les logs et continue`
6. Arrêtez le travail :
   - `/acp cancel` (arrêter le tour en cours), ou
   - `/acp close` (fermer la session + supprimer les liaisons)

## Démarrage rapide pour les humains

Exemples de demandes en langage naturel :

- « Lier ce canal Discord à Codex. »
- « Démarre une session Codex persistante dans un fil ici et garde-la concentrée. »
- « Exécute ceci comme session ACP Claude Code one-shot et résume le résultat. »
- « Lie ce chat iMessage à Codex et garde les suivis dans le même espace de travail. »
- « Utilise Gemini CLI pour cette tâche dans un fil, puis garde les suivis dans ce même fil. »

Ce qu’OpenClaw doit faire :

1. Choisir `runtime: "acp"`.
2. Résoudre la cible de harness demandée (`agentId`, par exemple `codex`).
3. Si une liaison à la conversation actuelle est demandée et que le canal actif la prend en charge, lier la session ACP à cette conversation.
4. Sinon, si une liaison à un fil est demandée et que le canal actuel la prend en charge, lier la session ACP au fil.
5. Router les messages de suivi liés vers cette même session ACP jusqu’à ce qu’elle soit défocalisée/fermée/expirée.

## ACP versus sous-agents

Utilisez ACP quand vous voulez un runtime de harness externe. Utilisez les sous-agents quand vous voulez des exécutions déléguées natives OpenClaw.

| Zone          | Session ACP                           | Exécution de sous-agent             |
| ------------- | ------------------------------------- | ----------------------------------- |
| Runtime       | Plugin backend ACP (par exemple acpx) | Runtime natif de sous-agent OpenClaw |
| Clé de session   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`   |
| Commandes principales | `/acp ...`                            | `/subagents ...`                    |
| Outil de lancement    | `sessions_spawn` avec `runtime:"acp"` | `sessions_spawn` (runtime par défaut) |

Voir aussi [Sous-agents](/fr/tools/subagents).

## Comment ACP exécute Claude Code

Pour Claude Code via ACP, la pile est :

1. Plan de contrôle de session ACP OpenClaw
2. Plugin runtime `acpx` intégré
3. Adaptateur ACP Claude
4. Runtime/mécanique de session côté Claude

Distinction importante :

- ACP Claude est une session harness avec contrôles ACP, reprise de session, suivi des tâches de fond, et liaison optionnelle à une conversation/un fil.
- Les backends CLI sont des runtimes de secours locaux séparés, texte uniquement. Voir [CLI Backends](/fr/gateway/cli-backends).

Pour les opérateurs, la règle pratique est :

- si vous voulez `/acp spawn`, des sessions pouvant être liées, des contrôles runtime ou un travail harness persistant : utilisez ACP
- si vous voulez un simple secours texte local via la CLI brute : utilisez les backends CLI

## Sessions liées

### Liaisons à la conversation actuelle

Utilisez `/acp spawn <harness> --bind here` lorsque vous voulez que la conversation actuelle devienne un espace de travail ACP durable sans créer de fil enfant.

Comportement :

- OpenClaw continue de prendre en charge le transport du canal, l’authentification, la sécurité et la distribution.
- La conversation actuelle est épinglée à la clé de session ACP créée.
- Les messages de suivi dans cette conversation sont routés vers la même session ACP.
- `/new` et `/reset` réinitialisent en place cette même session ACP liée.
- `/acp close` ferme la session et supprime la liaison à la conversation actuelle.

Ce que cela signifie en pratique :

- `--bind here` conserve la même surface de chat. Sur Discord, le canal actuel reste le canal actuel.
- `--bind here` peut quand même créer une nouvelle session ACP si vous lancez un nouveau travail. La liaison attache cette session à la conversation actuelle.
- `--bind here` ne crée pas à lui seul un fil Discord enfant ni un topic Telegram.
- Le runtime ACP peut quand même avoir son propre répertoire de travail (`cwd`) ou un espace de travail géré sur disque par le backend. Cet espace de travail runtime est séparé de la surface de chat et n’implique pas un nouveau fil de messagerie.
- Si vous lancez vers un autre agent ACP et ne passez pas `--cwd`, OpenClaw hérite par défaut de l’espace de travail de **l’agent cible**, et non de celui du demandeur.
- Si ce chemin d’espace de travail hérité est manquant (`ENOENT`/`ENOTDIR`), OpenClaw se replie sur le `cwd` par défaut du backend au lieu de réutiliser silencieusement le mauvais arbre.
- Si l’espace de travail hérité existe mais n’est pas accessible (par exemple `EACCES`), le lancement renvoie la véritable erreur d’accès au lieu d’ignorer `cwd`.

Modèle mental :

- surface de chat : là où les gens continuent à parler (`canal Discord`, `topic Telegram`, `chat iMessage`)
- session ACP : l’état runtime durable Codex/Claude/Gemini vers lequel OpenClaw route
- fil/topic enfant : surface de messagerie supplémentaire optionnelle créée uniquement par `--thread ...`
- espace de travail runtime : emplacement du système de fichiers où le harness s’exécute (`cwd`, checkout du repo, espace de travail backend)

Exemples :

- `/acp spawn codex --bind here` : conserver ce chat, lancer ou rattacher une session ACP Codex, et y router les futurs messages
- `/acp spawn codex --thread auto` : OpenClaw peut créer un fil/topic enfant et y lier la session ACP
- `/acp spawn codex --bind here --cwd /workspace/repo` : même liaison au chat que ci-dessus, mais Codex s’exécute dans `/workspace/repo`

Prise en charge de la liaison à la conversation actuelle :

- Les canaux de chat/message qui annoncent la prise en charge de la liaison à la conversation actuelle peuvent utiliser `--bind here` via le chemin partagé de liaison de conversation.
- Les canaux avec une sémantique personnalisée de fil/topic peuvent quand même fournir une canonicalisation spécifique au canal derrière la même interface partagée.
- `--bind here` signifie toujours « lier la conversation actuelle en place ».
- Les liaisons génériques à la conversation actuelle utilisent le magasin de liaisons partagé d’OpenClaw et survivent aux redémarrages normaux de la Gateway.

Remarques :

- `--bind here` et `--thread ...` s’excluent mutuellement sur `/acp spawn`.
- Sur Discord, `--bind here` lie en place le canal ou fil actuel. `spawnAcpSessions` n’est requis que lorsqu’OpenClaw doit créer un fil enfant pour `--thread auto|here`.
- Si le canal actif n’expose pas les liaisons ACP à la conversation actuelle, OpenClaw renvoie un message clair indiquant que ce n’est pas pris en charge.
- `resume` et les questions de « nouvelle session » sont des questions de session ACP, pas des questions de canal. Vous pouvez réutiliser ou remplacer l’état runtime sans changer la surface de chat actuelle.

### Sessions liées à un fil

Lorsque les liaisons de fil sont activées pour un adaptateur de canal, les sessions ACP peuvent être liées à des fils :

- OpenClaw lie un fil à une session ACP cible.
- Les messages de suivi dans ce fil sont routés vers la session ACP liée.
- La sortie ACP est renvoyée dans ce même fil.
- La défocalisation/fermeture/archivage/expiration sur délai d’inactivité ou sur âge maximal supprime la liaison.

La prise en charge des liaisons de fil dépend de l’adaptateur. Si l’adaptateur de canal actif ne prend pas en charge les liaisons de fil, OpenClaw renvoie un message clair indiquant que ce n’est pas pris en charge/disponible.

Feature flags requis pour ACP lié à un fil :

- `acp.enabled=true`
- `acp.dispatch.enabled` est activé par défaut (mettre `false` pour suspendre la distribution ACP)
- Feature flag d’adaptateur de canal pour le lancement de fil ACP activé (spécifique à l’adaptateur)
  - Discord : `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram : `channels.telegram.threadBindings.spawnAcpSessions=true`

### Canaux prenant en charge les fils

- Tout adaptateur de canal qui expose une capacité de liaison session/fil.
- Prise en charge intégrée actuelle :
  - Fils/canaux Discord
  - Topics Telegram (topics de forum dans les groupes/supergroupes et topics DM)
- Les canaux Plugin peuvent ajouter cette prise en charge via la même interface de liaison.

## Paramètres spécifiques au canal

Pour les flux non éphémères, configurez des liaisons ACP persistantes dans les entrées `bindings[]` de niveau supérieur.

### Modèle de liaison

- `bindings[].type="acp"` marque une liaison de conversation ACP persistante.
- `bindings[].match` identifie la conversation cible :
  - Canal ou fil Discord : `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Topic de forum Telegram : `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - DM/groupe BlueBubbles : `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Préférez `chat_id:*` ou `chat_identifier:*` pour des liaisons de groupe stables.
  - DM/groupe iMessage : `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Préférez `chat_id:*` pour des liaisons de groupe stables.
- `bindings[].agentId` est l’identifiant de l’agent OpenClaw propriétaire.
- Les surcharges ACP optionnelles se trouvent sous `bindings[].acp` :
  - `mode` (`persistent` ou `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Valeurs runtime par défaut par agent

Utilisez `agents.list[].runtime` pour définir une seule fois les valeurs ACP par défaut pour chaque agent :

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (identifiant de harness, par exemple `codex` ou `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

Ordre de priorité des surcharges pour les sessions ACP liées :

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. valeurs globales ACP par défaut (par exemple `acp.backend`)

Exemple :

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

Comportement :

- OpenClaw s’assure que la session ACP configurée existe avant utilisation.
- Les messages dans ce canal ou ce topic sont routés vers la session ACP configurée.
- Dans les conversations liées, `/new` et `/reset` réinitialisent en place la même clé de session ACP.
- Les liaisons runtime temporaires (par exemple créées par des flux de focalisation de fil) continuent de s’appliquer lorsqu’elles sont présentes.
- Pour les lancements ACP inter-agents sans `cwd` explicite, OpenClaw hérite de l’espace de travail de l’agent cible depuis la configuration de l’agent.
- Les chemins d’espace de travail hérités manquants se replient sur le `cwd` par défaut du backend ; les échecs d’accès sur des chemins existants remontent comme erreurs de lancement.

## Démarrer des sessions ACP (interfaces)

### Depuis `sessions_spawn`

Utilisez `runtime: "acp"` pour démarrer une session ACP à partir d’un tour d’agent ou d’un appel d’outil.

```json
{
  "task": "Ouvre le dépôt et résume les tests en échec",
  "runtime": "acp",
  "agentId": "codex",
  "thread": true,
  "mode": "session"
}
```

Remarques :

- `runtime` vaut par défaut `subagent`, donc définissez explicitement `runtime: "acp"` pour les sessions ACP.
- Si `agentId` est omis, OpenClaw utilise `acp.defaultAgent` lorsqu’il est configuré.
- `mode: "session"` nécessite `thread: true` pour conserver une conversation liée persistante.

Détails de l’interface :

- `task` (obligatoire) : prompt initial envoyé à la session ACP.
- `runtime` (obligatoire pour ACP) : doit être `"acp"`.
- `agentId` (optionnel) : identifiant de harness ACP cible. Se replie sur `acp.defaultAgent` s’il est défini.
- `thread` (optionnel, par défaut `false`) : demande un flux de liaison à un fil lorsque pris en charge.
- `mode` (optionnel) : `run` (one-shot) ou `session` (persistant).
  - la valeur par défaut est `run`
  - si `thread: true` et que le mode est omis, OpenClaw peut adopter un comportement persistant par défaut selon le chemin runtime
  - `mode: "session"` nécessite `thread: true`
- `cwd` (optionnel) : répertoire de travail runtime demandé (validé par la politique backend/runtime). S’il est omis, le lancement ACP hérite de l’espace de travail de l’agent cible lorsqu’il est configuré ; les chemins hérités manquants se replient sur les valeurs par défaut du backend, tandis que les véritables erreurs d’accès sont renvoyées.
- `label` (optionnel) : libellé à destination de l’opérateur utilisé dans le texte de session/bannière.
- `resumeSessionId` (optionnel) : reprendre une session ACP existante au lieu d’en créer une nouvelle. L’agent rejoue son historique de conversation via `session/load`. Nécessite `runtime: "acp"`.
- `streamTo` (optionnel) : `"parent"` diffuse les résumés de progression de l’exécution ACP initiale vers la session demandeuse comme événements système.
  - Quand disponible, les réponses acceptées incluent `streamLogPath` pointant vers un journal JSONL à portée de session (`<sessionId>.acp-stream.jsonl`) que vous pouvez suivre pour voir l’historique complet de relais.

## Modèle de distribution

Les sessions ACP peuvent être soit des espaces de travail interactifs, soit du travail de fond appartenant à un parent. Le chemin de distribution dépend de cette forme.

### Sessions ACP interactives

Les sessions interactives sont destinées à continuer à parler sur une surface de chat visible :

- `/acp spawn ... --bind here` lie la conversation actuelle à la session ACP.
- `/acp spawn ... --thread ...` lie un fil/topic de canal à la session ACP.
- Les `bindings[].type="acp"` persistants configurés routent les conversations correspondantes vers la même session ACP.

Les messages de suivi dans la conversation liée sont routés directement vers la session ACP, et la sortie ACP est renvoyée vers ce même canal/fil/topic.

### Sessions ACP one-shot appartenant au parent

Les sessions ACP one-shot lancées par l’exécution d’un autre agent sont des enfants de fond, similaires aux sous-agents :

- Le parent demande un travail avec `sessions_spawn({ runtime: "acp", mode: "run" })`.
- L’enfant s’exécute dans sa propre session harness ACP.
- La complétion remonte via le chemin interne d’annonce d’achèvement de tâche.
- Le parent reformule le résultat de l’enfant avec une voix normale d’assistant lorsqu’une réponse destinée à l’utilisateur est utile.

Ne traitez pas ce chemin comme un chat pair-à-pair entre parent et enfant. L’enfant dispose déjà d’un canal de complétion vers le parent.

### `sessions_send` et distribution A2A

`sessions_send` peut cibler une autre session après le lancement. Pour les sessions pair normales, OpenClaw utilise un chemin de suivi agent-à-agent (A2A) après injection du message :

- attendre la réponse de la session cible
- éventuellement laisser le demandeur et la cible échanger un nombre borné de tours de suivi
- demander à la cible de produire un message d’annonce
- distribuer cette annonce vers le canal ou fil visible

Ce chemin A2A est un repli pour les envois pair où l’expéditeur a besoin d’un suivi visible. Il reste activé lorsqu’une session non liée peut voir et envoyer des messages à une cible ACP, par exemple avec des paramètres larges `tools.sessions.visibility`.

OpenClaw ignore le suivi A2A uniquement lorsque le demandeur est le parent de son propre enfant ACP one-shot appartenant au parent. Dans ce cas, lancer A2A par-dessus la complétion de tâche peut réveiller le parent avec le résultat de l’enfant, renvoyer la réponse du parent dans l’enfant et créer une boucle d’écho parent/enfant. Le résultat `sessions_send` signale `delivery.status="skipped"` pour ce cas d’enfant appartenant au parent, car le chemin de complétion est déjà responsable du résultat.

### Reprendre une session existante

Utilisez `resumeSessionId` pour continuer une session ACP précédente au lieu d’en démarrer une nouvelle. L’agent rejoue son historique de conversation via `session/load`, ce qui lui permet de reprendre avec tout le contexte précédent.

```json
{
  "task": "Continue là où nous nous sommes arrêtés — corrige les échecs de tests restants",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Cas d’usage courants :

- Passer une session Codex de votre ordinateur portable à votre téléphone — demandez à votre agent de reprendre là où vous vous êtes arrêté
- Continuer une session de coding commencée de manière interactive dans la CLI, maintenant de façon headless via votre agent
- Reprendre un travail interrompu par un redémarrage de Gateway ou un délai d’inactivité

Remarques :

- `resumeSessionId` nécessite `runtime: "acp"` — renvoie une erreur si utilisé avec le runtime de sous-agent.
- `resumeSessionId` restaure l’historique de conversation ACP amont ; `thread` et `mode` s’appliquent toujours normalement à la nouvelle session OpenClaw que vous créez, donc `mode: "session"` nécessite toujours `thread: true`.
- L’agent cible doit prendre en charge `session/load` (Codex et Claude Code le font).
- Si l’identifiant de session est introuvable, le lancement échoue avec une erreur claire — aucun repli silencieux vers une nouvelle session.

### Test smoke opérateur

Utilisez ceci après un déploiement Gateway lorsque vous voulez une vérification rapide en conditions réelles que le lancement ACP
fonctionne réellement de bout en bout, et ne se contente pas de passer les tests unitaires.

Contrôle recommandé :

1. Vérifier la version/le commit de la Gateway déployée sur l’hôte cible.
2. Confirmer que la source déployée inclut l’acceptation de lignage ACP dans
   `src/gateway/sessions-patch.ts` (`subagent:* or acp:* sessions`).
3. Ouvrir une session bridge ACPX temporaire vers un agent live (par exemple
   `razor(main)` sur `jpclawhq`).
4. Demander à cet agent d’appeler `sessions_spawn` avec :
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - task : `Reply with exactly LIVE-ACP-SPAWN-OK`
5. Vérifier que l’agent signale :
   - `accepted=yes`
   - une vraie `childSessionKey`
   - aucune erreur de validateur
6. Nettoyer la session bridge ACPX temporaire.

Exemple de prompt pour l’agent live :

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

Remarques :

- Gardez ce test smoke sur `mode: "run"` sauf si vous testez intentionnellement
  des sessions ACP persistantes liées à un fil.
- N’exigez pas `streamTo: "parent"` pour le contrôle de base. Ce chemin dépend des
  capacités de la session/demandeur et constitue une vérification d’intégration distincte.
- Traitez le test lié à un fil en `mode: "session"` comme une deuxième passe d’intégration,
  plus riche, depuis un vrai fil Discord ou topic Telegram.

## Compatibilité Sandbox

Les sessions ACP s’exécutent actuellement sur le runtime de l’hôte, pas dans la Sandbox OpenClaw.

Limitations actuelles :

- Si la session demandeuse est en Sandbox, les lancements ACP sont bloqués à la fois pour `sessions_spawn({ runtime: "acp" })` et `/acp spawn`.
  - Erreur : `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` avec `runtime: "acp"` ne prend pas en charge `sandbox: "require"`.
  - Erreur : `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Utilisez `runtime: "subagent"` lorsque vous avez besoin d’une exécution imposée par la Sandbox.

### Depuis la commande `/acp`

Utilisez `/acp spawn` pour un contrôle explicite par l’opérateur depuis le chat lorsque nécessaire.

```text
/acp spawn codex --mode persistent --thread auto
/acp spawn codex --mode oneshot --thread off
/acp spawn codex --bind here
/acp spawn codex --thread here
```

Indicateurs clés :

- `--mode persistent|oneshot`
- `--bind here|off`
- `--thread auto|here|off`
- `--cwd <absolute-path>`
- `--label <name>`

Voir [Commandes slash](/fr/tools/slash-commands).

## Résolution de cible de session

La plupart des actions `/acp` acceptent une cible de session optionnelle (`session-key`, `session-id` ou `session-label`).

Ordre de résolution :

1. Argument de cible explicite (ou `--session` pour `/acp steer`)
   - tente d’abord la clé
   - puis l’identifiant de session de forme UUID
   - puis le libellé
2. Liaison du fil actuel (si cette conversation/ce fil est lié à une session ACP)
3. Repli vers la session demandeuse actuelle

Les liaisons à la conversation actuelle et au fil participent toutes deux à l’étape 2.

Si aucune cible n’est résolue, OpenClaw renvoie une erreur claire (`Unable to resolve session target: ...`).

## Modes de liaison au lancement

`/acp spawn` prend en charge `--bind here|off`.

| Mode   | Comportement                                                          |
| ------ | --------------------------------------------------------------------- |
| `here` | Lie en place la conversation active actuelle ; échoue si aucune n’est active. |
| `off`  | Ne crée pas de liaison à la conversation actuelle.                    |

Remarques :

- `--bind here` est le chemin opérateur le plus simple pour « faire de ce canal ou chat un espace géré par Codex ».
- `--bind here` ne crée pas de fil enfant.
- `--bind here` est disponible uniquement sur les canaux qui exposent la prise en charge de la liaison à la conversation actuelle.
- `--bind` et `--thread` ne peuvent pas être combinés dans le même appel `/acp spawn`.

## Modes de fil au lancement

`/acp spawn` prend en charge `--thread auto|here|off`.

| Mode   | Comportement                                                                                        |
| ------ | --------------------------------------------------------------------------------------------------- |
| `auto` | Dans un fil actif : lie ce fil. Hors d’un fil : crée/lie un fil enfant lorsque c’est pris en charge. |
| `here` | Exige le fil actif actuel ; échoue si vous n’êtes pas dans un fil.                                 |
| `off`  | Aucune liaison. La session démarre non liée.                                                       |

Remarques :

- Sur les surfaces sans liaison de fil, le comportement par défaut est effectivement `off`.
- Le lancement lié à un fil nécessite la prise en charge de la politique du canal :
  - Discord : `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram : `channels.telegram.threadBindings.spawnAcpSessions=true`
- Utilisez `--bind here` lorsque vous voulez épingler la conversation actuelle sans créer de fil enfant.

## Contrôles ACP

Famille de commandes disponibles :

- `/acp spawn`
- `/acp cancel`
- `/acp steer`
- `/acp close`
- `/acp status`
- `/acp set-mode`
- `/acp set`
- `/acp cwd`
- `/acp permissions`
- `/acp timeout`
- `/acp model`
- `/acp reset-options`
- `/acp sessions`
- `/acp doctor`
- `/acp install`

`/acp status` affiche les options runtime effectives et, lorsque disponibles, les identifiants de session au niveau runtime et au niveau backend.

Certains contrôles dépendent des capacités du backend. Si un backend ne prend pas en charge un contrôle, OpenClaw renvoie une erreur claire de contrôle non pris en charge.

## Recettes de commandes ACP

| Commande             | Ce qu’elle fait                                           | Exemple                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Crée une session ACP ; liaison actuelle ou à un fil en option. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Annule le tour en cours pour la session cible.            | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Envoie une instruction d’orientation à une session en cours. | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Ferme la session et détache les cibles de fil.            | `/acp close`                                                  |
| `/acp status`        | Affiche backend, mode, état, options runtime, capacités.  | `/acp status`                                                 |
| `/acp set-mode`      | Définit le mode runtime pour la session cible.            | `/acp set-mode plan`                                          |
| `/acp set`           | Écriture générique d’une option de configuration runtime. | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Définit une surcharge du répertoire de travail runtime.   | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Définit le profil de politique d’approbation.             | `/acp permissions strict`                                     |
| `/acp timeout`       | Définit le délai runtime (secondes).                      | `/acp timeout 120`                                            |
| `/acp model`         | Définit une surcharge du modèle runtime.                  | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Supprime les surcharges d’options runtime de session.     | `/acp reset-options`                                          |
| `/acp sessions`      | Liste les sessions ACP récentes depuis le magasin.        | `/acp sessions`                                               |
| `/acp doctor`        | État du backend, capacités, correctifs actionnables.      | `/acp doctor`                                                 |
| `/acp install`       | Affiche des étapes déterministes d’installation et d’activation. | `/acp install`                                                |

`/acp sessions` lit le magasin pour la session liée actuelle ou la session demandeuse. Les commandes qui acceptent des jetons `session-key`, `session-id` ou `session-label` résolvent les cibles via la découverte de session de la gateway, y compris les racines personnalisées `session.store` par agent.

## Mappage des options runtime

`/acp` propose des commandes pratiques et un setter générique.

Opérations équivalentes :

- `/acp model <id>` correspond à la clé de configuration runtime `model`.
- `/acp permissions <profile>` correspond à la clé de configuration runtime `approval_policy`.
- `/acp timeout <seconds>` correspond à la clé de configuration runtime `timeout`.
- `/acp cwd <path>` met directement à jour la surcharge runtime de `cwd`.
- `/acp set <key> <value>` est le chemin générique.
  - Cas particulier : `key=cwd` utilise le chemin de surcharge `cwd`.
- `/acp reset-options` efface toutes les surcharges runtime pour la session cible.

## Prise en charge des harness acpx (actuelle)

Alias de harness intégrés actuels d’acpx :

- `claude`
- `codex`
- `copilot`
- `cursor` (Cursor CLI : `cursor-agent acp`)
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `pi`
- `qwen`

Quand OpenClaw utilise le backend acpx, préférez ces valeurs pour `agentId` sauf si votre configuration acpx définit des alias d’agent personnalisés.
Si votre installation locale de Cursor expose encore ACP comme `agent acp`, surchargez la commande de l’agent `cursor` dans votre configuration acpx au lieu de modifier la valeur intégrée par défaut.

L’utilisation directe de la CLI acpx peut aussi cibler des adaptateurs arbitraires via `--agent <command>`, mais cette échappatoire brute est une fonctionnalité de la CLI acpx (et non le chemin normal `agentId` d’OpenClaw).

## Configuration requise

Base ACP core :

```json5
{
  acp: {
    enabled: true,
    // Optionnel. La valeur par défaut est true ; définissez false pour suspendre la distribution ACP tout en conservant les contrôles /acp.
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "pi",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

La configuration de liaison de fil est spécifique à l’adaptateur de canal. Exemple pour Discord :

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnAcpSessions: true,
      },
    },
  },
}
```

Si le lancement ACP lié à un fil ne fonctionne pas, vérifiez d’abord le feature flag de l’adaptateur :

- Discord : `channels.discord.threadBindings.spawnAcpSessions=true`

Les liaisons à la conversation actuelle ne nécessitent pas la création d’un fil enfant. Elles nécessitent un contexte de conversation actif et un adaptateur de canal qui expose les liaisons de conversation ACP.

Voir [Référence de configuration](/fr/gateway/configuration-reference).

## Configuration du Plugin pour le backend acpx

Les nouvelles installations livrent le Plugin runtime `acpx` intégré activé par défaut, donc ACP
fonctionne généralement sans étape manuelle d’installation du Plugin.

Commencez par :

```text
/acp doctor
```

Si vous avez désactivé `acpx`, l’avez refusé via `plugins.allow` / `plugins.deny`, ou si vous voulez
basculer vers un checkout local de développement, utilisez le chemin explicite de Plugin :

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Installation depuis un espace de travail local pendant le développement :

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Vérifiez ensuite l’état du backend :

```text
/acp doctor
```

### Configuration de la commande et de la version acpx

Par défaut, le Plugin backend acpx intégré (`acpx`) utilise le binaire épinglé local au plugin :

1. La commande vaut par défaut `node_modules/.bin/acpx` local au plugin à l’intérieur du package Plugin ACPX.
2. La version attendue vaut par défaut l’épingle de l’extension.
3. Le démarrage enregistre immédiatement le backend ACP comme non prêt.
4. Une tâche de vérification en arrière-plan exécute `acpx --version`.
5. Si le binaire local au plugin est manquant ou ne correspond pas, il exécute :
   `npm install --omit=dev --no-save acpx@<pinned>` puis revérifie.

Vous pouvez surcharger commande/version dans la configuration du Plugin :

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

Remarques :

- `command` accepte un chemin absolu, un chemin relatif ou un nom de commande (`acpx`).
- Les chemins relatifs sont résolus depuis le répertoire d’espace de travail OpenClaw.
- `expectedVersion: "any"` désactive la correspondance stricte de version.
- Lorsque `command` pointe vers un binaire/chemin personnalisé, l’auto-installation locale au plugin est désactivée.
- Le démarrage d’OpenClaw reste non bloquant pendant l’exécution du contrôle d’état du backend.

Voir [Plugins](/fr/tools/plugin).

### Installation automatique des dépendances

Lorsque vous installez OpenClaw globalement avec `npm install -g openclaw`, les dépendances runtime acpx
(binaires spécifiques à la plateforme) sont installées automatiquement
via un hook postinstall. Si l’installation automatique échoue, la gateway démarre quand même
normalement et signale la dépendance manquante via `openclaw acp doctor`.

### Bridge MCP des outils de Plugin

Par défaut, les sessions ACPX **n’exposent pas** les outils enregistrés par les plugins OpenClaw
au harness ACP.

Si vous voulez que des agents ACP comme Codex ou Claude Code puissent appeler des
outils Plugin OpenClaw installés comme le rappel/stockage mémoire, activez le bridge dédié :

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Ce que cela fait :

- Injecte un serveur MCP intégré nommé `openclaw-plugin-tools` dans l’amorçage de session ACPX.
- Expose les outils Plugin déjà enregistrés par les plugins OpenClaw installés et activés.
- Garde cette fonctionnalité explicite et désactivée par défaut.

Remarques de sécurité et de confiance :

- Cela étend la surface d’outils du harness ACP.
- Les agents ACP n’obtiennent accès qu’aux outils Plugin déjà actifs dans la gateway.
- Traitez cela comme la même frontière de confiance que celle consistant à laisser ces plugins s’exécuter dans
  OpenClaw lui-même.
- Vérifiez les plugins installés avant de l’activer.

Les `mcpServers` personnalisés continuent de fonctionner comme avant. Le bridge intégré plugin-tools est
une commodité supplémentaire activable, et non un remplacement de la configuration générique de serveur MCP.

### Configuration du délai runtime

Le Plugin `acpx` intégré fixe par défaut les tours runtime intégrés à un délai de
120 secondes. Cela donne à des harness plus lents comme Gemini CLI assez de temps pour terminer
le démarrage et l’initialisation ACP. Surchargez-le si votre hôte a besoin d’une
limite runtime différente :

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Redémarrez la gateway après avoir modifié cette valeur.

### Configuration de l’agent de sonde de santé

Le Plugin `acpx` intégré sonde un agent harness lorsqu’il décide si le
backend runtime intégré est prêt. Il utilise `codex` par défaut. Si votre déploiement
utilise un autre agent ACP par défaut, définissez l’agent de sonde sur le même identifiant :

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Redémarrez la gateway après avoir modifié cette valeur.

## Configuration des permissions

Les sessions ACP s’exécutent de manière non interactive — il n’y a pas de TTY pour approuver ou refuser les invites de permission d’écriture de fichiers et d’exécution shell. Le Plugin acpx fournit deux clés de configuration qui contrôlent la gestion des permissions :

Ces permissions de harness ACPX sont séparées des approbations d’exécution OpenClaw et séparées des indicateurs de contournement du fournisseur des backends CLI, comme Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` est l’interrupteur break-glass au niveau du harness pour les sessions ACP.

### `permissionMode`

Contrôle quelles opérations l’agent harness peut effectuer sans invite.

| Valeur          | Comportement                                                  |
| --------------- | ------------------------------------------------------------- |
| `approve-all`   | Approuve automatiquement toutes les écritures de fichiers et commandes shell. |
| `approve-reads` | Approuve automatiquement les lectures uniquement ; les écritures et l’exécution nécessitent des invites. |
| `deny-all`      | Refuse toutes les invites de permission.                      |

### `nonInteractivePermissions`

Contrôle ce qui se passe lorsqu’une invite de permission devrait être affichée mais qu’aucun TTY interactif n’est disponible (ce qui est toujours le cas pour les sessions ACP).

| Valeur | Comportement                                                       |
| ------ | ------------------------------------------------------------------ |
| `fail` | Abandonne la session avec `AcpRuntimeError`. **(par défaut)**      |
| `deny` | Refuse silencieusement la permission et continue (dégradation progressive). |

### Configuration

À définir via la configuration du Plugin :

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Redémarrez la gateway après avoir modifié ces valeurs.

> **Important :** OpenClaw utilise actuellement par défaut `permissionMode=approve-reads` et `nonInteractivePermissions=fail`. Dans les sessions ACP non interactives, toute écriture ou exécution qui déclenche une invite de permission peut échouer avec `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Si vous devez restreindre les permissions, définissez `nonInteractivePermissions` sur `deny` afin que les sessions se dégradent proprement au lieu de planter.

## Résolution des problèmes

| Symptôme                                                                    | Cause probable                                                                  | Correctif                                                                                                                                                         |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Le Plugin backend est manquant ou désactivé.                                    | Installez et activez le Plugin backend, puis exécutez `/acp doctor`.                                                                                             |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP est désactivé globalement.                                                  | Définissez `acp.enabled=true`.                                                                                                                                     |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | La distribution depuis les messages de fil normaux est désactivée.              | Définissez `acp.dispatch.enabled=true`.                                                                                                                           |
| `ACP agent "<id>" is not allowed by policy`                                 | L’agent n’est pas dans la liste d’autorisation.                                 | Utilisez un `agentId` autorisé ou mettez à jour `acp.allowedAgents`.                                                                                             |
| `Unable to resolve session target: ...`                                     | Mauvais jeton de clé/id/libellé.                                                | Exécutez `/acp sessions`, copiez la clé/le libellé exact, puis réessayez.                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` a été utilisé sans conversation active pouvant être liée.         | Déplacez-vous vers le chat/canal cible et réessayez, ou utilisez un lancement non lié.                                                                           |
| `Conversation bindings are unavailable for <channel>.`                      | L’adaptateur ne prend pas en charge la liaison ACP à la conversation actuelle.  | Utilisez `/acp spawn ... --thread ...` lorsque c’est pris en charge, configurez des `bindings[]` de niveau supérieur, ou passez à un canal pris en charge.      |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` a été utilisé hors d’un contexte de fil.                        | Déplacez-vous vers le fil cible ou utilisez `--thread auto`/`off`.                                                                                               |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Un autre utilisateur possède la cible de liaison active.                        | Reliez de nouveau en tant que propriétaire ou utilisez une autre conversation ou un autre fil.                                                                   |
| `Thread bindings are unavailable for <channel>.`                            | L’adaptateur ne prend pas en charge la liaison de fil.                          | Utilisez `--thread off` ou passez à un adaptateur/canal pris en charge.                                                                                          |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Le runtime ACP s’exécute côté hôte ; la session demandeuse est en Sandbox.      | Utilisez `runtime="subagent"` depuis des sessions en Sandbox, ou lancez ACP depuis une session hors Sandbox.                                                     |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` a été demandé pour le runtime ACP.                          | Utilisez `runtime="subagent"` si le Sandbox est requis, ou utilisez ACP avec `sandbox="inherit"` depuis une session hors Sandbox.                               |
| ACP metadata manquantes pour la session liée                                | Métadonnées ACP obsolètes/supprimées de la session.                             | Recréez avec `/acp spawn`, puis reliez/re-focalisez le fil.                                                                                                      |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` bloque les écritures/exécutions dans une session ACP non interactive. | Définissez `plugins.entries.acpx.config.permissionMode` sur `approve-all` et redémarrez la gateway. Voir [Configuration des permissions](#permission-configuration). |
| La session ACP échoue tôt avec peu de sortie                                | Les invites de permission sont bloquées par `permissionMode`/`nonInteractivePermissions`. | Vérifiez les journaux de la gateway pour `AcpRuntimeError`. Pour des permissions complètes, définissez `permissionMode=approve-all` ; pour une dégradation progressive, définissez `nonInteractivePermissions=deny`. |
| La session ACP reste bloquée indéfiniment après la fin du travail           | Le processus harness a fini mais la session ACP n’a pas signalé la complétion.  | Surveillez avec `ps aux \| grep acpx` ; tuez manuellement les processus obsolètes.                                                                                |
