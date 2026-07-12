---
read_when:
    - Vous souhaitez créer un Plugin OpenClaw simple qui ajoute uniquement des outils d’agent
    - Vous souhaitez utiliser defineToolPlugin au lieu d’écrire manuellement les métadonnées du manifeste du Plugin
    - Vous devez structurer, générer, valider, tester ou publier un plugin composé uniquement d’outils.
sidebarTitle: Tool Plugins
summary: Créez des outils d’agent typés simples avec defineToolPlugin et openclaw plugins init/build/validate
title: Plugins d’outils
x-i18n:
    generated_at: "2026-07-12T03:00:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 231eba96d4927b7411cb17d79b96e6df09ed111fc8a54eac0ca7717e58803d26
    source_path: plugins/tool-plugins.md
    workflow: 16
---

`defineToolPlugin` crée un Plugin qui ajoute uniquement des outils appelables par l’agent : aucun
canal, fournisseur de modèles, hook, service ni backend de configuration. Il génère les
métadonnées de manifeste dont OpenClaw a besoin pour découvrir les outils sans charger le
code d’exécution du Plugin.

Pour les Plugins de fournisseur, de canal, de hook, de service ou à capacités mixtes, commencez
plutôt par [Créer des Plugins](/fr/plugins/building-plugins), [Plugins de canal](/fr/plugins/sdk-channel-plugins)
ou [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins).

## Prérequis

- Node 22.19+, Node 23.11+ ou Node 24+.
- Sortie de paquet TypeScript ESM.
- `typebox` dans `dependencies` (et pas seulement dans `devDependencies` : le Plugin
  généré l’importe lors de l’exécution).
- `openclaw >=2026.5.17`, première version qui exporte
  `openclaw/plugin-sdk/tool-plugin`.
- Une racine de paquet qui distribue `dist/`, `openclaw.plugin.json` et
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

`plugins init` génère la structure suivante :

| Fichier                 | Rôle                                                              |
| ----------------------- | ----------------------------------------------------------------- |
| `src/index.ts`          | Point d’entrée `defineToolPlugin` avec un outil `echo`            |
| `src/index.test.ts`     | Test des métadonnées vérifiant la liste des outils                |
| `tsconfig.json`         | Sortie TypeScript NodeNext vers `dist/`                           |
| `vitest.config.ts`      | Configuration Vitest pour `src/**/*.test.ts`                      |
| `package.json`          | Scripts, dépendances d’exécution, `openclaw.extensions: ["./dist/index.js"]` |
| `openclaw.plugin.json`  | Métadonnées de manifeste générées pour l’outil initial            |

`npm run plugin:build` exécute `npm run build` (tsc), puis
`openclaw plugins build --entry ./dist/index.js`. `npm run plugin:validate`
reconstruit le projet et exécute `openclaw plugins validate --entry ./dist/index.js`.
Une validation réussie affiche :

```text
Plugin stock-quotes is valid.
```

Options de `openclaw plugins init <id>` :

| Option               | Valeur par défaut   | Effet                                  |
| -------------------- | ------------------- | -------------------------------------- |
| `--directory <path>` | `<id>`              | Répertoire de sortie                   |
| `--name <name>`      | `<id>` en casse de titre | Nom d’affichage                    |
| `--type <type>`      | `tool`              | Type de structure : `tool` ou `provider` |
| `--force`            | désactivée          | Écrase un répertoire de sortie existant |

## Écrire un outil

`defineToolPlugin` accepte l’identité du Plugin, un schéma de configuration facultatif et une
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
suffisamment précis pour éviter les collisions avec les outils du cœur ou ceux d’autres Plugins.

## Outils facultatifs et fabriques d’outils

Définissez `optional: true` lorsque les utilisateurs doivent explicitement ajouter l’outil à la liste
d’autorisation avant son envoi à un modèle. `openclaw plugins build` écrit l’entrée de manifeste
`toolMetadata.<tool>.optional` correspondante, afin qu’OpenClaw puisse déterminer que
l’outil est facultatif sans charger le code d’exécution du Plugin.

```typescript
tool({
  name: "workflow_run",
  description: "Run an external workflow.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

Utilisez `factory` lorsqu’un outil a besoin du contexte d’exécution des outils avant de pouvoir être
créé, par exemple pour se désactiver lors d’une exécution donnée, examiner l’état de la sandbox ou
lier des fonctions utilitaires d’exécution. Les métadonnées restent statiques même si l’outil concret
est construit lors de l’exécution.

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

Les fabriques déclarent toujours à l’avance un nom d’outil fixe. Utilisez directement
`definePluginEntry` lorsque le Plugin calcule dynamiquement les noms d’outils ou combine des outils
avec des hooks, des services, des fournisseurs ou des commandes.

## Valeurs de retour

`defineToolPlugin` encapsule les valeurs de retour simples dans le format de résultat d’outil
d’OpenClaw :

- Renvoyez une chaîne lorsque le modèle doit voir exactement ce texte.
- Renvoyez une valeur compatible avec JSON lorsque vous souhaitez que le modèle voie du JSON mis
  en forme et qu’OpenClaw conserve la valeur d’origine dans `details`.

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

Utilisez un outil fabriqué lorsque vous avez besoin d’un `AgentToolResult` personnalisé ou souhaitez
réutiliser une implémentation `api.registerTool` existante.

## Configuration

`configSchema` est facultatif. Si vous l’omettez, OpenClaw applique un schéma strict d’objet vide ;
le manifeste généré inclut tout de même `configSchema`.

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "No Config Tools",
  description: "Adds tools that do not need configuration.",
  tools: () => [],
});
```

Avec un `configSchema`, le type du deuxième argument d’`execute` en est déduit :

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

OpenClaw lit la configuration du Plugin dans l’entrée de celui-ci au sein de la configuration du
Gateway. N’inscrivez pas de secrets en dur dans le code source ou les exemples de documentation ;
utilisez la configuration, les variables d’environnement ou des SecretRefs conformément au modèle
de sécurité du Plugin.

## Métadonnées générées

OpenClaw doit lire le manifeste du Plugin avant d’importer son code d’exécution.
`defineToolPlugin` expose pour cela des métadonnées statiques, et
`openclaw plugins build` les écrit dans le paquet. Réexécutez le générateur après toute
modification de l’identifiant, du nom, de la description, du schéma de configuration, de
l’activation ou des noms d’outils du Plugin :

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Manifeste généré pour un Plugin comportant un seul outil :

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

`contracts.tools` est le contrat de découverte essentiel : il indique à OpenClaw quel Plugin
possède chaque outil sans charger le code d’exécution de chaque Plugin installé. Un manifeste
obsolète peut empêcher la découverte d’un outil ou attribuer une erreur d’enregistrement au
mauvais Plugin.

## Métadonnées du paquet

`openclaw plugins build` aligne également `package.json` sur le point d’entrée d’exécution
sélectionné :

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

Distribuez le JavaScript compilé (`./dist/index.js`), et non un point d’entrée source TypeScript.
Les points d’entrée source ne fonctionnent que pour le développement local à l’espace de travail.

## Valider dans l’intégration continue

`plugins build --check` échoue sans réécrire les fichiers lorsque les métadonnées générées sont
obsolètes :

```bash
npm run build
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
npm test
```

`plugins validate` vérifie que :

- `openclaw.plugin.json` existe et est accepté par le chargeur de manifeste normal.
- Le point d’entrée actuel exporte les métadonnées de `defineToolPlugin`.
- Les champs du manifeste généré correspondent aux métadonnées du point d’entrée.
- `contracts.tools` correspond aux noms d’outils déclarés.
- `package.json` fait pointer `openclaw.extensions` vers le point d’entrée d’exécution sélectionné.

## Installer et examiner localement

Depuis un autre checkout d’OpenClaw ou une CLI installée, installez le chemin du paquet :

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

Pour un test rapide du paquet, créez d’abord l’archive, puis installez-la :

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

Après l’installation, redémarrez ou rechargez le Gateway et demandez à l’agent d’utiliser
l’outil. Si l’outil n’est pas visible, examinez l’exécution du Plugin et le catalogue d’outils
effectif avant de modifier le code (voir [Dépannage](#troubleshooting)).

## Publier

Publiez via ClawHub lorsque le paquet est prêt. `clawhub package publish`
accepte une source : un dossier local, un dépôt GitHub (`owner/repo[@ref]`) ou une
URL d’archive tar.

```bash
clawhub package publish ./stock-quotes --dry-run
clawhub package publish ./stock-quotes
```

Installez-le avec un localisateur ClawHub explicite :

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

Les spécifications simples de paquets npm continuent d’être installées depuis npm pendant la
transition de lancement, mais ClawHub est l’interface privilégiée de découverte et de distribution
des Plugins OpenClaw. Consultez [Publication sur ClawHub](/fr/clawhub/publishing) pour la portée du
propriétaire et la revue de version.

## Dépannage

### `plugin entry not found: ./dist/index.js`

Le fichier de point d’entrée sélectionné n’existe pas. Exécutez `npm run build`, puis réexécutez
`openclaw plugins build --entry ./dist/index.js` ou
`openclaw plugins validate --entry ./dist/index.js`.

### `plugin entry does not expose defineToolPlugin metadata`

Le point d’entrée n’a pas exporté une valeur créée par `defineToolPlugin`. Vérifiez que
l’exportation par défaut du module est le résultat de `defineToolPlugin(...)`, ou transmettez le
bon point d’entrée avec `--entry`.

### `openclaw.plugin.json generated metadata is stale`

Le manifeste ne correspond plus aux métadonnées du point d’entrée. Exécutez :

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Validez les modifications de `openclaw.plugin.json` et de `package.json` dans le dépôt.

### `package.json openclaw.extensions must include ./dist/index.js`

Les métadonnées du paquet pointent vers un autre point d’entrée d’exécution. Exécutez
`openclaw plugins build --entry ./dist/index.js` afin que le générateur aligne les métadonnées du
paquet sur le point d’entrée que vous prévoyez de distribuer.

### `Cannot find package 'typebox'`

Le Plugin compilé importe `typebox` lors de l’exécution. Conservez-le dans `dependencies`,
réinstallez les dépendances, reconstruisez le projet et relancez la validation.

### L’outil n’apparaît pas après l’installation

Vérifiez les éléments suivants dans l’ordre :

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. `openclaw.plugin.json` contient `contracts.tools` avec les noms d’outils attendus.
4. `package.json` contient `openclaw.extensions: ["./dist/index.js"]`.
5. Le Gateway a été redémarré ou rechargé après l’installation du plugin.

## Voir aussi

- [Création de plugins](/fr/plugins/building-plugins)
- [Points d’entrée des plugins](/fr/plugins/sdk-entrypoints)
- [Sous-chemins du SDK de Plugin](/fr/plugins/sdk-subpaths)
- [Manifeste de Plugin](/fr/plugins/manifest)
- [CLI des plugins](/fr/cli/plugins)
- [Publication sur ClawHub](/fr/clawhub/publishing)
