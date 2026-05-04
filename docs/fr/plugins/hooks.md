---
read_when:
    - Vous créez un Plugin qui nécessite before_tool_call, before_agent_reply, des hooks de message ou des hooks de cycle de vie
    - Vous devez bloquer, réécrire ou exiger une approbation pour les appels d’outils provenant d’un plugin.
    - Vous choisissez entre des hooks internes et des hooks de Plugin
summary: 'Points d’accroche de Plugin : intercepter les événements du cycle de vie des agents, des outils, des messages, des sessions et du Gateway'
title: Points d’ancrage de Plugin
x-i18n:
    generated_at: "2026-05-04T18:23:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37c7273036463c87e478db5678822b676c89447caee65f2f3f47a45194d1e37b
    source_path: plugins/hooks.md
    workflow: 16
---

Les hooks de Plugin sont des points d’extension en processus pour les plugins OpenClaw. Utilisez-les
lorsqu’un plugin doit inspecter ou modifier les exécutions d’agents, les appels d’outils, le flux des messages,
le cycle de vie des sessions, le routage des sous-agents, les installations ou le démarrage du Gateway.

Utilisez plutôt les [hooks internes](/fr/automation/hooks) lorsque vous voulez un petit
script `HOOK.md` installé par l’opérateur pour les événements de commande et du Gateway, comme
`/new`, `/reset`, `/stop`, `agent:bootstrap` ou `gateway:startup`.

## Démarrage rapide

Enregistrez des hooks de plugin typés avec `api.on(...)` depuis le point d’entrée de votre plugin :

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

- `priority` — ordre des gestionnaires (les valeurs plus élevées s’exécutent en premier).
- `timeoutMs` — budget facultatif par hook. Lorsqu’il est défini, le lanceur de hooks interrompt ce
  gestionnaire une fois le budget écoulé et continue avec le suivant, au lieu de
  laisser une configuration lente ou un travail de rappel consommer le délai d’expiration de modèle configuré par l’appelant.
  Omettez-le pour utiliser le délai d’expiration par défaut d’observation/décision que le
  lanceur de hooks applique de manière générique.

Les opérateurs peuvent aussi définir des budgets de hooks sans modifier le code du plugin :

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
`api.on(..., { timeoutMs })` écrite par le plugin. Chaque valeur configurée doit
être un entier positif inférieur ou égal à 600000 millisecondes. Préférez les
remplacements par hook pour les hooks connus comme lents, afin qu’un plugin n’obtienne pas un budget plus long
partout.

Chaque hook reçoit `event.context.pluginConfig`, la configuration résolue pour le
plugin qui a enregistré ce gestionnaire. Utilisez-la pour les décisions de hook qui nécessitent
les options actuelles du plugin ; OpenClaw l’injecte par gestionnaire sans muter
l’objet d’événement partagé vu par les autres plugins.

## Catalogue des hooks

Les hooks sont regroupés selon la surface qu’ils étendent. Les noms en **gras** acceptent un
résultat de décision (bloquer, annuler, remplacer ou demander une approbation) ; tous les autres servent
uniquement à l’observation.

**Tour d’agent**

- `before_model_resolve` — remplacer le fournisseur ou le modèle avant le chargement des messages de session
- `agent_turn_prepare` — consommer les injections de tour de plugin en file d’attente et ajouter du contexte au même tour avant les hooks de prompt
- `before_prompt_build` — ajouter du contexte dynamique ou du texte de prompt système avant l’appel au modèle
- `before_agent_start` — phase combinée uniquement pour compatibilité ; préférez les deux hooks ci-dessus
- **`before_agent_reply`** — court-circuiter le tour de modèle avec une réponse synthétique ou un silence
- **`before_agent_finalize`** — inspecter la réponse finale naturelle et demander un passage de modèle supplémentaire
- `agent_end` — observer les messages finaux, l’état de réussite et la durée d’exécution
- `heartbeat_prompt_contribution` — ajouter du contexte réservé au Heartbeat pour les plugins de surveillance en arrière-plan et de cycle de vie

**Observation de la conversation**

- `model_call_started` / `model_call_ended` — observer les métadonnées, le minutage, le résultat et les hachages bornés d’identifiants de requête des appels fournisseur/modèle nettoyés, sans contenu de prompt ni de réponse
- `llm_input` — observer l’entrée du fournisseur (prompt système, prompt, historique)
- `llm_output` — observer la sortie du fournisseur

**Outils**

- **`before_tool_call`** — réécrire les paramètres d’outil, bloquer l’exécution ou demander une approbation
- `after_tool_call` — observer les résultats d’outil, les erreurs et la durée
- **`tool_result_persist`** — réécrire le message assistant produit à partir d’un résultat d’outil
- **`before_message_write`** — inspecter ou bloquer l’écriture d’un message en cours (rare)

**Messages et livraison**

- **`inbound_claim`** — revendiquer un message entrant avant le routage d’agent (réponses synthétiques)
- `message_received` — observer le contenu entrant, l’expéditeur, le fil et les métadonnées
- **`message_sending`** — réécrire le contenu sortant ou annuler la livraison
- `message_sent` — observer la réussite ou l’échec de livraison sortante
- **`before_dispatch`** — inspecter ou réécrire une expédition sortante avant le transfert au canal
- **`reply_dispatch`** — participer au pipeline final d’expédition de réponse

**Sessions et Compaction**

- `session_start` / `session_end` — suivre les limites du cycle de vie des sessions
- `before_compaction` / `after_compaction` — observer ou annoter les cycles de Compaction
- `before_reset` — observer les événements de réinitialisation de session (`/reset`, réinitialisations programmatiques)

**Sous-agents**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — coordonner le routage des sous-agents et la livraison de fin

**Cycle de vie**

- `gateway_start` / `gateway_stop` — démarrer ou arrêter les services appartenant au plugin avec le Gateway
- `cron_changed` — observer les changements du cycle de vie du Cron appartenant au gateway (ajouté, mis à jour, supprimé, démarré, terminé, planifié)
- **`before_install`** — inspecter les analyses d’installation de Skills ou de plugins et éventuellement bloquer

## Politique d’appel d’outil

`before_tool_call` reçoit :

- `event.toolName`
- `event.params`
- `event.runId` facultatif
- `event.toolCallId` facultatif
- des champs de contexte comme `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (défini sur les exécutions pilotées par Cron) et le diagnostic `ctx.trace`

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
- `params` réécrit les paramètres d’outil pour l’exécution.
- `requireApproval` met l’exécution de l’agent en pause et interroge l’utilisateur via les approbations de plugin.
  La commande `/approve` peut approuver à la fois les approbations exec et les approbations de plugin.
- Un `block: true` de priorité inférieure peut encore bloquer après qu’un hook de priorité supérieure
  a demandé une approbation.
- `onResolution` reçoit la décision d’approbation résolue — `allow-once`,
  `allow-always`, `deny`, `timeout` ou `cancelled`.

Les plugins groupés qui nécessitent une politique au niveau de l’hôte peuvent enregistrer des politiques d’outil de confiance
avec `api.registerTrustedToolPolicy(...)`. Celles-ci s’exécutent avant les hooks
`before_tool_call` ordinaires et avant les décisions de plugins externes. Utilisez-les uniquement
pour des garde-fous approuvés par l’hôte, comme la politique d’espace de travail, l’application du budget ou
la sécurité des workflows réservés. Les plugins externes doivent utiliser les hooks `before_tool_call`
normaux.

### Persistance des résultats d’outil

Les résultats d’outil peuvent inclure des `details` structurés pour le rendu d’interface utilisateur, les diagnostics,
le routage de médias ou les métadonnées appartenant au plugin. Traitez `details` comme des métadonnées d’exécution,
pas comme du contenu de prompt :

- OpenClaw supprime `toolResult.details` avant la relecture fournisseur et l’entrée de Compaction
  afin que les métadonnées ne deviennent pas du contexte de modèle.
- Les entrées de session persistées ne conservent que des `details` bornés. Les détails surdimensionnés sont
  remplacés par un résumé compact et `persistedDetailsTruncated: true`.
- `tool_result_persist` et `before_message_write` s’exécutent avant le plafond de persistance final.
  Les hooks doivent malgré tout conserver de petits `details` renvoyés et éviter
  de placer du texte pertinent pour le prompt uniquement dans `details` ; mettez la sortie d’outil visible par le modèle
  dans `content`.

## Hooks de prompt et de modèle

Utilisez les hooks propres à chaque phase pour les nouveaux plugins :

- `before_model_resolve` : reçoit uniquement le prompt actuel et les métadonnées de pièce jointe.
  Renvoyez `providerOverride` ou `modelOverride`.
- `agent_turn_prepare` : reçoit le prompt actuel, les messages de session préparés
  et toutes les injections en file d’attente exactement une fois vidées pour cette session. Renvoyez
  `prependContext` ou `appendContext`.
- `before_prompt_build` : reçoit le prompt actuel et les messages de session.
  Renvoyez `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` ou `appendSystemContext`.
- `heartbeat_prompt_contribution` : s’exécute uniquement pour les tours de Heartbeat et renvoie
  `prependContext` ou `appendContext`. Il est destiné aux surveillants en arrière-plan
  qui doivent résumer l’état actuel sans modifier les tours initiés par l’utilisateur.

`before_agent_start` reste disponible pour compatibilité. Préférez les hooks explicites ci-dessus
afin que votre plugin ne dépende pas d’une phase combinée héritée.

`before_agent_start` et `agent_end` incluent `event.runId` lorsqu’OpenClaw peut
identifier l’exécution active. La même valeur est aussi disponible sur `ctx.runId`.
Les exécutions pilotées par Cron exposent également `ctx.jobId` (l’identifiant de la tâche Cron d’origine) afin que
les hooks de plugin puissent limiter les métriques, les effets de bord ou l’état à une tâche planifiée
spécifique.

Pour les exécutions issues d’un canal, `ctx.messageProvider` est la surface du fournisseur, comme
`discord` ou `telegram`, tandis que `ctx.channelId` est l’identifiant de cible de conversation
lorsqu’OpenClaw peut en déduire un à partir de la clé de session ou des métadonnées de livraison.

`agent_end` est un hook d’observation et s’exécute en mode fire-and-forget après le tour. Le
lanceur de hooks applique un délai d’expiration de 30 secondes afin qu’un plugin bloqué ou un
endpoint d’embedding ne puisse pas laisser la promesse du hook en attente indéfiniment. Un délai d’expiration est journalisé et
OpenClaw continue ; il n’annule pas le travail réseau appartenant au plugin sauf si le
plugin utilise aussi son propre signal d’abandon.

Utilisez `model_call_started` et `model_call_ended` pour la télémétrie d’appel fournisseur
qui ne doit pas recevoir les prompts bruts, l’historique, les réponses, les en-têtes, les corps de requête
ou les identifiants de requête fournisseur. Ces hooks incluent des métadonnées stables comme
`runId`, `callId`, `provider`, `model`, les champs facultatifs `api`/`transport`, les champs terminaux
`durationMs`/`outcome` et `upstreamRequestIdHash` lorsqu’OpenClaw peut dériver un
hachage borné de l’identifiant de requête fournisseur.

`before_agent_finalize` s’exécute uniquement lorsqu’un harnais est sur le point d’accepter une réponse assistant finale
naturelle. Ce n’est pas le chemin d’annulation `/stop` et il ne
s’exécute pas lorsque l’utilisateur interrompt un tour. Renvoyez `{ action: "revise", reason }` pour demander
au harnais un passage de modèle supplémentaire avant la finalisation, `{ action:
"finalize", reason? }` pour forcer la finalisation, ou omettez un résultat pour continuer.
Les hooks natifs Codex `Stop` sont relayés dans ce hook comme décisions OpenClaw
`before_agent_finalize`.

Lors du renvoi de `action: "revise"`, les plugins peuvent inclure des métadonnées `retry` pour rendre
le passage de modèle supplémentaire borné et sûr à rejouer :

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` est ajouté à la raison de révision envoyée au harnais.
`idempotencyKey` permet à l’hôte de compter les nouvelles tentatives pour la même demande de plugin sur
des décisions de finalisation équivalentes, et `maxAttempts` limite le nombre de passages supplémentaires que
l’hôte autorisera avant de continuer avec la réponse finale naturelle.

Les plugins non groupés qui ont besoin de `llm_input`, `llm_output`,
`before_agent_finalize` ou `agent_end` doivent définir :

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

Les hooks qui modifient le prompt et les injections durables au tour suivant peuvent être désactivés par plugin
avec `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Extensions de session et injections au tour suivant

Les plugins de workflow peuvent conserver un petit état de session compatible JSON avec
`api.registerSessionExtension(...)` et le mettre à jour via la méthode Gateway
`sessions.pluginPatch`. Les lignes de session projettent l’état d’extension enregistré
via `pluginExtensions`, ce qui permet à Control UI et aux autres clients d’afficher
un statut appartenant au plugin sans connaître les détails internes du plugin.

Utilisez `api.enqueueNextTurnInjection(...)` lorsqu’un plugin doit faire parvenir un contexte durable
au prochain tour de modèle exactement une fois. OpenClaw vide les injections en file avant
les hooks de prompt, supprime les injections expirées et déduplique par `idempotencyKey`
par plugin. C’est le bon point d’intégration pour les reprises d’approbation, les résumés de politiques,
les deltas de moniteurs en arrière-plan et les continuations de commande qui doivent être visibles par
le modèle au tour suivant, mais ne doivent pas devenir du texte permanent du prompt système.

Les sémantiques de nettoyage font partie du contrat. Les callbacks de nettoyage des extensions de session et
du cycle de vie d’exécution reçoivent `reset`, `delete`, `disable` ou
`restart`. L’hôte supprime l’état persistant d’extension de session du plugin propriétaire
et les injections en attente pour le prochain tour lors de reset/delete/disable ; restart conserve
l’état de session durable tandis que les callbacks de nettoyage permettent aux plugins de libérer les tâches
du planificateur, le contexte d’exécution et d’autres ressources hors bande de l’ancienne génération
d’exécution.

## Hooks de message

Utilisez les hooks de message pour le routage et la politique de livraison au niveau du canal :

- `message_received` : observer le contenu entrant, l’expéditeur, `threadId`, `messageId`,
  `senderId`, la corrélation facultative avec une exécution/session, et les métadonnées.
- `message_sending` : réécrire `content` ou renvoyer `{ cancel: true }`.
- `message_sent` : observer la réussite ou l’échec final.

Pour les réponses TTS uniquement audio, `content` peut contenir la transcription vocale masquée
même lorsque la charge utile du canal n’a pas de texte/légende visible. Réécrire ce
`content` met uniquement à jour la transcription visible par le hook ; elle n’est pas affichée comme
légende média.

Les contextes de hook de message exposent des champs de corrélation stables lorsqu’ils sont disponibles :
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` et `ctx.callDepth`. Préférez
ces champs de première classe avant de lire les métadonnées héritées.

Préférez les champs typés `threadId` et `replyToId` avant d’utiliser des
métadonnées propres au canal.

Règles de décision :

- `message_sending` avec `cancel: true` est terminal.
- `message_sending` avec `cancel: false` est traité comme une absence de décision.
- Le `content` réécrit continue vers les hooks de priorité inférieure, sauf si un hook ultérieur
  annule la livraison.

## Hooks d’installation

`before_install` s’exécute après l’analyse intégrée des installations de skill et de plugin.
Renvoyez des constats supplémentaires ou `{ block: true, blockReason }` pour arrêter
l’installation.

`block: true` est terminal. `block: false` est traité comme une absence de décision.

## Cycle de vie du Gateway

Utilisez `gateway_start` pour les services de plugin qui ont besoin d’un état appartenant au Gateway. Le
contexte expose `ctx.config`, `ctx.workspaceDir` et `ctx.getCron?.()` pour
l’inspection et les mises à jour de cron. Utilisez `gateway_stop` pour nettoyer les
ressources de longue durée.

Ne vous appuyez pas sur le hook interne `gateway:startup` pour les services d’exécution
appartenant au plugin.

`cron_changed` se déclenche pour les événements de cycle de vie cron appartenant au gateway avec une charge utile
d’événement typée couvrant les raisons `added`, `updated`, `removed`, `started`, `finished`
et `scheduled`. L’événement transporte un instantané `PluginHookGatewayCronJob`
(y compris `state.nextRunAtMs`, `state.lastRunStatus` et
`state.lastError` lorsqu’ils sont présents), ainsi qu’un `PluginHookGatewayCronDeliveryStatus`
valant `not-requested` | `delivered` | `not-delivered` | `unknown`. Les événements
de suppression transportent toujours l’instantané de la tâche supprimée afin que les planificateurs externes puissent
réconcilier l’état. Utilisez `ctx.getCron?.()` et `ctx.config` depuis le contexte
d’exécution lors de la synchronisation de planificateurs de réveil externes, et gardez OpenClaw comme
source de vérité pour les contrôles d’échéance et l’exécution.

## Dépréciations à venir

Quelques surfaces adjacentes aux hooks sont dépréciées mais restent prises en charge. Migrez
avant la prochaine version majeure :

- **Enveloppes de canal en texte brut** dans les gestionnaires `inbound_claim` et `message_received`.
  Lisez `BodyForAgent` et les blocs structurés de contexte utilisateur
  au lieu d’analyser le texte plat de l’enveloppe. Consultez
  [Enveloppes de canal en texte brut → BodyForAgent](/fr/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** reste disponible pour compatibilité. Les nouveaux plugins doivent utiliser
  `before_model_resolve` et `before_prompt_build` au lieu de la phase
  combinée.
- **`onResolution` dans `before_tool_call`** utilise désormais l’union typée
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) au lieu d’un `string` libre.

Pour la liste complète — enregistrement de capacité mémoire, profil de réflexion du fournisseur,
fournisseurs d’authentification externes, types de découverte de fournisseurs, accesseurs d’exécution de tâche
et renommage de `command-auth` en `command-status` — consultez
[Migration du Plugin SDK → Dépréciations actives](/fr/plugins/sdk-migration#active-deprecations).

## Articles connexes

- [Migration du Plugin SDK](/fr/plugins/sdk-migration) — dépréciations actives et calendrier de suppression
- [Créer des plugins](/fr/plugins/building-plugins)
- [Vue d’ensemble du Plugin SDK](/fr/plugins/sdk-overview)
- [Points d’entrée des plugins](/fr/plugins/sdk-entrypoints)
- [Hooks internes](/fr/automation/hooks)
- [Détails internes de l’architecture des plugins](/fr/plugins/architecture-internals)
