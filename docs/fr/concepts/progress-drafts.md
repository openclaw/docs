---
read_when:
    - Configurer les mises à jour de progression visibles pour les tours de chat de longue durée
    - Choisir entre les modes de streaming partiel, par bloc et de progression
    - Explication de la façon dont OpenClaw met à jour un message de canal pendant que le travail est en cours
    - Dépannage des brouillons de progression, des messages de progression autonomes ou de la solution de repli de finalisation
summary: 'Brouillons de progression : un seul message visible de travail en cours qui se met à jour pendant l’exécution d’un agent'
title: Brouillons d’avancement
x-i18n:
    generated_at: "2026-05-06T07:20:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4b55c016dd7c8f719237d0cf2481e8259c99ac6dc9320c637eaea23c097e910
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Les brouillons de progression rendent les longs tours d’agent vivants dans le chat sans transformer la conversation en pile de réponses de statut temporaires.

Lorsque les brouillons de progression sont activés, OpenClaw crée un seul message visible de travail en cours seulement après que le tour prouve qu’il effectue un vrai travail, le met à jour pendant que l’agent lit, planifie, appelle des outils ou attend une approbation, puis transforme ce brouillon en réponse finale lorsque le canal peut le faire en toute sécurité.

```text
Shelling...
📖 Read: from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Exec: run tests
```

Utilisez les brouillons de progression lorsque vous voulez un seul message de statut bien rangé pendant un travail intensif en outils, puis la réponse finale une fois le tour terminé.

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

C’est généralement suffisant. OpenClaw choisira une étiquette automatique d’un seul mot, attendra que le travail dure au moins cinq secondes ou émette un deuxième événement de travail, ajoutera des lignes de progression compactes pendant que du travail utile se produit, et supprimera les messages de progression autonomes en double pour ce tour.

## Ce que les utilisateurs voient

Un brouillon de progression comporte deux parties :

| Partie                | Objectif                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------ |
| Étiquette             | Un titre court comme `Thinking...` ou `Shelling...`.                                       |
| Lignes de progression | Des mises à jour d’exécution compactes utilisant les mêmes étiquettes et icônes d’outils que la sortie détaillée. |

L’étiquette apparaît après que l’agent commence un travail significatif et reste occupé pendant cinq secondes ou émet un deuxième événement de travail. Les réponses en texte brut uniquement n’affichent pas de brouillon de progression. Les lignes de progression ne sont ajoutées que lorsque l’agent émet des mises à jour de travail utiles, par exemple `🛠️ Exec`, `🔎 Web Search` ou `✍️ Write: to /tmp/file`. Par défaut, elles utilisent le même mode d’explication compact que `/verbose` ; définissez `agents.defaults.toolProgressDetail: "raw"` lors du débogage si vous voulez aussi que les commandes/détails bruts soient ajoutés.
La réponse finale remplace le brouillon lorsque c’est possible ; sinon, OpenClaw envoie la réponse finale normalement et nettoie le brouillon ou cesse de le mettre à jour selon le transport du canal.

## Choisir un mode

`channels.<channel>.streaming.mode` contrôle le comportement visible en cours :

| Mode       | Idéal pour                                      | Ce qui apparaît dans le chat                               |
| ---------- | ----------------------------------------------- | ---------------------------------------------------------- |
| `off`      | Canaux silencieux                               | Seulement la réponse finale.                               |
| `partial`  | Voir le texte de la réponse apparaître          | Un brouillon modifié avec le dernier texte de réponse.     |
| `block`    | Gros fragments d’aperçu de réponse              | Un aperçu mis à jour ou ajouté par fragments plus grands.  |
| `progress` | Tours intensifs en outils ou de longue durée    | Un brouillon de statut, puis la réponse finale.            |

Choisissez `progress` lorsque les utilisateurs se soucient davantage de « ce qui se passe » que de voir le texte de la réponse s’afficher jeton par jeton.

Choisissez `partial` lorsque la réponse elle-même est le signal de progression.

Choisissez `block` lorsque vous voulez des mises à jour de brouillon d’aperçu en fragments de texte plus grands. Sur Discord et Telegram, `streaming.mode: "block"` reste de la diffusion d’aperçu, pas une livraison normale par blocs. Utilisez `streaming.block.enabled` ou l’ancien `blockStreaming` lorsque vous voulez des réponses normales par blocs.

## Configurer les étiquettes

Les étiquettes de progression se trouvent sous `channels.<channel>.streaming.progress`.

L’étiquette par défaut est `auto`, qui choisit dans le pool intégré d’OpenClaw d’étiquettes d’un seul mot avec points de suspension :

```text
Thinking...
Shelling...
Scuttling...
Clawing...
Pinching...
Molting...
Bubbling...
Tiding...
Reefing...
Cracking...
Sifting...
Brining...
Nautiling...
Krilling...
Barnacling...
Lobstering...
Tidepooling...
Pearling...
Snapping...
Surfacing...
```

Utilisez une étiquette fixe :

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

Utilisez votre propre pool d’étiquettes automatiques :

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

Masquez l’étiquette et n’affichez que les lignes de progression :

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

Les lignes de progression sont activées par défaut en mode progression. Elles proviennent d’événements d’exécution réels : démarrages d’outils, mises à jour d’éléments, plans de tâches, approbations, sortie de commande, résumés de patch et activité d’agent similaire.

OpenClaw utilise le même formateur pour les brouillons de progression et `/verbose` :

```json5
{
  agents: {
    defaults: {
      toolProgressDetail: "explain", // explain | raw
    },
  },
}
```

`"explain"` est la valeur par défaut et garde les brouillons stables avec des étiquettes concises comme `🛠️ Exec: check JS syntax for /tmp/app.js`. `"raw"` ajoute la commande/le détail sous-jacent lorsqu’il est disponible, ce qui est utile pendant le débogage, mais plus bruyant dans le chat.

Par exemple, la même commande apparaît différemment selon le mode de détail :

| Mode      | Ligne de progression                                                |
| --------- | ------------------------------------------------------------------- |
| `explain` | `🛠️ Exec: check JS syntax for /tmp/app.js`                          |
| `raw`     | `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js` |

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

Les lignes de progression sont compactées automatiquement pour réduire les changements de disposition des bulles de chat pendant la modification du brouillon.

OpenClaw tronque les longues lignes de progression par défaut afin que les modifications répétées du brouillon ne provoquent pas des retours à la ligne différents à chaque mise à jour. Le préfixe reste lisible, et les longs détails comme les chemins ou les commandes brutes sont raccourcis avec des points de suspension.

Slack peut afficher les lignes de progression sous forme de champs Block Kit structurés au lieu d’un corps de texte unique :

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "progress",
        progress: {
          render: "rich",
        },
      },
    },
  },
}
```

Le rendu enrichi conserve la même solution de repli en texte brut, afin que les canaux et clients qui ne prennent pas en charge la forme enrichie puissent tout de même afficher le texte de progression compact.

Conservez le brouillon de progression unique, mais masquez les lignes d’outils et de tâches :

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

Avec `toolProgress: false`, OpenClaw supprime toujours les anciens messages autonomes de progression d’outils pour ce tour. Le canal reste visuellement silencieux jusqu’à la réponse finale, sauf pour l’étiquette si une est configurée.

## Comportement des canaux

Chaque canal utilise le transport le plus propre qu’il prend en charge :

| Canal           | Transport de progression                       | Notes                                                                 |
| --------------- | ---------------------------------------------- | --------------------------------------------------------------------- |
| Discord         | Envoyer un message, puis le modifier.          | Le texte final est modifié sur place lorsqu’il tient dans un message d’aperçu sûr. |
| Matrix          | Envoyer un événement, puis le modifier.        | La configuration de streaming au niveau du compte contrôle les brouillons au niveau du compte. |
| Microsoft Teams | Stream Teams natif dans les chats personnels.  | `streaming.mode: "block"` correspond à la livraison par blocs de Teams. |
| Slack           | Stream natif ou publication de brouillon modifiable. | La disponibilité du fil affecte l’utilisation possible du streaming natif. |
| Telegram        | Envoyer un message, puis le modifier.          | Les anciens brouillons visibles peuvent être remplacés afin que les horodatages finaux restent utiles. |
| Mattermost      | Publication de brouillon modifiable.           | L’activité des outils est intégrée dans la même publication de type brouillon. |

Les canaux sans prise en charge sûre de la modification se rabattent généralement sur des indicateurs de saisie ou sur une livraison finale uniquement.

## Finalisation

Lorsque la réponse finale est prête, OpenClaw essaie de garder le chat propre :

- Si le brouillon peut devenir la réponse finale en toute sécurité, OpenClaw le modifie sur place.
- Si le canal utilise le streaming de progression natif, OpenClaw finalise ce stream lorsque le transport natif accepte le texte final.
- Si la réponse finale contient des médias, une invite d’approbation, une cible de réponse explicite, trop de fragments, ou une modification/un envoi échoué, OpenClaw envoie la réponse finale via le chemin normal de livraison du canal.

Le chemin de repli est intentionnel. Il vaut mieux envoyer une nouvelle réponse finale que perdre du texte, envoyer une réponse dans le mauvais fil ou remplacer un brouillon par une charge utile que le canal ne peut pas représenter en toute sécurité.

## Dépannage

**Je ne vois que la réponse finale.**

Vérifiez que `channels.<channel>.streaming.mode` est défini sur `progress` pour le compte ou le canal qui a traité le message. Certains chemins de groupe ou de réponse citée peuvent désactiver les aperçus de brouillon pour un tour lorsque le canal ne peut pas modifier le bon message en toute sécurité.

**Je vois l’étiquette, mais aucune ligne d’outil.**

Vérifiez `streaming.progress.toolProgress`. S’il vaut `false`, OpenClaw conserve le comportement de brouillon unique, mais masque les lignes de progression des outils et des tâches.

**Je vois un nouveau message final au lieu d’un brouillon modifié.**

C’est une solution de repli de sécurité. Cela peut arriver pour les réponses avec médias, les longues réponses, les cibles de réponse explicites, les anciens brouillons Telegram, les cibles de fil Slack manquantes, les messages d’aperçu supprimés ou l’échec de finalisation d’un stream natif.

**Je vois encore des messages de progression autonomes.**

Le mode progression supprime les messages autonomes par défaut de progression d’outils lorsqu’un brouillon est actif. Si des messages autonomes apparaissent encore, vérifiez que le tour utilise réellement le mode progression et non `streaming.mode: "off"` ou un chemin de canal qui ne peut pas créer de brouillon pour ce message.

**Teams se comporte différemment de Discord ou Telegram.**

Microsoft Teams utilise un stream natif dans les chats personnels au lieu du transport générique d’aperçu par envoi puis modification. Teams traite aussi `streaming.mode: "block"` comme une livraison par blocs de Teams, car il n’a pas le même mode de blocs d’aperçu de brouillon utilisé par Discord et Telegram.

## Associé

- [Streaming et fragmentation](/fr/concepts/streaming)
- [Messages](/fr/concepts/messages)
- [Configuration des canaux](/fr/gateway/config-channels)
- [Discord](/fr/channels/discord)
- [Matrix](/fr/channels/matrix)
- [Microsoft Teams](/fr/channels/msteams)
- [Slack](/fr/channels/slack)
- [Telegram](/fr/channels/telegram)
