---
read_when:
    - Vous souhaitez effectuer un travail en arrière-plan ou en parallèle via l’agent
    - Vous modifiez la politique de sessions_spawn ou de l’outil de sous-agent
    - Vous implémentez ou dépannez des sessions de sous-agents liées à un fil
sidebarTitle: Sub-agents
summary: Lancer des exécutions isolées d’agents en arrière-plan qui annoncent les résultats dans la discussion du demandeur
title: Sous-agents
x-i18n:
    generated_at: "2026-05-11T21:00:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 02b03bdfd5cddf5618fddf0804f017400c36751095166dac18fa35fa3bfd4c6e
    source_path: tools/subagents.md
    workflow: 16
---

Les sous-agents sont des exécutions d’agents en arrière-plan créées depuis une exécution d’agent existante.
Ils s’exécutent dans leur propre session (`agent:<agentId>:subagent:<uuid>`) et,
une fois terminés, **annoncent** leur résultat au canal de chat
du demandeur. Chaque exécution de sous-agent est suivie comme une
[tâche en arrière-plan](/fr/automation/tasks).

Objectifs principaux :

- Paralléliser le travail de « recherche / tâche longue / outil lent » sans bloquer l’exécution principale.
- Garder les sous-agents isolés par défaut (séparation des sessions + sandboxing facultatif).
- Rendre la surface d’outils difficile à utiliser de travers : les sous-agents ne reçoivent **pas** les outils de session par défaut.
- Prendre en charge une profondeur d’imbrication configurable pour les modèles d’orchestrateur.

<Note>
**Note sur les coûts :** chaque sous-agent possède son propre contexte et sa propre consommation de tokens par
défaut. Pour les tâches lourdes ou répétitives, définissez un modèle moins coûteux pour les sous-agents
et gardez votre agent principal sur un modèle de meilleure qualité. Configurez via
`agents.defaults.subagents.model` ou des remplacements par agent. Lorsqu’un enfant
    a réellement besoin de la transcription actuelle du demandeur, l’agent peut demander
    `context: "fork"` pour cette création uniquement. Les sessions de sous-agent liées à un fil de discussion utilisent par défaut
    `context: "fork"` parce qu’elles dérivent la conversation actuelle vers un
    fil de suivi.
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

Utilisez [`/steer <message>`](/fr/tools/steer) au niveau supérieur pour orienter l’exécution active de la session demandeuse actuelle. Utilisez `/subagents steer <id|#> <message>` lorsque la cible est une exécution enfant.

`/subagents info` affiche les métadonnées de l’exécution (statut, horodatages, identifiant de session,
chemin de transcription, nettoyage). Utilisez `sessions_history` pour une vue de rappel bornée
et filtrée pour la sécurité ; inspectez le chemin de transcription sur disque lorsque vous
avez besoin de la transcription brute complète.

### Contrôles de liaison aux fils de discussion

Ces commandes fonctionnent sur les canaux qui prennent en charge les liaisons persistantes aux fils de discussion.
Consultez [Canaux prenant en charge les fils de discussion](#thread-supporting-channels) ci-dessous.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Comportement de création

`/subagents spawn` démarre un sous-agent en arrière-plan comme commande utilisateur (pas comme
relais interne) et renvoie une mise à jour finale d’achèvement au
chat demandeur lorsque l’exécution se termine.

<AccordionGroup>
  <Accordion title="Achèvement non bloquant, basé sur les notifications">
    - La commande de création est non bloquante ; elle renvoie immédiatement un identifiant d’exécution.
    - À l’achèvement, le sous-agent annonce un message de résumé/résultat au canal de chat du demandeur.
    - Les tours d’agent qui ont besoin des résultats d’enfants doivent appeler `sessions_yield` après avoir créé le travail requis. Cela termine le tour actuel et permet aux événements d’achèvement d’arriver comme prochain message visible par le modèle.
    - L’achèvement est basé sur les notifications. Une fois créé, ne sondez **pas** `/subagents list`, `sessions_list` ou `sessions_history` en boucle simplement pour attendre sa fin ; inspectez le statut uniquement à la demande pour le débogage ou l’intervention.
    - La sortie de l’enfant est un rapport/une preuve destinée à être synthétisée par l’agent demandeur. Ce n’est pas un texte d’instruction rédigé par l’utilisateur et elle ne peut pas remplacer les politiques système, développeur ou utilisateur.
    - À l’achèvement, OpenClaw ferme au mieux les onglets/processus de navigateur suivis ouverts par cette session de sous-agent avant la poursuite du flux de nettoyage d’annonce.

  </Accordion>
  <Accordion title="Résilience de livraison des créations manuelles">
    - OpenClaw renvoie les achèvements à la session demandeuse via un tour `agent` avec une clé d’idempotence stable.
    - Si l’exécution demandeuse est encore active, OpenClaw essaie d’abord de réveiller/orienter cette exécution au lieu de démarrer un second chemin de réponse visible.
    - Si le transfert d’achèvement vers l’agent demandeur échoue ou ne produit aucune sortie visible, OpenClaw considère la livraison comme échouée et se replie sur le routage par file d’attente/la nouvelle tentative. Il n’envoie pas directement le résultat brut de l’enfant au chat externe.
    - Si le transfert direct ne peut pas être utilisé, il se replie sur le routage par file d’attente.
    - Si le routage par file d’attente n’est toujours pas disponible, l’annonce est retentée avec un court backoff exponentiel avant l’abandon final.
    - La livraison de l’achèvement conserve la route demandeuse résolue : les routes d’achèvement liées au fil de discussion ou à la conversation l’emportent lorsqu’elles sont disponibles ; si l’origine de l’achèvement ne fournit qu’un canal, OpenClaw renseigne la cible/le compte manquant depuis la route résolue de la session demandeuse (`lastChannel` / `lastTo` / `lastAccountId`) afin que la livraison directe fonctionne toujours.

  </Accordion>
  <Accordion title="Métadonnées de transfert d’achèvement">
    Le transfert d’achèvement vers la session demandeuse est un contexte interne généré par le runtime
    (pas du texte rédigé par l’utilisateur) et inclut :

    - `Result` — dernier texte de réponse `assistant` visible, sinon dernier texte d’outil/toolResult nettoyé. Les exécutions terminales échouées ne réutilisent pas le texte de réponse capturé.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Statistiques compactes de runtime/tokens.
    - Une instruction de livraison indiquant à l’agent demandeur de réécrire avec une voix d’assistant normale (sans transférer les métadonnées internes brutes).

  </Accordion>
  <Accordion title="Modes et runtime ACP">
    - `--model` et `--thinking` remplacent les valeurs par défaut pour cette exécution spécifique.
    - Utilisez `info`/`log` pour inspecter les détails et la sortie après l’achèvement.
    - `/subagents spawn` est un mode ponctuel (`mode: "run"`). Pour les sessions persistantes liées à un fil de discussion, utilisez `sessions_spawn` avec `thread: true` et `mode: "session"`.
    - Pour les sessions de harnais ACP (Claude Code, Gemini CLI, OpenCode, ou Codex ACP/acpx explicite), utilisez `sessions_spawn` avec `runtime: "acp"` lorsque l’outil annonce ce runtime. Consultez le [modèle de livraison ACP](/fr/tools/acp-agents#delivery-model) lors du débogage des achèvements ou des boucles agent-à-agent. Lorsque le Plugin `codex` est activé, le contrôle du chat/fil de discussion Codex doit privilégier `/codex ...` plutôt qu’ACP, sauf si l’utilisateur demande explicitement ACP/acpx.
    - OpenClaw masque `runtime: "acp"` jusqu’à ce qu’ACP soit activé, que le demandeur ne soit pas sandboxé et qu’un Plugin backend tel que `acpx` soit chargé. `runtime: "acp"` attend un identifiant de harnais ACP externe, ou une entrée `agents.list[]` avec `runtime.type="acp"` ; utilisez le runtime de sous-agent par défaut pour les agents de configuration OpenClaw normaux provenant de `agents_list`.

  </Accordion>
</AccordionGroup>

## Modes de contexte

Les sous-agents natifs démarrent isolés, sauf si l’appelant demande explicitement de forker
la transcription actuelle.

| Mode       | Quand l’utiliser                                                                                                                       | Comportement                                                                      |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Recherche nouvelle, implémentation indépendante, travail d’outil lent, ou tout ce qui peut être résumé dans le texte de la tâche       | Crée une transcription enfant propre. C’est la valeur par défaut et cela réduit l’utilisation des tokens. |
| `fork`     | Travail qui dépend de la conversation actuelle, de résultats d’outils précédents ou d’instructions nuancées déjà présentes dans la transcription du demandeur | Branche la transcription du demandeur dans la session enfant avant le démarrage de l’enfant. |

Utilisez `fork` avec parcimonie. Il est destiné à la délégation sensible au contexte, pas à
remplacer la rédaction d’une invite de tâche claire.

## Outil : `sessions_spawn`

Démarre une exécution de sous-agent avec `deliver: false` sur la voie globale `subagent`,
puis exécute une étape d’annonce et publie la réponse d’annonce dans le canal de
chat du demandeur.

La disponibilité dépend de la politique d’outils effective de l’appelant. Les profils `coding` et
`full` exposent `sessions_spawn` par défaut. Le profil `messaging`
ne le fait pas ; ajoutez `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` ou utilisez `tools.profile: "coding"` pour les agents qui doivent déléguer
du travail. Les politiques d’autorisation/refus par canal/groupe, provider, sandbox et par agent peuvent
toujours retirer l’outil après l’étape de profil. Utilisez `/tools` depuis la même
session pour confirmer la liste d’outils effective.

**Valeurs par défaut :**

- **Modèle :** hérite de l’appelant sauf si vous définissez `agents.defaults.subagents.model` (ou `agents.list[].subagents.model` par agent) ; un `sessions_spawn.model` explicite l’emporte toujours.
- **Thinking :** hérite de l’appelant sauf si vous définissez `agents.defaults.subagents.thinking` (ou `agents.list[].subagents.thinking` par agent) ; un `sessions_spawn.thinking` explicite l’emporte toujours.
- **Délai d’exécution :** si `sessions_spawn.runTimeoutSeconds` est omis, OpenClaw utilise `agents.defaults.subagents.runTimeoutSeconds` lorsqu’il est défini ; sinon, il se replie sur `0` (aucun délai).

### Mode d’invite de délégation

`agents.defaults.subagents.delegationMode` contrôle uniquement le guidage de l’invite ; il ne modifie pas la politique d’outils et n’impose pas la délégation.

- `suggest` (par défaut) : conserve l’incitation standard de l’invite à utiliser des sous-agents pour le travail plus important ou plus lent.
- `prefer` : indique à l’agent principal de rester réactif et de déléguer via `sessions_spawn` tout ce qui est plus impliqué qu’une réponse directe.

Les remplacements par agent utilisent `agents.list[].subagents.delegationMode`.

```json5
{
  agents: {
    defaults: {
      subagents: {
        delegationMode: "prefer",
        maxConcurrent: 4,
      },
    },
    list: [
      {
        id: "coordinator",
        subagents: { delegationMode: "prefer" },
      },
    ],
  },
}
```

### Paramètres de l’outil

<ParamField path="task" type="string" required>
  Description de la tâche pour le sous-agent.
</ParamField>
<ParamField path="taskName" type="string">
  Identifiant stable facultatif pour un ciblage ultérieur par `subagents`. Doit correspondre à `[a-z][a-z0-9_]{0,63}` et ne peut pas être une cible réservée comme `last` ou `all`. Préférez-le quand le coordinateur peut avoir besoin d’orienter, d’arrêter ou d’identifier un enfant précis après avoir lancé plusieurs enfants.
</ParamField>
<ParamField path="label" type="string">
  Libellé facultatif lisible par un humain.
</ParamField>
<ParamField path="agentId" type="string">
  Lancer sous un autre identifiant d’agent lorsque `subagents.allowAgents` l’autorise.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` est réservé aux harnais ACP externes (`claude`, `droid`, `gemini`, `opencode` ou Codex ACP/acpx explicitement demandé) et aux entrées `agents.list[]` dont `runtime.type` est `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  ACP uniquement. Reprend une session existante de harnais ACP lorsque `runtime: "acp"` ; ignoré pour les lancements de sous-agents natifs.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  ACP uniquement. Diffuse la sortie de l’exécution ACP vers la session parente lorsque `runtime: "acp"` ; à omettre pour les lancements de sous-agents natifs.
</ParamField>
<ParamField path="model" type="string">
  Remplace le modèle du sous-agent. Les valeurs non valides sont ignorées et le sous-agent s’exécute sur le modèle par défaut, avec un avertissement dans le résultat de l’outil.
</ParamField>
<ParamField path="thinking" type="string">
  Remplace le niveau de réflexion pour l’exécution du sous-agent.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Vaut par défaut `agents.defaults.subagents.runTimeoutSeconds` lorsque défini, sinon `0`. Lorsque défini, l’exécution du sous-agent est interrompue après N secondes.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Lorsque `true`, demande une liaison au fil de discussion du canal pour cette session de sous-agent.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Si `thread: true` et que `mode` est omis, la valeur par défaut devient `session`. `mode: "session"` nécessite `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archive immédiatement après l’annonce (conserve tout de même la transcription via renommage).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` rejette le lancement sauf si l’exécution enfant cible est en bac à sable.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` branche la transcription actuelle du demandeur dans la session enfant. Sous-agents natifs uniquement. Les lancements liés à un fil utilisent `fork` par défaut ; les lancements non liés à un fil utilisent `isolated` par défaut.
</ParamField>

<Warning>
`sessions_spawn` n’accepte **pas** les paramètres de livraison au canal (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Pour la livraison, utilisez
`message`/`sessions_send` depuis l’exécution lancée.
</Warning>

### Noms de tâches et ciblage

`taskName` est un identifiant destiné au modèle pour l’orchestration, pas une clé de session.
Utilisez-le pour des noms d’enfants stables comme `review_subagents`,
`linux_validation` ou `docs_update` lorsqu’un coordinateur peut avoir besoin d’orienter
ou d’arrêter cet enfant plus tard.

La résolution de cible accepte les correspondances exactes de `taskName` et les
préfixes non ambigus. La correspondance est limitée à la même fenêtre de cibles
actives/récentes que celle utilisée par les cibles `/subagents` numérotées, de sorte
qu’un enfant ancien terminé ne rend pas ambigu un identifiant réutilisé. Si deux
enfants actifs ou récents partagent le même `taskName`, la cible est ambiguë ;
utilisez plutôt l’index de liste, la clé de session ou l’identifiant d’exécution.

Les cibles réservées `last` et `all` ne sont pas des valeurs `taskName` valides
car elles ont déjà une signification de contrôle.

## Outil : `sessions_yield`

Termine le tour actuel du modèle et attend que les événements d’exécution,
principalement les événements d’achèvement de sous-agent, arrivent comme message suivant. Utilisez-le après
avoir lancé le travail enfant requis lorsque le demandeur ne peut pas produire de réponse finale
avant l’arrivée de ces achèvements.

`sessions_yield` est la primitive d’attente. Ne la remplacez pas par des boucles
d’interrogation sur `subagents`, `sessions_list`, `sessions_history`, un
`sleep` shell ou une interrogation de processus uniquement pour détecter l’achèvement d’un enfant.

N’utilisez `sessions_yield` que lorsque la liste effective d’outils de la session l’inclut.
Certains profils d’outils minimaux ou personnalisés peuvent exposer `sessions_spawn` et
`subagents` sans exposer `sessions_yield` ; dans ce cas, n’inventez pas
une boucle d’interrogation uniquement pour attendre l’achèvement.

Lorsque des enfants actifs existent, OpenClaw injecte un bloc d’invite compact
`Active Subagents` généré par l’exécution dans les tours normaux afin que le demandeur puisse voir
les sessions enfant actuelles, les identifiants d’exécution, les statuts, les libellés, les tâches et
les alias `taskName` sans interrogation. Les champs de tâche et de libellé dans ce
bloc sont cités comme des données, pas comme des instructions, car ils peuvent provenir
d’arguments de lancement fournis par l’utilisateur ou le modèle.

## Outil : `subagents`

Liste, oriente ou arrête les exécutions de sous-agents lancées et possédées par la session
demandeuse. Sa portée est limitée au demandeur actuel ; un enfant peut seulement
voir/contrôler ses propres enfants contrôlés.

Utilisez `subagents` pour l’état à la demande, le débogage, l’orientation ou l’arrêt.
Utilisez `sessions_yield` pour attendre les événements d’achèvement.

## Sessions liées à un fil

Lorsque les liaisons à un fil sont activées pour un canal, un sous-agent peut rester lié
à un fil afin que les messages utilisateur de suivi dans ce fil continuent d’être routés vers la
même session de sous-agent.

### Canaux prenant en charge les fils

**Discord** est actuellement le seul canal pris en charge. Il prend en charge
les sessions de sous-agent persistantes liées à un fil (`sessions_spawn` avec
`thread: true`), les contrôles manuels de fil (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`) et les clés d’adaptateur
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours` et
`channels.discord.threadBindings.spawnSessions`.

### Flux rapide

<Steps>
  <Step title="Lancer">
    `sessions_spawn` avec `thread: true` (et éventuellement `mode: "session"`).
  </Step>
  <Step title="Lier">
    OpenClaw crée ou lie un fil à cette cible de session dans le canal actif.
  </Step>
  <Step title="Router les suivis">
    Les réponses et les messages de suivi dans ce fil sont routés vers la session liée.
  </Step>
  <Step title="Inspecter les délais d’expiration">
    Utilisez `/session idle` pour inspecter/mettre à jour le désancrage automatique en cas d’inactivité et
    `/session max-age` pour contrôler la limite stricte.
  </Step>
  <Step title="Détacher">
    Utilisez `/unfocus` pour détacher manuellement.
  </Step>
</Steps>

### Contrôles manuels

| Commande           | Effet                                                                 |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Lie le fil actuel (ou en crée un) à une cible de sous-agent/session    |
| `/unfocus`         | Supprime la liaison du fil actuellement lié                            |
| `/agents`          | Liste les exécutions actives et l’état de liaison (`thread:<id>` ou `unbound`) |
| `/session idle`    | Inspecte/met à jour le désancrage automatique après inactivité (fils liés focalisés uniquement) |
| `/session max-age` | Inspecte/met à jour la limite stricte (fils liés focalisés uniquement) |

### Commutateurs de configuration

- **Valeur par défaut globale :** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Les clés de remplacement de canal et de liaison automatique au lancement** sont spécifiques à l’adaptateur. Consultez [Canaux prenant en charge les fils](#thread-supporting-channels) ci-dessus.

Consultez la [référence de configuration](/fr/gateway/configuration-reference) et
les [commandes slash](/fr/tools/slash-commands) pour les détails actuels des adaptateurs.

### Liste d’autorisation

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Liste des identifiants d’agents pouvant être ciblés via un `agentId` explicite (`["*"]` autorise n’importe lequel). Par défaut : uniquement l’agent demandeur. Si vous définissez une liste et souhaitez tout de même que le demandeur se lance lui-même avec `agentId`, incluez l’identifiant du demandeur dans la liste.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Liste d’autorisation d’agents cibles par défaut utilisée lorsque l’agent demandeur ne définit pas son propre `subagents.allowAgents`.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Bloque les appels `sessions_spawn` qui omettent `agentId` (force la sélection explicite du profil). Remplacement par agent : `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Délai d’expiration par appel pour les tentatives de livraison d’annonce `agent` du gateway. Les valeurs sont des millisecondes entières positives et sont plafonnées à la valeur maximale de temporisateur sûre pour la plateforme. Les nouvelles tentatives transitoires peuvent rendre l’attente totale d’annonce plus longue qu’un délai d’expiration configuré.
</ParamField>

Si la session demandeuse est en bac à sable, `sessions_spawn` rejette les cibles
qui s’exécuteraient sans bac à sable.

### Découverte

Utilisez `agents_list` pour voir quels identifiants d’agents sont actuellement autorisés pour
`sessions_spawn`. La réponse inclut le modèle effectif de chaque agent listé
et les métadonnées d’exécution intégrées afin que les appelants puissent distinguer PI, le serveur d’application Codex
et les autres exécutions natives configurées.

### Archivage automatique

- Les sessions de sous-agent sont automatiquement archivées après `agents.defaults.subagents.archiveAfterMinutes` (valeur par défaut `60`).
- L’archive utilise `sessions.delete` et renomme la transcription en `*.deleted.<timestamp>` (même dossier).
- `cleanup: "delete"` archive immédiatement après l’annonce (conserve tout de même la transcription via renommage).
- L’archivage automatique est fourni au mieux ; les temporisateurs en attente sont perdus si le gateway redémarre.
- `runTimeoutSeconds` n’archive **pas** automatiquement ; il arrête seulement l’exécution. La session reste jusqu’à l’archivage automatique.
- L’archivage automatique s’applique aussi bien aux sessions de profondeur 1 qu’aux sessions de profondeur 2.
- Le nettoyage du navigateur est séparé du nettoyage d’archive : les onglets/processus de navigateur suivis sont fermés au mieux lorsque l’exécution se termine, même si la transcription/l’enregistrement de session est conservé.

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
        announceTimeoutMs: 120000, // per-call gateway announce timeout
      },
    },
  },
}
```

### Niveaux de profondeur

| Profondeur | Forme de clé de session                      | Rôle                                          | Peut lancer ?                |
| ---------- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0          | `agent:<id>:main`                            | Agent principal                               | Toujours                     |
| 1          | `agent:<id>:subagent:<uuid>`                 | Sous-agent (orchestrateur lorsque la profondeur 2 est autorisée) | Seulement si `maxSpawnDepth >= 2` |
| 2          | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sous-sous-agent (travailleur feuille)         | Jamais                       |

### Chaîne d’annonce

Les résultats remontent la chaîne :

1. Le travailleur de profondeur 2 termine → annonce à son parent (orchestrateur de profondeur 1).
2. L’orchestrateur de profondeur 1 reçoit l’annonce, synthétise les résultats, termine → annonce au principal.
3. L’agent principal reçoit l’annonce et la transmet à l’utilisateur.

Chaque niveau ne voit que les annonces de ses enfants directs.

<Note>
**Consigne opérationnelle :** lancez le travail enfant une seule fois et attendez les événements
de fin au lieu de construire des boucles de sondage autour de `sessions_list`,
`sessions_history`, `/subagents list` ou de commandes `exec` avec veille.
`sessions_list` et `/subagents list` gardent les relations de sessions enfants
centrées sur le travail actif — les enfants actifs restent attachés, les enfants terminés restent
visibles pendant une courte fenêtre récente, et les liens enfants obsolètes présents uniquement dans le stockage sont
ignorés après leur fenêtre de fraîcheur. Cela empêche les anciennes métadonnées
`spawnedBy` / `parentSessionKey` de ressusciter des enfants fantômes après un
redémarrage. Si un événement de fin d’enfant arrive après que vous avez déjà envoyé la
réponse finale, le suivi correct est le jeton silencieux exact
`NO_REPLY` / `no_reply`.
</Note>

### Politique des outils par profondeur

- Le rôle et le périmètre de contrôle sont inscrits dans les métadonnées de session au moment du spawn. Cela empêche les clés de session plates ou restaurées de récupérer accidentellement les privilèges d’orchestrateur.
- **Profondeur 1 (orchestrateur, lorsque `maxSpawnDepth >= 2`) :** reçoit `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` afin de pouvoir gérer ses enfants. Les autres outils de session/système restent refusés.
- **Profondeur 1 (feuille, lorsque `maxSpawnDepth == 1`) :** aucun outil de session (comportement par défaut actuel).
- **Profondeur 2 (worker feuille) :** aucun outil de session — `sessions_spawn` est toujours refusé à la profondeur 2. Impossible de créer d’autres enfants.

### Limite de spawn par agent

Chaque session d’agent (à n’importe quelle profondeur) peut avoir au maximum `maxChildrenPerAgent`
(par défaut `5`) enfants actifs à la fois. Cela évite une dispersion incontrôlée
depuis un seul orchestrateur.

### Arrêt en cascade

L’arrêt d’un orchestrateur de profondeur 1 arrête automatiquement tous ses enfants de profondeur 2 :

- `/stop` dans la conversation principale arrête tous les agents de profondeur 1 et se répercute sur leurs enfants de profondeur 2.
- `/subagents kill <id>` arrête un sous-agent précis et se répercute sur ses enfants.
- `/subagents kill all` arrête tous les sous-agents du demandeur et se répercute en cascade.

## Authentification

L’authentification des sous-agents est résolue par **ID d’agent**, et non par type de session :

- La clé de session du sous-agent est `agent:<agentId>:subagent:<uuid>`.
- Le magasin d’authentification est chargé depuis le `agentDir` de cet agent.
- Les profils d’authentification de l’agent principal sont fusionnés comme **fallback** ; les profils d’agent remplacent les profils principaux en cas de conflit.

La fusion est additive, donc les profils principaux sont toujours disponibles comme
fallbacks. L’authentification entièrement isolée par agent n’est pas encore prise en charge.

## Annonce

Les sous-agents rendent compte via une étape d’annonce :

- L’étape d’annonce s’exécute dans la session du sous-agent (pas dans la session du demandeur).
- Si le sous-agent répond exactement `ANNOUNCE_SKIP`, rien n’est publié.
- Si le texte d’assistant le plus récent est le jeton silencieux exact `NO_REPLY` / `no_reply`, la sortie d’annonce est supprimée même si une progression visible existait auparavant.

La livraison dépend de la profondeur du demandeur :

- Les sessions de demandeur de niveau supérieur utilisent un appel `agent` de suivi avec livraison externe (`deliver=true`).
- Les sessions de sous-agent demandeur imbriquées reçoivent une injection de suivi interne (`deliver=false`) afin que l’orchestrateur puisse synthétiser les résultats des enfants dans la session.
- Si une session de sous-agent demandeur imbriquée a disparu, OpenClaw se rabat sur le demandeur de cette session lorsqu’il est disponible.

Pour les sessions de demandeur de niveau supérieur, la livraison directe en mode fin
résout d’abord toute route conversation/fil liée et tout remplacement de hook, puis complète
les champs channel-target manquants depuis la route enregistrée de la session du demandeur.
Cela garde les fins sur la bonne conversation/le bon sujet même lorsque l’origine de fin
n’identifie que le canal.

L’agrégation des fins d’enfants est limitée à l’exécution actuelle du demandeur lors de la
construction des constats de fin imbriqués, ce qui empêche les sorties d’enfants
d’exécutions antérieures obsolètes de fuir dans l’annonce actuelle. Les réponses d’annonce préservent
le routage fil/sujet lorsqu’il est disponible sur les adaptateurs de canal.

### Contexte d’annonce

Le contexte d’annonce est normalisé en un bloc d’événement interne stable :

| Champ          | Source                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Source         | `subagent` ou `cron`                                                                                          |
| ID de session  | Clé/ID de session enfant                                                                                      |
| Type           | Type d’annonce + libellé de tâche                                                                             |
| État           | Dérivé du résultat d’exécution (`success`, `error`, `timeout` ou `unknown`) — **pas** déduit du texte du modèle |
| Contenu du résultat | Dernier texte d’assistant visible, sinon dernier texte tool/toolResult nettoyé                          |
| Suivi          | Instruction décrivant quand répondre ou rester silencieux                                                     |

Les exécutions terminales échouées signalent un état d’échec sans rejouer le
texte de réponse capturé. En cas de timeout, si l’enfant n’a effectué que des appels d’outils,
l’annonce peut condenser cet historique en un court résumé de progression partielle au lieu
de rejouer la sortie brute des outils.

### Ligne de statistiques

Les charges utiles d’annonce incluent une ligne de statistiques à la fin (même lorsqu’elles sont enveloppées) :

- Durée d’exécution (par exemple `runtime 5m12s`).
- Utilisation des tokens (entrée/sortie/total).
- Coût estimé lorsque la tarification du modèle est configurée (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` et chemin de transcript afin que l’agent principal puisse récupérer l’historique via `sessions_history` ou inspecter le fichier sur disque.

Les métadonnées internes sont destinées uniquement à l’orchestration ; les réponses destinées aux utilisateurs
doivent être réécrites avec une voix normale d’assistant.

### Pourquoi préférer `sessions_history`

`sessions_history` est le chemin d’orchestration le plus sûr :

- Le rappel de l’assistant est d’abord normalisé : balises de pensée supprimées ; échafaudages `<relevant-memories>` / `<relevant_memories>` supprimés ; blocs de charge utile XML d’appels d’outils en texte brut (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) supprimés, y compris les charges utiles tronquées qui ne se ferment jamais proprement ; échafaudages tool-call/result rétrogradés et marqueurs de contexte historique supprimés ; jetons de contrôle de modèle divulgués (`<|assistant|>`, autres ASCII `<|...|>`, pleine chasse `<｜...｜>`) supprimés ; XML d’appel d’outil MiniMax mal formé supprimé.
- Le texte ressemblant à des identifiants/tokens est expurgé.
- Les longs blocs peuvent être tronqués.
- Les très grands historiques peuvent supprimer les anciennes lignes ou remplacer une ligne surdimensionnée par `[sessions_history omitted: message too large]`.
- L’inspection du transcript brut sur disque est le fallback lorsque vous avez besoin du transcript complet octet pour octet.

## Politique des outils

Les sous-agents utilisent d’abord le même pipeline de profil et de politique d’outils que le parent ou
l’agent cible. Ensuite, OpenClaw applique la couche de restriction des sous-agents.

Sans `tools.profile` restrictif, les sous-agents obtiennent **tous les outils sauf
les outils de session** et les outils système :

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` reste ici aussi une vue de rappel bornée et nettoyée — ce
n’est pas un dump de transcript brut.

Lorsque `maxSpawnDepth >= 2`, les sous-agents orchestrateurs de profondeur 1 reçoivent en plus
`sessions_spawn`, `subagents`, `sessions_list` et
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
        // deny wins
        deny: ["gateway", "cron"],
        // if allow is set, it becomes allow-only (deny still wins)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` est un filtre final en allow-only. Il peut restreindre
l’ensemble d’outils déjà résolu, mais il ne peut pas **rajouter** un outil retiré
par `tools.profile`. Par exemple, `tools.profile: "coding"` inclut
`web_search`/`web_fetch` mais pas l’outil `browser`. Pour permettre aux
sous-agents du profil coding d’utiliser l’automatisation de navigateur, ajoutez browser à l’étape
du profil :

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Utilisez `agents.list[].tools.alsoAllow: ["browser"]` par agent lorsque seul un
agent doit obtenir l’automatisation de navigateur.

## Concurrence

Les sous-agents utilisent une file dédiée en processus :

- **Nom de la file :** `subagent`
- **Concurrence :** `agents.defaults.subagents.maxConcurrent` (par défaut `8`)

## Vivacité et récupération

OpenClaw ne considère pas l’absence de `endedAt` comme une preuve permanente qu’un
sous-agent est encore actif. Les exécutions non terminées plus anciennes que la fenêtre d’obsolescence
cessent d’être comptées comme actives/en attente dans `/subagents list`, les résumés d’état,
les contrôles de fin des descendants et les vérifications de concurrence par session.

Après un redémarrage du Gateway, les exécutions restaurées non terminées obsolètes sont élaguées sauf si
leur session enfant est marquée `abortedLastRun: true`. Ces
sessions enfants interrompues par le redémarrage restent récupérables via le flux de récupération d’orphelins de sous-agent,
qui envoie un message de reprise synthétique avant
d’effacer le marqueur d’interruption.

La récupération automatique après redémarrage est bornée par session enfant. Si le même
enfant sous-agent est accepté à répétition pour récupération d’orphelin dans la
fenêtre rapide de re-blocage, OpenClaw persiste une tombstone de récupération sur cette
session et cesse de la reprendre automatiquement lors des redémarrages ultérieurs. Exécutez
`openclaw tasks maintenance --apply` pour réconcilier l’enregistrement de tâche, ou
`openclaw doctor --fix` pour effacer les drapeaux de récupération interrompue obsolètes sur les
sessions avec tombstone.

<Note>
Si le spawn d’un sous-agent échoue avec le Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, vérifiez l’appelant RPC avant de modifier l’état de jumelage.
La coordination interne `sessions_spawn` doit se connecter comme
`client.id: "gateway-client"` avec `client.mode: "backend"` via une authentification loopback directe par jeton/mot de passe partagé ; ce chemin ne dépend pas du
baseline de portée d’appareil jumelé de la CLI. Les appelants distants, les
`deviceIdentity` explicites, les chemins explicites par token d’appareil et les clients browser/node
ont toujours besoin de l’approbation normale de l’appareil pour les mises à niveau de portée.
</Note>

## Arrêt

- Envoyer `/stop` dans la conversation du demandeur interrompt la session du demandeur et arrête toutes les exécutions de sous-agents actives créées depuis celle-ci, avec répercussion sur les enfants imbriqués.
- `/subagents kill <id>` arrête un sous-agent précis et se répercute sur ses enfants.

## Limites

- L’annonce des sous-agents est **best-effort**. Si le gateway redémarre, le travail « announce back » en attente est perdu.
- Les sous-agents partagent toujours les ressources du même processus gateway ; traitez `maxConcurrent` comme une soupape de sécurité.
- `sessions_spawn` est toujours non bloquant : il renvoie `{ status: "accepted", runId, childSessionKey }` immédiatement.
- Le contexte de sous-agent injecte uniquement `AGENTS.md`, `TOOLS.md`, `SOUL.md`, `IDENTITY.md` et `USER.md` (pas `MEMORY.md`, `HEARTBEAT.md` ni `BOOTSTRAP.md`).
- La profondeur maximale d’imbrication est 5 (plage de `maxSpawnDepth` : 1–5). La profondeur 2 est recommandée pour la plupart des cas d’utilisation.
- `maxChildrenPerAgent` limite les enfants actifs par session (par défaut `5`, plage `1–20`).

## Liens connexes

- [Agents ACP](/fr/tools/acp-agents)
- [Envoi d’agent](/fr/tools/agent-send)
- [Tâches d’arrière-plan](/fr/automation/tasks)
- [Outils de sandbox multi-agent](/fr/tools/multi-agent-sandbox-tools)
