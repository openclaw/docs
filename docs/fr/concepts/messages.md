---
read_when:
    - Expliquer comment les messages entrants deviennent des réponses
    - Clarification des sessions, des modes de mise en file d’attente ou du comportement de streaming
    - Documenter la visibilité du raisonnement et les implications d'utilisation
summary: Flux des messages, sessions, mise en file d’attente et visibilité du raisonnement
title: Messages
x-i18n:
    generated_at: "2026-05-04T07:03:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 15242e21fd17a9f2013561003e108d197204d834caf51bbcdc53ffb3f118b14f
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw gère les messages entrants au moyen d’un pipeline de résolution de session, de mise en file d’attente, de streaming, d’exécution d’outils et de visibilité du raisonnement. Cette page décrit le chemin d’un message entrant jusqu’à la réponse.

## Flux des messages (vue d’ensemble)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

Les principaux réglages se trouvent dans la configuration :

- `messages.*` pour les préfixes, la mise en file d’attente et le comportement des groupes.
- `agents.defaults.*` pour les valeurs par défaut du streaming par blocs et du découpage.
- Les remplacements par canal (`channels.whatsapp.*`, `channels.telegram.*`, etc.) pour les limites et les options de streaming.

Voir [Configuration](/fr/gateway/configuration) pour le schéma complet.

## Déduplication entrante

Les canaux peuvent renvoyer le même message après des reconnexions. OpenClaw conserve un
cache de courte durée indexé par canal/compte/paire/session/identifiant de message afin que les livraisons
dupliquées ne déclenchent pas une autre exécution d’agent.

## Anti-rebond entrant

Des messages rapides et consécutifs du **même expéditeur** peuvent être regroupés en un seul
tour d’agent via `messages.inbound`. L’anti-rebond est limité à chaque canal + conversation
et utilise le message le plus récent pour le threading et les identifiants de réponse.

Configuration (valeur globale par défaut + remplacements par canal) :

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000,
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
        discord: 1500,
      },
    },
  },
}
```

Notes :

- L’anti-rebond s’applique aux messages **texte uniquement** ; les médias/pièces jointes sont envoyés immédiatement.
- Les commandes de contrôle contournent l’anti-rebond afin de rester autonomes — **sauf** lorsqu’un canal choisit explicitement de regrouper les DM du même expéditeur (par exemple [BlueBubbles `coalesceSameSenderDms`](/fr/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), où les commandes DM attendent dans la fenêtre d’anti-rebond afin qu’une charge utile envoyée en plusieurs parties puisse rejoindre le même tour d’agent.

## Sessions et appareils

Les sessions appartiennent au Gateway, pas aux clients.

- Les discussions directes sont ramenées à la clé de session principale de l’agent.
- Les groupes/canaux obtiennent leurs propres clés de session.
- Le stockage des sessions et les transcriptions résident sur l’hôte du Gateway.

Plusieurs appareils/canaux peuvent pointer vers la même session, mais l’historique n’est pas entièrement
resynchronisé vers chaque client. Recommandation : utilisez un appareil principal pour les longues
conversations afin d’éviter un contexte divergent. L’interface de contrôle et la TUI affichent toujours la
transcription de session adossée au Gateway ; elles constituent donc la source de vérité.

Détails : [Gestion des sessions](/fr/concepts/session).

## Métadonnées des résultats d’outil

Le `content` d’un résultat d’outil est le résultat visible par le modèle. Le `details` d’un résultat d’outil contient
les métadonnées d’exécution pour le rendu d’interface, les diagnostics, la livraison de médias et les plugins.

OpenClaw garde cette frontière explicite :

- `toolResult.details` est supprimé avant la relecture par le fournisseur et l’entrée de compaction.
- Les transcriptions de session persistées ne conservent que des `details` bornés ; les métadonnées trop volumineuses
  sont remplacées par un résumé compact marqué `persistedDetailsTruncated: true`.
- Les plugins et les outils doivent placer le texte que le modèle doit lire dans `content`, pas seulement
  dans `details`.

## Corps entrants et contexte d’historique

OpenClaw sépare le **corps de prompt** du **corps de commande** :

- `BodyForAgent` : texte principal destiné au modèle pour le message actuel. Les plugins de canal
  doivent le garder centré sur le texte actuel de l’expéditeur qui porte le prompt.
- `Body` : repli de prompt historique. Il peut inclure des enveloppes de canal et
  des wrappers d’historique facultatifs, mais les canaux actuels ne doivent pas s’y fier comme
  entrée principale du modèle lorsque `BodyForAgent` est disponible.
- `CommandBody` : texte utilisateur brut pour l’analyse des directives/commandes.
- `RawBody` : alias historique de `CommandBody` (conservé pour compatibilité).

Lorsqu’un canal fournit un historique, il utilise un wrapper partagé :

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Pour les **discussions non directes** (groupes/canaux/salles), le **corps du message actuel** est préfixé par le
libellé de l’expéditeur (dans le même style que les entrées d’historique). Cela maintient la cohérence des messages en temps réel et en file d’attente/historique
dans le prompt de l’agent.

Les tampons d’historique sont **uniquement en attente** : ils incluent les messages de groupe qui n’ont _pas_
déclenché d’exécution (par exemple, les messages soumis à une mention) et **excluent** les messages
déjà présents dans la transcription de session.

La suppression des directives ne s’applique qu’à la section du **message actuel**, afin que l’historique
reste intact. Les canaux qui enveloppent l’historique doivent définir `CommandBody` (ou
`RawBody`) sur le texte original du message et conserver `Body` comme prompt combiné.
L’historique structuré, les réponses, les transferts et les métadonnées de canal sont rendus comme
blocs de contexte non fiable au rôle utilisateur lors de l’assemblage du prompt.
Les tampons d’historique sont configurables via `messages.groupChat.historyLimit` (valeur globale
par défaut) et des remplacements par canal comme `channels.slack.historyLimit` ou
`channels.telegram.accounts.<id>.historyLimit` (définissez `0` pour désactiver).

## Mise en file d’attente et suivis

Si une exécution est déjà active, les messages entrants peuvent être mis en file d’attente, orientés vers
l’exécution actuelle ou collectés pour un tour de suivi.

- Configurez via `messages.queue` (et `messages.queue.byChannel`).
- Le mode par défaut est `steer`, avec un anti-rebond de suivi de 500 ms lorsque l’orientation revient
  à une livraison de suivi mise en file d’attente.
- Modes : `steer`, `followup`, `collect`, `steer-backlog`, `interrupt` et le mode historique
  un-à-la-fois `queue`.

Détails : [File de commandes](/fr/concepts/queue) et [File d’orientation](/fr/concepts/queue-steering).

## Propriété d’exécution des canaux

Les plugins de canal peuvent préserver l’ordre, appliquer un anti-rebond à l’entrée et appliquer une contre-pression
de transport avant qu’un message n’entre dans la file de session. Ils ne doivent pas imposer de
délai d’expiration séparé autour du tour d’agent lui-même. Une fois qu’un message est routé vers une
session, les travaux de longue durée sont régis par la session, l’outil et le cycle de vie
d’exécution, afin que tous les canaux signalent les tours lents et s’en remettent de manière cohérente.

## Streaming, découpage et regroupement

Le streaming par blocs envoie des réponses partielles à mesure que le modèle produit des blocs de texte.
Le découpage respecte les limites de texte du canal et évite de scinder les blocs de code clôturés.

Paramètres clés :

- `agents.defaults.blockStreamingDefault` (`on|off`, désactivé par défaut)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (regroupement basé sur l’inactivité)
- `agents.defaults.humanDelay` (pause de type humain entre les réponses par blocs)
- Remplacements par canal : `*.blockStreaming` et `*.blockStreamingCoalesce` (les canaux non-Telegram nécessitent un `*.blockStreaming: true` explicite)

Détails : [Streaming + découpage](/fr/concepts/streaming).

## Visibilité du raisonnement et tokens

OpenClaw peut exposer ou masquer le raisonnement du modèle :

- `/reasoning on|off|stream` contrôle la visibilité.
- Le contenu de raisonnement compte toujours dans l’utilisation des tokens lorsqu’il est produit par le modèle.
- Telegram prend en charge le flux de raisonnement dans une bulle de brouillon transitoire supprimée après la livraison finale ; utilisez `/reasoning on` pour une sortie de raisonnement persistante.

Détails : [Directives de pensée + raisonnement](/fr/tools/thinking) et [Utilisation des tokens](/fr/reference/token-use).

## Préfixes, threading et réponses

La mise en forme des messages sortants est centralisée dans `messages` :

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` et `channels.<channel>.accounts.<id>.responsePrefix` (cascade de préfixes sortants), plus `channels.whatsapp.messagePrefix` (préfixe entrant WhatsApp)
- Threading des réponses via `replyToMode` et les valeurs par défaut par canal

Détails : [Configuration](/fr/gateway/config-agents#messages) et documentation des canaux.

## Réponses silencieuses

Le token silencieux exact `NO_REPLY` / `no_reply` signifie « ne pas livrer de réponse visible par l’utilisateur ».
Lorsqu’un tour contient aussi des médias d’outil en attente, comme un audio TTS généré, OpenClaw
supprime le texte silencieux mais livre quand même la pièce jointe média.
OpenClaw résout ce comportement selon le type de conversation :

- Les conversations directes interdisent le silence par défaut et réécrivent une réponse
  silencieuse seule en un court repli visible.
- Les groupes/canaux autorisent le silence par défaut.
- L’orchestration interne autorise le silence par défaut.

OpenClaw utilise aussi les réponses silencieuses pour les échecs internes d’exécuteur qui surviennent
avant toute réponse d’assistant dans les discussions non directes, afin que les groupes/canaux ne voient pas
de texte passe-partout d’erreur du Gateway. Les discussions directes affichent par défaut une copie d’échec compacte ;
les détails bruts de l’exécuteur ne sont affichés que lorsque `/verbose` est `on` ou `full`.

Les valeurs par défaut résident sous `agents.defaults.silentReply` et
`agents.defaults.silentReplyRewrite` ; `surfaces.<id>.silentReply` et
`surfaces.<id>.silentReplyRewrite` peuvent les remplacer par surface.

Lorsque la session parente possède une ou plusieurs exécutions de sous-agent engendrées en attente, les réponses
silencieuses seules sont supprimées sur toutes les surfaces au lieu d’être réécrites, afin que le
parent reste silencieux jusqu’à ce que l’événement d’achèvement enfant livre la vraie réponse.

## Connexe

- [Streaming](/fr/concepts/streaming) — livraison de messages en temps réel
- [Nouvelle tentative](/fr/concepts/retry) — comportement de nouvelle tentative de livraison des messages
- [File d’attente](/fr/concepts/queue) — file de traitement des messages
- [Canaux](/fr/channels) — intégrations de plateformes de messagerie
