---
read_when:
    - Configurer les mises à jour visibles de progression pour les tours de conversation de longue durée
    - Choisir entre les modes de diffusion partielle, par blocs et de progression
    - Expliquer comment OpenClaw met à jour un message de canal pendant que le travail est en cours
    - Dépannage des brouillons d’avancement, des messages d’avancement autonomes ou de la solution de repli de finalisation
summary: 'Brouillons d’avancement : un seul message visible de travail en cours qui se met à jour pendant l’exécution d’un agent'
title: Brouillons d’avancement
x-i18n:
    generated_at: "2026-05-11T20:34:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3d84027a412a2c62ea9a5698d015c7aeb8a7f27d9db79112bb2c1c10f97ebd88
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Les brouillons de progression rendent les longs tours d’agent plus vivants dans le chat sans transformer
la conversation en pile de réponses d’état temporaires.

Lorsque les brouillons de progression sont activés, OpenClaw crée un seul message
visible de travail en cours seulement après que le tour a prouvé qu’il effectue un vrai travail, le met à jour pendant que
l’agent lit, planifie, appelle des outils ou attend une approbation, puis transforme ce brouillon
en réponse finale lorsque le canal peut le faire en toute sécurité.

```text
Shelling...
📖 from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Bash: run tests
```

Utilisez les brouillons de progression lorsque vous voulez un seul message d’état ordonné pendant un travail intensif en outils
et la réponse finale lorsque le tour est terminé.

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

C’est généralement suffisant. OpenClaw choisira un libellé automatique d’un mot, attendra
que le travail dure au moins cinq secondes ou émette un second événement de travail, ajoutera des lignes de
progression compactes pendant que du travail utile se produit, et supprimera le bavardage de progression autonome
en double pour ce tour.

## Ce que voient les utilisateurs

Un brouillon de progression comporte deux parties :

| Partie                | Objectif                                                                                 |
| --------------------- | ---------------------------------------------------------------------------------------- |
| Libellé               | Une courte ligne de démarrage/d’état comme `Thinking...` ou `Shelling...`.               |
| Lignes de progression | Des mises à jour d’exécution compactes utilisant les mêmes icônes d’outils et formateur de détails que la sortie détaillée. |

Le libellé apparaît après que l’agent commence un travail significatif et soit reste occupé
pendant cinq secondes, soit émet un second événement de travail. Il fait partie de la liste déroulante des lignes de
progression, donc l’état de démarrage défile hors de vue une fois qu’assez de travail concret apparaît.
Les réponses en texte brut uniquement n’affichent pas de brouillon de progression. Les lignes de progression sont ajoutées
uniquement lorsque l’agent émet des mises à jour de travail utiles, par exemple `🛠️ Bash: run tests`,
`🔎 Web Search: for "discord edit message"` ou `✍️ Write: to /tmp/file`.
Par défaut, elles utilisent le même mode d’explication compact que `/verbose` ; définissez
`agents.defaults.toolProgressDetail: "raw"` lors du débogage si vous voulez aussi ajouter les
commandes/détails bruts.
La réponse finale remplace le brouillon lorsque c’est possible ; sinon
OpenClaw envoie normalement la réponse finale et nettoie ou cesse de mettre à jour le
brouillon selon le transport du canal.

## Choisir un mode

`channels.<channel>.streaming.mode` contrôle le comportement visible en cours :

| Mode       | Idéal pour                               | Ce qui apparaît dans le chat                         |
| ---------- | ---------------------------------------- | ---------------------------------------------------- |
| `off`      | Canaux silencieux                        | Seulement la réponse finale.                         |
| `partial`  | Voir apparaître le texte de la réponse   | Un brouillon modifié avec le dernier texte de réponse. |
| `block`    | Morceaux d’aperçu de réponse plus grands | Un aperçu mis à jour ou ajouté par morceaux plus grands. |
| `progress` | Tours intensifs en outils ou longs       | Un brouillon d’état, puis la réponse finale.         |

Choisissez `progress` lorsque les utilisateurs se soucient davantage de « ce qui se passe » que de regarder
le texte de la réponse s’afficher jeton par jeton.

Choisissez `partial` lorsque la réponse elle-même est le signal de progression.

Choisissez `block` lorsque vous voulez des mises à jour d’aperçu du brouillon en morceaux de texte plus grands. Sur
Discord et Telegram, `streaming.mode: "block"` reste un streaming d’aperçu, pas
une livraison normale par blocs. Utilisez `streaming.block.enabled` ou l’ancien
`blockStreaming` lorsque vous voulez des réponses normales par blocs.

## Configurer les libellés

Les libellés de progression se trouvent sous `channels.<channel>.streaming.progress`.

Le libellé par défaut est `auto`, qui choisit dans le groupe de libellés
intégrés à OpenClaw, composés d’un seul mot suivi de points de suspension :

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

Utilisez votre propre groupe de libellés automatiques :

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

Les lignes de progression sont activées par défaut en mode progression. Elles proviennent de vrais événements
d’exécution : démarrages d’outils, mises à jour d’éléments, plans de tâches, approbations, sortie de commandes, résumés
de correctifs et activités d’agent similaires.

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

`"explain"` est la valeur par défaut et garde les brouillons stables avec des libellés concis comme
`🛠️ check JS syntax for /tmp/app.js`. `"raw"` ajoute la commande ou le détail sous-jacent
lorsqu’il est disponible, ce qui est utile pendant le débogage mais plus bruyant dans le
chat.

Par exemple, la même commande apparaît différemment selon le mode de détail :

| Mode      | Ligne de progression                                      |
| --------- | --------------------------------------------------------- |
| `explain` | `🛠️ check JS syntax for /tmp/app.js`                     |
| `raw`     | `🛠️ check JS syntax for /tmp/app.js, node --check /tmp/app.js` |

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

Les lignes de progression sont compactées automatiquement afin de réduire le réagencement des bulles de chat pendant que le brouillon est modifié.

OpenClaw tronque les longues lignes de progression par défaut afin que les modifications répétées du brouillon ne
retournent pas à la ligne différemment à chaque mise à jour. Le préfixe reste lisible, et les longs détails
comme les chemins ou les commandes brutes sont raccourcis avec des points de suspension.

Slack peut afficher les lignes de progression sous forme de champs Block Kit structurés au lieu d’un
seul corps de texte :

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

Le rendu enrichi conserve le même repli en texte brut afin que les canaux et clients qui
ne prennent pas en charge la forme plus riche puissent toujours afficher le texte de progression compact.

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

Avec `toolProgress: false`, OpenClaw supprime toujours les anciens messages autonomes
de progression des outils pour ce tour. Le canal reste visuellement silencieux jusqu’à la
réponse finale, sauf pour le libellé si l’un est configuré.

## Comportement des canaux

Chaque canal utilise le transport le plus propre qu’il prend en charge :

| Canal           | Transport de progression                  | Notes                                                                 |
| --------------- | ----------------------------------------- | --------------------------------------------------------------------- |
| Discord         | Envoyer un message, puis le modifier.     | Le texte final est modifié en place lorsqu’il tient dans un message d’aperçu sûr. |
| Matrix          | Envoyer un événement, puis le modifier.   | La configuration de streaming au niveau du compte contrôle les brouillons au niveau du compte. |
| Microsoft Teams | Stream Teams natif dans les chats personnels. | `streaming.mode: "block"` correspond à la livraison par blocs Teams. |
| Slack           | Stream natif ou publication de brouillon modifiable. | La disponibilité du fil affecte la possibilité d’utiliser le streaming natif. |
| Telegram        | Envoyer un message, puis le modifier.     | Les anciens brouillons visibles peuvent être remplacés afin que les horodatages finaux restent utiles. |
| Mattermost      | Publication de brouillon modifiable.      | L’activité des outils est intégrée à la même publication de style brouillon. |

Les canaux sans prise en charge sûre de la modification reviennent généralement aux indicateurs de saisie ou
à une livraison uniquement finale.

## Finalisation

Lorsque la réponse finale est prête, OpenClaw tente de garder le chat propre :

- Si le brouillon peut devenir la réponse finale en toute sécurité, OpenClaw le modifie en place.
- Si le canal utilise un streaming de progression natif, OpenClaw finalise ce stream
  lorsque le transport natif accepte le texte final.
- Si la réponse finale contient un média, une invite d’approbation, une cible de réponse explicite,
  trop de morceaux, ou un échec de modification/envoi, OpenClaw envoie la réponse finale via
  le chemin de livraison normal du canal.

Le chemin de repli est intentionnel. Il vaut mieux envoyer une nouvelle réponse finale que
perdre du texte, mal rattacher une réponse à un fil, ou écraser un brouillon avec une charge utile que le canal
ne peut pas représenter en toute sécurité.

## Dépannage

**Je vois seulement la réponse finale.**

Vérifiez que `channels.<channel>.streaming.mode` est défini sur `progress` pour le
compte ou le canal qui a traité le message. Certains chemins de groupe ou de réponse avec citation peuvent
désactiver les aperçus de brouillon pour un tour lorsque le canal ne peut pas modifier en toute sécurité le bon
message.

**Je vois le libellé, mais pas les lignes d’outils.**

Vérifiez `streaming.progress.toolProgress`. S’il vaut `false`, OpenClaw conserve le
comportement de brouillon unique mais masque les lignes de progression d’outils et de tâches.

**Je vois un nouveau message final au lieu d’un brouillon modifié.**

C’est un repli de sécurité. Cela peut arriver pour les réponses avec médias, les réponses longues,
les cibles de réponse explicites, les anciens brouillons Telegram, les cibles de fil Slack manquantes,
les messages d’aperçu supprimés, ou l’échec de finalisation d’un stream natif.

**Je vois encore des messages de progression autonomes.**

Le mode progression supprime les messages autonomes de progression des outils par défaut lorsqu’un brouillon
est actif. Si des messages autonomes apparaissent encore, vérifiez que le tour utilise réellement
le mode progression et non `streaming.mode: "off"` ou un chemin de canal qui
ne peut pas créer de brouillon pour ce message.

**Teams se comporte différemment de Discord ou Telegram.**

Microsoft Teams utilise un stream natif dans les chats personnels au lieu du transport d’aperçu générique
par envoi puis modification. Teams traite aussi `streaming.mode: "block"` comme
une livraison par blocs Teams, car il ne dispose pas du même mode de blocs d’aperçu de brouillon
utilisé par Discord et Telegram.

## Connexe

- [Streaming et découpage](/fr/concepts/streaming)
- [Messages](/fr/concepts/messages)
- [Configuration des canaux](/fr/gateway/config-channels)
- [Discord](/fr/channels/discord)
- [Matrix](/fr/channels/matrix)
- [Microsoft Teams](/fr/channels/msteams)
- [Slack](/fr/channels/slack)
- [Telegram](/fr/channels/telegram)
