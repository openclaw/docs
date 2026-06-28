---
read_when:
    - Transfert de la responsabilité de l’hôte Canvas, des outils, des commandes, de la documentation ou du protocole
    - Audit pour déterminer si Canvas relève toujours du noyau
    - Préparation ou revue de la PR du Plugin Canvas expérimental
summary: Plan et liste de contrôle d’audit pour déplacer Canvas hors du noyau vers un Plugin expérimental intégré.
title: Refactorisation du Plugin Canvas
x-i18n:
    generated_at: "2026-05-07T13:26:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1470edb74d5f8fe96224d38821ba0b3b13f8ce756124125af64fc3e49df0fcb8
    source_path: refactor/canvas.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Refactorisation du plugin Canvas

Canvas est peu utilisé et expérimental. Traitez-le comme un plugin groupé, et non comme une fonctionnalité du cœur. Le cœur peut conserver la plomberie générique du Gateway, des nœuds, de HTTP, de l’authentification, de la configuration et du client natif, mais le comportement propre à Canvas doit résider sous `extensions/canvas`.

## Objectif

Déplacer la responsabilité de Canvas vers `extensions/canvas` tout en préservant le comportement actuel des nœuds appairés :

- l’outil `canvas` exposé à l’agent est enregistré par le plugin Canvas
- les commandes de nœud Canvas ne sont autorisées que lorsque le plugin Canvas les enregistre
- les fichiers hôte/source A2UI résident sous le plugin Canvas
- la matérialisation des documents Canvas réside sous le plugin Canvas
- l’implémentation de la commande CLI réside sous le plugin Canvas, ou délègue via un barrel d’exécution appartenant au plugin
- la documentation et l’inventaire des plugins décrivent Canvas comme expérimental et adossé à un plugin

## Non-objectifs

- Ne pas reconcevoir l’interface utilisateur Canvas de l’application native dans cette refactorisation.
- Ne pas supprimer la prise en charge du protocole/client Canvas d’iOS, Android ou macOS, sauf si une décision produit distincte indique que Canvas doit être supprimé.
- Ne pas construire un vaste framework de service de plugins uniquement pour Canvas, sauf si au moins un autre plugin groupé a besoin du même raccord.

## État actuel de la branche

Terminé :

- Ajout d’un paquet de plugin groupé dans `extensions/canvas`.
- Ajout de `extensions/canvas/openclaw.plugin.json`.
- Déplacement de l’outil d’agent `canvas` de `src/agents/tools/canvas-tool.ts` vers `extensions/canvas/src/tool.ts`.
- Suppression de l’enregistrement cœur de `createCanvasTool` depuis `src/agents/openclaw-tools.ts`.
- Déplacement de l’implémentation de l’hôte Canvas de `src/canvas-host` vers `extensions/canvas/src/host`.
- Conservation de `extensions/canvas/runtime-api.ts` comme barrel de compatibilité appartenant au plugin pour les tests, le packaging et les helpers Canvas publics externes.
- Déplacement de la matérialisation des documents Canvas de `src/gateway/canvas-documents.ts` vers `extensions/canvas/src/documents.ts`.
- Déplacement de l’implémentation CLI Canvas et des helpers JSONL A2UI dans `extensions/canvas/src/cli.ts`.
- Déplacement de l’URL de l’hôte Canvas et des helpers de capacité à portée limitée dans `extensions/canvas/src`.
- Déplacement des valeurs par défaut des commandes de nœud Canvas hors des listes du cœur codées en dur et vers `nodeInvokePolicies` du plugin.
- Ajout de la configuration de l’hôte Canvas appartenant au plugin à `plugins.entries.canvas.config.host`.
- Déplacement du service HTTP Canvas et A2UI derrière l’enregistrement des routes HTTP du plugin Canvas.
- Ajout d’un dispatch générique de mise à niveau WebSocket de plugin pour les routes HTTP appartenant aux plugins.
- Remplacement de l’URL d’hôte de Gateway propre à Canvas et de l’authentification par capacité de nœud par une surface de plugin hébergée générique et des helpers de capacité de nœud.
- Ajout de résolveurs de médias hébergés appartenant au plugin, afin que les URL de documents Canvas soient résolues via le plugin Canvas au lieu que le cœur importe les éléments internes des documents Canvas.
- Ajout de `api.registerNodeCliFeature(...)` afin que Canvas puisse déclarer `openclaw nodes canvas` comme fonctionnalité de nœud appartenant au plugin sans écrire manuellement le chemin de la commande parente.
- Suppression des imports de production `src/**` de `extensions/canvas/runtime-api.js`.
- Déplacement de la source du bundle A2UI de `apps/shared/OpenClawKit/Tools/CanvasA2UI` vers `extensions/canvas/src/host/a2ui-app`.
- Déplacement de l’implémentation de construction/copie A2UI sous `extensions/canvas/scripts` et remplacement du câblage de construction racine par des hooks génériques d’actifs de plugins groupés.
- Suppression de l’alias de configuration historique d’exécution de niveau supérieur `canvasHost`.
- Conservation de la migration doctor Canvas afin que `openclaw doctor --fix` réécrive les anciennes configurations `canvasHost` en `plugins.entries.canvas.config.host`.
- Suppression de la compatibilité de protocole Canvas des anciens agents derrière le protocole Gateway v4. Les clients natifs et les gateways utilisent désormais uniquement `pluginSurfaceUrls.canvas` plus `node.pluginSurface.refresh` ; les chemins obsolètes `canvasHostUrl`, `canvasCapability` et `node.canvas.capability.refresh` sont intentionnellement non pris en charge dans cette refactorisation expérimentale.
- Mise à jour de l’inventaire généré des plugins pour inclure Canvas.
- Ajout de la documentation de référence du plugin à `docs/plugins/reference/canvas.md`.

Surfaces Canvas connues qui restent détenues par le cœur :

- Les gestionnaires Canvas des applications natives sous `apps/` consomment encore intentionnellement la surface du plugin Canvas
- les gestionnaires protocole/client Canvas des applications natives sous `apps/`
- la sortie d’artefact publiée utilise encore `dist/canvas-host/a2ui` pour une recherche d’exécution rétrocompatible, mais l’étape de copie appartient désormais au plugin

## Forme cible

`extensions/canvas` doit posséder :

- le manifeste de plugin et les métadonnées de paquet
- l’enregistrement de l’outil d’agent
- la politique de commande d’invocation de nœud
- l’hôte Canvas et l’exécution A2UI
- la source du bundle Canvas A2UI et les scripts de construction/copie d’actifs
- la création de documents Canvas et la résolution d’actifs
- l’implémentation CLI Canvas
- la page de documentation Canvas et l’entrée d’inventaire du plugin

Le cœur ne doit posséder que des raccords génériques :

- la découverte et l’enregistrement des plugins
- le registre générique des outils d’agent
- le registre générique des politiques d’invocation de nœud
- le dispatch générique HTTP/auth et de mise à niveau WebSocket du Gateway
- la résolution générique des URL de surface de plugin hébergée
- l’enregistrement générique des résolveurs de médias hébergés
- le transport générique des capacités de nœud
- la plomberie générique de configuration
- la découverte générique des hooks d’actifs de plugins groupés

Les applications natives peuvent conserver les gestionnaires de commandes Canvas comme clients du protocole. Elles ne sont pas propriétaires de l’exécution du plugin.

## Étapes de migration

1. Traiter `plugins.entries.canvas.config.host` comme la surface de configuration appartenant au plugin.
2. Mettre à jour la documentation afin que Canvas soit décrit comme un plugin groupé expérimental.
3. Exécuter les tests Canvas ciblés, les vérifications d’inventaire des plugins, les vérifications d’API du SDK de plugin, ainsi que les gates de build/type affectés par les frontières d’exécution.

## Liste d’audit

Avant de considérer la refactorisation comme terminée :

- `rg "src/canvas-host|../canvas-host"` ne renvoie aucun import de source actif.
- `rg "canvas-tool|createCanvasTool" src` ne trouve aucune implémentation d’outil Canvas appartenant au cœur.
- `rg "canvas.present|canvas.snapshot|canvas.a2ui" src/gateway` ne trouve aucune valeur par défaut de liste d’autorisation codée en dur hors des tests de politique générique de plugin.
- `rg "extensions/canvas/runtime-api" src --glob '!**/*.test.ts'` est vide.
- `rg "canvas-documents" src` est vide.
- `rg "registerNodesCanvasCommands|nodes-canvas" src` est vide ; le plugin Canvas enregistre `openclaw nodes canvas` via les métadonnées CLI imbriquées du plugin.
- `rg "createCanvasHostHandler|handleA2uiHttpRequest" src/gateway` ne renvoie aucune propriété d’exécution Gateway.
- `rg "apps/shared/OpenClawKit/Tools/CanvasA2UI|canvas-a2ui-copy|extensions/canvas/src/host/a2ui" scripts .github package.json` ne trouve que des wrappers de compatibilité ou des chemins appartenant au plugin.
- `pnpm plugins:inventory:check` réussit.
- `pnpm plugin-sdk:api:check` réussit, ou les baselines d’API générées sont mises à jour et relues intentionnellement.
- Les tests Canvas ciblés réussissent.
- Les tests changed-lanes réussissent pour les chemins hôte Canvas/A2UI.
- Le corps de la PR indique explicitement que Canvas est expérimental et adossé à un plugin.

## Commandes de vérification

Utilisez des vérifications locales ciblées pendant l’itération :

```sh
pnpm test extensions/canvas/src/host/server.test.ts extensions/canvas/src/host/server.state-dir.test.ts extensions/canvas/src/host/file-resolver.test.ts
pnpm test src/gateway/server.plugin-node-capability-auth.test.ts src/gateway/server-import-boundary.test.ts
pnpm test extensions/canvas/src/config-migration.test.ts src/commands/doctor-legacy-config.migrations.test.ts
pnpm test test/scripts/changed-lanes.test.ts test/scripts/build-all.test.ts extensions/canvas/scripts/bundle-a2ui.test.ts test/scripts/bundled-plugin-assets.test.ts extensions/canvas/scripts/copy-a2ui.test.ts src/infra/run-node.test.ts
pnpm tsgo:extensions
pnpm plugins:inventory:check
pnpm plugin-sdk:api:check
```

Exécutez `pnpm build` avant de pousser si le barrel d’exécution, l’import paresseux, le packaging ou les surfaces de plugin publiées changent.
