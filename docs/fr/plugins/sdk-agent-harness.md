---
read_when:
    - Vous modifiez l’environnement d’exécution de l’agent intégré ou le registre du harnais
    - Vous enregistrez un harnais d’agent depuis un Plugin intégré ou de confiance
    - Vous devez comprendre comment le Plugin Codex s’articule avec les fournisseurs de modèles
sidebarTitle: Agent Harness
summary: Surface SDK expérimentale pour les plugins qui remplacent l’exécuteur d’agent intégré de bas niveau
title: Plugins du harnais d’agent
x-i18n:
    generated_at: "2026-05-07T13:23:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: ab47fbedbd429a4c0e72da0057a88be34528b69804fa1e7af795f377c4907f55
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Un **harness d’agent** est l’exécuteur de bas niveau pour un tour d’agent OpenClaw
préparé. Ce n’est pas un fournisseur de modèle, ni un canal, ni un registre d’outils.
Pour le modèle mental destiné à l’utilisateur, consultez [Runtimes d’agent](/fr/concepts/agent-runtimes).

N’utilisez cette surface que pour des plugins natifs groupés ou de confiance. Le contrat est
encore expérimental, car les types de paramètres reflètent volontairement le runner
embarqué actuel.

## Quand utiliser un harness

Enregistrez un harness d’agent lorsqu’une famille de modèles possède son propre runtime
de session natif et que le transport fournisseur OpenClaw normal n’est pas la bonne abstraction.

Exemples :

- un serveur natif d’agent de code qui possède les fils et la compaction
- une CLI ou un démon local qui doit diffuser des événements natifs de plan/raisonnement/outil
- un runtime de modèle qui a besoin de son propre identifiant de reprise en plus de la
  transcription de session OpenClaw

Ne **pas** enregistrer un harness uniquement pour ajouter une nouvelle API LLM. Pour les API de modèle HTTP ou
WebSocket normales, créez un [plugin fournisseur](/fr/plugins/sdk-provider-plugins).

## Ce que le cœur possède toujours

Avant qu’un harness soit sélectionné, OpenClaw a déjà résolu :

- le fournisseur et le modèle
- l’état d’authentification du runtime
- le niveau de réflexion et le budget de contexte
- le fichier de transcription/session OpenClaw
- l’espace de travail, le sandbox et la politique d’outils
- les rappels de réponse de canal et les rappels de streaming
- la politique de fallback de modèle et de changement de modèle en direct

Cette séparation est intentionnelle. Un harness exécute une tentative préparée ; il ne choisit pas
les fournisseurs, ne remplace pas la livraison au canal et ne change pas silencieusement de modèles.

La tentative préparée inclut aussi `params.runtimePlan`, un paquet de politiques possédé par OpenClaw
pour les décisions de runtime qui doivent rester partagées entre PI et les harness natifs :

- `runtimePlan.tools.normalize(...)` et
  `runtimePlan.tools.logDiagnostics(...)` pour la politique de schéma d’outil tenant compte du fournisseur
- `runtimePlan.transcript.resolvePolicy(...)` pour l’assainissement de la transcription et
  la politique de réparation des appels d’outils
- `runtimePlan.delivery.isSilentPayload(...)` pour la suppression partagée de `NO_REPLY` et de la livraison
  de médias
- `runtimePlan.outcome.classifyRunResult(...)` pour la classification du fallback de modèle
- `runtimePlan.observability` pour les métadonnées résolues de fournisseur/modèle/harness

Les harness peuvent utiliser le plan pour les décisions qui doivent correspondre au comportement de PI, mais
doivent quand même le traiter comme un état de tentative possédé par l’hôte. Ne le modifiez pas et ne l’utilisez pas pour
changer de fournisseurs/modèles à l’intérieur d’un tour.

## Enregistrer un harness

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

OpenClaw choisit un harness après la résolution du fournisseur/modèle :

1. L’identifiant de harness enregistré d’une session existante l’emporte, afin que les changements de configuration/env ne fassent pas
   basculer à chaud cette transcription vers un autre runtime.
2. `OPENCLAW_AGENT_RUNTIME=<id>` force un harness enregistré portant cet identifiant pour les
   sessions qui ne sont pas déjà épinglées.
3. `OPENCLAW_AGENT_RUNTIME=pi` force le harness PI intégré.
4. `OPENCLAW_AGENT_RUNTIME=auto` demande aux harness enregistrés s’ils prennent en charge le
   fournisseur/modèle résolu.
5. Si aucun harness enregistré ne correspond, OpenClaw utilise PI sauf si le fallback PI est
   désactivé.

Les échecs de harness de plugin apparaissent comme des échecs d’exécution. En mode `auto`, le fallback PI n’est
utilisé que lorsqu’aucun harness de plugin enregistré ne prend en charge le
fournisseur/modèle résolu. Une fois qu’un harness de plugin a revendiqué une exécution, OpenClaw ne
rejoue pas ce même tour via PI, car cela peut modifier la sémantique d’authentification/runtime
ou dupliquer les effets de bord.

L’identifiant de harness sélectionné est conservé avec l’identifiant de session après une exécution embarquée.
Les sessions héritées créées avant les épingles de harness sont traitées comme épinglées à PI dès qu’elles
ont un historique de transcription. Utilisez une session nouvelle/réinitialisée lorsque vous passez de PI à un
harness de plugin natif. `/status` affiche les identifiants de harness non par défaut tels que `codex`
à côté de `Fast` ; PI reste masqué parce qu’il s’agit du chemin de compatibilité par défaut.
Si le harness sélectionné est surprenant, activez la journalisation de débogage `agents/harness` et
inspectez l’enregistrement structuré `agent harness selected` du gateway. Il inclut
l’identifiant du harness sélectionné, la raison de sélection, la politique de runtime/fallback et, en
mode `auto`, le résultat de prise en charge de chaque candidat plugin.

Le plugin Codex groupé enregistre `codex` comme identifiant de harness. Le cœur traite cela
comme un identifiant de harness de plugin ordinaire ; les alias propres à Codex appartiennent au plugin
ou à la configuration opérateur, pas au sélecteur de runtime partagé.

## Association fournisseur et harness

La plupart des harness doivent aussi enregistrer un fournisseur. Le fournisseur rend les références de modèle,
l’état d’authentification, les métadonnées de modèle et la sélection `/model` visibles pour le reste
d’OpenClaw. Le harness revendique ensuite ce fournisseur dans `supports(...)`.

Le plugin Codex groupé suit ce modèle :

- références de modèle utilisateur préférées : `openai/gpt-5.5` plus
  `agentRuntime.id: "codex"`
- références de compatibilité : les références héritées `codex/gpt-*` restent acceptées, mais les nouvelles
  configurations ne doivent pas les utiliser comme références fournisseur/modèle normales
- identifiant de harness : `codex`
- authentification : disponibilité synthétique du fournisseur, car le harness Codex possède la
  connexion/session native Codex
- requête app-server : OpenClaw envoie l’identifiant de modèle brut à Codex et laisse le
  harness parler au protocole app-server natif

Le plugin Codex est additif. Les références `openai/gpt-*` simples continuent d’utiliser le
chemin fournisseur OpenClaw normal sauf si vous forcez le harness Codex avec
`agentRuntime.id: "codex"`. Les anciennes références `codex/gpt-*` sélectionnent toujours le
fournisseur et le harness Codex par compatibilité.

Pour la configuration opérateur, les exemples de préfixe de modèle et les configurations propres à Codex, consultez
[Harness Codex](/fr/plugins/codex-harness).

OpenClaw requiert Codex app-server `0.125.0` ou plus récent. Le plugin Codex vérifie
la poignée de main d’initialisation de l’app-server et bloque les serveurs plus anciens ou non versionnés afin
qu’OpenClaw ne s’exécute que sur la surface de protocole avec laquelle il a été testé. Le
plancher `0.125.0` inclut la prise en charge de la charge utile native du hook MCP arrivée dans
Codex `0.124.0`, tout en épinglant OpenClaw à la ligne stable plus récente testée.

### Middleware de résultats d’outil

Les plugins groupés peuvent attacher un middleware de résultats d’outil neutre vis-à-vis du runtime via
`api.registerAgentToolResultMiddleware(...)` lorsque leur manifeste déclare les
identifiants de runtime ciblés dans `contracts.agentToolResultMiddleware`. Cette couture de confiance
sert aux transformations asynchrones de résultats d’outil qui doivent s’exécuter avant que PI ou Codex ne renvoie
la sortie d’outil au modèle.

Les plugins groupés hérités peuvent encore utiliser
`api.registerCodexAppServerExtensionFactory(...)` pour un middleware réservé au Codex app-server,
mais les nouvelles transformations de résultats doivent utiliser l’API neutre vis-à-vis du runtime.
Le hook réservé à Pi `api.registerEmbeddedExtensionFactory(...)` a été supprimé ;
les transformations de résultats d’outil Pi doivent utiliser le middleware neutre vis-à-vis du runtime.

### Classification du résultat terminal

Les harness natifs qui possèdent leur propre projection de protocole peuvent utiliser
`classifyAgentHarnessTerminalOutcome(...)` depuis
`openclaw/plugin-sdk/agent-harness-runtime` lorsqu’un tour terminé n’a produit aucun
texte d’assistant visible. L’aide renvoie `empty`, `reasoning-only` ou
`planning-only` afin que la politique de fallback d’OpenClaw puisse décider s’il faut réessayer sur un
modèle différent. Elle laisse volontairement non classés les erreurs de prompt, les tours en cours et
les réponses silencieuses intentionnelles telles que `NO_REPLY`.

### Mode harness Codex natif

Le harness `codex` groupé est le mode Codex natif pour les tours d’agent OpenClaw
embarqués. Activez d’abord le plugin `codex` groupé, et incluez `codex` dans
`plugins.allow` si votre configuration utilise une liste d’autorisation restrictive. Les configurations app-server
natives doivent utiliser `openai/gpt-*` ; les tours d’agent OpenAI sélectionnent le harness Codex
par défaut. Les routes héritées `openai-codex/*` doivent être réparées avec
`openclaw doctor --fix`, et les références de modèle héritées `codex/*` restent des alias de compatibilité
pour le harness natif.

Lorsque ce mode s’exécute, Codex possède l’identifiant de fil natif, le comportement de reprise,
la compaction et l’exécution app-server. OpenClaw possède toujours le canal de chat,
le miroir de transcription visible, la politique d’outils, les approbations, la livraison de médias et la sélection
de session. Utilisez `agentRuntime.id: "codex"` lorsque vous devez prouver que seul le
chemin Codex app-server peut revendiquer l’exécution. Les runtimes de plugin explicites échouent fermement ;
les échecs de sélection du Codex app-server et les échecs de runtime ne sont pas réessayés via
PI.

## Rigueur du runtime

Par défaut, OpenClaw exécute les agents embarqués avec OpenClaw Pi. En mode `auto`,
les harness de plugin enregistrés peuvent revendiquer une paire fournisseur/modèle, et PI gère le
tour lorsqu’aucun ne correspond. Utilisez un runtime de plugin explicite tel que
`agentRuntime.id: "codex"` lorsque l’absence de sélection de harness doit échouer au lieu
de router via PI. Les échecs de harness de plugin sélectionné échouent toujours fermement. Cela
ne bloque pas un `agentRuntime.id: "pi"` explicite ni
`OPENCLAW_AGENT_RUNTIME=pi`.

Pour les exécutions embarquées réservées à Codex :

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

Si vous voulez que tout harness de plugin enregistré revendique les modèles correspondants et utilise sinon
PI, définissez `id: "auto"` :

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto"
      }
    }
  }
}
```

Les remplacements par agent utilisent la même forme :

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": { "id": "auto" }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "agentRuntime": { "id": "codex" }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` remplace toujours le runtime configuré.

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Avec un runtime de plugin explicite, une session échoue tôt lorsque le
harness demandé n’est pas enregistré, ne prend pas en charge le fournisseur/modèle résolu, ou
échoue avant de produire des effets de bord de tour. C’est intentionnel pour les déploiements réservés à Codex
et pour les tests en direct qui doivent prouver que le chemin Codex app-server est
effectivement utilisé.

Ce paramètre contrôle uniquement le harness d’agent embarqué. Il ne désactive pas
le routage de modèle propre au fournisseur pour les images, vidéos, la musique, le TTS, les PDF ou autres.

## Sessions natives et miroir de transcription

Un harness peut conserver un identifiant de session natif, un identifiant de fil ou un jeton de reprise côté démon.
Gardez cette liaison explicitement associée à la session OpenClaw, et continuez à
miroiter la sortie assistant/outil visible par l’utilisateur dans la transcription OpenClaw.

La transcription OpenClaw reste la couche de compatibilité pour :

- l’historique de session visible dans le canal
- la recherche et l’indexation de transcription
- le retour au harness PI intégré lors d’un tour ultérieur
- le comportement générique de `/new`, `/reset` et de suppression de session

Si votre harness stocke une liaison annexe, implémentez `reset(...)` afin qu’OpenClaw puisse
l’effacer lorsque la session OpenClaw propriétaire est réinitialisée.

## Résultats d’outils et de médias

Le cœur construit la liste d’outils OpenClaw et la transmet à la tentative préparée.
Lorsqu’un harness exécute un appel d’outil dynamique, renvoyez le résultat de l’outil via
la forme de résultat du harness au lieu d’envoyer vous-même les médias au canal.

Cela maintient les sorties texte, image, vidéo, musique, TTS, approbation et outils de messagerie
sur le même chemin de livraison que les exécutions soutenues par PI.

## Limitations actuelles

- Le chemin d’importation public est générique, mais certains alias de types de tentative/résultat
  conservent encore des noms `Pi` pour des raisons de compatibilité.
- L’installation de harnais tiers est expérimentale. Préférez les plugins de fournisseurs
  jusqu’à ce que vous ayez besoin d’un runtime de session natif.
- Le changement de harnais est pris en charge d’un tour à l’autre. Ne changez pas de harnais au
  milieu d’un tour après le démarrage des outils natifs, des approbations, du texte de l’assistant ou des
  envois de messages.

## Connexe

- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview)
- [Assistants de runtime](/fr/plugins/sdk-runtime)
- [Plugins de fournisseurs](/fr/plugins/sdk-provider-plugins)
- [Harnais Codex](/fr/plugins/codex-harness)
- [Fournisseurs de modèles](/fr/concepts/model-providers)
