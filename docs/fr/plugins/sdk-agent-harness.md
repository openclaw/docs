---
read_when:
    - Vous modifiez l’environnement d’exécution d’agent intégré ou le registre des harnais
    - Vous enregistrez un harnais d’agent à partir d’un Plugin intégré ou de confiance.
    - Vous devez comprendre comment le Plugin Codex s’articule avec les fournisseurs de modèles
sidebarTitle: Agent Harness
summary: Surface SDK expérimentale pour les Plugins qui remplacent l’exécuteur d’agent intégré de bas niveau
title: Plugins du harnais d’agent
x-i18n:
    generated_at: "2026-05-03T07:15:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: ed416bbb433fc502c60fd8c24d20cd0f862d45472ff2eb0e2484b256b58f1b35
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Un **harnais d’agent** est l’exécuteur de bas niveau pour un tour préparé d’agent OpenClaw. Ce n’est pas un fournisseur de modèle, ni un canal, ni un registre d’outils.
Pour le modèle mental destiné aux utilisateurs, consultez [Runtimes d’agent](/fr/concepts/agent-runtimes).

Utilisez cette surface uniquement pour des plugins natifs groupés ou de confiance. Le contrat est encore expérimental, car les types de paramètres reflètent volontairement l’exécuteur intégré actuel.

## Quand utiliser un harnais

Enregistrez un harnais d’agent lorsqu’une famille de modèles dispose de son propre runtime de session natif et que le transport de fournisseur OpenClaw normal n’est pas la bonne abstraction.

Exemples :

- un serveur natif d’agent de codage qui possède les fils de discussion et la compaction
- une CLI locale ou un démon qui doit diffuser des événements natifs de plan, raisonnement et outils
- un runtime de modèle qui a besoin de son propre identifiant de reprise en plus de la transcription de session OpenClaw

N’enregistrez **pas** un harnais uniquement pour ajouter une nouvelle API LLM. Pour les API de modèle HTTP ou WebSocket normales, créez un [plugin de fournisseur](/fr/plugins/sdk-provider-plugins).

## Ce que le cœur possède toujours

Avant qu’un harnais soit sélectionné, OpenClaw a déjà résolu :

- fournisseur et modèle
- état d’authentification du runtime
- niveau de réflexion et budget de contexte
- fichier de transcription/session OpenClaw
- espace de travail, sandbox et politique d’outils
- rappels de réponse de canal et rappels de diffusion
- politique de bascule de modèle et de changement de modèle en direct

Cette séparation est intentionnelle. Un harnais exécute une tentative préparée ; il ne choisit pas les fournisseurs, ne remplace pas la livraison au canal et ne change pas silencieusement de modèle.

La tentative préparée inclut également `params.runtimePlan`, un ensemble de politiques appartenant à OpenClaw pour les décisions de runtime qui doivent rester partagées entre PI et les harnais natifs :

- `runtimePlan.tools.normalize(...)` et
  `runtimePlan.tools.logDiagnostics(...)` pour la politique de schéma d’outils tenant compte du fournisseur
- `runtimePlan.transcript.resolvePolicy(...)` pour la politique de nettoyage de transcription et de réparation des appels d’outils
- `runtimePlan.delivery.isSilentPayload(...)` pour la suppression partagée de `NO_REPLY` et de la livraison de médias
- `runtimePlan.outcome.classifyRunResult(...)` pour la classification de bascule de modèle
- `runtimePlan.observability` pour les métadonnées résolues de fournisseur, modèle et harnais

Les harnais peuvent utiliser le plan pour les décisions qui doivent correspondre au comportement de PI, mais doivent toujours le traiter comme un état de tentative appartenant à l’hôte. Ne le modifiez pas et ne l’utilisez pas pour changer de fournisseurs ou de modèles au sein d’un tour.

## Enregistrer un harnais

**Import :** `openclaw/plugin-sdk/agent-harness`

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

OpenClaw choisit un harnais après la résolution du fournisseur et du modèle :

1. L’identifiant de harnais enregistré pour une session existante prévaut, afin que les changements de configuration ou d’environnement ne basculent pas à chaud cette transcription vers un autre runtime.
2. `OPENCLAW_AGENT_RUNTIME=<id>` force un harnais enregistré avec cet identifiant pour les sessions qui ne sont pas déjà épinglées.
3. `OPENCLAW_AGENT_RUNTIME=pi` force le harnais PI intégré.
4. `OPENCLAW_AGENT_RUNTIME=auto` demande aux harnais enregistrés s’ils prennent en charge le fournisseur/modèle résolu.
5. Si aucun harnais enregistré ne correspond, OpenClaw utilise PI, sauf si la bascule vers PI est désactivée.

Les échecs de harnais de plugin apparaissent comme des échecs d’exécution. En mode `auto`, la bascule vers PI n’est utilisée que lorsqu’aucun harnais de plugin enregistré ne prend en charge le fournisseur/modèle résolu. Une fois qu’un harnais de plugin a revendiqué une exécution, OpenClaw ne rejoue pas ce même tour via PI, car cela peut modifier la sémantique d’authentification/runtime ou dupliquer des effets de bord.

L’identifiant du harnais sélectionné est conservé avec l’identifiant de session après une exécution intégrée. Les sessions héritées créées avant les épingles de harnais sont traitées comme épinglées à PI dès qu’elles ont un historique de transcription. Utilisez une session nouvelle/réinitialisée lorsque vous changez entre PI et un harnais de plugin natif. `/status` affiche les identifiants de harnais non par défaut, tels que `codex`, à côté de `Fast` ; PI reste masqué, car il s’agit du chemin de compatibilité par défaut.
Si le harnais sélectionné est surprenant, activez la journalisation de débogage `agents/harness` et inspectez l’enregistrement structuré `agent harness selected` du Gateway. Il inclut l’identifiant du harnais sélectionné, la raison de sélection, la politique de runtime/bascule et, en mode `auto`, le résultat de prise en charge de chaque candidat plugin.

Le plugin Codex groupé enregistre `codex` comme identifiant de harnais. Le cœur traite cela comme un identifiant de harnais de plugin ordinaire ; les alias propres à Codex appartiennent au plugin ou à la configuration de l’opérateur, pas au sélecteur de runtime partagé.

## Association fournisseur plus harnais

La plupart des harnais devraient également enregistrer un fournisseur. Le fournisseur rend les références de modèles, l’état d’authentification, les métadonnées de modèle et la sélection `/model` visibles pour le reste d’OpenClaw. Le harnais revendique ensuite ce fournisseur dans `supports(...)`.

Le plugin Codex groupé suit ce modèle :

- références de modèle utilisateur préférées : `openai/gpt-5.5` plus
  `agentRuntime.id: "codex"`
- références de compatibilité : les références héritées `codex/gpt-*` restent acceptées, mais les nouvelles configurations ne doivent pas les utiliser comme références fournisseur/modèle normales
- identifiant de harnais : `codex`
- auth : disponibilité de fournisseur synthétique, car le harnais Codex possède la connexion/session native Codex
- requête au serveur d’application : OpenClaw envoie l’identifiant de modèle brut à Codex et laisse le harnais parler au protocole natif du serveur d’application

Le plugin Codex est additif. Les références `openai/gpt-*` simples continuent d’utiliser le chemin de fournisseur OpenClaw normal, sauf si vous forcez le harnais Codex avec `agentRuntime.id: "codex"`. Les anciennes références `codex/gpt-*` sélectionnent toujours le fournisseur et le harnais Codex pour la compatibilité.

Pour la configuration opérateur, les exemples de préfixes de modèles et les configurations propres à Codex, consultez [Harnais Codex](/fr/plugins/codex-harness).

OpenClaw nécessite le serveur d’application Codex `0.125.0` ou plus récent. Le plugin Codex vérifie la négociation d’initialisation du serveur d’application et bloque les serveurs plus anciens ou non versionnés, afin qu’OpenClaw ne s’exécute que sur la surface de protocole avec laquelle il a été testé. Le plancher `0.125.0` inclut la prise en charge native des charges utiles de hook MCP arrivée dans Codex `0.124.0`, tout en épinglant OpenClaw à la ligne stable testée plus récente.

### Intergiciel de résultat d’outil

Les plugins groupés peuvent attacher un intergiciel de résultat d’outil indépendant du runtime via `api.registerAgentToolResultMiddleware(...)` lorsque leur manifeste déclare les identifiants de runtime ciblés dans `contracts.agentToolResultMiddleware`. Cette jonction de confiance est destinée aux transformations asynchrones de résultats d’outils qui doivent s’exécuter avant que PI ou Codex ne renvoie la sortie d’outil au modèle.

Les plugins groupés hérités peuvent toujours utiliser `api.registerCodexAppServerExtensionFactory(...)` pour l’intergiciel propre au serveur d’application Codex, mais les nouvelles transformations de résultats doivent utiliser l’API indépendante du runtime.
Le hook `api.registerEmbeddedExtensionFactory(...)` propre à Pi a été supprimé ; les transformations de résultats d’outils Pi doivent utiliser l’intergiciel indépendant du runtime.

### Classification du résultat terminal

Les harnais natifs qui possèdent leur propre projection de protocole peuvent utiliser `classifyAgentHarnessTerminalOutcome(...)` depuis `openclaw/plugin-sdk/agent-harness-runtime` lorsqu’un tour terminé n’a produit aucun texte d’assistant visible. L’assistant renvoie `empty`, `reasoning-only` ou `planning-only`, afin que la politique de bascule d’OpenClaw puisse décider s’il faut réessayer sur un autre modèle. Il laisse volontairement non classés les erreurs de prompt, les tours en cours et les réponses silencieuses intentionnelles telles que `NO_REPLY`.

### Mode harnais Codex natif

Le harnais groupé `codex` est le mode Codex natif pour les tours d’agent OpenClaw intégrés. Activez d’abord le plugin groupé `codex`, et incluez `codex` dans `plugins.allow` si votre configuration utilise une liste d’autorisation restrictive. Les configurations de serveur d’application natives doivent utiliser `openai/gpt-*` avec `agentRuntime.id: "codex"`.
Utilisez `openai-codex/*` pour OAuth Codex via PI à la place. Les références de modèle héritées `codex/*` restent des alias de compatibilité pour le harnais natif.

Lorsque ce mode s’exécute, Codex possède l’identifiant de fil natif, le comportement de reprise, la compaction et l’exécution du serveur d’application. OpenClaw possède toujours le canal de discussion, le miroir de transcription visible, la politique d’outils, les approbations, la livraison de médias et la sélection de session. Utilisez `agentRuntime.id: "codex"` lorsque vous devez prouver que seul le chemin du serveur d’application Codex peut revendiquer l’exécution. Les runtimes de plugin explicites échouent de manière fermée ; les échecs de sélection du serveur d’application Codex et les échecs de runtime ne sont pas réessayés via PI.

## Rigueur du runtime

Par défaut, OpenClaw exécute les agents intégrés avec OpenClaw Pi. En mode `auto`, les harnais de plugin enregistrés peuvent revendiquer une paire fournisseur/modèle, et PI gère le tour lorsqu’aucun ne correspond. Utilisez un runtime de plugin explicite tel que `agentRuntime.id: "codex"` lorsque l’absence de sélection de harnais doit échouer au lieu d’être routée via PI. Les échecs de harnais de plugin sélectionnés échouent toujours durement. Cela ne bloque pas un `agentRuntime.id: "pi"` explicite ni `OPENCLAW_AGENT_RUNTIME=pi`.

Pour les exécutions intégrées propres à Codex :

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

Si vous voulez que n’importe quel harnais de plugin enregistré revendique les modèles correspondants et utilise sinon PI, définissez `id: "auto"` :

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

Avec un runtime de plugin explicite, une session échoue tôt lorsque le harnais demandé n’est pas enregistré, ne prend pas en charge le fournisseur/modèle résolu ou échoue avant de produire des effets de bord de tour. C’est intentionnel pour les déploiements propres à Codex et pour les tests en direct qui doivent prouver que le chemin du serveur d’application Codex est réellement utilisé.

Ce réglage contrôle uniquement le harnais d’agent intégré. Il ne désactive pas le routage propre au fournisseur pour les modèles d’image, vidéo, musique, TTS, PDF ou autres.

## Sessions natives et miroir de transcription

Un harnais peut conserver un identifiant de session natif, un identifiant de fil ou un jeton de reprise côté démon. Gardez explicitement cette liaison associée à la session OpenClaw, et continuez à refléter la sortie assistant/outil visible par l’utilisateur dans la transcription OpenClaw.

La transcription OpenClaw reste la couche de compatibilité pour :

- l’historique de session visible par le canal
- la recherche et l’indexation de transcription
- le retour au harnais PI intégré lors d’un tour ultérieur
- le comportement générique de `/new`, `/reset` et de suppression de session

Si votre harnais stocke une liaison auxiliaire, implémentez `reset(...)` afin qu’OpenClaw puisse l’effacer lorsque la session OpenClaw propriétaire est réinitialisée.

## Résultats d’outils et de médias

Le cœur construit la liste d’outils OpenClaw et la transmet à la tentative préparée. Lorsqu’un harnais exécute un appel d’outil dynamique, renvoyez le résultat d’outil via la forme de résultat du harnais au lieu d’envoyer vous-même le média au canal.

Cela maintient les sorties texte, image, vidéo, musique, TTS, approbation et outil de messagerie sur le même chemin de livraison que les exécutions appuyées par PI.

## Limites actuelles

- Le chemin d’importation public est générique, mais certains alias de types tentative/résultat
  portent encore des noms `Pi` pour compatibilité.
- L’installation d’un harnais tiers est expérimentale. Préférez les Plugins de fournisseur
  jusqu’à ce que vous ayez besoin d’un runtime de session natif.
- Le changement de harnais est pris en charge d’un tour à l’autre. Ne changez pas de harnais au
  milieu d’un tour après le démarrage des outils natifs, des approbations, du texte de l’assistant ou des
  envois de messages.

## Associés

- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview)
- [Assistants d’exécution](/fr/plugins/sdk-runtime)
- [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins)
- [Harnais Codex](/fr/plugins/codex-harness)
- [Fournisseurs de modèles](/fr/concepts/model-providers)
