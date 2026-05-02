---
read_when:
    - Vous déboguez les installations de paquets de plugins
    - Vous modifiez le comportement de démarrage du Plugin, de doctor ou d’installation par le gestionnaire de paquets
    - Vous maintenez des installations OpenClaw empaquetées ou des manifestes de Plugin groupés
sidebarTitle: Dependencies
summary: Comment OpenClaw installe les paquets de Plugin et résout les dépendances de Plugin
title: Résolution des dépendances de Plugin
x-i18n:
    generated_at: "2026-05-02T07:14:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 43d8008c837d519fd7c886f9615ad53941da340d753b559dfb0a32877716bc1f
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Résolution des dépendances des plugins

OpenClaw garde le travail sur les dépendances des plugins au moment de l’installation/mise à jour. Le chargement à l’exécution n’exécute pas de gestionnaires de paquets, ne répare pas les arbres de dépendances et ne modifie pas le répertoire de paquets d’OpenClaw.

## Répartition des responsabilités

Les paquets de plugins sont responsables de leur graphe de dépendances :

- les dépendances d’exécution se trouvent dans les `dependencies` ou `optionalDependencies` du paquet de plugin
- les imports SDK/core sont des dépendances pair ou des imports fournis par OpenClaw
- les plugins de développement local apportent leurs propres dépendances déjà installées
- les plugins npm et git sont installés dans des racines de paquets appartenant à OpenClaw

OpenClaw ne gère que le cycle de vie des plugins :

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

npm peut remonter les dépendances transitives vers `~/.openclaw/npm/node_modules`, à côté du paquet de plugin. OpenClaw analyse la racine npm gérée avant de faire confiance à l’installation et utilise npm pour supprimer les paquets gérés par npm pendant la désinstallation ; les dépendances d’exécution remontées restent donc dans la limite de nettoyage gérée.

Les installations git clonent ou actualisent le dépôt, puis exécutent :

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Le plugin installé se charge ensuite depuis ce répertoire de paquet ; la résolution des `node_modules` locaux au paquet et parents fonctionne donc de la même façon que pour un paquet Node normal.

## Plugins locaux

Les plugins locaux sont traités comme des répertoires contrôlés par les développeurs. OpenClaw n’exécute pas `npm install`, `pnpm install` ni de réparation des dépendances pour eux. Si un plugin local a des dépendances, installez-les dans ce plugin avant de le charger.

Les plugins locaux TypeScript tiers peuvent utiliser le chemin Jiti d’urgence. Les plugins JavaScript empaquetés et les plugins internes groupés se chargent via import/require natif au lieu de Jiti.

## Démarrage et rechargement

Le démarrage du Gateway et le rechargement de la configuration n’installent jamais les dépendances de plugins. Ils lisent les enregistrements d’installation des plugins, calculent le point d’entrée et le chargent.

Si une dépendance est manquante à l’exécution, le plugin échoue au chargement et l’erreur doit indiquer à l’opérateur une correction explicite :

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` peut nettoyer l’état de dépendances hérité généré par OpenClaw et installer les plugins téléchargeables configurés qui sont absents des enregistrements d’installation locaux. Il ne répare pas les dépendances d’un plugin local déjà installé.

## Plugins groupés

Les plugins groupés légers et critiques pour le cœur sont livrés avec OpenClaw. Ils ne doivent pas avoir d’arbre de dépendances d’exécution lourd, ou doivent être déplacés vers un paquet téléchargeable sur ClawHub/npm.

Les manifestes de plugins groupés ne doivent pas demander de préparation des dépendances. Les fonctionnalités de plugin volumineuses ou facultatives doivent être empaquetées comme un plugin normal et installées via le même chemin npm/git/ClawHub que les plugins tiers.

Dans les extractions de source, OpenClaw traite le dépôt comme un monorepo pnpm. Après `pnpm install`, les plugins groupés se chargent depuis `extensions/<id>` afin que les dépendances d’espace de travail locales au paquet soient disponibles et que les modifications soient prises en compte directement. Le développement sur une extraction de source est exclusivement pnpm ; un simple `npm install` à la racine du dépôt n’est pas une méthode prise en charge pour préparer les dépendances des plugins groupés.

| Forme d’installation             | Emplacement du plugin groupé          | Responsable des dépendances                                           |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Arbre d’exécution construit dans le paquet | Paquet OpenClaw et flux explicites d’installation/mise à jour/doctor des plugins |
| Extraction git plus `pnpm install` | Paquets d’espace de travail `extensions/<id>` | L’espace de travail pnpm, y compris les propres dépendances de chaque paquet de plugin |
| `openclaw plugins install ...`   | Racine de plugin npm/git/ClawHub gérée | Le flux d’installation/mise à jour du plugin                         |

## Nettoyage hérité

Les anciennes versions d’OpenClaw généraient des racines de dépendances de plugins groupés au démarrage ou pendant la réparation doctor. Le nettoyage doctor actuel supprime ces répertoires et liens symboliques obsolètes lorsque `--fix` est utilisé, y compris les anciennes racines `plugin-runtime-deps`, les manifestes `.openclaw-runtime-deps*`, les `node_modules` de plugin générés, les répertoires d’étape d’installation et les stores pnpm locaux au paquet.

Ces chemins ne sont que des résidus hérités. Les nouvelles installations ne doivent pas les créer.
