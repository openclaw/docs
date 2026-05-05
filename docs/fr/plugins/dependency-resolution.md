---
read_when:
    - Vous déboguez les installations de paquets de Plugin
    - Vous modifiez le comportement de démarrage du Plugin, de diagnostic ou d’installation via le gestionnaire de paquets
    - Vous maintenez des installations OpenClaw packagées ou des manifestes de Plugin intégrés
sidebarTitle: Dependencies
summary: Comment OpenClaw installe les paquets Plugin et résout les dépendances Plugin
title: Résolution des dépendances du Plugin
x-i18n:
    generated_at: "2026-05-05T01:48:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1a832f705e51bba8ac77e2a8715a7213fd2caf10bfa42059d53db4a6d5ad8c20
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Résolution des dépendances de Plugin

OpenClaw conserve le travail sur les dépendances des plugins au moment de l’installation/mise à jour. Le chargement à l’exécution
n’exécute pas de gestionnaires de paquets, ne répare pas les arbres de dépendances et ne modifie pas le répertoire
de paquets d’OpenClaw.

## Répartition des responsabilités

Les paquets de plugins possèdent leur graphe de dépendances :

- les dépendances d’exécution résident dans `dependencies` ou
  `optionalDependencies` du paquet de plugin
- les importations SDK/core sont des importations homologues ou fournies par OpenClaw
- les plugins de développement local apportent leurs propres dépendances déjà installées
- les plugins npm et git sont installés dans des racines de paquets appartenant à OpenClaw

OpenClaw possède uniquement le cycle de vie du plugin :

- découvrir la source du plugin
- installer ou mettre à jour le paquet sur demande explicite
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

npm peut hisser les dépendances transitives vers `~/.openclaw/npm/node_modules` à côté
du paquet de plugin. OpenClaw analyse la racine npm gérée avant de faire confiance à
l’installation et utilise npm pour supprimer les paquets gérés par npm lors de la désinstallation, de sorte que les dépendances
d’exécution hissées restent à l’intérieur du périmètre de nettoyage géré.

Les installations git clonent ou actualisent le dépôt, puis exécutent :

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Le plugin installé se charge ensuite depuis ce répertoire de paquet ; la résolution
locale au paquet et par `node_modules` parent fonctionne donc de la même manière que pour un paquet
Node normal.

## Plugins locaux

Les plugins locaux sont traités comme des répertoires contrôlés par les développeurs. OpenClaw n’exécute pas
`npm install`, `pnpm install` ni de réparation de dépendances pour eux. Si un plugin local
a des dépendances, installez-les dans ce plugin avant de le charger.

Les plugins locaux TypeScript tiers peuvent utiliser le chemin d’urgence Jiti. Les plugins
JavaScript empaquetés et les plugins internes groupés se chargent via
import/require natif au lieu de Jiti.

## Démarrage et rechargement

Le démarrage du Gateway et le rechargement de la configuration n’installent jamais les dépendances de plugin. Ils lisent
les enregistrements d’installation de plugin, calculent le point d’entrée et le chargent.

Si une dépendance est manquante à l’exécution, le plugin échoue à se charger et l’erreur
doit orienter l’opérateur vers une correction explicite :

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` peut nettoyer l’état de dépendances hérité généré par OpenClaw et récupérer
les plugins téléchargeables absents des enregistrements d’installation locaux lorsque la configuration
les référence. Doctor ne répare pas les dépendances d’un plugin local déjà installé.

## Plugins groupés

Les plugins groupés légers et critiques pour le noyau sont livrés avec OpenClaw.
Ils devraient soit ne pas avoir d’arbre de dépendances d’exécution lourd, soit être déplacés vers un
paquet téléchargeable sur ClawHub/npm.

Pour la liste actuellement générée des plugins livrés dans le paquet noyau, installés
en externe ou conservés uniquement comme source, consultez [Inventaire des plugins](/fr/plugins/plugin-inventory).

Les manifestes de plugins groupés ne doivent pas demander de préparation des dépendances. Les fonctionnalités
de plugin volumineuses ou facultatives devraient être empaquetées comme un plugin normal et installées via
le même chemin npm/git/ClawHub que les plugins tiers.

Dans les checkouts source, OpenClaw traite le dépôt comme un monorepo pnpm. Après
`pnpm install`, les plugins groupés se chargent depuis `extensions/<id>`, de sorte que les dépendances
workspace locales au paquet sont disponibles et que les modifications sont prises en compte directement. Le développement
dans un checkout source est uniquement pnpm ; un simple `npm install` à la racine du dépôt
n’est pas une méthode prise en charge pour préparer les dépendances des plugins groupés.

| Forme d’installation             | Emplacement du plugin groupé          | Propriétaire des dépendances                                          |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Arbre d’exécution construit dans le paquet | Paquet OpenClaw et flux explicites d’installation/mise à jour/doctor de plugins |
| Checkout Git plus `pnpm install` | Paquets workspace `extensions/<id>`   | Le workspace pnpm, y compris les propres dépendances de chaque paquet de plugin |
| `openclaw plugins install ...`   | Racine de plugin npm/git/ClawHub gérée | Le flux d’installation/mise à jour du plugin                         |

## Nettoyage hérité

Les anciennes versions d’OpenClaw généraient des racines de dépendances de plugins groupés au démarrage ou
pendant la réparation par doctor. Le nettoyage actuel de doctor supprime ces répertoires et
liens symboliques obsolètes lorsque `--fix` est utilisé, y compris les anciennes racines `plugin-runtime-deps`, les liens symboliques
de paquets au préfixe Node global qui pointent vers des cibles `plugin-runtime-deps` élaguées,
les manifestes `.openclaw-runtime-deps*`, les `node_modules` de plugins générés, les répertoires
d’étape d’installation et les stores pnpm locaux au paquet. Le postinstall empaqueté supprime aussi
ces liens symboliques globaux avant d’élaguer les racines cibles héritées afin que les mises à niveau
ne laissent pas d’importations de paquets ESM pendantes.

Ces chemins ne sont que des débris hérités. Les nouvelles installations ne devraient pas les créer.
