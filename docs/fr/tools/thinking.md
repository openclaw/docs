---
read_when:
    - Ajustement de l’analyse des directives ou des valeurs par défaut pour le niveau de réflexion, le mode rapide ou le mode verbeux
summary: Syntaxe des directives pour /think, /fast, /verbose, /trace et la visibilité du raisonnement
title: Niveaux de réflexion
x-i18n:
    generated_at: "2026-04-17T06:57:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1cb44a7bf75546e5a8c3204e12f3297221449b881161d173dea4983da3921649
    source_path: tools/thinking.md
    workflow: 15
---

# Niveaux de réflexion (directives `/think`)

## Ce que cela fait

- Directive en ligne dans tout corps de message entrant : `/t <level>`, `/think:<level>` ou `/thinking <level>`.
- Niveaux (alias) : `off | minimal | low | medium | high | xhigh | adaptive`
  - minimal → « réfléchir »
  - low → « réfléchir sérieusement »
  - medium → « réfléchir davantage »
  - high → « ultrathink » (budget maximal)
  - xhigh → « ultrathink+ » (GPT-5.2 + modèles Codex et effort Anthropic Claude Opus 4.7)
  - adaptive → réflexion adaptative gérée par le fournisseur (prise en charge pour Anthropic Claude 4.6 et Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high` et `extra_high` correspondent à `xhigh`.
  - `highest`, `max` correspondent à `high`.
- Remarques sur les fournisseurs :
  - Les modèles Anthropic Claude 4.6 utilisent `adaptive` par défaut lorsqu’aucun niveau de réflexion explicite n’est défini.
  - Anthropic Claude Opus 4.7 n’utilise pas la réflexion adaptative par défaut. Sa valeur d’effort par défaut de l’API reste gérée par le fournisseur, sauf si vous définissez explicitement un niveau de réflexion.
  - Anthropic Claude Opus 4.7 mappe `/think xhigh` vers une réflexion adaptative plus `output_config.effort: "xhigh"`, car `/think` est une directive de réflexion et `xhigh` est le paramètre d’effort d’Opus 4.7.
  - MiniMax (`minimax/*`) sur le chemin de streaming compatible Anthropic utilise par défaut `thinking: { type: "disabled" }`, sauf si vous définissez explicitement la réflexion dans les paramètres du modèle ou de la requête. Cela évite les deltas `reasoning_content` divulgués par le format de flux Anthropic non natif de MiniMax.
  - Z.AI (`zai/*`) prend uniquement en charge une réflexion binaire (`on`/`off`). Tout niveau autre que `off` est traité comme `on` (mappé vers `low`).
  - Moonshot (`moonshot/*`) mappe `/think off` vers `thinking: { type: "disabled" }` et tout niveau autre que `off` vers `thinking: { type: "enabled" }`. Lorsque la réflexion est activée, Moonshot n’accepte que `tool_choice` `auto|none` ; OpenClaw normalise les valeurs incompatibles en `auto`.

## Ordre de résolution

1. Directive en ligne sur le message (s’applique uniquement à ce message).
2. Surcharge de session (définie en envoyant un message contenant uniquement une directive).
3. Valeur par défaut par agent (`agents.list[].thinkingDefault` dans la config).
4. Valeur par défaut globale (`agents.defaults.thinkingDefault` dans la config).
5. Repli : `adaptive` pour les modèles Anthropic Claude 4.6, `off` pour Anthropic Claude Opus 4.7 sauf configuration explicite, `low` pour les autres modèles prenant en charge la réflexion, `off` sinon.

## Définir une valeur par défaut de session

- Envoyez un message qui contient **uniquement** la directive (espaces autorisés), par exemple `/think:medium` ou `/t high`.
- Cela reste actif pour la session en cours (par expéditeur par défaut) ; effacé par `/think:off` ou par la réinitialisation après inactivité de la session.
- Une réponse de confirmation est envoyée (`Thinking level set to high.` / `Thinking disabled.`). Si le niveau est invalide (par exemple `/thinking big`), la commande est rejetée avec une indication et l’état de la session reste inchangé.
- Envoyez `/think` (ou `/think:`) sans argument pour voir le niveau de réflexion actuel.

## Application par agent

- **Pi intégré** : le niveau résolu est transmis au runtime de l’agent Pi en cours de processus.

## Mode rapide (/fast)

- Niveaux : `on|off`.
- Un message contenant uniquement une directive active ou désactive une surcharge de session du mode rapide et répond `Fast mode enabled.` / `Fast mode disabled.`.
- Envoyez `/fast` (ou `/fast status`) sans mode pour voir l’état effectif actuel du mode rapide.
- OpenClaw résout le mode rapide dans cet ordre :
  1. `/fast on|off` en ligne / sous forme de directive seule
  2. Surcharge de session
  3. Valeur par défaut par agent (`agents.list[].fastModeDefault`)
  4. Config par modèle : `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Repli : `off`
- Pour `openai/*`, le mode rapide correspond au traitement prioritaire OpenAI en envoyant `service_tier=priority` sur les requêtes Responses prises en charge.
- Pour `openai-codex/*`, le mode rapide envoie le même indicateur `service_tier=priority` sur les réponses Codex. OpenClaw conserve un seul basculement `/fast` partagé entre les deux chemins d’authentification.
- Pour les requêtes directes publiques `anthropic/*`, y compris le trafic authentifié par OAuth envoyé vers `api.anthropic.com`, le mode rapide correspond aux niveaux de service Anthropic : `/fast on` définit `service_tier=auto`, `/fast off` définit `service_tier=standard_only`.
- Pour `minimax/*` sur le chemin compatible Anthropic, `/fast on` (ou `params.fastMode: true`) réécrit `MiniMax-M2.7` en `MiniMax-M2.7-highspeed`.
- Les paramètres explicites du modèle Anthropic `serviceTier` / `service_tier` remplacent la valeur par défaut du mode rapide lorsque les deux sont définis. OpenClaw continue toutefois à ignorer l’injection du niveau de service Anthropic pour les URL de base proxy non Anthropic.

## Directives verbeuses (/verbose ou /v)

- Niveaux : `on` (minimal) | `full` | `off` (par défaut).
- Un message contenant uniquement une directive active la verbosité de session et répond `Verbose logging enabled.` / `Verbose logging disabled.` ; les niveaux invalides renvoient une indication sans modifier l’état.
- `/verbose off` enregistre une surcharge explicite de session ; effacez-la via l’interface Sessions en choisissant `inherit`.
- La directive en ligne n’affecte que ce message ; sinon, les valeurs par défaut de session/globales s’appliquent.
- Envoyez `/verbose` (ou `/verbose:`) sans argument pour voir le niveau de verbosité actuel.
- Lorsque le mode verbeux est activé, les agents qui émettent des résultats d’outils structurés (Pi, autres agents JSON) renvoient chaque appel d’outil comme son propre message de métadonnées uniquement, préfixé par `<emoji> <tool-name>: <arg>` lorsque disponible (chemin/commande). Ces résumés d’outils sont envoyés dès le démarrage de chaque outil (bulles séparées), et non comme deltas de streaming.
- Les résumés d’échec des outils restent visibles en mode normal, mais les suffixes détaillant les erreurs brutes sont masqués sauf si verbose vaut `on` ou `full`.
- Lorsque verbose vaut `full`, les sorties des outils sont également transmises après leur fin (bulle séparée, tronquée à une longueur sûre). Si vous basculez `/verbose on|full|off` pendant qu’une exécution est en cours, les bulles d’outils suivantes respecteront le nouveau paramètre.

## Directives de trace de Plugin (/trace)

- Niveaux : `on` | `off` (par défaut).
- Un message contenant uniquement une directive active la sortie de trace des plugins pour la session et répond `Plugin trace enabled.` / `Plugin trace disabled.`.
- La directive en ligne n’affecte que ce message ; sinon, les valeurs par défaut de session/globales s’appliquent.
- Envoyez `/trace` (ou `/trace:`) sans argument pour voir le niveau de trace actuel.
- `/trace` est plus ciblé que `/verbose` : il n’expose que les lignes de trace/debug appartenant aux plugins, comme les résumés de débogage Active Memory.
- Les lignes de trace peuvent apparaître dans `/status` et sous forme de message de diagnostic de suivi après la réponse normale de l’assistant.

## Visibilité du raisonnement (/reasoning)

- Niveaux : `on|off|stream`.
- Un message contenant uniquement une directive active ou désactive l’affichage des blocs de réflexion dans les réponses.
- Lorsqu’elle est activée, la réflexion est envoyée comme **message séparé** préfixé par `Reasoning:`.
- `stream` (Telegram uniquement) : diffuse la réflexion dans la bulle de brouillon Telegram pendant la génération de la réponse, puis envoie la réponse finale sans la réflexion.
- Alias : `/reason`.
- Envoyez `/reasoning` (ou `/reasoning:`) sans argument pour voir le niveau actuel de raisonnement.
- Ordre de résolution : directive en ligne, puis surcharge de session, puis valeur par défaut par agent (`agents.list[].reasoningDefault`), puis repli (`off`).

## Lié

- La documentation du mode élevé se trouve dans [Mode élevé](/fr/tools/elevated).

## Heartbeats

- Le corps de la sonde Heartbeat est le prompt Heartbeat configuré (par défaut : `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Les directives en ligne dans un message Heartbeat s’appliquent normalement (mais évitez de modifier les valeurs par défaut de session à partir des Heartbeats).
- La livraison Heartbeat envoie par défaut uniquement la charge utile finale. Pour envoyer aussi le message séparé `Reasoning:` (lorsqu’il est disponible), définissez `agents.defaults.heartbeat.includeReasoning: true` ou, par agent, `agents.list[].heartbeat.includeReasoning: true`.

## Interface de chat web

- Le sélecteur de réflexion du chat web reflète le niveau stocké de la session à partir du magasin de session entrant/de la config au chargement de la page.
- Choisir un autre niveau écrit immédiatement la surcharge de session via `sessions.patch` ; cela n’attend pas le prochain envoi et ce n’est pas une surcharge ponctuelle `thinkingOnce`.
- La première option est toujours `Default (<resolved level>)`, où la valeur par défaut résolue provient du modèle actif de la session : `adaptive` pour Claude 4.6 sur Anthropic, `off` pour Anthropic Claude Opus 4.7 sauf configuration, `low` pour les autres modèles prenant en charge la réflexion, `off` sinon.
- Le sélecteur reste adapté au fournisseur :
  - la plupart des fournisseurs affichent `off | minimal | low | medium | high | adaptive`
  - Anthropic Claude Opus 4.7 affiche `off | minimal | low | medium | high | xhigh | adaptive`
  - Z.AI affiche le binaire `off | on`
- `/think:<level>` fonctionne toujours et met à jour le même niveau de session stocké, afin que les directives du chat et le sélecteur restent synchronisés.
