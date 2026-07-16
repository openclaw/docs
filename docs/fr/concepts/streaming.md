---
read_when:
    - Explication du fonctionnement du streaming ou du découpage en blocs sur les canaux
    - Modification du comportement de diffusion en continu par blocs ou de segmentation des canaux
    - Débogage des réponses de bloc dupliquées/prématurées ou de la diffusion en continu des aperçus de canal
summary: Comportement du streaming et du découpage en segments (réponses par blocs, streaming de l’aperçu du canal, correspondance des modes)
title: Diffusion en continu et segmentation
x-i18n:
    generated_at: "2026-07-16T13:17:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b91d2143e59d9eb0271732adf8bc87482ef0d18fe664bfa46ed375c20fdc3d93
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw possède deux couches de streaming indépendantes, et il n’existe actuellement **aucun véritable
streaming par delta de jetons** vers les messages des canaux :

- **Streaming par blocs (canaux) :** émet des **blocs** terminés à mesure que l’assistant
  écrit. Il s’agit de messages de canal normaux, et non de deltas de jetons.
- **Streaming d’aperçu (Telegram/Discord/Slack/Matrix/Mattermost/MS Teams) :**
  met à jour un **message d’aperçu** temporaire pendant la génération (envoi + modifications/ajouts).

## Streaming par blocs (messages de canal)

Le streaming par blocs envoie la sortie de l’assistant par segments grossiers à mesure qu’elle devient disponible.

```text
Sortie du modèle
  └─ text_delta/événements
       ├─ (blockStreamingBreak=text_end)
       │    └─ le découpeur émet des blocs à mesure que le tampon se remplit
       └─ (blockStreamingBreak=message_end)
            └─ le découpeur vide le tampon à message_end
                   └─ envoi au canal (réponses par blocs)
```

- `text_delta/events` : événements du flux du modèle (potentiellement rares pour les modèles sans streaming).
- `chunker` : `EmbeddedBlockChunker` appliquant les limites min./max. et la préférence de rupture.
- `channel send` : messages sortants réels (réponses par blocs).

**Paramètres** (tous sous `agents.defaults`, sauf indication contraire) :

| Clé                                                          | Valeurs / structure                                                       | Valeur par défaut |
| ------------------------------------------------------------ | ------------------------------------------------------------------------- | ----------------- |
| `blockStreamingDefault`                                      | `"on"` / `"off"`                                                        | `"off"`    |
| `blockStreamingBreak`                                        | `"text_end"` / `"message_end"`                                          | -          |
| `blockStreamingChunk`                                        | `{ minChars, maxChars, breakPreference? }`                              | -          |
| `blockStreamingCoalesce`                                     | `{ minChars?, maxChars?, idleMs? }` (fusionner les blocs diffusés avant l’envoi) | -          |
| `*.streaming.block.enabled` (remplacement propre au canal)               | `true` / `false`, impose le streaming par blocs pour chaque canal (et chaque compte)  | -          |
| `*.textChunkLimit` (par ex. `channels.whatsapp.textChunkLimit`) | nombre, limite stricte                                                        | 4000       |
| `*.streaming.chunkMode`                                      | `"length"` / `"newline"`                                                | `"length"` |
| `channels.discord.maxLinesPerMessage`                        | nombre, limite souple de lignes qui divise les réponses longues pour éviter leur rognage dans l’interface | 17         |

`streaming.chunkMode: "newline"` effectue la division au niveau des lignes vides (limites de paragraphes),
et non à chaque nouvelle ligne, avant de revenir au découpage selon la longueur lorsque le texte
dépasse la limite.

Les canaux intégrés écrivent ces remplacements sous la forme
`channels.<id>.streaming.{chunkMode,block.enabled,block.coalesce}`. Les formes plates
`*.chunkMode` / `*.blockStreaming` / `*.blockStreamingCoalesce` sont
obsolètes sur tous les canaux intégrés : `openclaw doctor --fix` les migre vers
la structure imbriquée, et les schémas des canaux les rejettent. Les configurations
de plugins SDK externes qui utilisent encore les formes plates continuent de
fonctionner grâce à un mécanisme de secours obsolète (avec un avertissement à l’exécution)
jusqu’au prochain cycle de publication.

**Sémantique des limites** pour `blockStreamingBreak` :

- `text_end` : diffuser les blocs dès que le découpeur les émet ; vider le tampon à chaque `text_end`.
- `message_end` : attendre la fin du message de l’assistant, puis vider la sortie
  mise en tampon. Le découpeur reste utilisé si le texte mis en tampon dépasse `maxChars`, ce qui lui
  permet d’émettre plusieurs segments à la fin.

### Livraison de médias avec le streaming par blocs

Les médias diffusés doivent utiliser des champs de charge utile structurés tels que `mediaUrl` ou
`mediaUrls` ; le texte diffusé n’est pas interprété comme une commande de pièce jointe. Lorsque le streaming par
blocs envoie un média de manière anticipée, OpenClaw mémorise cette livraison pour l’interaction. Si
la charge utile finale de l’assistant répète la même URL de média, la livraison finale supprime
le média en double au lieu de renvoyer la pièce jointe.

Les charges utiles finales strictement identiques sont supprimées. Si la charge utile finale ajoute
du texte distinct autour d’un média déjà diffusé, OpenClaw envoie tout de même le
nouveau texte tout en ne livrant le média qu’une seule fois. Cela évite les doublons de messages
vocaux ou de fichiers sur des canaux tels que Telegram.

## Algorithme de découpage (limites basse/haute)

Le découpage en blocs est implémenté par `EmbeddedBlockChunker` :

- **Limite basse :** ne rien émettre tant que le tampon n’est pas >= à `minChars` (sauf en cas de forçage).
- **Limite haute :** privilégier les divisions avant `maxChars` ; en cas de forçage, diviser à `maxChars`.
- **Ordre de préférence des ruptures :** `paragraph` -> `newline` -> `sentence` ->
  espace blanc -> rupture forcée.
- **Blocs de code :** ne jamais effectuer de division à l’intérieur des blocs ; en cas de forçage à `maxChars`, fermer
  puis rouvrir le bloc afin de conserver un Markdown valide.

`maxChars` est limité à la valeur `textChunkLimit` du canal ; les limites
propres au canal ne peuvent donc pas être dépassées.

## Regroupement (fusion des blocs diffusés)

Lorsque le streaming par blocs est activé, OpenClaw peut **fusionner les segments
de blocs consécutifs** avant de les envoyer, ce qui réduit l’afflux de lignes isolées tout en conservant
une sortie progressive.

- Le regroupement attend des **périodes d’inactivité** (`idleMs`) avant de vider le tampon.
- Les tampons sont limités par `maxChars` et sont vidés s’ils dépassent cette valeur.
- `minChars` empêche l’envoi de fragments minuscules tant qu’une quantité suffisante de texte ne s’est pas accumulée
  (le vidage final envoie toujours le texte restant).
- Le séparateur est déterminé à partir de `blockStreamingChunk.breakPreference` : `paragraph` ->
  `\n\n`, `newline` -> `\n`, `sentence` -> espace.
- Des remplacements propres au canal sont disponibles via `*.streaming.block.coalesce` (y compris
  les configurations propres à chaque compte).
- Par défaut, Discord, Signal et Slack regroupent les blocs selon `{ minChars: 1500, idleMs: 1000 }`,
  sauf remplacement.

## Rythme naturel entre les blocs

Lorsque le streaming par blocs est activé, une **pause aléatoire** est ajoutée entre les réponses
par blocs, après le premier bloc, afin que les réponses composées de plusieurs bulles paraissent plus naturelles.

| `agents.defaults.humanDelay.mode` | Comportement                |
| --------------------------------- | ----------------------- |
| `off` (par défaut)                   | Aucune pause                |
| `natural`                         | Pause aléatoire de 800-2500ms |
| `custom`                          | `minMs`/`maxMs`         |

Remplacement par agent via `agents.list[].humanDelay`. S’applique uniquement aux **réponses par
blocs**, et non aux réponses finales ni aux résumés d’outils.

## « Diffuser les segments ou tout envoyer »

- **Diffuser les segments :** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`
  (émettre au fur et à mesure). Les canaux autres que Telegram nécessitent également
  `*.streaming.block.enabled: true`.
- **Tout diffuser à la fin :** `blockStreamingBreak: "message_end"` (vider le tampon
  une seule fois, éventuellement en plusieurs segments si le contenu est très long).
- **Aucun streaming par blocs :** `blockStreamingDefault: "off"` (réponse finale uniquement).

Le streaming par blocs est **désactivé sauf si** `*.streaming.block.enabled` est explicitement
défini sur `true` (exception : QQ Bot ne possède aucune clé `streaming.block` et diffuse
les réponses par blocs sauf si `channels.qqbot.streaming.mode` vaut `"off"`). Les canaux peuvent
diffuser un aperçu en direct (`channels.<channel>.streaming.mode`) sans réponses par
blocs. Les valeurs par défaut de `blockStreaming*` se trouvent sous `agents.defaults`, et non à la
racine de la configuration.

## Modes de streaming d’aperçu

Clé canonique : `channels.<channel>.streaming` (`{ mode, ... }` imbriqué ; les anciennes
formes booléennes/chaînes de premier niveau sont réécrites par `openclaw doctor --fix`).

| Mode       | Comportement                                                              |
| ---------- | ------------------------------------------------------------------------- |
| `off`      | Désactiver le streaming d’aperçu                                             |
| `partial`  | Aperçu unique remplacé par le texte le plus récent                              |
| `block`    | Mises à jour de l’aperçu par étapes découpées/ajoutées                             |
| `progress` | Aperçu de la progression/de l’état pendant la génération, réponse finale à la fin |

`streaming.mode: "block"` est un mode de streaming d’aperçu destiné aux
canaux permettant la modification, tels que Discord et Telegram ; il n’active pas à lui seul la
livraison de blocs sur ces canaux. Utilisez `streaming.block.enabled` pour les réponses par blocs normales.
Microsoft Teams constitue
l’exception : il ne dispose d’aucun transport de blocs pour les brouillons d’aperçu ; `streaming.mode:
"block"` désactive donc entièrement le streaming natif et la réponse est livrée sous forme de
blocs normaux plutôt que par streaming natif partiel/de progression. Mattermost diffère également :
en mode `block`, il alterne l’aperçu entre le texte terminé et
les blocs d’activité des outils, de sorte que les blocs précédents restent visibles sous forme de publications distinctes
au lieu d’être remplacés dans un unique brouillon modifiable.

### Correspondance des canaux

| Canal      | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | Oui   | Oui       | Oui     | brouillon de progression modifiable |
| Discord    | Oui   | Oui       | Oui     | brouillon de progression modifiable |
| Slack      | Oui   | Oui       | Oui     | Oui                     |
| Mattermost | Oui   | Oui       | Oui     | Oui                     |
| MS Teams   | Oui   | Oui       | Oui     | flux de progression natif  |

La configuration des segments d’aperçu (`streaming.preview.chunk.*`, par ex. sous
`channels.discord.streaming` ou `channels.telegram.streaming`) utilise par défaut
`minChars: 200`, `maxChars: 800` (limité à la valeur `textChunkLimit` du canal) et
`breakPreference: "paragraph"`.

Slack uniquement :

- `channels.slack.streaming.nativeTransport` active ou désactive les appels à l’API de streaming native de Slack
  (`chat.startStream`/`chat.appendStream`/`chat.stopStream`) lorsque
  `channels.slack.streaming.mode="partial"` (valeur par défaut : `true`).
- Le streaming natif de Slack et l’état des fils de discussion de l’assistant Slack nécessitent une cible
  de fil de réponse. Les messages privés de premier niveau n’affichent pas cet aperçu sous forme de fil, mais peuvent
  toujours utiliser les publications d’aperçu de brouillon Slack et leurs modifications.

### Migration des anciennes clés

| Canal    | Anciennes clés                                               | État                                                                                                                                                 |
| -------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram | `streamMode`, `streaming` scalaire/booléen                    | Réécrit en `streaming.mode` par `openclaw doctor --fix` ; non lu à l’exécution                                                                        |
| Discord  | `streamMode`, `streaming` booléen                           | Réécrit en `streaming.mode` par `openclaw doctor --fix` ; non lu à l’exécution                                                                        |
| Slack    | `streamMode` ; `streaming` booléen ; ancien `nativeStreaming` | Réécrit en `streaming.mode` (et `streaming.nativeTransport` pour les formes booléennes/anciennes) par `openclaw doctor --fix` ; non lu à l’exécution         |
| Matrix   | `streaming` scalaire/booléen                                  | Réécrit en `streaming.mode` (y compris le mode `"quiet"` de Matrix) par `openclaw doctor --fix` ; non lu à l’exécution                                    |
| Feishu   | `streaming` booléen                                         | Réécrit en `streaming.mode` par `openclaw doctor --fix` ; non lu à l’exécution                                                                        |
| QQ Bot   | `streaming` booléen ; `streaming.c2cStreamApi`               | Réécrit en `streaming.mode` (et `streaming.nativeTransport` pour les formes booléennes/`c2cStreamApi`) par `openclaw doctor --fix` ; non lu à l’exécution |

## Comportement à l’exécution

### Telegram

- Utilise `sendMessage` + les mises à jour d’aperçu `editMessageText` dans les messages privés et
  les groupes/sujets ; le texte final modifie l’aperçu actif sur place. Les brouillons
  éphémères de « saisie » de 30 secondes de Telegram (`sendMessageDraft`) ne sont pas utilisés pour
  la diffusion en continu des réponses.
- Les aperçus initiaux courts restent temporisés pour optimiser l’expérience des notifications push, mais
  s’affichent après un délai limité afin que les exécutions actives ne restent pas visuellement silencieuses.
- Les longs textes finaux réutilisent le message d’aperçu pour le premier fragment et envoient uniquement les
  fragments restants.
- Le mode `block` fait basculer l’aperçu dans un nouveau message à
  `streaming.preview.chunk.maxChars` (800 par défaut, avec un plafond correspondant à la limite de modification de 4096 de Telegram) ;
  les autres modes développent un seul aperçu jusqu’à 4096 caractères.
- Le mode `progress` conserve la progression des outils dans un brouillon d’état modifiable, affiche
  le libellé d’état lorsque la diffusion en continu de la réponse est active mais qu’aucune ligne d’outil n’est
  encore disponible, efface le brouillon à la fin et envoie la réponse finale
  par le mécanisme de livraison normal.
- Si la modification finale échoue avant la confirmation du texte terminé, OpenClaw utilise
  la livraison finale normale et supprime l’aperçu obsolète.
- La diffusion en continu de l’aperçu est ignorée lorsque la diffusion en continu par blocs de Telegram est explicitement
  activée, afin d’éviter une double diffusion.
- `/reasoning stream` peut écrire le raisonnement dans un aperçu temporaire qui est
  supprimé après la livraison finale.
- Les réponses avec citation sélectionnée de Telegram constituent une exception : lorsque `replyToMode` n’est pas
  `"off"` et qu’un texte de citation sélectionné est présent, OpenClaw ignore la diffusion de l’aperçu de réponse
  pour cette interaction (la réponse finale doit emprunter le mécanisme natif de réponse avec citation),
  de sorte que les lignes d’aperçu de progression des outils ne peuvent pas s’afficher. Les réponses au message actuel
  sans texte de citation sélectionné conservent la diffusion en continu de l’aperçu. Consultez
  la [documentation du canal Telegram](/fr/channels/telegram) pour plus de détails.

### Discord

- Utilise des messages d’aperçu envoyés puis modifiés.
- Le mode `block` utilise le découpage des brouillons en fragments (`draftChunk`).
- La diffusion en continu de l’aperçu est ignorée lorsque la diffusion en continu par blocs de Discord est explicitement
  activée.
- Le mode `progress` ajoute un petit accusé d’activité `-#` (nombre de réflexions/d’appels d’outils
  et temps écoulé) à la réponse finale et supprime le brouillon d’état
  une fois cette réponse livrée, afin que les canaux très actifs ne conservent aucun journal d’outil orphelin
  au-dessus de la réponse. Pour les réponses finales en erreur, le brouillon est conservé comme trace de l’interaction
  ayant échoué.
- Les charges utiles finales contenant un média, une erreur ou une réponse explicite annulent les aperçus en attente
  sans générer de nouveau brouillon, puis utilisent la livraison normale.

### Slack

- `partial` peut utiliser la diffusion en continu native de Slack (`chat.startStream`/`append`/`stop`)
  lorsqu’elle est disponible.
- `block` utilise des aperçus de brouillon par ajout successif.
- `progress` utilise un texte d’aperçu d’état, puis la réponse finale.
- Les messages privés de premier niveau sans fil de réponse utilisent des publications d’aperçu de brouillon et des modifications
  au lieu de la diffusion en continu native de Slack.
- La diffusion en continu native et celle des aperçus de brouillon bloquent les réponses par blocs pour cette interaction, afin qu’une
  réponse Slack ne soit diffusée que par un seul mécanisme de livraison.
- Les charges utiles finales contenant un média ou une erreur, ainsi que les réponses finales de progression, ne créent pas de messages de brouillon
  temporaires ; seuls les textes finaux ou blocs finaux capables de modifier l’aperçu génèrent le texte de brouillon
  en attente.

### Mattermost

- En mode `partial`, diffuse la réflexion et le texte partiel de la réponse dans une publication unique
  d’aperçu de brouillon, finalisée sur place lorsque la réponse finale peut être envoyée en toute sécurité.
- En mode `progress`, diffuse la réflexion et l’activité des outils dans un aperçu d’état unique,
  finalisé sur place lorsque la réponse finale peut être envoyée en toute sécurité.
- En mode `block`, alterne entre les publications de texte terminé et celles d’activité des outils ;
  les mises à jour d’outils parallèles et consécutives partagent la publication actuelle d’activité des outils.
- Revient à l’envoi d’une nouvelle publication finale si la publication d’aperçu a été supprimée ou
  n’est pas disponible au moment de la finalisation.
- Les charges utiles finales contenant un média ou une erreur annulent les mises à jour d’aperçu en attente avant la livraison
  normale, au lieu de générer une publication d’aperçu temporaire.

### Matrix

- Les aperçus de brouillon sont finalisés sur place lorsque le texte final peut réutiliser l’événement
  d’aperçu.
- Les réponses finales contenant uniquement un média, une erreur ou une cible de réponse différente annulent les mises à jour d’aperçu
  en attente avant la livraison normale ; tout aperçu obsolète déjà visible est masqué.

## Mises à jour de l’aperçu de progression des outils

La diffusion en continu de l’aperçu peut également inclure des mises à jour de **progression des outils** : de courtes lignes
d’état telles que « recherche sur le Web », « lecture du fichier » ou « appel de l’outil », qui apparaissent
dans le même message d’aperçu pendant l’exécution des outils, avant la réponse finale.
En mode serveur d’application Codex, les messages de préambule/commentaire de Codex empruntent ce même
mécanisme d’aperçu, de sorte que de courtes notes de progression comme « Je vérifie... » peuvent être diffusées dans le
brouillon modifiable sans être intégrées à la réponse finale. Ainsi, les interactions
avec plusieurs étapes d’outils restent visuellement actives plutôt que silencieuses entre le premier
aperçu de réflexion et la réponse finale.

Les outils à exécution longue peuvent émettre une progression typée avant de renvoyer leur résultat. Par exemple,
`web_fetch` déclenche un minuteur de cinq secondes à son démarrage : si la récupération est toujours
en attente, l’aperçu affiche `Fetching page content...` ; si elle se termine ou
est annulée avant ce délai, aucune ligne de progression n’est émise. Le résultat final ultérieur de l’outil
est toujours transmis normalement au modèle.

Surfaces prises en charge :

- **Discord**, **Slack**, **Telegram** et **Matrix** diffusent par défaut la progression des outils et
  les mises à jour du préambule Codex dans la modification en direct de l’aperçu lorsque la diffusion en continu de l’aperçu
  est active. Microsoft Teams utilise son flux de progression natif dans
  les conversations personnelles.
- Telegram est fourni avec les mises à jour d’aperçu de progression des outils activées depuis
  `v2026.4.22` ; les maintenir activées préserve ce comportement publié.
- **Mattermost** regroupe l’activité des outils dans une publication d’aperçu unique avec les modes `partial` et
  `progress`, ou dans une publication d’activité des outils entre les blocs de texte avec le mode `block`
  (voir ci-dessus).
- Les modifications liées à la progression des outils suivent le mode actif de diffusion en continu de l’aperçu ; elles sont
  ignorées lorsque la diffusion en continu de l’aperçu est `off` ou lorsque la diffusion en continu par blocs a pris
  en charge le message. Sur Telegram, `streaming.mode: "off"` est réservé à la réponse finale : les messages
  génériques de progression sont également supprimés au lieu d’être livrés sous forme de messages d’état
  autonomes, tandis que les demandes d’approbation, les charges utiles multimédias et les erreurs sont toujours acheminées
  normalement.
- Pour conserver la diffusion en continu de l’aperçu tout en masquant les lignes de progression des outils, définissez
  `streaming.preview.toolProgress` sur `false` pour ce canal (valeur par défaut :
  `true`). Pour garder les lignes de progression des outils visibles tout en masquant le texte des commandes/exécutions,
  définissez `streaming.preview.commandText` sur `"status"` ou
  `streaming.progress.commandText` sur `"status"` ; la valeur par défaut est `"raw"` afin de
  préserver le comportement publié. Cette stratégie est commune aux canaux de brouillon/progression
  qui utilisent le moteur de rendu compact de progression d’OpenClaw, notamment Discord, Matrix,
  Microsoft Teams, Mattermost, les aperçus de brouillon Slack et Telegram. Pour désactiver
  entièrement les modifications de l’aperçu, définissez `streaming.mode` sur `off`.

## Rendu des brouillons de progression

Les brouillons en mode progression (`streaming.progress.*`) sont limités et configurables pour chaque
canal :

| Clé                               | Valeur par défaut | Comportement                                                              |
| --------------------------------- | ----------------- | ------------------------------------------------------------------------- |
| `streaming.progress.maxLines`     | `8`           | Nombre maximal de lignes de progression compactes conservées sous le libellé du brouillon |
| `streaming.progress.maxLineChars` | `120`         | Nombre maximal de caractères par ligne compacte avant troncature (respectant les mots) |
| `streaming.progress.label`        | `"auto"`      | Titre du brouillon ; chaîne personnalisée, ou `false` pour le masquer             |
| `streaming.progress.labels`       | groupe intégré    | Libellés candidats utilisés lorsque `label: "auto"`                     |

### Canal de progression des commentaires

Outre la progression des outils, le moteur de rendu compact de progression peut afficher un canal
supplémentaire dans le brouillon :

- **`streaming.progress.commentary`** - affiche le **commentaire** du modèle avant l’utilisation des outils
  (une courte narration du type « Je vais vérifier... puis... ») intercalé avec
  les lignes d’outils dans le brouillon de progression. Sur Discord et Telegram en mode progression,
  le même préambule fournit le titre d’état même lorsque ce canal facultatif
  est désactivé ; les autres canaux conservent leur comportement de progression existant. Consultez
  [Brouillons de progression](/fr/concepts/progress-drafts#status-headline).

```json
{
  "channels": {
    "discord": {
      "streaming": { "mode": "progress", "progress": { "commentary": true } }
    }
  }
}
```

Conservez les lignes de progression visibles, mais masquez le texte brut des commandes/exécutions :

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

Utilisez la même structure sous la clé d’un autre canal de progression compact, par exemple
`channels.discord`, `channels.matrix`, `channels.msteams`,
`channels.mattermost`, ou sous les aperçus de brouillon Slack. Pour le mode brouillon de progression, placez
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

## Voir aussi

- [Refactorisation du cycle de vie des messages](/fr/concepts/message-lifecycle-refactor) - conception cible commune pour les aperçus, les modifications, la diffusion en continu et la finalisation
- [Brouillons de progression](/fr/concepts/progress-drafts) - messages visibles de travail en cours qui se mettent à jour pendant les longues interactions
- [Messages](/fr/concepts/messages) - cycle de vie et livraison des messages
- [Nouvelle tentative](/fr/concepts/retry) - comportement de nouvelle tentative en cas d’échec de livraison
- [Canaux](/fr/channels) - prise en charge de la diffusion en continu pour chaque canal
