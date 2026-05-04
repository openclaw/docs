---
read_when:
    - Configurer les mises à jour de progression visibles pour les tours de conversation de longue durée
    - Choisir entre les modes de diffusion partielle, par bloc et avec progression
    - Explication de la manière dont OpenClaw met à jour un seul message de canal pendant que le travail est en cours
    - Dépannage des brouillons de progression, des messages de progression autonomes ou du mécanisme de repli de finalisation
summary: 'Brouillons de progression : un seul message visible de travail en cours qui se met à jour pendant l’exécution d’un agent'
title: Brouillons d’avancement
x-i18n:
    generated_at: "2026-05-04T02:23:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ce19262800f1c3c3e505a3cf1d41ed5c3dffcbca168ad7b7afabdce62eee8fe
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Les brouillons de progression donnent vie aux longues interactions d’agent dans le chat sans transformer la conversation en pile de réponses d’état temporaires.

Lorsque les brouillons de progression sont activés, OpenClaw crée un seul message visible de travail en cours uniquement après que l’interaction a prouvé qu’elle effectue un vrai travail, le met à jour pendant que l’agent lit, planifie, appelle des outils ou attend une approbation, puis transforme ce brouillon en réponse finale lorsque le canal peut le faire en toute sécurité.

```text
Shelling...
📖 Read: from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Exec: run tests
```

Utilisez les brouillons de progression lorsque vous voulez un seul message d’état propre pendant un travail intensif en outils, puis la réponse finale une fois l’interaction terminée.

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

Cela suffit généralement. OpenClaw choisira une étiquette automatique d’un mot, attendra que le travail dure au moins cinq secondes ou émette un deuxième événement de travail, ajoutera des lignes de progression compactes pendant l’exécution d’un travail utile, et supprimera les bavardages de progression autonomes en double pour cette interaction.

## Ce que voient les utilisateurs

Un brouillon de progression comporte deux parties :

| Partie                | Objectif                                                                                  |
| --------------------- | ----------------------------------------------------------------------------------------- |
| Étiquette             | Un titre court comme `Thinking...` ou `Shelling...`.                                      |
| Lignes de progression | Des mises à jour d’exécution compactes utilisant les mêmes libellés et icônes d’outils que la sortie détaillée. |

L’étiquette apparaît après que l’agent commence un travail significatif et reste occupé pendant cinq secondes ou émet un deuxième événement de travail. Les réponses en texte brut uniquement n’affichent pas de brouillon de progression. Les lignes de progression ne sont ajoutées que lorsque l’agent émet des mises à jour de travail utiles, par exemple `🛠️ Exec`, `🔎 Web Search` ou `✍️ Write: to /tmp/file`. Par défaut, elles utilisent le même mode d’explication compact que `/verbose` ; définissez `agents.defaults.toolProgressDetail: "raw"` lors du débogage si vous voulez aussi ajouter les commandes/détails bruts.
La réponse finale remplace le brouillon lorsque c’est possible ; sinon, OpenClaw envoie normalement la réponse finale et nettoie le brouillon ou cesse de le mettre à jour selon le transport du canal.

## Choisir un mode

`channels.<channel>.streaming.mode` contrôle le comportement visible en cours :

| Mode       | Idéal pour                                      | Ce qui apparaît dans le chat                              |
| ---------- | ---------------------------------------------- | --------------------------------------------------------- |
| `off`      | Canaux silencieux                              | Uniquement la réponse finale.                             |
| `partial`  | Observer l’apparition du texte de la réponse   | Un brouillon modifié avec le texte de réponse le plus récent. |
| `block`    | Morceaux d’aperçu de réponse plus grands       | Un aperçu mis à jour ou ajouté en morceaux plus grands.   |
| `progress` | Interactions longues ou intensives en outils   | Un brouillon d’état, puis la réponse finale.              |

Choisissez `progress` lorsque les utilisateurs s’intéressent davantage à « ce qui se passe » qu’à voir le texte de réponse défiler jeton par jeton.

Choisissez `partial` lorsque la réponse elle-même est le signal de progression.

Choisissez `block` lorsque vous voulez des mises à jour de brouillon d’aperçu en morceaux de texte plus grands. Sur Discord et Telegram, `streaming.mode: "block"` reste du streaming d’aperçu, pas une livraison normale par blocs. Utilisez `streaming.block.enabled` ou l’ancien `blockStreaming` lorsque vous voulez des réponses normales par blocs.

## Configurer les étiquettes

Les étiquettes de progression se trouvent sous `channels.<channel>.streaming.progress`.

L’étiquette par défaut est `auto`, qui choisit dans le groupe d’étiquettes intégrées d’OpenClaw, composées d’un seul mot avec points de suspension :

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

Utilisez votre propre groupe d’étiquettes automatiques :

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

Les lignes de progression sont activées par défaut en mode progression. Elles proviennent d’événements d’exécution réels : démarrages d’outils, mises à jour d’éléments, plans de tâche, approbations, sortie de commande, résumés de correctifs et activités similaires de l’agent.

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

`"explain"` est la valeur par défaut et maintient les brouillons stables avec des libellés concis comme `🛠️ Exec: check JS syntax for /tmp/app.js`. `"raw"` ajoute la commande ou le détail sous-jacent lorsque disponible, ce qui est utile pendant le débogage mais plus bruyant dans le chat.

Par exemple, la même commande apparaît différemment selon le mode de détail :

| Mode      | Ligne de progression                                             |
| --------- | ---------------------------------------------------------------- |
| `explain` | `🛠️ Exec: check JS syntax for /tmp/app.js`                       |
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

Avec `toolProgress: false`, OpenClaw supprime toujours les anciens messages autonomes de progression d’outils pour cette interaction. Le canal reste visuellement discret jusqu’à la réponse finale, sauf pour l’étiquette si elle est configurée.

## Comportement des canaux

Chaque canal utilise le transport le plus propre qu’il prend en charge :

| Canal           | Transport de progression                 | Remarques                                                                      |
| --------------- | ---------------------------------------- | ------------------------------------------------------------------------------ |
| Discord         | Envoyer un message, puis le modifier.    | Le texte final est modifié sur place lorsqu’il tient dans un seul message d’aperçu sûr. |
| Matrix          | Envoyer un événement, puis le modifier.  | La configuration de streaming au niveau du compte contrôle les brouillons au niveau du compte. |
| Microsoft Teams | Flux Teams natif dans les chats personnels. | `streaming.mode: "block"` correspond à la livraison par blocs de Teams.        |
| Slack           | Flux natif ou publication de brouillon modifiable. | La disponibilité du fil affecte la possibilité d’utiliser le streaming natif. |
| Telegram        | Envoyer un message, puis le modifier.    | Les anciens brouillons visibles peuvent être remplacés pour que les horodatages finaux restent utiles. |
| Mattermost      | Publication de brouillon modifiable.     | L’activité des outils est intégrée dans la même publication de type brouillon. |

Les canaux sans prise en charge sûre de la modification reviennent généralement aux indicateurs de saisie ou à une livraison uniquement finale.

## Finalisation

Lorsque la réponse finale est prête, OpenClaw essaie de garder le chat propre :

- Si le brouillon peut devenir la réponse finale en toute sécurité, OpenClaw le modifie sur place.
- Si le canal utilise le streaming de progression natif, OpenClaw finalise ce flux lorsque le transport natif accepte le texte final.
- Si la réponse finale contient des médias, une invite d’approbation, une cible de réponse explicite, trop de morceaux, ou une modification/un envoi échoué, OpenClaw envoie la réponse finale par le chemin de livraison normal du canal.

Le chemin de repli est intentionnel. Il vaut mieux envoyer une nouvelle réponse finale que perdre du texte, mal placer une réponse dans un fil, ou écraser un brouillon avec une charge utile que le canal ne peut pas représenter en toute sécurité.

## Dépannage

**Je ne vois que la réponse finale.**

Vérifiez que `channels.<channel>.streaming.mode` est défini sur `progress` pour le compte ou le canal qui a traité le message. Certains chemins de groupe ou de réponse avec citation peuvent désactiver les aperçus de brouillon pour une interaction lorsque le canal ne peut pas modifier en toute sécurité le bon message.

**Je vois l’étiquette, mais aucune ligne d’outil.**

Vérifiez `streaming.progress.toolProgress`. Si la valeur est `false`, OpenClaw conserve le comportement de brouillon unique, mais masque les lignes de progression d’outils et de tâches.

**Je vois un nouveau message final au lieu d’un brouillon modifié.**

Il s’agit d’un repli de sécurité. Cela peut se produire pour les réponses avec médias, les réponses longues, les cibles de réponse explicites, les anciens brouillons Telegram, les cibles de fil Slack manquantes, les messages d’aperçu supprimés ou l’échec de la finalisation d’un flux natif.

**Je vois encore des messages de progression autonomes.**

Le mode progression supprime les messages autonomes de progression d’outils par défaut lorsqu’un brouillon est actif. Si des messages autonomes apparaissent encore, vérifiez que l’interaction utilise réellement le mode progression et non `streaming.mode: "off"` ou un chemin de canal qui ne peut pas créer de brouillon pour ce message.

**Teams se comporte différemment de Discord ou Telegram.**

Microsoft Teams utilise un flux natif dans les chats personnels au lieu du transport générique d’aperçu par envoi puis modification. Teams traite aussi `streaming.mode: "block"` comme une livraison par blocs Teams, car il ne dispose pas du même mode de blocs d’aperçu de brouillon utilisé par Discord et Telegram.

## Associé

- [Streaming et découpage en morceaux](/fr/concepts/streaming)
- [Messages](/fr/concepts/messages)
- [Configuration des canaux](/fr/gateway/config-channels)
- [Discord](/fr/channels/discord)
- [Matrix](/fr/channels/matrix)
- [Microsoft Teams](/fr/channels/msteams)
- [Slack](/fr/channels/slack)
- [Telegram](/fr/channels/telegram)
