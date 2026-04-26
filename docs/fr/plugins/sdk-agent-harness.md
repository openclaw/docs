---
read_when:
    - Vous modifiez le runtime d’agent intégré ou le registre de harnais
    - Vous enregistrez un harnais d’agent depuis un Plugin intégré ou de confiance
    - Vous devez comprendre comment le Plugin Codex se rapporte aux fournisseurs de modèles
sidebarTitle: Agent Harness
summary: Surface SDK expérimentale pour les Plugins qui remplacent l’exécuteur d’agent intégré de bas niveau
title: Plugins de harnais d’agent
x-i18n:
    generated_at: "2026-04-26T11:35:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 340fc6207dabc6ffe7ffb9c07ca9e80e76f1034d4978c41279dc826468302181
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

Un **harnais d’agent** est l’exécuteur de bas niveau pour un tour préparé
d’agent OpenClaw. Ce n’est pas un fournisseur de modèles, pas un canal, et pas un registre d’outils.
Pour le modèle mental visible par l’utilisateur, voir [Runtimes d’agent](/fr/concepts/agent-runtimes).

N’utilisez cette surface que pour des Plugins natifs intégrés ou de confiance. Le contrat reste
encore expérimental parce que les types de paramètres reflètent intentionnellement le runner intégré actuel.

## Quand utiliser un harnais

Enregistrez un harnais d’agent lorsqu’une famille de modèles possède son propre runtime
de session natif et que le transport fournisseur OpenClaw normal est la mauvaise abstraction.

Exemples :

- un serveur d’agent de coding natif qui possède les threads et la Compaction
- une CLI locale ou un daemon qui doit diffuser des événements natifs de plan/reasoning/tool
- un runtime de modèle qui a besoin de son propre id de reprise en plus du
  transcript de session OpenClaw

N’enregistrez **pas** un harnais simplement pour ajouter une nouvelle API LLM. Pour des API de modèles HTTP ou
WebSocket normales, construisez un [Plugin de fournisseur](/fr/plugins/sdk-provider-plugins).

## Ce que le noyau possède toujours

Avant qu’un harnais soit sélectionné, OpenClaw a déjà résolu :

- le fournisseur et le modèle
- l’état d’authentification d’exécution
- le niveau de thinking et le budget de contexte
- le fichier de transcript/session OpenClaw
- l’espace de travail, le sandbox, et la politique d’outils
- les callbacks de réponse de canal et de streaming
- la politique de repli de modèle et de changement de modèle en direct

Cette séparation est intentionnelle. Un harnais exécute une tentative préparée ; il ne choisit
pas les fournisseurs, ne remplace pas la livraison du canal, et ne change pas silencieusement de modèle.

La tentative préparée inclut aussi `params.runtimePlan`, un bundle de politique possédé par OpenClaw pour les décisions d’exécution qui doivent rester partagées entre PI et les harnais natifs :

- `runtimePlan.tools.normalize(...)` et
  `runtimePlan.tools.logDiagnostics(...)` pour la politique de schéma d’outils tenant compte du fournisseur
- `runtimePlan.transcript.resolvePolicy(...)` pour la politique d’assainissement du transcript et
  de réparation d’appel d’outil
- `runtimePlan.delivery.isSilentPayload(...)` pour la suppression partagée `NO_REPLY` et de
  livraison média
- `runtimePlan.outcome.classifyRunResult(...)` pour la classification du repli de modèle
- `runtimePlan.observability` pour les métadonnées résolues fournisseur/modèle/harnais

Les harnais peuvent utiliser le plan pour des décisions qui doivent correspondre au comportement PI, mais
doivent toujours le traiter comme un état de tentative possédé par l’hôte. Ne le modifiez pas et ne l’utilisez pas pour changer de fournisseur/modèle à l’intérieur d’un tour.

## Enregistrer un harnais

**Import :** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "Mon harnais d’agent natif",

  supports(ctx) {
    return ctx.provider === "my-provider"
      ? { supported: true, priority: 100 }
      : { supported: false };
  },

  async runAttempt(params) {
    // Démarrez ou reprenez votre thread natif.
    // Utilisez params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent, et les autres champs de tentative préparée.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "Mon agent natif",
  description: "Exécute des modèles sélectionnés via un daemon d’agent natif.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

## Politique de sélection

OpenClaw choisit un harnais après la résolution fournisseur/modèle :

1. L’id de harnais enregistré d’une session existante l’emporte, afin que les changements de config/env ne fassent
   pas basculer à chaud ce transcript vers un autre runtime.
2. `OPENCLAW_AGENT_RUNTIME=<id>` force un harnais enregistré avec cet id pour
   les sessions qui ne sont pas déjà épinglées.
3. `OPENCLAW_AGENT_RUNTIME=pi` force le harnais PI intégré.
4. `OPENCLAW_AGENT_RUNTIME=auto` demande aux harnais enregistrés s’ils prennent en charge le
   fournisseur/modèle résolu.
5. Si aucun harnais enregistré ne correspond, OpenClaw utilise PI sauf si le repli PI est
   désactivé.

Les échecs de harnais Plugin apparaissent comme des échecs d’exécution. En mode `auto`, le repli PI n’est
utilisé que lorsqu’aucun harnais Plugin enregistré ne prend en charge le
fournisseur/modèle résolu. Une fois qu’un harnais Plugin a revendiqué une exécution, OpenClaw ne
rejoue pas ce même tour via PI parce que cela peut changer la sémantique auth/runtime
ou dupliquer les effets de bord.

L’id du harnais sélectionné est persisté avec l’id de session après une exécution intégrée.
Les sessions héritées créées avant les épinglages de harnais sont traitées comme épinglées PI une fois
qu’elles ont un historique de transcript. Utilisez une nouvelle session/session réinitialisée lors d’un changement entre PI et un harnais Plugin natif. `/status` affiche les ids de harnais non par défaut tels que `codex`
à côté de `Fast` ; PI reste caché parce qu’il s’agit du chemin de compatibilité par défaut.
Si le harnais sélectionné est surprenant, activez le journal de débogage `agents/harness` et
inspectez l’enregistrement structuré `agent harness selected` de la Gateway. Il inclut
l’id du harnais sélectionné, la raison de sélection, la politique runtime/repli, et, en
mode `auto`, le résultat de prise en charge de chaque candidat Plugin.

Le Plugin Codex intégré enregistre `codex` comme id de harnais. Le noyau traite cela
comme un id de harnais Plugin ordinaire ; les alias spécifiques à Codex relèvent du Plugin
ou de la configuration opérateur, pas du sélecteur de runtime partagé.

## Appairage fournisseur plus harnais

La plupart des harnais devraient aussi enregistrer un fournisseur. Le fournisseur rend les
références de modèle, l’état d’authentification, les métadonnées de modèle, et la sélection `/model`
visibles pour le reste d’OpenClaw. Le harnais revendique ensuite ce fournisseur dans `supports(...)`.

Le Plugin Codex intégré suit ce modèle :

- références de modèle utilisateur préférées : `openai/gpt-5.5` plus
  `agentRuntime.id: "codex"`
- références de compatibilité : les anciennes références `codex/gpt-*` restent acceptées, mais les nouvelles
  configurations ne doivent pas les utiliser comme références normales fournisseur/modèle
- id du harnais : `codex`
- auth : disponibilité synthétique du fournisseur, parce que le harnais Codex possède la
  connexion/session Codex native
- requête app-server : OpenClaw envoie l’id nu du modèle à Codex et laisse le
  harnais parler au protocole app-server natif

Le Plugin Codex est additif. Les références simples `openai/gpt-*` continuent à utiliser le
chemin normal de fournisseur OpenClaw sauf si vous forcez le harnais Codex avec
`agentRuntime.id: "codex"`. Les anciennes références `codex/gpt-*` continuent à sélectionner le
fournisseur et le harnais Codex pour compatibilité.

Pour la configuration opérateur, les exemples de préfixe de modèle, et les configurations Codex-only, voir
[Harnais Codex](/fr/plugins/codex-harness).

OpenClaw exige Codex app-server `0.125.0` ou plus récent. Le Plugin Codex vérifie
la poignée de main d’initialisation app-server et bloque les serveurs plus anciens ou non versionnés afin qu’OpenClaw ne s’exécute que sur la surface de protocole qu’il a testée. Le
plancher `0.125.0` inclut la prise en charge native du payload de hook MCP arrivée dans
Codex `0.124.0`, tout en épinglant OpenClaw sur la ligne stable plus récente testée.

### Middleware de résultat d’outil

Les Plugins intégrés peuvent attacher un middleware de résultat d’outil neutre vis-à-vis du runtime via
`api.registerAgentToolResultMiddleware(...)` lorsque leur manifeste déclare les
ids de runtime ciblés dans `contracts.agentToolResultMiddleware`. Cette couture
de confiance est destinée aux transformations asynchrones de résultat d’outil qui doivent s’exécuter avant que PI ou Codex ne réinjecte la sortie de l’outil dans le modèle.

Les anciens Plugins intégrés peuvent toujours utiliser
`api.registerCodexAppServerExtensionFactory(...)` pour le middleware app-server Codex-only,
mais les nouvelles transformations de résultats doivent utiliser l’API neutre vis-à-vis du runtime.
Le hook Pi-only `api.registerEmbeddedExtensionFactory(...)` a été supprimé ;
les transformations Pi de résultats d’outil doivent utiliser le middleware neutre vis-à-vis du runtime.

### Classification du résultat terminal

Les harnais natifs qui possèdent leur propre projection de protocole peuvent utiliser
`classifyAgentHarnessTerminalOutcome(...)` depuis
`openclaw/plugin-sdk/agent-harness-runtime` lorsqu’un tour terminé n’a produit aucun
texte d’assistant visible. L’aide renvoie `empty`, `reasoning-only`, ou
`planning-only` afin que la politique de repli d’OpenClaw puisse décider s’il faut réessayer sur un
modèle différent. Elle laisse intentionnellement non classés les erreurs de prompt, les tours en cours, et
les réponses silencieuses intentionnelles telles que `NO_REPLY`.

### Mode harnais Codex natif

Le harnais intégré `codex` est le mode Codex natif pour les tours d’agent
OpenClaw intégrés. Activez d’abord le plugin intégré `codex`, et incluez `codex` dans
`plugins.allow` si votre configuration utilise une liste d’autorisation restrictive. Les configurations app-server natives doivent utiliser `openai/gpt-*` avec `agentRuntime.id: "codex"`.
Utilisez `openai-codex/*` pour l’OAuth Codex via PI à la place. Les anciennes références de modèle `codex/*`
restent des alias de compatibilité pour le harnais natif.

Lorsque ce mode s’exécute, Codex possède l’id de thread natif, le comportement de reprise,
la Compaction, et l’exécution app-server. OpenClaw possède toujours le canal de discussion,
le miroir de transcript visible, la politique d’outils, les approbations, la livraison média, et la
sélection de session. Utilisez `agentRuntime.id: "codex"` sans remplacement `fallback`
lorsque vous devez prouver que seul le chemin app-server Codex peut revendiquer l’exécution.
Les runtimes Plugin explicites échouent déjà en mode fermé par défaut. Définissez `fallback: "pi"`
uniquement lorsque vous voulez intentionnellement que PI gère une sélection de harnais manquante. Les
échecs de l’app-server Codex échouent déjà directement au lieu d’être réessayés via PI.

## Désactiver le repli PI

Par défaut, OpenClaw exécute les agents intégrés avec `agents.defaults.agentRuntime`
défini sur `{ id: "auto", fallback: "pi" }`. En mode `auto`, les
harnais Plugin enregistrés peuvent revendiquer une paire fournisseur/modèle. Si aucun ne correspond, OpenClaw
revient à PI.

En mode `auto`, définissez `fallback: "none"` lorsque vous avez besoin que l’absence de sélection
de harnais Plugin provoque un échec au lieu d’utiliser PI. Les runtimes Plugin explicites tels que
`runtime: "codex"` échouent déjà en mode fermé par défaut, sauf si `fallback: "pi"` est
défini dans la même portée de remplacement config ou environnement. Les échecs du harnais Plugin sélectionné
échouent toujours de manière définitive. Cela ne bloque pas un `runtime: "pi"` explicite ni
`OPENCLAW_AGENT_RUNTIME=pi`.

Pour des exécutions intégrées Codex-only :

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

Si vous voulez que n’importe quel harnais Plugin enregistré revendique les modèles correspondants, mais ne
voulez jamais qu’OpenClaw revienne silencieusement à PI, gardez `runtime: "auto"` et désactivez
le repli :

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

Les remplacements par agent utilisent la même forme :

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

`OPENCLAW_AGENT_RUNTIME` remplace toujours le runtime configuré. Utilisez
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` pour désactiver le repli PI depuis
l’environnement.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Avec le repli désactivé, une session échoue tôt lorsque le harnais demandé n’est pas
enregistré, ne prend pas en charge le fournisseur/modèle résolu, ou échoue avant de
produire des effets de bord du tour. C’est intentionnel pour les déploiements Codex-only et
pour les tests live qui doivent prouver que le chemin app-server Codex est réellement utilisé.

Ce paramètre contrôle uniquement le harnais d’agent intégré. Il ne désactive pas
le routage spécifique au fournisseur pour image, vidéo, musique, TTS, PDF, ou autres modèles.

## Sessions natives et miroir de transcript

Un harnais peut conserver un id de session natif, un id de thread, ou un token de reprise côté daemon.
Gardez cette liaison explicitement associée à la session OpenClaw, et continuez
à refléter la sortie visible assistant/outil dans le transcript OpenClaw.

Le transcript OpenClaw reste la couche de compatibilité pour :

- l’historique de session visible par le canal
- la recherche et l’indexation de transcript
- le retour au harnais PI intégré lors d’un tour ultérieur
- le comportement générique `/new`, `/reset`, et suppression de session

Si votre harnais stocke une liaison sidecar, implémentez `reset(...)` afin qu’OpenClaw puisse
l’effacer lorsque la session OpenClaw propriétaire est réinitialisée.

## Résultats d’outil et médias

Le noyau construit la liste d’outils OpenClaw et la transmet à la tentative préparée.
Lorsqu’un harnais exécute un appel d’outil dynamique, renvoyez le résultat de l’outil via
la forme de résultat du harnais au lieu d’envoyer vous-même des médias au canal.

Cela maintient les sorties texte, image, vidéo, musique, TTS, approbation, et outils de messagerie
sur le même chemin de livraison que les exécutions soutenues par PI.

## Limites actuelles

- Le chemin d’import public est générique, mais certains alias de type de tentative/résultat portent encore
  des noms `Pi` pour compatibilité.
- L’installation de harnais tiers est expérimentale. Préférez les Plugins fournisseur
  jusqu’à ce que vous ayez besoin d’un runtime de session natif.
- Le changement de harnais est pris en charge entre les tours. Ne changez pas de harnais au
  milieu d’un tour après que des outils natifs, des approbations, du texte d’assistant, ou des
  envois de messages ont commencé.

## Associé

- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview)
- [Aides runtime](/fr/plugins/sdk-runtime)
- [Plugins fournisseur](/fr/plugins/sdk-provider-plugins)
- [Harnais Codex](/fr/plugins/codex-harness)
- [Fournisseurs de modèles](/fr/concepts/model-providers)
