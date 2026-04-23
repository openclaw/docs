---
read_when:
    - Création ou débogage de plugins OpenClaw natifs
    - Comprendre le modèle de capacités des plugins ou les frontières de propriété
    - Travailler sur le pipeline de chargement des plugins ou le registre
    - Implémenter des hooks d’exécution de fournisseur ou des plugins de canal
sidebarTitle: Internals
summary: 'Éléments internes des plugins : modèle de capacités, propriété, contrats, pipeline de chargement et assistants d’exécution'
title: Éléments internes des plugins
x-i18n:
    generated_at: "2026-04-23T07:06:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69075cecab525aacd19e350605c135334bdcfe913c2f024a48ff68e5b1e80f8c
    source_path: plugins/architecture.md
    workflow: 15
---

# Éléments internes des plugins

<Info>
  Ceci est la **référence d’architecture approfondie**. Pour des guides pratiques, voir :
  - [Installer et utiliser des plugins](/fr/tools/plugin) — guide utilisateur
  - [Premiers pas](/fr/plugins/building-plugins) — premier tutoriel de plugin
  - [Plugins de canal](/fr/plugins/sdk-channel-plugins) — créer un canal de messagerie
  - [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins) — créer un fournisseur de modèles
  - [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) — import map et API d’enregistrement
</Info>

Cette page couvre l’architecture interne du système de plugins OpenClaw.

## Modèle public de capacités

Les capacités sont le modèle public de **plugin natif** dans OpenClaw. Chaque
plugin OpenClaw natif s’enregistre sur un ou plusieurs types de capacités :

| Capacité              | Méthode d’enregistrement                       | Exemples de plugins                 |
| --------------------- | ---------------------------------------------- | ----------------------------------- |
| Inférence de texte    | `api.registerProvider(...)`                    | `openai`, `anthropic`               |
| Backend d’inférence CLI | `api.registerCliBackend(...)`                | `openai`, `anthropic`               |
| Parole                | `api.registerSpeechProvider(...)`              | `elevenlabs`, `microsoft`           |
| Transcription en temps réel | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                    |
| Voix en temps réel    | `api.registerRealtimeVoiceProvider(...)`       | `openai`                            |
| Compréhension des médias | `api.registerMediaUnderstandingProvider(...)` | `openai`, `google`               |
| Génération d’images   | `api.registerImageGenerationProvider(...)`     | `openai`, `google`, `fal`, `minimax` |
| Génération musicale   | `api.registerMusicGenerationProvider(...)`     | `google`, `minimax`                 |
| Génération vidéo      | `api.registerVideoGenerationProvider(...)`     | `qwen`                              |
| Récupération web      | `api.registerWebFetchProvider(...)`            | `firecrawl`                         |
| Recherche web         | `api.registerWebSearchProvider(...)`           | `google`                            |
| Canal / messagerie    | `api.registerChannel(...)`                     | `msteams`, `matrix`                 |

Un plugin qui enregistre zéro capacité mais fournit des hooks, outils ou
services est un plugin **legacy hook-only**. Ce modèle reste entièrement pris en charge.

### Position de compatibilité externe

Le modèle de capacités est intégré au cœur et utilisé aujourd’hui par les plugins
natifs/intégrés, mais la compatibilité des plugins externes a encore besoin d’un seuil
plus strict que « c’est exporté, donc c’est figé ».

Directive actuelle :

- **plugins externes existants :** gardez les intégrations à base de hooks fonctionnelles ; traitez
  cela comme la base de compatibilité
- **nouveaux plugins natifs/intégrés :** préférez un enregistrement explicite des capacités à
  des accès spécifiques au fournisseur ou à de nouvelles conceptions hook-only
- **plugins externes adoptant l’enregistrement de capacités :** autorisé, mais traitez
  les surfaces d’assistance spécifiques aux capacités comme évolutives sauf si la documentation marque explicitement un contrat comme stable

Règle pratique :

- les API d’enregistrement de capacités sont la direction prévue
- les hooks hérités restent la voie la plus sûre sans rupture pour les plugins externes pendant
  la transition
- tous les sous-chemins exportés ne se valent pas ; préférez le contrat documenté étroit,
  pas les exports d’assistance accidentels

### Formes des plugins

OpenClaw classe chaque plugin chargé dans une forme selon son comportement réel
d’enregistrement (et pas seulement selon les métadonnées statiques) :

- **plain-capability** -- enregistre exactement un type de capacité (par exemple un
  plugin de fournisseur uniquement comme `mistral`)
- **hybrid-capability** -- enregistre plusieurs types de capacités (par exemple
  `openai` possède l’inférence de texte, la parole, la compréhension des médias et la génération
  d’images)
- **hook-only** -- enregistre uniquement des hooks (typés ou personnalisés), sans capacités,
  outils, commandes ni services
- **non-capability** -- enregistre des outils, commandes, services ou routes mais pas de
  capacités

Utilisez `openclaw plugins inspect <id>` pour voir la forme d’un plugin et le détail
de ses capacités. Voir la [référence CLI](/fr/cli/plugins#inspect) pour plus de détails.

### Hooks hérités

Le hook `before_agent_start` reste pris en charge comme voie de compatibilité pour
les plugins hook-only. Des plugins réels hérités en dépendent encore.

Orientation :

- continuez à le faire fonctionner
- documentez-le comme hérité
- préférez `before_model_resolve` pour le travail de remplacement de modèle/fournisseur
- préférez `before_prompt_build` pour le travail de mutation de prompt
- ne le supprimez qu’une fois que l’usage réel baisse et que la couverture des fixtures prouve la sécurité de la migration

### Signaux de compatibilité

Lorsque vous exécutez `openclaw doctor` ou `openclaw plugins inspect <id>`, vous pouvez voir
l’un de ces libellés :

| Signal                     | Signification                                               |
| -------------------------- | ----------------------------------------------------------- |
| **config valid**           | La configuration est bien analysée et les plugins se résolvent |
| **compatibility advisory** | Le plugin utilise un modèle pris en charge mais plus ancien (par ex. `hook-only`) |
| **legacy warning**         | Le plugin utilise `before_agent_start`, qui est déprécié    |
| **hard error**             | La configuration est invalide ou le plugin n’a pas pu être chargé |

Ni `hook-only` ni `before_agent_start` ne casseront votre plugin aujourd’hui --
`hook-only` est consultatif, et `before_agent_start` ne déclenche qu’un avertissement. Ces
signaux apparaissent aussi dans `openclaw status --all` et `openclaw plugins doctor`.

## Vue d’ensemble de l’architecture

Le système de plugins d’OpenClaw a quatre couches :

1. **Manifest + découverte**
   OpenClaw trouve les plugins candidats à partir des chemins configurés, des racines
   d’espace de travail, des racines globales de plugins et des plugins intégrés. La découverte lit d’abord les manifests natifs
   `openclaw.plugin.json` ainsi que les manifests de bundles pris en charge.
2. **Activation + validation**
   Le cœur décide si un plugin découvert est activé, désactivé, bloqué ou
   sélectionné pour un emplacement exclusif tel que la mémoire.
3. **Chargement à l’exécution**
   Les plugins OpenClaw natifs sont chargés en processus via jiti et enregistrent des
   capacités dans un registre central. Les bundles compatibles sont normalisés en
   enregistrements de registre sans importer de code d’exécution.
4. **Consommation des surfaces**
   Le reste d’OpenClaw lit le registre pour exposer les outils, canaux, configuration
   des fournisseurs, hooks, routes HTTP, commandes CLI et services.

Pour la CLI de plugin en particulier, la découverte des commandes racines est divisée en deux phases :

- les métadonnées à l’analyse proviennent de `registerCli(..., { descriptors: [...] })`
- le vrai module CLI du plugin peut rester paresseux et s’enregistrer à la première invocation

Cela permet de conserver le code CLI appartenant au plugin à l’intérieur du plugin tout en laissant OpenClaw
réserver les noms de commandes racines avant l’analyse.

La frontière de conception importante :

- la découverte + validation de configuration doivent fonctionner à partir des **métadonnées de manifest/schéma**
  sans exécuter le code du plugin
- le comportement d’exécution natif provient du chemin `register(api)` du module du plugin

Cette séparation permet à OpenClaw de valider la configuration, d’expliquer les plugins manquants/désactivés et de
construire des indices d’interface/schéma avant que l’exécution complète ne soit active.

### Plugins de canal et outil message partagé

Les plugins de canal n’ont pas besoin d’enregistrer un outil séparé send/edit/react pour
les actions de chat normales. OpenClaw conserve un seul outil `message` partagé dans le cœur, et
les plugins de canal possèdent la découverte et l’exécution spécifiques au canal qui se trouvent derrière lui.

La frontière actuelle est :

- le cœur possède l’hôte de l’outil `message` partagé, le câblage du prompt, la tenue des livres
  de session/fil et la répartition de l’exécution
- les plugins de canal possèdent la découverte d’actions ciblées, la découverte de capacités et tout
  fragment de schéma spécifique au canal
- les plugins de canal possèdent la grammaire de conversation de session spécifique au fournisseur, par exemple
  la manière dont les identifiants de conversation encodent les identifiants de fil ou héritent des conversations parentes
- les plugins de canal exécutent l’action finale via leur adaptateur d’action

Pour les plugins de canal, la surface SDK est
`ChannelMessageActionAdapter.describeMessageTool(...)`. Cet appel de découverte unifié
permet à un plugin de renvoyer ses actions visibles, ses capacités et ses contributions de schéma
ensemble afin que ces éléments ne dérivent pas.

Lorsqu’un paramètre d’outil message spécifique à un canal transporte une source de média telle qu’un
chemin local ou une URL de média distante, le plugin doit aussi renvoyer
`mediaSourceParams` depuis `describeMessageTool(...)`. Le cœur utilise cette liste explicite
pour appliquer la normalisation des chemins du bac à sable et les indices d’accès aux médias sortants
sans coder en dur des noms de paramètres appartenant au plugin.
Préférez des maps limitées à l’action, et non une liste plate à l’échelle du canal, afin qu’un
paramètre de média réservé au profil ne soit pas normalisé sur des actions non liées comme
`send`.

Le cœur transmet la portée d’exécution dans cette étape de découverte. Les champs importants incluent :

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` entrant approuvé

Cela compte pour les plugins sensibles au contexte. Un canal peut masquer ou exposer des
actions de message selon le compte actif, la salle/le fil/le message courant, ou
l’identité approuvée du demandeur sans coder en dur des branches spécifiques au canal dans
l’outil `message` central.

C’est pourquoi les changements de routage d’embedded-runner restent du travail de plugin : le runner est
responsable de transmettre l’identité de chat/session actuelle dans la frontière de découverte du plugin afin que l’outil `message`
partagé expose la bonne surface appartenant au canal pour le tour courant.

Pour les assistants d’exécution appartenant au canal, les plugins intégrés doivent conserver l’exécution
dans leurs propres modules d’extension. Le cœur ne possède plus les environnements d’exécution
d’action de message Discord, Slack, Telegram ou WhatsApp sous `src/agents/tools`.
Nous ne publions pas de sous-chemins séparés `plugin-sdk/*-action-runtime`, et les
plugins intégrés doivent importer directement leur propre code d’exécution local depuis leurs
modules d’extension propriétaires.

La même frontière s’applique en général aux joints SDK nommés d’après des fournisseurs : le cœur ne doit
pas importer de barrels pratiques spécifiques à des canaux pour Slack, Discord, Signal,
WhatsApp ou d’autres extensions similaires. Si le cœur a besoin d’un comportement, il doit soit consommer
le barrel `api.ts` / `runtime-api.ts` propre au plugin intégré, soit promouvoir ce besoin
dans une capacité générique étroite du SDK partagé.

Pour les sondages en particulier, il existe deux chemins d’exécution :

- `outbound.sendPoll` est la base partagée pour les canaux qui correspondent au modèle
  commun de sondage
- `actions.handleAction("poll")` est le chemin préféré pour la sémantique de sondage spécifique au canal
  ou des paramètres de sondage supplémentaires

Le cœur diffère maintenant l’analyse partagée des sondages jusqu’à ce que la répartition du sondage de plugin refuse
l’action, afin que les gestionnaires de sondage appartenant au plugin puissent accepter des champs de sondage
spécifiques au canal sans être bloqués d’abord par l’analyseur de sondage générique.

Voir [Load pipeline](#load-pipeline) pour la séquence complète de démarrage.

## Modèle de propriété des capacités

OpenClaw traite un plugin natif comme la frontière de propriété pour une **entreprise** ou une
**fonctionnalité**, et non comme un fourre-tout d’intégrations sans lien.

Cela signifie que :

- un plugin d’entreprise doit généralement posséder toutes les surfaces OpenClaw de cette
  entreprise
- un plugin de fonctionnalité doit généralement posséder toute la surface de la fonctionnalité qu’il introduit
- les canaux doivent consommer des capacités partagées du cœur au lieu de réimplémenter un comportement de fournisseur de manière ad hoc

Exemples :

- le plugin intégré `openai` possède le comportement de fournisseur de modèles OpenAI ainsi que le comportement OpenAI
  de parole + voix en temps réel + compréhension des médias + génération d’images
- le plugin intégré `elevenlabs` possède le comportement de parole ElevenLabs
- le plugin intégré `microsoft` possède le comportement de parole Microsoft
- le plugin intégré `google` possède le comportement de fournisseur de modèles Google ainsi que le comportement Google
  de compréhension des médias + génération d’images + recherche web
- le plugin intégré `firecrawl` possède le comportement de récupération web Firecrawl
- les plugins intégrés `minimax`, `mistral`, `moonshot` et `zai` possèdent leurs
  backends de compréhension des médias
- le plugin intégré `qwen` possède le comportement de fournisseur de texte Qwen ainsi que
  le comportement de compréhension des médias et de génération vidéo
- le plugin `voice-call` est un plugin de fonctionnalité : il possède le transport d’appel, les outils,
  la CLI, les routes et le pont de flux média Twilio, mais il consomme les capacités partagées de parole
  plus transcription en temps réel et voix en temps réel au lieu d’importer directement des plugins de fournisseur

L’état final visé est :

- OpenAI vit dans un seul plugin même s’il couvre les modèles de texte, la parole, les images et
  la vidéo future
- un autre fournisseur peut faire de même pour sa propre surface
- les canaux ne se soucient pas du plugin fournisseur propriétaire ; ils consomment le contrat de capacité
  partagé exposé par le cœur

C’est la distinction clé :

- **plugin** = frontière de propriété
- **capacité** = contrat du cœur que plusieurs plugins peuvent implémenter ou consommer

Ainsi, si OpenClaw ajoute un nouveau domaine tel que la vidéo, la première question n’est pas
« quel fournisseur doit coder en dur la gestion de la vidéo ? » La première question est « quel est
le contrat de capacité vidéo du cœur ? » Une fois que ce contrat existe, les plugins fournisseurs
peuvent s’y enregistrer et les plugins de canal/fonctionnalité peuvent le consommer.

Si la capacité n’existe pas encore, la bonne démarche est généralement :

1. définir la capacité manquante dans le cœur
2. l’exposer via l’API/runtime du plugin de manière typée
3. connecter les canaux/fonctionnalités à cette capacité
4. laisser les plugins fournisseurs enregistrer des implémentations

Cela garde une propriété explicite tout en évitant un comportement du cœur dépendant d’un
seul fournisseur ou d’un chemin de code spécifique à un plugin ponctuel.

### Superposition des capacités

Utilisez ce modèle mental lorsque vous décidez où le code doit aller :

- **couche de capacité du cœur** : orchestration partagée, politique, repli, règles
  de fusion de configuration, sémantique de livraison et contrats typés
- **couche de plugin fournisseur** : API spécifiques au fournisseur, authentification, catalogues de modèles, parole
  synthétique, génération d’images, futurs backends vidéo, points de terminaison d’usage
- **couche de plugin de canal/fonctionnalité** : intégration
  Slack/Discord/voice-call/etc. qui consomme les capacités du cœur et les présente sur une surface

Par exemple, la synthèse vocale suit cette forme :

- le cœur possède la politique TTS au moment de la réponse, l’ordre de repli, les préférences et la livraison par canal
- `openai`, `elevenlabs` et `microsoft` possèdent les implémentations de synthèse
- `voice-call` consomme l’assistant runtime TTS pour la téléphonie

Ce même modèle doit être privilégié pour les capacités futures.

### Exemple de plugin d’entreprise multi-capacités

Un plugin d’entreprise doit sembler cohérent vu de l’extérieur. Si OpenClaw a des
contrats partagés pour les modèles, la parole, la transcription en temps réel, la voix en temps réel, la compréhension des médias,
la génération d’images, la génération vidéo, la récupération web et la recherche web,
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

Ce qui compte, ce ne sont pas les noms exacts des assistants. C’est la forme qui compte :

- un plugin possède la surface du fournisseur
- le cœur possède toujours les contrats de capacité
- les plugins de canal et de fonctionnalité consomment les assistants `api.runtime.*`, pas le code du fournisseur
- les tests de contrat peuvent affirmer que le plugin a enregistré les capacités
  qu’il prétend posséder

### Exemple de capacité : compréhension vidéo

OpenClaw traite déjà la compréhension d’images/audio/vidéo comme une seule
capacité partagée. Le même modèle de propriété s’y applique :

1. le cœur définit le contrat de compréhension des médias
2. les plugins fournisseurs enregistrent `describeImage`, `transcribeAudio` et
   `describeVideo` selon le cas
3. les plugins de canal et de fonctionnalité consomment le comportement partagé du cœur au lieu de
   se connecter directement au code du fournisseur

Cela évite d’intégrer dans le cœur les hypothèses vidéo d’un fournisseur. Le plugin possède
la surface du fournisseur ; le cœur possède le contrat de capacité et le comportement de repli.

La génération vidéo utilise déjà cette même séquence : le cœur possède le contrat de
capacité typé et l’assistant runtime, et les plugins fournisseurs enregistrent des
implémentations `api.registerVideoGenerationProvider(...)` contre ce contrat.

Besoin d’une liste de contrôle concrète pour le déploiement ? Voir
[Capability Cookbook](/fr/plugins/architecture).

## Contrats et application

La surface d’API des plugins est volontairement typée et centralisée dans
`OpenClawPluginApi`. Ce contrat définit les points d’enregistrement pris en charge et
les assistants runtime sur lesquels un plugin peut s’appuyer.

Pourquoi c’est important :

- les auteurs de plugins obtiennent un standard interne stable
- le cœur peut rejeter une propriété en double, par exemple deux plugins enregistrant le même
  identifiant de fournisseur
- le démarrage peut faire remonter des diagnostics exploitables pour un enregistrement mal formé
- les tests de contrat peuvent faire respecter la propriété des plugins intégrés et empêcher les dérives silencieuses

Il existe deux couches d’application :

1. **application d’enregistrement à l’exécution**
   Le registre des plugins valide les enregistrements au chargement des plugins. Exemples :
   identifiants de fournisseur en double, identifiants de fournisseur de parole en double et enregistrements
   mal formés produisent des diagnostics de plugin au lieu d’un comportement indéfini.
2. **tests de contrat**
   Les plugins intégrés sont capturés dans des registres de contrat pendant les exécutions de test afin
   qu’OpenClaw puisse affirmer explicitement la propriété. Aujourd’hui cela est utilisé pour les
   fournisseurs de modèles, les fournisseurs de parole, les fournisseurs de recherche web et la propriété
   d’enregistrement intégrée.

L’effet pratique est qu’OpenClaw sait, dès le départ, quel plugin possède quelle
surface. Cela permet au cœur et aux canaux de se composer sans friction parce que la propriété est
déclarée, typée et testable plutôt qu’implicite.

### Ce qui relève d’un contrat

Les bons contrats de plugin sont :

- typés
- petits
- spécifiques à une capacité
- possédés par le cœur
- réutilisables par plusieurs plugins
- consommables par les canaux/fonctionnalités sans connaissance du fournisseur

Les mauvais contrats de plugin sont :

- une politique spécifique au fournisseur cachée dans le cœur
- des échappatoires ponctuelles spécifiques à un plugin qui contournent le registre
- du code de canal qui atteint directement une implémentation fournisseur
- des objets runtime ad hoc qui ne font pas partie de `OpenClawPluginApi` ni de
  `api.runtime`

En cas de doute, élevez le niveau d’abstraction : définissez d’abord la capacité, puis
laissez les plugins s’y brancher.

## Modèle d’exécution

Les plugins OpenClaw natifs s’exécutent **en processus** avec la Gateway. Ils ne sont pas
sandboxés. Un plugin natif chargé a la même frontière de confiance au niveau du processus que le
code du cœur.

Implications :

- un plugin natif peut enregistrer des outils, des gestionnaires réseau, des hooks et des services
- un bug dans un plugin natif peut faire planter ou déstabiliser la Gateway
- un plugin natif malveillant équivaut à une exécution de code arbitraire dans le
  processus OpenClaw

Les bundles compatibles sont plus sûrs par défaut parce qu’OpenClaw les traite actuellement
comme des packs de métadonnées/contenu. Dans les versions actuelles, cela signifie surtout des
Skills intégrées.

Utilisez des listes d’autorisation et des chemins explicites d’installation/chargement pour les plugins non intégrés.
Traitez les plugins d’espace de travail comme du code de développement, pas comme des valeurs de production par défaut.

Pour les noms de package d’espace de travail intégrés, gardez l’identifiant du plugin ancré dans le nom npm :
`@openclaw/<id>` par défaut, ou un suffixe typé approuvé tel que
`-provider`, `-plugin`, `-speech`, `-sandbox` ou `-media-understanding` lorsque
le package expose intentionnellement un rôle de plugin plus étroit.

Remarque importante sur la confiance :

- `plugins.allow` fait confiance aux **identifiants de plugin**, pas à la provenance de la source.
- Un plugin d’espace de travail avec le même identifiant qu’un plugin intégré masque intentionnellement
  la copie intégrée lorsque ce plugin d’espace de travail est activé/sur liste d’autorisation.
- C’est normal et utile pour le développement local, les tests de patch et les correctifs urgents.

## Frontière d’export

OpenClaw exporte des capacités, pas des commodités d’implémentation.

Gardez public l’enregistrement des capacités. Supprimez les exports d’assistants hors contrat :

- sous-chemins d’assistants spécifiques aux plugins intégrés
- sous-chemins de plomberie runtime non destinés à être une API publique
- assistants pratiques spécifiques à un fournisseur
- assistants de configuration/onboarding qui sont des détails d’implémentation

Certains sous-chemins d’assistants de plugins intégrés restent encore dans l’export map
générée du SDK pour des raisons de compatibilité et de maintenance des plugins intégrés. Exemples actuels :
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` et plusieurs joints `plugin-sdk/matrix*`. Traitez-les comme des
exports réservés de détail d’implémentation, pas comme le modèle SDK recommandé pour
les nouveaux plugins tiers.

## Pipeline de chargement

Au démarrage, OpenClaw fait approximativement ceci :

1. découvre les racines candidates de plugins
2. lit les manifests natifs ou de bundles compatibles ainsi que les métadonnées de package
3. rejette les candidats non sûrs
4. normalise la configuration des plugins (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. décide de l’activation pour chaque candidat
6. charge les modules natifs activés via jiti
7. appelle les hooks natifs `register(api)` (ou `activate(api)` — alias hérité) et collecte les enregistrements dans le registre des plugins
8. expose le registre aux surfaces de commandes/runtime

<Note>
`activate` est un alias hérité de `register` — le chargeur résout celui qui est présent (`def.register ?? def.activate`) et l’appelle au même moment. Tous les plugins intégrés utilisent `register` ; préférez `register` pour les nouveaux plugins.
</Note>

Les barrières de sécurité se produisent **avant** l’exécution runtime. Les candidats sont bloqués
lorsque le point d’entrée s’échappe de la racine du plugin, que le chemin est inscriptible par tous, ou que la
propriété du chemin semble suspecte pour des plugins non intégrés.

### Comportement manifest-first

Le manifest est la source de vérité du plan de contrôle. OpenClaw l’utilise pour :

- identifier le plugin
- découvrir les canaux/Skills/schémas de configuration déclarés ou les capacités du bundle
- valider `plugins.entries.<id>.config`
- enrichir les libellés/placeholders de la Control UI
- afficher les métadonnées d’installation/catalogue
- préserver des descripteurs peu coûteux d’activation et de configuration sans charger le runtime du plugin

Pour les plugins natifs, le module runtime est la partie plan de données. Il enregistre le
comportement réel tel que hooks, outils, commandes ou flux de fournisseur.

Les blocs facultatifs `activation` et `setup` du manifest restent sur le plan de contrôle.
Ce sont des descripteurs de métadonnées uniquement pour la planification d’activation et la découverte de configuration ;
ils ne remplacent pas l’enregistrement runtime, `register(...)` ni `setupEntry`.
Les premiers consommateurs d’activation en direct utilisent maintenant les indices de commandes, canaux et fournisseurs du manifest
pour restreindre le chargement des plugins avant une matérialisation plus large du registre :

- le chargement de la CLI se limite aux plugins qui possèdent la commande primaire demandée
- la résolution de configuration/plugin de canal se limite aux plugins qui possèdent l’identifiant
  de canal demandé
- la résolution explicite de configuration/runtime de fournisseur se limite aux plugins qui possèdent
  l’identifiant de fournisseur demandé

La découverte de configuration préfère désormais les identifiants appartenant aux descripteurs tels que `setup.providers` et
`setup.cliBackends` pour restreindre les plugins candidats avant de se replier sur
`setup-api` pour les plugins qui ont encore besoin de hooks runtime au moment de la configuration. Si plus
d’un plugin découvert revendique le même identifiant normalisé de fournisseur de configuration ou de backend CLI,
la recherche de configuration refuse le propriétaire ambigu au lieu de s’appuyer sur l’ordre de découverte.

### Ce que le chargeur met en cache

OpenClaw conserve de courts caches en processus pour :

- les résultats de découverte
- les données du registre de manifests
- les registres de plugins chargés

Ces caches réduisent les surcharges de démarrage en rafale et de commandes répétées. Il est sûr
de les considérer comme des caches de performance de courte durée, pas comme de la persistance.

Remarque sur les performances :

- Définissez `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` ou
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` pour désactiver ces caches.
- Ajustez les fenêtres de cache avec `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` et
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Modèle de registre

Les plugins chargés ne mutent pas directement des globales aléatoires du cœur. Ils s’enregistrent dans un
registre central de plugins.

Le registre suit :

- les enregistrements de plugins (identité, source, origine, statut, diagnostics)
- les outils
- les hooks hérités et les hooks typés
- les canaux
- les fournisseurs
- les gestionnaires RPC de Gateway
- les routes HTTP
- les enregistreurs CLI
- les services d’arrière-plan
- les commandes appartenant aux plugins

Les fonctionnalités du cœur lisent ensuite ce registre au lieu de parler directement aux modules de plugin.
Cela garde le chargement unidirectionnel :

- module de plugin -> enregistrement dans le registre
- runtime du cœur -> consommation du registre

Cette séparation compte pour la maintenabilité. Cela signifie que la plupart des surfaces du cœur
n’ont besoin que d’un seul point d’intégration : « lire le registre », et non « traiter à part chaque module de plugin ».

## Rappels d’association de conversation

Les plugins qui associent une conversation peuvent réagir lorsqu’une approbation est résolue.

Utilisez `api.onConversationBindingResolved(...)` pour recevoir un rappel après qu’une demande
d’association est approuvée ou refusée :

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

Champs de la charge utile du rappel :

- `status` : `"approved"` ou `"denied"`
- `decision` : `"allow-once"`, `"allow-always"` ou `"deny"`
- `binding` : l’association résolue pour les demandes approuvées
- `request` : le résumé de la demande d’origine, l’indice de détachement, l’identifiant de l’expéditeur et
  les métadonnées de conversation

Ce rappel est uniquement une notification. Il ne change pas qui est autorisé à associer une
conversation, et il s’exécute après la fin du traitement d’approbation du cœur.

## Hooks runtime des fournisseurs

Les plugins fournisseurs ont maintenant deux couches :

- métadonnées de manifest : `providerAuthEnvVars` pour une recherche peu coûteuse de l’authentification fournisseur par env
  avant le chargement runtime, `providerAuthAliases` pour les variantes de fournisseur qui partagent
  l’authentification, `channelEnvVars` pour une recherche peu coûteuse de l’env/de la configuration de canal avant le chargement runtime,
  ainsi que `providerAuthChoices` pour des libellés peu coûteux d’onboarding/de choix d’authentification et
  des métadonnées de drapeaux CLI avant le chargement runtime
- hooks au moment de la configuration : `catalog` / ancien `discovery` plus `applyConfigDefaults`
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
  `resolveThinkingProfile`, `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw possède toujours la boucle d’agent générique, le failover, la gestion des transcripts et la
politique des outils. Ces hooks sont la surface d’extension pour le comportement spécifique aux fournisseurs sans
avoir besoin d’un transport d’inférence entièrement personnalisé.

Utilisez le manifest `providerAuthEnvVars` lorsque le fournisseur dispose d’identifiants basés sur l’env
que les chemins génériques d’authentification/statut/sélecteur de modèles doivent voir sans charger le runtime du plugin.
Utilisez le manifest `providerAuthAliases` lorsqu’un identifiant de fournisseur doit réutiliser les variables d’environnement,
les profils d’authentification, l’authentification adossée à la configuration et le choix d’onboarding de clé API
d’un autre identifiant de fournisseur. Utilisez le manifest `providerAuthChoices` lorsque les surfaces CLI
d’onboarding/de choix d’authentification doivent connaître l’identifiant de choix du fournisseur, les libellés de groupe et le câblage simple
d’authentification par drapeau unique sans charger le runtime du fournisseur. Conservez les `envVars` runtime du fournisseur
pour les indices destinés aux opérateurs tels que les libellés d’onboarding ou les variables de
configuration client-id/client-secret OAuth.

Utilisez le manifest `channelEnvVars` lorsqu’un canal a une authentification ou une configuration pilotée par l’env
que le repli générique d’environnement shell, les vérifications config/statut ou les prompts de configuration doivent voir
sans charger le runtime du canal.

### Ordre des hooks et utilisation

Pour les plugins de modèle/fournisseur, OpenClaw appelle les hooks dans cet ordre approximatif.
La colonne « Quand l’utiliser » est le guide rapide de décision.

| #   | Hook                              | Ce qu’il fait                                                                                                  | Quand l’utiliser                                                                                                                              |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publie la configuration du fournisseur dans `models.providers` lors de la génération de `models.json`         | Le fournisseur possède un catalogue ou des valeurs par défaut d’URL de base                                                                   |
| 2   | `applyConfigDefaults`             | Applique les valeurs par défaut globales appartenant au fournisseur lors de la matérialisation de la configuration | Les valeurs par défaut dépendent du mode d’authentification, de l’env ou de la sémantique de famille de modèles du fournisseur              |
| --  | _(recherche de modèle intégrée)_  | OpenClaw essaie d’abord le chemin normal de registre/catalogue                                                 | _(pas un hook de plugin)_                                                                                                                     |
| 3   | `normalizeModelId`                | Normalise les alias hérités ou de préversion d’identifiant de modèle avant la recherche                        | Le fournisseur possède le nettoyage des alias avant la résolution canonique du modèle                                                         |
| 4   | `normalizeTransport`              | Normalise `api` / `baseUrl` de la famille de fournisseurs avant l’assemblage générique du modèle              | Le fournisseur possède le nettoyage du transport pour des identifiants de fournisseur personnalisés dans la même famille de transport        |
| 5   | `normalizeConfig`                 | Normalise `models.providers.<id>` avant la résolution runtime/fournisseur                                      | Le fournisseur a besoin d’un nettoyage de configuration qui doit vivre avec le plugin ; les assistants intégrés de la famille Google servent aussi de solution de secours pour les entrées de configuration Google prises en charge |
| 6   | `applyNativeStreamingUsageCompat` | Applique aux fournisseurs de configuration les réécritures de compatibilité d’usage du streaming natif        | Le fournisseur a besoin de corrections de métadonnées d’usage du streaming natif pilotées par point de terminaison                           |
| 7   | `resolveConfigApiKey`             | Résout l’authentification par marqueur d’env pour les fournisseurs de configuration avant le chargement de l’auth runtime | Le fournisseur possède une résolution de clé API par marqueur d’env ; `amazon-bedrock` possède aussi ici un résolveur intégré de marqueur d’env AWS |
| 8   | `resolveSyntheticAuth`            | Expose une authentification locale/auto-hébergée ou adossée à la configuration sans persister du texte en clair | Le fournisseur peut fonctionner avec un marqueur d’identifiant synthétique/local                                                              |
| 9   | `resolveExternalAuthProfiles`     | Superpose des profils d’authentification externes appartenant au fournisseur ; la `persistence` par défaut est `runtime-only` pour les identifiants appartenant à la CLI/l’app | Le fournisseur réutilise des identifiants d’authentification externes sans persister de jetons de rafraîchissement copiés ; déclarez `contracts.externalAuthProviders` dans le manifest |
| 10  | `shouldDeferSyntheticProfileAuth` | Abaisse les espaces réservés de profils synthétiques stockés derrière l’authentification adossée à l’env/la configuration | Le fournisseur stocke des profils synthétiques d’espace réservé qui ne doivent pas prendre la priorité                                       |
| 11  | `resolveDynamicModel`             | Repli synchrone pour des identifiants de modèle appartenant au fournisseur qui ne sont pas encore dans le registre local | Le fournisseur accepte des identifiants de modèle amont arbitraires                                                                           |
| 12  | `prepareDynamicModel`             | Préchauffage asynchrone, puis `resolveDynamicModel` s’exécute à nouveau                                        | Le fournisseur a besoin de métadonnées réseau avant de résoudre des identifiants inconnus                                                     |
| 13  | `normalizeResolvedModel`          | Réécriture finale avant que l’embedded runner n’utilise le modèle résolu                                      | Le fournisseur a besoin de réécritures de transport tout en utilisant quand même un transport du cœur                                         |
| 14  | `contributeResolvedModelCompat`   | Contribue des drapeaux de compatibilité pour des modèles fournisseur derrière un autre transport compatible    | Le fournisseur reconnaît ses propres modèles sur des transports proxy sans prendre le contrôle du fournisseur                                 |
| 15  | `capabilities`                    | Métadonnées de transcript/outillage appartenant au fournisseur utilisées par la logique partagée du cœur       | Le fournisseur a besoin de particularités de transcript/famille de fournisseurs                                                               |
| 16  | `normalizeToolSchemas`            | Normalise les schémas d’outils avant que l’embedded runner ne les voie                                         | Le fournisseur a besoin d’un nettoyage des schémas de la famille de transport                                                                 |
| 17  | `inspectToolSchemas`              | Expose des diagnostics de schéma appartenant au fournisseur après normalisation                                | Le fournisseur veut des avertissements de mots-clés sans enseigner au cœur des règles spécifiques au fournisseur                             |
| 18  | `resolveReasoningOutputMode`      | Sélectionne le contrat de sortie de raisonnement natif ou balisé                                               | Le fournisseur a besoin d’une sortie raisonnement/finale balisée au lieu de champs natifs                                                    |
| 19  | `prepareExtraParams`              | Normalisation des paramètres de requête avant les wrappers génériques d’options de flux                        | Le fournisseur a besoin de paramètres de requête par défaut ou d’un nettoyage de paramètres par fournisseur                                   |
| 20  | `createStreamFn`                  | Remplace entièrement le chemin normal du flux par un transport personnalisé                                    | Le fournisseur a besoin d’un protocole filaire personnalisé, pas seulement d’un wrapper                                                      |
| 21  | `wrapStreamFn`                    | Wrapper de flux après application des wrappers génériques                                                      | Le fournisseur a besoin de wrappers de compatibilité d’en-têtes/corps/modèle de requête sans transport personnalisé                         |
| 22  | `resolveTransportTurnState`       | Attache des en-têtes ou métadonnées natives par tour au transport                                              | Le fournisseur veut que les transports génériques envoient une identité de tour native au fournisseur                                         |
| 23  | `resolveWebSocketSessionPolicy`   | Attache des en-têtes WebSocket natifs ou une politique de refroidissement de session                           | Le fournisseur veut que les transports WS génériques ajustent les en-têtes de session ou la politique de repli                              |
| 24  | `formatApiKey`                    | Formateur de profil d’authentification : le profil stocké devient la chaîne `apiKey` runtime                  | Le fournisseur stocke des métadonnées d’authentification supplémentaires et a besoin d’une forme de jeton runtime personnalisée             |
| 25  | `refreshOAuth`                    | Remplacement du rafraîchissement OAuth pour des points de terminaison de rafraîchissement personnalisés ou une politique d’échec du rafraîchissement | Le fournisseur ne correspond pas aux rafraîchisseurs partagés `pi-ai`                                                                         |
| 26  | `buildAuthDoctorHint`             | Indice de réparation ajouté lorsque le rafraîchissement OAuth échoue                                           | Le fournisseur a besoin de conseils de réparation d’authentification lui appartenant après un échec de rafraîchissement                     |
| 27  | `matchesContextOverflowError`     | Détecteur d’erreur de dépassement de fenêtre de contexte appartenant au fournisseur                            | Le fournisseur a des erreurs brutes de dépassement que les heuristiques génériques manqueraient                                              |
| 28  | `classifyFailoverReason`          | Classification de raison de failover appartenant au fournisseur                                                | Le fournisseur peut mapper des erreurs brutes d’API/transport vers limite de débit/surcharge/etc.                                            |
| 29  | `isCacheTtlEligible`              | Politique de prompt-cache pour les fournisseurs proxy/backhaul                                                 | Le fournisseur a besoin d’un contrôle TTL de cache spécifique au proxy                                                                        |
| 30  | `buildMissingAuthMessage`         | Remplacement du message générique de récupération d’authentification manquante                                 | Le fournisseur a besoin d’un indice de récupération spécifique au fournisseur pour une authentification manquante                            |
| 31  | `suppressBuiltInModel`            | Suppression des modèles amont obsolètes avec indice d’erreur facultatif visible par l’utilisateur             | Le fournisseur a besoin de masquer des lignes amont obsolètes ou de les remplacer par un indice du fournisseur                               |
| 32  | `augmentModelCatalog`             | Lignes de catalogue synthétiques/finales ajoutées après la découverte                                          | Le fournisseur a besoin de lignes synthétiques de compatibilité future dans `models list` et dans les sélecteurs                            |
| 33  | `resolveThinkingProfile`          | Ensemble de niveaux `/think`, libellés d’affichage et valeur par défaut spécifiques au modèle                 | Le fournisseur expose une échelle de réflexion personnalisée ou un libellé binaire pour certains modèles sélectionnés                       |
| 34  | `isBinaryThinking`                | Hook de compatibilité du basculement de raisonnement on/off                                                    | Le fournisseur expose uniquement une réflexion binaire activée/désactivée                                                                     |
| 35  | `supportsXHighThinking`           | Hook de compatibilité de prise en charge du raisonnement `xhigh`                                               | Le fournisseur veut `xhigh` uniquement sur un sous-ensemble de modèles                                                                        |
| 36  | `resolveDefaultThinkingLevel`     | Hook de compatibilité du niveau `/think` par défaut                                                            | Le fournisseur possède la politique `/think` par défaut pour une famille de modèles                                                           |
| 37  | `isModernModelRef`                | Détecteur de modèle moderne pour les filtres de profils live et la sélection smoke                            | Le fournisseur possède la correspondance des modèles préférés pour le live/smoke                                                             |
| 38  | `prepareRuntimeAuth`              | Échange un identifiant configuré contre le vrai jeton/clé runtime juste avant l’inférence                     | Le fournisseur a besoin d’un échange de jeton ou d’un identifiant de requête de courte durée                                                 |
| 39  | `resolveUsageAuth`                | Résout les identifiants d’usage/de facturation pour `/usage` et les surfaces de statut associées             | Le fournisseur a besoin d’une analyse personnalisée du jeton d’usage/quota ou d’un identifiant d’usage différent                            |
| 40  | `fetchUsageSnapshot`              | Récupère et normalise des instantanés d’usage/de quota spécifiques au fournisseur après résolution de l’authentification | Le fournisseur a besoin d’un point de terminaison d’usage spécifique au fournisseur ou d’un parseur de charge utile                         |
| 41  | `createEmbeddingProvider`         | Construit un adaptateur d’embedding appartenant au fournisseur pour la mémoire/la recherche                   | Le comportement d’embedding mémoire appartient au plugin fournisseur                                                                          |
| 42  | `buildReplayPolicy`               | Renvoie une politique de replay contrôlant la gestion du transcript pour le fournisseur                       | Le fournisseur a besoin d’une politique de transcript personnalisée (par exemple, suppression des blocs de réflexion)                        |
| 43  | `sanitizeReplayHistory`           | Réécrit l’historique de replay après le nettoyage générique du transcript                                     | Le fournisseur a besoin de réécritures de replay spécifiques au fournisseur au-delà des assistants partagés de Compaction                   |
| 44  | `validateReplayTurns`             | Validation finale ou remise en forme des tours de replay avant l’embedded runner                              | Le transport du fournisseur a besoin d’une validation plus stricte des tours après la sanitation générique                                   |
| 45  | `onModelSelected`                 | Exécute des effets de bord post-sélection appartenant au fournisseur                                          | Le fournisseur a besoin de télémétrie ou d’état appartenant au fournisseur lorsqu’un modèle devient actif                                   |

`normalizeModelId`, `normalizeTransport` et `normalizeConfig` vérifient d’abord le
plugin fournisseur correspondant, puis parcourent les autres plugins fournisseurs capables de hooks
jusqu’à ce que l’un d’eux modifie effectivement l’identifiant de modèle ou le transport/la configuration. Cela permet de garder
fonctionnels les shims d’alias/de compatibilité fournisseur sans obliger l’appelant à savoir quel
plugin intégré possède la réécriture. Si aucun hook fournisseur ne réécrit une entrée de configuration prise en charge
de la famille Google, le normaliseur de configuration Google intégré applique quand même ce nettoyage de compatibilité.

Si le fournisseur a besoin d’un protocole filaire entièrement personnalisé ou d’un exécuteur de requêtes personnalisé,
c’est une autre classe d’extension. Ces hooks concernent le comportement fournisseur qui
s’exécute toujours sur la boucle d’inférence normale d’OpenClaw.

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
  `resolveThinkingProfile`, `applyConfigDefaults`, `isModernModelRef`,
  et `wrapStreamFn` parce qu’il possède la compatibilité future de Claude 4.6,
  les indices de famille de fournisseurs, les conseils de réparation d’authentification, l’intégration au
  point de terminaison d’usage, l’éligibilité du prompt-cache, les valeurs par défaut de configuration sensibles à l’authentification, la politique
  de réflexion par défaut/adaptative de Claude, et le façonnage de flux spécifique à Anthropic pour
  les en-têtes bêta, `/fast` / `serviceTier` et `context1m`.
- Les assistants de flux spécifiques à Claude d’Anthropic restent pour l’instant dans le joint public
  `api.ts` / `contract-api.ts` du plugin intégré. Cette surface de package
  exporte `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` et les constructeurs de wrappers Anthropic
  de plus bas niveau au lieu d’élargir le SDK générique autour des règles d’en-têtes bêta
  d’un seul fournisseur.
- OpenAI utilise `resolveDynamicModel`, `normalizeResolvedModel`, et
  `capabilities` ainsi que `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `resolveThinkingProfile`, et `isModernModelRef`
  parce qu’il possède la compatibilité future de GPT-5.4, la normalisation directe OpenAI
  `openai-completions` -> `openai-responses`, les
  indices d’authentification adaptés à Codex, la suppression de Spark, les lignes synthétiques de liste OpenAI, et la politique de réflexion /
  modèles live de GPT-5 ; la famille de flux `openai-responses-defaults` possède les
  wrappers partagés natifs OpenAI Responses pour les en-têtes d’attribution,
  `/fast`/`serviceTier`, la verbosité de texte, la recherche web native de Codex,
  le façonnage de charge utile compatible avec le raisonnement et la gestion du contexte Responses.
- OpenRouter utilise `catalog` ainsi que `resolveDynamicModel` et
  `prepareDynamicModel` parce que le fournisseur est en pass-through et peut exposer de nouveaux
  identifiants de modèle avant que le catalogue statique d’OpenClaw ne soit mis à jour ; il utilise aussi
  `capabilities`, `wrapStreamFn`, et `isCacheTtlEligible` pour garder
  hors du cœur les en-têtes de requête spécifiques au fournisseur, les métadonnées de routage, les correctifs de raisonnement et la politique de prompt-cache.
  Sa politique de replay provient de la famille
  `passthrough-gemini`, tandis que la famille de flux `openrouter-thinking`
  possède l’injection de raisonnement proxy ainsi que les sauts de modèles non pris en charge / `auto`.
- GitHub Copilot utilise `catalog`, `auth`, `resolveDynamicModel`, et
  `capabilities` ainsi que `prepareRuntimeAuth` et `fetchUsageSnapshot` parce qu’il
  a besoin d’une connexion device appartenant au fournisseur, du comportement de repli de modèle,
  des particularités de transcript de Claude, d’un échange de jeton GitHub -> jeton Copilot, et d’un point de terminaison d’usage appartenant au fournisseur.
- OpenAI Codex utilise `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth`, et `augmentModelCatalog` ainsi que
  `prepareExtraParams`, `resolveUsageAuth`, et `fetchUsageSnapshot` parce qu’il
  fonctionne encore sur les transports OpenAI du cœur mais possède sa normalisation de transport/URL de base,
  sa politique de repli de rafraîchissement OAuth, son choix de transport par défaut,
  ses lignes synthétiques de catalogue Codex et l’intégration au point de terminaison d’usage ChatGPT ; il
  partage la même famille de flux `openai-responses-defaults` que l’OpenAI direct.
- Google AI Studio et Gemini CLI OAuth utilisent `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn`, et `isModernModelRef` parce que la
  famille de replay `google-gemini` possède le repli de compatibilité future de Gemini 3.1,
  la validation native du replay Gemini, la sanitation du replay de bootstrap, le
  mode de sortie de raisonnement balisé, et la correspondance moderne de modèles, tandis que la
  famille de flux `google-thinking` possède la normalisation de charge utile de réflexion Gemini ;
  Gemini CLI OAuth utilise aussi `formatApiKey`, `resolveUsageAuth`, et
  `fetchUsageSnapshot` pour le formatage de jeton, l’analyse de jeton et le câblage du point de terminaison de quota.
- Anthropic Vertex utilise `buildReplayPolicy` via la
  famille de replay `anthropic-by-model` afin que le nettoyage de replay spécifique à Claude reste limité
  aux identifiants Claude au lieu de s’appliquer à tout transport `anthropic-messages`.
- Amazon Bedrock utilise `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason`, et `resolveThinkingProfile` parce qu’il possède la
  classification spécifique à Bedrock des erreurs de limitation/pas prêt/dépassement de contexte
  pour le trafic Anthropic-sur-Bedrock ; sa politique de replay partage malgré tout la même
  protection `anthropic-by-model` limitée à Claude.
- OpenRouter, Kilocode, Opencode, et Opencode Go utilisent `buildReplayPolicy`
  via la famille de replay `passthrough-gemini` parce qu’ils proxifient des modèles Gemini
  au travers de transports compatibles OpenAI et ont besoin de la sanitation des signatures de pensée
  Gemini sans validation native du replay Gemini ni réécritures de bootstrap.
- MiniMax utilise `buildReplayPolicy` via la
  famille de replay `hybrid-anthropic-openai` parce qu’un même fournisseur possède à la fois
  la sémantique Anthropic-message et la sémantique compatible OpenAI ; cela conserve la suppression des blocs
  de réflexion limités à Claude côté Anthropic tout en redéfinissant le mode de sortie de raisonnement vers le natif, et la famille de flux `minimax-fast-mode`
  possède les réécritures de modèles fast-mode sur le chemin de flux partagé.
- Moonshot utilise `catalog`, `resolveThinkingProfile`, et `wrapStreamFn` parce qu’il utilise encore le transport partagé
  OpenAI mais a besoin d’une normalisation de charge utile de réflexion appartenant au fournisseur ; la
  famille de flux `moonshot-thinking` mappe la configuration plus l’état `/think` sur sa
  charge utile native de réflexion binaire.
- Kilocode utilise `catalog`, `capabilities`, `wrapStreamFn`, et
  `isCacheTtlEligible` parce qu’il a besoin d’en-têtes de requête appartenant au fournisseur,
  de normalisation de charge utile de raisonnement, d’indices de transcript Gemini, et d’un contrôle de TTL de cache
  Anthropic ; la famille de flux `kilocode-thinking` conserve l’injection de réflexion Kilo
  sur le chemin de flux proxy partagé tout en ignorant `kilo/auto` et d’autres identifiants de modèles proxy qui ne prennent pas en charge les charges utiles de raisonnement explicites.
- z.ai utilise `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `resolveThinkingProfile`, `isModernModelRef`,
  `resolveUsageAuth`, et `fetchUsageSnapshot` parce qu’il possède le repli GLM-5,
  les valeurs par défaut `tool_stream`, l’UX de réflexion binaire, la correspondance moderne de modèles, ainsi que
  l’authentification d’usage et la récupération de quota ; la famille de flux `tool-stream-default-on` garde
  le wrapper `tool_stream` activé par défaut hors de la colle manuscrite par fournisseur.
- xAI utilise `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel`, et `isModernModelRef`
  parce qu’il possède la normalisation native du transport xAI Responses, les réécritures d’alias fast-mode de Grok, `tool_stream` par défaut,
  le nettoyage strict-tool / charge utile de raisonnement,
  la réutilisation d’authentification de repli pour les outils appartenant au plugin, la résolution de modèle
  Grok de compatibilité future, et les correctifs de compatibilité appartenant au fournisseur tels que le profil de schéma d’outil xAI,
  les mots-clés de schéma non pris en charge, `web_search` natif, et le décodage
  d’arguments d’appel d’outil avec entités HTML.
- Mistral, OpenCode Zen, et OpenCode Go utilisent uniquement `capabilities` pour garder
  hors du cœur les particularités de transcript/outillage.
- Les fournisseurs intégrés catalog-only tels que `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway`, et `volcengine` utilisent
  uniquement `catalog`.
- Qwen utilise `catalog` pour son fournisseur de texte ainsi que des enregistrements partagés de compréhension des médias et
  de génération vidéo pour ses surfaces multimodales.
- MiniMax et Xiaomi utilisent `catalog` ainsi que des hooks d’usage parce que leur comportement `/usage`
  appartient au plugin même si l’inférence passe encore par les transports partagés.

## Assistants runtime

Les plugins peuvent accéder à certains assistants du cœur via `api.runtime`. Pour la TTS :

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
- Renvoie un tampon audio PCM + fréquence d’échantillonnage. Les plugins doivent rééchantillonner/encoder pour les fournisseurs.
- `listVoices` est facultatif selon le fournisseur. Utilisez-le pour les sélecteurs de voix ou les flux de configuration appartenant au fournisseur.
- Les listes de voix peuvent inclure des métadonnées plus riches telles que la locale, le genre et des tags de personnalité pour les sélecteurs sensibles au fournisseur.
- OpenAI et ElevenLabs prennent aujourd’hui en charge la téléphonie. Microsoft non.

Les plugins peuvent aussi enregistrer des fournisseurs de parole via `api.registerSpeechProvider(...)`.

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

- Conservez dans le cœur la politique TTS, le repli et la livraison des réponses.
- Utilisez les fournisseurs de parole pour le comportement de synthèse appartenant au fournisseur.
- L’entrée Microsoft héritée `edge` est normalisée vers l’identifiant de fournisseur `microsoft`.
- Le modèle de propriété préféré est orienté entreprise : un plugin fournisseur peut posséder
  les fournisseurs de texte, parole, image et futurs médias à mesure qu’OpenClaw ajoute ces
  contrats de capacité.

Pour la compréhension des images/audio/vidéo, les plugins enregistrent un seul fournisseur
typé de compréhension des médias au lieu d’un fourre-tout générique clé/valeur :

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

- Conservez dans le cœur l’orchestration, le repli, la configuration et le câblage des canaux.
- Conservez le comportement fournisseur dans le plugin fournisseur.
- L’expansion additive doit rester typée : nouvelles méthodes facultatives, nouveaux champs
  de résultat facultatifs, nouvelles capacités facultatives.
- La génération vidéo suit déjà le même modèle :
  - le cœur possède le contrat de capacité et l’assistant runtime
  - les plugins fournisseurs enregistrent `api.registerVideoGenerationProvider(...)`
  - les plugins de fonctionnalité/canal consomment `api.runtime.videoGeneration.*`

Pour les assistants runtime de compréhension des médias, les plugins peuvent appeler :

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
soit l’ancien alias STT :

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
  compréhension des images/audio/vidéo.
- Utilise la configuration audio de compréhension des médias du cœur (`tools.media.audio`) et l’ordre de repli du fournisseur.
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

- `provider` et `model` sont des remplacements facultatifs par exécution, pas des changements persistants de session.
- OpenClaw ne prend en charge ces champs de remplacement que pour les appelants approuvés.
- Pour les exécutions de repli appartenant aux plugins, les opérateurs doivent donner leur accord avec `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Utilisez `plugins.entries.<id>.subagent.allowedModels` pour limiter les plugins approuvés à des cibles canoniques spécifiques `provider/model`, ou `"*"` pour autoriser explicitement toute cible.
- Les exécutions de sous-agent de plugins non approuvés fonctionnent toujours, mais les demandes de remplacement sont rejetées au lieu de retomber silencieusement sur un repli.

Pour la recherche web, les plugins peuvent consommer l’assistant runtime partagé au lieu
d’atteindre le câblage de l’outil d’agent :

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

- Conservez dans le cœur la sélection du fournisseur, la résolution des identifiants et la sémantique partagée des requêtes.
- Utilisez les fournisseurs de recherche web pour les transports de recherche spécifiques aux fournisseurs.
- `api.runtime.webSearch.*` est la surface partagée privilégiée pour les plugins de fonctionnalité/canal qui ont besoin d’un comportement de recherche sans dépendre du wrapper de l’outil d’agent.

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

- `generate(...)` : générer une image en utilisant la chaîne configurée de fournisseurs de génération d’images.
- `listProviders(...)` : lister les fournisseurs de génération d’images disponibles et leurs capacités.

## Routes HTTP de Gateway

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
- `auth` : obligatoire. Utilisez `"gateway"` pour exiger l’authentification normale de la Gateway, ou `"plugin"` pour l’authentification gérée par plugin / la vérification de Webhook.
- `match` : facultatif. `"exact"` (par défaut) ou `"prefix"`.
- `replaceExisting` : facultatif. Permet au même plugin de remplacer son propre enregistrement de route existant.
- `handler` : renvoyer `true` lorsque la route a traité la requête.

Remarques :

- `api.registerHttpHandler(...)` a été supprimé et provoquera une erreur de chargement du plugin. Utilisez plutôt `api.registerHttpRoute(...)`.
- Les routes de plugin doivent déclarer `auth` explicitement.
- Les conflits exacts `path + match` sont rejetés sauf si `replaceExisting: true`, et un plugin ne peut pas remplacer la route d’un autre plugin.
- Les routes qui se chevauchent avec des niveaux `auth` différents sont rejetées. Gardez les chaînes de retombée `exact`/`prefix` au même niveau d’authentification uniquement.
- Les routes `auth: "plugin"` ne reçoivent **pas** automatiquement les portées runtime d’opérateur. Elles sont destinées aux Webhook gérés par plugin / à la vérification de signature, pas aux appels privilégiés aux assistants Gateway.
- Les routes `auth: "gateway"` s’exécutent dans une portée runtime de requête Gateway, mais cette portée est volontairement conservatrice :
  - l’authentification bearer par secret partagé (`gateway.auth.mode = "token"` / `"password"`) garde les portées runtime de route plugin épinglées à `operator.write`, même si l’appelant envoie `x-openclaw-scopes`
  - les modes HTTP approuvés porteurs d’identité (par exemple `trusted-proxy` ou `gateway.auth.mode = "none"` sur une entrée privée) n’honorent `x-openclaw-scopes` que lorsque cet en-tête est explicitement présent
  - si `x-openclaw-scopes` est absent sur ces requêtes de route plugin porteuses d’identité, la portée runtime retombe sur `operator.write`
- Règle pratique : ne présumez pas qu’une route plugin authentifiée par Gateway constitue implicitement une surface admin. Si votre route a besoin d’un comportement réservé à l’administration, exigez un mode d’authentification porteur d’identité et documentez le contrat explicite d’en-tête `x-openclaw-scopes`.

## Chemins d’import du SDK de plugin

Utilisez les sous-chemins du SDK au lieu de l’import monolithique `openclaw/plugin-sdk` lorsque
vous créez des plugins :

- `openclaw/plugin-sdk/plugin-entry` pour les primitives d’enregistrement de plugin.
- `openclaw/plugin-sdk/core` pour le contrat générique partagé orienté plugin.
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
  `openclaw/plugin-sdk/secret-input`, et
  `openclaw/plugin-sdk/webhook-ingress` pour le câblage partagé
  de configuration/authentification/réponse/Webhook. `channel-inbound` est la maison partagée pour l’anti-rebond, la correspondance des mentions,
  les assistants de politique de mention entrante, le formatage des enveloppes et les assistants de
  contexte d’enveloppe entrante.
  `channel-setup` est le joint étroit de configuration facultative d’installation.
  `setup-runtime` est la surface de configuration sûre à l’exécution utilisée par `setupEntry` /
  démarrage différé, y compris les adaptateurs de patch de configuration sûrs à l’import.
  `setup-adapter-runtime` est le joint d’adaptateur de configuration de compte sensible à l’env.
  `setup-tools` est le petit joint d’assistants CLI/archive/docs (`formatCliCommand`,
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
  `openclaw/plugin-sdk/directory-runtime` pour les assistants partagés de runtime/configuration.
  `telegram-command-config` est le joint public étroit pour la normalisation/validation des commandes personnalisées Telegram et reste disponible même si la surface de contrat Telegram intégrée est temporairement indisponible.
  `text-runtime` est le joint partagé texte/Markdown/journalisation, y compris
  la suppression du texte visible par l’assistant, les assistants de rendu/segmentation Markdown, les assistants
  de caviardage, les assistants de balises de directives et les utilitaires de texte sûr.
- Les joints de canal spécifiques à l’approbation doivent préférer un contrat `approvalCapability` sur le plugin. Le cœur lit ensuite l’authentification d’approbation, la livraison, le rendu,
  le routage natif et le comportement du gestionnaire natif paresseux via cette capacité unique
  au lieu de mélanger le comportement d’approbation à des champs de plugin non liés.
- `openclaw/plugin-sdk/channel-runtime` est déprécié et ne reste disponible que comme
  shim de compatibilité pour les anciens plugins. Le nouveau code doit importer les primitives génériques plus étroites à la place, et le code du dépôt ne doit pas ajouter de nouveaux imports de ce
  shim.
- Les éléments internes des extensions intégrées restent privés. Les plugins externes doivent utiliser uniquement les sous-chemins `openclaw/plugin-sdk/*`. Le code cœur/tests d’OpenClaw peut utiliser les points d’entrée publics du dépôt sous la racine d’un package plugin tels que `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js`, et des fichiers de portée étroite tels que
  `login-qr-api.js`. N’importez jamais le `src/*` d’un package plugin depuis le cœur ou depuis
  une autre extension.
- Découpage des points d’entrée du dépôt :
  `<plugin-package-root>/api.js` est le barrel d’assistants/types,
  `<plugin-package-root>/runtime-api.js` est le barrel runtime-only,
  `<plugin-package-root>/index.js` est le point d’entrée du plugin intégré,
  et `<plugin-package-root>/setup-entry.js` est le point d’entrée du plugin de configuration.
- Exemples actuels de fournisseurs intégrés :
  - Anthropic utilise `api.js` / `contract-api.js` pour les assistants de flux Claude tels que
    `wrapAnthropicProviderStream`, les assistants d’en-têtes bêta et l’analyse de `service_tier`.
  - OpenAI utilise `api.js` pour les constructeurs de fournisseurs, les assistants de modèle par défaut, et
    les constructeurs de fournisseurs temps réel.
  - OpenRouter utilise `api.js` pour son constructeur de fournisseur ainsi que les assistants
    d’onboarding/configuration, tandis que `register.runtime.js` peut encore réexporter des assistants génériques
    `plugin-sdk/provider-stream` pour un usage local au dépôt.
- Les points d’entrée publics chargés via façade préfèrent l’instantané de configuration runtime actif
  lorsqu’il existe, puis retombent sur le fichier de configuration résolu sur disque lorsque
  OpenClaw ne sert pas encore d’instantané runtime.
- Les primitives génériques partagées restent le contrat public privilégié du SDK. Un petit
  ensemble réservé de compatibilité de joints d’assistants de marque de canaux intégrés existe encore. Traitez-les comme des joints de maintenance/compatibilité des plugins intégrés, pas comme de nouvelles cibles d’import tierces ; les nouveaux contrats inter-canaux doivent toujours arriver sur des sous-chemins génériques `plugin-sdk/*` ou sur les barrels locaux au plugin `api.js` /
  `runtime-api.js`.

Remarque de compatibilité :

- Évitez le barrel racine `openclaw/plugin-sdk` pour tout nouveau code.
- Préférez d’abord les primitives stables étroites. Les sous-chemins plus récents setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool sont le contrat visé pour les nouveaux
  travaux de plugins intégrés et externes.
  L’analyse/la correspondance des cibles relève de `openclaw/plugin-sdk/channel-targets`.
  Les garde-fous d’actions de message et les assistants d’identifiant de message de réaction relèvent de
  `openclaw/plugin-sdk/channel-actions`.
- Les barrels d’assistants spécifiques aux extensions intégrées ne sont pas stables par défaut. Si un
  assistant n’est nécessaire que pour une extension intégrée, gardez-le derrière le
  joint local `api.js` ou `runtime-api.js` de l’extension au lieu de le promouvoir dans
  `openclaw/plugin-sdk/<extension>`.
- Les nouveaux joints d’assistants partagés doivent être génériques, pas marqués par un canal. L’analyse partagée
  des cibles relève de `openclaw/plugin-sdk/channel-targets` ; les
  éléments internes spécifiques au canal restent derrière le joint local `api.js` ou `runtime-api.js`
  du plugin propriétaire.
- Les sous-chemins spécifiques à une capacité comme `image-generation`,
  `media-understanding` et `speech` existent parce que les plugins
  intégrés/natifs les utilisent aujourd’hui. Leur présence ne signifie pas à elle seule que chaque assistant exporté constitue un contrat externe figé à long terme.

## Schémas de l’outil message

Les plugins doivent posséder les contributions de schéma `describeMessageTool(...)` spécifiques au canal
pour les primitives non liées au message telles que les réactions, les lectures et les sondages.
La présentation partagée d’envoi doit utiliser le contrat générique `MessagePresentation`
au lieu de champs natifs au fournisseur pour boutons, composants, blocs ou cartes.
Voir [Message Presentation](/fr/plugins/message-presentation) pour le contrat,
les règles de repli, le mapping fournisseur et la liste de contrôle des auteurs de plugins.

Les plugins capables d’envoyer déclarent ce qu’ils peuvent rendre via les capacités de message :

- `presentation` pour les blocs de présentation sémantique (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` pour les demandes de livraison épinglée

Le cœur décide s’il faut rendre la présentation nativement ou la dégrader en texte.
N’exposez pas d’échappatoires d’interface natives au fournisseur depuis l’outil de message générique.
Les assistants SDK dépréciés pour les anciens schémas natifs restent exportés pour les
plugins tiers existants, mais les nouveaux plugins ne doivent pas les utiliser.

## Résolution des cibles de canal

Les plugins de canal doivent posséder la sémantique des cibles spécifique au canal. Gardez l’hôte de sortie
partagé générique et utilisez la surface d’adaptateur de messagerie pour les règles fournisseur :

- `messaging.inferTargetChatType({ to })` décide si une cible normalisée
  doit être traitée comme `direct`, `group`, ou `channel` avant la recherche d’annuaire.
- `messaging.targetResolver.looksLikeId(raw, normalized)` indique au cœur si une
  entrée doit ignorer la recherche d’annuaire et passer directement à une résolution de type identifiant.
- `messaging.targetResolver.resolveTarget(...)` est le repli du plugin lorsque le
  cœur a besoin d’une résolution finale appartenant au fournisseur après normalisation ou après un
  échec d’annuaire.
- `messaging.resolveOutboundSessionRoute(...)` possède la construction spécifique au fournisseur
  de la route de session une fois la cible résolue.

Répartition recommandée :

- Utilisez `inferTargetChatType` pour les décisions de catégorie qui doivent se produire avant
  la recherche parmi pairs/groupes.
- Utilisez `looksLikeId` pour les vérifications « traiter ceci comme un identifiant de cible explicite/natif ».
- Utilisez `resolveTarget` pour le repli de normalisation spécifique au fournisseur, pas pour une
  recherche large dans l’annuaire.
- Gardez les identifiants natifs au fournisseur comme identifiants de chat, identifiants de fil, JID, handles et identifiants de salle
  dans les valeurs `target` ou dans des paramètres spécifiques au fournisseur, pas dans des champs génériques du SDK.

## Annuaires adossés à la configuration

Les plugins qui dérivent des entrées d’annuaire à partir de la configuration doivent garder cette logique dans le
plugin et réutiliser les assistants partagés de
`openclaw/plugin-sdk/directory-runtime`.

Utilisez cela lorsqu’un canal a besoin de pairs/groupes adossés à la configuration tels que :

- des pairs de messages privés pilotés par liste d’autorisation
- des maps configurées de canal/groupe
- des replis statiques d’annuaire limités au compte

Les assistants partagés de `directory-runtime` ne gèrent que des opérations génériques :

- filtrage de requêtes
- application des limites
- assistants de déduplication/normalisation
- construction de `ChannelDirectoryEntry[]`

L’inspection des comptes spécifique au canal et la normalisation des identifiants doivent rester dans
l’implémentation du plugin.

## Catalogues de fournisseurs

Les plugins fournisseurs peuvent définir des catalogues de modèles pour l’inférence avec
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` renvoie la même forme qu’OpenClaw écrit dans
`models.providers` :

- `{ provider }` pour une entrée unique de fournisseur
- `{ providers }` pour plusieurs entrées de fournisseur

Utilisez `catalog` lorsque le plugin possède des identifiants de modèle spécifiques au fournisseur, des valeurs par défaut d’URL de base, ou des métadonnées de modèle protégées par authentification.

`catalog.order` contrôle le moment où le catalogue d’un plugin fusionne relativement aux
fournisseurs implicites intégrés d’OpenClaw :

- `simple` : fournisseurs simples pilotés par clé API ou env
- `profile` : fournisseurs qui apparaissent lorsque des profils d’authentification existent
- `paired` : fournisseurs qui synthétisent plusieurs entrées de fournisseur liées
- `late` : dernière passe, après les autres fournisseurs implicites

Les fournisseurs plus tardifs gagnent en cas de collision de clé, de sorte que les plugins peuvent volontairement remplacer une entrée de fournisseur intégrée avec le même identifiant de fournisseur.

Compatibilité :

- `discovery` fonctionne encore comme alias hérité
- si `catalog` et `discovery` sont tous deux enregistrés, OpenClaw utilise `catalog`

## Inspection de canal en lecture seule

Si votre plugin enregistre un canal, préférez implémenter
`plugin.config.inspectAccount(cfg, accountId)` en parallèle de `resolveAccount(...)`.

Pourquoi :

- `resolveAccount(...)` est le chemin d’exécution. Il peut supposer que les identifiants
  sont entièrement matérialisés et peut échouer rapidement lorsque des secrets requis manquent.
- Les chemins de commande en lecture seule tels que `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, et les flux de doctor/réparation
  de configuration ne doivent pas avoir besoin de matérialiser des identifiants runtime juste pour
  décrire la configuration.

Comportement recommandé de `inspectAccount(...)` :

- Renvoyer uniquement un état descriptif du compte.
- Préserver `enabled` et `configured`.
- Inclure des champs de source/statut d’identifiants lorsque pertinent, tels que :
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Vous n’avez pas besoin de renvoyer les valeurs brutes des jetons juste pour signaler une
  disponibilité en lecture seule. Renvoyer `tokenStatus: "available"` (et le champ de source correspondant)
  suffit pour des commandes de type statut.
- Utilisez `configured_unavailable` lorsqu’un identifiant est configuré via SecretRef mais
  indisponible dans le chemin de commande courant.

Cela permet aux commandes en lecture seule d’indiquer « configuré mais indisponible dans ce chemin de commande »
au lieu de planter ou de signaler à tort que le compte n’est pas configuré.

## Package packs

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

Garde-fou de sécurité : chaque entrée `openclaw.extensions` doit rester dans le répertoire du plugin
après résolution des liens symboliques. Les entrées qui s’échappent du répertoire du package sont
rejetées.

Remarque de sécurité : `openclaw plugins install` installe les dépendances de plugin avec
`npm install --omit=dev --ignore-scripts` (aucun script de cycle de vie, aucune dépendance de développement à l’exécution). Gardez les arbres de dépendances des plugins en « pur JS/TS » et évitez les packages qui exigent des builds `postinstall`.

Facultatif : `openclaw.setupEntry` peut pointer vers un module léger réservé à la configuration.
Lorsque OpenClaw a besoin de surfaces de configuration pour un plugin de canal désactivé, ou
lorsqu’un plugin de canal est activé mais encore non configuré, il charge `setupEntry`
au lieu du point d’entrée complet du plugin. Cela allège le démarrage et la configuration
lorsque le point d’entrée principal du plugin câble aussi des outils, hooks ou autre code
réservé à l’exécution.

Facultatif : `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
peut faire opter un plugin de canal pour le même chemin `setupEntry` pendant la phase
de démarrage pre-listen de la Gateway, même lorsque le canal est déjà configuré.

Utilisez cela uniquement lorsque `setupEntry` couvre complètement la surface de démarrage qui doit exister
avant que la Gateway ne commence à écouter. En pratique, cela signifie que le point d’entrée de configuration
doit enregistrer chaque capacité appartenant au canal dont le démarrage dépend, telle que :

- l’enregistrement du canal lui-même
- toute route HTTP qui doit être disponible avant que la Gateway ne commence à écouter
- toute méthode Gateway, tout outil ou tout service qui doit exister pendant cette même fenêtre

Si votre point d’entrée complet possède encore une capacité de démarrage requise, n’activez pas
ce drapeau. Gardez le comportement par défaut du plugin et laissez OpenClaw charger le
point d’entrée complet pendant le démarrage.

Les canaux intégrés peuvent aussi publier des assistants de surface de contrat réservés à la configuration que le cœur
peut consulter avant que le runtime complet du canal ne soit chargé. La surface actuelle de promotion de configuration
est :

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Le cœur utilise cette surface lorsqu’il doit promouvoir une ancienne configuration de canal à compte unique
dans `channels.<id>.accounts.*` sans charger le point d’entrée complet du plugin.
Matrix est l’exemple intégré actuel : il ne déplace que les clés d’authentification/bootstrap dans un
compte promu nommé lorsque des comptes nommés existent déjà, et il peut préserver une
clé configurée de compte par défaut non canonique au lieu de toujours créer
`accounts.default`.

Ces adaptateurs de patch de configuration gardent paresseuse la découverte de surface de contrat intégrée. Le temps d’import reste léger ; la surface de promotion n’est chargée qu’au premier usage au lieu de réentrer dans le démarrage du canal intégré lors de l’import du module.

Lorsque ces surfaces de démarrage incluent des méthodes RPC de Gateway, gardez-les sur un
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
des indices d’installation via `openclaw.install`. Cela permet au catalogue du cœur de rester sans données.

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

- `detailLabel` : libellé secondaire pour les surfaces plus riches de catalogue/statut
- `docsLabel` : remplace le texte du lien de documentation
- `preferOver` : identifiants de plugin/canal de priorité plus faible que cette entrée de catalogue doit dépasser
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras` : contrôles de copie pour les surfaces de sélection
- `markdownCapable` : marque le canal comme compatible Markdown pour les décisions de formatage sortant
- `exposure.configured` : masque le canal des surfaces de liste des canaux configurés lorsqu’il vaut `false`
- `exposure.setup` : masque le canal des sélecteurs interactifs de configuration/paramétrage lorsqu’il vaut `false`
- `exposure.docs` : marque le canal comme interne/privé pour les surfaces de navigation de la documentation
- `showConfigured` / `showInSetup` : alias hérités toujours acceptés pour compatibilité ; préférez `exposure`
- `quickstartAllowFrom` : fait participer le canal au flux quickstart standard `allowFrom`
- `forceAccountBinding` : exige une liaison explicite du compte même lorsqu’un seul compte existe
- `preferSessionLookupForAnnounceTarget` : préfère la recherche de session lors de la résolution des cibles d’annonce

OpenClaw peut aussi fusionner des **catalogues de canaux externes** (par exemple, un export
de registre MPM). Déposez un fichier JSON à l’un de ces emplacements :

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Ou pointez `OPENCLAW_PLUGIN_CATALOG_PATHS` (ou `OPENCLAW_MPM_CATALOG_PATHS`) vers
un ou plusieurs fichiers JSON (délimités par virgule/point-virgule/`PATH`). Chaque fichier doit
contenir `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. L’analyseur accepte aussi `"packages"` ou `"plugins"` comme alias hérités de la clé `"entries"`.

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

Si votre moteur ne possède **pas** l’algorithme de Compaction, gardez `compact()`
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

Lorsqu’un plugin a besoin d’un comportement qui n’entre pas dans l’API actuelle, ne contournez pas
le système de plugins avec un accès privé direct. Ajoutez la capacité manquante.

Séquence recommandée :

1. définir le contrat du cœur
   Décidez quel comportement partagé le cœur doit posséder : politique, repli, fusion de configuration,
   cycle de vie, sémantique côté canal, et forme de l’assistant runtime.
2. ajouter des surfaces typées d’enregistrement/runtime de plugin
   Étendez `OpenClawPluginApi` et/ou `api.runtime` avec la plus petite surface utile
   de capacité typée.
3. connecter le cœur + les consommateurs canal/fonctionnalité
   Les canaux et plugins de fonctionnalité doivent consommer la nouvelle capacité via le cœur,
   pas en important directement une implémentation fournisseur.
4. enregistrer des implémentations fournisseur
   Les plugins fournisseurs enregistrent ensuite leurs backends contre cette capacité.
5. ajouter une couverture de contrat
   Ajoutez des tests afin que la propriété et la forme de l’enregistrement restent explicites au fil du temps.

C’est ainsi qu’OpenClaw reste prescriptif sans devenir codé en dur selon la vision d’un seul
fournisseur. Voir le [Capability Cookbook](/fr/plugins/architecture)
pour une liste concrète de fichiers et un exemple détaillé.

### Liste de contrôle de capacité

Lorsque vous ajoutez une nouvelle capacité, l’implémentation doit généralement toucher ensemble
ces surfaces :

- types du contrat du cœur dans `src/<capability>/types.ts`
- runner/assistant runtime du cœur dans `src/<capability>/runtime.ts`
- surface d’enregistrement de l’API de plugin dans `src/plugins/types.ts`
- câblage du registre de plugins dans `src/plugins/registry.ts`
- exposition runtime du plugin dans `src/plugins/runtime/*` lorsque les plugins de fonctionnalité/canal
  doivent la consommer
- assistants de capture/test dans `src/test-utils/plugin-registration.ts`
- assertions de propriété/contrat dans `src/plugins/contracts/registry.ts`
- documentation opérateur/plugin dans `docs/`

Si l’une de ces surfaces manque, c’est généralement le signe que la capacité n’est
pas encore entièrement intégrée.

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
- les plugins de fonctionnalité/canal consomment les assistants runtime
- les tests de contrat gardent la propriété explicite
