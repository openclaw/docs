---
read_when:
    - Vous recherchez un aperçu des capacités multimédias d’OpenClaw
    - Choisir le fournisseur de médias à configurer
    - Comprendre le fonctionnement de la génération de médias asynchrone
sidebarTitle: Media overview
summary: Capacités d’image, de vidéo, de musique, de parole et de compréhension des médias en un coup d’œil
title: Vue d’ensemble des médias
x-i18n:
    generated_at: "2026-04-30T07:52:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9f40e4fb86832438ae99dd2dc42da93c41937541314d95486c97c210dfef508
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw génère des images, des vidéos et de la musique, comprend les médias entrants
(images, audio, vidéo) et lit les réponses à voix haute avec la synthèse vocale. Toutes
les capacités médias reposent sur des outils : l’agent décide quand les utiliser selon
la conversation, et chaque outil n’apparaît que lorsqu’au moins un fournisseur sous-jacent
est configuré.

## Capacités

<CardGroup cols={2}>
  <Card title="Génération d’images" href="/fr/tools/image-generation" icon="image">
    Créez et modifiez des images à partir de prompts textuels ou d’images de référence via
    `image_generate`. Synchrone — se termine dans le flux de la réponse.
  </Card>
  <Card title="Génération de vidéos" href="/fr/tools/video-generation" icon="video">
    Texte-vers-vidéo, image-vers-vidéo et vidéo-vers-vidéo via `video_generate`.
    Asynchrone — s’exécute en arrière-plan et publie le résultat lorsqu’il est prêt.
  </Card>
  <Card title="Génération de musique" href="/fr/tools/music-generation" icon="music">
    Générez de la musique ou des pistes audio via `music_generate`. Asynchrone chez les
    fournisseurs partagés ; le chemin de workflow ComfyUI s’exécute de façon synchrone.
  </Card>
  <Card title="Synthèse vocale" href="/fr/tools/tts" icon="microphone">
    Convertissez les réponses sortantes en audio parlé via l’outil `tts` et la configuration
    `messages.tts`. Synchrone.
  </Card>
  <Card title="Compréhension des médias" href="/fr/nodes/media-understanding" icon="eye">
    Résumez les images, l’audio et la vidéo entrants à l’aide de fournisseurs de modèles
    compatibles avec la vision et de plugins dédiés à la compréhension des médias.
  </Card>
  <Card title="Reconnaissance vocale" href="/fr/nodes/audio" icon="ear-listen">
    Transcrivez les messages vocaux entrants via des fournisseurs STT par lots ou STT en
    streaming pour les appels vocaux.
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
dans votre configuration de fournisseur. La matrice ci-dessus liste les fournisseurs avec une prise
en charge dédiée de la compréhension des médias ; la plupart des fournisseurs de LLM multimodaux
(Anthropic, Google, OpenAI, etc.) peuvent aussi comprendre les médias entrants lorsqu’ils sont
configurés comme modèle de réponse actif.
</Note>

## Asynchrone ou synchrone

| Capacité        | Mode        | Pourquoi                                                          |
| --------------- | ----------- | ----------------------------------------------------------------- |
| Image           | Synchrone   | Les réponses du fournisseur reviennent en quelques secondes ; se termine dans le flux de la réponse. |
| Synthèse vocale | Synchrone   | Les réponses du fournisseur reviennent en quelques secondes ; jointes à l’audio de réponse. |
| Vidéo           | Asynchrone  | Le traitement fournisseur prend 30 s à plusieurs minutes.         |
| Musique (partagée) | Asynchrone | Même caractéristique de traitement fournisseur que la vidéo.      |
| Musique (ComfyUI) | Synchrone | Le workflow local s’exécute dans le flux contre le serveur ComfyUI configuré. |

Pour les outils asynchrones, OpenClaw soumet la requête au fournisseur, renvoie immédiatement un
identifiant de tâche et suit le job dans le registre des tâches. L’agent continue de répondre aux
autres messages pendant que le job s’exécute. Lorsque le fournisseur termine, OpenClaw réveille
l’agent afin qu’il puisse republier le média terminé dans le canal d’origine.

## Reconnaissance vocale et appel vocal

Deepgram, DeepInfra, ElevenLabs, Mistral, OpenAI, SenseAudio et xAI peuvent tous transcrire
l’audio entrant via le chemin par lots `tools.media.audio` lorsqu’ils sont configurés.
Les plugins de canal qui précontrôlent une note vocale pour le filtrage des mentions ou l’analyse
des commandes marquent la pièce jointe transcrite dans le contexte entrant, afin que la passe
partagée de compréhension des médias réutilise cette transcription au lieu d’effectuer un second
appel STT pour le même audio.

Deepgram, ElevenLabs, Mistral, OpenAI et xAI enregistrent aussi des fournisseurs STT en streaming
pour les appels vocaux, afin que l’audio téléphonique en direct puisse être transmis au fournisseur
sélectionné sans attendre un enregistrement terminé.

## Correspondances des fournisseurs (répartition des fournisseurs entre les surfaces)

<AccordionGroup>
  <Accordion title="Google">
    Surfaces d’image, de vidéo, de musique, de TTS par lots, de voix en temps réel côté backend et
    de compréhension des médias.
  </Accordion>
  <Accordion title="OpenAI">
    Surfaces d’image, de vidéo, de TTS par lots, de STT par lots, de STT en streaming pour les
    appels vocaux, de voix en temps réel côté backend et d’embeddings mémoire.
  </Accordion>
  <Accordion title="DeepInfra">
    Surfaces de chat/routage de modèles, de génération/modification d’images, de texte-vers-vidéo,
    de TTS par lots, de STT par lots, de compréhension des médias image et d’embeddings mémoire.
    Les modèles natifs DeepInfra de rerank/classification/détection d’objets ne sont pas enregistrés
    tant qu’OpenClaw ne dispose pas de contrats de fournisseur dédiés pour ces catégories.
  </Accordion>
  <Accordion title="xAI">
    Image, vidéo, recherche, exécution de code, TTS par lots, STT par lots et STT en streaming pour les
    appels vocaux. La voix en temps réel xAI est une capacité amont, mais elle n’est pas enregistrée
    dans OpenClaw tant que le contrat partagé de voix en temps réel ne peut pas la représenter.
  </Accordion>
</AccordionGroup>

## Associé

- [Génération d’images](/fr/tools/image-generation)
- [Génération de vidéos](/fr/tools/video-generation)
- [Génération de musique](/fr/tools/music-generation)
- [Synthèse vocale](/fr/tools/tts)
- [Compréhension des médias](/fr/nodes/media-understanding)
- [Nœuds audio](/fr/nodes/audio)
