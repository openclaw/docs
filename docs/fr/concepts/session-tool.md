---
read_when:
    - Vous voulez comprendre de quels outils de session dispose l’agent
    - Vous souhaitez configurer l’accès intersessions ou la création de sous-agents
    - Vous souhaitez inspecter l’état du sous-agent généré
summary: Outils d’agent pour le statut intersessions, le rappel, la messagerie et l’orchestration de sous-agents
title: Outils de session
x-i18n:
    generated_at: "2026-07-04T20:30:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2f344642b8d234984719cc603b4ac8773314a0bffdb0ac7d5a7280e584c5f530
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw donne aux agents des outils pour travailler sur plusieurs sessions, inspecter l'état et
orchestrer des sous-agents.

## Outils disponibles

| Outil              | Ce qu'il fait                                                              |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | Liste les sessions avec des filtres facultatifs (type, libellé, agent, archive, aperçu) |
| `sessions_history` | Lit la transcription d'une session spécifique                              |
| `sessions_send`    | Envoie un message à une autre session et attend éventuellement             |
| `sessions_spawn`   | Lance une session de sous-agent isolée pour du travail en arrière-plan     |
| `sessions_yield`   | Termine le tour actuel et attend les résultats de suivi des sous-agents    |
| `subagents`        | Liste l'état des sous-agents lancés pour cette session                     |
| `session_status`   | Affiche une carte de style `/status` et définit éventuellement un remplacement de modèle par session |

Ces outils restent soumis au profil d'outils actif et à la stratégie
d'autorisation/refus. `tools.profile: "coding"` inclut l'ensemble complet
d'orchestration de sessions, y compris `sessions_spawn`, `sessions_yield` et
`subagents`. `tools.profile: "messaging"` inclut les outils de messagerie
inter-sessions (`sessions_list`, `sessions_history`, `sessions_send`,
`session_status`), mais n'inclut pas le lancement de sous-agents. Pour conserver
un profil de messagerie tout en autorisant la délégation native, ajoutez :

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

Les stratégies de groupe, de fournisseur, de sandbox et par agent peuvent encore
retirer ces outils après l'étape de profil. Utilisez `/tools` depuis la session
concernée pour inspecter la liste effective des outils.

## Lister et lire les sessions

`sessions_list` renvoie les sessions avec leur clé, agentId, type, canal, modèle,
décomptes de tokens et horodatages. Filtrez par type (`main`, `group`, `cron`,
`hook`, `node`), `label` exact, `agentId` exact, texte de recherche ou récence
(`activeMinutes`). Les sessions actives sont renvoyées par défaut ; passez
`archived: true` pour inspecter les sessions archivées. Les lignes incluent leur
état épinglé et archivé. Quand vous avez besoin d'un tri de type boîte aux lettres,
l'outil peut aussi demander un titre dérivé limité à la visibilité, un extrait
d'aperçu du dernier message ou des messages récents bornés sur chaque ligne. Les
titres dérivés et les aperçus ne sont produits que pour les sessions que l'appelant
peut déjà voir selon la stratégie de visibilité configurée des outils de session,
de sorte que les sessions sans rapport restent masquées. Quand la visibilité est
restreinte, `sessions_list` renvoie des métadonnées `visibility` facultatives
indiquant le mode effectif et un avertissement précisant que les résultats peuvent
être limités au périmètre.

`sessions_history` récupère la transcription de conversation pour une session
spécifique. Par défaut, les résultats d'outils sont exclus -- passez
`includeTools: true` pour les voir. Utilisez `limit` pour la queue bornée la plus
récente. Passez `offset: 0` quand vous avez besoin des métadonnées de pagination,
puis passez les valeurs `nextOffset` renvoyées pour remonter page par page dans les
anciennes fenêtres de transcription OpenClaw sans lire les fichiers de transcription
bruts. Les pages à décalage explicite ne fusionnent pas les imports de secours
externes de la CLI ; utilisez la vue par défaut de queue la plus récente quand vous
avez besoin de cet historique d'affichage fusionné.
La vue renvoyée est volontairement bornée et filtrée pour la sécurité :

- le texte de l'assistant est normalisé avant rappel :
  - les balises de réflexion sont supprimées
  - les blocs d'échafaudage `<relevant-memories>` / `<relevant_memories>` sont supprimés
  - les blocs de charge utile XML d'appel d'outil en texte brut tels que `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` et
    `<function_calls>...</function_calls>` sont supprimés, y compris les charges utiles tronquées
    qui ne se ferment jamais proprement
  - l'échafaudage déclassé d'appels/résultats d'outils tel que `[Tool Call: ...]`,
    `[Tool Result ...]` et `[Historical context ...]` est supprimé
  - les tokens de contrôle de modèle divulgués tels que `<|assistant|>`, les autres tokens
    ASCII `<|...|>` et les variantes pleine chasse `<｜...｜>` sont supprimés
  - le XML d'appel d'outil MiniMax mal formé tel que `<invoke ...>` /
    `</minimax:tool_call>` est supprimé
- le texte ressemblant à des identifiants ou tokens est expurgé avant d'être renvoyé
- les longs blocs de texte sont tronqués
- les historiques très volumineux peuvent supprimer les lignes anciennes ou remplacer une ligne surdimensionnée par
  `[sessions_history omitted: message too large]`
- l'outil signale des indicateurs de résumé tels que `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted`, `bytes` et des métadonnées de pagination

Les deux outils acceptent soit une **clé de session** (comme `"main"`), soit un
**ID de session** provenant d'un appel de liste précédent.

Si vous avez besoin de la transcription exacte octet pour octet, inspectez le
fichier de transcription sur disque au lieu de traiter `sessions_history` comme
un vidage brut.

## Envoyer des messages inter-sessions

`sessions_send` livre un message à une autre session et attend éventuellement la
réponse :

- **Envoyer sans attendre :** définissez `timeoutSeconds: 0` pour mettre en file d'attente et renvoyer
  immédiatement.
- **Attendre la réponse :** définissez un délai d'attente et obtenez la réponse en ligne.

Les sessions de chat limitées à un fil, comme les clés Slack ou Discord se
terminant par `:thread:<id>`, ne sont pas des cibles `sessions_send` valides.
Utilisez la clé de session du canal parent pour la coordination inter-agents afin
que les messages routés par outil n'apparaissent pas dans un fil actif destiné aux
humains.

Les messages et les réponses de suivi A2A sont marqués comme données inter-sessions
dans le prompt de réception (`[Inter-session message ... isUser=false]`) et dans
la provenance de transcription. L'agent récepteur doit les traiter comme des
données routées par outil, et non comme une instruction directement rédigée par
l'utilisateur final.

Après la réponse de la cible, OpenClaw peut exécuter une **boucle de réponse en retour**
dans laquelle les agents alternent les messages (jusqu'à
`session.agentToAgent.maxPingPongTurns`, plage 0-20, valeur par défaut 5). L'agent
cible peut répondre `REPLY_SKIP` pour arrêter plus tôt.

## Assistants d'état et d'orchestration

`session_status` est l'outil léger équivalent à `/status` pour la session actuelle
ou une autre session visible. Il indique l'utilisation, l'heure, l'état du modèle/runtime
et le contexte de tâche en arrière-plan lié lorsqu'il est présent. Comme `/status`,
il peut compléter les compteurs épars de tokens/cache depuis la dernière entrée
d'utilisation de transcription, et `model=default` efface un remplacement par
session. Utilisez `sessionKey="current"` pour la session actuelle de l'appelant ;
les libellés client visibles tels que `openclaw-tui` ne sont pas des clés de session.

Quand les métadonnées de routage sont disponibles, `session_status` inclut aussi
un bloc JSON `Route context` visible et des champs `details` structurés correspondants.
Ces champs distinguent la clé de session de la route qui traite actuellement
l'exécution active :

- `origin` est l'endroit où la session a été créée, ou le fournisseur déduit d'un
  préfixe de clé de session livrable quand l'ancien état n'a pas de métadonnées
  d'origine stockées.
- `active` est la route actuelle de l'exécution active. Elle n'est signalée que pour
  la session active ou actuelle en cours de traitement.
- `deliveryContext` est la route de livraison persistée stockée sur la session,
  qu'OpenClaw peut réutiliser pour une livraison ultérieure même quand la surface
  active diffère.

`sessions_yield` termine volontairement le tour actuel afin que le message suivant
puisse être l'événement de suivi que vous attendez. Utilisez-le après avoir lancé
des sous-agents quand vous voulez que les résultats de complétion arrivent comme
message suivant au lieu de créer des boucles d'interrogation.

`subagents` est l'assistant de visibilité pour les sous-agents OpenClaw déjà
lancés. Il prend en charge `action: "list"` pour inspecter les exécutions actives/récentes.

## Lancer des sous-agents

`sessions_spawn` crée par défaut une session isolée pour une tâche en arrière-plan.
Il est toujours non bloquant -- il renvoie immédiatement un `runId` et une
`childSessionKey`. Les exécutions natives de sous-agents reçoivent la tâche déléguée
dans le premier message visible `[Subagent Task]` de la session enfant, tandis que
le prompt système ne transporte que les règles runtime de sous-agent et le contexte
de routage.

Options principales :

- `runtime: "subagent"` (par défaut) ou `"acp"` pour les agents de harnais externes.
- remplacements `model` et `thinking` pour la session enfant.
- `thread: true` pour lier le lancement à un fil de chat (Discord, Slack, etc.).
- `sandbox: "require"` pour imposer le sandboxing à l'enfant.
- `context: "fork"` pour les sous-agents natifs quand l'enfant a besoin de la transcription
  actuelle du demandeur ; omettez-le ou utilisez `context: "isolated"` pour un enfant propre.
  Les sous-agents natifs liés à un fil utilisent par défaut `context: "fork"` sauf si
  `threadBindings.defaultSpawnContext` indique autre chose.

Les sous-agents feuilles par défaut ne reçoivent pas d'outils de session. Quand
`maxSpawnDepth >= 2`, les sous-agents orchestrateurs de profondeur 1 reçoivent en plus
`sessions_spawn`, `subagents`, `sessions_list` et `sessions_history` afin de pouvoir
gérer leurs propres enfants. Les exécutions feuilles ne reçoivent toujours pas
d'outils d'orchestration récursive.

Après la complétion, une étape d'annonce publie le résultat dans le canal du demandeur.
La livraison de complétion préserve le routage de fil/sujet lié lorsqu'il est disponible,
et si l'origine de complétion n'identifie qu'un canal, OpenClaw peut tout de même
réutiliser la route stockée de la session du demandeur (`lastChannel` / `lastTo`)
pour la livraison directe.

Pour le comportement propre à ACP, consultez [Agents ACP](/fr/tools/acp-agents).

## Visibilité

Les outils de session sont limités afin de restreindre ce que l'agent peut voir :

| Niveau  | Périmètre                                |
| ------- | ---------------------------------------- |
| `self`  | Uniquement la session actuelle           |
| `tree`  | Session actuelle + sous-agents lancés    |
| `agent` | Toutes les sessions pour cet agent       |
| `all`   | Toutes les sessions (inter-agents si configuré) |

La valeur par défaut est `tree`. Les sessions sandboxées sont limitées à `tree`
quelle que soit la configuration.

## Pour aller plus loin

- [Gestion des sessions](/fr/concepts/session) -- routage, cycle de vie, maintenance
- [Agents ACP](/fr/tools/acp-agents) -- lancement de harnais externes
- [Multi-agent](/fr/concepts/multi-agent) -- architecture multi-agent
- [Configuration du Gateway](/fr/gateway/configuration) -- réglages de configuration des outils de session

## Associé

- [Gestion des sessions](/fr/concepts/session)
- [Élagage des sessions](/fr/concepts/session-pruning)
