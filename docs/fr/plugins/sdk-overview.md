---
read_when:
    - Vous devez savoir depuis quel sous-chemin du SDK effectuer l’importation
    - Vous souhaitez une référence pour toutes les méthodes d’enregistrement d’OpenClawPluginApi
    - Vous recherchez une exportation spécifique du SDK
sidebarTitle: Plugin SDK overview
summary: Carte des importations, référence de l’API d’enregistrement et architecture du SDK
title: Présentation du SDK de Plugin
x-i18n:
    generated_at: "2026-07-12T15:41:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 046c6f6996d078f3847dc76b5cc917db614ce85fe66cc5e511793ae9026e1073
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Le SDK de Plugin est le contrat typé entre les plugins et le cœur. Cette page est la
référence pour savoir **quoi importer** et **ce que vous pouvez enregistrer**.

<Note>
  Cette page s’adresse aux auteurs de plugins qui utilisent `openclaw/plugin-sdk/*` dans
  OpenClaw. Pour les applications externes, scripts, tableaux de bord, tâches CI et extensions d’IDE
  qui souhaitent exécuter des agents par l’intermédiaire du Gateway, utilisez plutôt
  [Intégrations du Gateway pour les applications externes](/fr/gateway/external-apps).
</Note>

<Tip>
Vous recherchez plutôt un guide pratique ? Commencez par [Créer des plugins](/fr/plugins/building-plugins). Consultez [Plugins de canal](/fr/plugins/sdk-channel-plugins) pour les canaux, [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins) pour les fournisseurs de modèles, [Plugins de backend CLI](/fr/plugins/cli-backend-plugins) pour les backends CLI d’IA locaux, [Plugins de harnais d’agent](/fr/plugins/sdk-agent-harness) pour les exécuteurs d’agents natifs et [Hooks de Plugin](/fr/plugins/hooks) pour les hooks d’outils ou de cycle de vie.
</Tip>

## Convention d’importation

Importez toujours depuis un sous-chemin spécifique :

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Chaque sous-chemin est un petit module autonome. Cela accélère le démarrage et
évite les problèmes de dépendances circulaires. Pour les assistants d’entrée et de compilation propres aux canaux,
privilégiez `openclaw/plugin-sdk/channel-core` ; réservez `openclaw/plugin-sdk/core` à
la surface générale plus large et aux assistants partagés tels que
`buildChannelConfigSchema`.

Pour la configuration des canaux, publiez le schéma JSON détenu par le canal via
`openclaw.plugin.json#channelConfigs`. Le sous-chemin `plugin-sdk/channel-config-schema`
est destiné aux primitives de schéma partagées et au générateur générique. Les
plugins intégrés d’OpenClaw utilisent `plugin-sdk/bundled-channel-config-schema` pour les schémas
conservés des canaux intégrés. Les exports de compatibilité obsolètes restent disponibles dans
`plugin-sdk/channel-config-schema-legacy` ; aucun des sous-chemins de schéma intégré ne constitue un
modèle à suivre pour les nouveaux plugins.

<Warning>
  N’importez pas les interfaces pratiques associées à un fournisseur ou à un canal (par exemple
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Les plugins intégrés composent les sous-chemins génériques du SDK dans leurs propres modules d’export
  `api.ts` / `runtime-api.ts` ; les consommateurs du cœur doivent soit utiliser ces modules d’export
  locaux au plugin, soit ajouter un contrat SDK générique ciblé lorsqu’un besoin est véritablement
  commun à plusieurs canaux.

Un petit ensemble d’interfaces auxiliaires pour plugins intégrés apparaît encore dans la table
d’exports générée lorsqu’elles ont un usage suivi par leur propriétaire. Elles existent uniquement
pour la maintenance des plugins intégrés et ne sont pas des chemins d’importation recommandés pour les nouveaux
plugins tiers.

`openclaw/plugin-sdk/discord` et `openclaw/plugin-sdk/telegram-account` sont
également conservés comme façades de compatibilité obsolètes pour les usages suivis par leur propriétaire. Ne
copiez pas ces chemins d’importation dans de nouveaux plugins ; utilisez plutôt les assistants d’exécution injectés et
les sous-chemins génériques du SDK de canal.
</Warning>

## Référence des sous-chemins

Le SDK de Plugin est exposé sous la forme d’un ensemble de sous-chemins ciblés regroupés par domaine (entrée de
plugin, canal, fournisseur, authentification, exécution, capacité, mémoire et assistants réservés
aux plugins intégrés). Pour consulter le catalogue complet, regroupé et accompagné de liens, voir
[Sous-chemins du SDK de Plugin](/fr/plugins/sdk-subpaths).

L’inventaire des points d’entrée du compilateur se trouve dans
`scripts/lib/plugin-sdk-entrypoints.json` ; les exports du paquet sont générés à partir
du sous-ensemble public après soustraction des sous-chemins de test/internes propres au dépôt répertoriés dans
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Exécutez
`pnpm plugin-sdk:surface` pour auditer le nombre d’exports publics. Les sous-chemins publics
obsolètes suffisamment anciens et inutilisés par le code de production des extensions intégrées sont
suivis dans `scripts/lib/plugin-sdk-deprecated-public-subpaths.json` ; les modules d’export
larges de réexportation obsolète sont suivis dans
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## API d’enregistrement

Le rappel `register(api)` reçoit un objet `OpenClawPluginApi` doté des
méthodes suivantes :

### Enregistrement des capacités

| Méthode                                          | Ce qu’elle enregistre                                                                        |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `api.registerProvider(...)`                      | Inférence de texte (LLM)                                                                     |
| `api.registerWorkerProvider(...)`                | Baux de cycle de vie de workers cloud                                                        |
| `api.registerModelCatalogProvider(...)`          | Entrées du catalogue de modèles pour la génération de texte et de médias                     |
| `api.registerAgentHarness(...)`                  | Exécuteur d’agent natif [expérimental](/fr/plugins/sdk-agent-harness) (Codex, Copilot)           |
| `api.registerCliBackend(...)`                    | Backend d’inférence CLI local                                                                 |
| `api.registerChannel(...)`                       | Canal de messagerie                                                                           |
| `api.registerEmbeddingProvider(...)`             | Fournisseur réutilisable de plongements vectoriels                                            |
| `api.registerSpeechProvider(...)`                | Synthèse vocale / reconnaissance vocale                                                       |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcription en temps réel en continu                                                        |
| `api.registerRealtimeVoiceProvider(...)`         | Sessions vocales bidirectionnelles en temps réel                                              |
| `api.registerMediaUnderstandingProvider(...)`    | Analyse d’images, de contenus audio et de vidéos                                               |
| `api.registerTranscriptSourceProvider(...)`      | Source de transcription de réunion en direct ou importée                                      |
| `api.registerImageGenerationProvider(...)`       | Génération d’images                                                                           |
| `api.registerMusicGenerationProvider(...)`       | Génération musicale                                                                           |
| `api.registerVideoGenerationProvider(...)`       | Génération vidéo                                                                              |
| `api.registerWebFetchProvider(...)`              | Fournisseur de récupération / extraction de contenu Web                                       |
| `api.registerWebSearchProvider(...)`             | Recherche Web                                                                                 |
| `api.registerCompactionProvider(...)`            | Backend enfichable de Compaction des transcriptions                                           |

Les fournisseurs de workers doivent également déclarer leur identifiant dans `contracts.workerProviders`.
Le cœur conserve l’intention durable avant `provision(profile, operationId)`. Les fournisseurs valident les paramètres avant l’allocation externe et lèvent `WorkerProviderError` en cas de rejet définitif du profil. `provision` doit reprendre le même bail lorsque l’identifiant d’opération se répète.
Le cœur conserve les paramètres de profil validés avec le bail et fournit cet instantané à `destroy({ leaseId, profile })`, qui doit être idempotent, ainsi qu’à `inspect({ leaseId, profile })`, qui renvoie `active`, `destroyed` ou `unknown`. Cela permet aux fournisseurs d’acheminer les appels de cycle de vie après le redémarrage d’un Gateway ou la suppression d’un profil nommé. Les points de terminaison SSH utilisent un `SecretRef` pour `keyRef`, jamais du contenu de clé en ligne, et incluent une `hostKey` provenant d’une sortie d’approvisionnement approuvée, exactement sous la forme `algorithm base64`, sans nom d’hôte ni commentaire. Le cœur épingle `hostKey` et ne fait jamais confiance à une clé provenant de la première connexion. Un fournisseur qui génère dynamiquement une `keyRef` peut implémenter `resolveSshIdentity({ leaseId, profile, keyRef })` ; lorsqu’il est présent, ce résolveur fait autorité, tandis que les fournisseurs qui n’en disposent pas utilisent le résolveur générique de secrets configuré.
Les fournisseurs dont les baux sont renouvelables peuvent également implémenter `renew(leaseId)`.
`inspect` doit lever une erreur en cas d’échec transitoire ou indéterminé ; il ne doit renvoyer `unknown` qu’en cas d’absence faisant autorité. Le cœur marque comme orphelin un enregistrement local actif ou considère l’absence comme l’achèvement de la suppression après une demande de destruction persistée.

Les fournisseurs de plongements enregistrés avec `api.registerEmbeddingProvider(...)` doivent
également être répertoriés dans `contracts.embeddingProviders` dans le manifeste du plugin. Il
s’agit de la surface générique de plongement pour la génération vectorielle réutilisable. La recherche en mémoire
peut utiliser cette surface générique de fournisseur. L’ancienne interface
`api.registerMemoryEmbeddingProvider(...)` et
`contracts.memoryEmbeddingProviders` est une compatibilité obsolète pendant que
les fournisseurs existants propres à la mémoire migrent.

Les fournisseurs propres à la mémoire qui exposent encore un `batchEmbed(...)` à l’exécution restent soumis
au contrat existant de traitement par lots par fichier, sauf si leur exécution définit explicitement
`sourceWideBatchEmbed: true`. Cette activation permet à l’hôte de mémoire d’envoyer des segments provenant
de plusieurs fichiers de mémoire modifiés et de sources activées dans un seul appel `batchEmbed(...)`, dans
la limite des tailles de lot de l’hôte. Les adaptateurs de traitement par lots qui téléversent des fichiers de requêtes JSONL doivent
fractionner les tâches du fournisseur avant d’atteindre leur limite de taille de téléversement ainsi que leur limite de nombre de requêtes.
Le fournisseur doit renvoyer un plongement par segment d’entrée, dans le même ordre que
`batch.chunks` ; omettez l’indicateur lorsque le fournisseur attend des lots locaux à chaque fichier ou
ne peut pas préserver l’ordre des entrées dans une tâche plus vaste couvrant l’ensemble des sources.

### Outils et commandes

Utilisez [`defineToolPlugin`](/fr/plugins/tool-plugins) pour les plugins simples composés uniquement d’outils
avec des noms d’outils fixes. Utilisez directement `api.registerTool(...)` pour les plugins mixtes
ou l’enregistrement entièrement dynamique d’outils.

| Méthode                                | Ce qu’elle enregistre                                                                                                                                                       |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerTool(tool, opts?)`        | Outil d’agent (obligatoire ou `{ optional: true }`)                                                                                                                         |
| `api.registerCommand(def)`             | Commande personnalisée (contourne le LLM)                                                                                                                                   |
| `api.registerNodeHostCommand(command)` | Commande traitée par `openclaw node run` ; les métadonnées facultatives `agentTool` peuvent l’exposer comme outil visible par l’agent lorsque le Node est connecté |

Les commandes de plugin peuvent définir `agentPromptGuidance` lorsque l’agent a besoin d’une courte
indication d’acheminement détenue par la commande. Limitez ce texte à la commande elle-même ; n’ajoutez pas
de politique propre à un fournisseur ou à un plugin aux générateurs de prompts du cœur.

Les indications peuvent être des chaînes héritées, qui s’appliquent à chaque surface de prompt, ou
des entrées structurées :

```ts
agentPromptGuidance: [
  "Indication globale sur la commande.",
  { text: "Afficher ceci uniquement dans le prompt OpenClaw principal.", surfaces: ["openclaw_main"] },
];
```

Les `surfaces` structurées peuvent inclure `openclaw_main`, `codex_app_server`,
`cli_backend`, `acp_backend` ou `subagent`. `pi_main` reste un alias obsolète
de `openclaw_main`. Omettez `surfaces` pour appliquer intentionnellement l’indication à toutes les surfaces. Ne
transmettez pas un tableau `surfaces` vide ; il est rejeté afin qu’une perte accidentelle de portée ne
transforme pas le texte en prompt global.

Les instructions de développement du serveur d’application Codex natif sont plus strictes que celles des autres surfaces de
prompt : seules les indications dont la portée inclut explicitement `codex_app_server` sont promues dans
ce niveau de priorité supérieur. Les indications sous forme de chaînes héritées et les indications structurées sans portée
restent accessibles aux surfaces de prompt autres que Codex à des fins de compatibilité.

Les commandes d’hôte Node s’exécutent sur l’hôte Node connecté, et non dans le
processus Gateway. Si `agentTool` est présent, le Node publie un descripteur après
une connexion réussie au Gateway ; le Gateway l’expose aux exécutions d’agent
uniquement tant que ce Node est connecté et seulement si la `command` du
descripteur figure dans la surface de commandes approuvée du Node. Définissez
`agentTool.defaultPlatforms` pour ajouter une commande non dangereuse à la liste
d’autorisation par défaut des commandes Node ; sinon, exigez explicitement
`gateway.nodes.allowCommands` ou une politique d’invocation de Node. Le
`agentTool.name` doit être compatible avec le fournisseur : commencer par une
lettre, utiliser uniquement des lettres, des chiffres, des traits de
soulignement ou des tirets, et ne pas dépasser 64 caractères. Les outils Node
adossés à MCP peuvent définir des métadonnées `agentTool.mcp` afin que les
surfaces de catalogue et de recherche d’outils puissent afficher l’identité du
serveur/de l’outil MCP distant, mais l’exécution passe toujours par la commande
Node annoncée.

### Infrastructure

| Méthode                                         | Ce qu’elle enregistre                                         |
| ----------------------------------------------- | ------------------------------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Hook d’événement                                              |
| `api.registerHttpRoute(params)`                 | Point de terminaison HTTP du Gateway                          |
| `api.registerGatewayMethod(name, handler)`      | Méthode RPC du Gateway                                        |
| `api.registerGatewayDiscoveryService(service)`  | Annonceur local de découverte du Gateway                      |
| `api.registerCli(registrar, opts?)`             | Sous-commande CLI                                             |
| `api.registerNodeCliFeature(registrar, opts?)`  | Fonctionnalité CLI de Node sous `openclaw nodes`              |
| `api.registerService(service)`                  | Service en arrière-plan                                      |
| `api.registerInteractiveHandler(registration)`  | Gestionnaire interactif                                      |
| `api.registerAgentToolResultMiddleware(...)`    | Middleware d’exécution pour les résultats d’outils            |
| `api.registerMemoryPromptSupplement(builder)`   | Section d’invite additive liée à la mémoire                   |
| `api.registerMemoryCorpusSupplement(adapter)`   | Corpus additif de recherche/lecture de la mémoire             |
| `api.registerHostedMediaResolver(resolver)`     | Résolveur d’URL de médias hébergés de type navigateur         |
| `api.registerTextTransforms(transforms)`        | Réécritures de texte de compatibilité des invites/messages appartenant au Plugin |
| `api.registerConfigMigration(migrate)`          | Migration légère de configuration exécutée avant le chargement de l’exécution du Plugin |
| `api.registerMigrationProvider(provider)`       | Importateur pour `openclaw migrate`                           |
| `api.registerAutoEnableProbe(probe)`            | Sonde de configuration pouvant activer automatiquement ce Plugin |
| `api.registerReload(registration)`              | Politique de préfixe de configuration redémarrage/à chaud/sans opération pour la gestion du rechargement |
| `api.registerNodeHostCommand(command)`          | Gestionnaire de commandes exposé aux Nodes appairés           |
| `api.registerNodeInvokePolicy(policy)`          | Politique de liste d’autorisation/approbation pour les commandes invoquées par un Node |
| `api.registerSecurityAuditCollector(collector)` | Collecteur de constats pour `openclaw security audit`         |

Les générateurs de suppléments d’invite mémoire reçoivent un contexte facultatif
`agentId`, `agentSessionKey` et `sandboxed`. Les appels `search` et `get` des
suppléments de corpus mémoire reçoivent un contexte facultatif `agentId` et
`sandboxed`. Les Plugins dotés d’un stockage appartenant à l’agent doivent
résoudre ce stockage pour chaque appel au lieu de capturer un chemin global
unique lors de l’enregistrement. Si un identifiant d’agent est requis mais
absent dans une opération multi-agent, refusez l’opération plutôt que de choisir
un agent arbitraire.

Les gestionnaires interactifs Telegram peuvent renvoyer `{ submitText }` pour
acheminer le texte par le chemin entrant normal de l’agent Telegram une fois le
gestionnaire exécuté avec succès. OpenClaw conserve le bouton de rappel lorsque
la politique entrante ignore le texte ou que le traitement échoue, afin que
l’utilisateur puisse réessayer après la modification de la condition bloquante.
Ce champ de résultat est propre à Telegram ; les autres canaux conservent leurs
propres contrats de résultat interactif.

### Hooks d’hôte pour les Plugins de workflow

Les hooks d’hôte sont les points d’intégration du SDK destinés aux Plugins qui
doivent participer au cycle de vie de l’hôte plutôt que de simplement ajouter
un fournisseur, un canal ou un outil. Il s’agit de contrats génériques ; le mode
Plan peut les utiliser, tout comme les workflows d’approbation, les contrôles de
politique d’espace de travail, les moniteurs en arrière-plan, les assistants de
configuration et les Plugins compagnons d’interface utilisateur.

| Méthode                                                                              | Contrat dont elle est responsable                                                                                                                           |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `api.session.state.registerSessionExtension(...)`                                    | État de session appartenant au Plugin, compatible JSON et projeté au moyen des sessions Gateway                                                              |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Contexte durable injecté exactement une fois dans le prochain tour d’agent d’une session                                                                     |
| `api.registerTrustedToolPolicy(...)`                                                 | Politique d’outil de confiance, contrôlée par le manifeste et antérieure aux Plugins, pouvant bloquer ou réécrire les paramètres d’outil                     |
| `api.registerToolMetadata(...)`                                                      | Métadonnées d’affichage du catalogue d’outils sans modification de l’implémentation de l’outil                                                               |
| `api.registerCommand(...)`                                                           | Commandes de Plugin délimitées ; les résultats de commande peuvent définir `continueAgent: true` ou `suppressReply: true` ; les commandes natives Discord prennent en charge `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Descripteurs de contribution à l’interface de contrôle pour les surfaces de session, d’outil, d’exécution, de paramètres ou d’onglet                         |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Rappels de nettoyage pour les ressources d’exécution appartenant au Plugin sur les chemins de réinitialisation/suppression/rechargement                      |
| `api.agent.events.registerAgentEventSubscription(...)`                               | Abonnements assainis aux événements pour l’état des workflows et les moniteurs                                                                                |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | État de travail temporaire du Plugin par exécution, effacé lors du cycle de vie terminal de l’exécution                                                      |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Métadonnées de nettoyage des tâches de planificateur appartenant au Plugin ; ne planifie aucun travail et ne crée aucun enregistrement de tâche              |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Livraison de pièces jointes de fichiers, réservée aux Plugins intégrés et assurée par l’hôte, vers la route sortante directe active de la session            |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Tours de session planifiés adossés à Cron, réservés aux Plugins intégrés, avec nettoyage par étiquette                                                       |
| `api.session.controls.registerSessionAction(...)`                                    | Actions de session typées que les clients peuvent distribuer par l’intermédiaire du Gateway                                                                  |

Un descripteur `surface: "tab"` ajoute un onglet à la barre latérale de
l’interface de contrôle. Les descripteurs d’onglet des Plugins actifs sont
annoncés aux clients du tableau de bord dans le message hello du Gateway
(`controlUiTabs`), de sorte que l’onglet n’apparaît que lorsque le Plugin est
activé. Les Plugins intégrés peuvent fournir une vue de tableau de bord native
pour leur onglet ; les autres Plugins peuvent définir `path` vers une route HTTP
du Plugin (voir `api.registerHttpRoute(...)`) que le tableau de bord affiche
dans un cadre isolé. `icon` est une indication de nom d’icône du tableau de
bord, `group` sélectionne la section de la barre latérale (`control` ou
`agent`), `order` détermine l’ordre parmi les onglets de Plugins, et
`requiredScopes` masque l’onglet pour les connexions dépourvues de ces portées
d’opérateur :

```typescript
api.session.controls.registerControlUiDescriptor({
  surface: "tab",
  id: "logbook",
  label: "Journal",
  description: "Votre journée sous forme de chronologie, créée à partir de captures d’écran.",
  icon: "sun",
  group: "control",
  requiredScopes: ["operator.write"],
});
```

Utilisez les espaces de noms regroupés pour le nouveau code de Plugin :

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

Les méthodes plates équivalentes restent disponibles en tant qu’alias de
compatibilité obsolètes pour les Plugins existants. N’ajoutez pas de nouveau
code de Plugin appelant directement `api.registerSessionExtension`,
`api.enqueueNextTurnInjection`, `api.registerControlUiDescriptor`,
`api.registerRuntimeLifecycle`, `api.registerAgentEventSubscription`,
`api.emitAgentEvent`, `api.setRunContext`, `api.getRunContext`,
`api.clearRunContext`, `api.registerSessionSchedulerJob`,
`api.registerSessionAction`, `api.sendSessionAttachment`,
`api.scheduleSessionTurn` ou `api.unscheduleSessionTurnsByTag`.

`scheduleSessionTurn(...)` est une commodité limitée à la session qui repose sur
le planificateur Cron du Gateway. Cron gère la temporisation et crée
l’enregistrement de tâche en arrière-plan lorsque le tour s’exécute ; le SDK de
Plugin limite uniquement la session cible, la dénomination appartenant au
Plugin et le nettoyage. Utilisez `api.runtime.tasks.managedFlows` dans le tour
planifié lorsque le travail lui-même nécessite un état durable de flux de tâches
en plusieurs étapes.

Les contrats séparent intentionnellement les responsabilités :

- Les Plugins externes peuvent posséder des extensions de session, des
  descripteurs d’interface utilisateur, des commandes, des métadonnées d’outil,
  des injections au tour suivant et des hooks normaux.
- Les politiques d’outils de confiance s’exécutent avant les hooks
  `before_tool_call` ordinaires et bénéficient de la confiance de l’hôte. Les
  politiques intégrées s’exécutent en premier ; les politiques des Plugins
  installés nécessitent une activation explicite ainsi que leurs identifiants
  locaux dans `contracts.trustedToolPolicies`, puis s’exécutent dans l’ordre de
  chargement des Plugins. Les identifiants de politique sont limités au Plugin
  qui les enregistre.
- La propriété des commandes réservées est limitée aux Plugins intégrés. Les
  Plugins externes doivent utiliser leurs propres noms de commande ou alias.
- `allowPromptInjection=false` désactive les hooks qui modifient les invites, y
  compris `agent_turn_prepare`, `before_prompt_build`,
  `heartbeat_prompt_contribution`, les champs d’invite de l’ancien
  `before_agent_start` et `enqueueNextTurnInjection`.

Exemples de consommateurs hors mode Plan :

| Archétype de Plugin                    | Hooks utilisés                                                                                                                                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Flux de travail d’approbation          | Extension de session, poursuite de commande, injection au tour suivant, descripteur d’interface utilisateur                                                                                             |
| Barrière de politique budget/espace de travail | Politique des outils de confiance, métadonnées des outils, projection de session                                                                                                               |
| Moniteur de cycle de vie en arrière-plan | Nettoyage du cycle de vie de l’environnement d’exécution, abonnement aux événements de l’agent, propriété/nettoyage du planificateur de session, contribution au prompt Heartbeat, descripteur d’interface utilisateur |
| Assistant de configuration ou d’intégration | Extension de session, commandes à portée limitée, descripteur de Control UI                                                                                                                       |

<Note>
  Les espaces de noms d’administration réservés du cœur (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) restent toujours `operator.admin`, même si un Plugin tente d’attribuer une
  portée de méthode Gateway plus restreinte. Préférez des préfixes propres au Plugin pour les
  méthodes appartenant au Plugin.
</Note>

<Accordion title="Quand utiliser l’intergiciel de résultat d’outil">
  Les Plugins intégrés et les Plugins installés explicitement activés dont les
  contrats de manifeste correspondent peuvent utiliser `api.registerAgentToolResultMiddleware(...)`
  lorsqu’ils doivent réécrire le résultat d’un outil après son exécution et avant que
  l’environnement d’exécution ne renvoie ce résultat au modèle. Il s’agit du point d’extension
  de confiance, indépendant de l’environnement d’exécution, pour les réducteurs de sortie
  asynchrones tels que tokenjuice.

Les Plugins doivent déclarer `contracts.agentToolResultMiddleware` pour chaque
environnement d’exécution ciblé, par exemple `["openclaw", "codex"]`. Les Plugins
installés sans ce contrat, ou sans activation explicite, ne peuvent pas enregistrer
cet intergiciel ; conservez les hooks de Plugin OpenClaw habituels pour les tâches
qui ne nécessitent pas que le résultat d’outil soit traité avant le modèle. L’ancien
chemin d’enregistrement par fabrique d’extensions réservé à l’exécuteur intégré a été supprimé.
</Accordion>

### Enregistrement de la découverte du Gateway

`api.registerGatewayDiscoveryService(...)` permet à un Plugin d’annoncer le
Gateway actif sur un transport de découverte local tel que mDNS/Bonjour. OpenClaw
appelle le service au démarrage du Gateway lorsque la découverte locale est activée,
lui transmet les ports actuels du Gateway et des données indicatives TXT non secrètes,
puis appelle le gestionnaire `stop` renvoyé lors de l’arrêt du Gateway.

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

Les Plugins de découverte du Gateway ne doivent pas traiter les valeurs TXT
annoncées comme des secrets ou comme un mécanisme d’authentification. La découverte
constitue une indication de routage ; l’authentification du Gateway et l’épinglage
TLS restent responsables de la confiance.

### Métadonnées d’enregistrement de la CLI

`api.registerCli(registrar, opts?)` accepte deux types de métadonnées de commande :

- `commands` : noms de commandes explicites appartenant au mécanisme d’enregistrement
- `descriptors` : descripteurs de commandes utilisés lors de l’analyse pour l’aide de la CLI,
  le routage et l’enregistrement différé de la CLI du Plugin
- `parentPath` : chemin facultatif de la commande parente pour les groupes de commandes imbriqués, tel que
  `["nodes"]`

Pour les fonctionnalités de nœuds appairés, préférez
`api.registerNodeCliFeature(registrar, opts?)`. Il s’agit d’une petite enveloppe autour de
`api.registerCli(..., { parentPath: ["nodes"] })` qui rend les commandes telles que
`openclaw nodes canvas` explicitement identifiables comme des fonctionnalités de nœud appartenant au Plugin.

Si vous souhaitez qu’une commande de Plugin reste chargée de manière différée dans le chemin
normal de la CLI racine, fournissez des `descriptors` couvrant chaque racine de commande
de premier niveau exposée par ce mécanisme d’enregistrement.

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

Les commandes imbriquées reçoivent la commande parente résolue sous la forme `program` :

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
        description: "Capturer ou restituer le contenu du canevas depuis un nœud appairé",
        hasSubcommands: true,
      },
    ],
  },
);
```

Utilisez uniquement `commands` lorsque vous n’avez pas besoin d’un enregistrement différé
de la CLI racine. Ce chemin de compatibilité à chargement immédiat reste pris en charge,
mais il n’installe pas d’espaces réservés fondés sur des descripteurs pour le chargement
différé lors de l’analyse.

### Enregistrement d’un backend de CLI

`api.registerCliBackend(...)` permet à un Plugin de définir la configuration par défaut
d’un backend de CLI d’IA local tel que `claude-cli` ou `my-cli`.

- L’`id` du backend devient le préfixe de fournisseur dans les références de modèle telles que `my-cli/gpt-5`.
- La `config` du backend utilise la même structure que `agents.defaults.cliBackends.<id>`.
- La configuration utilisateur reste prioritaire. OpenClaw fusionne `agents.defaults.cliBackends.<id>` par-dessus la
  valeur par défaut du Plugin avant d’exécuter la CLI.
- Utilisez `normalizeConfig` lorsqu’un backend nécessite des réécritures de compatibilité après la fusion
  (par exemple, pour normaliser d’anciennes structures d’indicateurs).
- Utilisez `resolveExecutionArgs` pour les réécritures d’argv propres à une requête qui relèvent
  du dialecte de la CLI, par exemple pour associer les niveaux de réflexion d’OpenClaw à un indicateur
  natif d’effort. Le hook reçoit `ctx.executionMode` ; utilisez `"side-question"` pour ajouter
  des indicateurs d’isolation natifs au backend pour les appels éphémères `/btw`. Si ces indicateurs
  désactivent de manière fiable les outils natifs pour une CLI qui les active normalement en permanence,
  déclarez également `sideQuestionToolMode: "disabled"`.
- Les backends capables de désactiver tous les outils natifs pour une exécution donnée peuvent déclarer
  `nativeToolMode: "selectable"`. Les appels restreints transmettent un tuple
  `ctx.toolAvailability.native` vide ainsi qu’une liste d’autorisation MCP exacte et isolée de l’hôte ;
  `resolveExecutionArgs` doit appliquer les deux aux arguments argv finaux d’une nouvelle exécution ou
  d’une reprise. OpenClaw échoue de manière sécurisée si le backend ne peut pas le faire.

Pour un guide de création de bout en bout, consultez
[Plugins de backend de CLI](/fr/plugins/cli-backend-plugins).

### Emplacements exclusifs

| Méthode                                    | Ce qu’elle enregistre                                                                                                                                                                                                            |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Moteur de contexte (un seul actif à la fois). Les rappels de cycle de vie reçoivent `runtimeSettings` lorsque l’hôte peut fournir des diagnostics de modèle/fournisseur/mode ; les anciens moteurs stricts sont réessayés sans cette clé. |
| `api.registerMemoryCapability(capability)` | Fonctionnalité de mémoire unifiée                                                                                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | Générateur de section de prompt de mémoire                                                                                                                                                                                        |
| `api.registerMemoryFlushPlan(resolver)`    | Résolveur de plan de vidage de la mémoire                                                                                                                                                                                         |
| `api.registerMemoryRuntime(runtime)`       | Adaptateur d’environnement d’exécution de la mémoire                                                                                                                                                                              |

### Adaptateurs d’intégration vectorielle de mémoire obsolètes

| Méthode                                        | Ce qu’elle enregistre                                  |
| ---------------------------------------------- | ------------------------------------------------------ |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptateur d’intégration vectorielle de mémoire pour le Plugin actif |

- `registerMemoryCapability` est l’API exclusive de Plugin de mémoire à privilégier.
- `registerMemoryCapability` peut également exposer `publicArtifacts.listArtifacts(...)`
  afin que les Plugins complémentaires puissent utiliser les artefacts de mémoire exportés via
  `openclaw/plugin-sdk/memory-host-core` au lieu d’accéder à l’organisation privée d’un
  Plugin de mémoire particulier.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` et
  `registerMemoryRuntime` sont des API exclusives de Plugin de mémoire compatibles avec les anciennes versions.
- `MemoryFlushPlan.model` peut épingler le tour de vidage à une référence exacte
  `provider/model`, telle que `ollama/qwen3:8b`, sans hériter de la chaîne de repli active.
- `registerMemoryEmbeddingProvider` est obsolète. Les nouveaux fournisseurs
  d’intégrations vectorielles doivent utiliser `api.registerEmbeddingProvider(...)` et
  `contracts.embeddingProviders`.
- Les fournisseurs existants propres à la mémoire continuent de fonctionner pendant la fenêtre
  de migration, mais l’inspection des Plugins signale cela comme une dette de compatibilité pour
  les Plugins non intégrés.

### Événements et cycle de vie

| Méthode                                      | Ce qu’elle fait                           |
| -------------------------------------------- | ----------------------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook typé de cycle de vie                 |
| `api.onConversationBindingResolved(handler)` | Rappel de résolution de liaison de conversation |

Consultez [Hooks de Plugin](/fr/plugins/hooks) pour des exemples, les noms de hooks courants
et la sémantique des protections.

### Sémantique de décision des hooks

`before_install` est un hook de cycle de vie de l’environnement d’exécution du Plugin,
et non la surface de politique d’installation de l’opérateur. Utilisez
`security.installPolicy` lorsqu’une décision d’autorisation ou de blocage doit couvrir
les chemins d’installation ou de mise à jour de la CLI et ceux reposant sur le Gateway.

- `before_tool_call` : le renvoi de `{ block: true }` est terminal. Dès qu’un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `before_tool_call` : le renvoi de `{ block: false }` est traité comme une absence de décision (comme si `block` était omis), et non comme un remplacement.
- `before_install` : le renvoi de `{ block: true }` est terminal. Dès qu’un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `before_install` : le renvoi de `{ block: false }` est traité comme une absence de décision (comme si `block` était omis), et non comme un remplacement.
- `reply_dispatch` : le renvoi de `{ handled: true, ... }` est terminal. Dès qu’un gestionnaire prend en charge la distribution, les gestionnaires de priorité inférieure et le chemin de distribution par défaut du modèle sont ignorés.
- `message_sending` : le renvoi de `{ cancel: true }` est terminal. Dès qu’un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `message_sending` : le renvoi de `{ cancel: false }` est traité comme une absence de décision (comme si `cancel` était omis), et non comme un remplacement.
- `message_received` : utilisez le champ typé `threadId` lorsque vous devez acheminer un fil ou un sujet entrant. Réservez `metadata` aux données supplémentaires propres au canal.
- `message_sending` : utilisez les champs d’acheminement typés `replyToId` / `threadId` avant de recourir aux `metadata` propres au canal.
- `gateway_start` : utilisez `ctx.config`, `ctx.workspaceDir` et `ctx.getCron?.()` pour l’état de démarrage appartenant au Gateway au lieu de dépendre des hooks internes `gateway:startup`. Cron peut encore être en cours de chargement à ce stade.
- `cron_reconciled` : reconstruisez une projection Cron externe complète après le démarrage ou le rechargement du planificateur. Elle inclut `reason` et l’état `enabled` effectif, y compris `enabled: false`, tandis que `ctx.getCron?.()` renvoie le planificateur réconcilié exact. Transmettez `ctx.abortSignal` aux opérations de projection durable ; il est interrompu lorsque cet instantané du planificateur est remplacé ou que le Gateway se ferme.
- `cron_changed` : observez les modifications du cycle de vie de Cron appartenant au Gateway. Les événements `scheduled` et `removed` sont des indications de réconciliation postérieures à la validation, et non un journal ordonné des différences. Le champ `event.nextRunAtMs` d’un événement planifié est absent lorsque la tâche n’a pas de prochain réveil ; un événement de suppression contient toujours l’instantané de la tâche supprimée.

Les planificateurs de réveil externes doivent appliquer un délai anti-rebond aux événements `cron_changed` ou les regrouper,
puis relire la vue durable complète depuis le dernier planificateur capturé par
`cron_reconciled`. N’adoptez pas le planificateur provenant d’un contexte `cron_changed` : une
indication détachée issue d’un ancien planificateur peut chevaucher un rechargement ultérieur.

Utilisez `cron_reconciled` comme déclencheur d’instantané complet pour l’état durable chargé au
démarrage du Gateway ou lors du remplacement du planificateur. Il n’est pas réexécuté lors d’un
rechargement à chaud limité au Plugin. Les gestionnaires d’observation s’exécutent en parallèle, et les
distributions sans attente de résultat peuvent se chevaucher ; les consommateurs ne doivent donc pas dépendre de l’ordre d’achèvement des événements.
Conservez OpenClaw comme source de vérité pour les vérifications d’échéance et l’exécution.

Pour un adaptateur à exécution unique avec remplacement durable, nouvelles tentatives et temporisation, ainsi qu’un
arrêt propre, consultez [Projection Cron externe sécurisée](/fr/plugins/hooks#safe-external-cron-projection).

### Champs de l’objet API

| Champ                    | Type                      | Description                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Identifiant du Plugin                                                                       |
| `api.name`               | `string`                  | Nom d’affichage                                                                             |
| `api.version`            | `string?`                 | Version du Plugin (facultative)                                                             |
| `api.description`        | `string?`                 | Description du Plugin (facultative)                                                         |
| `api.source`             | `string`                  | Chemin source du Plugin                                                                     |
| `api.rootDir`            | `string?`                 | Répertoire racine du Plugin (facultatif)                                                    |
| `api.config`             | `OpenClawConfig`          | Instantané de la configuration actuelle (instantané d’exécution actif en mémoire lorsqu’il est disponible) |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuration propre au Plugin provenant de `plugins.entries.<id>.config`                   |
| `api.runtime`            | `PluginRuntime`           | [Utilitaires d’exécution](/fr/plugins/sdk-runtime)                                              |
| `api.logger`             | `PluginLogger`            | Journaliseur à portée limitée (`debug`, `info`, `warn`, `error`)                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | Mode de chargement actuel ; `"setup-runtime"` est la fenêtre légère de démarrage/configuration précédant le chargement complet du point d’entrée |
| `api.resolvePath(input)` | `(string) => string`      | Résout un chemin par rapport à la racine du Plugin                                           |

## Convention relative aux modules internes

Dans votre Plugin, utilisez des fichiers barrel locaux pour les importations internes :

```text
my-plugin/
  api.ts            # Exports publics destinés aux consommateurs externes
  runtime-api.ts    # Exports d’exécution réservés à un usage interne
  index.ts          # Point d’entrée du Plugin
  setup-entry.ts    # Point d’entrée léger réservé à la configuration (facultatif)
```

<Warning>
  N’importez jamais votre propre Plugin via `openclaw/plugin-sdk/<your-plugin>`
  dans le code de production. Acheminez les importations internes via `./api.ts` ou
  `./runtime-api.ts`. Le chemin du SDK constitue uniquement le contrat externe.
</Warning>

Les surfaces publiques des Plugins intégrés chargées par façade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` et les fichiers d’entrée publics similaires) utilisent de préférence
l’instantané actif de la configuration d’exécution lorsqu’OpenClaw est déjà en cours d’exécution. Si aucun instantané
d’exécution n’existe encore, elles utilisent en secours le fichier de configuration résolu sur le disque.
Les façades des Plugins intégrés empaquetés doivent être chargées via les chargeurs de façades de Plugins
d’OpenClaw ; les importations directes depuis `dist/extensions/...` contournent le manifeste
et les vérifications du fichier associé d’exécution que les installations empaquetées utilisent pour le code appartenant au Plugin.

Les Plugins de fournisseur peuvent exposer un barrel de contrat local et restreint au Plugin lorsqu’un
utilitaire est volontairement propre au fournisseur et n’a pas encore sa place dans un sous-chemin générique du SDK.
Exemples intégrés :

- **Anthropic** : interface publique `api.ts` / `contract-api.ts` pour les utilitaires d’en-tête bêta de Claude
  et de flux `service_tier`.
- **`@openclaw/openai-provider`** : `api.ts` exporte les constructeurs de fournisseur,
  les utilitaires de modèle par défaut et les constructeurs de fournisseur en temps réel.
- **`@openclaw/openrouter-provider`** : `api.ts` exporte le constructeur de fournisseur
  ainsi que les utilitaires d’intégration et de configuration.

<Warning>
  Le code de production d’une extension doit également éviter les importations
  `openclaw/plugin-sdk/<other-plugin>`. Si un utilitaire est réellement partagé, transférez-le vers un sous-chemin neutre du SDK,
  tel que `openclaw/plugin-sdk/speech`, `.../provider-model-shared` ou une autre
  surface orientée capacités, plutôt que de coupler deux Plugins.
</Warning>

## Pages connexes

<CardGroup cols={2}>
  <Card title="Points d’entrée" icon="door-open" href="/fr/plugins/sdk-entrypoints">
    Options de `definePluginEntry` et `defineChannelPluginEntry`.
  </Card>
  <Card title="Utilitaires d’exécution" icon="gears" href="/fr/plugins/sdk-runtime">
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
