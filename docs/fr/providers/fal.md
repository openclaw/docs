---
read_when:
    - Vous voulez utiliser la génération d’images fal dans OpenClaw
    - Vous avez besoin du flux d’authentification `FAL_KEY`
    - Vous voulez les valeurs par défaut de fal pour image_generate ou video_generate
summary: Configuration de la génération d’images et de vidéos avec fal dans OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-05-11T20:52:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f074629e5274154b7a17686264a8b137d61df321d791d6e47c9d8abe67ad273
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw inclut un fournisseur `fal` groupé pour la génération hébergée d’images et de vidéos.

| Propriété | Valeur                                                        |
| --------- | ------------------------------------------------------------- |
| Fournisseur | `fal`                                                       |
| Authentification | `FAL_KEY` (canonique ; `FAL_API_KEY` fonctionne aussi comme solution de repli) |
| API       | Points de terminaison de modèles fal                         |

## Bien démarrer

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

Le fournisseur de génération d’images `fal` groupé utilise par défaut
`fal/fal-ai/flux/dev`.

| Capacité              | Valeur                                                     |
| --------------------- | ---------------------------------------------------------- |
| Nombre maximal d’images | 4 par requête                                            |
| Mode édition          | Flux : 1 image de référence ; GPT Image 2 : 10 ; Nano Banana 2 : 14 |
| Remplacements de taille | Pris en charge                                          |
| Rapport d’aspect      | Pris en charge pour la génération et l’édition GPT Image 2/Nano Banana 2 |
| Résolution            | Prise en charge                                           |
| Format de sortie      | `png` ou `jpeg`                                           |

<Warning>
Les requêtes image-à-image Flux ne prennent **pas** en charge les remplacements
`aspectRatio`. Les requêtes d’édition GPT Image 2 et Nano Banana 2 utilisent le
point de terminaison `/edit` de fal et acceptent les indications de rapport
d’aspect.
</Warning>

Utilisez `outputFormat: "png"` lorsque vous voulez une sortie PNG. fal ne déclare
pas de contrôle explicite d’arrière-plan transparent dans OpenClaw, donc
`background: "transparent"` est signalé comme un remplacement ignoré pour les
modèles fal.

Pour utiliser fal comme fournisseur d’images par défaut :

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

Le fournisseur de génération de vidéos `fal` groupé utilise par défaut
`fal/fal-ai/minimax/video-01-live`.

| Capacité | Valeur                                                            |
| -------- | ----------------------------------------------------------------- |
| Modes    | Texte-vers-vidéo, référence d’image unique, référence-vers-vidéo Seedance |
| Exécution | Flux soumission/état/résultat adossé à une file d’attente pour les tâches longues |

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

  <Accordion title="Exemple de configuration référence-vers-vidéo Seedance 2.0">
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

    La référence-vers-vidéo accepte jusqu’à 9 images, 3 vidéos et 3 références
    audio via les paramètres partagés `video_generate` `images`, `videos` et
    `audioRefs`, avec au maximum 12 fichiers de référence au total.

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
Utilisez `openclaw models list --provider fal` pour voir la liste complète des
modèles fal disponibles, y compris les entrées récemment ajoutées.
</Tip>

## Connexe

<CardGroup cols={2}>
  <Card title="Génération d’images" href="/fr/tools/image-generation" icon="image">
    Paramètres partagés de l’outil d’image et sélection du fournisseur.
  </Card>
  <Card title="Génération de vidéos" href="/fr/tools/video-generation" icon="video">
    Paramètres partagés de l’outil vidéo et sélection du fournisseur.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/config-agents#agent-defaults" icon="gear">
    Valeurs par défaut des agents, y compris la sélection des modèles d’image et de vidéo.
  </Card>
</CardGroup>
