---
read_when:
    - Vous modifiez le runtime d’agent intégré ou le registre de harnais
    - Vous enregistrez un harnais d’agent depuis un plugin intégré ou de confiance
    - Vous devez comprendre comment le plugin Codex se rapporte aux fournisseurs de modèles
sidebarTitle: Agent Harness
summary: Surface SDK expérimentale pour les plugins qui remplacent l’exécuteur d’agent intégré de bas niveau
title: Plugins de harnais d’agent
x-i18n:
    generated_at: "2026-04-23T07:06:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: efaecca18210af0e9e641bd888c1edb55e08e96299158ff021d6c2dd0218ec25
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

# Plugins de harnais d’agent

Un **harnais d’agent** est l’exécuteur de bas niveau pour un tour préparé d’agent OpenClaw.
Ce n’est pas un fournisseur de modèles, pas un canal, et pas un registre d’outils.

Utilisez cette surface uniquement pour des plugins natifs intégrés ou de confiance. Le contrat
reste expérimental, car les types de paramètres reflètent intentionnellement le runner intégré actuel.

## Quand utiliser un harnais

Enregistrez un harnais d’agent lorsqu’une famille de modèles possède son propre runtime de session
natif et que le transport normal de fournisseur OpenClaw est la mauvaise abstraction.

Exemples :

- un serveur natif d’agent de code qui gère ses propres fils et la Compaction
- une CLI locale ou un daemon qui doit diffuser des événements natifs de plan/raisonnement/outils
- un runtime de modèle qui a besoin de son propre ID de reprise en plus de la
  transcription de session OpenClaw

N’enregistrez **pas** de harnais juste pour ajouter une nouvelle API LLM. Pour des API de modèle HTTP ou
WebSocket normales, créez un [plugin fournisseur](/fr/plugins/sdk-provider-plugins).

## Ce que le cœur possède encore

Avant qu’un harnais soit sélectionné, OpenClaw a déjà résolu :

- le fournisseur et le modèle
- l’état d’authentification du runtime
- le niveau de réflexion et le budget de contexte
- le fichier de transcription/session OpenClaw
- l’espace de travail, le sandbox et la politique d’outils
- les callbacks de réponse de canal et de streaming
- la politique de basculement de modèle et de changement de modèle en direct

Cette séparation est intentionnelle. Un harnais exécute une tentative préparée ; il ne choisit
pas les fournisseurs, ne remplace pas la livraison par canal et ne change pas silencieusement de modèle.

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
    // Démarrer ou reprendre votre fil natif.
    // Utilisez params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent, et les autres champs de tentative préparée.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "Mon agent natif",
  description: "Exécute les modèles sélectionnés via un daemon d’agent natif.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

## Politique de sélection

OpenClaw choisit un harnais après la résolution fournisseur/modèle :

1. `OPENCLAW_AGENT_RUNTIME=<id>` force un harnais enregistré avec cet id.
2. `OPENCLAW_AGENT_RUNTIME=pi` force le harnais PI intégré.
3. `OPENCLAW_AGENT_RUNTIME=auto` demande aux harnais enregistrés s’ils prennent en charge le
   fournisseur/modèle résolu.
4. Si aucun harnais enregistré ne correspond, OpenClaw utilise PI sauf si le repli PI est
   désactivé.

Les échecs de harnais de plugin apparaissent comme des échecs d’exécution. En mode `auto`, le repli PI n’est
utilisé que lorsqu’aucun harnais de plugin enregistré ne prend en charge le
fournisseur/modèle résolu. Une fois qu’un harnais de plugin a revendiqué une exécution, OpenClaw ne
rejoue pas ce même tour via PI, car cela peut modifier la sémantique auth/runtime
ou dupliquer des effets de bord.

Le plugin Codex intégré enregistre `codex` comme identifiant de harnais. Le cœur traite cela
comme un identifiant ordinaire de harnais de plugin ; les alias spécifiques à Codex appartiennent au plugin
ou à la configuration opérateur, pas au sélecteur de runtime partagé.

## Association fournisseur plus harnais

La plupart des harnais devraient aussi enregistrer un fournisseur. Le fournisseur rend visibles
les références de modèles, l’état d’authentification, les métadonnées de modèle et la sélection `/model` au reste d’OpenClaw. Le harnais revendique ensuite ce fournisseur dans `supports(...)`.

Le plugin Codex intégré suit ce modèle :

- id du fournisseur : `codex`
- références de modèles utilisateur : `codex/gpt-5.4`, `codex/gpt-5.2`, ou un autre modèle renvoyé
  par le serveur d’application Codex
- id du harnais : `codex`
- auth : disponibilité synthétique du fournisseur, car le harnais Codex gère la
  connexion/session Codex native
- requête au serveur d’application : OpenClaw envoie l’id de modèle nu à Codex et laisse le
  harnais parler le protocole natif du serveur d’application

Le plugin Codex est additif. Les références simples `openai/gpt-*` restent des références du fournisseur OpenAI
et continuent d’utiliser le chemin normal de fournisseur OpenClaw. Sélectionnez `codex/gpt-*`
lorsque vous voulez une auth gérée par Codex, la découverte de modèles Codex, des fils natifs et
l’exécution via le serveur d’application Codex. `/model` peut basculer entre les modèles Codex renvoyés
par le serveur d’application Codex sans nécessiter d’identifiants de fournisseur OpenAI.

Pour la configuration opérateur, les exemples de préfixe de modèle et les configurations propres à Codex, voir
[Codex Harness](/fr/plugins/codex-harness).

OpenClaw exige la version `0.118.0` ou plus récente du serveur d’application Codex. Le plugin Codex vérifie
le handshake initialize du serveur d’application et bloque les serveurs plus anciens ou sans version afin qu’OpenClaw
ne s’exécute que sur la surface de protocole avec laquelle il a été testé.

### Middleware `tool_result` du serveur d’application Codex

Les plugins intégrés peuvent aussi attacher un middleware `tool_result` spécifique au serveur d’application Codex via
`api.registerCodexAppServerExtensionFactory(...)` lorsque leur manifest déclare `contracts.embeddedExtensionFactories: ["codex-app-server"]`.
C’est le point d’extension de confiance pour plugin de confiance pour des transformations asynchrones de `tool_result` qui doivent
s’exécuter à l’intérieur du harnais Codex natif avant que la sortie d’outil ne soit reprojetée dans la transcription OpenClaw.

### Mode harnais Codex natif

Le harnais `codex` intégré est le mode Codex natif pour les tours d’agent OpenClaw intégrés.
Activez d’abord le plugin `codex` intégré et incluez `codex` dans
`plugins.allow` si votre configuration utilise une allowlist restrictive. Il est différent de `openai-codex/*` :

- `openai-codex/*` utilise OAuth ChatGPT/Codex via le chemin normal du fournisseur OpenClaw.
- `codex/*` utilise le fournisseur Codex intégré et route le tour via le
  serveur d’application Codex.

Lorsque ce mode s’exécute, Codex possède l’id de fil natif, le comportement de reprise,
la Compaction et l’exécution du serveur d’application. OpenClaw possède toujours le canal de chat,
le miroir de transcription visible, la politique d’outils, les approbations, la livraison de médias et la sélection de session. Utilisez `embeddedHarness.runtime: "codex"` avec
`embeddedHarness.fallback: "none"` lorsque vous devez prouver que seul le chemin du
serveur d’application Codex peut revendiquer l’exécution. Cette configuration n’est qu’une barrière de sélection :
les échecs du serveur d’application Codex échouent déjà directement au lieu de réessayer via PI.

## Désactiver le repli PI

Par défaut, OpenClaw exécute les agents intégrés avec `agents.defaults.embeddedHarness`
défini sur `{ runtime: "auto", fallback: "pi" }`. En mode `auto`, les harnais de plugin enregistrés
peuvent revendiquer une paire fournisseur/modèle. Si aucun ne correspond, OpenClaw revient à PI.

Définissez `fallback: "none"` lorsque vous avez besoin qu’un échec de sélection du harnais de plugin
échoue au lieu d’utiliser PI. Les échecs de harnais de plugin sélectionné échouent déjà de manière stricte. Cela
ne bloque pas un `runtime: "pi"` explicite ou `OPENCLAW_AGENT_RUNTIME=pi`.

Pour des exécutions intégrées Codex uniquement :

```json
{
  "agents": {
    "defaults": {
      "model": "codex/gpt-5.4",
      "embeddedHarness": {
        "runtime": "codex",
        "fallback": "none"
      }
    }
  }
}
```

Si vous voulez que n’importe quel harnais de plugin enregistré revendique les modèles correspondants mais ne voulez jamais
qu’OpenClaw revienne silencieusement à PI, conservez `runtime: "auto"` et désactivez
le repli :

```json
{
  "agents": {
    "defaults": {
      "embeddedHarness": {
        "runtime": "auto",
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
      "embeddedHarness": {
        "runtime": "auto",
        "fallback": "pi"
      }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "codex/gpt-5.4",
        "embeddedHarness": {
          "runtime": "codex",
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
enregistré, ne prend pas en charge le fournisseur/modèle résolu, ou échoue avant
de produire des effets de bord de tour. C’est intentionnel pour les déploiements Codex-only et
pour les tests live qui doivent prouver que le chemin du serveur d’application Codex est réellement utilisé.

Ce paramètre contrôle uniquement le harnais d’agent intégré. Il ne désactive pas
le routage de modèles spécifique au fournisseur pour l’image, la vidéo, la musique, le TTS, le PDF ou d’autres cas.

## Sessions natives et miroir de transcription

Un harnais peut conserver un id de session natif, un id de fil ou un token de reprise côté daemon.
Conservez explicitement cette liaison associée à la session OpenClaw, et continuez
à refléter la sortie visible utilisateur de l’assistant/des outils dans la transcription OpenClaw.

La transcription OpenClaw reste la couche de compatibilité pour :

- l’historique de session visible par canal
- la recherche et l’indexation de transcription
- le retour au harnais PI intégré sur un tour ultérieur
- le comportement générique `/new`, `/reset` et suppression de session

Si votre harnais stocke une liaison sidecar, implémentez `reset(...)` afin qu’OpenClaw puisse
l’effacer lorsque la session OpenClaw propriétaire est réinitialisée.

## Résultats d’outils et de médias

Le cœur construit la liste d’outils OpenClaw et la transmet à la tentative préparée.
Lorsqu’un harnais exécute un appel d’outil dynamique, renvoyez le résultat d’outil via
la forme de résultat du harnais au lieu d’envoyer vous-même des médias de canal.

Cela maintient les sorties texte, image, vidéo, musique, TTS, approbation et outils de messagerie
sur le même chemin de livraison que les exécutions adossées à PI.

## Limites actuelles

- Le chemin d’import public est générique, mais certains alias de types de tentative/résultat portent encore
  des noms `Pi` pour la compatibilité.
- L’installation de harnais tiers est expérimentale. Préférez les plugins fournisseur
  jusqu’à ce que vous ayez besoin d’un runtime de session natif.
- Le changement de harnais est pris en charge entre les tours. Ne changez pas de harnais au
  milieu d’un tour après le début d’outils natifs, d’approbations, de texte assistant ou d’envois de messages.

## Liens associés

- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview)
- [Helpers de runtime](/fr/plugins/sdk-runtime)
- [Plugins fournisseur](/fr/plugins/sdk-provider-plugins)
- [Codex Harness](/fr/plugins/codex-harness)
- [Fournisseurs de modèles](/fr/concepts/model-providers)
