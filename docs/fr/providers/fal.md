---
read_when:
    - Vous voulez utiliser la génération d’images fal dans OpenClaw
    - Vous avez besoin du flux d’authentification FAL_KEY
    - Vous voulez des valeurs par défaut fal pour image_generate ou video_generate
summary: Configuration de génération d’images et de vidéos fal dans OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-04-26T11:37:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: e6789f0fa1140cf76f0206c7384a79ee8b96de4af9e1dfedc00e5a3382f742bb
    source_path: providers/fal.md
    workflow: 15
---

OpenClaw inclut un fournisseur intégré `fal` pour la génération hébergée d’images et de vidéos.

| Propriété | Valeur                                                        |
| --------- | ------------------------------------------------------------- |
| Fournisseur | `fal`                                                       |
| Auth      | `FAL_KEY` (canonique ; `FAL_API_KEY` fonctionne aussi en repli) |
| API       | points de terminaison de modèles fal                          |

## Démarrage

<Steps>
  <Step title="Définir la clé API">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
  </Step>
  <Step title="Définir un modèle d’image par défaut">
    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "fal/fal-ai/flux/dev",
          },
        },
      },
    }
    ```
  </Step>
</Steps>

## Génération d’images

Le fournisseur intégré de génération d’images `fal` utilise par défaut
`fal/fal-ai/flux/dev`.

| Capacité       | Valeur                    |
| -------------- | ------------------------- |
| Nombre max d’images | 4 par requête         |
| Mode édition   | Activé, 1 image de référence |
| Remplacements de taille | Pris en charge     |
| Ratio d’aspect | Pris en charge            |
| Résolution     | Prise en charge           |
| Format de sortie | `png` ou `jpeg`         |

<Warning>
Le point de terminaison d’édition d’image fal ne prend **pas** en charge les remplacements `aspectRatio`.
</Warning>

Utilisez `outputFormat: "png"` lorsque vous voulez une sortie PNG. fal ne déclare
pas de contrôle explicite d’arrière-plan transparent dans OpenClaw, donc `background:
"transparent"` est signalé comme remplacement ignoré pour les modèles fal.

Pour utiliser fal comme fournisseur d’image par défaut :

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "fal/fal-ai/flux/dev",
      },
    },
  },
}
```

## Génération de vidéos

Le fournisseur intégré de génération de vidéos `fal` utilise par défaut
`fal/fal-ai/minimax/video-01-live`.

| Capacité | Valeur                                                              |
| -------- | ------------------------------------------------------------------- |
| Modes    | Texte vers vidéo, référence image unique, Seedance reference-to-video |
| Runtime  | Flux soutenu par file d’attente submit/status/result pour les jobs longue durée |

<AccordionGroup>
  <Accordion title="Modèles vidéo disponibles">
    **HeyGen video-agent :**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Seedance 2.0 :**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/fast/reference-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`
    - `fal/bytedance/seedance-2.0/reference-to-video`

  </Accordion>

  <Accordion title="Exemple de configuration Seedance 2.0">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/bytedance/seedance-2.0/fast/text-to-video",
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Exemple de configuration Seedance 2.0 reference-to-video">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/bytedance/seedance-2.0/fast/reference-to-video",
          },
        },
      },
    }
    ```

    Reference-to-video accepte jusqu’à 9 images, 3 vidéos, et 3 références audio
    via les paramètres partagés `video_generate` `images`, `videos`, et `audioRefs`,
    avec un maximum de 12 fichiers de référence au total.

  </Accordion>

  <Accordion title="Exemple de configuration HeyGen video-agent">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/fal-ai/heygen/v2/video-agent",
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

<Tip>
Utilisez `openclaw models list --provider fal` pour voir la liste complète des modèles fal
disponibles, y compris les entrées ajoutées récemment.
</Tip>

## Associé

<CardGroup cols={2}>
  <Card title="Génération d’images" href="/fr/tools/image-generation" icon="image">
    Paramètres partagés de l’outil image et sélection du fournisseur.
  </Card>
  <Card title="Génération de vidéos" href="/fr/tools/video-generation" icon="video">
    Paramètres partagés de l’outil vidéo et sélection du fournisseur.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/config-agents#agent-defaults" icon="gear">
    Valeurs par défaut des agents, y compris la sélection des modèles d’image et de vidéo.
  </Card>
</CardGroup>
