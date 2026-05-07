---
read_when:
    - Refactorisation du cycle de vie des sessions ACP ou nettoyage du processus ACPX
    - Débogage des processus ACPX orphelins, de la réutilisation des PID ou de la sécurité du nettoyage multi-Gateway
    - Modification de la visibilité de sessions_list pour les sessions ACP ou de sous-agent créées
    - Concevoir les métadonnées de propriété pour les tâches d’arrière-plan, les sessions ACP ou les baux de processus
sidebarTitle: ACP lifecycle refactor
summary: Plan de migration pour rendre explicite la propriété des sessions ACP et des processus ACPX
title: Refactorisation du cycle de vie ACP
x-i18n:
    generated_at: "2026-05-07T13:25:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: b7f4ee447e0b436601c68251c26c1b897a642f6a8b1886d18647b62817996792
    source_path: refactor/acp.md
    workflow: 16
---

Le cycle de vie ACP fonctionne actuellement, mais une trop grande partie en est déduite après coup.
Le nettoyage des processus reconstruit la propriété à partir des PID, des chaînes de commande, des chemins des wrappers et de la table des processus en direct. La visibilité des sessions reconstruit la propriété à partir de chaînes de clé de session et de recherches secondaires `sessions.list({ spawnedBy })`. Cela rend possibles des corrections ciblées, mais facilite aussi l’oubli des cas limites : réutilisation de PID, commandes avec guillemets, petits-enfants d’adaptateurs, racines d’état multi-Gateway, `cancel` contre `close`, et visibilité `tree` contre `all` deviennent tous des endroits distincts où redécouvrir les mêmes règles de propriété.

Cette refactorisation fait de la propriété un concept de premier ordre. L’objectif n’est pas une nouvelle surface produit ACP ; c’est un contrat interne plus sûr pour le comportement ACP et ACPX existant.

## Objectifs

- Le nettoyage ne signale jamais un processus sauf si les preuves vivantes actuelles correspondent à un bail détenu par OpenClaw.
- `cancel`, `close` et le fauchage au démarrage ont des intentions de cycle de vie distinctes.
- `sessions_list`, `sessions_history`, `sessions_send` et les vérifications de statut utilisent le même modèle de session détenue par le demandeur.
- Les installations multi-Gateway ne peuvent pas faucher les wrappers ACPX les unes des autres.
- Les anciens enregistrements de session ACPX continuent de fonctionner pendant la migration.
- Le runtime reste détenu par le Plugin ; le cœur n’apprend pas les détails du paquet ACPX.

## Non-objectifs

- Remplacer ACPX ou modifier la surface publique de la commande `/acp`.
- Déplacer le comportement d’adaptateur ACP propre à un fournisseur dans le cœur.
- Exiger des utilisateurs qu’ils nettoient manuellement l’état avant la mise à niveau.
- Faire en sorte que `cancel` ferme des sessions ACP réutilisables.

## Modèle cible

### Identité d’instance du Gateway

Chaque processus Gateway devrait avoir un identifiant d’instance d’exécution stable :

```ts
type GatewayInstanceId = string;
```

Il peut être généré au démarrage du Gateway et conservé dans l’état pendant toute la durée de vie de cette installation. Ce n’est pas un secret de sécurité ; c’est un discriminateur de propriété utilisé pour éviter de confondre les processus ACP d’un Gateway avec les processus d’un autre Gateway.

### Propriété des sessions ACP

Chaque session ACP lancée devrait avoir des métadonnées de propriété normalisées :

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

Le Gateway devrait renvoyer ces champs sur les lignes de session où ils sont connus. Le filtrage de visibilité devrait être une vérification pure sur les métadonnées de ligne :

```ts
canSeeSessionRow({
  row,
  requesterSessionKey,
  visibility,
  a2aPolicy,
});
```

Cela supprime les appels secondaires cachés `sessions.list({ spawnedBy })` des vérifications de visibilité. Un enfant ACP inter-agent lancé est détenu par le demandeur parce que la ligne le dit, pas parce qu’une seconde requête arrive à le trouver.

### Baux de processus ACPX

Chaque lancement de wrapper généré devrait créer un enregistrement de bail :

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

Le processus wrapper devrait recevoir l’identifiant de bail et l’identifiant d’instance du Gateway dans son environnement :

```sh
OPENCLAW_ACPX_LEASE_ID=...
OPENCLAW_GATEWAY_INSTANCE_ID=...
```

Lorsque la plateforme le permet, la vérification devrait privilégier les métadonnées de processus en direct qui ne peuvent pas être confondues par la mise entre guillemets des commandes :

- le PID racine existe toujours
- le chemin du wrapper en direct se trouve sous `wrapperRoot`
- le groupe de processus correspond au bail lorsqu’il est disponible
- l’environnement contient l’identifiant de bail attendu lorsqu’il est lisible
- le hachage de commande ou le chemin de l’exécutable correspond au bail

Si le processus en direct ne peut pas être vérifié, le nettoyage échoue en mode fermé.

## Contrôleur de cycle de vie

Introduire un contrôleur de cycle de vie ACPX unique qui possède les baux de processus et la politique de nettoyage :

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

`cancelTurn` demande uniquement l’annulation du tour. Il ne doit pas faucher les wrappers ou processus d’adaptateur réutilisables.

`closeSession` est autorisé à faucher, mais seulement après avoir chargé l’enregistrement de session, chargé le bail et vérifié que l’arborescence de processus en direct appartient toujours à ce bail.

`reapStartupOrphans` part des baux ouverts dans l’état. Il peut utiliser la table des processus pour trouver les descendants, mais il ne devrait pas commencer par analyser des commandes arbitraires ressemblant à ACP pour ensuite décider qu’elles sont probablement les nôtres.

## Contrat de wrapper

Les wrappers générés devraient rester petits. Ils devraient :

- démarrer l’adaptateur dans un groupe de processus lorsque c’est pris en charge
- transférer les signaux de terminaison normaux au groupe de processus
- détecter la mort du parent
- à la mort du parent, envoyer SIGTERM, puis garder le wrapper en vie jusqu’à l’exécution du repli SIGKILL
- signaler le PID racine et l’identifiant de groupe de processus au contrôleur de cycle de vie lorsque c’est disponible

Les wrappers ne devraient pas décider de la politique de session. Ils appliquent uniquement le nettoyage local de l’arborescence de processus pour leur propre groupe d’adaptateur.

## Contrat de visibilité des sessions

La visibilité devrait utiliser la propriété de ligne normalisée :

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
- `tree` : la session du demandeur plus les lignes détenues par le demandeur ou lancées depuis celui-ci.
- `all` : toutes les lignes du même agent, les lignes inter-agents autorisées par a2a et les lignes inter-agents lancées qui sont détenues par le demandeur, même lorsque l’a2a général est désactivé.
- `agent` : même agent uniquement, sauf si une relation de propriété explicite indique que la ligne appartient au demandeur.

Cela rend `tree` et `all` monotones : `all` ne doit pas masquer un enfant détenu que `tree` afficherait.

## Plan de migration

### Phase 1 : ajouter l’identité et les baux

- Ajouter `gatewayInstanceId` à l’état du Gateway.
- Ajouter un magasin de baux ACPX sous le répertoire d’état ACPX.
- Écrire un bail avant de lancer un wrapper généré.
- Stocker `leaseId` sur les nouveaux enregistrements de session ACPX.
- Conserver les champs PID et commande existants pour les anciens enregistrements.

### Phase 2 : nettoyage avec priorité au bail

- Modifier le nettoyage de fermeture pour charger `leaseId` en premier.
- Vérifier la propriété du processus en direct par rapport au bail avant d’envoyer un signal.
- Conserver le repli actuel sur le PID racine et la racine de wrapper uniquement pour les enregistrements hérités.
- Marquer les baux comme `closed` après un nettoyage vérifié.
- Marquer les baux comme `lost` lorsque le processus a disparu avant le nettoyage.

### Phase 3 : fauchage au démarrage avec priorité au bail

- Le fauchage au démarrage analyse les baux ouverts.
- Pour chaque bail, vérifier le processus racine et collecter les descendants.
- Faucher les arborescences vérifiées en commençant par les enfants.
- Expirer les anciens baux `closed` et `lost` avec une fenêtre de rétention bornée.
- Conserver l’analyse des marqueurs de commande uniquement comme repli hérité temporaire, protégée par la racine de wrapper et l’instance Gateway lorsque c’est possible.

### Phase 4 : lignes de propriété de session

- Ajouter les métadonnées de propriété aux lignes de session du Gateway.
- Apprendre aux écrivains ACPX, de sous-agent, de tâche en arrière-plan et de magasin de sessions à renseigner `ownerSessionKey` ou `spawnedBy`.
- Convertir les vérifications de visibilité de session pour utiliser les métadonnées de ligne.
- Supprimer les recherches secondaires `sessions.list({ spawnedBy })` au moment de la visibilité.

### Phase 5 : supprimer les heuristiques héritées

Après une fenêtre de publication :

- arrêter de s’appuyer sur les chaînes de commande racine stockées pour le nettoyage ACPX non hérité
- supprimer les analyses de marqueurs de commande au démarrage
- supprimer les recherches de liste de repli pour la visibilité
- conserver le comportement défensif d’échec en mode fermé pour les baux manquants ou non vérifiables

## Tests

Ajouter deux suites pilotées par tableaux.

Simulateur de cycle de vie de processus :

- PID réutilisé par un processus sans rapport
- PID réutilisé par la racine de wrapper d’un autre Gateway
- la commande de wrapper stockée est mise entre guillemets par le shell, la commande `ps` en direct ne l’est pas
- l’enfant de l’adaptateur se termine, le petit-enfant reste dans le groupe de processus
- le repli SIGTERM à la mort du parent atteint SIGKILL
- liste des processus indisponible
- bail obsolète avec processus manquant
- orphelin de démarrage avec wrapper, enfant d’adaptateur et petit-enfant

Matrice de visibilité de session :

- `self`, `tree`, `agent`, `all`
- a2a activé et désactivé
- ligne du même agent
- ligne inter-agent
- ligne ACP inter-agent lancée et détenue par le demandeur
- demandeur en bac à sable borné à `tree`
- actions de liste, d’historique, d’envoi et de statut

L’invariant important : un enfant lancé détenu par le demandeur est visible partout où la visibilité configurée inclut l’arborescence de session du demandeur, et `all` n’est pas moins capable que `tree`.

## Notes de compatibilité

Les anciens enregistrements de session peuvent ne pas avoir `leaseId`. Ils devraient utiliser le chemin de nettoyage hérité en échec fermé :

- exiger un processus racine en direct
- exiger la propriété de la racine de wrapper lorsqu’un wrapper généré est attendu
- exiger la concordance de commande pour les racines sans wrapper
- ne jamais envoyer de signal uniquement sur la base de métadonnées de PID stockées obsolètes

Si un enregistrement hérité ne peut pas être vérifié, le laisser tel quel. Le nettoyage des baux au démarrage et la prochaine fenêtre de publication devraient finir par retirer le repli.

## Critères de réussite

- La fermeture d’une session ACPX ancienne ou obsolète ne peut pas tuer le processus d’un autre Gateway.
- La mort du parent ne laisse pas tourner des petits-enfants d’adaptateur récalcitrants.
- `cancel` interrompt le tour actif sans fermer les sessions réutilisables.
- `sessions_list` peut afficher les enfants ACP inter-agents détenus par le demandeur sous `tree` comme sous `all`.
- Le nettoyage au démarrage est piloté par les baux, pas par de larges analyses de chaînes de commande.
- Les tests ciblés de matrice de processus et de visibilité couvrent chaque cas limite qui nécessitait auparavant des corrections de revue ponctuelles.
