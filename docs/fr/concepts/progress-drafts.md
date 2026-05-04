---
read_when:
    - Configuration des mises à jour de progression visibles pour les tours de conversation de longue durée
    - Choisir entre les modes de diffusion partielle, par bloc et de progression
    - Explication de la manière dont OpenClaw met à jour un message de canal pendant que le travail est en cours
    - Résolution des problèmes liés aux brouillons de progression, aux messages de progression autonomes ou à la solution de repli de finalisation
summary: 'Brouillons de progression : un message visible de travail en cours qui se met à jour pendant l’exécution d’un agent'
title: Avancer les brouillons
x-i18n:
    generated_at: "2026-05-04T07:04:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: f78c07866cd7f613012a80a40413e5866c1dd2edd477088f9fc141347f5f3788
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Les brouillons de progression donnent de la vie aux tours d’agent longs dans le chat sans transformer
la conversation en pile de réponses d’état temporaires.

Lorsque les brouillons de progression sont activés, OpenClaw crée un seul message visible
de travail en cours seulement une fois que le tour prouve qu’il effectue un vrai travail,
le met à jour pendant que l’agent lit, planifie, appelle des outils ou attend une approbation,
puis transforme ce brouillon en réponse finale lorsque le canal peut le faire en toute sécurité.

```text
Shelling...
📖 Read: from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Exec: run tests
```

Utilisez les brouillons de progression lorsque vous voulez un seul message d’état bien rangé
pendant un travail intensif en outils, puis la réponse finale une fois le tour terminé.

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

C’est généralement suffisant. OpenClaw choisira automatiquement un libellé d’un mot,
attendra que le travail dure au moins cinq secondes ou émette un second événement de travail,
ajoutera des lignes de progression compactes pendant que du travail utile a lieu,
et supprimera les messages de progression autonomes en double pour ce tour.

## Ce que voient les utilisateurs

Un brouillon de progression comporte deux parties :

| Partie                | Objectif                                                                            |
| --------------------- | ----------------------------------------------------------------------------------- |
| Libellé               | Un court titre comme `Thinking...` ou `Shelling...`.                                |
| Lignes de progression | Des mises à jour d’exécution compactes utilisant les mêmes libellés et icônes d’outils que la sortie détaillée. |

Le libellé apparaît lorsque l’agent commence un travail significatif et reste occupé
pendant cinq secondes ou émet un second événement de travail. Les réponses en texte seul
n’affichent pas de brouillon de progression. Les lignes de progression ne sont ajoutées
que lorsque l’agent émet des mises à jour de travail utiles, par exemple `🛠️ Exec`,
`🔎 Web Search` ou `✍️ Write: to /tmp/file`.
Par défaut, elles utilisent le même mode d’explication compact que `/verbose` ; définissez
`agents.defaults.toolProgressDetail: "raw"` lors du débogage si vous voulez aussi ajouter
les commandes/détails bruts.
La réponse finale remplace le brouillon lorsque c’est possible ; sinon
OpenClaw envoie la réponse finale normalement et nettoie le brouillon ou arrête de le mettre
à jour selon le transport du canal.

## Choisir un mode

`channels.<channel>.streaming.mode` contrôle le comportement visible en cours :

| Mode       | Idéal pour                                  | Ce qui apparaît dans le chat                         |
| ---------- | ------------------------------------------ | ---------------------------------------------------- |
| `off`      | Canaux silencieux                          | Uniquement la réponse finale.                        |
| `partial`  | Regarder le texte de réponse apparaître    | Un brouillon modifié avec le dernier texte de réponse. |
| `block`    | Morceaux d’aperçu de réponse plus grands   | Un aperçu mis à jour ou ajouté par gros morceaux.    |
| `progress` | Tours longs ou avec beaucoup d’outils      | Un brouillon d’état, puis la réponse finale.         |

Choisissez `progress` lorsque les utilisateurs se soucient davantage de « ce qui se passe »
que de voir le texte de la réponse défiler jeton par jeton.

Choisissez `partial` lorsque la réponse elle-même est le signal de progression.

Choisissez `block` lorsque vous voulez des mises à jour d’aperçu du brouillon en morceaux
de texte plus grands. Sur Discord et Telegram, `streaming.mode: "block"` reste une diffusion
d’aperçu, pas une livraison normale par blocs. Utilisez `streaming.block.enabled` ou l’ancien
`blockStreaming` lorsque vous voulez des réponses normales par blocs.

## Configurer les libellés

Les libellés de progression se trouvent sous `channels.<channel>.streaming.progress`.

Le libellé par défaut est `auto`, qui choisit dans le groupe intégré de libellés
OpenClaw d’un seul mot avec points de suspension :

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

Masquez le libellé et affichez uniquement les lignes de progression :

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

Les lignes de progression sont activées par défaut en mode progression. Elles proviennent
d’événements d’exécution réels : démarrages d’outils, mises à jour d’éléments, plans de tâche,
approbations, sortie de commande, résumés de correctifs et activité d’agent similaire.

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

`"explain"` est la valeur par défaut et garde les brouillons stables avec des libellés concis
comme `🛠️ Exec: check JS syntax for /tmp/app.js`. `"raw"` ajoute la commande ou le détail
sous-jacent lorsqu’il est disponible, ce qui est utile pendant le débogage mais plus bruyant
dans le chat.

Par exemple, la même commande apparaît différemment selon le mode de détail :

| Mode      | Ligne de progression                                              |
| --------- | ----------------------------------------------------------------- |
| `explain` | `🛠️ Exec: check JS syntax for /tmp/app.js`                        |
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

Les lignes de progression sont compactées automatiquement afin de réduire les redispositions
des bulles de chat pendant la modification du brouillon.

OpenClaw tronque par défaut les longues lignes de progression afin que les modifications
répétées du brouillon ne passent pas à la ligne différemment à chaque mise à jour. Le préfixe
reste lisible, et les longs détails comme les chemins ou les commandes brutes sont raccourcis
avec des points de suspension.

Slack peut rendre les lignes de progression sous forme de champs Block Kit structurés au lieu
d’un seul corps de texte :

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

Le rendu riche conserve le même repli en texte brut afin que les canaux et clients qui ne
prennent pas en charge la forme plus riche puissent tout de même afficher le texte de progression
compact.

Conservez le brouillon de progression unique mais masquez les lignes d’outils et de tâches :

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

Avec `toolProgress: false`, OpenClaw supprime toujours les anciens messages autonomes de
progression des outils pour ce tour. Le canal reste visuellement silencieux jusqu’à la réponse
finale, sauf pour le libellé si l’un est configuré.

## Comportement des canaux

Chaque canal utilise le transport le plus propre qu’il prend en charge :

| Canal           | Transport de progression                  | Notes                                                                  |
| --------------- | ----------------------------------------- | ---------------------------------------------------------------------- |
| Discord         | Envoyer un message, puis le modifier.     | Le texte final est modifié sur place lorsqu’il tient dans un message d’aperçu sûr. |
| Matrix          | Envoyer un événement, puis le modifier.   | La configuration de streaming au niveau du compte contrôle les brouillons au niveau du compte. |
| Microsoft Teams | Flux Teams natif dans les conversations personnelles. | `streaming.mode: "block"` correspond à la livraison par blocs Teams. |
| Slack           | Flux natif ou publication de brouillon modifiable. | La disponibilité du fil affecte la possibilité d’utiliser le streaming natif. |
| Telegram        | Envoyer un message, puis le modifier.     | Les anciens brouillons visibles peuvent être remplacés pour que les horodatages finaux restent utiles. |
| Mattermost      | Publication de brouillon modifiable.      | L’activité des outils est intégrée à la même publication de style brouillon. |

Les canaux sans prise en charge sûre de la modification se replient généralement sur les
indicateurs de saisie ou la livraison finale uniquement.

## Finalisation

Lorsque la réponse finale est prête, OpenClaw tente de garder le chat propre :

- Si le brouillon peut devenir la réponse finale en toute sécurité, OpenClaw le modifie sur place.
- Si le canal utilise un streaming de progression natif, OpenClaw finalise ce flux
  lorsque le transport natif accepte le texte final.
- Si la réponse finale contient des médias, une demande d’approbation, une cible de réponse explicite,
  trop de morceaux, ou un échec de modification/envoi, OpenClaw envoie la réponse finale via
  le chemin normal de livraison du canal.

Le chemin de repli est intentionnel. Il vaut mieux envoyer une nouvelle réponse finale que
perdre du texte, envoyer une réponse dans le mauvais fil ou remplacer un brouillon par une charge utile
que le canal ne peut pas représenter en toute sécurité.

## Dépannage

**Je ne vois que la réponse finale.**

Vérifiez que `channels.<channel>.streaming.mode` est défini sur `progress` pour le compte
ou le canal qui a traité le message. Certains chemins de groupe ou de réponse avec citation
peuvent désactiver les aperçus de brouillon pour un tour lorsque le canal ne peut pas modifier
en toute sécurité le bon message.

**Je vois le libellé mais aucune ligne d’outil.**

Vérifiez `streaming.progress.toolProgress`. S’il vaut `false`, OpenClaw conserve le
comportement de brouillon unique mais masque les lignes de progression des outils et des tâches.

**Je vois un nouveau message final au lieu d’un brouillon modifié.**

Il s’agit d’un repli de sécurité. Cela peut se produire pour les réponses avec médias,
les longues réponses, les cibles de réponse explicites, les anciens brouillons Telegram,
les cibles de fil Slack manquantes, les messages d’aperçu supprimés ou l’échec de finalisation
d’un flux natif.

**Je vois encore des messages de progression autonomes.**

Le mode progression supprime les messages de progression d’outils autonomes par défaut lorsqu’un
brouillon est actif. Si des messages autonomes apparaissent encore, vérifiez que le tour utilise
bien le mode progression et non `streaming.mode: "off"` ou un chemin de canal qui ne peut pas
créer de brouillon pour ce message.

**Teams se comporte différemment de Discord ou Telegram.**

Microsoft Teams utilise un flux natif dans les conversations personnelles au lieu du transport
générique d’aperçu par envoi puis modification. Teams traite également `streaming.mode: "block"`
comme une livraison par blocs Teams, car il ne dispose pas du même mode de blocs d’aperçu de brouillon
utilisé par Discord et Telegram.

## Articles connexes

- [Streaming et découpage](/fr/concepts/streaming)
- [Messages](/fr/concepts/messages)
- [Configuration des canaux](/fr/gateway/config-channels)
- [Discord](/fr/channels/discord)
- [Matrix](/fr/channels/matrix)
- [Microsoft Teams](/fr/channels/msteams)
- [Slack](/fr/channels/slack)
- [Telegram](/fr/channels/telegram)
