---
read_when:
    - Vous cherchez un aperçu des capacités multimédias d’OpenClaw
    - Choisir le fournisseur de médias à configurer
    - Comprendre le fonctionnement de la génération asynchrone de médias
sidebarTitle: Media overview
summary: Capacités d’image, de vidéo, de musique, de parole et de compréhension des médias en un coup d’œil
title: Vue d’ensemble des médias
x-i18n:
    generated_at: "2026-05-12T08:46:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7ca89d058467968ee140cb3318fe8a1fb96d09fe7c59982efce36eb9b714591
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw génère des images, des vidéos et de la musique, comprend les médias entrants
(images, audio, vidéo) et prononce les réponses à voix haute avec la synthèse vocale. Toutes
les capacités média sont pilotées par des outils : l’agent décide quand les utiliser en fonction
de la conversation, et chaque outil n’apparaît que lorsqu’au moins un fournisseur sous-jacent
est configuré.

La parole en direct utilise le contrat de session Talk au lieu du chemin d’outil média ponctuel.
Talk dispose de trois modes : `realtime` natif du fournisseur, `stt-tts` local ou en streaming,
et `transcription` pour la capture vocale en observation seule. Ces modes partagent les
catalogues de fournisseurs, les enveloppes d’événements et les sémantiques d’annulation avec
la téléphonie, les réunions, le temps réel dans le navigateur et les clients push-to-talk natifs.

## Capacités

<CardGroup cols={2}>
  <Card title="Génération d’images" href="/fr/tools/image-generation" icon="image">
    Créez et modifiez des images à partir de prompts textuels ou d’images de référence via
    `image_generate`. Synchrone — se termine dans le fil de la réponse.
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
    streaming Voice Call.
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
| OpenRouter  |   ✓   |   ✓   |         |  ✓  |  ✓  |                    |            ✓             |
| Qwen        |       |   ✓   |         |     |     |                    |                          |
| Runway      |       |   ✓   |         |     |     |                    |                          |
| SenseAudio  |       |       |         |     |  ✓  |                    |                          |
| Together    |       |   ✓   |         |     |     |                    |                          |
| Vydra       |   ✓   |   ✓   |         |  ✓  |     |                    |                          |
| xAI         |   ✓   |   ✓   |         |  ✓  |  ✓  |                    |            ✓             |
| Xiaomi MiMo |   ✓   |       |         |  ✓  |     |                    |            ✓             |

<Note>
La compréhension des médias utilise tout modèle compatible avec la vision ou l’audio enregistré
dans votre configuration de fournisseur. La matrice ci-dessus répertorie les fournisseurs dotés
d’une prise en charge dédiée de la compréhension des médias ; la plupart des fournisseurs de LLM
multimodaux (Anthropic, Google, OpenAI, etc.) peuvent aussi comprendre les médias entrants
lorsqu’ils sont configurés comme modèle de réponse actif.
</Note>

## Asynchrone ou synchrone

| Capacité          | Mode        | Pourquoi                                                                                            |
| ----------------- | ----------- | --------------------------------------------------------------------------------------------------- |
| Image             | Synchrone   | Les réponses du fournisseur reviennent en quelques secondes ; se termine dans le fil de la réponse. |
| Synthèse vocale   | Synchrone   | Les réponses du fournisseur reviennent en quelques secondes ; attachées à l’audio de réponse.       |
| Vidéo             | Asynchrone  | Le traitement du fournisseur prend de 30 s à plusieurs minutes ; les files lentes peuvent durer jusqu’au délai d’expiration configuré. |
| Musique (partagée) | Asynchrone | Même caractéristique de traitement fournisseur que la vidéo.                                        |
| Musique (ComfyUI) | Synchrone   | Le workflow local s’exécute dans le fil contre le serveur ComfyUI configuré.                        |

Pour les outils asynchrones, OpenClaw envoie la requête au fournisseur, retourne immédiatement un
id de tâche et suit le job dans le registre des tâches. L’agent continue de répondre aux autres
messages pendant que le job s’exécute. Lorsque le fournisseur a terminé, OpenClaw réveille l’agent
avec les chemins des médias générés afin qu’il puisse en informer l’utilisateur et, lorsque la
politique de livraison de la source l’exige, relayer le résultat via l’outil de message. Pour les
routes de groupe/canal limitées à l’outil de message, OpenClaw considère l’absence de preuve de
livraison par l’outil de message comme une tentative d’achèvement échouée et envoie directement
le média généré de secours au canal d’origine.

## Reconnaissance vocale et Voice Call

Deepgram, DeepInfra, ElevenLabs, Mistral, OpenAI, OpenRouter, SenseAudio et xAI peuvent tous transcrire
l’audio entrant via le chemin par lots `tools.media.audio` lorsqu’ils sont configurés.
Les plugins de canal qui prévalident une note vocale pour le filtrage des mentions ou l’analyse
des commandes marquent la pièce jointe transcrite sur le contexte entrant, afin que la passe
partagée de compréhension des médias réutilise cette transcription au lieu d’effectuer un second
appel STT pour le même audio.

Deepgram, ElevenLabs, Mistral, OpenAI et xAI enregistrent aussi des fournisseurs STT en streaming
Voice Call, afin que l’audio téléphonique en direct puisse être transmis au fournisseur sélectionné
sans attendre un enregistrement terminé.

Pour les conversations utilisateur en direct, privilégiez le [mode Talk](/fr/nodes/talk). Les pièces
jointes audio par lots restent sur le chemin média ; le temps réel dans le navigateur, le
push-to-talk natif, la téléphonie et l’audio des réunions doivent utiliser les événements Talk et
les catalogues liés à la session retournés par le Gateway.

## Correspondances de fournisseurs (répartition des vendeurs entre surfaces)

<AccordionGroup>
  <Accordion title="Google">
    Surfaces image, vidéo, musique, TTS par lots, voix en temps réel côté backend et
    compréhension des médias.
  </Accordion>
  <Accordion title="OpenAI">
    Surfaces image, vidéo, TTS par lots, STT par lots, STT en streaming Voice Call, voix en
    temps réel côté backend et embeddings de mémoire.
  </Accordion>
  <Accordion title="DeepInfra">
    Surfaces routage de chat/modèle, génération/édition d’images, texte-vers-vidéo, TTS par lots,
    STT par lots, compréhension des médias image et embeddings de mémoire.
    Les modèles DeepInfra natifs de rerank/classification/détection d’objets ne sont pas
    enregistrés tant qu’OpenClaw ne dispose pas de contrats de fournisseur dédiés pour ces
    catégories.
  </Accordion>
  <Accordion title="xAI">
    Image, vidéo, recherche, exécution de code, TTS par lots, STT par lots et STT en streaming
    Voice Call. La voix xAI Realtime est une capacité amont, mais elle n’est pas enregistrée dans
    OpenClaw tant que le contrat partagé de voix en temps réel ne peut pas la représenter.
  </Accordion>
</AccordionGroup>

## Connexe

- [Génération d’images](/fr/tools/image-generation)
- [Génération de vidéos](/fr/tools/video-generation)
- [Génération de musique](/fr/tools/music-generation)
- [Synthèse vocale](/fr/tools/tts)
- [Compréhension des médias](/fr/nodes/media-understanding)
- [Nœuds audio](/fr/nodes/audio)
- [Mode Talk](/fr/nodes/talk)
