---
read_when:
    - Vous avez besoin d’une présentation pas à pas précise de la boucle de l’agent ou des événements du cycle de vie
    - Vous modifiez la mise en file d’attente des sessions, les écritures de transcription ou le comportement du verrou d’écriture des sessions
summary: Cycle de vie de la boucle d’agent, flux et sémantique d’attente
title: Boucle de l’agent
x-i18n:
    generated_at: "2026-05-02T07:03:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4182cf13d43a111a94014d695dee4b1e7385dd3b928b16e2072bd24189256b49
    source_path: concepts/agent-loop.md
    workflow: 16
---

Une boucle agentique est l’exécution complète et « réelle » d’un agent : ingestion → assemblage du contexte → inférence du modèle →
exécution des outils → réponses en streaming → persistance. C’est le chemin faisant autorité qui transforme un message
en actions et en réponse finale, tout en maintenant l’état de session cohérent.

Dans OpenClaw, une boucle est une exécution unique, sérialisée par session, qui émet des événements de cycle de vie et de flux
à mesure que le modèle raisonne, appelle des outils et diffuse la sortie. Ce document explique comment cette boucle authentique est
câblée de bout en bout.

## Points d’entrée

- RPC du Gateway : `agent` et `agent.wait`.
- CLI : commande `agent`.

## Fonctionnement (vue d’ensemble)

1. Le RPC `agent` valide les paramètres, résout la session (sessionKey/sessionId), persiste les métadonnées de session, retourne immédiatement `{ runId, acceptedAt }`.
2. `agentCommand` exécute l’agent :
   - résout le modèle et les valeurs par défaut de raisonnement/verbosité/trace
   - charge l’instantané des Skills
   - appelle `runEmbeddedPiAgent` (runtime pi-agent-core)
   - émet **fin/erreur du cycle de vie** si la boucle embarquée n’en émet pas
3. `runEmbeddedPiAgent` :
   - sérialise les exécutions via des files par session et globales
   - résout le modèle et le profil d’authentification, puis construit la session pi
   - s’abonne aux événements pi et diffuse les deltas de l’assistant/des outils
   - applique le délai d’expiration -> abandonne l’exécution s’il est dépassé
   - pour les tours du serveur d’application Codex, abandonne un tour accepté qui cesse de produire une progression du serveur d’application avant un événement terminal
   - retourne les charges utiles et les métadonnées d’utilisation
4. `subscribeEmbeddedPiSession` relie les événements pi-agent-core au flux OpenClaw `agent` :
   - événements d’outil => `stream: "tool"`
   - deltas de l’assistant => `stream: "assistant"`
   - événements de cycle de vie => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` utilise `waitForAgentRun` :
   - attend **fin/erreur du cycle de vie** pour `runId`
   - retourne `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Mise en file + concurrence

- Les exécutions sont sérialisées par clé de session (voie de session) et éventuellement via une voie globale.
- Cela évite les courses d’outils/de session et maintient l’historique de session cohérent.
- Les canaux de messagerie peuvent choisir des modes de file (collect/steer/followup) qui alimentent ce système de voies.
  Voir [File de commandes](/fr/concepts/queue).
- Les écritures de transcription sont aussi protégées par un verrou d’écriture de session sur le fichier de session. Le verrou est
  conscient des processus et basé sur fichier ; il détecte donc les rédacteurs qui contournent la file en processus ou proviennent
  d’un autre processus.
- Les verrous d’écriture de session ne sont pas réentrants par défaut. Si un helper imbrique intentionnellement l’acquisition du
  même verrou tout en conservant un seul rédacteur logique, il doit l’activer explicitement avec
  `allowReentrant: true`.

## Préparation de la session + de l’espace de travail

- L’espace de travail est résolu et créé ; les exécutions en bac à sable peuvent être redirigées vers une racine d’espace de travail en bac à sable.
- Les Skills sont chargés (ou réutilisés depuis un instantané) et injectés dans l’environnement et le prompt.
- Les fichiers d’amorçage/contexte sont résolus et injectés dans le rapport du prompt système.
- Un verrou d’écriture de session est acquis ; `SessionManager` est ouvert et préparé avant le streaming. Tout
  chemin ultérieur de réécriture, Compaction ou troncature de transcription doit prendre le même verrou avant d’ouvrir ou
  de modifier le fichier de transcription.

## Assemblage du prompt + prompt système

- Le prompt système est construit à partir du prompt de base d’OpenClaw, du prompt des Skills, du contexte d’amorçage et des remplacements par exécution.
- Les limites propres au modèle et les jetons réservés à la Compaction sont appliqués.
- Voir [Prompt système](/fr/concepts/system-prompt) pour savoir ce que voit le modèle.

## Points de hook (où intercepter)

OpenClaw dispose de deux systèmes de hooks :

- **Hooks internes** (hooks du Gateway) : scripts événementiels pour les commandes et les événements de cycle de vie.
- **Hooks de Plugin** : points d’extension dans le cycle de vie agent/outil et le pipeline du gateway.

### Hooks internes (hooks du Gateway)

- **`agent:bootstrap`** : s’exécute pendant la construction des fichiers d’amorçage avant la finalisation du prompt système.
  Utilisez-le pour ajouter/supprimer des fichiers de contexte d’amorçage.
- **Hooks de commande** : `/new`, `/reset`, `/stop` et autres événements de commande (voir le document Hooks).

Voir [Hooks](/fr/automation/hooks) pour la configuration et des exemples.

### Hooks de Plugin (cycle de vie agent + gateway)

Ils s’exécutent dans la boucle de l’agent ou le pipeline du gateway :

- **`before_model_resolve`** : s’exécute avant la session (pas de `messages`) pour remplacer de façon déterministe le fournisseur/modèle avant la résolution du modèle.
- **`before_prompt_build`** : s’exécute après le chargement de la session (avec `messages`) pour injecter `prependContext`, `systemPrompt`, `prependSystemContext` ou `appendSystemContext` avant l’envoi du prompt. Utilisez `prependContext` pour le texte dynamique par tour et les champs de contexte système pour les consignes stables qui doivent résider dans l’espace du prompt système.
- **`before_agent_start`** : hook de compatibilité hérité qui peut s’exécuter dans l’une ou l’autre phase ; préférez les hooks explicites ci-dessus.
- **`before_agent_reply`** : s’exécute après les actions en ligne et avant l’appel LLM, ce qui permet à un Plugin de revendiquer le tour et de retourner une réponse synthétique ou de rendre le tour entièrement silencieux.
- **`agent_end`** : inspecte la liste finale des messages et les métadonnées d’exécution après l’achèvement.
- **`before_compaction` / `after_compaction`** : observe ou annote les cycles de Compaction.
- **`before_tool_call` / `after_tool_call`** : intercepte les paramètres/résultats d’outil.
- **`before_install`** : inspecte les résultats d’analyse intégrés et bloque éventuellement les installations de Skills ou de Plugin.
- **`tool_result_persist`** : transforme de façon synchrone les résultats d’outil avant leur écriture dans une transcription de session détenue par OpenClaw.
- **`message_received` / `message_sending` / `message_sent`** : hooks de messages entrants et sortants.
- **`session_start` / `session_end`** : limites du cycle de vie de session.
- **`gateway_start` / `gateway_stop`** : événements de cycle de vie du gateway.

Règles de décision des hooks pour les protections de sortie/d’outil :

- `before_tool_call` : `{ block: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `before_tool_call` : `{ block: false }` est un no-op et n’efface pas un blocage antérieur.
- `before_install` : `{ block: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `before_install` : `{ block: false }` est un no-op et n’efface pas un blocage antérieur.
- `message_sending` : `{ cancel: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `message_sending` : `{ cancel: false }` est un no-op et n’efface pas une annulation antérieure.

Voir [Hooks de Plugin](/fr/plugins/hooks) pour l’API des hooks et les détails d’enregistrement.

Les harnais peuvent adapter ces hooks différemment. Le harnais de serveur d’application Codex conserve
les hooks de Plugin OpenClaw comme contrat de compatibilité pour les surfaces miroir documentées,
tandis que les hooks natifs Codex restent un mécanisme Codex de plus bas niveau distinct.

## Streaming + réponses partielles

- Les deltas de l’assistant sont diffusés depuis pi-agent-core et émis comme événements `assistant`.
- Le streaming par blocs peut émettre des réponses partielles sur `text_end` ou `message_end`.
- Le streaming de raisonnement peut être émis comme flux séparé ou comme réponses par blocs.
- Voir [Streaming](/fr/concepts/streaming) pour le comportement de découpage et de réponse par blocs.

## Exécution d’outils + outils de messagerie

- Les événements de début/mise à jour/fin d’outil sont émis sur le flux `tool`.
- Les résultats d’outil sont assainis pour la taille et les charges utiles d’image avant journalisation/émission.
- Les envois d’outils de messagerie sont suivis afin de supprimer les confirmations d’assistant en double.

## Mise en forme + suppression des réponses

- Les charges utiles finales sont assemblées à partir de :
  - texte de l’assistant (et raisonnement facultatif)
  - résumés d’outils en ligne (quand la verbosité est activée et autorisée)
  - texte d’erreur de l’assistant quand le modèle échoue
- Le jeton silencieux exact `NO_REPLY` / `no_reply` est filtré des charges utiles
  sortantes.
- Les doublons d’outils de messagerie sont retirés de la liste finale des charges utiles.
- S’il ne reste aucune charge utile affichable et qu’un outil a échoué, une réponse d’erreur d’outil de repli est émise
  (sauf si un outil de messagerie a déjà envoyé une réponse visible par l’utilisateur).

## Compaction + nouvelles tentatives

- La Compaction automatique émet des événements de flux `compaction` et peut déclencher une nouvelle tentative.
- Lors d’une nouvelle tentative, les tampons en mémoire et les résumés d’outils sont réinitialisés pour éviter les sorties en double.
- Voir [Compaction](/fr/concepts/compaction) pour le pipeline de Compaction.

## Flux d’événements (aujourd’hui)

- `lifecycle` : émis par `subscribeEmbeddedPiSession` (et en repli par `agentCommand`)
- `assistant` : deltas diffusés depuis pi-agent-core
- `tool` : événements d’outil diffusés depuis pi-agent-core

## Gestion des canaux de chat

- Les deltas de l’assistant sont mis en tampon dans des messages de chat `delta`.
- Un `final` de chat est émis sur **fin/erreur du cycle de vie**.

## Délais d’expiration

- Valeur par défaut de `agent.wait` : 30 s (attente uniquement). Le paramètre `timeoutMs` la remplace.
- Runtime de l’agent : valeur par défaut de `agents.defaults.timeoutSeconds` 172800 s (48 heures) ; appliquée dans le minuteur d’abandon de `runEmbeddedPiAgent`.
- Runtime Cron : le `timeoutSeconds` d’un tour d’agent isolé appartient à Cron. Le planificateur démarre ce minuteur au début de l’exécution, abandonne l’exécution sous-jacente à l’échéance configurée, puis effectue un nettoyage borné avant d’enregistrer le délai d’expiration afin qu’une session enfant obsolète ne puisse pas bloquer la voie.
- Diagnostics de vivacité de session : lorsque les diagnostics sont activés, `diagnostics.stuckSessionWarnMs` classe les longues sessions `processing` qui n’ont aucune réponse, outil, statut, bloc ou progression ACP observée. Les exécutions embarquées, appels de modèle et appels d’outil actifs sont signalés comme `session.long_running` ; le travail actif sans progression récente est signalé comme `session.stalled` ; `session.stuck` est réservé à la comptabilité de session obsolète sans travail actif, et seul ce chemin libère la voie de session affectée afin que le travail de démarrage en file puisse s’écouler. Les diagnostics `session.stuck` répétés appliquent un backoff tant que la session reste inchangée.
- Délai d’inactivité du modèle : OpenClaw abandonne une requête de modèle lorsqu’aucun segment de réponse n’arrive avant la fenêtre d’inactivité. `models.providers.<id>.timeoutSeconds` étend ce chien de garde d’inactivité pour les fournisseurs locaux/auto-hébergés lents ; sinon OpenClaw utilise `agents.defaults.timeoutSeconds` lorsqu’il est configuré, plafonné par défaut à 120 s. Les exécutions déclenchées par Cron sans délai explicite de modèle ou d’agent désactivent le chien de garde d’inactivité et s’appuient sur le délai externe de Cron.
- Délai d’expiration des requêtes HTTP du fournisseur : `models.providers.<id>.timeoutSeconds` s’applique aux récupérations HTTP du modèle de ce fournisseur, y compris connexion, en-têtes, corps, délai de requête du SDK, gestion totale de l’abandon de fetch protégé et chien de garde d’inactivité du flux de modèle. Utilisez-le pour les fournisseurs locaux/auto-hébergés lents comme Ollama avant d’augmenter le délai d’expiration de tout le runtime de l’agent.

## Cas où les choses peuvent se terminer prématurément

- Délai d’expiration de l’agent (abandon)
- AbortSignal (annulation)
- Déconnexion du Gateway ou délai d’expiration RPC
- Délai d’expiration de `agent.wait` (attente uniquement, n’arrête pas l’agent)

## Connexe

- [Outils](/fr/tools) — outils d’agent disponibles
- [Hooks](/fr/automation/hooks) — scripts événementiels déclenchés par les événements de cycle de vie de l’agent
- [Compaction](/fr/concepts/compaction) — comment les longues conversations sont résumées
- [Approbations Exec](/fr/tools/exec-approvals) — portes d’approbation pour les commandes shell
- [Raisonnement](/fr/tools/thinking) — configuration du niveau de pensée/raisonnement
