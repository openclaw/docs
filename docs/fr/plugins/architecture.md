---
read_when:
    - Créer ou déboguer des plugins OpenClaw natifs
    - Comprendre le modèle de capacités des plugins ou les limites de propriété
    - Travailler sur le pipeline de chargement des plugins ou le registre
    - Implémenter des hooks d’exécution de fournisseur ou des plugins de canal
sidebarTitle: Internals
summary: 'Internes du Plugin : modèle de capacités, propriété, contrats, pipeline de chargement et assistants d’exécution'
title: Internes du Plugin
x-i18n:
    generated_at: "2026-04-15T06:56:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: f86798b5d2b0ad82d2397a52a6c21ed37fe6eee1dd3d124a9e4150c4f630b841
    source_path: plugins/architecture.md
    workflow: 15
---

# Internes du Plugin

<Info>
  Ceci est la **référence d’architecture approfondie**. Pour des guides pratiques, voir :
  - [Installer et utiliser des plugins](/fr/tools/plugin) — guide utilisateur
  - [Premiers pas](/fr/plugins/building-plugins) — premier tutoriel de plugin
  - [Plugins de canal](/fr/plugins/sdk-channel-plugins) — créer un canal de messagerie
  - [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins) — créer un fournisseur de modèles
  - [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) — table d’importation et API d’enregistrement
</Info>

Cette page couvre l’architecture interne du système de plugins OpenClaw.

## Modèle de capacités public

Les capacités constituent le modèle public des **plugins natifs** dans OpenClaw. Chaque
plugin OpenClaw natif s’enregistre auprès d’un ou plusieurs types de capacités :

| Capability             | Registration method                              | Example plugins                      |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| Inférence de texte     | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| Backend d’inférence CLI  | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| Parole                 | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Transcription en temps réel | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| Voix en temps réel     | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Compréhension des médias    | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Génération d’images       | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Génération de musique       | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Génération de vidéo       | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Récupération Web              | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Recherche Web             | `api.registerWebSearchProvider(...)`             | `google`                             |
| Canal / messagerie    | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |

Un plugin qui enregistre zéro capacité mais fournit des hooks, des outils ou
des services est un plugin **hérité uniquement basé sur des hooks**. Ce modèle reste entièrement pris en charge.

### Position de compatibilité externe

Le modèle de capacités est intégré au core et utilisé aujourd’hui par les plugins
bundlés/natifs, mais la compatibilité des plugins externes exige encore un critère
plus strict que « c’est exporté, donc c’est figé ».

Recommandations actuelles :

- **plugins externes existants :** garder les intégrations basées sur des hooks fonctionnelles ; considérer
  cela comme la base de compatibilité
- **nouveaux plugins bundlés/natifs :** préférer l’enregistrement explicite de capacités aux
  accès spécifiques à un fournisseur ou aux nouvelles conceptions uniquement basées sur des hooks
- **plugins externes adoptant l’enregistrement de capacités :** autorisé, mais considérer les
  surfaces d’assistance spécifiques aux capacités comme évolutives, sauf si la documentation marque explicitement
  un contrat comme stable

Règle pratique :

- les API d’enregistrement de capacités sont la direction prévue
- les hooks hérités restent le chemin le plus sûr pour éviter les ruptures pour les plugins externes pendant
  la transition
- les sous-chemins d’assistance exportés ne se valent pas tous ; préférer le contrat documenté et étroit,
  pas des exportations d’assistance incidentes

### Formes de plugins

OpenClaw classe chaque plugin chargé selon une forme basée sur son comportement
réel d’enregistrement (et pas seulement sur des métadonnées statiques) :

- **plain-capability** -- enregistre exactement un type de capacité (par exemple un
  plugin uniquement fournisseur comme `mistral`)
- **hybrid-capability** -- enregistre plusieurs types de capacités (par exemple
  `openai` possède l’inférence de texte, la parole, la compréhension des médias et la
  génération d’images)
- **hook-only** -- enregistre uniquement des hooks (typés ou personnalisés), sans capacités,
  outils, commandes ou services
- **non-capability** -- enregistre des outils, commandes, services ou routes mais aucune
  capacité

Utilisez `openclaw plugins inspect <id>` pour voir la forme d’un plugin et la répartition
de ses capacités. Voir la [référence CLI](/cli/plugins#inspect) pour plus de détails.

### Hooks hérités

Le hook `before_agent_start` reste pris en charge comme voie de compatibilité pour
les plugins uniquement basés sur des hooks. Des plugins hérités réels en dépendent encore.

Orientation :

- le conserver fonctionnel
- le documenter comme hérité
- préférer `before_model_resolve` pour le travail de substitution de modèle/fournisseur
- préférer `before_prompt_build` pour le travail de mutation des prompts
- ne le supprimer qu’une fois l’usage réel diminué et la couverture des fixtures prouvant la sécurité de la migration

### Signaux de compatibilité

Lorsque vous exécutez `openclaw doctor` ou `openclaw plugins inspect <id>`, vous pouvez voir
l’une de ces étiquettes :

| Signal                     | Signification                                                      |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | La configuration est correctement analysée et les plugins sont résolus                       |
| **compatibility advisory** | Le plugin utilise un modèle pris en charge mais plus ancien (par ex. `hook-only`) |
| **legacy warning**         | Le plugin utilise `before_agent_start`, qui est obsolète        |
| **hard error**             | La configuration est invalide ou le plugin n’a pas pu être chargé                   |

Ni `hook-only` ni `before_agent_start` ne casseront votre plugin aujourd’hui --
`hook-only` est informatif, et `before_agent_start` ne déclenche qu’un avertissement. Ces
signaux apparaissent aussi dans `openclaw status --all` et `openclaw plugins doctor`.

## Vue d’ensemble de l’architecture

Le système de plugins d’OpenClaw comporte quatre couches :

1. **Manifeste + découverte**
   OpenClaw trouve les plugins candidats à partir des chemins configurés, des racines d’espace de travail,
   des racines d’extensions globales et des extensions bundlées. La découverte lit d’abord les manifestes natifs
   `openclaw.plugin.json` ainsi que les manifestes de bundles pris en charge.
2. **Activation + validation**
   Le core décide si un plugin découvert est activé, désactivé, bloqué ou
   sélectionné pour un emplacement exclusif comme la mémoire.
3. **Chargement à l’exécution**
   Les plugins OpenClaw natifs sont chargés en processus via jiti et enregistrent
   des capacités dans un registre central. Les bundles compatibles sont normalisés en
   enregistrements de registre sans importer de code d’exécution.
4. **Consommation des surfaces**
   Le reste d’OpenClaw lit le registre pour exposer les outils, canaux, configuration des fournisseurs, hooks, routes HTTP, commandes CLI et services.

Pour la CLI des plugins en particulier, la découverte des commandes racines est divisée en deux phases :

- les métadonnées au moment de l’analyse proviennent de `registerCli(..., { descriptors: [...] })`
- le véritable module CLI du plugin peut rester paresseux et s’enregistrer lors de la première invocation

Cela permet de conserver le code CLI appartenant au plugin à l’intérieur du plugin tout en laissant OpenClaw
réserver les noms de commandes racines avant l’analyse.

La limite de conception importante :

- la découverte + validation de configuration doivent fonctionner à partir des **métadonnées de manifeste/schéma**
  sans exécuter le code du plugin
- le comportement d’exécution natif provient du chemin `register(api)` du module du plugin

Cette séparation permet à OpenClaw de valider la configuration, d’expliquer les plugins manquants/désactivés et
de construire des indications d’interface utilisateur/schéma avant que l’exécution complète ne soit active.

### Plugins de canal et outil de message partagé

Les plugins de canal n’ont pas besoin d’enregistrer un outil séparé d’envoi/édition/réaction pour
les actions de chat normales. OpenClaw conserve un seul outil `message` partagé dans le core, et
les plugins de canal possèdent la découverte et l’exécution spécifiques au canal derrière celui-ci.

La limite actuelle est la suivante :

- le core possède l’hôte de l’outil `message` partagé, le câblage des prompts, la
  tenue de session/thread et la répartition de l’exécution
- les plugins de canal possèdent la découverte d’actions à portée limitée, la découverte de capacités et tous les fragments de schéma spécifiques au canal
- les plugins de canal possèdent la grammaire de conversation de session spécifique au fournisseur, par exemple
  la manière dont les identifiants de conversation encodent les identifiants de thread ou héritent des conversations parentes
- les plugins de canal exécutent l’action finale via leur adaptateur d’action

Pour les plugins de canal, la surface SDK est
`ChannelMessageActionAdapter.describeMessageTool(...)`. Cet appel de découverte unifié
permet à un plugin de renvoyer ensemble ses actions visibles, ses capacités et ses contributions au schéma
afin d’éviter toute dérive entre ces éléments.

Lorsqu’un paramètre d’outil de message spécifique au canal transporte une source média telle qu’un
chemin local ou une URL de média distante, le plugin doit également renvoyer
`mediaSourceParams` depuis `describeMessageTool(...)`. Le core utilise cette liste explicite
pour appliquer la normalisation des chemins de sandbox et les indications d’accès média sortant
sans coder en dur les noms de paramètres appartenant au plugin.
Préférez ici des tables à portée d’action, et non une liste plate à l’échelle du canal, afin qu’un
paramètre média réservé au profil ne soit pas normalisé sur des actions sans rapport comme
`send`.

Le core transmet la portée d’exécution dans cette étape de découverte. Les champs importants incluent :

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` entrant approuvé

Cela est important pour les plugins sensibles au contexte. Un canal peut masquer ou exposer
des actions de message en fonction du compte actif, de la salle/du thread/du message courant, ou
de l’identité de l’émetteur demandeur approuvée sans coder en dur des branches spécifiques au canal dans
l’outil `message` du core.

C’est pourquoi les changements de routage de l’exécuteur embarqué restent du travail de plugin : l’exécuteur est
responsable de transmettre l’identité de chat/session courante dans la limite de découverte du plugin afin
que l’outil `message` partagé expose la bonne surface appartenant au canal pour le tour en cours.

Pour les assistants d’exécution appartenant au canal, les plugins bundlés doivent conserver l’exécution
dans leurs propres modules d’extension. Le core ne possède plus les
moteurs d’actions de message Discord, Slack, Telegram ou WhatsApp sous `src/agents/tools`.
Nous ne publions pas de sous-chemins séparés `plugin-sdk/*-action-runtime`, et les plugins bundlés
doivent importer directement leur propre code d’exécution local depuis leurs
modules appartenant à l’extension.

La même limite s’applique de manière générale aux jonctions SDK nommées d’après les fournisseurs : le core ne doit
pas importer de barrels de commodité spécifiques à un canal pour les extensions Slack, Discord, Signal,
WhatsApp ou similaires. Si le core a besoin d’un comportement, il doit soit consommer le
barrel `api.ts` / `runtime-api.ts` propre au plugin bundlé, soit promouvoir ce besoin
en une capacité générique étroite dans le SDK partagé.

Pour les sondages en particulier, il existe deux chemins d’exécution :

- `outbound.sendPoll` constitue la base partagée pour les canaux compatibles avec le modèle commun
  de sondage
- `actions.handleAction("poll")` est le chemin préféré pour les sémantiques de sondage spécifiques au canal
  ou pour des paramètres de sondage supplémentaires

Le core diffère désormais l’analyse partagée des sondages jusqu’à ce que la répartition du sondage du plugin refuse
l’action, afin que les gestionnaires de sondages appartenant au plugin puissent accepter des champs de sondage spécifiques au canal
sans être bloqués d’abord par l’analyseur de sondage générique.

Voir [Pipeline de chargement](#load-pipeline) pour la séquence complète de démarrage.

## Modèle de propriété des capacités

OpenClaw traite un plugin natif comme la limite de propriété pour une **entreprise** ou une
**fonctionnalité**, et non comme un ensemble disparate d’intégrations sans lien.

Cela signifie :

- un plugin d’entreprise doit généralement posséder toutes les surfaces OpenClaw orientées
  vers cette entreprise
- un plugin de fonctionnalité doit généralement posséder la surface complète de la fonctionnalité qu’il introduit
- les canaux doivent consommer les capacités partagées du core au lieu de réimplémenter
  de façon ad hoc le comportement des fournisseurs

Exemples :

- le plugin bundlé `openai` possède le comportement de fournisseur de modèles OpenAI ainsi que le
  comportement OpenAI pour la parole + la voix en temps réel + la compréhension des médias + la génération d’images
- le plugin bundlé `elevenlabs` possède le comportement de parole ElevenLabs
- le plugin bundlé `microsoft` possède le comportement de parole Microsoft
- le plugin bundlé `google` possède le comportement de fournisseur de modèles Google ainsi que le
  comportement Google pour la compréhension des médias + la génération d’images + la recherche Web
- le plugin bundlé `firecrawl` possède le comportement de récupération Web Firecrawl
- les plugins bundlés `minimax`, `mistral`, `moonshot` et `zai` possèdent leurs
  backends de compréhension des médias
- le plugin bundlé `qwen` possède le comportement de fournisseur de texte Qwen ainsi que le
  comportement de compréhension des médias et de génération de vidéo
- le plugin `voice-call` est un plugin de fonctionnalité : il possède le transport d’appel, les outils,
  la CLI, les routes et le pont de flux média Twilio, mais il consomme les capacités partagées de parole
  ainsi que de transcription en temps réel et de voix en temps réel au lieu
  d’importer directement des plugins de fournisseur

L’état final visé est :

- OpenAI vit dans un seul plugin même s’il couvre les modèles de texte, la parole, les images et
  la vidéo à venir
- un autre fournisseur peut faire de même pour sa propre surface
- les canaux ne se préoccupent pas de savoir quel plugin fournisseur possède le fournisseur ; ils consomment le
  contrat de capacité partagée exposé par le core

C’est la distinction clé :

- **plugin** = limite de propriété
- **capability** = contrat du core que plusieurs plugins peuvent implémenter ou consommer

Ainsi, si OpenClaw ajoute un nouveau domaine comme la vidéo, la première question n’est pas
« quel fournisseur doit coder en dur la gestion de la vidéo ? » La première question est « quel est
le contrat de capacité vidéo du core ? » Une fois ce contrat en place, les plugins fournisseurs
peuvent s’y enregistrer et les plugins de canal/fonctionnalité peuvent le consommer.

Si la capacité n’existe pas encore, la bonne démarche est généralement :

1. définir la capacité manquante dans le core
2. l’exposer via l’API/le runtime du plugin de manière typée
3. relier les canaux/fonctionnalités à cette capacité
4. laisser les plugins fournisseurs enregistrer des implémentations

Cela maintient une propriété explicite tout en évitant un comportement du core qui dépend
d’un seul fournisseur ou d’un chemin de code spécifique à un plugin ponctuel.

### Superposition des capacités

Utilisez ce modèle mental pour décider où le code doit se trouver :

- **couche de capacités du core** : orchestration partagée, politique, repli, règles de
  fusion de configuration, sémantique de livraison et contrats typés
- **couche de plugin fournisseur** : API spécifiques au fournisseur, authentification, catalogues de modèles, synthèse vocale,
  génération d’images, futurs backends vidéo, points de terminaison d’usage
- **couche de plugin de canal/fonctionnalité** : intégration Slack/Discord/voice-call/etc.
  qui consomme les capacités du core et les présente sur une surface

Par exemple, TTS suit cette forme :

- le core possède la politique TTS au moment de la réponse, l’ordre de repli, les préférences et la livraison par canal
- `openai`, `elevenlabs` et `microsoft` possèdent les implémentations de synthèse
- `voice-call` consomme l’assistant d’exécution TTS de téléphonie

Ce même modèle doit être privilégié pour les capacités futures.

### Exemple de plugin d’entreprise à capacités multiples

Un plugin d’entreprise doit sembler cohérent vu de l’extérieur. Si OpenClaw possède des
contrats partagés pour les modèles, la parole, la transcription en temps réel, la voix en temps
réel, la compréhension des médias, la génération d’images, la génération de vidéo, la récupération Web et la recherche Web,
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
      // hooks d’authentification/catalogue de modèles/d’exécution
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // configuration de parole fournisseur — implémente directement l’interface SpeechProviderPlugin
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

Ce qui compte n’est pas le nom exact des assistants. C’est la forme qui compte :

- un seul plugin possède la surface du fournisseur
- le core possède toujours les contrats de capacité
- les plugins de canal et de fonctionnalité consomment des assistants `api.runtime.*`, pas du code fournisseur
- les tests de contrat peuvent vérifier que le plugin a enregistré les capacités qu’il
  prétend posséder

### Exemple de capacité : compréhension vidéo

OpenClaw traite déjà la compréhension d’image/audio/vidéo comme une seule
capacité partagée. Le même modèle de propriété s’y applique :

1. le core définit le contrat de compréhension des médias
2. les plugins fournisseurs enregistrent `describeImage`, `transcribeAudio` et
   `describeVideo` selon le cas
3. les plugins de canal et de fonctionnalité consomment le comportement partagé du core au lieu de
   se connecter directement au code fournisseur

Cela évite d’intégrer dans le core les hypothèses vidéo d’un seul fournisseur. Le plugin possède
la surface du fournisseur ; le core possède le contrat de capacité et le comportement de repli.

La génération de vidéo utilise déjà cette même séquence : le core possède le contrat de
capacité typé et l’assistant d’exécution, et les plugins fournisseurs enregistrent
des implémentations `api.registerVideoGenerationProvider(...)` dessus.

Besoin d’une checklist de déploiement concrète ? Voir
[Recueil de recettes des capacités](/fr/plugins/architecture).

## Contrats et application

La surface de l’API de plugin est intentionnellement typée et centralisée dans
`OpenClawPluginApi`. Ce contrat définit les points d’enregistrement pris en charge ainsi que
les assistants d’exécution sur lesquels un plugin peut s’appuyer.

Pourquoi c’est important :

- les auteurs de plugins disposent d’une norme interne stable et unique
- le core peut rejeter les propriétés en double, par exemple deux plugins enregistrant le même
  id de fournisseur
- le démarrage peut faire remonter des diagnostics exploitables pour un enregistrement mal formé
- les tests de contrat peuvent faire respecter la propriété des plugins bundlés et empêcher les dérives silencieuses

Il existe deux couches d’application :

1. **application de l’enregistrement à l’exécution**
   Le registre des plugins valide les enregistrements au chargement des plugins. Exemples :
   des ids de fournisseur dupliqués, des ids de fournisseur de parole dupliqués et des
   enregistrements mal formés produisent des diagnostics de plugin au lieu d’un comportement indéfini.
2. **tests de contrat**
   Les plugins bundlés sont capturés dans des registres de contrat pendant les exécutions de test afin qu’OpenClaw
   puisse affirmer explicitement la propriété. Aujourd’hui, cela est utilisé pour les
   fournisseurs de modèles, les fournisseurs de parole, les fournisseurs de recherche Web et la propriété
   des enregistrements bundlés.

L’effet pratique est qu’OpenClaw sait, dès le départ, quel plugin possède quelle
surface. Cela permet au core et aux canaux de se composer de manière fluide, car la propriété est
déclarée, typée et testable plutôt qu’implicite.

### Ce qui doit appartenir à un contrat

Les bons contrats de plugin sont :

- typés
- petits
- spécifiques à une capacité
- possédés par le core
- réutilisables par plusieurs plugins
- consommables par les canaux/fonctionnalités sans connaissance du fournisseur

Les mauvais contrats de plugin sont :

- une politique spécifique au fournisseur cachée dans le core
- des échappatoires ponctuelles de plugin qui contournent le registre
- du code de canal accédant directement à une implémentation fournisseur
- des objets d’exécution ad hoc qui ne font pas partie de `OpenClawPluginApi` ou de
  `api.runtime`

En cas de doute, augmentez le niveau d’abstraction : définissez d’abord la capacité, puis
laissez les plugins s’y brancher.

## Modèle d’exécution

Les plugins OpenClaw natifs s’exécutent **dans le même processus** que la Gateway. Ils ne sont pas
sandboxés. Un plugin natif chargé a la même limite de confiance au niveau du processus que
le code du core.

Implications :

- un plugin natif peut enregistrer des outils, des gestionnaires réseau, des hooks et des services
- un bug dans un plugin natif peut faire planter ou déstabiliser la gateway
- un plugin natif malveillant équivaut à une exécution de code arbitraire dans le processus OpenClaw

Les bundles compatibles sont plus sûrs par défaut parce qu’OpenClaw les traite actuellement
comme des packs de métadonnées/contenu. Dans les versions actuelles, cela signifie surtout des
Skills bundlées.

Utilisez des listes d’autorisation et des chemins d’installation/de chargement explicites pour les plugins non bundlés. Traitez
les plugins d’espace de travail comme du code de développement, pas comme des valeurs par défaut de production.

Pour les noms de packages d’espace de travail bundlés, gardez l’id du plugin ancré dans le
nom npm : `@openclaw/<id>` par défaut, ou un suffixe typé approuvé tel que
`-provider`, `-plugin`, `-speech`, `-sandbox` ou `-media-understanding` lorsque
le package expose intentionnellement un rôle de plugin plus étroit.

Note importante sur la confiance :

- `plugins.allow` fait confiance aux **ids de plugin**, pas à la provenance de la source.
- Un plugin d’espace de travail avec le même id qu’un plugin bundlé masque intentionnellement
  la copie bundlée lorsque ce plugin d’espace de travail est activé/autorisé.
- C’est normal et utile pour le développement local, les tests de correctifs et les correctifs urgents.

## Limite d’exportation

OpenClaw exporte des capacités, pas une commodité d’implémentation.

Gardez l’enregistrement des capacités public. Réduisez les exportations d’assistance hors contrat :

- sous-chemins d’assistance spécifiques à un plugin bundlé
- sous-chemins de plomberie d’exécution non destinés à être une API publique
- assistants de commodité spécifiques à un fournisseur
- assistants de configuration/d’onboarding qui sont des détails d’implémentation

Certains sous-chemins d’assistance de plugins bundlés restent encore dans la table d’exportation générée du SDK pour la compatibilité et la maintenance des plugins bundlés. Exemples actuels :
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` et plusieurs jonctions `plugin-sdk/matrix*`. Traitez-les comme des
exportations réservées aux détails d’implémentation, et non comme le modèle SDK recommandé pour
les nouveaux plugins tiers.

## Pipeline de chargement

Au démarrage, OpenClaw effectue approximativement ceci :

1. découvre les racines candidates de plugins
2. lit les manifestes natifs ou de bundle compatible ainsi que les métadonnées des packages
3. rejette les candidats non sûrs
4. normalise la configuration des plugins (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. décide de l’activation pour chaque candidat
6. charge les modules natifs activés via jiti
7. appelle les hooks natifs `register(api)` (ou `activate(api)` — un alias hérité) et collecte les enregistrements dans le registre des plugins
8. expose le registre aux surfaces des commandes/de l’exécution

<Note>
`activate` est un alias hérité de `register` — le chargeur résout celui qui est présent (`def.register ?? def.activate`) et l’appelle au même point. Tous les plugins bundlés utilisent `register` ; préférez `register` pour les nouveaux plugins.
</Note>

Les contrôles de sécurité ont lieu **avant** l’exécution du runtime. Les candidats sont bloqués
lorsque l’entrée sort de la racine du plugin, que le chemin est accessible en écriture par tous, ou que la propriété du chemin semble suspecte pour les plugins non bundlés.

### Comportement manifest-first

Le manifeste est la source de vérité du plan de contrôle. OpenClaw l’utilise pour :

- identifier le plugin
- découvrir les canaux/Skills/schémas de configuration déclarés ou les capacités du bundle
- valider `plugins.entries.<id>.config`
- enrichir les étiquettes/placeholders de la Control UI
- afficher les métadonnées d’installation/de catalogue
- préserver des descripteurs d’activation et de configuration peu coûteux sans charger le runtime du plugin

Pour les plugins natifs, le module d’exécution est la partie plan de données. Il enregistre le
comportement réel comme les hooks, outils, commandes ou flux de fournisseur.

Les blocs manifestes optionnels `activation` et `setup` restent sur le plan de contrôle.
Ce sont uniquement des descripteurs de métadonnées pour la planification de l’activation et la découverte de la configuration ;
ils ne remplacent pas l’enregistrement à l’exécution, `register(...)` ou `setupEntry`.
Les premiers consommateurs d’activation en direct utilisent désormais les indications de commandes, de canaux et de fournisseurs du manifeste
pour réduire le chargement des plugins avant une matérialisation plus large du registre :

- le chargement CLI se réduit aux plugins qui possèdent la commande principale demandée
- la résolution de configuration/de plugin de canal se réduit aux plugins qui possèdent l’id de
  canal demandé
- la résolution explicite de configuration/d’exécution de fournisseur se réduit aux plugins qui possèdent l’id de
  fournisseur demandé

La découverte de configuration préfère désormais les ids appartenant aux descripteurs, tels que `setup.providers` et
`setup.cliBackends`, pour réduire les plugins candidats avant de revenir à
`setup-api` pour les plugins qui ont encore besoin de hooks d’exécution au moment de la configuration. Si plus d’un
plugin découvert revendique le même id de fournisseur de configuration ou de backend CLI normalisé,
la recherche de configuration refuse le propriétaire ambigu au lieu de s’appuyer sur l’ordre de découverte.

### Ce que le chargeur met en cache

OpenClaw conserve de courts caches en processus pour :

- les résultats de découverte
- les données du registre des manifestes
- les registres de plugins chargés

Ces caches réduisent les démarrages en rafale et le coût des commandes répétées. Il est sûr
de les considérer comme des caches de performance de courte durée, et non comme de la persistance.

Note de performance :

- Définissez `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` ou
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` pour désactiver ces caches.
- Ajustez les fenêtres de cache avec `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` et
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Modèle de registre

Les plugins chargés ne modifient pas directement des globales arbitraires du core. Ils s’enregistrent dans un
registre central de plugins.

Le registre suit :

- les enregistrements de plugins (identité, source, origine, statut, diagnostics)
- les outils
- les hooks hérités et les hooks typés
- les canaux
- les fournisseurs
- les gestionnaires RPC Gateway
- les routes HTTP
- les enregistreurs CLI
- les services d’arrière-plan
- les commandes appartenant au plugin

Les fonctionnalités du core lisent ensuite depuis ce registre au lieu de dialoguer directement avec les modules de plugin.
Cela maintient un chargement à sens unique :

- module de plugin -> enregistrement dans le registre
- runtime du core -> consommation du registre

Cette séparation est importante pour la maintenabilité. Elle signifie que la plupart des surfaces du core n’ont besoin
que d’un seul point d’intégration : « lire le registre », et non « gérer chaque module de plugin
comme un cas particulier ».

## Callbacks de liaison de conversation

Les plugins qui lient une conversation peuvent réagir lorsqu’une approbation est résolue.

Utilisez `api.onConversationBindingResolved(...)` pour recevoir un callback après qu’une demande de liaison
a été approuvée ou refusée :

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // Une liaison existe maintenant pour ce plugin + cette conversation.
        console.log(event.binding?.conversationId);
        return;
      }

      // La demande a été refusée ; effacer tout état local en attente.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Champs de la charge utile du callback :

- `status`: `"approved"` ou `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` ou `"deny"`
- `binding`: la liaison résolue pour les demandes approuvées
- `request`: le résumé de la demande d’origine, l’indication de détachement, l’id d’expéditeur et
  les métadonnées de conversation

Ce callback est uniquement une notification. Il ne modifie pas qui est autorisé à lier une
conversation, et il s’exécute une fois le traitement d’approbation du core terminé.

## Hooks d’exécution des fournisseurs

Les plugins de fournisseur ont désormais deux couches :

- métadonnées du manifeste : `providerAuthEnvVars` pour une recherche peu coûteuse de l’authentification fournisseur par variable d’environnement
  avant le chargement du runtime, `providerAuthAliases` pour les variantes de fournisseur qui partagent
  l’authentification, `channelEnvVars` pour une recherche peu coûteuse de la configuration/authentification de canal via l’environnement avant le chargement du runtime,
  ainsi que `providerAuthChoices` pour des étiquettes peu coûteuses d’onboarding/choix d’authentification et
  des métadonnées de drapeau CLI avant le chargement du runtime
- hooks au moment de la configuration : `catalog` / `discovery` hérité ainsi que `applyConfigDefaults`
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
  `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw possède toujours la boucle d’agent générique, le basculement, la gestion des transcriptions et la
politique des outils. Ces hooks sont la surface d’extension pour le comportement spécifique au fournisseur sans
nécessiter tout un transport d’inférence personnalisé.

Utilisez le manifeste `providerAuthEnvVars` lorsque le fournisseur dispose d’identifiants basés sur l’environnement
que les chemins génériques d’authentification/statut/sélecteur de modèles doivent voir sans charger le runtime du plugin. Utilisez le manifeste `providerAuthAliases` lorsqu’un id de fournisseur doit réutiliser
les variables d’environnement, les profils d’authentification, l’authentification adossée à la configuration et le choix
d’onboarding de clé API d’un autre id de fournisseur. Utilisez le manifeste `providerAuthChoices` lorsque les
surfaces CLI d’onboarding/choix d’authentification doivent connaître l’id de choix du fournisseur, les libellés de groupe et un câblage
simple d’authentification à un seul drapeau sans charger le runtime du fournisseur. Conservez `envVars` dans le runtime du fournisseur pour
les indications orientées opérateur telles que les libellés d’onboarding ou les variables de configuration
client-id/client-secret OAuth.

Utilisez le manifeste `channelEnvVars` lorsqu’un canal dispose d’une authentification ou d’une configuration pilotée par l’environnement que les
mécanismes génériques de repli sur l’environnement du shell, les vérifications de configuration/statut ou les invites de configuration doivent voir
sans charger le runtime du canal.

### Ordre et usage des hooks

Pour les plugins de modèle/fournisseur, OpenClaw appelle les hooks dans cet ordre approximatif.
La colonne « Quand l’utiliser » sert de guide de décision rapide.

| #   | Hook                              | Ce qu’il fait                                                                                                   | Quand l’utiliser                                                                                                                                 |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publie la configuration du fournisseur dans `models.providers` lors de la génération de `models.json`                                | Le fournisseur possède un catalogue ou des valeurs par défaut d’URL de base                                                                                                |
| 2   | `applyConfigDefaults`             | Applique les valeurs par défaut globales de configuration appartenant au fournisseur lors de la matérialisation de la configuration                                      | Les valeurs par défaut dépendent du mode d’authentification, de l’environnement ou de la sémantique de famille de modèles du fournisseur                                                                       |
| --  | _(built-in model lookup)_         | OpenClaw essaie d’abord le chemin normal du registre/catalogue                                                          | _(pas un hook de plugin)_                                                                                                                       |
| 3   | `normalizeModelId`                | Normalise les alias d’id de modèle hérités ou de préversion avant la recherche                                                     | Le fournisseur possède le nettoyage des alias avant la résolution canonique du modèle                                                                               |
| 4   | `normalizeTransport`              | Normalise `api` / `baseUrl` de la famille de fournisseurs avant l’assemblage générique du modèle                                      | Le fournisseur possède le nettoyage du transport pour des ids de fournisseur personnalisés dans la même famille de transport                                                        |
| 5   | `normalizeConfig`                 | Normalise `models.providers.<id>` avant la résolution du runtime/du fournisseur                                           | Le fournisseur a besoin d’un nettoyage de configuration qui doit vivre avec le plugin ; les assistants bundlés de la famille Google servent aussi de filet de sécurité pour les entrées de configuration Google prises en charge |
| 6   | `applyNativeStreamingUsageCompat` | Applique aux fournisseurs de configuration des réécritures de compatibilité pour l’usage du streaming natif                                               | Le fournisseur a besoin de corrections de métadonnées d’usage du streaming natif pilotées par point de terminaison                                                                        |
| 7   | `resolveConfigApiKey`             | Résout l’authentification par marqueur d’environnement pour les fournisseurs de configuration avant le chargement de l’authentification du runtime                                       | Le fournisseur possède sa propre résolution de clé API par marqueur d’environnement ; `amazon-bedrock` dispose aussi ici d’un résolveur intégré de marqueur d’environnement AWS                |
| 8   | `resolveSyntheticAuth`            | Expose une authentification locale/autohébergée ou adossée à la configuration sans persister de texte brut                                   | Le fournisseur peut fonctionner avec un marqueur d’identifiant synthétique/local                                                                               |
| 9   | `resolveExternalAuthProfiles`     | Superpose les profils d’authentification externe appartenant au fournisseur ; la `persistence` par défaut vaut `runtime-only` pour les identifiants possédés par la CLI/l’application | Le fournisseur réutilise des identifiants d’authentification externe sans persister de jetons de rafraîchissement copiés                                                          |
| 10  | `shouldDeferSyntheticProfileAuth` | Abaisse les espaces réservés de profils synthétiques stockés derrière l’authentification adossée à l’environnement/à la configuration                                      | Le fournisseur stocke des profils d’espace réservé synthétiques qui ne doivent pas être prioritaires                                                               |
| 11  | `resolveDynamicModel`             | Repli synchrone pour les ids de modèle appartenant au fournisseur qui ne sont pas encore dans le registre local                                       | Le fournisseur accepte des ids de modèle amont arbitraires                                                                                               |
| 12  | `prepareDynamicModel`             | Préparation asynchrone, puis `resolveDynamicModel` s’exécute à nouveau                                                           | Le fournisseur a besoin de métadonnées réseau avant de résoudre des ids inconnus                                                                                |
| 13  | `normalizeResolvedModel`          | Réécriture finale avant que l’exécuteur embarqué n’utilise le modèle résolu                                               | Le fournisseur a besoin de réécritures de transport tout en utilisant un transport du core                                                                           |
| 14  | `contributeResolvedModelCompat`   | Contribue des indicateurs de compatibilité pour les modèles fournisseur derrière un autre transport compatible                                  | Le fournisseur reconnaît ses propres modèles sur des transports proxy sans prendre le contrôle du fournisseur                                                     |
| 15  | `capabilities`                    | Métadonnées de transcription/d’outillage appartenant au fournisseur utilisées par la logique partagée du core                                           | Le fournisseur a besoin de particularités liées aux transcriptions/à la famille de fournisseurs                                                                                            |
| 16  | `normalizeToolSchemas`            | Normalise les schémas d’outils avant qu’ils ne soient vus par l’exécuteur embarqué                                                    | Le fournisseur a besoin d’un nettoyage de schéma lié à la famille de transport                                                                                              |
| 17  | `inspectToolSchemas`              | Expose des diagnostics de schéma appartenant au fournisseur après normalisation                                                  | Le fournisseur veut des avertissements sur des mots-clés sans apprendre au core des règles spécifiques au fournisseur                                                               |
| 18  | `resolveReasoningOutputMode`      | Sélectionne le contrat de sortie de raisonnement natif ou balisé                                                              | Le fournisseur a besoin d’une sortie raisonnement/finale balisée au lieu de champs natifs                                                                       |
| 19  | `prepareExtraParams`              | Normalisation des paramètres de requête avant les wrappers génériques d’options de flux                                              | Le fournisseur a besoin de paramètres de requête par défaut ou d’un nettoyage des paramètres par fournisseur                                                                         |
| 20  | `createStreamFn`                  | Remplace entièrement le chemin de flux normal par un transport personnalisé                                                   | Le fournisseur a besoin d’un protocole réseau personnalisé, pas seulement d’un wrapper                                                                                   |
| 21  | `wrapStreamFn`                    | Wrapper de flux après application des wrappers génériques                                                              | Le fournisseur a besoin de wrappers de compatibilité pour les en-têtes/corps/modèles de requête sans transport personnalisé                                                        |
| 22  | `resolveTransportTurnState`       | Attache des en-têtes ou métadonnées natives de transport par tour                                                           | Le fournisseur veut que les transports génériques envoient une identité de tour native au fournisseur                                                                     |
| 23  | `resolveWebSocketSessionPolicy`   | Attache des en-têtes WebSocket natifs ou une politique de refroidissement de session                                                    | Le fournisseur veut que les transports WS génériques ajustent les en-têtes de session ou la politique de repli                                                             |
| 24  | `formatApiKey`                    | Formateur de profil d’authentification : le profil stocké devient la chaîne `apiKey` du runtime                                     | Le fournisseur stocke des métadonnées d’authentification supplémentaires et a besoin d’une forme de jeton d’exécution personnalisée                                                                  |
| 25  | `refreshOAuth`                    | Surcharge du rafraîchissement OAuth pour des points de terminaison de rafraîchissement personnalisés ou une politique d’échec de rafraîchissement                                  | Le fournisseur ne correspond pas aux mécanismes partagés de rafraîchissement `pi-ai`                                                                                         |
| 26  | `buildAuthDoctorHint`             | Indication de réparation ajoutée lorsqu’un rafraîchissement OAuth échoue                                                                  | Le fournisseur a besoin d’une indication de réparation d’authentification appartenant au fournisseur après un échec de rafraîchissement                                                                    |
| 27  | `matchesContextOverflowError`     | Détecteur de dépassement de fenêtre de contexte appartenant au fournisseur                                                                 | Le fournisseur présente des erreurs brutes de dépassement que les heuristiques génériques ne détecteraient pas                                                                              |
| 28  | `classifyFailoverReason`          | Classification du motif de basculement appartenant au fournisseur                                                                  | Le fournisseur peut mapper des erreurs brutes d’API/de transport vers limitation de débit/surcharge/etc.                                                                        |
| 29  | `isCacheTtlEligible`              | Politique de cache des prompts pour les fournisseurs proxy/backhaul                                                               | Le fournisseur a besoin d’un contrôle TTL de cache spécifique au proxy                                                                                              |
| 30  | `buildMissingAuthMessage`         | Remplacement du message générique de récupération en cas d’authentification manquante                                                      | Le fournisseur a besoin d’une indication de récupération spécifique au fournisseur en cas d’authentification manquante                                                                               |
| 31  | `suppressBuiltInModel`            | Suppression des modèles amont obsolètes plus indication d’erreur optionnelle orientée utilisateur                                          | Le fournisseur doit masquer des lignes amont obsolètes ou les remplacer par une indication fournisseur                                                               |
| 32  | `augmentModelCatalog`             | Lignes de catalogue synthétiques/finales ajoutées après la découverte                                                          | Le fournisseur a besoin de lignes synthétiques de compatibilité future dans `models list` et les sélecteurs                                                                   |
| 33  | `isBinaryThinking`                | Bascule de raisonnement activé/désactivé pour les fournisseurs à raisonnement binaire                                                          | Le fournisseur n’expose qu’un raisonnement binaire activé/désactivé                                                                                                |
| 34  | `supportsXHighThinking`           | Prise en charge du raisonnement `xhigh` pour certains modèles                                                                  | Le fournisseur veut `xhigh` seulement sur un sous-ensemble de modèles                                                                                           |
| 35  | `resolveDefaultThinkingLevel`     | Niveau `/think` par défaut pour une famille de modèles spécifique                                                             | Le fournisseur possède la politique `/think` par défaut pour une famille de modèles                                                                                    |
| 36  | `isModernModelRef`                | Détecteur de modèle moderne pour les filtres de profils en direct et la sélection smoke                                              | Le fournisseur possède la correspondance des modèles préférés en direct/smoke                                                                                           |
| 37  | `prepareRuntimeAuth`              | Échange un identifiant configuré contre le véritable jeton/clé du runtime juste avant l’inférence                       | Le fournisseur a besoin d’un échange de jeton ou d’un identifiant de requête de courte durée                                                                           |
| 38  | `resolveUsageAuth`                | Résout les identifiants d’usage/facturation pour `/usage` et les surfaces d’état associées                                     | Le fournisseur a besoin d’une analyse personnalisée des jetons d’usage/quota ou d’un identifiant d’usage différent                                                             |
| 39  | `fetchUsageSnapshot`              | Récupère et normalise des instantanés d’usage/quota spécifiques au fournisseur une fois l’authentification résolue                             | Le fournisseur a besoin d’un point de terminaison d’usage spécifique au fournisseur ou d’un analyseur de charge utile                                                                         |
| 40  | `createEmbeddingProvider`         | Construit un adaptateur d’embedding appartenant au fournisseur pour la mémoire/la recherche                                                     | Le comportement d’embedding de la mémoire doit appartenir au plugin fournisseur                                                                                  |
| 41  | `buildReplayPolicy`               | Renvoie une politique de rejeu contrôlant la gestion des transcriptions pour le fournisseur                                        | Le fournisseur a besoin d’une politique de transcription personnalisée (par exemple, suppression des blocs de réflexion)                                                             |
| 42  | `sanitizeReplayHistory`           | Réécrit l’historique de rejeu après le nettoyage générique des transcriptions                                                        | Le fournisseur a besoin de réécritures de rejeu spécifiques au fournisseur au-delà des assistants partagés de Compaction                                                           |
| 43  | `validateReplayTurns`             | Validation finale ou restructuration des tours de rejeu avant l’exécuteur embarqué                                           | Le transport du fournisseur a besoin d’une validation des tours plus stricte après l’assainissement générique                                                                  |
| 44  | `onModelSelected`                 | Exécute des effets de bord post-sélection appartenant au fournisseur                                                                 | Le fournisseur a besoin de télémétrie ou d’état appartenant au fournisseur lorsqu’un modèle devient actif                                                                |

`normalizeModelId`, `normalizeTransport` et `normalizeConfig` vérifient d’abord le
plugin fournisseur correspondant, puis parcourent les autres plugins fournisseurs capables de hooks
jusqu’à ce que l’un d’eux modifie réellement l’id du modèle ou le transport/la configuration. Cela permet de conserver le bon fonctionnement
des shims d’alias/de compatibilité fournisseur sans obliger l’appelant à savoir quel
plugin bundlé possède la réécriture. Si aucun hook fournisseur ne réécrit une entrée de configuration
prise en charge de la famille Google, le normaliseur de configuration Google bundlé applique toujours
ce nettoyage de compatibilité.

Si le fournisseur a besoin d’un protocole réseau entièrement personnalisé ou d’un exécuteur de requêtes personnalisé,
il s’agit d’une autre catégorie d’extension. Ces hooks sont destinés au comportement fournisseur
qui s’exécute toujours sur la boucle d’inférence normale d’OpenClaw.

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
  `resolveDefaultThinkingLevel`, `applyConfigDefaults`, `isModernModelRef`,
  et `wrapStreamFn` parce qu’il possède la compatibilité ascendante de Claude 4.6,
  les indications de famille de fournisseurs, les conseils de réparation d’authentification, l’intégration
  du point de terminaison d’usage, l’éligibilité du cache de prompts, les valeurs par défaut de configuration tenant compte de l’authentification, la politique
  de réflexion par défaut/adaptative de Claude, ainsi que la mise en forme de flux spécifique à Anthropic pour
  les en-têtes bêta, `/fast` / `serviceTier` et `context1m`.
- Les assistants de flux spécifiques à Claude d’Anthropic restent pour l’instant dans la propre
  jonction publique `api.ts` / `contract-api.ts` du plugin bundlé. Cette surface de package
  exporte `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` et les constructeurs de wrappers Anthropic
  de plus bas niveau au lieu d’élargir le SDK générique autour des règles d’en-têtes bêta
  d’un seul fournisseur.
- OpenAI utilise `resolveDynamicModel`, `normalizeResolvedModel` et
  `capabilities` ainsi que `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `supportsXHighThinking` et `isModernModelRef`
  parce qu’il possède la compatibilité ascendante de GPT-5.4, la normalisation directe OpenAI
  `openai-completions` -> `openai-responses`, les indications d’authentification tenant compte de Codex,
  la suppression de Spark, les lignes synthétiques de liste OpenAI et la politique de réflexion /
  de modèle live de GPT-5 ; la famille de flux `openai-responses-defaults` possède les wrappers natifs partagés OpenAI Responses pour les en-têtes d’attribution,
  `/fast`/`serviceTier`, la verbosité du texte, la recherche Web native Codex,
  la mise en forme de charge utile de compatibilité du raisonnement et la gestion du contexte Responses.
- OpenRouter utilise `catalog` ainsi que `resolveDynamicModel` et
  `prepareDynamicModel` parce que le fournisseur est en pass-through et peut exposer de nouveaux
  ids de modèle avant la mise à jour du catalogue statique d’OpenClaw ; il utilise aussi
  `capabilities`, `wrapStreamFn` et `isCacheTtlEligible` pour garder
  hors du core les en-têtes de requête spécifiques au fournisseur, les métadonnées de routage, les correctifs de raisonnement et
  la politique de cache de prompts. Sa politique de rejeu provient de la
  famille `passthrough-gemini`, tandis que la famille de flux `openrouter-thinking`
  possède l’injection de raisonnement proxy et les contournements des modèles non pris en charge / `auto`.
- GitHub Copilot utilise `catalog`, `auth`, `resolveDynamicModel` et
  `capabilities` ainsi que `prepareRuntimeAuth` et `fetchUsageSnapshot` parce qu’il
  a besoin d’une connexion par appareil appartenant au fournisseur, d’un comportement de repli de modèle, de particularités de transcription Claude,
  d’un échange de jeton GitHub -> jeton Copilot et d’un point de terminaison d’usage appartenant au fournisseur.
- OpenAI Codex utilise `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` et `augmentModelCatalog` ainsi que
  `prepareExtraParams`, `resolveUsageAuth` et `fetchUsageSnapshot` parce qu’il
  s’exécute toujours sur les transports OpenAI du core, mais possède sa normalisation
  de transport/d’URL de base, sa politique de repli de rafraîchissement OAuth, son choix de transport par défaut,
  ses lignes synthétiques de catalogue Codex et son intégration du point de terminaison d’usage ChatGPT ; il
  partage la même famille de flux `openai-responses-defaults` que l’OpenAI direct.
- Google AI Studio et Gemini CLI OAuth utilisent `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` et `isModernModelRef` parce que la
  famille de rejeu `google-gemini` possède le repli de compatibilité ascendante de Gemini 3.1,
  la validation native du rejeu Gemini, l’assainissement du rejeu d’amorçage, le mode
  de sortie de raisonnement balisé et la correspondance de modèles modernes, tandis que la
  famille de flux `google-thinking` possède la normalisation de charge utile de réflexion Gemini ;
  Gemini CLI OAuth utilise aussi `formatApiKey`, `resolveUsageAuth` et
  `fetchUsageSnapshot` pour le formatage du jeton, l’analyse du jeton et le câblage du point de terminaison de quota.
- Anthropic Vertex utilise `buildReplayPolicy` via la
  famille de rejeu `anthropic-by-model` afin que le nettoyage de rejeu spécifique à Claude reste
  limité aux ids Claude au lieu de s’appliquer à tous les transports `anthropic-messages`.
- Amazon Bedrock utilise `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` et `resolveDefaultThinkingLevel` parce qu’il possède
  la classification spécifique à Bedrock des erreurs de limitation/non-prêt/dépassement de contexte
  pour le trafic Anthropic-on-Bedrock ; sa politique de rejeu partage toujours la même
  protection `anthropic-by-model` limitée à Claude.
- OpenRouter, Kilocode, Opencode et Opencode Go utilisent `buildReplayPolicy`
  via la famille de rejeu `passthrough-gemini` parce qu’ils proxifient des modèles Gemini
  à travers des transports compatibles OpenAI et ont besoin de
  l’assainissement de thought-signature Gemini sans validation native du rejeu Gemini ni
  réécritures d’amorçage.
- MiniMax utilise `buildReplayPolicy` via la
  famille de rejeu `hybrid-anthropic-openai` parce qu’un même fournisseur possède à la fois des
  sémantiques Anthropic-message et OpenAI-compatible ; il conserve l’abandon des
  blocs de réflexion réservés à Claude côté Anthropic tout en rétablissant le mode de sortie
  de raisonnement en mode natif, et la famille de flux `minimax-fast-mode` possède
  les réécritures de modèles en mode rapide sur le chemin de flux partagé.
- Moonshot utilise `catalog` ainsi que `wrapStreamFn` parce qu’il utilise toujours le
  transport OpenAI partagé mais a besoin d’une normalisation de charge utile de réflexion appartenant au fournisseur ; la
  famille de flux `moonshot-thinking` mappe la configuration ainsi que l’état `/think` sur sa
  charge utile native de réflexion binaire.
- Kilocode utilise `catalog`, `capabilities`, `wrapStreamFn` et
  `isCacheTtlEligible` parce qu’il a besoin d’en-têtes de requête appartenant au fournisseur,
  d’une normalisation de charge utile de raisonnement, d’indications de transcription Gemini et d’un
  contrôle TTL du cache Anthropic ; la famille de flux `kilocode-thinking` maintient l’injection
  de réflexion Kilo sur le chemin de flux proxy partagé tout en ignorant `kilo/auto` et
  d’autres ids de modèles proxy qui ne prennent pas en charge des charges utiles de raisonnement explicites.
- Z.AI utilise `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `isBinaryThinking`, `isModernModelRef`,
  `resolveUsageAuth` et `fetchUsageSnapshot` parce qu’il possède le repli GLM-5,
  les valeurs par défaut de `tool_stream`, l’expérience utilisateur de réflexion binaire, la correspondance de modèles modernes et
  à la fois l’authentification d’usage et la récupération de quota ; la famille de flux `tool-stream-default-on` maintient
  hors du code de liaison manuscrit par fournisseur le wrapper `tool_stream` activé par défaut.
- xAI utilise `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` et `isModernModelRef`
  parce qu’il possède la normalisation native du transport xAI Responses, les réécritures
  d’alias Grok en mode rapide, la valeur par défaut `tool_stream`, le nettoyage strict-tool / charge utile de raisonnement,
  la réutilisation d’authentification de repli pour les outils appartenant au plugin, la résolution de modèles Grok
  à compatibilité ascendante et les correctifs de compatibilité appartenant au fournisseur, comme le profil de schéma d’outil xAI,
  les mots-clés de schéma non pris en charge, `web_search` natif et le décodage des arguments d’appel d’outil
  avec entités HTML.
- Mistral, OpenCode Zen et OpenCode Go utilisent uniquement `capabilities` afin de garder
  hors du core les particularités de transcription/d’outillage.
- Les fournisseurs bundlés uniquement catalogue tels que `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` et `volcengine` utilisent
  uniquement `catalog`.
- Qwen utilise `catalog` pour son fournisseur de texte ainsi que les enregistrements partagés de compréhension des médias et
  de génération de vidéo pour ses surfaces multimodales.
- MiniMax et Xiaomi utilisent `catalog` ainsi que des hooks d’usage, car leur comportement `/usage`
  appartient au plugin même si l’inférence continue de s’exécuter via les transports partagés.

## Assistants d’exécution

Les plugins peuvent accéder à certains assistants du core via `api.runtime`. Pour TTS :

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

- `textToSpeech` renvoie la charge utile de sortie TTS normale du core pour les surfaces fichier/note vocale.
- Utilise la configuration `messages.tts` du core et la sélection de fournisseur.
- Renvoie un tampon audio PCM + une fréquence d’échantillonnage. Les plugins doivent rééchantillonner/encoder pour les fournisseurs.
- `listVoices` est facultatif selon le fournisseur. Utilisez-le pour les sélecteurs de voix appartenant au fournisseur ou les flux de configuration.
- Les listes de voix peuvent inclure des métadonnées plus riches telles que la locale, le genre et des tags de personnalité pour des sélecteurs tenant compte du fournisseur.
- OpenAI et ElevenLabs prennent aujourd’hui en charge la téléphonie. Microsoft ne la prend pas en charge.

Les plugins peuvent également enregistrer des fournisseurs de parole via `api.registerSpeechProvider(...)`.

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

- Conservez dans le core la politique TTS, le repli et la livraison des réponses.
- Utilisez des fournisseurs de parole pour le comportement de synthèse appartenant au fournisseur.
- L’entrée Microsoft héritée `edge` est normalisée vers l’id de fournisseur `microsoft`.
- Le modèle de propriété préféré est orienté entreprise : un plugin fournisseur peut posséder
  les fournisseurs de texte, de parole, d’images et de futurs médias à mesure qu’OpenClaw ajoute ces
  contrats de capacité.

Pour la compréhension d’image/audio/vidéo, les plugins enregistrent un fournisseur
typé unique de compréhension des médias au lieu d’un sac générique clé/valeur :

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

- Conservez dans le core l’orchestration, le repli, la configuration et le câblage des canaux.
- Conservez le comportement du fournisseur dans le plugin fournisseur.
- L’expansion additive doit rester typée : nouvelles méthodes facultatives, nouveaux champs de
  résultat facultatifs, nouvelles capacités facultatives.
- La génération de vidéo suit déjà le même modèle :
  - le core possède le contrat de capacité et l’assistant d’exécution
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
  // Facultatif lorsque le type MIME ne peut pas être déduit de façon fiable :
  mime: "audio/ogg",
});
```

Remarques :

- `api.runtime.mediaUnderstanding.*` est la surface partagée privilégiée pour la
  compréhension d’image/audio/vidéo.
- Utilise la configuration audio de compréhension des médias du core (`tools.media.audio`) ainsi que l’ordre de repli des fournisseurs.
- Renvoie `{ text: undefined }` lorsqu’aucune sortie de transcription n’est produite (par exemple entrée ignorée/non prise en charge).
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

- `provider` et `model` sont des surcharges facultatives par exécution, pas des changements persistants de session.
- OpenClaw n’honore ces champs de surcharge que pour les appelants de confiance.
- Pour les exécutions de repli appartenant au plugin, les opérateurs doivent explicitement activer `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Utilisez `plugins.entries.<id>.subagent.allowedModels` pour restreindre les plugins de confiance à des cibles canoniques `provider/model` spécifiques, ou `"*"` pour autoriser explicitement n’importe quelle cible.
- Les exécutions de sous-agent de plugins non fiables continuent de fonctionner, mais les demandes de surcharge sont rejetées au lieu d’être silencieusement remplacées par un repli.

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

- Conservez dans le core la sélection du fournisseur, la résolution des identifiants et la sémantique partagée des requêtes.
- Utilisez des fournisseurs de recherche Web pour les transports de recherche spécifiques au fournisseur.
- `api.runtime.webSearch.*` est la surface partagée privilégiée pour les plugins de fonctionnalité/canal qui ont besoin d’un comportement de recherche sans dépendre du wrapper de l’outil agent.

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

- `generate(...)` : génère une image en utilisant la chaîne configurée de fournisseurs de génération d’images.
- `listProviders(...)` : liste les fournisseurs de génération d’images disponibles et leurs capacités.

## Routes HTTP Gateway

Les plugins peuvent exposer des points de terminaison HTTP avec `api.registerHttpRoute(...)`.

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

- `path` : chemin de route sous le serveur HTTP de la Gateway.
- `auth` : obligatoire. Utilisez `"gateway"` pour exiger l’authentification normale de la Gateway, ou `"plugin"` pour une authentification/validation de Webhook gérée par le plugin.
- `match` : facultatif. `"exact"` (par défaut) ou `"prefix"`.
- `replaceExisting` : facultatif. Permet au même plugin de remplacer sa propre inscription de route existante.
- `handler` : renvoie `true` lorsque la route a traité la requête.

Remarques :

- `api.registerHttpHandler(...)` a été supprimé et provoquera une erreur de chargement du plugin. Utilisez `api.registerHttpRoute(...)` à la place.
- Les routes de plugin doivent déclarer `auth` explicitement.
- Les conflits exacts `path + match` sont rejetés sauf si `replaceExisting: true`, et un plugin ne peut pas remplacer la route d’un autre plugin.
- Les routes qui se chevauchent avec différents niveaux `auth` sont rejetées. Conservez les chaînes de retombée `exact`/`prefix` au même niveau d’authentification uniquement.
- Les routes `auth: "plugin"` ne reçoivent **pas** automatiquement les portées d’exécution opérateur. Elles sont destinées aux Webhooks/à la vérification de signature gérés par le plugin, et non aux appels privilégiés des assistants Gateway.
- Les routes `auth: "gateway"` s’exécutent dans une portée d’exécution de requête Gateway, mais cette portée est volontairement conservatrice :
  - l’authentification bearer à secret partagé (`gateway.auth.mode = "token"` / `"password"`) maintient les portées d’exécution des routes de plugin fixées à `operator.write`, même si l’appelant envoie `x-openclaw-scopes`
  - les modes HTTP fiables avec identité (par exemple `trusted-proxy` ou `gateway.auth.mode = "none"` sur une entrée privée) n’honorent `x-openclaw-scopes` que lorsque l’en-tête est explicitement présent
  - si `x-openclaw-scopes` est absent sur ces requêtes de route de plugin avec identité, la portée d’exécution revient à `operator.write`
- Règle pratique : ne supposez pas qu’une route de plugin authentifiée par gateway constitue implicitement une surface d’administration. Si votre route a besoin d’un comportement réservé à l’administration, exigez un mode d’authentification avec identité et documentez le contrat explicite de l’en-tête `x-openclaw-scopes`.

## Chemins d’importation du Plugin SDK

Utilisez les sous-chemins du SDK au lieu de l’importation monolithique `openclaw/plugin-sdk` lorsque
vous créez des plugins :

- `openclaw/plugin-sdk/plugin-entry` pour les primitives d’enregistrement de plugin.
- `openclaw/plugin-sdk/core` pour le contrat générique partagé orienté plugin.
- `openclaw/plugin-sdk/config-schema` pour l’exportation du schéma Zod racine `openclaw.json`
  (`OpenClawSchema`).
- Les primitives de canal stables telles que `openclaw/plugin-sdk/channel-setup`,
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
  `openclaw/plugin-sdk/webhook-ingress` pour le câblage partagé de la configuration/de l’authentification/des réponses/des Webhooks.
  `channel-inbound` est le foyer partagé pour l’anti-rebond, la correspondance de mentions,
  les assistants de politique de mention entrante, le formatage d’enveloppe et les assistants de contexte
  d’enveloppe entrante.
  `channel-setup` est la jonction étroite de configuration d’installation facultative.
  `setup-runtime` est la surface de configuration sûre à l’exécution utilisée par `setupEntry` /
  le démarrage différé, y compris les adaptateurs de patch de configuration sûrs à l’importation.
  `setup-adapter-runtime` est la jonction d’adaptateur de configuration de compte tenant compte de l’environnement.
  `setup-tools` est la petite jonction d’assistants CLI/archive/docs (`formatCliCommand`,
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`).
- Les sous-chemins de domaine tels que `openclaw/plugin-sdk/channel-config-helpers`,
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
  `openclaw/plugin-sdk/directory-runtime` pour les assistants partagés d’exécution/de configuration.
  `telegram-command-config` est la jonction publique étroite pour la normalisation/validation des
  commandes personnalisées Telegram et reste disponible même si la
  surface de contrat Telegram bundlée est temporairement indisponible.
  `text-runtime` est la jonction partagée texte/markdown/journalisation, incluant
  la suppression du texte visible par l’assistant, les assistants de rendu/segmentation markdown, les assistants de masquage,
  les assistants de balises de directive et les utilitaires de texte sûr.
- Les jonctions de canal spécifiques à l’approbation doivent préférer un seul contrat
  `approvalCapability` sur le plugin. Le core lit ensuite l’authentification d’approbation, la livraison, le rendu,
  le routage natif et le comportement différé du gestionnaire natif via cette unique capacité
  au lieu de mélanger le comportement d’approbation dans des champs de plugin sans rapport.
- `openclaw/plugin-sdk/channel-runtime` est obsolète et ne reste que comme
  shim de compatibilité pour les anciens plugins. Le nouveau code doit importer à la place les primitives génériques plus étroites, et le code du dépôt ne doit pas ajouter de nouveaux imports du
  shim.
- Les éléments internes des extensions bundlées restent privés. Les plugins externes ne doivent utiliser que
  les sous-chemins `openclaw/plugin-sdk/*`. Le code core/de test OpenClaw peut utiliser les
  points d’entrée publics du dépôt sous une racine de package de plugin telle que `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js` et des fichiers à portée étroite comme
  `login-qr-api.js`. N’importez jamais `src/*` d’un package de plugin depuis le core ou depuis
  une autre extension.
- Séparation des points d’entrée du dépôt :
  `<plugin-package-root>/api.js` est le barrel des assistants/types,
  `<plugin-package-root>/runtime-api.js` est le barrel réservé à l’exécution,
  `<plugin-package-root>/index.js` est l’entrée du plugin bundlé,
  et `<plugin-package-root>/setup-entry.js` est l’entrée du plugin de configuration.
- Exemples actuels de fournisseurs bundlés :
  - Anthropic utilise `api.js` / `contract-api.js` pour les assistants de flux Claude tels que
    `wrapAnthropicProviderStream`, les assistants d’en-têtes bêta et l’analyse de `service_tier`.
  - OpenAI utilise `api.js` pour les constructeurs de fournisseurs, les assistants de modèle par défaut et
    les constructeurs de fournisseurs temps réel.
  - OpenRouter utilise `api.js` pour son constructeur de fournisseur ainsi que ses assistants d’onboarding/de configuration,
    tandis que `register.runtime.js` peut toujours réexporter des assistants génériques
    `plugin-sdk/provider-stream` pour un usage local au dépôt.
- Les points d’entrée publics chargés par façade préfèrent l’instantané actif de configuration d’exécution
  lorsqu’il en existe un, puis reviennent au fichier de configuration résolu sur disque lorsque
  OpenClaw ne sert pas encore d’instantané d’exécution.
- Les primitives génériques partagées restent le contrat public privilégié du SDK. Un petit
  ensemble réservé de compatibilité de jonctions d’assistance marquées par canal bundlé existe encore. Traitez-les comme des jonctions de maintenance/compatibilité bundlée, et non comme de nouvelles cibles d’importation tierces ; les nouveaux contrats inter-canaux doivent toujours être ajoutés sur des sous-chemins génériques `plugin-sdk/*` ou sur les barrels locaux `api.js` /
  `runtime-api.js` du plugin.

Note de compatibilité :

- Évitez le barrel racine `openclaw/plugin-sdk` pour le nouveau code.
- Préférez d’abord les primitives stables étroites. Les sous-chemins plus récents pour setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool constituent le contrat prévu pour le nouveau
  travail de plugin bundlé et externe.
  L’analyse/la correspondance des cibles doit se faire sur `openclaw/plugin-sdk/channel-targets`.
  Les barrières d’actions de message et les assistants d’id de message pour réactions doivent se trouver sur
  `openclaw/plugin-sdk/channel-actions`.
- Les barrels d’assistance spécifiques aux extensions bundlées ne sont pas stables par défaut. Si un
  assistant n’est nécessaire que pour une extension bundlée, conservez-le derrière la
  jonction locale `api.js` ou `runtime-api.js` de l’extension au lieu de le promouvoir dans
  `openclaw/plugin-sdk/<extension>`.
- Les nouvelles jonctions d’assistance partagée doivent être génériques, et non marquées par canal. L’analyse
  partagée des cibles doit se trouver sur `openclaw/plugin-sdk/channel-targets` ; les éléments internes spécifiques au canal
  restent derrière la jonction locale `api.js` ou `runtime-api.js` du plugin propriétaire.
- Des sous-chemins spécifiques à une capacité tels que `image-generation`,
  `media-understanding` et `speech` existent parce que les plugins bundlés/natifs les utilisent
  aujourd’hui. Leur présence ne signifie pas à elle seule que chaque assistant exporté est un contrat externe gelé à long terme.

## Schémas de l’outil de message

Les plugins doivent posséder les contributions de schéma `describeMessageTool(...)` spécifiques au canal.
Conservez les champs spécifiques au fournisseur dans le plugin, pas dans le core partagé.

Pour les fragments de schéma portables partagés, réutilisez les assistants génériques exportés via
`openclaw/plugin-sdk/channel-actions` :

- `createMessageToolButtonsSchema()` pour les charges utiles de style grille de boutons
- `createMessageToolCardSchema()` pour les charges utiles de cartes structurées

Si une forme de schéma n’a de sens que pour un seul fournisseur, définissez-la dans la
propre source de ce plugin au lieu de la promouvoir dans le SDK partagé.

## Résolution des cibles de canal

Les plugins de canal doivent posséder la sémantique des cibles spécifique au canal. Conservez l’hôte
sortant partagé générique et utilisez la surface de l’adaptateur de messagerie pour les règles de fournisseur :

- `messaging.inferTargetChatType({ to })` décide si une cible normalisée
  doit être traitée comme `direct`, `group` ou `channel` avant la recherche dans l’annuaire.
- `messaging.targetResolver.looksLikeId(raw, normalized)` indique au core si une
  entrée doit passer directement à une résolution de type id au lieu d’une recherche dans l’annuaire.
- `messaging.targetResolver.resolveTarget(...)` est le repli du plugin lorsque le
  core a besoin d’une résolution finale appartenant au fournisseur après normalisation ou après
  un échec de l’annuaire.
- `messaging.resolveOutboundSessionRoute(...)` possède la construction de route de session spécifique au fournisseur
  une fois la cible résolue.

Répartition recommandée :

- Utilisez `inferTargetChatType` pour les décisions de catégorie qui doivent se produire avant
  la recherche de pairs/groupes.
- Utilisez `looksLikeId` pour les vérifications du type « traiter ceci comme un id de cible explicite/natif ».
- Utilisez `resolveTarget` pour le repli de normalisation spécifique au fournisseur, pas pour une
  recherche large dans l’annuaire.
- Conservez les ids natifs du fournisseur comme les ids de chat, ids de thread, JID, handles et ids de salle
  dans les valeurs `target` ou dans les paramètres spécifiques au fournisseur, pas dans des champs génériques du SDK.

## Annuaires adossés à la configuration

Les plugins qui dérivent des entrées d’annuaire à partir de la configuration doivent conserver cette logique dans le
plugin et réutiliser les assistants partagés de
`openclaw/plugin-sdk/directory-runtime`.

Utilisez cela lorsqu’un canal a besoin de pairs/groupes adossés à la configuration tels que :

- pairs de messages directs pilotés par allowlist
- mappages configurés de canaux/groupes
- replis d’annuaire statiques à portée de compte

Les assistants partagés de `directory-runtime` ne gèrent que des opérations génériques :

- filtrage des requêtes
- application des limites
- assistants de déduplication/normalisation
- construction de `ChannelDirectoryEntry[]`

L’inspection de compte spécifique au canal et la normalisation des ids doivent rester dans
l’implémentation du plugin.

## Catalogues de fournisseurs

Les plugins de fournisseur peuvent définir des catalogues de modèles pour l’inférence avec
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` renvoie la même forme que celle qu’OpenClaw écrit dans
`models.providers` :

- `{ provider }` pour une entrée de fournisseur
- `{ providers }` pour plusieurs entrées de fournisseur

Utilisez `catalog` lorsque le plugin possède les ids de modèle spécifiques au fournisseur, les valeurs par défaut d’URL de base
ou des métadonnées de modèle protégées par authentification.

`catalog.order` contrôle le moment où le catalogue d’un plugin fusionne par rapport aux
fournisseurs implicites intégrés d’OpenClaw :

- `simple` : fournisseurs simples pilotés par clé API ou environnement
- `profile` : fournisseurs qui apparaissent lorsque des profils d’authentification existent
- `paired` : fournisseurs qui synthétisent plusieurs entrées de fournisseur liées
- `late` : dernier passage, après les autres fournisseurs implicites

Les fournisseurs ultérieurs l’emportent en cas de collision de clé, de sorte que les plugins peuvent
remplacer intentionnellement une entrée de fournisseur intégrée avec le même id de fournisseur.

Compatibilité :

- `discovery` fonctionne toujours comme alias hérité
- si `catalog` et `discovery` sont tous deux enregistrés, OpenClaw utilise `catalog`

## Inspection de canal en lecture seule

Si votre plugin enregistre un canal, préférez implémenter
`plugin.config.inspectAccount(cfg, accountId)` en parallèle de `resolveAccount(...)`.

Pourquoi :

- `resolveAccount(...)` est le chemin d’exécution. Il peut supposer que les identifiants
  sont entièrement matérialisés et échouer rapidement lorsque des secrets requis sont absents.
- Les chemins de commande en lecture seule tels que `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` et les flux doctor/réparation de configuration
  ne doivent pas avoir besoin de matérialiser les identifiants d’exécution simplement pour
  décrire la configuration.

Comportement recommandé pour `inspectAccount(...)` :

- Renvoyer uniquement un état descriptif du compte.
- Préserver `enabled` et `configured`.
- Inclure les champs de source/statut d’identifiants lorsque c’est pertinent, tels que :
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Vous n’avez pas besoin de renvoyer les valeurs brutes des jetons simplement pour signaler une
  disponibilité en lecture seule. Renvoyer `tokenStatus: "available"` (ainsi que le champ de source correspondant)
  suffit pour les commandes de type status.
- Utilisez `configured_unavailable` lorsqu’un identifiant est configuré via SecretRef mais
  indisponible dans le chemin de commande courant.

Cela permet aux commandes en lecture seule de signaler « configuré mais indisponible dans ce chemin de commande »
au lieu de planter ou d’indiquer à tort que le compte n’est pas configuré.

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

Chaque entrée devient un plugin. Si le pack liste plusieurs extensions, l’id du plugin
devient `name/<fileBase>`.

Si votre plugin importe des dépendances npm, installez-les dans ce répertoire afin que
`node_modules` soit disponible (`npm install` / `pnpm install`).

Garde-fou de sécurité : chaque entrée `openclaw.extensions` doit rester à l’intérieur du répertoire du plugin
après résolution des liens symboliques. Les entrées qui sortent du répertoire du package sont
rejetées.

Note de sécurité : `openclaw plugins install` installe les dépendances du plugin avec
`npm install --omit=dev --ignore-scripts` (pas de scripts de cycle de vie, pas de dépendances de développement à l’exécution). Conservez les arbres de dépendances du plugin en
« pur JS/TS » et évitez les packages qui nécessitent des builds `postinstall`.

Facultatif : `openclaw.setupEntry` peut pointer vers un module léger réservé à la configuration.
Lorsqu’OpenClaw a besoin des surfaces de configuration pour un plugin de canal désactivé, ou
lorsqu’un plugin de canal est activé mais encore non configuré, il charge `setupEntry`
au lieu de l’entrée complète du plugin. Cela allège le démarrage et la configuration
lorsque l’entrée principale de votre plugin câble aussi des outils, des hooks ou d’autres
éléments réservés à l’exécution.

Facultatif : `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
peut faire opter un plugin de canal pour ce même chemin `setupEntry` pendant la
phase de démarrage pré-écoute de la gateway, même lorsque le canal est déjà configuré.

Utilisez cela uniquement lorsque `setupEntry` couvre entièrement la surface de démarrage qui doit exister
avant que la gateway ne commence à écouter. En pratique, cela signifie que l’entrée de configuration
doit enregistrer chaque capacité appartenant au canal dont le démarrage dépend, comme :

- l’enregistrement du canal lui-même
- toute route HTTP qui doit être disponible avant que la gateway ne commence à écouter
- toute méthode Gateway, tout outil ou tout service qui doit exister pendant cette même fenêtre

Si votre entrée complète possède encore une capacité de démarrage requise, n’activez pas
ce drapeau. Conservez le comportement par défaut du plugin et laissez OpenClaw charger
l’entrée complète pendant le démarrage.

Les canaux bundlés peuvent également publier des assistants de surface de contrat réservés à la configuration que le core
peut consulter avant que le runtime complet du canal soit chargé. La surface actuelle de
promotion de configuration est :

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Le core utilise cette surface lorsqu’il a besoin de promouvoir une configuration héritée de canal à compte unique
dans `channels.<id>.accounts.*` sans charger l’entrée complète du plugin.
Matrix est l’exemple bundlé actuel : il déplace uniquement les clés d’authentification/d’amorçage dans un
compte promu nommé lorsque des comptes nommés existent déjà, et il peut préserver une
clé de compte par défaut configurée non canonique au lieu de toujours créer
`accounts.default`.

Ces adaptateurs de patch de configuration maintiennent la découverte paresseuse de la surface de contrat bundlée. Le temps
d’importation reste léger ; la surface de promotion n’est chargée qu’au premier usage au lieu
de réentrer dans le démarrage du canal bundlé lors de l’importation du module.

Lorsque ces surfaces de démarrage incluent des méthodes RPC Gateway, conservez-les sur un
préfixe spécifique au plugin. Les espaces de noms d’administration du core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restent réservés et se résolvent toujours
en `operator.admin`, même si un plugin demande une portée plus étroite.

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

Les plugins de canal peuvent publier des métadonnées de configuration/découverte via `openclaw.channel` et
des indications d’installation via `openclaw.install`. Cela permet au catalogue du core de rester sans données.

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
      "blurb": "Chat auto-hébergé via des bots Webhook Nextcloud Talk.",
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

- `detailLabel` : libellé secondaire pour des surfaces de catalogue/de statut plus riches
- `docsLabel` : remplace le texte du lien vers la documentation
- `preferOver` : ids de plugin/canal de priorité inférieure que cette entrée de catalogue doit dépasser
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras` : contrôles de copie de la surface de sélection
- `markdownCapable` : marque le canal comme compatible markdown pour les décisions de formatage sortant
- `exposure.configured` : masque le canal des surfaces de liste de canaux configurés lorsqu’il vaut `false`
- `exposure.setup` : masque le canal des sélecteurs interactifs de configuration lorsqu’il vaut `false`
- `exposure.docs` : marque le canal comme interne/privé pour les surfaces de navigation de documentation
- `showConfigured` / `showInSetup` : alias hérités toujours acceptés pour compatibilité ; préférez `exposure`
- `quickstartAllowFrom` : fait opter le canal pour le flux standard `allowFrom` de démarrage rapide
- `forceAccountBinding` : exige une liaison de compte explicite même lorsqu’un seul compte existe
- `preferSessionLookupForAnnounceTarget` : préfère la recherche de session lors de la résolution des cibles d’annonce

OpenClaw peut aussi fusionner des **catalogues de canaux externes** (par exemple, une
exportation de registre MPM). Déposez un fichier JSON à l’un de ces emplacements :

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Ou faites pointer `OPENCLAW_PLUGIN_CATALOG_PATHS` (ou `OPENCLAW_MPM_CATALOG_PATHS`) vers
un ou plusieurs fichiers JSON (délimités par virgule/point-virgule/`PATH`). Chaque fichier doit
contenir `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. L’analyseur accepte aussi `"packages"` ou `"plugins"` comme alias hérités pour la clé `"entries"`.

## Plugins de moteur de contexte

Les plugins de moteur de contexte possèdent l’orchestration du contexte de session pour l’ingestion, l’assemblage
et la Compaction. Enregistrez-les depuis votre plugin avec
`api.registerContextEngine(id, factory)`, puis sélectionnez le moteur actif avec
`plugins.slots.contextEngine`.

Utilisez cela lorsque votre plugin doit remplacer ou étendre le pipeline de contexte par défaut
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
le système de plugins par un accès privé direct. Ajoutez la capacité manquante.

Séquence recommandée :

1. définir le contrat du core
   Décidez quel comportement partagé le core doit posséder : politique, repli, fusion de configuration,
   cycle de vie, sémantique orientée canal et forme de l’assistant d’exécution.
2. ajouter des surfaces typées d’enregistrement/de runtime de plugin
   Étendez `OpenClawPluginApi` et/ou `api.runtime` avec la plus petite
   surface de capacité typée utile.
3. relier les consommateurs du core + du canal/de la fonctionnalité
   Les canaux et plugins de fonctionnalité doivent consommer la nouvelle capacité via le core,
   et non en important directement une implémentation fournisseur.
4. enregistrer les implémentations fournisseur
   Les plugins fournisseurs enregistrent ensuite leurs backends sur cette capacité.
5. ajouter une couverture de contrat
   Ajoutez des tests afin que la propriété et la forme d’enregistrement restent explicites dans le temps.

C’est ainsi qu’OpenClaw reste prescriptif sans devenir codé en dur selon la
vision du monde d’un seul fournisseur. Voir le [Recueil de recettes des capacités](/fr/plugins/architecture)
pour une checklist de fichiers concrète et un exemple détaillé.

### Checklist de capacité

Lorsque vous ajoutez une nouvelle capacité, l’implémentation doit généralement toucher
ces surfaces ensemble :

- types de contrat du core dans `src/<capability>/types.ts`
- assistant d’exécution/exécuteur du core dans `src/<capability>/runtime.ts`
- surface d’enregistrement de l’API de plugin dans `src/plugins/types.ts`
- câblage du registre des plugins dans `src/plugins/registry.ts`
- exposition du runtime de plugin dans `src/plugins/runtime/*` lorsque des plugins de fonctionnalité/canal
  doivent la consommer
- assistants de capture/test dans `src/test-utils/plugin-registration.ts`
- assertions de propriété/de contrat dans `src/plugins/contracts/registry.ts`
- documentation opérateur/plugin dans `docs/`

Si l’une de ces surfaces manque, c’est généralement le signe que la capacité n’est
pas encore entièrement intégrée.

### Modèle de capacité

Modèle minimal :

```ts
// contrat du core
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// API de plugin
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

Modèle de test de contrat :

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Cela garde la règle simple :

- le core possède le contrat de capacité + l’orchestration
- les plugins fournisseurs possèdent les implémentations fournisseur
- les plugins de fonctionnalité/canal consomment les assistants d’exécution
- les tests de contrat gardent la propriété explicite
