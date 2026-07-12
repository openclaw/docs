---
read_when:
    - Création ou débogage de plugins OpenClaw natifs
    - Comprendre le modèle de capacités des plugins ou les limites de responsabilité
    - Travail sur le pipeline de chargement ou le registre des plugins
    - Implémentation de hooks d’exécution de fournisseur ou de plugins de canal
sidebarTitle: Internals
summary: 'Fonctionnement interne des Plugins : modèle de capacités, propriété, contrats, pipeline de chargement et utilitaires d’exécution'
title: Fonctionnement interne des Plugins
x-i18n:
    generated_at: "2026-07-12T15:31:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 07ab077080285b5b7a93f58f71cd00be62cfd79cdc2cfa40f0e64cc91cc5ac46
    source_path: plugins/architecture.md
    workflow: 16
---

Ceci est la **référence détaillée de l’architecture** du système de plugins OpenClaw. Pour les guides pratiques, commencez par l’une des pages spécialisées ci-dessous.

<CardGroup cols={2}>
  <Card title="Installer et utiliser des plugins" icon="plug" href="/fr/tools/plugin">
    Guide destiné aux utilisateurs finaux pour ajouter, activer et dépanner des plugins.
  </Card>
  <Card title="Créer des plugins" icon="rocket" href="/fr/plugins/building-plugins">
    Tutoriel de création d’un premier plugin avec le plus petit manifeste fonctionnel.
  </Card>
  <Card title="Plugins de canal" icon="comments" href="/fr/plugins/sdk-channel-plugins">
    Créez un plugin de canal de messagerie.
  </Card>
  <Card title="Plugins de fournisseur" icon="microchip" href="/fr/plugins/sdk-provider-plugins">
    Créez un plugin de fournisseur de modèles.
  </Card>
  <Card title="Présentation du SDK" icon="book" href="/fr/plugins/sdk-overview">
    Référence de la table des importations et de l’API d’enregistrement.
  </Card>
</CardGroup>

## Modèle public de capacités

Les capacités constituent le modèle public de **plugin natif** dans OpenClaw. Chaque plugin OpenClaw natif s’enregistre pour un ou plusieurs types de capacités :

| Capacité                        | Méthode d’enregistrement                         | Exemples de plugins                 |
| ------------------------------- | ------------------------------------------------ | ----------------------------------- |
| Inférence de texte              | `api.registerProvider(...)`                      | `anthropic`, `openai`               |
| Backend d’inférence CLI         | `api.registerCliBackend(...)`                    | `anthropic`, `openai`               |
| Plongements                     | `api.registerEmbeddingProvider(...)`             | Plugins vectoriels du fournisseur   |
| Synthèse vocale                 | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`           |
| Transcription en temps réel     | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                            |
| Voix en temps réel              | `api.registerRealtimeVoiceProvider(...)`         | `google`, `openai`                  |
| Compréhension des médias        | `api.registerMediaUnderstandingProvider(...)`    | `google`, `openai`                  |
| Source de transcriptions        | `api.registerTranscriptSourceProvider(...)`      | `discord`                           |
| Génération d’images             | `api.registerImageGenerationProvider(...)`       | `fal`, `google`, `openai`           |
| Génération musicale             | `api.registerMusicGenerationProvider(...)`       | `fal`, `google`, `minimax`          |
| Génération vidéo                | `api.registerVideoGenerationProvider(...)`       | `fal`, `google`, `qwen`             |
| Récupération de contenu web     | `api.registerWebFetchProvider(...)`              | `firecrawl`                         |
| Recherche web                   | `api.registerWebSearchProvider(...)`             | `brave`, `firecrawl`, `google`      |
| Canal / messagerie              | `api.registerChannel(...)`                       | `matrix`, `msteams`                 |
| Découverte du Gateway           | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                           |

<Note>
Un plugin qui n’enregistre aucune capacité, mais fournit des hooks, des outils, des services de découverte ou des services en arrière-plan, est un plugin **hérité fondé uniquement sur les hooks**. Ce modèle reste entièrement pris en charge.
</Note>

### Position sur la compatibilité externe

Le modèle de capacités est intégré au cœur et utilisé aujourd’hui par les plugins groupés et natifs, mais la compatibilité des plugins externes nécessite encore un critère plus strict que « il est exporté, donc il est figé ».

| Situation du plugin                                      | Recommandation                                                                                                                        |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Plugins externes existants                               | Maintenez le fonctionnement des intégrations fondées sur les hooks ; il s’agit de la référence de compatibilité.                      |
| Nouveaux plugins groupés ou natifs                       | Préférez l’enregistrement explicite des capacités aux accès internes propres à un fournisseur ou aux nouvelles conceptions à hooks seuls. |
| Plugins externes adoptant l’enregistrement des capacités | Autorisé, mais considérez les surfaces d’assistance propres aux capacités comme évolutives, sauf si la documentation les déclare stables. |

L’enregistrement des capacités est l’orientation prévue. Les hooks hérités restent la voie la plus sûre pour éviter toute rupture des plugins externes pendant la transition. Tous les sous-chemins d’assistance exportés ne se valent pas : préférez les contrats restreints et documentés aux exports d’assistance accessoires.

### Formes de plugins

OpenClaw classe chaque plugin chargé selon une forme déterminée par son comportement réel d’enregistrement, et pas uniquement par ses métadonnées statiques :

<AccordionGroup>
  <Accordion title="plain-capability">
    Enregistre exactement un type de capacité (par exemple, un plugin uniquement fournisseur comme `arcee` ou `chutes`).
  </Accordion>
  <Accordion title="hybrid-capability">
    Enregistre plusieurs types de capacités (par exemple, `openai` prend en charge l’inférence de texte, la synthèse vocale, la compréhension des médias et la génération d’images).
  </Accordion>
  <Accordion title="hook-only">
    Enregistre uniquement des hooks (typés ou personnalisés), sans capacités, outils, commandes ni services.
  </Accordion>
  <Accordion title="non-capability">
    Enregistre des outils, des commandes, des services ou des routes, mais aucune capacité.
  </Accordion>
</AccordionGroup>

Utilisez `openclaw plugins inspect <id>` pour afficher la forme d’un plugin et la répartition de ses capacités. Consultez la [référence de la CLI](/fr/cli/plugins#inspect) pour plus de détails.

### Hooks hérités

Le hook `before_agent_start` reste pris en charge comme voie de compatibilité pour les plugins fondés uniquement sur les hooks. Des plugins hérités utilisés en conditions réelles en dépendent encore.

Orientation :

- maintenir son fonctionnement
- le documenter comme hérité
- préférer `before_model_resolve` pour les substitutions de modèle ou de fournisseur
- préférer `before_prompt_build` pour les modifications de l’invite
- ne le supprimer qu’après une baisse de son utilisation réelle et lorsque la couverture des fixtures démontre que la migration est sûre

### Signaux de compatibilité

`openclaw doctor`, `openclaw plugins inspect <id>`, `openclaw status --all` et `openclaw plugins doctor` affichent les avis de compatibilité suivants :

| Signal                                         | Signification                                                                                                                                    |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **configuration valide**                       | La configuration est analysée correctement et les plugins sont résolus                                                                           |
| **hooks uniquement** (info)                    | Le plugin enregistre uniquement des hooks ; cette voie est prise en charge, mais n’a pas encore migré vers l’enregistrement des capacités         |
| **`before_agent_start` hérité** (avertissement) | Le plugin utilise le hook obsolète `before_agent_start` au lieu de `before_model_resolve`/`before_prompt_build`                                   |
| **API de plongement mémoire obsolète** (avertissement) | Un plugin non groupé utilise l’ancienne API de fournisseur de plongements propre à la mémoire au lieu de `registerEmbeddingProvider`        |
| **erreur bloquante**                           | La configuration est invalide ou le chargement du plugin a échoué                                                                                 |

Aucun des signaux informatifs ou d’avertissement ne compromet actuellement le fonctionnement de votre plugin. Ces signaux apparaissent également dans `openclaw status --all` et `openclaw plugins doctor`.

## Vue d’ensemble de l’architecture

Le système de plugins d’OpenClaw comporte quatre couches :

<Steps>
  <Step title="Manifeste et découverte">
    OpenClaw recherche les plugins candidats dans les chemins configurés, les racines des espaces de travail, les racines globales des plugins et les plugins groupés. La découverte lit d’abord les manifestes natifs `openclaw.plugin.json`, ainsi que les manifestes de lots pris en charge.
  </Step>
  <Step title="Activation et validation">
    Le cœur détermine si un plugin découvert est activé, désactivé, bloqué ou sélectionné pour un emplacement exclusif tel que la mémoire.
  </Step>
  <Step title="Chargement à l’exécution">
    Les plugins OpenClaw natifs sont chargés dans le processus et enregistrent leurs capacités dans un registre central. Le JavaScript empaqueté est chargé au moyen de la fonction native `require` ; le code source TypeScript local tiers utilise Jiti comme solution de secours d’urgence. Les lots compatibles sont normalisés sous forme d’enregistrements du registre sans importer de code d’exécution.
  </Step>
  <Step title="Consommation des surfaces">
    Le reste d’OpenClaw lit le registre afin d’exposer les outils, les canaux, la configuration des fournisseurs, les hooks, les routes HTTP, les commandes CLI et les services.
  </Step>
</Steps>

Pour la CLI des plugins en particulier, la découverte des commandes racines se déroule en deux phases :

- les métadonnées nécessaires lors de l’analyse proviennent de `registerCli(..., { descriptors: [...] })`
- le véritable module CLI du plugin peut rester chargé à la demande et s’enregistrer lors de la première invocation

Ainsi, le code CLI appartenant au plugin reste dans celui-ci, tout en permettant à OpenClaw de réserver les noms des commandes racines avant l’analyse.

La limite de conception importante est la suivante :

- la validation du manifeste et de la configuration doit fonctionner à partir des **métadonnées du manifeste et du schéma**, sans exécuter le code du plugin
- la découverte des capacités natives peut charger le code d’entrée d’un plugin de confiance afin de créer un instantané non actif du registre
- le comportement natif à l’exécution provient du chemin `register(api)` du module du plugin, avec `api.registrationMode === "full"`

Cette séparation permet à OpenClaw de valider la configuration, d’expliquer les plugins manquants ou désactivés, et de créer des indications pour l’interface utilisateur et les schémas avant l’activation complète de l’environnement d’exécution.

### Instantané des métadonnées des plugins et table de recherche

Au démarrage, le Gateway crée un seul `PluginMetadataSnapshot` pour l’instantané actuel de la configuration. Cet instantané ne contient que des métadonnées : il stocke l’index des plugins installés, le registre des manifestes, les diagnostics des manifestes, les tables de propriétaires, un normaliseur d’identifiants de plugins et les enregistrements des manifestes. Il ne contient ni modules de plugins chargés, ni SDK de fournisseurs, ni contenu de paquets, ni exports d’exécution.

La validation de la configuration tenant compte des plugins, l’activation automatique au démarrage et l’amorçage des plugins du Gateway utilisent cet instantané au lieu de reconstruire indépendamment les métadonnées des manifestes et de l’index. `PluginLookUpTable` est dérivée du même instantané et ajoute le plan des plugins à démarrer pour la configuration actuelle de l’environnement d’exécution.

Après le démarrage, le Gateway conserve l’instantané actuel des métadonnées comme un produit d’exécution remplaçable. Les découvertes répétées de fournisseurs à l’exécution peuvent réutiliser cet instantané au lieu de reconstruire l’index des installations et le registre des manifestes à chaque passage sur le catalogue des fournisseurs. L’instantané est effacé ou remplacé à l’arrêt du Gateway, lors de modifications de la configuration ou de l’inventaire des plugins, ainsi que lors d’écritures dans l’index des installations ; les appelants reviennent au chemin à froid des manifestes et de l’index lorsqu’aucun instantané actuel compatible n’existe. Les contrôles de compatibilité doivent inclure les racines de découverte des plugins, comme `plugins.load.paths` et l’espace de travail par défaut de l’agent, car les plugins de l’espace de travail font partie du périmètre des métadonnées.

L’instantané et la table de recherche maintiennent les décisions répétées du démarrage sur le chemin rapide :

- propriété des canaux
- démarrage différé des canaux
- identifiants des plugins de démarrage
- propriété des fournisseurs et des backends CLI
- propriété du fournisseur de configuration, des alias de commandes, du fournisseur du catalogue de modèles et du contrat de manifeste
- validation du schéma de configuration des plugins et du schéma de configuration des canaux
- décisions d’activation automatique au démarrage

La limite de sécurité repose sur le remplacement de l’instantané, et non sur sa mutation. Reconstruisez l’instantané lorsque la configuration, l’inventaire des plugins, les enregistrements d’installation ou la politique d’index persistante changent. Ne le considérez pas comme un vaste registre global mutable et ne conservez pas un nombre illimité d’instantanés historiques. Le chargement des plugins à l’exécution reste distinct des instantanés de métadonnées, afin qu’un état d’exécution obsolète ne puisse pas être dissimulé derrière un cache de métadonnées.

La règle de mise en cache est documentée dans [les détails internes de l’architecture des plugins](/fr/plugins/architecture-internals#plugin-cache-boundary) : les métadonnées des manifestes et de découverte sont actualisées, sauf si un appelant détient explicitement un instantané, une table de recherche ou un registre de manifestes pour le flux actuel. Les caches cachés de métadonnées et les durées de vie fondées sur l’horloge ne font pas partie du chargement des plugins. Seuls les caches du chargeur d’exécution, des modules et des artefacts de dépendances peuvent persister après le chargement effectif du code ou des artefacts installés.

Certains appelants du chemin à froid reconstruisent encore directement les registres de manifestes à partir de l’index persistant des plugins installés, au lieu de recevoir une `PluginLookUpTable` du Gateway. Ce chemin reconstruit désormais le registre à la demande ; préférez transmettre la table de recherche actuelle ou un registre de manifestes explicite dans les flux d’exécution lorsqu’un appelant en dispose déjà.

### Planification de l’activation

La planification de l’activation fait partie du plan de contrôle. Les appelants peuvent demander quels plugins sont pertinents pour une commande, un fournisseur, un canal, une route, un environnement d’agent ou une capacité spécifiques avant de charger des registres d’exécution plus larges.

Le planificateur préserve la compatibilité avec le comportement actuel du manifeste :

- les champs `activation.*` sont des indications explicites destinées au planificateur
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` et les hooks restent la solution de repli fondée sur la propriété définie dans le manifeste
- l’API du planificateur qui renvoie uniquement les identifiants reste disponible pour les appelants existants
- l’API de planification fournit des libellés de motif afin que les diagnostics puissent distinguer les indications explicites de la solution de repli fondée sur la propriété

<Warning>
Ne considérez pas `activation` comme un hook de cycle de vie ni comme un remplacement de `register(...)`. Il s’agit de métadonnées utilisées pour limiter le chargement. Privilégiez les champs de propriété lorsqu’ils décrivent déjà la relation ; utilisez `activation` uniquement pour fournir des indications supplémentaires au planificateur.
</Warning>

### Plugins de canal et outil de messagerie partagé

Les plugins de canal n’ont pas besoin d’enregistrer un outil distinct pour envoyer, modifier ou ajouter une réaction dans le cadre des actions de discussion normales. OpenClaw conserve un seul outil `message` partagé dans le cœur, tandis que les plugins de canal assurent derrière celui-ci la découverte et l’exécution propres au canal.

La répartition actuelle des responsabilités est la suivante :

- le cœur assure l’hébergement de l’outil `message` partagé, son intégration aux prompts, la gestion des sessions et des fils de discussion, ainsi que la répartition de l’exécution
- les plugins de canal assurent la découverte des actions selon le contexte, la découverte des capacités et tous les fragments de schéma propres au canal
- les plugins de canal définissent la grammaire de conversation de session propre au fournisseur, notamment la manière dont les identifiants de conversation encodent les identifiants de fil de discussion ou sont hérités des conversations parentes
- les plugins de canal exécutent l’action finale au moyen de leur adaptateur d’action

Pour les plugins de canal, la surface du SDK est `ChannelMessageActionAdapter.describeMessageTool(...)`. Cet appel de découverte unifié permet à un plugin de renvoyer simultanément ses actions visibles, ses capacités et ses contributions au schéma afin d’éviter toute divergence entre ces éléments.

Lorsqu’un paramètre de l’outil de messagerie propre à un canal contient une source multimédia, telle qu’un chemin local ou une URL de média distant, le plugin doit également renvoyer `mediaSourceParams` depuis `describeMessageTool(...)`. Le cœur utilise cette liste explicite pour appliquer la normalisation des chemins de la sandbox et les indications d’accès aux médias sortants sans coder en dur les noms de paramètres qui appartiennent au plugin. Privilégiez des tables de correspondance par action plutôt qu’une liste plate commune à tout le canal, afin qu’un paramètre multimédia réservé au profil ne soit pas normalisé pour des actions sans rapport telles que `send`.

Le cœur transmet le contexte d’exécution à cette étape de découverte. Les champs importants comprennent :

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- le champ entrant fiable `requesterSenderId`

Cela est important pour les plugins sensibles au contexte. Un canal peut masquer ou afficher des actions de messagerie en fonction du compte actif, de la salle, du fil de discussion ou du message actuel, ou encore de l’identité fiable du demandeur, sans coder en dur dans l’outil `message` du cœur des branches propres au canal.

C’est pourquoi les modifications du routage de l’exécuteur intégré relèvent toujours du plugin : l’exécuteur doit transmettre l’identité de la discussion et de la session actuelles à la frontière de découverte du plugin afin que l’outil `message` partagé expose, pour l’interaction en cours, la surface appropriée appartenant au canal.

Pour les assistants d’exécution appartenant aux canaux, les plugins intégrés doivent conserver l’environnement d’exécution dans leurs propres modules. Le cœur ne possède plus les environnements d’exécution des actions de messagerie Discord, Slack, Telegram ou WhatsApp sous `src/agents/tools`. Nous ne publions pas de sous-chemins `plugin-sdk/*-action-runtime` distincts, et les plugins intégrés doivent importer directement leur propre code d’exécution local depuis les modules qui leur appartiennent.

La même répartition s’applique de manière générale aux interfaces du SDK portant le nom d’un fournisseur : le cœur ne doit pas importer de modules de commodité propres aux canaux pour Discord, Signal, Slack, WhatsApp ou des plugins similaires. Si le cœur a besoin d’un comportement, il doit soit utiliser le module `api.ts` / `runtime-api.ts` du plugin intégré lui-même, soit convertir ce besoin en une capacité générique restreinte dans le SDK partagé.

Les plugins intégrés suivent la même règle. Le fichier `runtime-api.ts` d’un plugin intégré ne doit pas réexporter sa propre façade personnalisée `openclaw/plugin-sdk/<plugin-id>`. Ces façades personnalisées restent des couches de compatibilité pour les plugins externes et les anciens consommateurs, mais les plugins intégrés doivent utiliser des exportations locales ainsi que des sous-chemins génériques et restreints du SDK, tels que `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store` ou `openclaw/plugin-sdk/webhook-ingress`. Le nouveau code ne doit pas ajouter de façades SDK propres à un identifiant de plugin, sauf si la frontière de compatibilité d’un écosystème externe existant l’exige.

Pour les sondages en particulier, il existe deux chemins d’exécution :

- `outbound.sendPoll` constitue la base partagée pour les canaux qui correspondent au modèle commun de sondage
- `actions.handleAction("poll")` est le chemin privilégié pour la sémantique de sondage propre à un canal ou pour des paramètres de sondage supplémentaires

Le cœur reporte désormais l’analyse partagée des sondages jusqu’à ce que la répartition du sondage au plugin refuse l’action, afin que les gestionnaires de sondages appartenant aux plugins puissent accepter des champs propres au canal sans être préalablement bloqués par l’analyseur générique de sondages.

Consultez [Fonctionnement interne de l’architecture des plugins](/fr/plugins/architecture-internals) pour connaître la séquence de démarrage complète.

## Modèle de propriété des capacités

OpenClaw considère un plugin natif comme la frontière de propriété d’une **entreprise** ou d’une **fonctionnalité**, et non comme un ensemble hétéroclite d’intégrations sans rapport.

Cela signifie que :

- un plugin d’entreprise doit généralement prendre en charge toutes les surfaces de cette entreprise exposées à OpenClaw
- un plugin de fonctionnalité doit généralement prendre en charge l’ensemble de la surface de la fonctionnalité qu’il introduit
- les canaux doivent utiliser les capacités partagées du cœur au lieu de réimplémenter ponctuellement le comportement des fournisseurs

<AccordionGroup>
  <Accordion title="Fournisseur multicapacité">
    `google` prend en charge l’inférence de texte, le backend CLI, les embeddings, la synthèse vocale, la voix en temps réel, la compréhension des médias, la génération d’images, de musique et de vidéos, ainsi que la recherche web. `openai` prend en charge l’inférence de texte, les embeddings, la synthèse vocale, la transcription en temps réel, la voix en temps réel, la compréhension des médias, ainsi que la génération d’images et de vidéos. `minimax` prend en charge l’inférence de texte, ainsi que la compréhension des médias, la synthèse vocale, la génération d’images, de musique et de vidéos, et la recherche web.
  </Accordion>
  <Accordion title="Fournisseur à capacité unique">
    `arcee` et `chutes` prennent uniquement en charge l’inférence de texte ; `microsoft` prend uniquement en charge la synthèse vocale. Un plugin de fournisseur peut conserver ce périmètre restreint jusqu’à ce qu’il doive couvrir une plus grande partie des fonctionnalités de ce fournisseur.
  </Accordion>
  <Accordion title="Plugin de fonctionnalité">
    `voice-call` prend en charge le transport des appels, les outils, la CLI, les routes et le pont avec les flux multimédias Twilio, mais utilise les capacités partagées de synthèse vocale, de transcription en temps réel et de voix en temps réel au lieu d’importer directement les plugins de fournisseurs.
  </Accordion>
</AccordionGroup>

L’état final visé est le suivant :

- l’interface OpenClaw d’un fournisseur réside dans un seul plugin, même si elle couvre les modèles de texte, la synthèse vocale, les images et la vidéo
- les autres fournisseurs peuvent procéder de même pour leur propre périmètre fonctionnel
- les canaux ne se préoccupent pas du plugin de fournisseur qui prend en charge le fournisseur ; ils utilisent le contrat de capacité partagé exposé par le cœur

Voici la distinction essentielle :

- **plugin** = limite de responsabilité
- **capacité** = contrat du cœur que plusieurs plugins peuvent implémenter ou utiliser

Ainsi, si OpenClaw ajoute un nouveau domaine tel que la vidéo, la première question n’est pas « quel fournisseur doit intégrer en dur la gestion de la vidéo ? ». La première question est « quel est le contrat de capacité vidéo du cœur ? ». Une fois ce contrat établi, les plugins de fournisseurs peuvent s’y enregistrer et les plugins de canaux ou de fonctionnalités peuvent l’utiliser.

Si la capacité n’existe pas encore, la bonne approche consiste généralement à :

<Steps>
  <Step title="Définir la capacité">
    Définir la capacité manquante dans le cœur.
  </Step>
  <Step title="L’exposer via le SDK">
    L’exposer de manière typée via l’API ou l’environnement d’exécution du Plugin.
  </Step>
  <Step title="Connecter les consommateurs">
    Connecter les canaux et les fonctionnalités à cette capacité.
  </Step>
  <Step title="Implémentations des fournisseurs">
    Permettre aux Plugins des fournisseurs d’enregistrer des implémentations.
  </Step>
</Steps>

Cette approche explicite clairement la responsabilité, tout en évitant que le comportement du cœur dépende d’un seul fournisseur ou d’un chemin de code ponctuel propre à un Plugin.

### Organisation en couches des capacités

Utilisez ce modèle mental pour déterminer où placer le code :

<Tabs>
  <Tab title="Couche des capacités du cœur">
    Orchestration partagée, stratégie, mécanisme de repli, règles de fusion de la configuration, sémantique de livraison et contrats typés.
  </Tab>
  <Tab title="Couche des Plugins de fournisseurs">
    API propres aux fournisseurs, authentification, catalogues de modèles, synthèse vocale, génération d’images, moteurs vidéo et points de terminaison d’utilisation.
  </Tab>
  <Tab title="Couche des Plugins de canaux et de fonctionnalités">
    Intégration de Discord, Slack, des appels vocaux, etc., qui utilise les capacités du cœur et les présente sur une interface.
  </Tab>
</Tabs>

Par exemple, la synthèse vocale suit cette structure :

- le cœur gère la politique TTS au moment de la réponse, l’ordre de repli, les préférences et la diffusion sur les canaux
- `elevenlabs`, `google`, `microsoft` et `openai` gèrent les implémentations de synthèse
- `voice-call` utilise l’assistant d’exécution TTS pour la téléphonie

Ce même modèle doit être privilégié pour les futures capacités.

### Exemple de Plugin d’entreprise à capacités multiples

Un Plugin d’entreprise doit paraître cohérent de l’extérieur. Si OpenClaw dispose de contrats partagés pour les modèles, la parole, la transcription en temps réel, la voix en temps réel, la compréhension des médias, la génération d’images, la génération de vidéos, la récupération de contenu web et la recherche web, un fournisseur peut gérer toutes ses surfaces au même endroit :

```ts
import type { OpenClawPluginDefinition } from "openclaw/plugin-sdk/plugin-entry";
import {
  describeImageWithModel,
  transcribeOpenAiCompatibleAudio,
} from "openclaw/plugin-sdk/media-understanding";
import { createPluginBackedWebSearchProvider } from "openclaw/plugin-sdk/provider-web-search";

const plugin: OpenClawPluginDefinition = {
  id: "exampleai",
  name: "ExampleAI",
  register(api) {
    api.registerProvider({
      id: "exampleai",
      // hooks d’authentification, de catalogue de modèles et d’exécution
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // configuration vocale du fournisseur — implémenter directement l’interface SpeechProviderPlugin
    });

    api.registerMediaUnderstandingProvider({
      id: "exampleai",
      capabilities: ["image", "audio", "video"],
      async describeImage(req) {
        return describeImageWithModel({
          ...req,
          provider: "exampleai",
        });
      },
      async transcribeAudio(req) {
        return transcribeOpenAiCompatibleAudio({
          ...req,
          provider: "exampleai",
        });
      },
    });

    api.registerWebSearchProvider(
      createPluginBackedWebSearchProvider({
        id: "exampleai-search",
        // logique d’identifiants d’accès et de récupération
      }),
    );
  },
};

export default plugin;
```

Ce ne sont pas les noms exacts des assistants qui importent. C’est la structure qui compte :

- un seul Plugin gère la surface du fournisseur
- le cœur continue de gérer les contrats de capacité
- les canaux et les Plugins de fonctionnalités utilisent les assistants `api.runtime.*`, et non le code du fournisseur
- les tests de contrat peuvent vérifier que le Plugin a enregistré les capacités qu’il déclare gérer

### Exemple de capacité : compréhension vidéo

OpenClaw traite déjà la compréhension des images, de l’audio et des vidéos comme une capacité partagée unique. Le même modèle de responsabilité s’y applique :

<Steps>
  <Step title="Le cœur définit le contrat">
    Le cœur définit le contrat de compréhension des médias.
  </Step>
  <Step title="Les Plugins de fournisseurs s’enregistrent">
    Les Plugins de fournisseurs enregistrent `describeImage`, `transcribeAudio` et `describeVideo` selon les besoins.
  </Step>
  <Step title="Les consommateurs utilisent le comportement partagé">
    Les canaux et les Plugins de fonctionnalités utilisent le comportement partagé du cœur au lieu de se connecter directement au code du fournisseur.
  </Step>
</Steps>

Cela évite d’intégrer dans le cœur les hypothèses vidéo propres à un fournisseur. Le Plugin gère la surface du fournisseur ; le cœur gère le contrat de capacité et le comportement de repli.

La génération de vidéos utilise déjà cette même séquence : le cœur gère le contrat de capacité typé et l’assistant d’exécution, tandis que les Plugins de fournisseurs enregistrent leurs implémentations `api.registerVideoGenerationProvider(...)` conformément à ce contrat.

Vous avez besoin d’une liste de contrôle concrète pour le déploiement ? Consultez le [Guide pratique des capacités](/fr/plugins/adding-capabilities).

## Contrats et application

La surface de l’API des plugins est intentionnellement typée et centralisée dans `OpenClawPluginApi`. Ce contrat définit les points d’enregistrement pris en charge et les utilitaires d’exécution sur lesquels un plugin peut s’appuyer.

Pourquoi cela est important :

- les auteurs de plugins disposent d’une norme interne unique et stable
- le cœur peut rejeter les conflits de propriété, par exemple lorsque deux plugins enregistrent le même identifiant de fournisseur
- le démarrage peut afficher des diagnostics exploitables en cas d’enregistrement mal formé
- les tests de contrat peuvent imposer la propriété des plugins intégrés et empêcher toute dérive silencieuse

Il existe deux niveaux d’application :

<AccordionGroup>
  <Accordion title="Application lors de l’enregistrement à l’exécution">
    Le registre des plugins valide les enregistrements à mesure que les plugins sont chargés. Par exemple, les identifiants de fournisseur en double, les identifiants de fournisseur vocal en double et les enregistrements mal formés produisent des diagnostics de plugin plutôt qu’un comportement indéfini.
  </Accordion>
  <Accordion title="Tests de contrat">
    Les plugins intégrés sont consignés dans des registres de contrat pendant l’exécution des tests afin qu’OpenClaw puisse vérifier explicitement la propriété. Cela est actuellement utilisé pour les fournisseurs de modèles, les fournisseurs vocaux, les fournisseurs de recherche Web et la propriété des enregistrements intégrés.
  </Accordion>
</AccordionGroup>

En pratique, OpenClaw sait dès le départ quel plugin possède quelle surface. Le cœur et les canaux peuvent ainsi se combiner de manière transparente, car la propriété est déclarée, typée et testable plutôt qu’implicite.

### Ce qui doit figurer dans un contrat

<Tabs>
  <Tab title="Bons contrats">
    - typés
    - restreints
    - propres à une capacité
    - détenus par le cœur
    - réutilisables par plusieurs plugins
    - utilisables par les canaux et les fonctionnalités sans connaissance du fournisseur

  </Tab>
  <Tab title="Mauvais contrats">
    - politique propre à un fournisseur dissimulée dans le cœur
    - échappatoires ponctuelles pour les plugins qui contournent le registre
    - code de canal accédant directement à l’implémentation d’un fournisseur
    - objets d’exécution ad hoc qui ne font pas partie de `OpenClawPluginApi` ou de `api.runtime`

  </Tab>
</Tabs>

En cas de doute, élevez le niveau d’abstraction : définissez d’abord la capacité, puis laissez les plugins s’y connecter.

## Modèle d’exécution

Les plugins OpenClaw natifs s’exécutent **dans le processus** du Gateway. Ils ne sont pas isolés dans un bac à sable. Un plugin natif chargé possède la même frontière de confiance au niveau du processus que le code du cœur.

<Warning>
Conséquences des plugins natifs : un plugin peut enregistrer des outils, des gestionnaires réseau, des hooks et des services ; un bogue de plugin peut faire planter ou déstabiliser le Gateway ; et un plugin natif malveillant équivaut à l’exécution de code arbitraire dans le processus OpenClaw.
</Warning>

Les paquets compatibles sont plus sûrs par défaut, car OpenClaw les traite actuellement comme des paquets de métadonnées et de contenu. Dans les versions actuelles, cela correspond principalement aux Skills intégrées.

Utilisez des listes d’autorisation et des chemins explicites d’installation et de chargement pour les plugins non intégrés. Traitez les plugins d’espace de travail comme du code destiné au développement, et non comme des valeurs par défaut de production.

Pour les noms de paquets intégrés à l’espace de travail, conservez l’identifiant du plugin ancré dans le nom npm : `@openclaw/<id>` par défaut, ou un suffixe typé approuvé tel que `-provider`, `-plugin`, `-speech`, `-sandbox` ou `-media-understanding` lorsque le paquet expose intentionnellement un rôle de plugin plus restreint.

<Note>
**Remarque sur la confiance :** `plugins.allow` accorde sa confiance aux **identifiants de plugin**, et non à la provenance de la source. Un plugin d’espace de travail portant le même identifiant qu’un plugin intégré remplace intentionnellement la copie intégrée lorsque ce plugin d’espace de travail est activé ou placé sur la liste d’autorisation. Ce comportement est normal et utile pour le développement local, les tests de correctifs et les correctifs urgents. La confiance accordée aux plugins intégrés est déterminée à partir de l’instantané de la source — le manifeste et le code présents sur le disque au moment du chargement — plutôt qu’à partir des métadonnées d’installation. Un enregistrement d’installation corrompu ou substitué ne peut pas élargir silencieusement la surface de confiance d’un plugin intégré au-delà de ce que revendique la source réelle.
</Note>

## Frontière d’exportation

OpenClaw exporte des capacités, et non des commodités d’implémentation.

Conservez l’enregistrement des capacités dans l’API publique. Supprimez les exportations d’utilitaires qui ne font pas partie du contrat :

- sous-chemins d’utilitaires propres aux plugins intégrés
- sous-chemins d’infrastructure d’exécution qui ne sont pas destinés à faire partie de l’API publique
- utilitaires pratiques propres à un fournisseur
- utilitaires de configuration et d’intégration qui constituent des détails d’implémentation

Les sous-chemins d’utilitaires réservés aux plugins intégrés ont été retirés de la carte d’exportation générée du SDK. Conservez les utilitaires propres à un propriétaire dans le paquet du plugin concerné ; ne promouvez que les comportements réutilisables de l’hôte vers des contrats génériques du SDK tels que `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` et `plugin-sdk/plugin-config-runtime`.

## Fonctionnement interne et référence

Pour le pipeline de chargement, le modèle de registre, les hooks d’exécution des fournisseurs, les routes HTTP du Gateway, les schémas des outils de messagerie, la résolution des cibles de canal, les catalogues de fournisseurs, les plugins de moteur de contexte et le guide d’ajout d’une nouvelle capacité, consultez [Fonctionnement interne de l’architecture des plugins](/fr/plugins/architecture-internals).

## Pages connexes

- [Création de plugins](/fr/plugins/building-plugins)
- [Manifeste de plugin](/fr/plugins/manifest)
- [Configuration du SDK de plugin](/fr/plugins/sdk-setup)
