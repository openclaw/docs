---
read_when:
    - Expliquer le fonctionnement du streaming ou du découpage en blocs sur les canaux
    - Modifier le comportement du streaming par blocs ou du découpage en segments du canal
    - Déboguer les réponses de bloc dupliquées/précoces ou le streaming d’aperçu du canal
summary: Comportement de streaming + découpage en morceaux (réponses en blocs, streaming de l’aperçu du canal, correspondance des modes)
title: Streaming et segmentation
x-i18n:
    generated_at: "2026-07-01T05:39:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2724c21414dd470780f0c7f634380bef3feeb54a08bd0da3e944173340df1c80
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw possède deux couches de streaming distinctes :

- **Streaming par blocs (canaux) :** émet des **blocs** terminés pendant que l’assistant écrit. Ce sont des messages de canal normaux (pas des deltas de jetons).
- **Streaming d’aperçu (Telegram/Discord/Slack) :** met à jour un **message d’aperçu** temporaire pendant la génération.

Il n’existe aujourd’hui **aucun véritable streaming par deltas de jetons** vers les messages de canal. Le streaming d’aperçu est basé sur les messages (envoi + modifications/ajouts).

## Streaming par blocs (messages de canal)

Le streaming par blocs envoie la sortie de l’assistant par fragments grossiers à mesure qu’elle devient disponible.

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

- `text_delta/events` : événements de flux du modèle (peuvent être clairsemés pour les modèles sans streaming).
- `chunker` : `EmbeddedBlockChunker` appliquant des bornes min/max + une préférence de rupture.
- `channel send` : messages sortants réels (réponses par blocs).

**Contrôles :**

- `agents.defaults.blockStreamingDefault` : `"on"`/`"off"` (désactivé par défaut).
- Surcharges de canal : `*.blockStreaming` (et variantes par compte) pour forcer `"on"`/`"off"` par canal.
- `agents.defaults.blockStreamingBreak` : `"text_end"` ou `"message_end"`.
- `agents.defaults.blockStreamingChunk` : `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce` : `{ minChars?, maxChars?, idleMs? }` (fusionne les blocs streamés avant l’envoi).
- Limite stricte du canal : `*.textChunkLimit` (par exemple, `channels.whatsapp.textChunkLimit`).
- Mode de découpage du canal : `*.chunkMode` (`length` par défaut, `newline` découpe sur les lignes vides (limites de paragraphes) avant le découpage par longueur).
- Limite souple Discord : `channels.discord.maxLinesPerMessage` (17 par défaut) découpe les réponses hautes pour éviter le rognage dans l’UI.

**Sémantique des limites :**

- `text_end` : streamer les blocs dès que le découpeur les émet ; vider le tampon à chaque `text_end`.
- `message_end` : attendre la fin du message de l’assistant, puis vider la sortie mise en tampon.

`message_end` utilise toujours le découpeur si le texte mis en tampon dépasse `maxChars`, il peut donc émettre plusieurs fragments à la fin.

### Livraison de médias avec le streaming par blocs

Les médias streamés doivent utiliser des champs de charge utile structurés tels que `mediaUrl` ou
`mediaUrls` ; le texte streamé n’est pas analysé comme une commande de pièce jointe. Lorsque le streaming par blocs
envoie un média tôt, OpenClaw mémorise cette livraison pour le tour. Si
la charge utile finale de l’assistant répète la même URL de média, la livraison finale
retire le média dupliqué au lieu d’envoyer à nouveau la pièce jointe.

Les charges utiles finales exactement dupliquées sont supprimées. Si la charge utile finale ajoute
un texte distinct autour d’un média déjà streamé, OpenClaw envoie tout de même le
nouveau texte tout en conservant une livraison unique du média. Cela évite les notes vocales
ou fichiers dupliqués sur des canaux comme Telegram.

## Algorithme de découpage (bornes basse/haute)

Le découpage en blocs est implémenté par `EmbeddedBlockChunker` :

- **Borne basse :** ne rien émettre tant que le tampon >= `minChars` n’est pas atteint (sauf si forcé).
- **Borne haute :** préférer les coupures avant `maxChars` ; si forcé, couper à `maxChars`.
- **Préférence de rupture :** `paragraph` → `newline` → `sentence` → `whitespace` → rupture dure.
- **Blocs de code :** ne jamais couper à l’intérieur des blocs ; lorsque la coupure est forcée à `maxChars`, fermer + rouvrir le bloc pour garder le Markdown valide.

`maxChars` est plafonné à la `textChunkLimit` du canal, vous ne pouvez donc pas dépasser les limites par canal.

## Coalescence (fusionner les blocs streamés)

Lorsque le streaming par blocs est activé, OpenClaw peut **fusionner les fragments de blocs consécutifs**
avant de les envoyer. Cela réduit le « spam de lignes uniques » tout en fournissant
une sortie progressive.

- La coalescence attend des **pauses d’inactivité** (`idleMs`) avant de vider le tampon.
- Les tampons sont plafonnés par `maxChars` et seront vidés s’ils le dépassent.
- `minChars` empêche l’envoi de fragments minuscules tant que suffisamment de texte ne s’est pas accumulé
  (le vidage final envoie toujours le texte restant).
- Le séparateur est dérivé de `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → espace).
- Des surcharges de canal sont disponibles via `*.blockStreamingCoalesce` (y compris les configurations par compte).
- La valeur par défaut de coalescence `minChars` passe à 1500 pour Signal/Slack/Discord sauf surcharge.

## Cadence naturelle entre les blocs

Lorsque le streaming par blocs est activé, vous pouvez ajouter une **pause aléatoire** entre
les réponses par blocs (après le premier bloc). Les réponses à plusieurs bulles paraissent ainsi
plus naturelles.

- Configuration : `agents.defaults.humanDelay` (surcharge par agent via `agents.list[].humanDelay`).
- Modes : `off` (par défaut), `natural` (800-2500 ms), `custom` (`minMs`/`maxMs`).
- S’applique uniquement aux **réponses par blocs**, pas aux réponses finales ni aux résumés d’outils.

## « Streamer des fragments ou tout »

Cela correspond à :

- **Streamer des fragments :** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (émettre au fil de l’eau). Les canaux autres que Telegram ont aussi besoin de `*.blockStreaming: true`.
- **Tout streamer à la fin :** `blockStreamingBreak: "message_end"` (vider une fois, éventuellement en plusieurs fragments si très long).
- **Aucun streaming par blocs :** `blockStreamingDefault: "off"` (réponse finale uniquement).

**Note de canal :** le streaming par blocs est **désactivé sauf si**
`*.blockStreaming` est explicitement défini sur `true`. Les canaux peuvent streamer un aperçu en direct
(`channels.<channel>.streaming`) sans réponses par blocs.

Rappel sur l’emplacement de configuration : les valeurs par défaut `blockStreaming*` se trouvent sous
`agents.defaults`, pas dans la configuration racine.

## Modes de streaming d’aperçu

Clé canonique : `channels.<channel>.streaming`

Modes :

- `off` : désactiver le streaming d’aperçu.
- `partial` : aperçu unique remplacé par le dernier texte.
- `block` : mises à jour d’aperçu par étapes découpées/ajoutées.
- `progress` : aperçu de progression/statut pendant la génération, réponse finale à la fin.

`streaming.mode: "block"` est un mode de streaming d’aperçu pour les canaux capables de modification
comme Discord et Telegram. Il n’active pas la livraison par blocs du canal sur ces canaux.
Utilisez `streaming.block.enabled` ou l’ancienne clé de canal `blockStreaming` lorsque
vous voulez des réponses par blocs normales. Microsoft Teams fait exception : il n’a pas
de transport de bloc d’aperçu brouillon, donc `streaming.mode: "block"` correspond à la livraison par blocs Teams
au lieu du streaming partiel/progression natif.

### Correspondance des canaux

| Canal      | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | ✅    | ✅        | ✅      | brouillon de progression modifiable |
| Discord    | ✅    | ✅        | ✅      | brouillon de progression modifiable |
| Slack      | ✅    | ✅        | ✅      | ✅                      |
| Mattermost | ✅    | ✅        | ✅      | ✅                      |
| MS Teams   | ✅    | ✅        | ✅      | flux de progression natif  |

Slack uniquement :

- `channels.slack.streaming.nativeTransport` active ou désactive les appels à l’API de streaming native de Slack lorsque `channels.slack.streaming.mode="partial"` (par défaut : `true`).
- Le streaming natif Slack et le statut de fil d’assistant Slack nécessitent une cible de fil de réponse. Les DM de premier niveau n’affichent pas cet aperçu de style fil, mais ils peuvent toujours utiliser les publications et modifications d’aperçu brouillon Slack.

Migration des anciennes clés :

- Telegram : les anciennes valeurs `streamMode` et `streaming` scalaires/booléennes sont détectées et migrées par les chemins de compatibilité doctor/config vers `streaming.mode`.
- Discord : `streamMode` + `streaming` booléen restent des alias d’exécution pour l’énumération `streaming` ; exécutez `openclaw doctor --fix` pour réécrire la configuration persistée.
- Slack : `streamMode` reste un alias d’exécution pour `streaming.mode` ; `streaming` booléen reste un alias d’exécution pour `streaming.mode` plus `streaming.nativeTransport` ; l’ancien `nativeStreaming` reste un alias d’exécution pour `streaming.nativeTransport`. Exécutez `openclaw doctor --fix` pour réécrire la configuration persistée.

### Comportement à l’exécution

Telegram :

- Utilise `sendMessage` + `editMessageText` pour les mises à jour d’aperçu dans les DM et les groupes/sujets.
- Les aperçus initiaux courts sont toujours soumis à un debounce pour l’expérience des notifications push, mais Telegram les matérialise désormais après un délai borné afin que les exécutions actives ne restent pas visuellement silencieuses.
- Le texte final modifie l’aperçu actif sur place ; les finales longues réutilisent ce message pour le premier fragment et n’envoient que les fragments restants.
- Le mode `block` fait tourner l’aperçu vers un nouveau message à `streaming.preview.chunk.maxChars` (800 par défaut, plafonné à la limite de modification Telegram de 4096) ; les autres modes font croître un aperçu unique jusqu’à 4096 caractères.
- Le mode `progress` conserve la progression des outils dans un brouillon de statut modifiable, matérialise le libellé de statut lorsque le streaming de réponse est actif mais qu’aucune ligne d’outil n’est encore disponible, efface ce brouillon à la fin et envoie la réponse finale via la livraison normale.
- Si la modification finale échoue avant que le texte terminé soit confirmé, OpenClaw utilise la livraison finale normale et nettoie l’aperçu obsolète.
- Le streaming d’aperçu est ignoré lorsque le streaming par blocs Telegram est explicitement activé (pour éviter le double streaming).
- `/reasoning stream` peut écrire le raisonnement dans un aperçu transitoire supprimé après la livraison finale.

Discord :

- Utilise l’envoi + la modification des messages d’aperçu.
- Le mode `block` utilise le découpage de brouillon (`draftChunk`).
- Le streaming d’aperçu est ignoré lorsque le streaming par blocs Discord est explicitement activé.
- Les charges utiles finales de médias, d’erreurs et de réponses explicites annulent les aperçus en attente sans vider de nouveau brouillon, puis utilisent la livraison normale.

Slack :

- `partial` peut utiliser le streaming natif Slack (`chat.startStream`/`append`/`stop`) lorsqu’il est disponible.
- `block` utilise des aperçus brouillon de type ajout.
- `progress` utilise le texte d’aperçu de statut, puis la réponse finale.
- Les DM de premier niveau sans fil de réponse utilisent des publications et modifications d’aperçu brouillon au lieu du streaming natif Slack.
- Le streaming d’aperçu natif et brouillon supprime les réponses par blocs pour ce tour, afin qu’une réponse Slack soit streamée par un seul chemin de livraison.
- Les charges utiles finales de médias/erreurs et les finales de progression ne créent pas de messages brouillon jetables ; seuls les textes/blocs finaux pouvant modifier l’aperçu vident le texte brouillon en attente.

Mattermost :

- Streame la réflexion, l’activité des outils et le texte de réponse partiel dans une publication d’aperçu brouillon unique qui se finalise sur place lorsque la réponse finale peut être envoyée en sécurité.
- Se rabat sur l’envoi d’une nouvelle publication finale si la publication d’aperçu a été supprimée ou est autrement indisponible au moment de la finalisation.
- Les charges utiles finales de médias/erreurs annulent les mises à jour d’aperçu en attente avant la livraison normale au lieu de vider une publication d’aperçu temporaire.

Matrix :

- Les aperçus brouillon se finalisent sur place lorsque le texte final peut réutiliser l’événement d’aperçu.
- Les finales média uniquement, d’erreur et avec cible de réponse non correspondante annulent les mises à jour d’aperçu en attente avant la livraison normale ; un aperçu obsolète déjà visible est expurgé.

### Mises à jour d’aperçu de progression des outils

Le streaming d’aperçu peut aussi inclure des mises à jour de **progression des outils** — de courtes lignes de statut comme « recherche sur le web », « lecture du fichier » ou « appel de l’outil » — qui apparaissent dans le même message d’aperçu pendant l’exécution des outils, avant la réponse finale. En mode serveur d’application Codex, les messages de préambule/commentaire Codex utilisent ce même chemin d’aperçu, de sorte que de courtes notes de progression « Je vérifie... » peuvent être streamées dans le brouillon modifiable sans faire partie de la réponse finale. Cela garde les tours d’outils en plusieurs étapes visuellement actifs au lieu de rester silencieux entre le premier aperçu de réflexion et la réponse finale.

Les outils à longue durée d’exécution peuvent émettre une progression typée avant de retourner. Par exemple,
`web_fetch` arme un minuteur de cinq secondes lorsqu’il démarre : si la récupération est toujours
en attente, l’aperçu peut afficher `Fetching page content...` ; si la récupération se termine
ou est annulée avant cela, aucune ligne de progression n’est émise. Le résultat final ultérieur de l’outil
est toujours livré normalement au modèle.

Surfaces prises en charge :

- **Discord**, **Slack**, **Telegram** et **Matrix** diffusent par défaut les mises à jour de progression des outils et de préambule Codex dans la modification de l’aperçu en direct lorsque le streaming d’aperçu est actif. Microsoft Teams utilise son flux de progression natif dans les discussions personnelles.
- Telegram est livré avec les mises à jour d’aperçu de progression des outils activées depuis `v2026.4.22` ; les garder activées préserve ce comportement publié.
- **Mattermost** intègre déjà l’activité des outils dans sa publication unique d’aperçu de brouillon (voir ci-dessus).
- Les modifications de progression des outils suivent le mode de streaming d’aperçu actif ; elles sont ignorées lorsque le streaming d’aperçu est `off` ou lorsque le streaming par blocs a pris le relais du message. Sur Telegram, `streaming.mode: "off"` signifie réponse finale uniquement : les messages génériques de progression sont également supprimés au lieu d’être envoyés comme messages d’état autonomes, tandis que les demandes d’approbation, les charges utiles multimédias et les erreurs sont toujours routées normalement.
- Pour conserver le streaming d’aperçu tout en masquant les lignes de progression des outils, définissez `streaming.preview.toolProgress` sur `false` pour ce canal. Pour garder les lignes de progression des outils visibles tout en masquant le texte des commandes/exécutions, définissez `streaming.preview.commandText` sur `"status"` ou `streaming.progress.commandText` sur `"status"` ; la valeur par défaut est `"raw"` afin de préserver le comportement publié. Cette politique est partagée par les canaux de brouillon/progression qui utilisent le moteur de rendu de progression compact d’OpenClaw, notamment Discord, Matrix, Microsoft Teams, les aperçus de brouillon Mattermost, Slack et Telegram. Pour désactiver entièrement les modifications d’aperçu, définissez `streaming.mode` sur `off`.
- Les réponses à des citations sélectionnées dans Telegram font exception : lorsque `replyToMode` n’est pas `"off"` et qu’un texte de citation sélectionné est présent, OpenClaw ignore le flux d’aperçu de la réponse pour ce tour afin que les lignes d’aperçu de progression des outils ne puissent pas s’afficher. Les réponses au message actuel sans texte de citation sélectionné conservent tout de même le streaming d’aperçu. Consultez la [documentation du canal Telegram](/fr/channels/telegram) pour plus de détails.

### Couloir de progression des commentaires

Au-delà de la progression des outils, le moteur de rendu de progression compact peut afficher un couloir supplémentaire dans le brouillon :

- **`streaming.progress.commentary`** — affiche le **commentaire** pré-outil du modèle (💬) — une brève narration du type « Je vais vérifier… puis… » — intercalée avec les lignes d’outils dans le brouillon de progression.

```json
{
  "channels": {
    "discord": {
      "streaming": { "mode": "progress", "progress": { "commentary": true } }
    }
  }
}
```

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

Utilisez la même forme sous une autre clé de canal de progression compact, par exemple `channels.discord`, `channels.matrix`, `channels.msteams`, `channels.mattermost` ou les aperçus de brouillon Slack. Pour le mode brouillon de progression, placez la même politique sous `streaming.progress` :

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

- [Refactorisation du cycle de vie des messages](/fr/concepts/message-lifecycle-refactor) - conception cible partagée pour l’aperçu, la modification, le flux et la finalisation
- [Brouillons de progression](/fr/concepts/progress-drafts) - messages de travail en cours visibles qui se mettent à jour pendant les longs tours
- [Messages](/fr/concepts/messages) - cycle de vie et livraison des messages
- [Nouvelle tentative](/fr/concepts/retry) - comportement de nouvelle tentative en cas d’échec de livraison
- [Canaux](/fr/channels) - prise en charge du streaming par canal
