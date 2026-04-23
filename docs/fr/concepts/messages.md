---
read_when:
    - Expliquer comment les messages entrants deviennent des réponses
    - Clarifier les sessions, les modes de mise en file d’attente ou le comportement de streaming
    - Documenter la visibilité du raisonnement et ses implications d’utilisation
summary: Flux de messages, sessions, mise en file d’attente et visibilité du raisonnement
title: Messages
x-i18n:
    generated_at: "2026-04-23T07:02:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: d4490d87835f44f703b45b29ad69878fec552caf81f4bd07d29614f71ee15cfb
    source_path: concepts/messages.md
    workflow: 15
---

# Messages

Cette page rassemble la manière dont OpenClaw gère les messages entrants, les sessions, la mise en file d’attente,
le streaming et la visibilité du raisonnement.

## Flux des messages (vue d’ensemble)

```
Message entrant
  -> routage/liaisons -> clé de session
  -> file d’attente (si une exécution est active)
  -> exécution de l’agent (streaming + outils)
  -> réponses sortantes (limites de canal + segmentation)
```

Les principaux réglages se trouvent dans la configuration :

- `messages.*` pour les préfixes, la mise en file d’attente et le comportement des groupes.
- `agents.defaults.*` pour les valeurs par défaut du streaming par blocs et de la segmentation.
- Remplacements de canal (`channels.whatsapp.*`, `channels.telegram.*`, etc.) pour les plafonds et les bascules de streaming.

Voir [Configuration](/fr/gateway/configuration) pour le schéma complet.

## Déduplication des entrées

Les canaux peuvent relivrer le même message après des reconnexions. OpenClaw conserve un
cache de courte durée indexé par canal/compte/pair/session/id de message afin que les livraisons en double
ne déclenchent pas une nouvelle exécution de l’agent.

## Débounce des entrées

Les messages rapides consécutifs provenant du **même expéditeur** peuvent être regroupés en un seul
tour d’agent via `messages.inbound`. Le debounce est limité par canal + conversation
et utilise le message le plus récent pour le fil de réponse/les ID.

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

Remarques :

- Le debounce s’applique aux messages **texte uniquement** ; les médias/pièces jointes déclenchent un envoi immédiat.
- Les commandes de contrôle contournent le debounce afin de rester autonomes — **sauf** lorsqu’un canal choisit explicitement le regroupement des messages privés du même expéditeur (par ex. [BlueBubbles `coalesceSameSenderDms`](/fr/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), où les commandes de message privé attendent dans la fenêtre de debounce pour qu’une charge utile envoyée en plusieurs parties puisse rejoindre le même tour d’agent.

## Sessions et appareils

Les sessions appartiennent à la Gateway, pas aux clients.

- Les discussions directes sont regroupées dans la clé de session principale de l’agent.
- Les groupes/canaux obtiennent leurs propres clés de session.
- Le magasin de sessions et les transcriptions résident sur l’hôte Gateway.

Plusieurs appareils/canaux peuvent être associés à la même session, mais l’historique n’est pas entièrement
resynchronisé vers chaque client. Recommandation : utilisez un appareil principal pour les longues
conversations afin d’éviter un contexte divergent. Control UI et la TUI affichent toujours la
transcription de session adossée à la Gateway, elles constituent donc la source de vérité.

Détails : [Gestion des sessions](/fr/concepts/session).

## Corps entrants et contexte d’historique

OpenClaw sépare le **corps du prompt** du **corps de commande** :

- `Body` : texte du prompt envoyé à l’agent. Il peut inclure des enveloppes de canal et
  des habillages d’historique facultatifs.
- `CommandBody` : texte brut de l’utilisateur pour l’analyse des directives/commandes.
- `RawBody` : alias hérité de `CommandBody` (conservé pour la compatibilité).

Lorsqu’un canal fournit un historique, il utilise un habillage partagé :

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Pour les **discussions non directes** (groupes/canaux/salles), le **corps du message actuel** est préfixé par le
label de l’expéditeur (même style que pour les entrées d’historique). Cela maintient la cohérence des messages
en temps réel et des messages mis en file/en historique dans le prompt de l’agent.

Les tampons d’historique sont **uniquement en attente** : ils incluent les messages de groupe qui n’ont _pas_
déclenché d’exécution (par exemple, les messages contrôlés par mention) et **excluent** les messages
déjà présents dans la transcription de session.

Le retrait des directives ne s’applique qu’à la section du **message actuel** afin que l’historique
reste intact. Les canaux qui encapsulent l’historique doivent définir `CommandBody` (ou
`RawBody`) sur le texte original du message et conserver `Body` comme prompt combiné.
Les tampons d’historique sont configurables via `messages.groupChat.historyLimit` (valeur
par défaut globale) et des remplacements par canal comme `channels.slack.historyLimit` ou
`channels.telegram.accounts.<id>.historyLimit` (définissez `0` pour désactiver).

## Mise en file d’attente et suivis

Si une exécution est déjà active, les messages entrants peuvent être mis en file, dirigés vers l’exécution
actuelle ou collectés pour un tour de suivi.

- Configurez via `messages.queue` (et `messages.queue.byChannel`).
- Modes : `interrupt`, `steer`, `followup`, `collect`, plus variantes d’arriéré.

Détails : [Mise en file d’attente](/fr/concepts/queue).

## Streaming, segmentation et regroupement

Le streaming par blocs envoie des réponses partielles à mesure que le modèle produit des blocs de texte.
La segmentation respecte les limites de texte du canal et évite de couper du code clôturé.

Paramètres principaux :

- `agents.defaults.blockStreamingDefault` (`on|off`, désactivé par défaut)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (regroupement basé sur l’inactivité)
- `agents.defaults.humanDelay` (pause de type humaine entre les réponses par blocs)
- Remplacements de canal : `*.blockStreaming` et `*.blockStreamingCoalesce` (les canaux non Telegram nécessitent un `*.blockStreaming: true` explicite)

Détails : [Streaming + segmentation](/fr/concepts/streaming).

## Visibilité du raisonnement et jetons

OpenClaw peut exposer ou masquer le raisonnement du modèle :

- `/reasoning on|off|stream` contrôle la visibilité.
- Le contenu du raisonnement compte toujours dans l’utilisation des jetons lorsqu’il est produit par le modèle.
- Telegram prend en charge le flux de raisonnement dans la bulle de brouillon.

Détails : [Thinking + directives de raisonnement](/fr/tools/thinking) et [Utilisation des jetons](/fr/reference/token-use).

## Préfixes, fils et réponses

Le formatage des messages sortants est centralisé dans `messages` :

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` et `channels.<channel>.accounts.<id>.responsePrefix` (cascade de préfixes sortants), plus `channels.whatsapp.messagePrefix` (préfixe entrant WhatsApp)
- Fils de réponse via `replyToMode` et valeurs par défaut par canal

Détails : [Configuration](/fr/gateway/configuration-reference#messages) et documentation des canaux.

## Réponses silencieuses

Le jeton silencieux exact `NO_REPLY` / `no_reply` signifie « ne pas livrer de réponse visible par l’utilisateur ».
OpenClaw résout ce comportement selon le type de conversation :

- Les conversations directes n’autorisent pas le silence par défaut et réécrivent une réponse
  silencieuse seule en un court repli visible.
- Les groupes/canaux autorisent le silence par défaut.
- L’orchestration interne autorise le silence par défaut.

Les valeurs par défaut se trouvent sous `agents.defaults.silentReply` et
`agents.defaults.silentReplyRewrite` ; `surfaces.<id>.silentReply` et
`surfaces.<id>.silentReplyRewrite` peuvent les remplacer par surface.

Lorsque la session parente a une ou plusieurs exécutions de sous-agent générées en attente,
les réponses silencieuses seules sont abandonnées sur toutes les surfaces au lieu d’être réécrites, afin que le
parent reste silencieux jusqu’à ce que l’événement de fin de l’enfant livre la vraie réponse.

## Connexe

- [Streaming](/fr/concepts/streaming) — livraison de messages en temps réel
- [Nouvelle tentative](/fr/concepts/retry) — comportement de nouvelle tentative de livraison des messages
- [File d’attente](/fr/concepts/queue) — file de traitement des messages
- [Canaux](/fr/channels) — intégrations de plateformes de messagerie
