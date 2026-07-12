---
read_when:
    - Vous avez besoin de la signature de type exacte de defineToolPlugin, definePluginEntry ou defineChannelPluginEntry
    - Vous souhaitez comprendre le mode d’enregistrement (complet, configuration ou métadonnées de la CLI)
    - Vous recherchez les options de point d’entrée
sidebarTitle: Entry Points
summary: Référence pour defineToolPlugin, definePluginEntry, defineChannelPluginEntry et defineSetupPluginEntry
title: Points d’entrée des Plugins
x-i18n:
    generated_at: "2026-07-12T15:46:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fba10e51604d6b83b5da265530565fddf3129c5a6e69c4f1a65d5455fe99ad83
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Chaque plugin exporte un objet d’entrée par défaut. Le SDK fournit une fonction d’assistance pour
chaque forme d’entrée : `defineToolPlugin`, `definePluginEntry`,
`defineChannelPluginEntry`, `defineSetupPluginEntry`.

<Tip>
  **Vous recherchez un guide détaillé ?** Consultez [Plugins d’outils](/fr/plugins/tool-plugins),
  [Plugins de canaux](/fr/plugins/sdk-channel-plugins) ou
  [Plugins de fournisseurs](/fr/plugins/sdk-provider-plugins) pour obtenir des guides pas à pas.
</Tip>

## Entrées de package

Les plugins installés font pointer les champs `openclaw` de `package.json` vers les entrées
source et compilées :

```json
{
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "setupEntry": "./src/setup-entry.ts",
    "runtimeSetupEntry": "./dist/setup-entry.js"
  }
}
```

- `extensions` et `setupEntry` sont des entrées source, utilisées pour le développement dans
  l’espace de travail et depuis un checkout git.
- `runtimeExtensions` et `runtimeSetupEntry` sont privilégiées pour les
  packages installés : elles permettent aux packages npm d’éviter la compilation TypeScript à l’exécution.
- `runtimeExtensions`, lorsqu’il est présent, doit avoir la même longueur de tableau que
  `extensions` (les entrées sont associées selon leur position). `runtimeSetupEntry` nécessite `setupEntry`.
- Si un artefact `runtimeExtensions`/`runtimeSetupEntry` est déclaré mais
  absent, l’installation ou la découverte échoue avec une erreur de packaging ; OpenClaw ne
  revient pas silencieusement à la source. Le repli vers la source (ci-dessous) ne s’applique que lorsqu’aucune
  entrée d’exécution n’est déclarée.
- Si un package installé déclare uniquement une entrée source TypeScript, OpenClaw
  recherche une entrée compilée correspondante dans `dist/*.js` (ou `.mjs`/`.cjs`) et l’utilise ;
  sinon, il revient à la source TypeScript.
- Tous les chemins d’entrée doivent rester dans le répertoire du package du plugin. Les entrées
  d’exécution et les fichiers JavaScript compilés homologues déduits ne rendent pas valide un chemin source
  `extensions` ou `setupEntry` qui s’échappe du répertoire.

## `defineToolPlugin`

**Importation :** `openclaw/plugin-sdk/tool-plugin`

Pour les plugins qui ajoutent uniquement des outils d’agent. Cette fonction garde le code source concis, déduit les types de configuration
et de paramètres d’outil à partir des schémas TypeBox, encapsule les valeurs de retour simples dans
le format de résultat d’outil OpenClaw et expose les métadonnées statiques que
`openclaw plugins build` écrit dans le manifeste du plugin (`contracts.tools`,
`configSchema`).

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Cotations boursières",
  description: "Récupérer des cotations boursières.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "Clé API." })),
  }),
  tools: (tool) => [
    tool({
      name: "quote",
      label: "Cotation",
      description: "Récupérer une cotation.",
      parameters: Type.Object({
        symbol: Type.String({ description: "Symbole boursier." }),
      }),
      execute: async ({ symbol }, config) => ({ symbol, hasKey: Boolean(config.apiKey) }),
    }),
  ],
});
```

- `configSchema` est facultatif ; son omission utilise un schéma strict d’objet vide
  (le manifeste généré inclut tout de même `configSchema`).
- `execute` renvoie une chaîne simple ou une valeur sérialisable en JSON ; la fonction d’assistance
  l’encapsule comme résultat d’outil textuel avec `details` défini sur la valeur de retour
  d’origine (non convertie en chaîne).
- Pour des résultats d’outil personnalisés, `openclaw/plugin-sdk/tool-results` exporte
  `textResult` et `jsonResult`.
- Les noms d’outils sont statiques, de sorte que `openclaw plugins build` déduit
  `contracts.tools` des outils déclarés sans dupliquer manuellement les noms.
- Le chargement à l’exécution reste strict : les plugins installés nécessitent toujours
  `openclaw.plugin.json` et `openclaw.extensions` dans `package.json`. OpenClaw
  n’exécute jamais le code du plugin pour déduire les données de manifeste manquantes.

## `definePluginEntry`

**Importation :** `openclaw/plugin-sdk/plugin-entry`

Pour les plugins de fournisseurs, les plugins d’outils avancés, les plugins de hooks et tout ce qui
n’est **pas** un canal de messagerie.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "Mon plugin",
  description: "Bref résumé",
  register(api) {
    api.registerProvider({/* ... */});
    api.registerTool({/* ... */});
  },
});
```

| Champ                     | Type                                                             | Requis | Valeur par défaut     |
| ------------------------- | ---------------------------------------------------------------- | ------ | --------------------- |
| `id`                      | `string`                                                         | Oui    | -                     |
| `name`                    | `string`                                                         | Oui    | -                     |
| `description`             | `string`                                                         | Oui    | -                     |
| `kind`                    | `string` (obsolète, voir ci-dessous)                             | Non    | -                     |
| `configSchema`            | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Non    | Schéma d’objet vide   |
| `reload`                  | `OpenClawPluginReloadRegistration`                               | Non    | -                     |
| `nodeHostCommands`        | `OpenClawPluginNodeHostCommand[]`                                | Non    | -                     |
| `securityAuditCollectors` | `OpenClawPluginSecurityAuditCollector[]`                         | Non    | -                     |
| `register`                | `(api: OpenClawPluginApi) => void`                               | Oui    | -                     |

- `id` doit correspondre à votre manifeste `openclaw.plugin.json`.
- Les catalogues de sessions externes utilisent
  `openclaw/plugin-sdk/session-catalog` et
  `api.registerSessionCatalog({ id, label, list, read, continueSession?, archive? })`.
  Le cœur gère les méthodes Gateway `sessions.catalog.*` ; les fournisseurs renvoient des projections
  d’hôte, de session et de transcription normalisée sans enregistrer de RPC.
- `kind` est obsolète : déclarez plutôt un emplacement exclusif (`"memory"` ou
  `"context-engine"`) dans le champ `kind` du manifeste `openclaw.plugin.json`.
  Le `kind` de l’entrée d’exécution n’est conservé que comme repli de compatibilité pour
  les anciens plugins.
- `configSchema` peut être une fonction afin de permettre une évaluation différée. OpenClaw résout et
  mémorise le schéma lors du premier accès, de sorte que les générateurs de schémas coûteux ne s’exécutent
  qu’une seule fois.
- Un descripteur `nodeHostCommands` peut définir `isAvailable({ config, env })`.
  Renvoyer `false` omet cette commande et sa capacité de la déclaration Gateway
  du Node sans interface. OpenClaw l’évalue par rapport à la configuration de démarrage locale au Node ;
  les gestionnaires de commandes doivent néanmoins valider la disponibilité lors de l’appel.

## `defineChannelPluginEntry`

**Importation :** `openclaw/plugin-sdk/channel-core`

Encapsule `definePluginEntry` avec un câblage propre aux canaux : cette fonction appelle automatiquement
`api.registerChannel({ plugin })`, expose un point d’intégration facultatif de métadonnées CLI pour l’aide racine
et conditionne `registerFull` au mode d’enregistrement.

```typescript
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineChannelPluginEntry({
  id: "my-channel",
  name: "Mon canal",
  description: "Bref résumé",
  plugin: myChannelPlugin,
  setRuntime: setMyRuntime,
  registerCliMetadata(api) {
    api.registerCli(/* ... */);
  },
  registerFull(api) {
    api.registerGatewayMethod(/* ... */);
  },
});
```

| Champ                 | Type                                                             | Requis | Valeur par défaut   |
| --------------------- | ---------------------------------------------------------------- | ------ | ------------------- |
| `id`                  | `string`                                                         | Oui    | -                   |
| `name`                | `string`                                                         | Oui    | -                   |
| `description`         | `string`                                                         | Oui    | -                   |
| `plugin`              | `ChannelPlugin`                                                  | Oui    | -                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Non    | Schéma d’objet vide |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Non    | -                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Non    | -                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Non    | -                   |

Les fonctions de rappel s’exécutent selon le mode d’enregistrement (tableau complet sous
[Mode d’enregistrement](#registration-mode)) :

- `setRuntime` s’exécute dans tous les modes sauf `"cli-metadata"` et
  `"tool-discovery"`. Stockez ici la référence d’exécution, généralement via
  `createPluginRuntimeStore`.
- `registerCliMetadata` s’exécute pour `"cli-metadata"`, `"discovery"` et
  `"full"`. Utilisez-le comme emplacement canonique des descripteurs CLI appartenant au canal,
  afin que l’aide racine reste sans activation, que les instantanés de découverte incluent les métadonnées
  statiques des commandes et que l’enregistrement CLI normal reste compatible avec les chargements complets
  du plugin.
- `registerFull` s’exécute uniquement pour `"full"` et `"tool-discovery"`. Pour
  `"tool-discovery"`, il s’exécute _à la place de_ l’enregistrement du canal : OpenClaw
  ignore entièrement `registerChannel`/`setRuntime` et appelle uniquement
  `registerFull`. Tout enregistrement de fournisseur ou d’outil dont votre canal a besoin pour
  la découverte ou l’exécution autonome d’outils doit donc se trouver ici, et non derrière la configuration
  normale du canal.
- L’enregistrement de découverte est sans activation, mais pas sans importation : OpenClaw peut
  évaluer l’entrée du plugin approuvé et le module du plugin de canal pour créer
  l’instantané. Gardez les importations de niveau supérieur sans effet de bord et placez les sockets,
  clients, workers et services derrière des chemins réservés à `"full"`.
- Comme `definePluginEntry`, `configSchema` peut être une fabrique différée ; OpenClaw
  mémorise le schéma résolu lors du premier accès.

Enregistrement CLI :

- Utilisez `api.registerCli(..., { descriptors: [...] })` pour les commandes CLI racines
  appartenant au plugin que vous souhaitez charger de manière différée sans les faire disparaître de l’arbre
  d’analyse de la CLI racine. Les noms de descripteurs doivent être composés de lettres, de chiffres, de traits d’union et
  de traits de soulignement, et commencer par une lettre ou un chiffre ; OpenClaw rejette les autres
  formes et supprime les séquences de contrôle du terminal des descriptions avant
  d’afficher l’aide. Couvrez chaque racine de commande de premier niveau exposée par le mécanisme d’enregistrement.
  `commands` seul reste sur le chemin de compatibilité avec chargement immédiat.
- Utilisez `api.registerNodeCliFeature(...)` pour les commandes de fonctionnalités de Node associé afin
  qu’elles apparaissent sous `openclaw nodes` (équivalent à
  `registerCli(registrar, { parentPath: ["nodes"], ... })`).
- Pour les autres commandes de plugin imbriquées, ajoutez `parentPath` et enregistrez les commandes
  sur l’objet `program` transmis au mécanisme d’enregistrement ; OpenClaw le résout vers
  la commande parente avant d’appeler le plugin.
- Pour les plugins de canaux, enregistrez les descripteurs CLI depuis `registerCliMetadata`
  et réservez `registerFull` aux opérations d’exécution.
- Si `registerFull` enregistre également des méthodes RPC du Gateway, placez-les sous un
  préfixe propre au plugin. Les espaces de noms d’administration réservés au cœur (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) sont toujours convertis en
  `operator.admin`.

## `defineSetupPluginEntry`

**Importation :** `openclaw/plugin-sdk/channel-core`

Pour le fichier léger `setup-entry.ts`. Renvoie uniquement `{ plugin }`, sans
câblage d’exécution ni de CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw charge cette entrée à la place de l’entrée complète lorsqu’un canal est désactivé,
non configuré ou lorsque le chargement différé est activé. Consultez
[Configuration et paramétrage](/fr/plugins/sdk-setup#setup-entry) pour savoir dans quels cas cela importe.

Associez `defineSetupPluginEntry(...)` aux familles restreintes de fonctions d’assistance à la configuration :

| Import                              | Utilisation                                                                                                                                                                                                 |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/setup-runtime` | Assistants de configuration sûrs pour l’exécution : `createSetupTranslator`, adaptateurs de correctifs de configuration sûrs à importer, sortie de notes de recherche, `promptResolvedAllowFrom`, `splitSetupEntries`, proxys de configuration délégués |
| `openclaw/plugin-sdk/channel-setup` | Surfaces de configuration pour les installations facultatives                                                                                                                                               |
| `openclaw/plugin-sdk/setup-tools`   | Assistants pour la CLI de configuration/installation, les archives et la documentation                                                                                                                       |

Conservez les SDK lourds, l’enregistrement de la CLI et les services d’exécution
persistants dans le point d’entrée complet.

Les canaux intégrés à l’espace de travail qui séparent les surfaces de configuration
et d’exécution peuvent utiliser à la place `defineBundledChannelSetupEntry(...)`
depuis `openclaw/plugin-sdk/channel-entry-contract`. Cela permet au point d’entrée
de configuration de conserver les exports de Plugin et de secrets sûrs pour la
configuration, tout en exposant un mutateur d’exécution :

```typescript
import { defineBundledChannelSetupEntry } from "openclaw/plugin-sdk/channel-entry-contract";

export default defineBundledChannelSetupEntry({
  importMetaUrl: import.meta.url,
  plugin: {
    specifier: "./channel-plugin-api.js",
    exportName: "myChannelPlugin",
  },
  runtime: {
    specifier: "./runtime-api.js",
    exportName: "setMyChannelRuntime",
  },
  registerSetupRuntime(api) {
    api.registerHttpRoute({
      path: "/my-channel/events",
      auth: "plugin",
      handler: async (req, res) => {
        /* route sûre pour la configuration */
      },
    });
  },
});
```

Utilisez ceci uniquement lorsqu’un flux de configuration nécessite réellement un
mutateur d’exécution léger ou une surface Gateway sûre pour la configuration avant
le chargement du point d’entrée complet du canal. `registerSetupRuntime` s’exécute
uniquement pour les chargements `"setup-runtime"` ; limitez-le aux routes fondées
uniquement sur la configuration ou aux méthodes qui doivent exister avant
l’activation complète différée.

## Mode d’enregistrement

`api.registrationMode` indique à votre Plugin comment il a été chargé :

| Mode               | Quand                                                        | Éléments à enregistrer                                                                                                                                      |
| ------------------ | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"full"`           | Démarrage normal du Gateway                                  | Tout                                                                                                                                                        |
| `"discovery"`      | Découverte des capacités en lecture seule                    | Enregistrement du canal et des descripteurs CLI statiques ; le code du point d’entrée peut être chargé, mais ignorez les sockets, workers, clients et services |
| `"tool-discovery"` | Chargement ciblé pour répertorier ou exécuter les outils de Plugins spécifiques | Enregistrement des capacités/outils uniquement ; aucune activation de canal                                                                                 |
| `"setup-only"`     | Canal désactivé/non configuré                                | Enregistrement du canal uniquement                                                                                                                          |
| `"setup-runtime"`  | Flux de configuration avec environnement d’exécution disponible | Enregistrement du canal et uniquement de l’environnement d’exécution léger nécessaire avant le chargement du point d’entrée complet                         |
| `"cli-metadata"`   | Capture de l’aide racine/des métadonnées CLI                 | Descripteurs CLI uniquement                                                                                                                                 |

`defineChannelPluginEntry` gère automatiquement cette séparation. Si vous utilisez
directement `definePluginEntry` pour un canal, vérifiez vous-même le mode et
n’oubliez pas que `"tool-discovery"` ignore l’enregistrement du canal :

```typescript
register(api) {
  if (
    api.registrationMode === "cli-metadata" ||
    api.registrationMode === "discovery" ||
    api.registrationMode === "full"
  ) {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  if (api.registrationMode === "tool-discovery") {
    // Enregistrez uniquement les surfaces de capacités (fournisseurs/outils), sans canal.
    return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Enregistrements lourds réservés à l’exécution
  api.registerService(/* ... */);
}
```

Le mode de découverte crée un instantané du registre sans activation. Il peut tout
de même évaluer le point d’entrée du Plugin et l’objet Plugin du canal afin
qu’OpenClaw puisse enregistrer les capacités du canal et les descripteurs CLI
statiques. Considérez l’évaluation du module en mode découverte comme fiable mais
légère : aucun client réseau, sous-processus, écouteur, connexion à une base de
données, worker en arrière-plan, lecture d’identifiants ni autre effet de bord
d’exécution actif au niveau supérieur.

Considérez `"setup-runtime"` comme la fenêtre durant laquelle les surfaces de
démarrage réservées à la configuration doivent exister sans réexécuter
l’environnement d’exécution complet du canal intégré. Les cas adaptés comprennent
l’enregistrement du canal, les routes HTTP sûres pour la configuration, les
méthodes Gateway sûres pour la configuration et les assistants de configuration
délégués. Les services lourds en arrière-plan, les mécanismes d’enregistrement de
la CLI et les initialisations des SDK de fournisseurs/clients doivent toujours
rester dans `"full"`.

## Formes de Plugin

OpenClaw classe les Plugins chargés selon leur comportement d’enregistrement :

| Forme                 | Description                                                   |
| --------------------- | ------------------------------------------------------------- |
| **plain-capability**  | Un seul type de capacité (par ex. fournisseur uniquement)     |
| **hybrid-capability** | Plusieurs types de capacités (par ex. fournisseur + synthèse vocale) |
| **hook-only**         | Uniquement des hooks, aucune capacité                          |
| **non-capability**    | Outils/commandes/services, mais aucune capacité                |

Utilisez `openclaw plugins inspect <id>` pour connaître la forme d’un Plugin.

## Pages connexes

- [Présentation du SDK](/fr/plugins/sdk-overview) - API d’enregistrement et référence des sous-chemins
- [Assistants d’exécution](/fr/plugins/sdk-runtime) - `api.runtime` et `createPluginRuntimeStore`
- [Configuration](/fr/plugins/sdk-setup) - manifeste, point d’entrée de configuration, chargement différé
- [Plugins de canal](/fr/plugins/sdk-channel-plugins) - création de l’objet `ChannelPlugin`
- [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins) - enregistrement des fournisseurs et hooks
