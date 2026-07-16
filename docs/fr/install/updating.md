---
read_when:
    - Mise à jour d’OpenClaw
    - Quelque chose ne fonctionne plus après une mise à jour
summary: Mettre à jour OpenClaw en toute sécurité (installation globale ou depuis les sources), avec une stratégie de restauration
title: Mise à jour
x-i18n:
    generated_at: "2026-07-16T13:21:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: baf849d27fd1132833832734ff5b1648b7401d53925a624176832bca614d1160
    source_path: install/updating.md
    workflow: 16
---

Maintenez OpenClaw à jour.

Pour le remplacement des images Docker, Podman et Kubernetes, consultez
[Mise à niveau des images de conteneur](/fr/install/docker#upgrading-container-images). Le
Gateway exécute les opérations de mise à niveau sûres au démarrage avant de signaler qu’il est prêt et s’arrête si l’état
monté nécessite une réparation manuelle.

## Recommandé : `openclaw update`

Détecte votre type d’installation (npm, pnpm, Bun ou git), récupère la dernière version, exécute `openclaw doctor` et redémarre le Gateway.

```bash
openclaw update
```

Changez de canal ou ciblez une version spécifique :

```bash
openclaw update --channel beta
openclaw update --channel extended-stable
openclaw update --channel dev
openclaw update --dry-run   # aperçu sans application
```

`openclaw update` ne possède pas d’option `--verbose` (contrairement au programme d’installation). Pour le diagnostic, utilisez
`--dry-run` afin de prévisualiser les actions prévues, `--json` pour obtenir des résultats structurés, ou
`openclaw update status --json` pour examiner l’état du canal et de la disponibilité.

`--channel beta` privilégie le dist-tag npm bêta, mais revient à stable/latest
si le tag bêta est absent ou si sa version est antérieure à la dernière version
stable. Utilisez plutôt `--tag beta` pour une mise à jour ponctuelle du paquet épinglée sur le dist-tag npm
bêta brut.

`--channel extended-stable` concerne uniquement les paquets, et l’installation s’effectue toujours
uniquement au premier plan. OpenClaw lit le sélecteur npm public `extended-stable`,
vérifie le paquet exact sélectionné et installe cette version précise. Des données
de registre absentes ou incohérentes provoquent un échec sécurisé ; aucun retour à `latest` n’est effectué.
Si la version sélectionnée est antérieure à la version installée, la confirmation
normale de rétrogradation s’applique toujours. La CLI conserve le canal après une
mise à jour réussie du cœur ; une exécution directe de `npm install -g openclaw@extended-stable`
ne met pas à jour `update.channel`.
Après le remplacement du cœur, les plugins npm officiels admissibles dont l’intention est
nue/par défaut ou `latest` convergent vers cette version exacte du cœur. Les épinglages exacts et les tags explicites
autres que `latest`, les plugins tiers et les sources autres que npm restent inchangés.
Les installations depuis le catalogue créées par les versions actuelles d’OpenClaw conservent cette intention
par défaut. Les anciens enregistrements qui ne contiennent qu’une version exacte restent épinglés, car
OpenClaw ne peut pas distinguer de manière fiable un ancien épinglage automatique d’un épinglage effectué par l’utilisateur ; exécutez
`openclaw plugins update @openclaw/name` une fois sur le canal extended-stable
pour réactiver le suivi exact du cœur pour ce plugin.

`--channel dev` fournit un checkout GitHub `main` mobile et persistant. Pour une mise à jour ponctuelle
du paquet, `--tag main` correspond à la spécification de paquet `github:openclaw/openclaw#main`
et l’installe directement avec le gestionnaire de paquets cible (npm/pnpm/bun).

Pour les plugins gérés, l’absence d’une version bêta constitue un avertissement, et non un échec : la
mise à jour du cœur peut tout de même réussir tandis qu’un plugin revient à sa
version enregistrée par défaut/latest.

Consultez [Canaux de publication](/fr/install/development-channels) pour connaître la sémantique des canaux.

## Basculer entre les installations npm et git

Utilisez les canaux pour changer le type d’installation. Le programme de mise à jour conserve votre état, votre configuration,
vos identifiants et votre espace de travail dans `~/.openclaw` ; il modifie uniquement l’installation
du code OpenClaw utilisée par la CLI et le Gateway.

```bash
# installation du paquet npm -> checkout git modifiable
openclaw update --channel dev

# checkout git -> installation du paquet npm
openclaw update --channel stable
```

Prévisualisez d’abord le changement de mode d’installation :

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` garantit la présence d’un checkout git, le compile et installe la CLI globale depuis ce
checkout. Les canaux `stable`, `extended-stable` et `beta` utilisent des installations de
paquets. Extended-stable est refusé sur un checkout git sans le modifier ni
le convertir. Si le Gateway est déjà installé, `openclaw update` actualise
les métadonnées du service et le redémarre, sauf si vous transmettez `--no-restart`.

Pour les installations de paquets dotées d’un service Gateway géré, `openclaw update` cible
la racine du paquet utilisée par ce service. Si la commande shell `openclaw` provient
d’une autre installation, le programme de mise à jour affiche les deux racines et le chemin Node
du service géré, puis vérifie cette version de Node par rapport à l’exigence
`engines.node` de la version cible avant de remplacer le paquet.

## Autre possibilité : réexécuter le programme d’installation

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Ajoutez `--no-onboard` pour ignorer l’intégration initiale. Pour imposer un type d’installation particulier, transmettez
`--install-method git --no-onboard` ou `--install-method npm --no-onboard`.

Si `openclaw update` échoue après la phase d’installation du paquet npm, réexécutez plutôt le
programme d’installation. Il n’appelle pas le programme de mise à jour ; il exécute directement l’installation
globale du paquet et peut restaurer une installation npm partiellement mise à jour.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Épinglez la récupération sur une version ou un dist-tag spécifique avec `--version` :

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Autre possibilité : npm, pnpm ou bun manuellement

```bash
npm i -g openclaw@latest
```

Privilégiez `openclaw update` pour les installations supervisées : cette commande peut coordonner le remplacement
du paquet avec le service Gateway en cours d’exécution. Si vous effectuez une mise à jour manuelle sur une installation
supervisée, arrêtez d’abord le Gateway géré. Les gestionnaires de paquets remplacent les fichiers
sur place, et un Gateway en cours d’exécution pourrait sinon tenter de charger des fichiers du cœur ou de plugins
pendant le remplacement. Redémarrez le Gateway une fois le gestionnaire de paquets terminé afin qu’il prenne en compte
la nouvelle installation.

Pour une installation globale du système Linux appartenant à root, si `openclaw update` échoue avec
`EACCES`, effectuez la récupération avec le npm système tout en maintenant le Gateway arrêté pendant le
remplacement manuel. Utilisez les mêmes options de profil et variables d’environnement que celles habituellement utilisées pour
ce Gateway. Remplacez `/usr/bin/npm` par le npm système qui possède le
préfixe global appartenant à root sur votre hôte :

```bash
openclaw gateway stop
sudo /usr/bin/npm i -g openclaw@latest
openclaw gateway install --force
openclaw gateway restart
```

Vérifiez ensuite :

```bash
openclaw --version
curl -fsS http://127.0.0.1:18789/readyz
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

Lorsque `openclaw update` gère une installation npm globale, la cible est d’abord installée
dans un préfixe npm temporaire. Le paquet candidat valide la version de Node
de l’hôte pendant `preinstall` ; ce n’est qu’ensuite qu’OpenClaw vérifie l’inventaire
`dist` du paquet et remplace l’arborescence propre du paquet dans le préfixe global réel. Un
garde de fin d’empaquetage est omis de l’inventaire attendu et supprimé uniquement
après la réussite de `preinstall`, de sorte que les scripts de cycle de vie ignorés entraînent également un échec avant le
remplacement. Avec npm 12 et les versions ultérieures, le programme de mise à jour n’autorise que le cycle de vie
du paquet OpenClaw candidat ; les scripts des dépendances transitives restent bloqués. Cela évite que npm
superpose un nouveau paquet à des fichiers obsolètes de l’ancien. Si la commande
d’installation échoue, OpenClaw réessaie une fois avec `--omit=optional`, ce qui aide les hôtes
sur lesquels les dépendances facultatives natives ne peuvent pas être compilées.

Les commandes de mise à jour d’OpenClaw et des plugins gérées par OpenClaw désactivent également la
quarantaine de la chaîne d’approvisionnement `min-release-age` de npm (ou l’ancienne clé de configuration `before`)
pour le processus npm enfant. Cette politique assure une protection générale, mais une
mise à jour explicite d’OpenClaw signifie « installer maintenant la version sélectionnée ».

```bash
pnpm add -g openclaw@latest
```

Si pnpm 11 a installé OpenClaw 2026.7.1, exécutez cette commande manuelle une fois. Cette
version est antérieure à la disposition isolée des paquets globaux de pnpm 11 ; son programme de mise à jour peut donc
prendre une autre installation npm pour la CLI en cours d’exécution. Les versions ultérieures conservent
l’appartenance à pnpm et suivent la racine du paquet de remplacement pendant les mises à jour. Elles
utilisent également le répertoire global des exécutables indiqué par le gestionnaire propriétaire et s’arrêtent avant
toute modification lorsque la commande pnpm disponible signale une autre racine globale ou une autre version majeure,
ou lorsque le paquet appelant est orphelin ou n’est pas la seule installation OpenClaw active
à cet emplacement.

Si OpenClaw partage un groupe d’installation global pnpm 11 avec un autre paquet, le
programme de mise à jour automatique s’arrête avant de modifier le groupe. Mettez à jour manuellement le groupe
d’origine séparé par des virgules afin de préserver ses paquets frères et sa politique de compilation.

```bash
bun add -g openclaw@latest
```

### Sujets avancés concernant l’installation npm

<AccordionGroup>
  <Accordion title="Arborescence de paquets en lecture seule">
    OpenClaw traite les installations globales empaquetées comme étant en lecture seule lors de l’exécution, même lorsque le répertoire global des paquets est accessible en écriture par l’utilisateur actuel. Les installations de paquets de plugins résident dans des racines npm/git appartenant à OpenClaw sous le répertoire de configuration de l’utilisateur, et le démarrage du Gateway ne modifie pas l’arborescence des paquets OpenClaw.

    Certaines configurations npm sous Linux installent les paquets globaux dans des répertoires appartenant à root, tels que `/usr/lib/node_modules/openclaw`. OpenClaw prend en charge cette disposition, car les commandes d’installation et de mise à jour des plugins écrivent en dehors de ce répertoire global des paquets.

  </Accordion>
  <Accordion title="Unités systemd renforcées">
    Accordez à OpenClaw un accès en écriture à ses racines de configuration et d’état afin que les installations explicites de plugins, leurs mises à jour et le nettoyage effectué par doctor puissent enregistrer leurs modifications :

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Vérification préalable de l’espace disque">
    Avant les mises à jour de paquets et les installations explicites de plugins, OpenClaw tente d’effectuer une vérification au mieux de l’espace disque du volume cible. Un espace insuffisant produit un avertissement indiquant le chemin vérifié, mais ne bloque pas la mise à jour, car les quotas de système de fichiers, les instantanés et les volumes réseau peuvent changer après la vérification. L’installation effective par le gestionnaire de paquets et la vérification postérieure à l’installation restent déterminantes.
  </Accordion>
</AccordionGroup>

## Mise à jour automatique

Désactivée par défaut. Activez-la dans `~/.openclaw/openclaw.json` :

```json5
{
  update: {
    channel: "stable",
    auto: {
      enabled: true,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

| Canal             | Comportement                                                                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `stable`          | Attend `stableDelayHours` (valeur par défaut : 6), puis applique la mise à jour avec une gigue déterministe sur `stableJitterHours` (valeur par défaut : 12) afin d’échelonner le déploiement. |
| `extended-stable` | Recherche une indication de mise à jour en lecture seule au démarrage et toutes les 24 heures lorsque `checkOnStart` est activé. Ne l’applique jamais automatiquement. |
| `beta`            | Vérifie toutes les `betaCheckIntervalHours` (valeur par défaut : 1) et applique immédiatement la mise à jour.                                |
| `dev`             | Aucune application automatique. Utilisez `openclaw update` manuellement.                                                         |

Le Gateway consigne également une indication de mise à jour au démarrage (désactivez-la avec
`update.checkOnStart: false`). Les sélections extended-stable enregistrées utilisent ce
mécanisme d’indication en lecture seule et l’intervalle existant de 24 heures, mais ne déclenchent jamais
l’installation automatique, le transfert, le redémarrage, le délai/la gigue du canal stable ni l’interrogation du canal bêta.
Pour une rétrogradation ou une récupération après incident, définissez `OPENCLAW_NO_AUTO_UPDATE=1` dans l’environnement du Gateway afin de bloquer les applications automatiques, même lorsque `update.auto.enabled` est configuré. Les indications de mise à jour au démarrage peuvent toujours s’exécuter, sauf si `update.checkOnStart` est également désactivé.

Les mises à jour du gestionnaire de paquets demandées via le plan de contrôle du Gateway actif
(`update.run`) ne remplacent pas l’arborescence des paquets à l’intérieur du processus Gateway
en cours d’exécution. Sur les installations avec service géré, le Gateway lance un transfert détaché,
s’arrête et laisse le chemin normal de la CLI `openclaw update --yes --json` arrêter le
service, remplacer le paquet, actualiser les métadonnées du service, redémarrer, vérifier la
version et l’accessibilité du Gateway, et restaurer si possible un LaunchAgent macOS
installé mais non chargé. Si le Gateway ne peut pas effectuer ce transfert en toute sécurité,
`update.run` indique une commande shell sûre au lieu d’exécuter le gestionnaire de
paquets dans le processus.

La carte de mise à jour de la barre latérale de l’interface de contrôle affiche **Mettre à jour le Gateway** lorsqu’elle lance
directement ce flux `update.run`. Cela couvre l’interface de contrôle hébergée dans un navigateur, les
Gateways distants et les Gateways locaux gérés manuellement.

Dans l’application macOS signée, pour un Gateway local géré par l’application, cette carte devient
**Mettre à jour l’application Mac + le Gateway**. Sparkle met d’abord l’application à jour ; après son redémarrage, celle-ci
exécute `openclaw update --tag <app-version> --json`, redémarre son Gateway,
puis vérifie son état dans une fenêtre de progression semblable à celle de la configuration. Cette fenêtre apparaît uniquement
lorsque ce Gateway géré doit être mis à jour, réparé ou installé ; les mises à jour de l’application seule relancent
directement l’application. Les détails de l’échec restent visibles avec les actions Réessayer, [Guide de mise à jour](/fr/install/updating) et
[Discord](https://discord.gg/clawd). L’application n’utilise jamais ce
processus coordonné pour un Gateway distant ou géré en externe, ne rétrograde jamais un
Gateway plus récent et ne remplace jamais l’épinglage de canal `extended-stable`.

Lorsque la mise à jour réussit, l’application met en file d’attente un événement de bienvenue unique pour la
session directe de premier niveau la plus récente ayant eu une véritable interaction avec un utilisateur ou un canal. Les exécutions
Cron, les heartbeats et les mises à jour de sessions uniquement en arrière-plan ne modifient pas cette sélection. En
mode distant, l’application met uniquement à jour l’environnement d’exécution de son Node Mac local et envoie l’événement
seulement lorsque le Gateway distant connecté est au moins aussi récent que l’application.

## Après la mise à jour

<Steps>

### Exécuter doctor

```bash
openclaw doctor
```

Migre la configuration, audite les politiques de messages privés et vérifie l’état du Gateway. Détails : [Doctor](/fr/gateway/doctor)

### Redémarrer le Gateway

```bash
openclaw gateway restart
```

### Vérifier

```bash
openclaw health
```

</Steps>

## Restauration d’une version antérieure

La restauration comporte deux niveaux :

1. Réinstaller une ancienne version du code OpenClaw tout en conservant l’état actuel.
2. Restaurer l’état antérieur à la mise à jour uniquement lorsque l’ancien code ne peut pas utiliser une
   configuration ou une base de données migrée.

Commencez par restaurer uniquement le code. La restauration de l’état supprime les modifications apportées après
la sauvegarde.

### Avant la mise à jour : créer une sauvegarde vérifiée

`openclaw update` conserve une copie automatique de la configuration antérieure à la mise à jour, mais ne
crée pas de point de récupération complet de l’état. Avant une mise à jour importante, créez-en un
explicitement :

```bash
mkdir -p ~/Backups/openclaw
openclaw backup create --output ~/Backups/openclaw --verify
```

Le manifeste de l’archive enregistre la version d’OpenClaw et les chemins sources inclus
dans la sauvegarde. L’archive peut contenir des identifiants, des profils d’authentification et l’état des
canaux ; stockez-la donc avec des autorisations réservées au propriétaire et la même protection que le
répertoire de l’état actif. Consultez [Sauvegarde](/fr/cli/backup) pour connaître les fichiers inclus et ceux
qui sont intentionnellement omis.

Pour obtenir un point de récupération identique octet par octet qui inclut les artefacts volatils omis de
l’archive portable, arrêtez le Gateway et utilisez un instantané du système de fichiers, du volume ou de la machine virtuelle
fourni par votre plateforme.

### Restaurer une installation de paquet

Répertoriez les versions publiées, puis prévisualisez et installez la version fiable connue :

```bash
npm view openclaw versions --json
openclaw update --tag <known-good-version> --dry-run
openclaw update --tag <known-good-version>
```

`openclaw update --tag` est préférable à une installation directe avec le gestionnaire de paquets. Cette commande
détecte la rétrogradation, demande une confirmation, exécute la convergence des plugins gérés
et les vérifications de compatibilité avec la cible installée, actualise les métadonnées du
service, redémarre le Gateway et vérifie la version en cours d’exécution. Si le canal enregistré
est `extended-stable`, utilisez
`--channel stable --tag <known-good-version>`, car les balises ponctuelles exactes ne peuvent pas
être combinées avec le sélecteur `extended-stable`.

Les mises à jour de paquets préparent et vérifient la version candidate avant son activation. Si la
permutation du système de fichiers ou le remplacement du shim de commande échoue, OpenClaw restaure automatiquement
l’ancien paquet. Après une permutation réussie, un échec ultérieur de l’état du Gateway
signale la version précédente et fournit des instructions de restauration manuelle au lieu de
remplacer à nouveau automatiquement le paquet.

Si le processus de mise à jour de la CLI n’est pas disponible, utilisez le même gestionnaire de paquets et la même
portée d’installation que ceux qui gèrent le Gateway actuel :

```bash
openclaw gateway stop
npm i -g openclaw@<known-good-version>
openclaw gateway install --force
openclaw gateway restart
```

Remplacez `npm` par `pnpm` ou `bun` lorsque ce gestionnaire contrôle l’installation. Pendant
la récupération après incident, empêchez un outil de mise à jour automatique activé d’appliquer immédiatement une
version plus récente en définissant `OPENCLAW_NO_AUTO_UPDATE=1` dans l’environnement du Gateway.

### Restaurer une version antérieure d’un dépôt source

Utilisez un dépôt de travail propre et sélectionnez une balise ou un commit fiable connu :

```bash
git fetch --all --tags
git checkout --detach <known-good-tag-or-commit>
pnpm install && pnpm build
openclaw gateway restart
```

Pour revenir à la dernière version : `git checkout main && git pull`.

L’outil de mise à jour ramène automatiquement un dépôt de travail Git à sa branche et à son
SHA précédents lorsque l’installation des dépendances, la compilation, la compilation de l’interface ou doctor échoue après le début
d’une mise à jour Git. Une sélection manuelle reste nécessaire lorsque vous choisissez intentionnellement
un commit plus ancien.

### Rétrogradation au-delà de la migration des sessions vers SQLite

Avant de démarrer une ancienne version d’OpenClaw reposant sur des fichiers, utilisez la CLI actuelle pour
restaurer les artefacts archivés des anciennes transcriptions :

```bash
openclaw gateway stop
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

Cette opération ne supprime pas les données SQLite. Les sessions créées après la migration vers SQLite
existent uniquement dans SQLite et n’apparaîtront pas dans l’ancien environnement d’exécution. Consultez
[Rétrogradation après la migration des sessions vers SQLite](/fr/cli/doctor#downgrading-after-session-sqlite-migration).

### Restaurer l’état uniquement lorsque cela est nécessaire

Si l’ancien code ne peut pas lire une configuration ou un schéma de base de données plus récent, arrêtez le
Gateway et restaurez l’instantané vérifié du système de fichiers, du volume ou de la machine virtuelle antérieur à la mise à jour.
Conservez séparément l’état actuel avant la restauration, car celle-ci supprime les
modifications apportées après l’instantané.

Les archives étendues `openclaw backup create` prennent en charge la création et la vérification, mais
pas l’activation sur place de l’intégralité de l’archive. Extrayez une archive étendue dans un répertoire
de préparation et utilisez son mappage source-vers-archive `manifest.json` pour effectuer une restauration
hors ligne. `openclaw backup sqlite restore` écrit également une base de données vérifiée
vers une nouvelle cible ; l’activation de cette cible reste une étape hors ligne explicite à la charge de l’opérateur.

### Vérifier la restauration

```bash
openclaw --version
openclaw health
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

## En cas de blocage

- Exécutez de nouveau `openclaw doctor` et lisez attentivement la sortie.
- Pour `openclaw update --channel dev` dans les dépôts de travail source, l’outil de mise à jour initialise automatiquement `pnpm` lorsque cela est nécessaire. Si une erreur d’initialisation de pnpm/corepack apparaît, installez `pnpm` manuellement (ou réactivez `corepack`), puis relancez la mise à jour.
- Consultez : [Dépannage](/fr/gateway/troubleshooting)
- Demandez de l’aide sur Discord : [https://discord.gg/clawd](https://discord.gg/clawd)

## Pages connexes

- [Présentation de l’installation](/fr/install) : toutes les méthodes d’installation.
- [Doctor](/fr/gateway/doctor) : vérifications de l’état après les mises à jour.
- [Migration](/fr/install/migrating) : guides de migration entre versions majeures.
