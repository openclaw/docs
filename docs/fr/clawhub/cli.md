---
read_when:
    - Utilisation de la CLI ClawHub
    - Débogage de l’installation, de la mise à jour, de la publication ou de la synchronisation
summary: 'Référence de la CLI : commandes, options, configuration, fichier de verrouillage, comportement de synchronisation.'
x-i18n:
    generated_at: "2026-05-11T22:19:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: abbe12a07f8947f8c65ba6eaae6fa6ff7fb8bfb12fbcb339abccd12225a2e791
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

Package CLI : `clawhub`, binaire : `clawhub`.

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

- `--workdir <dir>` : répertoire de travail (par défaut : cwd ; se rabat sur l’espace de travail Clawdbot si configuré)
- `--dir <dir>` : répertoire d’installation sous workdir (par défaut : `skills`)
- `--site <url>` : URL de base pour la connexion par navigateur (par défaut : `https://clawhub.ai`)
- `--registry <url>` : URL de base de l’API (par défaut : découverte, sinon `https://clawhub.ai`)
- `--no-input` : désactiver les invites

Équivalents d’environnement :

- `CLAWHUB_SITE` (hérité `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (hérité `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (hérité `CLAWDHUB_WORKDIR`)

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

C’est requis sur les systèmes où les connexions sortantes directes sont bloquées
(par ex. conteneurs Docker, VPS Hetzner avec Internet uniquement via proxy, pare-feu
d’entreprise).

Exemple :

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

Lorsqu’aucune variable de proxy n’est définie, le comportement reste inchangé (connexions directes).

## Fichier de configuration

Stocke votre jeton d’API + l’URL de registre mise en cache.

- macOS : `~/Library/Application Support/clawhub/config.json`
- Linux/XDG : `$XDG_CONFIG_HOME/clawhub/config.json` ou `~/.config/clawhub/config.json`
- Windows : `%APPDATA%\\clawhub\\config.json`
- Repli hérité : si `clawhub/config.json` n’existe pas encore mais que `clawdhub/config.json` existe, la CLI réutilise le chemin hérité
- remplacement : `CLAWHUB_CONFIG_PATH` (hérité `CLAWDHUB_CONFIG_PATH`)

## Commandes

### `login` / `auth login`

- Par défaut : ouvre le navigateur sur `<site>/cli/auth` et termine via un rappel local loopback.
- Sans interface graphique : `clawhub login --token clh_...`
- Interactif distant/sans interface graphique : `clawhub login --device` affiche un code et attend pendant que vous l’autorisez sur `<site>/cli/device`.

### `whoami`

- Vérifie le jeton stocké via `/api/v1/whoami`.

### `star <slug>` / `unstar <slug>`

- Ajoute/retire un Skill de vos éléments mis en avant.
- Appelle `POST /api/v1/stars/<slug>` et `DELETE /api/v1/stars/<slug>`.
- `--yes` ignore la confirmation.

### `search <query...>`

- Appelle `/api/v1/search?q=...`.
- La recherche privilégie les correspondances exactes de jetons de slug/nom avant la popularité des téléchargements. Un jeton slug autonome comme `map` correspond à `personal-map` plus fortement que la sous-chaîne dans `amap`.
- Les téléchargements constituent un faible a priori de popularité, pas une garantie de première position.
- Si un Skill devrait apparaître mais n’apparaît pas, exécutez `clawhub inspect <slug>` en étant connecté pour vérifier les diagnostics de modération visibles par le propriétaire avant de renommer les métadonnées.

### `explore`

- Liste les Skills les plus récents via `/api/v1/skills?limit=...&sort=createdAt` (triés par `createdAt` décroissant).
- Indicateurs :
  - `--limit <n>` (1-200, par défaut : 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (par défaut : newest)
  - `--json` (sortie lisible par machine)
- Sortie : `<slug>  v<version>  <age>  <summary>` (résumé tronqué à 50 caractères).

### `inspect <slug>`

- Récupère les métadonnées du Skill et les fichiers de version sans installer.
- `--version <version>` : inspecter une version spécifique (par défaut : dernière).
- `--tag <tag>` : inspecter une version balisée (par ex. `latest`).
- `--versions` : lister l’historique des versions (première page).
- `--limit <n>` : nombre maximal de versions à lister (1-200).
- `--files` : lister les fichiers de la version sélectionnée.
- `--file <path>` : récupérer le contenu brut du fichier (fichiers texte uniquement ; limite de 200 Ko).
- `--json` : sortie lisible par machine.

### `install <slug>`

- Résout la dernière version via `/api/v1/skills/<slug>`.
- Télécharge le zip via `/api/v1/download`.
- Extrait dans `<workdir>/<dir>/<slug>`.
- Refuse d’écraser les Skills épinglés ; exécutez d’abord `clawhub unpin <slug>`.
- Écrit :
  - `<workdir>/.clawhub/lock.json` (hérité `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (hérité `.clawdhub`)

### `uninstall <slug>`

- Supprime `<workdir>/<dir>/<slug>` et supprime l’entrée du fichier de verrouillage.
- Interactif : demande une confirmation.
- Non interactif (`--no-input`) : nécessite `--yes`.

### `list`

- Lit `<workdir>/.clawhub/lock.json` (ancien `.clawdhub`).
- Affiche `pinned` à côté des compétences figées avec `clawhub pin`, y compris la raison facultative.

### `pin <slug>`

- Marque une compétence installée comme épinglée dans le fichier de verrouillage.
- `--reason <text>` indique pourquoi la compétence est figée.
- Les compétences épinglées sont ignorées par `update --all` et rejetées par `update <slug>` direct.
- Les compétences épinglées rejettent aussi `install --force` afin que les octets locaux ne puissent pas être remplacés accidentellement.

### `unpin <slug>`

- Supprime l’épinglage du fichier de verrouillage pour une compétence installée afin que les futures mises à jour puissent la modifier.

### `update [slug]` / `update --all`

- Calcule l’empreinte à partir des fichiers locaux.
- Si l’empreinte correspond à une version connue : aucune invite.
- Si l’empreinte ne correspond pas :
  - refuse par défaut
  - écrase avec `--force` (ou invite, si interactif)
- Les compétences épinglées ne sont jamais mises à jour par `--force`.
- `update <slug>` échoue rapidement pour les slugs épinglés et vous indique d’exécuter d’abord `clawhub unpin <slug>`.
- `update --all` ignore les slugs épinglés et affiche un résumé de ce qui est resté figé.

### `skill publish <path>`

- Publie via `POST /api/v1/skills` (multipart).
- Exige semver : `--version 1.2.3`.
- `--owner <handle>` publie sous l’identifiant d’éditeur d’une organisation ou d’un utilisateur lorsque
  l’acteur dispose d’un accès éditeur.
- `--migrate-owner` déplace une compétence existante vers `--owner` lors de la publication d’une nouvelle
  version. Exige un accès administrateur/propriétaire sur les deux éditeurs.
- Le comportement du propriétaire et de la revue est expliqué dans `docs/publishing.md`.
- Publier une compétence signifie qu’elle est publiée sous `MIT-0` sur ClawHub.
- Les compétences publiées peuvent être utilisées, modifiées et redistribuées librement sans attribution.
- ClawHub ne prend pas en charge les compétences payantes ni la tarification par compétence.
- `--clawscan-note <text>` ajoute une note ClawScan. Cette note donne à ClawScan
  du contexte pour un comportement qui pourrait sinon paraître inhabituel, comme l’accès réseau,
  l’accès à l’hôte natif ou des identifiants propres à un fournisseur. La note est stockée sur
  la version publiée.
- Alias hérité : `publish <path>`.

```bash
clawhub skill publish ./my-skill --clawscan-note "Uses network access only to call the user-configured Weather API."
```

### `delete <slug>`

- Supprime une compétence de façon réversible (propriétaire, modérateur ou administrateur).
- Appelle `DELETE /api/v1/skills/{slug}`.
- Les suppressions réversibles initiées par le propriétaire réservent le slug pendant 30 jours ; la commande affiche l’heure d’expiration.
- `--reason <text>` enregistre une note de modération sur la compétence et le journal d’audit.
- `--note <text>` est un alias de `--reason`.
- `--yes` ignore la confirmation.

### `undelete <slug>`

- Restaure une compétence masquée (propriétaire, modérateur ou administrateur).
- Appelle `POST /api/v1/skills/{slug}/undelete`.
- `--reason <text>` enregistre une note de modération sur la compétence et le journal d’audit.
- `--note <text>` est un alias de `--reason`.
- `--yes` ignore la confirmation.

### `hide <slug>`

- Masque une compétence (propriétaire, modérateur ou administrateur).
- Alias de `delete`.

### `unhide <slug>`

- Réaffiche une compétence (propriétaire, modérateur ou administrateur).
- Alias de `undelete`.

### `skill rename <slug> <new-slug>`

- Renomme une compétence possédée et conserve le slug précédent comme alias de redirection.
- Appelle `POST /api/v1/skills/{slug}/rename`.
- `--yes` ignore la confirmation.

### `skill merge <source-slug> <target-slug>`

- Fusionne une compétence possédée dans une autre compétence possédée.
- Le slug source cesse d’être listé publiquement et devient un alias de redirection vers la cible.
- Appelle `POST /api/v1/skills/{sourceSlug}/merge`.
- `--yes` ignore la confirmation.

### `transfer`

- Flux de transfert de propriété.
- Les transferts vers des identifiants utilisateur créent une demande en attente que le destinataire accepte.
- Les transferts vers des identifiants d’organisation/d’éditeur s’appliquent immédiatement uniquement lorsque l’acteur dispose
  d’un accès administrateur à la fois au propriétaire actuel et à l’éditeur de destination.
- Sous-commandes :
  - `transfer request <slug> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <slug> [--yes]`
  - `transfer reject <slug> [--yes]`
  - `transfer cancel <slug> [--yes]`
- Endpoints :
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- Parcourt ou recherche le catalogue unifié de packages via `GET /api/v1/packages` et `GET /api/v1/packages/search`.
- Utilisez ceci pour les plugins et les autres entrées de familles de packages ; `search` au niveau supérieur reste la surface de recherche des compétences.
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

- Récupère les métadonnées du package sans l’installer.
- Utilisez ceci pour les métadonnées de plugin, la compatibilité, la vérification, la source et l’inspection des versions/fichiers.
- `--version <version>` : inspecte une version spécifique (valeur par défaut : latest).
- `--tag <tag>` : inspecte une version étiquetée (par ex. `latest`).
- `--versions` : liste l’historique des versions (première page).
- `--limit <n>` : nombre maximal de versions à lister (1-100).
- `--files` : liste les fichiers de la version sélectionnée.
- `--file <path>` : récupère le contenu brut d’un fichier (fichiers texte uniquement ; limite de 200 Ko).
- `--json` : sortie lisible par machine.

### `package download <name>`

- Résout une version de package via
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- Télécharge l’artefact depuis le `downloadUrl` du résolveur.
- Vérifie le SHA-256 ClawHub pour tous les artefacts.
- Pour les artefacts ClawPack npm-pack, vérifie aussi l’intégrité npm `sha512`,
  le shasum npm et le nom/la version `package.json` de l’archive tar.
- Les versions ZIP héritées sont téléchargées via la route ZIP héritée.
- Options :
  - `--version <version>` : télécharge une version spécifique.
  - `--tag <tag>` : télécharge une version étiquetée (valeur par défaut : `latest`).
  - `-o, --output <path>` : fichier ou répertoire de sortie.
  - `--force` : écrase un fichier de sortie existant.
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
  - `--package <name>` : nom du package pour résoudre les métadonnées d’artefact attendues.
  - `--version <version>` ou `--tag <tag>` : version attendue du package.
  - `--sha256 <hex>` : SHA-256 ClawHub attendu.
  - `--npm-integrity <sri>` : intégrité npm attendue.
  - `--npm-shasum <sha1>` : shasum npm attendu.
  - `--json` : sortie lisible par machine.

Exemples :

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package delete <name>`

- Supprime logiquement un package et toutes les releases.
- Nécessite le propriétaire du package, un propriétaire/administrateur d’éditeur d’organisation, un modérateur de la plateforme,
  ou un administrateur de la plateforme.
- Options :
  - `--yes` : ignorer la confirmation.
  - `--json` : sortie lisible par machine.

Exemple :

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package undelete <name>`

- Restaure un package supprimé logiquement et ses releases.
- Nécessite le propriétaire du package, un propriétaire/administrateur d’éditeur d’organisation, un modérateur de la plateforme,
  ou un administrateur de la plateforme.
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
  de destination, sauf si l’action est effectuée par un administrateur de la plateforme.
- Les noms de packages scopés doivent être transférés au propriétaire du scope correspondant.
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

- Commande authentifiée permettant de signaler un package aux modérateurs.
- Appelle `POST /api/v1/packages/{name}/report`.
- Les signalements s’appliquent au niveau du package, peuvent être liés à une version, et deviennent visibles
  par les modérateurs pour examen.
- Les signalements ne masquent pas automatiquement les packages et ne bloquent pas les téléchargements à eux seuls.
- Options :
  - `--version <version>` : version facultative du package à associer au signalement.
  - `--reason <text>` : motif de signalement requis.
  - `--json` : sortie lisible par machine.

Exemple :

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- Commande propriétaire permettant de vérifier la visibilité de modération du package.
- Appelle `GET /api/v1/packages/{name}/moderation`.
- Affiche l’état actuel d’analyse du package, le nombre de signalements ouverts, l’état de modération manuelle
  de la dernière release, l’état de blocage des téléchargements et les motifs de modération.
- Options :
  - `--json` : sortie lisible par machine.

Exemple :

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Vérifie si un package est prêt pour une consommation future par OpenClaw.
- Appelle `GET /api/v1/packages/{name}/readiness`.
- Signale les blocages concernant le statut officiel, la disponibilité ClawPack, le condensat d’artefact,
  la provenance source, la compatibilité OpenClaw, les cibles hôtes, les métadonnées d’environnement
  et l’état d’analyse.
- Options :
  - `--json` : sortie lisible par machine.

Exemple :

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Affiche l’état de migration orienté opérateur pour un package susceptible de remplacer un
  plugin OpenClaw intégré.
- Appelle le même endpoint de préparation calculée que `package readiness`, mais affiche
  l’état axé migration, la dernière version, l’état de package officiel, les vérifications et
  les blocages.
- Options :
  - `--json` : sortie lisible par machine.

Exemple :

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- Publie un plugin de code ou un plugin groupé via `POST /api/v1/packages`.
- `<source>` accepte :
  - Chemin de dossier local : `./my-plugin`
  - Tarball npm-pack ClawPack local : `./my-plugin-1.2.3.tgz`
  - Dépôt GitHub : `owner/repo` ou `owner/repo@ref`
  - URL GitHub : `https://github.com/owner/repo`
- Les métadonnées sont détectées automatiquement depuis `package.json`, `openclaw.plugin.json` et
  les vrais marqueurs de bundle OpenClaw tels que `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` et `.cursor-plugin/plugin.json`.
- Les sources `.tgz` sont traitées comme ClawPack. La CLI téléverse les octets npm-pack exacts
  et utilise le contenu `package/` extrait uniquement pour la validation et le préremplissage
  des métadonnées.
- Les dossiers de plugin de code sont empaquetés dans une tarball npm ClawPack avant le téléversement afin que
  les installations OpenClaw puissent vérifier l’artefact exact. Les dossiers de plugin groupé utilisent toujours
  le chemin de publication par fichiers extraits.
- Pour les sources GitHub, l’attribution source est renseignée automatiquement à partir du dépôt, du commit résolu, de la ref et du sous-chemin.
- Pour les dossiers locaux, l’attribution source est détectée automatiquement depuis le git local lorsque le remote origin pointe vers GitHub.
- Les plugins de code externes doivent déclarer explicitement `openclaw.compat.pluginApi` et
  `openclaw.build.openclawVersion`.
  Le champ de premier niveau `package.json.version` n’est pas utilisé comme solution de repli pour la validation de publication.
- `--dry-run` prévisualise la charge utile de publication résolue sans téléversement.
- `--json` émet une sortie lisible par machine pour la CI.
- `--owner <handle>` publie sous un identifiant d’éditeur utilisateur ou organisation lorsque l’acteur dispose d’un accès éditeur.
- `--clawscan-note <text>` ajoute une note ClawScan. Cette note donne à ClawScan
  du contexte sur un comportement qui pourrait autrement paraître inhabituel, comme l’accès réseau,
  l’accès hôte natif ou des identifiants propres à un fournisseur. La note est stockée sur
  la release publiée.
- Les noms de packages scopés doivent correspondre au propriétaire sélectionné. Voir `docs/publishing.md`.
- Les options existantes (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) fonctionnent toujours comme remplacements.
- Les dépôts GitHub privés nécessitent `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --clawscan-note "Native host access is limited to the local OpenClaw bridge."
```

#### Flux local recommandé

Utilisez d’abord `--dry-run` afin de confirmer les métadonnées de package résolues et
l’attribution source avant de créer une release réelle :

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Flux de dossier local

Pour les plugins de code, la publication depuis un dossier construit et téléverse un artefact ClawPack depuis
le dossier du package :

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `package.json` minimal pour `--family code-plugin`

Les plugins de code externes ont besoin d’une petite quantité de métadonnées OpenClaw dans
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

- `package.json.version` est la version de release de votre package, mais elle n’est pas utilisée comme
  solution de repli pour la validation de compatibilité/build OpenClaw.
- `openclaw.hostTargets` et `openclaw.environment` sont des métadonnées facultatives.
  ClawHub peut les afficher lorsqu’elles sont présentes, mais elles ne sont pas requises pour la publication.
- `openclaw.compat.minGatewayVersion` et
  `openclaw.build.pluginSdkVersion` sont des compléments facultatifs si vous souhaitez publier
  des métadonnées de compatibilité plus détaillées.
- Si vous utilisez une ancienne release de la CLI `clawhub`, mettez-la à niveau avant de publier afin que
  les vérifications locales préalables s’exécutent avant le téléversement.

#### GitHub Actions

ClawHub fournit également un workflow réutilisable officiel à
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/c51cfe2459f3482c315a7c8c71b2efd2637bb0e8/.github/workflows/package-publish.yml)
pour les dépôts de plugins.

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

Remarques :

- Le workflow réutilisable définit `source` par défaut sur le dépôt appelant.
- Pour les monorepos, transmettez `source_path` afin que le workflow publie le dossier
  du package plugin, par exemple `source_path: extensions/codex`.
- Épinglez le workflow réutilisable à un tag stable ou à un SHA de commit complet. N’exécutez pas de publication de release depuis `@main`.
- `pull_request` doit utiliser `dry_run: true` afin que la CI ne pollue pas l’environnement.
- Les publications réelles doivent être limitées aux événements de confiance tels que `workflow_dispatch` ou les pushs de tags.
- La publication de confiance sans secret fonctionne uniquement avec `workflow_dispatch` ; les pushs de tags nécessitent toujours `clawhub_token`.
- Gardez `clawhub_token` disponible pour une première publication, des packages non approuvés ou des publications d’urgence.
- Le workflow téléverse le résultat JSON comme artefact et l’expose comme sorties de workflow.

### `sync`

- Analyse les dossiers de Skills locaux et publie ceux qui sont nouveaux ou modifiés.
- Les racines peuvent être n’importe quel dossier : un répertoire de Skills ou un seul dossier de Skill avec `SKILL.md`.
- Ajoute automatiquement les racines de Skills Clawdbot lorsque `~/.clawdbot/clawdbot.json` est présent :
  - `agent.workspace/skills` (agent principal)
  - `routing.agents.*.workspace/skills` (par agent)
  - `~/.clawdbot/skills` (partagé)
  - `skills.load.extraDirs` (packs partagés)
- Respecte `CLAWDBOT_CONFIG_PATH` / `CLAWDBOT_STATE_DIR` et `OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR`.
- Options :
  - `--root <dir...>` racines d’analyse supplémentaires
  - `--all` téléverser sans demander de confirmation
  - `--dry-run` afficher uniquement le plan
  - `--bump patch|minor|major` (par défaut : patch)
  - `--changelog <text>` (non interactif)
  - `--tags a,b,c` (par défaut : latest)
  - `--concurrency <n>` (par défaut : 4)

Télémétrie :

- Envoyée pendant `sync` lorsque vous êtes connecté, sauf si `CLAWHUB_DISABLE_TELEMETRY=1` (ancien `CLAWDHUB_DISABLE_TELEMETRY=1`).
- Détails : `docs/telemetry.md`.
