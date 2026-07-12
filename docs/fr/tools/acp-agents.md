---
read_when:
    - Exécution de harnais de codage via ACP
    - Configuration de sessions ACP liées à une conversation sur les canaux de messagerie
    - Lier une conversation d’un canal de messagerie à une session ACP persistante
    - Dépannage du backend ACP, de la configuration du Plugin ou de la remise des résultats à la fin de l’exécution
    - Utilisation des commandes /acp depuis le chat
sidebarTitle: ACP agents
summary: Exécutez des environnements externes de développement assisté (Claude Code, Cursor, Gemini CLI, Codex ACP explicite, OpenClaw ACP, OpenCode) via le backend ACP
title: Agents ACP
x-i18n:
    generated_at: "2026-07-12T15:51:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 68f5a5588710bea3027583bf06587706eb476d3ad1a31b0ef798586fcb895aa9
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) permet à
OpenClaw d’exécuter des environnements de codage externes (Claude Code, Cursor, Copilot, Droid,
OpenClaw ACP, OpenCode, Gemini CLI et d’autres environnements ACPX pris en charge)
via un plugin backend ACP. Chaque lancement est suivi en tant que
[tâche en arrière-plan](/fr/automation/tasks).

<Note>
**ACP est la voie des environnements externes, et non la voie Codex par défaut.** Le plugin
serveur d’application Codex natif gère les commandes `/codex ...` et l’environnement
intégré `openai/gpt-*` par défaut pour les tours d’agent ; ACP gère les commandes `/acp ...`
et les sessions `sessions_spawn({ runtime: "acp" })`.

Pour permettre à Codex ou Claude Code de se connecter directement en tant que client MCP externe
aux conversations existantes des canaux OpenClaw, utilisez
[`openclaw mcp serve`](/fr/cli/mcp) plutôt qu’ACP.
</Note>

## Quelle page me faut-il ?

| Vous souhaitez…                                                                                          | Utilisez                              | Remarques                                                                                                                                                                                              |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Lier ou contrôler Codex dans la conversation actuelle                                                    | `/codex bind`, `/codex threads`       | Voie du serveur d’application Codex natif lorsque le plugin `codex` est activé : réponses liées au chat, transfert d’images, modèle/rapidité/autorisations, arrêt et réorientation. ACP est un recours explicite |
| Exécuter Claude Code, Gemini CLI, Codex ACP explicitement ou un autre environnement externe _via_ OpenClaw | Cette page                            | Sessions liées au chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tâches en arrière-plan, commandes de l’environnement                                                                       |
| Exposer une session Gateway OpenClaw _comme_ serveur ACP pour un éditeur ou un client                    | [`openclaw acp`](/fr/cli/acp)            | Mode pont : un IDE/client communique avec OpenClaw via ACP sur stdio/WebSocket                                                                                                                          |
| Réutiliser une CLI d’IA locale comme modèle de secours en texte uniquement                               | [Backends CLI](/fr/gateway/cli-backends) | Ce n’est pas ACP : aucun outil OpenClaw, aucune commande ACP, aucun environnement d’exécution externe                                                                                                   |

## Cela fonctionne-t-il immédiatement ?

Oui, après l’installation du plugin officiel d’environnement ACP :

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Les dépôts sources peuvent utiliser le plugin d’espace de travail local `extensions/acpx` après
`pnpm install`. Exécutez `/acp doctor` pour vérifier que tout est prêt.

OpenClaw n’informe les agents de la possibilité de lancer ACP que lorsque celui-ci est **réellement utilisable** :
ACP doit être activé, la répartition ne doit pas être désactivée, la session actuelle ne doit
pas être bloquée par le bac à sable, et un backend d’exécution doit être chargé et opérationnel. Si
l’une de ces conditions échoue, les Skills ACP et les instructions ACP de `sessions_spawn` restent masquées
afin que l’agent ne suggère pas un backend indisponible.

<AccordionGroup>
  <Accordion title="Pièges lors de la première exécution">
    - Si `plugins.allow` est défini, il constitue un inventaire restrictif de plugins et **doit** inclure `acpx`, sinon le backend ACP installé est volontairement bloqué (`/acp doctor` signale l’entrée manquante dans la liste d’autorisation).
    - L’adaptateur Codex ACP est fourni avec le plugin `acpx` et se lance localement lorsque cela est possible.
    - Codex ACP s’exécute avec un `CODEX_HOME` isolé. OpenClaw copie les entrées de confiance des projets approuvés ainsi que la configuration sécurisée de routage du modèle/fournisseur (`model`, `model_provider`, `model_reasoning_effort`, `sandbox_mode` et les champs sûrs de `model_providers.<name>`) depuis la configuration Codex de l’hôte ; l’authentification, les notifications et les hooks restent uniquement dans la configuration de l’hôte.
    - Les adaptateurs d’autres environnements cibles peuvent être récupérés à la demande avec `npx` lors de la première utilisation.
    - L’authentification du fournisseur doit déjà exister sur l’hôte pour cet environnement.
    - Si l’hôte ne dispose pas de npm ou d’un accès réseau, les récupérations d’adaptateurs lors de la première exécution échouent jusqu’à ce que les caches soient préchargés ou que l’adaptateur soit installé autrement.

  </Accordion>
  <Accordion title="Prérequis de l’environnement d’exécution">
    ACP lance un véritable processus d’environnement externe. OpenClaw gère le routage,
    l’état des tâches en arrière-plan, la livraison, les liaisons et les règles ; l’environnement gère
    la connexion à son fournisseur, son catalogue de modèles, son comportement de système de fichiers et ses outils natifs.

    Avant de mettre OpenClaw en cause, vérifiez les points suivants :

    - `/acp doctor` signale un backend activé et opérationnel.
    - L’identifiant cible est autorisé par `acp.allowedAgents` lorsque cette liste d’autorisation est définie.
    - La commande de l’environnement peut démarrer sur l’hôte du Gateway.
    - L’authentification du fournisseur est présente pour cet environnement (`claude`, `codex`, `gemini`, `opencode`, `droid`, etc.).
    - Le modèle sélectionné existe pour cet environnement : les identifiants de modèle ne sont pas transférables entre les environnements.
    - Le `cwd` demandé existe et est accessible, ou omettez `cwd` et laissez le backend utiliser sa valeur par défaut.
    - Le mode d’autorisation correspond au travail. Les sessions non interactives ne peuvent pas répondre aux invites d’autorisation natives ; les exécutions de codage nécessitant beaucoup d’écritures ou d’exécutions requièrent donc généralement un profil d’autorisation ACPX capable de fonctionner sans intervention.

  </Accordion>
</AccordionGroup>

Les outils des plugins OpenClaw et les outils intégrés d’OpenClaw ne sont **pas** exposés par défaut aux
environnements ACP. Activez les ponts MCP explicites dans
[Agents ACP - configuration](/fr/tools/acp-agents-setup) uniquement lorsque l’environnement doit
appeler directement ces outils.

## Environnements cibles pris en charge

Avec le backend `acpx`, utilisez ces identifiants comme cibles de `/acp spawn <id>` ou de
`sessions_spawn({ runtime: "acp", agentId: "<id>" })` :

| Identifiant de l’environnement | Backend habituel                                   | Remarques                                                                                                  |
| ------------------------------ | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `claude`                       | Adaptateur ACP Claude Code                         | Nécessite l’authentification Claude Code sur l’hôte.                                                       |
| `codex`                        | Adaptateur Codex ACP                               | Recours ACP explicite uniquement lorsque `/codex` natif est indisponible ou qu’ACP est demandé.            |
| `copilot`                      | Adaptateur ACP GitHub Copilot                      | Nécessite l’authentification de la CLI ou de l’environnement Copilot.                                      |
| `cursor`                       | Cursor CLI ACP (`cursor-agent acp`)                | Remplacez la commande acpx si une installation locale expose un autre point d’entrée ACP.                  |
| `droid`                        | Factory Droid CLI                                  | Nécessite l’authentification Factory/Droid ou `FACTORY_API_KEY` dans l’environnement de l’outil externe.   |
| `fast-agent`                   | Adaptateur ACP fast-agent-mcp                      | Récupéré à la demande avec `uvx`.                                                                          |
| `gemini`                       | Adaptateur ACP Gemini CLI                          | Nécessite l’authentification Gemini CLI ou la configuration d’une clé API.                                 |
| `iflow`                        | iFlow CLI                                          | La disponibilité de l’adaptateur et le contrôle du modèle dépendent de la CLI installée.                   |
| `kilocode`                     | Kilo Code CLI                                      | La disponibilité de l’adaptateur et le contrôle du modèle dépendent de la CLI installée.                   |
| `kimi`                         | Kimi/Moonshot CLI                                  | Nécessite l’authentification Kimi/Moonshot sur l’hôte.                                                     |
| `kiro`                         | Kiro CLI                                           | La disponibilité de l’adaptateur et le contrôle du modèle dépendent de la CLI installée.                   |
| `mux`                          | Adaptateur Mux CLI ACP                             | Récupéré à la demande avec `npx`.                                                                          |
| `opencode`                     | Adaptateur OpenCode ACP                            | Nécessite l’authentification de la CLI ou du fournisseur OpenCode.                                         |
| `openclaw`                     | Pont Gateway OpenClaw via `openclaw acp`           | Permet à un environnement compatible ACP de communiquer avec une session Gateway OpenClaw.                 |
| `qoder`                        | Qoder CLI                                          | La disponibilité de l’adaptateur et le contrôle du modèle dépendent de la CLI installée.                   |
| `qwen`                         | Qwen Code / Qwen CLI                               | Nécessite une authentification compatible avec Qwen sur l’hôte.                                            |
| `trae`                         | Adaptateur Trae CLI ACP                            | La disponibilité de l’adaptateur et le contrôle du modèle dépendent de la CLI installée.                   |

`pi` (pi-acp) est également enregistré dans le backend acpx, mais ce n’est pas un environnement
de codage au même titre que ceux présentés ci-dessus.

Des alias personnalisés d’agents acpx peuvent être configurés dans acpx lui-même, mais les règles
OpenClaw vérifient toujours `acp.allowedAgents` et toute correspondance
`agents.list[].runtime.acp.agent` avant la répartition.

## Guide opérationnel

Flux `/acp` rapide depuis le chat :

<Steps>
  <Step title="Lancer">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`, ou explicitement
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Travailler">
    Continuez dans la conversation ou le fil lié (ou ciblez explicitement la clé de session).
  </Step>
  <Step title="Vérifier l’état">
    `/acp status`
  </Step>
  <Step title="Ajuster">
    `/acp model <provider/model>`, `/acp permissions <profile>`,
    `/acp timeout <seconds>`.
  </Step>
  <Step title="Réorienter">
    Sans remplacer le contexte : `/acp steer tighten logging and continue`.
  </Step>
  <Step title="Arrêter">
    `/acp cancel` (tour actuel) ou `/acp close` (session + liaisons).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Détails du cycle de vie">
    - Le lancement crée ou reprend une session d’environnement ACP, enregistre les métadonnées ACP dans le stockage de sessions OpenClaw et peut créer une tâche en arrière-plan lorsque l’exécution appartient à une tâche parente.
    - Les sessions ACP appartenant à une tâche parente sont traitées comme du travail en arrière-plan, même lorsque la session d’exécution est persistante ; l’achèvement et la livraison entre surfaces passent par le mécanisme de notification de la tâche parente au lieu de se comporter comme une session de chat normale visible par l’utilisateur.
    - La maintenance des tâches ferme les sessions ACP ponctuelles terminales ou orphelines appartenant à une tâche parente. Les sessions ACP persistantes sont conservées tant qu’une liaison de conversation active demeure ; les sessions persistantes obsolètes sans liaison active sont fermées afin qu’elles ne puissent pas être reprises silencieusement une fois la tâche propriétaire terminée ou son enregistrement supprimé.
    - Les messages de suivi liés sont envoyés directement à la session ACP jusqu’à ce que la liaison soit fermée, perde le focus, soit réinitialisée ou expire.
    - Les commandes du Gateway restent locales. `/acp ...`, `/status` et `/unfocus` ne sont jamais envoyées comme texte d’invite normal à un environnement ACP lié.
    - `cancel` interrompt le tour actif lorsque le backend prend en charge l’annulation ; il ne supprime ni la liaison ni les métadonnées de session.
    - `close` met fin à la session ACP du point de vue d’OpenClaw et supprime la liaison. Un environnement peut néanmoins conserver son propre historique en amont s’il prend en charge la reprise.
    - Le plugin acpx nettoie les arborescences de processus d’enveloppe et d’adaptateur appartenant à OpenClaw après `close`, et élimine les processus ACPX orphelins et obsolètes appartenant à OpenClaw lors du démarrage du Gateway.
    - Les workers d’exécution inactifs peuvent être nettoyés après `acp.runtime.ttlMinutes` ; les métadonnées de session stockées restent disponibles pour `/acp sessions`.

  </Accordion>
  <Accordion title="Règles de routage Codex natif">
    Déclencheurs en langage naturel qui doivent être acheminés vers le **plugin Codex natif**
    lorsqu’il est activé :

    - « Lier ce canal Discord à Codex. »
    - « Associer ce chat au fil Codex `<id>`. »
    - « Afficher les fils Codex, puis lier celui-ci. »

    La liaison native des conversations Codex est le chemin de contrôle de chat par défaut.
    Les outils dynamiques OpenClaw continuent de s’exécuter via OpenClaw, tandis que les outils
    natifs de Codex, tels que shell/apply-patch, s’exécutent dans Codex. Pour les événements
    d’outils natifs de Codex, OpenClaw injecte à chaque tour un relais de hooks natifs afin que
    les hooks de Plugin puissent bloquer `before_tool_call`, observer `after_tool_call` et acheminer
    les événements `PermissionRequest` de Codex via les approbations OpenClaw. Les hooks `Stop`
    de Codex sont relayés vers `before_agent_finalize` d’OpenClaw, où les plugins peuvent demander
    un passage supplémentaire du modèle avant que Codex ne finalise sa réponse. Le relais reste
    délibérément prudent : il ne modifie pas les arguments des outils natifs de Codex et ne réécrit
    pas les enregistrements de fils Codex. Utilisez explicitement ACP uniquement lorsque vous
    souhaitez le modèle d’exécution et de session ACP. Le périmètre de prise en charge de Codex
    intégré est documenté dans le
    [contrat de prise en charge v1 du harness Codex](/fr/plugins/codex-harness-runtime#v1-support-contract).

  </Accordion>
  <Accordion title="Aide-mémoire pour la sélection du modèle, du fournisseur et du runtime">
    - anciennes références de modèles Codex - ancienne route de modèle OAuth/abonnement Codex réparée par doctor.
    - `openai/*` - runtime intégré natif de l’app-server Codex pour les tours d’agent OpenAI.
    - `/codex ...` - contrôle natif des conversations Codex.
    - `/acp ...` ou `runtime: "acp"` - contrôle ACP/acpx explicite.

  </Accordion>
  <Accordion title="Déclencheurs en langage naturel pour le routage ACP">
    Déclencheurs qui doivent acheminer vers le runtime ACP :

    - « Exécutez ceci comme une session ACP Claude Code ponctuelle et résumez le résultat. »
    - « Utilisez Gemini CLI pour cette tâche dans un fil, puis conservez les suivis dans ce même fil. »
    - « Exécutez Codex via ACP dans un fil en arrière-plan. »

    OpenClaw choisit `runtime: "acp"`, résout l’`agentId` du harness, établit la liaison avec
    la conversation ou le fil actuel lorsque cela est pris en charge, puis achemine les suivis
    vers cette session jusqu’à sa fermeture ou son expiration. Codex ne suit ce chemin que
    lorsque ACP/acpx est explicite ou que le Plugin Codex natif n’est pas disponible pour
    l’opération demandée.

    Pour `sessions_spawn`, `runtime: "acp"` n’est annoncé que lorsque ACP est
    activé, que le demandeur n’est pas placé dans un bac à sable et qu’un backend
    de runtime ACP est chargé. `acp.dispatch.enabled=false` suspend la distribution
    automatique des fils ACP, mais ne masque ni ne bloque les appels explicites
    `sessions_spawn({ runtime: "acp" })`. Il cible des identifiants de harness ACP
    tels que `codex`, `claude`, `droid`, `gemini` ou `opencode`. Ne transmettez pas
    un identifiant d’agent de configuration OpenClaw normal provenant de `agents_list`,
    sauf si cette entrée est explicitement configurée avec
    `agents.list[].runtime.type="acp"` ; sinon, utilisez le runtime de sous-agent
    par défaut. Lorsqu’un agent OpenClaw est configuré avec
    `runtime.type="acp"`, OpenClaw utilise `runtime.acp.agent` comme identifiant
    de harness sous-jacent.

  </Accordion>
</AccordionGroup>

## ACP ou sous-agents

Utilisez ACP lorsque vous souhaitez un runtime de harness externe. Utilisez
l’**app-server Codex natif** pour la liaison et le contrôle des conversations
Codex lorsque le Plugin `codex` est activé. Utilisez des **sous-agents** lorsque
vous souhaitez des exécutions déléguées natives d’OpenClaw.

| Domaine             | Session ACP                              | Exécution de sous-agent                   |
| ------------------- | ---------------------------------------- | ----------------------------------------- |
| Runtime             | Plugin de backend ACP (par exemple acpx) | Runtime de sous-agent natif d’OpenClaw    |
| Clé de session      | `agent:<agentId>:acp:<uuid>`             | `agent:<agentId>:subagent:<uuid>`         |
| Commandes principales | `/acp ...`                              | `/subagents ...`                          |
| Outil de création   | `sessions_spawn` avec `runtime:"acp"`    | `sessions_spawn` (runtime par défaut)     |

Voir aussi [Sous-agents](/fr/tools/subagents).

## Fonctionnement de Claude Code avec ACP

Pour Claude Code via ACP, la pile est la suivante :

1. Plan de contrôle des sessions ACP d’OpenClaw.
2. Plugin de runtime officiel `@openclaw/acpx`.
3. Adaptateur ACP de Claude.
4. Mécanismes de runtime et de session côté Claude.

ACP Claude est une **session de harness** dotée de contrôles ACP, de reprise
de session, de suivi des tâches en arrière-plan et d’une liaison facultative
aux conversations ou aux fils.

Les backends CLI sont des runtimes de secours locaux distincts, uniquement
textuels — consultez [Backends CLI](/fr/gateway/cli-backends).

Pour les opérateurs, la règle pratique est la suivante :

- **Vous souhaitez `/acp spawn`, des sessions pouvant être liées, des contrôles de runtime ou un travail persistant dans le harness ?** Utilisez ACP.
- **Vous souhaitez un simple mécanisme de secours textuel local via la CLI brute ?** Utilisez les backends CLI.

## Sessions liées

### Modèle mental

- **Surface de chat** — l’endroit où les personnes poursuivent la conversation (canal Discord, sujet Telegram, conversation iMessage).
- **Session ACP** — l’état durable du runtime Codex/Claude/Gemini vers lequel OpenClaw effectue le routage.
- **Fil/sujet enfant** — une surface de messagerie supplémentaire facultative créée uniquement par `--thread ...`.
- **Espace de travail du runtime** — l’emplacement du système de fichiers (`cwd`, extraction du dépôt, espace de travail du backend) où le harness s’exécute. Indépendant de la surface de chat.

### Liaisons à la conversation actuelle

`/acp spawn <harness> --bind here` épingle la conversation actuelle à la
session ACP créée — aucun fil enfant, même surface de chat. OpenClaw conserve
la responsabilité du transport, de l’authentification, de la sécurité et de
la livraison. Les messages de suivi dans cette conversation sont acheminés
vers la même session ; `/new` et `/reset` réinitialisent la session sur place ;
`/acp close` supprime la liaison.

Exemples :

```text
/codex bind                                              # liaison Codex native, acheminer ici les futurs messages
/codex model gpt-5.4                                     # ajuster le fil Codex natif lié
/codex stop                                              # contrôler le tour Codex natif actif
/acp spawn codex --bind here                             # mécanisme de secours ACP explicite pour Codex
/acp spawn codex --thread auto                           # peut créer un fil/sujet enfant et établir la liaison dans celui-ci
/acp spawn codex --bind here --cwd /workspace/repo       # même liaison de chat, Codex s’exécute dans /workspace/repo
```

<AccordionGroup>
  <Accordion title="Règles de liaison et exclusivité">
    - `--bind here` et `--thread ...` s’excluent mutuellement.
    - `--bind here` ne fonctionne que sur les canaux qui annoncent la prise en charge de la liaison à la conversation actuelle ; sinon, OpenClaw renvoie un message clair indiquant que cette fonctionnalité n’est pas prise en charge. Les liaisons persistent après les redémarrages du Gateway.
    - Sur Discord, `spawnSessions` contrôle la création de fils enfants pour `--thread auto|here`, mais pas pour `--bind here`.
    - Si vous créez une session pour un autre agent ACP sans `--cwd`, OpenClaw hérite par défaut de l’espace de travail de l’**agent cible**. Les chemins hérités manquants (`ENOENT`/`ENOTDIR`) entraînent un retour à la valeur par défaut du backend ; les autres erreurs d’accès (par exemple `EACCES`) sont signalées comme des erreurs de création.
    - Les commandes de gestion du Gateway restent locales dans les conversations liées : les commandes `/acp ...` sont gérées par OpenClaw même lorsque le texte de suivi normal est acheminé vers la session ACP liée ; `/status` et `/unfocus` restent également locales chaque fois que la gestion des commandes est activée pour cette surface.

  </Accordion>
  <Accordion title="Sessions liées à un fil">
    Lorsque les liaisons de fils sont activées pour un adaptateur de canal :

    - OpenClaw lie un fil à une session ACP cible.
    - Les messages de suivi dans ce fil sont acheminés vers la session ACP liée.
    - La sortie ACP est renvoyée dans le même fil.
    - La suppression du focus, la fermeture, l’archivage, l’expiration pour inactivité ou l’expiration de l’âge maximal supprime la liaison.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` et `/unfocus` sont des commandes du Gateway, et non des invites destinées au harness ACP.

    Indicateurs de fonctionnalité requis pour ACP lié à un fil :

    - `acp.enabled=true`
    - `acp.dispatch.enabled` est activé par défaut (définissez-le sur `false` pour suspendre la distribution automatique des fils ACP ; les appels explicites `sessions_spawn({ runtime: "acp" })` continuent de fonctionner).
    - Création de sessions de fils activée pour l’adaptateur de canal (valeur par défaut : `true`) :
      - Discord : `channels.discord.threadBindings.spawnSessions=true`
      - Telegram : `channels.telegram.threadBindings.spawnSessions=true`

    La prise en charge des liaisons de fils dépend de l’adaptateur. Si
    l’adaptateur de canal actif ne prend pas en charge ces liaisons, OpenClaw
    renvoie un message clair indiquant qu’elles ne sont pas prises en charge
    ou disponibles.

  </Accordion>
  <Accordion title="Canaux prenant en charge les fils">
    - Tout adaptateur de canal qui expose une capacité de liaison de session ou de fil.
    - Prise en charge intégrée actuelle : fils/canaux **Discord**, sujets **Telegram** (sujets de forum dans les groupes/supergroupes et sujets de messages privés).
    - Les canaux de Plugin peuvent ajouter cette prise en charge via la même interface de liaison.

  </Accordion>
</AccordionGroup>

## Liaisons persistantes de canaux

Pour les workflows non éphémères, configurez des liaisons ACP persistantes
dans les entrées `bindings[]` de niveau supérieur.

### Modèle de liaison

<ParamField path="bindings[].type" type='"acp"'>
  Marque une liaison persistante de conversation ACP.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Identifie la conversation cible. Formes propres à chaque canal :

- **Canal/fil Discord :** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Canal/message privé Slack :** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`. Privilégiez les identifiants Slack stables ; les liaisons de canaux correspondent également aux réponses dans les fils de ce canal.
- **Sujet de forum Telegram :** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **Message privé/groupe WhatsApp :** `match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"`. Utilisez des numéros E.164 tels que `+15555550123` pour les conversations directes et des JID de groupes WhatsApp tels que `120363424282127706@g.us` pour les groupes.
- **Message privé/groupe iMessage :** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Privilégiez `chat_id:*` pour des liaisons de groupes stables.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  L’identifiant de l’agent OpenClaw propriétaire.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  Remplacement ACP facultatif.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  Libellé facultatif destiné à l’opérateur.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  Répertoire de travail facultatif du runtime.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  Remplacement facultatif du backend.
</ParamField>

### Valeurs par défaut du runtime par agent

Utilisez `agents.list[].runtime` pour définir une fois les valeurs par défaut
ACP de chaque agent :

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (identifiant du harness, par exemple `codex` ou `claude`)
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

- OpenClaw vérifie que la session ACP configurée existe après l'admission propre au canal et avant son utilisation.
- Les messages de ce canal, sujet ou chat sont acheminés vers la session ACP configurée.
- Les liaisons ACP configurées sont propriétaires de la route de leur session. La diffusion en éventail du canal ne remplace pas la session ACP configurée pour une liaison correspondante.
- Dans les conversations liées, `/new` et `/reset` réinitialisent sur place la même clé de session ACP.
- Les liaisons d'exécution temporaires (par exemple, celles créées par les flux de focalisation sur un fil) continuent de s'appliquer lorsqu'elles sont présentes.
- Pour les lancements ACP inter-agents sans `cwd` explicite, OpenClaw hérite de l'espace de travail de l'agent cible depuis la configuration de l'agent.
- Les chemins d'espace de travail hérités manquants reviennent au répertoire de travail par défaut du backend ; les échecs d'accès à des chemins existants sont signalés comme des erreurs de lancement.

## Démarrer des sessions ACP

Deux façons de démarrer une session ACP :

<Tabs>
  <Tab title="Depuis sessions_spawn">
    Utilisez `runtime: "acp"` pour démarrer une session ACP depuis un tour
    d'agent ou un appel d'outil.

    ```json
    {
      "task": "Ouvrir le dépôt et résumer les tests en échec",
      "runtime": "acp",
      "agentId": "codex",
      "thread": true,
      "mode": "session"
    }
    ```

    <Note>
    La valeur par défaut de `runtime` est `subagent` ; définissez donc
    explicitement `runtime: "acp"` pour les sessions ACP. Si `agentId` est
    omis, OpenClaw utilise `acp.defaultAgent` lorsqu'il est configuré.
    `mode: "session"` nécessite `thread: true` afin de conserver une
    conversation liée persistante.
    </Note>

  </Tab>
  <Tab title="Depuis la commande /acp">
    Utilisez `/acp spawn` pour permettre à l'opérateur d'exercer un contrôle
    explicite depuis le chat.

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

    Consultez [Commandes à barre oblique](/fr/tools/slash-commands).

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
  Identifiant du harnais ACP cible. Revient à `acp.defaultAgent` s'il est défini.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Demande le flux de liaison à un fil lorsque celui-ci est pris en charge.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` est ponctuel ; `"session"` est persistant. Si `thread: true` et que
  `mode` est omis, OpenClaw peut adopter par défaut un comportement persistant
  selon le chemin d'exécution. `mode: "session"` nécessite `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Répertoire de travail demandé pour l'exécution (validé par la politique du
  backend ou de l'environnement d'exécution). S'il est omis, le lancement ACP
  hérite de l'espace de travail de l'agent cible lorsqu'il est configuré ; les
  chemins hérités manquants reviennent aux valeurs par défaut du backend,
  tandis que les véritables erreurs d'accès sont renvoyées.
</ParamField>
<ParamField path="label" type="string">
  Libellé destiné à l'opérateur, utilisé dans le texte de session ou de bannière.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Reprend une session ACP existante au lieu d'en créer une nouvelle. L'agent
  rejoue l'historique de sa conversation via `session/load`. Nécessite
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` retransmet les résumés de progression de l'exécution ACP initiale
  à la session demandeuse sous forme d'événements système. Les réponses
  acceptées incluent `streamLogPath`, qui pointe vers un journal JSONL limité
  à la session (`<sessionId>.acp-stream.jsonl`) que vous pouvez suivre pour
  obtenir l'historique complet du relais. Par défaut, les flux de progression
  destinés au parent affichent les commentaires de l'assistant et la
  progression de l'état ACP, sauf si `streaming.progress.commentary=false`.
  Discord utilise également par défaut le mode progression pour les aperçus
  destinés au parent lorsqu'aucun mode de flux n'est configuré. La progression
  de l'état respecte toujours `acp.stream.tagVisibility` ; les balises telles
  que `plan` restent donc masquées sauf si elles sont explicitement activées.
</ParamField>

Les exécutions ACP de `sessions_spawn` utilisent
`agents.defaults.subagents.runTimeoutSeconds` comme limite par défaut du tour
enfant. L'outil n'accepte pas de remplacement du délai par appel
(`runTimeoutSeconds`/`timeoutSeconds` sont rejetés avec une erreur indiquant
de configurer la valeur par défaut).

<ParamField path="model" type="string">
  Remplacement explicite du modèle pour la session ACP enfant. Les lancements
  ACP Codex normalisent les références OpenAI telles que `openai/gpt-5.4` en
  configuration de démarrage ACP Codex avant `session/new` ; les formes avec
  barre oblique telles que `openai/gpt-5.4/high` définissent également l'effort
  de raisonnement ACP Codex. Lorsque ce paramètre est omis,
  `sessions_spawn({ runtime: "acp" })` utilise les valeurs par défaut existantes
  du modèle des sous-agents (`agents.defaults.subagents.model` ou
  `agents.list[].subagents.model`) lorsqu'elles sont configurées ; sinon, il
  laisse le harnais ACP utiliser son propre modèle par défaut. Les autres
  harnais doivent annoncer les `models` ACP et prendre en charge
  `session/set_model` ; dans le cas contraire, OpenClaw/acpx échoue clairement
  au lieu de revenir silencieusement au modèle par défaut de l'agent cible.
</ParamField>
<ParamField path="thinking" type="string">
  Effort explicite de réflexion ou de raisonnement. Pour ACP Codex, `minimal`
  correspond à un effort faible, `low`/`medium`/`high`/`xhigh` correspondent
  directement aux niveaux associés et `off` omet le remplacement de l'effort
  de raisonnement au démarrage. Lorsque ce paramètre est omis, les lancements
  ACP utilisent les valeurs de réflexion par défaut existantes des sous-agents
  ainsi que `agents.defaults.models["provider/model"].params.thinking` pour le
  modèle sélectionné.
</ParamField>

## Modes de liaison et de fil lors du lancement

<Tabs>
  <Tab title="--bind here|off">
    | Mode   | Comportement                                                                    |
    | ------ | ------------------------------------------------------------------------------- |
    | `here` | Lie sur place la conversation active actuelle ; échoue si aucune n'est active. |
    | `off`  | Ne crée pas de liaison avec la conversation actuelle.                          |

    Remarques :

    - `--bind here` est le moyen le plus simple pour l'opérateur de « faire prendre en charge ce canal ou ce chat par Codex ».
    - `--bind here` ne crée pas de fil enfant.
    - `--bind here` est uniquement disponible sur les canaux qui prennent en charge la liaison à la conversation actuelle.
    - `--bind` et `--thread` ne peuvent pas être combinés dans le même appel `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Mode   | Comportement                                                                                                   |
    | ------ | -------------------------------------------------------------------------------------------------------------- |
    | `auto` | Dans un fil actif : lie ce fil. Hors d'un fil : crée et lie un fil enfant lorsque cette fonction est prise en charge. |
    | `here` | Exige un fil actif actuel ; échoue si aucun fil n'est actif.                                                   |
    | `off`  | Aucune liaison. La session démarre sans liaison.                                                               |

    Remarques :

    - Sur les surfaces de liaison sans fil, le comportement par défaut équivaut en pratique à `off`.
    - Le lancement lié à un fil nécessite la prise en charge par la politique du canal :
      - Discord : `channels.discord.threadBindings.spawnSessions=true`
      - Telegram : `channels.telegram.threadBindings.spawnSessions=true`
    - Utilisez `--bind here` lorsque vous souhaitez épingler la conversation actuelle sans créer de fil enfant.

  </Tab>
</Tabs>

## Modèle de remise

Les sessions ACP peuvent être des espaces de travail interactifs ou des
tâches en arrière-plan appartenant au parent. Le chemin de remise dépend de
cette forme.

<AccordionGroup>
  <Accordion title="Sessions ACP interactives">
    Les sessions interactives sont conçues pour poursuivre la conversation sur
    une surface de chat visible :

    - `/acp spawn ... --bind here` lie la conversation actuelle à la session ACP.
    - `/acp spawn ... --thread ...` lie un fil ou sujet de canal à la session ACP.
    - Les `bindings[].type="acp"` configurées de façon persistante acheminent les conversations correspondantes vers la même session ACP.

    Les messages suivants dans la conversation liée sont acheminés directement
    vers la session ACP, et la sortie ACP est renvoyée au même
    canal, fil ou sujet.

    Ce qu'OpenClaw envoie au harnais :

    - Les suivis liés normaux sont envoyés sous forme de texte d'invite, avec les pièces jointes uniquement lorsque le harnais ou le backend les prend en charge.
    - Les commandes de gestion `/acp` et les commandes locales du Gateway sont interceptées avant l'envoi à ACP.
    - Les événements d'achèvement générés par l'environnement d'exécution sont matérialisés pour chaque cible. Les agents OpenClaw reçoivent l'enveloppe de contexte d'exécution interne d'OpenClaw ; les harnais ACP externes reçoivent une invite simple contenant le résultat de l'enfant et l'instruction. L'enveloppe brute `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` ne doit jamais être envoyée à des harnais externes ni conservée comme texte de transcription utilisateur ACP.
    - Les entrées de transcription ACP utilisent le texte déclencheur visible par l'utilisateur ou l'invite d'achèvement simple. Les métadonnées d'événement internes restent structurées dans OpenClaw lorsque cela est possible et ne sont pas traitées comme du contenu de chat rédigé par l'utilisateur.

  </Accordion>
  <Accordion title="Sessions ACP ponctuelles appartenant au parent">
    Les sessions ACP ponctuelles lancées par l'exécution d'un autre agent sont
    des enfants en arrière-plan, semblables aux sous-agents :

    - Le parent demande l'exécution d'une tâche avec `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - L'enfant s'exécute dans sa propre session de harnais ACP.
    - Les tours enfants s'exécutent sur la même voie d'arrière-plan que les lancements de sous-agents natifs, de sorte qu'un harnais ACP lent ne bloque pas les tâches sans rapport de la session principale.
    - L'achèvement est signalé par le chemin d'annonce d'achèvement de la tâche. OpenClaw convertit les métadonnées d'achèvement internes en une invite ACP simple avant de l'envoyer à un harnais externe, de sorte que les harnais ne voient pas les marqueurs de contexte d'exécution propres à OpenClaw.
    - Le parent reformule le résultat de l'enfant dans la voix habituelle de l'assistant lorsqu'une réponse destinée à l'utilisateur est utile.

    Ne traitez **pas** ce chemin comme un chat pair à pair entre le parent et
    l'enfant. L'enfant dispose déjà d'un canal d'achèvement vers le parent.

  </Accordion>
  <Accordion title="sessions_send et remise A2A">
    `sessions_send` peut cibler une autre session après le lancement. Pour les
    sessions homologues normales, OpenClaw utilise un chemin de suivi
    agent-à-agent (A2A) après avoir injecté le message :

    - Attendez la réponse de la session cible.
    - Autorisez éventuellement le demandeur et la cible à échanger un nombre limité de tours de suivi.
    - Demandez à la cible de produire un message d'annonce.
    - Remettez cette annonce au canal ou au fil visible.

    Ce chemin A2A est une solution de repli pour les envois entre pairs lorsque l’expéditeur a besoin d’un
    suivi visible. Il reste activé lorsqu’une session sans lien peut voir une cible ACP et
    lui envoyer des messages, par exemple avec des paramètres généraux de `tools.sessions.visibility`.

    OpenClaw ignore le suivi A2A uniquement lorsque le demandeur est le parent de
    son propre enfant ACP ponctuel détenu par le parent. Dans ce cas, exécuter A2A en plus
    de l’achèvement de la tâche peut réveiller le parent avec le résultat de l’enfant, retransmettre
    la réponse du parent à l’enfant et créer une boucle d’écho
    parent/enfant. Le résultat de `sessions_send` indique `delivery.status="skipped"` pour
    ce cas d’enfant détenu, car le chemin d’achèvement est déjà responsable
    du résultat.

  </Accordion>
  <Accordion title="Reprendre une session existante">
    Utilisez `resumeSessionId` pour poursuivre une session ACP précédente au lieu d’en
    démarrer une nouvelle. L’agent relit l’historique de sa conversation via
    `session/load`, ce qui lui permet de reprendre avec tout le contexte antérieur.

    ```json
    {
      "task": "Reprendre là où nous nous sommes arrêtés - corriger les échecs de tests restants",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Cas d’usage courants :

    - Transférez une session Codex de votre ordinateur portable à votre téléphone : demandez à votre agent de reprendre là où vous vous êtes arrêté.
    - Poursuivez via votre agent, en mode non interactif, une session de programmation que vous avez démarrée de manière interactive dans la CLI.
    - Reprenez un travail interrompu par un redémarrage du Gateway ou un délai d’inactivité.

    Remarques :

    - `resumeSessionId` ne s’applique que lorsque `runtime: "acp"` ; le runtime de sous-agent par défaut ignore ce champ propre à ACP.
    - `streamTo` ne s’applique que lorsque `runtime: "acp"` ; le runtime de sous-agent par défaut ignore ce champ propre à ACP.
    - `resumeSessionId` est un identifiant de reprise ACP/du banc d’essai local à l’hôte, et non une clé de session de canal OpenClaw ; OpenClaw vérifie toujours la politique de lancement ACP et celle de l’agent cible avant l’envoi, tandis que le backend ACP ou le banc d’essai gère l’autorisation de charger cet identifiant en amont.
    - `resumeSessionId` restaure l’historique de conversation ACP en amont ; `thread` et `mode` continuent de s’appliquer normalement à la nouvelle session OpenClaw que vous créez. Ainsi, `mode: "session"` nécessite toujours `thread: true`.
    - L’agent cible doit prendre en charge `session/load` (Codex et Claude Code le font).
    - Si l’identifiant de session est introuvable, le lancement échoue avec une erreur explicite, sans repli silencieux vers une nouvelle session.

  </Accordion>
  <Accordion title="Test de bon fonctionnement après le déploiement">
    Après le déploiement d’un Gateway, effectuez une vérification de bout en bout en conditions réelles plutôt que de vous fier
    aux tests unitaires :

    1. Vérifiez la version et le commit du Gateway déployé sur l’hôte cible.
    2. Ouvrez une session de pont ACPX temporaire vers un agent actif.
    3. Demandez à cet agent d’appeler `sessions_spawn` avec `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` et la tâche `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Vérifiez `accepted=yes`, une véritable valeur `childSessionKey` et l’absence d’erreur de validation.
    5. Fermez la session de pont temporaire.

    Limitez la validation à `mode: "run"` et ignorez `streamTo: "parent"` :
    les chemins liés à un fil avec `mode: "session"` et ceux de relais de flux constituent des
    vérifications d’intégration distinctes et plus complètes.

  </Accordion>
</AccordionGroup>

## Compatibilité avec le bac à sable

Les sessions ACP s’exécutent actuellement dans l’environnement d’exécution de l’hôte, **et non** dans le bac à sable
d’OpenClaw.

<Warning>
**Périmètre de sécurité :**

- Le harnais externe peut lire et écrire conformément à ses propres autorisations de CLI et au `cwd` sélectionné.
- La politique de bac à sable d’OpenClaw **n’encadre pas** l’exécution du harnais ACP.
- OpenClaw applique toujours les contrôles d’activation ACP, les agents autorisés, la propriété des sessions, les liaisons de canaux et la politique de livraison du Gateway.
- Utilisez `runtime: "subagent"` pour les tâches natives d’OpenClaw soumises aux règles du bac à sable.

</Warning>

Limitations actuelles :

- Si la session du demandeur est mise en bac à sable, les lancements ACP sont bloqués à la fois pour `sessions_spawn({ runtime: "acp" })` et `/acp spawn`.
- `sessions_spawn` avec `runtime: "acp"` ne prend pas en charge `sandbox: "require"`.

## Résolution de la session cible

La plupart des actions `/acp` acceptent une cible de session facultative (`session-key`,
`session-id` ou `session-label`).

**Ordre de résolution :**

1. Argument de cible explicite (ou `--session` pour `/acp steer`)
   - essaie la clé
   - puis l’identifiant de session au format UUID
   - puis le libellé
2. Liaison du fil de discussion actuel (si cette conversation/ce fil est lié à une session ACP).
3. Repli sur la session actuelle du demandeur.

Les liaisons de la conversation actuelle et celles du fil de discussion participent toutes deux à l’étape 2.

Si aucune cible ne peut être résolue, OpenClaw renvoie une erreur claire
(`Unable to resolve session target: ...`).

## Commandes ACP

| Commande             | Fonction                                                  | Exemple                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Crée une session ACP ; liaison facultative à la conversation actuelle ou au fil. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Annule le tour en cours pour la session cible.            | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Envoie une instruction d’orientation à la session en cours. | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Ferme la session et dissocie les cibles du fil.           | `/acp close`                                                  |
| `/acp status`        | Affiche le backend, le mode, l’état, les options d’exécution et les capacités. | `/acp status`                                                 |
| `/acp set-mode`      | Définit le mode d’exécution de la session cible.          | `/acp set-mode plan`                                          |
| `/acp set`           | Écrit une option générique de configuration d’exécution.  | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Définit le remplacement du répertoire de travail d’exécution. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Définit le profil de politique d’approbation.             | `/acp permissions strict`                                     |
| `/acp timeout`       | Définit le délai d’expiration de l’exécution (secondes).  | `/acp timeout 120`                                            |
| `/acp model`         | Définit le remplacement du modèle d’exécution.            | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Supprime les remplacements d’options d’exécution de la session. | `/acp reset-options`                                          |
| `/acp sessions`      | Répertorie les sessions ACP récentes du stockage.         | `/acp sessions`                                               |
| `/acp doctor`        | Affiche l’état du backend, ses capacités et les correctifs applicables. | `/acp doctor`                                                 |
| `/acp install`       | Affiche les étapes déterministes d’installation et d’activation. | `/acp install`                                                |

Les commandes d’exécution (`spawn`, `cancel`, `steer`, `close`, `status`, `set-mode`,
`set`, `cwd`, `permissions`, `timeout`, `model` et `reset-options`) nécessitent
l’identité du propriétaire depuis les canaux externes et `operator.admin` depuis les clients
Gateway internes. Les expéditeurs autorisés qui ne sont pas propriétaires peuvent toujours utiliser `sessions`,
`doctor`, `install` et `help`.

`/acp status` affiche les options d’exécution effectives ainsi que les identifiants
de session au niveau de l’exécution et du backend. Les erreurs de commande non prise en charge sont
clairement signalées lorsqu’un backend ne dispose pas d’une capacité. `/acp sessions` lit le stockage
pour la session actuellement liée ou celle du demandeur ; les jetons de cible (`session-key`,
`session-id` ou `session-label`) sont résolus par la découverte des sessions du Gateway,
y compris les racines `session.store` personnalisées propres à chaque agent.

### Correspondance des options d’exécution

`/acp` propose des commandes pratiques et un mécanisme de définition générique. Opérations équivalentes :

| Commande                     | Correspond à                         | Remarques                                                                                                                                                                                                  |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | clé de configuration d’exécution `model` | Pour Codex ACP, OpenClaw normalise `openai/<model>` en identifiant de modèle de l’adaptateur et associe les suffixes de raisonnement séparés par une barre oblique, tels que `openai/gpt-5.4/high`, à `reasoning_effort`. |
| `/acp set thinking <level>`  | option canonique `thinking`          | OpenClaw envoie l’équivalent annoncé par le backend lorsqu’il existe, en privilégiant `thinking`, puis `effort`, `reasoning_effort` ou `thought_level`. Pour Codex ACP, l’adaptateur associe les valeurs à `reasoning_effort`. |
| `/acp permissions <profile>` | option canonique `permissionProfile` | OpenClaw envoie l’équivalent annoncé par le backend lorsqu’il existe, tel que `approval_policy`, `permission_profile`, `permissions` ou `permission_mode`. |
| `/acp timeout <seconds>`     | option canonique `timeoutSeconds`    | OpenClaw envoie l’équivalent annoncé par le backend lorsqu’il existe, tel que `timeout` ou `timeout_seconds`.                                                                                               |
| `/acp cwd <path>`            | remplacement du répertoire de travail d’exécution | Mise à jour directe.                                                                                                                                                                                       |
| `/acp set <key> <value>`     | générique                            | `key=cwd` utilise le chemin de remplacement du répertoire de travail.                                                                                                                                      |
| `/acp reset-options`         | efface tous les remplacements d’exécution | -                                                                                                                                                                                                          |

## Harnais acpx, configuration du plugin et autorisations

Pour la configuration du harnais acpx (alias Claude Code / Codex / Gemini CLI),
les passerelles MCP plugin-tools et OpenClaw-tools ainsi que les modes d’autorisation ACP,
consultez [Agents ACP - configuration](/fr/tools/acp-agents-setup).

## Résolution des problèmes

| Symptôme                                                                                  | Cause probable                                                                                                                | Correction                                                                                                                                                                                                                       |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                                   | Plugin backend manquant, désactivé ou bloqué par `plugins.allow`.                                                             | Installez et activez le Plugin backend, incluez `acpx` dans `plugins.allow` lorsque cette liste d’autorisation est définie, puis exécutez `/acp doctor`.                                                                          |
| `ACP is disabled by policy (acp.enabled=false)`                                           | ACP est désactivé globalement.                                                                                                | Définissez `acp.enabled=true`.                                                                                                                                                                                                   |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`                         | La distribution automatique depuis les messages de fil de discussion normaux est désactivée.                                 | Définissez `acp.dispatch.enabled=true` pour rétablir le routage automatique des fils de discussion ; les appels explicites à `sessions_spawn({ runtime: "acp" })` continuent de fonctionner.                                     |
| `ACP agent "<id>" is not allowed by policy`                                               | L’agent ne figure pas dans la liste d’autorisation.                                                                           | Utilisez un `agentId` autorisé ou mettez à jour `acp.allowedAgents`.                                                                                                                                                              |
| `/acp doctor` reports backend not ready right after startup                               | Le Plugin backend est manquant, désactivé, bloqué par une politique d’autorisation ou de refus, ou son exécutable configuré est indisponible. | Installez ou activez le Plugin backend, réexécutez `/acp doctor` et examinez l’erreur d’installation du backend ou de politique s’il reste défaillant.                                                                            |
| Harness command not found                                                                 | La CLI de l’adaptateur n’est pas installée, le Plugin externe est manquant ou la récupération initiale par `npx` a échoué pour un adaptateur autre que Codex. | Exécutez `/acp doctor`, installez ou préchargez l’adaptateur sur l’hôte du Gateway, ou configurez explicitement la commande d’agent acpx.                                                                                         |
| Model-not-found from the harness                                                          | L’identifiant du modèle est valide pour un autre fournisseur ou environnement d’exécution, mais pas pour cette cible ACP.      | Utilisez un modèle répertorié par cet environnement d’exécution, configurez-y le modèle ou omettez la substitution.                                                                                                              |
| Vendor auth error from the harness                                                        | OpenClaw fonctionne correctement, mais la CLI ou le fournisseur cible n’est pas connecté.                                     | Connectez-vous ou fournissez la clé de fournisseur requise dans l’environnement de l’hôte du Gateway.                                                                                                                           |
| `Unable to resolve session target: ...`                                                   | Jeton de clé, d’identifiant ou de libellé incorrect.                                                                           | Exécutez `/acp sessions`, copiez la clé ou le libellé exact, puis réessayez.                                                                                                                                                      |
| `--bind here requires running /acp spawn inside an active ... conversation`               | `--bind here` est utilisé sans conversation active pouvant être liée.                                                         | Accédez au chat ou au canal cible et réessayez, ou créez une session sans liaison.                                                                                                                                                |
| `Conversation bindings are unavailable for <channel>.`                                    | L’adaptateur ne prend pas en charge la liaison ACP à la conversation actuelle.                                                 | Utilisez `/acp spawn ... --thread ...` lorsque cette option est prise en charge, configurez `bindings[]` au niveau supérieur ou accédez à un canal pris en charge.                                                               |
| `--thread here requires running /acp spawn inside an active ... thread`                   | `--thread here` est utilisé hors du contexte d’un fil de discussion.                                                          | Accédez au fil de discussion cible ou utilisez `--thread auto`/`off`.                                                                                                                                                            |
| `Only <user-id> can rebind this channel/conversation/thread.`                             | Un autre utilisateur possède la cible de liaison active.                                                                      | Effectuez la nouvelle liaison en tant que propriétaire ou utilisez une autre conversation ou un autre fil de discussion.                                                                                                        |
| `Thread bindings are unavailable for <channel>.`                                          | L’adaptateur ne prend pas en charge la liaison aux fils de discussion.                                                        | Utilisez `--thread off` ou accédez à un adaptateur ou canal pris en charge.                                                                                                                                                       |
| `Sandboxed sessions cannot spawn ACP sessions ...`                                        | L’environnement d’exécution ACP se trouve côté hôte ; la session à l’origine de la demande est isolée.                        | Utilisez `runtime="subagent"` depuis les sessions isolées ou lancez la création ACP depuis une session non isolée.                                                                                                               |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`                   | `sandbox="require"` est demandé pour l’environnement d’exécution ACP.                                                         | Utilisez `runtime="subagent"` lorsque l’isolation est requise, ou utilisez ACP avec `sandbox="inherit"` depuis une session non isolée.                                                                                            |
| `Cannot apply --model ... did not advertise model support`                                | L’environnement d’exécution cible n’expose pas le changement générique de modèle ACP.                                         | Utilisez un environnement d’exécution qui annonce ACP `models`/`session/set_model`, utilisez des références de modèle Codex ACP, ou configurez directement le modèle dans l’environnement d’exécution s’il possède son propre indicateur de démarrage. |
| Missing ACP metadata for bound session                                                    | Les métadonnées de session ACP sont obsolètes ou supprimées.                                                                  | Recréez la session avec `/acp spawn`, puis reliez ou activez de nouveau le fil de discussion.                                                                                                                                     |
| `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode` | `permissionMode` bloque les écritures ou les exécutions dans une session ACP non interactive.                                 | Définissez `plugins.entries.acpx.config.permissionMode` sur `approve-all` et redémarrez le Gateway. Consultez [Configuration des autorisations](/fr/tools/acp-agents-setup#permission-configuration).                                |
| ACP session fails early with little output                                                | Les demandes d’autorisation sont bloquées par `permissionMode`/`nonInteractivePermissions`.                                   | Recherchez `AcpRuntimeError` dans les journaux du Gateway. Pour des autorisations complètes, définissez `permissionMode=approve-all` ; pour une dégradation contrôlée, définissez `nonInteractivePermissions=deny`.                |
| ACP session stalls indefinitely after completing work                                     | Le processus de l’environnement d’exécution s’est terminé, mais la session ACP n’a pas signalé son achèvement.                | Mettez OpenClaw à jour ; le nettoyage acpx actuel élimine à la fermeture et au démarrage du Gateway les processus obsolètes de l’adaptateur et de l’enveloppe appartenant à OpenClaw.                                             |
| Harness sees `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                                      | L’enveloppe d’événement interne a franchi par erreur la frontière ACP.                                                        | Mettez OpenClaw à jour et relancez le flux d’achèvement ; les environnements d’exécution externes ne doivent recevoir que des invites d’achèvement en texte brut.                                                                |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable` relève du
relais de hook natif de Codex, et non d’ACP/acpx. Dans un chat Codex lié, démarrez une
nouvelle session avec `/new` ou `/reset` ; si cela fonctionne une fois, puis se reproduit lors
du prochain appel d’outil natif, redémarrez le serveur d’application Codex ou le Gateway OpenClaw
au lieu de répéter `/new`. Consultez
[Dépannage de l’environnement d’exécution Codex](/fr/plugins/codex-harness#troubleshooting).
</Note>

## Pages connexes

- [Agents ACP — configuration](/fr/tools/acp-agents-setup)
- [Envoi à un agent](/fr/tools/agent-send)
- [Backends CLI](/fr/gateway/cli-backends)
- [Environnement d’exécution Codex](/fr/plugins/codex-harness)
- [Runtime de l’environnement d’exécution Codex](/fr/plugins/codex-harness-runtime)
- [Outils d’isolation multi-agents](/fr/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (mode pont)](/fr/cli/acp)
- [Sous-agents](/fr/tools/subagents)
