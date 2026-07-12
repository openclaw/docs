---
read_when:
    - Ajustement de l’analyse des directives ou des valeurs par défaut de réflexion, de mode rapide ou de verbosité
summary: Syntaxe des directives pour /think, /fast, /verbose, /trace et la visibilité du raisonnement
title: Niveaux de réflexion
x-i18n:
    generated_at: "2026-07-12T03:13:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 75170dd48f83dcb3ebb70eea2b37160208618d0aae23253c82fe88ce3afbc0e2
    source_path: tools/thinking.md
    workflow: 16
---

## Fonctionnement

- Directive intégrée dans tout corps de message entrant : `/t <level>`, `/think:<level>` ou `/thinking <level>`.
- Niveaux (alias) : `off | minimal | low | medium | high | xhigh | adaptive | max | ultra`, correspondant approximativement à l’échelle classique de mots magiques d’Anthropic « think » < « think hard » < « think harder » < « ultrathink » :
  - minimal ~ « réfléchir »
  - low ~ « réfléchir sérieusement »
  - medium ~ « réfléchir plus sérieusement »
  - high ~ « ultraréflexion » (budget maximal)
  - xhigh ~ « ultraréflexion+ » (modèles GPT-5.2+ et Codex, ainsi que l’effort d’Anthropic Claude Opus 4.7+)
  - adaptive → réflexion adaptative gérée par le fournisseur (prise en charge pour Claude 4.6 sur Anthropic/Bedrock, Anthropic Claude Opus 4.7+ et la réflexion dynamique de Google Gemini)
  - max → raisonnement maximal du fournisseur (Anthropic Claude Opus 4.7+ ; Ollama l’associe à son effort `think` natif le plus élevé)
  - ultra → raisonnement maximal du fournisseur avec orchestration proactive de sous-agents lorsque le modèle ou l’environnement d’exécution sélectionné le prend en charge
  - `x-high`, `x_high`, `extra-high`, `extra high` et `extra_high` correspondent à `xhigh`.
  - `highest` correspond à `high`.
- Remarques sur les fournisseurs :
  - Les menus et sélecteurs de réflexion dépendent du profil du fournisseur. Les plugins de fournisseur déclarent l’ensemble exact de niveaux pour le modèle sélectionné, y compris des libellés tels que le binaire `on`.
  - `adaptive`, `xhigh`, `max` et `ultra` ne sont proposés que pour les profils de fournisseur, de modèle et d’environnement d’exécution qui les prennent en charge. Les directives saisies avec des niveaux non pris en charge sont rejetées avec les options valides pour ce modèle.
  - Les niveaux non pris en charge déjà enregistrés sont réaffectés selon le rang du profil du fournisseur. `adaptive` revient à `medium` sur les modèles non adaptatifs, tandis que `xhigh` et `max` reviennent au plus grand niveau pris en charge autre que `off` pour le modèle sélectionné.
  - Les modèles Anthropic Claude 4.6 utilisent `adaptive` par défaut lorsqu’aucun niveau de réflexion explicite n’est défini.
  - Anthropic Claude Opus 4.8 et Opus 4.7 conservent la réflexion désactivée, sauf si vous définissez explicitement un niveau de réflexion. Après l’activation de la réflexion adaptative, la valeur d’effort par défaut gérée par le fournisseur pour Opus 4.8 est `high`.
  - Anthropic Claude Opus 4.7+ associe `/think xhigh` à la réflexion adaptative avec `output_config.effort: "xhigh"`, car `/think` est une directive de réflexion et `xhigh` est le réglage d’effort d’Opus.
  - Anthropic Claude Opus 4.7+ propose également `/think max`, qui correspond au même mécanisme d’effort maximal géré par le fournisseur.
  - Les modèles DeepSeek V4 directs proposent `/think xhigh|max` ; les deux correspondent à `reasoning_effort: "max"` de DeepSeek, tandis que les niveaux inférieurs autres que `off` correspondent à `high`.
  - Les modèles DeepSeek V4 acheminés par OpenRouter proposent `/think xhigh` et envoient les valeurs `reasoning.effort` prises en charge par OpenRouter au lieu du champ `reasoning_effort` de premier niveau natif de DeepSeek. Les niveaux inférieurs autres que `off` correspondent à `high`, et les remplacements `max` enregistrés reviennent à `xhigh`.
  - Les modèles Ollama capables de réflexion proposent `/think low|medium|high|max` ; `max` correspond à la valeur native `think: "high"`, car l’API native d’Ollama accepte les chaînes d’effort `low`, `medium` et `high`.
  - Les modèles OpenAI GPT associent `/think` à la prise en charge de l’effort propre au modèle dans l’API Responses. `/think off` envoie `reasoning.effort: "none"` uniquement lorsque le modèle cible le prend en charge ; sinon, OpenClaw omet la charge utile de raisonnement désactivé au lieu d’envoyer une valeur non prise en charge.
  - GPT-5.6 Sol et Terra proposent `/think ultra` de manière native par l’intermédiaire de l’environnement d’exécution Codex. GPT-5.6 Luna propose les niveaux jusqu’à `max`, car son catalogue Codex n’annonce pas Ultra.
  - L’environnement d’exécution OpenClaw intégré propose le niveau logique `/think ultra` pour GPT-5.6 Sol, Terra et Luna. Il envoie l’effort maximal du fournisseur et ajoute des instructions d’orchestration proactive de sous-agents limitées à l’exécution.
  - Les entrées personnalisées du catalogue compatibles avec OpenAI peuvent activer `/think xhigh` en ajoutant `"xhigh"` à `models.providers.<provider>.models[].compat.supportedReasoningEfforts`. Cela utilise les mêmes métadonnées de compatibilité que celles qui associent les charges utiles d’effort de raisonnement OpenAI sortantes, afin que les menus, la validation de session, la CLI de l’agent et `llm-task` concordent avec le comportement du transport.
  - Les anciennes références OpenRouter Hunter Alpha configurées ignorent l’injection de raisonnement par le proxy, car cette route retirée pouvait renvoyer le texte de la réponse finale dans les champs de raisonnement.
  - Google Gemini associe `/think adaptive` à la réflexion dynamique gérée par le fournisseur Gemini. Les requêtes Gemini 3 omettent un `thinkingLevel` fixe, tandis que les requêtes Gemini 2.5 envoient `thinkingBudget: -1` ; les niveaux fixes correspondent toujours au `thinkingLevel` ou au budget Gemini le plus proche pour cette famille de modèles.
  - MiniMax M2.x (`minimax/MiniMax-M2*`) utilise par défaut `thinking: { type: "disabled" }` sur le chemin de diffusion en continu compatible avec Anthropic, sauf si vous définissez explicitement la réflexion dans les paramètres du modèle ou de la requête. Cela évite les deltas `reasoning_content` indésirables provenant du format de flux Anthropic non natif de M2.x. MiniMax-M3 (et M3.x) est exempté : M3 émet des blocs de réflexion Anthropic corrects et renvoie un contenu vide lorsque la réflexion est désactivée ; OpenClaw conserve donc M3 sur le chemin de réflexion omise ou adaptative du fournisseur.
  - Z.AI (`zai/*`) est binaire (`on`/`off`) pour la plupart des modèles GLM. GLM-5.2 fait exception : il propose `/think off|low|high|max`, associe `low` et `high` à `reasoning_effort: "high"` de Z.AI, et `max` à `reasoning_effort: "max"`.
  - Moonshot Kimi K2.7 Code (`moonshot/kimi-k2.7-code`) réfléchit toujours. Son profil ne propose que `on`, et OpenClaw omet le champ `thinking` sortant comme l’exige Moonshot. Les autres modèles `moonshot/*` associent `/think off` à `thinking: { type: "disabled" }` et tout niveau autre que `off` à `thinking: { type: "enabled" }`. Lorsque la réflexion est activée, Moonshot n’accepte que `auto|none` pour `tool_choice` ; OpenClaw normalise les valeurs incompatibles en `auto`.

## Ordre de résolution

1. Directive intégrée au message (s’applique uniquement à ce message).
2. Remplacement de session (défini par l’envoi d’un message contenant uniquement une directive).
3. Valeur par défaut propre à l’agent (`agents.list[].thinkingDefault` dans la configuration).
4. Valeur globale par défaut (`agents.defaults.thinkingDefault` dans la configuration).
5. Repli : valeur par défaut déclarée par le fournisseur lorsqu’elle est disponible ; sinon, les modèles capables de raisonnement utilisent `medium` ou le niveau pris en charge autre que `off` le plus proche pour ce modèle, tandis que les modèles sans raisonnement restent sur `off`.

## Définition d’une valeur de session par défaut

- Envoyez un message contenant **uniquement** la directive (les espaces sont autorisés), par exemple `/think:medium` ou `/t high`.
- Ce réglage reste actif pour la session actuelle (par expéditeur, par défaut). Utilisez `/think default` pour effacer le remplacement de session et hériter de la valeur par défaut configurée ou du fournisseur ; les alias comprennent `inherit`, `clear`, `reset` et `unpin`.
- `/think off` enregistre un remplacement explicite par `off`. Il désactive la réflexion jusqu’à ce que vous modifiiez ou effaciez le remplacement de session.
- Une réponse de confirmation est envoyée (`Niveau de réflexion défini sur high.` / `Réflexion désactivée.`). Si le niveau n’est pas valide (par exemple `/thinking big`), la commande est rejetée avec une indication et l’état de la session reste inchangé.
- Envoyez `/think` (ou `/think:`) sans argument pour afficher le niveau de réflexion actuel.

## Application par agent

- **OpenClaw intégré** : le niveau résolu est transmis à l’environnement d’exécution de l’agent OpenClaw dans le processus.
- **Moteur CLI Claude** : les niveaux concrets autres que `off` sont transmis à Claude Code sous forme de `--effort` lors de l’utilisation de `claude-cli` ; `adaptive` supprime les indicateurs d’effort configurés et délègue l’effort effectif à l’environnement, aux paramètres et aux valeurs par défaut du modèle de Claude Code. Consultez [Moteurs CLI](/fr/gateway/cli-backends).

## Mode rapide (/fast)

- Niveaux : `auto|on|off|default`.
- Un message contenant uniquement la directive active ou désactive un remplacement du mode rapide pour la session et répond `Mode rapide défini sur auto.`, `Mode rapide activé.` ou `Mode rapide désactivé.`. Utilisez `/fast default` pour effacer le remplacement de session et hériter de la valeur par défaut configurée ; les alias comprennent `inherit`, `clear`, `reset` et `unpin`.
- Envoyez `/fast` (ou `/fast status`) sans mode pour afficher l’état effectif actuel du mode rapide.
- OpenClaw résout le mode rapide dans l’ordre suivant :
  1. Remplacement `/fast auto|on|off` intégré ou seul dans le message (`/fast default` efface cette couche)
  2. Remplacement de session
  3. Valeur par défaut propre à l’agent (`agents.list[].fastModeDefault`)
  4. Configuration propre au modèle : `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Repli : `off`
- `auto` conserve le mode de session ou de configuration sur auto, mais résout chaque nouvel appel de modèle indépendamment. Les appels qui commencent avant le délai d’arrêt automatique ont le mode rapide activé ; les appels ultérieurs de nouvelle tentative, de repli, de résultat d’outil ou de continuation commencent avec le mode rapide désactivé. Le délai d’arrêt est de 60 secondes par défaut ; définissez `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` sur le modèle actif pour le modifier.
- Pour `openai/*`, le mode rapide correspond au traitement prioritaire d’OpenAI en envoyant `service_tier=priority` dans les requêtes Responses prises en charge.
- Pour les modèles `openai/*` / `openai-codex/*` reposant sur Codex, le mode rapide envoie le même indicateur `service_tier=priority` dans les réponses Codex. Les tours natifs du serveur d’application Codex ne reçoivent le niveau que lors de `turn/start` ou du démarrage ou de la reprise d’un fil ; `auto` ne peut donc pas modifier le niveau d’un tour de serveur d’application déjà en cours. Il s’applique au prochain tour de modèle lancé par OpenClaw.
- Pour les requêtes publiques directes `anthropic/*`, y compris le trafic authentifié par OAuth envoyé à `api.anthropic.com`, le mode rapide correspond aux niveaux de service Anthropic : `/fast on` définit `service_tier=auto`, tandis que `/fast off` définit `service_tier=standard_only`.
- Pour `minimax/*` sur le chemin compatible avec Anthropic, `/fast on` (ou `params.fastMode: true`) remplace `MiniMax-M2.7` par `MiniMax-M2.7-highspeed`.
- Les paramètres de modèle Anthropic explicites `serviceTier` / `service_tier` remplacent la valeur par défaut du mode rapide lorsque les deux sont définis. OpenClaw ignore toujours l’injection du niveau de service Anthropic pour les URL de base de proxy non Anthropic.
- `/status` affiche `Fast` lorsque le mode rapide est activé et `Fast:auto` lorsque le mode configuré est auto.

## Directives de verbosité (/verbose ou /v)

- Niveaux : `on` (minimal) | `full` | `off` (par défaut).
- Un message contenant uniquement la directive active ou désactive la verbosité de la session et répond `Journalisation détaillée activée.` / `Journalisation détaillée désactivée.` ; les niveaux non valides renvoient une indication sans modifier l’état.
- `/verbose off` enregistre un remplacement explicite pour la session ; effacez-le depuis l’interface des sessions en choisissant `inherit`.
- Les expéditeurs autorisés des canaux externes peuvent conserver le remplacement de verbosité de la session. Les clients internes du Gateway ou du clavardage web ont besoin de `operator.admin` pour le conserver.
- Une directive intégrée affecte uniquement ce message ; sinon, les valeurs par défaut de session ou globales s’appliquent.
- Envoyez `/verbose` (ou `/verbose:`) sans argument pour afficher le niveau de verbosité actuel.
- Lorsque la verbosité est activée, les agents qui émettent des résultats d’outil structurés renvoient chaque appel d’outil dans son propre message contenant uniquement des métadonnées, précédé de `<emoji> <tool-name>: <arg>` lorsque ces informations sont disponibles. Ces résumés d’outils sont envoyés dès le démarrage de chaque outil, dans des bulles distinctes, et non sous forme de deltas diffusés en continu.
- Les résumés d’échec des outils restent visibles en mode normal, mais les suffixes contenant les détails bruts des erreurs sont masqués sauf si la verbosité est définie sur `full`.
- Lorsque la verbosité est définie sur `full`, les sorties des outils sont également transmises après leur achèvement, dans une bulle distincte et tronquées à une longueur sûre. Si vous utilisez `/verbose on|full|off` pendant une exécution en cours, les bulles d’outils suivantes respectent le nouveau réglage.
- `agents.defaults.toolProgressDetail` contrôle la forme des résumés d’outils `/verbose` et des lignes d’outils dans les brouillons de progression. Utilisez `"explain"` (par défaut) pour des libellés humains compacts tels que `🛠️ Exécution : vérification de la syntaxe JS` ; utilisez `"raw"` si vous souhaitez également ajouter la commande ou les détails bruts pour le débogage. La valeur `agents.list[].toolProgressDetail` propre à l’agent remplace la valeur par défaut.
  - `explain` : `🛠️ Exécution : vérifier la syntaxe JS de /tmp/app.js`
  - `raw` : `🛠️ Exécution : vérifier la syntaxe JS de /tmp/app.js, node --check /tmp/app.js`

## Directives de traçage des plugins (/trace)

- Niveaux : `on` | `off` (par défaut).
- Un message contenant uniquement la directive active ou désactive la sortie de traçage des plugins pour la session et répond `Traçage des plugins activé.` / `Traçage des plugins désactivé.`.
- Une directive intégrée affecte uniquement ce message ; sinon, les valeurs par défaut de session ou globales s’appliquent.
- Envoyez `/trace` (ou `/trace:`) sans argument pour afficher le niveau de traçage actuel.
- `/trace` a une portée plus restreinte que `/verbose` : il expose uniquement les lignes de traçage et de débogage appartenant aux plugins, telles que les résumés de débogage d’Active Memory.
- Les lignes de traçage peuvent apparaître dans `/status` et dans un message de diagnostic de suivi après la réponse normale de l’assistant.

## Visibilité du raisonnement (/reasoning)

- Niveaux : `on|off|stream`.
- Un message contenant uniquement la directive détermine si les blocs de raisonnement sont affichés dans les réponses.
- Lorsque cette option est activée, le raisonnement est envoyé dans un **message distinct** préfixé par `Thinking`.
- `stream` : diffuse le raisonnement pendant la génération de la réponse lorsque le canal actif prend en charge les aperçus du raisonnement, puis envoie la réponse finale sans le raisonnement.
- Alias : `/reason`.
- Envoyez `/reasoning` (ou `/reasoning:`) sans argument pour afficher le niveau de raisonnement actuel.
- Ordre de résolution : directive en ligne, puis remplacement de session, puis valeur par défaut propre à l’agent (`agents.list[].reasoningDefault`), puis valeur globale par défaut (`agents.defaults.reasoningDefault`), puis valeur de repli (`off`).

Les balises de raisonnement mal formées des modèles locaux sont traitées de manière prudente. Les blocs `<think>...</think>` fermés restent masqués dans les réponses normales, tout comme le raisonnement non fermé qui suit du texte déjà visible. Si une réponse est entièrement enveloppée dans une seule balise ouvrante non fermée et serait autrement transmise comme un texte vide, OpenClaw supprime la balise ouvrante mal formée et transmet le texte restant.

## Voir aussi

- La documentation du mode élevé se trouve dans [Mode élevé](/fr/tools/elevated).

## Heartbeats

- Le corps de la sonde Heartbeat correspond à l’invite Heartbeat configurée (par défaut : `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Les directives en ligne d’un message Heartbeat s’appliquent comme d’habitude (mais évitez de modifier les valeurs par défaut de la session depuis les Heartbeats).
- Par défaut, la livraison des Heartbeats comprend uniquement la charge utile finale. Pour envoyer également le message `Thinking` distinct (lorsqu’il est disponible), définissez `agents.defaults.heartbeat.includeReasoning: true` ou, pour un agent donné, `agents.list[].heartbeat.includeReasoning: true`.

## Interface de discussion web

- Au chargement de la page, le sélecteur de raisonnement de la discussion web reflète le niveau enregistré de la session provenant du stockage ou de la configuration de la session entrante.
- La sélection d’un autre niveau enregistre immédiatement le remplacement de session via `sessions.patch` ; elle n’attend pas le prochain envoi et ne constitue pas un remplacement ponctuel `thinkingOnce`.
- Si un message est envoyé alors que des modifications du sélecteur de modèle, de raisonnement ou de vitesse sont encore en cours d’application, l’envoi attend la fin de toutes les mises à jour de sélecteur en attente ; si une modification échoue, le message reste non envoyé afin de permettre sa vérification.
- La première option permet toujours d’effacer le remplacement. Elle affiche `Inherited: <resolved level>`, y compris `Inherited: Off` lorsque le raisonnement hérité est désactivé.
- Les choix explicites du sélecteur utilisent directement les libellés de leur niveau tout en conservant les libellés du fournisseur lorsqu’ils sont présents (par exemple `Maximum` pour une option `max` libellée par un fournisseur).
- Le sélecteur utilise `thinkingLevels` renvoyé par la ligne ou les valeurs par défaut de session du Gateway, tandis que `thinkingOptions` est conservé comme ancienne liste de libellés. L’interface du navigateur ne conserve pas sa propre liste d’expressions régulières de fournisseurs ; les Plugins définissent les ensembles de niveaux propres aux modèles.
- `/think:<level>` continue de fonctionner et met à jour le même niveau de session enregistré, afin que les directives de discussion et le sélecteur restent synchronisés.

## Profils de fournisseurs

- Les Plugins de fournisseurs peuvent exposer `resolveThinkingProfile(ctx)` pour définir les niveaux pris en charge et le niveau par défaut du modèle.
- Les Plugins de fournisseurs qui servent de mandataires pour des modèles Claude doivent réutiliser `resolveClaudeThinkingProfile(modelId)` depuis `openclaw/plugin-sdk/provider-model-shared` afin que les catalogues Anthropic directs et ceux des mandataires restent alignés.
- Chaque niveau de profil possède un `id` canonique enregistré (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, `max` ou `ultra`) et peut inclure un `label` d’affichage. Les fournisseurs binaires utilisent `{ id: "low", label: "on" }`.
- Les points d’extension de profil reçoivent, lorsqu’elles sont disponibles, les informations fusionnées du catalogue, notamment `reasoning`, `compat.thinkingFormat` et `compat.supportedReasoningEfforts`. Utilisez ces informations pour n’exposer des profils binaires ou personnalisés que lorsque le contrat de requête configuré prend en charge la charge utile correspondante.
- Les Plugins d’outils qui doivent valider un remplacement explicite du raisonnement doivent utiliser `api.runtime.agent.resolveThinkingPolicy({ provider, model, agentRuntime })` avec `api.runtime.agent.normalizeThinkingLevel(...)` ; ils ne doivent pas conserver leurs propres listes de niveaux par fournisseur ou modèle. Transmettez `agentRuntime` lorsque l’outil contrôle le chemin d’exécution, par exemple pour une exécution toujours intégrée.
- Les Plugins d’outils ayant accès aux métadonnées configurées de modèles personnalisés peuvent transmettre `catalog` à `resolveThinkingPolicy` afin que les activations explicites de `compat.supportedReasoningEfforts` soient prises en compte dans la validation côté Plugin.
- Les anciens points d’extension publiés (`supportsXHighThinking`, `isBinaryThinking` et `resolveDefaultThinkingLevel`) restent disponibles comme adaptateurs de compatibilité, mais les nouveaux ensembles de niveaux personnalisés doivent utiliser `resolveThinkingProfile`.
- Les lignes et valeurs par défaut du Gateway exposent `thinkingLevels`, `thinkingOptions` et `thinkingDefault` afin que les clients ACP et de discussion affichent les mêmes identifiants et libellés de profil que ceux utilisés par la validation à l’exécution.
