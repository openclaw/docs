---
read_when:
    - Vous souhaitez installer ou gérer des plugins Gateway ou des bundles compatibles
    - Vous souhaitez générer la structure ou valider un Plugin d’outil simple
    - Vous souhaitez déboguer les échecs de chargement des plugins
sidebarTitle: Plugins
summary: Référence CLI pour `openclaw plugins` (initialiser, compiler, valider, répertorier, installer, place de marché, désinstaller, activer/désactiver, diagnostiquer)
title: Plugins
x-i18n:
    generated_at: "2026-07-16T13:13:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: dadc182cd931672d98c3d1c6ddc1f1defdf0384b25feff7bd4b5324a7fc2e26c
    source_path: cli/plugins.md
    workflow: 16
---

Gérez les plugins du Gateway, les packs de hooks et les bundles compatibles.

<CardGroup cols={2}>
  <Card title="Système de Plugin" href="/fr/tools/plugin">
    Guide destiné aux utilisateurs finaux pour installer, activer et dépanner les plugins.
  </Card>
  <Card title="Gérer les plugins" href="/fr/plugins/manage-plugins">
    Exemples rapides pour l’installation, l’affichage de la liste, la mise à jour, la désinstallation et la publication.
  </Card>
  <Card title="Bundles de plugins" href="/fr/plugins/bundles">
    Modèle de compatibilité des bundles.
  </Card>
  <Card title="Manifeste de Plugin" href="/fr/plugins/manifest">
    Champs du manifeste et schéma de configuration.
  </Card>
  <Card title="Sécurité" href="/fr/gateway/security">
    Renforcement de la sécurité des installations de plugins.
  </Card>
</CardGroup>

## Commandes

```bash
openclaw plugins list [--enabled] [--verbose] [--json]
openclaw plugins search <query> [--limit <n>] [--json]
openclaw plugins install <path-or-spec> [--link] [--force] [--pin] [--marketplace <source>]
openclaw plugins inspect <id> [--runtime] [--json]
openclaw plugins inspect --all [--runtime] [--json]
openclaw plugins info <id>                    # alias d’inspect
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
commande avec `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. La trace écrit la durée des phases
dans stderr et conserve une sortie JSON analysable. Consultez [Débogage](/fr/help/debugging#plugin-lifecycle-trace).

<Note>
En mode Nix (`OPENCLAW_NIX_MODE=1`), `openclaw.json` est immuable. `install`, `update`, `uninstall`, `enable` et `disable` refusent tous de s’exécuter. Modifiez plutôt la source Nix de cette installation (`programs.openclaw.config` ou `instances.<name>.config` pour nix-openclaw), puis reconstruisez-la. Consultez le [Démarrage rapide](https://github.com/openclaw/nix-openclaw#quick-start) orienté agent.
</Note>

<Note>
Les plugins intégrés sont distribués avec OpenClaw. Certains sont activés par défaut (par exemple les fournisseurs de modèles intégrés, les fournisseurs de synthèse vocale intégrés et le plugin de navigateur intégré) ; d’autres nécessitent `plugins enable`.

Les plugins OpenClaw natifs fournissent `openclaw.plugin.json` avec un schéma JSON intégré (`configSchema`, même s’il est vide). Les bundles compatibles utilisent plutôt leurs propres manifestes de bundle.

`plugins list` affiche `Format: openclaw` ou `Format: bundle`. La sortie détaillée de la liste ou des informations affiche également le sous-type du bundle (`codex`, `claude` ou `cursor`) ainsi que les capacités de bundle détectées.
</Note>

## Création

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` crée par défaut un plugin d’outil TypeScript minimal. Le premier
argument est l’identifiant du plugin ; `--name` définit le nom d’affichage. OpenClaw utilise
l’identifiant pour le répertoire de sortie par défaut et le nommage du paquet. Les structures d’outil utilisent
`defineToolPlugin` et génèrent les scripts `package.json` `plugin:build` et
`plugin:validate`, qui effectuent la compilation puis appellent `openclaw plugins build`/`validate`.

`plugins build` importe le point d’entrée compilé, lit les métadonnées statiques de son outil, écrit
`openclaw.plugin.json` et maintient le champ `openclaw.extensions` de `package.json` synchronisé.
`plugins validate` vérifie que le manifeste généré, les métadonnées du paquet et
l’exportation actuelle du point d’entrée concordent toujours. Consultez [Plugins d’outils](/fr/plugins/tool-plugins) pour
le processus de création complet.

La structure écrit le code source TypeScript, mais génère les métadonnées à partir du point d’entrée
`./dist/index.js` compilé, de sorte que le processus fonctionne également avec la CLI publiée. Utilisez
`--entry <path>` lorsque le point d’entrée n’est pas celui par défaut du paquet. Utilisez
`plugins build --check` dans la CI pour échouer lorsque les métadonnées générées sont obsolètes, sans
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

Les structures de fournisseur créent un plugin générique de fournisseur de modèles compatible avec OpenAI,
avec la gestion de l’authentification par clé API, un script `npm run validate` qui exécute
`clawhub package validate`, les métadonnées de paquet ClawHub et un workflow GitHub Actions
déclenché manuellement pour permettre ultérieurement une publication fiable via GitHub
OIDC. Les structures de fournisseur ne génèrent pas de Skills et n’utilisent pas
`openclaw plugins build`/`validate` ; ces commandes sont destinées au chemin de métadonnées générées
de la structure d’outil.

Avant la publication, remplacez l’URL de base d’API fictive, le catalogue de modèles, la route de documentation,
le texte relatif aux identifiants et le contenu du README par les informations réelles du fournisseur. Utilisez le
README généré pour la première publication sur ClawHub et la configuration d’un éditeur de confiance.

## Installation

```bash
openclaw plugins search "calendar"                      # rechercher des plugins ClawHub
openclaw plugins install @openclaw/<package>            # catalogue officiel de confiance
openclaw plugins install <package>                       # paquet npm arbitraire
openclaw plugins install clawhub:<package>                # ClawHub uniquement
openclaw plugins install npm:<package>                    # npm uniquement
openclaw plugins install npm-pack:<path.tgz>               # archive npm-pack locale
openclaw plugins install git:github.com/<owner>/<repo>     # dépôt git
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <path>                            # chemin local ou archive
openclaw plugins install -l <path>                         # lier au lieu de copier
openclaw plugins install <plugin>@<marketplace>             # forme abrégée de marketplace
openclaw plugins install <plugin> --marketplace <name>      # marketplace (explicite)
openclaw plugins install <package> --force                  # confirmer la source / écraser l’existant
openclaw plugins install <package> --pin                    # épingler la version npm résolue
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
```

Les mainteneurs qui testent les installations pendant la configuration peuvent remplacer les sources
d’installation automatique des plugins à l’aide de variables d’environnement protégées. Consultez
[Remplacements des sources d’installation de plugins](/fr/plugins/install-overrides).

<Warning>
Pendant la transition du lancement, les noms de paquets seuls sont installés depuis npm par défaut, sauf s’ils correspondent à l’identifiant d’un plugin intégré ou officiel, auquel cas OpenClaw utilise cette copie locale ou officielle au lieu d’interroger le registre npm. Utilisez `npm:<package>` lorsque vous souhaitez délibérément employer un paquet npm externe. Utilisez `clawhub:<package>` pour ClawHub. Traitez les installations de plugins comme l’exécution de code ; privilégiez les versions épinglées.
</Warning>

<Warning>
Les paquets ClawHub et le catalogue intégré ou officiel d’OpenClaw sont des sources d’installation
de confiance. Une nouvelle source npm arbitraire, `npm-pack:`, git, un chemin ou une archive locale, ou une
marketplace déclenche un avertissement et demande confirmation avant de continuer. Les installations arbitraires
non interactives doivent fournir `--force` après vérification et approbation de la source. Le même
indicateur écrase une cible d’installation existante lorsque nécessaire. Les mises à jour normales d’une
installation déjà suivie ne l’exigent pas. Cette confirmation est distincte de
`--acknowledge-clawhub-risk`, qui s’applique uniquement aux avertissements de confiance concernant les versions ClawHub
risquées. `--force` ne contourne pas `security.installPolicy` ni les autres
contrôles de sécurité de l’installation.
</Warning>

`plugins search` interroge ClawHub pour obtenir les paquets `code-plugin` et
`bundle-plugin` installables (pas les Skills ; utilisez `openclaw skills search` pour ceux-ci).
La valeur par défaut de `--limit` est 20, avec un maximum de 100. Cette commande lit uniquement le catalogue distant : aucune
inspection de l’état local, modification de la configuration, installation de paquet ni
chargement de l’environnement d’exécution du plugin. Les résultats comprennent le nom du paquet ClawHub, la famille, le canal, la version,
le résumé et une indication d’installation telle que `openclaw plugins install clawhub:<package>`.

<Note>
ClawHub est la principale plateforme de distribution et de découverte pour la plupart des plugins. Npm
reste une solution de secours prise en charge et une voie d’installation directe. Les paquets de plugins
`@openclaw/*` appartenant à OpenClaw sont de nouveau publiés sur npm ; consultez la liste actuelle
sur [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) ou
[l’inventaire des plugins](/fr/plugins/plugin-inventory). Les installations stables utilisent `latest`.
Les installations et mises à jour du canal bêta privilégient le dist-tag npm `beta` lorsqu’il est disponible,
avec repli sur `latest`. Sur le canal stable étendu, les plugins npm officiels
avec une intention nue/par défaut ou `latest` sont résolus vers la version exacte du cœur
installée. Les épinglages exacts et les tags explicites autres que `latest`, les paquets tiers et
les sources autres que npm ne sont pas réécrits.
</Note>

<AccordionGroup>
  <Accordion title="Inclusions de configuration et réparation d’une configuration non valide">
    Si votre section `plugins` repose sur un fichier unique `$include`, `plugins install/update/enable/disable/uninstall` écrit directement dans ce fichier inclus et laisse `openclaw.json` intact. Les inclusions racine, les tableaux d’inclusions et les inclusions comportant des remplacements voisins échouent de manière fermée au lieu d’être aplatis. Consultez [Inclusions de configuration](/fr/gateway/configuration) pour connaître les structures prises en charge.

    Si la configuration n’est pas valide pendant l’installation, `plugins install` échoue normalement de manière fermée et vous demande d’exécuter d’abord `openclaw doctor --fix`. Lors du démarrage du Gateway et du rechargement à chaud, une configuration de plugin non valide échoue de manière fermée comme toute autre configuration non valide ; `openclaw doctor --fix` peut placer en quarantaine l’entrée de plugin non valide. La seule exception documentée pendant l’installation est un chemin de récupération restreint pour les plugins intégrés qui activent explicitement `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="Confirmation avec --force et réinstallation ou mise à jour">
    `--force` confirme une source autre que ClawHub sans afficher d’invite. Il ne contourne pas `security.installPolicy` ni les autres contrôles de sécurité de l’installation. Lorsque le plugin ou le pack de hooks est déjà installé, il réutilise également la cible existante et l’écrase sur place. Utilisez-le après avoir examiné une source npm arbitraire, locale, d’archive, git ou de marketplace, ou lorsque vous réinstallez intentionnellement le même identifiant. Pour les mises à niveau courantes d’un plugin npm déjà suivi, privilégiez `openclaw plugins update <id-or-npm-spec>`.

    Si vous exécutez `plugins install` pour un identifiant de plugin déjà installé, OpenClaw s’arrête et vous indique `plugins update <id-or-npm-spec>` pour une mise à niveau normale, ou `plugins install <package> --force` lorsque vous souhaitez réellement écraser l’installation actuelle depuis une autre source. Les sources arbitraires affichent toujours l’avertissement interactif relatif à la provenance ; les installations non interactives doivent fournir `--force` après vérification. Les sources ClawHub et du catalogue OpenClaw de confiance ne l’exigent pas. Avec `--link`, `--force` confirme la source, mais ne modifie pas le mode d’installation par chemin lié.

  </Accordion>
  <Accordion title="Portée de --pin">
    `--pin` s’applique uniquement aux installations npm et enregistre la valeur exacte résolue de `<name>@<version>`. Il n’est pas pris en charge avec les installations `git:` (épinglez plutôt la référence dans la spécification, par exemple `git:github.com/acme/plugin@v1.2.3`) ni avec `--marketplace` (les installations depuis une marketplace conservent les métadonnées de source de la marketplace au lieu d’une spécification npm).
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` est obsolète et n’effectue désormais aucune opération. OpenClaw n’exécute plus le blocage intégré du code dangereux pendant l’installation des plugins.

    Utilisez la surface `security.installPolicy` appartenant à l’opérateur lorsqu’une politique d’installation propre à l’hôte est requise. Les hooks `before_install` de Plugin sont des hooks du cycle de vie de l’environnement d’exécution du Plugin, et non la principale limite d’application de la politique pour les installations via la CLI.

    Si un Plugin que vous avez publié sur ClawHub est masqué ou bloqué par une analyse du registre, suivez les étapes destinées à l’éditeur dans [Publication sur ClawHub](/fr/clawhub/publishing). `--dangerously-force-unsafe-install` ne demande pas à ClawHub d’analyser à nouveau le Plugin ni de rendre publique une version bloquée.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    Les installations depuis la communauté ClawHub vérifient le niveau de confiance de la version sélectionnée avant le téléchargement. Si ClawHub désactive le téléchargement de la version, signale des résultats d’analyse malveillants ou place la version dans un état de modération bloquant (mise en quarantaine, révoquée), OpenClaw la refuse catégoriquement, indépendamment de cet indicateur. Pour les états de modération ou d’analyse risqués mais non bloquants, OpenClaw affiche les détails de confiance et demande une confirmation avant de poursuivre.

    Utilisez `--acknowledge-clawhub-risk` uniquement après avoir examiné l’avertissement de ClawHub et décidé de continuer sans invite interactive. Les résultats d’analyse en attente ou obsolètes (pas encore déclarés sains) déclenchent un avertissement, mais ne nécessitent pas d’accusé de réception. Les paquets ClawHub officiels et les sources de Plugin intégrées à OpenClaw contournent entièrement cette vérification de confiance de la version.

  </Accordion>
  <Accordion title="Packs de hooks et spécifications npm">
    `plugins install` est également la surface d’installation des packs de hooks qui exposent `openclaw.hooks` dans `package.json`. Utilisez `openclaw hooks` pour filtrer la visibilité des hooks et activer chaque hook individuellement, et non pour installer des paquets.

    Les spécifications npm sont **réservées au registre** (nom du paquet accompagné éventuellement d’une **version exacte** ou d’un **dist-tag**). Les spécifications Git/URL/fichier et les plages semver sont rejetées. Par sécurité, les installations de dépendances s’exécutent dans un projet npm géré distinct pour chaque Plugin avec `--ignore-scripts`, même lorsque votre shell dispose de paramètres globaux d’installation npm. Les projets npm gérés des Plugins héritent du `overrides` npm défini au niveau du paquet d’OpenClaw, afin que les épinglages de sécurité de l’hôte s’appliquent également aux dépendances de Plugin remontées.

    Utilisez `npm:<package>` pour rendre explicite la résolution npm. Pendant la transition de lancement, les spécifications de paquet sans préfixe s’installent également directement depuis npm, sauf si elles correspondent à l’identifiant d’un Plugin officiel.

    Les spécifications `@openclaw/*` brutes qui correspondent à des Plugins intégrés sont résolues vers la copie intégrée appartenant à l’image avant le recours à npm. Par exemple, `openclaw plugins install @openclaw/discord@2026.5.20 --pin` utilise le Plugin Discord intégré à la version actuelle d’OpenClaw au lieu de créer un remplacement npm géré. Pour imposer l’utilisation du paquet npm externe, utilisez `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`.

    Les spécifications sans préfixe et `@latest` restent sur le canal stable. Les versions correctives d’OpenClaw horodatées par date, telles que `2026.5.3-1`, sont considérées comme stables pour cette vérification. Si npm résout l’une de ces formes vers une préversion, OpenClaw s’arrête et vous demande de l’autoriser explicitement au moyen d’une étiquette de préversion (`@beta`/`@rc`) ou d’une version de prépublication exacte (`@1.2.3-beta.4`).

    Pour les installations npm sans version exacte (`npm:<package>` ou `npm:<package>@latest`), OpenClaw vérifie les métadonnées du paquet résolu avant l’installation. Si le dernier paquet stable nécessite une API de Plugin OpenClaw plus récente ou une version minimale plus récente de l’hôte, OpenClaw examine les anciennes versions stables et installe à la place la version compatible la plus récente. Les versions exactes et les dist-tags explicites restent stricts : une sélection incompatible échoue et vous demande de mettre à niveau OpenClaw ou de choisir une version compatible.

    Si une spécification d’installation sans préfixe correspond à l’identifiant d’un Plugin officiel (par exemple `diffs`), OpenClaw installe directement l’entrée du catalogue. Pour installer un paquet npm portant le même nom, utilisez une spécification avec portée explicite (par exemple `@scope/diffs`).

  </Accordion>
  <Accordion title="Dépôts Git">
    Utilisez `git:<repo>` pour effectuer une installation directement depuis un dépôt Git. Formes prises en charge : `git:github.com/owner/repo`, `git:owner/repo`, `https://` complet, `ssh://`, `git://`, `file://` et les URL de clonage `git@host:owner/repo.git`. Ajoutez `@<ref>` ou `#<ref>` pour extraire une branche, une étiquette ou un commit avant l’installation.

    Les installations Git clonent le dépôt dans un répertoire temporaire, extraient la référence demandée lorsqu’elle est présente, puis utilisent le programme d’installation habituel des répertoires de Plugin. La validation du manifeste, la politique d’installation de l’opérateur, les opérations d’installation du gestionnaire de paquets et les enregistrements d’installation se comportent donc comme pour les installations npm. Les installations Git enregistrées incluent l’URL et la référence de la source ainsi que le commit résolu, afin que `openclaw plugins update` puisse résoudre à nouveau la source ultérieurement.

    Après une installation depuis Git, utilisez `openclaw plugins inspect <id> --runtime --json` pour vérifier les enregistrements dans l’environnement d’exécution, tels que les méthodes du Gateway et les commandes de la CLI. Si le Plugin a enregistré une commande racine de la CLI avec `api.registerCli`, exécutez cette commande directement depuis la CLI racine d’OpenClaw, par exemple `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    Archives prises en charge : `.zip`, `.tgz`, `.tar.gz`, `.tar`. Les archives natives de Plugin OpenClaw doivent contenir un `openclaw.plugin.json` valide à la racine du Plugin extrait ; les archives qui contiennent uniquement `package.json` sont rejetées avant qu’OpenClaw n’écrive les enregistrements d’installation.

    Utilisez `npm-pack:<path.tgz>` lorsque le fichier est une archive tar créée par npm-pack et que vous souhaitez
    utiliser le même chemin de projet npm géré par Plugin que pour les installations depuis le registre,
    notamment la vérification `package-lock.json`, l’analyse des dépendances remontées
    et les enregistrements d’installation npm. Les chemins d’archive ordinaires sont toujours installés en tant
    qu’archives locales sous la racine des extensions de Plugin.

    Les installations depuis la place de marché Claude sont également prises en charge.

  </Accordion>
</AccordionGroup>

Les installations ClawHub utilisent un localisateur `clawhub:<package>` explicite :

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Pendant la transition de lancement, les spécifications de Plugin sans préfixe compatibles avec les noms npm s’installent par défaut depuis npm, sauf si elles correspondent à l’identifiant d’un Plugin officiel :

```bash
openclaw plugins install openclaw-codex-app-server
```

Utilisez `npm:` pour rendre explicite une résolution exclusivement via npm :

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw vérifie avant l’installation la compatibilité annoncée avec l’API de Plugin et la version minimale du Gateway. Lorsque la version ClawHub sélectionnée publie un artefact ClawPack, OpenClaw télécharge le `.tgz` npm-pack versionné, vérifie l’en-tête d’empreinte de ClawHub et l’empreinte de l’artefact, puis l’installe par le chemin d’archive habituel. Les anciennes versions ClawHub sans métadonnées ClawPack s’installent toujours par le chemin historique de vérification des archives de paquet. Les installations enregistrées conservent les métadonnées de leur source ClawHub, le type d’artefact, l’intégrité npm, la somme SHA npm, le nom de l’archive tar et les informations d’empreinte ClawPack en vue des mises à jour ultérieures.
Les installations ClawHub sans version conservent une spécification enregistrée sans version afin que `openclaw plugins update` puisse suivre les nouvelles versions ClawHub ; les sélecteurs explicites de version ou d’étiquette tels que `clawhub:pkg@1.2.3` et `clawhub:pkg@beta` restent épinglés à ce sélecteur.

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
    - une racine de place de marché locale ou un chemin `marketplace.json`
    - une forme abrégée de dépôt GitHub telle que `owner/repo`
    - une URL de dépôt GitHub telle que `https://github.com/owner/repo`
    - une URL Git

  </Tab>
  <Tab title="Règles des places de marché distantes">
    Pour les places de marché distantes chargées depuis GitHub ou Git, les entrées de Plugin doivent rester dans le dépôt cloné de la place de marché. OpenClaw accepte les sources à chemin relatif provenant de ce dépôt et rejette les sources de Plugin HTTP(S), à chemin absolu, Git, GitHub et les autres sources ne correspondant pas à un chemin dans les manifestes distants.
  </Tab>
</Tabs>

Pour les chemins locaux et les archives, OpenClaw détecte automatiquement :

- les Plugins OpenClaw natifs (`openclaw.plugin.json`)
- les ensembles compatibles avec Codex (`.codex-plugin/plugin.json`)
- les ensembles compatibles avec Claude (`.claude-plugin/plugin.json`, ou la disposition par défaut des composants Claude lorsque ce fichier manifeste est absent)
- les ensembles compatibles avec Cursor (`.cursor-plugin/plugin.json`)

Les installations locales gérées doivent être des répertoires ou des archives de Plugin. Les fichiers de Plugin autonomes `.js`,
`.mjs`, `.cjs` et `.ts` ne sont pas copiés dans la racine gérée des Plugins
par `plugins install`, ni chargés lorsqu’ils sont placés directement dans
`~/.openclaw/extensions` ou `<workspace>/.openclaw/extensions` ; ces
racines de détection automatique chargent des répertoires de paquet ou d’ensemble de Plugin et ignorent
les fichiers de script de premier niveau en tant qu’utilitaires locaux. Répertoriez plutôt explicitement les fichiers autonomes dans
`plugins.load.paths`.

<Note>
Les ensembles compatibles s’installent dans la racine habituelle des Plugins et participent au même flux de consultation des listes et des informations, ainsi que d’activation et de désactivation. À ce jour, les Skills des ensembles, les Skills de commande Claude, les valeurs par défaut Claude `settings.json`, les valeurs par défaut Claude `.lsp.json` ou `lspServers` déclarées dans le manifeste, les Skills de commande Cursor et les répertoires de hooks compatibles avec Codex sont pris en charge ; les autres capacités détectées des ensembles sont affichées dans les diagnostics et les informations, mais ne sont pas encore reliées à l’exécution dans l’environnement d’exécution.
</Note>

Utilisez `-l`/`--link` pour référencer un répertoire local de Plugin sans le copier (l’ajoute
à `plugins.load.paths`) :

```bash
openclaw plugins install -l ./my-plugin
```

`--link` n’est pas pris en charge avec les installations `--marketplace` ou `git:`, et
nécessite un chemin local qui existe déjà. Pour créer un lien local sans interaction,
transmettez `--force` après avoir examiné la source ; cette option confirme la provenance, mais ne
copie ni ne remplace le répertoire lié.

<Note>
Les Plugins provenant d’un espace de travail et détectés depuis la racine des extensions de cet espace ne sont
ni importés ni exécutés tant qu’ils ne sont pas explicitement activés. Pour le développement local,
exécutez `openclaw plugins enable <plugin-id>` ou définissez
`plugins.entries.<plugin-id>.enabled: true` ; si votre configuration utilise
`plugins.allow`, ajoutez-y également le même identifiant de Plugin. Cette règle de refus par défaut
s’applique également lorsque la configuration d’un canal cible explicitement un Plugin provenant d’un espace de travail pour
un chargement réservé à la configuration ; le code de configuration du Plugin de canal local ne s’exécutera donc pas tant que ce
Plugin de l’espace de travail restera désactivé ou exclu de la liste d’autorisation. Les installations liées
et les entrées `plugins.load.paths` explicites suivent la politique normale correspondant à l’origine
résolue de leur Plugin. Consultez
[Configurer la politique des Plugins](/fr/tools/plugin#configure-plugin-policy)
et la [Référence de configuration](/fr/gateway/configuration-reference#plugins).

Utilisez `--pin` lors des installations npm pour enregistrer la spécification exacte résolue (`name@version`) dans l’index géré des Plugins, tout en conservant le comportement par défaut sans épinglage.
</Note>

## Liste

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  Afficher uniquement les Plugins activés.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Remplacer la vue en tableau par des lignes de détails pour chaque Plugin, avec les métadonnées de format/source/origine/version/activation.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventaire lisible par machine, accompagné des diagnostics du registre et de l’état d’installation des dépendances du paquet.
</ParamField>

<Note>
`plugins list` lit d’abord le registre local persistant des plugins, avec une solution de repli dérivée du manifeste uniquement lorsque le registre est absent ou non valide. Cette commande permet de vérifier si un plugin est installé, activé et visible pour la planification d’un démarrage à froid, mais elle ne constitue pas une sonde d’exécution en direct d’un processus Gateway déjà en cours d’exécution. Après avoir modifié le code d’un plugin, son activation, la politique des hooks ou `plugins.load.paths`, redémarrez le Gateway qui dessert le canal avant de vous attendre à ce que le nouveau code `register(api)` ou les nouveaux hooks s’exécutent. Pour les déploiements distants ou en conteneur, vérifiez que vous redémarrez bien le processus enfant `openclaw gateway run` réel, et pas seulement un processus enveloppe.

`plugins list --json` inclut le champ `dependencyStatus` de chaque plugin provenant de `package.json`
`dependencies` et `optionalDependencies`. OpenClaw vérifie si ces noms de paquets
sont présents le long du chemin de recherche Node `node_modules` normal du plugin ; il
n’importe pas le code d’exécution du plugin, n’exécute pas de gestionnaire de paquets et ne répare pas les
dépendances manquantes.
</Note>

Si le démarrage journalise `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`,
exécutez `openclaw plugins list --enabled --verbose` ou
`openclaw plugins inspect <id>` avec l’identifiant d’un plugin répertorié pour confirmer les
identifiants des plugins et copier les identifiants fiables dans `plugins.allow` dans `openclaw.json`. Lorsque
l’avertissement peut répertorier tous les plugins découverts, il affiche un extrait
`plugins.allow` prêt à coller qui inclut déjà ces identifiants. Si un plugin se charge
sans provenance d’installation ou de chemin de chargement, inspectez cet identifiant de plugin, puis épinglez
l’identifiant fiable dans `plugins.allow` ou réinstallez le plugin depuis une source fiable
afin qu’OpenClaw enregistre la provenance de l’installation.

Pour travailler sur un plugin intégré dans une image Docker empaquetée, montez par liaison le répertoire
source du plugin sur le chemin source empaqueté correspondant, par exemple
`/app/extensions/synology-chat`. OpenClaw découvre cette superposition de sources montée
avant `/app/dist/extensions/synology-chat` ; un simple répertoire source copié
reste inactif, de sorte que les installations empaquetées normales continuent d’utiliser la distribution compilée.

Pour déboguer les hooks d’exécution :

- `openclaw plugins inspect <id> --runtime --json` affiche les hooks enregistrés et les diagnostics issus d’une passe d’inspection avec chargement du module. L’inspection d’exécution n’installe jamais de dépendances ; utilisez `openclaw doctor --fix` pour nettoyer l’état hérité des dépendances ou récupérer les plugins téléchargeables manquants qui sont référencés par la configuration.
- `openclaw gateway status --deep --require-rpc` confirme l’URL et le profil Gateway accessibles, les indications relatives au service et au processus, le chemin de configuration et l’état RPC.
- Les hooks de conversation non intégrés (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) nécessitent `plugins.entries.<id>.hooks.allowConversationAccess=true`.

### Index des plugins

Les métadonnées d’installation des plugins constituent un état géré par la machine, et non une configuration utilisateur. Les installations et les mises à jour les écrivent dans la base de données d’état SQLite partagée, sous le répertoire d’état OpenClaw actif. La ligne `installed_plugin_index` stocke des métadonnées `installRecords` durables, notamment des enregistrements pour les manifestes de plugins endommagés ou manquants, ainsi qu’un cache de registre à froid dérivé des manifestes utilisé par `openclaw plugins update`, la désinstallation, les diagnostics et le registre de plugins à froid.

Lorsqu’OpenClaw détecte dans la configuration des enregistrements hérités `plugins.installs` provenant d’une version publiée, les lectures à l’exécution les traitent comme des données de compatibilité sans réécrire `openclaw.json`. Les écritures explicites de plugins et `openclaw doctor --fix` déplacent ces enregistrements vers l’index des plugins et suppriment la clé de configuration lorsque les écritures de configuration sont autorisées ; si l’une ou l’autre écriture échoue, les enregistrements de configuration sont conservés afin de ne pas perdre les métadonnées d’installation.

## Désinstallation

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
openclaw plugins uninstall <id> --force
```

`uninstall` supprime les enregistrements du plugin de `plugins.entries`, de l’index persistant des plugins, des entrées des listes d’autorisation et de refus des plugins, ainsi que des entrées `plugins.load.paths` liées, le cas échéant. Sauf si `--keep-files` est défini, la désinstallation supprime également le répertoire d’installation géré suivi, mais uniquement si son chemin résolu se trouve dans la racine des extensions de plugins d’OpenClaw. Si le plugin occupe actuellement l’emplacement `memory` ou `contextEngine`, cet emplacement est réinitialisé à sa valeur par défaut (`memory-core` pour la mémoire, `legacy` pour le moteur de contexte).

`uninstall` affiche un aperçu de ce qui sera supprimé, puis demande `Uninstall plugin "<id>"?` avant d’appliquer les modifications. Passez `--force` pour ignorer la demande de confirmation, ce qui est utile pour les scripts et les exécutions non interactives ; sans cette option, la désinstallation nécessite un TTY interactif. `--dry-run` affiche le même aperçu et se termine sans demander de confirmation ni modifier quoi que ce soit.

<Note>
`--keep-config` est pris en charge en tant qu’alias obsolète de `--keep-files`.
</Note>

## Mise à jour

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update @acme/demo
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Les mises à jour s’appliquent aux installations de plugins suivies dans l’index géré des plugins et aux installations de paquets de hooks suivies dans `hooks.internal.installs`. Elles réutilisent la source déjà choisie par l’utilisateur lors de l’installation du plugin et ne nécessitent donc pas une seconde acceptation de la source.

<AccordionGroup>
  <Accordion title="Résolution de l’identifiant du plugin par rapport à la spécification npm">
    Lorsque vous transmettez un identifiant de plugin, OpenClaw réutilise la spécification d’installation enregistrée pour ce plugin. Les balises de distribution précédemment stockées, telles que `@beta`, et les versions exactes épinglées continuent donc d’être utilisées lors des exécutions ultérieures de `update <id>`.

    Pendant `update <id> --dry-run`, les installations npm épinglées à une version exacte le restent. Si OpenClaw peut également résoudre la ligne par défaut du registre du paquet et que celle-ci est plus récente que la version épinglée installée, la simulation signale l’épinglage et affiche la commande explicite de mise à jour du paquet `@latest` permettant de suivre la ligne par défaut du registre.

    Cette règle de mise à jour ciblée diffère du parcours de maintenance en masse `openclaw plugins update --all`. Les mises à jour en masse respectent toujours les spécifications d’installation suivies ordinaires, mais les enregistrements fiables de plugins OpenClaw officiels peuvent se synchroniser avec la cible actuelle du catalogue officiel au lieu de rester sur un ancien paquet officiel à version exacte. Utilisez la commande ciblée `update <id>` lorsque vous souhaitez intentionnellement conserver intacte une spécification officielle exacte ou balisée.

    Pour les installations npm, vous pouvez également transmettre une spécification explicite de paquet npm avec une balise de distribution ou une version exacte. OpenClaw associe ce nom de paquet à l’enregistrement de plugin suivi, met à jour ce plugin installé et enregistre la nouvelle spécification npm pour les futures mises à jour basées sur l’identifiant.

    Le fait de transmettre le nom du paquet npm sans version ni balise permet également de retrouver l’enregistrement de plugin suivi. Utilisez cette méthode lorsqu’un plugin était épinglé à une version exacte et que vous souhaitez le replacer sur la ligne de publication par défaut du registre.

  </Accordion>
  <Accordion title="Mises à jour du canal bêta">
    La commande ciblée `openclaw plugins update <id-or-npm-spec>` réutilise la spécification de plugin suivie, sauf si vous transmettez une nouvelle spécification. La commande en masse `openclaw plugins update --all` utilise le paramètre `update.channel` configuré lorsqu’elle synchronise les enregistrements fiables de plugins officiels avec la cible du catalogue officiel, afin que les installations du canal bêta puissent rester sur la ligne de publication bêta au lieu d’être silencieusement normalisées vers stable/latest.

    `openclaw update` connaît également le canal de mise à jour OpenClaw actif : sur le canal bêta, les enregistrements de plugins npm de la ligne par défaut et de ClawHub essaient d’abord `@beta`. Ils reviennent à la spécification default/latest enregistrée si aucune version bêta du plugin n’existe ; les plugins npm utilisent également cette solution de repli lorsque le paquet bêta existe mais échoue à la validation de l’installation. Cette solution de repli est signalée par un avertissement et ne fait pas échouer la mise à jour du cœur. Les versions exactes et les balises explicites restent épinglées à ce sélecteur pour les mises à jour ciblées.

  </Accordion>
  <Accordion title="Vérifications de version et dérive d’intégrité">
    Avant une mise à jour npm réelle, OpenClaw compare la version du paquet installé aux métadonnées du registre npm. Si la version installée et l’identité d’artefact enregistrée correspondent déjà à la cible résolue, la mise à jour est ignorée sans téléchargement, réinstallation ni réécriture de `openclaw.json`.

    Lorsqu’un hachage d’intégrité stocké existe et que le hachage de l’artefact récupéré change, OpenClaw considère cela comme une dérive de l’artefact npm. La commande interactive `openclaw plugins update` affiche les hachages attendu et réel et demande confirmation avant de poursuivre. Les assistants de mise à jour non interactifs échouent par défaut, sauf si l’appelant fournit une politique explicite de poursuite.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install lors de la mise à jour">
    `--dangerously-force-unsafe-install` est également accepté avec `plugins update` à des fins de compatibilité, mais il est obsolète et ne modifie plus le comportement de mise à jour des plugins. La configuration `security.installPolicy` de l’opérateur peut toujours bloquer les mises à jour ; les hooks `before_install` du plugin s’appliquent uniquement dans les processus où les hooks de plugins sont chargés.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk lors de la mise à jour">
    Les mises à jour de plugins communautaires provenant de ClawHub exécutent la même vérification de confiance de la version exacte que les installations avant de télécharger le paquet de remplacement. Utilisez `--acknowledge-clawhub-risk` pour les automatisations examinées qui doivent continuer lorsque la version ClawHub sélectionnée présente un avertissement de confiance risqué. Les paquets ClawHub officiels et les sources de plugins OpenClaw intégrés contournent cette demande de confirmation liée à la confiance de la version.
  </Accordion>
</AccordionGroup>

## Inspection

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
```

Par défaut, l’inspection affiche l’identité, l’état de chargement, la source, les capacités du manifeste, les indicateurs de politique, les diagnostics, les métadonnées d’installation, les capacités du paquet et toute prise en charge détectée de serveurs MCP ou LSP, sans importer le code d’exécution du plugin. La sortie JSON inclut les contrats du manifeste du plugin, tels que `contracts.agentToolResultMiddleware` et `contracts.trustedToolPolicies`, afin que les opérateurs puissent auditer les déclarations des surfaces fiables avant d’activer ou de redémarrer un plugin. Ajoutez `--runtime` pour charger le module du plugin et inclure les hooks, outils, commandes, services, méthodes du Gateway et routes HTTP enregistrés. L’inspection d’exécution signale directement les dépendances de plugin manquantes ; les installations et réparations restent assurées par `openclaw plugins install`, `openclaw plugins update` et `openclaw doctor --fix`.

Les commandes CLI appartenant aux plugins sont généralement installées sous forme de groupes de commandes `openclaw` à la racine, mais les plugins peuvent également enregistrer des commandes imbriquées sous un parent du cœur tel que `openclaw nodes`. Une fois que `inspect --runtime` affiche une commande sous `cliCommands`, exécutez-la au chemin indiqué ; par exemple, un plugin qui enregistre `demo-git` peut être vérifié avec `openclaw demo-git ping`.

Chaque plugin est classé selon ce qu’il enregistre réellement à l’exécution :

| Forme               | Signification                                                           |
| ------------------- | ----------------------------------------------------------------- |
| `plain-capability`  | exactement un type de capacité (par exemple, un plugin uniquement fournisseur)         |
| `hybrid-capability` | plusieurs types de capacités (par exemple, texte + parole + images)       |
| `hook-only`         | uniquement des hooks, sans capacités, outils, commandes, services ni routes |
| `non-capability`    | outils, commandes ou services, mais aucune capacité                       |

Consultez [Formes de plugins](/fr/plugins/architecture#plugin-shapes) pour en savoir plus sur le modèle de capacités.

<Note>
L’indicateur `--json` produit un rapport lisible par machine adapté aux scripts et aux audits. `inspect --all` affiche un tableau couvrant l’ensemble du parc, avec des colonnes pour la forme, les types de capacités, les avis de compatibilité, les capacités du paquet et le résumé des hooks. `info` est un alias de `inspect`.
</Note>

## Doctor

```bash
openclaw plugins doctor
```

`doctor` signale les erreurs de chargement des plugins, les diagnostics de manifeste/découverte, les avis de compatibilité et les références obsolètes de configuration de plugins, telles que des emplacements de plugins manquants. Lorsque l’arborescence d’installation et la configuration des plugins sont propres, il affiche `No plugin issues detected.` Si une configuration obsolète subsiste, mais que l’arborescence d’installation est par ailleurs saine, le résumé l’indique au lieu de laisser entendre que tous les plugins sont sains.

Si un plugin configuré est présent sur le disque, mais bloqué par les contrôles de sécurité des chemins du chargeur, la validation de la configuration conserve l’entrée du plugin et la signale comme `present but blocked`. Corrigez le diagnostic précédent concernant le plugin bloqué, par exemple la propriété du chemin ou les autorisations d’écriture pour tous, au lieu de supprimer la configuration `plugins.entries.<id>` ou `plugins.allow`.

Pour les échecs liés à la structure du module, tels que des exports `register`/`activate` manquants, relancez avec `OPENCLAW_PLUGIN_LOAD_DEBUG=1` afin d’inclure un résumé compact de la structure des exports dans la sortie de diagnostic.

## Registre

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Le registre local des plugins est le modèle de lecture à froid persistant d’OpenClaw pour l’identité des plugins installés, leur activation, les métadonnées de leur source et la propriété de leurs contributions. Le démarrage normal, la recherche du propriétaire d’un fournisseur, la classification de la configuration des canaux et l’inventaire des plugins peuvent le consulter sans importer les modules d’exécution des plugins.

Utilisez `plugins registry` pour vérifier si le registre persistant est présent, à jour ou obsolète. Utilisez `--refresh` pour le reconstruire à partir de l’index persistant des plugins, de la politique de configuration et des métadonnées des manifestes/paquets. Il s’agit d’une procédure de réparation, et non d’une procédure d’activation à l’exécution.

`openclaw doctor --fix` répare également les dérives npm gérées adjacentes au registre : si un paquet `@openclaw/*` orphelin ou récupéré, situé dans un projet npm de plugin géré ou dans l’ancienne racine npm gérée à plat, masque un plugin intégré, doctor supprime ce paquet obsolète et reconstruit le registre afin que le démarrage effectue la validation par rapport au manifeste intégré. Doctor recrée également le lien vers le paquet hôte `openclaw` dans les plugins npm gérés qui déclarent `peerDependencies.openclaw`, afin que les imports d’exécution locaux au paquet, tels que `openclaw/plugin-sdk/*`, soient résolus après des mises à jour ou des réparations npm.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` est un mécanisme de compatibilité d’urgence obsolète destiné aux échecs de lecture du registre. Préférez `plugins registry --refresh` ou `openclaw doctor --fix` ; la solution de repli par variable d’environnement est réservée à la récupération d’urgence du démarrage pendant le déploiement de la migration.
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

`plugins marketplace entries` répertorie les entrées du flux de place de marché OpenClaw configuré. Par défaut, il tente d’utiliser le flux hébergé et se rabat sur le dernier instantané accepté ou les données intégrées. Utilisez `--feed-profile <name>` pour lire un profil configuré spécifique, `--feed-url <url>` pour lire une URL explicite de flux hébergé et `--offline` pour lire le dernier instantané accepté sans récupérer le flux.

`plugins marketplace refresh` actualise l’instantané du flux hébergé configuré et indique si OpenClaw a accepté les données hébergées, un instantané hébergé ou les données intégrées de repli. Utilisez `--expected-sha256` lorsqu’un appelant exige que la commande échoue à moins qu’une charge utile hébergée récente corresponde à une somme de contrôle épinglée.

La commande `list` de la place de marché accepte un chemin local de place de marché, un chemin `marketplace.json`, un raccourci GitHub tel que `owner/repo`, une URL de dépôt GitHub ou une URL git. `--json` affiche le libellé de la source résolue, ainsi que le manifeste analysé de la place de marché et les entrées de plugins.

L’actualisation de la place de marché charge un flux hébergé de la place de marché OpenClaw et conserve la
réponse validée en tant qu’instantané local du flux hébergé. Sans option, elle utilise
le profil de flux par défaut configuré. Utilisez `--feed-profile <name>` pour actualiser un
profil configuré spécifique, `--feed-url <url>` pour actualiser une URL explicite de
flux hébergé, `--expected-sha256 <sha256>` pour exiger une somme de contrôle de charge utile correspondante
(`sha256:<hex>` ou un condensé hexadécimal brut de 64 caractères), et `--json` pour
une sortie lisible par une machine. Les URL explicites de flux hébergés ne doivent pas contenir
d’identifiants, de chaînes de requête ni de fragments. Les actualisations non épinglées peuvent signaler
un instantané hébergé ou un résultat de repli sur les données intégrées sans faire échouer la commande. Les actualisations
épinglées échouent sauf si elles acceptent une nouvelle charge utile hébergée, et les actualisations hébergées
réussies échouent si OpenClaw ne peut pas conserver l’instantané validé.

## Voir aussi

- [Création de plugins](/fr/plugins/building-plugins)
- [Référence de la CLI](/fr/cli)
- [ClawHub](/clawhub)
