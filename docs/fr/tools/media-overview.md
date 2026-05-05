---
read_when:
    - Vous cherchez un aperçu des capacités multimédias d’OpenClaw
    - Choisir le fournisseur de médias à configurer
    - Comprendre le fonctionnement de la génération asynchrone de médias
sidebarTitle: Media overview
summary: Fonctionnalités d’image, de vidéo, de musique, de parole et de compréhension des médias en un coup d’œil
title: Vue d’ensemble des médias
x-i18n:
    generated_at: "2026-05-05T06:19:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: fd02d4418fe294fda5f1437dd3a07c4aeb4de3b46a1b70bfe36914bc27123cc4
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw génère des images, des vidéos et de la musique, comprend les médias entrants
(images, audio, vidéo) et prononce les réponses à voix haute avec la synthèse vocale. Toutes
les capacités multimédias sont pilotées par des outils : l’agent décide quand les utiliser en fonction
de la conversation, et chaque outil n’apparaît que lorsqu’au moins un fournisseur sous-jacent
est configuré.

## Capacités

<CardGroup cols={2}>
  <Card title="Génération d’images" href="/fr/tools/image-generation" icon="image">
    Créez et modifiez des images à partir de prompts textuels ou d’images de référence via
    `image_generate`. Synchrone — se termine directement dans la réponse.
  </Card>
  <Card title="Génération de vidéos" href="/fr/tools/video-generation" icon="video">
    Texte-vers-vidéo, image-vers-vidéo et vidéo-vers-vidéo via `video_generate`.
    Asynchrone — s’exécute en arrière-plan et publie le résultat lorsqu’il est prêt.
  </Card>
  <Card title="Génération de musique" href="/fr/tools/music-generation" icon="music">
    Générez de la musique ou des pistes audio via `music_generate`. Asynchrone sur les
    fournisseurs partagés ; le chemin de workflow ComfyUI s’exécute de manière synchrone.
  </Card>
  <Card title="Synthèse vocale" href="/fr/tools/tts" icon="microphone">
    Convertissez les réponses sortantes en audio parlé via l’outil `tts` et la configuration
    `messages.tts`. Synchrone.
  </Card>
  <Card title="Compréhension multimédia" href="/fr/nodes/media-understanding" icon="eye">
    Résumez les images, l’audio et les vidéos entrants à l’aide de fournisseurs de modèles
    capables de vision et de plugins dédiés à la compréhension multimédia.
  </Card>
  <Card title="Reconnaissance vocale" href="/fr/nodes/audio" icon="ear-listen">
    Transcrivez les messages vocaux entrants via des fournisseurs de STT par lot ou de STT
    en streaming pour Voice Call.
  </Card>
</CardGroup>

## Matrice des capacités des fournisseurs

| Fournisseur | Image | Vidéo | Musique | TTS | STT | Voix en temps réel | Compréhension multimédia |
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
La compréhension multimédia utilise tout modèle capable de vision ou d’audio enregistré
dans votre configuration de fournisseur. La matrice ci-dessus liste les fournisseurs disposant d’une prise en charge dédiée
de la compréhension multimédia ; la plupart des fournisseurs de LLM multimodaux (Anthropic, Google,
OpenAI, etc.) peuvent également comprendre les médias entrants lorsqu’ils sont configurés comme modèle de
réponse actif.
</Note>

## Asynchrone ou synchrone

| Capacité        | Mode         | Pourquoi                                                                                            |
| --------------- | ------------ | -------------------------------------------------------------------------------------------------- |
| Image           | Synchrone    | Les réponses du fournisseur reviennent en quelques secondes ; se termine directement dans la réponse. |
| Synthèse vocale | Synchrone    | Les réponses du fournisseur reviennent en quelques secondes ; jointes à l’audio de la réponse.     |
| Vidéo           | Asynchrone   | Le traitement par le fournisseur prend de 30 s à plusieurs minutes ; les files lentes peuvent aller jusqu’au délai d’expiration configuré. |
| Musique (partagée) | Asynchrone | Même caractéristique de traitement par le fournisseur que pour la vidéo.                           |
| Musique (ComfyUI) | Synchrone  | Le workflow local s’exécute directement sur le serveur ComfyUI configuré.                          |

Pour les outils asynchrones, OpenClaw soumet la demande au fournisseur, renvoie immédiatement un identifiant de tâche
et suit le travail dans le registre des tâches. L’agent continue
de répondre aux autres messages pendant que le travail s’exécute. Lorsque le fournisseur a terminé,
OpenClaw réveille l’agent avec les chemins des médias générés afin qu’il puisse informer
l’utilisateur et, lorsque la politique de livraison de la source l’exige, relayer le résultat via
l’outil de message. Pour les routes de groupe/canal qui utilisent uniquement l’outil de message, OpenClaw considère
l’absence de preuve de livraison par l’outil de message comme une tentative d’achèvement échouée et envoie
le média généré de secours directement au canal d’origine.

## Reconnaissance vocale et Voice Call

Deepgram, DeepInfra, ElevenLabs, Mistral, OpenAI, SenseAudio et xAI peuvent tous transcrire
l’audio entrant via le chemin par lot `tools.media.audio` lorsqu’ils sont configurés.
Les plugins de canal qui précontrôlent une note vocale pour le filtrage des mentions ou l’analyse des commandes
marquent la pièce jointe transcrite sur le contexte entrant, afin que la passe partagée de
compréhension multimédia réutilise cette transcription au lieu de lancer un second appel
STT pour le même audio.

Deepgram, ElevenLabs, Mistral, OpenAI et xAI enregistrent également des fournisseurs de STT
en streaming pour Voice Call, afin que l’audio téléphonique en direct puisse être transmis au fournisseur sélectionné
sans attendre un enregistrement terminé.

## Correspondances des fournisseurs (répartition des vendeurs entre les surfaces)

<AccordionGroup>
  <Accordion title="Google">
    Surfaces d’image, de vidéo, de musique, de TTS par lot, de voix temps réel côté backend et de
    compréhension multimédia.
  </Accordion>
  <Accordion title="OpenAI">
    Surfaces d’image, de vidéo, de TTS par lot, de STT par lot, de STT en streaming pour Voice Call, de voix
    temps réel côté backend et d’embeddings de mémoire.
  </Accordion>
  <Accordion title="DeepInfra">
    Routage chat/modèle, génération/modification d’images, texte-vers-vidéo, TTS par lot,
    STT par lot, compréhension multimédia d’images et surfaces d’embeddings de mémoire.
    Les modèles de rerank/classification/détection d’objets natifs de DeepInfra ne sont pas
    enregistrés tant qu’OpenClaw ne dispose pas de contrats fournisseur dédiés à ces
    catégories.
  </Accordion>
  <Accordion title="xAI">
    Image, vidéo, recherche, exécution de code, TTS par lot, STT par lot et STT en streaming pour Voice
    Call. La voix en temps réel de xAI est une capacité amont, mais elle n’est
    pas enregistrée dans OpenClaw tant que le contrat partagé de voix temps réel ne peut pas
    la représenter.
  </Accordion>
</AccordionGroup>

## Associés

- [Génération d’images](/fr/tools/image-generation)
- [Génération de vidéos](/fr/tools/video-generation)
- [Génération de musique](/fr/tools/music-generation)
- [Synthèse vocale](/fr/tools/tts)
- [Compréhension multimédia](/fr/nodes/media-understanding)
- [Nœuds audio](/fr/nodes/audio)
