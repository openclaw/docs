---
read_when:
    - Expliquer le fonctionnement du streaming ou du découpage en fragments sur les canaux
    - Modifier le comportement du streaming de blocs ou du découpage en fragments des canaux
    - Débogage des réponses de bloc en double ou prématurées, ou du streaming d’aperçu de canal
summary: Comportement de diffusion en continu + découpage en fragments (réponses par bloc, diffusion en continu de l’aperçu du canal, mappage des modes)
title: Diffusion en continu et découpage en blocs
x-i18n:
    generated_at: "2026-05-06T17:54:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: e43dc87211e764f9721c4e6c0aa69088441344e1f7c34084fd711a780a852a17
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw comporte deux couches de streaming distinctes :

- **Streaming de blocs (canaux) :** émet des **blocs** terminés pendant que l’assistant écrit. Ce sont des messages de canal normaux (pas des deltas de jetons).
- **Streaming d’aperçu (Telegram/Discord/Slack) :** met à jour un **message d’aperçu** temporaire pendant la génération.

Il n’existe aujourd’hui **aucun véritable streaming de deltas de jetons** vers les messages de canal. Le streaming d’aperçu est basé sur les messages (envoi + modifications/ajouts).

## Streaming de blocs (messages de canal)

Le streaming de blocs envoie la sortie de l’assistant en morceaux grossiers à mesure qu’elle devient disponible.

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
- `chunker` : `EmbeddedBlockChunker` appliquant les bornes min/max + la préférence de coupure.
- `channel send` : messages sortants réels (réponses par blocs).

**Contrôles :**

- `agents.defaults.blockStreamingDefault` : `"on"`/`"off"` (désactivé par défaut).
- Substitutions de canal : `*.blockStreaming` (et variantes par compte) pour forcer `"on"`/`"off"` par canal.
- `agents.defaults.blockStreamingBreak` : `"text_end"` ou `"message_end"`.
- `agents.defaults.blockStreamingChunk` : `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce` : `{ minChars?, maxChars?, idleMs? }` (fusionne les blocs diffusés avant l’envoi).
- Limite stricte du canal : `*.textChunkLimit` (par exemple, `channels.whatsapp.textChunkLimit`).
- Mode de découpage du canal : `*.chunkMode` (`length` par défaut, `newline` coupe sur les lignes vides (limites de paragraphes) avant le découpage par longueur).
- Limite souple de Discord : `channels.discord.maxLinesPerMessage` (17 par défaut) divise les réponses hautes afin d’éviter le rognage de l’interface utilisateur.

**Sémantique des limites :**

- `text_end` : diffuse les blocs dès que le chunker les émet ; vide à chaque `text_end`.
- `message_end` : attend que le message de l’assistant soit terminé, puis vide la sortie mise en mémoire tampon.

`message_end` utilise toujours le chunker si le texte mis en mémoire tampon dépasse `maxChars`, il peut donc émettre plusieurs morceaux à la fin.

### Livraison des médias avec le streaming de blocs

Les directives `MEDIA:` sont des métadonnées de livraison normales. Lorsque le streaming de blocs envoie tôt un bloc média, OpenClaw mémorise cette livraison pour le tour. Si la charge utile finale de l’assistant répète la même URL de média, la livraison finale supprime le média dupliqué au lieu de renvoyer la pièce jointe.

Les charges utiles finales exactement dupliquées sont supprimées. Si la charge utile finale ajoute du texte distinct autour d’un média qui a déjà été diffusé, OpenClaw envoie tout de même le nouveau texte tout en conservant une livraison unique du média. Cela évite les notes vocales ou fichiers dupliqués sur des canaux comme Telegram lorsqu’un agent émet `MEDIA:` pendant le streaming et que le fournisseur l’inclut aussi dans la réponse terminée.

## Algorithme de découpage (bornes basse/haute)

Le découpage en blocs est implémenté par `EmbeddedBlockChunker` :

- **Borne basse :** ne pas émettre tant que le tampon >= `minChars` (sauf si forcé).
- **Borne haute :** privilégier les coupures avant `maxChars` ; si forcé, couper à `maxChars`.
- **Préférence de coupure :** `paragraph` → `newline` → `sentence` → `whitespace` → coupure dure.
- **Blocs de code :** ne jamais couper à l’intérieur des blocs ; lorsqu’une coupure à `maxChars` est forcée, fermer + rouvrir le bloc afin de garder un Markdown valide.

`maxChars` est plafonné à la valeur `textChunkLimit` du canal, vous ne pouvez donc pas dépasser les limites par canal.

## Coalescence (fusionner les blocs diffusés)

Lorsque le streaming de blocs est activé, OpenClaw peut **fusionner des morceaux de blocs consécutifs** avant de les envoyer. Cela réduit le « spam d’une seule ligne » tout en fournissant une sortie progressive.

- La coalescence attend des **intervalles d’inactivité** (`idleMs`) avant de vider.
- Les tampons sont plafonnés par `maxChars` et seront vidés s’ils le dépassent.
- `minChars` empêche l’envoi de fragments minuscules tant qu’assez de texte ne s’est pas accumulé (le vidage final envoie toujours le texte restant).
- Le séparateur est dérivé de `blockStreamingChunk.breakPreference` (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → espace).
- Des substitutions de canal sont disponibles via `*.blockStreamingCoalesce` (y compris les configurations par compte).
- La valeur `minChars` par défaut de coalescence est portée à 1500 pour Signal/Slack/Discord, sauf substitution.

## Rythme humain entre les blocs

Lorsque le streaming de blocs est activé, vous pouvez ajouter une **pause aléatoire** entre les réponses par blocs (après le premier bloc). Cela rend les réponses à plusieurs bulles plus naturelles.

- Configuration : `agents.defaults.humanDelay` (substitution par agent via `agents.list[].humanDelay`).
- Modes : `off` (par défaut), `natural` (800-2500ms), `custom` (`minMs`/`maxMs`).
- S’applique uniquement aux **réponses par blocs**, pas aux réponses finales ni aux résumés d’outils.

## « Diffuser les morceaux ou tout »

Cela correspond à :

- **Diffuser les morceaux :** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (émettre au fil de l’eau). Les canaux non-Telegram ont aussi besoin de `*.blockStreaming: true`.
- **Tout diffuser à la fin :** `blockStreamingBreak: "message_end"` (vider une fois, éventuellement en plusieurs morceaux si très long).
- **Aucun streaming de blocs :** `blockStreamingDefault: "off"` (uniquement la réponse finale).

**Note de canal :** le streaming de blocs est **désactivé sauf si** `*.blockStreaming` est explicitement défini sur `true`. Les canaux peuvent diffuser un aperçu en direct (`channels.<channel>.streaming`) sans réponses par blocs.

Rappel sur l’emplacement de la configuration : les valeurs par défaut `blockStreaming*` se trouvent sous `agents.defaults`, pas dans la configuration racine.

## Modes de streaming d’aperçu

Clé canonique : `channels.<channel>.streaming`

Modes :

- `off` : désactive le streaming d’aperçu.
- `partial` : aperçu unique remplacé par le dernier texte.
- `block` : mises à jour de l’aperçu par étapes découpées/ajoutées.
- `progress` : aperçu de progression/statut pendant la génération, réponse finale à la fin.

`streaming.mode: "block"` est un mode de streaming d’aperçu pour les canaux pouvant être modifiés, comme Discord et Telegram. Il n’active pas la livraison de blocs de canal à cet endroit. Utilisez `streaming.block.enabled` ou l’ancienne clé de canal `blockStreaming` lorsque vous voulez des réponses par blocs normales. Microsoft Teams est l’exception : il ne dispose pas de transport de bloc d’aperçu de brouillon, donc `streaming.mode: "block"` correspond à la livraison de blocs Teams au lieu du streaming partiel/progressif natif.

### Correspondance des canaux

| Canal      | `off` | `partial` | `block` | `progress`                |
| ---------- | ----- | --------- | ------- | ------------------------- |
| Telegram   | ✅    | ✅        | ✅      | brouillon de progression modifiable |
| Discord    | ✅    | ✅        | ✅      | brouillon de progression modifiable |
| Slack      | ✅    | ✅        | ✅      | ✅                        |
| Mattermost | ✅    | ✅        | ✅      | ✅                        |
| MS Teams   | ✅    | ✅        | ✅      | flux de progression natif |

Slack uniquement :

- `channels.slack.streaming.nativeTransport` active/désactive les appels à l’API de streaming native de Slack lorsque `channels.slack.streaming.mode="partial"` (par défaut : `true`).
- Le streaming natif de Slack et le statut de fil d’assistant Slack nécessitent une cible de fil de réponse. Les messages directs de premier niveau n’affichent pas cet aperçu de type fil, mais ils peuvent toujours utiliser les publications et modifications d’aperçu de brouillon Slack.

Migration des anciennes clés :

- Telegram : les anciennes valeurs `streamMode` et les valeurs scalaires/booléennes `streaming` sont détectées et migrées par les chemins de compatibilité doctor/config vers `streaming.mode`.
- Discord : `streamMode` + `streaming` booléen restent des alias d’exécution pour l’énumération `streaming` ; exécutez `openclaw doctor --fix` pour réécrire la configuration persistée.
- Slack : `streamMode` reste un alias d’exécution pour `streaming.mode` ; `streaming` booléen reste un alias d’exécution pour `streaming.mode` plus `streaming.nativeTransport` ; l’ancien `nativeStreaming` reste un alias d’exécution pour `streaming.nativeTransport`. Exécutez `openclaw doctor --fix` pour réécrire la configuration persistée.

### Comportement à l’exécution

Telegram :

- Utilise `sendMessage` + `editMessageText` pour les mises à jour d’aperçu dans les messages directs et les groupes/sujets.
- Le texte final modifie l’aperçu actif sur place ; les finales longues réutilisent ce message pour le premier morceau et n’envoient que les morceaux restants.
- Le mode `progress` conserve la progression des outils dans un brouillon de statut modifiable, efface ce brouillon à la fin, puis envoie la réponse finale via la livraison normale.
- Si la modification finale échoue avant que le texte terminé soit confirmé, OpenClaw utilise la livraison finale normale et nettoie l’aperçu obsolète.
- Le streaming d’aperçu est ignoré lorsque le streaming de blocs Telegram est explicitement activé (afin d’éviter un double streaming).
- `/reasoning stream` peut écrire le raisonnement dans un aperçu transitoire qui est supprimé après la livraison finale.

Discord :

- Utilise des messages d’aperçu envoyés + modifiés.
- Le mode `block` utilise le découpage de brouillon (`draftChunk`).
- Le streaming d’aperçu est ignoré lorsque le streaming de blocs Discord est explicitement activé.
- Les charges utiles finales de média, d’erreur et de réponse explicite annulent les aperçus en attente sans vider un nouveau brouillon, puis utilisent la livraison normale.

Slack :

- `partial` peut utiliser le streaming natif Slack (`chat.startStream`/`append`/`stop`) lorsqu’il est disponible.
- `block` utilise des aperçus de brouillon par ajout.
- `progress` utilise le texte d’aperçu de statut, puis la réponse finale.
- Les messages directs de premier niveau sans fil de réponse utilisent des publications et modifications d’aperçu de brouillon au lieu du streaming natif Slack.
- Le streaming natif et l’aperçu de brouillon suppriment les réponses par blocs pour ce tour, de sorte qu’une réponse Slack est diffusée par un seul chemin de livraison.
- Les charges utiles finales de média/erreur et les finales de progression ne créent pas de messages de brouillon jetables ; seuls les finales texte/bloc qui peuvent modifier l’aperçu vident le texte de brouillon en attente.

Mattermost :

- Diffuse la réflexion, l’activité des outils et le texte partiel de réponse dans une publication d’aperçu de brouillon unique qui se finalise sur place lorsque la réponse finale peut être envoyée en toute sécurité.
- Se replie sur l’envoi d’une nouvelle publication finale si la publication d’aperçu a été supprimée ou est autrement indisponible au moment de la finalisation.
- Les charges utiles finales de média/erreur annulent les mises à jour d’aperçu en attente avant la livraison normale au lieu de vider une publication d’aperçu temporaire.

Matrix :

- Les aperçus de brouillon se finalisent sur place lorsque le texte final peut réutiliser l’événement d’aperçu.
- Les finales média uniquement, erreur et incompatibilité de cible de réponse annulent les mises à jour d’aperçu en attente avant la livraison normale ; un aperçu obsolète déjà visible est expurgé.

### Mises à jour d’aperçu de progression des outils

Le streaming d’aperçu peut aussi inclure des mises à jour de **progression des outils** — de courtes lignes de statut comme « recherche sur le Web », « lecture du fichier » ou « appel de l’outil » — qui apparaissent dans le même message d’aperçu pendant l’exécution des outils, avant la réponse finale. Cela maintient les tours d’outils en plusieurs étapes visuellement actifs plutôt que silencieux entre le premier aperçu de réflexion et la réponse finale.

Surfaces prises en charge :

- **Discord**, **Slack**, **Telegram** et **Matrix** diffusent par défaut la progression des outils dans la modification d’aperçu en direct lorsque la diffusion de l’aperçu est active. Microsoft Teams utilise son flux de progression natif dans les conversations personnelles.
- Telegram est livré avec les mises à jour d’aperçu de progression des outils activées depuis `v2026.4.22`; les garder activées préserve ce comportement publié.
- **Mattermost** intègre déjà l’activité des outils dans sa publication unique d’aperçu de brouillon (voir ci-dessus).
- Les modifications de progression des outils suivent le mode actif de diffusion de l’aperçu; elles sont ignorées lorsque la diffusion de l’aperçu est `off` ou lorsque la diffusion par blocs a pris le relais du message. Sur Telegram, `streaming.mode: "off"` produit uniquement le résultat final : les messages de progression génériques sont également supprimés au lieu d’être livrés comme messages d’état autonomes, tandis que les demandes d’approbation, les charges utiles multimédias et les erreurs sont toujours acheminées normalement.
- Pour conserver la diffusion de l’aperçu tout en masquant les lignes de progression des outils, définissez `streaming.preview.toolProgress` sur `false` pour ce canal. Pour garder les lignes de progression des outils visibles tout en masquant le texte des commandes/exécutions, définissez `streaming.preview.commandText` sur `"status"` ou `streaming.progress.commandText` sur `"status"`; la valeur par défaut est `"raw"` afin de préserver le comportement publié. Cette règle est partagée par les canaux de brouillon/progression qui utilisent le moteur de rendu de progression compact d’OpenClaw, notamment Discord, Matrix, Microsoft Teams, Mattermost, les aperçus de brouillon Slack et Telegram. Pour désactiver entièrement les modifications d’aperçu, définissez `streaming.mode` sur `off`.
- Les réponses Telegram avec citation sélectionnée constituent une exception : lorsque `replyToMode` n’est pas `"off"` et qu’un texte de citation sélectionné est présent, OpenClaw ignore le flux d’aperçu de la réponse pour ce tour, de sorte que les lignes d’aperçu de progression des outils ne peuvent pas s’afficher. Les réponses au message courant sans texte de citation sélectionné conservent toujours la diffusion de l’aperçu. Consultez la [documentation du canal Telegram](/fr/channels/telegram) pour plus de détails.

Garder les lignes de progression visibles, mais masquer le texte brut des commandes/exécutions :

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

Utilisez la même structure sous une autre clé de canal de progression compact, par exemple `channels.discord`, `channels.matrix`, `channels.msteams`, `channels.mattermost` ou les aperçus de brouillon Slack. Pour le mode brouillon de progression, placez la même règle sous `streaming.progress` :

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

- [Refactorisation du cycle de vie des messages](/fr/concepts/message-lifecycle-refactor) - cible la conception partagée de l’aperçu, des modifications, du flux et de la finalisation
- [Brouillons de progression](/fr/concepts/progress-drafts) - messages de travail en cours visibles qui se mettent à jour pendant les longs tours
- [Messages](/fr/concepts/messages) - cycle de vie et livraison des messages
- [Nouvelle tentative](/fr/concepts/retry) - comportement de nouvelle tentative en cas d’échec de livraison
- [Canaux](/fr/channels) - prise en charge de la diffusion par canal
