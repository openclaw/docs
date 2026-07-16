---
read_when:
    - Explication de la transformation des messages entrants en réponses
    - Clarification des sessions, des modes de mise en file d’attente ou du comportement de diffusion en continu
    - Documenter la visibilité du raisonnement et ses implications sur l’utilisation
summary: Flux des messages, sessions, mise en file d’attente et visibilité du raisonnement
title: Messages
x-i18n:
    generated_at: "2026-07-16T13:08:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e2982ebb1b82b90368263826ef8f42babab9c8a559cc1409a381893a011a0ad7
    source_path: concepts/messages.md
    workflow: 16
---

Les messages entrants passent par le routage, la déduplication/temporisation, une exécution de l’agent, puis la remise sortante :

```text
Message entrant
  -> routage/liaisons -> clé de session
  -> déduplication + temporisation
  -> file d’attente (si une exécution est déjà active)
  -> exécution de l’agent (streaming + outils)
  -> réponses sortantes (limites du canal + découpage)
```

Principales surfaces de configuration :

- `messages.*` pour les préfixes, la mise en file d’attente, la temporisation des messages entrants et le comportement des groupes.
- `agents.defaults.*` pour le streaming par blocs, le découpage et les valeurs par défaut des réponses silencieuses.
- Remplacements propres aux canaux (`channels.telegram.*`, `channels.whatsapp.*`, etc.) pour les limites et les options de streaming de chaque canal.

Consultez [Configuration](/fr/gateway/configuration) pour le schéma complet.

## Déduplication des messages entrants

Les canaux peuvent remettre le même message après une reconnexion. OpenClaw conserve un cache en mémoire indexé par la portée de l’agent, la route du canal (canal + pair + compte + fil de discussion) et l’identifiant du message, afin qu’un message remis une nouvelle fois ne déclenche pas une deuxième exécution de l’agent. L’entrée de cache expire après 20 minutes ou dès que 5000 entrées sont suivies, selon la première éventualité.

## Temporisation des messages entrants

Les messages texte successifs envoyés rapidement par un même expéditeur peuvent être regroupés en un seul tour d’agent via `messages.inbound`. La temporisation s’applique par canal + conversation et utilise le message le plus récent pour le fil de réponse et les identifiants.

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000,
      byChannel: {
        discord: 1500,
        slack: 1500,
        whatsapp: 5000,
      },
    },
  },
}
```

- La temporisation s’applique uniquement aux messages texte ; les médias et pièces jointes déclenchent immédiatement l’envoi.
- Les commandes de contrôle (arrêt/abandon/état, etc.) contournent la temporisation afin d’être distribuées immédiatement.
- Désactivée par défaut : `messages.inbound.debounceMs` n’a aucune valeur par défaut intégrée ; la temporisation ne s’active donc qu’après sa configuration (globale ou par canal).
- L’activation facultative de `coalesceSameSenderDms` pour iMessage constitue la seule exception : elle retient suffisamment longtemps tous les textes de messages privés provenant du même expéditeur, commandes comprises, pour que l’envoi scindé commande+URL d’Apple arrive en un seul tour. Les discussions de groupe sont toujours distribuées instantanément, quelle que soit cette configuration.

## Sessions et appareils

Les sessions appartiennent au Gateway, et non aux clients.

- Les discussions directes sont regroupées sous la clé de session principale de l’agent.
- Les groupes et canaux disposent de leurs propres clés de session.
- Le stockage des sessions et les transcriptions résident sur l’hôte du Gateway.

Plusieurs appareils ou canaux peuvent correspondre à la même session, mais l’historique n’est pas entièrement resynchronisé vers chaque client. Utilisez un appareil principal pour les longues conversations afin d’éviter toute divergence de contexte. L’interface de contrôle et la TUI affichent toujours la transcription de session issue du Gateway ; elles constituent donc la source de référence.

Détails : [Gestion des sessions](/fr/concepts/session).

## Corps des prompts et contexte de l’historique

Les Plugins de canal renseignent plusieurs champs de texte dans le contexte entrant, du plus au moins prioritaire :

| Champ             | Objectif                                                                                                     |
| ----------------- | ----------------------------------------------------------------------------------------------------------- |
| `BodyForAgent`    | Texte présenté au modèle pour le tour actuel. Utilise `CommandBody` / `RawBody` / `Body` par défaut lorsqu’il n’est pas défini.        |
| `BodyForCommands` | Texte épuré utilisé pour analyser les directives et commandes. Utilise `CommandBody` / `RawBody` / `Body` par défaut lorsqu’il n’est pas défini. |
| `CommandBody`     | Corps intermédiaire hérité ; préférez `BodyForCommands`.                                                         |
| `RawBody`         | Alias obsolète de `CommandBody`.                                                                         |
| `Body`            | Corps de prompt hérité ; peut inclure les enveloppes du canal et les conteneurs de l’historique.                                     |

Lorsqu’un canal fournit un historique, il l’encapsule avec :

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Pour les discussions non directes (groupes/canaux/salons), le corps du message actuel est précédé du libellé de l’expéditeur, selon le même style que les entrées de l’historique. La suppression des directives s’applique uniquement à la section du message actuel, afin que l’historique reste intact. Les canaux qui encapsulent l’historique doivent définir `BodyForCommands` (ou les anciens `CommandBody` / `RawBody`) sur le texte du message d’origine et conserver le prompt combiné dans `Body`.

Les tampons d’historique ne contiennent que les messages en attente : ils incluent les messages de groupe qui n’ont pas déclenché d’exécution (par exemple, les messages soumis à une mention obligatoire) et excluent les messages déjà présents dans la transcription de session. L’historique structuré ainsi que les métadonnées de réponse, de transfert et de canal sont rendus sous forme de blocs de contexte de rôle utilisateur non fiables lors de l’assemblage du prompt.

Configurez la taille de l’historique avec `messages.groupChat.historyLimit` (valeur globale par défaut) ou des remplacements propres aux canaux, tels que `channels.slack.historyLimit` et `channels.telegram.accounts.<id>.historyLimit` (définissez `0` pour le désactiver).

## Métadonnées des résultats d’outils

Le champ `content` du résultat d’un outil correspond au résultat visible par le modèle ; `details` contient les métadonnées d’exécution destinées au rendu de l’interface, aux diagnostics, à la remise des médias et aux Plugins.

- `toolResult.details` est supprimé avant la réexécution par le fournisseur et avant les données d’entrée de la Compaction.
- Les transcriptions de session persistantes ne conservent qu’un `details` limité ; les métadonnées surdimensionnées sont remplacées par un résumé compact marqué `persistedDetailsTruncated: true`.
- Les Plugins et outils doivent placer dans `content` le texte que le modèle doit lire, et pas uniquement dans `details`.

## Mise en file d’attente et suivis

Lorsqu’une exécution est déjà active, les messages entrants sont par défaut orientés vers celle-ci. `messages.queue` contrôle le mode :

| Mode              | Comportement                                            |
| ----------------- | --------------------------------------------------- |
| `steer` (par défaut) | Injecte le nouveau prompt dans l’exécution active.          |
| `followup`        | Exécute le message une fois l’exécution active terminée.      |
| `collect`         | Regroupe les messages compatibles en un seul tour ultérieur.      |
| `interrupt`       | Abandonne l’exécution active, puis lance le prompt le plus récent. |

Valeurs par défaut : `messages.queue.debounceMs` vaut 500ms (pour l’orientation, le suivi et le regroupement), `messages.queue.cap` vaut 20 messages en attente et `messages.queue.drop` vaut `summarize` (`old` et `new` sont également disponibles). Configurez les remplacements propres aux canaux via `messages.queue.byChannel` et `messages.queue.debounceMsByChannel`.

Détails : [File d’attente des commandes](/fr/concepts/queue) et [File d’attente d’orientation](/fr/concepts/queue-steering).

## Propriété de l’exécution par le canal

Les Plugins de canal peuvent préserver l’ordre, temporiser les entrées et appliquer une contre-pression de transport avant qu’un message n’entre dans la file d’attente de la session. Ils ne doivent pas imposer de délai d’expiration distinct autour du tour de l’agent lui-même. Une fois qu’un message est routé vers une session, les cycles de vie de la session, des outils et de l’environnement d’exécution régissent les tâches longues, afin que tous les canaux signalent les tours lents et s’en remettent de manière cohérente.

## Streaming, découpage et regroupement

Le streaming par blocs envoie des réponses partielles à mesure que le modèle produit des blocs de texte ; le découpage respecte les limites de texte du canal et évite de scinder les blocs de code délimités.

- `agents.defaults.blockStreamingDefault` (`on|off`, valeur par défaut `off`)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (regroupement fondé sur l’inactivité)
- `agents.defaults.humanDelay` (pause semblable à celle d’un humain entre les réponses par blocs)
- Remplacements propres aux canaux : `*.streaming.block.enabled` et `*.streaming.block.coalesce` sur les canaux intégrés ; les anciennes clés plates sont migrées par `openclaw doctor --fix`. Le streaming par blocs est désactivé, sauf activation explicite, sur tous les canaux, y compris Telegram. QQ Bot constitue l’exception : il ne possède aucune clé `streaming.block` et diffuse les réponses par blocs, sauf si `channels.qqbot.streaming.mode` vaut `"off"`.

Détails : [Streaming + découpage](/fr/concepts/streaming).

## Visibilité du raisonnement et tokens

- `/reasoning on|off|stream` contrôle la visibilité.
- Le contenu du raisonnement compte toujours dans l’utilisation des tokens lorsque le modèle le produit.
- Telegram permet de diffuser le raisonnement dans une bulle de brouillon temporaire, supprimée après la remise finale ; utilisez `/reasoning on` pour une sortie de raisonnement persistante.

Détails : [Directives de réflexion + raisonnement](/fr/tools/thinking) et [Utilisation des tokens](/fr/reference/token-use).

## Préfixes, fils de discussion et réponses

- Cascade de préfixes sortants : `messages.responsePrefix`, `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`. WhatsApp dispose également de `channels.whatsapp.messagePrefix` comme préfixe entrant.
- Mise en fil des réponses via `replyToMode` et les valeurs par défaut propres aux canaux.

Détails : [Configuration](/fr/gateway/config-agents#messages) et documentation des canaux.

## Réponses silencieuses

Le token silencieux `NO_REPLY` (insensible à la casse, donc `no_reply` correspond également) signifie « ne pas remettre de réponse visible par l’utilisateur ». Lorsqu’un tour contient aussi un média d’outil en attente, tel qu’un fichier audio TTS généré, OpenClaw supprime le texte silencieux, mais remet tout de même la pièce jointe multimédia.

La politique de silence est déterminée par le type de conversation :

- Les conversations directes ne reçoivent jamais les instructions de prompt `NO_REPLY`. Si une exécution directe renvoie accidentellement un token silencieux seul, OpenClaw le supprime au lieu de le reformuler ou de le remettre.
- Les groupes et canaux autorisent le silence par défaut. En mode de réponse visible `message_tool`, le silence signifie que le modèle n’appelle pas `message(action=send)`.
- L’orchestration interne autorise le silence par défaut.

Les valeurs par défaut se trouvent sous `agents.defaults.silentReply` ; `surfaces.<id>.silentReply` permet de remplacer la politique des groupes ou de l’orchestration interne pour chaque surface.

OpenClaw utilise également les réponses silencieuses pour les défaillances internes génériques de l’exécuteur dans les discussions non directes, afin que les groupes et canaux ne voient pas le texte standard des erreurs du Gateway. Les défaillances classifiées accompagnées d’instructions de récupération destinées à l’utilisateur, telles que les notifications d’authentification manquante, de limitation du débit ou de surcharge, peuvent toujours être remises. Les discussions directes affichent par défaut un message de défaillance concis ; les détails bruts de l’exécuteur ne s’affichent que lorsque `/verbose full` est activé.

Les réponses ne contenant que le token silencieux sont supprimées sur toutes les surfaces, afin que les sessions parentes restent silencieuses plutôt que de reformuler le texte sentinelle en bavardage de substitution.

## Pages connexes

- [Refactorisation du cycle de vie des messages](/fr/concepts/message-lifecycle-refactor) - conception cible durable pour l’envoi et la réception
- [Streaming](/fr/concepts/streaming) - remise des messages en temps réel
- [Nouvelle tentative](/fr/concepts/retry) - comportement de nouvelle tentative de remise des messages
- [File d’attente](/fr/concepts/queue) - file d’attente de traitement des messages
- [Canaux](/fr/channels) - intégrations aux plateformes de messagerie
