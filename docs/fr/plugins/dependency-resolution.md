---
read_when:
    - Vous déboguez les installations de paquets de Plugins
    - Vous modifiez le comportement de démarrage du Plugin, de doctor ou d’installation par le gestionnaire de paquets
    - Vous maintenez des installations OpenClaw empaquetées ou des manifestes de Plugin groupés
sidebarTitle: Dependencies
summary: Comment OpenClaw installe les packages de plugins et résout les dépendances des plugins
title: Résolution des dépendances de Plugin
x-i18n:
    generated_at: "2026-05-06T17:59:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 15cdc75d92a675fd5474c49572639ab7510618e393fb7cf9f8b94506c859bee8
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw conserve le travail sur les dépendances des plugins au moment de l’installation ou de la mise à jour. Le chargement à l’exécution
n’exécute pas de gestionnaires de paquets, ne répare pas les arbres de dépendances et ne modifie pas le répertoire de paquets
OpenClaw.

## Répartition des responsabilités

Les paquets de plugins possèdent leur graphe de dépendances :

- les dépendances d’exécution résident dans les `dependencies` ou
  `optionalDependencies` du paquet de plugin
- les imports SDK/core sont des pairs ou des imports fournis par OpenClaw
- les plugins de développement local apportent leurs propres dépendances déjà installées
- les plugins npm et git sont installés dans des racines de paquets détenues par OpenClaw

OpenClaw possède uniquement le cycle de vie du plugin :

- découvrir la source du plugin
- installer ou mettre à jour le paquet lorsque cela est explicitement demandé
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

`openclaw plugins install npm-pack:<path.tgz>` utilise cette même racine npm gérée
pour une archive tar npm-pack locale. OpenClaw lit les métadonnées npm de l’archive, l’ajoute
à la racine gérée comme dépendance `file:` copiée, exécute l’installation npm normale,
puis vérifie les métadonnées du lockfile installé avant de faire confiance au plugin.
Cela est destiné à la preuve d’acceptation de paquet et de version candidate lorsqu’un
artefact de paquet local doit se comporter comme l’artefact de registre qu’il simule.

npm peut hisser des dépendances transitives vers `~/.openclaw/npm/node_modules` à côté
du paquet de plugin. OpenClaw analyse la racine npm gérée avant de faire confiance à
l’installation et utilise npm pour supprimer les paquets gérés par npm lors de la désinstallation, afin que les dépendances
d’exécution hissées restent dans la limite de nettoyage gérée.

Les plugins qui importent `openclaw/plugin-sdk/*` déclarent `openclaw` comme dépendance
pair. OpenClaw ne laisse pas npm installer une copie distincte du paquet hôte depuis le registre
dans la racine gérée, car des paquets hôtes obsolètes peuvent affecter la résolution des pairs
par npm lors d’installations ultérieures de plugins. À la place, après que npm a fini
de modifier la racine partagée pendant l’installation, la mise à jour ou la désinstallation, OpenClaw réaffirme
les liens `node_modules/openclaw` locaux aux plugins pour les paquets installés qui déclarent
le pair hôte.

Les installations git clonent ou actualisent le dépôt, puis exécutent :

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Le plugin installé se charge ensuite depuis ce répertoire de paquet, de sorte que la résolution des
`node_modules` locaux au paquet et parents fonctionne comme pour un paquet
Node normal.

## Plugins locaux

Les plugins locaux sont traités comme des répertoires contrôlés par le développeur. OpenClaw n’exécute pas
`npm install`, `pnpm install` ni de réparation des dépendances pour eux. Si un plugin
local a des dépendances, installez-les dans ce plugin avant de le charger.

Les plugins locaux TypeScript tiers peuvent utiliser le chemin Jiti d’urgence. Les plugins
JavaScript empaquetés et les plugins internes intégrés se chargent via
import/require natif au lieu de Jiti.

## Démarrage et rechargement

Le démarrage du Gateway et le rechargement de configuration n’installent jamais les dépendances de plugins. Ils lisent
les enregistrements d’installation des plugins, calculent le point d’entrée et le chargent.

Si une dépendance est manquante à l’exécution, le chargement du plugin échoue et l’erreur
doit orienter l’opérateur vers une correction explicite :

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` peut nettoyer l’état de dépendances hérité généré par OpenClaw et récupérer
les plugins téléchargeables absents des enregistrements d’installation locaux lorsque la configuration
les référence. Doctor ne répare pas les dépendances d’un plugin local déjà installé.

## Plugins intégrés

Les plugins intégrés légers et critiques pour le cœur sont livrés avec OpenClaw.
Ils doivent soit ne pas avoir d’arbre lourd de dépendances d’exécution, soit être déplacés vers un
paquet téléchargeable sur ClawHub/npm.

Pour la liste générée actuelle des plugins livrés dans le paquet core, installés
en externe ou restant uniquement dans les sources, consultez [Inventaire des plugins](/fr/plugins/plugin-inventory).

Les manifestes de plugins intégrés ne doivent pas demander de préparation des dépendances. Les fonctionnalités
de plugin volumineuses ou facultatives doivent être empaquetées comme un plugin normal et installées via
le même chemin npm/git/ClawHub que les plugins tiers.

Dans les checkouts source, OpenClaw traite le dépôt comme un monorepo pnpm. Après
`pnpm install`, les plugins intégrés se chargent depuis `extensions/<id>` afin que les dépendances
workspace locales aux paquets soient disponibles et que les modifications soient prises en compte directement. Le développement
depuis un checkout source est uniquement pris en charge avec pnpm ; un simple `npm install` à la racine du dépôt n’est
pas une méthode prise en charge pour préparer les dépendances des plugins intégrés.

| Forme d’installation              | Emplacement du plugin intégré          | Propriétaire des dépendances                                            |
| --------------------------------- | -------------------------------------- | ----------------------------------------------------------------------- |
| `npm install -g openclaw`         | Arbre d’exécution construit dans le paquet | Paquet OpenClaw et flux explicites d’installation/mise à jour/doctor des plugins |
| Checkout Git plus `pnpm install`  | Paquets workspace `extensions/<id>`    | Le workspace pnpm, y compris les dépendances propres à chaque paquet de plugin |
| `openclaw plugins install ...`    | Racine de plugin npm/git/ClawHub gérée | Le flux d’installation/mise à jour du plugin                            |

## Nettoyage hérité

Les anciennes versions d’OpenClaw généraient des racines de dépendances de plugins intégrés au démarrage ou
pendant la réparation doctor. Le nettoyage doctor actuel supprime ces répertoires et
liens symboliques obsolètes lorsque `--fix` est utilisé, y compris les anciennes racines `plugin-runtime-deps`, les liens symboliques
de paquets de préfixe global Node qui pointent vers des cibles `plugin-runtime-deps` supprimées,
les manifestes `.openclaw-runtime-deps*`, les `node_modules` de plugins générés, les répertoires
d’étape d’installation et les stores pnpm locaux aux paquets. Le postinstall empaqueté supprime également
ces liens symboliques globaux avant d’élaguer les racines cibles héritées afin que les mises à niveau
ne laissent pas d’imports de paquets ESM pendants.

Ces chemins ne sont que des débris hérités. Les nouvelles installations ne doivent pas les créer.
