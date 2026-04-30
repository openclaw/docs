---
read_when:
    - Expliquer le fonctionnement de la diffusion en continu ou du découpage en fragments sur les canaux
    - Modifier le comportement du streaming de blocs ou du découpage en fragments des canaux
    - Débogage des réponses par bloc dupliquées ou anticipées, ou de la diffusion en continu de l’aperçu du canal
summary: Comportement de diffusion en continu + segmentation (réponses par blocs, diffusion en continu de l’aperçu du canal, mappage des modes)
title: Diffusion en continu et découpage en blocs
x-i18n:
    generated_at: "2026-04-30T07:24:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: d428355e1a0dbd426c4807add2b15fcfb09776849681bfeb2293173a2d31ee4f
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw possède deux couches de streaming distinctes :

- **Streaming par blocs (canaux) :** émet des **blocs** terminés pendant que l’assistant écrit. Ce sont des messages de canal normaux (pas des deltas de jetons).
- **Streaming d’aperçu (Telegram/Discord/Slack) :** met à jour un **message d’aperçu** temporaire pendant la génération.

Il n’existe aujourd’hui **aucun véritable streaming de deltas de jetons** vers les messages de canal. Le streaming d’aperçu est basé sur des messages (envoi + modifications/ajouts).

## Streaming par blocs (messages de canal)

Le streaming par blocs envoie la sortie de l’assistant en fragments grossiers à mesure qu’elle devient disponible.

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
- `chunker` : `EmbeddedBlockChunker` appliquant les bornes min/max + la préférence de coupure.
- `channel send` : messages sortants réels (réponses par blocs).

**Contrôles :**

- `agents.defaults.blockStreamingDefault` : `"on"`/`"off"` (désactivé par défaut).
- Remplacements par canal : `*.blockStreaming` (et variantes par compte) pour forcer `"on"`/`"off"` par canal.
- `agents.defaults.blockStreamingBreak` : `"text_end"` ou `"message_end"`.
- `agents.defaults.blockStreamingChunk` : `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce` : `{ minChars?, maxChars?, idleMs? }` (fusionne les blocs diffusés avant l’envoi).
- Plafond strict du canal : `*.textChunkLimit` (par exemple, `channels.whatsapp.textChunkLimit`).
- Mode de découpage du canal : `*.chunkMode` (`length` par défaut, `newline` découpe sur les lignes vides (limites de paragraphes) avant le découpage par longueur).
- Plafond souple de Discord : `channels.discord.maxLinesPerMessage` (17 par défaut) découpe les réponses hautes pour éviter le rognage dans l’interface.

**Sémantique des limites :**

- `text_end` : diffuse les blocs dès que le chunker les émet ; vide le tampon à chaque `text_end`.
- `message_end` : attend que le message de l’assistant soit terminé, puis vide la sortie mise en tampon.

`message_end` utilise toujours le chunker si le texte mis en tampon dépasse `maxChars`, ce qui lui permet d’émettre plusieurs fragments à la fin.

### Livraison des médias avec le streaming par blocs

Les directives `MEDIA:` sont des métadonnées de livraison normales. Lorsque le streaming par blocs envoie un bloc média tôt, OpenClaw mémorise cette livraison pour le tour. Si la charge utile finale de l’assistant répète la même URL de média, la livraison finale retire le média dupliqué au lieu de renvoyer la pièce jointe.

Les charges utiles finales exactement dupliquées sont supprimées. Si la charge utile finale ajoute du texte distinct autour d’un média déjà diffusé, OpenClaw envoie tout de même le nouveau texte tout en conservant une livraison unique du média. Cela évite les notes vocales ou fichiers en double sur des canaux comme Telegram lorsqu’un agent émet `MEDIA:` pendant le streaming et que le fournisseur l’inclut aussi dans la réponse terminée.

## Algorithme de découpage (bornes basse/haute)

Le découpage par blocs est implémenté par `EmbeddedBlockChunker` :

- **Borne basse :** ne pas émettre tant que le tampon >= `minChars` (sauf si forcé).
- **Borne haute :** privilégier les coupures avant `maxChars` ; si forcé, couper à `maxChars`.
- **Préférence de coupure :** `paragraph` → `newline` → `sentence` → `whitespace` → coupure dure.
- **Blocs de code :** ne jamais couper à l’intérieur des blocs ; lorsqu’une coupure est forcée à `maxChars`, fermer + rouvrir le bloc pour conserver un Markdown valide.

`maxChars` est limité au `textChunkLimit` du canal, donc vous ne pouvez pas dépasser les plafonds propres à chaque canal.

## Coalescence (fusion des blocs diffusés)

Lorsque le streaming par blocs est activé, OpenClaw peut **fusionner des fragments de blocs consécutifs** avant de les envoyer. Cela réduit le « spam de lignes uniques » tout en fournissant une sortie progressive.

- La coalescence attend des **intervalles d’inactivité** (`idleMs`) avant de vider le tampon.
- Les tampons sont plafonnés par `maxChars` et seront vidés s’ils le dépassent.
- `minChars` empêche l’envoi de fragments minuscules tant que suffisamment de texte ne s’est pas accumulé (le vidage final envoie toujours le texte restant).
- Le séparateur est dérivé de `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → espace).
- Des remplacements par canal sont disponibles via `*.blockStreamingCoalesce` (y compris les configurations par compte).
- La valeur par défaut de coalescence `minChars` passe à 1500 pour Signal/Slack/Discord sauf remplacement.

## Rythme humain entre les blocs

Lorsque le streaming par blocs est activé, vous pouvez ajouter une **pause aléatoire** entre les réponses par blocs (après le premier bloc). Cela rend les réponses en plusieurs bulles plus naturelles.

- Configuration : `agents.defaults.humanDelay` (remplacement par agent via `agents.list[].humanDelay`).
- Modes : `off` (par défaut), `natural` (800–2500 ms), `custom` (`minMs`/`maxMs`).
- S’applique uniquement aux **réponses par blocs**, pas aux réponses finales ni aux résumés d’outils.

## « Diffuser les fragments ou tout diffuser »

Cela correspond à :

- **Diffuser les fragments :** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (émettre au fil de l’eau). Les canaux autres que Telegram nécessitent aussi `*.blockStreaming: true`.
- **Tout diffuser à la fin :** `blockStreamingBreak: "message_end"` (vider une fois, éventuellement en plusieurs fragments si très long).
- **Pas de streaming par blocs :** `blockStreamingDefault: "off"` (réponse finale uniquement).

**Note sur les canaux :** le streaming par blocs est **désactivé sauf si**
`*.blockStreaming` est explicitement défini sur `true`. Les canaux peuvent diffuser un aperçu en direct
(`channels.<channel>.streaming`) sans réponses par blocs.

Rappel d’emplacement de configuration : les valeurs par défaut `blockStreaming*` se trouvent sous
`agents.defaults`, pas dans la configuration racine.

## Modes de streaming d’aperçu

Clé canonique : `channels.<channel>.streaming`

Modes :

- `off` : désactive le streaming d’aperçu.
- `partial` : aperçu unique remplacé par le dernier texte.
- `block` : aperçu mis à jour par étapes fragmentées/ajoutées.
- `progress` : aperçu de progression/état pendant la génération, réponse finale à l’achèvement.

### Correspondance des canaux

| Canal      | `off` | `partial` | `block` | `progress`                  |
| ---------- | ----- | --------- | ------- | --------------------------- |
| Telegram   | ✅    | ✅        | ✅      | correspond à `partial`      |
| Discord    | ✅    | ✅        | ✅      | correspond à `partial`      |
| Slack      | ✅    | ✅        | ✅      | ✅                          |
| Mattermost | ✅    | ✅        | ✅      | ✅                          |

Slack uniquement :

- `channels.slack.streaming.nativeTransport` active ou désactive les appels à l’API de streaming native Slack lorsque `channels.slack.streaming.mode="partial"` (par défaut : `true`).
- Le streaming natif Slack et l’état de fil de l’assistant Slack nécessitent une cible de fil de réponse ; les DM de premier niveau n’affichent pas cet aperçu de type fil.

Migration des anciennes clés :

- Telegram : les anciens `streamMode` et valeurs scalaires/booléennes `streaming` sont détectés et migrés par les chemins de compatibilité doctor/config vers `streaming.mode`.
- Discord : `streamMode` + `streaming` booléen migrent automatiquement vers l’énumération `streaming`.
- Slack : `streamMode` migre automatiquement vers `streaming.mode` ; `streaming` booléen migre automatiquement vers `streaming.mode` plus `streaming.nativeTransport` ; l’ancien `nativeStreaming` migre automatiquement vers `streaming.nativeTransport`.

### Comportement à l’exécution

Telegram :

- Utilise `sendMessage` + `editMessageText` pour les mises à jour d’aperçu dans les DM et groupes/sujets.
- Envoie un nouveau message final au lieu de modifier sur place lorsqu’un aperçu est visible depuis environ une minute, puis nettoie l’aperçu afin que l’horodatage de Telegram reflète la fin de la réponse.
- Le streaming d’aperçu est ignoré lorsque le streaming par blocs Telegram est explicitement activé (pour éviter un double streaming).
- `/reasoning stream` peut écrire le raisonnement dans l’aperçu.

Discord :

- Utilise l’envoi + la modification de messages d’aperçu.
- Le mode `block` utilise le découpage de brouillon (`draftChunk`).
- Le streaming d’aperçu est ignoré lorsque le streaming par blocs Discord est explicitement activé.
- Les médias finaux, erreurs et charges utiles de réponse explicite annulent les aperçus en attente sans vider un nouveau brouillon, puis utilisent la livraison normale.

Slack :

- `partial` peut utiliser le streaming natif Slack (`chat.startStream`/`append`/`stop`) lorsqu’il est disponible.
- `block` utilise des aperçus de brouillon de type ajout.
- `progress` utilise un texte d’aperçu d’état, puis la réponse finale.
- Le streaming d’aperçu natif et de brouillon supprime les réponses par blocs pour ce tour, afin qu’une réponse Slack soit diffusée par un seul chemin de livraison.
- Les charges utiles finales de média/erreur et les finales de progression ne créent pas de messages de brouillon jetables ; seuls les finals texte/bloc pouvant modifier l’aperçu vident le texte de brouillon en attente.

Mattermost :

- Diffuse la réflexion, l’activité d’outils et le texte partiel de réponse dans une seule publication d’aperçu de brouillon qui est finalisée sur place lorsque la réponse finale peut être envoyée en toute sécurité.
- Revient à l’envoi d’une nouvelle publication finale si la publication d’aperçu a été supprimée ou est autrement indisponible au moment de la finalisation.
- Les charges utiles finales de média/erreur annulent les mises à jour d’aperçu en attente avant la livraison normale au lieu de vider une publication d’aperçu temporaire.

Matrix :

- Les aperçus de brouillon sont finalisés sur place lorsque le texte final peut réutiliser l’événement d’aperçu.
- Les finales uniquement média, d’erreur et avec cible de réponse incompatible annulent les mises à jour d’aperçu en attente avant la livraison normale ; un aperçu obsolète déjà visible est expurgé.

### Mises à jour d’aperçu de progression des outils

Le streaming d’aperçu peut également inclure des mises à jour de **progression des outils** — de courtes lignes d’état comme « recherche sur le Web », « lecture du fichier » ou « appel de l’outil » — qui apparaissent dans le même message d’aperçu pendant l’exécution des outils, avant la réponse finale. Cela maintient les tours d’outils en plusieurs étapes visuellement actifs plutôt que silencieux entre le premier aperçu de réflexion et la réponse finale.

Surfaces prises en charge :

- **Discord**, **Slack**, **Telegram** et **Matrix** diffusent par défaut la progression des outils dans la modification d’aperçu en direct lorsque le streaming d’aperçu est actif.
- Telegram est livré avec les mises à jour d’aperçu de progression des outils activées depuis `v2026.4.22` ; les garder activées préserve ce comportement publié.
- **Mattermost** intègre déjà l’activité d’outils dans sa publication d’aperçu de brouillon unique (voir ci-dessus).
- Les modifications de progression des outils suivent le mode de streaming d’aperçu actif ; elles sont ignorées lorsque le streaming d’aperçu est `off` ou lorsque le streaming par blocs a pris le relais du message. Sur Telegram, `streaming.mode: "off"` signifie final uniquement : le bavardage de progression générique est aussi supprimé au lieu d’être livré comme messages autonomes « Working... », tandis que les invites d’approbation, charges utiles de média et erreurs sont toujours acheminées normalement.
- Pour conserver le streaming d’aperçu mais masquer les lignes de progression des outils, définissez `streaming.preview.toolProgress` sur `false` pour ce canal. Pour désactiver entièrement les modifications d’aperçu, définissez `streaming.mode` sur `off`.

Exemple :

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "partial",
        "preview": {
          "toolProgress": false
        }
      }
    }
  }
}
```

## Associé

- [Messages](/fr/concepts/messages) — cycle de vie et livraison des messages
- [Réessayer](/fr/concepts/retry) — comportement de nouvelle tentative en cas d’échec de livraison
- [Canaux](/fr/channels) — prise en charge du streaming par canal
