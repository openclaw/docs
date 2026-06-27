---
read_when:
    - Vous devez savoir depuis quel sous-chemin du SDK importer
    - Vous voulez une référence pour toutes les méthodes d’inscription sur OpenClawPluginApi
    - Vous recherchez une exportation spécifique du SDK
sidebarTitle: Plugin SDK overview
summary: Carte d’importation, référence de l’API d’enregistrement et architecture du SDK
title: Aperçu du SDK de Plugin
x-i18n:
    generated_at: "2026-06-27T17:58:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 69321b569f7609c6ee9312f0234ce94f274bf03822df61988f34e1effb55339e
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Le SDK Plugin est le contrat typé entre les plugins et le cœur. Cette page est la
référence pour **ce qu’il faut importer** et **ce que vous pouvez enregistrer**.

<Note>
  Cette page s’adresse aux auteurs de plugins qui utilisent `openclaw/plugin-sdk/*` dans
  OpenClaw. Pour les applications externes, scripts, tableaux de bord, tâches CI et extensions d’IDE
  qui veulent exécuter des agents via le Gateway, utilisez plutôt
  [Intégrations Gateway pour applications externes](/fr/gateway/external-apps).
</Note>

<Tip>
Vous cherchez plutôt un guide pratique ? Commencez par [Créer des plugins](/fr/plugins/building-plugins), utilisez [Plugins de canal](/fr/plugins/sdk-channel-plugins) pour les plugins de canal, [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins) pour les plugins de fournisseur, [Plugins de backend CLI](/fr/plugins/cli-backend-plugins) pour les backends CLI d’IA locaux, et [Hooks de Plugin](/fr/plugins/hooks) pour les plugins de hook d’outil ou de cycle de vie.
</Tip>

## Convention d’importation

Importez toujours depuis un sous-chemin spécifique :

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Chaque sous-chemin est un petit module autonome. Cela permet de garder un démarrage rapide et
d’éviter les problèmes de dépendances circulaires. Pour les helpers d’entrée/de construction propres aux canaux,
préférez `openclaw/plugin-sdk/channel-core`; réservez `openclaw/plugin-sdk/core` à
la surface globale plus large et aux helpers partagés tels que
`buildChannelConfigSchema`.

Pour la configuration de canal, publiez le schéma JSON détenu par le canal via
`openclaw.plugin.json#channelConfigs`. Le sous-chemin `plugin-sdk/channel-config-schema`
sert aux primitives de schéma partagées et au générateur générique. Les
plugins intégrés d’OpenClaw utilisent `plugin-sdk/bundled-channel-config-schema` pour conserver
les schémas de canaux intégrés. Les exports de compatibilité obsolètes restent sur
`plugin-sdk/channel-config-schema-legacy`; aucun des sous-chemins de schéma intégré n’est un
modèle pour les nouveaux plugins.

<Warning>
  N’importez pas de surfaces de commodité marquées fournisseur ou canal (par exemple
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Les plugins intégrés composent les sous-chemins génériques du SDK dans leurs propres barrels
  `api.ts` / `runtime-api.ts`; les consommateurs du cœur doivent soit utiliser ces barrels locaux au plugin,
  soit ajouter un contrat SDK générique étroit lorsqu’un besoin est réellement
  transversal aux canaux.

Un petit ensemble de surfaces d’aide pour plugins intégrés apparaît encore dans la carte d’exports générée
lorsqu’elles ont un usage propriétaire suivi. Elles existent uniquement pour la maintenance des plugins intégrés
et ne sont pas des chemins d’importation recommandés pour les nouveaux plugins tiers.

`openclaw/plugin-sdk/discord` et `openclaw/plugin-sdk/telegram-account` sont
également conservés comme façades de compatibilité obsolètes pour les usages propriétaires suivis. Ne
copiez pas ces chemins d’importation dans de nouveaux plugins ; utilisez plutôt les helpers runtime injectés et
les sous-chemins génériques du SDK de canal.
</Warning>

## Référence des sous-chemins

Le SDK Plugin est exposé sous forme d’un ensemble de sous-chemins étroits regroupés par domaine (entrée de plugin,
canal, fournisseur, auth, runtime, capacité, mémoire et helpers réservés aux
plugins intégrés). Pour le catalogue complet — regroupé et lié — consultez
[Sous-chemins du SDK Plugin](/fr/plugins/sdk-subpaths).

L’inventaire des points d’entrée du compilateur se trouve dans
`scripts/lib/plugin-sdk-entrypoints.json`; les exports de package sont générés à partir
du sous-ensemble public après soustraction des sous-chemins de test/internes propres au dépôt listés dans
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Exécutez
`pnpm plugin-sdk:surface` pour auditer le nombre d’exports publics. Les sous-chemins publics obsolètes
assez anciens et inutilisés par le code de production des extensions intégrées sont
suivis dans `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; les larges
barrels de ré-exportation obsolètes sont suivis dans
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## API d’enregistrement

Le callback `register(api)` reçoit un objet `OpenClawPluginApi` avec ces
méthodes :

### Enregistrement des capacités

| Méthode                                          | Ce qu’elle enregistre                   |
| ------------------------------------------------ | --------------------------------------- |
| `api.registerProvider(...)`                      | Inférence textuelle (LLM)               |
| `api.registerAgentHarness(...)`                  | Exécuteur d’agent bas niveau expérimental |
| `api.registerCliBackend(...)`                    | Backend d’inférence CLI local           |
| `api.registerChannel(...)`                       | Canal de messagerie                     |
| `api.registerEmbeddingProvider(...)`             | Fournisseur réutilisable d’embeddings vectoriels |
| `api.registerSpeechProvider(...)`                | Synthèse texte-parole / STT             |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcription temps réel en streaming   |
| `api.registerRealtimeVoiceProvider(...)`         | Sessions vocales temps réel duplex      |
| `api.registerMediaUnderstandingProvider(...)`    | Analyse d’images/audio/vidéo            |
| `api.registerImageGenerationProvider(...)`       | Génération d’images                     |
| `api.registerMusicGenerationProvider(...)`       | Génération de musique                   |
| `api.registerVideoGenerationProvider(...)`       | Génération de vidéo                     |
| `api.registerWebFetchProvider(...)`              | Fournisseur de récupération / extraction Web |
| `api.registerWebSearchProvider(...)`             | Recherche Web                           |

Les fournisseurs d’embeddings enregistrés avec `api.registerEmbeddingProvider(...)` doivent
également être listés dans `contracts.embeddingProviders` dans le manifeste du plugin. Il
s’agit de la surface générique d’embedding pour la génération vectorielle réutilisable. La recherche mémoire
peut consommer cette surface de fournisseur générique. L’ancienne surface
`api.registerMemoryEmbeddingProvider(...)` et
`contracts.memoryEmbeddingProviders` est une compatibilité obsolète pendant que
les fournisseurs propres à la mémoire existants migrent.

Les fournisseurs propres à la mémoire qui exposent encore un `batchEmbed(...)` runtime restent sur
le contrat de traitement par lots par fichier existant, sauf si leur runtime définit explicitement
`sourceWideBatchEmbed: true`. Cette option permet à l’hôte mémoire de soumettre des fragments issus de
plusieurs fichiers mémoire modifiés et sources activées dans un seul appel `batchEmbed(...)`, jusqu’aux
limites de lot de l’hôte. Les adaptateurs de lot qui téléversent des fichiers de requêtes JSONL doivent
également fractionner les tâches fournisseur avant leur plafond de taille de téléversement ainsi que leur plafond de nombre de requêtes.
Le fournisseur doit renvoyer un embedding par fragment d’entrée dans le même ordre que
`batch.chunks`; omettez l’indicateur lorsque le fournisseur attend des lots locaux au fichier ou
ne peut pas préserver l’ordre des entrées dans une tâche plus large à l’échelle de la source.

### Outils et commandes

Utilisez [`defineToolPlugin`](/fr/plugins/tool-plugins) pour les plugins simples limités aux outils
avec des noms d’outils fixes. Utilisez directement `api.registerTool(...)` pour les plugins mixtes
ou l’enregistrement d’outils entièrement dynamique.

| Méthode                         | Ce qu’elle enregistre                         |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Outil d’agent (obligatoire ou `{ optional: true }`) |
| `api.registerCommand(def)`      | Commande personnalisée (contourne le LLM)     |

Les commandes de plugin peuvent définir `agentPromptGuidance` lorsque l’agent a besoin d’un bref
indice de routage détenu par la commande. Gardez ce texte centré sur la commande elle-même ; n’ajoutez pas
de politique propre au fournisseur ou au plugin dans les générateurs de prompts du cœur.

Les entrées de guidage peuvent être des chaînes héritées, qui s’appliquent à chaque surface de prompt, ou
des entrées structurées :

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

Les `surfaces` structurées peuvent inclure `openclaw_main`, `codex_app_server`,
`cli_backend`, `acp_backend` ou `subagent`. `pi_main` reste un alias obsolète
de `openclaw_main`. Omettez `surfaces` pour un guidage volontairement appliqué à toutes les surfaces. Ne
passez pas un tableau `surfaces` vide ; il est rejeté afin qu’une perte de portée accidentelle ne
devienne pas du texte de prompt global.

Les instructions développeur natives du serveur d’app Codex sont plus strictes que les autres surfaces de prompt :
seul le guidage explicitement limité à `codex_app_server` est promu dans
ce chemin de priorité supérieure. Le guidage hérité sous forme de chaîne et le guidage structuré sans portée
restent disponibles pour les surfaces de prompt non-Codex pour compatibilité.

### Infrastructure

| Méthode                                        | Ce qu’elle enregistre                         |
| ---------------------------------------------- | --------------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook d’événement                              |
| `api.registerHttpRoute(params)`                | Point de terminaison HTTP Gateway             |
| `api.registerGatewayMethod(name, handler)`     | Méthode RPC Gateway                           |
| `api.registerGatewayDiscoveryService(service)` | Annonceur de découverte Gateway local         |
| `api.registerCli(registrar, opts?)`            | Sous-commande CLI                             |
| `api.registerNodeCliFeature(registrar, opts?)` | Fonctionnalité CLI Node sous `openclaw nodes` |
| `api.registerService(service)`                 | Service d’arrière-plan                        |
| `api.registerInteractiveHandler(registration)` | Gestionnaire interactif                       |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware runtime de résultat d’outil        |
| `api.registerMemoryPromptSupplement(builder)`  | Section de prompt additive adjacente à la mémoire |
| `api.registerMemoryCorpusSupplement(adapter)`  | Corpus additif de recherche/lecture mémoire   |

### Hooks hôtes pour plugins de workflow

Les hooks hôtes sont les surfaces SDK pour les plugins qui doivent participer au cycle de vie
de l’hôte plutôt que seulement ajouter un fournisseur, un canal ou un outil. Ce sont
des contrats génériques ; le Mode Plan peut les utiliser, mais aussi les workflows d’approbation,
les garde-fous de politique d’espace de travail, les moniteurs d’arrière-plan, les assistants de configuration et les plugins
compagnons d’interface utilisateur.

| Méthode                                                                             | Contrat qu’elle possède                                                                                                                |
| ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                   | État de session détenu par le Plugin, compatible JSON, projeté via les sessions Gateway                                                 |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                | Contexte durable exactement une fois injecté dans le prochain tour d’agent pour une session                                             |
| `api.registerTrustedToolPolicy(...)`                                                | Politique d’outil de confiance pré-Plugin contrôlée par le manifeste, pouvant bloquer ou réécrire les paramètres d’outil                |
| `api.registerToolMetadata(...)`                                                     | Métadonnées d’affichage du catalogue d’outils sans modification de l’implémentation de l’outil                                          |
| `api.registerCommand(...)`                                                          | Commandes de Plugin limitées au périmètre ; les résultats de commande peuvent définir `continueAgent: true` ; les commandes natives Discord prennent en charge `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                             | Descripteurs de contribution de l’interface Control UI pour les surfaces de session, d’outil, d’exécution ou de paramètres              |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                       | Rappels de nettoyage pour les ressources d’exécution détenues par le Plugin sur les chemins de réinitialisation/suppression/rechargement |
| `api.agent.events.registerAgentEventSubscription(...)`                              | Abonnements aux événements nettoyés pour l’état de workflow et les moniteurs                                                            |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | État de travail temporaire du Plugin par exécution, effacé lors du cycle de vie terminal de l’exécution                                 |
| `api.session.workflow.registerSessionSchedulerJob(...)`                             | Métadonnées de nettoyage pour les tâches planifiées détenues par le Plugin ; ne planifie pas de travail et ne crée pas d’enregistrements de tâche |
| `api.session.workflow.sendSessionAttachment(...)`                                   | Livraison de pièces jointes de fichier médiée par l’hôte, réservée aux Plugins groupés, vers la route de session active en sortie directe |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Tours de session planifiés adossés à Cron, réservés aux Plugins groupés, avec nettoyage par balise                                     |
| `api.session.controls.registerSessionAction(...)`                                   | Actions de session typées que les clients peuvent envoyer via le Gateway                                                               |

Utilisez les espaces de noms groupés pour le nouveau code de Plugin :

- `api.session.state.registerSessionExtension(...)`
- `api.session.workflow.enqueueNextTurnInjection(...)`
- `api.session.workflow.registerSessionSchedulerJob(...)`
- `api.session.workflow.sendSessionAttachment(...)`
- `api.session.workflow.scheduleSessionTurn(...)`
- `api.session.workflow.unscheduleSessionTurnsByTag(...)`
- `api.session.controls.registerSessionAction(...)`
- `api.session.controls.registerControlUiDescriptor(...)`
- `api.agent.events.registerAgentEventSubscription(...)`
- `api.agent.events.emitAgentEvent(...)`
- `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`
- `api.lifecycle.registerRuntimeLifecycle(...)`

Les méthodes plates équivalentes restent disponibles comme alias de compatibilité
obsolètes pour les Plugins existants. N’ajoutez pas de nouveau code de Plugin qui appelle
directement `api.registerSessionExtension`, `api.enqueueNextTurnInjection`,
`api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`,
`api.registerAgentEventSubscription`, `api.emitAgentEvent`,
`api.setRunContext`, `api.getRunContext`, `api.clearRunContext`,
`api.registerSessionSchedulerJob`, `api.registerSessionAction`,
`api.sendSessionAttachment`, `api.scheduleSessionTurn` ou
`api.unscheduleSessionTurnsByTag`.

`scheduleSessionTurn(...)` est une commodité limitée à la session au-dessus du planificateur
Cron du Gateway. Cron possède le timing et crée l’enregistrement de tâche d’arrière-plan quand le
tour s’exécute ; le Plugin SDK ne contraint que la session cible, la
nomination détenue par le Plugin et le nettoyage. Utilisez `api.runtime.tasks.managedFlows` dans le tour
planifié lorsque le travail lui-même nécessite un état Task Flow durable en plusieurs étapes.

Les contrats séparent intentionnellement les autorités :

- Les Plugins externes peuvent posséder les extensions de session, les descripteurs d’interface utilisateur, les commandes, les
  métadonnées d’outil, les injections de prochain tour et les hooks normaux.
- Les politiques d’outils de confiance s’exécutent avant les hooks ordinaires `before_tool_call` et sont
  considérées comme fiables par l’hôte. Les politiques groupées s’exécutent en premier ; les politiques de Plugins installés nécessitent
  une activation explicite ainsi que leurs identifiants locaux dans
  `contracts.trustedToolPolicies`, puis s’exécutent selon l’ordre de chargement des Plugins. Les identifiants de politique
  sont limités au Plugin qui les enregistre.
- La propriété des commandes réservées est limitée aux Plugins groupés. Les Plugins externes doivent utiliser leurs
  propres noms de commande ou alias.
- `allowPromptInjection=false` désactive les hooks qui modifient le prompt, notamment
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  les champs de prompt de l’ancien `before_agent_start`, et
  `enqueueNextTurnInjection`.

Exemples de consommateurs hors Plan :

| Archétype de Plugin              | Hooks utilisés                                                                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Workflow d’approbation           | Extension de session, continuation de commande, injection de prochain tour, descripteur d’interface utilisateur                        |
| Garde de politique budget/espace de travail | Politique d’outil de confiance, métadonnées d’outil, projection de session                                                            |
| Moniteur de cycle de vie en arrière-plan | Nettoyage du cycle de vie d’exécution, abonnement aux événements d’agent, propriété/nettoyage du planificateur de session, contribution au prompt Heartbeat, descripteur d’interface utilisateur |
| Assistant de configuration ou d’intégration | Extension de session, commandes limitées au périmètre, descripteur Control UI                                                         |

<Note>
  Les espaces de noms d’administration cœur réservés (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) restent toujours `operator.admin`, même si un Plugin tente d’attribuer un
  périmètre de méthode Gateway plus étroit. Préférez des préfixes propres au Plugin pour les
  méthodes détenues par le Plugin.
</Note>

<Accordion title="Quand utiliser le middleware de résultat d’outil">
  Les Plugins groupés et les Plugins installés explicitement activés avec des
  contrats de manifeste correspondants peuvent utiliser `api.registerAgentToolResultMiddleware(...)` lorsqu’ils
  doivent réécrire un résultat d’outil après l’exécution et avant que l’exécution
  ne renvoie ce résultat au modèle. C’est le point d’extension fiable et neutre vis-à-vis de l’exécution
  pour les réducteurs de sortie asynchrones tels que tokenjuice.

Les Plugins doivent déclarer `contracts.agentToolResultMiddleware` pour chaque exécution ciblée,
par exemple `["openclaw", "codex"]`. Les Plugins installés sans ce
contrat, ou sans activation explicite, ne peuvent pas enregistrer ce middleware ; conservez
les hooks normaux de Plugin OpenClaw pour les travaux qui ne nécessitent pas un timing de résultat
d’outil avant modèle. L’ancien chemin d’enregistrement de fabrique d’extension réservé au
runner intégré a été supprimé.
</Accordion>

### Enregistrement de découverte Gateway

`api.registerGatewayDiscoveryService(...)` permet à un Plugin d’annoncer le
Gateway actif sur un transport de découverte local tel que mDNS/Bonjour. OpenClaw appelle le
service au démarrage du Gateway lorsque la découverte locale est activée, transmet les
ports Gateway actuels et les données d’indication TXT non secrètes, puis appelle le gestionnaire
`stop` retourné lors de l’arrêt du Gateway.

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

Les Plugins de découverte Gateway ne doivent pas traiter les valeurs TXT annoncées comme des secrets ou
de l’authentification. La découverte est une indication de routage ; l’authentification Gateway et l’épinglage TLS
restent propriétaires de la confiance.

### Métadonnées d’enregistrement CLI

`api.registerCli(registrar, opts?)` accepte deux types de métadonnées de commande :

- `commands` : noms de commandes explicites détenus par le registraire
- `descriptors` : descripteurs de commande au moment de l’analyse utilisés pour l’aide CLI,
  le routage et l’enregistrement paresseux de CLI de Plugin
- `parentPath` : chemin de commande parent facultatif pour les groupes de commandes imbriqués, tels que
  `["nodes"]`

Pour les fonctionnalités de nœud appairé, préférez
`api.registerNodeCliFeature(registrar, opts?)`. C’est un petit wrapper autour de
`api.registerCli(..., { parentPath: ["nodes"] })` qui rend explicites les commandes telles que
`openclaw nodes canvas` comme fonctionnalités de nœud détenues par le Plugin.

Si vous voulez qu’une commande de Plugin reste chargée paresseusement dans le chemin CLI racine normal,
fournissez des `descriptors` couvrant chaque racine de commande de premier niveau exposée par ce
registraire.

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

Les commandes imbriquées reçoivent la commande parente résolue sous forme de `program` :

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerNodesCanvasCommands } = await import("./src/cli.js");
    registerNodesCanvasCommands(program);
  },
  {
    parentPath: ["nodes"],
    descriptors: [
      {
        name: "canvas",
        description: "Capture or render canvas content from a paired node",
        hasSubcommands: true,
      },
    ],
  },
);
```

Utilisez `commands` seul uniquement lorsque vous n’avez pas besoin d’enregistrement CLI racine paresseux.
Ce chemin de compatibilité empressé reste pris en charge, mais il n’installe pas
d’espaces réservés adossés à des descripteurs pour le chargement paresseux au moment de l’analyse.

### Enregistrement de backend CLI

`api.registerCliBackend(...)` permet à un Plugin de posséder la configuration par défaut d’un backend
CLI d’IA local tel que `claude-cli` ou `my-cli`.

- L’`id` du backend devient le préfixe fournisseur dans les références de modèle comme `my-cli/gpt-5`.
- La `config` du backend utilise la même forme que `agents.defaults.cliBackends.<id>`.
- La configuration utilisateur garde la priorité. OpenClaw fusionne `agents.defaults.cliBackends.<id>` par-dessus la
  valeur par défaut du Plugin avant d’exécuter la CLI.
- Utilisez `normalizeConfig` lorsqu’un backend a besoin de réécritures de compatibilité après fusion
  (par exemple pour normaliser d’anciennes formes de drapeaux).
- Utilisez `resolveExecutionArgs` pour les réécritures argv limitées à la requête qui appartiennent au
  dialecte CLI, comme le mappage des niveaux de réflexion OpenClaw vers un drapeau d’effort
  natif. Le hook reçoit `ctx.executionMode` ; utilisez `"side-question"` pour ajouter
  des drapeaux d’isolation natifs du backend pour les appels éphémères `/btw`. Si ces drapeaux
  désactivent de manière fiable les outils natifs pour une CLI autrement toujours active, déclarez
  aussi `sideQuestionToolMode: "disabled"`.

Pour un guide de création de bout en bout, consultez
[Plugins de backend CLI](/fr/plugins/cli-backend-plugins).

### Emplacements exclusifs

| Méthode                                   | Ce qu’elle enregistre                                                                                                                                                                                        |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`  | Moteur de contexte (un seul actif à la fois). Les rappels de cycle de vie reçoivent `runtimeSettings` lorsque l’hôte peut fournir des diagnostics de modèle/fournisseur/mode ; les anciens moteurs stricts sont réessayés sans cette clé. |
| `api.registerMemoryCapability(capability)` | Capacité de mémoire unifiée                                                                                                                                                                                  |
| `api.registerMemoryPromptSection(builder)` | Générateur de section de prompt mémoire                                                                                                                                                                      |
| `api.registerMemoryFlushPlan(resolver)`   | Résolveur de plan de vidage de mémoire                                                                                                                                                                       |
| `api.registerMemoryRuntime(runtime)`      | Adaptateur d’exécution mémoire                                                                                                                                                                               |

### Adaptateurs d’embeddings mémoire obsolètes

| Méthode                                      | Ce qu’elle enregistre                              |
| -------------------------------------------- | -------------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptateur d’embeddings mémoire pour le Plugin actif |

- `registerMemoryCapability` est l’API de Plugin mémoire exclusive recommandée.
- `registerMemoryCapability` peut aussi exposer `publicArtifacts.listArtifacts(...)`
  afin que les Plugins compagnons puissent consommer les artefacts mémoire exportés via
  `openclaw/plugin-sdk/memory-host-core` au lieu d’accéder à la structure privée d’un
  Plugin mémoire spécifique.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` et
  `registerMemoryRuntime` sont des API de Plugin mémoire exclusives compatibles avec l’héritage.
- `MemoryFlushPlan.model` peut épingler le tour de vidage à une référence
  `provider/model` exacte, comme `ollama/qwen3:8b`, sans hériter de la chaîne
  de fallback active.
- `registerMemoryEmbeddingProvider` est obsolète. Les nouveaux fournisseurs d’embeddings
  doivent utiliser `api.registerEmbeddingProvider(...)` et
  `contracts.embeddingProviders`.
- Les fournisseurs propres à la mémoire existants continuent de fonctionner pendant la
  fenêtre de migration, mais l’inspection des Plugins signale cela comme une dette de compatibilité pour
  les Plugins non intégrés.

### Événements et cycle de vie

| Méthode                                     | Ce qu’elle fait                  |
| ------------------------------------------ | -------------------------------- |
| `api.on(hookName, handler, opts?)`         | Hook de cycle de vie typé        |
| `api.onConversationBindingResolved(handler)` | Rappel de liaison de conversation |

Voir [Hooks de Plugin](/fr/plugins/hooks) pour des exemples, les noms de hooks courants et la
sémantique des gardes.

### Sémantique de décision des hooks

`before_install` est un hook de cycle de vie d’exécution de Plugin, pas la surface de politique
d’installation de l’opérateur. Utilisez `security.installPolicy` lorsqu’une décision d’autorisation/blocage doit
couvrir les chemins d’installation ou de mise à jour pris en charge par la CLI et le Gateway.

- `before_tool_call` : renvoyer `{ block: true }` est terminal. Dès qu’un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `before_tool_call` : renvoyer `{ block: false }` est traité comme une absence de décision (comme omettre `block`), pas comme un remplacement.
- `before_install` : renvoyer `{ block: true }` est terminal. Dès qu’un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `before_install` : renvoyer `{ block: false }` est traité comme une absence de décision (comme omettre `block`), pas comme un remplacement.
- `reply_dispatch` : renvoyer `{ handled: true, ... }` est terminal. Dès qu’un gestionnaire revendique l’envoi, les gestionnaires de priorité inférieure et le chemin d’envoi de modèle par défaut sont ignorés.
- `message_sending` : renvoyer `{ cancel: true }` est terminal. Dès qu’un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `message_sending` : renvoyer `{ cancel: false }` est traité comme une absence de décision (comme omettre `cancel`), pas comme un remplacement.
- `message_received` : utilisez le champ typé `threadId` lorsque vous avez besoin du routage entrant de fil/sujet. Gardez `metadata` pour les extras propres au canal.
- `message_sending` : utilisez les champs de routage typés `replyToId` / `threadId` avant de recourir aux `metadata` propres au canal.
- `gateway_start` : utilisez `ctx.config`, `ctx.workspaceDir` et `ctx.getCron?.()` pour l’état de démarrage détenu par le Gateway au lieu de dépendre des hooks internes `gateway:startup`.
- `cron_changed` : observez les changements de cycle de vie Cron détenus par le Gateway. Utilisez `event.job?.state?.nextRunAtMs` et `ctx.getCron?.()` lors de la synchronisation de planificateurs de réveil externes, et gardez OpenClaw comme source de vérité pour les vérifications d’échéance et l’exécution.

### Champs de l’objet API

| Champ                    | Type                      | Description                                                                                  |
| ------------------------ | ------------------------- | -------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Id de Plugin                                                                                 |
| `api.name`               | `string`                  | Nom d’affichage                                                                              |
| `api.version`            | `string?`                 | Version du Plugin (facultatif)                                                              |
| `api.description`        | `string?`                 | Description du Plugin (facultatif)                                                          |
| `api.source`             | `string`                  | Chemin source du Plugin                                                                      |
| `api.rootDir`            | `string?`                 | Répertoire racine du Plugin (facultatif)                                                     |
| `api.config`             | `OpenClawConfig`          | Instantané de configuration actuel (instantané d’exécution en mémoire actif lorsqu’il est disponible) |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuration propre au Plugin provenant de `plugins.entries.<id>.config`                    |
| `api.runtime`            | `PluginRuntime`           | [Assistants d’exécution](/fr/plugins/sdk-runtime)                                               |
| `api.logger`             | `PluginLogger`            | Journaliseur délimité (`debug`, `info`, `warn`, `error`)                                     |
| `api.registrationMode`   | `PluginRegistrationMode`  | Mode de chargement actuel ; `"setup-runtime"` est la fenêtre légère de démarrage/configuration avant l’entrée complète |
| `api.resolvePath(input)` | `(string) => string`      | Résoudre le chemin relatif à la racine du Plugin                                             |

## Convention de module interne

Dans votre Plugin, utilisez des fichiers barrel locaux pour les imports internes :

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  N’importez jamais votre propre Plugin via `openclaw/plugin-sdk/<your-plugin>`
  depuis le code de production. Faites passer les imports internes par `./api.ts` ou
  `./runtime-api.ts`. Le chemin SDK est uniquement le contrat externe.
</Warning>

Les surfaces publiques des Plugins intégrés chargés par façade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` et les fichiers d’entrée publics similaires) privilégient
l’instantané de configuration d’exécution actif lorsqu’OpenClaw est déjà en cours d’exécution. Si aucun
instantané d’exécution n’existe encore, elles se replient sur le fichier de configuration résolu sur disque.
Les façades de Plugins intégrés empaquetés doivent être chargées via les chargeurs de façade de Plugin
d’OpenClaw ; les imports directs depuis `dist/extensions/...` contournent les vérifications du manifeste
et du sidecar d’exécution que les installations empaquetées utilisent pour le code détenu par le Plugin.

Les Plugins fournisseurs peuvent exposer un barrel de contrat étroit local au Plugin lorsqu’un
assistant est intentionnellement propre au fournisseur et n’a pas encore sa place dans un sous-chemin SDK
générique. Exemples intégrés :

- **Anthropic** : jointure publique `api.ts` / `contract-api.ts` pour les assistants
  d’en-tête bêta Claude et de flux `service_tier`.
- **`@openclaw/openai-provider`** : `api.ts` exporte les générateurs de fournisseurs,
  les assistants de modèle par défaut et les générateurs de fournisseurs temps réel.
- **`@openclaw/openrouter-provider`** : `api.ts` exporte le générateur de fournisseur
  ainsi que les assistants d’onboarding/configuration.

<Warning>
  Le code de production d’extension doit aussi éviter les imports
  `openclaw/plugin-sdk/<other-plugin>`. Si un assistant est réellement partagé, promouvez-le vers un sous-chemin SDK neutre
  comme `openclaw/plugin-sdk/speech`, `.../provider-model-shared` ou une autre
  surface orientée capacité au lieu de coupler deux Plugins.
</Warning>

## Connexe

<CardGroup cols={2}>
  <Card title="Points d’entrée" icon="door-open" href="/fr/plugins/sdk-entrypoints">
    Options de `definePluginEntry` et `defineChannelPluginEntry`.
  </Card>
  <Card title="Assistants d’exécution" icon="gears" href="/fr/plugins/sdk-runtime">
    Référence complète de l’espace de noms `api.runtime`.
  </Card>
  <Card title="Configuration et config" icon="sliders" href="/fr/plugins/sdk-setup">
    Empaquetage, manifestes et schémas de configuration.
  </Card>
  <Card title="Tests" icon="vial" href="/fr/plugins/sdk-testing">
    Utilitaires de test et règles de lint.
  </Card>
  <Card title="Migration du SDK" icon="arrows-turn-right" href="/fr/plugins/sdk-migration">
    Migration depuis les surfaces obsolètes.
  </Card>
  <Card title="Internes des Plugins" icon="diagram-project" href="/fr/plugins/architecture">
    Architecture approfondie et modèle de capacités.
  </Card>
</CardGroup>
