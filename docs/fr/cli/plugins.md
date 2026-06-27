---
read_when:
    - Vous souhaitez installer ou gérer des plugins Gateway ou des bundles compatibles
    - Vous voulez générer l’ossature ou valider un Plugin d’outil simple
    - Vous voulez déboguer les échecs de chargement des plugins
sidebarTitle: Plugins
summary: Référence CLI pour `openclaw plugins` (init, build, validate, list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-06-27T17:20:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b4366a862f6a8996b38b624760eef407969f35a7451e3b2a1d5e82746d73b678
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
openclaw plugins init my-tool --name "My Tool"
openclaw plugins init my-provider --name "My Provider" --type provider
openclaw plugins init my-provider --name "My Provider" --type provider --directory ./my-provider
openclaw plugins build --entry ./dist/index.js
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
```

Pour enquêter sur une installation, une inspection, une désinstallation ou une actualisation du registre lente, exécutez la
commande avec `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. La trace écrit les temps de phase
sur stderr et conserve la sortie JSON analysable. Consultez [Débogage](/fr/help/debugging#plugin-lifecycle-trace).

<Note>
En mode Nix (`OPENCLAW_NIX_MODE=1`), les mutateurs de cycle de vie des plugins sont désactivés. Utilisez plutôt la source Nix pour cette installation au lieu de `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` ou `plugins disable`; pour nix-openclaw, utilisez le [Démarrage rapide](https://github.com/openclaw/nix-openclaw#quick-start) orienté agent.
</Note>

<Note>
Les plugins intégrés sont livrés avec OpenClaw. Certains sont activés par défaut (par exemple les fournisseurs de modèles intégrés, les fournisseurs vocaux intégrés et le plugin de navigateur intégré) ; d’autres nécessitent `plugins enable`.

Les plugins OpenClaw natifs doivent livrer `openclaw.plugin.json` avec un schéma JSON en ligne (`configSchema`, même vide). Les bundles compatibles utilisent plutôt leurs propres manifestes de bundle.

`plugins list` affiche `Format: openclaw` ou `Format: bundle`. La sortie détaillée de list/info affiche aussi le sous-type de bundle (`codex`, `claude` ou `cursor`) ainsi que les capacités de bundle détectées.
</Note>

### Auteur

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` crée par défaut un plugin d’outil TypeScript minimal. Le premier
argument est l’id du plugin ; passez `--name` pour le nom d’affichage. OpenClaw utilise
l’id pour le répertoire de sortie par défaut et le nommage du package. Les échafaudages d’outils utilisent
`defineToolPlugin`.
`plugins build` importe le point d’entrée construit, lit ses métadonnées statiques d’outil, écrit
`openclaw.plugin.json` et maintient `openclaw.extensions` de `package.json` aligné.
`plugins validate` vérifie que le manifeste généré, les métadonnées du package et
l’export actuel du point d’entrée concordent toujours. Consultez [Plugins d’outils](/fr/plugins/tool-plugins) pour
le workflow complet de création d’outils.

L’échafaudage écrit du code source TypeScript, mais génère les métadonnées depuis le point d’entrée construit
`./dist/index.js`, de sorte que le workflow fonctionne aussi avec la CLI publiée. Utilisez
`--entry <path>` lorsque le point d’entrée n’est pas le point d’entrée par défaut du package. Utilisez
`plugins build --check` dans la CI pour échouer lorsque les métadonnées générées sont obsolètes sans
réécrire les fichiers.

### Échafaudage de fournisseur

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

Les échafaudages de fournisseur créent un plugin générique de fournisseur de texte/modèle avec une
plomberie de clé d’API compatible OpenAI, un script `npm run validate` intégré pour `clawhub package
validate`, des métadonnées de package ClawHub et un workflow GitHub déclenché manuellement
pour une future publication de confiance via GitHub Actions OIDC. Les échafaudages de fournisseur ne
génèrent pas de Skills et n’utilisent pas `openclaw plugins build` ni
`openclaw plugins validate` ; ces commandes sont destinées au chemin de métadonnées générées de
l’échafaudage d’outil.

Avant la publication, remplacez l’URL de base d’API, le catalogue de modèles, la route de documentation,
le texte des identifiants et le contenu du README de remplacement par de vrais détails de fournisseur. Utilisez le
README généré pour la première publication ClawHub et la configuration de l’éditeur de confiance.

### Installer

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # source auto-detection
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install npm-pack:<path.tgz>            # local npm pack through npm install semantics
openclaw plugins install git:github.com/<owner>/<repo>  # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

Les mainteneurs qui testent les installations au moment de la configuration peuvent remplacer les sources automatiques d’installation de plugins
avec des variables d’environnement protégées. Consultez
[Remplacements d’installation de plugins](/fr/plugins/install-overrides).

<Warning>
Les noms de package nus s’installent depuis npm par défaut pendant la transition de lancement, sauf s’ils correspondent à un id de plugin officiel. Les spécifications brutes de package `@openclaw/*` qui correspondent à des plugins intégrés utilisent la copie intégrée livrée avec la build OpenClaw actuelle. Utilisez `npm:<package>` lorsque vous voulez délibérément un package npm externe à la place. Utilisez `clawhub:<package>` pour ClawHub. Traitez les installations de plugins comme l’exécution de code. Préférez les versions épinglées.
</Warning>

`plugins search` interroge ClawHub pour trouver des packages de plugins installables et affiche
des noms de package prêts à installer. La recherche porte sur les packages code-plugin et bundle-plugin,
pas sur les Skills. Utilisez `openclaw skills search` pour les Skills ClawHub.

<Note>
ClawHub est la principale surface de distribution et de découverte pour la plupart des plugins. Npm
reste une solution de repli prise en charge et un chemin d’installation directe. Les packages de plugins
`@openclaw/*` appartenant à OpenClaw sont de nouveau publiés sur npm ; consultez la liste actuelle
sur [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) ou l’
[inventaire des plugins](/fr/plugins/plugin-inventory). Les installations stables utilisent `latest`.
Les installations et mises à jour du canal bêta préfèrent le dist-tag npm `beta` lorsque cette balise
est disponible, puis se replient sur `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Inclus de configuration et réparation de configuration invalide">
    Si votre section `plugins` est adossée à un `$include` à fichier unique, `plugins install/update/enable/disable/uninstall` écrit dans ce fichier inclus et laisse `openclaw.json` intact. Les inclus racine, les tableaux d’inclus et les inclus avec des remplacements frères échouent de manière fermée au lieu d’être aplatis. Consultez [Inclus de configuration](/fr/gateway/configuration) pour les formes prises en charge.

    Si la configuration est invalide pendant l’installation, `plugins install` échoue normalement de manière fermée et vous indique d’exécuter d’abord `openclaw doctor --fix`. Au démarrage du Gateway et lors du rechargement à chaud, une configuration de plugin invalide échoue de manière fermée comme toute autre configuration invalide ; `openclaw doctor --fix` peut mettre en quarantaine l’entrée de plugin invalide. La seule exception documentée au moment de l’installation est un chemin étroit de récupération de plugin intégré pour les plugins qui optent explicitement pour `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force et réinstallation plutôt que mise à jour">
    `--force` réutilise la cible d’installation existante et écrase sur place un plugin ou un pack de hooks déjà installé. Utilisez-le lorsque vous réinstallez intentionnellement le même id depuis un nouveau chemin local, une archive, un package ClawHub ou un artefact npm. Pour les mises à niveau courantes d’un plugin npm déjà suivi, préférez `openclaw plugins update <id-or-npm-spec>`.

    Si vous exécutez `plugins install` pour un id de plugin déjà installé, OpenClaw s’arrête et vous oriente vers `plugins update <id-or-npm-spec>` pour une mise à niveau normale, ou vers `plugins install <package> --force` lorsque vous voulez réellement écraser l’installation actuelle depuis une source différente.

  </Accordion>
  <Accordion title="Portée de --pin">
    `--pin` s’applique uniquement aux installations npm. Il n’est pas pris en charge avec les installations `git:` ; utilisez une référence git explicite comme `git:github.com/acme/plugin@v1.2.3` lorsque vous voulez une source épinglée. Il n’est pas pris en charge avec `--marketplace`, car les installations de marketplace persistent les métadonnées de source de marketplace au lieu d’une spécification npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` est obsolète et ne fait désormais rien. OpenClaw n’exécute plus de blocage intégré de code dangereux au moment de l’installation pour les installations de plugins.

    Utilisez la surface partagée `security.installPolicy` appartenant à l’opérateur lorsqu’une politique d’installation propre à l’hôte est requise. Les hooks `before_install` de plugin sont des hooks de cycle de vie du runtime de plugin et ne constituent pas la principale frontière de politique pour les installations CLI.

    Si un plugin que vous avez publié sur ClawHub est masqué ou bloqué par une analyse du registre, utilisez les étapes éditeur dans [Publication ClawHub](/fr/clawhub/publishing). `--dangerously-force-unsafe-install` ne demande pas à ClawHub de réanalyser le plugin ni de rendre publique une version bloquée.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    Les installations ClawHub communautaires vérifient l’enregistrement de confiance de la version sélectionnée avant de télécharger le package. Si ClawHub désactive le téléchargement pour la version, signale des résultats d’analyse malveillants ou place la version dans un état de modération bloquant comme la quarantaine, OpenClaw refuse la version. Pour les statuts d’analyse risqués non bloquants, les états de modération risqués ou les raisons de registre, OpenClaw affiche les détails de confiance et demande confirmation avant de continuer.

    Utilisez `--acknowledge-clawhub-risk` uniquement après avoir examiné l’avertissement ClawHub et décidé de continuer sans invite interactive. Les enregistrements de confiance propres en attente ou obsolètes avertissent, mais ne nécessitent pas d’accusé de réception. Les packages ClawHub officiels et les sources de plugins OpenClaw intégrés contournent cette invite de confiance de version.

  </Accordion>
  <Accordion title="Packs de hooks et spécifications npm">
    `plugins install` est aussi la surface d’installation pour les packs de hooks qui exposent `openclaw.hooks` dans `package.json`. Utilisez `openclaw hooks` pour une visibilité filtrée des hooks et l’activation par hook, pas pour l’installation de packages.

    Les spécifications npm sont **réservées au registre** (nom de package + **version exacte** ou **dist-tag** facultatif). Les spécifications Git/URL/fichier et les plages semver sont rejetées. Les installations de dépendances s’exécutent dans un projet npm géré par plugin avec `--ignore-scripts` pour la sécurité, même lorsque votre shell a des paramètres globaux d’installation npm. Les projets npm de plugins gérés héritent des `overrides` npm au niveau package d’OpenClaw, donc les épingles de sécurité de l’hôte s’appliquent aussi aux dépendances de plugins hissées.

    Utilisez `npm:<package>` lorsque vous voulez rendre la résolution npm explicite. Les spécifications de package nues s’installent aussi directement depuis npm pendant la transition de lancement, sauf si elles correspondent à un id de plugin officiel.

    Les spécifications de packages brutes `@openclaw/*` qui correspondent à des plugins groupés se résolvent vers la copie groupée appartenant à l’image avant le repli npm. Par exemple, `openclaw plugins install @openclaw/discord@2026.5.20 --pin` utilise le plugin Discord groupé de la version actuelle d’OpenClaw au lieu de créer un remplacement npm géré. Pour forcer le package npm externe, utilisez `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`.

    Les spécifications nues et `@latest` restent sur la piste stable. Les versions de correction horodatées d’OpenClaw comme `2026.5.3-1` sont des versions stables pour cette vérification. Si npm résout l’une d’elles vers une préversion, OpenClaw s’arrête et vous demande d’opter explicitement pour une balise de préversion comme `@beta`/`@rc` ou une version de préversion exacte comme `@1.2.3-beta.4`.

    Pour les installations npm sans version exacte (`npm:<package>` ou `npm:<package>@latest`), OpenClaw vérifie les métadonnées du package résolu avant l’installation. Si le dernier package stable requiert une API de plugin OpenClaw plus récente ou une version minimale d’hôte plus récente, OpenClaw inspecte les anciennes versions stables et installe plutôt la version compatible la plus récente. Les versions exactes et les dist-tags explicites comme `@beta` restent stricts : si le package sélectionné est incompatible, la commande échoue et vous demande de mettre à niveau OpenClaw ou de choisir une version compatible.

    Si une spécification d’installation nue correspond à un identifiant de plugin officiel (par exemple `diffs`), OpenClaw installe directement l’entrée du catalogue. Pour installer un package npm portant le même nom, utilisez une spécification explicitement scoped (par exemple `@scope/diffs`).

  </Accordion>
  <Accordion title="Dépôts Git">
    Utilisez `git:<repo>` pour installer directement depuis un dépôt git. Les formes prises en charge incluent `git:github.com/owner/repo`, `git:owner/repo`, les URL de clonage complètes `https://`, `ssh://`, `git://`, `file://` et `git@host:owner/repo.git`. Ajoutez `@<ref>` ou `#<ref>` pour extraire une branche, une balise ou un commit avant l’installation.

    Les installations Git clonent dans un répertoire temporaire, extraient la référence demandée lorsqu’elle est présente, puis utilisent l’installateur de répertoire de plugin normal. Cela signifie que la validation du manifeste, la politique d’installation de l’opérateur, le travail d’installation du gestionnaire de packages et les enregistrements d’installation se comportent comme pour les installations npm. Les installations git enregistrées incluent l’URL/la référence source ainsi que le commit résolu afin que `openclaw plugins update` puisse résoudre à nouveau la source ultérieurement.

    Après une installation depuis git, utilisez `openclaw plugins inspect <id> --runtime --json` pour vérifier les enregistrements runtime comme les méthodes Gateway et les commandes CLI. Si le plugin a enregistré une racine CLI avec `api.registerCli`, exécutez cette commande directement via la CLI racine d’OpenClaw, par exemple `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    Archives prises en charge : `.zip`, `.tgz`, `.tar.gz`, `.tar`. Les archives de plugins OpenClaw natives doivent contenir un `openclaw.plugin.json` valide à la racine du plugin extrait ; les archives qui ne contiennent que `package.json` sont rejetées avant qu’OpenClaw n’écrive les enregistrements d’installation.

    Utilisez `npm-pack:<path.tgz>` lorsque le fichier est une archive tarball npm-pack et que vous voulez
    tester le même chemin de projet npm géré par plugin que celui utilisé par les installations
    depuis le registre, y compris la vérification de `package-lock.json`, l’analyse des dépendances
    hissées et les enregistrements d’installation npm. Les chemins d’archive simples s’installent toujours comme archives
    locales sous la racine des extensions de plugin.

    Les installations depuis la place de marché Claude sont également prises en charge.

  </Accordion>
</AccordionGroup>

Les installations ClawHub utilisent un localisateur explicite `clawhub:<package>` :

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Les spécifications de plugins compatibles npm nues s’installent depuis npm par défaut pendant la transition de lancement, sauf si elles correspondent à un identifiant de plugin officiel :

```bash
openclaw plugins install openclaw-codex-app-server
```

Utilisez `npm:` pour rendre explicite la résolution uniquement npm :

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw vérifie la compatibilité annoncée de l’API de plugin / du Gateway minimal avant l’installation. Lorsque la version ClawHub sélectionnée publie un artefact ClawPack, OpenClaw télécharge le `.tgz` npm-pack versionné, vérifie l’en-tête de condensé ClawHub et le condensé de l’artefact, puis l’installe via le chemin d’archive normal. Les anciennes versions de ClawHub sans métadonnées ClawPack s’installent toujours via l’ancien chemin de vérification d’archive de package. Les installations enregistrées conservent leurs métadonnées source ClawHub, le type d’artefact, l’intégrité npm, le shasum npm, le nom de la tarball et les faits de condensé ClawPack pour les mises à jour ultérieures.
Les installations ClawHub non versionnées conservent une spécification enregistrée non versionnée afin que `openclaw plugins update` puisse suivre les versions ClawHub plus récentes ; les sélecteurs explicites de version ou de balise comme `clawhub:pkg@1.2.3` et `clawhub:pkg@beta` restent épinglés à ce sélecteur.

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
  <Tab title="Sources de place de marché">
    - un nom de place de marché connue de Claude depuis `~/.claude/plugins/known_marketplaces.json`
    - une racine de place de marché locale ou un chemin `marketplace.json`
    - un raccourci de dépôt GitHub comme `owner/repo`
    - une URL de dépôt GitHub comme `https://github.com/owner/repo`
    - une URL git

  </Tab>
  <Tab title="Règles de place de marché distante">
    Pour les places de marché distantes chargées depuis GitHub ou git, les entrées de plugin doivent rester à l’intérieur du dépôt de place de marché cloné. OpenClaw accepte les sources de chemin relatif depuis ce dépôt et rejette les sources de plugin HTTP(S), à chemin absolu, git, GitHub et autres sources qui ne sont pas des chemins dans les manifestes distants.
  </Tab>
</Tabs>

Pour les chemins locaux et les archives, OpenClaw détecte automatiquement :

- les plugins OpenClaw natifs (`openclaw.plugin.json`)
- les bundles compatibles Codex (`.codex-plugin/plugin.json`)
- les bundles compatibles Claude (`.claude-plugin/plugin.json` ou la disposition de composants Claude par défaut)
- les bundles compatibles Cursor (`.cursor-plugin/plugin.json`)

Les installations locales gérées doivent être des répertoires de plugin ou des archives. Les fichiers de plugin autonomes `.js`,
`.mjs`, `.cjs` et `.ts` ne sont pas copiés dans la racine de plugins
gérés par `plugins install` ; listez-les plutôt explicitement dans `plugins.load.paths`.

<Note>
Les bundles compatibles s’installent dans la racine de plugins normale et participent au même flux liste/info/activation/désactivation. Aujourd’hui, les Skills de bundle, les Skills de commande Claude, les valeurs par défaut Claude `settings.json`, les valeurs par défaut Claude `.lsp.json` / `lspServers` déclarées par le manifeste, les Skills de commande Cursor et les répertoires de hooks Codex compatibles sont pris en charge ; les autres capacités de bundle détectées sont affichées dans les diagnostics/info, mais ne sont pas encore reliées à l’exécution runtime.
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
  Passer de la vue tableau à des lignes de détail par plugin avec les métadonnées source/origine/version/activation.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventaire lisible par machine, avec diagnostics de registre et état d’installation des dépendances de package.
</ParamField>

<Note>
`plugins list` lit d’abord le registre local persistant des plugins, avec un repli dérivé uniquement du manifeste lorsque le registre est absent ou invalide. C’est utile pour vérifier si un plugin est installé, activé et visible pour la planification du démarrage à froid, mais ce n’est pas une sonde runtime en direct d’un processus Gateway déjà en cours d’exécution. Après avoir changé le code d’un plugin, son activation, la politique de hook ou `plugins.load.paths`, redémarrez le Gateway qui sert le canal avant de vous attendre à ce que le nouveau code `register(api)` ou les hooks s’exécutent. Pour les déploiements distants/en conteneur, vérifiez que vous redémarrez bien l’enfant réel `openclaw gateway run`, et pas seulement un processus wrapper.

`plugins list --json` inclut le `dependencyStatus` de chaque plugin depuis les
`dependencies` et `optionalDependencies` de `package.json`. OpenClaw vérifie si ces noms de packages
sont présents le long du chemin de recherche Node `node_modules` normal du plugin ; il
n’importe pas le code runtime du plugin, n’exécute pas de gestionnaire de packages et ne répare pas les
dépendances manquantes.
</Note>

Si les journaux de démarrage indiquent `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`,
exécutez `openclaw plugins list --enabled --verbose` ou
`openclaw plugins inspect <id>` avec un identifiant de plugin listé pour confirmer les identifiants
des plugins et copier les identifiants approuvés dans `plugins.allow` dans `openclaw.json`. Lorsque
l’avertissement peut lister chaque plugin découvert, il affiche un extrait
`plugins.allow` prêt à coller qui inclut déjà ces identifiants. Si un plugin se charge
sans provenance d’installation/de chemin de chargement, inspectez cet identifiant de plugin, puis épinglez
l’identifiant approuvé dans `plugins.allow` ou réinstallez le plugin depuis une source approuvée
afin qu’OpenClaw enregistre la provenance d’installation.

`plugins search` est une recherche distante dans le catalogue ClawHub. Elle n’inspecte pas l’état
local, ne modifie pas la configuration, n’installe pas de packages et ne charge pas le code runtime du plugin. Les résultats de recherche
incluent le nom de package ClawHub, la famille, le canal, la version, le résumé et
une indication d’installation comme `openclaw plugins install clawhub:<package>`.

Pour le travail sur un plugin groupé dans une image Docker empaquetée, montez en bind le répertoire
source du plugin sur le chemin source empaqueté correspondant, comme
`/app/extensions/synology-chat`. OpenClaw découvrira cette superposition source montée
avant `/app/dist/extensions/synology-chat` ; un répertoire source simplement copié
reste inerte, de sorte que les installations empaquetées normales utilisent toujours le dist compilé.

Pour déboguer les hooks runtime :

- `openclaw plugins inspect <id> --runtime --json` affiche les hooks enregistrés et les diagnostics issus d’une passe d’inspection avec module chargé. L’inspection runtime n’installe jamais de dépendances ; utilisez `openclaw doctor --fix` pour nettoyer l’état hérité des dépendances ou récupérer les plugins téléchargeables manquants référencés par la configuration.
- `openclaw gateway status --deep --require-rpc` confirme l’URL/le profil Gateway joignable, les indications de service/processus, le chemin de configuration et la santé RPC.
- Les hooks de conversation non groupés (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) requièrent `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Utilisez `--link` pour éviter de copier un répertoire de plugin local (ajoute à `plugins.load.paths`) :

```bash
openclaw plugins install -l ./my-plugin
```

Les fichiers de plugin autonomes doivent être listés dans `plugins.load.paths` plutôt que
d’être installés avec `plugins install` ou placés directement dans `~/.openclaw/extensions`
ou `<workspace>/.openclaw/extensions`. Ces racines auto-découvertes chargent les
répertoires de packages ou de bundles de plugin, tandis que les fichiers de script de premier niveau sont traités comme des
helpers locaux et ignorés.

<Note>
Les plugins provenant d’une racine d’extensions de l’espace de travail ne sont pas
importés ni exécutés tant qu’ils ne sont pas explicitement activés. Pour le développement local,
exécutez `openclaw plugins enable <plugin-id>` ou définissez
`plugins.entries.<plugin-id>.enabled: true`; si votre configuration utilise
`plugins.allow`, incluez également le même id de plugin à cet endroit. Cette règle de refus par défaut
s’applique aussi lorsque la configuration d’un canal cible explicitement un plugin provenant de l’espace de travail pour un
chargement limité à la configuration, de sorte que le code de configuration du plugin de canal local ne s’exécutera pas tant que ce
plugin de l’espace de travail restera désactivé ou exclu de la liste d’autorisation. Les installations liées
et les entrées explicites `plugins.load.paths` suivent la politique normale pour leur
origine de plugin résolue. Voir
[Configurer la politique des plugins](/fr/tools/plugin#configure-plugin-policy)
et [Référence de configuration](/fr/gateway/configuration-reference#plugins).

`--force` n’est pas pris en charge avec `--link`, car les installations liées réutilisent le chemin source au lieu de copier par-dessus une cible d’installation gérée.

Utilisez `--pin` sur les installations npm pour enregistrer la spec exacte résolue (`name@version`) dans l’index des plugins gérés tout en conservant le comportement par défaut non épinglé.
</Note>

### Index des plugins

Les métadonnées d’installation des plugins sont un état géré par la machine, pas une configuration utilisateur. Les installations et mises à jour les écrivent dans la base de données d’état SQLite partagée sous le répertoire d’état OpenClaw actif. La ligne `installed_plugin_index` stocke les métadonnées durables `installRecords`, y compris les enregistrements pour les manifestes de plugin cassés ou manquants, ainsi qu’un cache de registre à froid dérivé du manifeste utilisé par `openclaw plugins update`, la désinstallation, les diagnostics et le registre de plugins à froid.

Quand OpenClaw voit des enregistrements hérités livrés `plugins.installs` dans la configuration, les lectures d’exécution les traitent comme une entrée de compatibilité sans réécrire `openclaw.json`. Les écritures explicites de plugins et `openclaw doctor --fix` déplacent ces enregistrements dans l’index des plugins et suppriment la clé de configuration lorsque les écritures de configuration sont autorisées ; si l’une des écritures échoue, les enregistrements de configuration sont conservés afin que les métadonnées d’installation ne soient pas perdues.

### Désinstaller

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` supprime les enregistrements de plugin de `plugins.entries`, de l’index de plugins persistant, des entrées de listes d’autorisation/refus de plugins et des entrées liées `plugins.load.paths` le cas échéant. Sauf si `--keep-files` est défini, la désinstallation supprime aussi le répertoire d’installation gérée suivi lorsqu’il se trouve dans la racine des extensions de plugins d’OpenClaw. Pour les plugins Active Memory, l’emplacement mémoire est réinitialisé à `memory-core`.

<Note>
`--keep-config` est pris en charge comme alias obsolète de `--keep-files`.
</Note>

### Mettre à jour

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Les mises à jour s’appliquent aux installations de plugins suivies dans l’index des plugins gérés et aux installations de hook-packs suivies dans `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Résolution de l’id de plugin par rapport à la spec npm">
    Lorsque vous passez un id de plugin, OpenClaw réutilise la spec d’installation enregistrée pour ce plugin. Cela signifie que les dist-tags précédemment stockés, comme `@beta`, et les versions exactes épinglées continuent d’être utilisés lors des exécutions ultérieures de `update <id>`.

    Cette règle de mise à jour ciblée est différente du chemin de maintenance global `openclaw plugins update --all`. Les mises à jour globales respectent toujours les specs d’installation suivies ordinaires, mais les enregistrements de plugins OpenClaw officiels de confiance peuvent se synchroniser avec la cible actuelle du catalogue officiel au lieu de rester sur un package officiel exact obsolète. Utilisez `update <id>` ciblé lorsque vous voulez intentionnellement conserver intacte une spec officielle exacte ou taguée.

    Pour les installations npm, vous pouvez aussi passer une spec de package npm explicite avec un dist-tag ou une version exacte. OpenClaw résout ce nom de package vers l’enregistrement de plugin suivi, met à jour ce plugin installé et enregistre la nouvelle spec npm pour les futures mises à jour basées sur l’id.

    Passer le nom du package npm sans version ni tag résout aussi vers l’enregistrement de plugin suivi. Utilisez cela lorsqu’un plugin était épinglé à une version exacte et que vous voulez le ramener à la ligne de publication par défaut du registre.

  </Accordion>
  <Accordion title="Mises à jour du canal bêta">
    `openclaw plugins update <id-or-npm-spec>` ciblé réutilise la spec de plugin suivie, sauf si vous passez une nouvelle spec. `openclaw plugins update --all` global utilise le `update.channel` configuré lorsqu’il synchronise les enregistrements de plugins officiels de confiance avec la cible du catalogue officiel, de sorte que les installations du canal bêta peuvent rester sur la ligne de publication bêta au lieu d’être silencieusement normalisées vers stable/latest.

    `openclaw update` connaît aussi le canal de mise à jour OpenClaw actif : sur le canal bêta, les enregistrements npm et de plugins ClawHub de ligne par défaut essaient d’abord `@beta`. Ils reviennent à la spec enregistrée default/latest si aucune publication bêta du plugin n’existe ; les plugins npm reviennent aussi en arrière lorsque le package bêta existe mais échoue à la validation d’installation. Ce repli est signalé comme un avertissement et ne fait pas échouer la mise à jour du cœur. Les versions exactes et tags explicites restent épinglés à ce sélecteur pour les mises à jour ciblées.

  </Accordion>
  <Accordion title="Vérifications de version et dérive d’intégrité">
    Avant une mise à jour npm en direct, OpenClaw vérifie la version du package installé par rapport aux métadonnées du registre npm. Si la version installée et l’identité d’artéfact enregistrée correspondent déjà à la cible résolue, la mise à jour est ignorée sans téléchargement, réinstallation ni réécriture de `openclaw.json`.

    Lorsqu’un hachage d’intégrité stocké existe et que le hachage de l’artéfact récupéré change, OpenClaw traite cela comme une dérive d’artéfact npm. La commande interactive `openclaw plugins update` affiche les hachages attendu et réel, puis demande confirmation avant de continuer. Les assistants de mise à jour non interactifs échouent en mode fermé sauf si l’appelant fournit une politique de continuation explicite.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install lors de la mise à jour">
    `--dangerously-force-unsafe-install` est aussi accepté sur `plugins update` pour compatibilité, mais il est obsolète et ne change plus le comportement de mise à jour des plugins. Le `security.installPolicy` de l’opérateur peut toujours bloquer les mises à jour ; les hooks de plugin `before_install` s’appliquent uniquement dans les processus où les hooks de plugin sont chargés.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk lors de la mise à jour">
    Les mises à jour de plugins communautaires adossés à ClawHub exécutent la même vérification de confiance de publication exacte que les installations avant de télécharger le package de remplacement. Utilisez `--acknowledge-clawhub-risk` pour les automatisations examinées qui doivent continuer lorsque la publication ClawHub sélectionnée comporte un avertissement de confiance risqué. Les packages ClawHub officiels et les sources de plugins OpenClaw groupées contournent cette invite de confiance de publication.
  </Accordion>
</AccordionGroup>

### Inspecter

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect affiche l’identité, l’état de chargement, la source, les capacités du manifeste, les indicateurs de politique, les diagnostics, les métadonnées d’installation, les capacités du bundle et toute prise en charge détectée de serveur MCP ou LSP, sans importer le runtime du plugin par défaut. La sortie JSON inclut les contrats de manifeste du plugin, comme `contracts.agentToolResultMiddleware` et `contracts.trustedToolPolicies`, afin que les opérateurs puissent auditer les déclarations de surfaces de confiance avant d’activer ou de redémarrer un plugin. Ajoutez `--runtime` pour charger le module du plugin et inclure les hooks, outils, commandes, services, méthodes Gateway et routes HTTP enregistrés. L’inspection runtime signale directement les dépendances de plugin manquantes ; les installations et réparations restent dans `openclaw plugins install`, `openclaw plugins update` et `openclaw doctor --fix`.

Les commandes CLI détenues par un plugin sont généralement installées comme groupes de commandes racine `openclaw`, mais les plugins peuvent aussi enregistrer des commandes imbriquées sous un parent du cœur tel que `openclaw nodes`. Après que `inspect --runtime` affiche une commande sous `cliCommands`, exécutez-la au chemin indiqué ; par exemple, un plugin qui enregistre `demo-git` peut être vérifié avec `openclaw demo-git ping`.

Chaque plugin est classé selon ce qu’il enregistre réellement à l’exécution :

- **plain-capability** — un type de capacité (par ex. un plugin uniquement fournisseur)
- **hybrid-capability** — plusieurs types de capacités (par ex. texte + voix + images)
- **hook-only** — uniquement des hooks, aucune capacité ni surface
- **non-capability** — outils/commandes/services mais aucune capacité

Voir [Formes de plugins](/fr/plugins/architecture#plugin-shapes) pour en savoir plus sur le modèle de capacités.

<Note>
L’indicateur `--json` produit un rapport lisible par machine adapté aux scripts et aux audits. `inspect --all` affiche un tableau à l’échelle du parc avec des colonnes de forme, types de capacités, avis de compatibilité, capacités du bundle et résumé des hooks. `info` est un alias de `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` signale les erreurs de chargement de plugins, les diagnostics de manifeste/découverte, les avis de compatibilité et les références obsolètes de configuration de plugins, comme les emplacements de plugins manquants. Lorsque l’arborescence d’installation et la configuration des plugins sont propres, il affiche `No plugin issues detected.` Si une configuration obsolète subsiste mais que l’arborescence d’installation est par ailleurs saine, le résumé l’indique au lieu de suggérer une santé complète des plugins.

Si un plugin configuré est présent sur disque mais bloqué par les vérifications de sécurité de chemin du chargeur, la validation de configuration conserve l’entrée du plugin et la signale comme `present but blocked`. Corrigez le diagnostic précédent de plugin bloqué, par exemple la propriété du chemin ou les permissions d’écriture mondiale, au lieu de supprimer la configuration `plugins.entries.<id>` ou `plugins.allow`.

Pour les échecs de forme de module, comme des exports `register`/`activate` manquants, réexécutez avec `OPENCLAW_PLUGIN_LOAD_DEBUG=1` pour inclure un résumé compact de la forme des exports dans la sortie de diagnostic.

### Registre

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Le registre local des plugins est le modèle de lecture à froid persistant d’OpenClaw pour l’identité des plugins installés, leur activation, les métadonnées de source et la propriété des contributions. Le démarrage normal, la recherche du propriétaire de fournisseur, la classification de configuration des canaux et l’inventaire des plugins peuvent le lire sans importer les modules runtime des plugins.

Utilisez `plugins registry` pour vérifier si le registre persistant est présent, à jour ou obsolète. Utilisez `--refresh` pour le reconstruire à partir de l’index persistant des plugins, de la politique de configuration et des métadonnées de manifeste/package. Il s’agit d’un chemin de réparation, pas d’un chemin d’activation runtime.

`openclaw doctor --fix` répare aussi la dérive npm gérée adjacente au registre : si un package `@openclaw/*` orphelin ou récupéré sous un projet npm de plugin géré ou sous l’ancienne racine npm gérée plate masque un plugin groupé, doctor supprime ce package obsolète et reconstruit le registre afin que le démarrage valide par rapport au manifeste groupé. Doctor relie aussi le package hôte `openclaw` dans les plugins npm gérés qui déclarent `peerDependencies.openclaw`, afin que les imports runtime locaux au package comme `openclaw/plugin-sdk/*` se résolvent après les mises à jour ou réparations npm.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` est un commutateur de compatibilité d’urgence obsolète pour les échecs de lecture du registre. Préférez `plugins registry --refresh` ou `openclaw doctor --fix` ; le repli par variable d’environnement est réservé à la récupération de démarrage d’urgence pendant le déploiement de la migration.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

La liste Marketplace accepte un chemin de marketplace local, un chemin `marketplace.json`, un raccourci GitHub comme `owner/repo`, une URL de dépôt GitHub ou une URL git. `--json` affiche le libellé de source résolu ainsi que le manifeste marketplace analysé et les entrées de plugins.

## Associé

- [Créer des plugins](/fr/plugins/building-plugins)
- [Référence CLI](/fr/cli)
- [ClawHub](/fr/clawhub)
