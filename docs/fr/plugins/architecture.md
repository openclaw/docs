---
read_when:
    - Créer ou déboguer des plugins OpenClaw natifs
    - Comprendre le modèle de capacités des plugins ou les limites de propriété
    - Travailler sur le pipeline de chargement des plugins ou le registre
    - Implémenter des hooks d’exécution de fournisseur ou des plugins de canal
sidebarTitle: Internals
summary: 'Composants internes des plugins : modèle de capacités, propriété, contrats, pipeline de chargement et helpers d’exécution'
title: Composants internes des plugins
x-i18n:
    generated_at: "2026-04-12T06:49:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6165a9da8b40de3bb7334fcb16023da5515deb83c4897ca1df1726f4a97db9e0
    source_path: plugins/architecture.md
    workflow: 15
---

# Composants internes des plugins

<Info>
  Il s’agit de la **référence d’architecture approfondie**. Pour des guides pratiques, voir :
  - [Installer et utiliser des plugins](/fr/tools/plugin) — guide utilisateur
  - [Premiers pas](/fr/plugins/building-plugins) — premier tutoriel de plugin
  - [Plugins de canal](/fr/plugins/sdk-channel-plugins) — créer un canal de messagerie
  - [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins) — créer un fournisseur de modèles
  - [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) — table d’imports et API d’enregistrement
</Info>

Cette page couvre l’architecture interne du système de plugins d’OpenClaw.

## Modèle de capacités public

Les capacités constituent le modèle public des **plugins natifs** dans OpenClaw. Chaque
plugin OpenClaw natif s’enregistre auprès d’un ou de plusieurs types de capacités :

| Capacité               | Méthode d’enregistrement                        | Exemples de plugins                  |
| ---------------------- | ----------------------------------------------- | ------------------------------------ |
| Inférence de texte     | `api.registerProvider(...)`                     | `openai`, `anthropic`                |
| Backend d’inférence CLI | `api.registerCliBackend(...)`                  | `openai`, `anthropic`                |
| Voix                   | `api.registerSpeechProvider(...)`               | `elevenlabs`, `microsoft`            |
| Transcription en temps réel | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                        |
| Voix en temps réel     | `api.registerRealtimeVoiceProvider(...)`        | `openai`                             |
| Compréhension des médias | `api.registerMediaUnderstandingProvider(...)` | `openai`, `google`                   |
| Génération d’images    | `api.registerImageGenerationProvider(...)`      | `openai`, `google`, `fal`, `minimax` |
| Génération de musique  | `api.registerMusicGenerationProvider(...)`      | `google`, `minimax`                  |
| Génération de vidéo    | `api.registerVideoGenerationProvider(...)`      | `qwen`                               |
| Récupération web       | `api.registerWebFetchProvider(...)`             | `firecrawl`                          |
| Recherche web          | `api.registerWebSearchProvider(...)`            | `google`                             |
| Canal / messagerie     | `api.registerChannel(...)`                      | `msteams`, `matrix`                  |

Un plugin qui enregistre zéro capacité mais fournit des hooks, des outils ou des
services est un plugin **legacy hook-only**. Ce modèle reste entièrement pris en charge.

### Position de compatibilité externe

Le modèle de capacités est intégré au cœur et utilisé aujourd’hui par les plugins
bundled/natifs, mais la compatibilité des plugins externes exige encore une barre
plus stricte que « c’est exporté, donc c’est figé ».

Recommandation actuelle :

- **plugins externes existants :** conserver le bon fonctionnement des
  intégrations basées sur des hooks ; les considérer comme la base de compatibilité
- **nouveaux plugins bundled/natifs :** préférer un enregistrement explicite des
  capacités plutôt que des accès internes spécifiques à un fournisseur ou de
  nouveaux modèles hook-only
- **plugins externes qui adoptent l’enregistrement de capacités :** autorisé,
  mais considérer les surfaces helper spécifiques aux capacités comme évolutives,
  sauf si la documentation marque explicitement un contrat comme stable

Règle pratique :

- les API d’enregistrement de capacités sont la direction prévue
- les hooks legacy restent le chemin le plus sûr pour éviter toute rupture pour
  les plugins externes pendant la transition
- tous les sous-chemins helper exportés ne se valent pas ; préférez le contrat
  étroit et documenté, pas des exports helper accessoires

### Formes de plugin

OpenClaw classe chaque plugin chargé dans une forme selon son comportement
d’enregistrement réel (et pas seulement selon des métadonnées statiques) :

- **plain-capability** -- enregistre exactement un type de capacité (par exemple,
  un plugin uniquement fournisseur comme `mistral`)
- **hybrid-capability** -- enregistre plusieurs types de capacités (par exemple,
  `openai` possède l’inférence de texte, la voix, la compréhension des médias et la
  génération d’images)
- **hook-only** -- enregistre uniquement des hooks (typés ou personnalisés), sans
  capacités, outils, commandes ni services
- **non-capability** -- enregistre des outils, commandes, services ou routes, mais
  aucune capacité

Utilisez `openclaw plugins inspect <id>` pour voir la forme d’un plugin et la
répartition de ses capacités. Voir la [référence CLI](/cli/plugins#inspect) pour plus de détails.

### Hooks legacy

Le hook `before_agent_start` reste pris en charge comme chemin de compatibilité
pour les plugins hook-only. Des plugins legacy réels en dépendent encore.

Orientation :

- le conserver fonctionnel
- le documenter comme legacy
- préférer `before_model_resolve` pour le travail de substitution de modèle/fournisseur
- préférer `before_prompt_build` pour le travail de mutation des prompts
- le supprimer seulement après baisse de l’usage réel et quand la couverture par
  fixtures prouve la sécurité de la migration

### Signaux de compatibilité

Lorsque vous exécutez `openclaw doctor` ou `openclaw plugins inspect <id>`, vous
pouvez voir l’un de ces libellés :

| Signal                     | Signification                                               |
| -------------------------- | ----------------------------------------------------------- |
| **config valid**           | La configuration est analysée correctement et les plugins sont résolus |
| **compatibility advisory** | Le plugin utilise un modèle ancien mais pris en charge (par ex. `hook-only`) |
| **legacy warning**         | Le plugin utilise `before_agent_start`, qui est obsolète    |
| **hard error**             | La configuration est invalide ou le plugin n’a pas pu être chargé |

Ni `hook-only` ni `before_agent_start` ne casseront votre plugin aujourd’hui --
`hook-only` est informatif, et `before_agent_start` ne déclenche qu’un
avertissement. Ces signaux apparaissent aussi dans `openclaw status --all` et
`openclaw plugins doctor`.

## Vue d’ensemble de l’architecture

Le système de plugins d’OpenClaw comporte quatre couches :

1. **Manifest + découverte**
   OpenClaw trouve les plugins candidats à partir des chemins configurés, des
   racines d’espace de travail, des racines globales d’extensions et des
   extensions bundled. La découverte lit d’abord les manifests natifs
   `openclaw.plugin.json` ainsi que les manifests de bundles pris en charge.
2. **Activation + validation**
   Le cœur décide si un plugin découvert est activé, désactivé, bloqué ou
   sélectionné pour un emplacement exclusif comme la mémoire.
3. **Chargement à l’exécution**
   Les plugins OpenClaw natifs sont chargés dans le processus via jiti et
   enregistrent des capacités dans un registre central. Les bundles compatibles
   sont normalisés en entrées de registre sans importer de code d’exécution.
4. **Consommation des surfaces**
   Le reste d’OpenClaw lit le registre pour exposer les outils, canaux, configuration
   des fournisseurs, hooks, routes HTTP, commandes CLI et services.

Pour la CLI des plugins en particulier, la découverte des commandes racine est
divisée en deux phases :

- les métadonnées au moment de l’analyse proviennent de `registerCli(..., { descriptors: [...] })`
- le véritable module CLI du plugin peut rester paresseux et s’enregistrer lors de la première invocation

Cela permet de garder le code CLI appartenant au plugin à l’intérieur du plugin
tout en laissant OpenClaw réserver les noms de commandes racine avant l’analyse.

La limite de conception importante :

- la découverte + la validation de configuration doivent fonctionner à partir des
  **métadonnées de manifest/schéma** sans exécuter de code de plugin
- le comportement natif à l’exécution provient du chemin `register(api)` du module du plugin

Cette séparation permet à OpenClaw de valider la configuration, d’expliquer les
plugins manquants/désactivés et de construire des indications d’interface/schéma
avant que l’exécution complète ne soit active.

### Plugins de canal et outil de message partagé

Les plugins de canal n’ont pas besoin d’enregistrer un outil séparé
d’envoi/modification/réaction pour les actions de chat normales. OpenClaw conserve
un unique outil `message` partagé dans le cœur, et les plugins de canal possèdent
la découverte et l’exécution spécifiques au canal derrière celui-ci.

La limite actuelle est la suivante :

- le cœur possède l’hôte de l’outil `message` partagé, le câblage des prompts, la
  tenue de session/thread et la répartition de l’exécution
- les plugins de canal possèdent la découverte des actions à portée, la
  découverte des capacités et tous les fragments de schéma spécifiques au canal
- les plugins de canal possèdent la grammaire de conversation de session
  spécifique au fournisseur, comme la façon dont les identifiants de conversation
  encodent les identifiants de thread ou héritent des conversations parentes
- les plugins de canal exécutent l’action finale via leur adaptateur d’action

Pour les plugins de canal, la surface SDK est
`ChannelMessageActionAdapter.describeMessageTool(...)`. Cet appel de découverte
unifié permet à un plugin de renvoyer ensemble ses actions visibles, ses
capacités et ses contributions au schéma afin que ces éléments ne divergent pas.

Le cœur transmet la portée d’exécution à cette étape de découverte. Les champs
importants incluent :

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` entrant de confiance

C’est important pour les plugins sensibles au contexte. Un canal peut masquer ou
exposer des actions de message selon le compte actif, la salle/le thread/le
message actuel, ou l’identité fiable du demandeur, sans coder en dur des branches
spécifiques à un canal dans l’outil `message` du cœur.

C’est pourquoi les changements de routage embedded-runner restent du travail de
plugin : le runner est responsable de transmettre l’identité actuelle du
chat/de la session à la limite de découverte du plugin afin que l’outil `message`
partagé expose la bonne surface appartenant au canal pour le tour courant.

Pour les helpers d’exécution appartenant au canal, les plugins bundled doivent
conserver le runtime d’exécution dans leurs propres modules d’extension. Le cœur
ne possède plus les runtimes d’actions de message Discord, Slack, Telegram ou
WhatsApp sous `src/agents/tools`.
Nous ne publions pas de sous-chemins `plugin-sdk/*-action-runtime` séparés, et les
plugins bundled doivent importer directement leur propre code d’exécution local
depuis leurs modules appartenant à l’extension.

La même limite s’applique en général aux coutures SDK nommées par fournisseur :
le cœur ne doit pas importer de barrels pratiques spécifiques à un canal pour
Slack, Discord, Signal, WhatsApp ou des extensions similaires. Si le cœur a
besoin d’un comportement, soit il consomme le barrel `api.ts` / `runtime-api.ts`
du plugin bundled lui-même, soit il promeut ce besoin en une capacité générique
étroite dans le SDK partagé.

Pour les sondages en particulier, il existe deux chemins d’exécution :

- `outbound.sendPoll` est la base partagée pour les canaux qui correspondent au
  modèle commun de sondage
- `actions.handleAction("poll")` est le chemin privilégié pour la sémantique de
  sondage spécifique à un canal ou pour des paramètres de sondage supplémentaires

Le cœur reporte désormais l’analyse partagée des sondages jusqu’à ce que la
répartition des sondages du plugin refuse l’action, afin que les gestionnaires
de sondage appartenant au plugin puissent accepter des champs de sondage
spécifiques au canal sans être bloqués d’abord par l’analyseur générique de sondages.

Voir [Pipeline de chargement](#load-pipeline) pour la séquence complète de démarrage.

## Modèle de propriété des capacités

OpenClaw traite un plugin natif comme la limite de propriété pour une **entreprise**
ou une **fonctionnalité**, et non comme un fourre-tout d’intégrations sans lien.

Cela signifie :

- un plugin d’entreprise devrait généralement posséder toutes les surfaces
  OpenClaw orientées vers cette entreprise
- un plugin de fonctionnalité devrait généralement posséder toute la surface de
  la fonctionnalité qu’il introduit
- les canaux devraient consommer les capacités partagées du cœur au lieu de
  réimplémenter de manière ad hoc le comportement des fournisseurs

Exemples :

- le plugin bundled `openai` possède le comportement de fournisseur de modèles OpenAI
  et le comportement OpenAI de voix + voix en temps réel + compréhension des médias +
  génération d’images
- le plugin bundled `elevenlabs` possède le comportement de voix ElevenLabs
- le plugin bundled `microsoft` possède le comportement de voix Microsoft
- le plugin bundled `google` possède le comportement de fournisseur de modèles Google
  ainsi que le comportement Google de compréhension des médias + génération d’images +
  recherche web
- le plugin bundled `firecrawl` possède le comportement de récupération web Firecrawl
- les plugins bundled `minimax`, `mistral`, `moonshot` et `zai` possèdent leurs
  backends de compréhension des médias
- le plugin bundled `qwen` possède le comportement de fournisseur de texte Qwen ainsi
  que les comportements de compréhension des médias et de génération de vidéo
- le plugin `voice-call` est un plugin de fonctionnalité : il possède le
  transport d’appel, les outils, la CLI, les routes et le pont Twilio media-stream,
  mais il consomme les capacités partagées de voix ainsi que de transcription en
  temps réel et de voix en temps réel au lieu d’importer directement des plugins fournisseurs

L’état final visé est :

- OpenAI vit dans un seul plugin même s’il couvre les modèles de texte, la
  voix, les images et la future vidéo
- un autre fournisseur peut faire de même pour sa propre surface
- les canaux ne se préoccupent pas de savoir quel plugin fournisseur possède le
  provider ; ils consomment le contrat de capacité partagé exposé par le cœur

C’est la distinction clé :

- **plugin** = limite de propriété
- **capability** = contrat du cœur que plusieurs plugins peuvent implémenter ou consommer

Donc, si OpenClaw ajoute un nouveau domaine comme la vidéo, la première question
n’est pas
« quel fournisseur devrait coder en dur la gestion de la vidéo ? » La première
question est « quel est le contrat de capacité vidéo du cœur ? » Une fois ce
contrat en place, les plugins fournisseurs peuvent s’y enregistrer et les
plugins de canal/fonctionnalité peuvent le consommer.

Si la capacité n’existe pas encore, la bonne démarche est généralement :

1. définir la capacité manquante dans le cœur
2. l’exposer de manière typée via l’API/runtime des plugins
3. raccorder les canaux/fonctionnalités à cette capacité
4. laisser les plugins fournisseurs enregistrer des implémentations

Cela garde une propriété explicite tout en évitant un comportement du cœur qui
dépend d’un seul fournisseur ou d’un chemin de code spécifique à un plugin
ponctuel.

### Superposition des capacités

Utilisez ce modèle mental pour décider où le code doit se trouver :

- **couche de capacité du cœur** : orchestration partagée, politique, fallback, règles de
  fusion de configuration, sémantique de livraison et contrats typés
- **couche de plugin fournisseur** : API spécifiques au fournisseur, authentification, catalogues de
  modèles, synthèse vocale, génération d’images, futurs backends vidéo, points de terminaison d’usage
- **couche de plugin de canal/fonctionnalité** : intégration Slack/Discord/voice-call/etc.
  qui consomme les capacités du cœur et les présente sur une surface

Par exemple, la TTS suit cette forme :

- le cœur possède la politique TTS au moment de la réponse, l’ordre de fallback, les préférences et la livraison par canal
- `openai`, `elevenlabs` et `microsoft` possèdent les implémentations de synthèse
- `voice-call` consomme le helper d’exécution TTS de téléphonie

Ce même modèle doit être préféré pour les futures capacités.

### Exemple de plugin d’entreprise multi-capacités

Un plugin d’entreprise doit sembler cohérent vu de l’extérieur. Si OpenClaw a des
contrats partagés pour les modèles, la voix, la transcription en temps réel, la voix en temps réel, la
compréhension des médias, la génération d’images, la génération de vidéo, la récupération web et la recherche web,
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

Ce qui importe n’est pas le nom exact des helpers. C’est la forme qui compte :

- un seul plugin possède la surface du fournisseur
- le cœur possède toujours les contrats de capacité
- les plugins de canal et de fonctionnalité consomment les helpers `api.runtime.*`, pas du code fournisseur
- les tests de contrat peuvent vérifier que le plugin a enregistré les capacités
  qu’il prétend posséder

### Exemple de capacité : compréhension vidéo

OpenClaw traite déjà la compréhension des images, de l’audio et de la vidéo comme une
capacité partagée unique. Le même modèle de propriété s’y applique :

1. le cœur définit le contrat de compréhension des médias
2. les plugins fournisseurs enregistrent `describeImage`, `transcribeAudio` et
   `describeVideo` selon le cas
3. les plugins de canal et de fonctionnalité consomment le comportement partagé du cœur au lieu de
   se raccorder directement au code du fournisseur

Cela évite d’intégrer dans le cœur les hypothèses vidéo d’un fournisseur en particulier. Le plugin possède
la surface du fournisseur ; le cœur possède le contrat de capacité et le comportement de fallback.

La génération de vidéo suit déjà cette même séquence : le cœur possède le contrat de
capacité typé et le helper d’exécution, et les plugins fournisseurs enregistrent
des implémentations `api.registerVideoGenerationProvider(...)` dessus.

Besoin d’une checklist de déploiement concrète ? Voir
[Recueil de recettes des capacités](/fr/plugins/architecture).

## Contrats et application

La surface de l’API des plugins est volontairement typée et centralisée dans
`OpenClawPluginApi`. Ce contrat définit les points d’enregistrement pris en charge et
les helpers d’exécution sur lesquels un plugin peut s’appuyer.

Pourquoi c’est important :

- les auteurs de plugins disposent d’une norme interne stable unique
- le cœur peut rejeter les propriétés dupliquées, comme deux plugins qui enregistrent le même
  id de provider
- le démarrage peut afficher des diagnostics exploitables pour un enregistrement mal formé
- les tests de contrat peuvent faire respecter la propriété des plugins bundled et empêcher toute dérive silencieuse

Il existe deux couches d’application :

1. **application de l’enregistrement à l’exécution**
   Le registre des plugins valide les enregistrements au chargement des plugins. Exemples :
   des ids de provider dupliqués, des ids de fournisseur vocal dupliqués et des
   enregistrements mal formés produisent des diagnostics de plugin au lieu d’un comportement indéfini.
2. **tests de contrat**
   Les plugins bundled sont capturés dans des registres de contrat pendant les exécutions de test afin
   qu’OpenClaw puisse vérifier explicitement la propriété. Aujourd’hui, cela est utilisé pour les
   fournisseurs de modèles, les fournisseurs vocaux, les fournisseurs de recherche web et la propriété
   d’enregistrement bundled.

L’effet pratique est qu’OpenClaw sait, dès le départ, quel plugin possède quelle
surface. Cela permet au cœur et aux canaux de se composer sans friction, car la
propriété est déclarée, typée et testable plutôt qu’implicite.

### Ce qui a sa place dans un contrat

Les bons contrats de plugin sont :

- typés
- petits
- spécifiques à une capacité
- possédés par le cœur
- réutilisables par plusieurs plugins
- consommables par des canaux/fonctionnalités sans connaissance du fournisseur

Les mauvais contrats de plugin sont :

- une politique spécifique à un fournisseur cachée dans le cœur
- des échappatoires ponctuelles pour un plugin qui contournent le registre
- du code de canal qui accède directement à une implémentation fournisseur
- des objets d’exécution ad hoc qui ne font pas partie de `OpenClawPluginApi` ou
  de `api.runtime`

En cas de doute, augmentez le niveau d’abstraction : définissez d’abord la
capacité, puis laissez les plugins s’y brancher.

## Modèle d’exécution

Les plugins OpenClaw natifs s’exécutent **dans le processus** avec la Gateway. Ils ne sont pas
sandboxés. Un plugin natif chargé partage la même limite de confiance au niveau du processus que
le code du cœur.

Implications :

- un plugin natif peut enregistrer des outils, des gestionnaires réseau, des hooks et des services
- un bug dans un plugin natif peut faire planter ou déstabiliser la gateway
- un plugin natif malveillant équivaut à une exécution de code arbitraire dans
  le processus OpenClaw

Les bundles compatibles sont plus sûrs par défaut parce qu’OpenClaw les traite actuellement
comme des packs de métadonnées/de contenu. Dans les versions actuelles, cela signifie surtout des
Skills bundled.

Utilisez des listes d’autorisation et des chemins explicites d’installation/chargement pour les plugins non bundled. Considérez
les plugins d’espace de travail comme du code de développement, pas comme des valeurs par défaut de production.

Pour les noms de packages bundled de l’espace de travail, gardez l’id du plugin ancré dans le nom npm :
`@openclaw/<id>` par défaut, ou un suffixe typé approuvé comme
`-provider`, `-plugin`, `-speech`, `-sandbox` ou `-media-understanding` quand
le package expose intentionnellement un rôle de plugin plus étroit.

Note de confiance importante :

- `plugins.allow` fait confiance aux **ids de plugin**, pas à la provenance de la source.
- Un plugin d’espace de travail avec le même id qu’un plugin bundled masque
  intentionnellement la copie bundled lorsque ce plugin d’espace de travail est activé/autorisé.
- C’est normal et utile pour le développement local, les tests de correctifs et les hotfixes.

## Limite d’export

OpenClaw exporte des capacités, pas des commodités d’implémentation.

Conservez public l’enregistrement des capacités. Réduisez les exports helper hors contrat :

- sous-chemins helpers spécifiques à des plugins bundled
- sous-chemins de plomberie d’exécution non destinés à être une API publique
- helpers pratiques spécifiques à un fournisseur
- helpers de configuration/d’onboarding qui sont des détails d’implémentation

Certains sous-chemins helpers de plugins bundled restent encore dans la table d’exports générée du SDK
pour des raisons de compatibilité et de maintenance des plugins bundled. Exemples actuels :
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` et plusieurs coutures `plugin-sdk/matrix*`. Considérez-les comme
des exports réservés de détail d’implémentation, et non comme le modèle SDK recommandé pour
les nouveaux plugins tiers.

## Pipeline de chargement

Au démarrage, OpenClaw fait globalement ceci :

1. découvre les racines candidates des plugins
2. lit les manifests natifs ou les manifests de bundles compatibles et les métadonnées de package
3. rejette les candidats non sûrs
4. normalise la configuration des plugins (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. décide de l’activation pour chaque candidat
6. charge les modules natifs activés via jiti
7. appelle les hooks natifs `register(api)` (ou `activate(api)` — un alias legacy) et collecte les enregistrements dans le registre des plugins
8. expose le registre aux surfaces de commandes/d’exécution

<Note>
`activate` est un alias legacy de `register` — le chargeur résout celui qui est présent (`def.register ?? def.activate`) et l’appelle au même point. Tous les plugins bundled utilisent `register` ; préférez `register` pour les nouveaux plugins.
</Note>

Les garde-fous de sécurité s’appliquent **avant** l’exécution du runtime. Les candidats sont bloqués
lorsque l’entrée s’échappe de la racine du plugin, que le chemin est accessible en écriture par tous, ou que la propriété du chemin semble suspecte pour les plugins non bundled.

### Comportement manifest-first

Le manifest est la source de vérité du plan de contrôle. OpenClaw l’utilise pour :

- identifier le plugin
- découvrir les canaux/Skills/schéma de configuration déclarés ou les capacités de bundle
- valider `plugins.entries.<id>.config`
- enrichir les libellés/placeholders de l’interface Control UI
- afficher les métadonnées d’installation/de catalogue
- préserver des descripteurs légers d’activation et de configuration sans charger le runtime du plugin

Pour les plugins natifs, le module runtime est la partie plan de données. Il enregistre le
comportement réel comme les hooks, outils, commandes ou flux de fournisseur.

Les blocs optionnels `activation` et `setup` du manifest restent dans le plan de contrôle.
Ce sont uniquement des descripteurs de métadonnées pour la planification d’activation et la découverte de configuration ;
ils ne remplacent ni l’enregistrement au runtime, ni `register(...)`, ni `setupEntry`.

La découverte de configuration préfère désormais les ids appartenant aux descripteurs comme
`setup.providers` et `setup.cliBackends` afin de restreindre les plugins candidats avant de revenir à
`setup-api` pour les plugins qui ont encore besoin de hooks runtime au moment de la configuration. Si plus
d’un plugin découvert revendique le même id normalisé de fournisseur de configuration ou de backend CLI,
la recherche de configuration refuse ce propriétaire ambigu au lieu de s’appuyer sur l’ordre de découverte.

### Ce que le chargeur met en cache

OpenClaw conserve de courts caches en processus pour :

- les résultats de découverte
- les données du registre de manifests
- les registres de plugins chargés

Ces caches réduisent les pointes de démarrage et le coût des commandes répétées. Il faut les considérer
comme des caches de performance de courte durée, pas comme une persistance.

Note de performance :

- Définissez `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` ou
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` pour désactiver ces caches.
- Ajustez les fenêtres de cache avec `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` et
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Modèle de registre

Les plugins chargés ne modifient pas directement des globales arbitraires du cœur. Ils s’enregistrent dans un
registre central des plugins.

Le registre suit :

- les enregistrements de plugin (identité, source, origine, statut, diagnostics)
- les outils
- les hooks legacy et les hooks typés
- les canaux
- les providers
- les gestionnaires RPC Gateway
- les routes HTTP
- les registrars CLI
- les services en arrière-plan
- les commandes appartenant au plugin

Les fonctionnalités du cœur lisent ensuite ce registre au lieu de parler directement aux modules de plugin.
Cela garde le chargement à sens unique :

- module de plugin -> enregistrement dans le registre
- runtime du cœur -> consommation du registre

Cette séparation est importante pour la maintenabilité. Elle signifie que la plupart des surfaces du cœur
n’ont besoin que d’un seul point d’intégration : « lire le registre », et non « traiter spécialement chaque module
de plugin ».

## Callbacks de liaison de conversation

Les plugins qui lient une conversation peuvent réagir lorsqu’une approbation est résolue.

Utilisez `api.onConversationBindingResolved(...)` pour recevoir un callback après qu’une requête de liaison
a été approuvée ou refusée :

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
- `binding` : la liaison résolue pour les requêtes approuvées
- `request` : le résumé de la requête d’origine, l’indication de détachement, l’id de l’expéditeur et
  les métadonnées de conversation

Ce callback sert uniquement de notification. Il ne modifie pas qui est autorisé à lier une
conversation, et il s’exécute une fois le traitement d’approbation du cœur terminé.

## Hooks d’exécution des fournisseurs

Les plugins fournisseurs ont désormais deux couches :

- métadonnées de manifest : `providerAuthEnvVars` pour une recherche légère de l’authentification fournisseur via variables d’environnement
  avant le chargement du runtime, `providerAuthAliases` pour les variantes de fournisseur qui partagent
  l’authentification, `channelEnvVars` pour une recherche légère de l’environnement/de la configuration du canal avant le chargement
  du runtime, ainsi que `providerAuthChoices` pour des libellés légers d’onboarding/de choix d’authentification et
  des métadonnées d’options CLI avant le chargement du runtime
- hooks au moment de la configuration : `catalog` / ancien `discovery` ainsi que `applyConfigDefaults`
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

OpenClaw possède toujours la boucle d’agent générique, le failover, la gestion des transcriptions et
la politique des outils. Ces hooks constituent la surface d’extension pour le comportement spécifique au fournisseur sans
avoir besoin d’un transport d’inférence entièrement personnalisé.

Utilisez le `providerAuthEnvVars` du manifest lorsque le fournisseur dispose d’identifiants basés sur des variables d’environnement
que les chemins génériques d’authentification/statut/sélecteur de modèles doivent voir sans charger le runtime du plugin.
Utilisez `providerAuthAliases` du manifest lorsqu’un id de provider doit réutiliser les variables d’environnement,
les profils d’authentification, l’authentification adossée à la configuration et le choix d’onboarding par clé API d’un autre id de provider.
Utilisez `providerAuthChoices` du manifest lorsque les surfaces CLI d’onboarding/de choix d’authentification
doivent connaître l’id de choix du fournisseur, les libellés de groupe et un câblage simple d’authentification à une seule option
sans charger le runtime du fournisseur. Conservez `envVars` dans le runtime du fournisseur pour les indications destinées aux opérateurs,
comme les libellés d’onboarding ou les variables de configuration de client-id/client-secret OAuth.

Utilisez `channelEnvVars` du manifest lorsqu’un canal a une authentification ou une configuration pilotée par environnement que
le fallback générique de shell-env, les vérifications de configuration/statut ou les invites de configuration doivent voir
sans charger le runtime du canal.

### Ordre et usage des hooks

Pour les plugins de modèle/fournisseur, OpenClaw appelle les hooks dans cet ordre approximatif.
La colonne « Quand l’utiliser » est le guide rapide de décision.

| #   | Hook                              | Ce qu’il fait                                                                                                  | Quand l’utiliser                                                                                                                            |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publie la configuration du provider dans `models.providers` pendant la génération de `models.json`            | Le provider possède un catalogue ou des valeurs par défaut d’URL de base                                                                    |
| 2   | `applyConfigDefaults`             | Applique les valeurs par défaut globales appartenant au provider pendant la matérialisation de la configuration | Les valeurs par défaut dépendent du mode d’authentification, de l’environnement ou de la sémantique de famille de modèles du provider      |
| --  | _(built-in model lookup)_         | OpenClaw essaie d’abord le chemin normal registre/catalogue                                                    | _(pas un hook de plugin)_                                                                                                                   |
| 3   | `normalizeModelId`                | Normalise les alias legacy ou preview d’id de modèle avant la recherche                                        | Le provider possède le nettoyage des alias avant la résolution canonique du modèle                                                          |
| 4   | `normalizeTransport`              | Normalise `api` / `baseUrl` d’une famille de providers avant l’assemblage générique du modèle                 | Le provider possède le nettoyage du transport pour des ids de provider personnalisés dans la même famille de transport                     |
| 5   | `normalizeConfig`                 | Normalise `models.providers.<id>` avant la résolution du runtime/du provider                                   | Le provider a besoin d’un nettoyage de configuration qui doit vivre avec le plugin ; les helpers bundled de la famille Google servent aussi de filet de sécurité pour les entrées de configuration Google prises en charge |
| 6   | `applyNativeStreamingUsageCompat` | Applique des réécritures de compatibilité d’usage du streaming natif aux providers de configuration            | Le provider a besoin de correctifs de métadonnées d’usage du streaming natif pilotés par les points de terminaison                         |
| 7   | `resolveConfigApiKey`             | Résout l’authentification par marqueur d’environnement pour les providers de configuration avant le chargement de l’authentification runtime | Le provider possède sa propre résolution de clé API par marqueur d’environnement ; `amazon-bedrock` a aussi ici un résolveur intégré de marqueur d’environnement AWS |
| 8   | `resolveSyntheticAuth`            | Expose une authentification locale/autohébergée ou adossée à la configuration sans persister de texte en clair | Le provider peut fonctionner avec un marqueur d’identifiant synthétique/local                                                               |
| 9   | `resolveExternalAuthProfiles`     | Superpose des profils d’authentification externes appartenant au provider ; la valeur par défaut de `persistence` est `runtime-only` pour les identifiants appartenant à la CLI/l’application | Le provider réutilise des identifiants d’authentification externes sans persister de jetons d’actualisation copiés                         |
| 10  | `shouldDeferSyntheticProfileAuth` | Fait passer les placeholders synthétiques stockés derrière l’authentification adossée à l’environnement/à la configuration | Le provider stocke des profils placeholders synthétiques qui ne doivent pas être prioritaires                                               |
| 11  | `resolveDynamicModel`             | Fallback synchrone pour des ids de modèle appartenant au provider qui ne sont pas encore dans le registre local | Le provider accepte des ids de modèle arbitraires en amont                                                                                  |
| 12  | `prepareDynamicModel`             | Préparation asynchrone, puis `resolveDynamicModel` s’exécute de nouveau                                        | Le provider a besoin de métadonnées réseau avant de résoudre des ids inconnus                                                               |
| 13  | `normalizeResolvedModel`          | Réécriture finale avant que l’embedded runner n’utilise le modèle résolu                                       | Le provider a besoin de réécritures de transport tout en utilisant un transport du cœur                                                    |
| 14  | `contributeResolvedModelCompat`   | Contribue des indicateurs de compatibilité pour des modèles fournisseurs derrière un autre transport compatible | Le provider reconnaît ses propres modèles sur des transports proxy sans prendre en charge le provider                                      |
| 15  | `capabilities`                    | Métadonnées de transcription/d’outillage appartenant au provider utilisées par la logique partagée du cœur     | Le provider a besoin de particularités de transcription/de famille de provider                                                              |
| 16  | `normalizeToolSchemas`            | Normalise les schémas d’outils avant que l’embedded runner ne les voie                                          | Le provider a besoin d’un nettoyage de schéma pour une famille de transports                                                                |
| 17  | `inspectToolSchemas`              | Expose des diagnostics de schéma appartenant au provider après normalisation                                    | Le provider veut des avertissements de mots-clés sans apprendre au cœur des règles spécifiques au provider                                 |
| 18  | `resolveReasoningOutputMode`      | Sélectionne le contrat de sortie de raisonnement natif ou balisé                                                | Le provider a besoin d’une sortie raisonnement/finale balisée plutôt que de champs natifs                                                  |
| 19  | `prepareExtraParams`              | Normalisation des paramètres de requête avant les wrappers génériques d’options de flux                        | Le provider a besoin de paramètres de requête par défaut ou d’un nettoyage de paramètres propre au provider                                |
| 20  | `createStreamFn`                  | Remplace entièrement le chemin de flux normal par un transport personnalisé                                     | Le provider a besoin d’un protocole filaire personnalisé, pas seulement d’un wrapper                                                       |
| 21  | `wrapStreamFn`                    | Wrapper de flux après application des wrappers génériques                                                       | Le provider a besoin de wrappers de compatibilité pour en-têtes/corps de requête/modèle sans transport personnalisé                        |
| 22  | `resolveTransportTurnState`       | Attache des en-têtes ou métadonnées natives par tour de transport                                               | Le provider veut que les transports génériques envoient une identité de tour native au provider                                            |
| 23  | `resolveWebSocketSessionPolicy`   | Attache des en-têtes WebSocket natifs ou une politique de refroidissement de session                            | Le provider veut que les transports WebSocket génériques ajustent les en-têtes de session ou la politique de fallback                     |
| 24  | `formatApiKey`                    | Formateur de profil d’authentification : le profil stocké devient la chaîne `apiKey` du runtime                | Le provider stocke des métadonnées d’authentification supplémentaires et a besoin d’une forme de jeton runtime personnalisée               |
| 25  | `refreshOAuth`                    | Remplacement de l’actualisation OAuth pour des points de terminaison d’actualisation personnalisés ou une politique d’échec d’actualisation | Le provider ne correspond pas aux actualisateurs partagés `pi-ai`                                                                           |
| 26  | `buildAuthDoctorHint`             | Indice de réparation ajouté quand l’actualisation OAuth échoue                                                  | Le provider a besoin de consignes de réparation d’authentification qui lui appartiennent après un échec d’actualisation                    |
| 27  | `matchesContextOverflowError`     | Détecteur d’erreur de débordement de fenêtre de contexte appartenant au provider                                | Le provider a des erreurs brutes de débordement que les heuristiques génériques ne verraient pas                                           |
| 28  | `classifyFailoverReason`          | Classification de raison de failover appartenant au provider                                                    | Le provider peut mapper des erreurs brutes d’API/de transport vers limite de débit/surcharge/etc.                                          |
| 29  | `isCacheTtlEligible`              | Politique de cache de prompt pour les providers proxy/backhaul                                                  | Le provider a besoin d’un filtrage TTL de cache spécifique au proxy                                                                         |
| 30  | `buildMissingAuthMessage`         | Remplacement du message générique de récupération d’authentification manquante                                  | Le provider a besoin d’un indice de récupération d’authentification manquante spécifique au provider                                       |
| 31  | `suppressBuiltInModel`            | Suppression de modèles amont obsolètes plus indice d’erreur destiné à l’utilisateur en option                  | Le provider a besoin de masquer des lignes amont obsolètes ou de les remplacer par un indice fournisseur                                   |
| 32  | `augmentModelCatalog`             | Lignes de catalogue synthétiques/finales ajoutées après la découverte                                           | Le provider a besoin de lignes synthétiques de compatibilité future dans `models list` et les sélecteurs                                   |
| 33  | `isBinaryThinking`                | Bascule de raisonnement marche/arrêt pour les providers à raisonnement binaire                                  | Le provider n’expose qu’un raisonnement binaire activé/désactivé                                                                            |
| 34  | `supportsXHighThinking`           | Prise en charge du raisonnement `xhigh` pour certains modèles                                                   | Le provider veut `xhigh` seulement sur un sous-ensemble de modèles                                                                          |
| 35  | `resolveDefaultThinkingLevel`     | Niveau `/think` par défaut pour une famille de modèles spécifique                                               | Le provider possède la politique `/think` par défaut pour une famille de modèles                                                            |
| 36  | `isModernModelRef`                | Détecteur de modèle moderne pour les filtres de profils live et la sélection smoke                             | Le provider possède la correspondance du modèle préféré pour live/smoke                                                                     |
| 37  | `prepareRuntimeAuth`              | Échange un identifiant configuré contre le jeton/la clé runtime réel juste avant l’inférence                   | Le provider a besoin d’un échange de jeton ou d’un identifiant de requête de courte durée                                                  |
| 38  | `resolveUsageAuth`                | Résout les identifiants d’usage/de facturation pour `/usage` et les surfaces de statut associées             | Le provider a besoin d’une analyse personnalisée du jeton d’usage/quota ou d’un identifiant d’usage différent                              |
| 39  | `fetchUsageSnapshot`              | Récupère et normalise des instantanés d’usage/de quota spécifiques au provider une fois l’authentification résolue | Le provider a besoin d’un point de terminaison d’usage spécifique au provider ou d’un analyseur de charge utile                            |
| 40  | `createEmbeddingProvider`         | Construit un adaptateur d’embedding appartenant au provider pour la mémoire/la recherche                       | Le comportement d’embedding mémoire appartient au plugin provider                                                                           |
| 41  | `buildReplayPolicy`               | Renvoie une politique de replay qui contrôle la gestion des transcriptions pour le provider                    | Le provider a besoin d’une politique de transcription personnalisée (par exemple, suppression des blocs de raisonnement)                   |
| 42  | `sanitizeReplayHistory`           | Réécrit l’historique de replay après le nettoyage générique des transcriptions                                 | Le provider a besoin de réécritures de replay spécifiques au provider au-delà des helpers partagés de compaction                           |
| 43  | `validateReplayTurns`             | Validation finale ou remaniement des tours de replay avant l’embedded runner                                   | Le transport du provider a besoin d’une validation de tour plus stricte après l’assainissement générique                                   |
| 44  | `onModelSelected`                 | Exécute des effets de bord post-sélection appartenant au provider                                              | Le provider a besoin de télémétrie ou d’un état appartenant au provider lorsqu’un modèle devient actif                                     |

`normalizeModelId`, `normalizeTransport` et `normalizeConfig` vérifient d’abord le
plugin fournisseur correspondant, puis passent aux autres plugins fournisseurs capables d’utiliser des hooks
jusqu’à ce que l’un d’eux modifie réellement l’id de modèle ou le transport/la configuration. Cela permet aux
shims de compatibilité de provider/alias de continuer à fonctionner sans obliger l’appelant à savoir
quel plugin bundled possède la réécriture. Si aucun hook de provider ne réécrit une entrée de configuration
Google-family prise en charge, le normaliseur de configuration Google bundled applique quand même ce nettoyage de compatibilité.

Si le provider a besoin d’un protocole filaire entièrement personnalisé ou d’un exécuteur de requêtes personnalisé,
il s’agit d’une autre classe d’extension. Ces hooks sont destinés au comportement fournisseur
qui s’exécute toujours dans la boucle d’inférence normale d’OpenClaw.

### Exemple de provider

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
  et `wrapStreamFn` parce qu’il possède la compatibilité future de Claude 4.6,
  les indications de famille de provider, les conseils de réparation d’authentification, l’intégration
  au point de terminaison d’usage, l’éligibilité au cache de prompt, les valeurs par défaut de configuration tenant compte de l’authentification, la
  politique de pensée par défaut/adaptative de Claude, ainsi que le façonnage de flux spécifique à Anthropic pour
  les en-têtes bêta, `/fast` / `serviceTier`, et `context1m`.
- Les helpers de flux spécifiques à Claude d’Anthropic restent pour l’instant dans la propre couture publique
  `api.ts` / `contract-api.ts` du plugin bundled. Cette surface de package
  exporte `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`, ainsi que les builders de wrapper Anthropic
  de niveau inférieur, au lieu d’élargir le SDK générique autour des règles d’en-têtes bêta d’un seul
  provider.
- OpenAI utilise `resolveDynamicModel`, `normalizeResolvedModel`, et
  `capabilities` ainsi que `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `supportsXHighThinking`, et `isModernModelRef`
  parce qu’il possède la compatibilité future GPT-5.4, la normalisation directe OpenAI
  `openai-completions` -> `openai-responses`, les indications d’authentification compatibles Codex,
  la suppression de Spark, les lignes de liste OpenAI synthétiques, et la politique GPT-5 de thinking /
  modèle live ; la famille de flux `openai-responses-defaults` possède les wrappers partagés natifs OpenAI Responses pour les en-têtes d’attribution,
  `/fast`/`serviceTier`, la verbosité du texte, la recherche web native Codex,
  le façonnage de charge utile de compatibilité reasoning, et la gestion du contexte Responses.
- OpenRouter utilise `catalog` ainsi que `resolveDynamicModel` et
  `prepareDynamicModel` parce que le provider est en pass-through et peut exposer de nouveaux
  ids de modèle avant la mise à jour du catalogue statique d’OpenClaw ; il utilise aussi
  `capabilities`, `wrapStreamFn`, et `isCacheTtlEligible` pour garder hors du cœur
  les en-têtes de requête spécifiques au provider, les métadonnées de routage, les correctifs de reasoning et la politique
  de cache de prompt. Sa politique de replay provient de la famille
  `passthrough-gemini`, tandis que la famille de flux `openrouter-thinking`
  possède l’injection proxy de reasoning ainsi que les sauts de modèles non pris en charge / `auto`.
- GitHub Copilot utilise `catalog`, `auth`, `resolveDynamicModel`, et
  `capabilities` ainsi que `prepareRuntimeAuth` et `fetchUsageSnapshot` parce qu’il
  a besoin d’une connexion par appareil appartenant au provider, d’un comportement de fallback de modèle, de particularités de transcription Claude,
  d’un échange de jeton GitHub -> jeton Copilot, et d’un point de terminaison d’usage appartenant au provider.
- OpenAI Codex utilise `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth`, et `augmentModelCatalog` ainsi que
  `prepareExtraParams`, `resolveUsageAuth`, et `fetchUsageSnapshot` parce qu’il
  s’exécute encore sur les transports OpenAI du cœur mais possède sa normalisation
  de transport/d’URL de base, sa politique de fallback d’actualisation OAuth, le choix de transport par défaut,
  les lignes synthétiques du catalogue Codex, et l’intégration au point de terminaison d’usage ChatGPT ; il
  partage la même famille de flux `openai-responses-defaults` qu’OpenAI direct.
- Google AI Studio et Gemini CLI OAuth utilisent `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn`, et `isModernModelRef` parce que la
  famille de replay `google-gemini` possède le fallback de compatibilité future Gemini 3.1,
  la validation native de replay Gemini, l’assainissement du replay de bootstrap, le mode
  de sortie reasoning balisé, et la correspondance de modèle moderne, tandis que la
  famille de flux `google-thinking` possède la normalisation de charge utile thinking de Gemini ;
  Gemini CLI OAuth utilise aussi `formatApiKey`, `resolveUsageAuth`, et
  `fetchUsageSnapshot` pour le formatage des jetons, l’analyse des jetons et le câblage
  du point de terminaison de quota.
- Anthropic Vertex utilise `buildReplayPolicy` via la
  famille de replay `anthropic-by-model` afin que le nettoyage de replay spécifique à Claude reste
  limité aux ids Claude au lieu de tous les transports `anthropic-messages`.
- Amazon Bedrock utilise `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason`, et `resolveDefaultThinkingLevel` parce qu’il possède
  la classification spécifique à Bedrock des erreurs de limitation, d’indisponibilité et de débordement de contexte
  pour le trafic Anthropic-sur-Bedrock ; sa politique de replay partage toutefois encore la même
  garde `anthropic-by-model` réservée à Claude.
- OpenRouter, Kilocode, Opencode, et Opencode Go utilisent `buildReplayPolicy`
  via la famille de replay `passthrough-gemini` parce qu’ils proxifient les modèles Gemini
  à travers des transports compatibles OpenAI et ont besoin d’un assainissement de
  signature de pensée Gemini sans validation native du replay Gemini ni réécritures
  de bootstrap.
- MiniMax utilise `buildReplayPolicy` via la
  famille de replay `hybrid-anthropic-openai` parce qu’un provider possède à la fois des sémantiques
  Anthropic-message et compatibles OpenAI ; cela conserve
  l’abandon des blocs thinking réservé à Claude côté Anthropic tout en rétablissant le mode
  de sortie reasoning en natif, et la famille de flux `minimax-fast-mode` possède
  les réécritures de modèles fast-mode sur le chemin de flux partagé.
- Moonshot utilise `catalog` ainsi que `wrapStreamFn` parce qu’il utilise encore le transport
  OpenAI partagé mais a besoin d’une normalisation de charge utile thinking appartenant au provider ; la
  famille de flux `moonshot-thinking` mappe la configuration plus l’état `/think` sur sa
  charge utile native binaire thinking.
- Kilocode utilise `catalog`, `capabilities`, `wrapStreamFn`, et
  `isCacheTtlEligible` parce qu’il a besoin d’en-têtes de requête appartenant au provider,
  d’une normalisation de charge utile reasoning, d’indications de transcription Gemini, et d’un filtrage TTL
  du cache Anthropic ; la famille de flux `kilocode-thinking` conserve l’injection Kilo thinking
  sur le chemin de flux proxy partagé tout en ignorant `kilo/auto` et
  d’autres ids de modèle proxy qui ne prennent pas en charge les charges utiles de reasoning explicites.
- Z.AI utilise `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `isBinaryThinking`, `isModernModelRef`,
  `resolveUsageAuth`, et `fetchUsageSnapshot` parce qu’il possède le fallback GLM-5,
  les valeurs par défaut `tool_stream`, l’expérience utilisateur de thinking binaire, la correspondance de modèle moderne, ainsi que
  l’authentification d’usage et la récupération de quota ; la famille de flux `tool-stream-default-on` garde
  le wrapper `tool_stream` activé par défaut hors du code glue manuscrit par provider.
- xAI utilise `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel`, et `isModernModelRef`
  parce qu’il possède la normalisation native du transport xAI Responses, les réécritures d’alias Grok fast-mode,
  la valeur par défaut `tool_stream`, le nettoyage strict-tool / charge utile reasoning,
  la réutilisation d’authentification de fallback pour les outils appartenant au plugin, la résolution de modèle Grok à compatibilité future,
  et des correctifs de compatibilité appartenant au provider tels que le profil de schéma d’outil xAI,
  les mots-clés de schéma non pris en charge, `web_search` natif, et le décodage d’arguments
  d’appels d’outils en entités HTML.
- Mistral, OpenCode Zen, et OpenCode Go utilisent uniquement `capabilities` pour garder
  hors du cœur les particularités de transcription/d’outillage.
- Les providers bundled à catalogue uniquement, comme `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway`, et `volcengine`, utilisent
  uniquement `catalog`.
- Qwen utilise `catalog` pour son provider de texte ainsi que les enregistrements partagés de compréhension des médias et de génération de vidéo pour ses surfaces multimodales.
- MiniMax et Xiaomi utilisent `catalog` ainsi que des hooks d’usage parce que leur comportement `/usage`
  appartient au plugin, même si l’inférence passe encore par les transports partagés.

## Helpers d’exécution

Les plugins peuvent accéder à certains helpers du cœur via `api.runtime`. Pour la TTS :

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

- `textToSpeech` renvoie la charge utile normale de sortie TTS du cœur pour les surfaces fichier/note vocale.
- Utilise la configuration `messages.tts` du cœur et la sélection du provider.
- Renvoie un tampon audio PCM + la fréquence d’échantillonnage. Les plugins doivent rééchantillonner/encoder pour les providers.
- `listVoices` est facultatif selon le provider. Utilisez-le pour les sélecteurs de voix appartenant au fournisseur ou les flux de configuration.
- Les listes de voix peuvent inclure des métadonnées plus riches, comme les paramètres régionaux, le genre et les tags de personnalité pour les sélecteurs sensibles au provider.
- OpenAI et ElevenLabs prennent aujourd’hui en charge la téléphonie. Microsoft non.

Les plugins peuvent aussi enregistrer des fournisseurs vocaux via `api.registerSpeechProvider(...)`.

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

- Conservez dans le cœur la politique TTS, le fallback et la livraison des réponses.
- Utilisez les fournisseurs vocaux pour le comportement de synthèse appartenant au fournisseur.
- L’entrée legacy Microsoft `edge` est normalisée vers l’id de provider `microsoft`.
- Le modèle de propriété préféré est orienté entreprise : un plugin fournisseur peut posséder
  les providers de texte, de voix, d’image et de futurs médias à mesure qu’OpenClaw ajoute ces
  contrats de capacité.

Pour la compréhension des images/de l’audio/de la vidéo, les plugins enregistrent un
provider typé unique de compréhension des médias plutôt qu’un sac clé/valeur générique :

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

- Conservez dans le cœur l’orchestration, le fallback, la configuration et le câblage des canaux.
- Conservez le comportement fournisseur dans le plugin provider.
- L’extension additive doit rester typée : nouvelles méthodes facultatives, nouveaux champs de résultat
  facultatifs, nouvelles capacités facultatives.
- La génération de vidéo suit déjà le même modèle :
  - le cœur possède le contrat de capacité et le helper d’exécution
  - les plugins fournisseurs enregistrent `api.registerVideoGenerationProvider(...)`
  - les plugins de fonctionnalité/canal consomment `api.runtime.videoGeneration.*`

Pour les helpers d’exécution media-understanding, les plugins peuvent appeler :

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

Pour la transcription audio, les plugins peuvent utiliser soit le runtime
media-understanding, soit l’ancien alias STT :

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Remarques :

- `api.runtime.mediaUnderstanding.*` est la surface partagée privilégiée pour la
  compréhension des images/de l’audio/de la vidéo.
- Utilise la configuration audio media-understanding du cœur (`tools.media.audio`) et l’ordre de fallback des providers.
- Renvoie `{ text: undefined }` lorsqu’aucune sortie de transcription n’est produite (par exemple entrée ignorée/non prise en charge).
- `api.runtime.stt.transcribeAudioFile(...)` reste disponible comme alias de compatibilité.

Les plugins peuvent aussi lancer des exécutions de sous-agent en arrière-plan via `api.runtime.subagent` :

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

- `provider` et `model` sont des remplacements facultatifs par exécution, pas des changements de session persistants.
- OpenClaw ne respecte ces champs de remplacement que pour les appelants de confiance.
- Pour les exécutions de fallback appartenant au plugin, les opérateurs doivent activer explicitement `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Utilisez `plugins.entries.<id>.subagent.allowedModels` pour limiter les plugins de confiance à des cibles canoniques `provider/model` spécifiques, ou `"*"` pour autoriser explicitement toute cible.
- Les exécutions de sous-agent de plugins non fiables fonctionnent toujours, mais les demandes de remplacement sont rejetées au lieu de retomber silencieusement sur un fallback.

Pour la recherche web, les plugins peuvent consommer le helper d’exécution partagé au lieu
d’accéder directement au câblage de l’outil de l’agent :

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

Les plugins peuvent aussi enregistrer des providers de recherche web via
`api.registerWebSearchProvider(...)`.

Remarques :

- Conservez dans le cœur la sélection du provider, la résolution des identifiants et la sémantique partagée des requêtes.
- Utilisez les providers de recherche web pour les transports de recherche spécifiques à un fournisseur.
- `api.runtime.webSearch.*` est la surface partagée privilégiée pour les plugins de fonctionnalité/canal qui ont besoin d’un comportement de recherche sans dépendre du wrapper d’outil de l’agent.

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

- `generate(...)` : génère une image en utilisant la chaîne de providers de génération d’images configurée.
- `listProviders(...)` : liste les providers de génération d’images disponibles et leurs capacités.

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

- `path` : chemin de route sous le serveur HTTP de la gateway.
- `auth` : obligatoire. Utilisez `"gateway"` pour exiger l’authentification normale de la gateway, ou `"plugin"` pour une authentification/validation de webhook gérée par le plugin.
- `match` : facultatif. `"exact"` (par défaut) ou `"prefix"`.
- `replaceExisting` : facultatif. Permet au même plugin de remplacer son propre enregistrement de route existant.
- `handler` : renvoyez `true` lorsque la route a traité la requête.

Remarques :

- `api.registerHttpHandler(...)` a été supprimé et provoquera une erreur de chargement du plugin. Utilisez `api.registerHttpRoute(...)` à la place.
- Les routes de plugin doivent déclarer explicitement `auth`.
- Les conflits exacts `path + match` sont rejetés sauf si `replaceExisting: true`, et un plugin ne peut pas remplacer la route d’un autre plugin.
- Les routes qui se chevauchent avec des niveaux `auth` différents sont rejetées. Conservez les chaînes de fallback `exact`/`prefix` uniquement au même niveau d’authentification.
- Les routes `auth: "plugin"` ne reçoivent **pas** automatiquement les portées runtime opérateur. Elles sont destinées aux webhooks/à la validation de signature gérés par le plugin, pas aux appels de helpers Gateway privilégiés.
- Les routes `auth: "gateway"` s’exécutent dans une portée runtime de requête Gateway, mais cette portée est volontairement prudente :
  - l’authentification bearer par secret partagé (`gateway.auth.mode = "token"` / `"password"`) maintient les portées runtime des routes de plugin épinglées à `operator.write`, même si l’appelant envoie `x-openclaw-scopes`
  - les modes HTTP fiables porteurs d’identité (par exemple `trusted-proxy` ou `gateway.auth.mode = "none"` sur une entrée privée) ne respectent `x-openclaw-scopes` que lorsque l’en-tête est explicitement présent
  - si `x-openclaw-scopes` est absent sur ces requêtes de route de plugin porteuses d’identité, la portée runtime retombe sur `operator.write`
- Règle pratique : ne supposez pas qu’une route de plugin authentifiée par gateway constitue implicitement une surface d’administration. Si votre route a besoin d’un comportement réservé à l’administration, exigez un mode d’authentification porteur d’identité et documentez le contrat explicite de l’en-tête `x-openclaw-scopes`.

## Chemins d’import du Plugin SDK

Utilisez les sous-chemins du SDK au lieu de l’import monolithique `openclaw/plugin-sdk` lorsque
vous développez des plugins :

- `openclaw/plugin-sdk/plugin-entry` pour les primitives d’enregistrement de plugin.
- `openclaw/plugin-sdk/core` pour le contrat générique partagé orienté plugin.
- `openclaw/plugin-sdk/config-schema` pour l’export du schéma Zod racine `openclaw.json`
  (`OpenClawSchema`).
- Primitives de canal stables comme `openclaw/plugin-sdk/channel-setup`,
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
  `openclaw/plugin-sdk/secret-input`, et
  `openclaw/plugin-sdk/webhook-ingress` pour le câblage partagé de configuration/authentification/réponse/webhook.
  `channel-inbound` est l’emplacement partagé pour l’anti-rebond, la correspondance des mentions,
  les helpers de politique de mention entrante, le formatage d’enveloppe et les helpers de contexte
  d’enveloppe entrante.
  `channel-setup` est la couture étroite de configuration à installation facultative.
  `setup-runtime` est la surface de configuration sûre à l’exécution utilisée par `setupEntry` /
  le démarrage différé, y compris les adaptateurs de patch de configuration sûrs à l’import.
  `setup-adapter-runtime` est la couture d’adaptateur de configuration de compte sensible à l’environnement.
  `setup-tools` est la petite couture d’helpers CLI/archive/docs (`formatCliCommand`,
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`).
- Sous-chemins de domaine comme `openclaw/plugin-sdk/channel-config-helpers`,
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
  `openclaw/plugin-sdk/runtime-store`, et
  `openclaw/plugin-sdk/directory-runtime` pour les helpers partagés d’exécution/de configuration.
  `telegram-command-config` est la couture publique étroite pour la normalisation/validation des commandes personnalisées Telegram et reste disponible même si la surface de contrat Telegram bundled est temporairement indisponible.
  `text-runtime` est la couture partagée texte/markdown/journalisation, y compris
  la suppression du texte visible par l’assistant, les helpers de rendu/segmentation markdown, les helpers de rédaction,
  les helpers de balises de directive, et les utilitaires de texte sûr.
- Les coutures de canal spécifiques à l’approbation devraient préférer un seul contrat `approvalCapability`
  sur le plugin. Le cœur lit ensuite l’authentification d’approbation, la livraison, le rendu,
  le routage natif et le comportement de gestionnaire natif paresseux à travers cette capacité unique
  au lieu de mélanger le comportement d’approbation dans des champs de plugin sans rapport.
- `openclaw/plugin-sdk/channel-runtime` est obsolète et ne reste présent que comme
  shim de compatibilité pour les anciens plugins. Le nouveau code doit importer les primitives génériques plus étroites à la place, et le code du dépôt ne doit pas ajouter de nouveaux imports de ce shim.
- Les composants internes des extensions bundled restent privés. Les plugins externes doivent utiliser uniquement les sous-chemins `openclaw/plugin-sdk/*`. Le code cœur/de test d’OpenClaw peut utiliser les points d’entrée publics du dépôt sous la racine d’un package de plugin, comme `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js`, et des fichiers à portée étroite comme
  `login-qr-api.js`. N’importez jamais `src/*` d’un package de plugin depuis le cœur ou depuis une autre extension.
- Répartition des points d’entrée du dépôt :
  `<plugin-package-root>/api.js` est le barrel d’helpers/types,
  `<plugin-package-root>/runtime-api.js` est le barrel réservé au runtime,
  `<plugin-package-root>/index.js` est le point d’entrée du plugin bundled,
  et `<plugin-package-root>/setup-entry.js` est le point d’entrée du plugin de configuration.
- Exemples actuels de providers bundled :
  - Anthropic utilise `api.js` / `contract-api.js` pour des helpers de flux Claude tels
    que `wrapAnthropicProviderStream`, les helpers d’en-têtes bêta et l’analyse de `service_tier`.
  - OpenAI utilise `api.js` pour les builders de provider, les helpers de modèle par défaut, et
    les builders de provider temps réel.
  - OpenRouter utilise `api.js` pour son builder de provider ainsi que des helpers d’onboarding/de configuration,
    tandis que `register.runtime.js` peut encore réexporter les helpers génériques
    `plugin-sdk/provider-stream` pour un usage local au dépôt.
- Les points d’entrée publics chargés via façade préfèrent l’instantané de configuration active du runtime
  lorsqu’il existe, puis retombent sur le fichier de configuration résolu sur disque quand
  OpenClaw ne sert pas encore d’instantané runtime.
- Les primitives génériques partagées restent le contrat SDK public privilégié. Un petit ensemble réservé de coutures helper encore marquées par des canaux bundled existe toujours. Considérez-les comme
  des coutures de maintenance/compatibilité bundled, et non comme de nouvelles cibles d’import tierces ; les nouveaux contrats inter-canaux doivent toujours arriver sur des sous-chemins génériques `plugin-sdk/*` ou sur les barrels locaux au plugin `api.js` /
  `runtime-api.js`.

Note de compatibilité :

- Évitez le barrel racine `openclaw/plugin-sdk` pour le nouveau code.
- Préférez d’abord les primitives stables étroites. Les sous-chemins plus récents setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool constituent le contrat prévu pour le nouveau travail
  sur les plugins bundled et externes.
  L’analyse/la correspondance des cibles appartient à `openclaw/plugin-sdk/channel-targets`.
  Les garde-fous d’action de message et les helpers d’id de message de réaction appartiennent à
  `openclaw/plugin-sdk/channel-actions`.
- Les barrels helpers spécifiques aux extensions bundled ne sont pas stables par défaut. Si un
  helper n’est nécessaire que pour une extension bundled, gardez-le derrière la
  couture locale `api.js` ou `runtime-api.js` de l’extension au lieu de le promouvoir dans
  `openclaw/plugin-sdk/<extension>`.
- Les nouvelles coutures de helper partagées doivent être génériques, et non marquées par un canal. L’analyse partagée
  des cibles appartient à `openclaw/plugin-sdk/channel-targets` ; les composants internes spécifiques au canal
  restent derrière la couture locale `api.js` ou `runtime-api.js` du plugin propriétaire.
- Des sous-chemins spécifiques à une capacité comme `image-generation`,
  `media-understanding`, et `speech` existent parce que les plugins bundled/natifs les utilisent
  aujourd’hui. Leur présence ne signifie pas à elle seule que chaque helper exporté soit un contrat externe figé à long terme.

## Schémas d’outil de message

Les plugins doivent posséder les contributions de schéma spécifiques au canal pour
`describeMessageTool(...)`. Conservez les champs spécifiques au provider dans le plugin, pas dans le cœur partagé.

Pour les fragments de schéma portables partagés, réutilisez les helpers génériques exportés via
`openclaw/plugin-sdk/channel-actions` :

- `createMessageToolButtonsSchema()` pour des charges utiles de style grille de boutons
- `createMessageToolCardSchema()` pour des charges utiles de carte structurée

Si une forme de schéma n’a de sens que pour un seul provider, définissez-la dans les
sources du plugin lui-même au lieu de la promouvoir dans le SDK partagé.

## Résolution de cible de canal

Les plugins de canal doivent posséder la sémantique de cible spécifique au canal. Conservez l’hôte
sortant partagé générique et utilisez la surface de l’adaptateur de messagerie pour les règles du provider :

- `messaging.inferTargetChatType({ to })` décide si une cible normalisée
  doit être traitée comme `direct`, `group`, ou `channel` avant la recherche dans l’annuaire.
- `messaging.targetResolver.looksLikeId(raw, normalized)` indique au cœur si une
  entrée doit passer directement à une résolution de type id au lieu d’une recherche dans l’annuaire.
- `messaging.targetResolver.resolveTarget(...)` est le fallback du plugin lorsque le
  cœur a besoin d’une résolution finale appartenant au provider après normalisation ou après un
  échec de recherche dans l’annuaire.
- `messaging.resolveOutboundSessionRoute(...)` possède la construction de route de session spécifique au provider
  une fois qu’une cible est résolue.

Répartition recommandée :

- Utilisez `inferTargetChatType` pour les décisions de catégorie qui doivent intervenir avant
  la recherche dans les pairs/groupes.
- Utilisez `looksLikeId` pour les vérifications du type « traiter ceci comme un id de cible explicite/natif ».
- Utilisez `resolveTarget` pour le fallback de normalisation spécifique au provider, pas pour
  une recherche large dans l’annuaire.
- Conservez les ids natifs du provider comme les ids de chat, ids de thread, JID, handles et ids de salon
  dans les valeurs `target` ou dans des paramètres spécifiques au provider, pas dans des
  champs SDK génériques.

## Annuaires adossés à la configuration

Les plugins qui dérivent des entrées d’annuaire à partir de la configuration doivent conserver cette logique dans le
plugin et réutiliser les helpers partagés de
`openclaw/plugin-sdk/directory-runtime`.

Utilisez cela lorsqu’un canal a besoin de pairs/groupes adossés à la configuration comme :

- des pairs DM pilotés par liste d’autorisation
- des mappings configurés de canaux/groupes
- des fallbacks statiques d’annuaire à portée de compte

Les helpers partagés de `directory-runtime` ne gèrent que des opérations génériques :

- filtrage de requête
- application de limites
- helpers de déduplication/normalisation
- construction de `ChannelDirectoryEntry[]`

L’inspection de compte spécifique au canal et la normalisation des ids doivent rester dans
l’implémentation du plugin.

## Catalogues de providers

Les plugins fournisseurs peuvent définir des catalogues de modèles pour l’inférence avec
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` renvoie la même forme que celle qu’OpenClaw écrit dans
`models.providers` :

- `{ provider }` pour une entrée de provider
- `{ providers }` pour plusieurs entrées de provider

Utilisez `catalog` lorsque le plugin possède des ids de modèle spécifiques au provider, des valeurs par défaut d’URL de base,
ou des métadonnées de modèle protégées par authentification.

`catalog.order` contrôle le moment où le catalogue d’un plugin fusionne par rapport aux
providers implicites intégrés d’OpenClaw :

- `simple` : providers simples pilotés par clé API ou environnement
- `profile` : providers qui apparaissent lorsque des profils d’authentification existent
- `paired` : providers qui synthétisent plusieurs entrées de provider liées
- `late` : dernier passage, après les autres providers implicites

Les providers plus tardifs gagnent en cas de collision de clé, de sorte que les plugins peuvent
écraser intentionnellement une entrée de provider intégrée avec le même id de provider.

Compatibilité :

- `discovery` fonctionne toujours comme alias legacy
- si `catalog` et `discovery` sont tous deux enregistrés, OpenClaw utilise `catalog`

## Inspection de canal en lecture seule

Si votre plugin enregistre un canal, préférez implémenter
`plugin.config.inspectAccount(cfg, accountId)` en plus de `resolveAccount(...)`.

Pourquoi :

- `resolveAccount(...)` est le chemin d’exécution. Il peut supposer que les identifiants
  sont entièrement matérialisés et peut échouer rapidement lorsque les secrets requis sont absents.
- Les chemins de commande en lecture seule comme `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, et les flux doctor/réparation de configuration
  ne devraient pas avoir besoin de matérialiser les identifiants runtime juste pour
  décrire la configuration.

Comportement recommandé pour `inspectAccount(...)` :

- Renvoyer uniquement un état de compte descriptif.
- Préserver `enabled` et `configured`.
- Inclure les champs de source/statut d’identifiants quand cela est pertinent, comme :
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Vous n’avez pas besoin de renvoyer les valeurs brutes des jetons simplement pour signaler une
  disponibilité en lecture seule. Renvoyer `tokenStatus: "available"` (et le champ de source correspondant)
  suffit pour les commandes de type statut.
- Utilisez `configured_unavailable` lorsqu’un identifiant est configuré via SecretRef mais
  indisponible dans le chemin de commande actuel.

Cela permet aux commandes en lecture seule d’indiquer « configuré mais indisponible dans ce chemin de commande »
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

Chaque entrée devient un plugin. Si le pack liste plusieurs extensions, l’id du plugin
devient `name/<fileBase>`.

Si votre plugin importe des dépendances npm, installez-les dans ce répertoire afin que
`node_modules` soit disponible (`npm install` / `pnpm install`).

Garde-fou de sécurité : chaque entrée `openclaw.extensions` doit rester à l’intérieur du répertoire du plugin
après résolution des liens symboliques. Les entrées qui s’échappent du répertoire du package sont
rejetées.

Note de sécurité : `openclaw plugins install` installe les dépendances du plugin avec
`npm install --omit=dev --ignore-scripts` (pas de scripts de cycle de vie, pas de dépendances de développement à l’exécution). Gardez les arbres
de dépendances des plugins en « JS/TS pur » et évitez les packages qui nécessitent des builds `postinstall`.

Facultatif : `openclaw.setupEntry` peut pointer vers un module léger réservé à la configuration.
Quand OpenClaw a besoin de surfaces de configuration pour un plugin de canal désactivé, ou
lorsqu’un plugin de canal est activé mais encore non configuré, il charge `setupEntry`
au lieu du point d’entrée complet du plugin. Cela allège le démarrage et la configuration
lorsque le point d’entrée principal de votre plugin câble aussi des outils, hooks ou autre code
réservé à l’exécution.

Facultatif : `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
peut faire opter un plugin de canal pour ce même chemin `setupEntry` pendant la phase
de démarrage pré-écoute de la gateway, même lorsque le canal est déjà configuré.

Utilisez ceci uniquement si `setupEntry` couvre entièrement la surface de démarrage qui doit exister
avant que la gateway ne commence à écouter. En pratique, cela signifie que le point d’entrée de configuration
doit enregistrer chaque capacité appartenant au canal dont le démarrage dépend, comme :

- l’enregistrement du canal lui-même
- toute route HTTP qui doit être disponible avant que la gateway ne commence à écouter
- toutes méthodes Gateway, tous outils ou services qui doivent exister pendant cette même fenêtre

Si votre point d’entrée complet possède encore une capacité de démarrage requise, n’activez pas
ce drapeau. Conservez le comportement par défaut du plugin et laissez OpenClaw charger le
point d’entrée complet au démarrage.

Les canaux bundled peuvent aussi publier des helpers de surface de contrat réservés à la configuration que le cœur
peut consulter avant le chargement du runtime complet du canal. La surface actuelle de promotion de configuration
est :

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Le cœur utilise cette surface lorsqu’il doit promouvoir une configuration legacy de canal à compte unique
vers `channels.<id>.accounts.*` sans charger le point d’entrée complet du plugin.
Matrix est l’exemple bundled actuel : il ne déplace que les clés d’authentification/bootstrap dans un
compte promu nommé lorsque des comptes nommés existent déjà, et il peut préserver une
clé configurée non canonique de compte par défaut au lieu de toujours créer
`accounts.default`.

Ces adaptateurs de patch de configuration gardent la découverte de la surface de contrat bundled paresseuse. Le temps
d’import reste léger ; la surface de promotion n’est chargée qu’à la première utilisation au lieu de
réentrer dans le démarrage du canal bundled lors de l’import du module.

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

Les plugins de canal peuvent annoncer des métadonnées de configuration/découverte via `openclaw.channel` et
des indications d’installation via `openclaw.install`. Cela garde les données du catalogue hors du cœur.

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

- `detailLabel` : libellé secondaire pour des surfaces plus riches de catalogue/statut
- `docsLabel` : remplace le texte du lien vers la documentation
- `preferOver` : ids de plugin/canal de priorité plus basse que cette entrée de catalogue doit devancer
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras` : contrôles de copie pour la surface de sélection
- `markdownCapable` : marque le canal comme compatible Markdown pour les décisions de formatage sortant
- `exposure.configured` : masque le canal des surfaces de liste de canaux configurés lorsqu’il est défini à `false`
- `exposure.setup` : masque le canal des sélecteurs interactifs de configuration lorsque défini à `false`
- `exposure.docs` : marque le canal comme interne/privé pour les surfaces de navigation de documentation
- `showConfigured` / `showInSetup` : alias legacy toujours acceptés pour compatibilité ; préférez `exposure`
- `quickstartAllowFrom` : fait opter le canal dans le flux standard quickstart `allowFrom`
- `forceAccountBinding` : exige une liaison explicite de compte même lorsqu’un seul compte existe
- `preferSessionLookupForAnnounceTarget` : préfère la recherche de session lors de la résolution des cibles d’annonce

OpenClaw peut aussi fusionner des **catalogues de canaux externes** (par exemple, un export de registre MPM).
Déposez un fichier JSON à l’un de ces emplacements :

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Ou pointez `OPENCLAW_PLUGIN_CATALOG_PATHS` (ou `OPENCLAW_MPM_CATALOG_PATHS`) vers
un ou plusieurs fichiers JSON (délimités par virgule/point-virgule/`PATH`). Chaque fichier doit
contenir `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. L’analyseur accepte aussi `"packages"` ou `"plugins"` comme alias legacy de la clé `"entries"`.

## Plugins de moteur de contexte

Les plugins de moteur de contexte possèdent l’orchestration du contexte de session pour l’ingestion, l’assemblage,
et la compaction. Enregistrez-les depuis votre plugin avec
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

Si votre moteur ne possède **pas** l’algorithme de compaction, gardez `compact()`
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
le système de plugins par un accès privé interne. Ajoutez la capacité manquante.

Séquence recommandée :

1. définir le contrat du cœur
   Décidez quel comportement partagé le cœur doit posséder : politique, fallback, fusion de configuration,
   cycle de vie, sémantique orientée canal et forme du helper d’exécution.
2. ajouter des surfaces typées d’enregistrement/d’exécution des plugins
   Étendez `OpenClawPluginApi` et/ou `api.runtime` avec la plus petite surface de capacité
   typée utile.
3. raccorder les consommateurs cœur + canal/fonctionnalité
   Les canaux et plugins de fonctionnalité doivent consommer la nouvelle capacité via le cœur,
   et non en important directement une implémentation fournisseur.
4. enregistrer les implémentations fournisseurs
   Les plugins fournisseurs enregistrent ensuite leurs backends sur la capacité.
5. ajouter une couverture de contrat
   Ajoutez des tests afin que la propriété et la forme de l’enregistrement restent explicites dans le temps.

C’est ainsi qu’OpenClaw reste structuré sans devenir codé en dur selon la vision du monde
d’un seul fournisseur. Voir le [Recueil de recettes des capacités](/fr/plugins/architecture)
pour une checklist concrète de fichiers et un exemple détaillé.

### Checklist de capacité

Lorsque vous ajoutez une nouvelle capacité, l’implémentation doit généralement toucher
ces surfaces ensemble :

- types du contrat cœur dans `src/<capability>/types.ts`
- helper cœur de runner/runtime dans `src/<capability>/runtime.ts`
- surface d’enregistrement de l’API des plugins dans `src/plugins/types.ts`
- câblage du registre des plugins dans `src/plugins/registry.ts`
- exposition du runtime des plugins dans `src/plugins/runtime/*` lorsque les plugins de fonctionnalité/canal
  doivent le consommer
- helpers de capture/test dans `src/test-utils/plugin-registration.ts`
- assertions de propriété/contrat dans `src/plugins/contracts/registry.ts`
- documentation opérateur/plugin dans `docs/`

Si l’une de ces surfaces manque, c’est généralement le signe que la capacité n’est
pas encore totalement intégrée.

### Modèle de capacité

Modèle minimal :

```ts
// core contract
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// plugin API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// shared runtime helper for feature/channel plugins
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

- le cœur possède le contrat de capacité + l’orchestration
- les plugins fournisseurs possèdent les implémentations fournisseur
- les plugins de fonctionnalité/canal consomment les helpers d’exécution
- les tests de contrat gardent la propriété explicite
