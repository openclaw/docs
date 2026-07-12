---
read_when:
    - Explication du fonctionnement du streaming ou du découpage en blocs sur les canaux
    - Modification du comportement de diffusion par blocs ou de segmentation des canaux
    - Débogage des réponses de bloc dupliquées/précoces ou de la diffusion en continu de l’aperçu du canal
summary: Comportement du streaming et du découpage en blocs (réponses par blocs, aperçu en streaming dans le canal, correspondance des modes)
title: Diffusion en continu et découpage en blocs
x-i18n:
    generated_at: "2026-07-12T15:18:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 7860a83183459ea3dd05c866118e14bc8469c7adcd074a25b6f4a1174cb1664d
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw comporte deux couches de streaming indépendantes et il n’existe aujourd’hui **aucun véritable
streaming des deltas de tokens** vers les messages des canaux :

- **Streaming par blocs (canaux) :** émet des **blocs** terminés à mesure que l’assistant
  écrit. Il s’agit de messages de canal normaux, et non de deltas de tokens.
- **Streaming de l’aperçu (Telegram/Discord/Slack/Matrix/Mattermost/MS Teams) :**
  met à jour un **message d’aperçu** temporaire pendant la génération (envoi + modifications/ajouts).

## Streaming par blocs (messages de canal)

Le streaming par blocs envoie la sortie de l’assistant par segments grossiers à mesure qu’elle devient disponible.

```text
Sortie du modèle
  └─ text_delta/événements
       ├─ (blockStreamingBreak=text_end)
       │    └─ le segmenteur émet des blocs à mesure que le tampon se remplit
       └─ (blockStreamingBreak=message_end)
            └─ le segmenteur vide le tampon à message_end
                   └─ envoi au canal (réponses par blocs)
```

- `text_delta/events` : événements du flux du modèle (ils peuvent être rares pour les modèles sans streaming).
- `chunker` : `EmbeddedBlockChunker` appliquant les limites min./max. et la préférence de coupure.
- `channel send` : messages sortants réels (réponses par blocs).

**Paramètres** (tous sous `agents.defaults`, sauf indication contraire) :

| Clé                                                          | Valeurs / structure                                                       | Valeur par défaut |
| ------------------------------------------------------------ | ------------------------------------------------------------------------- | ----------------- |
| `blockStreamingDefault`                                      | `"on"` / `"off"`                                                          | `"off"`           |
| `blockStreamingBreak`                                        | `"text_end"` / `"message_end"`                                            | -                 |
| `blockStreamingChunk`                                        | `{ minChars, maxChars, breakPreference? }`                                | -                 |
| `blockStreamingCoalesce`                                     | `{ minChars?, maxChars?, idleMs? }` (fusionne les blocs avant leur envoi) | -                 |
| `*.blockStreaming` (remplacement propre au canal)            | `true` / `false`, impose le streaming par blocs par canal (et par compte) | -                 |
| `*.textChunkLimit` (p. ex. `channels.whatsapp.textChunkLimit`) | nombre, limite stricte                                                    | 4000              |
| `*.chunkMode`                                                | `"length"` / `"newline"`                                                  | `"length"`        |
| `channels.discord.maxLinesPerMessage`                        | nombre, limite souple de lignes fractionnant les longues réponses pour éviter leur rognage dans l’interface | 17 |

`chunkMode: "newline"` effectue le fractionnement sur les lignes vides (limites de paragraphes), et non sur chaque
saut de ligne, avant de revenir au fractionnement selon la longueur lorsque le texte dépasse la
limite.

Les canaux dotés d’une configuration `streaming` imbriquée (Telegram, Discord, Slack, iMessage,
Microsoft Teams) expriment ces remplacements sous la forme
`channels.<id>.streaming.{chunkMode,block.enabled,block.coalesce}` ; les formes plates
`*.chunkMode` / `*.blockStreaming` / `*.blockStreamingCoalesce` s’appliquent
aux canaux qui n’en possèdent pas (par exemple Signal, IRC, Google Chat, WhatsApp,
Mattermost). Les anciennes clés plates des canaux à streaming imbriqué sont migrées par
`openclaw doctor --fix` et ne sont pas lues lors de l’exécution.

**Sémantique des limites** de `blockStreamingBreak` :

- `text_end` : diffuse les blocs dès que le segmenteur les émet ; vide le tampon à chaque `text_end`.
- `message_end` : attend que le message de l’assistant soit terminé, puis vide la sortie
  mise en tampon. Utilise toujours le segmenteur si le texte mis en tampon dépasse `maxChars`, et peut donc
  émettre plusieurs segments à la fin.

### Livraison de médias avec le streaming par blocs

Les médias diffusés doivent utiliser des champs de charge utile structurés tels que `mediaUrl` ou
`mediaUrls` ; le texte diffusé n’est pas interprété comme une commande de pièce jointe. Lorsque le streaming par
blocs envoie un média de manière anticipée, OpenClaw mémorise cette livraison pour l’interaction. Si
la charge utile finale de l’assistant répète la même URL de média, la livraison finale retire
le média en double au lieu de renvoyer la pièce jointe.

Les charges utiles finales strictement identiques sont supprimées. Si la charge utile finale ajoute
du texte distinct autour d’un média déjà diffusé, OpenClaw envoie tout de même le
nouveau texte tout en ne livrant le média qu’une seule fois. Cela évite les notes vocales
ou fichiers en double sur des canaux tels que Telegram.

## Algorithme de fractionnement (limites basse/haute)

Le fractionnement par blocs est mis en œuvre par `EmbeddedBlockChunker` :

- **Limite basse :** aucune émission tant que le tampon n’est pas >= `minChars` (sauf si elle est forcée).
- **Limite haute :** privilégie les coupures avant `maxChars` ; si elle est forcée, coupe à `maxChars`.
- **Chaîne de préférences de coupure :** `paragraph` -> `newline` -> `sentence` ->
  espace blanc -> coupure forcée.
- **Blocs de code :** ne coupe jamais à l’intérieur des blocs ; lorsqu’une coupure est forcée à `maxChars`, ferme
  puis rouvre le bloc afin de conserver un Markdown valide.

`maxChars` est plafonné à la valeur `textChunkLimit` du canal ; vous ne pouvez donc pas dépasser
les limites propres à chaque canal.

## Fusion (regroupement des blocs diffusés)

Lorsque le streaming par blocs est activé, OpenClaw peut **fusionner les segments de blocs
consécutifs** avant de les envoyer, ce qui réduit la multiplication des messages d’une seule ligne tout en fournissant
une sortie progressive.

- La fusion attend des **périodes d’inactivité** (`idleMs`) avant de vider le tampon.
- Les tampons sont limités par `maxChars` et vidés s’ils dépassent cette valeur.
- `minChars` empêche l’envoi de fragments minuscules tant qu’une quantité suffisante de texte ne s’est pas accumulée
  (le vidage final envoie toujours le texte restant).
- Le séparateur est dérivé de `blockStreamingChunk.breakPreference` : `paragraph` ->
  `\n\n`, `newline` -> `\n`, `sentence` -> espace.
- Des remplacements propres au canal sont disponibles via `*.blockStreamingCoalesce` (y compris
  dans les configurations par compte).
- Par défaut, Discord, Signal et Slack utilisent `{ minChars: 1500, idleMs: 1000 }`
  pour la fusion, sauf remplacement.

## Rythme naturel entre les blocs

Lorsque le streaming par blocs est activé, ajoutez une **pause aléatoire** entre les réponses par
blocs, après le premier bloc, afin que les réponses réparties sur plusieurs bulles paraissent plus naturelles.

| `agents.defaults.humanDelay.mode` | Comportement                  |
| --------------------------------- | ----------------------------- |
| `off` (par défaut)                | Aucune pause                  |
| `natural`                         | Pause aléatoire de 800-2500ms |
| `custom`                          | `minMs`/`maxMs`               |

Remplacez ce paramètre pour chaque agent via `agents.list[].humanDelay`. S’applique uniquement aux **réponses par
blocs**, et non aux réponses finales ni aux résumés d’outils.

## « Diffuser les segments ou tout le contenu »

- **Diffuser les segments :** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`
  (émission au fil de la génération). Les canaux autres que Telegram nécessitent également `*.blockStreaming: true`.
- **Tout diffuser à la fin :** `blockStreamingBreak: "message_end"` (un seul vidage,
  éventuellement en plusieurs segments si le contenu est très long).
- **Aucun streaming par blocs :** `blockStreamingDefault: "off"` (réponse finale uniquement).

Le streaming par blocs est **désactivé sauf si** `*.blockStreaming` est explicitement défini sur
`true`. Les canaux peuvent diffuser un aperçu en direct (`channels.<channel>.streaming`)
sans réponses par blocs. Les valeurs par défaut `blockStreaming*` se trouvent sous
`agents.defaults`, et non à la racine de la configuration.

## Modes de streaming de l’aperçu

Clé canonique : `channels.<channel>.streaming` (structure imbriquée `{ mode, ... }` ; les anciennes
formes booléennes/chaînes de premier niveau sont réécrites par `openclaw doctor --fix`).

| Mode       | Comportement                                                            |
| ---------- | ----------------------------------------------------------------------- |
| `off`      | Désactive le streaming de l’aperçu                                      |
| `partial`  | Aperçu unique remplacé par le texte le plus récent                      |
| `block`    | Mises à jour de l’aperçu par étapes segmentées/ajoutées                 |
| `progress` | Aperçu de progression/d’état pendant la génération, réponse finale à la fin |

`streaming.mode: "block"` est un mode de streaming de l’aperçu pour les
canaux prenant en charge la modification, tels que Discord et Telegram ; il n’active pas à lui seul la
livraison par blocs sur ces canaux. Utilisez `streaming.block.enabled` pour les réponses par blocs
normales (les canaux sans configuration `streaming` imbriquée conservent la clé plate
`blockStreaming`). Microsoft Teams constitue
l’exception : il ne dispose d’aucun transport par blocs pour l’aperçu de brouillon ; `streaming.mode:
"block"` désactive donc entièrement le streaming natif et la réponse est livrée sous forme de
blocs normaux plutôt que par streaming natif partiel/de progression. Mattermost diffère également :
en mode `block`, il alterne l’aperçu entre les blocs de texte terminés et
les blocs d’activité des outils, de sorte que les blocs précédents restent visibles sous forme de publications séparées
au lieu d’être remplacés dans un brouillon modifiable unique.

### Correspondance des canaux

| Canal      | `off` | `partial` | `block` | `progress`                          |
| ---------- | ----- | --------- | ------- | ----------------------------------- |
| Telegram   | Oui   | Oui       | Oui     | brouillon de progression modifiable |
| Discord    | Oui   | Oui       | Oui     | brouillon de progression modifiable |
| Slack      | Oui   | Oui       | Oui     | Oui                                 |
| Mattermost | Oui   | Oui       | Oui     | Oui                                 |
| MS Teams   | Oui   | Oui       | Oui     | flux de progression natif           |

La configuration des segments d’aperçu (`streaming.preview.chunk.*`, par exemple sous
`channels.discord.streaming` ou `channels.telegram.streaming`) utilise par défaut
`minChars: 200`, `maxChars: 800` (plafonné à la valeur `textChunkLimit` du canal) et
`breakPreference: "paragraph"`.

Spécifique à Slack :

- `channels.slack.streaming.nativeTransport` active ou désactive les appels à l’API de streaming native de Slack
  (`chat.startStream`/`chat.appendStream`/`chat.stopStream`) lorsque
  `channels.slack.streaming.mode="partial"` (valeur par défaut : `true`).
- Le streaming natif de Slack et l’état du fil de discussion de l’assistant Slack nécessitent une cible de
  fil de réponse. Les messages privés de premier niveau n’affichent pas cet aperçu sous forme de fil, mais peuvent
  toujours utiliser les publications d’aperçu de brouillon Slack et leurs modifications.

### Migration des anciennes clés

| Canal    | Anciennes clés                                              | État                                                                                                                                                  |
| -------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram | `streamMode`, `streaming` scalaire/booléen                  | Réécrites en `streaming.mode` par `openclaw doctor --fix` ; non lues lors de l’exécution                                                              |
| Discord  | `streamMode`, `streaming` booléen                           | Réécrites en `streaming.mode` par `openclaw doctor --fix` ; non lues lors de l’exécution                                                              |
| Slack    | `streamMode` ; `streaming` booléen ; ancien `nativeStreaming` | Réécrites en `streaming.mode` (et en `streaming.nativeTransport` pour les formes booléennes/anciennes) par `openclaw doctor --fix` ; non lues lors de l’exécution |

## Comportement lors de l’exécution

### Telegram

- Utilise `sendMessage` + `editMessageText` pour les mises à jour de l’aperçu dans les messages privés et les
  groupes/sujets ; le texte final modifie l’aperçu actif sur place. Les brouillons
  éphémères « saisie en cours » de 30 secondes de Telegram (`sendMessageDraft`) ne sont pas utilisés pour
  la diffusion en continu des réponses.
- Les courts aperçus initiaux sont toujours temporisés pour optimiser l’expérience des notifications push, mais
  s’affichent après un délai limité afin que les exécutions actives ne restent pas visuellement silencieuses.
- Les longues réponses finales réutilisent le message d’aperçu pour le premier fragment et envoient uniquement les
  fragments restants.
- Le mode `block` transforme l’aperçu en nouveau message à
  `streaming.preview.chunk.maxChars` (800 par défaut, plafonné à la limite de modification de 4096
  caractères de Telegram) ; les autres modes développent un seul aperçu jusqu’à 4096 caractères.
- Le mode `progress` conserve la progression des outils dans un brouillon d’état modifiable, affiche
  le libellé d’état lorsque la diffusion en continu de la réponse est active mais qu’aucune ligne d’outil n’est
  encore disponible, efface le brouillon à la fin et envoie la réponse finale
  via le mécanisme de distribution normal.
- Si la modification finale échoue avant que le texte complet ne soit confirmé, OpenClaw utilise
  la distribution finale normale et supprime l’aperçu obsolète.
- La diffusion en continu de l’aperçu est ignorée lorsque la diffusion en continu par blocs de Telegram est explicitement
  activée, afin d’éviter une double diffusion.
- `/reasoning stream` peut écrire le raisonnement dans un aperçu temporaire qui est
  supprimé après la distribution finale.
- Les réponses de Telegram avec citation sélectionnée constituent une exception : lorsque `replyToMode` n’est pas
  `"off"` et qu’un texte de citation sélectionné est présent, OpenClaw ignore la diffusion en continu de l’aperçu de la réponse
  pour cette interaction (la réponse finale doit emprunter le mécanisme natif de réponse avec citation),
  de sorte que les lignes d’aperçu de progression des outils ne peuvent pas s’afficher. Les réponses au message actuel
  sans texte de citation sélectionné conservent la diffusion en continu de l’aperçu. Consultez la
  [documentation du canal Telegram](/fr/channels/telegram) pour plus de détails.

### Discord

- Utilise l’envoi et la modification de messages d’aperçu.
- Le mode `block` utilise le découpage du brouillon en fragments (`draftChunk`).
- La diffusion en continu de l’aperçu est ignorée lorsque la diffusion en continu par blocs de Discord est explicitement
  activée.
- Le mode `progress` ajoute un petit accusé d’activité `-#` (nombre de pensées/d’appels d’outils
  et temps écoulé) à la réponse finale et supprime le brouillon d’état
  une fois cette réponse distribuée, afin que les canaux très actifs ne conservent aucun journal d’outil orphelin
  au-dessus de la réponse. En cas d’erreur finale, le brouillon est conservé comme trace de l’interaction
  ayant échoué.
- Les charges utiles finales contenant un média, une erreur ou une réponse explicite annulent les aperçus en attente
  sans publier de nouveau brouillon, puis utilisent la distribution normale.

### Slack

- Le mode `partial` peut utiliser la diffusion en continu native de Slack (`chat.startStream`/`append`/`stop`)
  lorsqu’elle est disponible.
- Le mode `block` utilise des aperçus de brouillon par ajout successif.
- Le mode `progress` utilise un texte d’aperçu d’état, puis la réponse finale.
- Les messages privés de premier niveau sans fil de réponse utilisent des publications d’aperçu de brouillon et des modifications
  au lieu de la diffusion en continu native de Slack.
- La diffusion en continu native et celle des aperçus de brouillon désactivent les réponses par blocs pour cette interaction, afin qu’une
  réponse Slack ne soit diffusée que par un seul mécanisme de distribution.
- Les charges utiles finales contenant un média ou une erreur, ainsi que les réponses finales de progression, ne créent pas de messages de brouillon
  temporaires ; seules les réponses finales textuelles ou par blocs capables de modifier l’aperçu publient le texte de brouillon
  en attente.

### Mattermost

- En mode `partial`, diffuse le raisonnement et le texte partiel de la réponse dans une seule publication d’aperçu
  de brouillon qui est finalisée sur place lorsque la réponse finale peut être envoyée en toute sécurité.
- En mode `progress`, diffuse le raisonnement et l’activité des outils dans un seul aperçu
  d’état qui est finalisé sur place lorsque la réponse finale peut être envoyée en toute sécurité.
- En mode `block`, alterne entre les publications de texte terminé et d’activité des outils ;
  les mises à jour parallèles et consécutives des outils partagent la publication actuelle d’activité des outils.
- Se rabat sur l’envoi d’une nouvelle publication finale si la publication d’aperçu a été supprimée ou
  n’est pas disponible pour une autre raison au moment de la finalisation.
- Les charges utiles finales contenant un média ou une erreur annulent les mises à jour d’aperçu en attente avant la distribution
  normale au lieu de publier une publication d’aperçu temporaire.

### Matrix

- Les aperçus de brouillon sont finalisés sur place lorsque le texte final peut réutiliser l’événement
  d’aperçu.
- Les réponses finales contenant uniquement un média, une erreur ou dont la cible ne correspond pas à la réponse annulent les mises à jour d’aperçu
  en attente avant la distribution normale ; un aperçu obsolète déjà visible est masqué.

## Mises à jour de l’aperçu de progression des outils

La diffusion en continu de l’aperçu peut également inclure des mises à jour de **progression des outils** : de courtes lignes
d’état telles que « recherche sur le Web », « lecture du fichier » ou « appel de l’outil », qui apparaissent
dans le même message d’aperçu pendant l’exécution des outils, avant la réponse finale.
En mode serveur d’application Codex, les messages de préambule/commentaire de Codex utilisent ce même
mécanisme d’aperçu, de sorte que de courtes notes de progression comme « Je vérifie... » peuvent être diffusées dans le
brouillon modifiable sans faire partie de la réponse finale. Cela maintient
les interactions en plusieurs étapes visuellement actives plutôt que silencieuses entre le premier aperçu
du raisonnement et la réponse finale.

Les outils de longue durée peuvent émettre une progression typée avant de se terminer. Par exemple,
`web_fetch` déclenche un minuteur de cinq secondes au démarrage : si la récupération est toujours
en attente, l’aperçu affiche `Fetching page content...` ; si la récupération se termine ou
est annulée avant ce délai, aucune ligne de progression n’est émise. Le résultat final ultérieur de l’outil
est toujours transmis normalement au modèle.

Surfaces prises en charge :

- **Discord**, **Slack**, **Telegram** et **Matrix** diffusent par défaut la progression des outils et
  les mises à jour du préambule de Codex dans la modification de l’aperçu en direct lorsque la
  diffusion de l’aperçu est active. Microsoft Teams utilise son flux de progression natif dans
  les conversations personnelles.
- Telegram est fourni avec les mises à jour de l’aperçu de la progression des outils activées depuis
  `v2026.4.22` ; les conserver activées préserve ce comportement publié.
- **Mattermost** regroupe l’activité des outils dans une seule publication d’aperçu dans les modes
  `partial` et `progress`, ou dans une publication d’activité des outils entre les blocs de texte en mode
  `block` (voir ci-dessus).
- Les modifications liées à la progression des outils suivent le mode actif de diffusion de l’aperçu ; elles sont
  ignorées lorsque la diffusion de l’aperçu est `off` ou lorsque la diffusion par blocs a pris
  le contrôle du message. Sur Telegram, `streaming.mode: "off"` signifie uniquement le résultat final : les
  messages génériques de progression sont également supprimés au lieu d’être envoyés comme messages d’état
  autonomes, tandis que les demandes d’approbation, les charges utiles multimédias et les erreurs sont toujours acheminées
  normalement.
- Pour conserver la diffusion de l’aperçu tout en masquant les lignes de progression des outils, définissez
  `streaming.preview.toolProgress` sur `false` pour ce canal (valeur par défaut :
  `true`). Pour garder les lignes de progression des outils visibles tout en masquant le texte des commandes/exécutions,
  définissez `streaming.preview.commandText` sur `"status"` ou
  `streaming.progress.commandText` sur `"status"` ; la valeur par défaut est `"raw"` afin de
  préserver le comportement publié. Cette stratégie est partagée par les canaux de brouillon/progression
  qui utilisent le moteur de rendu compact de la progression d’OpenClaw, notamment Discord, Matrix,
  Microsoft Teams, Mattermost, les aperçus de brouillons Slack et Telegram. Pour désactiver
  entièrement les modifications de l’aperçu, définissez `streaming.mode` sur `off`.

## Rendu des brouillons de progression

Les brouillons en mode progression (`streaming.progress.*`) sont limités et configurables par
canal :

| Clé                               | Valeur par défaut | Comportement                                                               |
| --------------------------------- | ----------------- | -------------------------------------------------------------------------- |
| `streaming.progress.maxLines`     | `8`               | Nombre maximal de lignes de progression compactes conservées sous le libellé du brouillon |
| `streaming.progress.maxLineChars` | `120`             | Nombre maximal de caractères par ligne compacte avant troncature (respectant les mots) |
| `streaming.progress.label`        | `"auto"`          | Titre du brouillon ; une chaîne personnalisée, ou `false` pour le masquer |
| `streaming.progress.labels`       | ensemble intégré  | Libellés candidats utilisés lorsque `label: "auto"`                        |

### Voie de progression des commentaires

Au-delà de la progression des outils, le moteur de rendu compact de la progression peut afficher une voie
supplémentaire dans le brouillon :

- **`streaming.progress.commentary`** - affiche les **commentaires** du modèle avant l’utilisation d’un outil
  (une brève narration du type « Je vais vérifier... puis... »), intercalés avec
  les lignes d’outils dans le brouillon de progression.

```json
{
  "channels": {
    "discord": {
      "streaming": { "mode": "progress", "progress": { "commentary": true } }
    }
  }
}
```

Conservez les lignes de progression visibles tout en masquant le texte brut des commandes/exécutions :

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "partial",
        "preview": {
          "toolProgress": true,
          "commandText": "status"
        }
      }
    }
  }
}
```

Utilisez la même structure sous la clé d’un autre canal de progression compacte, par exemple
`channels.discord`, `channels.matrix`, `channels.msteams`,
`channels.mattermost` ou les aperçus de brouillons Slack. Pour le mode brouillon de progression, placez
la même stratégie sous `streaming.progress` :

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "progress",
        "progress": {
          "toolProgress": true,
          "commandText": "status"
        }
      }
    }
  }
}
```

## Pages connexes

- [Refactorisation du cycle de vie des messages](/fr/concepts/message-lifecycle-refactor) - conception cible partagée pour l’aperçu, la modification, la diffusion et la finalisation
- [Brouillons de progression](/fr/concepts/progress-drafts) - messages visibles de travail en cours qui se mettent à jour pendant les longues interactions
- [Messages](/fr/concepts/messages) - cycle de vie et remise des messages
- [Nouvelle tentative](/fr/concepts/retry) - comportement de nouvelle tentative en cas d’échec de remise
- [Canaux](/fr/channels) - prise en charge de la diffusion par canal
