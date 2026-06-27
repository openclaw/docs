---
read_when:
    - Vous voulez créer un Plugin OpenClaw simple qui ajoute uniquement des outils d’agent
    - Vous voulez utiliser defineToolPlugin plutôt que de rédiger manuellement les métadonnées du manifeste de Plugin
    - Vous devez échafauder, générer, valider, tester ou publier un Plugin réservé aux outils
sidebarTitle: Tool Plugins
summary: Créer des outils d’agent typés simples avec defineToolPlugin et openclaw plugins init/build/validate
title: Plugins d’outils
x-i18n:
    generated_at: "2026-06-27T18:01:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5e0ead3e9162b0e9e930a7a69dcd4a72a78063dae09a173efb70d0db32f73c9a
    source_path: plugins/tool-plugins.md
    workflow: 16
---

Les Plugins d’outils ajoutent à OpenClaw des outils appelables par l’agent sans ajouter de canal,
de fournisseur de modèle, de hook, de service ni de backend de configuration. Utilisez `defineToolPlugin` lorsque le
Plugin possède une liste fixe d’outils et que vous voulez qu’OpenClaw génère les métadonnées de manifeste
qui gardent ces outils découvrables sans charger le code d’exécution.

Le flux recommandé est le suivant :

1. Échafauder un paquet avec `openclaw plugins init`.
2. Écrire les outils avec `defineToolPlugin`.
3. Construire le JavaScript.
4. Générer les métadonnées `openclaw.plugin.json` et `package.json` avec
   `openclaw plugins build`.
5. Valider les métadonnées générées avant publication ou installation.

Pour les Plugins de fournisseur, de canal, de hook, de service ou à capacités mixtes, commencez plutôt par
[Créer des Plugins](/fr/plugins/building-plugins), [Plugins de canal](/fr/plugins/sdk-channel-plugins),
ou [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins).

## Prérequis

- Node >= 22.
- Sortie de paquet TypeScript ESM.
- `typebox` pour les schémas de configuration et de paramètres d’outils.
- `openclaw >=2026.5.17`, la première version d’OpenClaw qui exporte
  `openclaw/plugin-sdk/tool-plugin`.
- Une racine de paquet pouvant livrer `dist/`, `openclaw.plugin.json` et
  `package.json`.

Le Plugin généré importe `typebox` à l’exécution ; gardez donc `typebox` dans
`dependencies`, pas seulement dans `devDependencies`.

## Démarrage rapide

Créez un nouveau paquet de Plugin :

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm install
npm run plugin:build
npm run plugin:validate
npm test
```

L’échafaudage crée :

- `src/index.ts` : une entrée `defineToolPlugin` avec un outil `echo`.
- `src/index.test.ts` : un petit test de métadonnées.
- `tsconfig.json` : une sortie TypeScript NodeNext vers `dist/`.
- `package.json` : scripts, dépendances d’exécution et
  `openclaw.extensions: ["./dist/index.js"]`.
- `openclaw.plugin.json` : métadonnées de manifeste générées pour l’outil initial.

Sortie de validation attendue :

```text
Plugin stock-quotes is valid.
```

## Écrire un outil

`defineToolPlugin` prend l’identité du Plugin, un schéma de configuration facultatif et une
liste statique d’outils. Les types de paramètres et de configuration sont inférés à partir des schémas TypeBox.

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
suffisamment spécifiques pour éviter les collisions avec les outils du cœur ou d’autres Plugins.

## Outils facultatifs et d’usine

Définissez `optional: true` lorsque les utilisateurs doivent explicitement autoriser l’outil avant qu’il
soit envoyé à un modèle :

```typescript
tool({
  name: "workflow_run",
  description: "Run an external workflow.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

`openclaw plugins build` écrit l’entrée de manifeste `toolMetadata.<tool>.optional`
correspondante, afin qu’OpenClaw puisse découvrir l’outil sans charger le code d’exécution du
Plugin.

Utilisez `factory` lorsqu’un outil a besoin du contexte d’outil d’exécution avant de pouvoir être
créé. L’usine garde les métadonnées statiques tout en laissant l’outil se désactiver pour une
exécution donnée, inspecter l’état du bac à sable ou lier des helpers d’exécution.

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

Les usines restent destinées à des noms d’outils fixes. Utilisez directement `definePluginEntry` lorsque
le Plugin calcule dynamiquement les noms d’outils ou combine des outils avec des hooks,
services, fournisseurs, commandes ou autres surfaces d’exécution.

## Valeurs de retour

`defineToolPlugin` encapsule les valeurs de retour simples dans le format de résultat d’outil
d’OpenClaw :

- Retournez une chaîne lorsque le modèle doit voir exactement ce texte.
- Retournez une valeur compatible JSON lorsque vous voulez que le modèle voie du JSON formaté
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

Utilisez un outil d’usine lorsque vous devez retourner un `AgentToolResult` personnalisé ou réutiliser
une implémentation `api.registerTool` existante. Utilisez `definePluginEntry` plutôt que
`defineToolPlugin` lorsque vous avez besoin d’outils entièrement dynamiques ou de capacités de Plugin
mixtes.

## Configuration

`configSchema` est facultatif. Si vous l’omettez, OpenClaw utilise un schéma objet vide strict
et le manifeste généré inclut tout de même `configSchema`.

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "No Config Tools",
  description: "Adds tools that do not need configuration.",
  tools: () => [],
});
```

Lorsque vous incluez `configSchema`, le deuxième argument de `execute` est typé à partir du
schéma :

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

OpenClaw lit la configuration du Plugin depuis l’entrée du Plugin dans la configuration du Gateway. Ne
codez pas en dur de secrets dans le source ni dans les exemples de documentation. Utilisez la configuration, les variables
d’environnement ou les SecretRefs selon le modèle de sécurité du Plugin.

## Métadonnées générées

OpenClaw découvre les Plugins installés à partir de métadonnées froides. Il doit pouvoir lire
le manifeste du Plugin avant d’importer le code d’exécution du Plugin. `defineToolPlugin`
expose donc des métadonnées statiques, et `openclaw plugins build` écrit ces
métadonnées dans le paquet.

Exécutez le générateur après avoir modifié l’identifiant, le nom, la description, le schéma de configuration,
l’activation ou les noms d’outils du Plugin :

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Pour un Plugin à un seul outil, le manifeste généré ressemble à ceci :

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

`contracts.tools` est le contrat de découverte important. Il indique à OpenClaw quel
Plugin possède chaque outil sans charger l’exécution de chaque Plugin installé. Si le
manifeste est obsolète, l’outil peut être absent de la découverte ou le mauvais Plugin
peut être tenu responsable d’une erreur d’enregistrement.

## Métadonnées de paquet

Pour le flux simple de Plugin d’outil, `openclaw plugins build` aligne
`package.json` sur l’unique entrée d’exécution sélectionnée :

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

Utilisez du JavaScript construit, comme `./dist/index.js`, pour les paquets installés. Les entrées
source sont utiles lors du développement en espace de travail, mais les paquets publiés ne doivent pas
dépendre du chargement TypeScript à l’exécution.

## Valider dans la CI

Utilisez `plugins build --check` pour faire échouer la CI lorsque les métadonnées générées sont obsolètes, sans
réécrire les fichiers :

```bash
npm run build
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
npm test
```

`plugins validate` vérifie que :

- `openclaw.plugin.json` existe et passe le chargeur de manifeste normal.
- L’entrée actuelle exporte des métadonnées `defineToolPlugin`.
- Les champs de manifeste générés correspondent aux métadonnées de l’entrée.
- `contracts.tools` correspond aux noms d’outils déclarés.
- `package.json` pointe `openclaw.extensions` vers l’entrée d’exécution sélectionnée.

## Installer et inspecter localement

Depuis un autre checkout OpenClaw ou une CLI installée, installez le chemin du paquet :

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

Pour un smoke de paquet, empaquetez d’abord puis installez le tarball :

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

Après l’installation, démarrez ou redémarrez le Gateway et demandez à l’agent d’utiliser
l’outil. Si vous déboguez la visibilité des outils, inspectez l’exécution du Plugin et le
catalogue d’outils effectif avant de modifier le code.

## Publier

Publiez via ClawHub lorsque le paquet est prêt :

```bash
clawhub package publish your-org/stock-quotes --dry-run
clawhub package publish your-org/stock-quotes
```

Installez avec un localisateur ClawHub explicite :

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

Les spécifications de paquet npm nues restent prises en charge pendant la transition de lancement, mais ClawHub
est la surface de découverte et de distribution privilégiée pour les Plugins OpenClaw.

## Dépannage

### `plugin entry not found: ./dist/index.js`

Le fichier d’entrée sélectionné n’existe pas. Exécutez `npm run build`, puis relancez
`openclaw plugins build --entry ./dist/index.js` ou
`openclaw plugins validate --entry ./dist/index.js`.

### `plugin entry does not expose defineToolPlugin metadata`

L’entrée n’a pas exporté une valeur créée par `defineToolPlugin`. Vérifiez que l’export par défaut du
module est le résultat de `defineToolPlugin(...)`, ou passez la bonne
entrée avec `--entry`.

### `openclaw.plugin.json generated metadata is stale`

Le manifeste ne correspond plus aux métadonnées de l’entrée. Exécutez :

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Validez les modifications de `openclaw.plugin.json` et de `package.json`.

### `package.json openclaw.extensions must include ./dist/index.js`

Les métadonnées du paquet pointent vers une autre entrée d’exécution. Exécutez
`openclaw plugins build --entry ./dist/index.js` afin que le générateur aligne les
métadonnées du paquet sur l’entrée que vous souhaitez livrer.

### `Cannot find package 'typebox'`

Le Plugin construit importe `typebox` à l’exécution. Gardez `typebox` dans
`dependencies`, réinstallez les dépendances du paquet, reconstruisez et relancez la validation.

### L’outil n’apparaît pas après l’installation

Vérifiez ces éléments dans l’ordre :

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. `openclaw.plugin.json` contient `contracts.tools` avec les noms d’outils attendus.
4. `package.json` contient `openclaw.extensions: ["./dist/index.js"]`.
5. Le Gateway a été redémarré ou rechargé après l’installation du Plugin.

## Voir aussi

- [Créer des Plugins](/fr/plugins/building-plugins)
- [Points d’entrée de Plugin](/fr/plugins/sdk-entrypoints)
- [Sous-chemins du Plugin SDK](/fr/plugins/sdk-subpaths)
- [Manifeste de Plugin](/fr/plugins/manifest)
- [CLI Plugins](/fr/cli/plugins)
- [Publication ClawHub](/fr/clawhub/publishing)
