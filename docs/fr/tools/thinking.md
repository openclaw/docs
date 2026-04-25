---
read_when:
    - Ajuster l’analyse ou les valeurs par défaut des directives de réflexion, du mode rapide ou du mode verbeux
summary: Syntaxe des directives pour `/think`, `/fast`, `/verbose`, `/trace` et la visibilité du raisonnement
title: Niveaux de réflexion
x-i18n:
    generated_at: "2026-04-25T13:59:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0537f10d3dd3251ac41590bebd2d83ba8b2562725c322040b20f32547c8af88d
    source_path: tools/thinking.md
    workflow: 15
---

## Ce que cela fait

- Directive inline dans tout corps entrant : `/t <level>`, `/think:<level>` ou `/thinking <level>`.
- Niveaux (alias) : `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → « penser »
  - low → « réfléchir sérieusement »
  - medium → « réfléchir davantage »
  - high → « ultraréflexion » (budget maximal)
  - xhigh → « ultraréflexion+ » (modèles GPT-5.2+ et Codex, plus effort Anthropic Claude Opus 4.7)
  - adaptive → réflexion adaptative gérée par le fournisseur (prise en charge pour Claude 4.6 sur Anthropic/Bedrock, Anthropic Claude Opus 4.7 et la réflexion dynamique Google Gemini)
  - max → raisonnement maximal du fournisseur (actuellement Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high` et `extra_high` sont mappés vers `xhigh`.
  - `highest` est mappé vers `high`.
- Remarques sur les fournisseurs :
  - Les menus et sélecteurs de réflexion sont pilotés par le profil du fournisseur. Les Plugins fournisseurs déclarent l’ensemble exact de niveaux pour le modèle sélectionné, y compris des libellés comme le binaire `on`.
  - `adaptive`, `xhigh` et `max` ne sont annoncés que pour les profils `provider/model` qui les prennent en charge. Les directives typées pour des niveaux non pris en charge sont rejetées avec les options valides de ce modèle.
  - Les niveaux non pris en charge déjà stockés sont remappés selon le rang du profil fournisseur. `adaptive` revient à `medium` sur les modèles non adaptatifs, tandis que `xhigh` et `max` reviennent au plus grand niveau pris en charge autre que `off` pour le modèle sélectionné.
  - Les modèles Anthropic Claude 4.6 utilisent `adaptive` par défaut lorsqu’aucun niveau de réflexion explicite n’est défini.
  - Anthropic Claude Opus 4.7 n’utilise pas par défaut la réflexion adaptative. La valeur par défaut d’effort de son API reste gérée par le fournisseur, sauf si vous définissez explicitement un niveau de réflexion.
  - Anthropic Claude Opus 4.7 mappe `/think xhigh` vers la réflexion adaptative plus `output_config.effort: "xhigh"`, parce que `/think` est une directive de réflexion et `xhigh` est le paramètre d’effort d’Opus 4.7.
  - Anthropic Claude Opus 4.7 expose également `/think max` ; il est mappé au même chemin d’effort maximal géré par le fournisseur.
  - Les modèles OpenAI GPT mappent `/think` via la prise en charge d’effort spécifique au modèle de l’API Responses. `/think off` envoie `reasoning.effort: "none"` uniquement lorsque le modèle cible le prend en charge ; sinon OpenClaw omet la charge utile de raisonnement désactivé au lieu d’envoyer une valeur non prise en charge.
  - Google Gemini mappe `/think adaptive` vers la réflexion dynamique gérée par le fournisseur de Gemini. Les requêtes Gemini 3 omettent un `thinkingLevel` fixe, tandis que les requêtes Gemini 2.5 envoient `thinkingBudget: -1` ; les niveaux fixes sont toujours mappés vers le `thinkingLevel` ou le budget Gemini le plus proche pour cette famille de modèles.
  - MiniMax (`minimax/*`) sur le chemin de streaming compatible Anthropic utilise par défaut `thinking: { type: "disabled" }` sauf si vous définissez explicitement la réflexion dans les paramètres du modèle ou de la requête. Cela évite les deltas `reasoning_content` qui fuient du format de flux Anthropic non natif de MiniMax.
  - Z.AI (`zai/*`) ne prend en charge qu’une réflexion binaire (`on`/`off`). Tout niveau autre que `off` est traité comme `on` (mappé vers `low`).
  - Moonshot (`moonshot/*`) mappe `/think off` vers `thinking: { type: "disabled" }` et tout niveau autre que `off` vers `thinking: { type: "enabled" }`. Lorsque la réflexion est activée, Moonshot n’accepte que `tool_choice` `auto|none` ; OpenClaw normalise les valeurs incompatibles vers `auto`.

## Ordre de résolution

1. Directive inline sur le message (s’applique uniquement à ce message).
2. Remplacement de session (défini en envoyant un message contenant uniquement une directive).
3. Valeur par défaut par agent (`agents.list[].thinkingDefault` dans la configuration).
4. Valeur par défaut globale (`agents.defaults.thinkingDefault` dans la configuration).
5. Repli : valeur par défaut déclarée par le fournisseur lorsqu’elle est disponible ; sinon les modèles capables de raisonner se résolvent vers `medium` ou le niveau pris en charge le plus proche autre que `off` pour ce modèle, et les modèles sans raisonnement restent à `off`.

## Définir une valeur par défaut de session

- Envoyez un message qui est **uniquement** la directive (espaces autorisés), par exemple `/think:medium` ou `/t high`.
- Cela reste actif pour la session en cours (par expéditeur par défaut) ; effacé par `/think:off` ou par la réinitialisation sur inactivité de session.
- Une réponse de confirmation est envoyée (`Thinking level set to high.` / `Thinking disabled.`). Si le niveau est invalide (par exemple `/thinking big`), la commande est rejetée avec une indication et l’état de la session reste inchangé.
- Envoyez `/think` (ou `/think:`) sans argument pour voir le niveau de réflexion actuel.

## Application par agent

- **Pi embarqué** : le niveau résolu est transmis au runtime d’agent Pi en processus.

## Mode rapide (/fast)

- Niveaux : `on|off`.
- Un message contenant uniquement la directive active un remplacement de session pour le mode rapide et répond `Fast mode enabled.` / `Fast mode disabled.`.
- Envoyez `/fast` (ou `/fast status`) sans mode pour voir l’état effectif actuel du mode rapide.
- OpenClaw résout le mode rapide dans cet ordre :
  1. `/fast on|off` inline / en directive seule
  2. Remplacement de session
  3. Valeur par défaut par agent (`agents.list[].fastModeDefault`)
  4. Configuration par modèle : `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Repli : `off`
- Pour `openai/*`, le mode rapide est mappé au traitement prioritaire OpenAI en envoyant `service_tier=priority` sur les requêtes Responses prises en charge.
- Pour `openai-codex/*`, le mode rapide envoie le même drapeau `service_tier=priority` sur Codex Responses. OpenClaw conserve un seul bouton `/fast` partagé entre les deux chemins d’authentification.
- Pour les requêtes publiques directes `anthropic/*`, y compris le trafic authentifié OAuth envoyé à `api.anthropic.com`, le mode rapide est mappé aux niveaux de service Anthropic : `/fast on` définit `service_tier=auto`, `/fast off` définit `service_tier=standard_only`.
- Pour `minimax/*` sur le chemin compatible Anthropic, `/fast on` (ou `params.fastMode: true`) réécrit `MiniMax-M2.7` en `MiniMax-M2.7-highspeed`.
- Les paramètres explicites de modèle Anthropic `serviceTier` / `service_tier` remplacent la valeur par défaut du mode rapide lorsque les deux sont définis. OpenClaw ignore toujours l’injection de niveau de service Anthropic pour les URL de base proxy non Anthropic.
- `/status` affiche `Fast` uniquement lorsque le mode rapide est activé.

## Directives verbeuses (/verbose ou /v)

- Niveaux : `on` (minimal) | `full` | `off` (par défaut).
- Un message contenant uniquement la directive active le mode verbeux de la session et répond `Verbose logging enabled.` / `Verbose logging disabled.` ; les niveaux invalides renvoient une indication sans modifier l’état.
- `/verbose off` stocke un remplacement explicite de session ; effacez-le via l’UI Sessions en choisissant `inherit`.
- La directive inline n’affecte que ce message ; sinon les valeurs par défaut de session/globales s’appliquent.
- Envoyez `/verbose` (ou `/verbose:`) sans argument pour voir le niveau verbeux actuel.
- Lorsque le mode verbeux est activé, les agents qui émettent des résultats d’outil structurés (Pi, autres agents JSON) renvoient chaque appel d’outil comme son propre message de métadonnées uniquement, préfixé par `<emoji> <tool-name>: <arg>` lorsque disponible (chemin/commande). Ces résumés d’outils sont envoyés dès le démarrage de chaque outil (bulles séparées), et non comme deltas de streaming.
- Les résumés d’échec d’outil restent visibles en mode normal, mais les suffixes de détail d’erreur bruts sont masqués sauf si le mode verbeux est `on` ou `full`.
- Lorsque le mode verbeux est `full`, les sorties d’outil sont également transmises après achèvement (bulle séparée, tronquée à une longueur sûre). Si vous basculez `/verbose on|full|off` pendant qu’une exécution est en cours, les bulles d’outil suivantes respecteront le nouveau réglage.

## Directives de trace Plugin (/trace)

- Niveaux : `on` | `off` (par défaut).
- Un message contenant uniquement la directive active la sortie de trace Plugin de la session et répond `Plugin trace enabled.` / `Plugin trace disabled.`.
- La directive inline n’affecte que ce message ; sinon les valeurs par défaut de session/globales s’appliquent.
- Envoyez `/trace` (ou `/trace:`) sans argument pour voir le niveau de trace actuel.
- `/trace` est plus étroit que `/verbose` : il n’expose que les lignes de trace/débogage appartenant au Plugin, telles que les résumés de débogage Active Memory.
- Les lignes de trace peuvent apparaître dans `/status` et comme message de diagnostic de suivi après la réponse normale de l’assistant.

## Visibilité du raisonnement (/reasoning)

- Niveaux : `on|off|stream`.
- Un message contenant uniquement la directive active ou désactive l’affichage des blocs de réflexion dans les réponses.
- Lorsqu’il est activé, le raisonnement est envoyé comme **message séparé** préfixé par `Reasoning:`.
- `stream` (Telegram uniquement) : diffuse le raisonnement dans la bulle de brouillon Telegram pendant la génération de la réponse, puis envoie la réponse finale sans raisonnement.
- Alias : `/reason`.
- Envoyez `/reasoning` (ou `/reasoning:`) sans argument pour voir le niveau de raisonnement actuel.
- Ordre de résolution : directive inline, puis remplacement de session, puis valeur par défaut par agent (`agents.list[].reasoningDefault`), puis repli (`off`).

## Lié

- La documentation du mode élevé se trouve dans [Mode élevé](/fr/tools/elevated).

## Heartbeats

- Le corps de la sonde Heartbeat est l’invite Heartbeat configurée (par défaut : `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Les directives inline dans un message Heartbeat s’appliquent normalement (mais évitez de modifier les valeurs par défaut de session depuis les Heartbeats).
- La livraison Heartbeat utilise par défaut uniquement la charge utile finale. Pour envoyer aussi le message séparé `Reasoning:` (lorsqu’il est disponible), définissez `agents.defaults.heartbeat.includeReasoning: true` ou par agent `agents.list[].heartbeat.includeReasoning: true`.

## UI de chat web

- Le sélecteur de réflexion du chat web reflète le niveau stocké de la session depuis le magasin/configuration de session entrante au chargement de la page.
- Le choix d’un autre niveau écrit immédiatement le remplacement de session via `sessions.patch` ; il n’attend pas le prochain envoi et ce n’est pas un remplacement ponctuel `thinkingOnce`.
- La première option est toujours `Default (<resolved level>)`, où la valeur par défaut résolue provient du profil de réflexion du fournisseur du modèle de session actif ainsi que de la même logique de repli utilisée par `/status` et `session_status`.
- Le sélecteur utilise `thinkingLevels` renvoyé par la ligne/les valeurs par défaut de session Gateway, avec `thinkingOptions` conservé comme liste de libellés héritée. L’UI du navigateur ne conserve pas sa propre liste regex de fournisseurs ; les Plugins possèdent les ensembles de niveaux spécifiques aux modèles.
- `/think:<level>` fonctionne toujours et met à jour le même niveau de session stocké, de sorte que les directives de chat et le sélecteur restent synchronisés.

## Profils fournisseur

- Les Plugins fournisseurs peuvent exposer `resolveThinkingProfile(ctx)` pour définir les niveaux pris en charge par le modèle et sa valeur par défaut.
- Chaque niveau du profil possède un `id` canonique stocké (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` ou `max`) et peut inclure un `label` d’affichage. Les fournisseurs binaires utilisent `{ id: "low", label: "on" }`.
- Les hooks hérités publiés (`supportsXHighThinking`, `isBinaryThinking` et `resolveDefaultThinkingLevel`) restent comme adaptateurs de compatibilité, mais les nouveaux ensembles de niveaux personnalisés doivent utiliser `resolveThinkingProfile`.
- Les lignes/valeurs par défaut Gateway exposent `thinkingLevels`, `thinkingOptions` et `thinkingDefault` afin que les clients ACP/chat affichent les mêmes ids et libellés de profil que ceux utilisés par la validation du runtime.
