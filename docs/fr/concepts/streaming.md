---
read_when:
    - Expliquer le fonctionnement de la diffusion en continu ou du découpage en segments dans les canaux
    - Modification du comportement de diffusion en continu par blocs ou du découpage en fragments des canaux
    - Débogage des réponses de bloc en double/prématurées ou de la diffusion en continu de l’aperçu du canal
summary: Comportement du streaming et du découpage en fragments (réponses par blocs, streaming d’aperçu de canal, correspondance des modes)
title: Diffusion en continu et segmentation
x-i18n:
    generated_at: "2026-05-03T21:30:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1335f4f5532060bd8bf839683a2b1fbab38f38887c5583135652b4753e0f6a50
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw possède deux couches de diffusion distinctes :

- **Diffusion par blocs (canaux) :** émet des **blocs** terminés pendant que l’assistant écrit. Ce sont des messages de canal normaux (pas des deltas de jetons).
- **Diffusion d’aperçu (Telegram/Discord/Slack) :** met à jour un **message d’aperçu** temporaire pendant la génération.

Il n’existe aujourd’hui **aucune véritable diffusion de deltas de jetons** vers les messages de canal. La diffusion d’aperçu est basée sur des messages (envoi + modifications/ajouts).

## Diffusion par blocs (messages de canal)

La diffusion par blocs envoie la sortie de l’assistant en morceaux grossiers à mesure qu’elle devient disponible.

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

- `text_delta/events` : événements de flux du modèle (peuvent être rares pour les modèles sans diffusion).
- `chunker` : `EmbeddedBlockChunker` appliquant les limites min/max + la préférence de coupure.
- `channel send` : messages sortants réels (réponses par blocs).

**Contrôles :**

- `agents.defaults.blockStreamingDefault` : `"on"`/`"off"` (désactivé par défaut).
- Remplacements par canal : `*.blockStreaming` (et variantes par compte) pour forcer `"on"`/`"off"` par canal.
- `agents.defaults.blockStreamingBreak` : `"text_end"` ou `"message_end"`.
- `agents.defaults.blockStreamingChunk` : `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce` : `{ minChars?, maxChars?, idleMs? }` (fusionne les blocs diffusés avant l’envoi).
- Plafond strict du canal : `*.textChunkLimit` (par exemple, `channels.whatsapp.textChunkLimit`).
- Mode de découpage du canal : `*.chunkMode` (`length` par défaut, `newline` découpe sur les lignes vides (limites de paragraphes) avant le découpage par longueur).
- Plafond souple Discord : `channels.discord.maxLinesPerMessage` (17 par défaut) découpe les réponses hautes pour éviter le rognage dans l’interface.

**Sémantique des limites :**

- `text_end` : diffuse les blocs dès que le découpeur les émet ; vide le tampon à chaque `text_end`.
- `message_end` : attend que le message de l’assistant soit terminé, puis vide la sortie mise en tampon.

`message_end` utilise toujours le découpeur si le texte mis en tampon dépasse `maxChars`, il peut donc émettre plusieurs morceaux à la fin.

### Livraison des médias avec la diffusion par blocs

Les directives `MEDIA:` sont des métadonnées de livraison normales. Lorsque la diffusion par blocs envoie tôt un bloc média, OpenClaw mémorise cette livraison pour le tour. Si la charge utile finale de l’assistant répète la même URL de média, la livraison finale retire le média dupliqué au lieu d’envoyer à nouveau la pièce jointe.

Les charges utiles finales exactement dupliquées sont supprimées. Si la charge utile finale ajoute du texte distinct autour d’un média déjà diffusé, OpenClaw envoie tout de même le nouveau texte tout en conservant une livraison unique du média. Cela évite les notes vocales ou fichiers en double sur des canaux comme Telegram lorsqu’un agent émet `MEDIA:` pendant la diffusion et que le fournisseur l’inclut aussi dans la réponse terminée.

## Algorithme de découpage (limites basse/haute)

Le découpage par blocs est implémenté par `EmbeddedBlockChunker` :

- **Limite basse :** n’émet pas tant que le tampon >= `minChars` (sauf si forcé).
- **Limite haute :** privilégie les coupures avant `maxChars` ; si forcé, coupe à `maxChars`.
- **Préférence de coupure :** `paragraph` → `newline` → `sentence` → `whitespace` → coupure dure.
- **Blocs de code :** ne coupe jamais à l’intérieur des blocs ; lorsqu’une coupure est forcée à `maxChars`, ferme puis rouvre le bloc pour garder un Markdown valide.

`maxChars` est plafonné à la valeur `textChunkLimit` du canal, vous ne pouvez donc pas dépasser les limites par canal.

## Coalescence (fusion des blocs diffusés)

Lorsque la diffusion par blocs est activée, OpenClaw peut **fusionner les morceaux de blocs consécutifs** avant de les envoyer. Cela réduit le « spam sur une seule ligne » tout en fournissant une sortie progressive.

- La coalescence attend des **pauses d’inactivité** (`idleMs`) avant de vider le tampon.
- Les tampons sont plafonnés par `maxChars` et seront vidés s’ils le dépassent.
- `minChars` empêche l’envoi de fragments minuscules tant qu’assez de texte ne s’est pas accumulé (le vidage final envoie toujours le texte restant).
- Le séparateur est dérivé de `blockStreamingChunk.breakPreference` (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → espace).
- Des remplacements par canal sont disponibles via `*.blockStreamingCoalesce` (y compris les configurations par compte).
- La valeur `minChars` de coalescence par défaut est portée à 1500 pour Signal/Slack/Discord, sauf remplacement.

## Rythme humain entre les blocs

Lorsque la diffusion par blocs est activée, vous pouvez ajouter une **pause aléatoire** entre les réponses par blocs (après le premier bloc). Cela rend les réponses en plusieurs bulles plus naturelles.

- Configuration : `agents.defaults.humanDelay` (remplacement par agent via `agents.list[].humanDelay`).
- Modes : `off` (par défaut), `natural` (800–2500 ms), `custom` (`minMs`/`maxMs`).
- S’applique uniquement aux **réponses par blocs**, pas aux réponses finales ni aux résumés d’outils.

## « Diffuser les morceaux ou tout »

Cela correspond à :

- **Diffuser les morceaux :** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (émettre au fil de l’eau). Les canaux hors Telegram nécessitent aussi `*.blockStreaming: true`.
- **Tout diffuser à la fin :** `blockStreamingBreak: "message_end"` (vider une fois, éventuellement en plusieurs morceaux si très long).
- **Aucune diffusion par blocs :** `blockStreamingDefault: "off"` (réponse finale uniquement).

**Note sur les canaux :** la diffusion par blocs est **désactivée sauf si** `*.blockStreaming` est explicitement défini sur `true`. Les canaux peuvent diffuser un aperçu en direct (`channels.<channel>.streaming`) sans réponses par blocs.

Rappel d’emplacement de configuration : les valeurs par défaut `blockStreaming*` se trouvent sous `agents.defaults`, pas dans la configuration racine.

## Modes de diffusion d’aperçu

Clé canonique : `channels.<channel>.streaming`

Modes :

- `off` : désactive la diffusion d’aperçu.
- `partial` : aperçu unique remplacé par le dernier texte.
- `block` : mises à jour d’aperçu par étapes découpées/ajoutées.
- `progress` : aperçu de progression/statut pendant la génération, réponse finale à la fin.

`streaming.mode: "block"` est un mode de diffusion d’aperçu pour les canaux modifiables comme Discord et Telegram. Il n’active pas la livraison par blocs du canal à cet endroit. Utilisez `streaming.block.enabled` ou l’ancienne clé de canal `blockStreaming` lorsque vous voulez des réponses par blocs normales. Microsoft Teams est l’exception : il n’a pas de transport de bloc pour aperçu de brouillon, donc `streaming.mode: "block"` correspond à la livraison par blocs Teams au lieu de la diffusion partielle/progression native.

### Correspondance des canaux

| Canal      | `off` | `partial` | `block` | `progress`               |
| ---------- | ----- | --------- | ------- | ------------------------ |
| Telegram   | ✅    | ✅        | ✅      | brouillon de progression modifiable |
| Discord    | ✅    | ✅        | ✅      | brouillon de progression modifiable |
| Slack      | ✅    | ✅        | ✅      | ✅                       |
| Mattermost | ✅    | ✅        | ✅      | ✅                       |
| MS Teams   | ✅    | ✅        | ✅      | flux de progression natif |

Slack uniquement :

- `channels.slack.streaming.nativeTransport` active/désactive les appels à l’API de diffusion native Slack lorsque `channels.slack.streaming.mode="partial"` (par défaut : `true`).
- La diffusion native Slack et le statut de fil d’assistant Slack nécessitent une cible de fil de réponse. Les messages privés de premier niveau n’affichent pas cet aperçu de style fil, mais ils peuvent tout de même utiliser les publications et modifications d’aperçu de brouillon Slack.

Migration des anciennes clés :

- Telegram : les anciennes valeurs `streamMode` et les valeurs scalaires/booléennes `streaming` sont détectées et migrées par les chemins de compatibilité doctor/config vers `streaming.mode`.
- Discord : `streamMode` + `streaming` booléen migrent automatiquement vers l’énumération `streaming`.
- Slack : `streamMode` migre automatiquement vers `streaming.mode` ; `streaming` booléen migre automatiquement vers `streaming.mode` plus `streaming.nativeTransport` ; l’ancien `nativeStreaming` migre automatiquement vers `streaming.nativeTransport`.

### Comportement à l’exécution

Telegram :

- Utilise `sendMessage` + `editMessageText` pour les mises à jour d’aperçu dans les messages privés et les groupes/sujets.
- Envoie un nouveau message final au lieu de modifier sur place lorsqu’un aperçu est visible depuis environ une minute, puis nettoie l’aperçu afin que l’horodatage de Telegram reflète la fin de la réponse.
- La diffusion d’aperçu est ignorée lorsque la diffusion par blocs Telegram est explicitement activée (pour éviter une double diffusion).
- `/reasoning stream` peut écrire le raisonnement dans l’aperçu.

Discord :

- Utilise l’envoi + la modification des messages d’aperçu.
- Le mode `block` utilise le découpage de brouillon (`draftChunk`).
- La diffusion d’aperçu est ignorée lorsque la diffusion par blocs Discord est explicitement activée.
- Les médias finaux, erreurs et charges utiles de réponse explicite annulent les aperçus en attente sans vider un nouveau brouillon, puis utilisent la livraison normale.

Slack :

- `partial` peut utiliser la diffusion native Slack (`chat.startStream`/`append`/`stop`) lorsqu’elle est disponible.
- `block` utilise des aperçus de brouillon de type ajout.
- `progress` utilise du texte d’aperçu de statut, puis la réponse finale.
- Les messages privés de premier niveau sans fil de réponse utilisent des publications et modifications d’aperçu de brouillon au lieu de la diffusion native Slack.
- Les diffusions d’aperçu native et de brouillon suppriment les réponses par blocs pour ce tour, afin qu’une réponse Slack soit diffusée par un seul chemin de livraison.
- Les charges utiles finales de média/erreur et les finals de progression ne créent pas de messages de brouillon jetables ; seuls les finals texte/bloc pouvant modifier l’aperçu vident le texte de brouillon en attente.

Mattermost :

- Diffuse la réflexion, l’activité des outils et le texte de réponse partiel dans une seule publication d’aperçu de brouillon, qui est finalisée sur place lorsque la réponse finale peut être envoyée en toute sécurité.
- Revient à l’envoi d’une nouvelle publication finale si la publication d’aperçu a été supprimée ou est indisponible au moment de la finalisation.
- Les charges utiles finales de média/erreur annulent les mises à jour d’aperçu en attente avant la livraison normale au lieu de vider une publication d’aperçu temporaire.

Matrix :

- Les aperçus de brouillon sont finalisés sur place lorsque le texte final peut réutiliser l’événement d’aperçu.
- Les finals média seuls, erreur et incompatibles avec la cible de réponse annulent les mises à jour d’aperçu en attente avant la livraison normale ; un aperçu obsolète déjà visible est masqué.

### Mises à jour d’aperçu de progression des outils

La diffusion d’aperçu peut aussi inclure des mises à jour de **progression des outils** — de courtes lignes de statut comme « recherche sur le web », « lecture du fichier » ou « appel de l’outil » — qui apparaissent dans le même message d’aperçu pendant l’exécution des outils, avant la réponse finale. Cela garde les tours d’outils en plusieurs étapes visuellement actifs plutôt que silencieux entre le premier aperçu de réflexion et la réponse finale.

Surfaces prises en charge :

- **Discord**, **Slack**, **Telegram** et **Matrix** diffusent par défaut la progression des outils dans la modification d’aperçu en direct lorsque la diffusion d’aperçu est active. Microsoft Teams utilise son flux de progression natif dans les conversations personnelles.
- Telegram est livré avec les mises à jour d’aperçu de progression des outils activées depuis `v2026.4.22` ; les conserver activées préserve ce comportement publié.
- **Mattermost** intègre déjà l’activité des outils dans sa seule publication d’aperçu de brouillon (voir ci-dessus).
- Les modifications de progression des outils suivent le mode de diffusion d’aperçu actif ; elles sont ignorées lorsque la diffusion d’aperçu est `off` ou lorsque la diffusion par blocs a pris le relais du message. Sur Telegram, `streaming.mode: "off"` signifie final uniquement : le bavardage de progression générique est aussi supprimé au lieu d’être livré comme messages de statut autonomes, tandis que les invites d’approbation, les charges utiles de média et les erreurs sont toujours routées normalement.
- Pour conserver la diffusion d’aperçu mais masquer les lignes de progression des outils, définissez `streaming.preview.toolProgress` sur `false` pour ce canal. Pour désactiver entièrement les modifications d’aperçu, définissez `streaming.mode` sur `off`.
- Les réponses à une citation sélectionnée Telegram sont une exception : lorsque `replyToMode` n’est pas `"off"` et qu’un texte de citation sélectionné est présent, OpenClaw ignore le flux d’aperçu de réponse pour ce tour, donc les lignes d’aperçu de progression des outils ne peuvent pas s’afficher. Les réponses au message actuel sans texte de citation sélectionné conservent la diffusion d’aperçu. Consultez la [documentation du canal Telegram](/fr/channels/telegram) pour plus de détails.

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

- [Brouillons de progression](/fr/concepts/progress-drafts) — messages visibles de travail en cours qui se mettent à jour pendant les longs tours
- [Messages](/fr/concepts/messages) — cycle de vie et livraison des messages
- [Nouvelle tentative](/fr/concepts/retry) — comportement de nouvelle tentative en cas d’échec de livraison
- [Canaux](/fr/channels) — prise en charge de la diffusion par canal
