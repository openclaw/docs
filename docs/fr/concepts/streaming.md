---
read_when:
    - Expliquer le fonctionnement de la diffusion en continu ou du découpage en fragments sur les canaux
    - Modification du comportement de diffusion en continu des blocs ou de segmentation des canaux
    - Débogage des réponses de bloc dupliquées/précoces ou du streaming de prévisualisation du canal
summary: Comportement de diffusion en continu et de découpage en fragments (réponses par blocs, diffusion en continu de l’aperçu du canal, correspondance des modes)
title: Diffusion en continu et découpage en segments
x-i18n:
    generated_at: "2026-05-04T07:04:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff7b6cd8127255352fe16fb746469e9828e7d5aea183d3799ab10cc768515bd1
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw dispose de deux couches de streaming distinctes :

- **Streaming par blocs (canaux) :** émet des **blocs** terminés pendant que l’assistant écrit. Ce sont des messages de canal normaux (pas des deltas de jetons).
- **Streaming d’aperçu (Telegram/Discord/Slack) :** met à jour un **message d’aperçu** temporaire pendant la génération.

Il n’existe aujourd’hui **aucun véritable streaming de deltas de jetons** vers les messages de canal. Le streaming d’aperçu repose sur des messages (envoi + modifications/ajouts).

## Streaming par blocs (messages de canal)

Le streaming par blocs envoie la sortie de l’assistant sous forme de morceaux grossiers à mesure qu’elle devient disponible.

```
Model output
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker emits blocks as buffer grows
       └─ (blockStreamingBreak=message_end)
            └─ chunker flushes at message_end
                   └─ channel send (block replies)
```

Légende :

- `text_delta/events` : événements de flux du modèle (peuvent être rares pour les modèles sans streaming).
- `chunker` : `EmbeddedBlockChunker` appliquant des bornes min/max + une préférence de rupture.
- `channel send` : messages sortants réels (réponses par blocs).

**Contrôles :**

- `agents.defaults.blockStreamingDefault` : `"on"`/`"off"` (désactivé par défaut).
- Remplacements par canal : `*.blockStreaming` (et variantes par compte) pour forcer `"on"`/`"off"` par canal.
- `agents.defaults.blockStreamingBreak` : `"text_end"` ou `"message_end"`.
- `agents.defaults.blockStreamingChunk` : `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce` : `{ minChars?, maxChars?, idleMs? }` (fusionne les blocs streamés avant l’envoi).
- Limite stricte du canal : `*.textChunkLimit` (par exemple, `channels.whatsapp.textChunkLimit`).
- Mode de découpage du canal : `*.chunkMode` (`length` par défaut, `newline` découpe sur les lignes vides (limites de paragraphe) avant le découpage par longueur).
- Limite souple Discord : `channels.discord.maxLinesPerMessage` (17 par défaut) découpe les réponses hautes pour éviter le rognage dans l’interface.

**Sémantique des limites :**

- `text_end` : streame les blocs dès que le découpeur les émet ; vide le tampon à chaque `text_end`.
- `message_end` : attend que le message de l’assistant soit terminé, puis vide la sortie mise en tampon.

`message_end` utilise toujours le découpeur si le texte mis en tampon dépasse `maxChars`, il peut donc émettre plusieurs morceaux à la fin.

### Livraison des médias avec le streaming par blocs

Les directives `MEDIA:` sont des métadonnées de livraison normales. Quand le streaming par blocs envoie tôt un bloc média, OpenClaw mémorise cette livraison pour le tour. Si la charge utile finale de l’assistant répète la même URL de média, la livraison finale supprime le média dupliqué au lieu de renvoyer la pièce jointe.

Les charges utiles finales exactement dupliquées sont supprimées. Si la charge utile finale ajoute un texte distinct autour d’un média déjà streamé, OpenClaw envoie quand même le nouveau texte tout en conservant une livraison unique du média. Cela évite les notes vocales ou fichiers en double sur des canaux comme Telegram lorsqu’un agent émet `MEDIA:` pendant le streaming et que le fournisseur l’inclut aussi dans la réponse terminée.

## Algorithme de découpage (bornes basse/haute)

Le découpage en blocs est implémenté par `EmbeddedBlockChunker` :

- **Borne basse :** n’émet rien tant que le tampon >= `minChars` (sauf si forcé).
- **Borne haute :** préfère les ruptures avant `maxChars` ; si forcé, découpe à `maxChars`.
- **Préférence de rupture :** `paragraph` → `newline` → `sentence` → `whitespace` → rupture forcée.
- **Blocs de code :** ne découpe jamais à l’intérieur des blocs ; quand un découpage est forcé à `maxChars`, ferme puis rouvre le bloc pour conserver un Markdown valide.

`maxChars` est plafonné à la valeur `textChunkLimit` du canal, vous ne pouvez donc pas dépasser les plafonds propres à chaque canal.

## Coalescence (fusion des blocs streamés)

Lorsque le streaming par blocs est activé, OpenClaw peut **fusionner des morceaux de blocs consécutifs** avant de les envoyer. Cela réduit le « spam d’une seule ligne » tout en fournissant une sortie progressive.

- La coalescence attend des **intervalles d’inactivité** (`idleMs`) avant de vider le tampon.
- Les tampons sont plafonnés par `maxChars` et seront vidés s’ils le dépassent.
- `minChars` empêche l’envoi de fragments minuscules tant qu’assez de texte ne s’est pas accumulé (le vidage final envoie toujours le texte restant).
- Le séparateur est dérivé de `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → espace).
- Des remplacements par canal sont disponibles via `*.blockStreamingCoalesce` (y compris les configs par compte).
- La valeur par défaut de coalescence `minChars` est portée à 1500 pour Signal/Slack/Discord sauf remplacement.

## Rythme humain entre les blocs

Lorsque le streaming par blocs est activé, vous pouvez ajouter une **pause aléatoire** entre les réponses par blocs (après le premier bloc). Cela rend les réponses en plusieurs bulles plus naturelles.

- Config : `agents.defaults.humanDelay` (remplacement par agent via `agents.list[].humanDelay`).
- Modes : `off` (par défaut), `natural` (800–2500 ms), `custom` (`minMs`/`maxMs`).
- S’applique uniquement aux **réponses par blocs**, pas aux réponses finales ni aux résumés d’outils.

## « Streamer les morceaux ou tout »

Cela correspond à :

- **Streamer les morceaux :** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (émettre au fil de l’eau). Les canaux autres que Telegram ont aussi besoin de `*.blockStreaming: true`.
- **Streamer tout à la fin :** `blockStreamingBreak: "message_end"` (vider une fois, avec éventuellement plusieurs morceaux si c’est très long).
- **Pas de streaming par blocs :** `blockStreamingDefault: "off"` (réponse finale seulement).

**Note sur les canaux :** le streaming par blocs est **désactivé sauf si**
`*.blockStreaming` est explicitement défini sur `true`. Les canaux peuvent streamer un aperçu en direct
(`channels.<channel>.streaming`) sans réponses par blocs.

Rappel sur l’emplacement de la config : les valeurs par défaut `blockStreaming*` se trouvent sous
`agents.defaults`, pas à la racine de la config.

## Modes de streaming d’aperçu

Clé canonique : `channels.<channel>.streaming`

Modes :

- `off` : désactive le streaming d’aperçu.
- `partial` : aperçu unique remplacé par le dernier texte.
- `block` : mises à jour de l’aperçu par étapes découpées/ajoutées.
- `progress` : aperçu de progression/statut pendant la génération, réponse finale à la fin.

`streaming.mode: "block"` est un mode de streaming d’aperçu pour les canaux pouvant être modifiés, comme Discord et Telegram. Il n’active pas la livraison de blocs du canal à cet endroit. Utilisez `streaming.block.enabled` ou l’ancienne clé de canal `blockStreaming` lorsque vous voulez des réponses par blocs normales. Microsoft Teams est l’exception : il ne dispose pas de transport de blocs d’aperçu brouillon, donc `streaming.mode: "block"` correspond à la livraison de blocs Teams au lieu du streaming partiel/de progression natif.

### Correspondance des canaux

| Canal      | `off` | `partial` | `block` | `progress`                |
| ---------- | ----- | --------- | ------- | ------------------------- |
| Telegram   | ✅    | ✅        | ✅      | brouillon de progression modifiable |
| Discord    | ✅    | ✅        | ✅      | brouillon de progression modifiable |
| Slack      | ✅    | ✅        | ✅      | ✅                        |
| Mattermost | ✅    | ✅        | ✅      | ✅                        |
| MS Teams   | ✅    | ✅        | ✅      | flux de progression natif |

Slack uniquement :

- `channels.slack.streaming.nativeTransport` bascule les appels à l’API de streaming native Slack lorsque `channels.slack.streaming.mode="partial"` (par défaut : `true`).
- Le streaming natif Slack et le statut de fil d’assistant Slack nécessitent une cible de fil de réponse. Les DM de premier niveau n’affichent pas cet aperçu de style fil, mais ils peuvent toujours utiliser les publications et modifications d’aperçu brouillon Slack.

Migration des anciennes clés :

- Telegram : les anciennes valeurs `streamMode` et les valeurs scalaires/booléennes `streaming` sont détectées et migrées par les chemins de compatibilité doctor/config vers `streaming.mode`.
- Discord : `streamMode` + `streaming` booléen migrent automatiquement vers l’énumération `streaming`.
- Slack : `streamMode` migre automatiquement vers `streaming.mode` ; `streaming` booléen migre automatiquement vers `streaming.mode` plus `streaming.nativeTransport` ; l’ancien `nativeStreaming` migre automatiquement vers `streaming.nativeTransport`.

### Comportement à l’exécution

Telegram :

- Utilise `sendMessage` + `editMessageText` pour les mises à jour d’aperçu dans les DM et les groupes/sujets.
- Envoie un nouveau message final au lieu de modifier sur place lorsqu’un aperçu est visible depuis environ une minute, puis nettoie l’aperçu afin que l’horodatage Telegram reflète la fin de la réponse.
- Le streaming d’aperçu est ignoré lorsque le streaming par blocs Telegram est explicitement activé (pour éviter un double streaming).
- `/reasoning stream` peut écrire le raisonnement dans un aperçu transitoire supprimé après la livraison finale.

Discord :

- Utilise l’envoi + la modification de messages d’aperçu.
- Le mode `block` utilise le découpage de brouillon (`draftChunk`).
- Le streaming d’aperçu est ignoré lorsque le streaming par blocs Discord est explicitement activé.
- Les charges utiles finales de média, d’erreur et de réponse explicite annulent les aperçus en attente sans vider un nouveau brouillon, puis utilisent la livraison normale.

Slack :

- `partial` peut utiliser le streaming natif Slack (`chat.startStream`/`append`/`stop`) lorsqu’il est disponible.
- `block` utilise des aperçus brouillon par ajouts successifs.
- `progress` utilise le texte d’aperçu de statut, puis la réponse finale.
- Les DM de premier niveau sans fil de réponse utilisent des publications et modifications d’aperçu brouillon au lieu du streaming natif Slack.
- Le streaming d’aperçu natif et brouillon supprime les réponses par blocs pour ce tour, afin qu’une réponse Slack soit streamée par un seul chemin de livraison.
- Les charges utiles finales de média/erreur et les finales de progression ne créent pas de messages brouillon jetables ; seuls les finals de texte/bloc pouvant modifier l’aperçu vident le texte de brouillon en attente.

Mattermost :

- Streame la réflexion, l’activité des outils et le texte partiel de réponse dans une seule publication d’aperçu brouillon qui se finalise sur place lorsque la réponse finale peut être envoyée en toute sécurité.
- Revient à l’envoi d’une nouvelle publication finale si la publication d’aperçu a été supprimée ou n’est pas disponible au moment de la finalisation.
- Les charges utiles finales de média/erreur annulent les mises à jour d’aperçu en attente avant la livraison normale au lieu de vider une publication d’aperçu temporaire.

Matrix :

- Les aperçus brouillon se finalisent sur place lorsque le texte final peut réutiliser l’événement d’aperçu.
- Les finals média seuls, erreur et avec cible de réponse non correspondante annulent les mises à jour d’aperçu en attente avant la livraison normale ; un aperçu périmé déjà visible est supprimé.

### Mises à jour d’aperçu de progression des outils

Le streaming d’aperçu peut aussi inclure des mises à jour de **progression des outils** — de courtes lignes de statut comme « recherche sur le Web », « lecture du fichier » ou « appel de l’outil » — qui apparaissent dans le même message d’aperçu pendant l’exécution des outils, avant la réponse finale. Cela garde les tours d’outils en plusieurs étapes visuellement actifs plutôt que silencieux entre le premier aperçu de réflexion et la réponse finale.

Surfaces prises en charge :

- **Discord**, **Slack**, **Telegram** et **Matrix** streament par défaut la progression des outils dans la modification d’aperçu en direct lorsque le streaming d’aperçu est actif. Microsoft Teams utilise son flux de progression natif dans les conversations personnelles.
- Telegram est livré avec les mises à jour d’aperçu de progression des outils activées depuis `v2026.4.22` ; les garder activées préserve ce comportement publié.
- **Mattermost** intègre déjà l’activité des outils dans sa publication d’aperçu brouillon unique (voir ci-dessus).
- Les modifications de progression des outils suivent le mode de streaming d’aperçu actif ; elles sont ignorées lorsque le streaming d’aperçu est `off` ou lorsque le streaming par blocs a pris le contrôle du message. Sur Telegram, `streaming.mode: "off"` signifie final seulement : les messages génériques de progression sont aussi supprimés au lieu d’être livrés comme messages de statut autonomes, tandis que les invites d’approbation, les charges utiles média et les erreurs continuent d’être routées normalement.
- Pour conserver le streaming d’aperçu mais masquer les lignes de progression des outils, définissez `streaming.preview.toolProgress` sur `false` pour ce canal. Pour garder les lignes de progression des outils visibles tout en masquant le texte de commande/exec, définissez `streaming.preview.commandText` sur `"status"` ou `streaming.progress.commandText` sur `"status"` ; la valeur par défaut est `"raw"` afin de préserver le comportement publié. Cette politique est partagée par les canaux de brouillon/progression qui utilisent le moteur de rendu de progression compact d’OpenClaw, notamment Discord, Matrix, Microsoft Teams, Mattermost, les aperçus brouillon Slack et Telegram. Pour désactiver entièrement les modifications d’aperçu, définissez `streaming.mode` sur `off`.
- Les réponses à une citation sélectionnée Telegram sont une exception : lorsque `replyToMode` n’est pas `"off"` et qu’un texte de citation sélectionnée est présent, OpenClaw ignore le flux d’aperçu de réponse pour ce tour, si bien que les lignes d’aperçu de progression des outils ne peuvent pas s’afficher. Les réponses au message actuel sans texte de citation sélectionnée conservent le streaming d’aperçu. Consultez la [documentation du canal Telegram](/fr/channels/telegram) pour plus de détails.

Gardez les lignes de progression visibles, mais masquez le texte brut des commandes/exécutions :

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

Utilisez la même structure sous une autre clé de canal de progression compact, par exemple `channels.discord`, `channels.matrix`, `channels.msteams`, `channels.mattermost`, ou les aperçus de brouillons Slack. Pour le mode brouillon de progression, placez la même politique sous `streaming.progress` :

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

## Connexe

- [Brouillons de progression](/fr/concepts/progress-drafts) — messages de travail en cours visibles qui se mettent à jour pendant les longs tours
- [Messages](/fr/concepts/messages) — cycle de vie et livraison des messages
- [Réessayer](/fr/concepts/retry) — comportement de nouvelle tentative en cas d’échec de livraison
- [Canaux](/fr/channels) — prise en charge du streaming par canal
