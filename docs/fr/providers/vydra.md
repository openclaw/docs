---
read_when:
    - Vous souhaitez utiliser la génération de médias Vydra dans OpenClaw
    - Vous avez besoin de conseils pour configurer la clé API Vydra
summary: Utiliser l’image, la vidéo et la voix Vydra dans OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-06-27T18:08:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4cb1128d877e06a274fe07c42282a7990c322e4d88d4232a1cac78e54deaf163
    source_path: providers/vydra.md
    workflow: 16
---

Le Plugin Vydra intégré ajoute :

- Génération d’images via `vydra/grok-imagine`
- Génération de vidéos via `vydra/veo3` et `vydra/kling`
- Synthèse vocale via la route TTS de Vydra adossée à ElevenLabs

OpenClaw utilise la même `VYDRA_API_KEY` pour les trois capacités.

| Propriété                  | Valeur                                                                    |
| -------------------------- | ------------------------------------------------------------------------- |
| Identifiant du fournisseur | `vydra`                                                                   |
| Plugin                     | intégré, `enabledByDefault: true`                                         |
| Variable d’env auth        | `VYDRA_API_KEY`                                                           |
| Option d’onboarding        | `--auth-choice vydra-api-key`                                             |
| Option CLI directe         | `--vydra-api-key <key>`                                                   |
| Contrats                   | `imageGenerationProviders`, `videoGenerationProviders`, `speechProviders` |
| URL de base                | `https://www.vydra.ai/api/v1` (utilisez l’hôte `www`)                     |

<Warning>
  Utilisez `https://www.vydra.ai/api/v1` comme URL de base. L’hôte apex de Vydra (`https://vydra.ai/api/v1`) redirige actuellement vers `www`. Certains clients HTTP suppriment `Authorization` lors de cette redirection entre hôtes, ce qui transforme une clé API valide en échec d’authentification trompeur. Le Plugin intégré utilise directement l’URL de base `www` pour éviter cela.
</Warning>

## Configuration

<Steps>
  <Step title="Run interactive onboarding">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    Ou définissez directement la variable d’environnement :

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="Choose a default capability">
    Choisissez une ou plusieurs des capacités ci-dessous (image, vidéo ou parole) et appliquez la configuration correspondante.
  </Step>
</Steps>

## Capacités

<AccordionGroup>
  <Accordion title="Image generation">
    Modèle d’image par défaut :

    - `vydra/grok-imagine`

    Définissez-le comme fournisseur d’images par défaut :

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "vydra/grok-imagine",
          },
        },
      },
    }
    ```

    La prise en charge intégrée actuelle couvre uniquement la génération d’images à partir de texte. Les routes d’édition hébergées de Vydra attendent des URL d’images distantes, et OpenClaw n’ajoute pas encore de pont d’import propre à Vydra dans le Plugin intégré.

    <Note>
    Consultez [Génération d’images](/fr/tools/image-generation) pour les paramètres d’outil partagés, la sélection du fournisseur et le comportement de basculement.
    </Note>

  </Accordion>

  <Accordion title="Video generation">
    Modèles vidéo enregistrés :

    - `vydra/veo3` pour la génération de vidéos à partir de texte
    - `vydra/kling` pour la génération de vidéos à partir d’images

    Définissez Vydra comme fournisseur vidéo par défaut :

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "vydra/veo3",
          },
        },
      },
    }
    ```

    Notes :

    - `vydra/veo3` est intégré uniquement pour la génération de vidéos à partir de texte.
    - `vydra/kling` nécessite actuellement une référence d’URL d’image distante. Les téléversements de fichiers locaux sont rejetés d’emblée.
    - La route HTTP `kling` actuelle de Vydra a été incohérente quant au champ requis, `image_url` ou `video_url` ; le fournisseur intégré mappe la même URL d’image distante dans les deux champs.
    - Le Plugin intégré reste prudent et ne transmet pas les réglages de style non documentés comme le format d’image, la résolution, le filigrane ou l’audio généré.

    <Note>
    Consultez [Génération de vidéos](/fr/tools/video-generation) pour les paramètres d’outil partagés, la sélection du fournisseur et le comportement de basculement.
    </Note>

  </Accordion>

  <Accordion title="Video live tests">
    Couverture en direct propre au fournisseur :

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    Le fichier de tests en direct Vydra intégré couvre maintenant :

    - `vydra/veo3` pour la génération de vidéos à partir de texte
    - `vydra/kling` pour la génération de vidéos à partir d’images avec une URL d’image distante

    Remplacez le fixture d’image distante si nécessaire :

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="Speech synthesis">
    Définissez Vydra comme fournisseur de synthèse vocale :

    ```json5
    {
      messages: {
        tts: {
          provider: "vydra",
          providers: {
            vydra: {
              apiKey: "${VYDRA_API_KEY}",
              speakerVoiceId: "21m00Tcm4TlvDq8ikWAM",
            },
          },
        },
      },
    }
    ```

    Valeurs par défaut :

    - Modèle : `elevenlabs/tts`
    - Identifiant de voix : `21m00Tcm4TlvDq8ikWAM`

    Le Plugin intégré expose actuellement une voix par défaut fiable connue et renvoie des fichiers audio MP3.

  </Accordion>
</AccordionGroup>

## Connexe

<CardGroup cols={2}>
  <Card title="Provider directory" href="/fr/providers/index" icon="list">
    Parcourez tous les fournisseurs disponibles.
  </Card>
  <Card title="Image generation" href="/fr/tools/image-generation" icon="image">
    Paramètres d’outil d’image partagés et sélection du fournisseur.
  </Card>
  <Card title="Video generation" href="/fr/tools/video-generation" icon="video">
    Paramètres d’outil vidéo partagés et sélection du fournisseur.
  </Card>
  <Card title="Configuration reference" href="/fr/gateway/config-agents#agent-defaults" icon="gear">
    Valeurs par défaut des agents et configuration des modèles.
  </Card>
</CardGroup>
