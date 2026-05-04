---
read_when:
    - Vous voulez installer ou gérer des plugins Gateway ou des bundles compatibles
    - Vous voulez déboguer les échecs de chargement des Plugins
sidebarTitle: Plugins
summary: Référence CLI pour `openclaw plugins` (liste, installation, place de marché, désinstallation, activation/désactivation, diagnostic)
title: Plugins
x-i18n:
    generated_at: "2026-05-04T07:03:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 36ae7edb12986ead7e126f25e0761bf312b2644b35017181b674082105886776
    source_path: cli/plugins.md
    workflow: 16
---

Gérer les plugins Gateway, les packs de hooks et les bundles compatibles.

<CardGroup cols={2}>
  <Card title="Système de Plugin" href="/fr/tools/plugin">
    Guide utilisateur pour installer, activer et dépanner les plugins.
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

Pour examiner une installation, une inspection, une désinstallation ou une actualisation de registre lente, exécutez la commande avec `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. La trace écrit les durées des phases dans stderr et conserve une sortie JSON analysable. Consultez [Débogage](/fr/help/debugging#plugin-lifecycle-trace).

<Note>
Les plugins groupés sont livrés avec OpenClaw. Certains sont activés par défaut (par exemple les fournisseurs de modèles groupés, les fournisseurs de synthèse vocale groupés et le plugin de navigateur groupé) ; d’autres nécessitent `plugins enable`.

Les plugins OpenClaw natifs doivent livrer `openclaw.plugin.json` avec un schéma JSON en ligne (`configSchema`, même vide). Les bundles compatibles utilisent plutôt leurs propres manifestes de bundle.

`plugins list` affiche `Format: openclaw` ou `Format: bundle`. La sortie détaillée de list/info affiche aussi le sous-type du bundle (`codex`, `claude` ou `cursor`) ainsi que les capacités de bundle détectées.
</Note>

### Installer

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # npm by default
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
Les noms de packages nus s’installent depuis npm par défaut pendant la transition de lancement. Utilisez `clawhub:<package>` pour ClawHub. Traitez les installations de plugins comme l’exécution de code. Préférez les versions épinglées.
</Warning>

`plugins search` interroge ClawHub pour trouver des packages de plugins installables et affiche des noms de packages prêts à installer. La recherche porte sur les packages de plugins de code et de plugins de bundle, pas sur les Skills. Utilisez `openclaw skills search` pour les Skills ClawHub.

<Note>
ClawHub est la principale surface de distribution et de découverte pour la plupart des plugins. Npm reste une solution de repli prise en charge et un chemin d’installation directe. Les packages de plugins `@openclaw/*` appartenant à OpenClaw sont de nouveau publiés sur npm ; consultez la liste actuelle sur [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) ou l’[inventaire des plugins](/fr/plugins/plugin-inventory). Les installations stables utilisent `latest`. Les installations et mises à jour du canal bêta privilégient le dist-tag npm `beta` lorsque cette étiquette est disponible, puis se rabattent sur `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Inclus de configuration et réparation des configurations invalides">
    Si votre section `plugins` repose sur un `$include` à fichier unique, `plugins install/update/enable/disable/uninstall` écrit dans ce fichier inclus et laisse `openclaw.json` intact. Les inclus racine, les tableaux d’inclus et les inclus avec remplacements voisins échouent de manière fermée au lieu d’être aplatis. Consultez [Inclus de configuration](/fr/gateway/configuration) pour les formes prises en charge.

    Si la configuration est invalide pendant l’installation, `plugins install` échoue normalement de manière fermée et vous indique d’exécuter d’abord `openclaw doctor --fix`. Pendant le démarrage du Gateway et le rechargement à chaud, une configuration de plugin invalide échoue de manière fermée comme toute autre configuration invalide ; `openclaw doctor --fix` peut mettre en quarantaine l’entrée de plugin invalide. La seule exception documentée au moment de l’installation est un chemin de récupération étroit pour plugin groupé destiné aux plugins qui optent explicitement pour `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force et réinstallation ou mise à jour">
    `--force` réutilise la cible d’installation existante et écrase sur place un plugin ou un pack de hooks déjà installé. Utilisez-le lorsque vous réinstallez intentionnellement le même identifiant depuis un nouveau chemin local, une archive, un package ClawHub ou un artefact npm. Pour les mises à niveau courantes d’un plugin npm déjà suivi, préférez `openclaw plugins update <id-or-npm-spec>`.

    Si vous exécutez `plugins install` pour un identifiant de plugin déjà installé, OpenClaw s’arrête et vous renvoie vers `plugins update <id-or-npm-spec>` pour une mise à niveau normale, ou vers `plugins install <package> --force` lorsque vous voulez réellement écraser l’installation actuelle depuis une autre source.

  </Accordion>
  <Accordion title="Portée de --pin">
    `--pin` s’applique uniquement aux installations npm. Il n’est pas pris en charge avec les installations `git:` ; utilisez une référence git explicite telle que `git:github.com/acme/plugin@v1.2.3` lorsque vous voulez une source épinglée. Il n’est pas pris en charge avec `--marketplace`, car les installations marketplace conservent les métadonnées de source marketplace au lieu d’une spécification npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` est une option d’urgence pour les faux positifs du scanner de code dangereux intégré. Elle permet à l’installation de continuer même lorsque le scanner intégré signale des résultats `critical`, mais elle ne contourne **pas** les blocages de politique du hook `before_install` du plugin et ne contourne **pas** les échecs d’analyse.

    Cet indicateur CLI s’applique aux flux d’installation/mise à jour de plugins. Les installations de dépendances de Skills adossées au Gateway utilisent le remplacement de requête correspondant `dangerouslyForceUnsafeInstall`, tandis que `openclaw skills install` reste un flux séparé de téléchargement/installation de Skills ClawHub.

    Si un plugin que vous avez publié sur ClawHub est bloqué par une analyse de registre, utilisez les étapes éditeur dans [ClawHub](/fr/tools/clawhub).

  </Accordion>
  <Accordion title="Packs de hooks et spécifications npm">
    `plugins install` est aussi la surface d’installation pour les packs de hooks qui exposent `openclaw.hooks` dans `package.json`. Utilisez `openclaw hooks` pour une visibilité filtrée des hooks et l’activation par hook, pas pour l’installation de packages.

    Les spécifications npm sont **réservées au registre** (nom de package + **version exacte** facultative ou **dist-tag**). Les spécifications Git/URL/fichier et les plages semver sont rejetées. Les installations de dépendances s’exécutent localement au projet avec `--ignore-scripts` pour la sécurité, même lorsque votre shell dispose de paramètres d’installation npm globaux.

    Utilisez `npm:<package>` lorsque vous voulez rendre la résolution npm explicite. Les spécifications de package nues s’installent aussi directement depuis npm pendant la transition de lancement.

    Les spécifications nues et `@latest` restent sur la piste stable. Les versions correctives OpenClaw datées telles que `2026.5.3-1` sont des versions stables pour cette vérification. Si npm résout l’une d’elles en préversion, OpenClaw s’arrête et vous demande d’opter explicitement pour une étiquette de préversion telle que `@beta`/`@rc` ou pour une version de préversion exacte telle que `@1.2.3-beta.4`.

    Si une spécification d’installation nue correspond à un identifiant de plugin officiel (par exemple `diffs`), OpenClaw installe directement l’entrée du catalogue. Pour installer un package npm portant le même nom, utilisez une spécification à portée explicite (par exemple `@scope/diffs`).

  </Accordion>
  <Accordion title="Dépôts Git">
    Utilisez `git:<repo>` pour installer directement depuis un dépôt git. Les formes prises en charge incluent `git:github.com/owner/repo`, `git:owner/repo`, les URL de clonage complètes `https://`, `ssh://`, `git://`, `file://` et `git@host:owner/repo.git`. Ajoutez `@<ref>` ou `#<ref>` pour extraire une branche, une étiquette ou un commit avant l’installation.

    Les installations Git clonent dans un répertoire temporaire, extraient la référence demandée lorsqu’elle est présente, puis utilisent l’installateur de répertoire de plugin normal. Cela signifie que la validation du manifeste, l’analyse de code dangereux, le travail d’installation du gestionnaire de packages et les enregistrements d’installation se comportent comme pour les installations npm. Les installations git enregistrées incluent l’URL/la référence source plus le commit résolu afin que `openclaw plugins update` puisse résoudre de nouveau la source ultérieurement.

    Après une installation depuis git, utilisez `openclaw plugins inspect <id> --runtime --json` pour vérifier les enregistrements runtime tels que les méthodes Gateway et les commandes CLI. Si le plugin a enregistré une racine CLI avec `api.registerCli`, exécutez cette commande directement via la CLI racine OpenClaw, par exemple `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    Archives prises en charge : `.zip`, `.tgz`, `.tar.gz`, `.tar`. Les archives de plugins OpenClaw natifs doivent contenir un `openclaw.plugin.json` valide à la racine du plugin extrait ; les archives qui ne contiennent que `package.json` sont rejetées avant qu’OpenClaw n’écrive les enregistrements d’installation.

    Les installations marketplace Claude sont également prises en charge.

  </Accordion>
</AccordionGroup>

Les installations ClawHub utilisent un localisateur explicite `clawhub:<package>` :

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Les spécifications de plugins nues compatibles npm s’installent depuis npm par défaut pendant la transition de lancement :

```bash
openclaw plugins install openclaw-codex-app-server
```

Utilisez `npm:` pour rendre explicite la résolution limitée à npm :

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw vérifie la compatibilité annoncée de l’API de plugin / Gateway minimal avant l’installation. Lorsque la version ClawHub sélectionnée publie un artefact ClawPack, OpenClaw télécharge le `.tgz` versionné du npm-pack, vérifie l’en-tête de condensat ClawHub et le condensat de l’artefact, puis l’installe via le chemin d’archive normal. Les anciennes versions ClawHub sans métadonnées ClawPack s’installent toujours via l’ancien chemin de vérification d’archive de package. Les installations enregistrées conservent leurs métadonnées de source ClawHub, le type d’artefact, l’intégrité npm, le shasum npm, le nom du tarball et les informations de condensat ClawPack pour les mises à jour ultérieures.
Les installations ClawHub sans version conservent une spécification enregistrée sans version afin que `openclaw plugins update` puisse suivre les versions ClawHub plus récentes ; les sélecteurs explicites de version ou d’étiquette tels que `clawhub:pkg@1.2.3` et `clawhub:pkg@beta` restent épinglés à ce sélecteur.

#### Raccourci marketplace

Utilisez le raccourci `plugin@marketplace` lorsque le nom de marketplace existe dans le cache de registre local de Claude à `~/.claude/plugins/known_marketplaces.json` :

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
  <Tab title="Sources de place de marché">
    - un nom de place de marché Claude connu depuis `~/.claude/plugins/known_marketplaces.json`
    - une racine de place de marché locale ou un chemin `marketplace.json`
    - un raccourci de dépôt GitHub tel que `owner/repo`
    - une URL de dépôt GitHub telle que `https://github.com/owner/repo`
    - une URL git

  </Tab>
  <Tab title="Règles des places de marché distantes">
    Pour les places de marché distantes chargées depuis GitHub ou git, les entrées de plugin doivent rester dans le dépôt de place de marché cloné. OpenClaw accepte les sources avec chemin relatif depuis ce dépôt et rejette les sources de plugin HTTP(S), avec chemin absolu, git, GitHub et autres sources de plugin qui ne sont pas des chemins depuis les manifestes distants.
  </Tab>
</Tabs>

Pour les chemins locaux et les archives, OpenClaw détecte automatiquement :

- les plugins OpenClaw natifs (`openclaw.plugin.json`)
- les bundles compatibles avec Codex (`.codex-plugin/plugin.json`)
- les bundles compatibles avec Claude (`.claude-plugin/plugin.json` ou la disposition de composants Claude par défaut)
- les bundles compatibles avec Cursor (`.cursor-plugin/plugin.json`)

<Note>
Les bundles compatibles s’installent dans la racine normale des plugins et participent au même flux list/info/enable/disable. Aujourd’hui, les skills de bundle, les command-skills Claude, les valeurs par défaut Claude `settings.json`, les valeurs par défaut Claude `.lsp.json` / `lspServers` déclarées dans le manifeste, les command-skills Cursor et les répertoires de hooks Codex compatibles sont pris en charge ; les autres capacités de bundle détectées sont affichées dans les diagnostics/info, mais ne sont pas encore connectées à l’exécution runtime.
</Note>

### Liste

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
  Affiche uniquement les plugins activés.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Passe de la vue tableau à des lignes de détail par plugin avec les métadonnées de source/origine/version/activation.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventaire lisible par machine avec diagnostics du registre et état d’installation des dépendances de package.
</ParamField>

<Note>
`plugins list` lit d’abord le registre de plugins local persistant, avec un repli dérivé uniquement du manifeste lorsque le registre est manquant ou invalide. Cette commande est utile pour vérifier si un plugin est installé, activé et visible par la planification du démarrage à froid, mais ce n’est pas une sonde runtime en direct d’un processus Gateway déjà en cours d’exécution. Après avoir modifié le code d’un plugin, son activation, la politique de hooks ou `plugins.load.paths`, redémarrez le Gateway qui sert le canal avant de vous attendre à ce que le nouveau code `register(api)` ou les hooks s’exécutent. Pour les déploiements distants/conteneurisés, vérifiez que vous redémarrez bien l’enfant `openclaw gateway run` réel, et pas seulement un processus wrapper.

`plugins list --json` inclut le `dependencyStatus` de chaque plugin depuis les
`dependencies` et `optionalDependencies` de `package.json`. OpenClaw vérifie si ces noms de package
sont présents le long du chemin de recherche Node `node_modules` normal du plugin ; il
n’importe pas le code runtime du plugin, n’exécute pas de gestionnaire de packages et ne répare pas les
dépendances manquantes.
</Note>

`plugins search` est une recherche distante dans le catalogue ClawHub. Cette commande n’inspecte pas l’état
local, ne modifie pas la configuration, n’installe pas de packages et ne charge pas le code runtime du plugin. Les
résultats de recherche incluent le nom du package ClawHub, la famille, le canal, la version, le résumé et
une indication d’installation telle que `openclaw plugins install clawhub:<package>`.

Pour travailler sur un plugin groupé dans une image Docker packagée, montez en bind le répertoire source
du plugin par-dessus le chemin source packagé correspondant, par exemple
`/app/extensions/synology-chat`. OpenClaw découvrira cette surcouche source montée
avant `/app/dist/extensions/synology-chat` ; un répertoire source simplement copié
reste inerte afin que les installations packagées normales utilisent toujours le dist compilé.

Pour le débogage des hooks runtime :

- `openclaw plugins inspect <id> --runtime --json` affiche les hooks enregistrés et les diagnostics issus d’une passe d’inspection avec module chargé. L’inspection runtime n’installe jamais de dépendances ; utilisez `openclaw doctor --fix` pour nettoyer l’état des dépendances héritées ou installer les plugins téléchargeables configurés manquants.
- `openclaw gateway status --deep --require-rpc` confirme le Gateway joignable, les indications de service/processus, le chemin de configuration et l’état RPC.
- Les hooks de conversation non groupés (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) nécessitent `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Utilisez `--link` pour éviter de copier un répertoire local (ajoute à `plugins.load.paths`) :

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` n’est pas pris en charge avec `--link`, car les installations liées réutilisent le chemin source au lieu de copier par-dessus une cible d’installation gérée.

Utilisez `--pin` sur les installations npm pour enregistrer la spécification exacte résolue (`name@version`) dans l’index des plugins gérés, tout en conservant le comportement par défaut non épinglé.
</Note>

### Index des Plugins

Les métadonnées d’installation de Plugin sont un état géré par machine, pas une configuration utilisateur. Les installations et mises à jour les écrivent dans `plugins/installs.json` sous le répertoire d’état OpenClaw actif. Sa carte de premier niveau `installRecords` est la source durable des métadonnées d’installation, y compris les enregistrements pour les manifestes de plugin cassés ou manquants. Le tableau `plugins` est le cache de registre à froid dérivé du manifeste. Le fichier inclut un avertissement de ne pas modifier et est utilisé par `openclaw plugins update`, la désinstallation, les diagnostics et le registre de plugins à froid.

Quand OpenClaw voit des enregistrements hérités livrés `plugins.installs` dans la configuration, il les déplace dans l’index des plugins et supprime la clé de configuration ; si l’une des écritures échoue, les enregistrements de configuration sont conservés afin que les métadonnées d’installation ne soient pas perdues.

### Désinstallation

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` supprime les enregistrements de plugin de `plugins.entries`, de l’index de plugins persistant, des entrées de listes allow/deny de plugin et des entrées liées `plugins.load.paths` lorsque cela s’applique. Sauf si `--keep-files` est défini, la désinstallation supprime aussi le répertoire d’installation géré suivi lorsqu’il se trouve dans la racine des extensions de plugins d’OpenClaw. Pour les plugins de mémoire active, l’emplacement mémoire est réinitialisé à `memory-core`.

<Note>
`--keep-config` est pris en charge comme alias obsolète de `--keep-files`.
</Note>

### Mise à jour

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Les mises à jour s’appliquent aux installations de plugins suivies dans l’index des plugins gérés et aux installations de packs de hooks suivies dans `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Résolution entre identifiant de plugin et spécification npm">
    Lorsque vous passez un identifiant de plugin, OpenClaw réutilise la spécification d’installation enregistrée pour ce plugin. Cela signifie que les dist-tags précédemment stockés comme `@beta` et les versions exactes épinglées continuent d’être utilisés lors des exécutions ultérieures de `update <id>`.

    Pour les installations npm, vous pouvez aussi passer une spécification de package npm explicite avec un dist-tag ou une version exacte. OpenClaw résout ce nom de package vers l’enregistrement de plugin suivi, met à jour ce plugin installé et enregistre la nouvelle spécification npm pour les futures mises à jour basées sur l’identifiant.

    Passer le nom du package npm sans version ni tag se résout aussi vers l’enregistrement de plugin suivi. Utilisez cette option lorsqu’un plugin était épinglé à une version exacte et que vous voulez le ramener vers la ligne de publication par défaut du registre.

  </Accordion>
  <Accordion title="Mises à jour du canal bêta">
    `openclaw plugins update` réutilise la spécification de plugin suivie sauf si vous passez une nouvelle spécification. `openclaw update` connaît en plus le canal de mise à jour OpenClaw actif : sur le canal bêta, les enregistrements de plugins npm et ClawHub sur la ligne par défaut essaient d’abord `@beta`, puis se replient sur la spécification default/latest enregistrée si aucune publication bêta de plugin n’existe. Les versions exactes et les tags explicites restent épinglés à ce sélecteur.

  </Accordion>
  <Accordion title="Vérifications de version et dérive d’intégrité">
    Avant une mise à jour npm en direct, OpenClaw vérifie la version du package installé par rapport aux métadonnées du registre npm. Si la version installée et l’identité d’artefact enregistrée correspondent déjà à la cible résolue, la mise à jour est ignorée sans téléchargement, réinstallation ni réécriture de `openclaw.json`.

    Lorsqu’un hachage d’intégrité stocké existe et que le hachage de l’artefact récupéré change, OpenClaw traite cela comme une dérive d’artefact npm. La commande interactive `openclaw plugins update` affiche les hachages attendu et réel et demande confirmation avant de continuer. Les assistants de mise à jour non interactifs échouent fermés sauf si l’appelant fournit une politique de continuation explicite.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install lors de la mise à jour">
    `--dangerously-force-unsafe-install` est aussi disponible sur `plugins update` comme dérogation de dernier recours pour les faux positifs de l’analyse de code dangereux intégrée pendant les mises à jour de plugins. Cette option ne contourne toujours pas les blocages de politique `before_install` du plugin ni le blocage sur échec d’analyse, et elle ne s’applique qu’aux mises à jour de plugins, pas aux mises à jour de packs de hooks.
  </Accordion>
</AccordionGroup>

### Inspection

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect affiche l’identité, l’état de chargement, la source, les capacités du manifeste, les indicateurs de politique, les diagnostics, les métadonnées d’installation, les capacités de bundle et toute prise en charge détectée de serveur MCP ou LSP sans importer le runtime du plugin par défaut. Ajoutez `--runtime` pour charger le module du plugin et inclure les hooks, outils, commandes, services, méthodes Gateway et routes HTTP enregistrés. L’inspection runtime signale directement les dépendances de plugin manquantes ; les installations et réparations restent dans `openclaw plugins install`, `openclaw plugins update` et `openclaw doctor --fix`.

Les commandes CLI détenues par des plugins sont installées comme groupes de commandes racine `openclaw`. Après que `inspect --runtime` affiche une commande sous `cliCommands`, exécutez-la sous la forme `openclaw <command> ...` ; par exemple, un plugin qui enregistre `demo-git` peut être vérifié avec `openclaw demo-git ping`.

Chaque plugin est classé selon ce qu’il enregistre réellement au runtime :

- **plain-capability** — un type de capacité (p. ex. un plugin seulement provider)
- **hybrid-capability** — plusieurs types de capacités (p. ex. texte + parole + images)
- **hook-only** — uniquement des hooks, aucune capacité ni surface
- **non-capability** — outils/commandes/services mais aucune capacité

Consultez [Formes de Plugin](/fr/plugins/architecture#plugin-shapes) pour en savoir plus sur le modèle de capacités.

<Note>
L’indicateur `--json` génère un rapport lisible par machine adapté aux scripts et aux audits. `inspect --all` affiche un tableau couvrant toute la flotte avec des colonnes pour la forme, les types de capacités, les avis de compatibilité, les capacités de bundle et le résumé des hooks. `info` est un alias de `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` signale les erreurs de chargement de plugin, les diagnostics de manifeste/découverte et les avis de compatibilité. Lorsque tout est propre, il affiche `No plugin issues detected.`

Si un plugin configuré est présent sur disque mais bloqué par les vérifications de sécurité de chemin du chargeur, la validation de configuration conserve l’entrée du plugin et la signale comme `present but blocked`. Corrigez le diagnostic de plugin bloqué précédent, par exemple la propriété du chemin ou les permissions world-writable, au lieu de supprimer la configuration `plugins.entries.<id>` ou `plugins.allow`.

Pour les échecs de forme de module comme des exports `register`/`activate` manquants, relancez avec `OPENCLAW_PLUGIN_LOAD_DEBUG=1` pour inclure un résumé compact de la forme des exports dans la sortie de diagnostic.

### Registre

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Le registre de plugins local est le modèle de lecture à froid persistant d’OpenClaw pour l’identité des plugins installés, leur activation, les métadonnées de source et la propriété des contributions. Le démarrage normal, la recherche du propriétaire du provider, la classification de configuration de canal et l’inventaire des plugins peuvent le lire sans importer les modules runtime des plugins.

Utilisez `plugins registry` pour vérifier si le registre persistant est présent, à jour ou obsolète. Utilisez `--refresh` pour le reconstruire à partir de l’index persistant des plugins, de la politique de configuration et des métadonnées de manifeste/package. C’est un chemin de réparation, pas un chemin d’activation à l’exécution.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` est un interrupteur de compatibilité d’urgence obsolète pour les échecs de lecture du registre. Préférez `plugins registry --refresh` ou `openclaw doctor --fix` ; le repli par variable d’environnement est réservé à la récupération d’urgence au démarrage pendant le déploiement de la migration.
</Warning>

### Place de marché

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

La liste de la place de marché accepte un chemin local de place de marché, un chemin `marketplace.json`, un raccourci GitHub comme `owner/repo`, une URL de dépôt GitHub ou une URL git. `--json` affiche le libellé de source résolu ainsi que le manifeste de place de marché analysé et les entrées de plugins.

## Connexe

- [Créer des plugins](/fr/plugins/building-plugins)
- [Référence de la CLI](/fr/cli)
- [Plugins de la communauté](/fr/plugins/community)
