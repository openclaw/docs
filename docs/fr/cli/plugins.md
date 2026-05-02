---
read_when:
    - Vous voulez installer ou gérer des plugins Gateway ou des bundles compatibles
    - Vous souhaitez déboguer les échecs de chargement des Plugins
sidebarTitle: Plugins
summary: Référence CLI pour `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-02T07:02:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 963a4292f86d651a23f06ee83fd82d7ad80cb99ff3397a665940d8247225252c
    source_path: cli/plugins.md
    workflow: 16
---

Gérer les plugins Gateway, les packs de hooks et les bundles compatibles.

<CardGroup cols={2}>
  <Card title="Système de Plugin" href="/fr/tools/plugin">
    Guide utilisateur final pour installer, activer et dépanner les plugins.
  </Card>
  <Card title="Bundles de Plugin" href="/fr/plugins/bundles">
    Modèle de compatibilité des bundles.
  </Card>
  <Card title="Manifeste de Plugin" href="/fr/plugins/manifest">
    Champs du manifeste et schéma de configuration.
  </Card>
  <Card title="Sécurité" href="/fr/gateway/security">
    Renforcement de la sécurité pour les installations de plugins.
  </Card>
</CardGroup>

## Commandes

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search <query>
openclaw plugins search <query> --limit 20
openclaw plugins search <query> --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
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

Pour étudier une installation, une inspection, une désinstallation ou une actualisation de registre lente, exécutez la
commande avec `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. La trace écrit les durées des phases
sur stderr et garde la sortie JSON analysable. Consultez [Débogage](/fr/help/debugging#plugin-lifecycle-trace).

<Note>
Les plugins inclus sont fournis avec OpenClaw. Certains sont activés par défaut (par exemple les fournisseurs de modèles inclus, les fournisseurs de parole inclus et le plugin de navigateur inclus) ; d’autres nécessitent `plugins enable`.

Les plugins OpenClaw natifs doivent fournir `openclaw.plugin.json` avec un schéma JSON intégré (`configSchema`, même vide). Les bundles compatibles utilisent plutôt leurs propres manifestes de bundle.

`plugins list` affiche `Format: openclaw` ou `Format: bundle`. La sortie détaillée de liste/info affiche aussi le sous-type de bundle (`codex`, `claude` ou `cursor`) ainsi que les capacités de bundle détectées.
</Note>

### Installer

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # ClawHub first, then npm
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install git:github.com/<owner>/<repo>  # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
Les noms de packages nus sont vérifiés d’abord dans ClawHub, puis dans npm. Traitez les installations de plugins comme l’exécution de code. Préférez les versions épinglées.
</Warning>

`plugins search` interroge ClawHub pour trouver des packages de plugins installables et affiche
des noms de packages prêts à installer. La recherche porte sur les packages de plugins de code et de plugins de bundle,
pas sur les Skills. Utilisez `openclaw skills search` pour les Skills ClawHub.

<Note>
ClawHub est la principale surface de distribution et de découverte pour la plupart des plugins. Npm
reste une solution de repli prise en charge et un chemin d’installation directe. Pendant la migration vers
ClawHub, OpenClaw fournit encore certains packages de plugins `@openclaw/*` détenus par OpenClaw
sur npm ; les versions de ces packages peuvent être en retard sur le code source inclus entre les trains de publication
des plugins. Si npm signale qu’un package de plugin détenu par OpenClaw est obsolète, cette
version publiée est un ancien artefact externe ; utilisez le plugin inclus avec
la version actuelle d’OpenClaw ou un checkout local jusqu’à la publication d’un package npm plus récent.
</Note>

<AccordionGroup>
  <Accordion title="Includes de configuration et récupération de configuration invalide">
    Si votre section `plugins` s’appuie sur un `$include` à fichier unique, `plugins install/update/enable/disable/uninstall` écrit dans ce fichier inclus et laisse `openclaw.json` intact. Les includes racine, les tableaux d’includes et les includes avec remplacements frères échouent fermés au lieu d’être aplatis. Consultez [Includes de configuration](/fr/gateway/configuration) pour les formes prises en charge.

    Si la configuration est invalide pendant l’installation, `plugins install` échoue normalement fermé et vous indique d’exécuter d’abord `openclaw doctor --fix`. Pendant le démarrage du Gateway, une configuration invalide pour un plugin est isolée à ce plugin afin que les autres canaux et plugins puissent continuer à fonctionner ; `openclaw doctor --fix` peut mettre en quarantaine l’entrée de plugin invalide. La seule exception documentée au moment de l’installation est un chemin étroit de récupération de plugin inclus pour les plugins qui optent explicitement pour `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force et réinstallation plutôt que mise à jour">
    `--force` réutilise la cible d’installation existante et écrase sur place un plugin ou un pack de hooks déjà installé. Utilisez-le lorsque vous réinstallez intentionnellement le même id depuis un nouveau chemin local, une archive, un package ClawHub ou un artefact npm. Pour les mises à niveau courantes d’un plugin npm déjà suivi, préférez `openclaw plugins update <id-or-npm-spec>`.

    Si vous exécutez `plugins install` pour un id de plugin déjà installé, OpenClaw s’arrête et vous oriente vers `plugins update <id-or-npm-spec>` pour une mise à niveau normale, ou vers `plugins install <package> --force` lorsque vous voulez réellement écraser l’installation actuelle depuis une source différente.

  </Accordion>
  <Accordion title="Portée de --pin">
    `--pin` s’applique uniquement aux installations npm. Il n’est pas pris en charge avec les installations `git:` ; utilisez une référence git explicite comme `git:github.com/acme/plugin@v1.2.3` lorsque vous voulez une source épinglée. Il n’est pas pris en charge avec `--marketplace`, car les installations depuis marketplace conservent les métadonnées de source marketplace au lieu d’une spécification npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` est une option de dernier recours pour les faux positifs dans l’analyseur intégré de code dangereux. Elle permet à l’installation de continuer même lorsque l’analyseur intégré signale des résultats `critical`, mais elle ne contourne **pas** les blocages de politique du hook `before_install` du plugin et ne contourne **pas** les échecs d’analyse.

    Ce drapeau CLI s’applique aux flux d’installation/mise à jour de plugins. Les installations de dépendances de Skills adossées au Gateway utilisent le remplacement de requête correspondant `dangerouslyForceUnsafeInstall`, tandis que `openclaw skills install` reste un flux séparé de téléchargement/installation de Skills ClawHub.

    Si un plugin que vous avez publié sur ClawHub est bloqué par une analyse de registre, utilisez les étapes éditeur dans [ClawHub](/fr/tools/clawhub).

  </Accordion>
  <Accordion title="Packs de hooks et spécifications npm">
    `plugins install` est aussi la surface d’installation pour les packs de hooks qui exposent `openclaw.hooks` dans `package.json`. Utilisez `openclaw hooks` pour une visibilité filtrée des hooks et l’activation par hook, pas pour l’installation de packages.

    Les spécifications npm sont **réservées au registre** (nom de package + **version exacte** facultative ou **dist-tag**). Les spécifications Git/URL/fichier et les plages semver sont rejetées. Les installations de dépendances s’exécutent localement au projet avec `--ignore-scripts` pour la sécurité, même lorsque votre shell a des paramètres globaux d’installation npm.

    Utilisez `npm:<package>` lorsque vous voulez ignorer la recherche ClawHub et installer directement depuis npm. Les spécifications de package nues préfèrent encore ClawHub et ne se rabattent sur npm que lorsque ClawHub ne possède pas ce package ou cette version.

    Les spécifications nues et `@latest` restent sur la voie stable. Si npm résout l’une ou l’autre vers une préversion, OpenClaw s’arrête et vous demande d’opter explicitement pour une balise de préversion comme `@beta`/`@rc` ou une version de préversion exacte comme `@1.2.3-beta.4`.

    Si une spécification d’installation nue correspond à un id de plugin officiel (par exemple `diffs`), OpenClaw installe directement l’entrée du catalogue. Pour installer un package npm portant le même nom, utilisez une spécification explicitement portée (par exemple `@scope/diffs`).

  </Accordion>
  <Accordion title="Dépôts Git">
    Utilisez `git:<repo>` pour installer directement depuis un dépôt git. Les formes prises en charge incluent `git:github.com/owner/repo`, `git:owner/repo`, les URL de clone complètes `https://`, `ssh://`, `git://`, `file://` et `git@host:owner/repo.git`. Ajoutez `@<ref>` ou `#<ref>` pour extraire une branche, une balise ou un commit avant l’installation.

    Les installations git clonent dans un répertoire temporaire, extraient la référence demandée lorsqu’elle est présente, puis utilisent l’installateur normal de répertoire de plugin. Cela signifie que la validation du manifeste, l’analyse du code dangereux, le travail d’installation du gestionnaire de packages et les enregistrements d’installation se comportent comme pour les installations npm. Les installations git enregistrées incluent l’URL/référence source plus le commit résolu afin que `openclaw plugins update` puisse résoudre à nouveau la source ultérieurement.

    Après une installation depuis git, utilisez `openclaw plugins inspect <id> --runtime --json` pour vérifier les enregistrements d’exécution comme les méthodes gateway et les commandes CLI. Si le plugin a enregistré une racine CLI avec `api.registerCli`, exécutez cette commande directement via la CLI racine d’OpenClaw, par exemple `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    Archives prises en charge : `.zip`, `.tgz`, `.tar.gz`, `.tar`. Les archives de plugins OpenClaw natifs doivent contenir un `openclaw.plugin.json` valide à la racine du plugin extrait ; les archives qui ne contiennent que `package.json` sont rejetées avant qu’OpenClaw écrive les enregistrements d’installation.

    Les installations depuis la marketplace Claude sont également prises en charge.

  </Accordion>
</AccordionGroup>

Les installations ClawHub utilisent un localisateur explicite `clawhub:<package>` :

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw préfère désormais aussi ClawHub pour les spécifications de plugins nues compatibles npm. Il ne se rabat sur npm que si ClawHub ne possède pas ce package ou cette version :

```bash
openclaw plugins install openclaw-codex-app-server
```

Utilisez `npm:` pour forcer une résolution uniquement npm, par exemple lorsque ClawHub est inaccessible ou que vous savez que le package n’existe que sur npm :

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw vérifie la compatibilité annoncée de l’API de plugin / du gateway minimal avant l’installation. Lorsque la version ClawHub sélectionnée publie un artefact ClawPack, OpenClaw télécharge le ClawPack versionné, vérifie l’en-tête de condensat ClawHub et le condensat de l’artefact, puis l’installe via le chemin d’archive normal. Les anciennes versions ClawHub sans métadonnées ClawPack s’installent encore via l’ancien chemin de vérification d’archive de package. Les installations enregistrées conservent leurs métadonnées de source ClawHub et les faits de condensat ClawPack pour les mises à jour ultérieures.
Les installations ClawHub non versionnées conservent une spécification enregistrée non versionnée afin que `openclaw plugins update` puisse suivre les nouvelles publications ClawHub ; les sélecteurs explicites de version ou de balise comme `clawhub:pkg@1.2.3` et `clawhub:pkg@beta` restent épinglés à ce sélecteur.

#### Raccourci de marketplace

Utilisez le raccourci `plugin@marketplace` lorsque le nom de marketplace existe dans le cache de registre local de Claude à `~/.claude/plugins/known_marketplaces.json` :

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Utilisez `--marketplace` lorsque vous voulez transmettre explicitement la source de marketplace :

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Sources de marketplace">
    - un nom de marketplace connu par Claude depuis `~/.claude/plugins/known_marketplaces.json`
    - une racine de marketplace locale ou un chemin `marketplace.json`
    - un raccourci de dépôt GitHub comme `owner/repo`
    - une URL de dépôt GitHub comme `https://github.com/owner/repo`
    - une URL git

  </Tab>
  <Tab title="Règles des marketplaces distantes">
    Pour les marketplaces distantes chargées depuis GitHub ou git, les entrées de plugins doivent rester à l'intérieur du dépôt de marketplace cloné. OpenClaw accepte les sources de chemins relatifs depuis ce dépôt et rejette les sources de plugins HTTP(S), les chemins absolus, git, GitHub et les autres sources de plugins qui ne sont pas des chemins depuis les manifestes distants.
  </Tab>
</Tabs>

Pour les chemins locaux et les archives, OpenClaw détecte automatiquement :

- les plugins OpenClaw natifs (`openclaw.plugin.json`)
- les lots compatibles avec Codex (`.codex-plugin/plugin.json`)
- les lots compatibles avec Claude (`.claude-plugin/plugin.json` ou la disposition par défaut des composants Claude)
- les lots compatibles avec Cursor (`.cursor-plugin/plugin.json`)

<Note>
Les lots compatibles s'installent dans la racine normale des plugins et participent au même flux list/info/enable/disable. Aujourd'hui, les Skills de lots, les command-skills Claude, les valeurs par défaut Claude `settings.json`, les valeurs par défaut Claude `.lsp.json` / `lspServers` déclarées par le manifeste, les command-skills Cursor et les répertoires de hooks Codex compatibles sont pris en charge ; les autres capacités de lots détectées sont affichées dans les diagnostics/info, mais ne sont pas encore raccordées à l'exécution au runtime.
</Note>

### Lister

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search <query>
openclaw plugins search <query> --limit 20
openclaw plugins search <query> --json
```

<ParamField path="--enabled" type="boolean">
  Afficher uniquement les plugins activés.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Passer de la vue en tableau à des lignes de détail par plugin avec les métadonnées de source/origine/version/activation.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventaire lisible par machine, plus diagnostics du registre.
</ParamField>

<Note>
`plugins list` lit d'abord le registre local persistant des plugins, avec un repli dérivé uniquement du manifeste lorsque le registre est absent ou invalide. Cette commande est utile pour vérifier si un plugin est installé, activé et visible pour la planification du démarrage à froid, mais ce n'est pas une sonde de runtime en direct d'un processus Gateway déjà en cours d'exécution. Après une modification du code du plugin, de l'activation, de la politique de hooks ou de `plugins.load.paths`, redémarrez le Gateway qui sert le canal avant d'attendre l'exécution du nouveau code `register(api)` ou des hooks. Pour les déploiements distants/en conteneur, vérifiez que vous redémarrez bien l'enfant `openclaw gateway run` réel, et pas seulement un processus wrapper.
</Note>

`plugins search` est une recherche dans le catalogue distant ClawHub. Cette commande n'inspecte pas l'état local, ne modifie pas la configuration, n'installe pas de packages et ne charge pas de code de runtime de plugin. Les résultats de recherche incluent le nom du package ClawHub, la famille, le canal, la version, le résumé et une indication d'installation comme `openclaw plugins install clawhub:<package>`.

Pour travailler sur des plugins intégrés dans une image Docker packagée, montez en bind le répertoire source du plugin par-dessus le chemin source packagé correspondant, comme `/app/extensions/synology-chat`. OpenClaw découvrira cette superposition source montée avant `/app/dist/extensions/synology-chat` ; un simple répertoire source copié reste inerte afin que les installations packagées normales continuent d'utiliser le dist compilé.

Pour déboguer les hooks au runtime :

- `openclaw plugins inspect <id> --runtime --json` affiche les hooks enregistrés et les diagnostics d'une passe d'inspection avec module chargé. L'inspection runtime n'installe jamais de dépendances ; utilisez `openclaw doctor --fix` pour nettoyer l'état des dépendances héritées ou installer les plugins téléchargeables configurés manquants.
- `openclaw gateway status --deep --require-rpc` confirme le Gateway joignable, les indications de service/processus, le chemin de configuration et la santé RPC.
- Les hooks de conversation non intégrés (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) exigent `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Utilisez `--link` pour éviter de copier un répertoire local (ajoute à `plugins.load.paths`) :

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` n'est pas pris en charge avec `--link`, car les installations liées réutilisent le chemin source au lieu de copier par-dessus une cible d'installation gérée.

Utilisez `--pin` sur les installations npm pour enregistrer la spécification exacte résolue (`name@version`) dans l'index des plugins gérés tout en conservant le comportement par défaut sans épinglage.
</Note>

### Index des plugins

Les métadonnées d'installation des plugins sont un état géré par la machine, pas une configuration utilisateur. Les installations et mises à jour les écrivent dans `plugins/installs.json` sous le répertoire d'état OpenClaw actif. Sa map de premier niveau `installRecords` est la source durable des métadonnées d'installation, y compris les enregistrements pour les manifestes de plugins cassés ou manquants. Le tableau `plugins` est le cache du registre à froid dérivé du manifeste. Le fichier inclut un avertissement de ne pas modifier et est utilisé par `openclaw plugins update`, la désinstallation, les diagnostics et le registre à froid des plugins.

Quand OpenClaw voit des enregistrements hérités distribués `plugins.installs` dans la configuration, il les déplace dans l'index des plugins et supprime la clé de configuration ; si l'une des écritures échoue, les enregistrements de configuration sont conservés afin de ne pas perdre les métadonnées d'installation.

### Désinstaller

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` supprime les enregistrements de plugin de `plugins.entries`, de l'index persistant des plugins, des entrées de listes d'autorisation/refus des plugins et des entrées `plugins.load.paths` liées le cas échéant. Sauf si `--keep-files` est défini, la désinstallation supprime aussi le répertoire d'installation gérée suivi lorsqu'il se trouve dans la racine des extensions de plugins d'OpenClaw. Pour les plugins Active Memory, l'emplacement mémoire est réinitialisé à `memory-core`.

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

Les mises à jour s'appliquent aux installations de plugins suivies dans l'index des plugins gérés et aux installations de packs de hooks suivies dans `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Résolution de l'id de plugin et de la spécification npm">
    Quand vous passez un id de plugin, OpenClaw réutilise la spécification d'installation enregistrée pour ce plugin. Cela signifie que les dist-tags précédemment stockés comme `@beta` et les versions exactes épinglées continuent d'être utilisés lors des exécutions ultérieures de `update <id>`.

    Pour les installations npm, vous pouvez aussi passer une spécification de package npm explicite avec un dist-tag ou une version exacte. OpenClaw résout ce nom de package vers l'enregistrement de plugin suivi, met à jour ce plugin installé et enregistre la nouvelle spécification npm pour les futures mises à jour basées sur l'id.

    Passer le nom du package npm sans version ni tag se résout aussi vers l'enregistrement de plugin suivi. Utilisez cette option quand un plugin a été épinglé à une version exacte et que vous voulez le ramener à la ligne de publication par défaut du registre.

  </Accordion>
  <Accordion title="Vérifications de version et dérive d'intégrité">
    Avant une mise à jour npm en direct, OpenClaw vérifie la version du package installé par rapport aux métadonnées du registre npm. Si la version installée et l'identité de l'artefact enregistrée correspondent déjà à la cible résolue, la mise à jour est ignorée sans téléchargement, réinstallation ni réécriture de `openclaw.json`.

    Lorsqu'un hash d'intégrité stocké existe et que le hash de l'artefact récupéré change, OpenClaw traite cela comme une dérive d'artefact npm. La commande interactive `openclaw plugins update` affiche les hash attendus et réels, puis demande une confirmation avant de continuer. Les assistants de mise à jour non interactifs échouent en mode fermé sauf si l'appelant fournit une politique de continuation explicite.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install lors de la mise à jour">
    `--dangerously-force-unsafe-install` est aussi disponible sur `plugins update` comme remplacement d'urgence pour les faux positifs de l'analyse intégrée de code dangereux pendant les mises à jour de plugins. Cette option ne contourne toujours pas les blocages de politique `before_install` des plugins ni les blocages dus à un échec d'analyse, et elle ne s'applique qu'aux mises à jour de plugins, pas aux mises à jour de packs de hooks.
  </Accordion>
</AccordionGroup>

### Inspecter

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspecter affiche l'identité, l'état de chargement, la source, les capacités du manifeste, les indicateurs de politique, les diagnostics, les métadonnées d'installation, les capacités de lot et tout support détecté de serveur MCP ou LSP sans importer le runtime du plugin par défaut. Ajoutez `--runtime` pour charger le module du plugin et inclure les hooks, outils, commandes, services, méthodes gateway et routes HTTP enregistrés. L'inspection runtime signale directement les dépendances de plugin manquantes ; les installations et réparations restent dans `openclaw plugins install`, `openclaw plugins update` et `openclaw doctor --fix`.

Les commandes CLI détenues par un plugin sont installées comme groupes de commandes racine `openclaw`. Après que `inspect --runtime` affiche une commande sous `cliCommands`, exécutez-la sous la forme `openclaw <command> ...` ; par exemple, un plugin qui enregistre `demo-git` peut être vérifié avec `openclaw demo-git ping`.

Chaque plugin est classé selon ce qu'il enregistre réellement au runtime :

- **plain-capability** — un seul type de capacité (par exemple un plugin uniquement fournisseur)
- **hybrid-capability** — plusieurs types de capacités (par exemple texte + parole + images)
- **hook-only** — uniquement des hooks, sans capacités ni surfaces
- **non-capability** — outils/commandes/services, mais aucune capacité

Voir [Formes de plugins](/fr/plugins/architecture#plugin-shapes) pour en savoir plus sur le modèle de capacités.

<Note>
L'indicateur `--json` produit un rapport lisible par machine adapté aux scripts et à l'audit. `inspect --all` affiche un tableau pour toute la flotte avec des colonnes de forme, de types de capacités, de notes de compatibilité, de capacités de lots et de résumé des hooks. `info` est un alias de `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` signale les erreurs de chargement des plugins, les diagnostics de manifeste/découverte et les notes de compatibilité. Quand tout est propre, il affiche `No plugin issues detected.`

Pour les échecs de forme de module, comme des exports `register`/`activate` manquants, relancez avec `OPENCLAW_PLUGIN_LOAD_DEBUG=1` pour inclure un résumé compact de la forme des exports dans la sortie de diagnostic.

### Registre

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Le registre local des plugins est le modèle de lecture à froid persistant d'OpenClaw pour l'identité, l'activation, les métadonnées de source et la propriété des contributions des plugins. Le démarrage normal, la recherche du propriétaire de fournisseur, la classification de la configuration des canaux et l'inventaire des plugins peuvent le lire sans importer les modules de runtime des plugins.

Utilisez `plugins registry` pour inspecter si le registre persistant est présent, actuel ou obsolète. Utilisez `--refresh` pour le reconstruire depuis l'index persistant des plugins, la politique de configuration et les métadonnées de manifeste/package. C'est un chemin de réparation, pas un chemin d'activation au runtime.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` est un commutateur de compatibilité d'urgence obsolète pour les échecs de lecture du registre. Préférez `plugins registry --refresh` ou `openclaw doctor --fix` ; le repli d'environnement sert uniquement à une récupération de démarrage d'urgence pendant le déploiement de la migration.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

La liste de marketplace accepte un chemin de marketplace local, un chemin `marketplace.json`, un raccourci GitHub comme `owner/repo`, une URL de dépôt GitHub ou une URL git. `--json` affiche le libellé de source résolu ainsi que le manifeste de marketplace analysé et les entrées de plugins.

## Associé

- [Créer des plugins](/fr/plugins/building-plugins)
- [Référence CLI](/fr/cli)
- [Plugins de la communauté](/fr/plugins/community)
