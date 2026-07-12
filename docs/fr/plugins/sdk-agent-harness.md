---
read_when:
    - Vous modifiez le runtime d’agent intégré ou le registre du harnais
    - Vous enregistrez un environnement d’exécution d’agent à partir d’un plugin intégré ou approuvé.
    - Vous devez comprendre comment le plugin Codex s’articule avec les fournisseurs de modèles
sidebarTitle: Agent Harness
summary: Surface SDK expérimentale pour les plugins qui remplacent l’exécuteur d’agent intégré de bas niveau
title: Plugins de harnais d’agent
x-i18n:
    generated_at: "2026-07-12T15:46:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: be2717d9986c30e931d3443dc6b70542ab20badb4ad0921e797fbad280513d1e
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Un **environnement d’exécution d’agent** est l’exécuteur de bas niveau d’un tour préparé d’un agent OpenClaw. Il ne s’agit ni d’un fournisseur de modèles, ni d’un canal, ni d’un registre d’outils. Pour le modèle mental destiné aux utilisateurs, consultez [Environnements d’exécution des agents](/fr/concepts/agent-runtimes).

Utilisez cette interface uniquement pour les plugins natifs intégrés ou de confiance. Le contrat reste expérimental, car les types de paramètres reflètent intentionnellement ceux de l’exécuteur intégré actuel.

## Quand utiliser un environnement d’exécution

Enregistrez un environnement d’exécution d’agent lorsqu’une famille de modèles possède son propre environnement d’exécution de session natif et que le transport de fournisseur OpenClaw standard constitue une abstraction inadaptée :

- un serveur d’agent de codage natif qui gère les fils de discussion et la Compaction
- une CLI ou un démon local qui doit diffuser les événements natifs de planification, de raisonnement et d’outils
- un environnement d’exécution de modèle qui nécessite son propre identifiant de reprise en plus de la transcription de session OpenClaw

N’enregistrez **pas** un environnement d’exécution uniquement pour ajouter une nouvelle API de LLM. Pour les API de modèles HTTP ou WebSocket standard, créez un [plugin de fournisseur](/fr/plugins/sdk-provider-plugins).

## Ce que le cœur continue de gérer

Avant la sélection d’un environnement d’exécution, OpenClaw a déjà résolu :

- le fournisseur et le modèle
- l’état d’authentification de l’environnement d’exécution, sauf si celui-ci déclare gérer l’amorçage de l’authentification
- le niveau de raisonnement et le budget de contexte
- le fichier de transcription/session OpenClaw
- l’espace de travail, le bac à sable et la politique d’outils
- les rappels de réponse du canal et les rappels de diffusion
- la politique de repli de modèle et de changement de modèle à la volée

Un environnement d’exécution lance une tentative préparée ; il ne choisit pas les fournisseurs, ne remplace pas la distribution par le canal et ne change pas silencieusement de modèle.

### Amorçage de l’authentification géré par l’environnement d’exécution

Par défaut, le cœur résout les identifiants du fournisseur avant d’appeler un environnement d’exécution. Un environnement d’exécution de confiance capable de s’authentifier au moyen de son propre environnement natif peut définir `authBootstrap: "harness"` dans son enregistrement statique `AgentHarness`. Le cœur ignore alors son amorçage générique des identifiants du fournisseur et l’échec dû à des identifiants manquants pour chaque tentative prise en charge par cet environnement d’exécution.

Le cœur transmet toujours un profil d’authentification OpenClaw compatible, explicitement sélectionné ou ordonné, ainsi que son stockage délimité, lorsqu’ils existent. L’environnement d’exécution doit résoudre ce profil ou ses identifiants natifs avant d’émettre des requêtes au modèle, limiter les secrets à la tentative et signaler des échecs d’authentification exploitables. Ne définissez pas cette capacité sur un environnement d’exécution qui ne gère l’authentification que dans certains cas.

### Artefacts vérifiés de l’environnement d’exécution de configuration

Un environnement d’exécution local capable de fournir l’inférence lors de la configuration initiale doit attester l’implémentation qui a effectué la vérification. Lorsque `params.captureRuntimeArtifact` vaut true, renvoyez un `result.runtimeArtifact` opaque doté d’un identifiant stable et d’une empreinte de contenu. Enregistrez une capacité `runtimeArtifact.validate(...)` correspondante qui revérifie cette liaison sans charger un autre environnement d’exécution ni analyser des plugins sans rapport.

Les continuations Crestodian vérifiées transmettent également `params.expectedRuntimeArtifact`. L’environnement d’exécution doit le comparer au processus natif exact qu’il a acquis et échouer avant de démarrer ou de reprendre un fil de discussion natif s’ils diffèrent. Les tours d’agent ordinaires omettent ces deux champs, de sorte que le hachage du contenu reste en dehors du chemin critique normal des requêtes. Les environnements d’exécution distants/WebSocket nécessitent un contrat d’attestation du serveur avant de pouvoir participer ; une chaîne de version seule ne constitue pas une identité d’artefact.

La tentative préparée inclut également `params.runtimePlan`, un ensemble de politiques géré par OpenClaw pour les décisions d’exécution qui doivent rester partagées entre OpenClaw et les environnements d’exécution natifs :

- `runtimePlan.tools.normalize(...)` et `runtimePlan.tools.logDiagnostics(...)` pour la politique de schéma d’outils tenant compte du fournisseur
- `runtimePlan.transcript.resolvePolicy(...)` pour la politique d’assainissement de la transcription et de réparation des appels d’outils
- `runtimePlan.delivery.isSilentPayload(...)` pour la suppression partagée de la distribution de `NO_REPLY` et des médias
- `runtimePlan.outcome.classifyRunResult(...)` pour la classification du repli de modèle
- `runtimePlan.observability` pour les métadonnées résolues du fournisseur, du modèle et de l’environnement d’exécution

Les environnements d’exécution peuvent utiliser le plan pour les décisions qui doivent correspondre au comportement d’OpenClaw, mais doivent le traiter comme un état de tentative géré par l’hôte : ne le modifiez pas et ne l’utilisez pas pour changer de fournisseur ou de modèle au cours d’un tour.

### Contrat de transport des requêtes

`supports(ctx)` reçoit le transport de modèle résolu dans `ctx.modelProvider`. Deux informations sans secret, gérées par le fournisseur, décrivent la route sélectionnée :

- `runtimePolicy.compatibleIds` répertorie les identifiants d’environnement d’exécution que le fournisseur déclare compatibles avec cette route concrète. L’absence de politique signifie que le fournisseur n’a déclaré aucune compatibilité au niveau de la route ; elle n’autorise pas à supposer une prise en charge.
- `requestTransportOverrides: "none"` signifie qu’aucune substitution de requête définie pour le fournisseur ou le modèle ne doit être reproduite. `"present"` signifie qu’il existe des en-têtes, un transport d’authentification, un proxy, des paramètres TLS, un service local, un comportement de réseau privé ou des paramètres de requête définis. Cette information n’expose pas ces valeurs.

Renvoyez `{ supported: false, reason }` lorsque l’environnement d’exécution ne peut pas reproduire le transport préparé. Ne déduisez pas la prise en charge en lisant la configuration brute après la sélection. Lorsque la préparation de l’authentification produit plusieurs routes de nouvelle tentative, un seul environnement d’exécution doit toutes les prendre en charge avant la distribution. La sélection implicite utilise OpenClaw si aucun plugin ne peut gérer l’ensemble complet ; une sélection de plugin explicite ou persistée échoue de manière fermée.

## Enregistrer un environnement d’exécution

**Importation :** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "Mon environnement d’agent natif",

  supports(ctx) {
    const routeSupportsHarness =
      ctx.modelProvider?.runtimePolicy?.compatibleIds.includes("my-harness") === true;
    const canReproduceRequest = ctx.modelProvider?.requestTransportOverrides !== "present";
    return ctx.provider === "my-provider" && routeSupportsHarness && canReproduceRequest
      ? { supported: true, priority: 100 }
      : { supported: false, reason: "la route effective n’est pas compatible avec l’environnement" };
  },

  async runAttempt(params) {
    // Démarrez ou reprenez votre fil natif.
    // Utilisez params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent et les autres champs préparés de la tentative.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "Mon agent natif",
  description: "Exécute les modèles sélectionnés par l’intermédiaire d’un démon d’agent natif.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

`authBootstrap` est volontairement absent de cet exemple générique. Ajoutez
`authBootstrap: "harness"` uniquement lorsque l’environnement respecte le contrat ci-dessus.

### Exécution déléguée

Le propriétaire d’un environnement peut définir `delegatedExecutionPluginIds` sur les identifiants des
plugins de confiance qui doivent exécuter une session existante verrouillée sur un modèle, comme un
transport vocal poursuivant une conversation adossée à Codex. Il s’agit d’un consentement statique du propriétaire,
et non d’une liste d’autorisation du cœur. Limitez-en la portée.

Les délégués ne reçoivent que l’admission des tâches et l’exécution intégrée. OpenClaw exige
la clé de session stockée exacte, le chemin du stockage et l’identifiant de session ; `modelSelectionLocked:
true` ; ainsi que des valeurs `agentHarnessId` et `agentHarnessRuntimeOverride` correspondantes.
L’exécution est ensuite limitée par l’intermédiaire du propriétaire de l’environnement. La création, la modification,
la réinitialisation, la suppression et l’archivage des sessions, ainsi que les mutations du Gateway, restent réservés au propriétaire.

## Politique de sélection

OpenClaw choisit un environnement après la résolution du fournisseur et du modèle :

1. La politique d’exécution définie au niveau du modèle prévaut.
2. Vient ensuite la politique d’exécution définie au niveau du fournisseur.
3. `auto` demande aux environnements enregistrés s’ils prennent en charge la route effective
   résolue. Les préfixes de fournisseur ou de modèle seuls ne sélectionnent jamais un environnement.
4. Si aucun environnement enregistré ne correspond, OpenClaw utilise son environnement d’exécution intégré.

Les échecs des environnements de Plugin sont signalés comme des échecs d’exécution. En mode `auto`, le
repli intégré ne s’applique que lorsqu’aucun environnement de Plugin enregistré ne prend en charge le
fournisseur et le modèle résolus. Dès qu’un environnement de Plugin a revendiqué une exécution, OpenClaw ne
rejoue pas ce même tour dans un autre environnement d’exécution, car cela peut modifier
la sémantique d’authentification ou d’exécution, ou dupliquer les effets de bord.

La politique d’exécution configurée reste l’autorité quant à l’environnement d’exécution souhaité. La valeur
`agentHarnessId` d’une session persistante conserve la propriété de sa transcription native
pendant que la préparation de la route et de l’authentification est encore en attente. Aucune des deux ne rend
une route incompatible compatible : une fois les données préparées disponibles, l’environnement sélectionné ou épinglé
doit les prendre en charge, sinon l’exécution échoue de manière fermée. `/status` affiche l’environnement d’exécution effectif
sélectionné à partir de la politique, de la propriété persistante et de la prise en charge de la route.
L’état préparé est explicite : l’absence de `runtimePolicy` reste non déclarée au lieu
d’être déduite des champs de transport qui se trouvent présents.
Lorsque l’authentification détenue par l’environnement laisse plusieurs routes physiques non résolues, le
fait de prise en charge préparé correspond à l’intersection de leurs identifiants d’environnement d’exécution compatibles et
signale les substitutions de requête si un candidat en comporte. Un seul candidat non déclaré
rend donc la compatibilité native vide ; `preparedAuth.source: "harness"`
désigne un propriétaire de l’authentification, et non une autorisation de déduire la prise en charge de la route.

Si l’environnement sélectionné vous surprend, activez la journalisation de débogage `agents/harness`
et examinez l’enregistrement structuré `agent harness selected` du Gateway : il
comprend l’identifiant de l’environnement sélectionné, la raison de la sélection, la politique d’exécution et de repli
et, en mode `auto`, le résultat de prise en charge de chaque Plugin candidat.

Le Plugin Codex intégré enregistre `codex` comme identifiant d’environnement. Le cœur traite cette valeur
comme un identifiant ordinaire d’environnement de Plugin ; les alias propres à Codex doivent figurer dans le Plugin
ou dans la configuration de l’opérateur, et non dans le sélecteur d’environnement d’exécution partagé.

## Association d’un fournisseur et d’un environnement

La plupart des environnements doivent également enregistrer un fournisseur. Le fournisseur rend les références de modèles,
l’état de l’authentification, les métadonnées des modèles et la sélection via `/model` visibles par le reste
d’OpenClaw. L’environnement revendique ensuite ce fournisseur dans `supports(...)`.

Le Plugin Codex intégré suit ce modèle :

- références de modèles utilisateur privilégiées : `openai/gpt-5.6-sol`
- références de compatibilité : les anciennes références `codex/gpt-*` restent acceptées, mais les nouvelles
  configurations ne doivent pas les utiliser comme références normales de fournisseur et de modèle
- identifiant de l’environnement : `codex`
- authentification : disponibilité synthétique du fournisseur, car l’environnement Codex possède la
  connexion et la session Codex natives
- requête au serveur d’application : OpenClaw envoie l’identifiant de modèle brut à Codex et laisse
  l’environnement communiquer avec le protocole natif du serveur d’application

Le Plugin Codex est additif. Lorsque la politique d’exécution n’est pas définie ou vaut `auto`, OpenAI peut
sélectionner Codex uniquement lorsque son contrat de route détenu par le fournisseur déclare une compatibilité avec `codex` :
une route officielle exacte HTTPS Platform Responses ou ChatGPT Responses,
sans substitution de requête définie par l’auteur. Le préfixe `openai/*` seul ne
sélectionne jamais Codex. Les points de terminaison personnalisés, les adaptateurs Completions et le comportement de requête
défini par l’auteur restent gérés par OpenClaw. Les points de terminaison HTTP officiels en clair sont rejetés. Les anciennes références `codex/gpt-*`
restent des entrées de compatibilité. Consultez
[Environnement d’agent implicite OpenAI](/fr/providers/openai#implicit-agent-runtime).

Pour la configuration par l’opérateur, des exemples de préfixes de modèles et les configurations propres à Codex, consultez
[Environnement Codex](/fr/plugins/codex-harness).

Le Plugin Codex impose la version minimale du serveur d’application indiquée dans
[Environnement Codex](/fr/plugins/codex-harness). Il vérifie la négociation d’initialisation et
bloque les serveurs plus anciens ou sans version, afin qu’OpenClaw ne s’exécute que sur la surface
de protocole qu’il a testée.

### Intergiciel des résultats d’outils

Les plugins intégrés et les plugins installés explicitement activés dont les
contrats de manifeste correspondent peuvent associer un intergiciel de résultats d’outils indépendant de l’environnement d’exécution au moyen de
`api.registerAgentToolResultMiddleware(...)` lorsque leur manifeste déclare les
identifiants d’environnement d’exécution ciblés dans `contracts.agentToolResultMiddleware`. Cette
interface de confiance est destinée aux transformations asynchrones des résultats d’outils qui doivent s’exécuter avant qu’OpenClaw ou
Codex ne renvoie la sortie de l’outil au modèle.

Les anciens plugins intégrés peuvent toujours utiliser
`api.registerCodexAppServerExtensionFactory(...)` pour un intergiciel propre au serveur d’application
Codex, mais les nouvelles transformations de résultats doivent utiliser l’API indépendante de l’environnement d’exécution. Le
point d’extension `api.registerEmbeddedExtensionFactory(...)`, réservé à l’environnement d’exécution intégré, a été
supprimé ; les transformations intégrées des résultats d’outils doivent utiliser l’intergiciel indépendant de l’environnement d’exécution.

### Classification du résultat du terminal

Les harness natifs qui gèrent leur propre projection de protocole peuvent utiliser
`classifyAgentHarnessTerminalOutcome(...)` depuis
`openclaw/plugin-sdk/agent-harness-runtime` lorsqu'un tour terminé n'a produit aucun
texte visible de l'assistant. L'utilitaire renvoie `empty`, `reasoning-only` ou
`planning-only` afin que la politique de repli d'OpenClaw puisse décider s'il faut réessayer avec un
modèle différent. `planning-only` nécessite le champ `planText` explicite du harness ;
OpenClaw ne le déduit pas de la prose de l'assistant. L'utilitaire laisse
intentionnellement sans classification les erreurs d'invite, les tours en cours et les
réponses volontairement silencieuses telles que `NO_REPLY`.

### Effets secondaires de fin d'agent

Les harness natifs doivent appeler `runAgentEndSideEffects(...)` depuis
`openclaw/plugin-sdk/agent-harness-runtime` après avoir finalisé une tentative. Cette fonction
déclenche le hook portable `agent_end` et la capture de recherche d'OpenClaw
sans retarder les réponses interactives. Utilisez `awaitAgentEndSideEffects(...)` pour
les exécutions locales non interactives où la tentative ne doit pas se terminer avant que ces
effets secondaires soient achevés. Les deux utilitaires acceptent la même charge utile `{ event, ctx }` que
`runAgentHarnessAgentEndHook(...)` ; leurs échecs ne modifient pas le résultat de la
tentative terminée.

### Saisie utilisateur et surfaces d'outils

Les harness natifs qui exposent une demande de saisie utilisateur au niveau de l'environnement d'exécution doivent utiliser les
utilitaires de saisie utilisateur de `openclaw/plugin-sdk/agent-harness-runtime` pour mettre en forme
l'invite, la transmettre par le chemin de réponse bloquant d'OpenClaw et normaliser
les réponses à choix ou en texte libre dans la forme de réponse native de l'environnement d'exécution. Cet
utilitaire maintient une présentation cohérente entre les canaux et la TUI, tandis que chaque harness conserve
sa propre analyse du protocole et son propre cycle de vie des demandes en attente.

Les harness natifs qui nécessitent un routage compact des outils semblable à celui de PI doivent utiliser
`createAgentHarnessToolSurfaceRuntime(...)` depuis
`openclaw/plugin-sdk/agent-harness-tool-runtime`. Il gère
la sélection des contrôles de recherche d'outils et de mode code, les valeurs par défaut allégées pour les modèles locaux,
le filtrage des schémas compatible avec l'environnement d'exécution, l'exécution du catalogue masqué, l'hydratation
des répertoires et le nettoyage du catalogue. Les harness continuent de gérer leur conversion d'outils
propre au SDK et leur rappel d'exécution natif.

### Mode harness Codex natif

Le harness `codex` intégré constitue le mode Codex natif pour les tours d'agent
OpenClaw embarqués. Activez d'abord le Plugin `codex` intégré et incluez `codex` dans
`plugins.allow` si votre configuration utilise une liste d'autorisation restrictive. Les configurations natives de
serveur d'application doivent utiliser `openai/gpt-*` ; les tours d'agent OpenAI sélectionnent le harness Codex
uniquement lorsque la route effective déclare une compatibilité avec Codex. Les anciennes références de modèles Codex
doivent être réparées avec `openclaw doctor --fix`, et les anciennes références de modèles `codex/*`
restent des alias de compatibilité pour le harness natif.

Lorsque ce mode s'exécute, Codex gère l'identifiant de fil natif, le comportement de reprise,
la Compaction et l'exécution du serveur d'application. OpenClaw continue de gérer le canal de discussion,
le miroir visible de la transcription, la politique des outils, les approbations, la diffusion des médias et la sélection
des sessions. Utilisez `agentRuntime.id: "codex"` pour le fournisseur/modèle lorsque vous devez
prouver que seul le chemin du serveur d'application Codex peut prendre en charge l'exécution. Les environnements d'exécution de Plugin
explicites échouent de manière fermée ; les échecs de sélection du serveur d'application Codex et les échecs de l'environnement d'exécution
ne font pas l'objet d'une nouvelle tentative avec un autre environnement d'exécution.

## Rigueur de l'environnement d'exécution

Par défaut, OpenClaw utilise la politique d'environnement d'exécution `auto` du fournisseur/modèle : les harness
de Plugin enregistrés peuvent prendre en charge les routes effectives compatibles, et l'environnement d'exécution embarqué
gère le tour lorsqu'aucun ne correspond. Un préfixe de fournisseur/modèle ne sélectionne jamais
à lui seul un harness. Utilisez un environnement d'exécution de Plugin explicite pour le fournisseur/modèle, tel que
`agentRuntime.id: "codex"`, lorsque l'absence de sélection d'un harness doit provoquer un échec plutôt
qu'un routage par l'environnement d'exécution embarqué. Une sélection explicite ne rend pas une
route incompatible compatible. Les échecs du harness de Plugin sélectionné provoquent toujours un
échec définitif. Cela ne bloque pas un `agentRuntime.id: "openclaw"` explicite
pour le fournisseur/modèle.

Pour les exécutions embarquées réservées à Codex :

```json
{
  "models": {
    "providers": {
      "openai": {
        "agentRuntime": {
          "id": "codex"
        }
      }
    }
  },
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.6-sol"
    }
  }
}
```

Si vous souhaitez un backend CLI pour un seul modèle canonique, placez l'environnement d'exécution dans cette
entrée de modèle :

```json
{
  "agents": {
    "defaults": {
      "model": "anthropic/claude-opus-4-8",
      "models": {
        "anthropic/claude-opus-4-8": {
          "agentRuntime": {
            "id": "claude-cli"
          }
        }
      }
    }
  }
}
```

Les substitutions propres à chaque agent utilisent la même structure limitée au modèle :

```json
{
  "agents": {
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.6-sol",
        "models": {
          "openai/gpt-5.6-sol": {
            "agentRuntime": { "id": "codex" }
          }
        }
      }
    ]
  }
}
```

Les anciens exemples d'environnement d'exécution pour l'ensemble de l'agent, comme celui-ci, sont ignorés :

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "codex"
      }
    }
  }
}
```

Avec un environnement d'exécution de Plugin explicite, une session échoue rapidement lorsque le harness demandé
n'est pas enregistré, ne prend pas en charge le fournisseur/modèle résolu ou
échoue avant de produire les effets secondaires du tour. Ce comportement est intentionnel pour les déploiements
réservés à Codex et pour les tests en conditions réelles qui doivent prouver que le chemin du serveur d'application Codex est
effectivement utilisé.

Ce paramètre contrôle uniquement le harness d'agent embarqué. Il ne désactive pas
le routage des modèles propre aux fournisseurs pour les images, les vidéos, la musique, la synthèse vocale, les PDF ou d'autres contenus.

## Sessions natives et miroir de transcription

Un harness peut conserver un identifiant de session natif, un identifiant de fil ou un jeton de reprise
côté démon. Maintenez cette liaison explicitement associée à la session OpenClaw et
continuez à répliquer la sortie de l'assistant et des outils visible par l'utilisateur dans la
transcription OpenClaw.

La transcription OpenClaw reste la couche de compatibilité pour :

- l'historique des sessions visible dans les canaux
- la recherche et l'indexation des transcriptions
- le retour au harness OpenClaw intégré lors d'un tour ultérieur
- le comportement générique de `/new`, `/reset` et de suppression des sessions

Si votre harness stocke une liaison auxiliaire, implémentez `reset(...)` afin qu'OpenClaw
puisse l'effacer lorsque la session OpenClaw propriétaire est réinitialisée.

## Résultats des outils et des médias

Le cœur construit la liste d'outils OpenClaw et la transmet à la
tentative préparée. Lorsqu'un harness exécute un appel d'outil dynamique, renvoyez le résultat de l'outil
via la structure de résultat du harness au lieu d'envoyer vous-même les médias
au canal.

Cela maintient les sorties de texte, d'image, de vidéo, de musique, de synthèse vocale, d'approbation et des outils de
messagerie sur le même chemin de diffusion que les exécutions prises en charge par OpenClaw.

## Limitations actuelles

- Le chemin d'importation public est générique, mais certains alias de types de tentative/résultat
  conservent encore d'anciens noms à des fins de compatibilité.
- L'installation de harness tiers est expérimentale. Privilégiez les Plugins de fournisseur
  jusqu'à ce que vous ayez besoin d'un environnement d'exécution de session natif.
- Le changement de harness est pris en charge entre les tours. Ne changez pas de harness au
  milieu d'un tour après le démarrage des outils natifs, des approbations, du texte de l'assistant ou de l'envoi
  de messages.

## Rubriques connexes

- [Présentation du SDK](/fr/plugins/sdk-overview)
- [Utilitaires d'environnement d'exécution](/fr/plugins/sdk-runtime)
- [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins)
- [Harness Codex](/fr/plugins/codex-harness)
- [Fournisseurs de modèles](/fr/concepts/model-providers)
