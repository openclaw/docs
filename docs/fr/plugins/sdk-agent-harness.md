---
read_when:
    - Vous modifiez le runtime d’agent embarqué ou le registre des harnais
    - Vous enregistrez un harnais d’agent depuis un plugin inclus ou de confiance
    - Vous devez comprendre la relation entre le plugin Codex et les fournisseurs de modèles
sidebarTitle: Agent Harness
summary: Surface SDK expérimentale pour les plugins qui remplacent l’exécuteur d’agent embarqué de bas niveau
title: Plugins de harnais d’agent
x-i18n:
    generated_at: "2026-04-25T13:52:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: bceb0ccf51431918aec2dfca047af6ed916aa1a8a7c34ca38cb64a14655e4d50
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

Un **harnais d’agent** est l’exécuteur de bas niveau pour un tour d’agent OpenClaw
préparé. Ce n’est ni un fournisseur de modèle, ni un canal, ni un registre d’outils.
Pour le modèle mental orienté utilisateur, voir [Runtimes d’agent](/fr/concepts/agent-runtimes).

Utilisez cette surface uniquement pour des plugins natifs inclus ou de confiance. Le contrat
reste expérimental car les types de paramètres reflètent intentionnellement l’exécuteur
embarqué actuel.

## Quand utiliser un harnais

Enregistrez un harnais d’agent lorsqu’une famille de modèles possède son propre runtime de session
natif et que le transport fournisseur OpenClaw normal est la mauvaise abstraction.

Exemples :

- un serveur d’agent de codage natif qui gère les fils et la compaction
- une CLI locale ou un démon qui doit diffuser des événements natifs de plan/raisonnement/outils
- un runtime de modèle qui a besoin de son propre identifiant de reprise en plus de la
  transcription de session OpenClaw

N’enregistrez **pas** un harnais simplement pour ajouter une nouvelle API LLM. Pour les API de modèle HTTP ou
WebSocket normales, créez un [plugin de fournisseur](/fr/plugins/sdk-provider-plugins).

## Ce que le cœur continue de gérer

Avant qu’un harnais ne soit sélectionné, OpenClaw a déjà résolu :

- le fournisseur et le modèle
- l’état d’authentification du runtime
- le niveau de réflexion et le budget de contexte
- le fichier de transcription/session OpenClaw
- l’espace de travail, le sandbox et la politique d’outils
- les callbacks de réponse de canal et les callbacks de streaming
- la politique de repli de modèle et de changement de modèle en direct

Cette séparation est intentionnelle. Un harnais exécute une tentative préparée ; il ne choisit
pas les fournisseurs, ne remplace pas la distribution des canaux et ne change pas silencieusement de modèle.

## Enregistrer un harnais

**Import :** `openclaw/plugin-sdk/agent-harness`

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
    // Démarrer ou reprendre votre fil natif.
    // Utilisez params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent, et les autres champs de tentative préparée.
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

OpenClaw choisit un harnais après la résolution du fournisseur/modèle :

1. L’identifiant de harnais enregistré pour une session existante l’emporte, de sorte que les changements de configuration/environnement
   ne basculent pas à chaud cette transcription vers un autre runtime.
2. `OPENCLAW_AGENT_RUNTIME=<id>` force un harnais enregistré avec cet identifiant pour
   les sessions qui ne sont pas déjà épinglées.
3. `OPENCLAW_AGENT_RUNTIME=pi` force le harnais PI intégré.
4. `OPENCLAW_AGENT_RUNTIME=auto` demande aux harnais enregistrés s’ils prennent en charge le
   fournisseur/modèle résolu.
5. Si aucun harnais enregistré ne correspond, OpenClaw utilise Pi sauf si le repli sur Pi est
   désactivé.

Les échecs de harnais de plugin apparaissent comme des échecs d’exécution. En mode `auto`, le repli sur Pi n’est
utilisé que lorsqu’aucun harnais de plugin enregistré ne prend en charge le
fournisseur/modèle résolu. Une fois qu’un harnais de plugin a pris en charge une exécution, OpenClaw ne rejoue
pas ce même tour via Pi car cela peut changer la sémantique auth/runtime
ou dupliquer des effets secondaires.

L’identifiant de harnais sélectionné est conservé avec l’identifiant de session après une exécution embarquée.
Les sessions héritées créées avant l’épinglage de harnais sont traitées comme épinglées à Pi une fois qu’elles
ont un historique de transcription. Utilisez une nouvelle session/session réinitialisée lorsque vous passez de Pi à un
harnais de plugin natif. `/status` affiche les identifiants de harnais non par défaut tels que `codex`
à côté de `Fast` ; Pi reste masqué car c’est le chemin de compatibilité par défaut.
Si le harnais sélectionné est surprenant, activez la journalisation de débogage `agents/harness` et
inspectez l’enregistrement structuré `agent harness selected` de la gateway. Il inclut
l’identifiant de harnais sélectionné, la raison de la sélection, la politique runtime/repli, et, en
mode `auto`, le résultat de prise en charge de chaque candidat plugin.

Le plugin Codex inclus enregistre `codex` comme identifiant de harnais. Le cœur traite cela
comme un identifiant de harnais de plugin ordinaire ; les alias spécifiques à Codex appartiennent au plugin
ou à la configuration opérateur, pas au sélecteur de runtime partagé.

## Appariement fournisseur + harnais

La plupart des harnais devraient aussi enregistrer un fournisseur. Le fournisseur rend les références de modèle,
l’état d’authentification, les métadonnées de modèle et la sélection `/model` visibles pour le reste
d’OpenClaw. Le harnais revendique ensuite ce fournisseur dans `supports(...)`.

Le plugin Codex inclus suit ce modèle :

- références de modèle utilisateur préférées : `openai/gpt-5.5` plus
  `embeddedHarness.runtime: "codex"`
- références de compatibilité : les anciennes références `codex/gpt-*` restent acceptées, mais les nouvelles
  configurations ne doivent pas les utiliser comme références normales fournisseur/modèle
- identifiant de harnais : `codex`
- auth : disponibilité synthétique du fournisseur, car le harnais Codex possède la connexion/session Codex native
- requête app-server : OpenClaw envoie l’identifiant nu du modèle à Codex et laisse le
  harnais parler au protocole natif d’app-server

Le plugin Codex est additif. Les références simples `openai/gpt-*` continuent d’utiliser le
chemin normal du fournisseur OpenClaw sauf si vous forcez le harnais Codex avec
`embeddedHarness.runtime: "codex"`. Les anciennes références `codex/gpt-*` sélectionnent toujours le
fournisseur et le harnais Codex pour compatibilité.

Pour la configuration opérateur, les exemples de préfixes de modèle et les configurations réservées à Codex, voir
[Harnais Codex](/fr/plugins/codex-harness).

OpenClaw exige Codex app-server `0.118.0` ou plus récent. Le plugin Codex vérifie
la négociation d’initialisation app-server et bloque les serveurs plus anciens ou non versionnés afin qu’OpenClaw ne s’exécute que sur la surface de protocole sur laquelle il a été testé.

### Middleware de résultat d’outil

Les plugins inclus peuvent attacher un middleware de résultat d’outil neutre vis-à-vis du runtime via
`api.registerAgentToolResultMiddleware(...)` lorsque leur manifeste déclare les
identifiants de runtime ciblés dans `contracts.agentToolResultMiddleware`. Cette
couture de confiance est destinée aux transformations asynchrones de résultat d’outil qui doivent s’exécuter avant que Pi ou Codex ne réinjecte
la sortie de l’outil dans le modèle.

Les anciens plugins inclus peuvent toujours utiliser
`api.registerCodexAppServerExtensionFactory(...)` pour du middleware réservé à
Codex app-server, mais les nouvelles transformations de résultat devraient utiliser l’API neutre vis-à-vis du runtime.
Le hook `api.registerEmbeddedExtensionFactory(...)` réservé à Pi a été supprimé ;
les transformations de résultat d’outil Pi doivent utiliser un middleware neutre vis-à-vis du runtime.

### Mode de harnais Codex natif

Le harnais `codex` inclus est le mode Codex natif pour les tours d’agent
OpenClaw embarqués. Activez d’abord le plugin `codex` inclus, et incluez `codex` dans
`plugins.allow` si votre configuration utilise une liste d’autorisations restrictive. Les configurations app-server natives doivent utiliser `openai/gpt-*` avec `embeddedHarness.runtime: "codex"`.
Utilisez `openai-codex/*` pour Codex OAuth via Pi à la place. Les anciennes références de modèle `codex/*`
restent des alias de compatibilité pour le harnais natif.

Lorsque ce mode s’exécute, Codex gère l’identifiant de fil natif, le comportement de reprise,
la compaction et l’exécution app-server. OpenClaw continue de gérer le canal de discussion,
le miroir de transcription visible, la politique d’outils, les approbations, la distribution de médias et la
sélection de session. Utilisez `embeddedHarness.runtime: "codex"` sans remplacement `fallback`
lorsque vous devez prouver que seul le chemin Codex app-server peut revendiquer l’exécution.
Les runtimes de plugin explicites échouent déjà en mode fermé par défaut. Définissez `fallback: "pi"`
uniquement lorsque vous voulez intentionnellement que Pi gère l’absence de sélection de harnais. Les échecs
de Codex app-server échouent déjà directement au lieu d’être réessayés via Pi.

## Désactiver le repli sur Pi

Par défaut, OpenClaw exécute les agents embarqués avec `agents.defaults.embeddedHarness`
défini sur `{ runtime: "auto", fallback: "pi" }`. En mode `auto`, les harnais de plugin enregistrés
peuvent revendiquer une paire fournisseur/modèle. Si aucun ne correspond, OpenClaw se replie sur Pi.

En mode `auto`, définissez `fallback: "none"` lorsque vous avez besoin que l’absence de sélection de harnais de plugin
échoue au lieu d’utiliser Pi. Les runtimes de plugin explicites tels que
`runtime: "codex"` échouent déjà en mode fermé par défaut, sauf si `fallback: "pi"` est
défini dans la même portée de configuration ou de remplacement d’environnement. Les échecs du harnais de plugin sélectionné
échouent toujours de manière définitive. Cela ne bloque pas un `runtime: "pi"` explicite ni
`OPENCLAW_AGENT_RUNTIME=pi`.

Pour les exécutions embarquées réservées à Codex :

```json
{
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5",
      "embeddedHarness": {
        "runtime": "codex"
      }
    }
  }
}
```

Si vous voulez que n’importe quel harnais de plugin enregistré puisse revendiquer les modèles correspondants mais ne
voulez jamais qu’OpenClaw se replie silencieusement sur Pi, gardez `runtime: "auto"` et désactivez
le repli :

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

Les remplacements par agent utilisent la même forme :

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
        "model": "openai/gpt-5.5",
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
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` pour désactiver le repli sur Pi depuis
l’environnement.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Avec le repli désactivé, une session échoue tôt lorsque le harnais demandé n’est pas
enregistré, ne prend pas en charge le fournisseur/modèle résolu, ou échoue avant de
produire des effets secondaires du tour. C’est intentionnel pour les déploiements réservés à Codex et
pour les tests live qui doivent prouver que le chemin Codex app-server est réellement utilisé.

Ce paramètre ne contrôle que le harnais d’agent embarqué. Il ne désactive pas le
routage spécifique au fournisseur pour l’image, la vidéo, la musique, le TTS, le PDF ou d’autres modèles.

## Sessions natives et miroir de transcription

Un harnais peut conserver un identifiant de session natif, un identifiant de fil ou un jeton de reprise côté démon.
Conservez cette liaison explicitement associée à la session OpenClaw, et continuez
à refléter dans la transcription OpenClaw la sortie visible de l’assistant/des outils.

La transcription OpenClaw reste la couche de compatibilité pour :

- l’historique de session visible sur le canal
- la recherche et l’indexation dans la transcription
- le retour au harnais Pi intégré lors d’un tour ultérieur
- le comportement générique de `/new`, `/reset` et de suppression de session

Si votre harnais stocke une liaison annexe, implémentez `reset(...)` afin qu’OpenClaw puisse
l’effacer lorsque la session OpenClaw propriétaire est réinitialisée.

## Résultats d’outil et de média

Le cœur construit la liste d’outils OpenClaw et la transmet dans la tentative préparée.
Lorsqu’un harnais exécute un appel d’outil dynamique, renvoyez le résultat de l’outil via
la forme de résultat du harnais au lieu d’envoyer vous-même le média du canal.

Cela maintient les sorties texte, image, vidéo, musique, TTS, approbation et outils de messagerie
sur le même chemin de distribution que les exécutions soutenues par Pi.

## Limites actuelles

- Le chemin d’import public est générique, mais certains alias de type de tentative/résultat portent encore
  des noms `Pi` pour compatibilité.
- L’installation de harnais tiers est expérimentale. Préférez les plugins de fournisseur
  tant que vous n’avez pas besoin d’un runtime de session natif.
- Le basculement de harnais est pris en charge d’un tour à l’autre. Ne changez pas de harnais au
  milieu d’un tour après que des outils natifs, approbations, texte d’assistant ou envois de messages ont commencé.

## Voir aussi

- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview)
- [Helpers de runtime](/fr/plugins/sdk-runtime)
- [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins)
- [Harnais Codex](/fr/plugins/codex-harness)
- [Fournisseurs de modèles](/fr/concepts/model-providers)
