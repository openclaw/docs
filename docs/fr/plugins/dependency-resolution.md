---
read_when:
    - Vous déboguez les installations de packages de Plugin
    - Vous modifiez le comportement de démarrage du Plugin, de doctor ou d’installation par le gestionnaire de paquets
    - Vous maintenez des installations OpenClaw empaquetées ou des manifestes de Plugin intégrés
sidebarTitle: Dependencies
summary: Comment OpenClaw installe les paquets de Plugin et résout les dépendances de Plugin
title: Résolution des dépendances de Plugin
x-i18n:
    generated_at: "2026-05-02T20:49:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9476529ad1d44ed1b17caca628c58acfbb1d8c73393f58fa7d3d76944a71aea
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Résolution des dépendances des Plugins

OpenClaw gère les dépendances des plugins au moment de l’installation ou de la mise à jour. Le chargement à l’exécution
n’exécute pas de gestionnaires de paquets, ne répare pas les arbres de dépendances et ne modifie pas le répertoire du paquet
OpenClaw.

## Répartition des responsabilités

Les paquets de plugins possèdent leur graphe de dépendances :

- les dépendances d’exécution se trouvent dans les `dependencies` ou
  `optionalDependencies` du paquet de plugin
- les imports du SDK/noyau sont des pairs ou des imports fournis par OpenClaw
- les plugins de développement local apportent leurs propres dépendances déjà installées
- les plugins npm et git sont installés dans des racines de paquets appartenant à OpenClaw

OpenClaw possède uniquement le cycle de vie du plugin :

- découvrir la source du plugin
- installer ou mettre à jour le paquet lorsqu’une demande explicite est faite
- enregistrer les métadonnées d’installation
- charger le point d’entrée du plugin
- échouer avec une erreur exploitable lorsque des dépendances sont manquantes

## Racines d’installation

OpenClaw utilise des racines stables par source :

- les paquets npm s’installent sous `~/.openclaw/npm`
- les paquets git sont clonés sous `~/.openclaw/git`
- les installations locales/par chemin/par archive sont copiées ou référencées sans réparation des dépendances

Les installations npm s’exécutent dans la racine npm avec :

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

npm peut hisser des dépendances transitives vers `~/.openclaw/npm/node_modules`, à côté
du paquet de plugin. OpenClaw analyse la racine npm gérée avant de faire confiance à
l’installation et utilise npm pour supprimer les paquets gérés par npm lors de la désinstallation, afin que les dépendances
d’exécution hissées restent dans le périmètre de nettoyage géré.

Les installations git clonent ou actualisent le dépôt, puis exécutent :

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Le plugin installé se charge ensuite depuis ce répertoire de paquet, de sorte que la résolution
locale au paquet et celle du parent `node_modules` fonctionnent comme pour un paquet
Node normal.

## Plugins locaux

Les plugins locaux sont traités comme des répertoires contrôlés par les développeurs. OpenClaw n’exécute pas
`npm install`, `pnpm install` ni de réparation des dépendances pour eux. Si un
plugin local a des dépendances, installez-les dans ce plugin avant de le charger.

Les plugins locaux TypeScript tiers peuvent utiliser le chemin d’urgence Jiti. Les plugins
JavaScript empaquetés et les plugins internes intégrés se chargent via
import/require natif plutôt que Jiti.

## Démarrage et rechargement

Le démarrage du Gateway et le rechargement de la configuration n’installent jamais de dépendances de plugin. Ils lisent
les enregistrements d’installation du plugin, calculent le point d’entrée et le chargent.

Si une dépendance manque à l’exécution, le plugin ne se charge pas et l’erreur
doit orienter l’opérateur vers une correction explicite :

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` peut nettoyer l’état hérité des dépendances générées par OpenClaw et installer
les plugins téléchargeables configurés qui sont absents des enregistrements d’installation locaux.
Il ne répare pas les dépendances d’un plugin local déjà installé.

## Plugins intégrés

Les plugins intégrés légers et critiques pour le noyau sont livrés avec OpenClaw.
Ils ne devraient pas avoir d’arbre de dépendances d’exécution lourd, ou devraient être déplacés vers un
paquet téléchargeable sur ClawHub/npm.

Pour la liste générée actuelle des plugins livrés dans le paquet noyau, installés
en externe ou conservés uniquement sous forme de source, consultez [Inventaire des plugins](/fr/plugins/plugin-inventory).

Les manifestes de plugins intégrés ne doivent pas demander de préparation des dépendances. Les fonctionnalités de plugin
volumineuses ou facultatives doivent être empaquetées comme un plugin normal et installées via
le même chemin npm/git/ClawHub que les plugins tiers.

Dans les extractions de source, OpenClaw traite le dépôt comme un monorepo pnpm. Après
`pnpm install`, les plugins intégrés se chargent depuis `extensions/<id>`, ce qui rend les dépendances
d’espace de travail locales au paquet disponibles et permet de prendre directement en compte les modifications. Le développement
depuis une extraction de source est uniquement pris en charge avec pnpm ; un simple `npm install` à la racine du dépôt
n’est pas une méthode prise en charge pour préparer les dépendances des plugins intégrés.

| Forme d’installation             | Emplacement du plugin intégré         | Propriétaire des dépendances                                         |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Arbre d’exécution construit dans le paquet | Paquet OpenClaw et flux explicites d’installation/mise à jour/doctor des plugins |
| Extraction Git plus `pnpm install` | Paquets d’espace de travail `extensions/<id>` | L’espace de travail pnpm, y compris les propres dépendances de chaque paquet de plugin |
| `openclaw plugins install ...`   | Racine de plugin npm/git/ClawHub gérée | Le flux d’installation/mise à jour du plugin                         |

## Nettoyage hérité

Les anciennes versions d’OpenClaw généraient des racines de dépendances de plugins intégrés au démarrage ou
pendant la réparation doctor. Le nettoyage doctor actuel supprime ces répertoires et
liens symboliques obsolètes lorsque `--fix` est utilisé, y compris les anciennes racines `plugin-runtime-deps`,
les manifestes `.openclaw-runtime-deps*`, les `node_modules` de plugins générés, les répertoires
d’étape d’installation et les magasins pnpm locaux au paquet.

Ces chemins ne sont que des débris hérités. Les nouvelles installations ne doivent pas les créer.
