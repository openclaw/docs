---
read_when:
    - Explication de la façon dont les messages entrants deviennent des réponses
    - Clarification des sessions, des modes de mise en file d’attente ou du comportement de streaming
    - Documenter la visibilité du raisonnement et les implications d’utilisation
summary: Flux de messages, sessions, mise en file d’attente et visibilité du raisonnement
title: Messages
x-i18n:
    generated_at: "2026-04-30T07:22:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcfcc995995516b627993755b255a779c681b4976d2d724c0c11e87875e37b1e
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw traite les messages entrants au moyen d’un pipeline de résolution de session, de mise en file d’attente, de streaming, d’exécution d’outils et de visibilité du raisonnement. Cette page décrit le chemin allant du message entrant à la réponse.

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
- Les remplacements de canal (`channels.whatsapp.*`, `channels.telegram.*`, etc.) pour les limites et les options de streaming.

Consultez [Configuration](/fr/gateway/configuration) pour le schéma complet.

## Déduplication entrante

Les canaux peuvent relivrer le même message après des reconnexions. OpenClaw conserve un cache de courte durée indexé par canal/compte/pair/session/identifiant de message afin que les livraisons en double ne déclenchent pas une autre exécution d’agent.

## Débounce entrant

Les messages consécutifs rapides provenant du **même expéditeur** peuvent être regroupés en un seul tour d’agent via `messages.inbound`. Le débounce est limité par canal + conversation et utilise le message le plus récent pour le fil de réponse/les identifiants.

Configuration (valeur par défaut globale + remplacements par canal) :

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

- Le débounce s’applique aux messages **texte uniquement** ; les médias/pièces jointes sont envoyés immédiatement.
- Les commandes de contrôle contournent le débounce afin de rester autonomes — **sauf** lorsqu’un canal choisit explicitement le regroupement des DM du même expéditeur (par exemple [BlueBubbles `coalesceSameSenderDms`](/fr/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), où les commandes DM attendent dans la fenêtre de débounce afin qu’une charge utile envoyée en plusieurs parties puisse rejoindre le même tour d’agent.

## Sessions et appareils

Les sessions appartiennent au Gateway, pas aux clients.

- Les conversations directes se replient sur la clé de session principale de l’agent.
- Les groupes/canaux obtiennent leurs propres clés de session.
- Le magasin de sessions et les transcriptions résident sur l’hôte du Gateway.

Plusieurs appareils/canaux peuvent correspondre à la même session, mais l’historique n’est pas entièrement resynchronisé vers chaque client. Recommandation : utilisez un appareil principal pour les longues conversations afin d’éviter un contexte divergent. La Control UI et la TUI affichent toujours la transcription de session soutenue par le Gateway ; elles constituent donc la source de vérité.

Détails : [Gestion des sessions](/fr/concepts/session).

## Métadonnées des résultats d’outil

Le `content` d’un résultat d’outil est le résultat visible par le modèle. Les `details` d’un résultat d’outil sont des métadonnées d’exécution pour le rendu de l’UI, les diagnostics, la livraison des médias et les plugins.

OpenClaw rend cette frontière explicite :

- `toolResult.details` est retiré avant la relecture par le fournisseur et l’entrée de Compaction.
- Les transcriptions de session persistées ne conservent que des `details` bornés ; les métadonnées trop volumineuses sont remplacées par un résumé compact marqué `persistedDetailsTruncated: true`.
- Les plugins et outils doivent placer le texte que le modèle doit lire dans `content`, et pas seulement dans `details`.

## Corps entrants et contexte d’historique

OpenClaw sépare le **corps de l’invite** du **corps de commande** :

- `Body` : texte d’invite envoyé à l’agent. Il peut inclure des enveloppes de canal et des wrappers d’historique facultatifs.
- `CommandBody` : texte utilisateur brut pour l’analyse des directives/commandes.
- `RawBody` : alias historique de `CommandBody` (conservé pour compatibilité).

Lorsqu’un canal fournit un historique, il utilise un wrapper partagé :

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Pour les **conversations non directes** (groupes/canaux/salles), le **corps du message actuel** est préfixé avec l’étiquette de l’expéditeur (dans le même style que celui utilisé pour les entrées d’historique). Cela garde les messages en temps réel et les messages mis en file d’attente/d’historique cohérents dans l’invite de l’agent.

Les tampons d’historique sont **uniquement en attente** : ils incluent les messages de groupe qui n’ont _pas_ déclenché d’exécution (par exemple, les messages filtrés par mention) et **excluent** les messages déjà présents dans la transcription de session.

La suppression des directives ne s’applique qu’à la section du **message actuel** afin que l’historique reste intact. Les canaux qui enveloppent l’historique doivent définir `CommandBody` (ou `RawBody`) sur le texte original du message et garder `Body` comme invite combinée. Les tampons d’historique sont configurables via `messages.groupChat.historyLimit` (valeur par défaut globale) et des remplacements par canal comme `channels.slack.historyLimit` ou `channels.telegram.accounts.<id>.historyLimit` (définissez `0` pour désactiver).

## Mise en file d’attente et suivis

Si une exécution est déjà active, les messages entrants peuvent être mis en file d’attente, orientés vers l’exécution actuelle, ou collectés pour un tour de suivi.

- Configurez via `messages.queue` (et `messages.queue.byChannel`).
- Le mode par défaut est `steer`, avec un débounce de suivi de 500 ms lorsque l’orientation revient à une livraison de suivi mise en file d’attente.
- Modes : `steer`, `followup`, `collect`, `steer-backlog`, `interrupt`, et l’ancien mode `queue` un élément à la fois.

Détails : [File de commandes](/fr/concepts/queue) et [File d’orientation](/fr/concepts/queue-steering).

## Propriété des exécutions de canal

Les plugins de canal peuvent préserver l’ordre, appliquer un débounce à l’entrée et appliquer une rétropression de transport avant qu’un message n’entre dans la file de session. Ils ne doivent pas imposer de délai d’expiration distinct autour du tour d’agent lui-même. Une fois qu’un message est routé vers une session, le travail de longue durée est régi par la session, l’outil et le cycle de vie d’exécution afin que tous les canaux signalent les tours lents et s’en rétablissent de manière cohérente.

## Streaming, découpage et regroupement

Le streaming par blocs envoie des réponses partielles au fur et à mesure que le modèle produit des blocs de texte. Le découpage respecte les limites de texte du canal et évite de scinder les blocs de code clôturés.

Paramètres clés :

- `agents.defaults.blockStreamingDefault` (`on|off`, désactivé par défaut)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (regroupement basé sur l’inactivité)
- `agents.defaults.humanDelay` (pause de type humain entre les réponses par blocs)
- Remplacements de canal : `*.blockStreaming` et `*.blockStreamingCoalesce` (les canaux non-Telegram exigent `*.blockStreaming: true` explicite)

Détails : [Streaming + découpage](/fr/concepts/streaming).

## Visibilité du raisonnement et jetons

OpenClaw peut exposer ou masquer le raisonnement du modèle :

- `/reasoning on|off|stream` contrôle la visibilité.
- Le contenu de raisonnement compte toujours dans l’utilisation des jetons lorsqu’il est produit par le modèle.
- Telegram prend en charge le flux de raisonnement dans la bulle de brouillon.

Détails : [Directives de réflexion + raisonnement](/fr/tools/thinking) et [Utilisation des jetons](/fr/reference/token-use).

## Préfixes, fils et réponses

La mise en forme des messages sortants est centralisée dans `messages` :

- `messages.responsePrefix`, `channels.<channel>.responsePrefix`, et `channels.<channel>.accounts.<id>.responsePrefix` (cascade de préfixe sortant), plus `channels.whatsapp.messagePrefix` (préfixe entrant WhatsApp)
- Fil de réponse via `replyToMode` et valeurs par défaut par canal

Détails : [Configuration](/fr/gateway/config-agents#messages) et documentation des canaux.

## Réponses silencieuses

Le jeton silencieux exact `NO_REPLY` / `no_reply` signifie « ne pas livrer de réponse visible par l’utilisateur ».
Lorsqu’un tour comporte également des médias d’outil en attente, comme un audio TTS généré, OpenClaw supprime le texte silencieux mais livre tout de même la pièce jointe multimédia.
OpenClaw résout ce comportement par type de conversation :

- Les conversations directes interdisent le silence par défaut et réécrivent une réponse silencieuse seule en court repli visible.
- Les groupes/canaux autorisent le silence par défaut.
- L’orchestration interne autorise le silence par défaut.

OpenClaw utilise également des réponses silencieuses pour les échecs internes du runner qui surviennent avant toute réponse de l’assistant dans les conversations non directes, afin que les groupes/canaux ne voient pas de texte standard d’erreur du Gateway. Les conversations directes affichent une copie d’échec compacte par défaut ; les détails bruts du runner ne sont affichés que lorsque `/verbose` est `on` ou `full`.

Les valeurs par défaut se trouvent sous `agents.defaults.silentReply` et `agents.defaults.silentReplyRewrite` ; `surfaces.<id>.silentReply` et `surfaces.<id>.silentReplyRewrite` peuvent les remplacer par surface.

Lorsque la session parente a une ou plusieurs exécutions de sous-agent engendrées en attente, les réponses silencieuses seules sont abandonnées sur toutes les surfaces au lieu d’être réécrites, afin que le parent reste silencieux jusqu’à ce que l’événement d’achèvement de l’enfant livre la vraie réponse.

## Associé

- [Streaming](/fr/concepts/streaming) — livraison des messages en temps réel
- [Nouvelle tentative](/fr/concepts/retry) — comportement de nouvelle tentative de livraison des messages
- [File d’attente](/fr/concepts/queue) — file de traitement des messages
- [Canaux](/fr/channels) — intégrations de plateformes de messagerie
