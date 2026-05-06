---
read_when:
    - Vous souhaitez installer ou gérer des plugins Gateway ou des bundles compatibles
    - Vous voulez déboguer les échecs de chargement de Plugin
sidebarTitle: Plugins
summary: Référence CLI pour `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-06T17:54:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 734366b6bbee5f036fdc2cfac5197ae86d2e8fbc7c977ccc4e22add2f4206951
    source_path: cli/plugins.md
    workflow: 16
---

Gérer les plugins du Gateway, les packs de hooks et les bundles compatibles.

<CardGroup cols={2}>
  <Card title="Système de Plugin" href="/fr/tools/plugin">
    Guide utilisateur pour installer, activer et dépanner les plugins.
  </Card>
  <Card title="Gérer les plugins" href="/fr/plugins/manage-plugins">
    Exemples rapides pour l’installation, la liste, la mise à jour, la désinstallation et la publication.
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

Pour étudier une installation, une inspection, une désinstallation ou un rafraîchissement de registre lent, exécutez la
commande avec `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. La trace écrit les durées des phases
sur stderr et garde la sortie JSON analysable. Consultez [Débogage](/fr/help/debugging#plugin-lifecycle-trace).

<Note>
En mode Nix (`OPENCLAW_NIX_MODE=1`), les mutateurs de cycle de vie des plugins sont désactivés. Utilisez la source Nix pour cette installation au lieu de `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` ou `plugins disable` ; pour nix-openclaw, utilisez le [Démarrage rapide](https://github.com/openclaw/nix-openclaw#quick-start) centré sur l’agent.
</Note>

<Note>
Les plugins groupés sont fournis avec OpenClaw. Certains sont activés par défaut (par exemple les fournisseurs de modèles groupés, les fournisseurs de voix groupés et le plugin de navigateur groupé) ; d’autres nécessitent `plugins enable`.

Les plugins OpenClaw natifs doivent fournir `openclaw.plugin.json` avec un schéma JSON intégré (`configSchema`, même vide). Les bundles compatibles utilisent plutôt leurs propres manifestes de bundle.

`plugins list` affiche `Format: openclaw` ou `Format: bundle`. La sortie détaillée list/info affiche aussi le sous-type de bundle (`codex`, `claude` ou `cursor`) ainsi que les capacités de bundle détectées.
</Note>

### Installation

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

`plugins search` interroge ClawHub pour trouver des paquets de plugins installables et affiche
des noms de paquets prêts à être installés. La recherche porte sur les paquets code-plugin et bundle-plugin,
pas sur les skills. Utilisez `openclaw skills search` pour les skills ClawHub.

<Note>
ClawHub est la surface principale de distribution et de découverte pour la plupart des plugins. Npm
reste une solution de repli prise en charge et un chemin d’installation directe. Les paquets de plugins
`@openclaw/*` appartenant à OpenClaw sont de nouveau publiés sur npm ; consultez la liste actuelle
sur [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) ou
[l’inventaire des plugins](/fr/plugins/plugin-inventory). Les installations stables utilisent `latest`.
Les installations et mises à jour du canal bêta préfèrent le dist-tag npm `beta` lorsque ce tag
est disponible, puis se replient sur `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Includes de configuration et réparation de configuration invalide">
    Si votre section `plugins` s’appuie sur un `$include` à fichier unique, `plugins install/update/enable/disable/uninstall` écrit dans ce fichier inclus et laisse `openclaw.json` intact. Les includes racine, les tableaux d’includes et les includes avec des surcharges sœurs échouent de manière fermée au lieu d’être aplatis. Consultez [Includes de configuration](/fr/gateway/configuration) pour les formes prises en charge.

    Si la configuration est invalide pendant l’installation, `plugins install` échoue normalement de manière fermée et vous demande d’exécuter d’abord `openclaw doctor --fix`. Pendant le démarrage du Gateway et le rechargement à chaud, une configuration de plugin invalide échoue de manière fermée comme toute autre configuration invalide ; `openclaw doctor --fix` peut mettre en quarantaine l’entrée de plugin invalide. La seule exception documentée au moment de l’installation est un chemin de récupération étroit pour les plugins groupés qui optent explicitement pour `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force et réinstallation contre mise à jour">
    `--force` réutilise la cible d’installation existante et remplace sur place un plugin ou un pack de hooks déjà installé. Utilisez-le lorsque vous réinstallez intentionnellement le même id depuis un nouveau chemin local, une archive, un paquet ClawHub ou un artefact npm. Pour les mises à niveau courantes d’un plugin npm déjà suivi, préférez `openclaw plugins update <id-or-npm-spec>`.

    Si vous exécutez `plugins install` pour un id de plugin déjà installé, OpenClaw s’arrête et vous oriente vers `plugins update <id-or-npm-spec>` pour une mise à niveau normale, ou vers `plugins install <package> --force` lorsque vous voulez réellement remplacer l’installation actuelle depuis une autre source.

  </Accordion>
  <Accordion title="Portée de --pin">
    `--pin` s’applique uniquement aux installations npm. Il n’est pas pris en charge avec les installations `git:` ; utilisez une ref git explicite comme `git:github.com/acme/plugin@v1.2.3` lorsque vous voulez une source épinglée. Il n’est pas pris en charge avec `--marketplace`, car les installations marketplace conservent les métadonnées de source marketplace au lieu d’une spec npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` est une option d’urgence pour les faux positifs du scanner de code dangereux intégré. Elle permet à l’installation de continuer même lorsque le scanner intégré signale des constats `critical`, mais elle ne contourne **pas** les blocages de politique des hooks `before_install` du plugin et ne contourne **pas** les échecs d’analyse.

    Ce flag CLI s’applique aux flux d’installation/mise à jour de plugins. Les installations de dépendances de skills adossées au Gateway utilisent la substitution de requête correspondante `dangerouslyForceUnsafeInstall`, tandis que `openclaw skills install` reste un flux distinct de téléchargement/installation de skill ClawHub.

    Si un plugin que vous avez publié sur ClawHub est bloqué par une analyse du registre, utilisez les étapes éditeur dans [ClawHub](/fr/tools/clawhub).

  </Accordion>
  <Accordion title="Packs de hooks et specs npm">
    `plugins install` est aussi la surface d’installation des packs de hooks qui exposent `openclaw.hooks` dans `package.json`. Utilisez `openclaw hooks` pour une visibilité filtrée des hooks et l’activation par hook, pas pour l’installation de paquets.

    Les specs npm sont **réservées au registre** (nom de paquet + **version exacte** ou **dist-tag** facultatif). Les specs Git/URL/fichier et les plages semver sont rejetées. Les installations de dépendances s’exécutent localement au projet avec `--ignore-scripts` pour la sécurité, même lorsque votre shell dispose de paramètres globaux d’installation npm. Les racines npm de plugins gérées héritent des `overrides` npm au niveau paquet d’OpenClaw, de sorte que les épingles de sécurité hôte s’appliquent aussi aux dépendances de plugins hissées.

    Utilisez `npm:<package>` lorsque vous voulez rendre la résolution npm explicite. Les specs de paquet nues s’installent aussi directement depuis npm pendant la transition de lancement.

    Les specs nues et `@latest` restent sur la piste stable. Les versions de correction datées d’OpenClaw comme `2026.5.3-1` sont des versions stables pour cette vérification. Si npm résout l’un de ces éléments vers une préversion, OpenClaw s’arrête et vous demande d’opter explicitement avec un tag de préversion comme `@beta`/`@rc` ou une version de préversion exacte comme `@1.2.3-beta.4`.

    Si une spec d’installation nue correspond à un id de plugin officiel (par exemple `diffs`), OpenClaw installe directement l’entrée du catalogue. Pour installer un paquet npm portant le même nom, utilisez une spec scoped explicite (par exemple `@scope/diffs`).

  </Accordion>
  <Accordion title="Dépôts Git">
    Utilisez `git:<repo>` pour installer directement depuis un dépôt git. Les formes prises en charge incluent les URL de clone `git:github.com/owner/repo`, `git:owner/repo`, `https://` complète, `ssh://`, `git://`, `file://` et `git@host:owner/repo.git`. Ajoutez `@<ref>` ou `#<ref>` pour extraire une branche, un tag ou un commit avant l’installation.

    Les installations git clonent dans un répertoire temporaire, extraient la ref demandée lorsqu’elle est présente, puis utilisent l’installateur normal de répertoire de plugin. Cela signifie que la validation du manifeste, l’analyse de code dangereux, le travail d’installation du gestionnaire de paquets et les enregistrements d’installation se comportent comme pour les installations npm. Les installations git enregistrées incluent l’URL/ref source ainsi que le commit résolu, afin que `openclaw plugins update` puisse résoudre de nouveau la source plus tard.

    Après une installation depuis git, utilisez `openclaw plugins inspect <id> --runtime --json` pour vérifier les enregistrements runtime comme les méthodes gateway et les commandes CLI. Si le plugin a enregistré une racine CLI avec `api.registerCli`, exécutez cette commande directement via la CLI racine d’OpenClaw, par exemple `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    Archives prises en charge : `.zip`, `.tgz`, `.tar.gz`, `.tar`. Les archives de plugins OpenClaw natifs doivent contenir un `openclaw.plugin.json` valide à la racine du plugin extrait ; les archives qui contiennent seulement `package.json` sont rejetées avant qu’OpenClaw n’écrive les enregistrements d’installation.

    Utilisez `npm-pack:<path.tgz>` lorsque le fichier est une archive tar npm-pack et que vous voulez
    tester le même chemin d’installation de racine npm gérée que celui utilisé par les installations depuis le registre,
    notamment la vérification de `package-lock.json`, l’analyse des dépendances hissées et
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

Les specs de plugin nues compatibles npm s’installent depuis npm par défaut pendant la transition de lancement :

```bash
openclaw plugins install openclaw-codex-app-server
```

Utilisez `npm:` pour rendre explicite la résolution npm uniquement :

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw vérifie l’API de Plugin annoncée / la compatibilité minimale avec le Gateway avant l’installation. Lorsque la version ClawHub sélectionnée publie un artefact ClawPack, OpenClaw télécharge le `.tgz` npm-pack versionné, vérifie l’en-tête de condensat ClawHub et le condensat de l’artefact, puis l’installe via le chemin d’archive normal. Les anciennes versions de ClawHub sans métadonnées ClawPack s’installent toujours via l’ancien chemin de vérification d’archive de paquet. Les installations enregistrées conservent leurs métadonnées de source ClawHub, le type d’artefact, l’intégrité npm, le shasum npm, le nom du tarball et les faits de condensat ClawPack pour les mises à jour ultérieures.
Les installations ClawHub non versionnées conservent une spécification enregistrée non versionnée afin que `openclaw plugins update` puisse suivre les nouvelles versions ClawHub ; les sélecteurs explicites de version ou de tag comme `clawhub:pkg@1.2.3` et `clawhub:pkg@beta` restent épinglés à ce sélecteur.

#### Raccourci de marketplace

Utilisez le raccourci `plugin@marketplace` lorsque le nom de la marketplace existe dans le cache de registre local de Claude à `~/.claude/plugins/known_marketplaces.json` :

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Utilisez `--marketplace` lorsque vous voulez passer explicitement la source de marketplace :

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Sources de marketplace">
    - un nom de marketplace connu de Claude provenant de `~/.claude/plugins/known_marketplaces.json`
    - une racine de marketplace locale ou un chemin `marketplace.json`
    - un raccourci de dépôt GitHub comme `owner/repo`
    - une URL de dépôt GitHub comme `https://github.com/owner/repo`
    - une URL git

  </Tab>
  <Tab title="Règles des marketplaces distantes">
    Pour les marketplaces distantes chargées depuis GitHub ou git, les entrées de Plugin doivent rester à l’intérieur du dépôt de marketplace cloné. OpenClaw accepte les sources de chemins relatifs provenant de ce dépôt et rejette les sources de Plugin HTTP(S), de chemins absolus, git, GitHub et autres sources hors chemin issues de manifestes distants.
  </Tab>
</Tabs>

Pour les chemins et archives locaux, OpenClaw détecte automatiquement :

- les Plugins OpenClaw natifs (`openclaw.plugin.json`)
- les lots compatibles avec Codex (`.codex-plugin/plugin.json`)
- les lots compatibles avec Claude (`.claude-plugin/plugin.json` ou la disposition de composants Claude par défaut)
- les lots compatibles avec Cursor (`.cursor-plugin/plugin.json`)

<Note>
Les lots compatibles s’installent dans la racine normale des Plugins et participent au même flux list/info/enable/disable. Aujourd’hui, les Skills de lot, les Skills de commande Claude, les valeurs par défaut Claude de `settings.json`, les valeurs par défaut Claude `.lsp.json` / `lspServers` déclarées par manifeste, les Skills de commande Cursor et les répertoires de hooks compatibles Codex sont pris en charge ; les autres capacités de lot détectées sont affichées dans les diagnostics/info mais ne sont pas encore connectées à l’exécution au runtime.
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
  Afficher uniquement les Plugins activés.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Passer de la vue en tableau à des lignes de détail par Plugin avec les métadonnées de source/origine/version/activation.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventaire lisible par machine, avec diagnostics de registre et état d’installation des dépendances de paquet.
</ParamField>

<Note>
`plugins list` lit d’abord le registre local persistant des Plugins, avec un repli dérivé uniquement du manifeste lorsque le registre est manquant ou invalide. C’est utile pour vérifier si un Plugin est installé, activé et visible pour la planification du démarrage à froid, mais ce n’est pas une sonde runtime en direct d’un processus Gateway déjà en cours d’exécution. Après avoir modifié le code d’un Plugin, son activation, la stratégie de hooks ou `plugins.load.paths`, redémarrez le Gateway qui sert le canal avant de vous attendre à ce que le nouveau code `register(api)` ou les hooks s’exécutent. Pour les déploiements distants/en conteneur, vérifiez que vous redémarrez bien le vrai processus enfant `openclaw gateway run`, et pas seulement un processus d’enveloppe.

`plugins list --json` inclut le `dependencyStatus` de chaque Plugin provenant des
`dependencies` et `optionalDependencies` de `package.json`. OpenClaw vérifie si ces noms
de paquets sont présents le long du chemin de recherche Node `node_modules` normal du Plugin ; il
n’importe pas le code runtime du Plugin, n’exécute pas de gestionnaire de paquets et ne répare pas les
dépendances manquantes.
</Note>

`plugins search` est une recherche dans le catalogue ClawHub distant. Elle n’inspecte pas l’état
local, ne modifie pas la config, n’installe pas de paquets et ne charge pas le code runtime du Plugin. Les résultats de
recherche incluent le nom de paquet ClawHub, la famille, le canal, la version, le résumé et
une indication d’installation comme `openclaw plugins install clawhub:<package>`.

Pour le travail sur les Plugins groupés dans une image Docker empaquetée, montez par liaison le répertoire
source du Plugin sur le chemin source empaqueté correspondant, comme
`/app/extensions/synology-chat`. OpenClaw découvrira cette surcouche de source montée
avant `/app/dist/extensions/synology-chat` ; un répertoire source simplement copié
reste inerte afin que les installations empaquetées normales utilisent toujours le dist compilé.

Pour déboguer les hooks runtime :

- `openclaw plugins inspect <id> --runtime --json` affiche les hooks enregistrés et les diagnostics issus d’une passe d’inspection avec module chargé. L’inspection runtime n’installe jamais les dépendances ; utilisez `openclaw doctor --fix` pour nettoyer l’état des dépendances héritées ou récupérer les Plugins téléchargeables manquants qui sont référencés par la config.
- `openclaw gateway status --deep --require-rpc` confirme le Gateway joignable, les indices de service/processus, le chemin de config et l’état RPC.
- Les hooks de conversation non groupés (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) nécessitent `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Utilisez `--link` pour éviter de copier un répertoire local (ajoute à `plugins.load.paths`) :

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` n’est pas pris en charge avec `--link` car les installations liées réutilisent le chemin source au lieu de copier par-dessus une cible d’installation gérée.

Utilisez `--pin` sur les installations npm pour enregistrer la spécification exacte résolue (`name@version`) dans l’index de Plugins gérés, tout en conservant le comportement par défaut non épinglé.
</Note>

### Index des Plugins

Les métadonnées d’installation des Plugins sont un état géré par machine, pas une config utilisateur. Les installations et mises à jour les écrivent dans `plugins/installs.json` sous le répertoire d’état OpenClaw actif. Sa map de premier niveau `installRecords` est la source durable des métadonnées d’installation, y compris les enregistrements pour les manifestes de Plugin cassés ou manquants. Le tableau `plugins` est le cache de registre à froid dérivé des manifestes. Le fichier inclut un avertissement de ne pas modifier et est utilisé par `openclaw plugins update`, la désinstallation, les diagnostics et le registre de Plugins à froid.

Lorsque OpenClaw voit des enregistrements hérités `plugins.installs` livrés dans la config, les lectures runtime les traitent comme entrée de compatibilité sans réécrire `openclaw.json`. Les écritures explicites de Plugin et `openclaw doctor --fix` déplacent ces enregistrements dans l’index des Plugins et suppriment la clé de config lorsque les écritures de config sont autorisées ; si l’une des écritures échoue, les enregistrements de config sont conservés afin que les métadonnées d’installation ne soient pas perdues.

### Désinstaller

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` supprime les enregistrements de Plugin de `plugins.entries`, de l’index persistant des Plugins, des entrées de liste d’autorisation/refus de Plugin et des entrées liées `plugins.load.paths` le cas échéant. Sauf si `--keep-files` est défini, la désinstallation supprime aussi le répertoire d’installation gérée suivi lorsqu’il se trouve dans la racine d’extensions de Plugins d’OpenClaw. Pour les Plugins de mémoire active, l’emplacement mémoire est réinitialisé à `memory-core`.

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

Les mises à jour s’appliquent aux installations de Plugin suivies dans l’index de Plugins gérés et aux installations de paquets de hooks suivies dans `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Résolution de l’id de Plugin par rapport à la spécification npm">
    Lorsque vous passez un id de Plugin, OpenClaw réutilise la spécification d’installation enregistrée pour ce Plugin. Cela signifie que les dist-tags stockés précédemment comme `@beta` et les versions exactes épinglées continuent d’être utilisés lors des exécutions ultérieures de `update <id>`.

    Pour les installations npm, vous pouvez aussi passer une spécification explicite de paquet npm avec un dist-tag ou une version exacte. OpenClaw résout ce nom de paquet vers l’enregistrement de Plugin suivi, met à jour ce Plugin installé et enregistre la nouvelle spécification npm pour les futures mises à jour basées sur l’id.

    Passer le nom du paquet npm sans version ni tag résout aussi vers l’enregistrement de Plugin suivi. Utilisez ceci lorsqu’un Plugin était épinglé à une version exacte et que vous voulez le ramener à la ligne de version par défaut du registre.

  </Accordion>
  <Accordion title="Mises à jour du canal bêta">
    `openclaw plugins update` réutilise la spécification de Plugin suivie sauf si vous passez une nouvelle spécification. `openclaw update` connaît en plus le canal de mise à jour OpenClaw actif : sur le canal bêta, les enregistrements de Plugin npm et ClawHub de ligne par défaut essaient d’abord `@beta`, puis se replient sur la spécification par défaut/latest enregistrée si aucune version bêta du Plugin n’existe. Les versions exactes et les tags explicites restent épinglés à ce sélecteur.

  </Accordion>
  <Accordion title="Vérifications de version et dérive d’intégrité">
    Avant une mise à jour npm en direct, OpenClaw vérifie la version du paquet installé par rapport aux métadonnées du registre npm. Si la version installée et l’identité d’artefact enregistrée correspondent déjà à la cible résolue, la mise à jour est ignorée sans téléchargement, réinstallation ni réécriture de `openclaw.json`.

    Lorsqu’un hachage d’intégrité stocké existe et que le hachage de l’artefact récupéré change, OpenClaw traite cela comme une dérive d’artefact npm. La commande interactive `openclaw plugins update` affiche les hachages attendus et réels et demande confirmation avant de poursuivre. Les assistants de mise à jour non interactifs échouent fermés sauf si l’appelant fournit une stratégie explicite de continuation.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install lors de la mise à jour">
    `--dangerously-force-unsafe-install` est aussi disponible sur `plugins update` comme dérogation de dernier recours pour les faux positifs de l’analyse de code dangereux intégrée pendant les mises à jour de Plugin. Il ne contourne toujours pas les blocages de stratégie `before_install` du Plugin ni les blocages sur échec d’analyse, et il s’applique uniquement aux mises à jour de Plugin, pas aux mises à jour de paquets de hooks.
  </Accordion>
</AccordionGroup>

### Inspecter

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspecter affiche l’identité, l’état de chargement, la source, les capacités du manifeste, les indicateurs de stratégie, les diagnostics, les métadonnées d’installation, les capacités de lot et toute prise en charge détectée de serveur MCP ou LSP sans importer le runtime du Plugin par défaut. Ajoutez `--runtime` pour charger le module du Plugin et inclure les hooks, outils, commandes, services, méthodes de Gateway et routes HTTP enregistrés. L’inspection runtime signale directement les dépendances de Plugin manquantes ; les installations et réparations restent dans `openclaw plugins install`, `openclaw plugins update` et `openclaw doctor --fix`.

Les commandes CLI possédées par un Plugin sont installées comme groupes de commandes racine `openclaw`. Une fois que `inspect --runtime` affiche une commande sous `cliCommands`, exécutez-la comme `openclaw <command> ...` ; par exemple, un Plugin qui enregistre `demo-git` peut être vérifié avec `openclaw demo-git ping`.

Chaque Plugin est classé selon ce qu’il enregistre réellement au runtime :

- **plain-capability** — un seul type de capacité (par exemple, un Plugin uniquement fournisseur)
- **hybrid-capability** — plusieurs types de capacités (par exemple, texte + parole + images)
- **hook-only** — uniquement des hooks, sans capacités ni surfaces
- **non-capability** — outils/commandes/services, mais sans capacités

Voir [formes de Plugin](/fr/plugins/architecture#plugin-shapes) pour en savoir plus sur le modèle de capacités.

<Note>
L’indicateur `--json` produit un rapport lisible par machine, adapté aux scripts et aux audits. `inspect --all` affiche un tableau à l’échelle de la flotte avec des colonnes pour la forme, les types de capacités, les avis de compatibilité, les capacités du bundle et le récapitulatif des hooks. `info` est un alias de `inspect`.
</Note>

### Diagnostic

```bash
openclaw plugins doctor
```

`doctor` signale les erreurs de chargement des Plugins, les diagnostics de manifeste/découverte et les avis de compatibilité. Lorsque tout est propre, il affiche `No plugin issues detected.`

Si un Plugin configuré est présent sur le disque mais bloqué par les contrôles de sécurité des chemins du chargeur, la validation de la configuration conserve l’entrée du Plugin et la signale comme `present but blocked`. Corrigez le diagnostic de Plugin bloqué précédent, comme la propriété du chemin ou les permissions en écriture pour tous, au lieu de supprimer la configuration `plugins.entries.<id>` ou `plugins.allow`.

Pour les échecs liés à la forme du module, comme des exports `register`/`activate` manquants, relancez avec `OPENCLAW_PLUGIN_LOAD_DEBUG=1` pour inclure un résumé compact de la forme des exports dans la sortie de diagnostic.

### Registre

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Le registre local des Plugins est le modèle de lecture à froid persistant d’OpenClaw pour l’identité des Plugins installés, leur activation, les métadonnées de source et la propriété des contributions. Le démarrage normal, la recherche de propriétaire de fournisseur, la classification de la configuration des canaux et l’inventaire des Plugins peuvent le lire sans importer les modules d’exécution des Plugins.

Utilisez `plugins registry` pour vérifier si le registre persistant est présent, à jour ou obsolète. Utilisez `--refresh` pour le reconstruire à partir de l’index persistant des Plugins, de la stratégie de configuration et des métadonnées de manifeste/package. Il s’agit d’un chemin de réparation, pas d’un chemin d’activation à l’exécution.

`openclaw doctor --fix` répare également la dérive npm gérée liée au registre : si un package `@openclaw/*` orphelin ou récupéré sous la racine npm gérée des Plugins masque un Plugin groupé, doctor supprime ce package obsolète et reconstruit le registre afin que le démarrage valide le manifeste groupé.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` est un commutateur de compatibilité d’urgence obsolète pour les échecs de lecture du registre. Préférez `plugins registry --refresh` ou `openclaw doctor --fix` ; le repli via variable d’environnement est réservé à la récupération d’urgence du démarrage pendant le déploiement de la migration.
</Warning>

### Place de marché

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

La liste de la place de marché accepte un chemin de place de marché local, un chemin `marketplace.json`, un raccourci GitHub comme `owner/repo`, une URL de dépôt GitHub ou une URL git. `--json` affiche le libellé de source résolu ainsi que le manifeste de place de marché analysé et les entrées de Plugins.

## Articles associés

- [Créer des Plugins](/fr/plugins/building-plugins)
- [Référence CLI](/fr/cli)
- [Plugins communautaires](/fr/plugins/community)
