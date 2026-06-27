---
read_when:
    - Vous voulez utiliser la génération vidéo PixVerse dans OpenClaw
    - Vous devez configurer la clé API PixVerse et l’environnement
    - Vous voulez faire de PixVerse le fournisseur vidéo par défaut
summary: Configuration de la génération vidéo PixVerse dans OpenClaw
title: PixVerse
x-i18n:
    generated_at: "2026-06-27T18:07:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9967ec20f7a9db3413db12ed75f836ae0bee6610e765f049720988b43494d37b
    source_path: providers/pixverse.md
    workflow: 16
---

OpenClaw fournit `pixverse` comme Plugin externe officiel pour la génération vidéo PixVerse hébergée. Le Plugin enregistre le fournisseur `pixverse` auprès du contrat `videoGenerationProviders`.

| Propriété            | Valeur                                                                     |
| -------------------- | -------------------------------------------------------------------------- |
| ID du fournisseur    | `pixverse`                                                                 |
| Paquet Plugin        | `@openclaw/pixverse-provider`                                              |
| Variable d’env. auth | `PIXVERSE_API_KEY`                                                         |
| Indicateur d’onboarding | `--auth-choice pixverse-api-key`                                        |
| Indicateur CLI direct | `--pixverse-api-key <key>`                                                |
| API                  | API PixVerse Platform v2 (soumission de `video_id` et interrogation du résultat) |
| Modèle par défaut    | `pixverse/v6`                                                              |
| Région API par défaut | Internationale                                                            |

## Premiers pas

<Steps>
  <Step title="Installer le Plugin">
    ```bash
    openclaw plugins install clawhub:@openclaw/pixverse-provider
    openclaw gateway restart
    ```
  </Step>
  <Step title="Définir la clé API">
    ```bash
    openclaw onboard --auth-choice pixverse-api-key
    ```

    L’assistant demande s’il faut utiliser le point de terminaison international
    (`https://app-api.pixverse.ai/openapi/v2`) ou le point de terminaison CN
    (`https://app-api.pixverseai.cn/openapi/v2`) avant d’écrire `region` et
    `baseUrl` dans la configuration du fournisseur.

  </Step>
  <Step title="Définir PixVerse comme fournisseur vidéo par défaut">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "pixverse/v6"
    ```
  </Step>
  <Step title="Générer une vidéo">
    Demandez à l’agent de générer une vidéo. PixVerse sera utilisé automatiquement.
  </Step>
</Steps>

## Modes et modèles pris en charge

Le fournisseur expose les modèles de génération PixVerse via l’outil vidéo partagé d’OpenClaw.

| Mode           | Modèles              | Entrée de référence     |
| -------------- | -------------------- | ----------------------- |
| Texte vers vidéo | `v6` (par défaut), `c1` | Aucune               |
| Image vers vidéo | `v6` (par défaut), `c1` | 1 image locale ou distante |

Les références d’images locales sont téléversées vers PixVerse avant la requête image vers vidéo. Les URL d’images distantes sont transmises via le point de terminaison de téléversement d’image PixVerse en tant que `image_url`.

| Option          | Valeurs prises en charge                                                    |
| --------------- | --------------------------------------------------------------------------- |
| Durée           | 1 à 15 secondes                                                             |
| Résolution      | `360P`, `540P`, `720P`, `1080P`                                             |
| Format d’image  | `16:9`, `4:3`, `1:1`, `3:4`, `9:16`, `2:3`, `3:2`, `21:9` pour texte vers vidéo |
| Audio généré    | `audio: true`                                                               |

<Note>
La génération de modèles d’image PixVerse n’est pas encore exposée via `image_generate`. Cette API est pilotée par un identifiant de modèle, tandis que le contrat partagé de génération d’images d’OpenClaw ne dispose pas actuellement d’un ensemble d’options typées propre à PixVerse.
</Note>

## Options du fournisseur

Le fournisseur vidéo accepte ces clés facultatives propres au fournisseur :

| Option                               | Type   | Effet                                      |
| ------------------------------------ | ------ | ------------------------------------------ |
| `seed`                               | number | Graine déterministe lorsque prise en charge |
| `negativePrompt` / `negative_prompt` | string | Invite négative                            |
| `quality`                            | string | Qualité PixVerse, par exemple `720p`       |
| `motionMode` / `motion_mode`         | string | Mode de mouvement image vers vidéo         |
| `cameraMovement` / `camera_movement` | string | Préréglage de mouvement de caméra PixVerse |
| `templateId` / `template_id`         | number | Identifiant de modèle PixVerse activé      |

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
    OpenClaw utilise par défaut l’API PixVerse internationale. Définissez `models.providers.pixverse.region`
    manuellement lorsque votre clé appartient à une région spécifique de la plateforme PixVerse, ou utilisez
    `openclaw onboard --auth-choice pixverse-api-key` pour en choisir une dans l’assistant de configuration :

    | Valeur de région | URL de base de l’API PixVerse                 |
    | ---------------- | --------------------------------------------- |
    | `international`  | `https://app-api.pixverse.ai/openapi/v2`      |
    | `cn`             | `https://app-api.pixverseai.cn/openapi/v2`    |

    ```json5
    {
      models: {
        providers: {
          pixverse: {
            region: "cn", // "international" or "cn"
            baseUrl: "https://app-api.pixverseai.cn/openapi/v2",
            models: [],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="URL de base personnalisée">
    Définissez `models.providers.pixverse.baseUrl` uniquement lors du routage via un proxy compatible de confiance.
    `baseUrl` est prioritaire sur `region`.

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

  <Accordion title="Interrogation des tâches">
    PixVerse renvoie un `video_id` depuis la requête de génération. OpenClaw interroge
    `/openapi/v2/video/result/{video_id}` jusqu’à ce que la tâche réussisse, échoue
    ou expire.
  </Accordion>
</AccordionGroup>

## Connexe

<CardGroup cols={2}>
  <Card title="Génération vidéo" href="/fr/tools/video-generation" icon="video">
    Paramètres de l’outil partagé, sélection du fournisseur et comportement asynchrone.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/config-agents#agent-defaults" icon="gear">
    Paramètres par défaut de l’agent, y compris le modèle de génération vidéo.
  </Card>
</CardGroup>
