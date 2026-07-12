---
read_when:
    - Expliquer comment les messages entrants deviennent des réponses
    - Clarification des sessions, des modes de mise en file d’attente ou du comportement de diffusion en continu
    - Documenter la visibilité du raisonnement et ses implications en matière d’utilisation
summary: Flux des messages, sessions, mise en file d’attente et visibilité du raisonnement
title: Messages
x-i18n:
    generated_at: "2026-07-12T15:20:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 16f0dc387a8825a91568dcd5a44f8bdc54b8d69d78f851760dfc2efa1eb151e7
    source_path: concepts/messages.md
    workflow: 16
---

Les messages entrants passent par le routage, la déduplication/temporisation, une exécution de l’agent et la distribution sortante :

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
- Les remplacements propres aux canaux (`channels.telegram.*`, `channels.whatsapp.*`, etc.) pour les limites par canal et les options de streaming.

Consultez [Configuration](/fr/gateway/configuration) pour le schéma complet.

## Déduplication des messages entrants

Les canaux peuvent redistribuer le même message après une reconnexion. OpenClaw conserve un cache en mémoire indexé par le périmètre de l’agent, la route du canal (canal + pair + compte + fil de discussion) et l’identifiant du message, afin qu’un message redistribué ne déclenche pas une seconde exécution de l’agent. L’entrée de cache expire au bout de 20 minutes ou dès que 5000 entrées sont suivies, selon la première éventualité.

## Temporisation des messages entrants

Les messages texte consécutifs envoyés rapidement par un même expéditeur peuvent être regroupés en un seul tour de l’agent via `messages.inbound`. La temporisation s’applique par canal + conversation et utilise le message le plus récent pour le fil de réponse et les identifiants.

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

- La temporisation s’applique uniquement aux messages texte ; les médias/pièces jointes déclenchent immédiatement l’envoi.
- Les commandes de contrôle (arrêt/abandon/état, etc.) contournent la temporisation afin d’être transmises immédiatement.
- Désactivée par défaut : `messages.inbound.debounceMs` n’a aucune valeur par défaut intégrée ; la temporisation ne s’active donc qu’après sa configuration (globalement ou par canal).
- L’option facultative `coalesceSameSenderDms` d’iMessage constitue la seule exception : elle retient suffisamment longtemps tous les messages texte privés du même expéditeur (commandes incluses) pour que l’envoi séparé par Apple de la commande et de l’URL soit reçu en un seul tour. Les discussions de groupe sont toujours transmises instantanément, quel que soit ce paramètre.

## Sessions et appareils

Les sessions appartiennent au Gateway, et non aux clients.

- Les conversations directes sont regroupées sous la clé de session principale de l’agent.
- Les groupes/canaux disposent de leurs propres clés de session.
- Le stockage des sessions et les transcriptions résident sur l’hôte du Gateway.

Plusieurs appareils/canaux peuvent être associés à la même session, mais l’historique n’est pas entièrement resynchronisé vers chaque client. Utilisez un appareil principal pour les longues conversations afin d’éviter toute divergence de contexte. L’interface de contrôle et la TUI affichent toujours la transcription de session fournie par le Gateway ; elles constituent donc la source de vérité.

Détails : [Gestion des sessions](/fr/concepts/session).

## Corps des prompts et contexte de l’historique

Les Plugins de canal renseignent plusieurs champs de texte dans le contexte entrant, du plus prioritaire au moins prioritaire :

| Champ             | Fonction                                                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `BodyForAgent`    | Texte destiné au modèle pour le tour actuel. Se rabat sur `CommandBody` / `RawBody` / `Body` lorsqu’il n’est pas défini.                      |
| `BodyForCommands` | Texte épuré utilisé pour l’analyse des directives/commandes. Se rabat sur `CommandBody` / `RawBody` / `Body` lorsqu’il n’est pas défini.      |
| `CommandBody`     | Corps intermédiaire hérité ; privilégiez `BodyForCommands`.                                                                                 |
| `RawBody`         | Alias obsolète de `CommandBody`.                                                                                                             |
| `Body`            | Corps de prompt hérité ; peut inclure des enveloppes de canal et des encapsulations d’historique.                                           |

Lorsqu’un canal fournit un historique, il l’encadre avec :

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Pour les conversations non directes (groupes/canaux/salons), le corps du message actuel est préfixé par le libellé de l’expéditeur, conformément au style utilisé pour les entrées de l’historique. La suppression des directives s’applique uniquement à la section du message actuel, de sorte que l’historique reste intact. Les canaux qui encapsulent l’historique doivent définir `BodyForCommands` (ou les anciens `CommandBody` / `RawBody`) sur le texte du message d’origine et conserver dans `Body` l’invite combinée.

Les tampons d’historique ne contiennent que les messages en attente : ils incluent les messages de groupe qui n’ont pas déclenché d’exécution (par exemple, les messages soumis à une condition de mention) et excluent les messages déjà présents dans la transcription de la session. Lors de l’assemblage du prompt, l’historique structuré ainsi que les métadonnées de réponse, de transfert et de canal sont rendus sous forme de blocs de contexte non fiables associés au rôle utilisateur.

Configurez la taille de l’historique avec `messages.groupChat.historyLimit` (valeur globale par défaut) ou des remplacements propres à chaque canal, tels que `channels.slack.historyLimit` et `channels.telegram.accounts.<id>.historyLimit` (définissez la valeur sur `0` pour désactiver cette fonctionnalité).

## Métadonnées des résultats d’outil

Le champ `content` du résultat d’outil correspond au résultat visible par le modèle ; `details` contient les métadonnées d’exécution destinées au rendu de l’interface utilisateur, aux diagnostics, à la diffusion des médias et aux plugins.

- `toolResult.details` est supprimé avant la relecture par le fournisseur et avant l’entrée de compaction.
- Les transcriptions de session persistées ne conservent que des `details` de taille limitée ; les métadonnées surdimensionnées sont remplacées par un résumé compact marqué `persistedDetailsTruncated: true`.
- Les Plugins et les outils doivent placer le texte que le modèle doit lire dans `content`, et non uniquement dans `details`.

## Mise en file d’attente et suivis

Lorsqu’une exécution est déjà active, les messages entrants l’orientent par défaut. `messages.queue` contrôle le mode :

| Mode              | Comportement                                                        |
| ----------------- | ------------------------------------------------------------------- |
| `steer` (par défaut) | Injecte le nouveau prompt dans l’exécution active.                |
| `followup`        | Exécute le message après la fin de l’exécution active.               |
| `collect`         | Regroupe les messages compatibles en un seul tour ultérieur.         |
| `interrupt`       | Interrompt l’exécution active, puis lance le prompt le plus récent.   |

Valeurs par défaut : `messages.queue.debounceMs` est de 500ms (s’applique de la même manière au regroupement des modes steer, followup et collect), `messages.queue.cap` est de 20 messages en file d’attente et `messages.queue.drop` vaut `summarize` (`old` et `new` sont également disponibles). Configurez des remplacements propres à chaque canal via `messages.queue.byChannel` et `messages.queue.debounceMsByChannel`.

Détails : [File d’attente des commandes](/fr/concepts/queue) et [File d’attente d’orientation](/fr/concepts/queue-steering).

## Propriété de l’exécution par les canaux

Les plugins de canal peuvent préserver l’ordre, appliquer un anti-rebond aux entrées et exercer une contre-pression de transport avant qu’un message n’entre dans la file d’attente de la session. Ils ne doivent pas imposer de délai d’expiration distinct autour du tour de l’agent lui-même. Une fois qu’un message est acheminé vers une session, les cycles de vie de la session, des outils et de l’environnement d’exécution régissent les travaux de longue durée afin que tous les canaux signalent les tours lents et s’en remettent de manière cohérente.

## Diffusion en continu, découpage et traitement par lots

La diffusion en continu par blocs envoie des réponses partielles à mesure que le modèle produit des blocs de texte ; le découpage respecte les limites de texte du canal et évite de scinder le code délimité.

- `agents.defaults.blockStreamingDefault` (`on|off`, valeur par défaut : `off`)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (regroupement basé sur l’inactivité)
- `agents.defaults.humanDelay` (pause semblable à celle d’un humain entre les réponses par blocs)
- Remplacements propres aux canaux : `*.streaming.block.enabled` et `*.streaming.block.coalesce` sur les canaux dotés d’une configuration imbriquée de diffusion en continu (Telegram, Discord, Slack, iMessage, Microsoft Teams) ; `*.blockStreaming` / `*.blockStreamingCoalesce` à plat sur les canaux sans configuration imbriquée de diffusion en continu. La diffusion en continu par blocs est désactivée sauf si elle est explicitement activée, sur tous les canaux, y compris Telegram.

Détails : [Diffusion en continu et découpage](/fr/concepts/streaming).

## Visibilité du raisonnement et jetons

- `/reasoning on|off|stream` contrôle la visibilité.
- Le contenu du raisonnement est toujours comptabilisé dans l’utilisation des tokens lorsque le modèle le produit.
- Telegram prend en charge la diffusion en continu du raisonnement dans une bulle de brouillon temporaire, supprimée après la livraison finale ; utilisez `/reasoning on` pour conserver la sortie du raisonnement.

Détails : [Directives de réflexion et de raisonnement](/fr/tools/thinking) et [Utilisation des tokens](/fr/reference/token-use).

## Préfixes, fils de discussion et réponses

- Cascade des préfixes sortants : `messages.responsePrefix`, `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`. WhatsApp dispose également de `channels.whatsapp.messagePrefix` pour un préfixe entrant.
- Organisation des réponses en fils de discussion via `replyToMode` et les valeurs par défaut propres à chaque canal.

Détails : [Configuration](/fr/gateway/config-agents#messages) et documentation des canaux.

## Réponses silencieuses

Le token silencieux `NO_REPLY` (insensible à la casse, donc `no_reply` correspond également) signifie « ne pas envoyer de réponse visible par l’utilisateur ». Lorsqu’un tour comporte aussi des médias d’outil en attente, comme un fichier audio TTS généré, OpenClaw supprime le texte silencieux, mais livre tout de même la pièce jointe multimédia.

La politique de silence dépend du type de conversation :

- Les conversations directes ne reçoivent jamais d’instructions de prompt relatives à `NO_REPLY`. Si une exécution directe renvoie accidentellement uniquement un token silencieux, OpenClaw le supprime au lieu de le reformuler ou de le livrer.
- Les groupes et canaux autorisent le silence par défaut. En mode de réponse visible `message_tool`, le silence signifie que le modèle n’appelle pas `message(action=send)`.
- L’orchestration interne autorise le silence par défaut.

Les valeurs par défaut se trouvent sous `agents.defaults.silentReply` ; `surfaces.<id>.silentReply` peut remplacer la politique de groupe ou interne pour chaque surface.

OpenClaw utilise également les réponses silencieuses pour les échecs génériques du moteur d’exécution interne dans les discussions non directes, afin que les groupes et canaux ne voient pas le texte d’erreur standard du Gateway. Les échecs classifiés accompagnés d’instructions de récupération destinées à l’utilisateur, tels que les notifications d’authentification manquante, de limite de débit ou de surcharge, peuvent toujours être livrés. Les conversations directes affichent par défaut un message d’échec concis ; les détails bruts du moteur d’exécution ne s’affichent que lorsque `/verbose full` est activé.

Les réponses contenant uniquement le token silencieux sont ignorées sur toutes les surfaces, de sorte que les sessions parentes restent silencieuses au lieu de reformuler le texte sentinelle en message de remplacement.

## Voir aussi

- [Refactorisation du cycle de vie des messages](/fr/concepts/message-lifecycle-refactor) - conception cible pour un envoi et une réception durables
- [Diffusion en continu](/fr/concepts/streaming) - livraison des messages en temps réel
- [Nouvelle tentative](/fr/concepts/retry) - comportement des nouvelles tentatives de livraison des messages
- [File d’attente](/fr/concepts/queue) - file d’attente de traitement des messages
- [Canaux](/fr/channels) - intégrations aux plateformes de messagerie
