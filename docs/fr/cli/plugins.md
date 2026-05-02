---
read_when:
    - Vous souhaitez installer ou gérer des Plugins Gateway ou des bundles compatibles
    - Vous voulez déboguer les échecs de chargement de Plugin
sidebarTitle: Plugins
summary: Référence CLI pour `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-02T20:43:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fc046a04175c1b22f787920bf5ec28c24d0bb7d62eda4d9517da8f5dbac4c50
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
commande avec `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. La trace écrit les durées des phases
sur stderr et garde la sortie JSON analysable. Consultez [Débogage](/fr/help/debugging#plugin-lifecycle-trace).

<Note>
Les plugins intégrés sont livrés avec OpenClaw. Certains sont activés par défaut (par exemple les fournisseurs de modèles intégrés, les fournisseurs vocaux intégrés et le plugin de navigateur intégré) ; d’autres nécessitent `plugins enable`.

Les plugins OpenClaw natifs doivent fournir `openclaw.plugin.json` avec un JSON Schema en ligne (`configSchema`, même vide). Les bundles compatibles utilisent plutôt leurs propres manifestes de bundle.

`plugins list` affiche `Format: openclaw` ou `Format: bundle`. La sortie détaillée de liste/info affiche aussi le sous-type de bundle (`codex`, `claude` ou `cursor`) ainsi que les capacités de bundle détectées.
</Note>

### Installation

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
Les noms de paquets sans préfixe s’installent depuis npm par défaut pendant la transition de lancement. Utilisez `clawhub:<package>` pour ClawHub. Traitez les installations de plugins comme l’exécution de code. Préférez les versions épinglées.
</Warning>

`plugins search` interroge ClawHub pour trouver des paquets de plugins installables et affiche
des noms de paquets prêts à installer. La recherche porte sur les paquets code-plugin et bundle-plugin,
pas sur les Skills. Utilisez `openclaw skills search` pour les Skills ClawHub.

<Note>
ClawHub est la surface principale de distribution et de découverte pour la plupart des plugins. Npm
reste une solution de repli prise en charge et un chemin d’installation directe. Pendant la migration vers
ClawHub, OpenClaw livre encore certains paquets de plugins `@openclaw/*` appartenant à OpenClaw
sur npm ; ces versions de paquets peuvent être en retard sur la source intégrée entre les cycles de publication
des plugins. Si npm signale qu’un paquet de plugin appartenant à OpenClaw est obsolète, cette
version publiée est un ancien artefact externe ; utilisez le plugin intégré à la version
actuelle d’OpenClaw ou un checkout local jusqu’à la publication d’un paquet npm plus récent.
</Note>

<AccordionGroup>
  <Accordion title="Inclusions de configuration et récupération de configuration invalide">
    Si votre section `plugins` est adossée à un `$include` à fichier unique, `plugins install/update/enable/disable/uninstall` écrit dans ce fichier inclus et laisse `openclaw.json` intact. Les inclusions racine, les tableaux d’inclusions et les inclusions avec remplacements frères échouent en mode fermé au lieu d’être aplatis. Consultez [Inclusions de configuration](/fr/gateway/configuration) pour les formes prises en charge.

    Si la configuration est invalide pendant l’installation, `plugins install` échoue normalement en mode fermé et vous demande d’exécuter d’abord `openclaw doctor --fix`. Pendant le démarrage du Gateway, la configuration invalide d’un plugin est isolée à ce plugin afin que les autres canaux et plugins puissent continuer à fonctionner ; `openclaw doctor --fix` peut mettre en quarantaine l’entrée de plugin invalide. La seule exception documentée au moment de l’installation est un chemin de récupération étroit pour plugin intégré, destiné aux plugins qui activent explicitement `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force et réinstallation ou mise à jour">
    `--force` réutilise la cible d’installation existante et écrase sur place un plugin ou un pack de hooks déjà installé. Utilisez-le lorsque vous réinstallez intentionnellement le même id depuis un nouveau chemin local, une archive, un paquet ClawHub ou un artefact npm. Pour les mises à niveau courantes d’un plugin npm déjà suivi, préférez `openclaw plugins update <id-or-npm-spec>`.

    Si vous exécutez `plugins install` pour un id de plugin déjà installé, OpenClaw s’arrête et vous oriente vers `plugins update <id-or-npm-spec>` pour une mise à niveau normale, ou vers `plugins install <package> --force` lorsque vous voulez réellement écraser l’installation actuelle depuis une source différente.

  </Accordion>
  <Accordion title="Portée de --pin">
    `--pin` s’applique uniquement aux installations npm. Il n’est pas pris en charge avec les installations `git:` ; utilisez une référence git explicite comme `git:github.com/acme/plugin@v1.2.3` lorsque vous voulez une source épinglée. Il n’est pas pris en charge avec `--marketplace`, car les installations de place de marché conservent les métadonnées de source de la place de marché au lieu d’une spécification npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` est une option d’urgence pour les faux positifs de l’analyseur intégré de code dangereux. Elle permet à l’installation de continuer même lorsque l’analyseur intégré signale des constats `critical`, mais elle ne contourne **pas** les blocages de politique des hooks `before_install` du plugin et ne contourne **pas** les échecs d’analyse.

    Cet indicateur CLI s’applique aux flux d’installation/mise à jour de plugins. Les installations de dépendances de Skills adossées au Gateway utilisent le remplacement de requête correspondant `dangerouslyForceUnsafeInstall`, tandis que `openclaw skills install` reste un flux distinct de téléchargement/installation de Skills ClawHub.

    Si un plugin que vous avez publié sur ClawHub est bloqué par une analyse du registre, utilisez les étapes d’éditeur dans [ClawHub](/fr/tools/clawhub).

  </Accordion>
  <Accordion title="Packs de hooks et spécifications npm">
    `plugins install` est aussi la surface d’installation des packs de hooks qui exposent `openclaw.hooks` dans `package.json`. Utilisez `openclaw hooks` pour la visibilité filtrée des hooks et l’activation hook par hook, pas pour l’installation de paquets.

    Les spécifications npm sont **limitées au registre** (nom de paquet + **version exacte** facultative ou **dist-tag**). Les spécifications Git/URL/fichier et les plages semver sont rejetées. Les installations de dépendances s’exécutent localement au projet avec `--ignore-scripts` pour la sécurité, même si votre shell possède des paramètres globaux d’installation npm.

    Utilisez `npm:<package>` lorsque vous voulez rendre la résolution npm explicite. Les spécifications de paquets sans préfixe s’installent aussi directement depuis npm pendant la transition de lancement.

    Les spécifications sans préfixe et `@latest` restent sur le canal stable. Si npm résout l’une d’elles vers une préversion, OpenClaw s’arrête et vous demande d’accepter explicitement avec un tag de préversion comme `@beta`/`@rc` ou une version de préversion exacte comme `@1.2.3-beta.4`.

    Si une spécification d’installation sans préfixe correspond à un id de plugin officiel (par exemple `diffs`), OpenClaw installe directement l’entrée du catalogue. Pour installer un paquet npm portant le même nom, utilisez une spécification à scope explicite (par exemple `@scope/diffs`).

  </Accordion>
  <Accordion title="Dépôts Git">
    Utilisez `git:<repo>` pour installer directement depuis un dépôt git. Les formes prises en charge incluent `git:github.com/owner/repo`, `git:owner/repo`, les URLs de clonage complètes `https://`, `ssh://`, `git://`, `file://` et `git@host:owner/repo.git`. Ajoutez `@<ref>` ou `#<ref>` pour extraire une branche, un tag ou un commit avant l’installation.

    Les installations Git clonent dans un répertoire temporaire, extraient la référence demandée lorsqu’elle est présente, puis utilisent l’installateur normal de répertoire de plugin. Cela signifie que la validation du manifeste, l’analyse de code dangereux, l’installation par le gestionnaire de paquets et les enregistrements d’installation se comportent comme pour les installations npm. Les installations git enregistrées incluent l’URL/la référence source ainsi que le commit résolu afin que `openclaw plugins update` puisse résoudre à nouveau la source plus tard.

    Après une installation depuis git, utilisez `openclaw plugins inspect <id> --runtime --json` pour vérifier les enregistrements d’exécution comme les méthodes Gateway et les commandes CLI. Si le plugin a enregistré une racine CLI avec `api.registerCli`, exécutez cette commande directement via la CLI racine d’OpenClaw, par exemple `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    Archives prises en charge : `.zip`, `.tgz`, `.tar.gz`, `.tar`. Les archives de plugins OpenClaw natifs doivent contenir un `openclaw.plugin.json` valide à la racine du plugin extrait ; les archives qui ne contiennent que `package.json` sont rejetées avant qu’OpenClaw écrive les enregistrements d’installation.

    Les installations depuis la place de marché Claude sont également prises en charge.

  </Accordion>
</AccordionGroup>

Les installations ClawHub utilisent un localisateur explicite `clawhub:<package>` :

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Les spécifications de plugins compatibles npm sans préfixe s’installent depuis npm par défaut pendant la transition de lancement :

```bash
openclaw plugins install openclaw-codex-app-server
```

Utilisez `npm:` pour rendre explicite une résolution limitée à npm :

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw vérifie l’API de plugin annoncée / la compatibilité Gateway minimale avant l’installation. Lorsque la version ClawHub sélectionnée publie un artefact ClawPack, OpenClaw télécharge le `.tgz` npm-pack versionné, vérifie l’en-tête de digest ClawHub et le digest de l’artefact, puis l’installe via le chemin d’archive normal. Les anciennes versions ClawHub sans métadonnées ClawPack s’installent encore via l’ancien chemin de vérification d’archive de paquet. Les installations enregistrées conservent leurs métadonnées de source ClawHub, le type d’artefact, l’intégrité npm, le shasum npm, le nom du tarball et les informations de digest ClawPack pour les mises à jour ultérieures.
Les installations ClawHub non versionnées conservent une spécification enregistrée non versionnée afin que `openclaw plugins update` puisse suivre les nouvelles versions ClawHub ; les sélecteurs explicites de version ou de tag comme `clawhub:pkg@1.2.3` et `clawhub:pkg@beta` restent épinglés à ce sélecteur.

#### Raccourci de place de marché

Utilisez le raccourci `plugin@marketplace` lorsque le nom de la place de marché existe dans le cache de registre local de Claude à `~/.claude/plugins/known_marketplaces.json` :

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Utilisez `--marketplace` lorsque vous voulez transmettre explicitement la source de la place de marché :

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Sources de marketplace">
    - un nom de marketplace connu de Claude depuis `~/.claude/plugins/known_marketplaces.json`
    - une racine de marketplace locale ou un chemin `marketplace.json`
    - un raccourci de dépôt GitHub comme `owner/repo`
    - une URL de dépôt GitHub comme `https://github.com/owner/repo`
    - une URL git

  </Tab>
  <Tab title="Règles des marketplaces distantes">
    Pour les marketplaces distantes chargées depuis GitHub ou git, les entrées de plugins doivent rester à l’intérieur du dépôt de marketplace cloné. OpenClaw accepte les sources de chemin relatif depuis ce dépôt et rejette les sources de Plugin HTTP(S), à chemin absolu, git, GitHub et autres sources de Plugin qui ne sont pas des chemins dans les manifestes distants.
  </Tab>
</Tabs>

Pour les chemins et archives locaux, OpenClaw détecte automatiquement :

- les plugins OpenClaw natifs (`openclaw.plugin.json`)
- les bundles compatibles Codex (`.codex-plugin/plugin.json`)
- les bundles compatibles Claude (`.claude-plugin/plugin.json` ou la disposition par défaut des composants Claude)
- les bundles compatibles Cursor (`.cursor-plugin/plugin.json`)

<Note>
Les bundles compatibles s’installent dans la racine normale des plugins et participent au même flux list/info/enable/disable. Aujourd’hui, les Skills de bundle, les Skills de commande Claude, les valeurs par défaut Claude `settings.json`, les valeurs par défaut Claude `.lsp.json` / `lspServers` déclarées par le manifeste, les Skills de commande Cursor et les répertoires de hooks Codex compatibles sont pris en charge ; les autres capacités de bundle détectées sont affichées dans les diagnostics/info, mais ne sont pas encore câblées dans l’exécution runtime.
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
  Passer de la vue en tableau à des lignes de détail par Plugin avec les métadonnées de source/origine/version/activation.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventaire lisible par machine, plus diagnostics du registre et état d’installation des dépendances de package.
</ParamField>

<Note>
`plugins list` lit d’abord le registre local persistant des plugins, avec un repli dérivé uniquement du manifeste lorsque le registre est manquant ou invalide. C’est utile pour vérifier si un Plugin est installé, activé et visible pour la planification d’un démarrage à froid, mais ce n’est pas une sonde runtime en direct d’un processus Gateway déjà en cours d’exécution. Après avoir modifié le code d’un Plugin, son activation, sa politique de hooks ou `plugins.load.paths`, redémarrez le Gateway qui sert le canal avant d’attendre l’exécution du nouveau code `register(api)` ou des hooks. Pour les déploiements distants/conteneurisés, vérifiez que vous redémarrez l’enfant `openclaw gateway run` réel, et pas seulement un processus d’enveloppe.

`plugins list --json` inclut le `dependencyStatus` de chaque Plugin depuis les
`dependencies` et `optionalDependencies` de `package.json`. OpenClaw vérifie si ces noms de package
sont présents le long du chemin de recherche Node `node_modules` normal du Plugin ; il
n’importe pas le code runtime du Plugin, n’exécute pas de gestionnaire de packages et ne répare pas les
dépendances manquantes.
</Note>

`plugins search` est une recherche dans le catalogue ClawHub distant. Elle n’inspecte pas l’état
local, ne modifie pas la configuration, n’installe pas de packages et ne charge pas le code runtime du Plugin. Les
résultats de recherche incluent le nom du package ClawHub, la famille, le canal, la version, le résumé et
une indication d’installation comme `openclaw plugins install clawhub:<package>`.

Pour travailler sur un Plugin inclus dans une image Docker empaquetée, montez en liaison le répertoire
source du Plugin par-dessus le chemin source empaqueté correspondant, comme
`/app/extensions/synology-chat`. OpenClaw découvrira cette superposition de source montée
avant `/app/dist/extensions/synology-chat` ; un simple répertoire source copié
reste inerte, de sorte que les installations empaquetées normales continuent d’utiliser le dist compilé.

Pour le débogage des hooks runtime :

- `openclaw plugins inspect <id> --runtime --json` affiche les hooks enregistrés et les diagnostics issus d’une passe d’inspection avec module chargé. L’inspection runtime n’installe jamais de dépendances ; utilisez `openclaw doctor --fix` pour nettoyer l’état des dépendances héritées ou installer les plugins téléchargeables configurés manquants.
- `openclaw gateway status --deep --require-rpc` confirme le Gateway joignable, les indications de service/processus, le chemin de configuration et la santé RPC.
- Les hooks de conversation non inclus (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) exigent `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Utilisez `--link` pour éviter de copier un répertoire local (ajoute à `plugins.load.paths`) :

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` n’est pas pris en charge avec `--link`, car les installations liées réutilisent le chemin source au lieu de copier par-dessus une cible d’installation gérée.

Utilisez `--pin` sur les installations npm pour enregistrer la spécification exacte résolue (`name@version`) dans l’index des plugins gérés tout en conservant le comportement par défaut non épinglé.
</Note>

### Index des plugins

Les métadonnées d’installation des plugins sont un état géré par machine, pas une configuration utilisateur. Les installations et mises à jour les écrivent dans `plugins/installs.json` sous le répertoire d’état OpenClaw actif. Sa carte de premier niveau `installRecords` est la source durable des métadonnées d’installation, y compris les enregistrements pour les manifestes de Plugin cassés ou manquants. Le tableau `plugins` est le cache du registre à froid dérivé du manifeste. Le fichier inclut un avertissement de ne pas modifier et est utilisé par `openclaw plugins update`, la désinstallation, les diagnostics et le registre à froid des plugins.

Quand OpenClaw voit des enregistrements hérités livrés `plugins.installs` dans la configuration, il les déplace dans l’index des plugins et supprime la clé de configuration ; si l’une des écritures échoue, les enregistrements de configuration sont conservés afin que les métadonnées d’installation ne soient pas perdues.

### Désinstaller

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` supprime les enregistrements de Plugin de `plugins.entries`, de l’index persistant des plugins, des entrées de liste d’autorisation/refus de Plugin et des entrées liées `plugins.load.paths` le cas échéant. Sauf si `--keep-files` est défini, la désinstallation supprime aussi le répertoire d’installation gérée suivi lorsqu’il se trouve dans la racine des extensions de Plugin d’OpenClaw. Pour les plugins de mémoire active, l’emplacement mémoire revient à `memory-core`.

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

Les mises à jour s’appliquent aux installations de Plugin suivies dans l’index des plugins gérés et aux installations de hook-packs suivies dans `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Résolution de l’id de Plugin par rapport à la spec npm">
    Quand vous transmettez un id de Plugin, OpenClaw réutilise la spec d’installation enregistrée pour ce Plugin. Cela signifie que les dist-tags précédemment stockés comme `@beta` et les versions exactes épinglées continuent d’être utilisés lors des exécutions ultérieures de `update <id>`.

    Pour les installations npm, vous pouvez aussi transmettre une spec de package npm explicite avec un dist-tag ou une version exacte. OpenClaw résout ce nom de package vers l’enregistrement de Plugin suivi, met à jour ce Plugin installé et enregistre la nouvelle spec npm pour les futures mises à jour basées sur l’id.

    Transmettre le nom du package npm sans version ni balise se résout aussi vers l’enregistrement de Plugin suivi. Utilisez cela lorsqu’un Plugin était épinglé à une version exacte et que vous voulez le ramener à la ligne de version par défaut du registre.

  </Accordion>
  <Accordion title="Mises à jour du canal bêta">
    `openclaw plugins update` réutilise la spec de Plugin suivie sauf si vous transmettez une nouvelle spec. `openclaw update` connaît en plus le canal de mise à jour OpenClaw actif : sur le canal bêta, les enregistrements de Plugin npm et ClawHub de ligne par défaut essaient d’abord `@beta`, puis reviennent à la spec par défaut/latest enregistrée si aucune version bêta du Plugin n’existe. Les versions exactes et balises explicites restent épinglées à ce sélecteur.

  </Accordion>
  <Accordion title="Vérifications de version et dérive d’intégrité">
    Avant une mise à jour npm en direct, OpenClaw vérifie la version du package installé par rapport aux métadonnées du registre npm. Si la version installée et l’identité de l’artefact enregistrée correspondent déjà à la cible résolue, la mise à jour est ignorée sans téléchargement, réinstallation ni réécriture de `openclaw.json`.

    Lorsqu’un hachage d’intégrité stocké existe et que le hachage de l’artefact récupéré change, OpenClaw traite cela comme une dérive d’artefact npm. La commande interactive `openclaw plugins update` affiche les hachages attendu et réel, puis demande confirmation avant de continuer. Les assistants de mise à jour non interactifs échouent fermement sauf si l’appelant fournit une politique de continuation explicite.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install lors d’une mise à jour">
    `--dangerously-force-unsafe-install` est aussi disponible sur `plugins update` comme contournement d’urgence pour les faux positifs de l’analyse de code dangereux intégrée pendant les mises à jour de Plugin. Il ne contourne toujours pas les blocages de politique `before_install` du Plugin ni le blocage des échecs d’analyse, et il s’applique uniquement aux mises à jour de Plugin, pas aux mises à jour de hook-pack.
  </Accordion>
</AccordionGroup>

### Inspecter

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect affiche l’identité, l’état de chargement, la source, les capacités du manifeste, les indicateurs de politique, les diagnostics, les métadonnées d’installation, les capacités de bundle et toute prise en charge de serveur MCP ou LSP détectée, sans importer le runtime du Plugin par défaut. Ajoutez `--runtime` pour charger le module du Plugin et inclure les hooks, outils, commandes, services, méthodes Gateway et routes HTTP enregistrés. L’inspection runtime signale directement les dépendances de Plugin manquantes ; les installations et réparations restent dans `openclaw plugins install`, `openclaw plugins update` et `openclaw doctor --fix`.

Les commandes CLI détenues par un Plugin sont installées comme groupes de commandes racine `openclaw`. Après que `inspect --runtime` affiche une commande sous `cliCommands`, exécutez-la comme `openclaw <command> ...` ; par exemple, un Plugin qui enregistre `demo-git` peut être vérifié avec `openclaw demo-git ping`.

Chaque Plugin est classé selon ce qu’il enregistre réellement au runtime :

- **plain-capability** — un type de capacité (par exemple, un Plugin uniquement fournisseur)
- **hybrid-capability** — plusieurs types de capacités (par exemple, texte + parole + images)
- **hook-only** — uniquement des hooks, aucune capacité ni surface
- **non-capability** — outils/commandes/services mais aucune capacité

Voir [Formes de Plugin](/fr/plugins/architecture#plugin-shapes) pour en savoir plus sur le modèle de capacités.

<Note>
Le drapeau `--json` produit un rapport lisible par machine adapté aux scripts et aux audits. `inspect --all` rend un tableau à l’échelle du parc avec des colonnes de forme, de types de capacités, d’avis de compatibilité, de capacités de bundle et de résumé des hooks. `info` est un alias de `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` signale les erreurs de chargement de Plugin, les diagnostics de manifeste/découverte et les avis de compatibilité. Quand tout est propre, il affiche `No plugin issues detected.`

Pour les échecs de forme de module comme des exports `register`/`activate` manquants, relancez avec `OPENCLAW_PLUGIN_LOAD_DEBUG=1` pour inclure un résumé compact de la forme des exports dans la sortie de diagnostic.

### Registre

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Le registre local des plugins est le modèle de lecture à froid persistant d’OpenClaw pour l’identité, l’activation, les métadonnées de source et la propriété des contributions des plugins installés. Le démarrage normal, la recherche du propriétaire fournisseur, la classification de la configuration des canaux et l’inventaire des plugins peuvent le lire sans importer les modules runtime des plugins.

Utilisez `plugins registry` pour inspecter si le registre persistant est présent, actuel ou obsolète. Utilisez `--refresh` pour le reconstruire à partir de l’index persistant des plugins, de la politique de configuration et des métadonnées de manifeste/package. C’est un chemin de réparation, pas un chemin d’activation runtime.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` est un commutateur de compatibilité d’urgence obsolète pour les échecs de lecture du registre. Préférez `plugins registry --refresh` ou `openclaw doctor --fix` ; le repli par variable d’environnement est réservé à la récupération d’urgence au démarrage pendant le déploiement de la migration.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

La liste Marketplace accepte un chemin de marketplace local, un chemin `marketplace.json`, un raccourci GitHub comme `owner/repo`, une URL de dépôt GitHub ou une URL git. `--json` affiche le libellé de source résolu ainsi que le manifeste de marketplace analysé et les entrées de Plugin.

## Associés

- [Créer des plugins](/fr/plugins/building-plugins)
- [Référence CLI](/fr/cli)
- [Plugins de la communauté](/fr/plugins/community)
