---
read_when:
    - Modification du pipeline multimédia ou des pièces jointes
summary: Règles de gestion des images et des médias pour les envois, le Gateway et les réponses des agents
title: Prise en charge des images et des médias
x-i18n:
    generated_at: "2026-07-12T15:35:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 41d5bbd174b4fb35b616a9e90930485fd76dc8cfbad2e178f0823e6fb40c36f8
    source_path: nodes/images.md
    workflow: 16
---

Le canal WhatsApp fonctionne sur Baileys Web. Cette page décrit les règles de gestion des médias pour les envois, le Gateway et les réponses de l’agent.

## Objectifs

- Envoyer un média avec une légende facultative via `openclaw message send --media`.
- Permettre aux réponses automatiques de la boîte de réception web d’inclure un média avec du texte.
- Maintenir des limites raisonnables et prévisibles pour chaque type.

## Interface CLI

`openclaw message send --target <dest> --media <path-or-url> [--message <caption>]`

- `--media <path-or-url>` — joindre un média (image/audio/vidéo/document) ; accepte les chemins locaux ou les URL. Facultatif ; la légende peut être vide pour les envois contenant uniquement un média.
- `--gif-playback` — traiter le média vidéo comme une animation GIF (WhatsApp uniquement).
- `--force-document` — envoyer le média en tant que document pour éviter la compression du canal (Telegram, WhatsApp) ; s’applique aux images, aux GIF et aux vidéos.
- `--reply-to <id>`, `--thread-id <id>`, `--pin`, `--silent` — options de livraison et de fil de discussion partagées avec les envois contenant uniquement du texte.
- `--dry-run` — afficher la charge utile résolue sans effectuer l’envoi.
- `--json` — afficher le résultat au format JSON : `{ action, channel, dryRun, handledBy, messageId?, payload }` (`payload` contient le résultat d’envoi propre au canal, y compris toute référence à un média).

## Comportement du canal WhatsApp Web

- Entrée : chemin de fichier local **ou** URL HTTP(S).
- Déroulement : charger les données dans un tampon, détecter le type de média, puis créer la charge utile sortante en fonction du type :
  - **Images :** optimisées pour rester sous `channels.whatsapp.mediaMaxMb` (50MB par défaut). Les images opaques sont recompressées au format JPEG (la suite de dimensions par défaut commence à 2048px et diminue après chaque nouvel échec de respect de la taille) ; les images avec transparence sont conservées au format PNG. Si la source est déjà un fichier JPEG/PNG/WebP acceptable respectant les limites de taille et de dimensions, les octets d’origine sont conservés sans modification au lieu d’être recompressés. Les GIF animés ne sont jamais réencodés ; seule leur taille est vérifiée.
  - **Audio/voix :** sauf si le fichier utilise déjà un format audio vocal natif (`.ogg`/`.opus` ou `audio/ogg`/`audio/opus`), l’audio sortant est transcodé via `ffmpeg` en Opus/OGG (48kHz mono, 64kbps, limité à 20 minutes) avant d’être envoyé comme message vocal (`ptt: true`).
  - **Vidéo :** transmise sans modification jusqu’à 16MB.
  - **Documents :** tout autre contenu, jusqu’à 100MB, avec conservation du nom de fichier lorsqu’il est disponible.
- Lecture de type GIF dans WhatsApp : envoyer un MP4 avec `gifPlayback: true` (CLI : `--gif-playback`) afin que les clients mobiles le lisent en boucle directement dans la conversation.
- La détection MIME privilégie les octets magiques identifiés, puis l’extension du fichier et enfin les en-têtes de réponse ; un conteneur générique identifié (`application/octet-stream`, `zip`) ne remplace jamais une correspondance d’extension plus précise (par exemple XLSX plutôt que ZIP).
- La légende provient de `--message` ou de `reply.text` ; une légende vide est autorisée.
- Journalisation : le mode non détaillé affiche `↩️`/`✅` ; le mode détaillé inclut la taille et le chemin ou l’URL de la source.

<Note>
Les valeurs de 16MB pour l’audio et la vidéo et de 100MB pour les documents indiquées ci-dessus sont les limites par défaut partagées par type de média lorsqu’aucune limite explicite en octets n’est transmise. Les envois WhatsApp définissent une limite explicite à partir de `channels.whatsapp.mediaMaxMb` (50MB par défaut), qui s’applique uniformément à tous les types pour ce compte.
</Note>

## Pipeline de réponse automatique

- `getReplyFromConfig` renvoie une charge utile de réponse (ou un tableau de charges utiles) contenant notamment `text?`, `mediaUrl?` et `mediaUrls?`.
- Lorsqu’un média est présent, l’émetteur web résout les chemins locaux ou les URL au moyen du même pipeline que `openclaw message send`.
- Si plusieurs médias sont fournis, ils sont envoyés successivement.

## Transmission des médias entrants aux commandes

- Lorsque des messages web entrants contiennent un média, OpenClaw le télécharge dans un fichier temporaire et expose des variables de modèle :
  - `{{MediaUrl}}` — pseudo-URL du média entrant.
  - `{{MediaPath}}` — chemin temporaire local écrit avant l’exécution de la commande.
- Lorsqu’un bac à sable Docker propre à la session est activé, le média entrant est copié dans l’espace de travail du bac à sable et `MediaPath`/`MediaUrl` sont réécrits sous forme d’un chemin relatif au bac à sable, tel que `media/inbound/<filename>`.
- L’analyse des médias (configurée via `tools.media.*` ou le paramètre partagé `tools.media.models`) s’exécute avant l’application du modèle et peut insérer des blocs `[Image]`, `[Audio]` et `[Video]` dans `Body`.
  - Pour l’audio, elle définit `{{Transcript}}` et utilise la transcription pour analyser les commandes, afin que les commandes slash continuent de fonctionner.
  - Les descriptions des vidéos et des images conservent tout texte de légende pour l’analyse des commandes.
  - Si le modèle principal actif prend déjà en charge nativement la vision, OpenClaw omet le bloc récapitulatif `[Image]` et transmet directement l’image d’origine au modèle.
- Par défaut, seule la première pièce jointe image/audio/vidéo correspondante est traitée ; définissez `tools.media.<capability>.attachments` pour traiter plusieurs pièces jointes.

## Limites et erreurs

**Limites des envois sortants (envoi web WhatsApp)**

- Images : jusqu’à `channels.whatsapp.mediaMaxMb` (50MB par défaut) après optimisation.
- Audio/vidéo : limite de 16MB (valeur partagée par défaut ; remplacée par `mediaMaxMb` lors de l’envoi via WhatsApp).
- Documents : limite de 100MB (valeur partagée par défaut ; remplacée par `mediaMaxMb` lors de l’envoi via WhatsApp).
- Un média trop volumineux ou illisible produit une erreur claire dans les journaux et la réponse est ignorée.

**Limites de l’analyse des médias (transcription/description)**

- Valeur par défaut pour les images : 10MB (`tools.media.image.maxBytes`).
- Valeur par défaut pour l’audio : 20MB (`tools.media.audio.maxBytes`).
- Valeur par défaut pour la vidéo : 50MB (`tools.media.video.maxBytes`).
- Un média trop volumineux n’est pas analysé, mais la réponse est tout de même transmise avec le corps d’origine.

## Remarques concernant les tests

- Couvrir les flux d’envoi et de réponse pour les images, les fichiers audio et les documents.
- Valider les limites de taille après l’optimisation des images ainsi que l’indicateur de message vocal pour l’audio.
- Vérifier que les réponses comportant plusieurs médias sont réparties en envois successifs.

## Voir aussi

- [Capture par caméra](/fr/nodes/camera)
- [Analyse des médias](/fr/nodes/media-understanding)
- [Audio et messages vocaux](/fr/nodes/audio)
