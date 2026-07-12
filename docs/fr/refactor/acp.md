---
read_when:
    - Refactorisation du cycle de vie des sessions ACP ou du nettoyage des processus ACPX
    - Débogage des processus orphelins ACPX, de la réutilisation des PID ou de la sécurité du nettoyage avec plusieurs Gateway
    - Modification de la visibilité de `sessions_list` pour les sessions ACP ou de sous-agent générées
    - Conception des métadonnées de propriété pour les tâches en arrière-plan, les sessions ACP ou les baux de processus
sidebarTitle: ACP lifecycle refactor
summary: Plan de migration pour expliciter la propriété des sessions ACP et des processus ACPX
title: Refactorisation du cycle de vie d’ACP
x-i18n:
    generated_at: "2026-07-12T03:03:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b7f4ee447e0b436601c68251c26c1b897a642f6a8b1886d18647b62817996792
    source_path: refactor/acp.md
    workflow: 16
---

Le cycle de vie ACP fonctionne actuellement, mais une trop grande partie de celui-ci est déduite a posteriori.
Le nettoyage des processus reconstitue la propriété à partir des PID, des chaînes de commande, des chemins
des wrappers et de la table des processus actifs. La visibilité des sessions reconstitue la propriété
à partir des chaînes de clés de session, complétées par des recherches secondaires `sessions.list({ spawnedBy })`.
Cela permet des corrections ciblées, mais facilite également l'omission de cas limites :
la réutilisation des PID, les commandes entre guillemets, les petits-enfants des adaptateurs, les racines d'état
à plusieurs Gateway, `cancel` par rapport à `close`, ainsi que la visibilité `tree` par rapport à `all` deviennent autant
d'endroits distincts où les mêmes règles de propriété doivent être redécouvertes.

Cette refactorisation fait de la propriété un concept de premier ordre. L'objectif n'est pas d'ajouter une nouvelle surface
produit ACP, mais de fournir un contrat interne plus sûr pour le comportement ACP et ACPX existant.

## Objectifs

- Le nettoyage n'envoie jamais de signal à un processus sans preuve actuelle issue du système actif correspondant à un
  bail détenu par OpenClaw.
- `cancel`, `close` et la récupération au démarrage ont des intentions de cycle de vie distinctes.
- `sessions_list`, `sessions_history`, `sessions_send` et les vérifications d'état utilisent
  le même modèle de session détenue par le demandeur.
- Les installations à plusieurs Gateway ne peuvent pas récupérer mutuellement leurs wrappers ACPX.
- Les anciens enregistrements de session ACPX continuent de fonctionner pendant la migration.
- Le runtime reste détenu par le Plugin ; le cœur ne connaît pas les détails du paquet ACPX.

## Hors objectifs

- Remplacer ACPX ou modifier la surface publique de la commande `/acp`.
- Déplacer dans le cœur le comportement des adaptateurs ACP propre à un fournisseur.
- Obliger les utilisateurs à nettoyer manuellement l'état avant une mise à niveau.
- Faire en sorte que `cancel` ferme les sessions ACP réutilisables.

## Modèle cible

### Identité de l'instance du Gateway

Chaque processus Gateway doit disposer d'un identifiant d'instance de runtime stable :

```ts
type GatewayInstanceId = string;
```

Il peut être généré au démarrage du Gateway et conservé dans l'état pendant toute la durée de vie
de cette installation. Il ne s'agit pas d'un secret de sécurité, mais d'un discriminant de propriété utilisé
pour éviter de confondre les processus ACP d'un Gateway avec ceux d'un autre Gateway.

### Propriété des sessions ACP

Chaque session ACP créée doit comporter des métadonnées de propriété normalisées :

```ts
type AcpSessionOwner = {
  sessionKey: string;
  spawnedBy?: string;
  parentSessionKey?: string;
  ownerSessionKey: string;
  agentId: string;
  backend: "acpx";
  gatewayInstanceId: GatewayInstanceId;
  createdAt: number;
};
```

Le Gateway doit renvoyer ces champs sur les lignes de session lorsqu'ils sont connus.
Le filtrage de visibilité doit être une vérification pure fondée sur les métadonnées de la ligne :

```ts
canSeeSessionRow({
  row,
  requesterSessionKey,
  visibility,
  a2aPolicy,
});
```

Cela supprime les appels secondaires cachés à `sessions.list({ spawnedBy })` des
vérifications de visibilité. Un enfant ACP inter-agent créé est détenu par le demandeur parce que
la ligne l'indique, et non parce qu'une seconde requête le trouve par hasard.

### Baux des processus ACPX

Chaque lancement de wrapper généré doit créer un enregistrement de bail :

```ts
type AcpxProcessLease = {
  leaseId: string;
  gatewayInstanceId: GatewayInstanceId;
  sessionKey: string;
  wrapperRoot: string;
  wrapperPath: string;
  rootPid: number;
  processGroupId?: number;
  commandHash: string;
  startedAt: number;
  state: "open" | "closing" | "closed" | "lost";
};
```

Le processus wrapper doit recevoir l'identifiant du bail et celui de l'instance du Gateway dans son
environnement :

```sh
OPENCLAW_ACPX_LEASE_ID=...
OPENCLAW_GATEWAY_INSTANCE_ID=...
```

Lorsque la plateforme le permet, la vérification doit privilégier les métadonnées du processus actif
qui ne peuvent pas être rendues ambiguës par la mise entre guillemets de la commande :

- le PID racine existe toujours
- le chemin du wrapper actif se trouve sous `wrapperRoot`
- le groupe de processus correspond au bail lorsqu'il est disponible
- l'environnement contient l'identifiant de bail attendu lorsqu'il est lisible
- le hachage de la commande ou le chemin de l'exécutable correspond au bail

Si le processus actif ne peut pas être vérifié, le nettoyage échoue de manière sûre.

## Contrôleur du cycle de vie

Introduire un contrôleur unique du cycle de vie ACPX qui détient les baux des processus et la stratégie
de nettoyage :

```ts
interface AcpxLifecycleController {
  ensureSession(input: AcpRuntimeEnsureInput): Promise<AcpRuntimeHandle>;
  cancelTurn(handle: AcpRuntimeHandle): Promise<void>;
  closeSession(input: {
    handle: AcpRuntimeHandle;
    discardPersistentState?: boolean;
    reason?: string;
  }): Promise<void>;
  reapStartupOrphans(): Promise<void>;
  verifyOwnedTree(lease: AcpxProcessLease): Promise<OwnedProcessTree | null>;
}
```

`cancelTurn` demande uniquement l'annulation du tour. Il ne doit pas récupérer les processus
wrapper ou adaptateur réutilisables.

`closeSession` est autorisé à effectuer la récupération, mais uniquement après avoir chargé l'enregistrement de session,
chargé le bail et vérifié que l'arborescence de processus active appartient toujours à ce
bail.

`reapStartupOrphans` part des baux ouverts dans l'état. Il peut utiliser la table des processus
pour trouver les descendants, mais il ne doit pas commencer par analyser des commandes arbitraires
ressemblant à ACP avant de décider qu'elles nous appartiennent probablement.

## Contrat du wrapper

Les wrappers générés doivent rester petits. Ils doivent :

- démarrer l'adaptateur dans un groupe de processus lorsque cela est pris en charge
- transmettre les signaux normaux de terminaison au groupe de processus
- détecter la mort du parent
- à la mort du parent, envoyer SIGTERM, puis maintenir le wrapper actif jusqu'à l'exécution de la solution de repli
  SIGKILL
- transmettre le PID racine et l'identifiant du groupe de processus au contrôleur du cycle de vie lorsque
  cela est possible

Les wrappers ne doivent pas décider de la stratégie de session. Ils assurent uniquement le nettoyage local
de l'arborescence de processus de leur propre groupe d'adaptateurs.

## Contrat de visibilité des sessions

La visibilité doit utiliser la propriété normalisée des lignes :

```ts
type SessionVisibilityInput = {
  requesterSessionKey: string;
  row: {
    key: string;
    agentId: string;
    ownerSessionKey?: string;
    spawnedBy?: string;
    parentSessionKey?: string;
  };
  visibility: "self" | "tree" | "agent" | "all";
  a2aPolicy: AgentToAgentPolicy;
};
```

Règles :

- `self` : uniquement la session du demandeur.
- `tree` : la session du demandeur ainsi que les lignes détenues par le demandeur ou créées depuis celui-ci.
- `all` : toutes les lignes du même agent, les lignes inter-agents autorisées par a2a et les lignes inter-agents
  créées détenues par le demandeur, même lorsque le fonctionnement général a2a est désactivé.
- `agent` : le même agent uniquement, sauf si une relation de propriété explicite indique que la ligne
  appartient au demandeur.

Cela rend `tree` et `all` monotones : `all` ne doit pas masquer un enfant détenu que
`tree` afficherait.

## Plan de migration

### Phase 1 : ajouter l'identité et les baux

- Ajouter `gatewayInstanceId` à l'état du Gateway.
- Ajouter un magasin de baux ACPX sous le répertoire d'état ACPX.
- Écrire un bail avant de créer un wrapper généré.
- Stocker `leaseId` sur les nouveaux enregistrements de session ACPX.
- Conserver les champs existants de PID et de commande pour les anciens enregistrements.

### Phase 2 : nettoyage fondé en priorité sur les baux

- Modifier le nettoyage lors de la fermeture pour charger d'abord `leaseId`.
- Vérifier la propriété du processus actif à partir du bail avant d'envoyer un signal.
- Conserver la solution de repli actuelle fondée sur le PID racine et la racine du wrapper uniquement pour les enregistrements hérités.
- Marquer les baux comme `closed` après un nettoyage vérifié.
- Marquer les baux comme `lost` lorsque le processus a disparu avant le nettoyage.

### Phase 3 : récupération au démarrage fondée en priorité sur les baux

- La récupération au démarrage analyse les baux ouverts.
- Pour chaque bail, vérifier le processus racine et collecter les descendants.
- Récupérer les arborescences vérifiées en commençant par les enfants.
- Faire expirer les anciens baux `closed` et `lost` avec une fenêtre de conservation limitée.
- Conserver l'analyse des marqueurs de commande uniquement comme solution de repli temporaire pour les données héritées, protégée si possible par
  la racine du wrapper et l'instance du Gateway.

### Phase 4 : lignes de propriété des sessions

- Ajouter les métadonnées de propriété aux lignes de session du Gateway.
- Faire en sorte que les composants d'écriture ACPX, de sous-agents, de tâches en arrière-plan et du magasin de sessions renseignent
  `ownerSessionKey` ou `spawnedBy`.
- Convertir les vérifications de visibilité des sessions afin qu'elles utilisent les métadonnées des lignes.
- Supprimer les recherches secondaires `sessions.list({ spawnedBy })` effectuées lors des vérifications de visibilité.

### Phase 5 : supprimer les heuristiques héritées

Après une fenêtre de publication :

- cesser de s'appuyer sur les chaînes de commande racine stockées pour le nettoyage ACPX non hérité
- supprimer les analyses de marqueurs de commande au démarrage
- supprimer les recherches de liste de repli pour la visibilité
- conserver un comportement défensif d'échec sûr pour les baux manquants ou invérifiables

## Tests

Ajouter deux suites pilotées par des tables.

Simulateur du cycle de vie des processus :

- PID réutilisé par un processus sans rapport
- PID réutilisé par la racine du wrapper d'un autre Gateway
- la commande du wrapper stockée est échappée pour l'interpréteur de commandes, contrairement à la commande `ps` active
- l'enfant de l'adaptateur se termine, mais un petit-enfant reste dans le groupe de processus
- la solution de repli SIGTERM après la mort du parent atteint SIGKILL
- liste des processus indisponible
- bail obsolète dont le processus est absent
- processus orphelin au démarrage avec wrapper, enfant de l'adaptateur et petit-enfant

Matrice de visibilité des sessions :

- `self`, `tree`, `agent`, `all`
- a2a activé et désactivé
- ligne du même agent
- ligne inter-agent
- ligne ACP inter-agent créée et détenue par le demandeur
- demandeur isolé dans un bac à sable et limité à `tree`
- actions de liste, d'historique, d'envoi et d'état

Invariant important : un enfant créé et détenu par le demandeur est visible partout où
la visibilité configurée inclut l'arborescence de session du demandeur, et `all` n'est pas
moins permissif que `tree`.

## Notes de compatibilité

Les anciens enregistrements de session peuvent ne pas comporter de `leaseId`. Ils doivent utiliser le chemin de nettoyage
hérité à échec sûr :

- exiger un processus racine actif
- exiger que la racine du wrapper soit détenue lorsque la présence d'un wrapper généré est attendue
- exiger la concordance des commandes pour les racines sans wrapper
- ne jamais envoyer de signal uniquement à partir de métadonnées de PID stockées et obsolètes

Si un enregistrement hérité ne peut pas être vérifié, ne pas y toucher. Le nettoyage des baux au démarrage et
la prochaine fenêtre de publication devraient finir par permettre de supprimer la solution de repli.

## Critères de réussite

- La fermeture d'une session ACPX ancienne ou obsolète ne peut pas tuer le processus d'un autre Gateway.
- La mort du parent ne laisse pas s'exécuter des petits-enfants persistants de l'adaptateur.
- `cancel` interrompt le tour actif sans fermer les sessions réutilisables.
- `sessions_list` peut afficher les enfants ACP inter-agents détenus par le demandeur avec `tree` comme avec `all`.
- Le nettoyage au démarrage est piloté par les baux, et non par de vastes analyses de chaînes de commande.
- Les tests ciblés de la matrice des processus et de la visibilité couvrent chaque cas limite qui
  nécessitait auparavant des corrections ponctuelles lors des revues.
