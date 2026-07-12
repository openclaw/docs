---
read_when:
    - Vous souhaitez comprendre de quels outils de session dispose l’agent
    - Vous souhaitez configurer l’accès entre sessions ou la création de sous-agents
    - Vous souhaitez consulter l’état des sous-agents lancés
summary: Outils d’agent pour l’état intersession, le rappel, la messagerie et l’orchestration des sous-agents
title: Outils de session
x-i18n:
    generated_at: "2026-07-12T21:41:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fb0827e2eff6e53d3e7ef6f7d7f0497d8b431fcb23cb4b54c5851229086423cc
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw fournit aux agents des outils pour travailler entre les sessions, inspecter leur état et orchestrer des sous-agents.

## Outils disponibles

| Outil              | Fonction                                                                    |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | Répertorie les sessions avec des filtres facultatifs (type, libellé, agent, archive, aperçu) |
| `sessions_history` | Lit la transcription d’une session spécifique                               |
| `sessions_send`    | Envoie un message à une autre session et attend éventuellement               |
| `sessions_spawn`   | Lance une session de sous-agent isolée pour un travail en arrière-plan       |
| `sessions_yield`   | Termine le tour actuel et attend les résultats ultérieurs des sous-agents    |
| `subagents`        | Répertorie l’état des sous-agents lancés pour cette session                  |
| `session_status`   | Affiche une fiche de type `/status` et définit éventuellement un remplacement de modèle propre à la session |

Ces outils restent soumis au profil d’outils actif et à la politique d’autorisation/refus. `tools.profile: "coding"` comprend l’ensemble complet d’orchestration des sessions, notamment `sessions_spawn`, `sessions_yield` et `subagents`. `tools.profile: "messaging"` comprend les outils de messagerie entre sessions (`sessions_list`, `sessions_history`, `sessions_send`, `session_status`), mais pas le lancement de sous-agents. Pour conserver un profil de messagerie tout en autorisant la délégation native, ajoutez :

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

Les politiques de groupe, de fournisseur, de bac à sable et propres à chaque agent peuvent encore retirer ces outils après l’étape du profil. Utilisez `/tools` depuis la session concernée pour inspecter la liste effective des outils.

## Répertorier et lire les sessions

`sessions_list` renvoie les sessions avec leur clé, leur agentId, leur type, leur canal, leur modèle, leurs nombres de jetons et leurs horodatages. Filtrez par `kinds` (tableau ; valeurs acceptées : `main`, `group`, `cron`, `hook`, `node`, `other`), par `label` exact, par `agentId` exact, par texte `search` ou par récence (`activeMinutes`). Les sessions actives sont renvoyées par défaut ; transmettez `archived: true` pour inspecter plutôt les sessions archivées. Les lignes comprennent les états `pinned` et `archived`. Définissez `includeDerivedTitles`, `includeLastMessage` ou `messageLimit` (plafonné à 20) lorsque vous avez besoin d’un tri de type boîte de réception : un titre dérivé limité au périmètre de visibilité, un extrait d’aperçu du dernier message ou un nombre limité de messages récents pour chaque ligne. Les titres dérivés et les aperçus sont produits uniquement pour les sessions que l’appelant peut déjà voir conformément à la politique de visibilité configurée pour les outils de session ; les sessions sans rapport restent donc masquées. Lorsque la visibilité est restreinte, `sessions_list` renvoie des métadonnées `visibility` facultatives indiquant le mode effectif et un avertissement signalant que la portée des résultats peut être limitée.

`sessions_history` récupère la transcription de la conversation d’une session spécifique. Par défaut, les résultats des outils sont exclus ; transmettez `includeTools: true` pour les afficher. Utilisez `limit` pour obtenir la partie finale la plus récente dans une limite donnée. Transmettez `offset: 0` lorsque vous avez besoin des métadonnées de pagination, puis transmettez les valeurs `nextOffset` renvoyées pour parcourir à rebours les anciennes fenêtres de transcription OpenClaw sans lire les fichiers de transcription bruts. Les pages avec un décalage explicite ne fusionnent pas les importations de secours provenant d’une CLI externe ; utilisez la vue par défaut de la partie finale la plus récente (sans `offset`) lorsque vous avez besoin de cet historique d’affichage fusionné.

La vue renvoyée est volontairement limitée et filtrée pour des raisons de sécurité :

- le texte de l’assistant est normalisé avant son rappel :
  - les balises de réflexion sont supprimées
  - les blocs d’échafaudage `<relevant-memories>` / `<relevant_memories>` sont supprimés
  - les blocs de charge utile XML d’appels d’outils en texte brut tels que `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` et `<function_calls>...</function_calls>` sont supprimés, y compris les charges utiles tronquées qui ne se ferment jamais correctement
  - les échafaudages rétrogradés d’appels/résultats d’outils tels que `[Tool Call: ...]`, `[Tool Result ...]` et `[Historical context ...]` sont supprimés
  - les jetons de contrôle du modèle ayant fuité, tels que `<|assistant|>`, les autres jetons ASCII `<|...|>` et les variantes pleine chasse `<｜...｜>`, sont supprimés
  - le XML mal formé des appels d’outils MiniMax, tel que `<invoke ...>` / `</minimax:tool_call>`, est supprimé
- le texte ressemblant à des identifiants ou à des jetons est masqué avant d’être renvoyé
- les longs blocs de texte sont tronqués
- les historiques très volumineux peuvent omettre des lignes anciennes ou remplacer une ligne surdimensionnée par `[sessions_history omitted: message too large]`
- l’outil fournit des indicateurs récapitulatifs tels que `truncated`, `droppedMessages`, `contentTruncated`, `contentRedacted`, `bytes`, ainsi que des métadonnées de pagination

Les deux outils acceptent soit une **clé de session** (comme `"main"`), soit un **ID de session** provenant d’un appel de liste précédent.

Si vous avez besoin de la transcription brute exacte, inspectez les lignes de transcription SQLite du périmètre concerné au lieu de considérer `sessions_history` comme un export non filtré.

## Envoyer des messages entre les sessions

`sessions_send` transmet un message à une autre session et attend éventuellement la réponse :

- **Envoi sans attente :** définissez `timeoutSeconds: 0` pour placer le message dans la file d’attente et revenir immédiatement.
- **Attente de la réponse :** définissez un délai d’expiration et obtenez la réponse directement.

Les sessions de discussion limitées à un fil, telles que les clés se terminant par `:thread:<id>`, ne sont pas des cibles `sessions_send` valides. Utilisez la clé de session du canal parent pour la coordination entre agents afin que les messages acheminés par l’outil n’apparaissent pas dans un fil actif destiné aux utilisateurs.

Les messages et les réponses de suivi A2A sont marqués comme des données intersessions dans l’invite de réception (`[Inter-session message ... isUser=false]`) et dans la provenance de la transcription. L’agent récepteur doit les traiter comme des données acheminées par un outil, et non comme une instruction directement rédigée par l’utilisateur final.

Après la réponse de la cible, OpenClaw peut exécuter une **boucle de réponses réciproques** dans laquelle les agents alternent leurs messages (jusqu’à `session.agentToAgent.maxPingPongTurns`, plage de 0 à 20, valeur par défaut 5). L’agent cible peut répondre `REPLY_SKIP` pour arrêter la boucle plus tôt.

Transmettez `watch: true` pour enregistrer également l’expéditeur en tant qu’observateur des changements d’état de la cible : lorsqu’un autre acteur envoie ultérieurement à la cible un message humain direct ou modifie son objectif, l’expéditeur reçoit une notification système renvoyant vers `changesSince` de `session_status`. L’enregistrement intervient après un envoi réussi, cible la session qui a effectivement reçu le message et commence à sa version d’état actuelle ; seules les modifications ultérieures produisent donc des notifications. Le résultat indique `watched: true` lorsque l’enregistrement a réussi. Consultez [Connaissance de l’état des sessions](/concepts/session-state).

## Assistants d’état et d’orchestration

`session_status` est l’outil léger équivalent à `/status` pour la session actuelle ou une autre session visible. Il indique l’utilisation, l’heure, l’état du modèle et de l’environnement d’exécution, ainsi que le contexte des tâches d’arrière-plan liées lorsqu’il existe. Comme `/status`, il peut compléter les compteurs de jetons et de cache incomplets à partir de la dernière entrée d’utilisation de la transcription, et `model=default` efface un remplacement propre à la session. Utilisez `sessionKey="current"` pour la session actuelle de l’appelant ; les libellés clients visibles tels que `openclaw-tui` ne sont pas des clés de session.

Lorsque les métadonnées de routage sont disponibles, `session_status` comprend également un bloc JSON `Route context` visible et les champs structurés correspondants dans `details`. Ces champs permettent de distinguer la clé de session de la route qui traite actuellement l’exécution en direct :

- `origin` indique l’endroit où la session a été créée, ou le fournisseur déduit du préfixe d’une clé de session pouvant recevoir des livraisons lorsque les anciens états ne comportent pas de métadonnées d’origine enregistrées.
- `active` désigne la route de l’exécution en direct actuelle. Elle n’est indiquée que pour la session en direct ou actuelle en cours de traitement.
- `deliveryContext` désigne la route de livraison persistante enregistrée dans la session, qu’OpenClaw peut réutiliser pour une livraison ultérieure même lorsque l’interface active diffère.

## Modifications de l’état des sessions

OpenClaw conserve un journal durable des signaux correspondant aux modifications importantes de l’état des sessions (messages humains directs envoyés aux sessions observées, résultats des exécutions enfants, modifications des objectifs, Compaction). Les lignes de `sessions_list` et `session_status` exposent le `stateVersion` de la session, et `session_status` accepte `changesSince: <version>` pour renvoyer les événements typés postérieurs à cette version, avec un signalement exact par `historyGap` lorsque la version demandée est antérieure à l’historique conservé. Les observateurs — les parents de lancement automatiquement, et ceux enregistrés explicitement par `sessions_send watch: true` — reçoivent une notification unique et regroupée d’état obsolète lorsqu’un autre acteur modifie une session observée.

Consultez [Connaissance de l’état des sessions](/concepts/session-state) pour le modèle complet : types d’événements, enregistrement des observateurs, protocole de notification anti-spam, flux de rapprochement et limites actuelles.

`sessions_yield` termine volontairement le tour actuel afin que le message suivant puisse être l’événement de suivi que vous attendez. Utilisez-le après avoir lancé des sous-agents lorsque vous souhaitez que les résultats d’achèvement arrivent comme message suivant plutôt que de construire des boucles d’interrogation.

`subagents` est l’assistant de visibilité pour les sous-agents OpenClaw déjà lancés. Il prend en charge `action: "list"` pour inspecter les exécutions actives ou récentes.

## Lancer des sous-agents

`sessions_spawn` crée par défaut une session isolée pour une tâche en arrière-plan. Il est toujours non bloquant ; il renvoie immédiatement un `runId` et une `childSessionKey`. Les exécutions natives de sous-agents reçoivent la tâche déléguée dans le premier message `[Subagent Task]` visible de la session enfant, tandis que l’invite système ne contient que les règles d’exécution des sous-agents et le contexte de routage.

Options principales :

- `runtime: "subagent"` (valeur par défaut) ou `"acp"` pour les agents de harnais externes.
- Remplacements `model` et `thinking` pour la session enfant.
- `thread: true` pour associer le lancement à un fil de discussion (Discord, Slack, etc.).
- `sandbox: "require"` pour imposer l’utilisation d’un bac à sable à l’enfant.
- `context: "fork"` pour les sous-agents natifs lorsque l’enfant a besoin de la transcription actuelle du demandeur ; omettez cette option ou utilisez `context: "isolated"` pour obtenir un enfant sans contexte. `context: "fork"` n’est valide qu’avec `runtime: "subagent"`. Les sous-agents natifs associés à un fil utilisent par défaut `context: "fork"`, sauf indication contraire de `threadBindings.defaultSpawnContext`.

Les sous-agents feuilles par défaut ne reçoivent pas les outils de session. Lorsque `maxSpawnDepth >= 2`, les sous-agents orchestrateurs de profondeur 1 reçoivent en plus `sessions_spawn`, `subagents`, `sessions_list` et `sessions_history` afin de pouvoir gérer leurs propres enfants. Les exécutions feuilles ne reçoivent toujours pas d’outils d’orchestration récursive.

Après l’achèvement, une étape d’annonce publie le résultat sur le canal du demandeur. La livraison de l’achèvement conserve le routage du fil/sujet associé lorsqu’il est disponible et, si l’origine de l’achèvement n’identifie qu’un canal, OpenClaw peut tout de même réutiliser la route enregistrée de la session du demandeur (`lastChannel` / `lastTo`) pour une livraison directe.

Pour le comportement propre à ACP, consultez [Agents ACP](/fr/tools/acp-agents).

## Visibilité

La portée des outils de session est limitée afin de contrôler ce que l’agent peut voir :

| Niveau  | Portée                                   |
| ------- | ---------------------------------------- |
| `self`  | Uniquement la session actuelle           |
| `tree`  | Session actuelle + sous-agents lancés    |
| `agent` | Toutes les sessions de cet agent         |
| `all`   | Toutes les sessions (entre agents si configuré) |

La valeur par défaut est `tree`. Les sessions placées dans un bac à sable sont limitées à `tree`, quelle que soit la configuration.

## Pour aller plus loin

- [Gestion des sessions](/fr/concepts/session) : routage, cycle de vie, maintenance
- [Sous-agents](/fr/tools/subagents) : cycle de vie et livraison des sessions enfants
- [Agents ACP](/fr/tools/acp-agents) : lancement de harnais externes
- [Multi-agent](/fr/concepts/multi-agent) : architecture multi-agent
- [Configuration du Gateway](/fr/gateway/configuration) : options de configuration des outils de session

## Voir aussi

- [Gestion des sessions](/fr/concepts/session)
- [Élagage des sessions](/fr/concepts/session-pruning)
