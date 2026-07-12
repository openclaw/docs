---
read_when:
    - Vous hébergez OpenClaw pour plusieurs utilisateurs ou organisations
    - Vous devez choisir une limite d’isolation pour les charges de travail des locataires
summary: Hébergez plusieurs domaines de confiance de locataires sous la forme d’une cellule Gateway OpenClaw isolée par locataire
title: Hébergement mutualisé
x-i18n:
    generated_at: "2026-07-12T15:25:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 5ffb873c7b9e7e463d932ad35eb009c34218447a051ac065c151ba57dc71b799
    source_path: gateway/multi-tenant-hosting.md
    workflow: 16
---

# Hébergement mutualisé

Le modèle de sécurité par défaut d’OpenClaw repose sur une seule frontière d’opérateur de confiance par Gateway, et non sur l’isolation de locataires hostiles au sein d’un Gateway partagé. Héberger des utilisateurs ou des organisations qui ne partagent pas une même frontière de confiance implique donc d’exécuter une instance OpenClaw complète et distincte pour chaque locataire.

`openclaw fleet` appelle chaque instance isolée une **cellule**. Une cellule est un Gateway complet exécuté dans un conteneur renforcé, avec son propre état, ses propres identifiants, son propre espace de travail, ses propres comptes de canaux, son propre jeton et un port hôte accessible uniquement en boucle locale.

Fleet est **expérimental** : ses commandes, ses options et son profil de conteneur peuvent changer d’une version à l’autre sans période de dépréciation, le temps que l’interface se stabilise.

Fleet est testé sur les hôtes Linux et macOS. Les hôtes Windows ne sont actuellement pas testés.

## Pourquoi chaque locataire a besoin d’une cellule

Un opérateur authentifié au sein d’un Gateway possède un rôle de confiance dans le plan de contrôle. Les identifiants de session sélectionnent le routage ; ils n’autorisent pas un locataire par rapport à un autre. Le cloisonnement des agents peut réduire les effets de contenus non fiables et de l’exécution d’outils, mais il ne transforme pas un Gateway partagé en frontière d’autorisation entre locataires.

Utilisez une cellule par locataire afin que chaque domaine de confiance dispose d’un processus Gateway, d’un conteneur, d’une arborescence d’état persistant et d’un identifiant Gateway distincts. Cette approche suit le [modèle de sécurité du Gateway](/fr/gateway/security) : ne regroupez pas des utilisateurs qui ne se font pas mutuellement confiance dans un même processus OpenClaw ou sous un même utilisateur du système d’exploitation.

## Architecture

La CLI Fleet est un superviseur du cycle de vie côté hôte. Elle enregistre les cellules dans la base de données d’état d’OpenClaw et demande à un environnement d’exécution Docker ou Podman local de créer, inspecter, démarrer, arrêter, remplacer et supprimer leurs conteneurs. Les points de terminaison d’environnement d’exécution distants sont refusés, car les chemins de montage et les URL de boucle locale de Fleet appartiennent à l’hôte local ; la prise en charge des hôtes de cellules distants est reportée jusqu’à la définition d’un contrat explicite pour le stockage et les points de terminaison. Fleet ne relaie pas les messages des locataires et n’ajoute aucun chemin de données partagé au niveau de l’application entre les cellules.

Chaque cellule exécute l’image officielle `ghcr.io/openclaw/openclaw` sur son propre réseau en pont défini par l’utilisateur. Des ponts distincts empêchent le trafic direct entre les adresses IP des conteneurs de différentes cellules, tout en conservant l’accès NAT sortant pour les fournisseurs et les canaux. Le trafic sortant est autorisé sans restriction par défaut. Les cellules Podman peuvent utiliser `--network internal` pour bloquer le trafic sortant tout en conservant le port Gateway publié sur la boucle locale. Les réseaux internes Docker rendent ce port publié inutilisable ; Fleet refuse donc cette combinaison. Pour Docker, appliquez plutôt une politique de trafic sortant à l’aide de règles de pare-feu sur l’hôte, telles que la chaîne `DOCKER-USER`. Le Gateway de la cellule écoute sur le port `18789` dans le conteneur, tandis que l’environnement d’exécution ne le publie que sur `127.0.0.1:<allocated-port>` sur l’hôte. Lorsqu’un accès distant est nécessaire, un opérateur peut placer un proxy inverse approuvé, un tunnel SSH ou un réseau Tailscale devant ce point de terminaison en boucle locale.

L’état persistant du Gateway provient de `<state-dir>/fleet/cells/<tenant>/` et est monté sur `/home/node/.openclaw`. Les clés de chiffrement des profils d’authentification proviennent du chemin hôte distinct `<state-dir>/fleet/auth-profile-secrets/<tenant>/` et sont montées sur `/home/node/.config/openclaw`, conformément à la [structure de persistance Docker officielle](/fr/install/docker#storage-and-persistence). La clé n’est pas imbriquée sous le montage d’état ordinaire. Les comptes de canaux propres à chaque locataire aboutissent dans la cellule qui les possède ; le produit minimal viable de Fleet ne comporte donc ni compte de canal partagé ni routeur partagé de messages entrants.

L’image officielle utilise par défaut l’utilisateur non privilégié `node` avec l’UID 1000. Fleet utilise des correspondances d’utilisateurs compatibles avec l’hôte afin que les montages privés restent accessibles en écriture : Podman utilise `keep-id`, Docker avec privilèges root utilise l’identité non-root de l’appelant, et Docker sans privilèges root associe l’utilisateur root du conteneur à l’utilisateur non privilégié du démon. Docker et Podman appliquent un réétiquetage privé `:Z` lorsque SELinux est actif sur l’hôte. Le profil du conteneur évite les fonctionnalités privilégiées de l’hôte et est compatible avec une exécution sans privilèges root, mais ce mode d’exécution constitue un choix et un prérequis de l’environnement d’exécution de l’hôte ; Fleet ne l’active pas automatiquement.

## Frontière de confiance

La mutualisation protège les locataires les uns des autres. Tous les locataires font confiance à l’opérateur Fleet et à l’hôte. La résistance à la compromission de l’hôte n’est pas un objectif.

Cela signifie qu’un administrateur de l’hôte peut inspecter la configuration et l’environnement des conteneurs, lire les données montées des cellules, remplacer les images ou entrer dans les conteneurs. Les jetons Gateway et les valeurs transmises avec `--env` sont visibles par un administrateur au moyen des fonctions d’inspection de Docker ou Podman. Utilisez en conséquence des contrôles sur l’hôte, une politique d’accès administratif, une surveillance, des sauvegardes et un gestionnaire de secrets approuvé.

La configuration de référence empêche l’exposition accidentelle du réseau sur des adresses génériques et supprime les mécanismes courants d’élévation de privilèges des conteneurs, mais elle ne sécurise pas un hôte non fiable.

## Niveaux d’isolation

Choisissez la frontière adaptée aux locataires que vous hébergez :

1. **Configuration de référence avec conteneurs renforcés.** Fleet supprime toutes les capacités Linux, active `no-new-privileges`, applique des limites de PID, de mémoire, de processeur et, facultativement, d’espace disque pour la couche inscriptible, utilise des montages persistants et des réseaux distincts pour chaque cellule, et ne publie les services que sur la boucle locale de l’hôte. La mise en réseau par pont laisse le trafic sortant sans restriction ; utilisez `--network internal` avec Podman ou une politique de pare-feu sur l’hôte avec Docker lorsqu’une cellule ne doit pas établir de connexions sortantes. Il s’agit du profil du produit minimal viable pour les locataires qui font confiance à l’opérateur et à l’hôte.
2. **Isolation renforcée par conteneur ou machine virtuelle.** Pour les charges de travail à risque élevé, configurez Docker ou Podman afin d’utiliser un environnement d’isolation OCI plus robuste, tel que gVisor ou Kata Containers, ou placez les cellules dans des microVM. Il s’agit d’une configuration de l’environnement d’exécution ou de l’infrastructure ; l’option `--runtime docker|podman` de Fleet sélectionne la CLI de conteneur, et non le moteur d’isolation OCI. Consultez les [environnements d’exécution de conteneurs alternatifs](https://docs.docker.com/engine/daemon/alternative-runtimes/) de Docker et le [guide de l’environnement d’exécution Docker en machine virtuelle](/fr/install/docker-vm-runtime).
3. **Machines distinctes pour les locataires hostiles.** Ne regroupez pas des locataires hostiles dans un même processus OpenClaw ou sous un même utilisateur du système d’exploitation. Lorsque les locataires ne font pas confiance au même opérateur d’hôte ou nécessitent une frontière administrative plus robuste, utilisez des machines virtuelles ou des hôtes physiques distincts avec une administration séparée des environnements d’exécution.

Aucun niveau de cette hiérarchie ne modifie le modèle de confiance applicatif d’OpenClaw : un Gateway reste un domaine unique d’opérateur de confiance.

## Démarrage rapide

Créez une cellule. La commande affiche une seule fois un jeton Gateway généré ; enregistrez-le donc immédiatement :

```bash
openclaw fleet create acme
```

Ouvrez l’URL `http://127.0.0.1:<port>` indiquée sur l’hôte Fleet, authentifiez-vous avec le jeton de ce locataire, puis configurez les identifiants du fournisseur et les comptes de canaux dans la cellule.

Vérifiez l’état du conteneur et la disponibilité du Gateway :

```bash
openclaw fleet status acme
```

Effectuez une mise à niveau tout en conservant le port de l’hôte, les données montées, le profil de ressources, l’environnement fourni par l’utilisateur et le jeton Gateway :

```bash
openclaw fleet upgrade acme
```

Supprimez le conteneur et la ligne du registre tout en conservant les données du locataire :

```bash
openclaw fleet rm acme --force
```

Pour supprimer également les données persistantes du locataire, ajoutez `--purge-data`. La purge exige `--force`, est irréversible et effectue une vérification de confinement du chemin résolu avant toute suppression :

```bash
openclaw fleet rm acme --purge-data --force
```

Consultez la [référence de la CLI `openclaw fleet`](/cli/fleet) pour connaître toutes les commandes et options.

## Éléments reportés au-delà du produit minimal viable

La première version de Fleet réserve délibérément les fonctionnalités suivantes à des conceptions ultérieures :

- Comptes de canaux partagés ou routeur d’entrée partagé
- Processus hôtes allégés par locataire à la place d’instances OpenClaw complètes
- Hôtes de cellules distants gérés par un seul superviseur
- Portail en libre-service pour les locataires, plan de facturation ou interface d’administration déléguée

Ces fonctionnalités nécessitent des contrats explicites en matière d’identité, de routage, d’autorisation et de domaines de défaillance. Elles ne doivent pas être approximées en partageant un Gateway ou ses identifiants entre plusieurs locataires. Elles ne relèvent pas non plus du périmètre de Fleet : Fleet reste un superviseur du cycle de vie sur un hôte unique, tandis que les flottes composées de plusieurs machines et régies par des identités relèvent d’une couche de plan de contrôle dédiée située au-dessus.

## Ressources associées

- [`openclaw fleet`](/cli/fleet)
- [Sécurité du Gateway](/fr/gateway/security)
- [Plusieurs Gateways](/fr/gateway/multiple-gateways)
- [Docker](/fr/install/docker)
- [Podman](/fr/install/podman)
