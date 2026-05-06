---
read_when:
    - Explication du fonctionnement du streaming ou du découpage en fragments sur les canaux
    - Modifier le comportement de diffusion en continu par blocs ou de découpage des canaux
    - Débogage des réponses de bloc dupliquées/prématurées ou du streaming d’aperçu du canal
summary: Comportement de streaming et de découpage en fragments (réponses de bloc, streaming de l’aperçu du canal, mappage des modes)
title: Diffusion en continu et découpage en blocs
x-i18n:
    generated_at: "2026-05-06T07:21:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7ccf763c5904b9b01d127d6e9a914e73100137eba9d791654581a2ec7d4949ed
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw comporte deux couches de streaming distinctes :

- **Streaming par blocs (canaux) :** émettre des **blocs** terminés à mesure que l’assistant écrit. Ce sont des messages de canal normaux (pas des deltas de jetons).
- **Streaming d’aperçu (Telegram/Discord/Slack) :** mettre à jour un **message d’aperçu** temporaire pendant la génération.

Il n’existe aujourd’hui **aucun vrai streaming de deltas de jetons** vers les messages de canal. Le streaming d’aperçu est basé sur les messages (envoi + modifications/ajouts).

## Streaming par blocs (messages de canal)

Le streaming par blocs envoie la sortie de l’assistant par gros fragments à mesure qu’elle devient disponible.

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
- `chunker` : `EmbeddedBlockChunker` appliquant des limites min/max + une préférence de rupture.
- `channel send` : messages sortants réels (réponses par blocs).

**Contrôles :**

- `agents.defaults.blockStreamingDefault` : `"on"`/`"off"` (désactivé par défaut).
- Remplacements par canal : `*.blockStreaming` (et variantes par compte) pour forcer `"on"`/`"off"` par canal.
- `agents.defaults.blockStreamingBreak` : `"text_end"` ou `"message_end"`.
- `agents.defaults.blockStreamingChunk` : `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce` : `{ minChars?, maxChars?, idleMs? }` (fusionner les blocs streamés avant envoi).
- Limite stricte du canal : `*.textChunkLimit` (par ex., `channels.whatsapp.textChunkLimit`).
- Mode de découpage du canal : `*.chunkMode` (`length` par défaut, `newline` découpe sur les lignes vides (limites de paragraphe) avant le découpage par longueur).
- Limite souple Discord : `channels.discord.maxLinesPerMessage` (17 par défaut) découpe les réponses hautes pour éviter le rognage dans l’interface.

**Sémantique des limites :**

- `text_end` : streamer les blocs dès que le découpeur les émet ; vider à chaque `text_end`.
- `message_end` : attendre que le message de l’assistant soit terminé, puis vider la sortie mise en mémoire tampon.

`message_end` utilise quand même le découpeur si le texte mis en mémoire tampon dépasse `maxChars`, il peut donc émettre plusieurs fragments à la fin.

### Livraison des médias avec le streaming par blocs

Les directives `MEDIA:` sont des métadonnées de livraison normales. Lorsque le streaming par blocs envoie tôt un bloc média, OpenClaw mémorise cette livraison pour le tour. Si la charge utile finale de l’assistant répète la même URL de média, la livraison finale retire le média dupliqué au lieu de renvoyer la pièce jointe.

Les charges utiles finales exactement dupliquées sont supprimées. Si la charge utile finale ajoute du texte distinct autour d’un média déjà streamé, OpenClaw envoie quand même le nouveau texte tout en conservant une seule livraison du média. Cela évite les notes vocales ou fichiers dupliqués sur des canaux comme Telegram lorsqu’un agent émet `MEDIA:` pendant le streaming et que le fournisseur l’inclut aussi dans la réponse terminée.

## Algorithme de découpage (limites basse/haute)

Le découpage en blocs est implémenté par `EmbeddedBlockChunker` :

- **Limite basse :** ne rien émettre tant que le tampon >= `minChars` n’est pas atteint (sauf si forcé).
- **Limite haute :** préférer les découpages avant `maxChars` ; si forcé, découper à `maxChars`.
- **Préférence de rupture :** `paragraph` → `newline` → `sentence` → `whitespace` → rupture dure.
- **Blocs de code :** ne jamais découper à l’intérieur des blocs ; lorsqu’une rupture forcée à `maxChars` est nécessaire, fermer + rouvrir le bloc pour garder le Markdown valide.

`maxChars` est borné par le `textChunkLimit` du canal, vous ne pouvez donc pas dépasser les limites par canal.

## Coalescence (fusionner les blocs streamés)

Lorsque le streaming par blocs est activé, OpenClaw peut **fusionner les fragments de blocs consécutifs** avant de les envoyer. Cela réduit le « spam de lignes uniques » tout en fournissant une sortie progressive.

- La coalescence attend des **intervalles d’inactivité** (`idleMs`) avant de vider.
- Les tampons sont plafonnés par `maxChars` et seront vidés s’ils le dépassent.
- `minChars` empêche l’envoi de fragments minuscules tant que suffisamment de texte ne s’est pas accumulé
  (le vidage final envoie toujours le texte restant).
- Le séparateur est dérivé de `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → espace).
- Des remplacements par canal sont disponibles via `*.blockStreamingCoalesce` (y compris les configurations par compte).
- Le `minChars` de coalescence par défaut est relevé à 1500 pour Signal/Slack/Discord sauf remplacement.

## Rythme humain entre les blocs

Lorsque le streaming par blocs est activé, vous pouvez ajouter une **pause aléatoire** entre les réponses par blocs (après le premier bloc). Cela rend les réponses en plusieurs bulles plus naturelles.

- Configuration : `agents.defaults.humanDelay` (remplacement par agent via `agents.list[].humanDelay`).
- Modes : `off` (par défaut), `natural` (800-2500 ms), `custom` (`minMs`/`maxMs`).
- S’applique uniquement aux **réponses par blocs**, pas aux réponses finales ni aux résumés d’outils.

## « Streamer des fragments ou tout »

Cela correspond à :

- **Streamer des fragments :** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (émettre au fil de l’eau). Les canaux autres que Telegram nécessitent aussi `*.blockStreaming: true`.
- **Tout streamer à la fin :** `blockStreamingBreak: "message_end"` (vider une fois, éventuellement en plusieurs fragments si c’est très long).
- **Pas de streaming par blocs :** `blockStreamingDefault: "off"` (réponse finale uniquement).

**Note sur les canaux :** Le streaming par blocs est **désactivé sauf si**
`*.blockStreaming` est explicitement défini sur `true`. Les canaux peuvent streamer un aperçu en direct
(`channels.<channel>.streaming`) sans réponses par blocs.

Rappel sur l’emplacement de configuration : les valeurs par défaut `blockStreaming*` se trouvent sous
`agents.defaults`, pas dans la configuration racine.

## Modes de streaming d’aperçu

Clé canonique : `channels.<channel>.streaming`

Modes :

- `off` : désactiver le streaming d’aperçu.
- `partial` : aperçu unique remplacé par le texte le plus récent.
- `block` : l’aperçu se met à jour par étapes découpées/ajoutées.
- `progress` : aperçu de progression/statut pendant la génération, réponse finale à la fin.

`streaming.mode: "block"` est un mode de streaming d’aperçu pour les canaux capables de modifier les messages, comme Discord et Telegram. Il n’active pas la livraison par blocs sur ces canaux. Utilisez `streaming.block.enabled` ou l’ancienne clé de canal `blockStreaming` lorsque vous voulez des réponses par blocs normales. Microsoft Teams fait exception : il n’a pas de transport de blocs d’aperçu brouillon, donc `streaming.mode: "block"` correspond à la livraison par blocs Teams au lieu du streaming partiel/progression natif.

### Correspondance des canaux

| Canal      | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | ✅    | ✅        | ✅      | brouillon de progression modifiable |
| Discord    | ✅    | ✅        | ✅      | brouillon de progression modifiable |
| Slack      | ✅    | ✅        | ✅      | ✅                      |
| Mattermost | ✅    | ✅        | ✅      | ✅                      |
| MS Teams   | ✅    | ✅        | ✅      | flux de progression natif |

Slack uniquement :

- `channels.slack.streaming.nativeTransport` active/désactive les appels à l’API de streaming native Slack lorsque `channels.slack.streaming.mode="partial"` (par défaut : `true`).
- Le streaming natif Slack et le statut de fil d’assistant Slack nécessitent une cible de fil de réponse. Les DM de premier niveau n’affichent pas cet aperçu de style fil, mais ils peuvent toujours utiliser des publications d’aperçu brouillon Slack et des modifications.

Migration des anciennes clés :

- Telegram : les anciennes valeurs `streamMode` et les valeurs scalaires/booléennes `streaming` sont détectées et migrées par les chemins de compatibilité doctor/config vers `streaming.mode`.
- Discord : `streamMode` + `streaming` booléen migrent automatiquement vers l’énumération `streaming`.
- Slack : `streamMode` migre automatiquement vers `streaming.mode` ; `streaming` booléen migre automatiquement vers `streaming.mode` plus `streaming.nativeTransport` ; l’ancien `nativeStreaming` migre automatiquement vers `streaming.nativeTransport`.

### Comportement à l’exécution

Telegram :

- Utilise `sendMessage` + `editMessageText` pour les mises à jour d’aperçu dans les DM et les groupes/sujets.
- Le texte final modifie l’aperçu actif sur place ; les textes finaux longs réutilisent ce message pour le premier fragment et n’envoient que les fragments restants.
- Le mode `progress` conserve la progression des outils dans un brouillon de statut modifiable, efface ce brouillon à la fin et envoie la réponse finale via la livraison normale.
- Si la modification finale échoue avant que le texte terminé soit confirmé, OpenClaw utilise la livraison finale normale et nettoie l’aperçu obsolète.
- Le streaming d’aperçu est ignoré lorsque le streaming par blocs Telegram est explicitement activé (pour éviter le double streaming).
- `/reasoning stream` peut écrire le raisonnement dans un aperçu transitoire qui est supprimé après la livraison finale.

Discord :

- Utilise l’envoi + la modification des messages d’aperçu.
- Le mode `block` utilise le découpage de brouillon (`draftChunk`).
- Le streaming d’aperçu est ignoré lorsque le streaming par blocs Discord est explicitement activé.
- Les charges utiles de média final, d’erreur et de réponse explicite annulent les aperçus en attente sans vider un nouveau brouillon, puis utilisent la livraison normale.

Slack :

- `partial` peut utiliser le streaming natif Slack (`chat.startStream`/`append`/`stop`) lorsqu’il est disponible.
- `block` utilise des aperçus brouillon de style ajout.
- `progress` utilise un texte d’aperçu de statut, puis la réponse finale.
- Les DM de premier niveau sans fil de réponse utilisent des publications d’aperçu brouillon et des modifications au lieu du streaming natif Slack.
- Le streaming d’aperçu natif et brouillon supprime les réponses par blocs pour ce tour, de sorte qu’une réponse Slack soit streamée par un seul chemin de livraison.
- Les charges utiles finales de média/erreur et les fins de progression ne créent pas de messages brouillon jetables ; seuls les textes/blocs finaux capables de modifier l’aperçu vident le texte brouillon en attente.

Mattermost :

- Streame la réflexion, l’activité des outils et le texte de réponse partiel dans une seule publication d’aperçu brouillon qui se finalise sur place lorsque la réponse finale peut être envoyée en toute sécurité.
- Revient à l’envoi d’une nouvelle publication finale si la publication d’aperçu a été supprimée ou est autrement indisponible au moment de la finalisation.
- Les charges utiles finales de média/erreur annulent les mises à jour d’aperçu en attente avant la livraison normale au lieu de vider une publication d’aperçu temporaire.

Matrix :

- Les aperçus brouillon se finalisent sur place lorsque le texte final peut réutiliser l’événement d’aperçu.
- Les fins média uniquement, erreur et avec incohérence de cible de réponse annulent les mises à jour d’aperçu en attente avant la livraison normale ; un aperçu obsolète déjà visible est expurgé.

### Mises à jour d’aperçu de progression des outils

Le streaming d’aperçu peut également inclure des mises à jour de **progression des outils** - de courtes lignes de statut comme « recherche sur le web », « lecture de fichier » ou « appel d’outil » - qui apparaissent dans le même message d’aperçu pendant l’exécution des outils, avant la réponse finale. Cela garde les tours d’outils en plusieurs étapes visuellement actifs plutôt que silencieux entre le premier aperçu de réflexion et la réponse finale.

Surfaces prises en charge :

- **Discord**, **Slack**, **Telegram** et **Matrix** diffusent par défaut la progression des outils dans la modification de l’aperçu en direct lorsque le streaming d’aperçu est actif. Microsoft Teams utilise son flux de progression natif dans les discussions personnelles.
- Telegram est livré avec les mises à jour d’aperçu de progression des outils activées depuis `v2026.4.22` ; les garder activées préserve ce comportement publié.
- **Mattermost** intègre déjà l’activité des outils dans sa publication unique d’aperçu de brouillon (voir ci-dessus).
- Les modifications de progression des outils suivent le mode de streaming d’aperçu actif ; elles sont ignorées lorsque le streaming d’aperçu est `off` ou lorsque le streaming par blocs a pris le relais du message. Sur Telegram, `streaming.mode: "off"` signifie uniquement final : le bavardage de progression générique est également supprimé au lieu d’être envoyé comme messages d’état autonomes, tandis que les demandes d’approbation, les charges utiles multimédias et les erreurs sont toujours routées normalement.
- Pour conserver le streaming d’aperçu tout en masquant les lignes de progression des outils, définissez `streaming.preview.toolProgress` sur `false` pour ce canal. Pour garder les lignes de progression des outils visibles tout en masquant le texte brut de commande/exécution, définissez `streaming.preview.commandText` sur `"status"` ou `streaming.progress.commandText` sur `"status"` ; la valeur par défaut est `"raw"` afin de préserver le comportement publié. Cette politique est partagée par les canaux de brouillon/progression qui utilisent le moteur de rendu compact de progression d’OpenClaw, notamment Discord, Matrix, Microsoft Teams, Mattermost, les aperçus de brouillon Slack et Telegram. Pour désactiver entièrement les modifications d’aperçu, définissez `streaming.mode` sur `off`.
- Les réponses avec citation sélectionnée sur Telegram constituent une exception : lorsque `replyToMode` n’est pas `"off"` et qu’un texte de citation sélectionné est présent, OpenClaw ignore le flux d’aperçu de réponse pour ce tour, de sorte que les lignes d’aperçu de progression des outils ne peuvent pas s’afficher. Les réponses au message actuel sans texte de citation sélectionné conservent toujours le streaming d’aperçu. Consultez la [documentation du canal Telegram](/fr/channels/telegram) pour plus de détails.

Gardez les lignes de progression visibles, mais masquez le texte brut de commande/exécution :

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

Utilisez la même forme sous une autre clé de canal de progression compacte, par exemple `channels.discord`, `channels.matrix`, `channels.msteams`, `channels.mattermost` ou les aperçus de brouillon Slack. Pour le mode brouillon de progression, placez la même politique sous `streaming.progress` :

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

## Associé

- [Refactorisation du cycle de vie des messages](/fr/concepts/message-lifecycle-refactor) - conception cible partagée de l’aperçu, de la modification, du flux et de la finalisation
- [Brouillons de progression](/fr/concepts/progress-drafts) - messages visibles de travail en cours qui se mettent à jour pendant les longs tours
- [Messages](/fr/concepts/messages) - cycle de vie et livraison des messages
- [Nouvelle tentative](/fr/concepts/retry) - comportement de nouvelle tentative en cas d’échec de livraison
- [Canaux](/fr/channels) - prise en charge du streaming par canal
