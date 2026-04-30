---
read_when:
    - Expliquer comment les messages entrants deviennent des réponses
    - Clarification des sessions, des modes de mise en file d’attente ou du comportement de diffusion en continu
    - Documenter la visibilité du raisonnement et les implications d’utilisation
summary: Flux des messages, sessions, mise en file d’attente et visibilité du raisonnement
title: Messages
x-i18n:
    generated_at: "2026-04-30T16:27:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: fdeee014d92767a725501691fbe0c4ee6b631acc9a2ab5cbbcf321bfee9679b9
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw gère les messages entrants au moyen d’un pipeline de résolution de session, de mise en file d’attente, de streaming, d’exécution d’outils et de visibilité du raisonnement. Cette page cartographie le chemin d’un message entrant jusqu’à la réponse.

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
- Les remplacements par canal (`channels.whatsapp.*`, `channels.telegram.*`, etc.) pour les limites et les bascules de streaming.

Consultez [Configuration](/fr/gateway/configuration) pour le schéma complet.

## Déduplication entrante

Les canaux peuvent relivrer le même message après des reconnexions. OpenClaw conserve un cache de courte durée indexé par canal/compte/pair/session/ID de message, afin que les livraisons en double ne déclenchent pas une autre exécution de l’agent.

## Anti-rebond entrant

Les messages consécutifs rapides provenant du **même expéditeur** peuvent être regroupés en un seul tour d’agent via `messages.inbound`. L’anti-rebond est limité à chaque canal + conversation et utilise le message le plus récent pour le fil de réponse et les ID.

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

- L’anti-rebond s’applique aux messages **texte uniquement** ; les médias/pièces jointes sont vidés immédiatement.
- Les commandes de contrôle contournent l’anti-rebond afin de rester autonomes — **sauf** lorsqu’un canal opte explicitement pour la fusion des DM du même expéditeur (par ex. [BlueBubbles `coalesceSameSenderDms`](/fr/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), où les commandes DM attendent dans la fenêtre d’anti-rebond afin qu’une charge utile envoyée en plusieurs parties puisse rejoindre le même tour d’agent.

## Sessions et appareils

Les sessions appartiennent au Gateway, pas aux clients.

- Les discussions directes sont regroupées dans la clé de session principale de l’agent.
- Les groupes/canaux obtiennent leurs propres clés de session.
- Le magasin de sessions et les transcriptions résident sur l’hôte Gateway.

Plusieurs appareils/canaux peuvent correspondre à la même session, mais l’historique n’est pas entièrement resynchronisé vers chaque client. Recommandation : utilisez un appareil principal pour les longues conversations afin d’éviter un contexte divergent. L’interface de contrôle et la TUI affichent toujours la transcription de session fournie par le Gateway ; elles constituent donc la source de vérité.

Détails : [Gestion des sessions](/fr/concepts/session).

## Métadonnées des résultats d’outil

Le `content` d’un résultat d’outil est le résultat visible par le modèle. Les `details` d’un résultat d’outil sont les métadonnées d’exécution destinées au rendu de l’interface, aux diagnostics, à la livraison de médias et aux plugins.

OpenClaw garde cette frontière explicite :

- `toolResult.details` est retiré avant la relecture par le fournisseur et l’entrée de Compaction.
- Les transcriptions de session persistées ne conservent que des `details` bornés ; les métadonnées trop volumineuses sont remplacées par un résumé compact marqué `persistedDetailsTruncated: true`.
- Les plugins et outils doivent placer le texte que le modèle doit lire dans `content`, et pas seulement dans `details`.

## Corps entrants et contexte d’historique

OpenClaw sépare le **corps de prompt** du **corps de commande** :

- `BodyForAgent` : texte principal destiné au modèle pour le message actuel. Les plugins de canal doivent le garder centré sur le texte actuel de l’expéditeur qui porte le prompt.
- `Body` : solution de repli historique pour le prompt. Cela peut inclure des enveloppes de canal et des wrappers d’historique facultatifs, mais les canaux actuels ne doivent pas s’y fier comme entrée principale du modèle lorsque `BodyForAgent` est disponible.
- `CommandBody` : texte utilisateur brut pour l’analyse des directives/commandes.
- `RawBody` : alias historique de `CommandBody` (conservé pour compatibilité).

Lorsqu’un canal fournit un historique, il utilise un wrapper partagé :

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Pour les **discussions non directes** (groupes/canaux/salons), le **corps du message actuel** est préfixé par le libellé de l’expéditeur (même style que celui utilisé pour les entrées d’historique). Cela garantit la cohérence des messages en temps réel et des messages mis en file d’attente/historique dans le prompt de l’agent.

Les tampons d’historique sont **uniquement en attente** : ils incluent les messages de groupe qui n’ont _pas_ déclenché d’exécution (par exemple, les messages filtrés par mention) et **excluent** les messages déjà présents dans la transcription de session.

La suppression des directives ne s’applique qu’à la section du **message actuel**, afin que l’historique reste intact. Les canaux qui enveloppent l’historique doivent définir `CommandBody` (ou `RawBody`) sur le texte du message original et conserver `Body` comme prompt combiné. L’historique structuré, les réponses, les messages transférés et les métadonnées de canal sont rendus comme des blocs de contexte non fiables de rôle utilisateur lors de l’assemblage du prompt.
Les tampons d’historique sont configurables via `messages.groupChat.historyLimit` (valeur globale par défaut) et les remplacements par canal comme `channels.slack.historyLimit` ou `channels.telegram.accounts.<id>.historyLimit` (définissez `0` pour désactiver).

## Mise en file d’attente et suivis

Si une exécution est déjà active, les messages entrants peuvent être mis en file d’attente, orientés vers l’exécution actuelle ou collectés pour un tour de suivi.

- Configurez via `messages.queue` (et `messages.queue.byChannel`).
- Le mode par défaut est `steer`, avec un anti-rebond de suivi de 500 ms lorsque le guidage retombe sur la livraison de suivi en file d’attente.
- Modes : `steer`, `followup`, `collect`, `steer-backlog`, `interrupt` et le mode historique un-à-la-fois `queue`.

Détails : [File d’attente des commandes](/fr/concepts/queue) et [File d’attente de guidage](/fr/concepts/queue-steering).

## Propriété des exécutions de canal

Les plugins de canal peuvent préserver l’ordre, appliquer un anti-rebond aux entrées et appliquer une contre-pression de transport avant qu’un message n’entre dans la file de session. Ils ne doivent pas imposer un délai d’expiration séparé autour du tour d’agent lui-même. Une fois qu’un message est routé vers une session, les travaux de longue durée sont régis par le cycle de vie de la session, des outils et du runtime, afin que tous les canaux signalent les tours lents et s’en rétablissent de manière cohérente.

## Streaming, découpage et regroupement

Le streaming par blocs envoie des réponses partielles à mesure que le modèle produit des blocs de texte. Le découpage respecte les limites de texte des canaux et évite de diviser les blocs de code clôturés.

Paramètres clés :

- `agents.defaults.blockStreamingDefault` (`on|off`, désactivé par défaut)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (regroupement basé sur l’inactivité)
- `agents.defaults.humanDelay` (pause de type humain entre les réponses par blocs)
- Remplacements par canal : `*.blockStreaming` et `*.blockStreamingCoalesce` (les canaux autres que Telegram exigent un `*.blockStreaming: true` explicite)

Détails : [Streaming + découpage](/fr/concepts/streaming).

## Visibilité du raisonnement et jetons

OpenClaw peut exposer ou masquer le raisonnement du modèle :

- `/reasoning on|off|stream` contrôle la visibilité.
- Le contenu de raisonnement compte quand même dans l’utilisation des jetons lorsqu’il est produit par le modèle.
- Telegram prend en charge le flux de raisonnement dans la bulle de brouillon.

Détails : [Directives de réflexion + raisonnement](/fr/tools/thinking) et [Utilisation des jetons](/fr/reference/token-use).

## Préfixes, fils et réponses

Le formatage des messages sortants est centralisé dans `messages` :

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` et `channels.<channel>.accounts.<id>.responsePrefix` (cascade de préfixes sortants), plus `channels.whatsapp.messagePrefix` (préfixe entrant WhatsApp)
- Fil de réponse via `replyToMode` et valeurs par défaut par canal

Détails : [Configuration](/fr/gateway/config-agents#messages) et documentation des canaux.

## Réponses silencieuses

Le jeton silencieux exact `NO_REPLY` / `no_reply` signifie « ne pas livrer de réponse visible par l’utilisateur ».
Lorsqu’un tour comporte aussi un média d’outil en attente, comme un audio TTS généré, OpenClaw retire le texte silencieux mais livre quand même la pièce jointe multimédia.
OpenClaw résout ce comportement selon le type de conversation :

- Les conversations directes interdisent le silence par défaut et réécrivent une réponse silencieuse nue en une courte solution de repli visible.
- Les groupes/canaux autorisent le silence par défaut.
- L’orchestration interne autorise le silence par défaut.

OpenClaw utilise également les réponses silencieuses pour les échecs internes du runner qui se produisent avant toute réponse de l’assistant dans les discussions non directes, afin que les groupes/canaux ne voient pas de texte d’erreur standard du Gateway. Les discussions directes affichent par défaut un texte d’échec compact ; les détails bruts du runner ne sont affichés que lorsque `/verbose` est `on` ou `full`.

Les valeurs par défaut se trouvent sous `agents.defaults.silentReply` et `agents.defaults.silentReplyRewrite` ; `surfaces.<id>.silentReply` et `surfaces.<id>.silentReplyRewrite` peuvent les remplacer par surface.

Lorsque la session parente comporte une ou plusieurs exécutions de sous-agent lancé en attente, les réponses silencieuses nues sont supprimées sur toutes les surfaces au lieu d’être réécrites, afin que le parent reste silencieux jusqu’à ce que l’événement de fin de l’enfant livre la vraie réponse.

## Connexe

- [Streaming](/fr/concepts/streaming) — livraison de messages en temps réel
- [Nouvelle tentative](/fr/concepts/retry) — comportement de nouvelle tentative de livraison des messages
- [File d’attente](/fr/concepts/queue) — file de traitement des messages
- [Canaux](/fr/channels) — intégrations de plateformes de messagerie
