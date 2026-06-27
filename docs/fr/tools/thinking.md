---
read_when:
    - Ajustement du raisonnement, du mode rapide ou de l’analyse syntaxique/des valeurs par défaut des directives de verbosité
summary: Syntaxe des directives pour /think, /fast, /verbose, /trace et visibilité du raisonnement
title: Niveaux de réflexion
x-i18n:
    generated_at: "2026-06-27T18:21:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cea488a92c6d2a5371dbe0488199f41a56b44616a2936b077644f8a8324e8129
    source_path: tools/thinking.md
    workflow: 16
---

## Ce que cela fait

- Directive en ligne dans tout corps entrant : `/t <level>`, `/think:<level>` ou `/thinking <level>`.
- Niveaux (alias) : `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → « think »
  - low → « think hard »
  - medium → « think harder »
  - high → « ultrathink » (budget maximal)
  - xhigh → « ultrathink+ » (modèles GPT-5.2+ et Codex, ainsi qu’effort Anthropic Claude Opus 4.7+)
  - adaptive → réflexion adaptative gérée par le fournisseur (prise en charge pour Claude 4.6 sur Anthropic/Bedrock, Anthropic Claude Opus 4.7+ et la réflexion dynamique Google Gemini)
  - max → raisonnement maximal du fournisseur (Anthropic Claude Opus 4.7+ ; Ollama le mappe vers son effort `think` natif le plus élevé)
  - `x-high`, `x_high`, `extra-high`, `extra high` et `extra_high` correspondent à `xhigh`.
  - `highest` correspond à `high`.
- Notes sur les fournisseurs :
  - Les menus et sélecteurs de réflexion sont pilotés par les profils de fournisseur. Les Plugins de fournisseur déclarent l’ensemble exact de niveaux pour le modèle sélectionné, y compris des libellés comme le binaire `on`.
  - `adaptive`, `xhigh` et `max` ne sont annoncés que pour les profils fournisseur/modèle qui les prennent en charge. Les directives typées pour des niveaux non pris en charge sont rejetées avec les options valides de ce modèle.
  - Les niveaux non pris en charge déjà stockés sont remappés selon le rang du profil de fournisseur. `adaptive` revient à `medium` sur les modèles non adaptatifs, tandis que `xhigh` et `max` reviennent au plus grand niveau non désactivé pris en charge pour le modèle sélectionné.
  - Les modèles Anthropic Claude 4.6 utilisent `adaptive` par défaut quand aucun niveau de réflexion explicite n’est défini.
  - Anthropic Claude Opus 4.8 et Opus 4.7 gardent la réflexion désactivée sauf si vous définissez explicitement un niveau de réflexion. La valeur par défaut d’effort propre au fournisseur pour Opus 4.8 est `high` après l’activation de la réflexion adaptative.
  - Anthropic Claude Opus 4.7+ mappe `/think xhigh` vers la réflexion adaptative plus `output_config.effort: "xhigh"`, car `/think` est une directive de réflexion et `xhigh` est le réglage d’effort d’Opus.
  - Anthropic Claude Opus 4.7+ expose aussi `/think max` ; il correspond au même chemin d’effort maximal propre au fournisseur.
  - Les modèles Direct DeepSeek V4 exposent `/think xhigh|max` ; les deux correspondent à DeepSeek `reasoning_effort: "max"`, tandis que les niveaux inférieurs non désactivés correspondent à `high`.
  - Les modèles DeepSeek V4 routés par OpenRouter exposent `/think xhigh` et envoient les valeurs `reasoning_effort` prises en charge par OpenRouter. Les remplacements `max` stockés reviennent à `xhigh`.
  - Les modèles Ollama compatibles avec la réflexion exposent `/think low|medium|high|max` ; `max` correspond à `think: "high"` natif, car l’API native d’Ollama accepte les chaînes d’effort `low`, `medium` et `high`.
  - Les modèles OpenAI GPT mappent `/think` via la prise en charge d’effort propre au modèle dans l’API Responses. `/think off` envoie `reasoning.effort: "none"` uniquement quand le modèle cible le prend en charge ; sinon OpenClaw omet la charge utile de raisonnement désactivé au lieu d’envoyer une valeur non prise en charge.
  - Les entrées de catalogue personnalisées compatibles OpenAI peuvent opter pour `/think xhigh` en définissant `models.providers.<provider>.models[].compat.supportedReasoningEfforts` de façon à inclure `"xhigh"`. Cela utilise les mêmes métadonnées de compatibilité qui mappent les charges utiles sortantes d’effort de raisonnement OpenAI, de sorte que les menus, la validation de session, la CLI d’agent et `llm-task` concordent avec le comportement de transport.
  - Les références OpenRouter Hunter Alpha configurées obsolètes ignorent l’injection de raisonnement proxy, car cette route retirée pouvait renvoyer le texte de réponse finale via les champs de raisonnement.
  - Google Gemini mappe `/think adaptive` vers la réflexion dynamique propre au fournisseur Gemini. Les requêtes Gemini 3 omettent un `thinkingLevel` fixe, tandis que les requêtes Gemini 2.5 envoient `thinkingBudget: -1` ; les niveaux fixes correspondent encore au `thinkingLevel` ou au budget Gemini le plus proche pour cette famille de modèles.
  - MiniMax M2.x (`minimax/MiniMax-M2*`) sur le chemin de diffusion compatible Anthropic utilise par défaut `thinking: { type: "disabled" }` sauf si vous définissez explicitement la réflexion dans les paramètres du modèle ou les paramètres de requête. Cela évite les deltas `reasoning_content` divulgués par le format de flux Anthropic non natif de M2.x. MiniMax-M3 (et M3.x) est exempté : M3 émet des blocs de réflexion Anthropic corrects et renvoie un contenu vide quand la réflexion est désactivée ; OpenClaw garde donc M3 sur le chemin de réflexion omis/adaptatif du fournisseur.
  - Z.AI (`zai/*`) est binaire (`on`/`off`) pour la plupart des modèles GLM. GLM-5.2 fait exception : il expose `/think off|low|high|max`, mappe `low` et `high` vers Z.AI `reasoning_effort: "high"`, et mappe `max` vers `reasoning_effort: "max"`.
  - Moonshot Kimi K2.7 Code (`moonshot/kimi-k2.7-code`) réfléchit toujours. Son profil expose uniquement `on`, et OpenClaw omet le champ sortant `thinking` comme l’exige Moonshot. Les autres modèles `moonshot/*` mappent `/think off` vers `thinking: { type: "disabled" }` et tout niveau non `off` vers `thinking: { type: "enabled" }`. Quand la réflexion est activée, Moonshot accepte seulement `tool_choice` `auto|none` ; OpenClaw normalise les valeurs incompatibles vers `auto`.

## Ordre de résolution

1. Directive en ligne dans le message (s’applique uniquement à ce message).
2. Remplacement de session (défini en envoyant un message composé uniquement d’une directive).
3. Valeur par défaut par agent (`agents.list[].thinkingDefault` dans la configuration).
4. Valeur par défaut globale (`agents.defaults.thinkingDefault` dans la configuration).
5. Repli : valeur par défaut déclarée par le fournisseur lorsqu’elle est disponible ; sinon les modèles capables de raisonnement se résolvent en `medium` ou au niveau non `off` pris en charge le plus proche pour ce modèle, et les modèles sans raisonnement restent sur `off`.

## Définir une valeur par défaut de session

- Envoyez un message contenant **uniquement** la directive (espaces autorisés), par exemple `/think:medium` ou `/t high`.
- Cela reste valable pour la session actuelle (par expéditeur par défaut). Utilisez `/think default` pour effacer le remplacement de session et hériter de la valeur configurée/du fournisseur par défaut ; les alias incluent `inherit`, `clear`, `reset` et `unpin`.
- `/think off` stocke un remplacement explicite désactivé. Il désactive la réflexion jusqu’à ce que vous changiez ou effaciez le remplacement de session.
- Une réponse de confirmation est envoyée (`Thinking level set to high.` / `Thinking disabled.`). Si le niveau est invalide (par exemple `/thinking big`), la commande est rejetée avec un indice et l’état de session reste inchangé.
- Envoyez `/think` (ou `/think:`) sans argument pour voir le niveau de réflexion actuel.

## Application par agent

- **OpenClaw intégré** : le niveau résolu est transmis au runtime d’agent OpenClaw dans le processus.
- **Backend CLI Claude** : les niveaux non désactivés sont transmis à Claude Code sous forme de `--effort` lors de l’utilisation de `claude-cli` ; voir [backends CLI](/fr/gateway/cli-backends).

## Mode rapide (/fast)

- Niveaux : `auto|on|off|default`.
- Un message composé uniquement d’une directive active/désactive un remplacement de mode rapide de session et répond `Fast mode set to auto.`, `Fast mode enabled.` ou `Fast mode disabled.`. Utilisez `/fast default` pour effacer le remplacement de session et hériter de la valeur configurée par défaut ; les alias incluent `inherit`, `clear`, `reset` et `unpin`.
- Envoyez `/fast` (ou `/fast status`) sans mode pour voir l’état effectif actuel du mode rapide.
- OpenClaw résout le mode rapide dans cet ordre :
  1. Remplacement en ligne/par directive seule `/fast auto|on|off` (`/fast default` efface cette couche)
  2. Remplacement de session
  3. Valeur par défaut par agent (`agents.list[].fastModeDefault`)
  4. Configuration par modèle : `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Repli : `off`
- `auto` conserve le mode session/configuration comme automatique, mais résout chaque nouvel appel de modèle indépendamment. Les appels qui démarrent avant le seuil automatique ont le mode rapide activé ; les appels ultérieurs de nouvelle tentative, de repli, de résultat d’outil ou de continuation démarrent avec le mode rapide désactivé. Le seuil est de 60 secondes par défaut ; définissez `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` sur le modèle actif pour le modifier.
- Pour `openai/*`, le mode rapide correspond au traitement prioritaire OpenAI en envoyant `service_tier=priority` sur les requêtes Responses prises en charge.
- Pour les modèles `openai/*` / `openai-codex/*` adossés à Codex, le mode rapide envoie le même indicateur `service_tier=priority` sur les Responses Codex. Les tours du serveur d’application Codex natif reçoivent le niveau uniquement sur `turn/start` ou au démarrage/reprise du fil ; `auto` ne peut donc pas changer le niveau d’un tour de serveur d’application déjà en cours d’exécution, il s’applique au prochain tour de modèle lancé par OpenClaw.
- Pour les requêtes publiques directes `anthropic/*`, y compris le trafic authentifié par OAuth envoyé à `api.anthropic.com`, le mode rapide correspond aux niveaux de service Anthropic : `/fast on` définit `service_tier=auto`, `/fast off` définit `service_tier=standard_only`.
- Pour `minimax/*` sur le chemin compatible Anthropic, `/fast on` (ou `params.fastMode: true`) réécrit `MiniMax-M2.7` en `MiniMax-M2.7-highspeed`.
- Les paramètres de modèle Anthropic explicites `serviceTier` / `service_tier` remplacent la valeur par défaut du mode rapide quand les deux sont définis. OpenClaw ignore toujours l’injection de niveau de service Anthropic pour les URL de base proxy non Anthropic.
- `/status` affiche `Fast` quand le mode rapide est activé et `Fast:auto` quand le mode configuré est automatique.

## Directives détaillées (/verbose ou /v)

- Niveaux : `on` (minimal) | `full` | `off` (par défaut).
- Un message composé uniquement d’une directive active/désactive le mode détaillé de session et répond `Verbose logging enabled.` / `Verbose logging disabled.` ; les niveaux invalides renvoient un indice sans modifier l’état.
- `/verbose off` stocke un remplacement de session explicite ; effacez-le via l’interface utilisateur Sessions en choisissant `inherit`.
- Les expéditeurs de canaux externes autorisés peuvent persister le remplacement détaillé de session. Les clients internes Gateway/webchat ont besoin de `operator.admin` pour le persister.
- Une directive en ligne affecte uniquement ce message ; les valeurs par défaut de session/globales s’appliquent sinon.
- Envoyez `/verbose` (ou `/verbose:`) sans argument pour voir le niveau détaillé actuel.
- Quand le mode détaillé est activé, les agents qui émettent des résultats d’outils structurés renvoient chaque appel d’outil comme son propre message uniquement métadonnées, préfixé par `<emoji> <tool-name>: <arg>` lorsque disponible. Ces résumés d’outils sont envoyés dès que chaque outil démarre (bulles séparées), et non comme deltas de diffusion.
- Les résumés d’échec d’outil restent visibles en mode normal, mais les suffixes de détail d’erreur bruts sont masqués sauf si le mode détaillé est `full`.
- Quand le mode détaillé est `full`, les sorties d’outils sont aussi transmises après l’achèvement (bulle séparée, tronquée à une longueur sûre). Si vous basculez `/verbose on|full|off` pendant qu’une exécution est en cours, les bulles d’outil suivantes respectent le nouveau réglage.
- `agents.defaults.toolProgressDetail` contrôle la forme des résumés d’outils `/verbose` et des lignes d’outil de brouillon de progression. Utilisez `"explain"` (par défaut) pour des libellés humains compacts comme `🛠️ Exec: checking JS syntax` ; utilisez `"raw"` quand vous voulez aussi ajouter la commande/le détail brut pour le débogage. `agents.list[].toolProgressDetail` par agent remplace la valeur par défaut.
  - `explain` : `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw` : `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Directives de trace de Plugin (/trace)

- Niveaux : `on` | `off` (par défaut).
- Un message composé uniquement d’une directive active/désactive la sortie de trace de Plugin de session et répond `Plugin trace enabled.` / `Plugin trace disabled.`.
- Une directive en ligne affecte uniquement ce message ; les valeurs par défaut de session/globales s’appliquent sinon.
- Envoyez `/trace` (ou `/trace:`) sans argument pour voir le niveau de trace actuel.
- `/trace` est plus restreint que `/verbose` : il expose uniquement les lignes de trace/débogage appartenant au Plugin, comme les résumés de débogage Active Memory.
- Les lignes de trace peuvent apparaître dans `/status` et comme message de diagnostic de suivi après la réponse normale de l’assistant.

## Visibilité du raisonnement (/reasoning)

- Niveaux : `on|off|stream`.
- Un message composé uniquement d’une directive active/désactive l’affichage des blocs de réflexion dans les réponses.
- Quand il est activé, le raisonnement est envoyé comme **message séparé** préfixé par `Thinking`.
- `stream` : diffuse le raisonnement pendant que la réponse est générée lorsque le canal actif prend en charge les aperçus de raisonnement, puis envoie la réponse finale sans raisonnement.
- Alias : `/reason`.
- Envoyez `/reasoning` (ou `/reasoning:`) sans argument pour voir le niveau de raisonnement actuel.
- Ordre de résolution : directive en ligne, puis remplacement de session, puis valeur par défaut par agent (`agents.list[].reasoningDefault`), puis valeur par défaut globale (`agents.defaults.reasoningDefault`), puis repli (`off`).

Les balises de raisonnement de modèle local mal formées sont traitées de manière conservatrice. Les blocs `<think>...</think>` fermés restent masqués dans les réponses normales, et le raisonnement non fermé après du texte déjà visible est également masqué. Si une réponse est entièrement enveloppée dans une seule balise ouvrante non fermée et serait autrement livrée comme texte vide, OpenClaw supprime la balise ouvrante mal formée et livre le texte restant.

## Connexe

- La documentation du mode élevé se trouve dans [Mode élevé](/fr/tools/elevated).

## Heartbeats

- Le corps de la sonde Heartbeat est l’invite Heartbeat configurée (par défaut : `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Les directives en ligne dans un message Heartbeat s’appliquent comme d’habitude (mais évitez de modifier les valeurs par défaut de session depuis les Heartbeats).
- Par défaut, la livraison Heartbeat n’envoie que la charge utile finale. Pour envoyer aussi le message `Thinking` séparé (lorsqu’il est disponible), définissez `agents.defaults.heartbeat.includeReasoning: true` ou, par agent, `agents.list[].heartbeat.includeReasoning: true`.

## Interface de chat web

- Le sélecteur de réflexion du chat web reflète le niveau stocké de la session depuis le magasin/la configuration de session entrante au chargement de la page.
- Le choix d’un autre niveau écrit immédiatement la dérogation de session via `sessions.patch` ; il n’attend pas le prochain envoi et ce n’est pas une dérogation ponctuelle `thinkingOnce`.
- La première option est toujours le choix de suppression de la dérogation. Elle affiche `Inherited: <resolved level>`, y compris `Inherited: Off` lorsque la réflexion héritée est désactivée.
- Les choix explicites du sélecteur utilisent leurs libellés de niveau directs tout en préservant les libellés du fournisseur lorsqu’ils sont présents (par exemple `Maximum` pour une option `max` libellée par un fournisseur).
- Le sélecteur utilise `thinkingLevels` renvoyé par la ligne/les valeurs par défaut de session du Gateway, avec `thinkingOptions` conservé comme liste de libellés héritée. L’interface du navigateur ne conserve pas sa propre liste de regex de fournisseurs ; les plugins possèdent les ensembles de niveaux spécifiques aux modèles.
- `/think:<level>` fonctionne toujours et met à jour le même niveau de session stocké, de sorte que les directives de chat et le sélecteur restent synchronisés.

## Profils de fournisseur

- Les plugins de fournisseur peuvent exposer `resolveThinkingProfile(ctx)` pour définir les niveaux pris en charge par le modèle et la valeur par défaut.
- Les plugins de fournisseur qui relaient des modèles Claude doivent réutiliser `resolveClaudeThinkingProfile(modelId)` depuis `openclaw/plugin-sdk/provider-model-shared` afin que les catalogues Anthropic directs et les catalogues relayés restent alignés.
- Chaque niveau de profil possède un `id` canonique stocké (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` ou `max`) et peut inclure un `label` d’affichage. Les fournisseurs binaires utilisent `{ id: "low", label: "on" }`.
- Les hooks de profil reçoivent les faits de catalogue fusionnés lorsqu’ils sont disponibles, notamment `reasoning`, `compat.thinkingFormat` et `compat.supportedReasoningEfforts`. Utilisez ces faits pour exposer des profils binaires ou personnalisés uniquement lorsque le contrat de requête configuré prend en charge la charge utile correspondante.
- Les plugins d’outil qui doivent valider une dérogation explicite de réflexion doivent utiliser `api.runtime.agent.resolveThinkingPolicy({ provider, model })` plus `api.runtime.agent.normalizeThinkingLevel(...)` ; ils ne doivent pas conserver leurs propres listes de niveaux fournisseur/modèle.
- Les plugins d’outil ayant accès aux métadonnées de modèle personnalisé configurées peuvent passer `catalog` à `resolveThinkingPolicy` afin que les opt-ins `compat.supportedReasoningEfforts` soient reflétés dans la validation côté plugin.
- Les hooks hérités publiés (`supportsXHighThinking`, `isBinaryThinking` et `resolveDefaultThinkingLevel`) restent comme adaptateurs de compatibilité, mais les nouveaux ensembles de niveaux personnalisés doivent utiliser `resolveThinkingProfile`.
- Les lignes/valeurs par défaut du Gateway exposent `thinkingLevels`, `thinkingOptions` et `thinkingDefault` afin que les clients ACP/chat affichent les mêmes ids et libellés de profil que ceux utilisés par la validation d’exécution.
