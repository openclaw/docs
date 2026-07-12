---
read_when:
    - Vous souhaitez comprendre de quels outils de session l’agent dispose
    - Vous souhaitez configurer l’accès entre sessions ou la création de sous-agents
    - Vous souhaitez vérifier l’état des sous-agents lancés
summary: Outils d’agent pour l’état intersession, le rappel, la messagerie et l’orchestration des sous-agents
title: Outils de session
x-i18n:
    generated_at: "2026-07-12T15:18:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6b584912c012b632d001e7f77dc704b8b11ab2e897ed62238675026078039819
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw fournit aux agents des outils leur permettant de travailler entre plusieurs sessions, d’inspecter l’état et d’orchestrer des sous-agents.

## Outils disponibles

| Outil               | Fonction                                                                    |
| ------------------- | --------------------------------------------------------------------------- |
| `sessions_list`     | Répertorie les sessions avec des filtres facultatifs (type, libellé, agent, archive, aperçu) |
| `sessions_history`  | Lit la transcription d’une session spécifique                               |
| `sessions_send`     | Envoie un message à une autre session et attend éventuellement               |
| `sessions_spawn`    | Lance une session de sous-agent isolée pour un travail en arrière-plan       |
| `sessions_yield`    | Termine le tour actuel et attend les résultats ultérieurs des sous-agents    |
| `subagents`         | Répertorie l’état des sous-agents lancés pour cette session                  |
| `session_status`    | Affiche une fiche de type `/status` et définit éventuellement un remplacement de modèle propre à la session |

Ces outils restent soumis au profil d’outils actif et à la politique d’autorisation ou de refus. `tools.profile: "coding"` inclut l’ensemble complet d’orchestration des sessions, notamment `sessions_spawn`, `sessions_yield` et `subagents`. `tools.profile: "messaging"` inclut les outils de messagerie entre sessions (`sessions_list`, `sessions_history`, `sessions_send`, `session_status`), mais pas le lancement de sous-agents. Pour conserver un profil de messagerie tout en autorisant la délégation native, ajoutez :

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

Les politiques de groupe, de fournisseur, de bac à sable et propres à chaque agent peuvent encore supprimer ces outils après l’étape du profil. Utilisez `/tools` depuis la session concernée pour inspecter la liste effective des outils.

## Répertorier et lire les sessions

`sessions_list` renvoie les sessions avec leur clé, leur agentId, leur type, leur canal, leur modèle, leur nombre de tokens et leurs horodatages. Filtrez selon `kinds` (tableau ; valeurs acceptées : `main`, `group`, `cron`, `hook`, `node`, `other`), le `label` exact, l’`agentId` exact, le texte `search` ou la récence (`activeMinutes`). Les sessions actives sont renvoyées par défaut ; transmettez `archived: true` pour inspecter les sessions archivées à la place. Les lignes incluent l’état `pinned` et `archived`. Définissez `includeDerivedTitles`, `includeLastMessage` ou `messageLimit` (plafonné à 20) lorsque vous avez besoin d’un tri de type boîte de réception : un titre dérivé limité par la visibilité, un extrait d’aperçu du dernier message ou un nombre limité de messages récents sur chaque ligne. Les titres dérivés et les aperçus sont produits uniquement pour les sessions que l’appelant peut déjà voir conformément à la politique de visibilité configurée pour les outils de session ; les sessions sans rapport restent donc masquées. Lorsque la visibilité est restreinte, `sessions_list` renvoie des métadonnées `visibility` facultatives indiquant le mode effectif et un avertissement précisant que la portée des résultats peut être limitée.

`sessions_history` récupère la transcription de la conversation d’une session spécifique. Par défaut, les résultats des outils sont exclus ; transmettez `includeTools: true` pour les afficher. Utilisez `limit` pour obtenir la portion récente limitée. Transmettez `offset: 0` lorsque vous avez besoin des métadonnées de pagination, puis transmettez les valeurs `nextOffset` renvoyées pour parcourir à rebours les anciennes fenêtres de transcription OpenClaw sans lire les fichiers de transcription bruts. Les pages avec un décalage explicite ne fusionnent pas les importations de secours provenant de CLI externes ; utilisez la vue par défaut de la portion la plus récente (sans `offset`) lorsque vous avez besoin de cet historique d’affichage fusionné.

La vue renvoyée est intentionnellement limitée et filtrée pour des raisons de sécurité :

- le texte de l’assistant est normalisé avant le rappel :
  - les balises de réflexion sont supprimées
  - les blocs d’échafaudage `<relevant-memories>` / `<relevant_memories>` sont supprimés
  - les blocs de charge utile XML d’appel d’outil en texte brut tels que `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` et `<function_calls>...</function_calls>` sont supprimés, y compris les charges utiles tronquées qui ne se ferment jamais correctement
  - les échafaudages d’appels et de résultats d’outils rétrogradés tels que `[Tool Call: ...]`, `[Tool Result ...]` et `[Historical context ...]` sont supprimés
  - les tokens de contrôle de modèle divulgués tels que `<|assistant|>`, les autres tokens ASCII `<|...|>` et les variantes pleine chasse `<｜...｜>` sont supprimés
  - le XML d’appel d’outil MiniMax mal formé tel que `<invoke ...>` / `</minimax:tool_call>` est supprimé
- le texte ressemblant à des identifiants ou à des tokens est masqué avant d’être renvoyé
- les longs blocs de texte sont tronqués
- les historiques très volumineux peuvent omettre les lignes les plus anciennes ou remplacer une ligne surdimensionnée par `[sessions_history omitted: message too large]`
- l’outil fournit des indicateurs récapitulatifs tels que `truncated`, `droppedMessages`, `contentTruncated`, `contentRedacted`, `bytes` ainsi que des métadonnées de pagination

Les deux outils acceptent soit une **clé de session** (comme `"main"`), soit un **ID de session** provenant d’un précédent appel de liste.

Si vous avez besoin de la transcription brute exacte, inspectez les lignes de transcription SQLite correspondant à la portée au lieu de considérer `sessions_history` comme un export non filtré.

## Envoyer des messages entre sessions

`sessions_send` transmet un message à une autre session et attend éventuellement la réponse :

- **Envoi sans attente :** définissez `timeoutSeconds: 0` pour mettre le message en file d’attente et renvoyer immédiatement.
- **Attente d’une réponse :** définissez un délai d’expiration et obtenez la réponse directement.

Les sessions de discussion limitées à un fil, telles que les clés se terminant par `:thread:<id>`, ne sont pas des cibles `sessions_send` valides. Utilisez la clé de la session du canal parent pour la coordination entre agents afin que les messages acheminés par les outils n’apparaissent pas dans un fil actif destiné aux utilisateurs.

Les messages et les réponses de suivi A2A sont signalés comme des données intersessions dans le prompt de réception (`[Inter-session message ... isUser=false]`) et dans la provenance de la transcription. L’agent destinataire doit les traiter comme des données acheminées par un outil, et non comme une instruction rédigée directement par l’utilisateur final.

Une fois que la cible a répondu, OpenClaw peut exécuter une **boucle de réponse** dans laquelle les agents alternent les messages (jusqu’à `session.agentToAgent.maxPingPongTurns`, plage de 0 à 20, valeur par défaut de 5). L’agent cible peut répondre `REPLY_SKIP` pour arrêter la boucle plus tôt.

## Aides relatives à l’état et à l’orchestration

`session_status` est l’outil léger équivalent à `/status` pour la session actuelle ou une autre session visible. Il indique l’utilisation, l’heure, l’état du modèle et de l’environnement d’exécution ainsi que le contexte lié aux tâches en arrière-plan, le cas échéant. Comme `/status`, il peut compléter les compteurs de tokens ou de cache incomplets à partir de la dernière entrée d’utilisation de la transcription, et `model=default` efface un remplacement propre à la session. Utilisez `sessionKey="current"` pour la session actuelle de l’appelant ; les libellés visibles du client tels que `openclaw-tui` ne sont pas des clés de session.

Lorsque les métadonnées de routage sont disponibles, `session_status` inclut également un bloc JSON visible `Route context` et les champs structurés correspondants dans `details`. Ces champs distinguent la clé de session de la route qui traite actuellement l’exécution en direct :

- `origin` indique l’endroit où la session a été créée, ou le fournisseur déduit du préfixe d’une clé de session livrable lorsque les anciens états ne comportent pas de métadonnées d’origine enregistrées.
- `active` désigne la route de l’exécution en direct actuelle. Elle n’est indiquée que pour la session en direct ou actuelle en cours de traitement.
- `deliveryContext` désigne la route de livraison persistante stockée dans la session, qu’OpenClaw peut réutiliser pour une livraison ultérieure même lorsque la surface active diffère.

## Modifications de l’état des sessions

OpenClaw conserve un journal de signaux au mieux pour certaines modifications de l’état des sessions : messages humains directs aux sessions enfants, achèvement ou échec de l’exécution d’un enfant, création d’un enfant, changements d’objectif et Compaction. Les exécutions enfants annulées ou arrivées à expiration sont enregistrées comme des échecs, avec le résultat précis (`cancelled`, `timeout` ou `error`) conservé dans la charge utile de l’événement. Le journal contient des métadonnées et des résumés d’une ligne, jamais le contenu des messages. Son `stateVersion` correspond à la tête du journal de signaux de la session, et non à une version transactionnelle de capture des changements de données ; la mutation du stockage de session et l’ajout du signal utilisent des stockages distincts, si bien qu’un échec d’ajout est journalisé sans faire échouer le tour d’origine.

`sessions_list` inclut `stateVersion` dans les lignes comportant des modifications journalisées. `session_status` renvoie toujours `stateVersion` dans les détails structurés. Transmettez `changesSince: <previousStateVersion>` pour récupérer jusqu’à 200 événements conservés après cette version ; cette lecture n’acquitte pas et ne fait pas avancer les curseurs de notification du parent. Un résultat `historyGap: true` signifie que la version demandée est antérieure à l’historique conservé ; actualisez donc l’ensemble de l’état de la session au lieu de considérer la réponse comme un delta exact.

Lorsqu’un autre acteur envoie un tour humain direct à un enfant surveillé ou modifie son objectif, le parent reçoit une notification système lui demandant d’appeler `session_status` avec la dernière version qu’il a vue. Les parents de la session principale sont réveillés de manière proactive. Les parents de sous-agents imbriqués reçoivent la notification lors de leur tour suivant, car le routage Heartbeat ne peut pas cibler directement leur file d’attente. Les annonces d’achèvement restent responsables de la livraison ordinaire de l’achèvement des exécutions enfants.

L’historique est limité à 30 jours et 50 000 lignes, tandis que les têtes propres à chaque session restent monotones après l’élagage. La livraison des notifications utilise la file d’événements système en mémoire du Gateway et suppose qu’un seul processus Gateway gère la livraison pour la base de données d’état partagée. Plusieurs Gateways partagent toujours le journal durable et la surface de rapprochement `changesSince`, mais la v1 ne transmet pas les notifications entre les processus. Les notifications aux parents exigent une clé de session parent qualifiée par l’agent ; avec `session.scope="global"`, la clé partagée `global` est ambiguë entre les agents. Ces parents disposent donc du journal durable et de `changesSince`, mais ne reçoivent aucune notification proactive dans la v1.

`sessions_yield` termine intentionnellement le tour actuel afin que le message suivant puisse être l’événement de suivi que vous attendez. Utilisez-le après avoir lancé des sous-agents lorsque vous souhaitez que les résultats d’achèvement arrivent comme message suivant, au lieu de créer des boucles d’interrogation.

`subagents` est l’aide à la visibilité pour les sous-agents OpenClaw déjà lancés. Il prend en charge `action: "list"` pour inspecter les exécutions actives ou récentes.

## Lancer des sous-agents

`sessions_spawn` crée par défaut une session isolée pour une tâche en arrière-plan. Il est toujours non bloquant ; il renvoie immédiatement un `runId` et une `childSessionKey`. Les exécutions de sous-agents natifs reçoivent la tâche déléguée dans le premier message visible `[Subagent Task]` de la session enfant, tandis que le prompt système contient uniquement les règles d’exécution du sous-agent et le contexte de routage.

Options principales :

- `runtime: "subagent"` (valeur par défaut) ou `"acp"` pour les agents d’environnements externes.
- les remplacements `model` et `thinking` pour la session enfant.
- `thread: true` pour lier le lancement à un fil de discussion (Discord, Slack, etc.).
- `sandbox: "require"` pour imposer l’utilisation d’un bac à sable à l’enfant.
- `context: "fork"` pour les sous-agents natifs lorsque l’enfant a besoin de la transcription actuelle du demandeur ; omettez cette option ou utilisez `context: "isolated"` pour un enfant sans contexte préalable. `context: "fork"` est uniquement valide avec `runtime: "subagent"`. Les sous-agents natifs liés à un fil utilisent par défaut `context: "fork"`, sauf indication contraire de `threadBindings.defaultSpawnContext`.

Par défaut, les sous-agents feuilles ne disposent pas des outils de session. Lorsque `maxSpawnDepth >= 2`, les sous-agents orchestrateurs de profondeur 1 reçoivent également `sessions_spawn`, `subagents`, `sessions_list` et `sessions_history` afin de pouvoir gérer leurs propres enfants. Les exécutions feuilles ne disposent toujours pas des outils d’orchestration récursive.

Après l’achèvement, une étape d’annonce publie le résultat dans le canal du demandeur. La livraison de l’achèvement conserve le routage du fil ou du sujet lié lorsqu’il est disponible. Si l’origine de l’achèvement identifie uniquement un canal, OpenClaw peut tout de même réutiliser la route enregistrée de la session du demandeur (`lastChannel` / `lastTo`) pour une livraison directe.

Pour le comportement propre à ACP, consultez [Agents ACP](/fr/tools/acp-agents).

## Visibilité

La portée des outils de session limite ce que l’agent peut voir :

| Niveau  | Portée                                           |
| ------- | ------------------------------------------------ |
| `self`  | Uniquement la session actuelle                   |
| `tree`  | Session actuelle et sous-agents lancés           |
| `agent` | Toutes les sessions de cet agent                 |
| `all`   | Toutes les sessions (entre agents si configuré)  |

La valeur par défaut est `tree`. Les sessions placées dans un bac à sable sont limitées à `tree`, quelle que soit la configuration.

## Pour aller plus loin

- [Gestion des sessions](/fr/concepts/session) : routage, cycle de vie, maintenance
- [Sous-agents](/fr/tools/subagents) : cycle de vie et livraison des sessions enfants
- [Agents ACP](/fr/tools/acp-agents) : lancement depuis un environnement externe
- [Multi-agent](/fr/concepts/multi-agent) : architecture multi-agent
- [Configuration du Gateway](/fr/gateway/configuration) : paramètres de configuration des outils de session

## Voir aussi

- [Gestion des sessions](/fr/concepts/session)
- [Élagage des sessions](/fr/concepts/session-pruning)
