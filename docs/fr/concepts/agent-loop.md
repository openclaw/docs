---
read_when:
    - Vous avez besoin d’une description pas à pas exacte de la boucle de l’agent ou des événements du cycle de vie
    - Vous modifiez la mise en file d’attente des sessions, les écritures de transcription ou le comportement du verrou d’écriture de session
summary: Cycle de vie de la boucle d’agent, flux et sémantique d’attente
title: Boucle de l’agent
x-i18n:
    generated_at: "2026-05-02T20:44:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39c49e8c5d1e380e0569e31856d855484d5a8fa33b04cf85cccde4c9ac21fbe7
    source_path: concepts/agent-loop.md
    workflow: 16
---

Une boucle agentique est l’exécution « réelle » complète d’un agent : ingestion → assemblage du contexte → inférence du modèle →
exécution des outils → réponses en streaming → persistance. C’est le chemin faisant autorité qui transforme un message
en actions et en réponse finale, tout en gardant l’état de session cohérent.

Dans OpenClaw, une boucle est une exécution unique et sérialisée par session qui émet des événements de cycle de vie et de flux
pendant que le modèle réfléchit, appelle des outils et diffuse la sortie. Ce document explique comment cette boucle authentique est
câblée de bout en bout.

## Points d’entrée

- RPC Gateway : `agent` et `agent.wait`.
- CLI : commande `agent`.

## Fonctionnement (vue d’ensemble)

1. Le RPC `agent` valide les paramètres, résout la session (sessionKey/sessionId), persiste les métadonnées de session, renvoie immédiatement `{ runId, acceptedAt }`.
2. `agentCommand` exécute l’agent :
   - résout le modèle + les valeurs par défaut de réflexion/verbosité/trace
   - charge l’instantané des skills
   - appelle `runEmbeddedPiAgent` (runtime pi-agent-core)
   - émet **fin/erreur de cycle de vie** si la boucle intégrée n’en émet pas
3. `runEmbeddedPiAgent` :
   - sérialise les exécutions via des files par session + globales
   - résout le modèle + le profil d’authentification et construit la session pi
   - s’abonne aux événements pi et diffuse les deltas assistant/outil
   - applique le délai d’expiration -> interrompt l’exécution s’il est dépassé
   - pour les tours du serveur d’application Codex, interrompt un tour accepté qui cesse de produire de la progression côté serveur d’application avant un événement terminal
   - renvoie les charges utiles + les métadonnées d’utilisation
4. `subscribeEmbeddedPiSession` fait le pont entre les événements pi-agent-core et le flux OpenClaw `agent` :
   - événements d’outil => `stream: "tool"`
   - deltas de l’assistant => `stream: "assistant"`
   - événements de cycle de vie => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` utilise `waitForAgentRun` :
   - attend **fin/erreur de cycle de vie** pour `runId`
   - renvoie `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Mise en file + concurrence

- Les exécutions sont sérialisées par clé de session (voie de session) et éventuellement via une voie globale.
- Cela évite les courses entre outils/sessions et garde l’historique de session cohérent.
- Les canaux de messagerie peuvent choisir des modes de file (collect/steer/followup) qui alimentent ce système de voies.
  Voir [File de commandes](/fr/concepts/queue).
- Les écritures de transcription sont également protégées par un verrou d’écriture de session sur le fichier de session. Le verrou est
  conscient des processus et basé sur fichier, ce qui lui permet de détecter les rédacteurs qui contournent la file en cours de processus ou proviennent
  d’un autre processus. Les rédacteurs de transcription de session attendent jusqu’à `session.writeLock.acquireTimeoutMs`
  avant de signaler la session comme occupée ; la valeur par défaut est `60000` ms.
- Les verrous d’écriture de session ne sont pas réentrants par défaut. Si un assistant imbrique intentionnellement l’acquisition du
  même verrou tout en préservant un rédacteur logique unique, il doit l’activer explicitement avec
  `allowReentrant: true`.

## Préparation de la session + de l’espace de travail

- L’espace de travail est résolu et créé ; les exécutions en bac à sable peuvent être redirigées vers une racine d’espace de travail de bac à sable.
- Les skills sont chargées (ou réutilisées depuis un instantané) et injectées dans l’environnement et le prompt.
- Les fichiers d’amorçage/contexte sont résolus et injectés dans le rapport de prompt système.
- Un verrou d’écriture de session est acquis ; `SessionManager` est ouvert et préparé avant le streaming. Tout
  chemin ultérieur de réécriture de transcription, de compactage ou de troncature doit prendre le même verrou avant d’ouvrir ou de
  modifier le fichier de transcription.

## Assemblage du prompt + prompt système

- Le prompt système est construit à partir du prompt de base d’OpenClaw, du prompt de skills, du contexte d’amorçage et des surcharges par exécution.
- Les limites propres au modèle et les jetons de réserve de compactage sont appliqués.
- Voir [Prompt système](/fr/concepts/system-prompt) pour ce que voit le modèle.

## Points d’accroche (où intercepter)

OpenClaw dispose de deux systèmes de hooks :

- **Hooks internes** (hooks Gateway) : scripts pilotés par événements pour les commandes et les événements de cycle de vie.
- **Hooks Plugin** : points d’extension dans le cycle de vie agent/outil et le pipeline Gateway.

### Hooks internes (hooks Gateway)

- **`agent:bootstrap`** : s’exécute pendant la construction des fichiers d’amorçage, avant la finalisation du prompt système.
  Utilisez-le pour ajouter/supprimer des fichiers de contexte d’amorçage.
- **Hooks de commande** : `/new`, `/reset`, `/stop`, et autres événements de commande (voir la documentation Hooks).

Voir [Hooks](/fr/automation/hooks) pour la configuration et des exemples.

### Hooks Plugin (cycle de vie agent + gateway)

Ils s’exécutent dans la boucle de l’agent ou le pipeline gateway :

- **`before_model_resolve`** : s’exécute avant la session (sans `messages`) pour remplacer de manière déterministe le fournisseur/modèle avant la résolution du modèle.
- **`before_prompt_build`** : s’exécute après le chargement de session (avec `messages`) pour injecter `prependContext`, `systemPrompt`, `prependSystemContext` ou `appendSystemContext` avant la soumission du prompt. Utilisez `prependContext` pour du texte dynamique par tour et les champs de contexte système pour des consignes stables qui doivent se trouver dans l’espace du prompt système.
- **`before_agent_start`** : hook de compatibilité hérité qui peut s’exécuter dans l’une ou l’autre phase ; préférez les hooks explicites ci-dessus.
- **`before_agent_reply`** : s’exécute après les actions en ligne et avant l’appel au LLM, permettant à un plugin de revendiquer le tour et de renvoyer une réponse synthétique ou de rendre le tour entièrement silencieux.
- **`agent_end`** : inspecte la liste finale des messages et les métadonnées d’exécution après achèvement.
- **`before_compaction` / `after_compaction`** : observe ou annote les cycles de compactage.
- **`before_tool_call` / `after_tool_call`** : intercepte les paramètres/résultats d’outils.
- **`before_install`** : inspecte les résultats d’analyse intégrés et peut bloquer l’installation de skills ou de plugins.
- **`tool_result_persist`** : transforme de façon synchrone les résultats d’outils avant qu’ils soient écrits dans une transcription de session appartenant à OpenClaw.
- **`message_received` / `message_sending` / `message_sent`** : hooks de messages entrants + sortants.
- **`session_start` / `session_end`** : limites du cycle de vie de session.
- **`gateway_start` / `gateway_stop`** : événements du cycle de vie gateway.

Règles de décision des hooks pour les gardes sortants/outils :

- `before_tool_call` : `{ block: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `before_tool_call` : `{ block: false }` est un no-op et n’efface pas un blocage antérieur.
- `before_install` : `{ block: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `before_install` : `{ block: false }` est un no-op et n’efface pas un blocage antérieur.
- `message_sending` : `{ cancel: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `message_sending` : `{ cancel: false }` est un no-op et n’efface pas une annulation antérieure.

Voir [Hooks Plugin](/fr/plugins/hooks) pour l’API de hook et les détails d’enregistrement.

Les harnais peuvent adapter ces hooks différemment. Le harnais de serveur d’application Codex conserve
les hooks de plugin OpenClaw comme contrat de compatibilité pour les surfaces miroir documentées,
tandis que les hooks natifs Codex restent un mécanisme Codex de plus bas niveau distinct.

## Streaming + réponses partielles

- Les deltas de l’assistant sont diffusés depuis pi-agent-core et émis sous forme d’événements `assistant`.
- Le streaming par blocs peut émettre des réponses partielles soit sur `text_end`, soit sur `message_end`.
- Le streaming de raisonnement peut être émis comme flux séparé ou comme réponses par blocs.
- Voir [Streaming](/fr/concepts/streaming) pour le découpage en fragments et le comportement des réponses par blocs.

## Exécution d’outils + outils de messagerie

- Les événements de début/mise à jour/fin d’outil sont émis sur le flux `tool`.
- Les résultats d’outils sont nettoyés pour la taille et les charges utiles d’images avant journalisation/émission.
- Les envois par outil de messagerie sont suivis pour supprimer les confirmations d’assistant en double.

## Mise en forme + suppression des réponses

- Les charges utiles finales sont assemblées à partir de :
  - texte de l’assistant (et raisonnement optionnel)
  - résumés d’outils en ligne (si verbeux + autorisé)
  - texte d’erreur de l’assistant lorsque le modèle échoue
- Le jeton silencieux exact `NO_REPLY` / `no_reply` est filtré des charges utiles
  sortantes.
- Les doublons d’outils de messagerie sont supprimés de la liste finale des charges utiles.
- Si aucune charge utile affichable ne reste et qu’un outil a échoué, une réponse de secours d’erreur d’outil est émise
  (sauf si un outil de messagerie a déjà envoyé une réponse visible par l’utilisateur).

## Compaction + nouvelles tentatives

- La compactage automatique émet des événements de flux `compaction` et peut déclencher une nouvelle tentative.
- Lors d’une nouvelle tentative, les tampons en mémoire et les résumés d’outils sont réinitialisés pour éviter une sortie dupliquée.
- Voir [Compaction](/fr/concepts/compaction) pour le pipeline de compactage.

## Flux d’événements (aujourd’hui)

- `lifecycle` : émis par `subscribeEmbeddedPiSession` (et en secours par `agentCommand`)
- `assistant` : deltas diffusés depuis pi-agent-core
- `tool` : événements d’outil diffusés depuis pi-agent-core

## Gestion des canaux de chat

- Les deltas de l’assistant sont mis en tampon dans des messages de chat `delta`.
- Un chat `final` est émis sur **fin/erreur de cycle de vie**.

## Délais d’expiration

- `agent.wait` par défaut : 30 s (seulement l’attente). Le paramètre `timeoutMs` remplace cette valeur.
- Runtime de l’agent : `agents.defaults.timeoutSeconds` par défaut 172800 s (48 heures) ; appliqué dans le minuteur d’interruption de `runEmbeddedPiAgent`.
- Runtime Cron : le `timeoutSeconds` d’un tour d’agent isolé appartient à Cron. Le planificateur démarre ce minuteur lorsque l’exécution commence, interrompt l’exécution sous-jacente à l’échéance configurée, puis exécute un nettoyage borné avant d’enregistrer le délai d’expiration afin qu’une session enfant obsolète ne puisse pas bloquer la voie.
- Diagnostics de vivacité de session : lorsque les diagnostics sont activés, `diagnostics.stuckSessionWarnMs` classe les longues sessions `processing` qui n’ont aucune réponse, outil, état, bloc ou progression ACP observés. Les exécutions intégrées actives, les appels de modèle et les appels d’outil sont signalés comme `session.long_running` ; le travail actif sans progression récente est signalé comme `session.stalled` ; `session.stuck` est réservé à la comptabilité de session obsolète sans travail actif, et seul ce chemin libère la voie de session affectée afin que le travail de démarrage en file puisse s’écouler. Les diagnostics `session.stuck` répétés appliquent un recul tant que la session reste inchangée.
- Délai d’inactivité du modèle : OpenClaw interrompt une requête de modèle lorsqu’aucun fragment de réponse n’arrive avant la fenêtre d’inactivité. `models.providers.<id>.timeoutSeconds` étend ce chien de garde d’inactivité pour les fournisseurs lents locaux/auto-hébergés ; sinon OpenClaw utilise `agents.defaults.timeoutSeconds` lorsqu’il est configuré, plafonné à 120 s par défaut. Les exécutions déclenchées par Cron sans délai d’expiration explicite de modèle ou d’agent désactivent le chien de garde d’inactivité et s’appuient sur le délai d’expiration externe de cron.
- Délai d’expiration des requêtes HTTP du fournisseur : `models.providers.<id>.timeoutSeconds` s’applique aux récupérations HTTP de modèle de ce fournisseur, y compris la connexion, les en-têtes, le corps, le délai d’expiration des requêtes SDK, la gestion totale de l’interruption guarded-fetch et le chien de garde d’inactivité du flux de modèle. Utilisez-le pour les fournisseurs lents locaux/auto-hébergés comme Ollama avant d’augmenter le délai d’exécution de tout l’agent.

## Où les choses peuvent se terminer tôt

- Délai d’expiration de l’agent (interruption)
- AbortSignal (annulation)
- Déconnexion Gateway ou délai d’expiration RPC
- Délai d’expiration `agent.wait` (attente uniquement, n’arrête pas l’agent)

## Liens connexes

- [Outils](/fr/tools) — outils d’agent disponibles
- [Hooks](/fr/automation/hooks) — scripts pilotés par événements déclenchés par les événements de cycle de vie de l’agent
- [Compaction](/fr/concepts/compaction) — comment les longues conversations sont résumées
- [Approbations Exec](/fr/tools/exec-approvals) — barrières d’approbation pour les commandes shell
- [Réflexion](/fr/tools/thinking) — configuration du niveau de réflexion/raisonnement
