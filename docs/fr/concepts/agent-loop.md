---
read_when:
    - Vous avez besoin d'une explication précise de la boucle d'agent ou des événements du cycle de vie
summary: Cycle de vie de la boucle d'agent, flux et sémantique d'attente
title: Boucle d'agent
x-i18n:
    generated_at: "2026-04-09T01:27:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 32d3a73df8dabf449211a6183a70dcfd2a9b6f584dc76d0c4c9147582b2ca6a1
    source_path: concepts/agent-loop.md
    workflow: 15
---

# Boucle d'agent (OpenClaw)

Une boucle agentique est l'exécution complète « réelle » d'un agent : ingestion → assemblage du contexte → inférence du modèle →
exécution des outils → réponses en streaming → persistance. C'est le chemin d'exécution faisant autorité qui transforme un message
en actions et en une réponse finale, tout en maintenant la cohérence de l'état de la session.

Dans OpenClaw, une boucle est une exécution unique et sérialisée par session qui émet des événements de cycle de vie et de flux
pendant que le modèle réfléchit, appelle des outils et diffuse la sortie. Ce document explique comment cette boucle authentique est
connectée de bout en bout.

## Points d'entrée

- RPC Gateway : `agent` et `agent.wait`.
- CLI : commande `agent`.

## Fonctionnement (vue d'ensemble)

1. La RPC `agent` valide les paramètres, résout la session (`sessionKey`/`sessionId`), persiste les métadonnées de session et renvoie immédiatement `{ runId, acceptedAt }`.
2. `agentCommand` exécute l'agent :
   - résout le modèle + les valeurs par défaut de réflexion/verbosité
   - charge l'instantané des Skills
   - appelle `runEmbeddedPiAgent` (runtime pi-agent-core)
   - émet **lifecycle end/error** si la boucle embarquée n'en émet pas
3. `runEmbeddedPiAgent` :
   - sérialise les exécutions via des files d'attente par session + globales
   - résout le modèle + le profil d'authentification et construit la session pi
   - s'abonne aux événements pi et diffuse les deltas assistant/outil
   - applique le délai d'expiration -> interrompt l'exécution s'il est dépassé
   - renvoie les payloads + les métadonnées d'usage
4. `subscribeEmbeddedPiSession` relie les événements pi-agent-core au flux OpenClaw `agent` :
   - événements d'outil => `stream: "tool"`
   - deltas de l'assistant => `stream: "assistant"`
   - événements de cycle de vie => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` utilise `waitForAgentRun` :
   - attend **lifecycle end/error** pour `runId`
   - renvoie `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Mise en file d'attente + concurrence

- Les exécutions sont sérialisées par clé de session (voie de session) et, éventuellement, via une voie globale.
- Cela évite les conflits d'outil/session et maintient la cohérence de l'historique de session.
- Les canaux de messagerie peuvent choisir des modes de file d'attente (collect/steer/followup) qui alimentent ce système de voies.
  Voir [File de commandes](/fr/concepts/queue).

## Préparation de la session + de l'espace de travail

- L'espace de travail est résolu et créé ; les exécutions en sandbox peuvent rediriger vers une racine d'espace de travail sandboxée.
- Les Skills sont chargées (ou réutilisées depuis un instantané) et injectées dans l'environnement et le prompt.
- Les fichiers bootstrap/contexte sont résolus et injectés dans le rapport du prompt système.
- Un verrou d'écriture de session est acquis ; `SessionManager` est ouvert et préparé avant le streaming.

## Assemblage du prompt + prompt système

- Le prompt système est construit à partir du prompt de base d'OpenClaw, du prompt des Skills, du contexte bootstrap et des remplacements par exécution.
- Les limites spécifiques au modèle et les jetons réservés pour la compaction sont appliqués.
- Voir [Prompt système](/fr/concepts/system-prompt) pour ce que voit le modèle.

## Points de hook (où vous pouvez intercepter)

OpenClaw dispose de deux systèmes de hook :

- **Hooks internes** (hooks Gateway) : scripts pilotés par événements pour les commandes et les événements de cycle de vie.
- **Hooks de plugin** : points d'extension à l'intérieur du cycle de vie de l'agent/de l'outil et du pipeline Gateway.

### Hooks internes (hooks Gateway)

- **`agent:bootstrap`** : s'exécute pendant la construction des fichiers bootstrap avant la finalisation du prompt système.
  Utilisez-le pour ajouter/supprimer des fichiers de contexte bootstrap.
- **Hooks de commande** : `/new`, `/reset`, `/stop` et autres événements de commande (voir le document Hooks).

Voir [Hooks](/fr/automation/hooks) pour la configuration et des exemples.

### Hooks de plugin (cycle de vie agent + gateway)

Ils s'exécutent dans la boucle d'agent ou le pipeline Gateway :

- **`before_model_resolve`** : s'exécute avant la session (sans `messages`) pour remplacer de façon déterministe le fournisseur/modèle avant la résolution du modèle.
- **`before_prompt_build`** : s'exécute après le chargement de la session (avec `messages`) pour injecter `prependContext`, `systemPrompt`, `prependSystemContext` ou `appendSystemContext` avant l'envoi du prompt. Utilisez `prependContext` pour du texte dynamique par tour et les champs de contexte système pour des consignes stables qui doivent se trouver dans l'espace du prompt système.
- **`before_agent_start`** : hook de compatibilité hérité qui peut s'exécuter dans l'une ou l'autre phase ; préférez les hooks explicites ci-dessus.
- **`before_agent_reply`** : s'exécute après les actions en ligne et avant l'appel au LLM, permettant à un plugin de prendre en charge le tour et de renvoyer une réponse synthétique ou de rendre complètement le tour silencieux.
- **`agent_end`** : inspecte la liste finale des messages et les métadonnées d'exécution après achèvement.
- **`before_compaction` / `after_compaction`** : observent ou annotent les cycles de compaction.
- **`before_tool_call` / `after_tool_call`** : interceptent les paramètres/résultats des outils.
- **`before_install`** : inspecte les résultats d'analyse intégrés et peut éventuellement bloquer des installations de skill ou de plugin.
- **`tool_result_persist`** : transforme de manière synchrone les résultats d'outil avant leur écriture dans la transcription de session.
- **`message_received` / `message_sending` / `message_sent`** : hooks de messages entrants + sortants.
- **`session_start` / `session_end`** : limites du cycle de vie de la session.
- **`gateway_start` / `gateway_stop`** : événements du cycle de vie de la gateway.

Règles de décision des hooks pour les garde-fous sortants/outils :

- `before_tool_call` : `{ block: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `before_tool_call` : `{ block: false }` n'a aucun effet et n'annule pas un blocage antérieur.
- `before_install` : `{ block: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `before_install` : `{ block: false }` n'a aucun effet et n'annule pas un blocage antérieur.
- `message_sending` : `{ cancel: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `message_sending` : `{ cancel: false }` n'a aucun effet et n'annule pas une annulation antérieure.

Voir [Hooks de plugin](/fr/plugins/architecture#provider-runtime-hooks) pour l'API des hooks et les détails d'enregistrement.

## Streaming + réponses partielles

- Les deltas de l'assistant sont diffusés depuis pi-agent-core et émis comme événements `assistant`.
- Le streaming par bloc peut émettre des réponses partielles soit sur `text_end`, soit sur `message_end`.
- Le streaming du raisonnement peut être émis comme flux séparé ou comme réponses par bloc.
- Voir [Streaming](/fr/concepts/streaming) pour le comportement de fragmentation et des réponses par bloc.

## Exécution des outils + outils de messagerie

- Les événements de début/mise à jour/fin d'outil sont émis sur le flux `tool`.
- Les résultats d'outil sont assainis pour la taille et les payloads d'image avant journalisation/émission.
- Les envois d'outils de messagerie sont suivis pour supprimer les confirmations d'assistant en double.

## Mise en forme de la réponse + suppression

- Les payloads finaux sont assemblés à partir de :
  - texte de l'assistant (et raisonnement facultatif)
  - résumés d'outils en ligne (quand verbose + autorisé)
  - texte d'erreur de l'assistant lorsque le modèle renvoie une erreur
- Le jeton silencieux exact `NO_REPLY` / `no_reply` est filtré des
  payloads sortants.
- Les doublons d'outils de messagerie sont supprimés de la liste finale des payloads.
- S'il ne reste aucun payload affichable et qu'un outil a renvoyé une erreur, une réponse de repli d'erreur d'outil est émise
  (sauf si un outil de messagerie a déjà envoyé une réponse visible par l'utilisateur).

## Compaction + nouvelles tentatives

- La compaction automatique émet des événements de flux `compaction` et peut déclencher une nouvelle tentative.
- Lors d'une nouvelle tentative, les tampons en mémoire et les résumés d'outils sont réinitialisés pour éviter des sorties en double.
- Voir [Compaction](/fr/concepts/compaction) pour le pipeline de compaction.

## Flux d'événements (aujourd'hui)

- `lifecycle` : émis par `subscribeEmbeddedPiSession` (et en secours par `agentCommand`)
- `assistant` : deltas diffusés depuis pi-agent-core
- `tool` : événements d'outil diffusés depuis pi-agent-core

## Gestion du canal de chat

- Les deltas de l'assistant sont mis en tampon dans des messages `delta` du chat.
- Un `final` du chat est émis sur **lifecycle end/error**.

## Délais d'expiration

- Valeur par défaut de `agent.wait` : 30 s (attente uniquement). Le paramètre `timeoutMs` remplace cette valeur.
- Runtime de l'agent : `agents.defaults.timeoutSeconds` vaut par défaut 172800 s (48 heures) ; appliqué dans le minuteur d'abandon de `runEmbeddedPiAgent`.
- Délai d'inactivité du LLM : `agents.defaults.llm.idleTimeoutSeconds` interrompt une requête modèle lorsqu'aucun fragment de réponse n'arrive avant la fenêtre d'inactivité. Définissez-le explicitement pour des modèles locaux lents ou des fournisseurs de raisonnement/appel d'outils ; définissez-le à 0 pour le désactiver. S'il n'est pas défini, OpenClaw utilise `agents.defaults.timeoutSeconds` lorsqu'il est configuré, sinon 60 s. Les exécutions déclenchées par cron sans délai d'inactivité LLM ni délai d'agent explicite désactivent le watchdog d'inactivité et s'appuient sur le délai externe du cron.

## Où les choses peuvent se terminer prématurément

- Délai d'expiration de l'agent (abandon)
- AbortSignal (annulation)
- Déconnexion de la Gateway ou délai d'expiration RPC
- Délai d'expiration de `agent.wait` (attente uniquement, n'arrête pas l'agent)

## Liens associés

- [Outils](/fr/tools) — outils d'agent disponibles
- [Hooks](/fr/automation/hooks) — scripts pilotés par événements déclenchés par les événements du cycle de vie de l'agent
- [Compaction](/fr/concepts/compaction) — comment les longues conversations sont résumées
- [Approbations Exec](/fr/tools/exec-approvals) — barrières d'approbation pour les commandes shell
- [Thinking](/fr/tools/thinking) — configuration du niveau de réflexion/raisonnement
