---
read_when:
    - Ajustement de l’analyse ou des valeurs par défaut des directives de réflexion, du mode rapide ou du mode verbeux
summary: Syntaxe des directives pour /think, /fast, /verbose, /trace et la visibilité du raisonnement
title: Niveaux de réflexion
x-i18n:
    generated_at: "2026-04-21T13:37:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1b0217f6e5a5cb3400090f31ad5271ca61848a40f77d3f942851e7c2f2352886
    source_path: tools/thinking.md
    workflow: 15
---

# Niveaux de réflexion (directives `/think`)

## Ce que cela fait

- Directive en ligne dans tout corps entrant : `/t <level>`, `/think:<level>` ou `/thinking <level>`.
- Niveaux (alias) : `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → « think »
  - low → « think hard »
  - medium → « think harder »
  - high → « ultrathink » (budget max)
  - xhigh → « ultrathink+ » (effort GPT-5.2 + modèles Codex et Anthropic Claude Opus 4.7)
  - adaptive → réflexion adaptative gérée par le fournisseur (prise en charge pour Claude 4.6 sur Anthropic/Bedrock et Anthropic Claude Opus 4.7)
  - max → raisonnement maximal du fournisseur (actuellement Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high` et `extra_high` correspondent à `xhigh`.
  - `highest` correspond à `high`.
- Remarques sur les fournisseurs :
  - Les menus et sélecteurs de réflexion sont pilotés par les profils fournisseur. Les Plugins fournisseur déclarent l’ensemble exact des niveaux pour le modèle sélectionné, y compris des libellés tels que le binaire `on`.
  - `adaptive`, `xhigh` et `max` ne sont annoncés que pour les profils fournisseur/modèle qui les prennent en charge. Les directives typées pour des niveaux non pris en charge sont rejetées avec les options valides de ce modèle.
  - Les niveaux non pris en charge déjà stockés, y compris les anciennes valeurs `max` après un changement de modèle, sont remappés vers le plus grand niveau pris en charge pour le modèle sélectionné.
  - Les modèles Anthropic Claude 4.6 utilisent `adaptive` par défaut lorsqu’aucun niveau de réflexion explicite n’est défini.
  - Anthropic Claude Opus 4.7 n’utilise pas la réflexion adaptative par défaut. Son effort API par défaut reste géré par le fournisseur sauf si vous définissez explicitement un niveau de réflexion.
  - Anthropic Claude Opus 4.7 mappe `/think xhigh` vers une réflexion adaptative plus `output_config.effort: "xhigh"`, car `/think` est une directive de réflexion et `xhigh` est le réglage d’effort d’Opus 4.7.
  - Anthropic Claude Opus 4.7 expose aussi `/think max` ; il mappe vers le même chemin d’effort maximal géré par le fournisseur.
  - Les modèles OpenAI GPT mappent `/think` via la prise en charge d’effort de l’API Responses propre au modèle. `/think off` envoie `reasoning.effort: "none"` uniquement lorsque le modèle cible le prend en charge ; sinon OpenClaw omet la charge utile de raisonnement désactivé au lieu d’envoyer une valeur non prise en charge.
  - MiniMax (`minimax/*`) sur le chemin de streaming compatible Anthropic utilise par défaut `thinking: { type: "disabled" }` sauf si vous définissez explicitement la réflexion dans les paramètres du modèle ou de la requête. Cela évite les deltas `reasoning_content` fuités depuis le format de flux Anthropic non natif de MiniMax.
  - Z.AI (`zai/*`) ne prend en charge que la réflexion binaire (`on`/`off`). Tout niveau différent de `off` est traité comme `on` (mappé vers `low`).
  - Moonshot (`moonshot/*`) mappe `/think off` vers `thinking: { type: "disabled" }` et tout niveau différent de `off` vers `thinking: { type: "enabled" }`. Lorsque la réflexion est activée, Moonshot n’accepte que `tool_choice` `auto|none` ; OpenClaw normalise les valeurs incompatibles vers `auto`.

## Ordre de résolution

1. Directive en ligne dans le message (s’applique uniquement à ce message).
2. Surcharge de session (définie en envoyant un message contenant uniquement une directive).
3. Valeur par défaut par agent (`agents.list[].thinkingDefault` dans la configuration).
4. Valeur par défaut globale (`agents.defaults.thinkingDefault` dans la configuration).
5. Repli : valeur par défaut déclarée par le fournisseur lorsqu’elle existe, `low` pour les autres modèles du catalogue marqués comme capables de raisonner, sinon `off`.

## Définir une valeur par défaut de session

- Envoyez un message qui est **uniquement** la directive (espaces autorisés), par exemple `/think:medium` ou `/t high`.
- Cela persiste pour la session en cours (par expéditeur par défaut) ; effacé par `/think:off` ou par la réinitialisation après inactivité de la session.
- Une réponse de confirmation est envoyée (`Thinking level set to high.` / `Thinking disabled.`). Si le niveau est invalide (par exemple `/thinking big`), la commande est rejetée avec une indication et l’état de la session reste inchangé.
- Envoyez `/think` (ou `/think:`) sans argument pour voir le niveau de réflexion actuel.

## Application par agent

- **Pi embarqué** : le niveau résolu est transmis au runtime de l’agent Pi en processus.

## Mode rapide (/fast)

- Niveaux : `on|off`.
- Un message contenant uniquement une directive active une surcharge de mode rapide de session et répond `Fast mode enabled.` / `Fast mode disabled.`.
- Envoyez `/fast` (ou `/fast status`) sans mode pour voir l’état effectif actuel du mode rapide.
- OpenClaw résout le mode rapide dans cet ordre :
  1. `/fast on|off` en ligne / contenant uniquement une directive
  2. Surcharge de session
  3. Valeur par défaut par agent (`agents.list[].fastModeDefault`)
  4. Configuration par modèle : `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Repli : `off`
- Pour `openai/*`, le mode rapide se mappe au traitement prioritaire OpenAI en envoyant `service_tier=priority` sur les requêtes Responses prises en charge.
- Pour `openai-codex/*`, le mode rapide envoie le même indicateur `service_tier=priority` sur les réponses Codex. OpenClaw conserve une seule bascule `/fast` partagée entre les deux chemins d’authentification.
- Pour les requêtes publiques directes `anthropic/*`, y compris le trafic authentifié par OAuth envoyé à `api.anthropic.com`, le mode rapide se mappe aux niveaux de service Anthropic : `/fast on` définit `service_tier=auto`, `/fast off` définit `service_tier=standard_only`.
- Pour `minimax/*` sur le chemin compatible Anthropic, `/fast on` (ou `params.fastMode: true`) réécrit `MiniMax-M2.7` en `MiniMax-M2.7-highspeed`.
- Les paramètres de modèle Anthropic explicites `serviceTier` / `service_tier` remplacent la valeur par défaut du mode rapide lorsque les deux sont définis. OpenClaw continue toutefois d’ignorer l’injection de niveau de service Anthropic pour les URL de base proxy non Anthropic.

## Directives verbeuses (/verbose ou /v)

- Niveaux : `on` (minimal) | `full` | `off` (par défaut).
- Un message contenant uniquement une directive active le mode verbeux de session et répond `Verbose logging enabled.` / `Verbose logging disabled.` ; les niveaux invalides renvoient une indication sans modifier l’état.
- `/verbose off` stocke une surcharge explicite de session ; effacez-la via l’interface Sessions en choisissant `inherit`.
- Une directive en ligne n’affecte que ce message ; les valeurs par défaut de session/globales s’appliquent sinon.
- Envoyez `/verbose` (ou `/verbose:`) sans argument pour voir le niveau verbeux actuel.
- Quand le mode verbeux est activé, les agents qui émettent des résultats d’outils structurés (Pi, autres agents JSON) renvoient chaque appel d’outil comme son propre message de métadonnées uniquement, préfixé par `<emoji> <tool-name>: <arg>` lorsque disponible (chemin/commande). Ces résumés d’outils sont envoyés dès que chaque outil démarre (bulles séparées), pas sous forme de deltas de streaming.
- Les résumés d’échec d’outil restent visibles en mode normal, mais les suffixes de détail d’erreur bruts sont masqués sauf si le mode verbeux est `on` ou `full`.
- Quand le mode verbeux est `full`, les sorties d’outil sont également transmises après achèvement (bulle séparée, tronquée à une longueur sûre). Si vous basculez `/verbose on|full|off` pendant qu’une exécution est en cours, les bulles d’outil suivantes respectent le nouveau réglage.

## Directives de trace Plugin (/trace)

- Niveaux : `on` | `off` (par défaut).
- Un message contenant uniquement une directive active la sortie de trace Plugin de session et répond `Plugin trace enabled.` / `Plugin trace disabled.`.
- Une directive en ligne n’affecte que ce message ; les valeurs par défaut de session/globales s’appliquent sinon.
- Envoyez `/trace` (ou `/trace:`) sans argument pour voir le niveau de trace actuel.
- `/trace` est plus restreint que `/verbose` : il n’expose que les lignes de trace/débogage appartenant au Plugin, telles que les résumés de débogage Active Memory.
- Les lignes de trace peuvent apparaître dans `/status` et comme message de diagnostic de suivi après la réponse normale de l’assistant.

## Visibilité du raisonnement (/reasoning)

- Niveaux : `on|off|stream`.
- Un message contenant uniquement une directive active si les blocs de réflexion sont affichés dans les réponses.
- Quand elle est activée, la réflexion est envoyée comme **message séparé** préfixé par `Reasoning:`.
- `stream` (Telegram uniquement) : diffuse la réflexion dans la bulle de brouillon Telegram pendant la génération de la réponse, puis envoie la réponse finale sans réflexion.
- Alias : `/reason`.
- Envoyez `/reasoning` (ou `/reasoning:`) sans argument pour voir le niveau de raisonnement actuel.
- Ordre de résolution : directive en ligne, puis surcharge de session, puis valeur par défaut par agent (`agents.list[].reasoningDefault`), puis repli (`off`).

## Voir aussi

- La documentation du mode élevé se trouve dans [Mode élevé](/fr/tools/elevated).

## Heartbeats

- Le corps de la sonde Heartbeat est le prompt Heartbeat configuré (par défaut : `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Les directives en ligne dans un message Heartbeat s’appliquent comme d’habitude (mais évitez de modifier les valeurs par défaut de session depuis les Heartbeats).
- La remise Heartbeat utilise par défaut uniquement la charge utile finale. Pour envoyer aussi le message séparé `Reasoning:` (lorsqu’il est disponible), définissez `agents.defaults.heartbeat.includeReasoning: true` ou `agents.list[].heartbeat.includeReasoning: true` par agent.

## Interface Web chat

- Le sélecteur de réflexion du Web chat reflète le niveau stocké de la session depuis le stockage/configuration de session entrante lors du chargement de la page.
- Choisir un autre niveau écrit immédiatement la surcharge de session via `sessions.patch` ; il n’attend pas l’envoi suivant et ce n’est pas une surcharge ponctuelle `thinkingOnce`.
- La première option est toujours `Default (<resolved level>)`, où la valeur par défaut résolue provient du profil de réflexion du fournisseur du modèle de session actif.
- Le sélecteur utilise `thinkingOptions` renvoyé par la ligne de session Gateway. L’interface navigateur ne conserve pas sa propre liste regex fournisseur ; les Plugins possèdent les ensembles de niveaux propres au modèle.
- `/think:<level>` continue de fonctionner et met à jour le même niveau de session stocké, afin que les directives de chat et le sélecteur restent synchronisés.

## Profils fournisseur

- Les Plugins fournisseur peuvent exposer `resolveThinkingProfile(ctx)` pour définir les niveaux pris en charge et la valeur par défaut du modèle.
- Chaque niveau de profil a un `id` canonique stocké (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` ou `max`) et peut inclure un `label` d’affichage. Les fournisseurs binaires utilisent `{ id: "low", label: "on" }`.
- Les hooks hérités publiés (`supportsXHighThinking`, `isBinaryThinking` et `resolveDefaultThinkingLevel`) restent des adaptateurs de compatibilité, mais les nouveaux ensembles de niveaux personnalisés doivent utiliser `resolveThinkingProfile`.
- Les lignes Gateway exposent `thinkingOptions` et `thinkingDefault` afin que les clients ACP/chat affichent le même profil que celui utilisé par la validation du runtime.
