---
read_when:
    - Vous modifiez l’environnement d’exécution intégré de l’agent ou le registre du harnais
    - Vous enregistrez un environnement d’agent depuis un plugin intégré ou approuvé.
    - Vous devez comprendre comment le plugin Codex est lié aux fournisseurs de modèles.
sidebarTitle: Agent Harness
summary: Surface SDK expérimentale pour les plugins qui remplacent l’exécuteur d’agent intégré de bas niveau
title: Plugins du harnais d’agent
x-i18n:
    generated_at: "2026-07-16T13:38:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 862d53022e48b93c98e98162f76460433b76005cba3188342d0977b951044106
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Un **harness d’agent** est l’exécuteur de bas niveau d’un tour préparé d’un agent
OpenClaw. Ce n’est ni un fournisseur de modèles, ni un canal, ni un registre d’outils. Pour
le modèle mental destiné aux utilisateurs, consultez [Environnements d’exécution des agents](/fr/concepts/agent-runtimes).

Utilisez cette surface uniquement pour les plugins natifs intégrés ou approuvés. Le contrat
reste expérimental, car les types de paramètres reflètent intentionnellement
l’exécuteur intégré actuel.

## Quand utiliser un harness

Enregistrez un harness d’agent lorsqu’une famille de modèles possède son propre environnement
d’exécution de session natif et que le transport de fournisseur OpenClaw normal n’est pas la bonne abstraction :

- un serveur natif d’agent de programmation qui gère les fils de discussion et la Compaction
- une CLI ou un démon local qui doit diffuser les événements natifs de planification, de raisonnement et d’outils
- un environnement d’exécution de modèle qui nécessite son propre identifiant de reprise en plus de la transcription
  de session OpenClaw

N’enregistrez **pas** un harness uniquement pour ajouter une nouvelle API de LLM. Pour les API de modèles HTTP ou
WebSocket normales, créez un [plugin de fournisseur](/fr/plugins/sdk-provider-plugins).

## Ce que le cœur continue de gérer

Avant la sélection d’un harness, OpenClaw a déjà résolu :

- le fournisseur et le modèle
- l’état d’authentification de l’environnement d’exécution, sauf si le harness déclare gérer l’initialisation de l’authentification
- le niveau de réflexion et le budget de contexte
- le fichier de transcription/session OpenClaw
- l’espace de travail, le bac à sable et la politique d’outils
- les rappels de réponse du canal et les rappels de diffusion
- la politique de repli et de changement de modèle à chaud

Un harness exécute une tentative préparée ; il ne choisit pas les fournisseurs, ne remplace pas la
distribution par canal et ne change pas silencieusement de modèle.

### Initialisation de l’authentification gérée par le harness

Par défaut, le cœur résout les identifiants du fournisseur avant d’appeler un harness. Un
harness approuvé capable de s’authentifier au moyen de son propre environnement d’exécution natif peut définir
`authBootstrap: "harness"` dans son enregistrement statique `AgentHarness`. Le cœur ignore alors
son initialisation générique des identifiants du fournisseur et l’échec dû à l’absence d’identifiants
pour chaque tentative prise en charge par ce harness.

Le cœur transmet toujours un profil d’authentification OpenClaw compatible, explicitement sélectionné ou ordonné,
ainsi que son stockage délimité, lorsqu’il en existe un. Le harness doit résoudre ce
profil ou ses identifiants natifs avant d’émettre des requêtes de modèle, limiter les secrets
à la tentative et signaler des échecs d’authentification exploitables. Ne définissez pas
cette capacité sur un harness qui ne gère l’authentification que dans certains cas.

### Artefacts d’environnement d’exécution vérifiés pour la configuration

Un harness local capable de fournir l’inférence lors de la configuration initiale doit attester
l’implémentation qui a terminé la sonde. Lorsque
`params.captureRuntimeArtifact` vaut vrai, renvoyez un
`result.runtimeArtifact` opaque avec un identifiant stable et une empreinte du contenu. Enregistrez une
capacité `runtimeArtifact.validate(...)` correspondante qui revérifie cette association
sans charger un autre harness ni analyser des plugins sans rapport.

Les continuations OpenClaw vérifiées transmettent également `params.expectedRuntimeArtifact`.
Le harness doit le comparer au processus natif exact qu’il a acquis et échouer
avant de démarrer ou de reprendre un fil natif s’ils diffèrent. Les tours d’agent ordinaires
omettent les deux champs, de sorte que le hachage du contenu reste hors du chemin critique normal
des requêtes. Les harness distants/WebSocket nécessitent un contrat d’attestation du serveur avant
de pouvoir participer ; une chaîne de version seule ne constitue pas l’identité d’un artefact.

La tentative préparée comprend également `params.runtimePlan`, un ensemble de politiques
géré par OpenClaw pour les décisions d’environnement d’exécution qui doivent rester partagées entre OpenClaw et
les harness natifs :

- `runtimePlan.tools.normalize(...)` et `runtimePlan.tools.logDiagnostics(...)`
  pour la politique de schéma d’outils tenant compte du fournisseur
- `runtimePlan.transcript.resolvePolicy(...)` pour l’assainissement de la transcription et
  la politique de réparation des appels d’outils
- `runtimePlan.delivery.isSilentPayload(...)` pour la suppression partagée de `NO_REPLY` et de la distribution
  des médias
- `runtimePlan.outcome.classifyRunResult(...)` pour la classification du repli
  de modèle
- `runtimePlan.observability` pour les métadonnées résolues du fournisseur, du modèle et du harness

Les harness peuvent utiliser le plan pour les décisions qui doivent correspondre au comportement d’OpenClaw,
mais doivent le traiter comme un état de tentative géré par l’hôte : ne le modifiez pas et ne l’utilisez pas pour changer
de fournisseur ou de modèle au cours d’un tour.

### Contrat de transport des requêtes

`supports(ctx)` reçoit le transport de modèle résolu dans `ctx.modelProvider`.
Deux faits sans secret et gérés par le fournisseur décrivent la route sélectionnée :

- `runtimePolicy.compatibleIds` répertorie les identifiants d’environnements d’exécution que le fournisseur déclare
  compatibles avec cette route concrète. L’absence de politique signifie que le fournisseur n’a
  déclaré aucune compatibilité au niveau de la route ; elle n’autorise pas à supposer une prise en charge.
- `requestTransportOverrides: "none"` signifie qu’aucune substitution de requête de fournisseur/modèle définie
  ne doit être reproduite. `"present"` signifie qu’il existe des en-têtes définis, un transport
  d’authentification, un proxy, une configuration TLS, un service local, un comportement de réseau privé ou des paramètres
  de requête. Ce fait n’expose pas ces valeurs.

Renvoyez `{ supported: false, reason }` lorsque le harness ne peut pas reproduire le
transport préparé. Ne déduisez pas la prise en charge en lisant la configuration brute après la sélection.
Lorsque la préparation de l’authentification produit plusieurs routes de nouvelle tentative, un seul harness doit prendre en charge
toutes ces routes avant la distribution. La sélection implicite utilise OpenClaw si aucun plugin ne peut
gérer l’ensemble complet ; une sélection de plugin explicite ou persistante échoue de manière fermée.

## Enregistrer un harness

**Importation :** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "My native agent harness",

  supports(ctx) {
    const routeSupportsHarness =
      ctx.modelProvider?.runtimePolicy?.compatibleIds.includes("my-harness") === true;
    const canReproduceRequest = ctx.modelProvider?.requestTransportOverrides !== "present";
    return ctx.provider === "my-provider" && routeSupportsHarness && canReproduceRequest
      ? { supported: true, priority: 100 }
      : { supported: false, reason: "effective route is not harness-compatible" };
  },

  async runAttempt(params) {
    // Start or resume your native thread.
    // Use params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent, and the other prepared attempt fields.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "My Native Agent",
  description: "Runs selected models through a native agent daemon.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

`authBootstrap` est intentionnellement absent de cet exemple générique. Ajoutez
`authBootstrap: "harness"` uniquement lorsque le harness respecte le contrat ci-dessus.

### Exécution déléguée

Le propriétaire d’un harness peut définir `delegatedExecutionPluginIds` avec les identifiants des
plugins approuvés qui doivent exécuter une session existante verrouillée sur un modèle, par exemple un transport
vocal poursuivant une conversation reposant sur Codex. Il s’agit d’un consentement statique du propriétaire,
et non d’une liste d’autorisation du cœur. Maintenez-la restreinte.

Les délégués reçoivent uniquement l’admission du travail et l’exécution intégrée. OpenClaw exige
la clé de session stockée exacte, le chemin du stockage et l’identifiant de session ; `modelSelectionLocked:
true` ; ainsi que des valeurs `agentHarnessId` et `agentHarnessRuntimeOverride` correspondantes.
L’exécution est ensuite délimitée par l’intermédiaire du propriétaire du harness. La création, la modification,
la réinitialisation, la suppression et l’archivage de sessions, ainsi que les mutations du Gateway, restent réservées au propriétaire.

## Politique de sélection

OpenClaw choisit un harness après la résolution du fournisseur et du modèle :

1. La politique d’environnement d’exécution propre au modèle prévaut.
2. La politique d’environnement d’exécution propre au fournisseur vient ensuite.
3. `auto` demande aux harness enregistrés s’ils prennent en charge la route effective
   résolue. Les préfixes de fournisseur/modèle seuls ne sélectionnent jamais un harness.
4. Si aucun harness enregistré ne correspond, OpenClaw utilise son environnement d’exécution intégré.

Les échecs des harness de plugins sont signalés comme des échecs d’exécution. En mode `auto`, le repli
intégré ne s’applique que lorsqu’aucun harness de plugin enregistré ne prend en charge le
fournisseur/modèle résolu. Une fois qu’un harness de plugin a pris en charge une exécution, OpenClaw ne
rejoue pas le même tour dans un autre environnement d’exécution, car cela peut modifier
la sémantique d’authentification ou d’environnement d’exécution, ou dupliquer des effets secondaires.

La politique d’environnement d’exécution configurée reste la référence pour l’environnement d’exécution souhaité. Une
session persistante `agentHarnessId` conserve la propriété de sa transcription native
pendant que la préparation de la route et de l’authentification est encore en attente. Aucun des deux ne rend compatible
une route incompatible : une fois les faits préparés disponibles, le harness sélectionné ou épinglé
doit les prendre en charge, faute de quoi l’exécution échoue de manière fermée. `/status` affiche l’environnement d’exécution effectif
sélectionné à partir de la politique, de la propriété persistante et de la prise en charge de la route.
L’état préparé est explicite : l’absence de `runtimePolicy` reste non déclarée au lieu
d’être déduite des champs de transport présents.
Lorsque l’authentification gérée par le harness laisse plusieurs routes physiques non résolues, le
fait de prise en charge préparé correspond à l’intersection de leurs identifiants d’environnements d’exécution compatibles et
signale les substitutions de requête si l’un des candidats en possède. Un seul candidat non déclaré
rend donc la compatibilité native vide ; `preparedAuth.source: "harness"`
est un propriétaire d’authentification, et non une autorisation de déduire la prise en charge de la route.

Si le harness sélectionné est inattendu, activez la journalisation de débogage `agents/harness`
et inspectez l’enregistrement structuré `agent harness selected` du Gateway : il
comprend l’identifiant du harness sélectionné, le motif de sélection, la politique d’environnement d’exécution et de repli
et, en mode `auto`, le résultat de prise en charge de chaque candidat de plugin.

Le plugin Codex intégré enregistre `codex` comme identifiant de harness. Le cœur traite cet identifiant
comme un identifiant ordinaire de harness de plugin ; les alias propres à Codex appartiennent au plugin
ou à la configuration de l’opérateur, et non au sélecteur d’environnement d’exécution partagé.

## Association d’un fournisseur et d’un harness

La plupart des harness doivent également enregistrer un fournisseur. Le fournisseur rend les références de modèles,
l’état d’authentification, les métadonnées des modèles et la sélection `/model` visibles pour le reste
d’OpenClaw. Le harness prend ensuite en charge ce fournisseur dans `supports(...)`.

Le plugin Codex intégré suit ce modèle :

- références de modèles utilisateur privilégiées : `openai/gpt-5.6-sol`
- références de compatibilité : les références `codex/gpt-*` héritées restent acceptées, mais les nouvelles
  configurations ne doivent pas les utiliser comme références normales de fournisseur/modèle
- identifiant du harness : `codex`
- authentification : disponibilité synthétique du fournisseur, car le harness Codex gère la
  connexion et la session Codex natives
- requête au serveur d’application : OpenClaw envoie l’identifiant de modèle brut à Codex et laisse le
  harness communiquer avec le protocole natif du serveur d’application

Le plugin Codex est additif. Lorsque la politique d’environnement d’exécution n’est pas définie ou vaut `auto`, OpenAI peut
sélectionner Codex uniquement lorsque son contrat de route géré par le fournisseur déclare `codex`
compatible : une route officielle HTTPS exacte de Platform Responses ou ChatGPT Responses,
sans substitution de requête définie. Le préfixe `openai/*` seul ne
sélectionne jamais Codex. Les points de terminaison personnalisés, les adaptateurs Completions et les comportements de requête
définis restent sur OpenClaw. Les points de terminaison HTTP officiels en clair sont rejetés. Les anciennes références `codex/gpt-*`
restent des entrées de compatibilité. Consultez
[Environnement d’exécution d’agent OpenAI implicite](/fr/providers/openai#implicit-agent-runtime).

Pour la configuration par l’opérateur, les exemples de préfixes de modèles et les configurations propres à Codex, consultez
[Harness Codex](/fr/plugins/codex-harness).

Le plugin Codex impose la version minimale du serveur d’application documentée dans
[Harness Codex](/fr/plugins/codex-harness). Il vérifie la négociation d’initialisation et
bloque les serveurs plus anciens ou sans version, afin qu’OpenClaw ne s’exécute qu’avec la surface
de protocole qu’il a testée.

### Intergiciel de résultats d’outils

Les plugins intégrés et les plugins installés explicitement activés dont les contrats de manifeste
correspondent peuvent associer un intergiciel de résultats d’outils indépendant de l’environnement d’exécution au moyen de
`api.registerAgentToolResultMiddleware(...)` lorsque leur manifeste déclare les
identifiants d’environnements d’exécution ciblés dans `contracts.agentToolResultMiddleware`. Cette
interface approuvée est destinée aux transformations asynchrones des résultats d’outils qui doivent s’exécuter avant qu’OpenClaw ou
Codex ne retransmette la sortie de l’outil au modèle.

Les plugins intégrés hérités peuvent encore utiliser
`api.registerCodexAppServerExtensionFactory(...)` pour les intergiciels réservés au serveur d’application Codex,
mais les nouvelles transformations de résultats doivent utiliser l’API indépendante du runtime. Le
hook `api.registerEmbeddedExtensionFactory(...)`, réservé à l’exécuteur intégré, a été
supprimé ; les transformations intégrées des résultats d’outils doivent utiliser un intergiciel indépendant du runtime.

### Classification des résultats terminaux

Les harnais natifs qui gèrent leur propre projection de protocole peuvent utiliser
`classifyAgentHarnessTerminalOutcome(...)` depuis
`openclaw/plugin-sdk/agent-harness-runtime` lorsqu’un tour terminé n’a produit aucun
texte d’assistant visible. L’utilitaire renvoie `empty`, `reasoning-only` ou
`planning-only` afin que la stratégie de repli d’OpenClaw puisse décider s’il faut réessayer avec un
autre modèle. `planning-only` nécessite le champ `planText` explicite
du harnais ; OpenClaw ne le déduit pas du texte de l’assistant. L’utilitaire
laisse intentionnellement sans classification les erreurs d’invite, les tours en cours et les réponses
volontairement silencieuses telles que `NO_REPLY`.

### Effets secondaires de fin d’agent

Les harnais natifs doivent appeler `runAgentEndSideEffects(...)` depuis
`openclaw/plugin-sdk/agent-harness-runtime` après avoir finalisé une tentative. Cet utilitaire
déclenche le hook portable `agent_end` et la capture de recherche d’OpenClaw
sans retarder les réponses interactives. Utilisez `awaitAgentEndSideEffects(...)` pour
les exécutions locales non interactives où la tentative ne doit pas se terminer avant que ces
effets secondaires soient achevés. Les deux utilitaires acceptent la même charge utile `{ event, ctx }` que
`runAgentHarnessAgentEndHook(...)` ; leurs échecs ne modifient pas le résultat de la
tentative terminée.

### Entrées utilisateur et surfaces d’outils

Les harnais natifs qui exposent une demande d’entrée utilisateur au niveau du runtime doivent utiliser les
utilitaires d’entrée utilisateur de `openclaw/plugin-sdk/agent-harness-runtime` pour mettre en forme
l’invite, la transmettre via le chemin de réponse bloquant d’OpenClaw et normaliser
les réponses à choix ou libres dans la forme de réponse native du runtime. Cet
utilitaire assure une présentation cohérente dans les canaux et la TUI, tandis que chaque harnais conserve
sa propre analyse du protocole et son propre cycle de vie des demandes en attente.

Les harnais natifs qui ont besoin d’un routage compact des outils similaire à PI doivent utiliser
`createAgentHarnessToolSurfaceRuntime(...)` depuis
`openclaw/plugin-sdk/agent-harness-tool-runtime`. Il gère
la sélection des contrôles de recherche d’outils et de mode code, les valeurs par défaut allégées des modèles locaux,
le filtrage de schéma compatible avec le runtime, l’exécution du catalogue masqué, l’hydratation
des répertoires et le nettoyage du catalogue. Les harnais restent responsables de la
conversion des outils propre à leur SDK et du rappel d’exécution natif.

### Mode de harnais Codex natif

Le harnais `codex` intégré est le mode Codex natif pour les tours d’agent OpenClaw
intégrés. Activez d’abord le plugin `codex` intégré et incluez `codex` dans
`plugins.allow` si votre configuration utilise une liste d’autorisation restrictive. Les configurations natives du serveur d’application
doivent utiliser `openai/gpt-*` ; les tours d’agent OpenAI ne sélectionnent le harnais Codex
que lorsque la route effective déclare une compatibilité avec Codex. Les anciennes
références de modèle Codex doivent être réparées avec `openclaw doctor --fix`, et les anciennes références de modèle `codex/*`
restent des alias de compatibilité pour le harnais natif.

Lorsque ce mode s’exécute, Codex gère l’identifiant de fil natif, le comportement de reprise,
la Compaction et l’exécution du serveur d’application. OpenClaw continue de gérer le canal de discussion,
le miroir visible de la transcription, la stratégie d’outils, les approbations, la livraison des médias et la sélection
de session. Utilisez le fournisseur/modèle `agentRuntime.id: "codex"` lorsque vous devez
prouver que seul le chemin du serveur d’application Codex peut prendre en charge l’exécution. Les runtimes de plugins
explicites échouent de manière fermée ; les échecs de sélection du serveur d’application Codex et les échecs du runtime
ne sont pas réessayés avec un autre runtime.

## Rigueur du runtime

Par défaut, OpenClaw utilise la stratégie de runtime fournisseur/modèle `auto` : les
harnais de plugins enregistrés peuvent prendre en charge les routes effectives compatibles, et le runtime
intégré traite le tour lorsqu’aucun ne correspond. Un préfixe de fournisseur/modèle ne
sélectionne jamais à lui seul un harnais. Utilisez un runtime de plugin fournisseur/modèle explicite tel que
`agentRuntime.id: "codex"` lorsque l’absence de sélection d’un harnais doit provoquer un échec au lieu
d’un routage via le runtime intégré. Une sélection explicite ne rend pas
compatible une route incompatible. Les échecs des harnais de plugins sélectionnés entraînent toujours un échec
définitif. Cela ne bloque pas un
`agentRuntime.id: "openclaw"` fournisseur/modèle explicite.

Pour les exécutions intégrées réservées à Codex :

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

Si vous souhaitez un backend CLI pour un modèle canonique, placez le runtime dans
l’entrée de ce modèle :

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

Les anciens exemples de runtime pour l’ensemble de l’agent, comme celui-ci, sont ignorés :

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

Avec un runtime de plugin explicite, une session échoue rapidement lorsque le
harnais demandé n’est pas enregistré, ne prend pas en charge le fournisseur/modèle résolu ou
échoue avant de produire les effets secondaires du tour. Ce comportement est intentionnel pour les déploiements
réservés à Codex et pour les tests en conditions réelles qui doivent prouver que le chemin du serveur d’application Codex est
réellement utilisé.

Ce paramètre contrôle uniquement le harnais d’agent intégré. Il ne désactive pas
le routage de modèles propre aux fournisseurs pour les images, les vidéos, la musique, la TTS, les PDF ou d’autres contenus.

## Sessions natives et miroir de transcription

Un harnais peut conserver un identifiant de session natif, un identifiant de fil ou un jeton de reprise
côté démon. Gardez cette liaison explicitement associée à la session OpenClaw et
continuez à répliquer dans la transcription OpenClaw les sorties de l’assistant et des outils
visibles par l’utilisateur.

La transcription OpenClaw reste la couche de compatibilité pour :

- l’historique de session visible dans le canal
- la recherche et l’indexation des transcriptions
- le retour au harnais OpenClaw intégré lors d’un tour ultérieur
- le comportement générique de `/new`, `/reset` et de suppression de session

Si votre harnais stocke une liaison annexe, implémentez `reset(...)` afin qu’OpenClaw
puisse l’effacer lorsque la session OpenClaw propriétaire est réinitialisée.

## Résultats des outils et des médias

Le cœur construit la liste d’outils OpenClaw et la transmet à la
tentative préparée. Lorsqu’un harnais exécute un appel d’outil dynamique, renvoyez le résultat de l’outil
via la structure de résultat du harnais au lieu d’envoyer vous-même les médias
dans le canal.

Ainsi, les sorties de texte, d’image, de vidéo, de musique, de TTS, d’approbation et d’outils de messagerie
suivent le même chemin de livraison que les exécutions gérées par OpenClaw.

### Résultats terminaux des outils

`AgentHarnessAttemptParams.observeToolTerminal` est l’accumulateur de résultats
terminaux géré par l’hôte. Un harnais qui exécute des outils dynamiques OpenClaw ou des outils
natifs doit l’appeler lorsque chaque outil atteint un résultat terminal, avant que le
résultat de la tentative soit finalisé. Les harnais qui n’exécutent aucun outil n’ont pas besoin de
l’appeler.

Signalez les faits depuis la limite d’exécution :

- Transmettez l’identifiant d’appel du protocole lorsqu’il existe, le nom canonique de l’outil et les
  arguments effectivement reçus par l’outil après la préparation ou les réécritures par les hooks.
- Définissez `executionStarted: false` lorsque la validation, l’approbation ou un autre garde-fou
  a interrompu l’appel avant le démarrage de l’implémentation de l’outil. Dès qu’une transmission
  a pu avoir lieu, signalez `true` par prudence.
- Signalez `outcome: "success"` ou `outcome: "failure"`. Incluez les champs structurés
  d’échec disponibles dans le runtime au lieu de déduire l’échec du
  texte affiché.
- Utilisez `nativeMutation` uniquement pour les outils natifs qui n’utilisent pas de définition d’outil
  OpenClaw. Fournissez-y les faits de mutation et de relecture gérés par le protocole ; ne
  copiez pas le classificateur de mutations d’OpenClaw dans le harnais.

Le rappel renvoie la résolution canonique de cet appel. Transmettez son
`lastToolError` à `AgentHarnessAttemptResult` et utilisez ses faits relatifs à l’exécution,
aux arguments et aux effets secondaires dans la projection du harnais au lieu de dériver
un état parallèle. L’hôte conserve un échec de mutation non résolu malgré la réussite
d’outils sans rapport et ne l’efface qu’après la réussite de l’action correspondante.

Le rappel reste facultatif pour assurer la compatibilité du code source avec les anciens harnais
expérimentaux. Facultatif ne signifie pas qu’un harnais qui exécute des outils peut l’ignorer :
sans rapports terminaux, OpenClaw ne peut pas préserver la réalité d’un échec d’outil de mutation
au fil des appels d’outils ultérieurs, y compris lors de l’achèvement silencieux d’un Heartbeat.

## Limites actuelles

- Le chemin d’importation public est générique, mais certains alias de types de tentative/résultat
  conservent encore des noms hérités pour assurer la compatibilité.
- L’installation de harnais tiers est expérimentale. Privilégiez les plugins de fournisseur
  jusqu’à ce qu’un runtime de session natif soit nécessaire.
- Le changement de harnais est pris en charge entre les tours. Ne changez pas de harnais au
  milieu d’un tour après le démarrage des outils natifs, des approbations, du texte de l’assistant ou de l’envoi
  de messages.

## Ressources associées

- [Présentation du SDK](/fr/plugins/sdk-overview)
- [Utilitaires du runtime](/fr/plugins/sdk-runtime)
- [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins)
- [Harnais Codex](/fr/plugins/codex-harness)
- [Fournisseurs de modèles](/fr/concepts/model-providers)
