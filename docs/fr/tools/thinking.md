---
read_when:
    - Ajustement de l’analyse, du mode rapide ou de l’analyse et des valeurs par défaut des directives de verbosité
summary: Syntaxe des directives pour /think, /fast, /verbose, /trace et la visibilité du raisonnement
title: Niveaux de réflexion
x-i18n:
    generated_at: "2026-07-12T16:05:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 75170dd48f83dcb3ebb70eea2b37160208618d0aae23253c82fe88ce3afbc0e2
    source_path: tools/thinking.md
    workflow: 16
---

## Fonctionnement

- Directive en ligne dans tout corps entrant : `/t <level>`, `/think:<level>` ou `/thinking <level>`.
- Niveaux (alias) : `off | minimal | low | medium | high | xhigh | adaptive | max | ultra`, reflétant approximativement l'échelle classique de mots magiques d'Anthropic « think » < « think hard » < « think harder » < « ultrathink » :
  - minimal ~ « réfléchir »
  - low ~ « réfléchir intensément »
  - medium ~ « réfléchir plus intensément »
  - high ~ « ultrathink » (budget maximal)
  - xhigh ~ « ultrathink+ » (modèles GPT-5.2+ et Codex, ainsi que l'effort d'Anthropic Claude Opus 4.7+)
  - adaptive → réflexion adaptative gérée par le fournisseur (prise en charge pour Claude 4.6 sur Anthropic/Bedrock, Anthropic Claude Opus 4.7+ et la réflexion dynamique de Google Gemini)
  - max → raisonnement maximal du fournisseur (Anthropic Claude Opus 4.7+ ; Ollama l'associe à son effort `think` natif le plus élevé)
  - ultra → raisonnement maximal du fournisseur avec orchestration proactive de sous-agents lorsque le modèle ou l'environnement d'exécution sélectionné le prend en charge
  - `x-high`, `x_high`, `extra-high`, `extra high` et `extra_high` correspondent à `xhigh`.
  - `highest` correspond à `high`.
- Remarques sur les fournisseurs :
  - Les menus et sélecteurs de réflexion sont déterminés par le profil du fournisseur. Les Plugins de fournisseur déclarent l'ensemble exact de niveaux pour le modèle sélectionné, y compris des libellés tels que le mode binaire `on`.
  - `adaptive`, `xhigh`, `max` et `ultra` ne sont proposés que pour les profils de fournisseur, de modèle et d'environnement d'exécution qui les prennent en charge. Les directives typées correspondant à des niveaux non pris en charge sont rejetées avec les options valides de ce modèle.
  - Les niveaux non pris en charge déjà enregistrés sont réassociés selon le classement du profil du fournisseur. `adaptive` revient à `medium` sur les modèles non adaptatifs, tandis que `xhigh` et `max` reviennent au niveau pris en charge le plus élevé autre que désactivé pour le modèle sélectionné.
  - Les modèles Anthropic Claude 4.6 utilisent par défaut `adaptive` lorsqu'aucun niveau de réflexion explicite n'est défini.
  - Anthropic Claude Opus 4.8 et Opus 4.7 gardent la réflexion désactivée sauf si vous définissez explicitement un niveau de réflexion. La valeur par défaut de l'effort propre au fournisseur d'Opus 4.8 est `high` après l'activation de la réflexion adaptative.
  - Anthropic Claude Opus 4.7+ associe `/think xhigh` à la réflexion adaptative avec `output_config.effort: "xhigh"`, car `/think` est une directive de réflexion et `xhigh` est le paramètre d'effort d'Opus.
  - Anthropic Claude Opus 4.7+ propose également `/think max` ; ce niveau correspond au même parcours d'effort maximal propre au fournisseur.
  - Les modèles DeepSeek V4 directs proposent `/think xhigh|max` ; les deux correspondent à `reasoning_effort: "max"` de DeepSeek, tandis que les niveaux inférieurs autres que désactivé correspondent à `high`.
  - Les modèles DeepSeek V4 acheminés par OpenRouter proposent `/think xhigh` et envoient les valeurs `reasoning.effort` prises en charge par OpenRouter au lieu de la valeur `reasoning_effort` native de premier niveau de DeepSeek. Les niveaux inférieurs autres que désactivé correspondent à `high`, et les remplacements `max` enregistrés reviennent à `xhigh`.
  - Les modèles Ollama capables de réflexion proposent `/think low|medium|high|max` ; `max` correspond à la valeur native `think: "high"`, car l'API native d'Ollama accepte les chaînes d'effort `low`, `medium` et `high`.
  - Les modèles OpenAI GPT associent `/think` à la prise en charge de l'effort propre au modèle dans l'API Responses. `/think off` envoie `reasoning.effort: "none"` uniquement lorsque le modèle cible le prend en charge ; sinon, OpenClaw omet la charge utile de raisonnement désactivée au lieu d'envoyer une valeur non prise en charge.
  - GPT-5.6 Sol et Terra proposent la valeur native `/think ultra` via l'environnement d'exécution Codex. GPT-5.6 Luna propose des niveaux jusqu'à `max`, car son catalogue Codex n'annonce pas Ultra.
  - L'environnement d'exécution OpenClaw intégré propose la valeur logique `/think ultra` pour GPT-5.6 Sol, Terra et Luna. Il envoie l'effort maximal du fournisseur et ajoute des instructions d'orchestration proactive de sous-agents limitées à l'exécution.
  - Les entrées de catalogue personnalisées compatibles avec OpenAI peuvent activer `/think xhigh` en définissant `models.providers.<provider>.models[].compat.supportedReasoningEfforts` de façon à inclure `"xhigh"`. Cela utilise les mêmes métadonnées de compatibilité qui associent les charges utiles sortantes d'effort de raisonnement OpenAI, afin que les menus, la validation des sessions, la CLI de l'agent et `llm-task` concordent avec le comportement du transport.
  - Les anciennes références OpenRouter Hunter Alpha configurées ignorent l'injection du raisonnement par le proxy, car cette voie retirée pouvait renvoyer le texte de la réponse finale dans les champs de raisonnement.
  - Google Gemini associe `/think adaptive` à la réflexion dynamique propre à Gemini. Les requêtes Gemini 3 omettent une valeur `thinkingLevel` fixe, tandis que les requêtes Gemini 2.5 envoient `thinkingBudget: -1` ; les niveaux fixes correspondent toujours à la valeur `thinkingLevel` ou au budget Gemini le plus proche pour cette famille de modèles.
  - MiniMax M2.x (`minimax/MiniMax-M2*`), sur le parcours de diffusion en continu compatible avec Anthropic, utilise par défaut `thinking: { type: "disabled" }`, sauf si vous définissez explicitement la réflexion dans les paramètres du modèle ou de la requête. Cela évite la fuite de deltas `reasoning_content` provenant du format de flux Anthropic non natif de M2.x. MiniMax-M3 (et M3.x) est exempté : M3 émet des blocs de réflexion Anthropic corrects et renvoie un contenu vide lorsque la réflexion est désactivée ; OpenClaw maintient donc M3 sur le parcours de réflexion omise/adaptative du fournisseur.
  - Z.AI (`zai/*`) est binaire (`on`/`off`) pour la plupart des modèles GLM. GLM-5.2 constitue l'exception : il propose `/think off|low|high|max`, associe `low` et `high` à `reasoning_effort: "high"` de Z.AI, et associe `max` à `reasoning_effort: "max"`.
  - Moonshot Kimi K2.7 Code (`moonshot/kimi-k2.7-code`) réfléchit toujours. Son profil propose uniquement `on`, et OpenClaw omet le champ sortant `thinking`, comme l'exige Moonshot. Les autres modèles `moonshot/*` associent `/think off` à `thinking: { type: "disabled" }` et tout niveau autre que `off` à `thinking: { type: "enabled" }`. Lorsque la réflexion est activée, Moonshot accepte uniquement `tool_choice` `auto|none` ; OpenClaw normalise les valeurs incompatibles en `auto`.

## Ordre de résolution

1. Directive intégrée au message (s’applique uniquement à ce message).
2. Remplacement pour la session (défini en envoyant un message contenant uniquement une directive).
3. Valeur par défaut propre à l’agent (`agents.list[].thinkingDefault` dans la configuration).
4. Valeur globale par défaut (`agents.defaults.thinkingDefault` dans la configuration).
5. Solution de repli : valeur par défaut déclarée par le fournisseur lorsqu’elle est disponible ; sinon, les modèles capables de raisonnement utilisent `medium` ou le niveau pris en charge autre que `off` le plus proche pour ce modèle, tandis que les modèles sans capacité de raisonnement restent sur `off`.

## Définition d’une valeur par défaut pour la session

- Envoyez un message contenant **uniquement** la directive (les espaces sont autorisés), par exemple `/think:medium` ou `/t high`.
- Ce réglage persiste pendant la session en cours (par défaut, pour chaque expéditeur). Utilisez `/think default` pour supprimer le remplacement de session et hériter de la valeur par défaut configurée ou définie par le fournisseur ; les alias incluent `inherit`, `clear`, `reset` et `unpin`.
- `/think off` enregistre un remplacement explicite désactivant le raisonnement. Il désactive le raisonnement jusqu’à ce que vous modifiiez ou supprimiez le remplacement de session.
- Une réponse de confirmation est envoyée (`Thinking level set to high.` / `Thinking disabled.`). Si le niveau n’est pas valide (par exemple `/thinking big`), la commande est rejetée avec une indication et l’état de la session reste inchangé.
- Envoyez `/think` (ou `/think:`) sans argument pour afficher le niveau de raisonnement actuel.

## Application par l’agent

- **OpenClaw intégré** : le niveau résolu est transmis à l’environnement d’exécution de l’agent OpenClaw dans le processus.
- **Backend CLI Claude** : les niveaux concrets autres que désactivé sont transmis à Claude Code sous la forme `--effort` lors de l’utilisation de `claude-cli` ; `adaptive` supprime les indicateurs d’effort configurés et délègue l’effort effectif à l’environnement, aux paramètres et aux valeurs par défaut du modèle de Claude Code. Consultez [Backends CLI](/fr/gateway/cli-backends).

## Mode rapide (/fast)

- Niveaux : `auto|on|off|default`.
- Un message contenant uniquement la directive active ou désactive un remplacement du mode rapide pour la session et répond `Fast mode set to auto.`, `Fast mode enabled.` ou `Fast mode disabled.`. Utilisez `/fast default` pour supprimer le remplacement de session et hériter de la valeur par défaut configurée ; les alias incluent `inherit`, `clear`, `reset` et `unpin`.
- Envoyez `/fast` (ou `/fast status`) sans mode pour afficher l’état effectif actuel du mode rapide.
- OpenClaw détermine le mode rapide dans l’ordre suivant :
  1. Remplacement `/fast auto|on|off` intégré ou constituant à lui seul le message (`/fast default` supprime cette couche)
  2. Remplacement de session
  3. Valeur par défaut propre à l’agent (`agents.list[].fastModeDefault`)
  4. Configuration propre au modèle : `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Valeur de repli : `off`
- `auto` conserve le mode de session ou de configuration sur auto, mais détermine indépendamment le mode de chaque nouvel appel au modèle. Le mode rapide est activé pour les appels qui commencent avant la limite automatique ; il est désactivé pour les appels ultérieurs de nouvelle tentative, de repli, de résultat d’outil ou de continuation. La limite est de 60 secondes par défaut ; définissez `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` sur le modèle actif pour la modifier.
- Pour `openai/*`, le mode rapide correspond au traitement prioritaire d’OpenAI et envoie `service_tier=priority` dans les requêtes Responses compatibles.
- Pour les modèles `openai/*` / `openai-codex/*` reposant sur Codex, le mode rapide envoie le même indicateur `service_tier=priority` dans les requêtes Responses de Codex. Les tours du serveur d’application Codex natif ne reçoivent le niveau que lors de `turn/start` ou du démarrage/de la reprise d’un fil de discussion ; `auto` ne peut donc pas changer le niveau d’un tour du serveur d’application déjà en cours d’exécution. Il s’applique au prochain tour de modèle lancé par OpenClaw.
- Pour les requêtes publiques directes `anthropic/*`, y compris le trafic authentifié par OAuth envoyé à `api.anthropic.com`, le mode rapide correspond aux niveaux de service Anthropic : `/fast on` définit `service_tier=auto`, tandis que `/fast off` définit `service_tier=standard_only`.
- Pour `minimax/*` sur le chemin compatible avec Anthropic, `/fast on` (ou `params.fastMode: true`) remplace `MiniMax-M2.7` par `MiniMax-M2.7-highspeed`.
- Les paramètres de modèle Anthropic explicites `serviceTier` / `service_tier` remplacent la valeur par défaut du mode rapide lorsque les deux sont définis. OpenClaw continue de ne pas injecter le niveau de service Anthropic pour les URL de base de proxy non Anthropic.
- `/status` affiche `Fast` lorsque le mode rapide est activé et `Fast:auto` lorsque le mode configuré est auto.

## Directives de verbosité (/verbose ou /v)

- Niveaux : `on` (minimal) | `full` | `off` (par défaut).
- Un message contenant uniquement la directive active ou désactive le mode détaillé de la session et répond `Verbose logging enabled.` / `Verbose logging disabled.` ; les niveaux non valides renvoient une indication sans modifier l’état.
- `/verbose off` enregistre un remplacement explicite pour la session ; supprimez-le dans l’interface Sessions en choisissant `inherit`.
- Les expéditeurs autorisés de canaux externes peuvent conserver le remplacement du mode détaillé pour la session. Les clients internes du Gateway ou du webchat doivent disposer de `operator.admin` pour le conserver.
- Une directive intégrée ne concerne que ce message ; sinon, les valeurs par défaut de la session ou globales s’appliquent.
- Envoyez `/verbose` (ou `/verbose:`) sans argument pour afficher le niveau de détail actuel.
- Lorsque le mode détaillé est activé, les agents qui émettent des résultats d’outils structurés renvoient chaque appel d’outil dans un message distinct contenant uniquement des métadonnées, précédé de `<emoji> <tool-name>: <arg>` lorsque ces informations sont disponibles. Ces résumés d’outils sont envoyés dès le démarrage de chaque outil, dans des bulles séparées, et non sous forme de mises à jour diffusées en continu.
- Les résumés des échecs d’outils restent visibles en mode normal, mais les suffixes contenant les détails bruts des erreurs sont masqués, sauf si le niveau de verbosité est `full`.
- Lorsque le niveau de verbosité est `full`, les sorties des outils sont également transmises après leur exécution (dans une bulle distincte, tronquées à une longueur sûre). Si vous basculez entre `/verbose on|full|off` pendant une exécution, les bulles d’outils suivantes respectent le nouveau paramètre.
- `agents.defaults.toolProgressDetail` contrôle la forme des résumés d’outils de `/verbose` et des lignes d’outils dans les brouillons de progression. Utilisez `"explain"` (valeur par défaut) pour obtenir des libellés humains compacts tels que `🛠️ Exec: checking JS syntax` ; utilisez `"raw"` si vous souhaitez également ajouter la commande ou les détails bruts à des fins de débogage. Le paramètre `agents.list[].toolProgressDetail` propre à chaque agent remplace la valeur par défaut.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Directives de traçage des Plugins (/trace)

- Niveaux : `on` | `off` (par défaut).
- Un message contenant uniquement la directive active ou désactive la sortie de traçage du Plugin pour la session et répond `Plugin trace enabled.` / `Plugin trace disabled.`.
- Une directive intégrée ne concerne que ce message ; les valeurs par défaut de la session ou globales s’appliquent dans les autres cas.
- Envoyez `/trace` (ou `/trace:`) sans argument pour afficher le niveau de traçage actuel.
- `/trace` a une portée plus restreinte que `/verbose` : il expose uniquement les lignes de traçage/débogage propres au Plugin, telles que les résumés de débogage d’Active Memory.
- Les lignes de traçage peuvent apparaître dans `/status` et dans un message de diagnostic complémentaire après la réponse normale de l’assistant.

## Visibilité du raisonnement (/reasoning)

- Niveaux : `on|off|stream`.
- Un message contenant uniquement la directive active ou désactive l’affichage des blocs de réflexion dans les réponses.
- Lorsque cette option est activée, le raisonnement est envoyé sous forme de **message distinct** précédé de `Thinking`.
- `stream` : diffuse le raisonnement pendant la génération de la réponse lorsque le canal actif prend en charge les aperçus du raisonnement, puis envoie la réponse finale sans le raisonnement.
- Alias : `/reason`.
- Envoyez `/reasoning` (ou `/reasoning:`) sans argument pour afficher le niveau de raisonnement actuel.
- Ordre de résolution : directive en ligne, puis remplacement de session, puis valeur par défaut propre à l’agent (`agents.list[].reasoningDefault`), puis valeur globale par défaut (`agents.defaults.reasoningDefault`), puis valeur de repli (`off`).

Les balises de raisonnement mal formées des modèles locaux sont traitées avec prudence. Les blocs `<think>...</think>` fermés restent masqués dans les réponses normales, et tout raisonnement non fermé après du texte déjà visible est également masqué. Si une réponse est entièrement enveloppée dans une seule balise ouvrante non fermée et serait autrement transmise sous forme de texte vide, OpenClaw supprime la balise ouvrante mal formée et transmet le texte restant.

## Pages connexes

- La documentation du mode élevé se trouve dans [Mode élevé](/fr/tools/elevated).

## Heartbeat

- Le corps de la sonde Heartbeat correspond à l’invite Heartbeat configurée (par défaut : `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Les directives intégrées dans un message Heartbeat s’appliquent comme d’habitude (mais évitez de modifier les valeurs par défaut de la session depuis les Heartbeats).
- Par défaut, la livraison Heartbeat envoie uniquement la charge utile finale. Pour envoyer également le message `Thinking` séparé (lorsqu’il est disponible), définissez `agents.defaults.heartbeat.includeReasoning: true` ou, pour chaque agent, `agents.list[].heartbeat.includeReasoning: true`.

## Interface utilisateur de discussion Web

- Au chargement de la page, le sélecteur de réflexion de la discussion Web reflète le niveau enregistré de la session provenant du magasin ou de la configuration de la session entrante.
- Le choix d’un autre niveau écrit immédiatement la substitution de session via `sessions.patch` ; il n’attend pas le prochain envoi et ne constitue pas une substitution ponctuelle `thinkingOnce`.
- Si vous effectuez un envoi alors que des modifications des sélecteurs de modèle, de raisonnement ou de vitesse sont encore en cours d’application, l’envoi attend chaque mise à jour de sélecteur en attente ; si une modification échoue, le message reste non envoyé afin de permettre sa vérification.
- La première option permet toujours d’effacer la substitution. Elle affiche `Inherited: <resolved level>`, y compris `Inherited: Off` lorsque la réflexion héritée est désactivée.
- Les choix explicites du sélecteur utilisent directement les libellés de leur niveau, tout en conservant les libellés du fournisseur lorsqu’ils existent (par exemple `Maximum` pour une option `max` libellée par un fournisseur).
- Le sélecteur utilise `thinkingLevels` renvoyé par la ligne de session ou les valeurs par défaut du Gateway, tandis que `thinkingOptions` est conservé comme liste de libellés héritée. L’interface utilisateur du navigateur ne conserve pas sa propre liste d’expressions régulières de fournisseurs ; les plugins définissent les ensembles de niveaux propres aux modèles.
- `/think:<level>` continue de fonctionner et met à jour le même niveau de session enregistré, afin que les directives de discussion et le sélecteur restent synchronisés.

## Profils de fournisseur

- Les plugins de fournisseur peuvent exposer `resolveThinkingProfile(ctx)` afin de définir les niveaux pris en charge et le niveau par défaut du modèle.
- Les plugins de fournisseur qui servent de proxy aux modèles Claude doivent réutiliser `resolveClaudeThinkingProfile(modelId)` depuis `openclaw/plugin-sdk/provider-model-shared`, afin que les catalogues Anthropic directs et ceux des proxys restent alignés.
- Chaque niveau de profil possède un `id` canonique enregistré (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, `max` ou `ultra`) et peut inclure un `label` d’affichage. Les fournisseurs binaires utilisent `{ id: "low", label: "on" }`.
- Les hooks de profil reçoivent, lorsqu’ils sont disponibles, les faits fusionnés du catalogue, notamment `reasoning`, `compat.thinkingFormat` et `compat.supportedReasoningEfforts`. Utilisez ces faits pour exposer des profils binaires ou personnalisés uniquement lorsque le contrat de requête configuré prend en charge la charge utile correspondante.
- Les plugins d’outil qui doivent valider une substitution explicite de la réflexion doivent utiliser `api.runtime.agent.resolveThinkingPolicy({ provider, model, agentRuntime })` avec `api.runtime.agent.normalizeThinkingLevel(...)` ; ils ne doivent pas conserver leurs propres listes de niveaux par fournisseur ou modèle. Transmettez `agentRuntime` lorsque l’outil contrôle le chemin d’exécution, par exemple pour une exécution toujours intégrée.
- Les plugins d’outil ayant accès aux métadonnées configurées des modèles personnalisés peuvent transmettre `catalog` à `resolveThinkingPolicy`, afin que les activations explicites de `compat.supportedReasoningEfforts` soient prises en compte dans la validation côté plugin.
- Les hooks hérités publiés (`supportsXHighThinking`, `isBinaryThinking` et `resolveDefaultThinkingLevel`) restent disponibles comme adaptateurs de compatibilité, mais les nouveaux ensembles de niveaux personnalisés doivent utiliser `resolveThinkingProfile`.
- Les lignes et valeurs par défaut du Gateway exposent `thinkingLevels`, `thinkingOptions` et `thinkingDefault`, afin que les clients ACP et de discussion affichent les mêmes identifiants et libellés de profils que ceux utilisés par la validation à l’exécution.
