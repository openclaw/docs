---
read_when:
    - Exécuter des harness de code via ACP
    - Configurer des sessions ACP liées à des conversations sur des canaux de messagerie
    - Lier une conversation de canal de messagerie à une session ACP persistante
    - Dépanner le backend ACP et le câblage des plugins
    - Déboguer la livraison de fin ACP ou les boucles d’agent à agent
    - Utiliser les commandes /acp depuis la discussion
summary: Utiliser des sessions runtime ACP pour Codex, Claude Code, Cursor, Gemini CLI, OpenClaw ACP et d’autres agents harness
title: Agents ACP
x-i18n:
    generated_at: "2026-04-23T07:11:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 617103fe47ef90592bad4882da719c47c801ebc916d3614c148a66e6601e8cf5
    source_path: tools/acp-agents.md
    workflow: 15
---

# Agents ACP

Les sessions [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) permettent à OpenClaw d’exécuter des harnais de codage externes (par exemple Pi, Claude Code, Codex, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI et d’autres harnais ACPX pris en charge) via un Plugin backend ACP.

Si vous demandez à OpenClaw en langage naturel d’« exécuter ceci dans Codex » ou de « démarrer Claude Code dans un fil », OpenClaw doit acheminer cette demande vers le runtime ACP (et non vers le runtime natif de sous-agent). Chaque lancement de session ACP est suivi comme une [tâche d’arrière-plan](/fr/automation/tasks).

Si vous voulez que Codex ou Claude Code se connecte directement
à des conversations de canal OpenClaw existantes en tant que client MCP externe,
utilisez plutôt [`openclaw mcp serve`](/fr/cli/mcp) que ACP.

## Quelle page me faut-il ?

Il y a trois surfaces proches qu’il est facile de confondre :

| Vous voulez...                                                                     | Utiliser ceci                         | Notes                                                                                                       |
| ---------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Exécuter Codex, Claude Code, Gemini CLI ou un autre harnais externe _via_ OpenClaw | Cette page : agents ACP               | Sessions liées au chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tâches d’arrière-plan, contrôles du runtime |
| Exposer une session OpenClaw Gateway _comme_ serveur ACP pour un éditeur ou un client | [`openclaw acp`](/fr/cli/acp)            | Mode pont. L’IDE/le client parle ACP à OpenClaw via stdio/WebSocket                                          |
| Réutiliser une CLI IA locale comme modèle de secours en mode texte בלבד            | [Backends CLI](/fr/gateway/cli-backends) | Pas ACP. Pas d’outils OpenClaw, pas de contrôles ACP, pas de runtime de harnais                            |

## Est-ce que cela fonctionne prêt à l’emploi ?

En général, oui.

- Les nouvelles installations livrent désormais le Plugin runtime groupé `acpx` activé par défaut.
- Le Plugin `acpx` groupé privilégie son binaire `acpx` épinglé local au Plugin.
- Au démarrage, OpenClaw sonde ce binaire et l’auto-répare si nécessaire.
- Commencez par `/acp doctor` si vous voulez une vérification rapide de disponibilité.

Ce qui peut encore se produire lors de la première utilisation :

- Un adaptateur de harnais cible peut être récupéré à la demande avec `npx` la première fois que vous utilisez ce harnais.
- L’authentification du fournisseur doit toujours exister sur l’hôte pour ce harnais.
- Si l’hôte n’a pas d’accès npm/réseau, les récupérations d’adaptateur au premier lancement peuvent échouer tant que les caches ne sont pas préchauffés ou que l’adaptateur n’est pas installé autrement.

Exemples :

- `/acp spawn codex` : OpenClaw devrait être prêt à amorcer `acpx`, mais l’adaptateur ACP Codex peut encore nécessiter une première récupération.
- `/acp spawn claude` : même situation pour l’adaptateur ACP Claude, avec en plus l’authentification côté Claude sur cet hôte.

## Flux opérateur rapide

Utilisez ceci si vous voulez un guide pratique pour `/acp` :

1. Lancez une session :
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. Travaillez dans la conversation ou le fil lié (ou ciblez explicitement cette clé de session).
3. Vérifiez l’état du runtime :
   - `/acp status`
4. Ajustez les options du runtime selon les besoins :
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. Réorientez une session active sans remplacer le contexte :
   - `/acp steer tighten logging and continue`
6. Arrêtez le travail :
   - `/acp cancel` (arrêter le tour en cours), ou
   - `/acp close` (fermer la session + supprimer les liaisons)

## Démarrage rapide pour les humains

Exemples de demandes naturelles :

- « Lie ce canal Discord à Codex. »
- « Démarre une session Codex persistante dans un fil ici et garde-la ciblée. »
- « Exécute ceci comme une session ACP Claude Code à usage unique et résume le résultat. »
- « Lie cette discussion iMessage à Codex et conserve les suivis dans le même espace de travail. »
- « Utilise Gemini CLI pour cette tâche dans un fil, puis conserve les suivis dans ce même fil. »

Ce que OpenClaw doit faire :

1. Choisir `runtime: "acp"`.
2. Résoudre la cible de harnais demandée (`agentId`, par exemple `codex`).
3. Si une liaison à la conversation courante est demandée et que le canal actif la prend en charge, lier la session ACP à cette conversation.
4. Sinon, si une liaison à un fil est demandée et que le canal courant la prend en charge, lier la session ACP au fil.
5. Acheminer les messages de suivi liés vers cette même session ACP jusqu’à ce qu’elle soit défocalisée/fermée/expirée.

## ACP contre sous-agents

Utilisez ACP lorsque vous voulez un runtime de harnais externe. Utilisez les sous-agents lorsque vous voulez des exécutions déléguées natives à OpenClaw.

| Domaine       | Session ACP                           | Exécution de sous-agent             |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | Plugin backend ACP (par exemple acpx) | Runtime natif de sous-agent OpenClaw |
| Clé de session   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Commandes principales | `/acp ...`                            | `/subagents ...`                   |
| Outil de lancement    | `sessions_spawn` avec `runtime:"acp"` | `sessions_spawn` (runtime par défaut) |

Voir aussi [Sous-agents](/fr/tools/subagents).

## Comment ACP exécute Claude Code

Pour Claude Code via ACP, la pile est la suivante :

1. Plan de contrôle de session ACP OpenClaw
2. Plugin runtime groupé `acpx`
3. Adaptateur ACP Claude
4. Mécanisme de runtime/session côté Claude

Distinction importante :

- ACP Claude est une session de harnais avec contrôles ACP, reprise de session, suivi des tâches d’arrière-plan et liaison optionnelle à une conversation/un fil.
- Les backends CLI sont des runtimes de secours locaux séparés, en mode texte uniquement. Voir [Backends CLI](/fr/gateway/cli-backends).

Pour les opérateurs, la règle pratique est :

- vous voulez `/acp spawn`, des sessions pouvant être liées, des contrôles du runtime ou un travail de harnais persistant : utilisez ACP
- vous voulez un simple secours texte local via la CLI brute : utilisez les backends CLI

## Sessions liées

### Liaisons à la conversation courante

Utilisez `/acp spawn <harness> --bind here` lorsque vous voulez que la conversation courante devienne un espace de travail ACP durable sans créer de fil enfant.

Comportement :

- OpenClaw continue de gérer le transport du canal, l’authentification, la sécurité et la livraison.
- La conversation courante est épinglée à la clé de session ACP lancée.
- Les messages de suivi dans cette conversation sont acheminés vers la même session ACP.
- `/new` et `/reset` réinitialisent la même session ACP liée sur place.
- `/acp close` ferme la session et supprime la liaison à la conversation courante.

Ce que cela signifie en pratique :

- `--bind here` conserve la même surface de chat. Sur Discord, le canal courant reste le canal courant.
- `--bind here` peut tout de même créer une nouvelle session ACP si vous lancez un nouveau travail. La liaison attache cette session à la conversation courante.
- `--bind here` ne crée pas en soi un fil Discord enfant ni un sujet Telegram.
- Le runtime ACP peut toujours avoir son propre répertoire de travail (`cwd`) ou un espace de travail géré sur disque par le backend. Cet espace de travail du runtime est distinct de la surface de chat et n’implique pas un nouveau fil de messagerie.
- Si vous lancez vers un autre agent ACP et que vous ne passez pas `--cwd`, OpenClaw hérite par défaut de l’espace de travail de **l’agent cible**, pas de celui du demandeur.
- Si ce chemin d’espace de travail hérité est absent (`ENOENT`/`ENOTDIR`), OpenClaw revient au `cwd` par défaut du backend au lieu de réutiliser silencieusement le mauvais arbre.
- Si l’espace de travail hérité existe mais ne peut pas être accédé (par exemple `EACCES`), le lancement renvoie la véritable erreur d’accès au lieu d’abandonner `cwd`.

Modèle mental :

- surface de chat : là où les gens continuent de parler (`canal Discord`, `sujet Telegram`, `discussion iMessage`)
- session ACP : l’état durable du runtime Codex/Claude/Gemini vers lequel OpenClaw achemine
- fil/sujet enfant : une surface de messagerie supplémentaire facultative créée uniquement par `--thread ...`
- espace de travail du runtime : l’emplacement du système de fichiers où le harnais s’exécute (`cwd`, extraction du dépôt, espace de travail backend)

Exemples :

- `/acp spawn codex --bind here` : conserver ce chat, lancer ou rattacher une session ACP Codex, et y acheminer les futurs messages
- `/acp spawn codex --thread auto` : OpenClaw peut créer un fil/sujet enfant et y lier la session ACP
- `/acp spawn codex --bind here --cwd /workspace/repo` : même liaison de chat que ci-dessus, mais Codex s’exécute dans `/workspace/repo`

Prise en charge des liaisons à la conversation courante :

- Les canaux de chat/message qui annoncent la prise en charge de la liaison à la conversation courante peuvent utiliser `--bind here` via le chemin de liaison de conversation partagé.
- Les canaux avec une sémantique personnalisée de fil/sujet peuvent toujours fournir une canonicalisation spécifique au canal derrière la même interface partagée.
- `--bind here` signifie toujours « lier la conversation courante sur place ».
- Les liaisons génériques à la conversation courante utilisent le magasin de liaisons partagé OpenClaw et survivent aux redémarrages normaux de Gateway.

Notes :

- `--bind here` et `--thread ...` sont mutuellement exclusifs sur `/acp spawn`.
- Sur Discord, `--bind here` lie sur place le canal ou le fil courant. `spawnAcpSessions` n’est requis que lorsque OpenClaw doit créer un fil enfant pour `--thread auto|here`.
- Si le canal actif n’expose pas de liaisons ACP à la conversation courante, OpenClaw renvoie un message clair indiquant que ce n’est pas pris en charge.
- `resume` et les questions de « nouvelle session » sont des questions de session ACP, pas des questions de canal. Vous pouvez réutiliser ou remplacer l’état du runtime sans changer la surface de chat courante.

### Sessions liées à un fil

Lorsque les liaisons de fil sont activées pour un adaptateur de canal, les sessions ACP peuvent être liées à des fils :

- OpenClaw lie un fil à une session ACP cible.
- Les messages de suivi dans ce fil sont acheminés vers la session ACP liée.
- La sortie ACP est renvoyée dans ce même fil.
- Défocalisation/fermeture/archivage/expiration par délai d’inactivité ou âge maximal supprime la liaison.

La prise en charge de la liaison à un fil est spécifique à l’adaptateur. Si l’adaptateur du canal actif ne prend pas en charge les liaisons à un fil, OpenClaw renvoie un message clair indiquant qu’elles ne sont pas prises en charge ou indisponibles.

Indicateurs de fonctionnalité requis pour l’ACP lié à un fil :

- `acp.enabled=true`
- `acp.dispatch.enabled` est activé par défaut (définissez `false` pour mettre en pause la distribution ACP)
- Indicateur de lancement de fil ACP de l’adaptateur de canal activé (spécifique à l’adaptateur)
  - Discord : `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram : `channels.telegram.threadBindings.spawnAcpSessions=true`

### Canaux prenant en charge les fils

- Tout adaptateur de canal qui expose une capacité de liaison de session/fil.
- Prise en charge intégrée actuelle :
  - Fils/canaux Discord
  - Sujets Telegram (sujets de forum dans les groupes/supergroupes et sujets DM)
- Les canaux Plugin peuvent ajouter la prise en charge via la même interface de liaison.

## Paramètres spécifiques au canal

Pour les workflows non éphémères, configurez des liaisons ACP persistantes dans des entrées `bindings[]` de premier niveau.

### Modèle de liaison

- `bindings[].type="acp"` marque une liaison de conversation ACP persistante.
- `bindings[].match` identifie la conversation cible :
  - Canal ou fil Discord : `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Sujet de forum Telegram : `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - Discussion DM/de groupe BlueBubbles : `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Préférez `chat_id:*` ou `chat_identifier:*` pour des liaisons de groupe stables.
  - Discussion DM/de groupe iMessage : `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Préférez `chat_id:*` pour des liaisons de groupe stables.
- `bindings[].agentId` est l’identifiant d’agent OpenClaw propriétaire.
- Les remplacements ACP facultatifs se trouvent sous `bindings[].acp` :
  - `mode` (`persistent` ou `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Valeurs par défaut du runtime par agent

Utilisez `agents.list[].runtime` pour définir une seule fois les valeurs ACP par défaut pour chaque agent :

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (identifiant de harnais, par exemple `codex` ou `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

Priorité des remplacements pour les sessions ACP liées :

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

- OpenClaw garantit que la session ACP configurée existe avant utilisation.
- Les messages dans ce canal ou ce sujet sont acheminés vers la session ACP configurée.
- Dans les conversations liées, `/new` et `/reset` réinitialisent la même clé de session ACP sur place.
- Les liaisons de runtime temporaires (par exemple créées par des flux de focalisation sur un fil) s’appliquent toujours lorsqu’elles sont présentes.
- Pour les lancements ACP inter-agents sans `cwd` explicite, OpenClaw hérite de l’espace de travail de l’agent cible depuis la configuration de l’agent.
- Les chemins d’espace de travail hérités manquants reviennent au `cwd` par défaut du backend ; les échecs d’accès sur des chemins existants remontent comme erreurs de lancement.

## Démarrer des sessions ACP (interfaces)

### Depuis `sessions_spawn`

Utilisez `runtime: "acp"` pour démarrer une session ACP à partir d’un tour d’agent ou d’un appel d’outil.

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
- `mode: "session"` exige `thread: true` pour conserver une conversation liée persistante.

Détails de l’interface :

- `task` (obligatoire) : prompt initial envoyé à la session ACP.
- `runtime` (obligatoire pour ACP) : doit être `"acp"`.
- `agentId` (facultatif) : identifiant du harnais ACP cible. Revient à `acp.defaultAgent` s’il est défini.
- `thread` (facultatif, `false` par défaut) : demande un flux de liaison à un fil lorsqu’il est pris en charge.
- `mode` (facultatif) : `run` (usage unique) ou `session` (persistant).
  - la valeur par défaut est `run`
  - si `thread: true` et que le mode est omis, OpenClaw peut adopter par défaut un comportement persistant selon le chemin du runtime
  - `mode: "session"` exige `thread: true`
- `cwd` (facultatif) : répertoire de travail demandé pour le runtime (validé par la politique backend/runtime). S’il est omis, le lancement ACP hérite de l’espace de travail de l’agent cible lorsqu’il est configuré ; les chemins hérités manquants reviennent aux valeurs par défaut du backend, tandis que les véritables erreurs d’accès sont renvoyées.
- `label` (facultatif) : libellé destiné à l’opérateur, utilisé dans le texte de session/bannière.
- `resumeSessionId` (facultatif) : reprend une session ACP existante au lieu d’en créer une nouvelle. L’agent rejoue son historique de conversation via `session/load`. Exige `runtime: "acp"`.
- `streamTo` (facultatif) : `"parent"` diffuse des résumés de progression de l’exécution ACP initiale vers la session demandeuse sous forme d’événements système.
  - Lorsqu’elles sont disponibles, les réponses acceptées incluent `streamLogPath` pointant vers un journal JSONL limité à la session (`<sessionId>.acp-stream.jsonl`) que vous pouvez suivre pour obtenir l’historique complet du relais.
- `model` (facultatif) : remplacement explicite du modèle pour la session enfant ACP. Pris en compte pour `runtime: "acp"` afin que l’enfant utilise le modèle demandé au lieu de revenir silencieusement à la valeur par défaut de l’agent cible.

## Modèle de livraison

Les sessions ACP peuvent être soit des espaces de travail interactifs, soit un travail d’arrière-plan appartenant au parent. Le chemin de livraison dépend de cette forme.

### Sessions ACP interactives

Les sessions interactives sont conçues pour continuer la conversation sur une surface de chat visible :

- `/acp spawn ... --bind here` lie la conversation courante à la session ACP.
- `/acp spawn ... --thread ...` lie un fil/sujet de canal à la session ACP.
- Les `bindings[].type="acp"` persistants configurés acheminent les conversations correspondantes vers la même session ACP.

Les messages de suivi dans la conversation liée sont acheminés directement vers la session ACP, et la sortie ACP est renvoyée dans ce même canal/fil/sujet.

### Sessions ACP d’arrière-plan à usage unique appartenant au parent

Les sessions ACP à usage unique lancées par l’exécution d’un autre agent sont des enfants d’arrière-plan, semblables aux sous-agents :

- Le parent demande du travail avec `sessions_spawn({ runtime: "acp", mode: "run" })`.
- L’enfant s’exécute dans sa propre session de harnais ACP.
- L’achèvement est signalé via le chemin d’annonce interne de fin de tâche.
- Le parent reformule le résultat de l’enfant avec une voix normale d’assistant lorsqu’une réponse destinée à l’utilisateur est utile.

Ne traitez pas ce chemin comme un chat pair à pair entre le parent et l’enfant. L’enfant dispose déjà d’un canal d’achèvement vers le parent.

### `sessions_send` et livraison A2A

`sessions_send` peut cibler une autre session après le lancement. Pour les sessions homologues normales, OpenClaw utilise un chemin de suivi agent à agent (A2A) après injection du message :

- attendre la réponse de la session cible
- éventuellement laisser le demandeur et la cible échanger un nombre limité de tours de suivi
- demander à la cible de produire un message d’annonce
- livrer cette annonce au canal ou fil visible

Ce chemin A2A est une solution de secours pour les envois entre pairs lorsque l’expéditeur a besoin d’un suivi visible. Il reste activé lorsqu’une session non liée peut voir et envoyer un message à une cible ACP, par exemple sous des paramètres larges `tools.sessions.visibility`.

OpenClaw ignore le suivi A2A uniquement lorsque le demandeur est le parent de son propre enfant ACP à usage unique appartenant au parent. Dans ce cas, exécuter A2A en plus de l’achèvement de tâche peut réveiller le parent avec le résultat de l’enfant, renvoyer la réponse du parent dans l’enfant et créer une boucle d’écho parent/enfant. Le résultat de `sessions_send` indique `delivery.status="skipped"` pour ce cas d’enfant possédé, car le chemin d’achèvement est déjà responsable du résultat.

### Reprendre une session existante

Utilisez `resumeSessionId` pour continuer une session ACP précédente au lieu d’en démarrer une nouvelle. L’agent rejoue son historique de conversation via `session/load`, ce qui lui permet de reprendre avec tout le contexte précédent.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Cas d’usage courants :

- Transférer une session Codex de votre ordinateur portable à votre téléphone — dites à votre agent de reprendre là où vous vous étiez arrêté
- Continuer une session de codage commencée de manière interactive dans la CLI, désormais en mode sans interface via votre agent
- Reprendre un travail interrompu par un redémarrage de Gateway ou un délai d’inactivité

Notes :

- `resumeSessionId` exige `runtime: "acp"` — renvoie une erreur s’il est utilisé avec le runtime de sous-agent.
- `resumeSessionId` restaure l’historique de conversation ACP amont ; `thread` et `mode` s’appliquent toujours normalement à la nouvelle session OpenClaw que vous créez, donc `mode: "session"` exige toujours `thread: true`.
- L’agent cible doit prendre en charge `session/load` (Codex et Claude Code le font).
- Si l’identifiant de session est introuvable, le lancement échoue avec une erreur claire — aucun retour silencieux vers une nouvelle session.

### Test Smoke opérateur

Utilisez ceci après un déploiement de Gateway lorsque vous voulez une vérification rapide en conditions réelles que le lancement ACP
fonctionne effectivement de bout en bout, et ne se contente pas de réussir les tests unitaires.

Validation recommandée :

1. Vérifiez la version/le commit de Gateway déployé sur l’hôte cible.
2. Confirmez que la source déployée inclut l’acceptation de lignage ACP dans
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
   - une vraie valeur `childSessionKey`
   - aucune erreur de validation
6. Nettoyez la session de pont ACPX temporaire.

Exemple de prompt pour l’agent actif :

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

Notes :

- Gardez ce test Smoke sur `mode: "run"` sauf si vous testez intentionnellement
  des sessions ACP persistantes liées à un fil.
- N’exigez pas `streamTo: "parent"` pour la validation de base. Ce chemin dépend des
  capacités du demandeur/de la session et constitue une vérification d’intégration distincte.
- Considérez le test `mode: "session"` lié à un fil comme une seconde passe
  d’intégration plus riche depuis un vrai fil Discord ou un vrai sujet Telegram.

## Compatibilité du bac à sable

Les sessions ACP s’exécutent actuellement sur le runtime hôte, et non dans le bac à sable OpenClaw.

Limitations actuelles :

- Si la session demandeuse est en bac à sable, les lancements ACP sont bloqués pour `sessions_spawn({ runtime: "acp" })` et `/acp spawn`.
  - Erreur : `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` avec `runtime: "acp"` ne prend pas en charge `sandbox: "require"`.
  - Erreur : `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Utilisez `runtime: "subagent"` lorsque vous avez besoin d’une exécution imposée par le bac à sable.

### Depuis la commande `/acp`

Utilisez `/acp spawn` pour un contrôle opérateur explicite depuis le chat lorsque c’est nécessaire.

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

Voir [Commandes Slash](/fr/tools/slash-commands).

## Résolution de cible de session

La plupart des actions `/acp` acceptent une cible de session facultative (`session-key`, `session-id` ou `session-label`).

Ordre de résolution :

1. Argument de cible explicite (ou `--session` pour `/acp steer`)
   - essaie d’abord la clé
   - puis l’identifiant de session en forme d’UUID
   - puis le libellé
2. Liaison du fil courant (si cette conversation/ce fil est lié à une session ACP)
3. Repli sur la session demandeuse courante

Les liaisons à la conversation courante et les liaisons à un fil participent toutes deux à l’étape 2.

Si aucune cible n’est résolue, OpenClaw renvoie une erreur claire (`Unable to resolve session target: ...`).

## Modes de liaison au lancement

`/acp spawn` prend en charge `--bind here|off`.

| Mode   | Comportement                                                               |
| ------ | -------------------------------------------------------------------------- |
| `here` | Lie la conversation active courante sur place ; échoue si aucune n’est active. |
| `off`  | Ne crée pas de liaison à la conversation courante.                          |

Notes :

- `--bind here` est le chemin opérateur le plus simple pour « faire de ce canal ou chat un espace soutenu par Codex ».
- `--bind here` ne crée pas de fil enfant.
- `--bind here` n’est disponible que sur les canaux qui exposent la prise en charge de la liaison à la conversation courante.
- `--bind` et `--thread` ne peuvent pas être combinés dans le même appel `/acp spawn`.

## Modes de fil au lancement

`/acp spawn` prend en charge `--thread auto|here|off`.

| Mode   | Comportement                                                                                       |
| ------ | -------------------------------------------------------------------------------------------------- |
| `auto` | Dans un fil actif : lie ce fil. Hors d’un fil : crée/lie un fil enfant lorsque c’est pris en charge. |
| `here` | Exige le fil actif courant ; échoue si vous n’êtes pas dans un fil.                               |
| `off`  | Aucune liaison. La session démarre sans liaison.                                                   |

Notes :

- Sur les surfaces qui ne prennent pas en charge les liaisons à un fil, le comportement par défaut est effectivement `off`.
- Le lancement lié à un fil exige la prise en charge par la politique du canal :
  - Discord : `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram : `channels.telegram.threadBindings.spawnAcpSessions=true`
- Utilisez `--bind here` lorsque vous voulez épingler la conversation courante sans créer de fil enfant.

## Contrôles ACP

Famille de commandes disponibles :

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

`/acp status` affiche les options effectives du runtime et, lorsqu’ils sont disponibles, les identifiants de session au niveau du runtime et du backend.

Certains contrôles dépendent des capacités du backend. Si un backend ne prend pas en charge un contrôle, OpenClaw renvoie une erreur claire indiquant que ce contrôle n’est pas pris en charge.

## Recettes de commandes ACP

| Commande             | Ce qu’elle fait                                            | Exemple                                                       |
| -------------------- | ---------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Crée une session ACP ; liaison courante ou à un fil en option. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Annule le tour en cours pour la session cible.             | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Envoie une instruction de pilotage à la session en cours.  | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Ferme la session et délie les cibles de fil.               | `/acp close`                                                  |
| `/acp status`        | Affiche backend, mode, état, options du runtime, capacités. | `/acp status`                                                 |
| `/acp set-mode`      | Définit le mode du runtime pour la session cible.          | `/acp set-mode plan`                                          |
| `/acp set`           | Écriture générique d’une option de configuration du runtime. | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Définit un remplacement du répertoire de travail du runtime. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Définit le profil de politique d’approbation.              | `/acp permissions strict`                                     |
| `/acp timeout`       | Définit le délai d’expiration du runtime (secondes).       | `/acp timeout 120`                                            |
| `/acp model`         | Définit un remplacement du modèle du runtime.              | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Supprime les remplacements d’options du runtime de la session. | `/acp reset-options`                                          |
| `/acp sessions`      | Liste les sessions ACP récentes du magasin.                | `/acp sessions`                                               |
| `/acp doctor`        | État du backend, capacités, correctifs actionnables.       | `/acp doctor`                                                 |
| `/acp install`       | Affiche les étapes déterministes d’installation et d’activation. | `/acp install`                                                |

`/acp sessions` lit le magasin pour la session actuellement liée ou la session demandeuse. Les commandes qui acceptent des jetons `session-key`, `session-id` ou `session-label` résolvent les cibles via la découverte de sessions Gateway, y compris les racines `session.store` personnalisées par agent.

## Correspondance des options du runtime

`/acp` propose des commandes pratiques et un setter générique.

Opérations équivalentes :

- `/acp model <id>` correspond à la clé de configuration du runtime `model`.
- `/acp permissions <profile>` correspond à la clé de configuration du runtime `approval_policy`.
- `/acp timeout <seconds>` correspond à la clé de configuration du runtime `timeout`.
- `/acp cwd <path>` met directement à jour le remplacement `cwd` du runtime.
- `/acp set <key> <value>` est le chemin générique.
  - Cas particulier : `key=cwd` utilise le chemin de remplacement `cwd`.
- `/acp reset-options` efface tous les remplacements du runtime pour la session cible.

## Prise en charge des harnais acpx (actuelle)

Alias de harnais intégrés acpx actuels :

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

Lorsque OpenClaw utilise le backend acpx, préférez ces valeurs pour `agentId`, sauf si votre configuration acpx définit des alias d’agent personnalisés.
Si votre installation locale de Cursor expose encore ACP en tant que `agent acp`, remplacez la commande de l’agent `cursor` dans votre configuration acpx au lieu de modifier la valeur par défaut intégrée.

L’utilisation directe de la CLI acpx peut aussi cibler des adaptateurs arbitraires via `--agent <command>`, mais cette échappatoire brute est une fonctionnalité de la CLI acpx (et non le chemin `agentId` normal d’OpenClaw).

## Configuration requise

Base ACP du noyau :

```json5
{
  acp: {
    enabled: true,
    // Facultatif. La valeur par défaut est true ; définissez false pour mettre en pause la distribution ACP tout en conservant les contrôles /acp.
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

La configuration des liaisons à un fil est spécifique à l’adaptateur de canal. Exemple pour Discord :

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

Si le lancement ACP lié à un fil ne fonctionne pas, vérifiez d’abord l’indicateur de fonctionnalité de l’adaptateur :

- Discord : `channels.discord.threadBindings.spawnAcpSessions=true`

Les liaisons à la conversation courante ne nécessitent pas la création d’un fil enfant. Elles exigent un contexte de conversation actif et un adaptateur de canal qui expose les liaisons de conversation ACP.

Voir [Référence de configuration](/fr/gateway/configuration-reference).

## Configuration du Plugin pour le backend acpx

Les nouvelles installations livrent le Plugin runtime groupé `acpx` activé par défaut, donc ACP
fonctionne généralement sans étape manuelle d’installation de Plugin.

Commencez par :

```text
/acp doctor
```

Si vous avez désactivé `acpx`, l’avez refusé via `plugins.allow` / `plugins.deny`, ou voulez
basculer vers une extraction locale de développement, utilisez le chemin de Plugin explicite :

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Installation depuis un espace de travail local pendant le développement :

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Vérifiez ensuite l’état du backend :

```text
/acp doctor
```

### Configuration de la commande et de la version acpx

Par défaut, le Plugin backend acpx groupé (`acpx`) utilise le binaire épinglé local au Plugin :

1. La commande utilise par défaut le `node_modules/.bin/acpx` local au Plugin dans le package du Plugin ACPX.
2. La version attendue utilise par défaut l’épinglage de l’extension.
3. Le démarrage enregistre immédiatement le backend ACP comme non prêt.
4. Une tâche d’assurance en arrière-plan vérifie `acpx --version`.
5. Si le binaire local au Plugin est manquant ou ne correspond pas, il exécute :
   `npm install --omit=dev --no-save acpx@<pinned>` puis revérifie.

Vous pouvez remplacer la commande/la version dans la configuration du Plugin :

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

Notes :

- `command` accepte un chemin absolu, un chemin relatif ou un nom de commande (`acpx`).
- Les chemins relatifs sont résolus depuis le répertoire de l’espace de travail OpenClaw.
- `expectedVersion: "any"` désactive la correspondance stricte de version.
- Lorsque `command` pointe vers un binaire/chemin personnalisé, l’auto-installation locale au Plugin est désactivée.
- Le démarrage d’OpenClaw reste non bloquant pendant l’exécution de la vérification d’état du backend.

Voir [Plugins](/fr/tools/plugin).

### Installation automatique des dépendances

Lorsque vous installez OpenClaw globalement avec `npm install -g openclaw`, les dépendances du runtime acpx
(binaires spécifiques à la plateforme) sont installées automatiquement
via un hook postinstall. Si l’installation automatique échoue, Gateway démarre quand même
normalement et signale la dépendance manquante via `openclaw acp doctor`.

### Pont MCP des outils de Plugin

Par défaut, les sessions ACPX **n’exposent pas** les outils enregistrés par les Plugins OpenClaw au
harnais ACP.

Si vous voulez que des agents ACP tels que Codex ou Claude Code puissent appeler des
outils de Plugin OpenClaw installés, comme memory recall/store, activez le pont dédié :

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Ce que cela fait :

- Injecte un serveur MCP intégré nommé `openclaw-plugin-tools` dans l’amorçage de session ACPX.
- Expose les outils de Plugin déjà enregistrés par les Plugins OpenClaw installés et activés.
- Rend la fonctionnalité explicite et désactivée par défaut.

Notes de sécurité et de confiance :

- Cela élargit la surface d’outils du harnais ACP.
- Les agents ACP obtiennent l’accès uniquement aux outils de Plugin déjà actifs dans Gateway.
- Traitez cela comme la même frontière de confiance que celle qui consiste à laisser ces Plugins s’exécuter dans
  OpenClaw lui-même.
- Vérifiez les Plugins installés avant de l’activer.

Les `mcpServers` personnalisés continuent de fonctionner comme avant. Le pont intégré plugin-tools est une
commodité supplémentaire avec opt-in, et non un remplacement de la configuration générique de serveur MCP.

### Pont MCP des outils OpenClaw

Par défaut, les sessions ACPX **n’exposent pas non plus** les outils OpenClaw intégrés via
MCP. Activez le pont distinct des outils de base lorsqu’un agent ACP a besoin de certains
outils intégrés tels que `cron` :

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Ce que cela fait :

- Injecte un serveur MCP intégré nommé `openclaw-tools` dans l’amorçage de session ACPX.
- Expose certains outils OpenClaw intégrés. Le serveur initial expose `cron`.
- Rend l’exposition des outils de base explicite et désactivée par défaut.

### Configuration du délai d’expiration du runtime

Le Plugin `acpx` groupé définit par défaut un délai d’expiration de 120 secondes
pour les tours de runtime intégrés. Cela donne à des harnais plus lents tels que Gemini CLI suffisamment de temps pour terminer
le démarrage et l’initialisation ACP. Remplacez cette valeur si votre hôte a besoin d’une limite de
runtime différente :

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Redémarrez Gateway après avoir modifié cette valeur.

### Configuration de l’agent de sonde de santé

Le Plugin `acpx` groupé sonde un agent de harnais pour déterminer si le
backend runtime intégré est prêt. Il utilise par défaut `codex`. Si votre déploiement
utilise un autre agent ACP par défaut, définissez l’agent de sonde sur le même identifiant :

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Redémarrez Gateway après avoir modifié cette valeur.

## Configuration des permissions

Les sessions ACP s’exécutent de manière non interactive — il n’y a pas de TTY pour approuver ou refuser les invites de permission d’écriture de fichier et d’exécution de shell. Le Plugin acpx fournit deux clés de configuration qui contrôlent la gestion des permissions :

Ces permissions de harnais ACPX sont distinctes des approbations d’exécution OpenClaw et distinctes des indicateurs de contournement du fournisseur backend CLI tels que Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` est l’interrupteur de secours au niveau du harnais pour les sessions ACP.

### `permissionMode`

Contrôle quelles opérations l’agent de harnais peut effectuer sans invite.

| Valeur          | Comportement                                                  |
| --------------- | ------------------------------------------------------------- |
| `approve-all`   | Approuve automatiquement toutes les écritures de fichiers et commandes shell. |
| `approve-reads` | Approuve automatiquement les lectures uniquement ; les écritures et l’exécution exigent des invites. |
| `deny-all`      | Refuse toutes les invites de permission.                      |

### `nonInteractivePermissions`

Contrôle ce qui se passe lorsqu’une invite de permission devrait être affichée mais qu’aucun TTY interactif n’est disponible (ce qui est toujours le cas pour les sessions ACP).

| Valeur | Comportement                                                      |
| ------ | ----------------------------------------------------------------- |
| `fail` | Interrompt la session avec `AcpRuntimeError`. **(par défaut)**    |
| `deny` | Refuse silencieusement la permission et continue (dégradation progressive). |

### Configuration

Définissez via la configuration du Plugin :

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Redémarrez Gateway après avoir modifié ces valeurs.

> **Important :** OpenClaw utilise actuellement par défaut `permissionMode=approve-reads` et `nonInteractivePermissions=fail`. Dans les sessions ACP non interactives, toute écriture ou exécution qui déclenche une invite de permission peut échouer avec `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Si vous devez restreindre les permissions, définissez `nonInteractivePermissions` sur `deny` afin que les sessions se dégradent progressivement au lieu de planter.

## Dépannage

| Symptôme                                                                    | Cause probable                                                                  | Correctif                                                                                                                                                         |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Le Plugin backend est manquant ou désactivé.                                    | Installez et activez le Plugin backend, puis exécutez `/acp doctor`.                                                                                             |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP est désactivé globalement.                                                  | Définissez `acp.enabled=true`.                                                                                                                                     |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | La distribution depuis les messages normaux de fil est désactivée.              | Définissez `acp.dispatch.enabled=true`.                                                                                                                            |
| `ACP agent "<id>" is not allowed by policy`                                 | L’agent n’est pas dans la liste d’autorisation.                                 | Utilisez un `agentId` autorisé ou mettez à jour `acp.allowedAgents`.                                                                                              |
| `Unable to resolve session target: ...`                                     | Mauvais jeton clé/id/libellé.                                                   | Exécutez `/acp sessions`, copiez la clé/le libellé exact, puis réessayez.                                                                                         |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` est utilisé sans conversation active pouvant être liée.           | Déplacez-vous dans le chat/canal cible et réessayez, ou utilisez un lancement sans liaison.                                                                      |
| `Conversation bindings are unavailable for <channel>.`                      | L’adaptateur ne dispose pas de la capacité de liaison ACP à la conversation courante. | Utilisez `/acp spawn ... --thread ...` lorsqu’il est pris en charge, configurez `bindings[]` au niveau supérieur, ou passez à un canal pris en charge.          |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` est utilisé hors d’un contexte de fil.                          | Déplacez-vous dans le fil cible ou utilisez `--thread auto`/`off`.                                                                                                |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Un autre utilisateur possède la cible de liaison active.                        | Reliez à nouveau en tant que propriétaire ou utilisez une autre conversation ou un autre fil.                                                                     |
| `Thread bindings are unavailable for <channel>.`                            | L’adaptateur ne dispose pas de la capacité de liaison à un fil.                 | Utilisez `--thread off` ou passez à un adaptateur/canal pris en charge.                                                                                           |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Le runtime ACP est côté hôte ; la session demandeuse est dans le bac à sable.   | Utilisez `runtime="subagent"` depuis des sessions en bac à sable, ou lancez ACP depuis une session non mise en bac à sable.                                      |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` est demandé pour le runtime ACP.                            | Utilisez `runtime="subagent"` pour une mise en bac à sable obligatoire, ou utilisez ACP avec `sandbox="inherit"` depuis une session non mise en bac à sable.     |
| Missing ACP metadata for bound session                                      | Métadonnées de session ACP obsolètes/supprimées.                                | Recréez avec `/acp spawn`, puis reliez à nouveau / refocalisez le fil.                                                                                            |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` bloque les écritures/l’exécution dans une session ACP non interactive. | Définissez `plugins.entries.acpx.config.permissionMode` sur `approve-all` et redémarrez Gateway. Voir [Configuration des permissions](#permission-configuration). |
| ACP session fails early with little output                                  | Les invites de permission sont bloquées par `permissionMode`/`nonInteractivePermissions`. | Vérifiez les journaux Gateway pour `AcpRuntimeError`. Pour des permissions complètes, définissez `permissionMode=approve-all` ; pour une dégradation progressive, définissez `nonInteractivePermissions=deny`. |
| ACP session stalls indefinitely after completing work                       | Le processus du harnais a terminé mais la session ACP n’a pas signalé sa fin.   | Surveillez avec `ps aux \| grep acpx` ; tuez manuellement les processus obsolètes.                                                                                |
