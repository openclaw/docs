---
read_when:
    - Vous déboguez les installations de packages Plugin
    - Vous modifiez le comportement de démarrage du Plugin, de doctor ou de l’installation du gestionnaire de paquets
    - Vous maintenez des installations OpenClaw empaquetées ou des manifestes de Plugins intégrés
sidebarTitle: Dependencies
summary: Comment OpenClaw installe les packages de Plugins et résout les dépendances des Plugins
title: Résolution des dépendances de Plugin
x-i18n:
    generated_at: "2026-07-04T15:15:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: adc6cc80bfe4e4c06ca0e99877c0d4148861ff88366ae233c254aac56c7cdf6d
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw conserve le travail sur les dépendances des Plugins au moment de l'installation ou de la mise à jour. Le chargement à l'exécution
ne lance pas de gestionnaires de paquets, ne répare pas les arbres de dépendances et ne modifie pas le répertoire du package
OpenClaw.

## Répartition des responsabilités

Les packages de Plugins possèdent leur graphe de dépendances :

- les dépendances d'exécution résident dans les `dependencies` ou
  `optionalDependencies` du package de Plugin
- les imports SDK/core sont des pairs ou des imports fournis par OpenClaw
- les Plugins de développement local apportent leurs propres dépendances déjà installées
- les Plugins npm et git sont installés dans des racines de packages appartenant à OpenClaw

OpenClaw possède uniquement le cycle de vie du Plugin :

- découvrir la source du Plugin
- installer ou mettre à jour le package lorsque cela est explicitement demandé
- enregistrer les métadonnées d'installation
- charger le point d'entrée du Plugin
- échouer avec une erreur exploitable lorsque des dépendances sont manquantes

## Racines d'installation

OpenClaw utilise des racines stables par source :

- les packages npm s'installent dans des projets par Plugin sous
  `~/.openclaw/npm/projects/<encoded-package>`
- les packages git sont clonés sous `~/.openclaw/git`
- les installations locales/par chemin/par archive sont copiées ou référencées sans réparation des dépendances

Les installations npm s'exécutent dans cette racine de projet par Plugin avec :

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` utilise cette même racine de projet npm
par Plugin pour un tarball npm-pack local. OpenClaw lit les métadonnées npm du tarball,
l'ajoute au projet géré comme dépendance `file:` copiée, exécute
l'installation npm normale, puis vérifie les métadonnées du lockfile installé avant
de faire confiance au Plugin.
Cela est destiné aux preuves d'acceptation de package et de release candidate, lorsqu'un
artefact pack local doit se comporter comme l'artefact de registre qu'il simule.

Utilisez `npm-pack:` lorsque vous testez des packages de Plugins officiels ou externes avant
publication. Une archive brute ou une installation par chemin est utile pour le débogage local, mais elle
ne prouve pas le même chemin de dépendances qu'un package npm ou ClawHub installé.
`npm-pack:` prouve la forme d'installation du package géré ; ce n'est pas, à lui seul,
une preuve que le Plugin est un contenu officiel lié au catalogue.

Lorsque le comportement dépend du statut de Plugin groupé ou de Plugin officiel de confiance, associez
la preuve de package local à une installation officielle adossée au catalogue ou à un chemin de
package publié qui enregistre la confiance officielle. L'accès aux helpers privilégiés et la
gestion du périmètre officiel de confiance doivent être validés sur ce chemin d'installation de confiance,
et non déduits d'une installation de tarball local.

Si un Plugin échoue à l'exécution avec un import manquant, corrigez le manifeste du package
au lieu de réparer le projet géré à la main. Les imports d'exécution appartiennent aux
`dependencies` ou `optionalDependencies` du package de Plugin ; les `devDependencies` ne sont
pas installées pour les projets d'exécution gérés. Un `npm install` local dans
`~/.openclaw/npm/projects/<encoded-package>` peut débloquer un diagnostic temporaire,
mais ce n'est pas une preuve d'acceptation de package, car la prochaine installation ou mise à jour
recréera le projet à partir des métadonnées du package.

npm peut hisser des dépendances transitives vers le `node_modules` du projet par Plugin
à côté du package de Plugin. OpenClaw analyse la racine du projet géré
avant de faire confiance à l'installation et supprime ce projet lors de la désinstallation ; les
dépendances d'exécution hissées restent donc dans la limite de nettoyage de ce Plugin.

Les packages de Plugins npm publiés peuvent embarquer `npm-shrinkwrap.json`. npm utilise ce
lockfile publiable pendant l'installation, et la racine de projet npm gérée par OpenClaw
le prend en charge via le chemin d'installation npm normal. Les packages de Plugins publiables
appartenant à OpenClaw doivent inclure un shrinkwrap local au package, généré à partir du
graphe de dépendances publié de ce package de Plugin :

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

Le générateur retire les `devDependencies` du Plugin, applique la stratégie d'override de l'espace de travail
et écrit `extensions/<id>/npm-shrinkwrap.json` pour chaque Plugin
`publishToNpm`. Les packages de Plugins tiers peuvent également embarquer un shrinkwrap ;
OpenClaw ne l'exige pas pour les packages communautaires, mais npm le respectera
lorsqu'il est présent.

Avant de traiter un package local comme preuve de release candidate, inspectez le tarball
qui sera installé :

```bash
npm pack --pack-destination /tmp
tar -xOf /tmp/<plugin-package>.tgz package/package.json
tar -tf /tmp/<plugin-package>.tgz | grep '^package/dist/'
```

Pour les changements de dépendances, vérifiez aussi qu'une installation de production peut résoudre les
packages d'exécution sans dépendances de développement :

```bash
tmpdir=$(mktemp -d)
(
  cd "$tmpdir"
  npm init -y >/dev/null
  npm install --package-lock-only --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts /tmp/<plugin-package>.tgz
)
rm -rf "$tmpdir"
```

Les packages de Plugins npm appartenant à OpenClaw peuvent aussi être publiés avec des
`bundledDependencies` explicites. Le chemin de publication npm superpose la liste des noms
de dépendances d'exécution, supprime les métadonnées d'espace de travail réservées au développement du manifeste
du package publié, exécute une installation npm sans script pour les dépendances d'exécution
locales au package, puis emballe ou publie le tarball du Plugin avec ces fichiers de dépendances
inclus. Les packages lourds en code natif, notamment les runtimes Codex et ACP, se désinscrivent
avec `openclaw.release.bundleRuntimeDependencies: false` ; ces packages embarquent toujours
leur shrinkwrap, mais npm résout les dépendances d'exécution pendant l'installation
au lieu d'intégrer tous les binaires de plateforme dans le tarball du Plugin. Le package racine
`openclaw` ne groupe pas l'intégralité de son arbre de dépendances.

Les Plugins qui importent `openclaw/plugin-sdk/*` déclarent `openclaw` comme dépendance paire.
OpenClaw ne laisse pas npm installer une copie de registre séparée du package hôte
dans un projet géré, car des packages hôtes obsolètes peuvent affecter la résolution
des pairs npm dans ce Plugin. Les installations npm gérées ignorent la résolution/matérialisation
des pairs npm, et OpenClaw réaffirme les liens `node_modules/openclaw` locaux au Plugin
pour les packages installés qui déclarent le pair hôte après l'installation ou la mise à jour.

Les installations git clonent ou actualisent le dépôt, puis exécutent :

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Le Plugin installé se charge ensuite depuis ce répertoire de package ; la résolution
`node_modules` locale au package et parente fonctionne donc de la même façon que pour un package
Node normal.

## Plugins locaux

Les Plugins locaux sont traités comme des répertoires contrôlés par le développeur. OpenClaw ne
lance pas `npm install`, `pnpm install` ni de réparation des dépendances pour eux. Si un Plugin
local a des dépendances, installez-les dans ce Plugin avant de le charger.

Les Plugins TypeScript locaux tiers peuvent utiliser le chemin d'urgence Jiti. Les Plugins
JavaScript packagés et les Plugins internes groupés se chargent via
import/require natif au lieu de Jiti.

## Démarrage et rechargement

Le démarrage du Gateway et le rechargement de la configuration n'installent jamais les dépendances des Plugins. Ils lisent
les enregistrements d'installation des Plugins, calculent le point d'entrée et le chargent.

Si une dépendance est manquante à l'exécution, le Plugin échoue à se charger et l'erreur
doit indiquer à l'opérateur une correction explicite :

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` peut nettoyer l'état de dépendances hérité généré par OpenClaw et récupérer
les Plugins téléchargeables absents des enregistrements d'installation locaux lorsque la configuration
les référence. Doctor ne répare pas les dépendances d'un Plugin local déjà installé.

## Plugins groupés

Les Plugins groupés légers et critiques pour le noyau sont livrés avec OpenClaw.
Ils ne doivent soit pas avoir d'arbre de dépendances d'exécution lourd, soit être déplacés vers un
package téléchargeable sur ClawHub/npm.

Pour la liste générée actuelle des Plugins livrés dans le package core, installés
en externe ou conservés uniquement sous forme de source, consultez [Inventaire des Plugins](/fr/plugins/plugin-inventory).

Les manifestes de Plugins groupés ne doivent pas demander de préparation des dépendances. Les fonctionnalités
de Plugin volumineuses ou optionnelles doivent être packagées comme un Plugin normal et installées via
le même chemin npm/git/ClawHub que les Plugins tiers.

Dans les checkouts source, OpenClaw traite le dépôt comme un monorepo pnpm. Après
`pnpm install`, les Plugins groupés se chargent depuis `extensions/<id>`, de sorte que les dépendances
d'espace de travail locales au package sont disponibles et les modifications sont prises en compte directement. Le développement
depuis un checkout source est réservé à pnpm ; un simple `npm install` à la racine du dépôt
n'est pas une méthode prise en charge pour préparer les dépendances des Plugins groupés.

| Forme d'installation             | Emplacement du Plugin groupé          | Propriétaire des dépendances                                          |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Arbre d'exécution construit dans le package | Package OpenClaw et flux explicites d'installation/mise à jour/doctor des Plugins |
| Checkout Git plus `pnpm install` | Packages d'espace de travail `extensions/<id>` | L'espace de travail pnpm, y compris les propres dépendances de chaque package de Plugin |
| `openclaw plugins install ...`   | Racine de projet npm/git/ClawHub gérée | Le flux d'installation/mise à jour du Plugin                         |

## Nettoyage hérité

Les anciennes versions d'OpenClaw généraient des racines de dépendances de Plugins groupés au démarrage ou
pendant une réparation doctor. Le nettoyage doctor actuel supprime ces répertoires et
liens symboliques obsolètes lorsque `--fix` est utilisé, y compris les anciennes racines `plugin-runtime-deps`, les liens symboliques
de packages de préfixe Node global qui pointent vers des cibles `plugin-runtime-deps` élaguées,
les manifestes `.openclaw-runtime-deps*`, les `node_modules` de Plugins générés, les répertoires
d'étape d'installation et les stores pnpm locaux aux packages. Le postinstall packagé supprime aussi
ces liens symboliques globaux avant d'élaguer les racines cibles héritées, afin que les mises à niveau
ne laissent pas d'imports de packages ESM pendants.

Les anciennes installations npm utilisaient aussi une racine partagée `~/.openclaw/npm/node_modules`.
Les flux actuels d'installation, de mise à jour, de désinstallation et doctor reconnaissent encore cette racine plate héritée
uniquement pour la récupération et le nettoyage. Les nouvelles installations npm doivent créer
des racines de projets par Plugin à la place.
