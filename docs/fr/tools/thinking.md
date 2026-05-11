---
read_when:
    - Ajustement de l’analyse ou des valeurs par défaut des directives de raisonnement, de mode rapide ou de verbosité
summary: Syntaxe des directives pour /think, /fast, /verbose, /trace et la visibilité du raisonnement
title: Niveaux de réflexion
x-i18n:
    generated_at: "2026-05-11T21:00:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: c75e2360a260aaf4571f2da6c7519fb4987e4c8c7947e3dc37f94a0ad260ad55
    source_path: tools/thinking.md
    workflow: 16
---

## Ce que cela fait

- Directive en ligne dans tout corps entrant : `/t <level>`, `/think:<level>` ou `/thinking <level>`.
- Niveaux (alias) : `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → "think"
  - low → "think hard"
  - medium → "think harder"
  - high → "ultrathink" (budget maximal)
  - xhigh → "ultrathink+" (modèles GPT-5.2+ et Codex, ainsi que l’effort Anthropic Claude Opus 4.7)
  - adaptive → réflexion adaptative gérée par le fournisseur (prise en charge pour Claude 4.6 sur Anthropic/Bedrock, Anthropic Claude Opus 4.7 et la réflexion dynamique Google Gemini)
  - max → raisonnement maximal du fournisseur (Anthropic Claude Opus 4.7 ; Ollama l’associe à son effort `think` natif le plus élevé)
  - `x-high`, `x_high`, `extra-high`, `extra high` et `extra_high` correspondent à `xhigh`.
  - `highest` correspond à `high`.
- Notes sur les fournisseurs :
  - Les menus et sélecteurs de réflexion sont pilotés par le profil fournisseur. Les plugins fournisseurs déclarent l’ensemble exact de niveaux pour le modèle sélectionné, y compris des libellés tels que le binaire `on`.
  - `adaptive`, `xhigh` et `max` ne sont annoncés que pour les profils fournisseur/modèle qui les prennent en charge. Les directives saisies pour des niveaux non pris en charge sont rejetées avec les options valides de ce modèle.
  - Les niveaux non pris en charge déjà stockés sont réassociés selon le rang du profil fournisseur. `adaptive` revient à `medium` sur les modèles non adaptatifs, tandis que `xhigh` et `max` reviennent au plus grand niveau non `off` pris en charge pour le modèle sélectionné.
  - Les modèles Anthropic Claude 4.6 utilisent par défaut `adaptive` lorsqu’aucun niveau de réflexion explicite n’est défini.
  - Anthropic Claude Opus 4.7 n’utilise pas la réflexion adaptative par défaut. La valeur par défaut d’effort de son API reste contrôlée par le fournisseur, sauf si vous définissez explicitement un niveau de réflexion.
  - Anthropic Claude Opus 4.7 associe `/think xhigh` à la réflexion adaptative plus `output_config.effort: "xhigh"`, car `/think` est une directive de réflexion et `xhigh` est le paramètre d’effort d’Opus 4.7.
  - Anthropic Claude Opus 4.7 expose aussi `/think max` ; il correspond au même chemin d’effort maximal contrôlé par le fournisseur.
  - Les modèles DeepSeek V4 directs exposent `/think xhigh|max` ; les deux correspondent à `reasoning_effort: "max"` de DeepSeek, tandis que les niveaux non `off` inférieurs correspondent à `high`.
  - Les modèles DeepSeek V4 acheminés par OpenRouter exposent `/think xhigh` et envoient les valeurs `reasoning_effort` prises en charge par OpenRouter. Les remplacements `max` stockés reviennent à `xhigh`.
  - Les modèles Ollama capables de réfléchir exposent `/think low|medium|high|max` ; `max` correspond à `think: "high"` natif, car l’API native d’Ollama accepte les chaînes d’effort `low`, `medium` et `high`.
  - Les modèles OpenAI GPT mappent `/think` via la prise en charge d’effort propre au modèle dans l’API Responses. `/think off` envoie `reasoning.effort: "none"` uniquement lorsque le modèle cible le prend en charge ; sinon OpenClaw omet la charge utile de raisonnement désactivée au lieu d’envoyer une valeur non prise en charge.
  - Les entrées de catalogue personnalisées compatibles OpenAI peuvent activer `/think xhigh` en définissant `models.providers.<provider>.models[].compat.supportedReasoningEfforts` pour inclure `"xhigh"`. Cela utilise les mêmes métadonnées de compatibilité qui mappent les charges utiles de raisonnement OpenAI sortantes, afin que les menus, la validation de session, la CLI de l’agent et `llm-task` soient cohérents avec le comportement du transport.
  - Les références OpenRouter Hunter Alpha configurées et obsolètes ignorent l’injection de raisonnement par proxy, car cette route retirée pouvait renvoyer le texte de réponse finale via les champs de raisonnement.
  - Google Gemini associe `/think adaptive` à la réflexion dynamique contrôlée par le fournisseur de Gemini. Les requêtes Gemini 3 omettent un `thinkingLevel` fixe, tandis que les requêtes Gemini 2.5 envoient `thinkingBudget: -1` ; les niveaux fixes correspondent toujours au `thinkingLevel` ou budget Gemini le plus proche pour cette famille de modèles.
  - MiniMax (`minimax/*`) sur le chemin de streaming compatible Anthropic utilise par défaut `thinking: { type: "disabled" }`, sauf si vous définissez explicitement la réflexion dans les paramètres du modèle ou de la requête. Cela évite les deltas `reasoning_content` divulgués par le format de flux Anthropic non natif de MiniMax.
  - Z.AI (`zai/*`) ne prend en charge que la réflexion binaire (`on`/`off`). Tout niveau non `off` est traité comme `on` (associé à `low`).
  - Moonshot (`moonshot/*`) associe `/think off` à `thinking: { type: "disabled" }` et tout niveau non `off` à `thinking: { type: "enabled" }`. Lorsque la réflexion est activée, Moonshot n’accepte que `tool_choice` `auto|none` ; OpenClaw normalise les valeurs incompatibles en `auto`.

## Ordre de résolution

1. Directive en ligne dans le message (s’applique uniquement à ce message).
2. Remplacement de session (défini en envoyant un message ne contenant que la directive).
3. Valeur par défaut par agent (`agents.list[].thinkingDefault` dans la configuration).
4. Valeur par défaut globale (`agents.defaults.thinkingDefault` dans la configuration).
5. Repli : valeur par défaut déclarée par le fournisseur lorsqu’elle est disponible ; sinon, les modèles capables de raisonnement se résolvent en `medium` ou au niveau non `off` pris en charge le plus proche pour ce modèle, et les modèles sans raisonnement restent sur `off`.

## Définir une valeur par défaut de session

- Envoyez un message qui contient **uniquement** la directive (espaces autorisés), par exemple `/think:medium` ou `/t high`.
- Cela reste actif pour la session actuelle (par expéditeur par défaut). Utilisez `/think default` pour effacer le remplacement de session et hériter de la valeur par défaut configurée/du fournisseur ; les alias incluent `inherit`, `clear`, `reset` et `unpin`.
- `/think off` stocke un remplacement explicite sur off. Cela désactive la réflexion jusqu’à ce que vous modifiiez ou effaciez le remplacement de session.
- Une réponse de confirmation est envoyée (`Thinking level set to high.` / `Thinking disabled.`). Si le niveau est invalide (par exemple `/thinking big`), la commande est rejetée avec une indication et l’état de session reste inchangé.
- Envoyez `/think` (ou `/think:`) sans argument pour voir le niveau de réflexion actuel.

## Application par agent

- **Pi intégré** : le niveau résolu est transmis au runtime de l’agent Pi intégré au processus.
- **Backend CLI Claude** : les niveaux non off sont transmis à Claude Code sous forme de `--effort` lors de l’utilisation de `claude-cli` ; voir [backends CLI](/fr/gateway/cli-backends).

## Mode rapide (/fast)

- Niveaux : `on|off|default`.
- Un message ne contenant que la directive active ou désactive un remplacement de session du mode rapide et répond `Fast mode enabled.` / `Fast mode disabled.`. Utilisez `/fast default` pour effacer le remplacement de session et hériter de la valeur par défaut configurée ; les alias incluent `inherit`, `clear`, `reset` et `unpin`.
- Envoyez `/fast` (ou `/fast status`) sans mode pour voir l’état effectif actuel du mode rapide.
- OpenClaw résout le mode rapide dans cet ordre :
  1. Remplacement `/fast on|off` en ligne/ne contenant que la directive (`/fast default` efface cette couche)
  2. Remplacement de session
  3. Valeur par défaut par agent (`agents.list[].fastModeDefault`)
  4. Configuration par modèle : `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Repli : `off`
- Pour `openai/*`, le mode rapide correspond au traitement prioritaire OpenAI en envoyant `service_tier=priority` sur les requêtes Responses prises en charge.
- Pour `openai-codex/*`, le mode rapide envoie le même indicateur `service_tier=priority` sur les Responses Codex. OpenClaw conserve un seul commutateur `/fast` partagé entre les deux chemins d’authentification.
- Pour les requêtes publiques directes `anthropic/*`, y compris le trafic authentifié OAuth envoyé à `api.anthropic.com`, le mode rapide correspond aux niveaux de service Anthropic : `/fast on` définit `service_tier=auto`, `/fast off` définit `service_tier=standard_only`.
- Pour `minimax/*` sur le chemin compatible Anthropic, `/fast on` (ou `params.fastMode: true`) réécrit `MiniMax-M2.7` en `MiniMax-M2.7-highspeed`.
- Les paramètres de modèle Anthropic explicites `serviceTier` / `service_tier` remplacent la valeur par défaut du mode rapide lorsque les deux sont définis. OpenClaw ignore toujours l’injection de niveau de service Anthropic pour les URL de base proxy non Anthropic.
- `/status` affiche `Fast` uniquement lorsque le mode rapide est activé.

## Directives détaillées (/verbose ou /v)

- Niveaux : `on` (minimal) | `full` | `off` (par défaut).
- Un message ne contenant que la directive active ou désactive le mode détaillé de session et répond `Verbose logging enabled.` / `Verbose logging disabled.` ; les niveaux invalides renvoient une indication sans modifier l’état.
- `/verbose off` stocke un remplacement de session explicite ; effacez-le via l’interface Sessions en choisissant `inherit`.
- Une directive en ligne n’affecte que ce message ; sinon, les valeurs par défaut de session/globales s’appliquent.
- Envoyez `/verbose` (ou `/verbose:`) sans argument pour voir le niveau détaillé actuel.
- Lorsque le mode détaillé est activé, les agents qui émettent des résultats d’outils structurés (Pi, autres agents JSON) renvoient chaque appel d’outil comme son propre message contenant uniquement des métadonnées, préfixé par `<emoji> <tool-name>: <arg>` lorsque disponible. Ces résumés d’outils sont envoyés dès que chaque outil démarre (bulles séparées), pas sous forme de deltas de streaming.
- Les résumés d’échec d’outil restent visibles en mode normal, mais les suffixes de détails d’erreur bruts sont masqués sauf si le mode détaillé est `on` ou `full`.
- Lorsque le mode détaillé est `full`, les sorties d’outil sont également transmises après achèvement (bulle séparée, tronquée à une longueur sûre). Si vous basculez `/verbose on|full|off` pendant qu’une exécution est en cours, les bulles d’outils suivantes respectent le nouveau réglage.
- `agents.defaults.toolProgressDetail` contrôle la forme des résumés d’outils `/verbose` et des lignes d’outils de brouillon de progression. Utilisez `"explain"` (par défaut) pour des libellés humains compacts tels que `🛠️ Exec: checking JS syntax` ; utilisez `"raw"` lorsque vous voulez aussi que la commande/le détail brut soit ajouté pour le débogage. `agents.list[].toolProgressDetail` par agent remplace la valeur par défaut.
  - `explain` : `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw` : `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Directives de trace Plugin (/trace)

- Niveaux : `on` | `off` (par défaut).
- Un message ne contenant que la directive active ou désactive la sortie de trace de plugin de session et répond `Plugin trace enabled.` / `Plugin trace disabled.`.
- Une directive en ligne n’affecte que ce message ; sinon, les valeurs par défaut de session/globales s’appliquent.
- Envoyez `/trace` (ou `/trace:`) sans argument pour voir le niveau de trace actuel.
- `/trace` est plus restreint que `/verbose` : il expose uniquement les lignes de trace/débogage appartenant au plugin, telles que les résumés de débogage Active Memory.
- Les lignes de trace peuvent apparaître dans `/status` et comme message de diagnostic de suivi après la réponse normale de l’assistant.

## Visibilité du raisonnement (/reasoning)

- Niveaux : `on|off|stream`.
- Un message ne contenant que la directive active ou désactive l’affichage des blocs de réflexion dans les réponses.
- Lorsqu’il est activé, le raisonnement est envoyé comme un **message séparé** préfixé par `Reasoning:`.
- `stream` (Telegram uniquement) : diffuse le raisonnement dans la bulle de brouillon Telegram pendant la génération de la réponse, puis envoie la réponse finale sans raisonnement.
- Alias : `/reason`.
- Envoyez `/reasoning` (ou `/reasoning:`) sans argument pour voir le niveau de raisonnement actuel.
- Ordre de résolution : directive en ligne, puis remplacement de session, puis valeur par défaut par agent (`agents.list[].reasoningDefault`), puis valeur par défaut globale (`agents.defaults.reasoningDefault`), puis repli (`off`).

Les balises de raisonnement de modèle local mal formées sont traitées prudemment. Les blocs fermés `<think>...</think>` restent masqués dans les réponses normales, et le raisonnement non fermé après du texte déjà visible est également masqué. Si une réponse est entièrement enveloppée dans une seule balise ouvrante non fermée et produirait sinon un texte vide, OpenClaw supprime la balise ouvrante mal formée et livre le texte restant.

## Connexe

- La documentation du mode élevé se trouve dans [Mode élevé](/fr/tools/elevated).

## Heartbeats

- Le corps de la sonde Heartbeat est le prompt Heartbeat configuré (par défaut : `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Les directives en ligne dans un message Heartbeat s’appliquent comme d’habitude (mais évitez de modifier les valeurs par défaut de session depuis les Heartbeats).
- La livraison Heartbeat se limite par défaut à la charge utile finale. Pour envoyer aussi le message `Reasoning:` séparé (lorsqu’il est disponible), définissez `agents.defaults.heartbeat.includeReasoning: true` ou `agents.list[].heartbeat.includeReasoning: true` par agent.

## Interface de chat Web

- Le sélecteur de réflexion du chat web reflète le niveau stocké de la session depuis le magasin/la configuration de session entrante au chargement de la page.
- Choisir un autre niveau écrit immédiatement le remplacement de session via `sessions.patch` ; cela n’attend pas le prochain envoi et ce n’est pas un remplacement ponctuel `thinkingOnce`.
- La première option est toujours le choix de suppression du remplacement. Elle affiche `Inherited: <resolved level>` lorsque la session hérite d’une valeur par défaut effective non désactivée, ou `Off` lorsque la réflexion héritée est désactivée.
- Les choix explicites du sélecteur sont étiquetés comme des remplacements, tout en conservant les libellés du fournisseur lorsqu’ils sont présents (par exemple `Override: maximum` pour une option `max` étiquetée par le fournisseur).
- Le sélecteur utilise `thinkingLevels` renvoyé par la ligne/les valeurs par défaut de session du Gateway, avec `thinkingOptions` conservé comme liste de libellés héritée. L’interface utilisateur du navigateur ne conserve pas sa propre liste d’expressions régulières de fournisseurs ; les plugins possèdent les ensembles de niveaux propres aux modèles.
- `/think:<level>` fonctionne toujours et met à jour le même niveau de session stocké, de sorte que les directives de chat et le sélecteur restent synchronisés.

## Profils de fournisseur

- Les plugins de fournisseur peuvent exposer `resolveThinkingProfile(ctx)` pour définir les niveaux pris en charge par le modèle et sa valeur par défaut.
- Les plugins de fournisseur qui relaient des modèles Claude doivent réutiliser `resolveClaudeThinkingProfile(modelId)` depuis `openclaw/plugin-sdk/provider-model-shared` afin que les catalogues Anthropic directs et relayés restent alignés.
- Chaque niveau de profil possède un `id` canonique stocké (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` ou `max`) et peut inclure un `label` d’affichage. Les fournisseurs binaires utilisent `{ id: "low", label: "on" }`.
- Les plugins d’outils qui doivent valider un remplacement explicite de réflexion doivent utiliser `api.runtime.agent.resolveThinkingPolicy({ provider, model })` ainsi que `api.runtime.agent.normalizeThinkingLevel(...)` ; ils ne doivent pas conserver leurs propres listes de niveaux par fournisseur/modèle.
- Les plugins d’outils ayant accès aux métadonnées de modèles personnalisés configurées peuvent transmettre `catalog` à `resolveThinkingPolicy` afin que les activations `compat.supportedReasoningEfforts` soient reflétées dans la validation côté plugin.
- Les hooks hérités publiés (`supportsXHighThinking`, `isBinaryThinking` et `resolveDefaultThinkingLevel`) restent des adaptateurs de compatibilité, mais les nouveaux ensembles de niveaux personnalisés doivent utiliser `resolveThinkingProfile`.
- Les lignes/valeurs par défaut du Gateway exposent `thinkingLevels`, `thinkingOptions` et `thinkingDefault` afin que les clients ACP/chat affichent les mêmes identifiants et libellés de profil que ceux utilisés par la validation à l’exécution.
