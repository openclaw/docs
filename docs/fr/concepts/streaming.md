---
read_when:
    - Explication du fonctionnement du streaming ou du découpage en blocs dans les canaux
    - Modification du comportement du streaming par blocs ou du découpage en blocs des canaux
    - Débogage des réponses par blocs dupliquées/prématurées ou du streaming d’aperçu dans le canal
summary: Comportement du streaming + découpage en blocs (réponses par blocs, streaming d’aperçu dans le canal, correspondance des modes)
title: Streaming et découpage en blocs
x-i18n:
    generated_at: "2026-04-22T04:22:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: c6b246025ea1b1be57705bde60c0cdb485ffda727392cf00ea5a165571e37fce
    source_path: concepts/streaming.md
    workflow: 15
---

# Streaming + découpage en blocs

OpenClaw dispose de deux couches de streaming distinctes :

- **Streaming par blocs (canaux) :** émet des **blocs** terminés à mesure que l’assistant écrit. Ce sont des messages de canal normaux (pas des deltas de tokens).
- **Streaming d’aperçu (Telegram/Discord/Slack) :** met à jour un **message d’aperçu** temporaire pendant la génération.

Il n’existe aujourd’hui **aucun véritable streaming de deltas de tokens** vers les messages de canal. Le streaming d’aperçu est basé sur les messages (envoi + modifications/ajouts).

## Streaming par blocs (messages de canal)

Le streaming par blocs envoie la sortie de l’assistant en segments grossiers à mesure qu’elle devient disponible.

```
Sortie du modèle
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ le chunker émet des blocs à mesure que le tampon grandit
       └─ (blockStreamingBreak=message_end)
            └─ le chunker vide au message_end
                   └─ envoi au canal (réponses par blocs)
```

Légende :

- `text_delta/events` : événements de flux du modèle (peuvent être clairsemés pour les modèles non streaming).
- `chunker` : `EmbeddedBlockChunker` appliquant les bornes min/max + la préférence de coupure.
- `channel send` : messages sortants réels (réponses par blocs).

**Contrôles :**

- `agents.defaults.blockStreamingDefault` : `"on"`/`"off"` (par défaut désactivé).
- Remplacements par canal : `*.blockStreaming` (et variantes par compte) pour forcer `"on"`/`"off"` par canal.
- `agents.defaults.blockStreamingBreak` : `"text_end"` ou `"message_end"`.
- `agents.defaults.blockStreamingChunk` : `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce` : `{ minChars?, maxChars?, idleMs? }` (fusionne les blocs streamés avant l’envoi).
- Limite stricte du canal : `*.textChunkLimit` (par ex. `channels.whatsapp.textChunkLimit`).
- Mode de découpage du canal : `*.chunkMode` (`length` par défaut, `newline` coupe sur les lignes vides (limites de paragraphe) avant le découpage par longueur).
- Limite souple Discord : `channels.discord.maxLinesPerMessage` (17 par défaut) découpe les réponses hautes pour éviter le rognage dans l’interface.

**Sémantique des limites :**

- `text_end` : diffuse les blocs dès que le chunker les émet ; vide à chaque `text_end`.
- `message_end` : attend la fin du message de l’assistant, puis vide la sortie tamponnée.

`message_end` utilise toujours le chunker si le texte tamponné dépasse `maxChars`, il peut donc émettre plusieurs segments à la fin.

## Algorithme de découpage en blocs (bornes basses/hautes)

Le découpage en blocs est implémenté par `EmbeddedBlockChunker` :

- **Borne basse :** n’émettez rien tant que le tampon est < `minChars` (sauf si forcé).
- **Borne haute :** préférez les coupures avant `maxChars` ; si forcé, coupez à `maxChars`.
- **Préférence de coupure :** `paragraph` → `newline` → `sentence` → `whitespace` → coupure forcée.
- **Blocs de code :** ne jamais couper à l’intérieur des blocs ; en cas de coupure forcée à `maxChars`, fermer puis rouvrir le bloc pour garder un Markdown valide.

`maxChars` est limité à la valeur de `textChunkLimit` du canal, donc vous ne pouvez pas dépasser les plafonds par canal.

## Coalescence (fusion des blocs streamés)

Lorsque le streaming par blocs est activé, OpenClaw peut **fusionner des blocs consécutifs**
avant de les envoyer. Cela réduit le « spam de lignes uniques » tout en fournissant
une sortie progressive.

- La coalescence attend des **intervalles d’inactivité** (`idleMs`) avant de vider.
- Les tampons sont plafonnés par `maxChars` et seront vidés s’ils le dépassent.
- `minChars` empêche l’envoi de fragments minuscules tant que suffisamment de texte ne s’est pas accumulé
  (la vidange finale envoie toujours le texte restant).
- Le séparateur est dérivé de `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → espace).
- Des remplacements par canal sont disponibles via `*.blockStreamingCoalesce` (y compris dans les configurations par compte).
- La valeur par défaut de `minChars` pour la coalescence est portée à 1500 pour Signal/Slack/Discord, sauf remplacement.

## Rythme plus humain entre les blocs

Lorsque le streaming par blocs est activé, vous pouvez ajouter une **pause aléatoire**
entre les réponses par blocs (après le premier bloc). Cela rend les réponses en plusieurs bulles
plus naturelles.

- Configuration : `agents.defaults.humanDelay` (remplacement par agent via `agents.list[].humanDelay`).
- Modes : `off` (par défaut), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`).
- S’applique uniquement aux **réponses par blocs**, pas aux réponses finales ni aux résumés d’outils.

## « Streamer les blocs ou tout »

Cela correspond à :

- **Streamer les blocs :** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (émettre au fil de l’eau). Les canaux autres que Telegram nécessitent aussi `*.blockStreaming: true`.
- **Tout streamer à la fin :** `blockStreamingBreak: "message_end"` (vider une fois, éventuellement en plusieurs segments si c’est très long).
- **Pas de streaming par blocs :** `blockStreamingDefault: "off"` (réponse finale uniquement).

**Remarque sur les canaux :** le streaming par blocs est **désactivé sauf si**
`*.blockStreaming` est explicitement défini à `true`. Les canaux peuvent diffuser un aperçu en direct
(`channels.<channel>.streaming`) sans réponses par blocs.

Rappel sur l’emplacement de configuration : les valeurs par défaut `blockStreaming*` se trouvent sous
`agents.defaults`, pas à la racine de la configuration.

## Modes de streaming d’aperçu

Clé canonique : `channels.<channel>.streaming`

Modes :

- `off` : désactiver le streaming d’aperçu.
- `partial` : un seul aperçu remplacé par le texte le plus récent.
- `block` : mises à jour de l’aperçu par étapes découpées/ajoutées.
- `progress` : aperçu de progression/statut pendant la génération, réponse finale à la fin.

### Correspondance par canal

| Canal      | `off` | `partial` | `block` | `progress`           |
| ---------- | ----- | --------- | ------- | -------------------- |
| Telegram   | ✅    | ✅        | ✅      | correspond à `partial` |
| Discord    | ✅    | ✅        | ✅      | correspond à `partial` |
| Slack      | ✅    | ✅        | ✅      | ✅                   |
| Mattermost | ✅    | ✅        | ✅      | ✅                   |

Slack uniquement :

- `channels.slack.streaming.nativeTransport` active/désactive les appels à l’API de streaming native de Slack lorsque `channels.slack.streaming.mode="partial"` (par défaut : `true`).
- Le streaming natif de Slack et le statut de fil d’assistant Slack nécessitent une cible de fil de réponse ; les MP de niveau supérieur n’affichent pas cet aperçu de style fil.

Migration des clés héritées :

- Telegram : `streamMode` + booléen `streaming` sont automatiquement migrés vers l’enum `streaming`.
- Discord : `streamMode` + booléen `streaming` sont automatiquement migrés vers l’enum `streaming`.
- Slack : `streamMode` est automatiquement migré vers `streaming.mode` ; le booléen `streaming` est automatiquement migré vers `streaming.mode` plus `streaming.nativeTransport` ; l’ancien `nativeStreaming` est automatiquement migré vers `streaming.nativeTransport`.

### Comportement à l’exécution

Telegram :

- Utilise les mises à jour d’aperçu `sendMessage` + `editMessageText` dans les MP et les groupes/sujets.
- Le streaming d’aperçu est ignoré lorsque le streaming par blocs Telegram est explicitement activé (pour éviter un double streaming).
- `/reasoning stream` peut écrire le raisonnement dans l’aperçu.

Discord :

- Utilise des messages d’aperçu envoyés puis modifiés.
- Le mode `block` utilise le découpage de brouillon (`draftChunk`).
- Le streaming d’aperçu est ignoré lorsque le streaming par blocs Discord est explicitement activé.
- Les charges utiles finales média, erreur et réponse explicite annulent les aperçus en attente sans vider de nouveau brouillon, puis utilisent la distribution normale.

Slack :

- `partial` peut utiliser le streaming natif de Slack (`chat.startStream`/`append`/`stop`) lorsqu’il est disponible.
- `block` utilise des aperçus brouillon en mode ajout.
- `progress` utilise un texte d’aperçu de statut, puis la réponse finale.
- Les charges utiles finales média/erreur et les finales de progression ne créent pas de messages brouillon jetables ; seules les finales texte/bloc pouvant modifier l’aperçu vident le texte brouillon en attente.

Mattermost :

- Diffuse la réflexion, l’activité des outils et le texte de réponse partielle dans une seule publication d’aperçu brouillon qui se finalise sur place lorsque la réponse finale peut être envoyée en toute sécurité.
- Revient à l’envoi d’une nouvelle publication finale si la publication d’aperçu a été supprimée ou n’est plus disponible au moment de la finalisation.
- Les charges utiles finales média/erreur annulent les mises à jour d’aperçu en attente avant la distribution normale au lieu de vider une publication d’aperçu temporaire.

Matrix :

- Les aperçus brouillon se finalisent sur place lorsque le texte final peut réutiliser l’événement d’aperçu.
- Les finales média uniquement, erreur et incompatibilité de cible de réponse annulent les mises à jour d’aperçu en attente avant la distribution normale ; un aperçu obsolète déjà visible est expurgé.

### Mises à jour d’aperçu de progression des outils

Le streaming d’aperçu peut aussi inclure des mises à jour de **progression des outils** — de courtes lignes d’état comme « recherche sur le web », « lecture du fichier » ou « appel de l’outil » — qui apparaissent dans le même message d’aperçu pendant l’exécution des outils, avant la réponse finale. Cela donne une impression de vie aux tours d’outils en plusieurs étapes au lieu de laisser un silence entre le premier aperçu de réflexion et la réponse finale.

Surfaces prises en charge :

- **Discord**, **Slack** et **Telegram** diffusent la progression des outils dans la modification de l’aperçu en direct.
- **Mattermost** intègre déjà l’activité des outils dans sa publication unique d’aperçu brouillon (voir ci-dessus).
- Les modifications de progression des outils suivent le mode actif de streaming d’aperçu ; elles sont ignorées lorsque le streaming d’aperçu est `off` ou lorsque le streaming par blocs a pris le contrôle du message.

## Liens associés

- [Messages](/fr/concepts/messages) — cycle de vie et distribution des messages
- [Retry](/fr/concepts/retry) — comportement de nouvelle tentative en cas d’échec de distribution
- [Canaux](/fr/channels) — prise en charge du streaming par canal
