---
read_when:
    - Vous avez besoin d’un déroulé exact de la boucle d’agent ou des événements du cycle de vie
    - Vous modifiez la mise en file d’attente des sessions, les écritures de transcription ou le comportement du verrou d’écriture de session
summary: Cycle de vie de la boucle d’agent, flux et sémantique d’attente
title: Boucle d’agent
x-i18n:
    generated_at: "2026-04-25T13:44:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: de41180af291cf804f2e74106c70eb8582b63e7066738ba3059c1319510f1b44
    source_path: concepts/agent-loop.md
    workflow: 15
---

Une boucle agentique est l’exécution complète « réelle » d’un agent : ingestion → assemblage du contexte → inférence du modèle →
exécution des outils → diffusion des réponses → persistance. C’est le chemin d’autorité qui transforme un message
en actions et en réponse finale, tout en maintenant un état de session cohérent.

Dans OpenClaw, une boucle est une exécution unique et sérialisée par session qui émet des événements de cycle de vie et de flux
pendant que le modèle réfléchit, appelle des outils et diffuse sa sortie. Cette documentation explique comment cette boucle authentique est
câblée de bout en bout.

## Points d’entrée

- RPC Gateway : `agent` et `agent.wait`.
- CLI : commande `agent`.

## Fonctionnement (vue d’ensemble)

1. La RPC `agent` valide les paramètres, résout la session (`sessionKey`/`sessionId`), persiste les métadonnées de session, puis renvoie immédiatement `{ runId, acceptedAt }`.
2. `agentCommand` exécute l’agent :
   - résout le modèle ainsi que les valeurs par défaut thinking/verbose/trace
   - charge le snapshot des Skills
   - appelle `runEmbeddedPiAgent` (runtime pi-agent-core)
   - émet **lifecycle end/error** si la boucle embarquée n’en émet pas
3. `runEmbeddedPiAgent` :
   - sérialise les exécutions via des files par session et globales
   - résout le modèle + le profil d’authentification et construit la session Pi
   - s’abonne aux événements Pi et diffuse les deltas assistant/tool
   - impose un timeout -> abandonne l’exécution s’il est dépassé
   - renvoie les payloads + les métadonnées d’usage
4. `subscribeEmbeddedPiSession` fait le pont entre les événements pi-agent-core et le flux OpenClaw `agent` :
   - événements d’outil => `stream: "tool"`
   - deltas de l’assistant => `stream: "assistant"`
   - événements de cycle de vie => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` utilise `waitForAgentRun` :
   - attend **lifecycle end/error** pour `runId`
   - renvoie `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Mise en file d’attente + concurrence

- Les exécutions sont sérialisées par clé de session (voie de session) et, facultativement, via une voie globale.
- Cela empêche les courses entre outils/sessions et maintient la cohérence de l’historique de session.
- Les canaux de messagerie peuvent choisir des modes de file (collect/steer/followup) qui alimentent ce système de voies.
  Voir [File de commandes](/fr/concepts/queue).
- Les écritures de transcription sont également protégées par un verrou d’écriture de session sur le fichier de session. Le verrou est
  basé sur le fichier et conscient des processus, de sorte qu’il intercepte les écrivains qui contournent la file en processus ou proviennent
  d’un autre processus.
- Les verrous d’écriture de session ne sont pas réentrants par défaut. Si un helper imbrique intentionnellement l’acquisition du
  même verrou tout en préservant un seul écrivain logique, il doit l’autoriser explicitement avec
  `allowReentrant: true`.

## Préparation de la session + de l’espace de travail

- L’espace de travail est résolu et créé ; les exécutions en sandbox peuvent rediriger vers une racine d’espace de travail sandbox.
- Les Skills sont chargées (ou réutilisées depuis un snapshot) et injectées dans l’env et le prompt.
- Les fichiers bootstrap/contexte sont résolus et injectés dans le rapport du prompt système.
- Un verrou d’écriture de session est acquis ; `SessionManager` est ouvert et préparé avant la diffusion. Tout
  chemin ultérieur de réécriture, de Compaction ou de troncature de transcription doit prendre le même verrou avant d’ouvrir ou
  de modifier le fichier de transcription.

## Assemblage du prompt + prompt système

- Le prompt système est construit à partir du prompt de base d’OpenClaw, du prompt des Skills, du contexte bootstrap et des remplacements par exécution.
- Les limites spécifiques au modèle et les jetons réservés à la Compaction sont appliqués.
- Voir [Prompt système](/fr/concepts/system-prompt) pour ce que voit le modèle.

## Points de hook (où vous pouvez intercepter)

OpenClaw possède deux systèmes de hooks :

- **Hooks internes** (hooks Gateway) : scripts pilotés par événements pour les commandes et les événements de cycle de vie.
- **Hooks de Plugin** : points d’extension à l’intérieur du cycle de vie agent/outil et du pipeline gateway.

### Hooks internes (hooks Gateway)

- **`agent:bootstrap`** : s’exécute pendant la construction des fichiers bootstrap avant la finalisation du prompt système.
  Utilisez-le pour ajouter/supprimer des fichiers de contexte bootstrap.
- **Hooks de commande** : `/new`, `/reset`, `/stop` et autres événements de commande (voir la documentation Hooks).

Voir [Hooks](/fr/automation/hooks) pour la configuration et des exemples.

### Hooks de Plugin (cycle de vie agent + gateway)

Ils s’exécutent à l’intérieur de la boucle d’agent ou du pipeline gateway :

- **`before_model_resolve`** : s’exécute avant la session (sans `messages`) pour remplacer de manière déterministe le fournisseur/modèle avant la résolution du modèle.
- **`before_prompt_build`** : s’exécute après le chargement de la session (avec `messages`) pour injecter `prependContext`, `systemPrompt`, `prependSystemContext` ou `appendSystemContext` avant l’envoi du prompt. Utilisez `prependContext` pour du texte dynamique par tour et les champs de contexte système pour des consignes stables qui doivent rester dans l’espace du prompt système.
- **`before_agent_start`** : hook de compatibilité hérité qui peut s’exécuter dans l’une ou l’autre phase ; préférez les hooks explicites ci-dessus.
- **`before_agent_reply`** : s’exécute après les actions inline et avant l’appel LLM, permettant à un Plugin de revendiquer le tour et de renvoyer une réponse synthétique ou de rendre le tour entièrement silencieux.
- **`agent_end`** : inspecte la liste finale des messages et les métadonnées d’exécution après la fin.
- **`before_compaction` / `after_compaction`** : observent ou annotent les cycles de Compaction.
- **`before_tool_call` / `after_tool_call`** : interceptent les paramètres/résultats d’outil.
- **`before_install`** : inspecte les résultats de scan intégrés et peut éventuellement bloquer les installations de Skills ou de plugins.
- **`tool_result_persist`** : transforme de manière synchrone les résultats d’outil avant leur écriture dans une transcription de session appartenant à OpenClaw.
- **`message_received` / `message_sending` / `message_sent`** : hooks de messages entrants + sortants.
- **`session_start` / `session_end`** : bornes du cycle de vie de la session.
- **`gateway_start` / `gateway_stop`** : événements de cycle de vie du gateway.

Règles de décision des hooks pour les garde-fous sortants/outils :

- `before_tool_call`: `{ block: true }` est terminal et arrête les handlers de priorité inférieure.
- `before_tool_call`: `{ block: false }` est un no-op et n’efface pas un blocage antérieur.
- `before_install`: `{ block: true }` est terminal et arrête les handlers de priorité inférieure.
- `before_install`: `{ block: false }` est un no-op et n’efface pas un blocage antérieur.
- `message_sending`: `{ cancel: true }` est terminal et arrête les handlers de priorité inférieure.
- `message_sending`: `{ cancel: false }` est un no-op et n’efface pas une annulation antérieure.

Voir [Hooks de Plugin](/fr/plugins/hooks) pour l’API des hooks et les détails d’enregistrement.

Les harnesses peuvent adapter ces hooks différemment. Le harness app-server de Codex conserve
les hooks de Plugin OpenClaw comme contrat de compatibilité pour les surfaces miroir documentées,
tandis que les hooks natifs Codex restent un mécanisme Codex distinct de plus bas niveau.

## Diffusion + réponses partielles

- Les deltas de l’assistant sont diffusés depuis pi-agent-core et émis comme événements `assistant`.
- La diffusion par bloc peut émettre des réponses partielles soit sur `text_end`, soit sur `message_end`.
- La diffusion du raisonnement peut être émise comme flux séparé ou comme réponses par bloc.
- Voir [Diffusion](/fr/concepts/streaming) pour le comportement des fragments et des réponses par bloc.

## Exécution des outils + outils de messagerie

- Les événements tool start/update/end sont émis sur le flux `tool`.
- Les résultats d’outil sont assainis pour la taille et les payloads d’image avant journalisation/émission.
- Les envois de l’outil de messagerie sont suivis pour supprimer les confirmations dupliquées de l’assistant.

## Mise en forme de la réponse + suppression

- Les payloads finaux sont assemblés à partir de :
  - texte de l’assistant (et raisonnement éventuel)
  - résumés d’outils inline (quand verbose + autorisé)
  - texte d’erreur de l’assistant lorsque le modèle échoue
- Le jeton silencieux exact `NO_REPLY` / `no_reply` est filtré des
  payloads sortants.
- Les doublons d’outils de messagerie sont supprimés de la liste finale des payloads.
- S’il ne reste aucun payload affichable et qu’un outil a échoué, une réponse de repli d’erreur d’outil est émise
  (sauf si un outil de messagerie a déjà envoyé une réponse visible par l’utilisateur).

## Compaction + retries

- L’auto-Compaction émet des événements de flux `compaction` et peut déclencher un retry.
- Lors d’un retry, les buffers en mémoire et les résumés d’outils sont réinitialisés pour éviter une sortie dupliquée.
- Voir [Compaction](/fr/concepts/compaction) pour le pipeline de Compaction.

## Flux d’événements (aujourd’hui)

- `lifecycle` : émis par `subscribeEmbeddedPiSession` (et en repli par `agentCommand`)
- `assistant` : deltas diffusés depuis pi-agent-core
- `tool` : événements d’outil diffusés depuis pi-agent-core

## Gestion des canaux de chat

- Les deltas de l’assistant sont mis en mémoire tampon dans des messages `delta` de chat.
- Un `final` de chat est émis sur **lifecycle end/error**.

## Timeouts

- `agent.wait` par défaut : 30 s (attente uniquement). Le paramètre `timeoutMs` remplace cette valeur.
- Runtime d’agent : `agents.defaults.timeoutSeconds` vaut 172800 s (48 heures) par défaut ; appliqué dans le minuteur d’abandon de `runEmbeddedPiAgent`.
- Timeout d’inactivité LLM : `agents.defaults.llm.idleTimeoutSeconds` abandonne une requête modèle lorsqu’aucun fragment de réponse n’arrive avant la fenêtre d’inactivité. Définissez-le explicitement pour les modèles locaux lents ou les fournisseurs de raisonnement/appel d’outils ; définissez-le à `0` pour le désactiver. S’il n’est pas défini, OpenClaw utilise `agents.defaults.timeoutSeconds` lorsqu’il est configuré, sinon 120 s. Les exécutions déclenchées par Cron sans timeout LLM ou agent explicite désactivent le watchdog d’inactivité et s’appuient sur le timeout externe de cron.

## Où les choses peuvent se terminer plus tôt

- Timeout de l’agent (abandon)
- AbortSignal (annulation)
- Déconnexion du Gateway ou timeout RPC
- Timeout de `agent.wait` (attente uniquement, n’arrête pas l’agent)

## Connexes

- [Outils](/fr/tools) — outils d’agent disponibles
- [Hooks](/fr/automation/hooks) — scripts pilotés par événements déclenchés par les événements du cycle de vie de l’agent
- [Compaction](/fr/concepts/compaction) — comment les longues conversations sont résumées
- [Approbations Exec](/fr/tools/exec-approvals) — contrôles d’approbation pour les commandes shell
- [Thinking](/fr/tools/thinking) — configuration du niveau de réflexion/raisonnement
