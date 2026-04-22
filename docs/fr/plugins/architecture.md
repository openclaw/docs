---
read_when:
    - Créer ou déboguer des Plugin OpenClaw natifs
    - Comprendre le modèle de capacités des Plugin ou les limites de propriété
    - Travailler sur le pipeline de chargement ou le registre des Plugin
    - Implémenter des hooks d’exécution de fournisseur ou des Plugin de canal
sidebarTitle: Internals
summary: 'Internes des Plugin : modèle de capacités, propriété, contrats, pipeline de chargement et assistants d’exécution'
title: Internes des Plugin
x-i18n:
    generated_at: "2026-04-22T04:24:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69080a1d0e496b321a6fd5a3e925108c3a03c41710073f8f23af13933a091e28
    source_path: plugins/architecture.md
    workflow: 15
---

# Internes des Plugin

<Info>
  Ceci est la **référence d’architecture approfondie**. Pour des guides pratiques, voir :
  - [Installer et utiliser des plugins](/fr/tools/plugin) — guide utilisateur
  - [Prise en main](/fr/plugins/building-plugins) — premier tutoriel de Plugin
  - [Plugin de canal](/fr/plugins/sdk-channel-plugins) — créer un canal de messagerie
  - [Plugin de fournisseur](/fr/plugins/sdk-provider-plugins) — créer un fournisseur de modèle
  - [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) — carte d’importation et API d’enregistrement
</Info>

Cette page couvre l’architecture interne du système de Plugin d’OpenClaw.

## Modèle public de capacités

Les capacités constituent le modèle public de **Plugin natif** dans OpenClaw. Chaque
Plugin OpenClaw natif s’enregistre auprès d’un ou plusieurs types de capacités :

| Capacité                | Méthode d’enregistrement                        | Exemples de Plugin                    |
| ----------------------- | ----------------------------------------------- | ------------------------------------- |
| Inférence de texte      | `api.registerProvider(...)`                     | `openai`, `anthropic`                 |
| Backend d’inférence CLI | `api.registerCliBackend(...)`                   | `openai`, `anthropic`                 |
| Parole                  | `api.registerSpeechProvider(...)`               | `elevenlabs`, `microsoft`             |
| Transcription temps réel | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                            |
| Voix en temps réel      | `api.registerRealtimeVoiceProvider(...)`        | `openai`                              |
| Compréhension des médias | `api.registerMediaUnderstandingProvider(...)`  | `openai`, `google`                    |
| Génération d’images     | `api.registerImageGenerationProvider(...)`      | `openai`, `google`, `fal`, `minimax`  |
| Génération musicale     | `api.registerMusicGenerationProvider(...)`      | `google`, `minimax`                   |
| Génération vidéo        | `api.registerVideoGenerationProvider(...)`      | `qwen`                                |
| Récupération web        | `api.registerWebFetchProvider(...)`             | `firecrawl`                           |
| Recherche web           | `api.registerWebSearchProvider(...)`            | `google`                              |
| Canal / messagerie      | `api.registerChannel(...)`                      | `msteams`, `matrix`                   |

Un Plugin qui enregistre zéro capacité mais fournit des hooks, des outils ou des
services est un Plugin **hook-only hérité**. Ce modèle reste entièrement pris en charge.

### Position sur la compatibilité externe

Le modèle de capacités est intégré au cœur et utilisé aujourd’hui par les Plugin
natifs/fournis, mais la compatibilité des Plugin externes exige encore une barre plus stricte que « c’est
exporté, donc c’est figé ».

Consignes actuelles :

- **plugins externes existants :** conservez le bon fonctionnement des intégrations basées sur des hooks ; traitez
  cela comme la base de compatibilité
- **nouveaux plugins fournis/natifs :** préférez l’enregistrement explicite de capacités aux
  accès spécifiques à un fournisseur ou aux nouveaux designs hook-only
- **plugins externes adoptant l’enregistrement de capacités :** autorisés, mais considérez les
  surfaces d’assistance spécifiques aux capacités comme évolutives, sauf si la documentation marque explicitement
  un contrat comme stable

Règle pratique :

- les API d’enregistrement de capacités sont la direction visée
- les hooks hérités restent la voie la plus sûre, sans rupture, pour les Plugin externes pendant
  la transition
- tous les sous-chemins d’assistance exportés ne se valent pas ; préférez le contrat étroit
  documenté, et non les exportations d’assistance fortuites

### Formes de Plugin

OpenClaw classe chaque Plugin chargé dans une forme selon son comportement réel
d’enregistrement (pas seulement selon les métadonnées statiques) :

- **plain-capability** -- enregistre exactement un type de capacité (par exemple un
  Plugin uniquement fournisseur comme `mistral`)
- **hybrid-capability** -- enregistre plusieurs types de capacités (par exemple
  `openai` possède l’inférence de texte, la parole, la compréhension des médias et la génération
  d’images)
- **hook-only** -- enregistre uniquement des hooks (typés ou personnalisés), sans capacités,
  outils, commandes ni services
- **non-capability** -- enregistre des outils, commandes, services ou routes mais pas de
  capacités

Utilisez `openclaw plugins inspect <id>` pour voir la forme d’un Plugin et la répartition
de ses capacités. Voir [référence CLI](/cli/plugins#inspect) pour plus de détails.

### Hooks hérités

Le hook `before_agent_start` reste pris en charge comme voie de compatibilité pour les
Plugin hook-only. Des Plugin réels hérités en dépendent encore.

Orientation :

- le conserver fonctionnel
- le documenter comme hérité
- préférer `before_model_resolve` pour le travail de remplacement de modèle/fournisseur
- préférer `before_prompt_build` pour le travail de mutation de prompt
- ne le supprimer qu’après baisse de l’usage réel et une couverture par fixtures prouvant la sûreté de la migration

### Signaux de compatibilité

Lorsque vous exécutez `openclaw doctor` ou `openclaw plugins inspect <id>`, vous pouvez voir
l’une de ces étiquettes :

| Signal                     | Signification                                             |
| -------------------------- | --------------------------------------------------------- |
| **config valid**           | La configuration s’analyse correctement et les Plugin se résolvent |
| **compatibility advisory** | Le Plugin utilise un modèle pris en charge mais plus ancien (par ex. `hook-only`) |
| **legacy warning**         | Le Plugin utilise `before_agent_start`, qui est obsolète |
| **hard error**             | La configuration est invalide ou le Plugin n’a pas pu se charger |

Ni `hook-only` ni `before_agent_start` ne casseront votre Plugin aujourd’hui --
`hook-only` est indicatif, et `before_agent_start` ne déclenche qu’un avertissement. Ces
signaux apparaissent aussi dans `openclaw status --all` et `openclaw plugins doctor`.

## Vue d’ensemble de l’architecture

Le système de Plugin d’OpenClaw comporte quatre couches :

1. **Manifeste + découverte**
   OpenClaw trouve les Plugin candidats à partir des chemins configurés, des racines d’espace de travail,
   des racines globales d’extension et des extensions fournies. La découverte lit d’abord les
   manifestes natifs `openclaw.plugin.json` ainsi que les manifestes de bundle pris en charge.
2. **Activation + validation**
   Le cœur décide si un Plugin découvert est activé, désactivé, bloqué ou
   sélectionné pour un emplacement exclusif tel que la mémoire.
3. **Chargement à l’exécution**
   Les Plugin OpenClaw natifs sont chargés en processus via jiti et enregistrent leurs
   capacités dans un registre central. Les bundles compatibles sont normalisés en
   enregistrements de registre sans importer de code d’exécution.
4. **Consommation de surface**
   Le reste d’OpenClaw lit le registre pour exposer outils, canaux, configuration des
   fournisseurs, hooks, routes HTTP, commandes CLI et services.

Pour la CLI des Plugin en particulier, la découverte des commandes racine est divisée en deux phases :

- les métadonnées au moment de l’analyse proviennent de `registerCli(..., { descriptors: [...] })`
- le vrai module CLI du Plugin peut rester lazy et s’enregistrer à la première invocation

Cela permet de garder le code CLI possédé par le Plugin à l’intérieur du Plugin tout en laissant OpenClaw
réserver les noms des commandes racine avant l’analyse.

La limite de conception importante :

- la découverte + la validation de configuration doivent fonctionner à partir des **métadonnées de manifeste/schéma**
  sans exécuter le code du Plugin
- le comportement d’exécution natif provient du chemin `register(api)` du module du Plugin

Cette séparation permet à OpenClaw de valider la configuration, d’expliquer les Plugin manquants/désactivés, et
de construire des indices d’UI/schéma avant que l’exécution complète soit active.

### Plugin de canal et outil de message partagé

Les Plugin de canal n’ont pas besoin d’enregistrer un outil séparé d’envoi/édition/réaction pour
les actions de chat normales. OpenClaw conserve un outil `message` partagé dans le cœur, et les
Plugin de canal possèdent la découverte et l’exécution spécifiques au canal derrière celui-ci.

La limite actuelle est :

- le cœur possède l’hôte de l’outil `message` partagé, le câblage du prompt, la gestion des sessions/fils
  et la répartition de l’exécution
- les Plugin de canal possèdent la découverte des actions à portée limitée, la découverte des capacités et tous les
  fragments de schéma spécifiques au canal
- les Plugin de canal possèdent la grammaire de conversation de session spécifique au fournisseur, par exemple
  la manière dont les identifiants de conversation encodent les IDs de fil ou héritent des conversations parentes
- les Plugin de canal exécutent l’action finale via leur adaptateur d’action

Pour les Plugin de canal, la surface du SDK est
`ChannelMessageActionAdapter.describeMessageTool(...)`. Cet appel unifié de découverte
permet à un Plugin de renvoyer ses actions visibles, ses capacités et ses contributions de schéma
ensemble afin que ces éléments ne divergent pas.

Lorsqu’un paramètre de l’outil message spécifique à un canal transporte une source média telle qu’un
chemin local ou une URL média distante, le Plugin doit aussi renvoyer
`mediaSourceParams` depuis `describeMessageTool(...)`. Le cœur utilise cette liste explicite
pour appliquer la normalisation des chemins de sandbox et les indications d’accès aux médias sortants
sans coder en dur les noms de paramètres possédés par le Plugin.
Préférez ici des maps limitées à l’action, et non une liste plate à l’échelle du canal, afin qu’un
paramètre média réservé au profil ne soit pas normalisé sur des actions non liées comme
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

Cela importe pour les Plugin sensibles au contexte. Un canal peut masquer ou exposer des
actions de message selon le compte actif, la salle/le fil/le message actuel ou
l’identité approuvée du demandeur, sans coder en dur des branches spécifiques au canal dans
l’outil `message` du cœur.

C’est pourquoi les changements de routage du moteur embarqué restent un travail de Plugin : le moteur est
responsable de transmettre l’identité courante de chat/session à la limite de découverte du Plugin afin que l’outil `message` partagé expose la surface correcte possédée par le canal
pour le tour courant.

Pour les assistants d’exécution possédés par le canal, les Plugin fournis doivent conserver l’exécution
dans leurs propres modules d’extension. Le cœur ne possède plus les
runtimes d’action de message Discord, Slack, Telegram ou WhatsApp sous `src/agents/tools`.
Nous ne publions pas de sous-chemins séparés `plugin-sdk/*-action-runtime`, et les Plugin fournis
doivent importer directement leur propre code d’exécution local depuis leurs
modules possédés par l’extension.

La même limite s’applique en général aux jonctions du SDK nommées par fournisseur : le cœur ne doit
pas importer de barrels de commodité spécifiques à un canal pour Slack, Discord, Signal,
WhatsApp ou des extensions similaires. Si le cœur a besoin d’un comportement, il doit soit consommer le
barrel `api.ts` / `runtime-api.ts` du Plugin fourni lui-même, soit promouvoir ce besoin
en une capacité générique étroite dans le SDK partagé.

Pour les sondages en particulier, il existe deux chemins d’exécution :

- `outbound.sendPoll` est la base partagée pour les canaux qui correspondent au modèle commun
  de sondage
- `actions.handleAction("poll")` est le chemin privilégié pour la sémantique de sondage spécifique au canal ou les paramètres de sondage supplémentaires

Le cœur diffère désormais l’analyse partagée des sondages jusqu’à ce que la répartition de sondage du Plugin refuse
l’action, afin que les gestionnaires de sondage possédés par le Plugin puissent accepter des champs de sondage spécifiques au canal sans être bloqués d’abord par l’analyseur générique de sondage.

Voir [Pipeline de chargement](#load-pipeline) pour la séquence complète de démarrage.

## Modèle de propriété des capacités

OpenClaw traite un Plugin natif comme la limite de propriété pour une **entreprise** ou une
**fonctionnalité**, et non comme un fourre-tout d’intégrations sans rapport.

Cela signifie :

- un Plugin d’entreprise doit généralement posséder toutes les
  surfaces d’OpenClaw tournées vers cette entreprise
- un Plugin de fonctionnalité doit généralement posséder la surface complète de la fonctionnalité qu’il introduit
- les canaux doivent consommer les capacités partagées du cœur au lieu de réimplémenter
  ad hoc le comportement des fournisseurs

Exemples :

- le Plugin fourni `openai` possède le comportement de fournisseur de modèle OpenAI ainsi que les comportements OpenAI
  de parole + voix en temps réel + compréhension des médias + génération d’images
- le Plugin fourni `elevenlabs` possède le comportement de parole ElevenLabs
- le Plugin fourni `microsoft` possède le comportement de parole Microsoft
- le Plugin fourni `google` possède le comportement de fournisseur de modèle Google ainsi que les comportements Google
  de compréhension des médias + génération d’images + recherche web
- le Plugin fourni `firecrawl` possède le comportement de récupération web Firecrawl
- les Plugin fournis `minimax`, `mistral`, `moonshot` et `zai` possèdent leurs
  backends de compréhension des médias
- le Plugin fourni `qwen` possède le comportement de fournisseur de texte Qwen ainsi que
  les comportements de compréhension des médias et de génération vidéo
- le Plugin `voice-call` est un Plugin de fonctionnalité : il possède le transport d’appel, les outils,
  la CLI, les routes et le pont de flux média Twilio, mais il consomme les capacités partagées
  de parole ainsi que de transcription en temps réel et de voix en temps réel au lieu
  d’importer directement les Plugin de fournisseur

L’état final visé est :

- OpenAI vit dans un seul Plugin même s’il couvre les modèles de texte, la parole, les images et la
  future vidéo
- un autre fournisseur peut faire de même pour sa propre surface
- les canaux ne se soucient pas de savoir quel Plugin fournisseur possède le fournisseur ; ils consomment le
  contrat de capacité partagée exposé par le cœur

C’est la distinction clé :

- **plugin** = limite de propriété
- **capability** = contrat du cœur que plusieurs Plugin peuvent implémenter ou consommer

Ainsi, si OpenClaw ajoute un nouveau domaine comme la vidéo, la première question n’est pas
« quel fournisseur doit coder en dur la gestion vidéo ? » La première question est « quel est
le contrat de capacité vidéo du cœur ? » Une fois ce contrat existant, les Plugin fournisseurs
peuvent s’y enregistrer et les Plugin de canal/fonctionnalité peuvent le consommer.

Si la capacité n’existe pas encore, le bon mouvement est généralement :

1. définir la capacité manquante dans le cœur
2. l’exposer via l’API/le runtime du Plugin de façon typée
3. connecter les canaux/fonctionnalités à cette capacité
4. laisser les Plugin fournisseurs enregistrer des implémentations

Cela maintient une propriété explicite tout en évitant un comportement du cœur dépendant d’un
seul fournisseur ou d’un chemin de code ponctuel spécifique à un Plugin.

### Stratification des capacités

Utilisez ce modèle mental pour décider où le code doit se trouver :

- **couche de capacité du cœur** : orchestration partagée, politique, repli, règles de fusion
  de configuration, sémantique de livraison et contrats typés
- **couche de Plugin fournisseur** : API spécifiques au fournisseur, authentification, catalogues de modèles, synthèse vocale,
  génération d’images, futurs backends vidéo, points de terminaison d’utilisation
- **couche de Plugin de canal/fonctionnalité** : intégration Slack/Discord/voice-call/etc.
  qui consomme les capacités du cœur et les présente sur une surface

Par exemple, TTS suit cette forme :

- le cœur possède la politique TTS au moment de la réponse, l’ordre de repli, les préférences et la livraison par canal
- `openai`, `elevenlabs` et `microsoft` possèdent les implémentations de synthèse
- `voice-call` consomme l’assistant d’exécution TTS de téléphonie

Ce même modèle doit être privilégié pour les futures capacités.

### Exemple de Plugin d’entreprise multi-capacités

Un Plugin d’entreprise doit paraître cohérent vu de l’extérieur. Si OpenClaw a des
contrats partagés pour les modèles, la parole, la transcription temps réel, la voix en temps réel, la compréhension des médias,
la génération d’images, la génération vidéo, la récupération web et la recherche web,
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

Ce qui importe n’est pas le nom exact des assistants. La forme importe :

- un seul Plugin possède la surface du fournisseur
- le cœur possède toujours les contrats de capacité
- les canaux et Plugin de fonctionnalité consomment les assistants `api.runtime.*`, pas le code fournisseur
- les tests de contrat peuvent vérifier que le Plugin a enregistré les capacités qu’il
  prétend posséder

### Exemple de capacité : compréhension vidéo

OpenClaw traite déjà la compréhension image/audio/vidéo comme une seule
capacité partagée. Le même modèle de propriété s’y applique :

1. le cœur définit le contrat de compréhension des médias
2. les Plugin fournisseurs enregistrent `describeImage`, `transcribeAudio` et
   `describeVideo` selon le cas
3. les canaux et Plugin de fonctionnalité consomment le comportement partagé du cœur au lieu
   de se connecter directement au code fournisseur

Cela évite d’intégrer dans le cœur les hypothèses vidéo d’un fournisseur unique. Le Plugin possède
la surface du fournisseur ; le cœur possède le contrat de capacité et le comportement de repli.

La génération vidéo suit déjà cette même séquence : le cœur possède le contrat de
capacité typé et l’assistant d’exécution, et les Plugin fournisseurs enregistrent des
implémentations `api.registerVideoGenerationProvider(...)` à ce contrat.

Besoin d’une checklist de déploiement concrète ? Voir
[Recettes de capacité](/fr/plugins/architecture).

## Contrats et application

La surface de l’API Plugin est volontairement typée et centralisée dans
`OpenClawPluginApi`. Ce contrat définit les points d’enregistrement pris en charge et
les assistants d’exécution sur lesquels un Plugin peut s’appuyer.

Pourquoi cela importe :

- les auteurs de Plugin disposent d’un standard interne stable
- le cœur peut rejeter les propriétés dupliquées, par exemple deux Plugin enregistrant le même
  id de fournisseur
- le démarrage peut faire apparaître des diagnostics exploitables pour un enregistrement mal formé
- les tests de contrat peuvent faire respecter la propriété des Plugin fournis et empêcher les dérives silencieuses

Il existe deux couches d’application :

1. **application de l’enregistrement à l’exécution**
   Le registre de Plugin valide les enregistrements pendant le chargement des Plugin. Exemples :
   ids de fournisseur dupliqués, ids de fournisseur de parole dupliqués et enregistrements
   mal formés produisent des diagnostics de Plugin au lieu d’un comportement indéfini.
2. **tests de contrat**
   Les Plugin fournis sont capturés dans des registres de contrat pendant les exécutions de test afin
   qu’OpenClaw puisse vérifier explicitement la propriété. Aujourd’hui cela est utilisé pour les
   fournisseurs de modèles, fournisseurs de parole, fournisseurs de recherche web et la propriété
   d’enregistrement des Plugin fournis.

L’effet pratique est qu’OpenClaw sait, à l’avance, quel Plugin possède quelle
surface. Cela permet au cœur et aux canaux de se composer sans friction parce que la propriété est
déclarée, typée et testable plutôt qu’implicite.

### Ce qui relève d’un contrat

Les bons contrats de Plugin sont :

- typés
- petits
- spécifiques à une capacité
- possédés par le cœur
- réutilisables par plusieurs Plugin
- consommables par des canaux/fonctionnalités sans connaissance du fournisseur

Les mauvais contrats de Plugin sont :

- une politique spécifique à un fournisseur cachée dans le cœur
- des échappatoires ponctuelles de Plugin qui contournent le registre
- du code de canal qui atteint directement une implémentation de fournisseur
- des objets d’exécution ad hoc qui ne font pas partie de `OpenClawPluginApi` ou
  `api.runtime`

En cas de doute, augmentez le niveau d’abstraction : définissez d’abord la capacité, puis
laissez les Plugin s’y brancher.

## Modèle d’exécution

Les Plugin OpenClaw natifs s’exécutent **dans le processus** avec la Gateway. Ils ne sont pas
sandboxés. Un Plugin natif chargé possède la même limite de confiance au niveau du processus que le
code du cœur.

Conséquences :

- un Plugin natif peut enregistrer des outils, gestionnaires réseau, hooks et services
- un bug dans un Plugin natif peut faire planter ou déstabiliser la gateway
- un Plugin natif malveillant équivaut à une exécution de code arbitraire dans le
  processus OpenClaw

Les bundles compatibles sont plus sûrs par défaut parce qu’OpenClaw les traite actuellement
comme des packs de métadonnées/contenu. Dans les versions actuelles, cela signifie surtout des
skills fournies.

Utilisez des listes d’autorisation et des chemins explicites d’installation/de chargement pour les Plugin non fournis. Traitez
les Plugin d’espace de travail comme du code de développement, et non comme des valeurs par défaut de production.

Pour les noms de package d’espace de travail fournis, gardez l’id du Plugin ancré dans le nom
npm : `@openclaw/<id>` par défaut, ou un suffixe typé approuvé tel que
`-provider`, `-plugin`, `-speech`, `-sandbox` ou `-media-understanding` lorsque
le package expose intentionnellement un rôle de Plugin plus étroit.

Remarque de confiance importante :

- `plugins.allow` fait confiance aux **ids de Plugin**, et non à la provenance de la source.
- Un Plugin d’espace de travail avec le même id qu’un Plugin fourni masque intentionnellement
  la copie fournie lorsque ce Plugin d’espace de travail est activé/sur liste d’autorisation.
- C’est normal et utile pour le développement local, les tests de correctif et les hotfixes.

## Limite d’exportation

OpenClaw exporte des capacités, pas des commodités d’implémentation.

Gardez l’enregistrement des capacités public. Réduisez les exportations d’assistance hors contrat :

- sous-chemins spécifiques à un Plugin fourni
- sous-chemins de plomberie d’exécution non destinés à l’API publique
- assistants de commodité spécifiques à un fournisseur
- assistants de configuration/intégration qui sont des détails d’implémentation

Certains sous-chemins d’assistance de Plugin fournis restent encore dans la carte d’exportation du SDK généré pour la compatibilité et la maintenance des Plugin fournis. Exemples actuels :
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` et plusieurs jonctions `plugin-sdk/matrix*`. Traitez-les comme des
exportations réservées de détail d’implémentation, et non comme le modèle SDK recommandé pour
de nouveaux Plugin tiers.

## Pipeline de chargement

Au démarrage, OpenClaw fait approximativement ceci :

1. découvre les racines candidates de Plugin
2. lit les manifestes natifs ou de bundle compatible ainsi que les métadonnées de package
3. rejette les candidats non sûrs
4. normalise la configuration des Plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. décide de l’activation pour chaque candidat
6. charge les modules natifs activés via jiti
7. appelle les hooks natifs `register(api)` (ou `activate(api)` — alias hérité) et collecte les enregistrements dans le registre de Plugin
8. expose le registre aux surfaces de commandes/d’exécution

<Note>
`activate` est un alias hérité de `register` — le chargeur résout celui qui est présent (`def.register ?? def.activate`) et l’appelle au même point. Tous les Plugin fournis utilisent `register` ; préférez `register` pour les nouveaux Plugin.
</Note>

Les contrôles de sécurité se produisent **avant** l’exécution à l’exécution. Les candidats sont bloqués
lorsque l’entrée s’échappe de la racine du Plugin, que le chemin est inscriptible par tous, ou que la
propriété du chemin semble suspecte pour les Plugin non fournis.

### Comportement manifest-first

Le manifeste est la source de vérité du plan de contrôle. OpenClaw l’utilise pour :

- identifier le Plugin
- découvrir les canaux/skills/schémas de configuration déclarés ou les capacités de bundle
- valider `plugins.entries.<id>.config`
- enrichir les libellés/placeholders de Control UI
- afficher les métadonnées d’installation/catalogue
- préserver des descripteurs bon marché d’activation et de configuration sans charger le runtime du Plugin

Pour les Plugin natifs, le module d’exécution est la partie plan de données. Il enregistre le
comportement réel tel que hooks, outils, commandes ou flux de fournisseur.

Les blocs facultatifs du manifeste `activation` et `setup` restent sur le plan de contrôle.
Ce sont des descripteurs de métadonnées uniquement pour la planification d’activation et la découverte de configuration ;
ils ne remplacent pas l’enregistrement à l’exécution, `register(...)`, ni `setupEntry`.
Les premiers consommateurs d’activation en direct utilisent désormais les indications de commande, canal et fournisseur du manifeste
pour réduire le chargement des Plugin avant une matérialisation plus large du registre :

- le chargement CLI se limite aux Plugin qui possèdent la commande principale demandée
- la résolution configuration/Plugin de canal se limite aux Plugin qui possèdent l’id
  de canal demandé
- la résolution explicite configuration/runtime de fournisseur se limite aux Plugin qui possèdent l’id
  de fournisseur demandé

La découverte de configuration préfère désormais les ids possédés par les descripteurs tels que `setup.providers` et
`setup.cliBackends` pour réduire les Plugin candidats avant de revenir à
`setup-api` pour les Plugin qui nécessitent encore des hooks d’exécution au moment de la configuration. Si plus
d’un Plugin découvert revendique le même id normalisé de fournisseur de configuration ou de backend CLI,
la recherche de configuration refuse le propriétaire ambigu au lieu de s’appuyer sur l’ordre de découverte.

### Ce que le chargeur met en cache

OpenClaw conserve de courts caches en processus pour :

- les résultats de découverte
- les données du registre de manifeste
- les registres de Plugin chargés

Ces caches réduisent les démarrages saccadés et la surcharge des commandes répétées. Il est sûr
de les considérer comme des caches de performance de courte durée, et non comme de la persistance.

Remarque de performance :

- Définissez `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` ou
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` pour désactiver ces caches.
- Ajustez les fenêtres de cache avec `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` et
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Modèle de registre

Les Plugin chargés ne modifient pas directement des globales arbitraires du cœur. Ils s’enregistrent dans un
registre central de Plugin.

Le registre suit :

- les enregistrements de Plugin (identité, source, origine, statut, diagnostics)
- les outils
- les hooks hérités et les hooks typés
- les canaux
- les fournisseurs
- les gestionnaires RPC Gateway
- les routes HTTP
- les enregistreurs CLI
- les services d’arrière-plan
- les commandes possédées par des Plugin

Les fonctionnalités du cœur lisent ensuite dans ce registre au lieu de parler directement aux modules de Plugin. Cela maintient un chargement à sens unique :

- module du Plugin -> enregistrement dans le registre
- runtime du cœur -> consommation du registre

Cette séparation importe pour la maintenabilité. Elle signifie que la plupart des surfaces du cœur
n’ont besoin que d’un seul point d’intégration : « lire le registre », et non « traiter spécialement chaque module de Plugin ».

## Callbacks de liaison de conversation

Les Plugin qui lient une conversation peuvent réagir lorsqu’une approbation est résolue.

Utilisez `api.onConversationBindingResolved(...)` pour recevoir un callback après qu’une requête de liaison
est approuvée ou refusée :

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

Champs de charge utile du callback :

- `status` : `"approved"` ou `"denied"`
- `decision` : `"allow-once"`, `"allow-always"` ou `"deny"`
- `binding` : la liaison résolue pour les requêtes approuvées
- `request` : le résumé de la requête d’origine, indication de détachement, id expéditeur et
  métadonnées de conversation

Ce callback est uniquement une notification. Il ne change pas qui est autorisé à lier une
conversation, et il s’exécute après la fin du traitement d’approbation du cœur.

## Hooks d’exécution de fournisseur

Les Plugin fournisseurs ont désormais deux couches :

- métadonnées de manifeste : `providerAuthEnvVars` pour une recherche légère de l’authentification fournisseur par variable d’environnement
  avant le chargement à l’exécution, `providerAuthAliases` pour les variantes de fournisseur qui partagent
  l’authentification, `channelEnvVars` pour une recherche légère de canal par env/configuration avant le
  chargement à l’exécution, ainsi que `providerAuthChoices` pour des libellés légers de choix d’intégration/authentification et
  des métadonnées de drapeau CLI avant le chargement à l’exécution
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
  `resolveThinkingProfile`, `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw possède toujours la boucle générique d’agent, le basculement, la gestion des transcriptions et la
politique des outils. Ces hooks constituent la surface d’extension pour un comportement spécifique au fournisseur sans
nécessiter un transport d’inférence entièrement personnalisé.

Utilisez le manifeste `providerAuthEnvVars` lorsque le fournisseur possède des identifiants basés sur des variables d’environnement
que les chemins génériques d’authentification/statut/sélecteur de modèle doivent voir sans charger le runtime du Plugin. Utilisez le manifeste
`providerAuthAliases` lorsqu’un id de fournisseur doit réutiliser les variables d’environnement, les profils d’authentification, l’authentification basée sur la configuration et le choix d’intégration de clé API d’un autre id de fournisseur. Utilisez le manifeste
`providerAuthChoices` lorsque les surfaces CLI d’intégration/de choix d’authentification
doivent connaître l’id de choix du fournisseur, les libellés de groupe et le câblage simple d’authentification à un seul drapeau sans charger le runtime du fournisseur. Conservez `envVars` du runtime fournisseur pour des indications orientées opérateur telles que les libellés d’intégration ou les variables
de configuration client-id/client-secret OAuth.

Utilisez le manifeste `channelEnvVars` lorsqu’un canal possède une authentification ou une configuration pilotée par env que
le repli générique shell-env, les vérifications config/statut ou les invites de configuration doivent voir
sans charger le runtime du canal.

### Ordre des hooks et utilisation

Pour les Plugin de modèle/fournisseur, OpenClaw appelle les hooks dans cet ordre approximatif.
La colonne « Quand utiliser » est le guide rapide de décision.

| #   | Hook                              | Ce qu’il fait                                                                                                  | Quand l’utiliser                                                                                                                            |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publie la configuration du fournisseur dans `models.providers` pendant la génération de `models.json`         | Le fournisseur possède un catalogue ou des valeurs par défaut de base URL                                                                   |
| 2   | `applyConfigDefaults`             | Applique des valeurs globales par défaut possédées par le fournisseur pendant la matérialisation de la configuration | Les valeurs par défaut dépendent du mode d’authentification, de l’environnement ou de la sémantique de famille de modèles du fournisseur |
| --  | _(built-in model lookup)_         | OpenClaw essaie d’abord le chemin normal registre/catalogue                                                    | _(ce n’est pas un hook de Plugin)_                                                                                                          |
| 3   | `normalizeModelId`                | Normalise les alias hérités ou de prévisualisation de model-id avant la recherche                             | Le fournisseur possède le nettoyage des alias avant la résolution canonique du modèle                                                      |
| 4   | `normalizeTransport`              | Normalise `api` / `baseUrl` d’une famille de fournisseur avant l’assemblage générique du modèle               | Le fournisseur possède le nettoyage de transport pour des ids de fournisseur personnalisés dans la même famille de transport              |
| 5   | `normalizeConfig`                 | Normalise `models.providers.<id>` avant la résolution runtime/fournisseur                                      | Le fournisseur nécessite un nettoyage de configuration qui doit vivre avec le Plugin ; les assistants fournis de la famille Google servent aussi de filet de sécurité pour les entrées de configuration Google prises en charge |
| 6   | `applyNativeStreamingUsageCompat` | Applique aux fournisseurs de configuration des réécritures de compatibilité d’usage du streaming natif        | Le fournisseur a besoin de correctifs de métadonnées d’usage du streaming natif dépendants du point de terminaison                       |
| 7   | `resolveConfigApiKey`             | Résout l’authentification de marqueur d’environnement pour les fournisseurs de configuration avant le chargement de l’authentification runtime | Le fournisseur possède sa propre résolution de clé API par marqueur d’environnement ; `amazon-bedrock` a aussi ici un résolveur intégré de marqueurs d’environnement AWS |
| 8   | `resolveSyntheticAuth`            | Expose une authentification locale/autohébergée ou adossée à la configuration sans persister du texte brut    | Le fournisseur peut fonctionner avec un marqueur d’identifiant synthétique/local                                                           |
| 9   | `resolveExternalAuthProfiles`     | Superpose des profils d’authentification externes possédés par le fournisseur ; la `persistence` par défaut est `runtime-only` pour les identifiants possédés par la CLI/l’application | Le fournisseur réutilise des identifiants d’authentification externes sans persister de jetons d’actualisation copiés                   |
| 10  | `shouldDeferSyntheticProfileAuth` | Abaisse la priorité des espaces réservés de profil synthétique stockés derrière l’authentification adossée à env/configuration | Le fournisseur stocke des profils d’espace réservé synthétique qui ne doivent pas avoir la priorité                                       |
| 11  | `resolveDynamicModel`             | Repli synchrone pour des ids de modèle possédés par le fournisseur mais pas encore dans le registre local     | Le fournisseur accepte des ids de modèle amont arbitraires                                                                                 |
| 12  | `prepareDynamicModel`             | Phase de préchauffage asynchrone, puis `resolveDynamicModel` s’exécute à nouveau                              | Le fournisseur a besoin de métadonnées réseau avant de résoudre des ids inconnus                                                           |
| 13  | `normalizeResolvedModel`          | Réécriture finale avant que le moteur embarqué n’utilise le modèle résolu                                     | Le fournisseur a besoin de réécritures de transport tout en utilisant un transport du cœur                                                |
| 14  | `contributeResolvedModelCompat`   | Apporte des drapeaux de compatibilité pour des modèles fournisseur derrière un autre transport compatible      | Le fournisseur reconnaît ses propres modèles sur des transports proxy sans prendre possession du fournisseur                              |
| 15  | `capabilities`                    | Métadonnées de transcription/outillage possédées par le fournisseur et utilisées par la logique partagée du cœur | Le fournisseur a besoin de particularités liées à la transcription ou à la famille du fournisseur                                         |
| 16  | `normalizeToolSchemas`            | Normalise les schémas d’outil avant que le moteur embarqué ne les voie                                         | Le fournisseur a besoin d’un nettoyage de schéma propre à la famille de transport                                                         |
| 17  | `inspectToolSchemas`              | Expose des diagnostics de schéma possédés par le fournisseur après normalisation                              | Le fournisseur veut des avertissements sur les mots-clés sans apprendre au cœur des règles spécifiques au fournisseur                    |
| 18  | `resolveReasoningOutputMode`      | Sélectionne le contrat de sortie de raisonnement natif ou balisé                                               | Le fournisseur a besoin d’une sortie raisonnement/finale balisée au lieu de champs natifs                                                 |
| 19  | `prepareExtraParams`              | Normalisation des paramètres de requête avant les wrappers génériques d’options de flux                       | Le fournisseur a besoin de paramètres de requête par défaut ou d’un nettoyage de paramètres propre au fournisseur                        |
| 20  | `createStreamFn`                  | Remplace entièrement le chemin de flux normal par un transport personnalisé                                    | Le fournisseur a besoin d’un protocole filaire personnalisé, et pas seulement d’un wrapper                                                |
| 21  | `wrapStreamFn`                    | Wrapper de flux après application des wrappers génériques                                                      | Le fournisseur a besoin de wrappers de compatibilité pour en-têtes/corps/modèle de requête sans transport personnalisé                  |
| 22  | `resolveTransportTurnState`       | Attache des en-têtes ou métadonnées de transport natifs par tour                                               | Le fournisseur veut que les transports génériques envoient une identité de tour native au fournisseur                                     |
| 23  | `resolveWebSocketSessionPolicy`   | Attache des en-têtes WebSocket natifs ou une politique de refroidissement de session                           | Le fournisseur veut que les transports WS génériques ajustent les en-têtes de session ou la politique de repli                           |
| 24  | `formatApiKey`                    | Formateur de profil d’authentification : le profil stocké devient la chaîne `apiKey` runtime                  | Le fournisseur stocke des métadonnées d’authentification supplémentaires et a besoin d’une forme de jeton runtime personnalisée         |
| 25  | `refreshOAuth`                    | Remplacement de l’actualisation OAuth pour des points de terminaison d’actualisation personnalisés ou une politique d’échec d’actualisation | Le fournisseur ne correspond pas aux mécanismes partagés d’actualisation `pi-ai`                                                          |
| 26  | `buildAuthDoctorHint`             | Indication de réparation ajoutée lorsqu’une actualisation OAuth échoue                                         | Le fournisseur a besoin de consignes de réparation d’authentification propres au fournisseur après un échec d’actualisation             |
| 27  | `matchesContextOverflowError`     | Détecteur de dépassement de fenêtre de contexte possédé par le fournisseur                                     | Le fournisseur a des erreurs brutes de dépassement que les heuristiques génériques ne détecteraient pas                                  |
| 28  | `classifyFailoverReason`          | Classification des raisons de basculement possédée par le fournisseur                                          | Le fournisseur peut mapper des erreurs brutes d’API/transport vers rate-limit/surcharge/etc.                                             |
| 29  | `isCacheTtlEligible`              | Politique de cache de prompt pour fournisseurs proxy/backhaul                                                  | Le fournisseur a besoin d’un contrôle spécifique au proxy pour la TTL du cache                                                            |
| 30  | `buildMissingAuthMessage`         | Remplacement du message générique de récupération en cas d’authentification manquante                         | Le fournisseur a besoin d’une indication de récupération spécifique au fournisseur pour une auth manquante                               |
| 31  | `suppressBuiltInModel`            | Suppression de modèles amont obsolètes avec indication d’erreur facultative orientée utilisateur              | Le fournisseur doit masquer des lignes amont obsolètes ou les remplacer par une indication fournisseur                                   |
| 32  | `augmentModelCatalog`             | Lignes de catalogue synthétiques/finales ajoutées après la découverte                                          | Le fournisseur a besoin de lignes synthétiques de compatibilité future dans `models list` et les sélecteurs                             |
| 33  | `resolveThinkingProfile`          | Ensemble de niveaux `/think` spécifiques au modèle, libellés d’affichage et valeur par défaut                 | Le fournisseur expose une échelle de réflexion personnalisée ou un libellé binaire pour certains modèles                                |
| 34  | `isBinaryThinking`                | Hook de compatibilité pour le basculement on/off du raisonnement                                               | Le fournisseur n’expose qu’un mode binaire de réflexion activé/désactivé                                                                  |
| 35  | `supportsXHighThinking`           | Hook de compatibilité pour la prise en charge du raisonnement `xhigh`                                          | Le fournisseur veut `xhigh` seulement pour un sous-ensemble de modèles                                                                     |
| 36  | `resolveDefaultThinkingLevel`     | Hook de compatibilité pour le niveau `/think` par défaut                                                       | Le fournisseur possède la politique `/think` par défaut pour une famille de modèles                                                       |
| 37  | `isModernModelRef`                | Détecteur de modèle moderne pour les filtres de profil en direct et la sélection de smoke                     | Le fournisseur possède la logique de correspondance de modèles préférés en direct/smoke                                                   |
| 38  | `prepareRuntimeAuth`              | Échange un identifiant configuré contre le jeton/la clé runtime réel juste avant l’inférence                  | Le fournisseur a besoin d’un échange de jeton ou d’un identifiant de requête à courte durée                                                |
| 39  | `resolveUsageAuth`                | Résout les identifiants d’utilisation/facturation pour `/usage` et les surfaces d’état associées             | Le fournisseur a besoin d’une analyse personnalisée des jetons d’usage/quota ou d’un identifiant d’utilisation différent                  |
| 40  | `fetchUsageSnapshot`              | Récupère et normalise des instantanés d’utilisation/quota spécifiques au fournisseur une fois l’authentification résolue | Le fournisseur a besoin d’un point de terminaison d’utilisation spécifique au fournisseur ou d’un parseur de charge utile                 |
| 41  | `createEmbeddingProvider`         | Construit un adaptateur d’embedding possédé par le fournisseur pour la mémoire/la recherche                   | Le comportement d’embedding mémoire appartient au Plugin fournisseur                                                                        |
| 42  | `buildReplayPolicy`               | Renvoie une politique de relecture contrôlant la gestion des transcriptions pour le fournisseur               | Le fournisseur a besoin d’une politique de transcription personnalisée (par exemple, suppression de blocs de réflexion)                    |
| 43  | `sanitizeReplayHistory`           | Réécrit l’historique de relecture après le nettoyage générique de la transcription                            | Le fournisseur a besoin de réécritures de relecture spécifiques au fournisseur au-delà des assistants partagés de Compaction              |
| 44  | `validateReplayTurns`             | Validation ou restructuration finale des tours de relecture avant le moteur embarqué                          | Le transport du fournisseur a besoin d’une validation plus stricte des tours après l’assainissement générique                             |
| 45  | `onModelSelected`                 | Exécute des effets de bord post-sélection possédés par le fournisseur                                         | Le fournisseur a besoin de télémétrie ou d’un état possédé par le fournisseur lorsqu’un modèle devient actif                              |

`normalizeModelId`, `normalizeTransport` et `normalizeConfig` vérifient d’abord le
Plugin fournisseur correspondant, puis parcourent les autres Plugin fournisseurs compatibles avec les hooks
jusqu’à ce que l’un d’eux modifie effectivement l’id du modèle ou le transport/la configuration. Cela permet aux shims de fournisseur d’alias/compatibilité de continuer à fonctionner sans obliger l’appelant à savoir quel Plugin fourni possède la réécriture. Si aucun hook fournisseur ne réécrit une entrée de configuration prise en charge de la famille Google, le normaliseur de configuration Google fourni applique quand même ce nettoyage de compatibilité.

Si le fournisseur a besoin d’un protocole filaire entièrement personnalisé ou d’un exécuteur de requêtes personnalisé,
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
  et `wrapStreamFn` parce qu’il possède la compatibilité ascendante Claude 4.6,
  les indications de famille de fournisseur, les consignes de réparation d’authentification, l’intégration
  du point de terminaison d’utilisation, l’éligibilité au cache de prompt, les valeurs par défaut de configuration sensibles à l’authentification, la politique de réflexion
  par défaut/adaptative de Claude, ainsi que le façonnage de flux spécifique à Anthropic pour
  les en-têtes beta, `/fast` / `serviceTier` et `context1m`.
- Les assistants de flux spécifiques à Claude d’Anthropic restent pour le moment dans la
  propre jonction publique `api.ts` / `contract-api.ts` du Plugin fourni. Cette surface de package
  exporte `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` et les builders de wrappers Anthropic
  de plus bas niveau au lieu d’élargir le SDK générique autour des règles d’en-tête beta
  d’un seul fournisseur.
- OpenAI utilise `resolveDynamicModel`, `normalizeResolvedModel` et
  `capabilities` ainsi que `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `resolveThinkingProfile` et `isModernModelRef`
  parce qu’il possède la compatibilité ascendante GPT-5.4, la normalisation directe OpenAI
  `openai-completions` -> `openai-responses`, les consignes d’authentification
  sensibles à Codex, la suppression de Spark, les lignes synthétiques de liste OpenAI, et la politique de réflexion /
  modèle live de GPT-5 ; la famille de flux `openai-responses-defaults` possède les
  wrappers partagés natifs OpenAI Responses pour les en-têtes d’attribution,
  `/fast`/`serviceTier`, la verbosité du texte, la recherche web native Codex,
  le façonnage des charges utiles de compatibilité du raisonnement et la gestion du contexte Responses.
- OpenRouter utilise `catalog` ainsi que `resolveDynamicModel` et
  `prepareDynamicModel` parce que le fournisseur est pass-through et peut exposer de nouveaux
  ids de modèle avant la mise à jour du catalogue statique d’OpenClaw ; il utilise aussi
  `capabilities`, `wrapStreamFn` et `isCacheTtlEligible` pour garder hors du cœur les en-têtes de requête spécifiques au fournisseur, les métadonnées de routage, les correctifs de raisonnement et la
  politique de cache de prompt. Sa politique de relecture provient de la
  famille `passthrough-gemini`, tandis que la famille de flux `openrouter-thinking`
  possède l’injection du raisonnement proxy ainsi que les contournements des modèles non pris en charge / `auto`.
- GitHub Copilot utilise `catalog`, `auth`, `resolveDynamicModel` et
  `capabilities` ainsi que `prepareRuntimeAuth` et `fetchUsageSnapshot` parce qu’il
  a besoin d’une connexion par appareil possédée par le fournisseur, d’un comportement de repli de modèle, de particularités de transcription Claude, d’un échange de jeton GitHub -> jeton Copilot, et d’un point de terminaison d’utilisation possédé par le fournisseur.
- OpenAI Codex utilise `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` et `augmentModelCatalog` ainsi que
  `prepareExtraParams`, `resolveUsageAuth` et `fetchUsageSnapshot` parce qu’il
  s’exécute encore sur les transports OpenAI du cœur mais possède sa normalisation de transport/base URL,
  sa politique de repli d’actualisation OAuth, son choix de transport par défaut,
  ses lignes synthétiques de catalogue Codex et l’intégration du point de terminaison d’utilisation ChatGPT ; il
  partage la même famille de flux `openai-responses-defaults` que l’OpenAI direct.
- Google AI Studio et Gemini CLI OAuth utilisent `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` et `isModernModelRef` parce que la
  famille de relecture `google-gemini` possède le repli de compatibilité ascendante Gemini 3.1,
  la validation native de relecture Gemini, l’assainissement de relecture bootstrap,
  le mode de sortie de raisonnement balisé et la correspondance de modèles modernes, tandis que la
  famille de flux `google-thinking` possède la normalisation de charge utile de réflexion Gemini ;
  Gemini CLI OAuth utilise aussi `formatApiKey`, `resolveUsageAuth` et
  `fetchUsageSnapshot` pour le formatage de jeton, l’analyse de jeton et le câblage du
  point de terminaison de quota.
- Anthropic Vertex utilise `buildReplayPolicy` via la
  famille de relecture `anthropic-by-model` afin que le nettoyage spécifique à Claude reste
  limité aux ids Claude au lieu de chaque transport `anthropic-messages`.
- Amazon Bedrock utilise `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` et `resolveThinkingProfile` parce qu’il possède la classification
  spécifique à Bedrock des erreurs de throttling/non prêt/dépassement de contexte
  pour le trafic Anthropic-on-Bedrock ; sa politique de relecture partage toujours la même
  protection `anthropic-by-model` limitée à Claude.
- OpenRouter, Kilocode, Opencode et Opencode Go utilisent `buildReplayPolicy`
  via la famille de relecture `passthrough-gemini` parce qu’ils proxifient des modèles Gemini
  à travers des transports compatibles OpenAI et ont besoin de l’assainissement
  de signature de réflexion Gemini sans validation native de relecture Gemini ni
  réécritures bootstrap.
- MiniMax utilise `buildReplayPolicy` via la
  famille de relecture `hybrid-anthropic-openai` parce qu’un même fournisseur possède à la fois
  une sémantique Anthropic-message et OpenAI-compatible ; il conserve la suppression
  des blocs de réflexion réservée à Claude du côté Anthropic tout en ramenant le mode de sortie de raisonnement au mode natif, et la famille de flux `minimax-fast-mode` possède les réécritures de modèle en mode rapide sur le chemin de flux partagé.
- Moonshot utilise `catalog`, `resolveThinkingProfile` et `wrapStreamFn` parce qu’il utilise toujours le
  transport OpenAI partagé mais a besoin d’une normalisation de charge utile de réflexion possédée par le fournisseur ; la
  famille de flux `moonshot-thinking` mappe la configuration plus l’état `/think` sur sa
  charge utile native binaire de réflexion.
- Kilocode utilise `catalog`, `capabilities`, `wrapStreamFn` et
  `isCacheTtlEligible` parce qu’il a besoin d’en-têtes de requête possédés par le fournisseur,
  d’une normalisation de charge utile de raisonnement, d’indications de transcription Gemini et d’un contrôle
  Anthropic de TTL du cache ; la famille de flux `kilocode-thinking` conserve l’injection
  de réflexion Kilo sur le chemin de flux proxy partagé tout en ignorant `kilo/auto` et
  d’autres ids de modèle proxy qui ne prennent pas en charge des charges utiles de raisonnement explicites.
- Z.AI utilise `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `resolveThinkingProfile`, `isModernModelRef`,
  `resolveUsageAuth` et `fetchUsageSnapshot` parce qu’il possède le repli GLM-5,
  les valeurs par défaut `tool_stream`, l’UX de réflexion binaire, la correspondance de modèles modernes, et à la fois
  l’authentification d’utilisation + la récupération de quota ; la famille de flux `tool-stream-default-on`
  garde le wrapper `tool_stream` activé par défaut hors de la colle manuscrite par fournisseur.
- xAI utilise `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` et `isModernModelRef`
  parce qu’il possède la normalisation native du transport xAI Responses, les réécritures d’alias de mode rapide Grok, le `tool_stream` par défaut, le nettoyage strict-tool / charge utile de raisonnement,
  la réutilisation de l’authentification de repli pour les outils possédés par des Plugin, la résolution de modèles Grok compatible vers l’avant, et les correctifs de compatibilité possédés par le fournisseur tels que le profil de schéma d’outil xAI,
  les mots-clés de schéma non pris en charge, le `web_search` natif, et le décodage des arguments d’appel d’outil avec entités HTML.
- Mistral, OpenCode Zen et OpenCode Go utilisent uniquement `capabilities` pour garder
  les particularités de transcription/outillage hors du cœur.
- Les fournisseurs fournis limités au catalogue tels que `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` et `volcengine` utilisent
  uniquement `catalog`.
- Qwen utilise `catalog` pour son fournisseur de texte ainsi que les enregistrements partagés de compréhension des médias et
  de génération vidéo pour ses surfaces multimodales.
- MiniMax et Xiaomi utilisent `catalog` ainsi que les hooks d’utilisation parce que leur comportement `/usage`
  est possédé par le Plugin même si l’inférence s’exécute encore via les transports partagés.

## Assistants d’exécution

Les Plugin peuvent accéder à certains assistants du cœur via `api.runtime`. Pour TTS :

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
- Utilise la configuration `messages.tts` du cœur et la sélection du fournisseur.
- Renvoie un buffer audio PCM + un taux d’échantillonnage. Les Plugin doivent rééchantillonner/encoder pour les fournisseurs.
- `listVoices` est facultatif selon le fournisseur. Utilisez-le pour des sélecteurs de voix ou des flux de configuration possédés par le fournisseur.
- Les listes de voix peuvent inclure des métadonnées plus riches telles que les paramètres régionaux, le genre et des balises de personnalité pour des sélecteurs sensibles au fournisseur.
- OpenAI et ElevenLabs prennent aujourd’hui en charge la téléphonie. Microsoft non.

Les Plugin peuvent aussi enregistrer des fournisseurs de parole via `api.registerSpeechProvider(...)`.

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

- Conservez la politique TTS, le repli et la livraison de réponse dans le cœur.
- Utilisez des fournisseurs de parole pour le comportement de synthèse possédé par le fournisseur.
- L’entrée héritée Microsoft `edge` est normalisée vers l’id de fournisseur `microsoft`.
- Le modèle de propriété préféré est orienté entreprise : un seul Plugin fournisseur peut posséder
  le texte, la parole, l’image et les futurs fournisseurs de médias à mesure qu’OpenClaw ajoute ces
  contrats de capacité.

Pour la compréhension image/audio/vidéo, les Plugin enregistrent un fournisseur typé
de compréhension des médias au lieu d’un sac clé/valeur générique :

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

- Conservez l’orchestration, le repli, la configuration et le câblage des canaux dans le cœur.
- Conservez le comportement fournisseur dans le Plugin fournisseur.
- L’extension additive doit rester typée : nouvelles méthodes facultatives, nouveaux
  champs de résultat facultatifs, nouvelles capacités facultatives.
- La génération vidéo suit déjà le même modèle :
  - le cœur possède le contrat de capacité et l’assistant d’exécution
  - les Plugin fournisseurs enregistrent `api.registerVideoGenerationProvider(...)`
  - les Plugin de fonctionnalité/canal consomment `api.runtime.videoGeneration.*`

Pour les assistants d’exécution de compréhension des médias, les Plugin peuvent appeler :

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

Pour la transcription audio, les Plugin peuvent utiliser soit le runtime de compréhension des médias,
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

- `api.runtime.mediaUnderstanding.*` est la surface partagée préférée pour la
  compréhension image/audio/vidéo.
- Utilise la configuration audio de compréhension des médias du cœur (`tools.media.audio`) et l’ordre de repli du fournisseur.
- Renvoie `{ text: undefined }` lorsqu’aucune sortie de transcription n’est produite (par exemple entrée ignorée/non prise en charge).
- `api.runtime.stt.transcribeAudioFile(...)` reste disponible comme alias de compatibilité.

Les Plugin peuvent aussi lancer des exécutions de sous-agent en arrière-plan via `api.runtime.subagent` :

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

- `provider` et `model` sont des remplacements facultatifs par exécution, et non des changements persistants de session.
- OpenClaw ne respecte ces champs de remplacement que pour les appelants approuvés.
- Pour les exécutions de repli possédées par des Plugin, les opérateurs doivent activer explicitement `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Utilisez `plugins.entries.<id>.subagent.allowedModels` pour restreindre les Plugin approuvés à des cibles canoniques `provider/model` spécifiques, ou `"*"` pour autoriser explicitement n’importe quelle cible.
- Les exécutions de sous-agent de Plugin non approuvés fonctionnent toujours, mais les requêtes de remplacement sont rejetées au lieu de revenir silencieusement au repli.

Pour la recherche web, les Plugin peuvent consommer l’assistant d’exécution partagé au lieu
d’atteindre le câblage d’outil de l’agent :

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

Les Plugin peuvent aussi enregistrer des fournisseurs de recherche web via
`api.registerWebSearchProvider(...)`.

Remarques :

- Conservez dans le cœur la sélection du fournisseur, la résolution des identifiants et la sémantique partagée des requêtes.
- Utilisez les fournisseurs de recherche web pour les transports de recherche spécifiques à un fournisseur.
- `api.runtime.webSearch.*` est la surface partagée préférée pour les Plugin de fonctionnalité/canal qui ont besoin d’un comportement de recherche sans dépendre du wrapper d’outil de l’agent.

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

- `generate(...)` : générer une image à l’aide de la chaîne de fournisseurs de génération d’images configurée.
- `listProviders(...)` : lister les fournisseurs de génération d’images disponibles et leurs capacités.

## Routes HTTP Gateway

Les Plugin peuvent exposer des points de terminaison HTTP avec `api.registerHttpRoute(...)`.

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
- `auth` : requis. Utilisez `"gateway"` pour exiger l’authentification normale de la gateway, ou `"plugin"` pour l’authentification/la vérification de Webhook gérée par le Plugin.
- `match` : facultatif. `"exact"` (par défaut) ou `"prefix"`.
- `replaceExisting` : facultatif. Permet au même Plugin de remplacer son propre enregistrement de route existant.
- `handler` : renvoie `true` lorsque la route a traité la requête.

Remarques :

- `api.registerHttpHandler(...)` a été supprimé et provoquera une erreur de chargement du Plugin. Utilisez plutôt `api.registerHttpRoute(...)`.
- Les routes de Plugin doivent déclarer `auth` explicitement.
- Les conflits exacts `path + match` sont rejetés sauf si `replaceExisting: true`, et un Plugin ne peut pas remplacer la route d’un autre Plugin.
- Les routes qui se chevauchent avec des niveaux `auth` différents sont rejetées. Gardez les chaînes de repli `exact`/`prefix` uniquement au même niveau d’authentification.
- Les routes `auth: "plugin"` **ne** reçoivent **pas** automatiquement les scopes runtime operator. Elles sont destinées aux Webhook/vérifications de signature gérés par le Plugin, et non aux appels privilégiés aux assistants Gateway.
- Les routes `auth: "gateway"` s’exécutent dans une portée runtime de requête Gateway, mais cette portée est volontairement conservative :
  - l’authentification bearer par secret partagé (`gateway.auth.mode = "token"` / `"password"`) maintient les scopes runtime des routes de Plugin épinglés à `operator.write`, même si l’appelant envoie `x-openclaw-scopes`
  - les modes HTTP approuvés porteurs d’identité (par exemple `trusted-proxy` ou `gateway.auth.mode = "none"` sur une entrée privée) n’honorent `x-openclaw-scopes` que lorsque l’en-tête est explicitement présent
  - si `x-openclaw-scopes` est absent sur ces requêtes de route de Plugin porteuses d’identité, la portée runtime retombe sur `operator.write`
- Règle pratique : ne supposez pas qu’une route de Plugin authentifiée par gateway est implicitement une surface d’administration. Si votre route a besoin d’un comportement réservé à l’administration, exigez un mode d’authentification porteur d’identité et documentez le contrat explicite de l’en-tête `x-openclaw-scopes`.

## Chemins d’importation du SDK Plugin

Utilisez les sous-chemins du SDK au lieu de l’import monolithique `openclaw/plugin-sdk` lorsque
vous écrivez des Plugin :

- `openclaw/plugin-sdk/plugin-entry` pour les primitives d’enregistrement de Plugin.
- `openclaw/plugin-sdk/core` pour le contrat générique partagé orienté Plugin.
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
  `openclaw/plugin-sdk/webhook-ingress` pour le câblage partagé de configuration/authentification/réponse/Webhook.
  `channel-inbound` est l’emplacement partagé pour l’anti-rebond, la correspondance de mentions,
  les assistants de politique de mention entrante, le formatage des enveloppes et les assistants de contexte
  d’enveloppe entrante.
  `channel-setup` est la jonction étroite de configuration d’installation facultative.
  `setup-runtime` est la surface de configuration sûre à l’exécution utilisée par `setupEntry` /
  le démarrage différé, y compris les adaptateurs de correctif de configuration sûrs à l’importation.
  `setup-adapter-runtime` est la jonction d’adaptateur de configuration de compte sensible à l’environnement.
  `setup-tools` est la petite jonction d’assistants CLI/archive/documentation (`formatCliCommand`,
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
  `openclaw/plugin-sdk/directory-runtime` pour les assistants partagés d’exécution/de configuration.
  `telegram-command-config` est la jonction publique étroite pour la normalisation/validation des commandes personnalisées Telegram et reste disponible même si la surface de contrat Telegram fournie est temporairement indisponible.
  `text-runtime` est la jonction partagée texte/markdown/journalisation, y compris
  la suppression du texte visible par l’assistant, les assistants de rendu/segmentation markdown, les assistants de rédaction,
  les assistants de balises de directive et les utilitaires de texte sûr.
- Les jonctions de canal spécifiques aux approbations doivent préférer un contrat unique `approvalCapability`
  sur le Plugin. Le cœur lit ensuite l’authentification, la livraison, le rendu,
  le routage natif et le comportement lazy du gestionnaire natif d’approbation via cette capacité unique
  au lieu de mélanger le comportement d’approbation dans des champs de Plugin sans rapport.
- `openclaw/plugin-sdk/channel-runtime` est obsolète et reste uniquement comme
  shim de compatibilité pour les anciens Plugin. Le nouveau code doit importer les primitives génériques plus étroites à la place, et le code du dépôt ne doit pas ajouter de nouveaux imports du
  shim.
- Les internes des extensions fournies restent privés. Les Plugin externes doivent utiliser uniquement
  les sous-chemins `openclaw/plugin-sdk/*`. Le code cœur/test d’OpenClaw peut utiliser les
  points d’entrée publics du dépôt sous une racine de package de Plugin comme `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js` et des fichiers à portée étroite tels que
  `login-qr-api.js`. N’importez jamais le `src/*` d’un package Plugin depuis le cœur ou depuis
  une autre extension.
- Répartition des points d’entrée du dépôt :
  `<plugin-package-root>/api.js` est le barrel d’assistants/types,
  `<plugin-package-root>/runtime-api.js` est le barrel runtime-only,
  `<plugin-package-root>/index.js` est le point d’entrée du Plugin fourni,
  et `<plugin-package-root>/setup-entry.js` est le point d’entrée du Plugin de configuration.
- Exemples actuels de fournisseurs fournis :
  - Anthropic utilise `api.js` / `contract-api.js` pour des assistants de flux Claude tels
    que `wrapAnthropicProviderStream`, les assistants d’en-tête beta et l’analyse de `service_tier`.
  - OpenAI utilise `api.js` pour les builders de fournisseur, les assistants de modèle par défaut et
    les builders de fournisseur temps réel.
  - OpenRouter utilise `api.js` pour son builder de fournisseur ainsi que des assistants d’intégration/configuration, tandis que `register.runtime.js` peut toujours réexporter les assistants génériques
    `plugin-sdk/provider-stream` pour un usage local au dépôt.
- Les points d’entrée publics chargés via façade préfèrent l’instantané actif de configuration runtime
  lorsqu’il existe, puis reviennent au fichier de configuration résolu sur disque lorsque
  OpenClaw ne sert pas encore d’instantané runtime.
- Les primitives génériques partagées restent le contrat public préféré du SDK. Un petit
  ensemble réservé de jonctions d’assistance marquées de noms de canaux fournis existe encore. Traitez-les comme des jonctions de maintenance/compatibilité pour les Plugin fournis, et non comme de nouvelles cibles d’importation tierces ; les nouveaux contrats inter-canaux doivent toujours arriver sur des sous-chemins génériques `plugin-sdk/*` ou sur les barrels locaux au Plugin `api.js` /
  `runtime-api.js`.

Remarque de compatibilité :

- Évitez le barrel racine `openclaw/plugin-sdk` pour le nouveau code.
- Préférez d’abord les primitives stables étroites. Les sous-chemins plus récents de configuration/appairage/réponse/
  feedback/contrat/entrant/fils/commande/secret-input/Webhook/infra/
  liste d’autorisation/état/message-tool constituent le contrat visé pour le nouveau
  travail de Plugin fourni et externe.
  L’analyse/la correspondance des cibles appartient à `openclaw/plugin-sdk/channel-targets`.
  Les contrôles d’action de message et les assistants d’id de message de réaction appartiennent à
  `openclaw/plugin-sdk/channel-actions`.
- Les barrels d’assistance spécifiques aux extensions fournies ne sont pas stables par défaut. Si un
  assistant n’est nécessaire que pour une extension fournie, gardez-le derrière la jonction locale `api.js` ou `runtime-api.js`
  de l’extension au lieu de le promouvoir dans
  `openclaw/plugin-sdk/<extension>`.
- Les nouvelles jonctions d’assistance partagées doivent être génériques, et non marquées d’un nom de canal. L’analyse partagée
  des cibles appartient à `openclaw/plugin-sdk/channel-targets` ; les
  internes spécifiques au canal restent derrière la jonction locale `api.js` ou `runtime-api.js`
  du Plugin propriétaire.
- Les sous-chemins spécifiques à une capacité tels que `image-generation`,
  `media-understanding` et `speech` existent parce que des Plugin
  fournis/natifs les utilisent aujourd’hui. Leur présence ne signifie pas en soi que chaque assistant exporté est un contrat externe figé à long terme.

## Schémas d’outil de message

Les Plugin doivent posséder les contributions de schéma spécifiques au canal de `describeMessageTool(...)`
pour les primitives hors message telles que les réactions, les lectures et les sondages.
La présentation d’envoi partagée doit utiliser le contrat générique `MessagePresentation`
au lieu de champs natifs au fournisseur de boutons, composants, blocs ou cartes.
Voir [Présentation de message](/fr/plugins/message-presentation) pour le contrat,
les règles de repli, le mapping fournisseur et la checklist de l’auteur de Plugin.

Les Plugin capables d’envoyer déclarent ce qu’ils peuvent restituer via les capacités de message :

- `presentation` pour les blocs de présentation sémantique (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` pour les requêtes de livraison épinglée

Le cœur décide s’il doit restituer la présentation nativement ou la dégrader en texte.
N’exposez pas d’échappatoires d’UI natives au fournisseur depuis l’outil générique de message.
Les assistants SDK obsolètes pour les schémas natifs hérités restent exportés pour les
Plugin tiers existants, mais les nouveaux Plugin ne doivent pas les utiliser.

## Résolution des cibles de canal

Les Plugin de canal doivent posséder la sémantique des cibles spécifiques au canal. Conservez l’hôte partagé
de sortie générique et utilisez la surface d’adaptateur de messagerie pour les règles fournisseur :

- `messaging.inferTargetChatType({ to })` décide si une cible normalisée
  doit être traitée comme `direct`, `group` ou `channel` avant la recherche dans l’annuaire.
- `messaging.targetResolver.looksLikeId(raw, normalized)` indique au cœur si une
  entrée doit passer directement à une résolution de type id au lieu d’une recherche dans l’annuaire.
- `messaging.targetResolver.resolveTarget(...)` est le repli du Plugin lorsque le
  cœur a besoin d’une résolution finale possédée par le fournisseur après normalisation ou après un
  échec de recherche dans l’annuaire.
- `messaging.resolveOutboundSessionRoute(...)` possède la construction de route de session spécifique au fournisseur
  une fois une cible résolue.

Répartition recommandée :

- Utilisez `inferTargetChatType` pour les décisions de catégorie qui doivent se produire avant
  la recherche de pairs/groupes.
- Utilisez `looksLikeId` pour les vérifications de type « traiter ceci comme un id de cible explicite/natif ».
- Utilisez `resolveTarget` pour le repli de normalisation spécifique au fournisseur, et non pour une
  recherche large dans l’annuaire.
- Conservez les ids natifs au fournisseur comme les ids de chat, ids de fil, JID, handles et ids de salle
  à l’intérieur des valeurs `target` ou des paramètres spécifiques au fournisseur, et non dans des champs SDK génériques.

## Répertoires adossés à la configuration

Les Plugin qui dérivent des entrées d’annuaire à partir de la configuration doivent conserver cette logique dans le
Plugin et réutiliser les assistants partagés de
`openclaw/plugin-sdk/directory-runtime`.

Utilisez cela lorsqu’un canal a besoin de pairs/groupes adossés à la configuration tels que :

- pairs DM pilotés par liste d’autorisation
- maps configurées de canal/groupe
- replis statiques d’annuaire à portée de compte

Les assistants partagés dans `directory-runtime` ne gèrent que des opérations génériques :

- filtrage de requête
- application des limites
- assistants de déduplication/normalisation
- construction de `ChannelDirectoryEntry[]`

L’inspection de compte spécifique au canal et la normalisation des ids doivent rester dans
l’implémentation du Plugin.

## Catalogues de fournisseurs

Les Plugin fournisseurs peuvent définir des catalogues de modèles pour l’inférence avec
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` renvoie la même forme que celle qu’OpenClaw écrit dans
`models.providers` :

- `{ provider }` pour une entrée de fournisseur
- `{ providers }` pour plusieurs entrées de fournisseur

Utilisez `catalog` lorsque le Plugin possède des ids de modèle spécifiques au fournisseur, des valeurs par défaut de base URL ou des métadonnées de modèle conditionnées par l’authentification.

`catalog.order` contrôle le moment où le catalogue d’un Plugin fusionne par rapport aux
fournisseurs implicites intégrés d’OpenClaw :

- `simple` : fournisseurs simples pilotés par clé API ou variable d’environnement
- `profile` : fournisseurs qui apparaissent lorsque des profils d’authentification existent
- `paired` : fournisseurs qui synthétisent plusieurs entrées de fournisseur liées
- `late` : dernier passage, après les autres fournisseurs implicites

Les fournisseurs ultérieurs gagnent en cas de collision de clé, afin que les Plugin puissent intentionnellement remplacer une entrée de fournisseur intégrée avec le même id de fournisseur.

Compatibilité :

- `discovery` fonctionne toujours comme alias hérité
- si `catalog` et `discovery` sont tous deux enregistrés, OpenClaw utilise `catalog`

## Inspection de canal en lecture seule

Si votre Plugin enregistre un canal, préférez implémenter
`plugin.config.inspectAccount(cfg, accountId)` en parallèle de `resolveAccount(...)`.

Pourquoi :

- `resolveAccount(...)` est le chemin runtime. Il peut supposer que les identifiants sont
  entièrement matérialisés et échouer rapidement lorsque les secrets requis sont manquants.
- Les chemins de commandes en lecture seule tels que `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` et les flux de réparation doctor/config
  ne devraient pas avoir besoin de matérialiser des identifiants runtime juste pour
  décrire la configuration.

Comportement recommandé de `inspectAccount(...)` :

- Renvoyer uniquement un état descriptif du compte.
- Préserver `enabled` et `configured`.
- Inclure les champs source/statut d’identifiant lorsque c’est pertinent, tels que :
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Il n’est pas nécessaire de renvoyer les valeurs brutes des jetons juste pour signaler une
  disponibilité en lecture seule. Renvoyer `tokenStatus: "available"` (et le champ source correspondant)
  suffit pour les commandes de type statut.
- Utilisez `configured_unavailable` lorsqu’un identifiant est configuré via SecretRef mais
  indisponible dans le chemin de commande actuel.

Cela permet aux commandes en lecture seule de signaler « configuré mais indisponible dans ce chemin de commande »
au lieu de planter ou d’indiquer à tort que le compte n’est pas configuré.

## Packs de packages

Un répertoire de Plugin peut inclure un `package.json` avec `openclaw.extensions` :

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Chaque entrée devient un Plugin. Si le pack liste plusieurs extensions, l’id du Plugin
devient `name/<fileBase>`.

Si votre Plugin importe des dépendances npm, installez-les dans ce répertoire afin que
`node_modules` soit disponible (`npm install` / `pnpm install`).

Garde-fou de sécurité : chaque entrée `openclaw.extensions` doit rester à l’intérieur du
répertoire du Plugin après résolution des liens symboliques. Les entrées qui s’échappent du répertoire du package sont
rejetées.

Remarque de sécurité : `openclaw plugins install` installe les dépendances de Plugin avec
`npm install --omit=dev --ignore-scripts` (pas de scripts de cycle de vie, pas de dépendances de développement à l’exécution). Gardez les arbres de dépendances des Plugin « pure JS/TS » et évitez les packages qui nécessitent des builds `postinstall`.

Facultatif : `openclaw.setupEntry` peut pointer vers un module léger réservé à la configuration.
Lorsqu’OpenClaw a besoin de surfaces de configuration pour un Plugin de canal désactivé, ou
lorsqu’un Plugin de canal est activé mais reste non configuré, il charge `setupEntry`
au lieu du point d’entrée complet du Plugin. Cela allège le démarrage et la configuration
lorsque votre point d’entrée principal connecte aussi des outils, hooks ou autre code réservé
au runtime.

Facultatif : `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
peut faire opter un Plugin de canal dans le même chemin `setupEntry` pendant la
phase de démarrage pré-écoute de la gateway, même lorsque le canal est déjà configuré.

Utilisez cela uniquement si `setupEntry` couvre entièrement la surface de démarrage qui doit exister
avant que la gateway ne commence à écouter. En pratique, cela signifie que le point d’entrée de configuration
doit enregistrer chaque capacité possédée par le canal dont dépend le démarrage, telle que :

- l’enregistrement du canal lui-même
- toutes les routes HTTP qui doivent être disponibles avant que la gateway ne commence à écouter
- toutes les méthodes, outils ou services Gateway qui doivent exister pendant cette même fenêtre

Si votre point d’entrée complet possède encore une capacité de démarrage requise, n’activez pas
ce drapeau. Conservez le comportement par défaut du Plugin et laissez OpenClaw charger le
point d’entrée complet pendant le démarrage.

Les canaux fournis peuvent également publier des assistants de surface de contrat réservés à la configuration que le cœur
peut consulter avant le chargement du runtime complet du canal. La surface actuelle de
promotion de configuration est :

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Le cœur utilise cette surface lorsqu’il doit promouvoir une configuration héritée de canal à compte unique
vers `channels.<id>.accounts.*` sans charger le point d’entrée complet du Plugin.
Matrix est l’exemple fourni actuel : il ne déplace que les clés d’authentification/bootstrap dans un
compte promu nommé lorsque des comptes nommés existent déjà, et il peut préserver une
clé de compte par défaut non canonique configurée au lieu de toujours créer
`accounts.default`.

Ces adaptateurs de correctif de configuration gardent la découverte de surface de contrat fournie lazy. Le temps
d’importation reste léger ; la surface de promotion n’est chargée qu’à la première utilisation au lieu de
réentrer dans le démarrage du canal fourni lors de l’importation du module.

Lorsque ces surfaces de démarrage incluent des méthodes RPC Gateway, conservez-les sous un
préfixe spécifique au Plugin. Les espaces de noms admin du cœur (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restent réservés et se résolvent toujours
en `operator.admin`, même si un Plugin demande un scope plus étroit.

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

Les Plugin de canal peuvent annoncer des métadonnées de configuration/découverte via `openclaw.channel` et
des indications d’installation via `openclaw.install`. Cela permet de garder les données du catalogue du cœur libres de données.

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
- `docsLabel` : remplace le texte de lien pour le lien de documentation
- `preferOver` : ids de Plugin/canal de priorité inférieure que cette entrée de catalogue doit dépasser
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras` : contrôles de copie pour la surface de sélection
- `markdownCapable` : marque le canal comme compatible Markdown pour les décisions de formatage sortant
- `exposure.configured` : masque le canal des surfaces de liste de canaux configurés lorsqu’il vaut `false`
- `exposure.setup` : masque le canal des sélecteurs interactifs de configuration lorsqu’il vaut `false`
- `exposure.docs` : marque le canal comme interne/privé pour les surfaces de navigation de documentation
- `showConfigured` / `showInSetup` : les alias hérités restent acceptés pour compatibilité ; préférez `exposure`
- `quickstartAllowFrom` : fait entrer le canal dans le flux standard quickstart `allowFrom`
- `forceAccountBinding` : exige une liaison de compte explicite même lorsqu’un seul compte existe
- `preferSessionLookupForAnnounceTarget` : préfère la recherche de session lors de la résolution des cibles d’annonce

OpenClaw peut aussi fusionner des **catalogues de canaux externes** (par exemple, une exportation de registre
MPM). Déposez un fichier JSON à l’un de ces emplacements :

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Ou faites pointer `OPENCLAW_PLUGIN_CATALOG_PATHS` (ou `OPENCLAW_MPM_CATALOG_PATHS`) vers
un ou plusieurs fichiers JSON (délimités par virgule/point-virgule/`PATH`). Chaque fichier doit
contenir `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. L’analyseur accepte aussi `"packages"` ou `"plugins"` comme alias hérités de la clé `"entries"`.

## Plugin de moteur de contexte

Les Plugin de moteur de contexte possèdent l’orchestration du contexte de session pour l’ingestion, l’assemblage,
et la Compaction. Enregistrez-les depuis votre Plugin avec
`api.registerContextEngine(id, factory)`, puis sélectionnez le moteur actif avec
`plugins.slots.contextEngine`.

Utilisez cela lorsque votre Plugin doit remplacer ou étendre le pipeline de contexte par défaut
au lieu de simplement ajouter une recherche mémoire ou des hooks.

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

Lorsqu’un Plugin a besoin d’un comportement qui ne correspond pas à l’API actuelle, ne contournez pas
le système de Plugin avec un accès privé direct. Ajoutez la capacité manquante.

Séquence recommandée :

1. définir le contrat du cœur
   Décidez quel comportement partagé le cœur doit posséder : politique, repli, fusion de configuration,
   cycle de vie, sémantique tournée vers le canal et forme de l’assistant d’exécution.
2. ajouter des surfaces typées d’enregistrement/runtime pour les Plugin
   Étendez `OpenClawPluginApi` et/ou `api.runtime` avec la plus petite
   surface de capacité typée utile.
3. connecter les consommateurs cœur + canal/fonctionnalité
   Les canaux et Plugin de fonctionnalité doivent consommer la nouvelle capacité via le cœur,
   et non en important directement une implémentation fournisseur.
4. enregistrer les implémentations fournisseur
   Les Plugin fournisseurs enregistrent ensuite leurs backends sur la capacité.
5. ajouter une couverture de contrat
   Ajoutez des tests afin que la propriété et la forme d’enregistrement restent explicites dans le temps.

C’est ainsi qu’OpenClaw reste prescriptif sans devenir codé en dur selon la vision du monde
d’un seul fournisseur. Voir les [Recettes de capacité](/fr/plugins/architecture)
pour une checklist concrète de fichiers et un exemple détaillé.

### Checklist de capacité

Lorsque vous ajoutez une nouvelle capacité, l’implémentation doit généralement toucher
ensemble ces surfaces :

- types de contrat du cœur dans `src/<capability>/types.ts`
- assistant runtime/runner du cœur dans `src/<capability>/runtime.ts`
- surface d’enregistrement de l’API Plugin dans `src/plugins/types.ts`
- câblage du registre de Plugin dans `src/plugins/registry.ts`
- exposition runtime de Plugin dans `src/plugins/runtime/*` lorsque des Plugin de fonctionnalité/canal
  doivent la consommer
- assistants de capture/test dans `src/test-utils/plugin-registration.ts`
- assertions de propriété/contrat dans `src/plugins/contracts/registry.ts`
- documentation operator/Plugin dans `docs/`

Si l’une de ces surfaces manque, c’est généralement le signe que la capacité
n’est pas encore entièrement intégrée.

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
- les Plugin fournisseurs possèdent les implémentations fournisseur
- les Plugin de fonctionnalité/canal consomment les assistants runtime
- les tests de contrat gardent la propriété explicite
