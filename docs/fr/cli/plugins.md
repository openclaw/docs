---
read_when:
    - Vous souhaitez installer ou gérer des plugins Gateway ou des paquets compatibles
    - Vous voulez déboguer les échecs de chargement de Plugin
sidebarTitle: Plugins
summary: Référence CLI pour `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-07T13:14:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 73023d11309c5dc4fe9fab9cffc0f7d96de1e1c22ce1ec4d2cd22d2aa4808f1a
    source_path: cli/plugins.md
    workflow: 16
---

Gérez les Plugins Gateway, les packs de hooks et les bundles compatibles.

<CardGroup cols={2}>
  <Card title="Système de Plugins" href="/fr/tools/plugin">
    Guide utilisateur pour installer, activer et dépanner les Plugins.
  </Card>
  <Card title="Gérer les Plugins" href="/fr/plugins/manage-plugins">
    Exemples rapides pour installer, lister, mettre à jour, désinstaller et publier.
  </Card>
  <Card title="Bundles de Plugins" href="/fr/plugins/bundles">
    Modèle de compatibilité des bundles.
  </Card>
  <Card title="Manifeste de Plugin" href="/fr/plugins/manifest">
    Champs du manifeste et schéma de configuration.
  </Card>
  <Card title="Sécurité" href="/fr/gateway/security">
    Renforcement de la sécurité pour les installations de Plugins.
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

Pour enquêter sur une installation, une inspection, une désinstallation ou un rafraîchissement du registre lent, exécutez la
commande avec `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. La trace écrit les temps de phase
sur stderr et conserve la sortie JSON analysable. Consultez [Débogage](/fr/help/debugging#plugin-lifecycle-trace).

<Note>
En mode Nix (`OPENCLAW_NIX_MODE=1`), les mutateurs de cycle de vie des Plugins sont désactivés. Utilisez plutôt la source Nix pour cette installation au lieu de `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` ou `plugins disable` ; pour nix-openclaw, utilisez le [Démarrage rapide](https://github.com/openclaw/nix-openclaw#quick-start) orienté agent.
</Note>

<Note>
Les Plugins fournis sont livrés avec OpenClaw. Certains sont activés par défaut (par exemple les fournisseurs de modèles fournis, les fournisseurs de synthèse vocale fournis et le Plugin de navigateur fourni) ; d’autres nécessitent `plugins enable`.

Les Plugins OpenClaw natifs doivent fournir `openclaw.plugin.json` avec un schéma JSON en ligne (`configSchema`, même vide). Les bundles compatibles utilisent plutôt leurs propres manifestes de bundle.

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
Les noms de packages nus s’installent depuis npm par défaut pendant la transition de lancement. Utilisez `clawhub:<package>` pour ClawHub. Traitez les installations de Plugins comme l’exécution de code. Préférez les versions épinglées.
</Warning>

`plugins search` interroge ClawHub pour trouver des packages de Plugins installables et affiche
des noms de packages prêts à installer. La recherche porte sur les packages de Plugins de code et de Plugins de bundle,
pas sur les Skills. Utilisez `openclaw skills search` pour les Skills ClawHub.

<Note>
ClawHub est la principale surface de distribution et de découverte pour la plupart des Plugins. Npm
reste une solution de repli prise en charge et un chemin d’installation directe. Les packages de Plugins
`@openclaw/*` appartenant à OpenClaw sont de nouveau publiés sur npm ; consultez la liste actuelle
sur [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) ou dans
[l’inventaire des Plugins](/fr/plugins/plugin-inventory). Les installations stables utilisent `latest`.
Les installations et mises à jour du canal bêta préfèrent le dist-tag npm `beta` lorsque cette balise
est disponible, puis se rabattent sur `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Includes de configuration et réparation de configuration invalide">
    Si votre section `plugins` est soutenue par un `$include` à fichier unique, `plugins install/update/enable/disable/uninstall` écrit dans ce fichier inclus et laisse `openclaw.json` intact. Les includes racine, les tableaux d’includes et les includes avec substitutions adjacentes échouent de manière fermée au lieu d’être aplatis. Consultez [Includes de configuration](/fr/gateway/configuration) pour les formes prises en charge.

    Si la configuration est invalide pendant l’installation, `plugins install` échoue normalement de manière fermée et vous demande d’exécuter d’abord `openclaw doctor --fix`. Pendant le démarrage du Gateway et le rechargement à chaud, une configuration de Plugin invalide échoue de manière fermée comme toute autre configuration invalide ; `openclaw doctor --fix` peut mettre en quarantaine l’entrée de Plugin invalide. La seule exception documentée au moment de l’installation est un chemin de récupération étroit pour les Plugins fournis qui optent explicitement pour `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force et réinstallation ou mise à jour">
    `--force` réutilise la cible d’installation existante et remplace sur place un Plugin ou un pack de hooks déjà installé. Utilisez-le lorsque vous réinstallez intentionnellement le même identifiant depuis un nouveau chemin local, une archive, un package ClawHub ou un artefact npm. Pour les mises à niveau courantes d’un Plugin npm déjà suivi, préférez `openclaw plugins update <id-or-npm-spec>`.

    Si vous exécutez `plugins install` pour un identifiant de Plugin déjà installé, OpenClaw s’arrête et vous oriente vers `plugins update <id-or-npm-spec>` pour une mise à niveau normale, ou vers `plugins install <package> --force` lorsque vous voulez réellement remplacer l’installation actuelle depuis une source différente.

  </Accordion>
  <Accordion title="Portée de --pin">
    `--pin` s’applique uniquement aux installations npm. Il n’est pas pris en charge avec les installations `git:` ; utilisez une référence git explicite comme `git:github.com/acme/plugin@v1.2.3` lorsque vous voulez une source épinglée. Il n’est pas pris en charge avec `--marketplace`, car les installations marketplace conservent les métadonnées de source marketplace au lieu d’une spec npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` est une option de dernier recours pour les faux positifs dans le scanner intégré de code dangereux. Elle permet à l’installation de continuer même lorsque le scanner intégré signale des résultats `critical`, mais elle ne contourne **pas** les blocages de politique des hooks `before_install` des Plugins et ne contourne **pas** les échecs d’analyse.

    Ce flag CLI s’applique aux flux d’installation/mise à jour de Plugins. Les installations de dépendances de Skills adossées au Gateway utilisent la substitution de requête correspondante `dangerouslyForceUnsafeInstall`, tandis que `openclaw skills install` reste un flux distinct de téléchargement/installation de Skills ClawHub.

    Si un Plugin que vous avez publié sur ClawHub est bloqué par une analyse du registre, utilisez les étapes éditeur dans [ClawHub](/fr/tools/clawhub).

  </Accordion>
  <Accordion title="Packs de hooks et specs npm">
    `plugins install` est aussi la surface d’installation pour les packs de hooks qui exposent `openclaw.hooks` dans `package.json`. Utilisez `openclaw hooks` pour une visibilité filtrée des hooks et l’activation par hook, pas pour l’installation de packages.

    Les specs npm sont **réservées au registre** (nom de package + **version exacte** facultative ou **dist-tag**). Les specs Git/URL/fichier et les plages semver sont rejetées. Les installations de dépendances s’exécutent localement au projet avec `--ignore-scripts` pour la sécurité, même si votre shell a des paramètres globaux d’installation npm. Les racines npm de Plugins gérées héritent des `overrides` npm au niveau package d’OpenClaw, de sorte que les épinglages de sécurité de l’hôte s’appliquent aussi aux dépendances de Plugins hissées.

    Utilisez `npm:<package>` lorsque vous voulez rendre la résolution npm explicite. Les specs de packages nues s’installent aussi directement depuis npm pendant la transition de lancement.

    Les specs nues et `@latest` restent sur la voie stable. Les versions correctives datées d’OpenClaw comme `2026.5.3-1` sont des versions stables pour cette vérification. Si npm résout l’une d’elles vers une préversion, OpenClaw s’arrête et vous demande d’accepter explicitement avec une balise de préversion comme `@beta`/`@rc` ou une version de préversion exacte comme `@1.2.3-beta.4`.

    Si une spec d’installation nue correspond à un identifiant de Plugin officiel (par exemple `diffs`), OpenClaw installe directement l’entrée du catalogue. Pour installer un package npm portant le même nom, utilisez une spec à scope explicite (par exemple `@scope/diffs`).

  </Accordion>
  <Accordion title="Dépôts Git">
    Utilisez `git:<repo>` pour installer directement depuis un dépôt git. Les formes prises en charge incluent `git:github.com/owner/repo`, `git:owner/repo`, les URLs complètes `https://`, `ssh://`, `git://`, `file://` et les URLs de clone `git@host:owner/repo.git`. Ajoutez `@<ref>` ou `#<ref>` pour extraire une branche, une balise ou un commit avant l’installation.

    Les installations Git clonent dans un répertoire temporaire, extraient la référence demandée lorsqu’elle est présente, puis utilisent l’installateur normal de répertoire de Plugin. Cela signifie que la validation du manifeste, l’analyse de code dangereux, le travail d’installation du gestionnaire de packages et les enregistrements d’installation se comportent comme pour les installations npm. Les installations git enregistrées incluent l’URL/référence source ainsi que le commit résolu afin que `openclaw plugins update` puisse résoudre de nouveau la source ultérieurement.

    Après l’installation depuis git, utilisez `openclaw plugins inspect <id> --runtime --json` pour vérifier les enregistrements d’exécution tels que les méthodes Gateway et les commandes CLI. Si le Plugin a enregistré une racine CLI avec `api.registerCli`, exécutez cette commande directement via la CLI racine d’OpenClaw, par exemple `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    Archives prises en charge : `.zip`, `.tgz`, `.tar.gz`, `.tar`. Les archives de Plugins OpenClaw natifs doivent contenir un `openclaw.plugin.json` valide à la racine du Plugin extrait ; les archives qui ne contiennent que `package.json` sont rejetées avant qu’OpenClaw n’écrive les enregistrements d’installation.

    Utilisez `npm-pack:<path.tgz>` lorsque le fichier est une archive tar npm-pack et que vous voulez
    tester le même chemin d’installation de racine npm gérée que celui utilisé par les installations depuis le registre,
    y compris la vérification de `package-lock.json`, l’analyse des dépendances hissées et
    les enregistrements d’installation npm. Les chemins d’archives simples s’installent toujours comme archives locales
    sous la racine d’extensions de Plugins.

    Les installations depuis la marketplace Claude sont également prises en charge.

  </Accordion>
</AccordionGroup>

Les installations ClawHub utilisent un localisateur explicite `clawhub:<package>` :

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Les specs de Plugins nues compatibles npm s’installent depuis npm par défaut pendant la transition de lancement :

```bash
openclaw plugins install openclaw-codex-app-server
```

Utilisez `npm:` pour rendre explicite une résolution limitée à npm :

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw vérifie l’API de plugin annoncée / la compatibilité minimale du Gateway avant l’installation. Lorsque la version ClawHub sélectionnée publie un artefact ClawPack, OpenClaw télécharge le `.tgz` npm-pack versionné, vérifie l’en-tête de condensat ClawHub et le condensat de l’artefact, puis l’installe via le chemin d’archive normal. Les anciennes versions de ClawHub sans métadonnées ClawPack s’installent toujours via le chemin hérité de vérification d’archive de package. Les installations enregistrées conservent leurs métadonnées de source ClawHub, le type d’artefact, l’intégrité npm, le shasum npm, le nom de tarball et les faits de condensat ClawPack pour les mises à jour ultérieures.
Les installations ClawHub non versionnées conservent une spécification enregistrée non versionnée afin que `openclaw plugins update` puisse suivre les nouvelles versions ClawHub ; les sélecteurs de version ou de tag explicites tels que `clawhub:pkg@1.2.3` et `clawhub:pkg@beta` restent épinglés à ce sélecteur.

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
  <Tab title="Sources de marketplace">
    - un nom de marketplace connue de Claude depuis `~/.claude/plugins/known_marketplaces.json`
    - une racine de marketplace locale ou un chemin `marketplace.json`
    - un raccourci de dépôt GitHub tel que `owner/repo`
    - une URL de dépôt GitHub telle que `https://github.com/owner/repo`
    - une URL git

  </Tab>
  <Tab title="Règles des marketplaces distantes">
    Pour les marketplaces distantes chargées depuis GitHub ou git, les entrées de plugin doivent rester à l’intérieur du dépôt de marketplace cloné. OpenClaw accepte les sources par chemin relatif depuis ce dépôt et rejette les sources de plugin HTTP(S), en chemin absolu, git, GitHub et autres sources non basées sur un chemin provenant de manifestes distants.
  </Tab>
</Tabs>

Pour les chemins locaux et les archives, OpenClaw détecte automatiquement :

- les plugins OpenClaw natifs (`openclaw.plugin.json`)
- les bundles compatibles avec Codex (`.codex-plugin/plugin.json`)
- les bundles compatibles avec Claude (`.claude-plugin/plugin.json` ou la disposition de composants Claude par défaut)
- les bundles compatibles avec Cursor (`.cursor-plugin/plugin.json`)

<Note>
Les bundles compatibles s’installent dans la racine de plugins normale et participent au même flux de liste/info/activation/désactivation. Aujourd’hui, les Skills de bundle, les command-skills Claude, les valeurs par défaut Claude `settings.json`, les valeurs par défaut Claude `.lsp.json` / `lspServers` déclarées par le manifeste, les command-skills Cursor et les répertoires de hooks Codex compatibles sont pris en charge ; les autres capacités de bundle détectées sont affichées dans les diagnostics/info, mais ne sont pas encore raccordées à l’exécution runtime.
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
  Basculer de la vue en tableau vers des lignes de détail par plugin avec les métadonnées de source/origine/version/activation.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventaire lisible par machine, ainsi que les diagnostics du registre et l’état d’installation des dépendances de package.
</ParamField>

<Note>
`plugins list` lit d’abord le registre local persistant des plugins, avec un repli dérivé uniquement du manifeste lorsque le registre est manquant ou invalide. C’est utile pour vérifier si un plugin est installé, activé et visible pour la planification d’un démarrage à froid, mais ce n’est pas une sonde runtime en direct d’un processus Gateway déjà en cours d’exécution. Après avoir modifié le code d’un plugin, son activation, la politique de hooks ou `plugins.load.paths`, redémarrez le Gateway qui sert le canal avant de vous attendre à ce que le nouveau code `register(api)` ou les hooks s’exécutent. Pour les déploiements distants/en conteneur, vérifiez que vous redémarrez bien l’enfant réel `openclaw gateway run`, et pas seulement un processus wrapper.

`plugins list --json` inclut le `dependencyStatus` de chaque plugin depuis les `dependencies` et `optionalDependencies` de `package.json`. OpenClaw vérifie si ces noms de packages sont présents le long du chemin de recherche Node `node_modules` normal du plugin ; il n’importe pas le code runtime du plugin, n’exécute pas de gestionnaire de packages et ne répare pas les dépendances manquantes.
</Note>

`plugins search` est une recherche distante dans le catalogue ClawHub. Elle n’inspecte pas l’état local, ne modifie pas la configuration, n’installe pas de packages et ne charge pas le code runtime du plugin. Les résultats de recherche incluent le nom du package ClawHub, la famille, le canal, la version, le résumé et une indication d’installation telle que `openclaw plugins install clawhub:<package>`.

Pour le travail sur un plugin inclus dans une image Docker packagée, montez avec bind mount le répertoire source du plugin par-dessus le chemin source packagé correspondant, par exemple `/app/extensions/synology-chat`. OpenClaw découvrira ce superposition de source montée avant `/app/dist/extensions/synology-chat` ; un répertoire source simplement copié reste inerte, afin que les installations packagées normales utilisent toujours le dist compilé.

Pour le débogage des hooks runtime :

- `openclaw plugins inspect <id> --runtime --json` affiche les hooks enregistrés et les diagnostics issus d’une passe d’inspection avec module chargé. L’inspection runtime n’installe jamais de dépendances ; utilisez `openclaw doctor --fix` pour nettoyer l’état hérité des dépendances ou récupérer des plugins téléchargeables manquants référencés par la configuration.
- `openclaw gateway status --deep --require-rpc` confirme le Gateway joignable, les indications de service/processus, le chemin de configuration et la santé RPC.
- Les hooks de conversation non inclus (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) nécessitent `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Utilisez `--link` pour éviter de copier un répertoire local (ajoute à `plugins.load.paths`) :

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` n’est pas pris en charge avec `--link`, car les installations liées réutilisent le chemin source au lieu de copier par-dessus une cible d’installation gérée.

Utilisez `--pin` sur les installations npm pour enregistrer la spécification exacte résolue (`name@version`) dans l’index des plugins gérés, tout en conservant le comportement par défaut non épinglé.
</Note>

### Index des plugins

Les métadonnées d’installation des plugins sont un état géré par la machine, pas une configuration utilisateur. Les installations et mises à jour les écrivent dans `plugins/installs.json` sous le répertoire d’état OpenClaw actif. Sa map de premier niveau `installRecords` est la source durable des métadonnées d’installation, y compris les enregistrements pour les manifestes de plugin cassés ou manquants. Le tableau `plugins` est le cache de registre à froid dérivé du manifeste. Le fichier inclut un avertissement de ne pas le modifier et est utilisé par `openclaw plugins update`, la désinstallation, les diagnostics et le registre de plugins à froid.

Lorsque OpenClaw voit des enregistrements hérités livrés `plugins.installs` dans la configuration, les lectures runtime les traitent comme entrée de compatibilité sans réécrire `openclaw.json`. Les écritures explicites de plugin et `openclaw doctor --fix` déplacent ces enregistrements dans l’index des plugins et suppriment la clé de configuration lorsque les écritures de configuration sont autorisées ; si l’une ou l’autre écriture échoue, les enregistrements de configuration sont conservés afin que les métadonnées d’installation ne soient pas perdues.

### Désinstaller

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` supprime les enregistrements de plugin de `plugins.entries`, de l’index persistant des plugins, des entrées de liste d’autorisation/refus de plugins et des entrées liées `plugins.load.paths` lorsque c’est applicable. Sauf si `--keep-files` est défini, la désinstallation supprime aussi le répertoire d’installation gérée suivi lorsqu’il se trouve dans la racine d’extensions de plugins d’OpenClaw. Pour les plugins de mémoire active, l’emplacement mémoire est réinitialisé à `memory-core`.

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

Les mises à jour s’appliquent aux installations de plugins suivies dans l’index des plugins gérés et aux installations de packs de hooks suivies dans `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Résolution entre id de plugin et spécification npm">
    Lorsque vous transmettez un id de plugin, OpenClaw réutilise la spécification d’installation enregistrée pour ce plugin. Cela signifie que les dist-tags stockés précédemment, tels que `@beta`, et les versions exactes épinglées continuent d’être utilisés lors des exécutions ultérieures de `update <id>`.

    Pour les installations npm, vous pouvez aussi transmettre une spécification de package npm explicite avec un dist-tag ou une version exacte. OpenClaw résout ce nom de package vers l’enregistrement de plugin suivi, met à jour ce plugin installé et enregistre la nouvelle spécification npm pour les futures mises à jour basées sur l’id.

    Transmettre le nom du package npm sans version ni tag résout aussi vers l’enregistrement de plugin suivi. Utilisez cela lorsqu’un plugin était épinglé à une version exacte et que vous voulez le ramener à la ligne de publication par défaut du registre.

  </Accordion>
  <Accordion title="Mises à jour du canal bêta">
    `openclaw plugins update` réutilise la spécification de plugin suivie, sauf si vous transmettez une nouvelle spécification. `openclaw update` connaît en plus le canal de mise à jour OpenClaw actif : sur le canal bêta, les enregistrements de plugins npm et ClawHub de ligne par défaut essaient d’abord `@beta`, puis se rabattent sur la spécification par défaut/latest enregistrée s’il n’existe aucune version bêta du plugin. Les versions exactes et les tags explicites restent épinglés à ce sélecteur.

  </Accordion>
  <Accordion title="Vérifications de version et dérive d’intégrité">
    Avant une mise à jour npm en direct, OpenClaw vérifie la version du package installé par rapport aux métadonnées du registre npm. Si la version installée et l’identité d’artefact enregistrée correspondent déjà à la cible résolue, la mise à jour est ignorée sans téléchargement, réinstallation ni réécriture de `openclaw.json`.

    Lorsqu’un hachage d’intégrité stocké existe et que le hachage de l’artefact récupéré change, OpenClaw traite cela comme une dérive d’artefact npm. La commande interactive `openclaw plugins update` affiche les hachages attendu et réel et demande confirmation avant de poursuivre. Les assistants de mise à jour non interactifs échouent de manière fermée, sauf si l’appelant fournit une politique de continuation explicite.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install sur update">
    `--dangerously-force-unsafe-install` est également disponible sur `plugins update` comme dérogation d’urgence pour les faux positifs de l’analyse de code dangereux intégrée pendant les mises à jour de plugins. Il ne contourne toujours pas les blocages de politique `before_install` du plugin ni les blocages dus à un échec d’analyse, et il s’applique uniquement aux mises à jour de plugins, pas aux mises à jour de packs de hooks.
  </Accordion>
</AccordionGroup>

### Inspecter

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspecter affiche l’identité, l’état de chargement, la source, les capacités du manifeste, les indicateurs de politique, les diagnostics, les métadonnées d’installation, les capacités de bundle et tout support de serveur MCP ou LSP détecté, sans importer le runtime du plugin par défaut. Ajoutez `--runtime` pour charger le module du plugin et inclure les hooks, outils, commandes, services, méthodes de Gateway et routes HTTP enregistrés. L’inspection runtime signale directement les dépendances de plugin manquantes ; les installations et réparations restent dans `openclaw plugins install`, `openclaw plugins update` et `openclaw doctor --fix`.

Les commandes CLI possédées par les plugins sont généralement installées comme groupes de commandes racine `openclaw`, mais les plugins peuvent aussi enregistrer des commandes imbriquées sous un parent central tel que `openclaw nodes`. Une fois que `inspect --runtime` affiche une commande sous `cliCommands`, exécutez-la au chemin indiqué ; par exemple, un plugin qui enregistre `demo-git` peut être vérifié avec `openclaw demo-git ping`.

Chaque plugin est classé selon ce qu’il enregistre réellement au runtime :

- **plain-capability** — un type de capacité (p. ex. un Plugin fournisseur uniquement)
- **hybrid-capability** — plusieurs types de capacités (p. ex. texte + voix + images)
- **hook-only** — uniquement des hooks, aucune capacité ni surface
- **non-capability** — outils/commandes/services, mais aucune capacité

Voir [Formes de Plugin](/fr/plugins/architecture#plugin-shapes) pour en savoir plus sur le modèle de capacités.

<Note>
L’indicateur `--json` produit un rapport lisible par machine adapté aux scripts et aux audits. `inspect --all` affiche un tableau couvrant toute la flotte avec des colonnes pour la forme, les types de capacités, les avis de compatibilité, les capacités du bundle et le résumé des hooks. `info` est un alias de `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` signale les erreurs de chargement des Plugins, les diagnostics de manifeste/découverte et les avis de compatibilité. Lorsque tout est correct, il affiche `No plugin issues detected.`

Si un Plugin configuré est présent sur le disque, mais bloqué par les contrôles de sûreté des chemins du chargeur, la validation de la configuration conserve l’entrée du Plugin et la signale comme `present but blocked`. Corrigez le diagnostic de Plugin bloqué précédent, comme la propriété du chemin ou des permissions en écriture pour tous, au lieu de supprimer la configuration `plugins.entries.<id>` ou `plugins.allow`.

Pour les échecs de forme de module, comme des exports `register`/`activate` manquants, relancez avec `OPENCLAW_PLUGIN_LOAD_DEBUG=1` pour inclure un résumé compact de la forme des exports dans la sortie de diagnostic.

### Registre

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Le registre local des Plugins est le modèle de lecture à froid persistant d’OpenClaw pour l’identité des Plugins installés, leur activation, les métadonnées de source et la propriété des contributions. Le démarrage normal, la recherche du propriétaire du fournisseur, la classification de la configuration des canaux et l’inventaire des Plugins peuvent le lire sans importer les modules d’exécution des Plugins.

Utilisez `plugins registry` pour vérifier si le registre persistant est présent, à jour ou obsolète. Utilisez `--refresh` pour le reconstruire à partir de l’index persistant des Plugins, de la politique de configuration et des métadonnées de manifeste/package. Il s’agit d’un chemin de réparation, pas d’un chemin d’activation à l’exécution.

`openclaw doctor --fix` répare aussi la dérive npm gérée adjacente au registre : si un package `@openclaw/*` orphelin ou récupéré sous la racine npm des Plugins gérés masque un Plugin intégré, doctor supprime ce package obsolète et reconstruit le registre afin que le démarrage valide le manifeste intégré.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` est un commutateur de compatibilité d’urgence obsolète pour les échecs de lecture du registre. Préférez `plugins registry --refresh` ou `openclaw doctor --fix` ; le repli par variable d’environnement sert uniquement à la récupération d’urgence du démarrage pendant le déploiement de la migration.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

La liste Marketplace accepte un chemin de marketplace local, un chemin `marketplace.json`, un raccourci GitHub comme `owner/repo`, une URL de dépôt GitHub ou une URL git. `--json` affiche le libellé de source résolu ainsi que le manifeste marketplace analysé et les entrées de Plugins.

## Associé

- [Créer des Plugins](/fr/plugins/building-plugins)
- [Référence CLI](/fr/cli)
- [Plugins communautaires](/fr/plugins/community)
