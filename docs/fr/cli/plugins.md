---
read_when:
    - Vous voulez installer ou gérer des Plugins Gateway ou des bundles compatibles
    - Vous souhaitez déboguer les échecs de chargement des plugins
sidebarTitle: Plugins
summary: Référence CLI pour `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-06T09:02:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: e584092c6cdaf87681aef2ed106c299e3bab0552305b669c66b05deb61bf25ce
    source_path: cli/plugins.md
    workflow: 16
---

Gérez les plugins Gateway, les packs de hooks et les bundles compatibles.

<CardGroup cols={2}>
  <Card title="Système de Plugin" href="/fr/tools/plugin">
    Guide utilisateur final pour installer, activer et dépanner les plugins.
  </Card>
  <Card title="Gérer les plugins" href="/fr/plugins/manage-plugins">
    Exemples rapides pour installer, lister, mettre à jour, désinstaller et publier.
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

Pour enquêter sur une installation, une inspection, une désinstallation ou un rafraîchissement de registre lent, exécutez la
commande avec `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. La trace écrit les temps des phases
sur stderr et conserve une sortie JSON analysable. Consultez [Débogage](/fr/help/debugging#plugin-lifecycle-trace).

<Note>
Les plugins fournis sont livrés avec OpenClaw. Certains sont activés par défaut (par exemple les fournisseurs de modèles fournis, les fournisseurs vocaux fournis et le plugin de navigateur fourni) ; d’autres nécessitent `plugins enable`.

Les plugins OpenClaw natifs doivent livrer `openclaw.plugin.json` avec un schéma JSON intégré (`configSchema`, même vide). Les bundles compatibles utilisent plutôt leurs propres manifestes de bundle.

`plugins list` affiche `Format: openclaw` ou `Format: bundle`. La sortie détaillée de list/info affiche aussi le sous-type de bundle (`codex`, `claude` ou `cursor`) ainsi que les capacités de bundle détectées.
</Note>

### Installer

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # npm by default
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install npm-pack:<path.tgz>            # local npm pack through npm install semantics
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
Les noms de paquets nus s’installent depuis npm par défaut pendant la transition de lancement. Utilisez `clawhub:<package>` pour ClawHub. Traitez les installations de plugins comme l’exécution de code. Préférez les versions épinglées.
</Warning>

`plugins search` interroge ClawHub pour les paquets de plugins installables et affiche
des noms de paquets prêts à installer. Il recherche les paquets de plugins de code et de plugins de bundle,
pas les skills. Utilisez `openclaw skills search` pour les skills ClawHub.

<Note>
ClawHub est la principale surface de distribution et de découverte pour la plupart des plugins. Npm
reste une solution de repli prise en charge et un chemin d’installation directe. Les paquets de plugins
`@openclaw/*` appartenant à OpenClaw sont de nouveau publiés sur npm ; consultez la liste actuelle
sur [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) ou l’
[inventaire des plugins](/fr/plugins/plugin-inventory). Les installations stables utilisent `latest`.
Les installations et mises à jour du canal bêta préfèrent le dist-tag npm `beta` lorsque cette étiquette
est disponible, puis se rabattent sur `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Includes de configuration et réparation de configuration invalide">
    Si votre section `plugins` repose sur un `$include` à fichier unique, `plugins install/update/enable/disable/uninstall` écrit dans ce fichier inclus et laisse `openclaw.json` intact. Les includes racine, les tableaux d’includes et les includes avec substitutions de même niveau échouent de façon fermée au lieu d’être aplatis. Consultez [Includes de configuration](/fr/gateway/configuration) pour les formes prises en charge.

    Si la configuration est invalide pendant l’installation, `plugins install` échoue normalement de façon fermée et vous demande d’exécuter d’abord `openclaw doctor --fix`. Pendant le démarrage du Gateway et le rechargement à chaud, une configuration de plugin invalide échoue de façon fermée comme toute autre configuration invalide ; `openclaw doctor --fix` peut mettre en quarantaine l’entrée de plugin invalide. La seule exception documentée au moment de l’installation est un chemin étroit de récupération de plugin fourni pour les plugins qui optent explicitement pour `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force et réinstallation plutôt que mise à jour">
    `--force` réutilise la cible d’installation existante et écrase sur place un plugin ou un pack de hooks déjà installé. Utilisez-le lorsque vous réinstallez intentionnellement le même id depuis un nouveau chemin local, une archive, un paquet ClawHub ou un artefact npm. Pour les mises à niveau courantes d’un plugin npm déjà suivi, préférez `openclaw plugins update <id-or-npm-spec>`.

    Si vous exécutez `plugins install` pour un id de plugin déjà installé, OpenClaw s’arrête et vous oriente vers `plugins update <id-or-npm-spec>` pour une mise à niveau normale, ou vers `plugins install <package> --force` lorsque vous voulez réellement écraser l’installation actuelle depuis une source différente.

  </Accordion>
  <Accordion title="Portée de --pin">
    `--pin` s’applique uniquement aux installations npm. Il n’est pas pris en charge avec les installations `git:` ; utilisez une référence git explicite comme `git:github.com/acme/plugin@v1.2.3` lorsque vous voulez une source épinglée. Il n’est pas pris en charge avec `--marketplace`, car les installations de marketplace conservent les métadonnées de source de marketplace au lieu d’une spec npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` est une option d’urgence pour les faux positifs dans l’analyseur intégré de code dangereux. Elle permet à l’installation de continuer même lorsque l’analyseur intégré signale des résultats `critical`, mais elle ne contourne **pas** les blocages de politique des hooks `before_install` du plugin et ne contourne **pas** les échecs d’analyse.

    Cet indicateur CLI s’applique aux flux d’installation et de mise à jour de plugins. Les installations de dépendances de Skills adossées au Gateway utilisent la surcharge de requête correspondante `dangerouslyForceUnsafeInstall`, tandis que `openclaw skills install` reste un flux distinct de téléchargement et d’installation de Skills ClawHub.

    Si un plugin que vous avez publié sur ClawHub est bloqué par une analyse du registre, utilisez les étapes d’éditeur dans [ClawHub](/fr/tools/clawhub).

  </Accordion>
  <Accordion title="Packs de hooks et specs npm">
    `plugins install` est aussi la surface d’installation des packs de hooks qui exposent `openclaw.hooks` dans `package.json`. Utilisez `openclaw hooks` pour une visibilité filtrée des hooks et l’activation par hook, pas pour l’installation de paquets.

    Les specs npm sont **uniquement registre** (nom de paquet + **version exacte** ou **dist-tag** facultatif). Les specs Git/URL/fichier et les plages semver sont rejetées. Les installations de dépendances s’exécutent localement au projet avec `--ignore-scripts` par sécurité, même lorsque votre shell dispose de paramètres globaux d’installation npm.

    Utilisez `npm:<package>` lorsque vous voulez rendre la résolution npm explicite. Les specs de paquet nues s’installent aussi directement depuis npm pendant la transition de lancement.

    Les specs nues et `@latest` restent sur la piste stable. Les versions de correction datées d’OpenClaw comme `2026.5.3-1` sont des versions stables pour cette vérification. Si npm résout l’une d’elles vers une préversion, OpenClaw s’arrête et vous demande d’opter explicitement pour une étiquette de préversion comme `@beta`/`@rc` ou une version de préversion exacte comme `@1.2.3-beta.4`.

    Si une spec d’installation nue correspond à un id de plugin officiel (par exemple `diffs`), OpenClaw installe directement l’entrée du catalogue. Pour installer un paquet npm portant le même nom, utilisez une spec à scope explicite (par exemple `@scope/diffs`).

  </Accordion>
  <Accordion title="Dépôts Git">
    Utilisez `git:<repo>` pour installer directement depuis un dépôt git. Les formes prises en charge incluent `git:github.com/owner/repo`, `git:owner/repo`, les URL de clonage complètes `https://`, `ssh://`, `git://`, `file://` et `git@host:owner/repo.git`. Ajoutez `@<ref>` ou `#<ref>` pour extraire une branche, une étiquette ou un commit avant l’installation.

    Les installations Git clonent dans un répertoire temporaire, extraient la référence demandée lorsqu’elle est présente, puis utilisent l’installateur normal de répertoire de plugin. Cela signifie que la validation du manifeste, l’analyse de code dangereux, le travail d’installation du gestionnaire de paquets et les enregistrements d’installation se comportent comme pour les installations npm. Les installations git enregistrées incluent l’URL/la référence source ainsi que le commit résolu afin que `openclaw plugins update` puisse résoudre à nouveau la source ultérieurement.

    Après une installation depuis git, utilisez `openclaw plugins inspect <id> --runtime --json` pour vérifier les enregistrements runtime comme les méthodes Gateway et les commandes CLI. Si le plugin a enregistré une racine CLI avec `api.registerCli`, exécutez cette commande directement via la CLI racine d’OpenClaw, par exemple `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    Archives prises en charge : `.zip`, `.tgz`, `.tar.gz`, `.tar`. Les archives de plugins OpenClaw natifs doivent contenir un `openclaw.plugin.json` valide à la racine du plugin extrait ; les archives qui ne contiennent que `package.json` sont rejetées avant qu’OpenClaw n’écrive les enregistrements d’installation.

    Utilisez `npm-pack:<path.tgz>` lorsque le fichier est une archive tar npm-pack et que vous voulez
    tester le même chemin d’installation racine npm géré que celui utilisé par les installations depuis le registre,
    y compris la vérification de `package-lock.json`, l’analyse des dépendances hissées et
    les enregistrements d’installation npm. Les chemins d’archive simples s’installent toujours comme archives locales
    sous la racine des extensions de plugins.

    Les installations depuis la marketplace Claude sont aussi prises en charge.

  </Accordion>
</AccordionGroup>

Les installations ClawHub utilisent un localisateur explicite `clawhub:<package>` :

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Les specs de plugins nues compatibles npm s’installent depuis npm par défaut pendant la transition de lancement :

```bash
openclaw plugins install openclaw-codex-app-server
```

Utilisez `npm:` pour rendre explicite une résolution limitée à npm :

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw vérifie la compatibilité annoncée de l’API de plugin / du Gateway minimum avant l’installation. Lorsque la version ClawHub sélectionnée publie un artefact ClawPack, OpenClaw télécharge le `.tgz` npm-pack versionné, vérifie l’en-tête de condensat ClawHub et le condensat de l’artefact, puis l’installe via le chemin d’archive normal. Les anciennes versions ClawHub sans métadonnées ClawPack s’installent toujours via l’ancien chemin de vérification d’archive de paquet. Les installations enregistrées conservent leurs métadonnées de source ClawHub, le type d’artefact, l’intégrité npm, le shasum npm, le nom de l’archive tar et les faits de condensat ClawPack pour les mises à jour ultérieures.
Les installations ClawHub non versionnées conservent une spec enregistrée non versionnée afin que `openclaw plugins update` puisse suivre les nouvelles versions ClawHub ; les sélecteurs explicites de version ou d’étiquette comme `clawhub:pkg@1.2.3` et `clawhub:pkg@beta` restent épinglés à ce sélecteur.

#### Raccourci de marketplace

Utilisez le raccourci `plugin@marketplace` lorsque le nom de la marketplace existe dans le cache de registre local de Claude à `~/.claude/plugins/known_marketplaces.json` :

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

<Tabs>
  <Tab title="Marketplace sources">
    - un nom de marketplace connu de Claude issu de `~/.claude/plugins/known_marketplaces.json`
    - une racine de marketplace locale ou un chemin vers `marketplace.json`
    - un raccourci de dépôt GitHub comme `owner/repo`
    - une URL de dépôt GitHub comme `https://github.com/owner/repo`
    - une URL git

  </Tab>
  <Tab title="Remote marketplace rules">
    Pour les marketplaces distants chargés depuis GitHub ou git, les entrées de Plugin doivent rester à l’intérieur du dépôt de marketplace cloné. OpenClaw accepte les sources par chemin relatif provenant de ce dépôt et rejette les sources de Plugin HTTP(S), par chemin absolu, git, GitHub et autres sources hors chemin issues de manifestes distants.
  </Tab>
</Tabs>

Pour les chemins locaux et les archives, OpenClaw détecte automatiquement :

- les Plugins OpenClaw natifs (`openclaw.plugin.json`)
- les bundles compatibles avec Codex (`.codex-plugin/plugin.json`)
- les bundles compatibles avec Claude (`.claude-plugin/plugin.json` ou la disposition par défaut des composants Claude)
- les bundles compatibles avec Cursor (`.cursor-plugin/plugin.json`)

<Note>
Les bundles compatibles s’installent dans la racine normale des Plugins et participent au même flux de liste/informations/activation/désactivation. Aujourd’hui, les Skills de bundle, les Skills de commande Claude, les valeurs par défaut Claude `settings.json`, les valeurs par défaut Claude `.lsp.json` / `lspServers` déclarées dans le manifeste, les Skills de commande Cursor et les répertoires de hooks Codex compatibles sont pris en charge ; les autres capacités de bundle détectées sont affichées dans les diagnostics/informations, mais ne sont pas encore raccordées à l’exécution runtime.
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
  Affiche uniquement les Plugins activés.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Passe de la vue en tableau à des lignes de détail par Plugin avec les métadonnées de source/origine/version/activation.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventaire lisible par machine, plus diagnostics de registre et état d’installation des dépendances de package.
</ParamField>

<Note>
`plugins list` lit d’abord le registre local persistant des Plugins, avec une solution de repli dérivée uniquement du manifeste lorsque le registre est manquant ou invalide. C’est utile pour vérifier si un Plugin est installé, activé et visible pour la planification d’un démarrage à froid, mais ce n’est pas une sonde runtime en direct d’un processus Gateway déjà en cours d’exécution. Après avoir modifié le code d’un Plugin, son activation, la politique de hooks ou `plugins.load.paths`, redémarrez le Gateway qui sert le canal avant d’attendre que le nouveau code `register(api)` ou les hooks s’exécutent. Pour les déploiements distants/en conteneur, vérifiez que vous redémarrez bien l’enfant réel `openclaw gateway run`, et pas seulement un processus wrapper.

`plugins list --json` inclut le `dependencyStatus` de chaque Plugin depuis les `dependencies` et `optionalDependencies` de `package.json`. OpenClaw vérifie si ces noms de packages sont présents le long du chemin de recherche Node `node_modules` normal du Plugin ; il n’importe pas le code runtime du Plugin, n’exécute pas de gestionnaire de packages et ne répare pas les dépendances manquantes.
</Note>

`plugins search` est une recherche de catalogue ClawHub distante. Elle n’inspecte pas l’état local, ne modifie pas la configuration, n’installe pas de packages et ne charge pas le code runtime du Plugin. Les résultats de recherche incluent le nom de package ClawHub, la famille, le canal, la version, le résumé et une indication d’installation comme `openclaw plugins install clawhub:<package>`.

Pour travailler sur un Plugin groupé dans une image Docker packagée, montez en bind le répertoire source du Plugin par-dessus le chemin source packagé correspondant, comme `/app/extensions/synology-chat`. OpenClaw découvrira cette superposition de source montée avant `/app/dist/extensions/synology-chat` ; un simple répertoire source copié reste inerte, de sorte que les installations packagées normales continuent d’utiliser le dist compilé.

Pour le débogage des hooks runtime :

- `openclaw plugins inspect <id> --runtime --json` affiche les hooks enregistrés et les diagnostics issus d’une passe d’inspection avec module chargé. L’inspection runtime n’installe jamais de dépendances ; utilisez `openclaw doctor --fix` pour nettoyer l’état des dépendances hérité ou récupérer les Plugins téléchargeables manquants référencés par la configuration.
- `openclaw gateway status --deep --require-rpc` confirme le Gateway joignable, les indications de service/processus, le chemin de configuration et la santé RPC.
- Les hooks de conversation non groupés (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) nécessitent `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Utilisez `--link` pour éviter de copier un répertoire local (ajoute à `plugins.load.paths`) :

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` n’est pas pris en charge avec `--link`, car les installations liées réutilisent le chemin source au lieu de copier par-dessus une cible d’installation gérée.

Utilisez `--pin` sur les installations npm pour enregistrer la spécification exacte résolue (`name@version`) dans l’index des Plugins gérés tout en conservant le comportement par défaut non épinglé.
</Note>

### Index des Plugins

Les métadonnées d’installation de Plugin sont un état géré par la machine, pas une configuration utilisateur. Les installations et mises à jour les écrivent dans `plugins/installs.json` sous le répertoire d’état OpenClaw actif. Sa carte de premier niveau `installRecords` est la source durable des métadonnées d’installation, y compris les enregistrements pour les manifestes de Plugin cassés ou manquants. Le tableau `plugins` est le cache du registre à froid dérivé du manifeste. Le fichier inclut un avertissement de ne pas le modifier et est utilisé par `openclaw plugins update`, la désinstallation, les diagnostics et le registre des Plugins à froid.

Lorsque OpenClaw voit des enregistrements hérités livrés `plugins.installs` dans la configuration, il les déplace dans l’index des Plugins et supprime la clé de configuration ; si l’une des deux écritures échoue, les enregistrements de configuration sont conservés afin que les métadonnées d’installation ne soient pas perdues.

### Désinstaller

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` supprime les enregistrements de Plugin de `plugins.entries`, de l’index persistant des Plugins, des entrées de listes d’autorisation/refus de Plugins et des entrées liées `plugins.load.paths` le cas échéant. Sauf si `--keep-files` est défini, la désinstallation supprime aussi le répertoire d’installation gérée suivi lorsqu’il se trouve dans la racine des extensions de Plugins d’OpenClaw. Pour les Plugins de mémoire active, l’emplacement mémoire est réinitialisé à `memory-core`.

<Note>
`--keep-config` est pris en charge comme alias obsolète de `--keep-files`.
</Note>

### Mettre à jour

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Les mises à jour s’appliquent aux installations de Plugins suivies dans l’index des Plugins gérés et aux installations de packs de hooks suivies dans `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    Lorsque vous transmettez un identifiant de Plugin, OpenClaw réutilise la spécification d’installation enregistrée pour ce Plugin. Cela signifie que les dist-tags précédemment stockés comme `@beta` et les versions exactes épinglées continuent d’être utilisés lors des exécutions ultérieures de `update <id>`.

    Pour les installations npm, vous pouvez aussi transmettre une spécification de package npm explicite avec un dist-tag ou une version exacte. OpenClaw résout ce nom de package vers l’enregistrement de Plugin suivi, met à jour ce Plugin installé et enregistre la nouvelle spécification npm pour les futures mises à jour basées sur l’identifiant.

    Transmettre le nom du package npm sans version ni tag résout aussi vers l’enregistrement de Plugin suivi. Utilisez cela lorsqu’un Plugin était épinglé à une version exacte et que vous voulez le ramener à la ligne de publication par défaut du registre.

  </Accordion>
  <Accordion title="Beta channel updates">
    `openclaw plugins update` réutilise la spécification de Plugin suivie sauf si vous transmettez une nouvelle spécification. `openclaw update` connaît en plus le canal de mise à jour OpenClaw actif : sur le canal bêta, les enregistrements de Plugins npm et ClawHub de ligne par défaut essaient d’abord `@beta`, puis reviennent à la spécification default/latest enregistrée s’il n’existe aucune publication bêta du Plugin. Les versions exactes et les tags explicites restent épinglés à ce sélecteur.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    Avant une mise à jour npm en direct, OpenClaw vérifie la version du package installé par rapport aux métadonnées du registre npm. Si la version installée et l’identité de l’artéfact enregistrée correspondent déjà à la cible résolue, la mise à jour est ignorée sans téléchargement, réinstallation ni réécriture de `openclaw.json`.

    Lorsqu’un hash d’intégrité stocké existe et que le hash de l’artéfact récupéré change, OpenClaw traite cela comme une dérive d’artéfact npm. La commande interactive `openclaw plugins update` affiche les hash attendus et réels et demande une confirmation avant de poursuivre. Les assistants de mise à jour non interactifs échouent de façon fermée sauf si l’appelant fournit une politique de continuation explicite.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` est également disponible sur `plugins update` comme override d’urgence pour les faux positifs de l’analyse intégrée de code dangereux pendant les mises à jour de Plugins. Il ne contourne toujours pas les blocages de politique `before_install` du Plugin ni les blocages dus à un échec d’analyse, et il ne s’applique qu’aux mises à jour de Plugins, pas aux mises à jour de packs de hooks.
  </Accordion>
</AccordionGroup>

### Inspecter

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspecter affiche l’identité, l’état de chargement, la source, les capacités du manifeste, les indicateurs de politique, les diagnostics, les métadonnées d’installation, les capacités de bundle et toute prise en charge détectée de serveurs MCP ou LSP sans importer le runtime du Plugin par défaut. Ajoutez `--runtime` pour charger le module du Plugin et inclure les hooks, outils, commandes, services, méthodes Gateway et routes HTTP enregistrés. L’inspection runtime signale directement les dépendances de Plugin manquantes ; les installations et réparations restent dans `openclaw plugins install`, `openclaw plugins update` et `openclaw doctor --fix`.

Les commandes CLI appartenant aux Plugins sont installées comme groupes de commandes racine `openclaw`. Après que `inspect --runtime` affiche une commande sous `cliCommands`, exécutez-la sous la forme `openclaw <command> ...` ; par exemple, un Plugin qui enregistre `demo-git` peut être vérifié avec `openclaw demo-git ping`.

Chaque Plugin est classé selon ce qu’il enregistre réellement au runtime :

- **plain-capability** — un type de capacité (par exemple, un Plugin uniquement fournisseur)
- **hybrid-capability** — plusieurs types de capacités (par exemple, texte + parole + images)
- **hook-only** — uniquement des hooks, aucune capacité ni surface
- **non-capability** — outils/commandes/services mais aucune capacité

Voir [Formes de Plugin](/fr/plugins/architecture#plugin-shapes) pour en savoir plus sur le modèle de capacités.

<Note>
L’option `--json` produit un rapport lisible par machine adapté aux scripts et aux audits. `inspect --all` affiche un tableau pour l’ensemble du parc avec des colonnes de forme, de types de capacités, d’avis de compatibilité, de capacités de bundle et de résumé des hooks. `info` est un alias de `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` signale les erreurs de chargement de Plugin, les diagnostics de manifeste/découverte et les avis de compatibilité. Lorsque tout est propre, il affiche `No plugin issues detected.`

Si un Plugin configuré est présent sur le disque mais bloqué par les vérifications de sécurité des chemins du chargeur, la validation de configuration conserve l’entrée du Plugin et la signale comme `present but blocked`. Corrigez le diagnostic de Plugin bloqué précédent, comme la propriété du chemin ou les permissions d’écriture pour tous, au lieu de supprimer la configuration `plugins.entries.<id>` ou `plugins.allow`.

Pour les échecs de forme de module comme des exports `register`/`activate` manquants, relancez avec `OPENCLAW_PLUGIN_LOAD_DEBUG=1` pour inclure un résumé compact de la forme des exports dans la sortie de diagnostic.

### Registre

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Le registre local des plugins est le modèle de lecture à froid persistant d’OpenClaw pour l’identité des plugins installés, leur activation, les métadonnées de source et la propriété des contributions. Le démarrage normal, la recherche du propriétaire de provider, la classification de la configuration des canaux et l’inventaire des plugins peuvent le lire sans importer les modules d’exécution des plugins.

Utilisez `plugins registry` pour vérifier si le registre persistant est présent, actuel ou obsolète. Utilisez `--refresh` pour le reconstruire à partir de l’index persistant des plugins, de la politique de configuration et des métadonnées de manifeste/package. Il s’agit d’un chemin de réparation, pas d’un chemin d’activation à l’exécution.

`openclaw doctor --fix` répare également la dérive npm gérée autour du registre : si un package `@openclaw/*` orphelin ou récupéré sous la racine npm gérée des plugins masque un plugin groupé, doctor supprime ce package obsolète et reconstruit le registre afin que le démarrage valide le manifeste groupé.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` est un commutateur de compatibilité d’urgence obsolète pour les échecs de lecture du registre. Préférez `plugins registry --refresh` ou `openclaw doctor --fix` ; le repli via variable d’environnement sert uniquement à la récupération d’urgence du démarrage pendant le déploiement de la migration.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

La liste Marketplace accepte un chemin de Marketplace local, un chemin `marketplace.json`, un raccourci GitHub comme `owner/repo`, une URL de dépôt GitHub ou une URL git. `--json` affiche le libellé de source résolu ainsi que le manifeste Marketplace analysé et les entrées de plugins.

## Associé

- [Créer des plugins](/fr/plugins/building-plugins)
- [Référence CLI](/fr/cli)
- [Plugins communautaires](/fr/plugins/community)
