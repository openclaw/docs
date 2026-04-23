---
read_when:
    - Vous recherchez une vue d’ensemble des capacités média
    - Décider quel provider média configurer
    - Comprendre le fonctionnement de la génération média asynchrone
summary: Page d’accueil unifiée pour les capacités de génération de médias, de compréhension des médias et de parole
title: Vue d’ensemble des médias
x-i18n:
    generated_at: "2026-04-23T07:11:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 999ed1c58a6d80c4bd6deef6e2dbf55b253c0dee3eb974ed212ca2fa91ec445e
    source_path: tools/media-overview.md
    workflow: 15
---

# Génération et compréhension des médias

OpenClaw génère des images, des vidéos et de la musique, comprend les médias entrants (images, audio, vidéo) et lit ses réponses à voix haute avec la synthèse vocale. Toutes les capacités média sont pilotées par des outils : l’agent décide quand les utiliser selon la conversation, et chaque outil n’apparaît que lorsqu’au moins un provider de support est configuré.

## Capacités en un coup d’œil

| Capacité            | Outil            | Providers                                                                                   | Ce que cela fait                                      |
| ------------------- | ---------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Génération d’image  | `image_generate` | ComfyUI, fal, Google, MiniMax, OpenAI, Vydra, xAI                                           | Crée ou modifie des images à partir de prompts texte ou de références |
| Génération vidéo    | `video_generate` | Alibaba, BytePlus, ComfyUI, fal, Google, MiniMax, OpenAI, Qwen, Runway, Together, Vydra, xAI | Crée des vidéos à partir de texte, d’images ou de vidéos existantes |
| Génération musicale | `music_generate` | ComfyUI, Google, MiniMax                                                                    | Crée de la musique ou des pistes audio à partir de prompts texte |
| Synthèse vocale (TTS) | `tts`          | ElevenLabs, Microsoft, MiniMax, OpenAI, xAI                                                 | Convertit les réponses sortantes en audio parlé       |
| Compréhension des médias | (automatique) | Tout provider de modèle capable de vision/audio, plus replis CLI                          | Résume les images, l’audio et la vidéo entrants       |

## Matrice de capacités des providers

Ce tableau montre quels providers prennent en charge quelles capacités média sur l’ensemble de la plateforme.

| Provider   | Image | Vidéo | Musique | TTS | STT / Transcription | Compréhension des médias |
| ---------- | ----- | ----- | ------- | --- | ------------------- | ------------------------ |
| Alibaba    |       | Oui   |         |     |                     |                          |
| BytePlus   |       | Oui   |         |     |                     |                          |
| ComfyUI    | Oui   | Oui   | Oui     |     |                     |                          |
| Deepgram   |       |       |         |     | Oui                 |                          |
| ElevenLabs |       |       |         | Oui | Oui                 |                          |
| fal        | Oui   | Oui   |         |     |                     |                          |
| Google     | Oui   | Oui   | Oui     |     |                     | Oui                      |
| Microsoft  |       |       |         | Oui |                     |                          |
| MiniMax    | Oui   | Oui   | Oui     | Oui |                     |                          |
| Mistral    |       |       |         |     | Oui                 |                          |
| OpenAI     | Oui   | Oui   |         | Oui | Oui                 | Oui                      |
| Qwen       |       | Oui   |         |     |                     |                          |
| Runway     |       | Oui   |         |     |                     |                          |
| Together   |       | Oui   |         |     |                     |                          |
| Vydra      | Oui   | Oui   |         |     |                     |                          |
| xAI        | Oui   | Oui   |         | Oui | Oui                 | Oui                      |

<Note>
La compréhension des médias utilise tout modèle capable de vision ou d’audio enregistré dans votre configuration de provider. Le tableau ci-dessus met en évidence les providers disposant d’une prise en charge dédiée de la compréhension des médias ; la plupart des providers LLM avec modèles multimodaux (Anthropic, Google, OpenAI, etc.) peuvent aussi comprendre les médias entrants lorsqu’ils sont configurés comme modèle de réponse actif.
</Note>

## Fonctionnement de la génération asynchrone

La génération vidéo et musicale s’exécute comme tâche en arrière-plan parce que le traitement côté provider prend généralement de 30 secondes à plusieurs minutes. Lorsque l’agent appelle `video_generate` ou `music_generate`, OpenClaw soumet la requête au provider, renvoie immédiatement un ID de tâche et suit la tâche dans le journal des tâches. L’agent continue à répondre aux autres messages pendant l’exécution. Lorsque le provider a terminé, OpenClaw réveille l’agent afin qu’il puisse publier le média final dans le canal d’origine. La génération d’image et le TTS sont synchrones et se terminent inline avec la réponse.

Deepgram, ElevenLabs, Mistral, OpenAI et xAI peuvent tous transcrire l’audio entrant
via le chemin batch `tools.media.audio` lorsqu’ils sont configurés. Deepgram,
ElevenLabs, Mistral, OpenAI et xAI enregistrent aussi des providers STT de streaming pour Voice Call,
de sorte que l’audio téléphonique en direct peut être transféré au fournisseur sélectionné
sans attendre la fin d’un enregistrement.

OpenAI se mappe aux surfaces d’OpenClaw pour image, vidéo, TTS batch, STT batch, STT de streaming
Voice Call, voix temps réel et embeddings mémoire. xAI se mappe actuellement aux surfaces d’OpenClaw pour image, vidéo, recherche, exécution de code, TTS batch, STT batch,
et STT de streaming Voice Call. La voix temps réel xAI est une
capacité amont, mais elle n’est pas enregistrée dans OpenClaw tant que le contrat partagé
de voix temps réel ne peut pas la représenter.

## Liens rapides

- [Image Generation](/fr/tools/image-generation) -- générer et modifier des images
- [Video Generation](/fr/tools/video-generation) -- texte-vers-vidéo, image-vers-vidéo et vidéo-vers-vidéo
- [Music Generation](/fr/tools/music-generation) -- créer de la musique et des pistes audio
- [Text-to-Speech](/fr/tools/tts) -- convertir les réponses en audio parlé
- [Media Understanding](/fr/nodes/media-understanding) -- comprendre les images, l’audio et la vidéo entrants
