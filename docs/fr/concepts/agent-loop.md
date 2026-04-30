---
read_when:
    - Vous avez besoin d’une procédure pas à pas exacte de la boucle de l’agent ou des événements du cycle de vie
    - Vous modifiez la mise en file d’attente des sessions, les écritures dans la transcription ou le comportement du verrou d’écriture de session
summary: Cycle de vie de la boucle d’agent, flux et sémantique d’attente
title: Boucle d’agent
x-i18n:
    generated_at: "2026-04-30T18:38:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5466893253e1f82482284ff82db56f4c3fca018bf12e4114fad76d37cad954df
    source_path: concepts/agent-loop.md
    workflow: 16
---

Une boucle agentique est l’exécution « réelle » complète d’un agent : réception → assemblage du contexte → inférence du modèle →
exécution d’outils → réponses en streaming → persistance. C’est le chemin faisant autorité qui transforme un message
en actions et en réponse finale, tout en conservant un état de session cohérent.

Dans OpenClaw, une boucle est une exécution unique et sérialisée par session, qui émet des événements de cycle de vie et de flux
pendant que le modèle raisonne, appelle des outils et diffuse la sortie. Ce document explique comment cette boucle authentique est
câblée de bout en bout.

## Points d’entrée

- RPC Gateway : `agent` et `agent.wait`.
- CLI : commande `agent`.

## Fonctionnement (vue d’ensemble)

1. Le RPC `agent` valide les paramètres, résout la session (sessionKey/sessionId), persiste les métadonnées de session, renvoie immédiatement `{ runId, acceptedAt }`.
2. `agentCommand` exécute l’agent :
   - résout le modèle et les valeurs par défaut de réflexion/verbosité/trace
   - charge l’instantané Skills
   - appelle `runEmbeddedPiAgent` (runtime pi-agent-core)
   - émet **lifecycle end/error** si la boucle embarquée n’en émet pas
3. `runEmbeddedPiAgent` :
   - sérialise les exécutions via des files par session et globales
   - résout le modèle et le profil d’authentification, puis construit la session pi
   - s’abonne aux événements pi et diffuse les deltas assistant/outil
   - applique le délai d’expiration -> interrompt l’exécution s’il est dépassé
   - pour les tours app-server Codex, interrompt un tour accepté qui cesse de produire une progression app-server avant un événement terminal
   - renvoie les payloads et les métadonnées d’utilisation
4. `subscribeEmbeddedPiSession` fait le pont entre les événements pi-agent-core et le flux `agent` d’OpenClaw :
   - événements d’outil => `stream: "tool"`
   - deltas assistant => `stream: "assistant"`
   - événements de cycle de vie => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` utilise `waitForAgentRun` :
   - attend **lifecycle end/error** pour `runId`
   - renvoie `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Mise en file d’attente + concurrence

- Les exécutions sont sérialisées par clé de session (voie de session) et éventuellement via une voie globale.
- Cela évite les courses entre outils/sessions et maintient l’historique de session cohérent.
- Les canaux de messagerie peuvent choisir des modes de file d’attente (collect/steer/followup) qui alimentent ce système de voies.
  Voir [File de commandes](/fr/concepts/queue).
- Les écritures de transcript sont également protégées par un verrou d’écriture de session sur le fichier de session. Le verrou est
  conscient des processus et basé sur les fichiers, ce qui lui permet de détecter les rédacteurs qui contournent la file en processus ou proviennent
  d’un autre processus.
- Par défaut, les verrous d’écriture de session ne sont pas réentrants. Si un assistant imbrique intentionnellement l’acquisition du
  même verrou tout en préservant un seul rédacteur logique, il doit l’activer explicitement avec
  `allowReentrant: true`.

## Préparation de la session + de l’espace de travail

- L’espace de travail est résolu et créé ; les exécutions en bac à sable peuvent être redirigées vers une racine d’espace de travail de bac à sable.
- Les Skills sont chargées (ou réutilisées depuis un instantané) et injectées dans l’environnement et le prompt.
- Les fichiers de bootstrap/contexte sont résolus et injectés dans le rapport de prompt système.
- Un verrou d’écriture de session est acquis ; `SessionManager` est ouvert et préparé avant le streaming. Tout
  chemin ultérieur de réécriture, de Compaction ou de troncature du transcript doit prendre le même verrou avant d’ouvrir ou
  de modifier le fichier de transcript.

## Assemblage du prompt + prompt système

- Le prompt système est construit à partir du prompt de base d’OpenClaw, du prompt Skills, du contexte de bootstrap et des remplacements par exécution.
- Les limites propres au modèle et les jetons de réserve de Compaction sont appliqués.
- Voir [Prompt système](/fr/concepts/system-prompt) pour ce que voit le modèle.

## Points de hook (où vous pouvez intercepter)

OpenClaw dispose de deux systèmes de hooks :

- **Hooks internes** (hooks Gateway) : scripts pilotés par événements pour les commandes et les événements de cycle de vie.
- **Hooks Plugin** : points d’extension dans le cycle de vie agent/outil et le pipeline Gateway.

### Hooks internes (hooks Gateway)

- **`agent:bootstrap`** : s’exécute pendant la construction des fichiers de bootstrap, avant la finalisation du prompt système.
  Utilisez-le pour ajouter/supprimer des fichiers de contexte de bootstrap.
- **Hooks de commande** : `/new`, `/reset`, `/stop` et autres événements de commande (voir la documentation Hooks).

Voir [Hooks](/fr/automation/hooks) pour la configuration et les exemples.

### Hooks Plugin (cycle de vie agent + Gateway)

Ils s’exécutent dans la boucle de l’agent ou le pipeline Gateway :

- **`before_model_resolve`** : s’exécute avant la session (sans `messages`) pour remplacer de manière déterministe le fournisseur/modèle avant la résolution du modèle.
- **`before_prompt_build`** : s’exécute après le chargement de la session (avec `messages`) pour injecter `prependContext`, `systemPrompt`, `prependSystemContext` ou `appendSystemContext` avant l’envoi du prompt. Utilisez `prependContext` pour le texte dynamique par tour et les champs de contexte système pour les directives stables qui doivent résider dans l’espace du prompt système.
- **`before_agent_start`** : hook de compatibilité hérité qui peut s’exécuter dans l’une ou l’autre phase ; préférez les hooks explicites ci-dessus.
- **`before_agent_reply`** : s’exécute après les actions en ligne et avant l’appel au LLM, ce qui permet à un plugin de prendre en charge le tour et de renvoyer une réponse synthétique ou de réduire entièrement le tour au silence.
- **`agent_end`** : inspecte la liste finale des messages et les métadonnées d’exécution après l’achèvement.
- **`before_compaction` / `after_compaction`** : observe ou annote les cycles de Compaction.
- **`before_tool_call` / `after_tool_call`** : intercepte les paramètres/résultats d’outil.
- **`before_install`** : inspecte les résultats d’analyse intégrés et bloque éventuellement les installations de skill ou de plugin.
- **`tool_result_persist`** : transforme de manière synchrone les résultats d’outil avant leur écriture dans un transcript de session appartenant à OpenClaw.
- **`message_received` / `message_sending` / `message_sent`** : hooks de messages entrants + sortants.
- **`session_start` / `session_end`** : limites du cycle de vie de session.
- **`gateway_start` / `gateway_stop`** : événements du cycle de vie Gateway.

Règles de décision des hooks pour les garde-fous sortants/outils :

- `before_tool_call` : `{ block: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `before_tool_call` : `{ block: false }` est une absence d’opération et n’efface pas un blocage antérieur.
- `before_install` : `{ block: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `before_install` : `{ block: false }` est une absence d’opération et n’efface pas un blocage antérieur.
- `message_sending` : `{ cancel: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `message_sending` : `{ cancel: false }` est une absence d’opération et n’efface pas une annulation antérieure.

Voir [Hooks Plugin](/fr/plugins/hooks) pour l’API de hook et les détails d’enregistrement.

Les harnesses peuvent adapter ces hooks différemment. Le harness app-server Codex conserve
les hooks Plugin OpenClaw comme contrat de compatibilité pour les surfaces miroirs documentées,
tandis que les hooks natifs Codex restent un mécanisme Codex de niveau inférieur distinct.

## Streaming + réponses partielles

- Les deltas assistant sont diffusés depuis pi-agent-core et émis comme événements `assistant`.
- Le streaming par bloc peut émettre des réponses partielles soit sur `text_end`, soit sur `message_end`.
- Le streaming du raisonnement peut être émis comme flux séparé ou comme réponses par bloc.
- Voir [Streaming](/fr/concepts/streaming) pour le découpage en fragments et le comportement des réponses par bloc.

## Exécution d’outils + outils de messagerie

- Les événements de début/mise à jour/fin d’outil sont émis sur le flux `tool`.
- Les résultats d’outil sont assainis pour la taille et les payloads d’image avant journalisation/émission.
- Les envois d’outils de messagerie sont suivis pour supprimer les confirmations assistant dupliquées.

## Mise en forme des réponses + suppression

- Les payloads finaux sont assemblés à partir de :
  - texte assistant (et raisonnement facultatif)
  - résumés d’outils en ligne (quand verbeux + autorisé)
  - texte d’erreur assistant quand le modèle échoue
- Le jeton silencieux exact `NO_REPLY` / `no_reply` est filtré des payloads
  sortants.
- Les doublons d’outils de messagerie sont supprimés de la liste finale des payloads.
- S’il ne reste aucun payload rendable et qu’un outil a échoué, une réponse de secours d’erreur d’outil est émise
  (sauf si un outil de messagerie a déjà envoyé une réponse visible par l’utilisateur).

## Compaction + nouvelles tentatives

- La Compaction automatique émet des événements de flux `compaction` et peut déclencher une nouvelle tentative.
- Lors de la nouvelle tentative, les tampons en mémoire et les résumés d’outils sont réinitialisés pour éviter une sortie dupliquée.
- Voir [Compaction](/fr/concepts/compaction) pour le pipeline de Compaction.

## Flux d’événements (aujourd’hui)

- `lifecycle` : émis par `subscribeEmbeddedPiSession` (et en repli par `agentCommand`)
- `assistant` : deltas diffusés depuis pi-agent-core
- `tool` : événements d’outil diffusés depuis pi-agent-core

## Gestion des canaux de chat

- Les deltas assistant sont mis en tampon dans des messages de chat `delta`.
- Un `final` de chat est émis sur **lifecycle end/error**.

## Délais d’expiration

- Valeur par défaut de `agent.wait` : 30 s (seulement l’attente). Le paramètre `timeoutMs` remplace cette valeur.
- Runtime de l’agent : valeur par défaut de `agents.defaults.timeoutSeconds` à 172800 s (48 heures) ; appliquée dans le minuteur d’interruption `runEmbeddedPiAgent`.
- Runtime Cron : le `timeoutSeconds` de tour d’agent isolé appartient à cron. Le planificateur démarre ce minuteur au début de l’exécution, interrompt l’exécution sous-jacente à l’échéance configurée, puis lance un nettoyage borné avant d’enregistrer le délai d’expiration afin qu’une session enfant obsolète ne puisse pas bloquer la voie.
- Récupération de session bloquée : avec les diagnostics activés, `diagnostics.stuckSessionWarnMs` détecte les sessions longues en `processing`. Les exécutions embarquées actives, les opérations de réponse actives et les tâches actives de voie de session restent par défaut limitées aux avertissements ; si les diagnostics n’indiquent aucun travail actif pour la session, le watchdog libère la voie de session affectée afin que le travail de démarrage en file puisse s’écouler.
- Délai d’inactivité du modèle : OpenClaw interrompt une requête de modèle quand aucun fragment de réponse n’arrive avant la fenêtre d’inactivité. `models.providers.<id>.timeoutSeconds` étend ce watchdog d’inactivité pour les fournisseurs locaux/auto-hébergés lents ; sinon OpenClaw utilise `agents.defaults.timeoutSeconds` lorsqu’il est configuré, plafonné par défaut à 120 s. Les exécutions déclenchées par Cron sans délai explicite de modèle ou d’agent désactivent le watchdog d’inactivité et s’appuient sur le délai externe de Cron.
- Délai d’expiration des requêtes HTTP du fournisseur : `models.providers.<id>.timeoutSeconds` s’applique aux fetches HTTP de modèle de ce fournisseur, y compris la connexion, les en-têtes, le corps, le délai d’expiration des requêtes SDK, la gestion totale de l’interruption guarded-fetch et le watchdog d’inactivité du flux de modèle. Utilisez-le pour les fournisseurs locaux/auto-hébergés lents tels qu’Ollama avant d’augmenter le délai d’exécution global de l’agent.

## Où les choses peuvent se terminer tôt

- Délai d’expiration de l’agent (interruption)
- AbortSignal (annulation)
- Déconnexion Gateway ou délai d’expiration RPC
- Délai d’expiration de `agent.wait` (attente uniquement, n’arrête pas l’agent)

## Connexe

- [Outils](/fr/tools) — outils d’agent disponibles
- [Hooks](/fr/automation/hooks) — scripts pilotés par événements déclenchés par les événements de cycle de vie de l’agent
- [Compaction](/fr/concepts/compaction) — comment les longues conversations sont résumées
- [Approbations Exec](/fr/tools/exec-approvals) — barrières d’approbation pour les commandes shell
- [Réflexion](/fr/tools/thinking) — configuration du niveau de réflexion/raisonnement
