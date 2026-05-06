---
read_when:
    - Vous voulez la génération de médias Vydra dans OpenClaw
    - Vous avez besoin d’instructions pour configurer une clé API Vydra
summary: Utiliser les fonctionnalités d’image, de vidéo et de parole de Vydra dans OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-05-06T07:36:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6e73121300fc3121124d15ecd285603032644c7d3886703776adc58c7115401a
    source_path: providers/vydra.md
    workflow: 16
---

Le plugin Vydra inclus ajoute :

- Génération d’images via `vydra/grok-imagine`
- Génération de vidéos via `vydra/veo3` et `vydra/kling`
- Synthèse vocale via la route TTS de Vydra adossée à ElevenLabs

OpenClaw utilise la même `VYDRA_API_KEY` pour les trois capacités.

| Propriété       | Valeur                                                                    |
| --------------- | ------------------------------------------------------------------------- |
| ID fournisseur  | `vydra`                                                                   |
| Plugin          | inclus, `enabledByDefault: true`                                          |
| Var env d’auth  | `VYDRA_API_KEY`                                                           |
| Indicateur d’onboarding | `--auth-choice vydra-api-key`                                      |
| Indicateur CLI direct | `--vydra-api-key <key>`                                             |
| Contrats        | `imageGenerationProviders`, `videoGenerationProviders`, `speechProviders` |
| URL de base     | `https://www.vydra.ai/api/v1` (utilisez l’hôte `www`)                     |

<Warning>
  Utilisez `https://www.vydra.ai/api/v1` comme URL de base. L’hôte apex de Vydra (`https://vydra.ai/api/v1`) redirige actuellement vers `www`. Certains clients HTTP suppriment `Authorization` lors de cette redirection entre hôtes, ce qui transforme une clé API valide en échec d’authentification trompeur. Le plugin inclus utilise directement l’URL de base `www` pour éviter cela.
</Warning>

## Configuration

<Steps>
  <Step title="Exécuter l’onboarding interactif">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    Ou définissez directement la variable d’environnement :

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="Choisir une capacité par défaut">
    Choisissez une ou plusieurs des capacités ci-dessous (image, vidéo ou voix) et appliquez la configuration correspondante.
  </Step>
</Steps>

## Capacités

<AccordionGroup>
  <Accordion title="Génération d’images">
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

    La prise en charge actuellement incluse couvre uniquement le texte vers image. Les routes de modification hébergées par Vydra attendent des URL d’images distantes, et OpenClaw n’ajoute pas encore de passerelle d’envoi propre à Vydra dans le plugin inclus.

    <Note>
    Consultez [Génération d’images](/fr/tools/image-generation) pour les paramètres d’outil partagés, la sélection du fournisseur et le comportement de bascule.
    </Note>

  </Accordion>

  <Accordion title="Génération de vidéos">
    Modèles vidéo enregistrés :

    - `vydra/veo3` pour le texte vers vidéo
    - `vydra/kling` pour l’image vers vidéo

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

    - `vydra/veo3` est inclus uniquement pour le texte vers vidéo.
    - `vydra/kling` nécessite actuellement une référence d’URL d’image distante. Les envois de fichiers locaux sont rejetés dès le départ.
    - La route HTTP `kling` actuelle de Vydra a été incohérente quant au champ requis, `image_url` ou `video_url` ; le fournisseur inclus mappe la même URL d’image distante dans les deux champs.
    - Le plugin inclus reste conservateur et ne transmet pas les réglages de style non documentés tels que le format d’image, la résolution, le filigrane ou l’audio généré.

    <Note>
    Consultez [Génération de vidéos](/fr/tools/video-generation) pour les paramètres d’outil partagés, la sélection du fournisseur et le comportement de bascule.
    </Note>

  </Accordion>

  <Accordion title="Tests live vidéo">
    Couverture live propre au fournisseur :

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    Le fichier live Vydra inclus couvre maintenant :

    - `vydra/veo3` texte vers vidéo
    - `vydra/kling` image vers vidéo avec une URL d’image distante

    Remplacez le fixture d’image distante lorsque nécessaire :

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="Synthèse vocale">
    Définissez Vydra comme fournisseur vocal :

    ```json5
    {
      messages: {
        tts: {
          provider: "vydra",
          providers: {
            vydra: {
              apiKey: "${VYDRA_API_KEY}",
              voiceId: "21m00Tcm4TlvDq8ikWAM",
            },
          },
        },
      },
    }
    ```

    Valeurs par défaut :

    - Modèle : `elevenlabs/tts`
    - ID de voix : `21m00Tcm4TlvDq8ikWAM`

    Le plugin inclus expose actuellement une voix par défaut connue comme fiable et renvoie des fichiers audio MP3.

  </Accordion>
</AccordionGroup>

## Connexe

<CardGroup cols={2}>
  <Card title="Répertoire des fournisseurs" href="/fr/providers/index" icon="list">
    Parcourez tous les fournisseurs disponibles.
  </Card>
  <Card title="Génération d’images" href="/fr/tools/image-generation" icon="image">
    Paramètres d’outil d’image partagés et sélection du fournisseur.
  </Card>
  <Card title="Génération de vidéos" href="/fr/tools/video-generation" icon="video">
    Paramètres d’outil vidéo partagés et sélection du fournisseur.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/config-agents#agent-defaults" icon="gear">
    Valeurs par défaut d’agent et configuration des modèles.
  </Card>
</CardGroup>
