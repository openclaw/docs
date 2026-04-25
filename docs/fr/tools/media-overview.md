---
read_when:
    - À la recherche d’une vue d’ensemble des capacités multimédias
    - Décider quel fournisseur de médias configurer
    - Comprendre le fonctionnement de la génération de médias asynchrone
summary: Page d’accueil unifiée pour les capacités de génération de médias, de compréhension et de parole
title: Vue d’ensemble des médias
x-i18n:
    generated_at: "2026-04-25T13:58:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: c674df701b88c807842078b2e2e53821f1b2fc6037fd2e4d688caea147e769f1
    source_path: tools/media-overview.md
    workflow: 15
---

# Génération et compréhension des médias

OpenClaw génère des images, des vidéos et de la musique, comprend les médias entrants (images, audio, vidéo) et lit ses réponses à voix haute avec la synthèse vocale. Toutes les capacités multimédias sont pilotées par des outils : l’agent décide quand les utiliser en fonction de la conversation, et chaque outil n’apparaît que lorsqu’au moins un fournisseur sous-jacent est configuré.

## Capacités en un coup d’œil

| Capacité             | Outil            | Fournisseurs                                                                                | Fonction                                                   |
| -------------------- | ---------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Génération d’images  | `image_generate` | ComfyUI, fal, Google, MiniMax, OpenAI, Vydra, xAI                                           | Crée ou modifie des images à partir d’invites textuelles ou de références |
| Génération de vidéos | `video_generate` | Alibaba, BytePlus, ComfyUI, fal, Google, MiniMax, OpenAI, Qwen, Runway, Together, Vydra, xAI | Crée des vidéos à partir de texte, d’images ou de vidéos existantes |
| Génération de musique | `music_generate` | ComfyUI, Google, MiniMax                                                                    | Crée de la musique ou des pistes audio à partir d’invites textuelles |
| Synthèse vocale (TTS) | `tts`           | ElevenLabs, Google, Gradium, Local CLI, Microsoft, MiniMax, OpenAI, Vydra, xAI, Xiaomi MiMo | Convertit les réponses sortantes en audio parlé            |
| Compréhension des médias | (automatique) | Tout fournisseur de modèles compatible vision/audio, plus les solutions CLI de secours      | Résume les images, l’audio et les vidéos entrants          |

## Matrice des capacités des fournisseurs

Ce tableau indique quels fournisseurs prennent en charge quelles capacités multimédias sur la plateforme.

| Fournisseur | Image | Vidéo | Musique | TTS | STT / Transcription | Voix temps réel | Compréhension des médias |
| ----------- | ----- | ----- | ------- | --- | ------------------- | --------------- | ------------------------ |
| Alibaba     |       | Yes   |         |     |                     |                 |                          |
| BytePlus    |       | Yes   |         |     |                     |                 |                          |
| ComfyUI     | Yes   | Yes   | Yes     |     |                     |                 |                          |
| Deepgram    |       |       |         |     | Yes                 | Yes             |                          |
| ElevenLabs  |       |       |         | Yes | Yes                 |                 |                          |
| fal         | Yes   | Yes   |         |     |                     |                 |                          |
| Google      | Yes   | Yes   | Yes     | Yes |                     | Yes             | Yes                      |
| Gradium     |       |       |         | Yes |                     |                 |                          |
| Local CLI   |       |       |         | Yes |                     |                 |                          |
| Microsoft   |       |       |         | Yes |                     |                 |                          |
| MiniMax     | Yes   | Yes   | Yes     | Yes |                     |                 |                          |
| Mistral     |       |       |         |     | Yes                 |                 |                          |
| OpenAI      | Yes   | Yes   |         | Yes | Yes                 | Yes             | Yes                      |
| Qwen        |       | Yes   |         |     |                     |                 |                          |
| Runway      |       | Yes   |         |     |                     |                 |                          |
| SenseAudio  |       |       |         |     | Yes                 |                 |                          |
| Together    |       | Yes   |         |     |                     |                 |                          |
| Vydra       | Yes   | Yes   |         | Yes |                     |                 |                          |
| xAI         | Yes   | Yes   |         | Yes | Yes                 |                 | Yes                      |
| Xiaomi MiMo | Yes   |       |         | Yes |                     |                 | Yes                      |

<Note>
La compréhension des médias utilise tout modèle compatible vision ou audio enregistré dans votre configuration de fournisseur. Le tableau ci-dessus met en évidence les fournisseurs disposant d’une prise en charge dédiée de la compréhension des médias ; la plupart des fournisseurs LLM avec des modèles multimodaux (Anthropic, Google, OpenAI, etc.) peuvent également comprendre les médias entrants lorsqu’ils sont configurés comme modèle de réponse actif.
</Note>

## Fonctionnement de la génération asynchrone

La génération de vidéos et de musique s’exécute en tant que tâches d’arrière-plan, car le traitement côté fournisseur prend généralement de 30 secondes à plusieurs minutes. Lorsque l’agent appelle `video_generate` ou `music_generate`, OpenClaw envoie la requête au fournisseur, renvoie immédiatement un identifiant de tâche et suit le job dans le registre des tâches. L’agent continue à répondre à d’autres messages pendant l’exécution du job. Lorsque le fournisseur a terminé, OpenClaw réveille l’agent afin qu’il puisse publier le média final dans le canal d’origine. La génération d’images et le TTS sont synchrones et se terminent dans le flux de la réponse.

Deepgram, ElevenLabs, Mistral, OpenAI, SenseAudio et xAI peuvent tous transcrire
l’audio entrant via le chemin batch `tools.media.audio` lorsqu’ils sont configurés.
Deepgram, ElevenLabs, Mistral, OpenAI et xAI enregistrent aussi des
fournisseurs STT en streaming pour Voice Call, de sorte que l’audio téléphonique en direct peut être transmis au fournisseur
sélectionné sans attendre qu’un enregistrement soit terminé.

Google correspond aux surfaces OpenClaw de génération d’images, de vidéos, de musique, de TTS batch, de voix temps réel backend et de compréhension des médias. OpenAI correspond aux surfaces OpenClaw de génération d’images,
de vidéos, de TTS batch, de STT batch, de STT en streaming Voice Call, de voix temps réel backend
et d’intégration mémoire. xAI correspond actuellement aux surfaces OpenClaw de génération d’images, de vidéos,
de recherche, d’exécution de code, de TTS batch, de STT batch et de STT en streaming Voice Call.
La voix xAI Realtime est une capacité upstream, mais elle n’est pas
enregistrée dans OpenClaw tant que le contrat partagé de voix temps réel ne peut pas la représenter.

## Liens rapides

- [Génération d’images](/fr/tools/image-generation) -- génération et modification d’images
- [Génération de vidéos](/fr/tools/video-generation) -- texte vers vidéo, image vers vidéo et vidéo vers vidéo
- [Génération de musique](/fr/tools/music-generation) -- création de musique et de pistes audio
- [Synthèse vocale](/fr/tools/tts) -- conversion des réponses en audio parlé
- [Compréhension des médias](/fr/nodes/media-understanding) -- compréhension des images, de l’audio et des vidéos entrants

## Lié

- [Génération d’images](/fr/tools/image-generation)
- [Génération de vidéos](/fr/tools/video-generation)
- [Génération de musique](/fr/tools/music-generation)
- [Synthèse vocale](/fr/tools/tts)
