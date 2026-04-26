---
read_when:
    - Vous créez un Plugin qui a besoin de `before_tool_call`, `before_agent_reply`, de hooks de message ou de hooks de cycle de vie
    - Vous devez bloquer, réécrire ou exiger une approbation pour des appels d’outils depuis un Plugin
    - Vous hésitez entre hooks internes et hooks de Plugin
summary: 'Hooks de Plugin : intercepter les événements du cycle de vie de l’agent, des outils, des messages, des sessions et du Gateway'
title: Hooks de Plugin
x-i18n:
    generated_at: "2026-04-26T11:34:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62d8c21db885abcb70c7aa940e3ce937df09d077587b153015c4c6c5169f4f1d
    source_path: plugins/hooks.md
    workflow: 15
---

Les hooks de Plugin sont des points d’extension en processus pour les Plugins OpenClaw. Utilisez-les
lorsqu’un Plugin doit inspecter ou modifier les exécutions d’agent, les appels d’outils, le flux des messages,
le cycle de vie des sessions, le routage des sous-agents, les installations ou le démarrage du Gateway.

Utilisez plutôt les [hooks internes](/fr/automation/hooks) lorsque vous voulez un petit
script `HOOK.md` installé par l’opérateur pour des événements de commande et de Gateway tels que
`/new`, `/reset`, `/stop`, `agent:bootstrap` ou `gateway:startup`.

## Démarrage rapide

Enregistrez des hooks de Plugin typés avec `api.on(...)` depuis votre point d’entrée Plugin :

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

## Catalogue des hooks

Les hooks sont regroupés par surface qu’ils étendent. Les noms en **gras** acceptent un
résultat de décision (blocage, annulation, remplacement ou exigence d’approbation) ; tous les autres sont uniquement observationnels.

**Tour d’agent**

- `before_model_resolve` — remplace le fournisseur ou le modèle avant le chargement des messages de session
- `before_prompt_build` — ajoute du contexte dynamique ou du texte de prompt système avant l’appel au modèle
- `before_agent_start` — phase combinée uniquement pour compatibilité ; préférez les deux hooks ci-dessus
- **`before_agent_reply`** — court-circuite le tour du modèle avec une réponse synthétique ou silencieuse
- **`before_agent_finalize`** — inspecte la réponse finale naturelle et demande un passage modèle supplémentaire
- `agent_end` — observe les messages finaux, l’état de réussite et la durée d’exécution

**Observation de la conversation**

- `model_call_started` / `model_call_ended` — observent des métadonnées assainies d’appel fournisseur/modèle, le timing, le résultat et des hachages bornés d’identifiants de requête sans contenu de prompt ni de réponse
- `llm_input` — observe l’entrée du fournisseur (prompt système, prompt, historique)
- `llm_output` — observe la sortie du fournisseur

**Outils**

- **`before_tool_call`** — réécrit les paramètres d’outil, bloque l’exécution ou exige une approbation
- `after_tool_call` — observe les résultats d’outil, les erreurs et la durée
- **`tool_result_persist`** — réécrit le message assistant produit à partir d’un résultat d’outil
- **`before_message_write`** — inspecte ou bloque une écriture de message en cours (rare)

**Messages et livraison**

- **`inbound_claim`** — revendique un message entrant avant le routage agent (réponses synthétiques)
- `message_received` — observe le contenu entrant, l’expéditeur, le fil et les métadonnées
- **`message_sending`** — réécrit le contenu sortant ou annule la livraison
- `message_sent` — observe la réussite ou l’échec de la livraison sortante
- **`before_dispatch`** — inspecte ou réécrit une distribution sortante avant la remise au canal
- **`reply_dispatch`** — participe au pipeline final de distribution des réponses

**Sessions et Compaction**

- `session_start` / `session_end` — suivent les frontières du cycle de vie des sessions
- `before_compaction` / `after_compaction` — observent ou annotent les cycles de Compaction
- `before_reset` — observe les événements de réinitialisation de session (`/reset`, réinitialisations programmatiques)

**Sous-agents**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — coordonnent le routage des sous-agents et la livraison d’achèvement

**Cycle de vie**

- `gateway_start` / `gateway_stop` — démarrent ou arrêtent des services possédés par le Plugin avec le Gateway
- **`before_install`** — inspecte les scans d’installation de Skills ou Plugins et peut éventuellement bloquer

## Politique d’appel d’outil

`before_tool_call` reçoit :

- `event.toolName`
- `event.params`
- éventuellement `event.runId`
- éventuellement `event.toolCallId`
- des champs de contexte tels que `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (défini pour les exécutions pilotées par Cron), et le diagnostic `ctx.trace`

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
- `block: false` est traité comme aucune décision.
- `params` réécrit les paramètres d’outil pour l’exécution.
- `requireApproval` met en pause l’exécution de l’agent et demande à l’utilisateur via les
  approbations de Plugin. La commande `/approve` peut approuver à la fois les approbations exec et celles des Plugins.
- Un `block: true` de priorité inférieure peut encore bloquer après qu’un hook de priorité supérieure
  a demandé une approbation.
- `onResolution` reçoit la décision d’approbation résolue — `allow-once`,
  `allow-always`, `deny`, `timeout` ou `cancelled`.

### Persistance des résultats d’outil

Les résultats d’outil peuvent inclure des `details` structurés pour le rendu UI, les diagnostics,
le routage média ou des métadonnées détenues par un Plugin. Traitez `details` comme des métadonnées runtime,
pas comme du contenu de prompt :

- OpenClaw supprime `toolResult.details` avant la relecture fournisseur et l’entrée de Compaction
  afin que les métadonnées ne deviennent pas du contexte modèle.
- Les entrées de session persistées ne conservent que des `details` bornés. Les détails surdimensionnés sont
  remplacés par un résumé compact et `persistedDetailsTruncated: true`.
- `tool_result_persist` et `before_message_write` s’exécutent avant le plafond final
  de persistance. Les hooks doivent néanmoins garder les `details` renvoyés petits et éviter
  de placer du texte pertinent pour le prompt uniquement dans `details` ; mettez la sortie d’outil visible par le modèle
  dans `content`.

## Hooks de prompt et de modèle

Utilisez les hooks spécifiques à chaque phase pour les nouveaux Plugins :

- `before_model_resolve` : reçoit uniquement le prompt courant et les métadonnées
  des pièces jointes. Renvoyez `providerOverride` ou `modelOverride`.
- `before_prompt_build` : reçoit le prompt courant et les messages de session.
  Renvoyez `prependContext`, `systemPrompt`, `prependSystemContext` ou
  `appendSystemContext`.

`before_agent_start` reste pour compatibilité. Préférez les hooks explicites ci-dessus
afin que votre Plugin ne dépende pas d’une phase combinée héritée.

`before_agent_start` et `agent_end` incluent `event.runId` lorsque OpenClaw peut
identifier l’exécution active. La même valeur est aussi disponible sur `ctx.runId`.
Les exécutions pilotées par Cron exposent aussi `ctx.jobId` (identifiant de la tâche Cron
d’origine) afin que les hooks de Plugin puissent cadrer les métriques, effets secondaires ou état à une
tâche planifiée spécifique.

Utilisez `model_call_started` et `model_call_ended` pour la télémétrie d’appel fournisseur
qui ne doit pas recevoir de prompts bruts, d’historique, de réponses, d’en-têtes, de corps de requêtes ou d’identifiants de requête fournisseur. Ces hooks incluent des
métadonnées stables telles que `runId`, `callId`, `provider`, `model`, `api`/`transport`
facultatifs, `durationMs`/`outcome` terminaux, et `upstreamRequestIdHash` lorsque OpenClaw peut dériver un
hachage borné d’identifiant de requête fournisseur.

`before_agent_finalize` ne s’exécute que lorsqu’un harness est sur le point d’accepter une réponse naturelle finale de l’assistant. Ce n’est pas le chemin d’annulation `/stop` et il ne
s’exécute pas lorsque l’utilisateur interrompt un tour. Renvoyez `{ action: "revise", reason }` pour demander
au harness un passage modèle supplémentaire avant finalisation, `{ action:
"finalize", reason? }` pour forcer la finalisation, ou n’omettez aucun résultat pour continuer.
Les hooks `Stop` natifs de Codex sont relayés dans ce hook comme des décisions OpenClaw
`before_agent_finalize`.

Les Plugins non inclus qui ont besoin de `llm_input`, `llm_output`,
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

Les hooks qui modifient les prompts peuvent être désactivés par Plugin avec
`plugins.entries.<id>.hooks.allowPromptInjection=false`.

## Hooks de message

Utilisez les hooks de message pour le routage au niveau du canal et la politique de livraison :

- `message_received` : observe le contenu entrant, l’expéditeur, `threadId`, `messageId`,
  `senderId`, une corrélation facultative exécution/session et les métadonnées.
- `message_sending` : réécrit `content` ou renvoie `{ cancel: true }`.
- `message_sent` : observe la réussite ou l’échec final.

Pour les réponses TTS audio uniquement, `content` peut contenir le transcript parlé caché
même lorsque le payload du canal n’a pas de texte/légende visible. Réécrire ce
`content` met à jour uniquement le transcript visible par hook ; il n’est pas rendu comme
légende média.

Les contextes de hooks de message exposent des champs de corrélation stables lorsque disponibles :
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` et `ctx.callDepth`. Préférez
ces champs de première classe avant de lire les métadonnées héritées.

Préférez les champs typés `threadId` et `replyToId` avant d’utiliser des métadonnées spécifiques au canal.

Règles de décision :

- `message_sending` avec `cancel: true` est terminal.
- `message_sending` avec `cancel: false` est traité comme aucune décision.
- Le `content` réécrit continue vers les hooks de priorité inférieure sauf si un hook ultérieur
  annule la livraison.

## Hooks d’installation

`before_install` s’exécute après le scan intégré pour les installations de Skills et de Plugins.
Renvoyez des constats supplémentaires ou `{ block: true, blockReason }` pour arrêter
l’installation.

`block: true` est terminal. `block: false` est traité comme aucune décision.

## Cycle de vie du Gateway

Utilisez `gateway_start` pour les services Plugin qui ont besoin d’un état détenu par le Gateway. Le
contexte expose `ctx.config`, `ctx.workspaceDir` et `ctx.getCron?.()` pour
l’inspection et la mise à jour de Cron. Utilisez `gateway_stop` pour nettoyer les ressources de longue durée.

Ne vous appuyez pas sur le hook interne `gateway:startup` pour les services runtime détenus par un Plugin.

## Dépréciations à venir

Quelques surfaces voisines des hooks sont dépréciées mais encore prises en charge. Migrez
avant la prochaine version majeure :

- **Enveloppes de canal en texte brut** dans les gestionnaires `inbound_claim` et `message_received`.
  Lisez `BodyForAgent` et les blocs structurés de contexte utilisateur
  au lieu d’analyser un texte d’enveloppe plat. Voir
  [Enveloppes de canal en texte brut → BodyForAgent](/fr/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** reste pour compatibilité. Les nouveaux Plugins doivent utiliser
  `before_model_resolve` et `before_prompt_build` au lieu de la
  phase combinée.
- **`onResolution` dans `before_tool_call`** utilise désormais l’union typée
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) au lieu d’un `string` libre.

Pour la liste complète — enregistrement de capacité mémoire, profil
de réflexion fournisseur, fournisseurs d’authentification externes, types de découverte de fournisseur, accesseurs runtime de tâches et le renommage `command-auth` → `command-status` — voir
[Migration du SDK Plugin → Dépréciations actives](/fr/plugins/sdk-migration#active-deprecations).

## Lié

- [Migration du SDK Plugin](/fr/plugins/sdk-migration) — dépréciations actives et calendrier de suppression
- [Créer des Plugins](/fr/plugins/building-plugins)
- [Vue d’ensemble du SDK Plugin](/fr/plugins/sdk-overview)
- [Points d’entrée de Plugin](/fr/plugins/sdk-entrypoints)
- [Hooks internes](/fr/automation/hooks)
- [Internes de l’architecture des Plugins](/fr/plugins/architecture-internals)
