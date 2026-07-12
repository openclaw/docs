---
read_when:
    - Vous déboguez les installations de paquets de Plugin
    - Vous modifiez le comportement de démarrage du plugin, de doctor ou de l’installation par le gestionnaire de paquets
    - Vous gérez des installations empaquetées d’OpenClaw ou des manifestes de Plugin intégrés
sidebarTitle: Dependencies
summary: Comment OpenClaw installe les paquets de plugins et résout leurs dépendances
title: Résolution des dépendances des Plugins
x-i18n:
    generated_at: "2026-07-12T15:42:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ae24a82568e275399cb7b68729d2805956792852612f84d6918850305f0eb243
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw gère les dépendances des plugins uniquement au moment de l’installation ou de la mise à jour. Le chargement à l’exécution
ne lance jamais de gestionnaire de paquets, ne répare pas l’arborescence des dépendances et ne modifie pas
le répertoire du paquet OpenClaw.

## Répartition des responsabilités

Les paquets de plugins possèdent leur graphe de dépendances :

- Les dépendances d’exécution résident dans `dependencies` ou
  `optionalDependencies` du paquet du plugin.
- Les importations du SDK ou du cœur sont des importations homologues ou fournies par OpenClaw.
- Les plugins de développement local fournissent leurs propres dépendances déjà installées.
- Les plugins npm et git s’installent dans des racines de paquets gérées par OpenClaw.

OpenClaw possède uniquement le cycle de vie des plugins :

- Découvrir la source du plugin.
- Installer ou mettre à jour le paquet sur demande explicite.
- Enregistrer les métadonnées d’installation.
- Charger le point d’entrée du plugin.
- Échouer avec une erreur exploitable lorsque des dépendances sont manquantes.

## Racines d’installation

OpenClaw utilise des racines stables propres à chaque source :

- Les paquets npm s’installent dans des projets propres à chaque plugin sous
  `~/.openclaw/npm/projects/<encoded-package>`.
- Les paquets git sont clonés sous `~/.openclaw/git`.
- Les installations locales, par chemin ou par archive sont copiées ou référencées sans réparation
  des dépendances.

Les installations npm s’exécutent dans cette racine de projet propre au plugin avec :

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` utilise la même racine de projet npm
propre au plugin pour une archive tar npm-pack locale : OpenClaw lit les métadonnées npm
de l’archive, l’ajoute au projet géré comme dépendance `file:` copiée, exécute
l’installation npm normale ci-dessus, puis vérifie les métadonnées du fichier de verrouillage installé
avant d’accorder sa confiance au plugin. Ce chemin existe pour la validation des paquets et
la preuve des versions candidates, lorsqu’un artefact de paquet local doit se comporter comme
l’artefact du registre qu’il simule.

Utilisez `npm-pack:` pour tester les paquets de plugins officiels ou externes avant leur
publication. Une installation par archive brute ou par chemin est utile pour le débogage local, mais elle
ne prouve pas le même parcours de dépendances qu’un paquet npm ou ClawHub
installé. `npm-pack:` prouve la structure d’installation du paquet géré ; cela ne
prouve pas, à lui seul, que le plugin est un contenu officiel lié au catalogue.

Lorsque le comportement dépend du statut de plugin intégré ou de plugin officiel approuvé,
associez la preuve du paquet local à une installation officielle issue du catalogue ou à un
chemin de paquet publié qui consigne la confiance officielle. L’accès aux assistants privilégiés
et la gestion de la portée officielle approuvée doivent être validés sur ce chemin
d’installation approuvé, et non déduits d’une installation à partir d’une archive tar locale.

Si un plugin échoue à l’exécution en raison d’une importation manquante, corrigez le manifeste du paquet
au lieu de réparer manuellement le projet géré. Les importations d’exécution doivent figurer dans
`dependencies` ou `optionalDependencies` du paquet du plugin ; les `devDependencies`
ne sont pas installées pour les projets d’exécution gérés. Une commande `npm install` locale dans
`~/.openclaw/npm/projects/<encoded-package>` peut débloquer temporairement
un diagnostic, mais elle ne constitue pas une preuve de validation du paquet, car l’installation ou
la mise à jour suivante recrée le projet à partir des métadonnées du paquet.

npm peut remonter les dépendances transitives dans le répertoire
`node_modules` du projet propre au plugin, à côté du paquet du plugin. OpenClaw analyse la racine du projet
géré avant d’accorder sa confiance à l’installation et supprime ce projet lors de la désinstallation, de sorte que
les dépendances d’exécution remontées restent dans le périmètre de nettoyage de ce plugin.

Les paquets de plugins npm publiés peuvent fournir `npm-shrinkwrap.json` ; npm utilise ce
fichier de verrouillage publiable lors de l’installation, et la racine de projet npm gérée par OpenClaw
le prend en charge via le parcours d’installation normal. Les paquets de plugins publiables
gérés par OpenClaw doivent inclure un fichier shrinkwrap local au paquet, généré à partir du
graphe de dépendances publié de ce paquet :

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

Le générateur supprime les `devDependencies` du plugin, applique la politique de remplacement
de l’espace de travail et écrit `extensions/<id>/npm-shrinkwrap.json` pour chaque plugin dont
`openclaw.release.publishToNpm: true`. Les paquets de plugins tiers peuvent également
fournir un fichier shrinkwrap ; OpenClaw n’en exige pas pour les paquets communautaires, mais
npm le respecte lorsqu’il est présent.

Avant de considérer un paquet local comme preuve d’une version candidate, inspectez
l’archive tar qui sera installée :

```bash
npm pack --pack-destination /tmp
tar -xOf /tmp/<plugin-package>.tgz package/package.json
tar -tf /tmp/<plugin-package>.tgz | grep '^package/dist/'
```

Pour les modifications de dépendances, vérifiez également qu’une installation de production peut résoudre les
paquets d’exécution sans dépendances de développement :

```bash
tmpdir=$(mktemp -d)
(
  cd "$tmpdir"
  npm init -y >/dev/null
  npm install --package-lock-only --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts /tmp/<plugin-package>.tgz
)
rm -rf "$tmpdir"
```

Les paquets de plugins npm appartenant à OpenClaw peuvent également être publiés avec des
`bundledDependencies` explicites. Le processus de publication npm superpose la liste des
noms des dépendances d’exécution, supprime du manifeste publié les métadonnées d’espace de
travail réservées au développement, exécute une installation npm sans scripts pour les
dépendances d’exécution locales au paquet, puis crée ou publie l’archive tar du plugin en
incluant les fichiers de ces dépendances. Les paquets utilisant beaucoup de composants
natifs (Codex, ACPX, Copilot, llama.cpp, memory-lancedb, Tlon) désactivent ce mécanisme avec
`openclaw.release.bundleRuntimeDependencies: false` ; ils fournissent toujours un fichier
shrinkwrap, mais npm résout les dépendances d’exécution pendant l’installation au lieu
d’intégrer tous les binaires de chaque plateforme dans l’archive tar du plugin. Le paquet
racine `openclaw` n’intègre pas l’intégralité de son arborescence de dépendances.

Les plugins qui importent `openclaw/plugin-sdk/*` déclarent `openclaw` comme dépendance
homologue. OpenClaw n’autorise pas npm à installer une copie distincte du paquet hôte depuis
le registre dans un projet géré, car un paquet hôte obsolète peut affecter la résolution
des dépendances homologues de npm au sein de ce plugin. Les installations npm gérées
ignorent la résolution et la matérialisation des dépendances homologues par npm, et OpenClaw
rétablit les liens `node_modules/openclaw` locaux au plugin pour les paquets installés qui
déclarent la dépendance homologue hôte, après une installation ou une mise à jour.

Les installations git clonent ou actualisent le dépôt, puis exécutent :

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Le plugin installé est ensuite chargé depuis le répertoire de ce paquet ; la résolution
dans les répertoires `node_modules` locaux au paquet et parents fonctionne donc comme pour
un paquet Node normal.

## Plugins locaux

Les plugins locaux sont des répertoires contrôlés par le développeur. OpenClaw n’exécute
jamais `npm install`, `pnpm install` ni de réparation des dépendances pour ceux-ci ; si un
plugin local possède des dépendances, installez-les dans ce plugin avant de le charger.

Les plugins TypeScript locaux tiers sont chargés par Jiti comme solution de dernier recours.
Les plugins JavaScript empaquetés et les plugins internes intégrés sont chargés par
import/require natif.

## Démarrage et rechargement

Le démarrage du Gateway et le rechargement de la configuration n’installent jamais les
dépendances des plugins. Ils lisent les enregistrements d’installation des plugins,
déterminent le point d’entrée et le chargent.

L’absence d’une dépendance à l’exécution fait échouer le chargement du plugin avec une erreur
qui indique à l’opérateur une correction explicite :

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` nettoie l’ancien état des dépendances généré par OpenClaw et peut restaurer
les plugins téléchargeables absents des enregistrements d’installation locaux lorsque la
configuration les référence encore. Doctor ne répare pas les dépendances d’un plugin local
déjà installé.

## Plugins intégrés

Les plugins intégrés légers et essentiels au cœur du système sont distribués avec OpenClaw.
Ils ne doivent soit comporter aucune arborescence lourde de dépendances d’exécution, soit être
déplacés vers un paquet téléchargeable sur ClawHub/npm.

Pour consulter la liste actuellement générée des plugins distribués dans le paquet principal,
installés séparément ou conservés uniquement sous forme de code source, voir
[Inventaire des plugins](/fr/plugins/plugin-inventory).

Les manifestes des plugins intégrés ne doivent pas demander la préparation des dépendances.
Les fonctionnalités de plugin volumineuses ou facultatives doivent être empaquetées comme
un plugin normal et installées par le même processus npm/git/ClawHub que les plugins tiers.

Dans les extractions du code source, OpenClaw traite le dépôt comme un monorepo pnpm.
Après `pnpm install`, les plugins intégrés sont chargés depuis `extensions/<id>` afin que
les dépendances d’espace de travail locales au paquet soient disponibles et que les
modifications soient directement prises en compte. Le développement depuis une extraction
du code source utilise exclusivement pnpm ; une simple commande `npm install` à la racine
du dépôt ne prépare pas les dépendances des plugins intégrés.

| Forme d’installation             | Emplacement du plugin intégré         | Propriétaire des dépendances                                           |
| -------------------------------- | ------------------------------------- | ---------------------------------------------------------------------- |
| `npm install -g openclaw`        | Arborescence d’exécution compilée dans le paquet | Paquet OpenClaw et processus explicites d’installation, de mise à jour et de réparation des plugins |
| Extraction Git avec `pnpm install` | Paquets d’espace de travail `extensions/<id>` | L’espace de travail pnpm, y compris les dépendances propres à chaque paquet de plugin |
| `openclaw plugins install ...`   | Racine du projet npm/git/ClawHub géré | Le processus d’installation et de mise à jour du plugin                 |

## Nettoyage de l’ancien fonctionnement

Les anciennes versions d’OpenClaw généraient des racines de dépendances pour les plugins
intégrés au démarrage ou pendant une réparation par Doctor. Le nettoyage actuel de Doctor
supprime avec `--fix` ces répertoires et liens symboliques obsolètes, notamment les anciennes
racines `plugin-runtime-deps`, les liens symboliques de paquets dans le préfixe Node global
qui pointent vers des cibles `plugin-runtime-deps` supprimées, les manifestes
`.openclaw-runtime-deps*`, les répertoires `node_modules` de plugins générés, les répertoires
intermédiaires d’installation et les dépôts pnpm locaux aux paquets. Le script postinstall
des paquets supprime également ces liens symboliques globaux avant d’élaguer les anciennes
racines cibles, afin que les mises à niveau ne laissent pas d’importations de paquets ESM
orphelines.

Les anciennes installations npm utilisaient également une racine partagée
`~/.openclaw/npm/node_modules`. Les processus actuels d’installation, de mise à jour, de
désinstallation et de réparation reconnaissent encore cette ancienne racine plate,
uniquement à des fins de restauration et de nettoyage. Les nouvelles installations npm
créent à la place une racine de projet par plugin.
