---
read_when:
    - Conception ou mise en œuvre du provisionnement des workers cloud, du mode worker ou du transfert de session
    - Modification de `environments.*`, du protocole des workers, de l’ingestion des transcriptions ou des RPC du proxy d’inférence
    - Examen de la posture de sécurité de l’exécution d’agents à distance
summary: Exécutez des sessions d’agent sur des machines éphémères accessibles par SSH, avec une inférence relayée par le Gateway et une diffusion en direct dans la barre latérale.
title: Plan des workers cloud
x-i18n:
    generated_at: "2026-07-12T15:35:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 134c3f6e486837607225d95d12a3153525b14237b362b9f9957313d9bc379dc4
    source_path: plan/cloud-workers.md
    workflow: 16
---

## Statut

Proposition, révision 3. Non implémentée. Orientation convenue en 2026-07 ; la révision 2 a intégré les conclusions de l’examen contradictoire (protocole de worker dédié, machines à états de placement et d’environnement, synchronisation entrante tenant compte de Git, transfert unidirectionnel en v1, formulation de sécurité relative aux sorties réseau contrôlées). La révision 3 finalise le modèle de responsabilité de la synchronisation (le worker crée les commits, le Gateway les adopte et les publie), ajoute un mode de synchronisation simple sans Git, corrige l’exécution du worker en accès complet dans la machine, déplace la politique Internet au moment du provisionnement et rétablit l’envoi de l’agent au jalon 3.

## Problème

Les sessions d’agent OpenClaw exécutent leur boucle, leurs outils et l’inférence dans le processus du Gateway sur une seule machine. La puissance de calcul est limitée par cette machine, les tâches longues l’occupent et les travaux parallèles se la disputent. Les produits hébergés (agents cloud Cursor, Claude Code sur le Web, cloud Codex) résolvent ce problème avec des environnements cloud éphémères par tâche, mais ils nécessitent l’infrastructure et la confiance d’un fournisseur.

Les opérateurs qui possèdent déjà des machines inutilisées (ou peuvent en louer à faible coût) ne disposent d’aucun moyen de demander : exécutez cette session là-bas, affichez-la dans ma barre latérale comme toute autre session, puis supprimez la machine une fois le travail terminé.

## Objectifs

- Exécuter une session d’agent complète (boucle + outils) sur une machine distante éphémère (« worker cloud »), tandis que la session apparaît et diffuse ses données dans l’interface de contrôle exactement comme une session locale.
- Aucun identifiant permanent sur le worker (ni authentification de fournisseur, ni jeton de forge) et aucune sortie réseau directe ; la machine nécessite uniquement un serveur sshd accessible.
- Provisionner, synchroniser, exécuter, collecter, détruire — de manière entièrement automatisée et avec des fournisseurs interchangeables (premier fournisseur : CLI de location de type Crabbox).
- Envoyer un travail en cours du Gateway vers un worker à la limite d’un tour, sans perdre la transcription, l’identité de session ni, lorsque les octets de la requête restent équivalents, l’affinité avec le cache du fournisseur ; rapatrier les résultats en toute sécurité.
- Permettre aux humains (interface utilisateur) comme aux agents (outil) d’envoyer du travail vers un worker cloud.
- Prendre en charge les sessions durant plusieurs jours ; la durée de vie relève d’une politique, et non d’une limite codée en dur.

## Hors objectifs (v1)

- Aucun environnement de développement de code externe (Claude Code, Codex CLI) sur les workers. Les sessions des workers exécutent uniquement le moteur intégré d’OpenClaw. La prise en charge de ces environnements sera une option de v2, car ils effectuent eux-mêmes l’inférence avec leurs propres identifiants.
- Aucune dispersion de tentatives parallèles ou de type meilleur résultat parmi N.
- Aucune dépendance à un VPN ou à un tailnet. Le transport repose uniquement sur SSH.
- Aucun nouveau moteur d’environnement isolé. La machine du worker constitue la frontière d’isolation ; une isolation du système d’exploitation à l’intérieur de la machine pourra être ajoutée ultérieurement.
- Aucune migration dynamique symétrique en v1 : l’envoi s’effectue du système local vers le worker ; le retour du worker vers le système local nécessite une session arrêtée et une réconciliation terminée de l’espace de travail. Un transfert dynamique bidirectionnel pourra ultérieurement s’appuyer sur les mêmes mécanismes de barrière.
- Aucun état secondaire JSON sur le Gateway ; l’état de l’environnement, du placement, du curseur et des autorisations réside dans SQLite.

## Travaux antérieurs (ce que nous reprenons et ce que nous inversons)

- Agents cloud Cursor : la boucle de l’agent s’exécute dans leur cloud ; la machine virtuelle sert de cible d’exécution des outils ; un magasin de conversation en ajout seul diffuse les données à tous les clients ; un instantané après installation permet un démarrage à chaud ; les workers auto-hébergés sont des processus effectuant uniquement des connexions sortantes. Nous reprenons les modèles dans lesquels « la source de vérité de la conversation reste sur l’orchestrateur » et la diffusion en continu ; nous inversons le placement de la boucle (voir la décision ci-dessous).
- Cloud Codex : exécution en deux phases — phase de configuration avec accès réseau, puis phase d’agent hors ligne après suppression des secrets ; cache de l’état du conteneur pour accélérer les reprises. Nous reprenons la séparation en phases pour notre approche des sorties réseau, ainsi que l’idée du cache pour les images préchauffées en v2.
- Claude Code sur le Web : machine virtuelle par session ; proxy Git isolant les identifiants (les véritables jetons n’entrent jamais dans l’environnement isolé, et l’envoi est limité à la branche de la session) ; instantané du système de fichiers après la configuration ; transfert par téléportation = branche envoyée + historique rejoué. Nous reprenons l’isolation des identifiants et le cadre du transfert, mais la synchronisation sortante utilise rsync depuis le Gateway afin de prendre en charge les arbres de travail non propres, sans qu’aucun jeton de forge ne se trouve à proximité de la machine.
- Agent de programmation Copilot : sorties réseau refusées par défaut, avec une liste d’autorisation pour les registres de paquets. Notre valeur par défaut en régime permanent est plus stricte (aucune sortie directe), car l’inférence et la recherche Web passent par le tunnel SSH — mais consultez la section Sécurité pour comprendre pourquoi il s’agit de « sorties réseau contrôlées » et non de « sorties réseau nulles ».

## Décision d’architecture : boucle sur le worker, inférence via le Gateway

Trois placements ont été envisagés :

1. La boucle reste sur le Gateway, le worker exécute les outils (modèle Cursor). C’est le domaine de défaillance le plus sûr (la transcription, l’inférence, les approbations et la récupération après redémarrage restent toutes locales) et le premier jalon privilégié par un examinateur. Ce placement a été rejeté comme architecture du produit : les outils d’OpenClaw autres que l’exécution effectuent des opérations de système de fichiers dans le processus ; chaque lecture, modification ou recherche de fichier nécessiterait donc un aller-retour réseau ou une refonte importante de la surface des outils sous forme de RPC d’espace de travail à granularité élevée. Le comportement d’exécution est bavard et limité par la latence. Nous en reprenons l’esprit là où il est déjà implémenté (déport de l’exécution vers des Nodes), mais nous ne construisons pas la couche d’accès distant aux outils.
2. La boucle et l’inférence s’exécutent toutes deux sur le worker. C’est le domaine de défaillance le plus simple, mais les identifiants des modèles (y compris les profils OAuth) doivent être envoyés sur des machines jetables, le Gateway perd le contrôle des politiques, du routage et de l’audit, et la migration modifie l’identité qui appelle le fournisseur, ce qui invalide les caches de ce dernier.
3. La boucle et les outils s’exécutent sur le worker, tandis que les appels aux modèles transitent par le Gateway. Option retenue. Un aller-retour par tour de modèle plutôt que par appel d’outil ; les outils s’exécutent à proximité du code ; le Gateway demeure l’unique propriétaire des profils d’authentification, du routage des fournisseurs et des politiques ; le worker ne détient aucun secret.

Le coût de l’option 3 est une dépendance synchrone envers le Gateway pendant chaque tour de modèle. Ses règles de durabilité font donc partie intégrante de la décision et ne constituent pas un ajout ultérieur :

- La perte du Gateway au milieu d’un tour fait échouer l’appel actif au fournisseur. Le tour est marqué comme ayant échoué et réessayé en tant que nouveau tour après la reconnexion ; aucun flux de fournisseur en cours n’est rejoué de manière transparente, en raison du risque de double facturation ou de double appel d’outil.
- Chaque opération worker↔Gateway comporte une identité durable (voir Protocole du worker), afin que les reconnexions reprennent l’exécution ou récupèrent les résultats terminaux mis en cache au lieu de rester en suspens.
- Le Gateway est un composant dont la capacité est gérée : les limites de workers simultanés, le contrôle de flux et le délestage de charge sont inclus dans le périmètre de la v1 (voir Capacité).

Puisque le Gateway stocke à la fois la transcription et génère tout le trafic destiné aux fournisseurs, la session est indépendante de son emplacement : déplacer la boucle entre le Gateway et le worker ne change rien du côté du fournisseur ni dans le chemin des données de l’interface utilisateur. C’est ce qui rend l’envoi et le rapatriement peu coûteux.

## Composants

### 1. Machine à états de l’environnement + contrat du fournisseur

`environments.*` dans le protocole du Gateway est actuellement une projection limitée au statut. Le cœur durable est un enregistrement d’environnement détenu dans SQLite et une machine à états, conçus avant les formes des RPC :

`requested → provisioning → bootstrapping → ready → (attached|idle) → draining → destroying → destroyed | failed | orphaned`

- Le provisionnement résiste aux plantages : la ligne d’intention est persistée avant l’appel au fournisseur, avec un identifiant d’opération déterministe, afin qu’un redémarrage du Gateway puisse reprendre un bail en cours plutôt que de provisionner deux fois ou d’abandonner une machine payante.
- La réconciliation après redémarrage et un mécanisme de nettoyage des ressources orphelines (`inspect` du fournisseur comparé aux enregistrements locaux) sont des exigences de la v1, et non des mesures de durcissement.

Contrat du fournisseur (implémenté par un Plugin ; aucun nom de fournisseur ni aucune politique dans le cœur) :

```ts
type WorkerProvider = {
  id: string;
  provision(profile: WorkerProfile, opId: string): Promise<WorkerLease>; // → hôte/port/utilisateur SSH/matériel de clé
  inspect(lease: { leaseId: string; profile: WorkerProfile }): Promise<LeaseStatus>; // reprise/santé/nettoyage des ressources orphelines
  renew?(leaseId: string): Promise<void>; // sessions de longue durée par rapport aux durées de vie des fournisseurs
  destroy(lease: { leaseId: string; profile: WorkerProfile }): Promise<void>; // idempotent, retourne uniquement après preuve de la destruction
};
```

RPC : `environments.create`, `environments.destroy`, `environments.list/status` étendus (fournisseur, identifiant du bail, état, ancienneté, durée d’inactivité, sessions attachées). Premiers fournisseurs : un wrapper de CLI de location au format Crabbox (parcours du produit) et un fournisseur d’hôte SSH statique marqué comme réservé au développement — un worker sur un hôte partagé peut lire des données sans rapport avec sa tâche ; les hôtes statiques sont donc destinés au développement de la fonctionnalité, et non à la posture par défaut.

### 2. Amorçage du worker : installer OpenClaw sur la machine

Aucun artefact de worker sur mesure et aucune dépendance à la disponibilité de npm :

- Installation canonique pour tous les modes : un paquet de worker produit par le Gateway et identifié par le hachage de son contenu (la propre sortie de compilation du Gateway empaquetée dans une archive tar), transféré par SSH et installé sur la machine. Cela couvre par construction les compilations de développement et les commits non publiés.
- `npm i -g openclaw@<exact gateway version>` constitue une optimisation lorsque le Gateway exécute une version publiée ; jamais `latest`.
- L’amorçage est idempotent ; un bail préchauffé dont le hachage de paquet correspond ignore l’installation. Les machines brutes peuvent nécessiter une phase de chaîne d’outils avec accès réseau (environnement d’exécution Node) — celle-ci fait partie de la phase de configuration, puis l’accès est fermé.
- La négociation initiale vérifie le hachage de compilation du worker, l’ensemble des fonctionnalités du protocole et la compatibilité de l’environnement d’exécution. Les vérifications existantes de version et de protocole du Gateway ne suffisent pas à cette fin (les Nodes passant par un tunnel SSH sont exemptés du rejet en cas de version non identique) ; l’admission du worker effectue donc sa propre vérification de compilation exacte.

Le mode worker (`openclaw worker`) est un point d’entrée, et non une bifurcation : il associe la gestion des connexions et le moteur d’agent intégré, avec une persistance de session et des appels aux modèles reposant sur les RPC du Gateway. Il ne doit pas démarrer les surfaces du Gateway : aucun canal, aucun démarrage automatique de Plugin en dehors de l’ensemble d’outils de la session, un répertoire d’état jetable et aucun profil d’authentification local.

### 3. Transport : tout via SSH

Le Gateway possède la connectivité ; le worker ne nécessite rien d’autre que sshd :

- Le Gateway ouvre une connexion SSH vers le worker (identifiants provenant du bail du fournisseur, clé de l’hôte épinglée à partir de la sortie du provisionnement — aucun `StrictHostKeyChecking=no`) et établit un tunnel inverse qui transfère un socket local au worker vers le point de terminaison WS du Gateway.
- Le trafic de contrôle et de modèle ainsi que le transfert de l’espace de travail utilisent des connexions SSH distinctes avec les mêmes éléments de confiance épinglés, afin que rsync ne bloque pas les flux de jetons en tête de file.
- Le cycle de vie du tunnel (maintien de connexion, reconnexion avec temporisation exponentielle) appartient à l’environnement d’exécution sur le Gateway. Une interruption du tunnel est invisible au niveau de la session : l’état durable du protocole (ci-dessous) permet au worker de se rattacher et de reprendre l’exécution.

### 4. Protocole du worker (dédié ; distinct du protocole des Nodes)

L’examen contradictoire des interfaces actuelles des Nodes a exclu leur simple réutilisation : les appels de Node en attente sont des promesses locales au processus qui disparaissent avec la connexion, les clés d’idempotence des Nodes sont analysées mais pas dédupliquées et — point décisif — un Node connecté peut émettre des événements de Node ordinaires (y compris des demandes d’exécution d’agent). Ainsi, « type de Node + plafond de capacités » ne constitue pas une frontière de sécurité pour les entrées. Les workers disposent donc d’un rôle `worker` authentifié avec une liste fermée et versionnée de RPC et d’événements autorisés ; les connexions des workers ne peuvent accéder à aucun gestionnaire d’événements de Node historique.

Identité et identifiants : le provisionnement crée un identifiant de worker à courte durée de vie, lié à l’identifiant de l’environnement, à la clé du worker, au hachage du paquet, à l’unique session autorisée, à l’ensemble de RPC autorisé et à une date d’expiration. L’appariement vérifié par SSH s’applique toujours (nous avons provisionné la machine et détenons la clé), mais l’autorisation provient de l’identifiant créé, et non de la surface de Node déclarée.

Sémantique des opérations durables (forme inspirée de l’environnement d’exécution ACP existant et de son journal d’événements — identifiants stables, sérialisation par session, relecture durable de `(session, seq)`) :

- Chaque opération est délimitée par `(sessionId, lifecycleRevision, runId, ownerEpoch, streamKind, seq)`.
- Les époques de propriété écartent les workers obsolètes : un worker de remplacement avance l’époque ; les résultats tardifs de l’ancienne époque sont rejetés de manière déterministe.
- Livraison au moins une fois avec curseurs d’accusé de réception persistés et résultats terminaux mis en cache dans SQLite ; la déduplication est déterministe. Aucune garantie d’exécution exactement une fois.
- Trames explicites pour l’annulation, la fermeture, la reprise et les résultats terminaux ; contrôle de flux des flux fondé sur des crédits et des fenêtres.
- La négociation des fonctionnalités du protocole est indépendante de la version générale du protocole des Nodes.

### 5. RPC du moteur de session

Deux contrats distincts — la base de code actuelle sépare les mutations durables de la transcription (gérées par le gestionnaire de sessions, arbre JSONL avec état parent/feuille) des événements en direct locaux au processus (deltas de streaming, cycle de vie des outils, approbations), et le protocole du worker doit préserver cette séparation :

- Validations durables de la transcription : le worker soumet des lots d’ajouts sémantiques avec `runEpoch` + une opération de comparaison-échange sur la feuille de base ; le gestionnaire de sessions du Gateway génère les identifiants d’entrée et les identifiants parents. Le worker ne peut jamais fournir de lignes de transcription fiables, d’identifiants d’entrée, d’identifiants parents ni d’identifiants de sessions étrangères.
- Événements en direct rejouables : une union typée d’événements avec des numéros de séquence du worker, des ACK du Gateway, une rétention limitée et un cloisonnement des événements tardifs, alimentant la diffusion existante des événements de l’agent afin que la vue de discussion, les lignes d’outils et la logique de statut/non-lu se comportent de manière identique aux sessions locales.

Proxy d’inférence : réutiliser le vocabulaire d’événements du client de flux du proxy d’exécution existant (`src/agents/runtime/proxy.ts`), mais déplacer la frontière de confiance. Le worker envoie uniquement l’identité de la session/de l’exécution, une référence de modèle approuvée, le contexte et des options de génération contraintes ; le Gateway résout le fournisseur, le point de terminaison, l’authentification, les en-têtes, le routage et la politique de coûts à partir de son propre catalogue. Un objet de modèle fourni par le worker (par exemple un `baseUrl` contrôlé par un attaquant) est rejeté. Les limites de taille des requêtes, l’annulation, l’audit et le rejeu du résultat terminal s’appliquent. Les outils résidant sur le Gateway (websearch) s’exécutent sur le Gateway et renvoient les résultats par le même canal.

### 6. Synchronisation de l’espace de travail

Le point d’ancrage de la synchronisation est un espace de travail local au Gateway avec propriété exclusive du placement : pour les espaces de travail git, un worktree géré dédié (les métadonnées existantes du worktree géré — branche, base, propriété de l’instantané — constituent le fondement) ; pour les espaces de travail non-git, un répertoire cible appartenant au Gateway. Jamais le checkout actif de l’utilisateur. La propriété exclusive tant que la session est placée à distance rend la synchronisation entrante exempte de conflits par construction.

Répartition de la propriété — validation contre publication :

- L’agent côté worker crée normalement des commits dans sa copie (`git commit` est une opération locale, sans identifiants d’authentification ; l’identité de l’auteur est projetée depuis la configuration du Gateway). Ces commits restent des objets inertes jusqu’à leur adoption par le Gateway.
- Le Gateway effectue tout ce qui exige de la confiance : vérification que les commits entrants reposent sur la base enregistrée, avance rapide du worktree local, push, création de PR et signature/resignature facultative — le tout avec les identifiants d’authentification locaux au Gateway. Le worker ne détient jamais d’identifiants d’authentification git ou de forge et n’accède jamais à un dépôt distant.

Deux modes de synchronisation, sélectionnés selon que l’espace de travail est ou non un dépôt git :

- Mode git. Sortant : synchroniser le worktree avec rsync (y compris les fichiers non validés et les fichiers non suivis éligibles ; inclusions/exclusions de type crabbox, `.worktreeinclude` respecté) via l’identité SSH du tunnel, avec enregistrement sous forme de manifeste de base immuable (hachages de contenu + commit de base). Entrant : les nouveaux commits reviennent sous forme de bundle git ou de référence temporaire par rapport à la base enregistrée ; les artefacts non suivis reviennent via un manifeste explicite avec contrôles de taille, de type et de confinement des liens symboliques. L’adoption vérifie l’ascendance de la base et s’arrête en cas de divergence — rien n’écrase silencieusement l’un ou l’autre côté. Les suppressions, renommages, sous-modules et échappements par liens symboliques sont gérés par les règles du manifeste, et non par les heuristiques de rsync.
- Mode simple (sans git — par exemple, création d’un projet à partir de zéro sur la machine). Le flux sortant utilise les mêmes rsync + manifeste de base. Le flux entrant est un miroir calculé par différence de manifeste vers le répertoire cible appartenant au Gateway, avec propagation des suppressions. Ce mode est sûr pour la même raison que le mode git : la propriété exclusive signifie qu’aucune modification locale simultanée ne peut provoquer de conflit ; le manifeste de base détecte toujours toute dérive locale inattendue et s’arrête au lieu d’écraser.

Les points de contrôle protègent les sessions de plusieurs jours contre la perte du bail : points de contrôle entrants périodiques (commits de branche de session en mode git, instantanés de manifeste en mode simple) ; la cadence relève de la politique du profil (par défaut, selon les tours).

### 7. Machine à états du placement, sessions et interface utilisateur

Le placement à l’exécution est une machine à états appartenant à SQLite et liée à la session, et non une paire de champs de ligne indépendants :

`local → requested → provisioning → syncing → starting → active(worker) → draining → reconciling → local | reclaimed | failed`

Elle conserve l’identifiant d’environnement, la génération de transition, l’époque du propriétaire actif, le manifeste de base de l’espace de travail, le hachage du bundle du worker et les derniers curseurs ACK. L’admission d’un tour revendique atomiquement le placement avant que l’une ou l’autre boucle ne démarre un tour, de sorte qu’un message local admis à partir d’un instantané obsolète ne puisse jamais entrer en concurrence avec un tour du worker — une seule boucle est propriétaire de la session à tout moment.

Interface utilisateur :

- Une session de worker est une ligne de session ordinaire accompagnée de métadonnées de placement. Elle réside dans le stockage normal, est répertoriée via `sessions.list` et diffusée via les abonnements existants — la barre latérale et la discussion n’ont besoin d’aucun nouveau chemin de données, uniquement d’une présentation : un badge de worker et un statut de placement/environnement (`provisioning / syncing / running / idle / reconciling / reclaimed`).
- Expérience de création : la barre de cible de session (refonte de la barre latérale des sessions) ajoute une destination de worker cloud aux côtés du Gateway et du Node. Nécessite un profil de fournisseur configuré ; la fonctionnalité reste invisible tant qu’elle n’est pas configurée.
- Délégation par l’agent : un outil de session permet à un agent de confier du travail à un worker cloud comme le ferait un humain (sous-session adossée à un worker, à la manière d’un sous-agent). Livré dans le même jalon que la délégation humaine, sous le contrôle de la même configuration facultative du fournisseur. La récursion est limitée structurellement (les sessions de worker ne peuvent pas elles-mêmes déléguer à des workers dans la v1) ; le contrôle des dépenses repose sur la comptabilité et l’audit par environnement, et non sur un mécanisme de quotas.

## Délégation et transfert

La v1 est délibérément asymétrique :

- Local → worker (délégation) : franchir la barrière de migration ci-dessous, provisionner ou réutiliser un worker, synchroniser, basculer le placement ; le tour suivant s’exécute à distance.
- Worker → local (rapatriement) : arrêter la session (vider le worker conformément à la même barrière), terminer la réconciliation entrante, basculer le placement vers le local. Il ne s’agit pas d’une migration à chaud.
- Transfert à chaud symétrique (déplacer dans les deux sens une session en cours de travail sans l’arrêter) : réutilise la même barrière et le même mécanisme de réconciliation et sera livré après que des tests d’injection de pannes auront validé la barrière.

Barrière de migration (« limite de tour » seule est insuffisante — les approbations, les processus en arrière-plan et les fusions de transcription après libération d’un verrou peuvent la chevaucher) :

1. Arrêter l’admission de nouveaux tours (revendication du placement).
2. Annuler ou vider les exécutions actives.
3. Révoquer les approbations d’exécution et les autorisations d’exécution en attente.
4. Vider les écritures latérales de transcription et les ACK d’événements en direct.
5. Terminer les processus enfants du worker.
6. Cloisonner l’ancien propriétaire en avançant l’époque du propriétaire.
7. Réconcilier l’espace de travail (entrant, avec gestion des conflits).
8. Activer le nouveau propriétaire.

Affinité du cache : puisque les requêtes au fournisseur proviennent du Gateway dans les deux placements, l’affinité du cache est préservée lorsque la requête sérialisée au fournisseur reste équivalente — même ordre des outils, mêmes instructions système, mêmes enveloppes du fournisseur et mêmes métadonnées de cache (qui restent côté Gateway). Il s’agit d’une propriété testable, et non d’une hypothèse : des tests d’équivalence octet par octet entre les placements local/worker pour chaque transport de fournisseur pris en charge font partie du jalon qui introduit la boucle du worker.

## Modèle de sécurité

Formulation précise : le worker ne dispose d’aucune sortie réseau directe ni d’identifiants d’authentification permanents de fournisseur/forge. Il ne s’agit pas d’une « absence totale de sortie » — l’inférence et les outils exécutés par le Gateway constituent des canaux de sortie contrôlés (un worker victime d’une injection de prompt peut toujours placer des octets de l’espace de travail dans le contexte du modèle ou dans des requêtes websearch). En conséquence :

- Comptabilisation des sorties contrôlées : audit par environnement et comptabilisation visible par l’opérateur sur le proxy d’inférence et les outils du Gateway. Les limites de débit/d’octets existent en tant que contrôle de flux du protocole (capacité), et non comme mécanisme de quota de dépenses.
- Le trafic entrant du worker vers le Gateway est limité à la liste fermée des opérations autorisées du protocole du worker ; les écritures de transcription sont contraintes structurellement (identifiants générés par le Gateway, une seule session liée).
- L’exécution du worker dispose de toutes les autorisations dans la machine. La machine est jetable et dépourvue d’identifiants d’authentification ; une approbation par commande ajouterait donc de la friction sans rien protéger. La frontière protégée est la réconciliation entrante et l’audit. L’exécution ne passe jamais par le chemin d’approbation du Node du Gateway.
- La politique Internet est une décision du fournisseur prise au moment du provisionnement : le profil d’environnement en décide lors de la création de la machine (pare-feu/groupe de sécurité/réseau sans sortie), avec éventuellement une phase de configuration en réseau que le fournisseur ferme avant la phase de l’agent. Le cœur n’implémente pas de commutateur réseau à l’exécution.
- Hygiène de la machine lors du provisionnement : point de terminaison des métadonnées cloud bloqué ou vérifié comme absent, aucun profil d’instance, aucun agent SSH hérité, aucun socket Docker, environnement/répertoire personnel propres. Les clés d’hôte SSH sont épinglées à partir de la sortie du provisionnement.
- Les approbations et la politique pour tout ce qui s’effectue côté Gateway (push, PR, appels au fournisseur) continuent de s’exécuter sur le Gateway.

Rayon d’impact d’une session de worker compromise : la copie synchronisée de l’espace de travail ainsi que ce qu’autorisent les canaux de proxy audités — aucun identifiant d’authentification, aucun réseau direct, aucune surface du Gateway au-delà de la liste des opérations autorisées.

## Capacité

Le Gateway relaie chaque prompt et chaque flux de tokens pour N workers ; la v1 définit donc un modèle de capacité plutôt que de le découvrir en production : limites de workers simultanés par Gateway, fenêtres de crédit par flux (la file actuelle du flux d’événements est non bornée et le plafond du tampon de socket du Node force la fermeture pour les consommateurs lents — les deux sont impropres à une utilisation sans modification), stockage tampon sur disque borné pour les pics et délestage avec états de contre-pression visibles dans l’interface utilisateur. Le transfert de l’espace de travail reste sur son propre canal SSH.

## Cycle de vie

- L’arrêt automatique en cas d’inactivité et la TTL relèvent de la politique du profil de fournisseur, et non de constantes fixes. Les valeurs par défaut sont généreuses avec un maintien en vie explicite ; les travaux de plusieurs jours sont pris en charge nativement (le fournisseur expose `renew` pour les backends fondés sur des baux) ; une session avec un tour en cours ou une activité récente n’est jamais récupérée.
- En cas de mort ou de récupération du worker : le placement passe à `reclaimed`, la ligne de session demeure, le message suivant provisionne un nouveau worker et resynchronise à partir du dernier point de contrôle. La conversation n’est jamais perdue (stockage côté Gateway) ; les modifications de l’espace de travail depuis le dernier point de contrôle sont perdues et l’interface utilisateur l’indique.
- Réutilisation des baux chauds dès le premier jour (pour les fournisseurs qui la prennent en charge) ; l’instantané d’image après l’amorçage constitue le chemin de démarrage rapide de la v2.

## Surface de configuration

Minimale et facultative : un bloc de profil de fournisseur (identifiant du fournisseur, identifiants d’authentification/référence CLI, règles de synchronisation, politique de durée de vie, budgets, phase de configuration facultative) ainsi qu’une sélection du placement par session. Aucune nouvelle variable d’environnement. Les installations non configurées ne voient rien.

## Jalons

L’implémentation est livrée sous forme de petites PR pouvant être fusionnées indépendamment ; chaque jalon ci-dessous correspond à une série de PR, et non à une seule modification.

1. Fondations : machine à états de l’environnement + contrat du fournisseur + fournisseur de forme crabbox (SSH statique comme banc de développement), amorçage du bundle du worker + négociation d’admission, tunnel SSH + épinglage de la clé d’hôte, instantané du worktree géré + synchronisation sortante (modes git + simple). Nettoyage des orphelins + adoption après redémarrage.
2. Protocole du worker + boucle du worker : rôle de worker authentifié, opérations durables/époques/curseurs ACK, contrats de validation de transcription + événements en direct, proxy d’inférence avec modèles résolus par le Gateway, contrôle de flux. Un fournisseur, délégation humaine de nouvelles sessions uniquement, aucun transfert. Des tests d’injection de pannes (partition du tunnel, redémarrage du Gateway, mort du worker) conditionnent la sortie du jalon.
3. Délégation + rapatriement + délégation par l’agent : barrière de migration, machine à états du placement reliée à la barre de cible de l’interface utilisateur, réconciliation entrante + points de contrôle, audit par environnement, limites de capacité, outil de délégation par l’agent (les sessions de worker ne peuvent pas récursivement en créer d’autres). Tests d’équivalence octet par octet du cache de prompts.
4. Transfert à chaud symétrique, après validation du jalon 3 par injection de pannes.

Ultérieurement : bancs ACP sur les workers avec hydratation facultative des identifiants d’authentification par environnement ; démarrage rapide par instantané/image chaude ; diffusion en éventail (N baux, même prompt) ; sandboxing du système d’exploitation dans la machine ; capture d’artefacts enrichie via le schéma des artefacts.

## Questions ouvertes

- Disponibilité des Plugins/Skills sur les workers : les Skills inclus dans le dépôt sont synchronisés gratuitement avec l’espace de travail ; les Skills/Plugins d’agent configurés dans le Gateway nécessitent une décision explicite de synchronisation ou d’exclusion (dans les deux cas, le manifeste de l’outil/du Plugin fait partie de la négociation d’admission).
- Cadence par défaut des points de contrôle : basée sur les tours ou sur le temps pour les sessions très bavardes.
- Interaction des profils d’environnement avec le routage multi-agent (profils par défaut propres à chaque agent ou sélection uniquement par session).
