---
read_when:
    - Vous souhaitez exécuter un travail en arrière-plan ou en parallèle via l’agent
    - Vous modifiez `sessions_spawn` ou la politique d’outil des sous-agents
    - Vous implémentez ou dépannez des sessions de sous-agent liées à un thread
sidebarTitle: Sub-agents
summary: Lancer des exécutions d’agent isolées en arrière-plan qui annoncent les résultats dans le chat demandeur
title: Sous-agents
x-i18n:
    generated_at: "2026-04-26T11:40:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: e7f2f1b8ae08026dd0f8c1b466bb7a8b044ae1d12c2ae61735dcf9f380179986
    source_path: tools/subagents.md
    workflow: 15
---

Les sous-agents sont des exécutions d’agent en arrière-plan lancées à partir d’une exécution d’agent existante.
Ils s’exécutent dans leur propre session (`agent:<agentId>:subagent:<uuid>`) et,
une fois terminés, **annoncent** leur résultat dans le canal de chat
du demandeur. Chaque exécution de sous-agent est suivie comme une
[tâche en arrière-plan](/fr/automation/tasks).

Objectifs principaux :

- Paralléliser le travail de type « recherche / tâche longue / outil lent » sans bloquer l’exécution principale.
- Garder les sous-agents isolés par défaut (séparation des sessions + sandboxing facultatif).
- Garder la surface des outils difficile à mal utiliser : les sous-agents **n’obtiennent pas** les outils de session par défaut.
- Prendre en charge une profondeur d’imbrication configurable pour les modèles d’orchestration.

<Note>
**Remarque sur les coûts :** chaque sous-agent a son propre contexte et sa propre consommation de jetons par
défaut. Pour les tâches lourdes ou répétitives, définissez un modèle moins coûteux pour les sous-agents
et gardez votre agent principal sur un modèle de meilleure qualité. Configurez cela via
`agents.defaults.subagents.model` ou via des remplacements par agent. Lorsqu’un enfant
a réellement besoin du transcript actuel du demandeur, l’agent peut demander
`context: "fork"` lors de ce lancement précis.
</Note>

## Commande slash

Utilisez `/subagents` pour inspecter ou contrôler les exécutions de sous-agents pour la **session
courante** :

```text
/subagents list
/subagents kill <id|#|all>
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
/subagents send <id|#> <message>
/subagents steer <id|#> <message>
/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]
```

`/subagents info` affiche les métadonnées d’exécution (statut, horodatages, id de session,
chemin du transcript, nettoyage). Utilisez `sessions_history` pour une
vue de rappel bornée et filtrée pour la sécurité ; inspectez le chemin du transcript sur disque lorsque vous
avez besoin du transcript brut complet.

### Contrôles de liaison au thread

Ces commandes fonctionnent sur les canaux qui prennent en charge les liaisons persistantes aux threads.
Voir [Canaux prenant en charge les threads](#thread-supporting-channels) ci-dessous.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Comportement du lancement

`/subagents spawn` démarre un sous-agent en arrière-plan comme commande utilisateur (et non comme
relais interne) et envoie une mise à jour finale unique d’achèvement au
chat demandeur lorsque l’exécution se termine.

<AccordionGroup>
  <Accordion title="Achèvement non bloquant, poussé">
    - La commande de lancement est non bloquante ; elle renvoie immédiatement un id d’exécution.
    - À la fin, le sous-agent annonce un message de résumé/résultat dans le canal de chat du demandeur.
    - L’achèvement est poussé. Une fois lancé, **n’interrogez pas** `/subagents list`, `sessions_list` ou `sessions_history` en boucle simplement pour attendre la fin ; inspectez le statut uniquement à la demande pour le débogage ou une intervention.
    - À la fin, OpenClaw ferme au mieux les onglets/processus navigateur suivis ouverts par cette session de sous-agent avant que le flux de nettoyage de l’annonce ne se poursuive.

  </Accordion>
  <Accordion title="Résilience de livraison du lancement manuel">
    - OpenClaw tente d’abord une livraison directe `agent` avec une clé d’idempotence stable.
    - Si la livraison directe échoue, il bascule vers le routage par file.
    - Si le routage par file n’est toujours pas disponible, l’annonce est retentée avec un court backoff exponentiel avant abandon final.
    - La livraison d’achèvement conserve la route résolue du demandeur : les routes d’achèvement liées à un thread ou à une conversation l’emportent lorsqu’elles sont disponibles ; si l’origine de l’achèvement ne fournit qu’un canal, OpenClaw complète la cible/le compte manquant à partir de la route résolue de la session du demandeur (`lastChannel` / `lastTo` / `lastAccountId`) afin que la livraison directe fonctionne quand même.

  </Accordion>
  <Accordion title="Métadonnées de transmission d’achèvement">
    La transmission d’achèvement à la session du demandeur est un contexte interne généré à l’exécution
    (et non un texte rédigé par l’utilisateur) et inclut :

    - `Result` — dernier texte de réponse `assistant` visible, sinon dernier texte tool/toolResult assaini. Les exécutions terminales en échec ne réutilisent pas le texte de réponse capturé.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Statistiques compactes d’exécution/jetons.
    - Une instruction de livraison indiquant à l’agent demandeur de réécrire avec une voix d’assistant normale (et non de transférer les métadonnées internes brutes).

  </Accordion>
  <Accordion title="Modes et runtime ACP">
    - `--model` et `--thinking` remplacent les valeurs par défaut pour cette exécution spécifique.
    - Utilisez `info`/`log` pour inspecter les détails et la sortie après achèvement.
    - `/subagents spawn` est un mode one-shot (`mode: "run"`). Pour les sessions persistantes liées à un thread, utilisez `sessions_spawn` avec `thread: true` et `mode: "session"`.
    - Pour les sessions de harnais ACP (Claude Code, Gemini CLI, OpenCode, ou Codex ACP/acpx explicite), utilisez `sessions_spawn` avec `runtime: "acp"` lorsque l’outil annonce ce runtime. Voir [Modèle de livraison ACP](/fr/tools/acp-agents#delivery-model) lors du débogage des achèvements ou des boucles agent-à-agent. Lorsque le plugin `codex` est activé, le contrôle de chat/thread Codex doit préférer `/codex ...` à ACP sauf si l’utilisateur demande explicitement ACP/acpx.
    - OpenClaw masque `runtime: "acp"` tant qu’ACP n’est pas activé, que le demandeur n’est pas sandboxé et qu’un plugin backend tel que `acpx` n’est pas chargé. `runtime: "acp"` attend un id de harnais ACP externe, ou une entrée `agents.list[]` avec `runtime.type="acp"` ; utilisez le runtime de sous-agent par défaut pour les agents de configuration OpenClaw normaux de `agents_list`.

  </Accordion>
</AccordionGroup>

## Modes de contexte

Les sous-agents natifs démarrent isolés sauf si l’appelant demande explicitement de forker
le transcript courant.

| Mode       | Quand l’utiliser                                                                                                                      | Comportement                                                                      |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Recherche fraîche, implémentation indépendante, travail avec outil lent, ou tout ce qui peut être décrit brièvement dans le texte de la tâche | Crée un transcript enfant propre. C’est le comportement par défaut et réduit l’usage des jetons. |
| `fork`     | Travail qui dépend de la conversation courante, de résultats d’outils précédents ou d’instructions nuancées déjà présentes dans le transcript du demandeur | Branche le transcript du demandeur dans la session enfant avant le démarrage de l’enfant. |

Utilisez `fork` avec parcimonie. Il est destiné à la délégation sensible au
contexte, et non à remplacer la rédaction d’un prompt de tâche clair.

## Outil : `sessions_spawn`

Démarre une exécution de sous-agent avec `deliver: false` sur la voie globale `subagent`,
puis exécute une étape d’annonce et publie la réponse d’annonce dans le canal de chat
du demandeur.

**Par défaut :**

- **Modèle :** hérite de l’appelant sauf si vous définissez `agents.defaults.subagents.model` (ou `agents.list[].subagents.model` par agent) ; une valeur explicite `sessions_spawn.model` l’emporte toujours.
- **Réflexion :** hérite de l’appelant sauf si vous définissez `agents.defaults.subagents.thinking` (ou `agents.list[].subagents.thinking` par agent) ; une valeur explicite `sessions_spawn.thinking` l’emporte toujours.
- **Délai d’exécution :** si `sessions_spawn.runTimeoutSeconds` est omis, OpenClaw utilise `agents.defaults.subagents.runTimeoutSeconds` lorsqu’il est défini ; sinon, il retombe à `0` (pas de délai).

### Paramètres de l’outil

<ParamField path="task" type="string" required>
  La description de la tâche pour le sous-agent.
</ParamField>
<ParamField path="label" type="string">
  Libellé lisible facultatif.
</ParamField>
<ParamField path="agentId" type="string">
  Lance sous un autre id d’agent lorsque cela est autorisé par `subagents.allowAgents`.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` est uniquement destiné aux harnais ACP externes (`claude`, `droid`, `gemini`, `opencode`, ou Codex ACP/acpx explicitement demandé) et aux entrées `agents.list[]` dont `runtime.type` vaut `acp`.
</ParamField>
<ParamField path="model" type="string">
  Remplace le modèle du sous-agent. Les valeurs invalides sont ignorées et le sous-agent s’exécute sur le modèle par défaut avec un avertissement dans le résultat de l’outil.
</ParamField>
<ParamField path="thinking" type="string">
  Remplace le niveau de réflexion pour l’exécution du sous-agent.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Vaut par défaut `agents.defaults.subagents.runTimeoutSeconds` lorsqu’il est défini, sinon `0`. Lorsqu’il est défini, l’exécution du sous-agent est interrompue après N secondes.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Lorsque `true`, demande une liaison au thread du canal pour cette session de sous-agent.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Si `thread: true` et `mode` est omis, la valeur par défaut devient `session`. `mode: "session"` exige `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archive immédiatement après l’annonce (conserve néanmoins le transcript via renommage).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` rejette le lancement à moins que le runtime enfant cible ne soit sandboxé.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` branche le transcript courant du demandeur dans la session enfant. Sous-agents natifs uniquement. Utilisez `fork` seulement lorsque l’enfant a besoin du transcript courant.
</ParamField>

<Warning>
`sessions_spawn` n’accepte **pas** les paramètres de livraison de canal (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Pour la livraison, utilisez
`message`/`sessions_send` depuis l’exécution lancée.
</Warning>

## Sessions liées à un thread

Lorsque les liaisons aux threads sont activées pour un canal, un sous-agent peut rester lié
à un thread afin que les messages utilisateur de suivi dans ce thread continuent d’être routés vers la
même session de sous-agent.

### Canaux prenant en charge les threads

**Discord** est actuellement le seul canal pris en charge. Il prend en charge
les sessions persistantes de sous-agents liées à un thread (`sessions_spawn` avec
`thread: true`), les contrôles manuels des threads (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`), et les clés d’adaptateur
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours`, et
`channels.discord.threadBindings.spawnSubagentSessions`.

### Flux rapide

<Steps>
  <Step title="Lancer">
    `sessions_spawn` avec `thread: true` (et éventuellement `mode: "session"`).
  </Step>
  <Step title="Lier">
    OpenClaw crée ou lie un thread à cette cible de session dans le canal actif.
  </Step>
  <Step title="Router les suivis">
    Les réponses et messages de suivi dans ce thread sont routés vers la session liée.
  </Step>
  <Step title="Inspecter les délais">
    Utilisez `/session idle` pour inspecter/mettre à jour la sortie automatique du focus après inactivité et
    `/session max-age` pour contrôler la limite stricte.
  </Step>
  <Step title="Détacher">
    Utilisez `/unfocus` pour détacher manuellement.
  </Step>
</Steps>

### Contrôles manuels

| Commande           | Effet                                                                |
| ------------------ | -------------------------------------------------------------------- |
| `/focus <target>`  | Lie le thread courant (ou en crée un) à une cible de sous-agent/session |
| `/unfocus`         | Supprime la liaison pour le thread actuellement lié                  |
| `/agents`          | Liste les exécutions actives et l’état des liaisons (`thread:<id>` ou `unbound`) |
| `/session idle`    | Inspecte/met à jour la sortie automatique du focus sur inactivité (threads liés focalisés uniquement) |
| `/session max-age` | Inspecte/met à jour la limite stricte (threads liés focalisés uniquement) |

### Commutateurs de configuration

- **Valeur par défaut globale :** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Le remplacement par canal et les clés de liaison automatique au lancement** sont spécifiques à l’adaptateur. Voir [Canaux prenant en charge les threads](#thread-supporting-channels) ci-dessus.

Consultez [Référence de configuration](/fr/gateway/configuration-reference) et
[Commandes slash](/fr/tools/slash-commands) pour les détails actuels de l’adaptateur.

### Allowlist

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Liste des id d’agent qui peuvent être ciblés via `agentId` (`["*"]` autorise n’importe lequel). Valeur par défaut : uniquement l’agent demandeur.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Allowlist par défaut des agents cibles utilisée lorsque l’agent demandeur ne définit pas son propre `subagents.allowAgents`.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Bloque les appels `sessions_spawn` qui omettent `agentId` (force une sélection explicite du profil). Remplacement par agent : `agents.list[].subagents.requireAgentId`.
</ParamField>

Si la session du demandeur est sandboxée, `sessions_spawn` rejette les cibles
qui s’exécuteraient sans sandbox.

### Découverte

Utilisez `agents_list` pour voir quels id d’agent sont actuellement autorisés pour
`sessions_spawn`. La réponse inclut le modèle effectif de chaque agent listé
et les métadonnées de runtime intégrées afin que les appelants puissent distinguer Pi, Codex
app-server et les autres runtimes natifs configurés.

### Archivage automatique

- Les sessions de sous-agent sont automatiquement archivées après `agents.defaults.subagents.archiveAfterMinutes` (valeur par défaut `60`).
- L’archivage utilise `sessions.delete` et renomme le transcript en `*.deleted.<timestamp>` (même dossier).
- `cleanup: "delete"` archive immédiatement après l’annonce (conserve néanmoins le transcript via renommage).
- L’archivage automatique est un best effort ; les timers en attente sont perdus si la Gateway redémarre.
- `runTimeoutSeconds` **n’archive pas** automatiquement ; il arrête seulement l’exécution. La session reste jusqu’à l’archivage automatique.
- L’archivage automatique s’applique de la même façon aux sessions de profondeur 1 et de profondeur 2.
- Le nettoyage du navigateur est distinct du nettoyage d’archivage : les onglets/processus navigateur suivis sont fermés au mieux lorsque l’exécution se termine, même si l’enregistrement transcript/session est conservé.

## Sous-agents imbriqués

Par défaut, les sous-agents ne peuvent pas lancer leurs propres sous-agents
(`maxSpawnDepth: 1`). Définissez `maxSpawnDepth: 2` pour activer un niveau
d’imbrication — le **modèle orchestrateur** : principal → sous-agent orchestrateur →
sous-sous-agents workers.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // autoriser les sous-agents à lancer des enfants (par défaut : 1)
        maxChildrenPerAgent: 5, // nombre max d’enfants actifs par session d’agent (par défaut : 5)
        maxConcurrent: 8, // plafond global de concurrence de la voie (par défaut : 8)
        runTimeoutSeconds: 900, // délai par défaut pour sessions_spawn lorsqu’il est omis (0 = pas de délai)
      },
    },
  },
}
```

### Niveaux de profondeur

| Profondeur | Forme de clé de session                        | Rôle                                          | Peut lancer ?                |
| ---------- | ---------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0          | `agent:<id>:main`                              | Agent principal                               | Toujours                     |
| 1          | `agent:<id>:subagent:<uuid>`                   | Sous-agent (orchestrateur lorsque la profondeur 2 est autorisée) | Seulement si `maxSpawnDepth >= 2` |
| 2          | `agent:<id>:subagent:<uuid>:subagent:<uuid>`   | Sous-sous-agent (worker feuille)              | Jamais                       |

### Chaîne d’annonce

Les résultats remontent dans la chaîne :

1. Le worker de profondeur 2 se termine → annonce à son parent (orchestrateur de profondeur 1).
2. L’orchestrateur de profondeur 1 reçoit l’annonce, synthétise les résultats, se termine → annonce à l’agent principal.
3. L’agent principal reçoit l’annonce et livre à l’utilisateur.

Chaque niveau ne voit que les annonces de ses enfants directs.

<Note>
**Conseil opérationnel :** démarrez le travail enfant une seule fois et attendez les
événements d’achèvement au lieu de construire des boucles de polling autour de `sessions_list`,
`sessions_history`, `/subagents list` ou de commandes `exec` avec sleep.
`sessions_list` et `/subagents list` gardent les relations de session enfant
centrées sur le travail en cours — les enfants actifs restent attachés, les enfants terminés restent
visibles pendant une courte fenêtre récente, et les liens enfants obsolètes présents uniquement en stockage sont
ignorés après leur fenêtre de fraîcheur. Cela empêche d’anciennes métadonnées `spawnedBy` /
`parentSessionKey` de ressusciter des enfants fantômes après un
redémarrage. Si un événement d’achèvement enfant arrive après que vous avez déjà envoyé la
réponse finale, le bon suivi est le jeton silencieux exact
`NO_REPLY` / `no_reply`.
</Note>

### Politique d’outil par profondeur

- Le rôle et le périmètre de contrôle sont écrits dans les métadonnées de session au moment du lancement. Cela évite que des clés de session plates ou restaurées retrouvent accidentellement des privilèges d’orchestrateur.
- **Profondeur 1 (orchestrateur, lorsque `maxSpawnDepth >= 2`) :** obtient `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` afin de pouvoir gérer ses enfants. Les autres outils de session/système restent refusés.
- **Profondeur 1 (feuille, lorsque `maxSpawnDepth == 1`) :** aucun outil de session (comportement par défaut actuel).
- **Profondeur 2 (worker feuille) :** aucun outil de session — `sessions_spawn` est toujours refusé à la profondeur 2. Ne peut pas lancer d’autres enfants.

### Limite de lancement par agent

Chaque session d’agent (à n’importe quelle profondeur) peut avoir au plus `maxChildrenPerAgent`
(valeur par défaut `5`) enfants actifs à la fois. Cela évite un fan-out incontrôlé
depuis un seul orchestrateur.

### Arrêt en cascade

L’arrêt d’un orchestrateur de profondeur 1 arrête automatiquement tous ses enfants de profondeur 2 :

- `/stop` dans le chat principal arrête tous les agents de profondeur 1 et cascade vers leurs enfants de profondeur 2.
- `/subagents kill <id>` arrête un sous-agent spécifique et cascade vers ses enfants.
- `/subagents kill all` arrête tous les sous-agents du demandeur et cascade.

## Authentification

L’authentification des sous-agents est résolue par **id d’agent**, et non par type de session :

- La clé de session du sous-agent est `agent:<agentId>:subagent:<uuid>`.
- Le magasin d’authentification est chargé depuis le `agentDir` de cet agent.
- Les profils d’authentification de l’agent principal sont fusionnés comme **repli** ; les profils de l’agent remplacent les profils principaux en cas de conflit.

La fusion est additive, de sorte que les profils principaux sont toujours disponibles comme
replis. Une authentification entièrement isolée par agent n’est pas encore prise en charge.

## Annonce

Les sous-agents rapportent via une étape d’annonce :

- L’étape d’annonce s’exécute dans la session du sous-agent (et non dans la session du demandeur).
- Si le sous-agent répond exactement `ANNOUNCE_SKIP`, rien n’est publié.
- Si le dernier texte assistant est le jeton silencieux exact `NO_REPLY` / `no_reply`, la sortie d’annonce est supprimée même s’il y a eu auparavant une progression visible.

La livraison dépend de la profondeur du demandeur :

- Les sessions demandeur de niveau supérieur utilisent un appel `agent` de suivi avec livraison externe (`deliver=true`).
- Les sessions de sous-agent demandeur imbriquées reçoivent une injection de suivi interne (`deliver=false`) afin que l’orchestrateur puisse synthétiser les résultats enfants dans la session.
- Si une session de sous-agent demandeur imbriquée a disparu, OpenClaw se rabat sur le demandeur de cette session lorsqu’il est disponible.

Pour les sessions demandeur de niveau supérieur, la livraison directe en mode achèvement
résout d’abord toute route de conversation/thread liée et tout remplacement de hook, puis complète les
champs de cible de canal manquants à partir de la route stockée de la session demandeur.
Cela maintient les achèvements dans le bon chat/sujet même lorsque l’origine de l’achèvement
n’identifie que le canal.

L’agrégation des achèvements enfants est limitée à l’exécution demandeur courante lors de
la construction des constats d’achèvement imbriqués, empêchant des sorties d’enfants d’exécutions précédentes et obsolètes
de fuiter dans l’annonce courante. Les réponses d’annonce conservent le
routage thread/sujet lorsqu’il est disponible sur les adaptateurs de canal.

### Contexte d’annonce

Le contexte d’annonce est normalisé en un bloc d’événement interne stable :

| Champ          | Source                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Source         | `subagent` ou `cron`                                                                                          |
| Id de session  | Clé/id de session enfant                                                                                      |
| Type           | Type d’annonce + libellé de tâche                                                                             |
| Statut         | Dérivé du résultat d’exécution (`success`, `error`, `timeout` ou `unknown`) — **non** déduit du texte du modèle |
| Contenu du résultat | Dernier texte assistant visible, sinon dernier texte tool/toolResult assaini                               |
| Suivi          | Instruction décrivant quand répondre vs rester silencieux                                                     |

Les exécutions terminales en échec rapportent un statut d’échec sans rejouer le
texte de réponse capturé. En cas de délai, si l’enfant n’est allé que jusqu’aux appels d’outil, l’annonce
peut réduire cet historique à un court résumé de progression partielle
au lieu de rejouer la sortie brute des outils.

### Ligne de statistiques

Les charges utiles d’annonce incluent une ligne de statistiques à la fin (même lorsqu’elles sont encapsulées) :

- Runtime (par ex. `runtime 5m12s`).
- Usage de jetons (entrée/sortie/total).
- Coût estimé lorsque la tarification du modèle est configurée (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` et chemin du transcript afin que l’agent principal puisse récupérer l’historique via `sessions_history` ou inspecter le fichier sur disque.

Les métadonnées internes sont destinées uniquement à l’orchestration ; les réponses destinées à l’utilisateur
doivent être réécrites avec une voix d’assistant normale.

### Pourquoi préférer `sessions_history`

`sessions_history` est le chemin d’orchestration le plus sûr :

- Le rappel assistant est d’abord normalisé : balises de réflexion supprimées ; échafaudage `<relevant-memories>` / `<relevant_memories>` supprimé ; blocs de charge utile XML d’appel d’outil en texte brut (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) supprimés, y compris les charges utiles tronquées qui ne se ferment jamais proprement ; échafaudage dégradé d’appel d’outil/résultat et marqueurs de contexte historique supprimés ; jetons de contrôle de modèle divulgués (`<|assistant|>`, autres formes ASCII `<|...|>`, formes full-width `<｜...｜>`) supprimés ; XML d’appel d’outil MiniMax mal formé supprimé.
- Les textes ressemblant à des identifiants/tokens sont expurgés.
- Les blocs longs peuvent être tronqués.
- Les historiques très volumineux peuvent supprimer les lignes les plus anciennes ou remplacer une ligne surdimensionnée par `[sessions_history omitted: message too large]`.
- L’inspection brute du transcript sur disque est la solution de repli lorsque vous avez besoin du transcript complet octet par octet.

## Politique d’outil

Les sous-agents utilisent d’abord le même pipeline de profil et de politique d’outils que l’agent parent ou
l’agent cible. Après cela, OpenClaw applique la couche de restriction des sous-agents.

Sans `tools.profile` restrictif, les sous-agents obtiennent **tous les outils sauf
les outils de session** et les outils système :

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` reste ici aussi une vue de rappel bornée et assainie — ce
n’est pas un dump brut du transcript.

Lorsque `maxSpawnDepth >= 2`, les sous-agents orchestrateurs de profondeur 1
reçoivent en plus `sessions_spawn`, `subagents`, `sessions_list`, et
`sessions_history` afin de pouvoir gérer leurs enfants.

### Remplacement via la configuration

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
        // deny l’emporte
        deny: ["gateway", "cron"],
        // si allow est défini, cela devient allow-only (deny l’emporte toujours)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` est un filtre final allow-only. Il peut restreindre
l’ensemble d’outils déjà résolu, mais il ne peut pas **réajouter**
un outil supprimé par `tools.profile`. Par exemple, `tools.profile: "coding"` inclut
`web_search`/`web_fetch` mais pas l’outil `browser`. Pour permettre aux
sous-agents avec profil coding d’utiliser l’automatisation du navigateur, ajoutez `browser` au
stade du profil :

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Utilisez `agents.list[].tools.alsoAllow: ["browser"]` lorsqu’un seul
agent doit obtenir l’automatisation du navigateur.

## Concurrence

Les sous-agents utilisent une voie de file dédiée en processus :

- **Nom de la voie :** `subagent`
- **Concurrence :** `agents.defaults.subagents.maxConcurrent` (valeur par défaut `8`)

## Vivacité et récupération

OpenClaw ne considère pas l’absence de `endedAt` comme une preuve permanente qu’un
sous-agent est toujours actif. Les exécutions non terminées plus anciennes que la fenêtre d’exécution obsolète
cessent d’être comptées comme actives/en attente dans `/subagents list`, les résumés d’état,
la barrière d’achèvement des descendants, et les vérifications de concurrence par session.

Après un redémarrage de la Gateway, les exécutions restaurées obsolètes non terminées sont élaguées sauf
si leur session enfant est marquée `abortedLastRun: true`. Ces
sessions enfants interrompues au redémarrage restent récupérables via le flux de récupération des sous-agents orphelins, qui envoie un message de reprise synthétique avant
d’effacer le marqueur d’interruption.

<Note>
Si un lancement de sous-agent échoue avec Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, vérifiez l’appelant RPC avant de modifier l’état d’appairage.
La coordination interne de `sessions_spawn` doit se connecter en tant que
`client.id: "gateway-client"` avec `client.mode: "backend"` via une authentification directe
loopback par jeton partagé/mot de passe ; ce chemin ne dépend pas de la base de portée d’appareil appairé du CLI. Les appelants distants, les chemins explicites
`deviceIdentity`, les chemins explicites de jeton d’appareil, ainsi que les clients navigateur/node
ont toujours besoin de l’approbation normale de l’appareil pour les montées de portée.
</Note>

## Arrêt

- Envoyer `/stop` dans le chat du demandeur interrompt la session du demandeur et arrête toutes les exécutions de sous-agent actives lancées depuis celle-ci, avec cascade vers les enfants imbriqués.
- `/subagents kill <id>` arrête un sous-agent spécifique et cascade vers ses enfants.

## Limitations

- L’annonce du sous-agent est en **best effort**. Si la Gateway redémarre, le travail « annonce en retour » en attente est perdu.
- Les sous-agents partagent toujours les mêmes ressources de processus Gateway ; considérez `maxConcurrent` comme une soupape de sécurité.
- `sessions_spawn` est toujours non bloquant : il renvoie immédiatement `{ status: "accepted", runId, childSessionKey }`.
- Le contexte du sous-agent n’injecte que `AGENTS.md` + `TOOLS.md` (pas de `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` ni `BOOTSTRAP.md`).
- La profondeur d’imbrication maximale est de 5 (plage `maxSpawnDepth` : 1–5). La profondeur 2 est recommandée pour la plupart des cas d’usage.
- `maxChildrenPerAgent` limite le nombre d’enfants actifs par session (valeur par défaut `5`, plage `1–20`).

## Liens associés

- [Agents ACP](/fr/tools/acp-agents)
- [Agent send](/fr/tools/agent-send)
- [Tâches en arrière-plan](/fr/automation/tasks)
- [Outils sandbox multi-agents](/fr/tools/multi-agent-sandbox-tools)
