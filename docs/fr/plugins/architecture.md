---
read_when:
    - Création ou débogage de plugins OpenClaw natifs
    - Comprendre le modèle de capacités Plugin ou les limites de responsabilité
    - Travail sur le pipeline de chargement des plugins ou le registre
    - Implémentation de hooks d’exécution de fournisseur ou de plugins de canal
sidebarTitle: Internals
summary: 'Fonctionnement interne du Plugin : modèle de capacités, responsabilité, contrats, pipeline de chargement et assistants d’exécution'
title: Fonctionnement interne du Plugin
x-i18n:
    generated_at: "2026-04-30T07:37:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1516e0784a005af87a6c081d8027a1e2dc10445e47b6824488e9d9987bb96975
    source_path: plugins/architecture.md
    workflow: 16
---

Voici la **référence d’architecture approfondie** du système de plugins OpenClaw. Pour les guides pratiques, commencez par l’une des pages ciblées ci-dessous.

<CardGroup cols={2}>
  <Card title="Installer et utiliser les plugins" icon="plug" href="/fr/tools/plugin">
    Guide utilisateur pour ajouter, activer et dépanner les plugins.
  </Card>
  <Card title="Créer des plugins" icon="rocket" href="/fr/plugins/building-plugins">
    Tutoriel pour un premier plugin avec le plus petit manifeste fonctionnel.
  </Card>
  <Card title="Plugins de canal" icon="comments" href="/fr/plugins/sdk-channel-plugins">
    Créer un plugin de canal de messagerie.
  </Card>
  <Card title="Plugins de fournisseur" icon="microchip" href="/fr/plugins/sdk-provider-plugins">
    Créer un plugin de fournisseur de modèles.
  </Card>
  <Card title="Vue d’ensemble du SDK" icon="book" href="/fr/plugins/sdk-overview">
    Référence de l’import map et de l’API d’enregistrement.
  </Card>
</CardGroup>

## Modèle public de capacités

Les capacités constituent le modèle public de **plugin natif** dans OpenClaw. Chaque plugin OpenClaw natif s’enregistre auprès d’un ou plusieurs types de capacités :

| Capacité               | Méthode d’enregistrement                         | Exemples de plugins                  |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| Inférence de texte     | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| Backend d’inférence CLI | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| Parole                 | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Transcription en temps réel | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| Voix en temps réel     | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Compréhension des médias | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Génération d’images    | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Génération de musique  | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Génération de vidéo    | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Récupération Web       | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Recherche Web          | `api.registerWebSearchProvider(...)`             | `google`                             |
| Canal / messagerie     | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |
| Découverte Gateway     | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                            |

<Note>
Un plugin qui n’enregistre aucune capacité mais fournit des hooks, des outils, des services de découverte ou des services d’arrière-plan est un plugin **legacy hook-only**. Ce modèle reste entièrement pris en charge.
</Note>

### Position de compatibilité externe

Le modèle de capacités est intégré dans le noyau et utilisé aujourd’hui par les plugins groupés/natifs, mais la compatibilité des plugins externes exige encore un niveau d’exigence plus strict que « c’est exporté, donc c’est figé ».

| Situation du plugin                              | Recommandation                                                                                   |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Plugins externes existants                       | Maintenir les intégrations basées sur les hooks ; c’est la base de compatibilité.                |
| Nouveaux plugins groupés/natifs                  | Préférer l’enregistrement explicite de capacités aux accès internes propres à un fournisseur ou aux nouvelles conceptions uniquement basées sur des hooks. |
| Plugins externes adoptant l’enregistrement de capacités | Autorisé, mais traiter les surfaces d’aide propres aux capacités comme évolutives sauf si la documentation les marque comme stables. |

L’enregistrement de capacités est la direction prévue. Les hooks hérités restent la voie la plus sûre sans rupture pour les plugins externes pendant la transition. Les sous-chemins d’aide exportés ne se valent pas tous — préférez les contrats étroits et documentés aux exports d’aide incidentels.

### Formes de plugins

OpenClaw classe chaque plugin chargé dans une forme selon son comportement réel d’enregistrement, et pas seulement selon ses métadonnées statiques :

<AccordionGroup>
  <Accordion title="plain-capability">
    Enregistre exactement un type de capacité (par exemple un plugin uniquement fournisseur comme `mistral`).
  </Accordion>
  <Accordion title="hybrid-capability">
    Enregistre plusieurs types de capacités (par exemple `openai` possède l’inférence de texte, la parole, la compréhension des médias et la génération d’images).
  </Accordion>
  <Accordion title="hook-only">
    Enregistre uniquement des hooks (typés ou personnalisés), sans capacités, outils, commandes ni services.
  </Accordion>
  <Accordion title="non-capability">
    Enregistre des outils, des commandes, des services ou des routes, mais aucune capacité.
  </Accordion>
</AccordionGroup>

Utilisez `openclaw plugins inspect <id>` pour voir la forme d’un plugin et le détail de ses capacités. Consultez la [référence CLI](/fr/cli/plugins#inspect) pour plus de détails.

### Hooks hérités

Le hook `before_agent_start` reste pris en charge comme voie de compatibilité pour les plugins hook-only. Des plugins réels hérités en dépendent encore.

Direction :

- le garder fonctionnel
- le documenter comme hérité
- préférer `before_model_resolve` pour le travail de remplacement de modèle/fournisseur
- préférer `before_prompt_build` pour le travail de mutation de prompt
- le supprimer seulement après une baisse de l’usage réel et lorsque la couverture des fixtures prouve la sécurité de la migration

### Signaux de compatibilité

Lorsque vous exécutez `openclaw doctor` ou `openclaw plugins inspect <id>`, vous pouvez voir l’un de ces libellés :

| Signal                     | Signification                                                |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | La configuration s’analyse correctement et les plugins se résolvent |
| **compatibility advisory** | Le plugin utilise un modèle pris en charge mais plus ancien (p. ex. `hook-only`) |
| **legacy warning**         | Le plugin utilise `before_agent_start`, qui est déprécié     |
| **hard error**             | La configuration est invalide ou le chargement du plugin a échoué |

Ni `hook-only` ni `before_agent_start` ne casseront votre plugin aujourd’hui : `hook-only` est consultatif, et `before_agent_start` ne déclenche qu’un avertissement. Ces signaux apparaissent aussi dans `openclaw status --all` et `openclaw plugins doctor`.

## Vue d’ensemble de l’architecture

Le système de plugins d’OpenClaw comporte quatre couches :

<Steps>
  <Step title="Manifeste + découverte">
    OpenClaw trouve les plugins candidats à partir des chemins configurés, des racines d’espace de travail, des racines globales de plugins et des plugins groupés. La découverte lit d’abord les manifestes natifs `openclaw.plugin.json` ainsi que les manifestes de bundles pris en charge.
  </Step>
  <Step title="Activation + validation">
    Le noyau décide si un plugin découvert est activé, désactivé, bloqué ou sélectionné pour un emplacement exclusif comme la mémoire.
  </Step>
  <Step title="Chargement d’exécution">
    Les plugins OpenClaw natifs sont chargés dans le processus via jiti et enregistrent leurs capacités dans un registre central. Les bundles compatibles sont normalisés en enregistrements de registre sans importer de code d’exécution.
  </Step>
  <Step title="Consommation des surfaces">
    Le reste d’OpenClaw lit le registre pour exposer les outils, canaux, configurations de fournisseurs, hooks, routes HTTP, commandes CLI et services.
  </Step>
</Steps>

Pour la CLI des plugins en particulier, la découverte des commandes racines est divisée en deux phases :

- les métadonnées au moment de l’analyse proviennent de `registerCli(..., { descriptors: [...] })`
- le vrai module CLI du plugin peut rester paresseux et s’enregistrer à la première invocation

Cela garde le code CLI appartenant au plugin à l’intérieur du plugin tout en permettant à OpenClaw de réserver les noms de commandes racines avant l’analyse.

La frontière de conception importante :

- la validation manifeste/configuration doit fonctionner à partir des **métadonnées de manifeste/schéma** sans exécuter le code du plugin
- la découverte des capacités natives peut charger le code d’entrée de plugins approuvés pour construire un instantané de registre non activant
- le comportement d’exécution natif vient du chemin `register(api)` du module du plugin avec `api.registrationMode === "full"`

Cette séparation permet à OpenClaw de valider la configuration, d’expliquer les plugins manquants/désactivés et de construire des indications d’interface/schéma avant que l’exécution complète ne soit active.

### Instantané des métadonnées de plugin et table de recherche

Le démarrage du Gateway construit un `PluginMetadataSnapshot` pour l’instantané de configuration courant. L’instantané contient uniquement des métadonnées : il stocke l’index des plugins installés, le registre des manifestes, les diagnostics de manifeste, les cartes de propriétaires, un normaliseur d’identifiant de plugin et les enregistrements de manifeste. Il ne conserve pas les modules de plugins chargés, les SDK de fournisseurs, les contenus de paquets ni les exports d’exécution.

La validation de configuration sensible aux plugins, l’auto-activation au démarrage et l’amorçage des plugins du Gateway consomment cet instantané au lieu de reconstruire indépendamment les métadonnées de manifeste/index. `PluginLookUpTable` est dérivé du même instantané et ajoute le plan de plugins de démarrage pour la configuration d’exécution courante.

Après le démarrage, le Gateway conserve l’instantané de métadonnées courant comme produit d’exécution remplaçable. La découverte répétée des fournisseurs d’exécution peut emprunter cet instantané au lieu de reconstruire l’index installé et le registre des manifestes à chaque passe de catalogue de fournisseurs. L’instantané est effacé ou remplacé lors de l’arrêt du Gateway, des changements de configuration/inventaire des plugins et des écritures d’index installé ; les appelants reviennent au chemin froid manifeste/index lorsqu’aucun instantané courant compatible n’existe. Les vérifications de compatibilité doivent inclure les racines de découverte de plugins comme `plugins.load.paths` et l’espace de travail d’agent par défaut, car les plugins d’espace de travail font partie du périmètre des métadonnées.

L’instantané et la table de recherche gardent les décisions répétées de démarrage sur le chemin rapide :

- propriété des canaux
- démarrage différé des canaux
- identifiants des plugins de démarrage
- propriété des fournisseurs et des backends CLI
- propriété des fournisseurs de configuration, alias de commande, fournisseurs de catalogue de modèles et contrats de manifeste
- validation du schéma de configuration de plugin et du schéma de configuration de canal
- décisions d’auto-activation au démarrage

La frontière de sécurité est le remplacement de l’instantané, pas sa mutation. Reconstruisez l’instantané lorsque la configuration, l’inventaire des plugins, les enregistrements d’installation ou la politique d’index persistant changent. Ne le traitez pas comme un vaste registre global mutable, et ne conservez pas d’instantanés historiques sans limite. Le chargement d’exécution des plugins reste séparé des instantanés de métadonnées afin qu’un état d’exécution obsolète ne puisse pas être masqué derrière un cache de métadonnées.

La règle de cache est documentée dans [Internes de l’architecture des plugins](/fr/plugins/architecture-internals#plugin-cache-boundary) : les métadonnées de manifeste et de découverte sont fraîches sauf si un appelant détient un instantané, une table de recherche ou un registre de manifestes explicite pour le flux courant. Les caches de métadonnées cachés et les TTL d’horloge murale ne font pas partie du chargement des plugins. Seuls les caches de chargeur d’exécution, de modules et d’artefacts de dépendances peuvent persister après le chargement effectif du code ou des artefacts installés.

Certains appelants du chemin froid reconstruisent encore les registres de manifestes directement à partir de l’index persistant des plugins installés au lieu de recevoir une `PluginLookUpTable` du Gateway. Ce chemin reconstruit maintenant le registre à la demande ; préférez transmettre la table de recherche courante ou un registre de manifestes explicite dans les flux d’exécution lorsqu’un appelant en possède déjà un.

### Planification de l’activation

La planification de l’activation fait partie du plan de contrôle. Les appelants peuvent demander quels plugins sont pertinents pour une commande, un fournisseur, un canal, une route, un harnais d’agent ou une capacité concrets avant de charger des registres d’exécution plus larges.

Le planificateur maintient le comportement courant des manifestes compatible :

- les champs `activation.*` sont des indications explicites pour le planificateur
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` et les hooks restent le repli de propriété du manifeste
- l’API de planification uniquement basée sur les identifiants reste disponible pour les appelants existants
- l’API de plan signale les libellés de raison afin que les diagnostics puissent distinguer les indications explicites du repli de propriété

<Warning>
Ne traitez pas `activation` comme un hook de cycle de vie ni comme un remplacement de `register(...)`. Il s’agit de métadonnées utilisées pour restreindre le chargement. Préférez les champs de propriété lorsqu’ils décrivent déjà la relation ; utilisez `activation` uniquement pour des indications supplémentaires destinées au planificateur.
</Warning>

### Plugins de canal et outil de message partagé

Les plugins de canal n’ont pas besoin d’enregistrer un outil distinct d’envoi/modification/réaction pour les actions de discussion normales. OpenClaw conserve un outil `message` partagé dans le cœur, et les plugins de canal possèdent la découverte et l’exécution propres au canal derrière celui-ci.

La frontière actuelle est la suivante :

- le cœur possède l’hôte de l’outil `message` partagé, le câblage des invites, la tenue des sessions/fils de discussion et la répartition de l’exécution
- les plugins de canal possèdent la découverte d’actions délimitées, la découverte de capacités et tous les fragments de schéma propres au canal
- les plugins de canal possèdent la grammaire de conversation de session propre au fournisseur, par exemple la façon dont les identifiants de conversation encodent les identifiants de fil de discussion ou héritent des conversations parentes
- les plugins de canal exécutent l’action finale via leur adaptateur d’action

Pour les plugins de canal, la surface SDK est `ChannelMessageActionAdapter.describeMessageTool(...)`. Cet appel de découverte unifié permet à un plugin de renvoyer ensemble ses actions visibles, ses capacités et ses contributions de schéma afin que ces éléments ne divergent pas.

Lorsqu’un paramètre d’outil de message propre au canal transporte une source multimédia telle qu’un chemin local ou une URL de média distante, le plugin doit également renvoyer `mediaSourceParams` depuis `describeMessageTool(...)`. Le cœur utilise cette liste explicite pour appliquer la normalisation des chemins de sandbox et les indications d’accès aux médias sortants sans coder en dur les noms de paramètres possédés par le plugin. Préférez ici des cartes délimitées par action, et non une liste plate valable pour tout le canal, afin qu’un paramètre multimédia réservé au profil ne soit pas normalisé sur des actions sans rapport comme `send`.

Le cœur transmet la portée d’exécution à cette étape de découverte. Les champs importants incluent :

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` entrant approuvé

Cela compte pour les plugins sensibles au contexte. Un canal peut masquer ou exposer des actions de message selon le compte actif, le salon/fil/message actuel ou l’identité approuvée du demandeur, sans coder en dur de branches propres au canal dans l’outil `message` du cœur.

C’est pourquoi les changements de routage de l’exécuteur embarqué restent du travail de plugin : l’exécuteur est responsable de transmettre l’identité de discussion/session actuelle à la frontière de découverte du plugin afin que l’outil `message` partagé expose la bonne surface possédée par le canal pour le tour actuel.

Pour les helpers d’exécution possédés par les canaux, les plugins intégrés doivent conserver le runtime d’exécution dans leurs propres modules d’extension. Le cœur ne possède plus les runtimes d’action de message Discord, Slack, Telegram ni WhatsApp sous `src/agents/tools`. Nous ne publions pas de sous-chemins `plugin-sdk/*-action-runtime` séparés, et les plugins intégrés doivent importer leur propre code de runtime local directement depuis leurs modules possédés par l’extension.

La même frontière s’applique de manière générale aux surfaces SDK nommées par fournisseur : le cœur ne doit pas importer de barrels de commodité propres à un canal pour Slack, Discord, Signal, WhatsApp ou des extensions similaires. Si le cœur a besoin d’un comportement, il doit soit consommer le barrel `api.ts` / `runtime-api.ts` propre au plugin intégré, soit promouvoir le besoin en une capacité générique étroite dans le SDK partagé.

Les plugins intégrés suivent la même règle. Le `runtime-api.ts` d’un plugin intégré ne doit pas réexporter sa propre façade de marque `openclaw/plugin-sdk/<plugin-id>`. Ces façades de marque restent des shims de compatibilité pour les plugins externes et les anciens consommateurs, mais les plugins intégrés doivent utiliser des exports locaux ainsi que des sous-chemins SDK génériques étroits tels que `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store` ou `openclaw/plugin-sdk/webhook-ingress`. Le nouveau code ne doit pas ajouter de façades SDK propres à un identifiant de plugin, sauf si la frontière de compatibilité d’un écosystème externe existant l’exige.

Pour les sondages en particulier, il existe deux chemins d’exécution :

- `outbound.sendPoll` est la base partagée pour les canaux qui correspondent au modèle de sondage commun
- `actions.handleAction("poll")` est le chemin préféré pour la sémantique de sondage propre au canal ou les paramètres de sondage supplémentaires

Le cœur diffère maintenant l’analyse partagée des sondages jusqu’après le refus de l’action par la répartition des sondages du plugin, afin que les gestionnaires de sondages possédés par le plugin puissent accepter des champs de sondage propres au canal sans être d’abord bloqués par l’analyseur de sondages générique.

Consultez [Internes de l’architecture des plugins](/fr/plugins/architecture-internals) pour la séquence complète de démarrage.

## Modèle de propriété des capacités

OpenClaw traite un plugin natif comme la frontière de propriété pour une **entreprise** ou une **fonctionnalité**, et non comme un fourre-tout d’intégrations sans rapport.

Cela signifie que :

- un plugin d’entreprise doit généralement posséder toutes les surfaces de cette entreprise exposées à OpenClaw
- un plugin de fonctionnalité doit généralement posséder toute la surface de fonctionnalité qu’il introduit
- les canaux doivent consommer les capacités partagées du cœur au lieu de réimplémenter le comportement du fournisseur de façon ad hoc

<AccordionGroup>
  <Accordion title="Vendor multi-capability">
    `openai` possède l’inférence de texte, la parole, la voix en temps réel, la compréhension des médias et la génération d’images. `google` possède l’inférence de texte ainsi que la compréhension des médias, la génération d’images et la recherche web. `qwen` possède l’inférence de texte ainsi que la compréhension des médias et la génération de vidéos.
  </Accordion>
  <Accordion title="Vendor single-capability">
    `elevenlabs` et `microsoft` possèdent la parole ; `firecrawl` possède la récupération web ; `minimax` / `mistral` / `moonshot` / `zai` possèdent des backends de compréhension des médias.
  </Accordion>
  <Accordion title="Feature plugin">
    `voice-call` possède le transport d’appel, les outils, la CLI, les routes et le pont de flux multimédia Twilio, mais consomme les capacités partagées de parole, de transcription en temps réel et de voix en temps réel au lieu d’importer directement des plugins de fournisseurs.
  </Accordion>
</AccordionGroup>

L’état final visé est le suivant :

- OpenAI vit dans un seul plugin, même s’il couvre les modèles de texte, la parole, les images et la vidéo future
- un autre fournisseur peut faire la même chose pour sa propre surface
- les canaux ne se soucient pas du plugin fournisseur qui possède le fournisseur ; ils consomment le contrat de capacité partagé exposé par le cœur

Voici la distinction essentielle :

- **plugin** = frontière de propriété
- **capacité** = contrat du cœur que plusieurs plugins peuvent implémenter ou consommer

Ainsi, si OpenClaw ajoute un nouveau domaine tel que la vidéo, la première question n’est pas « quel fournisseur doit coder en dur la gestion vidéo ? » La première question est « quel est le contrat de capacité vidéo du cœur ? » Une fois ce contrat en place, les plugins de fournisseurs peuvent s’y enregistrer, et les plugins de canal/fonctionnalité peuvent le consommer.

Si la capacité n’existe pas encore, la bonne approche est généralement :

<Steps>
  <Step title="Define the capability">
    Définir la capacité manquante dans le cœur.
  </Step>
  <Step title="Expose through the SDK">
    L’exposer via l’API/runtime de plugin de façon typée.
  </Step>
  <Step title="Wire consumers">
    Raccorder les canaux/fonctionnalités à cette capacité.
  </Step>
  <Step title="Vendor implementations">
    Laisser les plugins de fournisseurs enregistrer des implémentations.
  </Step>
</Steps>

Cela garde la propriété explicite tout en évitant un comportement du cœur qui dépend d’un seul fournisseur ou d’un chemin de code ponctuel propre à un plugin.

### Superposition des capacités

Utilisez ce modèle mental pour décider où le code doit se trouver :

<Tabs>
  <Tab title="Core capability layer">
    Orchestration partagée, politique, repli, règles de fusion de configuration, sémantique de livraison et contrats typés.
  </Tab>
  <Tab title="Vendor plugin layer">
    API propres au fournisseur, authentification, catalogues de modèles, synthèse vocale, génération d’images, futurs backends vidéo, points de terminaison d’utilisation.
  </Tab>
  <Tab title="Channel/feature plugin layer">
    Intégration Slack/Discord/voice-call/etc. qui consomme les capacités du cœur et les présente sur une surface.
  </Tab>
</Tabs>

Par exemple, le TTS suit cette forme :

- le cœur possède la politique TTS au moment de la réponse, l’ordre de repli, les préférences et la livraison au canal
- `openai`, `elevenlabs` et `microsoft` possèdent les implémentations de synthèse
- `voice-call` consomme le helper de runtime TTS de téléphonie

Ce même modèle doit être préféré pour les capacités futures.

### Exemple de plugin d’entreprise multi-capacité

Un plugin d’entreprise doit paraître cohérent depuis l’extérieur. Si OpenClaw dispose de contrats partagés pour les modèles, la parole, la transcription en temps réel, la voix en temps réel, la compréhension des médias, la génération d’images, la génération de vidéos, la récupération web et la recherche web, un fournisseur peut posséder toutes ses surfaces à un seul endroit :

```ts
import type { OpenClawPluginDefinition } from "openclaw/plugin-sdk/plugin-entry";
import {
  describeImageWithModel,
  transcribeOpenAiCompatibleAudio,
} from "openclaw/plugin-sdk/media-understanding";

const plugin: OpenClawPluginDefinition = {
  id: "exampleai",
  name: "ExampleAI",
  register(api) {
    api.registerProvider({
      id: "exampleai",
      // auth/model catalog/runtime hooks
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // vendor speech config — implement the SpeechProviderPlugin interface directly
    });

    api.registerMediaUnderstandingProvider({
      id: "exampleai",
      capabilities: ["image", "audio", "video"],
      async describeImage(req) {
        return describeImageWithModel({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
      async transcribeAudio(req) {
        return transcribeOpenAiCompatibleAudio({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
    });

    api.registerWebSearchProvider(
      createPluginBackedWebSearchProvider({
        id: "exampleai-search",
        // credential + fetch logic
      }),
    );
  },
};

export default plugin;
```

Ce qui compte, ce ne sont pas les noms exacts des helpers. C’est la forme qui compte :

- un plugin possède la surface du fournisseur
- le cœur possède toujours les contrats de capacité
- les canaux et les plugins de fonctionnalité consomment les helpers `api.runtime.*`, pas le code du fournisseur
- les tests de contrat peuvent vérifier que le plugin a enregistré les capacités dont il prétend être propriétaire

### Exemple de capacité : compréhension vidéo

OpenClaw traite déjà la compréhension des images/de l’audio/de la vidéo comme une seule capacité partagée. Le même modèle de propriété s’y applique :

<Steps>
  <Step title="Core defines the contract">
    Le cœur définit le contrat de compréhension des médias.
  </Step>
  <Step title="Vendor plugins register">
    Les plugins de fournisseurs enregistrent `describeImage`, `transcribeAudio` et `describeVideo` selon le cas.
  </Step>
  <Step title="Consumers use the shared behavior">
    Les canaux et les plugins de fonctionnalité consomment le comportement partagé du cœur au lieu de se câbler directement au code du fournisseur.
  </Step>
</Steps>

Cela évite d’ancrer les hypothèses vidéo d’un fournisseur dans le cœur. Le plugin possède la surface du fournisseur ; le cœur possède le contrat de capacité et le comportement de repli.

La génération de vidéos utilise déjà cette même séquence : le cœur possède le contrat de capacité typé et le helper de runtime, et les plugins de fournisseurs enregistrent des implémentations `api.registerVideoGenerationProvider(...)` auprès de celui-ci.

Besoin d’une checklist de déploiement concrète ? Consultez le [Livre de recettes des capacités](/fr/plugins/architecture).

## Contrats et application

La surface d’API des plugins est intentionnellement typée et centralisée dans `OpenClawPluginApi`. Ce contrat définit les points d’enregistrement pris en charge et les helpers de runtime sur lesquels un plugin peut s’appuyer.

Pourquoi cela compte :

- les auteurs de plugins disposent d’un standard interne stable unique
- le cœur peut rejeter la propriété dupliquée, par exemple deux plugins enregistrant le même identifiant de fournisseur
- le démarrage peut afficher des diagnostics exploitables pour un enregistrement mal formé
- les tests de contrat peuvent appliquer la propriété des plugins intégrés et empêcher les dérives silencieuses

Il existe deux couches d’application :

<AccordionGroup>
  <Accordion title="Application de l'enregistrement à l'exécution">
    Le registre de plugins valide les enregistrements au chargement des plugins. Exemples : les identifiants de fournisseurs en double, les identifiants de fournisseurs de synthèse vocale en double et les enregistrements mal formés produisent des diagnostics de plugin au lieu d'un comportement indéfini.
  </Accordion>
  <Accordion title="Tests de contrat">
    Les plugins intégrés sont capturés dans des registres de contrats pendant les exécutions de tests afin qu'OpenClaw puisse affirmer explicitement la propriété. Aujourd'hui, cela est utilisé pour les fournisseurs de modèles, les fournisseurs de synthèse vocale, les fournisseurs de recherche web et la propriété des enregistrements intégrés.
  </Accordion>
</AccordionGroup>

L'effet pratique est qu'OpenClaw sait, dès le départ, quel plugin possède quelle surface. Cela permet au noyau et aux canaux de se composer sans friction, car la propriété est déclarée, typée et testable plutôt qu'implicite.

### Ce qui relève d'un contrat

<Tabs>
  <Tab title="Bons contrats">
    - typés
    - petits
    - propres à une capacité
    - détenus par le noyau
    - réutilisables par plusieurs plugins
    - consommables par les canaux/fonctionnalités sans connaissance du fournisseur

  </Tab>
  <Tab title="Mauvais contrats">
    - politique propre au fournisseur cachée dans le noyau
    - échappatoires ponctuelles de plugin qui contournent le registre
    - code de canal accédant directement à une implémentation fournisseur
    - objets d'exécution ad hoc qui ne font pas partie de `OpenClawPluginApi` ou de `api.runtime`

  </Tab>
</Tabs>

En cas de doute, augmentez le niveau d'abstraction : définissez d'abord la capacité, puis laissez les plugins s'y intégrer.

## Modèle d'exécution

Les plugins natifs d'OpenClaw s'exécutent **dans le processus** avec le Gateway. Ils ne sont pas isolés dans un bac à sable. Un plugin natif chargé partage la même limite de confiance au niveau du processus que le code du noyau.

<Warning>
Implications des plugins natifs : un plugin peut enregistrer des outils, des gestionnaires réseau, des hooks et des services ; un bogue de plugin peut faire planter ou déstabiliser le gateway ; et un plugin natif malveillant équivaut à une exécution de code arbitraire dans le processus OpenClaw.
</Warning>

Les bundles compatibles sont plus sûrs par défaut, car OpenClaw les traite actuellement comme des packs de métadonnées/contenu. Dans les versions actuelles, cela signifie principalement des Skills intégrés.

Utilisez des listes d'autorisation et des chemins d'installation/chargement explicites pour les plugins non intégrés. Traitez les plugins d'espace de travail comme du code de développement, et non comme des valeurs par défaut de production.

Pour les noms de packages d'espace de travail intégrés, gardez l'identifiant du plugin ancré dans le nom npm : `@openclaw/<id>` par défaut, ou un suffixe typé approuvé comme `-provider`, `-plugin`, `-speech`, `-sandbox` ou `-media-understanding` lorsque le package expose intentionnellement un rôle de plugin plus étroit.

<Note>
**Note de confiance :** `plugins.allow` fait confiance aux **identifiants de plugins**, pas à la provenance de la source. Un plugin d'espace de travail ayant le même identifiant qu'un plugin intégré masque intentionnellement la copie intégrée lorsque ce plugin d'espace de travail est activé/autorisé. C'est normal et utile pour le développement local, les tests de correctifs et les correctifs à chaud. La confiance envers les plugins intégrés est résolue à partir de l'instantané source — le manifeste et le code sur disque au moment du chargement — plutôt qu'à partir des métadonnées d'installation. Un enregistrement d'installation corrompu ou remplacé ne peut pas élargir silencieusement la surface de confiance d'un plugin intégré au-delà de ce que la source réelle déclare.
</Note>

## Limite d'exportation

OpenClaw exporte des capacités, pas des commodités d'implémentation.

Gardez l'enregistrement de capacités public. Réduisez les exports d'aides hors contrat :

- sous-chemins d'aides propres aux plugins intégrés
- sous-chemins de plomberie d'exécution non destinés à servir d'API publique
- aides de commodité propres aux fournisseurs
- aides de configuration/onboarding qui sont des détails d'implémentation

Les sous-chemins d'aides réservés aux plugins intégrés ont été retirés de la carte d'exportation générée du SDK. Gardez les aides propres au propriétaire dans le package du plugin propriétaire ; promouvez uniquement le comportement d'hôte réutilisable vers des contrats SDK génériques tels que `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` et `plugin-sdk/plugin-config-runtime`.

## Internes et référence

Pour le pipeline de chargement, le modèle de registre, les hooks d'exécution des fournisseurs, les routes HTTP du Gateway, les schémas d'outils de message, la résolution des cibles de canal, les catalogues de fournisseurs, les plugins du moteur de contexte et le guide d'ajout d'une nouvelle capacité, consultez [Internes de l'architecture des plugins](/fr/plugins/architecture-internals).

## Associé

- [Créer des plugins](/fr/plugins/building-plugins)
- [Manifeste de plugin](/fr/plugins/manifest)
- [Configuration du SDK de plugin](/fr/plugins/sdk-setup)
