---
read_when:
    - Explication du fonctionnement de la diffusion en continu ou du découpage en fragments sur les canaux
    - Modifier le comportement du streaming par blocs ou du découpage en segments des canaux
    - Débogage des réponses de bloc dupliquées/prématurées ou du streaming d’aperçu du canal
summary: Comportement de diffusion en continu + fragmentation (réponses en blocs, diffusion en continu de l’aperçu du canal, mappage des modes)
title: Diffusion en continu et découpage en blocs
x-i18n:
    generated_at: "2026-05-03T07:08:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85f6cb33031a6c818bb709e0ed14d8dd0f8c30a3dd90468a40396b3a515b5e65
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw possède deux couches de streaming distinctes :

- **Streaming par blocs (canaux) :** émet des **blocs** terminés au fil de l’écriture de l’assistant. Ce sont des messages de canal normaux (pas des deltas de tokens).
- **Streaming d’aperçu (Telegram/Discord/Slack) :** met à jour un **message d’aperçu** temporaire pendant la génération.

Il n’existe aujourd’hui **aucun vrai streaming de deltas de tokens** vers les messages de canal. Le streaming d’aperçu est basé sur les messages (envoi + modifications/ajouts).

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
- `chunker` : `EmbeddedBlockChunker` appliquant des bornes min/max + une préférence de coupure.
- `channel send` : messages sortants réels (réponses par blocs).

**Contrôles :**

- `agents.defaults.blockStreamingDefault` : `"on"`/`"off"` (désactivé par défaut).
- Remplacements par canal : `*.blockStreaming` (et variantes par compte) pour forcer `"on"`/`"off"` par canal.
- `agents.defaults.blockStreamingBreak` : `"text_end"` ou `"message_end"`.
- `agents.defaults.blockStreamingChunk` : `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce` : `{ minChars?, maxChars?, idleMs? }` (fusionne les blocs diffusés avant l’envoi).
- Limite stricte du canal : `*.textChunkLimit` (par exemple, `channels.whatsapp.textChunkLimit`).
- Mode de découpage du canal : `*.chunkMode` (`length` par défaut, `newline` coupe sur les lignes vides (limites de paragraphes) avant le découpage par longueur).
- Limite souple Discord : `channels.discord.maxLinesPerMessage` (17 par défaut) divise les réponses hautes pour éviter le rognage dans l’UI.

**Sémantique des limites :**

- `text_end` : diffuse les blocs dès que le découpeur les émet ; vide le tampon à chaque `text_end`.
- `message_end` : attend la fin du message de l’assistant, puis vide la sortie mise en tampon.

`message_end` utilise toujours le découpeur si le texte en tampon dépasse `maxChars`, il peut donc émettre plusieurs fragments à la fin.

### Livraison des médias avec le streaming par blocs

Les directives `MEDIA:` sont des métadonnées de livraison normales. Quand le streaming par blocs envoie un bloc multimédia tôt, OpenClaw mémorise cette livraison pour le tour. Si la charge utile finale de l’assistant répète la même URL de média, la livraison finale retire le média dupliqué au lieu de renvoyer la pièce jointe.

Les charges utiles finales exactement dupliquées sont supprimées. Si la charge utile finale ajoute du texte distinct autour d’un média déjà diffusé, OpenClaw envoie quand même le nouveau texte tout en conservant une livraison unique du média. Cela évite les notes vocales ou fichiers dupliqués sur des canaux comme Telegram quand un agent émet `MEDIA:` pendant le streaming et que le fournisseur l’inclut aussi dans la réponse terminée.

## Algorithme de découpage (bornes basse/haute)

Le découpage en blocs est implémenté par `EmbeddedBlockChunker` :

- **Borne basse :** n’émet pas tant que le tampon >= `minChars` (sauf si forcé).
- **Borne haute :** privilégie les coupures avant `maxChars` ; si forcé, coupe à `maxChars`.
- **Préférence de coupure :** `paragraph` → `newline` → `sentence` → `whitespace` → coupure dure.
- **Blocs de code :** ne coupe jamais à l’intérieur des blocs ; quand la coupure est forcée à `maxChars`, ferme + rouvre le bloc pour garder un Markdown valide.

`maxChars` est plafonné à la `textChunkLimit` du canal, vous ne pouvez donc pas dépasser les limites propres au canal.

## Coalescence (fusionner les blocs diffusés)

Quand le streaming par blocs est activé, OpenClaw peut **fusionner les fragments de blocs consécutifs** avant de les envoyer. Cela réduit le « spam sur une seule ligne » tout en fournissant une sortie progressive.

- La coalescence attend des **intervalles d’inactivité** (`idleMs`) avant de vider le tampon.
- Les tampons sont plafonnés par `maxChars` et seront vidés s’ils le dépassent.
- `minChars` empêche l’envoi de fragments minuscules tant qu’assez de texte ne s’est pas accumulé (le vidage final envoie toujours le texte restant).
- Le séparateur est dérivé de `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → espace).
- Des remplacements par canal sont disponibles via `*.blockStreamingCoalesce` (y compris les configurations par compte).
- La valeur `minChars` de coalescence par défaut est portée à 1500 pour Signal/Slack/Discord sauf remplacement.

## Cadence humaine entre les blocs

Quand le streaming par blocs est activé, vous pouvez ajouter une **pause aléatoire** entre les réponses par blocs (après le premier bloc). Cela rend les réponses à bulles multiples plus naturelles.

- Configuration : `agents.defaults.humanDelay` (remplacement par agent via `agents.list[].humanDelay`).
- Modes : `off` (par défaut), `natural` (800–2500 ms), `custom` (`minMs`/`maxMs`).
- S’applique uniquement aux **réponses par blocs**, pas aux réponses finales ni aux résumés d’outils.

## « Diffuser les fragments ou tout le contenu »

Cela correspond à :

- **Diffuser les fragments :** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (émet au fil de l’eau). Les canaux non Telegram ont aussi besoin de `*.blockStreaming: true`.
- **Tout diffuser à la fin :** `blockStreamingBreak: "message_end"` (vide une fois, possiblement en plusieurs fragments si très long).
- **Pas de streaming par blocs :** `blockStreamingDefault: "off"` (réponse finale uniquement).

**Note sur les canaux :** le streaming par blocs est **désactivé sauf si**
`*.blockStreaming` est explicitement défini sur `true`. Les canaux peuvent diffuser un aperçu en direct
(`channels.<channel>.streaming`) sans réponses par blocs.

Rappel de l’emplacement de configuration : les valeurs par défaut `blockStreaming*` se trouvent sous
`agents.defaults`, pas dans la configuration racine.

## Modes de streaming d’aperçu

Clé canonique : `channels.<channel>.streaming`

Modes :

- `off` : désactive le streaming d’aperçu.
- `partial` : aperçu unique remplacé par le dernier texte.
- `block` : l’aperçu se met à jour par étapes découpées/ajoutées.
- `progress` : aperçu de progression/statut pendant la génération, réponse finale à la fin.

### Correspondance des canaux

| Canal      | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | ✅    | ✅        | ✅      | correspond à `partial`  |
| Discord    | ✅    | ✅        | ✅      | correspond à `partial`  |
| Slack      | ✅    | ✅        | ✅      | ✅                      |
| Mattermost | ✅    | ✅        | ✅      | ✅                      |

Slack uniquement :

- `channels.slack.streaming.nativeTransport` active ou désactive les appels API de streaming natif Slack quand `channels.slack.streaming.mode="partial"` (par défaut : `true`).
- Le streaming natif Slack et le statut de fil assistant Slack nécessitent une cible de fil de réponse. Les DM de premier niveau n’affichent pas cet aperçu de style fil, mais ils peuvent quand même utiliser les publications et modifications d’aperçu de brouillon Slack.

Migration des clés héritées :

- Telegram : les valeurs héritées `streamMode` et les valeurs scalaires/booléennes `streaming` sont détectées et migrées par les chemins de compatibilité doctor/config vers `streaming.mode`.
- Discord : `streamMode` + `streaming` booléen migrent automatiquement vers l’énumération `streaming`.
- Slack : `streamMode` migre automatiquement vers `streaming.mode` ; `streaming` booléen migre automatiquement vers `streaming.mode` plus `streaming.nativeTransport` ; l’ancien `nativeStreaming` migre automatiquement vers `streaming.nativeTransport`.

### Comportement à l’exécution

Telegram :

- Utilise `sendMessage` + `editMessageText` pour les mises à jour d’aperçu dans les DM et les groupes/sujets.
- Envoie un nouveau message final au lieu de modifier sur place quand un aperçu est visible depuis environ une minute, puis nettoie l’aperçu afin que l’horodatage de Telegram reflète la fin de la réponse.
- Le streaming d’aperçu est ignoré quand le streaming par blocs Telegram est explicitement activé (pour éviter un double streaming).
- `/reasoning stream` peut écrire le raisonnement dans l’aperçu.

Discord :

- Utilise l’envoi + la modification de messages d’aperçu.
- Le mode `block` utilise le découpage de brouillon (`draftChunk`).
- Le streaming d’aperçu est ignoré quand le streaming par blocs Discord est explicitement activé.
- Les médias finaux, erreurs et charges utiles de réponse explicite annulent les aperçus en attente sans vider un nouveau brouillon, puis utilisent la livraison normale.

Slack :

- `partial` peut utiliser le streaming natif Slack (`chat.startStream`/`append`/`stop`) quand il est disponible.
- `block` utilise des aperçus de brouillon par ajout.
- `progress` utilise un texte d’aperçu de statut, puis la réponse finale.
- Les DM de premier niveau sans fil de réponse utilisent des publications et modifications d’aperçu de brouillon au lieu du streaming natif Slack.
- Le streaming d’aperçu natif et de brouillon supprime les réponses par blocs pour ce tour, afin qu’une réponse Slack soit diffusée par un seul chemin de livraison.
- Les charges utiles finales de média/erreur et les finaux de progression ne créent pas de messages de brouillon jetables ; seuls les finaux texte/bloc pouvant modifier l’aperçu vident le texte de brouillon en attente.

Mattermost :

- Diffuse la réflexion, l’activité des outils et le texte de réponse partielle dans une seule publication d’aperçu de brouillon qui se finalise sur place lorsque la réponse finale peut être envoyée sans risque.
- Revient à l’envoi d’une nouvelle publication finale si la publication d’aperçu a été supprimée ou est autrement indisponible au moment de la finalisation.
- Les charges utiles finales de média/erreur annulent les mises à jour d’aperçu en attente avant la livraison normale, au lieu de vider une publication d’aperçu temporaire.

Matrix :

- Les aperçus de brouillon se finalisent sur place quand le texte final peut réutiliser l’événement d’aperçu.
- Les finaux média uniquement, erreur et incompatibilité de cible de réponse annulent les mises à jour d’aperçu en attente avant la livraison normale ; un aperçu obsolète déjà visible est masqué.

### Mises à jour d’aperçu de progression des outils

Le streaming d’aperçu peut aussi inclure des mises à jour de **progression des outils** — de courtes lignes de statut comme « recherche sur le Web », « lecture du fichier » ou « appel de l’outil » — qui apparaissent dans le même message d’aperçu pendant l’exécution des outils, avant la réponse finale. Cela garde les tours d’outils en plusieurs étapes visuellement actifs plutôt que silencieux entre le premier aperçu de réflexion et la réponse finale.

Surfaces prises en charge :

- **Discord**, **Slack**, **Telegram** et **Matrix** diffusent par défaut la progression des outils dans la modification d’aperçu en direct quand le streaming d’aperçu est actif.
- Telegram est livré avec les mises à jour d’aperçu de progression des outils activées depuis `v2026.4.22` ; les conserver activées préserve ce comportement publié.
- **Mattermost** intègre déjà l’activité des outils dans sa publication unique d’aperçu de brouillon (voir ci-dessus).
- Les modifications de progression des outils suivent le mode de streaming d’aperçu actif ; elles sont ignorées quand le streaming d’aperçu est `off` ou quand le streaming par blocs a pris le relais du message. Sur Telegram, `streaming.mode: "off"` signifie final uniquement : le bavardage de progression générique est aussi supprimé au lieu d’être livré comme messages autonomes « Travail en cours... », tandis que les invites d’approbation, charges utiles média et erreurs sont toujours routées normalement.
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

## Connexe

- [Messages](/fr/concepts/messages) — cycle de vie et livraison des messages
- [Retry](/fr/concepts/retry) — comportement de nouvelle tentative en cas d’échec de livraison
- [Channels](/fr/channels) — prise en charge du streaming par canal
