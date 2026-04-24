---
read_when:
    - Vous cherchez un aperçu des capacités multimédias
    - Choisir quel fournisseur multimédia configurer
    - Comprendre le fonctionnement de la génération multimédia asynchrone
summary: Page d’accueil unifiée pour la génération, la compréhension et les capacités vocales des médias
title: Aperçu des médias
x-i18n:
    generated_at: "2026-04-24T09:51:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 39848c6104ebd4feeb37b233b70f3312fa076b535c3b3780336729eb9fdfa4e6
    source_path: tools/media-overview.md
    workflow: 15
---

# Génération et compréhension des médias

OpenClaw génère des images, des vidéos et de la musique, comprend les médias entrants (images, audio, vidéo) et lit ses réponses à voix haute grâce à la synthèse vocale. Toutes les capacités multimédias sont pilotées par des outils : l’agent décide quand les utiliser en fonction de la conversation, et chaque outil n’apparaît que lorsqu’au moins un fournisseur sous-jacent est configuré.

## Capacités en un coup d’œil

| Capacité             | Outil            | Fournisseurs                                                                                | Ce qu’il fait                                             |
| -------------------- | ---------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Génération d’images  | `image_generate` | ComfyUI, fal, Google, MiniMax, OpenAI, Vydra, xAI                                            | Crée ou modifie des images à partir d’invites textuelles ou de références |
| Génération de vidéos | `video_generate` | Alibaba, BytePlus, ComfyUI, fal, Google, MiniMax, OpenAI, Qwen, Runway, Together, Vydra, xAI | Crée des vidéos à partir de texte, d’images ou de vidéos existantes |
| Génération musicale  | `music_generate` | ComfyUI, Google, MiniMax                                                                     | Crée de la musique ou des pistes audio à partir d’invites textuelles |
| Synthèse vocale (TTS) | `tts`           | ElevenLabs, Google, Microsoft, MiniMax, OpenAI, xAI                                          | Convertit les réponses sortantes en audio parlé           |
| Compréhension des médias | (automatique) | Tout fournisseur de modèle compatible vision/audio, plus des solutions de secours CLI       | Résume les images, l’audio et la vidéo entrants           |

## Matrice des capacités des fournisseurs

Ce tableau montre quels fournisseurs prennent en charge quelles capacités multimédias sur l’ensemble de la plateforme.

| Fournisseur | Image | Vidéo | Musique | TTS | STT / Transcription | Voix en temps réel | Compréhension des médias |
| ----------- | ----- | ----- | ------- | --- | ------------------- | ------------------ | ------------------------ |
| Alibaba     |       | Oui   |         |     |                     |                    |                          |
| BytePlus    |       | Oui   |         |     |                     |                    |                          |
| ComfyUI     | Oui   | Oui   | Oui     |     |                     |                    |                          |
| Deepgram    |       |       |         |     | Oui                 |                    |                          |
| ElevenLabs  |       |       |         | Oui | Oui                 |                    |                          |
| fal         | Oui   | Oui   |         |     |                     |                    |                          |
| Google      | Oui   | Oui   | Oui     | Oui |                     | Oui                | Oui                      |
| Microsoft   |       |       |         | Oui |                     |                    |                          |
| MiniMax     | Oui   | Oui   | Oui     | Oui |                     |                    |                          |
| Mistral     |       |       |         |     | Oui                 |                    |                          |
| OpenAI      | Oui   | Oui   |         | Oui | Oui                 | Oui                | Oui                      |
| Qwen        |       | Oui   |         |     |                     |                    |                          |
| Runway      |       | Oui   |         |     |                     |                    |                          |
| Together    |       | Oui   |         |     |                     |                    |                          |
| Vydra       | Oui   | Oui   |         |     |                     |                    |                          |
| xAI         | Oui   | Oui   |         | Oui | Oui                 |                    | Oui                      |

<Note>
La compréhension des médias utilise tout modèle compatible vision ou audio enregistré dans votre configuration de fournisseur. Le tableau ci-dessus met en avant les fournisseurs offrant une prise en charge dédiée de la compréhension des médias ; la plupart des fournisseurs de LLM avec des modèles multimodaux (Anthropic, Google, OpenAI, etc.) peuvent également comprendre les médias entrants lorsqu’ils sont configurés comme modèle de réponse actif.
</Note>

## Fonctionnement de la génération asynchrone

La génération de vidéos et de musique s’exécute comme une tâche en arrière-plan, car le traitement côté fournisseur prend généralement de 30 secondes à plusieurs minutes. Lorsque l’agent appelle `video_generate` ou `music_generate`, OpenClaw envoie la requête au fournisseur, renvoie immédiatement un ID de tâche et suit le travail dans le registre des tâches. L’agent continue à répondre aux autres messages pendant l’exécution de la tâche. Lorsque le fournisseur a terminé, OpenClaw réactive l’agent afin qu’il puisse publier le média finalisé dans le canal d’origine. La génération d’images et le TTS sont synchrones et se terminent dans le flux de la réponse.

Deepgram, ElevenLabs, Mistral, OpenAI et xAI peuvent tous transcrire l’audio entrant
via le chemin par lots `tools.media.audio` lorsqu’ils sont configurés. Deepgram,
ElevenLabs, Mistral, OpenAI et xAI enregistrent également des fournisseurs STT en streaming pour Voice Call,
afin que l’audio téléphonique en direct puisse être transmis au fournisseur sélectionné
sans attendre la fin d’un enregistrement.

Google correspond aux surfaces image, vidéo, musique, TTS par lots, voix en temps réel côté backend
et compréhension des médias d’OpenClaw. OpenAI correspond aux surfaces image,
vidéo, TTS par lots, STT par lots, STT en streaming pour Voice Call, voix en temps réel côté backend,
et embeddings de mémoire d’OpenClaw. xAI correspond actuellement aux surfaces image, vidéo,
recherche, exécution de code, TTS par lots, STT par lots et STT en streaming pour Voice Call
d’OpenClaw. La voix xAI Realtime est actuellement une capacité amont, mais elle n’est pas
enregistrée dans OpenClaw tant que le contrat partagé de voix en temps réel ne peut pas la représenter.

## Liens rapides

- [Génération d’images](/fr/tools/image-generation) -- générer et modifier des images
- [Génération de vidéos](/fr/tools/video-generation) -- texte-vers-vidéo, image-vers-vidéo et vidéo-vers-vidéo
- [Génération musicale](/fr/tools/music-generation) -- créer de la musique et des pistes audio
- [Synthèse vocale](/fr/tools/tts) -- convertir les réponses en audio parlé
- [Compréhension des médias](/fr/nodes/media-understanding) -- comprendre les images, l’audio et la vidéo entrants

## Lié

- [Génération d’images](/fr/tools/image-generation)
- [Génération de vidéos](/fr/tools/video-generation)
- [Génération musicale](/fr/tools/music-generation)
- [Synthèse vocale](/fr/tools/tts)
