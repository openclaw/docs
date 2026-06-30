---
read_when:
    - Utiliser la CLI ClawHub
    - Déboguer l’installation, la mise à jour ou la publication
summary: 'Référence CLI : commandes, options, configuration et comportement du fichier de verrouillage.'
x-i18n:
    generated_at: "2026-06-30T13:58:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 63cdf64a1d5abe87ee475869fdb199053b7b4374962b03e91e822ddef3cad8e8
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

## Options globales

- `--workdir <dir>` : répertoire de travail (par défaut : cwd ; se rabat sur l’espace de travail Clawdbot s’il est configuré)
- `--dir <dir>` : répertoire d’installation sous le répertoire de travail (par défaut : `skills`)
- `--site <url>` : URL de base pour la connexion dans le navigateur (par défaut : `https://clawhub.ai`)
- `--registry <url>` : URL de base de l’API (par défaut : découverte, sinon `https://clawhub.ai`)
- `--no-input` : désactive les invites

Équivalents d’environnement :

- `CLAWHUB_SITE` (ancien `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (ancien `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (ancien `CLAWDHUB_WORKDIR`)

### Proxy HTTP

La CLI respecte les variables d’environnement de proxy HTTP standard pour les systèmes derrière
des proxys d’entreprise ou des réseaux restreints :

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

Lorsqu’une de ces variables est définie, la CLI achemine les requêtes sortantes via
le proxy spécifié. `HTTPS_PROXY` est utilisé pour les requêtes HTTPS, `HTTP_PROXY`
pour le HTTP simple. `NO_PROXY` / `no_proxy` est respecté pour contourner le proxy pour
des hôtes ou domaines spécifiques.

C’est nécessaire sur les systèmes où les connexions sortantes directes sont bloquées
(p. ex. conteneurs Docker, VPS Hetzner avec accès Internet uniquement via proxy, pare-feu
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
- Repli ancien : si `clawhub/config.json` n’existe pas encore mais que `clawdhub/config.json` existe, la CLI réutilise l’ancien chemin
- remplacement : `CLAWHUB_CONFIG_PATH` (ancien `CLAWDHUB_CONFIG_PATH`)

## Commandes

### `login` / `auth login`

- Par défaut : ouvre le navigateur vers `<site>/cli/auth` et termine via un rappel local loopback.
- Sans interface : `clawhub login --token clh_...`
- Interactif distant/sans interface : `clawhub login --device` affiche un code et attend pendant que vous l’autorisez sur `<site>/cli/device`.

### `whoami`

- Vérifie le jeton stocké via `/api/v1/whoami`.

### `token`

- Affiche le jeton d’API stocké sur stdout.
- Utile pour transmettre un jeton de connexion local à des commandes de configuration de secrets CI.

### `star <skill>` / `unstar <skill>`

- Ajoute/retire une Skill de vos mises en avant.
- Appelle `POST /api/v1/stars/<slug>` et `DELETE /api/v1/stars/<slug>`.
- `--yes` ignore la confirmation.

### `search <query...>`

- Appelle `/api/v1/search?q=...`.
- La sortie inclut le slug de la Skill, l’identifiant du propriétaire, le nom d’affichage et le score de pertinence.
- La recherche favorise les correspondances exactes de jetons de slug/nom avant la popularité des téléchargements. Un jeton de slug autonome comme `map` correspond plus fortement à `personal-map` qu’à la sous-chaîne dans `amap`.
- La popularité est un faible a priori de classement, pas une garantie de première position.
- Si une Skill devrait apparaître mais n’apparaît pas, exécutez `clawhub inspect @owner/slug` une fois connecté pour vérifier les diagnostics de modération visibles par le propriétaire avant de renommer les métadonnées.

### `explore`

- Liste les Skills les plus récentes via `/api/v1/skills?limit=...&sort=createdAt` (triées par `createdAt` décroissant).
- Options :
  - `--limit <n>` (1-200, par défaut : 25)
  - `--sort newest|updated|rating|downloads|trending` (par défaut : newest). Les anciens alias de tri d’installation fonctionnent encore pour compatibilité.
  - `--json` (sortie lisible par machine)
- Sortie : `<slug>  v<version>  <age>  <summary>` (résumé tronqué à 50 caractères).

### `inspect @owner/slug`

- Récupère les métadonnées de la Skill et les fichiers de version sans installer.
- `--version <version>` : inspecte une version spécifique (par défaut : latest).
- `--tag <tag>` : inspecte une version étiquetée (p. ex. `latest`).
- `--versions` : liste l’historique des versions (première page).
- `--limit <n>` : nombre maximal de versions à lister (1-200).
- `--files` : liste les fichiers pour la version sélectionnée.
- `--file <path>` : récupère le contenu brut du fichier (fichiers texte uniquement ; limite de 200 Ko).
- `--json` : sortie lisible par machine.

### `install @owner/slug`

- Résout la dernière version pour le propriétaire et la Skill nommés.
- Télécharge le zip via `/api/v1/download`.
- Extrait dans `<workdir>/<dir>/<slug>`.
- Refuse d’écraser les Skills épinglées ; exécutez d’abord `clawhub unpin <skill>`.
- Écrit :
  - `<workdir>/.clawhub/lock.json` (ancien `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (ancien `.clawdhub`)

### `uninstall <skill>`

- Supprime `<workdir>/<dir>/<slug>` et efface l’entrée du fichier de verrouillage.
- Envoie de la télémétrie au mieux pendant que vous êtes connecté, afin que les compteurs d’installation actuels puissent être
  désactivés.
- Interactif : demande une confirmation.
- Non interactif (`--no-input`) : nécessite `--yes`.

### `list`

- Lit `<workdir>/.clawhub/lock.json` (ancien `.clawdhub`).
- Affiche `pinned` à côté des Skills gelées avec `clawhub pin`, y compris la raison facultative.

### `pin <skill>`

- Marque une Skill installée comme épinglée dans le fichier de verrouillage.
- `--reason <text>` enregistre pourquoi la Skill est gelée.
- Les Skills épinglées sont ignorées par `update --all` et rejetées par `update <skill>` direct.
- Les Skills épinglées rejettent aussi `install --force` afin que les octets locaux ne puissent pas être remplacés accidentellement.

### `unpin <skill>`

- Retire l’épinglage du fichier de verrouillage pour une Skill installée afin que les futures mises à jour puissent la modifier.

### `update [@owner/slug]` / `update --all`

- Calcule l’empreinte à partir des fichiers locaux.
- Si l’empreinte correspond à une version connue : aucune invite.
- Si l’empreinte ne correspond pas :
  - refuse par défaut
  - écrase avec `--force` (ou invite, si interactif)
- Les Skills épinglées ne sont jamais mises à jour par `--force`.
- `update <skill>` échoue rapidement pour les Skills épinglées et vous indique d’exécuter d’abord `clawhub unpin <skill>`.
- `update --all` ignore les slugs épinglés et affiche un résumé de ce qui est resté gelé.

### `skill publish <path>`

- Compare l’empreinte du paquet local avec ClawHub et se termine avec succès lorsque
  le contenu est déjà publié.
- Les nouvelles Skills utilisent `1.0.0` par défaut ; les Skills modifiées utilisent par défaut la version de correctif suivante.
- `--version <version>` sélectionne explicitement une version et publie même lorsque le
  contenu correspond à une version existante.
- `--dry-run` résout la publication sans téléversement ; `--json` affiche un résultat
  lisible par machine.
- `--owner <handle>` publie sous l’identifiant d’un éditeur d’organisation/utilisateur lorsque
  l’acteur dispose de l’accès éditeur.
- `--migrate-owner` déplace une Skill existante vers `--owner` tout en publiant une nouvelle
  version. Nécessite un accès admin/propriétaire sur les deux éditeurs.
- Le comportement de propriétaire et de revue est expliqué dans `docs/publishing.md`.
- Publier une Skill signifie qu’elle est publiée sous `MIT-0` sur ClawHub.
- Les Skills publiées sont libres d’utilisation, de modification et de redistribution sans attribution.
- ClawHub ne prend pas en charge les Skills payantes ni la tarification par Skill.
- Ancien alias : `publish <path>`.

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

Le workflow réutilisable
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
de ClawHub appelle `skill publish` pour un `skill_path`, ou pour chaque dossier de Skill immédiat
sous `root` (par défaut : `skills`). Il ignore les Skills inchangées et utilise le
même comportement automatique de version de correctif.

Définissez `dry_run: true` pour prévisualiser sans jeton. Les publications réelles nécessitent le
secret `clawhub_token`.

### `sync`

- Analyse le répertoire de travail actuel, le répertoire de Skills configuré et tous les
  dossiers `--root <dir>` à la recherche de dossiers de Skills locaux contenant `SKILL.md` ou
  `skill.md`.
- Compare l’empreinte de chaque Skill locale avec ClawHub et publie uniquement les Skills nouvelles ou
  modifiées.
- Les nouvelles Skills sont publiées en `1.0.0` ; les Skills modifiées publient la version de correctif suivante
  par défaut. Utilisez `--bump minor|major` pour les lots de mises à jour qui doivent avancer d’une
  étape semver plus importante.
- `--dry-run` affiche le plan de publication sans téléversement ; `--json` affiche un plan
  lisible par machine.
- `--all` publie chaque Skill nouvelle ou modifiée sans invite. Sans
  `--all`, les terminaux interactifs vous permettent de sélectionner les Skills à publier.
- `--owner <handle>` publie sous l’identifiant d’un éditeur d’organisation/utilisateur lorsque
  l’acteur dispose de l’accès éditeur.
- `sync` est uniquement une publication à sens unique. Elle n’installe pas, ne met pas à jour, ne télécharge pas et ne
  signale pas la télémétrie d’installation/téléchargement.

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- Nécessite `clawhub login`.
- Exécute ClawHub ClawScan via `POST /api/v1/skills/-/scan`, puis interroge jusqu’à ce que l’analyse soit terminale.
- Les analyses sont asynchrones et peuvent prendre du temps. Pendant la file d’attente, l’indicateur du terminal affiche la position actuelle de l’analyse priorisée et le nombre d’analyses en attente avant elle.
- Les analyses publiées nécessitent la propriété ou l’accès de gestion éditeur. Les modérateurs/admins peuvent utiliser le même backend via `clawhub-admin`.
- `--update` n’est valide qu’avec `--slug` ; il réécrit les résultats d’analyse publiés réussis dans la version sélectionnée.
- `--output <file.zip>` télécharge l’archive complète du rapport avec `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` et `README.md`.
- `--json` affiche la réponse complète d’interrogation pour l’automatisation.
- Les analyses de chemins locaux ne sont plus prises en charge. Téléversez une nouvelle version, puis utilisez `scan download` pour récupérer les résultats d’analyse stockés pour cette version soumise.

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- Nécessite `clawhub login`.
- Télécharge le ZIP du rapport d’analyse stocké pour une version de Skill ou de Plugin soumise, y compris les versions bloquées ou masquées par les contrôles de sécurité ClawHub.
- Les téléchargements de Skill utilisent le slug de la Skill et utilisent par défaut `--kind skill`.
- Les téléchargements de Plugin utilisent le nom du paquet et nécessitent `--kind plugin`.
- `--version` est requis afin que les auteurs inspectent la version soumise exacte que ClawHub a bloquée.
- `--output <file.zip>` choisit le chemin de destination.

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub fournit un workflow réutilisable officiel à
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/919f047373fb1836301c5e42f20ad8c2c2201fc5/.github/workflows/skill-publish.yml)
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

- `root` vaut `skills` par défaut pour les dépôts de catalogues.
- Passez `skill_path: skills/review-helper` pour traiter un seul dossier de Skill.
- `owner` correspond à l’option CLI `--owner` ; omettez-le pour publier en tant qu’utilisateur authentifié.
- La publication de Skills V1 utilise `clawhub_token` ; la publication approuvée GitHub OIDC est réservée aux paquets pour l’instant.

### `delete <skill>`

- Sans `--version`, supprimez une compétence de manière réversible (propriétaire, modérateur ou administrateur).
- Appelle `DELETE /api/v1/skills/{slug}`.
- Les suppressions réversibles lancées par le propriétaire réservent le slug pendant 30 jours ; la commande affiche l’heure d’expiration.
- `--version <version>` supprime définitivement une version possédée qui n’est pas la plus récente via une route fail-closed
  propre à la version.
  Les versions supprimées ne peuvent pas être restaurées ni republiées. Publiez une version de remplacement avant de supprimer la
  version actuellement la plus récente. Le personnel de la plateforme ne contourne pas la propriété pour ce flux limité aux versions.
- `--reason <text>` enregistre une note de modération sur une suppression réversible de compétence entière et dans le journal d’audit.
- `--note <text>` est un alias de `--reason`.
- `--yes` ignore la confirmation.

### `undelete <skill>`

- Restaurez une compétence masquée (propriétaire, modérateur ou administrateur).
- Il n’existe pas d’annulation de suppression pour les versions ; les versions supprimées définitivement ne peuvent pas être restaurées.
- Appelle `POST /api/v1/skills/{slug}/undelete`.
- `--reason <text>` enregistre une note de modération sur la compétence et dans le journal d’audit.
- `--note <text>` est un alias de `--reason`.
- `--yes` ignore la confirmation.

### `hide <skill>`

- Masquez une compétence (propriétaire, modérateur ou administrateur).
- Alias de `delete`.

### `unhide <skill>`

- Réaffichez une compétence (propriétaire, modérateur ou administrateur).
- Alias de `undelete`.

### `skill rename <skill> <new-name>`

- Renommez une compétence possédée et conservez le slug précédent comme alias de redirection.
- Appelle `POST /api/v1/skills/{slug}/rename`.
- `--yes` ignore la confirmation.

### `skill merge <source> <target>`

- Fusionnez une compétence possédée dans une autre compétence possédée.
- Le slug source cesse d’être listé publiquement et devient un alias de redirection vers la cible.
- Appelle `POST /api/v1/skills/{sourceSlug}/merge`.
- `--yes` ignore la confirmation.

### `transfer`

- Flux de transfert de propriété.
- Les transferts vers des identifiants utilisateur créent une demande en attente que le destinataire accepte.
- Les transferts vers des identifiants d’organisation/de publisher s’appliquent immédiatement uniquement lorsque l’acteur dispose d’un
  accès administrateur au propriétaire actuel et au publisher de destination.
- Sous-commandes :
  - `transfer request <skill> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <skill> [--yes]`
  - `transfer reject <skill> [--yes]`
  - `transfer cancel <skill> [--yes]`
- Endpoints :
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- Parcourt ou recherche dans le catalogue de packages unifié via `GET /api/v1/packages` et `GET /api/v1/packages/search`.
- Utilisez cette commande pour les plugins et les autres entrées de familles de packages ; `search` de premier niveau reste la surface de recherche des compétences.
- Options :
  - `--family skill|code-plugin|bundle-plugin`
  - `--official`
  - `--executes-code`
  - `--target <target>`, `--os <os>`, `--arch <arch>`, `--libc <libc>`
  - `--requires-browser`, `--requires-desktop`, `--requires-native-deps`
  - `--requires-external-service`, `--external-service <name>`
  - `--binary <name>`, `--os-permission <name>`
  - `--artifact-kind legacy-zip|npm-pack`
  - `--npm-mirror`
  - `--limit <n>` (1-100, par défaut : 25)
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

- Récupère les métadonnées du package sans l’installer.
- Utilisez cette commande pour inspecter les métadonnées de plugin, la compatibilité, la vérification, la source et les versions/fichiers.
- `--version <version>` : inspecter une version précise (par défaut : latest).
- `--tag <tag>` : inspecter une version étiquetée (par ex. `latest`).
- `--versions` : lister l’historique des versions (première page).
- `--limit <n>` : nombre maximal de versions à lister (1-100).
- `--files` : lister les fichiers de la version sélectionnée.
- `--file <path>` : récupérer le contenu brut d’un fichier (fichiers texte uniquement ; limite de 200 Ko).
- `--json` : sortie lisible par machine.

### `package download <name>`

- Résout une version de package via
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- Télécharge l’artefact depuis le `downloadUrl` du résolveur.
- Vérifie le SHA-256 ClawHub pour tous les artefacts.
- Pour les artefacts ClawPack npm-pack, vérifie également l’intégrité npm `sha512`,
  le shasum npm et le nom/la version du `package.json` de l’archive tar.
- Les versions ZIP héritées sont téléchargées via la route ZIP héritée.
- Options :
  - `--version <version>` : télécharger une version précise.
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

- Calcule le SHA-256 ClawHub, l’intégrité npm `sha512` et le shasum npm pour un
  artefact local.
- Avec `--package`, résout les métadonnées attendues depuis ClawHub et compare le
  fichier local aux métadonnées de l’artefact publié.
- Avec des options de condensat directes, vérifie sans recherche réseau.
- Options :
  - `--package <name>` : nom du package pour résoudre les métadonnées attendues de l’artefact.
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
- Utilise par défaut une validation hors ligne/statique, sans localiser ni importer un checkout
  OpenClaw local.
- Les erreurs de compatibilité bloquantes quittent avec un code différent de zéro. Les constats limités aux avertissements sont affichés mais
  quittent avec zéro.
- Options :
  - `--out <dir>` : écrire les rapports Plugin Inspector dans ce répertoire.
  - `--openclaw <path>` : inspecter par rapport à un checkout OpenClaw local explicite.
  - `--runtime` : activer la capture runtime ; importe le code du plugin.
  - `--allow-execute` : autoriser la capture runtime dans un espace de travail isolé.
  - `--no-mock-sdk` : désactiver le SDK OpenClaw simulé pendant la capture runtime.
  - `--json` : sortie lisible par machine.

Exemple :

```bash
clawhub package validate ./example-plugin
```

Si la validation signale un constat lié au package, au manifeste, à l’import SDK ou à l’artefact, consultez
[Correctifs de validation des plugins](/clawhub/plugin-validation-fixes), puis réexécutez la commande.

### `package delete <name>`

- Sans `--version`, supprime de manière réversible un package et toutes ses versions publiées.
- `--version <version>` supprime définitivement une version possédée qui n’est pas la plus récente via une route fail-closed
  propre à la version.
  Les versions supprimées ne peuvent pas être restaurées ni republiées. Publiez une version de remplacement avant de supprimer la
  version actuellement la plus récente. Ce flux limité aux versions nécessite le propriétaire du package ou un administrateur de publisher d’organisation ;
  le personnel de la plateforme ne contourne pas la propriété du package.
- La suppression réversible de package entier nécessite le propriétaire du package, un propriétaire/administrateur de publisher d’organisation, un
  modérateur de plateforme ou un administrateur de plateforme.
- Options :
  - `--version <version>` : supprimer définitivement une version qui n’est pas la plus récente.
  - `--yes` : ignorer la confirmation.
  - `--json` : sortie lisible par machine.

Exemple :

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- Restaure un package supprimé de manière réversible et ses versions publiées.
- Il n’existe pas d’annulation de suppression pour les versions ; les versions supprimées définitivement ne peuvent pas être restaurées.
- Nécessite le propriétaire du package, un propriétaire/administrateur de publisher d’organisation, un modérateur de plateforme,
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

- Transfère un package vers un autre publisher.
- Nécessite un accès administrateur au propriétaire actuel du package et au publisher de destination,
  sauf si l’opération est effectuée par un administrateur de plateforme.
- Les noms de packages avec portée doivent être transférés au propriétaire de portée correspondant.
- Appelle `POST /api/v1/packages/{name}/transfer`.
- Options :
  - `--to <owner>` : identifiant du publisher de destination.
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
  - `--version <version>` : version de package facultative à associer au signalement.
  - `--reason <text>` : motif de signalement requis.
  - `--json` : sortie lisible par machine.

Exemple :

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- Commande propriétaire pour vérifier la visibilité de modération du package.
- Appelle `GET /api/v1/packages/{name}/moderation`.
- Affiche l’état actuel d’analyse du package, le nombre de signalements ouverts, l’état de modération manuelle de la dernière
  version publiée, l’état de blocage des téléchargements et les motifs de modération.
- Options :
  - `--json` : sortie lisible par machine.

Exemple :

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Vérifie si un package est prêt pour une future consommation par OpenClaw.
- Appelle `GET /api/v1/packages/{name}/readiness`.
- Signale les blocages liés au statut officiel, à la disponibilité ClawPack, au condensat d’artefact,
  à la provenance source, à la compatibilité OpenClaw, aux cibles hôtes, aux métadonnées d’environnement
  et à l’état d’analyse.
- Options :
  - `--json` : sortie lisible par machine.

Exemple :

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Affiche l’état de migration orienté opérateur pour un package susceptible de remplacer un
  plugin OpenClaw intégré.
- Appelle le même endpoint de readiness calculée que `package readiness`, mais affiche
  un état axé migration, la dernière version, l’état de package officiel, les vérifications et
  les blocages.
- Options :
  - `--json` : sortie lisible par machine.

Exemple :

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- Crée un publisher d’organisation détenu par l’utilisateur authentifié.
- L’identifiant est normalisé en minuscules et peut être transmis avec ou sans `@`.
- Les publishers d’organisation nouvellement créés ne sont pas fiables/officiels par défaut.
- Échoue si l’identifiant est déjà utilisé par un publisher, un utilisateur ou une route réservée existants.

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- Publie un Plugin de code ou un Plugin de bundle via `POST /api/v1/packages`.
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
  les installations OpenClaw puissent vérifier l’artéfact exact. Les dossiers de Plugins de bundle utilisent toujours
  le chemin de publication par fichiers extraits.
- Pour les sources GitHub, l’attribution de source est renseignée automatiquement à partir du dépôt, du commit résolu, de la ref et du sous-chemin.
- Pour les dossiers locaux, l’attribution de source est détectée automatiquement depuis le git local lorsque le remote d’origine pointe vers GitHub.
- Les Plugins de code externes doivent déclarer explicitement `openclaw.compat.pluginApi` et
  `openclaw.build.openclawVersion`.
  Le `package.json.version` de premier niveau n’est pas utilisé comme solution de repli pour la validation de publication.
- `--dry-run` prévisualise la charge utile de publication résolue sans téléversement.
- `--json` émet une sortie lisible par machine pour la CI.
- `--owner <handle>` publie sous l’identifiant d’éditeur d’un utilisateur ou d’une organisation lorsque l’acteur dispose de l’accès éditeur.
- Les noms de packages à portée doivent correspondre au propriétaire sélectionné. Consultez `docs/publishing.md`.
- Les indicateurs existants (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) fonctionnent toujours comme remplacements.
- Les dépôts GitHub privés nécessitent `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### Flux local recommandé

Utilisez d’abord `--dry-run` afin de confirmer les métadonnées de package résolues et
l’attribution de source avant de créer une version réelle :

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Flux de dossier local

Pour les Plugins de code, la publication de dossier construit et téléverse un artéfact ClawPack depuis
le dossier du package :

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `package.json` minimal pour `--family code-plugin`

Les Plugins de code externes nécessitent une petite quantité de métadonnées OpenClaw dans
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

Remarques :

- `package.json.version` est la version de publication de votre package, mais elle n’est pas utilisée comme
  solution de repli pour la validation de compatibilité/construction OpenClaw.
- `openclaw.hostTargets` et `openclaw.environment` sont des métadonnées facultatives.
  ClawHub peut les afficher lorsqu’elles sont présentes, mais elles ne sont pas requises pour publier.
- `openclaw.compat.minGatewayVersion` et
  `openclaw.build.pluginSdkVersion` sont des compléments facultatifs si vous souhaitez publier
  des métadonnées de compatibilité plus détaillées.
- Si vous utilisez une ancienne version de la CLI `clawhub`, mettez-la à niveau avant de publier afin que
  les vérifications préalables locales s’exécutent avant le téléversement.
- Si la validation signale un code de correction, consultez
  [Correctifs de validation de Plugin](/clawhub/plugin-validation-fixes).

#### GitHub Actions

ClawHub fournit également un workflow réutilisable officiel à
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/919f047373fb1836301c5e42f20ad8c2c2201fc5/.github/workflows/package-publish.yml)
pour les dépôts de Plugins.

Configuration typique de l’appelant :

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

Remarques :

- Le workflow réutilisable définit par défaut `source` sur le dépôt appelant.
- Pour les monorepos, transmettez `source_path` afin que le workflow publie le dossier du package
  Plugin, par exemple `source_path: extensions/codex`.
- Épinglez le workflow réutilisable à une balise stable ou à un SHA de commit complet. N’exécutez pas la publication de version depuis `@main`.
- `pull_request` doit utiliser `dry_run: true` afin que la CI reste non polluante.
- Les publications réelles doivent être limitées aux événements de confiance comme `workflow_dispatch` ou les poussées de balises.
- La publication de confiance sans secret ne fonctionne que sur `workflow_dispatch` ; les poussées de balises nécessitent toujours `clawhub_token`.
- Gardez `clawhub_token` disponible pour la première publication, les packages non approuvés ou les publications d’urgence.
- Le workflow téléverse le résultat JSON comme artéfact et l’expose comme sorties de workflow.

### `package trusted-publisher get <name>`

- Affiche la configuration d’éditeur de confiance GitHub Actions pour un package.
- Utilisez ceci après avoir défini la configuration pour confirmer le dépôt, le nom de fichier du workflow
  et l’épinglage facultatif de l’environnement.
- Indicateurs :
  - `--json` : sortie lisible par machine.

Exemple :

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- Attache ou remplace la configuration d’éditeur de confiance GitHub Actions pour un package
  existant.
- Le package doit d’abord être créé via une publication `clawhub package publish`
  normale, manuelle ou authentifiée par jeton.
- Une fois la configuration définie, les futures publications GitHub Actions prises en charge peuvent utiliser
  OIDC/la publication de confiance sans jeton ClawHub de longue durée.
- `--repository <repo>` doit être `owner/repo`.
- `--workflow-filename <file>` doit correspondre au nom du fichier de workflow dans
  `.github/workflows/`.
- `--environment <name>` est facultatif. Lorsqu’il est configuré, l’environnement GitHub Actions
  dans la revendication OIDC doit correspondre exactement.
- ClawHub vérifie le dépôt GitHub configuré lorsque cette commande s’exécute.
  Les dépôts publics peuvent être vérifiés via les métadonnées GitHub publiques. Les dépôts
  privés nécessitent que ClawHub dispose d’un accès GitHub à ce dépôt, par
  exemple via une future installation de GitHub App ClawHub ou une autre intégration
  GitHub autorisée.
- Indicateurs :
  - `--repository <repo>` : dépôt GitHub, par exemple `openclaw/example-plugin`.
  - `--workflow-filename <file>` : nom de fichier de workflow, par exemple `package-publish.yml`.
  - `--environment <name>` : environnement GitHub Actions facultatif avec correspondance exacte.
  - `--json` : sortie lisible par machine.

Exemple :

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- Supprime la configuration d’éditeur de confiance d’un package.
- Utilisez ceci comme retour arrière si le workflow, le dépôt ou l’épinglage d’environnement doit
  être désactivé ou recréé.
- Les futures publications réelles doivent utiliser la publication authentifiée normale jusqu’à ce que la configuration soit
  redéfinie.
- Indicateurs :
  - `--json` : sortie lisible par machine.

Exemple :

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### Télémétrie d’installation

- Envoyée après `clawhub install <slug>` lorsque vous êtes connecté, sauf si
  `CLAWHUB_DISABLE_TELEMETRY=1` est défini.
- Le signalement est effectué au mieux. Les commandes d’installation n’échouent pas si la télémétrie est
  indisponible.
- Détails : `docs/telemetry.md`.
