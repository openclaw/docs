---
read_when:
    - Recherche d’un aperçu des capacités multimédias d’OpenClaw
    - Choisir le fournisseur multimédia à configurer
    - Comprendre le fonctionnement de la génération de médias asynchrone
sidebarTitle: Media overview
summary: Capacités d’image, de vidéo, de musique, de parole et de compréhension des médias en un coup d’œil
title: Présentation des médias
x-i18n:
    generated_at: "2026-06-27T18:19:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c04beb60abbd06d1503302be144e633b526ae55435f061fbb94f6fef85ca9d66
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw génère des images, des vidéos et de la musique, comprend les médias entrants
(images, audio, vidéo) et prononce les réponses à voix haute avec la synthèse vocale. Toutes
les capacités multimédias sont pilotées par des outils : l’agent décide quand les utiliser selon
la conversation, et chaque outil n’apparaît que lorsqu’au moins un fournisseur sous-jacent
est configuré.

La parole en direct utilise le contrat de session Talk au lieu du chemin d’outil multimédia
ponctuel. Talk propose trois modes : `realtime` natif au fournisseur, `stt-tts` local ou en streaming,
et `transcription` pour la capture vocale en observation seule. Ces modes partagent les catalogues
de fournisseurs, les enveloppes d’événements et la sémantique d’annulation avec
la téléphonie, les réunions, le temps réel dans le navigateur et les clients push-to-talk natifs.

## Capacités

<CardGroup cols={2}>
  <Card title="Génération d’images" href="/fr/tools/image-generation" icon="image">
    Créez et modifiez des images à partir de prompts textuels ou d’images de référence via
    `image_generate`. Asynchrone dans les sessions de chat — s’exécute en arrière-plan et
    publie le résultat lorsqu’il est prêt.
  </Card>
  <Card title="Génération de vidéos" href="/fr/tools/video-generation" icon="video">
    Texte-vers-vidéo, image-vers-vidéo et vidéo-vers-vidéo via `video_generate`.
    Asynchrone — s’exécute en arrière-plan et publie le résultat lorsqu’il est prêt.
  </Card>
  <Card title="Génération de musique" href="/fr/tools/music-generation" icon="music">
    Générez de la musique ou des pistes audio via `music_generate`. Asynchrone dans les sessions
    de chat sur le cycle de vie partagé des tâches de génération multimédia.
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
    Transcrivez les messages vocaux entrants au moyen de fournisseurs STT par lot ou
    STT en streaming Voice Call.
  </Card>
</CardGroup>

## Matrice des capacités des fournisseurs

| Fournisseur       | Image | Vidéo | Musique | TTS | STT | Voix en temps réel | Compréhension des médias |
| ----------------- | :---: | :---: | :-----: | :-: | :-: | :----------------: | :----------------------: |
| Alibaba           |       |   ✓   |         |     |     |                    |                          |
| BytePlus          |       |   ✓   |         |     |     |                    |                          |
| ComfyUI           |   ✓   |   ✓   |    ✓    |     |     |                    |                          |
| DeepInfra         |   ✓   |   ✓   |         |  ✓  |  ✓  |                    |            ✓             |
| Deepgram          |       |       |         |     |  ✓  |         ✓          |                          |
| ElevenLabs        |       |       |         |  ✓  |  ✓  |                    |                          |
| fal               |   ✓   |   ✓   |    ✓    |     |     |                    |                          |
| Google            |   ✓   |   ✓   |    ✓    |  ✓  |     |         ✓          |            ✓             |
| Gradium           |       |       |         |  ✓  |     |                    |                          |
| Local CLI         |       |       |         |  ✓  |     |                    |                          |
| Microsoft         |       |       |         |  ✓  |     |                    |                          |
| Microsoft Foundry |   ✓   |       |         |     |     |                    |                          |
| MiniMax           |   ✓   |   ✓   |    ✓    |  ✓  |     |                    |                          |
| Mistral           |       |       |         |     |  ✓  |                    |                          |
| OpenAI            |   ✓   |   ✓   |         |  ✓  |  ✓  |         ✓          |            ✓             |
| OpenRouter        |   ✓   |   ✓   |    ✓    |  ✓  |  ✓  |                    |            ✓             |
| Qwen              |       |   ✓   |         |     |     |                    |                          |
| Runway            |       |   ✓   |         |     |     |                    |                          |
| SenseAudio        |       |       |         |     |  ✓  |                    |                          |
| Together          |       |   ✓   |         |     |     |                    |                          |
| Vydra             |   ✓   |   ✓   |         |  ✓  |     |                    |                          |
| xAI               |   ✓   |   ✓   |         |  ✓  |  ✓  |                    |            ✓             |
| Xiaomi MiMo       |   ✓   |       |         |  ✓  |     |                    |            ✓             |

<Note>
La compréhension des médias utilise tout modèle compatible avec la vision ou l’audio enregistré
dans votre configuration de fournisseur. La matrice ci-dessus liste les fournisseurs avec une prise
en charge dédiée de la compréhension des médias ; la plupart des fournisseurs de LLM multimodaux
(Anthropic, Google, OpenAI, etc.) peuvent également comprendre les médias entrants lorsqu’ils sont
configurés comme modèle de réponse actif.
</Note>

## Asynchrone ou synchrone

| Capacité       | Mode        | Pourquoi                                                                                            |
| -------------- | ----------- | --------------------------------------------------------------------------------------------------- |
| Image          | Asynchrone  | Le traitement par le fournisseur peut dépasser la durée d’un tour de chat ; les pièces jointes générées utilisent le chemin d’achèvement partagé. |
| Synthèse vocale | Synchrone  | Les réponses du fournisseur reviennent en quelques secondes ; elles sont jointes à l’audio de réponse. |
| Vidéo          | Asynchrone  | Le traitement par le fournisseur prend de 30 s à plusieurs minutes ; les files lentes peuvent s’exécuter jusqu’au délai d’expiration configuré. |
| Musique        | Asynchrone  | Même caractéristique de traitement fournisseur que la vidéo.                                        |

Pour les outils asynchrones, OpenClaw soumet la demande au fournisseur, renvoie immédiatement
un identifiant de tâche et suit le travail dans le registre des tâches. L’agent continue
de répondre aux autres messages pendant l’exécution du travail. Lorsque le fournisseur termine,
OpenClaw réveille l’agent avec les chemins des médias générés afin qu’il puisse informer
l’utilisateur via le mode de réponse visible normal de la session : livraison automatique de la
réponse finale lorsqu’elle est configurée, ou `message(action="send")` lorsque la session exige
l’outil de message. Si la session demanderesse est inactive ou si son réveil actif échoue,
et qu’un média généré manque encore dans la réponse d’achèvement, OpenClaw envoie une solution
de repli directe idempotente avec uniquement le média manquant. Les médias déjà livrés par
la réponse d’achèvement ne sont pas publiés à nouveau.

## Reconnaissance vocale et Voice Call

Deepgram, DeepInfra, ElevenLabs, Mistral, OpenAI, OpenRouter, SenseAudio et xAI peuvent tous transcrire
l’audio entrant via le chemin par lot `tools.media.audio` lorsqu’ils sont configurés.
Les plugins de canal qui pré-vérifient une note vocale pour le filtrage des mentions ou l’analyse
des commandes marquent la pièce jointe transcrite sur le contexte entrant, afin que la passe partagée
de compréhension des médias réutilise cette transcription au lieu d’effectuer un second appel
STT pour le même audio.

Deepgram, ElevenLabs, Mistral, OpenAI et xAI enregistrent également des fournisseurs STT en streaming
Voice Call, ce qui permet de transférer l’audio téléphonique en direct au fournisseur sélectionné
sans attendre un enregistrement terminé.

Pour les conversations utilisateur en direct, privilégiez le [mode Talk](/fr/nodes/talk). Les pièces jointes
audio par lot restent sur le chemin multimédia ; le temps réel dans le navigateur, le push-to-talk natif,
la téléphonie et l’audio de réunion doivent utiliser les événements Talk et les catalogues limités à la
session renvoyés par le Gateway.

## Correspondances de fournisseurs (répartition des fournisseurs entre surfaces)

<AccordionGroup>
  <Accordion title="Google">
    Surfaces d’image, de vidéo, de musique, de TTS par lot, de voix temps réel backend et
    de compréhension des médias.
  </Accordion>
  <Accordion title="OpenAI">
    Surfaces d’image, de vidéo, de TTS par lot, de STT par lot, de STT en streaming Voice Call,
    de voix temps réel backend et d’embeddings mémoire.
  </Accordion>
  <Accordion title="DeepInfra">
    Routage chat/modèle, génération/modification d’images, texte-vers-vidéo, TTS par lot,
    STT par lot, compréhension des médias image et surfaces d’embeddings mémoire.
    Les modèles de reranking/classification/détection d’objets natifs à DeepInfra ne sont pas
    enregistrés tant qu’OpenClaw ne dispose pas de contrats fournisseur dédiés pour ces
    catégories.
  </Accordion>
  <Accordion title="xAI">
    Image, vidéo, recherche, exécution de code, TTS par lot, STT par lot et STT en streaming
    Voice Call. La voix xAI Realtime est une capacité amont, mais elle n’est pas enregistrée
    dans OpenClaw tant que le contrat partagé de voix temps réel ne peut pas la représenter.
  </Accordion>
</AccordionGroup>

## Associés

- [Génération d’images](/fr/tools/image-generation)
- [Génération de vidéos](/fr/tools/video-generation)
- [Génération de musique](/fr/tools/music-generation)
- [Synthèse vocale](/fr/tools/tts)
- [Compréhension des médias](/fr/nodes/media-understanding)
- [Nœuds audio](/fr/nodes/audio)
- [Mode Talk](/fr/nodes/talk)
