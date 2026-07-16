---
read_when:
    - Vous souhaitez effectuer un travail en arrière-plan ou en parallèle via l’agent
    - Vous modifiez la politique de l’outil `sessions_spawn` ou des sous-agents
    - Vous mettez en œuvre ou dépannez des sessions de sous-agents liées à des fils de discussion
sidebarTitle: Sub-agents
summary: Lancer des exécutions d’agents isolées en arrière-plan qui annoncent les résultats dans le chat du demandeur
title: Sous-agents
x-i18n:
    generated_at: "2026-07-16T13:52:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8c670d5c7f92d5be8ebce7b1140d9bfd7956b10f38144d275ec84c6af98ae04b
    source_path: tools/subagents.md
    workflow: 16
---

Les sous-agents sont des exécutions d'agent en arrière-plan lancées depuis une exécution d'agent existante.
Chacun s'exécute dans sa propre session (`agent:<agentId>:subagent:<uuid>`) et,
une fois terminé, **annonce** son résultat dans le canal de discussion du demandeur.
Chaque exécution de sous-agent est suivie comme une [tâche en arrière-plan](/fr/automation/tasks).

Objectifs :

- Paralléliser les recherches, les tâches longues et les opérations lentes des outils sans bloquer l'exécution principale.
- Maintenir les sous-agents isolés par défaut (séparation des sessions, bac à sable facultatif).
- Rendre l'ensemble des outils difficile à utiliser incorrectement : par défaut, les sous-agents n'ont **pas** accès aux outils de session ou de messagerie.
- Prendre en charge une profondeur d'imbrication configurable pour les modèles d'orchestration.

<Note>
**Remarque sur le coût :** par défaut, chaque sous-agent possède son propre contexte et sa propre consommation de jetons.
Pour les tâches lourdes ou répétitives, définissez un modèle moins coûteux pour les sous-agents
et conservez un modèle de meilleure qualité pour votre agent principal au moyen de
`agents.defaults.subagents.model` ou de remplacements propres à chaque agent. Lorsqu'un enfant
a réellement besoin de la transcription actuelle du demandeur, lancez-le avec
`context: "fork"`. Par défaut, les sessions de sous-agent liées à un fil utilisent
`context: "fork"`, car elles dérivent la conversation actuelle dans un
fil de suivi.
</Note>

## Commande oblique

`/subagents` inspecte les exécutions de sous-agents de la **session actuelle** :

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` affiche les métadonnées de l'exécution (état, horodatages, identifiant de session,
chemin de la transcription, nettoyage). `/subagents log` affiche les échanges de discussion récents d'une
exécution ; ajoutez le jeton `tools` pour inclure les messages d'appel et de résultat des outils (omis
par défaut). Utilisez `sessions_history` pour obtenir une vue de rappel limitée et filtrée par sécurité
depuis une exécution d'agent, ou consultez le chemin de la transcription sur le disque pour
la transcription brute complète.

Dans l'interface de contrôle, les sessions parentes comportant des exécutions enfants récentes disposent d'une ligne
dépliable dans la barre latérale. Les lignes imbriquées affichent l'état et la durée d'exécution des enfants ; en sélectionner une
ouvre la discussion de cet enfant tout en préservant la hiérarchie parente.

### Contrôles de liaison aux fils

Ces commandes fonctionnent sur les canaux dotés de liaisons persistantes aux fils. Consultez
[Canaux prenant en charge les fils](#thread-supporting-channels) ci-dessous.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Comportement du lancement

Les agents lancent des sous-agents en arrière-plan avec l'outil `sessions_spawn`.
Les résultats sont renvoyés sous forme d'événements internes de la session parente ; l'agent
parent/demandeur décide si une mise à jour destinée à l'utilisateur est nécessaire.

<AccordionGroup>
  <Accordion title="Achèvement non bloquant fondé sur l'envoi">
    - `sessions_spawn` est non bloquant ; il renvoie immédiatement un identifiant d'exécution.
    - Une fois terminé, le sous-agent transmet son compte rendu à la session parente/demandeuse.
    - Les exécutions d'agent qui ont besoin des résultats des enfants doivent appeler `sessions_yield` après avoir lancé le travail requis. Cela met fin à l'exécution actuelle et permet à l'événement d'achèvement d'arriver comme prochain message visible par le modèle.
    - L'achèvement repose sur l'envoi. Après le lancement, n'interrogez **pas** `/subagents list`, `sessions_list` ou `sessions_history` en boucle uniquement pour attendre la fin de l'exécution ; vérifiez l'état à la demande, seulement lors du débogage.
    - La sortie de l'enfant constitue un rapport ou des éléments probants que l'agent demandeur doit synthétiser. Il ne s'agit pas d'instructions rédigées par l'utilisateur et elle ne peut pas remplacer les règles système, développeur ou utilisateur.
    - À l'achèvement, OpenClaw tente de fermer les onglets et processus de navigateur suivis qui ont été ouverts par cette session de sous-agent avant de poursuivre le processus de nettoyage de l'annonce.

  </Accordion>
  <Accordion title="Remise de l'achèvement">
    - OpenClaw retransmet les achèvements à la session demandeuse par l'intermédiaire d'une exécution `agent` dotée d'une clé d'idempotence stable.
    - Si l'exécution demandeuse est toujours active, OpenClaw tente d'abord de réveiller ou d'orienter cette exécution au lieu de démarrer un second chemin de réponse visible.
    - Si une session demandeuse active ne peut pas être réveillée, OpenClaw se rabat sur un transfert à l'agent demandeur avec le même contexte d'achèvement au lieu d'abandonner l'annonce.
    - Un transfert réussi au parent achève la remise du sous-agent, même lorsque le parent décide qu'aucune mise à jour visible par l'utilisateur n'est nécessaire.
    - Les sous-agents natifs n'ont pas accès à l'outil de messagerie. Ils renvoient du texte brut d'assistant à l'agent parent/demandeur ; les réponses visibles par les humains restent régies par la politique de remise normale de l'agent parent/demandeur.
    - Si le transfert direct ne peut pas être utilisé, la remise se rabat sur le routage par file d'attente, puis sur une brève nouvelle tentative de l'annonce avec temporisation exponentielle avant l'abandon définitif.
    - La remise conserve la route résolue du demandeur : les routes d'achèvement liées à un fil ou à une conversation sont prioritaires lorsqu'elles sont disponibles. Si l'origine de l'achèvement ne fournit qu'un canal, OpenClaw complète la cible ou le compte manquant à partir de la route résolue de la session demandeuse (`lastChannel` / `lastTo` / `lastAccountId`) afin que la remise directe continue de fonctionner.

  </Accordion>
  <Accordion title="Métadonnées du transfert d'achèvement">
    Le transfert d'achèvement vers la session demandeuse est un contexte interne
    généré à l'exécution (et non du texte rédigé par l'utilisateur) qui comprend :

    - `Result` — le dernier texte de réponse `assistant` visible provenant de l'enfant. Les sorties tool/toolResult ne sont pas promues en résultats de l'enfant. Les exécutions ayant échoué à l'état terminal ne réutilisent pas le texte de réponse capturé.
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`.
    - Statistiques compactes sur l'exécution et les jetons.
    - Une instruction de révision demandant à l'agent demandeur de vérifier le résultat avant de décider si la tâche initiale est terminée.
    - Des instructions de suivi demandant à l'agent demandeur de poursuivre la tâche ou d'enregistrer une action de suivi lorsque le résultat de l'enfant nécessite des actions supplémentaires.
    - Une instruction de mise à jour finale pour le cas où aucune autre action n'est requise, rédigée dans le style normal de l'assistant sans transmettre les métadonnées internes brutes.

  </Accordion>
  <Accordion title="Modes et environnement d'exécution ACP">
    - `--model` et `--thinking` remplacent les valeurs par défaut pour cette exécution spécifique.
    - Utilisez `info`/`log` pour consulter les détails et la sortie après l'achèvement.
    - Pour les sessions persistantes liées à un fil, utilisez `sessions_spawn` avec `thread: true` et `mode: "session"`.
    - Si le canal demandeur ne prend pas en charge les liaisons aux fils, utilisez `mode: "run"` au lieu de réessayer une combinaison liée à un fil impossible.
    - Pour les sessions de banc d'essai ACP (Claude Code, Gemini CLI, OpenCode ou Codex ACP/acpx explicite), utilisez `sessions_spawn` avec `runtime: "acp"` lorsque l'outil annonce cet environnement d'exécution. Consultez le [modèle de remise ACP](/fr/tools/acp-agents#delivery-model) lors du débogage des achèvements ou des boucles entre agents. Lorsque le Plugin `codex` est activé, le contrôle des discussions et des fils Codex doit privilégier `/codex ...` plutôt qu'ACP, sauf si l'utilisateur demande explicitement ACP/acpx.
    - OpenClaw masque `runtime: "acp"` tant qu'ACP n'est pas activé, que le demandeur est dans un bac à sable ou qu'un Plugin de moteur tel que `acpx` n'est pas chargé. `runtime: "acp"` attend un identifiant de banc d'essai ACP externe, ou une entrée `agents.list[]` contenant `runtime.type="acp"` ; utilisez l'environnement d'exécution de sous-agent par défaut pour les agents de configuration OpenClaw normaux provenant de `agents_list`.

  </Accordion>
</AccordionGroup>

## Modes de contexte

Les sous-agents natifs démarrent de manière isolée, sauf si l'appelant demande explicitement de dériver
la transcription actuelle.

| Mode       | Quand l'utiliser                                                                                                                         | Comportement                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Nouvelles recherches, implémentation indépendante, opérations lentes des outils ou tout travail pouvant être décrit brièvement dans le texte de la tâche                           | Crée une transcription enfant vierge. Il s'agit du comportement par défaut, qui réduit la consommation de jetons.  |
| `fork`     | Travail dépendant de la conversation actuelle, des résultats antérieurs des outils ou d'instructions nuancées déjà présentes dans la transcription du demandeur | Dérive la transcription du demandeur dans la session enfant avant le démarrage de l'enfant. |

Utilisez `fork` avec parcimonie. Il est destiné à la délégation sensible au contexte, et non à
remplacer la rédaction d'une consigne de tâche claire.

## Outil : `sessions_spawn`

Démarre une exécution de sous-agent avec `deliver: false` sur la voie globale `subagent`,
puis exécute une étape d'annonce et publie la réponse d'annonce dans le
canal de discussion du demandeur.

La disponibilité dépend de la politique d'outils effective de l'appelant. Le profil intégré
`coding` inclut `sessions_spawn` ; `messaging` et `minimal` ne
l'incluent pas. `full` autorise tous les outils. Ajoutez `tools.alsoAllow: ["sessions_spawn",
"sessions_yield", "subagents"]`, ou utilisez `tools.profile: "coding"`, pour
les agents dotés d'un profil plus restreint qui doivent néanmoins déléguer du travail.
Les politiques d'autorisation ou de refus par canal/groupe, fournisseur, bac à sable et agent peuvent
encore supprimer l'outil après l'étape du profil. Utilisez `/tools` depuis la même
session pour confirmer la liste effective des outils.

**Valeurs par défaut :**

- **Modèle :** les sous-agents natifs héritent de l'appelant, sauf si vous définissez `agents.defaults.subagents.model` (ou `agents.list[].subagents.model` propre à l'agent). Les lancements dans l'environnement d'exécution ACP utilisent le même modèle de sous-agent configuré lorsqu'il est présent ; sinon, le banc d'essai ACP conserve sa propre valeur par défaut. Une valeur `sessions_spawn.model` explicite reste prioritaire.
- **Réflexion :** les sous-agents natifs héritent de l'appelant, sauf si vous définissez `agents.defaults.subagents.thinking` (ou `agents.list[].subagents.thinking` propre à l'agent). Les lancements dans l'environnement d'exécution ACP appliquent également `agents.defaults.models["provider/model"].params.thinking` au modèle sélectionné. Une valeur `sessions_spawn.thinking` explicite reste prioritaire.
- **Délai d'expiration de l'exécution :** OpenClaw utilise `agents.defaults.subagents.runTimeoutSeconds` lorsqu'il est défini ; sinon, il se rabat sur `0` (aucun délai d'expiration). `sessions_spawn` n'accepte pas de remplacement du délai d'expiration par appel.
- **Remise de la tâche :** les sous-agents natifs reçoivent la tâche déléguée dans leur premier message `[Subagent Task]` visible. L'invite système du sous-agent contient les règles d'exécution et le contexte de routage, et non une copie masquée de la tâche.

Les lancements de sous-agents natifs acceptés incluent les métadonnées résolues du modèle enfant
dans le résultat de l'outil : `resolvedModel` contient la référence du modèle appliqué et
`resolvedProvider` contient le préfixe du fournisseur lorsque la référence en possède un.

### Mode d'invite de délégation

`agents.defaults.subagents.delegationMode` contrôle uniquement les indications de l'invite ; il ne modifie pas la politique d'outils et n'impose pas la délégation.

- `suggest` (par défaut) : conserve l'incitation standard de l'invite à utiliser des sous-agents pour les travaux plus importants ou plus lents.
- `prefer` : demande à l'agent principal de rester réactif et de déléguer, par l'intermédiaire de `sessions_spawn`, tout travail plus complexe qu'une réponse directe.

Remplacement propre à l'agent : `agents.list[].subagents.delegationMode`.

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

### Paramètres de l'outil

<ParamField path="task" type="string" required>
  Description de la tâche pour le sous-agent.
</ParamField>
<ParamField path="taskName" type="string">
  Identifiant stable facultatif permettant d’identifier un enfant précis dans une sortie d’état ultérieure. Il doit correspondre à `[a-z][a-z0-9_-]{0,63}` et ne peut pas être une cible réservée telle que `last` ou `all`.
</ParamField>
<ParamField path="label" type="string">
  Libellé facultatif lisible par un humain.
</ParamField>
<ParamField path="agentId" type="string">
  Lance sous un autre identifiant d’agent configuré lorsque `subagents.allowAgents` l’autorise.
</ParamField>
<ParamField path="cwd" type="string">
  Répertoire de travail facultatif de la tâche pour l’exécution enfant. Les sous-agents natifs chargent toujours les fichiers d’amorçage depuis l’espace de travail de l’agent cible ; `cwd` modifie uniquement l’emplacement où les outils d’exécution et les environnements CLI effectuent le travail délégué.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` est réservé aux environnements ACP externes (`claude`, `droid`, `gemini`, `opencode`, ou Codex ACP/acpx explicitement demandé) et aux entrées `agents.list[]` dont `runtime.type` vaut `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  ACP uniquement. Reprend une session d’environnement ACP existante lorsque `runtime: "acp"` ; ignoré pour les lancements de sous-agents natifs.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  ACP uniquement. Diffuse la sortie d’exécution ACP vers la session parente lorsque `runtime: "acp"` ; à omettre pour les lancements de sous-agents natifs.
</ParamField>
<ParamField path="model" type="string">
  Remplace le modèle du sous-agent. Les valeurs non valides sont ignorées et le sous-agent s’exécute avec le modèle par défaut, avec un avertissement dans le résultat de l’outil.
</ParamField>
<ParamField path="thinking" type="string">
  Remplace le niveau de raisonnement pour l’exécution du sous-agent.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Lorsque `true`, demande la liaison à un fil de discussion du canal pour cette session de sous-agent.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Si `thread: true` et que `mode` est omis, la valeur par défaut devient `session`. `mode: "session"` nécessite `thread: true`.
  Si la liaison à un fil n’est pas disponible pour le canal demandeur, utilisez plutôt `mode: "run"`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archive la session immédiatement après l’annonce (la transcription est néanmoins conservée par renommage).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` refuse le lancement sauf si l’environnement d’exécution enfant cible est isolé.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` crée une branche de la transcription actuelle du demandeur dans la session enfant. Sous-agents natifs uniquement. Les lancements liés à un fil utilisent par défaut `fork` ; ceux qui ne sont pas liés à un fil utilisent par défaut `isolated`.
</ParamField>

<Warning>
`sessions_spawn` n’accepte **pas** les paramètres de remise au canal (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Les sous-agents natifs renvoient
leur dernier tour d’assistant au demandeur ; la remise externe reste du ressort de
l’agent parent/demandeur.
</Warning>

### Noms des tâches et ciblage

`taskName` est un identifiant destiné au modèle pour l’orchestration, et non une clé de session.
Utilisez-le pour attribuer des noms stables aux enfants, tels que `review_subagents`,
`linux_validation` ou `docs_update`, lorsqu’un coordinateur peut avoir besoin d’examiner
cet enfant ultérieurement.

La résolution des cibles accepte les correspondances exactes de `taskName` et les préfixes
non ambigus. La correspondance est limitée à la même fenêtre de cibles actives/récentes que celle utilisée
par les cibles `/subagents` numérotées ; ainsi, un ancien enfant terminé ne rend pas
ambigu un identifiant réutilisé. Si deux enfants actifs ou récents partagent le même
`taskName`, la cible est ambiguë ; utilisez plutôt l’index de la liste, la clé de session ou
l’identifiant d’exécution.

Les cibles réservées `last` et `all` ne sont pas des valeurs `taskName` valides,
car elles ont déjà une signification de contrôle.

## Outil : `sessions_yield`

Met fin au tour actuel du modèle et attend que les événements d’exécution, principalement
les événements de fin des sous-agents, arrivent dans le message suivant. Utilisez-le après
avoir lancé le travail enfant requis lorsque le demandeur ne peut pas produire de réponse
finale avant la réception de ces fins d’exécution.

`sessions_yield` est la primitive d’attente. Ne la remplacez pas par des boucles
d’interrogation sur `subagents`, `sessions_list`, `sessions_history`, par une interrogation des processus
ou par `sleep` dans le shell uniquement pour détecter la fin d’un enfant.

Utilisez `sessions_yield` uniquement lorsque la liste effective des outils de la session
l’inclut. Certains profils d’outils minimaux ou personnalisés peuvent exposer `sessions_spawn` et
`subagents` sans exposer `sessions_yield` ; dans ce cas, n’inventez pas
de boucle d’interrogation uniquement pour attendre la fin.

Lorsque des enfants actifs existent, OpenClaw injecte un bloc d’invite compact généré
par l’environnement d’exécution, `Active Subagents`, dans les tours normaux afin que le demandeur puisse voir
les sessions enfants actuelles, les identifiants d’exécution, les états, les libellés, les tâches et
les alias `taskName` sans interrogation. Les champs de tâche et de libellé de ce
bloc sont cités comme des données, et non comme des instructions, car ils peuvent provenir
d’arguments de lancement fournis par l’utilisateur ou le modèle.

## Outil : `subagents`

Répertorie les exécutions de sous-agents lancées et détenues par la session du demandeur. Sa portée est
limitée au demandeur actuel ; un enfant ne peut voir que les enfants qu’il contrôle lui-même.

Utilisez `subagents` pour obtenir l’état à la demande et pour le débogage. Utilisez `sessions_yield` pour
attendre les événements de fin.

## Sessions liées à un fil

Lorsque les liaisons à des fils sont activées pour un canal, un sous-agent peut rester lié
à un fil afin que les messages de suivi de l’utilisateur dans ce fil continuent d’être acheminés vers
la même session de sous-agent.

### Canaux prenant en charge les fils

Un canal prend en charge les sessions persistantes de sous-agents liées à un fil
(`sessions_spawn` avec `thread: true`) lorsqu’il enregistre un adaptateur de liaison de conversation.
Canaux intégrés proposant cette prise en charge : **Discord**,
**iMessage**, **Matrix** et **Telegram**. Discord et Matrix créent par défaut
un fil enfant ; Telegram et iMessage lient par défaut la
conversation actuelle. Utilisez les clés de configuration `threadBindings` propres à chaque canal pour
l’activation, les délais d’expiration et `spawnSessions`.

### Déroulement rapide

<Steps>
  <Step title="Lancer">
    `sessions_spawn` avec `thread: true` (et éventuellement `mode: "session"`).
  </Step>
  <Step title="Lier">
    OpenClaw crée ou lie un fil à cette cible de session dans le canal actif.
  </Step>
  <Step title="Acheminer les suivis">
    Les réponses et les messages de suivi dans ce fil sont acheminés vers la session liée.
  </Step>
  <Step title="Examiner les délais d’expiration">
    Utilisez `/session idle` pour examiner ou mettre à jour la désactivation automatique après inactivité et
    `/session max-age` pour contrôler la limite absolue.
  </Step>
  <Step title="Détacher">
    Utilisez `/unfocus` pour effectuer un détachement manuel.
  </Step>
</Steps>

### Contrôles manuels

| Commande            | Effet                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------- |
| `/focus <target>`  | Lie le fil actuel (ou en crée un) à une cible de sous-agent/session                     |
| `/unfocus`         | Supprime la liaison du fil actuellement lié                                           |
| `/agents`          | Répertorie les exécutions actives et l’état des liaisons (`binding:<id>`, `unbound` ou `bindings unavailable`) |
| `/session idle`    | Examine ou met à jour la désactivation automatique après inactivité (fils liés actifs uniquement)                             |
| `/session max-age` | Examine ou met à jour la limite absolue (fils liés actifs uniquement)                                      |

### Options de configuration

- **Valeur globale par défaut :** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Les clés de remplacement par canal et de liaison automatique au lancement** sont propres à chaque adaptateur. Consultez la section [Canaux prenant en charge les fils](#thread-supporting-channels) ci-dessus.

Consultez la [référence de configuration](/fr/gateway/configuration-reference) et
les [commandes obliques](/fr/tools/slash-commands) pour connaître les détails actuels des adaptateurs.

### Liste d’autorisation

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Liste des identifiants d’agents configurés pouvant être ciblés via un `agentId` explicite (`["*"]` autorise toute cible configurée). Valeur par défaut : uniquement l’agent demandeur. Si vous définissez une liste et souhaitez toujours que le demandeur puisse se lancer lui-même avec `agentId`, incluez l’identifiant du demandeur dans la liste.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Liste d’autorisation par défaut des agents cibles configurés, utilisée lorsque l’agent demandeur ne définit pas son propre `subagents.allowAgents`.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Bloque les appels `sessions_spawn` qui omettent `agentId` (impose la sélection explicite d’un profil). Remplacement par agent : `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Délai d’expiration par appel pour les tentatives de remise de l’annonce `agent` par le Gateway. Les valeurs sont des nombres entiers positifs de millisecondes et sont plafonnées à la valeur maximale de temporisation sûre de la plateforme. Les nouvelles tentatives transitoires peuvent rendre l’attente totale de l’annonce supérieure à un délai configuré.
</ParamField>

Si la session du demandeur est isolée, `sessions_spawn` refuse les cibles
qui s’exécuteraient sans isolation.

### Découverte

Utilisez `agents_list` pour voir quels identifiants d’agents sont actuellement autorisés pour
`sessions_spawn`. La réponse inclut le modèle effectif de chaque agent répertorié
ainsi que les métadonnées intégrées de l’environnement d’exécution, afin que les appelants puissent distinguer OpenClaw, le serveur
d’application Codex et les autres environnements natifs configurés.

Les entrées `allowAgents` doivent pointer vers des identifiants d’agents configurés dans `agents.list[]`.
`["*"]` désigne tout agent cible configuré ainsi que le demandeur. Si une configuration d’agent
est supprimée mais que son identifiant reste dans `allowAgents`, `sessions_spawn` refuse cet identifiant
et `agents_list` l’omet. Exécutez `openclaw doctor --fix` pour nettoyer les entrées
obsolètes de la liste d’autorisation, ou ajoutez une entrée `agents.list[]` minimale lorsque la cible doit
rester disponible au lancement tout en héritant des valeurs par défaut.

### Archivage automatique

- Les sessions de sous-agents sont automatiquement archivées après `agents.defaults.subagents.archiveAfterMinutes` (valeur par défaut : `60`).
- L’archivage utilise `sessions.delete` et renomme la transcription en `*.deleted.<timestamp>` (même dossier).
- `cleanup: "delete"` archive immédiatement après l’annonce (la transcription est néanmoins conservée par renommage).
- L’archivage automatique est effectué au mieux ; les temporisateurs en attente sont perdus si le Gateway redémarre.
- Les délais d’exécution configurés n’archivent **pas** automatiquement ; ils arrêtent uniquement l’exécution. La session est conservée jusqu’à l’archivage automatique.
- L’archivage automatique s’applique de la même manière aux sessions de profondeur 1 et 2.
- Le nettoyage du navigateur est distinct du nettoyage des archives : la fermeture des onglets et processus de navigateur suivis est tentée à la fin de l’exécution, même si la transcription ou l’enregistrement de session est conservé.

## Sous-agents imbriqués

Par défaut, les sous-agents ne peuvent pas lancer leurs propres sous-agents
(`maxSpawnDepth: 1`). Définissez `maxSpawnDepth: 2` pour activer un niveau
d’imbrication — le **modèle d’orchestrateur** : agent principal → sous-agent orchestrateur →
sous-sous-agents exécutants.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // autorise les sous-agents à lancer des enfants (valeur par défaut : 1, plage 1-5)
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

| Profondeur | Forme de la clé de session                   | Rôle                                          | Peut créer des agents ?       |
| ---------- | ----------------------------------------- | --------------------------------------------- | ----------------------------- |
| 0          | `agent:<id>:main`                        | Agent principal                               | Toujours                      |
| 1          | `agent:<id>:subagent:<uuid>`                        | Sous-agent (orchestrateur si la profondeur 2 est autorisée) | Seulement si `maxSpawnDepth >= 2` |
| 2          | `agent:<id>:subagent:<uuid>:subagent:<uuid>`                        | Sous-sous-agent (agent d'exécution terminal)  | Jamais                        |

### Chaîne d'annonce

Les résultats remontent la chaîne :

1. L'agent de profondeur 2 termine → l'annonce à son parent (orchestrateur de profondeur 1).
2. L'orchestrateur de profondeur 1 reçoit l'annonce, synthétise les résultats, termine → l'annonce à l'agent principal.
3. L'agent principal reçoit l'annonce et la transmet à l'utilisateur.

Chaque niveau ne voit que les annonces de ses enfants directs.

<Note>
**Consignes opérationnelles :** lancez une seule fois le travail des enfants et attendez les événements d'achèvement au lieu de construire des boucles d'interrogation autour de `sessions_list`, `sessions_history`, `/subagents list` ou des commandes de mise en veille `exec`.
`sessions_list` et `/subagents list` maintiennent les relations entre sessions enfants centrées sur le travail actif : les enfants actifs restent attachés, ceux qui ont terminé restent visibles pendant une courte période récente, et les liens obsolètes vers des enfants présents uniquement dans le stockage sont ignorés après leur fenêtre de fraîcheur. Cela empêche les anciennes métadonnées `spawnedBy` / `parentSessionKey` de faire réapparaître des enfants fantômes après un redémarrage. Si un événement d'achèvement d'un enfant arrive après que vous avez déjà envoyé la réponse finale, le suivi correct est le jeton silencieux exact `NO_REPLY` / `no_reply`.
</Note>

### Politique des outils selon la profondeur

- Le rôle et la portée du contrôle sont inscrits dans les métadonnées de session lors de la création. Cela empêche les clés de session plates ou restaurées de récupérer accidentellement des privilèges d'orchestrateur.
- **Profondeur 1 (orchestrateur, lorsque `maxSpawnDepth >= 2`) :** obtient `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` afin de pouvoir créer des enfants et examiner leur état. Les autres outils de session/système restent refusés.
- **Profondeur 1 (terminal, lorsque `maxSpawnDepth == 1`) :** aucun outil de session (comportement actuel par défaut).
- **Profondeur 2 (agent d'exécution terminal) :** aucun outil de session — `sessions_spawn` est toujours refusé à la profondeur 2. Impossible de créer d'autres enfants.

### Limite de création par agent

Chaque session d'agent (quelle que soit sa profondeur) peut avoir au maximum `maxChildrenPerAgent`
(par défaut `5`) enfants actifs simultanément. Cela empêche une démultiplication incontrôlée
depuis un seul orchestrateur.

### Arrêt en cascade

L'arrêt d'un orchestrateur de profondeur 1 arrête automatiquement tous ses
enfants de profondeur 2 :

- `/stop` dans la conversation principale arrête tous les agents de profondeur 1 et propage l'arrêt à leurs enfants de profondeur 2.

## Authentification

L'authentification des sous-agents est résolue selon l'**identifiant de l'agent**, et non selon le type de session :

- La clé de session du sous-agent est `agent:<agentId>:subagent:<uuid>`.
- Le magasin d'authentification est chargé depuis le fichier `agentDir` de cet agent.
- Les profils d'authentification de l'agent principal sont fusionnés en tant que **solution de repli** ; les profils de l'agent prévalent sur ceux de l'agent principal en cas de conflit.

La fusion est additive ; les profils de l'agent principal sont donc toujours disponibles comme
solutions de repli. Une authentification entièrement isolée par agent n'est pas encore prise en charge.

## Annonce

Les sous-agents rendent compte au moyen d'une étape d'annonce :

- L'étape d'annonce s'exécute dans la session du sous-agent (et non dans la session du demandeur).
- Si le sous-agent répond exactement `ANNOUNCE_SKIP`, rien n'est publié.
- Si le dernier texte de l'assistant est le jeton silencieux exact `NO_REPLY` / `no_reply`, la sortie de l'annonce est supprimée même si des informations de progression visibles existaient auparavant.

La remise dépend de la profondeur du demandeur :

- Les sessions de demandeur de premier niveau utilisent un appel de suivi `agent` avec remise externe (`deliver=true`).
- Les sessions de sous-agent demandeur imbriquées reçoivent une injection de suivi interne (`deliver=false`) afin que l'orchestrateur puisse synthétiser les résultats des enfants dans la session.
- Si une session de sous-agent demandeur imbriquée n'existe plus, OpenClaw se rabat sur le demandeur de cette session lorsqu'il est disponible.

Pour les sessions de demandeur de premier niveau, la remise directe en mode achèvement
résout d'abord toute route de conversation/fil liée et toute substitution de hook, puis complète
les champs de canal et de cible manquants à partir de la route stockée dans la session du demandeur.
Cela maintient les achèvements dans la bonne conversation ou le bon sujet, même lorsque l'origine de l'achèvement
n'identifie que le canal.

Lors de la construction des résultats d'achèvement imbriqués, l'agrégation des achèvements des enfants est limitée à l'exécution actuelle du demandeur, ce qui empêche les sorties obsolètes des enfants issues d'exécutions précédentes de se retrouver dans l'annonce actuelle. Les réponses aux annonces préservent le routage du fil/sujet lorsqu'il est disponible dans les adaptateurs de canal.

### Contexte d'annonce

Le contexte d'annonce est normalisé sous la forme d'un bloc d'événement interne stable :

| Champ            | Source                                                                                                   |
| ---------------- | -------------------------------------------------------------------------------------------------------- |
| Source           | `subagent` ou `cron`                                                                 |
| Identifiants de session | Clé/identifiant de la session enfant                                                               |
| Type             | Type d'annonce + libellé de la tâche                                                                      |
| État             | Dérivé du résultat d'exécution (`ok`, `error`, `timeout` ou `unknown`) — **non** déduit du texte du modèle |
| Contenu du résultat | Dernier texte visible de l'assistant provenant de l'enfant                                            |
| Suivi            | Instruction indiquant quand répondre ou rester silencieux                                                |

Les exécutions ayant échoué de manière définitive signalent l'état d'échec sans restituer le
texte de réponse capturé. La sortie des outils et de leurs résultats n'est pas promue en texte de résultat de l'enfant.

### Ligne de statistiques

Les charges utiles d'annonce incluent une ligne de statistiques à la fin (même lorsqu'elles sont encapsulées) :

- Durée d'exécution (par exemple `runtime 5m12s`).
- Utilisation des jetons (entrée/sortie/total).
- Coût estimé lorsque la tarification du modèle est configurée (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` et chemin de la transcription afin que l'agent principal puisse récupérer l'historique au moyen de `sessions_history` ou examiner le fichier sur le disque.

Les métadonnées internes sont uniquement destinées à l'orchestration ; les réponses destinées aux utilisateurs
doivent être reformulées dans le style normal de l'assistant.

### Pourquoi préférer `sessions_history`

`sessions_history` est la méthode d'orchestration la plus sûre pour lire la
transcription d'un enfant pendant le tour d'un agent :

- Masque le texte ressemblant à des identifiants ou à des jetons, même lorsque le masquage général des journaux est désactivé.
- Tronque les longs blocs de texte (4000 caractères par bloc) et supprime les signatures de réflexion, les charges utiles de répétition du raisonnement et les données d'image intégrées.
- Applique une limite de réponse de 80 Ko ; les lignes trop volumineuses sont remplacées par `[sessions_history omitted: message too large]`.
- Utilisez `nextOffset` lorsqu'il est présent pour parcourir vers l'arrière les anciennes fenêtres de transcription.
- `sessions_history` ne supprime **pas** les balises de raisonnement, l'échafaudage `<relevant-memories>` ni le XML des appels d'outils du texte des messages : il renvoie des blocs de contenu structurés proches de la forme brute de la transcription, mais masqués et limités en taille. `/subagents log` applique le nettoyage plus poussé du texte (suppression des balises de raisonnement, de l'échafaudage de mémoire et du XML des appels d'outils), car il restitue des lignes de conversation en texte brut plutôt que des blocs structurés.
- L'examen de la transcription brute sur le disque constitue la solution de repli lorsque vous avez besoin de la transcription complète à l'octet près.

## Politique des outils

Les sous-agents utilisent d'abord le même profil et la même chaîne de politiques d'outils que le parent ou
l'agent cible. OpenClaw applique ensuite la couche de restrictions
des sous-agents.

Les sous-agents perdent toujours `gateway`, `agents_list`, `session_status` et
`cron`, quels que soient leur profondeur ou leur rôle (outils système/interactifs ou
outils que l'agent principal doit coordonner). Les sous-agents terminaux (comportement par défaut à la profondeur 1
et systématiquement à la profondeur 2) perdent également `subagents`,
`sessions_list`, `sessions_history` et `sessions_spawn`. Les sous-agents ne
reçoivent jamais l'outil `message` : il est désactivé au moment de la création, et non filtré par
cette liste de refus ; `sessions_send` reste également refusé afin que les sous-agents
communiquent uniquement par la chaîne d'annonce.

`sessions_history` reste ici aussi une vue de rappel limitée et nettoyée : il ne
s'agit pas d'une restitution brute de la transcription.

Lorsque `maxSpawnDepth >= 2`, les sous-agents orchestrateurs de profondeur 1
reçoivent également `sessions_spawn`, `subagents`, `sessions_list` et
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
        // le refus prévaut
        deny: ["gateway", "cron"],
        // si l'autorisation est définie, elle devient une liste d'autorisation exclusive (le refus prévaut toujours)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` est un filtre final d'autorisation exclusive. Il peut restreindre
l'ensemble des outils déjà résolu, mais ne peut pas **rajouter** un outil supprimé
par `tools.profile`. Par exemple, `tools.profile: "coding"` inclut
`web_search`/`web_fetch`, mais pas l'outil `browser`. Pour permettre
aux sous-agents du profil de codage d'utiliser l'automatisation du navigateur, ajoutez le navigateur à
l'étape du profil :

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Utilisez la configuration par agent `agents.list[].tools.alsoAllow: ["browser"]` lorsqu'un seul
agent doit disposer de l'automatisation du navigateur.

## Concurrence

Les sous-agents utilisent une file d'attente dédiée au sein du processus :

- **Nom de la file :** `subagent`
- **Concurrence :** `agents.defaults.subagents.maxConcurrent` (par défaut `8`)

## Activité et récupération

OpenClaw ne considère pas l'absence de `endedAt` comme une preuve définitive qu'un
sous-agent est toujours actif. Les exécutions non terminées plus anciennes que la fenêtre d'obsolescence
(2 heures, ou le délai d'expiration configuré pour l'exécution augmenté d'une courte période de grâce,
selon la durée la plus longue) ne sont plus comptabilisées comme actives/en attente dans `/subagents list`,
les résumés d'état, le contrôle d'achèvement des descendants et les vérifications de
concurrence par session.

Après un redémarrage du Gateway, les exécutions restaurées, obsolètes et non terminées sont élaguées, sauf si
leur session enfant est marquée `abortedLastRun: true`. Les exécutions
interrompues par le redémarrage restent enregistrées pour le mécanisme de récupération des sous-agents orphelins : les exécutions obsolètes
sont finalisées sans reprise, tandis que les sessions enfants récentes reçoivent
un message de reprise synthétique avant que le marqueur d'interruption soit effacé.

La récupération automatique après redémarrage est limitée par session enfant. Si le même
sous-agent enfant est accepté à plusieurs reprises pour une récupération d'orphelin pendant la
fenêtre de blocages rapides et répétés, OpenClaw conserve une pierre tombale de récupération dans cette
session et cesse de la reprendre automatiquement lors des redémarrages ultérieurs. Exécutez
`openclaw tasks maintenance --apply` pour réconcilier l'enregistrement de la tâche, ou
`openclaw doctor --fix` pour effacer les indicateurs obsolètes de récupération interrompue dans les
sessions dotées d'une pierre tombale.

<Note>
Si le lancement d’un sous-agent échoue avec Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, vérifiez l’appelant RPC avant de modifier l’état d’appairage.
La coordination interne `sessions_spawn` effectue la répartition dans le processus lorsque
l’appelant s’exécute déjà dans le contexte de la requête du Gateway ; elle
n’ouvre donc pas de WebSocket en boucle locale et ne dépend pas du périmètre de référence
des appareils appairés de la CLI. Les appelants externes au processus du Gateway utilisent toujours le
mécanisme de secours WebSocket comme `client.id: "gateway-client"` avec `client.mode: "backend"`
via une authentification directe en boucle locale par jeton partagé/mot de passe. Les appelants distants, les
`deviceIdentity` explicites, les chemins explicites utilisant un jeton d’appareil et les clients de navigateur/Node
nécessitent toujours l’approbation normale de l’appareil pour les extensions de périmètre.
</Note>

## Arrêt

- L’envoi de `/stop` dans la conversation du demandeur interrompt la session du demandeur et arrête toutes les exécutions actives de sous-agents lancées depuis celle-ci, avec propagation aux enfants imbriqués.

## Limitations

- L’annonce des sous-agents est fournie **au mieux**. Si le Gateway redémarre, les tâches « announce back » en attente sont perdues.
- Les sous-agents partagent toujours les mêmes ressources du processus du Gateway ; considérez `maxConcurrent` comme une soupape de sécurité.
- `sessions_spawn` est toujours non bloquant : il renvoie immédiatement `{ status: "accepted", runId, childSessionKey }`.
- Le contexte du sous-agent injecte uniquement `AGENTS.md` et `TOOLS.md` (sans `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md` ni `BOOTSTRAP.md`). Les sous-agents natifs de Codex suivent la même limite : `TOOLS.md` reste dans les instructions héritées du fil Codex, tandis que les fichiers de persona, d’identité et d’utilisateur réservés au parent sont injectés sous forme d’instructions de collaboration limitées au tour afin que les enfants ne les dupliquent pas.
- La profondeur maximale d’imbrication est de 5 (plage de `maxSpawnDepth` : 1-5). Une profondeur de 2 est recommandée pour la plupart des cas d’utilisation.
- `maxChildrenPerAgent` limite le nombre d’enfants actifs par session (valeur par défaut : `5`, plage : `1-20`).

## Voir aussi

- [Outils de session et changements d’état](/fr/concepts/session-tool)
- [Agents ACP](/fr/tools/acp-agents)
- [Envoi à un agent](/fr/tools/agent-send)
- [Tâches en arrière-plan](/fr/automation/tasks)
- [Outils de bac à sable multi-agent](/fr/tools/multi-agent-sandbox-tools)
