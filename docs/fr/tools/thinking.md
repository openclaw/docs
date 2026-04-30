---
read_when:
    - Ajustement de l’analyse syntaxique ou des valeurs par défaut des directives de raisonnement, de mode rapide ou de verbosité
summary: Syntaxe des directives pour /think, /fast, /verbose, /trace et visibilité du raisonnement
title: Niveaux de réflexion
x-i18n:
    generated_at: "2026-04-30T16:30:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9adf065e46cb64e4c2149b95ecd69ed887a17e2eff5a5569894defa3e7217b7
    source_path: tools/thinking.md
    workflow: 16
---

## Ce que cela fait

- Directive intégrée dans tout corps entrant : `/t <level>`, `/think:<level>` ou `/thinking <level>`.
- Niveaux (alias) : `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → « think »
  - low → « think hard »
  - medium → « think harder »
  - high → « ultrathink » (budget maximal)
  - xhigh → « ultrathink+ » (modèles GPT-5.2+ et Codex, plus effort Anthropic Claude Opus 4.7)
  - adaptive → raisonnement adaptatif géré par le fournisseur (pris en charge pour Claude 4.6 sur Anthropic/Bedrock, Anthropic Claude Opus 4.7 et le raisonnement dynamique Google Gemini)
  - max → raisonnement maximal du fournisseur (Anthropic Claude Opus 4.7 ; Ollama le mappe vers son effort `think` natif le plus élevé)
  - `x-high`, `x_high`, `extra-high`, `extra high` et `extra_high` correspondent à `xhigh`.
  - `highest` correspond à `high`.
- Notes sur les fournisseurs :
  - Les menus et sélecteurs de raisonnement sont pilotés par le profil fournisseur. Les Plugins de fournisseur déclarent l’ensemble exact de niveaux pour le modèle sélectionné, y compris les libellés comme le `on` binaire.
  - `adaptive`, `xhigh` et `max` ne sont annoncés que pour les profils fournisseur/modèle qui les prennent en charge. Les directives saisies pour des niveaux non pris en charge sont rejetées avec les options valides de ce modèle.
  - Les niveaux non pris en charge déjà enregistrés sont remappés selon le rang du profil fournisseur. `adaptive` revient à `medium` sur les modèles non adaptatifs, tandis que `xhigh` et `max` reviennent au plus grand niveau non `off` pris en charge pour le modèle sélectionné.
  - Les modèles Anthropic Claude 4.6 utilisent par défaut `adaptive` quand aucun niveau de raisonnement explicite n’est défini.
  - Anthropic Claude Opus 4.7 n’utilise pas par défaut le raisonnement adaptatif. La valeur par défaut d’effort de son API reste détenue par le fournisseur, sauf si vous définissez explicitement un niveau de raisonnement.
  - Anthropic Claude Opus 4.7 mappe `/think xhigh` vers le raisonnement adaptatif plus `output_config.effort: "xhigh"`, car `/think` est une directive de raisonnement et `xhigh` est le réglage d’effort d’Opus 4.7.
  - Anthropic Claude Opus 4.7 expose aussi `/think max` ; il est mappé vers le même chemin d’effort maximal détenu par le fournisseur.
  - Les modèles DeepSeek V4 exposent `/think xhigh|max` ; les deux correspondent à `reasoning_effort: "max"` de DeepSeek, tandis que les niveaux inférieurs non `off` correspondent à `high`.
  - Les modèles Ollama compatibles avec le raisonnement exposent `/think low|medium|high|max` ; `max` correspond au `think: "high"` natif, car l’API native d’Ollama accepte les chaînes d’effort `low`, `medium` et `high`.
  - Les modèles OpenAI GPT mappent `/think` via la prise en charge d’effort propre au modèle dans l’API Responses. `/think off` envoie `reasoning.effort: "none"` uniquement quand le modèle cible le prend en charge ; sinon OpenClaw omet la charge utile de raisonnement désactivé au lieu d’envoyer une valeur non prise en charge.
  - Les entrées de catalogue personnalisées compatibles OpenAI peuvent activer `/think xhigh` en définissant `models.providers.<provider>.models[].compat.supportedReasoningEfforts` pour inclure `"xhigh"`. Cela utilise les mêmes métadonnées de compatibilité que celles qui mappent les charges utiles sortantes d’effort de raisonnement OpenAI, de sorte que les menus, la validation de session, la CLI d’agent et `llm-task` concordent avec le comportement de transport.
  - Les références obsolètes configurées OpenRouter Hunter Alpha ignorent l’injection de raisonnement par proxy, car cette route retirée pouvait renvoyer le texte de réponse finale via des champs de raisonnement.
  - Google Gemini mappe `/think adaptive` vers le raisonnement dynamique détenu par le fournisseur de Gemini. Les requêtes Gemini 3 omettent un `thinkingLevel` fixe, tandis que les requêtes Gemini 2.5 envoient `thinkingBudget: -1` ; les niveaux fixes continuent de correspondre au `thinkingLevel` ou au budget Gemini le plus proche pour cette famille de modèles.
  - MiniMax (`minimax/*`) sur le chemin de streaming compatible Anthropic utilise par défaut `thinking: { type: "disabled" }`, sauf si vous définissez explicitement le raisonnement dans les paramètres du modèle ou de la requête. Cela évite les deltas `reasoning_content` divulgués depuis le format de flux Anthropic non natif de MiniMax.
  - Z.AI (`zai/*`) ne prend en charge que le raisonnement binaire (`on`/`off`). Tout niveau non `off` est traité comme `on` (mappé vers `low`).
  - Moonshot (`moonshot/*`) mappe `/think off` vers `thinking: { type: "disabled" }` et tout niveau non `off` vers `thinking: { type: "enabled" }`. Quand le raisonnement est activé, Moonshot n’accepte que les valeurs `tool_choice` `auto|none` ; OpenClaw normalise les valeurs incompatibles vers `auto`.

## Ordre de résolution

1. Directive intégrée au message (s’applique uniquement à ce message).
2. Remplacement de session (défini en envoyant un message contenant uniquement la directive).
3. Valeur par défaut par agent (`agents.list[].thinkingDefault` dans la configuration).
4. Valeur par défaut globale (`agents.defaults.thinkingDefault` dans la configuration).
5. Repli : valeur par défaut déclarée par le fournisseur quand elle est disponible ; sinon, les modèles compatibles avec le raisonnement résolvent vers `medium` ou le niveau non `off` pris en charge le plus proche pour ce modèle, et les modèles sans raisonnement restent à `off`.

## Définir une valeur par défaut de session

- Envoyez un message qui contient **uniquement** la directive (les espaces sont autorisés), par exemple `/think:medium` ou `/t high`.
- Cela persiste pour la session actuelle (par expéditeur par défaut) ; effacé par `/think:off` ou par la réinitialisation après inactivité de la session.
- Une réponse de confirmation est envoyée (`Thinking level set to high.` / `Thinking disabled.`). Si le niveau est invalide (par exemple `/thinking big`), la commande est rejetée avec une indication et l’état de session reste inchangé.
- Envoyez `/think` (ou `/think:`) sans argument pour voir le niveau de raisonnement actuel.

## Application par agent

- **Pi intégré** : le niveau résolu est transmis au runtime de l’agent Pi dans le processus.

## Mode rapide (/fast)

- Niveaux : `on|off`.
- Un message contenant uniquement la directive active ou désactive un remplacement de mode rapide de session et répond `Fast mode enabled.` / `Fast mode disabled.`.
- Envoyez `/fast` (ou `/fast status`) sans mode pour voir l’état effectif actuel du mode rapide.
- OpenClaw résout le mode rapide dans cet ordre :
  1. `/fast on|off` intégré ou contenant uniquement la directive
  2. Remplacement de session
  3. Valeur par défaut par agent (`agents.list[].fastModeDefault`)
  4. Configuration par modèle : `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Repli : `off`
- Pour `openai/*`, le mode rapide correspond au traitement prioritaire OpenAI en envoyant `service_tier=priority` sur les requêtes Responses prises en charge.
- Pour `openai-codex/*`, le mode rapide envoie le même indicateur `service_tier=priority` sur les Responses Codex. OpenClaw conserve un seul interrupteur `/fast` partagé entre les deux chemins d’authentification.
- Pour les requêtes publiques directes `anthropic/*`, y compris le trafic authentifié par OAuth envoyé à `api.anthropic.com`, le mode rapide correspond aux niveaux de service Anthropic : `/fast on` définit `service_tier=auto`, `/fast off` définit `service_tier=standard_only`.
- Pour `minimax/*` sur le chemin compatible Anthropic, `/fast on` (ou `params.fastMode: true`) réécrit `MiniMax-M2.7` en `MiniMax-M2.7-highspeed`.
- Les paramètres de modèle Anthropic explicites `serviceTier` / `service_tier` remplacent la valeur par défaut du mode rapide quand les deux sont définis. OpenClaw ignore quand même l’injection de niveau de service Anthropic pour les URL de base proxy non Anthropic.
- `/status` affiche `Fast` uniquement quand le mode rapide est activé.

## Directives verbeuses (/verbose ou /v)

- Niveaux : `on` (minimal) | `full` | `off` (par défaut).
- Un message contenant uniquement la directive active ou désactive le mode verbeux de session et répond `Verbose logging enabled.` / `Verbose logging disabled.` ; les niveaux invalides renvoient une indication sans modifier l’état.
- `/verbose off` enregistre un remplacement explicite de session ; effacez-le via l’interface Sessions en choisissant `inherit`.
- Une directive intégrée affecte uniquement ce message ; les valeurs par défaut de session/globales s’appliquent sinon.
- Envoyez `/verbose` (ou `/verbose:`) sans argument pour voir le niveau verbeux actuel.
- Quand le mode verbeux est activé, les agents qui émettent des résultats d’outils structurés (Pi, autres agents JSON) renvoient chaque appel d’outil comme son propre message contenant uniquement des métadonnées, préfixé par `<emoji> <tool-name>: <arg>` quand c’est disponible (chemin/commande). Ces résumés d’outils sont envoyés dès que chaque outil démarre (bulles séparées), pas comme deltas de streaming.
- Les résumés d’échec d’outil restent visibles en mode normal, mais les suffixes de détail d’erreur brut sont masqués sauf si le mode verbeux est `on` ou `full`.
- Quand le mode verbeux est `full`, les sorties d’outils sont aussi transférées après l’achèvement (bulle séparée, tronquée à une longueur sûre). Si vous basculez `/verbose on|full|off` pendant qu’une exécution est en cours, les bulles d’outils suivantes respectent le nouveau réglage.

## Directives de trace de Plugin (/trace)

- Niveaux : `on` | `off` (par défaut).
- Un message contenant uniquement la directive active ou désactive la sortie de trace de Plugin de session et répond `Plugin trace enabled.` / `Plugin trace disabled.`.
- Une directive intégrée affecte uniquement ce message ; les valeurs par défaut de session/globales s’appliquent sinon.
- Envoyez `/trace` (ou `/trace:`) sans argument pour voir le niveau de trace actuel.
- `/trace` est plus restreint que `/verbose` : il expose uniquement les lignes de trace/débogage détenues par les Plugins, comme les résumés de débogage Active Memory.
- Les lignes de trace peuvent apparaître dans `/status` et comme message de diagnostic de suivi après la réponse normale de l’assistant.

## Visibilité du raisonnement (/reasoning)

- Niveaux : `on|off|stream`.
- Un message contenant uniquement la directive active ou désactive l’affichage des blocs de raisonnement dans les réponses.
- Quand elle est activée, le raisonnement est envoyé comme **message séparé** préfixé par `Reasoning:`.
- `stream` (Telegram uniquement) : diffuse le raisonnement dans la bulle de brouillon Telegram pendant la génération de la réponse, puis envoie la réponse finale sans raisonnement.
- Alias : `/reason`.
- Envoyez `/reasoning` (ou `/reasoning:`) sans argument pour voir le niveau de raisonnement actuel.
- Ordre de résolution : directive intégrée, puis remplacement de session, puis valeur par défaut par agent (`agents.list[].reasoningDefault`), puis repli (`off`).

Les balises de raisonnement de modèles locaux mal formées sont traitées de manière conservatrice. Les blocs fermés `<think>...</think>` restent masqués dans les réponses normales, et le raisonnement non fermé après du texte déjà visible est aussi masqué. Si une réponse est entièrement enveloppée dans une seule balise ouvrante non fermée et serait sinon livrée comme texte vide, OpenClaw supprime la balise ouvrante mal formée et livre le texte restant.

## Associé

- La documentation du mode élevé se trouve dans [Mode élevé](/fr/tools/elevated).

## Heartbeats

- Le corps de sonde Heartbeat est le prompt Heartbeat configuré (par défaut : `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Les directives intégrées dans un message Heartbeat s’appliquent comme d’habitude (mais évitez de modifier les valeurs par défaut de session depuis les Heartbeats).
- La livraison Heartbeat utilise par défaut uniquement la charge utile finale. Pour envoyer aussi le message `Reasoning:` séparé (quand il est disponible), définissez `agents.defaults.heartbeat.includeReasoning: true` ou, par agent, `agents.list[].heartbeat.includeReasoning: true`.

## Interface de chat web

- Le sélecteur de raisonnement du chat web reflète le niveau enregistré de la session depuis le magasin/configuration de session entrant au chargement de la page.
- Choisir un autre niveau écrit immédiatement le remplacement de session via `sessions.patch` ; il n’attend pas le prochain envoi et ce n’est pas un remplacement ponctuel `thinkingOnce`.
- La première option est toujours `Default (<resolved level>)`, où la valeur par défaut résolue provient du profil de raisonnement du fournisseur du modèle de session actif, plus la même logique de repli que celle utilisée par `/status` et `session_status`.
- Le sélecteur utilise `thinkingLevels` renvoyé par la ligne/les valeurs par défaut de session du Gateway, avec `thinkingOptions` conservé comme liste de libellés héritée. L’interface du navigateur ne conserve pas sa propre liste de regex de fournisseurs ; les Plugins détiennent les ensembles de niveaux propres aux modèles.
- `/think:<level>` fonctionne toujours et met à jour le même niveau de session enregistré, de sorte que les directives de chat et le sélecteur restent synchronisés.

## Profils de fournisseur

- Les Plugins de fournisseur peuvent exposer `resolveThinkingProfile(ctx)` pour définir les niveaux pris en charge par le modèle et la valeur par défaut.
- Les Plugins de fournisseur qui agissent comme proxy pour des modèles Claude doivent réutiliser `resolveClaudeThinkingProfile(modelId)` depuis `openclaw/plugin-sdk/provider-model-shared` afin que les catalogues Anthropic directs et proxy restent alignés.
- Chaque niveau de profil possède un `id` canonique stocké (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` ou `max`) et peut inclure un `label` d'affichage. Les fournisseurs binaires utilisent `{ id: "low", label: "on" }`.
- Les Plugins d’outil qui doivent valider une substitution explicite du raisonnement doivent utiliser `api.runtime.agent.resolveThinkingPolicy({ provider, model })` avec `api.runtime.agent.normalizeThinkingLevel(...)` ; ils ne doivent pas conserver leurs propres listes de niveaux par fournisseur/modèle.
- Les Plugins d’outil ayant accès aux métadonnées de modèles personnalisés configurées peuvent passer `catalog` à `resolveThinkingPolicy` afin que les opt-ins `compat.supportedReasoningEfforts` soient reflétés dans la validation côté Plugin.
- Les hooks hérités publiés (`supportsXHighThinking`, `isBinaryThinking` et `resolveDefaultThinkingLevel`) restent des adaptateurs de compatibilité, mais les nouveaux ensembles de niveaux personnalisés doivent utiliser `resolveThinkingProfile`.
- Les lignes/valeurs par défaut du Gateway exposent `thinkingLevels`, `thinkingOptions` et `thinkingDefault` afin que les clients ACP/chat affichent les mêmes identifiants et libellés de profil que ceux utilisés par la validation à l’exécution.
