---
read_when:
    - Vous devez savoir depuis quel sous-chemin du SDK effectuer l’importation.
    - Vous souhaitez une référence pour toutes les méthodes d’enregistrement d’OpenClawPluginApi
    - Vous recherchez une exportation spécifique du SDK
sidebarTitle: Plugin SDK overview
summary: Carte des imports, référence de l’API d’enregistrement et architecture du SDK
title: Présentation du SDK de Plugin
x-i18n:
    generated_at: "2026-07-12T02:59:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 046c6f6996d078f3847dc76b5cc917db614ce85fe66cc5e511793ae9026e1073
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Le SDK de Plugin est le contrat typé entre les plugins et le cœur. Cette page
sert de référence pour savoir **quoi importer** et **ce que vous pouvez enregistrer**.

<Note>
  Cette page s’adresse aux auteurs de plugins qui utilisent `openclaw/plugin-sdk/*`
  dans OpenClaw. Pour les applications externes, les scripts, les tableaux de bord,
  les tâches de CI et les extensions d’IDE qui souhaitent exécuter des agents via
  le Gateway, utilisez plutôt
  [Intégrations du Gateway pour les applications externes](/fr/gateway/external-apps).
</Note>

<Tip>
Vous cherchez plutôt un guide pratique ? Commencez par [Créer des plugins](/fr/plugins/building-plugins). Consultez [Plugins de canal](/fr/plugins/sdk-channel-plugins) pour les canaux, [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins) pour les fournisseurs de modèles, [Plugins de moteur CLI](/fr/plugins/cli-backend-plugins) pour les moteurs CLI d’IA locaux, [Plugins de harnais d’agent](/fr/plugins/sdk-agent-harness) pour les exécuteurs d’agents natifs et [Hooks de Plugin](/fr/plugins/hooks) pour les hooks d’outil ou de cycle de vie.
</Tip>

## Convention d’importation

Importez toujours depuis un sous-chemin précis :

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Chaque sous-chemin est un petit module autonome. Cela accélère le démarrage et
évite les problèmes de dépendances circulaires. Pour les assistants d’entrée et
de compilation propres aux canaux, privilégiez `openclaw/plugin-sdk/channel-core` ;
réservez `openclaw/plugin-sdk/core` à la surface générale plus large et aux
assistants partagés tels que `buildChannelConfigSchema`.

Pour la configuration des canaux, publiez le schéma JSON appartenant au canal via
`openclaw.plugin.json#channelConfigs`. Le sous-chemin
`plugin-sdk/channel-config-schema` fournit les primitives de schéma partagées et
le générateur générique. Les plugins intégrés d’OpenClaw utilisent
`plugin-sdk/bundled-channel-config-schema` pour les schémas conservés des canaux
intégrés. Les exportations de compatibilité obsolètes restent disponibles dans
`plugin-sdk/channel-config-schema-legacy` ; aucun de ces sous-chemins de schéma
intégré ne constitue un modèle pour les nouveaux plugins.

<Warning>
  N’importez pas les interfaces pratiques associées à la marque d’un fournisseur
  ou d’un canal (par exemple `openclaw/plugin-sdk/slack`, `.../discord`,
  `.../signal`, `.../whatsapp`). Les plugins intégrés composent les sous-chemins
  génériques du SDK dans leurs propres points d’exportation `api.ts` /
  `runtime-api.ts` ; les consommateurs du cœur doivent soit utiliser ces points
  d’exportation locaux au plugin, soit ajouter un contrat SDK générique et
  restreint lorsqu’un besoin est véritablement commun à plusieurs canaux.

Un petit ensemble d’interfaces auxiliaires destinées aux plugins intégrés figure
encore dans la table d’exportation générée lorsqu’elles ont une utilisation
suivie par leur propriétaire. Elles existent uniquement pour la maintenance des
plugins intégrés et ne sont pas des chemins d’importation recommandés pour les
nouveaux plugins tiers.

`openclaw/plugin-sdk/discord` et `openclaw/plugin-sdk/telegram-account` sont
également conservés comme façades de compatibilité obsolètes pour les utilisations
suivies par leur propriétaire. Ne reproduisez pas ces chemins d’importation dans
de nouveaux plugins ; utilisez plutôt les assistants d’exécution injectés et les
sous-chemins génériques du SDK de canal.
</Warning>

## Référence des sous-chemins

Le SDK de Plugin est exposé sous la forme d’un ensemble de sous-chemins ciblés,
regroupés par domaine (entrée de Plugin, canal, fournisseur, authentification,
exécution, capacité, mémoire et assistants réservés aux plugins intégrés). Pour
consulter le catalogue complet — regroupé et accompagné de liens —, voir
[Sous-chemins du SDK de Plugin](/fr/plugins/sdk-subpaths).

L’inventaire des points d’entrée du compilateur se trouve dans
`scripts/lib/plugin-sdk-entrypoints.json` ; les exportations du paquet sont
générées à partir du sous-ensemble public après soustraction des sous-chemins de
test/internes propres au dépôt, répertoriés dans
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Exécutez
`pnpm plugin-sdk:surface` pour auditer le nombre d’exportations publiques. Les
sous-chemins publics obsolètes suffisamment anciens et inutilisés par le code de
production des extensions intégrées sont répertoriés dans
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json` ; les points
d’exportation généraux de réexportations obsolètes sont répertoriés dans
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## API d’enregistrement

Le rappel `register(api)` reçoit un objet `OpenClawPluginApi` doté des méthodes
suivantes :

### Enregistrement des capacités

| Méthode                                          | Élément enregistré                                                                  |
| ------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `api.registerProvider(...)`                      | Inférence de texte (LLM)                                                            |
| `api.registerWorkerProvider(...)`                | Baux de cycle de vie des workers dans le cloud                                      |
| `api.registerModelCatalogProvider(...)`          | Entrées du catalogue de modèles pour la génération de texte et de médias            |
| `api.registerAgentHarness(...)`                  | Exécuteur d’agent natif [expérimental](/fr/plugins/sdk-agent-harness) (Codex, Copilot)  |
| `api.registerCliBackend(...)`                    | Moteur local d’inférence CLI                                                        |
| `api.registerChannel(...)`                       | Canal de messagerie                                                                 |
| `api.registerEmbeddingProvider(...)`             | Fournisseur réutilisable de plongements vectoriels                                  |
| `api.registerSpeechProvider(...)`                | Synthèse texte-parole / STT                                                         |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcription en temps réel et en continu                                            |
| `api.registerRealtimeVoiceProvider(...)`         | Sessions vocales bidirectionnelles en temps réel                                    |
| `api.registerMediaUnderstandingProvider(...)`    | Analyse d’images, de contenus audio et de vidéos                                     |
| `api.registerTranscriptSourceProvider(...)`      | Source de transcription de réunion en direct ou importée                            |
| `api.registerImageGenerationProvider(...)`       | Génération d’images                                                                 |
| `api.registerMusicGenerationProvider(...)`       | Génération de musique                                                               |
| `api.registerVideoGenerationProvider(...)`       | Génération de vidéos                                                                |
| `api.registerWebFetchProvider(...)`              | Fournisseur de récupération / extraction de contenu Web                             |
| `api.registerWebSearchProvider(...)`             | Recherche Web                                                                       |
| `api.registerCompactionProvider(...)`            | Moteur enfichable de Compaction des transcriptions                                  |

Les fournisseurs de workers doivent également déclarer leur identifiant dans `contracts.workerProviders`.
Le cœur enregistre l’intention persistante avant `provision(profile, operationId)`. Les fournisseurs valident les paramètres avant toute allocation externe et lèvent une exception `WorkerProviderError` en cas de rejet définitif du profil. `provision` doit reprendre le même bail lorsque l’identifiant d’opération se répète.
Le cœur enregistre les paramètres validés du profil avec le bail et fournit cet instantané à `destroy({ leaseId, profile })`, qui doit être idempotente, ainsi qu’à `inspect({ leaseId, profile })`, qui renvoie `active`, `destroyed` ou `unknown`. Cela permet aux fournisseurs d’acheminer les appels de cycle de vie après le redémarrage d’un Gateway ou la suppression d’un profil nommé. Les points de terminaison SSH utilisent une `SecretRef` pour `keyRef`, jamais de contenu de clé intégré, et incluent une `hostKey` issue d’une sortie de provisionnement fiable, exactement au format `algorithm base64`, sans nom d’hôte ni commentaire. Le cœur épingle `hostKey` et n’accorde jamais sa confiance à une clé reçue lors de la première connexion. Un fournisseur qui génère une `keyRef` dynamique peut implémenter `resolveSshIdentity({ leaseId, profile, keyRef })` ; lorsqu’il est présent, ce résolveur fait autorité, tandis que les fournisseurs qui n’en disposent pas utilisent le résolveur générique de secrets configuré.
Les fournisseurs proposant des baux renouvelables peuvent également implémenter `renew(leaseId)`.
`inspect` doit lever une exception en cas d’échec transitoire ou indéterminé ; il ne doit renvoyer `unknown` qu’en cas d’absence établie de manière fiable. Le cœur marque alors comme orphelin un enregistrement local actif ou considère l’absence comme l’achèvement du démantèlement après une demande de destruction enregistrée.

Les fournisseurs de plongements enregistrés avec
`api.registerEmbeddingProvider(...)` doivent également figurer dans
`contracts.embeddingProviders` dans le manifeste du Plugin. Il s’agit de la
surface générique de plongement pour la génération vectorielle réutilisable. La
recherche en mémoire peut utiliser cette surface générique de fournisseur.
L’ancienne interface `api.registerMemoryEmbeddingProvider(...)` et
`contracts.memoryEmbeddingProviders` constitue une compatibilité obsolète
pendant la migration des fournisseurs propres à la mémoire existants.

Les fournisseurs propres à la mémoire qui exposent encore une méthode
d’exécution `batchEmbed(...)` conservent le contrat existant de traitement par
lots et par fichier, sauf si leur environnement d’exécution définit explicitement
`sourceWideBatchEmbed: true`. Cette option permet à l’hôte de la mémoire de
soumettre, dans un seul appel `batchEmbed(...)`, des fragments provenant de
plusieurs fichiers mémoire modifiés et de sources activées, dans la limite de la
taille des lots de l’hôte. Les adaptateurs de traitement par lots qui téléversent
des fichiers de requêtes JSONL doivent répartir les tâches du fournisseur avant
d’atteindre la limite de taille de téléversement, ainsi que la limite du nombre
de requêtes. Le fournisseur doit renvoyer un plongement par fragment d’entrée,
dans le même ordre que `batch.chunks` ; omettez l’option lorsque le fournisseur
attend des lots propres à chaque fichier ou ne peut pas préserver l’ordre des
entrées dans une tâche plus vaste couvrant l’ensemble des sources.

### Outils et commandes

Utilisez [`defineToolPlugin`](/fr/plugins/tool-plugins) pour les plugins simples
contenant uniquement des outils aux noms fixes. Utilisez directement
`api.registerTool(...)` pour les plugins mixtes ou l’enregistrement entièrement
dynamique des outils.

| Méthode                                | Élément enregistré                                                                                                                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerTool(tool, opts?)`        | Outil d’agent (obligatoire ou `{ optional: true }`)                                                                                                                                   |
| `api.registerCommand(def)`             | Commande personnalisée (contourne le LLM)                                                                                                                                             |
| `api.registerNodeHostCommand(command)` | Commande gérée par `openclaw node run` ; les métadonnées facultatives `agentTool` peuvent l’exposer comme outil visible par l’agent tant que le Node est connecté                     |

Les commandes de Plugin peuvent définir `agentPromptGuidance` lorsque l’agent a
besoin d’une brève indication d’acheminement appartenant à la commande. Limitez
ce texte à la commande elle-même ; n’ajoutez pas de stratégie propre à un
fournisseur ou à un Plugin dans les générateurs d’invites du cœur.

Les indications peuvent être des chaînes héritées, qui s’appliquent à toutes les
surfaces d’invite, ou des entrées structurées :

```ts
agentPromptGuidance: [
  "Indication globale sur la commande.",
  { text: "Afficher ceci uniquement dans l’invite principale d’OpenClaw.", surfaces: ["openclaw_main"] },
];
```

Les valeurs structurées de `surfaces` peuvent inclure `openclaw_main`,
`codex_app_server`, `cli_backend`, `acp_backend` ou `subagent`. `pi_main` reste
un alias obsolète de `openclaw_main`. Omettez `surfaces` pour une indication
destinée intentionnellement à toutes les surfaces. Ne transmettez pas un tableau
`surfaces` vide ; il est rejeté afin qu’une perte accidentelle de portée ne
transforme pas le texte en invite globale.

Les instructions de développement natives du serveur d’application Codex sont
plus strictes que celles des autres surfaces d’invite : seules les indications
explicitement limitées à `codex_app_server` sont promues dans ce niveau de
priorité supérieure. Les indications sous forme de chaînes héritées et les
indications structurées sans portée définie restent disponibles pour les surfaces
d’invite autres que Codex à des fins de compatibilité.

Les commandes de l’hôte Node s’exécutent sur l’hôte Node connecté, et non dans le processus du Gateway. Si `agentTool` est présent, le Node publie un descripteur après une connexion réussie au Gateway ; le Gateway ne l’expose aux exécutions de l’agent que tant que ce Node est connecté et uniquement si la `command` du descripteur figure dans la surface de commandes approuvée du Node. Définissez `agentTool.defaultPlatforms` pour ajouter une commande non dangereuse à la liste d’autorisation par défaut des commandes du Node ; sinon, exigez une configuration explicite de `gateway.nodes.allowCommands` ou une politique d’invocation du Node. `agentTool.name` doit être compatible avec le fournisseur : commencer par une lettre, ne contenir que des lettres, des chiffres, des traits de soulignement ou des traits d’union, et ne pas dépasser 64 caractères. Les outils du Node adossés à MCP peuvent définir des métadonnées `agentTool.mcp` afin que le catalogue et les surfaces de recherche d’outils puissent afficher l’identité du serveur et de l’outil MCP distants, mais l’exécution passe toujours par la commande du Node annoncée.

### Infrastructure

| Méthode                                         | Élément enregistré                                                                       |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Hook d’événement                                                                         |
| `api.registerHttpRoute(params)`                 | Point de terminaison HTTP du Gateway                                                     |
| `api.registerGatewayMethod(name, handler)`      | Méthode RPC du Gateway                                                                   |
| `api.registerGatewayDiscoveryService(service)`  | Annonceur local de découverte du Gateway                                                  |
| `api.registerCli(registrar, opts?)`             | Sous-commande de la CLI                                                                  |
| `api.registerNodeCliFeature(registrar, opts?)`  | Fonctionnalité de la CLI du Node sous `openclaw nodes`                                    |
| `api.registerService(service)`                  | Service en arrière-plan                                                                  |
| `api.registerInteractiveHandler(registration)`  | Gestionnaire interactif                                                                  |
| `api.registerAgentToolResultMiddleware(...)`    | Intergiciel d’exécution pour les résultats d’outils                                       |
| `api.registerMemoryPromptSupplement(builder)`   | Section additive de l’invite associée à la mémoire                                        |
| `api.registerMemoryCorpusSupplement(adapter)`   | Corpus additif de recherche et de lecture de la mémoire                                   |
| `api.registerHostedMediaResolver(resolver)`     | Résolveur d’URL de médias hébergés de type navigateur                                     |
| `api.registerTextTransforms(transforms)`        | Réécritures de texte de compatibilité des invites et messages appartenant au Plugin       |
| `api.registerConfigMigration(migrate)`          | Migration légère de la configuration exécutée avant le chargement de l’exécution du Plugin |
| `api.registerMigrationProvider(provider)`       | Importateur pour `openclaw migrate`                                                       |
| `api.registerAutoEnableProbe(probe)`            | Sonde de configuration pouvant activer automatiquement ce Plugin                          |
| `api.registerReload(registration)`              | Politique de préfixes de configuration avec redémarrage, rechargement à chaud ou aucune action |
| `api.registerNodeHostCommand(command)`          | Gestionnaire de commande exposé aux Nodes appairés                                        |
| `api.registerNodeInvokePolicy(policy)`          | Politique de liste d’autorisation et d’approbation pour les commandes invoquées par un Node |
| `api.registerSecurityAuditCollector(collector)` | Collecteur de constats pour `openclaw security audit`                                     |

Les générateurs de suppléments d’invite de mémoire reçoivent un contexte facultatif comprenant `agentId`, `agentSessionKey` et `sandboxed`. Les appels `search` et `get` du supplément de corpus de mémoire reçoivent un contexte facultatif comprenant `agentId` et `sandboxed`. Les Plugins disposant d’un stockage appartenant à l’agent doivent résoudre ce stockage à chaque appel au lieu de capturer un chemin global unique lors de l’enregistrement. Si un identifiant d’agent est requis mais absent lors d’une opération multi-agent, refusez l’opération par défaut au lieu de choisir un agent arbitraire.

Les gestionnaires interactifs de Telegram peuvent renvoyer `{ submitText }` afin d’acheminer le texte par le parcours entrant normal de l’agent Telegram une fois le gestionnaire exécuté avec succès. OpenClaw conserve le bouton de rappel lorsque la politique entrante ignore le texte ou que le traitement échoue, afin que l’utilisateur puisse réessayer après la disparition de la condition bloquante. Ce champ de résultat est propre à Telegram ; les autres canaux conservent leurs propres contrats de résultats interactifs.

### Hooks de l’hôte pour les Plugins de flux de travail

Les hooks de l’hôte sont les interfaces du SDK destinées aux Plugins qui doivent participer au cycle de vie de l’hôte au lieu de se limiter à ajouter un fournisseur, un canal ou un outil. Il s’agit de contrats génériques ; le mode Planification peut les utiliser, tout comme les flux de travail d’approbation, les contrôles de politique de l’espace de travail, les moniteurs en arrière-plan, les assistants de configuration et les Plugins compagnons d’interface utilisateur.

| Méthode                                                                              | Contrat qu’elle régit                                                                                                                                                       |
| ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | État de session compatible JSON appartenant au Plugin et projeté par les sessions du Gateway                                                                               |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Contexte durable injecté exactement une fois dans le prochain tour de l’agent pour une session                                                                             |
| `api.registerTrustedToolPolicy(...)`                                                 | Politique d’outil de confiance antérieure aux Plugins, contrôlée par le manifeste, pouvant bloquer ou réécrire les paramètres de l’outil                                   |
| `api.registerToolMetadata(...)`                                                      | Métadonnées d’affichage du catalogue d’outils sans modification de l’implémentation de l’outil                                                                             |
| `api.registerCommand(...)`                                                           | Commandes de Plugin délimitées ; les résultats de commande peuvent définir `continueAgent: true` ou `suppressReply: true` ; les commandes natives de Discord prennent en charge `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Descripteurs de contribution à l’interface de contrôle pour les surfaces de session, d’outil, d’exécution, de paramètres ou d’onglet                                      |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Rappels de nettoyage des ressources d’exécution appartenant au Plugin sur les parcours de réinitialisation, de suppression et de rechargement                              |
| `api.agent.events.registerAgentEventSubscription(...)`                               | Abonnements assainis aux événements pour l’état des flux de travail et les moniteurs                                                                                       |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | État de travail temporaire du Plugin propre à chaque exécution, effacé lors du cycle de vie terminal de l’exécution                                                        |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Métadonnées de nettoyage des tâches du planificateur appartenant au Plugin ; ne planifie aucun travail et ne crée aucun enregistrement de tâche                            |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Livraison, réservée aux Plugins intégrés et assurée par l’hôte, d’une pièce jointe à la route sortante directe active de la session                                        |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Tours de session planifiés adossés à Cron, réservés aux Plugins intégrés, avec nettoyage par étiquette                                                                     |
| `api.session.controls.registerSessionAction(...)`                                    | Actions de session typées que les clients peuvent envoyer par le Gateway                                                                                                  |

Un descripteur `surface: "tab"` ajoute un onglet à la barre latérale de l’interface de contrôle. Les descripteurs d’onglets des Plugins actifs sont annoncés aux clients du tableau de bord dans le message de bienvenue du Gateway (`controlUiTabs`), de sorte que l’onglet n’apparaît que lorsque le Plugin est activé. Les Plugins intégrés peuvent fournir une vue de tableau de bord native pour leur onglet ; les autres Plugins peuvent définir `path` vers une route HTTP du Plugin (voir `api.registerHttpRoute(...)`) que le tableau de bord affiche dans un cadre isolé. `icon` est une indication de nom d’icône du tableau de bord, `group` sélectionne la section de la barre latérale (`control` ou `agent`), `order` détermine l’ordre parmi les onglets des Plugins et `requiredScopes` masque l’onglet pour les connexions ne disposant pas de ces portées d’opérateur :

```typescript
api.session.controls.registerControlUiDescriptor({
  surface: "tab",
  id: "logbook",
  label: "Logbook",
  description: "Your day as a timeline, built from screen snapshots.",
  icon: "sun",
  group: "control",
  requiredScopes: ["operator.write"],
});
```

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

Les méthodes à plat équivalentes restent disponibles comme alias de compatibilité obsolètes pour les Plugins existants. N’ajoutez pas de nouveau code de Plugin appelant directement `api.registerSessionExtension`, `api.enqueueNextTurnInjection`, `api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`, `api.registerAgentEventSubscription`, `api.emitAgentEvent`, `api.setRunContext`, `api.getRunContext`, `api.clearRunContext`, `api.registerSessionSchedulerJob`, `api.registerSessionAction`, `api.sendSessionAttachment`, `api.scheduleSessionTurn` ou `api.unscheduleSessionTurnsByTag`.

`scheduleSessionTurn(...)` est une fonction pratique limitée à une session et reposant sur le planificateur Cron du Gateway. Cron gère la temporisation et crée l’enregistrement de tâche en arrière-plan lors de l’exécution du tour ; le SDK du Plugin se limite à contraindre la session cible, la dénomination appartenant au Plugin et le nettoyage. Utilisez `api.runtime.tasks.managedFlows` dans le tour planifié lorsque le travail lui-même nécessite un état TaskFlow durable en plusieurs étapes.

Les contrats séparent intentionnellement les responsabilités :

- Les Plugins externes peuvent régir les extensions de session, les descripteurs d’interface utilisateur, les commandes, les métadonnées d’outils, les injections au tour suivant et les hooks ordinaires.
- Les politiques d’outils de confiance s’exécutent avant les hooks `before_tool_call` ordinaires et bénéficient de la confiance de l’hôte. Les politiques intégrées s’exécutent en premier ; les politiques des Plugins installés nécessitent une activation explicite ainsi que leurs identifiants locaux dans `contracts.trustedToolPolicies`, puis s’exécutent dans l’ordre de chargement des Plugins. Les identifiants de politique sont limités au Plugin qui les enregistre.
- La propriété des commandes réservées est limitée aux Plugins intégrés. Les Plugins externes doivent utiliser leurs propres noms de commande ou alias.
- `allowPromptInjection=false` désactive les hooks qui modifient l’invite, notamment `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`, les champs d’invite issus de l’ancien `before_agent_start` et `enqueueNextTurnInjection`.

Exemples de consommateurs n’utilisant pas le mode Planification :

| Archétype de Plugin                | Hooks utilisés                                                                                                                               |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Workflow d’approbation             | Extension de session, poursuite de commande, injection au tour suivant, descripteur d’interface utilisateur                                  |
| Contrôle de politique budget/espace de travail | Politique d’outils approuvés, métadonnées d’outil, projection de session                                                          |
| Moniteur de cycle de vie en arrière-plan | Nettoyage du cycle de vie d’exécution, abonnement aux événements d’agent, propriété/nettoyage du planificateur de session, contribution au prompt de Heartbeat, descripteur d’interface utilisateur |
| Assistant de configuration ou d’intégration | Extension de session, commandes délimitées, descripteur de l’interface utilisateur de contrôle                                      |

<Note>
  Les espaces de noms d’administration réservés du cœur (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) restent toujours
  `operator.admin`, même si un Plugin tente d’attribuer une portée de méthode
  Gateway plus restreinte. Préférez des préfixes propres au Plugin pour les
  méthodes dont il est propriétaire.
</Note>

<Accordion title="Quand utiliser l’intergiciel de résultats d’outils">
  Les Plugins intégrés et les Plugins installés explicitement activés dont les
  contrats de manifeste correspondent peuvent utiliser
  `api.registerAgentToolResultMiddleware(...)` lorsqu’ils doivent réécrire le
  résultat d’un outil après son exécution et avant que l’environnement
  d’exécution ne le renvoie au modèle. Il s’agit du point d’extension approuvé,
  indépendant de l’environnement d’exécution, pour les réducteurs de sortie
  asynchrones tels que tokenjuice.

Les Plugins doivent déclarer `contracts.agentToolResultMiddleware` pour chaque
environnement d’exécution ciblé, par exemple `["openclaw", "codex"]`. Les Plugins
installés sans ce contrat ou sans activation explicite ne peuvent pas
enregistrer cet intergiciel ; conservez les hooks de Plugin OpenClaw habituels
pour les tâches qui ne nécessitent pas d’intervenir sur le résultat d’un outil
avant son envoi au modèle. L’ancien chemin d’enregistrement de fabrique
d’extensions réservé à l’exécuteur intégré a été supprimé.
</Accordion>

### Enregistrement de la découverte du Gateway

`api.registerGatewayDiscoveryService(...)` permet à un Plugin d’annoncer le
Gateway actif sur un transport de découverte local tel que mDNS/Bonjour.
OpenClaw appelle le service au démarrage du Gateway lorsque la découverte locale
est activée, lui transmet les ports actuels du Gateway et des données
indicatives TXT non secrètes, puis appelle le gestionnaire `stop` renvoyé lors
de l’arrêt du Gateway.

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

Les Plugins de découverte du Gateway ne doivent pas considérer les valeurs TXT
annoncées comme des secrets ou un mécanisme d’authentification. La découverte
est une indication de routage ; l’authentification du Gateway et l’épinglage TLS
restent responsables de la confiance.

### Métadonnées d’enregistrement de la CLI

`api.registerCli(registrar, opts?)` accepte deux types de métadonnées de
commande :

- `commands` : noms de commandes explicites appartenant au gestionnaire
  d’enregistrement
- `descriptors` : descripteurs de commande utilisés lors de l’analyse pour
  l’aide de la CLI, le routage et l’enregistrement différé de la CLI du Plugin
- `parentPath` : chemin facultatif de la commande parente pour les groupes de
  commandes imbriqués, tels que `["nodes"]`

Pour les fonctionnalités de nœuds appairés, préférez
`api.registerNodeCliFeature(registrar, opts?)`. Il s’agit d’une petite
surcouche de `api.registerCli(..., { parentPath: ["nodes"] })` qui indique
explicitement que des commandes telles que `openclaw nodes canvas` sont des
fonctionnalités de nœud appartenant au Plugin.

Si vous souhaitez qu’une commande de Plugin reste chargée de façon différée
dans le chemin racine normal de la CLI, fournissez des `descriptors` couvrant
chaque racine de commande de premier niveau exposée par ce gestionnaire
d’enregistrement.

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

Les commandes imbriquées reçoivent la commande parente résolue dans `program` :

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
        description: "Capturer ou restituer le contenu d’un canevas depuis un nœud appairé",
        hasSubcommands: true,
      },
    ],
  },
);
```

Utilisez uniquement `commands` lorsque vous n’avez pas besoin de
l’enregistrement différé de la CLI racine. Ce chemin de compatibilité à
chargement immédiat reste pris en charge, mais il n’installe pas d’espaces
réservés fondés sur des descripteurs pour le chargement différé au moment de
l’analyse.

### Enregistrement d’un backend de CLI

`api.registerCliBackend(...)` permet à un Plugin de définir la configuration
par défaut d’un backend local de CLI d’IA tel que `claude-cli` ou `my-cli`.

- L’`id` du backend devient le préfixe du fournisseur dans les références de
  modèle telles que `my-cli/gpt-5`.
- La `config` du backend utilise la même structure que
  `agents.defaults.cliBackends.<id>`.
- La configuration de l’utilisateur reste prioritaire. OpenClaw fusionne
  `agents.defaults.cliBackends.<id>` par-dessus la valeur par défaut du Plugin
  avant d’exécuter la CLI.
- Utilisez `normalizeConfig` lorsqu’un backend nécessite des réécritures de
  compatibilité après la fusion, par exemple pour normaliser d’anciennes formes
  d’options.
- Utilisez `resolveExecutionArgs` pour les réécritures d’arguments propres à la
  requête qui relèvent du dialecte de la CLI, comme la conversion des niveaux
  de réflexion d’OpenClaw en une option d’effort native. Le hook reçoit
  `ctx.executionMode` ; utilisez `"side-question"` pour ajouter des options
  d’isolation natives du backend aux appels éphémères `/btw`. Si ces options
  désactivent de manière fiable les outils natifs pour une CLI où ils seraient
  autrement toujours actifs, déclarez également
  `sideQuestionToolMode: "disabled"`.
- Les backends capables de désactiver tous les outils natifs pour une exécution
  précise peuvent déclarer `nativeToolMode: "selectable"`. Les appels restreints
  transmettent un tuple `ctx.toolAvailability.native` vide ainsi qu’une liste
  d’autorisation MCP exacte et isolée de l’hôte ; `resolveExecutionArgs` doit
  appliquer les deux aux arguments finaux d’une nouvelle exécution ou d’une
  reprise. OpenClaw applique un refus par défaut si le backend ne peut pas le
  faire.

Pour un guide de création complet, consultez
[Plugins de backend de CLI](/fr/plugins/cli-backend-plugins).

### Emplacements exclusifs

| Méthode                                    | Ce qu’elle enregistre                                                                                                                                                                                                  |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Moteur de contexte, dont un seul peut être actif à la fois. Les rappels de cycle de vie reçoivent `runtimeSettings` lorsque l’hôte peut fournir des diagnostics de modèle, de fournisseur et de mode ; les moteurs stricts plus anciens sont réessayés sans cette clé. |
| `api.registerMemoryCapability(capability)` | Fonctionnalité de mémoire unifiée                                                                                                                                                                                       |
| `api.registerMemoryPromptSection(builder)` | Générateur de section de prompt de mémoire                                                                                                                                                                             |
| `api.registerMemoryFlushPlan(resolver)`    | Résolveur de plan de vidage de la mémoire                                                                                                                                                                              |
| `api.registerMemoryRuntime(runtime)`       | Adaptateur d’environnement d’exécution de la mémoire                                                                                                                                                                   |

### Adaptateurs d’intégration vectorielle de mémoire obsolètes

| Méthode                                        | Ce qu’elle enregistre                                      |
| ---------------------------------------------- | ---------------------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptateur d’intégration vectorielle de mémoire du Plugin actif |

- `registerMemoryCapability` est l’API exclusive privilégiée pour les Plugins
  de mémoire.
- `registerMemoryCapability` peut également exposer
  `publicArtifacts.listArtifacts(...)` afin que les Plugins complémentaires
  puissent utiliser les artefacts de mémoire exportés via
  `openclaw/plugin-sdk/memory-host-core` au lieu d’accéder à l’organisation
  privée d’un Plugin de mémoire particulier.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` et
  `registerMemoryRuntime` sont des API exclusives de Plugin de mémoire
  compatibles avec l’ancien système.
- `MemoryFlushPlan.model` peut fixer le tour de vidage à une référence
  `provider/model` exacte, telle que `ollama/qwen3:8b`, sans hériter de la
  chaîne de repli active.
- `registerMemoryEmbeddingProvider` est obsolète. Les nouveaux fournisseurs
  d’intégration vectorielle doivent utiliser
  `api.registerEmbeddingProvider(...)` et `contracts.embeddingProviders`.
- Les fournisseurs existants propres à la mémoire continuent de fonctionner
  pendant la période de migration, mais l’inspection des Plugins signale cela
  comme une dette de compatibilité pour les Plugins non intégrés.

### Événements et cycle de vie

| Méthode                                      | Fonction                              |
| -------------------------------------------- | ------------------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook de cycle de vie typé             |
| `api.onConversationBindingResolved(handler)` | Rappel de résolution de liaison de conversation |

Consultez [Hooks de Plugin](/fr/plugins/hooks) pour obtenir des exemples, les noms
de hooks courants et la sémantique des protections.

### Sémantique des décisions des hooks

`before_install` est un hook de cycle de vie de l’environnement d’exécution du
Plugin, et non la surface de politique d’installation de l’opérateur. Utilisez
`security.installPolicy` lorsqu’une décision d’autorisation ou de blocage doit
couvrir les chemins d’installation ou de mise à jour via la CLI et le Gateway.

- `before_tool_call` : le renvoi de `{ block: true }` est terminal. Dès qu’un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `before_tool_call` : le renvoi de `{ block: false }` est considéré comme une absence de décision (comme si `block` était omis), et non comme un remplacement.
- `before_install` : le renvoi de `{ block: true }` est terminal. Dès qu’un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `before_install` : le renvoi de `{ block: false }` est considéré comme une absence de décision (comme si `block` était omis), et non comme un remplacement.
- `reply_dispatch` : le renvoi de `{ handled: true, ... }` est terminal. Dès qu’un gestionnaire prend en charge la distribution, les gestionnaires de priorité inférieure et le chemin de distribution par défaut du modèle sont ignorés.
- `message_sending` : le renvoi de `{ cancel: true }` est terminal. Dès qu’un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `message_sending` : le renvoi de `{ cancel: false }` est considéré comme une absence de décision (comme si `cancel` était omis), et non comme un remplacement.
- `message_received` : utilisez le champ typé `threadId` lorsque vous devez acheminer un fil ou un sujet entrant. Réservez `metadata` aux données supplémentaires propres au canal.
- `message_sending` : utilisez les champs d’acheminement typés `replyToId` / `threadId` avant de vous rabattre sur les `metadata` propres au canal.
- `gateway_start` : utilisez `ctx.config`, `ctx.workspaceDir` et `ctx.getCron?.()` pour l’état de démarrage appartenant au Gateway au lieu de dépendre des hooks internes `gateway:startup`. Cron peut encore être en cours de chargement à ce stade.
- `cron_reconciled` : reconstruisez une projection Cron externe complète après le démarrage ou le rechargement du planificateur. Elle inclut `reason` et l’état `enabled` effectif, y compris `enabled: false`, tandis que `ctx.getCron?.()` renvoie le planificateur réconcilié exact. Transmettez `ctx.abortSignal` aux travaux de projection durable ; il est interrompu lorsque cet instantané du planificateur est remplacé ou que le Gateway se ferme.
- `cron_changed` : observez les changements du cycle de vie de Cron appartenant au Gateway. Les événements `scheduled` et `removed` sont des indications de réconciliation postérieures à la validation, et non un journal ordonné des différences. Le champ `event.nextRunAtMs` d’un événement planifié est absent lorsque la tâche n’a pas de prochain réveil ; un événement de suppression contient toujours l’instantané de la tâche supprimée.

Les planificateurs de réveil externes doivent appliquer un délai anti-rebond ou regrouper les événements `cron_changed`,
puis relire la vue durable complète depuis le dernier planificateur capturé par
`cron_reconciled`. N’adoptez pas le planificateur issu d’un contexte `cron_changed` : une
indication détachée provenant d’un ancien planificateur peut chevaucher un rechargement ultérieur.

Utilisez `cron_reconciled` comme déclencheur d’instantané complet pour l’état durable chargé au
démarrage du Gateway ou lors du remplacement du planificateur. Il n’est pas rejoué lors d’un
rechargement à chaud limité au Plugin. Les gestionnaires d’observation s’exécutent en parallèle, et les
distributions sans attente de résultat peuvent se chevaucher ; les consommateurs ne doivent donc pas dépendre de l’ordre d’achèvement des événements.
Conservez OpenClaw comme source de vérité pour les vérifications d’échéance et l’exécution.

Pour un adaptateur à exécution unique avec remplacement durable, nouvelle tentative/recul exponentiel et arrêt
propre, consultez [Projection Cron externe sécurisée](/fr/plugins/hooks#safe-external-cron-projection).

### Champs de l’objet API

| Champ                    | Type                      | Description                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Identifiant du Plugin                                                                       |
| `api.name`               | `string`                  | Nom d’affichage                                                                             |
| `api.version`            | `string?`                 | Version du Plugin (facultative)                                                             |
| `api.description`        | `string?`                 | Description du Plugin (facultative)                                                         |
| `api.source`             | `string`                  | Chemin source du Plugin                                                                     |
| `api.rootDir`            | `string?`                 | Répertoire racine du Plugin (facultatif)                                                     |
| `api.config`             | `OpenClawConfig`          | Instantané actuel de la configuration (instantané d’exécution actif en mémoire lorsqu’il est disponible) |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuration propre au Plugin provenant de `plugins.entries.<id>.config`                   |
| `api.runtime`            | `PluginRuntime`           | [Assistants d’exécution](/fr/plugins/sdk-runtime)                                               |
| `api.logger`             | `PluginLogger`            | Journaliseur délimité (`debug`, `info`, `warn`, `error`)                                    |
| `api.registrationMode`   | `PluginRegistrationMode`  | Mode de chargement actuel ; `"setup-runtime"` est la fenêtre légère de démarrage/configuration précédant le chargement complet du point d’entrée |
| `api.resolvePath(input)` | `(string) => string`      | Résout un chemin par rapport à la racine du Plugin                                           |

## Convention relative aux modules internes

Dans votre Plugin, utilisez des fichiers d’agrégation locaux pour les importations internes :

```text
my-plugin/
  api.ts            # Exportations publiques destinées aux consommateurs externes
  runtime-api.ts    # Exportations d’exécution réservées à l’usage interne
  index.ts          # Point d’entrée du Plugin
  setup-entry.ts    # Point d’entrée léger réservé à la configuration (facultatif)
```

<Warning>
  N’importez jamais votre propre Plugin via `openclaw/plugin-sdk/<your-plugin>`
  depuis le code de production. Faites passer les importations internes par `./api.ts` ou
  `./runtime-api.ts`. Le chemin du SDK constitue uniquement le contrat externe.
</Warning>

Les surfaces publiques des Plugins intégrés chargées par façade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` et autres fichiers d’entrée publics similaires) privilégient
l’instantané actif de la configuration d’exécution lorsqu’OpenClaw est déjà en cours d’exécution. Si aucun instantané
d’exécution n’existe encore, elles se rabattent sur le fichier de configuration résolu sur le disque.
Les façades empaquetées des Plugins intégrés doivent être chargées au moyen des chargeurs de façade de Plugin
d’OpenClaw ; les importations directes depuis `dist/extensions/...` contournent les vérifications
du manifeste et du module annexe d’exécution utilisées par les installations empaquetées pour le code appartenant au Plugin.

Les Plugins fournisseurs peuvent exposer un fichier d’agrégation contractuel local et restreint lorsqu’un
assistant est volontairement propre à un fournisseur et n’a pas encore sa place dans un sous-chemin générique du SDK.
Exemples intégrés :

- **Anthropic** : interface publique `api.ts` / `contract-api.ts` pour les assistants
  d’en-tête bêta de Claude et de flux `service_tier`.
- **`@openclaw/openai-provider`** : `api.ts` exporte les générateurs de fournisseurs,
  les assistants de modèle par défaut et les générateurs de fournisseurs en temps réel.
- **`@openclaw/openrouter-provider`** : `api.ts` exporte le générateur de fournisseur
  ainsi que les assistants d’intégration et de configuration.

<Warning>
  Le code de production des extensions doit également éviter les importations
  `openclaw/plugin-sdk/<other-plugin>`. Si un assistant est réellement partagé, déplacez-le vers un sous-chemin neutre du SDK,
  tel que `openclaw/plugin-sdk/speech`, `.../provider-model-shared` ou une autre
  surface axée sur les capacités, au lieu de coupler deux Plugins.
</Warning>

## Voir aussi

<CardGroup cols={2}>
  <Card title="Points d’entrée" icon="door-open" href="/fr/plugins/sdk-entrypoints">
    Options de `definePluginEntry` et `defineChannelPluginEntry`.
  </Card>
  <Card title="Assistants d’exécution" icon="gears" href="/fr/plugins/sdk-runtime">
    Référence complète de l’espace de noms `api.runtime`.
  </Card>
  <Card title="Configuration initiale et configuration" icon="sliders" href="/fr/plugins/sdk-setup">
    Empaquetage, manifestes et schémas de configuration.
  </Card>
  <Card title="Tests" icon="vial" href="/fr/plugins/sdk-testing">
    Utilitaires de test et règles d’analyse statique.
  </Card>
  <Card title="Migration du SDK" icon="arrows-turn-right" href="/fr/plugins/sdk-migration">
    Migration depuis les surfaces obsolètes.
  </Card>
  <Card title="Fonctionnement interne des Plugins" icon="diagram-project" href="/fr/plugins/architecture">
    Architecture détaillée et modèle de capacités.
  </Card>
</CardGroup>
