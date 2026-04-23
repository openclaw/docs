---
read_when:
    - Vous voulez comprendre quels outils de session l’agent possède
    - Vous voulez configurer l’accès inter-sessions ou le lancement de sous-agents
    - Vous voulez inspecter le statut ou contrôler des sous-agents lancés
summary: Outils d’agent pour le statut inter-sessions, le rappel, la messagerie et l’orchestration de sous-agents
title: Outils de session
x-i18n:
    generated_at: "2026-04-23T07:02:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: cd8b545429726d0880e6086ba7190497861bf3f3e1e88d53cb38ef9e5e4468c6
    source_path: concepts/session-tool.md
    workflow: 15
---

# Outils de session

OpenClaw donne aux agents des outils pour travailler entre les sessions, inspecter le statut et
orchestrer des sous-agents.

## Outils disponibles

| Outil              | Ce qu’il fait                                                              |
| ------------------ | -------------------------------------------------------------------------- |
| `sessions_list`    | Lister les sessions avec des filtres facultatifs (type, libellé, agent, récence, aperçu) |
| `sessions_history` | Lire le transcript d’une session spécifique                                |
| `sessions_send`    | Envoyer un message à une autre session et éventuellement attendre          |
| `sessions_spawn`   | Lancer une session de sous-agent isolée pour du travail en arrière-plan   |
| `sessions_yield`   | Terminer le tour actuel et attendre les résultats de sous-agents en suivi |
| `subagents`        | Lister, piloter ou arrêter les sous-agents lancés pour cette session      |
| `session_status`   | Afficher une carte de type `/status` et éventuellement définir un remplacement de modèle par session |

## Lister et lire des sessions

`sessions_list` renvoie les sessions avec leur clé, `agentId`, type, canal, modèle,
nombre de jetons et horodatages. Filtrez par type (`main`, `group`, `cron`, `hook`,
`node`), `label` exact, `agentId` exact, texte de recherche ou récence
(`activeMinutes`). Lorsque vous avez besoin d’un triage de type boîte de réception, il peut aussi demander un
titre dérivé limité par visibilité, un extrait d’aperçu du dernier message ou des
messages récents bornés sur chaque ligne. Les titres dérivés et aperçus ne sont produits que pour
les sessions que l’appelant peut déjà voir selon la politique de visibilité
configurée des outils de session, afin que les sessions non liées restent masquées.

`sessions_history` récupère le transcript de conversation pour une session spécifique.
Par défaut, les résultats d’outil sont exclus — passez `includeTools: true` pour les voir.
La vue renvoyée est volontairement bornée et filtrée pour la sécurité :

- le texte de l’assistant est normalisé avant le rappel :
  - les balises de réflexion sont supprimées
  - les blocs d’échafaudage `<relevant-memories>` / `<relevant_memories>` sont supprimés
  - les blocs de charge utile XML d’appel d’outil en texte brut tels que `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` et
    `<function_calls>...</function_calls>` sont supprimés, y compris les charges utiles
    tronquées qui ne se ferment jamais proprement
  - l’échafaudage dégradé d’appel/résultat d’outil tel que `[Tool Call: ...]`,
    `[Tool Result ...]` et `[Historical context ...]` est supprimé
  - les jetons de contrôle de modèle divulgués tels que `<|assistant|>`, les autres jetons ASCII
    `<|...|>` et les variantes pleine largeur `<｜...｜>` sont supprimés
  - les XML d’appel d’outil MiniMax mal formés tels que `<invoke ...>` /
    `</minimax:tool_call>` sont supprimés
- le texte de type identifiant/jeton est caviardé avant d’être renvoyé
- les longs blocs de texte sont tronqués
- les très grands historiques peuvent supprimer les lignes les plus anciennes ou remplacer une ligne
  surdimensionnée par `[sessions_history omitted: message too large]`
- l’outil signale des indicateurs de synthèse tels que `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted` et `bytes`

Les deux outils acceptent soit une **clé de session** (comme `"main"`), soit un **identifiant de session**
provenant d’un appel de liste précédent.

Si vous avez besoin du transcript exact octet pour octet, inspectez plutôt le fichier de transcript sur
disque au lieu de traiter `sessions_history` comme un dump brut.

## Envoyer des messages inter-sessions

`sessions_send` remet un message à une autre session et peut éventuellement attendre
la réponse :

- **Envoi sans attente :** définissez `timeoutSeconds: 0` pour mettre en file et revenir
  immédiatement.
- **Attendre une réponse :** définissez un délai d’expiration et obtenez la réponse en ligne.

Après la réponse de la cible, OpenClaw peut exécuter une **boucle de réponse en retour** où les
agents alternent les messages (jusqu’à 5 tours). L’agent cible peut répondre
`REPLY_SKIP` pour s’arrêter plus tôt.

## Assistants de statut et d’orchestration

`session_status` est l’outil léger équivalent à `/status` pour la session actuelle
ou une autre session visible. Il signale l’usage, le temps, l’état du modèle/de l’exécution et
le contexte lié de tâche d’arrière-plan lorsqu’il est présent. Comme `/status`, il peut compléter
des compteurs clairsemés de jetons/cache à partir de la dernière entrée d’usage du transcript, et
`model=default` efface un remplacement par session.

`sessions_yield` termine intentionnellement le tour actuel pour que le message suivant puisse être
l’événement de suivi que vous attendez. Utilisez-le après avoir lancé des sous-agents lorsque
vous voulez que les résultats d’achèvement arrivent comme message suivant au lieu de construire
des boucles de sondage.

`subagents` est l’assistant du plan de contrôle pour les sous-agents OpenClaw déjà
lancés. Il prend en charge :

- `action: "list"` pour inspecter les exécutions actives/récentes
- `action: "steer"` pour envoyer des consignes de suivi à un enfant en cours d’exécution
- `action: "kill"` pour arrêter un enfant ou `all`

## Lancer des sous-agents

`sessions_spawn` crée une session isolée pour une tâche en arrière-plan. Il est toujours
non bloquant — il renvoie immédiatement avec un `runId` et une `childSessionKey`.

Options clés :

- `runtime: "subagent"` (par défaut) ou `"acp"` pour les agents harness externes.
- Remplacements `model` et `thinking` pour la session enfant.
- `thread: true` pour lier le lancement à un fil de discussion (Discord, Slack, etc.).
- `sandbox: "require"` pour imposer le bac à sable sur l’enfant.

Les sous-agents feuille par défaut ne reçoivent pas les outils de session. Lorsque
`maxSpawnDepth >= 2`, les sous-agents orchestrateurs de profondeur 1 reçoivent en plus
`sessions_spawn`, `subagents`, `sessions_list` et `sessions_history` afin qu’ils
puissent gérer leurs propres enfants. Les exécutions feuille ne reçoivent toujours pas d’outils
d’orchestration récursive.

Après l’achèvement, une étape d’annonce publie le résultat dans le canal du demandeur.
La livraison d’achèvement préserve le routage lié de fil/sujet lorsque disponible, et si
l’origine de l’achèvement n’identifie qu’un canal, OpenClaw peut quand même réutiliser la route
stockée de la session demandeuse (`lastChannel` / `lastTo`) pour une
livraison directe.

Pour le comportement spécifique à ACP, voir [ACP Agents](/fr/tools/acp-agents).

## Visibilité

Les outils de session sont limités afin de restreindre ce que l’agent peut voir :

| Niveau  | Portée                                   |
| ------- | ---------------------------------------- |
| `self`  | Seulement la session actuelle            |
| `tree`  | Session actuelle + sous-agents lancés    |
| `agent` | Toutes les sessions pour cet agent       |
| `all`   | Toutes les sessions (inter-agents si configuré) |

La valeur par défaut est `tree`. Les sessions en bac à sable sont limitées à `tree` quelle que soit la
configuration.

## Pour aller plus loin

- [Gestion des sessions](/fr/concepts/session) -- routage, cycle de vie, maintenance
- [ACP Agents](/fr/tools/acp-agents) -- lancement de harness externes
- [Multi-agent](/fr/concepts/multi-agent) -- architecture multi-agent
- [Configuration de la Gateway](/fr/gateway/configuration) -- réglages de configuration des outils de session
