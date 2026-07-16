---
read_when:
    - Vous avez besoin de la signature de type exacte de defineToolPlugin, definePluginEntry ou defineChannelPluginEntry
    - Vous souhaitez comprendre le mode d’enregistrement (complet, configuration ou métadonnées de la CLI)
    - Vous recherchez les options de point d’entrée
sidebarTitle: Entry Points
summary: Référence pour defineToolPlugin, definePluginEntry, defineChannelPluginEntry et defineSetupPluginEntry
title: Points d’entrée des Plugins
x-i18n:
    generated_at: "2026-07-16T13:38:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8b2133dbe4ee650b27e110d472b38284d557f715829e3f0d73f8dc6c910c7c99
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Chaque plugin exporte un objet d’entrée par défaut. Le SDK fournit une fonction utilitaire pour
chaque forme d’entrée : `defineToolPlugin`, `definePluginEntry`,
`defineChannelPluginEntry`, `defineSetupPluginEntry`.

<Tip>
  **Vous cherchez un guide détaillé ?** Consultez [Plugins d’outils](/fr/plugins/tool-plugins),
  [Plugins de canaux](/fr/plugins/sdk-channel-plugins) ou
  [Plugins de fournisseurs](/fr/plugins/sdk-provider-plugins) pour obtenir des guides pas à pas.
</Tip>

## Entrées de paquet

Les plugins installés font pointer les champs `package.json` `openclaw` à la fois vers les entrées
sources et compilées :

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

- `extensions` et `setupEntry` sont des entrées sources, utilisées pour le développement dans l’espace de travail et depuis une copie de travail
  git.
- `runtimeExtensions` et `runtimeSetupEntry` sont préférées pour les paquets
  installés : elles permettent aux paquets npm d’éviter la compilation TypeScript à l’exécution.
- `runtimeExtensions`, lorsqu’il est présent, doit correspondre à `extensions` en longueur de tableau
  (les entrées sont associées selon leur position). `runtimeSetupEntry` nécessite `setupEntry`.
- Si un artefact `runtimeExtensions`/`runtimeSetupEntry` est déclaré mais
  absent, l’installation ou la découverte échoue avec une erreur de paquetage ; OpenClaw ne
  revient pas silencieusement au code source. Le repli vers le code source (ci-dessous) s’applique uniquement lorsqu’aucune
  entrée d’exécution n’est déclarée.
- Si un paquet installé déclare uniquement une entrée source TypeScript, OpenClaw
  recherche une entrée homologue compilée `dist/*.js` (ou `.mjs`/`.cjs`) correspondante et l’utilise ;
  sinon, il revient à la source TypeScript.
- Tous les chemins d’entrée doivent rester dans le répertoire du paquet du plugin. Les entrées
  d’exécution et les entrées homologues JavaScript compilées déduites ne rendent pas valide un chemin source `extensions` ou
  `setupEntry` qui sort de ce répertoire.

## `defineToolPlugin`

**Importation :** `openclaw/plugin-sdk/tool-plugin`

Pour les plugins qui ajoutent uniquement des outils d’agent. Cette fonction conserve un code source réduit, déduit les types de configuration
et de paramètres d’outil à partir des schémas TypeBox, enveloppe les valeurs de retour simples dans
le format de résultat d’outil d’OpenClaw et expose les métadonnées statiques que
`openclaw plugins build` écrit dans le manifeste du plugin (`contracts.tools`,
`configSchema`).

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Stock Quotes",
  description: "Fetch stock quotes.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "API key." })),
  }),
  tools: (tool) => [
    tool({
      name: "quote",
      label: "Quote",
      description: "Fetch a quote.",
      parameters: Type.Object({
        symbol: Type.String({ description: "Ticker symbol." }),
      }),
      execute: async ({ symbol }, config) => ({ symbol, hasKey: Boolean(config.apiKey) }),
    }),
  ],
});
```

- `configSchema` est facultatif ; son omission utilise un schéma strict d’objet vide
  (le manifeste généré inclut toujours `configSchema`).
- `execute` renvoie une chaîne simple ou une valeur sérialisable en JSON ; la fonction utilitaire
  l’enveloppe dans un résultat d’outil textuel, avec `details` défini sur la valeur de retour
  d’origine (non convertie en chaîne).
- Pour les résultats d’outil personnalisés, `openclaw/plugin-sdk/tool-results` exporte
  `textResult` et `jsonResult`.
- Les noms d’outils sont statiques ; `openclaw plugins build` déduit donc
  `contracts.tools` à partir des outils déclarés, sans duplication manuelle des noms.
- Le chargement à l’exécution reste strict : les plugins installés nécessitent toujours
  `openclaw.plugin.json` et `package.json` `openclaw.extensions`. OpenClaw
  n’exécute jamais le code du plugin pour déduire les données manquantes du manifeste.

## `definePluginEntry`

**Importation :** `openclaw/plugin-sdk/plugin-entry`

Pour les plugins de fournisseurs, les plugins d’outils avancés, les plugins de hooks et tout ce qui
n’est **pas** un canal de messagerie.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Short summary",
  register(api) {
    api.registerProvider({/* ... */});
    api.registerTool({/* ... */});
  },
});
```

| Champ                     | Type                                                             | Obligatoire | Valeur par défaut   |
| ------------------------- | ---------------------------------------------------------------- | ----------- | ------------------- |
| `id`                      | `string`                                                         | Oui         | -                   |
| `name`                    | `string`                                                         | Oui         | -                   |
| `description`             | `string`                                                         | Oui         | -                   |
| `kind`                    | `string` (obsolète, voir ci-dessous)                             | Non         | -                   |
| `configSchema`            | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Non         | Schéma d’objet vide |
| `reload`                  | `OpenClawPluginReloadRegistration`                               | Non         | -                   |
| `nodeHostCommands`        | `OpenClawPluginNodeHostCommand[]`                                | Non         | -                   |
| `securityAuditCollectors` | `OpenClawPluginSecurityAuditCollector[]`                         | Non         | -                   |
| `register`                | `(api: OpenClawPluginApi) => void`                               | Oui         | -                   |

- `id` doit correspondre à votre manifeste `openclaw.plugin.json`.
- Les catalogues de sessions externes utilisent
  `openclaw/plugin-sdk/session-catalog` et
  `api.registerSessionCatalog({ id, label, list, read, continueSession?, archive? })`.
  Le cœur possède les méthodes Gateway `sessions.catalog.*` ; les fournisseurs renvoient des projections d’hôte,
  de session et de transcription normalisée sans enregistrer de RPC.
- `kind` est obsolète : déclarez un emplacement exclusif (`"memory"` ou
  `"context-engine"`) dans le champ `kind` du manifeste `openclaw.plugin.json`
  à la place. L’entrée d’exécution `kind` reste uniquement comme solution de compatibilité pour
  les anciens plugins.
- `configSchema` peut être une fonction pour une évaluation différée. OpenClaw résout et
  mémorise le schéma lors du premier accès, afin que les générateurs de schémas coûteux ne s’exécutent
  qu’une seule fois.
- Un descripteur `nodeHostCommands` peut définir `isAvailable({ config, env })`.
  Le renvoi de `false` omet cette commande et sa capacité de la déclaration Gateway
  du nœud sans interface graphique. OpenClaw l’évalue par rapport à la configuration de démarrage locale
  du nœud ; les gestionnaires de commandes doivent néanmoins valider la disponibilité lorsqu’ils
  sont invoqués.

## `defineChannelPluginEntry`

**Importation :** `openclaw/plugin-sdk/channel-core`

Enveloppe `definePluginEntry` avec un câblage propre au canal : appelle automatiquement
`api.registerChannel({ plugin })`, expose une interface de métadonnées CLI facultative pour l’aide racine
et conditionne `registerFull` au mode d’enregistrement.

```typescript
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineChannelPluginEntry({
  id: "my-channel",
  name: "My Channel",
  description: "Short summary",
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

| Champ                 | Type                                                             | Obligatoire | Valeur par défaut   |
| --------------------- | ---------------------------------------------------------------- | ----------- | ------------------- |
| `id`                  | `string`                                                         | Oui         | -                   |
| `name`                | `string`                                                         | Oui         | -                   |
| `description`         | `string`                                                         | Oui         | -                   |
| `plugin`              | `ChannelPlugin`                                                  | Oui         | -                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Non         | Schéma d’objet vide |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Non         | -                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Non         | -                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Non         | -                   |

Les fonctions de rappel s’exécutent selon le mode d’enregistrement (tableau complet dans
[Mode d’enregistrement](#registration-mode)) :

- `setRuntime` s’exécute dans tous les modes sauf `"cli-metadata"` et
  `"tool-discovery"`. Stockez ici la référence d’exécution, généralement via
  `createPluginRuntimeStore`.
- `registerCliMetadata` s’exécute pour `"cli-metadata"`, `"discovery"` et
  `"full"`. Utilisez-le comme emplacement canonique des descripteurs CLI appartenant au canal,
  afin que l’aide racine reste non activante, que les instantanés de découverte incluent les métadonnées
  statiques des commandes et que l’enregistrement CLI normal reste compatible avec les chargements
  complets de plugins.
- `registerFull` s’exécute uniquement pour `"full"` et `"tool-discovery"`. Pour
  `"tool-discovery"`, il s’exécute _à la place de_ l’enregistrement du canal : OpenClaw
  ignore entièrement `registerChannel`/`setRuntime` et appelle uniquement
  `registerFull`. Tout enregistrement de fournisseur ou d’outil dont votre canal a besoin pour
  la découverte ou l’exécution autonome des outils doit donc se trouver à cet endroit, et non derrière la configuration
  normale du canal.
- L’enregistrement de découverte est non activant, mais pas exempt d’importation : OpenClaw peut
  évaluer l’entrée du plugin de confiance et le module du plugin de canal pour créer
  l’instantané. Les importations de premier niveau doivent être dépourvues d’effets secondaires ; placez les sockets,
  clients, workers et services derrière des chemins réservés à `"full"`.
- Comme `definePluginEntry`, `configSchema` peut être une fabrique différée ; OpenClaw
  mémorise le schéma résolu lors du premier accès.

Enregistrement CLI :

- Utilisez `api.registerCli(..., { descriptors: [...] })` pour les commandes CLI racines appartenant au plugin
  que vous souhaitez charger de manière différée sans les faire disparaître de l’arbre d’analyse de la CLI
  racine. Les noms des descripteurs doivent contenir des lettres, des chiffres, des traits d’union et
  des traits de soulignement, et commencer par une lettre ou un chiffre ; OpenClaw rejette les autres
  formes et supprime les séquences de contrôle du terminal des descriptions avant
  d’afficher l’aide. Couvrez chaque racine de commande de premier niveau exposée par la fonction d’enregistrement.
  `commands` seul reste sur le chemin de compatibilité à chargement immédiat.
- Utilisez `api.registerNodeCliFeature(...)` pour les commandes de fonctionnalités des nœuds appairés afin
  qu’elles soient placées sous `openclaw nodes` (équivalent à
  `registerCli(registrar, { parentPath: ["nodes"], ... })`).
- Pour les autres commandes de plugin imbriquées, ajoutez `parentPath` et enregistrez les commandes
  sur l’objet `program` transmis à la fonction d’enregistrement ; OpenClaw le résout en
  commande parente avant d’appeler le plugin.
- Pour les plugins de canaux, enregistrez les descripteurs CLI depuis `registerCliMetadata`
  et limitez `registerFull` aux opérations d’exécution.
- Si `registerFull` enregistre également des méthodes RPC du Gateway, conservez-les sous un
  préfixe propre au plugin. Les espaces de noms d’administration réservés du cœur (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) sont toujours contraints à
  `operator.admin`.

## `defineSetupPluginEntry`

**Importation :** `openclaw/plugin-sdk/channel-core`

Pour le fichier léger `setup-entry.ts`. Renvoie uniquement `{ plugin }`, sans
câblage d’exécution ni de CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw charge ceci à la place de l’entrée complète lorsqu’un canal est désactivé,
non configuré ou lorsque le chargement différé est activé. Consultez
[Configuration et paramétrage](/fr/plugins/sdk-setup#setup-entry) pour savoir quand cela est important.

Associez `defineSetupPluginEntry(...)` aux familles restreintes d’assistants de configuration :

| Import                              | Utilisation                                                                                                                                                                            |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/setup-runtime` | Assistants de configuration sûrs pour l’exécution : `createSetupTranslator`, adaptateurs de correctifs de configuration sûrs à importer, sortie des notes de recherche, `promptResolvedAllowFrom`, `splitSetupEntries`, proxys de configuration délégués |
| `openclaw/plugin-sdk/channel-setup` | Surfaces de configuration pour l’installation facultative                                                                                                                                                    |
| `openclaw/plugin-sdk/setup-tools`   | Assistants pour la CLI de configuration/installation, les archives et la documentation                                                                                                                                       |

Conservez les SDK lourds, l’enregistrement de la CLI et les services d’exécution
de longue durée dans l’entrée complète.

Les canaux intégrés à l’espace de travail qui séparent les surfaces de configuration
et d’exécution peuvent utiliser `defineBundledChannelSetupEntry(...)` depuis
`openclaw/plugin-sdk/channel-entry-contract` à la place. Cela permet à l’entrée de
configuration de conserver les exports de plugin et de secrets sûrs pour la configuration,
tout en exposant un mécanisme de définition de l’exécution :

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

Utilisez ceci uniquement lorsqu’un flux de configuration nécessite réellement un mécanisme
léger de définition de l’exécution ou une surface Gateway sûre pour la configuration avant
le chargement de l’entrée complète du canal.
`registerSetupRuntime` s’exécute uniquement pour les chargements `"setup-runtime"` ;
limitez-le aux routes ou méthodes de configuration uniquement qui doivent exister avant
l’activation complète différée.

## Mode d’enregistrement

`api.registrationMode` indique à votre plugin comment il a été chargé :

| Mode               | Quand                                               | Éléments à enregistrer                                                                                                        |
| ------------------ | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`           | Démarrage normal du Gateway                             | Tout                                                                                                              |
| `"discovery"`      | Découverte des fonctionnalités en lecture seule                     | Enregistrement du canal et des descripteurs CLI statiques ; le code de l’entrée peut être chargé, mais ignorez les sockets, workers, clients et services |
| `"tool-discovery"` | Chargement ciblé pour répertorier ou exécuter les outils de plugins spécifiques | Enregistrement des fonctionnalités/outils uniquement ; aucune activation du canal                                                                |
| `"setup-only"`     | Canal désactivé/non configuré                      | Enregistrement du canal uniquement                                                                                               |
| `"setup-runtime"`  | Flux de configuration avec exécution disponible                  | Enregistrement du canal et uniquement l’exécution légère nécessaire avant le chargement de l’entrée complète                               |
| `"cli-metadata"`   | Capture de l’aide racine/des métadonnées CLI                   | Descripteurs CLI uniquement                                                                                                    |

`defineChannelPluginEntry` gère automatiquement cette séparation. Si vous utilisez
`definePluginEntry` directement pour un canal, vérifiez vous-même le mode et
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
    // Enregistrer uniquement les surfaces de fonctionnalités (fournisseurs/outils), sans canal.
    return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Enregistrements lourds réservés à l’exécution
  api.registerService(/* ... */);
}
```

Les services de longue durée peuvent émettre de petits événements d’invalidation
ou de cycle de vie au moyen de leur contexte de service :

```typescript
api.registerService({
  id: "index-events",
  start(ctx) {
    ctx.gatewayEvents?.emit("changed", { revision: 1 }, { scope: "operator.read" });
  },
});
```

OpenClaw lui attribue l’espace de noms `plugin.<plugin-id>.changed`. Les noms d’événements
comportent un seul segment en minuscules, les charges utiles doivent être du JSON
de taille limitée et la portée doit être `operator.read`, `operator.write`
ou `operator.admin`. L’émetteur existe uniquement pendant la durée de vie du
service et est révoqué après son arrêt ou l’échec de son démarrage. Préférez des
charges utiles de version ou d’invalidation aux enregistrements complets afin que
les clients autorisés relisent l’état canonique au moyen des méthodes Gateway
ciblées du plugin.

Le mode de découverte crée un instantané de registre sans activation. Il peut
néanmoins évaluer l’entrée du plugin et l’objet du plugin de canal afin qu’OpenClaw
puisse enregistrer les fonctionnalités du canal et les descripteurs CLI statiques.
Considérez l’évaluation du module en mode de découverte comme fiable, mais légère :
aucun client réseau, sous-processus, écouteur, connexion à une base de données,
worker en arrière-plan, lecture d’identifiants ni aucun autre effet secondaire
d’exécution active au niveau supérieur.

Considérez `"setup-runtime"` comme la fenêtre durant laquelle les surfaces de
démarrage réservées à la configuration doivent exister sans réexécuter l’environnement
d’exécution complet du canal intégré. Les cas adaptés comprennent l’enregistrement
du canal, les routes HTTP sûres pour la configuration, les méthodes Gateway sûres
pour la configuration et les assistants de configuration délégués. Les services
lourds en arrière-plan, les systèmes d’enregistrement de la CLI et l’initialisation
des SDK de fournisseurs/clients doivent toujours rester dans `"full"`.

## Formes de plugins

OpenClaw classe les plugins chargés selon leur comportement d’enregistrement :

| Forme                 | Description                                        |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Un type de fonctionnalité (par exemple, fournisseur uniquement)           |
| **hybrid-capability** | Plusieurs types de fonctionnalités (par exemple, fournisseur + parole) |
| **hook-only**         | Uniquement des hooks, aucune fonctionnalité                        |
| **non-capability**    | Outils/commandes/services, mais aucune fonctionnalité        |

Utilisez `openclaw plugins inspect <id>` pour afficher la forme d’un plugin.

## Ressources connexes

- [Présentation du SDK](/fr/plugins/sdk-overview) - API d’enregistrement et référence des sous-chemins
- [Assistants d’exécution](/fr/plugins/sdk-runtime) - `api.runtime` et `createPluginRuntimeStore`
- [Configuration et paramétrage](/fr/plugins/sdk-setup) - manifeste, entrée de configuration, chargement différé
- [Plugins de canal](/fr/plugins/sdk-channel-plugins) - création de l’objet `ChannelPlugin`
- [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins) - enregistrement des fournisseurs et hooks
