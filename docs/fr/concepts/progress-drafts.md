---
read_when:
    - Configuration des mises à jour de progression visibles pour les échanges de conversation de longue durée
    - Choisir entre les modes de streaming partiel, par bloc et de progression
    - Expliquer comment OpenClaw met à jour un message de canal pendant que le travail est en cours
    - Dépannage des brouillons de progression, des messages de progression autonomes ou du mécanisme de repli de finalisation
summary: 'Brouillons de progression : un message de travail en cours visible qui se met à jour pendant l’exécution d’un agent'
title: Brouillons d’avancement
x-i18n:
    generated_at: "2026-05-03T21:30:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0fc0dff38232228b49872d66f4498f065675cdd3abf3a0f4003cb34fcbb7de8c
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Les brouillons de progression donnent vie aux tours d'agent longs dans le chat sans transformer
la conversation en pile de réponses de statut temporaires.

Lorsque les brouillons de progression sont activés, OpenClaw crée un message
visible de travail en cours, le met à jour pendant que l'agent lit, planifie,
appelle des outils ou attend une approbation, puis transforme ce brouillon en
réponse finale lorsque le canal peut le faire en toute sécurité.

```text
Shelling
- reading recent channel context
- checking matching issues
- preparing reply
```

Utilisez les brouillons de progression lorsque vous voulez un seul message de
statut propre pendant un travail intensif en outils, puis la réponse finale une
fois le tour terminé.

## Démarrage rapide

Activez les brouillons de progression par canal avec `streaming.mode: "progress"` :

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
      },
    },
  },
}
```

C'est généralement suffisant. OpenClaw choisira un libellé automatique d'un seul
mot, ajoutera des lignes de progression compactes lorsque du travail utile se
produit, et supprimera le bavardage de progression autonome en double pour ce
tour.

## Ce que voient les utilisateurs

Un brouillon de progression comporte deux parties :

| Partie                | Objectif                                                               |
| --------------------- | ---------------------------------------------------------------------- |
| Libellé               | Un titre court comme `Thinking` ou `Shelling`.                         |
| Lignes de progression | Des mises à jour d'exécution compactes comme des appels d'outils, des étapes de tâche ou des approbations. |

Le libellé apparaît immédiatement lorsque l'agent commence à répondre. Les lignes
de progression ne sont ajoutées que lorsque l'agent émet des mises à jour de
travail utiles. La réponse finale remplace le brouillon lorsque c'est possible ;
sinon OpenClaw envoie normalement la réponse finale et nettoie ou cesse de mettre
à jour le brouillon selon le transport du canal.

## Choisir un mode

`channels.<channel>.streaming.mode` contrôle le comportement visible de travail
en cours :

| Mode       | Idéal pour                          | Ce qui apparaît dans le chat                         |
| ---------- | ----------------------------------- | ---------------------------------------------------- |
| `off`      | Les canaux silencieux               | Seulement la réponse finale.                         |
| `partial`  | Voir le texte de réponse apparaître | Un brouillon modifié avec le dernier texte de réponse. |
| `block`    | Des blocs d'aperçu de réponse plus grands | Un aperçu mis à jour ou ajouté en plus grands blocs. |
| `progress` | Les tours intensifs en outils ou longs | Un brouillon de statut, puis la réponse finale.      |

Choisissez `progress` lorsque les utilisateurs s'intéressent davantage à « ce qui
se passe » qu'à regarder le texte de la réponse défiler jeton par jeton.

Choisissez `partial` lorsque la réponse elle-même est le signal de progression.

Choisissez `block` lorsque vous voulez des mises à jour d'aperçu du brouillon en
plus grands blocs de texte. Sur Discord et Telegram, `streaming.mode: "block"`
reste du streaming d'aperçu, et non une livraison normale par blocs. Utilisez
`streaming.block.enabled` ou l'ancien `blockStreaming` lorsque vous voulez des
réponses normales par blocs.

## Configurer les libellés

Les libellés de progression se trouvent sous
`channels.<channel>.streaming.progress`.

Le libellé par défaut est `auto`, qui choisit dans la réserve intégrée de
libellés d'un seul mot d'OpenClaw :

```text
Thinking
Shelling
Scuttling
Clawing
Pinching
Molting
Bubbling
Tiding
Reefing
Cracking
Sifting
Brining
Nautiling
Krilling
Barnacling
Lobstering
Tidepooling
Pearling
Snapping
Surfacing
```

Utilisez un libellé fixe :

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "Investigating",
        },
      },
    },
  },
}
```

Utilisez votre propre réserve de libellés automatiques :

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          labels: ["Checking", "Reading", "Testing", "Finishing"],
        },
      },
    },
  },
}
```

Masquez le libellé et affichez seulement les lignes de progression :

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: false,
        },
      },
    },
  },
}
```

## Contrôler les lignes de progression

Les lignes de progression sont activées par défaut en mode progression. Elles
proviennent d'événements d'exécution réels : démarrages d'outils, mises à jour
d'éléments, plans de tâches, approbations, sortie de commande, résumés de patch
et activités similaires de l'agent.

Limitez le nombre de lignes qui restent visibles :

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          maxLines: 4,
        },
      },
    },
  },
}
```

Conservez le brouillon de progression unique, mais masquez les lignes d'outils et
de tâches :

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          toolProgress: false,
        },
      },
    },
  },
}
```

Avec `toolProgress: false`, OpenClaw supprime toujours les anciens messages
autonomes de progression des outils pour ce tour. Le canal reste visuellement
discret jusqu'à la réponse finale, à l'exception du libellé si un libellé est
configuré.

## Comportement des canaux

Chaque canal utilise le transport le plus propre qu'il prend en charge :

| Canal           | Transport de progression                 | Notes                                                                 |
| --------------- | ---------------------------------------- | --------------------------------------------------------------------- |
| Discord         | Envoyer un message, puis le modifier.    | Le texte final est modifié sur place lorsqu'il tient dans un message d'aperçu sûr. |
| Matrix          | Envoyer un événement, puis le modifier.  | La configuration de streaming au niveau du compte contrôle les brouillons au niveau du compte. |
| Microsoft Teams | Flux Teams natif dans les conversations personnelles. | `streaming.mode: "block"` correspond à la livraison par blocs Teams. |
| Slack           | Flux natif ou publication de brouillon modifiable. | La disponibilité du fil affecte la possibilité d'utiliser le streaming natif. |
| Telegram        | Envoyer un message, puis le modifier.    | Les anciens brouillons visibles peuvent être remplacés afin que les horodatages finaux restent utiles. |
| Mattermost      | Publication de brouillon modifiable.     | L'activité des outils est intégrée à la même publication de type brouillon. |

Les canaux sans prise en charge sûre de la modification se replient généralement
sur des indicateurs de saisie ou une livraison uniquement finale.

## Finalisation

Lorsque la réponse finale est prête, OpenClaw essaie de garder le chat propre :

- Si le brouillon peut devenir la réponse finale en toute sécurité, OpenClaw le modifie sur place.
- Si le canal utilise le streaming de progression natif, OpenClaw finalise ce flux
  lorsque le transport natif accepte le texte final.
- Si la réponse finale contient des médias, une demande d'approbation, une cible
  de réponse explicite, trop de blocs, ou un échec de modification/envoi,
  OpenClaw envoie la réponse finale par le chemin de livraison normal du canal.

Le chemin de repli est intentionnel. Mieux vaut envoyer une nouvelle réponse
finale que perdre du texte, répondre dans le mauvais fil, ou remplacer un
brouillon par une charge utile que le canal ne peut pas représenter en toute
sécurité.

## Dépannage

**Je vois seulement la réponse finale.**

Vérifiez que `channels.<channel>.streaming.mode` est défini sur `progress` pour
le compte ou le canal qui a traité le message. Certains chemins de groupe ou de
réponse citée peuvent désactiver les aperçus de brouillon pour un tour lorsque
le canal ne peut pas modifier le bon message en toute sécurité.

**Je vois le libellé, mais aucune ligne d'outil.**

Vérifiez `streaming.progress.toolProgress`. Si cette option vaut `false`,
OpenClaw conserve le comportement à brouillon unique, mais masque les lignes de
progression des outils et des tâches.

**Je vois un nouveau message final au lieu d'un brouillon modifié.**

C'est un repli de sécurité. Cela peut se produire pour les réponses avec médias,
les réponses longues, les cibles de réponse explicites, les anciens brouillons
Telegram, les cibles de fil Slack manquantes, les messages d'aperçu supprimés ou
l'échec de finalisation d'un flux natif.

**Je vois encore des messages de progression autonomes.**

Le mode progression supprime les messages autonomes par défaut de progression
des outils lorsqu'un brouillon est actif. Si des messages autonomes apparaissent
encore, vérifiez que le tour utilise réellement le mode progression et non
`streaming.mode: "off"` ou un chemin de canal qui ne peut pas créer de brouillon
pour ce message.

**Teams se comporte différemment de Discord ou Telegram.**

Microsoft Teams utilise un flux natif dans les conversations personnelles au lieu
du transport générique d'aperçu par envoi et modification. Teams traite aussi
`streaming.mode: "block"` comme une livraison par blocs Teams, car il ne dispose
pas du même mode de blocs d'aperçu de brouillon utilisé par Discord et Telegram.

## Liens associés

- [Streaming et découpage en blocs](/fr/concepts/streaming)
- [Messages](/fr/concepts/messages)
- [Configuration des canaux](/fr/gateway/config-channels)
- [Discord](/fr/channels/discord)
- [Matrix](/fr/channels/matrix)
- [Microsoft Teams](/fr/channels/msteams)
- [Slack](/fr/channels/slack)
- [Telegram](/fr/channels/telegram)
