---
read_when:
    - Modifier le pipeline multimédia ou les pièces jointes
summary: Règles de gestion des images et des médias pour l’envoi, le Gateway et les réponses des agents
title: Prise en charge des images et des médias
x-i18n:
    generated_at: "2026-05-06T17:58:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 069140a3ad3bade166d4576ead604b4675006a01e546672872379ce83291471c
    source_path: nodes/images.md
    workflow: 16
---

Le canal WhatsApp fonctionne via **Baileys Web**. Ce document décrit les règles actuelles de gestion des médias pour les envois, le Gateway et les réponses d’agent.

## Objectifs

- Envoyer des médias avec des légendes facultatives via `openclaw message send --media`.
- Permettre aux réponses automatiques depuis la boîte de réception web d’inclure des médias avec du texte.
- Garder des limites par type raisonnables et prévisibles.

## Surface CLI

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` est facultatif ; la légende peut être vide pour les envois contenant uniquement un média.
  - `--dry-run` affiche la charge utile résolue ; `--json` émet `{ channel, to, messageId, mediaUrl, caption }`.

## Comportement du canal WhatsApp Web

- Entrée : chemin de fichier local **ou** URL HTTP(S).
- Flux : charger dans un Buffer, détecter le type de média et construire la charge utile correcte :
  - **Images :** redimensionner et recomprimer en JPEG (côté maximal de 2048 px) en ciblant `channels.whatsapp.mediaMaxMb` (par défaut : 50 MB).
  - **Audio/Voix/Vidéo :** transmission directe jusqu’à 16 MB ; l’audio est envoyé comme note vocale (`ptt: true`).
  - **Documents :** tout le reste, jusqu’à 100 MB, avec le nom de fichier conservé lorsqu’il est disponible.
- Lecture de style GIF WhatsApp : envoyez un MP4 avec `gifPlayback: true` (CLI : `--gif-playback`) afin que les clients mobiles le lisent en boucle en ligne.
- La détection MIME privilégie les octets magiques, puis les en-têtes, puis l’extension de fichier.
- La légende provient de `--message` ou de `reply.text` ; une légende vide est autorisée.
- Journalisation : le mode non verbeux affiche `↩️`/`✅` ; le mode verbeux inclut la taille et le chemin/l’URL source.

## Pipeline de réponse automatique

- `getReplyFromConfig` renvoie `{ text?, mediaUrl?, mediaUrls? }`.
- Lorsqu’un média est présent, l’expéditeur web résout les chemins locaux ou les URL avec le même pipeline que `openclaw message send`.
- Plusieurs entrées média sont envoyées séquentiellement lorsqu’elles sont fournies.

## Médias entrants vers les commandes (Pi)

- Lorsque les messages web entrants incluent des médias, OpenClaw les télécharge dans un fichier temporaire et expose des variables de gabarit :
  - `{{MediaUrl}}` pseudo-URL du média entrant.
  - `{{MediaPath}}` chemin temporaire local écrit avant l’exécution de la commande.
- Lorsqu’un bac à sable Docker par session est activé, les médias entrants sont copiés dans l’espace de travail du bac à sable et `MediaPath`/`MediaUrl` sont réécrits vers un chemin relatif comme `media/inbound/<filename>`.
- La compréhension des médias (si elle est configurée via `tools.media.*` ou les `tools.media.models` partagés) s’exécute avant le gabarit et peut insérer des blocs `[Image]`, `[Audio]` et `[Video]` dans `Body`.
  - L’audio définit `{{Transcript}}` et utilise la transcription pour l’analyse des commandes afin que les commandes slash continuent de fonctionner.
  - Les descriptions de vidéo et d’image conservent tout texte de légende pour l’analyse des commandes.
  - Si le modèle d’image principal actif prend déjà en charge la vision nativement, OpenClaw ignore le bloc de résumé `[Image]` et transmet plutôt l’image d’origine au modèle.
- Par défaut, seule la première pièce jointe image/audio/vidéo correspondante est traitée ; définissez `tools.media.<cap>.attachments` pour traiter plusieurs pièces jointes.

## Limites et erreurs

**Plafonds d’envoi sortant (envoi web WhatsApp)**

- Images : jusqu’à `channels.whatsapp.mediaMaxMb` (par défaut : 50 MB) après recompression.
- Audio/voix/vidéo : plafond de 16 MB ; documents : plafond de 100 MB.
- Média trop volumineux ou illisible → erreur claire dans les journaux et la réponse est ignorée.

**Plafonds de compréhension des médias (transcription/description)**

- Image par défaut : 10 MB (`tools.media.image.maxBytes`).
- Audio par défaut : 20 MB (`tools.media.audio.maxBytes`).
- Vidéo par défaut : 50 MB (`tools.media.video.maxBytes`).
- Les médias trop volumineux ignorent la compréhension, mais les réponses sont quand même envoyées avec le corps d’origine.

## Notes pour les tests

- Couvrir les flux d’envoi et de réponse pour les cas image/audio/document.
- Valider la recompression des images (limite de taille) et le drapeau de note vocale pour l’audio.
- S’assurer que les réponses multimédias se déploient en envois séquentiels.

## Connexe

- [Capture caméra](/fr/nodes/camera)
- [Compréhension des médias](/fr/nodes/media-understanding)
- [Audio et notes vocales](/fr/nodes/audio)
