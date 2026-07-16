---
read_when:
    - Vous hébergez plusieurs domaines de confiance de locataires sur une seule machine
    - Vous devez créer, inspecter, mettre à niveau ou supprimer des cellules de flotte
summary: Référence de la CLI pour le provisionnement et la gestion de cellules OpenClaw isolées par locataire
title: Flotte
x-i18n:
    generated_at: "2026-07-16T13:05:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: be589500e4715541f175caf0d5135a96baee4874e64c60c8b6f188ff1f70bc9f
    source_path: cli/fleet.md
    workflow: 16
---

# `openclaw fleet`

`openclaw fleet` gère des instances OpenClaw complètes appelées **cellules**. Chaque cellule possède son propre Gateway, son propre état, ses propres identifiants, comptes de canaux, conteneur et port hôte accessible uniquement via l’interface de bouclage. Utilisez une cellule pour chaque frontière de confiance entre locataires ; n’utilisez pas un Gateway partagé comme frontière multi-locataire face à des entités hostiles.

Fleet est **expérimental**. Les noms de commandes, les indicateurs, les formats de sortie et le profil du conteneur peuvent changer d’une version à l’autre sans période de dépréciation.

Fleet prend en charge Docker et Podman. L’image par défaut est `ghcr.io/openclaw/openclaw:latest`.

Fleet est testé sur les hôtes Linux et macOS. Les hôtes Windows ne sont actuellement pas testés.

## Démarrage rapide

```bash
openclaw fleet create acme
openclaw fleet status acme
openclaw fleet list
```

`fleet create` affiche une seule fois le jeton Gateway généré avec l’URL de la cellule. Stockez immédiatement le jeton, puis configurez les comptes de canaux de chaque locataire dans la cellule de ce locataire.

## Identifiants de locataire

Les identifiants de locataire doivent correspondre à :

```text
^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$
```

Cela autorise de 1 à 40 lettres minuscules, chiffres et traits d’union internes. Un identifiant doit commencer et se terminer par une lettre ou un chiffre. Les lettres majuscules, les traits de soulignement, les barres obliques, les points, les espaces et les chaînes de traversée telles que `../acme` sont rejetés.

L’identifiant devient une partie du nom du conteneur : `openclaw-cell-<tenant>`.

## `fleet create`

Créez une cellule et démarrez-la :

```bash
openclaw fleet create acme
```

Créez une cellule Podman sur un port fixe sans la démarrer :

```bash
openclaw fleet create acme \
  --runtime podman \
  --port 19125 \
  --no-start
```

Transmettez des variables d’environnement propres au locataire en répétant `--env` :

```bash
openclaw fleet create acme \
  --env TZ=America/Los_Angeles \
  --env OPENCLAW_DISABLE_BONJOUR=1
```

Les clés d’environnement utilisent des lettres, des chiffres et des traits de soulignement, et ne peuvent pas commencer par un chiffre. Les valeurs doivent tenir sur une seule ligne, car Fleet les transmet au moyen d’un fichier d’environnement d’exécution protégé. Fleet rejette les tentatives de remplacement des variables gérées de chemin de conteneur et de jeton Gateway répertoriées dans [Stockage et disposition du conteneur](#storage-and-container-layout).

### Options de création

| Option                    | Valeur par défaut                     | Description                                                                                    |
| ------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `--image <ref>`           | `ghcr.io/openclaw/openclaw:latest`    | Image de conteneur de la cellule.                                                                  |
| `--runtime <runtime>`     | `docker`                              | CLI de conteneur : `docker` ou `podman`.                                                           |
| `--port <number>`         | Alloué automatiquement à partir de `19100`  | Port hôte de bouclage. Un port explicitement sélectionné ne doit appartenir à aucune autre cellule enregistrée.    |
| `--memory <value>`        | `2g`                                  | Limite de mémoire du conteneur dans la syntaxe Docker/Podman.                                                |
| `--cpus <value>`          | `2`                                   | Limite de processeur du conteneur.                                                                           |
| `--disk <size>`           | Aucune                                  | Limite la couche inscriptible du conteneur lorsque le système de stockage prend en charge les quotas.                     |
| `--network <mode>`        | `bridge`                              | Mode réseau sortant : `bridge` ou `internal`.                                                 |
| `--pids-limit <number>`   | `512`                                 | Nombre maximal de processus dans le conteneur.                                                  |
| `--env <KEY=VALUE>`       | Aucune                                  | Transmet une variable d’environnement à la cellule. Répétez l’option pour plusieurs valeurs.                          |
| `--gateway-token <value>` | Jeton hexadécimal aléatoire de 32 caractères | Utilise un jeton Gateway fourni au lieu d’en générer un. Consultez [Gestion des jetons](#token-handling). |
| `--no-start`              | La cellule démarre                           | Crée le conteneur sans le démarrer.                                                      |
| `--json`                  | Sortie lisible par l’utilisateur                 | Affiche une sortie lisible par une machine.                                                                 |

L’allocation automatique sélectionne le premier port de registre inutilisé supérieur ou égal à `19100`. Fleet rejette les identifiants de locataire en double et les ports explicites déjà attribués à une autre cellule.

Les références d’image sont transmises comme un seul argument au moteur d’exécution de conteneurs. Les références vides et les valeurs commençant par `-` sont rejetées afin qu’une image ne puisse pas être interprétée comme une option Docker ou Podman.

Le point de terminaison Docker ou Podman sélectionné doit être local. Fleet rejette les contextes Docker distants, les points de terminaison `DOCKER_HOST` et les services Podman distants avant de réserver un port ou de créer un état local. Les hôtes de cellules distants ne sont pas pris en charge.

Lorsque Fleet démarre une nouvelle cellule, la commande de création attend jusqu’à environ une minute que son Gateway réponde à `/healthz`. Si la cellule ne devient pas saine, Fleet conserve son conteneur et sa ligne de registre pour `fleet status`, `fleet logs` ou une suppression explicite. `--no-start` ignore ce contrôle d’intégrité. Le jeton Gateway généré d’une nouvelle cellule défaillante n’est pas perdu : il reste dans l’environnement du conteneur (`docker|podman inspect`) et, comme la cellule n’a encore traité aucun trafic, `fleet rm --force` suivi d’une nouvelle création constitue toujours une solution sûre.

### Épinglage par condensat

Les commandes de création et de mise à niveau acceptent les références d’image épinglées par condensat telles que `--image ghcr.io/openclaw/openclaw@sha256:<digest>`. Fleet transmet la référence d’image telle quelle à Docker ou Podman, ce qui permet à un opérateur de maintenir une cellule sur des octets d’image immuables plutôt que sur une étiquette évolutive.

Le résultat de la création comprend l’identifiant du locataire, le nom du conteneur, le port hôte, le jeton Gateway et l’URL locale. Même dans une sortie JSON, traitez le résultat comme contenant des données secrètes, car il inclut le jeton.

### Limites de disque

`--disk` limite uniquement la couche inscriptible du conteneur. Les répertoires d’état et d’authentification par locataire montés par liaison restent dans le stockage de l’hôte ; utilisez les quotas de projet du système de fichiers hôte lorsque ces répertoires doivent également être soumis à une limite stricte.

| Moteur d’exécution/système de stockage | Prise en charge de `--disk`                                                             |
| ----------------------- | ---------------------------------------------------------------------------- |
| Docker overlay2 sur XFS  | Nécessite l’option de montage XFS `pquota`.                                      |
| Docker btrfs ou zfs     | Pris en charge par le pilote de stockage.                                             |
| Podman overlay          | Nécessite un stockage sous-jacent XFS.                                                |
| Autres systèmes          | La création du conteneur échoue avec l’erreur du démon et les recommandations de Fleet relatives au système de stockage. |

### Politique de trafic sortant

| Mode       | Docker                                                                                                | Podman                                                                              |
| ---------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `bridge`   | Pris en charge ; le trafic sortant est libre par défaut.                                                | Pris en charge ; le trafic sortant est libre par défaut.                              |
| `internal` | Rejeté, car Docker ne conserve pas le port Gateway de bouclage publié sur un réseau interne. | Pris en charge ; le Gateway de bouclage reste publié tandis que le trafic sortant est bloqué. |

Pour Docker, conservez le mode pont et appliquez la politique de trafic sortant à l’aide de règles de pare-feu hôte telles que la chaîne `DOCKER-USER`.

## `fleet list`

Répertoriez les cellules dans l’ordre des identifiants de locataire :

```bash
openclaw fleet list
openclaw fleet ls
openclaw fleet list --json
```

Le tableau contient :

| Colonne    | Signification                                                                                                                                                                                                                                                                               |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tenant`  | Identifiant du locataire.                                                                                                                                                                                                                                                                            |
| `state`   | État en direct du conteneur issu de l’inspection Docker ou Podman. `unknown` signifie que le moteur d’exécution était indisponible, ou qu’un conteneur portant le nom de la cellule existe mais que ses étiquettes de propriété Fleet ne correspondent pas à l’enregistrement du registre (signal de collision ou d’altération — inspectez-le manuellement avant toute action). |
| `port`    | Port hôte de bouclage associé au Gateway de la cellule.                                                                                                                                                                                                                                        |
| `image`   | Image de conteneur enregistrée.                                                                                                                                                                                                                                                             |
| `created` | Heure de création de la cellule.                                                                                                                                                                                                                                                                   |

Les lignes du registre restent visibles lorsque Docker ou Podman est indisponible ; seul l’état en direct devient `unknown`.

## `fleet status`

Inspectez une cellule :

```bash
openclaw fleet status acme
openclaw fleet status acme --json
```

L’état combine la ligne du registre Fleet, l’inspection du conteneur en direct et une brève requête effectuée au mieux vers :

```text
http://127.0.0.1:<host-port>/healthz
```

Le résultat du contrôle d’intégrité est `ok`, `failed` ou `skipped`. `/healthz` confirme que le Gateway est actif, et non que chaque canal ou Plugin configuré est entièrement prêt. La sonde est ignorée lorsqu’aucun point de terminaison local utilisable n’est disponible pour le contrôle.

## `fleet logs`

Diffusez les journaux du conteneur d’une cellule directement dans le terminal :

```bash
openclaw fleet logs acme
openclaw fleet logs acme --follow
openclaw fleet logs acme --tail 200
openclaw fleet logs acme --since 10m
```

Fleet vérifie les étiquettes de propriété du conteneur enregistré avant de lire les journaux ; il refuse donc un conteneur étranger utilisant le nom de cellule attendu. Le flux est épinglé à l’identifiant du conteneur inspecté, de sorte qu’un remplacement simultané ne peut pas le rediriger vers une génération plus récente. Appuyez sur Ctrl-C pour terminer `--follow` sans considérer l’arrêt par l’opérateur comme un échec de commande. La sortie des journaux passe par un filtre de masquage qui remplace le jeton Gateway actuel de la cellule par `<redacted>` avant que quoi que ce soit n’atteigne le terminal.

`fleet logs` ne comporte aucun mode `--json`, car les journaux du conteneur constituent un flux stdout/stderr brut. Pour les scripts, limitez la sortie avec `--tail` et utilisez une redirection ou des pipelines de shell ordinaires.

## `fleet start`, `fleet stop` et `fleet restart`

Contrôlez une cellule existante avec son environnement d'exécution enregistré :

```bash
openclaw fleet start acme
openclaw fleet stop acme
openclaw fleet restart acme
```

Ces commandes agissent sur le nom de conteneur enregistré. Elles échouent si le locataire est inconnu ou si l'environnement d'exécution enregistré ne peut pas effectuer l'opération.

## `fleet upgrade`

Téléchargez de nouveau l'image enregistrée et remplacez le conteneur de la cellule :

```bash
openclaw fleet upgrade acme
```

Déplacez la cellule vers une autre image :

```bash
openclaw fleet upgrade acme --image ghcr.io/openclaw/openclaw:<version>
```

La mise à niveau télécharge l'image cible, inspecte le conteneur existant et le réseau propre à la cellule, arrête et supprime le conteneur, puis le recrée et le démarre. Le remplacement conserve le même port hôte, les mêmes répertoires de données, le réseau en pont propre à la cellule, le profil d'environnement d'exécution, les limites de ressources, la stratégie de redémarrage, l'environnement géré par Fleet et les valeurs initialement fournies avec `--env`. L'état monté survit au remplacement du conteneur ; l'environnement par défaut de l'image peut changer avec l'image cible.

Le remplacement n'est validé qu'après que son Gateway répond à `/healthz` sur le port de bouclage de la cellule, conformément au contrat d'intégrité utilisé par le fichier Compose officiel. Un remplacement qui s'arrête, entre dans une boucle de plantage ou ne devient pas opérationnel dans un délai d'environ une minute est supprimé et le conteneur précédent est restauré, afin qu'une image défectueuse ne mette pas hors service une cellule fonctionnelle.

Le jeton du Gateway n'est volontairement pas stocké dans le registre Fleet. Avant de supprimer l'ancien conteneur, Fleet lit son environnement et transfère `OPENCLAW_GATEWAY_TOKEN` vers le remplacement. Ne supprimez pas manuellement l'ancien conteneur avant une mise à niveau si le jeton n'existe nulle part ailleurs sous votre contrôle.

## `fleet backup` et `fleet restore`

Sauvegardez une cellule arrêtée :

```bash
openclaw fleet stop acme
openclaw fleet backup acme --out ./acme.tgz
```

Restaurez cette archive dans la cellule enregistrée :

```bash
openclaw fleet restore acme --from ./acme.tgz
```

Ces commandes nécessitent les privilèges d'un opérateur de l'hôte. Les archives contiennent l'état du locataire et des secrets d'authentification, sont créées avec le mode `0600` et doivent être stockées comme des identifiants. La sauvegarde refuse une cellule en cours d'exécution afin de capturer l'état SQLite de manière cohérente. La restauration refuse une cellule en cours d'exécution sauf si `--force` est fourni, remplace uniquement l'état de ce locataire, renouvelle le jeton du Gateway et affiche le nouveau jeton une seule fois. Fleet sauvegarde un seul locataire à la fois ; la sauvegarde de tous les locataires constitue une action distincte de l'opérateur.

La restauration nécessite un conteneur arrêté existant, car son profil d'environnement d'exécution inspecté fournit les limites, le mappage utilisateur, la provenance de l'environnement et l'image du remplacement. Si le conteneur enregistré a été supprimé en dehors de Fleet, exécutez d'abord `fleet rm <tenant> --force` sans `--purge-data`, recréez la cellule avec l'image prévue et `--no-start`, puis réessayez la restauration. La première suppression conserve intacts les deux répertoires de données du locataire.

Les deux commandes acceptent `--max-bytes <bytes>` pour limiter les données de fichiers archivées ou extraites, et appliquent toutes deux la même limite fixe d'un million de segments de chemin d'archive afin que les bombes d'archive composées uniquement de métadonnées ne puissent pas épuiser les inœuds de l'hôte et que chaque sauvegarde acceptée reste restaurable. La sauvegarde accepte `--out <path>` et les deux commandes prennent en charge `--json`.

Les archives contiennent uniquement des fichiers ordinaires et des répertoires. La sauvegarde ne suit ni ne stocke jamais les liens symboliques, les liens physiques, les sockets ou les nœuds de périphérique ; le nombre d'éléments ignorés est indiqué dans le résultat. La restauration rejette les archives contenant tout autre type d'entrée. Les arborescences de liens symboliques recréables, telles que `node_modules` de l'espace de travail, doivent être réinstallées dans la cellule après une restauration.

## `fleet doctor`

Auditez toutes les cellules ou un locataire sans modifier l'environnement d'exécution ni l'état du système de fichiers :

```bash
openclaw fleet doctor
openclaw fleet doctor acme --json
```

Doctor vérifie la localité de l'environnement d'exécution, les étiquettes de propriété, l'intégrité, le durcissement, les limites de ressources, la liaison du port de bouclage, la présence du jeton, la propriété du réseau et le mode de sortie, ainsi que les autorisations des répertoires d'état privés. Les avertissements décrivent les cellules arrêtées ou les différences de propriété ; tout contrôle échoué définit un code de sortie de processus non nul.

## `fleet rm`

Supprimez une cellule arrêtée de l'environnement d'exécution et du registre tout en conservant les données du locataire :

```bash
openclaw fleet rm acme
```

Un conteneur en cours d'exécution nécessite `--force` :

```bash
openclaw fleet rm acme --force
```

Supprimez également définitivement les données de la cellule :

```bash
openclaw fleet rm acme --purge-data --force
```

Fleet supprime le conteneur de la cellule avant de supprimer son réseau en pont dédié. `--purge-data` nécessite `--force`. Avant la suppression récursive, Fleet résout les deux racines appartenant à Fleet et les deux répertoires propres au locataire. Chaque cible doit être exactement la feuille de locataire attendue, se trouver strictement à l'intérieur de sa racine et ne pas être un lien symbolique. Ces vérifications de confinement empêchent un chemin de registre corrompu ou un lien symbolique entre locataires de rediriger la suppression ailleurs.

La purge peut être réessayée lorsqu'un répertoire de locataire attendu précis est déjà absent. Cela permet à une invocation ultérieure de terminer le nettoyage après une défaillance partielle du système de fichiers sans assouplir les vérifications de chemin pour les répertoires qui existent encore.

## Stockage et organisation des conteneurs

L'état de la cellule et les clés de chiffrement des profils d'authentification utilisent des chemins hôtes distincts propres à chaque locataire sous le répertoire d'état OpenClaw actif :

```text
<state-dir>/fleet/cells/<tenant>/
<state-dir>/fleet/auth-profile-secrets/<tenant>/
```

Le premier répertoire est monté à l'emplacement `/home/node/.openclaw`. Le second est monté à l'emplacement `/home/node/.config/openclaw`, conformément au montage des clés de chiffrement de la configuration Docker officielle. La clé de chiffrement n'est donc pas exposée sous le montage d'état ordinaire ni incluse lorsque seul le répertoire d'état de la cellule est sauvegardé ou partagé. Les deux répertoires survivent à la suppression normale et à la mise à niveau ; `fleet rm --purge-data --force` les supprime tous deux après des vérifications de confinement distinctes.

Avant le premier démarrage, Fleet initialise la configuration de la cellule avec `gateway.mode=local`, l'authentification par jeton, la liaison au réseau local du conteneur et les origines de la Control UI correspondant au port hôte attribué. La valeur du jeton n'est pas écrite dans cette configuration ; elle reste dans l'environnement du conteneur.

Fleet fixe les chemins de conteneur de l'image officielle avec les valeurs d'environnement suivantes :

| Variable                 | Valeur dans le conteneur              |
| ------------------------ | ------------------------------------ |
| `HOME`                   | `/home/node`                         |
| `OPENCLAW_HOME`          | `/home/node`                         |
| `OPENCLAW_STATE_DIR`     | `/home/node/.openclaw`               |
| `OPENCLAW_CONFIG_PATH`   | `/home/node/.openclaw/openclaw.json` |
| `OPENCLAW_WORKSPACE_DIR` | `/home/node/.openclaw/workspace`     |
| `OPENCLAW_GATEWAY_TOKEN` | Jeton de cellule généré ou fourni     |

L'image officielle utilise par défaut l'utilisateur non-root `node` avec l'UID 1000. Fleet maintient les montages liés privés `0700` accessibles en écriture sans les rendre accessibles à tous. Docker avec privilèges root exécute la cellule avec l'UID et le GID non-root du processus appelant ; Docker sans privilèges root utilise l'UID 0 du conteneur, qui correspond à l'utilisateur hôte non privilégié appelant dans l'espace de noms utilisateur du démon. Podman utilise `keep-id` avec l'UID et le GID du processus appelant. Lorsque Fleet lui-même s'exécute en tant que root avec un environnement d'exécution doté de privilèges root, il conserve l'utilisateur de l'image et attribue les fichiers de montage initiaux à l'UID/GID 1000.

Sur les hôtes SELinux, les montages Docker et Podman reçoivent un réétiquetage privé `:Z`. Si vous restaurez ou déplacez les données d'une cellule, veillez à ce que l'utilisateur effectif du conteneur puisse écrire dans les chemins montés par liaison. Le profil est compatible avec un fonctionnement sans privilèges root, mais Docker ou Podman doit déjà être configuré pour ce mode sur l'hôte ; Fleet ne convertit pas un démon doté de privilèges root en démon sans privilèges root.

## Profil de sécurité

Fleet applique le profil suivant à chaque cellule :

| Contrôle               | Profil appliqué                                      | Motif                                                                                  |
| ---------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Capacités Linux        | `--cap-drop=ALL`                                     | Le Gateway est un processus Node.js et ne nécessite aucune capacité Linux supplémentaire. |
| Élévation de privilèges | `--security-opt no-new-privileges`                   | Empêche les processus d'obtenir des privilèges par l'intermédiaire de binaires setuid ou setgid. |
| Processus init         | `--init`                                             | Récupère les processus descendants et transmet les signaux de cycle de vie du conteneur. |
| Limite de processus    | `--pids-limit 512` par défaut                        | Limite l'épuisement dû aux créations de processus et aux processus eux-mêmes.           |
| Limite de mémoire      | `--memory 2g` par défaut                             | Limite l'utilisation de la mémoire par la cellule.                                      |
| Limite de processeur   | `--cpus 2` par défaut                                | Limite l'utilisation du processeur par la cellule.                                      |
| Disque de la couche inscriptible | `--disk` facultatif                         | Limite la couche du conteneur lorsque le moteur de stockage de l'environnement d'exécution prend en charge les quotas. |
| Stratégie de redémarrage | `--restart unless-stopped`                           | Redémarre une cellule défaillante sans remplacer un arrêt intentionnel.                 |
| Publication sur l'hôte | `127.0.0.1:<host-port>:18789` uniquement                   | Maintient le Gateway hors des interfaces hôtes génériques.                              |
| Réseau de la cellule   | Un réseau en pont ou un réseau interne Podman par cellule | Sépare le trafic par adresse IP des conteneurs et bloque éventuellement le trafic sortant de Podman. |
| Identité du conteneur  | Mappage utilisateur correspondant à l'hôte          | Maintient les montages liés privés accessibles en écriture sans accorder un accès universel. |
| État persistant        | Montages par cellule ; aucun montage d'état partagé | Conserve la configuration, les identifiants, les sessions et les espaces de travail du locataire dans son arborescence de données. |
| Commande du conteneur  | `node dist/index.js gateway --bind lan --port 18789` | Écoute sur le réseau du conteneur afin que le mappage de port hôte limité au bouclage puisse l'atteindre. |

Fleet ne monte jamais `/var/run/docker.sock`, n'utilise jamais `--privileged` ni le réseau de l'hôte et n'ajoute aucune capacité. Le pont propre à chaque cellule constitue une frontière de séparation entre cellules, et non un pare-feu sortant : les cellules conservent l'accès réseau sortant nécessaire aux fournisseurs et aux canaux. Placez devant le port de bouclage un proxy, un tunnel SSH ou une configuration de réseau privé correspondant à votre déploiement. `http://127.0.0.1:<port>` n'est directement accessible que depuis l'hôte Fleet.

Ce profil sépare les conteneurs des locataires, mais il ne protège pas les locataires contre l'opérateur Fleet, l'administrateur de l'environnement d'exécution des conteneurs ou un hôte compromis. Consultez [Hébergement mutualisé](/fr/gateway/multi-tenant-hosting) pour connaître le modèle de confiance complet et les options d'isolation renforcée.

## Gestion des jetons

Par défaut, `fleet create` génère un jeton de Gateway hexadécimal de 32 caractères, aléatoire et cryptographiquement sûr, puis l'affiche une seule fois dans le résultat de création. Stockez-le dans votre gestionnaire de secrets approuvé et évitez d'enregistrer la sortie de création dans les journaux.

`--gateway-token` place un jeton personnalisé dans les arguments du processus local, lesquels peuvent être conservés dans l'historique de l'interpréteur de commandes ou visibles dans les listes de processus. Préférez le jeton généré, sauf si un workflow existant de gestion des secrets exige une valeur fournie.

Le jeton et chaque valeur transmise avec `--env` résident dans l'environnement du conteneur. Fleet les écrit dans un fichier d'environnement éphémère de mode `0600`, transmet uniquement le chemin de ce fichier à Docker ou Podman, puis le supprime lorsque la commande de l'environnement d'exécution se termine. Les valeurs saisies explicitement dans `openclaw fleet create --gateway-token ...` ou `--env KEY=VALUE` peuvent néanmoins être visibles dans les arguments du processus `openclaw` externe et dans l'historique de l'interpréteur de commandes.

Les valeurs d’environnement des conteneurs ne sont pas masquées pour l’opérateur de l’hôte de confiance : les administrateurs Docker ou Podman peuvent les lire en inspectant les conteneurs. La mention « affiché une seule fois » de Fleet décrit la sortie normale de la CLI, et non une protection contre un administrateur de l’hôte.

## Pages connexes

- [Hébergement mutualisé](/fr/gateway/multi-tenant-hosting)
- [Docker](/fr/install/docker)
- [Podman](/fr/install/podman)
- [Sécurité du Gateway](/fr/gateway/security)
