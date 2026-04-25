---
read_when:
    - Vous créez un plugin qui a besoin de `before_tool_call`, `before_agent_reply`, de hooks de message ou de hooks de cycle de vie
    - Vous devez bloquer, réécrire ou exiger une approbation pour des appels d’outil depuis un Plugin
    - Vous choisissez entre des hooks internes et des hooks de Plugin
summary: 'Hooks de Plugin : intercepter les événements du cycle de vie de l’agent, de l’outil, du message, de la session et du Gateway'
title: Hooks de Plugin
x-i18n:
    generated_at: "2026-04-25T13:52:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: f263fb9064811de79fc4744ce13c5a7b9afb2d3b00330975426348af3411dc76
    source_path: plugins/hooks.md
    workflow: 15
---

Les hooks de Plugin sont des points d’extension en processus pour les plugins OpenClaw. Utilisez-les
lorsqu’un Plugin doit inspecter ou modifier des exécutions d’agent, des appels d’outil, le flux des messages,
le cycle de vie des sessions, le routage des sous-agents, les installations ou le démarrage du Gateway.

Utilisez plutôt les [hooks internes](/fr/automation/hooks) lorsque vous voulez un petit
script `HOOK.md` installé par l’opérateur pour les événements de commande et de Gateway tels que
`/new`, `/reset`, `/stop`, `agent:bootstrap` ou `gateway:startup`.

## Démarrage rapide

Enregistrez des hooks de Plugin typés avec `api.on(...)` depuis l’entrée de votre Plugin :

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

Les handlers de hook s’exécutent séquentiellement par `priority` décroissante. Les hooks de
même priorité conservent l’ordre d’enregistrement.

## Catalogue des hooks

Les hooks sont regroupés par surface qu’ils étendent. Les noms en **gras** acceptent un
résultat de décision (blocage, annulation, remplacement ou demande d’approbation) ; tous les autres sont uniquement observables.

**Tour d’agent**

- `before_model_resolve` — remplace le fournisseur ou le modèle avant le chargement des messages de session
- `before_prompt_build` — ajoute du contexte dynamique ou du texte de prompt système avant l’appel au modèle
- `before_agent_start` — phase combinée de compatibilité uniquement ; préférez les deux hooks ci-dessus
- **`before_agent_reply`** — court-circuite le tour du modèle avec une réponse synthétique ou le silence
- `agent_end` — observe les messages finaux, l’état de réussite et la durée d’exécution

**Observation de conversation**

- `llm_input` — observe l’entrée du fournisseur (prompt système, prompt, historique)
- `llm_output` — observe la sortie du fournisseur

**Outils**

- **`before_tool_call`** — réécrit les paramètres de l’outil, bloque l’exécution ou exige une approbation
- `after_tool_call` — observe les résultats d’outil, les erreurs et la durée
- **`tool_result_persist`** — réécrit le message assistant produit à partir d’un résultat d’outil
- **`before_message_write`** — inspecte ou bloque une écriture de message en cours (rare)

**Messages et livraison**

- **`inbound_claim`** — revendique un message entrant avant le routage vers l’agent (réponses synthétiques)
- `message_received` — observe le contenu entrant, l’expéditeur, le fil et les métadonnées
- **`message_sending`** — réécrit le contenu sortant ou annule la livraison
- `message_sent` — observe la réussite ou l’échec de la livraison sortante
- **`before_dispatch`** — inspecte ou réécrit un envoi sortant avant le transfert au canal
- **`reply_dispatch`** — participe au pipeline final d’envoi de réponse

**Sessions et Compaction**

- `session_start` / `session_end` — suivent les bornes du cycle de vie de la session
- `before_compaction` / `after_compaction` — observent ou annotent les cycles de Compaction
- `before_reset` — observe les événements de réinitialisation de session (`/reset`, réinitialisations programmatiques)

**Sous-agents**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — coordonnent le routage des sous-agents et la livraison à la fin

**Cycle de vie**

- `gateway_start` / `gateway_stop` — démarrent ou arrêtent les services détenus par le Plugin avec le Gateway
- **`before_install`** — inspecte les scans d’installation de Skills ou de Plugin et peut éventuellement les bloquer

## Politique d’appel d’outil

`before_tool_call` reçoit :

- `event.toolName`
- `event.params`
- `event.runId` facultatif
- `event.toolCallId` facultatif
- des champs de contexte tels que `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId` et
  le diagnostic `ctx.trace`

Il peut renvoyer :

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

Règles :

- `block: true` est terminal et ignore les handlers de priorité inférieure.
- `block: false` est traité comme absence de décision.
- `params` réécrit les paramètres d’outil pour l’exécution.
- `requireApproval` met en pause l’exécution de l’agent et demande à l’utilisateur via les
  approbations de Plugin. La commande `/approve` peut approuver à la fois les approbations exec et Plugin.
- Un `block: true` de priorité inférieure peut encore bloquer après qu’un hook de priorité supérieure
  a demandé une approbation.
- `onResolution` reçoit la décision d’approbation résolue — `allow-once`,
  `allow-always`, `deny`, `timeout` ou `cancelled`.

## Hooks de prompt et de modèle

Utilisez les hooks spécifiques à chaque phase pour les nouveaux plugins :

- `before_model_resolve` : reçoit uniquement le prompt courant et les métadonnées
  des pièces jointes. Renvoie `providerOverride` ou `modelOverride`.
- `before_prompt_build` : reçoit le prompt courant et les messages de session.
  Renvoie `prependContext`, `systemPrompt`, `prependSystemContext` ou
  `appendSystemContext`.

`before_agent_start` reste pour la compatibilité. Préférez les hooks explicites ci-dessus
afin que votre Plugin ne dépende pas d’une ancienne phase combinée.

`before_agent_start` et `agent_end` incluent `event.runId` lorsque OpenClaw peut
identifier l’exécution active. La même valeur est aussi disponible dans `ctx.runId`.

Les plugins non intégrés qui ont besoin de `llm_input`, `llm_output` ou `agent_end` doivent définir :

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

Utilisez les hooks de message pour le routage au niveau canal et la politique de livraison :

- `message_received` : observe le contenu entrant, l’expéditeur, `threadId`, `messageId`,
  `senderId`, la corrélation facultative exécution/session et les métadonnées.
- `message_sending` : réécrit `content` ou renvoie `{ cancel: true }`.
- `message_sent` : observe la réussite ou l’échec final.

Pour les réponses TTS audio uniquement, `content` peut contenir la transcription parlée cachée
même lorsque la charge utile du canal n’a pas de texte/légende visible. Réécrire ce
`content` ne met à jour que la transcription visible par le hook ; ce n’est pas rendu comme légende
de média.

Les contextes de hook de message exposent des champs de corrélation stables lorsqu’ils sont disponibles :
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` et `ctx.callDepth`. Préférez
ces champs de première classe avant de lire les anciennes métadonnées.

Préférez les champs typés `threadId` et `replyToId` avant d’utiliser des
métadonnées spécifiques au canal.

Règles de décision :

- `message_sending` avec `cancel: true` est terminal.
- `message_sending` avec `cancel: false` est traité comme absence de décision.
- Le `content` réécrit continue vers les hooks de priorité inférieure sauf si un hook ultérieur
  annule la livraison.

## Hooks d’installation

`before_install` s’exécute après le scan intégré pour les installations de Skills et de Plugin.
Renvoyez des constatations supplémentaires ou `{ block: true, blockReason }` pour arrêter
l’installation.

`block: true` est terminal. `block: false` est traité comme absence de décision.

## Cycle de vie du Gateway

Utilisez `gateway_start` pour les services de Plugin qui ont besoin d’un état détenu par le Gateway. Le
contexte expose `ctx.config`, `ctx.workspaceDir` et `ctx.getCron?.()` pour
l’inspection et la mise à jour de cron. Utilisez `gateway_stop` pour nettoyer les ressources
de longue durée.

Ne vous appuyez pas sur le hook interne `gateway:startup` pour les services d’exécution détenus par un Plugin.

## Dépréciations à venir

Quelques surfaces adjacentes aux hooks sont dépréciées mais toujours prises en charge. Migrez
avant la prochaine version majeure :

- **Enveloppes de canal en texte brut** dans les handlers `inbound_claim` et `message_received`.
  Lisez `BodyForAgent` et les blocs structurés de contexte utilisateur
  au lieu d’analyser un texte d’enveloppe plat. Voir
  [Enveloppes de canal en texte brut → BodyForAgent](/fr/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** reste pour compatibilité. Les nouveaux plugins doivent utiliser
  `before_model_resolve` et `before_prompt_build` au lieu de la phase combinée.
- **`onResolution` dans `before_tool_call`** utilise désormais l’union typée
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) au lieu d’une `string` libre.

Pour la liste complète — enregistrement des capacités mémoire, profil de thinking
du fournisseur, fournisseurs d’authentification externes, types de découverte de fournisseur, accesseurs d’exécution des tâches et renommage de `command-auth` → `command-status` — voir
[Migration du SDK Plugin → Dépréciations actives](/fr/plugins/sdk-migration#active-deprecations).

## Connexe

- [Migration du SDK Plugin](/fr/plugins/sdk-migration) — dépréciations actives et calendrier de suppression
- [Créer des plugins](/fr/plugins/building-plugins)
- [Vue d’ensemble du SDK Plugin](/fr/plugins/sdk-overview)
- [Points d’entrée de Plugin](/fr/plugins/sdk-entrypoints)
- [Hooks internes](/fr/automation/hooks)
- [Internals de l’architecture des plugins](/fr/plugins/architecture-internals)
