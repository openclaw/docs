---
read_when:
    - Expliquer comment les messages entrants deviennent des réponses
    - Clarifier les sessions, les modes de mise en file d’attente ou le comportement du streaming
    - Documenter la visibilité du raisonnement et les implications d’utilisation
summary: Flux de messages, sessions, mise en file d’attente et visibilité du raisonnement
title: Messages
x-i18n:
    generated_at: "2026-04-26T11:27:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b77d344ed0cab80566582f43127c91ec987e892eeed788aeb9988b377a96e06
    source_path: concepts/messages.md
    workflow: 15
---

Cette page relie le fonctionnement des messages entrants, des sessions, de la mise en file d’attente,
du streaming et de la visibilité du raisonnement dans OpenClaw.

## Flux des messages (vue d’ensemble)

```
Message entrant
  -> routage/bindings -> clé de session
  -> file d’attente (si une exécution est active)
  -> exécution de l’agent (streaming + outils)
  -> réponses sortantes (limites du canal + segmentation)
```

Les principaux paramètres se trouvent dans la configuration :

- `messages.*` pour les préfixes, la mise en file d’attente et le comportement des groupes.
- `agents.defaults.*` pour les valeurs par défaut du streaming par bloc et de la segmentation.
- Les surcharges par canal (`channels.whatsapp.*`, `channels.telegram.*`, etc.) pour les plafonds et les bascules de streaming.

Voir [Configuration](/fr/gateway/configuration) pour le schéma complet.

## Déduplication des messages entrants

Les canaux peuvent redistribuer le même message après des reconnexions. OpenClaw conserve un cache de courte durée, indexé par canal/compte/pair/session/ID de message, afin que les livraisons en double ne déclenchent pas une nouvelle exécution d’agent.

## Anti-rebond des messages entrants

Des messages consécutifs rapides provenant du **même expéditeur** peuvent être regroupés dans un seul tour d’agent via `messages.inbound`. L’anti-rebond s’applique par canal + conversation et utilise le message le plus récent pour les fils/ID de réponse.

Configuration (valeur par défaut globale + surcharges par canal) :

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

- L’anti-rebond s’applique aux messages **texte uniquement** ; les médias/pièces jointes déclenchent immédiatement l’envoi.
- Les commandes de contrôle contournent l’anti-rebond afin de rester autonomes — **sauf** lorsqu’un canal active explicitement le regroupement des messages privés du même expéditeur (par ex. [BlueBubbles `coalesceSameSenderDms`](/fr/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), où les commandes en message privé attendent dans la fenêtre d’anti-rebond afin qu’une charge utile envoyée en plusieurs parties puisse rejoindre le même tour d’agent.

## Sessions et appareils

Les sessions appartiennent à la gateway, pas aux clients.

- Les discussions directes se replient dans la clé de session principale de l’agent.
- Les groupes/canaux obtiennent leurs propres clés de session.
- Le magasin de sessions et les transcriptions résident sur l’hôte de la gateway.

Plusieurs appareils/canaux peuvent être associés à la même session, mais l’historique n’est pas entièrement resynchronisé vers tous les clients. Recommandation : utilisez un appareil principal pour les longues conversations afin d’éviter des contextes divergents. Le Control UI et le TUI affichent toujours la transcription de session adossée à la gateway ; ils constituent donc la source de vérité.

Détails : [Gestion des sessions](/fr/concepts/session).

## Métadonnées des résultats d’outil

Le `content` du résultat d’outil est le résultat visible par le modèle. Le `details` du résultat d’outil correspond à des métadonnées d’exécution pour le rendu UI, les diagnostics, la livraison de médias et les plugins.

OpenClaw maintient explicitement cette frontière :

- `toolResult.details` est retiré avant la relecture du fournisseur et l’entrée de Compaction.
- Les transcriptions de session persistées ne conservent que des `details` bornés ; les métadonnées trop volumineuses sont remplacées par un résumé compact marqué `persistedDetailsTruncated: true`.
- Les plugins et outils doivent placer dans `content` le texte que le modèle doit lire, et pas uniquement dans `details`.

## Corps entrants et contexte d’historique

OpenClaw sépare le **corps du prompt** du **corps de commande** :

- `Body` : texte du prompt envoyé à l’agent. Il peut inclure des enveloppes de canal et des wrappers d’historique facultatifs.
- `CommandBody` : texte utilisateur brut pour l’analyse des directives/commandes.
- `RawBody` : alias historique de `CommandBody` (conservé pour compatibilité).

Lorsqu’un canal fournit un historique, il utilise un wrapper partagé :

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Pour les **discussions non directes** (groupes/canaux/salons), le **corps du message actuel** est préfixé avec l’étiquette de l’expéditeur (même style que celui utilisé pour les entrées d’historique). Cela maintient la cohérence entre les messages en temps réel et les messages mis en file d’attente/d’historique dans le prompt de l’agent.

Les tampons d’historique sont **uniquement en attente** : ils incluent les messages de groupe qui n’ont _pas_ déclenché d’exécution (par exemple, les messages filtrés par mention) et **excluent** les messages déjà présents dans la transcription de session.

Le retrait des directives s’applique uniquement à la section du **message actuel** afin que l’historique reste intact. Les canaux qui encapsulent l’historique doivent définir `CommandBody` (ou `RawBody`) sur le texte d’origine du message et conserver `Body` comme prompt combiné.
Les tampons d’historique sont configurables via `messages.groupChat.historyLimit` (valeur par défaut globale) et des surcharges par canal comme `channels.slack.historyLimit` ou `channels.telegram.accounts.<id>.historyLimit` (définissez `0` pour désactiver).

## Mise en file d’attente et suivis

Si une exécution est déjà active, les messages entrants peuvent être mis en file d’attente, redirigés vers l’exécution en cours ou collectés pour un tour de suivi.

- Configurez cela via `messages.queue` (et `messages.queue.byChannel`).
- Modes : `interrupt`, `steer`, `followup`, `collect`, plus les variantes de backlog.

Détails : [Mise en file d’attente](/fr/concepts/queue).

## Streaming, segmentation et regroupement

Le streaming par bloc envoie des réponses partielles à mesure que le modèle produit des blocs de texte.
La segmentation respecte les limites de texte du canal et évite de couper du code délimité.

Paramètres clés :

- `agents.defaults.blockStreamingDefault` (`on|off`, désactivé par défaut)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (regroupement basé sur l’inactivité)
- `agents.defaults.humanDelay` (pause de type humain entre les réponses par bloc)
- Surcharges par canal : `*.blockStreaming` et `*.blockStreamingCoalesce` (les canaux autres que Telegram exigent un `*.blockStreaming: true` explicite)

Détails : [Streaming + segmentation](/fr/concepts/streaming).

## Visibilité du raisonnement et jetons

OpenClaw peut exposer ou masquer le raisonnement du modèle :

- `/reasoning on|off|stream` contrôle la visibilité.
- Le contenu de raisonnement compte quand même dans l’utilisation des jetons lorsqu’il est produit par le modèle.
- Telegram prend en charge le streaming du raisonnement dans la bulle de brouillon.

Détails : [Directives Thinking + reasoning](/fr/tools/thinking) et [Utilisation des jetons](/fr/reference/token-use).

## Préfixes, fils et réponses

La mise en forme des messages sortants est centralisée dans `messages` :

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` et `channels.<channel>.accounts.<id>.responsePrefix` (cascade de préfixes sortants), ainsi que `channels.whatsapp.messagePrefix` (préfixe entrant WhatsApp)
- Fils de réponse via `replyToMode` et valeurs par défaut par canal

Détails : [Configuration](/fr/gateway/config-agents#messages) et documentation des canaux.

## Réponses silencieuses

Le jeton silencieux exact `NO_REPLY` / `no_reply` signifie « ne pas envoyer de réponse visible à l’utilisateur ».
Lorsqu’un tour comporte aussi des médias d’outil en attente, comme un audio TTS généré, OpenClaw retire le texte silencieux mais livre quand même la pièce jointe multimédia.
OpenClaw résout ce comportement selon le type de conversation :

- Les conversations directes n’autorisent pas le silence par défaut et réécrivent une réponse silencieuse nue en un court message visible de repli.
- Les groupes/canaux autorisent le silence par défaut.
- L’orchestration interne autorise le silence par défaut.

OpenClaw utilise aussi des réponses silencieuses pour les échecs internes d’exécution qui se produisent avant toute réponse de l’assistant dans les discussions non directes, afin que les groupes/canaux ne voient pas de texte standard d’erreur de gateway. Les discussions directes affichent par défaut un message d’échec compact ; les détails bruts du runner ne sont affichés que lorsque `/verbose` vaut `on` ou `full`.

Les valeurs par défaut se trouvent sous `agents.defaults.silentReply` et
`agents.defaults.silentReplyRewrite` ; `surfaces.<id>.silentReply` et
`surfaces.<id>.silentReplyRewrite` peuvent les remplacer par surface.

Lorsque la session parente comporte une ou plusieurs exécutions de sous-agent engendrées encore en attente, les réponses silencieuses nues sont abandonnées sur toutes les surfaces au lieu d’être réécrites, afin que la session parente reste silencieuse jusqu’à ce que l’événement de fin de l’enfant livre la vraie réponse.

## Connexe

- [Streaming](/fr/concepts/streaming) — livraison des messages en temps réel
- [Retry](/fr/concepts/retry) — comportement de nouvelle tentative de livraison des messages
- [Queue](/fr/concepts/queue) — file de traitement des messages
- [Canaux](/fr/channels) — intégrations de plateformes de messagerie
