---
read_when:
    - Vous souhaitez effectuer un travail en arrière-plan ou en parallèle via l’agent
    - Vous modifiez sessions_spawn ou la politique de l’outil de sous-agent
    - Vous implémentez ou dépannez des sessions de sous-agent liées à un fil
sidebarTitle: Sub-agents
summary: Lancer des exécutions isolées d’agents en arrière-plan qui annoncent les résultats dans la discussion du demandeur
title: Sous-agents
x-i18n:
    generated_at: "2026-04-30T16:30:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7c46d2c6d9ddac23653dcbfaf20df0ff5be9619035a1b115a3b49fd48fd8280
    source_path: tools/subagents.md
    workflow: 16
---

Les sous-agents sont des exécutions d’agent en arrière-plan lancées depuis une exécution d’agent existante.
Ils s’exécutent dans leur propre session (`agent:<agentId>:subagent:<uuid>`) et,
une fois terminés, **annoncent** leur résultat au canal de chat
demandeur. Chaque exécution de sous-agent est suivie comme une
[tâche en arrière-plan](/fr/automation/tasks).

Objectifs principaux :

- Paralléliser le travail de « recherche / tâche longue / outil lent » sans bloquer l’exécution principale.
- Garder les sous-agents isolés par défaut (séparation des sessions + sandboxing facultatif).
- Rendre la surface d’outils difficile à mal utiliser : les sous-agents n’obtiennent **pas** les outils de session par défaut.
- Prendre en charge une profondeur d’imbrication configurable pour les modèles d’orchestrateur.

<Note>
**Note sur les coûts :** chaque sous-agent possède son propre contexte et sa propre consommation de tokens par
défaut. Pour les tâches lourdes ou répétitives, définissez un modèle moins cher pour les sous-agents
et gardez votre agent principal sur un modèle de meilleure qualité. Configurez via
`agents.defaults.subagents.model` ou des remplacements par agent. Lorsqu’un enfant
a réellement besoin de la transcription actuelle du demandeur, l’agent peut demander
`context: "fork"` pour ce lancement précis.
</Note>

## Commande slash

Utilisez `/subagents` pour inspecter ou contrôler les exécutions de sous-agents pour la **session
actuelle** :

```text
/subagents list
/subagents kill <id|#|all>
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
/subagents send <id|#> <message>
/subagents steer <id|#> <message>
/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]
```

`/subagents info` affiche les métadonnées d’exécution (statut, horodatages, identifiant de session,
chemin de transcription, nettoyage). Utilisez `sessions_history` pour une vue de rappel bornée
et filtrée pour la sécurité ; inspectez le chemin de transcription sur le disque lorsque vous
avez besoin de la transcription brute complète.

### Contrôles de liaison de fil

Ces commandes fonctionnent sur les canaux qui prennent en charge les liaisons de fil persistantes.
Voir [Canaux prenant en charge les fils](#thread-supporting-channels) ci-dessous.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Comportement de lancement

`/subagents spawn` démarre un sous-agent en arrière-plan comme une commande utilisateur (et non comme un
relais interne) et envoie une mise à jour finale de fin d’exécution au chat
demandeur lorsque l’exécution se termine.

<AccordionGroup>
  <Accordion title="Non-blocking, push-based completion">
    - La commande de lancement est non bloquante ; elle renvoie immédiatement un identifiant d’exécution.
    - À la fin, le sous-agent annonce un message de résumé/résultat au canal de chat demandeur.
    - La fin d’exécution est transmise par poussée. Une fois lancé, ne sondez **pas** `/subagents list`, `sessions_list` ou `sessions_history` en boucle uniquement pour attendre sa fin ; inspectez le statut uniquement à la demande pour déboguer ou intervenir.
    - À la fin, OpenClaw ferme au mieux les onglets/processus de navigateur suivis qui ont été ouverts par cette session de sous-agent avant que le flux de nettoyage de l’annonce ne continue.

  </Accordion>
  <Accordion title="Manual-spawn delivery resilience">
    - OpenClaw essaie d’abord la livraison directe `agent` avec une clé d’idempotence stable.
    - Si la livraison directe échoue, il se rabat sur le routage par file d’attente.
    - Si le routage par file d’attente n’est toujours pas disponible, l’annonce est réessayée avec un bref backoff exponentiel avant l’abandon final.
    - La livraison de fin conserve la route demandeur résolue : les routes de fin liées au fil ou à la conversation l’emportent lorsqu’elles sont disponibles ; si l’origine de fin ne fournit qu’un canal, OpenClaw complète la cible/le compte manquant à partir de la route résolue de la session demandeur (`lastChannel` / `lastTo` / `lastAccountId`) afin que la livraison directe fonctionne toujours.

  </Accordion>
  <Accordion title="Completion handoff metadata">
    Le transfert de fin d’exécution à la session demandeur est un contexte interne généré à l’exécution
    (et non un texte rédigé par l’utilisateur) et inclut :

    - `Result` — dernier texte visible de réponse `assistant`, sinon dernier texte d’outil/toolResult nettoyé. Les exécutions terminales échouées ne réutilisent pas le texte de réponse capturé.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Statistiques compactes d’exécution/tokens.
    - Une instruction de livraison indiquant à l’agent demandeur de reformuler avec une voix d’assistant normale (sans transférer les métadonnées internes brutes).

  </Accordion>
  <Accordion title="Modes and ACP runtime">
    - `--model` et `--thinking` remplacent les valeurs par défaut pour cette exécution précise.
    - Utilisez `info`/`log` pour inspecter les détails et la sortie après la fin.
    - `/subagents spawn` est un mode ponctuel (`mode: "run"`). Pour les sessions persistantes liées à un fil, utilisez `sessions_spawn` avec `thread: true` et `mode: "session"`.
    - Pour les sessions de harnais ACP (Claude Code, Gemini CLI, OpenCode ou Codex ACP/acpx explicite), utilisez `sessions_spawn` avec `runtime: "acp"` lorsque l’outil annonce cet environnement d’exécution. Voir [modèle de livraison ACP](/fr/tools/acp-agents#delivery-model) lors du débogage des fins d’exécution ou des boucles agent-à-agent. Lorsque le Plugin `codex` est activé, le contrôle de chat/fil Codex doit préférer `/codex ...` à ACP sauf si l’utilisateur demande explicitement ACP/acpx.
    - OpenClaw masque `runtime: "acp"` jusqu’à ce qu’ACP soit activé, que le demandeur ne soit pas sandboxé et qu’un Plugin backend tel que `acpx` soit chargé. `runtime: "acp"` attend un identifiant de harnais ACP externe, ou une entrée `agents.list[]` avec `runtime.type="acp"` ; utilisez l’environnement d’exécution de sous-agent par défaut pour les agents de configuration OpenClaw normaux depuis `agents_list`.

  </Accordion>
</AccordionGroup>

## Modes de contexte

Les sous-agents natifs démarrent isolés sauf si l’appelant demande explicitement de dupliquer
la transcription actuelle.

| Mode       | Quand l’utiliser                                                                                                                         | Comportement                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Recherche nouvelle, implémentation indépendante, travail d’outil lent, ou tout élément pouvant être présenté dans le texte de tâche                           | Crée une transcription enfant propre. C’est la valeur par défaut et cela réduit l’utilisation des tokens.  |
| `fork`     | Travail qui dépend de la conversation actuelle, des résultats d’outils précédents ou d’instructions nuancées déjà présentes dans la transcription du demandeur | Branche la transcription du demandeur dans la session enfant avant le démarrage de l’enfant. |

Utilisez `fork` avec parcimonie. Il est destiné à la délégation sensible au contexte, pas à
remplacer la rédaction d’une invite de tâche claire.

## Outil : `sessions_spawn`

Démarre une exécution de sous-agent avec `deliver: false` sur la voie globale `subagent`,
puis exécute une étape d’annonce et publie la réponse d’annonce dans le canal de chat
demandeur.

La disponibilité dépend de la politique d’outils effective de l’appelant. Les profils `coding` et
`full` exposent `sessions_spawn` par défaut. Le profil `messaging`
ne le fait pas ; ajoutez `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` ou utilisez `tools.profile: "coding"` pour les agents qui doivent déléguer
du travail. Les politiques de canal/groupe, fournisseur, sandbox et autorisation/refus par agent peuvent
toujours retirer l’outil après l’étape de profil. Utilisez `/tools` depuis la même
session pour confirmer la liste d’outils effective.

**Valeurs par défaut :**

- **Modèle :** hérite de l’appelant sauf si vous définissez `agents.defaults.subagents.model` (ou `agents.list[].subagents.model` par agent) ; un `sessions_spawn.model` explicite l’emporte toujours.
- **Thinking :** hérite de l’appelant sauf si vous définissez `agents.defaults.subagents.thinking` (ou `agents.list[].subagents.thinking` par agent) ; un `sessions_spawn.thinking` explicite l’emporte toujours.
- **Délai d’exécution :** si `sessions_spawn.runTimeoutSeconds` est omis, OpenClaw utilise `agents.defaults.subagents.runTimeoutSeconds` lorsqu’il est défini ; sinon, il se rabat sur `0` (aucun délai).

### Paramètres de l’outil

<ParamField path="task" type="string" required>
  La description de tâche pour le sous-agent.
</ParamField>
<ParamField path="label" type="string">
  Libellé lisible facultatif.
</ParamField>
<ParamField path="agentId" type="string">
  Lancer sous un autre identifiant d’agent lorsque `subagents.allowAgents` l’autorise.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` est réservé aux harnais ACP externes (`claude`, `droid`, `gemini`, `opencode` ou Codex ACP/acpx explicitement demandé) et aux entrées `agents.list[]` dont `runtime.type` est `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  ACP uniquement. Reprend une session de harnais ACP existante lorsque `runtime: "acp"` ; ignoré pour les lancements de sous-agents natifs.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  ACP uniquement. Diffuse la sortie d’exécution ACP vers la session parente lorsque `runtime: "acp"` ; omettez pour les lancements de sous-agents natifs.
</ParamField>
<ParamField path="model" type="string">
  Remplace le modèle du sous-agent. Les valeurs invalides sont ignorées et le sous-agent s’exécute sur le modèle par défaut avec un avertissement dans le résultat de l’outil.
</ParamField>
<ParamField path="thinking" type="string">
  Remplace le niveau de Thinking pour l’exécution du sous-agent.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Valeur par défaut : `agents.defaults.subagents.runTimeoutSeconds` lorsqu’elle est définie, sinon `0`. Lorsqu’elle est définie, l’exécution du sous-agent est abandonnée après N secondes.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Lorsque `true`, demande une liaison de fil de canal pour cette session de sous-agent.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Si `thread: true` et que `mode` est omis, la valeur par défaut devient `session`. `mode: "session"` nécessite `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archive immédiatement après l’annonce (conserve tout de même la transcription via renommage).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` rejette le lancement sauf si l’environnement d’exécution enfant cible est sandboxé.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` branche la transcription actuelle du demandeur dans la session enfant. Sous-agents natifs uniquement. Utilisez `fork` uniquement lorsque l’enfant a besoin de la transcription actuelle.
</ParamField>

<Warning>
`sessions_spawn` n’accepte **pas** les paramètres de livraison par canal (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Pour la livraison, utilisez
`message`/`sessions_send` depuis l’exécution lancée.
</Warning>

## Sessions liées à un fil

Lorsque les liaisons de fil sont activées pour un canal, un sous-agent peut rester lié
à un fil afin que les messages utilisateur de suivi dans ce fil continuent d’être routés vers la
même session de sous-agent.

### Canaux prenant en charge les fils

**Discord** est actuellement le seul canal pris en charge. Il prend en charge
les sessions de sous-agent persistantes liées à un fil (`sessions_spawn` avec
`thread: true`), les contrôles de fil manuels (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`) et les clés d’adaptateur
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours` et
`channels.discord.threadBindings.spawnSubagentSessions`.

### Flux rapide

<Steps>
  <Step title="Spawn">
    `sessions_spawn` avec `thread: true` (et facultativement `mode: "session"`).
  </Step>
  <Step title="Bind">
    OpenClaw crée ou lie un fil à cette cible de session dans le canal actif.
  </Step>
  <Step title="Route follow-ups">
    Les réponses et les messages de suivi dans ce fil sont routés vers la session liée.
  </Step>
  <Step title="Inspect timeouts">
    Utilisez `/session idle` pour inspecter/mettre à jour le détachement automatique pour inactivité et
    `/session max-age` pour contrôler la limite stricte.
  </Step>
  <Step title="Detach">
    Utilisez `/unfocus` pour détacher manuellement.
  </Step>
</Steps>

### Contrôles manuels

| Commande           | Effet                                                                                  |
| ------------------ | -------------------------------------------------------------------------------------- |
| `/focus <target>`  | Lier le fil actuel (ou en créer un) à une cible de sous-agent/session                  |
| `/unfocus`         | Supprimer la liaison pour le fil actuellement lié                                      |
| `/agents`          | Lister les exécutions actives et l’état de liaison (`thread:<id>` ou `unbound`)        |
| `/session idle`    | Consulter/mettre à jour l’auto-désactivation de focus après inactivité (fils liés avec focus uniquement) |
| `/session max-age` | Consulter/mettre à jour la limite stricte (fils liés avec focus uniquement)            |

### Commutateurs de configuration

- **Valeur globale par défaut :** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Les clés de remplacement par canal et d’auto-liaison au spawn** sont propres à chaque adaptateur. Voir [Canaux prenant en charge les fils](#thread-supporting-channels) ci-dessus.

Voir la [Référence de configuration](/fr/gateway/configuration-reference) et les
[Commandes slash](/fr/tools/slash-commands) pour les détails actuels des adaptateurs.

### Liste d’autorisation

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Liste des ID d’agents pouvant être ciblés via `agentId` explicite (`["*"]` autorise tous les agents). Par défaut : uniquement l’agent demandeur. Si vous définissez une liste et voulez toujours que le demandeur se lance lui-même avec `agentId`, incluez l’ID du demandeur dans la liste.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Liste d’autorisation d’agents cibles par défaut utilisée lorsque l’agent demandeur ne définit pas son propre `subagents.allowAgents`.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Bloque les appels `sessions_spawn` qui omettent `agentId` (force la sélection explicite du profil). Remplacement par agent : `agents.list[].subagents.requireAgentId`.
</ParamField>

Si la session demandeuse est sandboxée, `sessions_spawn` rejette les cibles
qui s’exécuteraient sans sandbox.

### Découverte

Utilisez `agents_list` pour voir quels ID d’agents sont actuellement autorisés pour
`sessions_spawn`. La réponse inclut le modèle effectif de chaque agent listé
et les métadonnées d’exécution intégrées, afin que les appelants puissent distinguer Pi, Codex
app-server et les autres runtimes natifs configurés.

### Archivage automatique

- Les sessions de sous-agents sont automatiquement archivées après `agents.defaults.subagents.archiveAfterMinutes` (par défaut `60`).
- L’archivage utilise `sessions.delete` et renomme la transcription en `*.deleted.<timestamp>` (même dossier).
- `cleanup: "delete"` archive immédiatement après l’annonce (conserve tout de même la transcription via renommage).
- L’archivage automatique est effectué au mieux ; les timers en attente sont perdus si le Gateway redémarre.
- `runTimeoutSeconds` n’archive **pas** automatiquement ; il arrête seulement l’exécution. La session reste jusqu’à l’archivage automatique.
- L’archivage automatique s’applique de la même façon aux sessions de profondeur 1 et de profondeur 2.
- Le nettoyage du navigateur est distinct du nettoyage d’archive : les onglets/processus de navigateur suivis sont fermés au mieux lorsque l’exécution se termine, même si la transcription/l’enregistrement de session est conservé.

## Sous-agents imbriqués

Par défaut, les sous-agents ne peuvent pas lancer leurs propres sous-agents
(`maxSpawnDepth: 1`). Définissez `maxSpawnDepth: 2` pour activer un niveau
d’imbrication — le **modèle d’orchestrateur** : principal → sous-agent orchestrateur →
sous-sous-agents travailleurs.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // allow sub-agents to spawn children (default: 1)
        maxChildrenPerAgent: 5, // max active children per agent session (default: 5)
        maxConcurrent: 8, // global concurrency lane cap (default: 8)
        runTimeoutSeconds: 900, // default timeout for sessions_spawn when omitted (0 = no timeout)
      },
    },
  },
}
```

### Niveaux de profondeur

| Profondeur | Forme de la clé de session                  | Rôle                                                        | Peut lancer ?                |
| ---------- | ------------------------------------------- | ----------------------------------------------------------- | ---------------------------- |
| 0          | `agent:<id>:main`                           | Agent principal                                             | Toujours                     |
| 1          | `agent:<id>:subagent:<uuid>`                | Sous-agent (orchestrateur lorsque la profondeur 2 est autorisée) | Seulement si `maxSpawnDepth >= 2` |
| 2          | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sous-sous-agent (travailleur feuille)                       | Jamais                       |

### Chaîne d’annonce

Les résultats remontent la chaîne :

1. Le travailleur de profondeur 2 termine → annonce à son parent (orchestrateur de profondeur 1).
2. L’orchestrateur de profondeur 1 reçoit l’annonce, synthétise les résultats, termine → annonce au principal.
3. L’agent principal reçoit l’annonce et la transmet à l’utilisateur.

Chaque niveau ne voit que les annonces de ses enfants directs.

<Note>
**Recommandation opérationnelle :** démarrez le travail enfant une seule fois et attendez les événements de fin
au lieu de construire des boucles de polling autour de `sessions_list`,
`sessions_history`, `/subagents list` ou de commandes de veille `exec`.
`sessions_list` et `/subagents list` maintiennent les relations de sessions enfants
centrées sur le travail en cours — les enfants actifs restent attachés, les enfants terminés restent
visibles pendant une courte fenêtre récente, et les liens enfants obsolètes présents uniquement dans le store sont
ignorés après leur fenêtre de fraîcheur. Cela empêche les anciennes métadonnées `spawnedBy` /
`parentSessionKey` de ressusciter des enfants fantômes après un
redémarrage. Si un événement de fin d’enfant arrive après que vous avez déjà envoyé la
réponse finale, le suivi correct est le jeton silencieux exact
`NO_REPLY` / `no_reply`.
</Note>

### Politique d’outils par profondeur

- Le rôle et la portée de contrôle sont écrits dans les métadonnées de session au moment du spawn. Cela empêche les clés de session aplaties ou restaurées de retrouver accidentellement les privilèges d’orchestrateur.
- **Profondeur 1 (orchestrateur, lorsque `maxSpawnDepth >= 2`) :** reçoit `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` afin de pouvoir gérer ses enfants. Les autres outils de session/système restent refusés.
- **Profondeur 1 (feuille, lorsque `maxSpawnDepth == 1`) :** aucun outil de session (comportement actuel par défaut).
- **Profondeur 2 (travailleur feuille) :** aucun outil de session — `sessions_spawn` est toujours refusé à la profondeur 2. Ne peut pas lancer d’autres enfants.

### Limite de spawn par agent

Chaque session d’agent (à n’importe quelle profondeur) peut avoir au plus `maxChildrenPerAgent`
(par défaut `5`) enfants actifs à la fois. Cela empêche une expansion incontrôlée
à partir d’un seul orchestrateur.

### Arrêt en cascade

L’arrêt d’un orchestrateur de profondeur 1 arrête automatiquement tous ses enfants de profondeur 2 :

- `/stop` dans le chat principal arrête tous les agents de profondeur 1 et se propage à leurs enfants de profondeur 2.
- `/subagents kill <id>` arrête un sous-agent précis et se propage à ses enfants.
- `/subagents kill all` arrête tous les sous-agents pour le demandeur et se propage.

## Authentification

L’authentification du sous-agent est résolue par **ID d’agent**, et non par type de session :

- La clé de session du sous-agent est `agent:<agentId>:subagent:<uuid>`.
- Le store d’authentification est chargé depuis l’`agentDir` de cet agent.
- Les profils d’authentification de l’agent principal sont fusionnés en **fallback** ; les profils de l’agent remplacent les profils principaux en cas de conflit.

La fusion est additive, donc les profils principaux sont toujours disponibles comme
fallbacks. L’authentification totalement isolée par agent n’est pas encore prise en charge.

## Annonce

Les sous-agents rendent compte via une étape d’annonce :

- L’étape d’annonce s’exécute dans la session du sous-agent (pas dans la session demandeuse).
- Si le sous-agent répond exactement `ANNOUNCE_SKIP`, rien n’est publié.
- Si le dernier texte de l’assistant est le jeton silencieux exact `NO_REPLY` / `no_reply`, la sortie d’annonce est supprimée même si une progression visible existait auparavant.

La livraison dépend de la profondeur du demandeur :

- Les sessions demandeuses de niveau supérieur utilisent un appel `agent` de suivi avec livraison externe (`deliver=true`).
- Les sessions de sous-agent demandeuses imbriquées reçoivent une injection de suivi interne (`deliver=false`) afin que l’orchestrateur puisse synthétiser les résultats enfants dans la session.
- Si une session de sous-agent demandeuse imbriquée n’existe plus, OpenClaw se rabat sur le demandeur de cette session lorsqu’il est disponible.

Pour les sessions demandeuses de niveau supérieur, la livraison directe en mode fin
résout d’abord toute route de conversation/fil liée et tout remplacement de hook, puis remplit
les champs de cible de canal manquants depuis la route stockée de la session demandeuse.
Cela conserve les fins d’exécution dans le bon chat/sujet même lorsque l’origine de fin
n’identifie que le canal.

L’agrégation des fins d’enfants est limitée à l’exécution demandeuse actuelle lors de la
construction des constats de fin imbriqués, empêchant les sorties enfants d’exécutions
précédentes obsolètes de fuiter dans l’annonce actuelle. Les réponses d’annonce préservent
le routage de fil/sujet lorsqu’il est disponible sur les adaptateurs de canal.

### Contexte d’annonce

Le contexte d’annonce est normalisé en bloc d’événement interne stable :

| Champ             | Source                                                                                                           |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- |
| Source            | `subagent` ou `cron`                                                                                             |
| ID de session     | Clé/ID de session enfant                                                                                         |
| Type              | Type d’annonce + libellé de tâche                                                                                |
| Statut            | Dérivé du résultat runtime (`success`, `error`, `timeout` ou `unknown`) — **pas** déduit du texte du modèle      |
| Contenu du résultat | Dernier texte visible de l’assistant, sinon dernier texte d’outil/toolResult nettoyé                           |
| Suivi             | Instruction décrivant quand répondre ou rester silencieux                                                        |

Les exécutions terminales échouées signalent le statut d’échec sans rejouer le
texte de réponse capturé. En cas de timeout, si l’enfant n’a parcouru que des appels d’outils, l’annonce
peut condenser cet historique en un bref résumé de progression partielle au lieu
de rejouer la sortie brute des outils.

### Ligne de statistiques

Les charges utiles d’annonce incluent une ligne de statistiques à la fin (même lorsqu’elles sont encapsulées) :

- Runtime (par exemple `runtime 5m12s`).
- Utilisation des tokens (entrée/sortie/total).
- Coût estimé lorsque la tarification du modèle est configurée (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` et chemin de transcription afin que l’agent principal puisse récupérer l’historique via `sessions_history` ou inspecter le fichier sur disque.

Les métadonnées internes sont destinées uniquement à l’orchestration ; les réponses destinées aux utilisateurs
doivent être réécrites avec une voix d’assistant normale.

### Pourquoi préférer `sessions_history`

`sessions_history` est le chemin d’orchestration le plus sûr :

- Le rappel de l’assistant est d’abord normalisé : balises de réflexion supprimées ; échafaudage `<relevant-memories>` / `<relevant_memories>` supprimé ; blocs de charge utile XML d’appels d’outils en texte brut (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) supprimés, y compris les charges utiles tronquées qui ne se ferment jamais proprement ; échafaudage d’appel/résultat d’outil rétrogradé et marqueurs de contexte historique supprimés ; tokens de contrôle du modèle ayant fuité (`<|assistant|>`, autres ASCII `<|...|>`, pleine chasse `<｜...｜>`) supprimés ; XML d’appel d’outil MiniMax mal formé supprimé.
- Les textes ressemblant à des identifiants ou tokens sont expurgés.
- Les blocs longs peuvent être tronqués.
- Les très grands historiques peuvent supprimer les lignes anciennes ou remplacer une ligne trop volumineuse par `[sessions_history omitted: message too large]`.
- L’inspection de la transcription brute sur disque est le fallback lorsque vous avez besoin de la transcription complète octet pour octet.

## Politique d’outils

Les sous-agents utilisent d’abord le même profil et le même pipeline de politique d’outils que le parent ou
l’agent cible. Ensuite, OpenClaw applique la couche de restriction
des sous-agents.

Sans `tools.profile` restrictif, les sous-agents reçoivent **tous les outils sauf
les outils de session** et les outils système :

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` reste ici aussi une vue de rappel bornée et nettoyée — ce
n’est pas un dump brut de transcription.

Lorsque `maxSpawnDepth >= 2`, les sous-agents orchestrateurs de profondeur 1
reçoivent en plus `sessions_spawn`, `subagents`, `sessions_list` et
`sessions_history` afin de pouvoir gérer leurs enfants.

### Remplacement via configuration

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxConcurrent: 1,
      },
    },
  },
  tools: {
    subagents: {
      tools: {
        // deny wins
        deny: ["gateway", "cron"],
        // if allow is set, it becomes allow-only (deny still wins)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` est un filtre final d’autorisation uniquement. Il peut restreindre
l’ensemble d’outils déjà résolu, mais il ne peut pas **rajouter** un outil supprimé
par `tools.profile`. Par exemple, `tools.profile: "coding"` inclut
`web_search`/`web_fetch`, mais pas l’outil `browser`. Pour permettre aux
sous-agents avec le profil coding d’utiliser l’automatisation du navigateur, ajoutez browser à
l’étape du profil :

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Utilisez `agents.list[].tools.alsoAllow: ["browser"]` par agent lorsqu’un seul
agent doit obtenir l’automatisation du navigateur.

## Concurrence

Les sous-agents utilisent une voie de file d’attente dédiée dans le processus :

- **Nom de la voie :** `subagent`
- **Concurrence :** `agents.defaults.subagents.maxConcurrent` (`8` par défaut)

## Vivacité et récupération

OpenClaw ne traite pas l’absence de `endedAt` comme une preuve permanente qu’un
sous-agent est toujours actif. Les exécutions non terminées plus anciennes que la fenêtre d’exécution obsolète
cessent de compter comme actives/en attente dans `/subagents list`, les résumés d’état,
le blocage de complétion des descendants et les vérifications de concurrence par session.

Après un redémarrage du Gateway, les exécutions restaurées non terminées obsolètes sont élaguées sauf si
leur session enfant est marquée `abortedLastRun: true`. Ces
sessions enfants interrompues par le redémarrage restent récupérables via le flux de récupération des orphelins
de sous-agent, qui envoie un message de reprise synthétique avant
d’effacer le marqueur d’interruption.

La récupération automatique après redémarrage est bornée par session enfant. Si le même
enfant de sous-agent est accepté plusieurs fois pour la récupération des orphelins dans la
fenêtre de réenclenchement rapide, OpenClaw persiste une pierre tombale de récupération sur cette
session et cesse de le reprendre automatiquement lors des redémarrages ultérieurs. Exécutez
`openclaw tasks maintenance --apply` pour réconcilier l’enregistrement de tâche, ou
`openclaw doctor --fix` pour effacer les indicateurs de récupération interrompue obsolètes sur les
sessions avec pierre tombale.

<Note>
Si le lancement d’un sous-agent échoue avec Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, vérifiez l’appelant RPC avant de modifier l’état d’appairage.
La coordination interne `sessions_spawn` doit se connecter comme
`client.id: "gateway-client"` avec `client.mode: "backend"` via une authentification directe
par jeton partagé/mot de passe sur local loopback ; ce chemin ne dépend pas du
socle de portée d’appareil appairé de la CLI. Les appelants distants, les
`deviceIdentity` explicites, les chemins explicites de jeton d’appareil et les clients navigateur/node
ont toujours besoin d’une approbation d’appareil normale pour les montées de portée.
</Note>

## Arrêt

- Envoyer `/stop` dans la conversation demandeuse interrompt la session demandeuse et arrête toutes les exécutions de sous-agents actives lancées depuis celle-ci, avec propagation aux enfants imbriqués.
- `/subagents kill <id>` arrête un sous-agent spécifique et se propage à ses enfants.

## Limites

- L’annonce de sous-agent est faite **au mieux**. Si le gateway redémarre, le travail « announce back » en attente est perdu.
- Les sous-agents partagent toujours les mêmes ressources du processus gateway ; considérez `maxConcurrent` comme une soupape de sécurité.
- `sessions_spawn` est toujours non bloquant : il renvoie `{ status: "accepted", runId, childSessionKey }` immédiatement.
- Le contexte de sous-agent injecte uniquement `AGENTS.md` + `TOOLS.md` (pas de `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` ni `BOOTSTRAP.md`).
- La profondeur d’imbrication maximale est de 5 (plage de `maxSpawnDepth` : 1–5). La profondeur 2 est recommandée pour la plupart des cas d’utilisation.
- `maxChildrenPerAgent` limite le nombre d’enfants actifs par session (`5` par défaut, plage `1–20`).

## Articles connexes

- [Agents ACP](/fr/tools/acp-agents)
- [Envoi à l’agent](/fr/tools/agent-send)
- [Tâches en arrière-plan](/fr/automation/tasks)
- [Outils de bac à sable multi-agent](/fr/tools/multi-agent-sandbox-tools)
