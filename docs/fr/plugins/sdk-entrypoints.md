---
read_when:
    - Vous avez besoin de la signature de type exacte de definePluginEntry ou de defineChannelPluginEntry
    - Vous souhaitez comprendre le mode d’enregistrement (complet vs configuration vs métadonnées CLI)
    - Vous consultez les options de point d’entrée
sidebarTitle: Entry Points
summary: Référence pour definePluginEntry, defineChannelPluginEntry et defineSetupPluginEntry
title: Points d’entrée du Plugin
x-i18n:
    generated_at: "2026-05-07T13:23:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2fecc65b8f196f3b40daee2e6087759b8786b033e1cd0c3d3b5695c9f8a3f66a
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Chaque Plugin exporte un objet d’entrée par défaut. Le SDK fournit trois helpers pour
les créer.

Pour les Plugins installés, `package.json` doit pointer le chargement d’exécution vers le
JavaScript compilé lorsqu’il est disponible :

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

`extensions` et `setupEntry` restent des entrées sources valides pour le développement
dans un workspace et un checkout git. `runtimeExtensions` et `runtimeSetupEntry` sont préférés
quand OpenClaw charge un package installé et permettent aux packages npm d’éviter la
compilation TypeScript à l’exécution. Des entrées d’exécution explicites sont requises :
`runtimeSetupEntry` requiert `setupEntry`, et les artefacts `runtimeExtensions` ou
`runtimeSetupEntry` manquants font échouer l’installation/la découverte au lieu de revenir
silencieusement à la source. Si un package installé ne déclare qu’une entrée source TypeScript,
OpenClaw utilisera un pair `dist/*.js` compilé correspondant lorsqu’il existe, puis reviendra
à la source TypeScript.

Tous les chemins d’entrée doivent rester dans le répertoire du package du Plugin. Les entrées
d’exécution et les pairs JavaScript compilés déduits ne rendent pas valide un chemin source
`extensions` ou `setupEntry` qui s’échappe.

<Tip>
  **Vous cherchez un guide pas à pas ?** Consultez [Plugins de canal](/fr/plugins/sdk-channel-plugins)
  ou [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins) pour des guides étape par étape.
</Tip>

## `definePluginEntry`

**Import :** `openclaw/plugin-sdk/plugin-entry`

Pour les Plugins de fournisseur, les Plugins d’outils, les Plugins de hook et tout ce qui
n’est **pas** un canal de messagerie.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Short summary",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
  },
});
```

| Champ          | Type                                                             | Requis | Par défaut         |
| -------------- | ---------------------------------------------------------------- | ------ | ------------------ |
| `id`           | `string`                                                         | Oui    | -                  |
| `name`         | `string`                                                         | Oui    | -                  |
| `description`  | `string`                                                         | Oui    | -                  |
| `kind`         | `string`                                                         | Non    | -                  |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Non    | Schéma d’objet vide |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Oui    | -                  |

- `id` doit correspondre à votre manifeste `openclaw.plugin.json`.
- `kind` sert aux emplacements exclusifs : `"memory"` ou `"context-engine"`.
- `configSchema` peut être une fonction pour une évaluation paresseuse.
- OpenClaw résout et mémorise ce schéma au premier accès, donc les constructeurs
  de schéma coûteux ne s’exécutent qu’une seule fois.

## `defineChannelPluginEntry`

**Import :** `openclaw/plugin-sdk/channel-core`

Enveloppe `definePluginEntry` avec un câblage propre aux canaux. Appelle automatiquement
`api.registerChannel({ plugin })`, expose une couture optionnelle de métadonnées CLI
pour l’aide racine et protège `registerFull` selon le mode d’enregistrement.

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

| Champ                 | Type                                                             | Requis | Par défaut         |
| --------------------- | ---------------------------------------------------------------- | ------ | ------------------ |
| `id`                  | `string`                                                         | Oui    | -                  |
| `name`                | `string`                                                         | Oui    | -                  |
| `description`         | `string`                                                         | Oui    | -                  |
| `plugin`              | `ChannelPlugin`                                                  | Oui    | -                  |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Non    | Schéma d’objet vide |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Non    | -                  |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Non    | -                  |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Non    | -                  |

- `setRuntime` est appelé pendant l’enregistrement afin que vous puissiez stocker la référence d’exécution
  (généralement via `createPluginRuntimeStore`). Il est ignoré pendant la capture des métadonnées CLI.
- `registerCliMetadata` s’exécute pendant `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"` et
  `api.registrationMode === "full"`.
  Utilisez-le comme emplacement canonique pour les descripteurs CLI appartenant au canal, afin que l’aide racine
  reste non activante, que les instantanés de découverte incluent les métadonnées de commandes statiques et que
  l’enregistrement normal des commandes CLI reste compatible avec les chargements complets de Plugin.
- L’enregistrement de découverte est non activant, pas sans import. OpenClaw peut
  évaluer l’entrée de Plugin fiable et le module de Plugin de canal pour construire
  l’instantané ; gardez donc les imports de premier niveau sans effet de bord et placez les sockets,
  clients, workers et services derrière des chemins réservés à `"full"`.
- `registerFull` ne s’exécute que lorsque `api.registrationMode === "full"`. Il est ignoré
  pendant le chargement uniquement de configuration.
- Comme `definePluginEntry`, `configSchema` peut être une fabrique paresseuse et OpenClaw
  mémorise le schéma résolu au premier accès.
- Pour les commandes CLI racine appartenant au Plugin, préférez `api.registerCli(..., { descriptors: [...] })`
  lorsque vous voulez que la commande reste chargée paresseusement sans disparaître de l’arbre
  d’analyse CLI racine. Pour les commandes de fonctionnalité de nœud appairé, préférez
  `api.registerNodeCliFeature(...)` afin que la commande arrive sous `openclaw nodes`.
  Pour les autres commandes de Plugin imbriquées, ajoutez `parentPath` et enregistrez les commandes sur
  l’objet `program` passé au registraire ; OpenClaw le résout vers la
  commande parente avant d’appeler le Plugin. Pour les Plugins de canal, préférez
  enregistrer ces descripteurs depuis `registerCliMetadata(...)` et gardez
  `registerFull(...)` concentré sur le travail réservé à l’exécution.
- Si `registerFull(...)` enregistre aussi des méthodes RPC Gateway, gardez-les sur un
  préfixe propre au Plugin. Les espaces de noms d’administration du noyau réservés (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) sont toujours forcés en
  `operator.admin`.

## `defineSetupPluginEntry`

**Import :** `openclaw/plugin-sdk/channel-core`

Pour le fichier léger `setup-entry.ts`. Retourne simplement `{ plugin }`, sans
câblage d’exécution ni CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw charge ceci au lieu de l’entrée complète lorsqu’un canal est désactivé,
non configuré ou lorsque le chargement différé est activé. Consultez
[Configuration et paramétrage](/fr/plugins/sdk-setup#setup-entry) pour savoir quand cela importe.

En pratique, associez `defineSetupPluginEntry(...)` aux familles étroites de helpers de configuration :

- `openclaw/plugin-sdk/setup-runtime` pour les helpers de configuration sûrs à l’exécution, comme
  les adaptateurs de patch de configuration sûrs à importer, la sortie de note de recherche,
  `promptResolvedAllowFrom`, `splitSetupEntries` et les proxys de configuration délégués
- `openclaw/plugin-sdk/channel-setup` pour les surfaces de configuration d’installation optionnelle
- `openclaw/plugin-sdk/setup-tools` pour les helpers CLI/archive/docs de configuration/installation

Gardez les SDK lourds, l’enregistrement CLI et les services d’exécution longue durée dans l’entrée
complète.

Les canaux de workspace groupés qui séparent les surfaces de configuration et d’exécution peuvent utiliser
`defineBundledChannelSetupEntry(...)` depuis
`openclaw/plugin-sdk/channel-entry-contract` à la place. Ce contrat permet à l’entrée
de configuration de conserver des exports Plugin/secrets sûrs pour la configuration tout en exposant
un setter d’exécution :

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
});
```

Utilisez ce contrat groupé seulement lorsque les flux de configuration ont réellement besoin d’un setter
d’exécution léger avant le chargement de l’entrée complète du canal.

## Mode d’enregistrement

`api.registrationMode` indique à votre Plugin comment il a été chargé :

| Mode              | Quand                             | Ce qu’il faut enregistrer                                                                                            |
| ----------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | Démarrage Gateway normal          | Tout                                                                                                                |
| `"discovery"`     | Découverte des capacités en lecture seule | Enregistrement du canal plus descripteurs CLI statiques ; le code d’entrée peut se charger, mais ignorez sockets, workers, clients et services |
| `"setup-only"`    | Canal désactivé/non configuré     | Enregistrement du canal uniquement                                                                                  |
| `"setup-runtime"` | Flux de configuration avec exécution disponible | Enregistrement du canal plus seulement l’exécution légère nécessaire avant le chargement de l’entrée complète        |
| `"cli-metadata"`  | Aide racine / capture de métadonnées CLI | Descripteurs CLI uniquement                                                                                         |

`defineChannelPluginEntry` gère automatiquement cette séparation. Si vous utilisez
`definePluginEntry` directement pour un canal, vérifiez vous-même le mode :

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

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Heavy runtime-only registrations
  api.registerService(/* ... */);
}
```

Le mode découverte construit un instantané de registre non activant. Il peut tout de même évaluer
l’entrée de Plugin et l’objet Plugin de canal afin qu’OpenClaw puisse enregistrer les
capacités du canal et les descripteurs CLI statiques. Traitez l’évaluation de module en mode découverte comme
fiable mais légère : aucun client réseau, sous-processus, écouteur, connexion à une base de données,
worker d’arrière-plan, lecture d’identifiants ni autre effet de bord d’exécution réel au premier niveau.

Traitez `"setup-runtime"` comme la fenêtre où les surfaces de démarrage uniquement de configuration doivent
exister sans réentrer dans l’exécution complète du canal groupé. Les bons cas d’usage sont
l’enregistrement du canal, les routes HTTP sûres pour la configuration, les méthodes Gateway sûres pour la configuration et
les helpers de configuration délégués. Les services d’arrière-plan lourds, les registraires CLI et les
amorçages de SDK fournisseur/client restent réservés à `"full"`.

Pour les registraires CLI en particulier :

- utilisez `descriptors` lorsque le registraire possède une ou plusieurs commandes racines et que vous
  voulez qu’OpenClaw charge de manière différée le module CLI réel à la première invocation
- assurez-vous que ces descripteurs couvrent chaque racine de commande de premier niveau exposée par le
  registraire
- limitez les noms de commande des descripteurs aux lettres, chiffres, traits d’union et traits de soulignement,
  en commençant par une lettre ou un chiffre ; OpenClaw rejette les noms de descripteur qui ne respectent pas
  cette forme et supprime les séquences de contrôle du terminal des descriptions avant d’afficher l’aide
- utilisez `commands` seul uniquement pour les chemins de compatibilité à chargement immédiat

## Formes de Plugin

OpenClaw classe les plugins chargés selon leur comportement d’enregistrement :

| Forme                 | Description                                                  |
| --------------------- | ------------------------------------------------------------ |
| **plain-capability**  | Un seul type de capacité (p. ex. fournisseur uniquement)     |
| **hybrid-capability** | Plusieurs types de capacités (p. ex. fournisseur + parole)   |
| **hook-only**         | Uniquement des hooks, aucune capacité                        |
| **non-capability**    | Outils/commandes/services, mais aucune capacité              |

Utilisez `openclaw plugins inspect <id>` pour voir la forme d’un plugin.

## Connexe

- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) - API d’enregistrement et référence des sous-chemins
- [Assistants d’exécution](/fr/plugins/sdk-runtime) - `api.runtime` et `createPluginRuntimeStore`
- [Configuration et paramétrage](/fr/plugins/sdk-setup) - manifeste, point d’entrée de configuration, chargement différé
- [Plugins de canal](/fr/plugins/sdk-channel-plugins) - création de l’objet `ChannelPlugin`
- [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins) - enregistrement du fournisseur et hooks
