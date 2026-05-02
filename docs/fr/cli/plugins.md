---
read_when:
    - Vous voulez installer ou gérer des plugins Gateway ou des ensembles compatibles
    - Vous voulez déboguer les échecs de chargement de Plugin
sidebarTitle: Plugins
summary: Référence de la CLI pour `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-02T22:17:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b077ab0739e2453ccba434aa3b02b1d441bab792b7b131216221a8048d551cd
    source_path: cli/plugins.md
    workflow: 16
---

Gérez les plugins Gateway, les packs de hooks et les bundles compatibles.

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

Pour analyser une installation, une inspection, une désinstallation ou un rafraîchissement de registre lent, exécutez la commande avec `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. La trace écrit les durées des phases dans stderr et conserve une sortie JSON analysable. Consultez [Débogage](/fr/help/debugging#plugin-lifecycle-trace).

<Note>
Les plugins groupés sont fournis avec OpenClaw. Certains sont activés par défaut (par exemple les fournisseurs de modèles groupés, les fournisseurs vocaux groupés et le Plugin de navigateur groupé) ; d’autres nécessitent `plugins enable`.

Les plugins OpenClaw natifs doivent fournir `openclaw.plugin.json` avec un JSON Schema en ligne (`configSchema`, même vide). Les bundles compatibles utilisent plutôt leurs propres manifestes de bundle.

`plugins list` affiche `Format: openclaw` ou `Format: bundle`. La sortie détaillée de liste/info affiche aussi le sous-type de bundle (`codex`, `claude` ou `cursor`) ainsi que les capacités de bundle détectées.
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
Les noms de package nus s’installent depuis npm par défaut pendant la transition de lancement. Utilisez `clawhub:<package>` pour ClawHub. Traitez les installations de plugins comme l’exécution de code. Préférez les versions épinglées.
</Warning>

`plugins search` interroge ClawHub pour trouver des packages de plugins installables et affiche des noms de package prêts à installer. La recherche porte sur les packages code-plugin et bundle-plugin, pas sur les Skills. Utilisez `openclaw skills search` pour les Skills ClawHub.

<Note>
ClawHub est la principale surface de distribution et de découverte pour la plupart des plugins. Npm reste un recours pris en charge et un chemin d’installation directe. Les packages de plugins `@openclaw/*` appartenant à OpenClaw sont de nouveau publiés sur npm ; consultez la liste actuelle sur [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) ou l’[inventaire des plugins](/fr/plugins/plugin-inventory). Les installations stables utilisent `latest`. Les installations et mises à jour du canal bêta privilégient le dist-tag npm `beta` lorsque ce tag est disponible, puis se replient sur `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Includes de configuration et récupération après configuration non valide">
    Si votre section `plugins` s’appuie sur un `$include` à fichier unique, `plugins install/update/enable/disable/uninstall` écrit dans ce fichier inclus et laisse `openclaw.json` intact. Les includes racine, les tableaux d’includes et les includes avec remplacements frères échouent en mode fermé au lieu d’être aplatis. Consultez [Includes de configuration](/fr/gateway/configuration) pour les formes prises en charge.

    Si la configuration est non valide pendant l’installation, `plugins install` échoue normalement en mode fermé et vous indique d’exécuter d’abord `openclaw doctor --fix`. Pendant le démarrage du Gateway, une configuration non valide pour un Plugin est isolée à ce Plugin afin que les autres canaux et plugins puissent continuer à fonctionner ; `openclaw doctor --fix` peut mettre en quarantaine l’entrée de Plugin non valide. La seule exception documentée au moment de l’installation est un chemin de récupération restreint pour Plugin groupé, pour les plugins qui optent explicitement pour `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force et réinstallation par rapport à mise à jour">
    `--force` réutilise la cible d’installation existante et écrase sur place un Plugin ou un pack de hooks déjà installé. Utilisez-le lorsque vous réinstallez intentionnellement le même id depuis un nouveau chemin local, une archive, un package ClawHub ou un artefact npm. Pour les mises à niveau courantes d’un Plugin npm déjà suivi, préférez `openclaw plugins update <id-or-npm-spec>`.

    Si vous exécutez `plugins install` pour un id de Plugin déjà installé, OpenClaw s’arrête et vous oriente vers `plugins update <id-or-npm-spec>` pour une mise à niveau normale, ou vers `plugins install <package> --force` lorsque vous voulez réellement écraser l’installation actuelle depuis une autre source.

  </Accordion>
  <Accordion title="Portée de --pin">
    `--pin` s’applique uniquement aux installations npm. Il n’est pas pris en charge avec les installations `git:` ; utilisez une référence git explicite comme `git:github.com/acme/plugin@v1.2.3` lorsque vous voulez une source épinglée. Il n’est pas pris en charge avec `--marketplace`, car les installations marketplace conservent les métadonnées de source marketplace au lieu d’une spécification npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` est une option de dernier recours pour les faux positifs dans l’analyseur intégré de code dangereux. Elle permet à l’installation de continuer même lorsque l’analyseur intégré signale des résultats `critical`, mais elle ne contourne **pas** les blocages de stratégie du hook `before_install` du Plugin et ne contourne **pas** les échecs d’analyse.

    Ce flag CLI s’applique aux flux d’installation/mise à jour de plugins. Les installations de dépendances de Skills adossées au Gateway utilisent le remplacement de requête correspondant `dangerouslyForceUnsafeInstall`, tandis que `openclaw skills install` reste un flux distinct de téléchargement/installation de Skills ClawHub.

    Si un Plugin que vous avez publié sur ClawHub est bloqué par une analyse du registre, utilisez les étapes éditeur dans [ClawHub](/fr/tools/clawhub).

  </Accordion>
  <Accordion title="Packs de hooks et spécifications npm">
    `plugins install` est aussi la surface d’installation pour les packs de hooks qui exposent `openclaw.hooks` dans `package.json`. Utilisez `openclaw hooks` pour la visibilité filtrée des hooks et l’activation par hook, pas pour l’installation de packages.

    Les spécifications npm sont **uniquement registre** (nom de package + **version exacte** facultative ou **dist-tag**). Les spécifications Git/URL/fichier et les plages semver sont rejetées. Les installations de dépendances s’exécutent localement au projet avec `--ignore-scripts` par sécurité, même lorsque votre shell possède des paramètres globaux d’installation npm.

    Utilisez `npm:<package>` lorsque vous voulez rendre la résolution npm explicite. Les spécifications de package nues s’installent aussi directement depuis npm pendant la transition de lancement.

    Les spécifications nues et `@latest` restent sur la piste stable. Si npm résout l’une d’elles vers une préversion, OpenClaw s’arrête et vous demande d’opter explicitement pour un tag de préversion comme `@beta`/`@rc` ou une version de préversion exacte comme `@1.2.3-beta.4`.

    Si une spécification d’installation nue correspond à un id de Plugin officiel (par exemple `diffs`), OpenClaw installe directement l’entrée du catalogue. Pour installer un package npm portant le même nom, utilisez une spécification scoped explicite (par exemple `@scope/diffs`).

  </Accordion>
  <Accordion title="Dépôts Git">
    Utilisez `git:<repo>` pour installer directement depuis un dépôt git. Les formes prises en charge incluent les URL de clonage `git:github.com/owner/repo`, `git:owner/repo`, `https://` complet, `ssh://`, `git://`, `file://` et `git@host:owner/repo.git`. Ajoutez `@<ref>` ou `#<ref>` pour extraire une branche, un tag ou un commit avant l’installation.

    Les installations Git clonent dans un répertoire temporaire, extraient la ref demandée lorsqu’elle est présente, puis utilisent l’installateur normal de répertoire de Plugin. Cela signifie que la validation du manifeste, l’analyse de code dangereux, le travail d’installation du gestionnaire de packages et les enregistrements d’installation se comportent comme pour les installations npm. Les installations git enregistrées incluent l’URL/la ref source ainsi que le commit résolu afin que `openclaw plugins update` puisse résoudre de nouveau la source plus tard.

    Après une installation depuis git, utilisez `openclaw plugins inspect <id> --runtime --json` pour vérifier les enregistrements runtime comme les méthodes Gateway et les commandes CLI. Si le Plugin a enregistré une racine CLI avec `api.registerCli`, exécutez cette commande directement via la CLI racine OpenClaw, par exemple `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    Archives prises en charge : `.zip`, `.tgz`, `.tar.gz`, `.tar`. Les archives de Plugin OpenClaw natif doivent contenir un `openclaw.plugin.json` valide à la racine du Plugin extrait ; les archives qui ne contiennent que `package.json` sont rejetées avant qu’OpenClaw écrive les enregistrements d’installation.

    Les installations depuis la marketplace Claude sont également prises en charge.

  </Accordion>
</AccordionGroup>

Les installations ClawHub utilisent un localisateur explicite `clawhub:<package>` :

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Les spécifications de Plugin nues compatibles npm s’installent depuis npm par défaut pendant la transition de lancement :

```bash
openclaw plugins install openclaw-codex-app-server
```

Utilisez `npm:` pour rendre explicite la résolution uniquement npm :

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw vérifie la compatibilité annoncée de l’API de Plugin / Gateway minimum avant l’installation. Lorsque la version ClawHub sélectionnée publie un artefact ClawPack, OpenClaw télécharge le `.tgz` npm-pack versionné, vérifie l’en-tête de condensat ClawHub et le condensat de l’artefact, puis l’installe par le chemin d’archive normal. Les anciennes versions ClawHub sans métadonnées ClawPack s’installent encore via l’ancien chemin de vérification d’archive de package. Les installations enregistrées conservent leurs métadonnées de source ClawHub, le type d’artefact, l’intégrité npm, le shasum npm, le nom de tarball et les faits de condensat ClawPack pour les mises à jour ultérieures.
Les installations ClawHub sans version conservent une spécification enregistrée sans version afin que `openclaw plugins update` puisse suivre les nouvelles versions ClawHub ; les sélecteurs explicites de version ou de tag comme `clawhub:pkg@1.2.3` et `clawhub:pkg@beta` restent épinglés à ce sélecteur.

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
  <Tab title="Marketplace sources">
    - un nom de marketplace connu de Claude depuis `~/.claude/plugins/known_marketplaces.json`
    - une racine de marketplace locale ou un chemin `marketplace.json`
    - un raccourci de dépôt GitHub tel que `owner/repo`
    - une URL de dépôt GitHub telle que `https://github.com/owner/repo`
    - une URL git

  </Tab>
  <Tab title="Remote marketplace rules">
    Pour les marketplaces distants chargés depuis GitHub ou git, les entrées de plugins doivent rester dans le dépôt marketplace cloné. OpenClaw accepte les sources de chemin relatif depuis ce dépôt et rejette les sources de plugins HTTP(S), en chemin absolu, git, GitHub et autres sources hors chemin provenant de manifestes distants.
  </Tab>
</Tabs>

Pour les chemins et archives locaux, OpenClaw détecte automatiquement :

- les plugins OpenClaw natifs (`openclaw.plugin.json`)
- les bundles compatibles avec Codex (`.codex-plugin/plugin.json`)
- les bundles compatibles avec Claude (`.claude-plugin/plugin.json` ou la disposition de composants Claude par défaut)
- les bundles compatibles avec Cursor (`.cursor-plugin/plugin.json`)

<Note>
Les bundles compatibles s’installent dans la racine normale des plugins et participent au même flux de liste/info/activation/désactivation. Aujourd’hui, les skills de bundle, les command-skills Claude, les valeurs par défaut Claude `settings.json`, les valeurs par défaut Claude `.lsp.json` / `lspServers` déclarées par le manifeste, les command-skills Cursor et les répertoires de hooks Codex compatibles sont pris en charge ; les autres capacités de bundle détectées sont affichées dans les diagnostics/info, mais ne sont pas encore raccordées à l’exécution runtime.
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
  Afficher uniquement les plugins activés.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Passer de la vue tableau à des lignes de détail par plugin avec les métadonnées de source/origine/version/activation.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventaire lisible par machine, diagnostics du registre et état d’installation des dépendances de package.
</ParamField>

<Note>
`plugins list` lit d’abord le registre local persistant des plugins, avec un repli dérivé uniquement du manifeste lorsque le registre est manquant ou invalide. C’est utile pour vérifier si un plugin est installé, activé et visible par la planification du démarrage à froid, mais ce n’est pas une sonde runtime active d’un processus Gateway déjà en cours d’exécution. Après avoir modifié le code d’un plugin, son activation, la politique de hooks ou `plugins.load.paths`, redémarrez le Gateway qui sert le canal avant d’attendre l’exécution du nouveau code `register(api)` ou des hooks. Pour les déploiements distants/conteneurisés, vérifiez que vous redémarrez bien le processus enfant `openclaw gateway run` réel, pas seulement un processus wrapper.

`plugins list --json` inclut le `dependencyStatus` de chaque plugin depuis les
`dependencies` et `optionalDependencies` de `package.json`. OpenClaw vérifie si ces noms de packages
sont présents le long du chemin de recherche Node `node_modules` normal du plugin ; il
n’importe pas le code runtime du plugin, n’exécute pas de gestionnaire de packages et ne répare pas les
dépendances manquantes.
</Note>

`plugins search` est une recherche distante dans le catalogue ClawHub. Elle n’inspecte pas l’état local,
ne modifie pas la configuration, n’installe pas de packages et ne charge pas le code runtime du plugin. Les résultats de recherche
incluent le nom de package ClawHub, la famille, le canal, la version, le résumé et
une indication d’installation telle que `openclaw plugins install clawhub:<package>`.

Pour le travail sur les plugins intégrés dans une image Docker packagée, montez par bind-mount le répertoire source du plugin
sur le chemin source packagé correspondant, par exemple
`/app/extensions/synology-chat`. OpenClaw découvrira cette surcouche source montée
avant `/app/dist/extensions/synology-chat` ; un simple répertoire source copié
reste inerte, de sorte que les installations packagées normales continuent d’utiliser le dist compilé.

Pour le débogage des hooks runtime :

- `openclaw plugins inspect <id> --runtime --json` affiche les hooks enregistrés et les diagnostics issus d’une passe d’inspection avec module chargé. L’inspection runtime n’installe jamais les dépendances ; utilisez `openclaw doctor --fix` pour nettoyer l’état des dépendances héritées ou installer les plugins téléchargeables configurés manquants.
- `openclaw gateway status --deep --require-rpc` confirme le Gateway joignable, les indications de service/processus, le chemin de configuration et l’état de santé RPC.
- Les hooks de conversation non intégrés (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) nécessitent `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Utilisez `--link` pour éviter de copier un répertoire local (ajoute à `plugins.load.paths`) :

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` n’est pas pris en charge avec `--link`, car les installations liées réutilisent le chemin source au lieu de copier par-dessus une cible d’installation gérée.

Utilisez `--pin` sur les installations npm pour enregistrer la spécification exacte résolue (`name@version`) dans l’index des plugins gérés tout en conservant le comportement par défaut non épinglé.
</Note>

### Index des plugins

Les métadonnées d’installation des plugins sont un état géré par machine, pas une configuration utilisateur. Les installations et mises à jour l’écrivent dans `plugins/installs.json` sous le répertoire d’état OpenClaw actif. Sa map de niveau supérieur `installRecords` est la source durable des métadonnées d’installation, y compris les enregistrements de manifestes de plugin cassés ou manquants. Le tableau `plugins` est le cache de registre à froid dérivé des manifestes. Le fichier inclut un avertissement de ne pas modifier et est utilisé par `openclaw plugins update`, la désinstallation, les diagnostics et le registre à froid des plugins.

Quand OpenClaw voit des enregistrements hérités livrés `plugins.installs` dans la configuration, il les déplace dans l’index des plugins et supprime la clé de configuration ; si l’une des écritures échoue, les enregistrements de configuration sont conservés afin que les métadonnées d’installation ne soient pas perdues.

### Désinstallation

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` supprime les enregistrements de plugin de `plugins.entries`, de l’index persistant des plugins, des entrées de listes d’autorisation/refus de plugins et des entrées liées `plugins.load.paths` lorsque cela s’applique. Sauf si `--keep-files` est défini, la désinstallation supprime aussi le répertoire d’installation géré suivi lorsqu’il se trouve dans la racine d’extensions de plugins d’OpenClaw. Pour les plugins de mémoire active, l’emplacement mémoire est réinitialisé à `memory-core`.

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

Les mises à jour s’appliquent aux installations de plugins suivies dans l’index des plugins gérés et aux installations de hook-packs suivies dans `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    Lorsque vous passez un id de plugin, OpenClaw réutilise la spécification d’installation enregistrée pour ce plugin. Cela signifie que les dist-tags précédemment stockés tels que `@beta` et les versions exactes épinglées continuent d’être utilisés lors des exécutions ultérieures de `update <id>`.

    Pour les installations npm, vous pouvez aussi passer une spécification de package npm explicite avec un dist-tag ou une version exacte. OpenClaw résout ce nom de package vers l’enregistrement de plugin suivi, met à jour ce plugin installé et enregistre la nouvelle spécification npm pour les futures mises à jour basées sur l’id.

    Passer le nom de package npm sans version ni tag résout aussi vers l’enregistrement de plugin suivi. Utilisez cela lorsqu’un plugin était épinglé à une version exacte et que vous voulez le ramener à la ligne de publication par défaut du registre.

  </Accordion>
  <Accordion title="Beta channel updates">
    `openclaw plugins update` réutilise la spécification de plugin suivie sauf si vous passez une nouvelle spécification. `openclaw update` connaît en plus le canal de mise à jour OpenClaw actif : sur le canal bêta, les enregistrements de plugins npm et ClawHub sur la ligne par défaut essaient d’abord `@beta`, puis se replient sur la spécification par défaut/latest enregistrée si aucune version bêta du plugin n’existe. Les versions exactes et les tags explicites restent épinglés à ce sélecteur.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    Avant une mise à jour npm en direct, OpenClaw vérifie la version du package installé par rapport aux métadonnées du registre npm. Si la version installée et l’identité d’artefact enregistrée correspondent déjà à la cible résolue, la mise à jour est ignorée sans téléchargement, réinstallation ni réécriture de `openclaw.json`.

    Lorsqu’un hash d’intégrité stocké existe et que le hash de l’artefact récupéré change, OpenClaw traite cela comme une dérive d’artefact npm. La commande interactive `openclaw plugins update` affiche les hash attendus et réels, puis demande confirmation avant de continuer. Les assistants de mise à jour non interactifs échouent en mode fermé sauf si l’appelant fournit une politique de continuation explicite.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` est aussi disponible sur `plugins update` comme dérogation d’urgence pour les faux positifs de l’analyse de code dangereux intégrée lors des mises à jour de plugins. Elle ne contourne toujours pas les blocages de politique `before_install` de plugin ni les blocages sur échec d’analyse, et elle s’applique uniquement aux mises à jour de plugins, pas aux mises à jour de hook-packs.
  </Accordion>
</AccordionGroup>

### Inspecter

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect affiche l’identité, l’état de chargement, la source, les capacités du manifeste, les indicateurs de politique, les diagnostics, les métadonnées d’installation, les capacités de bundle et toute prise en charge détectée de serveur MCP ou LSP sans importer le runtime du plugin par défaut. Ajoutez `--runtime` pour charger le module du plugin et inclure les hooks, outils, commandes, services, méthodes gateway et routes HTTP enregistrés. L’inspection runtime signale directement les dépendances de plugin manquantes ; les installations et réparations restent dans `openclaw plugins install`, `openclaw plugins update` et `openclaw doctor --fix`.

Les commandes CLI appartenant aux plugins sont installées comme groupes de commandes racine `openclaw`. Après que `inspect --runtime` affiche une commande sous `cliCommands`, exécutez-la comme `openclaw <command> ...` ; par exemple, un plugin qui enregistre `demo-git` peut être vérifié avec `openclaw demo-git ping`.

Chaque plugin est classé selon ce qu’il enregistre réellement au runtime :

- **plain-capability** — un seul type de capacité (par exemple un plugin uniquement provider)
- **hybrid-capability** — plusieurs types de capacités (par exemple texte + parole + images)
- **hook-only** — uniquement des hooks, aucune capacité ni surface
- **non-capability** — outils/commandes/services mais aucune capacité

Voir [Formes de plugins](/fr/plugins/architecture#plugin-shapes) pour en savoir plus sur le modèle de capacités.

<Note>
L’indicateur `--json` produit un rapport lisible par machine adapté aux scripts et aux audits. `inspect --all` affiche un tableau pour toute la flotte avec les colonnes de forme, genres de capacités, avis de compatibilité, capacités de bundle et résumé des hooks. `info` est un alias de `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` signale les erreurs de chargement des plugins, les diagnostics de manifeste/découverte et les avis de compatibilité. Lorsque tout est propre, il affiche `No plugin issues detected.`

Pour les échecs de forme de module tels que des exports `register`/`activate` manquants, relancez avec `OPENCLAW_PLUGIN_LOAD_DEBUG=1` pour inclure un résumé compact de la forme des exports dans la sortie de diagnostic.

### Registre

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Le registre local des plugins est le modèle de lecture à froid persistant d’OpenClaw pour l’identité des plugins installés, leur activation, les métadonnées de source et la propriété des contributions. Le démarrage normal, la recherche de propriétaire de provider, la classification de configuration des canaux et l’inventaire des plugins peuvent le lire sans importer les modules runtime des plugins.

Utilisez `plugins registry` pour inspecter si le registre persistant est présent, actuel ou obsolète. Utilisez `--refresh` pour le reconstruire à partir de l’index persistant des plugins, de la politique de configuration et des métadonnées de manifeste/package. C’est un chemin de réparation, pas un chemin d’activation runtime.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` est un commutateur de compatibilité de dernier recours obsolète pour les échecs de lecture du registre. Privilégiez `plugins registry --refresh` ou `openclaw doctor --fix`; la solution de repli via variable d’environnement sert uniquement à la récupération d’urgence au démarrage pendant le déploiement de la migration.
</Warning>

### Place de marché

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

La liste de la place de marché accepte un chemin de place de marché local, un chemin `marketplace.json`, un raccourci GitHub comme `owner/repo`, une URL de dépôt GitHub ou une URL git. `--json` affiche le libellé de source résolu, ainsi que le manifeste de place de marché analysé et les entrées de Plugin.

## Connexe

- [Créer des plugins](/fr/plugins/building-plugins)
- [Référence CLI](/fr/cli)
- [Plugins de la communauté](/fr/plugins/community)
