---
read_when:
    - Modification du pipeline multimédia ou des pièces jointes
summary: Règles de gestion des images et des médias pour l’envoi, le Gateway et les réponses des agents
title: Prise en charge des images et des médias
x-i18n:
    generated_at: "2026-05-06T07:29:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: a38224fdf42f32fe206ad8cf3fcc3b06a078b1978d447adeb671fdb3ff4e4b32
    source_path: nodes/images.md
    workflow: 16
---

# Prise en charge des images et des médias (2025-12-05)

Le canal WhatsApp s’exécute via **Baileys Web**. Ce document décrit les règles actuelles de gestion des médias pour les envois, le Gateway et les réponses d’agent.

## Objectifs

- Envoyer des médias avec des légendes facultatives via `openclaw message send --media`.
- Permettre aux réponses automatiques depuis la boîte de réception web d’inclure des médias avec le texte.
- Garder des limites par type raisonnables et prévisibles.

## Surface CLI

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` est facultatif ; la légende peut être vide pour les envois composés uniquement de médias.
  - `--dry-run` affiche la charge utile résolue ; `--json` émet `{ channel, to, messageId, mediaUrl, caption }`.

## Comportement du canal WhatsApp Web

- Entrée : chemin de fichier local **ou** URL HTTP(S).
- Flux : charger dans un tampon, détecter le type de média et construire la charge utile correcte :
  - **Images :** redimensionner et recompresser en JPEG (côté maximal 2048 px) en ciblant `channels.whatsapp.mediaMaxMb` (par défaut : 50 Mo).
  - **Audio/Voix/Vidéo :** transmission directe jusqu’à 16 Mo ; l’audio est envoyé comme note vocale (`ptt: true`).
  - **Documents :** tout le reste, jusqu’à 100 Mo, avec le nom de fichier conservé lorsqu’il est disponible.
- Lecture façon GIF de WhatsApp : envoyer un MP4 avec `gifPlayback: true` (CLI : `--gif-playback`) afin que les clients mobiles le lisent en boucle en ligne.
- La détection MIME privilégie les octets magiques, puis les en-têtes, puis l’extension de fichier.
- La légende vient de `--message` ou de `reply.text` ; une légende vide est autorisée.
- Journalisation : le mode non détaillé affiche `↩️`/`✅` ; le mode détaillé inclut la taille et le chemin/URL source.

## Pipeline de réponse automatique

- `getReplyFromConfig` renvoie `{ text?, mediaUrl?, mediaUrls? }`.
- Lorsqu’un média est présent, l’expéditeur web résout les chemins locaux ou les URL à l’aide du même pipeline que `openclaw message send`.
- Plusieurs entrées média sont envoyées séquentiellement si elles sont fournies.

## Médias entrants vers les commandes (Pi)

- Lorsque les messages web entrants incluent des médias, OpenClaw les télécharge dans un fichier temporaire et expose des variables de templating :
  - `{{MediaUrl}}` pseudo-URL pour le média entrant.
  - `{{MediaPath}}` chemin temporaire local écrit avant l’exécution de la commande.
- Lorsqu’un bac à sable Docker par session est activé, les médias entrants sont copiés dans l’espace de travail du bac à sable et `MediaPath`/`MediaUrl` sont réécrits vers un chemin relatif comme `media/inbound/<filename>`.
- La compréhension des médias (si elle est configurée via `tools.media.*` ou les `tools.media.models` partagés) s’exécute avant le templating et peut insérer des blocs `[Image]`, `[Audio]` et `[Video]` dans `Body`.
  - L’audio définit `{{Transcript}}` et utilise la transcription pour l’analyse des commandes, afin que les commandes slash continuent de fonctionner.
  - Les descriptions vidéo et image conservent tout texte de légende pour l’analyse des commandes.
  - Si le modèle d’image principal actif prend déjà en charge la vision nativement, OpenClaw ignore le bloc de résumé `[Image]` et transmet plutôt l’image originale au modèle.
- Par défaut, seule la première pièce jointe image/audio/vidéo correspondante est traitée ; définissez `tools.media.<cap>.attachments` pour traiter plusieurs pièces jointes.

## Limites et erreurs

**Plafonds d’envoi sortant (envoi web WhatsApp)**

- Images : jusqu’à `channels.whatsapp.mediaMaxMb` (par défaut : 50 Mo) après recompression.
- Audio/voix/vidéo : plafond de 16 Mo ; documents : plafond de 100 Mo.
- Média trop volumineux ou illisible → erreur claire dans les journaux et la réponse est ignorée.

**Plafonds de compréhension des médias (transcription/description)**

- Image par défaut : 10 Mo (`tools.media.image.maxBytes`).
- Audio par défaut : 20 Mo (`tools.media.audio.maxBytes`).
- Vidéo par défaut : 50 Mo (`tools.media.video.maxBytes`).
- Les médias trop volumineux ignorent la compréhension, mais les réponses sont quand même envoyées avec le corps original.

## Notes pour les tests

- Couvrir les flux d’envoi et de réponse pour les cas image/audio/document.
- Valider la recompression des images (limite de taille) et l’indicateur de note vocale pour l’audio.
- S’assurer que les réponses multimédias sont distribuées en envois séquentiels.

## Articles associés

- [Capture caméra](/fr/nodes/camera)
- [Compréhension des médias](/fr/nodes/media-understanding)
- [Audio et notes vocales](/fr/nodes/audio)
