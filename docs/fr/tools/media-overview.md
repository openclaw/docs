---
read_when:
    - Recherche d’un aperçu des capacités multimédias d’OpenClaw
    - Choisir quel fournisseur multimédia configurer
    - Comprendre le fonctionnement de la génération multimédia asynchrone
sidebarTitle: Media overview
summary: Aperçu des capacités d’image, de vidéo, de musique, de voix et de compréhension des médias
title: Aperçu des médias
x-i18n:
    generated_at: "2026-04-26T11:40:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 70be8062c01f57bf53ab08aad4f1561e3958adc94e478224821d722fd500e09f
    source_path: tools/media-overview.md
    workflow: 15
---

OpenClaw génère des images, des vidéos et de la musique, comprend les médias entrants
(images, audio, vidéo), et lit ses réponses à voix haute avec la synthèse vocale. Toutes les
capacités multimédias sont pilotées par des outils : l’agent décide quand les utiliser selon
la conversation, et chaque outil n’apparaît que lorsqu’au moins un fournisseur sous-jacent est configuré.

## Capacités

<CardGroup cols={2}>
  <Card title="Génération d’images" href="/fr/tools/image-generation" icon="image">
    Créez et modifiez des images à partir d’invites textuelles ou d’images de référence via
    `image_generate`. Synchrone — se termine dans la réponse.
  </Card>
  <Card title="Génération de vidéos" href="/fr/tools/video-generation" icon="video">
    Texte-vers-vidéo, image-vers-vidéo, et vidéo-vers-vidéo via `video_generate`.
    Asynchrone — s’exécute en arrière-plan et publie le résultat lorsqu’il est prêt.
  </Card>
  <Card title="Génération musicale" href="/fr/tools/music-generation" icon="music">
    Générez de la musique ou des pistes audio via `music_generate`. Asynchrone sur les fournisseurs
    partagés ; le chemin de workflow ComfyUI s’exécute de manière synchrone.
  </Card>
  <Card title="Synthèse vocale" href="/fr/tools/tts" icon="microphone">
    Convertissez les réponses sortantes en audio parlé via l’outil `tts` et la
    configuration `messages.tts`. Synchrone.
  </Card>
  <Card title="Compréhension des médias" href="/fr/nodes/media-understanding" icon="eye">
    Résume les images, l’audio et la vidéo entrants à l’aide de fournisseurs de modèles
    compatibles avec la vision et de Plugins dédiés à la compréhension des médias.
  </Card>
  <Card title="Speech-to-text" href="/fr/nodes/audio" icon="ear-listen">
    Transcrit les messages vocaux entrants via des fournisseurs STT par lot ou des
    fournisseurs STT de streaming Voice Call.
  </Card>
</CardGroup>

## Matrice des capacités des fournisseurs

| Fournisseur | Image | Vidéo | Musique | TTS | STT | Voix temps réel | Compréhension des médias |
| ----------- | :---: | :---: | :-----: | :-: | :-: | :-------------: | :----------------------: |
| Alibaba     |       |   ✓   |         |     |     |                 |                          |
| BytePlus    |       |   ✓   |         |     |     |                 |                          |
| ComfyUI     |   ✓   |   ✓   |    ✓    |     |     |                 |                          |
| Deepgram    |       |       |         |     |  ✓  |        ✓        |                          |
| ElevenLabs  |       |       |         |  ✓  |  ✓  |                 |                          |
| fal         |   ✓   |   ✓   |         |     |     |                 |                          |
| Google      |   ✓   |   ✓   |    ✓    |  ✓  |     |        ✓        |            ✓             |
| Gradium     |       |       |         |  ✓  |     |                 |                          |
| Local CLI   |       |       |         |  ✓  |     |                 |                          |
| Microsoft   |       |       |         |  ✓  |     |                 |                          |
| MiniMax     |   ✓   |   ✓   |    ✓    |  ✓  |     |                 |                          |
| Mistral     |       |       |         |     |  ✓  |                 |                          |
| OpenAI      |   ✓   |   ✓   |         |  ✓  |  ✓  |        ✓        |            ✓             |
| Qwen        |       |   ✓   |         |     |     |                 |                          |
| Runway      |       |   ✓   |         |     |     |                 |                          |
| SenseAudio  |       |       |         |     |  ✓  |                 |                          |
| Together    |       |   ✓   |         |     |     |                 |                          |
| Vydra       |   ✓   |   ✓   |         |  ✓  |     |                 |                          |
| xAI         |   ✓   |   ✓   |         |  ✓  |  ✓  |                 |            ✓             |
| Xiaomi MiMo |   ✓   |       |         |  ✓  |     |                 |            ✓             |

<Note>
La compréhension des médias utilise tout modèle compatible avec la vision ou l’audio enregistré
dans votre configuration fournisseur. La matrice ci-dessus répertorie les fournisseurs avec une prise en charge
dédiée de la compréhension des médias ; la plupart des fournisseurs LLM multimodaux (Anthropic, Google,
OpenAI, etc.) peuvent aussi comprendre les médias entrants lorsqu’ils sont configurés comme modèle de
réponse actif.
</Note>

## Asynchrone vs synchrone

| Capacité        | Mode         | Pourquoi                                                           |
| --------------- | ------------ | ------------------------------------------------------------------ |
| Image           | Synchrone    | Les réponses des fournisseurs reviennent en quelques secondes ; se termine dans la réponse. |
| Synthèse vocale | Synchrone    | Les réponses des fournisseurs reviennent en quelques secondes ; jointes à l’audio de la réponse. |
| Vidéo           | Asynchrone   | Le traitement par le fournisseur prend de 30 s à plusieurs minutes. |
| Musique (partagée) | Asynchrone | Même caractéristique de traitement fournisseur que pour la vidéo.  |
| Musique (ComfyUI) | Synchrone  | Le workflow local s’exécute en ligne sur le serveur ComfyUI configuré. |

Pour les outils asynchrones, OpenClaw soumet la requête au fournisseur, renvoie immédiatement un identifiant
de tâche, et suit le travail dans le registre des tâches. L’agent continue
de répondre à d’autres messages pendant l’exécution du travail. Lorsque le fournisseur a terminé,
OpenClaw réveille l’agent afin qu’il puisse republier le média terminé dans le
canal d’origine.

## Speech-to-text et Voice Call

Deepgram, ElevenLabs, Mistral, OpenAI, SenseAudio, et xAI peuvent tous transcrire
l’audio entrant via le chemin par lot `tools.media.audio` lorsqu’ils sont configurés.
Les Plugins de canal qui pré-vérifient une note vocale pour le filtrage des mentions ou l’analyse
des commandes marquent la pièce jointe transcrite dans le contexte entrant, de sorte que la passe partagée
de compréhension des médias réutilise cette transcription au lieu d’effectuer un second appel
STT pour le même audio.

Deepgram, ElevenLabs, Mistral, OpenAI, et xAI enregistrent aussi des fournisseurs STT
de streaming Voice Call, afin que l’audio téléphonique en direct puisse être transféré au
fournisseur sélectionné sans attendre un enregistrement terminé.

## Mappages des fournisseurs (comment les vendeurs se répartissent selon les surfaces)

<AccordionGroup>
  <Accordion title="Google">
    Surfaces de génération d’images, de vidéos, de musique, TTS par lot, voix temps réel backend, et
    compréhension des médias.
  </Accordion>
  <Accordion title="OpenAI">
    Surfaces d’image, de vidéo, TTS par lot, STT par lot, STT de streaming Voice Call, voix temps réel
    backend, et embeddings mémoire.
  </Accordion>
  <Accordion title="xAI">
    Image, vidéo, recherche, exécution de code, TTS par lot, STT par lot, et STT
    de streaming Voice Call. La voix temps réel xAI est une capacité amont mais n’est
    pas enregistrée dans OpenClaw tant que le contrat partagé de voix temps réel ne peut
    pas la représenter.
  </Accordion>
</AccordionGroup>

## Lié

- [Génération d’images](/fr/tools/image-generation)
- [Génération de vidéos](/fr/tools/video-generation)
- [Génération musicale](/fr/tools/music-generation)
- [Synthèse vocale](/fr/tools/tts)
- [Compréhension des médias](/fr/nodes/media-understanding)
- [Nœuds audio](/fr/nodes/audio)
