---
read_when:
    - Vous développez un Plugin qui a besoin de before_tool_call, before_agent_reply, de hooks de message ou de hooks de cycle de vie
    - Vous devez bloquer, réécrire ou exiger une approbation pour les appels d’outils provenant d’un plugin
    - Vous choisissez entre des hooks internes et des hooks de Plugin
summary: 'Crochets de Plugin : intercepter les événements de cycle de vie de l’agent, de l’outil, des messages, des sessions et du Gateway'
title: Points d’accroche de Plugin
x-i18n:
    generated_at: "2026-05-11T20:45:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: b363b8ed7452f0d8bdb267d3eaa38f579d6d7cfb7ace2085ac35baf9b253b575
    source_path: plugins/hooks.md
    workflow: 16
---

Les points d’accroche de Plugin sont des points d’extension intégrés au processus pour les Plugins OpenClaw. Utilisez-les
lorsqu’un Plugin doit inspecter ou modifier les exécutions d’agent, les appels d’outil, le flux de messages,
le cycle de vie des sessions, le routage des sous-agents, les installations ou le démarrage du Gateway.

Utilisez plutôt les [points d’accroche internes](/fr/automation/hooks) lorsque vous voulez un petit
script `HOOK.md` installé par l’opérateur pour les événements de commande et de Gateway tels que
`/new`, `/reset`, `/stop`, `agent:bootstrap` ou `gateway:startup`.

## Démarrage rapide

Enregistrez des points d’accroche de Plugin typés avec `api.on(...)` depuis le point d’entrée de votre Plugin :

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

Les gestionnaires de points d’accroche s’exécutent séquentiellement par `priority` décroissante. Les points d’accroche
de même priorité conservent l’ordre d’enregistrement.

`api.on(name, handler, opts?)` accepte :

- `priority` - ordre des gestionnaires (les valeurs plus élevées s’exécutent en premier).
- `timeoutMs` - budget facultatif par point d’accroche. Lorsqu’il est défini, l’exécuteur de points d’accroche abandonne ce
  gestionnaire après l’expiration du budget et continue avec le suivant, au lieu de
  laisser une configuration ou un rappel lent consommer le délai d’expiration de modèle configuré par l’appelant. Omettez-le pour utiliser le délai d’expiration d’observation/décision par défaut que
  l’exécuteur de points d’accroche applique de façon générique.

Les opérateurs peuvent aussi définir des budgets de points d’accroche sans modifier le code du Plugin :

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
`api.on(..., { timeoutMs })` définie par le Plugin. Chaque valeur configurée doit
être un entier positif inférieur ou égal à 600000 millisecondes. Privilégiez les remplacements par point d’accroche
pour les points d’accroche connus comme lents afin qu’un Plugin ne reçoive pas un budget plus long
partout.

Chaque point d’accroche reçoit `event.context.pluginConfig`, la configuration résolue du
Plugin qui a enregistré ce gestionnaire. Utilisez-la pour les décisions de point d’accroche qui nécessitent
les options actuelles du Plugin ; OpenClaw l’injecte par gestionnaire sans modifier
l’objet d’événement partagé vu par les autres Plugins.

## Catalogue des points d’accroche

Les points d’accroche sont groupés selon la surface qu’ils étendent. Les noms en **gras** acceptent un
résultat de décision (blocage, annulation, remplacement ou exigence d’approbation) ; tous les autres sont
uniquement d’observation.

**Tour d’agent**

- `before_model_resolve` - remplacer le fournisseur ou le modèle avant le chargement des messages de session
- `agent_turn_prepare` - consommer les injections de tour de Plugin mises en file d’attente et ajouter du contexte du même tour avant les points d’accroche d’invite
- `before_prompt_build` - ajouter du contexte dynamique ou du texte d’invite système avant l’appel au modèle
- `before_agent_start` - phase combinée conservée uniquement pour compatibilité ; privilégiez les deux points d’accroche ci-dessus
- **`before_agent_run`** - inspecter l’invite finale et les messages de session avant la soumission au modèle, et bloquer éventuellement l’exécution
- **`before_agent_reply`** - court-circuiter le tour de modèle avec une réponse synthétique ou le silence
- **`before_agent_finalize`** - inspecter la réponse finale naturelle et demander un passage de modèle supplémentaire
- `agent_end` - observer les messages finaux, l’état de réussite et la durée d’exécution
- `heartbeat_prompt_contribution` - ajouter du contexte propre à Heartbeat pour les Plugins de surveillance en arrière-plan et de cycle de vie

**Observation de la conversation**

- `model_call_started` / `model_call_ended` - observer les métadonnées assainies d’appel fournisseur/modèle, le minutage, le résultat et les hachages bornés d’identifiants de requête, sans contenu d’invite ni de réponse
- `llm_input` - observer l’entrée du fournisseur (invite système, invite, historique)
- `llm_output` - observer la sortie du fournisseur

**Outils**

- **`before_tool_call`** - réécrire les paramètres d’outil, bloquer l’exécution ou exiger une approbation
- `after_tool_call` - observer les résultats d’outil, les erreurs et la durée
- **`tool_result_persist`** - réécrire le message de l’assistant produit à partir d’un résultat d’outil
- **`before_message_write`** - inspecter ou bloquer une écriture de message en cours (rare)

**Messages et remise**

- **`inbound_claim`** - prendre en charge un message entrant avant le routage vers l’agent (réponses synthétiques)
- `message_received` - observer le contenu entrant, l’expéditeur, le fil et les métadonnées
- **`message_sending`** - réécrire le contenu sortant ou annuler la remise
- `message_sent` - observer la réussite ou l’échec de la remise sortante
- **`before_dispatch`** - inspecter ou réécrire une expédition sortante avant le transfert au canal
- **`reply_dispatch`** - participer au pipeline final d’expédition de réponse

**Sessions et Compaction**

- `session_start` / `session_end` - suivre les limites du cycle de vie des sessions. Le `reason` de l’événement est l’une des valeurs `new`, `reset`, `idle`, `daily`, `compaction`, `deleted`, `shutdown`, `restart` ou `unknown`. Les valeurs `shutdown` et `restart` sont déclenchées par le finaliseur d’arrêt du Gateway lorsque le processus est arrêté ou redémarré alors que des sessions sont encore actives, afin que les Plugins en aval (comme les magasins de mémoire ou de transcriptions) puissent finaliser les lignes fantômes qui resteraient autrement dans un état ouvert entre les redémarrages. Le finaliseur est borné afin qu’un Plugin lent ne puisse pas bloquer SIGTERM/SIGINT.
- `before_compaction` / `after_compaction` - observer ou annoter les cycles de Compaction
- `before_reset` - observer les événements de réinitialisation de session (`/reset`, réinitialisations programmatiques)

**Sous-agents**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` - coordonner le routage des sous-agents et la remise de fin d’exécution

**Cycle de vie**

- `gateway_start` / `gateway_stop` - démarrer ou arrêter les services gérés par le Plugin avec le Gateway
- `cron_changed` - observer les changements du cycle de vie Cron gérés par le Gateway (ajouté, mis à jour, supprimé, démarré, terminé, planifié)
- **`before_install`** - inspecter les analyses d’installation de Skills ou de Plugins et les bloquer éventuellement

## Politique d’appel d’outil

`before_tool_call` reçoit :

- `event.toolName`
- `event.params`
- `event.derivedPaths` facultatif, contenant des indices de chemins cibles déduits par l’hôte au mieux
  pour des enveloppes d’outil bien connues telles que `apply_patch` ; lorsqu’ils sont présents,
  ces chemins peuvent être incomplets ou surestimer ce que l’outil touchera
  réellement (par exemple avec des entrées mal formées ou partielles)
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
- `requireApproval` met en pause l’exécution de l’agent et interroge l’utilisateur via les approbations de Plugin. La commande `/approve` peut approuver à la fois les approbations d’exécution et de Plugin.
- Un `block: true` de priorité inférieure peut toujours bloquer après qu’un point d’accroche de priorité supérieure
  a demandé une approbation.
- `onResolution` reçoit la décision d’approbation résolue - `allow-once`,
  `allow-always`, `deny`, `timeout` ou `cancelled`.

Les Plugins groupés qui ont besoin d’une politique au niveau de l’hôte peuvent enregistrer des politiques d’outil de confiance
avec `api.registerTrustedToolPolicy(...)`. Elles s’exécutent avant les points d’accroche
`before_tool_call` ordinaires et avant les décisions de Plugins externes. Utilisez-les uniquement
pour des garde-fous approuvés par l’hôte tels que la politique d’espace de travail, l’application des budgets ou
la sécurité de workflows réservés. Les Plugins externes doivent utiliser les points d’accroche `before_tool_call`
normaux.

### Persistance des résultats d’outil

Les résultats d’outil peuvent inclure des `details` structurés pour le rendu d’interface utilisateur, les diagnostics,
le routage des médias ou les métadonnées gérées par le Plugin. Traitez `details` comme des métadonnées d’exécution,
et non comme du contenu d’invite :

- OpenClaw retire `toolResult.details` avant le rejeu côté fournisseur et l’entrée de Compaction
  afin que les métadonnées ne deviennent pas du contexte de modèle.
- Les entrées de session persistées conservent uniquement des `details` bornés. Les détails surdimensionnés sont
  remplacés par un résumé compact et `persistedDetailsTruncated: true`.
- `tool_result_persist` et `before_message_write` s’exécutent avant la limite finale
  de persistance. Les points d’accroche doivent néanmoins garder les `details` renvoyés petits et éviter
  de placer du texte pertinent pour l’invite uniquement dans `details` ; placez la sortie d’outil
  visible par le modèle dans `content`.

## Points d’accroche d’invite et de modèle

Utilisez les points d’accroche propres à chaque phase pour les nouveaux Plugins :

- `before_model_resolve` : reçoit uniquement l’invite actuelle et les métadonnées
  des pièces jointes. Renvoyez `providerOverride` ou `modelOverride`.
- `agent_turn_prepare` : reçoit l’invite actuelle, les messages de session préparés,
  et toutes les injections en file d’attente à usage unique drainées pour cette session. Renvoyez
  `prependContext` ou `appendContext`.
- `before_prompt_build` : reçoit l’invite actuelle et les messages de session.
  Renvoyez `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` ou `appendSystemContext`.
- `heartbeat_prompt_contribution` : s’exécute uniquement pour les tours Heartbeat et renvoie
  `prependContext` ou `appendContext`. Il est destiné aux moniteurs en arrière-plan
  qui doivent résumer l’état actuel sans modifier les tours initiés par l’utilisateur.

`before_agent_start` reste disponible pour compatibilité. Privilégiez les points d’accroche explicites ci-dessus
afin que votre Plugin ne dépende pas d’une phase combinée héritée.

`before_agent_run` s’exécute après la construction de l’invite et avant toute entrée de modèle,
y compris le chargement des images propres à l’invite et l’observation `llm_input`. Il reçoit
l’entrée utilisateur actuelle sous forme de `prompt`, ainsi que l’historique de session chargé dans `messages`
et l’invite système active. Renvoyez `{ outcome: "block", reason, message? }`
pour arrêter l’exécution avant que le modèle puisse lire l’invite. `reason` est interne ;
`message` est le remplacement visible par l’utilisateur. Les seuls résultats pris en charge sont
`pass` et `block` ; les formes de décision non prises en charge échouent en mode fermé.

Lorsqu’une exécution est bloquée, OpenClaw stocke uniquement le texte de remplacement dans
`message.content`, plus des métadonnées de blocage non sensibles comme l’identifiant du Plugin
bloqueur et l’horodatage. Le texte utilisateur d’origine n’est conservé ni dans la transcription ni dans le contexte futur. Les raisons de blocage internes sont traitées comme sensibles et exclues des
charges utiles de transcription, d’historique, de diffusion, de journalisation et de diagnostic. L’observabilité
doit utiliser des champs assainis comme l’identifiant du bloqueur, le résultat, l’horodatage ou une catégorie sûre.

`before_agent_start` et `agent_end` incluent `event.runId` lorsque OpenClaw peut
identifier l’exécution active. La même valeur est également disponible sur `ctx.runId`.
Les exécutions pilotées par Cron exposent aussi `ctx.jobId` (l’identifiant de la tâche Cron d’origine) afin que
les points d’accroche de Plugin puissent limiter la portée des métriques, des effets de bord ou de l’état à une tâche planifiée spécifique.

Pour les exécutions provenant d’un canal, `ctx.messageProvider` est la surface fournisseur telle que
`discord` ou `telegram`, tandis que `ctx.channelId` est l’identifiant de cible de conversation
lorsqu’OpenClaw peut en déduire un à partir de la clé de session ou des métadonnées
de remise.

`agent_end` est un point d’accroche d’observation et s’exécute sans attente de résultat après le tour. L’exécuteur de points d’accroche applique un délai d’expiration de 30 secondes afin qu’un Plugin bloqué ou un point de terminaison de vectorisation
ne puisse pas laisser la promesse du point d’accroche en attente indéfiniment. Un délai d’expiration est journalisé et
OpenClaw continue ; cela n’annule pas le travail réseau géré par le Plugin sauf si le
Plugin utilise également son propre signal d’abandon.

Utilisez `model_call_started` et `model_call_ended` pour la télémétrie des appels fournisseur
qui ne doit pas recevoir les prompts bruts, l’historique, les réponses, les en-têtes, les corps de
requête ni les ID de requête fournisseur. Ces hooks incluent des métadonnées stables comme
`runId`, `callId`, `provider`, `model`, les champs optionnels `api`/`transport`, les champs terminaux
`durationMs`/`outcome`, et `upstreamRequestIdHash` quand OpenClaw peut dériver un
hachage borné de l’ID de requête fournisseur.

`before_agent_finalize` s’exécute uniquement lorsqu’un harness est sur le point d’accepter une
réponse finale naturelle de l’assistant. Ce n’est pas le chemin d’annulation `/stop` et il ne
s’exécute pas lorsque l’utilisateur interrompt un tour. Retournez `{ action: "revise", reason }` pour demander
au harness un passage modèle supplémentaire avant la finalisation, `{ action:
"finalize", reason? }` pour forcer la finalisation, ou omettez un résultat pour continuer.
Les hooks natifs `Stop` de Codex sont relayés dans ce hook comme des décisions OpenClaw
`before_agent_finalize`.

Lors du retour de `action: "revise"`, les plugins peuvent inclure des métadonnées `retry` pour rendre
le passage modèle supplémentaire borné et sûr à rejouer :

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` est ajouté à la raison de révision envoyée au harness.
`idempotencyKey` permet à l’hôte de compter les nouvelles tentatives pour la même requête de plugin à travers
des décisions de finalisation équivalentes, et `maxAttempts` plafonne le nombre de passages supplémentaires que
l’hôte autorisera avant de continuer avec la réponse finale naturelle.

Les plugins non groupés qui ont besoin de hooks de conversation bruts (`before_model_resolve`,
`before_agent_reply`, `llm_input`, `llm_output`, `before_agent_finalize`,
`agent_end`, ou `before_agent_run`) doivent définir :

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

Les hooks qui modifient les prompts et les injections durables au tour suivant peuvent être désactivés par plugin
avec `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Extensions de session et injections au tour suivant

Les plugins de workflow peuvent conserver un petit état de session compatible JSON avec
`api.registerSessionExtension(...)` et le mettre à jour via la méthode Gateway
`sessions.pluginPatch`. Les lignes de session projettent l’état d’extension enregistré
via `pluginExtensions`, ce qui permet à Control UI et aux autres clients d’afficher
un statut appartenant au plugin sans connaître ses détails internes.

Utilisez `api.enqueueNextTurnInjection(...)` lorsqu’un plugin a besoin qu’un contexte durable
atteigne le prochain tour de modèle exactement une fois. OpenClaw vide les injections en file avant
les hooks de prompt, abandonne les injections expirées et déduplique par `idempotencyKey`
par plugin. C’est le bon point d’intégration pour les reprises d’approbation, les résumés de politique,
les deltas de moniteur en arrière-plan et les continuations de commande qui doivent être visibles par
le modèle au tour suivant, mais ne doivent pas devenir du texte permanent de prompt système.

Les sémantiques de nettoyage font partie du contrat. Le nettoyage des extensions de session et
les callbacks de nettoyage du cycle de vie runtime reçoivent `reset`, `delete`, `disable`, ou
`restart`. L’hôte supprime l’état d’extension de session persistant du plugin propriétaire
et les injections au tour suivant en attente pour reset/delete/disable ; restart conserve
l’état de session durable tandis que les callbacks de nettoyage permettent aux plugins de libérer les tâches
du planificateur, le contexte d’exécution et d’autres ressources hors bande de l’ancienne génération
runtime.

## Hooks de message

Utilisez les hooks de message pour la politique de routage et de livraison au niveau du canal :

- `message_received` : observer le contenu entrant, l’expéditeur, `threadId`, `messageId`,
  `senderId`, la corrélation optionnelle d’exécution/session et les métadonnées.
- `message_sending` : réécrire `content` ou retourner `{ cancel: true }`.
- `message_sent` : observer le succès ou l’échec final.

Pour les réponses TTS audio uniquement, `content` peut contenir la transcription parlée masquée
même lorsque la charge utile du canal n’a aucun texte/légende visible. La réécriture de ce
`content` met à jour uniquement la transcription visible par le hook ; elle n’est pas rendue comme une
légende de média.

Les contextes de hook de message exposent des champs de corrélation stables lorsqu’ils sont disponibles :
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId`, et `ctx.callDepth`. Préférez
ces champs de première classe avant de lire les métadonnées héritées.

Préférez les champs typés `threadId` et `replyToId` avant d’utiliser des métadonnées propres au canal.

Règles de décision :

- `message_sending` avec `cancel: true` est terminal.
- `message_sending` avec `cancel: false` est traité comme une absence de décision.
- Le `content` réécrit continue vers les hooks de priorité inférieure sauf si un hook ultérieur
  annule la livraison.
- `message_sending` peut retourner `cancelReason` et des `metadata` bornées avec une
  annulation. Les nouvelles API de cycle de vie des messages exposent cela comme un résultat de livraison supprimée
  avec la raison `cancelled_by_message_sending_hook` ; la livraison directe héritée
  continue de retourner un tableau de résultats vide par compatibilité.
- `message_sent` sert uniquement à l’observation. Les échecs de gestionnaire sont journalisés et ne
  modifient pas le résultat de livraison.

## Hooks d’installation

`before_install` s’exécute après l’analyse intégrée des installations de Skills et de plugins.
Retournez des résultats supplémentaires ou `{ block: true, blockReason }` pour arrêter
l’installation.

`block: true` est terminal. `block: false` est traité comme une absence de décision.

## Cycle de vie du Gateway

Utilisez `gateway_start` pour les services de plugin qui ont besoin d’un état appartenant au Gateway. Le
contexte expose `ctx.config`, `ctx.workspaceDir`, et `ctx.getCron?.()` pour
l’inspection et les mises à jour de cron. Utilisez `gateway_stop` pour nettoyer les ressources
de longue durée.

Ne vous appuyez pas sur le hook interne `gateway:startup` pour les services runtime
appartenant au plugin.

`cron_changed` se déclenche pour les événements de cycle de vie cron appartenant au gateway avec une charge utile
d’événement typée couvrant les raisons `added`, `updated`, `removed`, `started`, `finished`,
et `scheduled`. L’événement transporte un instantané `PluginHookGatewayCronJob`
(incluant `state.nextRunAtMs`, `state.lastRunStatus`, et
`state.lastError` lorsqu’il est présent) ainsi qu’un `PluginHookGatewayCronDeliveryStatus`
de `not-requested` | `delivered` | `not-delivered` | `unknown`. Les événements de suppression
transportent toujours l’instantané de la tâche supprimée afin que les planificateurs externes puissent
réconcilier l’état. Utilisez `ctx.getCron?.()` et `ctx.config` depuis le contexte
runtime lors de la synchronisation de planificateurs de réveil externes, et gardez OpenClaw comme
source de vérité pour les vérifications d’échéance et l’exécution.

## Dépréciations à venir

Quelques surfaces adjacentes aux hooks sont dépréciées mais toujours prises en charge. Migrez
avant la prochaine version majeure :

- **Enveloppes de canal en texte brut** dans les gestionnaires `inbound_claim` et `message_received`.
  Lisez `BodyForAgent` et les blocs structurés de contexte utilisateur
  au lieu d’analyser le texte d’enveloppe plat. Voir
  [Enveloppes de canal en texte brut → BodyForAgent](/fr/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** reste présent pour la compatibilité. Les nouveaux plugins doivent utiliser
  `before_model_resolve` et `before_prompt_build` au lieu de la phase combinée.
- **`onResolution` dans `before_tool_call`** utilise désormais l’union typée
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) au lieu d’un `string` libre.

Pour la liste complète - enregistrement de capacité mémoire, profil de réflexion fournisseur,
fournisseurs d’authentification externes, types de découverte fournisseur, accesseurs runtime de tâche,
et le renommage `command-auth` → `command-status` - voir
[Migration du Plugin SDK → Dépréciations actives](/fr/plugins/sdk-migration#active-deprecations).

## Liens connexes

- [Migration du Plugin SDK](/fr/plugins/sdk-migration) - dépréciations actives et calendrier de suppression
- [Créer des plugins](/fr/plugins/building-plugins)
- [Vue d’ensemble du Plugin SDK](/fr/plugins/sdk-overview)
- [Points d’entrée de Plugin](/fr/plugins/sdk-entrypoints)
- [Hooks internes](/fr/automation/hooks)
- [Internes de l’architecture de Plugin](/fr/plugins/architecture-internals)
