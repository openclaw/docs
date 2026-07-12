---
read_when:
    - Exécution de harnais de codage via ACP
    - Configuration de sessions ACP liées aux conversations sur les canaux de messagerie
    - Lier une conversation de canal de messagerie à une session ACP persistante
    - Dépannage du backend ACP, de la configuration du Plugin ou de la transmission des résultats d’exécution
    - Utiliser les commandes /acp depuis le chat
sidebarTitle: ACP agents
summary: Exécutez des environnements de programmation externes (Claude Code, Cursor, Gemini CLI, Codex ACP explicite, OpenClaw ACP, OpenCode) via le backend ACP
title: Agents ACP
x-i18n:
    generated_at: "2026-07-12T03:07:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 68f5a5588710bea3027583bf06587706eb476d3ad1a31b0ef798586fcb895aa9
    source_path: tools/acp-agents.md
    workflow: 16
---

[Les sessions Agent Client Protocol (ACP)](https://agentclientprotocol.com/) permettent à
OpenClaw d’exécuter des environnements de codage externes (Claude Code, Cursor, Copilot, Droid,
OpenClaw ACP, OpenCode, Gemini CLI et d’autres environnements ACPX pris en charge)
au moyen d’un Plugin de backend ACP. Chaque lancement est suivi comme une
[tâche en arrière-plan](/fr/automation/tasks).

<Note>
**ACP est la voie des environnements externes, et non la voie Codex par défaut.** Le Plugin
serveur d’application Codex natif gère les commandes `/codex ...` et l’environnement d’exécution
intégré `openai/gpt-*` par défaut pour les tours d’agent ; ACP gère les commandes `/acp ...`
et les sessions `sessions_spawn({ runtime: "acp" })`.

Pour permettre à Codex ou Claude Code de se connecter directement, en tant que client MCP externe,
aux conversations existantes des canaux OpenClaw, utilisez
[`openclaw mcp serve`](/fr/cli/mcp) plutôt qu’ACP.
</Note>

## Quelle page me faut-il ?

| Vous souhaitez…                                                                                              | Utilisez                              | Remarques                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Lier ou contrôler Codex dans la conversation actuelle                                                        | `/codex bind`, `/codex threads`       | Voie du serveur d’application Codex natif lorsque le Plugin `codex` est activé : réponses liées à la discussion, transfert d’images, modèle/mode rapide/autorisations, arrêt et pilotage. ACP est un repli explicite |
| Exécuter Claude Code, Gemini CLI, explicitement Codex ACP ou un autre environnement externe _via_ OpenClaw   | Cette page                            | Sessions liées à la discussion, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tâches en arrière-plan, commandes d’exécution                                                                            |
| Exposer une session Gateway OpenClaw _comme_ serveur ACP pour un éditeur ou un client                        | [`openclaw acp`](/fr/cli/acp)            | Mode pont : un IDE/client communique en ACP avec OpenClaw via stdio/WebSocket                                                                                                                                |
| Réutiliser une CLI d’IA locale comme modèle de repli en mode texte uniquement                               | [Backends CLI](/fr/gateway/cli-backends) | Pas ACP : aucun outil OpenClaw, aucune commande ACP, aucun environnement d’exécution externe                                                                                                                 |

## Cela fonctionne-t-il immédiatement ?

Oui, après l’installation du Plugin d’exécution ACP officiel :

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Les extractions du code source peuvent utiliser le Plugin d’espace de travail local
`extensions/acpx` après `pnpm install`. Exécutez `/acp doctor` pour vérifier que tout est prêt.

OpenClaw n’apprend aux agents à lancer des sessions ACP que lorsqu’ACP est **réellement utilisable** :
ACP doit être activé, l’envoi ne doit pas être désactivé, la session actuelle ne doit pas être
bloquée par le bac à sable, et un backend d’exécution doit être chargé et opérationnel. Si
l’une de ces conditions échoue, les Skills ACP et les instructions ACP de `sessions_spawn` restent
masquées afin que l’agent ne propose pas un backend indisponible.

<AccordionGroup>
  <Accordion title="Pièges lors de la première exécution">
    - Si `plugins.allow` est défini, il constitue un inventaire restrictif de Plugins et **doit** inclure `acpx`, faute de quoi le backend ACP installé est intentionnellement bloqué (`/acp doctor` signale l’entrée manquante dans la liste d’autorisation).
    - L’adaptateur Codex ACP est fourni avec le Plugin `acpx` et se lance localement lorsque cela est possible.
    - Codex ACP s’exécute avec un `CODEX_HOME` isolé. OpenClaw copie depuis la configuration Codex de l’hôte les entrées de confiance des projets approuvés ainsi que la configuration sûre de routage du modèle/fournisseur (`model`, `model_provider`, `model_reasoning_effort`, `sandbox_mode` et les champs sûrs de `model_providers.<name>`) ; l’authentification, les notifications et les hooks restent uniquement dans la configuration de l’hôte.
    - D’autres adaptateurs d’environnements cibles peuvent être téléchargés à la demande avec `npx` lors de la première utilisation.
    - L’authentification auprès du fournisseur doit déjà exister sur l’hôte pour cet environnement.
    - Si l’hôte ne dispose ni de npm ni d’un accès réseau, les téléchargements d’adaptateurs lors de la première exécution échouent jusqu’à ce que les caches soient préchargés ou que l’adaptateur soit installé autrement.

  </Accordion>
  <Accordion title="Prérequis d’exécution">
    ACP lance un véritable processus d’environnement externe. OpenClaw gère le routage,
    l’état des tâches en arrière-plan, la livraison, les liaisons et les règles ; l’environnement gère
    sa connexion au fournisseur, son catalogue de modèles, son comportement vis-à-vis du système de fichiers et ses outils natifs.

    Avant de mettre OpenClaw en cause, vérifiez les points suivants :

    - `/acp doctor` signale un backend activé et opérationnel.
    - L’identifiant cible est autorisé par `acp.allowedAgents` lorsque cette liste d’autorisation est définie.
    - La commande de l’environnement peut démarrer sur l’hôte du Gateway.
    - L’authentification du fournisseur est disponible pour cet environnement (`claude`, `codex`, `gemini`, `opencode`, `droid`, etc.).
    - Le modèle sélectionné existe pour cet environnement : les identifiants de modèles ne sont pas transférables d’un environnement à l’autre.
    - Le `cwd` demandé existe et est accessible ; sinon, omettez `cwd` et laissez le backend utiliser sa valeur par défaut.
    - Le mode d’autorisation correspond au travail demandé. Les sessions non interactives ne peuvent pas cliquer sur les invites d’autorisation natives ; les exécutions de codage nécessitant beaucoup d’écritures ou de commandes ont donc généralement besoin d’un profil d’autorisation ACPX capable de fonctionner sans interface.

  </Accordion>
</AccordionGroup>

Les outils des Plugins OpenClaw et les outils OpenClaw intégrés ne sont **pas** exposés par défaut
aux environnements ACP. Activez les ponts MCP explicites dans
[Agents ACP – configuration](/fr/tools/acp-agents-setup) uniquement lorsque l’environnement doit
appeler directement ces outils.

## Environnements cibles pris en charge

Avec le backend `acpx`, utilisez ces identifiants comme cibles de `/acp spawn <id>` ou de
`sessions_spawn({ runtime: "acp", agentId: "<id>" })` :

| Identifiant de l’environnement | Backend courant                                  | Remarques                                                                                                              |
| ------------------------------ | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `claude`                       | Adaptateur ACP Claude Code                       | Nécessite l’authentification Claude Code sur l’hôte.                                                                   |
| `codex`                        | Adaptateur ACP Codex                             | Repli ACP explicite uniquement lorsque `/codex` natif est indisponible ou qu’ACP est demandé.                          |
| `copilot`                      | Adaptateur ACP GitHub Copilot                    | Nécessite l’authentification de la CLI/de l’environnement d’exécution Copilot.                                         |
| `cursor`                       | ACP de la CLI Cursor (`cursor-agent acp`)        | Remplacez la commande acpx si une installation locale expose un autre point d’entrée ACP.                              |
| `droid`                        | CLI Factory Droid                                | Nécessite l’authentification Factory/Droid ou `FACTORY_API_KEY` dans l’environnement de l’environnement externe.       |
| `fast-agent`                   | Adaptateur ACP fast-agent-mcp                    | Téléchargé à la demande avec `uvx`.                                                                                    |
| `gemini`                       | Adaptateur ACP Gemini CLI                        | Nécessite l’authentification Gemini CLI ou la configuration d’une clé d’API.                                           |
| `iflow`                        | CLI iFlow                                        | La disponibilité de l’adaptateur et le contrôle du modèle dépendent de la CLI installée.                               |
| `kilocode`                     | CLI Kilo Code                                    | La disponibilité de l’adaptateur et le contrôle du modèle dépendent de la CLI installée.                               |
| `kimi`                         | CLI Kimi/Moonshot                                | Nécessite l’authentification Kimi/Moonshot sur l’hôte.                                                                 |
| `kiro`                         | CLI Kiro                                         | La disponibilité de l’adaptateur et le contrôle du modèle dépendent de la CLI installée.                               |
| `mux`                          | Adaptateur ACP Mux CLI                           | Téléchargé à la demande avec `npx`.                                                                                    |
| `opencode`                     | Adaptateur ACP OpenCode                          | Nécessite l’authentification de la CLI/du fournisseur OpenCode.                                                        |
| `openclaw`                     | Pont vers le Gateway OpenClaw via `openclaw acp` | Permet à un environnement compatible ACP de communiquer avec une session Gateway OpenClaw.                            |
| `qoder`                        | CLI Qoder                                        | La disponibilité de l’adaptateur et le contrôle du modèle dépendent de la CLI installée.                               |
| `qwen`                         | Qwen Code / Qwen CLI                             | Nécessite une authentification compatible avec Qwen sur l’hôte.                                                        |
| `trae`                         | Adaptateur ACP Trae CLI                          | La disponibilité de l’adaptateur et le contrôle du modèle dépendent de la CLI installée.                               |

`pi` (pi-acp) est également enregistré dans le backend acpx, mais il ne s’agit pas d’un
environnement de codage au même titre que les autres ci-dessus.

Des alias personnalisés d’agents acpx peuvent être configurés dans acpx lui-même, mais les règles
OpenClaw vérifient toujours `acp.allowedAgents` et toute correspondance
`agents.list[].runtime.acp.agent` avant l’envoi.

## Guide opérationnel

Déroulement rapide de `/acp` depuis la discussion :

<Steps>
  <Step title="Lancer">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto` ou, explicitement,
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Travailler">
    Poursuivez dans la conversation ou le fil lié (ou ciblez explicitement la clé de session).
  </Step>
  <Step title="Vérifier l’état">
    `/acp status`
  </Step>
  <Step title="Ajuster">
    `/acp model <provider/model>`, `/acp permissions <profile>`,
    `/acp timeout <seconds>`.
  </Step>
  <Step title="Piloter">
    Sans remplacer le contexte : `/acp steer tighten logging and continue`.
  </Step>
  <Step title="Arrêter">
    `/acp cancel` (tour actuel) ou `/acp close` (session et liaisons).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Détails du cycle de vie">
    - Le lancement crée ou reprend une session d’exécution ACP, enregistre les métadonnées ACP dans le stockage de sessions OpenClaw et peut créer une tâche en arrière-plan lorsque l’exécution appartient à la tâche parente.
    - Les sessions ACP appartenant à une tâche parente sont traitées comme du travail en arrière-plan, même lorsque la session d’exécution est persistante ; l’achèvement et la livraison entre différentes surfaces passent par le mécanisme de notification de la tâche parente plutôt que de se comporter comme une session de discussion normale destinée à l’utilisateur.
    - La maintenance des tâches ferme les sessions ACP ponctuelles terminales ou orphelines appartenant à une tâche parente. Les sessions ACP persistantes sont conservées tant qu’une liaison active avec une conversation demeure ; les sessions persistantes obsolètes sans liaison active sont fermées afin qu’elles ne puissent pas être reprises silencieusement une fois la tâche propriétaire terminée ou son enregistrement supprimé.
    - Les messages de suivi liés vont directement à la session ACP jusqu’à ce que la liaison soit fermée, désactivée, réinitialisée ou expirée.
    - Les commandes du Gateway restent locales. `/acp ...`, `/status` et `/unfocus` ne sont jamais envoyées comme texte d’invite normal à un environnement ACP lié.
    - `cancel` interrompt le tour actif lorsque le backend prend en charge l’annulation ; il ne supprime ni la liaison ni les métadonnées de session.
    - `close` termine la session ACP du point de vue d’OpenClaw et supprime la liaison. Un environnement peut néanmoins conserver son propre historique en amont s’il prend en charge la reprise.
    - Le Plugin acpx nettoie les arborescences de processus d’encapsulation et d’adaptation appartenant à OpenClaw après `close`, et récupère les processus orphelins ACPX appartenant à OpenClaw lors du démarrage du Gateway.
    - Les processus d’exécution inactifs peuvent être nettoyés après `acp.runtime.ttlMinutes` ; les métadonnées de session enregistrées restent disponibles pour `/acp sessions`.

  </Accordion>
  <Accordion title="Règles de routage de Codex natif">
    Déclencheurs en langage naturel qui doivent être acheminés vers le **Plugin Codex natif**
    lorsqu’il est activé :

    - « Lier ce canal Discord à Codex. »
    - « Associer cette discussion au fil Codex `<id>`. »
    - « Afficher les fils Codex, puis lier celui-ci. »

    La liaison native des conversations Codex est le mécanisme par défaut de contrôle des conversations.
    Les outils dynamiques d’OpenClaw continuent de s’exécuter via OpenClaw, tandis que les outils
    natifs de Codex tels que shell/apply-patch s’exécutent dans Codex. Pour les événements d’outils
    natifs de Codex, OpenClaw injecte à chaque tour un relais de hooks natifs afin que les hooks des
    plugins puissent bloquer `before_tool_call`, observer `after_tool_call` et acheminer les événements
    `PermissionRequest` de Codex via les approbations d’OpenClaw. Les hooks `Stop` de Codex sont
    relayés vers `before_agent_finalize` d’OpenClaw, où les plugins peuvent demander un passage
    supplémentaire du modèle avant que Codex ne finalise sa réponse. Le relais reste volontairement
    prudent : il ne modifie pas les arguments des outils natifs de Codex et ne réécrit pas les
    enregistrements de fils Codex. Utilisez explicitement ACP uniquement lorsque vous souhaitez le
    modèle d’exécution et de session ACP. Le périmètre de prise en charge de Codex intégré est
    documenté dans le
    [contrat de prise en charge v1 du harnais Codex](/fr/plugins/codex-harness-runtime#v1-support-contract).

  </Accordion>
  <Accordion title="Aide-mémoire pour la sélection du modèle, du fournisseur et du moteur d’exécution">
    - anciennes références de modèles Codex - route historique des modèles Codex avec OAuth/abonnement, réparée par doctor.
    - `openai/*` - moteur d’exécution intégré du serveur d’application natif Codex pour les tours d’agent OpenAI.
    - `/codex ...` - contrôle natif des conversations Codex.
    - `/acp ...` ou `runtime: "acp"` - contrôle explicite ACP/acpx.

  </Accordion>
  <Accordion title="Déclencheurs en langage naturel pour l’acheminement vers ACP">
    Déclencheurs devant acheminer vers le moteur d’exécution ACP :

    - « Exécutez ceci sous forme de session ACP Claude Code ponctuelle et résumez le résultat. »
    - « Utilisez Gemini CLI pour cette tâche dans un fil, puis conservez les suivis dans ce même fil. »
    - « Exécutez Codex via ACP dans un fil en arrière-plan. »

    OpenClaw choisit `runtime: "acp"`, résout l’`agentId` du harnais, se lie à
    la conversation ou au fil actuel lorsque cela est pris en charge, puis achemine
    les suivis vers cette session jusqu’à sa fermeture ou son expiration. Codex ne suit
    ce chemin que lorsqu’ACP/acpx est explicite ou que le plugin Codex natif n’est pas
    disponible pour l’opération demandée.

    Pour `sessions_spawn`, `runtime: "acp"` n’est proposé que lorsqu’ACP est
    activé, que le demandeur n’est pas placé dans un bac à sable et qu’un moteur
    d’exécution ACP est chargé. `acp.dispatch.enabled=false` suspend l’acheminement
    automatique des fils ACP, mais ne masque ni ne bloque les appels explicites
    `sessions_spawn({ runtime: "acp" })`. Il cible des identifiants de harnais ACP
    tels que `codex`, `claude`, `droid`, `gemini` ou `opencode`. Ne transmettez pas
    un identifiant d’agent de configuration OpenClaw ordinaire provenant de
    `agents_list`, sauf si cette entrée est explicitement configurée avec
    `agents.list[].runtime.type="acp"` ; sinon, utilisez le moteur d’exécution
    par défaut des sous-agents. Lorsqu’un agent OpenClaw est configuré avec
    `runtime.type="acp"`, OpenClaw utilise `runtime.acp.agent` comme identifiant
    de harnais sous-jacent.

  </Accordion>
</AccordionGroup>

## ACP ou sous-agents

Utilisez ACP lorsque vous souhaitez un moteur d’exécution de harnais externe. Utilisez le
**serveur d’application natif Codex** pour la liaison et le contrôle des conversations Codex
lorsque le plugin `codex` est activé. Utilisez des **sous-agents** lorsque vous souhaitez
des exécutions déléguées natives d’OpenClaw.

| Domaine             | Session ACP                                  | Exécution de sous-agent                     |
| ------------------- | -------------------------------------------- | -------------------------------------------- |
| Moteur d’exécution  | Plugin de moteur ACP (par exemple acpx)      | Moteur de sous-agent natif d’OpenClaw        |
| Clé de session      | `agent:<agentId>:acp:<uuid>`                 | `agent:<agentId>:subagent:<uuid>`            |
| Commandes principales | `/acp ...`                                 | `/subagents ...`                             |
| Outil de lancement  | `sessions_spawn` avec `runtime:"acp"`        | `sessions_spawn` (moteur par défaut)         |

Voir aussi [Sous-agents](/fr/tools/subagents).

## Fonctionnement d’ACP avec Claude Code

Pour Claude Code via ACP, la pile est la suivante :

1. Plan de contrôle des sessions ACP d’OpenClaw.
2. Plugin de moteur d’exécution officiel `@openclaw/acpx`.
3. Adaptateur ACP Claude.
4. Mécanismes d’exécution et de session côté Claude.

ACP Claude est une **session de harnais** dotée de commandes ACP, de la reprise
de session, du suivi des tâches en arrière-plan et d’une liaison facultative
à une conversation ou à un fil.

Les moteurs CLI constituent des moteurs locaux de secours distincts, limités au texte — voir
[Moteurs CLI](/fr/gateway/cli-backends).

Pour les opérateurs, la règle pratique est la suivante :

- **Vous souhaitez `/acp spawn`, des sessions pouvant être liées, des commandes d’exécution ou un travail persistant dans le harnais ?** Utilisez ACP.
- **Vous souhaitez un simple mécanisme de secours local en mode texte via la CLI brute ?** Utilisez les moteurs CLI.

## Sessions liées

### Modèle mental

- **Surface de conversation** — endroit où les personnes poursuivent leurs échanges (canal Discord, sujet Telegram, conversation iMessage).
- **Session ACP** — état d’exécution durable de Codex/Claude/Gemini vers lequel OpenClaw effectue l’acheminement.
- **Fil/sujet enfant** — surface de messagerie supplémentaire facultative créée uniquement par `--thread ...`.
- **Espace de travail d’exécution** — emplacement du système de fichiers (`cwd`, extraction du dépôt, espace de travail du moteur) où le harnais s’exécute. Indépendant de la surface de conversation.

### Liaisons à la conversation actuelle

`/acp spawn <harness> --bind here` associe la conversation actuelle à la
session ACP lancée — aucun fil enfant, même surface de conversation. OpenClaw
continue de gérer le transport, l’authentification, la sécurité et la livraison.
Les messages de suivi de cette conversation sont acheminés vers la même session ;
`/new` et `/reset` réinitialisent la session sur place ; `/acp close` supprime
la liaison.

Exemples :

```text
/codex bind                                              # liaison Codex native, acheminer ici les futurs messages
/codex model gpt-5.4                                     # ajuster le fil Codex natif lié
/codex stop                                              # contrôler le tour Codex natif actif
/acp spawn codex --bind here                             # mécanisme de secours ACP explicite pour Codex
/acp spawn codex --thread auto                           # peut créer un fil/sujet enfant et y établir la liaison
/acp spawn codex --bind here --cwd /workspace/repo       # même liaison de conversation, Codex s’exécute dans /workspace/repo
```

<AccordionGroup>
  <Accordion title="Règles de liaison et exclusivité">
    - `--bind here` et `--thread ...` s’excluent mutuellement.
    - `--bind here` fonctionne uniquement sur les canaux qui annoncent la prise en charge de la liaison à la conversation actuelle ; sinon, OpenClaw renvoie un message clair indiquant que cette fonctionnalité n’est pas prise en charge. Les liaisons persistent après les redémarrages du Gateway.
    - Sur Discord, `spawnSessions` contrôle la création de fils enfants pour `--thread auto|here`, mais pas pour `--bind here`.
    - Si vous lancez une session vers un autre agent ACP sans `--cwd`, OpenClaw hérite par défaut de l’espace de travail de **l’agent cible**. Les chemins hérités manquants (`ENOENT`/`ENOTDIR`) entraînent un retour au moteur par défaut ; les autres erreurs d’accès (par exemple `EACCES`) sont signalées comme des erreurs de lancement.
    - Les commandes de gestion du Gateway restent locales dans les conversations liées : les commandes `/acp ...` sont traitées par OpenClaw même lorsque le texte de suivi ordinaire est acheminé vers la session ACP liée ; `/status` et `/unfocus` restent également locales chaque fois que le traitement des commandes est activé pour cette surface.

  </Accordion>
  <Accordion title="Sessions liées à un fil">
    Lorsque les liaisons de fils sont activées pour un adaptateur de canal :

    - OpenClaw lie un fil à une session ACP cible.
    - Les messages de suivi de ce fil sont acheminés vers la session ACP liée.
    - La sortie ACP est renvoyée vers le même fil.
    - La désactivation de la focalisation, la fermeture, l’archivage, l’expiration pour inactivité ou l’expiration liée à l’âge maximal supprime la liaison.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` et `/unfocus` sont des commandes du Gateway, et non des invites destinées au harnais ACP.

    Indicateurs de fonctionnalité requis pour ACP lié à un fil :

    - `acp.enabled=true`
    - `acp.dispatch.enabled` est activé par défaut (définissez-le sur `false` pour suspendre l’acheminement automatique des fils ACP ; les appels explicites `sessions_spawn({ runtime: "acp" })` continuent de fonctionner).
    - Lancement de sessions de fil activé pour l’adaptateur de canal (valeur par défaut : `true`) :
      - Discord : `channels.discord.threadBindings.spawnSessions=true`
      - Telegram : `channels.telegram.threadBindings.spawnSessions=true`

    La prise en charge de la liaison de fils dépend de l’adaptateur. Si l’adaptateur
    de canal actif ne prend pas en charge les liaisons de fils, OpenClaw renvoie
    un message clair indiquant que cette fonctionnalité n’est pas prise en charge
    ou n’est pas disponible.

  </Accordion>
  <Accordion title="Canaux prenant en charge les fils">
    - Tout adaptateur de canal exposant une capacité de liaison de session ou de fil.
    - Prise en charge intégrée actuelle : fils/canaux **Discord**, sujets **Telegram** (sujets de forum dans les groupes/supergroupes et sujets de messages privés).
    - Les canaux de plugins peuvent ajouter cette prise en charge via la même interface de liaison.

  </Accordion>
</AccordionGroup>

## Liaisons persistantes de canaux

Pour les flux de travail non éphémères, configurez des liaisons ACP persistantes
dans les entrées `bindings[]` de premier niveau.

### Modèle de liaison

<ParamField path="bindings[].type" type='"acp"'>
  Désigne une liaison de conversation ACP persistante.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Identifie la conversation cible. Formats propres à chaque canal :

- **Canal/fil Discord :** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Canal/message privé Slack :** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`. Privilégiez les identifiants Slack stables ; les liaisons de canal correspondent également aux réponses dans les fils de ce canal.
- **Sujet de forum Telegram :** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **Message privé/groupe WhatsApp :** `match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"`. Utilisez des numéros E.164 tels que `+15555550123` pour les conversations directes et des JID de groupe WhatsApp tels que `120363424282127706@g.us` pour les groupes.
- **Message privé/groupe iMessage :** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Privilégiez `chat_id:*` pour des liaisons de groupe stables.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  Identifiant de l’agent OpenClaw propriétaire.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  Remplacement ACP facultatif.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  Libellé facultatif destiné à l’opérateur.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  Répertoire de travail d’exécution facultatif.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  Remplacement facultatif du moteur.
</ParamField>

### Valeurs par défaut d’exécution par agent

Utilisez `agents.list[].runtime` pour définir une seule fois les valeurs ACP par défaut de chaque agent :

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (identifiant du harnais, par exemple `codex` ou `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Ordre de priorité des remplacements pour les sessions ACP liées :**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. Valeurs ACP globales par défaut (par exemple `acp.backend`)

### Exemple

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
      {
        id: "claude",
        runtime: {
          type: "acp",
          acp: { agent: "claude", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
    {
      type: "acp",
      agentId: "claude",
      match: {
        channel: "telegram",
        accountId: "default",
        peer: { kind: "group", id: "-1001234567890:topic:42" },
      },
      acp: { cwd: "/workspace/repo-b" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "discord", accountId: "default" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "telegram", accountId: "default" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": { requireMention: false },
          },
        },
      },
    },
    telegram: {
      groups: {
        "-1001234567890": {
          topics: { "42": { requireMention: false } },
        },
      },
    },
  },
}
```

### Comportement

- OpenClaw s’assure que la session ACP configurée existe après l’admission propre au canal et avant son utilisation.
- Les messages de ce canal, sujet ou chat sont acheminés vers la session ACP configurée.
- Les liaisons ACP configurées sont propriétaires de la route de leur session. La diffusion en éventail sur le canal ne remplace pas la session ACP configurée pour une liaison correspondante.
- Dans les conversations liées, `/new` et `/reset` réinitialisent sur place la même clé de session ACP.
- Les liaisons temporaires d’exécution (par exemple celles créées par les flux de focalisation sur un fil) continuent de s’appliquer lorsqu’elles sont présentes.
- Pour les lancements ACP inter-agents sans `cwd` explicite, OpenClaw hérite de l’espace de travail de l’agent cible depuis la configuration de l’agent.
- Les chemins d’espace de travail hérités inexistants utilisent par défaut le répertoire de travail du backend ; les autres échecs d’accès sont signalés comme des erreurs de lancement.

## Démarrer des sessions ACP

Deux façons de démarrer une session ACP :

<Tabs>
  <Tab title="Depuis sessions_spawn">
    Utilisez `runtime: "acp"` pour démarrer une session ACP depuis un tour
    d’agent ou un appel d’outil.

    ```json
    {
      "task": "Open the repo and summarize failing tests",
      "runtime": "acp",
      "agentId": "codex",
      "thread": true,
      "mode": "session"
    }
    ```

    <Note>
    La valeur par défaut de `runtime` est `subagent` ; définissez donc
    explicitement `runtime: "acp"` pour les sessions ACP. Si `agentId` est
    omis, OpenClaw utilise `acp.defaultAgent` lorsqu’il est configuré.
    `mode: "session"` nécessite `thread: true` afin de conserver une
    conversation liée persistante.
    </Note>

  </Tab>
  <Tab title="Depuis la commande /acp">
    Utilisez `/acp spawn` pour permettre à l’opérateur de contrôler
    explicitement le lancement depuis le chat.

    ```text
    /acp spawn codex --mode persistent --thread auto
    /acp spawn codex --mode oneshot --thread off
    /acp spawn codex --bind here
    /acp spawn codex --thread here
    ```

    Options principales :

    - `--mode persistent|oneshot`
    - `--bind here|off`
    - `--thread auto|here|off`
    - `--cwd <absolute-path>`
    - `--label <name>`

    Consultez [Commandes slash](/fr/tools/slash-commands).

  </Tab>
</Tabs>

### Paramètres de `sessions_spawn`

<ParamField path="task" type="string" required>
  Invite initiale envoyée à la session ACP.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  Doit être `"acp"` pour les sessions ACP.
</ParamField>
<ParamField path="agentId" type="string">
  Identifiant du harnais ACP cible. Utilise `acp.defaultAgent` par défaut s’il
  est défini.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Demande le flux de liaison à un fil lorsqu’il est pris en charge.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` est ponctuel ; `"session"` est persistant. Si `thread: true` et que
  `mode` est omis, OpenClaw peut choisir par défaut un comportement persistant
  selon le chemin d’exécution. `mode: "session"` nécessite `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Répertoire de travail demandé pour l’exécution (validé par la politique du
  backend ou de l’environnement d’exécution). S’il est omis, le lancement ACP
  hérite de l’espace de travail de l’agent cible lorsqu’il est configuré ; les
  chemins hérités inexistants utilisent les valeurs par défaut du backend,
  tandis que les véritables erreurs d’accès sont renvoyées.
</ParamField>
<ParamField path="label" type="string">
  Libellé destiné à l’opérateur, utilisé dans le texte de la session ou de la
  bannière.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Reprend une session ACP existante au lieu d’en créer une nouvelle. L’agent
  rejoue l’historique de sa conversation via `session/load`. Nécessite
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` retransmet les résumés de progression de l’exécution ACP initiale
  à la session demandeuse sous forme d’événements système. Les réponses
  acceptées comprennent `streamLogPath`, qui pointe vers un journal JSONL
  limité à la session (`<sessionId>.acp-stream.jsonl`) que vous pouvez suivre
  pour consulter l’intégralité de l’historique de relais. Par défaut, les flux
  de progression vers le parent affichent les commentaires de l’assistant et
  la progression de l’état ACP, sauf si
  `streaming.progress.commentary=false`. Discord utilise également par défaut
  le mode de progression pour les aperçus destinés au parent lorsqu’aucun mode
  de flux n’est configuré. La progression de l’état respecte toujours
  `acp.stream.tagVisibility` ; les balises telles que `plan` restent donc
  masquées sauf si elles sont explicitement activées.
</ParamField>

Les exécutions ACP de `sessions_spawn` utilisent
`agents.defaults.subagents.runTimeoutSeconds` comme limite par défaut des tours
enfants. L’outil n’accepte pas le remplacement du délai d’expiration pour
chaque appel (`runTimeoutSeconds`/`timeoutSeconds` sont rejetés avec une erreur
indiquant de configurer la valeur par défaut).

<ParamField path="model" type="string">
  Remplacement explicite du modèle pour la session ACP enfant. Les lancements
  ACP de Codex normalisent les références OpenAI telles que `openai/gpt-5.4`
  en configuration de démarrage ACP de Codex avant `session/new` ; les formes
  avec barre oblique telles que `openai/gpt-5.4/high` définissent également
  l’effort de raisonnement ACP de Codex. Lorsque ce paramètre est omis,
  `sessions_spawn({ runtime: "acp" })` utilise les valeurs par défaut existantes
  du modèle des sous-agents (`agents.defaults.subagents.model` ou
  `agents.list[].subagents.model`) lorsqu’elles sont configurées ; sinon, il
  laisse le harnais ACP utiliser son propre modèle par défaut. Les autres
  harnais doivent annoncer les `models` ACP et prendre en charge
  `session/set_model` ; sinon, OpenClaw/acpx échoue de manière explicite au
  lieu d’utiliser silencieusement le modèle par défaut de l’agent cible.
</ParamField>
<ParamField path="thinking" type="string">
  Effort explicite de réflexion ou de raisonnement. Pour ACP de Codex,
  `minimal` correspond à un effort faible, `low`/`medium`/`high`/`xhigh`
  correspondent directement aux niveaux associés et `off` omet le
  remplacement de l’effort de raisonnement au démarrage. Lorsque ce paramètre
  est omis, les lancements ACP utilisent les valeurs par défaut existantes de
  réflexion des sous-agents ainsi que
  `agents.defaults.models["provider/model"].params.thinking` pour le modèle
  sélectionné.
</ParamField>

## Modes de liaison et de fil au lancement

<Tabs>
  <Tab title="--bind here|off">
    | Mode   | Comportement                                                                    |
    | ------ | ------------------------------------------------------------------------------- |
    | `here` | Lie sur place la conversation active actuelle ; échoue si aucune n’est active. |
    | `off`  | Ne crée pas de liaison avec la conversation actuelle.                         |

    Remarques :

    - `--bind here` est le chemin le plus simple pour permettre à l’opérateur de « faire prendre en charge ce canal ou ce chat par Codex ».
    - `--bind here` ne crée pas de fil enfant.
    - `--bind here` est disponible uniquement sur les canaux qui prennent en charge la liaison à la conversation actuelle.
    - `--bind` et `--thread` ne peuvent pas être combinés dans le même appel à `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Mode   | Comportement                                                                                                      |
    | ------ | ----------------------------------------------------------------------------------------------------------------- |
    | `auto` | Dans un fil actif : lie ce fil. Hors d’un fil : crée et lie un fil enfant lorsque cette opération est prise en charge. |
    | `here` | Exige un fil actif actuel ; échoue si la conversation ne se trouve pas dans un fil.                              |
    | `off`  | Aucune liaison. La session démarre sans liaison.                                                                   |

    Remarques :

    - Sur les surfaces de liaison sans fil, le comportement par défaut équivaut à `off`.
    - Le lancement lié à un fil nécessite la prise en charge par la politique du canal :
      - Discord : `channels.discord.threadBindings.spawnSessions=true`
      - Telegram : `channels.telegram.threadBindings.spawnSessions=true`
    - Utilisez `--bind here` lorsque vous souhaitez épingler la conversation actuelle sans créer de fil enfant.

  </Tab>
</Tabs>

## Modèle de livraison

Les sessions ACP peuvent être des espaces de travail interactifs ou des
tâches en arrière-plan appartenant au parent. Le chemin de livraison dépend
de cette configuration.

<AccordionGroup>
  <Accordion title="Sessions ACP interactives">
    Les sessions interactives sont conçues pour poursuivre la conversation
    sur une surface de chat visible :

    - `/acp spawn ... --bind here` lie la conversation actuelle à la session ACP.
    - `/acp spawn ... --thread ...` lie un fil ou un sujet du canal à la session ACP.
    - Les `bindings[].type="acp"` persistantes configurées acheminent les conversations correspondantes vers la même session ACP.

    Les messages suivants dans la conversation liée sont acheminés directement
    vers la session ACP, et la sortie ACP est renvoyée vers ce même
    canal, fil ou sujet.

    Ce qu’OpenClaw envoie au harnais :

    - Les messages de suivi normaux dans une conversation liée sont envoyés sous forme de texte d’invite, avec les pièces jointes uniquement lorsque le harnais ou le backend les prend en charge.
    - Les commandes de gestion `/acp` et les commandes locales du Gateway sont interceptées avant l’envoi à ACP.
    - Les événements d’achèvement générés par l’environnement d’exécution sont matérialisés pour chaque cible. Les agents OpenClaw reçoivent l’enveloppe de contexte d’exécution interne d’OpenClaw ; les harnais ACP externes reçoivent une invite en texte brut contenant le résultat de l’enfant et l’instruction. L’enveloppe brute `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` ne doit jamais être envoyée aux harnais externes ni conservée comme texte utilisateur dans la transcription ACP.
    - Les entrées de transcription ACP utilisent le texte de déclenchement visible par l’utilisateur ou l’invite d’achèvement en texte brut. Les métadonnées d’événements internes restent structurées dans OpenClaw lorsque cela est possible et ne sont pas traitées comme du contenu de chat rédigé par l’utilisateur.

  </Accordion>
  <Accordion title="Sessions ACP ponctuelles appartenant au parent">
    Les sessions ACP ponctuelles lancées par l’exécution d’un autre agent sont
    des enfants en arrière-plan, comme les sous-agents :

    - Le parent demande l’exécution d’une tâche avec `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - L’enfant s’exécute dans sa propre session de harnais ACP.
    - Les tours enfants s’exécutent dans la même file d’arrière-plan que les lancements de sous-agents natifs ; un harnais ACP lent ne bloque donc pas les tâches sans rapport de la session principale.
    - L’achèvement est signalé par le chemin d’annonce de fin de tâche. OpenClaw convertit les métadonnées d’achèvement internes en invite ACP en texte brut avant de les envoyer à un harnais externe ; les harnais ne voient donc pas les marqueurs de contexte d’exécution propres à OpenClaw.
    - Le parent reformule le résultat de l’enfant avec la voix normale de l’assistant lorsqu’une réponse destinée à l’utilisateur est utile.

    Ne traitez **pas** ce chemin comme un chat pair à pair entre le parent et
    l’enfant. L’enfant dispose déjà d’un canal d’achèvement vers le parent.

  </Accordion>
  <Accordion title="Livraison sessions_send et A2A">
    `sessions_send` peut cibler une autre session après son lancement. Pour les
    sessions paires normales, OpenClaw utilise un chemin de suivi agent à agent
    (A2A) après l’injection du message :

    - Attendre la réponse de la session cible.
    - Permettre éventuellement au demandeur et à la cible d’échanger un nombre limité de tours de suivi.
    - Demander à la cible de produire un message d’annonce.
    - Livrer cette annonce au canal ou au fil visible.

    Ce chemin A2A est une solution de repli pour les envois entre pairs lorsque l'expéditeur a besoin d'un
    suivi visible. Il reste activé lorsqu'une session sans rapport peut voir une
    cible ACP et lui envoyer des messages, par exemple avec des paramètres
    `tools.sessions.visibility` étendus.

    OpenClaw ignore le suivi A2A uniquement lorsque le demandeur est le parent de
    son propre enfant ACP ponctuel appartenant au parent. Dans ce cas, exécuter A2A en plus
    de l'achèvement de la tâche peut réveiller le parent avec le résultat de l'enfant, transférer
    la réponse du parent à l'enfant et créer une boucle d'écho
    parent/enfant. Le résultat de `sessions_send` indique `delivery.status="skipped"` dans
    ce cas d'enfant possédé, car le chemin d'achèvement est déjà responsable
    du résultat.

  </Accordion>
  <Accordion title="Reprendre une session existante">
    Utilisez `resumeSessionId` pour poursuivre une session ACP précédente au lieu d'en
    démarrer une nouvelle. L'agent rejoue l'historique de sa conversation via
    `session/load`, ce qui lui permet de reprendre avec tout le contexte précédent.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Cas d'utilisation courants :

    - Transférez une session Codex de votre ordinateur portable à votre téléphone : demandez à votre agent de reprendre là où vous vous êtes arrêté.
    - Poursuivez sans interface, par l'intermédiaire de votre agent, une session de programmation commencée de manière interactive dans la CLI.
    - Reprenez un travail interrompu par un redémarrage du Gateway ou un délai d'inactivité.

    Remarques :

    - `resumeSessionId` s'applique uniquement lorsque `runtime: "acp"` ; le runtime de sous-agent par défaut ignore ce champ propre à ACP.
    - `streamTo` s'applique uniquement lorsque `runtime: "acp"` ; le runtime de sous-agent par défaut ignore ce champ propre à ACP.
    - `resumeSessionId` est un identifiant de reprise ACP/du harnais local à l'hôte, et non une clé de session de canal OpenClaw ; OpenClaw vérifie toujours la politique de lancement ACP et celle de l'agent cible avant l'envoi, tandis que le backend ACP ou le harnais gère l'autorisation de chargement de cet identifiant en amont.
    - `resumeSessionId` restaure l'historique de conversation ACP en amont ; `thread` et `mode` continuent de s'appliquer normalement à la nouvelle session OpenClaw que vous créez, donc `mode: "session"` exige toujours `thread: true`.
    - L'agent cible doit prendre en charge `session/load` (c'est le cas de Codex et Claude Code).
    - Si l'identifiant de session est introuvable, le lancement échoue avec une erreur explicite, sans solution de repli silencieuse vers une nouvelle session.

  </Accordion>
  <Accordion title="Test de bon fonctionnement après déploiement">
    Après un déploiement du Gateway, effectuez une vérification réelle de bout en bout plutôt que de vous fier
    aux tests unitaires :

    1. Vérifiez la version et le commit du Gateway déployé sur l'hôte cible.
    2. Ouvrez une session de pont ACPX temporaire vers un agent actif.
    3. Demandez à cet agent d'appeler `sessions_spawn` avec `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` et la tâche `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Vérifiez `accepted=yes`, la présence d'un véritable `childSessionKey` et l'absence d'erreur de validation.
    5. Nettoyez la session de pont temporaire.

    Limitez cette vérification à `mode: "run"` et omettez `streamTo: "parent"` :
    le `mode: "session"` lié à un fil et les chemins de relais de flux constituent des
    tests d'intégration distincts et plus complets.

  </Accordion>
</AccordionGroup>

## Compatibilité avec le bac à sable

Les sessions ACP s'exécutent actuellement dans le runtime de l'hôte, **pas** dans le
bac à sable OpenClaw.

<Warning>
**Limite de sécurité :**

- Le harnais externe peut lire et écrire conformément à ses propres autorisations de CLI et au `cwd` sélectionné.
- La politique de bac à sable d'OpenClaw n'englobe **pas** l'exécution du harnais ACP.
- OpenClaw continue d'appliquer les mécanismes d'activation ACP, les agents autorisés, la propriété des sessions, les liaisons de canaux et la politique de livraison du Gateway.
- Utilisez `runtime: "subagent"` pour les tâches natives d'OpenClaw soumises au bac à sable.

</Warning>

Limitations actuelles :

- Si la session du demandeur est exécutée dans un bac à sable, les lancements ACP sont bloqués pour `sessions_spawn({ runtime: "acp" })` comme pour `/acp spawn`.
- `sessions_spawn` avec `runtime: "acp"` ne prend pas en charge `sandbox: "require"`.

## Résolution de la session cible

La plupart des actions `/acp` acceptent une cible de session facultative (`session-key`,
`session-id` ou `session-label`).

**Ordre de résolution :**

1. Argument de cible explicite (ou `--session` pour `/acp steer`)
   - essaie d'abord la clé
   - puis l'identifiant de session au format UUID
   - puis le libellé
2. Liaison au fil actuel (si cette conversation ou ce fil est lié à une session ACP).
3. Solution de repli vers la session actuelle du demandeur.

Les liaisons de la conversation actuelle et celles du fil participent toutes deux à l'étape 2.

Si aucune cible n'est résolue, OpenClaw renvoie une erreur explicite
(`Unable to resolve session target: ...`).

## Commandes ACP

| Commande             | Fonction                                                  | Exemple                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Crée une session ACP ; liaison actuelle ou au fil facultative. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Annule le tour en cours pour la session cible.            | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Envoie une instruction d'orientation à la session en cours. | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Ferme la session et dissocie les cibles du fil.           | `/acp close`                                                  |
| `/acp status`        | Affiche le backend, le mode, l'état, les options du runtime et les capacités. | `/acp status`                                                 |
| `/acp set-mode`      | Définit le mode du runtime pour la session cible.         | `/acp set-mode plan`                                          |
| `/acp set`           | Écrit une option générique de configuration du runtime.   | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Définit le remplacement du répertoire de travail du runtime. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Définit le profil de politique d'approbation.             | `/acp permissions strict`                                     |
| `/acp timeout`       | Définit le délai d'expiration du runtime (en secondes).   | `/acp timeout 120`                                            |
| `/acp model`         | Définit le remplacement du modèle du runtime.             | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Supprime les remplacements d'options du runtime de la session. | `/acp reset-options`                                          |
| `/acp sessions`      | Répertorie les sessions ACP récentes du stockage.         | `/acp sessions`                                               |
| `/acp doctor`        | Affiche l'état du backend, ses capacités et les correctifs applicables. | `/acp doctor`                                                 |
| `/acp install`       | Affiche les étapes déterministes d'installation et d'activation. | `/acp install`                                                |

Les commandes du runtime (`spawn`, `cancel`, `steer`, `close`, `status`, `set-mode`,
`set`, `cwd`, `permissions`, `timeout`, `model` et `reset-options`) exigent
l'identité du propriétaire depuis les canaux externes et `operator.admin` depuis les clients
internes du Gateway. Les expéditeurs autorisés qui ne sont pas propriétaires peuvent néanmoins utiliser `sessions`,
`doctor`, `install` et `help`.

`/acp status` affiche les options effectives du runtime ainsi que les
identifiants de session au niveau du runtime et du backend. Les erreurs de commande non prise en charge
sont affichées clairement lorsqu'un backend ne dispose pas d'une capacité. `/acp sessions` lit le stockage
de la session actuellement liée ou de celle du demandeur ; les jetons de cible (`session-key`,
`session-id` ou `session-label`) sont résolus par la découverte de sessions du Gateway,
y compris les racines `session.store` personnalisées propres à chaque agent.

### Correspondance des options du runtime

`/acp` propose des commandes pratiques et un mécanisme de définition générique. Opérations équivalentes :

| Commande                     | Correspond à                         | Remarques                                                                                                                                                                                                  |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | clé de configuration du runtime `model` | Pour Codex ACP, OpenClaw normalise `openai/<model>` en identifiant de modèle de l'adaptateur et associe les suffixes d'effort de raisonnement après une barre oblique, comme `openai/gpt-5.4/high`, à `reasoning_effort`. |
| `/acp set thinking <level>`  | option canonique `thinking`          | OpenClaw envoie l'équivalent annoncé par le backend lorsqu'il existe, en privilégiant `thinking`, puis `effort`, `reasoning_effort` ou `thought_level`. Pour Codex ACP, l'adaptateur associe les valeurs à `reasoning_effort`. |
| `/acp permissions <profile>` | option canonique `permissionProfile` | OpenClaw envoie l'équivalent annoncé par le backend lorsqu'il existe, comme `approval_policy`, `permission_profile`, `permissions` ou `permission_mode`. |
| `/acp timeout <seconds>`     | option canonique `timeoutSeconds`    | OpenClaw envoie l'équivalent annoncé par le backend lorsqu'il existe, comme `timeout` ou `timeout_seconds`. |
| `/acp cwd <path>`            | remplacement du répertoire de travail du runtime | Mise à jour directe.                                                                                                                                                                                       |
| `/acp set <key> <value>`     | générique                            | `key=cwd` utilise le chemin de remplacement du répertoire de travail.                                                                                                                                      |
| `/acp reset-options`         | efface tous les remplacements du runtime | -                                                                                                                                                                                                          |

## Harnais acpx, configuration du Plugin et autorisations

Pour la configuration du harnais acpx (alias Claude Code / Codex / Gemini CLI),
les ponts MCP d'outils de Plugin et d'outils OpenClaw, ainsi que les modes d'autorisation ACP,
consultez [Agents ACP — configuration](/fr/tools/acp-agents-setup).

## Dépannage

| Symptôme                                                                                  | Cause probable                                                                                                          | Correctif                                                                                                                                                                            |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                                   | Plugin de backend absent, désactivé ou bloqué par `plugins.allow`.                                                      | Installez et activez le Plugin de backend, incluez `acpx` dans `plugins.allow` lorsque cette liste d’autorisation est définie, puis exécutez `/acp doctor`.                            |
| `ACP is disabled by policy (acp.enabled=false)`                                           | ACP est désactivé globalement.                                                                                          | Définissez `acp.enabled=true`.                                                                                                                                                        |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`                         | La distribution automatique des messages de fils de discussion normaux est désactivée.                                 | Définissez `acp.dispatch.enabled=true` pour rétablir le routage automatique des fils ; les appels explicites à `sessions_spawn({ runtime: "acp" })` continuent de fonctionner.        |
| `ACP agent "<id>" is not allowed by policy`                                               | L’agent ne figure pas dans la liste d’autorisation.                                                                     | Utilisez un `agentId` autorisé ou mettez à jour `acp.allowedAgents`.                                                                                                                   |
| `/acp doctor` reports backend not ready right after startup                               | Le Plugin de backend est absent, désactivé, bloqué par la politique d’autorisation/refus, ou son exécutable configuré est indisponible. | Installez/activez le Plugin de backend, relancez `/acp doctor` et examinez l’erreur d’installation ou de politique du backend s’il reste défaillant.                                  |
| Commande du harnais introuvable                                                           | La CLI de l’adaptateur n’est pas installée, le Plugin externe est absent ou la récupération initiale via `npx` a échoué pour un adaptateur autre que Codex. | Exécutez `/acp doctor`, installez/préchauffez l’adaptateur sur l’hôte du Gateway ou configurez explicitement la commande de l’agent acpx.                                             |
| Modèle introuvable signalé par le harnais                                                 | L’identifiant du modèle est valide pour un autre fournisseur/harnais, mais pas pour cette cible ACP.                    | Utilisez un modèle répertorié par ce harnais, configurez-y le modèle ou omettez la substitution.                                                                                      |
| Erreur d’authentification du fournisseur signalée par le harnais                          | OpenClaw fonctionne correctement, mais la CLI ou le fournisseur cible n’est pas connecté.                               | Connectez-vous ou fournissez la clé de fournisseur requise dans l’environnement de l’hôte du Gateway.                                                                                |
| `Unable to resolve session target: ...`                                                   | Jeton de clé, d’identifiant ou de libellé incorrect.                                                                    | Exécutez `/acp sessions`, copiez la clé ou le libellé exact, puis réessayez.                                                                                                          |
| `--bind here requires running /acp spawn inside an active ... conversation`               | `--bind here` est utilisé sans conversation active pouvant être liée.                                                   | Accédez au chat/canal cible et réessayez, ou créez une session sans liaison.                                                                                                          |
| `Conversation bindings are unavailable for <channel>.`                                    | L’adaptateur ne prend pas en charge la liaison ACP à la conversation actuelle.                                          | Utilisez `/acp spawn ... --thread ...` lorsque cette option est prise en charge, configurez `bindings[]` au niveau supérieur ou passez à un canal compatible.                         |
| `--thread here requires running /acp spawn inside an active ... thread`                   | `--thread here` est utilisé hors du contexte d’un fil de discussion.                                                    | Accédez au fil cible ou utilisez `--thread auto`/`off`.                                                                                                                               |
| `Only <user-id> can rebind this channel/conversation/thread.`                             | Un autre utilisateur possède la cible de liaison active.                                                               | Refaites la liaison en tant que propriétaire ou utilisez une autre conversation ou un autre fil.                                                                                     |
| `Thread bindings are unavailable for <channel>.`                                          | L’adaptateur ne prend pas en charge la liaison aux fils de discussion.                                                  | Utilisez `--thread off` ou passez à un adaptateur/canal compatible.                                                                                                                   |
| `Sandboxed sessions cannot spawn ACP sessions ...`                                        | L’environnement d’exécution ACP fonctionne côté hôte ; la session à l’origine de la demande est isolée.                 | Utilisez `runtime="subagent"` depuis les sessions isolées ou lancez la création ACP depuis une session non isolée.                                                                    |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`                   | `sandbox="require"` est demandé pour l’environnement d’exécution ACP.                                                   | Utilisez `runtime="subagent"` lorsque l’isolation est obligatoire, ou utilisez ACP avec `sandbox="inherit"` depuis une session non isolée.                                            |
| `Cannot apply --model ... did not advertise model support`                                | Le harnais cible n’expose pas le changement générique de modèle ACP.                                                    | Utilisez un harnais qui annonce ACP `models`/`session/set_model`, utilisez les références de modèles ACP de Codex ou configurez directement le modèle dans le harnais s’il possède son propre indicateur de démarrage. |
| Métadonnées ACP absentes pour la session liée                                             | Métadonnées de session ACP obsolètes ou supprimées.                                                                     | Recréez la session avec `/acp spawn`, puis rétablissez la liaison ou le focus du fil.                                                                                                  |
| `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode` | `permissionMode` bloque les écritures/exécutions dans une session ACP non interactive.                                  | Définissez `plugins.entries.acpx.config.permissionMode` sur `approve-all` et redémarrez le Gateway. Consultez [Configuration des autorisations](/fr/tools/acp-agents-setup#permission-configuration). |
| La session ACP échoue prématurément avec peu de sortie                                    | Les demandes d’autorisation sont bloquées par `permissionMode`/`nonInteractivePermissions`.                             | Recherchez `AcpRuntimeError` dans les journaux du Gateway. Pour des autorisations complètes, définissez `permissionMode=approve-all` ; pour une dégradation progressive, définissez `nonInteractivePermissions=deny`. |
| La session ACP reste indéfiniment bloquée après la fin du travail                         | Le processus du harnais s’est terminé, mais la session ACP n’a pas signalé son achèvement.                              | Mettez OpenClaw à jour ; le nettoyage actuel d’acpx élimine à la fermeture et au démarrage du Gateway les processus d’encapsulation et d’adaptateur obsolètes appartenant à OpenClaw. |
| Le harnais voit `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                                   | L’enveloppe d’événement interne a traversé la frontière ACP par erreur.                                                  | Mettez OpenClaw à jour et relancez le flux d’achèvement ; les harnais externes ne doivent recevoir que des invites d’achèvement en texte brut.                                        |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable` relève du
relais de hooks natif de Codex, et non d’ACP/acpx. Dans un chat Codex lié, démarrez une
nouvelle session avec `/new` ou `/reset` ; si cela fonctionne une fois, puis que l’erreur réapparaît lors de
l’appel suivant à un outil natif, redémarrez le serveur d’application Codex ou le Gateway OpenClaw
au lieu de répéter `/new`. Consultez
[Dépannage du harnais Codex](/fr/plugins/codex-harness#troubleshooting).
</Note>

## Pages connexes

- [Agents ACP — configuration](/fr/tools/acp-agents-setup)
- [Envoi à un agent](/fr/tools/agent-send)
- [Backends CLI](/fr/gateway/cli-backends)
- [Harnais Codex](/fr/plugins/codex-harness)
- [Environnement d’exécution du harnais Codex](/fr/plugins/codex-harness-runtime)
- [Outils d’isolation multi-agents](/fr/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (mode pont)](/fr/cli/acp)
- [Sous-agents](/fr/tools/subagents)
