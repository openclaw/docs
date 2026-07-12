---
read_when:
    - Configuration des mises à jour de progression visibles pour les échanges de chat de longue durée
    - Choisir entre les modes de streaming partiel, par blocs et de progression
    - Expliquer comment OpenClaw met à jour un message de canal pendant l’exécution d’une tâche
    - Brouillons de progression du dépannage, messages de progression autonomes ou solution de repli pour la finalisation
summary: 'Brouillons de progression : un message de travail en cours visible qui se met à jour pendant l’exécution d’un agent'
title: Brouillons en cours
x-i18n:
    generated_at: "2026-07-12T21:41:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4f937a61dfa360ac1d6c67e1a05e5ac698af563f2b58624d6de4e69a7f904cdd
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Les brouillons de progression transforment un message de canal en une ligne d’état actualisée pendant qu’un
agent travaille, au lieu d’une série de réponses temporaires « travail toujours en cours ». Définissez
`channels.<channel>.streaming.mode: "progress"` et OpenClaw crée le
message dès que le travail réel commence, le modifie à mesure que l’agent lit, planifie, appelle des
outils ou attend une approbation, puis le transforme en réponse finale.

```text
Exécution dans le shell...
📖 depuis docs/concepts/progress-drafts.md
🔎 Recherche Web : pour « discord edit message »
🛠️ Bash : exécuter les tests
```

<Note>
  Discord utilise déjà `streaming.mode: "progress"` par défaut lorsque
  `channels.discord.streaming` n’est pas défini ; les brouillons de progression
  y apparaissent donc sans aucune configuration. Tous les autres canaux utilisent par défaut `partial`
  ou `off` ; consultez [Diffusion et découpage](/fr/concepts/streaming#channel-mapping)
  pour obtenir le tableau complet des valeurs par défaut de chaque canal.
</Note>

## Démarrage rapide

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

Valeurs par défaut à partir d’ici : un délai de démarrage de 5 secondes (ou immédiatement lors d’un deuxième événement de
travail), des lignes de progression compactes pendant l’exécution d’un travail utile et la suppression des
anciens messages de progression autonomes pour cette interaction. Les brouillons de lignes d’outil brutes utilisent
automatiquement un libellé d’un seul mot ; l’état narratif omet ce titre redondant, sauf si
vous en configurez explicitement un.

Cette page décrit l’expérience des brouillons de progression et ses options de configuration. Pour
la matrice complète des modes de diffusion, les remarques d’exécution propres à chaque canal et la migration des
anciennes clés, consultez [Diffusion et découpage](/fr/concepts/streaming).

## Ce que voient les utilisateurs

| Partie                | Objectif                                                                                                 |
| --------------------- | -------------------------------------------------------------------------------------------------------- |
| Libellé               | Ligne initiale/d’état facultative, telle que `Working` ou `Shelling`.                                    |
| Lignes de progression | Mises à jour compactes de l’exécution utilisant les mêmes icônes d’outil et le même formateur que `/verbose`. |

Pour la progression brute des outils, le libellé apparaît lorsque l’agent commence un travail significatif
et reste occupé pendant le délai initial, ou qu’un deuxième événement de travail se déclenche immédiatement.
Il se trouve en haut de la liste déroulante des lignes de progression et disparaît donc du défilement dès
qu’un nombre suffisant de lignes de travail concrètes apparaît. La progression narrative affiche uniquement
l’état en langage naturel de l’agent, sauf si un libellé est configuré explicitement. Les réponses composées
uniquement de texte brut n’affichent jamais de brouillon de progression ; une ligne apparaît seulement pour les mises à jour
d’un travail réel, par exemple `🛠️ Bash: run tests`, `🔎 Web Search: for "discord edit message"`,
ou `✍️ Write: to /tmp/file`.

La réponse finale remplace le brouillon sur place lorsque le canal peut le faire en toute sécurité ;
sinon, OpenClaw envoie la réponse finale par le mécanisme de livraison normal et
nettoie le brouillon ou cesse de le mettre à jour (consultez [Finalisation](#finalization)).

## Choisir un mode

`channels.<channel>.streaming.mode` contrôle le comportement visible pendant le traitement :

| Mode       | Idéal pour                                      | Ce qui apparaît dans la discussion                                   |
| ---------- | ----------------------------------------------- | -------------------------------------------------------------------- |
| `off`      | Canaux silencieux                               | Uniquement la réponse finale.                                        |
| `partial`  | Observer l’apparition du texte de la réponse    | Un brouillon modifié avec le texte le plus récent de la réponse.      |
| `block`    | Grands segments d’aperçu de la réponse          | Un aperçu mis à jour ou complété par des segments plus volumineux.    |
| `progress` | Interactions longues ou utilisant beaucoup d’outils | Un brouillon d’état, puis la réponse finale.                       |

Choisissez `progress` lorsque les utilisateurs accordent davantage d’importance à « ce qui se passe » qu’à l’affichage
du texte de la réponse jeton par jeton ; `partial` lorsque le texte de la réponse lui-même
constitue le signal de progression ; `block` pour de plus grands segments d’aperçu. Sur Discord et
Telegram, `streaming.mode: "block"` reste une diffusion d’aperçu, et non une livraison normale
de réponses par blocs — utilisez `streaming.block.enabled` pour cette dernière.

## Configurer les libellés

Les libellés de progression se trouvent sous `channels.<channel>.streaming.progress`. Le libellé par défaut
des lignes d’outil brutes est `"auto"`, qui effectue une sélection dans la liste intégrée de
libellés d’un seul mot d’OpenClaw. La progression narrative masque ce libellé implicite ; définissez
explicitement `label: "auto"` si vous souhaitez également l’afficher au-dessus de la narration :

```text
Travail, Shell, Déplacement, Griffes, Pincement, Mue, Bouillonnement, Marée,
Récif, Craquement, Tamisage, Saumurage, Nautile, Krill, Balane,
Homard, Bassin de marée, Perle, Claquement, Émergence
```

Utilisez un libellé fixe :

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "Investigation",
        },
      },
    },
  },
}
```

Utilisez votre propre liste de libellés (la sélection reste aléatoire/basée sur une graine lorsque `label: "auto"`) :

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          labels: ["Vérification", "Lecture", "Test", "Finalisation"],
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

Les lignes de progression proviennent d’événements d’exécution réels : démarrage d’outils, mises à jour d’éléments, plans de
tâches, approbations, sortie de commandes, résumés de correctifs et activités similaires de l’agent.
Elles sont activées par défaut (`progress.toolProgress`, valeur par défaut `true`).

Les outils peuvent également émettre une progression typée pendant qu’un appel unique est toujours en cours. C’est
ainsi qu’une récupération ou une recherche lente met à jour le brouillon visible avant que l’outil
ne renvoie son résultat final. La mise à jour de progression est un résultat partiel de l’outil, avec
un contenu de modèle vide et des métadonnées explicites pour le canal public :

```json
{
  "content": [],
  "progress": {
    "text": "Récupération du contenu de la page...",
    "visibility": "channel",
    "privacy": "public",
    "id": "web_fetch:fetching"
  }
}
```

OpenClaw affiche uniquement `progress.text` dans l’interface de progression du canal. Le résultat normal
de l’outil arrive toujours ultérieurement sous la forme `content`/`details` et constitue la seule partie
renvoyée au modèle.

Lorsque vous ajoutez une progression à un outil, émettez un message court et générique, puis retardez-le
jusqu’à ce que l’opération soit en attente depuis assez longtemps pour qu’il soit utile. `web_fetch`
procède exactement ainsi avec un délai de 5 secondes :

```typescript
const clearProgressTimer = scheduleToolProgress(
  onUpdate,
  { text: "Récupération du contenu de la page...", id: "web_fetch:fetching" },
  5_000,
  { signal },
);

try {
  return await runToolWork();
} finally {
  clearProgressTimer();
}
```

Les appels rapides n’affichent aucune ligne de progression ; les appels longs en affichent une tant qu’ils sont en attente ;
les appels annulés effacent le minuteur avant qu’une progression obsolète ne puisse apparaître. Le texte de progression
est un canal auxiliaire public de l’interface utilisateur ; il ne doit donc jamais inclure de secrets, d’arguments bruts,
de contenu récupéré, de sortie de commande ni de texte de page.

### Mode détaillé

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

`"explain"` est le mode par défaut et préserve la stabilité des brouillons grâce à des libellés concis.
`"raw"` ajoute la commande sous-jacente lorsqu’elle est disponible, ce qui est utile pour le
débogage, mais plus verbeux dans la conversation. Par exemple, un appel à `node --check /tmp/app.js`
s’affiche différemment selon le mode :

| Mode      | Ligne de progression                                            |
| --------- | --------------------------------------------------------------- |
| `explain` | `🛠️ check js syntax for /tmp/app.js`                            |
| `raw`     | `🛠️ check js syntax for /tmp/app.js · node --check /tmp/app.js` |

### Texte de commande/d’exécution

`streaming.progress.commandText` (valeur par défaut : `"raw"`) détermine le niveau de détail des commandes
affiché à côté des lignes de progression exec/bash, indépendamment du mode de détail
ci-dessus. Définissez-le sur `"status"` pour conserver une ligne de progression de l’outil visible tout en masquant
entièrement le texte de la commande :

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          commandText: "status",
        },
      },
    },
  },
}
```

### Canal de commentaires

`streaming.progress.commentary` (valeur par défaut : `false`) intercale les
commentaires et préambules narratifs du modèle précédant l'utilisation des outils
(💬, par exemple « Je vais vérifier... puis... ») avec les lignes d'outils dans le
brouillon. Consultez
[Diffusion en continu et segmentation](/fr/concepts/streaming#commentary-progress-lane)
pour connaître la structure de configuration commune à tous les canaux.

### État narratif

Lorsqu'un modèle utilitaire est résolu pour l'agent — soit un
[`utilityModel`](/fr/gateway/config-agents#utilitymodel) explicite, soit le petit
modèle par défaut déclaré par le fournisseur principal (OpenAI → `gpt-5.6-luna`,
Anthropic → `claude-haiku-4-5`) —, le brouillon de progression remplace les lignes
d'outils défilantes par une courte description en langage naturel de ce que fait
l'agent, rédigée par ce modèle moins coûteux et actualisée à mesure que le travail
avance :

```text
Mise à jour du modèle par défaut dans votre configuration, puis redémarrage du Gateway
pour appliquer la modification. Un appel de liste d'agents a échoué et fait l'objet
d'une nouvelle tentative.
```

La narration est activée par défaut (`streaming.progress.narration`, valeur par
défaut : `true`) et ne se rabat jamais sur le modèle principal : elle s'exécute
uniquement avec un `utilityModel` explicite ou un modèle par défaut déclaré par le
fournisseur principal de l'agent. Définissez `utilityModel: ""` pour désactiver
entièrement le routage utilitaire. Les lignes d'outils continuent de s'accumuler
en dessous et réapparaissent si la narration s'arrête. Le brouillon n'est modifié
qu'après le seuil d'activité normal et lorsque le texte de la narration change
réellement, ce qui évite les clignotements lors des tours rapides et réduit la
fréquence des modifications dans les canaux très actifs. Désactivez cette option
pour conserver les lignes d'outils brutes :

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          narration: false,
        },
      },
    },
  },
}
```

L’entrée de narration est limitée et expurgée : le modèle utilitaire reçoit le
texte de la requête entrante ainsi que les mêmes résumés d’outils compacts et
expurgés que le brouillon afficherait — jamais la sortie brute des commandes ni
les résultats des outils. Avec `commandText: "status"`, l’entrée de narration
omet également le texte des commandes exec/bash, conformément à ce qu’affiche
le brouillon.

### Limites de lignes

Limitez le nombre de lignes qui restent visibles (8 par défaut) :

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

Les lignes de progression sont automatiquement condensées afin de réduire la
redisposition des bulles de discussion pendant la modification du brouillon,
et OpenClaw tronque les lignes longues afin que les modifications répétées du
brouillon ne provoquent pas des retours à la ligne différents à chaque mise à
jour. La limite par défaut est de 120 caractères par ligne ; le texte est coupé
à la frontière d’un mot, tandis que les détails longs, tels que les chemins ou
les commandes brutes, sont raccourcis au moyen de points de suspension au
milieu afin que le suffixe reste visible.

Ajustez la limite par ligne :

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          maxLineChars: 160,
        },
      },
    },
  },
}
```

### Rendu enrichi (Slack)

Slack peut afficher les lignes de progression sous forme de champs Block Kit
structurés plutôt que sous forme de texte brut :

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

Le rendu enrichi envoie toujours le même corps en texte brut avec les champs
Block Kit, afin que les clients qui ne peuvent pas afficher la structure
enrichie présentent tout de même le texte de progression compact.

### Masquer les lignes d’outils et de tâches

Conservez le brouillon de progression unique, mais masquez les lignes d’outils
et de tâches :

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
autonomes de progression des outils pour cette interaction — le canal reste
visuellement silencieux jusqu’à la réponse finale, à l’exception du libellé si
l’un d’eux est configuré.

## Comportement du canal

| Canal           | Transport de la progression                            | Remarques                                                                                                                                                                                                 |
| --------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Envoie un message, puis le modifie.                    | Utilise par défaut le mode `progress` ; la réponse finale comporte un reçu d’activité `-#` et le brouillon d’état est supprimé après l’envoi de la réponse.                                                |
| Matrix          | Envoie un événement, puis le modifie.                  | La configuration du streaming au niveau du compte contrôle les brouillons au niveau du compte.                                                                                                            |
| Microsoft Teams | Flux Teams natif dans les conversations personnelles. | `streaming.mode: "block"` correspond à la place à une livraison Teams par blocs.                                                                                                                          |
| Slack           | Flux natif ou publication de brouillon modifiable.     | Nécessite une cible de fil de réponses ; les messages privés de premier niveau qui n’en ont pas bénéficient tout de même de publications d’aperçu du brouillon et de modifications.                       |
| Telegram        | Envoie un message, puis le modifie.                    | Si un message arrive entre le brouillon de progression et la réponse, le brouillon est republié en dessous (publication du nouveau, puis suppression de l’ancien) au lieu de provoquer un saut de défilement dans le client. |
| Mattermost      | Publication de brouillon modifiable.                   | Le mode `block` alterne entre les publications de texte terminé et celles d’activité des outils ; les autres modes intègrent l’activité des outils à la même publication de type brouillon.               |

Les canaux dépourvus d’une prise en charge sûre des modifications utilisent à la place des indicateurs de saisie ou une livraison limitée à la réponse finale. Consultez [Streaming et segmentation](/fr/concepts/streaming) pour obtenir la présentation complète du comportement d’exécution pour chaque canal.

## Finalisation

Lorsque la réponse finale est prête, OpenClaw tente de garder la conversation claire :

- En mode `progress` sur Discord, la réponse finale est envoyée dans un nouveau message
  auquel est ajouté un petit accusé d’activité `-#` (par exemple
  `-# 🧠 2 thoughts · 🛠️ 5 tool calls · ⏱️ 12s`), et le brouillon de statut est
  supprimé une fois cette réponse remise. Les canaux actifs ne conservent aucun journal
  d’outil orphelin au-dessus de la réponse ; en cas d’erreur finale, le brouillon reste visible comme trace de
  l’échec de l’interaction.
- Si le brouillon peut devenir la réponse finale en toute sécurité (modes `partial`/`block`),
  OpenClaw le modifie sur place.
- Si le canal utilise nativement la diffusion en continu de la progression, OpenClaw finalise ce
  flux lorsque le transport natif accepte le texte final.
- Sinon (média, demande d’approbation, cible de réponse explicite, nombre excessif de
  segments ou échec de modification/d’envoi), OpenClaw envoie la réponse finale via le
  chemin normal de remise du canal au lieu d’écraser le brouillon.

Le mécanisme de repli est intentionnel : mieux vaut envoyer une nouvelle réponse finale que perdre du texte,
associer une réponse au mauvais fil de discussion ou écraser un brouillon avec une charge utile que le canal
ne peut pas représenter de manière sûre.

## Dépannage

**Je ne vois que la réponse finale.**

Vérifiez que `channels.<channel>.streaming.mode` est défini sur `progress` pour le compte
ou le canal qui a traité le message. Certains parcours de groupe ou de réponse avec citation désactivent
les aperçus des brouillons pour un tour lorsque le canal ne peut pas modifier de manière fiable le bon
message.

**Je vois le libellé, mais aucune ligne d’outil.**

Vérifiez `streaming.progress.toolProgress`. Si sa valeur est `false`, OpenClaw conserve le
comportement avec un brouillon unique, mais masque les lignes de progression des outils et des tâches.

**Je vois un nouveau message final au lieu d’un brouillon modifié.**

Il s’agit du mécanisme de secours décrit dans la section [Finalisation](#finalization). Cela peut
se produire pour les réponses contenant des médias, les réponses longues, les cibles de réponse explicites, les anciens
brouillons Telegram, les cibles de fil Slack manquantes, les messages d’aperçu supprimés ou l’échec de
la finalisation du flux natif.

**Je vois encore des messages de progression autonomes.**

Le mode de progression supprime les messages autonomes par défaut concernant la progression des outils lorsqu’un
brouillon est actif. Si des messages autonomes apparaissent encore, vérifiez que l’interaction utilise
effectivement le mode `progress`, et non `streaming.mode: "off"` ou un chemin de
canal qui ne peut pas créer de brouillon pour ce message.

**Teams se comporte différemment de Discord ou Telegram.**

Microsoft Teams utilise un flux natif dans les conversations personnelles au lieu du transport générique
d’aperçu avec envoi et modification, et associe `streaming.mode: "block"` à la
livraison par blocs de Teams, car il ne dispose pas d’un mode de blocs d’aperçu de brouillon comme Discord et
Telegram.

## Voir aussi

- [Diffusion en continu et découpage](/fr/concepts/streaming)
- [Messages](/fr/concepts/messages)
- [Configuration des canaux](/fr/gateway/config-channels)
- [Discord](/fr/channels/discord)
- [Matrix](/fr/channels/matrix)
- [Microsoft Teams](/fr/channels/msteams)
- [Slack](/fr/channels/slack)
- [Telegram](/fr/channels/telegram)
- [Mattermost](/fr/channels/mattermost)
