---
read_when:
    - Configuration des mises à jour de progression visibles pour les échanges de chat de longue durée
    - Choisir entre les modes de diffusion partielle, par bloc et de progression
    - Expliquer comment OpenClaw met à jour un message de canal pendant l’exécution d’une tâche
    - Brouillons de progression du dépannage, messages de progression autonomes ou solution de secours pour la finalisation
summary: 'Brouillons de progression : un message de travail en cours visible qui se met à jour pendant l’exécution d’un agent'
title: Brouillons en cours
x-i18n:
    generated_at: "2026-07-12T15:21:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8a7d2e60768718922b3d00c72817ff8e342a1e37c6d9a43eef30972412ad9a49
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Les brouillons de progression transforment un message de canal en une ligne d’état en direct pendant qu’un
agent travaille, au lieu d’une pile de réponses temporaires « travail toujours en cours ». Définissez
`channels.<channel>.streaming.mode: "progress"` et OpenClaw crée le
message dès que le travail réel commence, le modifie à mesure que l’agent lit, planifie, appelle des
outils ou attend une approbation, puis le transforme en réponse finale.

```text
Exécution dans le shell...
📖 depuis docs/concepts/progress-drafts.md
🔎 Recherche Web : pour "discord edit message"
🛠️ Bash : exécuter les tests
```

<Note>
  Discord utilise déjà par défaut `streaming.mode: "progress"` lorsque
  `channels.discord.streaming` n’est pas défini, de sorte que les brouillons de progression
  y apparaissent sans aucune configuration. Tous les autres canaux utilisent par défaut `partial`
  ou `off` ; consultez [Streaming et découpage](/fr/concepts/streaming#channel-mapping)
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

Valeurs par défaut à partir d’ici : une étiquette automatique d’un seul mot, un délai initial de 5 secondes
(ou un démarrage immédiat lors d’un deuxième événement de travail), des lignes de progression compactes pendant qu’un travail
utile est effectué, et la suppression des anciens messages de progression autonomes pour
ce tour.

Cette page présente l’expérience des brouillons de progression et ses options de configuration. Pour connaître la
matrice complète des modes de streaming, les remarques d’exécution propres à chaque canal et la migration
des anciennes clés, consultez [Streaming et découpage](/fr/concepts/streaming).

## Ce que voient les utilisateurs

| Partie               | Objectif                                                                                                          |
| -------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Étiquette            | Courte ligne initiale ou d’état telle que `Working` ou `Shelling`.                                                |
| Lignes de progression | Mises à jour compactes de l’exécution utilisant les mêmes icônes d’outils et le même formateur de détails que `/verbose`. |

L’étiquette apparaît lorsque l’agent commence un travail significatif et reste occupé pendant le
délai initial, ou immédiatement lorsqu’un deuxième événement de travail se déclenche. Elle se trouve en haut de
la liste défilante des lignes de progression et disparaît donc du défilement lorsque suffisamment de lignes de travail
concrètes apparaissent. Les réponses uniquement en texte brut n’affichent jamais de brouillon de progression ; une ligne
apparaît uniquement pour de véritables mises à jour du travail, par exemple `🛠️ Bash: run tests`,
`🔎 Web Search: for "discord edit message"` ou `✍️ Write: to /tmp/file`.

La réponse finale remplace le brouillon sur place lorsque le canal peut le faire en toute sécurité ;
sinon, OpenClaw envoie la réponse finale via le mécanisme de distribution normal et
nettoie le brouillon ou cesse de le mettre à jour (consultez [Finalisation](#finalization)).

## Choisir un mode

`channels.<channel>.streaming.mode` contrôle le comportement visible pendant l’exécution :

| Mode       | Idéal pour                                      | Ce qui apparaît dans le chat                                      |
| ---------- | ----------------------------------------------- | ----------------------------------------------------------------- |
| `off`      | Canaux silencieux                               | Uniquement la réponse finale.                                     |
| `partial`  | Voir apparaître le texte de la réponse          | Un brouillon modifié avec le dernier texte de la réponse.         |
| `block`    | Fragments plus grands d’aperçu de la réponse    | Un aperçu mis à jour ou complété par fragments plus grands.       |
| `progress` | Tours riches en outils ou de longue durée       | Un brouillon d’état, puis la réponse finale.                       |

Choisissez `progress` lorsque les utilisateurs accordent plus d’importance à « ce qui se passe » qu’à l’affichage
du texte de la réponse jeton par jeton ; `partial` lorsque le texte de la réponse constitue lui-même
le signal de progression ; `block` pour des fragments d’aperçu plus grands. Sur Discord et
Telegram, `streaming.mode: "block"` correspond toujours au streaming de l’aperçu, et non à la distribution normale
des réponses par blocs — utilisez `streaming.block.enabled` pour cela.

## Configurer les libellés

Les libellés de progression se trouvent sous `channels.<channel>.streaming.progress`. La
valeur par défaut de `label` est `"auto"`, ce qui sélectionne un libellé dans le groupe
intégré de libellés composés d’un seul mot d’OpenClaw :

```text
Travail, Commandes, Déplacement, Griffes, Pincement, Mue, Bulles, Marée,
Récif, Craquement, Tamisage, Saumurage, Navigation, Krill, Balanes,
Homard, Bassin de marée, Perles, Claquement, Émergence
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

Utilisez votre propre groupe de libellés (toujours sélectionnés aléatoirement ou selon la graine lorsque `label: "auto"`) :

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

Les lignes de progression proviennent d’événements d’exécution réels : démarrages
d’outils, mises à jour d’éléments, plans de tâches, approbations, sortie de commandes,
résumés de correctifs et activités similaires de l’agent. Elles sont activées par
défaut (`progress.toolProgress`, valeur par défaut `true`).

Les outils peuvent également émettre une progression typée pendant qu’un appel unique
est encore en cours d’exécution. C’est ainsi qu’une récupération ou une recherche lente
met à jour le brouillon visible avant que l’outil ne renvoie son résultat final. La mise
à jour de progression est un résultat d’outil partiel dont le contenu destiné au modèle
est vide et qui comporte des métadonnées explicites pour le canal public :

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

OpenClaw affiche uniquement `progress.text` dans l’interface de progression du canal. Le
résultat normal de l’outil arrive ensuite sous forme de `content`/`details` et constitue
la seule partie renvoyée au modèle.

Lorsque vous ajoutez une progression à un outil, émettez un message court et générique,
puis retardez-le jusqu’à ce que l’opération soit en attente depuis suffisamment
longtemps pour qu’il soit utile. `web_fetch` procède exactement ainsi avec un délai de
5 secondes :

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
est un canal auxiliaire public de l’interface utilisateur ; il ne doit donc jamais inclure de secrets, d’arguments bruts,
de contenu récupéré, de sortie de commande ni de texte de page.

### Mode détaillé

OpenClaw utilise le même formateur pour les brouillons de progression et `/verbose` :

```json5
{
  agents: {
    defaults: {
      toolProgressDetail: "explain", // expliquer | brut
    },
  },
}
```

`"explain"` est la valeur par défaut et assure la stabilité des brouillons grâce à des libellés concis.
`"raw"` ajoute la commande sous-jacente lorsqu’elle est disponible, ce qui est utile pendant le
débogage, mais plus verbeux dans le chat. Par exemple, un appel à `node --check /tmp/app.js`
s’affiche différemment selon le mode :

| Mode      | Ligne de progression                                             |
| --------- | --------------------------------------------------------------- |
| `explain` | `🛠️ check js syntax for /tmp/app.js`                            |
| `raw`     | `🛠️ check js syntax for /tmp/app.js · node --check /tmp/app.js` |

### Texte de commande/d’exécution

`streaming.progress.commandText` (valeur par défaut : `"raw"`) détermine le niveau de détail de la commande
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

### Voie de commentaires

`streaming.progress.commentary` (valeur par défaut : `false`) intercale dans le brouillon les commentaires ou le préambule narratif du modèle avant l'utilisation des outils (💬, par exemple « Je vais vérifier... puis... ») avec les lignes des outils. Consultez
[Diffusion en continu et découpage](/fr/concepts/streaming#commentary-progress-lane) pour connaître la structure de configuration commune aux différents canaux.

### État narré

Lorsqu'un modèle utilitaire est défini pour l'agent — un
[`utilityModel`](/fr/gateway/config-agents#utilitymodel) explicite ou le petit modèle par défaut déclaré par le fournisseur principal (OpenAI → `gpt-5.6-luna`,
Anthropic → `claude-haiku-4-5`) —, le brouillon de progression remplace les lignes d'outils successives par une courte narration en langage courant de ce que fait l'agent, rédigée par ce modèle moins coûteux et actualisée à mesure que le travail avance :

```text
À l'œuvre

Mise à jour du modèle par défaut dans votre configuration, puis redémarrage du Gateway pour
appliquer la modification. Un appel de liste des agents a échoué et fait l'objet d'une nouvelle tentative.
```

La narration est activée par défaut (`streaming.progress.narration`, valeur par défaut : `true`) et ne se rabat jamais sur le modèle principal : elle s'exécute uniquement avec un
`utilityModel` explicite ou un modèle par défaut déclaré par le fournisseur principal de l'agent. Définissez `utilityModel: ""` pour désactiver entièrement le routage utilitaire. Les lignes d'outils continuent de s'accumuler en dessous et réapparaissent si la narration s'arrête. Le brouillon n'est modifié que lorsque le texte de la narration change réellement, ce qui réduit également la fréquence des modifications dans les canaux très actifs. Désactivez-la pour conserver les lignes d'outils brutes :

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
redisposition des bulles de discussion pendant la modification du brouillon, et
OpenClaw tronque les lignes longues afin que les modifications répétées du
brouillon ne provoquent pas de retours à la ligne différents à chaque mise à
jour. La limite par défaut est de 120 caractères par ligne ; le texte est coupé
à une limite de mot, tandis que les détails longs, tels que les chemins ou les
commandes brutes, sont raccourcis à l’aide de points de suspension au milieu
afin que le suffixe reste visible.

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
structurés plutôt que de texte brut :

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
Block Kit, afin que les clients qui ne peuvent pas afficher la forme enrichie
présentent tout de même le texte de progression compact.

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

Avec `toolProgress: false`, OpenClaw masque toujours les anciens messages
autonomes de progression des outils pour cette interaction — le canal reste
visuellement silencieux jusqu’à la réponse finale, à l’exception du libellé si
celui-ci est configuré.

## Comportement du canal

| Canal           | Transport de la progression                    | Remarques                                                                                                                                                                                      |
| --------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Envoie un message, puis le modifie.             | Utilise par défaut le mode `progress` ; la réponse finale comporte un accusé d’activité `-#` et le brouillon d’état est supprimé après l’arrivée de la réponse.                                 |
| Matrix          | Envoie un événement, puis le modifie.           | La configuration du streaming au niveau du compte contrôle les brouillons au niveau du compte.                                                                                                |
| Microsoft Teams | Flux Teams natif dans les conversations privées. | `streaming.mode: "block"` correspond plutôt à la livraison par blocs de Teams.                                                                                                                 |
| Slack           | Flux natif ou publication de brouillon modifiable. | Nécessite une cible de fil de réponses ; les messages privés de premier niveau qui n’en ont pas reçoivent tout de même des publications d’aperçu du brouillon et leurs modifications.           |
| Telegram        | Envoie un message, puis le modifie.             | Si un message arrive entre le brouillon de progression et la réponse, le brouillon est republié en dessous (publier le nouveau, puis supprimer l’ancien) au lieu de faire défiler brusquement le client. |
| Mattermost      | Publication de brouillon modifiable.            | Le mode `block` alterne entre les publications de texte terminé et celles d’activité des outils ; les autres modes intègrent l’activité des outils dans la même publication de type brouillon. |

Les canaux qui ne prennent pas en charge la modification de manière sûre utilisent à la place des indicateurs de saisie ou
une livraison de la réponse finale uniquement. Consultez [Streaming et découpage](/fr/concepts/streaming) pour
la présentation complète du comportement d’exécution par canal.

## Finalisation

Lorsque la réponse finale est prête, OpenClaw essaie de garder la conversation claire :

- En mode `progress` sur Discord, la réponse finale est envoyée dans un nouveau message,
  avec un petit accusé d’activité `-#` ajouté (par exemple
  `-# 🧠 2 thoughts · 🛠️ 5 tool calls · ⏱️ 12s`), et le brouillon d’état est
  supprimé une fois cette réponse remise. Dans les canaux très actifs, aucun journal d’outil
  orphelin ne reste au-dessus de la réponse ; en cas d’erreur finale, le brouillon reste visible
  comme trace de l’échec de l’échange.
- Si le brouillon peut être converti sans risque en réponse finale (modes `partial`/`block`),
  OpenClaw le modifie sur place.
- Si le canal utilise la diffusion en continu native de la progression, OpenClaw finalise ce
  flux lorsque le transport natif accepte le texte final.
- Sinon (contenu multimédia, demande d’approbation, cible de réponse explicite, trop grand nombre
  de fragments ou échec de modification/d’envoi), OpenClaw envoie la réponse finale par le
  mécanisme normal de remise du canal au lieu d’écraser le brouillon.

Le mécanisme de repli est intentionnel : envoyer une nouvelle réponse finale vaut mieux que perdre du texte,
rattacher une réponse au mauvais fil ou remplacer un brouillon par une charge utile que le canal
ne peut pas représenter de manière sûre.

## Dépannage

**Je ne vois que la réponse finale.**

Vérifiez que `channels.<channel>.streaming.mode` est défini sur `progress` pour le compte
ou le canal qui a traité le message. Certains parcours de groupe ou de réponse avec citation désactivent
les aperçus de brouillon pour une interaction lorsque le canal ne peut pas modifier de manière sûre le bon
message.

**Je vois le libellé, mais aucune ligne d’outil.**

Vérifiez `streaming.progress.toolProgress`. Si cette valeur est `false`, OpenClaw conserve le
comportement de brouillon unique, mais masque les lignes de progression des outils et des tâches.

**Je vois un nouveau message final au lieu d’un brouillon modifié.**

Il s’agit du mécanisme de secours décrit dans [Finalisation](#finalization). Cela peut
se produire pour les réponses contenant des médias, les réponses longues, les cibles de réponse explicites, les anciens
brouillons Telegram, les cibles de fil Slack manquantes, les messages d’aperçu supprimés ou l’échec de la
finalisation du flux natif.

**Je vois toujours des messages de progression autonomes.**

Le mode de progression supprime les messages autonomes de progression des outils par défaut lorsqu’un
brouillon est actif. Si des messages autonomes apparaissent toujours, vérifiez que l’interaction utilise
réellement le mode `progress` et non `streaming.mode: "off"` ou un chemin de
canal qui ne peut pas créer de brouillon pour ce message.

**Teams se comporte différemment de Discord ou Telegram.**

Microsoft Teams utilise un flux natif dans les conversations personnelles au lieu du transport générique
d’aperçu par envoi et modification, et associe `streaming.mode: "block"` à la livraison par blocs de Teams,
car il ne dispose pas d’un mode de blocs d’aperçu de brouillon comme Discord et
Telegram.

## Pages connexes

- [Diffusion en continu et découpage](/fr/concepts/streaming)
- [Messages](/fr/concepts/messages)
- [Configuration des canaux](/fr/gateway/config-channels)
- [Discord](/fr/channels/discord)
- [Matrix](/fr/channels/matrix)
- [Microsoft Teams](/fr/channels/msteams)
- [Slack](/fr/channels/slack)
- [Telegram](/fr/channels/telegram)
- [Mattermost](/fr/channels/mattermost)
