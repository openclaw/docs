---
read_when:
    - Vous avez besoin d’un guide précis de la boucle agent ou des événements de cycle de vie
    - Vous modifiez la mise en file de session, les écritures de transcription ou le comportement du verrou d’écriture de session
summary: Cycle de vie de la boucle agent, flux et sémantique d’attente
title: Boucle agent
x-i18n:
    generated_at: "2026-04-23T07:02:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 439b68446cc75db3ded7a7d20df8e074734e6759ecf989a41299d1b84f1ce79c
    source_path: concepts/agent-loop.md
    workflow: 15
---

# Boucle agent (OpenClaw)

Une boucle agentique est l’exécution complète et « réelle » d’un agent : ingestion → assemblage du contexte → inférence du modèle →
exécution d’outils → réponses en streaming → persistance. C’est le chemin de référence qui transforme un message
en actions et en réponse finale, tout en gardant un état de session cohérent.

Dans OpenClaw, une boucle est une seule exécution sérialisée par session qui émet des événements de cycle de vie et de flux
pendant que le modèle réfléchit, appelle des outils et diffuse sa sortie. Ce document explique comment cette boucle authentique est
câblée de bout en bout.

## Points d’entrée

- RPC Gateway : `agent` et `agent.wait`.
- CLI : commande `agent`.

## Fonctionnement (vue d’ensemble)

1. Le RPC `agent` valide les paramètres, résout la session (sessionKey/sessionId), conserve les métadonnées de session et renvoie immédiatement `{ runId, acceptedAt }`.
2. `agentCommand` exécute l’agent :
   - résout les valeurs par défaut du modèle + de réflexion/verbose/trace
   - charge l’instantané des Skills
   - appelle `runEmbeddedPiAgent` (runtime pi-agent-core)
   - émet **lifecycle end/error** si la boucle intégrée ne l’émet pas
3. `runEmbeddedPiAgent` :
   - sérialise les exécutions via des files par session et globales
   - résout le modèle + le profil d’authentification et construit la session Pi
   - s’abonne aux événements Pi et diffuse les deltas assistant/outils
   - applique le délai d’expiration -> abandonne l’exécution si dépassé
   - renvoie les charges utiles + métadonnées d’usage
4. `subscribeEmbeddedPiSession` relie les événements pi-agent-core au flux OpenClaw `agent` :
   - événements d’outil => `stream: "tool"`
   - deltas assistant => `stream: "assistant"`
   - événements de cycle de vie => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` utilise `waitForAgentRun` :
   - attend **lifecycle end/error** pour `runId`
   - renvoie `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Mise en file + concurrence

- Les exécutions sont sérialisées par clé de session (voie de session) et éventuellement via une voie globale.
- Cela évite les courses entre outils/sessions et garde l’historique de session cohérent.
- Les canaux de messagerie peuvent choisir des modes de file (collect/steer/followup) qui alimentent ce système de voies.
  Voir [File de commandes](/fr/concepts/queue).
- Les écritures de transcription sont aussi protégées par un verrou d’écriture de session sur le fichier de session. Le verrou
  est sensible au processus et basé sur des fichiers, ce qui permet d’attraper les écritures qui contournent la file en processus ou proviennent
  d’un autre processus.
- Les verrous d’écriture de session ne sont pas réentrants par défaut. Si un utilitaire imbrique intentionnellement l’acquisition
  du même verrou tout en conservant un seul rédacteur logique, il doit l’activer explicitement avec
  `allowReentrant: true`.

## Préparation de la session + de l’espace de travail

- L’espace de travail est résolu et créé ; les exécutions en bac à sable peuvent rediriger vers une racine d’espace de travail isolée.
- Les Skills sont chargées (ou réutilisées depuis un instantané) et injectées dans l’environnement et le prompt.
- Les fichiers d’amorçage/contexte sont résolus et injectés dans le rapport du prompt système.
- Un verrou d’écriture de session est acquis ; `SessionManager` est ouvert et préparé avant le streaming. Tout
  chemin ultérieur de réécriture de transcription, Compaction ou troncature doit prendre le même verrou avant d’ouvrir ou
  de modifier le fichier de transcription.

## Assemblage du prompt + prompt système

- Le prompt système est construit à partir du prompt de base OpenClaw, du prompt Skills, du contexte d’amorçage et des remplacements par exécution.
- Les limites spécifiques au modèle et les jetons de réserve pour la Compaction sont appliqués.
- Voir [Prompt système](/fr/concepts/system-prompt) pour ce que voit le modèle.

## Points de hook (où vous pouvez intercepter)

OpenClaw possède deux systèmes de hooks :

- **Hooks internes** (hooks Gateway) : scripts pilotés par événements pour les commandes et les événements de cycle de vie.
- **Hooks de Plugin** : points d’extension à l’intérieur du cycle de vie agent/outil et du pipeline Gateway.

### Hooks internes (hooks Gateway)

- **`agent:bootstrap`** : s’exécute lors de la construction des fichiers d’amorçage avant la finalisation du prompt système.
  Utilisez-le pour ajouter/supprimer des fichiers de contexte d’amorçage.
- **Hooks de commande** : `/new`, `/reset`, `/stop` et autres événements de commande (voir la documentation Hooks).

Voir [Hooks](/fr/automation/hooks) pour la configuration et des exemples.

### Hooks de Plugin (cycle de vie agent + Gateway)

Ils s’exécutent dans la boucle agent ou le pipeline Gateway :

- **`before_model_resolve`** : s’exécute avant la session (sans `messages`) pour remplacer de façon déterministe le fournisseur/modèle avant la résolution du modèle.
- **`before_prompt_build`** : s’exécute après le chargement de la session (avec `messages`) pour injecter `prependContext`, `systemPrompt`, `prependSystemContext` ou `appendSystemContext` avant la soumission du prompt. Utilisez `prependContext` pour du texte dynamique par tour et les champs de contexte système pour des consignes stables qui doivent rester dans l’espace du prompt système.
- **`before_agent_start`** : hook de compatibilité hérité pouvant s’exécuter dans l’une ou l’autre phase ; préférez les hooks explicites ci-dessus.
- **`before_agent_reply`** : s’exécute après les actions en ligne et avant l’appel LLM, permettant à un plugin de prendre en charge le tour et de renvoyer une réponse synthétique ou de rendre le tour complètement silencieux.
- **`agent_end`** : inspecte la liste finale des messages et les métadonnées d’exécution après achèvement.
- **`before_compaction` / `after_compaction`** : observent ou annotent les cycles de Compaction.
- **`before_tool_call` / `after_tool_call`** : interceptent les paramètres/résultats d’outil.
- **`before_install`** : inspecte les résultats d’analyse intégrés et peut éventuellement bloquer des installations de Skill ou de Plugin.
- **`tool_result_persist`** : transforme de manière synchrone les résultats d’outil avant leur écriture dans la transcription de session.
- **`message_received` / `message_sending` / `message_sent`** : hooks de messages entrants + sortants.
- **`session_start` / `session_end`** : limites de cycle de vie de session.
- **`gateway_start` / `gateway_stop`** : événements de cycle de vie de la Gateway.

Règles de décision des hooks pour les gardes sortantes/outils :

- `before_tool_call` : `{ block: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `before_tool_call` : `{ block: false }` est sans effet et n’efface pas un blocage antérieur.
- `before_install` : `{ block: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `before_install` : `{ block: false }` est sans effet et n’efface pas un blocage antérieur.
- `message_sending` : `{ cancel: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `message_sending` : `{ cancel: false }` est sans effet et n’efface pas une annulation antérieure.

Voir [Hooks de Plugin](/fr/plugins/architecture#provider-runtime-hooks) pour l’API des hooks et les détails d’enregistrement.

## Streaming + réponses partielles

- Les deltas assistant sont diffusés depuis pi-agent-core et émis comme événements `assistant`.
- Le streaming par blocs peut émettre des réponses partielles soit sur `text_end`, soit sur `message_end`.
- Le streaming de raisonnement peut être émis comme flux séparé ou comme réponses par blocs.
- Voir [Streaming](/fr/concepts/streaming) pour le découpage et le comportement des réponses par blocs.

## Exécution d’outils + outils de messagerie

- Les événements de début/mise à jour/fin d’outil sont émis sur le flux `tool`.
- Les résultats d’outil sont assainis en taille et pour les charges utiles d’image avant journalisation/émission.
- Les envois via outils de messagerie sont suivis pour supprimer les confirmations assistant en double.

## Mise en forme de la réponse + suppression

- Les charges utiles finales sont assemblées à partir de :
  - texte assistant (et raisonnement optionnel)
  - résumés d’outils en ligne (lorsque verbose + autorisé)
  - texte d’erreur assistant lorsque le modèle renvoie une erreur
- Le jeton silencieux exact `NO_REPLY` / `no_reply` est filtré des
  charges utiles sortantes.
- Les doublons des outils de messagerie sont retirés de la liste finale des charges utiles.
- S’il ne reste aucune charge utile affichable et qu’un outil a échoué, une réponse de repli d’erreur d’outil est émise
  (sauf si un outil de messagerie a déjà envoyé une réponse visible par l’utilisateur).

## Compaction + nouvelles tentatives

- La Compaction automatique émet des événements de flux `compaction` et peut déclencher une nouvelle tentative.
- Lors d’une nouvelle tentative, les tampons en mémoire et les résumés d’outils sont réinitialisés pour éviter les sorties en double.
- Voir [Compaction](/fr/concepts/compaction) pour le pipeline de Compaction.

## Flux d’événements (aujourd’hui)

- `lifecycle` : émis par `subscribeEmbeddedPiSession` (et comme repli par `agentCommand`)
- `assistant` : deltas diffusés depuis pi-agent-core
- `tool` : événements d’outil diffusés depuis pi-agent-core

## Gestion des canaux de discussion

- Les deltas assistant sont mis en tampon dans des messages de discussion `delta`.
- Un `final` de discussion est émis sur **lifecycle end/error**.

## Délais d’expiration

- Valeur par défaut de `agent.wait` : 30 s (pour l’attente uniquement). Le paramètre `timeoutMs` la remplace.
- Runtime agent : `agents.defaults.timeoutSeconds` vaut par défaut 172800 s (48 heures) ; appliqué dans le minuteur d’abandon de `runEmbeddedPiAgent`.
- Délai d’inactivité LLM : `agents.defaults.llm.idleTimeoutSeconds` abandonne une requête modèle lorsqu’aucun fragment de réponse n’arrive avant la fenêtre d’inactivité. Définissez-le explicitement pour les modèles locaux lents ou les fournisseurs à raisonnement/appel d’outils ; définissez-le à 0 pour le désactiver. S’il n’est pas défini, OpenClaw utilise `agents.defaults.timeoutSeconds` lorsqu’il est configuré, sinon 120 s. Les exécutions déclenchées par Cron sans délai explicite LLM ou agent désactivent le watchdog d’inactivité et s’appuient sur le délai externe de Cron.

## Où les choses peuvent se terminer plus tôt

- Délai d’expiration agent (abandon)
- AbortSignal (annulation)
- Déconnexion Gateway ou expiration du délai RPC
- Délai d’expiration de `agent.wait` (attente uniquement, n’arrête pas l’agent)

## Voir aussi

- [Outils](/fr/tools) — outils agent disponibles
- [Hooks](/fr/automation/hooks) — scripts pilotés par événements déclenchés par les événements du cycle de vie agent
- [Compaction](/fr/concepts/compaction) — comment les longues conversations sont résumées
- [Approbations Exec](/fr/tools/exec-approvals) — barrières d’approbation pour les commandes shell
- [Thinking](/fr/tools/thinking) — configuration du niveau de réflexion/raisonnement
