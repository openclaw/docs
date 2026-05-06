---
read_when:
    - Vous déboguez les installations de paquets de Plugin
    - Vous modifiez le comportement de démarrage du Plugin, de doctor ou d’installation du gestionnaire de paquets
    - Vous maintenez des installations OpenClaw empaquetées ou des manifestes de Plugin groupés
sidebarTitle: Dependencies
summary: Comment OpenClaw installe les packages de Plugin et résout les dépendances de Plugin
title: Résolution des dépendances de Plugin
x-i18n:
    generated_at: "2026-05-06T09:03:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: e06f1fdc34c8392cbf0e399484fd59af11b9b7d73c5c7e68b3617a7cfd433a36
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Résolution des dépendances de Plugin

OpenClaw conserve le travail sur les dépendances des Plugins au moment de l’installation ou de la mise à jour. Le chargement à l’exécution
n’exécute pas de gestionnaires de packages, ne répare pas les arbres de dépendances et ne modifie pas le répertoire de package
OpenClaw.

## Répartition des responsabilités

Les packages de Plugins possèdent leur graphe de dépendances :

- les dépendances d’exécution résident dans les `dependencies` ou
  `optionalDependencies` du package de Plugin
- les imports SDK/core sont des pairs ou des imports OpenClaw fournis
- les Plugins de développement local apportent leurs propres dépendances déjà installées
- les Plugins npm et git sont installés dans des racines de packages appartenant à OpenClaw

OpenClaw possède uniquement le cycle de vie des Plugins :

- découvrir la source du Plugin
- installer ou mettre à jour le package lorsque cela est explicitement demandé
- enregistrer les métadonnées d’installation
- charger le point d’entrée du Plugin
- échouer avec une erreur actionnable lorsque des dépendances sont manquantes

## Racines d’installation

OpenClaw utilise des racines stables par source :

- les packages npm s’installent sous `~/.openclaw/npm`
- les packages git se clonent sous `~/.openclaw/git`
- les installations locales/par chemin/par archive sont copiées ou référencées sans réparation des dépendances

Les installations npm s’exécutent dans la racine npm avec :

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` utilise cette même racine npm gérée
pour une archive tarball npm-pack locale. OpenClaw lit les métadonnées npm de l’archive tarball, l’ajoute
à la racine gérée comme dépendance `file:` copiée, exécute l’installation npm normale,
puis vérifie les métadonnées du lockfile installé avant de faire confiance au Plugin.
Ce comportement est destiné à l’acceptation de package et à la preuve de release candidate lorsqu’un
artefact pack local doit se comporter comme l’artefact de registre qu’il simule.

npm peut hisser des dépendances transitives vers `~/.openclaw/npm/node_modules` à côté
du package de Plugin. OpenClaw analyse la racine npm gérée avant de faire confiance à
l’installation et utilise npm pour supprimer les packages gérés par npm lors de la désinstallation, afin que les dépendances
d’exécution hissées restent dans la limite de nettoyage gérée.

Les Plugins qui importent `openclaw/plugin-sdk/*` déclarent `openclaw` comme dépendance pair.
OpenClaw ne laisse pas npm installer une copie distincte du package hôte depuis le registre
dans la racine gérée, car des packages hôtes obsolètes peuvent affecter la résolution des pairs npm
lors d’installations ultérieures de Plugins. À la place, une fois que npm a fini de modifier
la racine partagée pendant une installation, une mise à jour ou une désinstallation, OpenClaw réaffirme
les liens `node_modules/openclaw` locaux au Plugin pour les packages installés qui déclarent
le pair hôte.

Les installations git clonent ou actualisent le dépôt, puis exécutent :

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Le Plugin installé se charge ensuite depuis ce répertoire de package, donc la résolution des `node_modules`
locaux au package et parents fonctionne de la même manière que pour un package
Node normal.

## Plugins locaux

Les Plugins locaux sont traités comme des répertoires contrôlés par le développeur. OpenClaw n’exécute pas
`npm install`, `pnpm install` ni de réparation de dépendances pour eux. Si un Plugin local
a des dépendances, installez-les dans ce Plugin avant de le charger.

Les Plugins locaux TypeScript tiers peuvent utiliser le chemin Jiti d’urgence. Les Plugins
JavaScript packagés et les Plugins internes intégrés se chargent via
import/require natif au lieu de Jiti.

## Démarrage et rechargement

Le démarrage du Gateway et le rechargement de la configuration n’installent jamais les dépendances des Plugins. Ils lisent
les enregistrements d’installation des Plugins, calculent le point d’entrée et le chargent.

Si une dépendance est manquante à l’exécution, le Plugin échoue au chargement et l’erreur
doit orienter l’opérateur vers une correction explicite :

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` peut nettoyer l’état de dépendances hérité généré par OpenClaw et récupérer
les Plugins téléchargeables qui manquent dans les enregistrements d’installation locaux lorsque la configuration
les référence. Doctor ne répare pas les dépendances d’un Plugin local déjà installé.

## Plugins intégrés

Les Plugins intégrés légers et critiques pour le cœur sont livrés dans OpenClaw.
Ils ne doivent soit avoir aucun arbre de dépendances d’exécution lourd, soit être déplacés vers un
package téléchargeable sur ClawHub/npm.

Pour la liste générée actuelle des Plugins livrés dans le package cœur, installés
en externe ou restant uniquement source, consultez [Inventaire des Plugins](/fr/plugins/plugin-inventory).

Les manifestes de Plugins intégrés ne doivent pas demander de préparation de dépendances. Les fonctionnalités de Plugin
volumineuses ou facultatives doivent être packagées comme un Plugin normal et installées via
le même chemin npm/git/ClawHub que les Plugins tiers.

Dans les checkouts source, OpenClaw traite le dépôt comme un monorepo pnpm. Après
`pnpm install`, les Plugins intégrés se chargent depuis `extensions/<id>` afin que les dépendances de workspace
locales au package soient disponibles et que les modifications soient prises en compte directement. Le développement en checkout
source est pnpm uniquement ; un simple `npm install` à la racine du dépôt n’est
pas un moyen pris en charge pour préparer les dépendances des Plugins intégrés.

| Forme d’installation             | Emplacement du Plugin intégré         | Propriétaire des dépendances                                         |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Arbre d’exécution construit dans le package | Package OpenClaw et flux explicites d’installation/mise à jour/doctor de Plugin |
| Checkout git plus `pnpm install` | Packages de workspace `extensions/<id>` | Le workspace pnpm, y compris les propres dépendances de chaque package de Plugin |
| `openclaw plugins install ...`   | Racine de Plugin npm/git/ClawHub gérée | Le flux d’installation/mise à jour du Plugin                         |

## Nettoyage hérité

Les anciennes versions d’OpenClaw généraient des racines de dépendances de Plugins intégrés au démarrage ou
pendant la réparation doctor. Le nettoyage doctor actuel supprime ces répertoires et
liens symboliques obsolètes lorsque `--fix` est utilisé, y compris les anciennes racines `plugin-runtime-deps`, les liens symboliques de packages
de préfixe Node global qui pointent vers des cibles `plugin-runtime-deps` élaguées,
les manifestes `.openclaw-runtime-deps*`, les `node_modules` de Plugin générés, les répertoires
d’étape d’installation et les stores pnpm locaux au package. Le postinstall packagé supprime aussi
ces liens symboliques globaux avant d’élaguer les racines de cibles héritées afin que les mises à niveau
ne laissent pas d’imports de packages ESM pendants.

Ces chemins ne sont que des débris hérités. Les nouvelles installations ne doivent pas les créer.
