---
read_when:
    - Expliquer comment les messages entrants deviennent des réponses
    - Clarification des sessions, des modes de mise en file d’attente ou du comportement de streaming
    - Documenter la visibilité du raisonnement et ses implications d’utilisation
summary: Flux de messages, sessions, mise en file d’attente et visibilité du raisonnement
title: Messages
x-i18n:
    generated_at: "2026-06-27T17:24:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d5585ae95fc65cb64240e4bf5d0bbe2eb54f55461b9fa4ee331d4d703d62e76f
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw traite les messages entrants via un pipeline de résolution de session, de mise en file, de streaming, d’exécution d’outils et de visibilité du raisonnement. Cette page décrit le chemin du message entrant à la réponse.

## Flux des messages (vue d’ensemble)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

Les principaux réglages se trouvent dans la configuration :

- `messages.*` pour les préfixes, la mise en file et le comportement de groupe.
- `agents.defaults.*` pour les valeurs par défaut du streaming par blocs et du découpage.
- Les remplacements par canal (`channels.whatsapp.*`, `channels.telegram.*`, etc.) pour les limites et les bascules de streaming.

Consultez [Configuration](/fr/gateway/configuration) pour le schéma complet.

## Déduplication entrante

Les canaux peuvent redistribuer le même message après des reconnexions. OpenClaw conserve un cache à courte durée de vie indexé par canal/compte/paire/session/ID de message afin que les livraisons en double ne déclenchent pas une autre exécution d’agent.

## Anti-rebond entrant

Des messages rapidement consécutifs du **même expéditeur** peuvent être regroupés en un seul tour d’agent via `messages.inbound`. L’anti-rebond est délimité par canal + conversation et utilise le message le plus récent pour le rattachement et les ID de réponse.

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

Remarques :

- L’anti-rebond s’applique aux messages **texte uniquement** ; les médias/pièces jointes sont transmis immédiatement.
- Les commandes de contrôle contournent l’anti-rebond afin de rester autonomes. Les canaux qui optent explicitement pour la fusion des DM du même expéditeur peuvent conserver les commandes DM dans la fenêtre d’anti-rebond afin qu’une charge utile envoyée en plusieurs parties rejoigne le même tour d’agent.

## Sessions et appareils

Les sessions appartiennent au Gateway, pas aux clients.

- Les conversations directes sont regroupées dans la clé de session principale de l’agent.
- Les groupes/canaux obtiennent leurs propres clés de session.
- Le magasin de sessions et les transcriptions résident sur l’hôte du Gateway.

Plusieurs appareils/canaux peuvent correspondre à la même session, mais l’historique n’est pas entièrement resynchronisé vers chaque client. Recommandation : utilisez un appareil principal pour les longues conversations afin d’éviter un contexte divergent. L’interface de contrôle et le TUI affichent toujours la transcription de session adossée au Gateway ; ils constituent donc la source de vérité.

Détails : [Gestion des sessions](/fr/concepts/session).

## Métadonnées de résultat d’outil

Le `content` d’un résultat d’outil est le résultat visible par le modèle. Les `details` d’un résultat d’outil sont des métadonnées d’exécution pour le rendu de l’interface, les diagnostics, la livraison de médias et les plugins.

OpenClaw garde cette frontière explicite :

- `toolResult.details` est supprimé avant la relecture fournisseur et l’entrée de Compaction.
- Les transcriptions de session persistées ne conservent que des `details` bornés ; les métadonnées surdimensionnées sont remplacées par un résumé compact marqué `persistedDetailsTruncated: true`.
- Les plugins et outils doivent placer dans `content` le texte que le modèle doit lire, pas seulement dans `details`.

## Corps entrants et contexte d’historique

OpenClaw sépare le **corps de prompt** du **corps de commande** :

- `BodyForAgent` : texte principal destiné au modèle pour le message actuel. Les plugins de canal doivent le garder centré sur le texte actuel de l’expéditeur qui porte le prompt.
- `Body` : solution de repli de prompt héritée. Elle peut inclure des enveloppes de canal et des wrappers d’historique facultatifs, mais les canaux actuels ne doivent pas s’y fier comme entrée principale du modèle lorsque `BodyForAgent` est disponible.
- `CommandBody` : texte utilisateur brut pour l’analyse des directives/commandes.
- `RawBody` : alias hérité de `CommandBody` (conservé pour compatibilité).

Lorsqu’un canal fournit un historique, il utilise un wrapper partagé :

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Pour les **conversations non directes** (groupes/canaux/salons), le **corps du message actuel** est préfixé par l’étiquette de l’expéditeur (le même style que pour les entrées d’historique). Cela maintient la cohérence entre les messages en temps réel et les messages en file/historique dans le prompt de l’agent.

Les tampons d’historique sont **uniquement en attente** : ils incluent les messages de groupe qui n’ont _pas_ déclenché d’exécution (par exemple, les messages soumis à une mention) et **excluent** les messages déjà présents dans la transcription de session.

La suppression des directives ne s’applique qu’à la section du **message actuel**, de sorte que l’historique reste intact. Les canaux qui enveloppent l’historique doivent définir `CommandBody` (ou `RawBody`) sur le texte original du message et conserver `Body` comme prompt combiné. L’historique structuré, les réponses, les messages transférés et les métadonnées de canal sont rendus comme des blocs de contexte non fiables avec rôle utilisateur lors de l’assemblage du prompt.
Les tampons d’historique sont configurables via `messages.groupChat.historyLimit` (valeur globale par défaut) et des remplacements par canal comme `channels.slack.historyLimit` ou `channels.telegram.accounts.<id>.historyLimit` (définissez `0` pour désactiver).

## Mise en file et suites

Si une exécution est déjà active, les messages entrants sont orientés vers l’exécution en cours par défaut. `messages.queue` choisit si les messages d’exécution active orientent, sont mis en file pour plus tard, sont collectés en un seul tour ultérieur ou interrompent l’exécution active.

- Configurez via `messages.queue` (et `messages.queue.byChannel`).
- Le mode par défaut est `steer`, avec un anti-rebond de 500 ms pour les lots d’orientation Codex et les files de suite/collecte.
- Modes : `steer`, `followup`, `collect` et `interrupt`.

Détails : [File de commandes](/fr/concepts/queue) et [File d’orientation](/fr/concepts/queue-steering).

## Propriété des exécutions de canal

Les plugins de canal peuvent préserver l’ordre, appliquer un anti-rebond aux entrées et appliquer une contre-pression de transport avant qu’un message n’entre dans la file de session. Ils ne doivent pas imposer de délai d’expiration séparé autour du tour d’agent lui-même. Une fois qu’un message est routé vers une session, les travaux de longue durée sont régis par le cycle de vie de la session, des outils et de l’exécution, afin que tous les canaux signalent les tours lents et s’en rétablissent de manière cohérente.

## Streaming, découpage et regroupement

Le streaming par blocs envoie des réponses partielles au fur et à mesure que le modèle produit des blocs de texte.
Le découpage respecte les limites de texte des canaux et évite de scinder les blocs de code délimités.

Paramètres clés :

- `agents.defaults.blockStreamingDefault` (`on|off`, désactivé par défaut)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (regroupement basé sur l’inactivité)
- `agents.defaults.humanDelay` (pause de type humain entre les réponses par blocs)
- Remplacements par canal : `*.blockStreaming` et `*.blockStreamingCoalesce` (les canaux non-Telegram nécessitent explicitement `*.blockStreaming: true`)

Détails : [Streaming + découpage](/fr/concepts/streaming).

## Visibilité du raisonnement et jetons

OpenClaw peut exposer ou masquer le raisonnement du modèle :

- `/reasoning on|off|stream` contrôle la visibilité.
- Le contenu de raisonnement compte toujours dans l’utilisation des jetons lorsqu’il est produit par le modèle.
- Telegram prend en charge le flux de raisonnement dans une bulle de brouillon transitoire supprimée après la livraison finale ; utilisez `/reasoning on` pour une sortie de raisonnement persistante.

Détails : [Directives de réflexion + raisonnement](/fr/tools/thinking) et [Utilisation des jetons](/fr/reference/token-use).

## Préfixes, fils et réponses

La mise en forme des messages sortants est centralisée dans `messages` :

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` et `channels.<channel>.accounts.<id>.responsePrefix` (cascade de préfixes sortants), plus `channels.whatsapp.messagePrefix` (préfixe entrant WhatsApp)
- Rattachement des réponses via `replyToMode` et les valeurs par défaut par canal

Détails : [Configuration](/fr/gateway/config-agents#messages) et documentation des canaux.

## Réponses silencieuses

Le jeton silencieux exact `NO_REPLY` / `no_reply` signifie « ne pas livrer de réponse visible par l’utilisateur ».
Lorsqu’un tour contient aussi des médias d’outil en attente, comme de l’audio TTS généré, OpenClaw supprime le texte silencieux mais livre quand même la pièce jointe média.
OpenClaw résout ce comportement selon le type de conversation :

- Les conversations directes ne reçoivent jamais de guidance de prompt `NO_REPLY`. Si une exécution directe renvoie accidentellement un jeton silencieux seul, OpenClaw le supprime au lieu de le réécrire ou de le livrer.
- Les groupes/canaux autorisent le silence par défaut uniquement pour les réponses de groupe automatiques. En mode réponse visible `message_tool`, le silence signifie que le modèle n’appelle pas `message(action=send)`.
- L’orchestration interne autorise le silence par défaut.

OpenClaw utilise aussi les réponses silencieuses pour les échecs génériques du runner interne dans les conversations non directes, afin que les groupes/canaux ne voient pas de texte standard d’erreur du Gateway.
Les échecs classifiés avec un texte de récupération destiné à l’utilisateur, comme les avis d’authentification manquante, de limite de débit ou de surcharge, peuvent toujours être livrés. Les conversations directes affichent par défaut un texte d’échec compact ; les détails bruts du runner ne sont affichés que lorsque `/verbose full` est activé.

Les valeurs par défaut se trouvent sous `agents.defaults.silentReply` ; `surfaces.<id>.silentReply` peut remplacer la politique de groupe/interne par surface.

Les réponses silencieuses nues sont abandonnées sur toutes les surfaces, afin que les sessions parentes restent silencieuses au lieu de réécrire le texte sentinelle en bavardage de repli.

## Liens connexes

- [Refactorisation du cycle de vie des messages](/fr/concepts/message-lifecycle-refactor) - conception cible durable pour l’envoi et la réception
- [Streaming](/fr/concepts/streaming) — livraison des messages en temps réel
- [Réessai](/fr/concepts/retry) — comportement de nouvelle tentative de livraison des messages
- [File](/fr/concepts/queue) — file de traitement des messages
- [Canaux](/fr/channels) — intégrations de plateformes de messagerie
