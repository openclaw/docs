---
read_when:
    - Vous déboguez les installations de packages de Plugin
    - Vous modifiez le comportement de démarrage du plugin, de doctor ou de l’installation via le gestionnaire de paquets
    - Vous maintenez des installations OpenClaw empaquetées ou des manifestes de Plugin groupés
sidebarTitle: Dependencies
summary: Comment OpenClaw installe les packages de Plugin et résout les dépendances de Plugin
title: Résolution des dépendances du Plugin
x-i18n:
    generated_at: "2026-06-27T17:48:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d5d2f3efe40c50433bd44961f6f5b8d03f3c69d3f5112163613b8efbd0f17c65
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw maintient le travail sur les dépendances des plugins au moment de l’installation/de la mise à jour. Le chargement à l’exécution
n’exécute pas de gestionnaires de paquets, ne répare pas les arbres de dépendances et ne modifie pas le répertoire du paquet
OpenClaw.

## Répartition des responsabilités

Les paquets de plugins sont responsables de leur graphe de dépendances :

- les dépendances d’exécution résident dans les `dependencies` ou
  `optionalDependencies` du paquet de plugin
- les importations SDK/noyau sont des pairs ou des importations fournies par OpenClaw
- les plugins de développement local apportent leurs propres dépendances déjà installées
- les plugins npm et git sont installés dans des racines de paquets appartenant à OpenClaw

OpenClaw ne possède que le cycle de vie du plugin :

- découvrir la source du plugin
- installer ou mettre à jour le paquet lorsque cela est explicitement demandé
- enregistrer les métadonnées d’installation
- charger le point d’entrée du plugin
- échouer avec une erreur exploitable lorsque des dépendances sont manquantes

## Racines d’installation

OpenClaw utilise des racines stables par source :

- les paquets npm s’installent dans des projets par plugin sous
  `~/.openclaw/npm/projects/<encoded-package>`
- les paquets git sont clonés sous `~/.openclaw/git`
- les installations locales/par chemin/par archive sont copiées ou référencées sans réparation des dépendances

Les installations npm s’exécutent dans cette racine de projet par plugin avec :

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` utilise cette même racine de projet npm
par plugin pour une archive tarball npm-pack locale. OpenClaw lit les métadonnées npm
de l’archive, l’ajoute au projet géré comme dépendance `file:` copiée, exécute
l’installation npm normale, puis vérifie les métadonnées du lockfile installé avant
de faire confiance au plugin.
C’est destiné aux preuves d’acceptation de paquet et de release candidate, lorsqu’un
artefact pack local doit se comporter comme l’artefact de registre qu’il simule.

npm peut hisser les dépendances transitives vers le `node_modules` du projet par plugin
à côté du paquet de plugin. OpenClaw analyse la racine du projet géré avant de faire
confiance à l’installation et supprime ce projet pendant la désinstallation, afin que
les dépendances d’exécution hissées restent dans la limite de nettoyage de ce plugin.

Les paquets de plugins npm publiés peuvent livrer `npm-shrinkwrap.json`. npm utilise ce
lockfile publiable pendant l’installation, et la racine de projet npm gérée par OpenClaw
le prend en charge via le chemin d’installation npm normal. Les paquets de plugins
publiables appartenant à OpenClaw doivent inclure un shrinkwrap local au paquet, généré
à partir du graphe de dépendances publié de ce paquet de plugin :

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

Le générateur retire les `devDependencies` du plugin, applique la politique de surcharge
du workspace et écrit `extensions/<id>/npm-shrinkwrap.json` pour chaque plugin
`publishToNpm`. Les paquets de plugins tiers peuvent aussi livrer un shrinkwrap ;
OpenClaw ne l’exige pas pour les paquets communautaires, mais npm le respectera
lorsqu’il est présent.

Les paquets de plugins npm appartenant à OpenClaw peuvent aussi être publiés avec des
`bundledDependencies` explicites. Le chemin de publication npm superpose la liste des
noms de dépendances d’exécution, retire les métadonnées de workspace réservées au
développement du manifeste du paquet publié, exécute une installation npm sans scripts
pour les dépendances d’exécution locales au paquet, puis empaquette ou publie l’archive
tarball du plugin avec ces fichiers de dépendances inclus. Les paquets lourds en natif,
y compris les runtimes Codex et ACP, se désactivent avec
`openclaw.release.bundleRuntimeDependencies: false` ; ces paquets livrent toujours leur
shrinkwrap, mais npm résout les dépendances d’exécution pendant l’installation au lieu
d’intégrer chaque binaire de plateforme dans l’archive tarball du plugin. Le paquet racine
`openclaw` n’embarque pas tout son arbre de dépendances.

Les plugins qui importent `openclaw/plugin-sdk/*` déclarent `openclaw` comme dépendance
paire. OpenClaw ne laisse pas npm installer une copie de registre séparée du paquet hôte
dans un projet géré, car des paquets hôtes obsolètes peuvent affecter la résolution des
pairs npm dans ce plugin. Les installations npm gérées ignorent la résolution/matérialisation
des pairs npm et OpenClaw réaffirme les liens `node_modules/openclaw` locaux au plugin
pour les paquets installés qui déclarent le pair hôte après l’installation ou la mise à jour.

Les installations git clonent ou actualisent le dépôt, puis exécutent :

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Le plugin installé se charge ensuite depuis ce répertoire de paquet, de sorte que la résolution
des `node_modules` locaux au paquet et parents fonctionne comme pour un paquet Node normal.

## Plugins locaux

Les plugins locaux sont traités comme des répertoires contrôlés par le développeur. OpenClaw
n’exécute pas `npm install`, `pnpm install` ni de réparation de dépendances pour eux. Si un
plugin local a des dépendances, installez-les dans ce plugin avant de le charger.

Les plugins locaux TypeScript tiers peuvent utiliser le chemin Jiti d’urgence. Les plugins
JavaScript empaquetés et les plugins internes groupés se chargent via import/require natif
au lieu de Jiti.

## Démarrage et rechargement

Le démarrage du Gateway et le rechargement de la configuration n’installent jamais les
dépendances de plugins. Ils lisent les enregistrements d’installation de plugin, calculent
le point d’entrée et le chargent.

Si une dépendance est manquante à l’exécution, le plugin échoue au chargement et l’erreur
doit orienter l’opérateur vers une correction explicite :

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` peut nettoyer l’état de dépendances hérité généré par OpenClaw et récupérer
les plugins téléchargeables qui manquent dans les enregistrements d’installation locaux
lorsque la configuration les référence. Doctor ne répare pas les dépendances d’un plugin
local déjà installé.

## Plugins groupés

Les plugins groupés légers et critiques pour le noyau sont livrés avec OpenClaw.
Ils ne doivent soit avoir aucun arbre de dépendances d’exécution lourd, soit être déplacés
vers un paquet téléchargeable sur ClawHub/npm.

Pour la liste générée actuelle des plugins livrés dans le paquet noyau, installés
externement ou conservés uniquement en source, consultez [Inventaire des plugins](/fr/plugins/plugin-inventory).

Les manifestes de plugins groupés ne doivent pas demander de staging de dépendances. Les
fonctionnalités de plugin volumineuses ou facultatives doivent être empaquetées comme un
plugin normal et installées via le même chemin npm/git/ClawHub que les plugins tiers.

Dans les checkouts source, OpenClaw traite le dépôt comme un monorepo pnpm. Après
`pnpm install`, les plugins groupés se chargent depuis `extensions/<id>` afin que les
dépendances de workspace locales au paquet soient disponibles et que les modifications
soient prises en compte directement. Le développement en checkout source est uniquement
pnpm ; un simple `npm install` à la racine du dépôt n’est pas une manière prise en charge
de préparer les dépendances des plugins groupés.

| Forme d’installation             | Emplacement du plugin groupé          | Propriétaire des dépendances                                         |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Arbre d’exécution construit dans le paquet | Paquet OpenClaw et flux explicites d’installation/mise à jour/doctor de plugin |
| Checkout Git plus `pnpm install` | Paquets de workspace `extensions/<id>` | Le workspace pnpm, y compris les propres dépendances de chaque paquet de plugin |
| `openclaw plugins install ...`   | Racine npm gérée/git/ClawHub          | Le flux d’installation/mise à jour du plugin                         |

## Nettoyage hérité

Les anciennes versions d’OpenClaw généraient des racines de dépendances de plugins groupés
au démarrage ou pendant la réparation doctor. Le nettoyage doctor actuel supprime ces
répertoires et liens symboliques obsolètes lorsque `--fix` est utilisé, y compris les anciennes
racines `plugin-runtime-deps`, les liens symboliques de paquets du préfixe global Node qui
pointent vers des cibles `plugin-runtime-deps` élaguées, les manifestes
`.openclaw-runtime-deps*`, les `node_modules` de plugins générés, les répertoires de staging
d’installation et les stores pnpm locaux aux paquets. Le postinstall empaqueté supprime
aussi ces liens symboliques globaux avant d’élaguer les racines cibles héritées, afin que
les mises à niveau ne laissent pas d’importations de paquets ESM pendantes.

Les anciennes installations npm utilisaient aussi une racine partagée
`~/.openclaw/npm/node_modules`. Les flux actuels d’installation, mise à jour,
désinstallation et doctor reconnaissent encore cette racine plate héritée uniquement pour
la récupération et le nettoyage. Les nouvelles installations npm doivent plutôt créer des
racines de projet par plugin.
