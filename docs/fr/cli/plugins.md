---
read_when:
    - Vous souhaitez installer ou gérer des plugins de Gateway ou des bundles compatibles
    - Vous souhaitez déboguer des échecs de chargement de Plugin
summary: Référence CLI pour `openclaw plugins` (lister, installer, marketplace, désinstaller, activer/désactiver, doctor)
title: plugins
x-i18n:
    generated_at: "2026-04-23T07:01:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7dd521db1de47ceb183d98a538005d3d816f52ffeee12593bcbaa8014d6e507b
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Gérez les plugins de Gateway, les packs de hooks et les bundles compatibles.

Lié :

- Système de Plugin : [Plugins](/fr/tools/plugin)
- Compatibilité des bundles : [Bundles de Plugin](/fr/plugins/bundles)
- Manifeste + schéma de Plugin : [Manifeste de Plugin](/fr/plugins/manifest)
- Renforcement de la sécurité : [Sécurité](/fr/gateway/security)

## Commandes

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

Les plugins intégrés sont fournis avec OpenClaw. Certains sont activés par défaut (par exemple
les fournisseurs de modèles intégrés, les fournisseurs de parole intégrés et le
plugin de navigateur intégré) ; d’autres nécessitent `plugins enable`.

Les plugins OpenClaw natifs doivent fournir `openclaw.plugin.json` avec un schéma JSON inline
(`configSchema`, même s’il est vide). Les bundles compatibles utilisent à la place leurs
propres manifestes de bundle.

`plugins list` affiche `Format: openclaw` ou `Format: bundle`. La sortie détaillée de list/info
affiche également le sous-type de bundle (`codex`, `claude` ou `cursor`) ainsi que les
capacités de bundle détectées.

### Installer

```bash
openclaw plugins install <package>                      # ClawHub d’abord, puis npm
openclaw plugins install clawhub:<package>              # ClawHub uniquement
openclaw plugins install <package> --force              # écraser une installation existante
openclaw plugins install <package> --pin                # épingler la version
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # chemin local
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicite)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

Les noms de package nus sont d’abord vérifiés dans ClawHub, puis dans npm. Remarque de sécurité :
traitez les installations de plugins comme l’exécution de code. Préférez les versions épinglées.

Si votre section `plugins` est adossée à un seul fichier `$include`, `plugins install`,
`plugins update`, `plugins enable`, `plugins disable` et `plugins uninstall`
écrivent dans ce fichier inclus et laissent `openclaw.json` intact. Les
includes racine, les tableaux d’includes et les includes avec remplacements frères
échouent en mode fermé au lieu d’être aplatis. Voir [Includes de configuration](/fr/gateway/configuration) pour
les formes prises en charge.

Si la configuration est invalide, `plugins install` échoue normalement en mode fermé et vous indique
d’exécuter d’abord `openclaw doctor --fix`. La seule exception documentée est un
chemin de récupération étroit pour les plugins intégrés pour les plugins qui optent explicitement pour
`openclaw.install.allowInvalidConfigRecovery`.

`--force` réutilise la cible d’installation existante et écrase en place un
plugin ou pack de hooks déjà installé. Utilisez-le lorsque vous réinstallez intentionnellement
le même id à partir d’un nouveau chemin local, d’une archive, d’un package ClawHub ou d’un artefact npm.
Pour les mises à niveau courantes d’un plugin npm déjà suivi, préférez
`openclaw plugins update <id-or-npm-spec>`.

Si vous exécutez `plugins install` pour un id de plugin déjà installé, OpenClaw
s’arrête et vous redirige vers `plugins update <id-or-npm-spec>` pour une mise à niveau normale,
ou vers `plugins install <package> --force` lorsque vous voulez réellement écraser
l’installation actuelle depuis une autre source.

`--pin` s’applique uniquement aux installations npm. Il n’est pas pris en charge avec `--marketplace`,
car les installations marketplace conservent des métadonnées de source marketplace plutôt qu’une
spécification npm.

`--dangerously-force-unsafe-install` est une option de dernier recours pour les faux positifs
dans le scanner intégré de code dangereux. Elle permet de poursuivre l’installation même
lorsque le scanner intégré signale des résultats `critical`, mais elle **ne**
contourne pas les blocs de politique du hook `before_install` des plugins et **ne**
contourne pas les échecs de scan.

Cet indicateur CLI s’applique aux flux d’installation/mise à jour de plugins. Les
installations de dépendances de Skills adossées à la Gateway utilisent le remplacement de requête correspondant
`dangerouslyForceUnsafeInstall`, tandis que `openclaw skills install` reste un flux distinct de
téléchargement/installation de Skills depuis ClawHub.

`plugins install` est aussi la surface d’installation des packs de hooks qui exposent
`openclaw.hooks` dans `package.json`. Utilisez `openclaw hooks` pour une
visibilité filtrée des hooks et leur activation par hook, pas pour l’installation des packages.

Les spécifications npm sont **registry-only** (nom de package + **version exacte** facultative ou
**dist-tag**). Les spécifications git/URL/fichier et les plages semver sont rejetées. Les installations
de dépendances s’exécutent avec `--ignore-scripts` pour la sécurité.

Les spécifications nues et `@latest` restent sur la piste stable. Si npm résout
l’une ou l’autre vers une préversion, OpenClaw s’arrête et vous demande d’opter explicitement avec un
tag de préversion tel que `@beta`/`@rc` ou une version de préversion exacte telle que
`@1.2.3-beta.4`.

Si une spécification d’installation nue correspond à un id de plugin intégré (par exemple `diffs`), OpenClaw
installe directement le plugin intégré. Pour installer un package npm portant le même
nom, utilisez une spécification scoped explicite (par exemple `@scope/diffs`).

Archives prises en charge : `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Les installations depuis la marketplace Claude sont également prises en charge.

Les installations ClawHub utilisent un localisateur explicite `clawhub:<package>` :

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw privilégie désormais aussi ClawHub pour les spécifications de plugins nues compatibles npm. Il ne
revient à npm que si ClawHub ne dispose pas de ce package ou de cette version :

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw télécharge l’archive du package depuis ClawHub, vérifie la compatibilité
annoncée de l’API de Plugin / de la version minimale de Gateway, puis l’installe via le chemin normal
des archives. Les installations enregistrées conservent leurs métadonnées de source ClawHub pour les mises à jour ultérieures.

Utilisez la notation abrégée `plugin@marketplace` lorsque le nom de la marketplace existe dans le
cache du registre local de Claude à `~/.claude/plugins/known_marketplaces.json` :

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Utilisez `--marketplace` lorsque vous voulez transmettre explicitement la source de la marketplace :

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

Les sources marketplace peuvent être :

- un nom de marketplace connu de Claude depuis `~/.claude/plugins/known_marketplaces.json`
- une racine de marketplace locale ou un chemin `marketplace.json`
- une forme abrégée de dépôt GitHub telle que `owner/repo`
- une URL de dépôt GitHub telle que `https://github.com/owner/repo`
- une URL git

Pour les marketplaces distantes chargées depuis GitHub ou git, les entrées de plugin doivent rester
à l’intérieur du dépôt marketplace cloné. OpenClaw accepte des sources de chemin relatives depuis
ce dépôt et rejette les sources de plugin HTTP(S), à chemin absolu, git, GitHub et autres
sources non basées sur un chemin provenant de manifestes distants.

Pour les chemins locaux et les archives, OpenClaw détecte automatiquement :

- les plugins OpenClaw natifs (`openclaw.plugin.json`)
- les bundles compatibles Codex (`.codex-plugin/plugin.json`)
- les bundles compatibles Claude (`.claude-plugin/plugin.json` ou la disposition par défaut
  des composants Claude)
- les bundles compatibles Cursor (`.cursor-plugin/plugin.json`)

Les bundles compatibles s’installent dans la racine normale des plugins et participent
au même flux list/info/enable/disable. Aujourd’hui, les Skills de bundle, les
command-skills Claude, les valeurs par défaut Claude `settings.json`, les valeurs par défaut Claude `.lsp.json` /
`lspServers` déclarées dans le manifeste, les command-skills Cursor et les répertoires de hooks Codex
compatibles sont pris en charge ; les autres capacités de bundle détectées sont
affichées dans les diagnostics/info mais ne sont pas encore reliées à l’exécution runtime.

### Lister

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Utilisez `--enabled` pour n’afficher que les plugins chargés. Utilisez `--verbose` pour passer de la
vue tableau à des lignes de détails par plugin avec les métadonnées de
source/origine/version/activation. Utilisez `--json` pour obtenir un inventaire lisible par machine ainsi que des
diagnostics du registre.

Utilisez `--link` pour éviter de copier un répertoire local (ajoute à `plugins.load.paths`) :

```bash
openclaw plugins install -l ./my-plugin
```

`--force` n’est pas pris en charge avec `--link` car les installations liées réutilisent le
chemin source au lieu de copier vers une cible d’installation gérée.

Utilisez `--pin` sur les installations npm pour enregistrer la spécification exacte résolue (`name@version`) dans
`plugins.installs` tout en conservant le comportement par défaut non épinglé.

### Désinstaller

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` supprime les enregistrements de plugin de `plugins.entries`, `plugins.installs`,
de la liste d’autorisation des plugins et des entrées liées `plugins.load.paths` le cas échéant.
Pour les plugins Active Memory, l’emplacement mémoire est réinitialisé à `memory-core`.

Par défaut, la désinstallation supprime également le répertoire d’installation du plugin sous la
racine des plugins du répertoire d’état actif. Utilisez
`--keep-files` pour conserver les fichiers sur disque.

`--keep-config` est pris en charge comme alias déprécié de `--keep-files`.

### Mettre à jour

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Les mises à jour s’appliquent aux installations suivies dans `plugins.installs` et aux
installations suivies de packs de hooks dans `hooks.internal.installs`.

Lorsque vous transmettez un id de plugin, OpenClaw réutilise la spécification d’installation enregistrée pour ce
plugin. Cela signifie que les dist-tags précédemment enregistrés comme `@beta` et les versions exactes épinglées
continuent d’être utilisés lors des exécutions ultérieures de `update <id>`.

Pour les installations npm, vous pouvez aussi transmettre une spécification explicite de package npm avec un dist-tag
ou une version exacte. OpenClaw résout ce nom de package vers l’enregistrement du plugin suivi,
met à jour ce plugin installé et enregistre la nouvelle spécification npm pour les futures
mises à jour basées sur l’id.

Le fait de transmettre le nom du package npm sans version ni tag est également résolu vers
l’enregistrement du plugin suivi. Utilisez cela lorsqu’un plugin était épinglé à une version exacte et
que vous voulez le faire revenir à la ligne de version par défaut du registre.

Avant une mise à jour npm réelle, OpenClaw vérifie la version du package installé par rapport
aux métadonnées du registre npm. Si la version installée et l’identité
d’artefact enregistrée correspondent déjà à la cible résolue, la mise à jour est ignorée sans
téléchargement, réinstallation ni réécriture de `openclaw.json`.

Lorsqu’un hash d’intégrité enregistré existe et que le hash de l’artefact récupéré change,
OpenClaw traite cela comme une dérive d’artefact npm. La commande interactive
`openclaw plugins update` affiche les hash attendus et réels et demande
confirmation avant de continuer. Les assistants de mise à jour non interactifs échouent en mode fermé
sauf si l’appelant fournit une politique explicite de poursuite.

`--dangerously-force-unsafe-install` est aussi disponible sur `plugins update` comme
remplacement de dernier recours pour les faux positifs du scan intégré de code dangereux lors des
mises à jour de plugins. Il ne contourne toujours pas les blocs de politique `before_install` des plugins
ni le blocage des échecs de scan, et il s’applique uniquement aux mises à jour de plugins, pas aux
mises à jour de packs de hooks.

### Inspecter

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Introspection approfondie pour un seul plugin. Affiche l’identité, l’état de chargement, la source,
les capacités enregistrées, les hooks, les outils, les commandes, les services,
les méthodes de Gateway, les routes HTTP, les indicateurs de politique, les diagnostics, les métadonnées d’installation, les capacités de bundle,
ainsi que tout support détecté pour serveur MCP ou LSP.

Chaque plugin est classé selon ce qu’il enregistre réellement à l’exécution :

- **plain-capability** — un type de capacité (par ex. un plugin fournisseur uniquement)
- **hybrid-capability** — plusieurs types de capacités (par ex. texte + parole + images)
- **hook-only** — uniquement des hooks, sans capacités ni surfaces
- **non-capability** — outils/commandes/services mais sans capacités

Voir [Formes de Plugin](/fr/plugins/architecture#plugin-shapes) pour en savoir plus sur le modèle de capacités.

L’indicateur `--json` produit un rapport lisible par machine adapté aux scripts et
aux audits.

`inspect --all` affiche un tableau à l’échelle de la flotte avec les colonnes forme, types de capacités,
avis de compatibilité, capacités de bundle et résumé des hooks.

`info` est un alias de `inspect`.

### Doctor

```bash
openclaw plugins doctor
```

`doctor` signale les erreurs de chargement de plugins, les diagnostics de manifeste/découverte et
les avis de compatibilité. Lorsque tout est propre, il affiche `No plugin issues
detected.`

Pour les échecs de forme de module tels que des exports `register`/`activate` manquants, réexécutez
avec `OPENCLAW_PLUGIN_LOAD_DEBUG=1` pour inclure un résumé compact de la forme des exports dans
la sortie de diagnostic.

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

La liste marketplace accepte un chemin de marketplace local, un chemin `marketplace.json`, une
forme abrégée GitHub comme `owner/repo`, une URL de dépôt GitHub ou une URL git. `--json`
affiche le libellé de source résolu ainsi que le manifeste de marketplace analysé et
les entrées de plugin.
