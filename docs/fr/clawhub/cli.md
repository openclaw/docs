---
read_when:
    - Utilisation de la CLI ClawHub
    - Débogage de l’installation, de la mise à jour ou de la publication
summary: 'Référence de la CLI : commandes, options, configuration et comportement du fichier de verrouillage.'
x-i18n:
    generated_at: "2026-07-12T21:39:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 498d27d82a34ad43af9fc7bc0d40e844c6a14ededc8a017d6fa33768eec4b452
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

Paquet CLI : `clawhub`, exécutable : `clawhub`.

Installez-le globalement avec npm ou pnpm :

```bash
npm i -g clawhub
# ou
pnpm add -g clawhub
```

Puis vérifiez son fonctionnement :

```bash
clawhub --help
clawhub login
clawhub whoami
```

## Options globales

- `--workdir <dir>` : répertoire de travail (par défaut : répertoire courant ; utilise l’espace de travail Clawdbot comme solution de repli s’il est configuré)
- `--dir <dir>` : répertoire d’installation sous le répertoire de travail (par défaut : `skills`)
- `--site <url>` : URL de base pour la connexion via un navigateur (par défaut : `https://clawhub.ai`)
- `--registry <url>` : URL de base de l’API (par défaut : découverte automatiquement, sinon `https://clawhub.ai`)
- `--no-input` : désactive les invites

Variables d’environnement équivalentes :

- `CLAWHUB_SITE` (ancienne variable `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (ancienne variable `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (ancienne variable `CLAWDHUB_WORKDIR`)

### Proxy HTTP

La CLI respecte les variables d’environnement standard de proxy HTTP pour les systèmes situés derrière des
proxys d’entreprise ou sur des réseaux restreints :

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

Lorsqu’une de ces variables est définie, la CLI achemine les requêtes sortantes par
le proxy indiqué. `HTTPS_PROXY` est utilisé pour les requêtes HTTPS, `HTTP_PROXY`
pour le HTTP non chiffré. `NO_PROXY` / `no_proxy` est respecté afin de contourner le proxy pour
des hôtes ou domaines spécifiques.

Cela est nécessaire sur les systèmes où les connexions sortantes directes sont bloquées
(par exemple, des conteneurs Docker, des VPS Hetzner dont l’accès à Internet passe exclusivement par un proxy ou des
pare-feu d’entreprise).

Exemple :

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "ma requête"
```

Lorsqu’aucune variable de proxy n’est définie, le comportement reste inchangé (connexions directes).

## Fichier de configuration

Stocke votre jeton d’API et l’URL du registre mise en cache.

- macOS : `~/Library/Application Support/clawhub/config.json`
- Linux/XDG : `$XDG_CONFIG_HOME/clawhub/config.json` ou `~/.config/clawhub/config.json`
- Windows : `%APPDATA%\\clawhub\\config.json`
- Solution de repli héritée : si `clawhub/config.json` n’existe pas encore, mais que `clawdhub/config.json` existe, la CLI réutilise l’ancien chemin
- remplacement : `CLAWHUB_CONFIG_PATH` (ancienne variable `CLAWDHUB_CONFIG_PATH`)

## Commandes

### `login` / `auth login`

- Par défaut : ouvre le navigateur à l’adresse `<site>/cli/auth` et termine la connexion via un rappel en boucle locale.
- Sans interface graphique : `clawhub login --token clh_...`
- Mode interactif distant/sans interface graphique : `clawhub login --device` affiche un code et attend pendant que vous l’autorisez à l’adresse `<site>/cli/device`.

### `whoami`

- Vérifie le jeton stocké via `/api/v1/whoami`.

### `token`

- Affiche le jeton d’API stocké sur la sortie standard.
- Utile pour transmettre un jeton de connexion local à des commandes de configuration de secrets CI.

### `star <skill>` / `unstar <skill>`

- Ajoute ou retire une skill de vos favoris.
- Appelle `POST /api/v1/stars/<slug>` et `DELETE /api/v1/stars/<slug>`.
- `--yes` ignore la confirmation.

### `search <query...>`

- Appelle `/api/v1/search?q=...`.
- La sortie inclut le slug de la skill, l’identifiant de son propriétaire, son nom d’affichage et son score de pertinence.
- La recherche favorise les correspondances exactes avec les jetons du slug ou du nom avant la popularité des téléchargements. Un jeton de slug autonome tel que `map` correspond plus fortement à `personal-map` qu’à la sous-chaîne dans `amap`.
- La popularité constitue un léger a priori de classement, et non une garantie d’obtenir la première place.
- Si une skill devrait apparaître, mais n’apparaît pas, exécutez `clawhub inspect @owner/slug` en étant connecté afin de consulter les diagnostics de modération visibles par le propriétaire avant de renommer les métadonnées.

### `explore`

- Répertorie les skills les plus récentes via `/api/v1/skills?limit=...&sort=createdAt` (triées par `createdAt` décroissant).
- Options :
  - `--limit <n>` (1-200, valeur par défaut : 25)
  - `--sort newest|updated|rating|downloads|trending` (valeur par défaut : newest). Les anciens alias de tri d’installation continuent de fonctionner à des fins de compatibilité.
  - `--json` (sortie lisible par une machine)
- Sortie : `<slug>  v<version>  <age>  <summary>` (résumé tronqué à 50 caractères).

### `inspect @owner/slug`

- Récupère les métadonnées et les fichiers de version d’une skill sans l’installer.
- `--version <version>` : examine une version spécifique (par défaut : la plus récente).
- `--tag <tag>` : examine une version étiquetée (par exemple `latest`).
- `--versions` : répertorie l’historique des versions (première page).
- `--limit <n>` : nombre maximal de versions à répertorier (1-200).
- `--files` : répertorie les fichiers de la version sélectionnée.
- `--file <path>` : récupère le contenu brut d’un fichier (fichiers texte uniquement ; limite de 200KB).
- `--json` : sortie lisible par une machine.

### `install @owner/slug`

- Résout la version la plus récente pour le propriétaire et la skill indiqués.
- Télécharge l’archive ZIP via `/api/v1/download`.
- L’extrait dans `<workdir>/<dir>/<slug>`.
- Refuse d’écraser les skills épinglées ; exécutez d’abord `clawhub unpin <skill>`.
- Écrit :
  - `<workdir>/.clawhub/lock.json` (anciennement `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (anciennement `.clawdhub`)

### `uninstall <skill>`

- Supprime `<workdir>/<dir>/<slug>` et l’entrée correspondante du fichier de verrouillage.
- Envoie, dans la mesure du possible, des données de télémétrie lorsque vous êtes connecté afin que les décomptes d’installations actuelles puissent être
  désactivés.
- Mode interactif : demande une confirmation.
- Mode non interactif (`--no-input`) : nécessite `--yes`.

### `list`

- Lit `<workdir>/.clawhub/lock.json` (anciennement `.clawdhub`).
- Affiche `pinned` à côté des skills figées avec `clawhub pin`, ainsi que le motif facultatif.

### `pin <skill>`

- Marque une skill installée comme épinglée dans le fichier de verrouillage.
- `--reason <text>` enregistre la raison pour laquelle la skill est figée.
- Les skills épinglées sont ignorées par `update --all` et rejetées par une commande directe `update <skill>`.
- Les skills épinglées rejettent également `install --force` afin que les octets locaux ne puissent pas être remplacés accidentellement.

### `unpin <skill>`

- Supprime l’épinglage d’une skill installée dans le fichier de verrouillage afin que les futures mises à jour puissent la modifier.

### `update [@owner/slug]` / `update --all`

- Calcule l’empreinte à partir des fichiers locaux.
- Si l’empreinte correspond à une version connue : aucune invite.
- Si l’empreinte ne correspond pas :
  - refuse par défaut
  - écrase avec `--force` (ou après une invite, en mode interactif)
- Les skills épinglées ne sont jamais mises à jour par `--force`.
- `update <skill>` échoue immédiatement pour les skills épinglées et vous indique d’exécuter d’abord `clawhub unpin <skill>`.
- `update --all` ignore les slugs épinglés et affiche un résumé de ce qui est resté figé.

### `skill publish <path>`

- Compare l’empreinte du paquet local avec ClawHub et se termine avec succès lorsque
  le contenu est déjà publié.
- Les nouvelles skills utilisent par défaut la version `1.0.0` ; les skills modifiées utilisent par défaut la version corrective
  suivante.
- `--version <version>` sélectionne explicitement une version et la publie même lorsque le
  contenu correspond à une version existante.
- `--dry-run` résout la publication sans effectuer de téléversement ; `--json` affiche un résultat
  lisible par une machine.
- `--owner <handle>` publie sous l’identifiant d’un éditeur d’organisation ou d’utilisateur lorsque
  l’acteur dispose d’un accès d’éditeur.
- `--migrate-owner` transfère une skill existante vers `--owner` lors de la publication d’une nouvelle
  version. Nécessite un accès d’administrateur ou de propriétaire chez les deux éditeurs.
- Le comportement relatif au propriétaire et à la validation est expliqué dans `docs/publishing.md`.
- Publier une skill signifie qu’elle est distribuée sous `MIT-0` sur ClawHub.
- Les skills publiées peuvent être utilisées, modifiées et redistribuées gratuitement, sans attribution.
- ClawHub ne prend pas en charge les skills payantes ni la tarification par skill.
- Ancien alias : `publish <path>`.

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

Le workflow réutilisable
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
de ClawHub appelle `skill publish` pour un seul `skill_path`, ou pour chaque dossier de skill
situé directement sous `root` (par défaut : `skills`). Il ignore les skills inchangées et utilise le
même comportement automatique d’incrémentation de version corrective.

Définissez `dry_run: true` pour prévisualiser sans jeton. Les publications réelles nécessitent le
secret `clawhub_token`.

### `sync`

- Analyse le répertoire de travail actuel, le répertoire de skills configuré et tout dossier
  `--root <dir>` à la recherche de dossiers de skills locaux contenant `SKILL.md` ou
  `skill.md`.
- Compare l’empreinte de chaque skill locale avec ClawHub et publie uniquement les skills nouvelles ou
  modifiées.
- Les nouvelles skills sont publiées en version `1.0.0` ; les skills modifiées utilisent par défaut la version corrective
  suivante. Utilisez `--bump minor|major` pour les lots de mises à jour qui doivent effectuer un
  incrément semver plus important.
- `--dry-run` affiche le plan de publication sans effectuer de téléversement ; `--json` affiche un plan
  lisible par une machine.
- `--all` publie toutes les skills nouvelles ou modifiées sans invite. Sans
  `--all`, les terminaux interactifs vous permettent de sélectionner les skills à publier.
- `--owner <handle>` publie sous l’identifiant d’un éditeur d’organisation ou d’utilisateur lorsque
  l’acteur dispose d’un accès d’éditeur.
- `sync` effectue uniquement une publication unidirectionnelle. Elle n’installe, ne met à jour, ne télécharge ni
  ne transmet aucune donnée de télémétrie d’installation ou de téléchargement.

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- Nécessite `clawhub login`.
- Exécute ClawScan de ClawHub via `POST /api/v1/skills/-/scan`, puis interroge le service jusqu’à ce que l’analyse atteigne un état terminal.
- Les analyses sont asynchrones et peuvent prendre du temps. Tant qu’elles sont en attente, l’indicateur de progression du terminal affiche la position prioritaire actuelle de l’analyse et le nombre d’analyses qui la précèdent.
- Les analyses de contenus publiés nécessitent un accès de propriétaire ou de gestion de l’éditeur. Les modérateurs et administrateurs peuvent utiliser le même backend via `clawhub-admin`.
- `--update` est valide uniquement avec `--slug` ; cette option réécrit les résultats des analyses publiées réussies dans la version sélectionnée.
- `--output <file.zip>` télécharge l’archive complète du rapport contenant `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` et `README.md`.
- `--json` affiche la réponse complète de l’interrogation pour l’automatisation.
- Les analyses de chemins locaux ne sont plus prises en charge. Téléversez une nouvelle version, puis utilisez `scan download` pour récupérer les résultats d’analyse stockés pour cette version soumise.

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- Nécessite `clawhub login`.
- Télécharge l’archive ZIP du rapport d’analyse stocké pour une version soumise d’une skill ou d’un plugin, y compris les versions bloquées ou masquées par les contrôles de sécurité de ClawHub.
- Les téléchargements de skills utilisent le slug de la skill et utilisent par défaut `--kind skill`.
- Les téléchargements de plugins utilisent le nom du paquet et nécessitent `--kind plugin`.
- `--version` est obligatoire afin que les auteurs examinent précisément la version soumise que ClawHub a bloquée.
- `--output <file.zip>` sélectionne le chemin de destination.

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub fournit un workflow réutilisable officiel à l’emplacement
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/873b7e9a3403dbaa2c66ef15b655803562bd63c0/.github/workflows/skill-publish.yml)
pour les dépôts de skills et les dépôts de catalogues.

Configuration habituelle d’un catalogue :

```yaml
name: Publication des skills

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

Remarques :

- `root` utilise par défaut `skills` pour les dépôts de catalogues.
- Transmettez `skill_path: skills/review-helper` pour traiter un seul dossier de skill.
- `owner` correspond à l’option CLI `--owner` ; omettez-la pour publier en tant qu’utilisateur authentifié.
- La publication de skills V1 utilise `clawhub_token` ; la publication fiable avec GitHub OIDC est actuellement réservée aux paquets.

### `delete <skill>`

- Sans `--version`, supprime logiquement un skill (propriétaire, modérateur ou administrateur).
- Appelle `DELETE /api/v1/skills/{slug}`.
- Les suppressions logiques lancées par le propriétaire réservent le slug pendant 30 jours ; la commande affiche la date et l’heure d’expiration.
- `--version <version>` supprime définitivement une version détenue qui n’est pas la plus récente via une route à sécurité fermée,
  propre à la version.
  Les versions supprimées ne peuvent pas être restaurées ni republiées. Publiez une version de remplacement avant de supprimer la
  version actuellement la plus récente. Le personnel de la plateforme ne peut pas contourner la vérification de propriété pour ce flux limité à une version.
- `--reason <text>` consigne une note de modération sur une suppression logique de l’ensemble du skill et dans le journal d’audit.
- `--note <text>` est un alias de `--reason`.
- `--yes` ignore la confirmation.

### `undelete <skill>`

- Restaure un skill masqué (propriétaire, modérateur ou administrateur).
- Il n’existe aucune restauration de version ; les versions supprimées définitivement ne peuvent pas être restaurées.
- Appelle `POST /api/v1/skills/{slug}/undelete`.
- `--reason <text>` consigne une note de modération sur le skill et dans le journal d’audit.
- `--note <text>` est un alias de `--reason`.
- `--yes` ignore la confirmation.

### `hide <skill>`

- Masque un skill (propriétaire, modérateur ou administrateur).
- Alias de `delete`.

### `unhide <skill>`

- Réaffiche un skill (propriétaire, modérateur ou administrateur).
- Alias de `undelete`.

### `skill rename <skill> <new-name>`

- Renomme un skill détenu et conserve le slug précédent comme alias de redirection.
- Appelle `POST /api/v1/skills/{slug}/rename`.
- `--yes` ignore la confirmation.

### `skill merge <source> <target>`

- Fusionne un skill détenu avec un autre skill détenu.
- Le slug source cesse d’être répertorié publiquement et devient un alias de redirection vers la cible.
- Appelle `POST /api/v1/skills/{sourceSlug}/merge`.
- `--yes` ignore la confirmation.

### `transfer`

- Flux de transfert de propriété.
- Les transferts vers des identifiants utilisateur créent une demande en attente que le destinataire doit accepter.
- Les transferts vers des identifiants d’organisation ou d’éditeur s’appliquent immédiatement uniquement lorsque l’acteur dispose
  d’un accès administrateur à la fois au propriétaire actuel et à l’éditeur de destination.
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
- Utilisez cette commande pour les plugins et les autres entrées de familles de packages ; la commande `search` de premier niveau reste l’interface de recherche des skills.
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

- Récupère les métadonnées d’un package sans l’installer.
- Utilisez cette commande pour examiner les métadonnées, la compatibilité, la vérification, la source ainsi que les versions et fichiers d’un plugin.
- `--version <version>` : examine une version spécifique (valeur par défaut : la plus récente).
- `--tag <tag>` : examine une version étiquetée (par exemple `latest`).
- `--versions` : répertorie l’historique des versions (première page).
- `--limit <n>` : nombre maximal de versions à répertorier (1-100).
- `--files` : répertorie les fichiers de la version sélectionnée.
- `--file <path>` : récupère le contenu brut d’un fichier (fichiers texte uniquement ; limite de 200KB).
- `--json` : sortie lisible par machine.

### `package download <name>`

- Résout une version de package via
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- Télécharge l’artefact depuis le `downloadUrl` du résolveur.
- Vérifie le SHA-256 ClawHub de tous les artefacts.
- Pour les artefacts ClawPack npm-pack, vérifie également l’intégrité npm `sha512`,
  la somme de contrôle npm et le nom/la version du fichier `package.json` de l’archive tar.
- Les anciennes versions ZIP sont téléchargées via la route ZIP historique.
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

- Calcule le SHA-256 ClawHub, l’intégrité npm `sha512` et la somme de contrôle npm d’un
  artefact local.
- Avec `--package`, résout les métadonnées attendues depuis ClawHub et compare le
  fichier local aux métadonnées de l’artefact publié.
- Avec des options de condensat directes, effectue la vérification sans consultation du réseau.
- Options :
  - `--package <name>` : nom du package dont il faut résoudre les métadonnées d’artefact attendues.
  - `--version <version>` ou `--tag <tag>` : version attendue du package.
  - `--sha256 <hex>` : SHA-256 ClawHub attendu.
  - `--npm-integrity <sri>` : intégrité npm attendue.
  - `--npm-shasum <sha1>` : somme de contrôle npm attendue.
  - `--json` : sortie lisible par machine.

Exemples :

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- Exécute le Plugin Inspector intégré à la CLI ClawHub sur un dossier local de
  package de plugin.
- Utilise par défaut une validation hors ligne/statique, sans rechercher ni importer une copie de travail
  locale d’OpenClaw.
- Les erreurs de compatibilité bloquantes produisent un code de sortie non nul. Les résultats limités à des avertissements sont affichés, mais
  produisent un code de sortie nul.
- Options :
  - `--out <dir>` : écrit les rapports de Plugin Inspector dans ce répertoire.
  - `--openclaw <path>` : effectue l’analyse par rapport à une copie de travail locale explicite d’OpenClaw.
  - `--runtime` : active la capture à l’exécution ; importe le code du plugin.
  - `--allow-execute` : autorise la capture à l’exécution dans un espace de travail isolé.
  - `--no-mock-sdk` : désactive le SDK OpenClaw simulé pendant la capture à l’exécution.
  - `--json` : sortie lisible par machine.

Exemple :

```bash
clawhub package validate ./example-plugin
```

Si la validation signale un problème de package, de manifeste, d’importation du SDK ou d’artefact, consultez
[Corrections des problèmes de validation des plugins](/clawhub/plugin-validation-fixes), puis réexécutez la commande.

### `package delete <name>`

- Sans `--version`, supprime logiquement un package et toutes ses versions publiées.
- `--version <version>` supprime définitivement une version publiée détenue qui n’est pas la plus récente via une route à sécurité fermée,
  propre à la version.
  Les versions supprimées ne peuvent pas être restaurées ni republiées. Publiez une version de remplacement avant de supprimer la
  version actuellement la plus récente. Ce flux limité à une version exige d’être le propriétaire du package ou un administrateur de l’organisation éditrice ;
  le personnel de la plateforme ne peut pas contourner la vérification de propriété du package.
- La suppression logique de l’ensemble du package exige d’être le propriétaire du package, un propriétaire/administrateur de l’organisation éditrice, un
  modérateur de la plateforme ou un administrateur de la plateforme.
- Options :
  - `--version <version>` : supprime définitivement une version qui n’est pas la plus récente.
  - `--yes` : ignore la confirmation.
  - `--json` : sortie lisible par machine.

Exemple :

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- Restaure un package supprimé logiquement et ses versions publiées.
- Il n’existe aucune restauration de version ; les versions supprimées définitivement ne peuvent pas être restaurées.
- Exige d’être le propriétaire du package, un propriétaire/administrateur de l’organisation éditrice, un modérateur de la plateforme
  ou un administrateur de la plateforme.
- Appelle `POST /api/v1/packages/{name}/undelete`.
- Options :
  - `--yes` : ignore la confirmation.
  - `--json` : sortie lisible par machine.

Exemple :

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- Transfère un package vers un autre éditeur.
- Exige un accès administrateur à la fois au propriétaire actuel du package et à l’éditeur de
  destination, sauf si l’opération est effectuée par un administrateur de la plateforme.
- Les noms de packages avec portée doivent être transférés au propriétaire de la portée correspondante.
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
- Les signalements concernent l’ensemble du package, peuvent éventuellement être associés à une version et deviennent visibles
  par les modérateurs pour examen.
- Les signalements ne masquent pas automatiquement les packages et ne bloquent pas les téléchargements à eux seuls.
- Options :
  - `--version <version>` : version facultative du package à joindre au signalement.
  - `--reason <text>` : motif obligatoire du signalement.
  - `--json` : sortie lisible par machine.

Exemple :

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "charge utile native suspecte"
```

### `package moderation-status`

- Commande destinée au propriétaire pour vérifier la visibilité d’un package par la modération.
- Appelle `GET /api/v1/packages/{name}/moderation`.
- Affiche l’état actuel de l’analyse du package, le nombre de signalements ouverts, l’état de modération manuelle de la
  dernière version publiée, l’état de blocage des téléchargements et les motifs de modération.
- Options :
  - `--json` : sortie lisible par machine.

Exemple :

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Vérifie si un package est prêt pour une future utilisation par OpenClaw.
- Appelle `GET /api/v1/packages/{name}/readiness`.
- Signale les éléments bloquants concernant le statut officiel, la disponibilité de ClawPack, le condensat de l’artefact,
  la provenance de la source, la compatibilité avec OpenClaw, les cibles hôtes, les métadonnées d’environnement
  et l’état de l’analyse.
- Options :
  - `--json` : sortie lisible par machine.

Exemple :

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Affiche l’état de migration destiné aux opérateurs pour un package susceptible de remplacer un
  plugin OpenClaw intégré.
- Appelle le même point de terminaison calculé de préparation que `package readiness`, mais affiche
  un état axé sur la migration, la dernière version, l’état de package officiel, les vérifications et
  les éléments bloquants.
- Options :
  - `--json` : sortie lisible par machine.

Exemple :

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- Crée une organisation éditrice détenue par l’utilisateur authentifié.
- L’identifiant est normalisé en minuscules et peut être fourni avec ou sans `@`.
- Les organisations éditrices nouvellement créées ne sont ni approuvées ni officielles par défaut.
- Échoue si l’identifiant est déjà utilisé par un éditeur existant, un utilisateur ou une route réservée.

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- Publie un Plugin de code ou un Plugin groupé via `POST /api/v1/packages`.
- `<source>` accepte :
  - Chemin d’un dossier local : `./my-plugin`
  - Archive tar npm-pack ClawPack locale : `./my-plugin-1.2.3.tgz`
  - Dépôt GitHub : `owner/repo` ou `owner/repo@ref`
  - URL GitHub : `https://github.com/owner/repo`
- Les métadonnées sont détectées automatiquement à partir de `package.json`, `openclaw.plugin.json` et
  des marqueurs réels de bundle OpenClaw tels que `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` et `.cursor-plugin/plugin.json`.
- Les sources `.tgz` sont traitées comme des ClawPack. La CLI téléverse les octets
  npm-pack exacts et utilise le contenu extrait de `package/` uniquement pour la
  validation et le préremplissage des métadonnées.
- Les dossiers de Plugins de code sont empaquetés dans une archive tar npm ClawPack
  avant le téléversement afin que les installations OpenClaw puissent vérifier
  l’artefact exact. Les dossiers de Plugins groupés utilisent toujours le chemin
  de publication des fichiers extraits.
- Pour les sources GitHub, l’attribution de la source est renseignée automatiquement à partir du dépôt, du commit résolu, de la référence et du sous-chemin.
- Pour les dossiers locaux, l’attribution de la source est détectée automatiquement depuis le dépôt git local lorsque le dépôt distant d’origine pointe vers GitHub.
- Les Plugins de code externes doivent déclarer explicitement
  `openclaw.compat.pluginApi` et `openclaw.build.openclawVersion`.
  Le champ de premier niveau `package.json.version` n’est pas utilisé comme valeur de repli pour la validation de publication.
- `--dry-run` affiche un aperçu de la charge utile de publication résolue sans la téléverser.
- `--json` produit une sortie lisible par machine pour la CI.
- `--owner <handle>` publie sous l’identifiant d’un éditeur utilisateur ou d’une organisation lorsque l’acteur dispose d’un accès éditeur.
- Les noms de paquets avec portée doivent correspondre au propriétaire sélectionné. Consultez `docs/publishing.md`.
- Les options existantes (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) fonctionnent toujours comme valeurs de remplacement.
- Les dépôts GitHub privés nécessitent `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### Flux local recommandé

Utilisez d’abord `--dry-run` afin de pouvoir confirmer les métadonnées résolues du paquet et
l’attribution de la source avant de créer une version réelle :

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Flux avec un dossier local

Pour les Plugins de code, la publication d’un dossier crée et téléverse un artefact ClawPack
depuis le dossier du paquet :

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `package.json` minimal pour `--family code-plugin`

Les Plugins de code externes nécessitent quelques métadonnées OpenClaw dans
`package.json`. Ce manifeste minimal suffit pour réussir une publication :

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

Champs obligatoires :

- `openclaw.compat.pluginApi`
- `openclaw.build.openclawVersion`

Remarques :

- `package.json.version` est la version publiée de votre paquet, mais elle n’est pas utilisée comme
  valeur de repli pour la validation de la compatibilité ou de la compilation OpenClaw.
- `openclaw.hostTargets` et `openclaw.environment` sont des métadonnées facultatives.
  ClawHub peut les afficher lorsqu’elles sont présentes, mais elles ne sont pas requises pour la publication.
- `openclaw.compat.minGatewayVersion` et
  `openclaw.build.pluginSdkVersion` sont des compléments facultatifs si vous souhaitez publier
  des métadonnées de compatibilité plus détaillées.
- Si vous utilisez une ancienne version de la CLI `clawhub`, effectuez une mise à niveau avant la publication afin que
  les vérifications préalables locales soient exécutées avant le téléversement.
- Si la validation signale un code de correction, consultez
  [Correctifs de validation des Plugins](/clawhub/plugin-validation-fixes).

#### GitHub Actions

ClawHub fournit également un workflow réutilisable officiel dans
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/873b7e9a3403dbaa2c66ef15b655803562bd63c0/.github/workflows/package-publish.yml)
pour les dépôts de Plugins.

Configuration type de l’appelant :

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
- Pour les monorepos, transmettez `source_path` afin que le workflow publie le dossier
  du paquet du Plugin, par exemple `source_path: extensions/codex`.
- Épinglez le workflow réutilisable à un tag stable ou au SHA complet d’un commit. N’exécutez pas la publication d’une version depuis `@main`.
- `pull_request` doit utiliser `dry_run: true` afin que la CI ne produise aucune modification persistante.
- Les publications réelles doivent être limitées à des événements de confiance tels que `workflow_dispatch` ou les envois de tags.
- La publication de confiance sans secret fonctionne uniquement avec `workflow_dispatch` ; les envois de tags nécessitent toujours `clawhub_token`.
- Conservez `clawhub_token` disponible pour la première publication, les paquets non approuvés ou les publications d’urgence.
- Le workflow téléverse le résultat JSON comme artefact et l’expose dans ses sorties.

### `package trusted-publisher get <name>`

- Affiche la configuration de l’éditeur de confiance GitHub Actions pour un paquet.
- Utilisez cette commande après avoir défini la configuration afin de confirmer le dépôt, le nom du fichier de workflow
  et l’épinglage facultatif de l’environnement.
- Options :
  - `--json` : sortie lisible par machine.

Exemple :

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- Associe ou remplace la configuration de l’éditeur de confiance GitHub Actions pour un paquet
  existant.
- Le paquet doit d’abord être créé par une publication normale manuelle ou authentifiée par jeton
  avec `clawhub package publish`.
- Une fois la configuration définie, les futures publications GitHub Actions prises en charge peuvent utiliser
  OIDC et la publication de confiance sans jeton ClawHub à longue durée de vie.
- `--repository <repo>` doit être au format `owner/repo`.
- `--workflow-filename <file>` doit correspondre au nom du fichier de workflow dans
  `.github/workflows/`.
- `--environment <name>` est facultatif. Lorsqu’il est configuré, l’environnement GitHub Actions
  dans la revendication OIDC doit correspondre exactement.
- ClawHub vérifie le dépôt GitHub configuré lors de l’exécution de cette commande.
  Les dépôts publics peuvent être vérifiés à l’aide des métadonnées publiques de GitHub. Les dépôts
  privés nécessitent que ClawHub dispose d’un accès GitHub à ce dépôt, par
  exemple via une future installation de l’application GitHub ClawHub ou une autre intégration
  GitHub autorisée.
- Options :
  - `--repository <repo>` : dépôt GitHub, par exemple `openclaw/example-plugin`.
  - `--workflow-filename <file>` : nom du fichier de workflow, par exemple `package-publish.yml`.
  - `--environment <name>` : environnement GitHub Actions facultatif devant correspondre exactement.
  - `--json` : sortie lisible par machine.

Exemple :

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- Supprime la configuration de l’éditeur de confiance d’un paquet.
- Utilisez cette commande comme solution de retour arrière si l’épinglage du workflow, du dépôt ou de l’environnement doit
  être désactivé ou recréé.
- Les futures publications réelles doivent utiliser une publication authentifiée normale jusqu’à ce que la configuration soit
  de nouveau définie.
- Options :
  - `--json` : sortie lisible par machine.

Exemple :

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### Télémétrie d’installation

- Envoyée après `clawhub install <slug>` lorsque vous êtes connecté, sauf si
  `CLAWHUB_DISABLE_TELEMETRY=1` est défini.
- La transmission s’effectue au mieux. Les commandes d’installation n’échouent pas si la télémétrie est
  indisponible.
- Détails : `docs/telemetry.md`.
