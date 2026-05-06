---
read_when:
    - Expliquer comment les messages entrants deviennent des réponses
    - Clarifier les sessions, les modes de mise en file d’attente ou le comportement du streaming
    - Documenter la visibilité du raisonnement et les implications d’utilisation
summary: Flux des messages, sessions, mise en file d’attente et visibilité du raisonnement
title: Messages
x-i18n:
    generated_at: "2026-05-06T07:18:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: e1cb21bb1ecfb90c91f5117c76378248f846ace16401c226986ab3cca40a3e33
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw traite les messages entrants au moyen d’un pipeline de résolution de session, de mise en file d’attente, de streaming, d’exécution d’outils et de visibilité du raisonnement. Cette page décrit le chemin qui mène du message entrant à la réponse.

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
- `agents.defaults.*` pour les valeurs par défaut de streaming par blocs et de découpage.
- Les remplacements par canal (`channels.whatsapp.*`, `channels.telegram.*`, etc.) pour les plafonds et les bascules de streaming.

Consultez [Configuration](/fr/gateway/configuration) pour le schéma complet.

## Déduplication des messages entrants

Les canaux peuvent remettre le même message après des reconnexions. OpenClaw conserve un
cache de courte durée indexé par canal/compte/pair/session/identifiant de message afin que les livraisons
dupliquées ne déclenchent pas une autre exécution de l’agent.

## Débounce des messages entrants

Les messages consécutifs rapides du **même expéditeur** peuvent être regroupés en un seul
tour d’agent via `messages.inbound`. Le débounce est limité à chaque canal + conversation
et utilise le message le plus récent pour le fil de réponse et les identifiants.

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

- Le débounce s’applique aux messages **texte uniquement** ; les médias/pièces jointes sont traités immédiatement.
- Les commandes de contrôle contournent le débounce afin de rester autonomes — **sauf** lorsqu’un canal active explicitement la coalescence des MP du même expéditeur (par exemple [BlueBubbles `coalesceSameSenderDms`](/fr/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), où les commandes de MP attendent dans la fenêtre de débounce afin qu’une charge utile envoyée en plusieurs parties puisse rejoindre le même tour d’agent.

## Sessions et appareils

Les sessions appartiennent au Gateway, pas aux clients.

- Les discussions directes sont réduites à la clé de session principale de l’agent.
- Les groupes/canaux reçoivent leurs propres clés de session.
- Le stockage des sessions et les transcriptions résident sur l’hôte du Gateway.

Plusieurs appareils/canaux peuvent correspondre à la même session, mais l’historique n’est pas entièrement
resynchronisé vers chaque client. Recommandation : utilisez un appareil principal pour les longues
conversations afin d’éviter un contexte divergent. L’interface de contrôle et la TUI affichent toujours la
transcription de session fournie par le Gateway, elles constituent donc la source de vérité.

Détails : [Gestion des sessions](/fr/concepts/session).

## Métadonnées des résultats d’outils

Le `content` du résultat d’outil est le résultat visible par le modèle. Les `details` du résultat d’outil sont
des métadonnées d’exécution pour le rendu de l’interface, les diagnostics, la livraison de médias et les plugins.

OpenClaw garde cette frontière explicite :

- `toolResult.details` est retiré avant la relecture par le fournisseur et l’entrée de compaction.
- Les transcriptions de session persistées ne conservent que des `details` bornés ; les métadonnées trop volumineuses
  sont remplacées par un résumé compact marqué `persistedDetailsTruncated: true`.
- Les Plugins et outils doivent placer le texte que le modèle doit lire dans `content`, pas seulement
  dans `details`.

## Corps entrants et contexte d’historique

OpenClaw sépare le **corps du prompt** du **corps de la commande** :

- `BodyForAgent` : texte principal destiné au modèle pour le message actuel. Les
  Plugins de canal doivent le garder centré sur le texte actuel de l’expéditeur qui porte le prompt.
- `Body` : solution de repli héritée pour le prompt. Cela peut inclure les enveloppes du canal et
  des wrappers d’historique facultatifs, mais les canaux actuels ne doivent pas s’y fier comme entrée principale
  du modèle lorsque `BodyForAgent` est disponible.
- `CommandBody` : texte utilisateur brut pour l’analyse des directives/commandes.
- `RawBody` : alias hérité de `CommandBody` (conservé pour compatibilité).

Lorsqu’un canal fournit un historique, il utilise un wrapper partagé :

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Pour les **discussions non directes** (groupes/canaux/salons), le **corps du message actuel** est préfixé par le
libellé de l’expéditeur (dans le même style que les entrées d’historique). Cela garde les messages en temps réel et en file d’attente/historique
cohérents dans le prompt de l’agent.

Les tampons d’historique sont **uniquement en attente** : ils incluent les messages de groupe qui n’ont _pas_
déclenché d’exécution (par exemple, les messages filtrés par mention) et **excluent** les messages
déjà présents dans la transcription de session.

La suppression des directives s’applique uniquement à la section du **message actuel**, afin que l’historique
reste intact. Les canaux qui enveloppent l’historique doivent définir `CommandBody` (ou
`RawBody`) sur le texte du message original et garder `Body` comme prompt combiné.
L’historique structuré, les réponses, les messages transférés et les métadonnées de canal sont rendus comme
blocs de contexte non fiables avec le rôle utilisateur pendant l’assemblage du prompt.
Les tampons d’historique sont configurables via `messages.groupChat.historyLimit` (valeur par
défaut globale) et les remplacements par canal comme `channels.slack.historyLimit` ou
`channels.telegram.accounts.<id>.historyLimit` (définissez `0` pour désactiver).

## Mise en file d’attente et suivis

Si une exécution est déjà active, les messages entrants peuvent être mis en file d’attente, orientés vers
l’exécution actuelle ou collectés pour un tour de suivi.

- Configurez via `messages.queue` (et `messages.queue.byChannel`).
- Le mode par défaut est `steer`, avec un débounce de suivi de 500 ms lorsque l’orientation retombe
  sur une livraison de suivi en file d’attente.
- Modes : `steer`, `followup`, `collect`, `steer-backlog`, `interrupt`, et le mode
  hérité un-à-la-fois `queue`.

Détails : [File de commandes](/fr/concepts/queue) et [File d’orientation](/fr/concepts/queue-steering).

## Propriété d’exécution par canal

Les Plugins de canal peuvent préserver l’ordre, appliquer un débounce à l’entrée et appliquer une
contre-pression de transport avant qu’un message entre dans la file de session. Ils ne doivent pas imposer un
délai d’expiration séparé autour du tour d’agent lui-même. Une fois qu’un message est routé vers une
session, le travail de longue durée est régi par la session, l’outil et le cycle de vie
d’exécution afin que tous les canaux signalent les tours lents et s’en remettent de façon cohérente.

## Streaming, découpage et regroupement

Le streaming par blocs envoie des réponses partielles à mesure que le modèle produit des blocs de texte.
Le découpage respecte les limites de texte du canal et évite de scinder les blocs de code clôturés.

Paramètres principaux :

- `agents.defaults.blockStreamingDefault` (`on|off`, désactivé par défaut)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (regroupement basé sur l’inactivité)
- `agents.defaults.humanDelay` (pause de type humain entre les réponses par blocs)
- Remplacements par canal : `*.blockStreaming` et `*.blockStreamingCoalesce` (les canaux non Telegram nécessitent explicitement `*.blockStreaming: true`)

Détails : [Streaming + découpage](/fr/concepts/streaming).

## Visibilité du raisonnement et tokens

OpenClaw peut exposer ou masquer le raisonnement du modèle :

- `/reasoning on|off|stream` contrôle la visibilité.
- Le contenu de raisonnement compte quand même dans l’utilisation des tokens lorsqu’il est produit par le modèle.
- Telegram prend en charge le flux de raisonnement dans une bulle de brouillon transitoire qui est supprimée après la livraison finale ; utilisez `/reasoning on` pour une sortie de raisonnement persistante.

Détails : [Directives de réflexion + raisonnement](/fr/tools/thinking) et [Utilisation des tokens](/fr/reference/token-use).

## Préfixes, fils et réponses

Le formatage des messages sortants est centralisé dans `messages` :

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` et `channels.<channel>.accounts.<id>.responsePrefix` (cascade de préfixes sortants), ainsi que `channels.whatsapp.messagePrefix` (préfixe entrant WhatsApp)
- Fil de réponse via `replyToMode` et valeurs par défaut par canal

Détails : [Configuration](/fr/gateway/config-agents#messages) et documentation des canaux.

## Réponses silencieuses

Le token silencieux exact `NO_REPLY` / `no_reply` signifie « ne pas livrer de réponse visible par l’utilisateur ».
Lorsqu’un tour comporte aussi des médias d’outil en attente, comme de l’audio TTS généré, OpenClaw
retire le texte silencieux mais livre quand même la pièce jointe média.
OpenClaw résout ce comportement selon le type de conversation :

- Les conversations directes interdisent le silence par défaut et réécrivent une réponse
  silencieuse nue en une courte solution de repli visible.
- Les groupes/canaux autorisent le silence par défaut.
- L’orchestration interne autorise le silence par défaut.

OpenClaw utilise aussi des réponses silencieuses pour les échecs internes du runner qui surviennent
avant toute réponse de l’assistant dans les discussions non directes, afin que les groupes/canaux ne voient pas
de texte générique d’erreur du Gateway. Les discussions directes affichent par défaut une copie compacte de l’échec ;
les détails bruts du runner ne sont affichés que lorsque `/verbose` vaut `on` ou `full`.

Les valeurs par défaut se trouvent sous `agents.defaults.silentReply` et
`agents.defaults.silentReplyRewrite` ; `surfaces.<id>.silentReply` et
`surfaces.<id>.silentReplyRewrite` peuvent les remplacer par surface.

Lorsque la session parente a une ou plusieurs exécutions de sous-agent créées en attente, les
réponses silencieuses nues sont supprimées sur toutes les surfaces au lieu d’être réécrites, afin que le
parent reste silencieux jusqu’à ce que l’événement de fin de l’enfant livre la vraie réponse.

## Connexe

- [Refactorisation du cycle de vie des messages](/fr/concepts/message-lifecycle-refactor) - conception cible durable d’envoi et de réception
- [Streaming](/fr/concepts/streaming) — livraison de messages en temps réel
- [Réessai](/fr/concepts/retry) — comportement de nouvelle tentative de livraison des messages
- [File](/fr/concepts/queue) — file de traitement des messages
- [Canaux](/fr/channels) — intégrations de plateformes de messagerie
