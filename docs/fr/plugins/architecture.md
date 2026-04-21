---
read_when:
    - Création ou débogage des plugins OpenClaw natifs
    - Comprendre le modèle de capacités du plugin ou les limites de propriété
    - Travailler sur le pipeline de chargement du plugin ou le registre
    - Implémenter des hooks d’exécution du fournisseur ou des plugins de canal
sidebarTitle: Internals
summary: 'Internes du Plugin : modèle de capacités, propriété, contrats, pipeline de chargement et assistants d’exécution'
title: Internes du Plugin
x-i18n:
    generated_at: "2026-04-21T13:35:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4b1fb42e659d4419033b317e88563a59b3ddbfad0523f32225c868c8e828fd16
    source_path: plugins/architecture.md
    workflow: 15
---

# Internes du Plugin

<Info>
  Il s’agit de la **référence d’architecture approfondie**. Pour des guides pratiques, voir :
  - [Installer et utiliser des plugins](/fr/tools/plugin) — guide utilisateur
  - [Prise en main](/fr/plugins/building-plugins) — premier tutoriel de plugin
  - [Plugins de canal](/fr/plugins/sdk-channel-plugins) — créer un canal de messagerie
  - [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins) — créer un fournisseur de modèle
  - [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) — mappage des imports et API d’enregistrement
</Info>

Cette page couvre l’architecture interne du système de plugins d’OpenClaw.

## Modèle de capacités public

Les capacités sont le modèle public des **plugins natifs** dans OpenClaw. Chaque
plugin OpenClaw natif s’enregistre auprès d’un ou plusieurs types de capacités :

| Capability             | Registration method                              | Example plugins                      |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| Inférence de texte     | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| Backend d’inférence CLI  | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| Voix                  | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Transcription en temps réel | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| Voix en temps réel         | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Compréhension des médias    | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Génération d’images       | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Génération de musique       | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Génération de vidéos       | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Récupération Web              | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Recherche Web             | `api.registerWebSearchProvider(...)`             | `google`                             |
| Canal / messagerie    | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |

Un plugin qui n’enregistre aucune capacité mais fournit des hooks, des outils ou
des services est un plugin **legacy hook-only**. Ce modèle est toujours pleinement pris en charge.

### Position de compatibilité externe

Le modèle de capacités est intégré au cœur et utilisé aujourd’hui par les plugins
bundlés/natifs, mais la compatibilité des plugins externes exige toujours un critère
plus strict que « c’est exporté, donc c’est figé ».

Recommandation actuelle :

- **plugins externes existants :** conserver le fonctionnement des intégrations basées sur des hooks ; les traiter
  comme référence de compatibilité
- **nouveaux plugins bundlés/natifs :** préférer l’enregistrement explicite des capacités aux accès internes
  spécifiques à un fournisseur ou aux nouvelles conceptions uniquement à base de hooks
- **plugins externes adoptant l’enregistrement des capacités :** autorisés, mais considérer les surfaces d’assistance
  spécifiques aux capacités comme évolutives, sauf si la documentation marque explicitement un contrat comme stable

Règle pratique :

- les API d’enregistrement de capacités sont la direction visée
- les hooks legacy restent le chemin le plus sûr pour éviter les ruptures
  pour les plugins externes pendant la transition
- tous les sous-chemins d’assistance exportés ne se valent pas ; préférer le contrat
  documenté et ciblé, pas les exports d’assistance accessoires

### Formes de plugins

OpenClaw classe chaque plugin chargé dans une forme selon son comportement réel
d’enregistrement (et pas seulement selon ses métadonnées statiques) :

- **plain-capability** -- enregistre exactement un type de capacité (par exemple un
  plugin uniquement fournisseur comme `mistral`)
- **hybrid-capability** -- enregistre plusieurs types de capacités (par exemple
  `openai` possède l’inférence de texte, la voix, la compréhension des médias et la génération
  d’images)
- **hook-only** -- enregistre uniquement des hooks (typés ou personnalisés), sans
  capacités, outils, commandes ni services
- **non-capability** -- enregistre des outils, commandes, services ou routes mais aucune
  capacité

Utilisez `openclaw plugins inspect <id>` pour voir la forme d’un plugin et la répartition
de ses capacités. Voir la [référence CLI](/cli/plugins#inspect) pour plus de détails.

### Hooks legacy

Le hook `before_agent_start` reste pris en charge comme chemin de compatibilité pour
les plugins uniquement à base de hooks. Des plugins legacy utilisés en conditions réelles en dépendent encore.

Orientation :

- le conserver fonctionnel
- le documenter comme legacy
- préférer `before_model_resolve` pour le travail de remplacement de modèle/fournisseur
- préférer `before_prompt_build` pour le travail de mutation des prompts
- ne le supprimer qu’après une baisse de l’usage réel et quand la couverture des fixtures prouve la sûreté de la migration

### Signaux de compatibilité

Quand vous exécutez `openclaw doctor` ou `openclaw plugins inspect <id>`, vous pouvez voir
l’une de ces étiquettes :

| Signal                     | Signification                                                      |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | La configuration est analysée correctement et les plugins sont résolus                       |
| **compatibility advisory** | Le plugin utilise un modèle pris en charge mais plus ancien (par ex. `hook-only`) |
| **legacy warning**         | Le plugin utilise `before_agent_start`, qui est obsolète        |
| **hard error**             | La configuration est invalide ou le plugin n’a pas pu être chargé                   |

Ni `hook-only` ni `before_agent_start` ne casseront votre plugin aujourd’hui --
`hook-only` est indicatif, et `before_agent_start` ne déclenche qu’un avertissement. Ces
signaux apparaissent aussi dans `openclaw status --all` et `openclaw plugins doctor`.

## Vue d’ensemble de l’architecture

Le système de plugins d’OpenClaw comporte quatre couches :

1. **Manifest + découverte**
   OpenClaw trouve les plugins candidats à partir des chemins configurés, des racines d’espace de travail,
   des racines globales d’extensions et des extensions bundlées. La découverte lit d’abord les manifests natifs
   `openclaw.plugin.json` ainsi que les manifests de bundles pris en charge.
2. **Activation + validation**
   Le cœur décide si un plugin découvert est activé, désactivé, bloqué ou
   sélectionné pour un emplacement exclusif comme la mémoire.
3. **Chargement à l’exécution**
   Les plugins OpenClaw natifs sont chargés en processus via jiti et enregistrent leurs
   capacités dans un registre central. Les bundles compatibles sont normalisés dans
   des enregistrements du registre sans importer de code d’exécution.
4. **Consommation des surfaces**
   Le reste d’OpenClaw lit le registre pour exposer les outils, canaux, configuration
   des fournisseurs, hooks, routes HTTP, commandes CLI et services.

Pour la CLI des plugins en particulier, la découverte des commandes racines est divisée en deux phases :

- les métadonnées au moment de l’analyse viennent de `registerCli(..., { descriptors: [...] })`
- le vrai module CLI du plugin peut rester paresseux et s’enregistrer à la première invocation

Cela permet de garder le code CLI appartenant au plugin dans le plugin tout en laissant OpenClaw
réserver les noms de commandes racines avant l’analyse.

La limite de conception importante :

- la découverte + la validation de configuration doivent fonctionner à partir des **métadonnées de manifest/schéma**
  sans exécuter le code du plugin
- le comportement natif à l’exécution vient du chemin `register(api)` du module du plugin

Cette séparation permet à OpenClaw de valider la configuration, d’expliquer les plugins
manquants/désactivés et de construire les indices d’UI/schéma avant que l’exécution complète soit active.

### Plugins de canal et outil de message partagé

Les plugins de canal n’ont pas besoin d’enregistrer un outil distinct d’envoi/édition/réaction pour
les actions de chat normales. OpenClaw conserve un outil `message` partagé dans le cœur, et
les plugins de canal possèdent la découverte et l’exécution spécifiques au canal derrière celui-ci.

La limite actuelle est la suivante :

- le cœur possède l’hôte de l’outil `message` partagé, le câblage des prompts, la tenue des comptes
  de session/thread et la distribution de l’exécution
- les plugins de canal possèdent la découverte d’actions ciblée, la découverte de capacités et tout
  fragment de schéma spécifique au canal
- les plugins de canal possèdent la grammaire de conversation de session spécifique au fournisseur, comme
  la manière dont les identifiants de conversation encodent les identifiants de thread ou héritent des conversations parentes
- les plugins de canal exécutent l’action finale via leur adaptateur d’action

Pour les plugins de canal, la surface SDK est
`ChannelMessageActionAdapter.describeMessageTool(...)`. Cet appel de découverte unifié
permet à un plugin de renvoyer ensemble ses actions visibles, ses capacités et ses contributions
au schéma afin que ces éléments ne divergent pas.

Lorsqu’un paramètre de l’outil de message spécifique à un canal transporte une source média telle qu’un
chemin local ou une URL de média distante, le plugin doit également renvoyer
`mediaSourceParams` depuis `describeMessageTool(...)`. Le cœur utilise cette liste explicite
pour appliquer la normalisation des chemins sandbox et les indications d’accès sortant aux médias
sans coder en dur des noms de paramètres appartenant au plugin.
Préférez ici des mappages ciblés par action, et non une liste plate unique à l’échelle du canal, afin qu’un
paramètre média uniquement lié au profil ne soit pas normalisé sur des actions sans rapport comme
`send`.

Le cœur transmet le contexte d’exécution à cette étape de découverte. Les champs importants incluent :

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` entrant de confiance

C’est important pour les plugins sensibles au contexte. Un canal peut masquer ou exposer
des actions de message selon le compte actif, la salle/le thread/le message courant, ou
l’identité fiable du demandeur, sans coder en dur de branches spécifiques au canal dans l’outil
`message` du cœur.

C’est pourquoi les changements de routage du runner embarqué restent un travail de plugin : le runner est
responsable de transférer l’identité actuelle du chat/de la session vers la limite de découverte du plugin afin que
l’outil `message` partagé expose la bonne surface appartenant au canal pour le tour courant.

Pour les assistants d’exécution appartenant au canal, les plugins bundlés doivent conserver l’exécution
dans leurs propres modules d’extension. Le cœur ne possède plus les exécutions d’actions de message
Discord, Slack, Telegram ou WhatsApp sous `src/agents/tools`.
Nous ne publions pas de sous-chemins distincts `plugin-sdk/*-action-runtime`, et les
plugins bundlés doivent importer directement leur propre code d’exécution local depuis leurs
modules appartenant à l’extension.

La même limite s’applique aux joints SDK nommés par fournisseur en général : le cœur ne doit
pas importer de barrels de commodité spécifiques aux canaux pour Slack, Discord, Signal,
WhatsApp ou des extensions similaires. Si le cœur a besoin d’un comportement, il doit soit consommer
le barrel `api.ts` / `runtime-api.ts` du plugin bundlé lui-même, soit faire évoluer ce besoin
vers une capacité générique étroite dans le SDK partagé.

Pour les sondages en particulier, il existe deux chemins d’exécution :

- `outbound.sendPoll` est la base partagée pour les canaux qui correspondent au modèle de sondage commun
- `actions.handleAction("poll")` est le chemin préféré pour une sémantique de sondage spécifique au canal ou des paramètres de sondage supplémentaires

Le cœur diffère maintenant l’analyse partagée des sondages jusqu’à ce que la distribution du sondage du plugin refuse
l’action, afin que les gestionnaires de sondages appartenant au plugin puissent accepter des champs de sondage
spécifiques au canal sans être bloqués d’abord par l’analyseur générique de sondages.

Voir [Pipeline de chargement](#load-pipeline) pour la séquence complète de démarrage.

## Modèle de propriété des capacités

OpenClaw traite un plugin natif comme la limite de propriété pour une **entreprise** ou une
**fonctionnalité**, et non comme un ensemble disparate d’intégrations sans lien.

Cela signifie :

- un plugin d’entreprise doit généralement posséder toutes les surfaces OpenClaw orientées vers cette entreprise
- un plugin de fonctionnalité doit généralement posséder la surface complète de la fonctionnalité qu’il introduit
- les canaux doivent consommer les capacités partagées du cœur au lieu de réimplémenter de manière ad hoc le comportement des fournisseurs

Exemples :

- le plugin `openai` bundlé possède le comportement de fournisseur de modèles OpenAI ainsi que le comportement OpenAI pour
  la voix + la voix en temps réel + la compréhension des médias + la génération d’images
- le plugin `elevenlabs` bundlé possède le comportement vocal ElevenLabs
- le plugin `microsoft` bundlé possède le comportement vocal Microsoft
- le plugin `google` bundlé possède le comportement de fournisseur de modèles Google ainsi que le comportement Google pour
  la compréhension des médias + la génération d’images + la recherche Web
- le plugin `firecrawl` bundlé possède le comportement de récupération Web Firecrawl
- les plugins `minimax`, `mistral`, `moonshot` et `zai` bundlés possèdent leurs
  backends de compréhension des médias
- le plugin `qwen` bundlé possède le comportement de fournisseur de texte Qwen ainsi que
  le comportement de compréhension des médias et de génération de vidéos
- le plugin `voice-call` est un plugin de fonctionnalité : il possède le transport d’appel, les outils,
  la CLI, les routes et le pont de flux média Twilio, mais il consomme les capacités partagées de voix
  ainsi que de transcription en temps réel et de voix en temps réel au lieu
  d’importer directement les plugins des fournisseurs

L’état final visé est le suivant :

- OpenAI vit dans un seul plugin même s’il couvre les modèles de texte, la voix, les images et
  les futures vidéos
- un autre fournisseur peut faire de même pour sa propre surface
- les canaux ne se soucient pas du plugin fournisseur qui possède le fournisseur ; ils consomment le
  contrat de capacité partagé exposé par le cœur

Voici la distinction clé :

- **plugin** = limite de propriété
- **capability** = contrat du cœur que plusieurs plugins peuvent implémenter ou consommer

Donc si OpenClaw ajoute un nouveau domaine comme la vidéo, la première question n’est pas
« quel fournisseur doit coder en dur la gestion de la vidéo ? » La première question est « quel est
le contrat de capacité vidéo du cœur ? » Une fois ce contrat en place, les plugins fournisseurs
peuvent s’y enregistrer et les plugins de canal/fonctionnalité peuvent le consommer.

Si la capacité n’existe pas encore, la bonne démarche est généralement la suivante :

1. définir la capacité manquante dans le cœur
2. l’exposer via l’API/runtime du plugin de manière typée
3. brancher les canaux/fonctionnalités sur cette capacité
4. laisser les plugins fournisseurs enregistrer des implémentations

Cela permet de garder une propriété explicite tout en évitant un comportement du cœur qui dépend
d’un seul fournisseur ou d’un chemin de code ponctuel spécifique à un plugin.

### Superposition des capacités

Utilisez ce modèle mental pour décider où le code doit se trouver :

- **couche de capacité du cœur** : orchestration partagée, politique, fallback, règles de fusion de configuration,
  sémantique de livraison et contrats typés
- **couche de plugin fournisseur** : API spécifiques au fournisseur, authentification, catalogues de modèles, voix
  de synthèse, génération d’images, futurs backends vidéo, endpoints d’usage
- **couche de plugin canal/fonctionnalité** : intégration Slack/Discord/voice-call/etc.
  qui consomme les capacités du cœur et les présente sur une surface

Par exemple, le TTS suit cette forme :

- le cœur possède la politique TTS au moment de la réponse, l’ordre de fallback, les préférences et la livraison par canal
- `openai`, `elevenlabs` et `microsoft` possèdent les implémentations de synthèse
- `voice-call` consomme l’assistant d’exécution TTS pour la téléphonie

Ce même modèle doit être privilégié pour les capacités futures.

### Exemple de plugin d’entreprise à capacités multiples

Un plugin d’entreprise doit sembler cohérent vu de l’extérieur. Si OpenClaw dispose de contrats partagés
pour les modèles, la voix, la transcription en temps réel, la voix en temps réel, la compréhension des médias,
la génération d’images, la génération de vidéos, la récupération Web et la recherche Web,
un fournisseur peut posséder toutes ses surfaces au même endroit :

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
      // hooks d’authentification / de catalogue de modèles / d’exécution
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // configuration vocale fournisseur — implémente directement l’interface SpeechProviderPlugin
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
        // logique d’identifiants + de récupération
      }),
    );
  },
};

export default plugin;
```

Ce qui importe n’est pas le nom exact des assistants. C’est la forme qui compte :

- un seul plugin possède la surface du fournisseur
- le cœur possède toujours les contrats de capacité
- les plugins de canal et de fonctionnalité consomment les assistants `api.runtime.*`, pas le code du fournisseur
- les tests de contrat peuvent affirmer que le plugin a enregistré les capacités
  qu’il prétend posséder

### Exemple de capacité : compréhension vidéo

OpenClaw traite déjà la compréhension image/audio/vidéo comme une seule
capacité partagée. Le même modèle de propriété s’y applique :

1. le cœur définit le contrat de compréhension des médias
2. les plugins fournisseurs enregistrent `describeImage`, `transcribeAudio` et
   `describeVideo` selon les cas
3. les plugins de canal et de fonctionnalité consomment le comportement partagé du cœur au lieu
   de se brancher directement sur le code du fournisseur

Cela évite d’intégrer dans le cœur les hypothèses vidéo d’un seul fournisseur. Le plugin possède
la surface du fournisseur ; le cœur possède le contrat de capacité et le comportement de fallback.

La génération vidéo utilise déjà cette même séquence : le cœur possède le contrat de
capacité typé et l’assistant d’exécution, et les plugins fournisseurs enregistrent
des implémentations `api.registerVideoGenerationProvider(...)` sur ce contrat.

Besoin d’une checklist de déploiement concrète ? Voir
[Capability Cookbook](/fr/plugins/architecture).

## Contrats et application

La surface API du plugin est intentionnellement typée et centralisée dans
`OpenClawPluginApi`. Ce contrat définit les points d’enregistrement pris en charge et
les assistants d’exécution sur lesquels un plugin peut s’appuyer.

Pourquoi c’est important :

- les auteurs de plugins disposent d’un standard interne stable
- le cœur peut rejeter une propriété en double, par exemple deux plugins enregistrant le même
  identifiant de fournisseur
- le démarrage peut afficher des diagnostics exploitables pour un enregistrement mal formé
- les tests de contrat peuvent faire respecter la propriété des plugins bundlés et empêcher les dérives silencieuses

Il existe deux niveaux d’application :

1. **application de l’enregistrement à l’exécution**
   Le registre des plugins valide les enregistrements à mesure que les plugins se chargent. Exemples :
   les identifiants de fournisseur dupliqués, les identifiants de fournisseur vocal dupliqués et les enregistrements
   mal formés produisent des diagnostics de plugin au lieu d’un comportement indéfini.
2. **tests de contrat**
   Les plugins bundlés sont capturés dans des registres de contrat pendant les exécutions de test afin
   qu’OpenClaw puisse affirmer explicitement la propriété. Aujourd’hui, cela est utilisé pour les fournisseurs de modèles,
   les fournisseurs vocaux, les fournisseurs de recherche Web et la propriété de l’enregistrement bundlé.

L’effet pratique est qu’OpenClaw sait, dès le départ, quel plugin possède quelle
surface. Cela permet au cœur et aux canaux de composer de manière fluide, car la propriété est
déclarée, typée et testable plutôt qu’implicite.

### Ce qui a sa place dans un contrat

Les bons contrats de plugin sont :

- typés
- petits
- spécifiques à une capacité
- possédés par le cœur
- réutilisables par plusieurs plugins
- consommables par les canaux/fonctionnalités sans connaissance du fournisseur

Les mauvais contrats de plugin sont :

- une politique spécifique au fournisseur cachée dans le cœur
- des échappatoires ponctuelles pour un plugin qui contournent le registre
- du code de canal qui accède directement à une implémentation fournisseur
- des objets d’exécution ad hoc qui ne font pas partie de `OpenClawPluginApi` ou
  de `api.runtime`

En cas de doute, augmentez le niveau d’abstraction : définissez d’abord la capacité, puis
laissez les plugins s’y brancher.

## Modèle d’exécution

Les plugins OpenClaw natifs s’exécutent **dans le processus** avec la Gateway. Ils ne sont pas
sandboxés. Un plugin natif chargé partage la même limite de confiance au niveau du processus que
le code du cœur.

Implications :

- un plugin natif peut enregistrer des outils, des gestionnaires réseau, des hooks et des services
- un bug dans un plugin natif peut faire planter ou déstabiliser la gateway
- un plugin natif malveillant équivaut à une exécution de code arbitraire dans le processus OpenClaw

Les bundles compatibles sont plus sûrs par défaut, car OpenClaw les traite actuellement
comme des packs de métadonnées/contenu. Dans les versions actuelles, cela signifie principalement des
Skills bundlées.

Utilisez des listes d’autorisation et des chemins explicites d’installation/chargement pour les plugins non bundlés. Traitez
les plugins d’espace de travail comme du code de développement, et non comme des valeurs par défaut de production.

Pour les noms de package bundlés de l’espace de travail, gardez l’identifiant du plugin ancré dans le nom npm :
`@openclaw/<id>` par défaut, ou un suffixe typé approuvé tel que
`-provider`, `-plugin`, `-speech`, `-sandbox` ou `-media-understanding` lorsque
le package expose intentionnellement un rôle de plugin plus étroit.

Remarque importante sur la confiance :

- `plugins.allow` fait confiance aux **identifiants de plugin**, et non à la provenance de la source.
- Un plugin d’espace de travail avec le même identifiant qu’un plugin bundlé masque intentionnellement
  la copie bundlée lorsque ce plugin d’espace de travail est activé/sur liste d’autorisation.
- C’est normal et utile pour le développement local, les tests de correctifs et les correctifs urgents.

## Limite d’export

OpenClaw exporte des capacités, pas des commodités d’implémentation.

Gardez l’enregistrement des capacités public. Réduisez les exports d’assistance hors contrat :

- sous-chemins d’assistance spécifiques aux plugins bundlés
- sous-chemins de plomberie d’exécution non destinés à l’API publique
- assistants de commodité spécifiques au fournisseur
- assistants d’installation/onboarding qui sont des détails d’implémentation

Certains sous-chemins d’assistance de plugins bundlés restent encore dans la map d’export SDK générée
pour des raisons de compatibilité et de maintenance des plugins bundlés. Exemples actuels :
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` et plusieurs joints `plugin-sdk/matrix*`. Traitez-les comme des
exports réservés de détail d’implémentation, et non comme le modèle SDK recommandé pour
les nouveaux plugins tiers.

## Pipeline de chargement

Au démarrage, OpenClaw fait approximativement ceci :

1. découvre les racines de plugins candidates
2. lit les manifests natifs ou les manifests de bundles compatibles ainsi que les métadonnées de package
3. rejette les candidats non sûrs
4. normalise la configuration du plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. décide de l’activation pour chaque candidat
6. charge les modules natifs activés via jiti
7. appelle les hooks natifs `register(api)` (ou `activate(api)` — un alias legacy) et collecte les enregistrements dans le registre des plugins
8. expose le registre aux surfaces de commandes/d’exécution

<Note>
`activate` est un alias legacy de `register` — le chargeur résout celui qui est présent (`def.register ?? def.activate`) et l’appelle au même endroit. Tous les plugins bundlés utilisent `register` ; préférez `register` pour les nouveaux plugins.
</Note>

Les garde-fous de sécurité se produisent **avant** l’exécution à l’exécution. Les candidats sont bloqués
lorsque l’entrée sort de la racine du plugin, que le chemin est accessible en écriture à tous, ou que la propriété
du chemin semble suspecte pour les plugins non bundlés.

### Comportement manifest-first

Le manifest est la source de vérité du plan de contrôle. OpenClaw l’utilise pour :

- identifier le plugin
- découvrir les canaux/Skills/schéma de configuration déclarés ou les capacités du bundle
- valider `plugins.entries.<id>.config`
- enrichir les libellés/placeholders de l’UI de contrôle
- afficher les métadonnées d’installation/catalogue
- préserver des descripteurs d’activation et d’installation peu coûteux sans charger l’exécution du plugin

Pour les plugins natifs, le module d’exécution est la partie plan de données. Il enregistre le
comportement réel comme les hooks, outils, commandes ou flux de fournisseur.

Les blocs optionnels `activation` et `setup` du manifest restent sur le plan de contrôle.
Ce sont des descripteurs à métadonnées uniquement pour la planification d’activation et la découverte d’installation ;
ils ne remplacent pas l’enregistrement à l’exécution, `register(...)` ou `setupEntry`.
Les premiers consommateurs d’activation active utilisent maintenant les indications de commande, de canal et de fournisseur du manifest
pour restreindre le chargement des plugins avant une matérialisation plus large du registre :

- le chargement CLI se limite aux plugins qui possèdent la commande primaire demandée
- la résolution de l’installation/des plugins de canal se limite aux plugins qui possèdent
  l’identifiant de canal demandé
- la résolution explicite d’installation/d’exécution du fournisseur se limite aux plugins qui possèdent
  l’identifiant de fournisseur demandé

La découverte de l’installation privilégie désormais les identifiants appartenant aux descripteurs tels que `setup.providers` et
`setup.cliBackends` pour restreindre les plugins candidats avant de revenir à
`setup-api` pour les plugins qui ont encore besoin de hooks d’exécution au moment de l’installation. Si plusieurs plugins découverts revendiquent le même
identifiant normalisé de fournisseur d’installation ou de backend CLI, la recherche d’installation refuse le propriétaire ambigu au lieu de s’appuyer sur l’ordre de découverte.

### Ce que le chargeur met en cache

OpenClaw conserve de courts caches en processus pour :

- les résultats de découverte
- les données du registre de manifests
- les registres de plugins chargés

Ces caches réduisent les démarrages en rafale et le surcoût des commandes répétées. Il faut les considérer comme des caches de performance de courte durée, et non comme de la persistance.

Remarque sur les performances :

- Définissez `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` ou
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` pour désactiver ces caches.
- Réglez les fenêtres de cache avec `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` et
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Modèle de registre

Les plugins chargés ne modifient pas directement des variables globales arbitraires du cœur. Ils s’enregistrent dans un
registre central de plugins.

Le registre suit :

- les enregistrements de plugins (identité, source, origine, statut, diagnostics)
- les outils
- les hooks legacy et les hooks typés
- les canaux
- les fournisseurs
- les gestionnaires RPC de Gateway
- les routes HTTP
- les registrars CLI
- les services d’arrière-plan
- les commandes appartenant au plugin

Les fonctionnalités du cœur lisent ensuite ce registre au lieu de communiquer directement avec les modules de plugin.
Cela maintient un chargement unidirectionnel :

- module du plugin -> enregistrement dans le registre
- runtime du cœur -> consommation du registre

Cette séparation est importante pour la maintenabilité. Elle signifie que la plupart des surfaces du cœur n’ont
besoin que d’un seul point d’intégration : « lire le registre », et non « traiter chaque module de plugin
comme un cas particulier ».

## Callbacks de liaison de conversation

Les plugins qui lient une conversation peuvent réagir lorsqu’une approbation est résolue.

Utilisez `api.onConversationBindingResolved(...)` pour recevoir un callback après qu’une demande de liaison a été approuvée ou refusée :

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // A binding now exists for this plugin + conversation.
        console.log(event.binding?.conversationId);
        return;
      }

      // The request was denied; clear any local pending state.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Champs de la charge utile du callback :

- `status` : `"approved"` ou `"denied"`
- `decision` : `"allow-once"`, `"allow-always"` ou `"deny"`
- `binding` : la liaison résolue pour les demandes approuvées
- `request` : le résumé de la demande d’origine, l’indication de détachement, l’identifiant de l’expéditeur et
  les métadonnées de conversation

Ce callback est uniquement une notification. Il ne change pas qui est autorisé à lier une
conversation, et il s’exécute après la fin du traitement d’approbation du cœur.

## Hooks d’exécution des fournisseurs

Les plugins fournisseurs ont désormais deux couches :

- métadonnées de manifest : `providerAuthEnvVars` pour une recherche légère de l’authentification du fournisseur par variables d’environnement
  avant le chargement du runtime, `providerAuthAliases` pour les variantes de fournisseur qui partagent
  l’authentification, `channelEnvVars` pour une recherche légère de l’environnement/de l’installation du canal avant le chargement du runtime,
  plus `providerAuthChoices` pour des libellés légers d’onboarding/de choix d’authentification et des métadonnées de drapeaux CLI avant le chargement du runtime
- hooks au moment de la configuration : `catalog` / `discovery` legacy plus `applyConfigDefaults`
- hooks d’exécution : `normalizeModelId`, `normalizeTransport`,
  `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `resolveExternalAuthProfiles`,
  `shouldDeferSyntheticProfileAuth`,
  `resolveDynamicModel`, `prepareDynamicModel`, `normalizeResolvedModel`,
  `contributeResolvedModelCompat`, `capabilities`,
  `normalizeToolSchemas`, `inspectToolSchemas`,
  `resolveReasoningOutputMode`, `prepareExtraParams`, `createStreamFn`,
  `wrapStreamFn`, `resolveTransportTurnState`,
  `resolveWebSocketSessionPolicy`, `formatApiKey`, `refreshOAuth`,
  `buildAuthDoctorHint`, `matchesContextOverflowError`,
  `classifyFailoverReason`, `isCacheTtlEligible`,
  `buildMissingAuthMessage`, `suppressBuiltInModel`, `augmentModelCatalog`,
  `resolveThinkingProfile`, `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw possède toujours la boucle agent générique, le failover, la gestion des transcriptions et la
politique des outils. Ces hooks constituent la surface d’extension pour le comportement spécifique au fournisseur sans
nécessiter tout un transport d’inférence personnalisé.

Utilisez le manifest `providerAuthEnvVars` lorsque le fournisseur a des identifiants basés sur l’environnement
que les chemins génériques d’authentification/statut/sélecteur de modèle doivent voir sans charger le runtime du plugin.
Utilisez le manifest `providerAuthAliases` lorsqu’un identifiant de fournisseur doit réutiliser
les variables d’environnement, profils d’authentification, authentification adossée à la configuration et choix d’onboarding par clé API d’un autre identifiant de fournisseur. Utilisez le manifest `providerAuthChoices` lorsque les surfaces CLI d’onboarding/de choix d’authentification
doivent connaître l’identifiant de choix du fournisseur, les libellés de groupe et le câblage simple d’authentification à un seul drapeau sans charger le runtime du fournisseur. Conservez `envVars` dans le runtime du fournisseur pour les indications à destination des opérateurs telles que les libellés d’onboarding ou les variables d’installation d’ID client/secret client OAuth.

Utilisez le manifest `channelEnvVars` lorsqu’un canal a une authentification ou une installation pilotée par l’environnement que
les mécanismes génériques de repli vers l’environnement shell, les vérifications config/statut ou les invites d’installation doivent voir
sans charger le runtime du canal.

### Ordre des hooks et utilisation

Pour les plugins de modèle/fournisseur, OpenClaw appelle les hooks dans cet ordre approximatif.
La colonne « Quand l’utiliser » est le guide rapide de décision.

| #   | Hook                              | Ce qu’il fait                                                                                                   | Quand l’utiliser                                                                                                                                 |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publie la configuration du fournisseur dans `models.providers` pendant la génération de `models.json`                                | Le fournisseur possède un catalogue ou des valeurs par défaut d’URL de base                                                                                                |
| 2   | `applyConfigDefaults`             | Applique les valeurs par défaut globales de configuration appartenant au fournisseur pendant la matérialisation de la configuration                                      | Les valeurs par défaut dépendent du mode d’authentification, de l’environnement ou de la sémantique de famille de modèles du fournisseur                                                                       |
| --  | _(built-in model lookup)_         | OpenClaw essaie d’abord le chemin normal de registre/catalogue                                                          | _(pas un hook de plugin)_                                                                                                                       |
| 3   | `normalizeModelId`                | Normalise les alias legacy ou preview d’identifiant de modèle avant la recherche                                                     | Le fournisseur possède le nettoyage des alias avant la résolution canonique du modèle                                                                               |
| 4   | `normalizeTransport`              | Normalise `api` / `baseUrl` de la famille de fournisseurs avant l’assemblage générique du modèle                                      | Le fournisseur possède le nettoyage du transport pour des identifiants de fournisseur personnalisés dans la même famille de transport                                                        |
| 5   | `normalizeConfig`                 | Normalise `models.providers.<id>` avant la résolution à l’exécution/du fournisseur                                           | Le fournisseur a besoin d’un nettoyage de configuration qui doit rester avec le plugin ; les assistants bundlés de la famille Google assurent aussi le support des entrées de configuration Google prises en charge |
| 6   | `applyNativeStreamingUsageCompat` | Applique aux fournisseurs de configuration les réécritures de compatibilité d’usage de streaming natif                                               | Le fournisseur a besoin de correctifs de métadonnées d’usage de streaming natif pilotés par endpoint                                                                        |
| 7   | `resolveConfigApiKey`             | Résout l’authentification par marqueur d’environnement pour les fournisseurs de configuration avant le chargement de l’authentification à l’exécution                                       | Le fournisseur possède une résolution de clé API par marqueur d’environnement ; `amazon-bedrock` dispose aussi ici d’un résolveur intégré de marqueur d’environnement AWS                |
| 8   | `resolveSyntheticAuth`            | Expose une authentification locale/autohébergée ou adossée à la configuration sans persister le texte en clair                                   | Le fournisseur peut fonctionner avec un marqueur d’identifiants synthétique/local                                                                               |
| 9   | `resolveExternalAuthProfiles`     | Superpose des profils d’authentification externes appartenant au fournisseur ; la `persistence` par défaut est `runtime-only` pour les identifiants possédés par la CLI/l’application | Le fournisseur réutilise des identifiants d’authentification externes sans persister des jetons de rafraîchissement copiés                                                          |
| 10  | `shouldDeferSyntheticProfileAuth` | Abaisse la priorité des placeholders de profils synthétiques stockés par rapport à l’authentification adossée à l’environnement/la configuration                                      | Le fournisseur stocke des profils placeholders synthétiques qui ne doivent pas être prioritaires                                                               |
| 11  | `resolveDynamicModel`             | Fallback synchrone pour les identifiants de modèle appartenant au fournisseur qui ne sont pas encore dans le registre local                                       | Le fournisseur accepte des identifiants de modèle arbitraires en amont                                                                                               |
| 12  | `prepareDynamicModel`             | Préparation asynchrone, puis `resolveDynamicModel` s’exécute à nouveau                                                           | Le fournisseur a besoin de métadonnées réseau avant de résoudre des identifiants inconnus                                                                                |
| 13  | `normalizeResolvedModel`          | Réécriture finale avant que le runner embarqué utilise le modèle résolu                                               | Le fournisseur a besoin de réécritures de transport tout en utilisant un transport du cœur                                                                           |
| 14  | `contributeResolvedModelCompat`   | Apporte des indicateurs de compatibilité pour des modèles fournisseurs derrière un autre transport compatible                                  | Le fournisseur reconnaît ses propres modèles sur des transports proxy sans prendre le contrôle du fournisseur                                                     |
| 15  | `capabilities`                    | Métadonnées de transcription/d’outillage appartenant au fournisseur utilisées par la logique partagée du cœur                                           | Le fournisseur a besoin de particularités de transcription/famille de fournisseur                                                                                            |
| 16  | `normalizeToolSchemas`            | Normalise les schémas d’outils avant qu’ils ne soient vus par le runner embarqué                                                    | Le fournisseur a besoin d’un nettoyage de schéma pour sa famille de transport                                                                                              |
| 17  | `inspectToolSchemas`              | Expose des diagnostics de schéma appartenant au fournisseur après normalisation                                                  | Le fournisseur veut des avertissements sur les mots-clés sans apprendre au cœur des règles spécifiques au fournisseur                                                               |
| 18  | `resolveReasoningOutputMode`      | Sélectionne le contrat de sortie de raisonnement natif ou balisé                                                              | Le fournisseur a besoin d’une sortie raisonnement/finale balisée au lieu de champs natifs                                                                       |
| 19  | `prepareExtraParams`              | Normalisation des paramètres de requête avant les wrappers génériques d’options de flux                                              | Le fournisseur a besoin de paramètres de requête par défaut ou d’un nettoyage de paramètres par fournisseur                                                                         |
| 20  | `createStreamFn`                  | Remplace complètement le chemin de flux normal par un transport personnalisé                                                   | Le fournisseur a besoin d’un protocole wire personnalisé, et pas seulement d’un wrapper                                                                                   |
| 21  | `wrapStreamFn`                    | Wrapper de flux après l’application des wrappers génériques                                                              | Le fournisseur a besoin de wrappers de compatibilité d’en-têtes/corps/modèle de requête sans transport personnalisé                                                        |
| 22  | `resolveTransportTurnState`       | Attache des en-têtes ou métadonnées natifs de transport par tour                                                           | Le fournisseur veut que les transports génériques envoient une identité de tour native au fournisseur                                                                     |
| 23  | `resolveWebSocketSessionPolicy`   | Attache des en-têtes WebSocket natifs ou une politique de refroidissement de session                                                    | Le fournisseur veut que les transports WebSocket génériques ajustent les en-têtes de session ou la politique de fallback                                                             |
| 24  | `formatApiKey`                    | Formateur de profil d’authentification : le profil stocké devient la chaîne `apiKey` d’exécution                                     | Le fournisseur stocke des métadonnées d’authentification supplémentaires et a besoin d’une forme personnalisée de jeton à l’exécution                                                                  |
| 25  | `refreshOAuth`                    | Remplacement du rafraîchissement OAuth pour des endpoints de rafraîchissement personnalisés ou une politique d’échec de rafraîchissement                                  | Le fournisseur ne correspond pas aux mécanismes de rafraîchissement partagés `pi-ai`                                                                                         |
| 26  | `buildAuthDoctorHint`             | Indication de réparation ajoutée lorsqu’un rafraîchissement OAuth échoue                                                                  | Le fournisseur a besoin d’une aide de réparation d’authentification appartenant au fournisseur après un échec de rafraîchissement                                                                    |
| 27  | `matchesContextOverflowError`     | Détecteur de dépassement de fenêtre de contexte appartenant au fournisseur                                                                 | Le fournisseur a des erreurs brutes de dépassement que les heuristiques génériques manqueraient                                                                              |
| 28  | `classifyFailoverReason`          | Classification de raison de failover appartenant au fournisseur                                                                  | Le fournisseur peut mapper des erreurs brutes d’API/de transport vers limitation de débit/surcharge/etc.                                                                        |
| 29  | `isCacheTtlEligible`              | Politique de cache des prompts pour les fournisseurs proxy/backhaul                                                               | Le fournisseur a besoin d’un contrôle TTL spécifique au proxy                                                                                              |
| 30  | `buildMissingAuthMessage`         | Remplacement du message générique de récupération en cas d’authentification manquante                                                      | Le fournisseur a besoin d’une indication de récupération spécifique au fournisseur en cas d’authentification manquante                                                                               |
| 31  | `suppressBuiltInModel`            | Suppression des modèles obsolètes en amont, avec indication d’erreur optionnelle visible par l’utilisateur                                          | Le fournisseur doit masquer des lignes obsolètes en amont ou les remplacer par une indication du fournisseur                                                               |
| 32  | `augmentModelCatalog`             | Lignes de catalogue synthétiques/finales ajoutées après la découverte                                                          | Le fournisseur a besoin de lignes synthétiques de compatibilité future dans `models list` et les sélecteurs                                                                   |
| 33  | `resolveThinkingProfile`          | Définition du niveau `/think` spécifique au modèle, libellés d’affichage et valeur par défaut                                                 | Le fournisseur expose une échelle de réflexion personnalisée ou un libellé binaire pour certains modèles                                                               |
| 34  | `isBinaryThinking`                | Hook de compatibilité pour le basculement de raisonnement on/off                                                                     | Le fournisseur expose uniquement un raisonnement binaire activé/désactivé                                                                                                |
| 35  | `supportsXHighThinking`           | Hook de compatibilité pour la prise en charge du raisonnement `xhigh`                                                                   | Le fournisseur veut `xhigh` uniquement sur un sous-ensemble de modèles                                                                                           |
| 36  | `resolveDefaultThinkingLevel`     | Hook de compatibilité pour le niveau `/think` par défaut                                                                      | Le fournisseur possède la politique `/think` par défaut pour une famille de modèles                                                                                    |
| 37  | `isModernModelRef`                | Détecteur de modèle moderne pour les filtres de profil live et la sélection smoke                                              | Le fournisseur possède la logique de correspondance du modèle préféré live/smoke                                                                                           |
| 38  | `prepareRuntimeAuth`              | Échange un identifiant configuré contre le vrai jeton/la vraie clé d’exécution juste avant l’inférence                       | Le fournisseur a besoin d’un échange de jeton ou d’un identifiant de requête de courte durée                                                                           |
| 39  | `resolveUsageAuth`                | Résout les identifiants d’usage/de facturation pour `/usage` et les surfaces d’état associées                                     | Le fournisseur a besoin d’une logique personnalisée d’analyse du jeton d’usage/quota ou d’un identifiant d’usage différent                                                             |
| 40  | `fetchUsageSnapshot`              | Récupère et normalise des instantanés d’usage/de quota spécifiques au fournisseur une fois l’authentification résolue                             | Le fournisseur a besoin d’un endpoint d’usage spécifique au fournisseur ou d’un analyseur de charge utile                                                                         |
| 41  | `createEmbeddingProvider`         | Construit un adaptateur d’embedding appartenant au fournisseur pour la mémoire/la recherche                                                     | Le comportement d’embedding de la mémoire appartient au plugin fournisseur                                                                                  |
| 42  | `buildReplayPolicy`               | Renvoie une politique de relecture contrôlant la gestion des transcriptions pour le fournisseur                                        | Le fournisseur a besoin d’une politique de transcription personnalisée (par exemple, suppression des blocs de réflexion)                                                             |
| 43  | `sanitizeReplayHistory`           | Réécrit l’historique de relecture après le nettoyage générique des transcriptions                                                        | Le fournisseur a besoin de réécritures de relecture spécifiques au fournisseur au-delà des assistants partagés de Compaction                                                           |
| 44  | `validateReplayTurns`             | Validation finale ou remodelage des tours de relecture avant le runner embarqué                                           | Le transport du fournisseur a besoin d’une validation des tours plus stricte après l’assainissement générique                                                                  |
| 45  | `onModelSelected`                 | Exécute des effets de bord post-sélection appartenant au fournisseur                                                                 | Le fournisseur a besoin de télémétrie ou d’un état appartenant au fournisseur lorsqu’un modèle devient actif                                                                |

`normalizeModelId`, `normalizeTransport` et `normalizeConfig` vérifient d’abord le
plugin fournisseur correspondant, puis passent aux autres plugins fournisseurs capables de hooks
jusqu’à ce que l’un d’eux modifie réellement l’identifiant du modèle ou le transport/la configuration. Cela permet aux shims d’alias/de compatibilité de fournisseur de continuer à fonctionner sans exiger de l’appelant qu’il sache quel
plugin bundlé possède la réécriture. Si aucun hook fournisseur ne réécrit une entrée de configuration
prise en charge de la famille Google, le normaliseur de configuration Google bundlé applique
quand même ce nettoyage de compatibilité.

Si le fournisseur a besoin d’un protocole wire entièrement personnalisé ou d’un exécuteur de requêtes personnalisé,
il s’agit d’une autre classe d’extension. Ces hooks sont destinés au comportement fournisseur
qui s’exécute encore sur la boucle d’inférence normale d’OpenClaw.

### Exemple de fournisseur

```ts
api.registerProvider({
  id: "example-proxy",
  label: "Example Proxy",
  auth: [],
  catalog: {
    order: "simple",
    run: async (ctx) => {
      const apiKey = ctx.resolveProviderApiKey("example-proxy").apiKey;
      if (!apiKey) {
        return null;
      }
      return {
        provider: {
          baseUrl: "https://proxy.example.com/v1",
          apiKey,
          api: "openai-completions",
          models: [{ id: "auto", name: "Auto" }],
        },
      };
    },
  },
  resolveDynamicModel: (ctx) => ({
    id: ctx.modelId,
    name: ctx.modelId,
    provider: "example-proxy",
    api: "openai-completions",
    baseUrl: "https://proxy.example.com/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }),
  prepareRuntimeAuth: async (ctx) => {
    const exchanged = await exchangeToken(ctx.apiKey);
    return {
      apiKey: exchanged.token,
      baseUrl: exchanged.baseUrl,
      expiresAt: exchanged.expiresAt,
    };
  },
  resolveUsageAuth: async (ctx) => {
    const auth = await ctx.resolveOAuthToken();
    return auth ? { token: auth.token } : null;
  },
  fetchUsageSnapshot: async (ctx) => {
    return await fetchExampleProxyUsage(ctx.token, ctx.timeoutMs, ctx.fetchFn);
  },
});
```

### Exemples intégrés

- Anthropic utilise `resolveDynamicModel`, `capabilities`, `buildAuthDoctorHint`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `isCacheTtlEligible`,
  `resolveThinkingProfile`, `applyConfigDefaults`, `isModernModelRef`
  et `wrapStreamFn` parce qu’il possède la compatibilité ascendante de Claude 4.6,
  les indications de famille de fournisseur, les conseils de réparation d’authentification,
  l’intégration du endpoint d’usage, l’éligibilité du cache de prompts, les valeurs par défaut de configuration sensibles à l’authentification, la politique de réflexion
  par défaut/adaptative de Claude et la mise en forme de flux spécifique à Anthropic pour
  les en-têtes bêta, `/fast` / `serviceTier` et `context1m`.
- Les assistants de flux spécifiques à Claude d’Anthropic restent pour l’instant dans le
  joint public `api.ts` / `contract-api.ts` propre au plugin bundlé. Cette surface de package
  exporte `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` et les constructeurs de wrappers Anthropic
  de plus bas niveau au lieu d’élargir le SDK générique autour des règles d’en-tête bêta
  d’un seul fournisseur.
- OpenAI utilise `resolveDynamicModel`, `normalizeResolvedModel` et
  `capabilities` ainsi que `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `resolveThinkingProfile` et `isModernModelRef`
  parce qu’il possède la compatibilité ascendante de GPT-5.4, la normalisation directe OpenAI
  `openai-completions` -> `openai-responses`, les indications d’authentification sensibles à Codex,
  la suppression de Spark, les lignes synthétiques de liste OpenAI, et la politique GPT-5 de réflexion /
  modèle live ; la famille de flux `openai-responses-defaults` possède les
  wrappers natifs OpenAI Responses partagés pour les en-têtes d’attribution,
  `/fast`/`serviceTier`, la verbosité du texte, la recherche Web native de Codex,
  la mise en forme de charge utile compatible avec le raisonnement et la gestion du contexte Responses.
- OpenRouter utilise `catalog` ainsi que `resolveDynamicModel` et
  `prepareDynamicModel` parce que le fournisseur est pass-through et peut exposer de nouveaux
  identifiants de modèles avant la mise à jour du catalogue statique d’OpenClaw ; il utilise aussi
  `capabilities`, `wrapStreamFn` et `isCacheTtlEligible` pour garder hors du cœur
  les en-têtes de requête spécifiques au fournisseur, les métadonnées de routage, les correctifs de raisonnement et
  la politique de cache des prompts. Sa politique de relecture provient de la
  famille `passthrough-gemini`, tandis que la famille de flux `openrouter-thinking`
  possède l’injection de raisonnement proxy et les ignorances de modèles non pris en charge / `auto`.
- GitHub Copilot utilise `catalog`, `auth`, `resolveDynamicModel` et
  `capabilities` ainsi que `prepareRuntimeAuth` et `fetchUsageSnapshot` parce qu’il
  a besoin d’une connexion par appareil appartenant au fournisseur, d’un comportement de fallback de modèle, de particularités de transcription Claude,
  d’un échange jeton GitHub -> jeton Copilot et d’un endpoint d’usage appartenant au fournisseur.
- OpenAI Codex utilise `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` et `augmentModelCatalog` ainsi que
  `prepareExtraParams`, `resolveUsageAuth` et `fetchUsageSnapshot` parce qu’il
  s’exécute encore sur les transports OpenAI du cœur mais possède sa normalisation de transport/d’URL de base,
  sa politique de fallback de rafraîchissement OAuth, son choix de transport par défaut,
  ses lignes synthétiques de catalogue Codex et l’intégration du endpoint d’usage ChatGPT ; il
  partage la même famille de flux `openai-responses-defaults` qu’OpenAI direct.
- Google AI Studio et Gemini CLI OAuth utilisent `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` et `isModernModelRef` parce que la
  famille de relecture `google-gemini` possède le fallback de compatibilité ascendante de Gemini 3.1,
  la validation native de relecture Gemini, l’assainissement de la relecture bootstrap, le mode
  de sortie de raisonnement balisé et la correspondance des modèles modernes, tandis que la
  famille de flux `google-thinking` possède la normalisation de la charge utile de réflexion de Gemini ;
  Gemini CLI OAuth utilise aussi `formatApiKey`, `resolveUsageAuth` et
  `fetchUsageSnapshot` pour le formatage du jeton, l’analyse du jeton et le
  câblage du endpoint de quota.
- Anthropic Vertex utilise `buildReplayPolicy` via la
  famille de relecture `anthropic-by-model` afin que le nettoyage de relecture spécifique à Claude reste
  limité aux identifiants Claude au lieu de s’appliquer à chaque transport `anthropic-messages`.
- Amazon Bedrock utilise `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` et `resolveThinkingProfile` parce qu’il possède
  la classification spécifique à Bedrock des erreurs throttle/not-ready/context-overflow
  pour le trafic Anthropic-sur-Bedrock ; sa politique de relecture partage toujours le même
  garde-fou `anthropic-by-model` limité à Claude.
- OpenRouter, Kilocode, Opencode et Opencode Go utilisent `buildReplayPolicy`
  via la famille de relecture `passthrough-gemini` parce qu’ils proxifient des modèles Gemini
  via des transports compatibles OpenAI et ont besoin de l’assainissement des signatures de pensée
  Gemini sans validation native de relecture Gemini ni réécritures bootstrap.
- MiniMax utilise `buildReplayPolicy` via la
  famille de relecture `hybrid-anthropic-openai` parce qu’un même fournisseur possède à la fois la sémantique
  de messages Anthropic et la sémantique compatible OpenAI ; cela conserve la suppression
  des blocs de réflexion propres à Claude du côté Anthropic tout en rétablissant le mode de sortie de raisonnement en natif, et la famille de flux `minimax-fast-mode` possède
  les réécritures de modèles fast-mode sur le chemin de flux partagé.
- Moonshot utilise `catalog`, `resolveThinkingProfile` et `wrapStreamFn` parce qu’il utilise toujours le transport partagé
  OpenAI mais a besoin d’une normalisation de charge utile de réflexion appartenant au fournisseur ; la
  famille de flux `moonshot-thinking` mappe la configuration ainsi que l’état `/think` sur sa
  charge utile native de réflexion binaire.
- Kilocode utilise `catalog`, `capabilities`, `wrapStreamFn` et
  `isCacheTtlEligible` parce qu’il a besoin d’en-têtes de requête appartenant au fournisseur,
  d’une normalisation de charge utile de raisonnement, d’indications de transcription Gemini et d’un
  contrôle TTL de cache Anthropic ; la famille de flux `kilocode-thinking` conserve l’injection de réflexion Kilo
  sur le chemin de flux proxy partagé tout en ignorant `kilo/auto` et
  d’autres identifiants de modèles proxy qui ne prennent pas en charge de charges utiles de raisonnement explicites.
- Z.AI utilise `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `resolveThinkingProfile`, `isModernModelRef`,
  `resolveUsageAuth` et `fetchUsageSnapshot` parce qu’il possède le fallback GLM-5,
  les valeurs par défaut `tool_stream`, l’UX de réflexion binaire, la correspondance de modèles modernes, ainsi que
  l’authentification d’usage et la récupération de quota ; la famille de flux `tool-stream-default-on` conserve
  le wrapper `tool_stream` activé par défaut hors du code glue manuscrit par fournisseur.
- xAI utilise `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` et `isModernModelRef`
  parce qu’il possède la normalisation native de transport xAI Responses, les réécritures
  d’alias Grok fast-mode, la valeur par défaut `tool_stream`, le nettoyage strict-tool / charge utile de raisonnement,
  la réutilisation de l’authentification fallback pour les outils appartenant au plugin, la résolution
  compatible ascendante des modèles Grok, ainsi que les correctifs de compatibilité appartenant au fournisseur comme le profil de schéma d’outil xAI,
  les mots-clés de schéma non pris en charge, `web_search` natif et le décodage des arguments
  d’appel d’outil avec entités HTML.
- Mistral, OpenCode Zen et OpenCode Go utilisent uniquement `capabilities` pour garder
  hors du cœur les particularités de transcription/d’outillage.
- Les fournisseurs bundlés limités au catalogue tels que `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` et `volcengine` utilisent
  uniquement `catalog`.
- Qwen utilise `catalog` pour son fournisseur de texte ainsi que des enregistrements partagés de compréhension des médias et
  de génération de vidéos pour ses surfaces multimodales.
- MiniMax et Xiaomi utilisent `catalog` ainsi que des hooks d’usage parce que leur comportement `/usage`
  appartient au plugin même si l’inférence s’exécute encore via les transports partagés.

## Assistants d’exécution

Les plugins peuvent accéder à certains assistants du cœur via `api.runtime`. Pour le TTS :

```ts
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

Remarques :

- `textToSpeech` renvoie la charge utile normale de sortie TTS du cœur pour les surfaces de fichier/note vocale.
- Utilise la configuration `messages.tts` du cœur et la sélection du fournisseur.
- Renvoie un buffer audio PCM + un taux d’échantillonnage. Les plugins doivent rééchantillonner/encoder pour les fournisseurs.
- `listVoices` est facultatif selon le fournisseur. Utilisez-le pour les sélecteurs de voix ou les flux d’installation appartenant au fournisseur.
- Les listes de voix peuvent inclure des métadonnées plus riches telles que des balises de langue, de genre et de personnalité pour des sélecteurs conscients du fournisseur.
- OpenAI et ElevenLabs prennent aujourd’hui en charge la téléphonie. Microsoft non.

Les plugins peuvent également enregistrer des fournisseurs vocaux via `api.registerSpeechProvider(...)`.

```ts
api.registerSpeechProvider({
  id: "acme-speech",
  label: "Acme Speech",
  isConfigured: ({ config }) => Boolean(config.messages?.tts),
  synthesize: async (req) => {
    return {
      audioBuffer: Buffer.from([]),
      outputFormat: "mp3",
      fileExtension: ".mp3",
      voiceCompatible: false,
    };
  },
});
```

Remarques :

- Conservez la politique TTS, le fallback et la livraison des réponses dans le cœur.
- Utilisez les fournisseurs vocaux pour le comportement de synthèse appartenant au fournisseur.
- L’entrée legacy Microsoft `edge` est normalisée vers l’identifiant de fournisseur `microsoft`.
- Le modèle de propriété préféré est orienté entreprise : un même plugin fournisseur peut posséder
  le texte, la voix, l’image et les futurs fournisseurs média à mesure qu’OpenClaw ajoute ces
  contrats de capacité.

Pour la compréhension image/audio/vidéo, les plugins enregistrent un
fournisseur typé unique de compréhension des médias plutôt qu’un sac clé/valeur générique :

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

Remarques :

- Conservez l’orchestration, le fallback, la configuration et le câblage des canaux dans le cœur.
- Conservez le comportement du fournisseur dans le plugin fournisseur.
- L’extension additive doit rester typée : nouvelles méthodes optionnelles, nouveaux champs de résultat
  optionnels, nouvelles capacités optionnelles.
- La génération de vidéos suit déjà le même modèle :
  - le cœur possède le contrat de capacité et l’assistant d’exécution
  - les plugins fournisseurs enregistrent `api.registerVideoGenerationProvider(...)`
  - les plugins de fonctionnalité/canal consomment `api.runtime.videoGeneration.*`

Pour les assistants d’exécution de compréhension des médias, les plugins peuvent appeler :

```ts
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});
```

Pour la transcription audio, les plugins peuvent utiliser soit le runtime de compréhension des médias,
soit l’alias STT plus ancien :

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Remarques :

- `api.runtime.mediaUnderstanding.*` est la surface partagée privilégiée pour
  la compréhension image/audio/vidéo.
- Utilise la configuration audio de compréhension des médias du cœur (`tools.media.audio`) et l’ordre de fallback des fournisseurs.
- Renvoie `{ text: undefined }` lorsqu’aucune sortie de transcription n’est produite (par exemple pour une entrée ignorée/non prise en charge).
- `api.runtime.stt.transcribeAudioFile(...)` reste disponible comme alias de compatibilité.

Les plugins peuvent également lancer des exécutions de sous-agent en arrière-plan via `api.runtime.subagent` :

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

Remarques :

- `provider` et `model` sont des remplacements par exécution facultatifs, pas des changements de session persistants.
- OpenClaw ne respecte ces champs de remplacement que pour les appelants de confiance.
- Pour les exécutions de fallback appartenant au plugin, les opérateurs doivent explicitement les autoriser avec `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Utilisez `plugins.entries.<id>.subagent.allowedModels` pour limiter les plugins de confiance à des cibles canoniques `provider/model` spécifiques, ou `"*"` pour autoriser explicitement n’importe quelle cible.
- Les exécutions de sous-agent de plugins non fiables fonctionnent toujours, mais les demandes de remplacement sont rejetées au lieu de basculer silencieusement en fallback.

Pour la recherche Web, les plugins peuvent consommer l’assistant d’exécution partagé au lieu
d’accéder directement au câblage de l’outil agent :

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "OpenClaw plugin runtime helpers",
    count: 5,
  },
});
```

Les plugins peuvent également enregistrer des fournisseurs de recherche Web via
`api.registerWebSearchProvider(...)`.

Remarques :

- Conservez dans le cœur la sélection du fournisseur, la résolution des identifiants et la sémantique partagée des requêtes.
- Utilisez des fournisseurs de recherche Web pour les transports de recherche spécifiques au fournisseur.
- `api.runtime.webSearch.*` est la surface partagée privilégiée pour les plugins de fonctionnalité/canal qui ont besoin d’un comportement de recherche sans dépendre du wrapper d’outil agent.

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "A friendly lobster mascot", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)` : génère une image à l’aide de la chaîne de fournisseurs de génération d’images configurée.
- `listProviders(...)` : liste les fournisseurs de génération d’images disponibles et leurs capacités.

## Routes HTTP de Gateway

Les plugins peuvent exposer des endpoints HTTP avec `api.registerHttpRoute(...)`.

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

Champs de route :

- `path` : chemin de route sous le serveur HTTP de la gateway.
- `auth` : obligatoire. Utilisez `"gateway"` pour exiger l’authentification normale de la gateway, ou `"plugin"` pour une authentification/vérification de Webhook gérée par le plugin.
- `match` : facultatif. `"exact"` (par défaut) ou `"prefix"`.
- `replaceExisting` : facultatif. Permet à un même plugin de remplacer son propre enregistrement de route existant.
- `handler` : renvoie `true` lorsque la route a traité la requête.

Remarques :

- `api.registerHttpHandler(...)` a été supprimé et provoquera une erreur de chargement du plugin. Utilisez `api.registerHttpRoute(...)` à la place.
- Les routes de plugin doivent déclarer `auth` explicitement.
- Les conflits exacts `path + match` sont rejetés sauf avec `replaceExisting: true`, et un plugin ne peut pas remplacer la route d’un autre plugin.
- Les routes qui se chevauchent avec des niveaux `auth` différents sont rejetées. Conservez les chaînes de retombée `exact`/`prefix` sur un même niveau d’authentification uniquement.
- Les routes `auth: "plugin"` ne reçoivent **pas** automatiquement les contextes d’exécution d’opérateur. Elles sont destinées aux Webhooks gérés par le plugin et à la vérification de signature, pas aux appels privilégiés aux assistants Gateway.
- Les routes `auth: "gateway"` s’exécutent dans un contexte d’exécution de requête Gateway, mais ce contexte est intentionnellement conservateur :
  - l’authentification bearer par secret partagé (`gateway.auth.mode = "token"` / `"password"`) maintient les contextes d’exécution des routes de plugin fixés à `operator.write`, même si l’appelant envoie `x-openclaw-scopes`
  - les modes HTTP fiables portant une identité (par exemple `trusted-proxy` ou `gateway.auth.mode = "none"` sur une entrée privée) n’honorent `x-openclaw-scopes` que lorsque l’en-tête est explicitement présent
  - si `x-openclaw-scopes` est absent sur ces requêtes de route de plugin portant une identité, le contexte d’exécution retombe sur `operator.write`
- Règle pratique : ne supposez pas qu’une route de plugin authentifiée par gateway constitue implicitement une surface d’administration. Si votre route nécessite un comportement réservé à l’administration, exigez un mode d’authentification portant une identité et documentez le contrat explicite de l’en-tête `x-openclaw-scopes`.

## Chemins d’import du SDK de plugin

Utilisez les sous-chemins du SDK au lieu de l’import monolithique `openclaw/plugin-sdk` lorsque
vous écrivez des plugins :

- `openclaw/plugin-sdk/plugin-entry` pour les primitives d’enregistrement de plugin.
- `openclaw/plugin-sdk/core` pour le contrat générique partagé côté plugin.
- `openclaw/plugin-sdk/config-schema` pour l’export du schéma Zod racine `openclaw.json`
  (`OpenClawSchema`).
- Primitives de canal stables telles que `openclaw/plugin-sdk/channel-setup`,
  `openclaw/plugin-sdk/setup-runtime`,
  `openclaw/plugin-sdk/setup-adapter-runtime`,
  `openclaw/plugin-sdk/setup-tools`,
  `openclaw/plugin-sdk/channel-pairing`,
  `openclaw/plugin-sdk/channel-contract`,
  `openclaw/plugin-sdk/channel-feedback`,
  `openclaw/plugin-sdk/channel-inbound`,
  `openclaw/plugin-sdk/channel-lifecycle`,
  `openclaw/plugin-sdk/channel-reply-pipeline`,
  `openclaw/plugin-sdk/command-auth`,
  `openclaw/plugin-sdk/secret-input` et
  `openclaw/plugin-sdk/webhook-ingress` pour le câblage partagé d’installation/authentification/réponse/Webhook.
  `channel-inbound` est l’emplacement partagé pour l’anti-rebond, la correspondance des mentions,
  les assistants de politique de mention entrante, le formatage d’enveloppe et les assistants de contexte
  d’enveloppe entrante.
  `channel-setup` est le joint étroit d’installation facultative.
  `setup-runtime` est la surface d’installation sûre à l’exécution utilisée par `setupEntry` /
  le démarrage différé, y compris les adaptateurs de patch d’installation sûrs à l’import.
  `setup-adapter-runtime` est le joint d’adaptateur d’installation de compte sensible à l’environnement.
  `setup-tools` est le petit joint d’assistance CLI/archive/docs (`formatCliCommand`,
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`).
- Sous-chemins de domaine tels que `openclaw/plugin-sdk/channel-config-helpers`,
  `openclaw/plugin-sdk/allow-from`,
  `openclaw/plugin-sdk/channel-config-schema`,
  `openclaw/plugin-sdk/telegram-command-config`,
  `openclaw/plugin-sdk/channel-policy`,
  `openclaw/plugin-sdk/approval-gateway-runtime`,
  `openclaw/plugin-sdk/approval-handler-adapter-runtime`,
  `openclaw/plugin-sdk/approval-handler-runtime`,
  `openclaw/plugin-sdk/approval-runtime`,
  `openclaw/plugin-sdk/config-runtime`,
  `openclaw/plugin-sdk/infra-runtime`,
  `openclaw/plugin-sdk/agent-runtime`,
  `openclaw/plugin-sdk/lazy-runtime`,
  `openclaw/plugin-sdk/reply-history`,
  `openclaw/plugin-sdk/routing`,
  `openclaw/plugin-sdk/status-helpers`,
  `openclaw/plugin-sdk/text-runtime`,
  `openclaw/plugin-sdk/runtime-store` et
  `openclaw/plugin-sdk/directory-runtime` pour les assistants partagés d’exécution/configuration.
  `telegram-command-config` est le joint public étroit pour la normalisation/validation des commandes personnalisées Telegram et reste disponible même si la surface de contrat Telegram bundlée est temporairement indisponible.
  `text-runtime` est le joint partagé texte/Markdown/journalisation, y compris
  la suppression du texte visible par l’assistant, les assistants de rendu/découpage Markdown, les assistants de rédaction,
  les assistants d’étiquettes de directive et les utilitaires de texte sûrs.
- Les joints de canal spécifiques aux approbations doivent préférer un contrat unique `approvalCapability`
  sur le plugin. Le cœur lit alors l’authentification d’approbation, la livraison, le rendu,
  le routage natif et le comportement du gestionnaire natif paresseux via cette seule capacité
  au lieu de mélanger le comportement d’approbation dans des champs de plugin non liés.
- `openclaw/plugin-sdk/channel-runtime` est obsolète et ne reste présent que comme
  shim de compatibilité pour les plugins plus anciens. Le nouveau code doit importer les primitives génériques plus étroites à la place, et le code du dépôt ne doit pas ajouter de nouveaux imports du
  shim.
- Les éléments internes des extensions bundlées restent privés. Les plugins externes doivent utiliser uniquement les sous-chemins `openclaw/plugin-sdk/*`. Le code du cœur/de test OpenClaw peut utiliser les
  points d’entrée publics du dépôt sous la racine d’un package de plugin tels que `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js` et des fichiers à portée étroite comme
  `login-qr-api.js`. N’importez jamais `src/*` d’un package de plugin depuis le cœur ou depuis
  une autre extension.
- Séparation des points d’entrée du dépôt :
  `<plugin-package-root>/api.js` est le barrel d’assistants/types,
  `<plugin-package-root>/runtime-api.js` est le barrel réservé à l’exécution,
  `<plugin-package-root>/index.js` est l’entrée du plugin bundlé,
  et `<plugin-package-root>/setup-entry.js` est l’entrée du plugin d’installation.
- Exemples actuels de fournisseurs bundlés :
  - Anthropic utilise `api.js` / `contract-api.js` pour les assistants de flux Claude tels
    que `wrapAnthropicProviderStream`, les assistants d’en-tête bêta et l’analyse de `service_tier`.
  - OpenAI utilise `api.js` pour les constructeurs de fournisseurs, les assistants de modèle par défaut et
    les constructeurs de fournisseurs temps réel.
  - OpenRouter utilise `api.js` pour son constructeur de fournisseur ainsi que ses assistants
    d’onboarding/configuration, tandis que `register.runtime.js` peut toujours réexporter des assistants génériques
    `plugin-sdk/provider-stream` pour un usage local au dépôt.
- Les points d’entrée publics chargés via façade préfèrent l’instantané actif de configuration d’exécution
  lorsqu’il existe, puis retombent sur le fichier de configuration résolu sur disque quand
  OpenClaw ne sert pas encore d’instantané d’exécution.
- Les primitives génériques partagées restent le contrat public privilégié du SDK. Un petit
  ensemble réservé de compatibilité de joints d’assistance marqués par canal bundlé existe encore.
  Traitez-les comme des joints de maintenance/compatibilité bundlés, et non comme de nouvelles cibles d’import tierces ; les nouveaux contrats inter-canaux doivent toujours être ajoutés sur des
  sous-chemins génériques `plugin-sdk/*` ou sur les barrels locaux au plugin `api.js` /
  `runtime-api.js`.

Remarque de compatibilité :

- Évitez le barrel racine `openclaw/plugin-sdk` pour le nouveau code.
- Préférez d’abord les primitives stables étroites. Les sous-chemins plus récents de setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool constituent le contrat visé pour le nouveau
  travail sur plugins bundlés et externes.
  L’analyse/la correspondance des cibles a sa place dans `openclaw/plugin-sdk/channel-targets`.
  Les garde-fous des actions de message et les assistants d’identifiant de message de réaction ont leur place dans
  `openclaw/plugin-sdk/channel-actions`.
- Les barrels d’assistance spécifiques aux extensions bundlées ne sont pas stables par défaut. Si un
  assistant n’est nécessaire que pour une extension bundlée, gardez-le derrière le
  joint local `api.js` ou `runtime-api.js` de l’extension au lieu de le promouvoir dans
  `openclaw/plugin-sdk/<extension>`.
- Les nouveaux joints d’assistance partagés doivent être génériques, et non marqués par canal. L’analyse partagée
  des cibles a sa place dans `openclaw/plugin-sdk/channel-targets` ; les éléments internes spécifiques au canal
  restent derrière le joint local `api.js` ou `runtime-api.js` du plugin propriétaire.
- Les sous-chemins spécifiques aux capacités tels que `image-generation`,
  `media-understanding` et `speech` existent parce que les plugins bundlés/natifs les utilisent
  aujourd’hui. Leur présence ne signifie pas en soi que chaque assistant exporté est un
  contrat externe figé à long terme.

## Schémas de l’outil de message

Les plugins doivent posséder les contributions de schéma spécifiques au canal de `describeMessageTool(...)`.
Conservez les champs spécifiques au fournisseur dans le plugin, pas dans le cœur partagé.

Pour les fragments de schéma portables partagés, réutilisez les assistants génériques exportés via
`openclaw/plugin-sdk/channel-actions` :

- `createMessageToolButtonsSchema()` pour les charges utiles de style grille de boutons
- `createMessageToolCardSchema()` pour les charges utiles de carte structurée

Si une forme de schéma n’a de sens que pour un seul fournisseur, définissez-la dans les
sources propres à ce plugin au lieu de la promouvoir dans le SDK partagé.

## Résolution des cibles de canal

Les plugins de canal doivent posséder la sémantique de cible spécifique au canal. Gardez l’hôte sortant partagé
générique et utilisez la surface d’adaptateur de messagerie pour les règles de fournisseur :

- `messaging.inferTargetChatType({ to })` décide si une cible normalisée
  doit être traitée comme `direct`, `group` ou `channel` avant la recherche dans le répertoire.
- `messaging.targetResolver.looksLikeId(raw, normalized)` indique au cœur si une
  entrée doit passer directement à une résolution de type identifiant au lieu d’une recherche dans le répertoire.
- `messaging.targetResolver.resolveTarget(...)` est le fallback du plugin lorsque
  le cœur a besoin d’une résolution finale appartenant au fournisseur après normalisation ou après
  un échec de recherche dans le répertoire.
- `messaging.resolveOutboundSessionRoute(...)` possède la construction de route de session spécifique au fournisseur
  une fois qu’une cible est résolue.

Répartition recommandée :

- Utilisez `inferTargetChatType` pour les décisions de catégorie qui doivent avoir lieu avant
  la recherche dans les pairs/groupes.
- Utilisez `looksLikeId` pour les vérifications « traiter ceci comme un identifiant de cible explicite/natif ».
- Utilisez `resolveTarget` pour le fallback de normalisation spécifique au fournisseur, et non pour
  une recherche large dans le répertoire.
- Conservez les identifiants natifs du fournisseur comme les identifiants de chat, de thread, les JID, les handles et les identifiants de salon
  dans les valeurs `target` ou les paramètres spécifiques au fournisseur, pas dans les champs SDK génériques.

## Répertoires adossés à la configuration

Les plugins qui dérivent des entrées de répertoire à partir de la configuration doivent conserver cette logique dans le
plugin et réutiliser les assistants partagés de
`openclaw/plugin-sdk/directory-runtime`.

Utilisez cela lorsqu’un canal a besoin de pairs/groupes adossés à la configuration, tels que :

- pairs DM pilotés par allowlist
- mappings configurés de canal/groupe
- fallbacks de répertoire statiques à portée de compte

Les assistants partagés dans `directory-runtime` ne gèrent que des opérations génériques :

- filtrage des requêtes
- application des limites
- assistants de déduplication/normalisation
- construction de `ChannelDirectoryEntry[]`

L’inspection de compte spécifique au canal et la normalisation des identifiants doivent rester dans
l’implémentation du plugin.

## Catalogues de fournisseurs

Les plugins fournisseurs peuvent définir des catalogues de modèles pour l’inférence avec
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` renvoie la même forme que celle qu’OpenClaw écrit dans
`models.providers` :

- `{ provider }` pour une entrée de fournisseur
- `{ providers }` pour plusieurs entrées de fournisseur

Utilisez `catalog` lorsque le plugin possède des identifiants de modèle spécifiques au fournisseur, des valeurs par défaut d’URL de base
ou des métadonnées de modèle soumises à authentification.

`catalog.order` contrôle le moment où le catalogue d’un plugin fusionne par rapport aux
fournisseurs implicites intégrés d’OpenClaw :

- `simple` : fournisseurs simples pilotés par clé API ou variables d’environnement
- `profile` : fournisseurs qui apparaissent lorsque des profils d’authentification existent
- `paired` : fournisseurs qui synthétisent plusieurs entrées de fournisseur liées
- `late` : dernier passage, après les autres fournisseurs implicites

Les fournisseurs ultérieurs l’emportent en cas de collision de clé, de sorte que les plugins peuvent
remplacer intentionnellement une entrée de fournisseur intégrée avec le même identifiant de fournisseur.

Compatibilité :

- `discovery` fonctionne toujours comme alias legacy
- si `catalog` et `discovery` sont tous deux enregistrés, OpenClaw utilise `catalog`

## Inspection de canal en lecture seule

Si votre plugin enregistre un canal, préférez implémenter
`plugin.config.inspectAccount(cfg, accountId)` en plus de `resolveAccount(...)`.

Pourquoi :

- `resolveAccount(...)` est le chemin d’exécution. Il peut supposer que les identifiants
  sont entièrement matérialisés et peut échouer rapidement lorsque les secrets requis sont absents.
- Les chemins de commande en lecture seule tels que `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, ainsi que les flux de doctor/réparation de configuration
  ne doivent pas avoir besoin de matérialiser des identifiants d’exécution simplement pour
  décrire la configuration.

Comportement recommandé de `inspectAccount(...)` :

- Renvoyez uniquement un état descriptif du compte.
- Préservez `enabled` et `configured`.
- Incluez les champs de source/statut des identifiants lorsque c’est pertinent, par exemple :
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Vous n’avez pas besoin de renvoyer les valeurs brutes des jetons simplement pour signaler une disponibilité
  en lecture seule. Renvoyer `tokenStatus: "available"` (et le champ de source correspondant) suffit pour les commandes de type statut.
- Utilisez `configured_unavailable` lorsqu’un identifiant est configuré via SecretRef mais
  indisponible dans le chemin de commande actuel.

Cela permet aux commandes en lecture seule de signaler « configuré mais indisponible dans ce chemin de commande »
au lieu de planter ou de signaler à tort que le compte n’est pas configuré.

## Packs de packages

Un répertoire de plugin peut inclure un `package.json` avec `openclaw.extensions` :

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Chaque entrée devient un plugin. Si le pack liste plusieurs extensions, l’identifiant du plugin
devient `name/<fileBase>`.

Si votre plugin importe des dépendances npm, installez-les dans ce répertoire afin que
`node_modules` soit disponible (`npm install` / `pnpm install`).

Garde-fou de sécurité : chaque entrée `openclaw.extensions` doit rester à l’intérieur du répertoire du plugin
après résolution des liens symboliques. Les entrées qui sortent du répertoire du package sont
rejetées.

Remarque de sécurité : `openclaw plugins install` installe les dépendances du plugin avec
`npm install --omit=dev --ignore-scripts` (pas de scripts de cycle de vie, pas de dépendances de développement à l’exécution). Conservez des arbres de dépendances de plugin
« pure JS/TS » et évitez les packages qui nécessitent des builds `postinstall`.

Facultatif : `openclaw.setupEntry` peut pointer vers un module léger réservé à l’installation.
Lorsque OpenClaw a besoin de surfaces d’installation pour un plugin de canal désactivé, ou
lorsqu’un plugin de canal est activé mais toujours non configuré, il charge `setupEntry`
au lieu de l’entrée complète du plugin. Cela allège le démarrage et l’installation
lorsque l’entrée principale du plugin connecte également des outils, hooks ou d’autres éléments réservés
à l’exécution.

Facultatif : `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
peut faire opter un plugin de canal pour ce même chemin `setupEntry` pendant la phase de démarrage
précédant l’écoute de la gateway, même lorsque le canal est déjà configuré.

Utilisez cela uniquement si `setupEntry` couvre entièrement la surface de démarrage qui doit exister
avant que la gateway commence à écouter. En pratique, cela signifie que l’entrée d’installation
doit enregistrer chaque capacité appartenant au canal dont le démarrage dépend, telle que :

- l’enregistrement du canal lui-même
- toute route HTTP qui doit être disponible avant que la gateway commence à écouter
- toute méthode Gateway, tout outil ou tout service qui doit exister pendant cette même fenêtre

Si votre entrée complète possède encore une capacité de démarrage requise, n’activez pas
ce drapeau. Conservez le comportement par défaut du plugin et laissez OpenClaw charger
l’entrée complète au démarrage.

Les canaux bundlés peuvent également publier des assistants de surface de contrat réservés à l’installation que le cœur
peut consulter avant le chargement complet du runtime du canal. La surface actuelle de promotion d’installation
est la suivante :

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Le cœur utilise cette surface lorsqu’il doit promouvoir une configuration legacy de canal à compte unique
vers `channels.<id>.accounts.*` sans charger l’entrée complète du plugin.
Matrix est l’exemple bundlé actuel : il déplace uniquement les clés d’authentification/bootstrap vers un
compte promu nommé lorsque des comptes nommés existent déjà, et il peut préserver une
clé de compte par défaut non canonique configurée au lieu de toujours créer
`accounts.default`.

Ces adaptateurs de patch d’installation maintiennent paresseuse la découverte de la surface de contrat bundlée. Le temps
d’import reste léger ; la surface de promotion n’est chargée qu’au premier usage au lieu de
réentrer dans le démarrage du canal bundlé à l’import du module.

Lorsque ces surfaces de démarrage incluent des méthodes RPC Gateway, conservez-les sur un
préfixe spécifique au plugin. Les espaces de noms d’administration du cœur (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restent réservés et se résolvent toujours
vers `operator.admin`, même si un plugin demande une portée plus étroite.

Exemple :

```json
{
  "name": "@scope/my-channel",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

### Métadonnées de catalogue de canal

Les plugins de canal peuvent annoncer des métadonnées d’installation/découverte via `openclaw.channel` et
des indications d’installation via `openclaw.install`. Cela permet de garder le catalogue du cœur sans données.

Exemple :

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Self-hosted chat via Nextcloud Talk webhook bots.",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "<bundled-plugin-local-path>",
      "defaultChoice": "npm"
    }
  }
}
```

Champs utiles de `openclaw.channel` au-delà de l’exemple minimal :

- `detailLabel` : libellé secondaire pour des surfaces de catalogue/statut plus riches
- `docsLabel` : remplace le texte du lien vers la documentation
- `preferOver` : identifiants de plugin/canal de priorité inférieure que cette entrée de catalogue doit devancer
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras` : contrôles de copie de surface de sélection
- `markdownCapable` : marque le canal comme compatible Markdown pour les décisions de formatage sortant
- `exposure.configured` : masque le canal des surfaces de liste des canaux configurés lorsqu’il est défini sur `false`
- `exposure.setup` : masque le canal des sélecteurs interactifs d’installation/configuration lorsqu’il est défini sur `false`
- `exposure.docs` : marque le canal comme interne/privé pour les surfaces de navigation dans la documentation
- `showConfigured` / `showInSetup` : alias legacy toujours acceptés pour compatibilité ; préférez `exposure`
- `quickstartAllowFrom` : fait opter le canal dans le flux standard quickstart `allowFrom`
- `forceAccountBinding` : exige une liaison de compte explicite même lorsqu’un seul compte existe
- `preferSessionLookupForAnnounceTarget` : préfère la recherche de session lors de la résolution des cibles d’annonce

OpenClaw peut également fusionner des **catalogues de canaux externes** (par exemple, un export de registre MPM).
Déposez un fichier JSON à l’un des emplacements suivants :

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Ou faites pointer `OPENCLAW_PLUGIN_CATALOG_PATHS` (ou `OPENCLAW_MPM_CATALOG_PATHS`) vers
un ou plusieurs fichiers JSON (délimités par virgule/point-virgule/`PATH`). Chaque fichier doit
contenir `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. L’analyseur accepte aussi `"packages"` ou `"plugins"` comme alias legacy de la clé `"entries"`.

## Plugins de moteur de contexte

Les plugins de moteur de contexte possèdent l’orchestration du contexte de session pour l’ingestion, l’assemblage
et la Compaction. Enregistrez-les depuis votre plugin avec
`api.registerContextEngine(id, factory)`, puis sélectionnez le moteur actif avec
`plugins.slots.contextEngine`.

Utilisez ceci lorsque votre plugin doit remplacer ou étendre le pipeline de contexte par défaut
plutôt que simplement ajouter une recherche mémoire ou des hooks.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

Si votre moteur ne possède **pas** l’algorithme de Compaction, laissez `compact()`
implémenté et déléguez-le explicitement :

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", () => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## Ajouter une nouvelle capacité

Lorsqu’un plugin a besoin d’un comportement qui ne correspond pas à l’API actuelle, ne contournez pas
le système de plugins avec un accès privé interne. Ajoutez la capacité manquante.

Séquence recommandée :

1. définir le contrat du cœur
   Décidez du comportement partagé que le cœur doit posséder : politique, fallback, fusion de configuration,
   cycle de vie, sémantique orientée canal et forme de l’assistant d’exécution.
2. ajouter des surfaces typées d’enregistrement/runtime du plugin
   Étendez `OpenClawPluginApi` et/ou `api.runtime` avec la plus petite
   surface de capacité typée utile.
3. connecter les consommateurs cœur + canal/fonctionnalité
   Les canaux et plugins de fonctionnalité doivent consommer la nouvelle capacité via le cœur,
   et non en important directement une implémentation fournisseur.
4. enregistrer les implémentations fournisseur
   Les plugins fournisseurs enregistrent ensuite leurs backends sur cette capacité.
5. ajouter une couverture de contrat
   Ajoutez des tests afin que la propriété et la forme d’enregistrement restent explicites dans le temps.

C’est ainsi qu’OpenClaw reste prescriptif sans devenir codé en dur selon la
vision du monde d’un seul fournisseur. Voir le [Capability Cookbook](/fr/plugins/architecture)
pour une checklist concrète des fichiers et un exemple complet.

### Checklist de capacité

Lorsque vous ajoutez une nouvelle capacité, l’implémentation doit généralement toucher ensemble
les surfaces suivantes :

- types de contrat du cœur dans `src/<capability>/types.ts`
- runner/assistant d’exécution du cœur dans `src/<capability>/runtime.ts`
- surface d’enregistrement de l’API plugin dans `src/plugins/types.ts`
- câblage du registre des plugins dans `src/plugins/registry.ts`
- exposition du runtime du plugin dans `src/plugins/runtime/*` lorsque les plugins de fonctionnalité/canal
  doivent la consommer
- assistants de capture/test dans `src/test-utils/plugin-registration.ts`
- assertions de propriété/contrat dans `src/plugins/contracts/registry.ts`
- documentation opérateur/plugin dans `docs/`

Si l’une de ces surfaces manque, c’est généralement le signe que la capacité n’est
pas encore totalement intégrée.

### Modèle de capacité

Motif minimal :

```ts
// contrat du cœur
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// API plugin
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// assistant d’exécution partagé pour les plugins de fonctionnalité/canal
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

Motif de test de contrat :

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Cela garde la règle simple :

- le cœur possède le contrat de capacité + l’orchestration
- les plugins fournisseurs possèdent les implémentations fournisseur
- les plugins de fonctionnalité/canal consomment les assistants d’exécution
- les tests de contrat gardent une propriété explicite
