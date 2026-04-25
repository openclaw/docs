---
read_when:
    - Expliquer le fonctionnement du streaming ou du découpage en segments sur les canaux
    - Modifier le comportement du streaming par bloc ou du découpage en segments du canal
    - Déboguer les réponses de bloc dupliquées/précoces ou le streaming d’aperçu du canal
summary: Comportement du streaming + du découpage en segments (réponses par bloc, streaming d’aperçu du canal, correspondance des modes)
title: Streaming et découpage en segments
x-i18n:
    generated_at: "2026-04-25T13:45:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba308b79b12886f3a1bc36bc277e3df0e2b9c6018aa260b432ccea89a235819f
    source_path: concepts/streaming.md
    workflow: 15
---

OpenClaw a deux couches de streaming distinctes :

- **Streaming par bloc (canaux)** : émet des **blocs** terminés pendant que l’assistant écrit. Ce sont des messages de canal normaux (pas des deltas de jetons).
- **Streaming d’aperçu (Telegram/Discord/Slack)** : met à jour un **message d’aperçu** temporaire pendant la génération.

Il n’existe aujourd’hui **aucun véritable streaming par delta de jetons** vers les messages de canal. Le streaming d’aperçu est basé sur les messages (envoi + modifications/ajouts).

## Streaming par bloc (messages de canal)

Le streaming par bloc envoie la sortie de l’assistant en segments grossiers au fur et à mesure qu’elle devient disponible.

```
Sortie du modèle
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ le chunker émet des blocs à mesure que le tampon grossit
       └─ (blockStreamingBreak=message_end)
            └─ le chunker vide le tampon à message_end
                   └─ envoi sur le canal (réponses par bloc)
```

Légende :

- `text_delta/events` : événements de flux du modèle (peuvent être rares pour les modèles sans streaming).
- `chunker` : `EmbeddedBlockChunker` appliquant les bornes min/max + la préférence de coupure.
- `channel send` : messages sortants réels (réponses par bloc).

**Contrôles :**

- `agents.defaults.blockStreamingDefault` : `"on"`/`"off"` (désactivé par défaut).
- Surcharges de canal : `*.blockStreaming` (et variantes par compte) pour forcer `"on"`/`"off"` par canal.
- `agents.defaults.blockStreamingBreak` : `"text_end"` ou `"message_end"`.
- `agents.defaults.blockStreamingChunk` : `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce` : `{ minChars?, maxChars?, idleMs? }` (fusionne les blocs streamés avant l’envoi).
- Limite stricte du canal : `*.textChunkLimit` (par ex. `channels.whatsapp.textChunkLimit`).
- Mode de découpage du canal : `*.chunkMode` (`length` par défaut, `newline` coupe sur les lignes vides (limites de paragraphe) avant le découpage par longueur).
- Limite souple Discord : `channels.discord.maxLinesPerMessage` (17 par défaut) coupe les réponses hautes pour éviter le rognage dans l’interface.

**Sémantique des limites :**

- `text_end` : diffuse les blocs dès que le chunker les émet ; vide à chaque `text_end`.
- `message_end` : attend que le message de l’assistant soit terminé, puis vide la sortie tamponnée.

`message_end` utilise toujours le chunker si le texte tamponné dépasse `maxChars`, il peut donc émettre plusieurs segments à la fin.

### Livraison de médias avec streaming par bloc

Les directives `MEDIA:` sont des métadonnées de livraison normales. Quand le streaming par bloc envoie
un bloc média tôt, OpenClaw mémorise cette livraison pour le tour. Si la charge utile finale de
l’assistant répète la même URL média, la livraison finale supprime
le média en double au lieu de renvoyer la pièce jointe.

Les charges utiles finales exactement dupliquées sont supprimées. Si la charge utile finale ajoute
du texte distinct autour d’un média déjà diffusé, OpenClaw envoie quand même
le nouveau texte tout en gardant le média en livraison unique. Cela évite les doublons de notes vocales
ou de fichiers sur des canaux comme Telegram lorsqu’un agent émet `MEDIA:` pendant le
streaming et que le fournisseur l’inclut aussi dans la réponse terminée.

## Algorithme de découpage en segments (bornes basse/haute)

Le découpage par bloc est implémenté par `EmbeddedBlockChunker` :

- **Borne basse** : n’émet pas tant que le tampon < `minChars` (sauf si forcé).
- **Borne haute** : préfère couper avant `maxChars` ; si forcé, coupe à `maxChars`.
- **Préférence de coupure** : `paragraph` → `newline` → `sentence` → `whitespace` → coupure forcée.
- **Blocs de code** : ne coupe jamais à l’intérieur des blocs ; lorsqu’une coupure est forcée à `maxChars`, ferme puis rouvre le bloc pour conserver un Markdown valide.

`maxChars` est limité à `textChunkLimit` du canal, donc vous ne pouvez pas dépasser les plafonds par canal.

## Coalescence (fusion des blocs streamés)

Lorsque le streaming par bloc est activé, OpenClaw peut **fusionner les segments de bloc consécutifs**
avant de les envoyer. Cela réduit le « spam d’une seule ligne » tout en conservant
une sortie progressive.

- La coalescence attend des **périodes d’inactivité** (`idleMs`) avant de vider.
- Les tampons sont plafonnés par `maxChars` et seront vidés s’ils le dépassent.
- `minChars` empêche l’envoi de trop petits fragments tant que suffisamment de texte ne s’est pas accumulé
  (la vidange finale envoie toujours le texte restant).
- Le séparateur est dérivé de `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → espace).
- Des surcharges de canal sont disponibles via `*.blockStreamingCoalesce` (y compris dans les configs par compte).
- La valeur par défaut de coalescence `minChars` est portée à 1500 pour Signal/Slack/Discord sauf surcharge.

## Rythme plus humain entre les blocs

Lorsque le streaming par bloc est activé, vous pouvez ajouter une **pause aléatoire**
entre les réponses par bloc (après le premier bloc). Cela rend les réponses en plusieurs bulles
plus naturelles.

- Config : `agents.defaults.humanDelay` (surcharge par agent via `agents.list[].humanDelay`).
- Modes : `off` (par défaut), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`).
- S’applique uniquement aux **réponses par bloc**, pas aux réponses finales ni aux résumés d’outils.

## « Stream chunks or everything »

Cela correspond à :

- **Stream chunks** : `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (émettre au fur et à mesure). Les canaux non Telegram nécessitent aussi `*.blockStreaming: true`.
- **Tout diffuser à la fin** : `blockStreamingBreak: "message_end"` (vider une fois, éventuellement en plusieurs segments si c’est très long).
- **Pas de streaming par bloc** : `blockStreamingDefault: "off"` (réponse finale uniquement).

**Remarque sur les canaux :** le streaming par bloc est **désactivé sauf si**
`*.blockStreaming` est explicitement défini sur `true`. Les canaux peuvent diffuser un aperçu en direct
(`channels.<channel>.streaming`) sans réponses par bloc.

Rappel sur l’emplacement de la config : les valeurs par défaut `blockStreaming*` se trouvent sous
`agents.defaults`, et non à la racine de la config.

## Modes de streaming d’aperçu

Clé canonique : `channels.<channel>.streaming`

Modes :

- `off` : désactive le streaming d’aperçu.
- `partial` : aperçu unique remplacé par le texte le plus récent.
- `block` : mises à jour d’aperçu par étapes segmentées/ajoutées.
- `progress` : aperçu d’avancement/statut pendant la génération, réponse finale à la fin.

### Correspondance par canal

| Canal      | `off` | `partial` | `block` | `progress`               |
| ---------- | ----- | --------- | ------- | ------------------------ |
| Telegram   | ✅    | ✅        | ✅      | correspond à `partial`   |
| Discord    | ✅    | ✅        | ✅      | correspond à `partial`   |
| Slack      | ✅    | ✅        | ✅      | ✅                       |
| Mattermost | ✅    | ✅        | ✅      | ✅                       |

Spécifique à Slack :

- `channels.slack.streaming.nativeTransport` active/désactive les appels à l’API de streaming native de Slack lorsque `channels.slack.streaming.mode="partial"` (par défaut : `true`).
- Le streaming natif Slack et le statut de fil assistant Slack nécessitent une cible de fil de réponse ; les MP de niveau supérieur n’affichent pas cet aperçu de type fil.

Migration des clés historiques :

- Telegram : les anciennes valeurs `streamMode` et les valeurs scalaires/booléennes `streaming` sont détectées et migrées par les chemins doctor/compatibilité de config vers `streaming.mode`.
- Discord : `streamMode` + `streaming` booléen sont migrés automatiquement vers l’énumération `streaming`.
- Slack : `streamMode` est migré automatiquement vers `streaming.mode` ; `streaming` booléen est migré automatiquement vers `streaming.mode` plus `streaming.nativeTransport` ; l’ancienne clé `nativeStreaming` est migrée automatiquement vers `streaming.nativeTransport`.

### Comportement à l’exécution

Telegram :

- Utilise des mises à jour d’aperçu `sendMessage` + `editMessageText` dans les MP et les groupes/sujets.
- Le streaming d’aperçu est ignoré lorsque le streaming par bloc Telegram est explicitement activé (pour éviter un double streaming).
- `/reasoning stream` peut écrire le raisonnement dans l’aperçu.

Discord :

- Utilise des messages d’aperçu envoyés puis modifiés.
- Le mode `block` utilise le découpage de brouillon (`draftChunk`).
- Le streaming d’aperçu est ignoré lorsque le streaming par bloc Discord est explicitement activé.
- Les charges utiles finales de média, d’erreur et de réponse explicite annulent les aperçus en attente sans vider un nouveau brouillon, puis utilisent la livraison normale.

Slack :

- `partial` peut utiliser le streaming natif Slack (`chat.startStream`/`append`/`stop`) lorsqu’il est disponible.
- `block` utilise des aperçus de brouillon de style ajout.
- `progress` utilise le texte d’aperçu de statut, puis la réponse finale.
- Le streaming d’aperçu natif et de brouillon supprime les réponses par bloc pour ce tour, afin qu’une réponse Slack ne soit diffusée que par un seul chemin de livraison.
- Les charges utiles finales de média/erreur et les finales de progression ne créent pas de messages de brouillon jetables ; seules les finales texte/bloc qui peuvent modifier l’aperçu vident le texte de brouillon en attente.

Mattermost :

- Diffuse le raisonnement, l’activité des outils et le texte de réponse partiel dans un unique billet d’aperçu de brouillon qui se finalise sur place lorsque la réponse finale peut être envoyée sans risque.
- Revient à l’envoi d’un nouveau billet final si le billet d’aperçu a été supprimé ou n’est plus disponible au moment de la finalisation.
- Les charges utiles finales de média/erreur annulent les mises à jour d’aperçu en attente avant la livraison normale au lieu de vider un billet d’aperçu temporaire.

Matrix :

- Les aperçus de brouillon se finalisent sur place lorsque le texte final peut réutiliser l’événement d’aperçu.
- Les finales de type média uniquement, erreur et incompatibilité de cible de réponse annulent les mises à jour d’aperçu en attente avant la livraison normale ; un aperçu obsolète déjà visible est rédigé.

### Mises à jour d’aperçu de progression des outils

Le streaming d’aperçu peut aussi inclure des mises à jour de **progression des outils** — de courtes lignes d’état comme « recherche sur le web », « lecture du fichier » ou « appel de l’outil » — qui apparaissent dans le même message d’aperçu pendant l’exécution des outils, avant la réponse finale. Cela permet de garder visuellement vivants les tours d’outils en plusieurs étapes au lieu de laisser un silence entre le premier aperçu de réflexion et la réponse finale.

Surfaces prises en charge :

- **Discord**, **Slack** et **Telegram** diffusent par défaut la progression des outils dans la modification d’aperçu en direct lorsque le streaming d’aperçu est actif.
- Telegram est livré avec les mises à jour d’aperçu de progression des outils activées depuis `v2026.4.22` ; les laisser activées préserve ce comportement publié.
- **Mattermost** intègre déjà l’activité des outils dans son unique billet d’aperçu de brouillon (voir ci-dessus).
- Les modifications de progression des outils suivent le mode actif de streaming d’aperçu ; elles sont ignorées lorsque le streaming d’aperçu vaut `off` ou lorsque le streaming par bloc a pris la main sur le message.
- Pour conserver le streaming d’aperçu mais masquer les lignes de progression des outils, définissez `streaming.preview.toolProgress` sur `false` pour ce canal. Pour désactiver complètement les modifications d’aperçu, définissez `streaming.mode` sur `off`.

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

## Lié

- [Messages](/fr/concepts/messages) — cycle de vie et livraison des messages
- [Retry](/fr/concepts/retry) — comportement de nouvelle tentative en cas d’échec de livraison
- [Canaux](/fr/channels) — prise en charge du streaming par canal
