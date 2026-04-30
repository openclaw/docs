---
read_when:
    - Vous devez savoir depuis quel sous-chemin du SDK importer
    - Vous souhaitez une référence pour toutes les méthodes d’enregistrement d’OpenClawPluginApi
    - Vous recherchez une exportation spécifique du SDK
sidebarTitle: Plugin SDK overview
summary: Carte d’importation, référence de l’API d’enregistrement et architecture du SDK
title: Présentation du SDK Plugin
x-i18n:
    generated_at: "2026-04-30T07:40:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1749ad99c55ffd14624b817aba963bd93ebe7976937138693177523bbe3aa88c
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Le SDK de Plugin est le contrat typé entre les plugins et le noyau. Cette page est la
référence pour **ce qu’il faut importer** et **ce que vous pouvez enregistrer**.

<Note>
  Cette page s’adresse aux auteurs de plugins qui utilisent `openclaw/plugin-sdk/*` dans
  OpenClaw. Pour les applications externes, scripts, tableaux de bord, tâches CI et extensions IDE
  qui veulent exécuter des agents via le Gateway, utilisez plutôt le
  [SDK d’application OpenClaw](/fr/concepts/openclaw-sdk) et le package `@openclaw/sdk`.
</Note>

<Tip>
Vous cherchez plutôt un guide pratique ? Commencez par [Créer des plugins](/fr/plugins/building-plugins), utilisez [Plugins de canal](/fr/plugins/sdk-channel-plugins) pour les plugins de canal, [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins) pour les plugins de fournisseur, et [Hooks de Plugin](/fr/plugins/hooks) pour les plugins de hook d’outil ou de cycle de vie.
</Tip>

## Convention d’importation

Importez toujours depuis un sous-chemin spécifique :

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Chaque sous-chemin est un petit module autonome. Cela garde le démarrage rapide et
évite les problèmes de dépendances circulaires. Pour les assistants d’entrée/de construction propres aux canaux,
préférez `openclaw/plugin-sdk/channel-core` ; gardez `openclaw/plugin-sdk/core` pour
la surface générale plus large et les assistants partagés tels que
`buildChannelConfigSchema`.

Pour la configuration de canal, publiez le schéma JSON appartenant au canal via
`openclaw.plugin.json#channelConfigs`. Le sous-chemin `plugin-sdk/channel-config-schema`
sert aux primitives de schéma partagées et au générateur générique. Les plugins
intégrés d’OpenClaw utilisent `plugin-sdk/bundled-channel-config-schema` pour les schémas
de canaux intégrés conservés. Les exports de compatibilité dépréciés restent dans
`plugin-sdk/channel-config-schema-legacy` ; aucun des sous-chemins de schéma intégré n’est un
modèle pour les nouveaux plugins.

<Warning>
  N’importez pas de points d’intégration pratiques marqués par fournisseur ou canal (par exemple
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Les plugins intégrés composent des sous-chemins SDK génériques dans leurs propres barrels `api.ts` /
  `runtime-api.ts` ; les consommateurs du noyau doivent soit utiliser ces barrels locaux au plugin,
  soit ajouter un contrat SDK générique étroit lorsqu’un besoin est réellement
  transversal aux canaux.

Un petit ensemble de points d’intégration d’assistants de plugins intégrés apparaît encore dans la carte d’exports générée
lorsqu’ils ont un usage propriétaire suivi. Ils existent uniquement pour la maintenance des plugins intégrés
et ne sont pas des chemins d’importation recommandés pour les nouveaux plugins tiers.

`openclaw/plugin-sdk/discord` et `openclaw/plugin-sdk/telegram-account` sont
également conservés comme façades de compatibilité dépréciées pour un usage propriétaire suivi. Ne copiez pas
ces chemins d’importation dans de nouveaux plugins ; utilisez plutôt les assistants runtime injectés et
les sous-chemins SDK de canal génériques.
</Warning>

## Référence des sous-chemins

Le SDK de Plugin est exposé comme un ensemble de sous-chemins étroits regroupés par domaine (entrée de plugin,
canal, fournisseur, authentification, runtime, capacité, mémoire et assistants réservés
aux plugins intégrés). Pour le catalogue complet — regroupé et lié — consultez
[Sous-chemins du SDK de Plugin](/fr/plugins/sdk-subpaths).

La liste générée de plus de 200 sous-chemins se trouve dans `scripts/lib/plugin-sdk-entrypoints.json`.

## API d’enregistrement

Le callback `register(api)` reçoit un objet `OpenClawPluginApi` avec ces
méthodes :

### Enregistrement des capacités

| Méthode                                          | Ce qu’elle enregistre                  |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Inférence textuelle (LLM)              |
| `api.registerAgentHarness(...)`                  | Exécuteur d’agent bas niveau expérimental |
| `api.registerCliBackend(...)`                    | Backend d’inférence CLI local          |
| `api.registerChannel(...)`                       | Canal de messagerie                    |
| `api.registerSpeechProvider(...)`                | Synthèse texte-parole / STT            |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcription temps réel en streaming  |
| `api.registerRealtimeVoiceProvider(...)`         | Sessions vocales temps réel duplex     |
| `api.registerMediaUnderstandingProvider(...)`    | Analyse d’image/audio/vidéo            |
| `api.registerImageGenerationProvider(...)`       | Génération d’images                    |
| `api.registerMusicGenerationProvider(...)`       | Génération de musique                  |
| `api.registerVideoGenerationProvider(...)`       | Génération de vidéo                    |
| `api.registerWebFetchProvider(...)`              | Fournisseur de récupération / scraping Web |
| `api.registerWebSearchProvider(...)`             | Recherche Web                          |

### Outils et commandes

| Méthode                         | Ce qu’elle enregistre                            |
| ------------------------------- | ------------------------------------------------ |
| `api.registerTool(tool, opts?)` | Outil d’agent (obligatoire ou `{ optional: true }`) |
| `api.registerCommand(def)`      | Commande personnalisée (contourne le LLM)        |

Les commandes de plugin peuvent définir `agentPromptGuidance` lorsque l’agent a besoin d’un bref
indice de routage appartenant à la commande. Gardez ce texte centré sur la commande elle-même ; n’ajoutez pas
de politique propre au fournisseur ou au plugin dans les générateurs de prompt du noyau.

### Infrastructure

| Méthode                                        | Ce qu’elle enregistre                    |
| ---------------------------------------------- | ---------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook d’événement                         |
| `api.registerHttpRoute(params)`                | Point de terminaison HTTP du Gateway     |
| `api.registerGatewayMethod(name, handler)`     | Méthode RPC du Gateway                   |
| `api.registerGatewayDiscoveryService(service)` | Annonceur de découverte du Gateway local |
| `api.registerCli(registrar, opts?)`            | Sous-commande CLI                        |
| `api.registerService(service)`                 | Service d’arrière-plan                   |
| `api.registerInteractiveHandler(registration)` | Gestionnaire interactif                  |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware runtime de résultat d’outil   |
| `api.registerMemoryPromptSupplement(builder)`  | Section de prompt additive liée à la mémoire |
| `api.registerMemoryCorpusSupplement(adapter)`  | Corpus additif de recherche/lecture mémoire |

### Hooks hôtes pour les plugins de workflow

Les hooks hôtes sont les points d’intégration SDK pour les plugins qui doivent participer au
cycle de vie de l’hôte plutôt que seulement ajouter un fournisseur, un canal ou un outil. Ce sont des
contrats génériques ; le mode Plan peut les utiliser, mais les workflows d’approbation,
les barrières de politique d’espace de travail, les moniteurs d’arrière-plan, les assistants de configuration et les plugins compagnons d’interface
le peuvent aussi.

| Méthode                                                                  | Contrat qu’elle possède                                                            |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | État de session appartenant au plugin, compatible JSON, projeté via les sessions du Gateway |
| `api.enqueueNextTurnInjection(...)`                                      | Contexte durable exactement une fois injecté dans le prochain tour d’agent pour une session |
| `api.registerTrustedToolPolicy(...)`                                     | Politique d’outil pré-plugin intégrée/de confiance pouvant bloquer ou réécrire les paramètres d’outil |
| `api.registerToolMetadata(...)`                                          | Métadonnées d’affichage du catalogue d’outils sans modifier l’implémentation de l’outil |
| `api.registerCommand(...)`                                               | Commandes de plugin à portée limitée ; les résultats de commande peuvent définir `continueAgent: true` |
| `api.registerControlUiDescriptor(...)`                                   | Descripteurs de contribution à l’UI de contrôle pour les surfaces session, outil, exécution ou paramètres |
| `api.registerRuntimeLifecycle(...)`                                      | Callbacks de nettoyage pour les ressources runtime appartenant au plugin sur les chemins reset/delete/reload |
| `api.registerAgentEventSubscription(...)`                                | Abonnements aux événements assainis pour l’état de workflow et les moniteurs |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | État temporaire de plugin par exécution, effacé au cycle de vie terminal de l’exécution |
| `api.registerSessionSchedulerJob(...)`                                   | Enregistrements de tâches de planificateur de session appartenant au plugin avec nettoyage déterministe |

Les contrats séparent volontairement les autorités :

- Les plugins externes peuvent posséder des extensions de session, des descripteurs d’UI, des commandes, des métadonnées d’outil, des injections de tour suivant et des hooks normaux.
- Les politiques d’outil de confiance s’exécutent avant les hooks ordinaires `before_tool_call` et sont réservées aux intégrés parce qu’elles participent à la politique de sécurité de l’hôte.
- La propriété des commandes réservées est réservée aux intégrés. Les plugins externes doivent utiliser leurs propres noms de commande ou alias.
- `allowPromptInjection=false` désactive les hooks qui mutent le prompt, y compris
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  les champs de prompt de l’ancien `before_agent_start`, et
  `enqueueNextTurnInjection`.

Exemples de consommateurs hors Plan :

| Archétype de plugin           | Hooks utilisés                                                                                                                            |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Workflow d’approbation        | Extension de session, continuation de commande, injection de tour suivant, descripteur d’UI                                               |
| Barrière de politique budget/espace de travail | Politique d’outil de confiance, métadonnées d’outil, projection de session                                                |
| Moniteur de cycle de vie d’arrière-plan | Nettoyage du cycle de vie runtime, abonnement aux événements d’agent, propriété/nettoyage du planificateur de session, contribution Heartbeat au prompt, descripteur d’UI |
| Assistant de configuration ou d’onboarding | Extension de session, commandes à portée limitée, descripteur de l’UI de contrôle                                               |

<Note>
  Les espaces de noms d’administration réservés du noyau (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) restent toujours `operator.admin`, même si un plugin essaie d’attribuer une
  portée de méthode Gateway plus étroite. Préférez des préfixes propres au plugin pour
  les méthodes appartenant au plugin.
</Note>

<Accordion title="Quand utiliser le middleware de résultat d’outil">
  Les plugins intégrés peuvent utiliser `api.registerAgentToolResultMiddleware(...)` lorsqu’ils
  doivent réécrire un résultat d’outil après l’exécution et avant que le runtime
  renvoie ce résultat au modèle. C’est le point d’intégration de confiance et neutre vis-à-vis du runtime
  pour les réducteurs de sortie asynchrones tels que tokenjuice.

Les plugins intégrés doivent déclarer `contracts.agentToolResultMiddleware` pour chaque
runtime ciblé, par exemple `["pi", "codex"]`. Les plugins externes
ne peuvent pas enregistrer ce middleware ; gardez les hooks de plugin OpenClaw normaux pour le travail
qui n’a pas besoin d’un minutage de résultat d’outil avant modèle. L’ancien chemin d’enregistrement
de fabrique d’extension intégrée propre à Pi a été supprimé.
</Accordion>

### Enregistrement de la découverte du Gateway

`api.registerGatewayDiscoveryService(...)` permet à un plugin d’annoncer le Gateway actif
sur un transport de découverte local tel que mDNS/Bonjour. OpenClaw appelle le
service pendant le démarrage du Gateway lorsque la découverte locale est activée, transmet les
ports actuels du Gateway et les données d’indice TXT non secrètes, puis appelle le gestionnaire
`stop` retourné pendant l’arrêt du Gateway.

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
de l'authentification. La découverte est une indication de routage ; l'authentification Gateway et l'épinglage TLS restent
responsables de la confiance.

### Métadonnées d'enregistrement CLI

`api.registerCli(registrar, opts?)` accepte deux types de métadonnées de premier niveau :

- `commands` : racines de commandes explicites appartenant au registrar
- `descriptors` : descripteurs de commandes au moment de l'analyse utilisés pour l'aide de la CLI racine,
  le routage et l'enregistrement à la demande de la CLI du plugin

Si vous voulez qu'une commande de plugin reste chargée à la demande dans le chemin normal de la CLI racine,
fournissez des `descriptors` qui couvrent chaque racine de commande de premier niveau exposée par ce
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
        description: "Manage Matrix accounts, verification, devices, and profile state",
        hasSubcommands: true,
      },
    ],
  },
);
```

Utilisez `commands` seul uniquement lorsque vous n'avez pas besoin de l'enregistrement à la demande dans la CLI racine.
Ce chemin de compatibilité anticipé reste pris en charge, mais il n'installe pas
d'espaces réservés adossés à des descripteurs pour le chargement à la demande au moment de l'analyse.

### Enregistrement de backend CLI

`api.registerCliBackend(...)` permet à un plugin de posséder la configuration par défaut d'un backend CLI
d'IA local tel que `codex-cli`.

- L'`id` du backend devient le préfixe du fournisseur dans les références de modèle comme `codex-cli/gpt-5`.
- La `config` du backend utilise la même forme que `agents.defaults.cliBackends.<id>`.
- La configuration utilisateur l'emporte toujours. OpenClaw fusionne `agents.defaults.cliBackends.<id>` par-dessus la
  valeur par défaut du plugin avant d'exécuter la CLI.
- Utilisez `normalizeConfig` lorsqu'un backend a besoin de réécritures de compatibilité après la fusion
  (par exemple pour normaliser d'anciennes formes d'indicateurs).

### Emplacements exclusifs

| Méthode                                    | Ce qu'elle enregistre                                                                                                                                                   |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Moteur de contexte (un seul actif à la fois). Le rappel `assemble()` reçoit `availableTools` et `citationsMode` afin que le moteur puisse adapter les ajouts au prompt. |
| `api.registerMemoryCapability(capability)` | Capacité de mémoire unifiée                                                                                                                                             |
| `api.registerMemoryPromptSection(builder)` | Générateur de section de prompt de mémoire                                                                                                                              |
| `api.registerMemoryFlushPlan(resolver)`    | Résolveur de plan de vidage de mémoire                                                                                                                                  |
| `api.registerMemoryRuntime(runtime)`       | Adaptateur d'exécution de mémoire                                                                                                                                       |

### Adaptateurs d'embedding mémoire

| Méthode                                        | Ce qu'elle enregistre                                |
| ---------------------------------------------- | ---------------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptateur d'embedding mémoire pour le plugin actif |

- `registerMemoryCapability` est l'API exclusive privilégiée pour les plugins de mémoire.
- `registerMemoryCapability` peut également exposer `publicArtifacts.listArtifacts(...)`
  afin que les plugins compagnons puissent consommer les artefacts mémoire exportés via
  `openclaw/plugin-sdk/memory-host-core` au lieu d'accéder à la structure privée d'un
  plugin de mémoire spécifique.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` et
  `registerMemoryRuntime` sont des API exclusives de plugins de mémoire compatibles avec l'existant.
- `MemoryFlushPlan.model` peut épingler le tour de vidage à une référence `provider/model`
  exacte, telle que `ollama/qwen3:8b`, sans hériter de la chaîne de secours active.
- `registerMemoryEmbeddingProvider` permet au plugin de mémoire actif d'enregistrer un
  ou plusieurs identifiants d'adaptateur d'embedding (par exemple `openai`, `gemini` ou un identifiant
  personnalisé défini par le plugin).
- La configuration utilisateur telle que `agents.defaults.memorySearch.provider` et
  `agents.defaults.memorySearch.fallback` se résout par rapport à ces identifiants
  d'adaptateur enregistrés.

### Événements et cycle de vie

| Méthode                                      | Ce qu'elle fait                |
| -------------------------------------------- | ------------------------------ |
| `api.on(hookName, handler, opts?)`           | Hook de cycle de vie typé      |
| `api.onConversationBindingResolved(handler)` | Rappel de liaison conversation |

Consultez [Hooks de plugin](/fr/plugins/hooks) pour des exemples, les noms de hooks courants et la sémantique des garde-fous.

### Sémantique de décision des hooks

- `before_tool_call` : renvoyer `{ block: true }` est terminal. Dès qu'un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `before_tool_call` : renvoyer `{ block: false }` est traité comme une absence de décision (comme si `block` était omis), et non comme une surcharge.
- `before_install` : renvoyer `{ block: true }` est terminal. Dès qu'un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `before_install` : renvoyer `{ block: false }` est traité comme une absence de décision (comme si `block` était omis), et non comme une surcharge.
- `reply_dispatch` : renvoyer `{ handled: true, ... }` est terminal. Dès qu'un gestionnaire revendique l'envoi, les gestionnaires de priorité inférieure et le chemin d'envoi de modèle par défaut sont ignorés.
- `message_sending` : renvoyer `{ cancel: true }` est terminal. Dès qu'un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `message_sending` : renvoyer `{ cancel: false }` est traité comme une absence de décision (comme si `cancel` était omis), et non comme une surcharge.
- `message_received` : utilisez le champ typé `threadId` lorsque vous avez besoin du routage entrant de fil/sujet. Conservez `metadata` pour les extras propres au canal.
- `message_sending` : utilisez les champs de routage typés `replyToId` / `threadId` avant de recourir à `metadata` propre au canal.
- `gateway_start` : utilisez `ctx.config`, `ctx.workspaceDir` et `ctx.getCron?.()` pour l'état de démarrage appartenant au Gateway, au lieu de vous appuyer sur les hooks internes `gateway:startup`.
- `cron_changed` : observez les changements de cycle de vie Cron appartenant au Gateway. Utilisez `event.job?.state?.nextRunAtMs` et `ctx.getCron?.()` lors de la synchronisation de planificateurs de réveil externes, et gardez OpenClaw comme source de vérité pour les vérifications d'échéance et l'exécution.

### Champs de l'objet API

| Champ                    | Type                      | Description                                                                                                             |
| ------------------------ | ------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | ID du plugin                                                                                                            |
| `api.name`               | `string`                  | Nom d'affichage                                                                                                         |
| `api.version`            | `string?`                 | Version du plugin (facultative)                                                                                         |
| `api.description`        | `string?`                 | Description du plugin (facultative)                                                                                     |
| `api.source`             | `string`                  | Chemin source du plugin                                                                                                 |
| `api.rootDir`            | `string?`                 | Répertoire racine du plugin (facultatif)                                                                                |
| `api.config`             | `OpenClawConfig`          | Instantané de configuration actuel (instantané d'exécution en mémoire actif lorsqu'il est disponible)                   |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuration propre au plugin issue de `plugins.entries.<id>.config`                                                   |
| `api.runtime`            | `PluginRuntime`           | [Assistants d'exécution](/fr/plugins/sdk-runtime)                                                                          |
| `api.logger`             | `PluginLogger`            | Journaliseur à portée limitée (`debug`, `info`, `warn`, `error`)                                                       |
| `api.registrationMode`   | `PluginRegistrationMode`  | Mode de chargement actuel ; `"setup-runtime"` est la fenêtre légère de démarrage/configuration avant l'entrée complète |
| `api.resolvePath(input)` | `(string) => string`      | Résout le chemin relativement à la racine du plugin                                                                     |

## Convention de module interne

Dans votre plugin, utilisez des fichiers barrel locaux pour les imports internes :

```
my-plugin/
  api.ts            # Exportations publiques pour les consommateurs externes
  runtime-api.ts    # Exportations d'exécution internes uniquement
  index.ts          # Point d'entrée du plugin
  setup-entry.ts    # Entrée légère de configuration uniquement (facultative)
```

<Warning>
  N'importez jamais votre propre plugin via `openclaw/plugin-sdk/<your-plugin>`
  depuis le code de production. Faites passer les imports internes par `./api.ts` ou
  `./runtime-api.ts`. Le chemin SDK est uniquement le contrat externe.
</Warning>

Les surfaces publiques des plugins groupés chargés via façade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` et les fichiers d'entrée publics similaires) privilégient
l'instantané de configuration d'exécution actif lorsqu'OpenClaw est déjà en cours d'exécution. Si aucun
instantané d'exécution n'existe encore, elles se rabattent sur le fichier de configuration résolu sur disque.
Les façades de plugins groupés empaquetés doivent être chargées via les chargeurs de façades de plugins
d'OpenClaw ; les imports directs depuis `dist/extensions/...` contournent les miroirs de dépendances d'exécution
préparés que les installations empaquetées utilisent pour les dépendances appartenant aux plugins.

Les plugins fournisseurs peuvent exposer un barrel de contrat étroit local au plugin lorsqu'un
assistant est volontairement propre au fournisseur et n'a pas encore sa place dans un sous-chemin SDK
générique. Exemples groupés :

- **Anthropic** : jointure publique `api.ts` / `contract-api.ts` pour les assistants Claude
  beta-header et de flux `service_tier`.
- **`@openclaw/openai-provider`** : `api.ts` exporte les constructeurs de fournisseurs,
  les assistants de modèle par défaut et les constructeurs de fournisseurs temps réel.
- **`@openclaw/openrouter-provider`** : `api.ts` exporte le constructeur de fournisseur
  ainsi que les assistants d'onboarding/configuration.

<Warning>
  Le code de production des extensions doit également éviter les imports `openclaw/plugin-sdk/<other-plugin>`.
  Si un assistant est vraiment partagé, promouvez-le vers un sous-chemin SDK neutre
  tel que `openclaw/plugin-sdk/speech`, `.../provider-model-shared` ou une autre
  surface orientée capacité au lieu de coupler deux plugins entre eux.
</Warning>

## Associés

<CardGroup cols={2}>
  <Card title="Points d'entrée" icon="door-open" href="/fr/plugins/sdk-entrypoints">
    Options de `definePluginEntry` et `defineChannelPluginEntry`.
  </Card>
  <Card title="Assistants d'exécution" icon="gears" href="/fr/plugins/sdk-runtime">
    Référence complète de l'espace de noms `api.runtime`.
  </Card>
  <Card title="Configuration et config" icon="sliders" href="/fr/plugins/sdk-setup">
    Empaquetage, manifestes et schémas de configuration.
  </Card>
  <Card title="Tests" icon="vial" href="/fr/plugins/sdk-testing">
    Utilitaires de test et règles de lint.
  </Card>
  <Card title="Migration SDK" icon="arrows-turn-right" href="/fr/plugins/sdk-migration">
    Migration depuis les surfaces obsolètes.
  </Card>
  <Card title="Internes des plugins" icon="diagram-project" href="/fr/plugins/architecture">
    Architecture approfondie et modèle de capacités.
  </Card>
</CardGroup>
