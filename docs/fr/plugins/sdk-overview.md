---
read_when:
    - Vous devez savoir à partir de quel sous-chemin du SDK importer
    - Vous voulez une référence pour toutes les méthodes d’enregistrement sur OpenClawPluginApi
    - Vous recherchez une exportation spécifique du SDK
sidebarTitle: Plugin SDK overview
summary: Référence de l’import map, de l’API d’inscription et de l’architecture du SDK
title: Présentation du SDK de Plugin
x-i18n:
    generated_at: "2026-07-01T18:10:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c7df77e34db9b780ee0747a0f2178861624f528d9f7aec8592d6954a96869e96
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Le SDK de plugin est le contrat typé entre les plugins et le noyau. Cette page est la
référence pour **ce qu’il faut importer** et **ce que vous pouvez enregistrer**.

<Note>
  Cette page s’adresse aux auteurs de plugins qui utilisent `openclaw/plugin-sdk/*` dans
  OpenClaw. Pour les applications externes, scripts, tableaux de bord, tâches CI et extensions IDE
  qui veulent exécuter des agents via le Gateway, utilisez plutôt
  [Intégrations Gateway pour les applications externes](/fr/gateway/external-apps).
</Note>

<Tip>
Vous cherchez plutôt un guide pratique ? Commencez par [Créer des plugins](/fr/plugins/building-plugins), utilisez [Plugins de canal](/fr/plugins/sdk-channel-plugins) pour les plugins de canal, [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins) pour les plugins de fournisseur, [Plugins de backend CLI](/fr/plugins/cli-backend-plugins) pour les backends CLI d’IA locaux, et [Hooks de plugin](/fr/plugins/hooks) pour les plugins de hooks d’outil ou de cycle de vie.
</Tip>

## Convention d’importation

Importez toujours depuis un sous-chemin spécifique :

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Chaque sous-chemin est un petit module autonome. Cela garde le démarrage rapide et
évite les problèmes de dépendances circulaires. Pour les helpers d’entrée/de construction propres aux canaux,
préférez `openclaw/plugin-sdk/channel-core` ; réservez `openclaw/plugin-sdk/core` à
la surface d’ensemble plus large et aux helpers partagés tels que
`buildChannelConfigSchema`.

Pour la configuration de canal, publiez le schéma JSON détenu par le canal via
`openclaw.plugin.json#channelConfigs`. Le sous-chemin `plugin-sdk/channel-config-schema`
sert aux primitives de schéma partagées et au constructeur générique. Les
plugins intégrés d’OpenClaw utilisent `plugin-sdk/bundled-channel-config-schema` pour les schémas
de canaux intégrés conservés. Les exports de compatibilité obsolètes restent sur
`plugin-sdk/channel-config-schema-legacy` ; aucun des sous-chemins de schéma intégré n’est un
modèle pour les nouveaux plugins.

<Warning>
  N’importez pas de coutures de commodité marquées fournisseur ou canal (par exemple
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Les plugins intégrés composent des sous-chemins SDK génériques dans leurs propres barrels `api.ts` /
  `runtime-api.ts` ; les consommateurs du noyau doivent soit utiliser ces barrels locaux au plugin,
  soit ajouter un contrat SDK générique étroit lorsqu’un besoin est réellement
  transverse aux canaux.

Un petit ensemble de coutures helper de plugins intégrés apparaît encore dans la carte d’exports générée
lorsqu’elles ont un usage propriétaire suivi. Elles existent uniquement pour la maintenance des plugins intégrés
et ne sont pas des chemins d’importation recommandés pour les nouveaux plugins tiers.

`openclaw/plugin-sdk/discord` et `openclaw/plugin-sdk/telegram-account` sont
également conservés comme façades de compatibilité obsolètes pour des usages propriétaires suivis. Ne
copiez pas ces chemins d’importation dans de nouveaux plugins ; utilisez plutôt les helpers de runtime injectés et
les sous-chemins SDK de canal génériques.
</Warning>

## Référence des sous-chemins

Le SDK de plugin est exposé comme un ensemble de sous-chemins étroits regroupés par domaine (entrée de plugin,
canal, fournisseur, auth, runtime, capacité, mémoire et helpers réservés aux plugins intégrés).
Pour le catalogue complet — regroupé et lié — consultez
[Sous-chemins du SDK de plugin](/fr/plugins/sdk-subpaths).

L’inventaire des points d’entrée du compilateur se trouve dans
`scripts/lib/plugin-sdk-entrypoints.json` ; les exports de package sont générés depuis
le sous-ensemble public après soustraction des sous-chemins de test/internes propres au dépôt listés dans
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Exécutez
`pnpm plugin-sdk:surface` pour auditer le nombre d’exports publics. Les sous-chemins publics obsolètes
assez anciens et inutilisés par le code de production des extensions intégrées sont
suivis dans `scripts/lib/plugin-sdk-deprecated-public-subpaths.json` ; les barrels larges
de réexport obsolètes sont suivis dans
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## API d’enregistrement

Le callback `register(api)` reçoit un objet `OpenClawPluginApi` avec ces
méthodes :

### Enregistrement des capacités

| Méthode                                          | Ce qu’elle enregistre                  |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Inférence de texte (LLM)              |
| `api.registerAgentHarness(...)`                  | Exécuteur d’agent bas niveau expérimental |
| `api.registerCliBackend(...)`                    | Backend d’inférence CLI local         |
| `api.registerChannel(...)`                       | Canal de messagerie                   |
| `api.registerEmbeddingProvider(...)`             | Fournisseur réutilisable d’embeddings vectoriels |
| `api.registerSpeechProvider(...)`                | Synthèse texte-vers-parole / STT      |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcription temps réel en streaming |
| `api.registerRealtimeVoiceProvider(...)`         | Sessions vocales temps réel duplex    |
| `api.registerMediaUnderstandingProvider(...)`    | Analyse d’images/audio/vidéos         |
| `api.registerImageGenerationProvider(...)`       | Génération d’images                   |
| `api.registerMusicGenerationProvider(...)`       | Génération de musique                 |
| `api.registerVideoGenerationProvider(...)`       | Génération de vidéo                   |
| `api.registerWebFetchProvider(...)`              | Fournisseur de récupération / extraction web |
| `api.registerWebSearchProvider(...)`             | Recherche web                         |

Les fournisseurs d’embeddings enregistrés avec `api.registerEmbeddingProvider(...)` doivent
également être listés dans `contracts.embeddingProviders` dans le manifeste du plugin. C’est
la surface d’embeddings générique pour la génération vectorielle réutilisable. La recherche mémoire
peut consommer cette surface de fournisseur générique. L’ancienne couture
`api.registerMemoryEmbeddingProvider(...)` et
`contracts.memoryEmbeddingProviders` est une compatibilité obsolète pendant la migration
des fournisseurs existants propres à la mémoire.

Les fournisseurs propres à la mémoire qui exposent encore un runtime `batchEmbed(...)` restent sur
le contrat existant de traitement par lots par fichier, sauf si leur runtime définit explicitement
`sourceWideBatchEmbed: true`. Cette option permet à l’hôte mémoire de soumettre des fragments provenant
de plusieurs fichiers mémoire modifiés et sources activées dans un seul appel `batchEmbed(...)`
jusqu’aux limites de lot de l’hôte. Les adaptateurs de lot qui téléversent des fichiers de requêtes JSONL doivent
diviser les tâches fournisseur avant leur plafond de taille de téléversement ainsi que leur plafond de nombre de requêtes.
Le fournisseur doit renvoyer un embedding par fragment d’entrée dans le même ordre que
`batch.chunks` ; omettez l’indicateur lorsque le fournisseur attend des lots locaux au fichier ou
ne peut pas préserver l’ordre des entrées dans une tâche plus large à l’échelle de la source.

### Outils et commandes

Utilisez [`defineToolPlugin`](/fr/plugins/tool-plugins) pour les plugins simples uniquement composés d’outils
avec des noms d’outils fixes. Utilisez directement `api.registerTool(...)` pour les plugins mixtes
ou l’enregistrement d’outils entièrement dynamique.

| Méthode                         | Ce qu’elle enregistre                         |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Outil d’agent (obligatoire ou `{ optional: true }`) |
| `api.registerCommand(def)`      | Commande personnalisée (contourne le LLM)     |

Les commandes de plugin peuvent définir `agentPromptGuidance` lorsque l’agent a besoin d’un court
indice de routage détenu par la commande. Gardez ce texte centré sur la commande elle-même ; n’ajoutez pas
de politique propre au fournisseur ou au plugin aux constructeurs de prompts du noyau.

Les entrées de guidage peuvent être des chaînes héritées, qui s’appliquent à toutes les surfaces de prompt, ou
des entrées structurées :

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

Les `surfaces` structurées peuvent inclure `openclaw_main`, `codex_app_server`,
`cli_backend`, `acp_backend` ou `subagent`. `pi_main` reste un alias obsolète
de `openclaw_main`. Omettez `surfaces` pour un guidage volontairement valable sur toutes les surfaces. Ne
passez pas de tableau `surfaces` vide ; il est rejeté afin qu’une perte accidentelle de portée ne
devienne pas du texte de prompt global.

Les instructions développeur natives du serveur d’application Codex sont plus strictes que les autres surfaces de prompt :
seul le guidage explicitement limité à `codex_app_server` est promu dans
cette voie à priorité plus élevée. Le guidage hérité sous forme de chaîne et le guidage structuré
sans portée restent disponibles pour les surfaces de prompt non Codex par compatibilité.

### Infrastructure

| Méthode                                        | Ce qu’elle enregistre                   |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook d’événement                        |
| `api.registerHttpRoute(params)`                | Point de terminaison HTTP du Gateway    |
| `api.registerGatewayMethod(name, handler)`     | Méthode RPC du Gateway                  |
| `api.registerGatewayDiscoveryService(service)` | Annonceur de découverte Gateway locale  |
| `api.registerCli(registrar, opts?)`            | Sous-commande CLI                       |
| `api.registerNodeCliFeature(registrar, opts?)` | Fonctionnalité CLI Node sous `openclaw nodes` |
| `api.registerService(service)`                 | Service d’arrière-plan                  |
| `api.registerInteractiveHandler(registration)` | Gestionnaire interactif                 |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware runtime de résultat d’outil  |
| `api.registerMemoryPromptSupplement(builder)`  | Section de prompt additive adjacente à la mémoire |
| `api.registerMemoryCorpusSupplement(adapter)`  | Corpus additif de recherche/lecture mémoire |

### Hooks hôte pour les plugins de workflow

Les hooks hôte sont les coutures SDK pour les plugins qui doivent participer au cycle de vie
de l’hôte plutôt que seulement ajouter un fournisseur, un canal ou un outil. Ce sont
des contrats génériques ; le mode Plan peut les utiliser, mais aussi les workflows d’approbation,
les garde-fous de politique d’espace de travail, les moniteurs d’arrière-plan, les assistants de configuration et les plugins compagnons d’interface utilisateur.

| Méthode                                                                               | Contrat qu’elle possède                                                                                                                                           |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | État de session détenu par le Plugin, compatible JSON, projeté via les sessions Gateway                                                                             |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Contexte durable exactement une fois injecté dans le prochain tour d’agent pour une session                                                                             |
| `api.registerTrustedToolPolicy(...)`                                                 | Politique d’outil approuvé pré-Plugin, contrôlée par le manifeste, qui peut bloquer ou réécrire les paramètres d’outil                                                                        |
| `api.registerToolMetadata(...)`                                                      | Métadonnées d’affichage du catalogue d’outils sans modifier l’implémentation de l’outil                                                                                     |
| `api.registerCommand(...)`                                                           | Commandes de Plugin à portée définie ; les résultats de commande peuvent définir `continueAgent: true` ou `suppressReply: true` ; les commandes natives Discord prennent en charge `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Descripteurs de contribution de l’interface de contrôle pour les surfaces de session, d’outil, d’exécution ou de paramètres                                                                           |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Callbacks de nettoyage pour les ressources d’exécution détenues par le Plugin sur les chemins de réinitialisation/suppression/rechargement                                                                          |
| `api.agent.events.registerAgentEventSubscription(...)`                               | Abonnements à des événements assainis pour l’état du workflow et les moniteurs                                                                                              |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | État de travail temporaire du Plugin par exécution, effacé lors du cycle de vie terminal de l’exécution                                                                                             |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Métadonnées de nettoyage pour les tâches planifiées détenues par le Plugin ; ne planifie pas de travail et ne crée pas d’enregistrements de tâche                                                            |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Livraison de pièce jointe fichier, réservée aux modules intégrés et médiée par l’hôte, vers la route de session directe sortante active                                                            |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Tours de session planifiés adossés à Cron, réservés aux modules intégrés, plus nettoyage par balise                                                                                    |
| `api.session.controls.registerSessionAction(...)`                                    | Actions de session typées que les clients peuvent distribuer via le Gateway                                                                                             |

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
obsolètes pour les plugins existants. N’ajoutez pas de nouveau code de Plugin qui appelle
`api.registerSessionExtension`, `api.enqueueNextTurnInjection`,
`api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`,
`api.registerAgentEventSubscription`, `api.emitAgentEvent`,
`api.setRunContext`, `api.getRunContext`, `api.clearRunContext`,
`api.registerSessionSchedulerJob`, `api.registerSessionAction`,
`api.sendSessionAttachment`, `api.scheduleSessionTurn` ou
`api.unscheduleSessionTurnsByTag` directement.

`scheduleSessionTurn(...)` est un raccourci limité à une session au-dessus du planificateur
Cron du Gateway. Cron possède la temporalité et crée l’enregistrement de tâche en arrière-plan lorsque le
tour s’exécute ; le SDK Plugin limite uniquement la session cible, la
nomination détenue par le Plugin et le nettoyage. Utilisez `api.runtime.tasks.managedFlows` dans le tour planifié
lorsque le travail lui-même nécessite un état durable de Task Flow en plusieurs étapes.

Les contrats séparent volontairement les autorités :

- Les plugins externes peuvent détenir les extensions de session, les descripteurs d’interface utilisateur, les commandes, les métadonnées d’outils, les injections au tour suivant et les hooks normaux.
- Les politiques d’outils approuvés s’exécutent avant les hooks ordinaires `before_tool_call` et sont approuvées par l’hôte. Les politiques intégrées s’exécutent en premier ; les politiques des plugins installés nécessitent
  une activation explicite plus leurs identifiants locaux dans
  `contracts.trustedToolPolicies`, puis s’exécutent ensuite dans l’ordre de chargement des plugins. Les identifiants de politique
  sont limités au Plugin qui les enregistre.
- La propriété des commandes réservées est réservée aux modules intégrés. Les plugins externes doivent utiliser leurs
  propres noms de commande ou alias.
- `allowPromptInjection=false` désactive les hooks qui modifient le prompt, notamment
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  les champs de prompt de l’ancien `before_agent_start`, et
  `enqueueNextTurnInjection`.

Exemples de consommateurs non-Plan :

| Archétype de Plugin             | Hooks utilisés                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Workflow d’approbation            | Extension de session, continuation de commande, injection au tour suivant, descripteur d’interface utilisateur                                                            |
| Barrière de politique de budget/espace de travail | Politique d’outil approuvé, métadonnées d’outil, projection de session                                                                                 |
| Moniteur de cycle de vie en arrière-plan | Nettoyage du cycle de vie d’exécution, abonnement aux événements d’agent, propriété/nettoyage du planificateur de session, contribution au prompt Heartbeat, descripteur d’interface utilisateur |
| Assistant de configuration ou d’onboarding   | Extension de session, commandes à portée définie, descripteur de l’interface de contrôle                                                                              |

<Note>
  Les espaces de noms d’administration du cœur réservés (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) restent toujours `operator.admin`, même si un Plugin tente d’attribuer une
  portée de méthode Gateway plus étroite. Préférez des préfixes propres au Plugin pour les
  méthodes détenues par le Plugin.
</Note>

<Accordion title="Quand utiliser le middleware de résultat d’outil">
  Les plugins intégrés et les plugins installés explicitement activés avec des
  contrats de manifeste correspondants peuvent utiliser `api.registerAgentToolResultMiddleware(...)` lorsqu’ils
  doivent réécrire un résultat d’outil après l’exécution et avant que le runtime
  ne renvoie ce résultat au modèle. C’est le point d’extension approuvé et neutre vis-à-vis du runtime
  pour les réducteurs de sortie asynchrones comme tokenjuice.

Les plugins doivent déclarer `contracts.agentToolResultMiddleware` pour chaque runtime
ciblé, par exemple `["openclaw", "codex"]`. Les plugins installés sans ce
contrat, ou sans activation explicite, ne peuvent pas enregistrer ce middleware ; conservez
les hooks de Plugin OpenClaw normaux pour le travail qui n’a pas besoin d’un timing de résultat d’outil
avant modèle. L’ancien
chemin d’enregistrement de fabrique d’extension uniquement pour l’exécuteur intégré a été supprimé.
</Accordion>

### Enregistrement de découverte Gateway

`api.registerGatewayDiscoveryService(...)` permet à un Plugin d’annoncer le Gateway actif
sur un transport de découverte local tel que mDNS/Bonjour. OpenClaw appelle le
service pendant le démarrage du Gateway lorsque la découverte locale est activée, transmet les
ports Gateway actuels et des données d’indication TXT non secrètes, et appelle le gestionnaire
`stop` renvoyé pendant l’arrêt du Gateway.

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
de l’authentification. La découverte est une indication de routage ; l’authentification Gateway et l’épinglage TLS
restent propriétaires de la confiance.

### Métadonnées d’enregistrement CLI

`api.registerCli(registrar, opts?)` accepte deux types de métadonnées de commande :

- `commands` : noms de commandes explicites détenus par le registraire
- `descriptors` : descripteurs de commandes au moment de l’analyse utilisés pour l’aide CLI,
  le routage et l’enregistrement paresseux de CLI de Plugin
- `parentPath` : chemin de commande parent facultatif pour les groupes de commandes imbriqués, comme
  `["nodes"]`

Pour les fonctionnalités de nœud appairé, préférez
`api.registerNodeCliFeature(registrar, opts?)`. C’est un petit wrapper autour de
`api.registerCli(..., { parentPath: ["nodes"] })` qui rend les commandes comme
`openclaw nodes canvas` explicitement des fonctionnalités de nœud détenues par le Plugin.

Si vous voulez qu’une commande de Plugin reste chargée paresseusement dans le chemin CLI racine normal,
fournissez des `descriptors` qui couvrent chaque racine de commande de premier niveau exposée par ce
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

Les commandes imbriquées reçoivent la commande parente résolue comme `program` :

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

Utilisez `commands` seul uniquement lorsque vous n’avez pas besoin de l’enregistrement paresseux de CLI racine.
Ce chemin de compatibilité avide reste pris en charge, mais il n’installe pas
d’espaces réservés adossés à des descripteurs pour le chargement paresseux au moment de l’analyse.

### Enregistrement du backend CLI

`api.registerCliBackend(...)` permet à un Plugin de détenir la configuration par défaut pour un backend CLI
d’IA local tel que `claude-cli` ou `my-cli`.

- Le `id` du backend devient le préfixe de fournisseur dans les références de modèle comme `my-cli/gpt-5`.
- La `config` du backend utilise la même forme que `agents.defaults.cliBackends.<id>`.
- La configuration utilisateur reste prioritaire. OpenClaw fusionne `agents.defaults.cliBackends.<id>` par-dessus la valeur par défaut du
  Plugin avant d’exécuter la CLI.
- Utilisez `normalizeConfig` lorsqu’un backend a besoin de réécritures de compatibilité après fusion
  (par exemple pour normaliser d’anciennes formes d’indicateurs).
- Utilisez `resolveExecutionArgs` pour les réécritures argv limitées à la requête qui relèvent du
  dialecte CLI, comme le mappage des niveaux de réflexion OpenClaw vers un indicateur d’effort
  natif. Le hook reçoit `ctx.executionMode`; utilisez `"side-question"` pour ajouter
  des indicateurs d’isolation natifs au backend pour les appels `/btw` éphémères. Si ces indicateurs
  désactivent de façon fiable les outils natifs pour une CLI autrement toujours active, déclarez
  aussi `sideQuestionToolMode: "disabled"`.

Pour un guide de création de bout en bout, consultez
[Plugins de backend CLI](/fr/plugins/cli-backend-plugins).

### Emplacements exclusifs

| Méthode                                    | Ce qu’elle enregistre                                                                                                                                                                                     |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Moteur de contexte (un seul actif à la fois). Les rappels de cycle de vie reçoivent `runtimeSettings` lorsque l’hôte peut fournir des diagnostics de modèle/fournisseur/mode ; les anciens moteurs stricts sont réessayés sans cette clé. |
| `api.registerMemoryCapability(capability)` | Capacité mémoire unifiée                                                                                                                                                                                  |
| `api.registerMemoryPromptSection(builder)` | Générateur de section d’invite mémoire                                                                                                                                                                    |
| `api.registerMemoryFlushPlan(resolver)`    | Résolveur de plan de vidage mémoire                                                                                                                                                                       |
| `api.registerMemoryRuntime(runtime)`       | Adaptateur d’exécution mémoire                                                                                                                                                                            |

### Adaptateurs d’embedding mémoire obsolètes

| Méthode                                        | Ce qu’elle enregistre                            |
| ---------------------------------------------- | ------------------------------------------------ |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptateur d’embedding mémoire pour le Plugin actif |

- `registerMemoryCapability` est l’API exclusive de Plugin mémoire recommandée.
- `registerMemoryCapability` peut également exposer `publicArtifacts.listArtifacts(...)`
  afin que les Plugins compagnons puissent consommer les artefacts mémoire exportés via
  `openclaw/plugin-sdk/memory-host-core` au lieu d’accéder à la structure privée d’un
  Plugin mémoire spécifique.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` et
  `registerMemoryRuntime` sont des API exclusives de Plugin mémoire compatibles avec l’existant.
- `MemoryFlushPlan.model` peut épingler le tour de vidage à une référence `provider/model`
  exacte, comme `ollama/qwen3:8b`, sans hériter de la chaîne de repli active.
- `registerMemoryEmbeddingProvider` est obsolète. Les nouveaux fournisseurs d’embeddings
  doivent utiliser `api.registerEmbeddingProvider(...)` et
  `contracts.embeddingProviders`.
- Les fournisseurs propres à la mémoire existants continuent de fonctionner pendant la fenêtre
  de migration, mais l’inspection du Plugin signale cela comme une dette de compatibilité pour
  les Plugins non groupés.

### Événements et cycle de vie

| Méthode                                      | Ce qu’elle fait                |
| -------------------------------------------- | ------------------------------ |
| `api.on(hookName, handler, opts?)`           | Hook de cycle de vie typé      |
| `api.onConversationBindingResolved(handler)` | Rappel de liaison de conversation |

Consultez [Hooks de Plugin](/fr/plugins/hooks) pour des exemples, les noms de hooks courants et la
sémantique des gardes.

### Sémantique de décision des hooks

`before_install` est un hook de cycle de vie de l’exécution du Plugin, pas la surface de politique
d’installation de l’opérateur. Utilisez `security.installPolicy` lorsqu’une décision d’autorisation/blocage doit
couvrir les chemins d’installation ou de mise à jour adossés à la CLI et au Gateway.

- `before_tool_call` : renvoyer `{ block: true }` est terminal. Dès qu’un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `before_tool_call` : renvoyer `{ block: false }` est traité comme une absence de décision (comme si `block` était omis), et non comme une substitution.
- `before_install` : renvoyer `{ block: true }` est terminal. Dès qu’un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `before_install` : renvoyer `{ block: false }` est traité comme une absence de décision (comme si `block` était omis), et non comme une substitution.
- `reply_dispatch` : renvoyer `{ handled: true, ... }` est terminal. Dès qu’un gestionnaire revendique l’envoi, les gestionnaires de priorité inférieure et le chemin d’envoi de modèle par défaut sont ignorés.
- `message_sending` : renvoyer `{ cancel: true }` est terminal. Dès qu’un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `message_sending` : renvoyer `{ cancel: false }` est traité comme une absence de décision (comme si `cancel` était omis), et non comme une substitution.
- `message_received` : utilisez le champ typé `threadId` lorsque vous avez besoin du routage entrant par fil/sujet. Conservez `metadata` pour les compléments propres au canal.
- `message_sending` : utilisez les champs de routage typés `replyToId` / `threadId` avant de vous rabattre sur les `metadata` propres au canal.
- `gateway_start` : utilisez `ctx.config`, `ctx.workspaceDir` et `ctx.getCron?.()` pour l’état de démarrage détenu par le Gateway au lieu de dépendre des hooks internes `gateway:startup`.
- `cron_changed` : observez les changements de cycle de vie Cron détenus par le Gateway. Utilisez `event.job?.state?.nextRunAtMs` et `ctx.getCron?.()` lors de la synchronisation de planificateurs de réveil externes, et conservez OpenClaw comme source de vérité pour les vérifications d’échéance et l’exécution.

### Champs de l’objet API

| Champ                    | Type                      | Description                                                                                   |
| ------------------------ | ------------------------- | --------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | ID du Plugin                                                                                  |
| `api.name`               | `string`                  | Nom d’affichage                                                                               |
| `api.version`            | `string?`                 | Version du Plugin (facultatif)                                                                |
| `api.description`        | `string?`                 | Description du Plugin (facultatif)                                                            |
| `api.source`             | `string`                  | Chemin source du Plugin                                                                       |
| `api.rootDir`            | `string?`                 | Répertoire racine du Plugin (facultatif)                                                       |
| `api.config`             | `OpenClawConfig`          | Instantané de configuration actuel (instantané d’exécution actif en mémoire lorsqu’il est disponible) |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuration propre au Plugin depuis `plugins.entries.<id>.config`                           |
| `api.runtime`            | `PluginRuntime`           | [Assistants d’exécution](/fr/plugins/sdk-runtime)                                                 |
| `api.logger`             | `PluginLogger`            | Journaliseur à portée limitée (`debug`, `info`, `warn`, `error`)                              |
| `api.registrationMode`   | `PluginRegistrationMode`  | Mode de chargement actuel ; `"setup-runtime"` est la fenêtre légère de démarrage/configuration avant l’entrée complète |
| `api.resolvePath(input)` | `(string) => string`      | Résout le chemin relatif à la racine du Plugin                                                 |

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
  depuis du code de production. Faites passer les imports internes par `./api.ts` ou
  `./runtime-api.ts`. Le chemin SDK est uniquement le contrat externe.
</Warning>

Les surfaces publiques des Plugins groupés chargés par façade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` et fichiers d’entrée publics similaires) préfèrent l’instantané
de configuration d’exécution actif lorsque OpenClaw est déjà en cours d’exécution. Si aucun
instantané d’exécution n’existe encore, elles se rabattent sur le fichier de configuration résolu sur disque.
Les façades de Plugins groupés empaquetés doivent être chargées via les chargeurs de façade
de Plugin d’OpenClaw ; les imports directs depuis `dist/extensions/...` contournent le manifeste
et les vérifications sidecar d’exécution que les installations empaquetées utilisent pour le code détenu par le Plugin.

Les Plugins de fournisseur peuvent exposer un barrel de contrat local au Plugin et étroit lorsqu’un
assistant est intentionnellement propre au fournisseur et n’a pas encore sa place dans un sous-chemin SDK
générique. Exemples groupés :

- **Anthropic** : surface publique `api.ts` / `contract-api.ts` pour les assistants de flux
  d’en-tête bêta Claude et `service_tier`.
- **`@openclaw/openai-provider`** : `api.ts` exporte les constructeurs de fournisseur,
  les assistants de modèle par défaut et les constructeurs de fournisseur temps réel.
- **`@openclaw/openrouter-provider`** : `api.ts` exporte le constructeur de fournisseur
  ainsi que les assistants d’onboarding/configuration.

<Warning>
  Le code de production d’extension doit également éviter les imports `openclaw/plugin-sdk/<other-plugin>`.
  Si un assistant est réellement partagé, promouvez-le vers un sous-chemin SDK neutre
  comme `openclaw/plugin-sdk/speech`, `.../provider-model-shared` ou une autre
  surface orientée capacité, au lieu de coupler deux Plugins entre eux.
</Warning>

## Connexe

<CardGroup cols={2}>
  <Card title="Points d’entrée" icon="door-open" href="/fr/plugins/sdk-entrypoints">
    Options `definePluginEntry` et `defineChannelPluginEntry`.
  </Card>
  <Card title="Assistants d’exécution" icon="gears" href="/fr/plugins/sdk-runtime">
    Référence complète de l’espace de noms `api.runtime`.
  </Card>
  <Card title="Configuration initiale et config" icon="sliders" href="/fr/plugins/sdk-setup">
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
