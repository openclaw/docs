---
read_when:
    - Vous modifiez le runtime d’agent intégré ou le registre du harnais
    - Vous enregistrez un harnais d’agent à partir d’un Plugin intégré ou de confiance
    - Vous devez comprendre comment le Plugin Codex est lié aux fournisseurs de modèles
sidebarTitle: Agent Harness
summary: Surface expérimentale du SDK pour les plugins qui remplacent l’exécuteur d’agent embarqué de bas niveau
title: Plugins du harnais d’agent
x-i18n:
    generated_at: "2026-05-02T07:15:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: b6e55d2df09c3965e1397be72f19dec2a6ed941ac8b7b01be8eee0f9713400dc
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Un **harnais d’agent** est l’exécuteur de bas niveau pour un tour d’agent OpenClaw préparé. Ce n’est pas un fournisseur de modèle, ni un canal, ni un registre d’outils. Pour le modèle mental destiné aux utilisateurs, consultez [Environnements d’exécution d’agents](/fr/concepts/agent-runtimes).

Utilisez cette surface uniquement pour les plugins natifs groupés ou de confiance. Le contrat est encore expérimental, car les types de paramètres reflètent volontairement l’exécuteur intégré actuel.

## Quand utiliser un harnais

Enregistrez un harnais d’agent lorsqu’une famille de modèles dispose de son propre environnement d’exécution de session natif et que le transport de fournisseur OpenClaw normal n’est pas la bonne abstraction.

Exemples :

- un serveur d’agent de codage natif qui possède les fils et la compaction
- une CLI ou un daemon local qui doit diffuser des événements natifs de plan, de raisonnement et d’outil
- un environnement d’exécution de modèle qui a besoin de son propre identifiant de reprise en plus de la transcription de session OpenClaw

N’enregistrez **pas** un harnais simplement pour ajouter une nouvelle API LLM. Pour les API de modèle HTTP ou WebSocket normales, créez un [plugin de fournisseur](/fr/plugins/sdk-provider-plugins).

## Ce que le cœur possède encore

Avant qu’un harnais soit sélectionné, OpenClaw a déjà résolu :

- le fournisseur et le modèle
- l’état d’authentification de l’environnement d’exécution
- le niveau de réflexion et le budget de contexte
- le fichier de transcription/session OpenClaw
- l’espace de travail, le bac à sable et la politique d’outils
- les rappels de réponse du canal et les rappels de streaming
- la politique de recours à un modèle de repli et de changement de modèle en direct

Cette séparation est intentionnelle. Un harnais exécute une tentative préparée ; il ne choisit pas les fournisseurs, ne remplace pas la livraison au canal et ne change pas silencieusement de modèle.

La tentative préparée inclut aussi `params.runtimePlan`, un ensemble de politiques détenu par OpenClaw pour les décisions d’environnement d’exécution qui doivent rester partagées entre PI et les harnais natifs :

- `runtimePlan.tools.normalize(...)` et
  `runtimePlan.tools.logDiagnostics(...)` pour la politique de schéma d’outil tenant compte du fournisseur
- `runtimePlan.transcript.resolvePolicy(...)` pour la politique de nettoyage de transcription et de réparation des appels d’outils
- `runtimePlan.delivery.isSilentPayload(...)` pour la suppression partagée de livraison `NO_REPLY` et de médias
- `runtimePlan.outcome.classifyRunResult(...)` pour la classification du recours à un modèle de repli
- `runtimePlan.observability` pour les métadonnées résolues de fournisseur, modèle et harnais

Les harnais peuvent utiliser le plan pour les décisions qui doivent correspondre au comportement de PI, mais doivent tout de même le traiter comme un état de tentative détenu par l’hôte. Ne le modifiez pas et ne l’utilisez pas pour changer de fournisseur/modèle pendant un tour.

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

OpenClaw choisit un harnais après la résolution du fournisseur/modèle :

1. L’identifiant de harnais enregistré d’une session existante l’emporte, afin que les changements de configuration/environnement ne basculent pas à chaud cette transcription vers un autre environnement d’exécution.
2. `OPENCLAW_AGENT_RUNTIME=<id>` force un harnais enregistré avec cet identifiant pour les sessions qui ne sont pas déjà épinglées.
3. `OPENCLAW_AGENT_RUNTIME=pi` force le harnais PI intégré.
4. `OPENCLAW_AGENT_RUNTIME=auto` demande aux harnais enregistrés s’ils prennent en charge le fournisseur/modèle résolu.
5. Si aucun harnais enregistré ne correspond, OpenClaw utilise PI sauf si le repli vers PI est désactivé.

Les échecs des harnais de plugin apparaissent comme des échecs d’exécution. En mode `auto`, le repli vers PI n’est utilisé que lorsqu’aucun harnais de plugin enregistré ne prend en charge le fournisseur/modèle résolu. Une fois qu’un harnais de plugin a revendiqué une exécution, OpenClaw ne rejoue pas le même tour via PI, car cela peut modifier la sémantique d’authentification/d’environnement d’exécution ou dupliquer des effets de bord.

L’identifiant du harnais sélectionné est conservé avec l’identifiant de session après une exécution intégrée. Les sessions héritées créées avant les épingles de harnais sont traitées comme épinglées sur PI dès qu’elles ont un historique de transcription. Utilisez une session nouvelle/réinitialisée lorsque vous passez de PI à un harnais de plugin natif, ou inversement. `/status` affiche les identifiants de harnais non par défaut comme `codex` à côté de `Fast` ; PI reste masqué, car il s’agit du chemin de compatibilité par défaut. Si le harnais sélectionné est surprenant, activez la journalisation de débogage `agents/harness` et inspectez l’enregistrement structuré `agent harness selected` du gateway. Il inclut l’identifiant du harnais sélectionné, la raison de sélection, la politique d’environnement d’exécution/de repli et, en mode `auto`, le résultat de prise en charge de chaque candidat de plugin.

Le plugin Codex groupé enregistre `codex` comme identifiant de harnais. Le cœur le traite comme un identifiant de harnais de plugin ordinaire ; les alias propres à Codex appartiennent au plugin ou à la configuration opérateur, pas au sélecteur d’environnement d’exécution partagé.

## Association fournisseur et harnais

La plupart des harnais devraient aussi enregistrer un fournisseur. Le fournisseur rend les références de modèle, l’état d’authentification, les métadonnées de modèle et la sélection `/model` visibles au reste d’OpenClaw. Le harnais revendique ensuite ce fournisseur dans `supports(...)`.

Le plugin Codex groupé suit ce modèle :

- références de modèle utilisateur préférées : `openai/gpt-5.5` plus
  `agentRuntime.id: "codex"`
- références de compatibilité : les anciennes références `codex/gpt-*` restent acceptées, mais les nouvelles configurations ne doivent pas les utiliser comme références fournisseur/modèle normales
- identifiant de harnais : `codex`
- authentification : disponibilité de fournisseur synthétique, car le harnais Codex possède la connexion/session Codex native
- requête app-server : OpenClaw envoie l’identifiant de modèle brut à Codex et laisse le harnais communiquer avec le protocole app-server natif

Le plugin Codex est additif. Les références `openai/gpt-*` simples continuent d’utiliser le chemin de fournisseur OpenClaw normal, sauf si vous forcez le harnais Codex avec `agentRuntime.id: "codex"`. Les anciennes références `codex/gpt-*` sélectionnent encore le fournisseur et le harnais Codex pour compatibilité.

Pour la configuration opérateur, les exemples de préfixes de modèle et les configurations propres à Codex, consultez [Harnais Codex](/fr/plugins/codex-harness).

OpenClaw exige Codex app-server `0.125.0` ou une version plus récente. Le plugin Codex vérifie la poignée de main d’initialisation de l’app-server et bloque les serveurs plus anciens ou sans version, afin qu’OpenClaw ne s’exécute que sur la surface de protocole avec laquelle il a été testé. Le plancher `0.125.0` inclut la prise en charge de charge utile de crochet MCP natif arrivée dans Codex `0.124.0`, tout en épinglant OpenClaw à la ligne stable testée plus récente.

### Middleware de résultat d’outil

Les plugins groupés peuvent attacher un middleware de résultat d’outil neutre vis-à-vis de l’environnement d’exécution via `api.registerAgentToolResultMiddleware(...)` lorsque leur manifeste déclare les identifiants d’environnement d’exécution ciblés dans `contracts.agentToolResultMiddleware`. Cette jonction de confiance sert aux transformations asynchrones de résultats d’outil qui doivent s’exécuter avant que PI ou Codex renvoie la sortie d’outil au modèle.

Les anciens plugins groupés peuvent encore utiliser `api.registerCodexAppServerExtensionFactory(...)` pour le middleware réservé à Codex app-server, mais les nouvelles transformations de résultats doivent utiliser l’API neutre vis-à-vis de l’environnement d’exécution. Le crochet réservé à Pi `api.registerEmbeddedExtensionFactory(...)` a été supprimé ; les transformations de résultats d’outil Pi doivent utiliser le middleware neutre vis-à-vis de l’environnement d’exécution.

### Classification du résultat terminal

Les harnais natifs qui possèdent leur propre projection de protocole peuvent utiliser `classifyAgentHarnessTerminalOutcome(...)` depuis `openclaw/plugin-sdk/agent-harness-runtime` lorsqu’un tour terminé n’a produit aucun texte d’assistant visible. L’assistant renvoie `empty`, `reasoning-only` ou `planning-only` afin que la politique de repli d’OpenClaw puisse décider s’il faut réessayer avec un autre modèle. Il laisse volontairement non classés les erreurs de prompt, les tours en cours et les réponses silencieuses intentionnelles comme `NO_REPLY`.

### Mode harnais Codex natif

Le harnais groupé `codex` est le mode Codex natif pour les tours d’agent OpenClaw intégrés. Activez d’abord le plugin groupé `codex`, et incluez `codex` dans `plugins.allow` si votre configuration utilise une liste d’autorisation restrictive. Les configurations app-server natives doivent utiliser `openai/gpt-*` avec `agentRuntime.id: "codex"`. Utilisez `openai-codex/*` pour OAuth Codex via PI à la place. Les anciennes références de modèle `codex/*` restent des alias de compatibilité pour le harnais natif.

Lorsque ce mode s’exécute, Codex possède l’identifiant de fil natif, le comportement de reprise, la compaction et l’exécution app-server. OpenClaw possède toujours le canal de discussion, le miroir de transcription visible, la politique d’outils, les approbations, la livraison de médias et la sélection de session. Utilisez `agentRuntime.id: "codex"` sans surcharge `fallback` lorsque vous devez prouver que seul le chemin Codex app-server peut revendiquer l’exécution. Les environnements d’exécution de plugin explicites échouent déjà fermés par défaut. Définissez `fallback: "pi"` uniquement lorsque vous voulez intentionnellement que PI gère l’absence de sélection de harnais. Les échecs de Codex app-server échouent déjà directement au lieu de réessayer via PI.

## Désactiver le repli vers PI

Par défaut, OpenClaw exécute les agents intégrés avec `agents.defaults.agentRuntime` défini sur `{ id: "auto", fallback: "pi" }`. En mode `auto`, les harnais de plugin enregistrés peuvent revendiquer une paire fournisseur/modèle. Si aucun ne correspond, OpenClaw se replie vers PI.

En mode `auto`, définissez `fallback: "none"` lorsque vous voulez que l’absence de sélection d’un harnais de plugin échoue au lieu d’utiliser PI. Les environnements d’exécution de plugin explicites comme `agentRuntime.id: "codex"` échouent déjà fermés par défaut, sauf si `fallback: "pi"` est défini dans la même configuration ou la même portée de surcharge d’environnement. Les échecs des harnais de plugin sélectionnés échouent toujours franchement. Cela ne bloque pas un `agentRuntime.id: "pi"` explicite ni `OPENCLAW_AGENT_RUNTIME=pi`.

Pour les exécutions intégrées réservées à Codex :

```json
{
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5",
      "agentRuntime": {
        "id": "codex"
      }
    }
  }
}
```

Si vous voulez que tout harnais de plugin enregistré revendique les modèles correspondants, mais ne voulez jamais qu’OpenClaw se replie silencieusement vers PI, conservez `runtime: "auto"` et désactivez le repli :

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto",
        "fallback": "none"
      }
    }
  }
}
```

Les surcharges par agent utilisent la même forme :

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto",
        "fallback": "pi"
      }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "agentRuntime": {
          "id": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` surcharge toujours l’environnement d’exécution configuré. Utilisez `OPENCLAW_AGENT_HARNESS_FALLBACK=none` pour désactiver le repli vers PI depuis l’environnement.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Avec le repli désactivé, une session échoue tôt lorsque le harnais demandé n’est pas enregistré, ne prend pas en charge le fournisseur/modèle résolu ou échoue avant de produire des effets de bord du tour. C’est intentionnel pour les déploiements réservés à Codex et pour les tests en direct qui doivent prouver que le chemin Codex app-server est réellement utilisé.

Ce paramètre ne contrôle que le harnais d’agent intégré. Il ne désactive pas le routage de modèles propre aux fournisseurs pour les images, les vidéos, la musique, le TTS, les PDF ou autres.

## Sessions natives et miroir de transcription

Un harnais peut conserver un identifiant de session natif, un identifiant de fil ou un jeton de reprise côté daemon. Gardez explicitement cette liaison associée à la session OpenClaw et continuez à refléter la sortie assistant/outil visible par l’utilisateur dans la transcription OpenClaw.

La transcription OpenClaw reste la couche de compatibilité pour :

- l’historique de session visible par le canal
- la recherche et l’indexation de transcription
- le retour au harnais PI intégré lors d’un tour ultérieur
- le comportement générique de `/new`, `/reset` et de suppression de session

Si votre harnais stocke une liaison sidecar, implémentez `reset(...)` afin qu’OpenClaw puisse l’effacer lorsque la session OpenClaw propriétaire est réinitialisée.

## Résultats d’outil et de médias

Core construit la liste d’outils OpenClaw et la transmet à la tentative préparée.
Lorsqu’un harness exécute un appel d’outil dynamique, renvoyez le résultat de l’outil via
la forme de résultat du harness au lieu d’envoyer vous-même des médias de canal.

Cela maintient les sorties de texte, image, vidéo, musique, TTS, approbation et outil de messagerie
sur le même chemin de livraison que les exécutions reposant sur PI.

## Limitations actuelles

- Le chemin d’import public est générique, mais certains alias de types tentative/résultat portent encore
  des noms `Pi` pour des raisons de compatibilité.
- L’installation de harness tiers est expérimentale. Préférez les plugins de fournisseurs
  jusqu’à ce que vous ayez besoin d’un runtime de session natif.
- Le changement de harness est pris en charge entre les tours. Ne changez pas de harness au
  milieu d’un tour après le démarrage des outils natifs, approbations, texte de l’assistant ou envois de messages.

## Connexe

- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview)
- [Assistants runtime](/fr/plugins/sdk-runtime)
- [Plugins de fournisseurs](/fr/plugins/sdk-provider-plugins)
- [Harness Codex](/fr/plugins/codex-harness)
- [Fournisseurs de modèles](/fr/concepts/model-providers)
