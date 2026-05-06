---
read_when:
    - Vous créez un plugin qui a besoin de `before_tool_call`, `before_agent_reply`, de hooks de message ou de hooks de cycle de vie
    - Vous devez bloquer, réécrire ou exiger une approbation pour les appels d’outils provenant d’un Plugin
    - Vous choisissez entre les points d’accroche internes et les points d’accroche de Plugin
summary: 'Points d’accroche de Plugin : intercepter les événements du cycle de vie de l’agent, de l’outil, du message, de la session et du Gateway'
title: Points d’ancrage Plugin
x-i18n:
    generated_at: "2026-05-06T07:32:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92a149e1b343ea2d3f55855c2d02f4a9519337f0450c8a1428d52cd77ab4046a
    source_path: plugins/hooks.md
    workflow: 16
---

Les points d'accroche de plugin sont des points d'extension en processus pour les plugins OpenClaw. Utilisez-les
lorsqu'un plugin doit inspecter ou modifier les exécutions d'agent, les appels d'outils, le flux de messages,
le cycle de vie des sessions, le routage des sous-agents, les installations ou le démarrage du Gateway.

Utilisez plutôt les [points d'accroche internes](/fr/automation/hooks) lorsque vous voulez un petit
script `HOOK.md` installé par l'opérateur pour les événements de commande et de Gateway tels que
`/new`, `/reset`, `/stop`, `agent:bootstrap` ou `gateway:startup`.

## Démarrage rapide

Enregistrez des points d'accroche de plugin typés avec `api.on(...)` depuis le point d'entrée de votre plugin :

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

Les gestionnaires de point d'accroche s'exécutent séquentiellement par `priority` décroissante. Les points d'accroche de même priorité
conservent l'ordre d'enregistrement.

`api.on(name, handler, opts?)` accepte :

- `priority` - ordre des gestionnaires (les valeurs plus élevées s'exécutent en premier).
- `timeoutMs` - budget facultatif par point d'accroche. Lorsqu'il est défini, l'exécuteur de points d'accroche interrompt ce
  gestionnaire après expiration du budget et continue avec le suivant, au lieu de
  laisser une configuration lente ou un travail de rappel consommer le délai d'expiration de modèle configuré par
  l'appelant. Omettez-le pour utiliser le délai d'observation/décision par défaut que
  l'exécuteur de points d'accroche applique de façon générique.

Les opérateurs peuvent aussi définir des budgets de point d'accroche sans modifier le code du plugin :

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
`api.on(..., { timeoutMs })` définie par le plugin. Chaque valeur configurée doit
être un entier positif ne dépassant pas 600000 millisecondes. Préférez les
remplacements par point d'accroche pour les points d'accroche connus comme lents afin qu'un plugin ne reçoive pas un budget plus long
partout.

Chaque point d'accroche reçoit `event.context.pluginConfig`, la configuration résolue pour le
plugin qui a enregistré ce gestionnaire. Utilisez-la pour les décisions de point d'accroche qui nécessitent
les options actuelles du plugin ; OpenClaw l'injecte par gestionnaire sans modifier
l'objet d'événement partagé vu par les autres plugins.

## Catalogue des points d'accroche

Les points d'accroche sont regroupés par surface qu'ils étendent. Les noms en **gras** acceptent un
résultat de décision (bloquer, annuler, remplacer ou demander une approbation) ; tous les autres sont
uniquement destinés à l'observation.

**Tour d'agent**

- `before_model_resolve` - remplacer le fournisseur ou le modèle avant le chargement des messages de session
- `agent_turn_prepare` - consommer les injections de tour de plugin en file d'attente et ajouter du contexte du même tour avant les points d'accroche de prompt
- `before_prompt_build` - ajouter du contexte dynamique ou du texte de prompt système avant l'appel au modèle
- `before_agent_start` - phase combinée uniquement pour la compatibilité ; préférez les deux points d'accroche ci-dessus
- **`before_agent_reply`** - court-circuiter le tour de modèle avec une réponse synthétique ou un silence
- **`before_agent_finalize`** - inspecter la réponse finale naturelle et demander un passage de modèle supplémentaire
- `agent_end` - observer les messages finaux, l'état de réussite et la durée d'exécution
- `heartbeat_prompt_contribution` - ajouter du contexte uniquement Heartbeat pour les plugins de surveillance en arrière-plan et de cycle de vie

**Observation de conversation**

- `model_call_started` / `model_call_ended` - observer les métadonnées nettoyées d'appel fournisseur/modèle, le minutage, le résultat et les hachages bornés d'identifiants de requête sans contenu de prompt ni de réponse
- `llm_input` - observer l'entrée du fournisseur (prompt système, prompt, historique)
- `llm_output` - observer la sortie du fournisseur

**Outils**

- **`before_tool_call`** - réécrire les paramètres d'outil, bloquer l'exécution ou demander une approbation
- `after_tool_call` - observer les résultats d'outil, les erreurs et la durée
- **`tool_result_persist`** - réécrire le message de l'assistant produit à partir d'un résultat d'outil
- **`before_message_write`** - inspecter ou bloquer l'écriture d'un message en cours (rare)

**Messages et livraison**

- **`inbound_claim`** - revendiquer un message entrant avant le routage vers l'agent (réponses synthétiques)
- `message_received` - observer le contenu entrant, l'expéditeur, le fil et les métadonnées
- **`message_sending`** - réécrire le contenu sortant ou annuler la livraison
- `message_sent` - observer la réussite ou l'échec de la livraison sortante
- **`before_dispatch`** - inspecter ou réécrire une distribution sortante avant le transfert au canal
- **`reply_dispatch`** - participer au pipeline final de distribution de réponse

**Sessions et Compaction**

- `session_start` / `session_end` - suivre les limites du cycle de vie de session
- `before_compaction` / `after_compaction` - observer ou annoter les cycles de Compaction
- `before_reset` - observer les événements de réinitialisation de session (`/reset`, réinitialisations programmatiques)

**Sous-agents**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` - coordonner le routage des sous-agents et la livraison de fin

**Cycle de vie**

- `gateway_start` / `gateway_stop` - démarrer ou arrêter les services appartenant au plugin avec le Gateway
- `cron_changed` - observer les changements de cycle de vie Cron appartenant au Gateway (ajouté, mis à jour, supprimé, démarré, terminé, planifié)
- **`before_install`** - inspecter les analyses d'installation de compétence ou de plugin et éventuellement bloquer

## Politique d'appel d'outil

`before_tool_call` reçoit :

- `event.toolName`
- `event.params`
- `event.runId` facultatif
- `event.toolCallId` facultatif
- des champs de contexte tels que `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (défini sur les exécutions pilotées par Cron) et le champ de diagnostic `ctx.trace`

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
- `params` réécrit les paramètres d'outil pour l'exécution.
- `requireApproval` met l'exécution de l'agent en pause et interroge l'utilisateur via les
  approbations de plugin. La commande `/approve` peut approuver à la fois les approbations exec et plugin.
- Un `block: true` de priorité inférieure peut toujours bloquer après qu'un point d'accroche de priorité supérieure
  a demandé une approbation.
- `onResolution` reçoit la décision d'approbation résolue - `allow-once`,
  `allow-always`, `deny`, `timeout` ou `cancelled`.

Les plugins intégrés qui nécessitent une politique de niveau hôte peuvent enregistrer des politiques d'outil de confiance
avec `api.registerTrustedToolPolicy(...)`. Elles s'exécutent avant les points d'accroche
`before_tool_call` ordinaires et avant les décisions de plugins externes. Utilisez-les uniquement
pour des barrières de confiance hôte telles que la politique d'espace de travail, l'application d'un budget ou
la sécurité de flux de travail réservés. Les plugins externes doivent utiliser les points d'accroche `before_tool_call`
normaux.

### Persistance des résultats d'outil

Les résultats d'outil peuvent inclure des `details` structurés pour le rendu d'interface, les diagnostics,
le routage de médias ou les métadonnées appartenant au plugin. Traitez `details` comme des métadonnées d'exécution,
pas comme du contenu de prompt :

- OpenClaw retire `toolResult.details` avant la relecture fournisseur et l'entrée de Compaction
  afin que les métadonnées ne deviennent pas du contexte de modèle.
- Les entrées de session persistantes ne conservent que des `details` bornés. Les détails surdimensionnés sont
  remplacés par un résumé compact et `persistedDetailsTruncated: true`.
- `tool_result_persist` et `before_message_write` s'exécutent avant le plafond final de
  persistance. Les points d'accroche doivent tout de même garder les `details` renvoyés petits et éviter
  de placer du texte pertinent pour le prompt uniquement dans `details` ; placez la sortie d'outil visible par le modèle
  dans `content`.

## Points d'accroche de prompt et de modèle

Utilisez les points d'accroche propres à chaque phase pour les nouveaux plugins :

- `before_model_resolve` : reçoit uniquement le prompt actuel et les
  métadonnées de pièce jointe. Renvoyez `providerOverride` ou `modelOverride`.
- `agent_turn_prepare` : reçoit le prompt actuel, les messages de session préparés
  et toutes les injections en file d'attente exactement une fois vidées pour cette session. Renvoyez
  `prependContext` ou `appendContext`.
- `before_prompt_build` : reçoit le prompt actuel et les messages de session.
  Renvoyez `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` ou `appendSystemContext`.
- `heartbeat_prompt_contribution` : s'exécute uniquement pour les tours Heartbeat et renvoie
  `prependContext` ou `appendContext`. Il est destiné aux moniteurs en arrière-plan
  qui doivent résumer l'état actuel sans modifier les tours initiés par l'utilisateur.

`before_agent_start` reste présent pour la compatibilité. Préférez les points d'accroche explicites ci-dessus
afin que votre plugin ne dépende pas d'une phase combinée héritée.

`before_agent_start` et `agent_end` incluent `event.runId` quand OpenClaw peut
identifier l'exécution active. La même valeur est également disponible sur `ctx.runId`.
Les exécutions pilotées par Cron exposent aussi `ctx.jobId` (l'identifiant de la tâche Cron d'origine) afin que
les points d'accroche de plugin puissent limiter les métriques, effets de bord ou états à une tâche planifiée
précise.

Pour les exécutions provenant d'un canal, `ctx.messageProvider` est la surface fournisseur telle que
`discord` ou `telegram`, tandis que `ctx.channelId` est l'identifiant de cible de conversation
quand OpenClaw peut en dériver un depuis la clé de session ou les
métadonnées de livraison.

`agent_end` est un point d'accroche d'observation et s'exécute en tâche de fond après le tour. L'exécuteur de
points d'accroche applique un délai d'expiration de 30 secondes afin qu'un plugin bloqué ou un point de terminaison
d'embeddings ne puisse pas laisser la promesse du point d'accroche en attente indéfiniment. Un délai d'expiration est journalisé et
OpenClaw continue ; cela n'annule pas le travail réseau appartenant au plugin sauf si le
plugin utilise également son propre signal d'abandon.

Utilisez `model_call_started` et `model_call_ended` pour la télémétrie d'appel fournisseur
qui ne doit pas recevoir de prompts bruts, d'historique, de réponses, d'en-têtes, de corps de requête
ou d'identifiants de requête fournisseur. Ces points d'accroche incluent des métadonnées stables telles que
`runId`, `callId`, `provider`, `model`, `api`/`transport` facultatifs,
`durationMs`/`outcome` terminaux, et `upstreamRequestIdHash` quand OpenClaw peut dériver un
hachage borné d'identifiant de requête fournisseur.

`before_agent_finalize` s'exécute uniquement lorsqu'un harnais est sur le point d'accepter une réponse
finale naturelle de l'assistant. Ce n'est pas le chemin d'annulation `/stop` et il ne
s'exécute pas lorsque l'utilisateur abandonne un tour. Renvoyez `{ action: "revise", reason }` pour demander
au harnais un passage de modèle supplémentaire avant la finalisation, `{ action:
"finalize", reason? }` pour forcer la finalisation, ou omettez un résultat pour continuer.
Les points d'accroche `Stop` natifs de Codex sont relayés vers ce point d'accroche comme décisions OpenClaw
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

`instruction` est ajoutée à la raison de révision envoyée au harnais.
`idempotencyKey` permet à l'hôte de compter les nouvelles tentatives pour la même demande de plugin à travers
des décisions de finalisation équivalentes, et `maxAttempts` plafonne le nombre de passages supplémentaires que
l'hôte autorisera avant de continuer avec la réponse finale naturelle.

Les plugins non intégrés qui nécessitent `llm_input`, `llm_output`,
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

Les points d'accroche qui modifient le prompt et les injections durables au tour suivant peuvent être désactivés par plugin
avec `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Extensions de session et injections au tour suivant

Les plugins de workflow peuvent conserver un petit état de session compatible JSON avec
`api.registerSessionExtension(...)` et le mettre à jour via la méthode Gateway
`sessions.pluginPatch`. Les lignes de session exposent l’état d’extension enregistré
via `pluginExtensions`, ce qui permet à l’interface utilisateur de contrôle et aux autres clients d’afficher
l’état appartenant au plugin sans connaître les détails internes du plugin.

Utilisez `api.enqueueNextTurnInjection(...)` lorsqu’un plugin a besoin qu’un contexte durable
atteigne exactement une fois le prochain tour du modèle. OpenClaw vide les injections mises en file d’attente avant
les hooks de prompt, supprime les injections expirées et les déduplique par `idempotencyKey`
par plugin. C’est le bon point d’intégration pour les reprises d’approbation, les résumés de politiques,
les deltas de moniteurs en arrière-plan et les continuations de commandes qui doivent être visibles par
le modèle au prochain tour, mais ne doivent pas devenir du texte permanent de prompt système.

Les sémantiques de nettoyage font partie du contrat. Le nettoyage des extensions de session et
les callbacks de nettoyage du cycle de vie d’exécution reçoivent `reset`, `delete`, `disable` ou
`restart`. L’hôte supprime l’état persistant de l’extension de session du plugin propriétaire
et les injections de prochain tour en attente pour reset/delete/disable ; restart conserve
l’état durable de session tandis que les callbacks de nettoyage permettent aux plugins de libérer les tâches
du planificateur, le contexte d’exécution et les autres ressources hors bande de l’ancienne génération
d’exécution.

## Hooks de message

Utilisez les hooks de message pour le routage et la politique de livraison au niveau du canal :

- `message_received` : observer le contenu entrant, l’expéditeur, `threadId`, `messageId`,
  `senderId`, la corrélation facultative d’exécution/session et les métadonnées.
- `message_sending` : réécrire `content` ou retourner `{ cancel: true }`.
- `message_sent` : observer la réussite ou l’échec final.

Pour les réponses TTS uniquement audio, `content` peut contenir la transcription vocale masquée
même lorsque la charge utile du canal n’a aucun texte ni aucune légende visible. Réécrire ce
`content` met seulement à jour la transcription visible par le hook ; elle n’est pas rendue comme
légende de média.

Les contextes de hooks de message exposent des champs de corrélation stables lorsqu’ils sont disponibles :
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` et `ctx.callDepth`. Préférez
ces champs de première classe avant de lire les anciennes métadonnées.

Préférez les champs typés `threadId` et `replyToId` avant d’utiliser les métadonnées
propres au canal.

Règles de décision :

- `message_sending` avec `cancel: true` est terminal.
- `message_sending` avec `cancel: false` est traité comme une absence de décision.
- Le `content` réécrit continue vers les hooks de priorité inférieure, sauf si un hook ultérieur
  annule la livraison.

## Hooks d’installation

`before_install` s’exécute après l’analyse intégrée des installations de Skills et de plugins.
Retournez des résultats supplémentaires ou `{ block: true, blockReason }` pour arrêter
l’installation.

`block: true` est terminal. `block: false` est traité comme une absence de décision.

## Cycle de vie du Gateway

Utilisez `gateway_start` pour les services de plugin qui ont besoin d’un état appartenant au Gateway. Le
contexte expose `ctx.config`, `ctx.workspaceDir` et `ctx.getCron?.()` pour
l’inspection et les mises à jour de cron. Utilisez `gateway_stop` pour nettoyer les ressources
de longue durée.

Ne vous appuyez pas sur le hook interne `gateway:startup` pour les services d’exécution
appartenant au plugin.

`cron_changed` se déclenche pour les événements de cycle de vie de cron appartenant au Gateway avec une
charge utile d’événement typée couvrant les motifs `added`, `updated`, `removed`, `started`, `finished`
et `scheduled`. L’événement transporte un instantané `PluginHookGatewayCronJob`
(incluant `state.nextRunAtMs`, `state.lastRunStatus` et
`state.lastError` lorsqu’ils sont présents) ainsi qu’un `PluginHookGatewayCronDeliveryStatus`
de `not-requested` | `delivered` | `not-delivered` | `unknown`. Les événements de suppression
transportent toujours l’instantané de la tâche supprimée afin que les planificateurs externes puissent
réconcilier l’état. Utilisez `ctx.getCron?.()` et `ctx.config` depuis le contexte
d’exécution lors de la synchronisation de planificateurs de réveil externes, et gardez OpenClaw comme
source de vérité pour les contrôles d’échéance et l’exécution.

## Dépréciations à venir

Quelques surfaces adjacentes aux hooks sont dépréciées mais toujours prises en charge. Migrez
avant la prochaine version majeure :

- **Enveloppes de canal en texte brut** dans les gestionnaires `inbound_claim` et `message_received`.
  Lisez `BodyForAgent` et les blocs structurés de contexte utilisateur
  au lieu d’analyser le texte plat de l’enveloppe. Consultez
  [Enveloppes de canal en texte brut → BodyForAgent](/fr/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** reste disponible pour la compatibilité. Les nouveaux plugins doivent utiliser
  `before_model_resolve` et `before_prompt_build` au lieu de la phase combinée.
- **`onResolution` dans `before_tool_call`** utilise maintenant l’union typée
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) au lieu d’une `string` libre.

Pour la liste complète — enregistrement de la capacité mémoire, profil de réflexion du fournisseur,
fournisseurs d’authentification externes, types de découverte de fournisseurs, accesseurs d’exécution
de tâches, et le renommage `command-auth` → `command-status` — consultez
[Migration du Plugin SDK → Dépréciations actives](/fr/plugins/sdk-migration#active-deprecations).

## Connexe

- [Migration du Plugin SDK](/fr/plugins/sdk-migration) - dépréciations actives et calendrier de suppression
- [Création de plugins](/fr/plugins/building-plugins)
- [Présentation du Plugin SDK](/fr/plugins/sdk-overview)
- [Points d’entrée du Plugin](/fr/plugins/sdk-entrypoints)
- [Hooks internes](/fr/automation/hooks)
- [Architecture interne des plugins](/fr/plugins/architecture-internals)
