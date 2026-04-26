---
read_when:
    - Vous souhaitez installer ou gérer des Plugins Gateway ou des bundles compatibles
    - Vous souhaitez déboguer les échecs de chargement des Plugins
sidebarTitle: Plugins
summary: Référence CLI pour `openclaw plugins` (lister, installer, marketplace, désinstaller, activer/désactiver, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-04-26T11:26:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 52b02c96859e1da1d7028bce375045ef9472d1f2e01086f1318e4f38e8d5bb7d
    source_path: cli/plugins.md
    workflow: 15
---

Gérer les Plugins Gateway, les packs de hooks et les bundles compatibles.

<CardGroup cols={2}>
  <Card title="Système de Plugins" href="/fr/tools/plugin">
    Guide utilisateur final pour installer, activer et dépanner les plugins.
  </Card>
  <Card title="Bundles de Plugins" href="/fr/plugins/bundles">
    Modèle de compatibilité des bundles.
  </Card>
  <Card title="Manifeste de Plugin" href="/fr/plugins/manifest">
    Champs du manifeste et schéma de configuration.
  </Card>
  <Card title="Sécurité" href="/fr/gateway/security">
    Renforcement de sécurité pour les installations de plugins.
  </Card>
</CardGroup>

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
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

<Note>
Les Plugins inclus sont livrés avec OpenClaw. Certains sont activés par défaut (par exemple les fournisseurs de modèles inclus, les fournisseurs vocaux inclus et le Plugin navigateur inclus) ; d'autres nécessitent `plugins enable`.

Les Plugins OpenClaw natifs doivent fournir `openclaw.plugin.json` avec un schéma JSON inline (`configSchema`, même s'il est vide). Les bundles compatibles utilisent à la place leurs propres manifestes de bundle.

`plugins list` affiche `Format: openclaw` ou `Format: bundle`. La sortie détaillée de list/info affiche aussi le sous-type de bundle (`codex`, `claude` ou `cursor`) ainsi que les capacités de bundle détectées.
</Note>

### Installer

```bash
openclaw plugins install <package>                      # ClawHub d'abord, puis npm
openclaw plugins install clawhub:<package>              # ClawHub uniquement
openclaw plugins install <package> --force              # écrase l'installation existante
openclaw plugins install <package> --pin                # épingle la version
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # chemin local
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicite)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
Les noms de package nus sont d'abord vérifiés dans ClawHub, puis dans npm. Considérez les installations de plugins comme l'exécution de code. Préférez les versions épinglées.
</Warning>

<AccordionGroup>
  <Accordion title="Includes de configuration et récupération de configuration invalide">
    Si votre section `plugins` est alimentée par un seul `$include` mono-fichier, `plugins install/update/enable/disable/uninstall` écrit dans ce fichier inclus et laisse `openclaw.json` intact. Les includes racine, les tableaux d'include et les includes avec surcharges sœurs échouent en mode fermé au lieu d'être aplatis. Voir [Includes de configuration](/fr/gateway/configuration) pour les formes prises en charge.

    Si la configuration est invalide, `plugins install` échoue normalement en mode fermé et vous demande d'exécuter d'abord `openclaw doctor --fix`. La seule exception documentée est un chemin étroit de récupération de Plugin inclus pour les Plugins qui activent explicitement `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force et réinstallation vs mise à jour">
    `--force` réutilise la cible d'installation existante et écrase sur place un plugin ou pack de hooks déjà installé. Utilisez-le lorsque vous réinstallez intentionnellement le même id à partir d'un nouveau chemin local, d'une archive, d'un package ClawHub ou d'un artefact npm. Pour les mises à niveau courantes d'un plugin npm déjà suivi, préférez `openclaw plugins update <id-or-npm-spec>`.

    Si vous exécutez `plugins install` pour un id de plugin déjà installé, OpenClaw s'arrête et vous redirige vers `plugins update <id-or-npm-spec>` pour une mise à niveau normale, ou vers `plugins install <package> --force` lorsque vous voulez réellement écraser l'installation actuelle depuis une source différente.

  </Accordion>
  <Accordion title="Portée de --pin">
    `--pin` s'applique uniquement aux installations npm. Il n'est pas pris en charge avec `--marketplace`, car les installations marketplace conservent des métadonnées de source marketplace au lieu d'une spécification npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` est une option de dernier recours pour les faux positifs dans le scanner intégré de code dangereux. Elle permet à l'installation de continuer même lorsque le scanner intégré signale des résultats `critical`, mais elle **ne** contourne **pas** les blocages de politique de hook `before_install` des plugins et **ne** contourne **pas** les échecs d'analyse.

    Ce drapeau CLI s'applique aux flux d'installation/mise à jour de plugins. Les installations de dépendances de Skills adossées à la Gateway utilisent la surcharge de requête correspondante `dangerouslyForceUnsafeInstall`, tandis que `openclaw skills install` reste un flux séparé de téléchargement/installation de Skills ClawHub.

  </Accordion>
  <Accordion title="Packs de hooks et spécifications npm">
    `plugins install` est aussi la surface d'installation pour les packs de hooks qui exposent `openclaw.hooks` dans `package.json`. Utilisez `openclaw hooks` pour une visibilité filtrée des hooks et leur activation individuelle, pas pour l'installation des packages.

    Les spécifications npm sont **registry-only** (nom du package + **version exacte** ou **dist-tag** facultatif). Les spécifications git/URL/fichier et les plages semver sont rejetées. Les installations de dépendances s'exécutent localement au projet avec `--ignore-scripts` pour des raisons de sécurité, même lorsque votre shell a des paramètres globaux d'installation npm.

    Les spécifications nues et `@latest` restent sur la piste stable. Si npm résout l'une ou l'autre vers une préversion, OpenClaw s'arrête et vous demande un opt-in explicite avec un tag de préversion tel que `@beta`/`@rc` ou une version exacte de préversion telle que `@1.2.3-beta.4`.

    Si une spécification d'installation nue correspond à un id de Plugin inclus (par exemple `diffs`), OpenClaw installe directement le Plugin inclus. Pour installer un package npm du même nom, utilisez une spécification scoped explicite (par exemple `@scope/diffs`).

  </Accordion>
  <Accordion title="Archives">
    Archives prises en charge : `.zip`, `.tgz`, `.tar.gz`, `.tar`. Les archives de Plugin OpenClaw natif doivent contenir un `openclaw.plugin.json` valide à la racine du Plugin extrait ; les archives qui contiennent uniquement `package.json` sont rejetées avant qu'OpenClaw n'écrive les enregistrements d'installation.

    Les installations marketplace Claude sont aussi prises en charge.

  </Accordion>
</AccordionGroup>

Les installations ClawHub utilisent un localisateur explicite `clawhub:<package>` :

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw préfère désormais aussi ClawHub pour les spécifications de plugin nues compatibles npm. Il ne bascule vers npm que si ClawHub n'a pas ce package ou cette version :

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw télécharge l'archive du package depuis ClawHub, vérifie l'API Plugin annoncée / la compatibilité minimale avec la gateway, puis l'installe via le chemin d'archive normal. Les installations enregistrées conservent leurs métadonnées de source ClawHub pour les mises à jour ultérieures.

#### Abréviation marketplace

Utilisez l'abréviation `plugin@marketplace` lorsque le nom de marketplace existe dans le cache de registre local de Claude à `~/.claude/plugins/known_marketplaces.json` :

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Utilisez `--marketplace` lorsque vous voulez transmettre explicitement la source marketplace :

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Sources marketplace">
    - un nom de marketplace connu de Claude depuis `~/.claude/plugins/known_marketplaces.json`
    - une racine de marketplace locale ou un chemin `marketplace.json`
    - une abréviation de dépôt GitHub telle que `owner/repo`
    - une URL de dépôt GitHub telle que `https://github.com/owner/repo`
    - une URL git
  </Tab>
  <Tab title="Règles des marketplaces distantes">
    Pour les marketplaces distantes chargées depuis GitHub ou git, les entrées de plugin doivent rester à l'intérieur du dépôt marketplace cloné. OpenClaw accepte les sources de chemin relatives depuis ce dépôt et rejette les sources de plugin HTTP(S), chemin absolu, git, GitHub et autres sources non basées sur un chemin provenant de manifestes distants.
  </Tab>
</Tabs>

Pour les chemins locaux et archives, OpenClaw détecte automatiquement :

- les Plugins OpenClaw natifs (`openclaw.plugin.json`)
- les bundles compatibles Codex (`.codex-plugin/plugin.json`)
- les bundles compatibles Claude (`.claude-plugin/plugin.json` ou la disposition de composant Claude par défaut)
- les bundles compatibles Cursor (`.cursor-plugin/plugin.json`)

<Note>
Les bundles compatibles s'installent dans la racine normale des plugins et participent au même flux list/info/enable/disable. Aujourd'hui, les Skills de bundle, les command-skills Claude, les valeurs par défaut Claude `settings.json`, les valeurs par défaut Claude `.lsp.json` / `lspServers` déclarés dans le manifeste, les command-skills Cursor et les répertoires de hooks Codex compatibles sont pris en charge ; les autres capacités de bundle détectées sont affichées dans les diagnostics/info mais ne sont pas encore raccordées à l'exécution au moment de l'exécution.
</Note>

### Lister

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  Afficher uniquement les plugins activés.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Passer de la vue tabulaire à des lignes de détail par plugin avec métadonnées de source/origine/version/activation.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventaire lisible par machine plus diagnostics du registre.
</ParamField>

<Note>
`plugins list` lit d'abord le registre local persistant des plugins, avec un repli dérivé uniquement du manifeste lorsque le registre est manquant ou invalide. C'est utile pour vérifier si un plugin est installé, activé et visible pour la planification à froid du démarrage, mais ce n'est pas une sonde d'exécution en direct d'un processus Gateway déjà en cours d'exécution. Après avoir modifié le code du plugin, son activation, la politique de hooks ou `plugins.load.paths`, redémarrez la Gateway qui sert le canal avant d'attendre l'exécution de nouveaux hooks ou du code `register(api)`. Pour les déploiements distants/en conteneur, vérifiez que vous redémarrez bien le processus enfant réel `openclaw gateway run`, et pas seulement un processus wrapper.
</Note>

Pour le travail sur un Plugin inclus à l'intérieur d'une image Docker packagée, montez en bind le répertoire source du plugin
par-dessus le chemin source packagé correspondant, tel que
`/app/extensions/synology-chat`. OpenClaw découvrira cette surcouche source montée
avant `/app/dist/extensions/synology-chat` ; un simple répertoire source copié
reste inerte, de sorte que les installations packagées normales continuent d'utiliser le dist compilé.

Pour le débogage des hooks à l'exécution :

- `openclaw plugins inspect <id> --json` affiche les hooks enregistrés et les diagnostics d'un passage d'inspection avec module chargé.
- `openclaw gateway status --deep --require-rpc` confirme la Gateway accessible, les indices service/processus, le chemin de configuration et l'état RPC.
- Les hooks de conversation non inclus (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) nécessitent `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Utilisez `--link` pour éviter de copier un répertoire local (ajoute à `plugins.load.paths`) :

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` n'est pas pris en charge avec `--link` car les installations liées réutilisent le chemin source au lieu de copier vers une cible d'installation gérée.

Utilisez `--pin` sur les installations npm pour enregistrer la spécification exacte résolue (`name@version`) dans l'index des plugins gérés tout en conservant le comportement par défaut non épinglé.
</Note>

### Index des plugins

Les métadonnées d'installation des plugins sont un état géré par machine, pas une configuration utilisateur. Les installations et mises à jour les écrivent dans `plugins/installs.json` sous le répertoire d'état OpenClaw actif. Sa map de niveau supérieur `installRecords` est la source durable des métadonnées d'installation, y compris les enregistrements pour les manifestes de plugin cassés ou manquants. Le tableau `plugins` est le cache de registre à froid dérivé des manifestes. Le fichier inclut un avertissement de non-modification et est utilisé par `openclaw plugins update`, la désinstallation, les diagnostics et le registre de plugins à froid.

Lorsque OpenClaw voit des enregistrements hérités livrés `plugins.installs` dans la configuration, il les déplace dans l'index des plugins et supprime la clé de configuration ; si l'une des écritures échoue, les enregistrements de configuration sont conservés afin que les métadonnées d'installation ne soient pas perdues.

### Désinstaller

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` supprime les enregistrements du plugin de `plugins.entries`, de l'index persistant des plugins, des entrées de liste d'autorisation/refus des plugins, et des entrées liées `plugins.load.paths` le cas échéant. Sauf si `--keep-files` est défini, la désinstallation supprime aussi le répertoire d'installation géré suivi lorsqu'il se trouve dans la racine des extensions de plugins d'OpenClaw. Pour les plugins Active Memory, l'emplacement mémoire est réinitialisé à `memory-core`.

<Note>
`--keep-config` est pris en charge comme alias obsolète de `--keep-files`.
</Note>

### Mettre à jour

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Les mises à jour s'appliquent aux installations de plugins suivies dans l'index géré des plugins et aux installations suivies de packs de hooks dans `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Résolution de l'id de plugin vs spécification npm">
    Lorsque vous transmettez un id de plugin, OpenClaw réutilise la spécification d'installation enregistrée pour ce plugin. Cela signifie que les dist-tags précédemment stockés comme `@beta` et les versions exactes épinglées continuent d'être utilisés lors des exécutions ultérieures de `update <id>`.

    Pour les installations npm, vous pouvez aussi transmettre une spécification explicite de package npm avec un dist-tag ou une version exacte. OpenClaw résout ce nom de package vers l'enregistrement de plugin suivi, met à jour ce plugin installé, puis enregistre la nouvelle spécification npm pour les futures mises à jour basées sur l'id.

    Transmettre le nom du package npm sans version ni tag résout aussi vers l'enregistrement de plugin suivi. Utilisez cela lorsqu'un plugin a été épinglé à une version exacte et que vous voulez le remettre sur la ligne de publication par défaut du registre.

  </Accordion>
  <Accordion title="Vérifications de version et dérive d'intégrité">
    Avant une mise à jour npm en direct, OpenClaw vérifie la version du package installé par rapport aux métadonnées du registre npm. Si la version installée et l'identité d'artefact enregistrée correspondent déjà à la cible résolue, la mise à jour est ignorée sans téléchargement, réinstallation ni réécriture de `openclaw.json`.

    Lorsqu'un hash d'intégrité stocké existe et que le hash de l'artefact récupéré change, OpenClaw traite cela comme une dérive d'artefact npm. La commande interactive `openclaw plugins update` affiche les hash attendus et réels et demande confirmation avant de continuer. Les assistants de mise à jour non interactifs échouent en mode fermé à moins que l'appelant ne fournisse une politique explicite de continuation.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install lors d'une mise à jour">
    `--dangerously-force-unsafe-install` est aussi disponible sur `plugins update` comme surcharge de dernier recours pour les faux positifs du scan intégré de code dangereux lors des mises à jour de plugins. Il ne contourne toujours pas les blocages de politique `before_install` des plugins ni le blocage dû à un échec d'analyse, et il s'applique uniquement aux mises à jour de plugins, pas aux mises à jour de packs de hooks.
  </Accordion>
</AccordionGroup>

### Inspecter

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Introspection approfondie d'un seul plugin. Affiche l'identité, l'état de chargement, la source, les capacités enregistrées, hooks, outils, commandes, services, méthodes gateway, routes HTTP, drapeaux de politique, diagnostics, métadonnées d'installation, capacités de bundle et toute prise en charge détectée de serveur MCP ou LSP.

Chaque plugin est classé selon ce qu'il enregistre réellement à l'exécution :

- **plain-capability** — un seul type de capacité (par ex. un plugin fournisseur uniquement)
- **hybrid-capability** — plusieurs types de capacités (par ex. texte + voix + images)
- **hook-only** — uniquement des hooks, sans capacités ni surfaces
- **non-capability** — outils/commandes/services mais sans capacités

Voir [Formes de Plugin](/fr/plugins/architecture#plugin-shapes) pour plus d'informations sur le modèle de capacités.

<Note>
Le drapeau `--json` produit un rapport lisible par machine adapté aux scripts et aux audits. `inspect --all` affiche un tableau à l'échelle de la flotte avec forme, types de capacités, avis de compatibilité, capacités de bundle et colonnes de résumé des hooks. `info` est un alias de `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` signale les erreurs de chargement des plugins, les diagnostics de manifeste/découverte et les avis de compatibilité. Lorsque tout est propre, il affiche `No plugin issues detected.`

Pour les échecs de forme de module tels que l'absence des exports `register`/`activate`, relancez avec `OPENCLAW_PLUGIN_LOAD_DEBUG=1` pour inclure un résumé compact de la forme des exports dans la sortie diagnostique.

### Registre

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Le registre local des plugins est le modèle persistant de lecture à froid d'OpenClaw pour l'identité des plugins installés, leur activation, les métadonnées de source et la propriété des contributions. Le démarrage normal, la recherche du propriétaire du fournisseur, la classification de configuration de canal et l'inventaire des plugins peuvent le lire sans importer les modules d'exécution des plugins.

Utilisez `plugins registry` pour vérifier si le registre persistant est présent, à jour ou obsolète. Utilisez `--refresh` pour le reconstruire à partir de l'index persistant des plugins, de la politique de configuration et des métadonnées de manifeste/package. Il s'agit d'un chemin de réparation, pas d'un chemin d'activation à l'exécution.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` est un commutateur de compatibilité de dernier recours obsolète pour les échecs de lecture du registre. Préférez `plugins registry --refresh` ou `openclaw doctor --fix` ; le repli par variable d'environnement n'est là que pour la récupération d'urgence au démarrage pendant le déploiement de la migration.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

La liste marketplace accepte un chemin de marketplace local, un chemin `marketplace.json`, une abréviation GitHub comme `owner/repo`, une URL de dépôt GitHub ou une URL git. `--json` affiche le libellé de source résolu ainsi que le manifeste marketplace analysé et les entrées de plugin.

## Liens associés

- [Créer des plugins](/fr/plugins/building-plugins)
- [Référence CLI](/fr/cli)
- [Plugins communautaires](/fr/plugins/community)
