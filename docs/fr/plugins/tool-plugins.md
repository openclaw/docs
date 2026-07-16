---
read_when:
    - Vous souhaitez créer un Plugin OpenClaw simple qui ajoute uniquement des outils d’agent
    - Vous souhaitez utiliser defineToolPlugin au lieu d’écrire manuellement les métadonnées du manifeste du Plugin
    - Vous devez créer la structure, générer, valider, tester ou publier un plugin contenant uniquement des outils
sidebarTitle: Tool Plugins
summary: Créez des outils d’agent typés simples avec defineToolPlugin et openclaw plugins init/build/validate
title: Plugins d’outils
x-i18n:
    generated_at: "2026-07-16T13:40:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fb9187e1d8aed88eee5c99dcdce89f70cd0d4f930b97aaac2ff868037d63adc1
    source_path: plugins/tool-plugins.md
    workflow: 16
---

`defineToolPlugin` crée un plugin qui ajoute uniquement des outils appelables par l’agent : aucun
canal, fournisseur de modèles, hook, service ni backend de configuration. Il génère les
métadonnées de manifeste dont OpenClaw a besoin pour découvrir les outils sans charger le code
d’exécution du plugin.

Pour les plugins de fournisseur, de canal, de hook, de service ou à capacités mixtes, commencez
plutôt par [Créer des plugins](/fr/plugins/building-plugins), [Plugins de canal](/fr/plugins/sdk-channel-plugins)
ou [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins).

## Prérequis

- Node 22.22.3+, Node 24.15+ ou Node 25.9+.
- Sortie de package TypeScript ESM.
- `typebox` dans `dependencies` (pas seulement `devDependencies` — le plugin généré
  l’importe à l’exécution).
- `openclaw >=2026.5.17`, la première version qui exporte
  `openclaw/plugin-sdk/tool-plugin`.
- Une racine de package qui fournit `dist/`, `openclaw.plugin.json` et
  `package.json`.

## Démarrage rapide

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm install
npm run plugin:build
npm run plugin:validate
npm test
```

`plugins init` génère la structure suivante :

| Fichier                   | Objectif                                                           |
| ---------------------- | ----------------------------------------------------------------- |
| `src/index.ts`         | Point d’entrée `defineToolPlugin` avec un outil `echo`                     |
| `src/index.test.ts`    | Test des métadonnées vérifiant la liste des outils                             |
| `tsconfig.json`        | Sortie TypeScript NodeNext vers `dist/`                             |
| `vitest.config.ts`     | Configuration Vitest pour `src/**/*.test.ts`                              |
| `package.json`         | Scripts, dépendances d’exécution, `openclaw.extensions: ["./dist/index.js"]` |
| `openclaw.plugin.json` | Métadonnées de manifeste générées pour l’outil initial                  |

`npm run plugin:build` exécute `npm run build` (tsc), puis
`openclaw plugins build --entry ./dist/index.js`. `npm run plugin:validate`
reconstruit et exécute `openclaw plugins validate --entry ./dist/index.js`.
Une validation réussie affiche :

```text
Le plugin stock-quotes est valide.
```

Options de `openclaw plugins init <id>` :

| Option                 | Valeur par défaut            | Effet                                 |
| -------------------- | ------------------ | -------------------------------------- |
| `--directory <path>` | `<id>`             | Répertoire de sortie                       |
| `--name <name>`      | `<id>` avec majuscules initiales | Nom d’affichage                           |
| `--type <type>`      | `tool`             | Type de structure générée : `tool` ou `provider`    |
| `--force`            | désactivé                | Remplacer un répertoire de sortie existant |

## Écrire un outil

`defineToolPlugin` accepte l’identité du plugin, un schéma de configuration facultatif et une
liste statique d’outils. Les types des paramètres et de la configuration sont déduits des
schémas TypeBox.

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Stock Quotes",
  description: "Fetch stock quote snapshots.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "Quote API key." })),
    baseUrl: Type.Optional(Type.String({ description: "Quote API base URL." })),
  }),
  tools: (tool) => [
    tool({
      name: "stock_quote",
      label: "Stock Quote",
      description: "Fetch a stock quote snapshot.",
      parameters: Type.Object({
        symbol: Type.String({ description: "Ticker symbol, for example OPEN." }),
      }),
      async execute({ symbol }, config, context) {
        context.signal?.throwIfAborted();
        return {
          symbol: symbol.toUpperCase(),
          configured: Boolean(config.apiKey),
          baseUrl: config.baseUrl ?? "https://api.example.com",
        };
      },
    }),
  ],
});
```

Les noms d’outils constituent l’API stable. Choisissez des noms uniques, en minuscules et
suffisamment précis pour éviter les collisions avec les outils du cœur ou d’autres plugins.

## Outils facultatifs et fabriques d’outils

Définissez `optional: true` lorsque les utilisateurs doivent explicitement ajouter l’outil à la liste d’autorisation avant qu’il
soit envoyé à un modèle. `openclaw plugins build` écrit l’entrée de manifeste
`toolMetadata.<tool>.optional` correspondante, afin qu’OpenClaw puisse déterminer que
l’outil est facultatif sans charger le code d’exécution du plugin.

```typescript
tool({
  name: "workflow_run",
  description: "Run an external workflow.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

Utilisez `factory` lorsqu’un outil a besoin du contexte d’outil d’exécution avant de pouvoir être
créé — pour le désactiver lors d’une exécution précise, examiner l’état du bac à sable ou lier
des assistants d’exécution. Les métadonnées restent statiques même si l’outil concret est créé
à l’exécution.

```typescript
tool({
  name: "local_workflow",
  description: "Run a local workflow outside sandboxed sessions.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  factory({ api, toolContext }) {
    if (toolContext.sandboxed) {
      return null;
    }
    return createLocalWorkflowTool(api);
  },
});
```

Les fabriques déclarent toujours à l’avance un nom d’outil fixe. Utilisez directement `definePluginEntry`
lorsque le plugin calcule dynamiquement les noms d’outils ou combine des outils
avec des hooks, des services, des fournisseurs ou des commandes.

## Valeurs de retour

`defineToolPlugin` encapsule les valeurs de retour simples dans le format de résultat
d’outil OpenClaw :

- Renvoyez une chaîne lorsque le modèle doit voir exactement ce texte.
- Renvoyez une valeur compatible avec JSON lorsque vous souhaitez que le modèle voie du JSON mis en forme
  et qu’OpenClaw conserve la valeur d’origine dans `details`.

```typescript
tool({
  name: "echo_text",
  description: "Echo input text.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => input,
});
```

```typescript
tool({
  name: "echo_json",
  description: "Echo input as structured JSON.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => ({ input, length: input.length }),
});
```

Utilisez une fabrique d’outils lorsque vous avez besoin d’un `AgentToolResult` personnalisé ou souhaitez réutiliser une
implémentation `api.registerTool` existante.

## Configuration

`configSchema` est facultatif. Si vous l’omettez, OpenClaw applique un schéma strict d’objet vide ;
le manifeste généré inclut tout de même `configSchema`.

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "No Config Tools",
  description: "Adds tools that do not need configuration.",
  tools: () => [],
});
```

Avec un `configSchema`, le type du deuxième argument de `execute` est déduit de celui-ci :

```typescript
const configSchema = Type.Object({
  apiKey: Type.String(),
});

export default defineToolPlugin({
  id: "configured-tools",
  name: "Configured Tools",
  description: "Adds configured tools.",
  configSchema,
  tools: (tool) => [
    tool({
      name: "configured_ping",
      description: "Check whether configuration is available.",
      parameters: Type.Object({}),
      execute: (_params, config) => ({ hasKey: config.apiKey.length > 0 }),
    }),
  ],
});
```

OpenClaw lit la configuration du plugin dans l’entrée de celui-ci au sein de la configuration du Gateway. Ne
codez pas les secrets en dur dans le code source ni dans les exemples de documentation ; utilisez la configuration, les variables
d’environnement ou les SecretRefs conformément au modèle de sécurité du plugin.

## Métadonnées générées

OpenClaw doit lire le manifeste du plugin avant d’importer le code d’exécution de celui-ci.
`defineToolPlugin` expose des métadonnées statiques à cette fin, et
`openclaw plugins build` les écrit dans le package. Relancez le générateur après
avoir modifié l’identifiant, le nom, la description, le schéma de configuration, l’activation ou les noms
d’outils du plugin :

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Manifeste généré pour un plugin comportant un seul outil :

```json
{
  "id": "stock-quotes",
  "name": "Stock Quotes",
  "description": "Fetch stock quote snapshots.",
  "version": "0.1.0",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  },
  "activation": {
    "onStartup": true
  },
  "contracts": {
    "tools": ["stock_quote"]
  }
}
```

`contracts.tools` est le contrat de découverte essentiel : il indique à OpenClaw quel
plugin possède chaque outil sans charger le code d’exécution de tous les plugins installés. Un
manifeste obsolète peut empêcher la découverte d’un outil ou attribuer une erreur
d’enregistrement au mauvais plugin.

## Métadonnées du package

`openclaw plugins build` aligne également `package.json` sur le point d’entrée d’exécution
sélectionné :

```json
{
  "type": "module",
  "files": ["dist", "openclaw.plugin.json", "README.md"],
  "dependencies": {
    "typebox": "^1.1.38"
  },
  "peerDependencies": {
    "openclaw": ">=2026.5.17"
  },
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

Fournissez le JavaScript compilé (`./dist/index.js`), et non un point d’entrée source TypeScript.
Les points d’entrée source ne fonctionnent que pour le développement local dans l’espace de travail.

## Valider dans la CI

`plugins build --check` échoue sans réécrire les fichiers lorsque les métadonnées générées
sont obsolètes :

```bash
npm run build
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
npm test
```

`plugins validate` vérifie que :

- `openclaw.plugin.json` existe et réussit le chargement par le chargeur de manifeste normal.
- Le point d’entrée actuel exporte les métadonnées `defineToolPlugin`.
- Les champs du manifeste généré correspondent aux métadonnées du point d’entrée.
- `contracts.tools` correspond aux noms d’outils déclarés.
- `package.json` fait pointer `openclaw.extensions` vers le point d’entrée d’exécution sélectionné.

## Installer et examiner localement

Depuis un autre checkout d’OpenClaw ou une CLI installée, installez le chemin du package :

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

Pour effectuer un test de bon fonctionnement du package, créez d’abord l’archive, puis installez-la :

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

Après l’installation, redémarrez ou rechargez le Gateway et demandez à l’agent d’utiliser
l’outil. Si l’outil n’est pas visible, examinez l’exécution du plugin et le catalogue
d’outils effectif avant de modifier le code (voir [Dépannage](#troubleshooting)).

## Publier

Publiez via ClawHub une fois le package prêt. `clawhub package publish`
accepte une source : un dossier local, un dépôt GitHub (`owner/repo[@ref]`) ou une
URL d’archive.

```bash
clawhub package publish ./stock-quotes --dry-run
clawhub package publish ./stock-quotes
```

Installez avec un localisateur ClawHub explicite :

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

Les spécifications simples de packages npm restent installables depuis npm pendant la transition de lancement, mais
ClawHub constitue l’interface privilégiée de découverte et de distribution des plugins
OpenClaw. Consultez [Publication sur ClawHub](/fr/clawhub/publishing) pour connaître le périmètre du propriétaire et
le processus de vérification de la version.

## Dépannage

### `plugin entry not found: ./dist/index.js`

Le fichier de point d’entrée sélectionné n’existe pas. Exécutez `npm run build`, puis relancez
`openclaw plugins build --entry ./dist/index.js` ou
`openclaw plugins validate --entry ./dist/index.js`.

### `plugin entry does not expose defineToolPlugin metadata`

Le point d’entrée n’a pas exporté une valeur créée par `defineToolPlugin`. Vérifiez que
l’exportation par défaut du module est le résultat de `defineToolPlugin(...)`, ou transmettez le
bon point d’entrée avec `--entry`.

### `openclaw.plugin.json generated metadata is stale`

Le manifeste ne correspond plus aux métadonnées du point d’entrée. Exécutez :

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Validez les modifications de `openclaw.plugin.json` et de `package.json`.

### `package.json openclaw.extensions must include ./dist/index.js`

Les métadonnées du package pointent vers un autre point d’entrée d’exécution. Exécutez
`openclaw plugins build --entry ./dist/index.js` afin que le générateur aligne
les métadonnées du package sur le point d’entrée que vous souhaitez fournir.

### `Cannot find package 'typebox'`

Le plugin compilé importe `typebox` à l’exécution. Conservez-le dans `dependencies`,
réinstallez, reconstruisez, puis relancez la validation.

### L’outil n’apparaît pas après l’installation

Vérifiez les éléments suivants dans l’ordre :

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. `openclaw.plugin.json` possède `contracts.tools` avec les noms d’outils attendus.
4. `package.json` possède `openclaw.extensions: ["./dist/index.js"]`.
5. Le Gateway a été redémarré ou rechargé après l’installation du Plugin.

## Voir aussi

- [Création de plugins](/fr/plugins/building-plugins)
- [Points d’entrée des plugins](/fr/plugins/sdk-entrypoints)
- [Sous-chemins du SDK de Plugin](/fr/plugins/sdk-subpaths)
- [Manifeste de Plugin](/fr/plugins/manifest)
- [CLI des plugins](/fr/cli/plugins)
- [Publication sur ClawHub](/fr/clawhub/publishing)
