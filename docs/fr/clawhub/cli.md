---
read_when:
    - Utiliser la CLI ClawHub
    - Débogage de l’installation, de la mise à jour ou de la publication
summary: 'Référence CLI : commandes, indicateurs, configuration et comportement du fichier de verrouillage.'
x-i18n:
    generated_at: "2026-06-28T00:10:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 70aabaeae7b205e0ef30de010624e18c471baf214ff5e07ac1db8139fccb1c27
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

Paquet CLI : `clawhub`, binaire : `clawhub`.

Installez-le globalement avec npm ou pnpm :

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

Puis vérifiez-le :

```bash
clawhub --help
clawhub login
clawhub whoami
```

## Indicateurs globaux

- `--workdir <dir>` : répertoire de travail (par défaut : cwd ; bascule vers l’espace de travail Clawdbot s’il est configuré)
- `--dir <dir>` : répertoire d’installation sous le répertoire de travail (par défaut : `skills`)
- `--site <url>` : URL de base pour la connexion par navigateur (par défaut : `https://clawhub.ai`)
- `--registry <url>` : URL de base de l’API (par défaut : découverte, sinon `https://clawhub.ai`)
- `--no-input` : désactiver les invites

Équivalents d’environnement :

- `CLAWHUB_SITE` (héritage `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (héritage `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (héritage `CLAWDHUB_WORKDIR`)

### Proxy HTTP

La CLI respecte les variables d’environnement de proxy HTTP standard pour les systèmes derrière
des proxys d’entreprise ou des réseaux restreints :

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

Lorsqu’une de ces variables est définie, la CLI achemine les requêtes sortantes via
le proxy indiqué. `HTTPS_PROXY` est utilisé pour les requêtes HTTPS, `HTTP_PROXY`
pour le HTTP simple. `NO_PROXY` / `no_proxy` est respecté pour contourner le proxy pour
des hôtes ou domaines spécifiques.

C’est nécessaire sur les systèmes où les connexions sortantes directes sont bloquées
(par exemple conteneurs Docker, VPS Hetzner avec Internet uniquement via proxy, pare-feu
d’entreprise).

Exemple :

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

Lorsqu’aucune variable de proxy n’est définie, le comportement est inchangé (connexions directes).

## Fichier de configuration

Stocke votre jeton d’API + l’URL de registre mise en cache.

- macOS : `~/Library/Application Support/clawhub/config.json`
- Linux/XDG : `$XDG_CONFIG_HOME/clawhub/config.json` ou `~/.config/clawhub/config.json`
- Windows : `%APPDATA%\\clawhub\\config.json`
- Repli hérité : si `clawhub/config.json` n’existe pas encore mais que `clawdhub/config.json` existe, la CLI réutilise le chemin hérité
- remplacement : `CLAWHUB_CONFIG_PATH` (héritage `CLAWDHUB_CONFIG_PATH`)

## Commandes

### `login` / `auth login`

- Par défaut : ouvre le navigateur sur `<site>/cli/auth` et termine via un rappel local loopback.
- Sans interface : `clawhub login --token clh_...`
- Interactif distant/sans interface : `clawhub login --device` affiche un code et attend pendant que vous l’autorisez sur `<site>/cli/device`.

### `whoami`

- Vérifie le jeton stocké via `/api/v1/whoami`.

### `token`

- Affiche le jeton d’API stocké sur stdout.
- Utile pour transmettre un jeton de connexion local à des commandes de configuration de secrets CI.

### `star <skill>` / `unstar <skill>`

- Ajoute/retire un Skill de vos éléments mis en avant.
- Appelle `POST /api/v1/stars/<slug>` et `DELETE /api/v1/stars/<slug>`.
- `--yes` ignore la confirmation.

### `search <query...>`

- Appelle `/api/v1/search?q=...`.
- La sortie inclut le `slug` du Skill, l’identifiant du propriétaire, le nom d’affichage et le score de pertinence.
- La recherche favorise les correspondances exactes de jetons `slug`/nom avant la popularité de téléchargement. Un jeton `slug` autonome comme `map` correspond plus fortement à `personal-map` que la sous-chaîne dans `amap`.
- La popularité est un petit a priori de classement, pas une garantie de placement en tête.
- Si un Skill devrait apparaître mais n’apparaît pas, exécutez `clawhub inspect @owner/slug` en étant connecté pour vérifier les diagnostics de modération visibles par le propriétaire avant de renommer les métadonnées.

### `explore`

- Liste les Skills les plus récents via `/api/v1/skills?limit=...&sort=createdAt` (triés par `createdAt` décroissant).
- Indicateurs :
  - `--limit <n>` (1-200, par défaut : 25)
  - `--sort newest|updated|rating|downloads|trending` (par défaut : newest). Les alias de tri d’installation hérités fonctionnent encore pour compatibilité.
  - `--json` (sortie lisible par machine)
- Sortie : `<slug>  v<version>  <age>  <summary>` (résumé tronqué à 50 caractères).

### `inspect @owner/slug`

- Récupère les métadonnées du Skill et les fichiers de version sans installer.
- `--version <version>` : inspecter une version spécifique (par défaut : latest).
- `--tag <tag>` : inspecter une version étiquetée (par exemple `latest`).
- `--versions` : lister l’historique des versions (première page).
- `--limit <n>` : nombre maximal de versions à lister (1-200).
- `--files` : lister les fichiers de la version sélectionnée.
- `--file <path>` : récupérer le contenu brut d’un fichier (fichiers texte uniquement ; limite de 200 Ko).
- `--json` : sortie lisible par machine.

### `install @owner/slug`

- Résout la dernière version pour le propriétaire et le Skill nommés.
- Télécharge le zip via `/api/v1/download`.
- Extrait dans `<workdir>/<dir>/<slug>`.
- Refuse d’écraser les Skills épinglés ; exécutez d’abord `clawhub unpin <skill>`.
- Écrit :
  - `<workdir>/.clawhub/lock.json` (héritage `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (héritage `.clawdhub`)

### `uninstall <skill>`

- Supprime `<workdir>/<dir>/<slug>` et retire l’entrée du fichier de verrouillage.
- Envoie une télémétrie au mieux lorsque vous êtes connecté afin que les décomptes d’installation actuels puissent être
  désactivés.
- Interactif : demande une confirmation.
- Non interactif (`--no-input`) : nécessite `--yes`.

### `list`

- Lit `<workdir>/.clawhub/lock.json` (héritage `.clawdhub`).
- Affiche `pinned` à côté des Skills gelés avec `clawhub pin`, y compris la raison facultative.

### `pin <skill>`

- Marque un Skill installé comme épinglé dans le fichier de verrouillage.
- `--reason <text>` enregistre pourquoi le Skill est gelé.
- Les Skills épinglés sont ignorés par `update --all` et rejetés par `update <skill>` direct.
- Les Skills épinglés rejettent aussi `install --force` afin que les octets locaux ne puissent pas être remplacés accidentellement.

### `unpin <skill>`

- Retire l’épingle du fichier de verrouillage d’un Skill installé afin que les futures mises à jour puissent le modifier.

### `update [@owner/slug]` / `update --all`

- Calcule l’empreinte à partir des fichiers locaux.
- Si l’empreinte correspond à une version connue : aucune invite.
- Si l’empreinte ne correspond pas :
  - refuse par défaut
  - écrase avec `--force` (ou invite, si interactif)
- Les Skills épinglés ne sont jamais mis à jour par `--force`.
- `update <skill>` échoue rapidement pour les Skills épinglés et vous indique d’exécuter d’abord `clawhub unpin <skill>`.
- `update --all` ignore les `slug` épinglés et affiche un résumé de ce qui est resté gelé.

### `skill publish <path>`

- Compare l’empreinte du bundle local avec ClawHub et se termine avec succès lorsque
  le contenu est déjà publié.
- Les nouveaux Skills utilisent par défaut `1.0.0` ; les Skills modifiés utilisent par défaut la prochaine version
  corrective.
- `--version <version>` sélectionne explicitement une version et publie même lorsque le
  contenu correspond à une version existante.
- `--dry-run` résout la publication sans téléverser ; `--json` affiche un résultat
  lisible par machine.
- `--owner <handle>` publie sous l’identifiant d’éditeur d’une organisation/d’un utilisateur lorsque
  l’acteur dispose d’un accès éditeur.
- `--migrate-owner` déplace un Skill existant vers `--owner` lors de la publication d’une nouvelle
  version. Nécessite un accès administrateur/propriétaire sur les deux éditeurs.
- Le comportement de propriétaire et de revue est expliqué dans `docs/publishing.md`.
- Publier un Skill signifie qu’il est publié sous `MIT-0` sur ClawHub.
- Les Skills publiés sont libres d’utilisation, de modification et de redistribution sans attribution.
- ClawHub ne prend pas en charge les Skills payants ni la tarification par Skill.
- Alias hérité : `publish <path>`.

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

Le workflow réutilisable de ClawHub
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
appelle `skill publish` pour un `skill_path`, ou pour chaque dossier de Skill immédiat
sous `root` (par défaut : `skills`). Il ignore les Skills inchangés et utilise le
même comportement automatique de version corrective.

Définissez `dry_run: true` pour prévisualiser sans jeton. Les publications réelles nécessitent le
secret `clawhub_token`.

### `sync`

- Analyse le répertoire de travail courant, le répertoire Skills configuré et tout
  dossier `--root <dir>` à la recherche de dossiers de Skills locaux contenant `SKILL.md` ou
  `skill.md`.
- Compare l’empreinte de chaque Skill local avec ClawHub et ne publie que les Skills nouveaux ou
  modifiés.
- Les nouveaux Skills sont publiés en `1.0.0` ; les Skills modifiés publient par défaut la version corrective suivante. Utilisez `--bump minor|major` pour les lots de mises à jour qui doivent passer à une
  étape semver plus importante.
- `--dry-run` affiche le plan de publication sans téléverser ; `--json` affiche un plan
  lisible par machine.
- `--all` publie chaque Skill nouveau ou modifié sans invite. Sans
  `--all`, les terminaux interactifs vous permettent de sélectionner les Skills à publier.
- `--owner <handle>` publie sous l’identifiant d’éditeur d’une organisation/d’un utilisateur lorsque
  l’acteur dispose d’un accès éditeur.
- `sync` est uniquement une publication à sens unique. Il n’installe pas, ne met pas à jour, ne télécharge pas et ne
  rapporte pas de télémétrie d’installation/téléchargement.

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- Nécessite `clawhub login`.
- Exécute ClawHub ClawScan via `POST /api/v1/skills/-/scan`, puis interroge jusqu’à ce que l’analyse soit terminale.
- Les analyses sont asynchrones et peuvent prendre du temps. Pendant la file d’attente, l’indicateur terminal affiche la position actuelle d’analyse priorisée et le nombre d’analyses en attente avant elle.
- Les analyses publiées nécessitent la propriété ou un accès de gestion éditeur. Les modérateurs/administrateurs peuvent utiliser le même backend via `clawhub-admin`.
- `--update` est valide uniquement avec `--slug` ; il réécrit les résultats d’analyse publiés réussis dans la version sélectionnée.
- `--output <file.zip>` télécharge l’archive complète du rapport avec `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` et `README.md`.
- `--json` affiche la réponse d’interrogation complète pour l’automatisation.
- Les analyses de chemins locaux ne sont plus prises en charge. Téléversez une nouvelle version, puis utilisez `scan download` pour récupérer les résultats d’analyse stockés pour cette version soumise.

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- Nécessite `clawhub login`.
- Télécharge le ZIP du rapport d’analyse stocké pour une version de Skill ou de Plugin soumise, y compris les versions bloquées ou masquées par les contrôles de sécurité de ClawHub.
- Les téléchargements de Skills utilisent le `slug` du Skill et utilisent par défaut `--kind skill`.
- Les téléchargements de Plugins utilisent le nom du paquet et nécessitent `--kind plugin`.
- `--version` est obligatoire afin que les auteurs inspectent la version soumise exacte que ClawHub a bloquée.
- `--output <file.zip>` choisit le chemin de destination.

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub fournit un workflow réutilisable officiel à
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/8f98128aab28627477a3858081a13b76cba6f5d6/.github/workflows/skill-publish.yml)
pour les dépôts de Skills et les dépôts de catalogues.

Configuration de catalogue typique :

```yaml
name: Skill Publish

on:
  pull_request:
  workflow_dispatch:

jobs:
  dry-run:
    if: github.event_name == 'pull_request'
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@v1
    with:
      owner: nvidia
      dry_run: true

  publish:
    if: github.event_name == 'workflow_dispatch'
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@v1
    with:
      owner: nvidia
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

Notes :

- `root` utilise par défaut `skills` pour les dépôts de catalogues.
- Passez `skill_path: skills/review-helper` pour traiter un seul dossier de Skill.
- `owner` correspond à l’indicateur CLI `--owner` ; omettez-le pour publier en tant qu’utilisateur authentifié.
- La publication de Skills V1 utilise `clawhub_token` ; la publication de confiance OIDC GitHub est réservée aux paquets pour le moment.

### `delete <skill>`

- Sans `--version`, supprimez temporairement une skill (propriétaire, modérateur ou administrateur).
- Appelle `DELETE /api/v1/skills/{slug}`.
- Les suppressions temporaires initiées par le propriétaire réservent le slug pendant 30 jours ; la commande affiche l’heure d’expiration.
- `--version <version>` supprime définitivement une version possédée non la plus récente via une route à fermeture sécurisée
  spécifique à la version.
  Les versions supprimées ne peuvent pas être restaurées ni republiées. Publiez un remplacement avant de supprimer la
  version actuellement la plus récente. Le personnel de la plateforme ne contourne pas la propriété pour ce flux limité aux versions.
- `--reason <text>` enregistre une note de modération sur une suppression temporaire complète de skill et dans le journal d’audit.
- `--note <text>` est un alias de `--reason`.
- `--yes` ignore la confirmation.

### `undelete <skill>`

- Restaurez une skill masquée (propriétaire, modérateur ou administrateur).
- Il n’existe pas de restauration de version ; les versions supprimées définitivement ne peuvent pas être restaurées.
- Appelle `POST /api/v1/skills/{slug}/undelete`.
- `--reason <text>` enregistre une note de modération sur la skill et dans le journal d’audit.
- `--note <text>` est un alias de `--reason`.
- `--yes` ignore la confirmation.

### `hide <skill>`

- Masquez une skill (propriétaire, modérateur ou administrateur).
- Alias de `delete`.

### `unhide <skill>`

- Réaffichez une skill (propriétaire, modérateur ou administrateur).
- Alias de `undelete`.

### `skill rename <skill> <new-name>`

- Renommez une skill possédée et conservez le slug précédent comme alias de redirection.
- Appelle `POST /api/v1/skills/{slug}/rename`.
- `--yes` ignore la confirmation.

### `skill merge <source> <target>`

- Fusionnez une skill possédée dans une autre skill possédée.
- Le slug source cesse d’être listé publiquement et devient un alias de redirection vers la cible.
- Appelle `POST /api/v1/skills/{sourceSlug}/merge`.
- `--yes` ignore la confirmation.

### `transfer`

- Flux de transfert de propriété.
- Les transferts vers des identifiants utilisateur créent une demande en attente que le destinataire accepte.
- Les transferts vers des identifiants d’organisation/de publisher s’appliquent immédiatement uniquement lorsque l’acteur dispose
  d’un accès administrateur à la fois au propriétaire actuel et au publisher de destination.
- Sous-commandes :
  - `transfer request <skill> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <skill> [--yes]`
  - `transfer reject <skill> [--yes]`
  - `transfer cancel <skill> [--yes]`
- Points de terminaison :
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- Parcourt ou recherche le catalogue de packages unifié via `GET /api/v1/packages` et `GET /api/v1/packages/search`.
- Utilisez ceci pour les plugins et les autres entrées de familles de packages ; `search` de premier niveau reste la surface de recherche des skills.
- Indicateurs :
  - `--family skill|code-plugin|bundle-plugin`
  - `--official`
  - `--executes-code`
  - `--target <target>`, `--os <os>`, `--arch <arch>`, `--libc <libc>`
  - `--requires-browser`, `--requires-desktop`, `--requires-native-deps`
  - `--requires-external-service`, `--external-service <name>`
  - `--binary <name>`, `--os-permission <name>`
  - `--artifact-kind legacy-zip|npm-pack`
  - `--npm-mirror`
  - `--limit <n>` (1-100, valeur par défaut : 25)
  - `--json`

Exemples :

```bash
clawhub package explore --family code-plugin
clawhub package explore --family code-plugin --os darwin --requires-desktop
clawhub package explore --family code-plugin --artifact-kind npm-pack
clawhub package explore --npm-mirror
clawhub package explore episodic-claw --family code-plugin
```

### `package inspect <name>`

- Récupère les métadonnées de package sans installer.
- Utilisez ceci pour les métadonnées de plugin, la compatibilité, la vérification, la source et l’inspection des versions/fichiers.
- `--version <version>` : inspecter une version spécifique (par défaut : la plus récente).
- `--tag <tag>` : inspecter une version étiquetée (par exemple `latest`).
- `--versions` : lister l’historique des versions (première page).
- `--limit <n>` : nombre maximal de versions à lister (1-100).
- `--files` : lister les fichiers de la version sélectionnée.
- `--file <path>` : récupérer le contenu brut du fichier (fichiers texte uniquement ; limite de 200 Ko).
- `--json` : sortie lisible par machine.

### `package download <name>`

- Résout une version de package via
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- Télécharge l’artefact depuis le `downloadUrl` du résolveur.
- Vérifie le SHA-256 ClawHub pour tous les artefacts.
- Pour les artefacts ClawPack npm-pack, vérifie aussi l’intégrité npm `sha512`,
  le shasum npm, ainsi que le nom/la version du `package.json` du tarball.
- Les versions ZIP héritées sont téléchargées via la route ZIP héritée.
- Indicateurs :
  - `--version <version>` : télécharger une version spécifique.
  - `--tag <tag>` : télécharger une version étiquetée (par défaut : `latest`).
  - `-o, --output <path>` : fichier ou répertoire de sortie.
  - `--force` : écraser un fichier de sortie existant.
  - `--json` : sortie lisible par machine.

Exemples :

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- Calcule le SHA-256 ClawHub, l’intégrité npm `sha512` et le shasum npm pour un artefact
  local.
- Avec `--package`, résout les métadonnées attendues depuis ClawHub et compare le
  fichier local aux métadonnées de l’artefact publié.
- Avec des indicateurs de condensé directs, vérifie sans recherche réseau.
- Indicateurs :
  - `--package <name>` : nom du package pour résoudre les métadonnées d’artefact attendues.
  - `--version <version>` ou `--tag <tag>` : version de package attendue.
  - `--sha256 <hex>` : SHA-256 ClawHub attendu.
  - `--npm-integrity <sri>` : intégrité npm attendue.
  - `--npm-shasum <sha1>` : shasum npm attendu.
  - `--json` : sortie lisible par machine.

Exemples :

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- Exécute le Plugin Inspector intégré à la CLI ClawHub sur un dossier de package de plugin
  local.
- Utilise par défaut une validation hors ligne/statique, sans localiser ni importer un checkout OpenClaw
  local.
- Les erreurs de compatibilité critiques se terminent avec un code non nul. Les constats limités à des avertissements sont affichés mais
  se terminent avec un code zéro.
- Indicateurs :
  - `--out <dir>` : écrire les rapports du Plugin Inspector dans ce répertoire.
  - `--openclaw <path>` : inspecter avec un checkout OpenClaw local explicite.
  - `--runtime` : activer la capture d’exécution ; importe le code du plugin.
  - `--allow-execute` : autoriser la capture d’exécution dans un espace de travail isolé.
  - `--no-mock-sdk` : désactiver le SDK OpenClaw simulé pendant la capture d’exécution.
  - `--json` : sortie lisible par machine.

Exemple :

```bash
clawhub package validate ./example-plugin
```

Si la validation signale un constat lié au package, au manifeste, à l’import du SDK ou à l’artefact, consultez
[correctifs de validation des plugins](/fr/clawhub/plugin-validation-fixes), puis relancez la commande.

### `package delete <name>`

- Sans `--version`, effectue une suppression réversible d’un package et de toutes ses versions.
- `--version <version>` supprime définitivement une version détenue qui n’est pas la dernière via une route à échec fermé,
  spécifique à la version.
  Les versions supprimées ne peuvent pas être restaurées ni republiées. Publiez un remplacement avant de supprimer la
  version actuellement la plus récente. Ce flux limité à une version nécessite le propriétaire du package ou un
  administrateur d’éditeur d’organisation ; le personnel de la plateforme ne contourne pas la propriété du package.
- La suppression réversible d’un package entier nécessite le propriétaire du package, un propriétaire/administrateur
  d’éditeur d’organisation, un modérateur de plateforme ou un administrateur de plateforme.
- Options :
  - `--version <version>` : supprimer définitivement une version qui n’est pas la dernière.
  - `--yes` : ignorer la confirmation.
  - `--json` : sortie lisible par machine.

Exemple :

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- Restaure un package supprimé de manière réversible et ses versions.
- Il n’existe pas d’annulation de suppression de version ; les versions supprimées définitivement ne peuvent pas être restaurées.
- Nécessite le propriétaire du package, un propriétaire/administrateur d’éditeur d’organisation, un modérateur de plateforme,
  ou un administrateur de plateforme.
- Appelle `POST /api/v1/packages/{name}/undelete`.
- Options :
  - `--yes` : ignorer la confirmation.
  - `--json` : sortie lisible par machine.

Exemple :

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- Transfère un package vers un autre éditeur.
- Nécessite un accès administrateur à la fois au propriétaire actuel du package et à l’éditeur
  de destination, sauf si l’opération est effectuée par un administrateur de plateforme.
- Les noms de package avec portée doivent être transférés au propriétaire de portée correspondant.
- Appelle `POST /api/v1/packages/{name}/transfer`.
- Options :
  - `--to <owner>` : identifiant de l’éditeur de destination.
  - `--reason <text>` : motif d’audit facultatif.
  - `--json` : sortie lisible par machine.

Exemple :

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- Commande authentifiée pour signaler un package aux modérateurs.
- Appelle `POST /api/v1/packages/{name}/report`.
- Les signalements s’appliquent au niveau du package, peuvent être associés à une version, et deviennent visibles
  par les modérateurs pour examen.
- Les signalements ne masquent pas automatiquement les packages et ne bloquent pas les téléchargements à eux seuls.
- Options :
  - `--version <version>` : version facultative du package à joindre au signalement.
  - `--reason <text>` : motif de signalement requis.
  - `--json` : sortie lisible par machine.

Exemple :

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- Commande de propriétaire pour vérifier la visibilité de modération d’un package.
- Appelle `GET /api/v1/packages/{name}/moderation`.
- Affiche l’état actuel d’analyse du package, le nombre de signalements ouverts, l’état de modération manuelle de la dernière version,
  l’état de blocage des téléchargements et les motifs de modération.
- Options :
  - `--json` : sortie lisible par machine.

Exemple :

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Vérifie si un package est prêt pour une future consommation par OpenClaw.
- Appelle `GET /api/v1/packages/{name}/readiness`.
- Signale les blocages concernant le statut officiel, la disponibilité de ClawPack, le condensat d’artefact,
  la provenance de la source, la compatibilité OpenClaw, les cibles hôtes, les métadonnées d’environnement
  et l’état d’analyse.
- Options :
  - `--json` : sortie lisible par machine.

Exemple :

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Affiche l’état de migration orienté opérateur pour un package susceptible de remplacer un
  Plugin OpenClaw intégré.
- Appelle le même point de terminaison de préparation calculée que `package readiness`, mais affiche
  l’état axé sur la migration, la dernière version, l’état de package officiel, les vérifications et
  les blocages.
- Options :
  - `--json` : sortie lisible par machine.

Exemple :

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- Crée un éditeur d’organisation détenu par l’utilisateur authentifié.
- L’identifiant est normalisé en minuscules et peut être fourni avec ou sans `@`.
- Les éditeurs d’organisation nouvellement créés ne sont pas approuvés/officiels par défaut.
- Échoue si l’identifiant est déjà utilisé par un éditeur existant, un utilisateur ou une route réservée.

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- Publie un Plugin de code ou un Plugin groupé via `POST /api/v1/packages`.
- `<source>` accepte :
  - Chemin de dossier local : `./my-plugin`
  - Archive tarball npm-pack ClawPack locale : `./my-plugin-1.2.3.tgz`
  - Dépôt GitHub : `owner/repo` ou `owner/repo@ref`
  - URL GitHub : `https://github.com/owner/repo`
- Les métadonnées sont détectées automatiquement depuis `package.json`, `openclaw.plugin.json` et
  les vrais marqueurs de bundle OpenClaw comme `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` et `.cursor-plugin/plugin.json`.
- Les sources `.tgz` sont traitées comme ClawPack. La CLI téléverse les octets
  npm-pack exacts et utilise le contenu `package/` extrait uniquement pour la validation et
  le préremplissage des métadonnées.
- Les dossiers de Plugins de code sont empaquetés dans une archive tarball npm ClawPack avant le téléversement afin que
  les installations OpenClaw puissent vérifier l’artefact exact. Les dossiers de Plugins groupés
  utilisent toujours le chemin de publication par fichiers extraits.
- Pour les sources GitHub, l’attribution de la source est remplie automatiquement à partir du dépôt, du commit résolu, de la référence et du sous-chemin.
- Pour les dossiers locaux, l’attribution de la source est détectée automatiquement depuis git local lorsque le remote d’origine pointe vers GitHub.
- Les Plugins de code externes doivent déclarer explicitement `openclaw.compat.pluginApi` et
  `openclaw.build.openclawVersion`.
  Le champ de premier niveau `package.json.version` n’est pas utilisé comme solution de repli pour la validation de publication.
- `--dry-run` prévisualise la charge utile de publication résolue sans téléversement.
- `--json` émet une sortie lisible par machine pour la CI.
- `--owner <handle>` publie sous un identifiant d’éditeur utilisateur ou organisation lorsque l’acteur dispose de l’accès éditeur.
- Les noms de packages avec portée doivent correspondre au propriétaire sélectionné. Voir `docs/publishing.md`.
- Les indicateurs existants (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) fonctionnent toujours comme remplacements.
- Les dépôts GitHub privés nécessitent `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### Flux local recommandé

Utilisez d’abord `--dry-run` afin de confirmer les métadonnées de package résolues et
l’attribution de la source avant de créer une version réelle :

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Flux de dossier local

Pour les Plugins de code, la publication depuis un dossier construit et téléverse un artefact ClawPack à partir
du dossier de package :

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `package.json` minimal pour `--family code-plugin`

Les Plugins de code externes ont besoin d’une petite quantité de métadonnées OpenClaw dans
`package.json`. Ce manifeste minimal suffit pour une publication réussie :

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2"
    }
  }
}
```

Champs requis :

- `openclaw.compat.pluginApi`
- `openclaw.build.openclawVersion`

Notes :

- `package.json.version` est la version de publication de votre package, mais elle n’est pas utilisée comme
  solution de repli pour la validation de compatibilité/construction OpenClaw.
- `openclaw.hostTargets` et `openclaw.environment` sont des métadonnées facultatives.
  ClawHub peut les afficher lorsqu’elles sont présentes, mais elles ne sont pas requises pour la publication.
- `openclaw.compat.minGatewayVersion` et
  `openclaw.build.pluginSdkVersion` sont des compléments facultatifs si vous souhaitez publier
  des métadonnées de compatibilité plus détaillées.
- Si vous utilisez une ancienne version de la CLI `clawhub`, mettez-la à niveau avant de publier afin que
  les vérifications préalables locales s’exécutent avant le téléversement.
- Si la validation signale un code de remédiation, consultez
  [Correctifs de validation des Plugins](/fr/clawhub/plugin-validation-fixes).

#### GitHub Actions

ClawHub fournit également un workflow réutilisable officiel à
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/8f98128aab28627477a3858081a13b76cba6f5d6/.github/workflows/package-publish.yml)
pour les dépôts de Plugins.

Configuration d’appel typique :

```yaml
name: Package Publish

on:
  pull_request:
  workflow_dispatch:
  push:
    tags:
      - "v*"

jobs:
  dry-run:
    if: github.event_name == 'pull_request'
    uses: openclaw/clawhub/.github/workflows/package-publish.yml@v0.12.0
    with:
      dry_run: true

  publish:
    if: github.event_name == 'workflow_dispatch' || startsWith(github.ref, 'refs/tags/')
    permissions:
      contents: read
      id-token: write
    uses: openclaw/clawhub/.github/workflows/package-publish.yml@v0.12.0
    with:
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

Notes :

- Le workflow réutilisable définit par défaut `source` sur le dépôt appelant.
- Pour les monorepos, transmettez `source_path` afin que le workflow publie le dossier de package du Plugin,
  par exemple `source_path: extensions/codex`.
- Épinglez le workflow réutilisable à une étiquette stable ou à un SHA de commit complet. N’exécutez pas la publication de versions depuis `@main`.
- `pull_request` doit utiliser `dry_run: true` afin que la CI reste non polluante.
- Les publications réelles doivent être limitées aux événements approuvés tels que `workflow_dispatch` ou les poussées d’étiquettes.
- La publication approuvée sans secret fonctionne uniquement sur `workflow_dispatch` ; les poussées d’étiquettes nécessitent toujours `clawhub_token`.
- Gardez `clawhub_token` disponible pour la première publication, les packages non approuvés ou les publications d’urgence.
- Le workflow téléverse le résultat JSON comme artefact et l’expose comme sorties de workflow.

### `package trusted-publisher get <name>`

- Affiche la configuration d’éditeur approuvé GitHub Actions pour un package.
- Utilisez ceci après avoir défini la configuration pour confirmer le dépôt, le nom de fichier du workflow
  et l’épinglage facultatif de l’environnement.
- Indicateurs :
  - `--json` : sortie lisible par machine.

Exemple :

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- Attache ou remplace la configuration d’éditeur approuvé GitHub Actions pour un package
  existant.
- Le package doit d’abord être créé via une publication `clawhub package publish`
  normale, manuelle ou authentifiée par jeton.
- Une fois la configuration définie, les publications GitHub Actions futures prises en charge peuvent utiliser
  OIDC/la publication approuvée sans jeton ClawHub à longue durée de vie.
- `--repository <repo>` doit être `owner/repo`.
- `--workflow-filename <file>` doit correspondre au nom du fichier de workflow dans
  `.github/workflows/`.
- `--environment <name>` est facultatif. Lorsqu’il est configuré, l’environnement GitHub Actions
  dans la revendication OIDC doit correspondre exactement.
- ClawHub vérifie le dépôt GitHub configuré lorsque cette commande s’exécute.
  Les dépôts publics peuvent être vérifiés via les métadonnées publiques GitHub. Les dépôts
  privés nécessitent que ClawHub ait accès à ce dépôt GitHub, par
  exemple via une future installation de l’application GitHub ClawHub ou une autre intégration
  GitHub autorisée.
- Indicateurs :
  - `--repository <repo>` : dépôt GitHub, par exemple `openclaw/example-plugin`.
  - `--workflow-filename <file>` : nom du fichier de workflow, par exemple `package-publish.yml`.
  - `--environment <name>` : environnement GitHub Actions facultatif à correspondance exacte.
  - `--json` : sortie lisible par machine.

Exemple :

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- Supprime la configuration d’éditeur approuvé d’un package.
- Utilisez ceci comme restauration si le workflow, le dépôt ou l’épinglage d’environnement doit
  être désactivé ou recréé.
- Les publications réelles futures doivent utiliser la publication authentifiée normale jusqu’à ce que la configuration soit
  de nouveau définie.
- Indicateurs :
  - `--json` : sortie lisible par machine.

Exemple :

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### Télémétrie d’installation

- Envoyée après `clawhub install <slug>` lorsque vous êtes connecté, sauf si
  `CLAWHUB_DISABLE_TELEMETRY=1` est défini.
- Le signalement est fait au mieux. Les commandes d’installation n’échouent pas si la télémétrie est
  indisponible.
- Détails : `docs/telemetry.md`.
