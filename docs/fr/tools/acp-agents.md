---
read_when:
    - Exécuter des harnesses de codage via ACP
    - Configurer des sessions ACP liées à la conversation sur les canaux de messagerie
    - Lier une conversation d’un canal de messagerie à une session ACP persistante
    - Dépanner le backend ACP et le câblage du Plugin
    - Utiliser les commandes `/acp` depuis le chat
summary: Utilisez les sessions d’exécution ACP pour Codex, Claude Code, Cursor, Gemini CLI, OpenClaw ACP et les autres agents de harness
title: Agents ACP
x-i18n:
    generated_at: "2026-04-21T13:36:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: e458ff21d63e52ed0eed4ed65ba2c45aecae20563a3ef10bf4b64e948284b51a
    source_path: tools/acp-agents.md
    workflow: 15
---

# Agents ACP

Les sessions [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) permettent à OpenClaw d’exécuter des harnesses de codage externes (par exemple Pi, Claude Code, Codex, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI et d’autres harnesses ACPX pris en charge) via un Plugin backend ACP.

Si vous demandez à OpenClaw en langage naturel « exécute ceci dans Codex » ou « démarre Claude Code dans un thread », OpenClaw doit acheminer cette demande vers l’exécution ACP (et non vers l’exécution native de sous-agent). Chaque lancement de session ACP est suivi comme une [tâche d’arrière-plan](/fr/automation/tasks).

Si vous souhaitez que Codex ou Claude Code se connecte directement comme client MCP externe
à des conversations de canal OpenClaw existantes, utilisez plutôt [`openclaw mcp serve`](/cli/mcp) qu’ACP.

## Quelle page me faut-il ?

Il existe trois surfaces proches qu’il est facile de confondre :

| Vous voulez... | Utilisez ceci | Remarques |
| ---------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Exécuter Codex, Claude Code, Gemini CLI ou un autre harness externe _via_ OpenClaw | Cette page : agents ACP | Sessions liées au chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tâches d’arrière-plan, contrôles d’exécution |
| Exposer une session Gateway OpenClaw _comme_ serveur ACP pour un éditeur ou un client | [`openclaw acp`](/cli/acp) | Mode pont. L’IDE/client parle ACP à OpenClaw via stdio/WebSocket |
| Réutiliser une IA CLI locale comme modèle de secours texte uniquement | [CLI Backends](/fr/gateway/cli-backends) | Pas ACP. Pas d’outils OpenClaw, pas de contrôles ACP, pas d’exécution de harness |

## Est-ce que cela fonctionne immédiatement ?

En général, oui.

- Les nouvelles installations sont désormais livrées avec le Plugin d’exécution `acpx` inclus, activé par défaut.
- Le Plugin `acpx` inclus privilégie son binaire `acpx` épinglé local au Plugin.
- Au démarrage, OpenClaw sonde ce binaire et le répare automatiquement si nécessaire.
- Commencez par `/acp doctor` si vous voulez une vérification rapide de l’état de préparation.

Ce qui peut encore se produire lors de la première utilisation :

- Un adaptateur de harness cible peut être récupéré à la demande avec `npx` la première fois que vous utilisez ce harness.
- L’authentification du fournisseur doit toujours exister sur l’hôte pour ce harness.
- Si l’hôte n’a pas d’accès npm/réseau, les récupérations d’adaptateur au premier lancement peuvent échouer tant que les caches ne sont pas préchauffés ou que l’adaptateur n’est pas installé d’une autre manière.

Exemples :

- `/acp spawn codex` : OpenClaw devrait être prêt à amorcer `acpx`, mais l’adaptateur ACP Codex peut encore nécessiter une récupération au premier lancement.
- `/acp spawn claude` : même situation pour l’adaptateur ACP Claude, avec en plus l’authentification côté Claude sur cet hôte.

## Flux opérateur rapide

Utilisez ceci si vous voulez un runbook `/acp` pratique :

1. Lancez une session :
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. Travaillez dans la conversation ou le thread lié (ou ciblez explicitement cette clé de session).
3. Vérifiez l’état de l’exécution :
   - `/acp status`
4. Ajustez les options d’exécution si nécessaire :
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. Donnez une impulsion à une session active sans remplacer le contexte :
   - `/acp steer resserre la journalisation et continue`
6. Arrêtez le travail :
   - `/acp cancel` (arrêter le tour en cours), ou
   - `/acp close` (fermer la session + supprimer les liaisons)

## Démarrage rapide pour les humains

Exemples de demandes naturelles :

- « Lie ce canal Discord à Codex. »
- « Démarre une session Codex persistante dans un thread ici et garde-la ciblée. »
- « Exécute ceci comme une session ACP Claude Code à usage unique et résume le résultat. »
- « Lie cette discussion iMessage à Codex et conserve les suivis dans le même espace de travail. »
- « Utilise Gemini CLI pour cette tâche dans un thread, puis conserve les suivis dans ce même thread. »

Ce qu’OpenClaw doit faire :

1. Choisir `runtime: "acp"`.
2. Résoudre la cible de harness demandée (`agentId`, par exemple `codex`).
3. Si une liaison à la conversation courante est demandée et que le canal actif la prend en charge, lier la session ACP à cette conversation.
4. Sinon, si une liaison à un thread est demandée et que le canal actuel la prend en charge, lier la session ACP au thread.
5. Acheminer les messages de suivi liés vers cette même session ACP jusqu’à désactivation du focus/fermeture/expiration.

## ACP versus sous-agents

Utilisez ACP quand vous voulez une exécution de harness externe. Utilisez les sous-agents quand vous voulez des exécutions déléguées natives OpenClaw.

| Zone | Session ACP | Exécution de sous-agent |
| ------------- | ------------------------------------- | ---------------------------------- |
| Exécution | Plugin backend ACP (par exemple acpx) | Exécution native de sous-agent OpenClaw |
| Clé de session | `agent:<agentId>:acp:<uuid>` | `agent:<agentId>:subagent:<uuid>` |
| Commandes principales | `/acp ...` | `/subagents ...` |
| Outil de lancement | `sessions_spawn` avec `runtime:"acp"` | `sessions_spawn` (exécution par défaut) |

Voir aussi [Sous-agents](/fr/tools/subagents).

## Comment ACP exécute Claude Code

Pour Claude Code via ACP, la pile est :

1. Plan de contrôle de session ACP OpenClaw
2. Plugin d’exécution `acpx` inclus
3. Adaptateur ACP Claude
4. Mécanisme d’exécution/session côté Claude

Distinction importante :

- Claude ACP est une session de harness avec contrôles ACP, reprise de session, suivi des tâches d’arrière-plan et liaison facultative à une conversation/un thread.
- Les CLI Backends sont des exécutions locales de secours séparées, texte uniquement. Voir [CLI Backends](/fr/gateway/cli-backends).

Pour les opérateurs, la règle pratique est :

- vous voulez `/acp spawn`, des sessions pouvant être liées, des contrôles d’exécution ou un travail de harness persistant : utilisez ACP
- vous voulez un simple secours texte local via la CLI brute : utilisez les CLI Backends

## Sessions liées

### Liaisons à la conversation courante

Utilisez `/acp spawn <harness> --bind here` quand vous voulez que la conversation courante devienne un espace de travail ACP durable sans créer de thread enfant.

Comportement :

- OpenClaw conserve la maîtrise du transport de canal, de l’authentification, de la sécurité et de la livraison.
- La conversation courante est épinglée à la clé de session ACP lancée.
- Les messages de suivi dans cette conversation sont acheminés vers la même session ACP.
- `/new` et `/reset` réinitialisent la même session ACP liée sur place.
- `/acp close` ferme la session et supprime la liaison à la conversation courante.

Ce que cela signifie en pratique :

- `--bind here` conserve la même surface de chat. Sur Discord, le canal courant reste le canal courant.
- `--bind here` peut quand même créer une nouvelle session ACP si vous lancez un nouveau travail. La liaison attache cette session à la conversation courante.
- `--bind here` ne crée pas à lui seul un thread enfant Discord ni un topic Telegram.
- L’exécution ACP peut toujours avoir son propre répertoire de travail (`cwd`) ou un espace de travail sur disque géré par le backend. Cet espace de travail d’exécution est distinct de la surface de chat et n’implique pas un nouveau thread de messagerie.
- Si vous lancez vers un autre agent ACP et que vous ne passez pas `--cwd`, OpenClaw hérite par défaut de l’espace de travail de **l’agent cible**, et non de celui du demandeur.
- Si ce chemin d’espace de travail hérité est manquant (`ENOENT`/`ENOTDIR`), OpenClaw revient au `cwd` par défaut du backend au lieu de réutiliser silencieusement le mauvais arbre.
- Si l’espace de travail hérité existe mais n’est pas accessible (par exemple `EACCES`), le lancement renvoie la véritable erreur d’accès au lieu d’abandonner `cwd`.

Modèle mental :

- surface de chat : là où les gens continuent à parler (`canal Discord`, `topic Telegram`, `discussion iMessage`)
- session ACP : l’état d’exécution durable Codex/Claude/Gemini vers lequel OpenClaw achemine
- thread/topic enfant : une surface de messagerie supplémentaire facultative créée uniquement par `--thread ...`
- espace de travail d’exécution : l’emplacement du système de fichiers où le harness s’exécute (`cwd`, extraction du dépôt, espace de travail backend)

Exemples :

- `/acp spawn codex --bind here` : conserver ce chat, lancer ou rattacher une session ACP Codex, et acheminer les futurs messages d’ici vers elle
- `/acp spawn codex --thread auto` : OpenClaw peut créer un thread/topic enfant et y lier la session ACP
- `/acp spawn codex --bind here --cwd /workspace/repo` : même liaison au chat qu’au-dessus, mais Codex s’exécute dans `/workspace/repo`

Prise en charge de la liaison à la conversation courante :

- Les canaux de chat/de messages qui annoncent la prise en charge de la liaison à la conversation courante peuvent utiliser `--bind here` via le chemin partagé de liaison de conversation.
- Les canaux avec une sémantique personnalisée de thread/topic peuvent toujours fournir une canonicalisation spécifique au canal derrière la même interface partagée.
- `--bind here` signifie toujours « lier la conversation courante sur place ».
- Les liaisons génériques à la conversation courante utilisent le magasin de liaisons partagé d’OpenClaw et survivent aux redémarrages normaux de la Gateway.

Remarques :

- `--bind here` et `--thread ...` sont mutuellement exclusifs sur `/acp spawn`.
- Sur Discord, `--bind here` lie le canal ou le thread courant sur place. `spawnAcpSessions` n’est requis que lorsqu’OpenClaw doit créer un thread enfant pour `--thread auto|here`.
- Si le canal actif n’expose pas de liaisons ACP à la conversation courante, OpenClaw renvoie un message clair indiquant l’absence de prise en charge.
- `resume` et les questions de « nouvelle session » sont des questions de session ACP, pas des questions de canal. Vous pouvez réutiliser ou remplacer l’état d’exécution sans changer la surface de chat actuelle.

### Sessions liées à un thread

Lorsque les liaisons de thread sont activées pour un adaptateur de canal, les sessions ACP peuvent être liées à des threads :

- OpenClaw lie un thread à une session ACP cible.
- Les messages de suivi dans ce thread sont acheminés vers la session ACP liée.
- La sortie ACP est renvoyée dans ce même thread.
- La suppression du focus/la fermeture/l’archivage/l’expiration du délai d’inactivité ou de l’âge maximal supprime la liaison.

La prise en charge de la liaison à un thread dépend de l’adaptateur. Si l’adaptateur de canal actif ne prend pas en charge les liaisons de thread, OpenClaw renvoie un message clair indiquant l’absence de prise en charge ou d’indisponibilité.

Indicateurs de fonctionnalité requis pour ACP lié à un thread :

- `acp.enabled=true`
- `acp.dispatch.enabled` est activé par défaut (définissez `false` pour suspendre le dispatch ACP)
- Indicateur de lancement de thread ACP de l’adaptateur de canal activé (spécifique à l’adaptateur)
  - Discord : `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram : `channels.telegram.threadBindings.spawnAcpSessions=true`

### Canaux prenant en charge les threads

- Tout adaptateur de canal qui expose une capacité de liaison de session/thread.
- Prise en charge intégrée actuelle :
  - Threads/canaux Discord
  - Topics Telegram (topics de forum dans les groupes/supergroupes et topics de messages privés)
- Les canaux Plugin peuvent ajouter la prise en charge via la même interface de liaison.

## Réglages spécifiques aux canaux

Pour les flux de travail non éphémères, configurez des liaisons ACP persistantes dans des entrées `bindings[]` de niveau supérieur.

### Modèle de liaison

- `bindings[].type="acp"` marque une liaison de conversation ACP persistante.
- `bindings[].match` identifie la conversation cible :
  - Canal ou thread Discord : `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Topic de forum Telegram : `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - Message privé/discussion de groupe BlueBubbles : `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`  
    Préférez `chat_id:*` ou `chat_identifier:*` pour des liaisons de groupe stables.
  - Message privé/discussion de groupe iMessage : `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`  
    Préférez `chat_id:*` pour des liaisons de groupe stables.
- `bindings[].agentId` est l’id de l’agent OpenClaw propriétaire.
- Les surcharges ACP facultatives se trouvent sous `bindings[].acp` :
  - `mode` (`persistent` ou `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Valeurs par défaut d’exécution par agent

Utilisez `agents.list[].runtime` pour définir une fois les valeurs ACP par défaut pour chaque agent :

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id du harness, par exemple `codex` ou `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

Ordre de priorité des surcharges pour les sessions ACP liées :

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. valeurs globales ACP par défaut (par exemple `acp.backend`)

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
- Les messages de ce canal ou de ce topic sont acheminés vers la session ACP configurée.
- Dans les conversations liées, `/new` et `/reset` réinitialisent sur place la même clé de session ACP.
- Les liaisons d’exécution temporaires (par exemple créées par les flux de focus de thread) s’appliquent toujours lorsqu’elles sont présentes.
- Pour les lancements ACP inter-agents sans `cwd` explicite, OpenClaw hérite de l’espace de travail de l’agent cible à partir de la configuration de l’agent.
- Les chemins d’espace de travail hérités manquants reviennent au `cwd` par défaut du backend ; les échecs d’accès sur des chemins non manquants apparaissent comme des erreurs de lancement.

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

Remarques :

- `runtime` vaut par défaut `subagent`, donc définissez explicitement `runtime: "acp"` pour les sessions ACP.
- Si `agentId` est omis, OpenClaw utilise `acp.defaultAgent` lorsqu’il est configuré.
- `mode: "session"` exige `thread: true` pour conserver une conversation liée persistante.

Détails de l’interface :

- `task` (obligatoire) : prompt initial envoyé à la session ACP.
- `runtime` (obligatoire pour ACP) : doit être `"acp"`.
- `agentId` (facultatif) : id du harness ACP cible. Revient à `acp.defaultAgent` si défini.
- `thread` (facultatif, `false` par défaut) : demande le flux de liaison à un thread lorsqu’il est pris en charge.
- `mode` (facultatif) : `run` (à usage unique) ou `session` (persistant).
  - la valeur par défaut est `run`
  - si `thread: true` et que le mode est omis, OpenClaw peut appliquer par défaut un comportement persistant selon le chemin d’exécution
  - `mode: "session"` exige `thread: true`
- `cwd` (facultatif) : répertoire de travail d’exécution demandé (validé par la politique du backend/de l’exécution). S’il est omis, le lancement ACP hérite de l’espace de travail de l’agent cible lorsqu’il est configuré ; les chemins hérités manquants reviennent aux valeurs par défaut du backend, tandis que les véritables erreurs d’accès sont renvoyées.
- `label` (facultatif) : étiquette orientée opérateur utilisée dans le texte de session/de bannière.
- `resumeSessionId` (facultatif) : reprendre une session ACP existante au lieu d’en créer une nouvelle. L’agent rejoue son historique de conversation via `session/load`. Exige `runtime: "acp"`.
- `streamTo` (facultatif) : `"parent"` diffuse vers la session demandeuse des résumés de progression de l’exécution ACP initiale sous forme d’événements système.
  - Lorsqu’elles sont disponibles, les réponses acceptées incluent `streamLogPath` pointant vers un journal JSONL scoped à la session (`<sessionId>.acp-stream.jsonl`) que vous pouvez suivre pour obtenir l’historique complet du relais.

### Reprendre une session existante

Utilisez `resumeSessionId` pour continuer une session ACP précédente au lieu de repartir de zéro. L’agent rejoue son historique de conversation via `session/load`, ce qui lui permet de reprendre avec tout le contexte antérieur.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Cas d’usage courants :

- Transférer une session Codex de votre ordinateur portable à votre téléphone — demandez à votre agent de reprendre là où vous vous étiez arrêté
- Continuer une session de codage que vous avez démarrée interactivement dans la CLI, désormais en mode headless via votre agent
- Reprendre un travail interrompu par un redémarrage de la Gateway ou un délai d’inactivité

Remarques :

- `resumeSessionId` exige `runtime: "acp"` — renvoie une erreur s’il est utilisé avec l’exécution de sous-agent.
- `resumeSessionId` restaure l’historique de conversation ACP amont ; `thread` et `mode` s’appliquent toujours normalement à la nouvelle session OpenClaw que vous créez, donc `mode: "session"` exige toujours `thread: true`.
- L’agent cible doit prendre en charge `session/load` (Codex et Claude Code le font).
- Si l’id de session est introuvable, le lancement échoue avec une erreur claire — sans retour silencieux vers une nouvelle session.

### Test smoke opérateur

Utilisez ceci après un déploiement de Gateway lorsque vous voulez une vérification rapide en conditions réelles que le lancement ACP
fonctionne réellement de bout en bout, et ne se contente pas de réussir des tests unitaires.

Vérification recommandée :

1. Vérifiez la version/le commit de la Gateway déployée sur l’hôte cible.
2. Confirmez que la source déployée inclut l’acceptation de lignée ACP dans
   `src/gateway/sessions-patch.ts` (`subagent:* or acp:* sessions`).
3. Ouvrez une session de pont ACPX temporaire vers un agent actif (par exemple
   `razor(main)` sur `jpclawhq`).
4. Demandez à cet agent d’appeler `sessions_spawn` avec :
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - tâche : `Reply with exactly LIVE-ACP-SPAWN-OK`
5. Vérifiez que l’agent signale :
   - `accepted=yes`
   - une véritable `childSessionKey`
   - aucune erreur de validateur
6. Nettoyez la session de pont ACPX temporaire.

Exemple de prompt à l’agent actif :

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

Remarques :

- Conservez ce test smoke en `mode: "run"` sauf si vous testez intentionnellement
  des sessions ACP persistantes liées à un thread.
- N’exigez pas `streamTo: "parent"` pour la vérification de base. Ce chemin dépend des
  capacités du demandeur/de la session et constitue une vérification d’intégration distincte.
- Traitez les tests `mode: "session"` liés à un thread comme une deuxième passe
  d’intégration, plus riche, à partir d’un véritable thread Discord ou topic Telegram.

## Compatibilité avec le bac à sable

Les sessions ACP s’exécutent actuellement sur l’exécution hôte, pas à l’intérieur du bac à sable OpenClaw.

Limites actuelles :

- Si la session demandeuse est en bac à sable, les lancements ACP sont bloqués pour `sessions_spawn({ runtime: "acp" })` comme pour `/acp spawn`.
  - Erreur : `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` avec `runtime: "acp"` ne prend pas en charge `sandbox: "require"`.
  - Erreur : `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Utilisez `runtime: "subagent"` lorsque vous avez besoin d’une exécution imposée par le bac à sable.

### Depuis la commande `/acp`

Utilisez `/acp spawn` pour un contrôle opérateur explicite depuis le chat, si nécessaire.

```text
/acp spawn codex --mode persistent --thread auto
/acp spawn codex --mode oneshot --thread off
/acp spawn codex --bind here
/acp spawn codex --thread here
```

Indicateurs principaux :

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
   - puis l’id de session au format UUID
   - puis l’étiquette
2. Liaison du thread courant (si cette conversation/ce thread est lié à une session ACP)
3. Repli vers la session demandeuse courante

Les liaisons à la conversation courante et les liaisons de thread participent toutes deux à l’étape 2.

Si aucune cible n’est résolue, OpenClaw renvoie une erreur claire (`Unable to resolve session target: ...`).

## Modes de liaison au lancement

`/acp spawn` prend en charge `--bind here|off`.

| Mode | Comportement |
| ------ | ---------------------------------------------------------------------- |
| `here` | Lie sur place la conversation active actuelle ; échoue si aucune n’est active. |
| `off`  | Ne crée pas de liaison à la conversation courante. |

Remarques :

- `--bind here` est le chemin opérateur le plus simple pour « faire de ce canal ou de ce chat un espace soutenu par Codex ».
- `--bind here` ne crée pas de thread enfant.
- `--bind here` n’est disponible que sur les canaux qui exposent la prise en charge de la liaison à la conversation courante.
- `--bind` et `--thread` ne peuvent pas être combinés dans le même appel à `/acp spawn`.

## Modes de thread au lancement

`/acp spawn` prend en charge `--thread auto|here|off`.

| Mode | Comportement |
| ------ | --------------------------------------------------------------------------------------------------- |
| `auto` | Dans un thread actif : lie ce thread. En dehors d’un thread : crée/lie un thread enfant lorsque c’est pris en charge. |
| `here` | Exige le thread actif actuel ; échoue si vous n’êtes pas dans un thread. |
| `off`  | Aucune liaison. La session démarre sans liaison. |

Remarques :

- Sur les surfaces sans liaison de thread, le comportement par défaut est en pratique `off`.
- Le lancement lié à un thread exige la prise en charge par la politique du canal :
  - Discord : `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram : `channels.telegram.threadBindings.spawnAcpSessions=true`
- Utilisez `--bind here` lorsque vous voulez épingler la conversation courante sans créer de thread enfant.

## Contrôles ACP

Famille de commandes disponible :

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

`/acp status` affiche les options d’exécution effectives et, lorsque disponibles, les identifiants de session au niveau de l’exécution comme du backend.

Certains contrôles dépendent des capacités du backend. Si un backend ne prend pas en charge un contrôle, OpenClaw renvoie une erreur claire indiquant que ce contrôle n’est pas pris en charge.

## Livre de recettes des commandes ACP

| Commande | Ce qu’elle fait | Exemple |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn` | Crée une session ACP ; liaison courante ou liaison à un thread en option. | `/acp spawn codex --bind here --cwd /repo` |
| `/acp cancel` | Annule le tour en cours pour la session cible. | `/acp cancel agent:codex:acp:<uuid>` |
| `/acp steer` | Envoie une instruction de guidage à la session en cours d’exécution. | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close` | Ferme la session et délie les cibles de thread. | `/acp close` |
| `/acp status` | Affiche le backend, le mode, l’état, les options d’exécution et les capacités. | `/acp status` |
| `/acp set-mode` | Définit le mode d’exécution pour la session cible. | `/acp set-mode plan` |
| `/acp set` | Écriture générique d’une option de configuration d’exécution. | `/acp set model openai/gpt-5.4` |
| `/acp cwd` | Définit la surcharge du répertoire de travail d’exécution. | `/acp cwd /Users/user/Projects/repo` |
| `/acp permissions` | Définit le profil de politique d’approbation. | `/acp permissions strict` |
| `/acp timeout` | Définit le délai d’expiration d’exécution (secondes). | `/acp timeout 120` |
| `/acp model` | Définit la surcharge du modèle d’exécution. | `/acp model anthropic/claude-opus-4-6` |
| `/acp reset-options` | Supprime les surcharges d’options d’exécution de la session. | `/acp reset-options` |
| `/acp sessions` | Liste les sessions ACP récentes depuis le magasin. | `/acp sessions` |
| `/acp doctor` | Santé du backend, capacités, correctifs applicables. | `/acp doctor` |
| `/acp install` | Affiche des étapes déterministes d’installation et d’activation. | `/acp install` |

`/acp sessions` lit le magasin pour la session courante liée ou demandeuse. Les commandes qui acceptent des jetons `session-key`, `session-id` ou `session-label` résolvent les cibles via la découverte de sessions Gateway, y compris les racines `session.store` personnalisées par agent.

## Correspondance des options d’exécution

`/acp` propose des commandes pratiques et un setter générique.

Opérations équivalentes :

- `/acp model <id>` correspond à la clé de configuration d’exécution `model`.
- `/acp permissions <profile>` correspond à la clé de configuration d’exécution `approval_policy`.
- `/acp timeout <seconds>` correspond à la clé de configuration d’exécution `timeout`.
- `/acp cwd <path>` met à jour directement la surcharge `cwd` d’exécution.
- `/acp set <key> <value>` est le chemin générique.
  - Cas particulier : `key=cwd` utilise le chemin de surcharge `cwd`.
- `/acp reset-options` efface toutes les surcharges d’exécution pour la session cible.

## Prise en charge des harnesses acpx (actuelle)

Alias de harness intégrés actuels d’acpx :

- `claude`
- `codex`
- `copilot`
- `cursor` (CLI Cursor : `cursor-agent acp`)
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

Quand OpenClaw utilise le backend acpx, préférez ces valeurs pour `agentId`, sauf si votre configuration acpx définit des alias d’agent personnalisés.
Si votre installation locale de Cursor expose encore ACP sous `agent acp`, surchargez plutôt la commande de l’agent `cursor` dans votre configuration acpx au lieu de modifier la valeur intégrée par défaut.

L’utilisation directe de la CLI acpx peut aussi cibler des adaptateurs arbitraires via `--agent <command>`, mais cette échappatoire brute est une fonctionnalité de la CLI acpx (et non le chemin normal `agentId` d’OpenClaw).

## Configuration requise

Base ACP côté cœur :

```json5
{
  acp: {
    enabled: true,
    // Facultatif. La valeur par défaut est true ; définissez false pour suspendre le dispatch ACP tout en conservant les contrôles /acp.
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

La configuration de liaison à un thread est spécifique à l’adaptateur de canal. Exemple pour Discord :

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

Si le lancement ACP lié à un thread ne fonctionne pas, vérifiez d’abord l’indicateur de fonctionnalité de l’adaptateur :

- Discord : `channels.discord.threadBindings.spawnAcpSessions=true`

Les liaisons à la conversation courante n’exigent pas la création de thread enfant. Elles exigent un contexte de conversation actif et un adaptateur de canal qui expose les liaisons de conversation ACP.

Voir [Référence de configuration](/fr/gateway/configuration-reference).

## Configuration du Plugin pour le backend acpx

Les nouvelles installations sont livrées avec le Plugin d’exécution `acpx` inclus, activé par défaut, donc ACP
fonctionne généralement sans étape d’installation manuelle de Plugin.

Commencez par :

```text
/acp doctor
```

Si vous avez désactivé `acpx`, l’avez refusé via `plugins.allow` / `plugins.deny`, ou voulez
basculer vers une extraction de développement locale, utilisez le chemin de Plugin explicite :

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Installation depuis un espace de travail local pendant le développement :

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Vérifiez ensuite la santé du backend :

```text
/acp doctor
```

### Configuration de la commande et de la version acpx

Par défaut, le Plugin backend acpx inclus (`acpx`) utilise le binaire épinglé local au Plugin :

1. La commande vaut par défaut le `node_modules/.bin/acpx` local au Plugin à l’intérieur du package du Plugin ACPX.
2. La version attendue vaut par défaut l’épinglage de l’extension.
3. Au démarrage, OpenClaw enregistre immédiatement le backend ACP comme non prêt.
4. Une tâche d’assurance en arrière-plan vérifie `acpx --version`.
5. Si le binaire local au Plugin est manquant ou ne correspond pas, il exécute :
   `npm install --omit=dev --no-save acpx@<pinned>` puis revérifie.

Vous pouvez surcharger la commande/la version dans la configuration du Plugin :

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

Remarques :

- `command` accepte un chemin absolu, un chemin relatif ou un nom de commande (`acpx`).
- Les chemins relatifs sont résolus depuis le répertoire d’espace de travail OpenClaw.
- `expectedVersion: "any"` désactive la correspondance stricte de version.
- Lorsque `command` pointe vers un binaire/chemin personnalisé, l’installation automatique locale au Plugin est désactivée.
- Le démarrage d’OpenClaw reste non bloquant pendant l’exécution de la vérification de santé du backend.

Voir [Plugins](/fr/tools/plugin).

### Installation automatique des dépendances

Lorsque vous installez OpenClaw globalement avec `npm install -g openclaw`, les dépendances d’exécution acpx
(binaires spécifiques à la plateforme) sont installées automatiquement
via un hook postinstall. Si l’installation automatique échoue, la Gateway démarre quand même
normalement et signale la dépendance manquante via `openclaw acp doctor`.

### Pont MCP des outils de Plugin

Par défaut, les sessions ACPX **n’exposent pas** au harness ACP les outils enregistrés par les Plugins OpenClaw.

Si vous voulez que des agents ACP comme Codex ou Claude Code puissent appeler des outils
de Plugins OpenClaw installés, comme rappel/stockage mémoire, activez le pont dédié :

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Ce que cela fait :

- Injecte dans l’amorçage de session ACPX un serveur MCP intégré nommé `openclaw-plugin-tools`.
- Expose les outils de Plugin déjà enregistrés par les Plugins OpenClaw installés et activés.
- Garde cette fonctionnalité explicite et désactivée par défaut.

Remarques de sécurité et de confiance :

- Cela élargit la surface d’outils du harness ACP.
- Les agents ACP n’obtiennent l’accès qu’aux outils de Plugin déjà actifs dans la Gateway.
- Considérez cela comme la même limite de confiance que lorsque vous autorisez ces Plugins à s’exécuter dans OpenClaw lui-même.
- Passez en revue les Plugins installés avant de l’activer.

Les `mcpServers` personnalisés continuent de fonctionner comme avant. Le pont intégré des outils de Plugin est
une commodité supplémentaire optionnelle, et non un remplacement d’une configuration générique de serveur MCP.

### Configuration du délai d’expiration d’exécution

Le Plugin `acpx` inclus définit par défaut un
délai d’expiration de 120 secondes pour les tours d’exécution embarqués. Cela donne à des harnesses plus lents comme Gemini CLI assez de temps pour terminer
le démarrage et l’initialisation ACP. Surchargez-le si votre hôte a besoin d’une autre
limite d’exécution :

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Redémarrez la Gateway après avoir modifié cette valeur.

### Configuration de l’agent de sonde de santé

Le Plugin `acpx` inclus sonde un agent de harness pendant qu’il détermine si le
backend d’exécution embarqué est prêt. Il utilise `codex` par défaut. Si votre déploiement
utilise un autre agent ACP par défaut, définissez l’agent de sonde sur ce même id :

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Redémarrez la Gateway après avoir modifié cette valeur.

## Configuration des permissions

Les sessions ACP s’exécutent de manière non interactive — il n’existe pas de TTY pour approuver ou refuser les invites d’autorisation d’écriture de fichiers et d’exécution de shell. Le Plugin acpx fournit deux clés de configuration qui contrôlent la manière dont les permissions sont gérées :

Ces permissions de harness ACPX sont distinctes des approbations d’exécution OpenClaw et distinctes des indicateurs de contournement fournisseur des CLI Backends, comme Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` est l’interrupteur de secours de niveau harness pour les sessions ACP.

### `permissionMode`

Contrôle quelles opérations l’agent de harness peut effectuer sans invite.

| Value | Comportement |
| --------------- | --------------------------------------------------------- |
| `approve-all` | Approuve automatiquement toutes les écritures de fichiers et commandes shell. |
| `approve-reads` | Approuve automatiquement les lectures uniquement ; les écritures et l’exécution exigent des invites. |
| `deny-all` | Refuse toutes les invites d’autorisation. |

### `nonInteractivePermissions`

Contrôle ce qui se passe lorsqu’une invite d’autorisation devrait être affichée mais qu’aucun TTY interactif n’est disponible (ce qui est toujours le cas pour les sessions ACP).

| Value | Comportement |
| ------ | ----------------------------------------------------------------- |
| `fail` | Abandonne la session avec `AcpRuntimeError`. **(par défaut)** |
| `deny` | Refuse silencieusement l’autorisation et continue (dégradation élégante). |

### Configuration

Définissez-les via la configuration du Plugin :

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Redémarrez la Gateway après avoir modifié ces valeurs.

> **Important :** OpenClaw utilise actuellement `permissionMode=approve-reads` et `nonInteractivePermissions=fail` par défaut. Dans les sessions ACP non interactives, toute écriture ou exécution qui déclenche une invite d’autorisation peut échouer avec `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Si vous devez restreindre les permissions, définissez `nonInteractivePermissions` sur `deny` afin que les sessions se dégradent élégamment au lieu de planter.

## Dépannage

| Symptôme | Cause probable | Correctif |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured` | Le Plugin backend est manquant ou désactivé. | Installez et activez le Plugin backend, puis exécutez `/acp doctor`. |
| `ACP is disabled by policy (acp.enabled=false)` | ACP est désactivé globalement. | Définissez `acp.enabled=true`. |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)` | Le dispatch depuis les messages de thread normaux est désactivé. | Définissez `acp.dispatch.enabled=true`. |
| `ACP agent "<id>" is not allowed by policy` | L’agent n’est pas dans la liste d’autorisation. | Utilisez un `agentId` autorisé ou mettez à jour `acp.allowedAgents`. |
| `Unable to resolve session target: ...` | Jeton clé/id/étiquette invalide. | Exécutez `/acp sessions`, copiez la clé/l’étiquette exacte, puis réessayez. |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` a été utilisé sans conversation active pouvant être liée. | Déplacez-vous vers le chat/canal cible et réessayez, ou utilisez un lancement sans liaison. |
| `Conversation bindings are unavailable for <channel>.` | L’adaptateur ne prend pas en charge la liaison ACP à la conversation courante. | Utilisez `/acp spawn ... --thread ...` lorsque c’est pris en charge, configurez des `bindings[]` de niveau supérieur, ou passez à un canal pris en charge. |
| `--thread here requires running /acp spawn inside an active ... thread` | `--thread here` a été utilisé hors d’un contexte de thread. | Déplacez-vous vers le thread cible ou utilisez `--thread auto`/`off`. |
| `Only <user-id> can rebind this channel/conversation/thread.` | Un autre utilisateur possède la cible de liaison active. | Reliez à nouveau en tant que propriétaire, ou utilisez une autre conversation ou un autre thread. |
| `Thread bindings are unavailable for <channel>.` | L’adaptateur ne prend pas en charge la liaison à un thread. | Utilisez `--thread off` ou passez à un adaptateur/canal pris en charge. |
| `Sandboxed sessions cannot spawn ACP sessions ...` | L’exécution ACP est côté hôte ; la session demandeuse est en bac à sable. | Utilisez `runtime="subagent"` depuis des sessions en bac à sable, ou lancez ACP depuis une session non en bac à sable. |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...` | `sandbox="require"` a été demandé pour l’exécution ACP. | Utilisez `runtime="subagent"` pour un bac à sable obligatoire, ou utilisez ACP avec `sandbox="inherit"` depuis une session non en bac à sable. |
| Métadonnées ACP manquantes pour la session liée | Métadonnées de session ACP obsolètes/supprimées. | Recréez avec `/acp spawn`, puis reliez à nouveau/redonnez le focus au thread. |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` | `permissionMode` bloque les écritures/l’exécution dans une session ACP non interactive. | Définissez `plugins.entries.acpx.config.permissionMode` sur `approve-all` et redémarrez la Gateway. Voir [Configuration des permissions](#configuration-des-permissions). |
| La session ACP échoue tôt avec peu de sortie | Les invites d’autorisation sont bloquées par `permissionMode`/`nonInteractivePermissions`. | Vérifiez les journaux de la Gateway pour `AcpRuntimeError`. Pour des permissions complètes, définissez `permissionMode=approve-all` ; pour une dégradation élégante, définissez `nonInteractivePermissions=deny`. |
| La session ACP reste bloquée indéfiniment après la fin du travail | Le processus de harness s’est terminé mais la session ACP n’a pas signalé sa fin. | Surveillez avec `ps aux \| grep acpx` ; tuez manuellement les processus obsolètes. |
