---
read_when:
    - Vous créez un Plugin qui a besoin de before_tool_call, before_agent_reply, de hooks de message ou de hooks de cycle de vie
    - Vous devez bloquer, réécrire ou exiger une approbation pour les appels d’outils provenant d’un Plugin
    - Vous choisissez entre les hooks internes et les hooks de Plugin
summary: 'Points d’accroche de Plugin : interceptent les événements du cycle de vie des agents, des outils, des messages, des sessions et du Gateway'
title: Points d’accroche Plugin
x-i18n:
    generated_at: "2026-05-02T07:14:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4efb07c6211debb5a7915d63678b1695946a91600c54d31faa0edf7025fbabf0
    source_path: plugins/hooks.md
    workflow: 16
---

Les hooks de Plugin sont des points d'extension dans le processus pour les plugins OpenClaw. Utilisez-les
lorsqu'un plugin doit inspecter ou modifier les exécutions d'agents, les appels d'outils, le flux de messages,
le cycle de vie de session, le routage de sous-agents, les installations ou le démarrage du Gateway.

Utilisez plutôt les [hooks internes](/fr/automation/hooks) lorsque vous voulez un petit
script `HOOK.md` installé par l'opérateur pour les événements de commande et de Gateway tels que
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

Les gestionnaires de hooks s'exécutent séquentiellement par `priority` décroissante. Les hooks de même priorité
conservent l'ordre d'enregistrement.

`api.on(name, handler, opts?)` accepte :

- `priority` — ordre des gestionnaires (les valeurs les plus élevées s'exécutent en premier).
- `timeoutMs` — budget optionnel par hook. Lorsqu'il est défini, l'exécuteur de hooks abandonne ce
  gestionnaire après l'écoulement du budget et continue avec le suivant, au lieu de
  laisser une configuration lente ou un travail de rappel consommer le délai d'expiration de modèle configuré
  par l'appelant. Omettez-le pour utiliser le délai d'observation/décision par défaut que
  l'exécuteur de hooks applique de façon générique.

Chaque hook reçoit `event.context.pluginConfig`, la configuration résolue pour le
plugin qui a enregistré ce gestionnaire. Utilisez-la pour les décisions de hook qui nécessitent
les options actuelles du plugin ; OpenClaw l'injecte par gestionnaire sans modifier l'objet
d'événement partagé vu par les autres plugins.

## Catalogue des hooks

Les hooks sont regroupés selon la surface qu'ils étendent. Les noms en **gras** acceptent un
résultat de décision (blocage, annulation, remplacement ou demande d'approbation) ; tous les autres sont
uniquement destinés à l'observation.

**Tour d'agent**

- `before_model_resolve` — remplacer le fournisseur ou le modèle avant le chargement des messages de session
- `agent_turn_prepare` — consommer les injections de tour mises en file par les plugins et ajouter du contexte au même tour avant les hooks de prompt
- `before_prompt_build` — ajouter du contexte dynamique ou du texte de prompt système avant l'appel au modèle
- `before_agent_start` — phase combinée uniquement pour compatibilité ; préférez les deux hooks ci-dessus
- **`before_agent_reply`** — court-circuiter le tour du modèle avec une réponse synthétique ou le silence
- **`before_agent_finalize`** — inspecter la réponse finale naturelle et demander un passage de modèle supplémentaire
- `agent_end` — observer les messages finaux, l'état de réussite et la durée d'exécution
- `heartbeat_prompt_contribution` — ajouter du contexte uniquement Heartbeat pour les plugins de surveillance en arrière-plan et de cycle de vie

**Observation de conversation**

- `model_call_started` / `model_call_ended` — observer les métadonnées nettoyées d'appel fournisseur/modèle, le minutage, le résultat et les hachages bornés d'identifiants de requête sans contenu de prompt ni de réponse
- `llm_input` — observer l'entrée du fournisseur (prompt système, prompt, historique)
- `llm_output` — observer la sortie du fournisseur

**Outils**

- **`before_tool_call`** — réécrire les paramètres d'outil, bloquer l'exécution ou demander une approbation
- `after_tool_call` — observer les résultats d'outil, les erreurs et la durée
- **`tool_result_persist`** — réécrire le message de l'assistant produit à partir d'un résultat d'outil
- **`before_message_write`** — inspecter ou bloquer l'écriture d'un message en cours (rare)

**Messages et livraison**

- **`inbound_claim`** — revendiquer un message entrant avant le routage vers l'agent (réponses synthétiques)
- `message_received` — observer le contenu entrant, l'expéditeur, le fil et les métadonnées
- **`message_sending`** — réécrire le contenu sortant ou annuler la livraison
- `message_sent` — observer la réussite ou l'échec de la livraison sortante
- **`before_dispatch`** — inspecter ou réécrire un envoi sortant avant la remise au canal
- **`reply_dispatch`** — participer au pipeline final d'envoi des réponses

**Sessions et Compaction**

- `session_start` / `session_end` — suivre les limites du cycle de vie de session
- `before_compaction` / `after_compaction` — observer ou annoter les cycles de Compaction
- `before_reset` — observer les événements de réinitialisation de session (`/reset`, réinitialisations programmatiques)

**Sous-agents**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — coordonner le routage des sous-agents et la livraison des complétions

**Cycle de vie**

- `gateway_start` / `gateway_stop` — démarrer ou arrêter les services appartenant au plugin avec le Gateway
- `cron_changed` — observer les changements de cycle de vie Cron appartenant au Gateway (ajouté, mis à jour, supprimé, démarré, terminé, planifié)
- **`before_install`** — inspecter les analyses d'installation de Skills ou de plugins et éventuellement les bloquer

## Politique d'appel d'outil

`before_tool_call` reçoit :

- `event.toolName`
- `event.params`
- `event.runId` optionnel
- `event.toolCallId` optionnel
- des champs de contexte tels que `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (défini sur les exécutions pilotées par Cron) et le diagnostic `ctx.trace`

Il peut retourner :

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
- `requireApproval` met en pause l'exécution de l'agent et demande à l'utilisateur via les approbations de plugin.
  La commande `/approve` peut approuver à la fois les approbations exec et les approbations de plugin.
- Un `block: true` de priorité inférieure peut encore bloquer après qu'un hook de priorité supérieure
  a demandé une approbation.
- `onResolution` reçoit la décision d'approbation résolue — `allow-once`,
  `allow-always`, `deny`, `timeout` ou `cancelled`.

Les plugins intégrés qui ont besoin d'une politique au niveau de l'hôte peuvent enregistrer des politiques d'outils de confiance
avec `api.registerTrustedToolPolicy(...)`. Elles s'exécutent avant les hooks
`before_tool_call` ordinaires et avant les décisions des plugins externes. Utilisez-les uniquement
pour les garde-fous approuvés par l'hôte, comme la politique d'espace de travail, l'application du budget ou
la sécurité des workflows réservés. Les plugins externes doivent utiliser des hooks `before_tool_call`
normaux.

### Persistance des résultats d'outil

Les résultats d'outil peuvent inclure des `details` structurés pour le rendu d'interface, les diagnostics,
le routage média ou les métadonnées appartenant au plugin. Traitez `details` comme des métadonnées d'exécution,
et non comme du contenu de prompt :

- OpenClaw supprime `toolResult.details` avant la relecture fournisseur et l'entrée de Compaction
  afin que les métadonnées ne deviennent pas du contexte de modèle.
- Les entrées de session persistées ne conservent que des `details` bornés. Les détails surdimensionnés sont
  remplacés par un résumé compact et `persistedDetailsTruncated: true`.
- `tool_result_persist` et `before_message_write` s'exécutent avant le plafond final de persistance.
  Les hooks doivent toutefois garder les `details` retournés petits et éviter
  de placer du texte pertinent pour le prompt uniquement dans `details` ; placez la sortie d'outil visible par le modèle
  dans `content`.

## Hooks de prompt et de modèle

Utilisez les hooks propres à chaque phase pour les nouveaux plugins :

- `before_model_resolve` : reçoit uniquement le prompt actuel et les métadonnées de pièces jointes.
  Retournez `providerOverride` ou `modelOverride`.
- `agent_turn_prepare` : reçoit le prompt actuel, les messages de session préparés
  et toutes les injections en file strictement uniques vidées pour cette session. Retournez
  `prependContext` ou `appendContext`.
- `before_prompt_build` : reçoit le prompt actuel et les messages de session.
  Retournez `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` ou `appendSystemContext`.
- `heartbeat_prompt_contribution` : s'exécute uniquement pour les tours Heartbeat et retourne
  `prependContext` ou `appendContext`. Il est destiné aux moniteurs en arrière-plan
  qui doivent résumer l'état actuel sans modifier les tours initiés par l'utilisateur.

`before_agent_start` reste disponible pour compatibilité. Préférez les hooks explicites ci-dessus
afin que votre plugin ne dépende pas d'une phase combinée héritée.

`before_agent_start` et `agent_end` incluent `event.runId` lorsqu'OpenClaw peut
identifier l'exécution active. La même valeur est aussi disponible sur `ctx.runId`.
Les exécutions pilotées par Cron exposent également `ctx.jobId` (l'identifiant de la tâche Cron d'origine), afin que
les hooks de plugin puissent limiter les métriques, les effets secondaires ou l'état à une tâche planifiée
spécifique.

Pour les exécutions issues d'un canal, `ctx.messageProvider` est la surface fournisseur telle que
`discord` ou `telegram`, tandis que `ctx.channelId` est l'identifiant de cible de conversation
lorsqu'OpenClaw peut en dériver un depuis la clé de session ou les métadonnées de livraison.

`agent_end` est un hook d'observation et s'exécute en fire-and-forget après le tour. L'
exécuteur de hooks applique un délai d'expiration de 30 secondes afin qu'un plugin bloqué ou un endpoint
d'embedding ne puisse pas laisser la promesse du hook en attente indéfiniment. Un dépassement de délai est journalisé et
OpenClaw continue ; il n'annule pas le travail réseau appartenant au plugin sauf si le
plugin utilise aussi son propre signal d'abandon.

Utilisez `model_call_started` et `model_call_ended` pour la télémétrie d'appels fournisseur
qui ne doit pas recevoir les prompts bruts, l'historique, les réponses, les en-têtes, les corps de requête
ou les identifiants de requête fournisseur. Ces hooks incluent des métadonnées stables telles que
`runId`, `callId`, `provider`, `model`, `api`/`transport` optionnels,
`durationMs`/`outcome` terminal, et `upstreamRequestIdHash` lorsqu'OpenClaw peut dériver un
hachage borné d'identifiant de requête fournisseur.

`before_agent_finalize` s'exécute uniquement lorsqu'un harnais est sur le point d'accepter une réponse finale
naturelle de l'assistant. Ce n'est pas le chemin d'annulation `/stop` et il ne
s'exécute pas lorsque l'utilisateur interrompt un tour. Retournez `{ action: "revise", reason }` pour demander
au harnais un passage de modèle supplémentaire avant la finalisation, `{ action:
"finalize", reason? }` pour forcer la finalisation, ou omettez un résultat pour continuer.
Les hooks Codex natifs `Stop` sont relayés vers ce hook comme décisions OpenClaw
`before_agent_finalize`.

Les plugins non intégrés qui ont besoin de `llm_input`, `llm_output`,
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

Les plugins de workflow peuvent persister un petit état de session compatible JSON avec
`api.registerSessionExtension(...)` et le mettre à jour via la méthode Gateway
`sessions.pluginPatch`. Les lignes de session projettent l'état d'extension enregistré
via `pluginExtensions`, ce qui permet à Control UI et à d'autres clients de rendre
l'état appartenant au plugin sans connaître ses détails internes.

Utilisez `api.enqueueNextTurnInjection(...)` lorsqu'un plugin a besoin qu'un contexte durable atteigne
le prochain tour de modèle exactement une fois. OpenClaw vide les injections en file avant
les hooks de prompt, supprime les injections expirées et déduplique par `idempotencyKey`
par plugin. C'est le bon point d'accroche pour les reprises d'approbation, les résumés de politique,
les deltas de moniteur en arrière-plan et les continuations de commande qui doivent être visibles par
le modèle au prochain tour mais ne doivent pas devenir du texte de prompt système permanent.

Les sémantiques de nettoyage font partie du contrat. Les callbacks de nettoyage d'extension de session et
de cycle de vie d'exécution reçoivent `reset`, `delete`, `disable` ou
`restart`. L'hôte supprime l'état d'extension de session persistant du plugin propriétaire
et les injections au tour suivant en attente pour reset/delete/disable ; restart conserve
l'état de session durable, tandis que les callbacks de nettoyage permettent aux plugins de libérer les tâches
du planificateur, le contexte d'exécution et d'autres ressources hors bande de l'ancienne génération
d'exécution.

## Hooks de message

Utilisez les hooks de message pour le routage au niveau du canal et la politique de livraison :

- `message_received` : observez le contenu entrant, l’expéditeur, `threadId`, `messageId`,
  `senderId`, la corrélation facultative d’exécution/session et les métadonnées.
- `message_sending` : réécrivez `content` ou renvoyez `{ cancel: true }`.
- `message_sent` : observez la réussite ou l’échec final.

Pour les réponses TTS audio uniquement, `content` peut contenir la transcription
orale masquée, même lorsque la charge utile du canal ne comporte aucun texte/légende visible. La réécriture de ce
`content` met à jour uniquement la transcription visible par le hook ; elle n’est pas rendue comme
légende de média.

Les contextes de hooks de message exposent des champs de corrélation stables lorsqu’ils sont disponibles :
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

## Installer des hooks

`before_install` s’exécute après l’analyse intégrée des installations de Skills et de plugins.
Renvoyez des constats supplémentaires ou `{ block: true, blockReason }` pour arrêter
l’installation.

`block: true` est terminal. `block: false` est traité comme une absence de décision.

## Cycle de vie du Gateway

Utilisez `gateway_start` pour les services de plugin qui ont besoin d’un état détenu par le Gateway. Le
contexte expose `ctx.config`, `ctx.workspaceDir` et `ctx.getCron?.()` pour
l’inspection et les mises à jour Cron. Utilisez `gateway_stop` pour nettoyer les
ressources de longue durée.

Ne vous appuyez pas sur le hook interne `gateway:startup` pour les services d’exécution
détenus par le plugin.

`cron_changed` se déclenche pour les événements de cycle de vie Cron détenus par le Gateway avec une charge utile
d’événement typée couvrant les motifs `added`, `updated`, `removed`, `started`, `finished`
et `scheduled`. L’événement transporte un instantané `PluginHookGatewayCronJob`
(incluant `state.nextRunAtMs`, `state.lastRunStatus` et
`state.lastError` lorsqu’ils sont présents), ainsi qu’un `PluginHookGatewayCronDeliveryStatus`
valant `not-requested` | `delivered` | `not-delivered` | `unknown`. Les événements
de suppression transportent toujours l’instantané de la tâche supprimée afin que les planificateurs externes puissent
réconcilier l’état. Utilisez `ctx.getCron?.()` et `ctx.config` depuis le contexte
d’exécution lors de la synchronisation des planificateurs de réveil externes, et gardez OpenClaw comme
source de vérité pour les vérifications d’échéance et l’exécution.

## Dépréciations à venir

Quelques surfaces adjacentes aux hooks sont dépréciées, mais toujours prises en charge. Migrez
avant la prochaine version majeure :

- **Enveloppes de canal en texte brut** dans les gestionnaires `inbound_claim` et `message_received`.
  Lisez `BodyForAgent` et les blocs structurés de contexte utilisateur
  au lieu d’analyser le texte d’enveloppe plat. Voir
  [Enveloppes de canal en texte brut → BodyForAgent](/fr/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** reste disponible pour la compatibilité. Les nouveaux plugins doivent utiliser
  `before_model_resolve` et `before_prompt_build` au lieu de la phase
  combinée.
- **`onResolution` dans `before_tool_call`** utilise désormais l’union typée
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) au lieu d’une `string` libre.

Pour la liste complète — enregistrement des capacités mémoire, profil de raisonnement du fournisseur,
fournisseurs d’authentification externes, types de découverte de fournisseurs, accesseurs d’exécution des tâches
et renommage `command-auth` → `command-status` — voir
[Migration du SDK Plugin → Dépréciations actives](/fr/plugins/sdk-migration#active-deprecations).

## Associé

- [Migration du SDK Plugin](/fr/plugins/sdk-migration) — dépréciations actives et calendrier de suppression
- [Créer des plugins](/fr/plugins/building-plugins)
- [Vue d’ensemble du SDK Plugin](/fr/plugins/sdk-overview)
- [Points d’entrée de Plugin](/fr/plugins/sdk-entrypoints)
- [Hooks internes](/fr/automation/hooks)
- [Internes de l’architecture de Plugin](/fr/plugins/architecture-internals)
