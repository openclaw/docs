---
read_when:
    - Création ou débogage de Plugins OpenClaw natifs
    - Comprendre le modèle de capacités des Plugins ou les frontières de propriété
    - Travail sur le pipeline de chargement ou le registre des Plugins
    - Implémentation de hooks de runtime de fournisseur ou de Plugins de canal
sidebarTitle: Internals
summary: 'Éléments internes des Plugins : modèle de capacités, propriété, contrats, pipeline de chargement et assistants de runtime'
title: Éléments internes des Plugins
x-i18n:
    generated_at: "2026-04-25T13:51:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1fd7d9192c8c06aceeb6e8054a740bba27c94770e17eabf064627adda884e77
    source_path: plugins/architecture.md
    workflow: 15
---

Ceci est la **référence d’architecture approfondie** du système de Plugins OpenClaw. Pour des
guides pratiques, commencez par l’une des pages ciblées ci-dessous.

<CardGroup cols={2}>
  <Card title="Installer et utiliser des plugins" icon="plug" href="/fr/tools/plugin">
    Guide utilisateur pour ajouter, activer et dépanner des Plugins.
  </Card>
  <Card title="Créer des plugins" icon="rocket" href="/fr/plugins/building-plugins">
    Tutoriel de premier Plugin avec le plus petit manifeste fonctionnel.
  </Card>
  <Card title="Plugins de canal" icon="comments" href="/fr/plugins/sdk-channel-plugins">
    Créer un Plugin de canal de messagerie.
  </Card>
  <Card title="Plugins fournisseur" icon="microchip" href="/fr/plugins/sdk-provider-plugins">
    Créer un Plugin fournisseur de modèle.
  </Card>
  <Card title="Vue d’ensemble du SDK" icon="book" href="/fr/plugins/sdk-overview">
    Référence de la map d’import et de l’API d’enregistrement.
  </Card>
</CardGroup>

## Modèle public de capacités

Les capacités sont le modèle public des **Plugins natifs** dans OpenClaw. Chaque
Plugin natif OpenClaw s’enregistre sur un ou plusieurs types de capacité :

| Capacité               | Méthode d’enregistrement                         | Exemples de Plugins                   |
| ---------------------- | ------------------------------------------------ | ------------------------------------- |
| Inférence texte        | `api.registerProvider(...)`                      | `openai`, `anthropic`                 |
| Backend d’inférence CLI | `api.registerCliBackend(...)`                   | `openai`, `anthropic`                 |
| Voix                   | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`             |
| Transcription temps réel | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                           |
| Voix temps réel        | `api.registerRealtimeVoiceProvider(...)`         | `openai`                              |
| Compréhension média    | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                    |
| Génération d’image     | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax`  |
| Génération musicale    | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                   |
| Génération vidéo       | `api.registerVideoGenerationProvider(...)`       | `qwen`                                |
| Récupération web       | `api.registerWebFetchProvider(...)`              | `firecrawl`                           |
| Recherche web          | `api.registerWebSearchProvider(...)`             | `google`                              |
| Canal / messagerie     | `api.registerChannel(...)`                       | `msteams`, `matrix`                   |
| Découverte Gateway     | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                             |

Un Plugin qui n’enregistre aucune capacité mais fournit des hooks, outils, services de découverte
ou services d’arrière-plan est un Plugin **hérité hook-only**. Ce modèle
reste entièrement pris en charge.

### Position de compatibilité externe

Le modèle de capacités est intégré dans le cœur et utilisé aujourd’hui par les Plugins natifs/fournis,
mais la compatibilité des Plugins externes a encore besoin d’un niveau d’exigence plus strict que « c’est
exporté, donc c’est figé ».

| Situation du Plugin                              | Recommandation                                                                                  |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Plugins externes existants                       | Garder les intégrations basées sur hooks fonctionnelles ; c’est la base de compatibilité.      |
| Nouveaux Plugins fournis/natifs                  | Préférer l’enregistrement explicite de capacité aux accès spécifiques à un fournisseur ou aux nouveaux designs hook-only. |
| Plugins externes adoptant l’enregistrement par capacité | Autorisé, mais considérez les surfaces d’assistance spécifiques à une capacité comme évolutives tant que la documentation ne les marque pas stables. |

L’enregistrement par capacité est la direction visée. Les hooks hérités restent
le chemin le plus sûr sans casse pour les Plugins externes pendant la transition. Les sous-chemins
d’assistance exportés ne se valent pas tous — préférez des contrats étroits et documentés
aux exports utilitaires accidentels.

### Formes de Plugin

OpenClaw classe chaque Plugin chargé dans une forme selon son comportement réel
d’enregistrement (pas seulement selon des métadonnées statiques) :

- **plain-capability** : enregistre exactement un type de capacité (par exemple un
  Plugin uniquement fournisseur comme `mistral`).
- **hybrid-capability** : enregistre plusieurs types de capacité (par exemple
  `openai` possède l’inférence texte, la voix, la compréhension média et la génération d’image).
- **hook-only** : enregistre uniquement des hooks (typés ou personnalisés), sans capacités,
  outils, commandes ni services.
- **non-capability** : enregistre des outils, commandes, services ou routes mais aucune
  capacité.

Utilisez `openclaw plugins inspect <id>` pour voir la forme d’un Plugin et le détail de ses capacités. Voir [Référence CLI](/fr/cli/plugins#inspect) pour plus de détails.

### Hooks hérités

Le hook `before_agent_start` reste pris en charge comme chemin de compatibilité pour
les Plugins hook-only. Des Plugins réels hérités en dépendent encore.

Direction :

- le maintenir fonctionnel
- le documenter comme hérité
- préférer `before_model_resolve` pour le travail de remplacement de modèle/fournisseur
- préférer `before_prompt_build` pour le travail de mutation de prompt
- ne le supprimer qu’après une baisse de l’usage réel et lorsque la couverture des fixtures prouve la sécurité de la migration

### Signaux de compatibilité

Lorsque vous exécutez `openclaw doctor` ou `openclaw plugins inspect <id>`, vous pouvez voir
l’un de ces libellés :

| Signal                     | Signification                                                |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | La config est correctement analysée et les Plugins sont résolus |
| **compatibility advisory** | Le Plugin utilise un modèle pris en charge mais plus ancien (par ex. `hook-only`) |
| **legacy warning**         | Le Plugin utilise `before_agent_start`, qui est obsolète     |
| **hard error**             | La config est invalide ou le Plugin n’a pas pu être chargé   |

Ni `hook-only` ni `before_agent_start` ne casseront votre Plugin aujourd’hui :
`hook-only` est informatif, et `before_agent_start` ne déclenche qu’un avertissement. Ces
signaux apparaissent aussi dans `openclaw status --all` et `openclaw plugins doctor`.

## Vue d’ensemble de l’architecture

Le système de Plugins OpenClaw comporte quatre couches :

1. **Manifeste + découverte**
   OpenClaw trouve des Plugins candidats à partir des chemins configurés, des racines d’espace de travail,
   des racines globales de Plugins et des Plugins fournis. La découverte lit d’abord les
   manifestes natifs `openclaw.plugin.json` ainsi que les manifestes de bundles pris en charge.
2. **Activation + validation**
   Le cœur décide si un Plugin découvert est activé, désactivé, bloqué, ou
   sélectionné pour un emplacement exclusif tel que la mémoire.
3. **Chargement à l’exécution**
   Les Plugins natifs OpenClaw sont chargés dans le processus via jiti et enregistrent leurs
   capacités dans un registre central. Les bundles compatibles sont normalisés en
   enregistrements de registre sans importer de code d’exécution.
4. **Consommation de surface**
   Le reste d’OpenClaw lit le registre pour exposer outils, canaux, configuration de fournisseur,
   hooks, routes HTTP, commandes CLI et services.

Spécifiquement pour la CLI des Plugins, la découverte des commandes racine est divisée en deux phases :

- les métadonnées au moment de l’analyse viennent de `registerCli(..., { descriptors: [...] })`
- le vrai module CLI du Plugin peut rester paresseux et s’enregistrer à la première invocation

Cela maintient le code CLI possédé par le Plugin dans le Plugin tout en permettant à OpenClaw
de réserver les noms de commande racine avant l’analyse.

La frontière de conception importante :

- la validation manifeste/config doit fonctionner à partir des **métadonnées manifeste/schéma**
  sans exécuter le code du Plugin
- la découverte native de capacités peut charger le code d’entrée d’un Plugin de confiance pour construire un instantané du registre sans activation
- le comportement natif à l’exécution provient du chemin `register(api)` du module Plugin
  avec `api.registrationMode === "full"`

Cette séparation permet à OpenClaw de valider la config, d’expliquer les Plugins manquants/désactivés et
de construire des indices d’interface/schéma avant que le runtime complet ne soit actif.

### Planification d’activation

La planification d’activation fait partie du plan de contrôle. Les appelants peuvent demander quels Plugins
sont pertinents pour une commande, un fournisseur, un canal, une route, un harnais d’agent ou une
capacité concrets avant de charger des registres d’exécution plus larges.

Le planificateur garde compatible le comportement actuel du manifeste :

- les champs `activation.*` sont des indices explicites du planificateur
- `providers`, `channels`, `commandAliases`, `setup.providers`,
  `contracts.tools` et les hooks restent des chemins de repli du manifeste pour la propriété
- l’API du planificateur par ID uniquement reste disponible pour les appelants existants
- l’API de plan rapporte des libellés de raison afin que les diagnostics puissent distinguer les indices explicites du repli de propriété

Ne traitez pas `activation` comme un hook de cycle de vie ou un remplacement de
`register(...)`. Ce sont des métadonnées utilisées pour réduire le chargement. Préférez les champs de
propriété lorsqu’ils décrivent déjà la relation ; utilisez `activation` uniquement pour des indices supplémentaires au planificateur.

### Plugins de canal et outil de message partagé

Les Plugins de canal n’ont pas besoin d’enregistrer un outil distinct send/edit/react pour
les actions de chat normales. OpenClaw conserve un outil `message` partagé dans le cœur, et les
Plugins de canal possèdent la découverte et l’exécution spécifiques au canal derrière lui.

La frontière actuelle est :

- le cœur possède l’hôte de l’outil `message` partagé, le câblage du prompt, la tenue des livres de session/fil
  et la répartition d’exécution
- les Plugins de canal possèdent la découverte d’actions à portée, la découverte de capacités et tout fragment de schéma spécifique au canal
- les Plugins de canal possèdent la grammaire de conversation de session spécifique au fournisseur, par exemple
  comment les ID de conversation encodent les ID de fil ou héritent des conversations parentes
- les Plugins de canal exécutent l’action finale via leur adaptateur d’action

Pour les Plugins de canal, la surface SDK est
`ChannelMessageActionAdapter.describeMessageTool(...)`. Cet appel unifié de découverte permet à un Plugin de renvoyer ses actions visibles, ses capacités et ses contributions de schéma ensemble afin que ces éléments ne divergent pas.

Lorsqu’un paramètre spécifique à un outil de message de canal transporte une source média telle qu’un
chemin local ou une URL média distante, le Plugin doit aussi renvoyer
`mediaSourceParams` depuis `describeMessageTool(...)`. Le cœur utilise cette liste explicite pour appliquer la normalisation de chemin sandbox et les indices d’accès média sortants sans coder en dur des noms de paramètres possédés par le Plugin.
Préférez ici des maps à portée action, et non une liste plate à l’échelle du canal, afin qu’un
paramètre média réservé au profil ne soit pas normalisé sur des actions non liées comme
`send`.

Le cœur transmet la portée du runtime à cette étape de découverte. Les champs importants incluent :

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` entrant de confiance

Cela est important pour les Plugins sensibles au contexte. Un canal peut masquer ou exposer
des actions de message selon le compte actif, la salle/le fil/le message courant, ou
l’identité du demandeur de confiance sans coder en dur de branches spécifiques au canal dans
l’outil `message` du cœur.

C’est pourquoi les changements de routage de l’embedded-runner restent du travail de Plugin : l’exécuteur est
responsable de transmettre l’identité de chat/session courante vers la frontière de découverte du Plugin afin que l’outil `message` partagé expose la bonne surface possédée par le canal pour le tour en cours.

Pour les assistants d’exécution possédés par le canal, les Plugins fournis doivent conserver le runtime d’exécution
dans leurs propres modules d’extension. Le cœur ne possède plus les runtimes d’action de message Discord,
Slack, Telegram ou WhatsApp sous `src/agents/tools`.
Nous ne publions pas de sous-chemins distincts `plugin-sdk/*-action-runtime`, et les Plugins fournis
doivent importer directement leur propre code de runtime local depuis leurs
modules possédés par l’extension.

La même frontière s’applique en général aux coutures SDK nommées par fournisseur : le cœur ne doit
pas importer de barrels pratiques spécifiques aux canaux pour Slack, Discord, Signal,
WhatsApp ou des extensions similaires. Si le cœur a besoin d’un comportement, soit il consomme le
barrel `api.ts` / `runtime-api.ts` du Plugin fourni lui-même, soit il promeut ce besoin
en une capacité générique étroite dans le SDK partagé.

Pour les sondages spécifiquement, il existe deux chemins d’exécution :

- `outbound.sendPoll` est la base partagée pour les canaux qui correspondent au
  modèle commun de sondage
- `actions.handleAction("poll")` est le chemin préféré pour la sémantique de sondage spécifique au canal ou des paramètres de sondage supplémentaires

Le cœur diffère maintenant l’analyse partagée des sondages jusqu’à ce que la répartition des sondages du Plugin décline
l’action, afin que les gestionnaires de sondage possédés par le Plugin puissent accepter des champs de
sondage spécifiques au canal sans être d’abord bloqués par l’analyseur générique de sondage.

Voir [Éléments internes de l’architecture des Plugins](/fr/plugins/architecture-internals) pour la séquence de démarrage complète.

## Modèle de propriété des capacités

OpenClaw traite un Plugin natif comme la frontière de propriété d’une **entreprise** ou d’une
**fonctionnalité**, et non comme un assemblage de nombreuses intégrations sans rapport.

Cela signifie :

- un Plugin d’entreprise doit généralement posséder toutes les surfaces OpenClaw orientées vers cette entreprise
- un Plugin de fonctionnalité doit généralement posséder toute la surface de la fonctionnalité qu’il introduit
- les canaux doivent consommer les capacités partagées du cœur au lieu de réimplémenter ad hoc le comportement du fournisseur

<Accordion title="Exemples de modèles de propriété parmi les Plugins fournis">
  - **Multi-capacité par éditeur** : `openai` possède l’inférence texte, la voix, la
    voix temps réel, la compréhension média et la génération d’image. `google` possède l’inférence texte
    ainsi que la compréhension média, la génération d’image et la recherche web.
    `qwen` possède l’inférence texte ainsi que la compréhension média et la génération vidéo.
  - **Capacité unique par éditeur** : `elevenlabs` et `microsoft` possèdent la voix ;
    `firecrawl` possède la récupération web ; `minimax` / `mistral` / `moonshot` / `zai` possèdent
    des backends de compréhension média.
  - **Plugin de fonctionnalité** : `voice-call` possède le transport d’appel, les outils, la CLI, les routes
    et le pont Twilio media-stream, mais consomme les capacités partagées de voix, de
    transcription temps réel et de voix temps réel au lieu d’importer directement des Plugins éditeurs.
</Accordion>

L’état final visé est :

- OpenAI vit dans un seul Plugin même s’il couvre les modèles texte, la voix, les images et
  la future vidéo
- un autre éditeur peut faire de même pour sa propre surface
- les canaux se moquent du Plugin éditeur qui possède le fournisseur ; ils consomment le contrat de
  capacité partagé exposé par le cœur

Voici la distinction clé :

- **plugin** = frontière de propriété
- **capability** = contrat du cœur que plusieurs Plugins peuvent implémenter ou consommer

Donc si OpenClaw ajoute un nouveau domaine tel que la vidéo, la première question n’est pas
« quel fournisseur doit coder en dur la gestion de la vidéo ? » La première question est « quel est
le contrat de capacité vidéo du cœur ? » Une fois ce contrat établi, les Plugins éditeurs
peuvent s’y enregistrer et les Plugins de canal/fonctionnalité peuvent le consommer.

Si la capacité n’existe pas encore, la bonne démarche est généralement de :

1. définir la capacité manquante dans le cœur
2. l’exposer de manière typée via l’API/runtime des Plugins
3. raccorder les canaux/fonctionnalités à cette capacité
4. laisser les Plugins éditeurs enregistrer les implémentations

Cela garde la propriété explicite tout en évitant un comportement du cœur dépendant d’un
seul éditeur ou d’un chemin de code spécifique à un Plugin ponctuel.

### Superposition des capacités

Utilisez ce modèle mental pour décider où le code doit aller :

- **couche de capacité du cœur** : orchestration partagée, politique, fallback, règles de fusion de configuration,
  sémantique de distribution et contrats typés
- **couche de Plugin éditeur** : API spécifiques à l’éditeur, auth, catalogues de modèles, synthèse vocale,
  génération d’image, futurs backends vidéo, endpoints d’utilisation
- **couche de Plugin canal/fonctionnalité** : intégration Slack/Discord/voice-call/etc.
  qui consomme les capacités du cœur et les présente sur une surface

Par exemple, TTS suit cette structure :

- le cœur possède la politique TTS au moment de la réponse, l’ordre de fallback, les préférences et la distribution par canal
- `openai`, `elevenlabs` et `microsoft` possèdent les implémentations de synthèse
- `voice-call` consomme l’assistant de runtime TTS de téléphonie

Ce même modèle doit être privilégié pour les futures capacités.

### Exemple de Plugin d’entreprise multi-capacité

Un Plugin d’entreprise doit sembler cohérent vu de l’extérieur. Si OpenClaw a des
contrats partagés pour les modèles, la voix, la transcription temps réel, la voix temps réel, la
compréhension média, la génération d’image, la génération vidéo, la récupération web et la recherche web,
un éditeur peut posséder toutes ses surfaces en un seul endroit :

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
      // hooks d’auth/catalogue de modèles/runtime
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // config vocale de l’éditeur — implémentez directement l’interface SpeechProviderPlugin
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
        // logique d’identifiants + fetch
      }),
    );
  },
};

export default plugin;
```

Ce qui compte n’est pas le nom exact des assistants. C’est la structure qui compte :

- un seul Plugin possède la surface de l’éditeur
- le cœur possède toujours les contrats de capacité
- les canaux et Plugins de fonctionnalité consomment les assistants `api.runtime.*`, pas du code éditeur
- les tests de contrat peuvent vérifier que le Plugin a bien enregistré les capacités qu’il
  revendique posséder

### Exemple de capacité : compréhension vidéo

OpenClaw traite déjà la compréhension image/audio/vidéo comme une capacité
partagée. Le même modèle de propriété s’applique ici :

1. le cœur définit le contrat de compréhension média
2. les Plugins éditeurs enregistrent `describeImage`, `transcribeAudio` et
   `describeVideo` selon les cas
3. les canaux et Plugins de fonctionnalité consomment le comportement partagé du cœur au lieu de
   se brancher directement sur le code éditeur

Cela évite d’intégrer dans le cœur les hypothèses vidéo d’un seul fournisseur. Le Plugin possède
la surface de l’éditeur ; le cœur possède le contrat de capacité et le comportement de fallback.

La génération vidéo utilise déjà cette même séquence : le cœur possède le contrat de
capacité typé et l’assistant de runtime, et les Plugins éditeurs enregistrent des
implémentations `api.registerVideoGenerationProvider(...)` dessus.

Besoin d’une checklist de déploiement concrète ? Voir
[Capability Cookbook](/fr/plugins/architecture).

## Contrats et application

La surface API des Plugins est volontairement typée et centralisée dans
`OpenClawPluginApi`. Ce contrat définit les points d’enregistrement pris en charge ainsi que
les assistants de runtime sur lesquels un Plugin peut s’appuyer.

Pourquoi c’est important :

- les auteurs de Plugin obtiennent un standard interne stable
- le cœur peut rejeter les propriétés en double, par exemple deux Plugins enregistrant le même ID de fournisseur
- le démarrage peut faire remonter des diagnostics exploitables pour les enregistrements mal formés
- les tests de contrat peuvent imposer la propriété des Plugins fournis et empêcher les dérives silencieuses

Il existe deux couches d’application :

1. **application de l’enregistrement à l’exécution**
   Le registre des Plugins valide les enregistrements au chargement des Plugins. Exemples :
   des ID de fournisseur dupliqués, des ID de fournisseur vocal dupliqués et des
   enregistrements mal formés produisent des diagnostics de Plugin au lieu d’un comportement indéfini.
2. **tests de contrat**
   Les Plugins fournis sont capturés dans des registres de contrat pendant les exécutions de test afin
   qu’OpenClaw puisse vérifier explicitement la propriété. Aujourd’hui cela est utilisé pour les
   fournisseurs de modèles, fournisseurs de voix, fournisseurs de recherche web, et la propriété d’enregistrement des Plugins fournis.

L’effet pratique est qu’OpenClaw sait, dès le départ, quel Plugin possède quelle
surface. Cela permet au cœur et aux canaux de se composer sans friction, car la propriété est
déclarée, typée et testable plutôt qu’implicite.

### Ce qui appartient à un contrat

Les bons contrats de Plugin sont :

- typés
- petits
- spécifiques à une capacité
- possédés par le cœur
- réutilisables par plusieurs Plugins
- consommables par les canaux/fonctionnalités sans connaissance de l’éditeur

Les mauvais contrats de Plugin sont :

- une politique spécifique à un éditeur cachée dans le cœur
- des échappatoires ponctuelles de Plugin qui contournent le registre
- du code de canal accédant directement à une implémentation éditeur
- des objets de runtime ad hoc qui ne font pas partie de `OpenClawPluginApi` ou
  de `api.runtime`

En cas de doute, montez le niveau d’abstraction : définissez d’abord la capacité, puis
laissez les Plugins s’y brancher.

## Modèle d’exécution

Les Plugins natifs OpenClaw s’exécutent **dans le processus** avec la Gateway. Ils ne sont pas
sandboxés. Un Plugin natif chargé a la même frontière de confiance au niveau processus que le code du cœur.

Implications :

- un Plugin natif peut enregistrer des outils, gestionnaires réseau, hooks et services
- un bug de Plugin natif peut faire planter ou déstabiliser la gateway
- un Plugin natif malveillant équivaut à une exécution de code arbitraire dans le processus OpenClaw

Les bundles compatibles sont plus sûrs par défaut parce qu’OpenClaw les traite actuellement
comme des packs de métadonnées/contenu. Dans les versions actuelles, cela signifie surtout des
Skills fournies.

Utilisez des listes d’autorisation et des chemins explicites d’installation/chargement pour les Plugins non fournis. Traitez
les Plugins d’espace de travail comme du code de développement, et non comme des valeurs par défaut de production.

Pour les noms de package d’espace de travail fournis, gardez l’ID du Plugin ancré dans le nom npm :
`@openclaw/<id>` par défaut, ou un suffixe typé approuvé tel que
`-provider`, `-plugin`, `-speech`, `-sandbox`, ou `-media-understanding` lorsque
le package expose intentionnellement un rôle de Plugin plus étroit.

Remarque de confiance importante :

- `plugins.allow` fait confiance aux **ID de Plugin**, pas à la provenance de la source.
- Un Plugin d’espace de travail avec le même ID qu’un Plugin fourni masque intentionnellement
  la copie fournie lorsque ce Plugin d’espace de travail est activé/dans la liste d’autorisation.
- C’est normal et utile pour le développement local, les tests de correctif et les hotfix.
- La confiance des Plugins fournis est résolue à partir de l’instantané source — le manifeste et le
  code sur disque au moment du chargement — et non à partir des métadonnées d’installation. Un enregistrement d’installation corrompu
  ou substitué ne peut pas élargir silencieusement la surface de confiance d’un Plugin fourni au-delà de ce que la source réelle revendique.

## Frontière d’export

OpenClaw exporte des capacités, pas de la commodité d’implémentation.

Gardez l’enregistrement des capacités public. Réduisez les exports assistants non contractuels :

- sous-chemins assistants spécifiques aux Plugins fournis
- sous-chemins de plomberie runtime qui ne sont pas destinés à être une API publique
- assistants pratiques spécifiques à un éditeur
- assistants d’installation/onboarding qui sont des détails d’implémentation

Certains sous-chemins assistants de Plugins fournis restent encore dans la map d’export SDK générée
pour des raisons de compatibilité et de maintenance des Plugins fournis. Des exemples actuels incluent
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup`, ainsi que plusieurs coutures `plugin-sdk/matrix*`. Traitez-les comme
des exports réservés et détaillés d’implémentation, et non comme le modèle SDK recommandé pour
de nouveaux Plugins tiers.

## Internes et référence

Pour le pipeline de chargement, le modèle de registre, les hooks de runtime de fournisseur, les routes HTTP Gateway,
les schémas d’outil de message, la résolution de cible de canal, les catalogues de fournisseurs,
les Plugins de moteur de contexte, et le guide pour ajouter une nouvelle capacité, voir
[Éléments internes de l’architecture des Plugins](/fr/plugins/architecture-internals).

## Lié

- [Créer des Plugins](/fr/plugins/building-plugins)
- [Configuration du SDK Plugin](/fr/plugins/sdk-setup)
- [Manifeste de Plugin](/fr/plugins/manifest)
