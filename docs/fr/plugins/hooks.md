---
read_when:
    - Vous développez un Plugin qui a besoin de `before_tool_call`, `before_agent_reply`, de hooks de message ou de hooks de cycle de vie
    - Vous devez bloquer, réécrire ou exiger une approbation pour les appels d’outils provenant d’un plugin
    - Vous choisissez entre des hooks internes et des hooks de Plugin
summary: 'Hooks Plugin : intercepter les événements du cycle de vie de l’agent, de l’outil, du message, de la session et du Gateway'
title: Hooks de Plugin
x-i18n:
    generated_at: "2026-06-27T17:48:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6c2db0963c85d15fd391fb575f981992ffd6d77c098bd78cac08be390caea931
    source_path: plugins/hooks.md
    workflow: 16
---

Les hooks de Plugin sont des points d’extension dans le processus pour les plugins OpenClaw. Utilisez-les
lorsqu’un plugin doit inspecter ou modifier les exécutions d’agents, les appels d’outils, le flux de messages,
le cycle de vie des sessions, le routage des sous-agents, les installations ou le démarrage du Gateway.

Utilisez plutôt les [hooks internes](/fr/automation/hooks) lorsque vous voulez un petit
script `HOOK.md` installé par l’opérateur pour les événements de commande et de Gateway tels que
`/new`, `/reset`, `/stop`, `agent:bootstrap` ou `gateway:startup`.

## Démarrage rapide

Enregistrez des hooks de plugin typés avec `api.on(...)` depuis l’entrée de votre plugin :

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

Les gestionnaires de hooks s’exécutent séquentiellement par `priority` décroissante. Les hooks
ayant la même priorité conservent l’ordre d’enregistrement.

`api.on(name, handler, opts?)` accepte :

- `priority` - ordre des gestionnaires (les valeurs les plus élevées s’exécutent d’abord).
- `timeoutMs` - budget optionnel par hook. Lorsqu’il est défini, l’exécuteur de hooks interrompt ce
  gestionnaire une fois le budget écoulé et continue avec le suivant, au lieu de
  laisser une configuration lente ou un travail de rappel consommer le délai d’expiration de modèle
  configuré par l’appelant. Omettez-le pour utiliser le délai d’observation/décision par défaut que
  l’exécuteur de hooks applique de façon générique.

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
`api.on(..., { timeoutMs })` définie par l’auteur du plugin. Chaque valeur configurée doit
être un entier positif inférieur ou égal à 600000 millisecondes. Préférez les remplacements par hook
pour les hooks connus comme lents, afin qu’un plugin ne reçoive pas un budget plus long
partout.

Chaque hook reçoit `event.context.pluginConfig`, la configuration résolue pour le
plugin qui a enregistré ce gestionnaire. Utilisez-la pour les décisions de hook qui nécessitent
les options actuelles du plugin ; OpenClaw l’injecte par gestionnaire sans muter l’objet
d’événement partagé vu par les autres plugins.

## Catalogue des hooks

Les hooks sont regroupés selon la surface qu’ils étendent. Les noms en **gras** acceptent un
résultat de décision (bloquer, annuler, remplacer ou demander une approbation) ; tous les autres sont
uniquement d’observation.

**Tour d’agent**

- `before_model_resolve` - remplacer le fournisseur ou le modèle avant le chargement des messages de session
- `agent_turn_prepare` - consommer les injections de tour de plugin en file d’attente et ajouter du contexte au même tour avant les hooks de prompt
- `before_prompt_build` - ajouter du contexte dynamique ou du texte de prompt système avant l’appel au modèle
- `before_agent_start` - phase combinée uniquement pour compatibilité ; préférez les deux hooks ci-dessus
- **`before_agent_run`** - inspecter le prompt final et les messages de session avant l’envoi au modèle, et éventuellement bloquer l’exécution
- **`before_agent_reply`** - court-circuiter le tour du modèle avec une réponse synthétique ou le silence
- **`before_agent_finalize`** - inspecter la réponse finale naturelle et demander un passage de modèle supplémentaire
- `agent_end` - observer les messages finaux, l’état de succès et la durée d’exécution
- `heartbeat_prompt_contribution` - ajouter du contexte uniquement Heartbeat pour les plugins de surveillance en arrière-plan et de cycle de vie

**Observation de la conversation**

- `model_call_started` / `model_call_ended` - observer les métadonnées assainies d’appel fournisseur/modèle, le minutage, le résultat et les hachages bornés d’identifiants de requête, sans contenu de prompt ni de réponse
- `llm_input` - observer l’entrée du fournisseur (prompt système, prompt, historique)
- `llm_output` - observer la sortie du fournisseur, l’utilisation et le `contextTokenBudget` résolu lorsqu’il est disponible

**Outils**

- **`before_tool_call`** - réécrire les paramètres d’outil, bloquer l’exécution ou demander une approbation
- `after_tool_call` - observer les résultats d’outils, les erreurs et la durée
- `resolve_exec_env` - fournir des variables d’environnement appartenant au plugin à `exec`
- **`tool_result_persist`** - réécrire le message de l’assistant produit à partir d’un résultat d’outil
- **`before_message_write`** - inspecter ou bloquer une écriture de message en cours (rare)

**Messages et livraison**

- **`inbound_claim`** - revendiquer un message entrant avant le routage de l’agent (réponses synthétiques)
- `message_received` — observer le contenu entrant, l’expéditeur, le fil et les métadonnées
- **`message_sending`** — réécrire le contenu sortant ou annuler la livraison
- **`reply_payload_sending`** — modifier ou annuler les charges utiles de réponse normalisées avant la livraison
- `message_sent` — observer le succès ou l’échec de la livraison sortante
- **`before_dispatch`** - inspecter ou réécrire une distribution sortante avant le transfert au canal
- **`reply_dispatch`** - participer au pipeline final de distribution de réponse

**Sessions et Compaction**

- `session_start` / `session_end` - suivre les limites du cycle de vie des sessions. Le `reason` de l’événement est l’un de `new`, `reset`, `idle`, `daily`, `compaction`, `deleted`, `shutdown`, `restart` ou `unknown`. Les valeurs `shutdown` et `restart` se déclenchent depuis le finaliseur d’arrêt du gateway lorsque le processus est arrêté ou redémarré alors que des sessions sont encore actives, afin que les plugins en aval (comme les magasins de mémoire ou de transcriptions) puissent finaliser des lignes fantômes qui resteraient autrement dans un état ouvert après les redémarrages. Le finaliseur est borné afin qu’un plugin lent ne puisse pas bloquer SIGTERM/SIGINT.
- `before_compaction` / `after_compaction` - observer ou annoter les cycles de compaction
- `before_reset` - observer les événements de réinitialisation de session (`/reset`, réinitialisations programmatiques)

**Sous-agents**

- `subagent_spawned` / `subagent_ended` - observer le lancement et l’achèvement d’un sous-agent.
- `subagent_delivery_target` - hook de compatibilité pour la livraison d’achèvement lorsqu’aucune liaison de session cœur ne peut projeter une route.
- `subagent_spawning` - hook de compatibilité obsolète. Le cœur prépare désormais les liaisons de sous-agent `thread: true` via des adaptateurs de liaison de session de canal avant le déclenchement de `subagent_spawned`.
- `subagent_spawned` inclut `resolvedModel` et `resolvedProvider` lorsqu’OpenClaw a résolu le modèle natif de la session enfant avant le lancement.
- `subagent_ended` transporte `targetSessionKey` (identité — cela correspond à `subagent_spawned.childSessionKey`), `targetKind` (`"subagent"` ou `"acp"`), `reason`, `outcome` optionnel (`"ok"`, `"error"`, `"timeout"`, `"killed"`, `"reset"` ou `"deleted"`), `error` optionnel, `runId`, `endedAt`, `accountId` et `sendFarewell`. Il n’inclut **pas** `agentId` ni `childSessionKey` ; utilisez `targetSessionKey` pour le corréler à l’événement `subagent_spawned` correspondant.

**Cycle de vie**

- `gateway_start` / `gateway_stop` - démarrer ou arrêter les services appartenant au plugin avec le Gateway
- `deactivate` - alias de compatibilité obsolète pour `gateway_stop` ; utilisez `gateway_stop` dans les nouveaux plugins
- `cron_changed` - observer les changements de cycle de vie Cron appartenant au gateway (ajouté, mis à jour, supprimé, démarré, terminé, planifié)
- **`before_install`** - inspecter le matériel d’installation de Skill ou de plugin préparé depuis un runtime de
  plugin chargé

## Déboguer les hooks de runtime

Utilisez `before_model_resolve` lorsqu’un plugin doit changer le fournisseur ou le modèle
pour un tour d’agent. Il s’exécute avant la résolution du modèle ; `llm_output` ne s’exécute qu’après
qu’une tentative de modèle a produit une sortie d’assistant.

Pour prouver le modèle de session effectif, inspectez les enregistrements de runtime, puis
utilisez `openclaw sessions` ou les surfaces de session/statut du Gateway. Lors du débogage
des charges utiles de fournisseur, démarrez le Gateway avec `--raw-stream` et
`--raw-stream-path <path>` ; ces indicateurs écrivent les événements bruts de flux de modèle dans un fichier jsonl.

## Politique d’appel d’outil

`before_tool_call` reçoit :

- `event.toolName`
- `event.params`
- `event.toolKind` et `event.toolInputKind` optionnels, discriminateurs faisant autorité côté hôte
  pour les outils qui partagent intentionnellement des noms ; par exemple, les appels `exec`
  externes en mode code utilisent `toolKind: "code_mode_exec"` et
  incluent `toolInputKind: "javascript" | "typescript"` lorsque le langage d’entrée
  est connu
- `event.derivedPaths` optionnel, contenant des indications de chemins cibles dérivées par l’hôte au mieux
  pour les enveloppes d’outils bien connues telles que `apply_patch` ; lorsqu’ils sont présents,
  ces chemins peuvent être incomplets ou peuvent sur-approximer ce que l’outil touchera
  réellement (par exemple, avec des entrées mal formées ou partielles)
- `event.runId` optionnel
- `event.toolCallId` optionnel
- champs de contexte tels que `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (défini sur les exécutions pilotées par Cron), `ctx.toolKind`,
  `ctx.toolInputKind` et `ctx.trace` de diagnostic

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
    allowedDecisions?: Array<"allow-once" | "allow-always" | "deny">;
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

Comportement de garde des hooks pour les hooks de cycle de vie typés :

- `block: true` est terminal et ignore les gestionnaires de priorité inférieure.
- `block: false` est traité comme une absence de décision.
- `params` réécrit les paramètres de l’outil pour l’exécution.
- `requireApproval` met l’exécution de l’agent en pause et interroge l’utilisateur via les approbations de plugin. La commande `/approve` peut approuver à la fois les approbations exec et les approbations de plugin. Dans les relais natifs `PreToolUse` en mode rapport du serveur d’application Codex, cela est différé jusqu’à la demande d’approbation correspondante du serveur d’application ; consultez [runtime du harnais Codex](/fr/plugins/codex-harness-runtime#hook-boundaries).
- Un `block: true` de priorité inférieure peut toujours bloquer après qu’un hook de priorité supérieure a demandé une approbation.
- `onResolution` reçoit la décision d’approbation résolue - `allow-once`,
  `allow-always`, `deny`, `timeout` ou `cancelled`.

Consultez [demandes d’autorisations de Plugin](/fr/plugins/plugin-permission-requests) pour
le routage des approbations, le comportement de décision et quand utiliser `requireApproval` au lieu
d’outils optionnels ou d’approbations exec.

Les plugins qui ont besoin d’une politique de niveau hôte peuvent enregistrer des politiques d’outils de confiance avec
`api.registerTrustedToolPolicy(...)`. Celles-ci s’exécutent avant les hooks
`before_tool_call` ordinaires et avant les décisions de hook normales. Les politiques de confiance groupées
s’exécutent d’abord ; les politiques de confiance des plugins installés s’exécutent ensuite dans l’ordre de chargement
des plugins ; les hooks `before_tool_call` ordinaires s’exécutent après elles. Les plugins groupés conservent
le chemin de politique de confiance existant. Les plugins installés doivent être explicitement activés
et déclarer chaque identifiant de politique dans `contracts.trustedToolPolicies` ; les identifiants non déclarés
sont rejetés avant l’enregistrement. Les identifiants de politique sont limités au plugin qui les enregistre,
de sorte que différents plugins peuvent réutiliser le même identifiant local. Utilisez ce niveau uniquement
pour les garde-fous de confiance hôte tels que la politique d’espace de travail, l’application de budgets ou
la sécurité des workflows réservés.

### Hook d’environnement exec

`resolve_exec_env` permet aux plugins de fournir des variables d’environnement aux invocations de l’outil `exec`
après la construction de l’environnement exec de base et avant l’exécution de la
commande. Il reçoit :

- `event.sessionKey`
- `event.toolName`, actuellement toujours `"exec"`
- `event.host`, l’un de `"gateway"`, `"sandbox"` ou `"node"`
- champs de contexte tels que `ctx.agentId`, `ctx.sessionKey`,
  `ctx.messageProvider` et `ctx.channelId`

Renvoyez un `Record<string, string>` à fusionner dans l’environnement exec. Les gestionnaires
s’exécutent par ordre de priorité, et les résultats des hooks ultérieurs remplacent les résultats des hooks précédents pour
la même clé.

La sortie du hook est filtrée par la stratégie des clés d’environnement d’exécution de l’hôte avant
d’être fusionnée. Les clés invalides, `PATH` et les clés dangereuses de
remplacement de l’hôte telles que `LD_*`, `DYLD_*`, `NODE_OPTIONS`, les variables de proxy et les variables de remplacement TLS
sont supprimées. L’environnement filtré du plugin est inclus dans les métadonnées
d’approbation/d’audit du Gateway et transmis aux requêtes d’exécution node-host.

### Persistance des résultats d’outil

Les résultats d’outil peuvent inclure des `details` structurés pour le rendu d’interface, les diagnostics,
le routage de médias ou les métadonnées appartenant au plugin. Traitez `details` comme des métadonnées d’exécution,
pas comme du contenu de prompt :

- OpenClaw supprime `toolResult.details` avant le rejeu fournisseur et l’entrée de Compaction
  afin que les métadonnées ne deviennent pas du contexte de modèle.
- Les entrées de session persistées conservent uniquement des `details` bornés. Les détails trop volumineux sont
  remplacés par un résumé compact et `persistedDetailsTruncated: true`.
- `tool_result_persist` et `before_message_write` s’exécutent avant le plafond final
  de persistance. Les hooks doivent tout de même garder les `details` renvoyés petits et éviter
  de placer du texte pertinent pour le prompt uniquement dans `details` ; placez la sortie d’outil visible
  par le modèle dans `content`.

## Hooks de prompt et de modèle

Utilisez les hooks spécifiques à la phase pour les nouveaux plugins :

- `before_model_resolve` : reçoit uniquement le prompt courant et les métadonnées
  des pièces jointes. Renvoyez `providerOverride` ou `modelOverride`.
- `agent_turn_prepare` : reçoit le prompt courant, les messages de session préparés
  et toutes les injections en file exactement une fois drainées pour cette session. Renvoyez
  `prependContext` ou `appendContext`.
- `before_prompt_build` : reçoit le prompt courant et les messages de session.
  Renvoyez `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` ou `appendSystemContext`.
- `heartbeat_prompt_contribution` : s’exécute uniquement pour les tours Heartbeat et renvoie
  `prependContext` ou `appendContext`. Il est destiné aux moniteurs en arrière-plan
  qui doivent résumer l’état courant sans modifier les tours initiés par l’utilisateur.

`before_agent_start` reste disponible pour compatibilité. Préférez les hooks explicites ci-dessus
afin que votre plugin ne dépende pas d’une phase combinée héritée.

`before_agent_run` s’exécute après la construction du prompt et avant toute entrée de modèle,
y compris le chargement d’images local au prompt et l’observation `llm_input`. Il reçoit
l’entrée utilisateur courante sous forme de `prompt`, plus l’historique de session chargé dans `messages`
et le prompt système actif. Renvoyez `{ outcome: "block", reason, message? }`
pour arrêter l’exécution avant que le modèle puisse lire le prompt. `reason` est interne ;
`message` est le remplacement visible par l’utilisateur. Les seuls résultats pris en charge sont
`pass` et `block` ; les formes de décision non prises en charge échouent en mode fermé.

Lorsqu’une exécution est bloquée, OpenClaw stocke uniquement le texte de remplacement dans
`message.content`, plus des métadonnées de blocage non sensibles telles que l’identifiant du plugin
bloquant et l’horodatage. Le texte utilisateur d’origine n’est pas conservé dans la transcription ni dans le contexte
futur. Les raisons internes de blocage sont traitées comme sensibles et exclues des charges utiles de
transcription, d’historique, de diffusion, de journalisation et de diagnostic. L’observabilité
doit utiliser des champs assainis tels que l’identifiant du bloqueur, le résultat, l’horodatage ou une catégorie
sûre.

`before_agent_start` et `agent_end` incluent `event.runId` quand OpenClaw peut
identifier l’exécution active. La même valeur est également disponible sur `ctx.runId`.
Les exécutions pilotées par Cron exposent aussi `ctx.jobId` (l’identifiant de la tâche cron d’origine) afin que
les hooks de plugin puissent limiter les métriques, effets de bord ou états à une tâche planifiée
spécifique.

Pour les exécutions issues d’un canal, `ctx.channel` et `ctx.messageProvider` identifient
la surface fournisseur telle que `discord` ou `telegram`, tandis que `ctx.channelId` est
l’identifiant de cible de conversation quand OpenClaw peut en déduire un à partir de la clé de session
ou des métadonnées de livraison.

Lorsque l’identité de l’expéditeur est disponible, les contextes de hook d’agent incluent également :

- `ctx.senderId` — ID d’expéditeur limité au canal (par exemple Feishu `open_id`, ID utilisateur Discord).
  Renseigné lorsque l’exécution provient d’un message utilisateur avec des métadonnées
  d’expéditeur connues.
- `ctx.chatId` — identifiant de conversation natif du transport (par exemple Feishu
  `chat_id`, Telegram `chat_id`). Renseigné lorsque le canal d’origine
  fournit un ID de conversation natif.
- `ctx.channelContext.sender.id` — le même ID d’expéditeur que `ctx.senderId`, sous un
  objet appartenant au canal que les plugins peuvent étendre avec des champs propres au canal.
- `ctx.channelContext.chat.id` — le même ID de conversation que `ctx.chatId`, sous un
  objet appartenant au canal que les plugins peuvent étendre avec des champs propres au canal.

Le cœur définit uniquement les champs `id` imbriqués. Les plugins de canal qui transmettent des métadonnées
d’expéditeur ou de chat plus riches via l’assistant entrant peuvent augmenter
`PluginHookChannelSenderContext` ou `PluginHookChannelChatContext` depuis
`openclaw/plugin-sdk/channel-inbound` :

```ts
declare module "openclaw/plugin-sdk/channel-inbound" {
  interface PluginHookChannelSenderContext {
    unionId?: string;
    userId?: string;
  }
}
```

Les plugins de canal transmettent ces champs via l’assistant SDK entrant :

```ts
buildChannelInboundEventContext({
  // ...
  channelContext: {
    sender: { id: senderOpenId, unionId, userId },
    chat: { id: chatId },
  },
});
```

Ces champs sont facultatifs et absents pour les exécutions d’origine système (Heartbeat,
cron, exec-event).

`ctx.senderExternalId` reste disponible comme champ déprécié de compatibilité source pour
les anciens plugins. Le cœur ne le renseigne pas ; les nouvelles identités d’expéditeur propres au canal
doivent résider sous `ctx.channelContext.sender` via l’augmentation de module.

`agent_end` est un hook d’observation. Les chemins Gateway et de harnais persistant l’exécutent
en fire-and-forget après le tour, tandis que les chemins CLI ponctuels et de courte durée attendent la
promesse du hook avant le nettoyage du processus afin que les plugins approuvés puissent vider
l’observabilité terminale ou capturer l’état. L’exécuteur de hook applique un délai d’expiration de 30 secondes afin qu’un
plugin bloqué ou un point de terminaison intégré ne puisse pas laisser la promesse du hook en attente
indéfiniment. Un délai d’expiration est journalisé et OpenClaw continue ; il n’annule pas
le travail réseau appartenant au plugin, sauf si le plugin utilise aussi son propre signal d’abandon.

Utilisez `model_call_started` et `model_call_ended` pour la télémétrie d’appel fournisseur
qui ne doit pas recevoir de prompts bruts, d’historique, de réponses, d’en-têtes, de corps de requête
ou d’ID de requête fournisseur. Ces hooks incluent des métadonnées stables telles que
`runId`, `callId`, `provider`, `model`, `api`/`transport` facultatifs, les champs terminaux
`durationMs`/`outcome`, et `upstreamRequestIdHash` quand OpenClaw peut dériver un
hachage borné d’ID de requête fournisseur. Lorsque l’exécution a résolu les métadonnées de fenêtre de contexte,
l’événement et le contexte du hook incluent aussi `contextTokenBudget`, le
budget effectif de tokens après les plafonds de modèle/configuration/agent, ainsi que
`contextWindowSource` et `contextWindowReferenceTokens` quand un plafond inférieur a été
appliqué.

`before_agent_finalize` s’exécute uniquement lorsqu’un harnais est sur le point d’accepter une réponse finale
naturelle de l’assistant. Ce n’est pas le chemin d’annulation `/stop` et il ne
s’exécute pas lorsque l’utilisateur abandonne un tour. Renvoyez `{ action: "revise", reason }` pour demander
au harnais une passe de modèle supplémentaire avant la finalisation, `{ action:
"finalize", reason? }` pour forcer la finalisation, ou omettez un résultat pour continuer.
Les hooks natifs Codex `Stop` sont relayés dans ce hook sous forme de décisions OpenClaw
`before_agent_finalize`.

Lors du renvoi de `action: "revise"`, les plugins peuvent inclure des métadonnées `retry` pour rendre
la passe de modèle supplémentaire bornée et sûre à rejouer :

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` est ajouté à la raison de révision envoyée au harnais.
`idempotencyKey` permet à l’hôte de compter les nouvelles tentatives pour la même requête de plugin entre
des décisions de finalisation équivalentes, et `maxAttempts` plafonne le nombre de passes supplémentaires que
l’hôte autorisera avant de poursuivre avec la réponse finale naturelle.

Les plugins non intégrés qui ont besoin de hooks de conversation bruts (`before_model_resolve`,
`before_agent_reply`, `llm_input`, `llm_output`, `before_agent_finalize`,
`agent_end` ou `before_agent_run`) doivent définir :

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
`sessions.pluginPatch`. Les lignes de session projettent l’état d’extension enregistré
via `pluginExtensions`, ce qui permet à Control UI et à d’autres clients de rendre
l’état appartenant au plugin sans connaître les internes du plugin.

Utilisez `api.enqueueNextTurnInjection(...)` lorsqu’un plugin a besoin qu’un contexte durable
atteigne le prochain tour de modèle exactement une fois. OpenClaw draine les injections en file avant
les hooks de prompt, supprime les injections expirées et déduplique par `idempotencyKey`
par plugin. C’est le bon point d’intégration pour les reprises d’approbation, les résumés de stratégie,
les deltas de moniteur en arrière-plan et les continuations de commande qui doivent être visibles par
le modèle au prochain tour mais ne doivent pas devenir du texte de prompt système permanent.

Les sémantiques de nettoyage font partie du contrat. Les rappels de nettoyage d’extension de session et
de cycle de vie d’exécution reçoivent `reset`, `delete`, `disable` ou
`restart`. L’hôte supprime l’état d’extension de session persistant du plugin propriétaire
et les injections au tour suivant en attente pour reset/delete/disable ; restart conserve
l’état de session durable tandis que les rappels de nettoyage permettent aux plugins de libérer les tâches
de planificateur, le contexte d’exécution et d’autres ressources hors bande de l’ancienne génération
d’exécution.

## Hooks de message

Utilisez les hooks de message pour le routage et la politique de livraison au niveau du canal :

- `message_received` : observe le contenu entrant, l’expéditeur, `threadId`, `messageId`,
  `senderId`, la corrélation optionnelle d’exécution/session et les métadonnées.
- `message_sending` : réécrit `content` ou renvoie `{ cancel: true }`.
- `reply_payload_sending` : réécrit les objets `ReplyPayload` normalisés (y compris
  `presentation`, `delivery`, les références média et le texte) ou renvoie `{ cancel: true }`.
- `message_sent` : observe la réussite ou l’échec final.

Pour les réponses TTS uniquement audio, `content` peut contenir la transcription parlée masquée
même lorsque la charge utile du canal n’a aucun texte/sous-titre visible. La réécriture de ce
`content` met uniquement à jour la transcription visible par le hook ; elle n’est pas rendue comme
sous-titre média.

Les événements `reply_payload_sending` peuvent inclure `usageState`, un instantané live
best-effort par tour du modèle/de l’utilisation/du contexte. La livraison durable, le rejeu récupéré et
les réponses sans corrélation exacte d’exécution l’omettent.

Les contextes de hook de message exposent des champs de corrélation stables lorsqu’ils sont disponibles :
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` et `ctx.callDepth`. Les contextes entrants
et `before_dispatch` exposent également des métadonnées de réponse lorsque le canal dispose
de données de message cité filtrées par visibilité : `replyToId`, `replyToIdFull`,
`replyToBody`, `replyToSender` et `replyToIsQuote`. Préférez ces champs de première classe
avant de lire les métadonnées héritées.

Préférez les champs typés `threadId` et `replyToId` avant d’utiliser des métadonnées
propres au canal.

Règles de décision :

- `message_sending` avec `cancel: true` est terminal.
- `message_sending` avec `cancel: false` est traité comme une absence de décision.
- Le `content` réécrit continue vers les points d’accroche de priorité inférieure, sauf si un point d’accroche ultérieur
  annule la livraison.
- `reply_payload_sending` s’exécute après la normalisation de la charge utile et avant la livraison par le canal,
  y compris pour les réponses routées vers le canal d’origine. Les gestionnaires
  s’exécutent séquentiellement et chaque gestionnaire voit la dernière charge utile produite par les
  gestionnaires de priorité supérieure.
- Les charges utiles `reply_payload_sending` n’exposent pas les marqueurs de confiance du runtime tels que
  `trustedLocalMedia`; les plugins peuvent modifier la forme de la charge utile, mais ne peuvent pas accorder la confiance aux médias
  locaux.
- `message_sending` peut renvoyer `cancelReason` et des `metadata` bornées avec une
  annulation. Les nouvelles API du cycle de vie des messages exposent cela comme un résultat de livraison supprimée
  avec la raison `cancelled_by_message_sending_hook`; la livraison directe
  héritée continue de renvoyer un tableau de résultats vide par compatibilité.
- `message_sent` sert uniquement à l’observation. Les échecs de gestionnaire sont consignés et ne
  modifient pas le résultat de livraison.

## Points d’accroche d’installation

Utilisez `security.installPolicy` pour les décisions d’autorisation/blocage détenues par l’opérateur. Cette
politique s’exécute depuis la configuration OpenClaw, couvre les chemins d’installation et de mise à jour de la CLI, et échoue
en mode fermé lorsqu’elle est activée mais indisponible.

`before_install` est un point d’accroche de cycle de vie du runtime de plugin. Il s’exécute après
`security.installPolicy` uniquement dans le processus OpenClaw où les points d’accroche de plugin ont
déjà été chargés, comme les flux d’installation adossés au Gateway. Il est utile pour les
observations, avertissements et vérifications de compatibilité détenus par les plugins, mais ce n’est pas la
principale frontière de sécurité d’entreprise ou d’hôte pour les installations. Le champ `builtinScan`
reste dans la charge utile de l’événement par compatibilité, mais OpenClaw n’exécute plus
de blocage intégré du code dangereux au moment de l’installation; il s’agit donc d’un résultat `ok`
vide. Renvoyez des constats supplémentaires ou `{ block: true, blockReason }` pour arrêter
l’installation dans ce processus.

`block: true` est terminal. `block: false` est traité comme une absence de décision.
Les échecs de gestionnaire bloquent l’installation en mode fermé.

## Cycle de vie du Gateway

Utilisez `gateway_start` pour les services de plugin qui ont besoin d’un état détenu par le Gateway. Le
contexte expose `ctx.config`, `ctx.workspaceDir` et `ctx.getCron?.()` pour
l’inspection et les mises à jour de cron. Utilisez `gateway_stop` pour nettoyer les
ressources de longue durée.

Ne vous appuyez pas sur le point d’accroche interne `gateway:startup` pour les services de runtime
détenus par les plugins.

`cron_changed` se déclenche pour les événements de cycle de vie cron détenus par le gateway avec une charge utile
d’événement typée couvrant les raisons `added`, `updated`, `removed`, `started`, `finished`
et `scheduled`. L’événement transporte un instantané `PluginHookGatewayCronJob`
(incluant `state.nextRunAtMs`, `state.lastRunStatus` et
`state.lastError` lorsqu’ils sont présents), ainsi qu’un `PluginHookGatewayCronDeliveryStatus`
valant `not-requested` | `delivered` | `not-delivered` | `unknown`. Les événements de suppression
transportent toujours l’instantané de la tâche supprimée afin que les planificateurs externes puissent
réconcilier l’état. Utilisez `ctx.getCron?.()` et `ctx.config` depuis le contexte
de runtime lors de la synchronisation de planificateurs de réveil externes, et gardez OpenClaw comme
source de vérité pour les vérifications d’échéance et l’exécution.

## Dépréciations à venir

Quelques surfaces proches des points d’accroche sont dépréciées, mais restent prises en charge. Migrez
avant la prochaine version majeure :

- **Enveloppes de canal en texte brut** dans les gestionnaires `inbound_claim` et `message_received`.
  Lisez `BodyForAgent` et les blocs structurés de contexte utilisateur
  au lieu d’analyser le texte d’enveloppe plat. Voir
  [Enveloppes de canal en texte brut → BodyForAgent](/fr/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** reste disponible par compatibilité. Les nouveaux plugins doivent utiliser
  `before_model_resolve` et `before_prompt_build` au lieu de la phase
  combinée.
- **`subagent_spawning`** reste disponible par compatibilité avec les anciens plugins, mais
  les nouveaux plugins ne doivent pas y renvoyer de routage de thread. Le cœur prépare
  les liaisons de sous-agent `thread: true` via des adaptateurs de liaison de session de canal
  avant le déclenchement de `subagent_spawned`.
- **`deactivate`** reste un alias de compatibilité de nettoyage déprécié jusqu’après
  le 2026-08-16. Les nouveaux plugins doivent utiliser `gateway_stop`.
- **`onResolution` dans `before_tool_call`** utilise désormais l’union typée
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) au lieu d’un `string` libre.

Pour la liste complète - enregistrement des capacités de mémoire, profil de raisonnement du fournisseur,
fournisseurs d’authentification externes, types de découverte de fournisseurs, accesseurs de runtime de tâche
et renommage `command-auth` → `command-status` - voir
[Migration du Plugin SDK → Dépréciations actives](/fr/plugins/sdk-migration#active-deprecations).

## Associés

- [Migration du Plugin SDK](/fr/plugins/sdk-migration) - dépréciations actives et calendrier de suppression
- [Créer des plugins](/fr/plugins/building-plugins)
- [Vue d’ensemble du Plugin SDK](/fr/plugins/sdk-overview)
- [Points d’entrée des plugins](/fr/plugins/sdk-entrypoints)
- [Points d’accroche internes](/fr/automation/hooks)
- [Internes de l’architecture des plugins](/fr/plugins/architecture-internals)
