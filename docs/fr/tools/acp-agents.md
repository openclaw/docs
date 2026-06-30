---
read_when:
    - Exécuter des harnais de codage via ACP
    - Configuration de sessions ACP liées à une conversation sur les canaux de messagerie
    - Liaison d’une conversation de canal de messages à une session ACP persistante
    - Dépannage du backend ACP, du câblage des plugins ou de la livraison des complétions
    - Exécuter des commandes /acp depuis le chat
sidebarTitle: ACP agents
summary: Exécuter des harnais de codage externes (Claude Code, Cursor, Gemini CLI, ACP Codex explicite, ACP OpenClaw, OpenCode) via le backend ACP
title: Agents ACP
x-i18n:
    generated_at: "2026-06-30T14:02:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c61edbc3b5a8303dc88e27a1315fe996da70eeee7aa211877d5680eb150e36cb
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) sessions
permettent à OpenClaw d’exécuter des harnais de codage externes (par exemple Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI et d’autres
harnais ACPX pris en charge) via un plugin backend ACP.

Chaque lancement de session ACP est suivi comme une [tâche en arrière-plan](/fr/automation/tasks).

<Note>
**ACP est le chemin des harnais externes, pas le chemin Codex par défaut.** Le
plugin serveur d’application Codex natif possède les contrôles `/codex ...` et le runtime intégré
`openai/gpt-*` par défaut pour les tours d’agent ; ACP possède
les contrôles `/acp ...` et les sessions `sessions_spawn({ runtime: "acp" })`.

Si vous voulez que Codex ou Claude Code se connecte comme client MCP externe
directement à des conversations de canal OpenClaw existantes, utilisez
[`openclaw mcp serve`](/fr/cli/mcp) au lieu d’ACP.
</Note>

## Quelle page me faut-il ?

| Vous voulez…                                                                                    | Utilisez ceci                         | Notes                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lier ou contrôler Codex dans la conversation actuelle                                            | `/codex bind`, `/codex threads`       | Chemin serveur d’application Codex natif lorsque le plugin `codex` est activé ; inclut les réponses de chat liées, le transfert d’images, les contrôles de modèle/rapide/autorisations, d’arrêt et de pilotage. ACP est un repli explicite |
| Exécuter Claude Code, Gemini CLI, Codex ACP explicite ou un autre harnais externe _via_ OpenClaw | Cette page                            | Sessions liées au chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tâches en arrière-plan, contrôles de runtime                                                                       |
| Exposer une session OpenClaw Gateway _comme_ serveur ACP pour un éditeur ou un client            | [`openclaw acp`](/fr/cli/acp)            | Mode pont. L’IDE/client parle ACP à OpenClaw via stdio/WebSocket                                                                                                                              |
| Réutiliser une CLI d’IA locale comme modèle de repli texte seul                                  | [Backends CLI](/fr/gateway/cli-backends) | Pas ACP. Aucun outil OpenClaw, aucun contrôle ACP, aucun runtime de harnais                                                                                                                   |

## Cela fonctionne-t-il directement ?

Oui, après l’installation du plugin runtime ACP officiel :

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Les extractions de source peuvent utiliser le plugin d’espace de travail local `extensions/acpx` après
`pnpm install`. Exécutez `/acp doctor` pour un contrôle de préparation.

OpenClaw n’enseigne aux agents le lancement ACP que lorsque ACP est **vraiment
utilisable** : ACP doit être activé, la répartition ne doit pas être désactivée, la session actuelle
ne doit pas être bloquée par le bac à sable, et un backend runtime doit être
chargé. Si ces conditions ne sont pas remplies, les Skills du plugin ACP et
les consignes ACP `sessions_spawn` restent masquées afin que l’agent ne suggère pas
un backend indisponible.

<AccordionGroup>
  <Accordion title="Pièges du premier lancement">
    - Si `plugins.allow` est défini, il s’agit d’un inventaire de plugins restrictif et il **doit** inclure `acpx` ; sinon le backend ACP installé est intentionnellement bloqué et `/acp doctor` signale l’entrée manquante dans la liste d’autorisation.
    - L’adaptateur Codex ACP est préparé avec le plugin `acpx` et lancé localement lorsque c’est possible.
    - Codex ACP s’exécute avec un `CODEX_HOME` isolé ; OpenClaw copie les entrées de projet fiables ainsi que la configuration sûre de routage modèle/fournisseur depuis la configuration Codex de l’hôte, tandis que l’authentification, les notifications et les hooks restent dans la configuration de l’hôte.
    - D’autres adaptateurs de harnais cibles peuvent encore être récupérés à la demande avec `npx` lors de leur première utilisation.
    - L’authentification du fournisseur doit toujours exister sur l’hôte pour ce harnais.
    - Si l’hôte n’a pas npm ni accès réseau, les récupérations d’adaptateurs au premier lancement échouent jusqu’à ce que les caches soient préchauffés ou que l’adaptateur soit installé autrement.

  </Accordion>
  <Accordion title="Prérequis du runtime">
    ACP lance un véritable processus de harnais externe. OpenClaw possède le routage,
    l’état des tâches en arrière-plan, la livraison, les liaisons et la politique ; le harnais
    possède sa connexion fournisseur, son catalogue de modèles, son comportement de système de fichiers et
    ses outils natifs.

    Avant d’incriminer OpenClaw, vérifiez :

    - `/acp doctor` signale un backend activé et sain.
    - L’id cible est autorisé par `acp.allowedAgents` lorsque cette liste d’autorisation est définie.
    - La commande du harnais peut démarrer sur l’hôte Gateway.
    - L’authentification fournisseur est présente pour ce harnais (`claude`, `codex`, `gemini`, `opencode`, `droid`, etc.).
    - Le modèle sélectionné existe pour ce harnais - les ids de modèle ne sont pas portables entre harnais.
    - Le `cwd` demandé existe et est accessible, ou omettez `cwd` et laissez le backend utiliser sa valeur par défaut.
    - Le mode d’autorisation correspond au travail. Les sessions non interactives ne peuvent pas cliquer sur les invites d’autorisation natives, donc les exécutions de codage lourdes en écriture/exécution ont généralement besoin d’un profil d’autorisation ACPX capable de continuer sans interface.

  </Accordion>
</AccordionGroup>

Les outils de plugin OpenClaw et les outils OpenClaw intégrés ne sont **pas** exposés aux
harnais ACP par défaut. Activez les ponts MCP explicites dans
[Agents ACP - configuration](/fr/tools/acp-agents-setup) uniquement lorsque le harnais
doit appeler directement ces outils.

## Cibles de harnais prises en charge

Avec le backend `acpx`, utilisez ces ids de harnais comme cibles `/acp spawn <id>`
ou `sessions_spawn({ runtime: "acp", agentId: "<id>" })` :

| Id de harnais | Backend typique                               | Notes                                                                               |
| ------------- | --------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`      | Adaptateur Claude Code ACP                    | Nécessite l’authentification Claude Code sur l’hôte.                                |
| `codex`       | Adaptateur Codex ACP                          | Repli ACP explicite uniquement lorsque `/codex` natif est indisponible ou qu’ACP est demandé. |
| `copilot`     | Adaptateur GitHub Copilot ACP                 | Nécessite l’authentification CLI/runtime Copilot.                                   |
| `cursor`      | Cursor CLI ACP (`cursor-agent acp`)           | Remplacez la commande acpx si une installation locale expose un point d’entrée ACP différent. |
| `droid`       | Factory Droid CLI                             | Nécessite l’authentification Factory/Droid ou `FACTORY_API_KEY` dans l’environnement du harnais. |
| `gemini`      | Adaptateur Gemini CLI ACP                     | Nécessite l’authentification Gemini CLI ou une configuration de clé API.             |
| `iflow`       | iFlow CLI                                     | La disponibilité de l’adaptateur et le contrôle du modèle dépendent de la CLI installée. |
| `kilocode`    | Kilo Code CLI                                 | La disponibilité de l’adaptateur et le contrôle du modèle dépendent de la CLI installée. |
| `kimi`        | Kimi/Moonshot CLI                             | Nécessite l’authentification Kimi/Moonshot sur l’hôte.                              |
| `kiro`        | Kiro CLI                                      | La disponibilité de l’adaptateur et le contrôle du modèle dépendent de la CLI installée. |
| `opencode`    | Adaptateur OpenCode ACP                       | Nécessite l’authentification CLI/fournisseur OpenCode.                              |
| `openclaw`    | Pont OpenClaw Gateway via `openclaw acp`      | Permet à un harnais compatible ACP de reparler à une session OpenClaw Gateway.      |
| `qwen`        | Qwen Code / Qwen CLI                          | Nécessite une authentification compatible Qwen sur l’hôte.                          |

Des alias d’agent acpx personnalisés peuvent être configurés dans acpx lui-même, mais la politique OpenClaw
vérifie toujours `acp.allowedAgents` et tout mappage
`agents.list[].runtime.acp.agent` avant la répartition.

## Guide d’exploitation

Flux `/acp` rapide depuis le chat :

<Steps>
  <Step title="Lancer">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`, ou explicitement
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Travailler">
    Continuez dans la conversation ou le fil lié (ou ciblez explicitement la clé
    de session).
  </Step>
  <Step title="Vérifier l’état">
    `/acp status`
  </Step>
  <Step title="Ajuster">
    `/acp model <provider/model>`,
    `/acp permissions <profile>`,
    `/acp timeout <seconds>`.
  </Step>
  <Step title="Piloter">
    Sans remplacer le contexte : `/acp steer tighten logging and continue`.
  </Step>
  <Step title="Arrêter">
    `/acp cancel` (tour actuel) ou `/acp close` (session + liaisons).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Détails du cycle de vie">
    - Le lancement crée ou reprend une session runtime ACP, enregistre les métadonnées ACP dans le magasin de sessions OpenClaw et peut créer une tâche en arrière-plan lorsque l’exécution appartient au parent.
    - Les sessions ACP appartenant au parent sont traitées comme du travail en arrière-plan même lorsque la session runtime est persistante ; la complétion et la livraison inter-surfaces passent par le notificateur de tâche parent plutôt que d’agir comme une session de chat utilisateur normale.
    - La maintenance des tâches ferme les sessions ACP ponctuelles terminales ou orphelines appartenant au parent. Les sessions ACP persistantes sont préservées tant qu’une liaison de conversation active demeure ; les sessions persistantes obsolètes sans liaison active sont fermées afin qu’elles ne puissent pas être reprises silencieusement une fois que la tâche propriétaire est terminée ou que son enregistrement de tâche a disparu.
    - Les messages de suivi liés vont directement à la session ACP jusqu’à ce que la liaison soit fermée, désélectionnée, réinitialisée ou expirée.
    - Les commandes Gateway restent locales. `/acp ...`, `/status` et `/unfocus` ne sont jamais envoyées comme texte d’invite normal à un harnais ACP lié.
    - `cancel` abandonne le tour actif lorsque le backend prend en charge l’annulation ; il ne supprime pas les métadonnées de liaison ni de session.
    - `close` termine la session ACP du point de vue d’OpenClaw et supprime la liaison. Un harnais peut encore conserver son propre historique amont s’il prend en charge la reprise.
    - Le plugin acpx nettoie les arbres de processus wrapper et adaptateur appartenant à OpenClaw après `close`, et récupère les orphelins ACPX obsolètes appartenant à OpenClaw au démarrage de Gateway.
    - Les workers runtime inactifs peuvent être nettoyés après `acp.runtime.ttlMinutes` ; les métadonnées de session stockées restent disponibles pour `/acp sessions`.

  </Accordion>
  <Accordion title="Règles de routage Codex natif">
    Déclencheurs en langage naturel qui doivent être routés vers le **plugin Codex
    natif** lorsqu’il est activé :

    - "Lier ce canal Discord à Codex."
    - "Attacher ce chat au fil Codex `<id>`."
    - "Afficher les fils Codex, puis lier celui-ci."

    La liaison de conversation Codex native est le chemin de contrôle de chat par défaut.
    Les outils dynamiques OpenClaw s’exécutent toujours via OpenClaw, tandis que
    les outils natifs de Codex comme shell/apply-patch s’exécutent dans Codex.
    Pour les événements d’outils natifs de Codex, OpenClaw injecte un relais
    de hook natif par tour afin que les hooks de Plugin puissent bloquer
    `before_tool_call`, observer `after_tool_call` et acheminer les événements
    Codex `PermissionRequest` via les approbations OpenClaw. Les hooks Codex
    `Stop` sont relayés vers OpenClaw `before_agent_finalize`, où les Plugins
    peuvent demander un passage de modèle supplémentaire avant que Codex finalise
    sa réponse. Le relais reste volontairement conservateur : il ne modifie pas
    les arguments d’outils natifs de Codex et ne réécrit pas les enregistrements
    de fil Codex. Utilisez ACP explicite uniquement lorsque vous voulez le modèle
    de runtime/session ACP. La limite de prise en charge Codex intégrée est
    documentée dans le
    [contrat de prise en charge du harnais Codex v1](/fr/plugins/codex-harness-runtime#v1-support-contract).

  </Accordion>
  <Accordion title="Aide-mémoire de sélection du modèle / fournisseur / runtime">
    - refs de modèle Codex héritées - route de modèle OAuth/abonnement Codex héritée réparée par doctor.
    - `openai/*` - runtime intégré de serveur d’application Codex natif pour les tours d’agent OpenAI.
    - `/codex ...` - contrôle de conversation Codex natif.
    - `/acp ...` ou `runtime: "acp"` - contrôle ACP/acpx explicite.

  </Accordion>
  <Accordion title="Déclencheurs en langage naturel pour le routage ACP">
    Déclencheurs qui doivent être routés vers le runtime ACP :

    - "Exécutez ceci comme une session ACP Claude Code ponctuelle et résumez le résultat."
    - "Utilisez Gemini CLI pour cette tâche dans un fil, puis conservez les suivis dans ce même fil."
    - "Exécutez Codex via ACP dans un fil en arrière-plan."

    OpenClaw choisit `runtime: "acp"`, résout le `agentId` du harnais,
    se lie à la conversation ou au fil actuel lorsque c’est pris en charge,
    et route les suivis vers cette session jusqu’à fermeture/expiration. Codex
    suit ce chemin uniquement lorsque ACP/acpx est explicite ou que le Plugin
    Codex natif est indisponible pour l’opération demandée.

    Pour `sessions_spawn`, `runtime: "acp"` est annoncé uniquement lorsque ACP
    est activé, que le demandeur n’est pas en bac à sable et qu’un backend de
    runtime ACP est chargé. `acp.dispatch.enabled=false` suspend la distribution
    automatique des fils ACP, mais ne masque ni ne bloque les appels explicites
    `sessions_spawn({ runtime: "acp" })`. Il cible des ids de harnais ACP comme `codex`,
    `claude`, `droid`, `gemini` ou `opencode`. Ne passez pas un id d’agent de
    configuration OpenClaw normal depuis `agents_list` sauf si cette entrée est
    explicitement configurée avec `agents.list[].runtime.type="acp"` ;
    sinon, utilisez le runtime de sous-agent par défaut. Lorsqu’un agent OpenClaw
    est configuré avec `runtime.type="acp"`, OpenClaw utilise
    `runtime.acp.agent` comme id de harnais sous-jacent.

  </Accordion>
</AccordionGroup>

## ACP par rapport aux sous-agents

Utilisez ACP lorsque vous voulez un runtime de harnais externe. Utilisez le
**serveur d’application Codex natif** pour la liaison/le contrôle de conversation
Codex lorsque le Plugin `codex` est activé. Utilisez des **sous-agents** lorsque
vous voulez des exécutions déléguées natives d’OpenClaw.

| Zone                | Session ACP                                      | Exécution de sous-agent              |
| ------------------- | ------------------------------------------------ | ------------------------------------ |
| Runtime             | Plugin de backend ACP (par exemple acpx)         | Runtime de sous-agent natif OpenClaw |
| Clé de session      | `agent:<agentId>:acp:<uuid>`                     | `agent:<agentId>:subagent:<uuid>`    |
| Commandes principales | `/acp ...`                                     | `/subagents ...`                     |
| Outil de lancement  | `sessions_spawn` avec `runtime:"acp"`            | `sessions_spawn` (runtime par défaut) |

Voir aussi [Sous-agents](/fr/tools/subagents).

## Fonctionnement d’ACP avec Claude Code

Pour Claude Code via ACP, la pile est :

1. Plan de contrôle de session ACP OpenClaw.
2. Plugin de runtime officiel `@openclaw/acpx`.
3. Adaptateur ACP Claude.
4. Mécanismes de runtime/session côté Claude.

ACP Claude est une **session de harnais** avec contrôles ACP, reprise de session,
suivi des tâches en arrière-plan et liaison optionnelle à une conversation/un fil.

Les backends CLI sont des runtimes de secours locaux distincts en texte seul - voir
[Backends CLI](/fr/gateway/cli-backends).

Pour les opérateurs, la règle pratique est :

- **Vous voulez `/acp spawn`, des sessions liables, des contrôles de runtime ou un travail de harnais persistant ?** Utilisez ACP.
- **Vous voulez un simple secours local en texte via la CLI brute ?** Utilisez les backends CLI.

## Sessions liées

### Modèle mental

- **Surface de chat** - l’endroit où les personnes continuent à parler (canal Discord, sujet Telegram, chat iMessage).
- **Session ACP** - l’état durable du runtime Codex/Claude/Gemini vers lequel OpenClaw route.
- **Fil/sujet enfant** - une surface de messagerie supplémentaire optionnelle créée uniquement par `--thread ...`.
- **Espace de travail du runtime** - l’emplacement du système de fichiers (`cwd`, checkout de dépôt, espace de travail backend) où le harnais s’exécute. Indépendant de la surface de chat.

### Liaisons à la conversation actuelle

`/acp spawn <harness> --bind here` épingle la conversation actuelle à la
session ACP lancée - pas de fil enfant, même surface de chat. OpenClaw continue
de gérer le transport, l’authentification, la sécurité et la livraison. Les
messages de suivi dans cette conversation sont routés vers la même session ;
`/new` et `/reset` réinitialisent la session sur place ; `/acp close` supprime
la liaison.

Exemples :

```text
/codex bind                                              # liaison Codex native, route les futurs messages ici
/codex model gpt-5.4                                     # ajuste le fil Codex natif lié
/codex stop                                              # contrôle le tour Codex natif actif
/acp spawn codex --bind here                             # secours ACP explicite pour Codex
/acp spawn codex --thread auto                           # peut créer un fil/sujet enfant et s’y lier
/acp spawn codex --bind here --cwd /workspace/repo       # même liaison de chat, Codex s’exécute dans /workspace/repo
```

<AccordionGroup>
  <Accordion title="Règles de liaison et exclusivité">
    - `--bind here` et `--thread ...` s’excluent mutuellement.
    - `--bind here` fonctionne uniquement sur les canaux qui annoncent la liaison à la conversation actuelle ; sinon OpenClaw renvoie un message clair indiquant que ce n’est pas pris en charge. Les liaisons persistent après les redémarrages du Gateway.
    - Sur Discord, `spawnSessions` contrôle la création de fils enfants pour `--thread auto|here` - pas `--bind here`.
    - Si vous lancez vers un autre agent ACP sans `--cwd`, OpenClaw hérite par défaut de l’espace de travail de **l’agent cible**. Les chemins hérités manquants (`ENOENT`/`ENOTDIR`) reviennent au défaut du backend ; les autres erreurs d’accès (par exemple `EACCES`) apparaissent comme erreurs de lancement.
    - Les commandes de gestion du Gateway restent locales dans les conversations liées - les commandes `/acp ...` sont gérées par OpenClaw même lorsque le texte de suivi normal est routé vers la session ACP liée ; `/status` et `/unfocus` restent également locales chaque fois que la gestion des commandes est activée pour cette surface.

  </Accordion>
  <Accordion title="Sessions liées à un fil">
    Lorsque les liaisons de fil sont activées pour un adaptateur de canal :

    - OpenClaw lie un fil à une session ACP cible.
    - Les messages de suivi dans ce fil sont routés vers la session ACP liée.
    - La sortie ACP est renvoyée dans le même fil.
    - Unfocus/close/archive/idle-timeout ou une expiration par âge maximal supprime la liaison.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` et `/unfocus` sont des commandes Gateway, pas des invites au harnais ACP.

    Indicateurs de fonctionnalité requis pour ACP lié à un fil :

    - `acp.enabled=true`
    - `acp.dispatch.enabled` est activé par défaut (définissez `false` pour suspendre la distribution automatique des fils ACP ; les appels explicites `sessions_spawn({ runtime: "acp" })` fonctionnent toujours).
    - Lancements de sessions de fil par adaptateur de canal activés (par défaut : `true`) :
      - Discord : `channels.discord.threadBindings.spawnSessions=true`
      - Telegram : `channels.telegram.threadBindings.spawnSessions=true`

    La prise en charge des liaisons de fil dépend de l’adaptateur. Si
    l’adaptateur de canal actif ne prend pas en charge les liaisons de fil,
    OpenClaw renvoie un message clair indiquant que ce n’est pas pris en charge
    ou pas disponible.

  </Accordion>
  <Accordion title="Canaux prenant en charge les fils">
    - Tout adaptateur de canal qui expose la capacité de liaison de session/fil.
    - Prise en charge intégrée actuelle : fils/canaux **Discord**, sujets **Telegram** (sujets de forum dans les groupes/supergroupes et sujets de DM).
    - Les canaux de Plugin peuvent ajouter la prise en charge via la même interface de liaison.

  </Accordion>
</AccordionGroup>

## Liaisons de canal persistantes

Pour les workflows non éphémères, configurez des liaisons ACP persistantes dans
les entrées de premier niveau `bindings[]`.

### Modèle de liaison

<ParamField path="bindings[].type" type='"acp"'>
  Marque une liaison de conversation ACP persistante.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Identifie la conversation cible. Formes par canal :

- **Canal/fil Discord :** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Canal/DM Slack :** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`. Préférez les ids Slack stables ; les liaisons de canal correspondent aussi aux réponses dans les fils de ce canal.
- **Sujet de forum Telegram :** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/groupe WhatsApp :** `match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"`. Utilisez des numéros E.164 comme `+15555550123` pour les chats directs et des JID de groupe WhatsApp comme `120363424282127706@g.us` pour les groupes.
- **DM/groupe iMessage :** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Préférez `chat_id:*` pour les liaisons de groupe stables.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  L’id de l’agent OpenClaw propriétaire.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  Remplacement ACP optionnel.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  Libellé optionnel visible par l’opérateur.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  Répertoire de travail optionnel du runtime.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  Remplacement optionnel du backend.
</ParamField>

### Valeurs par défaut du runtime par agent

Utilisez `agents.list[].runtime` pour définir les valeurs par défaut ACP une fois par agent :

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id de harnais, par exemple `codex` ou `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Priorité des remplacements pour les sessions liées ACP :**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. Valeurs par défaut ACP globales (par exemple `acp.backend`)

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
- Les messages dans ce canal, ce sujet ou cette discussion sont routés vers la session ACP configurée.
- Les liaisons ACP configurées possèdent leur route de session. La diffusion en éventail du canal ne remplace pas la session ACP configurée pour une liaison correspondante.
- Dans les conversations liées, `/new` et `/reset` réinitialisent sur place la même clé de session ACP.
- Les liaisons d’exécution temporaires (par exemple celles créées par des flux de focalisation sur un fil) continuent de s’appliquer lorsqu’elles sont présentes.
- Pour les créations ACP inter-agents sans `cwd` explicite, OpenClaw hérite l’espace de travail de l’agent cible depuis la configuration de l’agent.
- Les chemins d’espace de travail hérités manquants reviennent au cwd par défaut du backend ; les échecs d’accès non manquants apparaissent comme des erreurs de création.

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
    `runtime` vaut par défaut `subagent`, définissez donc `runtime: "acp"` explicitement
    pour les sessions ACP. Si `agentId` est omis, OpenClaw utilise
    `acp.defaultAgent` lorsqu’il est configuré. `mode: "session"` nécessite
    `thread: true` pour conserver une conversation liée persistante.
    </Note>

  </Tab>
  <Tab title="Depuis la commande /acp">
    Utilisez `/acp spawn` pour un contrôle opérateur explicite depuis la discussion.

    ```text
    /acp spawn codex --mode persistent --thread auto
    /acp spawn codex --mode oneshot --thread off
    /acp spawn codex --bind here
    /acp spawn codex --thread here
    ```

    Options clés :

    - `--mode persistent|oneshot`
    - `--bind here|off`
    - `--thread auto|here|off`
    - `--cwd <absolute-path>`
    - `--label <name>`

    Voir [Commandes slash](/fr/tools/slash-commands).

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
  Id du harnais cible ACP. Revient à `acp.defaultAgent` s’il est défini.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Demande un flux de liaison de fil lorsque cela est pris en charge.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` est à usage unique ; `"session"` est persistant. Si `thread: true` et
  que `mode` est omis, OpenClaw peut utiliser par défaut un comportement persistant selon
  le chemin d’exécution. `mode: "session"` nécessite `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Répertoire de travail d’exécution demandé (validé par la politique
  du backend/de l’exécution). S’il est omis, la création ACP hérite de l’espace
  de travail de l’agent cible lorsqu’il est configuré ; les chemins hérités manquants
  reviennent aux valeurs par défaut du backend, tandis que les erreurs d’accès réelles
  sont renvoyées.
</ParamField>
<ParamField path="label" type="string">
  Libellé visible par l’opérateur utilisé dans le texte de session/bannière.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Reprend une session ACP existante au lieu d’en créer une nouvelle. L’agent
  rejoue son historique de conversation via `session/load`. Nécessite
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` diffuse les résumés de progression de l’exécution ACP initiale vers la
  session demandeuse sous forme d’événements système. Les réponses acceptées incluent
  `streamLogPath` pointant vers un journal JSONL limité à la session
  (`<sessionId>.acp-stream.jsonl`) que vous pouvez suivre pour obtenir l’historique complet du relais.
  Les flux de progression parents affichent par défaut les commentaires de l’assistant
  et la progression d’état ACP, sauf si `streaming.progress.commentary=false`. Discord
  utilise aussi par défaut le mode progression pour les aperçus parents lorsqu’aucun mode
  de flux n’est configuré. La progression d’état respecte toujours
  `acp.stream.tagVisibility`, de sorte que des balises comme `plan`
  restent masquées sauf activation explicite.
</ParamField>

Les exécutions ACP `sessions_spawn` utilisent `agents.defaults.subagents.runTimeoutSeconds` comme
limite par défaut de tour enfant. L’outil n’accepte pas les remplacements de délai
par appel.

<ParamField path="model" type="string">
  Remplacement explicite du modèle pour la session enfant ACP. Les créations ACP Codex
  normalisent les références OpenAI comme `openai/gpt-5.4` vers la configuration
  de démarrage ACP Codex avant `session/new` ; les formes slash comme `openai/gpt-5.4/high`
  définissent aussi l’effort de raisonnement ACP Codex.
  Lorsqu’il est omis, `sessions_spawn({ runtime: "acp" })` utilise les valeurs par défaut
  de modèle de sous-agent existantes (`agents.defaults.subagents.model` ou
  `agents.list[].subagents.model`) lorsqu’elles sont configurées ; sinon, il laisse le
  harnais ACP utiliser son propre modèle par défaut.
  Les autres harnais doivent annoncer les `models` ACP et prendre en charge
  `session/set_model` ; sinon OpenClaw/acpx échoue clairement au lieu de
  revenir silencieusement à la valeur par défaut de l’agent cible.
</ParamField>
<ParamField path="thinking" type="string">
  Effort explicite de réflexion/raisonnement. Pour Codex ACP, `minimal` correspond
  à un effort faible, `low`/`medium`/`high`/`xhigh` correspondent directement, et `off`
  omet le remplacement de démarrage de l’effort de raisonnement.
  Lorsqu’il est omis, les créations ACP utilisent les valeurs par défaut existantes de
  réflexion de sous-agent et `agents.defaults.models["provider/model"].params.thinking`
  par modèle pour le modèle sélectionné.
</ParamField>

## Modes de liaison et de fil de création

<Tabs>
  <Tab title="--bind here|off">
    | Mode   | Comportement                                                               |
    | ------ | -------------------------------------------------------------------------- |
    | `here` | Lie sur place la conversation active actuelle ; échoue si aucune n’est active. |
    | `off`  | Ne crée pas de liaison avec la conversation actuelle.                      |

    Notes :

    - `--bind here` est le chemin opérateur le plus simple pour « rendre ce canal ou cette discussion adossé à Codex ».
    - `--bind here` ne crée pas de fil enfant.
    - `--bind here` est disponible uniquement sur les canaux qui exposent la prise en charge de la liaison de conversation actuelle.
    - `--bind` et `--thread` ne peuvent pas être combinés dans le même appel `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Mode   | Comportement                                                                                         |
    | ------ | ---------------------------------------------------------------------------------------------------- |
    | `auto` | Dans un fil actif : lie ce fil. Hors d’un fil : crée/lie un fil enfant lorsque cela est pris en charge. |
    | `here` | Exige le fil actif actuel ; échoue si l’on n’en est pas dans un.                                      |
    | `off`  | Aucune liaison. La session démarre sans liaison.                                                     |

    Notes :

    - Sur les surfaces de liaison sans fil, le comportement par défaut est effectivement `off`.
    - La création liée à un fil nécessite la prise en charge par la politique du canal :
      - Discord : `channels.discord.threadBindings.spawnSessions=true`
      - Telegram : `channels.telegram.threadBindings.spawnSessions=true`
    - Utilisez `--bind here` lorsque vous voulez épingler la conversation actuelle sans créer de fil enfant.

  </Tab>
</Tabs>

## Modèle de livraison

Les sessions ACP peuvent être soit des espaces de travail interactifs, soit un
travail d’arrière-plan possédé par le parent. Le chemin de livraison dépend de cette forme.

<AccordionGroup>
  <Accordion title="Sessions ACP interactives">
    Les sessions interactives sont destinées à poursuivre l’échange sur une surface
    de discussion visible :

    - `/acp spawn ... --bind here` lie la conversation actuelle à la session ACP.
    - `/acp spawn ... --thread ...` lie un fil/sujet de canal à la session ACP.
    - Les `bindings[].type="acp"` configurées de façon persistante routent les conversations correspondantes vers la même session ACP.

    Les messages de suivi dans la conversation liée sont routés directement vers la
    session ACP, et la sortie ACP est renvoyée vers ce même
    canal/fil/sujet.

    Ce qu’OpenClaw envoie au harnais :

    - Les suivis liés normaux sont envoyés comme texte d’invite, avec les pièces jointes uniquement lorsque le harnais/backend les prend en charge.
    - Les commandes de gestion `/acp` et les commandes locales Gateway sont interceptées avant l’envoi ACP.
    - Les événements d’achèvement générés par l’exécution sont matérialisés par cible. Les agents OpenClaw reçoivent l’enveloppe de contexte d’exécution interne d’OpenClaw ; les harnais ACP externes reçoivent une invite simple avec le résultat enfant et l’instruction. L’enveloppe brute `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` ne doit jamais être envoyée à des harnais externes ni persistée comme texte de transcription utilisateur ACP.
    - Les entrées de transcription ACP utilisent le texte déclencheur visible par l’utilisateur ou l’invite d’achèvement simple. Les métadonnées d’événement internes restent structurées dans OpenClaw lorsque c’est possible et ne sont pas traitées comme du contenu de discussion rédigé par l’utilisateur.

  </Accordion>
  <Accordion title="Sessions ACP à usage unique possédées par le parent">
    Les sessions ACP à usage unique créées par une autre exécution d’agent sont des
    enfants d’arrière-plan, semblables aux sous-agents :

    - Le parent demande le travail avec `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - L’enfant s’exécute dans sa propre session de harnais ACP.
    - Les tours enfants s’exécutent sur la même voie d’arrière-plan que les créations de sous-agents natives, de sorte qu’un harnais ACP lent ne bloque pas le travail non lié de la session principale.
    - Les rapports d’achèvement reviennent par le chemin d’annonce d’achèvement de tâche. OpenClaw convertit les métadonnées d’achèvement internes en une invite ACP simple avant de les envoyer à un harnais externe, de sorte que les harnais ne voient pas les marqueurs de contexte d’exécution propres à OpenClaw.
    - Le parent reformule le résultat enfant avec une voix d’assistant normale lorsqu’une réponse destinée à l’utilisateur est utile.

    Ne traitez **pas** ce chemin comme une discussion pair à pair entre parent
    et enfant. L’enfant dispose déjà d’un canal d’achèvement de retour vers le
    parent.

  </Accordion>
  <Accordion title="sessions_send et livraison A2A">
    `sessions_send` peut cibler une autre session après la création. Pour les sessions
    de pairs normales, OpenClaw utilise un chemin de suivi agent-à-agent (A2A)
    après avoir injecté le message :

    - Attendre la réponse de la session cible.
    - Permettre éventuellement au demandeur et à la cible d’échanger un nombre limité de tours de suivi.
    - Demander à la cible de produire un message d’annonce.
    - Livrer cette annonce au canal ou au fil visible.

    Ce chemin A2A est une solution de repli pour les envois entre pairs où l’expéditeur
    a besoin d’un suivi visible. Il reste activé lorsqu’une session non liée peut
    voir et envoyer un message à une cible ACP, par exemple avec des paramètres
    `tools.sessions.visibility` larges.

    OpenClaw ignore le suivi A2A uniquement lorsque le demandeur est le
    parent de son propre enfant ACP à usage unique possédé par ce parent. Dans ce cas,
    exécuter A2A par-dessus l’achèvement de la tâche peut réveiller le parent avec le
    résultat de l’enfant, renvoyer la réponse du parent dans l’enfant, et
    créer une boucle d’écho parent/enfant. Le résultat `sessions_send` signale
    `delivery.status="skipped"` pour ce cas d’enfant possédé, car le
    chemin d’achèvement est déjà responsable du résultat.

  </Accordion>
  <Accordion title="Reprendre une session existante">
    Utilisez `resumeSessionId` pour continuer une session ACP précédente au lieu de
    repartir de zéro. L’agent rejoue son historique de conversation via
    `session/load`, ce qui lui permet de reprendre avec tout le contexte antérieur.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Cas d’utilisation courants :

    - Transférer une session Codex de votre ordinateur portable vers votre téléphone - dites à votre agent de reprendre là où vous vous étiez arrêté.
    - Continuer une session de codage démarrée de manière interactive dans la CLI, désormais sans interface via votre agent.
    - Reprendre un travail interrompu par un redémarrage du gateway ou un délai d’inactivité.

    Notes :

    - `resumeSessionId` s’applique uniquement lorsque `runtime: "acp"` ; le runtime de sous-agent par défaut ignore ce champ propre à ACP.
    - `streamTo` s’applique uniquement lorsque `runtime: "acp"` ; le runtime de sous-agent par défaut ignore ce champ propre à ACP.
    - `resumeSessionId` est un identifiant de reprise ACP/harness local à l’hôte, pas une clé de session de canal OpenClaw ; OpenClaw vérifie toujours la politique de création ACP et la politique de l’agent cible avant l’envoi, tandis que le backend ou le harness ACP possède l’autorisation de charger cet identifiant amont.
    - `resumeSessionId` restaure l’historique de conversation ACP amont ; `thread` et `mode` s’appliquent toujours normalement à la nouvelle session OpenClaw que vous créez, donc `mode: "session"` nécessite toujours `thread: true`.
    - L’agent cible doit prendre en charge `session/load` (Codex et Claude Code le font).
    - Si l’identifiant de session est introuvable, la création échoue avec une erreur claire - aucun repli silencieux vers une nouvelle session.

  </Accordion>
  <Accordion title="Test de fumée après déploiement">
    Après un déploiement du gateway, exécutez une vérification de bout en bout en direct plutôt que
    de faire confiance aux tests unitaires :

    1. Vérifiez la version du gateway déployée et le commit sur l’hôte cible.
    2. Ouvrez une session de pont ACPX temporaire vers un agent en direct.
    3. Demandez à cet agent d’appeler `sessions_spawn` avec `runtime: "acp"`, `agentId: "codex"`, `mode: "run"`, et la tâche `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Vérifiez `accepted=yes`, un vrai `childSessionKey`, et l’absence d’erreur de validateur.
    5. Nettoyez la session de pont temporaire.

    Gardez le contrôle sur `mode: "run"` et omettez `streamTo: "parent"` -
    les chemins `mode: "session"` liés aux fils de discussion et les relais de flux sont des passes
    d’intégration enrichies distinctes.

  </Accordion>
</AccordionGroup>

## Compatibilité avec le bac à sable

Les sessions ACP s’exécutent actuellement sur le runtime hôte, **pas** à l’intérieur du
bac à sable OpenClaw.

<Warning>
**Limite de sécurité :**

- Le harness externe peut lire/écrire selon ses propres autorisations CLI et le `cwd` sélectionné.
- La politique de bac à sable d’OpenClaw n’encapsule **pas** l’exécution du harness ACP.
- OpenClaw applique toujours les contrôles de fonctionnalité ACP, les agents autorisés, la propriété des sessions, les liaisons de canaux et la politique de livraison du Gateway.
- Utilisez `runtime: "subagent"` pour un travail natif OpenClaw soumis au bac à sable.

</Warning>

Limitations actuelles :

- Si la session demandeuse est placée en bac à sable, les créations ACP sont bloquées pour `sessions_spawn({ runtime: "acp" })` comme pour `/acp spawn`.
- `sessions_spawn` avec `runtime: "acp"` ne prend pas en charge `sandbox: "require"`.

## Résolution de la cible de session

La plupart des actions `/acp` acceptent une cible de session facultative (`session-key`,
`session-id`, ou `session-label`).

**Ordre de résolution :**

1. Argument de cible explicite (ou `--session` pour `/acp steer`)
   - essaie la clé
   - puis l’identifiant de session au format UUID
   - puis le libellé
2. Liaison du fil de discussion actuel (si cette conversation/ce fil est lié à une session ACP).
3. Repli sur la session demandeuse actuelle.

Les liaisons de conversation actuelle et les liaisons de fil participent toutes deux à
l’étape 2.

Si aucune cible n’est résolue, OpenClaw renvoie une erreur claire
(`Unable to resolve session target: ...`).

## Contrôles ACP

| Commande             | Ce qu’elle fait                                           | Exemple                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Crée une session ACP ; liaison actuelle ou liaison de fil facultative. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Annule le tour en cours pour la session cible.            | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Envoie une instruction de pilotage à la session en cours. | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Ferme la session et détache les cibles de fil.            | `/acp close`                                                  |
| `/acp status`        | Affiche le backend, le mode, l’état, les options de runtime et les capacités. | `/acp status`                                                 |
| `/acp set-mode`      | Définit le mode de runtime pour la session cible.         | `/acp set-mode plan`                                          |
| `/acp set`           | Écrit une option générique de configuration du runtime.   | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Définit le remplacement du répertoire de travail du runtime. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Définit le profil de politique d’approbation.             | `/acp permissions strict`                                     |
| `/acp timeout`       | Définit le délai d’expiration du runtime (secondes).      | `/acp timeout 120`                                            |
| `/acp model`         | Définit le remplacement du modèle de runtime.             | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Supprime les remplacements d’options de runtime de la session. | `/acp reset-options`                                          |
| `/acp sessions`      | Liste les sessions ACP récentes depuis le magasin.        | `/acp sessions`                                               |
| `/acp doctor`        | Santé du backend, capacités, correctifs exploitables.     | `/acp doctor`                                                 |
| `/acp install`       | Affiche les étapes déterministes d’installation et d’activation. | `/acp install`                                                |

Les contrôles de runtime (`spawn`, `cancel`, `steer`, `close`, `status`, `set-mode`,
`set`, `cwd`, `permissions`, `timeout`, `model`, et `reset-options`) nécessitent
l’identité du propriétaire depuis les canaux externes et `operator.admin` depuis les clients internes du Gateway.
Les expéditeurs autorisés non propriétaires peuvent toujours utiliser `sessions`, `doctor`,
`install`, et `help`.

`/acp status` affiche les options de runtime effectives ainsi que les identifiants de session
au niveau du runtime et du backend. Les erreurs de contrôle non pris en charge apparaissent
clairement lorsqu’un backend ne dispose pas d’une capacité. `/acp sessions` lit le
magasin pour la session actuellement liée ou demandeuse ; les jetons de cible
(`session-key`, `session-id`, ou `session-label`) sont résolus via la
découverte de session du gateway, y compris les racines `session.store`
personnalisées par agent.

### Correspondance des options de runtime

`/acp` dispose de commandes pratiques et d’un configurateur générique. Opérations
équivalentes :

| Commande                     | Correspond à                          | Notes                                                                                                                                                                                                      |
| ---------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | clé de configuration de runtime `model` | Pour Codex ACP, OpenClaw normalise `openai/<model>` vers l’identifiant de modèle de l’adaptateur et mappe les suffixes de raisonnement avec barre oblique, comme `openai/gpt-5.4/high`, vers `reasoning_effort`. |
| `/acp set thinking <level>`  | option canonique `thinking`           | OpenClaw envoie l’équivalent annoncé par le backend lorsqu’il est présent, en privilégiant `thinking`, puis `effort`, `reasoning_effort`, ou `thought_level`. Pour Codex ACP, l’adaptateur mappe les valeurs vers `reasoning_effort`. |
| `/acp permissions <profile>` | option canonique `permissionProfile`  | OpenClaw envoie l’équivalent annoncé par le backend lorsqu’il est présent, comme `approval_policy`, `permission_profile`, `permissions`, ou `permission_mode`.                                                       |
| `/acp timeout <seconds>`     | option canonique `timeoutSeconds`     | OpenClaw envoie l’équivalent annoncé par le backend lorsqu’il est présent, comme `timeout` ou `timeout_seconds`.                                                                                                     |
| `/acp cwd <path>`            | remplacement du cwd de runtime        | Mise à jour directe.                                                                                                                                                                                       |
| `/acp set <key> <value>`     | générique                             | `key=cwd` utilise le chemin de remplacement du cwd.                                                                                                                                                        |
| `/acp reset-options`         | efface tous les remplacements de runtime | -                                                                                                                                                                                                          |

## Harness acpx, configuration du plugin et autorisations

Pour la configuration du harness acpx (alias Claude Code / Codex / Gemini CLI),
les ponts MCP plugin-tools et OpenClaw-tools, et les modes d’autorisation
ACP, consultez
[Agents ACP - configuration](/fr/tools/acp-agents-setup).

## Dépannage

| Symptôme                                                                     | Cause probable                                                                                                           | Correctif                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Plugin de backend manquant, désactivé ou bloqué par `plugins.allow`.                                                       | Installez et activez le Plugin de backend, incluez `acpx` dans `plugins.allow` quand cette liste d’autorisation est définie, puis exécutez `/acp doctor`.                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP désactivé globalement.                                                                                                 | Définissez `acp.enabled=true`.                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Dispatch automatique depuis les messages de fil normaux désactivé.                                                               | Définissez `acp.dispatch.enabled=true` pour reprendre le routage automatique des fils ; les appels explicites `sessions_spawn({ runtime: "acp" })` fonctionnent toujours.                                      |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent absent de la liste d’autorisation.                                                                                                | Utilisez un `agentId` autorisé ou mettez à jour `acp.allowedAgents`.                                                                                                                     |
| `/acp doctor` signale que le backend n’est pas prêt juste après le démarrage                 | Le Plugin de backend est manquant, désactivé, bloqué par une règle d’autorisation/refus, ou son exécutable configuré est indisponible.        | Installez/activez le Plugin de backend, relancez `/acp doctor`, et inspectez l’installation du backend ou l’erreur de politique s’il reste défaillant.                                           |
| Commande de harnais introuvable                                                   | La CLI de l’adaptateur n’est pas installée, le Plugin externe est manquant, ou la récupération `npx` au premier lancement a échoué pour un adaptateur non-Codex. | Exécutez `/acp doctor`, installez/préchauffez l’adaptateur sur l’hôte Gateway, ou configurez explicitement la commande d’agent acpx.                                                      |
| Modèle introuvable depuis le harnais                                            | L’id de modèle est valide pour un autre fournisseur/harnais, mais pas pour cette cible ACP.                                                | Utilisez un modèle listé par ce harnais, configurez le modèle dans le harnais, ou omettez la surcharge.                                                                            |
| Erreur d’authentification du fournisseur depuis le harnais                                          | OpenClaw est sain, mais la CLI/le fournisseur cible n’est pas connecté.                                                     | Connectez-vous ou fournissez la clé fournisseur requise dans l’environnement de l’hôte Gateway.                                                                                             |
| `Unable to resolve session target: ...`                                     | Jeton de clé/id/libellé incorrect.                                                                                                | Exécutez `/acp sessions`, copiez la clé/le libellé exact, puis réessayez.                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` utilisé sans conversation active pouvant être liée.                                                            | Passez au chat/canal cible et réessayez, ou utilisez un spawn non lié.                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | L’adaptateur ne dispose pas de la capacité de liaison ACP à la conversation courante.                                                             | Utilisez `/acp spawn ... --thread ...` lorsque c’est pris en charge, configurez les `bindings[]` de premier niveau, ou passez à un canal pris en charge.                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` utilisé en dehors d’un contexte de fil.                                                                         | Passez au fil cible ou utilisez `--thread auto`/`off`.                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Un autre utilisateur possède la cible de liaison active.                                                                           | Reliez à nouveau en tant que propriétaire ou utilisez une autre conversation ou un autre fil.                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                            | L’adaptateur ne dispose pas de la capacité de liaison de fil.                                                                               | Utilisez `--thread off` ou passez à un adaptateur/canal pris en charge.                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Le runtime ACP est côté hôte ; la session demandeuse est en sandbox.                                                              | Utilisez `runtime="subagent"` depuis les sessions en sandbox, ou lancez le spawn ACP depuis une session non sandboxée.                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` demandé pour le runtime ACP.                                                                         | Utilisez `runtime="subagent"` pour une sandbox obligatoire, ou utilisez ACP avec `sandbox="inherit"` depuis une session non sandboxée.                                                      |
| `Cannot apply --model ... did not advertise model support`                  | Le harnais cible n’expose pas le changement générique de modèle ACP.                                                        | Utilisez un harnais qui annonce ACP `models`/`session/set_model`, utilisez des références de modèle Codex ACP, ou configurez directement le modèle dans le harnais s’il possède son propre flag de démarrage. |
| Métadonnées ACP manquantes pour la session liée                                      | Métadonnées de session ACP obsolètes/supprimées.                                                                                    | Recréez avec `/acp spawn`, puis reliez/focalisez à nouveau le fil.                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` bloque les écritures/exec dans une session ACP non interactive.                                                    | Définissez `plugins.entries.acpx.config.permissionMode` sur `approve-all` et redémarrez le gateway. Consultez [Configuration des permissions](/fr/tools/acp-agents-setup#permission-configuration). |
| La session ACP échoue tôt avec peu de sortie                                  | Les invites de permission sont bloquées par `permissionMode`/`nonInteractivePermissions`.                                        | Vérifiez les journaux du gateway pour `AcpRuntimeError`. Pour les permissions complètes, définissez `permissionMode=approve-all` ; pour une dégradation progressive, définissez `nonInteractivePermissions=deny`.        |
| La session ACP se bloque indéfiniment après avoir terminé le travail                       | Le processus du harnais s’est terminé, mais la session ACP n’a pas signalé son achèvement.                                                    | Mettez à jour OpenClaw ; le nettoyage acpx actuel récupère les processus wrapper et adaptateur obsolètes appartenant à OpenClaw à la fermeture et au démarrage du Gateway.                                             |
| Le harnais voit `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | L’enveloppe d’événement interne a fuité au-delà de la frontière ACP.                                                                | Mettez à jour OpenClaw et relancez le flux d’achèvement ; les harnais externes ne devraient recevoir que des prompts d’achèvement simples.                                                          |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable` appartient au
relais de hook Codex natif, pas à ACP/acpx. Dans un chat Codex lié, démarrez une nouvelle
session avec `/new` ou `/reset` ; si cela fonctionne une fois puis revient lors du prochain
appel d’outil natif, redémarrez le serveur d’application Codex ou le Gateway OpenClaw au lieu de
répéter `/new`. Consultez [Dépannage du harnais Codex](/fr/plugins/codex-harness#troubleshooting).
</Note>

## Liens associés

- [Agents ACP - configuration](/fr/tools/acp-agents-setup)
- [Envoi à l’agent](/fr/tools/agent-send)
- [Backends CLI](/fr/gateway/cli-backends)
- [Harnais Codex](/fr/plugins/codex-harness)
- [Runtime du harnais Codex](/fr/plugins/codex-harness-runtime)
- [Outils de sandbox multi-agent](/fr/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (mode pont)](/fr/cli/acp)
- [Sous-agents](/fr/tools/subagents)
