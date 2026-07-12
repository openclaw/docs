---
read_when:
    - Vous souhaitez générer des contenus multimédias avec Vydra dans OpenClaw
    - Vous avez besoin d’instructions pour configurer une clé API Vydra
summary: Utiliser les images, les vidéos et la synthèse vocale de Vydra dans OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-07-12T03:17:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e775bdd6f4ec7d1f5189910af450b92d8d6e831c17c338271afee962636ba69f
    source_path: providers/vydra.md
    workflow: 16
---

Le Plugin Vydra intégré ajoute :

- La génération d’images via `vydra/grok-imagine`
- La génération de vidéos via `vydra/veo3` (texte vers vidéo) et `vydra/kling` (image vers vidéo)
- La synthèse vocale via la route TTS de Vydra reposant sur ElevenLabs

OpenClaw utilise la même clé `VYDRA_API_KEY` pour les trois fonctionnalités.

| Propriété                  | Valeur                                                                    |
| -------------------------- | ------------------------------------------------------------------------- |
| Identifiant du fournisseur | `vydra`                                                                   |
| Plugin                     | intégré, `enabledByDefault: true`                                          |
| Variable d’environnement d’authentification | `VYDRA_API_KEY`                                            |
| Option d’intégration       | `--auth-choice vydra-api-key`                                             |
| Option CLI directe         | `--vydra-api-key <key>`                                                   |
| Contrats                   | `imageGenerationProviders`, `videoGenerationProviders`, `speechProviders` |
| URL de base                | `https://www.vydra.ai/api/v1` (utilisez l’hôte `www`)                     |

<Warning>
Utilisez `https://www.vydra.ai/api/v1` comme URL de base. L’hôte racine de Vydra (`https://vydra.ai/api/v1`) redirige actuellement vers `www`. Certains clients HTTP suppriment l’en-tête `Authorization` lors de cette redirection entre hôtes, ce qui transforme une clé d’API valide en un échec d’authentification trompeur. Le Plugin intégré normalise toute URL de base `vydra.ai` configurée en `www.vydra.ai` afin d’éviter ce problème.
</Warning>

## Configuration

<Steps>
  <Step title="Exécuter l’intégration interactive">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    Vous pouvez également définir directement la variable d’environnement :

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="Choisir une fonctionnalité par défaut">
    Choisissez une ou plusieurs des fonctionnalités ci-dessous (image, vidéo ou synthèse vocale) et appliquez la configuration correspondante.
  </Step>
</Steps>

## Fonctionnalités

<AccordionGroup>
  <Accordion title="Génération d’images">
    Modèle d’image intégré par défaut et unique :

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

    La prise en charge intégrée se limite à la génération de texte vers image, avec au maximum une image par requête. Les routes d’édition hébergées de Vydra attendent des URL d’images distantes, et le Plugin intégré n’ajoute pas de passerelle de téléversement propre à Vydra.

    <Note>
    Consultez [Génération d’images](/fr/tools/image-generation) pour connaître les paramètres communs de l’outil, la sélection du fournisseur et le comportement de basculement.
    </Note>

  </Accordion>

  <Accordion title="Génération de vidéos">
    Modèles vidéo enregistrés :

    - `vydra/veo3` pour la génération de texte vers vidéo (refuse les références d’images en entrée)
    - `vydra/kling` pour la génération d’image vers vidéo (nécessite exactement une URL d’image distante)

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

    Remarques :

    - `vydra/kling` refuse d’emblée les téléversements de fichiers locaux ; seule une référence à une URL d’image distante fonctionne.
    - La route HTTP `kling` de Vydra n’a pas toujours été cohérente quant au champ requis, `image_url` ou `video_url` ; le fournisseur intégré envoie la même URL d’image distante dans les deux champs.
    - Le Plugin intégré adopte une approche prudente et ne transmet pas les paramètres de style non documentés tels que le rapport largeur/hauteur, la résolution, le filigrane ou l’audio généré.

    <Note>
    Consultez [Génération de vidéos](/fr/tools/video-generation) pour connaître les paramètres communs de l’outil, la sélection du fournisseur et le comportement de basculement.
    </Note>

  </Accordion>

  <Accordion title="Tests en conditions réelles de la vidéo">
    Couverture en conditions réelles propre au fournisseur :

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    Le fichier de tests en conditions réelles de Vydra intégré couvre :

    - La génération de texte vers vidéo avec `vydra/veo3`
    - La génération d’image vers vidéo avec `vydra/kling` à partir d’une URL d’image distante

    Remplacez la ressource d’image distante si nécessaire :

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="Synthèse vocale">
    Définissez Vydra comme fournisseur de synthèse vocale :

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
    - Identifiant de voix : `21m00Tcm4TlvDq8ikWAM` (« Rachel »)

    Le Plugin intégré expose cette unique voix par défaut réputée fiable et renvoie des fichiers audio MP3.

  </Accordion>
</AccordionGroup>

## Voir aussi

<CardGroup cols={2}>
  <Card title="Répertoire des fournisseurs" href="/fr/providers/index" icon="list">
    Parcourez tous les fournisseurs disponibles.
  </Card>
  <Card title="Génération d’images" href="/fr/tools/image-generation" icon="image">
    Paramètres communs de l’outil d’image et sélection du fournisseur.
  </Card>
  <Card title="Génération de vidéos" href="/fr/tools/video-generation" icon="video">
    Paramètres communs de l’outil vidéo et sélection du fournisseur.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/config-agents#agent-defaults" icon="gear">
    Valeurs par défaut des agents et configuration des modèles.
  </Card>
</CardGroup>
