---
doc-schema-version: 1
read_when:
    - Vous hébergez OpenClaw pour plusieurs utilisateurs ou organisations
    - Vous devez choisir une limite d’isolation pour les charges de travail des locataires.
summary: Hébergez plusieurs domaines de confiance locataires sous la forme d’une cellule Gateway OpenClaw isolée par locataire
title: Hébergement mutualisé
x-i18n:
    generated_at: "2026-07-16T13:21:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 383d32331b45d40db6fb4ff8242dd9a3cf8898a3ccab19f0372cd06bbd83fc05
    source_path: gateway/multi-tenant-hosting.md
    workflow: 16
---

# Hébergement multi-locataire

Le modèle de sécurité par défaut d’OpenClaw repose sur une frontière d’opérateur de confiance par Gateway, et non sur l’isolation de locataires hostiles au sein d’un même Gateway partagé. Héberger des utilisateurs ou des organisations qui ne partagent pas une même frontière de confiance implique donc d’exécuter une instance OpenClaw complète et distincte pour chaque locataire.

`openclaw fleet` appelle chaque instance isolée une **cellule**. Une cellule est un Gateway complet exécuté dans un conteneur renforcé, avec son propre état, ses propres identifiants, son propre espace de travail, ses propres comptes de canaux, son propre jeton et un port hôte accessible uniquement via l’interface de bouclage.

Fleet est **expérimental** : ses commandes, ses indicateurs et son profil de conteneur peuvent changer d’une version à l’autre sans période de dépréciation.

Fleet est testé sur les hôtes Linux et macOS. Les hôtes Windows ne sont actuellement pas testés.

## Pourquoi chaque locataire a besoin d’une cellule

Un opérateur authentifié au sein d’un Gateway joue un rôle de confiance dans le plan de contrôle. Les identifiants de session déterminent le routage ; ils n’autorisent pas un locataire par rapport à un autre. L’exécution des agents dans un bac à sable peut réduire les effets du contenu non fiable et de l’exécution des outils, mais elle ne transforme pas un Gateway partagé en frontière d’autorisation entre locataires.

Utilisez une cellule par locataire afin que chaque domaine de confiance dispose d’un processus Gateway, d’un conteneur, d’une arborescence d’état persistant et d’un identifiant Gateway distincts. Cette approche respecte le [modèle de sécurité du Gateway](/fr/gateway/security) : ne regroupez pas des utilisateurs mutuellement non fiables dans un même processus OpenClaw ni sous un même utilisateur du système d’exploitation.

## Architecture

La CLI Fleet est un superviseur côté hôte chargé du cycle de vie. Elle enregistre les cellules dans la base de données d’état d’OpenClaw et demande à un environnement d’exécution Docker ou Podman local de créer, inspecter, démarrer, arrêter, remplacer et supprimer leurs conteneurs. Les points de terminaison d’environnement d’exécution distants ne sont pas pris en charge, car les chemins de montage et les URL de bouclage de Fleet appartiennent à l’hôte local. Fleet ne relaie pas les messages des locataires et n’ajoute aucun chemin de données partagé au niveau de l’application entre les cellules.

Chaque cellule exécute l’image officielle `ghcr.io/openclaw/openclaw` sur son propre réseau pont défini par l’utilisateur. Des ponts distincts empêchent le trafic direct entre les adresses IP des conteneurs des différentes cellules, tout en conservant un accès NAT sortant pour les fournisseurs et les canaux. Le trafic sortant est autorisé sans restriction par défaut. Les cellules Podman peuvent utiliser `--network internal` pour bloquer le trafic sortant tout en conservant le port Gateway publié sur l’interface de bouclage. Les réseaux internes Docker rendent ce port publié inutilisable ; Fleet refuse donc cette combinaison. Appliquez plutôt la politique de trafic sortant Docker au moyen de règles de pare-feu de l’hôte, telles que la chaîne `DOCKER-USER`. Le Gateway de la cellule écoute sur le port `18789` à l’intérieur du conteneur, tandis que l’environnement d’exécution ne le publie que sur `127.0.0.1:<allocated-port>` sur l’hôte. Lorsqu’un accès distant est nécessaire, un opérateur peut placer un proxy inverse approuvé, un tunnel SSH ou un réseau Tailscale devant ce point de terminaison de bouclage.

L’état persistant du Gateway provient de `<state-dir>/fleet/cells/<tenant>/` et est monté à l’emplacement `/home/node/.openclaw`. Les clés de chiffrement des profils d’authentification proviennent du chemin hôte distinct `<state-dir>/fleet/auth-profile-secrets/<tenant>/` et sont montées à l’emplacement `/home/node/.config/openclaw`, conformément à l’[organisation de la persistance Docker](/fr/install/docker#storage-and-persistence) officielle. La clé n’est pas imbriquée sous le montage d’état ordinaire. Les comptes de canaux propres à chaque locataire aboutissent dans la cellule qui les possède ; Fleet ne fournit ni compte de canal partagé ni routeur de messages entrants.

L’image officielle utilise par défaut l’utilisateur non privilégié `node` avec l’UID 1000. Fleet utilise des associations d’utilisateurs compatibles avec l’hôte afin que les montages privés restent accessibles en écriture : Podman utilise `keep-id`, Docker exécuté avec les privilèges root utilise l’identité non-root de l’utilisateur appelant, et Docker sans privilèges root associe l’utilisateur root du conteneur à l’utilisateur non privilégié du démon. Docker et Podman appliquent un réétiquetage privé `:Z` lorsque SELinux est actif sur l’hôte. Le profil du conteneur évite les fonctionnalités privilégiées de l’hôte et convient à une exécution sans privilèges root, mais ce mode d’exécution constitue un choix et un prérequis de l’environnement d’exécution de l’hôte ; Fleet ne l’active pas automatiquement.

## Frontière de confiance

La mutualisation protège les locataires les uns des autres. Chaque locataire fait confiance à l’opérateur Fleet et à l’hôte. La résistance à la compromission de l’hôte n’est pas un objectif.

Cela signifie qu’un administrateur de l’hôte peut inspecter la configuration et l’environnement des conteneurs, lire les données montées des cellules, remplacer les images ou accéder aux conteneurs. Les jetons Gateway et les valeurs transmises avec `--env` sont visibles par un administrateur lors de l’inspection Docker ou Podman. Utilisez donc des contrôles sur l’hôte, une politique d’accès administratif, une surveillance, des sauvegardes et un gestionnaire de secrets approuvé.

La configuration de référence empêche l’exposition réseau générique accidentelle et supprime les mécanismes courants d’élévation de privilèges des conteneurs, mais elle ne sécurise pas un hôte non fiable.

## Échelle d’isolation

Choisissez la frontière adaptée aux locataires que vous hébergez :

1. **Configuration de référence avec conteneur renforcé.** Fleet supprime toutes les capacités Linux, active `no-new-privileges`, applique des limites aux PID, à la mémoire, au processeur et, facultativement, au disque de la couche accessible en écriture, utilise des montages persistants et des réseaux distincts pour chaque cellule, et publie uniquement sur l’interface de bouclage de l’hôte. Le réseau en pont laisse le trafic sortant sans restriction ; utilisez `--network internal` avec Podman ou une politique de pare-feu de l’hôte avec Docker lorsqu’une cellule ne doit pas établir de connexions sortantes. Il s’agit du profil par défaut pour les locataires qui font confiance à l’opérateur et à l’hôte.
2. **Isolation renforcée par conteneur ou machine virtuelle.** Pour les charges de travail à risque plus élevé, configurez Docker ou Podman afin d’utiliser un environnement d’isolation OCI plus robuste, tel que gVisor ou Kata Containers, ou placez les cellules dans des microVM. Il s’agit d’une configuration de l’environnement d’exécution ou de l’infrastructure ; l’option `--runtime docker|podman` de Fleet sélectionne la CLI du conteneur, et non le moteur d’isolation OCI. Consultez les [environnements d’exécution de conteneurs alternatifs](https://docs.docker.com/engine/daemon/alternative-runtimes/) de Docker et le [guide de l’environnement d’exécution Docker dans une machine virtuelle](/fr/install/docker-vm-runtime).
3. **Machines distinctes pour les locataires hostiles.** Ne regroupez pas des locataires hostiles dans un même processus OpenClaw ni sous un même utilisateur du système d’exploitation. Lorsque les locataires ne font pas confiance au même opérateur hôte ou nécessitent une frontière administrative plus robuste, utilisez des machines virtuelles ou des hôtes physiques distincts dont l’administration des environnements d’exécution est séparée.

Aucun niveau de cette échelle ne modifie le modèle de confiance de l’application OpenClaw : un Gateway reste un domaine d’opérateur de confiance unique.

## Démarrage rapide

Créez une cellule. La commande affiche une seule fois un jeton Gateway généré ; conservez-le donc immédiatement :

```bash
openclaw fleet create acme
```

Ouvrez l’URL `http://127.0.0.1:<port>` indiquée sur l’hôte Fleet, authentifiez-vous avec le jeton de ce locataire, puis configurez les identifiants du fournisseur et les comptes de canaux dans la cellule.

Vérifiez l’état du conteneur et la disponibilité du Gateway :

```bash
openclaw fleet status acme
```

Effectuez la mise à niveau tout en conservant le port de l’hôte, les données montées, le profil de ressources, l’environnement fourni par l’utilisateur et le jeton Gateway :

```bash
openclaw fleet upgrade acme
```

Supprimez le conteneur et la ligne du registre tout en conservant les données du locataire :

```bash
openclaw fleet rm acme --force
```

Pour supprimer également les données persistantes du locataire, ajoutez `--purge-data`. La purge nécessite `--force`, est irréversible et effectue une vérification de confinement du chemin résolu avant toute suppression :

```bash
openclaw fleet rm acme --purge-data --force
```

Consultez la [référence de la CLI `openclaw fleet`](/fr/cli/fleet) pour connaître toutes les commandes et options.

## Portée actuelle

Fleet ne fournit pas les fonctionnalités suivantes :

- Comptes de canaux partagés ou routeur d’entrée partagé
- Processus hôtes allégés par locataire à la place d’instances OpenClaw complètes
- Hôtes de cellules distants gérés par un superviseur unique
- Portail en libre-service pour les locataires, plan de facturation ou interface d’administration déléguée

Ces fonctionnalités nécessitent des contrats explicites en matière d’identité, de routage, d’autorisation et de domaines de défaillance. Ne tentez pas de les reproduire en partageant un Gateway ou ses identifiants entre plusieurs locataires. Fleet est un superviseur de cycle de vie limité à un seul hôte ; les flottes réparties sur plusieurs machines et régies par des identités nécessitent une couche de plan de contrôle distincte.

## Voir aussi

- [`openclaw fleet`](/fr/cli/fleet)
- [Sécurité du Gateway](/fr/gateway/security)
- [Plusieurs Gateway](/fr/gateway/multiple-gateways)
- [Docker](/fr/install/docker)
- [Podman](/fr/install/podman)
