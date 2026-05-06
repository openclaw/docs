---
read_when:
    - Vous avez besoin d’un guide pas à pas précis de la boucle de l’agent ou des événements de cycle de vie
    - Vous modifiez le comportement de mise en file d’attente des sessions, d’écriture des transcriptions ou de verrouillage d’écriture des sessions
summary: Cycle de vie de la boucle d’agent, flux et sémantique d’attente
title: Boucle d’agent
x-i18n:
    generated_at: "2026-05-06T07:17:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: e040d090e686db47a432c8d6f13c167838825b16e491297422f909aba0add5f0
    source_path: concepts/agent-loop.md
    workflow: 16
---

Une boucle agentique est l'exécution complète et « réelle » d'un agent : réception → assemblage du contexte → inférence du modèle →
exécution des outils → réponses en streaming → persistance. C'est le chemin faisant autorité qui transforme un message
en actions et en réponse finale, tout en maintenant l'état de session cohérent.

Dans OpenClaw, une boucle est une exécution unique et sérialisée par session, qui émet des événements de cycle de vie et de flux
pendant que le modèle réfléchit, appelle des outils et diffuse la sortie. Cette documentation explique comment cette boucle authentique est
câblée de bout en bout.

## Points d'entrée

- RPC Gateway : `agent` et `agent.wait`.
- CLI : commande `agent`.

## Fonctionnement (vue d'ensemble)

1. Le RPC `agent` valide les paramètres, résout la session (sessionKey/sessionId), persiste les métadonnées de session, retourne immédiatement `{ runId, acceptedAt }`.
2. `agentCommand` exécute l'agent :
   - résout les valeurs par défaut du modèle + pensée/verbose/trace
   - charge l'instantané des Skills
   - appelle `runEmbeddedPiAgent` (runtime pi-agent-core)
   - émet **fin/erreur du cycle de vie** si la boucle intégrée n'en émet pas
3. `runEmbeddedPiAgent` :
   - sérialise les exécutions via des files par session + globales
   - résout le modèle + le profil d'authentification et construit la session pi
   - s'abonne aux événements pi et diffuse les deltas de l'assistant/des outils
   - applique le délai d'expiration -> abandonne l'exécution si celui-ci est dépassé
   - pour les tours du serveur d'application Codex, abandonne un tour accepté qui cesse de produire une progression serveur d'application avant un événement terminal
   - retourne les charges utiles + les métadonnées d'utilisation
4. `subscribeEmbeddedPiSession` relie les événements pi-agent-core au flux `agent` d'OpenClaw :
   - événements d'outil => `stream: "tool"`
   - deltas de l'assistant => `stream: "assistant"`
   - événements de cycle de vie => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` utilise `waitForAgentRun` :
   - attend **fin/erreur du cycle de vie** pour `runId`
   - retourne `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Mise en file + concurrence

- Les exécutions sont sérialisées par clé de session (voie de session) et, facultativement, via une voie globale.
- Cela évite les courses outil/session et maintient l'historique de session cohérent.
- Les canaux de messagerie peuvent choisir des modes de file (collect/steer/followup) qui alimentent ce système de voies.
  Voir [File de commandes](/fr/concepts/queue).
- Les écritures de transcription sont également protégées par un verrou d'écriture de session sur le fichier de session. Le verrou est
  conscient des processus et basé sur fichier, ce qui lui permet de détecter les écrivains qui contournent la file en processus ou viennent
  d'un autre processus. Les écrivains de transcription de session attendent jusqu'à `session.writeLock.acquireTimeoutMs`
  avant de signaler que la session est occupée ; la valeur par défaut est `60000` ms.
- Les verrous d'écriture de session sont non réentrants par défaut. Si un helper imbrique intentionnellement l'acquisition du
  même verrou tout en conservant un seul écrivain logique, il doit l'activer explicitement avec
  `allowReentrant: true`.

## Préparation de la session + de l'espace de travail

- L'espace de travail est résolu et créé ; les exécutions en bac à sable peuvent être redirigées vers une racine d'espace de travail sandbox.
- Les Skills sont chargées (ou réutilisées depuis un instantané) et injectées dans l'environnement et le prompt.
- Les fichiers d'amorçage/contexte sont résolus et injectés dans le rapport de prompt système.
- Un verrou d'écriture de session est acquis ; `SessionManager` est ouvert et préparé avant le streaming. Tout
  chemin ultérieur de réécriture, de compaction ou de troncature de transcription doit prendre le même verrou avant d'ouvrir ou de
  modifier le fichier de transcription.

## Assemblage du prompt + prompt système

- Le prompt système est construit à partir du prompt de base d'OpenClaw, du prompt des Skills, du contexte d'amorçage et des remplacements par exécution.
- Les limites propres au modèle et les jetons de réserve de Compaction sont appliqués.
- Voir [Prompt système](/fr/concepts/system-prompt) pour ce que voit le modèle.

## Points d'accroche (où intercepter)

OpenClaw dispose de deux systèmes de hooks :

- **Hooks internes** (hooks Gateway) : scripts pilotés par événements pour les commandes et les événements de cycle de vie.
- **Hooks de Plugin** : points d'extension à l'intérieur du cycle de vie agent/outil et du pipeline Gateway.

### Hooks internes (hooks Gateway)

- **`agent:bootstrap`** : s'exécute pendant la construction des fichiers d'amorçage, avant la finalisation du prompt système.
  Utilisez-le pour ajouter/supprimer des fichiers de contexte d'amorçage.
- **Hooks de commande** : `/new`, `/reset`, `/stop` et autres événements de commande (voir la documentation Hooks).

Voir [Hooks](/fr/automation/hooks) pour la configuration et des exemples.

### Hooks de Plugin (cycle de vie agent + gateway)

Ils s'exécutent dans la boucle de l'agent ou le pipeline gateway :

- **`before_model_resolve`** : s'exécute avant la session (sans `messages`) pour remplacer de façon déterministe le fournisseur/modèle avant la résolution du modèle.
- **`before_prompt_build`** : s'exécute après le chargement de la session (avec `messages`) pour injecter `prependContext`, `systemPrompt`, `prependSystemContext` ou `appendSystemContext` avant l'envoi du prompt. Utilisez `prependContext` pour le texte dynamique par tour et les champs de contexte système pour les consignes stables qui doivent se trouver dans l'espace du prompt système.
- **`before_agent_start`** : hook de compatibilité hérité qui peut s'exécuter dans l'une ou l'autre phase ; préférez les hooks explicites ci-dessus.
- **`before_agent_reply`** : s'exécute après les actions inline et avant l'appel LLM, permettant à un plugin de revendiquer le tour et de retourner une réponse synthétique ou de réduire entièrement le tour au silence.
- **`agent_end`** : inspecte la liste finale des messages et les métadonnées d'exécution après l'achèvement.
- **`before_compaction` / `after_compaction`** : observe ou annote les cycles de compaction.
- **`before_tool_call` / `after_tool_call`** : intercepte les paramètres/résultats d'outil.
- **`before_install`** : inspecte les résultats d'analyse intégrés et bloque facultativement les installations de skill ou de plugin.
- **`tool_result_persist`** : transforme synchronement les résultats d'outil avant leur écriture dans une transcription de session appartenant à OpenClaw.
- **`message_received` / `message_sending` / `message_sent`** : hooks de messages entrants + sortants.
- **`session_start` / `session_end`** : limites du cycle de vie de session.
- **`gateway_start` / `gateway_stop`** : événements de cycle de vie gateway.

Règles de décision des hooks pour les protections sortantes/d'outils :

- `before_tool_call` : `{ block: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `before_tool_call` : `{ block: false }` est sans effet et n'efface pas un blocage antérieur.
- `before_install` : `{ block: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `before_install` : `{ block: false }` est sans effet et n'efface pas un blocage antérieur.
- `message_sending` : `{ cancel: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `message_sending` : `{ cancel: false }` est sans effet et n'efface pas une annulation antérieure.

Voir [Hooks de Plugin](/fr/plugins/hooks) pour l'API des hooks et les détails d'enregistrement.

Les harnesses peuvent adapter ces hooks différemment. Le harness serveur d'application Codex conserve
les hooks de Plugin OpenClaw comme contrat de compatibilité pour les surfaces miroirs documentées,
tandis que les hooks natifs Codex restent un mécanisme Codex distinct de plus bas niveau.

## Streaming + réponses partielles

- Les deltas de l'assistant sont diffusés depuis pi-agent-core et émis comme événements `assistant`.
- Le streaming par blocs peut émettre des réponses partielles soit sur `text_end`, soit sur `message_end`.
- Le streaming de raisonnement peut être émis comme flux séparé ou comme réponses par blocs.
- Voir [Streaming](/fr/concepts/streaming) pour le découpage en chunks et le comportement des réponses par blocs.

## Exécution des outils + outils de messagerie

- Les événements début/mise à jour/fin d'outil sont émis sur le flux `tool`.
- Les résultats d'outil sont assainis pour la taille et les charges utiles d'image avant journalisation/émission.
- Les envois par outil de messagerie sont suivis afin de supprimer les confirmations d'assistant en double.

## Façonnage + suppression des réponses

- Les charges utiles finales sont assemblées à partir de :
  - texte de l'assistant (et raisonnement facultatif)
  - résumés d'outils inline (lorsque verbose + autorisé)
  - texte d'erreur de l'assistant lorsque le modèle échoue
- Le jeton silencieux exact `NO_REPLY` / `no_reply` est filtré des charges utiles
  sortantes.
- Les doublons d'outils de messagerie sont supprimés de la liste finale des charges utiles.
- S'il ne reste aucune charge utile affichable et qu'un outil a échoué, une réponse d'erreur d'outil de secours est émise
  (sauf si un outil de messagerie a déjà envoyé une réponse visible par l'utilisateur).

## Compaction + nouvelles tentatives

- La compaction automatique émet des événements de flux `compaction` et peut déclencher une nouvelle tentative.
- Lors d'une nouvelle tentative, les tampons en mémoire et les résumés d'outils sont réinitialisés afin d'éviter une sortie en double.
- Voir [Compaction](/fr/concepts/compaction) pour le pipeline de compaction.

## Flux d'événements (aujourd'hui)

- `lifecycle` : émis par `subscribeEmbeddedPiSession` (et en secours par `agentCommand`)
- `assistant` : deltas diffusés depuis pi-agent-core
- `tool` : événements d'outil diffusés depuis pi-agent-core

## Gestion des canaux de chat

- Les deltas de l'assistant sont mis en tampon dans des messages de chat `delta`.
- Un `final` de chat est émis sur **fin/erreur du cycle de vie**.

## Délais d'expiration

- Valeur par défaut de `agent.wait` : 30 s (uniquement l'attente). Le paramètre `timeoutMs` remplace cette valeur.
- Runtime de l'agent : `agents.defaults.timeoutSeconds` vaut par défaut 172800 s (48 heures) ; appliqué dans le minuteur d'abandon de `runEmbeddedPiAgent`.
- Runtime Cron : le `timeoutSeconds` de tour d'agent isolé appartient à cron. Le planificateur démarre ce minuteur au début de l'exécution, abandonne l'exécution sous-jacente à l'échéance configurée, puis exécute un nettoyage borné avant d'enregistrer l'expiration, afin qu'une session enfant obsolète ne puisse pas laisser la voie bloquée.
- Diagnostics de vivacité de session : lorsque les diagnostics sont activés, `diagnostics.stuckSessionWarnMs` classe les longues sessions `processing` qui n'ont aucune progression observée de réponse, d'outil, de statut, de bloc ou ACP. Les exécutions intégrées actives, appels de modèle et appels d'outil sont signalés comme `session.long_running` ; le travail actif sans progression récente est signalé comme `session.stalled` ; `session.stuck` est réservé à la comptabilité de session obsolète sans travail actif. La comptabilité de session obsolète libère immédiatement la voie de session affectée ; les exécutions intégrées bloquées ne sont vidées par abandon qu'après `diagnostics.stuckSessionAbortMs` (par défaut : au moins 10 minutes et 5 fois le seuil d'avertissement), afin que le travail en file puisse reprendre sans interrompre des exécutions simplement lentes. La récupération émet des résultats structurés demandés/terminés, et l'état de diagnostic n'est marqué inactif que si la même génération de traitement est toujours courante. Les diagnostics `session.stuck` répétés reculent tant que la session reste inchangée.
- Délai d'inactivité du modèle : OpenClaw abandonne une requête de modèle lorsqu'aucun chunk de réponse n'arrive avant la fenêtre d'inactivité. `models.providers.<id>.timeoutSeconds` étend ce chien de garde d'inactivité pour les fournisseurs locaux/auto-hébergés lents ; sinon OpenClaw utilise `agents.defaults.timeoutSeconds` lorsqu'il est configuré, plafonné à 120 s par défaut. Les exécutions déclenchées par Cron sans délai explicite de modèle ou d'agent désactivent le chien de garde d'inactivité et s'appuient sur le délai externe de cron.
- Délai d'expiration des requêtes HTTP du fournisseur : `models.providers.<id>.timeoutSeconds` s'applique aux fetches HTTP de modèle de ce fournisseur, y compris la connexion, les en-têtes, le corps, le délai d'expiration des requêtes SDK, la gestion complète d'abandon de guarded-fetch et le chien de garde d'inactivité du flux du modèle. Utilisez-le pour les fournisseurs locaux/auto-hébergés lents comme Ollama avant d'augmenter le délai d'expiration de l'ensemble du runtime de l'agent.

## Où les choses peuvent se terminer plus tôt

- Délai d'expiration de l'agent (abandon)
- AbortSignal (annulation)
- Déconnexion Gateway ou délai d'expiration RPC
- Délai d'expiration de `agent.wait` (attente uniquement, n'arrête pas l'agent)

## Liens connexes

- [Outils](/fr/tools) — outils d'agent disponibles
- [Hooks](/fr/automation/hooks) — scripts pilotés par événements déclenchés par les événements de cycle de vie de l'agent
- [Compaction](/fr/concepts/compaction) — comment les longues conversations sont résumées
- [Approbations Exec](/fr/tools/exec-approvals) — portes d'approbation pour les commandes shell
- [Pensée](/fr/tools/thinking) — configuration du niveau de pensée/raisonnement
