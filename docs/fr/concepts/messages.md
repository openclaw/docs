---
read_when:
    - Expliquer comment les messages entrants deviennent des réponses
    - Clarifier les sessions, les modes de mise en file d’attente ou le comportement de streaming
    - Documenter la visibilité du raisonnement et les implications d’utilisation
summary: Flux des messages, sessions, mise en file d’attente et visibilité du raisonnement
title: Messages
x-i18n:
    generated_at: "2026-04-21T13:35:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f535d01872e7fcf0f3d99a5c5ac01feddbf7fb562ff61d9ccdf18f109f9922f
    source_path: concepts/messages.md
    workflow: 15
---

# Messages

Cette page rassemble le fonctionnement d’OpenClaw pour les messages entrants, les sessions, la mise en file d’attente, le streaming et la visibilité du raisonnement.

## Flux des messages (vue d’ensemble)

```
Message entrant
  -> routage/liaisons -> clé de session
  -> file d’attente (si une exécution est active)
  -> exécution de l’agent (streaming + outils)
  -> réponses sortantes (limites du canal + découpage)
```

Les principaux réglages se trouvent dans la configuration :

- `messages.*` pour les préfixes, la mise en file d’attente et le comportement des groupes.
- `agents.defaults.*` pour les valeurs par défaut du streaming par blocs et du découpage.
- Les surcharges par canal (`channels.whatsapp.*`, `channels.telegram.*`, etc.) pour les plafonds et les bascules de streaming.

Voir [Configuration](/fr/gateway/configuration) pour le schéma complet.

## Déduplication des messages entrants

Les canaux peuvent renvoyer le même message après des reconnexions. OpenClaw conserve un cache de courte durée, indexé par canal/compte/peer/session/id de message, afin que les livraisons en double ne déclenchent pas une autre exécution d’agent.

## Antirebond des messages entrants

Des messages rapides et consécutifs provenant du **même expéditeur** peuvent être regroupés en un seul tour d’agent via `messages.inbound`. L’antirebond est appliqué par canal + conversation et utilise le message le plus récent pour le threading/la réponse et les ID.

Configuration (valeur globale par défaut + surcharges par canal) :

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

- L’antirebond s’applique aux messages **texte uniquement** ; les médias/pièces jointes déclenchent un envoi immédiat.
- Les commandes de contrôle contournent l’antirebond afin de rester autonomes — **sauf** lorsqu’un canal active explicitement le regroupement des messages privés d’un même expéditeur (par ex. [BlueBubbles `coalesceSameSenderDms`](/fr/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), où les commandes en message privé attendent dans la fenêtre d’antirebond pour qu’une charge utile envoyée en plusieurs parties puisse rejoindre le même tour d’agent.

## Sessions et appareils

Les sessions appartiennent à la Gateway, pas aux clients.

- Les conversations directes sont regroupées dans la clé de session principale de l’agent.
- Les groupes/canaux ont leurs propres clés de session.
- Le stockage des sessions et les transcriptions résident sur l’hôte de la Gateway.

Plusieurs appareils/canaux peuvent correspondre à la même session, mais l’historique n’est pas entièrement resynchronisé vers chaque client. Recommandation : utiliser un appareil principal pour les longues conversations afin d’éviter un contexte divergent. L’interface de contrôle et la TUI affichent toujours la transcription de session issue de la Gateway ; elles constituent donc la source de vérité.

Détails : [Gestion des sessions](/fr/concepts/session).

## Corps entrants et contexte d’historique

OpenClaw sépare le **corps du prompt** du **corps de commande** :

- `Body` : texte du prompt envoyé à l’agent. Il peut inclure des enveloppes de canal et des wrappers d’historique facultatifs.
- `CommandBody` : texte brut de l’utilisateur pour l’analyse des directives/commandes.
- `RawBody` : alias historique de `CommandBody` (conservé pour compatibilité).

Lorsqu’un canal fournit un historique, il utilise un wrapper partagé :

- `[Messages de chat depuis votre dernière réponse - pour le contexte]`
- `[Message actuel - répondez à celui-ci]`

Pour les **conversations non directes** (groupes/canaux/salons), le **corps du message actuel** est préfixé par l’étiquette de l’expéditeur (même style que pour les entrées d’historique). Cela maintient la cohérence entre les messages en temps réel et les messages mis en file d’attente/d’historique dans le prompt de l’agent.

Les tampons d’historique sont **uniquement en attente** : ils incluent les messages de groupe qui n’ont _pas_ déclenché d’exécution (par exemple, les messages soumis à une mention) et **excluent** les messages déjà présents dans la transcription de session.

Le retrait des directives ne s’applique qu’à la section du **message actuel**, afin de préserver l’historique. Les canaux qui encapsulent l’historique doivent définir `CommandBody` (ou `RawBody`) sur le texte original du message et conserver `Body` comme prompt combiné. Les tampons d’historique sont configurables via `messages.groupChat.historyLimit` (valeur globale par défaut) et des surcharges par canal comme `channels.slack.historyLimit` ou `channels.telegram.accounts.<id>.historyLimit` (définir `0` pour désactiver).

## Mise en file d’attente et suivis

Si une exécution est déjà active, les messages entrants peuvent être mis en file d’attente, redirigés vers l’exécution en cours, ou collectés pour un tour de suivi.

- Configurer via `messages.queue` (et `messages.queue.byChannel`).
- Modes : `interrupt`, `steer`, `followup`, `collect`, ainsi que des variantes de backlog.

Détails : [Mise en file d’attente](/fr/concepts/queue).

## Streaming, découpage et regroupement

Le streaming par blocs envoie des réponses partielles à mesure que le modèle produit des blocs de texte.
Le découpage respecte les limites de texte des canaux et évite de scinder le code délimité.

Réglages principaux :

- `agents.defaults.blockStreamingDefault` (`on|off`, désactivé par défaut)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (regroupement basé sur l’inactivité)
- `agents.defaults.humanDelay` (pause de type humain entre les réponses par blocs)
- Surcharges par canal : `*.blockStreaming` et `*.blockStreamingCoalesce` (les canaux non-Telegram nécessitent un `*.blockStreaming: true` explicite)

Détails : [Streaming + découpage](/fr/concepts/streaming).

## Visibilité du raisonnement et tokens

OpenClaw peut exposer ou masquer le raisonnement du modèle :

- `/reasoning on|off|stream` contrôle la visibilité.
- Le contenu de raisonnement compte tout de même dans l’usage des tokens lorsqu’il est produit par le modèle.
- Telegram prend en charge le streaming du raisonnement dans la bulle de brouillon.

Détails : [Directives de réflexion + raisonnement](/fr/tools/thinking) et [Utilisation des tokens](/fr/reference/token-use).

## Préfixes, threading et réponses

Le formatage des messages sortants est centralisé dans `messages` :

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` et `channels.<channel>.accounts.<id>.responsePrefix` (cascade de préfixes sortants), plus `channels.whatsapp.messagePrefix` (préfixe entrant WhatsApp)
- Threading des réponses via `replyToMode` et les valeurs par défaut par canal

Détails : [Configuration](/fr/gateway/configuration-reference#messages) et la documentation des canaux.

## Réponses silencieuses

Le token silencieux exact `NO_REPLY` / `no_reply` signifie « ne pas délivrer de réponse visible à l’utilisateur ».
OpenClaw résout ce comportement selon le type de conversation :

- Les conversations directes interdisent le silence par défaut et réécrivent une réponse silencieuse seule en un court message visible de secours.
- Les groupes/canaux autorisent le silence par défaut.
- L’orchestration interne autorise le silence par défaut.

Les valeurs par défaut se trouvent sous `agents.defaults.silentReply` et
`agents.defaults.silentReplyRewrite` ; `surfaces.<id>.silentReply` et
`surfaces.<id>.silentReplyRewrite` peuvent les surcharger par surface.

## Connexe

- [Streaming](/fr/concepts/streaming) — livraison des messages en temps réel
- [Retry](/fr/concepts/retry) — comportement de nouvelle tentative de livraison des messages
- [Queue](/fr/concepts/queue) — file de traitement des messages
- [Channels](/fr/channels) — intégrations de plateformes de messagerie
