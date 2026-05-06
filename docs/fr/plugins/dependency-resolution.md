---
read_when:
    - Vous déboguez les installations de packages de Plugin
    - Vous modifiez le comportement de démarrage du Plugin, de doctor ou d’installation via le gestionnaire de paquets
    - Vous maintenez des installations OpenClaw empaquetées ou des manifestes de Plugin intégrés
sidebarTitle: Dependencies
summary: Comment OpenClaw installe les packages de Plugin et résout les dépendances de Plugin
title: Résolution des dépendances de Plugin
x-i18n:
    generated_at: "2026-05-06T19:35:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: d51785b67d491d09e3a7a3ffcd6c991f7415c46b207596151dbc29b0c43e9341
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw conserve le travail sur les dépendances de Plugin au moment de l’installation/mise à jour. Le chargement à l’exécution
n’exécute pas de gestionnaires de paquets, ne répare pas les arbres de dépendances et ne modifie pas le répertoire de paquets
OpenClaw.

## Répartition des responsabilités

Les paquets Plugin possèdent leur graphe de dépendances :

- les dépendances d’exécution résident dans `dependencies` ou
  `optionalDependencies` du paquet Plugin
- les importations SDK/core sont des dépendances homologues ou des importations fournies par OpenClaw
- les plugins de développement local apportent leurs propres dépendances déjà installées
- les plugins npm et git sont installés dans des racines de paquets appartenant à OpenClaw

OpenClaw ne possède que le cycle de vie des plugins :

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
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` utilise cette même racine npm gérée
pour une archive tarball npm-pack locale. OpenClaw lit les métadonnées npm de l’archive, l’ajoute
à la racine gérée comme dépendance `file:` copiée, exécute l’installation npm normale,
puis vérifie les métadonnées du lockfile installé avant de faire confiance au plugin.
Cela est destiné aux preuves d’acceptation de paquet et de release candidate où un
artefact pack local doit se comporter comme l’artefact de registre qu’il simule.

npm peut hisser les dépendances transitives vers `~/.openclaw/npm/node_modules` à côté
du paquet Plugin. OpenClaw analyse la racine npm gérée avant de faire confiance à
l’installation et utilise npm pour supprimer les paquets gérés par npm lors de la désinstallation, afin que les dépendances
d’exécution hissées restent dans le périmètre de nettoyage géré.

Les plugins qui importent `openclaw/plugin-sdk/*` déclarent `openclaw` comme dépendance
homologue. OpenClaw ne laisse pas npm installer une copie de registre distincte du
paquet hôte dans la racine gérée, car les paquets hôtes obsolètes peuvent affecter la
résolution des pairs npm lors d’installations ultérieures de plugins. Les installations npm gérées ignorent la
résolution/matérialisation des pairs npm pour la racine partagée et OpenClaw réaffirme
les liens `node_modules/openclaw` locaux au plugin pour les paquets installés qui déclarent
le pair hôte après installation, mise à jour ou désinstallation.

Les installations git clonent ou actualisent le dépôt, puis exécutent :

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Le plugin installé se charge ensuite depuis ce répertoire de paquet, de sorte que la résolution
`node_modules` locale au paquet et parente fonctionne comme pour un paquet
Node normal.

## Plugins locaux

Les plugins locaux sont traités comme des répertoires contrôlés par le développeur. OpenClaw n’exécute pas
`npm install`, `pnpm install` ni de réparation des dépendances pour eux. Si un plugin local
a des dépendances, installez-les dans ce plugin avant de le charger.

Les plugins locaux TypeScript tiers peuvent utiliser le chemin Jiti d’urgence. Les plugins
JavaScript empaquetés et les plugins internes groupés se chargent via
import/require natif au lieu de Jiti.

## Démarrage et rechargement

Le démarrage du Gateway et le rechargement de la configuration n’installent jamais les dépendances de plugins. Ils lisent
les enregistrements d’installation des plugins, calculent le point d’entrée et le chargent.

Si une dépendance est manquante à l’exécution, le plugin échoue au chargement et l’erreur
doit indiquer à l’opérateur une correction explicite :

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` peut nettoyer l’ancien état de dépendances généré par OpenClaw et récupérer
les plugins téléchargeables absents des enregistrements d’installation locaux lorsque la configuration
les référence. Doctor ne répare pas les dépendances d’un plugin local déjà installé.

## Plugins groupés

Les plugins groupés légers et critiques pour le core sont livrés avec OpenClaw.
Ils doivent soit ne pas avoir d’arbre de dépendances d’exécution lourd, soit être déplacés vers un
paquet téléchargeable sur ClawHub/npm.

Pour la liste générée actuelle des plugins livrés dans le paquet core, installés
externement ou conservés uniquement comme source, consultez [Inventaire des plugins](/fr/plugins/plugin-inventory).

Les manifestes de plugins groupés ne doivent pas demander de staging de dépendances. Les fonctionnalités de plugin
volumineuses ou facultatives doivent être empaquetées comme un plugin normal et installées via
le même chemin npm/git/ClawHub que les plugins tiers.

Dans les checkouts source, OpenClaw traite le dépôt comme un monorepo pnpm. Après
`pnpm install`, les plugins groupés se chargent depuis `extensions/<id>` afin que les dépendances
d’espace de travail locales au paquet soient disponibles et que les modifications soient prises en compte directement. Le développement
dans un checkout source est uniquement pnpm ; un simple `npm install` à la racine du dépôt n’est
pas un moyen pris en charge pour préparer les dépendances des plugins groupés.

| Forme d’installation             | Emplacement du plugin groupé          | Propriétaire des dépendances                                          |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Arbre d’exécution construit dans le paquet | Paquet OpenClaw et flux explicites d’installation/mise à jour/doctor de plugins |
| Checkout git plus `pnpm install` | Paquets d’espace de travail `extensions/<id>` | L’espace de travail pnpm, y compris les propres dépendances de chaque paquet Plugin |
| `openclaw plugins install ...`   | Racine de plugin npm/git/ClawHub gérée | Le flux d’installation/mise à jour du plugin                         |

## Nettoyage hérité

Les anciennes versions d’OpenClaw généraient des racines de dépendances de plugins groupés au démarrage ou
pendant la réparation par doctor. Le nettoyage actuel de doctor supprime ces répertoires et
liens symboliques obsolètes lorsque `--fix` est utilisé, y compris les anciennes racines `plugin-runtime-deps`, les liens symboliques de paquets
à préfixe Node global qui pointent vers des cibles `plugin-runtime-deps` élaguées,
les manifestes `.openclaw-runtime-deps*`, les `node_modules` de plugins générés, les répertoires
de staging d’installation et les stores pnpm locaux aux paquets. Le postinstall empaqueté supprime aussi
ces liens symboliques globaux avant d’élaguer les racines cibles héritées, afin que les mises à niveau
ne laissent pas d’importations de paquets ESM pendantes.

Ces chemins ne sont que des débris hérités. Les nouvelles installations ne doivent pas les créer.
