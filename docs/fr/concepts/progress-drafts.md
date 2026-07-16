---
read_when:
    - Configuration des mises à jour de progression visibles pour les échanges de chat de longue durée
    - Choisir entre les modes de diffusion partielle, par bloc et de progression
    - Expliquer comment OpenClaw met à jour un message de canal pendant le traitement en cours
    - Brouillons de progression du dépannage, messages de progression autonomes ou solution de secours pour la finalisation
summary: 'Brouillons de progression : un message visible de travail en cours qui se met à jour pendant l’exécution d’un agent'
title: Brouillons en cours
x-i18n:
    generated_at: "2026-07-16T13:16:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4ef66dd4d7a31c753f5faa0b88b83ec3760beecf3118cf8aae84f5e57652e809
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Les brouillons de progression transforment un message de canal en ligne d’état dynamique pendant que l’agent travaille, au lieu d’empiler des réponses temporaires « toujours en cours ». Définissez
`channels.<channel>.streaming.mode: "progress"` et OpenClaw crée le
message dès que le travail réel commence, le modifie à mesure que l’agent lit, planifie, appelle
des outils ou attend une approbation, puis le transforme en réponse finale.

```text
Travail en cours...
📖 depuis docs/concepts/progress-drafts.md
🔎 Recherche Web : pour « modifier un message Discord »
🛠️ Bash : exécuter les tests
```

<Note>
  Discord utilise déjà `streaming.mode: "progress"` par défaut lorsque
  `channels.discord.streaming` n’est pas défini ; les brouillons de progression
  y apparaissent donc sans aucune configuration. Tous les autres canaux utilisent par défaut `partial`
  ou `off` ; consultez [Diffusion en continu et segmentation](/fr/concepts/streaming#channel-mapping)
  pour le tableau complet des valeurs par défaut de chaque canal.
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

Valeurs par défaut à partir d’ici : un délai initial de 5 secondes, des lignes de progression compactes pendant
l’exécution de tâches utiles et la suppression des anciens messages de progression autonomes
pour ce tour. Les brouillons de lignes d’outil brutes utilisent
une étiquette automatique d’un seul mot ; un titre d’état omet ce titre redondant,
sauf si vous en configurez un explicitement.

Cette page décrit l’expérience des brouillons de progression et ses options de configuration. Pour
la matrice complète des modes de diffusion en continu, les remarques d’exécution propres à chaque canal et la migration
des anciennes clés, consultez [Diffusion en continu et segmentation](/fr/concepts/streaming).

## Ce que voient les utilisateurs

| Partie          | Objectif                                                                           |
| --------------- | ---------------------------------------------------------------------------------- |
| Titre d’état    | Sur Discord et Telegram, le préambule du modèle ; Discord ajoute un texte utilitaire temporaire. |
| Étiquette       | Ligne initiale/d’état facultative telle que `Working`.                    |
| Lignes de progression | Mises à jour d’exécution compactes utilisant les mêmes icônes d’outil et le même formateur de détails que `/verbose`. |

Pour la progression brute des outils, l’étiquette apparaît lorsque l’agent commence un travail significatif
et reste actif pendant le délai initial.
Elle se trouve en haut de la liste déroulante des lignes de progression et disparaît donc du champ visible dès que
suffisamment de lignes de travail concrètes apparaissent. Un titre d’état affiche uniquement l’état
de l’agent en langage courant, sauf si une étiquette est configurée explicitement. Les réponses composées
uniquement de texte brut n’affichent jamais de brouillon de progression ; une ligne n’apparaît que pour de véritables mises à jour de travail,
par exemple `🛠️ Bash: run tests`, `🔎 Web Search: for "discord edit message"`
ou `✍️ Write: to /tmp/file`.

La réponse finale remplace le brouillon sur place lorsque le canal peut le faire
en toute sécurité ; sinon, OpenClaw envoie la réponse finale par le mécanisme de livraison normal et
nettoie le brouillon ou cesse de le mettre à jour (consultez [Finalisation](#finalization)).

## Choisir un mode

`channels.<channel>.streaming.mode` contrôle le comportement visible pendant l’exécution :

| Mode       | Idéal pour                        | Ce qui apparaît dans la discussion                 |
| ---------- | --------------------------------- | -------------------------------------------------- |
| `off` | Canaux silencieux                 | Uniquement la réponse finale.                      |
| `partial` | Voir apparaître le texte de la réponse | Un brouillon modifié avec le dernier texte de réponse. |
| `block` | Grands blocs d’aperçu de la réponse | Un aperçu mis à jour ou complété par blocs plus importants. |
| `progress` | Tours longs ou utilisant beaucoup d’outils | Un brouillon d’état, puis la réponse finale.       |

Choisissez `progress` lorsque les utilisateurs accordent plus d’importance à « ce qui se passe » qu’à l’affichage
du texte de la réponse jeton par jeton ; `partial` lorsque le texte de la réponse lui-même constitue
le signal de progression ; `block` pour de plus grands blocs d’aperçu. Sur Discord et
Telegram, `streaming.mode: "block"` reste une diffusion de l’aperçu, et non une livraison normale
de réponses par blocs — utilisez `streaming.block.enabled` pour cela.

## Configurer les étiquettes

Les étiquettes de progression se trouvent sous `channels.<channel>.streaming.progress`. L’étiquette par défaut
des lignes d’outil brutes est `"auto"`, qui utilise l’étiquette intégrée simple `Working`.
Un titre d’état masque cette étiquette implicite ; définissez
`label: "auto"` explicitement si vous souhaitez également afficher une étiquette au-dessus :

```text
Travail en cours
```

Utilisez une étiquette fixe :

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "Analyse en cours",
        },
      },
    },
  },
}
```

Utilisez votre propre ensemble d’étiquettes (toujours choisi aléatoirement/selon la graine lorsque `label: "auto"`) :

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          labels: ["Vérification", "Lecture", "Tests", "Finalisation"],
        },
      },
    },
  },
}
```

Masquez l’étiquette et affichez uniquement les lignes de progression :

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

Les lignes de progression proviennent d’événements d’exécution réels : démarrages d’outils, mises à jour d’éléments, plans de
tâches, approbations, sorties de commandes, résumés de correctifs et activités similaires de l’agent.
Elles sont activées par défaut (`progress.toolProgress`, valeur par défaut `true`).

Les outils peuvent également émettre une progression typée pendant qu’un appel unique est toujours en cours. C’est
ainsi qu’une récupération ou une recherche lente met à jour le brouillon visible avant que l’outil
ne renvoie son résultat final. La mise à jour de progression est un résultat d’outil partiel avec
un contenu de modèle vide et des métadonnées explicites de canal public :

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

OpenClaw affiche uniquement `progress.text` dans l’interface de progression du canal. Le résultat
normal de l’outil arrive toujours ultérieurement sous la forme `content`/`details` et constitue la seule partie
renvoyée au modèle.

Lorsque vous ajoutez une progression à un outil, émettez un message court et générique, puis retardez-le
jusqu’à ce que l’opération soit en attente depuis assez longtemps pour qu’il soit utile. `web_fetch`
fait exactement cela avec un délai de 5 secondes :

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
les appels annulés effacent le minuteur avant qu’une progression obsolète puisse apparaître. Le texte de progression
est un canal secondaire d’interface publique ; il ne doit donc jamais inclure de secrets, d’arguments bruts,
de contenu récupéré, de sortie de commande ou de texte de page.

### Mode de détail

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

`"explain"` est la valeur par défaut et maintient la stabilité des brouillons grâce à des étiquettes concises.
`"raw"` ajoute la commande sous-jacente lorsqu’elle est disponible, ce qui est utile pendant
le débogage, mais plus encombrant dans la discussion. Par exemple, un appel `node --check /tmp/app.js`
est affiché différemment selon le mode :

| Mode      | Ligne de progression                                            |
| --------- | --------------------------------------------------------------- |
| `explain` | `🛠️ check js syntax for /tmp/app.js`                                      |
| `raw` | `🛠️ check js syntax for /tmp/app.js · node --check /tmp/app.js`                                      |

### Texte de commande/d’exécution

`streaming.progress.commandText` (valeur par défaut `"raw"`) contrôle la quantité de détails de commande
affichée à côté des lignes de progression exec/bash, indépendamment du mode de détail
ci-dessus. Définissez-le sur `"status"` pour conserver une ligne de progression d’outil visible tout en masquant
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

### Voie de commentaires

`streaming.progress.commentary` (valeur par défaut `false`) intercale la narration
de commentaires/préambule du modèle avant l’utilisation des outils (💬, par exemple « Je vais vérifier... puis
... ») avec les lignes d’outil dans le brouillon. Consultez
[Diffusion en continu et segmentation](/fr/concepts/streaming#commentary-progress-lane) pour la
structure de configuration partagée entre les canaux.

Lorsque la voie de commentaires est activée, les préambules sont affichés uniquement sous forme de ces lignes 💬
intercalées ; le titre d’état ci-dessous reste à l’écart afin que la voie conserve sa
structure documentée.

### Titre d’état

Sur Discord et Telegram en mode progression, le préambule typé du modèle avant l’utilisation des outils
devient le titre d’état du brouillon lorsqu’il est disponible. Les autres
canaux en mode progression conservent leur comportement d’état existant. Le titre est activé
par défaut et ne contourne pas le seuil d’activité normal pour les tours courts ;
l’activation de `streaming.progress.commentary` transmet plutôt les préambules à la voie de
commentaires intercalés.

Sur Discord, lorsqu’un modèle utilitaire est résolu pour l’agent — un
[`utilityModel`](/fr/gateway/config-agents#utilitymodel) explicite ou la valeur par défaut
de petit modèle déclarée par le fournisseur principal (OpenAI → `gpt-5.6-luna`,
Anthropic → `claude-haiku-4-5`) — il fournit un court texte temporaire en langage courant
lorsque le modèle n’émet aucun préambule ou reste silencieux pendant environ 20 secondes
(le titre de Telegram repose aujourd’hui uniquement sur le préambule) :

```text
Mise à jour du modèle par défaut dans votre configuration, puis redémarrage du Gateway pour
la prendre en compte. Un appel de liste d’agents a échoué et fait l’objet d’une nouvelle tentative.
```

La narration utilitaire est activée par défaut (`streaming.progress.narration`, valeur par défaut
`true`) et ne se rabat jamais sur le modèle principal : elle s’exécute uniquement avec un
`utilityModel` explicite ou une valeur par défaut déclarée par le fournisseur principal
de l’agent. Définissez `utilityModel: ""` pour désactiver entièrement le routage utilitaire. Les lignes d’outil
continuent de s’accumuler en dessous et réapparaissent si les deux sources d’état s’arrêtent. Les modifications
du brouillon attendent toujours le seuil d’activité normal et un véritable
changement de texte, ce qui évite les apparitions fugaces lors des tours rapides et réduit les modifications répétées dans les canaux
très actifs. Définissez `narration: false` pour désactiver uniquement le texte temporaire du modèle utilitaire ; les titres
de préambule du modèle restent activés :

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
texte de la requête entrante ainsi que les mêmes résumés d’outils compacts et expurgés que le brouillon
afficherait — jamais la sortie brute des commandes ni les résultats des outils. Avec
`commandText: "status"`, l’entrée de narration omet également le texte des commandes exec/bash,
conformément à ce qu’affiche le brouillon.

### Limites de lignes

Limitez le nombre de lignes qui restent visibles (valeur par défaut : 8) :

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

Les lignes de progression sont automatiquement compactées afin de réduire le réagencement des bulles de discussion pendant
la modification du brouillon, et OpenClaw tronque les longues lignes afin que les modifications répétées du brouillon
ne produisent pas des retours à la ligne différents à chaque mise à jour. Le budget par ligne par défaut est de 120
caractères ; la prose est coupée à la limite d’un mot, tandis que les détails longs tels que les chemins ou
les commandes brutes sont raccourcis avec des points de suspension au milieu afin que le suffixe reste visible.

Ajustez le budget par ligne :

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

### Affichage enrichi (Slack)

Slack peut afficher les lignes de progression sous forme de champs Block Kit structurés plutôt que
de texte brut :

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

L’affichage enrichi envoie toujours le même corps en texte brut avec les champs Block Kit,
afin que les clients qui ne peuvent pas afficher la structure enrichie présentent tout de même le texte de
progression compact.

### Masquer les lignes d’outil/de tâche

Conservez le brouillon de progression unique, mais masquez les lignes d’outil et de tâche :

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
de progression des outils pour ce tour — le canal reste visuellement silencieux jusqu’à
la réponse finale, à l’exception du libellé si celui-ci est configuré.

## Comportement des canaux

| Canal           | Transport de la progression                      | Remarques                                                                                                                                                     |
| --------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Envoi d’un message, puis modification de celui-ci. | Utilise par défaut le mode `progress` ; la réponse finale comporte un reçu d’activité `-#` et le brouillon d’état est supprimé après l’arrivée de la réponse. |
| Matrix          | Envoi d’un événement, puis modification de celui-ci. | La configuration de diffusion en continu au niveau du compte contrôle les brouillons au niveau du compte.                                                     |
| Microsoft Teams | Flux Teams natif dans les conversations personnelles. | `streaming.mode: "block"` correspond plutôt à l’envoi par blocs de Teams.                                                                                           |
| Slack           | Flux natif ou publication de brouillon modifiable. | Nécessite une cible de fil de réponses ; les messages privés de premier niveau sans cible reçoivent tout de même des publications d’aperçu du brouillon et leurs modifications. |
| Telegram        | Envoi d’un message, puis modification de celui-ci. | Si un message arrive entre le brouillon de progression et la réponse, le brouillon est republié en dessous (publication du nouveau, puis suppression de l’ancien) au lieu de provoquer un saut de défilement dans le client. |
| Mattermost      | Publication de brouillon modifiable.              | Le mode `block` alterne entre les publications de texte terminé et celles d’activité des outils ; les autres modes intègrent l’activité des outils à la même publication de type brouillon. |

Les canaux qui ne prennent pas en charge la modification de façon sûre utilisent à la place les indicateurs de saisie ou
l’envoi de la réponse finale uniquement. Consultez [Diffusion en continu et segmentation](/fr/concepts/streaming) pour obtenir
la répartition complète du comportement d’exécution par canal.

## Finalisation

Lorsque la réponse finale est prête, OpenClaw tente de préserver la clarté de la conversation :

- En mode `progress` sur Discord, la réponse finale est envoyée sous forme de nouveau message
  auquel est ajouté un petit reçu d’activité `-#` (par exemple
  `-# 🧠 2 thoughts · 🛠️ 5 tool calls · ⏱️ 12s`), et le brouillon d’état est
  supprimé une fois cette réponse livrée. Dans les canaux très actifs, aucun journal d’outil orphelin ne reste
  au-dessus de la réponse ; en cas d’erreur finale, le brouillon est conservé comme trace visible du
  tour ayant échoué.
- Si le brouillon peut devenir la réponse finale de façon sûre (modes `partial`/`block`),
  OpenClaw le modifie sur place.
- Si le canal utilise une diffusion en continu native de la progression, OpenClaw finalise ce
  flux lorsque le transport natif accepte le texte final.
- Dans les autres cas (média, demande d’approbation, cible de réponse explicite, trop grand nombre de
  segments ou échec de modification/d’envoi), OpenClaw envoie la réponse finale par le
  chemin d’envoi normal du canal au lieu de remplacer le brouillon.

Ce mécanisme de repli est intentionnel : il est préférable d’envoyer une nouvelle réponse finale plutôt que de perdre du texte,
de rattacher incorrectement une réponse à un fil ou de remplacer un brouillon par une charge utile que le canal
ne peut pas représenter de façon sûre.

## Résolution des problèmes

**Je ne vois que la réponse finale.**

Vérifiez que `channels.<channel>.streaming.mode` est défini sur `progress` pour le compte
ou le canal qui a traité le message. Certains chemins de groupe ou de réponse avec citation désactivent
les aperçus de brouillon pour un tour lorsque le canal ne peut pas modifier de façon sûre le
bon message.

**Je vois le libellé, mais aucune ligne d’outil.**

Vérifiez `streaming.progress.toolProgress`. S’il est défini sur `false`, OpenClaw conserve le
comportement à brouillon unique, mais masque les lignes de progression des outils et des tâches.

**Je vois un nouveau message final plutôt qu’un brouillon modifié.**

Il s’agit du mécanisme de repli de sécurité décrit dans [Finalisation](#finalization). Cela peut
se produire pour les réponses contenant des médias, les réponses longues, les cibles de réponse explicites, les anciens brouillons
Telegram, les cibles de fil Slack manquantes, les messages d’aperçu supprimés ou l’échec de
la finalisation du flux natif.

**Je vois encore des messages autonomes de progression.**

Le mode de progression supprime les messages autonomes de progression des outils par défaut lorsqu’un
brouillon est actif. Si des messages autonomes apparaissent encore, vérifiez que le tour utilise
bien le mode `progress`, et non `streaming.mode: "off"` ni un chemin de
canal qui ne peut pas créer de brouillon pour ce message.

**Teams se comporte différemment de Discord ou Telegram.**

Microsoft Teams utilise un flux natif dans les conversations personnelles plutôt que le transport générique
d’aperçu par envoi et modification, et associe `streaming.mode: "block"` à l’envoi par
blocs de Teams, car il ne dispose pas d’un mode de blocs d’aperçu de brouillon comme Discord et
Telegram.

## Pages connexes

- [Diffusion en continu et segmentation](/fr/concepts/streaming)
- [Messages](/fr/concepts/messages)
- [Configuration des canaux](/fr/gateway/config-channels)
- [Discord](/fr/channels/discord)
- [Matrix](/fr/channels/matrix)
- [Microsoft Teams](/fr/channels/msteams)
- [Slack](/fr/channels/slack)
- [Telegram](/fr/channels/telegram)
- [Mattermost](/fr/channels/mattermost)
