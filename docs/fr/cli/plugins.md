---
read_when:
    - Vous souhaitez installer ou gérer des plugins Gateway ou des ensembles compatibles
    - Vous souhaitez générer la structure initiale ou valider un Plugin d’outil simple
    - Vous souhaitez déboguer les échecs de chargement des plugins
sidebarTitle: Plugins
summary: Référence de la CLI pour `openclaw plugins` (initialiser, compiler, valider, répertorier, installer, place de marché, désinstaller, activer/désactiver, diagnostic)
title: Plugins
x-i18n:
    generated_at: "2026-07-12T02:43:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 729e74103a302936dc45da3be31306803b16e9dae182e78b3742783b892a9027
    source_path: cli/plugins.md
    workflow: 16
---

Gérez les plugins du Gateway, les packs de hooks et les bundles compatibles.

<CardGroup cols={2}>
  <Card title="Plugin system" href="/fr/tools/plugin">
    Guide destiné aux utilisateurs pour installer, activer et dépanner les plugins.
  </Card>
  <Card title="Manage plugins" href="/fr/plugins/manage-plugins">
    Exemples rapides d’installation, d’affichage, de mise à jour, de désinstallation et de publication.
  </Card>
  <Card title="Plugin bundles" href="/fr/plugins/bundles">
    Modèle de compatibilité des bundles.
  </Card>
  <Card title="Plugin manifest" href="/fr/plugins/manifest">
    Champs du manifeste et schéma de configuration.
  </Card>
  <Card title="Security" href="/fr/gateway/security">
    Renforcement de la sécurité pour l’installation des plugins.
  </Card>
</CardGroup>

## Commandes

```bash
openclaw plugins list [--enabled] [--verbose] [--json]
openclaw plugins search <query> [--limit <n>] [--json]
openclaw plugins install <path-or-spec> [--link] [--force] [--pin] [--marketplace <source>]
openclaw plugins inspect <id> [--runtime] [--json]
openclaw plugins inspect --all [--runtime] [--json]
openclaw plugins info <id>                    # alias for inspect
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins uninstall <id> [--dry-run] [--keep-files] [--force]
openclaw plugins update <id-or-npm-spec> | --all [--dry-run]
openclaw plugins registry [--refresh] [--json]
openclaw plugins doctor
openclaw plugins init <id> [--name <name>] [--type tool|provider] [--directory <path>]
openclaw plugins build [--entry <path>] [--check]
openclaw plugins validate [--entry <path>]
openclaw plugins marketplace entries [--offline] [--feed-profile <name>] [--json]
openclaw plugins marketplace list <source> [--json]
openclaw plugins marketplace refresh [--feed-profile <name>] [--expected-sha256 <sha256>] [--json]
```

Pour analyser une installation, une inspection, une désinstallation ou une actualisation du registre lente, exécutez la
commande avec `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. La trace écrit les durées des phases
sur stderr et conserve une sortie JSON analysable. Consultez [Débogage](/fr/help/debugging#plugin-lifecycle-trace).

<Note>
En mode Nix (`OPENCLAW_NIX_MODE=1`), `openclaw.json` est immuable. Les commandes `install`, `update`, `uninstall`, `enable` et `disable` refusent toutes de s’exécuter. Modifiez plutôt la source Nix de cette installation (`programs.openclaw.config` ou `instances.<name>.config` pour nix-openclaw), puis reconstruisez-la. Consultez le [Démarrage rapide](https://github.com/openclaw/nix-openclaw#quick-start) axé sur les agents.
</Note>

<Note>
Les plugins intégrés sont fournis avec OpenClaw. Certains sont activés par défaut (par exemple les fournisseurs de modèles intégrés, les fournisseurs vocaux intégrés et le plugin de navigateur intégré) ; d’autres nécessitent `plugins enable`.

Les plugins OpenClaw natifs fournissent `openclaw.plugin.json` avec un schéma JSON intégré (`configSchema`, même s’il est vide). Les bundles compatibles utilisent plutôt leurs propres manifestes de bundle.

`plugins list` affiche `Format: openclaw` ou `Format: bundle`. La sortie détaillée de la liste et des informations affiche également le sous-type du bundle (`codex`, `claude` ou `cursor`), ainsi que les fonctionnalités détectées du bundle.
</Note>

## Création

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

Par défaut, `plugins init` crée un plugin d’outil TypeScript minimal. Le premier
argument est l’identifiant du plugin ; `--name` définit le nom d’affichage. OpenClaw utilise
l’identifiant pour le répertoire de sortie par défaut et le nommage du paquet. Les structures d’outils utilisent
`defineToolPlugin` et génèrent les scripts `plugin:build` et
`plugin:validate` dans `package.json`, qui effectuent la compilation puis appellent `openclaw plugins build`/`validate`.

`plugins build` importe le point d’entrée compilé, lit les métadonnées statiques de l’outil, écrit
`openclaw.plugin.json` et maintient `openclaw.extensions` de `package.json` synchronisé.
`plugins validate` vérifie que le manifeste généré, les métadonnées du paquet et
l’exportation actuelle du point d’entrée concordent toujours. Consultez [Plugins d’outils](/fr/plugins/tool-plugins) pour
le processus de création complet.

La structure génère du code source TypeScript, mais produit les métadonnées à partir du point d’entrée compilé
`./dist/index.js` ; ce processus fonctionne donc également avec la CLI publiée. Utilisez
`--entry <path>` lorsque le point d’entrée n’est pas celui par défaut du paquet. Utilisez
`plugins build --check` dans la CI pour provoquer un échec lorsque les métadonnées générées sont obsolètes, sans
réécrire les fichiers.

### Structure de fournisseur

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

Les structures de fournisseurs créent un plugin générique de fournisseur de modèles compatible avec OpenAI,
avec la gestion de l’authentification par clé API, un script `npm run validate` qui exécute
`clawhub package validate`, les métadonnées du paquet ClawHub et un workflow
GitHub Actions déclenché manuellement pour permettre ultérieurement une publication de confiance via GitHub
OIDC. Les structures de fournisseurs ne génèrent pas de Skills et n’utilisent pas
`openclaw plugins build`/`validate` ; ces commandes sont destinées au processus de métadonnées générées
de la structure d’outil.

Avant la publication, remplacez l’URL de base factice de l’API, le catalogue de modèles, le chemin
de documentation, le texte relatif aux identifiants et le contenu du README par les informations réelles du fournisseur. Utilisez le
README généré pour la première publication sur ClawHub et la configuration de l’éditeur de confiance.

## Installation

```bash
openclaw plugins search "calendar"                      # search ClawHub plugins
openclaw plugins install <package>                       # source auto-detection
openclaw plugins install clawhub:<package>                # ClawHub only
openclaw plugins install npm:<package>                    # npm only
openclaw plugins install npm-pack:<path.tgz>               # local npm-pack tarball
openclaw plugins install git:github.com/<owner>/<repo>     # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <path>                            # local path or archive
openclaw plugins install -l <path>                         # link instead of copy
openclaw plugins install <plugin>@<marketplace>             # marketplace shorthand
openclaw plugins install <plugin> --marketplace <name>      # marketplace (explicit)
openclaw plugins install <package> --force                  # overwrite existing install
openclaw plugins install <package> --pin                    # pin resolved npm version
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
```

Les responsables qui testent les installations effectuées pendant la configuration peuvent remplacer les
sources automatiques d’installation des plugins à l’aide de variables d’environnement protégées. Consultez
[Remplacement des sources d’installation des plugins](/fr/plugins/install-overrides).

<Warning>
Pendant la transition du lancement, les noms de paquets seuls sont installés depuis npm par défaut, sauf s’ils correspondent à l’identifiant d’un plugin intégré ou officiel, auquel cas OpenClaw utilise cette copie locale ou officielle au lieu d’interroger le registre npm. Utilisez `npm:<package>` lorsque vous souhaitez délibérément utiliser un paquet npm externe. Utilisez `clawhub:<package>` pour ClawHub. Traitez l’installation de plugins comme l’exécution de code ; privilégiez les versions épinglées.
</Warning>

`plugins search` interroge ClawHub pour trouver des paquets `code-plugin` et
`bundle-plugin` installables (pas des Skills ; utilisez `openclaw skills search` pour ces derniers).
La valeur par défaut de `--limit` est 20, avec un maximum de 100. Cette commande lit uniquement le catalogue distant : elle
n’inspecte aucun état local, ne modifie pas la configuration, n’installe aucun paquet et ne charge
aucun environnement d’exécution de plugin. Les résultats comprennent le nom du paquet ClawHub, sa famille, son canal, sa version,
son résumé et une indication d’installation telle que `openclaw plugins install clawhub:<package>`.

<Note>
ClawHub constitue la principale interface de distribution et de découverte pour la plupart des plugins. Npm
reste une solution de secours prise en charge et une méthode d’installation directe. Les paquets de plugins
`@openclaw/*` appartenant à OpenClaw sont de nouveau publiés sur npm ; consultez la liste actuelle
sur [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) ou
[l’inventaire des plugins](/fr/plugins/plugin-inventory). Les installations stables utilisent `latest`.
Les installations et mises à jour du canal bêta privilégient la balise de distribution npm `beta` lorsqu’elle est disponible,
avec un retour à `latest` dans le cas contraire. Sur le canal stable étendu, les plugins npm officiels
dont l’intention est implicite, par défaut ou `latest` sont résolus vers la version exacte du cœur
installé. Les versions exactes épinglées et les balises explicites autres que `latest`, les paquets tiers et
les sources autres que npm ne sont pas réécrits.
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config repair">
    Si votre section `plugins` repose sur un unique `$include` de fichier, `plugins install/update/enable/disable/uninstall` écrit directement dans ce fichier inclus et laisse `openclaw.json` intact. Les inclusions racine, les tableaux d’inclusions et les inclusions accompagnées de substitutions au même niveau échouent de manière fermée au lieu d’être aplatis. Consultez [Inclusions de configuration](/fr/gateway/configuration) pour connaître les structures prises en charge.

    Si la configuration est invalide pendant l’installation, `plugins install` échoue normalement de manière fermée et vous indique d’exécuter d’abord `openclaw doctor --fix`. Lors du démarrage et du rechargement à chaud du Gateway, une configuration de plugin invalide échoue de manière fermée comme toute autre configuration invalide ; `openclaw doctor --fix` peut mettre en quarantaine l’entrée de plugin invalide. La seule exception documentée au moment de l’installation est un processus de récupération limité pour les plugins intégrés qui activent explicitement `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force` réutilise la cible d’installation existante et écrase sur place un plugin ou un pack de hooks déjà installé. Utilisez cette option lorsque vous réinstallez volontairement le même identifiant depuis un nouveau chemin local, une archive, un paquet ClawHub ou un artefact npm. Pour les mises à niveau ordinaires d’un plugin npm déjà suivi, privilégiez `openclaw plugins update <id-or-npm-spec>`.

    Si vous exécutez `plugins install` pour un identifiant de plugin déjà installé, OpenClaw s’arrête et vous oriente vers `plugins update <id-or-npm-spec>` pour une mise à niveau normale, ou vers `plugins install <package> --force` lorsque vous souhaitez réellement écraser l’installation actuelle à partir d’une autre source. `--force` n’est pas pris en charge avec `--link`.

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` s’applique uniquement aux installations npm et enregistre la valeur exacte résolue `<name>@<version>`. Cette option n’est pas prise en charge avec les installations `git:` (épinglez plutôt la référence dans la spécification, par exemple `git:github.com/acme/plugin@v1.2.3`) ni avec `--marketplace` (les installations depuis une place de marché conservent les métadonnées de la source de la place de marché au lieu d’une spécification npm).
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` est obsolète et n’a désormais aucun effet. OpenClaw n’exécute plus le blocage intégré du code dangereux lors de l’installation des plugins.

    Utilisez l’interface `security.installPolicy`, contrôlée par l’opérateur, lorsqu’une politique d’installation propre à l’hôte est requise. Les hooks `before_install` des plugins sont des hooks du cycle de vie de l’environnement d’exécution des plugins, et non la principale limite de politique pour les installations via la CLI.

    Si un plugin que vous avez publié sur ClawHub est masqué ou bloqué par une analyse du registre, suivez les étapes destinées aux éditeurs dans [Publication sur ClawHub](/fr/clawhub/publishing). `--dangerously-force-unsafe-install` ne demande pas à ClawHub d’analyser de nouveau le plugin ni de rendre publique une version bloquée.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    Les installations de paquets communautaires depuis ClawHub vérifient l’enregistrement de confiance de la version sélectionnée avant son téléchargement. Si ClawHub désactive le téléchargement de la version, signale des résultats d’analyse malveillants ou place la version dans un état de modération bloquant (mise en quarantaine ou révoquée), OpenClaw la refuse catégoriquement, indépendamment de cette option. Pour les états de modération ou les résultats d’analyse risqués mais non bloquants, OpenClaw affiche les informations de confiance et demande une confirmation avant de continuer.

    Utilisez `--acknowledge-clawhub-risk` uniquement après avoir examiné l’avertissement de ClawHub et décidé de continuer sans invite interactive. Les résultats d’analyse en attente ou obsolètes (pas encore déclarés sains) génèrent un avertissement, mais ne nécessitent pas d’acceptation. Les paquets ClawHub officiels et les sources de plugins intégrés d’OpenClaw contournent entièrement cette vérification de confiance de la version.

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install` sert également d’interface d’installation pour les packs de hooks qui exposent `openclaw.hooks` dans `package.json`. Utilisez `openclaw hooks` pour afficher les hooks de manière filtrée et les activer individuellement, et non pour installer les paquets.

    Les spécifications npm sont **limitées au registre** (nom du paquet accompagné éventuellement d’une **version exacte** ou d’un **dist-tag**). Les spécifications Git/URL/fichier et les plages semver sont rejetées. Pour plus de sécurité, les dépendances sont installées avec `--ignore-scripts` dans un projet npm géré distinct pour chaque plugin, même si votre shell définit des paramètres globaux d’installation npm. Les projets npm gérés des plugins héritent des `overrides` npm définies au niveau du paquet OpenClaw ; les versions de sécurité imposées par l’hôte s’appliquent donc également aux dépendances de plugins hissées.

    Utilisez `npm:<package>` pour indiquer explicitement la résolution par npm. Les spécifications de paquet sans préfixe sont également installées directement depuis npm pendant la transition de lancement, sauf si elles correspondent à l’identifiant d’un plugin officiel.

    Les spécifications `@openclaw/*` brutes correspondant à des plugins intégrés sont résolues vers la copie intégrée appartenant à l’image avant le repli vers npm. Par exemple, `openclaw plugins install @openclaw/discord@2026.5.20 --pin` utilise le plugin Discord intégré à la version actuelle d’OpenClaw au lieu de créer une substitution npm gérée. Pour forcer l’utilisation du paquet npm externe, exécutez `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`.

    Les spécifications sans préfixe et `@latest` restent sur le canal stable. Les versions correctives horodatées d’OpenClaw, telles que `2026.5.3-1`, sont considérées comme stables pour cette vérification. Si npm résout l’une de ces formes vers une préversion, OpenClaw s’arrête et vous demande de l’accepter explicitement au moyen d’une étiquette de préversion (`@beta`/`@rc`) ou d’une version de préversion exacte (`@1.2.3-beta.4`).

    Pour les installations npm sans version exacte (`npm:<package>` ou `npm:<package>@latest`), OpenClaw vérifie les métadonnées du paquet résolu avant l’installation. Si le dernier paquet stable exige une API de plugin OpenClaw plus récente ou une version minimale de l’hôte supérieure, OpenClaw examine les anciennes versions stables et installe plutôt la version compatible la plus récente. Les versions exactes et les dist-tags explicites restent stricts : une sélection incompatible échoue et vous demande de mettre à niveau OpenClaw ou de choisir une version compatible.

    Si une spécification d’installation sans préfixe correspond à l’identifiant d’un plugin officiel (par exemple `diffs`), OpenClaw installe directement l’entrée du catalogue. Pour installer un paquet npm portant le même nom, utilisez une spécification explicitement délimitée par un espace de noms (par exemple `@scope/diffs`).

  </Accordion>
  <Accordion title="Dépôts Git">
    Utilisez `git:<repo>` pour installer directement depuis un dépôt Git. Formes prises en charge : `git:github.com/owner/repo`, `git:owner/repo`, URL complètes `https://`, `ssh://`, `git://`, `file://` et URL de clonage `git@host:owner/repo.git`. Ajoutez `@<ref>` ou `#<ref>` pour extraire une branche, une étiquette ou un commit avant l’installation.

    Les installations Git clonent le dépôt dans un répertoire temporaire, extraient la référence demandée lorsqu’elle est présente, puis utilisent le programme d’installation normal des répertoires de plugins. Ainsi, la validation du manifeste, la politique d’installation de l’opérateur, les opérations d’installation du gestionnaire de paquets et les enregistrements d’installation se comportent comme pour les installations npm. Les installations Git enregistrées incluent l’URL et la référence de la source ainsi que le commit résolu, afin que `openclaw plugins update` puisse résoudre de nouveau la source ultérieurement.

    Après une installation depuis Git, utilisez `openclaw plugins inspect <id> --runtime --json` pour vérifier les enregistrements d’exécution tels que les méthodes du Gateway et les commandes CLI. Si le plugin a enregistré une racine CLI avec `api.registerCli`, exécutez cette commande directement par l’intermédiaire de la CLI racine d’OpenClaw, par exemple `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    Archives prises en charge : `.zip`, `.tgz`, `.tar.gz`, `.tar`. Les archives de plugins OpenClaw natifs doivent contenir un fichier `openclaw.plugin.json` valide à la racine du plugin extrait ; les archives qui ne contiennent que `package.json` sont rejetées avant qu’OpenClaw n’écrive les enregistrements d’installation.

    Utilisez `npm-pack:<path.tgz>` lorsque le fichier est une archive tar npm-pack et que vous souhaitez
    utiliser le même chemin de projet npm géré par plugin que pour les installations depuis le registre,
    y compris la vérification de `package-lock.json`, l’analyse des dépendances hissées
    et les enregistrements d’installation npm. Les chemins d’archive simples s’installent toujours comme
    des archives locales sous la racine des extensions de plugins.

    Les installations depuis la place de marché Claude sont également prises en charge.

  </Accordion>
</AccordionGroup>

Les installations ClawHub utilisent un localisateur explicite `clawhub:<package>` :

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Les spécifications de plugins sans préfixe compatibles avec les noms npm sont installées depuis npm par défaut pendant la transition de lancement, sauf si elles correspondent à l’identifiant d’un plugin officiel :

```bash
openclaw plugins install openclaw-codex-app-server
```

Utilisez `npm:` pour indiquer explicitement une résolution exclusivement par npm :

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw vérifie avant l’installation la compatibilité annoncée avec l’API du plugin et la version minimale du Gateway. Lorsque la version ClawHub sélectionnée publie un artefact ClawPack, OpenClaw télécharge le fichier `.tgz` npm-pack versionné, vérifie l’en-tête d’empreinte ClawHub et l’empreinte de l’artefact, puis l’installe par le chemin d’archive normal. Les anciennes versions de ClawHub dépourvues de métadonnées ClawPack sont toujours installées par l’ancien chemin de vérification des archives de paquets. Les installations enregistrées conservent leurs métadonnées de source ClawHub, le type d’artefact, l’intégrité npm, la somme SHA npm, le nom de l’archive tar et les informations d’empreinte ClawPack pour les mises à jour ultérieures.
Les installations ClawHub sans version conservent une spécification enregistrée non versionnée afin que `openclaw plugins update` puisse suivre les nouvelles versions ClawHub ; les sélecteurs explicites de version ou d’étiquette tels que `clawhub:pkg@1.2.3` et `clawhub:pkg@beta` restent épinglés à ce sélecteur.

### Forme abrégée de la place de marché

Utilisez la forme abrégée `plugin@marketplace` lorsque le nom de la place de marché existe dans le cache local du registre Claude à l’emplacement `~/.claude/plugins/known_marketplaces.json` :

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Utilisez `--marketplace` pour transmettre explicitement la source de la place de marché :

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Sources de la place de marché">
    - un nom de place de marché connue de Claude provenant de `~/.claude/plugins/known_marketplaces.json`
    - une racine de place de marché locale ou un chemin vers `marketplace.json`
    - une forme abrégée de dépôt GitHub telle que `owner/repo`
    - une URL de dépôt GitHub telle que `https://github.com/owner/repo`
    - une URL Git

  </Tab>
  <Tab title="Règles des places de marché distantes">
    Pour les places de marché distantes chargées depuis GitHub ou Git, les entrées de plugins doivent rester dans le dépôt cloné de la place de marché. OpenClaw accepte les sources sous forme de chemins relatifs provenant de ce dépôt et rejette les sources de plugins HTTP(S), à chemin absolu, Git, GitHub et autres sources qui ne sont pas des chemins dans les manifestes distants.
  </Tab>
</Tabs>

Pour les chemins locaux et les archives, OpenClaw détecte automatiquement :

- les plugins OpenClaw natifs (`openclaw.plugin.json`)
- les paquets compatibles avec Codex (`.codex-plugin/plugin.json`)
- les paquets compatibles avec Claude (`.claude-plugin/plugin.json`, ou la disposition par défaut des composants Claude lorsque ce fichier manifeste est absent)
- les paquets compatibles avec Cursor (`.cursor-plugin/plugin.json`)

Les installations locales gérées doivent être des répertoires ou des archives de plugins. Les fichiers de plugin autonomes `.js`,
`.mjs`, `.cjs` et `.ts` ne sont pas copiés dans la racine gérée des plugins
par `plugins install`, ni chargés lorsqu’ils sont placés directement dans
`~/.openclaw/extensions` ou `<workspace>/.openclaw/extensions` ; ces
racines découvertes automatiquement chargent des répertoires de paquets ou de lots de plugins et ignorent
les fichiers de script de premier niveau en tant qu’outils auxiliaires locaux. Répertoriez explicitement les fichiers autonomes dans
`plugins.load.paths`.

<Note>
Les paquets compatibles sont installés dans la racine normale des plugins et participent au même flux de liste, d’informations, d’activation et de désactivation. Actuellement, les Skills de paquets, les Skills de commande Claude, les valeurs par défaut de `settings.json` de Claude, les valeurs par défaut de `.lsp.json` de Claude et de `lspServers` déclarées dans le manifeste, les Skills de commande Cursor ainsi que les répertoires de hooks Codex compatibles sont pris en charge ; les autres fonctionnalités de paquets détectées apparaissent dans les diagnostics et les informations, mais ne sont pas encore reliées à l’exécution.
</Note>

Utilisez `-l`/`--link` pour pointer vers un répertoire de plugin local sans le copier (l’ajoute
à `plugins.load.paths`) :

```bash
openclaw plugins install -l ./my-plugin
```

`--link` n’est pas pris en charge avec `--force` (les plugins liés pointent directement vers le chemin
source, il n’y a donc rien à remplacer sur place), `--marketplace` ou
les installations `git:`, et nécessite un chemin local existant.

<Note>
Les plugins provenant d’un espace de travail et découverts depuis la racine des extensions de celui-ci ne sont ni
importés ni exécutés tant qu’ils ne sont pas explicitement activés. Pour le développement local,
exécutez `openclaw plugins enable <plugin-id>` ou définissez
`plugins.entries.<plugin-id>.enabled: true` ; si votre configuration utilise
`plugins.allow`, incluez-y également le même identifiant de plugin. Cette règle de refus par défaut
s’applique aussi lorsque la configuration d’un canal cible explicitement un plugin provenant de l’espace de travail pour
un chargement limité à la configuration : le code de configuration du plugin de canal local ne s’exécutera pas tant que ce
plugin de l’espace de travail restera désactivé ou exclu de la liste d’autorisation. Les installations liées
et les entrées explicites de `plugins.load.paths` suivent la politique normale correspondant à
l’origine résolue de leur plugin. Consultez
[Configurer la politique des plugins](/fr/tools/plugin#configure-plugin-policy)
et la [Référence de configuration](/fr/gateway/configuration-reference#plugins).

Utilisez `--pin` lors des installations npm pour enregistrer la spécification exacte résolue (`name@version`) dans l’index géré des plugins, tout en conservant le comportement par défaut non épinglé.
</Note>

## Liste

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  Affiche uniquement les plugins activés.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Remplace la vue en tableau par des lignes de détails par plugin contenant les métadonnées de format, de source, d’origine, de version et d’activation.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventaire lisible par machine, accompagné des diagnostics du registre et de l’état d’installation des dépendances de paquets.
</ParamField>

<Note>
`plugins list` lit d’abord le registre local persistant des plugins, avec un repli dérivé uniquement du manifeste lorsque le registre est absent ou non valide. Cette commande est utile pour vérifier si un plugin est installé, activé et visible pour la planification d’un démarrage à froid, mais elle ne constitue pas une sonde d’exécution en direct d’un processus Gateway déjà lancé. Après avoir modifié le code d’un plugin, son activation, la politique des hooks ou `plugins.load.paths`, redémarrez le Gateway qui dessert le canal avant de vous attendre à ce que le nouveau code `register(api)` ou les nouveaux hooks s’exécutent. Pour les déploiements distants ou en conteneur, vérifiez que vous redémarrez bien le véritable processus enfant `openclaw gateway run`, et pas seulement un processus enveloppe.

`plugins list --json` inclut le champ `dependencyStatus` de chaque plugin, calculé à partir de
`dependencies` et `optionalDependencies` dans `package.json`. OpenClaw vérifie si les noms de ces paquets
sont présents le long du chemin de recherche `node_modules` normal du plugin dans Node ; il
n’importe pas le code d’exécution du plugin, n’exécute aucun gestionnaire de paquets et ne répare pas
les dépendances manquantes.
</Note>

Si les journaux de démarrage affichent `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`,
exécutez `openclaw plugins list --enabled --verbose` ou
`openclaw plugins inspect <id>` avec l’identifiant d’un plugin répertorié afin de confirmer les
identifiants de plugins et de copier les identifiants de confiance dans `plugins.allow` dans `openclaw.json`. Lorsque
l’avertissement peut répertorier tous les plugins découverts, il affiche un extrait
`plugins.allow` prêt à être collé qui contient déjà ces identifiants. Si un plugin est chargé
sans provenance d’installation ni de chemin de chargement, inspectez cet identifiant de plugin, puis épinglez
l’identifiant de confiance dans `plugins.allow` ou réinstallez le plugin depuis une source de confiance
afin qu’OpenClaw enregistre la provenance de l’installation.

Pour travailler sur un plugin intégré dans une image Docker empaquetée, montez par liaison le répertoire
source du plugin sur le chemin source empaqueté correspondant, par exemple
`/app/extensions/synology-chat`. OpenClaw découvre cette superposition de source montée
avant `/app/dist/extensions/synology-chat` ; un répertoire source simplement copié
reste inactif, de sorte que les installations empaquetées normales continuent d’utiliser la distribution compilée.

Pour déboguer les hooks d’exécution :

- `openclaw plugins inspect <id> --runtime --json` affiche les hooks enregistrés et les diagnostics issus d’une passe d’inspection avec chargement du module. L’inspection à l’exécution n’installe jamais de dépendances ; utilisez `openclaw doctor --fix` pour nettoyer l’état des dépendances héritées ou récupérer les plugins téléchargeables manquants référencés par la configuration.
- `openclaw gateway status --deep --require-rpc` confirme l’URL/le profil du Gateway accessible, les indications relatives au service/processus, le chemin de configuration et l’état de santé RPC.
- Les hooks de conversation non intégrés (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) nécessitent `plugins.entries.<id>.hooks.allowConversationAccess=true`.

### Index des plugins

Les métadonnées d’installation des plugins constituent un état géré par la machine, et non une configuration utilisateur. Les installations et les mises à jour les écrivent dans la base de données d’état SQLite partagée, sous le répertoire d’état OpenClaw actif. La ligne `installed_plugin_index` stocke les métadonnées durables `installRecords`, notamment les enregistrements de manifestes de plugins endommagés ou manquants, ainsi qu’un cache de registre à froid dérivé des manifestes, utilisé par `openclaw plugins update`, la désinstallation, les diagnostics et le registre de plugins à froid.

Lorsqu’OpenClaw détecte dans la configuration des enregistrements hérités distribués `plugins.installs`, les lectures à l’exécution les traitent comme des données d’entrée de compatibilité sans réécrire `openclaw.json`. Les écritures explicites de plugins et `openclaw doctor --fix` déplacent ces enregistrements vers l’index des plugins et suppriment la clé de configuration lorsque les écritures de configuration sont autorisées ; si l’une ou l’autre écriture échoue, les enregistrements de configuration sont conservés afin de ne pas perdre les métadonnées d’installation.

## Désinstallation

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
openclaw plugins uninstall <id> --force
```

`uninstall` supprime les enregistrements du plugin dans `plugins.entries`, l’index persistant des plugins, les entrées des listes d’autorisation/de refus des plugins et, le cas échéant, les entrées associées dans `plugins.load.paths`. Sauf si `--keep-files` est défini, la désinstallation supprime également le répertoire d’installation géré suivi, mais uniquement lorsqu’il est résolu dans la racine des extensions de plugins d’OpenClaw. Si le plugin occupe actuellement l’emplacement `memory` ou `contextEngine`, cet emplacement est réinitialisé à sa valeur par défaut (`memory-core` pour la mémoire, `legacy` pour le moteur de contexte).

`uninstall` affiche un aperçu des éléments qui seront supprimés, puis demande `Uninstall plugin "<id>"?` avant d’effectuer les modifications. Passez `--force` pour ignorer la demande de confirmation (utile pour les scripts et les exécutions non interactives) ; sans cette option, la désinstallation nécessite un TTY interactif. `--dry-run` affiche le même aperçu et se termine sans demander de confirmation ni modifier quoi que ce soit.

<Note>
`--keep-config` est pris en charge comme alias obsolète de `--keep-files`.
</Note>

## Mise à jour

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Les mises à jour s’appliquent aux installations de plugins suivies dans l’index géré des plugins et aux installations de packs de hooks suivies dans `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Résolution de l’identifiant du plugin ou de la spécification npm">
    Lorsque vous transmettez un identifiant de plugin, OpenClaw réutilise la spécification d’installation enregistrée pour ce plugin. Cela signifie que les dist-tags précédemment stockés, tels que `@beta`, et les versions exactes épinglées continuent d’être utilisés lors des exécutions ultérieures de `update <id>`.

    Pendant `update <id> --dry-run`, les installations npm épinglées à une version exacte le restent. Si OpenClaw peut également résoudre la branche par défaut du registre du paquet et que celle-ci est plus récente que la version épinglée installée, la simulation signale l’épinglage et affiche la commande explicite de mise à jour du paquet avec `@latest` permettant de suivre la branche par défaut du registre.

    Cette règle de mise à jour ciblée diffère du parcours de maintenance global `openclaw plugins update --all`. Les mises à jour globales respectent toujours les spécifications d’installation suivies ordinaires, mais les enregistrements de plugins OpenClaw officiels et approuvés peuvent se synchroniser avec la cible actuelle du catalogue officiel au lieu de rester sur un paquet officiel exact obsolète. Utilisez la commande ciblée `update <id>` lorsque vous souhaitez intentionnellement conserver telle quelle une spécification officielle exacte ou étiquetée.

    Pour les installations npm, vous pouvez également transmettre une spécification explicite de paquet npm avec un dist-tag ou une version exacte. OpenClaw associe le nom de ce paquet à l’enregistrement de plugin suivi, met à jour ce plugin installé et enregistre la nouvelle spécification npm pour les futures mises à jour fondées sur l’identifiant.

    La transmission du nom du paquet npm sans version ni étiquette permet également de retrouver l’enregistrement de plugin suivi. Utilisez cette méthode lorsqu’un plugin était épinglé à une version exacte et que vous souhaitez le replacer sur la branche de publication par défaut du registre.

  </Accordion>
  <Accordion title="Mises à jour du canal bêta">
    La commande ciblée `openclaw plugins update <id-or-npm-spec>` réutilise la spécification du plugin suivi, sauf si vous en transmettez une nouvelle. La commande globale `openclaw plugins update --all` utilise la valeur `update.channel` configurée lorsqu’elle synchronise les enregistrements de plugins officiels approuvés avec la cible du catalogue officiel. Ainsi, les installations du canal bêta peuvent rester sur la branche de publication bêta au lieu d’être silencieusement normalisées vers stable/latest.

    `openclaw update` connaît également le canal de mise à jour OpenClaw actif : sur le canal bêta, les enregistrements de plugins npm et ClawHub de la branche par défaut essaient d’abord `@beta`. Ils se rabattent sur la spécification default/latest enregistrée s’il n’existe aucune version bêta du plugin ; les plugins npm se rabattent également sur celle-ci si le paquet bêta existe, mais échoue à la validation de l’installation. Ce repli est signalé comme un avertissement et ne fait pas échouer la mise à jour du cœur. Les versions exactes et les étiquettes explicites restent épinglées à ce sélecteur pour les mises à jour ciblées.

  </Accordion>
  <Accordion title="Vérifications des versions et dérive d’intégrité">
    Avant une mise à jour npm réelle, OpenClaw compare la version du paquet installé aux métadonnées du registre npm. Si la version installée et l’identité enregistrée de l’artefact correspondent déjà à la cible résolue, la mise à jour est ignorée sans téléchargement, réinstallation ni réécriture de `openclaw.json`.

    Lorsqu’un hachage d’intégrité stocké existe et que le hachage de l’artefact récupéré change, OpenClaw considère cela comme une dérive de l’artefact npm. La commande interactive `openclaw plugins update` affiche les hachages attendu et réel, puis demande une confirmation avant de poursuivre. Les assistants de mise à jour non interactifs échouent de manière sécurisée, sauf si l’appelant fournit une politique de poursuite explicite.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install lors d’une mise à jour">
    `--dangerously-force-unsafe-install` est également accepté avec `plugins update` à des fins de compatibilité, mais cette option est obsolète et ne modifie plus le comportement de mise à jour des plugins. La valeur `security.installPolicy` définie par l’opérateur peut toujours bloquer les mises à jour ; les hooks `before_install` des plugins ne s’appliquent que dans les processus où les hooks de plugins sont chargés.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk lors d’une mise à jour">
    Les mises à jour de plugins communautaires adossés à ClawHub exécutent, avant le téléchargement du paquet de remplacement, la même vérification de confiance de la version exacte que les installations. Utilisez `--acknowledge-clawhub-risk` pour les automatisations vérifiées qui doivent continuer lorsque la version ClawHub sélectionnée présente un avertissement de confiance risqué. Les paquets ClawHub officiels et les sources de plugins OpenClaw intégrées ignorent cette demande de confirmation relative à la confiance dans la version.
  </Accordion>
</AccordionGroup>

## Inspection

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
```

L’inspection affiche l’identité, l’état de chargement, la source, les capacités du manifeste, les indicateurs de politique, les diagnostics, les métadonnées d’installation, les capacités du paquet et toute prise en charge détectée de serveurs MCP ou LSP, sans importer par défaut le module d’exécution du plugin. La sortie JSON inclut les contrats du manifeste du plugin, tels que `contracts.agentToolResultMiddleware` et `contracts.trustedToolPolicies`, afin que les opérateurs puissent auditer les déclarations de surfaces approuvées avant d’activer ou de redémarrer un plugin. Ajoutez `--runtime` pour charger le module du plugin et inclure les hooks, outils, commandes, services, méthodes du Gateway et routes HTTP enregistrés. L’inspection à l’exécution signale directement les dépendances de plugin manquantes ; les installations et les réparations restent du ressort de `openclaw plugins install`, `openclaw plugins update` et `openclaw doctor --fix`.

Les commandes CLI appartenant aux plugins sont généralement installées comme groupes de commandes `openclaw` racine, mais les plugins peuvent aussi enregistrer des commandes imbriquées sous un parent du cœur tel que `openclaw nodes`. Une fois qu’`inspect --runtime` affiche une commande sous `cliCommands`, exécutez-la au chemin indiqué ; par exemple, un plugin qui enregistre `demo-git` peut être vérifié avec `openclaw demo-git ping`.

Chaque plugin est classé en fonction de ce qu’il enregistre réellement à l’exécution :

| Forme               | Signification                                                               |
| ------------------- | --------------------------------------------------------------------------- |
| `plain-capability`  | exactement un type de capacité (par ex. un plugin fournisseur uniquement)   |
| `hybrid-capability` | plusieurs types de capacités (par ex. texte + parole + images)              |
| `hook-only`         | uniquement des hooks, sans capacités, outils, commandes, services ni routes |
| `non-capability`    | outils/commandes/services, mais aucune capacité                              |

Consultez [Formes des plugins](/fr/plugins/architecture#plugin-shapes) pour en savoir plus sur le modèle de capacités.

<Note>
L’indicateur `--json` produit un rapport lisible par machine, adapté aux scripts et aux audits. `inspect --all` affiche un tableau couvrant l’ensemble du parc avec des colonnes récapitulant la forme, les types de capacités, les avis de compatibilité, les capacités du paquet et les hooks. `info` est un alias de `inspect`.
</Note>

## Diagnostic

```bash
openclaw plugins doctor
```

`doctor` signale les erreurs de chargement des plugins, les diagnostics de manifeste/découverte, les avis de compatibilité et les références de configuration de plugin obsolètes, telles que des emplacements de plugin manquants. Lorsque l’arborescence d’installation et la configuration des plugins sont saines, il affiche `No plugin issues detected.` Si une configuration obsolète subsiste, mais que l’arborescence d’installation est par ailleurs saine, le résumé l’indique au lieu de laisser entendre que les plugins sont entièrement sains.

Si un plugin configuré est présent sur le disque, mais bloqué par les vérifications de sécurité des chemins du chargeur, la validation de la configuration conserve l’entrée du plugin et la signale comme `present but blocked`. Corrigez le diagnostic précédent du plugin bloqué, tel qu’un problème de propriété du chemin ou de permissions d’écriture accordées à tous, au lieu de supprimer la configuration `plugins.entries.<id>` ou `plugins.allow`.

Pour les échecs liés à la forme du module, tels que l’absence d’exports `register`/`activate`, relancez la commande avec `OPENCLAW_PLUGIN_LOAD_DEBUG=1` afin d’inclure un résumé compact de la forme des exports dans la sortie de diagnostic.

## Registre

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Le registre local des plugins est le modèle de lecture à froid persistant d’OpenClaw pour l’identité des plugins installés, leur activation, les métadonnées de source et la propriété des contributions. Le démarrage normal, la recherche du propriétaire d’un fournisseur, la classification de la configuration des canaux et l’inventaire des plugins peuvent le consulter sans importer les modules d’exécution des plugins.

Utilisez `plugins registry` pour vérifier si le registre persistant est présent, à jour ou obsolète. Utilisez `--refresh` pour le reconstruire à partir de l’index persistant des plugins, de la politique de configuration et des métadonnées de manifeste/paquet. Il s’agit d’un parcours de réparation, et non d’un parcours d’activation à l’exécution.

`openclaw doctor --fix` répare également les dérives npm gérées adjacentes au registre : si un paquet `@openclaw/*` orphelin ou récupéré sous un projet npm de plugin géré, ou sous l’ancienne racine npm gérée à plat, masque un plugin intégré, doctor supprime ce paquet obsolète et reconstruit le registre afin que le démarrage effectue la validation à partir du manifeste intégré. Doctor recrée également le lien vers le paquet hôte `openclaw` dans les plugins npm gérés qui déclarent `peerDependencies.openclaw`, afin que les imports d’exécution locaux au paquet, tels que `openclaw/plugin-sdk/*`, soient résolus après les mises à jour ou les réparations npm.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` est un mécanisme de compatibilité d’urgence obsolète destiné aux échecs de lecture du registre. Préférez `plugins registry --refresh` ou `openclaw doctor --fix` ; le repli par variable d’environnement est réservé à la récupération d’urgence du démarrage pendant le déploiement de la migration.
</Warning>

## Place de marché

```bash
openclaw plugins marketplace entries
openclaw plugins marketplace entries --offline
openclaw plugins marketplace entries --json
openclaw plugins marketplace entries --feed-profile <name>
openclaw plugins marketplace entries --feed-url <url>
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile <name>
openclaw plugins marketplace refresh --feed-url <url>
openclaw plugins marketplace refresh --expected-sha256 <sha256> --json
```

`plugins marketplace entries` répertorie les entrées du flux de la place de marché OpenClaw configuré. Par défaut, la commande tente d’utiliser le flux hébergé, puis se rabat sur le dernier instantané accepté ou sur les données intégrées. Utilisez `--feed-profile <name>` pour lire un profil configuré spécifique, `--feed-url <url>` pour lire l’URL explicite d’un flux hébergé et `--offline` pour lire le dernier instantané accepté sans récupérer le flux.

`plugins marketplace refresh` actualise l’instantané du flux hébergé configuré et indique si OpenClaw a accepté les données hébergées, un instantané hébergé ou les données de secours intégrées. Utilisez `--expected-sha256` lorsqu’un appelant exige que la commande échoue si une charge utile hébergée récemment récupérée ne correspond pas à une somme de contrôle prédéfinie.

La commande `list` de la place de marché accepte le chemin d’une place de marché locale, le chemin d’un fichier `marketplace.json`, une notation abrégée GitHub telle que `owner/repo`, l’URL d’un dépôt GitHub ou une URL Git. `--json` affiche le libellé de la source résolue, ainsi que le manifeste de la place de marché analysé et les entrées des Plugins.

L’actualisation de la place de marché charge un flux hébergé de la place de marché OpenClaw et conserve la réponse validée comme instantané local du flux hébergé. Sans option, elle utilise le profil de flux par défaut configuré. Utilisez `--feed-profile <name>` pour actualiser un profil configuré spécifique, `--feed-url <url>` pour actualiser l’URL explicite d’un flux hébergé, `--expected-sha256 <sha256>` pour exiger une somme de contrôle correspondante pour la charge utile (`sha256:<hex>` ou un condensat hexadécimal brut de 64 caractères) et `--json` pour obtenir une sortie lisible par une machine. Les URL explicites de flux hébergés ne doivent pas inclure d’identifiants, de chaînes de requête ni de fragments. Les actualisations sans somme de contrôle prédéfinie peuvent signaler l’utilisation d’un instantané hébergé ou d’un résultat de secours intégré sans faire échouer la commande. Les actualisations avec somme de contrôle prédéfinie échouent sauf si elles acceptent une charge utile hébergée récemment récupérée, et les actualisations hébergées réussies échouent si OpenClaw ne peut pas conserver l’instantané validé.

## Voir aussi

- [Création de Plugins](/fr/plugins/building-plugins)
- [Référence de la CLI](/fr/cli)
- [ClawHub](/clawhub)
