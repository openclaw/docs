---
read_when:
    - Vous souhaitez effectuer un travail en arrière-plan ou en parallèle par l’intermédiaire de l’agent
    - Vous modifiez la politique de l’outil sessions_spawn ou des sous-agents
    - Vous mettez en œuvre ou dépannez des sessions de sous-agents liées à un fil de discussion
sidebarTitle: Sub-agents
summary: Lancer des exécutions isolées d’agents en arrière-plan qui annoncent leurs résultats dans le chat du demandeur
title: Sous-agents
x-i18n:
    generated_at: "2026-07-12T03:25:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
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
- Maintenir les sous-agents isolés par défaut (séparation des sessions, mise en bac à sable facultative).
- Rendre la surface des outils difficile à utiliser de manière incorrecte : par défaut, les sous-agents n’ont **pas** accès aux outils de session ou de messagerie.
- Prendre en charge une profondeur d’imbrication configurable pour les modèles d’orchestration.

<Note>
**Remarque sur les coûts :** par défaut, chaque sous-agent possède son propre contexte et sa propre consommation de jetons.
Pour les tâches lourdes ou répétitives, définissez un modèle moins coûteux pour les sous-agents
et conservez un modèle de meilleure qualité pour votre agent principal via
`agents.defaults.subagents.model` ou des remplacements propres à chaque agent. Lorsqu’un enfant
a réellement besoin de la transcription actuelle du demandeur, lancez-le avec
`context: "fork"`. Les sessions de sous-agent liées à un fil utilisent
`context: "fork"` par défaut, car elles créent une branche de la conversation actuelle dans un
fil de suivi.
</Note>

## Commande oblique

`/subagents` examine les exécutions de sous-agents de la **session actuelle** :

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` affiche les métadonnées de l’exécution (état, horodatages, identifiant de session,
chemin de la transcription, nettoyage). `/subagents log` affiche les échanges récents d’une
exécution ; ajoutez le jeton `tools` pour inclure les messages d’appel et de résultat des outils
(omis par défaut). Utilisez `sessions_history` pour obtenir, depuis une exécution d’agent, une vue
limitée et filtrée pour la sécurité, ou consultez le chemin de la transcription sur le disque pour
accéder à la transcription brute complète.

### Commandes de liaison aux fils

Ces commandes fonctionnent sur les canaux dotés de liaisons de fils persistantes. Consultez
[Canaux prenant en charge les fils](#thread-supporting-channels) ci-dessous.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Comportement du lancement

Les agents lancent des sous-agents en arrière-plan à l’aide de l’outil `sessions_spawn`.
Les achèvements sont renvoyés sous forme d’événements internes de la session parente ; l’agent
parent/demandeur décide si une mise à jour destinée à l’utilisateur est nécessaire.

<AccordionGroup>
  <Accordion title="Achèvement non bloquant et transmis activement">
    - `sessions_spawn` est non bloquant ; il renvoie immédiatement un identifiant d’exécution.
    - À l’achèvement, le sous-agent transmet son résultat à la session parente/du demandeur.
    - Les exécutions d’agent qui ont besoin des résultats des enfants doivent appeler `sessions_yield` après avoir lancé les travaux nécessaires. Cela met fin à l’exécution actuelle et permet à l’événement d’achèvement d’arriver comme prochain message visible par le modèle.
    - L’achèvement est transmis activement. Une fois le sous-agent lancé, n’interrogez **pas** `/subagents list`, `sessions_list` ou `sessions_history` en boucle uniquement pour attendre qu’il se termine ; vérifiez son état à la demande seulement lors du débogage.
    - La sortie de l’enfant constitue un rapport ou des éléments probants que l’agent demandeur doit synthétiser. Il ne s’agit pas d’un texte d’instructions rédigé par l’utilisateur et elle ne peut pas remplacer les règles système, développeur ou utilisateur.
    - À l’achèvement, OpenClaw tente, dans la mesure du possible, de fermer les onglets de navigateur et les processus suivis ouverts par cette session de sous-agent avant que le flux de nettoyage de l’annonce ne se poursuive.

  </Accordion>
  <Accordion title="Remise de l’achèvement">
    - OpenClaw renvoie les achèvements à la session du demandeur par l’intermédiaire d’une exécution `agent` dotée d’une clé d’idempotence stable.
    - Si l’exécution du demandeur est encore active, OpenClaw tente d’abord de la réveiller ou de l’orienter au lieu de démarrer un second parcours de réponse visible.
    - Si un demandeur actif ne peut pas être réveillé, OpenClaw revient à un transfert vers l’agent demandeur avec le même contexte d’achèvement au lieu d’abandonner l’annonce.
    - Un transfert réussi vers le parent termine la remise du sous-agent même lorsque le parent décide qu’aucune mise à jour visible par l’utilisateur n’est nécessaire.
    - Les sous-agents natifs n’ont pas accès à l’outil de messagerie. Ils renvoient du texte brut d’assistant à l’agent parent/demandeur ; les réponses visibles par les humains restent régies par la politique normale de remise de l’agent parent/demandeur.
    - Si le transfert direct ne peut pas être utilisé, la remise revient au routage par file d’attente, puis à une courte série de nouvelles tentatives de l’annonce avec temporisation exponentielle avant l’abandon définitif.
    - La remise conserve la route résolue du demandeur : les routes d’achèvement liées à un fil ou à une conversation prévalent lorsqu’elles sont disponibles. Si l’origine de l’achèvement ne fournit qu’un canal, OpenClaw complète la cible ou le compte manquant à partir de la route résolue de la session du demandeur (`lastChannel` / `lastTo` / `lastAccountId`) afin que la remise directe fonctionne malgré tout.

  </Accordion>
  <Accordion title="Métadonnées du transfert d’achèvement">
    Le transfert d’achèvement vers la session du demandeur est un contexte interne
    généré à l’exécution (et non un texte rédigé par l’utilisateur) qui comprend :

    - `Result` — le texte de la dernière réponse `assistant` visible de l’enfant. La sortie tool/toolResult n’est pas intégrée aux résultats de l’enfant. Les exécutions ayant échoué de manière définitive ne réutilisent pas le texte de réponse capturé.
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`.
    - Des statistiques compactes sur l’exécution et les jetons.
    - Une instruction de vérification demandant à l’agent demandeur de vérifier le résultat avant de décider si la tâche d’origine est terminée.
    - Des consignes de suivi demandant à l’agent demandeur de poursuivre la tâche ou de consigner un suivi lorsque le résultat de l’enfant nécessite encore une action.
    - Une instruction de mise à jour finale pour le cas où aucune autre action n’est nécessaire, rédigée dans le style normal d’un assistant sans transmettre les métadonnées internes brutes.

  </Accordion>
  <Accordion title="Modes et environnement d’exécution ACP">
    - `--model` et `--thinking` remplacent les valeurs par défaut pour cette exécution précise.
    - Utilisez `info`/`log` pour examiner les détails et la sortie après l’achèvement.
    - Pour les sessions persistantes liées à un fil, utilisez `sessions_spawn` avec `thread: true` et `mode: "session"`.
    - Si le canal du demandeur ne prend pas en charge les liaisons de fils, utilisez `mode: "run"` au lieu de réessayer une combinaison liée à un fil qui ne peut pas fonctionner.
    - Pour les sessions de banc d’essai ACP (Claude Code, Gemini CLI, OpenCode ou Codex ACP/acpx explicite), utilisez `sessions_spawn` avec `runtime: "acp"` lorsque l’outil annonce cet environnement d’exécution. Consultez [Modèle de remise ACP](/fr/tools/acp-agents#delivery-model) lors du débogage des achèvements ou des boucles entre agents. Lorsque le Plugin `codex` est activé, le contrôle des discussions et des fils Codex doit privilégier `/codex ...` plutôt qu’ACP, sauf si l’utilisateur demande explicitement ACP/acpx.
    - OpenClaw masque `runtime: "acp"` tant qu’ACP n’est pas activé, que le demandeur est en bac à sable ou qu’aucun Plugin d’environnement d’exécution tel que `acpx` n’est chargé. `runtime: "acp"` attend un identifiant de banc d’essai ACP externe ou une entrée `agents.list[]` avec `runtime.type="acp"` ; utilisez l’environnement d’exécution de sous-agent par défaut pour les agents de configuration OpenClaw ordinaires provenant de `agents_list`.

  </Accordion>
</AccordionGroup>

## Modes de contexte

Les sous-agents natifs démarrent isolés, sauf si l’appelant demande explicitement de dupliquer
la transcription actuelle.

| Mode       | Quand l’utiliser                                                                                                                        | Comportement                                                                                   |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Nouvelle recherche, mise en œuvre indépendante, opération lente d’un outil ou toute tâche pouvant être décrite dans le texte de la tâche | Crée une transcription enfant vierge. Il s’agit du mode par défaut, qui réduit la consommation de jetons. |
| `fork`     | Travail dépendant de la conversation actuelle, des résultats d’outils antérieurs ou d’instructions nuancées déjà présentes dans la transcription du demandeur | Duplique la transcription du demandeur dans la session enfant avant le démarrage de l’enfant. |

Utilisez `fork` avec parcimonie. Il est destiné à la délégation sensible au contexte, et non à
remplacer la rédaction d’une consigne de tâche claire.

## Outil : `sessions_spawn`

Démarre une exécution de sous-agent avec `deliver: false` sur la file globale `subagent`,
puis exécute une étape d’annonce et publie la réponse de l’annonce sur le canal de discussion
du demandeur.

La disponibilité dépend de la politique effective d’outils de l’appelant. Le profil intégré
`coding` inclut `sessions_spawn` ; `messaging` et `minimal` ne l’incluent
pas. `full` autorise tous les outils. Ajoutez `tools.alsoAllow: ["sessions_spawn",
"sessions_yield", "subagents"]`, ou utilisez `tools.profile: "coding"`, pour les
agents dont le profil plus restreint doit tout de même pouvoir déléguer du travail.
Les politiques d’autorisation et d’interdiction propres au canal/groupe, au fournisseur, au bac à sable et à chaque agent peuvent
encore retirer l’outil après l’étape du profil. Utilisez `/tools` depuis la même
session pour confirmer la liste effective des outils.

**Valeurs par défaut :**

- **Modèle :** les sous-agents natifs héritent du modèle de l’appelant, sauf si vous définissez `agents.defaults.subagents.model` (ou `agents.list[].subagents.model` pour chaque agent). Les lancements dans l’environnement d’exécution ACP utilisent le même modèle de sous-agent configuré lorsqu’il est présent ; sinon, le banc d’essai ACP conserve sa propre valeur par défaut. Une valeur explicite de `sessions_spawn.model` reste prioritaire.
- **Raisonnement :** les sous-agents natifs héritent du réglage de l’appelant, sauf si vous définissez `agents.defaults.subagents.thinking` (ou `agents.list[].subagents.thinking` pour chaque agent). Les lancements dans l’environnement d’exécution ACP appliquent également `agents.defaults.models["provider/model"].params.thinking` pour le modèle sélectionné. Une valeur explicite de `sessions_spawn.thinking` reste prioritaire.
- **Délai maximal d’exécution :** OpenClaw utilise `agents.defaults.subagents.runTimeoutSeconds` lorsqu’il est défini ; sinon, il revient à `0` (aucun délai maximal). `sessions_spawn` n’accepte pas de remplacement du délai maximal pour chaque appel.
- **Remise de la tâche :** les sous-agents natifs reçoivent la tâche déléguée dans leur premier message visible `[Subagent Task]`. L’invite système du sous-agent contient les règles d’exécution et le contexte de routage, et non une copie cachée de la tâche.

Les lancements de sous-agents natifs acceptés incluent les métadonnées résolues du modèle enfant
dans le résultat de l’outil : `resolvedModel` contient la référence du modèle appliqué et
`resolvedProvider` contient le préfixe du fournisseur lorsque la référence en comporte un.

### Mode d’invite de délégation

`agents.defaults.subagents.delegationMode` contrôle uniquement les consignes de l’invite ; il ne modifie pas la politique d’outils et n’impose pas la délégation.

- `suggest` (par défaut) : conserve l’incitation standard de l’invite à utiliser des sous-agents pour les travaux plus importants ou plus lents.
- `prefer` : demande à l’agent principal de rester réactif et de déléguer, via `sessions_spawn`, toute tâche plus complexe qu’une réponse directe.

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
  Description de la tâche destinée au sous-agent.
</ParamField>
<ParamField path="taskName" type="string">
  Identifiant stable facultatif permettant d’identifier un enfant précis dans une sortie d’état ultérieure. Doit correspondre à `[a-z][a-z0-9_-]{0,63}` et ne peut pas être une cible réservée telle que `last` ou `all`.
</ParamField>
<ParamField path="label" type="string">
  Libellé facultatif lisible par l’utilisateur.
</ParamField>
<ParamField path="agentId" type="string">
  Lance sous un autre identifiant d’agent configuré lorsque `subagents.allowAgents` l’autorise.
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
  Remplace le modèle du sous-agent. Les valeurs non valides sont ignorées et le sous-agent s’exécute avec le modèle par défaut, avec un avertissement dans le résultat de l’outil.
</ParamField>
<ParamField path="thinking" type="string">
  Remplace le niveau de réflexion pour l’exécution du sous-agent.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Lorsque la valeur est `true`, demande l’association à un fil de discussion du canal pour cette session de sous-agent.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Si `thread: true` et que `mode` est omis, la valeur par défaut devient `session`. `mode: "session"` exige `thread: true`.
  Si l’association à un fil de discussion n’est pas disponible pour le canal du demandeur, utilisez plutôt `mode: "run"`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archive la session immédiatement après l’annonce (la transcription reste conservée par renommage).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` refuse le lancement sauf si l’environnement d’exécution enfant cible est isolé.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` dérive la transcription actuelle du demandeur dans la session enfant. Sous-agents natifs uniquement. Les lancements associés à un fil utilisent `fork` par défaut ; les lancements sans fil utilisent `isolated` par défaut.
</ParamField>

<Warning>
`sessions_spawn` n’accepte **pas** les paramètres de remise au canal (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Les sous-agents natifs
renvoient leur dernier tour d’assistant au demandeur ; la remise externe reste
du ressort de l’agent parent/demandeur.
</Warning>

### Noms de tâches et ciblage

`taskName` est un identifiant destiné au modèle pour l’orchestration, et non une clé de session.
Utilisez-le pour des noms d’enfants stables tels que `review_subagents`,
`linux_validation` ou `docs_update` lorsqu’un coordinateur peut avoir besoin d’inspecter
cet enfant ultérieurement.

La résolution de cible accepte les correspondances exactes de `taskName` et les
préfixes non ambigus. La correspondance est limitée à la même fenêtre de cibles
actives/récentes que celle utilisée par les cibles `/subagents` numérotées, de sorte
qu’un ancien enfant terminé ne rende pas ambigu un identifiant réutilisé. Si deux
enfants actifs ou récents partagent le même `taskName`, la cible est ambiguë ; utilisez
plutôt l’index de la liste, la clé de session ou l’identifiant d’exécution.

Les cibles réservées `last` et `all` ne sont pas des valeurs `taskName` valides,
car elles possèdent déjà une signification de contrôle.

## Outil : `sessions_yield`

Met fin au tour actuel du modèle et attend que les événements d’exécution,
principalement les événements de fin des sous-agents, arrivent dans le message
suivant. Utilisez-le après avoir lancé le travail enfant requis lorsque le demandeur
ne peut pas produire de réponse finale avant la réception de ces résultats.

`sessions_yield` est la primitive d’attente. Ne la remplacez pas par des boucles
d’interrogation utilisant `subagents`, `sessions_list`, `sessions_history`, la commande
shell `sleep` ou l’interrogation des processus uniquement pour détecter la fin d’un enfant.

Utilisez `sessions_yield` uniquement lorsque la liste effective des outils de la session
l’inclut. Certains profils d’outils minimaux ou personnalisés peuvent exposer
`sessions_spawn` et `subagents` sans exposer `sessions_yield` ; dans ce cas, n’inventez
pas de boucle d’interrogation uniquement pour attendre la fin.

Lorsque des enfants actifs existent, OpenClaw injecte dans les tours normaux un bloc
d’invite compact `Active Subagents`, généré à l’exécution, afin que le demandeur puisse
voir les sessions enfants actuelles, les identifiants d’exécution, les états, les
libellés, les tâches et les alias `taskName` sans interrogation. Les champs de tâche
et de libellé de ce bloc sont cités en tant que données, et non en tant qu’instructions,
car ils peuvent provenir d’arguments de lancement fournis par l’utilisateur ou le modèle.

## Outil : `subagents`

Répertorie les exécutions de sous-agents lancées et détenues par la session du demandeur.
Sa portée est limitée au demandeur actuel ; un enfant ne peut voir que les enfants
qu’il contrôle lui-même.

Utilisez `subagents` pour consulter l’état à la demande et effectuer le débogage.
Utilisez `sessions_yield` pour attendre les événements de fin.

## Sessions associées à un fil

Lorsque les associations à des fils sont activées pour un canal, un sous-agent peut
rester associé à un fil afin que les messages de suivi de l’utilisateur dans ce fil
continuent d’être acheminés vers la même session de sous-agent.

### Canaux prenant en charge les fils

Un canal prend en charge les sessions persistantes de sous-agents associées à un fil
(`sessions_spawn` avec `thread: true`) lorsqu’il enregistre un adaptateur d’association
de conversation. Canaux intégrés offrant cette prise en charge : **Discord**,
**iMessage**, **Matrix** et **Telegram**. Discord et Matrix créent par défaut un fil
enfant ; Telegram et iMessage associent par défaut la conversation actuelle. Utilisez
les clés de configuration `threadBindings` propres à chaque canal pour l’activation,
les délais d’expiration et `spawnSessions`.

### Déroulement rapide

<Steps>
  <Step title="Lancer">
    `sessions_spawn` avec `thread: true` (et éventuellement `mode: "session"`).
  </Step>
  <Step title="Associer">
    OpenClaw crée ou associe un fil à cette cible de session dans le canal actif.
  </Step>
  <Step title="Acheminer les suivis">
    Les réponses et les messages de suivi dans ce fil sont acheminés vers la session associée.
  </Step>
  <Step title="Inspecter les délais d’expiration">
    Utilisez `/session idle` pour inspecter/mettre à jour la désactivation automatique
    après inactivité et `/session max-age` pour contrôler la limite stricte.
  </Step>
  <Step title="Dissocier">
    Utilisez `/unfocus` pour effectuer une dissociation manuelle.
  </Step>
</Steps>

### Commandes manuelles

| Commande           | Effet                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `/focus <target>`  | Associe le fil actuel (ou en crée un) à une cible de sous-agent/session                                   |
| `/unfocus`         | Supprime l’association du fil actuellement associé                                                        |
| `/agents`          | Répertorie les exécutions actives et l’état d’association (`binding:<id>`, `unbound` ou `bindings unavailable`) |
| `/session idle`    | Inspecte/met à jour la désactivation automatique après inactivité (fils associés actifs uniquement)       |
| `/session max-age` | Inspecte/met à jour la limite stricte (fils associés actifs uniquement)                                   |

### Options de configuration

- **Valeurs globales par défaut :** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Les clés de remplacement par canal et d’association automatique au lancement** sont propres à l’adaptateur. Consultez [Canaux prenant en charge les fils](#thread-supporting-channels) ci-dessus.

Consultez la [Référence de configuration](/fr/gateway/configuration-reference) et
les [Commandes à barre oblique](/fr/tools/slash-commands) pour connaître les détails actuels des adaptateurs.

### Liste d’autorisation

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Liste des identifiants d’agents configurés pouvant être ciblés au moyen d’un `agentId` explicite (`["*"]` autorise toute cible configurée). Valeur par défaut : uniquement l’agent demandeur. Si vous définissez une liste et souhaitez toujours que le demandeur puisse se lancer lui-même avec `agentId`, incluez l’identifiant du demandeur dans la liste.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Liste d’autorisation par défaut des agents cibles configurés, utilisée lorsque l’agent demandeur ne définit pas son propre `subagents.allowAgents`.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Bloque les appels à `sessions_spawn` qui omettent `agentId` (impose une sélection explicite du profil). Remplacement par agent : `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Délai d’expiration par appel pour les tentatives de remise de l’annonce `agent` du Gateway. Les valeurs sont des nombres entiers positifs de millisecondes et sont limitées au maximum sûr de la minuterie de la plateforme. Les nouvelles tentatives transitoires peuvent rendre l’attente totale de l’annonce supérieure à un délai configuré.
</ParamField>

Si la session du demandeur est isolée, `sessions_spawn` refuse les cibles
qui s’exécuteraient sans isolation.

### Découverte

Utilisez `agents_list` pour voir quels identifiants d’agents sont actuellement autorisés pour
`sessions_spawn`. La réponse inclut le modèle effectif de chaque agent répertorié ainsi que
les métadonnées intégrées de son environnement d’exécution, afin que les appelants puissent
distinguer OpenClaw, le serveur d’application Codex et les autres environnements natifs configurés.

Les entrées `allowAgents` doivent désigner des identifiants d’agents configurés dans `agents.list[]`.
`["*"]` désigne tout agent cible configuré ainsi que le demandeur. Si la configuration d’un agent
est supprimée mais que son identifiant reste dans `allowAgents`, `sessions_spawn` refuse cet
identifiant et `agents_list` l’omet. Exécutez `openclaw doctor --fix` pour nettoyer les entrées
obsolètes de la liste d’autorisation, ou ajoutez une entrée `agents.list[]` minimale lorsque la cible
doit rester disponible au lancement tout en héritant des valeurs par défaut.

### Archivage automatique

- Les sessions de sous-agents sont automatiquement archivées après `agents.defaults.subagents.archiveAfterMinutes` (valeur par défaut : `60`).
- L’archivage utilise `sessions.delete` et renomme la transcription en `*.deleted.<timestamp>` (dans le même dossier).
- `cleanup: "delete"` archive immédiatement après l’annonce (la transcription reste conservée par renommage).
- L’archivage automatique s’effectue au mieux ; les minuteries en attente sont perdues si le Gateway redémarre.
- Les délais d’expiration d’exécution configurés n’archivent **pas** automatiquement ; ils arrêtent uniquement l’exécution. La session reste présente jusqu’à son archivage automatique.
- L’archivage automatique s’applique de la même manière aux sessions de profondeur 1 et 2.
- Le nettoyage du navigateur est distinct du nettoyage d’archivage : la fermeture des onglets/processus de navigateur suivis est tentée au mieux à la fin de l’exécution, même si la transcription ou l’enregistrement de session est conservé.

## Sous-agents imbriqués

Par défaut, les sous-agents ne peuvent pas lancer leurs propres sous-agents
(`maxSpawnDepth: 1`). Définissez `maxSpawnDepth: 2` pour activer un niveau
d’imbrication — le **modèle d’orchestrateur** : principal → sous-agent orchestrateur →
sous-sous-agents exécutants.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // autorise les sous-agents à lancer des enfants (par défaut : 1, plage 1-5)
        maxChildrenPerAgent: 5, // nombre maximal d’enfants actifs par session d’agent (par défaut : 5, plage 1-20)
        maxConcurrent: 8, // limite globale de la file de concurrence (par défaut : 8)
        runTimeoutSeconds: 900, // délai d’expiration par défaut de sessions_spawn (0 = aucun délai)
        announceTimeoutMs: 120000, // délai d’expiration par appel pour l’annonce du Gateway
      },
    },
  },
}
```

### Niveaux de profondeur

| Profondeur | Forme de la clé de session                  | Rôle                                                   | Peut créer des agents ?          |
| ---------- | ------------------------------------------- | ------------------------------------------------------ | -------------------------------- |
| 0          | `agent:<id>:main`                           | Agent principal                                        | Toujours                         |
| 1          | `agent:<id>:subagent:<uuid>`                | Sous-agent (orchestrateur si la profondeur 2 est autorisée) | Uniquement si `maxSpawnDepth >= 2` |
| 2          | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sous-sous-agent (agent d’exécution terminal)            | Jamais                           |

### Chaîne d’annonce

Les résultats remontent la chaîne :

1. L’agent d’exécution de profondeur 2 termine → envoie une annonce à son parent (orchestrateur de profondeur 1).
2. L’orchestrateur de profondeur 1 reçoit l’annonce, synthétise les résultats, termine → envoie une annonce à l’agent principal.
3. L’agent principal reçoit l’annonce et transmet le résultat à l’utilisateur.

Chaque niveau ne voit que les annonces de ses enfants directs.

<Note>
**Conseil opérationnel :** démarrez une seule fois le travail des enfants et attendez les événements d’achèvement plutôt que de créer des boucles d’interrogation autour de `sessions_list`, `sessions_history`, `/subagents list` ou de commandes de mise en veille `exec`.
`sessions_list` et `/subagents list` maintiennent les relations entre sessions enfants centrées sur le travail en cours : les enfants actifs restent attachés, les enfants terminés demeurent visibles pendant une courte période récente et les liens d’enfants obsolètes présents uniquement dans le stockage sont ignorés après expiration de leur fenêtre de fraîcheur. Cela empêche d’anciennes métadonnées `spawnedBy` / `parentSessionKey` de ressusciter des enfants fantômes après un redémarrage. Si un événement d’achèvement d’un enfant arrive après que vous avez déjà envoyé la réponse finale, le suivi correct est le jeton silencieux exact `NO_REPLY` / `no_reply`.
</Note>

### Politique des outils selon la profondeur

- Le rôle et la portée de contrôle sont inscrits dans les métadonnées de session lors de la création. Cela empêche des clés de session aplaties ou restaurées de récupérer accidentellement des privilèges d’orchestrateur.
- **Profondeur 1 (orchestrateur, lorsque `maxSpawnDepth >= 2`) :** reçoit `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` afin de pouvoir créer des enfants et examiner leur état. Les autres outils de session ou système restent refusés.
- **Profondeur 1 (agent terminal, lorsque `maxSpawnDepth == 1`) :** aucun outil de session (comportement actuel par défaut).
- **Profondeur 2 (agent d’exécution terminal) :** aucun outil de session — `sessions_spawn` est toujours refusé à la profondeur 2. Il ne peut pas créer d’autres enfants.

### Limite de création par agent

Chaque session d’agent (quelle que soit sa profondeur) peut avoir au maximum `maxChildrenPerAgent`
(par défaut `5`) enfants actifs simultanément. Cela empêche une expansion incontrôlée
depuis un même orchestrateur.

### Arrêt en cascade

L’arrêt d’un orchestrateur de profondeur 1 arrête automatiquement tous ses enfants
de profondeur 2 :

- `/stop` dans la discussion principale arrête tous les agents de profondeur 1 et se propage à leurs enfants de profondeur 2.

## Authentification

L’authentification des sous-agents est déterminée par **l’identifiant de l’agent**, et non par le type de session :

- La clé de session du sous-agent est `agent:<agentId>:subagent:<uuid>`.
- Le magasin d’authentification est chargé depuis l’`agentDir` de cet agent.
- Les profils d’authentification de l’agent principal sont fusionnés en tant que **solution de repli** ; les profils de l’agent prévalent sur ceux de l’agent principal en cas de conflit.

La fusion est additive : les profils principaux restent donc toujours disponibles comme
solutions de repli. L’isolation complète de l’authentification par agent n’est pas encore prise en charge.

## Annonce

Les sous-agents rendent compte par une étape d’annonce :

- L’étape d’annonce s’exécute dans la session du sous-agent (et non dans celle du demandeur).
- Si le sous-agent répond exactement `ANNOUNCE_SKIP`, rien n’est publié.
- Si le texte le plus récent de l’assistant est le jeton silencieux exact `NO_REPLY` / `no_reply`, la sortie de l’annonce est supprimée, même si une progression visible existait auparavant.

La livraison dépend de la profondeur du demandeur :

- Les sessions de demandeur de premier niveau utilisent un appel `agent` de suivi avec livraison externe (`deliver=true`).
- Les sessions de sous-agent demandeur imbriquées reçoivent une injection interne de suivi (`deliver=false`) afin que l’orchestrateur puisse synthétiser les résultats des enfants au sein de la session.
- Si une session de sous-agent demandeur imbriquée n’existe plus, OpenClaw se replie sur le demandeur de cette session lorsqu’il est disponible.

Pour les sessions de demandeur de premier niveau, la livraison directe en mode achèvement commence par
résoudre toute route de conversation ou de fil liée ainsi que toute substitution par un hook, puis complète
les champs de canal et de cible manquants à partir de la route enregistrée dans la session du demandeur.
Ainsi, les achèvements restent associés à la bonne discussion ou au bon sujet, même lorsque l’origine de l’achèvement
n’identifie que le canal.

Lors de la construction des résultats d’achèvement imbriqués, l’agrégation des achèvements des enfants est limitée à l’exécution actuelle du demandeur, ce qui empêche les sorties d’enfants d’exécutions antérieures de se retrouver dans l’annonce actuelle. Les réponses d’annonce préservent le routage du fil ou du sujet lorsqu’il est disponible dans les adaptateurs de canal.

### Contexte de l’annonce

Le contexte de l’annonce est normalisé sous la forme d’un bloc d’événement interne stable :

| Champ               | Source                                                                                                                  |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Source              | `subagent` ou `cron`                                                                                                    |
| Identifiants de session | Clé/identifiant de la session enfant                                                                                |
| Type                | Type d’annonce + libellé de la tâche                                                                                    |
| État                | Dérivé du résultat d’exécution (`ok`, `error`, `timeout` ou `unknown`) — **non** déduit du texte du modèle             |
| Contenu du résultat | Dernier texte visible de l’assistant provenant de l’enfant                                                              |
| Suivi               | Instruction indiquant quand répondre ou garder le silence                                                               |

Les exécutions terminales ayant échoué signalent l’état d’échec sans reproduire le
texte de réponse capturé. La sortie `tool`/`toolResult` n’est pas promue en texte de résultat de l’enfant.

### Ligne de statistiques

Les charges utiles d’annonce comprennent une ligne de statistiques à la fin (même lorsqu’elles sont enveloppées) :

- Durée d’exécution (par exemple `runtime 5m12s`).
- Utilisation des jetons (entrée/sortie/total).
- Coût estimé lorsque la tarification des modèles est configurée (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` et chemin de la transcription afin que l’agent principal puisse récupérer l’historique via `sessions_history` ou examiner le fichier sur le disque.

Les métadonnées internes sont réservées à l’orchestration ; les réponses destinées aux utilisateurs
doivent être reformulées dans le ton habituel de l’assistant.

### Pourquoi préférer `sessions_history`

`sessions_history` constitue la voie d’orchestration la plus sûre pour lire la transcription d’un enfant
pendant un tour d’agent :

- Masque les textes ressemblant à des identifiants ou des jetons, même lorsque le masquage général des journaux est désactivé.
- Tronque les longs blocs de texte (4 000 caractères par bloc) et supprime les signatures de réflexion, les charges utiles de répétition du raisonnement et les données d’image intégrées.
- Impose une limite de réponse de 80 Ko ; les lignes trop volumineuses sont remplacées par `[sessions_history omitted: message too large]`.
- Utilisez `nextOffset` lorsqu’il est présent pour parcourir à rebours les fenêtres plus anciennes de la transcription.
- `sessions_history` ne supprime **pas** les balises de raisonnement, la structure `<relevant-memories>` ni le XML des appels d’outils du texte des messages — il renvoie des blocs de contenu structurés proches de la forme brute de la transcription, mais masqués et limités en taille. `/subagents log` applique un assainissement textuel plus poussé (suppression des balises de raisonnement, de la structure de mémoire et du XML des appels d’outils), car il affiche des lignes de discussion en texte simple plutôt que des blocs structurés.
- L’examen de la transcription brute sur le disque est la solution de repli lorsque vous avez besoin de la transcription complète, octet pour octet.

## Politique des outils

Les sous-agents utilisent d’abord le même profil et la même chaîne de politique des outils que l’agent parent ou
cible. OpenClaw applique ensuite la couche de restrictions propre aux sous-agents.

Les sous-agents perdent toujours `gateway`, `agents_list`, `session_status` et
`cron`, indépendamment de leur profondeur ou de leur rôle (outils système/interactifs, ou
outils que l’agent principal doit coordonner). Les sous-agents terminaux (comportement par défaut à la profondeur 1,
et toujours à la profondeur 2) perdent également `subagents`,
`sessions_list`, `sessions_history` et `sessions_spawn`. Les sous-agents ne
reçoivent jamais l’outil `message` — il est désactivé lors de la création, et non filtré par
cette liste de refus — et `sessions_send` reste refusé afin que les sous-agents
communiquent uniquement par la chaîne d’annonce.

`sessions_history` reste ici aussi une vue de rappel limitée et assainie — il
ne s’agit pas d’un export brut de la transcription.

Lorsque `maxSpawnDepth >= 2`, les sous-agents orchestrateurs de profondeur 1
reçoivent en plus `sessions_spawn`, `subagents`, `sessions_list` et
`sessions_history` afin de pouvoir gérer leurs enfants.

### Substitution par la configuration

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

`tools.subagents.tools.allow` est un filtre final limité aux éléments autorisés. Il peut restreindre
l’ensemble d’outils déjà déterminé, mais il ne peut pas **rajouter** un outil supprimé
par `tools.profile`. Par exemple, `tools.profile: "coding"` inclut
`web_search`/`web_fetch`, mais pas l’outil `browser`. Pour permettre aux
sous-agents du profil de codage d’utiliser l’automatisation du navigateur, ajoutez le navigateur à l’étape
du profil :

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Utilisez `agents.list[].tools.alsoAllow: ["browser"]` par agent lorsqu’un seul
agent doit disposer de l’automatisation du navigateur.

## Concurrence

Les sous-agents utilisent une file d’attente dédiée au sein du processus :

- **Nom de la file :** `subagent`
- **Concurrence :** `agents.defaults.subagents.maxConcurrent` (par défaut `8`)

## Activité et récupération

OpenClaw ne considère pas l’absence de `endedAt` comme une preuve permanente qu’un
sous-agent est toujours actif. Les exécutions non terminées plus anciennes que la fenêtre d’obsolescence
(2 heures, ou le délai d’expiration configuré de l’exécution augmenté d’une courte période de grâce,
selon la durée la plus longue) cessent d’être comptabilisées comme actives ou en attente dans `/subagents list`,
les résumés d’état, le blocage de l’achèvement des descendants et les vérifications de
concurrence par session.

Après un redémarrage du Gateway, les exécutions restaurées obsolètes et non terminées sont élaguées, sauf si
leur session enfant porte la marque `abortedLastRun: true`. Les exécutions interrompues
par le redémarrage restent enregistrées pour le processus de récupération des sous-agents orphelins : les exécutions
obsolètes sont finalisées sans reprise, tandis que les sessions enfants récentes reçoivent
un message de reprise synthétique avant que le marqueur d’interruption soit effacé.

La récupération automatique après redémarrage est limitée par session enfant. Si le même
enfant sous-agent est accepté à plusieurs reprises pour une récupération d’orphelin pendant la
fenêtre de blocages répétés rapides, OpenClaw enregistre un marqueur définitif de récupération dans cette
session et cesse de la reprendre automatiquement lors des redémarrages ultérieurs. Exécutez
`openclaw tasks maintenance --apply` pour réconcilier l’enregistrement de tâche, ou
`openclaw doctor --fix` pour effacer les indicateurs obsolètes de récupération interrompue dans
les sessions ainsi marquées.

<Note>
Si la création d’un sous-agent échoue avec l’erreur Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, vérifiez l’appelant RPC avant de modifier l’état d’appairage.
La coordination interne de `sessions_spawn` s’effectue au sein du processus lorsque
l’appelant s’exécute déjà dans le contexte de la requête du Gateway ; elle n’ouvre donc
pas de WebSocket local loopback et ne dépend pas de la portée de référence des appareils appairés de la CLI.
Les appelants extérieurs au processus du Gateway utilisent toujours la solution de repli WebSocket
avec `client.id: "gateway-client"` et `client.mode: "backend"`
par authentification directe local loopback au moyen d’un jeton partagé ou d’un mot de passe. Les appelants distants, les valeurs
`deviceIdentity` explicites, les chemins explicites de jeton d’appareil et les clients navigateur/Node
nécessitent toujours l’approbation normale de l’appareil pour les élévations de portée.
</Note>

## Arrêt

- L’envoi de `/stop` dans la discussion du demandeur interrompt la session du demandeur et arrête toutes les exécutions actives de sous-agents créées depuis celle-ci, avec propagation aux enfants imbriqués.

## Limitations

- L’annonce du sous-agent s’effectue **dans la mesure du possible**. Si le Gateway redémarre, les tâches « announce back » en attente sont perdues.
- Les sous-agents partagent toujours les ressources du même processus Gateway ; considérez `maxConcurrent` comme une soupape de sécurité.
- `sessions_spawn` est toujours non bloquant : il renvoie immédiatement `{ status: "accepted", runId, childSessionKey }`.
- Le contexte du sous-agent injecte uniquement `AGENTS.md` et `TOOLS.md` (sans `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md` ni `BOOTSTRAP.md`). Les sous-agents natifs de Codex respectent la même limite : `TOOLS.md` reste dans les instructions héritées du fil Codex, tandis que les fichiers de personnalité, d’identité et d’utilisateur propres au parent sont injectés sous forme d’instructions de collaboration limitées au tour, afin que les enfants ne les clonent pas.
- La profondeur maximale d’imbrication est de 5 (plage de `maxSpawnDepth` : 1 à 5). Une profondeur de 2 est recommandée pour la plupart des cas d’utilisation.
- `maxChildrenPerAgent` limite le nombre d’enfants actifs par session (valeur par défaut : `5`, plage : `1` à `20`).

## Voir aussi

- [Outils de session et changements d’état](/fr/concepts/session-tool)
- [Agents ACP](/fr/tools/acp-agents)
- [Envoi d’agent](/fr/tools/agent-send)
- [Tâches en arrière-plan](/fr/automation/tasks)
- [Outils de bac à sable multi-agents](/fr/tools/multi-agent-sandbox-tools)
