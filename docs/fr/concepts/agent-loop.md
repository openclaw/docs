---
read_when:
    - Vous avez besoin d’une présentation détaillée et exacte de la boucle de l’agent ou des événements du cycle de vie
    - Vous modifiez la mise en file d’attente des sessions, les écritures de transcription ou le comportement du verrou d’écriture des sessions
summary: Cycle de vie de la boucle de l’agent, flux et sémantique d’attente
title: Boucle de l’agent
x-i18n:
    generated_at: "2026-07-12T15:18:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3793a2c765c72f7f4bb8e790ce4d61abc279cf3a8a7367ecf8759428d0192279
    source_path: concepts/agent-loop.md
    workflow: 16
---

La boucle de l’agent est l’exécution sérialisée propre à chaque session qui transforme un message en
actions et en réponse : réception, assemblage du contexte, inférence du modèle, exécution
des outils, diffusion en continu, persistance.

## Points d’entrée

- RPC du Gateway : `agent` et `agent.wait`.
- CLI : `openclaw agent`.

## Séquence d’exécution

1. Le RPC `agent` valide les paramètres, résout la session (`sessionKey`/`sessionId`), conserve les métadonnées de session et renvoie immédiatement `{ runId, acceptedAt }`.
2. `agentCommand` exécute le tour : résout le modèle et les valeurs par défaut de réflexion/détail/traçage, charge l’instantané des Skills, appelle `runEmbeddedAgent` et émet un événement de secours de **fin/erreur de cycle de vie** si la boucle intégrée n’en a pas déjà émis un.
3. `runEmbeddedAgent` : sérialise les exécutions au moyen de files d’attente propres à chaque session et globales, résout le modèle et le profil d’authentification, construit la session OpenClaw, s’abonne aux événements d’exécution, diffuse les deltas de l’assistant/des outils, impose le délai d’expiration de l’exécution (avec interruption à son expiration) et renvoie les charges utiles ainsi que les métadonnées d’utilisation. Pour les tours du serveur d’application Codex, il interrompt également un tour accepté qui cesse de produire une progression du serveur d’application avant un événement terminal.
4. `subscribeEmbeddedAgentSession` relie les événements d’exécution au flux `agent` : événements d’outils vers `stream: "tool"`, deltas de l’assistant vers `stream: "assistant"`, événements de cycle de vie vers `stream: "lifecycle"` (`phase: "start" | "end" | "error"`).
5. `agent.wait` (`waitForAgentRun`) attend une **fin/erreur de cycle de vie** pour un `runId` et renvoie `{ status: ok|error|timeout, startedAt, endedAt, error? }`.

## Mise en file d’attente et concurrence

Les exécutions sont sérialisées par clé de session (voie de session) et, éventuellement, au moyen d’une voie globale, afin d’éviter les accès concurrents aux outils et aux sessions. Les canaux de messagerie choisissent un mode de file d’attente (steer/followup/collect/interrupt) qui alimente ce système de voies ; consultez [File d’attente des commandes](/fr/concepts/queue).

Les écritures de transcription sont en outre protégées par un verrou d’écriture de session sur le fichier de session. Le verrou tient compte des processus et repose sur un fichier ; il détecte donc les processus d’écriture qui contournent la file d’attente interne au processus ou proviennent d’un autre processus. Les processus d’écriture attendent jusqu’à `session.writeLock.acquireTimeoutMs` (`60000` ms par défaut ; remplacement par la variable d’environnement `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`) avant de signaler que la session est occupée.

Par défaut, les verrous d’écriture de session ne sont pas réentrants. Un utilitaire qui imbrique intentionnellement l’acquisition du même verrou tout en conservant un seul processus d’écriture logique doit l’activer avec `allowReentrant: true`.

## Préparation de la session et de l’espace de travail

- L’espace de travail est résolu et créé ; les exécutions dans un bac à sable peuvent être redirigées vers la racine d’un espace de travail de bac à sable.
- Les Skills sont chargées (ou réutilisées à partir d’un instantané) et injectées dans l’environnement et le prompt.
- Les fichiers d’amorçage et de contexte sont résolus et injectés dans le prompt système.
- Un verrou d’écriture de session est acquis et la cible de transcription de la session est préparée avant le début de la diffusion. Tout chemin ultérieur de réécriture, de compaction ou de troncature de la transcription doit acquérir le même verrou avant de modifier les lignes de transcription SQLite.

## Assemblage du prompt

Le prompt système est construit à partir du prompt de base d’OpenClaw, du prompt des Skills, du contexte d’amorçage et des remplacements propres à l’exécution. Les limites propres au modèle et les jetons réservés à la compaction sont appliqués. Consultez [Prompt système](/fr/concepts/system-prompt) pour savoir ce que voit le modèle.

## Hooks

OpenClaw comporte deux systèmes de hooks :

- **Hooks internes** (hooks du Gateway) : scripts pilotés par des événements pour les commandes et les événements de cycle de vie.
- **Hooks de Plugin** : points d’extension dans le cycle de vie de l’agent/des outils et le pipeline du Gateway.

### Hooks internes (hooks du Gateway)

- **`agent:bootstrap`** : s’exécute pendant la construction des fichiers d’amorçage, avant la finalisation du prompt système. Utilisez-le pour ajouter ou supprimer des fichiers de contexte d’amorçage.
- **Hooks de commande** : `/new`, `/reset`, `/stop` et autres événements de commande (consultez la documentation sur les hooks).

Consultez [Hooks](/fr/automation/hooks) pour la configuration et des exemples.

### Hooks de Plugin

Ils s’exécutent dans la boucle de l’agent ou le pipeline du Gateway :

| Hook                                                    | Exécution                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `before_model_resolve`                                  | Avant la session (sans `messages`), pour remplacer de manière déterministe le fournisseur/modèle avant la résolution.                                                                                                                                                                                                |
| `before_prompt_build`                                   | Après le chargement de la session (avec `messages`), pour injecter `prependContext`, `systemPrompt`, `prependSystemContext` ou `appendSystemContext` avant l’envoi. Utilisez `prependContext` pour le texte dynamique propre à chaque tour et les champs de contexte système pour les directives stables qui appartiennent à l’espace du prompt système. |
| `before_agent_start`                                    | Hook de compatibilité hérité pouvant s’exécuter dans l’une ou l’autre phase ; préférez les hooks explicites ci-dessus.                                                                                                                                                                                                    |
| `before_agent_reply`                                    | Après les actions intégrées, avant l’appel au LLM. Permet à un Plugin de prendre en charge le tour et de renvoyer une réponse synthétique ou de le rendre entièrement silencieux.                                                                                                                                                                |
| `agent_end`                                             | Après la fin, avec la liste finale des messages et les métadonnées d’exécution.                                                                                                                                                                                                                             |
| `before_compaction` / `after_compaction`                | Observe ou annote les cycles de compaction.                                                                                                                                                                                                                                                      |
| `before_tool_call` / `after_tool_call`                  | Intercepte les paramètres/résultats des outils.                                                                                                                                                                                                                                                              |
| `before_install`                                        | Après l’application de la politique d’installation de l’opérateur, sur les éléments d’installation de Skill/Plugin préparés, lorsque les hooks de Plugin sont chargés dans le processus actuel.                                                                                                                                                           |
| `tool_result_persist`                                   | Transforme de manière synchrone les résultats des outils avant leur écriture dans une transcription de session appartenant à OpenClaw.                                                                                                                                                                                      |
| `message_received` / `message_sending` / `message_sent` | Hooks des messages entrants et sortants.                                                                                                                                                                                                                                                         |
| `session_start` / `session_end`                         | Limites du cycle de vie de la session.                                                                                                                                                                                                                                                               |
| `gateway_start` / `gateway_stop`                        | Événements du cycle de vie du Gateway.                                                                                                                                                                                                                                                                   |

Règles de décision des hooks pour les protections des sorties/outils :

- `before_tool_call` : `{ block: true }` est terminal et arrête les gestionnaires de priorité inférieure. `{ block: false }` est sans effet et n’annule pas un blocage antérieur.
- `before_install` : mêmes sémantiques terminales/sans effet que ci-dessus. Utilisez `security.installPolicy`, et non `before_install`, pour les décisions d’autorisation/de blocage d’installation appartenant à l’opérateur qui doivent couvrir les chemins d’installation et de mise à jour de la CLI.
- `message_sending` : `{ cancel: true }` est terminal et arrête les gestionnaires de priorité inférieure. `{ cancel: false }` est sans effet et n’annule pas une annulation antérieure.

Consultez [Hooks de Plugin](/fr/plugins/hooks) pour l’API des hooks et les détails d’enregistrement.

Les harnais peuvent adapter ces hooks. Le harnais du serveur d’application Codex conserve les hooks de Plugin OpenClaw comme contrat de compatibilité pour les surfaces documentées reproduites ; les hooks natifs de Codex constituent un mécanisme Codex distinct et de plus bas niveau.

## Diffusion en continu

- Les deltas de l’assistant sont diffusés depuis l’environnement d’exécution de l’agent sous forme d’événements `assistant`.
- La diffusion par blocs peut émettre des réponses partielles lors de `text_end` ou `message_end`.
- La diffusion du raisonnement peut être un flux distinct ou bloquer les réponses.
- Consultez [Diffusion en continu](/fr/concepts/streaming) pour le découpage et le comportement des réponses par blocs.

## Exécution des outils

- Les événements de début/mise à jour/fin d’un outil sont émis sur le flux `tool`.
- La taille et les charges utiles d’images des résultats d’outils sont assainies avant leur journalisation/émission.
- Les envois par les outils de messagerie sont suivis afin d’éviter les confirmations en double de l’assistant.

## Mise en forme des réponses

Les charges utiles finales sont assemblées à partir du texte de l’assistant (ainsi que du raisonnement facultatif), des résumés intégrés des outils (lorsque le mode détaillé est activé et autorisé) et du texte d’erreur de l’assistant lorsque le modèle rencontre une erreur.

- Le jeton silencieux exact `NO_REPLY` est supprimé des charges utiles sortantes.
- Les doublons des outils de messagerie sont supprimés de la liste finale des charges utiles.
- S’il ne reste aucune charge utile affichable et qu’un outil a rencontré une erreur, une réponse d’erreur d’outil de secours est émise, sauf si un outil de messagerie a déjà envoyé une réponse visible par l’utilisateur.

## Compaction et nouvelles tentatives

La compaction automatique émet des événements de flux `compaction` et peut déclencher une nouvelle tentative. Lors d’une nouvelle tentative, les tampons en mémoire et les résumés des outils sont réinitialisés afin d’éviter les sorties en double. Consultez [Compaction](/fr/concepts/compaction).

## Flux d’événements

- `lifecycle` : émis par `subscribeEmbeddedAgentSession` (et comme mécanisme de secours par `agentCommand`).
- `assistant` : deltas diffusés depuis l’environnement d’exécution de l’agent.
- `tool` : événements d’outils diffusés depuis l’environnement d’exécution de l’agent.

Le Gateway projette les événements de cycle de vie ainsi que les événements de début/fin des outils dans le
[journal d’audit](/fr/cli/audit) borné qui ne contient que des métadonnées. Cette projection enregistre la provenance et
les codes de résultat sans copier les prompts, les messages, les arguments des outils, les résultats des outils
ni les erreurs brutes en dehors du chemin de transcription/d’exécution.

## Gestion des canaux de discussion

Les deltas de l’assistant sont mis en mémoire tampon dans des messages de discussion `delta`. Un message de discussion `final` est émis lors d’une **fin/erreur de cycle de vie**.

## Délais d’expiration

| Délai d’expiration                               | Valeur par défaut                     | Remarques                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------ | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agent.wait`                                     | 30s                                    | Attente uniquement ; le paramètre `timeoutMs` remplace cette valeur. N’arrête pas l’exécution sous-jacente.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Durée d’exécution de l’agent (`agents.defaults.timeoutSeconds`) | 172800s (48h)                          | Appliquée par le minuteur d’abandon de `runEmbeddedAgent`. Définissez `0` pour un budget d’exécution illimité ; les mécanismes de surveillance de l’activité du flux du modèle restent applicables.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Tour d’agent isolé Cron                          | géré par Cron                          | Le planificateur démarre son propre minuteur au début de l’exécution, abandonne l’exécution à l’échéance configurée, puis effectue un nettoyage limité avant d’enregistrer l’expiration du délai, afin qu’une session enfant obsolète ne puisse pas maintenir le couloir bloqué.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Délai d’inactivité du modèle                     | Cloud 120s ; auto-hébergé 300s         | OpenClaw abandonne une requête au modèle lorsqu’aucun fragment de réponse n’arrive avant l’expiration de la fenêtre d’inactivité. `models.providers.<id>.timeoutSeconds` prolonge ce mécanisme de surveillance de l’inactivité pour les fournisseurs locaux/auto-hébergés lents, mais reste limité par toute valeur finie inférieure de `agents.defaults.timeoutSeconds` ou par tout délai propre à l’exécution, car ceux-ci régissent l’intégralité de l’exécution de l’agent. Les budgets d’exécution illimités conservent le mécanisme de surveillance de l’inactivité propre à la classe du fournisseur. Les exécutions de modèles Cloud déclenchées par Cron sans délai explicite pour le modèle ou l’agent utilisent la même valeur par défaut ; avec un délai explicite d’exécution Cron, les blocages du flux d’un modèle Cloud sont limités à 60s afin que les modèles de secours configurés puissent encore s’exécuter avant l’échéance Cron externe. Les exécutions déclenchées par Cron sur des points de terminaison réellement locaux (baseUrl en boucle locale/privée) conservent la désactivation locale du délai d’inactivité ; les fournisseurs auto-hébergés utilisant des baseUrls réseau reçoivent le mécanisme de surveillance implicite de 300s. Avec un délai explicite d’exécution Cron, les blocages locaux/auto-hébergés sont limités à ce délai. Définissez `models.providers.<id>.timeoutSeconds` pour les fournisseurs locaux lents. |
| Délai d’expiration des requêtes HTTP du fournisseur | `models.providers.<id>.timeoutSeconds` | Couvre la connexion, les en-têtes, le corps, le délai d’expiration des requêtes du SDK, la gestion de l’abandon de guarded-fetch et le mécanisme de surveillance de l’inactivité du flux du modèle pour ce fournisseur. Utilisez-le pour les fournisseurs locaux/auto-hébergés lents (par exemple Ollama) avant d’augmenter le délai d’exécution global de l’agent ; maintenez le délai de l’agent/de l’environnement d’exécution au moins aussi élevé lorsque la requête au modèle doit s’exécuter plus longtemps.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

### Diagnostic des sessions bloquées

Lorsque les diagnostics sont activés, `diagnostics.stuckSessionWarnMs` (valeur par défaut : `120000` ms) classe les sessions `processing` de longue durée pour lesquelles aucune progression de réponse, d’outil, d’état, de bloc ou d’ACP n’a été observée :

- Les exécutions intégrées actives, les appels de modèle et les appels d’outil sont signalés comme `session.long_running`. Les appels de modèle silencieux avec propriétaire restent `session.long_running` jusqu’à `diagnostics.stuckSessionAbortMs`, afin que les fournisseurs lents ou sans diffusion en continu ne soient pas signalés trop tôt comme bloqués.
- Le travail actif sans progression récente est signalé comme `session.stalled`. Les appels de modèle avec propriétaire passent à `session.stalled` lorsque le seuil d’abandon est atteint ou dépassé ; les activités obsolètes de modèle ou d’outil sans propriétaire ne sont pas masquées comme étant de longue durée.
- `session.stuck` est réservé à la comptabilité récupérable des sessions obsolètes, notamment aux sessions inactives en file d’attente présentant une activité obsolète de modèle ou d’outil sans propriétaire.

La valeur par défaut de `diagnostics.stuckSessionAbortMs` est d’au moins 5 minutes et égale à 3x le seuil d’avertissement. La comptabilité des sessions obsolètes libère immédiatement le couloir de la session concernée une fois les contrôles de récupération réussis ; les exécutions intégrées bloquées ne sont abandonnées et purgées qu’après le seuil d’abandon, afin que le travail en file d’attente reprenne sans interrompre les exécutions simplement lentes. La récupération émet des résultats structurés de demande et d’achèvement ; l’état de diagnostic n’est marqué comme inactif que si la même génération de traitement est toujours actuelle, et les diagnostics `session.stuck` répétés appliquent un délai progressif tant que la session reste inchangée.

## Situations pouvant entraîner un arrêt anticipé

- Délai d’expiration de l’agent (abandon)
- AbortSignal (annulation)
- Déconnexion du Gateway ou délai d’expiration RPC
- Délai d’expiration de `agent.wait` (attente uniquement, n’arrête pas l’agent)

## Ressources associées

- [Outils](/fr/tools) - outils disponibles pour l’agent
- [Hooks](/fr/automation/hooks) - scripts pilotés par les événements et déclenchés par les événements du cycle de vie de l’agent
- [Compaction](/fr/concepts/compaction) - méthode de synthèse des longues conversations
- [Approbations d’exécution](/fr/tools/exec-approvals) - contrôles d’approbation pour les commandes shell
- [Réflexion](/fr/tools/thinking) - configuration du niveau de réflexion/raisonnement
