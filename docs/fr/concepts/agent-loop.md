---
read_when:
    - Vous avez besoin d’une procédure pas à pas exacte de la boucle d’agent ou des événements de cycle de vie
    - Vous modifiez la mise en file d’attente des sessions, les écritures de transcription ou le comportement du verrou d’écriture de session
summary: Cycle de vie de la boucle de l’agent, flux et sémantique d’attente
title: Boucle de l’agent
x-i18n:
    generated_at: "2026-04-30T07:20:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 902d543bd71dd517a810d825cbe92e244fe89230f47eeada72477c657a2bec32
    source_path: concepts/agent-loop.md
    workflow: 16
---

Une boucle agentique est l’exécution complète et « réelle » d’un agent : réception → assemblage du contexte → inférence du modèle →
exécution d’outils → réponses en streaming → persistance. C’est le chemin faisant autorité qui transforme un message
en actions et en réponse finale, tout en maintenant l’état de session cohérent.

Dans OpenClaw, une boucle est une exécution unique, sérialisée par session, qui émet des événements de cycle de vie et de flux
pendant que le modèle réfléchit, appelle des outils et diffuse la sortie. Ce document explique comment cette boucle authentique est
câblée de bout en bout.

## Points d’entrée

- RPC du Gateway : `agent` et `agent.wait`.
- CLI : commande `agent`.

## Fonctionnement (vue d’ensemble)

1. Le RPC `agent` valide les paramètres, résout la session (sessionKey/sessionId), persiste les métadonnées de session, puis renvoie immédiatement `{ runId, acceptedAt }`.
2. `agentCommand` exécute l’agent :
   - résout les valeurs par défaut du modèle + thinking/verbose/trace
   - charge l’instantané des Skills
   - appelle `runEmbeddedPiAgent` (runtime pi-agent-core)
   - émet **lifecycle end/error** si la boucle intégrée n’en émet pas
3. `runEmbeddedPiAgent` :
   - sérialise les exécutions via des files d’attente par session + globales
   - résout le modèle + le profil d’authentification et construit la session Pi
   - s’abonne aux événements Pi et diffuse les deltas assistant/outil
   - applique le délai d’expiration -> abandonne l’exécution s’il est dépassé
   - renvoie les payloads + les métadonnées d’utilisation
4. `subscribeEmbeddedPiSession` relie les événements pi-agent-core au flux `agent` d’OpenClaw :
   - événements d’outil => `stream: "tool"`
   - deltas d’assistant => `stream: "assistant"`
   - événements de cycle de vie => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` utilise `waitForAgentRun` :
   - attend **lifecycle end/error** pour `runId`
   - renvoie `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Mise en file d’attente + concurrence

- Les exécutions sont sérialisées par clé de session (voie de session) et éventuellement via une voie globale.
- Cela évite les courses entre outils/sessions et maintient l’historique de session cohérent.
- Les canaux de messagerie peuvent choisir des modes de file d’attente (collect/steer/followup) qui alimentent ce système de voies.
  Voir [File d’attente des commandes](/fr/concepts/queue).
- Les écritures de transcript sont également protégées par un verrou d’écriture de session sur le fichier de session. Le verrou est
  conscient des processus et basé sur un fichier ; il détecte donc les rédacteurs qui contournent la file en processus ou proviennent
  d’un autre processus.
- Les verrous d’écriture de session ne sont pas réentrants par défaut. Si un assistant imbrique intentionnellement l’acquisition du
  même verrou tout en préservant un seul rédacteur logique, il doit l’activer explicitement avec
  `allowReentrant: true`.

## Préparation de la session + de l’espace de travail

- L’espace de travail est résolu et créé ; les exécutions en bac à sable peuvent être redirigées vers une racine d’espace de travail de bac à sable.
- Les Skills sont chargés (ou réutilisés depuis un instantané) et injectés dans l’environnement et le prompt.
- Les fichiers de bootstrap/contexte sont résolus et injectés dans le rapport du prompt système.
- Un verrou d’écriture de session est acquis ; `SessionManager` est ouvert et préparé avant le streaming. Tout chemin ultérieur de
  réécriture, Compaction ou troncature du transcript doit prendre le même verrou avant d’ouvrir ou de modifier le fichier de transcript.

## Assemblage du prompt + prompt système

- Le prompt système est construit à partir du prompt de base d’OpenClaw, du prompt des Skills, du contexte de bootstrap et des substitutions par exécution.
- Les limites propres au modèle et les jetons de réserve de Compaction sont appliqués.
- Voir [Prompt système](/fr/concepts/system-prompt) pour ce que voit le modèle.

## Points de hook (où intercepter)

OpenClaw dispose de deux systèmes de hooks :

- **Hooks internes** (hooks Gateway) : scripts pilotés par événements pour les commandes et événements de cycle de vie.
- **Hooks de Plugin** : points d’extension dans le cycle de vie agent/outil et le pipeline du Gateway.

### Hooks internes (hooks Gateway)

- **`agent:bootstrap`** : s’exécute pendant la construction des fichiers de bootstrap, avant la finalisation du prompt système.
  Utilisez-le pour ajouter/supprimer des fichiers de contexte de bootstrap.
- **Hooks de commande** : `/new`, `/reset`, `/stop` et autres événements de commande (voir le document Hooks).

Voir [Hooks](/fr/automation/hooks) pour la configuration et des exemples.

### Hooks de Plugin (cycle de vie agent + Gateway)

Ceux-ci s’exécutent dans la boucle agent ou le pipeline du Gateway :

- **`before_model_resolve`** : s’exécute avant la session (sans `messages`) pour remplacer de manière déterministe le fournisseur/modèle avant la résolution du modèle.
- **`before_prompt_build`** : s’exécute après le chargement de la session (avec `messages`) pour injecter `prependContext`, `systemPrompt`, `prependSystemContext` ou `appendSystemContext` avant l’envoi du prompt. Utilisez `prependContext` pour du texte dynamique par tour et les champs de contexte système pour des directives stables qui doivent résider dans l’espace du prompt système.
- **`before_agent_start`** : hook de compatibilité hérité qui peut s’exécuter dans l’une ou l’autre phase ; privilégiez les hooks explicites ci-dessus.
- **`before_agent_reply`** : s’exécute après les actions en ligne et avant l’appel LLM, ce qui permet à un Plugin de revendiquer le tour et de renvoyer une réponse synthétique ou de réduire entièrement le tour au silence.
- **`agent_end`** : inspecte la liste finale des messages et les métadonnées d’exécution après la fin.
- **`before_compaction` / `after_compaction`** : observe ou annote les cycles de Compaction.
- **`before_tool_call` / `after_tool_call`** : intercepte les paramètres/résultats d’outil.
- **`before_install`** : inspecte les résultats d’analyse intégrés et bloque éventuellement les installations de Skills ou de Plugin.
- **`tool_result_persist`** : transforme de manière synchrone les résultats d’outil avant leur écriture dans un transcript de session appartenant à OpenClaw.
- **`message_received` / `message_sending` / `message_sent`** : hooks de messages entrants + sortants.
- **`session_start` / `session_end`** : limites du cycle de vie de session.
- **`gateway_start` / `gateway_stop`** : événements du cycle de vie du Gateway.

Règles de décision des hooks pour les protections sortantes/d’outils :

- `before_tool_call` : `{ block: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `before_tool_call` : `{ block: false }` est un no-op et n’efface pas un blocage antérieur.
- `before_install` : `{ block: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `before_install` : `{ block: false }` est un no-op et n’efface pas un blocage antérieur.
- `message_sending` : `{ cancel: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `message_sending` : `{ cancel: false }` est un no-op et n’efface pas une annulation antérieure.

Voir [Hooks de Plugin](/fr/plugins/hooks) pour l’API de hook et les détails d’enregistrement.

Les harnesses peuvent adapter ces hooks différemment. Le harness app-server Codex conserve
les hooks de Plugin OpenClaw comme contrat de compatibilité pour les surfaces miroir documentées,
tandis que les hooks natifs Codex restent un mécanisme Codex de plus bas niveau séparé.

## Streaming + réponses partielles

- Les deltas d’assistant sont diffusés depuis pi-agent-core et émis comme événements `assistant`.
- Le streaming par blocs peut émettre des réponses partielles sur `text_end` ou `message_end`.
- Le streaming de raisonnement peut être émis comme flux distinct ou comme réponses par blocs.
- Voir [Streaming](/fr/concepts/streaming) pour le comportement de découpage et de réponse par blocs.

## Exécution d’outils + outils de messagerie

- Les événements de début/mise à jour/fin d’outil sont émis sur le flux `tool`.
- Les résultats d’outil sont assainis pour la taille et les payloads d’image avant journalisation/émission.
- Les envois d’outils de messagerie sont suivis afin de supprimer les confirmations d’assistant en double.

## Mise en forme des réponses + suppression

- Les payloads finaux sont assemblés à partir de :
  - texte de l’assistant (et raisonnement facultatif)
  - résumés d’outils en ligne (quand verbose + autorisé)
  - texte d’erreur de l’assistant quand le modèle échoue
- Le jeton silencieux exact `NO_REPLY` / `no_reply` est filtré des payloads
  sortants.
- Les doublons d’outils de messagerie sont supprimés de la liste finale des payloads.
- S’il ne reste aucun payload affichable et qu’un outil a échoué, une réponse d’erreur d’outil de secours est émise
  (sauf si un outil de messagerie a déjà envoyé une réponse visible par l’utilisateur).

## Compaction + nouvelles tentatives

- La Compaction automatique émet des événements de flux `compaction` et peut déclencher une nouvelle tentative.
- Lors d’une nouvelle tentative, les tampons en mémoire et les résumés d’outils sont réinitialisés pour éviter les sorties en double.
- Voir [Compaction](/fr/concepts/compaction) pour le pipeline de Compaction.

## Flux d’événements (aujourd’hui)

- `lifecycle` : émis par `subscribeEmbeddedPiSession` (et en secours par `agentCommand`)
- `assistant` : deltas diffusés depuis pi-agent-core
- `tool` : événements d’outil diffusés depuis pi-agent-core

## Gestion des canaux de chat

- Les deltas d’assistant sont mis en tampon dans des messages `delta` de chat.
- Un `final` de chat est émis sur **lifecycle end/error**.

## Délais d’expiration

- Valeur par défaut de `agent.wait` : 30 s (seulement l’attente). Le paramètre `timeoutMs` remplace cette valeur.
- Runtime de l’agent : `agents.defaults.timeoutSeconds` vaut par défaut 172800 s (48 heures) ; appliqué dans le minuteur d’abandon de `runEmbeddedPiAgent`.
- Runtime Cron : le `timeoutSeconds` isolé du tour d’agent appartient à Cron. Le planificateur démarre ce minuteur au début de l’exécution, abandonne l’exécution sous-jacente à l’échéance configurée, puis exécute un nettoyage borné avant d’enregistrer le délai d’expiration afin qu’une session enfant obsolète ne puisse pas bloquer la voie.
- Récupération de session bloquée : avec les diagnostics activés, `diagnostics.stuckSessionWarnMs` détecte les longues sessions `processing`. Les exécutions intégrées actives, les opérations de réponse actives et les tâches de voie de session actives restent par défaut limitées à des avertissements ; si les diagnostics ne montrent aucun travail actif pour la session, le watchdog libère la voie de session affectée afin que le travail de démarrage en file d’attente puisse s’écouler.
- Délai d’inactivité du modèle : OpenClaw abandonne une requête de modèle quand aucun fragment de réponse n’arrive avant la fenêtre d’inactivité. `models.providers.<id>.timeoutSeconds` étend ce watchdog d’inactivité pour les fournisseurs locaux/auto-hébergés lents ; sinon OpenClaw utilise `agents.defaults.timeoutSeconds` quand il est configuré, plafonné à 120 s par défaut. Les exécutions déclenchées par Cron sans délai de modèle ou d’agent explicite désactivent le watchdog d’inactivité et s’appuient sur le délai externe de Cron.
- Délai d’expiration des requêtes HTTP fournisseur : `models.providers.<id>.timeoutSeconds` s’applique aux fetchs HTTP de modèle de ce fournisseur, y compris la connexion, les en-têtes, le corps, le délai de requête SDK, la gestion totale d’abandon de fetch protégé et le watchdog d’inactivité du flux du modèle. Utilisez-le pour les fournisseurs locaux/auto-hébergés lents comme Ollama avant d’augmenter le délai d’expiration de tout le runtime de l’agent.

## Où les choses peuvent se terminer tôt

- Délai d’expiration de l’agent (abandon)
- AbortSignal (annulation)
- Déconnexion du Gateway ou délai d’expiration RPC
- Délai d’expiration de `agent.wait` (attente uniquement, n’arrête pas l’agent)

## Connexe

- [Outils](/fr/tools) — outils d’agent disponibles
- [Hooks](/fr/automation/hooks) — scripts pilotés par événements déclenchés par les événements du cycle de vie de l’agent
- [Compaction](/fr/concepts/compaction) — comment les longues conversations sont résumées
- [Approbations d’exécution](/fr/tools/exec-approvals) — portes d’approbation pour les commandes shell
- [Réflexion](/fr/tools/thinking) — configuration du niveau de réflexion/raisonnement
