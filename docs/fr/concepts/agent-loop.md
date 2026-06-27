---
read_when:
    - Vous avez besoin d’un guide exact de la boucle de l’agent ou des événements du cycle de vie
    - Vous modifiez la mise en file d’attente des sessions, les écritures de transcription ou le comportement du verrou d’écriture de session
summary: Cycle de vie de la boucle d’agent, flux et sémantique d’attente
title: Boucle d’agent
x-i18n:
    generated_at: "2026-06-27T17:22:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ccfdf4a3ea6b9c946064f051e32c88cefbcb707c7426abe85b04294030eedaf
    source_path: concepts/agent-loop.md
    workflow: 16
---

Une boucle agentique est l'exécution "réelle" complète d'un agent : réception → assemblage du contexte → inférence du modèle →
exécution d'outils → réponses en streaming → persistance. C'est le chemin de référence qui transforme un message
en actions et en réponse finale, tout en maintenant l'état de session cohérent.

Dans OpenClaw, une boucle est une exécution unique et sérialisée par session qui émet des événements de cycle de vie et de flux
pendant que le modèle réfléchit, appelle des outils et diffuse la sortie. Ce document explique comment cette boucle authentique est
câblée de bout en bout.

## Points d'entrée

- RPC Gateway : `agent` et `agent.wait`.
- CLI : commande `agent`.

## Fonctionnement (vue d'ensemble)

1. Le RPC `agent` valide les paramètres, résout la session (sessionKey/sessionId), persiste les métadonnées de session, renvoie immédiatement `{ runId, acceptedAt }`.
2. `agentCommand` exécute l'agent :
   - résout le modèle + les valeurs par défaut de réflexion/verbosité/trace
   - charge l'instantané Skills
   - appelle `runEmbeddedAgent` (runtime d'agent OpenClaw)
   - émet **fin/erreur du cycle de vie** si la boucle intégrée n'en émet pas
3. `runEmbeddedAgent` :
   - sérialise les exécutions via des files par session + globales
   - résout le modèle + le profil d'authentification et construit la session OpenClaw
   - s'abonne aux événements du runtime et diffuse les deltas assistant/outil
   - applique le délai d'expiration -> interrompt l'exécution s'il est dépassé
   - pour les tours du serveur d'application Codex, interrompt un tour accepté qui cesse de produire une progression du serveur d'application avant un événement terminal
   - renvoie les charges utiles + les métadonnées d'utilisation
4. `subscribeEmbeddedAgentSession` relie les événements du runtime d'agent au flux OpenClaw `agent` :
   - événements d'outil => `stream: "tool"`
   - deltas assistant => `stream: "assistant"`
   - événements de cycle de vie => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` utilise `waitForAgentRun` :
   - attend la **fin/erreur du cycle de vie** pour `runId`
   - renvoie `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Mise en file + concurrence

- Les exécutions sont sérialisées par clé de session (voie de session) et, éventuellement, via une voie globale.
- Cela évite les courses entre outils/sessions et garde l'historique de session cohérent.
- Les canaux de messagerie peuvent choisir des modes de file (steer/followup/collect/interrupt) qui alimentent ce système de voies.
  Voir [File de commandes](/fr/concepts/queue).
- Les écritures de transcript sont aussi protégées par un verrou d'écriture de session sur le fichier de session. Le verrou est
  conscient des processus et fondé sur fichier, ce qui lui permet de détecter les rédacteurs qui contournent la file en processus ou proviennent
  d'un autre processus. Les rédacteurs de transcript de session attendent jusqu'à `session.writeLock.acquireTimeoutMs`
  avant de signaler la session comme occupée ; la valeur par défaut est `60000` ms.
- Les verrous d'écriture de session sont non réentrants par défaut. Si un assistant imbrique intentionnellement l'acquisition du
  même verrou tout en préservant un seul rédacteur logique, il doit l'activer explicitement avec
  `allowReentrant: true`.

## Préparation de la session + de l'espace de travail

- L'espace de travail est résolu et créé ; les exécutions en bac à sable peuvent être redirigées vers une racine d'espace de travail en bac à sable.
- Les Skills sont chargés (ou réutilisés depuis un instantané) et injectés dans l'environnement et le prompt.
- Les fichiers d'amorçage/contexte sont résolus et injectés dans le rapport de prompt système.
- Un verrou d'écriture de session est acquis ; `SessionManager` est ouvert et préparé avant le streaming. Tout
  chemin ultérieur de réécriture, Compaction ou troncature du transcript doit prendre le même verrou avant d'ouvrir ou
  de muter le fichier de transcript.

## Assemblage du prompt + prompt système

- Le prompt système est construit à partir du prompt de base d'OpenClaw, du prompt Skills, du contexte d'amorçage et des remplacements par exécution.
- Les limites propres au modèle et les jetons réservés à la Compaction sont appliqués.
- Voir [Prompt système](/fr/concepts/system-prompt) pour ce que le modèle voit.

## Points d'accroche (où vous pouvez intercepter)

OpenClaw possède deux systèmes de points d'accroche :

- **Points d'accroche internes** (points d'accroche Gateway) : scripts pilotés par événements pour les commandes et les événements de cycle de vie.
- **Points d'accroche Plugin** : points d'extension dans le cycle de vie de l'agent/outil et le pipeline Gateway.

### Points d'accroche internes (points d'accroche Gateway)

- **`agent:bootstrap`** : s'exécute pendant la construction des fichiers d'amorçage avant la finalisation du prompt système.
  Utilisez-le pour ajouter/supprimer des fichiers de contexte d'amorçage.
- **Points d'accroche de commande** : `/new`, `/reset`, `/stop` et autres événements de commande (voir la documentation Hooks).

Voir [Hooks](/fr/automation/hooks) pour la configuration et des exemples.

### Points d'accroche Plugin (cycle de vie de l'agent + Gateway)

Ils s'exécutent dans la boucle d'agent ou le pipeline Gateway :

- **`before_model_resolve`** : s'exécute avant la session (sans `messages`) pour remplacer de façon déterministe le fournisseur/modèle avant la résolution du modèle.
- **`before_prompt_build`** : s'exécute après le chargement de la session (avec `messages`) pour injecter `prependContext`, `systemPrompt`, `prependSystemContext` ou `appendSystemContext` avant la soumission du prompt. Utilisez `prependContext` pour le texte dynamique par tour et les champs de contexte système pour les consignes stables qui doivent résider dans l'espace du prompt système.
- **`before_agent_start`** : point d'accroche de compatibilité hérité qui peut s'exécuter dans l'une ou l'autre phase ; préférez les points d'accroche explicites ci-dessus.
- **`before_agent_reply`** : s'exécute après les actions en ligne et avant l'appel LLM, ce qui permet à un Plugin de revendiquer le tour et de renvoyer une réponse synthétique ou de rendre le tour entièrement silencieux.
- **`agent_end`** : inspecte la liste finale des messages et les métadonnées d'exécution après achèvement.
- **`before_compaction` / `after_compaction`** : observe ou annote les cycles de Compaction.
- **`before_tool_call` / `after_tool_call`** : intercepte les paramètres/résultats d'outils.
- **`before_install`** : inspecte le matériel d'installation Skills ou Plugin préparé après l'exécution de la politique d'installation de l'opérateur, lorsque les points d'accroche Plugin sont chargés dans le processus OpenClaw actuel.
- **`tool_result_persist`** : transforme de façon synchrone les résultats d'outils avant leur écriture dans un transcript de session appartenant à OpenClaw.
- **`message_received` / `message_sending` / `message_sent`** : points d'accroche de messages entrants + sortants.
- **`session_start` / `session_end`** : limites du cycle de vie de session.
- **`gateway_start` / `gateway_stop`** : événements de cycle de vie Gateway.

Règles de décision des points d'accroche pour les garde-fous sortants/outils :

- `before_tool_call` : `{ block: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `before_tool_call` : `{ block: false }` est une absence d'opération et n'annule pas un blocage antérieur.
- `before_install` : `{ block: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `before_install` : `{ block: false }` est une absence d'opération et n'annule pas un blocage antérieur.
- Utilisez `security.installPolicy`, et non `before_install`, pour les décisions d'autorisation/blocage d'installation appartenant à l'opérateur qui doivent couvrir les chemins d'installation et de mise à jour CLI.
- `message_sending` : `{ cancel: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `message_sending` : `{ cancel: false }` est une absence d'opération et n'annule pas une annulation antérieure.

Voir [Points d'accroche Plugin](/fr/plugins/hooks) pour l'API des points d'accroche et les détails d'enregistrement.

Les harnais peuvent adapter ces points d'accroche différemment. Le harnais de serveur d'application Codex conserve
les points d'accroche Plugin d'OpenClaw comme contrat de compatibilité pour les surfaces miroir documentées,
tandis que les points d'accroche natifs Codex restent un mécanisme Codex distinct de plus bas niveau.

## Streaming + réponses partielles

- Les deltas assistant sont diffusés depuis le runtime d'agent et émis comme événements `assistant`.
- Le streaming de blocs peut émettre des réponses partielles soit sur `text_end`, soit sur `message_end`.
- Le streaming de raisonnement peut être émis comme flux séparé ou comme réponses de bloc.
- Voir [Streaming](/fr/concepts/streaming) pour le comportement de découpage et de réponse de bloc.

## Exécution d'outils + outils de messagerie

- Les événements de début/mise à jour/fin d'outil sont émis sur le flux `tool`.
- Les résultats d'outils sont assainis pour la taille et les charges utiles d'image avant journalisation/émission.
- Les envois d'outils de messagerie sont suivis pour supprimer les confirmations assistant en double.

## Mise en forme de la réponse + suppression

- Les charges utiles finales sont assemblées à partir de :
  - texte assistant (et raisonnement facultatif)
  - résumés d'outils en ligne (lorsque la verbosité est activée + autorisée)
  - texte d'erreur assistant lorsque le modèle échoue
- Le jeton silencieux exact `NO_REPLY` / `no_reply` est filtré des charges utiles
  sortantes.
- Les doublons d'outils de messagerie sont supprimés de la liste finale des charges utiles.
- S'il ne reste aucune charge utile affichable et qu'un outil a échoué, une réponse de secours d'erreur d'outil est émise
  (sauf si un outil de messagerie a déjà envoyé une réponse visible par l'utilisateur).

## Compaction + nouvelles tentatives

- L'auto-Compaction émet des événements de flux `compaction` et peut déclencher une nouvelle tentative.
- Lors d'une nouvelle tentative, les tampons en mémoire et les résumés d'outils sont réinitialisés pour éviter une sortie en double.
- Voir [Compaction](/fr/concepts/compaction) pour le pipeline de Compaction.

## Flux d'événements (aujourd'hui)

- `lifecycle` : émis par `subscribeEmbeddedAgentSession` (et comme secours par `agentCommand`)
- `assistant` : deltas diffusés depuis le runtime d'agent
- `tool` : événements d'outils diffusés depuis le runtime d'agent

## Gestion des canaux de chat

- Les deltas assistant sont mis en tampon dans des messages de chat `delta`.
- Un `final` de chat est émis à la **fin/erreur du cycle de vie**.

## Délais d'expiration

- Valeur par défaut de `agent.wait` : 30 s (seulement l'attente). Le paramètre `timeoutMs` remplace cette valeur.
- Runtime d'agent : valeur par défaut de `agents.defaults.timeoutSeconds` : 172800 s (48 heures) ; appliquée dans le minuteur d'interruption de `runEmbeddedAgent`.
- Runtime Cron : le `timeoutSeconds` de tour d'agent isolé appartient à cron. Le planificateur démarre ce minuteur au début de l'exécution, interrompt l'exécution sous-jacente à l'échéance configurée, puis exécute un nettoyage borné avant d'enregistrer le délai d'expiration afin qu'une session enfant obsolète ne puisse pas laisser la voie bloquée.
- Diagnostics de vivacité de session : avec les diagnostics activés, `diagnostics.stuckSessionWarnMs` classe les longues sessions `processing` qui n'ont aucune réponse, outil, statut, bloc ou progression ACP observés. Les exécutions intégrées actives, les appels de modèle et les appels d'outil sont signalés comme `session.long_running` ; les appels de modèle silencieux détenus restent aussi `session.long_running` jusqu'à `diagnostics.stuckSessionAbortMs` afin que les fournisseurs lents ou sans streaming ne soient pas signalés comme bloqués trop tôt. Le travail actif sans progression récente est signalé comme `session.stalled` ; les appels de modèle détenus passent à `session.stalled` au seuil d'interruption ou après celui-ci, et l'activité obsolète de modèle/outil sans propriétaire n'est pas masquée comme longue exécution. `session.stuck` est réservé à la tenue de livres récupérable des sessions obsolètes, y compris les sessions en file inactives avec activité de modèle/outil obsolète sans propriétaire. La tenue de livres des sessions obsolètes libère immédiatement la voie de session affectée une fois les garde-fous de récupération passés ; les exécutions intégrées bloquées ne sont interrompues et vidées qu'après `diagnostics.stuckSessionAbortMs` (par défaut : au moins 5 minutes et 3x le seuil d'avertissement) afin que le travail en file puisse reprendre sans couper des exécutions simplement lentes. La récupération émet des résultats structurés demandés/terminés, et l'état de diagnostic n'est marqué inactif que si la même génération de traitement est toujours courante. Les diagnostics `session.stuck` répétés appliquent un retour arrière tant que la session reste inchangée.
- Délai d'inactivité du modèle : OpenClaw interrompt une requête de modèle lorsqu'aucun fragment de réponse n'arrive avant la fenêtre d'inactivité. `models.providers.<id>.timeoutSeconds` étend ce chien de garde d'inactivité pour les fournisseurs locaux/auto-hébergés lents, mais il reste borné par toute valeur inférieure de `agents.defaults.timeoutSeconds` ou par le délai propre à l'exécution, car ceux-ci contrôlent toute l'exécution de l'agent. Sinon, OpenClaw utilise `agents.defaults.timeoutSeconds` lorsqu'il est configuré, plafonné à 120 s par défaut. Les exécutions de modèle cloud déclenchées par Cron sans délai de modèle ou d'agent explicite utilisent le même chien de garde d'inactivité par défaut ; avec un délai d'exécution Cron explicite, les blocages de flux de modèle cloud sont plafonnés à 60 s afin que les solutions de secours de modèle configurées puissent s'exécuter avant l'échéance Cron externe. Les exécutions de modèle local ou auto-hébergé déclenchées par Cron désactivent le chien de garde implicite sauf si un délai explicite est configuré, et les délais d'exécution Cron explicites restent la fenêtre d'inactivité pour les fournisseurs locaux/auto-hébergés ; les fournisseurs locaux lents doivent donc définir `models.providers.<id>.timeoutSeconds`.
- Délai d'expiration des requêtes HTTP du fournisseur : `models.providers.<id>.timeoutSeconds` s'applique aux récupérations HTTP de modèle de ce fournisseur, y compris la connexion, les en-têtes, le corps, le délai de requête SDK, la gestion d'interruption totale des récupérations protégées et le chien de garde d'inactivité du flux de modèle. Utilisez-le pour les fournisseurs locaux/auto-hébergés lents comme Ollama avant d'augmenter le délai de tout le runtime d'agent, et gardez le délai de l'agent/runtime au moins aussi élevé lorsque la requête de modèle doit s'exécuter plus longtemps.

## Où les choses peuvent se terminer plus tôt

- Délai d’expiration de l’agent (abandon)
- AbortSignal (annulation)
- Déconnexion du Gateway ou délai d’expiration RPC
- Délai d’expiration `agent.wait` (attente uniquement, n’arrête pas l’agent)

## Connexe

- [Outils](/fr/tools) — outils d’agent disponibles
- [Hooks](/fr/automation/hooks) — scripts événementiels déclenchés par les événements du cycle de vie de l’agent
- [Compaction](/fr/concepts/compaction) — comment les longues conversations sont résumées
- [Approbations d’exécution](/fr/tools/exec-approvals) — points d’approbation pour les commandes shell
- [Réflexion](/fr/tools/thinking) — configuration du niveau de réflexion/raisonnement
