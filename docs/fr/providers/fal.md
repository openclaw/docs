---
read_when:
    - Vous voulez utiliser la génération d’images fal dans OpenClaw
    - Vous avez besoin du flux d’authentification `FAL_KEY`
    - Vous voulez les valeurs par défaut de fal pour image_generate, video_generate ou music_generate
summary: Configuration de la génération d’images, de vidéos et de musique fal dans OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-06-27T18:04:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: af294939a39673fb32cb68c882708dbe69b64ca5e5d13f5504de9d1d8715e3bd
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw inclut un fournisseur `fal` groupé pour la génération hébergée
d’images, de vidéos et de musique.

| Propriété | Valeur                                                                    |
| --------- | ------------------------------------------------------------------------- |
| Fournisseur | `fal`                                                                   |
| Authentification | `FAL_KEY` (canonique ; `FAL_API_KEY` fonctionne aussi comme solution de repli) |
| API       | points de terminaison de modèles fal                                      |

## Premiers pas

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

| Capacité               | Valeur                                                            |
| ---------------------- | ----------------------------------------------------------------- |
| Images max.            | 4 par requête ; Krea 2 : 1 par requête                            |
| Mode édition           | Flux : 1 image de référence ; GPT Image 2 : 10 ; Nano Banana 2 : 14 |
| Références de style    | Krea 2 : jusqu’à 10 références de style via `image` / `images`    |
| Remplacements de taille | Pris en charge                                                   |
| Rapport d’aspect       | Pris en charge pour la génération, Krea 2, et l’édition GPT Image 2/Nano Banana 2 |
| Résolution             | Prise en charge                                                   |
| Format de sortie       | `png` ou `jpeg`                                                   |

<Warning>
Les requêtes image-à-image Flux ne prennent **pas** en charge les remplacements
`aspectRatio`. Les requêtes d’édition GPT Image 2 et Nano Banana 2 utilisent le
point de terminaison `/edit` de fal et acceptent les indications de rapport
d’aspect. Nano Banana 2 accepte aussi des rapports natifs supplémentaires
larges/hauts comme `4:1`, `1:4`, `8:1` et `1:8` ; Krea 2 valide son propre
sous-ensemble plus réduit de rapports d’aspect.
</Warning>

Les modèles Krea 2 utilisent le schéma de charge utile Krea natif de fal.
OpenClaw envoie `aspect_ratio`, `creativity` et `image_style_references` au lieu
de la charge utile générique `image_size` / point de terminaison d’édition
utilisée par Flux. Les références de modèle sont :

- `fal/krea/v2/medium/text-to-image`
- `fal/krea/v2/large/text-to-image`

Utilisez Medium pour des illustrations expressives, de l’anime, de la peinture
et des styles artistiques plus rapides. Utilisez Large pour des rendus
photoréalistes plus lents, des textures brutes, du grain de film et des aspects
détaillés. Krea utilise par défaut `fal.creativity: "medium"` ; les valeurs prises
en charge sont `raw`, `low`, `medium` et `high`.

Krea 2 expose le rapport d’aspect, et non `image_size`, dans le schéma de requête
de fal. Préférez `aspectRatio` ; OpenClaw mappe `size` au rapport d’aspect Krea
pris en charge le plus proche et rejette `resolution` pour Krea au lieu de
l’ignorer.

Utilisez `outputFormat: "png"` lorsque vous voulez une sortie PNG depuis les
modèles fal qui exposent `output_format`. fal ne déclare pas de contrôle explicite
de l’arrière-plan transparent dans OpenClaw ; `background: "transparent"` est donc
signalé comme un remplacement ignoré pour les modèles fal.
Les points de terminaison Krea 2 n’exposent pas de champ de requête
`output_format` via fal ; OpenClaw rejette donc les remplacements `outputFormat`
pour les requêtes Krea.

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

Pour utiliser Krea 2 Medium :

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "fal/krea/v2/medium/text-to-image",
      },
    },
  },
}
```

## Génération de vidéos

Le fournisseur de génération de vidéos `fal` groupé utilise par défaut
`fal/fal-ai/minimax/video-01-live`.

| Fonctionnalité | Valeur                                                              |
| ---------- | ------------------------------------------------------------------ |
| Modes      | Texte-vers-vidéo, référence à image unique, référence-vers-vidéo Seedance |
| Runtime    | Flux de soumission/statut/résultat adossé à une file d’attente pour les tâches de longue durée       |

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

    Le référence-vers-vidéo accepte jusqu’à 9 images, 3 vidéos et 3 références audio
    via les paramètres partagés `video_generate` `images`, `videos` et `audioRefs`,
    avec au maximum 12 fichiers de référence au total.

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

## Génération de musique

Le Plugin `fal` inclus enregistre également un fournisseur de génération de musique pour l’outil
partagé `music_generate`.

| Fonctionnalité    | Valeur                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| Modèle par défaut | `fal/fal-ai/minimax-music/v2.6`                                                                        |
| Modèles        | `fal-ai/minimax-music/v2.6`, `fal-ai/ace-step/prompt-to-audio`, `fal-ai/stable-audio-25/text-to-audio` |
| Runtime       | Requête synchrone plus téléchargement de l’audio généré                                                      |

Utilisez fal comme fournisseur de musique par défaut :

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "fal/fal-ai/minimax-music/v2.6",
      },
    },
  },
}
```

`fal-ai/minimax-music/v2.6` prend en charge les paroles explicites et le mode instrumental.
ACE-Step et Stable Audio sont des points de terminaison prompt-to-audio ; choisissez-les avec le
remplacement `model` lorsque vous voulez ces familles de modèles.

<Tip>
Utilisez `openclaw models list --provider fal` pour voir la liste complète des modèles fal
disponibles, y compris les entrées ajoutées récemment.
</Tip>

## Connexe

<CardGroup cols={2}>
  <Card title="Génération d’images" href="/fr/tools/image-generation" icon="image">
    Paramètres de l’outil d’image partagé et sélection du fournisseur.
  </Card>
  <Card title="Génération de vidéo" href="/fr/tools/video-generation" icon="video">
    Paramètres de l’outil vidéo partagé et sélection du fournisseur.
  </Card>
  <Card title="Génération de musique" href="/fr/tools/music-generation" icon="music">
    Paramètres de l’outil de musique partagé et sélection du fournisseur.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/config-agents#agent-defaults" icon="gear">
    Valeurs par défaut de l’agent, y compris la sélection des modèles d’image, de vidéo et de musique.
  </Card>
</CardGroup>
