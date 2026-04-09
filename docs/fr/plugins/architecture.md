---
read_when:
    - Création ou débogage de plugins OpenClaw natifs
    - Compréhension du modèle de capacités des plugins ou des limites de propriété
    - Travail sur le pipeline de chargement des plugins ou le registre
    - Implémentation de hooks d'exécution de fournisseur ou de plugins de canal
sidebarTitle: Internals
summary: 'Éléments internes des plugins : modèle de capacités, propriété, contrats, pipeline de chargement et helpers d''exécution'
title: Éléments internes des plugins
x-i18n:
    generated_at: "2026-04-09T01:32:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2575791f835990589219bb06d8ca92e16a8c38b317f0bfe50b421682f253ef18
    source_path: plugins/architecture.md
    workflow: 15
---

# Éléments internes des plugins

<Info>
  Il s'agit de la **référence d'architecture approfondie**. Pour des guides pratiques, voir :
  - [Installer et utiliser des plugins](/fr/tools/plugin) — guide utilisateur
  - [Bien démarrer](/fr/plugins/building-plugins) — premier tutoriel de plugin
  - [Plugins de canal](/fr/plugins/sdk-channel-plugins) — créer un canal de messagerie
  - [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins) — créer un fournisseur de modèles
  - [Vue d'ensemble du SDK](/fr/plugins/sdk-overview) — carte des imports et API d'enregistrement
</Info>

Cette page couvre l'architecture interne du système de plugins d'OpenClaw.

## Modèle de capacités public

Les capacités constituent le modèle public de **plugin natif** dans OpenClaw. Chaque
plugin OpenClaw natif s'enregistre auprès d'un ou plusieurs types de capacités :

| Capability             | Registration method                              | Example plugins                      |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| Inférence de texte     | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| Backend d'inférence CLI | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| Parole                 | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Transcription en temps réel | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| Voix en temps réel     | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Compréhension des médias    | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Génération d'images    | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Génération de musique  | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Génération de vidéo    | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Récupération web       | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Recherche web          | `api.registerWebSearchProvider(...)`             | `google`                             |
| Canal / messagerie     | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |

Un plugin qui n'enregistre aucune capacité mais fournit des hooks, des outils ou
des services est un plugin **legacy hook-only**. Ce modèle reste entièrement pris en charge.

### Position actuelle sur la compatibilité externe

Le modèle de capacités est intégré au cœur et utilisé par les plugins
natifs/intégrés aujourd'hui, mais la compatibilité des plugins externes exige
encore une barre plus stricte que « c'est exporté, donc c'est figé ».

Directive actuelle :

- **plugins externes existants :** continuer à faire fonctionner les
  intégrations basées sur des hooks ; considérez cela comme la base de compatibilité
- **nouveaux plugins natifs/intégrés :** préférer un enregistrement explicite des capacités
  plutôt que des accès ciblés spécifiques à un fournisseur ou de nouveaux modèles hook-only
- **plugins externes adoptant l'enregistrement de capacités :** autorisé, mais
  considérez les surfaces helper spécifiques aux capacités comme évolutives sauf si
  la documentation marque explicitement un contrat comme stable

Règle pratique :

- les API d'enregistrement de capacités constituent la direction visée
- les hooks legacy restent le chemin le plus sûr sans rupture pour les plugins externes pendant
  la transition
- les sous-chemins helper exportés n'ont pas tous le même statut ; préférez le
  contrat étroit documenté, pas des exports helper accidentels

### Formes de plugins

OpenClaw classe chaque plugin chargé selon une forme basée sur son comportement
d'enregistrement réel (et pas seulement sur des métadonnées statiques) :

- **plain-capability** -- enregistre exactement un type de capacité (par exemple un
  plugin uniquement fournisseur comme `mistral`)
- **hybrid-capability** -- enregistre plusieurs types de capacités (par exemple
  `openai` possède l'inférence de texte, la parole, la compréhension des médias et la génération
  d'images)
- **hook-only** -- enregistre uniquement des hooks (typés ou personnalisés), sans capacités,
  outils, commandes ni services
- **non-capability** -- enregistre des outils, commandes, services ou routes, mais aucune
  capacité

Utilisez `openclaw plugins inspect <id>` pour voir la forme d'un plugin et la
répartition de ses capacités. Voir [Référence CLI](/cli/plugins#inspect) pour plus de détails.

### Hooks legacy

Le hook `before_agent_start` reste pris en charge comme chemin de compatibilité pour
les plugins hook-only. Des plugins legacy utilisés en conditions réelles en dépendent encore.

Orientation :

- le conserver fonctionnel
- le documenter comme legacy
- préférer `before_model_resolve` pour les surcharges de modèle/fournisseur
- préférer `before_prompt_build` pour la modification du prompt
- ne le retirer qu'après une baisse de l'usage réel et une couverture par fixtures prouvant la sécurité de la migration

### Signaux de compatibilité

Lorsque vous exécutez `openclaw doctor` ou `openclaw plugins inspect <id>`, vous pouvez voir
l'un de ces libellés :

| Signal                     | Signification                                                |
| -------------------------- | ------------------------------------------------------------ |
| **configuration valide**   | La configuration est correctement analysée et les plugins sont résolus |
| **avis de compatibilité** | Le plugin utilise un modèle pris en charge mais plus ancien (par ex. `hook-only`) |
| **avertissement legacy**   | Le plugin utilise `before_agent_start`, qui est obsolète     |
| **erreur bloquante**       | La configuration est invalide ou le plugin n'a pas pu être chargé |

Ni `hook-only` ni `before_agent_start` ne casseront votre plugin aujourd'hui --
`hook-only` est un avis, et `before_agent_start` ne déclenche qu'un avertissement. Ces
signaux apparaissent également dans `openclaw status --all` et `openclaw plugins doctor`.

## Vue d'ensemble de l'architecture

Le système de plugins d'OpenClaw comporte quatre couches :

1. **Manifeste + découverte**
   OpenClaw trouve les plugins candidats à partir des chemins configurés, des racines d'espace de travail,
   des racines globales d'extensions et des extensions intégrées. La découverte lit d'abord
   les manifestes natifs `openclaw.plugin.json` ainsi que les manifestes de bundle pris en charge.
2. **Activation + validation**
   Le cœur décide si un plugin découvert est activé, désactivé, bloqué ou
   sélectionné pour un emplacement exclusif tel que la mémoire.
3. **Chargement à l'exécution**
   Les plugins OpenClaw natifs sont chargés en processus via jiti et enregistrent
   des capacités dans un registre central. Les bundles compatibles sont normalisés en
   enregistrements de registre sans importer de code d'exécution.
4. **Consommation des surfaces**
   Le reste d'OpenClaw lit le registre pour exposer outils, canaux, configuration
   des fournisseurs, hooks, routes HTTP, commandes CLI et services.

Pour la CLI des plugins en particulier, la découverte des commandes racines est divisée en deux phases :

- les métadonnées au moment de l'analyse proviennent de `registerCli(..., { descriptors: [...] })`
- le vrai module CLI du plugin peut rester paresseux et s'enregistrer à la première invocation

Cela permet de conserver le code CLI appartenant au plugin à l'intérieur du plugin tout en laissant OpenClaw
réserver les noms de commandes racines avant l'analyse.

La frontière de conception importante :

- la découverte + validation de configuration doivent fonctionner à partir des **métadonnées du manifeste/schéma**
  sans exécuter le code du plugin
- le comportement d'exécution natif provient du chemin `register(api)` du module du plugin

Cette séparation permet à OpenClaw de valider la configuration, d'expliquer les plugins manquants/désactivés et
de construire des indices d'UI/schéma avant que l'exécution complète ne soit active.

### Plugins de canal et outil de message partagé

Les plugins de canal n'ont pas besoin d'enregistrer un outil séparé d'envoi/édition/réaction pour
les actions de chat normales. OpenClaw conserve un outil `message` partagé dans le cœur, et les
plugins de canal possèdent la découverte et l'exécution spécifiques au canal derrière celui-ci.

La frontière actuelle est la suivante :

- le cœur possède l'hôte de l'outil `message` partagé, le câblage de prompt, la tenue des sessions/fils
  et la répartition de l'exécution
- les plugins de canal possèdent la découverte d'actions à portée, la découverte de capacités et toute
  partie de schéma spécifique au canal
- les plugins de canal possèdent la grammaire de conversation de session spécifique au fournisseur, par exemple
  la manière dont les identifiants de conversation encodent les identifiants de fil ou héritent des conversations parentes
- les plugins de canal exécutent l'action finale via leur adaptateur d'action

Pour les plugins de canal, la surface SDK est
`ChannelMessageActionAdapter.describeMessageTool(...)`. Cet appel de découverte unifié
permet à un plugin de renvoyer ensemble ses actions visibles, ses capacités et ses
contributions de schéma afin que ces éléments ne divergent pas.

Le cœur transmet la portée d'exécution à cette étape de découverte. Les champs importants incluent :

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` entrant de confiance

C'est important pour les plugins sensibles au contexte. Un canal peut masquer ou exposer
des actions de message selon le compte actif, la salle/le fil/le message courant, ou
l'identité du demandeur de confiance, sans coder en dur de branches spécifiques au canal
dans l'outil `message` du cœur.

C'est pourquoi les changements de routage du runner embarqué restent du travail de plugin : le runner est
responsable de transmettre l'identité actuelle du chat/de la session à la frontière de découverte du plugin
afin que l'outil `message` partagé expose la bonne surface appartenant au canal pour le tour courant.

Pour les helpers d'exécution appartenant au canal, les plugins intégrés doivent conserver le runtime
d'exécution dans leurs propres modules d'extension. Le cœur ne possède plus les runtimes
d'actions de message Discord, Slack, Telegram ou WhatsApp sous `src/agents/tools`.
Nous ne publions pas de sous-chemins séparés `plugin-sdk/*-action-runtime`, et les plugins intégrés
doivent importer directement leur propre code runtime local depuis leurs
modules appartenant à l'extension.

La même frontière s'applique aux seams SDK nommés par fournisseur en général : le cœur ne doit
pas importer de barrel de commodité spécifique à un canal pour Slack, Discord, Signal,
WhatsApp ou des extensions similaires. Si le cœur a besoin d'un comportement, il doit soit consommer
le barrel `api.ts` / `runtime-api.ts` du plugin intégré, soit faire remonter ce besoin
dans une capacité générique étroite du SDK partagé.

Pour les sondages en particulier, il existe deux chemins d'exécution :

- `outbound.sendPoll` est la base partagée pour les canaux qui correspondent au modèle
  commun de sondage
- `actions.handleAction("poll")` est le chemin préféré pour la sémantique de sondage spécifique au canal
  ou les paramètres de sondage supplémentaires

Le cœur diffère désormais l'analyse partagée des sondages jusqu'à ce que le dispatch du plugin de sondage refuse
l'action, afin que les gestionnaires de sondage appartenant au plugin puissent accepter des champs de sondage
spécifiques au canal sans être bloqués d'abord par l'analyseur générique de sondage.

Voir [Pipeline de chargement](#load-pipeline) pour la séquence complète de démarrage.

## Modèle de propriété des capacités

OpenClaw traite un plugin natif comme la limite de propriété d'une **entreprise** ou d'une
**fonctionnalité**, et non comme un fourre-tout d'intégrations sans lien.

Cela signifie :

- un plugin d'entreprise doit en général posséder toutes les surfaces OpenClaw de cette entreprise
- un plugin de fonctionnalité doit en général posséder toute la surface de la fonctionnalité qu'il introduit
- les canaux doivent consommer les capacités partagées du cœur au lieu de réimplémenter
  de manière ad hoc le comportement des fournisseurs

Exemples :

- le plugin intégré `openai` possède le comportement de fournisseur de modèles OpenAI et le comportement
  OpenAI pour la parole + la voix temps réel + la compréhension des médias + la génération d'images
- le plugin intégré `elevenlabs` possède le comportement de parole ElevenLabs
- le plugin intégré `microsoft` possède le comportement de parole Microsoft
- le plugin intégré `google` possède le comportement de fournisseur de modèles Google ainsi que le comportement Google
  pour la compréhension des médias + la génération d'images + la recherche web
- le plugin intégré `firecrawl` possède le comportement de récupération web Firecrawl
- les plugins intégrés `minimax`, `mistral`, `moonshot` et `zai` possèdent leurs
  backends de compréhension des médias
- le plugin `voice-call` est un plugin de fonctionnalité : il possède le transport d'appel, les outils,
  la CLI, les routes et le pont Twilio media-stream, mais il consomme des capacités partagées de parole
  ainsi que de transcription temps réel et de voix temps réel au lieu d'importer directement des plugins fournisseurs

L'état final visé est le suivant :

- OpenAI vit dans un seul plugin même s'il couvre les modèles de texte, la parole, les images et
  la vidéo à venir
- un autre fournisseur peut faire de même pour sa propre surface
- les canaux ne se soucient pas du plugin fournisseur qui possède le fournisseur ; ils consomment le
  contrat de capacité partagé exposé par le cœur

Voici la distinction essentielle :

- **plugin** = limite de propriété
- **capacité** = contrat du cœur que plusieurs plugins peuvent implémenter ou consommer

Ainsi, si OpenClaw ajoute un nouveau domaine comme la vidéo, la première question n'est pas
« quel fournisseur doit coder en dur la gestion de la vidéo ? » La première question est
« quel est le contrat de capacité vidéo du cœur ? » Une fois ce contrat en place, les plugins fournisseurs
peuvent s'y enregistrer et les plugins de canal/de fonctionnalité peuvent le consommer.

Si la capacité n'existe pas encore, la bonne démarche est généralement :

1. définir la capacité manquante dans le cœur
2. l'exposer via l'API/le runtime du plugin de manière typée
3. câbler les canaux/fonctionnalités sur cette capacité
4. laisser les plugins fournisseurs enregistrer des implémentations

Cela maintient une propriété explicite tout en évitant un comportement du cœur dépendant d'un
seul fournisseur ou d'un chemin de code spécifique à un plugin isolé.

### Stratification des capacités

Utilisez ce modèle mental pour décider où le code doit se trouver :

- **couche de capacité du cœur** : orchestration partagée, politique, fallback, règles de fusion de configuration,
  sémantique de livraison et contrats typés
- **couche de plugin fournisseur** : API spécifiques au fournisseur, authentification, catalogues de modèles, synthèse vocale,
  génération d'images, futurs backends vidéo, endpoints d'usage
- **couche de plugin canal/fonctionnalité** : intégration Slack/Discord/voice-call/etc.
  qui consomme les capacités du cœur et les présente sur une surface

Par exemple, la synthèse vocale suit cette forme :

- le cœur possède la politique TTS au moment de la réponse, l'ordre de fallback, les préférences et la livraison par canal
- `openai`, `elevenlabs` et `microsoft` possèdent les implémentations de synthèse
- `voice-call` consomme le helper runtime TTS de téléphonie

Ce même modèle doit être préféré pour les capacités futures.

### Exemple de plugin d'entreprise multi-capacités

Un plugin d'entreprise doit sembler cohérent vu de l'extérieur. Si OpenClaw dispose de
contrats partagés pour les modèles, la parole, la transcription temps réel, la voix temps réel, la compréhension des médias,
la génération d'images, la génération de vidéo, la récupération web et la recherche web,
un fournisseur peut posséder toutes ses surfaces en un seul endroit :

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
      // hooks auth/catalogue de modèles/runtime
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // configuration de parole fournisseur — implémente directement l'interface SpeechProviderPlugin
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
        // logique d'identifiants + de récupération
      }),
    );
  },
};

export default plugin;
```

Ce qui compte n'est pas le nom exact des helpers. C'est la forme qui importe :

- un seul plugin possède la surface du fournisseur
- le cœur possède toujours les contrats de capacité
- les canaux et plugins de fonctionnalité consomment les helpers `api.runtime.*`, pas le code fournisseur
- les tests de contrat peuvent vérifier que le plugin a enregistré les capacités qu'il
  prétend posséder

### Exemple de capacité : compréhension vidéo

OpenClaw traite déjà la compréhension d'image/audio/vidéo comme une capacité partagée unique.
Le même modèle de propriété s'y applique :

1. le cœur définit le contrat de compréhension des médias
2. les plugins fournisseurs enregistrent `describeImage`, `transcribeAudio` et
   `describeVideo` selon le cas
3. les canaux et plugins de fonctionnalité consomment le comportement partagé du cœur au lieu de
   se connecter directement au code fournisseur

Cela évite d'intégrer dans le cœur les hypothèses vidéo d'un seul fournisseur. Le plugin possède
la surface du fournisseur ; le cœur possède le contrat de capacité et le comportement de fallback.

La génération de vidéo suit déjà cette même séquence : le cœur possède le contrat de capacité typé
et le helper runtime, et les plugins fournisseurs enregistrent des implémentations
`api.registerVideoGenerationProvider(...)` dessus.

Besoin d'une checklist concrète de déploiement ? Voir
[Capability Cookbook](/fr/plugins/architecture).

## Contrats et application

La surface de l'API des plugins est volontairement typée et centralisée dans
`OpenClawPluginApi`. Ce contrat définit les points d'enregistrement pris en charge et
les helpers runtime sur lesquels un plugin peut s'appuyer.

Pourquoi c'est important :

- les auteurs de plugins obtiennent une norme interne stable unique
- le cœur peut rejeter une propriété en doublon, par exemple deux plugins enregistrant le même identifiant de fournisseur
- le démarrage peut exposer des diagnostics exploitables pour un enregistrement mal formé
- les tests de contrat peuvent imposer la propriété des plugins intégrés et empêcher une dérive silencieuse

Il existe deux couches d'application :

1. **application de l'enregistrement à l'exécution**
   Le registre des plugins valide les enregistrements à mesure que les plugins se chargent. Exemples :
   identifiants de fournisseur dupliqués, identifiants de fournisseur de parole dupliqués et enregistrements
   mal formés produisent des diagnostics de plugin au lieu d'un comportement indéfini.
2. **tests de contrat**
   Les plugins intégrés sont capturés dans des registres de contrat pendant les tests afin
   qu'OpenClaw puisse vérifier explicitement la propriété. Aujourd'hui, cela est utilisé pour les
   fournisseurs de modèles, les fournisseurs de parole, les fournisseurs de recherche web et la propriété
   des enregistrements intégrés.

L'effet pratique est qu'OpenClaw sait, dès le départ, quel plugin possède quelle
surface. Cela permet au cœur et aux canaux de se composer proprement, car la propriété est
déclarée, typée et testable plutôt qu'implicite.

### Ce qui doit figurer dans un contrat

Les bons contrats de plugin sont :

- typés
- petits
- spécifiques à une capacité
- possédés par le cœur
- réutilisables par plusieurs plugins
- consommables par des canaux/fonctionnalités sans connaissance du fournisseur

Les mauvais contrats de plugin sont :

- une politique spécifique au fournisseur cachée dans le cœur
- des échappatoires ponctuelles pour un plugin qui contournent le registre
- du code de canal qui accède directement à une implémentation fournisseur
- des objets runtime ad hoc qui ne font pas partie de `OpenClawPluginApi` ou de
  `api.runtime`

En cas de doute, montez le niveau d'abstraction : définissez d'abord la capacité, puis
laissez les plugins s'y brancher.

## Modèle d'exécution

Les plugins OpenClaw natifs s'exécutent **dans le processus** avec la Gateway. Ils ne sont pas
sandboxés. Un plugin natif chargé partage la même limite de confiance au niveau du processus que
le code du cœur.

Implications :

- un plugin natif peut enregistrer des outils, des gestionnaires réseau, des hooks et des services
- un bug dans un plugin natif peut faire planter ou déstabiliser la gateway
- un plugin natif malveillant équivaut à une exécution de code arbitraire à l'intérieur
  du processus OpenClaw

Les bundles compatibles sont plus sûrs par défaut car OpenClaw les traite actuellement
comme des packs de métadonnées/contenu. Dans les versions actuelles, cela signifie surtout des
Skills intégrées.

Utilisez des listes d'autorisation et des chemins explicites d'installation/de chargement pour les plugins non intégrés.
Considérez les plugins d'espace de travail comme du code de développement, pas comme des valeurs par défaut de production.

Pour les noms de paquets de l'espace de travail intégrés, conservez l'identifiant du plugin ancré dans le nom npm :
`@openclaw/<id>` par défaut, ou un suffixe typé approuvé tel que
`-provider`, `-plugin`, `-speech`, `-sandbox` ou `-media-understanding` lorsque
le paquet expose intentionnellement un rôle de plugin plus étroit.

Note de confiance importante :

- `plugins.allow` fait confiance aux **identifiants de plugin**, pas à la provenance de la source.
- Un plugin d'espace de travail ayant le même identifiant qu'un plugin intégré masque volontairement
  la copie intégrée lorsque ce plugin d'espace de travail est activé/sur liste d'autorisation.
- C'est normal et utile pour le développement local, les tests de correctifs et les correctifs à chaud.

## Frontière d'export

OpenClaw exporte des capacités, pas des commodités d'implémentation.

Gardez l'enregistrement des capacités public. Réduisez les exports helper hors contrat :

- sous-chemins helper spécifiques à un plugin intégré
- sous-chemins de plomberie runtime non destinés à être une API publique
- helpers de commodité spécifiques à un fournisseur
- helpers de configuration/d'onboarding qui sont des détails d'implémentation

Certains sous-chemins helper de plugins intégrés restent encore dans la carte d'export
SDK générée pour la compatibilité et la maintenance des plugins intégrés. Exemples actuels :
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` et plusieurs seams `plugin-sdk/matrix*`. Traitez-les comme
des exports réservés de détail d'implémentation, et non comme le modèle SDK recommandé pour
de nouveaux plugins tiers.

## Pipeline de chargement

Au démarrage, OpenClaw fait approximativement ceci :

1. découvrir les racines de plugins candidates
2. lire les manifestes natifs ou de bundles compatibles et les métadonnées de paquet
3. rejeter les candidats non sûrs
4. normaliser la configuration des plugins (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. décider de l'activation de chaque candidat
6. charger les modules natifs activés via jiti
7. appeler les hooks natifs `register(api)` (ou `activate(api)` — un alias legacy) et collecter les enregistrements dans le registre des plugins
8. exposer le registre aux surfaces commandes/runtime

<Note>
`activate` est un alias legacy de `register` — le chargeur résout la présence de l'un ou de l'autre (`def.register ?? def.activate`) et l'appelle au même moment. Tous les plugins intégrés utilisent `register` ; préférez `register` pour les nouveaux plugins.
</Note>

Les garde-fous de sécurité se produisent **avant** l'exécution du runtime. Les candidats sont bloqués
lorsque l'entrée sort de la racine du plugin, que le chemin est modifiable par tous, ou que la propriété du chemin
semble suspecte pour les plugins non intégrés.

### Comportement orienté manifeste

Le manifeste est la source de vérité du plan de contrôle. OpenClaw l'utilise pour :

- identifier le plugin
- découvrir les canaux/Skills/schéma de configuration déclarés ou les capacités du bundle
- valider `plugins.entries.<id>.config`
- enrichir les libellés/placeholders du Control UI
- afficher les métadonnées d'installation/de catalogue

Pour les plugins natifs, le module runtime est la partie plan de données. Il enregistre
le comportement réel comme les hooks, outils, commandes ou flux de fournisseur.

### Ce que le chargeur met en cache

OpenClaw conserve de courts caches en processus pour :

- les résultats de découverte
- les données du registre de manifestes
- les registres de plugins chargés

Ces caches réduisent les démarrages brusques et la surcharge de commandes répétées. Vous pouvez
les considérer comme des caches de performance de courte durée, pas comme de la persistance.

Note de performance :

- Définissez `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` ou
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` pour désactiver ces caches.
- Ajustez les fenêtres de cache avec `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` et
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Modèle de registre

Les plugins chargés ne modifient pas directement des globals aléatoires du cœur. Ils s'enregistrent dans un
registre central de plugins.

Le registre suit :

- les enregistrements de plugin (identité, source, origine, statut, diagnostics)
- les outils
- les hooks legacy et les hooks typés
- les canaux
- les fournisseurs
- les gestionnaires RPC Gateway
- les routes HTTP
- les registrars CLI
- les services en arrière-plan
- les commandes appartenant au plugin

Les fonctionnalités du cœur lisent ensuite ce registre au lieu de communiquer directement avec les modules
de plugin. Cela conserve un chargement à sens unique :

- module de plugin -> enregistrement dans le registre
- runtime du cœur -> consommation du registre

Cette séparation est importante pour la maintenabilité. Elle signifie que la plupart des surfaces du cœur n'ont besoin
que d'un seul point d'intégration : « lire le registre », et non « traiter chaque module
de plugin comme un cas particulier ».

## Callbacks de liaison de conversation

Les plugins qui lient une conversation peuvent réagir lorsqu'une approbation est résolue.

Utilisez `api.onConversationBindingResolved(...)` pour recevoir un callback après qu'une
demande de liaison a été approuvée ou refusée :

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

      // La demande a été refusée ; effacez tout état local en attente.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Champs de la charge utile du callback :

- `status`: `"approved"` ou `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` ou `"deny"`
- `binding`: la liaison résolue pour les demandes approuvées
- `request`: le résumé de la demande d'origine, l'indice de détachement, l'identifiant d'expéditeur et
  les métadonnées de conversation

Ce callback est uniquement une notification. Il ne modifie pas qui est autorisé à lier une
conversation, et il s'exécute après la fin du traitement d'approbation du cœur.

## Hooks runtime de fournisseur

Les plugins de fournisseur ont désormais deux couches :

- métadonnées du manifeste : `providerAuthEnvVars` pour une recherche bon marché de l'auth fournisseur via les variables d'environnement
  avant le chargement du runtime, `providerAuthAliases` pour les variantes de fournisseur qui partagent
  l'authentification, `channelEnvVars` pour une recherche bon marché de l'auth/de la configuration du canal avant
  le chargement du runtime, ainsi que `providerAuthChoices` pour des libellés bon marché
  d'onboarding/de choix d'authentification et des métadonnées de flags CLI avant le chargement du runtime
- hooks au moment de la configuration : `catalog` / `discovery` legacy plus `applyConfigDefaults`
- hooks runtime : `normalizeModelId`, `normalizeTransport`,
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

OpenClaw possède toujours la boucle générique d'agent, le failover, la gestion des transcriptions et la
politique d'outils. Ces hooks constituent la surface d'extension pour le comportement spécifique au fournisseur sans
nécessiter tout un transport d'inférence personnalisé.

Utilisez le manifeste `providerAuthEnvVars` lorsque le fournisseur possède des identifiants basés sur des variables d'environnement
que les chemins génériques auth/statut/sélecteur de modèles doivent voir sans charger le runtime du plugin.
Utilisez le manifeste `providerAuthAliases` lorsqu'un identifiant de fournisseur doit réutiliser
les variables d'environnement, profils d'auth, auth basée sur la configuration et choix d'onboarding par clé API
d'un autre identifiant de fournisseur. Utilisez le manifeste `providerAuthChoices` lorsque les surfaces
CLI d'onboarding/de choix d'auth doivent connaître l'identifiant de choix du fournisseur, les libellés de groupe et le câblage
simple d'authentification à un seul flag sans charger le runtime du fournisseur. Conservez le runtime de fournisseur
`envVars` pour les indices orientés opérateur tels que les libellés d'onboarding ou les variables
de configuration OAuth client-id/client-secret.

Utilisez le manifeste `channelEnvVars` lorsqu'un canal possède une auth ou une configuration pilotée par des variables d'environnement que
le fallback générique shell-env, les vérifications config/status ou les invites de configuration doivent voir
sans charger le runtime du canal.

### Ordre des hooks et utilisation

Pour les plugins de modèle/fournisseur, OpenClaw appelle les hooks dans cet ordre approximatif.
La colonne « Quand l'utiliser » est le guide de décision rapide.

| #   | Hook                              | Ce qu'il fait                                                                                                  | Quand l'utiliser                                                                                                                            |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publie la configuration du fournisseur dans `models.providers` pendant la génération de `models.json`         | Le fournisseur possède un catalogue ou des valeurs par défaut de base URL                                                                   |
| 2   | `applyConfigDefaults`             | Applique les valeurs par défaut globales de configuration du fournisseur lors de la matérialisation de la configuration | Les valeurs par défaut dépendent du mode d'auth, de l'environnement ou de la sémantique de la famille de modèles du fournisseur            |
| --  | _(recherche de modèle intégrée)_  | OpenClaw essaie d'abord le chemin normal de registre/catalogue                                                 | _(ce n'est pas un hook de plugin)_                                                                                                          |
| 3   | `normalizeModelId`                | Normalise les alias legacy ou preview d'identifiants de modèle avant la recherche                             | Le fournisseur possède le nettoyage des alias avant la résolution canonique du modèle                                                       |
| 4   | `normalizeTransport`              | Normalise `api` / `baseUrl` de la famille de fournisseurs avant l'assemblage générique du modèle              | Le fournisseur possède le nettoyage du transport pour des identifiants de fournisseur personnalisés dans la même famille de transport      |
| 5   | `normalizeConfig`                 | Normalise `models.providers.<id>` avant la résolution runtime/fournisseur                                      | Le fournisseur a besoin d'un nettoyage de configuration qui doit vivre avec le plugin ; les helpers intégrés de la famille Google servent aussi de filet de sécurité pour les entrées de configuration Google prises en charge |
| 6   | `applyNativeStreamingUsageCompat` | Applique des réécritures de compatibilité native d'usage de streaming aux fournisseurs de configuration        | Le fournisseur a besoin de correctifs de métadonnées d'usage de streaming dictés par l'endpoint                                           |
| 7   | `resolveConfigApiKey`             | Résout l'auth à marqueur d'environnement pour les fournisseurs de configuration avant le chargement de l'auth runtime | Le fournisseur possède sa propre résolution de clé API à marqueur d'environnement ; `amazon-bedrock` dispose aussi ici d'un résolveur intégré de marqueur d'environnement AWS |
| 8   | `resolveSyntheticAuth`            | Expose une auth locale/autohébergée ou basée sur la configuration sans persister de texte en clair            | Le fournisseur peut fonctionner avec un marqueur d'identifiant synthétique/local                                                           |
| 9   | `resolveExternalAuthProfiles`     | Superpose les profils d'auth externes appartenant au fournisseur ; la `persistence` par défaut est `runtime-only` pour les identifiants possédés par la CLI/l'app | Le fournisseur réutilise des identifiants d'auth externes sans persister de jetons d'actualisation copiés                                 |
| 10  | `shouldDeferSyntheticProfileAuth` | Relègue les placeholders de profil synthétique stockés derrière l'auth basée sur l'env/la configuration       | Le fournisseur stocke des profils placeholders synthétiques qui ne doivent pas avoir la priorité                                           |
| 11  | `resolveDynamicModel`             | Fallback synchrone pour les identifiants de modèle appartenant au fournisseur mais pas encore dans le registre local | Le fournisseur accepte des identifiants de modèle upstream arbitraires                                                                      |
| 12  | `prepareDynamicModel`             | Préchauffage asynchrone, puis `resolveDynamicModel` s'exécute de nouveau                                       | Le fournisseur a besoin de métadonnées réseau avant de résoudre des identifiants inconnus                                                  |
| 13  | `normalizeResolvedModel`          | Réécriture finale avant que le runner embarqué n'utilise le modèle résolu                                     | Le fournisseur a besoin de réécritures de transport tout en utilisant un transport du cœur                                                 |
| 14  | `contributeResolvedModelCompat`   | Apporte des drapeaux de compatibilité pour des modèles fournisseurs derrière un autre transport compatible     | Le fournisseur reconnaît ses propres modèles sur des transports proxy sans prendre la main sur le fournisseur                              |
| 15  | `capabilities`                    | Métadonnées de transcription/outillage appartenant au fournisseur et utilisées par la logique partagée du cœur | Le fournisseur a besoin de particularités de transcription/famille de fournisseur                                                           |
| 16  | `normalizeToolSchemas`            | Normalise les schémas d'outils avant que le runner embarqué ne les voie                                        | Le fournisseur a besoin d'un nettoyage de schéma propre à la famille de transport                                                           |
| 17  | `inspectToolSchemas`              | Expose les diagnostics de schéma appartenant au fournisseur après normalisation                                | Le fournisseur veut des avertissements sur des mots-clés sans enseigner au cœur des règles spécifiques au fournisseur                      |
| 18  | `resolveReasoningOutputMode`      | Sélectionne le contrat de sortie de raisonnement natif ou avec balises                                         | Le fournisseur a besoin d'une sortie raisonnement/finale avec balises plutôt que de champs natifs                                          |
| 19  | `prepareExtraParams`              | Normalisation des paramètres de requête avant les wrappers génériques d'options de stream                     | Le fournisseur a besoin de paramètres de requête par défaut ou d'un nettoyage par fournisseur                                              |
| 20  | `createStreamFn`                  | Remplace complètement le chemin de stream normal par un transport personnalisé                                 | Le fournisseur a besoin d'un protocole filaire personnalisé, pas seulement d'un wrapper                                                    |
| 21  | `wrapStreamFn`                    | Wrapper de stream après l'application des wrappers génériques                                                  | Le fournisseur a besoin de wrappers de compatibilité d'en-têtes/corps/modèle de requête sans transport personnalisé                       |
| 22  | `resolveTransportTurnState`       | Attache des en-têtes ou métadonnées natifs par tour de transport                                               | Le fournisseur veut que les transports génériques envoient une identité de tour native du fournisseur                                      |
| 23  | `resolveWebSocketSessionPolicy`   | Attache des en-têtes WebSocket natifs ou une politique de refroidissement de session                           | Le fournisseur veut que les transports WS génériques ajustent les en-têtes de session ou la politique de fallback                         |
| 24  | `formatApiKey`                    | Formateur de profil d'auth : le profil stocké devient la chaîne `apiKey` du runtime                           | Le fournisseur stocke des métadonnées d'auth supplémentaires et a besoin d'une forme de jeton runtime personnalisée                       |
| 25  | `refreshOAuth`                    | Surcharge d'actualisation OAuth pour des endpoints d'actualisation personnalisés ou une politique d'échec d'actualisation | Le fournisseur ne correspond pas aux actualisateurs partagés `pi-ai`                                                                       |
| 26  | `buildAuthDoctorHint`             | Indice de réparation ajouté lorsqu'une actualisation OAuth échoue                                              | Le fournisseur a besoin de sa propre guidance de réparation d'auth après échec d'actualisation                                            |
| 27  | `matchesContextOverflowError`     | Détecteur d'overflow de fenêtre de contexte appartenant au fournisseur                                         | Le fournisseur a des erreurs brutes d'overflow que les heuristiques génériques manqueraient                                                |
| 28  | `classifyFailoverReason`          | Classification de la raison de failover appartenant au fournisseur                                             | Le fournisseur peut mapper des erreurs brutes d'API/transport vers rate-limit/surcharge/etc.                                               |
| 29  | `isCacheTtlEligible`              | Politique de cache de prompt pour les fournisseurs proxy/backhaul                                              | Le fournisseur a besoin d'un filtrage TTL de cache spécifique au proxy                                                                     |
| 30  | `buildMissingAuthMessage`         | Remplacement du message générique de récupération d'auth manquante                                             | Le fournisseur a besoin de son propre indice de récupération d'auth manquante                                                              |
| 31  | `suppressBuiltInModel`            | Suppression d'un modèle upstream obsolète avec indice d'erreur orienté utilisateur en option                  | Le fournisseur a besoin de masquer des lignes upstream obsolètes ou de les remplacer par un indice fournisseur                            |
| 32  | `augmentModelCatalog`             | Lignes de catalogue synthétiques/finales ajoutées après la découverte                                          | Le fournisseur a besoin de lignes synthétiques de compatibilité ascendante dans `models list` et les sélecteurs                           |
| 33  | `isBinaryThinking`                | Bascule de raisonnement activé/désactivé pour les fournisseurs à raisonnement binaire                         | Le fournisseur n'expose qu'un mode binaire activé/désactivé                                                                                |
| 34  | `supportsXHighThinking`           | Prise en charge du raisonnement `xhigh` pour des modèles sélectionnés                                          | Le fournisseur veut `xhigh` uniquement sur un sous-ensemble de modèles                                                                     |
| 35  | `resolveDefaultThinkingLevel`     | Niveau `/think` par défaut pour une famille spécifique de modèles                                              | Le fournisseur possède la politique `/think` par défaut d'une famille de modèles                                                           |
| 36  | `isModernModelRef`                | Détecteur de modèle moderne pour les filtres de profils live et la sélection smoke                            | Le fournisseur possède la correspondance des modèles préférés live/smoke                                                                   |
| 37  | `prepareRuntimeAuth`              | Échange un identifiant configuré contre le vrai jeton/la vraie clé runtime juste avant l'inférence            | Le fournisseur a besoin d'un échange de jeton ou d'un identifiant de requête de courte durée                                               |
| 38  | `resolveUsageAuth`                | Résout les identifiants d'usage/de facturation pour `/usage` et les surfaces de statut associées              | Le fournisseur a besoin d'une analyse personnalisée du jeton d'usage/quota ou d'un autre identifiant d'usage                             |
| 39  | `fetchUsageSnapshot`              | Récupère et normalise des instantanés d'usage/quota propres au fournisseur après résolution de l'auth         | Le fournisseur a besoin d'un endpoint d'usage propre ou d'un parseur de charge utile                                                      |
| 40  | `createEmbeddingProvider`         | Construit un adaptateur d'embeddings appartenant au fournisseur pour mémoire/recherche                         | Le comportement d'embedding mémoire appartient au plugin fournisseur                                                                       |
| 41  | `buildReplayPolicy`               | Renvoie une politique de replay contrôlant la gestion des transcriptions pour le fournisseur                   | Le fournisseur a besoin d'une politique de transcription personnalisée (par ex. suppression de blocs de réflexion)                        |
| 42  | `sanitizeReplayHistory`           | Réécrit l'historique de replay après le nettoyage générique des transcriptions                                 | Le fournisseur a besoin de réécritures de replay spécifiques au fournisseur au-delà des helpers de compaction partagés                    |
| 43  | `validateReplayTurns`             | Validation ou remodelage final des tours de replay avant le runner embarqué                                    | Le transport du fournisseur a besoin d'une validation plus stricte des tours après l'assainissement générique                             |
| 44  | `onModelSelected`                 | Exécute des effets de bord appartenant au fournisseur après sélection d'un modèle                              | Le fournisseur a besoin de télémétrie ou d'état possédé par le fournisseur lorsqu'un modèle devient actif                                 |

`normalizeModelId`, `normalizeTransport` et `normalizeConfig` vérifient d'abord le
plugin fournisseur correspondant, puis passent aux autres plugins fournisseurs capables de hooks
jusqu'à ce que l'un change réellement l'identifiant de modèle ou le transport/la configuration. Cela permet aux
shims de compatibilité/alias de fournisseur de fonctionner sans obliger l'appelant à savoir quel
plugin intégré possède la réécriture. Si aucun hook de fournisseur ne réécrit une entrée de configuration
Google prise en charge, le normaliseur de configuration Google intégré applique quand même ce nettoyage de compatibilité.

Si le fournisseur a besoin d'un protocole filaire entièrement personnalisé ou d'un exécuteur de requête personnalisé,
il s'agit d'une autre classe d'extension. Ces hooks concernent un comportement de fournisseur
qui s'exécute toujours sur la boucle normale d'inférence d'OpenClaw.

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
  et `wrapStreamFn` parce qu'il possède la compatibilité ascendante de Claude 4.6,
  les indices de famille de fournisseurs, la guidance de réparation d'auth, l'intégration
  de l'endpoint d'usage, l'éligibilité au cache de prompt, les valeurs par défaut de configuration conscientes de l'auth,
  la politique de réflexion par défaut/adaptative de Claude, et la mise en forme spécifique à Anthropic
  des streams pour les en-têtes bêta, `/fast` / `serviceTier`, et `context1m`.
- Les helpers de stream spécifiques à Claude d'Anthropic restent pour l'instant dans le seam
  public propre au plugin intégré `api.ts` / `contract-api.ts`. Cette surface de paquet
  exporte `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`, et les constructeurs de wrappers
  Anthropic de plus bas niveau au lieu d'élargir le SDK générique autour des règles d'en-têtes bêta
  d'un seul fournisseur.
- OpenAI utilise `resolveDynamicModel`, `normalizeResolvedModel`, et
  `capabilities` ainsi que `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `supportsXHighThinking`, et `isModernModelRef`
  parce qu'il possède la compatibilité ascendante GPT-5.4, la normalisation directe OpenAI
  `openai-completions` -> `openai-responses`, les indices d'auth sensibles à Codex,
  la suppression de Spark, les lignes synthétiques de liste OpenAI, et la politique
  de réflexion / modèle live de GPT-5 ; la famille de stream `openai-responses-defaults` possède les
  wrappers natifs partagés d'OpenAI Responses pour les en-têtes d'attribution,
  `/fast`/`serviceTier`, la verbosité du texte, la recherche web native Codex,
  la mise en forme de charge utile de compatibilité du raisonnement et la gestion du contexte Responses.
- OpenRouter utilise `catalog` ainsi que `resolveDynamicModel` et
  `prepareDynamicModel` car le fournisseur est en pass-through et peut exposer de nouveaux
  identifiants de modèle avant la mise à jour du catalogue statique d'OpenClaw ; il utilise aussi
  `capabilities`, `wrapStreamFn`, et `isCacheTtlEligible` pour garder
  hors du cœur les en-têtes de requête spécifiques au fournisseur, les métadonnées de routage, les correctifs de raisonnement
  et la politique de cache de prompt. Sa politique de replay vient de la
  famille `passthrough-gemini`, tandis que la famille de stream `openrouter-thinking`
  possède l'injection de raisonnement proxy et les ignorances de modèles non pris en charge / `auto`.
- GitHub Copilot utilise `catalog`, `auth`, `resolveDynamicModel`, et
  `capabilities` ainsi que `prepareRuntimeAuth` et `fetchUsageSnapshot` parce qu'il
  a besoin d'une connexion appareil appartenant au fournisseur, d'un comportement de fallback de modèle, de particularités
  de transcription Claude, d'un échange de jeton GitHub -> jeton Copilot, et d'un endpoint
  d'usage appartenant au fournisseur.
- OpenAI Codex utilise `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth`, et `augmentModelCatalog` ainsi que
  `prepareExtraParams`, `resolveUsageAuth`, et `fetchUsageSnapshot` parce qu'il
  s'exécute toujours sur les transports OpenAI du cœur mais possède sa normalisation de
  transport/base URL, sa politique de fallback d'actualisation OAuth, son choix de transport par défaut,
  ses lignes synthétiques de catalogue Codex, et l'intégration à l'endpoint d'usage ChatGPT ; il
  partage la même famille de stream `openai-responses-defaults` que l'OpenAI direct.
- Google AI Studio et Gemini CLI OAuth utilisent `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn`, et `isModernModelRef` parce que la
  famille de replay `google-gemini` possède le fallback de compatibilité ascendante Gemini 3.1,
  la validation native du replay Gemini, l'assainissement du replay de bootstrap, le mode
  de sortie de raisonnement avec balises, et la correspondance de modèles modernes, tandis que la
  famille de stream `google-thinking` possède la normalisation de la charge utile de réflexion Gemini ;
  Gemini CLI OAuth utilise aussi `formatApiKey`, `resolveUsageAuth`, et
  `fetchUsageSnapshot` pour le formatage des jetons, l'analyse des jetons et le câblage
  des endpoints de quota.
- Anthropic Vertex utilise `buildReplayPolicy` via la
  famille de replay `anthropic-by-model` afin que le nettoyage du replay spécifique à Claude reste
  limité aux identifiants Claude plutôt qu'à tout transport `anthropic-messages`.
- Amazon Bedrock utilise `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason`, et `resolveDefaultThinkingLevel` parce qu'il possède la
  classification des erreurs spécifiques à Bedrock de limitation/pas prêt/dépassement de contexte
  pour le trafic Anthropic-sur-Bedrock ; sa politique de replay partage toujours le même garde-fou
  `anthropic-by-model` réservé à Claude.
- OpenRouter, Kilocode, Opencode et Opencode Go utilisent `buildReplayPolicy`
  via la famille de replay `passthrough-gemini` parce qu'ils proxifient des modèles Gemini
  à travers des transports compatibles OpenAI et ont besoin de l'assainissement
  de signature de pensée Gemini sans validation native du replay Gemini ni réécritures
  de bootstrap.
- MiniMax utilise `buildReplayPolicy` via la
  famille de replay `hybrid-anthropic-openai` parce qu'un seul fournisseur possède à la fois
  des sémantiques Anthropic-message et OpenAI-compatibles ; il conserve la suppression
  des blocs de réflexion réservés à Claude du côté Anthropic tout en rétablissant le mode de sortie de raisonnement en natif,
  et la famille de stream `minimax-fast-mode` possède les réécritures de modèles en mode rapide
  sur le chemin de stream partagé.
- Moonshot utilise `catalog` ainsi que `wrapStreamFn` parce qu'il utilise toujours le
  transport OpenAI partagé mais a besoin d'une normalisation de charge utile de réflexion appartenant au fournisseur ; la
  famille de stream `moonshot-thinking` mappe la configuration ainsi que l'état `/think` sur sa
  charge utile native de réflexion binaire.
- Kilocode utilise `catalog`, `capabilities`, `wrapStreamFn`, et
  `isCacheTtlEligible` parce qu'il a besoin d'en-têtes de requête appartenant au fournisseur,
  de la normalisation de charge utile de raisonnement, d'indices de transcription Gemini, et d'un filtrage
  TTL de cache Anthropic ; la famille de stream `kilocode-thinking` conserve l'injection
  de réflexion Kilo sur le chemin de stream proxy partagé tout en ignorant `kilo/auto` et
  d'autres identifiants de modèles proxy qui ne prennent pas en charge des charges utiles de raisonnement explicites.
- Z.AI utilise `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `isBinaryThinking`, `isModernModelRef`,
  `resolveUsageAuth`, et `fetchUsageSnapshot` parce qu'il possède le fallback GLM-5,
  les valeurs par défaut `tool_stream`, l'expérience utilisateur de réflexion binaire, la correspondance de modèles modernes,
  ainsi que l'auth d'usage + la récupération de quota ; la famille de stream `tool-stream-default-on`
  évite que le wrapper `tool_stream` activé par défaut ne se retrouve dans du code manuel
  propre à chaque fournisseur.
- xAI utilise `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel`, et `isModernModelRef`
  parce qu'il possède la normalisation native du transport xAI Responses, les réécritures
  d'alias Grok fast-mode, la valeur par défaut `tool_stream`, le nettoyage strict-tool / charge utile de raisonnement,
  la réutilisation de l'auth fallback pour les outils appartenant au plugin, la résolution
  de modèles Grok à compatibilité ascendante, ainsi que des correctifs de compatibilité
  appartenant au fournisseur tels que le profil de schéma d'outil xAI, les mots-clés de schéma non pris en charge,
  le `web_search` natif, et le décodage des arguments d'appel d'outil en entités HTML.
- Mistral, OpenCode Zen et OpenCode Go utilisent `capabilities` uniquement pour garder
  hors du cœur les particularités de transcription/outillage.
- Les fournisseurs intégrés limités au catalogue tels que `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway`, et `volcengine` utilisent
  uniquement `catalog`.
- Qwen utilise `catalog` pour son fournisseur de texte ainsi que des enregistrements partagés
  de compréhension des médias et de génération de vidéo pour ses surfaces multimodales.
- MiniMax et Xiaomi utilisent `catalog` ainsi que des hooks d'usage parce que leur comportement `/usage`
  appartient au plugin même si l'inférence passe toujours par les transports partagés.

## Helpers runtime

Les plugins peuvent accéder à certains helpers du cœur via `api.runtime`. Pour TTS :

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
- Utilise la configuration du cœur `messages.tts` et la sélection du fournisseur.
- Renvoie un tampon audio PCM + une fréquence d'échantillonnage. Les plugins doivent rééchantillonner/encoder pour les fournisseurs.
- `listVoices` est facultatif selon le fournisseur. Utilisez-le pour les sélecteurs de voix ou les flux de configuration appartenant au fournisseur.
- Les listes de voix peuvent inclure des métadonnées plus riches telles que la locale, le genre et des tags de personnalité pour des sélecteurs sensibles au fournisseur.
- OpenAI et ElevenLabs prennent aujourd'hui en charge la téléphonie. Microsoft non.

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

- Conservez la politique TTS, le fallback et la livraison des réponses dans le cœur.
- Utilisez les fournisseurs de parole pour le comportement de synthèse appartenant au fournisseur.
- L'entrée legacy Microsoft `edge` est normalisée vers l'identifiant de fournisseur `microsoft`.
- Le modèle de propriété préféré est orienté entreprise : un seul plugin fournisseur peut posséder
  le texte, la parole, l'image et de futurs fournisseurs de médias à mesure qu'OpenClaw ajoute ces
  contrats de capacité.

Pour la compréhension d'image/audio/vidéo, les plugins enregistrent un
fournisseur typé de compréhension des médias au lieu d'un sac générique clé/valeur :

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

- Conservez l'orchestration, le fallback, la configuration et le câblage des canaux dans le cœur.
- Conservez le comportement fournisseur dans le plugin fournisseur.
- L'expansion additive doit rester typée : nouvelles méthodes facultatives, nouveaux champs
  de résultat facultatifs, nouvelles capacités facultatives.
- La génération de vidéo suit déjà le même modèle :
  - le cœur possède le contrat de capacité et le helper runtime
  - les plugins fournisseurs enregistrent `api.registerVideoGenerationProvider(...)`
  - les plugins de fonctionnalité/de canal consomment `api.runtime.videoGeneration.*`

Pour les helpers runtime de compréhension des médias, les plugins peuvent appeler :

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

Pour la transcription audio, les plugins peuvent utiliser soit le runtime de compréhension des médias
soit l'ancien alias STT :

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Facultatif lorsque le type MIME ne peut pas être déduit de manière fiable :
  mime: "audio/ogg",
});
```

Remarques :

- `api.runtime.mediaUnderstanding.*` est la surface partagée préférée pour la
  compréhension d'image/audio/vidéo.
- Utilise la configuration audio du cœur pour la compréhension des médias (`tools.media.audio`) et l'ordre de fallback des fournisseurs.
- Renvoie `{ text: undefined }` lorsqu'aucune sortie de transcription n'est produite (par exemple entrée ignorée/non prise en charge).
- `api.runtime.stt.transcribeAudioFile(...)` reste un alias de compatibilité.

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

- `provider` et `model` sont des surcharges facultatives par exécution, pas des changements persistants de session.
- OpenClaw n'honore ces champs de surcharge que pour les appelants de confiance.
- Pour les exécutions de secours appartenant à un plugin, les opérateurs doivent activer explicitement `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Utilisez `plugins.entries.<id>.subagent.allowedModels` pour restreindre les plugins de confiance à des cibles canoniques spécifiques `provider/model`, ou `"*"` pour autoriser explicitement n'importe quelle cible.
- Les exécutions de sous-agent de plugins non fiables fonctionnent toujours, mais les demandes de surcharge sont rejetées au lieu de retomber silencieusement.

Pour la recherche web, les plugins peuvent consommer le helper runtime partagé au lieu
d'accéder au câblage de l'outil de l'agent :

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

Les plugins peuvent aussi enregistrer des fournisseurs de recherche web via
`api.registerWebSearchProvider(...)`.

Remarques :

- Conservez la sélection du fournisseur, la résolution des identifiants et la sémantique de requête partagée dans le cœur.
- Utilisez les fournisseurs de recherche web pour les transports de recherche spécifiques à un fournisseur.
- `api.runtime.webSearch.*` est la surface partagée préférée pour les plugins de fonctionnalité/de canal qui ont besoin d'un comportement de recherche sans dépendre du wrapper de l'outil d'agent.

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

- `generate(...)`: générer une image à l'aide de la chaîne de fournisseurs configurée pour la génération d'images.
- `listProviders(...)`: lister les fournisseurs disponibles pour la génération d'images et leurs capacités.

## Routes HTTP Gateway

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

Champs de la route :

- `path`: chemin de route sous le serveur HTTP gateway.
- `auth`: obligatoire. Utilisez `"gateway"` pour exiger l'auth normale de la gateway, ou `"plugin"` pour l'auth gérée par le plugin/la vérification de webhook.
- `match`: facultatif. `"exact"` (par défaut) ou `"prefix"`.
- `replaceExisting`: facultatif. Permet au même plugin de remplacer son propre enregistrement de route existant.
- `handler`: renvoyez `true` lorsque la route a traité la requête.

Remarques :

- `api.registerHttpHandler(...)` a été supprimé et provoquera une erreur de chargement du plugin. Utilisez `api.registerHttpRoute(...)` à la place.
- Les routes de plugin doivent déclarer `auth` explicitement.
- Les conflits exacts `path + match` sont rejetés sauf si `replaceExisting: true`, et un plugin ne peut pas remplacer la route d'un autre plugin.
- Les routes qui se chevauchent avec des niveaux `auth` différents sont rejetées. Gardez les chaînes de retombée `exact`/`prefix` au même niveau d'auth uniquement.
- Les routes `auth: "plugin"` ne reçoivent **pas** automatiquement les portées runtime de l'opérateur. Elles sont destinées aux webhooks/vérifications de signature gérés par le plugin, pas aux appels privilégiés aux helpers Gateway.
- Les routes `auth: "gateway"` s'exécutent dans une portée runtime de requête Gateway, mais cette portée est volontairement conservatrice :
  - l'auth bearer à secret partagé (`gateway.auth.mode = "token"` / `"password"`) maintient les portées runtime des routes de plugin fixées à `operator.write`, même si l'appelant envoie `x-openclaw-scopes`
  - les modes HTTP de confiance portant une identité (par exemple `trusted-proxy` ou `gateway.auth.mode = "none"` sur une entrée privée) n'honorent `x-openclaw-scopes` que lorsque l'en-tête est explicitement présent
  - si `x-openclaw-scopes` est absent sur ces requêtes de route de plugin portant une identité, la portée runtime retombe sur `operator.write`
- Règle pratique : ne partez pas du principe qu'une route de plugin avec auth gateway est implicitement une surface admin. Si votre route a besoin d'un comportement réservé à l'administration, exigez un mode d'auth portant une identité et documentez le contrat explicite de l'en-tête `x-openclaw-scopes`.

## Chemins d'import du Plugin SDK

Utilisez les sous-chemins du SDK au lieu de l'import monolithique `openclaw/plugin-sdk` lorsque
vous développez des plugins :

- `openclaw/plugin-sdk/plugin-entry` pour les primitives d'enregistrement de plugin.
- `openclaw/plugin-sdk/core` pour le contrat générique partagé orienté plugin.
- `openclaw/plugin-sdk/config-schema` pour l'export du schéma Zod racine `openclaw.json`
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
  `openclaw/plugin-sdk/secret-input`, et
  `openclaw/plugin-sdk/webhook-ingress` pour le câblage partagé de configuration/auth/réponse/webhook.
  `channel-inbound` est le foyer partagé pour l'anti-rebond, la correspondance des mentions,
  les helpers de politique de mention entrante, le formatage des enveloppes et les helpers de contexte
  d'enveloppe entrante.
  `channel-setup` est le seam étroit de configuration à installation facultative.
  `setup-runtime` est la surface de configuration sûre à l'exécution utilisée par `setupEntry` /
  le démarrage différé, y compris les adaptateurs de patch de configuration sûrs à l'import.
  `setup-adapter-runtime` est le seam d'adaptateur de configuration de compte sensible à l'environnement.
  `setup-tools` est le petit seam helper CLI/archive/docs (`formatCliCommand`,
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
  `openclaw/plugin-sdk/runtime-store`, et
  `openclaw/plugin-sdk/directory-runtime` pour des helpers runtime/config partagés.
  `telegram-command-config` est le seam public étroit pour la normalisation/validation des commandes personnalisées Telegram et reste disponible même si la surface de contrat Telegram intégrée est temporairement indisponible.
  `text-runtime` est le seam partagé texte/markdown/journalisation, incluant
  la suppression du texte visible par l'assistant, les helpers de rendu/segmentation Markdown, les helpers de masquage,
  les helpers de balises de directive et les utilitaires de texte sûr.
- Les seams de canal spécifiques à l'approbation doivent préférer un unique contrat `approvalCapability`
  sur le plugin. Le cœur lit ensuite l'auth, la livraison, le rendu,
  le routage natif et le comportement lazy de gestionnaire natif via cette seule capacité
  au lieu de mélanger le comportement d'approbation à des champs de plugin non liés.
- `openclaw/plugin-sdk/channel-runtime` est obsolète et ne subsiste que comme shim
  de compatibilité pour d'anciens plugins. Le nouveau code doit importer les primitives génériques plus étroites à la place, et le code du dépôt ne doit pas ajouter de nouveaux imports du shim.
- Les éléments internes des extensions intégrées restent privés. Les plugins externes ne doivent utiliser que les sous-chemins `openclaw/plugin-sdk/*`. Le code cœur/test d'OpenClaw peut utiliser les points d'entrée publics du dépôt sous une racine de paquet de plugin tels que `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js`, et des fichiers à portée étroite tels que
  `login-qr-api.js`. N'importez jamais le `src/*` d'un paquet de plugin depuis le cœur ou depuis une autre extension.
- Scission des points d'entrée du dépôt :
  `<plugin-package-root>/api.js` est le barrel helper/types,
  `<plugin-package-root>/runtime-api.js` est le barrel réservé au runtime,
  `<plugin-package-root>/index.js` est l'entrée du plugin intégré,
  et `<plugin-package-root>/setup-entry.js` est l'entrée du plugin de configuration.
- Exemples actuels de fournisseurs intégrés :
  - Anthropic utilise `api.js` / `contract-api.js` pour les helpers de stream Claude tels que
    `wrapAnthropicProviderStream`, les helpers d'en-tête bêta, et l'analyse de `service_tier`.
  - OpenAI utilise `api.js` pour les constructeurs de fournisseurs, les helpers de modèle par défaut, et les constructeurs de fournisseurs temps réel.
  - OpenRouter utilise `api.js` pour son constructeur de fournisseur ainsi que des helpers d'onboarding/configuration, tandis que `register.runtime.js` peut toujours réexporter des helpers génériques `plugin-sdk/provider-stream` pour un usage local au dépôt.
- Les points d'entrée publics chargés via façade préfèrent l'instantané actif de configuration runtime lorsqu'il existe, puis reviennent au fichier de configuration résolu sur disque lorsqu'OpenClaw ne sert pas encore d'instantané runtime.
- Les primitives génériques partagées restent le contrat public préféré du SDK. Un petit ensemble réservé de compatibilité de seams helper de marque de canal intégrés existe encore. Traitez-les comme des seams de maintenance/compatibilité pour intégrés, pas comme de nouvelles cibles d'import pour des tiers ; les nouveaux contrats inter-canaux doivent toujours atterrir sur des sous-chemins génériques `plugin-sdk/*` ou sur les barrels locaux `api.js` / `runtime-api.js` du plugin.

Note de compatibilité :

- Évitez le barrel racine `openclaw/plugin-sdk` pour le nouveau code.
- Préférez d'abord les primitives stables étroites. Les sous-chemins plus récents de configuration/appairage/réponse/
  feedback/contrat/entrant/threading/commande/secret-input/webhook/infra/
  allowlist/status/message-tool constituent le contrat visé pour les nouveaux
  plugins intégrés et externes.
  L'analyse/la correspondance des cibles appartient à `openclaw/plugin-sdk/channel-targets`.
  Les garde-fous d'action de message et les helpers d'identifiant de message de réaction appartiennent à
  `openclaw/plugin-sdk/channel-actions`.
- Les barrels helper spécifiques à une extension intégrée ne sont pas stables par défaut. Si un
  helper n'est nécessaire que pour une extension intégrée, gardez-le derrière le seam local
  `api.js` ou `runtime-api.js` de l'extension au lieu de le promouvoir dans
  `openclaw/plugin-sdk/<extension>`.
- Les nouveaux seams helper partagés doivent être génériques, pas marqués par un canal. L'analyse
  partagée des cibles appartient à `openclaw/plugin-sdk/channel-targets` ; les éléments internes
  spécifiques au canal restent derrière le seam local `api.js` ou `runtime-api.js` du plugin propriétaire.
- Des sous-chemins spécifiques à une capacité tels que `image-generation`,
  `media-understanding` et `speech` existent parce que les plugins natifs/intégrés les utilisent aujourd'hui. Leur présence ne signifie pas à elle seule que chaque helper exporté est un contrat externe figé à long terme.

## Schémas d'outil de message

Les plugins doivent posséder les contributions de schéma spécifiques au canal de `describeMessageTool(...)`.
Conservez les champs spécifiques au fournisseur dans le plugin, pas dans le cœur partagé.

Pour des fragments de schéma portables partagés, réutilisez les helpers génériques exportés via
`openclaw/plugin-sdk/channel-actions` :

- `createMessageToolButtonsSchema()` pour les charges utiles de style grille de boutons
- `createMessageToolCardSchema()` pour les charges utiles de carte structurée

Si une forme de schéma n'a de sens que pour un fournisseur, définissez-la dans la
propre source de ce plugin au lieu de la promouvoir dans le SDK partagé.

## Résolution des cibles de canal

Les plugins de canal doivent posséder la sémantique des cibles propre au canal. Gardez l'hôte
sortant partagé générique et utilisez la surface de l'adaptateur de messagerie pour les règles du fournisseur :

- `messaging.inferTargetChatType({ to })` décide si une cible normalisée
  doit être traitée comme `direct`, `group`, ou `channel` avant la recherche dans l'annuaire.
- `messaging.targetResolver.looksLikeId(raw, normalized)` indique au cœur si une
  entrée doit passer directement à une résolution de type identifiant au lieu d'une recherche dans l'annuaire.
- `messaging.targetResolver.resolveTarget(...)` est le fallback du plugin lorsque le
  cœur a besoin d'une résolution finale appartenant au fournisseur après normalisation ou après un échec d'annuaire.
- `messaging.resolveOutboundSessionRoute(...)` possède la construction de route de session spécifique au fournisseur une fois la cible résolue.

Répartition recommandée :

- Utilisez `inferTargetChatType` pour les décisions de catégorie qui doivent se produire avant
  la recherche dans les pairs/groupes.
- Utilisez `looksLikeId` pour les vérifications « traiter ceci comme un identifiant de cible explicite/natif ».
- Utilisez `resolveTarget` pour le fallback de normalisation spécifique au fournisseur, pas pour une recherche large dans l'annuaire.
- Conservez les identifiants natifs du fournisseur tels que les identifiants de chat, de fil, les JID, handles et identifiants de salle dans les valeurs `target` ou les paramètres spécifiques au fournisseur, pas dans des champs SDK génériques.

## Annuaires adossés à la configuration

Les plugins qui dérivent des entrées d'annuaire à partir de la configuration doivent conserver cette logique dans le
plugin et réutiliser les helpers partagés de
`openclaw/plugin-sdk/directory-runtime`.

Utilisez ceci lorsqu'un canal a besoin de pairs/groupes adossés à la configuration tels que :

- pairs DM pilotés par une liste d'autorisation
- cartes de canaux/groupes configurées
- fallbacks statiques d'annuaire à portée de compte

Les helpers partagés de `directory-runtime` ne gèrent que des opérations génériques :

- filtrage de requête
- application de limites
- helpers de déduplication/normalisation
- construction de `ChannelDirectoryEntry[]`

L'inspection de compte spécifique au canal et la normalisation des identifiants doivent rester dans l'implémentation du plugin.

## Catalogues de fournisseurs

Les plugins de fournisseur peuvent définir des catalogues de modèles pour l'inférence avec
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` renvoie la même forme que celle écrite par OpenClaw dans
`models.providers` :

- `{ provider }` pour une entrée de fournisseur
- `{ providers }` pour plusieurs entrées de fournisseur

Utilisez `catalog` lorsque le plugin possède des identifiants de modèle, des valeurs par défaut de base URL
ou des métadonnées de modèle conditionnées par l'auth propres au fournisseur.

`catalog.order` contrôle le moment auquel le catalogue d'un plugin fusionne par rapport aux
fournisseurs implicites intégrés d'OpenClaw :

- `simple`: fournisseurs simples pilotés par clé API ou variables d'environnement
- `profile`: fournisseurs qui apparaissent lorsqu'il existe des profils d'auth
- `paired`: fournisseurs qui synthétisent plusieurs entrées de fournisseur liées
- `late`: dernier passage, après les autres fournisseurs implicites

Les fournisseurs plus tardifs gagnent en cas de collision de clé, de sorte que les plugins peuvent
remplacer intentionnellement une entrée de fournisseur intégrée ayant le même identifiant.

Compatibilité :

- `discovery` fonctionne toujours comme alias legacy
- si `catalog` et `discovery` sont tous deux enregistrés, OpenClaw utilise `catalog`

## Inspection en lecture seule des canaux

Si votre plugin enregistre un canal, préférez implémenter
`plugin.config.inspectAccount(cfg, accountId)` en même temps que `resolveAccount(...)`.

Pourquoi :

- `resolveAccount(...)` est le chemin runtime. Il peut supposer que les identifiants
  sont entièrement matérialisés et échouer rapidement si les secrets requis sont absents.
- Les chemins de commande en lecture seule tels que `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, et les flux de réparation
  doctor/config ne devraient pas avoir besoin de matérialiser des identifiants runtime simplement pour
  décrire la configuration.

Comportement recommandé pour `inspectAccount(...)` :

- Renvoyer uniquement un état descriptif du compte.
- Préserver `enabled` et `configured`.
- Inclure les champs de source/statut d'identifiants quand c'est pertinent, comme :
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Vous n'avez pas besoin de renvoyer les valeurs brutes des jetons simplement pour signaler une disponibilité en lecture seule. Renvoyer `tokenStatus: "available"` (et le champ source correspondant) suffit pour des commandes de type statut.
- Utilisez `configured_unavailable` lorsqu'un identifiant est configuré via SecretRef mais indisponible sur le chemin de commande actuel.

Cela permet aux commandes en lecture seule de signaler « configuré mais indisponible sur ce chemin de commande »
au lieu de planter ou de rapporter à tort que le compte n'est pas configuré.

## Packs de paquets

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

Chaque entrée devient un plugin. Si le pack liste plusieurs extensions, l'identifiant du plugin
devient `name/<fileBase>`.

Si votre plugin importe des dépendances npm, installez-les dans ce répertoire afin que
`node_modules` soit disponible (`npm install` / `pnpm install`).

Garde-fou de sécurité : chaque entrée `openclaw.extensions` doit rester à l'intérieur du répertoire du plugin
après résolution des liens symboliques. Les entrées qui sortent du répertoire du paquet sont
rejetées.

Note de sécurité : `openclaw plugins install` installe les dépendances de plugin avec
`npm install --omit=dev --ignore-scripts` (sans scripts de cycle de vie, sans dépendances de développement à l'exécution). Gardez les arbres de dépendances des plugins en « JS/TS pur » et évitez les paquets qui exigent des builds `postinstall`.

Facultatif : `openclaw.setupEntry` peut pointer vers un module léger réservé à la configuration.
Lorsque OpenClaw a besoin de surfaces de configuration pour un plugin de canal désactivé, ou
lorsqu'un plugin de canal est activé mais encore non configuré, il charge `setupEntry`
au lieu de l'entrée complète du plugin. Cela allège le démarrage et la configuration
quand l'entrée principale du plugin câble aussi des outils, hooks ou autre code
réservé au runtime.

Facultatif : `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
peut faire entrer un plugin de canal dans le même chemin `setupEntry` pendant la phase de
démarrage pré-écoute de la gateway, même lorsque le canal est déjà configuré.

Utilisez cela uniquement si `setupEntry` couvre complètement la surface de démarrage qui doit exister
avant que la gateway ne commence à écouter. En pratique, cela signifie que l'entrée de configuration
doit enregistrer chaque capacité appartenant au canal dont le démarrage dépend, par exemple :

- l'enregistrement du canal lui-même
- toutes les routes HTTP qui doivent être disponibles avant que la gateway ne commence à écouter
- toutes les méthodes gateway, outils ou services qui doivent exister dans cette même fenêtre

Si votre entrée complète possède encore une capacité de démarrage requise, n'activez pas
ce drapeau. Conservez le comportement par défaut du plugin et laissez OpenClaw charger
l'entrée complète au démarrage.

Les canaux intégrés peuvent aussi publier des helpers de surface de contrat réservés à la configuration que le cœur
peut consulter avant que le runtime complet du canal soit chargé. La surface actuelle de promotion de configuration est :

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Le cœur utilise cette surface lorsqu'il doit promouvoir une configuration legacy de canal à compte unique
dans `channels.<id>.accounts.*` sans charger l'entrée complète du plugin.
Matrix est l'exemple intégré actuel : il ne déplace que les clés d'auth/bootstrap dans un
compte promu nommé lorsque des comptes nommés existent déjà, et il peut préserver
une clé de compte par défaut configurée non canonique au lieu de toujours créer
`accounts.default`.

Ces adaptateurs de patch de configuration gardent la découverte de surface de contrat intégrée paresseuse. Le temps
d'import reste léger ; la surface de promotion n'est chargée qu'au premier usage au lieu de
réentrer dans le démarrage du canal intégré à l'import du module.

Lorsque ces surfaces de démarrage incluent des méthodes RPC gateway, conservez-les sur un
préfixe spécifique au plugin. Les espaces de noms admin du cœur (`config.*`,
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
des indices d'installation via `openclaw.install`. Cela permet au cœur de rester sans données de catalogue.

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

Champs utiles de `openclaw.channel` au-delà de l'exemple minimal :

- `detailLabel`: libellé secondaire pour des surfaces plus riches de catalogue/statut
- `docsLabel`: surcharge du texte du lien de documentation
- `preferOver`: identifiants de plugin/canal de priorité inférieure que cette entrée de catalogue doit dépasser
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: contrôles de copie de la surface de sélection
- `markdownCapable`: marque le canal comme capable de Markdown pour les décisions de formatage sortant
- `exposure.configured`: masque le canal des surfaces de liste des canaux configurés lorsqu'il vaut `false`
- `exposure.setup`: masque le canal des sélecteurs interactifs de configuration lorsqu'il vaut `false`
- `exposure.docs`: marque le canal comme interne/privé pour les surfaces de navigation de documentation
- `showConfigured` / `showInSetup`: alias legacy encore acceptés pour compatibilité ; préférez `exposure`
- `quickstartAllowFrom`: fait entrer le canal dans le flux standard quickstart `allowFrom`
- `forceAccountBinding`: exige une liaison de compte explicite même lorsqu'un seul compte existe
- `preferSessionLookupForAnnounceTarget`: préfère la recherche de session lors de la résolution des cibles d'annonce

OpenClaw peut aussi fusionner des **catalogues de canaux externes** (par exemple un export
de registre MPM). Déposez un fichier JSON à l'un de ces emplacements :

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Ou pointez `OPENCLAW_PLUGIN_CATALOG_PATHS` (ou `OPENCLAW_MPM_CATALOG_PATHS`) vers
un ou plusieurs fichiers JSON (délimités par virgule/point-virgule/`PATH`). Chaque fichier doit
contenir `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. L'analyseur accepte aussi `"packages"` ou `"plugins"` comme alias legacy de la clé `"entries"`.

## Plugins de moteur de contexte

Les plugins de moteur de contexte possèdent l'orchestration du contexte de session pour l'ingestion, l'assemblage
et la compaction. Enregistrez-les depuis votre plugin avec
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

Si votre moteur ne possède **pas** l'algorithme de compaction, gardez `compact()`
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

Lorsqu'un plugin a besoin d'un comportement qui ne correspond pas à l'API actuelle, ne contournez pas
le système de plugins par un accès privé. Ajoutez la capacité manquante.

Séquence recommandée :

1. définir le contrat du cœur
   Décidez quel comportement partagé le cœur doit posséder : politique, fallback, fusion de configuration,
   cycle de vie, sémantique côté canal et forme du helper runtime.
2. ajouter des surfaces typées d'enregistrement/runtime pour les plugins
   Étendez `OpenClawPluginApi` et/ou `api.runtime` avec la plus petite
   surface de capacité typée utile.
3. câbler les consommateurs cœur + canal/fonctionnalité
   Les canaux et plugins de fonctionnalité doivent consommer la nouvelle capacité via le cœur,
   pas en important directement une implémentation fournisseur.
4. enregistrer les implémentations fournisseurs
   Les plugins fournisseurs enregistrent ensuite leurs backends sur cette capacité.
5. ajouter une couverture de contrat
   Ajoutez des tests pour que la propriété et la forme d'enregistrement restent explicites au fil du temps.

C'est ainsi qu'OpenClaw reste affirmé sans devenir codé en dur selon la vision du monde
d'un fournisseur unique. Voir le [Capability Cookbook](/fr/plugins/architecture)
pour une checklist concrète de fichiers et un exemple détaillé.

### Checklist de capacité

Lorsque vous ajoutez une nouvelle capacité, l'implémentation doit en général toucher
ensemble les surfaces suivantes :

- types de contrat du cœur dans `src/<capability>/types.ts`
- runner/helper runtime du cœur dans `src/<capability>/runtime.ts`
- surface d'enregistrement de l'API des plugins dans `src/plugins/types.ts`
- câblage du registre de plugins dans `src/plugins/registry.ts`
- exposition du runtime des plugins dans `src/plugins/runtime/*` lorsque des plugins de fonctionnalité/de canal doivent le consommer
- helpers de capture/test dans `src/test-utils/plugin-registration.ts`
- assertions de propriété/contrat dans `src/plugins/contracts/registry.ts`
- documentation opérateur/plugin dans `docs/`

Si l'une de ces surfaces manque, c'est généralement le signe que la capacité n'est
pas encore entièrement intégrée.

### Modèle de capacité

Modèle minimal :

```ts
// contrat du cœur
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// API du plugin
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// helper runtime partagé pour les plugins de fonctionnalité/de canal
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

Modèle de test de contrat :

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Cela garde une règle simple :

- le cœur possède le contrat de capacité + l'orchestration
- les plugins fournisseurs possèdent les implémentations fournisseurs
- les plugins de fonctionnalité/de canal consomment les helpers runtime
- les tests de contrat gardent la propriété explicite
