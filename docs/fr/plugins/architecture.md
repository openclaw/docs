---
read_when:
    - Créer ou déboguer des Plugins OpenClaw natifs
    - Comprendre le modèle de capacités des Plugins ou les limites de responsabilité
    - Travailler sur le pipeline de chargement ou le registre des Plugins
    - Implémenter des hooks d'exécution de fournisseur ou des Plugins de canal
sidebarTitle: Internals
summary: 'Internes des Plugins : modèle de capacités, propriété, contrats, pipeline de chargement et helpers d''exécution'
title: Internes des Plugins
x-i18n:
    generated_at: "2026-04-26T11:34:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 16664d284a8bfbfcb9914bb012d1f36dfdd60406636d6bf4b011f76e886cb518
    source_path: plugins/architecture.md
    workflow: 15
---

Ceci est la **référence d'architecture approfondie** du système de Plugins OpenClaw. Pour des guides pratiques, commencez par l'une des pages ciblées ci-dessous.

<CardGroup cols={2}>
  <Card title="Installer et utiliser des plugins" icon="plug" href="/fr/tools/plugin">
    Guide utilisateur final pour ajouter, activer et dépanner les plugins.
  </Card>
  <Card title="Créer des plugins" icon="rocket" href="/fr/plugins/building-plugins">
    Tutoriel de premier plugin avec le plus petit manifeste fonctionnel.
  </Card>
  <Card title="Plugins de canal" icon="comments" href="/fr/plugins/sdk-channel-plugins">
    Créer un Plugin de canal de messagerie.
  </Card>
  <Card title="Plugins de fournisseur" icon="microchip" href="/fr/plugins/sdk-provider-plugins">
    Créer un Plugin de fournisseur de modèle.
  </Card>
  <Card title="Vue d'ensemble du SDK" icon="book" href="/fr/plugins/sdk-overview">
    Référence de l'import map et de l'API d'enregistrement.
  </Card>
</CardGroup>

## Modèle public de capacités

Les capacités constituent le modèle public de **Plugin natif** dans OpenClaw. Chaque Plugin OpenClaw natif s'enregistre sur un ou plusieurs types de capacité :

| Capacité               | Méthode d'enregistrement                         | Exemples de Plugins                 |
| ---------------------- | ------------------------------------------------ | ----------------------------------- |
| Inférence textuelle    | `api.registerProvider(...)`                      | `openai`, `anthropic`               |
| Backend d'inférence CLI | `api.registerCliBackend(...)`                   | `openai`, `anthropic`               |
| Voix                   | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`           |
| Transcription en temps réel | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                        |
| Voix en temps réel     | `api.registerRealtimeVoiceProvider(...)`         | `openai`                            |
| Compréhension média    | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                  |
| Génération d'images    | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Génération musicale    | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                 |
| Génération vidéo       | `api.registerVideoGenerationProvider(...)`       | `qwen`                              |
| Récupération Web       | `api.registerWebFetchProvider(...)`              | `firecrawl`                         |
| Recherche Web          | `api.registerWebSearchProvider(...)`             | `google`                            |
| Canal / messagerie     | `api.registerChannel(...)`                       | `msteams`, `matrix`                 |
| Découverte Gateway     | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                           |

<Note>
Un plugin qui enregistre zéro capacité mais fournit des hooks, outils, services de découverte ou services en arrière-plan est un Plugin **legacy hook-only**. Ce schéma reste entièrement pris en charge.
</Note>

### Position de compatibilité externe

Le modèle de capacités est intégré au cœur et utilisé aujourd'hui par les Plugins inclus / natifs, mais la compatibilité des Plugins externes exige toujours un critère plus strict que « c'est exporté, donc c'est gelé ».

| Situation du Plugin                             | Recommandation                                                                                 |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Plugins externes existants                      | Conservez le bon fonctionnement des intégrations basées sur des hooks ; c'est la base de compatibilité. |
| Nouveaux Plugins inclus / natifs                | Préférez l'enregistrement explicite de capacités aux accès spécifiques à un fournisseur ou aux nouveaux designs hook-only. |
| Plugins externes adoptant l'enregistrement de capacités | Autorisé, mais considérez les surfaces helper spécifiques aux capacités comme évolutives sauf si la documentation les marque comme stables. |

L'enregistrement de capacités est la direction visée. Les hooks hérités restent le chemin le plus sûr sans rupture pour les Plugins externes pendant la transition. Tous les sous-chemins helper exportés ne se valent pas — préférez des contrats documentés et étroits aux exports helper accidentels.

### Formes de Plugin

OpenClaw classe chaque plugin chargé selon sa forme en fonction de son comportement réel d'enregistrement (pas seulement ses métadonnées statiques) :

<AccordionGroup>
  <Accordion title="plain-capability">
    Enregistre exactement un type de capacité (par exemple un plugin fournisseur uniquement comme `mistral`).
  </Accordion>
  <Accordion title="hybrid-capability">
    Enregistre plusieurs types de capacités (par exemple `openai` possède l'inférence textuelle, la voix, la compréhension média et la génération d'images).
  </Accordion>
  <Accordion title="hook-only">
    Enregistre uniquement des hooks (typés ou personnalisés), sans capacités, outils, commandes ni services.
  </Accordion>
  <Accordion title="non-capability">
    Enregistre des outils, commandes, services ou routes mais aucune capacité.
  </Accordion>
</AccordionGroup>

Utilisez `openclaw plugins inspect <id>` pour voir la forme et la répartition des capacités d'un plugin. Voir [Référence CLI](/fr/cli/plugins#inspect) pour les détails.

### Hooks hérités

Le hook `before_agent_start` reste pris en charge comme chemin de compatibilité pour les plugins hook-only. Des plugins réels hérités en dépendent encore.

Direction :

- continuer à le faire fonctionner
- le documenter comme hérité
- préférer `before_model_resolve` pour le travail de surcharge modèle / fournisseur
- préférer `before_prompt_build` pour le travail de mutation du prompt
- ne le retirer qu'une fois que l'utilisation réelle aura baissé et que la couverture par fixtures prouvera la sécurité de la migration

### Signaux de compatibilité

Lorsque vous exécutez `openclaw doctor` ou `openclaw plugins inspect <id>`, vous pouvez voir l'un de ces libellés :

| Signal                     | Signification                                               |
| -------------------------- | ----------------------------------------------------------- |
| **config valid**           | La configuration s'analyse correctement et les plugins se résolvent |
| **compatibility advisory** | Le plugin utilise un schéma pris en charge mais plus ancien (par ex. `hook-only`) |
| **legacy warning**         | Le plugin utilise `before_agent_start`, qui est obsolète    |
| **hard error**             | La configuration est invalide ou le plugin n'a pas pu être chargé |

Ni `hook-only` ni `before_agent_start` ne casseront votre plugin aujourd'hui : `hook-only` est informatif, et `before_agent_start` ne déclenche qu'un avertissement. Ces signaux apparaissent aussi dans `openclaw status --all` et `openclaw plugins doctor`.

## Vue d'ensemble de l'architecture

Le système de Plugins d'OpenClaw comporte quatre couches :

<Steps>
  <Step title="Manifeste + découverte">
    OpenClaw trouve les plugins candidats à partir des chemins configurés, des racines d'espace de travail, des racines globales de plugins et des plugins inclus. La découverte lit d'abord les manifestes natifs `openclaw.plugin.json` ainsi que les manifestes de bundle pris en charge.
  </Step>
  <Step title="Activation + validation">
    Le cœur décide si un plugin découvert est activé, désactivé, bloqué ou sélectionné pour un slot exclusif tel que la mémoire.
  </Step>
  <Step title="Chargement à l'exécution">
    Les Plugins OpenClaw natifs sont chargés dans le processus via jiti et enregistrent leurs capacités dans un registre central. Les bundles compatibles sont normalisés en enregistrements de registre sans importer de code d'exécution.
  </Step>
  <Step title="Consommation des surfaces">
    Le reste d'OpenClaw lit le registre pour exposer les outils, canaux, configuration des fournisseurs, hooks, routes HTTP, commandes CLI et services.
  </Step>
</Steps>

Pour la CLI des plugins en particulier, la découverte des commandes racine est divisée en deux phases :

- les métadonnées au moment de l'analyse proviennent de `registerCli(..., { descriptors: [...] })`
- le vrai module CLI du plugin peut rester lazy et s'enregistrer lors de la première invocation

Cela permet de garder le code CLI possédé par le plugin à l'intérieur du plugin tout en laissant OpenClaw réserver les noms de commandes racine avant l'analyse.

La limite de conception importante :

- la validation manifeste / configuration doit fonctionner à partir des **métadonnées de manifeste / schéma** sans exécuter le code du plugin
- la découverte native des capacités peut charger le code d'entrée d'un plugin de confiance pour construire un instantané de registre non activant
- le comportement natif à l'exécution provient du chemin `register(api)` du module du plugin avec `api.registrationMode === "full"`

Cette séparation permet à OpenClaw de valider la configuration, d'expliquer les plugins manquants / désactivés, et de construire des indices d'UI / de schéma avant que l'exécution complète ne soit active.

### Planification d'activation

La planification d'activation fait partie du plan de contrôle. Les appelants peuvent demander quels plugins sont pertinents pour une commande, un fournisseur, un canal, une route, un harnais d'agent ou une capacité concrets avant de charger des registres d'exécution plus larges.

Le planificateur maintient un comportement de manifeste actuel compatible :

- les champs `activation.*` sont des indices explicites pour le planificateur
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` et les hooks restent le repli de responsabilité du manifeste
- l'API ids-only du planificateur reste disponible pour les appelants existants
- l'API de plan signale des labels de raison afin que les diagnostics puissent distinguer les indices explicites du repli de responsabilité

<Warning>
Ne traitez pas `activation` comme un hook de cycle de vie ou comme un remplacement de `register(...)`. Il s'agit de métadonnées utilisées pour réduire le chargement. Préférez les champs de responsabilité lorsqu'ils décrivent déjà la relation ; utilisez `activation` uniquement pour des indices supplémentaires destinés au planificateur.
</Warning>

### Plugins de canal et outil `message` partagé

Les plugins de canal n'ont pas besoin d'enregistrer un outil séparé send/edit/react pour les actions normales de chat. OpenClaw conserve un seul outil `message` partagé dans le cœur, et les plugins de canal possèdent la découverte et l'exécution spécifiques au canal qui se cachent derrière lui.

La limite actuelle est la suivante :

- le cœur possède l'hôte de l'outil `message` partagé, le câblage du prompt, la tenue des sessions / threads et le dispatch de l'exécution
- les plugins de canal possèdent la découverte d'actions scoped, la découverte de capacités et tous les fragments de schéma spécifiques au canal
- les plugins de canal possèdent la grammaire de conversation de session spécifique au fournisseur, comme la façon dont les ids de conversation encodent les ids de thread ou héritent des conversations parentes
- les plugins de canal exécutent l'action finale via leur adaptateur d'action

Pour les plugins de canal, la surface SDK est `ChannelMessageActionAdapter.describeMessageTool(...)`. Cet appel unifié de découverte permet à un plugin de renvoyer ses actions visibles, capacités et contributions au schéma ensemble afin que ces éléments ne dérivent pas.

Lorsqu'un paramètre de l'outil `message` spécifique à un canal transporte une source média telle qu'un chemin local ou une URL média distante, le plugin doit aussi renvoyer `mediaSourceParams` depuis `describeMessageTool(...)`. Le cœur utilise cette liste explicite pour appliquer la normalisation des chemins sandbox et les indices d'accès média sortant sans coder en dur les noms de paramètres possédés par le plugin. Préférez ici des maps scoped par action, et non une liste plate à l'échelle du canal, afin qu'un paramètre média réservé au profil ne soit pas normalisé sur des actions sans rapport comme `send`.

Le cœur transmet la portée d'exécution à cette étape de découverte. Les champs importants incluent :

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` entrant de confiance

C'est important pour les plugins sensibles au contexte. Un canal peut masquer ou exposer des actions de message selon le compte actif, le salon / thread / message actuel, ou l'identité de demandeur de confiance sans coder en dur de branches spécifiques au canal dans l'outil `message` du cœur.

C'est la raison pour laquelle les changements de routage du runner embarqué restent du travail de plugin : le runner est responsable de la transmission de l'identité du chat / de la session actuelle dans la limite de découverte du plugin afin que l'outil `message` partagé expose la bonne surface possédée par le canal pour le tour actuel.

Pour les helpers d'exécution possédés par le canal, les Plugins inclus doivent conserver le runtime d'exécution à l'intérieur de leurs propres modules d'extension. Le cœur ne possède plus les runtimes d'action de message Discord, Slack, Telegram ou WhatsApp sous `src/agents/tools`. Nous ne publions pas de sous-chemins séparés `plugin-sdk/*-action-runtime`, et les Plugins inclus doivent importer directement leur propre code d'exécution local depuis leurs modules possédés par l'extension.

La même limite s'applique aux seams SDK nommés par fournisseur en général : le cœur ne doit pas importer de convenience barrels spécifiques à des canaux pour Slack, Discord, Signal, WhatsApp ou autres extensions similaires. Si le cœur a besoin d'un comportement, il doit soit consommer le propre barrel `api.ts` / `runtime-api.ts` du Plugin inclus, soit faire évoluer ce besoin vers une capacité générique étroite dans le SDK partagé.

Pour les sondages en particulier, il existe deux chemins d'exécution :

- `outbound.sendPoll` est la base partagée pour les canaux qui correspondent au modèle commun de sondage
- `actions.handleAction("poll")` est le chemin préféré pour les sémantiques de sondage spécifiques au canal ou des paramètres de sondage supplémentaires

Le cœur diffère désormais l'analyse partagée des sondages jusqu'à ce que le dispatch de sondage du plugin refuse l'action, de sorte que les handlers de sondage possédés par le plugin puissent accepter des champs de sondage spécifiques au canal sans être bloqués d'abord par l'analyseur générique de sondage.

Voir [Internes d'architecture des Plugins](/fr/plugins/architecture-internals) pour la séquence complète de démarrage.

## Modèle de responsabilité des capacités

OpenClaw traite un plugin natif comme la limite de responsabilité d'une **entreprise** ou d'une **fonctionnalité**, et non comme un fourre-tout d'intégrations sans rapport.

Cela signifie :

- un plugin d'entreprise doit généralement posséder toutes les surfaces OpenClaw de cette entreprise
- un plugin de fonctionnalité doit généralement posséder la surface complète de la fonctionnalité qu'il introduit
- les canaux doivent consommer les capacités partagées du cœur au lieu de réimplémenter ad hoc le comportement d'un fournisseur

<AccordionGroup>
  <Accordion title="Fournisseur multi-capacités">
    `openai` possède l'inférence textuelle, la voix, la voix en temps réel, la compréhension média et la génération d'images. `google` possède l'inférence textuelle ainsi que la compréhension média, la génération d'images et la recherche Web. `qwen` possède l'inférence textuelle ainsi que la compréhension média et la génération vidéo.
  </Accordion>
  <Accordion title="Fournisseur mono-capacité">
    `elevenlabs` et `microsoft` possèdent la voix ; `firecrawl` possède la récupération Web ; `minimax` / `mistral` / `moonshot` / `zai` possèdent des backends de compréhension média.
  </Accordion>
  <Accordion title="Plugin de fonctionnalité">
    `voice-call` possède le transport d'appel, les outils, la CLI, les routes et le pont de flux média Twilio, mais consomme des capacités partagées de voix, transcription en temps réel et voix en temps réel au lieu d'importer directement des Plugins de fournisseur.
  </Accordion>
</AccordionGroup>

L'état final visé est :

- OpenAI vit dans un seul Plugin même s'il couvre les modèles texte, la voix, les images et de futures vidéos
- un autre fournisseur peut faire de même pour sa propre surface
- les canaux n'ont pas à se soucier du Plugin fournisseur qui possède le provider ; ils consomment le contrat de capacité partagée exposé par le cœur

Voici la distinction clé :

- **plugin** = limite de responsabilité
- **capacité** = contrat du cœur que plusieurs plugins peuvent implémenter ou consommer

Donc si OpenClaw ajoute un nouveau domaine tel que la vidéo, la première question n'est pas « quel fournisseur doit coder en dur la gestion de la vidéo ? ». La première question est « quel est le contrat de capacité vidéo du cœur ? ». Une fois ce contrat en place, les Plugins fournisseurs peuvent s'y enregistrer et les Plugins de canal / de fonctionnalité peuvent le consommer.

Si la capacité n'existe pas encore, la bonne démarche est généralement :

<Steps>
  <Step title="Définir la capacité">
    Définir la capacité manquante dans le cœur.
  </Step>
  <Step title="L'exposer via le SDK">
    L'exposer via l'API / l'exécution du plugin de manière typée.
  </Step>
  <Step title="Connecter les consommateurs">
    Connecter les canaux / fonctionnalités à cette capacité.
  </Step>
  <Step title="Implémentations fournisseur">
    Laisser les Plugins fournisseurs enregistrer des implémentations.
  </Step>
</Steps>

Cela maintient une responsabilité explicite tout en évitant un comportement du cœur dépendant d'un fournisseur unique ou d'un chemin de code spécifique à un plugin ponctuel.

### Superposition des capacités

Utilisez ce modèle mental pour décider où le code doit résider :

<Tabs>
  <Tab title="Couche de capacité du cœur">
    Orchestration partagée, politique, repli, règles de fusion de configuration, sémantiques de livraison et contrats typés.
  </Tab>
  <Tab title="Couche de Plugin fournisseur">
    API spécifiques au fournisseur, authentification, catalogues de modèles, synthèse vocale, génération d'images, futurs backends vidéo, endpoints d'usage.
  </Tab>
  <Tab title="Couche de Plugin canal / fonctionnalité">
    Intégration Slack/Discord/voice-call/etc. qui consomme les capacités du cœur et les présente sur une surface.
  </Tab>
</Tabs>

Par exemple, le TTS suit cette forme :

- le cœur possède la politique TTS au moment de la réponse, l'ordre de repli, les préférences et la livraison par canal
- `openai`, `elevenlabs` et `microsoft` possèdent les implémentations de synthèse
- `voice-call` consomme le helper runtime TTS de téléphonie

Ce même schéma doit être privilégié pour les futures capacités.

### Exemple de Plugin d'entreprise multi-capacités

Un Plugin d'entreprise doit sembler cohérent vu de l'extérieur. Si OpenClaw possède des contrats partagés pour les modèles, la voix, la transcription en temps réel, la voix en temps réel, la compréhension média, la génération d'images, la génération vidéo, la récupération Web et la recherche Web, un fournisseur peut posséder toutes ses surfaces en un seul endroit :

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

Ce qui importe, ce ne sont pas les noms exacts des helpers. La forme compte :

- un seul plugin possède la surface fournisseur
- le cœur possède toujours les contrats de capacité
- les canaux et Plugins de fonctionnalité consomment des helpers `api.runtime.*`, pas du code fournisseur
- des tests de contrat peuvent vérifier que le plugin a enregistré les capacités qu'il prétend posséder

### Exemple de capacité : compréhension vidéo

OpenClaw traite déjà la compréhension image / audio / vidéo comme une capacité partagée unique. Le même modèle de responsabilité s'y applique :

<Steps>
  <Step title="Le cœur définit le contrat">
    Le cœur définit le contrat de compréhension média.
  </Step>
  <Step title="Les Plugins fournisseurs s'enregistrent">
    Les Plugins fournisseurs enregistrent `describeImage`, `transcribeAudio` et `describeVideo` selon le cas.
  </Step>
  <Step title="Les consommateurs utilisent le comportement partagé">
    Les canaux et Plugins de fonctionnalité consomment le comportement partagé du cœur au lieu de se brancher directement sur du code fournisseur.
  </Step>
</Steps>

Cela évite d'intégrer en dur dans le cœur les hypothèses vidéo d'un fournisseur unique. Le plugin possède la surface fournisseur ; le cœur possède le contrat de capacité et le comportement de repli.

La génération vidéo suit déjà cette même séquence : le cœur possède le contrat de capacité typé et le helper runtime, et les Plugins fournisseurs enregistrent des implémentations `api.registerVideoGenerationProvider(...)` contre celui-ci.

Besoin d'une checklist de déploiement concrète ? Voir [Cookbook des capacités](/fr/plugins/architecture).

## Contrats et application

La surface API des plugins est volontairement typée et centralisée dans `OpenClawPluginApi`. Ce contrat définit les points d'enregistrement pris en charge et les helpers runtime sur lesquels un plugin peut s'appuyer.

Pourquoi c'est important :

- les auteurs de plugins disposent d'un standard interne unique et stable
- le cœur peut rejeter une responsabilité dupliquée comme deux plugins enregistrant le même id de provider
- le démarrage peut afficher des diagnostics exploitables pour les enregistrements mal formés
- des tests de contrat peuvent appliquer la responsabilité des Plugins inclus et empêcher les dérives silencieuses

Il existe deux couches d'application :

<AccordionGroup>
  <Accordion title="Application de l'enregistrement à l'exécution">
    Le registre des plugins valide les enregistrements à mesure que les plugins sont chargés. Exemples : ids de provider dupliqués, ids de fournisseur vocal dupliqués et enregistrements mal formés produisent des diagnostics de plugin au lieu d'un comportement indéfini.
  </Accordion>
  <Accordion title="Tests de contrat">
    Les Plugins inclus sont capturés dans des registres de contrat pendant les exécutions de test afin qu'OpenClaw puisse vérifier explicitement la responsabilité. Aujourd'hui, cela est utilisé pour les fournisseurs de modèles, les fournisseurs vocaux, les fournisseurs de recherche Web et la responsabilité d'enregistrement des plugins inclus.
  </Accordion>
</AccordionGroup>

L'effet pratique est qu'OpenClaw sait dès le départ quel plugin possède quelle surface. Cela permet au cœur et aux canaux de se composer de manière transparente, car la responsabilité est déclarée, typée et testable plutôt qu'implicite.

### Ce qui a sa place dans un contrat

<Tabs>
  <Tab title="Bons contrats">
    - typés
    - petits
    - spécifiques à une capacité
    - possédés par le cœur
    - réutilisables par plusieurs plugins
    - consommables par les canaux / fonctionnalités sans connaissance du fournisseur
  </Tab>
  <Tab title="Mauvais contrats">
    - politique spécifique à un fournisseur cachée dans le cœur
    - échappatoires ponctuelles de plugin qui contournent le registre
    - code de canal qui accède directement à une implémentation fournisseur
    - objets runtime ad hoc qui ne font pas partie de `OpenClawPluginApi` ni de `api.runtime`
  </Tab>
</Tabs>

En cas de doute, montez le niveau d'abstraction : définissez d'abord la capacité, puis laissez les plugins s'y brancher.

## Modèle d'exécution

Les Plugins OpenClaw natifs s'exécutent **dans le processus** avec la Gateway. Ils ne sont pas sandboxés. Un Plugin natif chargé partage la même limite de confiance au niveau du processus que le code du cœur.

<Warning>
Implications :

- un Plugin natif peut enregistrer des outils, des handlers réseau, des hooks et des services
- un bug de Plugin natif peut faire planter ou déstabiliser la gateway
- un Plugin natif malveillant équivaut à une exécution de code arbitraire dans le processus OpenClaw
  </Warning>

Les bundles compatibles sont plus sûrs par défaut car OpenClaw les traite actuellement comme des packs de métadonnées / contenu. Dans les versions actuelles, cela signifie principalement des Skills inclus.

Utilisez des listes d'autorisation et des chemins explicites d'installation / chargement pour les plugins non inclus. Traitez les plugins d'espace de travail comme du code de développement, et non comme des valeurs par défaut de production.

Pour les noms de package d'espace de travail inclus, gardez l'id du plugin ancré dans le nom npm : `@openclaw/<id>` par défaut, ou un suffixe typé approuvé tel que `-provider`, `-plugin`, `-speech`, `-sandbox` ou `-media-understanding` lorsque le package expose intentionnellement un rôle de plugin plus étroit.

<Note>
**Remarque sur la confiance :**

- `plugins.allow` fait confiance aux **ids de plugin**, pas à la provenance de la source.
- Un plugin d'espace de travail ayant le même id qu'un Plugin inclus masque intentionnellement la copie incluse lorsque ce plugin d'espace de travail est activé / sur liste d'autorisation.
- C'est normal et utile pour le développement local, les tests de correctifs et les hotfixes.
- La confiance dans les Plugins inclus est résolue à partir de l'instantané source — le manifeste et le code sur disque au moment du chargement — plutôt qu'à partir des métadonnées d'installation. Un enregistrement d'installation corrompu ou remplacé ne peut pas élargir silencieusement la surface de confiance d'un Plugin inclus au-delà de ce que la source réelle revendique.
  </Note>

## Limite d'export

OpenClaw exporte des capacités, pas des commodités d'implémentation.

Gardez l'enregistrement des capacités public. Réduisez les exports helper hors contrat :

- sous-chemins helper spécifiques aux Plugins inclus
- sous-chemins de plomberie runtime non destinés à être une API publique
- helpers de commodité spécifiques à un fournisseur
- helpers de configuration / onboarding qui sont des détails d'implémentation

Certains sous-chemins helper de Plugins inclus restent encore dans l'export map SDK générée pour des raisons de compatibilité et de maintenance des Plugins inclus. Exemples actuels : `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`, `plugin-sdk/zalo-setup`, et plusieurs seams `plugin-sdk/matrix*`. Traitez-les comme des exports réservés de détail d'implémentation, pas comme le schéma SDK recommandé pour de nouveaux Plugins tiers.

## Internes et référence

Pour le pipeline de chargement, le modèle de registre, les hooks d'exécution des fournisseurs, les routes HTTP Gateway, les schémas de l'outil `message`, la résolution de cible de canal, les catalogues de fournisseurs, les Plugins de moteur de contexte et le guide d'ajout d'une nouvelle capacité, voir [Internes d'architecture des Plugins](/fr/plugins/architecture-internals).

## Liens associés

- [Créer des plugins](/fr/plugins/building-plugins)
- [Manifeste de Plugin](/fr/plugins/manifest)
- [Configuration du SDK de Plugin](/fr/plugins/sdk-setup)
