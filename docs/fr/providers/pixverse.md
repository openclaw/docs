---
read_when:
    - Vous souhaitez utiliser la génération de vidéos PixVerse dans OpenClaw
    - Vous devez configurer la clé API et la variable d’environnement de PixVerse
    - Vous souhaitez définir PixVerse comme fournisseur vidéo par défaut
summary: Configuration de la génération de vidéos PixVerse dans OpenClaw
title: PixVerse
x-i18n:
    generated_at: "2026-07-12T15:54:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 50204c771deb315e7336325f2852e4b65dfba4264bbe288b819d44b8def1ce82
    source_path: providers/pixverse.md
    workflow: 16
---

OpenClaw fournit `pixverse` en tant que plugin externe officiel pour la génération de vidéos PixVerse hébergée. Le plugin enregistre le fournisseur `pixverse` auprès du contrat `videoGenerationProviders`.

| Propriété               | Valeur                                                                    |
| ----------------------- | ------------------------------------------------------------------------- |
| Identifiant du fournisseur | `pixverse`                                                             |
| Paquet du plugin        | `@openclaw/pixverse-provider`                                             |
| Variable d’environnement d’authentification | `PIXVERSE_API_KEY`                                      |
| Option d’intégration    | `--auth-choice pixverse-api-key`                                          |
| Option CLI directe      | `--pixverse-api-key <key>`                                                |
| API                     | API PixVerse Platform v2 (soumission de `video_id` puis interrogation du résultat) |
| Modèle par défaut       | `pixverse/v6`                                                             |
| Région API par défaut   | Internationale                                                            |

## Prise en main

<Steps>
  <Step title="Installer le plugin">
    ```bash
    openclaw plugins install @openclaw/pixverse-provider
    openclaw gateway restart
    ```
  </Step>
  <Step title="Définir la clé API">
    ```bash
    openclaw onboard --auth-choice pixverse-api-key
    ```

    L’assistant vous invite à choisir le point de terminaison International ou CN
    (voir la région API ci-dessous) avant d’écrire `region` et `baseUrl` dans la
    configuration du fournisseur. Les exécutions non interactives (clé provenant
    de `--pixverse-api-key` ou `PIXVERSE_API_KEY`) utilisent la région
    Internationale par défaut.

    L’intégration définit également `agents.defaults.videoGenerationModel.primary`
    sur `pixverse/v6` lorsqu’aucun modèle vidéo par défaut n’est encore configuré.

  </Step>
  <Step title="Changer le fournisseur vidéo par défaut existant (facultatif)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "pixverse/v6"
    ```
  </Step>
  <Step title="Générer une vidéo">
    Demandez à l’agent de générer une vidéo. PixVerse sera utilisé automatiquement.
  </Step>
</Steps>

## Modes et modèles pris en charge

Le fournisseur expose les modèles de génération PixVerse au moyen de l’outil vidéo partagé d’OpenClaw.

| Mode                 | Modèles              | Entrée de référence             |
| -------------------- | -------------------- | ------------------------------- |
| Texte vers vidéo     | `v6` (par défaut), `c1` | Aucune                        |
| Image vers vidéo     | `v6` (par défaut), `c1` | 1 image locale ou distante    |

Les références d’images locales sont téléversées vers PixVerse avant la requête de conversion d’image en vidéo. Les URL d’images distantes sont transmises au point de terminaison de téléversement d’images PixVerse en tant que `image_url`.

| Option          | Valeurs prises en charge                                                                                                                      |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Durée           | 1 à 15 secondes (5 par défaut)                                                                                                                |
| Résolution      | `360P`, `540P`, `720P`, `1080P` (`540P` par défaut ; les requêtes `480P` sont converties en `540P`)                                           |
| Format d’image  | `16:9` (par défaut), `4:3`, `1:1`, `3:4`, `9:16`, `2:3`, `3:2`, `21:9` ; uniquement pour le texte vers vidéo, l’image vers vidéo suit l’image source |
| Audio généré   | `audio: true`                                                                                                                                 |

<Note>
La génération de modèles d’image PixVerse n’est pas encore exposée par l’intermédiaire de `image_generate`. Cette API repose sur un identifiant de modèle, tandis que le contrat partagé de génération d’images d’OpenClaw ne dispose actuellement d’aucun ensemble d’options typées propre à PixVerse.
</Note>

## Options du fournisseur

Le fournisseur vidéo accepte les clés facultatives suivantes, propres au fournisseur :

| Option                               | Type     | Effet                                                   |
| ------------------------------------ | -------- | ------------------------------------------------------- |
| `seed`                               | nombre   | Graine déterministe, de 0 à 2147483647                  |
| `negativePrompt` / `negative_prompt` | chaîne   | Prompt négatif                                          |
| `quality`                            | chaîne   | Qualité PixVerse telle que `720p`                       |
| `motionMode` / `motion_mode`         | chaîne   | Mode de mouvement image vers vidéo (`normal` par défaut) |
| `cameraMovement` / `camera_movement` | chaîne   | Préréglage de mouvement de caméra PixVerse              |
| `templateId` / `template_id`         | nombre   | Identifiant de modèle PixVerse activé                   |

## Configuration

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "pixverse/v6",
      },
    },
  },
}
```

## Configuration avancée

<AccordionGroup>
  <Accordion title="Région API">
    | Valeur de la région | URL de base de l’API PixVerse               |
    | ------------------- | ------------------------------------------- |
    | `international`     | `https://app-api.pixverse.ai/openapi/v2`    |
    | `cn`                | `https://app-api.pixverseai.cn/openapi/v2`  |

    Définissez manuellement `models.providers.pixverse.region` lorsque votre clé
    appartient à une région spécifique de la plateforme PixVerse, ou exécutez
    `openclaw onboard --auth-choice pixverse-api-key` pour en choisir une dans
    l’assistant de configuration :

    ```json5
    {
      models: {
        providers: {
          pixverse: {
            region: "cn", // "international" ou "cn"
            baseUrl: "https://app-api.pixverseai.cn/openapi/v2",
            models: [],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="URL de base personnalisée">
    Définissez `models.providers.pixverse.baseUrl` uniquement lors du routage par l’intermédiaire d’un proxy compatible et approuvé.
    `baseUrl` prévaut sur `region`.

    ```json5
    {
      models: {
        providers: {
          pixverse: {
            baseUrl: "https://app-api.pixverse.ai/openapi/v2",
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Interrogation de la tâche">
    PixVerse renvoie un `video_id` à partir de la requête de génération. OpenClaw
    interroge `/openapi/v2/video/result/{video_id}` toutes les 5 secondes jusqu’à
    ce que la tâche réussisse, échoue ou atteigne le délai d’expiration (5 minutes
    par défaut ; remplacez cette valeur avec
    `agents.defaults.videoGenerationModel.timeoutMs`).
  </Accordion>
</AccordionGroup>

## Pages connexes

<CardGroup cols={2}>
  <Card title="Génération de vidéos" href="/fr/tools/video-generation" icon="video">
    Paramètres de l’outil partagé, sélection du fournisseur et comportement asynchrone.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/config-agents#agent-defaults" icon="gear">
    Paramètres par défaut de l’agent, notamment le modèle de génération de vidéos.
  </Card>
</CardGroup>
