---
read_when:
    - Vous voulez effectuer un travail en arrière-plan ou en parallèle via l’agent
    - Vous modifiez la politique de l’outil sessions_spawn ou sous-agent
    - Vous implémentez ou dépannez des sessions de sous-agent liées à un fil
sidebarTitle: Sub-agents
summary: Lancez des exécutions isolées d’agents en arrière-plan qui annoncent les résultats dans le chat du demandeur
title: Sous-agents
x-i18n:
    generated_at: "2026-06-28T00:13:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 144af6e020c86d171fe6c5734efaad229adaea35f8d1c1b07e37c549805c88ff
    source_path: tools/subagents.md
    workflow: 16
---

Les sous-agents sont des exécutions d’agent en arrière-plan lancées depuis une exécution d’agent existante.
Ils s’exécutent dans leur propre session (`agent:<agentId>:subagent:<uuid>`) et,
une fois terminés, **annoncent** leur résultat dans le canal de discussion
du demandeur. Chaque exécution de sous-agent est suivie comme une
[tâche en arrière-plan](/fr/automation/tasks).

Objectifs principaux :

- Paralléliser les travaux de « recherche / tâche longue / outil lent » sans bloquer l’exécution principale.
- Garder les sous-agents isolés par défaut (séparation des sessions + sandboxing facultatif).
- Rendre la surface d’outils difficile à utiliser de façon incorrecte : les sous-agents ne reçoivent **pas** les outils de session par défaut.
- Prendre en charge une profondeur d’imbrication configurable pour les modèles d’orchestrateur.

<Note>
**Note sur le coût :** chaque sous-agent dispose de son propre contexte et de sa propre consommation de jetons par
défaut. Pour les tâches lourdes ou répétitives, définissez un modèle moins coûteux pour les sous-agents
et conservez un modèle de meilleure qualité pour votre agent principal. Configurez-le via
`agents.defaults.subagents.model` ou avec des remplacements par agent. Lorsqu’un enfant
    a réellement besoin de la transcription actuelle du demandeur, l’agent peut demander
    `context: "fork"` pour ce lancement précis. Les sessions de sous-agent liées à un fil utilisent par défaut
    `context: "fork"` parce qu’elles branchent la conversation actuelle dans un
    fil de suivi.
</Note>

## Commande slash

Utilisez `/subagents` pour inspecter les exécutions de sous-agents de la **session actuelle** :

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` affiche les métadonnées d’exécution (statut, horodatages, identifiant de session,
chemin de transcription, nettoyage). Utilisez `sessions_history` pour une vue de rappel bornée
et filtrée pour la sécurité ; inspectez le chemin de transcription sur le disque lorsque vous
avez besoin de la transcription brute complète.

### Contrôles de liaison aux fils

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

Les agents démarrent des sous-agents en arrière-plan avec `sessions_spawn`. Les achèvements de sous-agents
reviennent sous forme d’événements internes de session parente ; l’agent parent/demandeur décide
si une mise à jour visible par l’utilisateur est nécessaire.

<AccordionGroup>
  <Accordion title="Non-blocking, push-based completion">
    - `sessions_spawn` est non bloquant ; il renvoie immédiatement un identifiant d’exécution.
    - À l’achèvement, le sous-agent renvoie un rapport à la session parente/demandeuse.
    - Les tours d’agent qui ont besoin des résultats d’enfants doivent appeler `sessions_yield` après avoir lancé le travail requis. Cela termine le tour actuel et permet aux événements d’achèvement d’arriver comme le prochain message visible par le modèle.
    - L’achèvement fonctionne par envoi automatique. Une fois lancé, ne sondez **pas** `/subagents list`, `sessions_list` ou `sessions_history` en boucle uniquement pour attendre sa fin ; inspectez le statut seulement à la demande pour la visibilité de débogage.
    - La sortie de l’enfant est un rapport/élément de preuve que l’agent demandeur doit synthétiser. Il ne s’agit pas d’un texte d’instruction rédigé par l’utilisateur et elle ne peut pas remplacer les règles système, développeur ou utilisateur.
    - À l’achèvement, OpenClaw ferme au mieux les onglets/processus de navigateur suivis ouverts par cette session de sous-agent avant que le flux de nettoyage de l’annonce ne continue.

  </Accordion>
  <Accordion title="Completion delivery">
    - OpenClaw remet les achèvements à la session demandeuse via un tour `agent` avec une clé d’idempotence stable.
    - Si l’exécution demandeuse est encore active, OpenClaw essaie d’abord de réveiller/orienter cette exécution au lieu de démarrer un second chemin de réponse visible.
    - Si un demandeur actif ne peut pas être réveillé, OpenClaw bascule vers un transfert à l’agent demandeur avec le même contexte d’achèvement au lieu d’abandonner l’annonce.
    - Un transfert parent réussi termine la livraison du sous-agent même lorsque le parent décide qu’aucune mise à jour utilisateur visible n’est nécessaire.
    - Les sous-agents natifs ne reçoivent pas l’outil de message. Ils renvoient du texte d’assistant brut à l’agent parent/demandeur ; les réponses visibles par les humains relèvent de la politique de livraison normale de l’agent parent/demandeur.
    - Si le transfert direct ne peut pas être utilisé, le système revient au routage par file d’attente.
    - Si le routage par file d’attente n’est toujours pas disponible, l’annonce est retentée avec un court backoff exponentiel avant l’abandon final.
    - La livraison d’achèvement conserve la route demandeuse résolue : les routes d’achèvement liées à un fil ou à une conversation l’emportent lorsqu’elles sont disponibles ; si l’origine de l’achèvement ne fournit qu’un canal, OpenClaw complète la cible/le compte manquant à partir de la route résolue de la session demandeuse (`lastChannel` / `lastTo` / `lastAccountId`) afin que la livraison directe fonctionne toujours.

  </Accordion>
  <Accordion title="Completion handoff metadata">
    Le transfert d’achèvement vers la session demandeuse est un contexte interne généré par le runtime
    (et non du texte rédigé par l’utilisateur) et comprend :

    - `Result` — le dernier texte de réponse `assistant` visible de l’enfant. La sortie Tool/toolResult n’est pas promue dans les résultats de l’enfant. Les exécutions terminales échouées ne réutilisent pas le texte de réponse capturé.
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`.
    - Des statistiques compactes de runtime/jetons.
    - Une instruction de revue demandant à l’agent demandeur de vérifier le résultat avant de décider si la tâche d’origine est terminée.
    - Des consignes de suivi demandant à l’agent demandeur de poursuivre la tâche ou d’enregistrer un suivi lorsque le résultat de l’enfant laisse d’autres actions à effectuer.
    - Une instruction de mise à jour finale pour le chemin sans autre action, rédigée dans une voix d’assistant normale sans transférer les métadonnées internes brutes.

  </Accordion>
  <Accordion title="Modes et environnement d’exécution ACP">
    - `--model` et `--thinking` remplacent les valeurs par défaut pour cette exécution spécifique.
    - Utilisez `info`/`log` pour inspecter les détails et la sortie après la fin.
    - Pour les sessions persistantes liées à un fil, utilisez `sessions_spawn` avec `thread: true` et `mode: "session"`.
    - Si le canal demandeur ne prend pas en charge les liaisons de fil, utilisez plutôt `mode: "run"` au lieu de réessayer des combinaisons liées à un fil impossibles.
    - Pour les sessions de harnais ACP (Claude Code, Gemini CLI, OpenCode ou Codex ACP/acpx explicite), utilisez `sessions_spawn` avec `runtime: "acp"` lorsque l’outil annonce cet environnement d’exécution. Consultez le [modèle de livraison ACP](/fr/tools/acp-agents#delivery-model) lors du débogage des complétions ou des boucles d’agent à agent. Lorsque le Plugin `codex` est activé, le contrôle de chat/fil Codex doit privilégier `/codex ...` plutôt qu’ACP, sauf si l’utilisateur demande explicitement ACP/acpx.
    - OpenClaw masque `runtime: "acp"` jusqu’à ce qu’ACP soit activé, que le demandeur ne soit pas en bac à sable et qu’un Plugin backend tel que `acpx` soit chargé. `runtime: "acp"` attend un identifiant de harnais ACP externe, ou une entrée `agents.list[]` avec `runtime.type="acp"` ; utilisez l’environnement d’exécution de sous-agent par défaut pour les agents de configuration OpenClaw normaux depuis `agents_list`.

  </Accordion>
</AccordionGroup>

## Modes de contexte

Les sous-agents natifs démarrent isolés, sauf si l’appelant demande explicitement de bifurquer
la transcription actuelle.

| Mode       | Quand l’utiliser                                                                                                                         | Comportement                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Recherche fraîche, implémentation indépendante, travail d’outil lent, ou tout ce qui peut être décrit brièvement dans le texte de la tâche                           | Crée une transcription enfant propre. C’est la valeur par défaut et elle réduit l’utilisation des jetons.  |
| `fork`     | Travail qui dépend de la conversation actuelle, de résultats d’outils précédents ou d’instructions nuancées déjà présentes dans la transcription du demandeur | Branche la transcription du demandeur dans la session enfant avant le démarrage de l’enfant. |

Utilisez `fork` avec parcimonie. Il sert à la délégation sensible au contexte, pas à
remplacer la rédaction d’une invite de tâche claire.

## Outil : `sessions_spawn`

Démarre une exécution de sous-agent avec `deliver: false` sur la voie globale `subagent`,
puis exécute une étape d’annonce et publie la réponse d’annonce dans le canal de chat
du demandeur.

La disponibilité dépend de la politique d’outils effective de l’appelant. Les profils `coding` et
`full` exposent `sessions_spawn` par défaut. Le profil `messaging`
ne le fait pas ; ajoutez `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` ou utilisez `tools.profile: "coding"` pour les agents qui doivent déléguer
du travail. Les politiques d’autorisation/refus par canal/groupe, fournisseur, bac à sable et par agent peuvent
toujours retirer l’outil après l’étape du profil. Utilisez `/tools` depuis la même
session pour confirmer la liste effective des outils.

**Valeurs par défaut :**

- **Modèle :** les sous-agents natifs héritent de l’appelant sauf si vous définissez `agents.defaults.subagents.model` (ou `agents.list[].subagents.model` par agent). Les lancements d’environnement d’exécution ACP utilisent le même modèle de sous-agent configuré lorsqu’il est présent ; sinon, le harnais ACP conserve sa propre valeur par défaut. Un `sessions_spawn.model` explicite reste prioritaire.
- **Thinking :** les sous-agents natifs héritent de l’appelant sauf si vous définissez `agents.defaults.subagents.thinking` (ou `agents.list[].subagents.thinking` par agent). Les lancements d’environnement d’exécution ACP appliquent aussi `agents.defaults.models["provider/model"].params.thinking` pour le modèle sélectionné. Un `sessions_spawn.thinking` explicite reste prioritaire.
- **Délai d’exécution :** OpenClaw utilise `agents.defaults.subagents.runTimeoutSeconds` lorsqu’il est défini ; sinon, il revient à `0` (aucun délai). `sessions_spawn` n’accepte pas de remplacements de délai par appel.
- **Livraison de la tâche :** les sous-agents natifs reçoivent la tâche déléguée dans leur premier message `[Subagent Task]` visible. L’invite système du sous-agent transporte les règles d’environnement d’exécution et le contexte de routage, pas un doublon masqué de la tâche.

Les lancements de sous-agents natifs acceptés incluent les métadonnées du modèle enfant résolu dans
le résultat de l’outil : `resolvedModel` contient la référence de modèle appliquée et
`resolvedProvider` contient le préfixe du fournisseur lorsque la référence en possède un.

### Mode d’invite de délégation

`agents.defaults.subagents.delegationMode` contrôle uniquement le guidage de l’invite ; il ne modifie pas la politique d’outils et n’impose pas la délégation.

- `suggest` (par défaut) : conserve l’incitation standard de l’invite à utiliser des sous-agents pour les travaux plus importants ou plus lents.
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
  La description de la tâche pour le sous-agent.
</ParamField>
<ParamField path="taskName" type="string">
  Identifiant stable facultatif pour identifier un enfant précis dans une sortie d’état ultérieure. Doit correspondre à `[a-z][a-z0-9_-]{0,63}` et ne peut pas être une cible réservée comme `last` ou `all`.
</ParamField>
<ParamField path="label" type="string">
  Libellé facultatif lisible par un humain.
</ParamField>
<ParamField path="agentId" type="string">
  Lance sous un autre identifiant d’agent configuré lorsque `subagents.allowAgents` l’autorise.
</ParamField>
<ParamField path="cwd" type="string">
  Répertoire de travail facultatif de la tâche pour l’exécution enfant. Les sous-agents natifs chargent toujours les fichiers de démarrage depuis l’espace de travail de l’agent cible ; `cwd` modifie uniquement l’emplacement où les outils d’exécution et les harnais CLI effectuent le travail délégué.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` est réservé aux harnais ACP externes (`claude`, `droid`, `gemini`, `opencode`, ou Codex ACP/acpx explicitement demandé) et aux entrées `agents.list[]` dont `runtime.type` est `acp`.
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
<ParamField path="thread" type="boolean" default="false">
  Lorsque `true`, demande une liaison au thread du canal pour cette session de sous-agent.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Si `thread: true` et que `mode` est omis, la valeur par défaut devient `session`. `mode: "session"` nécessite `thread: true`.
  Si la liaison de thread n’est pas disponible pour le canal demandeur, utilisez plutôt `mode: "run"`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archive immédiatement après l’annonce (conserve tout de même la transcription via un renommage).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` rejette le lancement sauf si l’exécution enfant cible est sandboxée.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` branche la transcription actuelle du demandeur dans la session enfant. Sous-agents natifs uniquement. Les lancements liés à un thread utilisent `fork` par défaut ; les lancements non liés à un thread utilisent `isolated` par défaut.
</ParamField>

<Warning>
`sessions_spawn` n’accepte **pas** les paramètres de livraison de canal (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Les sous-agents natifs renvoient
leur dernier tour d’assistant au demandeur ; la livraison externe reste gérée par
l’agent parent/demandeur.
</Warning>

### Noms de tâches et ciblage

`taskName` est un identifiant exposé au modèle pour l’orchestration, pas une clé de session.
Utilisez-le pour des noms d’enfants stables comme `review_subagents`,
`linux_validation` ou `docs_update` lorsqu’un coordinateur peut avoir besoin d’inspecter
cet enfant plus tard.

La résolution de cible accepte les correspondances exactes de `taskName` et les
préfixes non ambigus. La correspondance est limitée à la même fenêtre de cibles
actives/récentes que celle utilisée par les cibles numérotées `/subagents`, afin qu’un
enfant terminé obsolète ne rende pas ambigu un identifiant réutilisé. Si deux enfants
actifs ou récents partagent le même `taskName`, la cible est ambiguë ; utilisez plutôt
l’index de liste, la clé de session ou l’identifiant d’exécution.

Les cibles réservées `last` et `all` ne sont pas des valeurs `taskName` valides
car elles ont déjà des significations de contrôle.

## Outil : `sessions_yield`

Termine le tour de modèle actuel et attend que des événements d’exécution, principalement
des événements de fin de sous-agent, arrivent comme message suivant. Utilisez-le après
avoir lancé le travail enfant requis lorsque le demandeur ne peut pas produire de réponse
finale tant que ces fins d’exécution ne sont pas arrivées.

`sessions_yield` est la primitive d’attente. Ne la remplacez pas par des boucles
d’interrogation sur `subagents`, `sessions_list`, `sessions_history`, un `sleep`
shell ou une interrogation de processus uniquement pour détecter la fin d’un enfant.

Utilisez `sessions_yield` uniquement lorsque la liste effective des outils de la session
l’inclut. Certains profils d’outils minimaux ou personnalisés peuvent exposer
`sessions_spawn` et `subagents` sans exposer `sessions_yield` ; dans ce cas, n’inventez
pas une boucle d’interrogation uniquement pour attendre la fin.

Lorsque des enfants actifs existent, OpenClaw injecte un bloc d’invite compact généré
par l’exécution, `Active Subagents`, dans les tours normaux afin que le demandeur puisse
voir les sessions enfant actuelles, les identifiants d’exécution, les statuts, les
libellés, les tâches et les alias `taskName` sans interrogation. Les champs de tâche et
de libellé de ce bloc sont cités comme des données, pas comme des instructions, car ils
peuvent provenir d’arguments de lancement fournis par l’utilisateur ou le modèle.

## Outil : `subagents`

Liste les exécutions de sous-agents lancées et possédées par la session demandeuse. Sa
portée est limitée au demandeur actuel ; un enfant ne peut voir que ses propres enfants
contrôlés.

Utilisez `subagents` pour l’état à la demande et le débogage. Utilisez `sessions_yield`
pour attendre les événements de fin.

## Sessions liées à un thread

Lorsque les liaisons de thread sont activées pour un canal, un sous-agent peut rester lié
à un thread afin que les messages utilisateur de suivi dans ce thread continuent d’être
acheminés vers la même session de sous-agent.

### Canaux prenant en charge les threads

Tout canal doté d’un adaptateur de liaison de session peut prendre en charge des
sessions de sous-agents persistantes liées à un thread (`sessions_spawn` avec
`thread: true`). Les adaptateurs intégrés incluent actuellement les threads Discord, les
threads Matrix, les sujets de forum Telegram et les liaisons de conversation actuelle
pour Feishu. Utilisez les clés de configuration `threadBindings` propres à chaque canal
pour l’activation, les délais d’expiration et `spawnSessions`.

### Flux rapide

<Steps>
  <Step title="Spawn">
    `sessions_spawn` avec `thread: true` (et éventuellement `mode: "session"`).
  </Step>
  <Step title="Bind">
    OpenClaw crée ou lie un thread à cette cible de session dans le canal actif.
  </Step>
  <Step title="Route follow-ups">
    Les réponses et messages de suivi dans ce thread sont acheminés vers la session liée.
  </Step>
  <Step title="Inspect timeouts">
    Utilisez `/session idle` pour inspecter/mettre à jour le désépinglage automatique après inactivité et
    `/session max-age` pour contrôler la limite stricte.
  </Step>
  <Step title="Detach">
    Utilisez `/unfocus` pour détacher manuellement.
  </Step>
</Steps>

### Contrôles manuels

| Command            | Effet                                                                 |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Lie le thread actuel (ou en crée un) à une cible de sous-agent/session |
| `/unfocus`         | Supprime la liaison pour le thread actuellement lié                    |
| `/agents`          | Liste les exécutions actives et l’état de liaison (`thread:<id>` ou `unbound`) |
| `/session idle`    | Inspecte/met à jour le désépinglage automatique après inactivité (threads liés focalisés uniquement) |
| `/session max-age` | Inspecte/met à jour la limite stricte (threads liés focalisés uniquement) |

### Commutateurs de configuration

- **Valeur globale par défaut :** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Les clés de remplacement de canal et de liaison automatique au lancement** sont propres à chaque adaptateur. Voir [Canaux prenant en charge les threads](#thread-supporting-channels) ci-dessus.

Voir la [référence de configuration](/fr/gateway/configuration-reference) et
les [commandes slash](/fr/tools/slash-commands) pour les détails actuels des adaptateurs.

### Liste d’autorisation

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Liste des identifiants d’agents configurés pouvant être ciblés via `agentId` explicite (`["*"]` autorise toute cible configurée). Par défaut : seulement l’agent demandeur. Si vous définissez une liste et souhaitez toujours que le demandeur puisse se lancer lui-même avec `agentId`, incluez l’identifiant du demandeur dans la liste.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Liste d’autorisation par défaut des agents cibles configurés utilisée lorsque l’agent demandeur ne définit pas son propre `subagents.allowAgents`.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Bloque les appels `sessions_spawn` qui omettent `agentId` (force la sélection explicite d’un profil). Remplacement par agent : `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Délai d’expiration par appel pour les tentatives de livraison d’annonce `agent` du Gateway. Les valeurs sont des millisecondes entières positives et sont plafonnées au maximum de minuterie sûr de la plateforme. Les nouvelles tentatives transitoires peuvent rendre l’attente totale de l’annonce plus longue qu’un délai configuré.
</ParamField>

Si la session demandeuse est sandboxée, `sessions_spawn` rejette les cibles
qui s’exécuteraient sans sandbox.

### Découverte

Utilisez `agents_list` pour voir quels identifiants d’agents sont actuellement autorisés pour
`sessions_spawn`. La réponse inclut le modèle effectif de chaque agent listé et les métadonnées
d’exécution intégrées, afin que les appelants puissent distinguer OpenClaw, le serveur
d’application Codex et les autres exécutions natives configurées.

Les entrées `allowAgents` doivent pointer vers des identifiants d’agents configurés dans `agents.list[]`.
`["*"]` signifie tout agent cible configuré plus le demandeur. Si une configuration d’agent
est supprimée mais que son identifiant reste dans `allowAgents`, `sessions_spawn` rejette cet identifiant
et `agents_list` l’omet. Exécutez `openclaw doctor --fix` pour nettoyer les entrées obsolètes
de la liste d’autorisation, ou ajoutez une entrée minimale `agents.list[]` lorsque la cible doit
rester lançable tout en héritant des valeurs par défaut.

### Archivage automatique

- Les sessions de sous-agents sont automatiquement archivées après `agents.defaults.subagents.archiveAfterMinutes` (par défaut `60`).
- L’archivage utilise `sessions.delete` et renomme la transcription en `*.deleted.<timestamp>` (même dossier).
- `cleanup: "delete"` archive immédiatement après l’annonce (conserve tout de même la transcription via un renommage).
- L’archivage automatique est fait au mieux ; les minuteries en attente sont perdues si le Gateway redémarre.
- Les délais d’exécution configurés n’archivent **pas** automatiquement ; ils arrêtent seulement l’exécution. La session reste jusqu’à l’archivage automatique.
- L’archivage automatique s’applique également aux sessions de profondeur 1 et de profondeur 2.
- Le nettoyage du navigateur est distinct du nettoyage de l’archivage : les onglets/processus de navigateur suivis sont fermés au mieux lorsque l’exécution se termine, même si la transcription ou l’enregistrement de session est conservé.

## Sous-agents imbriqués

Par défaut, les sous-agents ne peuvent pas lancer leurs propres sous-agents
(`maxSpawnDepth: 1`). Définissez `maxSpawnDepth: 2` pour activer un niveau
d’imbrication — le **modèle orchestrateur** : agent principal → sous-agent orchestrateur →
sous-sous-agents travailleurs.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // allow sub-agents to spawn children (default: 1)
        maxChildrenPerAgent: 5, // max active children per agent session (default: 5)
        maxConcurrent: 8, // global concurrency lane cap (default: 8)
        runTimeoutSeconds: 900, // default timeout for sessions_spawn (0 = no timeout)
        announceTimeoutMs: 120000, // per-call gateway announce timeout
      },
    },
  },
}
```

### Niveaux de profondeur

| Profondeur | Forme de la clé de session                    | Rôle                                          | Peut lancer ?                |
| ---------- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0          | `agent:<id>:main`                            | Agent principal                               | Toujours                     |
| 1          | `agent:<id>:subagent:<uuid>`                 | Sous-agent (orchestrateur lorsque la profondeur 2 est autorisée) | Seulement si `maxSpawnDepth >= 2` |
| 2          | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sous-sous-agent (travailleur feuille)         | Jamais                       |

### Chaîne d’annonce

Les résultats remontent la chaîne :

1. Le worker de profondeur 2 termine → annonce à son parent (orchestrateur de profondeur 1).
2. L’orchestrateur de profondeur 1 reçoit l’annonce, synthétise les résultats, termine → annonce au principal.
3. L’agent principal reçoit l’annonce et la transmet à l’utilisateur.

Chaque niveau ne voit que les annonces de ses enfants directs.

<Note>
**Conseil opérationnel :** démarrez le travail enfant une seule fois et attendez les événements
de fin au lieu de créer des boucles d’interrogation autour de `sessions_list`,
`sessions_history`, `/subagents list` ou de commandes `exec` de sommeil.
`sessions_list` et `/subagents list` gardent les relations de sessions enfants
centrées sur le travail actif — les enfants actifs restent attachés, les enfants terminés restent
visibles pendant une courte fenêtre récente, et les liens d’enfants obsolètes présents seulement dans le store sont
ignorés après leur fenêtre de fraîcheur. Cela empêche les anciennes métadonnées `spawnedBy` /
`parentSessionKey` de ressusciter des enfants fantômes après
un redémarrage. Si un événement de fin d’enfant arrive après que vous avez déjà envoyé la
réponse finale, le suivi correct est le jeton silencieux exact
`NO_REPLY` / `no_reply`.
</Note>

### Politique d’outils par profondeur

- Le rôle et le périmètre de contrôle sont écrits dans les métadonnées de session au moment du spawn. Cela empêche des clés de session plates ou restaurées de récupérer accidentellement des privilèges d’orchestrateur.
- **Profondeur 1 (orchestrateur, quand `maxSpawnDepth >= 2`) :** reçoit `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` afin de pouvoir lancer des enfants et inspecter leur statut. Les autres outils de session/système restent refusés.
- **Profondeur 1 (feuille, quand `maxSpawnDepth == 1`) :** aucun outil de session (comportement par défaut actuel).
- **Profondeur 2 (worker feuille) :** aucun outil de session — `sessions_spawn` est toujours refusé à la profondeur 2. Ne peut pas lancer d’autres enfants.

### Limite de spawn par agent

Chaque session d’agent (à n’importe quelle profondeur) peut avoir au maximum `maxChildrenPerAgent`
(`5` par défaut) enfants actifs à la fois. Cela évite un déploiement en éventail incontrôlé
depuis un seul orchestrateur.

### Arrêt en cascade

Arrêter un orchestrateur de profondeur 1 arrête automatiquement tous ses enfants de profondeur 2 :

- `/stop` dans le chat principal arrête tous les agents de profondeur 1 et se propage à leurs enfants de profondeur 2.

## Authentification

L’authentification des sous-agents est résolue par **identifiant d’agent**, et non par type de session :

- La clé de session du sous-agent est `agent:<agentId>:subagent:<uuid>`.
- Le store d’authentification est chargé depuis le `agentDir` de cet agent.
- Les profils d’authentification de l’agent principal sont fusionnés comme **solution de repli** ; les profils de l’agent remplacent les profils principaux en cas de conflit.

La fusion est additive, donc les profils principaux sont toujours disponibles comme
solutions de repli. L’authentification entièrement isolée par agent n’est pas encore prise en charge.

## Annonce

Les sous-agents rendent compte via une étape d’annonce :

- L’étape d’annonce s’exécute dans la session du sous-agent (pas dans la session du demandeur).
- Si le sous-agent répond exactement `ANNOUNCE_SKIP`, rien n’est publié.
- Si le dernier texte de l’assistant est le jeton silencieux exact `NO_REPLY` / `no_reply`, la sortie d’annonce est supprimée même si des progrès visibles existaient plus tôt.

La livraison dépend de la profondeur du demandeur :

- Les sessions de demandeur de niveau supérieur utilisent un appel `agent` de suivi avec livraison externe (`deliver=true`).
- Les sessions de sous-agent demandeur imbriquées reçoivent une injection de suivi interne (`deliver=false`) afin que l’orchestrateur puisse synthétiser les résultats des enfants dans la session.
- Si une session de sous-agent demandeur imbriquée a disparu, OpenClaw se replie sur le demandeur de cette session lorsqu’il est disponible.

Pour les sessions de demandeur de niveau supérieur, la livraison directe en mode achèvement
résout d’abord toute route de conversation/fil liée et tout remplacement de hook, puis remplit
les champs channel-target manquants depuis la route stockée de la session du demandeur.
Cela garde les achèvements sur le bon chat/sujet même lorsque l’origine de l’achèvement
identifie seulement le canal.

L’agrégation des fins d’enfants est limitée au run demandeur actuel lors de la
construction des résultats d’achèvement imbriqués, ce qui empêche les sorties d’enfants de runs
précédents obsolètes de fuir dans l’annonce actuelle. Les réponses d’annonce préservent
le routage de fil/sujet lorsqu’il est disponible sur les adaptateurs de canal.

### Contexte d’annonce

Le contexte d’annonce est normalisé en un bloc d’événement interne stable :

| Champ          | Source                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Source         | `subagent` ou `cron`                                                                                          |
| Identifiants de session | Clé/id de session enfant                                                                                      |
| Type           | Type d’annonce + libellé de tâche                                                                             |
| Statut         | Dérivé du résultat d’exécution (`success`, `error`, `timeout` ou `unknown`) — **non** déduit du texte du modèle |
| Contenu du résultat | Dernier texte d’assistant visible de l’enfant                                                             |
| Suivi          | Instruction décrivant quand répondre ou rester silencieux                                                     |

Les runs terminaux en échec signalent un statut d’échec sans rejouer le texte de
réponse capturé. La sortie tool/toolResult n’est pas promue en texte de résultat enfant.

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

- Le rappel de l’assistant est d’abord normalisé : balises de réflexion supprimées ; échafaudage `<relevant-memories>` / `<relevant_memories>` supprimé ; blocs de payload XML d’appels d’outils en texte brut (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) supprimés, y compris les payloads tronqués qui ne se ferment jamais proprement ; échafaudage d’appel/résultat d’outil dégradé et marqueurs de contexte historique supprimés ; tokens de contrôle de modèle divulgués (`<|assistant|>`, autres ASCII `<|...|>`, pleine chasse `<｜...｜>`) supprimés ; XML d’appel d’outil MiniMax malformé supprimé.
- Le texte ressemblant à des identifiants/tokens est expurgé.
- Les longs blocs peuvent être tronqués.
- Les très grands historiques peuvent supprimer les lignes plus anciennes ou remplacer une ligne surdimensionnée par `[sessions_history omitted: message too large]`.
- Utilisez `nextOffset` lorsqu’il est présent pour paginer vers l’arrière dans les anciennes fenêtres de transcript.
- L’inspection du transcript brut sur disque est la solution de repli lorsque vous avez besoin du transcript complet octet pour octet.

## Politique d’outils

Les sous-agents utilisent d’abord le même pipeline de profil et de politique d’outils que le parent ou
l’agent cible. Ensuite, OpenClaw applique la couche de restriction des sous-agents.

Sans `tools.profile` restrictif, les sous-agents obtiennent **tous les outils sauf l’outil
de message, les outils de session et les outils système** :

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`
- `message`

`sessions_history` reste ici aussi une vue de rappel bornée et assainie — ce
n’est pas un vidage de transcript brut.

Lorsque `maxSpawnDepth >= 2`, les sous-agents orchestrateurs de profondeur 1 reçoivent en plus
`sessions_spawn`, `subagents`, `sessions_list` et
`sessions_history` afin de pouvoir gérer leurs enfants.

### Remplacement via la config

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

`tools.subagents.tools.allow` est un filtre final en autorisation seule. Il peut restreindre
l’ensemble d’outils déjà résolu, mais il ne peut pas **rajouter** un outil supprimé
par `tools.profile`. Par exemple, `tools.profile: "coding"` inclut
`web_search`/`web_fetch` mais pas l’outil `browser`. Pour permettre aux
sous-agents de profil coding d’utiliser l’automatisation du navigateur, ajoutez browser à
l’étape de profil :

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Utilisez `agents.list[].tools.alsoAllow: ["browser"]` lorsqu’un seul
agent doit recevoir l’automatisation du navigateur.

## Concurrence

Les sous-agents utilisent une file dédiée dans le processus :

- **Nom de la file :** `subagent`
- **Concurrence :** `agents.defaults.subagents.maxConcurrent` (`8` par défaut)

## Vivacité et récupération

OpenClaw ne considère pas l’absence de `endedAt` comme une preuve permanente qu’un
sous-agent est encore actif. Les runs non terminés plus anciens que la fenêtre de runs obsolètes
cessent de compter comme actifs/en attente dans `/subagents list`, les résumés de statut,
le blocage d’achèvement des descendants et les contrôles de concurrence par session.

Après un redémarrage du Gateway, les runs restaurés non terminés obsolètes sont élagués sauf si
leur session enfant est marquée `abortedLastRun: true`. Ces
sessions enfants interrompues par redémarrage restent récupérables via le flux de récupération
d’orphelin de sous-agent, qui envoie un message de reprise synthétique avant
d’effacer le marqueur d’interruption.

La récupération automatique au redémarrage est bornée par session enfant. Si le même
enfant sous-agent est accepté à plusieurs reprises pour récupération d’orphelin dans la
fenêtre de réencoincement rapide, OpenClaw persiste une pierre tombale de récupération sur cette
session et cesse de le reprendre automatiquement lors des redémarrages ultérieurs. Exécutez
`openclaw tasks maintenance --apply` pour réconcilier l’enregistrement de tâche, ou
`openclaw doctor --fix` pour effacer les indicateurs de récupération interrompue obsolètes sur
les sessions avec pierre tombale.

<Note>
Si un spawn de sous-agent échoue avec Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, vérifiez l’appelant RPC avant de modifier l’état d’appariement.
La coordination interne `sessions_spawn` se répartit dans le processus lorsque
l’appelant s’exécute déjà dans le contexte de requête du Gateway, donc elle n’ouvre
pas de WebSocket de bouclage ni ne dépend de la ligne de base de portée d’appareil appairé de la CLI.
Les appelants hors du processus Gateway utilisent toujours la solution de repli WebSocket
comme `client.id: "gateway-client"` avec `client.mode: "backend"`
sur une authentification directe par jeton partagé/mot de passe en bouclage. Les appelants distants, les
`deviceIdentity` explicites, les chemins explicites de jeton d’appareil et les clients browser/node
ont toujours besoin de l’approbation normale de l’appareil pour les mises à niveau de portée.
</Note>

## Arrêt

- L’envoi de `/stop` dans le chat du demandeur interrompt la session du demandeur et arrête tous les runs de sous-agent actifs lancés depuis elle, avec propagation aux enfants imbriqués.

## Limitations

- L’annonce de sous-agent est **au mieux**. Si le gateway redémarre, le travail « annoncer en retour » en attente est perdu.
- Les sous-agents partagent toujours les mêmes ressources de processus du gateway ; traitez `maxConcurrent` comme une soupape de sécurité.
- `sessions_spawn` est toujours non bloquant : il renvoie `{ status: "accepted", runId, childSessionKey }` immédiatement.
- Le contexte de sous-agent injecte seulement `AGENTS.md` et `TOOLS.md` (pas `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md` ni `BOOTSTRAP.md`). Les sous-agents natifs de Codex suivent la même limite : `TOOLS.md` reste dans les instructions de fil Codex héritées, tandis que les fichiers de persona, d’identité et d’utilisateur propres au parent sont injectés comme instructions de collaboration limitées au tour afin que les enfants ne les clonent pas.
- La profondeur maximale d’imbrication est 5 (plage de `maxSpawnDepth` : 1–5). La profondeur 2 est recommandée pour la plupart des cas d’usage.
- `maxChildrenPerAgent` limite les enfants actifs par session (`5` par défaut, plage `1–20`).

## Connexe

- [Agents ACP](/fr/tools/acp-agents)
- [Envoi à l’agent](/fr/tools/agent-send)
- [Tâches en arrière-plan](/fr/automation/tasks)
- [Outils de sandbox multi-agent](/fr/tools/multi-agent-sandbox-tools)
