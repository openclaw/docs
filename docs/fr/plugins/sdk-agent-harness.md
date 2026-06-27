---
read_when:
    - Vous modifiez le runtime d’agent intégré ou le registre du harnais
    - Vous enregistrez un harnais d’agent depuis un Plugin intégré ou de confiance
    - Vous devez comprendre comment le Plugin Codex s’articule avec les fournisseurs de modèles
sidebarTitle: Agent Harness
summary: Surface SDK expérimentale pour les plugins qui remplacent l’exécuteur d’agent intégré de bas niveau
title: Plugins de harnais d’agent
x-i18n:
    generated_at: "2026-06-27T17:58:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a368ae480c31c86c30786f91e5cf451c3489c681be8ee3955c1c2bd55e4b49e9
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Un **harnais d’agent** est l’exécuteur de bas niveau pour un tour d’agent OpenClaw
préparé. Ce n’est pas un fournisseur de modèle, ni un canal, ni un registre
d’outils. Pour le modèle mental destiné aux utilisateurs, consultez [Runtimes d’agent](/fr/concepts/agent-runtimes).

N’utilisez cette surface que pour des plugins natifs intégrés ou de confiance. Le contrat reste
expérimental, car les types de paramètres reflètent intentionnellement le runner
intégré actuel.

## Quand utiliser un harnais

Enregistrez un harnais d’agent lorsqu’une famille de modèles dispose de son propre runtime
de session natif et que le transport de fournisseur OpenClaw normal n’est pas la bonne abstraction.

Exemples :

- un serveur d’agent de codage natif qui possède les fils et la Compaction
- une CLI ou un daemon local qui doit diffuser des événements natifs de plan/raisonnement/outils
- un runtime de modèle qui a besoin de son propre identifiant de reprise en plus de la
  transcription de session OpenClaw

N’enregistrez **pas** un harnais uniquement pour ajouter une nouvelle API LLM. Pour les API de modèle HTTP ou
WebSocket normales, créez un [plugin de fournisseur](/fr/plugins/sdk-provider-plugins).

## Ce que le cœur possède toujours

Avant qu’un harnais soit sélectionné, OpenClaw a déjà résolu :

- le fournisseur et le modèle
- l’état d’authentification du runtime
- le niveau de réflexion et le budget de contexte
- le fichier de transcription/session OpenClaw
- l’espace de travail, le bac à sable et la politique des outils
- les callbacks de réponse du canal et les callbacks de streaming
- la politique de repli de modèle et de changement de modèle en direct

Cette séparation est intentionnelle. Un harnais exécute une tentative préparée ; il ne choisit pas
les fournisseurs, ne remplace pas la livraison par canal et ne change pas silencieusement de modèle.

La tentative préparée inclut aussi `params.runtimePlan`, un ensemble de politiques appartenant à OpenClaw
pour les décisions de runtime qui doivent rester partagées entre OpenClaw et les harnais
natifs :

- `runtimePlan.tools.normalize(...)` et
  `runtimePlan.tools.logDiagnostics(...)` pour la politique de schéma d’outils consciente du fournisseur
- `runtimePlan.transcript.resolvePolicy(...)` pour la désinfection de transcription et la
  politique de réparation des appels d’outils
- `runtimePlan.delivery.isSilentPayload(...)` pour la suppression partagée de livraison `NO_REPLY` et de médias
- `runtimePlan.outcome.classifyRunResult(...)` pour la classification de repli de modèle
- `runtimePlan.observability` pour les métadonnées résolues de fournisseur/modèle/harnais

Les harnais peuvent utiliser le plan pour les décisions qui doivent correspondre au comportement d’OpenClaw, mais
doivent tout de même le traiter comme un état de tentative appartenant à l’hôte. Ne le modifiez pas et ne l’utilisez pas pour
changer de fournisseur/modèle à l’intérieur d’un tour.

## Enregistrer un harnais

**Importation :** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "My native agent harness",

  supports(ctx) {
    return ctx.provider === "my-provider"
      ? { supported: true, priority: 100 }
      : { supported: false };
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

## Politique de sélection

OpenClaw choisit un harnais après la résolution fournisseur/modèle :

1. La politique de runtime limitée au modèle l’emporte.
2. La politique de runtime limitée au fournisseur vient ensuite.
3. `auto` demande aux harnais enregistrés s’ils prennent en charge le
   fournisseur/modèle résolu.
4. Si aucun harnais enregistré ne correspond, OpenClaw utilise son runtime intégré.

Les échecs de harnais de plugin apparaissent comme des échecs d’exécution. En mode `auto`, le repli intégré est
utilisé uniquement lorsqu’aucun harnais de plugin enregistré ne prend en charge le
fournisseur/modèle résolu. Une fois qu’un harnais de plugin a réclamé une exécution, OpenClaw ne
rejoue pas ce même tour via un autre runtime, car cela peut changer
la sémantique d’authentification/runtime ou dupliquer des effets de bord.

Les épinglages de runtime sur toute la session et tout l’agent sont ignorés par la sélection. Cela
inclut les valeurs obsolètes de session `agentHarnessId`, `agents.defaults.agentRuntime`,
`agents.list[].agentRuntime` et `OPENCLAW_AGENT_RUNTIME`. `/status` affiche le
runtime effectif sélectionné depuis la route fournisseur/modèle.
Si le harnais sélectionné est surprenant, activez la journalisation de débogage `agents/harness` et
inspectez l’enregistrement structuré `agent harness selected` du Gateway. Il inclut
l’identifiant du harnais sélectionné, la raison de sélection, la politique de runtime/repli et, en
mode `auto`, le résultat de prise en charge de chaque candidat de plugin.

Le plugin Codex intégré enregistre `codex` comme identifiant de harnais. Le cœur traite cela
comme un identifiant de harnais de plugin ordinaire ; les alias propres à Codex appartiennent au plugin
ou à la configuration opérateur, pas au sélecteur de runtime partagé.

## Association fournisseur et harnais

La plupart des harnais doivent aussi enregistrer un fournisseur. Le fournisseur rend les références de modèle,
l’état d’authentification, les métadonnées de modèle et la sélection `/model` visibles pour le reste
d’OpenClaw. Le harnais réclame ensuite ce fournisseur dans `supports(...)`.

Le plugin Codex intégré suit ce modèle :

- références de modèle utilisateur préférées : `openai/gpt-5.5`
- références de compatibilité : les anciennes références `codex/gpt-*` restent acceptées, mais les nouvelles
  configs ne doivent pas les utiliser comme références fournisseur/modèle normales
- identifiant de harnais : `codex`
- authentification : disponibilité de fournisseur synthétique, car le harnais Codex possède la
  connexion/session Codex native
- requête app-server : OpenClaw envoie l’identifiant de modèle brut à Codex et laisse le
  harnais parler au protocole app-server natif

Le plugin Codex est additif. Les références d’agent `openai/gpt-*` simples sur le fournisseur
OpenAI officiel sélectionnent le harnais Codex par défaut. Les anciennes références `codex/gpt-*`
sélectionnent toujours le fournisseur et le harnais Codex par compatibilité.

Pour la configuration opérateur, les exemples de préfixes de modèle et les configs propres à Codex, consultez
[Harnais Codex](/fr/plugins/codex-harness).

OpenClaw exige Codex app-server `0.125.0` ou plus récent. Le plugin Codex vérifie
la négociation d’initialisation de l’app-server et bloque les serveurs plus anciens ou sans version afin
qu’OpenClaw ne s’exécute que sur la surface de protocole avec laquelle il a été testé. Le
plancher `0.125.0` inclut la prise en charge de charge utile du hook MCP natif arrivée dans
Codex `0.124.0`, tout en épinglant OpenClaw sur la ligne stable testée plus récente.

### Middleware de résultat d’outil

Les plugins intégrés et les plugins installés explicitement activés avec des contrats de manifeste correspondants
peuvent attacher un middleware de résultat d’outil neutre vis-à-vis du runtime via
`api.registerAgentToolResultMiddleware(...)` lorsque leur manifeste déclare les
identifiants de runtime ciblés dans `contracts.agentToolResultMiddleware`. Cette surface de confiance
sert aux transformations asynchrones de résultats d’outils qui doivent s’exécuter avant qu’OpenClaw ou Codex
ne renvoie la sortie d’outil au modèle.

Les anciens plugins intégrés peuvent toujours utiliser
`api.registerCodexAppServerExtensionFactory(...)` pour un middleware réservé à l’app-server Codex,
mais les nouvelles transformations de résultats doivent utiliser l’API neutre vis-à-vis du runtime.
Le hook réservé au runner intégré `api.registerEmbeddedExtensionFactory(...)` a été supprimé ;
les transformations de résultats d’outils intégrées doivent utiliser le middleware neutre vis-à-vis du runtime.

### Classification du résultat terminal

Les harnais natifs qui possèdent leur propre projection de protocole peuvent utiliser
`classifyAgentHarnessTerminalOutcome(...)` depuis
`openclaw/plugin-sdk/agent-harness-runtime` lorsqu’un tour terminé n’a produit aucun
texte d’assistant visible. L’aide renvoie `empty`, `reasoning-only` ou
`planning-only` afin que la politique de repli d’OpenClaw puisse décider de réessayer sur un
modèle différent. `planning-only` exige le champ explicite `planText` du harnais ;
OpenClaw ne l’infère pas de la prose de l’assistant. L’aide laisse intentionnellement
non classés les erreurs de prompt, les tours en cours et les réponses silencieuses intentionnelles comme
`NO_REPLY`.

### Effets de bord de fin d’agent

Les harnais natifs doivent appeler `runAgentEndSideEffects(...)` depuis
`openclaw/plugin-sdk/agent-harness-runtime` après avoir finalisé une tentative. Il
déclenche le hook portable `agent_end` et la capture de recherche d’OpenClaw sans
retarder les réponses interactives. Utilisez `awaitAgentEndSideEffects(...)` pour les exécutions locales,
non interactives, où la tentative ne doit pas se résoudre avant la fin de ces effets de bord.
Les deux aides acceptent la même charge utile `{ event, ctx }` que
`runAgentHarnessAgentEndHook(...)` ; leurs échecs ne modifient pas le résultat de tentative
terminé.

### Entrée utilisateur et surfaces d’outils

Les harnais natifs qui exposent une demande d’entrée utilisateur au niveau du runtime doivent utiliser les
aides d’entrée utilisateur depuis `openclaw/plugin-sdk/agent-harness-runtime` pour formater
le prompt, le livrer via le chemin de réponse bloquant d’OpenClaw et normaliser
les réponses à choix/libres vers la forme de réponse native du runtime. L’aide
garde la présentation canal/TUI cohérente tandis que chaque harnais conserve sa
propre analyse de protocole et son cycle de vie de requête en attente.

Les harnais natifs qui ont besoin d’un routage d’outils compact de type PI doivent utiliser
`createAgentHarnessToolSurfaceRuntime(...)` depuis
`openclaw/plugin-sdk/agent-harness-tool-runtime`. Il possède la sélection de contrôle
recherche d’outils/mode code, les valeurs par défaut allégées du modèle local,
le filtrage de schéma compatible runtime, l’exécution de catalogue masqué, l’hydratation
de répertoires et le nettoyage de catalogue. Les harnais possèdent toujours leur conversion d’outils
propre au SDK et leur callback d’exécution natif.

### Mode de harnais Codex natif

Le harnais `codex` intégré est le mode Codex natif pour les tours d’agent OpenClaw
intégrés. Activez d’abord le plugin `codex` intégré, et incluez `codex` dans
`plugins.allow` si votre config utilise une liste d’autorisation restrictive. Les configs d’app-server
natives doivent utiliser `openai/gpt-*` ; les tours d’agent OpenAI sélectionnent le harnais Codex
par défaut. Les routes d’anciennes références de modèle Codex doivent être réparées avec
`openclaw doctor --fix`, et les anciennes références de modèle `codex/*` restent des alias de compatibilité
pour le harnais natif.

Lorsque ce mode s’exécute, Codex possède l’identifiant de fil natif, le comportement de reprise,
la Compaction et l’exécution app-server. OpenClaw possède toujours le canal de discussion,
le miroir de transcription visible, la politique des outils, les approbations, la livraison de médias et la sélection
de session. Utilisez fournisseur/modèle `agentRuntime.id: "codex"` lorsque vous devez prouver
que seul le chemin app-server Codex peut réclamer l’exécution. Les runtimes de plugin explicites
échouent de manière fermée ; les échecs de sélection app-server Codex et les échecs de runtime ne sont pas
réessayés via un autre runtime.

## Rigueur du runtime

Par défaut, OpenClaw utilise la politique de runtime fournisseur/modèle `auto` : les harnais de
plugin enregistrés peuvent réclamer une paire fournisseur/modèle, et le runtime intégré
gère le tour lorsqu’aucun ne correspond. Les références d’agent OpenAI sur le fournisseur OpenAI officiel utilisent Codex par défaut.
Utilisez un runtime de plugin fournisseur/modèle explicite comme
`agentRuntime.id: "codex"` lorsque l’absence de sélection de harnais doit échouer au lieu
d’être routée via le runtime intégré. Les échecs du harnais de plugin sélectionné échouent toujours
fermement. Cela ne bloque pas un `agentRuntime.id: "openclaw"` fournisseur/modèle explicite.

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
      "model": "openai/gpt-5.5"
    }
  }
}
```

Si vous voulez un backend CLI pour un modèle canonique, placez le runtime sur cette
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

Les remplacements par agent utilisent la même forme limitée au modèle :

```json
{
  "agents": {
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "models": {
          "openai/gpt-5.5": {
            "agentRuntime": { "id": "codex" }
          }
        }
      }
    ]
  }
}
```

Les anciens exemples de runtime sur tout l’agent comme celui-ci sont ignorés :

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

Avec un runtime de Plugin explicite, une session échoue tôt lorsque le harnais
demandé n’est pas enregistré, ne prend pas en charge le fournisseur/modèle résolu, ou
échoue avant de produire des effets de bord de tour. C’est intentionnel pour les
déploiements exclusivement Codex et pour les tests live qui doivent prouver que le chemin
du serveur d’application Codex est réellement utilisé.

Ce paramètre contrôle uniquement le harnais d’agent intégré. Il ne désactive pas
le routage des modèles spécifique aux fournisseurs pour les images, la vidéo, la musique, le TTS, les PDF ou autres.

## Sessions natives et miroir de transcription

Un harnais peut conserver un identifiant de session natif, un identifiant de fil ou un jeton de reprise côté démon.
Gardez cette liaison explicitement associée à la session OpenClaw, et continuez
à répliquer la sortie assistant/outil visible par l’utilisateur dans la transcription OpenClaw.

La transcription OpenClaw reste la couche de compatibilité pour :

- l’historique de session visible dans les canaux
- la recherche et l’indexation des transcriptions
- le retour au harnais OpenClaw intégré lors d’un tour ultérieur
- le comportement générique de `/new`, `/reset` et de suppression de session

Si votre harnais stocke une liaison auxiliaire, implémentez `reset(...)` afin qu’OpenClaw puisse
la supprimer lorsque la session OpenClaw propriétaire est réinitialisée.

## Résultats d’outils et de médias

Le cœur construit la liste d’outils OpenClaw et la transmet à la tentative préparée.
Lorsqu’un harnais exécute un appel d’outil dynamique, renvoyez le résultat de l’outil via
la forme de résultat du harnais au lieu d’envoyer vous-même le média au canal.

Cela maintient les sorties texte, image, vidéo, musique, TTS, approbation et outils de messagerie
sur le même chemin de livraison que les exécutions adossées à OpenClaw.

## Limitations actuelles

- Le chemin d’import public est générique, mais certains alias de types tentative/résultat portent encore
  des noms hérités pour la compatibilité.
- L’installation de harnais tiers est expérimentale. Préférez les plugins de fournisseurs
  jusqu’à ce que vous ayez besoin d’un runtime de session natif.
- Le changement de harnais est pris en charge entre les tours. Ne changez pas de harnais au
  milieu d’un tour après le démarrage des outils natifs, des approbations, du texte assistant ou des
  envois de messages.

## Connexe

- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview)
- [Assistants de runtime](/fr/plugins/sdk-runtime)
- [Plugins de fournisseurs](/fr/plugins/sdk-provider-plugins)
- [Harnais Codex](/fr/plugins/codex-harness)
- [Fournisseurs de modèles](/fr/concepts/model-providers)
