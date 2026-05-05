---
read_when:
    - Recherche d’un aperçu des capacités multimédias d’OpenClaw
    - Choisir le fournisseur de médias à configurer
    - Comprendre le fonctionnement de la génération asynchrone de médias
sidebarTitle: Media overview
summary: Aperçu des capacités d’image, de vidéo, de musique, de parole et de compréhension des médias
title: Présentation des médias
x-i18n:
    generated_at: "2026-05-05T01:50:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bd6b93fd79897001d24f3ba5a5c8cb9bd17281116fad17262a6389214db7059
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw génère des images, des vidéos et de la musique, comprend les médias entrants
(images, audio, vidéo) et énonce les réponses à voix haute avec la synthèse vocale. Toutes
les capacités multimédias sont pilotées par des outils : l’agent décide quand les utiliser en fonction
de la conversation, et chaque outil n’apparaît que lorsqu’au moins un fournisseur sous-jacent
est configuré.

## Capacités

<CardGroup cols={2}>
  <Card title="Image generation" href="/fr/tools/image-generation" icon="image">
    Créez et modifiez des images à partir d’invites textuelles ou d’images de référence via
    `image_generate`. Synchrone — se termine dans le flux de la réponse.
  </Card>
  <Card title="Video generation" href="/fr/tools/video-generation" icon="video">
    Texte-vers-vidéo, image-vers-vidéo et vidéo-vers-vidéo via `video_generate`.
    Asynchrone — s’exécute en arrière-plan et publie le résultat lorsqu’il est prêt.
  </Card>
  <Card title="Music generation" href="/fr/tools/music-generation" icon="music">
    Générez de la musique ou des pistes audio via `music_generate`. Asynchrone sur les
    fournisseurs partagés ; le chemin de workflow ComfyUI s’exécute de manière synchrone.
  </Card>
  <Card title="Text-to-speech" href="/fr/tools/tts" icon="microphone">
    Convertissez les réponses sortantes en audio parlé via l’outil `tts` et la configuration
    `messages.tts`. Synchrone.
  </Card>
  <Card title="Media understanding" href="/fr/nodes/media-understanding" icon="eye">
    Résumez les images, l’audio et la vidéo entrants à l’aide de fournisseurs de modèles
    compatibles avec la vision et de plugins dédiés à la compréhension des médias.
  </Card>
  <Card title="Speech-to-text" href="/fr/nodes/audio" icon="ear-listen">
    Transcrivez les messages vocaux entrants via des fournisseurs STT par lots ou STT
    en streaming pour Voice Call.
  </Card>
</CardGroup>

## Matrice des capacités des fournisseurs

| Fournisseur | Image | Vidéo | Musique | TTS | STT | Voix en temps réel | Compréhension des médias |
| ----------- | :---: | :---: | :-----: | :-: | :-: | :----------------: | :----------------------: |
| Alibaba     |       |   ✓   |         |     |     |                    |                          |
| BytePlus    |       |   ✓   |         |     |     |                    |                          |
| ComfyUI     |   ✓   |   ✓   |    ✓    |     |     |                    |                          |
| DeepInfra   |   ✓   |   ✓   |         |  ✓  |  ✓  |                    |            ✓             |
| Deepgram    |       |       |         |     |  ✓  |         ✓          |                          |
| ElevenLabs  |       |       |         |  ✓  |  ✓  |                    |                          |
| fal         |   ✓   |   ✓   |         |     |     |                    |                          |
| Google      |   ✓   |   ✓   |    ✓    |  ✓  |     |         ✓          |            ✓             |
| Gradium     |       |       |         |  ✓  |     |                    |                          |
| Local CLI   |       |       |         |  ✓  |     |                    |                          |
| Microsoft   |       |       |         |  ✓  |     |                    |                          |
| MiniMax     |   ✓   |   ✓   |    ✓    |  ✓  |     |                    |                          |
| Mistral     |       |       |         |     |  ✓  |                    |                          |
| OpenAI      |   ✓   |   ✓   |         |  ✓  |  ✓  |         ✓          |            ✓             |
| OpenRouter  |   ✓   |   ✓   |         |  ✓  |     |                    |            ✓             |
| Qwen        |       |   ✓   |         |     |     |                    |                          |
| Runway      |       |   ✓   |         |     |     |                    |                          |
| SenseAudio  |       |       |         |     |  ✓  |                    |                          |
| Together    |       |   ✓   |         |     |     |                    |                          |
| Vydra       |   ✓   |   ✓   |         |  ✓  |     |                    |                          |
| xAI         |   ✓   |   ✓   |         |  ✓  |  ✓  |                    |            ✓             |
| Xiaomi MiMo |   ✓   |       |         |  ✓  |     |                    |            ✓             |

<Note>
La compréhension des médias utilise tout modèle compatible avec la vision ou l’audio enregistré
dans votre configuration de fournisseur. La matrice ci-dessus liste les fournisseurs avec une prise en charge
dédiée de la compréhension des médias ; la plupart des fournisseurs de LLM multimodaux (Anthropic, Google,
OpenAI, etc.) peuvent aussi comprendre les médias entrants lorsqu’ils sont configurés comme modèle de
réponse actif.
</Note>

## Asynchrone ou synchrone

| Capacité         | Mode         | Pourquoi                                                          |
| ---------------- | ------------ | ----------------------------------------------------------------- |
| Image            | Synchrone    | Les réponses du fournisseur arrivent en quelques secondes ; se termine dans le flux de la réponse. |
| Synthèse vocale  | Synchrone    | Les réponses du fournisseur arrivent en quelques secondes ; jointes à l’audio de la réponse. |
| Vidéo            | Asynchrone   | Le traitement par le fournisseur prend de 30 s à plusieurs minutes. |
| Musique (partagée) | Asynchrone | Même caractéristique de traitement fournisseur que la vidéo.       |
| Musique (ComfyUI) | Synchrone   | Le workflow local s’exécute en ligne contre le serveur ComfyUI configuré. |

Pour les outils asynchrones, OpenClaw soumet la demande au fournisseur, renvoie immédiatement un identifiant
de tâche et suit le job dans le registre des tâches. L’agent continue de répondre
aux autres messages pendant l’exécution du job. Lorsque le fournisseur termine,
OpenClaw réveille l’agent avec les chemins des médias générés afin qu’il puisse prévenir
l’utilisateur et, lorsque la politique de livraison de la source l’exige, relayer le résultat via
l’outil de message.

## Speech-to-text et Voice Call

Deepgram, DeepInfra, ElevenLabs, Mistral, OpenAI, SenseAudio et xAI peuvent tous transcrire
l’audio entrant via le chemin par lots `tools.media.audio` lorsqu’ils sont configurés.
Les plugins de canal qui prévalident une note vocale pour le filtrage des mentions ou l’analyse
des commandes marquent la pièce jointe transcrite sur le contexte entrant, afin que la passe partagée
de compréhension des médias réutilise cette transcription au lieu d’effectuer un second appel
STT pour le même audio.

Deepgram, ElevenLabs, Mistral, OpenAI et xAI enregistrent également des fournisseurs STT
en streaming pour Voice Call, afin que l’audio téléphonique en direct puisse être transmis au fournisseur
sélectionné sans attendre un enregistrement terminé.

## Correspondances des fournisseurs (comment les fournisseurs se répartissent entre les surfaces)

<AccordionGroup>
  <Accordion title="Google">
    Surfaces image, vidéo, musique, TTS par lots, voix en temps réel côté backend et
    compréhension des médias.
  </Accordion>
  <Accordion title="OpenAI">
    Surfaces image, vidéo, TTS par lots, STT par lots, STT en streaming pour Voice Call, voix
    en temps réel côté backend et embeddings de mémoire.
  </Accordion>
  <Accordion title="DeepInfra">
    Surfaces routage chat/modèle, génération/édition d’images, texte-vers-vidéo, TTS par lots,
    STT par lots, compréhension des médias image et embeddings de mémoire.
    Les modèles natifs DeepInfra de rerank/classification/détection d’objets ne sont pas
    enregistrés tant qu’OpenClaw ne dispose pas de contrats de fournisseur dédiés pour ces
    catégories.
  </Accordion>
  <Accordion title="xAI">
    Image, vidéo, recherche, exécution de code, TTS par lots, STT par lots et STT en streaming pour Voice
    Call. La voix en temps réel xAI est une capacité amont, mais elle n’est
    pas enregistrée dans OpenClaw tant que le contrat partagé de voix en temps réel ne peut pas
    la représenter.
  </Accordion>
</AccordionGroup>

## Connexe

- [Génération d’images](/fr/tools/image-generation)
- [Génération de vidéos](/fr/tools/video-generation)
- [Génération de musique](/fr/tools/music-generation)
- [Synthèse vocale](/fr/tools/tts)
- [Compréhension des médias](/fr/nodes/media-understanding)
- [Nœuds audio](/fr/nodes/audio)
