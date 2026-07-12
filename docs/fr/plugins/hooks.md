---
read_when:
    - Vous développez un plugin qui nécessite `before_tool_call`, `before_agent_reply`, des hooks de message ou des hooks de cycle de vie
    - Vous devez bloquer, réécrire ou soumettre à approbation les appels d’outils provenant d’un Plugin
    - Vous hésitez entre les hooks internes et les hooks de Plugin
    - Vous projetez les réveils Cron d’OpenClaw dans un planificateur hôte externe
summary: 'Hooks de Plugin : interceptez les événements du cycle de vie de l’agent, des outils, des messages, des sessions et du Gateway'
title: Hooks de Plugin
x-i18n:
    generated_at: "2026-07-12T15:39:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9e4e94220bca59b710b7b46c87bb889942c88b0d44f723e7133f271d34d9c929
    source_path: plugins/hooks.md
    workflow: 16
---

Les hooks de Plugin sont des points d’extension intégrés au processus pour les plugins OpenClaw : ils permettent d’inspecter ou de
modifier les exécutions d’agents, les appels d’outils, le flux de messages, le cycle de vie des sessions, le routage des sous-agents,
les installations ou le démarrage du Gateway.

Utilisez plutôt les [hooks internes](/fr/automation/hooks) pour un petit script
`HOOK.md` installé par un opérateur et réagissant aux événements de commande et du Gateway tels que `/new`,
`/reset`, `/stop`, `agent:bootstrap` ou `gateway:startup`.

## Démarrage rapide

Enregistrez des hooks typés avec `api.on(...)` depuis le point d’entrée du plugin :

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
            title: "Exécuter la recherche web",
            description: `Autoriser la requête de recherche : ${String(event.params.query ?? "")}`,
            severity: "info",
            timeoutMs: 60_000,
          },
        };
      },
      { priority: 50 },
    );
  },
});
```

Les gestionnaires pouvant renvoyer des décisions ou des modifications s’exécutent séquentiellement par
`priority` décroissante ; les gestionnaires de même priorité conservent leur ordre d’enregistrement.
Les gestionnaires d’observation uniquement s’exécutent en parallèle, et les envois d’observation
sans attente peuvent se chevaucher avec des événements ultérieurs. N’utilisez pas la priorité pour ordonner
les effets secondaires d’observation.

`api.on(name, handler, opts?)` accepte :

| Option      | Effet                                                                                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `priority`  | Ordre d’exécution ; la valeur la plus élevée s’exécute en premier.                                                                                                                               |
| `timeoutMs` | Délai d’attente maximal par hook. À son expiration, OpenClaw cesse d’attendre ce gestionnaire et poursuit l’exécution. Cela n’annule ni le gestionnaire ni ses effets secondaires. Omettez cette option pour utiliser le délai d’attente par hook par défaut de l’exécuteur. |

Les opérateurs peuvent définir les délais des hooks sans modifier le code du plugin :

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
`api.on(..., { timeoutMs })` définie par le plugin. Chaque valeur doit être un
entier positif inférieur ou égal à 600000 ms. Privilégiez les remplacements par hook pour les
hooks connus comme étant lents, afin qu’un plugin ne bénéficie pas partout d’un délai plus long.

La promesse d’un gestionnaire ayant dépassé son délai continue de s’exécuter, car les rappels de hook ne
reçoivent pas de signal d’annulation. L’envoi du hook peut libérer son admission au Gateway
alors que le travail de ce plugin est encore en cours. Les plugins qui gèrent des
tâches de longue durée doivent fournir leur propre cycle de vie d’annulation et d’arrêt.

Les hooks de modification sortants `message_sending` et `reply_payload_sending` utilisent un
délai par défaut de 15 secondes par gestionnaire. Si l’un d’eux dépasse ce délai, OpenClaw journalise l’erreur du plugin
et poursuit avec la charge utile la plus récente afin que la file de livraison sérialisée puisse
se terminer. Définissez un délai par hook plus long pour les plugins qui effectuent intentionnellement un travail plus lent
avant la livraison.

Les plugins de canal qui utilisent `createReplyDispatcher` peuvent également déclarer un délai
positif plus élevé par étape avec `beforeDeliverOptions: { timeoutMs }`, ou lors de
l’ajout d’une tâche avec `dispatcher.appendBeforeDeliver(handler, { timeoutMs })`.
Sans délai déclaré par le propriétaire, ces rappels utilisent le même délai par défaut de 15 secondes,
afin qu’un rappel bloqué ne puisse pas retenir la file de livraison sérialisée.

Chaque hook reçoit `event.context.pluginConfig`, la configuration résolue du
plugin qui a enregistré ce gestionnaire. OpenClaw l’injecte pour chaque gestionnaire sans
modifier l’objet d’événement partagé visible par les autres plugins.

## Catalogue des hooks

Les hooks sont regroupés selon la surface qu’ils étendent. Les noms en **gras** acceptent un résultat de
décision (blocage, annulation, remplacement ou demande d’approbation) ; les autres servent
uniquement à l’observation.

**Tour de l’agent**

| Hook                            | Objectif                                                                                  |
| ------------------------------- | ----------------------------------------------------------------------------------------- |
| `before_model_resolve`          | Remplacer le fournisseur ou le modèle avant le chargement des messages de session         |
| `agent_turn_prepare`            | Consommer les injections de tour mises en file d’attente par les plugins et ajouter du contexte au tour en cours avant les hooks de prompt |
| `before_prompt_build`           | Ajouter du contexte dynamique ou du texte au prompt système avant l’appel du modèle        |
| `before_agent_start`            | Phase combinée réservée à la compatibilité ; privilégiez les deux hooks précédents         |
| **`before_agent_run`**          | Inspecter le prompt final et les messages de session avant leur soumission au modèle ; peut bloquer l’exécution |
| **`before_agent_reply`**        | Court-circuiter le tour du modèle avec une réponse synthétique ou un silence               |
| **`before_agent_finalize`**     | Inspecter la réponse finale naturelle et demander un passage supplémentaire du modèle      |
| `agent_end`                     | Observer les messages finaux, l’état de réussite et la durée d’exécution                   |
| `heartbeat_prompt_contribution` | Ajouter du contexte réservé au Heartbeat pour les plugins de surveillance en arrière-plan et de cycle de vie |

**Observation de la conversation**

| Hook                                      | Objectif                                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `model_call_started` / `model_call_ended` | Métadonnées épurées des appels au fournisseur/modèle : temporisation, résultat et hachages bornés des identifiants de requête. Aucun contenu de prompt ou de réponse. |
| `llm_input`                               | Entrée du fournisseur : prompt système, prompt, historique                                                           |
| `llm_output`                              | Sortie du fournisseur, utilisation et `contextTokenBudget` résolu lorsqu’il est disponible                           |

**Outils**

| Hook                       | Objectif                                                        |
| -------------------------- | --------------------------------------------------------------- |
| **`before_tool_call`**     | Réécrire les paramètres de l’outil, bloquer l’exécution ou exiger une approbation |
| `after_tool_call`          | Observer les résultats de l’outil, les erreurs et la durée      |
| `resolve_exec_env`         | Fournir à `exec` des variables d’environnement détenues par le plugin |
| **`tool_result_persist`**  | Réécrire le message de l’assistant produit à partir du résultat d’un outil |
| **`before_message_write`** | Inspecter ou bloquer l’écriture d’un message en cours (rare)    |

**Messages et livraison**

| Hook                            | Objectif                                                           |
| ------------------------------- | ------------------------------------------------------------------ |
| **`inbound_claim`**             | Revendiquer un message entrant avant le routage vers l’agent (réponses synthétiques) |
| **`channel_pairing_requested`** | Observer les nouvelles demandes d’association par message privé    |
| `message_received`              | Observer le contenu entrant, l’expéditeur, le fil et les métadonnées |
| **`message_sending`**           | Réécrire le contenu sortant ou annuler la livraison                |
| **`reply_payload_sending`**     | Modifier ou annuler les charges utiles de réponse normalisées avant la livraison |
| `message_sent`                  | Observer la réussite ou l’échec de la livraison sortante           |
| **`before_dispatch`**           | Inspecter ou réécrire un envoi sortant avant son transfert au canal |
| **`reply_dispatch`**            | Participer au pipeline final d’envoi des réponses                   |

**Sessions et Compaction**

| Hook                                     | Objectif                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `session_start` / `session_end`          | Suivre les limites du cycle de vie des sessions. `reason` vaut `new`, `reset`, `idle`, `daily`, `compaction`, `deleted`, `shutdown`, `restart` ou `unknown`. `shutdown`/`restart` sont déclenchés par le finaliseur d’arrêt du Gateway lorsque le processus s’arrête ou redémarre avec des sessions actives, afin que les plugins (mémoire, magasins de transcriptions) puissent finaliser les lignes fantômes au lieu de les laisser ouvertes entre les redémarrages. Le finaliseur est soumis à une durée maximale afin qu’un plugin lent ne puisse pas bloquer SIGTERM/SIGINT. |
| `before_compaction` / `after_compaction` | Observer ou annoter les cycles de Compaction                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `before_reset`                           | Observer les événements de réinitialisation de session (`/reset`, réinitialisations programmatiques)                                                                                                                                                                                                                                                                                                                                                               |

**Sous-agents**

- `subagent_spawned` / `subagent_ended` - observent le lancement et l’achèvement des sous-agents.
- `subagent_delivery_target` - hook de compatibilité pour la livraison de l’achèvement lorsqu’aucune liaison de session du cœur ne peut projeter une route.
- `subagent_spawning` - hook de compatibilité obsolète. Le cœur prépare désormais les liaisons de sous-agents `thread: true` au moyen des adaptateurs de liaison de session du canal avant le déclenchement de `subagent_spawned`.
- `subagent_spawned` inclut `resolvedModel` et `resolvedProvider` lorsqu’OpenClaw a résolu le modèle natif de la session enfant avant le lancement.
- `subagent_ended` contient `targetSessionKey` (identité — correspond à `subagent_spawned.childSessionKey`), `targetKind` (`"subagent"` ou `"acp"`), `reason`, l’élément facultatif `outcome` (`"ok"`, `"error"`, `"timeout"`, `"killed"`, `"reset"` ou `"deleted"`), l’élément facultatif `error`, `runId`, `endedAt`, `accountId` et `sendFarewell`. Il n’inclut **pas** `agentId` ni `childSessionKey` ; utilisez `targetSessionKey` pour établir la corrélation avec l’événement `subagent_spawned` correspondant.

**Cycle de vie**

| Hook                             | Objectif                                                                                                          |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `gateway_start` / `gateway_stop` | Démarrer ou arrêter les services appartenant au plugin avec le Gateway                                            |
| `deactivate`                     | Alias de compatibilité obsolète de `gateway_stop` ; utilisez `gateway_stop` dans les nouveaux plugins             |
| `cron_reconciled`                | Effectuer la réconciliation avec l’état Cron complet du Gateway après le démarrage ou le rechargement             |
| `cron_changed`                   | Observer les changements de cycle de vie Cron gérés par le Gateway (ajouté, mis à jour, supprimé, démarré, terminé, planifié) |
| **`before_install`**             | Inspecter les éléments d’installation de skill ou de plugin préparés depuis un runtime de plugin chargé           |

### Demandes d’association de canal

Utilisez `channel_pairing_requested` lorsqu’un plugin doit avertir un opérateur ou
écrire une entrée d’audit après que l’expéditeur d’un message privé non associé a créé une demande
d’association en attente. Le hook est déclenché lors de la création de la demande ; la remise par le canal de
la réponse d’association n’est pas retardée par des gestionnaires de hook lents ou défaillants.

```typescript
api.on("channel_pairing_requested", async (event) => {
  await notifyOperator({
    text: `Nouvelle demande d’association ${event.channel} de ${event.senderId} : ${event.code}`,
  });
});
```

Le hook sert uniquement à l’observation. Il n’approuve, ne rejette, ne supprime ni ne réécrit
la réponse d’association. La charge utile inclut le canal, le champ facultatif `accountId`,
le `senderId` limité au canal, le `code` d’association et les métadonnées du canal. Traitez le
code d’association comme un identifiant d’approbation actif à usage unique et transmettez-le uniquement à une
destination de confiance destinée aux opérateurs. Traitez `metadata` comme du texte d’identité non fiable
fourni par l’expéditeur. Le hook n’inclut ni le corps du message entrant ni les médias.

## Hooks de débogage du runtime

Utilisez `before_model_resolve` pour changer de fournisseur ou de modèle pour un tour d’agent : il
s’exécute avant la résolution du modèle. `llm_output` ne s’exécute qu’après qu’une tentative du modèle
a produit une sortie d’assistant.

Pour vérifier le modèle de session effectif, inspectez les enregistrements du runtime, puis
utilisez `openclaw sessions` ou les surfaces de session/état du Gateway. Pour déboguer
les charges utiles du fournisseur, démarrez le Gateway avec `--raw-stream` et
`--raw-stream-path <path>` afin d’écrire les événements bruts du flux du modèle dans un fichier jsonl.

## Politique d’appel des outils

`before_tool_call` reçoit :

- `event.toolName`
- `event.params`
- les champs facultatifs `event.toolKind` et `event.toolInputKind`, des
  discriminateurs faisant autorité côté hôte pour les outils qui partagent intentionnellement un nom ; par exemple, les appels
  `exec` externes en mode code utilisent `toolKind: "code_mode_exec"` et incluent
  `toolInputKind: "javascript" | "typescript"` lorsque le langage d’entrée est
  connu
- le champ facultatif `event.derivedPaths`, des indications de chemins cibles dérivées par l’hôte au mieux de ses possibilités
  pour les enveloppes d’outils connues telles que `apply_patch` ; ces chemins peuvent être
  incomplets ou surestimer ce que l’outil modifiera réellement (par
  exemple, avec des entrées incorrectes ou partielles)
- le champ facultatif `event.runId`
- le champ facultatif `event.toolCallId`
- des champs de contexte tels que `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.toolKind`, `ctx.toolInputKind` et le diagnostic `ctx.trace`

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
    /** @deprecated Les approbations non résolues sont toujours refusées. */
    timeoutBehavior?: "allow" | "deny";
    allowedDecisions?: Array<"allow-once" | "allow-always" | "deny">;
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

Comportement de protection des hooks de cycle de vie typés :

- `block: true` est définitif et ignore les gestionnaires de priorité inférieure.
- `block: false` est traité comme une absence de décision.
- `params` réécrit les paramètres de l’outil pour l’exécution.
- `requireApproval` met en pause l’exécution de l’agent et interroge l’utilisateur par l’intermédiaire des
  approbations de plugin. `/approve` peut approuver les exécutions et les approbations de plugin. Dans les
  relais `PreToolUse` natifs en mode rapport du serveur d’application Codex, cette action est déléguée à la
  demande d’approbation correspondante du serveur d’application ; consultez
  [Runtime du harnais Codex](/fr/plugins/codex-harness-runtime#hook-boundaries).
- Un `block: true` de priorité inférieure peut toujours bloquer après qu’un hook de priorité supérieure
  a demandé une approbation.
- `onResolution` reçoit la décision résolue : `allow-once`, `allow-always`,
  `deny`, `timeout` ou `cancelled`.

Consultez [Demandes d’autorisation des plugins](/fr/plugins/plugin-permission-requests) pour
le routage des approbations, le comportement des décisions et les cas où utiliser `requireApproval` plutôt
que des outils facultatifs ou des approbations d’exécution.

Les plugins qui nécessitent une politique au niveau de l’hôte peuvent enregistrer des politiques d’outils de confiance avec
`api.registerTrustedToolPolicy(...)`. Celles-ci s’exécutent avant les hooks
`before_tool_call` ordinaires et avant les décisions normales des hooks. Les politiques de confiance
intégrées s’exécutent en premier ; les politiques de confiance des plugins installés s’exécutent ensuite dans l’ordre
de chargement des plugins ; les hooks `before_tool_call` ordinaires s’exécutent après elles. Les plugins intégrés conservent
le chemin existant des politiques de confiance. Les plugins installés doivent être explicitement activés
et déclarer chaque identifiant de politique dans `contracts.trustedToolPolicies` ; les identifiants non déclarés
sont rejetés avant l’enregistrement. Les identifiants de politique sont limités au plugin qui les enregistre,
de sorte que différents plugins peuvent réutiliser le même identifiant local. Utilisez ce niveau uniquement
pour les contrôles approuvés par l’hôte, tels que la politique de l’espace de travail, l’application du budget ou
la sécurité des workflows réservés.

### Hook d’environnement d’exécution

`resolve_exec_env` permet aux plugins de fournir des variables d’environnement aux appels de l’outil `exec`
avant l’exécution de la commande. Il reçoit :

- `event.sessionKey`
- `event.toolName`, actuellement toujours `"exec"`
- `event.host`, l’une des valeurs `"gateway"`, `"sandbox"` ou `"node"`
- des champs de contexte tels que `ctx.agentId`, `ctx.sessionKey`,
  `ctx.messageProvider` et `ctx.channelId`

Renvoyez un `Record<string, string>` à fusionner dans l’environnement d’exécution. Les gestionnaires
s’exécutent par ordre de priorité ; les résultats ultérieurs remplacent les résultats antérieurs pour la même
clé.

La sortie du hook est filtrée par la politique de clés d’environnement d’exécution de l’hôte avant
la fusion. `PATH` est toujours supprimé (la résolution des commandes et les vérifications des binaires sûrs
en dépendent). Les clés non valides et les clés dangereuses remplaçant les valeurs de l’hôte, telles que `LD_*`,
`DYLD_*`, `NODE_OPTIONS`, les variables de proxy (`HTTP_PROXY`, `HTTPS_PROXY`,
`ALL_PROXY`, `NO_PROXY`) et les variables de remplacement TLS (`NODE_TLS_REJECT_UNAUTHORIZED`,
`SSL_CERT_FILE` et similaires), sont supprimées. L’environnement du plugin filtré est inclus
dans les métadonnées d’approbation et d’audit du Gateway et transmis aux demandes
d’exécution sur l’hôte Node.

### Persistance des résultats d’outils

Les résultats d’outils peuvent inclure des `details` structurés pour le rendu de l’interface utilisateur, les diagnostics,
le routage des médias ou les métadonnées appartenant au plugin. Traitez `details` comme des métadonnées du runtime,
et non comme du contenu d’invite :

- OpenClaw supprime `toolResult.details` avant la relecture par le fournisseur et l’entrée de
  Compaction, afin que les métadonnées ne deviennent pas du contexte pour le modèle.
- Les entrées de session persistantes ne conservent que des `details` de taille limitée. Les détails trop volumineux sont
  remplacés par un résumé compact et `persistedDetailsTruncated: true`.
- `tool_result_persist` et `before_message_write` s’exécutent avant l’application de la limite finale
  de persistance. Conservez des `details` de petite taille et évitez de placer du texte
  pertinent pour l’invite uniquement dans `details` ; placez la sortie de l’outil visible par le modèle dans
  `content`.

## Hooks d’invite et de modèle

Utilisez les hooks propres à chaque phase pour les nouveaux plugins :

- `before_model_resolve` : reçoit uniquement l’invite actuelle et les métadonnées
  des pièces jointes. Renvoyez `providerOverride` ou `modelOverride`.
- `agent_turn_prepare` : reçoit l’invite actuelle, les messages de session
  préparés et toutes les injections mises en file d’attente exactement une fois qui ont été extraites pour cette session.
  Renvoyez `prependContext` ou `appendContext`.
- `before_prompt_build` : reçoit l’invite actuelle et les messages de session.
  Renvoyez `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` ou `appendSystemContext`.
- `heartbeat_prompt_contribution` : s’exécute uniquement pour les tours de Heartbeat et renvoie
  `prependContext` ou `appendContext`. Destiné aux moniteurs en arrière-plan qui
  doivent résumer l’état actuel sans modifier les tours initiés par l’utilisateur.

`before_agent_start` est conservé à des fins de compatibilité. Préférez les hooks explicites
ci-dessus afin que le plugin ne dépende pas d’une ancienne phase combinée.

`before_agent_run` s’exécute après la construction de l’invite et avant toute entrée du modèle,
y compris le chargement des images locales de l’invite et l’observation `llm_input`. Il reçoit
l’entrée utilisateur actuelle dans `prompt`, ainsi que l’historique de session chargé dans `messages`
et l’invite système active. Renvoyez `{ outcome: "block", reason, message? }`
pour arrêter l’exécution avant que le modèle ne lise l’invite. `reason` est interne ;
`message` est le remplacement présenté à l’utilisateur. Seuls les résultats `pass` et `block` sont
pris en charge ; les structures de décision non prises en charge entraînent un refus par défaut.

Lorsqu’une exécution est bloquée, OpenClaw stocke uniquement le texte de remplacement dans
`message.content`, ainsi que des métadonnées de blocage non sensibles telles que l’identifiant du
plugin bloquant et l’horodatage. Le texte utilisateur d’origine n’est pas conservé dans la transcription
ni dans le contexte futur. Les motifs de blocage internes sont considérés comme sensibles et
exclus des charges utiles de transcription, d’historique, de diffusion, de journal et de diagnostic.
L’observabilité doit utiliser des champs assainis tels que l’identifiant du bloqueur, le résultat,
l’horodatage ou une catégorie sûre.

`before_agent_start` et `agent_end` incluent `event.runId` lorsqu’OpenClaw peut
identifier l’exécution active ; la même valeur figure également dans `ctx.runId`. Les exécutions pilotées par
Cron exposent aussi `ctx.jobId` (l’identifiant de la tâche Cron d’origine) dans le contexte du tour
d’agent, afin que les hooks puissent limiter les métriques, les effets secondaires ou l’état à une tâche
planifiée particulière. `ctx.jobId` ne fait pas partie du contexte d’outil `before_tool_call`.

Pour les exécutions provenant d’un canal, `ctx.channel` et `ctx.messageProvider` identifient
la surface du fournisseur, telle que `discord` ou `telegram`, tandis que `ctx.channelId` est
l’identifiant de la conversation cible lorsqu’OpenClaw peut le déduire de la clé
de session ou des métadonnées de remise.

Lorsque l’identité de l’expéditeur est disponible, les contextes des hooks d’agent incluent également :

- `ctx.senderId` - identifiant de l’expéditeur limité au canal (par exemple, `open_id` de Feishu, identifiant
  utilisateur Discord). Renseigné lorsque l’exécution provient d’un message utilisateur dont les
  métadonnées d’expéditeur sont connues.
- `ctx.chatId` - identifiant de conversation propre au transport (par exemple, `chat_id` de Feishu,
  `chat_id` de Telegram). Renseigné lorsque le canal d’origine
  fournit un identifiant de conversation natif.
- `ctx.channelContext.sender.id` - le même identifiant d’expéditeur que `ctx.senderId`, dans
  un objet appartenant au canal que les plugins peuvent étendre avec des champs propres au canal.
- `ctx.channelContext.chat.id` - le même identifiant de conversation que `ctx.chatId`,
  dans un objet appartenant au canal que les plugins peuvent étendre avec des champs propres au canal.

Le cœur définit uniquement les champs `id` imbriqués. Les plugins de canal qui transmettent des
métadonnées d’expéditeur ou de conversation plus riches par l’intermédiaire de l’assistant entrant peuvent enrichir
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

Les plugins de canal transmettent ces champs par l’intermédiaire de l’assistant du SDK entrant :

```ts
buildChannelInboundEventContext({
  // ...
  channelContext: {
    sender: { id: senderOpenId, unionId, userId },
    chat: { id: chatId },
  },
});
```

Ces champs sont facultatifs et absents pour les exécutions provenant du système (Heartbeat,
Cron, événement d’exécution).

`ctx.senderExternalId` reste disponible comme champ de compatibilité source obsolète pour
les anciens plugins. Le cœur ne le renseigne pas ; les nouvelles identités d’expéditeur
propres au canal doivent se trouver sous `ctx.channelContext.sender` par augmentation
de module.

`agent_end` est un hook d’observation. Les chemins du Gateway et des harnais persistants
l’exécutent sans attendre après le tour, tandis que les chemins CLI ponctuels et éphémères attendent
la promesse du hook avant le nettoyage du processus afin que les plugins de confiance puissent vider
la télémétrie terminale ou capturer l’état. L’exécuteur de hooks applique un délai d’expiration de 30 secondes
afin qu’un plugin bloqué ou un point de terminaison d’intégration ne puisse pas laisser la promesse du hook
en attente indéfiniment. Une expiration est consignée et OpenClaw continue ; elle
n’annule pas les opérations réseau appartenant au plugin, sauf si celui-ci utilise également son propre signal
d’abandon.

Utilisez `model_call_started` et `model_call_ended` pour la télémétrie des appels au fournisseur
qui ne doit pas recevoir les prompts bruts, l’historique, les réponses, les en-têtes, les corps de
requête ni les ID de requête du fournisseur. Ces hooks incluent des métadonnées stables telles que
`runId`, `callId`, `provider`, `model`, les champs facultatifs `api`/`transport`, les champs terminaux
`durationMs`/`outcome`, ainsi que `upstreamRequestIdHash` lorsqu’OpenClaw peut produire un
hachage borné de l’ID de requête du fournisseur. Lorsque l’environnement d’exécution a résolu
les métadonnées de la fenêtre de contexte, l’événement et le contexte du hook incluent également
`contextTokenBudget`, le budget effectif de jetons après application des plafonds du modèle, de la configuration et de l’agent,
ainsi que `contextWindowSource` et `contextWindowReferenceTokens` lorsqu’un
plafond inférieur a été appliqué.

`before_agent_finalize` s’exécute uniquement lorsqu’un harnais est sur le point d’accepter une réponse finale
naturelle de l’assistant. Il ne correspond pas au chemin d’annulation `/stop` et ne
s’exécute pas lorsque l’utilisateur abandonne un tour. Renvoyez `{ action: "revise", reason }` pour demander
au harnais une passe supplémentaire du modèle avant la finalisation, `{ action:
"finalize", reason? }` pour forcer la finalisation, ou omettez le résultat pour continuer.
Les gestionnaires disposent d’un budget par défaut de 15s ; en cas d’expiration, OpenClaw consigne l’échec et
continue avec la réponse finale d’origine.
Les hooks `Stop` natifs de Codex sont relayés vers ce hook sous forme de décisions OpenClaw
`before_agent_finalize`.

Lorsqu’ils renvoient `action: "revise"`, les plugins peuvent inclure des métadonnées `retry` afin
que la passe supplémentaire du modèle soit bornée et sûre en cas de réexécution :

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` est ajoutée à la raison de révision envoyée au harnais.
`idempotencyKey` permet à l’hôte de compter les nouvelles tentatives pour une même requête de plugin
parmi des décisions de finalisation équivalentes, et `maxAttempts` limite le nombre de passes
supplémentaires que l’hôte autorisera avant de poursuivre avec la réponse finale naturelle.

Les plugins non intégrés qui ont besoin de hooks de conversation brute (`before_model_resolve`,
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

Les hooks qui modifient le prompt et les injections persistantes au tour suivant peuvent être désactivés pour chaque
plugin avec `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Extensions de session et injections au tour suivant

Les plugins de workflow peuvent conserver un petit état de session compatible avec JSON à l’aide de
`api.session.state.registerSessionExtension(...)` et le mettre à jour au moyen de la
méthode Gateway `sessions.pluginPatch`. Les lignes de session projettent l’état des
extensions enregistrées par l’intermédiaire de `pluginExtensions`, ce qui permet à Control UI et aux autres
clients d’afficher l’état appartenant au plugin sans connaître ses mécanismes internes.
`api.registerSessionExtension(...)` fonctionne toujours, mais est déconseillée au profit de
l’espace de noms `api.session.state`.

Utilisez `api.session.workflow.enqueueNextTurnInjection(...)` lorsqu’un plugin doit
transmettre exactement une fois un contexte persistant au prochain tour du modèle (la fonction de niveau supérieur
`api.enqueueNextTurnInjection(...)` est un alias déconseillé présentant le même
comportement). OpenClaw vide la file des injections avant les hooks de prompt, supprime
les injections expirées et déduplique par `idempotencyKey` pour chaque plugin. Il s’agit
du point d’intégration approprié pour les reprises après approbation, les résumés de politiques, les écarts des moniteurs
en arrière-plan et les continuations de commandes qui doivent être visibles par le modèle au
tour suivant, mais ne doivent pas devenir du texte permanent du prompt système.

La sémantique de nettoyage fait partie du contrat. Les rappels de nettoyage des extensions de session et
du cycle de vie de l’environnement d’exécution reçoivent `reset`, `delete`, `disable` ou
`restart`. L’hôte supprime l’état persistant des extensions de session appartenant au plugin
et les injections en attente pour le tour suivant lors de reset/delete/disable ; restart
conserve l’état persistant de la session, tandis que les rappels de nettoyage permettent aux plugins de libérer
les tâches du planificateur, le contexte d’exécution et les autres ressources hors bande de l’ancienne
génération de l’environnement d’exécution.

## Hooks de message

Utilisez les hooks de message pour les politiques de routage et de distribution au niveau du canal :

- `message_received` : observe le contenu entrant, l’expéditeur, `threadId`,
  `messageId`, `senderId`, la corrélation facultative avec l’exécution ou la session, ainsi que les métadonnées.
- `message_sending` : réécrit `content` ou renvoie `{ cancel: true }`.
- `reply_payload_sending` : réécrit les objets `ReplyPayload` normalisés
  (notamment `presentation`, `delivery`, les références aux médias et le texte) ou renvoie
  `{ cancel: true }`.
- `message_sent` : observe la réussite ou l’échec final.

Pour les réponses TTS uniquement audio, `content` peut contenir la transcription vocale
masquée même lorsque la charge utile du canal ne comporte aucun texte ni aucune légende visible.
La réécriture de ce `content` met uniquement à jour la transcription visible par le hook ; elle n’est pas
affichée comme légende du média.

Les événements `reply_payload_sending` peuvent inclure `usageState`, un instantané en direct
fourni au mieux pour chaque tour concernant le modèle, l’utilisation et le contexte. La distribution persistante, la réexécution récupérée et
les réponses sans corrélation exacte avec l’exécution l’omettent.

Les contextes des hooks de message exposent des champs de corrélation stables lorsqu’ils sont disponibles :
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` et `ctx.callDepth`. Les contextes entrants
et `before_dispatch` exposent également les métadonnées de réponse lorsque le canal
dispose des données du message cité filtrées selon la visibilité : `replyToId`, `replyToIdFull`,
`replyToBody`, `replyToSender` et `replyToIsQuote`. Privilégiez ces
champs de premier ordre avant de lire les métadonnées héritées.

Privilégiez les champs typés `threadId` et `replyToId` avant d’utiliser des métadonnées
propres au canal.

Règles de décision :

- `message_sending` avec `cancel: true` est terminal.
- `message_sending` avec `cancel: false` est traité comme une absence de décision.
- Le `content` réécrit continue vers les hooks de priorité inférieure, sauf si un hook ultérieur
  annule la distribution.
- `reply_payload_sending` s’exécute après la normalisation de la charge utile et avant la distribution
  sur le canal, y compris pour les réponses redirigées vers le canal d’origine.
  Les gestionnaires s’exécutent séquentiellement et chacun voit la dernière charge utile produite
  par les gestionnaires de priorité supérieure.
- Les charges utiles de `reply_payload_sending` n’exposent pas les marqueurs de confiance de l’environnement d’exécution tels que
  `trustedLocalMedia` ; les plugins peuvent modifier la structure de la charge utile, mais ne peuvent pas accorder la confiance
  aux médias locaux.
- `message_sending` peut renvoyer `cancelReason` et des `metadata` bornées avec une
  annulation. Les nouvelles API de cycle de vie des messages exposent cela comme un résultat de distribution
  supprimée avec la raison `cancelled_by_message_sending_hook` ; la distribution directe
  héritée continue de renvoyer un tableau de résultats vide par compatibilité.
- `message_sent` est uniquement destiné à l’observation. Les échecs des gestionnaires sont consignés et ne
  modifient pas le résultat de la distribution.

## Hooks d’installation

Utilisez `security.installPolicy` pour les décisions d’autorisation ou de blocage appartenant à l’opérateur. Cette
politique s’exécute à partir de la configuration OpenClaw, couvre les chemins d’installation et de mise à jour de la CLI, et
échoue en mode fermé lorsqu’elle est activée mais indisponible.

`before_install` est un hook de cycle de vie de l’environnement d’exécution des plugins. Il s’exécute après
`security.installPolicy` uniquement dans le processus OpenClaw où les hooks de plugins ont
déjà été chargés, par exemple dans les flux d’installation adossés au Gateway. Il est utile pour
les observations, avertissements et vérifications de compatibilité appartenant au plugin, mais ne constitue pas
la principale frontière de sécurité de l’entreprise ou de l’hôte pour les installations. Le champ
`builtinScan` reste présent dans la charge utile de l’événement par compatibilité, mais
OpenClaw n’effectue plus de blocage intégré du code dangereux au moment de l’installation ; il
s’agit donc d’un résultat `ok` vide. Renvoyez des constatations supplémentaires ou
`{ block: true, blockReason }` pour arrêter l’installation dans ce processus.

`block: true` est terminal. `block: false` est traité comme une absence de décision. Les échecs des gestionnaires
bloquent l’installation en mode fermé.

## Cycle de vie du Gateway

Utilisez `gateway_start` pour démarrer les services généraux des plugins et `gateway_stop` pour
nettoyer les ressources de longue durée. Le planificateur Cron peut encore être en cours de chargement lorsque
`gateway_start` s’exécute ; ne l’utilisez donc pas comme signal de référence pour une projection
Cron externe.

Ne vous appuyez pas sur le hook interne `gateway:startup` pour les services de l’environnement d’exécution
appartenant aux plugins.

`cron_reconciled` est déclenché après que le planificateur Cron du Gateway et ses observateurs de sortie
ont réconcilié leur état persistant. Il est déclenché aussi bien lors du
démarrage initial que lors du remplacement du planificateur pendant le rechargement de la configuration. L’événement indique
`reason` (`startup` ou `reload`) et l’état `enabled` effectif. Un Cron désactivé
émet tout de même un événement avec `enabled: false`, ce qui permet à une projection externe de
supprimer les réveils obsolètes. Utilisez `ctx.getCron?.()` pour obtenir l’instance exacte du planificateur qui
a terminé la réconciliation ; un rechargement ultérieur ne redirige pas ce rappel.
`ctx.abortSignal` appartient au même instantané du planificateur. Le Gateway l’abandonne dès
qu’un planificateur plus récent est armé ou que l’arrêt commence. Transmettez-le à chaque
effet secondaire persistant et n’acceptez pas l’instantané après son abandon.
Il s’agit d’un signal de cycle de vie du planificateur, et non d’un signal d’activation de plugin : un
rechargement à chaud limité au plugin ne le redéclenche pas. Un consommateur nouvellement activé reçoit
sa première référence lors du prochain remplacement du planificateur ou démarrage du Gateway.

Comme les autres hooks d’observation, les rappels `gateway_start` et `cron_reconciled`
peuvent se chevaucher. Si les deux gestionnaires partagent l’initialisation du plugin, coordonnez-les
avec une promesse locale au plugin indiquant qu’il est prêt, plutôt qu’en vous appuyant sur l’ordre des rappels.

`cron_changed` est déclenché pour les événements de cycle de vie Cron appartenant au Gateway avec une charge utile
d’événement typée couvrant les raisons `added`, `updated`, `removed`, `started`, `finished`
et `scheduled`. L’événement transporte un instantané `PluginHookGatewayCronJob`
(notamment `state.nextRunAtMs`, `state.lastRunStatus` et
`state.lastError` lorsqu’ils sont présents), ainsi qu’un `PluginHookGatewayCronDeliveryStatus`
valant `not-requested` | `delivered` | `not-delivered` | `unknown`. Les événements de suppression
sont postérieurs à la validation : ils ne sont déclenchés qu’après la réussite de la suppression persistante et transportent toujours
l’instantané de la tâche supprimée afin que les planificateurs externes puissent réconcilier l’état.

Un événement `scheduled` est postérieur à la validation : il n’est déclenché qu’après qu’une écriture persistante réussie
a modifié la valeur `nextRunAtMs` effective d’une tâche existante, à l’exclusion de l’événement de cycle de vie
explicite `added`, `updated` ou `removed` de cette tâche. Le champ de niveau supérieur
`event.nextRunAtMs` correspond au prochain réveil validé ; lorsqu’il est absent, la tâche
n’a aucun prochain réveil. Traitez ces événements comme des indications de réconciliation, et non comme un journal ordonné
des différences. Utilisez-les comme des indications pouvant être regroupées pour relire le dernier planificateur capturé par
`cron_reconciled` ; n’adoptez pas le planificateur depuis un contexte `cron_changed`.
Conservez OpenClaw comme source de vérité pour la vérification des échéances et l’exécution.

### Projection Cron externe sûre

Projetez un instantané complet des réveils au lieu de transmettre les différences des événements Cron. L’opération
`replaceAll` de l’adaptateur externe doit être atomique et idempotente, et elle
ne doit se résoudre qu’après que l’hôte a accepté durablement l’instantané. Elle doit
également respecter le signal d’abandon fourni : si le signal est abandonné avant l’acceptation
persistante, l’adaptateur ne doit pas accepter cet instantané.

Ce modèle maintient un seul worker du dernier état en cours. Seul `cron_reconciled`
adopte une instance du planificateur ; `cron_changed` demande simplement à ce worker de relire
l’instance faisant autorité, afin qu’une indication tardive ne puisse pas restaurer un planificateur plus ancien.
Une révision plus récente abandonne la tentative active de l’hôte avant qu’elle puisse accepter un instantané
obsolète.

```typescript
import { setTimeout as sleep } from "node:timers/promises";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-entry";

type ExternalWake = { jobId: string; runAtMs: number };

type ExternalWakeHost = {
  replaceAll(wakes: readonly ExternalWake[], options: { signal: AbortSignal }): Promise<void>;
  close(): Promise<void>;
};

type CronReader = {
  list(options: { includeDisabled: true }): Promise<
    Array<{
      id: string;
      enabled?: boolean;
      state?: { nextRunAtMs?: number };
    }>
  >;
};

export function registerCronProjection(api: OpenClawPluginApi, host: ExternalWakeHost) {
  const lifecycle = new AbortController();
  let cron: CronReader | undefined;
  let enabled = false;
  let hasBaseline = false;
  let reconciliationSignal: AbortSignal | undefined;
  let requestedRevision = 0;
  let appliedRevision = 0;
  let worker = Promise.resolve();
  let activeAttempt: AbortController | undefined;

  const projectLatest = async () => {
    let retryMs = 1_000;

    while (!lifecycle.signal.aborted && appliedRevision < requestedRevision) {
      const ownerSignal = reconciliationSignal;
      if (!ownerSignal || ownerSignal.aborted) {
        return;
      }
      const targetRevision = requestedRevision;
      const attempt = new AbortController();
      const signal = AbortSignal.any([lifecycle.signal, ownerSignal, attempt.signal]);
      activeAttempt = attempt;

      try {
        const jobs = enabled && cron ? await cron.list({ includeDisabled: true }) : [];
        if (signal.aborted || targetRevision !== requestedRevision) {
          continue;
        }
        const wakes = jobs
          .flatMap((job): ExternalWake[] => {
            const runAtMs = job.enabled === false ? undefined : job.state?.nextRunAtMs;
            return runAtMs === undefined ? [] : [{ jobId: job.id, runAtMs }];
          })
          .sort((a, b) => a.runAtMs - b.runAtMs || a.jobId.localeCompare(b.jobId));

        await host.replaceAll(wakes, { signal });
        if (signal.aborted || targetRevision !== requestedRevision) {
          continue;
        }
        appliedRevision = targetRevision;
        retryMs = 1_000;
      } catch {
        if (lifecycle.signal.aborted || ownerSignal.aborted) {
          return;
        }
        if (attempt.signal.aborted) {
          continue;
        }
        api.logger.warn(`external cron projection failed; retrying in ${retryMs}ms`);
        try {
          await sleep(retryMs, undefined, { signal });
        } catch {
          if (lifecycle.signal.aborted) {
            return;
          }
          if (attempt.signal.aborted) {
            continue;
          }
        }
        retryMs = Math.min(retryMs * 2, 30_000);
      } finally {
        if (activeAttempt === attempt) {
          activeAttempt = undefined;
        }
      }
    }
  };

  const requestProjection = () => {
    const targetRevision = ++requestedRevision;
    activeAttempt?.abort();
    worker = worker.then(async () => {
      if (!lifecycle.signal.aborted && appliedRevision < targetRevision) {
        await projectLatest();
      }
    });
    return worker;
  };

  api.on("cron_reconciled", (event, ctx) => {
    const reconciledCron = ctx.getCron?.();
    if (event.enabled && !reconciledCron) {
      api.logger.warn("cron reconciliation did not expose a scheduler");
      return;
    }
    cron = reconciledCron;
    enabled = event.enabled;
    hasBaseline = true;
    reconciliationSignal = ctx.abortSignal;
    return requestProjection();
  });

  api.on("cron_changed", () => {
    if (hasBaseline) {
      return requestProjection();
    }
  });

  api.on("gateway_stop", async () => {
    lifecycle.abort();
    await worker;
    await host.close();
  });
}
```

Lorsque `cron_reconciled` signale `enabled: false`, le même chemin appelle
`replaceAll([])` et supprime les réveils externes obsolètes. Dans cet exemple,
les nouvelles tentatives et l’attente exponentielle sont locales au processus
et considèrent les échecs de l’adaptateur d’exécution comme transitoires ;
validez la configuration non récupérable avant l’enregistrement. OpenClaw ne
fournit pas de boîte d’envoi pour les effets des hooks de Plugin. Si le processus
se termine avant l’acceptation durable, le prochain démarrage du Gateway émet un
nouvel instantané `cron_reconciled` faisant autorité. `gateway_stop` interrompt
le travail de l’hôte en cours, attend que le worker se termine, puis ferme
l’adaptateur.

## Dépréciations à venir

Quelques surfaces associées aux hooks sont dépréciées, mais restent prises en
charge. Effectuez la migration avant la prochaine version majeure :

- **Enveloppes de canal en texte brut** dans les gestionnaires `inbound_claim`
  et `message_received`. Lisez `BodyForAgent` et les blocs structurés de
  contexte utilisateur au lieu d’analyser le texte d’enveloppe à plat. Voir
  [Enveloppes de canal en texte brut → BodyForAgent](/fr/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** est conservé à des fins de compatibilité. Les
  nouveaux plugins doivent utiliser `before_model_resolve` et
  `before_prompt_build` au lieu de la phase combinée.
- **`subagent_spawning`** est conservé pour assurer la compatibilité avec les
  anciens plugins, mais les nouveaux plugins ne doivent pas renvoyer de routage
  de fil de discussion depuis celui-ci. Le cœur prépare les liaisons de
  sous-agent `thread: true` au moyen des adaptateurs de liaison de session de
  canal avant le déclenchement de `subagent_spawned`.
- **`deactivate`** reste un alias de compatibilité déprécié pour le nettoyage
  jusqu’après le 2026-08-16. Les nouveaux plugins doivent utiliser
  `gateway_stop`.
- **`onResolution` dans `before_tool_call`** utilise désormais l’union typée
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) au lieu d’une valeur `string` libre.
- **`api.registerSessionExtension` / `api.enqueueNextTurnInjection`** restent
  des alias de compatibilité de premier niveau. Les nouveaux plugins doivent
  utiliser `api.session.state.registerSessionExtension(...)` et
  `api.session.workflow.enqueueNextTurnInjection(...)`.

Pour la liste complète — enregistrement des capacités de mémoire, profil de
raisonnement du fournisseur, fournisseurs d’authentification externes, types de
découverte de fournisseurs, accesseurs d’exécution des tâches et renommage de
`command-auth` en `command-status` — consultez
[Migration du SDK de Plugin → Dépréciations actives](/fr/plugins/sdk-migration#active-deprecations).

## Pages connexes

- [Migration du SDK de Plugin](/fr/plugins/sdk-migration) — dépréciations actives et calendrier de suppression
- [Création de plugins](/fr/plugins/building-plugins)
- [Présentation du SDK de Plugin](/fr/plugins/sdk-overview)
- [Points d’entrée des plugins](/fr/plugins/sdk-entrypoints)
- [Hooks internes](/fr/automation/hooks)
- [Fonctionnement interne de l’architecture des plugins](/fr/plugins/architecture-internals)
