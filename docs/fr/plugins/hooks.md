---
read_when:
    - Vous développez un Plugin qui a besoin de before_tool_call, before_agent_reply, de hooks de message ou de hooks de cycle de vie
    - Vous devez bloquer, réécrire ou exiger une approbation pour les appels d’outils provenant d’un Plugin
    - Vous choisissez entre les hooks internes et les hooks de Plugin
summary: 'Hooks de Plugin : interceptez les événements du cycle de vie des agents, des outils, des messages, des sessions et du Gateway'
title: Points d’ancrage de Plugin
x-i18n:
    generated_at: "2026-05-06T17:59:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3741b95bcccdff4e24b4c1f05de54649b48a6c0a2ca1dc4376475eb1823ae185
    source_path: plugins/hooks.md
    workflow: 16
---

Les hooks de Plugin sont des points d’extension intégrés au processus pour les Plugins OpenClaw. Utilisez-les
lorsqu’un Plugin doit inspecter ou modifier les exécutions d’agents, les appels d’outils, le flux de messages,
le cycle de vie des sessions, le routage de sous-agents, les installations ou le démarrage du Gateway.

Utilisez plutôt les [hooks internes](/fr/automation/hooks) lorsque vous voulez un petit
script `HOOK.md` installé par l’opérateur pour les commandes et événements du Gateway tels que
`/new`, `/reset`, `/stop`, `agent:bootstrap` ou `gateway:startup`.

## Démarrage rapide

Enregistrez des hooks de Plugin typés avec `api.on(...)` depuis le point d’entrée de votre Plugin :

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "tool-preflight",
  name: "Tool Preflight",
  register(api) {
    api.on(
      "before_tool_call",
      async (event) => {
        if (event.toolName !== "web_search") {
          return;
        }

        return {
          requireApproval: {
            title: "Run web search",
            description: `Allow search query: ${String(event.params.query ?? "")}`,
            severity: "info",
            timeoutMs: 60_000,
            timeoutBehavior: "deny",
          },
        };
      },
      { priority: 50 },
    );
  },
});
```

Les gestionnaires de hooks s’exécutent séquentiellement par `priority` décroissante. Les hooks de même priorité
conservent l’ordre d’enregistrement.

`api.on(name, handler, opts?)` accepte :

- `priority` - ordre des gestionnaires (les valeurs les plus élevées s’exécutent en premier).
- `timeoutMs` - budget optionnel par hook. Lorsqu’il est défini, le moteur de hooks interrompt ce
  gestionnaire une fois le budget écoulé et poursuit avec le suivant, au lieu de
  laisser une configuration lente ou un travail de rappel consommer le délai d’expiration de modèle configuré
  par l’appelant. Omettez-le pour utiliser le délai d’expiration d’observation/décision par défaut que le
  moteur de hooks applique de manière générique.

Les opérateurs peuvent aussi définir des budgets de hooks sans modifier le code du Plugin :

```json
{
  "plugins": {
    "entries": {
      "my-plugin": {
        "hooks": {
          "timeoutMs": 30000,
          "timeouts": {
            "before_prompt_build": 90000,
            "agent_end": 60000
          }
        }
      }
    }
  }
}
```

`hooks.timeouts.<hookName>` remplace `hooks.timeoutMs`, qui remplace la valeur
`api.on(..., { timeoutMs })` écrite par le Plugin. Chaque valeur configurée doit
être un entier positif inférieur ou égal à 600000 millisecondes. Préférez les remplacements par hook
pour les hooks connus comme lents afin qu’un Plugin ne reçoive pas un budget plus long
partout.

Chaque hook reçoit `event.context.pluginConfig`, la configuration résolue pour le
Plugin qui a enregistré ce gestionnaire. Utilisez-la pour les décisions de hook qui nécessitent
les options actuelles du Plugin ; OpenClaw l’injecte par gestionnaire sans modifier
l’objet d’événement partagé vu par les autres Plugins.

## Catalogue des hooks

Les hooks sont regroupés selon la surface qu’ils étendent. Les noms en **gras** acceptent un
résultat de décision (bloquer, annuler, remplacer ou exiger une approbation) ; tous les autres sont
uniquement destinés à l’observation.

**Tour d’agent**

- `before_model_resolve` - remplacer le fournisseur ou le modèle avant le chargement des messages de session
- `agent_turn_prepare` - consommer les injections de tour de Plugin en file d’attente et ajouter du contexte au même tour avant les hooks de prompt
- `before_prompt_build` - ajouter du contexte dynamique ou du texte de prompt système avant l’appel au modèle
- `before_agent_start` - phase combinée réservée à la compatibilité ; préférez les deux hooks ci-dessus
- **`before_agent_run`** - inspecter le prompt final et les messages de session avant la soumission au modèle, et éventuellement bloquer l’exécution
- **`before_agent_reply`** - court-circuiter le tour du modèle avec une réponse synthétique ou un silence
- **`before_agent_finalize`** - inspecter la réponse finale naturelle et demander un passage de modèle supplémentaire
- `agent_end` - observer les messages finaux, l’état de réussite et la durée d’exécution
- `heartbeat_prompt_contribution` - ajouter du contexte propre au Heartbeat pour les Plugins de surveillance en arrière-plan et de cycle de vie

**Observation de conversation**

- `model_call_started` / `model_call_ended` - observer les métadonnées aseptisées des appels fournisseur/modèle, le minutage, le résultat et les hachages bornés d’identifiants de requête sans contenu de prompt ni de réponse
- `llm_input` - observer l’entrée fournisseur (prompt système, prompt, historique)
- `llm_output` - observer la sortie fournisseur

**Outils**

- **`before_tool_call`** - réécrire les paramètres d’outil, bloquer l’exécution ou exiger une approbation
- `after_tool_call` - observer les résultats d’outils, les erreurs et la durée
- **`tool_result_persist`** - réécrire le message de l’assistant produit à partir d’un résultat d’outil
- **`before_message_write`** - inspecter ou bloquer l’écriture d’un message en cours (rare)

**Messages et livraison**

- **`inbound_claim`** - revendiquer un message entrant avant le routage d’agent (réponses synthétiques)
- `message_received` - observer le contenu entrant, l’expéditeur, le fil et les métadonnées
- **`message_sending`** - réécrire le contenu sortant ou annuler la livraison
- `message_sent` - observer la réussite ou l’échec de la livraison sortante
- **`before_dispatch`** - inspecter ou réécrire une expédition sortante avant le transfert au canal
- **`reply_dispatch`** - participer au pipeline final d’expédition de réponse

**Sessions et Compaction**

- `session_start` / `session_end` - suivre les limites du cycle de vie de session
- `before_compaction` / `after_compaction` - observer ou annoter les cycles de Compaction
- `before_reset` - observer les événements de réinitialisation de session (`/reset`, réinitialisations programmatiques)

**Sous-agents**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` - coordonner le routage des sous-agents et la livraison de fin d’exécution

**Cycle de vie**

- `gateway_start` / `gateway_stop` - démarrer ou arrêter des services détenus par le Plugin avec le Gateway
- `cron_changed` - observer les changements de cycle de vie Cron détenus par le Gateway (ajoutés, mis à jour, supprimés, démarrés, terminés, planifiés)
- **`before_install`** - inspecter les analyses d’installation de Skills ou de Plugins et éventuellement bloquer

## Politique d’appel d’outil

`before_tool_call` reçoit :

- `event.toolName`
- `event.params`
- `event.runId` optionnel
- `event.toolCallId` optionnel
- des champs de contexte tels que `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (défini sur les exécutions déclenchées par Cron) et le diagnostic `ctx.trace`

Il peut renvoyer :

```typescript
type BeforeToolCallResult = {
  params?: Record<string, unknown>;
  block?: boolean;
  blockReason?: string;
  requireApproval?: {
    title: string;
    description: string;
    severity?: "info" | "warning" | "critical";
    timeoutMs?: number;
    timeoutBehavior?: "allow" | "deny";
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

Règles :

- `block: true` est terminal et ignore les gestionnaires de priorité inférieure.
- `block: false` est traité comme une absence de décision.
- `params` réécrit les paramètres de l’outil pour l’exécution.
- `requireApproval` met l’exécution de l’agent en pause et demande à l’utilisateur via les approbations de Plugin.
  La commande `/approve` peut approuver les approbations exec et de Plugin.
- Un `block: true` de priorité inférieure peut toujours bloquer après qu’un hook de priorité supérieure
  a demandé une approbation.
- `onResolution` reçoit la décision d’approbation résolue - `allow-once`,
  `allow-always`, `deny`, `timeout` ou `cancelled`.

Les Plugins intégrés qui nécessitent une politique au niveau de l’hôte peuvent enregistrer des politiques d’outils approuvées
avec `api.registerTrustedToolPolicy(...)`. Elles s’exécutent avant les hooks
`before_tool_call` ordinaires et avant les décisions de Plugins externes. Utilisez-les uniquement
pour les barrières approuvées par l’hôte, comme la politique d’espace de travail, l’application de budget ou
la sûreté de flux de travail réservés. Les Plugins externes doivent utiliser les hooks `before_tool_call`
normaux.

### Persistance des résultats d’outils

Les résultats d’outils peuvent inclure des `details` structurés pour le rendu d’interface, les diagnostics,
le routage de médias ou les métadonnées détenues par le Plugin. Traitez `details` comme des métadonnées d’exécution,
pas comme du contenu de prompt :

- OpenClaw retire `toolResult.details` avant la relecture fournisseur et l’entrée de Compaction
  afin que les métadonnées ne deviennent pas du contexte de modèle.
- Les entrées de session persistées ne conservent que des `details` bornés. Les détails trop volumineux sont
  remplacés par un résumé compact et `persistedDetailsTruncated: true`.
- `tool_result_persist` et `before_message_write` s’exécutent avant le plafond final
  de persistance. Les hooks doivent tout de même garder les `details` renvoyés petits et éviter
  de placer du texte pertinent pour le prompt uniquement dans `details` ; placez la sortie d’outil visible par le modèle
  dans `content`.

## Hooks de prompt et de modèle

Utilisez les hooks propres à chaque phase pour les nouveaux Plugins :

- `before_model_resolve` : reçoit uniquement le prompt actuel et les métadonnées de pièces jointes.
  Renvoyez `providerOverride` ou `modelOverride`.
- `agent_turn_prepare` : reçoit le prompt actuel, les messages de session préparés,
  et toutes les injections en file d’attente exactement une fois drainées pour cette session. Renvoyez
  `prependContext` ou `appendContext`.
- `before_prompt_build` : reçoit le prompt actuel et les messages de session.
  Renvoyez `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` ou `appendSystemContext`.
- `heartbeat_prompt_contribution` : s’exécute uniquement pour les tours Heartbeat et renvoie
  `prependContext` ou `appendContext`. Il est destiné aux moniteurs en arrière-plan
  qui doivent résumer l’état actuel sans modifier les tours initiés par l’utilisateur.

`before_agent_start` reste disponible pour compatibilité. Préférez les hooks explicites ci-dessus
afin que votre Plugin ne dépende pas d’une phase combinée historique.

`before_agent_run` s’exécute après la construction du prompt et avant toute entrée du modèle,
y compris le chargement d’images locales au prompt et l’observation `llm_input`. Il reçoit
l’entrée utilisateur actuelle sous forme de `prompt`, ainsi que l’historique de session chargé dans `messages`
et le prompt système actif. Renvoyez `{ outcome: "block", reason, message? }`
pour arrêter l’exécution avant que le modèle puisse lire le prompt. `reason` est interne ;
`message` est le remplacement visible par l’utilisateur. Les seuls résultats pris en charge sont
`pass` et `block` ; les formes de décision non prises en charge échouent de manière fermée.

Lorsqu’une exécution est bloquée, OpenClaw stocke uniquement le texte de remplacement dans
`message.content`, plus des métadonnées de blocage non sensibles comme l’identifiant du Plugin bloqueur
et l’horodatage. Le texte utilisateur d’origine n’est pas conservé dans la transcription ni dans le contexte
futur. Les raisons de blocage internes sont traitées comme sensibles et exclues des charges utiles de
transcription, d’historique, de diffusion, de journaux et de diagnostics. L’observabilité
doit utiliser des champs aseptisés comme l’identifiant du bloqueur, le résultat, l’horodatage ou une catégorie
sûre.

`before_agent_start` et `agent_end` incluent `event.runId` lorsqu’OpenClaw peut
identifier l’exécution active. La même valeur est aussi disponible sur `ctx.runId`.
Les exécutions déclenchées par Cron exposent aussi `ctx.jobId` (l’identifiant du job Cron d’origine) afin que
les hooks de Plugin puissent limiter les métriques, les effets de bord ou l’état à un job planifié
spécifique.

Pour les exécutions issues d’un canal, `ctx.messageProvider` est la surface fournisseur telle que
`discord` ou `telegram`, tandis que `ctx.channelId` est l’identifiant cible de conversation
lorsqu’OpenClaw peut le déduire de la clé de session ou des métadonnées de livraison.

`agent_end` est un hook d’observation et s’exécute en fire-and-forget après le tour. Le
moteur de hooks applique un délai d’expiration de 30 secondes afin qu’un Plugin bloqué ou un endpoint
d’embedding ne puisse pas laisser la promesse du hook en attente indéfiniment. Un délai d’expiration est journalisé et
OpenClaw continue ; il n’annule pas le travail réseau détenu par le Plugin sauf si le
Plugin utilise aussi son propre signal d’abandon.

Utilisez `model_call_started` et `model_call_ended` pour la télémétrie d’appel fournisseur
qui ne doit pas recevoir de prompts bruts, d’historique, de réponses, d’en-têtes, de corps de requête
ou d’identifiants de requête fournisseur. Ces hooks incluent des métadonnées stables comme
`runId`, `callId`, `provider`, `model`, `api`/`transport` optionnels, les champs terminaux
`durationMs`/`outcome`, et `upstreamRequestIdHash` lorsqu’OpenClaw peut dériver un
hachage borné d’identifiant de requête fournisseur.

`before_agent_finalize` s’exécute uniquement lorsqu’un harnais est sur le point d’accepter une réponse finale
naturelle de l’assistant. Ce n’est pas le chemin d’annulation `/stop` et il ne
s’exécute pas lorsque l’utilisateur interrompt un tour. Renvoyez `{ action: "revise", reason }` pour demander
au harnais un passage de modèle supplémentaire avant la finalisation, `{ action:
"finalize", reason? }` pour forcer la finalisation, ou omettez un résultat pour continuer.
Les hooks natifs Codex `Stop` sont relayés dans ce hook en tant que décisions OpenClaw
`before_agent_finalize`.

Lorsque vous renvoyez `action: "revise"`, les Plugins peuvent inclure des métadonnées `retry` pour rendre
le passage de modèle supplémentaire borné et rejouable en toute sécurité :

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` est ajouté au motif de révision envoyé au harnais.
`idempotencyKey` permet à l’hôte de compter les nouvelles tentatives pour la même requête de plugin entre
des décisions de finalisation équivalentes, et `maxAttempts` limite le nombre de passages supplémentaires que
l’hôte autorisera avant de poursuivre avec la réponse finale naturelle.

Les plugins non intégrés qui ont besoin de hooks de conversation bruts (`before_model_resolve`,
`before_agent_reply`, `llm_input`, `llm_output`, `before_agent_finalize`,
`agent_end` ou `before_agent_run`) doivent définir :

```json
{
  "plugins": {
    "entries": {
      "my-plugin": {
        "hooks": {
          "allowConversationAccess": true
        }
      }
    }
  }
}
```

Les hooks qui modifient le prompt et les injections persistantes au tour suivant peuvent être désactivés par plugin
avec `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Extensions de session et injections au tour suivant

Les plugins de workflow peuvent conserver un petit état de session compatible JSON avec
`api.registerSessionExtension(...)` et le mettre à jour via la méthode Gateway
`sessions.pluginPatch`. Les lignes de session projettent l’état d’extension enregistré
via `pluginExtensions`, ce qui permet à Control UI et à d’autres clients d’afficher
un état détenu par le plugin sans connaître ses détails internes.

Utilisez `api.enqueueNextTurnInjection(...)` lorsqu’un plugin a besoin qu’un contexte persistant
atteigne le prochain tour du modèle exactement une fois. OpenClaw draine les injections en file d’attente avant
les hooks de prompt, supprime les injections expirées et déduplique par `idempotencyKey`
par plugin. C’est la bonne interface pour les reprises d’approbation, les résumés de politiques,
les deltas de moniteurs en arrière-plan et les continuations de commandes qui doivent être visibles par
le modèle au tour suivant, sans devenir du texte permanent de prompt système.

Les sémantiques de nettoyage font partie du contrat. Les callbacks de nettoyage d’extension de session et
de cycle de vie d’exécution reçoivent `reset`, `delete`, `disable` ou
`restart`. L’hôte supprime l’état d’extension de session persistant du plugin propriétaire
et les injections au tour suivant en attente pour reset/delete/disable ; restart conserve
l’état de session persistant tandis que les callbacks de nettoyage permettent aux plugins de libérer les tâches
du planificateur, le contexte d’exécution et d’autres ressources hors bande de l’ancienne génération
d’exécution.

## Hooks de message

Utilisez les hooks de message pour le routage au niveau du canal et la politique de livraison :

- `message_received` : observer le contenu entrant, l’expéditeur, `threadId`, `messageId`,
  `senderId`, la corrélation facultative d’exécution/session et les métadonnées.
- `message_sending` : réécrire `content` ou retourner `{ cancel: true }`.
- `message_sent` : observer la réussite ou l’échec final.

Pour les réponses TTS uniquement audio, `content` peut contenir la transcription parlée masquée
même lorsque la charge utile du canal n’a aucun texte/légende visible. Réécrire ce
`content` met à jour uniquement la transcription visible par le hook ; elle n’est pas rendue comme
légende média.

Les contextes de hooks de message exposent des champs de corrélation stables lorsqu’ils sont disponibles :
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` et `ctx.callDepth`. Préférez
ces champs de première classe avant de lire les métadonnées héritées.

Préférez les champs typés `threadId` et `replyToId` avant d’utiliser les métadonnées propres au canal.

Règles de décision :

- `message_sending` avec `cancel: true` est terminal.
- `message_sending` avec `cancel: false` est traité comme une absence de décision.
- Le `content` réécrit continue vers les hooks de priorité inférieure sauf si un hook ultérieur
  annule la livraison.

## Hooks d’installation

`before_install` s’exécute après l’analyse intégrée des installations de Skills et de plugins.
Retournez des résultats supplémentaires ou `{ block: true, blockReason }` pour arrêter
l’installation.

`block: true` est terminal. `block: false` est traité comme une absence de décision.

## Cycle de vie du Gateway

Utilisez `gateway_start` pour les services de plugin qui ont besoin d’un état détenu par le Gateway. Le
contexte expose `ctx.config`, `ctx.workspaceDir` et `ctx.getCron?.()` pour
l’inspection et les mises à jour de cron. Utilisez `gateway_stop` pour nettoyer les ressources
longue durée.

Ne vous appuyez pas sur le hook interne `gateway:startup` pour les services d’exécution
détenus par le plugin.

`cron_changed` se déclenche pour les événements de cycle de vie cron détenus par le Gateway avec une charge utile
d’événement typée couvrant les motifs `added`, `updated`, `removed`, `started`, `finished`
et `scheduled`. L’événement transporte un instantané `PluginHookGatewayCronJob`
(incluant `state.nextRunAtMs`, `state.lastRunStatus` et
`state.lastError` lorsqu’il est présent) ainsi qu’un `PluginHookGatewayCronDeliveryStatus`
de `not-requested` | `delivered` | `not-delivered` | `unknown`. Les événements
de suppression transportent toujours l’instantané de la tâche supprimée afin que les planificateurs externes puissent
réconcilier l’état. Utilisez `ctx.getCron?.()` et `ctx.config` depuis le contexte
d’exécution lors de la synchronisation de planificateurs de réveil externes, et conservez OpenClaw comme
source de vérité pour les vérifications d’échéance et l’exécution.

## Dépréciations à venir

Quelques surfaces adjacentes aux hooks sont dépréciées mais restent prises en charge. Migrez
avant la prochaine version majeure :

- **Enveloppes de canal en texte brut** dans les gestionnaires `inbound_claim` et `message_received`.
  Lisez `BodyForAgent` et les blocs structurés de contexte utilisateur
  au lieu d’analyser le texte d’enveloppe plat. Voir
  [Enveloppes de canal en texte brut → BodyForAgent](/fr/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** reste présent pour la compatibilité. Les nouveaux plugins doivent utiliser
  `before_model_resolve` et `before_prompt_build` au lieu de la phase combinée.
- **`onResolution` dans `before_tool_call`** utilise désormais l’union typée
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) au lieu d’un `string` libre.

Pour la liste complète — enregistrement de capacité mémoire, profil de réflexion du fournisseur,
fournisseurs d’authentification externes, types de découverte de fournisseurs, accesseurs d’exécution de tâche
et renommage `command-auth` → `command-status` — consultez
[Migration du SDK de plugin → Dépréciations actives](/fr/plugins/sdk-migration#active-deprecations).

## Connexe

- [Migration du SDK de plugin](/fr/plugins/sdk-migration) - dépréciations actives et calendrier de suppression
- [Créer des plugins](/fr/plugins/building-plugins)
- [Vue d’ensemble du SDK de plugin](/fr/plugins/sdk-overview)
- [Points d’entrée de plugin](/fr/plugins/sdk-entrypoints)
- [Hooks internes](/fr/automation/hooks)
- [Internes de l’architecture des plugins](/fr/plugins/architecture-internals)
