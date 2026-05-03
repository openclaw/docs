---
read_when:
    - Vous avez besoin d’une procédure pas à pas précise de la boucle de l’agent ou des événements du cycle de vie
    - Vous modifiez la mise en file d’attente des sessions, les écritures de transcription ou le comportement du verrou d’écriture de session
summary: Cycle de vie de la boucle d’agent, flux et sémantique d’attente
title: Boucle d’agent
x-i18n:
    generated_at: "2026-05-03T21:29:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bdd8e98710dce6412f499c37d2d74445f44f93142364c30993de517fdea6c56
    source_path: concepts/agent-loop.md
    workflow: 16
---

Une boucle agentique est l’exécution complète « réelle » d’un agent : réception → assemblage du contexte → inférence du modèle →
exécution des outils → réponses en streaming → persistance. C’est le chemin faisant autorité qui transforme un message
en actions et en réponse finale, tout en gardant l’état de session cohérent.

Dans OpenClaw, une boucle est une exécution unique et sérialisée par session, qui émet des événements de cycle de vie et de flux
pendant que le modèle réfléchit, appelle des outils et diffuse la sortie. Cette documentation explique comment cette boucle authentique est
câblée de bout en bout.

## Points d’entrée

- RPC Gateway : `agent` et `agent.wait`.
- CLI : commande `agent`.

## Fonctionnement (vue d’ensemble)

1. La RPC `agent` valide les paramètres, résout la session (sessionKey/sessionId), persiste les métadonnées de session, retourne immédiatement `{ runId, acceptedAt }`.
2. `agentCommand` exécute l’agent :
   - résout les valeurs par défaut du modèle + thinking/verbose/trace
   - charge l’instantané des skills
   - appelle `runEmbeddedPiAgent` (runtime pi-agent-core)
   - émet **fin/erreur de cycle de vie** si la boucle intégrée n’en émet pas
3. `runEmbeddedPiAgent` :
   - sérialise les exécutions via des files d’attente par session + globales
   - résout le modèle + le profil d’authentification et construit la session pi
   - s’abonne aux événements pi et diffuse les deltas d’assistant/d’outil
   - applique le délai d’expiration -> abandonne l’exécution s’il est dépassé
   - pour les tours du serveur d’application Codex, abandonne un tour accepté qui cesse de produire de la progression côté serveur d’application avant un événement terminal
   - retourne les charges utiles + les métadonnées d’utilisation
4. `subscribeEmbeddedPiSession` relie les événements pi-agent-core au flux `agent` d’OpenClaw :
   - événements d’outil => `stream: "tool"`
   - deltas d’assistant => `stream: "assistant"`
   - événements de cycle de vie => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` utilise `waitForAgentRun` :
   - attend **fin/erreur de cycle de vie** pour `runId`
   - retourne `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Mise en file d’attente + concurrence

- Les exécutions sont sérialisées par clé de session (voie de session) et, éventuellement, via une voie globale.
- Cela évite les courses entre outils/sessions et garde l’historique de session cohérent.
- Les canaux de messagerie peuvent choisir des modes de file d’attente (collect/steer/followup) qui alimentent ce système de voies.
  Voir [File d’attente des commandes](/fr/concepts/queue).
- Les écritures de transcription sont également protégées par un verrou d’écriture de session sur le fichier de session. Le verrou est
  conscient du processus et basé sur fichier ; il détecte donc les rédacteurs qui contournent la file d’attente en processus ou proviennent
  d’un autre processus. Les rédacteurs de transcription de session attendent jusqu’à `session.writeLock.acquireTimeoutMs`
  avant de signaler que la session est occupée ; la valeur par défaut est `60000` ms.
- Les verrous d’écriture de session sont non réentrants par défaut. Si un assistant imbrique intentionnellement l’acquisition du
  même verrou tout en préservant un rédacteur logique unique, il doit s’y inscrire explicitement avec
  `allowReentrant: true`.

## Préparation de la session + de l’espace de travail

- L’espace de travail est résolu et créé ; les exécutions en bac à sable peuvent être redirigées vers une racine d’espace de travail en bac à sable.
- Les Skills sont chargés (ou réutilisés depuis un instantané) et injectés dans l’environnement et le prompt.
- Les fichiers de bootstrap/contexte sont résolus et injectés dans le rapport du prompt système.
- Un verrou d’écriture de session est acquis ; `SessionManager` est ouvert et préparé avant le streaming. Tout
  chemin ultérieur de réécriture de transcription, Compaction ou troncature doit prendre le même verrou avant d’ouvrir ou
  de modifier le fichier de transcription.

## Assemblage du prompt + prompt système

- Le prompt système est construit à partir du prompt de base d’OpenClaw, du prompt des Skills, du contexte de bootstrap et des remplacements par exécution.
- Les limites propres au modèle et les jetons de réserve de Compaction sont appliqués.
- Voir [Prompt système](/fr/concepts/system-prompt) pour savoir ce que voit le modèle.

## Points d’accroche (où vous pouvez intercepter)

OpenClaw dispose de deux systèmes de hooks :

- **Hooks internes** (hooks Gateway) : scripts pilotés par événements pour les commandes et événements de cycle de vie.
- **Hooks Plugin** : points d’extension dans le cycle de vie de l’agent/outil et le pipeline Gateway.

### Hooks internes (hooks Gateway)

- **`agent:bootstrap`** : s’exécute lors de la construction des fichiers de bootstrap avant la finalisation du prompt système.
  Utilisez-le pour ajouter/supprimer des fichiers de contexte de bootstrap.
- **Hooks de commande** : `/new`, `/reset`, `/stop` et autres événements de commande (voir la documentation Hooks).

Voir [Hooks](/fr/automation/hooks) pour la configuration et des exemples.

### Hooks Plugin (cycle de vie de l’agent + Gateway)

Ils s’exécutent dans la boucle d’agent ou le pipeline Gateway :

- **`before_model_resolve`** : s’exécute avant la session (sans `messages`) pour remplacer déterministiquement le fournisseur/modèle avant la résolution du modèle.
- **`before_prompt_build`** : s’exécute après le chargement de la session (avec `messages`) pour injecter `prependContext`, `systemPrompt`, `prependSystemContext` ou `appendSystemContext` avant la soumission du prompt. Utilisez `prependContext` pour le texte dynamique par tour et les champs de contexte système pour les consignes stables qui doivent résider dans l’espace du prompt système.
- **`before_agent_start`** : hook de compatibilité hérité qui peut s’exécuter dans l’une ou l’autre phase ; préférez les hooks explicites ci-dessus.
- **`before_agent_reply`** : s’exécute après les actions en ligne et avant l’appel au LLM, permettant à un Plugin de revendiquer le tour et de retourner une réponse synthétique ou de rendre le tour entièrement silencieux.
- **`agent_end`** : inspecte la liste finale des messages et les métadonnées d’exécution après achèvement.
- **`before_compaction` / `after_compaction`** : observe ou annote les cycles de Compaction.
- **`before_tool_call` / `after_tool_call`** : intercepte les paramètres/résultats d’outil.
- **`before_install`** : inspecte les résultats de scan intégrés et peut éventuellement bloquer les installations de skill ou de Plugin.
- **`tool_result_persist`** : transforme de façon synchrone les résultats d’outil avant leur écriture dans une transcription de session appartenant à OpenClaw.
- **`message_received` / `message_sending` / `message_sent`** : hooks de messages entrants + sortants.
- **`session_start` / `session_end`** : limites de cycle de vie de session.
- **`gateway_start` / `gateway_stop`** : événements de cycle de vie Gateway.

Règles de décision des hooks pour les garde-fous sortants/d’outils :

- `before_tool_call` : `{ block: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `before_tool_call` : `{ block: false }` est sans effet et n’efface pas un blocage antérieur.
- `before_install` : `{ block: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `before_install` : `{ block: false }` est sans effet et n’efface pas un blocage antérieur.
- `message_sending` : `{ cancel: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `message_sending` : `{ cancel: false }` est sans effet et n’efface pas une annulation antérieure.

Voir [Hooks Plugin](/fr/plugins/hooks) pour l’API des hooks et les détails d’inscription.

Les harnais peuvent adapter ces hooks différemment. Le harnais du serveur d’application Codex conserve
les hooks Plugin OpenClaw comme contrat de compatibilité pour les surfaces miroir documentées,
tandis que les hooks natifs Codex restent un mécanisme Codex distinct de plus bas niveau.

## Streaming + réponses partielles

- Les deltas d’assistant sont diffusés depuis pi-agent-core et émis comme événements `assistant`.
- Le streaming par bloc peut émettre des réponses partielles soit sur `text_end`, soit sur `message_end`.
- Le streaming de raisonnement peut être émis comme flux séparé ou comme réponses par blocs.
- Voir [Streaming](/fr/concepts/streaming) pour le comportement de découpage et de réponse par bloc.

## Exécution d’outils + outils de messagerie

- Les événements de début/mise à jour/fin d’outil sont émis sur le flux `tool`.
- Les résultats d’outil sont assainis pour la taille et les charges utiles d’image avant journalisation/émission.
- Les envois d’outil de messagerie sont suivis pour supprimer les confirmations d’assistant dupliquées.

## Mise en forme + suppression des réponses

- Les charges utiles finales sont assemblées à partir de :
  - texte de l’assistant (et raisonnement facultatif)
  - résumés d’outils en ligne (lorsque verbose + autorisé)
  - texte d’erreur de l’assistant lorsque le modèle échoue
- Le jeton silencieux exact `NO_REPLY` / `no_reply` est filtré des charges utiles
  sortantes.
- Les doublons d’outil de messagerie sont retirés de la liste finale des charges utiles.
- S’il ne reste aucune charge utile affichable et qu’un outil a échoué, une réponse de secours d’erreur d’outil est émise
  (sauf si un outil de messagerie a déjà envoyé une réponse visible par l’utilisateur).

## Compaction + nouvelles tentatives

- La Compaction automatique émet des événements de flux `compaction` et peut déclencher une nouvelle tentative.
- Lors d’une nouvelle tentative, les tampons en mémoire et les résumés d’outils sont réinitialisés pour éviter une sortie dupliquée.
- Voir [Compaction](/fr/concepts/compaction) pour le pipeline de Compaction.

## Flux d’événements (aujourd’hui)

- `lifecycle` : émis par `subscribeEmbeddedPiSession` (et en solution de repli par `agentCommand`)
- `assistant` : deltas diffusés depuis pi-agent-core
- `tool` : événements d’outil diffusés depuis pi-agent-core

## Gestion des canaux de chat

- Les deltas d’assistant sont mis en tampon dans des messages de chat `delta`.
- Un `final` de chat est émis lors de **fin/erreur de cycle de vie**.

## Délais d’expiration

- Valeur par défaut de `agent.wait` : 30 s (uniquement l’attente). Le paramètre `timeoutMs` remplace cette valeur.
- Runtime de l’agent : `agents.defaults.timeoutSeconds` vaut par défaut 172800 s (48 heures) ; appliqué dans le minuteur d’abandon de `runEmbeddedPiAgent`.
- Runtime Cron : le `timeoutSeconds` d’un tour d’agent isolé appartient à cron. Le planificateur démarre ce minuteur lorsque l’exécution commence, abandonne l’exécution sous-jacente à l’échéance configurée, puis exécute un nettoyage borné avant d’enregistrer le délai d’expiration afin qu’une session enfant obsolète ne puisse pas bloquer la voie.
- Diagnostics de vivacité de session : lorsque les diagnostics sont activés, `diagnostics.stuckSessionWarnMs` classe les longues sessions `processing` qui n’ont aucune réponse, outil, statut, bloc ou progression ACP observés. Les exécutions intégrées actives, appels de modèle et appels d’outil sont signalés comme `session.long_running` ; le travail actif sans progression récente est signalé comme `session.stalled` ; `session.stuck` est réservé à la comptabilité de session obsolète sans travail actif. La comptabilité de session obsolète libère immédiatement la voie de session concernée ; les exécutions intégrées bloquées ne sont abandonnées et drainées qu’après une fenêtre prolongée sans progression (au moins 10 minutes et 5x le seuil d’avertissement), afin que le travail en file puisse reprendre sans interrompre des exécutions simplement lentes. Les diagnostics `session.stuck` répétés appliquent un délai progressif tant que la session reste inchangée.
- Délai d’inactivité du modèle : OpenClaw abandonne une requête de modèle lorsqu’aucun fragment de réponse n’arrive avant la fenêtre d’inactivité. `models.providers.<id>.timeoutSeconds` étend ce chien de garde d’inactivité pour les fournisseurs locaux/auto-hébergés lents ; sinon OpenClaw utilise `agents.defaults.timeoutSeconds` lorsqu’il est configuré, plafonné à 120 s par défaut. Les exécutions déclenchées par Cron sans délai d’expiration explicite de modèle ou d’agent désactivent le chien de garde d’inactivité et s’appuient sur le délai d’expiration externe de Cron.
- Délai d’expiration des requêtes HTTP du fournisseur : `models.providers.<id>.timeoutSeconds` s’applique aux récupérations HTTP de modèle de ce fournisseur, y compris la connexion, les en-têtes, le corps, le délai d’expiration de requête du SDK, la gestion d’abandon guarded-fetch totale et le chien de garde d’inactivité du flux de modèle. Utilisez-le pour les fournisseurs locaux/auto-hébergés lents comme Ollama avant d’augmenter le délai d’expiration de tout le runtime de l’agent.

## Où les choses peuvent se terminer plus tôt

- Délai d’expiration de l’agent (abandon)
- AbortSignal (annulation)
- Déconnexion Gateway ou délai d’expiration RPC
- Délai d’expiration `agent.wait` (attente uniquement, n’arrête pas l’agent)

## Associé

- [Outils](/fr/tools) — outils d’agent disponibles
- [Hooks](/fr/automation/hooks) — scripts pilotés par événements déclenchés par les événements de cycle de vie de l’agent
- [Compaction](/fr/concepts/compaction) — comment les longues conversations sont résumées
- [Approbations Exec](/fr/tools/exec-approvals) — barrières d’approbation pour les commandes shell
- [Thinking](/fr/tools/thinking) — configuration du niveau de réflexion/raisonnement
