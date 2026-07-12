---
read_when:
    - Vous recherchez un aperçu des fonctionnalités multimédias d’OpenClaw
    - Choisir le fournisseur de médias à configurer
    - Comprendre le fonctionnement de la génération asynchrone de médias
sidebarTitle: Media overview
summary: Aperçu des capacités de génération d’images, de vidéos, de musique et de parole, ainsi que de compréhension des médias
title: Présentation des médias
x-i18n:
    generated_at: "2026-07-12T03:24:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f7d7bf8bd2052cdba088d7a612bb89b0fc3a95b3635c7fcd2138eb731121b85f
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw génère des images, des vidéos et de la musique, comprend les médias entrants
(images, audio, vidéo) et prononce les réponses à voix haute grâce à la synthèse vocale. Toutes
les fonctionnalités multimédias sont pilotées par des outils : l’agent décide quand les utiliser en fonction
de la conversation, et chaque outil n’apparaît que lorsqu’au moins un fournisseur sous-jacent
est configuré.

La parole en direct utilise le contrat de session Talk plutôt que le chemin de l’outil multimédia
à usage unique. Talk propose trois modes : `realtime` natif du fournisseur, `stt-tts` local ou en streaming,
et `transcription` pour la capture vocale en observation seule. Ces modes
partagent les catalogues de fournisseurs, les enveloppes d’événements et la sémantique d’annulation avec
la téléphonie, les réunions, le temps réel dans le navigateur et les clients natifs de conversation par appui.

## Fonctionnalités

<CardGroup cols={2}>
  <Card title="Génération d’images" href="/fr/tools/image-generation" icon="image">
    Créez et modifiez des images à partir d’instructions textuelles ou d’images de référence via
    `image_generate`. Asynchrone dans les sessions de discussion — s’exécute en arrière-plan et
    publie le résultat lorsqu’il est prêt.
  </Card>
  <Card title="Génération de vidéos" href="/fr/tools/video-generation" icon="video">
    Conversion de texte en vidéo, d’image en vidéo et de vidéo en vidéo via `video_generate`.
    Asynchrone — s’exécute en arrière-plan et publie le résultat lorsqu’il est prêt.
  </Card>
  <Card title="Génération de musique" href="/fr/tools/music-generation" icon="music">
    Générez de la musique ou des pistes audio via `music_generate`. Asynchrone dans les sessions
    de discussion, selon le cycle de vie partagé des tâches de génération multimédia.
  </Card>
  <Card title="Synthèse vocale" href="/fr/tools/tts" icon="microphone">
    Convertissez les réponses sortantes en audio parlé via l’outil `tts` et la configuration
    `messages.tts`. Synchrone.
  </Card>
  <Card title="Compréhension des médias" href="/fr/nodes/media-understanding" icon="eye">
    Résumez les images, les contenus audio et les vidéos entrants à l’aide de fournisseurs de modèles
    dotés de capacités visuelles et de plugins dédiés à la compréhension des médias.
  </Card>
  <Card title="Reconnaissance vocale" href="/fr/nodes/audio" icon="ear-listen">
    Transcrivez les messages vocaux entrants au moyen de fournisseurs de STT par lots ou de STT
    en streaming pour Voice Call.
  </Card>
</CardGroup>

## Matrice des fonctionnalités des fournisseurs

<Note>
Ce tableau couvre les plugins dédiés à la génération multimédia, à la TTS et à la STT. De nombreux
fournisseurs de modèles de discussion (Anthropic, Google, OpenAI et d’autres) comprennent également
les médias entrants au moyen de leur modèle de réponse ; consultez la liste complète des fournisseurs dans
[Compréhension des médias](/fr/nodes/media-understanding#provider-support-matrix).
</Note>

| Fournisseur       | Image | Vidéo | Musique | TTS | STT | Voix en temps réel | Compréhension des médias |
| ----------------- | :---: | :---: | :-----: | :-: | :-: | :----------------: | :----------------------: |
| Alibaba           |       |   ✓   |         |     |     |                    |                          |
| Azure Speech      |       |       |         |  ✓  |     |                    |                          |
| BytePlus          |       |   ✓   |         |     |     |                    |                          |
| ComfyUI           |   ✓   |   ✓   |    ✓    |     |     |                    |                          |
| Deepgram          |       |       |         |     |  ✓  |                    |                          |
| DeepInfra         |   ✓   |   ✓   |         |  ✓  |  ✓  |                    |            ✓             |
| ElevenLabs        |       |       |         |  ✓  |  ✓  |                    |                          |
| fal               |   ✓   |   ✓   |    ✓    |     |     |                    |                          |
| Google            |   ✓   |   ✓   |    ✓    |  ✓  |  ✓  |         ✓          |            ✓             |
| Gradium           |       |       |         |  ✓  |     |                    |                          |
| Inworld           |       |       |         |  ✓  |     |                    |                          |
| LiteLLM           |   ✓   |       |         |     |     |                    |                          |
| CLI locale        |       |       |         |  ✓  |     |                    |                          |
| Microsoft         |       |       |         |  ✓  |     |                    |                          |
| Microsoft Foundry |   ✓   |       |         |     |     |                    |                          |
| MiniMax           |   ✓   |   ✓   |    ✓    |  ✓  |     |                    |                          |
| Mistral           |       |       |         |     |  ✓  |                    |                          |
| OpenAI            |   ✓   |   ✓   |         |  ✓  |  ✓  |         ✓          |            ✓             |
| OpenRouter        |   ✓   |   ✓   |    ✓    |  ✓  |  ✓  |                    |            ✓             |
| PixVerse          |       |   ✓   |         |     |     |                    |                          |
| Qwen              |       |   ✓   |         |     |     |                    |            ✓             |
| Runway            |       |   ✓   |         |     |     |                    |                          |
| SenseAudio        |       |       |         |     |  ✓  |                    |                          |
| Together          |       |   ✓   |         |     |     |                    |                          |
| Volcengine        |       |       |         |  ✓  |     |                    |                          |
| Vydra             |   ✓   |   ✓   |         |  ✓  |     |                    |                          |
| xAI               |   ✓   |   ✓   |         |  ✓  |  ✓  |                    |            ✓             |
| Xiaomi MiMo       |       |       |         |  ✓  |     |                    |                          |

<Note>
**Voix en temps réel** désigne ici le temps réel bidirectionnel natif du fournisseur (mode
`realtime` de Talk, par exemple Gemini Live ou l’API OpenAI Realtime) — seuls Google
et OpenAI l’enregistrent actuellement. Deepgram, ElevenLabs, Mistral, OpenAI et xAI
enregistrent séparément la STT en streaming de Voice Call (audio vers texte unidirectionnel) ; consultez
[Reconnaissance vocale et Voice Call](#speech-to-text-and-voice-call) ci-dessous.
La voix en temps réel de xAI est une fonctionnalité en amont, mais elle n’est pas enregistrée dans
OpenClaw tant que le contrat partagé de voix en temps réel ne peut pas la représenter.
</Note>

## Asynchrone ou synchrone

| Fonctionnalité  | Mode         | Raison                                                                                                                  |
| --------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Image           | Asynchrone   | Le traitement du fournisseur peut dépasser la durée d’un tour de discussion ; les pièces jointes générées utilisent le chemin d’achèvement partagé. |
| Synthèse vocale | Synchrone    | Les réponses du fournisseur reviennent en quelques secondes ; elles sont jointes à l’audio de la réponse.              |
| Vidéo           | Asynchrone   | Le traitement du fournisseur prend de 30 s à plusieurs minutes ; les files lentes peuvent s’exécuter jusqu’au délai configuré. |
| Musique         | Asynchrone   | Présente les mêmes caractéristiques de traitement par le fournisseur que la vidéo.                                     |

Pour les outils asynchrones, OpenClaw soumet la requête au fournisseur, renvoie immédiatement un
identifiant de tâche et suit le travail dans le registre des tâches. L’agent continue
de répondre aux autres messages pendant l’exécution du travail. Lorsque le fournisseur termine,
OpenClaw réveille l’agent avec les chemins des médias générés afin qu’il puisse en informer
l’utilisateur au moyen du mode normal de réponse visible de la session : remise automatique de la réponse
finale lorsqu’elle est configurée, ou `message(action="send")` lorsque la session nécessite
l’outil de messagerie. Si la session du demandeur est inactive ou si son réveil actif
échoue, et que certains médias générés sont toujours absents de la réponse d’achèvement,
OpenClaw envoie directement, de manière idempotente, uniquement les médias manquants. Les médias
déjà remis par la réponse d’achèvement ne sont pas publiés à nouveau.

## Reconnaissance vocale et Voice Call

Deepgram, DeepInfra, ElevenLabs, Google, Groq, Mistral, OpenAI, OpenRouter,
SenseAudio et xAI peuvent tous transcrire l’audio entrant au moyen du chemin par lots
`tools.media.audio` lorsqu’ils sont configurés. Les plugins de canal qui préanalysent une
note vocale pour le filtrage des mentions ou l’analyse des commandes marquent la pièce jointe transcrite
dans le contexte entrant, afin que le passage partagé de compréhension des médias
réutilise cette transcription au lieu d’effectuer un second appel STT pour le même
contenu audio.

Deepgram, ElevenLabs, Mistral, OpenAI et xAI enregistrent également des fournisseurs de STT
en streaming pour Voice Call, afin que l’audio téléphonique en direct puisse être transmis au fournisseur
sélectionné sans attendre la fin d’un enregistrement.

Pour les conversations en direct avec les utilisateurs, privilégiez le [mode Talk](/fr/nodes/talk). Les pièces jointes audio
par lots restent sur le chemin multimédia ; le temps réel dans le navigateur, la conversation native par appui,
la téléphonie et l’audio des réunions doivent utiliser les événements Talk et les catalogues limités à la session
renvoyés par le Gateway.

## Correspondances des fournisseurs (répartition des éditeurs entre les surfaces)

<AccordionGroup>
  <Accordion title="Google">
    Surfaces d’image, de vidéo, de musique, de TTS par lots, de STT par lots, de voix en temps réel côté serveur
    et de compréhension des médias.
  </Accordion>
  <Accordion title="OpenAI">
    Surfaces d’image, de vidéo, de TTS par lots, de STT par lots, de STT en streaming pour Voice Call, de voix
    en temps réel côté serveur et d’intégration vectorielle de la mémoire.
  </Accordion>
  <Accordion title="DeepInfra">
    Surfaces de routage des discussions et des modèles, de génération et de modification d’images, de conversion de texte en vidéo,
    de TTS par lots, de STT par lots, de compréhension des médias visuels et d’intégration vectorielle de la mémoire.
    DeepInfra expose également le reclassement, la classification, la détection d’objets et
    d’autres types de modèles natifs ; OpenClaw ne dispose pas encore de contrat de fournisseur pour ces
    catégories, ce plugin ne les enregistre donc pas.
  </Accordion>
  <Accordion title="xAI">
    Image, vidéo, recherche, exécution de code, TTS par lots, STT par lots et STT en streaming pour Voice
    Call. La voix en temps réel de xAI est une fonctionnalité en amont, mais elle
    n’est pas enregistrée dans OpenClaw tant que le contrat partagé de voix en temps réel ne peut pas
    la représenter.
  </Accordion>
</AccordionGroup>

## Pages connexes

- [Génération d’images](/fr/tools/image-generation)
- [Génération de vidéos](/fr/tools/video-generation)
- [Génération de musique](/fr/tools/music-generation)
- [Synthèse vocale](/fr/tools/tts)
- [Compréhension des médias](/fr/nodes/media-understanding)
- [Nœuds audio](/fr/nodes/audio)
- [Mode Talk](/fr/nodes/talk)
