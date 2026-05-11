---
read_when:
    - Vous déboguez les installations de paquets de plugins
    - Vous modifiez le comportement de démarrage du Plugin, de doctor ou d’installation du gestionnaire de paquets
    - Vous maintenez des installations OpenClaw empaquetées ou des manifestes de Plugin intégrés
sidebarTitle: Dependencies
summary: Comment OpenClaw installe les paquets de plugins et résout les dépendances des plugins
title: Résolution des dépendances de Plugin
x-i18n:
    generated_at: "2026-05-11T20:45:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: eb9637f46f273de976ff9203d23558d8bb51922b347871bc71917ef61d3c04a3
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw conserve le travail sur les dépendances des Plugins au moment de l’installation/mise à jour. Le chargement à l’exécution
n’exécute pas de gestionnaires de packages, ne répare pas les arbres de dépendances et ne modifie pas le
répertoire du package OpenClaw.

## Répartition des responsabilités

Les packages de Plugin possèdent leur graphe de dépendances :

- les dépendances d’exécution vivent dans les `dependencies` ou
  `optionalDependencies` du package de Plugin
- les imports SDK/core sont des pairs ou des imports fournis par OpenClaw
- les Plugins de développement local apportent leurs propres dépendances déjà installées
- les Plugins npm et git sont installés dans des racines de packages appartenant à OpenClaw

OpenClaw possède uniquement le cycle de vie du Plugin :

- découvrir la source du Plugin
- installer ou mettre à jour le package quand cela est explicitement demandé
- enregistrer les métadonnées d’installation
- charger le point d’entrée du Plugin
- échouer avec une erreur exploitable lorsque des dépendances sont manquantes

## Racines d’installation

OpenClaw utilise des racines stables par source :

- les packages npm s’installent sous `~/.openclaw/npm`
- les packages git se clonent sous `~/.openclaw/git`
- les installations locales/par chemin/par archive sont copiées ou référencées sans réparation des dépendances

Les installations npm s’exécutent dans la racine npm avec :

```bash
cd ~/.openclaw/npm
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` utilise cette même racine npm gérée
pour une archive tarball npm-pack locale. OpenClaw lit les métadonnées npm de l’archive, l’ajoute
à la racine gérée comme dépendance `file:` copiée, exécute l’installation npm normale,
puis vérifie les métadonnées du lockfile installé avant de faire confiance au Plugin.
Ceci est destiné à la preuve d’acceptation de package et de release candidate, lorsqu’un
artefact pack local doit se comporter comme l’artefact de registre qu’il simule.

npm peut remonter des dépendances transitives vers `~/.openclaw/npm/node_modules` à côté
du package de Plugin. OpenClaw analyse la racine npm gérée avant de faire confiance à
l’installation et utilise npm pour supprimer les packages gérés par npm pendant la désinstallation, afin que les dépendances
d’exécution remontées restent dans la limite de nettoyage gérée.

Les Plugins qui importent `openclaw/plugin-sdk/*` déclarent `openclaw` comme dépendance pair.
OpenClaw ne laisse pas npm installer une copie séparée du package hôte depuis le registre
dans la racine gérée, car des packages hôtes obsolètes peuvent affecter la résolution des pairs par npm
lors d’installations ultérieures de Plugins. Les installations npm gérées ignorent la résolution/matérialisation
des pairs npm pour la racine partagée et OpenClaw réaffirme les liens
`node_modules/openclaw` locaux au Plugin pour les packages installés qui déclarent
le pair hôte après une installation, une mise à jour ou une désinstallation.

Les installations git clonent ou actualisent le dépôt, puis exécutent :

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Le Plugin installé se charge ensuite depuis ce répertoire de package, de sorte que la résolution
des `node_modules` locaux au package et parents fonctionne de la même manière que pour un package
Node normal.

## Plugins locaux

Les Plugins locaux sont traités comme des répertoires contrôlés par le développeur. OpenClaw n’exécute pas
`npm install`, `pnpm install` ni de réparation de dépendances pour eux. Si un
Plugin local a des dépendances, installez-les dans ce Plugin avant de le charger.

Les Plugins TypeScript locaux tiers peuvent utiliser le chemin d’urgence Jiti. Les Plugins
JavaScript empaquetés et les Plugins internes groupés se chargent via
import/require natif au lieu de Jiti.

## Démarrage et rechargement

Le démarrage du Gateway et le rechargement de la configuration n’installent jamais les dépendances de Plugin. Ils lisent
les enregistrements d’installation de Plugin, calculent le point d’entrée et le chargent.

Si une dépendance manque à l’exécution, le Plugin échoue à se charger et l’erreur
doit indiquer à l’opérateur une correction explicite :

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` peut nettoyer l’état de dépendance hérité généré par OpenClaw et récupérer
les Plugins téléchargeables qui manquent dans les enregistrements d’installation locaux lorsque la configuration
les référence. Doctor ne répare pas les dépendances d’un Plugin local déjà installé.

## Plugins groupés

Les Plugins groupés légers et critiques pour le noyau sont livrés avec OpenClaw.
Ils ne doivent pas avoir d’arbre de dépendances d’exécution lourd, ou doivent être déplacés vers un
package téléchargeable sur ClawHub/npm.

Pour la liste générée actuelle des Plugins livrés dans le package core, installés
en externe ou conservés uniquement sous forme de source, consultez [Inventaire des Plugins](/fr/plugins/plugin-inventory).

Les manifestes de Plugins groupés ne doivent pas demander de préparation des dépendances. Les fonctionnalités de Plugin
volumineuses ou optionnelles doivent être empaquetées comme un Plugin normal et installées via
le même chemin npm/git/ClawHub que les Plugins tiers.

Dans les extractions de source, OpenClaw traite le dépôt comme un monorepo pnpm. Après
`pnpm install`, les Plugins groupés se chargent depuis `extensions/<id>` afin que les dépendances
workspace locales au package soient disponibles et que les modifications soient prises en compte directement. Le développement
par extraction de source est uniquement pnpm ; un simple `npm install` à la racine du dépôt
n’est pas une méthode prise en charge pour préparer les dépendances des Plugins groupés.

| Forme d’installation             | Emplacement du Plugin groupé          | Propriétaire des dépendances                                           |
| -------------------------------- | ------------------------------------- | ---------------------------------------------------------------------- |
| `npm install -g openclaw`        | Arbre d’exécution construit dans le package | Package OpenClaw et flux explicites d’installation/mise à jour/doctor de Plugin |
| Extraction git plus `pnpm install` | Packages workspace `extensions/<id>`  | Le workspace pnpm, y compris les propres dépendances de chaque package de Plugin |
| `openclaw plugins install ...`   | Racine de Plugin npm/git/ClawHub gérée | Le flux d’installation/mise à jour de Plugin                           |

## Nettoyage hérité

Les anciennes versions d’OpenClaw généraient des racines de dépendances de Plugins groupés au démarrage ou
pendant la réparation par doctor. Le nettoyage doctor actuel supprime ces répertoires et
liens symboliques obsolètes lorsque `--fix` est utilisé, y compris les anciennes racines `plugin-runtime-deps`, les liens symboliques
de packages du préfixe global Node qui pointent vers des cibles `plugin-runtime-deps` élaguées,
les manifestes `.openclaw-runtime-deps*`, les `node_modules` de Plugin générés, les répertoires
d’étape d’installation et les stores pnpm locaux au package. Le postinstall empaqueté supprime aussi
ces liens symboliques globaux avant d’élaguer les racines cibles héritées afin que les mises à niveau
ne laissent pas d’imports de package ESM pendants.

Ces chemins ne sont que des débris hérités. Les nouvelles installations ne doivent pas les créer.
