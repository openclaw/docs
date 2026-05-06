---
read_when:
    - Vous déboguez les installations de packages de Plugin
    - Vous modifiez le comportement de démarrage du Plugin, de doctor ou d’installation via le gestionnaire de paquets
    - Vous assurez la maintenance d’installations OpenClaw empaquetées ou de manifestes de Plugin intégrés
sidebarTitle: Dependencies
summary: Comment OpenClaw installe les packages de plugins et résout les dépendances de plugins
title: Résolution des dépendances du Plugin
x-i18n:
    generated_at: "2026-05-06T07:33:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4ef307fb034d397a5e2e991254fb881046c73a4e6d860073b90f2b4e0667edc2
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Résolution des dépendances des Plugin

OpenClaw conserve le traitement des dépendances des plugins au moment de l’installation/mise à jour. Le chargement à l’exécution
n’exécute pas de gestionnaires de paquets, ne répare pas les arbres de dépendances et ne modifie pas le répertoire du paquet
OpenClaw.

## Répartition des responsabilités

Les paquets de plugins possèdent leur graphe de dépendances :

- les dépendances d’exécution résident dans les `dependencies` ou
  `optionalDependencies` du paquet de plugin
- les imports SDK/core sont des imports pairs ou fournis par OpenClaw
- les plugins de développement local apportent leurs propres dépendances déjà installées
- les plugins npm et git sont installés dans des racines de paquets appartenant à OpenClaw

OpenClaw possède uniquement le cycle de vie des plugins :

- découvrir la source du plugin
- installer ou mettre à jour le paquet lorsque cela est explicitement demandé
- enregistrer les métadonnées d’installation
- charger le point d’entrée du plugin
- échouer avec une erreur exploitable lorsque des dépendances manquent

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
l’installation et utilise npm pour supprimer les paquets gérés par npm lors de la désinstallation, afin que les dépendances
d’exécution hissées restent dans le périmètre de nettoyage géré.

Les plugins qui importent `openclaw/plugin-sdk/*` déclarent `openclaw` comme dépendance
paire. OpenClaw ne laisse pas npm installer une copie de registre séparée du paquet
hôte dans la racine gérée, car des paquets hôtes obsolètes peuvent affecter la
résolution des pairs par npm lors d’installations ultérieures de plugins. À la place, une fois que npm a terminé
de modifier la racine partagée pendant l’installation, la mise à jour ou la désinstallation, OpenClaw réaffirme
les liens `node_modules/openclaw` locaux aux plugins pour les paquets installés qui déclarent
le pair hôte.

Les installations git clonent ou actualisent le dépôt, puis exécutent :

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Le plugin installé se charge ensuite depuis ce répertoire de paquet, de sorte que la résolution
des `node_modules` locaux au paquet et parents fonctionne de la même manière que pour un paquet
Node normal.

## Plugins locaux

Les plugins locaux sont traités comme des répertoires contrôlés par le développeur. OpenClaw n’exécute pas
`npm install`, `pnpm install` ni de réparation des dépendances pour eux. Si un plugin
local a des dépendances, installez-les dans ce plugin avant de le charger.

Les plugins locaux TypeScript tiers peuvent utiliser le chemin Jiti d’urgence. Les plugins
JavaScript empaquetés et les plugins internes groupés se chargent via
import/require natif plutôt que par Jiti.

## Démarrage et rechargement

Le démarrage du Gateway et le rechargement de configuration n’installent jamais les dépendances des plugins. Ils lisent
les enregistrements d’installation des plugins, calculent le point d’entrée et le chargent.

Si une dépendance manque à l’exécution, le plugin échoue au chargement et l’erreur
doit orienter l’opérateur vers une correction explicite :

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` peut nettoyer l’état hérité des dépendances générées par OpenClaw et récupérer
les plugins téléchargeables qui manquent dans les enregistrements d’installation locaux lorsque la configuration
les référence. Doctor ne répare pas les dépendances d’un plugin local déjà installé.

## Plugins groupés

Les plugins groupés légers et critiques pour le cœur sont livrés avec OpenClaw.
Ils ne doivent pas avoir d’arbre de dépendances d’exécution lourd, ou bien ils doivent être déplacés vers un
paquet téléchargeable sur ClawHub/npm.

Pour la liste générée actuelle des plugins livrés dans le paquet core, installés
externe­ment ou conservés uniquement sous forme source, consultez [Inventaire des plugins](/fr/plugins/plugin-inventory).

Les manifestes de plugins groupés ne doivent pas demander de préparation des dépendances. Les fonctionnalités
de plugin volumineuses ou facultatives doivent être empaquetées comme un plugin normal et installées via
le même chemin npm/git/ClawHub que les plugins tiers.

Dans les extractions source, OpenClaw traite le dépôt comme un monorepo pnpm. Après
`pnpm install`, les plugins groupés se chargent depuis `extensions/<id>` afin que les dépendances
d’espace de travail locales au paquet soient disponibles et que les modifications soient reprises directement. Le développement
depuis une extraction source est réservé à pnpm ; un simple `npm install` à la racine du dépôt n’est
pas une méthode prise en charge pour préparer les dépendances des plugins groupés.

| Forme d’installation             | Emplacement du plugin groupé          | Propriétaire des dépendances                                        |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Arbre d’exécution construit dans le paquet | Paquet OpenClaw et flux explicites d’installation/mise à jour/doctor des plugins |
| Extraction git plus `pnpm install` | Paquets d’espace de travail `extensions/<id>` | L’espace de travail pnpm, y compris les propres dépendances de chaque paquet de plugin |
| `openclaw plugins install ...`   | Racine de plugin npm/git/ClawHub gérée | Le flux d’installation/mise à jour du plugin                         |

## Nettoyage hérité

Les anciennes versions d’OpenClaw généraient des racines de dépendances de plugins groupés au démarrage ou
pendant la réparation doctor. Le nettoyage doctor actuel supprime ces répertoires et
liens symboliques obsolètes lorsque `--fix` est utilisé, y compris les anciennes racines `plugin-runtime-deps`, les liens symboliques
de paquets à préfixe Node global qui pointent vers des cibles `plugin-runtime-deps` élaguées,
les manifestes `.openclaw-runtime-deps*`, les `node_modules` de plugins générés, les répertoires
d’étape d’installation et les stores pnpm locaux aux paquets. Le postinstall empaqueté supprime aussi
ces liens symboliques globaux avant d’élaguer les racines cibles héritées afin que les mises à niveau
ne laissent pas d’importations de paquets ESM pendantes.

Ces chemins ne sont que des résidus hérités. Les nouvelles installations ne doivent pas les créer.
