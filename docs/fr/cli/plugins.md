---
read_when:
    - Vous souhaitez installer ou gérer des plugins Gateway ou des bundles compatibles
    - Vous souhaitez déboguer les échecs de chargement des plugins
sidebarTitle: Plugins
summary: Référence CLI pour `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, deps, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-04-30T07:19:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 381e3243eaefb5b5e31db8fd2ba459773649a6ef427080a12018ea92b25f707c
    source_path: cli/plugins.md
    workflow: 16
---

Gérer les plugins Gateway, les packs de hooks et les bundles compatibles.

<CardGroup cols={2}>
  <Card title="Plugin system" href="/fr/tools/plugin">
    Guide utilisateur pour installer, activer et dépanner les plugins.
  </Card>
  <Card title="Plugin bundles" href="/fr/plugins/bundles">
    Modèle de compatibilité des bundles.
  </Card>
  <Card title="Plugin manifest" href="/fr/plugins/manifest">
    Champs du manifeste et schéma de configuration.
  </Card>
  <Card title="Security" href="/fr/gateway/security">
    Renforcement de la sécurité pour les installations de plugins.
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
openclaw plugins deps
openclaw plugins deps --repair
openclaw plugins deps --prune
openclaw plugins deps --json
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

Les plugins OpenClaw natifs doivent fournir `openclaw.plugin.json` avec un schéma JSON en ligne (`configSchema`, même vide). Les bundles compatibles utilisent plutôt leurs propres manifestes de bundle.

`plugins list` affiche `Format: openclaw` ou `Format: bundle`. La sortie détaillée de list/info affiche aussi le sous-type de bundle (`codex`, `claude` ou `cursor`) ainsi que les capacités de bundle détectées.
</Note>

### Installer

```bash
openclaw plugins install <package>                      # ClawHub first, then npm
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
Les noms de paquets nus sont vérifiés d’abord dans ClawHub, puis dans npm. Traitez les installations de plugins comme l’exécution de code. Préférez les versions épinglées.
</Warning>

<Note>
ClawHub est la principale surface de distribution et de découverte pour la plupart des plugins. Npm
reste un repli pris en charge et un chemin d’installation directe. Pendant la migration vers
ClawHub, OpenClaw fournit encore certains paquets de plugins `@openclaw/*` appartenant à OpenClaw
sur npm ; ces versions de paquets peuvent être en retard sur la source incluse entre les trains de publication
de plugins. Si npm signale qu’un paquet de plugin appartenant à OpenClaw est obsolète, cette
version publiée est un ancien artefact externe ; utilisez le plugin inclus avec
la version actuelle d’OpenClaw ou un checkout local jusqu’à la publication d’un paquet npm plus récent.
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config recovery">
    Si votre section `plugins` est adossée à un `$include` de fichier unique, `plugins install/update/enable/disable/uninstall` écrit dans ce fichier inclus et laisse `openclaw.json` intact. Les includes racine, les tableaux d’includes et les includes avec remplacements frères échouent de façon fermée au lieu d’être aplatis. Consultez [Includes de configuration](/fr/gateway/configuration) pour les formes prises en charge.

    Si la configuration est invalide pendant l’installation, `plugins install` échoue normalement de façon fermée et vous indique d’exécuter d’abord `openclaw doctor --fix`. Pendant le démarrage du Gateway, une configuration invalide pour un plugin est isolée à ce plugin afin que les autres canaux et plugins puissent continuer à s’exécuter ; `openclaw doctor --fix` peut mettre en quarantaine l’entrée de plugin invalide. La seule exception documentée au moment de l’installation est un chemin de récupération étroit pour les plugins inclus qui optent explicitement pour `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force` réutilise la cible d’installation existante et écrase sur place un plugin ou un pack de hooks déjà installé. Utilisez-le lorsque vous réinstallez intentionnellement le même id depuis un nouveau chemin local, une archive, un paquet ClawHub ou un artefact npm. Pour les mises à niveau courantes d’un plugin npm déjà suivi, préférez `openclaw plugins update <id-or-npm-spec>`.

    Si vous exécutez `plugins install` pour un id de plugin déjà installé, OpenClaw s’arrête et vous dirige vers `plugins update <id-or-npm-spec>` pour une mise à niveau normale, ou vers `plugins install <package> --force` lorsque vous voulez réellement écraser l’installation actuelle depuis une autre source.

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` s’applique uniquement aux installations npm. Il n’est pas pris en charge avec `--marketplace`, car les installations depuis marketplace conservent les métadonnées de source marketplace au lieu d’une spec npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` est une option d’urgence pour les faux positifs dans le scanner de code dangereux intégré. Elle permet à l’installation de continuer même lorsque le scanner intégré signale des résultats `critical`, mais elle ne contourne **pas** les blocages de politique des hooks `before_install` des plugins et ne contourne **pas** les échecs d’analyse.

    Ce flag CLI s’applique aux flux d’installation/mise à jour de plugins. Les installations de dépendances de skills adossées au Gateway utilisent le remplacement de requête correspondant `dangerouslyForceUnsafeInstall`, tandis que `openclaw skills install` reste un flux distinct de téléchargement/installation de skill depuis ClawHub.

    Si un plugin que vous avez publié sur ClawHub est bloqué par une analyse du registre, utilisez les étapes éditeur dans [ClawHub](/fr/tools/clawhub).

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install` est aussi la surface d’installation pour les packs de hooks qui exposent `openclaw.hooks` dans `package.json`. Utilisez `openclaw hooks` pour une visibilité filtrée des hooks et l’activation par hook, pas pour l’installation de paquets.

    Les specs npm sont **réservées au registre** (nom de paquet + **version exacte** ou **dist-tag** facultatif). Les specs Git/URL/fichier et les plages semver sont rejetées. Les installations de dépendances s’exécutent localement au projet avec `--ignore-scripts` par sécurité, même lorsque votre shell a des paramètres globaux d’installation npm.

    Utilisez `npm:<package>` lorsque vous voulez ignorer la recherche ClawHub et installer directement depuis npm. Les specs de paquets nues préfèrent toujours ClawHub et ne se rabattent sur npm que lorsque ClawHub n’a pas ce paquet ou cette version.

    Les specs nues et `@latest` restent sur la piste stable. Si npm résout l’une d’elles vers une préversion, OpenClaw s’arrête et vous demande d’opter explicitement pour un tag de préversion tel que `@beta`/`@rc` ou une version de préversion exacte telle que `@1.2.3-beta.4`.

    Si une spec d’installation nue correspond à un id de plugin inclus (par exemple `diffs`), OpenClaw installe directement le plugin inclus. Pour installer un paquet npm portant le même nom, utilisez une spec à portée explicite (par exemple `@scope/diffs`).

  </Accordion>
  <Accordion title="Archives">
    Archives prises en charge : `.zip`, `.tgz`, `.tar.gz`, `.tar`. Les archives de plugins OpenClaw natifs doivent contenir un `openclaw.plugin.json` valide à la racine du plugin extrait ; les archives qui ne contiennent que `package.json` sont rejetées avant qu’OpenClaw écrive des enregistrements d’installation.

    Les installations depuis la marketplace Claude sont également prises en charge.

  </Accordion>
</AccordionGroup>

Les installations ClawHub utilisent un localisateur explicite `clawhub:<package>` :

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw préfère désormais aussi ClawHub pour les specs de plugins nues compatibles npm. Il ne se rabat sur npm que si ClawHub ne dispose pas de ce paquet ou de cette version :

```bash
openclaw plugins install openclaw-codex-app-server
```

Utilisez `npm:` pour forcer une résolution uniquement via npm, par exemple lorsque ClawHub est inaccessible ou que vous savez que le paquet n’existe que sur npm :

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw télécharge l’archive du paquet depuis ClawHub, vérifie la compatibilité annoncée de l’API de plugin / du gateway minimal, puis l’installe via le chemin d’archive normal. Les installations enregistrées conservent leurs métadonnées de source ClawHub pour les mises à jour ultérieures.
Les installations ClawHub sans version conservent une spec enregistrée sans version afin que `openclaw plugins update` puisse suivre les nouvelles publications ClawHub ; les sélecteurs de version ou de tag explicites tels que `clawhub:pkg@1.2.3` et `clawhub:pkg@beta` restent épinglés à ce sélecteur.

#### Raccourci marketplace

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
  <Tab title="Marketplace sources">
    - un nom de marketplace connue Claude depuis `~/.claude/plugins/known_marketplaces.json`
    - une racine de marketplace locale ou un chemin `marketplace.json`
    - un raccourci de dépôt GitHub tel que `owner/repo`
    - une URL de dépôt GitHub telle que `https://github.com/owner/repo`
    - une URL git

  </Tab>
  <Tab title="Remote marketplace rules">
    Pour les marketplaces distantes chargées depuis GitHub ou git, les entrées de plugins doivent rester à l’intérieur du dépôt marketplace cloné. OpenClaw accepte les sources de chemins relatifs depuis ce dépôt et rejette les sources de plugins HTTP(S), à chemin absolu, git, GitHub et autres sources qui ne sont pas des chemins depuis les manifestes distants.
  </Tab>
</Tabs>

Pour les chemins locaux et les archives, OpenClaw détecte automatiquement :

- les plugins OpenClaw natifs (`openclaw.plugin.json`)
- les bundles compatibles Codex (`.codex-plugin/plugin.json`)
- les bundles compatibles Claude (`.claude-plugin/plugin.json` ou la disposition par défaut des composants Claude)
- les bundles compatibles Cursor (`.cursor-plugin/plugin.json`)

<Note>
Les bundles compatibles s’installent dans la racine de plugin normale et participent au même flux list/info/enable/disable. Aujourd’hui, les skills de bundle, les command-skills Claude, les valeurs par défaut `settings.json` de Claude, les valeurs par défaut `.lsp.json` / `lspServers` déclarées par le manifeste de Claude, les command-skills Cursor et les répertoires de hooks Codex compatibles sont pris en charge ; les autres capacités de bundle détectées sont affichées dans les diagnostics/info mais ne sont pas encore raccordées à l’exécution runtime.
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
  Basculer de la vue en tableau vers des lignes de détail par plugin avec les métadonnées de source/origine/version/activation.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventaire lisible par machine ainsi que diagnostics du registre.
</ParamField>

<Note>
`plugins list` lit d’abord le registre local persistant des Plugins, avec un repli dérivé du manifeste uniquement lorsque le registre est absent ou invalide. C’est utile pour vérifier si un Plugin est installé, activé et visible pour la planification du démarrage à froid, mais ce n’est pas une sonde d’exécution en direct d’un processus Gateway déjà en cours d’exécution. Après avoir modifié le code d’un Plugin, son activation, la politique des hooks ou `plugins.load.paths`, redémarrez le Gateway qui sert le canal avant de vous attendre à ce que le nouveau code `register(api)` ou les hooks s’exécutent. Pour les déploiements distants/en conteneur, vérifiez que vous redémarrez bien le processus enfant réel `openclaw gateway run`, et pas seulement un processus d’enveloppe.
</Note>

Pour travailler sur des Plugins groupés dans une image Docker packagée, montez en bind le répertoire
source du Plugin par-dessus le chemin source packagé correspondant, par exemple
`/app/extensions/synology-chat`. OpenClaw découvrira cette superposition de source montée
avant `/app/dist/extensions/synology-chat` ; un répertoire source simplement copié
reste inerte, afin que les installations packagées normales continuent d’utiliser le dist compilé.

Pour le débogage des hooks d’exécution :

- `openclaw plugins inspect <id> --json` affiche les hooks enregistrés et les diagnostics issus d’une passe d’inspection avec module chargé.
- `openclaw gateway status --deep --require-rpc` confirme le Gateway joignable, les indications de service/processus, le chemin de configuration et l’état RPC.
- Les hooks de conversation non groupés (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) nécessitent `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Utilisez `--link` pour éviter de copier un répertoire local (ajoute à `plugins.load.paths`) :

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` n’est pas pris en charge avec `--link`, car les installations liées réutilisent le chemin source au lieu de copier par-dessus une cible d’installation gérée.

Utilisez `--pin` sur les installations npm pour enregistrer la spécification exacte résolue (`name@version`) dans l’index de Plugins gérés tout en conservant le comportement par défaut non épinglé.
</Note>

### Index des Plugins

Les métadonnées d’installation des Plugins sont un état géré par la machine, pas une configuration utilisateur. Les installations et mises à jour les écrivent dans `plugins/installs.json` sous le répertoire d’état OpenClaw actif. Sa map de premier niveau `installRecords` est la source durable des métadonnées d’installation, y compris les enregistrements pour les manifestes de Plugins cassés ou manquants. Le tableau `plugins` est le cache de registre à froid dérivé des manifestes. Le fichier inclut un avertissement indiquant de ne pas le modifier et est utilisé par `openclaw plugins update`, la désinstallation, les diagnostics et le registre de Plugins à froid.

Lorsque OpenClaw voit des enregistrements hérités livrés `plugins.installs` dans la configuration, il les déplace vers l’index des Plugins et supprime la clé de configuration ; si l’une des écritures échoue, les enregistrements de configuration sont conservés afin que les métadonnées d’installation ne soient pas perdues.

### Dépendances d’exécution

```bash
openclaw plugins deps
openclaw plugins deps --repair
openclaw plugins deps --prune
openclaw plugins deps --json
```

`plugins deps` inspecte l’étape des dépendances d’exécution packagées pour les Plugins groupés appartenant à OpenClaw sélectionnés par la configuration des Plugins, les canaux activés/configurés, les fournisseurs de modèles configurés ou les valeurs par défaut des manifestes groupés. Ce n’est pas le chemin d’installation/mise à jour pour les Plugins npm tiers ou ClawHub.

Utilisez `--repair` lorsqu’une installation packagée signale des dépendances d’exécution groupées manquantes pendant le démarrage du Gateway ou `plugins doctor`. La réparation installe uniquement les dépendances manquantes des Plugins groupés activés avec les scripts de cycle de vie désactivés. Utilisez `--prune` pour supprimer les racines obsolètes inconnues de dépendances d’exécution externes laissées par d’anciennes dispositions packagées.

### Désinstallation

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` supprime les enregistrements de Plugins de `plugins.entries`, l’index de Plugins persistant, les entrées de listes d’autorisation/refus de Plugins et les entrées liées `plugins.load.paths` le cas échéant. Sauf si `--keep-files` est défini, la désinstallation supprime aussi le répertoire d’installation gérée suivi lorsqu’il se trouve dans la racine des extensions de Plugins d’OpenClaw. Pour les Plugins Active Memory, l’emplacement mémoire est réinitialisé à `memory-core`.

<Note>
`--keep-config` est pris en charge comme alias obsolète de `--keep-files`.
</Note>

### Mise à jour

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Les mises à jour s’appliquent aux installations de Plugins suivies dans l’index de Plugins gérés et aux installations de packs de hooks suivies dans `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Résolution de l’id de Plugin par rapport à la spécification npm">
    Lorsque vous passez un id de Plugin, OpenClaw réutilise la spécification d’installation enregistrée pour ce Plugin. Cela signifie que les dist-tags précédemment stockés, comme `@beta`, et les versions exactes épinglées continuent d’être utilisés lors des exécutions ultérieures de `update <id>`.

    Pour les installations npm, vous pouvez aussi passer une spécification de paquet npm explicite avec un dist-tag ou une version exacte. OpenClaw résout ce nom de paquet vers l’enregistrement de Plugin suivi, met à jour ce Plugin installé et enregistre la nouvelle spécification npm pour les futures mises à jour basées sur l’id.

    Passer le nom du paquet npm sans version ni tag résout aussi vers l’enregistrement de Plugin suivi. Utilisez cela lorsqu’un Plugin était épinglé à une version exacte et que vous voulez le ramener à la ligne de publication par défaut du registre.

  </Accordion>
  <Accordion title="Vérifications de version et dérive d’intégrité">
    Avant une mise à jour npm en direct, OpenClaw vérifie la version du paquet installé par rapport aux métadonnées du registre npm. Si la version installée et l’identité de l’artefact enregistrée correspondent déjà à la cible résolue, la mise à jour est ignorée sans téléchargement, réinstallation ni réécriture de `openclaw.json`.

    Lorsqu’un hash d’intégrité stocké existe et que le hash de l’artefact récupéré change, OpenClaw traite cela comme une dérive d’artefact npm. La commande interactive `openclaw plugins update` affiche les hashs attendu et réel et demande confirmation avant de continuer. Les helpers de mise à jour non interactifs échouent fermés sauf si l’appelant fournit une politique de continuation explicite.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install lors de la mise à jour">
    `--dangerously-force-unsafe-install` est aussi disponible sur `plugins update` comme contournement d’urgence pour les faux positifs de l’analyse intégrée de code dangereux pendant les mises à jour de Plugins. Il ne contourne toujours pas les blocages de politique `before_install` du Plugin ni le blocage dû aux échecs d’analyse, et il ne s’applique qu’aux mises à jour de Plugins, pas aux mises à jour de packs de hooks.
  </Accordion>
</AccordionGroup>

### Inspection

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Introspection approfondie pour un seul Plugin. Affiche l’identité, l’état de chargement, la source, les capacités enregistrées, les hooks, les outils, les commandes, les services, les méthodes Gateway, les routes HTTP, les indicateurs de politique, les diagnostics, les métadonnées d’installation, les capacités du bundle et toute prise en charge détectée de serveur MCP ou LSP.

Chaque Plugin est classé selon ce qu’il enregistre réellement à l’exécution :

- **plain-capability** — un type de capacité (par exemple un Plugin uniquement fournisseur)
- **hybrid-capability** — plusieurs types de capacités (par exemple texte + parole + images)
- **hook-only** — uniquement des hooks, sans capacités ni surfaces
- **non-capability** — outils/commandes/services, mais aucune capacité

Voir [Formes de Plugins](/fr/plugins/architecture#plugin-shapes) pour en savoir plus sur le modèle de capacités.

<Note>
Le drapeau `--json` produit un rapport lisible par machine, adapté aux scripts et aux audits. `inspect --all` affiche un tableau à l’échelle du parc avec des colonnes de forme, de types de capacités, d’avis de compatibilité, de capacités du bundle et de résumé des hooks. `info` est un alias de `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` signale les erreurs de chargement des Plugins, les diagnostics de manifeste/découverte et les avis de compatibilité. Lorsque tout est propre, il affiche `No plugin issues detected.`

Pour les échecs de forme de module, comme les exports `register`/`activate` manquants, relancez avec `OPENCLAW_PLUGIN_LOAD_DEBUG=1` afin d’inclure un résumé compact de la forme des exports dans la sortie de diagnostic.

### Registre

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Le registre local des Plugins est le modèle de lecture à froid persistant d’OpenClaw pour l’identité des Plugins installés, leur activation, les métadonnées de source et la propriété des contributions. Le démarrage normal, la recherche de propriétaire de fournisseur, la classification de configuration des canaux et l’inventaire des Plugins peuvent le lire sans importer les modules d’exécution des Plugins.

Utilisez `plugins registry` pour inspecter si le registre persistant est présent, actuel ou obsolète. Utilisez `--refresh` pour le reconstruire à partir de l’index de Plugins persistant, de la politique de configuration et des métadonnées manifeste/paquet. Il s’agit d’un chemin de réparation, pas d’un chemin d’activation à l’exécution.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` est un commutateur de compatibilité d’urgence obsolète pour les échecs de lecture du registre. Préférez `plugins registry --refresh` ou `openclaw doctor --fix` ; le repli par variable d’environnement sert uniquement à la récupération d’urgence du démarrage pendant le déploiement de la migration.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

La liste Marketplace accepte un chemin de Marketplace local, un chemin `marketplace.json`, un raccourci GitHub comme `owner/repo`, une URL de dépôt GitHub ou une URL git. `--json` affiche le libellé de source résolu ainsi que le manifeste Marketplace analysé et les entrées de Plugins.

## Connexe

- [Créer des Plugins](/fr/plugins/building-plugins)
- [Référence CLI](/fr/cli)
- [Plugins communautaires](/fr/plugins/community)
