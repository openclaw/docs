---
read_when:
    - Déplacement de la propriété de l’hôte Canvas, des outils, des commandes, de la documentation ou du protocole
    - Vérification du maintien de Canvas sous la responsabilité du cœur système
    - Préparation ou révision de la PR du plugin expérimental Canvas
summary: Plan et liste de contrôle d’audit pour déplacer Canvas hors du cœur vers un plugin expérimental intégré.
title: Refactorisation du plugin Canvas
x-i18n:
    generated_at: "2026-07-12T03:04:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1470edb74d5f8fe96224d38821ba0b3b13f8ce756124125af64fc3e49df0fcb8
    source_path: refactor/canvas.md
    workflow: 16
---

# Refactorisation du plugin Canvas

Canvas est peu utilisé et expérimental. Traitez-le comme un plugin intégré, et non comme une fonctionnalité du cœur. Le cœur peut conserver la plomberie générique du Gateway, des nœuds, de HTTP, de l’authentification, de la configuration et des clients natifs, mais le comportement propre à Canvas doit résider sous `extensions/canvas`.

## Objectif

Transférer la responsabilité de Canvas à `extensions/canvas` tout en préservant le comportement actuel des nœuds appairés :

- l’outil `canvas` destiné à l’agent est enregistré par le plugin Canvas
- les commandes de nœud Canvas ne sont autorisées que lorsque le plugin Canvas les enregistre
- les fichiers hôtes/sources A2UI résident sous le plugin Canvas
- la matérialisation des documents Canvas réside sous le plugin Canvas
- l’implémentation de la commande CLI réside sous le plugin Canvas, ou délègue via un barrel d’exécution appartenant au plugin
- la documentation et l’inventaire des plugins décrivent Canvas comme expérimental et fondé sur un plugin

## Hors objectifs

- Ne pas reconcevoir l’interface utilisateur Canvas de l’application native dans le cadre de cette refactorisation.
- Ne pas supprimer la prise en charge du protocole/client Canvas sur iOS, Android ou macOS, sauf si une décision produit distincte prévoit la suppression de Canvas.
- Ne pas créer un vaste framework de services pour plugins uniquement pour Canvas, sauf si au moins un autre plugin intégré nécessite la même interface.

## État actuel de la branche

Terminé :

- Ajout du paquet de plugin intégré dans `extensions/canvas`.
- Ajout de `extensions/canvas/openclaw.plugin.json`.
- Déplacement de l’outil agent `canvas` de `src/agents/tools/canvas-tool.ts` vers `extensions/canvas/src/tool.ts`.
- Suppression de l’enregistrement dans le cœur de `createCanvasTool` depuis `src/agents/openclaw-tools.ts`.
- Déplacement de l’implémentation de l’hôte Canvas de `src/canvas-host` vers `extensions/canvas/src/host`.
- Conservation de `extensions/canvas/runtime-api.ts` comme barrel de compatibilité appartenant au plugin pour les tests, le conditionnement et les fonctions d’assistance Canvas publiques externes.
- Déplacement de la matérialisation des documents Canvas de `src/gateway/canvas-documents.ts` vers `extensions/canvas/src/documents.ts`.
- Déplacement de l’implémentation de la CLI Canvas et des fonctions d’assistance JSONL A2UI vers `extensions/canvas/src/cli.ts`.
- Déplacement de l’URL de l’hôte Canvas et des fonctions d’assistance de capacité à portée limitée vers `extensions/canvas/src`.
- Déplacement des valeurs par défaut des commandes de nœud Canvas hors des listes codées en dur du cœur vers les `nodeInvokePolicies` du plugin.
- Ajout d’une configuration de l’hôte Canvas appartenant au plugin dans `plugins.entries.canvas.config.host`.
- Déplacement de la mise à disposition HTTP de Canvas et d’A2UI derrière l’enregistrement des routes HTTP du plugin Canvas.
- Ajout d’un routage générique des mises à niveau WebSocket de plugin pour les routes HTTP appartenant aux plugins.
- Remplacement de l’URL d’hôte et de l’authentification des capacités de nœud propres à Canvas dans le Gateway par des fonctions d’assistance génériques pour les surfaces de plugin hébergées et les capacités de nœud.
- Ajout de résolveurs de médias hébergés appartenant au plugin afin que les URL des documents Canvas soient résolues par le plugin Canvas au lieu que le cœur importe les composants internes des documents Canvas.
- Ajout de `api.registerNodeCliFeature(...)` afin que Canvas puisse déclarer `openclaw nodes canvas` comme une fonctionnalité de nœud appartenant au plugin sans devoir spécifier manuellement le chemin de la commande parente.
- Suppression des importations de production de `extensions/canvas/runtime-api.js` depuis `src/**`.
- Déplacement de la source du bundle A2UI de `apps/shared/OpenClawKit/Tools/CanvasA2UI` vers `extensions/canvas/src/host/a2ui-app`.
- Déplacement de l’implémentation de la compilation/copie A2UI sous `extensions/canvas/scripts` et remplacement du câblage de compilation à la racine par des hooks génériques de ressources de plugins intégrés.
- Suppression de l’alias de configuration d’exécution hérité de premier niveau `canvasHost`.
- Conservation de la migration Canvas de doctor afin que `openclaw doctor --fix` réécrive les anciennes configurations `canvasHost` en `plugins.entries.canvas.config.host`.
- Suppression de la compatibilité du protocole Canvas avec les anciens agents derrière la version 4 du protocole Gateway. Les clients natifs et les Gateways utilisent désormais uniquement `pluginSurfaceUrls.canvas` ainsi que `node.pluginSurface.refresh` ; le chemin obsolète `canvasHostUrl`, `canvasCapability` et `node.canvas.capability.refresh` n’est intentionnellement pas pris en charge dans cette refactorisation expérimentale.
- Mise à jour de l’inventaire généré des plugins pour inclure Canvas.
- Ajout de la documentation de référence du plugin dans `docs/plugins/reference/canvas.md`.

Surfaces Canvas restantes connues appartenant au cœur :

- les gestionnaires Canvas de l’application native sous `apps/` continuent intentionnellement de consommer la surface du plugin Canvas
- les gestionnaires de protocole/client Canvas de l’application native sous `apps/`
- la sortie de l’artefact publié utilise encore `dist/canvas-host/a2ui` pour une recherche d’exécution rétrocompatible, mais l’étape de copie appartient désormais au plugin

## Structure cible

`extensions/canvas` doit posséder :

- le manifeste du plugin et les métadonnées du paquet
- l’enregistrement de l’outil agent
- la politique des commandes d’invocation de nœud
- l’hôte Canvas et l’exécution A2UI
- la source du bundle A2UI de Canvas et les scripts de compilation/copie des ressources
- la création de documents Canvas et la résolution des ressources
- l’implémentation de la CLI Canvas
- la page de documentation Canvas et l’entrée dans l’inventaire des plugins

Le cœur ne doit posséder que des interfaces génériques :

- la découverte et l’enregistrement des plugins
- le registre générique des outils d’agent
- le registre générique des politiques d’invocation de nœud
- l’authentification HTTP générique du Gateway et le routage des mises à niveau WebSocket
- la résolution générique des URL de surfaces de plugin hébergées
- l’enregistrement générique des résolveurs de médias hébergés
- le transport générique des capacités de nœud
- la plomberie générique de configuration
- la découverte générique des hooks de ressources de plugins intégrés

Les applications natives peuvent conserver les gestionnaires de commandes Canvas en tant que clients du protocole. Elles ne sont pas responsables de l’exécution du plugin.

## Étapes de migration

1. Traiter `plugins.entries.canvas.config.host` comme la surface de configuration appartenant au plugin.
2. Mettre à jour la documentation afin que Canvas soit décrit comme un plugin intégré expérimental.
3. Exécuter les tests Canvas ciblés, les vérifications de l’inventaire des plugins, les vérifications de l’API du SDK de plugin et les contrôles de compilation/types affectés par les limites d’exécution.

## Liste de contrôle d’audit

Avant de déclarer la refactorisation terminée :

- `rg "src/canvas-host|../canvas-host"` ne renvoie aucune importation active dans le code source.
- `rg "canvas-tool|createCanvasTool" src` ne trouve aucune implémentation de l’outil Canvas appartenant au cœur.
- `rg "canvas.present|canvas.snapshot|canvas.a2ui" src/gateway` ne trouve aucune valeur par défaut de liste d’autorisation codée en dur en dehors des tests génériques de politique de plugin.
- `rg "extensions/canvas/runtime-api" src --glob '!**/*.test.ts'` ne renvoie rien.
- `rg "canvas-documents" src` ne renvoie rien.
- `rg "registerNodesCanvasCommands|nodes-canvas" src` ne renvoie rien ; le plugin Canvas enregistre `openclaw nodes canvas` au moyen de métadonnées CLI de plugin imbriquées.
- `rg "createCanvasHostHandler|handleA2uiHttpRequest" src/gateway` ne renvoie aucune responsabilité d’exécution du Gateway.
- `rg "apps/shared/OpenClawKit/Tools/CanvasA2UI|canvas-a2ui-copy|extensions/canvas/src/host/a2ui" scripts .github package.json` ne trouve que des wrappers de compatibilité ou des chemins appartenant au plugin.
- `pnpm plugins:inventory:check` réussit.
- `pnpm plugin-sdk:api:check` réussit, ou les références de base de l’API générées sont intentionnellement mises à jour et examinées.
- Les tests Canvas ciblés réussissent.
- Les tests des ensembles modifiés réussissent pour les chemins de l’hôte Canvas/A2UI.
- Le corps de la PR indique explicitement que Canvas est expérimental et fondé sur un plugin.

## Commandes de vérification

Utilisez des vérifications locales ciblées pendant les itérations :

```sh
pnpm test extensions/canvas/src/host/server.test.ts extensions/canvas/src/host/server.state-dir.test.ts extensions/canvas/src/host/file-resolver.test.ts
pnpm test src/gateway/server.plugin-node-capability-auth.test.ts src/gateway/server-import-boundary.test.ts
pnpm test extensions/canvas/src/config-migration.test.ts src/commands/doctor-legacy-config.migrations.test.ts
pnpm test test/scripts/changed-lanes.test.ts test/scripts/build-all.test.ts extensions/canvas/scripts/bundle-a2ui.test.ts test/scripts/bundled-plugin-assets.test.ts extensions/canvas/scripts/copy-a2ui.test.ts src/infra/run-node.test.ts
pnpm tsgo:extensions
pnpm plugins:inventory:check
pnpm plugin-sdk:api:check
```

Exécutez `pnpm build` avant le push si le barrel d’exécution, l’importation différée, le conditionnement ou les surfaces publiées du plugin changent.
