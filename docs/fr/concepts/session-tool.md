---
read_when:
    - Vous voulez comprendre de quels outils de session l’agent dispose
    - Vous souhaitez configurer l’accès entre sessions ou le lancement de sous-agents
    - Vous souhaitez inspecter l’état des sous-agents lancés
summary: Outils d’agent pour l’état intersessions, le rappel, la messagerie et l’orchestration de sous-agents
title: Outils de session
x-i18n:
    generated_at: "2026-06-27T17:26:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 382f5d63062a03c410e3f7cc88281a35bf428ff74a58144543e49b3cd4eb5c8b
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw donne aux agents des outils pour travailler sur plusieurs sessions, inspecter l’état et
orchestrer des sous-agents.

## Outils disponibles

| Outil              | Ce qu’il fait                                                              |
| ------------------ | -------------------------------------------------------------------------- |
| `sessions_list`    | Répertorie les sessions avec des filtres facultatifs (type, libellé, agent, récence, aperçu) |
| `sessions_history` | Lit la transcription d’une session spécifique                              |
| `sessions_send`    | Envoie un message à une autre session et attend éventuellement             |
| `sessions_spawn`   | Lance une session de sous-agent isolée pour du travail en arrière-plan     |
| `sessions_yield`   | Termine le tour actuel et attend les résultats de suivi des sous-agents    |
| `subagents`        | Répertorie l’état des sous-agents lancés pour cette session                |
| `session_status`   | Affiche une carte de type `/status` et définit éventuellement un remplacement de modèle par session |

Ces outils restent soumis au profil d’outils actif et à la politique
d’autorisation/refus. `tools.profile: "coding"` inclut l’ensemble complet
d’orchestration de sessions, notamment `sessions_spawn`, `sessions_yield` et
`subagents`. `tools.profile: "messaging"` inclut les outils de messagerie
entre sessions (`sessions_list`, `sessions_history`, `sessions_send`,
`session_status`), mais n’inclut pas le lancement de sous-agents. Pour conserver
un profil de messagerie tout en autorisant la délégation native, ajoutez :

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

Les politiques de groupe, de fournisseur, de sandbox et par agent peuvent
toujours retirer ces outils après l’étape du profil. Utilisez `/tools` depuis
la session concernée pour inspecter la liste d’outils effective.

## Répertorier et lire les sessions

`sessions_list` renvoie les sessions avec leur clé, agentId, type, canal,
modèle, nombre de jetons et horodatages. Filtrez par type (`main`, `group`,
`cron`, `hook`, `node`), `label` exact, `agentId` exact, texte de recherche ou
récence (`activeMinutes`). Lorsque vous avez besoin d’un triage de type boîte
de réception, il peut aussi demander un titre dérivé limité par la visibilité,
un extrait d’aperçu du dernier message ou des messages récents bornés sur
chaque ligne. Les titres dérivés et les aperçus ne sont produits que pour les
sessions que l’appelant peut déjà voir selon la politique configurée de
visibilité des outils de session ; les sessions sans rapport restent donc
masquées. Lorsque la visibilité est restreinte, `sessions_list` renvoie des
métadonnées `visibility` facultatives indiquant le mode effectif et un
avertissement précisant que les résultats peuvent être limités par le périmètre.

`sessions_history` récupère la transcription de conversation pour une session
spécifique. Par défaut, les résultats d’outils sont exclus -- passez
`includeTools: true` pour les voir. La vue renvoyée est volontairement bornée et
filtrée pour la sécurité :

- le texte de l’assistant est normalisé avant le rappel :
  - les balises de réflexion sont supprimées
  - les blocs d’échafaudage `<relevant-memories>` / `<relevant_memories>` sont supprimés
  - les blocs de charge utile XML d’appels d’outils en texte brut tels que `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` et
    `<function_calls>...</function_calls>` sont supprimés, y compris les charges utiles tronquées
    qui ne se ferment jamais proprement
  - l’échafaudage d’appels/résultats d’outils rétrogradé comme `[Tool Call: ...]`,
    `[Tool Result ...]` et `[Historical context ...]` est supprimé
  - les jetons de contrôle de modèle divulgués comme `<|assistant|>`, les autres jetons ASCII
    `<|...|>` et les variantes pleine chasse `<｜...｜>` sont supprimés
  - le XML d’appel d’outil MiniMax mal formé comme `<invoke ...>` /
    `</minimax:tool_call>` est supprimé
- le texte ressemblant à des identifiants ou jetons est masqué avant d’être renvoyé
- les longs blocs de texte sont tronqués
- les historiques très volumineux peuvent supprimer des lignes anciennes ou remplacer une ligne surdimensionnée par
  `[sessions_history omitted: message too large]`
- l’outil signale des indicateurs de résumé comme `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted` et `bytes`

Les deux outils acceptent soit une **clé de session** (comme `"main"`), soit un **ID de session**
provenant d’un appel de liste précédent.

Si vous avez besoin de la transcription exacte octet pour octet, inspectez le
fichier de transcription sur disque au lieu de traiter `sessions_history` comme
un vidage brut.

## Envoyer des messages entre sessions

`sessions_send` transmet un message à une autre session et attend
éventuellement la réponse :

- **Envoyer sans attendre :** définissez `timeoutSeconds: 0` pour mettre en file d’attente et retourner
  immédiatement.
- **Attendre la réponse :** définissez un délai d’expiration et obtenez la réponse en ligne.

Les sessions de discussion limitées à un fil, comme les clés Slack ou Discord
se terminant par `:thread:<id>`, ne sont pas des cibles `sessions_send` valides.
Utilisez la clé de session du canal parent pour la coordination entre agents afin
que les messages acheminés par outil n’apparaissent pas dans un fil actif
destiné aux humains.

Les messages et les réponses de suivi A2A sont marqués comme données entre
sessions dans le prompt de réception (`[Inter-session message ... isUser=false]`)
et dans la provenance de transcription. L’agent récepteur doit les traiter comme
des données acheminées par outil, et non comme une instruction rédigée
directement par l’utilisateur final.

Après la réponse de la cible, OpenClaw peut exécuter une **boucle de réponse en
retour** où les agents alternent les messages (jusqu’à
`session.agentToAgent.maxPingPongTurns`, plage 0-20, valeur par défaut 5).
L’agent cible peut répondre `REPLY_SKIP` pour arrêter plus tôt.

## Assistants d’état et d’orchestration

`session_status` est l’outil léger équivalent à `/status` pour la session
actuelle ou une autre session visible. Il signale l’utilisation, l’heure,
l’état du modèle/runtime et le contexte de tâche en arrière-plan lié lorsqu’il
est présent. Comme `/status`, il peut compléter les compteurs clairsemés de
jetons/cache depuis la dernière entrée d’utilisation de transcription, et
`model=default` efface un remplacement par session. Utilisez
`sessionKey="current"` pour la session actuelle de l’appelant ; les libellés
client visibles comme `openclaw-tui` ne sont pas des clés de session.

Lorsque des métadonnées de route sont disponibles, `session_status` inclut aussi
un bloc JSON visible `Route context` et des champs structurés `details`
correspondants. Ces champs distinguent la clé de session de la route qui gère
actuellement l’exécution en direct :

- `origin` indique où la session a été créée, ou le fournisseur déduit d’un
  préfixe de clé de session livrable lorsque l’ancien état ne possède pas de
  métadonnées d’origine stockées.
- `active` est la route actuelle de l’exécution en direct. Elle n’est signalée
  que pour la session en direct ou actuelle en cours de traitement.
- `deliveryContext` est la route de livraison persistée stockée sur la session,
  qu’OpenClaw peut réutiliser pour une livraison ultérieure même lorsque la
  surface active diffère.

`sessions_yield` termine volontairement le tour actuel afin que le message
suivant puisse être l’événement de suivi que vous attendez. Utilisez-le après le
lancement de sous-agents lorsque vous voulez que les résultats d’achèvement
arrivent comme message suivant au lieu de construire des boucles
d’interrogation.

`subagents` est l’assistant de visibilité pour les sous-agents OpenClaw déjà
lancés. Il prend en charge `action: "list"` pour inspecter les exécutions
actives/récentes.

## Lancer des sous-agents

`sessions_spawn` crée par défaut une session isolée pour une tâche en
arrière-plan. Il est toujours non bloquant -- il retourne immédiatement avec un
`runId` et un `childSessionKey`. Les exécutions natives de sous-agents reçoivent
la tâche déléguée dans le premier message visible `[Subagent Task]` de la
session enfant, tandis que le prompt système ne contient que les règles de
runtime de sous-agent et le contexte de routage.

Options clés :

- `runtime: "subagent"` (par défaut) ou `"acp"` pour les agents de harnais externes.
- Remplacements `model` et `thinking` pour la session enfant.
- `thread: true` pour lier le lancement à un fil de discussion (Discord, Slack, etc.).
- `sandbox: "require"` pour imposer le sandboxing à l’enfant.
- `context: "fork"` pour les sous-agents natifs lorsque l’enfant a besoin de la
  transcription actuelle du demandeur ; omettez-le ou utilisez `context: "isolated"` pour un enfant propre.
  Les sous-agents natifs liés à un fil utilisent par défaut `context: "fork"` sauf si
  `threadBindings.defaultSpawnContext` indique autre chose.

Les sous-agents feuilles par défaut ne reçoivent pas d’outils de session.
Lorsque `maxSpawnDepth >= 2`, les sous-agents orchestrateurs de profondeur 1
reçoivent en plus `sessions_spawn`, `subagents`, `sessions_list` et
`sessions_history` afin de pouvoir gérer leurs propres enfants. Les exécutions
feuilles ne reçoivent toujours pas d’outils d’orchestration récursive.

Après l’achèvement, une étape d’annonce publie le résultat dans le canal du
demandeur. La livraison d’achèvement préserve le routage de fil/sujet lié
lorsqu’il est disponible, et si l’origine de l’achèvement n’identifie qu’un
canal, OpenClaw peut tout de même réutiliser la route stockée de la session du
demandeur (`lastChannel` / `lastTo`) pour la livraison directe.

Pour le comportement propre à ACP, consultez [Agents ACP](/fr/tools/acp-agents).

## Visibilité

Les outils de session sont limités afin de restreindre ce que l’agent peut voir :

| Niveau  | Périmètre                                |
| ------- | ---------------------------------------- |
| `self`  | Uniquement la session actuelle           |
| `tree`  | Session actuelle + sous-agents lancés    |
| `agent` | Toutes les sessions de cet agent         |
| `all`   | Toutes les sessions (entre agents si configuré) |

La valeur par défaut est `tree`. Les sessions sandboxées sont limitées à `tree`
quelle que soit la configuration.

## Lectures complémentaires

- [Gestion des sessions](/fr/concepts/session) -- routage, cycle de vie, maintenance
- [Agents ACP](/fr/tools/acp-agents) -- lancement de harnais externe
- [Multi-agent](/fr/concepts/multi-agent) -- architecture multi-agent
- [Configuration du Gateway](/fr/gateway/configuration) -- paramètres de configuration des outils de session

## Connexe

- [Gestion des sessions](/fr/concepts/session)
- [Élagage des sessions](/fr/concepts/session-pruning)
