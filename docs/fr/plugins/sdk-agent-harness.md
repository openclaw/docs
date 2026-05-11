---
read_when:
    - Vous modifiez l’environnement d’exécution d’agent intégré ou le registre des harnais
    - Vous enregistrez un harnais d’agent provenant d’un Plugin intégré ou de confiance
    - Vous devez comprendre le lien entre le Plugin Codex et les fournisseurs de modèles
sidebarTitle: Agent Harness
summary: Surface SDK expérimentale pour les plugins qui remplacent l’exécuteur d’agent intégré de bas niveau
title: Plugins de harnais d’agent
x-i18n:
    generated_at: "2026-05-11T20:48:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1685af479a8502ac743b0f520f0afae2cdc905524e48b3a84ce95ffe85c8fb49
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Un **harnais d’agent** est l’exécuteur de bas niveau pour un tour
d’agent OpenClaw préparé. Ce n’est pas un fournisseur de modèle, ni un canal,
ni un registre d’outils. Pour le modèle mental destiné aux utilisateurs, voir
[Runtimes d’agent](/fr/concepts/agent-runtimes).

Utilisez cette surface uniquement pour des plugins natifs intégrés ou fiables.
Le contrat reste expérimental, car les types de paramètres reflètent
intentionnellement l’exécuteur intégré actuel.

## Quand utiliser un harnais

Enregistrez un harnais d’agent lorsqu’une famille de modèles possède son propre
runtime de session natif et que le transport de fournisseur OpenClaw normal
n’est pas la bonne abstraction.

Exemples :

- un serveur natif d’agent de codage qui possède les fils et la compaction
- une CLI ou un démon local qui doit diffuser des événements natifs de
  plan/raisonnement/outils
- un runtime de modèle qui a besoin de son propre identifiant de reprise en plus
  de la transcription de session OpenClaw

N’enregistrez **pas** un harnais uniquement pour ajouter une nouvelle API de LLM.
Pour les API de modèle HTTP ou WebSocket normales, créez un
[plugin de fournisseur](/fr/plugins/sdk-provider-plugins).

## Ce que le noyau possède encore

Avant qu’un harnais soit sélectionné, OpenClaw a déjà résolu :

- le fournisseur et le modèle
- l’état d’authentification du runtime
- le niveau de réflexion et le budget de contexte
- le fichier de transcription/session OpenClaw
- l’espace de travail, le bac à sable et la politique d’outils
- les rappels de réponse du canal et les rappels de diffusion
- la politique de solution de repli de modèle et de changement de modèle en direct

Cette séparation est intentionnelle. Un harnais exécute une tentative préparée ;
il ne choisit pas les fournisseurs, ne remplace pas la livraison par canal et ne
change pas silencieusement de modèle.

La tentative préparée inclut aussi `params.runtimePlan`, un lot de politiques
possédé par OpenClaw pour les décisions de runtime qui doivent rester partagées
entre les harnais PI et natifs :

- `runtimePlan.tools.normalize(...)` et
  `runtimePlan.tools.logDiagnostics(...)` pour la politique de schéma d’outils
  tenant compte du fournisseur
- `runtimePlan.transcript.resolvePolicy(...)` pour l’assainissement de la
  transcription et la politique de réparation des appels d’outils
- `runtimePlan.delivery.isSilentPayload(...)` pour la suppression partagée de
  livraison `NO_REPLY` et de médias
- `runtimePlan.outcome.classifyRunResult(...)` pour la classification de la
  solution de repli de modèle
- `runtimePlan.observability` pour les métadonnées résolues de
  fournisseur/modèle/harnais

Les harnais peuvent utiliser le plan pour les décisions qui doivent correspondre
au comportement PI, mais doivent tout de même le traiter comme un état de
tentative possédé par l’hôte. Ne le modifiez pas et ne l’utilisez pas pour
changer de fournisseur/modèle pendant un tour.

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
4. Si aucun harnais enregistré ne correspond, OpenClaw utilise PI, sauf si la
   solution de repli PI est désactivée.

Les échecs de harnais de plugin apparaissent comme des échecs d’exécution. En
mode `auto`, la solution de repli PI n’est utilisée que lorsqu’aucun harnais de
plugin enregistré ne prend en charge le fournisseur/modèle résolu. Une fois
qu’un harnais de plugin a revendiqué une exécution, OpenClaw ne rejoue pas ce
même tour via PI, car cela peut modifier la sémantique
d’authentification/runtime ou dupliquer des effets de bord.

Les épingles de runtime pour toute la session et tout l’agent sont ignorées par
la sélection. Cela inclut les valeurs `agentHarnessId` de session obsolètes,
`agents.defaults.agentRuntime`, `agents.list[].agentRuntime` et
`OPENCLAW_AGENT_RUNTIME`. `/status` affiche le runtime effectif sélectionné à
partir de la route fournisseur/modèle.
Si le harnais sélectionné est surprenant, activez la journalisation de débogage
`agents/harness` et inspectez l’enregistrement structuré `agent harness selected`
du Gateway. Il inclut l’identifiant du harnais sélectionné, la raison de
sélection, la politique de runtime/solution de repli et, en mode `auto`, le
résultat de prise en charge de chaque plugin candidat.

Le plugin Codex intégré enregistre `codex` comme identifiant de harnais. Le noyau
le traite comme un identifiant ordinaire de harnais de plugin ; les alias
spécifiques à Codex relèvent du plugin ou de la configuration opérateur, pas du
sélecteur de runtime partagé.

## Association fournisseur et harnais

La plupart des harnais devraient aussi enregistrer un fournisseur. Le fournisseur
rend les références de modèle, l’état d’authentification, les métadonnées de
modèle et la sélection `/model` visibles pour le reste d’OpenClaw. Le harnais
revendique ensuite ce fournisseur dans `supports(...)`.

Le plugin Codex intégré suit ce modèle :

- références de modèle utilisateur préférées : `openai/gpt-5.5`
- références de compatibilité : les références héritées `codex/gpt-*` restent
  acceptées, mais les nouvelles configurations ne devraient pas les utiliser
  comme références fournisseur/modèle normales
- identifiant de harnais : `codex`
- authentification : disponibilité synthétique du fournisseur, car le harnais
  Codex possède la connexion/session Codex native
- requête au serveur d’application : OpenClaw envoie l’identifiant de modèle nu à
  Codex et laisse le harnais communiquer avec le protocole natif du serveur
  d’application

Le plugin Codex est additif. Les références d’agent `openai/gpt-*` simples sur
le fournisseur OpenAI officiel sélectionnent le harnais Codex par défaut. Les
anciennes références `codex/gpt-*` sélectionnent toujours le fournisseur et le
harnais Codex pour compatibilité.

Pour la configuration opérateur, les exemples de préfixes de modèle et les
configurations propres à Codex, voir
[Harnais Codex](/fr/plugins/codex-harness).

OpenClaw requiert le serveur d’application Codex `0.125.0` ou plus récent. Le
plugin Codex vérifie l’échange d’initialisation du serveur d’application et
bloque les serveurs plus anciens ou sans version, afin qu’OpenClaw ne s’exécute
que contre la surface de protocole avec laquelle il a été testé. Le plancher
`0.125.0` inclut la prise en charge de la charge utile native du hook MCP arrivée
dans Codex `0.124.0`, tout en épinglant OpenClaw sur la ligne stable plus récente
testée.

### Intergiciel de résultats d’outils

Les plugins intégrés peuvent attacher un intergiciel de résultats d’outils neutre
vis-à-vis du runtime via `api.registerAgentToolResultMiddleware(...)` lorsque
leur manifeste déclare les identifiants de runtime ciblés dans
`contracts.agentToolResultMiddleware`. Cette jointure fiable est destinée aux
transformations asynchrones de résultats d’outils qui doivent s’exécuter avant
que PI ou Codex renvoie la sortie d’outil au modèle.

Les plugins intégrés hérités peuvent encore utiliser
`api.registerCodexAppServerExtensionFactory(...)` pour l’intergiciel propre au
serveur d’application Codex, mais les nouvelles transformations de résultats
devraient utiliser l’API neutre vis-à-vis du runtime.
Le hook propre à Pi `api.registerEmbeddedExtensionFactory(...)` a été supprimé ;
les transformations de résultats d’outils Pi doivent utiliser l’intergiciel
neutre vis-à-vis du runtime.

### Classification du résultat terminal

Les harnais natifs qui possèdent leur propre projection de protocole peuvent
utiliser `classifyAgentHarnessTerminalOutcome(...)` depuis
`openclaw/plugin-sdk/agent-harness-runtime` lorsqu’un tour terminé n’a produit
aucun texte d’assistant visible. L’assistant renvoie `empty`, `reasoning-only` ou
`planning-only` afin que la politique de solution de repli d’OpenClaw puisse
décider s’il faut réessayer sur un autre modèle. Il laisse intentionnellement
non classés les erreurs de prompt, les tours en cours et les réponses
silencieuses intentionnelles telles que `NO_REPLY`.

### Mode de harnais Codex natif

Le harnais intégré `codex` est le mode Codex natif pour les tours d’agent
OpenClaw intégrés. Activez d’abord le plugin intégré `codex`, et incluez `codex`
dans `plugins.allow` si votre configuration utilise une liste d’autorisation
restrictive. Les configurations de serveur d’application natif devraient utiliser
`openai/gpt-*` ; les tours d’agent OpenAI sélectionnent le harnais Codex par
défaut. Les routes héritées `openai-codex/*` devraient être réparées avec
`openclaw doctor --fix`, et les références de modèle héritées `codex/*` restent
des alias de compatibilité pour le harnais natif.

Lorsque ce mode s’exécute, Codex possède l’identifiant de fil natif, le
comportement de reprise, la compaction et l’exécution du serveur d’application.
OpenClaw possède toujours le canal de chat, le miroir de transcription visible,
la politique d’outils, les approbations, la livraison des médias et la sélection
de session. Utilisez le fournisseur/modèle `agentRuntime.id: "codex"` lorsque
vous devez prouver que seul le chemin du serveur d’application Codex peut
revendiquer l’exécution. Les runtimes de plugin explicites échouent de manière
fermée ; les échecs de sélection du serveur d’application Codex et les échecs de
runtime ne sont pas réessayés via PI.

## Rigueur du runtime

Par défaut, OpenClaw utilise la politique de runtime fournisseur/modèle `auto` :
les harnais de plugin enregistrés peuvent revendiquer une paire
fournisseur/modèle, et PI gère le tour lorsqu’aucun ne correspond. Les références
d’agent OpenAI sur le fournisseur OpenAI officiel utilisent Codex par défaut.
Utilisez un runtime de plugin fournisseur/modèle explicite tel que
`agentRuntime.id: "codex"` lorsque l’absence de sélection de harnais devrait
échouer au lieu d’être routée via PI. Les échecs de harnais de plugin sélectionné
échouent toujours durement. Cela ne bloque pas un fournisseur/modèle explicite
`agentRuntime.id: "pi"`.

Pour les exécutions intégrées propres à Codex :

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

Si vous voulez un backend CLI pour un modèle canonique, placez le runtime sur
cette entrée de modèle :

```json
{
  "agents": {
    "defaults": {
      "model": "anthropic/claude-opus-4-7",
      "models": {
        "anthropic/claude-opus-4-7": {
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

Les exemples de runtime hérités pour tout l’agent comme celui-ci sont ignorés :

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

Avec un runtime de plugin explicite, une session échoue tôt lorsque le harnais
demandé n’est pas enregistré, ne prend pas en charge le fournisseur/modèle
résolu, ou échoue avant de produire des effets de bord du tour. C’est
intentionnel pour les déploiements propres à Codex et pour les tests en direct
qui doivent prouver que le chemin du serveur d’application Codex est réellement
utilisé.

Ce paramètre contrôle uniquement le harnais d’agent intégré. Il ne désactive pas
le routage de modèles propre au fournisseur pour l’image, la vidéo, la musique,
la TTS, les PDF ou autre.

## Sessions natives et miroir de transcription

Un harnais peut conserver un identifiant de session natif, un identifiant de fil
ou un jeton de reprise côté démon. Gardez cette liaison explicitement associée à
la session OpenClaw, et continuez à refléter la sortie assistant/outil visible
par l’utilisateur dans la transcription OpenClaw.

La transcription OpenClaw reste la couche de compatibilité pour :

- l’historique de session visible par le canal
- la recherche et l’indexation de transcriptions
- le retour au harnais PI intégré lors d’un tour ultérieur
- le comportement générique de `/new`, `/reset` et de suppression de session

Si votre harnais stocke une liaison annexe, implémentez `reset(...)` afin
qu’OpenClaw puisse l’effacer lorsque la session OpenClaw propriétaire est
réinitialisée.

## Résultats d’outils et de médias

Le noyau construit la liste d’outils OpenClaw et la transmet à la tentative
préparée. Lorsqu’un harnais exécute un appel d’outil dynamique, renvoyez le
résultat de l’outil via la forme de résultat du harnais au lieu d’envoyer vous-même
des médias de canal.

Cela maintient les sorties de texte, image, vidéo, musique, TTS, approbation et
outil de messagerie sur le même chemin de livraison que les exécutions adossées à
PI.

## Limitations actuelles

- Le chemin d’importation public est générique, mais certains alias de types de
  tentative/résultat portent encore des noms `Pi` pour compatibilité.
- L’installation de harnais tiers est expérimentale. Préférez les plugins de
  fournisseur jusqu’à ce que vous ayez besoin d’un runtime de session natif.
- Le changement de harnais est pris en charge entre les tours. Ne changez pas de
  harnais au milieu d’un tour après que les outils natifs, les approbations, le
  texte d’assistant ou les envois de messages ont commencé.

## Connexe

- [Présentation du SDK](/fr/plugins/sdk-overview)
- [Assistants d’exécution](/fr/plugins/sdk-runtime)
- [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins)
- [Harnais Codex](/fr/plugins/codex-harness)
- [Fournisseurs de modèles](/fr/concepts/model-providers)
