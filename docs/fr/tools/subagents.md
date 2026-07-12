---
read_when:
    - Vous souhaitez effectuer un travail en arrière-plan ou en parallèle via l’agent
    - Vous modifiez la politique de l’outil sessions_spawn ou des sous-agents
    - Vous mettez en œuvre ou dépannez des sessions de sous-agents liées à un fil de discussion
sidebarTitle: Sub-agents
summary: Lancez des exécutions isolées d’agents en arrière-plan qui annoncent les résultats dans le chat du demandeur
title: Sous-agents
x-i18n:
    generated_at: "2026-07-12T15:59:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d2293993ad99e2797f5cfbe13e964487f3bd0fa0a3114e78d25ce5862768b9ca
    source_path: tools/subagents.md
    workflow: 16
---

Les sous-agents sont des exécutions d’agent en arrière-plan lancées depuis une exécution d’agent existante.
Chacun s’exécute dans sa propre session (`agent:<agentId>:subagent:<uuid>`) et,
une fois terminé, **annonce** son résultat sur le canal de discussion du demandeur.
Chaque exécution de sous-agent est suivie en tant que [tâche en arrière-plan](/fr/automation/tasks).

Objectifs :

- Paralléliser les recherches, les tâches longues et les opérations lentes des outils sans bloquer l’exécution principale.
- Isoler les sous-agents par défaut (sessions distinctes, sandbox facultative).
- Rendre l’ensemble des outils difficile à utiliser de manière incorrecte : par défaut, les sous-agents n’ont **pas** accès aux outils de session ou de messagerie.
- Prendre en charge une profondeur d’imbrication configurable pour les modèles d’orchestration.

<Note>
**Remarque sur les coûts :** par défaut, chaque sous-agent dispose de son propre contexte et de sa propre consommation de jetons.
Pour les tâches lourdes ou répétitives, définissez un modèle moins coûteux pour les sous-agents
et conservez un modèle de meilleure qualité pour votre agent principal via
`agents.defaults.subagents.model` ou des remplacements propres à chaque agent. Lorsqu’un enfant
a réellement besoin de la transcription actuelle du demandeur, lancez-le avec
`context: "fork"`. Les sessions de sous-agent liées à un fil utilisent par défaut
`context: "fork"`, car elles créent une branche de la conversation actuelle dans un
fil de suivi.
</Note>

## Commande slash

`/subagents` inspecte les exécutions de sous-agents de la **session actuelle** :

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` affiche les métadonnées de l’exécution (état, horodatages, identifiant de session,
chemin de la transcription, nettoyage). `/subagents log` affiche les échanges récents d’une
exécution ; ajoutez le jeton `tools` pour inclure les messages d’appel et de résultat des outils (omis
par défaut). Utilisez `sessions_history` pour obtenir, depuis une exécution d’agent, une vue de rappel
limitée et filtrée pour des raisons de sécurité, ou consultez le chemin de la transcription sur le disque pour
accéder à la transcription brute complète.

### Contrôles de liaison aux fils

Ces commandes fonctionnent sur les canaux disposant de liaisons persistantes aux fils. Consultez
[Canaux prenant en charge les fils](#thread-supporting-channels) ci-dessous.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Comportement au lancement

Les agents lancent des sous-agents en arrière-plan avec l’outil `sessions_spawn`.
Les résultats sont renvoyés sous forme d’événements internes de la session parente ; l’agent
parent/demandeur décide si une mise à jour destinée à l’utilisateur est nécessaire.

<AccordionGroup>
  <Accordion title="Achèvement non bloquant et piloté par envoi">
    - `sessions_spawn` est non bloquant ; il renvoie immédiatement un identifiant d’exécution.
    - Une fois terminé, le sous-agent transmet son résultat à la session parente/du demandeur.
    - Les exécutions d’agent qui ont besoin des résultats des enfants doivent appeler `sessions_yield` après avoir lancé le travail requis. Cela met fin à l’exécution actuelle et permet à l’événement d’achèvement d’arriver comme prochain message visible par le modèle.
    - L’achèvement est piloté par envoi. Après le lancement, n’interrogez **pas** `/subagents list`, `sessions_list` ou `sessions_history` en boucle uniquement pour attendre la fin ; vérifiez l’état à la demande uniquement lors du débogage.
    - La sortie de l’enfant constitue un rapport ou des éléments probants que l’agent demandeur doit synthétiser. Il ne s’agit pas d’un texte d’instructions rédigé par l’utilisateur et elle ne peut pas remplacer les politiques système, développeur ou utilisateur.
    - Une fois le travail terminé, OpenClaw tente de fermer les onglets/processus de navigateur suivis qui ont été ouverts par cette session de sous-agent avant de poursuivre le flux de nettoyage de l’annonce.

  </Accordion>
  <Accordion title="Transmission de l’achèvement">
    - OpenClaw transmet les résultats à la session du demandeur par l’intermédiaire d’une exécution `agent` dotée d’une clé d’idempotence stable.
    - Si l’exécution du demandeur est toujours active, OpenClaw tente d’abord de la réveiller ou de la réorienter au lieu de démarrer un deuxième chemin de réponse visible.
    - Si un demandeur actif ne peut pas être réveillé, OpenClaw utilise à la place un transfert vers l’agent demandeur avec le même contexte d’achèvement, plutôt que d’abandonner l’annonce.
    - Un transfert réussi vers le parent termine la transmission du sous-agent même lorsque le parent décide qu’aucune mise à jour visible par l’utilisateur n’est nécessaire.
    - Les sous-agents natifs n’ont pas accès à l’outil de messagerie. Ils renvoient du texte d’assistant brut à l’agent parent/demandeur ; les réponses visibles par les humains restent régies par la politique de transmission normale de l’agent parent/demandeur.
    - Si le transfert direct ne peut pas être utilisé, la transmission passe par le routage de la file d’attente, puis par une brève nouvelle tentative de l’annonce avec temporisation exponentielle avant l’abandon définitif.
    - La transmission conserve la route résolue du demandeur : les routes d’achèvement liées au fil ou à la conversation sont prioritaires lorsqu’elles sont disponibles. Si l’origine de l’achèvement ne fournit qu’un canal, OpenClaw complète la cible ou le compte manquant à partir de la route résolue de la session du demandeur (`lastChannel` / `lastTo` / `lastAccountId`) afin que la transmission directe continue de fonctionner.

  </Accordion>
  <Accordion title="Métadonnées du transfert d’achèvement">
    Le transfert d’achèvement vers la session du demandeur est un contexte interne
    généré à l’exécution (et non un texte rédigé par l’utilisateur) qui comprend :

    - `Result` — le dernier texte de réponse `assistant` visible de l’enfant. La sortie tool/toolResult n’est pas intégrée aux résultats de l’enfant. Les exécutions ayant échoué définitivement ne réutilisent pas le texte de réponse capturé.
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`.
    - Des statistiques d’exécution et de jetons compactes.
    - Une instruction de révision demandant à l’agent demandeur de vérifier le résultat avant de décider si la tâche d’origine est terminée.
    - Des conseils de suivi demandant à l’agent demandeur de poursuivre la tâche ou d’enregistrer un suivi lorsque le résultat de l’enfant laisse des actions à effectuer.
    - Une instruction de mise à jour finale pour le cas où aucune autre action n’est nécessaire, rédigée dans un style d’assistant normal sans transmettre les métadonnées internes brutes.

  </Accordion>
  <Accordion title="Modes et environnement d’exécution ACP">
    - `--model` et `--thinking` remplacent les valeurs par défaut pour cette exécution particulière.
    - Utilisez `info`/`log` pour consulter les détails et la sortie après l’achèvement.
    - Pour les sessions persistantes liées à un fil, utilisez `sessions_spawn` avec `thread: true` et `mode: "session"`.
    - Si le canal du demandeur ne prend pas en charge les liaisons aux fils, utilisez `mode: "run"` au lieu de réessayer une combinaison de liaison à un fil impossible.
    - Pour les sessions de harnais ACP (Claude Code, Gemini CLI, OpenCode ou Codex ACP/acpx explicite), utilisez `sessions_spawn` avec `runtime: "acp"` lorsque l’outil annonce cet environnement d’exécution. Consultez [Modèle de transmission ACP](/fr/tools/acp-agents#delivery-model) lors du débogage des achèvements ou des boucles entre agents. Lorsque le plugin `codex` est activé, le contrôle des discussions/fils Codex doit privilégier `/codex ...` plutôt qu’ACP, sauf si l’utilisateur demande explicitement ACP/acpx.
    - OpenClaw masque `runtime: "acp"` tant qu’ACP n’est pas activé, que le demandeur est dans une sandbox ou qu’un plugin d’environnement d’exécution tel que `acpx` n’est pas chargé. `runtime: "acp"` attend un identifiant de harnais ACP externe ou une entrée `agents.list[]` avec `runtime.type="acp"` ; utilisez l’environnement d’exécution de sous-agent par défaut pour les agents de configuration OpenClaw normaux provenant de `agents_list`.

  </Accordion>
</AccordionGroup>

## Modes de contexte

Les sous-agents natifs démarrent de manière isolée, sauf si l’appelant demande explicitement de créer une branche de
la transcription actuelle.

| Mode       | Quand l’utiliser                                                                                                                        | Comportement                                                                       |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Recherche nouvelle, implémentation indépendante, opérations lentes des outils ou tout travail pouvant être décrit succinctement dans le texte de la tâche | Crée une transcription enfant vierge. Il s’agit du comportement par défaut, qui réduit la consommation de jetons. |
| `fork`     | Travail dépendant de la conversation actuelle, de résultats d’outils antérieurs ou d’instructions nuancées déjà présentes dans la transcription du demandeur | Crée une branche de la transcription du demandeur dans la session enfant avant le démarrage de l’enfant. |

Utilisez `fork` avec parcimonie. Il est destiné à la délégation sensible au contexte, et non à
remplacer la rédaction d’une invite de tâche claire.

## Outil : `sessions_spawn`

Démarre une exécution de sous-agent avec `deliver: false` sur la voie globale `subagent`,
puis exécute une étape d’annonce et publie la réponse d’annonce sur le canal de
discussion du demandeur.

La disponibilité dépend de la politique d’outils effective de l’appelant. Le profil intégré
`coding` inclut `sessions_spawn` ; `messaging` et `minimal` ne l’incluent
pas. `full` autorise tous les outils. Ajoutez `tools.alsoAllow: ["sessions_spawn",
"sessions_yield", "subagents"]`, ou utilisez `tools.profile: "coding"`, pour les
agents utilisant un profil plus restreint qui doivent tout de même déléguer du travail.
Les politiques d’autorisation ou de refus propres au canal/groupe, au fournisseur, à la sandbox et à chaque agent peuvent
toujours retirer l’outil après l’étape du profil. Utilisez `/tools` depuis la même
session pour confirmer la liste effective des outils.

**Valeurs par défaut :**

- **Modèle :** les sous-agents natifs héritent du modèle de l’appelant, sauf si vous définissez `agents.defaults.subagents.model` (ou `agents.list[].subagents.model` pour chaque agent). Les lancements dans l’environnement d’exécution ACP utilisent le même modèle de sous-agent configuré lorsqu’il est présent ; sinon, le harnais ACP conserve sa propre valeur par défaut. Une valeur explicite de `sessions_spawn.model` reste prioritaire.
- **Raisonnement :** les sous-agents natifs héritent du réglage de l’appelant, sauf si vous définissez `agents.defaults.subagents.thinking` (ou `agents.list[].subagents.thinking` pour chaque agent). Les lancements dans l’environnement d’exécution ACP appliquent également `agents.defaults.models["provider/model"].params.thinking` au modèle sélectionné. Une valeur explicite de `sessions_spawn.thinking` reste prioritaire.
- **Délai d’expiration de l’exécution :** OpenClaw utilise `agents.defaults.subagents.runTimeoutSeconds` lorsqu’il est défini ; sinon, il revient à `0` (aucun délai d’expiration). `sessions_spawn` n’accepte pas de remplacement du délai d’expiration propre à chaque appel.
- **Transmission de la tâche :** les sous-agents natifs reçoivent la tâche déléguée dans leur premier message visible `[Subagent Task]`. L’invite système du sous-agent contient les règles d’exécution et le contexte de routage, et non un doublon masqué de la tâche.

Les lancements de sous-agents natifs acceptés incluent les métadonnées résolues du modèle enfant
dans le résultat de l’outil : `resolvedModel` contient la référence du modèle appliqué et
`resolvedProvider` contient le préfixe du fournisseur lorsque la référence en possède un.

### Mode d’invite de délégation

`agents.defaults.subagents.delegationMode` contrôle uniquement les conseils de l’invite ; il ne modifie pas la politique d’outils et n’impose pas la délégation.

- `suggest` (par défaut) : conserve l’incitation standard de l’invite à utiliser des sous-agents pour les travaux plus volumineux ou plus lents.
- `prefer` : demande à l’agent principal de rester réactif et de déléguer via `sessions_spawn` tout travail plus complexe qu’une réponse directe.

Remplacement propre à chaque agent : `agents.list[].subagents.delegationMode`.

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
  La description de la tâche du sous-agent.
</ParamField>
<ParamField path="taskName" type="string">
  Identifiant stable facultatif permettant d’identifier un enfant précis dans une sortie d’état ultérieure. Il doit correspondre à `[a-z][a-z0-9_-]{0,63}` et ne peut pas être une cible réservée telle que `last` ou `all`.
</ParamField>
<ParamField path="label" type="string">
  Libellé facultatif lisible par l’utilisateur.
</ParamField>
<ParamField path="agentId" type="string">
  Lance l’exécution sous un autre identifiant d’agent configuré lorsque `subagents.allowAgents` l’autorise.
</ParamField>
<ParamField path="cwd" type="string">
  Répertoire de travail facultatif de la tâche pour l’exécution enfant. Les sous-agents natifs chargent toujours les fichiers d’amorçage depuis l’espace de travail de l’agent cible ; `cwd` modifie uniquement l’emplacement où les outils d’exécution et les environnements CLI effectuent le travail délégué.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` est réservé aux environnements ACP externes (`claude`, `droid`, `gemini`, `opencode` ou Codex ACP/acpx explicitement demandé) et aux entrées `agents.list[]` dont `runtime.type` vaut `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  ACP uniquement. Reprend une session d’environnement ACP existante lorsque `runtime: "acp"` ; ignoré pour les lancements de sous-agents natifs.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  ACP uniquement. Diffuse la sortie de l’exécution ACP vers la session parente lorsque `runtime: "acp"` ; à omettre pour les lancements de sous-agents natifs.
</ParamField>
<ParamField path="model" type="string">
  Remplace le modèle du sous-agent. Les valeurs non valides sont ignorées et le sous-agent s’exécute avec le modèle par défaut, accompagné d’un avertissement dans le résultat de l’outil.
</ParamField>
<ParamField path="thinking" type="string">
  Remplace le niveau de réflexion pour l’exécution du sous-agent.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Lorsque la valeur est `true`, demande la liaison à un fil de discussion du canal pour cette session de sous-agent.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Si `thread: true` et que `mode` est omis, la valeur par défaut devient `session`. `mode: "session"` nécessite `thread: true`.
  Si la liaison à un fil de discussion n’est pas disponible pour le canal du demandeur, utilisez plutôt `mode: "run"`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archive la session immédiatement après l’annonce (la transcription reste conservée par renommage).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` rejette le lancement sauf si l’environnement d’exécution enfant cible est placé dans un bac à sable.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` dérive la transcription actuelle du demandeur dans la session enfant. Sous-agents natifs uniquement. Les lancements liés à un fil de discussion utilisent `fork` par défaut ; ceux qui ne le sont pas utilisent `isolated`.
</ParamField>

<Warning>
`sessions_spawn` n’accepte **pas** les paramètres de remise au canal (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Les sous-agents natifs renvoient
leur dernier tour d’assistant au demandeur ; la remise externe reste sous la
responsabilité de l’agent parent/demandeur.
</Warning>

### Noms de tâches et ciblage

`taskName` est un identifiant destiné au modèle pour l’orchestration, et non une clé de session.
Utilisez-le pour attribuer des noms stables aux enfants, tels que `review_subagents`,
`linux_validation` ou `docs_update`, lorsqu’un coordinateur peut devoir inspecter
cet enfant ultérieurement.

La résolution des cibles accepte les correspondances exactes de `taskName` et les
préfixes non ambigus. La correspondance est limitée à la même fenêtre de cibles
actives/récentes que celle utilisée par les cibles `/subagents` numérotées ; ainsi,
un ancien enfant terminé ne rend pas ambigu un identifiant réutilisé. Si deux enfants
actifs ou récents partagent le même `taskName`, la cible est ambiguë ; utilisez plutôt
l’index de liste, la clé de session ou l’identifiant d’exécution.

Les cibles réservées `last` et `all` ne sont pas des valeurs `taskName` valides,
car elles ont déjà une signification de contrôle.

## Outil : `sessions_yield`

Met fin au tour actuel du modèle et attend que des événements d’exécution,
principalement les événements de fin des sous-agents, arrivent dans le message
suivant. Utilisez-le après avoir lancé le travail enfant requis lorsque le demandeur
ne peut pas produire de réponse finale avant la réception de ces résultats.

`sessions_yield` est la primitive d’attente. Ne la remplacez pas par des boucles
d’interrogation sur `subagents`, `sessions_list`, `sessions_history`, la commande
shell `sleep` ou l’interrogation de processus dans le seul but de détecter la fin
d’un enfant.

Utilisez `sessions_yield` uniquement lorsque la liste effective des outils de la
session l’inclut. Certains profils d’outils minimaux ou personnalisés peuvent exposer
`sessions_spawn` et `subagents` sans exposer `sessions_yield` ; dans ce cas, n’inventez
pas de boucle d’interrogation uniquement pour attendre la fin de l’exécution.

Lorsque des enfants actifs existent, OpenClaw injecte dans les tours normaux un bloc
d’invite compact `Active Subagents`, généré par l’environnement d’exécution, afin que
le demandeur puisse voir les sessions enfants actuelles, les identifiants d’exécution,
les états, les libellés, les tâches et les alias `taskName` sans interrogation. Les
champs de tâche et de libellé de ce bloc sont cités en tant que données, et non en
tant qu’instructions, car ils peuvent provenir d’arguments de lancement fournis par
l’utilisateur ou le modèle.

## Outil : `subagents`

Répertorie les exécutions de sous-agents lancées et détenues par la session du
demandeur. Sa portée est limitée au demandeur actuel ; un enfant ne peut voir que
les enfants qu’il contrôle lui-même.

Utilisez `subagents` pour obtenir l’état à la demande et effectuer le débogage.
Utilisez `sessions_yield` pour attendre les événements de fin.

## Sessions liées à un fil de discussion

Lorsque les liaisons à des fils de discussion sont activées pour un canal, un
sous-agent peut rester lié à un fil afin que les messages de suivi de l’utilisateur
dans ce fil continuent d’être acheminés vers la même session de sous-agent.

### Canaux prenant en charge les fils de discussion

Un canal prend en charge les sessions persistantes de sous-agents liées à un fil
de discussion (`sessions_spawn` avec `thread: true`) lorsqu’il enregistre un
adaptateur de liaison de conversation. Les canaux intégrés offrant cette prise en
charge sont : **Discord**, **iMessage**, **Matrix** et **Telegram**. Discord et Matrix
créent par défaut un fil enfant ; Telegram et iMessage lient par défaut la conversation
actuelle. Utilisez les clés de configuration `threadBindings` propres à chaque canal
pour l’activation, les délais d’expiration et `spawnSessions`.

### Déroulement rapide

<Steps>
  <Step title="Lancer">
    `sessions_spawn` avec `thread: true` (et facultativement `mode: "session"`).
  </Step>
  <Step title="Lier">
    OpenClaw crée ou lie un fil de discussion à cette cible de session dans le canal actif.
  </Step>
  <Step title="Acheminer les suivis">
    Les réponses et messages de suivi dans ce fil sont acheminés vers la session liée.
  </Step>
  <Step title="Inspecter les délais d’expiration">
    Utilisez `/session idle` pour inspecter ou mettre à jour la désactivation automatique
    de la focalisation après inactivité et `/session max-age` pour contrôler la limite absolue.
  </Step>
  <Step title="Dissocier">
    Utilisez `/unfocus` pour effectuer une dissociation manuelle.
  </Step>
</Steps>

### Commandes manuelles

| Commande           | Effet                                                                                     |
| ------------------ | ----------------------------------------------------------------------------------------- |
| `/focus <target>`  | Lie le fil actuel (ou en crée un) à une cible de sous-agent/session                       |
| `/unfocus`         | Supprime la liaison du fil actuellement lié                                               |
| `/agents`          | Répertorie les exécutions actives et l’état de liaison (`binding:<id>`, `unbound` ou `bindings unavailable`) |
| `/session idle`    | Inspecte/met à jour la désactivation automatique de la focalisation après inactivité (fils liés focalisés uniquement) |
| `/session max-age` | Inspecte/met à jour la limite absolue (fils liés focalisés uniquement)                    |

### Options de configuration

- **Valeur globale par défaut :** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Les clés de remplacement propres au canal et de liaison automatique au lancement** dépendent de l’adaptateur. Consultez la section [Canaux prenant en charge les fils de discussion](#thread-supporting-channels) ci-dessus.

Consultez la [Référence de configuration](/fr/gateway/configuration-reference) et les
[Commandes slash](/fr/tools/slash-commands) pour connaître les détails actuels des adaptateurs.

### Liste d’autorisation

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Liste des identifiants d’agents configurés pouvant être ciblés au moyen d’un `agentId` explicite (`["*"]` autorise toute cible configurée). Valeur par défaut : uniquement l’agent demandeur. Si vous définissez une liste et souhaitez toujours que le demandeur puisse se lancer lui-même avec `agentId`, incluez l’identifiant du demandeur dans la liste.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Liste d’autorisation par défaut des agents cibles configurés, utilisée lorsque l’agent demandeur ne définit pas son propre `subagents.allowAgents`.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Bloque les appels `sessions_spawn` qui omettent `agentId` (impose la sélection explicite d’un profil). Remplacement par agent : `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Délai d’expiration par appel pour les tentatives de remise de l’annonce `agent` du Gateway. Les valeurs sont des nombres entiers positifs de millisecondes et sont plafonnées au délai maximal sûr de la plateforme. Les nouvelles tentatives transitoires peuvent prolonger l’attente totale de l’annonce au-delà d’un délai configuré.
</ParamField>

Si la session du demandeur est placée dans un bac à sable, `sessions_spawn` rejette
les cibles qui s’exécuteraient sans bac à sable.

### Découverte

Utilisez `agents_list` pour voir quels identifiants d’agents sont actuellement
autorisés pour `sessions_spawn`. La réponse inclut le modèle effectif de chaque
agent répertorié et les métadonnées d’environnement d’exécution intégrées afin que
les appelants puissent distinguer OpenClaw, le serveur d’application Codex et les
autres environnements d’exécution natifs configurés.

Les entrées `allowAgents` doivent désigner des identifiants d’agents configurés dans
`agents.list[]`. `["*"]` désigne tout agent cible configuré ainsi que le demandeur.
Si la configuration d’un agent est supprimée mais que son identifiant reste dans
`allowAgents`, `sessions_spawn` rejette cet identifiant et `agents_list` l’omet.
Exécutez `openclaw doctor --fix` pour nettoyer les entrées obsolètes de la liste
d’autorisation, ou ajoutez une entrée `agents.list[]` minimale lorsque la cible doit
rester lançable tout en héritant des valeurs par défaut.

### Archivage automatique

- Les sessions de sous-agents sont automatiquement archivées après `agents.defaults.subagents.archiveAfterMinutes` (valeur par défaut : `60`).
- L’archivage utilise `sessions.delete` et renomme la transcription en `*.deleted.<timestamp>` (dans le même dossier).
- `cleanup: "delete"` archive immédiatement après l’annonce (la transcription reste conservée par renommage).
- L’archivage automatique est effectué au mieux ; les minuteurs en attente sont perdus si le Gateway redémarre.
- Les délais d’expiration d’exécution configurés n’archivent **pas** automatiquement ; ils arrêtent uniquement l’exécution. La session demeure jusqu’à l’archivage automatique.
- L’archivage automatique s’applique de la même manière aux sessions de profondeur 1 et de profondeur 2.
- Le nettoyage du navigateur est distinct du nettoyage d’archivage : les onglets et processus de navigateur suivis sont fermés au mieux à la fin de l’exécution, même si la transcription ou l’enregistrement de session est conservé.

## Sous-agents imbriqués

Par défaut, les sous-agents ne peuvent pas lancer leurs propres sous-agents
(`maxSpawnDepth: 1`). Définissez `maxSpawnDepth: 2` pour autoriser un niveau
d’imbrication — le **modèle d’orchestrateur** : principal → sous-agent orchestrateur →
sous-sous-agents travailleurs.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // autoriser les sous-agents à lancer des enfants (valeur par défaut : 1, plage 1-5)
        maxChildrenPerAgent: 5, // nombre maximal d’enfants actifs par session d’agent (valeur par défaut : 5, plage 1-20)
        maxConcurrent: 8, // limite globale de concurrence (valeur par défaut : 8)
        runTimeoutSeconds: 900, // délai d’expiration par défaut pour sessions_spawn (0 = aucun délai)
        announceTimeoutMs: 120000, // délai d’expiration par appel pour l’annonce du Gateway
      },
    },
  },
}
```

### Niveaux de profondeur

| Profondeur | Forme de la clé de session                   | Rôle                                                  | Peut créer des sous-agents ?     |
| ---------- | ----------------------------------------- | ----------------------------------------------------- | -------------------------------- |
| 0          | `agent:<id>:main`                         | Agent principal                                       | Toujours                         |
| 1          | `agent:<id>:subagent:<uuid>`              | Sous-agent (orchestrateur si la profondeur 2 est autorisée) | Uniquement si `maxSpawnDepth >= 2` |
| 2          | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sous-sous-agent (agent d’exécution terminal)        | Jamais                           |

### Chaîne d’annonce

Les résultats remontent la chaîne :

1. L’agent d’exécution de profondeur 2 termine → envoie une annonce à son parent (orchestrateur de profondeur 1).
2. L’orchestrateur de profondeur 1 reçoit l’annonce, synthétise les résultats, termine → envoie une annonce à l’agent principal.
3. L’agent principal reçoit l’annonce et transmet les résultats à l’utilisateur.

Chaque niveau ne voit que les annonces de ses enfants directs.

<Note>
**Recommandation opérationnelle :** lancez une seule fois le travail des enfants et attendez les événements de fin au lieu de créer des boucles d’interrogation autour de `sessions_list`, `sessions_history`, `/subagents list` ou de commandes de temporisation `exec`.
`sessions_list` et `/subagents list` maintiennent les relations entre sessions enfants centrées sur le travail actif : les enfants actifs restent rattachés, les enfants terminés demeurent visibles pendant une courte période récente, et les liens vers des enfants obsolètes présents uniquement dans le stockage sont ignorés après expiration de leur période de fraîcheur. Cela empêche les anciennes métadonnées `spawnedBy` / `parentSessionKey` de faire réapparaître des enfants fantômes après un redémarrage. Si un événement de fin d’un enfant arrive après que vous avez déjà envoyé la réponse finale, la réponse de suivi correcte est exactement le jeton silencieux `NO_REPLY` / `no_reply`.
</Note>

### Politique des outils selon la profondeur

- Le rôle et la portée du contrôle sont inscrits dans les métadonnées de session au moment de la création. Cela empêche les clés de session plates ou restaurées de récupérer accidentellement les privilèges d’orchestrateur.
- **Profondeur 1 (orchestrateur, lorsque `maxSpawnDepth >= 2`) :** dispose de `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` afin de pouvoir créer des enfants et consulter leur état. Les autres outils de session ou système restent interdits.
- **Profondeur 1 (agent terminal, lorsque `maxSpawnDepth == 1`) :** aucun outil de session (comportement par défaut actuel).
- **Profondeur 2 (agent d’exécution terminal) :** aucun outil de session — `sessions_spawn` est toujours interdit à la profondeur 2. Ne peut pas créer d’autres enfants.

### Limite de création par agent

Chaque session d’agent (quelle que soit sa profondeur) peut avoir au maximum `maxChildrenPerAgent`
(par défaut `5`) enfants actifs simultanément. Cela évite une démultiplication incontrôlée
à partir d’un seul orchestrateur.

### Arrêt en cascade

L’arrêt d’un orchestrateur de profondeur 1 arrête automatiquement tous ses enfants de profondeur 2 :

- `/stop` dans la conversation principale arrête tous les agents de profondeur 1 et propage l’arrêt à leurs enfants de profondeur 2.

## Authentification

L'authentification des sous-agents est résolue selon l'**identifiant de l'agent**, et non selon le type de session :

- La clé de session du sous-agent est `agent:<agentId>:subagent:<uuid>`.
- Le magasin d'authentification est chargé depuis l'`agentDir` de cet agent.
- Les profils d'authentification de l'agent principal sont fusionnés comme **solution de secours** ; en cas de conflit, les profils de l'agent remplacent ceux de l'agent principal.

La fusion est additive, de sorte que les profils de l'agent principal sont toujours disponibles comme
solutions de secours. L'isolation complète de l'authentification par agent n'est pas encore prise en charge.

## Annonce

Les sous-agents rendent compte au moyen d'une étape d'annonce :

- L'étape d'annonce s'exécute dans la session du sous-agent (et non dans celle du demandeur).
- Si le sous-agent répond exactement `ANNOUNCE_SKIP`, rien n'est publié.
- Si le dernier texte de l'assistant correspond exactement au jeton silencieux `NO_REPLY` / `no_reply`, la sortie d'annonce est supprimée, même si une progression visible avait été affichée auparavant.

La remise dépend de la profondeur du demandeur :

- Les sessions de demandeur de premier niveau utilisent un appel `agent` de suivi avec une livraison externe (`deliver=true`).
- Les sessions de sous-agent de demandeur imbriquées reçoivent une injection interne de suivi (`deliver=false`) afin que l’orchestrateur puisse synthétiser les résultats enfants au sein de la session.
- Si une session de sous-agent de demandeur imbriquée n’existe plus, OpenClaw se rabat sur le demandeur de cette session lorsqu’il est disponible.

Pour les sessions de demandeur de premier niveau, la livraison directe en mode d’achèvement
résout d’abord toute route de conversation/de fil liée et toute substitution par un hook, puis complète
les champs de canal et de cible manquants à partir de la route stockée de la session du demandeur.
Ainsi, les achèvements restent dans la bonne discussion ou le bon sujet, même lorsque l’origine de
l’achèvement identifie uniquement le canal.

L’agrégation des achèvements enfants est limitée à l’exécution actuelle du demandeur lors de
la création des résultats d’achèvement imbriqués, ce qui empêche les sorties enfants obsolètes
d’exécutions antérieures de se retrouver dans l’annonce actuelle. Les réponses aux annonces préservent
le routage des fils et des sujets lorsqu’il est disponible sur les adaptateurs de canal.

### Contexte d’annonce

Le contexte d’annonce est normalisé sous la forme d’un bloc d’événement interne stable :

| Champ               | Source                                                                                                         |
| ------------------- | -------------------------------------------------------------------------------------------------------------- |
| Source              | `subagent` ou `cron`                                                                                           |
| Identifiants de session | Clé/identifiant de la session enfant                                                                        |
| Type                | Type d’annonce + libellé de la tâche                                                                           |
| État                | Déduit du résultat d’exécution (`ok`, `error`, `timeout` ou `unknown`) — **non** inféré à partir du texte du modèle |
| Contenu du résultat | Dernier texte visible de l’assistant provenant de l’enfant                                                     |
| Suivi               | Instruction indiquant quand répondre ou garder le silence                                                      |

Les exécutions terminales ayant échoué signalent l’état d’échec sans relire le
texte de réponse capturé. La sortie tool/toolResult n’est pas promue en texte de résultat enfant.

### Ligne de statistiques

Les charges utiles d’annonce incluent une ligne de statistiques à la fin (même avec retour à la ligne) :

- Durée d’exécution (par ex. `runtime 5m12s`).
- Utilisation des tokens (entrée/sortie/total).
- Coût estimé lorsque la tarification des modèles est configurée (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` et chemin de la transcription afin que l’agent principal puisse récupérer l’historique via `sessions_history` ou inspecter le fichier sur le disque.

Les métadonnées internes sont destinées uniquement à l’orchestration ; les réponses destinées à l’utilisateur
doivent être reformulées dans le ton normal de l’assistant.

### Pourquoi privilégier `sessions_history`

`sessions_history` est la méthode d’orchestration la plus sûre pour lire la
transcription d’un enfant depuis un tour d’agent :

- Masque le texte ressemblant à des identifiants ou des tokens, même lorsque le masquage général des journaux est désactivé.
- Tronque les longs blocs de texte (4000 caractères par bloc) et supprime les signatures de réflexion, les charges utiles de relecture du raisonnement et les données d’image intégrées.
- Impose une limite de réponse de 80 Ko ; les lignes trop volumineuses sont remplacées par `[sessions_history omitted: message too large]`.
- Utilisez `nextOffset` lorsqu’il est présent pour parcourir à rebours les anciennes fenêtres de transcription.
- `sessions_history` ne supprime **pas** les balises de raisonnement, la structure `<relevant-memories>` ni le XML des appels d’outils du texte des messages — il renvoie des blocs de contenu structurés proches de la forme brute de la transcription, mais masqués et limités en taille. `/subagents log` applique un assainissement plus poussé du texte (suppression des balises de raisonnement, de la structure de mémoire et du XML des appels d’outils), car il affiche des lignes de discussion en texte brut plutôt que des blocs structurés.
- L’inspection de la transcription brute sur le disque constitue la solution de secours lorsque vous avez besoin de la transcription complète, octet par octet.

## Politique des outils

Les sous-agents utilisent d’abord le même profil et le même pipeline de
politique des outils que l’agent parent ou cible. OpenClaw applique ensuite
la couche de restrictions des sous-agents.

Les sous-agents perdent toujours `gateway`, `agents_list`, `session_status` et
`cron`, quels que soient leur profondeur ou leur rôle (outils système/interactifs ou
outils que l’agent principal doit coordonner). Les sous-agents feuilles (comportement
par défaut à la profondeur 1, et toujours à la profondeur 2) perdent également `subagents`,
`sessions_list`, `sessions_history` et `sessions_spawn`. Les sous-agents ne
reçoivent jamais l’outil `message` — il est désactivé lors de leur création, et non filtré par
cette liste d’interdiction — et `sessions_send` reste interdit afin que les sous-agents
communiquent uniquement par la chaîne d’annonces.

Ici aussi, `sessions_history` reste une vue de rappel limitée et assainie — il
ne s’agit pas d’un export brut de la transcription.

Lorsque `maxSpawnDepth >= 2`, les sous-agents orchestrateurs de profondeur 1
reçoivent en outre `sessions_spawn`, `subagents`, `sessions_list` et
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
        // l’interdiction prévaut
        deny: ["gateway", "cron"],
        // si allow est défini, il devient une liste d’autorisation exclusive (deny prévaut toujours)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` est un filtre final reposant exclusivement sur une liste d’autorisation. Il peut restreindre
l’ensemble d’outils déjà résolu, mais ne peut pas **réajouter** un outil supprimé
par `tools.profile`. Par exemple, `tools.profile: "coding"` inclut
`web_search`/`web_fetch`, mais pas l’outil `browser`. Pour permettre aux
sous-agents utilisant le profil de codage d’employer l’automatisation du navigateur, ajoutez le navigateur à
l’étape du profil :

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Utilisez `agents.list[].tools.alsoAllow: ["browser"]` pour chaque agent lorsque seul un
agent doit disposer de l’automatisation du navigateur.

## Concurrence

Les sous-agents utilisent une file d’attente dédiée au sein du processus :

- **Nom de la file :** `subagent`
- **Concurrence :** `agents.defaults.subagents.maxConcurrent` (valeur par défaut : `8`)

## Disponibilité et récupération

OpenClaw ne considère pas l’absence de `endedAt` comme une preuve permanente qu’un
sous-agent est encore actif. Les exécutions non terminées plus anciennes que la fenêtre
d’obsolescence des exécutions (2 heures, ou le délai d’expiration configuré de l’exécution plus une courte période de grâce,
selon la durée la plus longue) ne sont plus comptabilisées comme actives/en attente dans `/subagents list`,
les résumés d’état, le blocage de l’achèvement des descendants et les vérifications de
concurrence par session.

Après le redémarrage d’un Gateway, les exécutions restaurées, obsolètes et non terminées sont élaguées, sauf si
leur session enfant est marquée `abortedLastRun: true`. Les exécutions interrompues par un
redémarrage restent enregistrées pour le flux de récupération des sous-agents orphelins : les exécutions obsolètes
sont finalisées sans reprise, tandis que les sessions enfants récentes reçoivent
un message synthétique de reprise avant l’effacement du marqueur d’interruption.

La récupération automatique après redémarrage est limitée par session enfant. Si le même
enfant sous-agent est accepté de manière répétée pour une récupération d’orphelin pendant la
fenêtre de blocages répétés rapprochés, OpenClaw conserve une marque d’exclusion de récupération pour cette
session et cesse de la reprendre automatiquement lors des redémarrages ultérieurs. Exécutez
`openclaw tasks maintenance --apply` pour réconcilier l’enregistrement de la tâche, ou
`openclaw doctor --fix` pour effacer les indicateurs obsolètes de récupération après interruption sur les
sessions marquées d’une exclusion.

<Note>
Si la création d’un sous-agent échoue avec `PAIRING_REQUIRED` /
`scope-upgrade` du Gateway, vérifiez l’appelant RPC avant de modifier l’état d’appairage.
La coordination interne de `sessions_spawn` est distribuée dans le processus lorsque
l’appelant s’exécute déjà dans le contexte de la requête du Gateway ; elle n’ouvre donc
pas de WebSocket en boucle locale et ne dépend pas de la portée de référence des appareils appairés
de la CLI. Les appelants extérieurs au processus du Gateway utilisent toujours la solution de secours
WebSocket avec `client.id: "gateway-client"` et `client.mode: "backend"`
via une authentification directe en boucle locale par token partagé/mot de passe. Les appelants distants, les
`deviceIdentity` explicites, les chemins explicites de token d’appareil et les clients de
navigateur/Node nécessitent toujours l’approbation normale de l’appareil pour les élévations de portée.
</Note>

## Arrêt

- L’envoi de `/stop` dans la discussion du demandeur interrompt la session du demandeur et arrête toutes les exécutions de sous-agents actives qu’elle a créées, en propageant l’arrêt aux enfants imbriqués.

## Limites

- L’annonce d’un sous-agent est effectuée **au mieux**. Si le Gateway redémarre, les tâches d’« annonce en retour » en attente sont perdues.
- Les sous-agents partagent toujours les mêmes ressources du processus Gateway ; considérez `maxConcurrent` comme une soupape de sécurité.
- `sessions_spawn` est toujours non bloquant : il renvoie immédiatement `{ status: "accepted", runId, childSessionKey }`.
- Le contexte des sous-agents injecte uniquement `AGENTS.md` et `TOOLS.md` (sans `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md` ni `BOOTSTRAP.md`). Les sous-agents natifs de Codex respectent la même limite : `TOOLS.md` reste dans les instructions héritées du fil Codex, tandis que les fichiers de personnalité, d’identité et d’utilisateur réservés au parent sont injectés sous forme d’instructions de collaboration limitées au tour afin que les enfants ne les clonent pas.
- La profondeur maximale d’imbrication est de 5 (plage de `maxSpawnDepth` : 1-5). Une profondeur de 2 est recommandée pour la plupart des cas d’utilisation.
- `maxChildrenPerAgent` limite le nombre d’enfants actifs par session (valeur par défaut : `5`, plage : `1-20`).

## Contenu associé

- [Outils de session et modifications d’état](/fr/concepts/session-tool)
- [Agents ACP](/fr/tools/acp-agents)
- [Envoi d’agent](/fr/tools/agent-send)
- [Tâches en arrière-plan](/fr/automation/tasks)
- [Outils de bac à sable multi-agents](/fr/tools/multi-agent-sandbox-tools)
