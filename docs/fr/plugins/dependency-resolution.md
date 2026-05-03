---
read_when:
    - Vous déboguez les installations de packages de Plugin
    - Vous modifiez le comportement de démarrage des Plugins, de doctor ou d’installation par le gestionnaire de paquets
    - Vous maintenez des installations OpenClaw empaquetées ou des manifestes de Plugin intégrés
sidebarTitle: Dependencies
summary: Comment OpenClaw installe les paquets de Plugin et résout les dépendances de Plugin
title: Résolution des dépendances de Plugin
x-i18n:
    generated_at: "2026-05-03T21:35:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 46af62ff866d50cb53bb2761d9928f0fd2a25bdb945040885ec6bfb85be35c6d
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Résolution des dépendances de Plugin

OpenClaw conserve le travail sur les dépendances des Plugins au moment de l’installation/la mise à jour. Le chargement à l’exécution
n’exécute pas de gestionnaires de packages, ne répare pas les arbres de dépendances et ne modifie pas le répertoire du package
OpenClaw.

## Répartition des responsabilités

Les packages Plugin possèdent leur graphe de dépendances :

- les dépendances d’exécution résident dans les `dependencies` ou
  `optionalDependencies` du package Plugin
- les importations SDK/core sont des pairs ou des importations fournies par OpenClaw
- les Plugins de développement local apportent leurs propres dépendances déjà installées
- les Plugins npm et git sont installés dans des racines de packages possédées par OpenClaw

OpenClaw possède uniquement le cycle de vie du Plugin :

- découvrir la source du Plugin
- installer ou mettre à jour le package lorsque cela est explicitement demandé
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
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

npm peut hisser les dépendances transitives vers `~/.openclaw/npm/node_modules` à côté
du package Plugin. OpenClaw analyse la racine npm gérée avant de faire confiance à
l’installation et utilise npm pour supprimer les packages gérés par npm pendant la désinstallation ; les dépendances
d’exécution hissées restent donc à l’intérieur de la limite de nettoyage gérée.

Les installations git clonent ou actualisent le dépôt, puis exécutent :

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Le Plugin installé se charge ensuite depuis ce répertoire de package, de sorte que la résolution
des `node_modules` locaux au package et parents fonctionne comme pour un package
Node normal.

## Plugins locaux

Les Plugins locaux sont traités comme des répertoires contrôlés par les développeurs. OpenClaw n’exécute pas
`npm install`, `pnpm install` ni de réparation de dépendances pour eux. Si un
Plugin local a des dépendances, installez-les dans ce Plugin avant de le charger.

Les Plugins locaux TypeScript tiers peuvent utiliser le chemin d’urgence Jiti. Les Plugins
JavaScript packagés et les Plugins internes intégrés se chargent via
import/require natif plutôt que via Jiti.

## Démarrage et rechargement

Le démarrage du Gateway et le rechargement de la configuration n’installent jamais les dépendances de Plugin. Ils lisent
les enregistrements d’installation du Plugin, calculent le point d’entrée et le chargent.

Si une dépendance est manquante à l’exécution, le Plugin ne se charge pas et l’erreur
doit indiquer à l’opérateur une correction explicite :

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` peut nettoyer l’état de dépendances hérité généré par OpenClaw et installer
les Plugins téléchargeables configurés qui sont absents des enregistrements d’installation locaux.
Il ne répare pas les dépendances d’un Plugin local déjà installé.

## Plugins intégrés

Les Plugins intégrés légers et critiques pour le cœur sont livrés dans OpenClaw.
Ils ne doivent pas avoir d’arbre de dépendances d’exécution lourd, ou doivent être déplacés vers un
package téléchargeable sur ClawHub/npm.

Pour la liste générée actuelle des Plugins livrés dans le package cœur, installés
en externe ou restant uniquement source, consultez [Inventaire des Plugins](/fr/plugins/plugin-inventory).

Les manifestes de Plugins intégrés ne doivent pas demander de préparation de dépendances. Les fonctionnalités de Plugin
volumineuses ou facultatives doivent être packagées comme un Plugin normal et installées via
le même chemin npm/git/ClawHub que les Plugins tiers.

Dans les checkouts source, OpenClaw traite le dépôt comme un monorepo pnpm. Après
`pnpm install`, les Plugins intégrés se chargent depuis `extensions/<id>`, ce qui rend les dépendances
d’espace de travail locales au package disponibles et permet de prendre directement les modifications en compte. Le développement depuis un
checkout source est uniquement pnpm ; un simple `npm install` à la racine du dépôt n’est
pas une méthode prise en charge pour préparer les dépendances des Plugins intégrés.

| Forme d’installation             | Emplacement du Plugin intégré         | Propriétaire des dépendances                                          |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Arbre d’exécution construit dans le package | Package OpenClaw et flux explicites d’installation/mise à jour/doctor de Plugin |
| Checkout git plus `pnpm install` | Packages d’espace de travail `extensions/<id>` | L’espace de travail pnpm, y compris les propres dépendances de chaque package Plugin |
| `openclaw plugins install ...`   | Racine de Plugin npm/git/ClawHub gérée | Le flux d’installation/mise à jour du Plugin                          |

## Nettoyage hérité

Les anciennes versions d’OpenClaw généraient des racines de dépendances de Plugins intégrés au démarrage ou
pendant la réparation doctor. Le nettoyage doctor actuel supprime ces répertoires obsolètes et
liens symboliques lorsque `--fix` est utilisé, y compris les anciennes racines `plugin-runtime-deps`, les liens symboliques de packages
à préfixe global Node qui pointent vers des cibles `plugin-runtime-deps` élaguées,
les manifestes `.openclaw-runtime-deps*`, les `node_modules` de Plugin générés, les répertoires
d’étape d’installation et les stores pnpm locaux au package. Le postinstall packagé supprime aussi
ces liens symboliques globaux avant d’élaguer les racines cibles héritées, afin que les mises à niveau
ne laissent pas d’importations de packages ESM pendantes.

Ces chemins ne sont que des débris hérités. Les nouvelles installations ne doivent pas les créer.
