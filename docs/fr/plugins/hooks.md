---
read_when:
    - Vous créez un Plugin qui a besoin de before_tool_call, before_agent_reply, de points d’ancrage de message ou de points d’ancrage de cycle de vie
    - Vous devez bloquer, réécrire ou exiger une approbation pour les appels d’outils d’un Plugin
    - Vous choisissez entre les points d’accroche internes et les points d’accroche de Plugin
summary: 'Hooks de Plugin : intercepter les événements du cycle de vie de l’agent, de l’outil, du message, de la session et du Gateway'
title: Points d’accroche de Plugin
x-i18n:
    generated_at: "2026-05-03T21:36:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2c4ed060f1b89917e1f2f46d2da9448cd562edbcd6ce03bc9b1a83da3ed9a591
    source_path: plugins/hooks.md
    workflow: 16
---

Les hooks de plugin sont des points d'extension en processus pour les plugins OpenClaw. Utilisez-les
quand un plugin doit inspecter ou modifier les exécutions d'agent, les appels d'outils, le flux de messages,
le cycle de vie des sessions, le routage des sous-agents, les installations ou le démarrage du Gateway.

Utilisez plutôt les [hooks internes](/fr/automation/hooks) lorsque vous voulez un petit
script `HOOK.md` installé par un opérateur pour les événements de commande et de Gateway comme
`/new`, `/reset`, `/stop`, `agent:bootstrap` ou `gateway:startup`.

## Démarrage rapide

Enregistrez des hooks de plugin typés avec `api.on(...)` depuis le point d'entrée de votre plugin :

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

Les gestionnaires de hooks s'exécutent séquentiellement par `priority` décroissante. Les hooks
de même priorité conservent leur ordre d'enregistrement.

`api.on(name, handler, opts?)` accepte :

- `priority` — ordre des gestionnaires (les valeurs les plus élevées s'exécutent en premier).
- `timeoutMs` — budget facultatif par hook. Lorsqu'il est défini, l'exécuteur de hooks interrompt ce
  gestionnaire une fois le budget écoulé et continue avec le suivant, au lieu de
  laisser une configuration lente ou un travail de rappel consommer le délai d'expiration de modèle
  configuré par l'appelant. Omettez-le pour utiliser le délai d'observation/de décision par défaut que
  l'exécuteur de hooks applique de manière générique.

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
`api.on(..., { timeoutMs })` définie par l'auteur du plugin. Chaque valeur configurée doit
être un entier positif inférieur ou égal à 600000 millisecondes. Préférez les
remplacements par hook pour les hooks connus comme lents afin qu'un plugin n'obtienne pas un budget plus long
partout.

Chaque hook reçoit `event.context.pluginConfig`, la configuration résolue du
plugin qui a enregistré ce gestionnaire. Utilisez-la pour les décisions de hooks qui nécessitent
les options actuelles du plugin ; OpenClaw l'injecte par gestionnaire sans modifier l'objet
d'événement partagé vu par les autres plugins.

## Catalogue des hooks

Les hooks sont regroupés par surface qu'ils étendent. Les noms en **gras** acceptent un
résultat de décision (bloquer, annuler, remplacer ou demander une approbation) ; tous les autres sont
uniquement destinés à l'observation.

**Tour d'agent**

- `before_model_resolve` — remplacer le fournisseur ou le modèle avant le chargement des messages de session
- `agent_turn_prepare` — consommer les injections de tour de plugin en file d'attente et ajouter du contexte au même tour avant les hooks d'invite
- `before_prompt_build` — ajouter du contexte dynamique ou du texte d'invite système avant l'appel au modèle
- `before_agent_start` — phase combinée uniquement pour compatibilité ; préférez les deux hooks ci-dessus
- **`before_agent_reply`** — court-circuiter le tour de modèle avec une réponse synthétique ou le silence
- **`before_agent_finalize`** — inspecter la réponse finale naturelle et demander une passe de modèle supplémentaire
- `agent_end` — observer les messages finaux, l'état de réussite et la durée d'exécution
- `heartbeat_prompt_contribution` — ajouter du contexte réservé au Heartbeat pour les plugins de surveillance en arrière-plan et de cycle de vie

**Observation de conversation**

- `model_call_started` / `model_call_ended` — observer les métadonnées nettoyées des appels fournisseur/modèle, leur durée, leur résultat et les hachages bornés d'identifiants de requête sans contenu d'invite ni de réponse
- `llm_input` — observer l'entrée du fournisseur (invite système, invite, historique)
- `llm_output` — observer la sortie du fournisseur

**Outils**

- **`before_tool_call`** — réécrire les paramètres d'outil, bloquer l'exécution ou demander une approbation
- `after_tool_call` — observer les résultats d'outil, les erreurs et la durée
- **`tool_result_persist`** — réécrire le message de l'assistant produit à partir d'un résultat d'outil
- **`before_message_write`** — inspecter ou bloquer l'écriture d'un message en cours (rare)

**Messages et livraison**

- **`inbound_claim`** — revendiquer un message entrant avant le routage de l'agent (réponses synthétiques)
- `message_received` — observer le contenu entrant, l'expéditeur, le fil et les métadonnées
- **`message_sending`** — réécrire le contenu sortant ou annuler la livraison
- `message_sent` — observer la réussite ou l'échec de livraison sortante
- **`before_dispatch`** — inspecter ou réécrire une répartition sortante avant le transfert au canal
- **`reply_dispatch`** — participer au pipeline final de répartition des réponses

**Sessions et Compaction**

- `session_start` / `session_end` — suivre les limites du cycle de vie de session
- `before_compaction` / `after_compaction` — observer ou annoter les cycles de Compaction
- `before_reset` — observer les événements de réinitialisation de session (`/reset`, réinitialisations programmatiques)

**Sous-agents**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — coordonner le routage des sous-agents et la livraison de fin d'exécution

**Cycle de vie**

- `gateway_start` / `gateway_stop` — démarrer ou arrêter les services appartenant au plugin avec le Gateway
- `cron_changed` — observer les changements du cycle de vie Cron appartenant au Gateway (ajouté, mis à jour, supprimé, démarré, terminé, planifié)
- **`before_install`** — inspecter les analyses d'installation de skill ou de plugin et éventuellement bloquer

## Politique d'appel d'outil

`before_tool_call` reçoit :

- `event.toolName`
- `event.params`
- `event.runId` facultatif
- `event.toolCallId` facultatif
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
- `params` réécrit les paramètres de l'outil pour l'exécution.
- `requireApproval` suspend l'exécution de l'agent et interroge l'utilisateur via les approbations de plugin. La commande `/approve` peut approuver à la fois les approbations exec et plugin.
- Un `block: true` de priorité inférieure peut toujours bloquer après qu'un hook de priorité supérieure
  a demandé une approbation.
- `onResolution` reçoit la décision d'approbation résolue — `allow-once`,
  `allow-always`, `deny`, `timeout` ou `cancelled`.

Les plugins groupés qui nécessitent une politique au niveau de l'hôte peuvent enregistrer des politiques d'outil de confiance
avec `api.registerTrustedToolPolicy(...)`. Elles s'exécutent avant les hooks
`before_tool_call` ordinaires et avant les décisions de plugins externes. Utilisez-les uniquement
pour des contrôles approuvés par l'hôte comme la politique d'espace de travail, l'application de budget ou
la sécurité des flux de travail réservés. Les plugins externes doivent utiliser les hooks `before_tool_call`
normaux.

### Persistance des résultats d'outil

Les résultats d'outil peuvent inclure des `details` structurés pour le rendu d'interface, les diagnostics,
le routage de média ou les métadonnées appartenant au plugin. Traitez `details` comme des métadonnées d'exécution,
pas comme du contenu d'invite :

- OpenClaw supprime `toolResult.details` avant la relecture fournisseur et l'entrée de Compaction
  afin que les métadonnées ne deviennent pas du contexte de modèle.
- Les entrées de session persistées ne conservent que des `details` bornés. Les détails surdimensionnés sont
  remplacés par un résumé compact et `persistedDetailsTruncated: true`.
- `tool_result_persist` et `before_message_write` s'exécutent avant le plafonnement final
  de persistance. Les hooks doivent tout de même garder les `details` renvoyés petits et éviter
  de placer du texte pertinent pour l'invite uniquement dans `details` ; placez la sortie d'outil visible par le modèle
  dans `content`.

## Hooks d'invite et de modèle

Utilisez les hooks propres à chaque phase pour les nouveaux plugins :

- `before_model_resolve` : reçoit uniquement l'invite actuelle et les métadonnées
  de pièce jointe. Renvoyez `providerOverride` ou `modelOverride`.
- `agent_turn_prepare` : reçoit l'invite actuelle, les messages de session préparés
  et les injections en file d'attente exactement une fois vidées pour cette session. Renvoyez
  `prependContext` ou `appendContext`.
- `before_prompt_build` : reçoit l'invite actuelle et les messages de session.
  Renvoyez `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` ou `appendSystemContext`.
- `heartbeat_prompt_contribution` : s'exécute uniquement pour les tours Heartbeat et renvoie
  `prependContext` ou `appendContext`. Il est destiné aux surveillances en arrière-plan
  qui doivent résumer l'état actuel sans modifier les tours initiés par l'utilisateur.

`before_agent_start` reste disponible pour compatibilité. Préférez les hooks explicites ci-dessus
afin que votre plugin ne dépende pas d'une ancienne phase combinée.

`before_agent_start` et `agent_end` incluent `event.runId` quand OpenClaw peut
identifier l'exécution active. La même valeur est aussi disponible dans `ctx.runId`.
Les exécutions déclenchées par Cron exposent aussi `ctx.jobId` (l'identifiant de la tâche Cron d'origine) afin que
les hooks de plugin puissent limiter les métriques, les effets secondaires ou l'état à une tâche planifiée
spécifique.

Pour les exécutions provenant d'un canal, `ctx.messageProvider` est la surface fournisseur comme
`discord` ou `telegram`, tandis que `ctx.channelId` est l'identifiant cible de conversation
quand OpenClaw peut le déduire de la clé de session ou des métadonnées de livraison.

`agent_end` est un hook d'observation et s'exécute en mode fire-and-forget après le tour. L'
exécuteur de hooks applique un délai d'expiration de 30 secondes afin qu'un plugin bloqué ou un point de terminaison
d'embedding ne puisse pas laisser la promesse du hook en attente indéfiniment. Un délai d'expiration est journalisé et
OpenClaw continue ; il n'annule pas le travail réseau appartenant au plugin, sauf si le
plugin utilise aussi son propre signal d'abandon.

Utilisez `model_call_started` et `model_call_ended` pour la télémétrie d'appel fournisseur
qui ne doit pas recevoir les invites brutes, l'historique, les réponses, les en-têtes, les corps de requête
ou les identifiants de requête fournisseur. Ces hooks incluent des métadonnées stables comme
`runId`, `callId`, `provider`, `model`, `api`/`transport` facultatifs, les valeurs terminales
`durationMs`/`outcome` et `upstreamRequestIdHash` quand OpenClaw peut dériver un
hachage borné d'identifiant de requête fournisseur.

`before_agent_finalize` s'exécute uniquement lorsqu'un harnais est sur le point d'accepter une
réponse finale naturelle de l'assistant. Ce n'est pas le chemin d'annulation `/stop` et il ne
s'exécute pas lorsque l'utilisateur interrompt un tour. Renvoyez `{ action: "revise", reason }` pour demander
au harnais une passe de modèle supplémentaire avant la finalisation, `{ action:
"finalize", reason? }` pour forcer la finalisation, ou omettez le résultat pour continuer.
Les hooks `Stop` natifs de Codex sont relayés dans ce hook sous forme de décisions OpenClaw
`before_agent_finalize`.

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

Les hooks qui modifient les invites et les injections durables au prochain tour peuvent être désactivés par plugin
avec `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Extensions de session et injections au prochain tour

Les plugins de workflow peuvent persister un petit état de session compatible JSON avec
`api.registerSessionExtension(...)` et le mettre à jour via la méthode Gateway
`sessions.pluginPatch`. Les lignes de session projettent l'état des extensions enregistrées
via `pluginExtensions`, ce qui permet à Control UI et à d'autres clients d'afficher
l'état appartenant au plugin sans connaître les détails internes du plugin.

Utilisez `api.enqueueNextTurnInjection(...)` lorsqu’un plugin a besoin d’un contexte durable pour
atteindre exactement une fois le prochain tour du modèle. OpenClaw vide les injections en file d’attente avant
les hooks d’invite, supprime les injections expirées et déduplique par `idempotencyKey`
par plugin. C’est le bon point d’intégration pour les reprises d’approbation, les résumés de politique,
les deltas de surveillance en arrière-plan et les continuations de commande qui doivent être visibles par
le modèle au prochain tour, mais ne doivent pas devenir du texte permanent d’invite système.

Les sémantiques de nettoyage font partie du contrat. Les rappels de nettoyage d’extension de session et
de cycle de vie d’exécution reçoivent `reset`, `delete`, `disable` ou
`restart`. L’hôte supprime l’état d’extension de session persistant du plugin propriétaire
et les injections de prochain tour en attente pour reset/delete/disable ; restart conserve
l’état de session durable tandis que les rappels de nettoyage permettent aux plugins de libérer les tâches du planificateur,
le contexte d’exécution et d’autres ressources hors bande pour l’ancienne génération
d’exécution.

## Hooks de message

Utilisez les hooks de message pour le routage au niveau du canal et la politique de livraison :

- `message_received` : observer le contenu entrant, l’expéditeur, `threadId`, `messageId`,
  `senderId`, la corrélation facultative run/session et les métadonnées.
- `message_sending` : réécrire `content` ou retourner `{ cancel: true }`.
- `message_sent` : observer le succès ou l’échec final.

Pour les réponses TTS uniquement audio, `content` peut contenir la transcription parlée masquée
même lorsque la charge utile du canal n’a pas de texte/légende visible. Réécrire ce
`content` met uniquement à jour la transcription visible par le hook ; elle n’est pas affichée comme
légende média.

Les contextes de hooks de message exposent des champs de corrélation stables lorsqu’ils sont disponibles :
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` et `ctx.callDepth`. Préférez
ces champs de première classe avant de lire les métadonnées héritées.

Préférez les champs typés `threadId` et `replyToId` avant d’utiliser des
métadonnées propres au canal.

Règles de décision :

- `message_sending` avec `cancel: true` est terminal.
- `message_sending` avec `cancel: false` est traité comme aucune décision.
- Le `content` réécrit continue vers les hooks de priorité inférieure, sauf si un hook ultérieur
  annule la livraison.

## Hooks d’installation

`before_install` s’exécute après l’analyse intégrée pour les installations de skill et de plugin.
Retournez des résultats supplémentaires ou `{ block: true, blockReason }` pour arrêter
l’installation.

`block: true` est terminal. `block: false` est traité comme aucune décision.

## Cycle de vie du Gateway

Utilisez `gateway_start` pour les services de plugin qui ont besoin d’un état détenu par le Gateway. Le
contexte expose `ctx.config`, `ctx.workspaceDir` et `ctx.getCron?.()` pour
l’inspection et les mises à jour de Cron. Utilisez `gateway_stop` pour nettoyer les ressources
longue durée.

Ne vous appuyez pas sur le hook interne `gateway:startup` pour les services d’exécution
détenus par un plugin.

`cron_changed` se déclenche pour les événements de cycle de vie Cron détenus par le Gateway avec une charge utile
d’événement typée couvrant les raisons `added`, `updated`, `removed`, `started`, `finished`
et `scheduled`. L’événement transporte un instantané `PluginHookGatewayCronJob`
(incluant `state.nextRunAtMs`, `state.lastRunStatus` et
`state.lastError` lorsqu’il est présent) ainsi qu’un `PluginHookGatewayCronDeliveryStatus`
de `not-requested` | `delivered` | `not-delivered` | `unknown`. Les événements supprimés
transportent toujours l’instantané de la tâche supprimée afin que les planificateurs externes puissent
réconcilier l’état. Utilisez `ctx.getCron?.()` et `ctx.config` depuis le contexte
d’exécution lors de la synchronisation de planificateurs de réveil externes, et gardez OpenClaw comme
source de vérité pour les vérifications d’échéance et l’exécution.

## Dépréciations à venir

Quelques surfaces adjacentes aux hooks sont dépréciées mais toujours prises en charge. Migrez
avant la prochaine version majeure :

- **Enveloppes de canal en texte brut** dans les gestionnaires `inbound_claim` et `message_received`.
  Lisez `BodyForAgent` et les blocs structurés de contexte utilisateur
  au lieu d’analyser le texte d’enveloppe plat. Voir
  [Enveloppes de canal en texte brut → BodyForAgent](/fr/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** reste disponible pour compatibilité. Les nouveaux plugins doivent utiliser
  `before_model_resolve` et `before_prompt_build` au lieu de la phase
  combinée.
- **`onResolution` dans `before_tool_call`** utilise désormais l’union typée
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) au lieu d’une chaîne `string` libre.

Pour la liste complète — enregistrement de capacité mémoire, profil de raisonnement de fournisseur,
fournisseurs d’authentification externes, types de découverte de fournisseurs, accesseurs d’exécution
de tâche et le renommage `command-auth` → `command-status` — voir
[Migration du Plugin SDK → Dépréciations actives](/fr/plugins/sdk-migration#active-deprecations).

## Associés

- [Migration du Plugin SDK](/fr/plugins/sdk-migration) — dépréciations actives et calendrier de suppression
- [Créer des plugins](/fr/plugins/building-plugins)
- [Vue d’ensemble du Plugin SDK](/fr/plugins/sdk-overview)
- [Points d’entrée des plugins](/fr/plugins/sdk-entrypoints)
- [Hooks internes](/fr/automation/hooks)
- [Internes de l’architecture des plugins](/fr/plugins/architecture-internals)
