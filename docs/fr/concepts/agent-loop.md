---
read_when:
    - Vous avez besoin d’un guide pas à pas précis de la boucle de l’agent ou des événements du cycle de vie
    - Vous modifiez la mise en file d’attente des sessions, les écritures de transcription ou le comportement du verrou d’écriture de session
summary: Cycle de vie de la boucle d’agent, flux et sémantique d’attente
title: Boucle de l’agent
x-i18n:
    generated_at: "2026-05-05T06:16:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1c7031a2b70e7a891f51fa127df6f04663db81400715717f50dd840a3fa5b745
    source_path: concepts/agent-loop.md
    workflow: 16
---

Une boucle agentique correspond à l’exécution « réelle » complète d’un agent : réception → assemblage du contexte → inférence du modèle →
exécution d’outils → réponses en streaming → persistance. C’est le chemin de référence qui transforme un message
en actions et en réponse finale, tout en maintenant la cohérence de l’état de session.

Dans OpenClaw, une boucle est une exécution unique et sérialisée par session, qui émet des événements de cycle de vie et de flux
pendant que le modèle réfléchit, appelle des outils et diffuse la sortie. Ce document explique comment cette boucle authentique est
câblée de bout en bout.

## Points d’entrée

- RPC Gateway : `agent` et `agent.wait`.
- CLI : commande `agent`.

## Fonctionnement (vue d’ensemble)

1. Le RPC `agent` valide les paramètres, résout la session (sessionKey/sessionId), persiste les métadonnées de session, renvoie immédiatement `{ runId, acceptedAt }`.
2. `agentCommand` exécute l’agent :
   - résout les valeurs par défaut du modèle + thinking/verbose/trace
   - charge l’instantané des Skills
   - appelle `runEmbeddedPiAgent` (runtime pi-agent-core)
   - émet **fin/erreur de cycle de vie** si la boucle intégrée n’en émet pas
3. `runEmbeddedPiAgent` :
   - sérialise les exécutions via des files par session + globale
   - résout le modèle + le profil d’authentification et construit la session pi
   - s’abonne aux événements pi et diffuse les deltas assistant/outil
   - impose un délai d’expiration -> interrompt l’exécution si celui-ci est dépassé
   - pour les tours du serveur d’application Codex, interrompt un tour accepté qui cesse de produire de la progression du serveur d’application avant un événement terminal
   - renvoie les charges utiles + les métadonnées d’utilisation
4. `subscribeEmbeddedPiSession` relie les événements pi-agent-core au flux `agent` d’OpenClaw :
   - événements d’outil => `stream: "tool"`
   - deltas de l’assistant => `stream: "assistant"`
   - événements de cycle de vie => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` utilise `waitForAgentRun` :
   - attend **fin/erreur de cycle de vie** pour `runId`
   - renvoie `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Mise en file + concurrence

- Les exécutions sont sérialisées par clé de session (voie de session) et éventuellement via une voie globale.
- Cela évite les courses entre outils/sessions et maintient la cohérence de l’historique de session.
- Les canaux de messagerie peuvent choisir des modes de file (collect/steer/followup) qui alimentent ce système de voies.
  Voir [File de commandes](/fr/concepts/queue).
- Les écritures de transcript sont également protégées par un verrou d’écriture de session sur le fichier de session. Le verrou est
  conscient du processus et basé sur un fichier, ce qui lui permet de détecter les rédacteurs qui contournent la file en processus ou proviennent
  d’un autre processus. Les rédacteurs de transcripts de session attendent jusqu’à `session.writeLock.acquireTimeoutMs`
  avant de signaler que la session est occupée ; la valeur par défaut est `60000` ms.
- Les verrous d’écriture de session ne sont pas réentrants par défaut. Si un helper imbrique intentionnellement l’acquisition du
  même verrou tout en préservant un seul rédacteur logique, il doit l’activer explicitement avec
  `allowReentrant: true`.

## Préparation de la session + de l’espace de travail

- L’espace de travail est résolu et créé ; les exécutions en bac à sable peuvent être redirigées vers une racine d’espace de travail de bac à sable.
- Les Skills sont chargés (ou réutilisés depuis un instantané) et injectés dans l’environnement et le prompt.
- Les fichiers de bootstrap/contexte sont résolus et injectés dans le rapport de prompt système.
- Un verrou d’écriture de session est acquis ; `SessionManager` est ouvert et préparé avant le streaming. Tout
  chemin ultérieur de réécriture, compaction ou troncature du transcript doit prendre le même verrou avant d’ouvrir ou
  de modifier le fichier de transcript.

## Assemblage du prompt + prompt système

- Le prompt système est construit à partir du prompt de base d’OpenClaw, du prompt des Skills, du contexte de bootstrap et des remplacements par exécution.
- Les limites propres au modèle et les jetons réservés à la Compaction sont appliqués.
- Voir [Prompt système](/fr/concepts/system-prompt) pour ce que le modèle voit.

## Points de hook (où vous pouvez intercepter)

OpenClaw possède deux systèmes de hooks :

- **Hooks internes** (hooks Gateway) : scripts pilotés par événements pour les commandes et les événements de cycle de vie.
- **Hooks de Plugin** : points d’extension dans le cycle de vie de l’agent/outil et le pipeline Gateway.

### Hooks internes (hooks Gateway)

- **`agent:bootstrap`** : s’exécute pendant la construction des fichiers de bootstrap avant la finalisation du prompt système.
  Utilisez-le pour ajouter/supprimer des fichiers de contexte de bootstrap.
- **Hooks de commande** : `/new`, `/reset`, `/stop` et autres événements de commande (voir la documentation Hooks).

Voir [Hooks](/fr/automation/hooks) pour la configuration et des exemples.

### Hooks de Plugin (cycle de vie agent + Gateway)

Ils s’exécutent dans la boucle agent ou le pipeline Gateway :

- **`before_model_resolve`** : s’exécute avant la session (sans `messages`) pour remplacer de manière déterministe le fournisseur/modèle avant la résolution du modèle.
- **`before_prompt_build`** : s’exécute après le chargement de session (avec `messages`) pour injecter `prependContext`, `systemPrompt`, `prependSystemContext` ou `appendSystemContext` avant la soumission du prompt. Utilisez `prependContext` pour le texte dynamique par tour et les champs de contexte système pour les consignes stables qui doivent rester dans l’espace du prompt système.
- **`before_agent_start`** : hook de compatibilité hérité qui peut s’exécuter dans l’une ou l’autre phase ; préférez les hooks explicites ci-dessus.
- **`before_agent_reply`** : s’exécute après les actions en ligne et avant l’appel au LLM, ce qui permet à un Plugin de prendre en charge le tour et de renvoyer une réponse synthétique ou de rendre le tour entièrement silencieux.
- **`agent_end`** : inspecte la liste finale des messages et les métadonnées d’exécution après l’achèvement.
- **`before_compaction` / `after_compaction`** : observe ou annote les cycles de Compaction.
- **`before_tool_call` / `after_tool_call`** : intercepte les paramètres/résultats d’outil.
- **`before_install`** : inspecte les résultats de scan intégrés et peut bloquer les installations de Skills ou de plugins.
- **`tool_result_persist`** : transforme de manière synchrone les résultats d’outil avant leur écriture dans un transcript de session détenu par OpenClaw.
- **`message_received` / `message_sending` / `message_sent`** : hooks de messages entrants + sortants.
- **`session_start` / `session_end`** : limites du cycle de vie de session.
- **`gateway_start` / `gateway_stop`** : événements de cycle de vie Gateway.

Règles de décision des hooks pour les protections sortantes/d’outil :

- `before_tool_call` : `{ block: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `before_tool_call` : `{ block: false }` est un no-op et n’efface pas un blocage précédent.
- `before_install` : `{ block: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `before_install` : `{ block: false }` est un no-op et n’efface pas un blocage précédent.
- `message_sending` : `{ cancel: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `message_sending` : `{ cancel: false }` est un no-op et n’efface pas une annulation précédente.

Voir [Hooks de Plugin](/fr/plugins/hooks) pour l’API de hooks et les détails d’enregistrement.

Les harnais peuvent adapter ces hooks différemment. Le harnais du serveur d’application Codex conserve
les hooks de Plugin OpenClaw comme contrat de compatibilité pour les surfaces documentées en miroir,
tandis que les hooks natifs Codex restent un mécanisme Codex distinct de plus bas niveau.

## Streaming + réponses partielles

- Les deltas de l’assistant sont diffusés depuis pi-agent-core et émis comme événements `assistant`.
- Le streaming par blocs peut émettre des réponses partielles soit sur `text_end`, soit sur `message_end`.
- Le streaming de raisonnement peut être émis comme flux séparé ou comme réponses par blocs.
- Voir [Streaming](/fr/concepts/streaming) pour le comportement de découpage et de réponse par blocs.

## Exécution d’outils + outils de messagerie

- Les événements de début/mise à jour/fin d’outil sont émis sur le flux `tool`.
- Les résultats d’outil sont nettoyés en taille et en charges utiles d’image avant journalisation/émission.
- Les envois par outil de messagerie sont suivis pour supprimer les confirmations d’assistant en double.

## Façonnage + suppression des réponses

- Les charges utiles finales sont assemblées à partir de :
  - texte de l’assistant (et raisonnement facultatif)
  - résumés d’outils en ligne (lorsque verbose + autorisé)
  - texte d’erreur de l’assistant lorsque le modèle échoue
- Le jeton silencieux exact `NO_REPLY` / `no_reply` est filtré des charges utiles
  sortantes.
- Les doublons d’outils de messagerie sont retirés de la liste finale des charges utiles.
- S’il ne reste aucune charge utile affichable et qu’un outil a échoué, une réponse de secours d’erreur d’outil est émise
  (sauf si un outil de messagerie a déjà envoyé une réponse visible par l’utilisateur).

## Compaction + nouvelles tentatives

- La Compaction automatique émet des événements de flux `compaction` et peut déclencher une nouvelle tentative.
- Lors d’une nouvelle tentative, les tampons en mémoire et les résumés d’outils sont réinitialisés afin d’éviter les sorties en double.
- Voir [Compaction](/fr/concepts/compaction) pour le pipeline de Compaction.

## Flux d’événements (aujourd’hui)

- `lifecycle` : émis par `subscribeEmbeddedPiSession` (et en secours par `agentCommand`)
- `assistant` : deltas diffusés depuis pi-agent-core
- `tool` : événements d’outil diffusés depuis pi-agent-core

## Gestion des canaux de chat

- Les deltas de l’assistant sont mis en tampon dans des messages de chat `delta`.
- Un `final` de chat est émis sur **fin/erreur de cycle de vie**.

## Délais d’expiration

- Valeur par défaut de `agent.wait` : 30 s (uniquement l’attente). Le paramètre `timeoutMs` remplace cette valeur.
- Runtime agent : `agents.defaults.timeoutSeconds` vaut par défaut 172800 s (48 heures) ; appliqué dans le minuteur d’interruption de `runEmbeddedPiAgent`.
- Runtime Cron : le `timeoutSeconds` des tours agent isolés appartient à Cron. Le planificateur démarre ce minuteur lorsque l’exécution commence, interrompt l’exécution sous-jacente à l’échéance configurée, puis exécute un nettoyage borné avant d’enregistrer le délai d’expiration afin qu’une session enfant obsolète ne puisse pas bloquer la voie.
- Diagnostics de vivacité de session : avec les diagnostics activés, `diagnostics.stuckSessionWarnMs` classe les longues sessions `processing` qui n’ont pas de réponse, outil, statut, bloc ou progression ACP observés. Les exécutions intégrées, appels de modèle et appels d’outil actifs sont signalés comme `session.long_running` ; le travail actif sans progression récente est signalé comme `session.stalled` ; `session.stuck` est réservé à la comptabilité de session obsolète sans travail actif. La comptabilité de session obsolète libère immédiatement la voie de session affectée ; les exécutions intégrées bloquées ne sont interrompues puis drainées qu’après `diagnostics.stuckSessionAbortMs` (par défaut : au moins 10 minutes et 5x le seuil d’avertissement), afin que le travail en file puisse reprendre sans interrompre de simples exécutions lentes. La récupération émet des résultats structurés demandés/terminés, et l’état de diagnostic n’est marqué inactif que si la même génération de traitement est toujours courante. Les diagnostics `session.stuck` répétés appliquent un backoff tant que la session reste inchangée.
- Délai d’inactivité du modèle : OpenClaw interrompt une requête de modèle lorsqu’aucun fragment de réponse n’arrive avant la fenêtre d’inactivité. `models.providers.<id>.timeoutSeconds` étend ce chien de garde d’inactivité pour les fournisseurs locaux/auto-hébergés lents ; sinon OpenClaw utilise `agents.defaults.timeoutSeconds` lorsqu’il est configuré, plafonné à 120 s par défaut. Les exécutions déclenchées par Cron sans délai d’expiration explicite de modèle ou d’agent désactivent le chien de garde d’inactivité et s’appuient sur le délai d’expiration externe de Cron.
- Délai d’expiration des requêtes HTTP du fournisseur : `models.providers.<id>.timeoutSeconds` s’applique aux fetches HTTP du modèle de ce fournisseur, y compris la connexion, les en-têtes, le corps, le délai d’expiration des requêtes SDK, la gestion d’interruption de fetch gardé total et le chien de garde d’inactivité du flux de modèle. Utilisez-le pour les fournisseurs locaux/auto-hébergés lents comme Ollama avant d’augmenter le délai d’expiration global du runtime agent.

## Où les choses peuvent se terminer tôt

- Délai d’expiration de l’agent (interruption)
- AbortSignal (annulation)
- Déconnexion Gateway ou délai d’expiration RPC
- Délai d’expiration `agent.wait` (attente uniquement, n’arrête pas l’agent)

## Associés

- [Outils](/fr/tools) — outils d’agent disponibles
- [Hooks](/fr/automation/hooks) — scripts pilotés par événements déclenchés par les événements de cycle de vie de l’agent
- [Compaction](/fr/concepts/compaction) — comment les longues conversations sont résumées
- [Approbations Exec](/fr/tools/exec-approvals) — barrières d’approbation pour les commandes shell
- [Thinking](/fr/tools/thinking) — configuration du niveau de réflexion/raisonnement
