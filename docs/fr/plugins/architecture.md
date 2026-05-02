---
read_when:
    - Créer ou déboguer des plugins OpenClaw natifs
    - Comprendre le modèle de capacités des Plugin ou les limites de responsabilité
    - Travail sur le pipeline de chargement des Plugins ou le registre
    - Implémentation des hooks d’exécution de fournisseur ou des plugins de canal
sidebarTitle: Internals
summary: 'Internes du Plugin : modèle de capacités, responsabilité, contrats, pipeline de chargement et helpers d’exécution'
title: Fonctionnement interne du Plugin
x-i18n:
    generated_at: "2026-05-02T07:13:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 138fb962c98f71e29e8b2621ce318336c38a317636d090eb315fed806fc6abda
    source_path: plugins/architecture.md
    workflow: 16
---

Ceci est la **référence d’architecture approfondie** du système de plugins OpenClaw. Pour des guides pratiques, commencez par l’une des pages ciblées ci-dessous.

<CardGroup cols={2}>
  <Card title="Install and use plugins" icon="plug" href="/fr/tools/plugin">
    Guide utilisateur pour ajouter, activer et dépanner les plugins.
  </Card>
  <Card title="Building plugins" icon="rocket" href="/fr/plugins/building-plugins">
    Tutoriel pour un premier plugin avec le plus petit manifeste fonctionnel.
  </Card>
  <Card title="Channel plugins" icon="comments" href="/fr/plugins/sdk-channel-plugins">
    Construire un plugin de canal de messagerie.
  </Card>
  <Card title="Provider plugins" icon="microchip" href="/fr/plugins/sdk-provider-plugins">
    Construire un plugin de fournisseur de modèles.
  </Card>
  <Card title="SDK overview" icon="book" href="/fr/plugins/sdk-overview">
    Référence de l’import map et de l’API d’enregistrement.
  </Card>
</CardGroup>

## Modèle de capacités publiques

Les capacités sont le modèle public de **plugin natif** dans OpenClaw. Chaque plugin OpenClaw natif s’enregistre auprès d’un ou plusieurs types de capacités :

| Capacité               | Méthode d’enregistrement                         | Exemples de plugins                  |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| Inférence textuelle    | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| Backend d’inférence CLI | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| Voix                   | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Transcription en temps réel | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| Voix en temps réel     | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Compréhension des médias | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Génération d’images    | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Génération de musique  | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Génération de vidéo    | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Récupération web       | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Recherche web          | `api.registerWebSearchProvider(...)`             | `google`                             |
| Canal / messagerie     | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |
| Découverte Gateway     | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                            |

<Note>
Un plugin qui n’enregistre aucune capacité mais fournit des hooks, des outils, des services de découverte ou des services en arrière-plan est un plugin **hérité uniquement basé sur les hooks**. Ce modèle reste entièrement pris en charge.
</Note>

### Position de compatibilité externe

Le modèle de capacités est intégré au cœur et utilisé aujourd’hui par les plugins intégrés/natifs, mais la compatibilité des plugins externes exige encore un niveau plus strict que « c’est exporté, donc c’est figé ».

| Situation du plugin                              | Recommandation                                                                                   |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Plugins externes existants                       | Maintenir le fonctionnement des intégrations basées sur les hooks ; c’est la référence de compatibilité. |
| Nouveaux plugins intégrés/natifs                 | Préférer l’enregistrement explicite des capacités aux accès internes propres à un fournisseur ou aux nouveaux designs uniquement basés sur les hooks. |
| Plugins externes adoptant l’enregistrement des capacités | Autorisé, mais traiter les surfaces d’aide propres aux capacités comme évolutives sauf si la documentation les marque comme stables. |

L’enregistrement des capacités est la direction prévue. Les hooks hérités restent la voie la plus sûre, sans rupture, pour les plugins externes pendant la transition. Les sous-chemins d’aide exportés ne sont pas tous équivalents — préférez les contrats étroits et documentés aux exports d’aide incidentels.

### Formes de plugins

OpenClaw classe chaque plugin chargé selon une forme basée sur son comportement d’enregistrement réel, et non uniquement sur ses métadonnées statiques :

<AccordionGroup>
  <Accordion title="plain-capability">
    Enregistre exactement un type de capacité (par exemple un plugin uniquement fournisseur comme `mistral`).
  </Accordion>
  <Accordion title="hybrid-capability">
    Enregistre plusieurs types de capacités (par exemple `openai` possède l’inférence textuelle, la voix, la compréhension des médias et la génération d’images).
  </Accordion>
  <Accordion title="hook-only">
    Enregistre uniquement des hooks (typés ou personnalisés), sans capacités, outils, commandes ni services.
  </Accordion>
  <Accordion title="non-capability">
    Enregistre des outils, commandes, services ou routes, mais aucune capacité.
  </Accordion>
</AccordionGroup>

Utilisez `openclaw plugins inspect <id>` pour voir la forme d’un plugin et le détail de ses capacités. Consultez la [référence CLI](/fr/cli/plugins#inspect) pour plus de détails.

### Hooks hérités

Le hook `before_agent_start` reste pris en charge comme chemin de compatibilité pour les plugins uniquement basés sur les hooks. Des plugins hérités réels en dépendent encore.

Direction :

- le garder fonctionnel
- le documenter comme hérité
- préférer `before_model_resolve` pour le travail de remplacement de modèle/fournisseur
- préférer `before_prompt_build` pour le travail de mutation de prompt
- le supprimer uniquement lorsque l’usage réel baisse et que la couverture des fixtures prouve la sûreté de la migration

### Signaux de compatibilité

Lorsque vous exécutez `openclaw doctor` ou `openclaw plugins inspect <id>`, vous pouvez voir l’un de ces libellés :

| Signal                     | Signification                                                |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | La configuration s’analyse correctement et les plugins se résolvent |
| **compatibility advisory** | Le plugin utilise un modèle pris en charge mais plus ancien (par ex. `hook-only`) |
| **legacy warning**         | Le plugin utilise `before_agent_start`, qui est obsolète     |
| **hard error**             | La configuration est invalide ou le plugin n’a pas pu se charger |

Ni `hook-only` ni `before_agent_start` ne casseront votre plugin aujourd’hui : `hook-only` est consultatif, et `before_agent_start` ne déclenche qu’un avertissement. Ces signaux apparaissent aussi dans `openclaw status --all` et `openclaw plugins doctor`.

## Vue d’ensemble de l’architecture

Le système de plugins d’OpenClaw comporte quatre couches :

<Steps>
  <Step title="Manifest + discovery">
    OpenClaw trouve les plugins candidats à partir des chemins configurés, des racines d’espace de travail, des racines globales de plugins et des plugins intégrés. La découverte lit d’abord les manifestes natifs `openclaw.plugin.json` ainsi que les manifestes de bundle pris en charge.
  </Step>
  <Step title="Enablement + validation">
    Le cœur décide si un plugin découvert est activé, désactivé, bloqué ou sélectionné pour un emplacement exclusif comme la mémoire.
  </Step>
  <Step title="Runtime loading">
    Les plugins OpenClaw natifs sont chargés dans le processus et enregistrent leurs capacités dans un registre central. Le JavaScript empaqueté est chargé via `require` natif ; le TypeScript source local tiers constitue le fallback Jiti d’urgence. Les bundles compatibles sont normalisés en enregistrements de registre sans importer de code d’exécution.
  </Step>
  <Step title="Surface consumption">
    Le reste d’OpenClaw lit le registre pour exposer outils, canaux, configuration de fournisseurs, hooks, routes HTTP, commandes CLI et services.
  </Step>
</Steps>

Pour la CLI des plugins en particulier, la découverte des commandes racine est divisée en deux phases :

- les métadonnées au moment de l’analyse proviennent de `registerCli(..., { descriptors: [...] })`
- le vrai module CLI du plugin peut rester paresseux et s’enregistrer à la première invocation

Cela garde le code CLI appartenant au plugin à l’intérieur du plugin tout en permettant à OpenClaw de réserver les noms de commandes racine avant l’analyse.

La frontière de conception importante :

- la validation du manifeste/de la configuration doit fonctionner à partir des **métadonnées de manifeste/schéma** sans exécuter le code du plugin
- la découverte des capacités natives peut charger le code d’entrée d’un plugin fiable pour construire un instantané de registre non activant
- le comportement d’exécution natif provient du chemin `register(api)` du module de plugin avec `api.registrationMode === "full"`

Cette séparation permet à OpenClaw de valider la configuration, d’expliquer les plugins manquants/désactivés et de construire des indications d’interface utilisateur/de schéma avant que l’exécution complète soit active.

### Instantané des métadonnées de plugin et table de recherche

Le démarrage du Gateway construit un `PluginMetadataSnapshot` pour l’instantané de configuration actuel. L’instantané contient uniquement des métadonnées : il stocke l’index des plugins installés, le registre des manifestes, les diagnostics de manifeste, les cartes de propriétaires, un normaliseur d’identifiants de plugins et les enregistrements de manifeste. Il ne conserve pas les modules de plugins chargés, les SDK de fournisseurs, le contenu des paquets ni les exports d’exécution.

La validation de configuration consciente des plugins, l’activation automatique au démarrage et l’amorçage des plugins du Gateway consomment cet instantané au lieu de reconstruire indépendamment les métadonnées de manifeste/index. `PluginLookUpTable` est dérivé du même instantané et ajoute le plan de plugins de démarrage pour la configuration d’exécution actuelle.

Après le démarrage, le Gateway conserve l’instantané de métadonnées actuel comme produit d’exécution remplaçable. La découverte répétée des fournisseurs à l’exécution peut emprunter cet instantané au lieu de reconstruire l’index installé et le registre de manifestes pour chaque passage du catalogue de fournisseurs. L’instantané est effacé ou remplacé à l’arrêt du Gateway, lors de changements de configuration/inventaire de plugins et lors des écritures de l’index installé ; les appelants retombent sur le chemin froid manifeste/index lorsqu’aucun instantané actuel compatible n’existe. Les vérifications de compatibilité doivent inclure les racines de découverte des plugins telles que `plugins.load.paths` et l’espace de travail par défaut de l’agent, car les plugins d’espace de travail font partie du périmètre des métadonnées.

L’instantané et la table de recherche maintiennent les décisions répétées de démarrage sur le chemin rapide :

- propriété des canaux
- démarrage différé des canaux
- identifiants des plugins de démarrage
- propriété des fournisseurs et des backends CLI
- propriété du fournisseur de configuration, des alias de commande, du fournisseur de catalogue de modèles et du contrat de manifeste
- validation du schéma de configuration du plugin et du schéma de configuration des canaux
- décisions d’activation automatique au démarrage

La frontière de sûreté est le remplacement de l’instantané, non sa mutation. Reconstruisez l’instantané lorsque la configuration, l’inventaire des plugins, les enregistrements d’installation ou la politique d’index persistée changent. Ne le traitez pas comme un vaste registre global mutable, et ne conservez pas d’instantanés historiques non bornés. Le chargement des plugins à l’exécution reste séparé des instantanés de métadonnées afin qu’un état d’exécution obsolète ne puisse pas être masqué derrière un cache de métadonnées.

La règle de cache est documentée dans [les éléments internes de l’architecture des plugins](/fr/plugins/architecture-internals#plugin-cache-boundary) : les métadonnées de manifeste et de découverte sont fraîches sauf si un appelant détient un instantané explicite, une table de recherche ou un registre de manifestes pour le flux actuel. Les caches de métadonnées cachés et les TTL basés sur l’horloge murale ne font pas partie du chargement des plugins. Seuls les caches de chargeur d’exécution, de modules et d’artefacts de dépendances peuvent persister après le chargement effectif du code ou des artefacts installés.

Certains appelants de chemin froid reconstruisent encore les registres de manifestes directement depuis l’index persisté des plugins installés au lieu de recevoir une `PluginLookUpTable` du Gateway. Ce chemin reconstruit maintenant le registre à la demande ; préférez transmettre la table de recherche actuelle ou un registre de manifestes explicite à travers les flux d’exécution lorsqu’un appelant en possède déjà un.

### Planification de l’activation

La planification de l’activation fait partie du plan de contrôle. Les appelants peuvent demander quels plugins sont pertinents pour une commande, un fournisseur, un canal, une route, un harnais d’agent ou une capacité concrets avant de charger des registres d’exécution plus larges.

Le planificateur conserve la compatibilité avec le comportement actuel du manifeste :

- les champs `activation.*` sont des indications explicites pour le planificateur
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` et les hooks restent le fallback de propriété du manifeste
- l’API de planificateur uniquement par identifiants reste disponible pour les appelants existants
- l’API de plan signale les libellés de raison afin que les diagnostics puissent distinguer les indications explicites du fallback de propriété

<Warning>
Ne traitez pas `activation` comme un hook de cycle de vie ni comme un remplacement de `register(...)`. Ce sont des métadonnées utilisées pour restreindre le chargement. Préférez les champs de propriété lorsqu’ils décrivent déjà la relation ; utilisez `activation` uniquement pour des indications supplémentaires destinées au planificateur.
</Warning>

### Plugins de canal et outil de message partagé

Les plugins de canal n’ont pas besoin d’enregistrer un outil distinct d’envoi/modification/réaction pour les actions de chat normales. OpenClaw conserve un seul outil `message` partagé dans le noyau, et les plugins de canal possèdent la découverte et l’exécution propres au canal derrière celui-ci.

La frontière actuelle est la suivante :

- le noyau possède l’hôte de l’outil `message` partagé, le câblage des prompts, la tenue des sessions/threads et la répartition de l’exécution
- les plugins de canal possèdent la découverte d’actions à portée limitée, la découverte de capacités et tous les fragments de schéma propres au canal
- les plugins de canal possèdent la grammaire de conversation de session propre au fournisseur, par exemple la façon dont les identifiants de conversation encodent les identifiants de thread ou héritent des conversations parentes
- les plugins de canal exécutent l’action finale via leur adaptateur d’action

Pour les plugins de canal, la surface du SDK est `ChannelMessageActionAdapter.describeMessageTool(...)`. Cet appel de découverte unifié permet à un plugin de renvoyer ensemble ses actions visibles, ses capacités et ses contributions de schéma afin que ces éléments ne divergent pas.

Lorsqu’un paramètre d’outil de message propre au canal transporte une source média, comme un chemin local ou une URL média distante, le plugin doit aussi renvoyer `mediaSourceParams` depuis `describeMessageTool(...)`. Le noyau utilise cette liste explicite pour appliquer la normalisation des chemins de sandbox et les indications d’accès média sortant sans coder en dur les noms de paramètres appartenant au plugin. Préférez ici des cartes à portée d’action, et non une liste plate à l’échelle du canal, afin qu’un paramètre média réservé au profil ne soit pas normalisé sur des actions sans rapport comme `send`.

Le noyau transmet la portée d’exécution à cette étape de découverte. Les champs importants incluent :

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` entrant approuvé

C’est important pour les plugins sensibles au contexte. Un canal peut masquer ou exposer des actions de message selon le compte actif, le salon/thread/message courant ou l’identité approuvée du demandeur, sans coder en dur de branches propres au canal dans l’outil `message` du noyau.

C’est pourquoi les changements de routage de l’exécuteur intégré restent du ressort du plugin : l’exécuteur est responsable de transmettre l’identité de chat/session courante à la frontière de découverte du plugin afin que l’outil `message` partagé expose la bonne surface appartenant au canal pour le tour courant.

Pour les assistants d’exécution appartenant au canal, les plugins fournis doivent conserver l’exécution runtime dans leurs propres modules d’extension. Le noyau ne possède plus les runtimes d’actions de message Discord, Slack, Telegram ou WhatsApp sous `src/agents/tools`. Nous ne publions pas de sous-chemins `plugin-sdk/*-action-runtime` séparés, et les plugins fournis doivent importer leur propre code runtime local directement depuis leurs modules appartenant à l’extension.

La même frontière s’applique en général aux raccords SDK nommés par fournisseur : le noyau ne doit pas importer de barrels de commodité propres au canal pour Slack, Discord, Signal, WhatsApp ou des extensions similaires. Si le noyau a besoin d’un comportement, il doit soit consommer le barrel `api.ts` / `runtime-api.ts` propre au plugin fourni, soit promouvoir le besoin en une capacité générique étroite dans le SDK partagé.

Les plugins fournis suivent la même règle. Le `runtime-api.ts` d’un plugin fourni ne doit pas réexporter sa propre façade marquée `openclaw/plugin-sdk/<plugin-id>`. Ces façades marquées restent des shims de compatibilité pour les plugins externes et les anciens consommateurs, mais les plugins fournis doivent utiliser des exports locaux ainsi que des sous-chemins SDK génériques étroits comme `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store` ou `openclaw/plugin-sdk/webhook-ingress`. Le nouveau code ne doit pas ajouter de façades SDK propres à un identifiant de plugin, sauf si la frontière de compatibilité d’un écosystème externe existant l’exige.

Pour les sondages en particulier, il existe deux chemins d’exécution :

- `outbound.sendPoll` est la base partagée pour les canaux qui correspondent au modèle de sondage commun
- `actions.handleAction("poll")` est le chemin privilégié pour les sémantiques de sondage propres au canal ou les paramètres de sondage supplémentaires

Le noyau diffère désormais l’analyse partagée des sondages jusqu’à ce que la répartition des sondages du plugin refuse l’action, afin que les gestionnaires de sondage appartenant au plugin puissent accepter les champs de sondage propres au canal sans être d’abord bloqués par l’analyseur de sondage générique.

Consultez [Internes de l’architecture des plugins](/fr/plugins/architecture-internals) pour la séquence de démarrage complète.

## Modèle de propriété des capacités

OpenClaw traite un plugin natif comme la frontière de propriété d’une **entreprise** ou d’une **fonctionnalité**, et non comme un fourre-tout d’intégrations sans rapport.

Cela signifie que :

- un plugin d’entreprise doit généralement posséder toutes les surfaces OpenClaw de cette entreprise
- un plugin de fonctionnalité doit généralement posséder toute la surface de fonctionnalité qu’il introduit
- les canaux doivent consommer les capacités partagées du noyau au lieu de réimplémenter le comportement fournisseur de façon ad hoc

<AccordionGroup>
  <Accordion title="Vendor multi-capability">
    `openai` possède l’inférence de texte, la parole, la voix en temps réel, la compréhension des médias et la génération d’images. `google` possède l’inférence de texte ainsi que la compréhension des médias, la génération d’images et la recherche web. `qwen` possède l’inférence de texte ainsi que la compréhension des médias et la génération vidéo.
  </Accordion>
  <Accordion title="Vendor single-capability">
    `elevenlabs` et `microsoft` possèdent la parole ; `firecrawl` possède la récupération web ; `minimax` / `mistral` / `moonshot` / `zai` possèdent des backends de compréhension des médias.
  </Accordion>
  <Accordion title="Feature plugin">
    `voice-call` possède le transport d’appel, les outils, la CLI, les routes et le pont de flux média Twilio, mais consomme les capacités partagées de parole, de transcription en temps réel et de voix en temps réel au lieu d’importer directement des plugins fournisseurs.
  </Accordion>
</AccordionGroup>

L’état final visé est le suivant :

- OpenAI vit dans un seul plugin même s’il couvre les modèles texte, la parole, les images et la vidéo future
- un autre fournisseur peut faire de même pour sa propre surface
- les canaux ne se soucient pas du plugin fournisseur qui possède le fournisseur ; ils consomment le contrat de capacité partagé exposé par le noyau

Voici la distinction clé :

- **plugin** = frontière de propriété
- **capacité** = contrat du noyau que plusieurs plugins peuvent implémenter ou consommer

Ainsi, si OpenClaw ajoute un nouveau domaine comme la vidéo, la première question n’est pas « quel fournisseur doit coder en dur la gestion vidéo ? » La première question est « quel est le contrat de capacité vidéo du noyau ? » Une fois ce contrat en place, les plugins fournisseurs peuvent s’y enregistrer et les plugins de canal/fonctionnalité peuvent le consommer.

Si la capacité n’existe pas encore, la bonne démarche est généralement :

<Steps>
  <Step title="Define the capability">
    Définir la capacité manquante dans le noyau.
  </Step>
  <Step title="Expose through the SDK">
    L’exposer via l’API/plugin runtime de façon typée.
  </Step>
  <Step title="Wire consumers">
    Câbler les canaux/fonctionnalités sur cette capacité.
  </Step>
  <Step title="Vendor implementations">
    Laisser les plugins fournisseurs enregistrer des implémentations.
  </Step>
</Steps>

Cela garde la propriété explicite tout en évitant un comportement du noyau qui dépend d’un seul fournisseur ou d’un chemin de code ponctuel propre à un plugin.

### Stratification des capacités

Utilisez ce modèle mental pour décider où placer le code :

<Tabs>
  <Tab title="Core capability layer">
    Orchestration, politique, repli, règles de fusion de configuration, sémantique de livraison et contrats typés partagés.
  </Tab>
  <Tab title="Vendor plugin layer">
    API propres au fournisseur, authentification, catalogues de modèles, synthèse vocale, génération d’images, futurs backends vidéo, points de terminaison d’usage.
  </Tab>
  <Tab title="Channel/feature plugin layer">
    Intégration Slack/Discord/voice-call/etc. qui consomme les capacités du noyau et les présente sur une surface.
  </Tab>
</Tabs>

Par exemple, TTS suit cette forme :

- le noyau possède la politique TTS au moment de la réponse, l’ordre de repli, les préférences et la livraison au canal
- `openai`, `elevenlabs` et `microsoft` possèdent les implémentations de synthèse
- `voice-call` consomme l’assistant runtime TTS de téléphonie

Ce même modèle doit être privilégié pour les capacités futures.

### Exemple de plugin d’entreprise multi-capacités

Un plugin d’entreprise doit sembler cohérent vu de l’extérieur. Si OpenClaw dispose de contrats partagés pour les modèles, la parole, la transcription en temps réel, la voix en temps réel, la compréhension des médias, la génération d’images, la génération vidéo, la récupération web et la recherche web, un fournisseur peut posséder toutes ses surfaces au même endroit :

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

Ce qui compte, ce ne sont pas les noms exacts des assistants. C’est la forme qui compte :

- un plugin possède la surface fournisseur
- le noyau possède toujours les contrats de capacité
- les canaux et les plugins de fonctionnalité consomment les assistants `api.runtime.*`, pas le code fournisseur
- les tests de contrat peuvent affirmer que le plugin a enregistré les capacités qu’il prétend posséder

### Exemple de capacité : compréhension vidéo

OpenClaw traite déjà la compréhension des images/de l’audio/de la vidéo comme une seule capacité partagée. Le même modèle de propriété s’y applique :

<Steps>
  <Step title="Core defines the contract">
    Le noyau définit le contrat de compréhension des médias.
  </Step>
  <Step title="Vendor plugins register">
    Les plugins fournisseurs enregistrent `describeImage`, `transcribeAudio` et `describeVideo` selon le cas.
  </Step>
  <Step title="Consumers use the shared behavior">
    Les canaux et les plugins de fonctionnalité consomment le comportement partagé du noyau au lieu de se câbler directement au code fournisseur.
  </Step>
</Steps>

Cela évite d’intégrer dans le noyau les hypothèses vidéo d’un fournisseur unique. Le plugin possède la surface fournisseur ; le noyau possède le contrat de capacité et le comportement de repli.

La génération vidéo utilise déjà la même séquence : le noyau possède le contrat de capacité typé et l’assistant runtime, et les plugins fournisseurs enregistrent des implémentations `api.registerVideoGenerationProvider(...)` dessus.

Besoin d’une checklist de déploiement concrète ? Consultez le [Cookbook des capacités](/fr/plugins/architecture).

## Contrats et application

La surface de l’API plugin est volontairement typée et centralisée dans `OpenClawPluginApi`. Ce contrat définit les points d’enregistrement pris en charge et les assistants runtime sur lesquels un plugin peut s’appuyer.

Pourquoi c’est important :

- les auteurs de plugins obtiennent une norme interne stable unique
- le noyau peut rejeter les propriétés dupliquées, par exemple deux plugins enregistrant le même identifiant de fournisseur
- le démarrage peut faire remonter des diagnostics exploitables pour les enregistrements mal formés
- les tests de contrat peuvent faire appliquer la propriété des plugins fournis et empêcher les dérives silencieuses

Il existe deux couches d’application :

<AccordionGroup>
  <Accordion title="Application de l’enregistrement à l’exécution">
    Le registre de Plugin valide les enregistrements lors du chargement des Plugins. Exemples : des identifiants de fournisseur en double, des identifiants de fournisseur de synthèse vocale en double et des enregistrements mal formés produisent des diagnostics de Plugin au lieu d’un comportement indéfini.
  </Accordion>
  <Accordion title="Tests de contrat">
    Les Plugins groupés sont capturés dans des registres de contrats pendant les exécutions de tests afin qu’OpenClaw puisse affirmer explicitement la propriété. Aujourd’hui, cela sert aux fournisseurs de modèles, aux fournisseurs de synthèse vocale, aux fournisseurs de recherche web et à la propriété des enregistrements groupés.
  </Accordion>
</AccordionGroup>

L’effet pratique est qu’OpenClaw sait, dès le départ, quel Plugin possède quelle surface. Cela permet au noyau et aux canaux de se composer de manière fluide, car la propriété est déclarée, typée et testable plutôt qu’implicite.

### Ce qui appartient à un contrat

<Tabs>
  <Tab title="Bons contrats">
    - typés
    - petits
    - propres à une capacité
    - détenus par le noyau
    - réutilisables par plusieurs Plugins
    - consommables par les canaux/fonctionnalités sans connaissance du fournisseur

  </Tab>
  <Tab title="Mauvais contrats">
    - politique propre au fournisseur cachée dans le noyau
    - échappatoires ponctuelles de Plugin qui contournent le registre
    - code de canal accédant directement à une implémentation fournisseur
    - objets d’exécution ad hoc qui ne font pas partie de `OpenClawPluginApi` ou de `api.runtime`

  </Tab>
</Tabs>

En cas de doute, élevez le niveau d’abstraction : définissez d’abord la capacité, puis laissez les Plugins s’y brancher.

## Modèle d’exécution

Les Plugins natifs d’OpenClaw s’exécutent **dans le processus** avec le Gateway. Ils ne sont pas isolés dans un bac à sable. Un Plugin natif chargé partage la même frontière de confiance au niveau du processus que le code du noyau.

<Warning>
Implications des Plugins natifs : un Plugin peut enregistrer des outils, des gestionnaires réseau, des hooks et des services ; un bug de Plugin peut faire planter ou déstabiliser le Gateway ; et un Plugin natif malveillant équivaut à l’exécution de code arbitraire dans le processus OpenClaw.
</Warning>

Les bundles compatibles sont plus sûrs par défaut, car OpenClaw les traite actuellement comme des packs de métadonnées/contenu. Dans les versions actuelles, cela signifie principalement des Skills groupées.

Utilisez des listes d’autorisation et des chemins explicites d’installation/chargement pour les Plugins non groupés. Traitez les Plugins d’espace de travail comme du code de développement, et non comme des valeurs par défaut de production.

Pour les noms de packages d’espace de travail groupés, gardez l’identifiant de Plugin ancré dans le nom npm : `@openclaw/<id>` par défaut, ou un suffixe typé approuvé comme `-provider`, `-plugin`, `-speech`, `-sandbox` ou `-media-understanding` lorsque le package expose intentionnellement un rôle de Plugin plus restreint.

<Note>
**Note de confiance :** `plugins.allow` approuve les **identifiants de Plugin**, pas la provenance de la source. Un Plugin d’espace de travail ayant le même identifiant qu’un Plugin groupé masque intentionnellement la copie groupée lorsque ce Plugin d’espace de travail est activé/autorisé. C’est normal et utile pour le développement local, les tests de correctifs et les correctifs d’urgence. La confiance accordée au Plugin groupé est résolue à partir de l’instantané source — le manifeste et le code sur disque au moment du chargement — plutôt qu’à partir des métadonnées d’installation. Un enregistrement d’installation corrompu ou substitué ne peut pas élargir silencieusement la surface de confiance d’un Plugin groupé au-delà de ce que la source réelle revendique.
</Note>

## Frontière d’exportation

OpenClaw exporte des capacités, pas des commodités d’implémentation.

Gardez l’enregistrement des capacités public. Réduisez les exports d’assistants hors contrat :

- sous-chemins d’assistants propres aux Plugins groupés
- sous-chemins de plomberie d’exécution non destinés à l’API publique
- assistants de commodité propres aux fournisseurs
- assistants de configuration/onboarding qui sont des détails d’implémentation

Les sous-chemins d’assistants réservés aux Plugins groupés ont été retirés de la carte d’exports générée du SDK. Gardez les assistants propres au propriétaire dans le package du Plugin propriétaire ; ne promouvez que le comportement hôte réutilisable vers des contrats SDK génériques comme `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` et `plugin-sdk/plugin-config-runtime`.

## Internes et référence

Pour le pipeline de chargement, le modèle de registre, les hooks d’exécution des fournisseurs, les routes HTTP du Gateway, les schémas d’outils de message, la résolution des cibles de canal, les catalogues de fournisseurs, les Plugins du moteur de contexte et le guide d’ajout d’une nouvelle capacité, consultez [les internes de l’architecture des Plugins](/fr/plugins/architecture-internals).

## Connexe

- [Créer des Plugins](/fr/plugins/building-plugins)
- [Manifeste de Plugin](/fr/plugins/manifest)
- [Configuration du SDK de Plugin](/fr/plugins/sdk-setup)
