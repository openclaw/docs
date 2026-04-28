---
read_when:
    - Vous devez savoir depuis quel sous-chemin du SDK importer
    - Vous souhaitez une référence de toutes les méthodes d’enregistrement sur OpenClawPluginApi
    - Vous recherchez un export spécifique du SDK
sidebarTitle: SDK overview
summary: Import map, référence de l’API d’enregistrement et architecture du SDK
title: Aperçu du SDK Plugin
x-i18n:
    generated_at: "2026-04-25T13:53:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 825efe8d9b2283734730348f9803e40cabaaa6399993648f4bb5822b20e588ee
    source_path: plugins/sdk-overview.md
    workflow: 15
---

Le SDK Plugin est le contrat typé entre les plugins et le cœur. Cette page est la
référence pour **quoi importer** et **ce que vous pouvez enregistrer**.

<Tip>
  Vous cherchez plutôt un guide pratique ?

- Premier plugin ? Commencez par [Créer des plugins](/fr/plugins/building-plugins).
- Plugin de canal ? Voir [Plugins de canal](/fr/plugins/sdk-channel-plugins).
- Plugin de fournisseur ? Voir [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins).
- Plugin d’outil ou de Hook de cycle de vie ? Voir [Plugin hooks](/fr/plugins/hooks).
</Tip>

## Convention d’import

Importez toujours depuis un sous-chemin spécifique :

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Chaque sous-chemin est un petit module autonome. Cela permet de garder un démarrage rapide et
d’éviter les problèmes de dépendances circulaires. Pour les helpers d’entrée/build spécifiques aux canaux,
préférez `openclaw/plugin-sdk/channel-core` ; conservez `openclaw/plugin-sdk/core` pour
la surface parapluie plus large et les helpers partagés tels que
`buildChannelConfigSchema`.

Pour la configuration de canal, publiez le JSON Schema appartenant au canal via
`openclaw.plugin.json#channelConfigs`. Le sous-chemin `plugin-sdk/channel-config-schema`
sert aux primitives de schéma partagées et au constructeur générique. Tout
export de schéma nommé d’après un canal bundled sur ce sous-chemin est un export de compatibilité hérité, pas un modèle pour les nouveaux plugins.

<Warning>
  N’importez pas de surfaces de commodité marquées par fournisseur ou canal (par exemple
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Les plugins bundled composent des sous-chemins SDK génériques dans leurs propres barrels
  `api.ts` / `runtime-api.ts` ; les consommateurs du cœur doivent soit utiliser ces barrels locaux au plugin,
  soit ajouter un contrat SDK générique étroit lorsqu’un besoin est réellement
  inter-canal.

Un petit ensemble de surfaces utilitaires de plugins bundled (`plugin-sdk/feishu`,
`plugin-sdk/zalo`, `plugin-sdk/matrix*`, et similaires) apparaît encore dans la
carte d’exports générée. Elles existent uniquement pour la maintenance des plugins bundled et
ne sont pas des chemins d’import recommandés pour les nouveaux plugins tiers.
</Warning>

## Référence des sous-chemins

Le SDK Plugin est exposé comme un ensemble de sous-chemins étroits regroupés par domaine (entrée de plugin,
canal, fournisseur, auth, runtime, capacité, memory et helpers réservés aux plugins bundled). Pour le catalogue complet — regroupé et lié — voir
[Sous-chemins du SDK Plugin](/fr/plugins/sdk-subpaths).

La liste générée des plus de 200 sous-chemins se trouve dans `scripts/lib/plugin-sdk-entrypoints.json`.

## API d’enregistrement

Le callback `register(api)` reçoit un objet `OpenClawPluginApi` avec ces
méthodes :

### Enregistrement de capacités

| Méthode                                          | Ce qu’elle enregistre                  |
| ------------------------------------------------ | -------------------------------------- |
| `api.registerProvider(...)`                      | Inférence texte (LLM)                  |
| `api.registerAgentHarness(...)`                  | Exécuteur d’agent de bas niveau expérimental |
| `api.registerCliBackend(...)`                    | Backend CLI d’inférence locale         |
| `api.registerChannel(...)`                       | Canal de messagerie                    |
| `api.registerSpeechProvider(...)`                | Synthèse texte-vers-parole / STT       |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcription temps réel en streaming  |
| `api.registerRealtimeVoiceProvider(...)`         | Sessions vocales temps réel duplex     |
| `api.registerMediaUnderstandingProvider(...)`    | Analyse image/audio/vidéo              |
| `api.registerImageGenerationProvider(...)`       | Génération d’images                    |
| `api.registerMusicGenerationProvider(...)`       | Génération de musique                  |
| `api.registerVideoGenerationProvider(...)`       | Génération de vidéo                    |
| `api.registerWebFetchProvider(...)`              | Fournisseur de récupération / scraping web |
| `api.registerWebSearchProvider(...)`             | Recherche web                          |

### Outils et commandes

| Méthode                         | Ce qu’elle enregistre                          |
| ------------------------------- | ---------------------------------------------- |
| `api.registerTool(tool, opts?)` | Outil d’agent (requis ou `{ optional: true }`) |
| `api.registerCommand(def)`      | Commande personnalisée (contourne le LLM)      |

### Infrastructure

| Méthode                                        | Ce qu’elle enregistre                  |
| ---------------------------------------------- | -------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook d’événement                       |
| `api.registerHttpRoute(params)`                | Point de terminaison HTTP de Gateway   |
| `api.registerGatewayMethod(name, handler)`     | Méthode RPC Gateway                    |
| `api.registerGatewayDiscoveryService(service)` | Annonceur local de découverte Gateway  |
| `api.registerCli(registrar, opts?)`            | Sous-commande CLI                      |
| `api.registerService(service)`                 | Service d’arrière-plan                 |
| `api.registerInteractiveHandler(registration)` | Gestionnaire interactif                |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware runtime de résultat d’outil |
| `api.registerMemoryPromptSupplement(builder)`  | Section additive de prompt adjacente à memory |
| `api.registerMemoryCorpusSupplement(adapter)`  | Corpus additif de recherche/lecture memory |

<Note>
  Les espaces de noms d’administration du cœur réservés (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) restent toujours `operator.admin`, même si un plugin essaie d’attribuer un scope plus étroit à une méthode Gateway. Préférez des préfixes spécifiques au plugin pour les
  méthodes appartenant au plugin.
</Note>

<Accordion title="Quand utiliser le middleware de résultat d’outil">
  Les plugins bundled peuvent utiliser `api.registerAgentToolResultMiddleware(...)` lorsqu’
  ils doivent réécrire un résultat d’outil après exécution et avant que le runtime
  ne réinjecte ce résultat dans le modèle. C’est la jonction de confiance neutre vis-à-vis du runtime
  pour les réducteurs de sortie asynchrones comme tokenjuice.

Les plugins bundled doivent déclarer `contracts.agentToolResultMiddleware` pour chaque
runtime ciblé, par exemple `["pi", "codex"]`. Les plugins externes
ne peuvent pas enregistrer ce middleware ; conservez les Hooks de Plugin OpenClaw normaux pour les travaux
qui n’ont pas besoin du timing pré-modèle du résultat d’outil. L’ancien chemin d’enregistrement
de fabrique d’extension embarquée réservé à Pi a été supprimé.
</Accordion>

### Enregistrement de découverte Gateway

`api.registerGatewayDiscoveryService(...)` permet à un plugin d’annoncer la
Gateway active sur un transport de découverte locale comme mDNS/Bonjour. OpenClaw appelle le
service au démarrage de la Gateway lorsque la découverte locale est activée, transmet les
ports Gateway courants et les données d’indication TXT non secrètes, puis appelle le gestionnaire
`stop` renvoyé lors de l’arrêt de la Gateway.

```typescript
api.registerGatewayDiscoveryService({
  id: "my-discovery",
  async advertise(ctx) {
    const handle = await startMyAdvertiser({
      gatewayPort: ctx.gatewayPort,
      tls: ctx.gatewayTlsEnabled,
      displayName: ctx.machineDisplayName,
    });
    return { stop: () => handle.stop() };
  },
});
```

Les plugins de découverte Gateway ne doivent pas traiter les valeurs TXT annoncées comme des secrets ou
de l’authentification. La découverte est un indice de routage ; l’authentification Gateway et l’épinglage TLS restent responsables de la confiance.

### Métadonnées d’enregistrement CLI

`api.registerCli(registrar, opts?)` accepte deux types de métadonnées de haut niveau :

- `commands` : racines de commande explicites appartenant au registrar
- `descriptors` : descripteurs de commande au moment de l’analyse utilisés pour l’aide CLI racine,
  le routage et l’enregistrement paresseux de la CLI du plugin

Si vous souhaitez qu’une commande de plugin reste chargée paresseusement dans le chemin CLI racine normal,
fournissez des `descriptors` qui couvrent chaque racine de commande de haut niveau exposée par ce
registrar.

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "Gérer les comptes Matrix, la vérification, les appareils et l’état du profil",
        hasSubcommands: true,
      },
    ],
  },
);
```

Utilisez `commands` seul uniquement lorsque vous n’avez pas besoin de l’enregistrement paresseux de la CLI racine.
Ce chemin de compatibilité eager reste pris en charge, mais il n’installe pas
d’espaces réservés appuyés sur des descripteurs pour le chargement paresseux au moment de l’analyse.

### Enregistrement de backend CLI

`api.registerCliBackend(...)` permet à un plugin de posséder la configuration par défaut d’un
backend CLI IA local tel que `codex-cli`.

- Le backend `id` devient le préfixe du fournisseur dans les références de modèle comme `codex-cli/gpt-5`.
- Le backend `config` utilise la même forme que `agents.defaults.cliBackends.<id>`.
- La configuration utilisateur reste prioritaire. OpenClaw fusionne `agents.defaults.cliBackends.<id>` au-dessus de la
  valeur par défaut du plugin avant d’exécuter la CLI.
- Utilisez `normalizeConfig` lorsqu’un backend a besoin de réécritures de compatibilité après fusion
  (par exemple normaliser d’anciennes formes de flags).

### Emplacements exclusifs

| Méthode                                    | Ce qu’elle enregistre                                                                                                                                     |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Moteur de contexte (un seul actif à la fois). Le callback `assemble()` reçoit `availableTools` et `citationsMode` afin que le moteur puisse adapter les ajouts au prompt. |
| `api.registerMemoryCapability(capability)` | Capacité memory unifiée                                                                                                                                   |
| `api.registerMemoryPromptSection(builder)` | Constructeur de section de prompt memory                                                                                                                  |
| `api.registerMemoryFlushPlan(resolver)`    | Résolveur de plan de vidage memory                                                                                                                        |
| `api.registerMemoryRuntime(runtime)`       | Adaptateur runtime memory                                                                                                                                 |

### Adaptateurs d’embedding memory

| Méthode                                        | Ce qu’elle enregistre                            |
| ---------------------------------------------- | ------------------------------------------------ |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptateur d’embedding memory pour le plugin actif |

- `registerMemoryCapability` est l’API exclusive de plugin memory préférée.
- `registerMemoryCapability` peut également exposer `publicArtifacts.listArtifacts(...)`
  afin que des plugins compagnons puissent consommer des artefacts memory exportés via
  `openclaw/plugin-sdk/memory-host-core` au lieu d’accéder à la structure privée d’un plugin memory spécifique.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` et
  `registerMemoryRuntime` sont des API exclusives de plugin memory compatibles avec l’héritage.
- `registerMemoryEmbeddingProvider` permet au plugin memory actif d’enregistrer un
  ou plusieurs identifiants d’adaptateur d’embedding (par exemple `openai`, `gemini`, ou un identifiant
  personnalisé défini par le plugin).
- La configuration utilisateur telle que `agents.defaults.memorySearch.provider` et
  `agents.defaults.memorySearch.fallback` se résout par rapport à ces identifiants d’adaptateur enregistrés.

### Événements et cycle de vie

| Méthode                                      | Ce qu’elle fait                |
| -------------------------------------------- | ------------------------------ |
| `api.on(hookName, handler, opts?)`           | Hook de cycle de vie typé      |
| `api.onConversationBindingResolved(handler)` | Callback de binding de conversation |

Voir [Plugin hooks](/fr/plugins/hooks) pour des exemples, les noms de Hooks courants et la
sémantique des garde-fous.

### Sémantique de décision des Hooks

- `before_tool_call` : renvoyer `{ block: true }` est terminal. Dès qu’un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `before_tool_call` : renvoyer `{ block: false }` est traité comme l’absence de décision (identique à l’omission de `block`), et non comme un remplacement.
- `before_install` : renvoyer `{ block: true }` est terminal. Dès qu’un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `before_install` : renvoyer `{ block: false }` est traité comme l’absence de décision (identique à l’omission de `block`), et non comme un remplacement.
- `reply_dispatch` : renvoyer `{ handled: true, ... }` est terminal. Dès qu’un gestionnaire revendique la distribution, les gestionnaires de priorité inférieure et le chemin de distribution par défaut du modèle sont ignorés.
- `message_sending` : renvoyer `{ cancel: true }` est terminal. Dès qu’un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `message_sending` : renvoyer `{ cancel: false }` est traité comme l’absence de décision (identique à l’omission de `cancel`), et non comme un remplacement.
- `message_received` : utilisez le champ typé `threadId` lorsque vous avez besoin d’un routage entrant par fil/sujet. Conservez `metadata` pour les extras spécifiques au canal.
- `message_sending` : utilisez les champs de routage typés `replyToId` / `threadId` avant de revenir à `metadata` spécifique au canal.
- `gateway_start` : utilisez `ctx.config`, `ctx.workspaceDir` et `ctx.getCron?.()` pour l’état de démarrage appartenant à la Gateway au lieu de vous appuyer sur les Hooks internes `gateway:startup`.

### Champs de l’objet API

| Champ                    | Type                      | Description                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Identifiant du Plugin                                                                       |
| `api.name`               | `string`                  | Nom d’affichage                                                                             |
| `api.version`            | `string?`                 | Version du Plugin (optionnelle)                                                             |
| `api.description`        | `string?`                 | Description du Plugin (optionnelle)                                                         |
| `api.source`             | `string`                  | Chemin source du Plugin                                                                     |
| `api.rootDir`            | `string?`                 | Répertoire racine du Plugin (optionnel)                                                     |
| `api.config`             | `OpenClawConfig`          | Instantané de configuration courant (instantané runtime actif en mémoire lorsque disponible) |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuration spécifique au plugin depuis `plugins.entries.<id>.config`                     |
| `api.runtime`            | `PluginRuntime`           | [Helpers runtime](/fr/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Logger scoped (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | Mode de chargement courant ; `"setup-runtime"` est la fenêtre légère de démarrage/configuration avant l’entrée complète |
| `api.resolvePath(input)` | `(string) => string`      | Résoudre un chemin relatif à la racine du Plugin                                            |

## Convention de module interne

À l’intérieur de votre plugin, utilisez des fichiers barrel locaux pour les imports internes :

```
my-plugin/
  api.ts            # Exports publics pour les consommateurs externes
  runtime-api.ts    # Exports runtime internes uniquement
  index.ts          # Point d’entrée du Plugin
  setup-entry.ts    # Entrée légère réservée à la configuration (optionnelle)
```

<Warning>
  N’importez jamais votre propre plugin via `openclaw/plugin-sdk/<your-plugin>`
  depuis le code de production. Faites passer les imports internes par `./api.ts` ou
  `./runtime-api.ts`. Le chemin SDK est uniquement le contrat externe.
</Warning>

Les surfaces publiques de plugins bundled chargées via façade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts`, et fichiers d’entrée publics similaires) préfèrent l’
instantané de configuration runtime actif lorsque OpenClaw est déjà en cours d’exécution. Si aucun instantané
runtime n’existe encore, elles reviennent à la configuration résolue sur disque.

Les plugins de fournisseur peuvent exposer un barrel de contrat local au plugin lorsqu’un
helper est intentionnellement spécifique au fournisseur et n’appartient pas encore à un sous-chemin SDK
générique. Exemples bundled :

- **Anthropic** : surface publique `api.ts` / `contract-api.ts` pour les helpers
  d’en-tête bêta Claude et de flux `service_tier`.
- **`@openclaw/openai-provider`** : `api.ts` exporte les builders de fournisseur,
  les helpers de modèle par défaut et les builders de fournisseur realtime.
- **`@openclaw/openrouter-provider`** : `api.ts` exporte le builder de fournisseur
  ainsi que des helpers d’onboarding/configuration.

<Warning>
  Le code de production des extensions doit également éviter les imports `openclaw/plugin-sdk/<other-plugin>`.
  Si un helper est réellement partagé, faites-le remonter vers un sous-chemin SDK neutre
  comme `openclaw/plugin-sdk/speech`, `.../provider-model-shared`, ou une autre
  surface orientée capacité au lieu de coupler deux plugins ensemble.
</Warning>

## Liens associés

<CardGroup cols={2}>
  <Card title="Points d’entrée" icon="door-open" href="/fr/plugins/sdk-entrypoints">
    Options de `definePluginEntry` et `defineChannelPluginEntry`.
  </Card>
  <Card title="Helpers runtime" icon="gears" href="/fr/plugins/sdk-runtime">
    Référence complète de l’espace de noms `api.runtime`.
  </Card>
  <Card title="Setup et configuration" icon="sliders" href="/fr/plugins/sdk-setup">
    Packaging, manifestes et schémas de configuration.
  </Card>
  <Card title="Tests" icon="vial" href="/fr/plugins/sdk-testing">
    Utilitaires de test et règles de lint.
  </Card>
  <Card title="Migration SDK" icon="arrows-turn-right" href="/fr/plugins/sdk-migration">
    Migration depuis des surfaces obsolètes.
  </Card>
  <Card title="Internes des plugins" icon="diagram-project" href="/fr/plugins/architecture">
    Architecture approfondie et modèle de capacité.
  </Card>
</CardGroup>
