---
read_when:
    - Conception ou mise en œuvre du provisionnement de workers cloud, du mode worker ou du transfert de session
    - Modification de environments.*, du protocole des workers, de l’ingestion des transcriptions ou des RPC du proxy d’inférence
    - Examen de la posture de sécurité de l’exécution d’agents à distance
summary: Exécutez des sessions d’agent sur des machines éphémères accessibles en SSH, avec une inférence relayée par le Gateway et une diffusion en direct dans la barre latérale.
title: Plan des workers cloud
x-i18n:
    generated_at: "2026-07-12T02:47:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 134c3f6e486837607225d95d12a3153525b14237b362b9f9957313d9bc379dc4
    source_path: plan/cloud-workers.md
    workflow: 16
---

## Statut

Proposition, révision 3. Non implémentée. Orientation approuvée en 2026-07 ; la révision 2 intégrait les conclusions de l’examen contradictoire (protocole dédié aux workers, machines à états de placement et d’environnement, synchronisation entrante tenant compte de git, transfert v1 unidirectionnel, formulation de sécurité sur la sortie contrôlée). La révision 3 arrête le modèle de responsabilité de la synchronisation (le worker crée les commits, le Gateway les adopte et les publie), ajoute un mode de synchronisation simple sans git, corrige l’exécution sur le worker afin qu’elle soit complète à l’intérieur de la machine, déplace la politique Internet au moment du provisionnement et rétablit l’envoi de l’agent au jalon 3.

## Problème

Les sessions d’agent OpenClaw exécutent leur boucle, leurs outils et l’inférence dans le processus du Gateway sur une seule machine. La capacité de calcul est limitée par cette machine, les tâches longues l’occupent et les travaux parallèles se disputent ses ressources. Les produits hébergés (agents cloud Cursor, Claude Code sur le Web, Codex cloud) résolvent ce problème avec des environnements cloud éphémères par tâche, mais ils exigent l’infrastructure et la confiance d’un fournisseur.

Les opérateurs qui possèdent déjà des machines inutilisées (ou peuvent en louer à faible coût) ne disposent d’aucun moyen pour demander : exécuter cette session là-bas, l’afficher dans ma barre latérale comme n’importe quelle autre session, puis supprimer la machine une fois le travail terminé.

## Objectifs

- Exécuter une session d’agent complète (boucle + outils) sur une machine distante éphémère (« worker cloud »), tandis que la session apparaît et diffuse son activité dans l’interface de contrôle exactement comme une session locale.
- Aucun identifiant permanent sur le worker (ni authentification auprès du fournisseur, ni jeton de forge) et aucune sortie réseau directe ; la machine nécessite seulement un serveur sshd accessible.
- Provisionner, synchroniser, exécuter, collecter, détruire — de manière entièrement automatisée et avec des fournisseurs interchangeables (premier fournisseur : CLI de location de type Crabbox).
- Transférer un travail en cours du Gateway vers un worker à la frontière d’un tour sans perdre la transcription, l’identité de la session ni, lorsque les octets de la requête restent équivalents, l’affinité avec le cache du fournisseur ; récupérer les résultats en toute sécurité.
- Permettre aux humains (interface utilisateur) comme aux agents (outil) de transférer le travail vers un worker cloud.
- Prendre en charge les sessions de plusieurs jours ; la durée de vie relève d’une politique et non d’une limite codée en dur.

## Hors objectifs (v1)

- Aucun environnement de codage externe (Claude Code, Codex CLI) sur les workers. Les sessions de worker exécutent uniquement le moteur intégré d’OpenClaw. La prise en charge de tels environnements sera une option explicite en v2, car ils effectuent leur propre inférence avec leurs propres identifiants.
- Aucune distribution en éventail de tentatives parallèles ou de type meilleur parmi N.
- Aucune dépendance à un VPN ou à un réseau privé. Le transport repose uniquement sur SSH.
- Aucun nouvel environnement d’isolation. La machine worker constitue la frontière d’isolation ; une isolation supplémentaire au niveau du système d’exploitation interne pourra être ajoutée ultérieurement.
- Aucune migration dynamique symétrique en v1 : le transfert s’effectue du système local vers le worker ; le retour du worker vers le système local exige une session arrêtée et une réconciliation terminée de l’espace de travail. Un transfert bidirectionnel dynamique pourra ultérieurement s’appuyer sur les mêmes mécanismes de barrière.
- Aucun état secondaire JSON sur le Gateway ; les états d’environnement, de placement, de curseur et d’autorisation résident dans SQLite.

## Travaux antérieurs (ce que nous reprenons et ce que nous inversons)

- Agents cloud Cursor : la boucle de l’agent s’exécute dans leur cloud ; la machine virtuelle est une cible d’exécution des outils ; un stockage de conversation uniquement extensible est diffusé à tous les clients ; un instantané après installation permet un démarrage à chaud ; les workers auto-hébergés sont des processus worker à connexions sortantes uniquement. Nous reprenons le modèle de diffusion et le principe selon lequel la source de vérité de la conversation demeure sur l’orchestrateur ; nous inversons le placement de la boucle (voir la décision ci-dessous).
- Codex cloud : environnement d’exécution en deux phases — phase de configuration connectée au réseau, puis phase d’agent hors ligne dont les secrets ont été retirés ; cache de l’état du conteneur pour accélérer les reprises. Nous reprenons la séparation des phases comme stratégie de sortie réseau ainsi que l’idée de cache pour les images chaudes de la v2.
- Claude Code sur le Web : machine virtuelle par session ; proxy git isolant les identifiants (les véritables jetons n’entrent jamais dans l’environnement isolé, et l’envoi est limité à la branche de la session) ; instantané du système de fichiers après la configuration ; transfert par téléportation = branche envoyée + historique rejoué. Nous reprenons l’isolation des identifiants et le modèle de transfert, mais la synchronisation sortante s’effectue par rsync depuis le Gateway afin de prendre en charge les arborescences de travail contenant des modifications non validées et de garantir qu’aucun jeton de forge ne se trouve à proximité de la machine.
- Agent de codage Copilot : sortie réseau interdite par défaut avec liste d’autorisation pour les registres de paquets. Notre valeur par défaut en régime permanent est plus stricte (aucune sortie directe), car l’inférence et la recherche Web transitent par le tunnel SSH — mais voir Sécurité pour comprendre pourquoi il s’agit d’une « sortie contrôlée » et non d’une « absence totale de sortie ».

## Décision d’architecture : boucle sur le worker, inférence via le Gateway

Trois placements ont été envisagés :

1. La boucle reste sur le Gateway, le worker exécute les outils (modèle Cursor). Il s’agit du domaine de défaillance le plus sûr (la transcription, l’inférence, les approbations et la récupération après redémarrage restent toutes locales) et du premier jalon privilégié par un examinateur. Rejeté comme architecture du produit : les outils d’OpenClaw autres que ceux d’exécution effectuent des opérations sur le système de fichiers au sein du processus, de sorte que chaque lecture, modification ou recherche de fichier deviendrait un aller-retour réseau ou nécessiterait une refonte importante de la surface des outils en RPC d’espace de travail à granularité élevée ; le comportement d’exécution est bavard et limité par la latence. Nous en reprenons l’esprit là où il est déjà implémenté (déport de l’exécution vers les Nodes), mais nous ne construisons pas la couche de déport des outils.
2. La boucle et l’inférence s’exécutent toutes deux sur le worker. Il s’agit du domaine de défaillance le plus simple, mais les identifiants du modèle (y compris les profils OAuth) doivent être transmis à des machines jetables, le Gateway perd le contrôle de la politique, du routage et de l’audit, et la migration modifie l’identité appelant le fournisseur, ce qui invalide les caches de celui-ci.
3. La boucle et les outils s’exécutent sur le worker, tandis que les appels au modèle sont transmis par le Gateway. Option retenue. Un aller-retour par tour du modèle au lieu d’un par appel d’outil ; les outils s’exécutent à proximité du code ; le Gateway reste l’unique propriétaire des profils d’authentification, du routage des fournisseurs et de la politique ; le worker ne détient aucun secret.

Le coût de l’option 3 réside dans une dépendance synchrone au Gateway pendant chaque tour du modèle ; ses règles de durabilité font donc partie intégrante de la décision et ne constituent pas un ajout ultérieur :

- Une perte du Gateway au milieu d’un tour fait échouer l’appel actif au fournisseur. Le tour est marqué comme ayant échoué et réessayé en tant que nouveau tour après la reconnexion ; aucun rejeu transparent d’un flux fournisseur en cours n’est effectué, en raison du risque de double facturation ou de double appel d’outil.
- Chaque opération entre le worker et le Gateway comporte une identité durable (voir Protocole du worker), afin que les reconnexions reprennent les opérations ou récupèrent les résultats terminaux mis en cache au lieu de les laisser en suspens.
- Le Gateway est un composant dont la capacité est gérée : les limites de workers simultanés, le contrôle de flux et la réduction de charge font partie du périmètre de la v1 (voir Capacité).

Puisque le Gateway stocke à la fois la transcription et émet tout le trafic vers les fournisseurs, la session est indépendante de son emplacement : déplacer la boucle entre le Gateway et le worker ne change rien du côté du fournisseur ni dans le chemin de données de l’interface utilisateur. C’est ce qui rend le transfert et le rapatriement peu coûteux.

## Composants

### 1. Machine à états de l’environnement + contrat du fournisseur

`environments.*` dans le protocole du Gateway ne constitue actuellement qu’une projection d’état. Le noyau durable est un enregistrement d’environnement appartenant à SQLite et une machine à états, conçus avant les formes RPC :

`requested → provisioning → bootstrapping → ready → (attached|idle) → draining → destroying → destroyed | failed | orphaned`

- Le provisionnement résiste aux défaillances : la ligne d’intention est persistée avant l’appel au fournisseur, avec un identifiant d’opération déterministe, afin qu’un redémarrage du Gateway puisse reprendre une location en cours plutôt que de provisionner deux fois ou d’abandonner une machine payante.
- La réconciliation après redémarrage et un nettoyeur d’éléments orphelins (`inspect` du fournisseur comparé aux enregistrements locaux) sont des exigences de la v1 et non de simples mesures de durcissement.

Contrat du fournisseur (implémenté par un Plugin ; aucun nom de fournisseur ni aucune politique dans le noyau) :

```ts
type WorkerProvider = {
  id: string;
  provision(profile: WorkerProfile, opId: string): Promise<WorkerLease>; // → ssh host/port/user/key material
  inspect(lease: { leaseId: string; profile: WorkerProfile }): Promise<LeaseStatus>; // adopt/health/orphan sweep
  renew?(leaseId: string): Promise<void>; // long-lived sessions vs provider TTLs
  destroy(lease: { leaseId: string; profile: WorkerProfile }): Promise<void>; // idempotent, returns only on proof of teardown
};
```

RPC : `environments.create`, `environments.destroy`, ainsi que `environments.list/status` étendus (fournisseur, identifiant de location, état, âge, durée d’inactivité, sessions attachées). Premiers fournisseurs : un adaptateur de CLI de location de forme Crabbox (parcours produit) et un fournisseur d’hôte SSH statique marqué comme réservé au développement — un worker sur un hôte partagé peut lire des données non liées de l’hôte ; les hôtes statiques sont donc destinés au développement de la fonctionnalité et ne constituent pas la stratégie par défaut.

### 2. Amorçage du worker : installer OpenClaw sur la machine

Aucun artefact de worker spécifique et aucune dépendance à la disponibilité de npm :

- Installation canonique pour tous les modes : un paquet de worker produit par le Gateway et identifié par une empreinte de contenu (la propre sortie de compilation du Gateway empaquetée sous forme d’archive tar), envoyé via SSH et installé sur la machine. Cela prend en charge par construction les versions de développement et les commits non publiés.
- `npm i -g openclaw@<exact gateway version>` constitue une optimisation lorsque le Gateway exécute une version publiée ; jamais `latest`.
- L’amorçage est idempotent ; une location chaude dont l’empreinte de paquet correspond ignore l’installation. Les machines brutes peuvent nécessiter une phase d’installation de la chaîne d’outils avec accès au réseau (environnement d’exécution Node) — celle-ci fait partie de la phase de configuration, puis l’accès est fermé.
- La négociation initiale vérifie l’empreinte de compilation du worker, l’ensemble des fonctionnalités du protocole et la compatibilité de l’environnement d’exécution. Les vérifications existantes de version et de protocole du Gateway sont insuffisantes à cette fin (les Nodes connectés par tunnel SSH sont exemptés du rejet fondé sur une correspondance exacte des versions) ; l’admission du worker effectue donc sa propre vérification de compilation exacte.

Le mode worker (`openclaw worker`) est un point d’entrée et non une bifurcation : gestion de la connexion et moteur d’agent intégré, avec persistance de la session et appels au modèle assurés par les RPC du Gateway. Il ne doit démarrer aucune surface du Gateway : aucun canal, aucun démarrage automatique de Plugin au-delà de l’ensemble d’outils de la session, répertoire d’état jetable et aucun profil d’authentification local.

### 3. Transport : tout via SSH

Le Gateway gère la connectivité ; le worker n’exige rien d’autre qu’un serveur sshd :

- Le Gateway ouvre une connexion SSH vers le worker (identifiants provenant de la location du fournisseur, clé d’hôte épinglée à partir de la sortie du provisionnement — aucun `StrictHostKeyChecking=no`) et établit un tunnel inverse qui transfère un socket local au worker vers le point de terminaison WS du Gateway.
- Le trafic de contrôle et de modèle ainsi que le transfert de l’espace de travail utilisent des connexions SSH distinctes partageant les mêmes éléments de confiance épinglés, afin que rsync ne puisse pas bloquer les flux de jetons en tête de file.
- Le cycle de vie du tunnel (maintien de connexion, reconnexion avec temporisation progressive) appartient à l’environnement d’exécution de l’environnement sur le Gateway. Une interruption momentanée du tunnel est invisible au niveau de la session : l’état durable du protocole (ci-dessous) permet au worker de se rattacher et de reprendre.

### 4. Protocole du worker (dédié ; distinct du protocole des Nodes)

L’examen contradictoire des interfaces actuelles des Nodes a exclu leur simple réutilisation : les appels de Node en attente sont des promesses locales au processus qui disparaissent avec la connexion, les clés d’idempotence des Nodes sont analysées mais ne font pas l’objet d’une déduplication et — point décisif — un Node connecté peut émettre des événements ordinaires de Node (y compris des demandes d’exécution d’agent), de sorte que « type de Node + plafond de capacités » ne constitue pas une frontière de sécurité pour les entrées. Les workers disposent donc d’un rôle `worker` authentifié avec une liste d’autorisation fermée et versionnée de RPC et d’événements ; les connexions de worker ne peuvent atteindre aucun gestionnaire d’événements historique des Nodes.

Identité et identifiants : le provisionnement génère un identifiant de worker à courte durée de vie, lié à l’identifiant de l’environnement, à la clé du worker, à l’empreinte du paquet, à l’unique session autorisée, à l’ensemble de RPC autorisé et à une date d’expiration. L’association vérifiée par SSH continue de s’appliquer (nous avons provisionné la machine et détenons la clé), mais l’autorisation provient de l’identifiant généré et non de la surface de Node déclarée.

Sémantique durable des opérations (forme empruntée à l’environnement d’exécution ACP existant et à son journal d’événements — identifiants stables, sérialisation par session, rejeu durable de `(session, seq)`) :

- Chaque opération est délimitée par `(sessionId, lifecycleRevision, runId, ownerEpoch, streamKind, seq)`.
- Les époques de propriété isolent les workers obsolètes : un worker de remplacement avance l’époque ; les résultats tardifs de l’ancienne époque sont rejetés de manière déterministe.
- Livraison au moins une fois, avec curseurs d’accusé de réception persistés et résultats terminaux mis en cache dans SQLite ; la déduplication est déterministe. Aucune garantie d’exécution exactement une fois.
- Trames explicites pour l’annulation, la fermeture, la reprise et les résultats terminaux ; contrôle de flux des flux fondé sur des crédits ou une fenêtre.
- La négociation des fonctionnalités du protocole est indépendante de la version générale du protocole des Nodes.

### 5. RPC du moteur de session

Deux contrats distincts — le code actuel sépare les mutations durables de la transcription (gérées par le gestionnaire de sessions, arbre JSONL avec état parent/feuille) des événements actifs locaux au processus (deltas de streaming, cycle de vie des outils, approbations), et le protocole du worker doit préserver cette séparation :

- Validations durables de la transcription : le worker soumet des lots d’ajouts sémantiques avec `runEpoch` et une opération de comparaison-échange sur la feuille de base ; le gestionnaire de sessions du Gateway génère les identifiants d’entrée et les identifiants parents. Le worker ne peut jamais fournir de lignes de transcription fiables, d’identifiants d’entrée, d’identifiants parents ni d’identifiants de sessions étrangères.
- Événements actifs rejouables : une union typée d’événements avec des numéros de séquence du worker, des accusés de réception du Gateway, une conservation bornée et une mise à l’écart des événements tardifs, alimentant la diffusion existante des événements d’agent afin que la vue de discussion, les lignes d’outils et la logique de statut/non-lu se comportent exactement comme pour les sessions locales.

Proxy d’inférence : réutiliser le vocabulaire d’événements du client de flux du proxy d’exécution existant (`src/agents/runtime/proxy.ts`), mais déplacer la frontière de confiance. Le worker envoie uniquement l’identité de la session et de l’exécution, une référence de modèle approuvée, le contexte et des options de génération contraintes ; le Gateway résout le fournisseur, le point de terminaison, l’authentification, les en-têtes, le routage et la politique de coûts à partir de son propre catalogue. Un objet de modèle fourni par le worker (par exemple un `baseUrl` contrôlé par un attaquant) est rejeté. Les limites de taille des requêtes, l’annulation, l’audit et le rejeu du résultat terminal s’appliquent. Les outils résidant sur le Gateway (recherche web) s’exécutent sur le Gateway et renvoient leurs résultats par le même canal.

### 6. Synchronisation de l’espace de travail

Le point d’ancrage de la synchronisation est un espace de travail local au Gateway dont le placement est détenu exclusivement : pour les espaces de travail git, un worktree géré dédié (les métadonnées existantes du worktree géré — branche, base, propriété de l’instantané — en constituent le fondement) ; pour les espaces de travail non git, un répertoire cible détenu par le Gateway. Jamais le checkout actif de l’utilisateur. La propriété exclusive pendant que la session est placée à distance rend la synchronisation entrante exempte de conflits par construction.

Répartition des responsabilités — validation contre publication :

- L’agent côté worker crée normalement des commits dans sa copie (`git commit` est une opération locale ne nécessitant aucun identifiant d’accès ; l’identité de l’auteur est projetée depuis la configuration du Gateway). Ces commits restent des objets inertes jusqu’à leur adoption par le Gateway.
- Le Gateway effectue tout ce qui exige de la confiance : vérification que les commits entrants reposent sur la base enregistrée, avance rapide du worktree local, push, création de PR et signature ou nouvelle signature facultative — le tout avec des identifiants d’accès locaux au Gateway. Le worker ne détient jamais d’identifiants d’accès git ou de forge et n’accède jamais à un dépôt distant.

Deux modes de synchronisation, sélectionnés selon que l’espace de travail est ou non un dépôt git :

- Mode git. Sortant : synchroniser le worktree avec rsync (y compris les fichiers non validés et les fichiers non suivis admissibles ; inclusions/exclusions de type crabbox, respect de `.worktreeinclude`) via l’identité SSH du tunnel, puis l’enregistrer sous forme de manifeste de base immuable (hachages de contenu et commit de base). Entrant : les nouveaux commits reviennent sous forme de bundle git ou de référence temporaire par rapport à la base enregistrée ; les artefacts non suivis reviennent au moyen d’un manifeste explicite soumis à des contrôles de taille, de type et de confinement des liens symboliques. L’adoption vérifie l’ascendance de la base et s’arrête en cas de divergence — rien n’écrase silencieusement l’un ou l’autre côté. Les suppressions, renommages, sous-modules et échappements par liens symboliques sont traités par les règles du manifeste, et non par des heuristiques rsync.
- Mode simple (sans git — par exemple lors de la création d’un projet à partir de zéro sur la machine). Le flux sortant utilise le même rsync et le même manifeste de base. Le flux entrant est un miroir, calculé par différence de manifestes, vers le répertoire cible détenu par le Gateway, avec propagation des suppressions. Ce mode est sûr pour la même raison que le mode git : la propriété exclusive garantit l’absence de modifications locales concurrentes susceptibles d’entrer en conflit ; le manifeste de base détecte toujours toute dérive locale inattendue et interrompt l’opération au lieu d’écraser les données.

Les points de contrôle protègent les sessions de plusieurs jours contre la perte du bail : points de contrôle entrants périodiques (commits sur une branche de session en mode git, instantanés de manifeste en mode simple) ; la fréquence relève de la politique du profil (par défaut, fondée sur les tours).

### 7. Machine à états du placement, sessions et interface utilisateur

Le placement d’exécution est une machine à états gérée dans SQLite et rattachée à la session, et non une paire de champs de ligne indépendants :

`local → requested → provisioning → syncing → starting → active(worker) → draining → reconciling → local | reclaimed | failed`

Elle conserve l’identifiant d’environnement, la génération de transition, l’époque du propriétaire actif, le manifeste de base de l’espace de travail, le hachage du bundle du worker et les derniers curseurs d’accusé de réception. L’admission d’un tour revendique atomiquement le placement avant que l’une ou l’autre boucle ne commence un tour ; ainsi, un message local admis à partir d’un instantané obsolète ne peut jamais entrer en concurrence avec un tour du worker — une seule boucle possède la session à un instant donné.

Interface utilisateur :

- Une session de worker est une ligne de session ordinaire accompagnée de métadonnées de placement. Elle réside dans le stockage normal, est répertoriée par `sessions.list` et transmise en continu par les abonnements existants — la barre latérale et la discussion ne nécessitent aucun nouveau chemin de données, seulement une présentation : un badge de worker et un statut de placement/environnement (`provisioning / syncing / running / idle / reconciling / reclaimed`).
- Expérience de création : la barre de cible de session (nouvelle conception de la barre latérale des sessions) ajoute une destination de worker cloud aux côtés du Gateway et du Node. Nécessite un profil de fournisseur configuré ; la fonctionnalité reste invisible tant qu’elle n’est pas configurée.
- Délégation par l’agent : un outil de session permet à un agent de confier un travail à un worker cloud comme le ferait un humain (sous-session adossée à un worker, à la manière d’un sous-agent). Cette fonctionnalité est livrée dans le même jalon que la délégation humaine et protégée par la même configuration facultative du fournisseur. La récursivité est bornée structurellement (les sessions de worker ne peuvent pas elles-mêmes déléguer à des workers dans la v1) ; le contrôle des dépenses repose sur la comptabilité et l’audit par environnement, et non sur un mécanisme de quotas.

## Délégation et transfert

La v1 est délibérément asymétrique :

- Local → worker (délégation) : franchir la barrière de migration ci-dessous, provisionner ou réutiliser un worker, synchroniser, basculer le placement ; le tour suivant s’exécute à distance.
- Worker → local (rapatriement) : arrêter la session (vider le worker selon la même barrière), terminer la réconciliation entrante, basculer le placement vers le mode local. Il ne s’agit pas d’une migration en direct.
- Transfert en direct symétrique (déplacement dans les deux sens d’une session en cours de travail sans l’arrêter) : réutilise les mêmes mécanismes de barrière et de réconciliation et sera livré après que des tests d’injection de pannes auront validé la barrière.

Barrière de migration (la seule « limite de tour » ne suffit pas — les approbations, les processus en arrière-plan et les fusions de transcription après libération de verrous peuvent la chevaucher) :

1. Interrompre l’admission de nouveaux tours (revendication du placement).
2. Annuler ou vider les exécutions actives.
3. Révoquer les approbations d’exécution et les autorisations d’exécution en attente.
4. Vider les écritures secondaires de transcription et les accusés de réception des événements actifs.
5. Terminer les processus enfants du worker.
6. Mettre à l’écart l’ancien propriétaire en faisant progresser son époque.
7. Réconcilier l’espace de travail (flux entrant, avec gestion des conflits).
8. Activer le nouveau propriétaire.

Affinité du cache : comme les requêtes au fournisseur proviennent du Gateway dans les deux placements, l’affinité du cache est préservée lorsque la requête sérialisée au fournisseur reste équivalente — même ordre des outils, mêmes instructions système, mêmes enveloppes du fournisseur et mêmes métadonnées de cache (qui restent côté Gateway). Il s’agit d’une propriété testable, et non d’une hypothèse : des tests d’équivalence octet par octet entre les placements local et worker, pour chaque transport de fournisseur pris en charge, font partie du jalon qui introduit la boucle du worker.

## Modèle de sécurité

Formulation précise : le worker ne dispose d’aucune sortie réseau directe ni d’aucun identifiant d’accès permanent au fournisseur ou à la forge. Il ne s’agit pas d’une « absence totale de sortie » — l’inférence et les outils exécutés par le Gateway constituent des canaux de sortie contrôlés (un worker soumis à une injection de prompt peut tout de même placer des octets de l’espace de travail dans le contexte du modèle ou dans des requêtes de recherche web). En conséquence :

- Comptabilisation des sorties contrôlées : audit par environnement et comptabilisation visible par l’opérateur sur le proxy d’inférence et les outils du Gateway. Les limites de débit et d’octets relèvent du contrôle de flux du protocole (capacité), et non d’un mécanisme de quotas de dépenses.
- Le trafic entrant du worker vers le Gateway est limité à la liste d’autorisation fermée du protocole du worker ; les écritures de transcription sont contraintes structurellement (identifiants générés par le Gateway, une seule session liée).
- L’exécution sur le worker dispose de toutes les autorisations au sein de la machine. La machine étant jetable et dépourvue d’identifiants d’accès, une approbation par commande ajouterait de la friction sans rien protéger ; la frontière protégée est la réconciliation entrante et l’audit. L’exécution ne passe jamais par le chemin d’approbation des Nodes du Gateway.
- La politique Internet est une décision du fournisseur prise lors du provisionnement : le profil d’environnement la définit à la création de la machine (pare-feu/groupe de sécurité/réseau sans sortie), éventuellement avec une phase de configuration connectée que le fournisseur ferme avant la phase de l’agent. Le cœur n’implémente pas de commutateur réseau à l’exécution.
- Hygiène de la machine lors du provisionnement : point de terminaison des métadonnées cloud bloqué ou dont l’absence est vérifiée, aucun profil d’instance, aucun agent SSH hérité, aucune socket Docker, environnement et répertoire personnel propres. Les clés d’hôte SSH sont épinglées à partir de la sortie du provisionnement.
- Les approbations et politiques concernant tout ce qui se trouve côté Gateway (push, PR, appels au fournisseur) continuent de s’exécuter sur le Gateway.

Périmètre d’impact d’une session de worker compromise : la copie synchronisée de l’espace de travail ainsi que ce que permettent les canaux de proxy audités — aucun identifiant d’accès, aucun réseau direct, aucune surface du Gateway au-delà de la liste d’autorisation.

## Capacité

Le Gateway relaie chaque prompt et chaque flux de jetons pour N workers ; la v1 définit donc un modèle de capacité au lieu de le découvrir en production : limites du nombre de workers simultanés par Gateway, fenêtres de crédit par flux (la file d’attente actuelle du flux d’événements n’est pas bornée et le plafond du tampon de socket du Node entraîne la fermeture forcée des consommateurs lents — ces deux mécanismes ne conviennent pas sans modification), mise en file d’attente sur disque bornée pour absorber les pointes et délestage de charge avec des états de contre-pression visibles dans l’interface utilisateur. Le transfert de l’espace de travail conserve son propre canal SSH.

## Cycle de vie

- L’arrêt automatique en cas d’inactivité et la durée de vie relèvent de la politique du profil du fournisseur, et non de constantes fixes. Les valeurs par défaut sont généreuses et comportent un maintien en vie explicite ; les travaux de plusieurs jours sont pleinement pris en charge (le fournisseur expose `renew` pour les infrastructures fondées sur des baux) ; une session comportant un tour en cours ou une activité récente n’est jamais récupérée.
- En cas de mort ou de récupération du worker : le placement passe à `reclaimed`, la ligne de session demeure, le message suivant provisionne un nouveau worker et resynchronise depuis le dernier point de contrôle. La conversation n’est jamais perdue (stockage côté Gateway) ; les modifications de l’espace de travail postérieures au dernier point de contrôle sont perdues et l’interface utilisateur l’indique.
- Réutilisation des baux encore actifs dès le premier jour (pour les fournisseurs qui la prennent en charge) ; l’instantané d’image après l’amorçage constitue le mécanisme de démarrage rapide de la v2.

## Surface de configuration

Minimale et facultative : un bloc de profil de fournisseur (identifiant du fournisseur, identifiants d’accès/référence CLI, règles de synchronisation, politique de durée de vie, budgets, phase de configuration facultative), ainsi qu’une sélection du placement par session. Aucune nouvelle variable d’environnement. Les installations non configurées ne voient rien.

## Jalons

L’implémentation est livrée sous forme de petites PR pouvant être fusionnées indépendamment ; chaque jalon ci-dessous correspond à une série de PR, et non à une modification unique.

1. Fondations : machine à états de l’environnement, contrat du fournisseur et fournisseur conforme au modèle crabbox (SSH statique comme banc de développement), amorçage du bundle du worker et négociation d’admission, tunnel SSH et épinglage de la clé d’hôte, instantané du worktree géré et synchronisation sortante (modes git et simple). Nettoyage des orphelins et reprise après redémarrage.
2. Protocole et boucle du worker : rôle de worker authentifié, opérations durables/époques/curseurs d’accusé de réception, contrats de validation de transcription et d’événements actifs, proxy d’inférence avec modèles résolus par le Gateway, contrôle de flux. Un fournisseur, délégation humaine de nouvelles sessions uniquement, aucun transfert. Des tests d’injection de pannes (partition du tunnel, redémarrage du Gateway, mort du worker) conditionnent la sortie du jalon.
3. Délégation, rapatriement et délégation par l’agent : barrière de migration, machine à états du placement reliée à la barre de cible de l’interface utilisateur, réconciliation entrante et points de contrôle, audit par environnement, limites de capacité, outil de délégation par l’agent (les sessions de worker ne peuvent pas lancer de récursion). Tests d’équivalence octet par octet du cache de prompts.
4. Transfert en direct symétrique, après validation par injection de pannes du jalon 3.

Ultérieurement : bancs ACP sur les workers avec hydratation facultative des identifiants d’accès par environnement ; démarrage rapide par instantané/image préchauffée ; diffusion en éventail (N baux, même prompt) ; isolation du système d’exploitation dans la machine ; capture d’artefacts plus riche au moyen du schéma des artefacts.

## Questions ouvertes

- Disponibilité des Plugins/Skills sur les workers : les Skills intégrées au dépôt sont synchronisées gratuitement avec l’espace de travail ; les Skills/Plugins d’agent configurés dans le Gateway nécessitent une décision explicite de synchronisation ou d’exclusion (le manifeste de l’outil/du Plugin fait dans tous les cas partie de la négociation d’admission).
- Cadence par défaut des points de contrôle : basée sur les tours ou sur le temps pour les sessions très bavardes.
- Interaction des profils d’environnement avec le routage multi-agent (profils par défaut propres à chaque agent ou sélection uniquement par session).
