---
read_when:
    - Vous souhaitez utiliser la génération d’images fal dans OpenClaw
    - Vous avez besoin du flux d’authentification FAL_KEY
    - Vous souhaitez utiliser les valeurs par défaut de fal pour image_generate, video_generate ou music_generate
summary: Configuration de la génération d’images, de vidéos et de musique avec fal dans OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-07-12T03:14:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9bd868aaf6771f6fa38bb8e2a83133460d150e2a5aa9e5b888e221c07f29e0ad
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw fournit un fournisseur `fal` intégré pour la génération hébergée
d’images, de vidéos et de musique.

| Propriété   | Valeur                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------- |
| Fournisseur | `fal`                                                                                       |
| Auth        | `FAL_KEY` (canonique ; `FAL_API_KEY` fonctionne aussi comme solution de repli)              |
| API         | Points de terminaison des modèles fal (`https://fal.run` ; les tâches vidéo utilisent `https://queue.fal.run`) |
| URL de base | À remplacer avec `models.providers.fal.baseUrl`                                              |

## Bien démarrer

<Steps>
  <Step title="Définir la clé API">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```

    Les configurations non interactives peuvent transmettre `--fal-api-key <key>` ou exporter `FAL_KEY`.
    L’intégration initiale définit également `fal/fal-ai/flux/dev` comme modèle d’image par défaut
    lorsqu’aucun n’est configuré.

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

| Fonctionnalité               | Valeur                                                                  |
| ---------------------------- | ----------------------------------------------------------------------- |
| Nombre maximal d’images      | 4 par requête ; Krea 2 : 1 par requête                                  |
| Remplacements de taille      | `1024x1024`, `1024x1536`, `1536x1024`, `1024x1792`, `1792x1024`         |
| Format d’image               | Pris en charge partout sauf pour la transformation image-à-image de Flux |
| Résolution                   | `1K`, `2K`, `4K` (limites par modèle ci-dessous)                        |
| Format de sortie             | `png` (par défaut) ou `jpeg` ; Krea 2 refuse les remplacements de `outputFormat` |

Les requêtes de modification (images de référence via les paramètres partagés `image` / `images`)
sont acheminées vers un point de terminaison de modification propre à chaque modèle, avec des limites
de références spécifiques :

| Famille de modèles           | Référence du modèle après `fal/`       | Point de terminaison de modification | Nombre maximal d’images de référence |
| ---------------------------- | -------------------------------------- | ------------------------------------ | ------------------------------------ |
| Flux et autres modèles fal   | `fal-ai/flux/dev` (par défaut)         | `/image-to-image`                    | 1                                    |
| GPT Image                    | `openai/gpt-image-*`                   | `/edit`                              | 10                                   |
| Grok Imagine                 | `xai/grok-imagine-image`               | `/edit`                              | 3                                    |
| Nano Banana (ancien)         | `fal-ai/nano-banana`                   | `/edit`                              | 3                                    |
| Nano Banana 2                | `fal-ai/nano-banana-*`                 | `/edit`                              | 14                                   |
| Nano Banana 2 Lite           | `google/nano-banana-2-lite`            | `/edit`                              | 14                                   |
| Krea 2                       | `krea/v2/{medium,large}/text-to-image` | aucun (références de style)          | 10 références de style               |

<Warning>
Les requêtes de transformation image-à-image Flux ne prennent **pas** en charge les remplacements
de `aspectRatio`. Les requêtes de modification GPT Image et Nano Banana 2 utilisent le point de
terminaison `/edit` de fal et acceptent des indications de format d’image. Nano Banana 2 accepte
également des formats natifs très larges ou très hauts tels que `4:1`, `1:4`, `8:1` et `1:8` ;
Krea 2 valide son propre sous-ensemble plus restreint de formats. Grok Imagine dispose de sa propre
liste de formats (notamment `2:1`, `20:9`, `19.5:9` et leurs inverses) et n’accepte que les résolutions
`1K`/`2K` ; l’ancien Nano Banana et Nano Banana 2 Lite refusent les remplacements de `resolution`.
</Warning>

Les modèles Krea 2 utilisent le schéma de charge utile Krea natif de fal. OpenClaw envoie
`aspect_ratio`, `creativity` et `image_style_references` au lieu de la charge utile générique
`image_size` / du point de terminaison de modification utilisée par Flux. Les références de modèles sont :

- `fal/krea/v2/medium/text-to-image`
- `fal/krea/v2/large/text-to-image`

Utilisez Medium pour des illustrations expressives, des animes, des peintures et des styles artistiques
générés plus rapidement. Utilisez Large pour des rendus photoréalistes plus lents, des textures brutes,
du grain cinématographique et des apparences détaillées. Krea utilise par défaut
`fal.creativity: "medium"` ; les valeurs prises en charge sont `raw`, `low`, `medium` et `high`.

Krea 2 expose le format d’image, et non `image_size`, dans le schéma de requête de fal. Privilégiez
`aspectRatio` ; OpenClaw associe `size` au format Krea pris en charge le plus proche et refuse
`resolution` pour Krea au lieu de l’ignorer.

Utilisez `outputFormat: "png"` lorsque vous souhaitez une sortie PNG avec les modèles fal qui exposent
`output_format`. fal ne déclare pas de contrôle explicite de l’arrière-plan transparent dans OpenClaw ;
`background: "transparent"` est donc signalé comme un remplacement ignoré pour les modèles fal.
Les points de terminaison Krea 2 n’exposent pas de champ de requête `output_format` via fal ;
OpenClaw refuse donc les remplacements de `outputFormat` pour les requêtes Krea.

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

Le fournisseur intégré de génération de vidéos `fal` utilise par défaut
`fal/fal-ai/minimax/video-01-live`.

| Fonctionnalité | Valeur                                                                 |
| -------------- | ---------------------------------------------------------------------- |
| Modes          | Texte-vers-vidéo, référence à une seule image, référence-vers-vidéo Seedance |
| Exécution      | Flux de soumission/état/résultat reposant sur une file d’attente pour les tâches longues |
| Délai maximal  | 20 minutes par tâche par défaut ; état interrogé toutes les 5 secondes |

<AccordionGroup>
  <Accordion title="Modèles vidéo disponibles">
    **MiniMax (par défaut) :**

    - `fal/fal-ai/minimax/video-01-live`

    **Agent vidéo HeyGen :**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Kling et Wan :**

    - `fal/fal-ai/kling-video/v2.1/master/text-to-video`
    - `fal/fal-ai/wan/v2.2-a14b/text-to-video`
    - `fal/fal-ai/wan/v2.2-a14b/image-to-video`

    **Seedance 2.0 :**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/fast/reference-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`
    - `fal/bytedance/seedance-2.0/reference-to-video`

    Les requêtes MiniMax Live et HeyGen envoient uniquement l’invite, ainsi qu’une image de référence
    unique facultative ; les autres remplacements ne sont pas transmis. Les modèles Seedance acceptent
    `aspectRatio`, `size`, `resolution`, des durées de 4 à 15 secondes et une option audio.

  </Accordion>

  <Accordion title="Exemple de configuration de Seedance 2.0">
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

  <Accordion title="Exemple de configuration référence-vers-vidéo de Seedance 2.0">
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

    Le mode référence-vers-vidéo accepte jusqu’à 9 images, 3 vidéos et 3 références audio
    au moyen des paramètres partagés `images`, `videos` et `audioRefs` de `video_generate`,
    avec un maximum de 12 fichiers de référence au total. Les références audio nécessitent
    au moins une référence d’image ou de vidéo dans la même requête.

  </Accordion>

  <Accordion title="Exemple de configuration de l’agent vidéo HeyGen">
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

Le Plugin intégré `fal` enregistre également un fournisseur de génération de musique pour l’outil
partagé `music_generate`.

| Fonctionnalité   | Valeur                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Modèle par défaut | `fal/fal-ai/minimax-music/v2.6`                                                                                         |
| Modèles          | `fal-ai/minimax-music/v2.6` (mp3), `fal-ai/ace-step/prompt-to-audio` (wav), `fal-ai/stable-audio-25/text-to-audio` (wav) |
| Durée maximale   | 240 secondes                                                                                                             |
| Exécution        | Requête synchrone suivie du téléchargement de l’audio généré                                                             |

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

`fal-ai/minimax-music/v2.6` prend en charge les paroles explicites et le mode instrumental,
mais pas les deux dans la même requête. ACE-Step et Stable Audio sont des points de terminaison
invite-vers-audio ; sélectionnez-les avec le remplacement `model` lorsque vous souhaitez utiliser
ces familles de modèles. ACE-Step refuse les paroles explicites ; Stable Audio refuse à la fois
les paroles et le mode instrumental.

<Tip>
Les tableaux et sections dépliables ci-dessus couvrent les familles de modèles que le fournisseur fal
intégré traite spécialement. D’autres identifiants de points de terminaison d’image fal peuvent toujours
être sélectionnés comme modèle d’image ; ils sont traités comme Flux (charge utile générique `image_size`,
une image de référence via `/image-to-image`).
</Tip>

## Ressources associées

<CardGroup cols={2}>
  <Card title="Génération d’images" href="/fr/tools/image-generation" icon="image">
    Paramètres partagés de l’outil d’image et sélection du fournisseur.
  </Card>
  <Card title="Génération de vidéos" href="/fr/tools/video-generation" icon="video">
    Paramètres partagés de l’outil vidéo et sélection du fournisseur.
  </Card>
  <Card title="Génération de musique" href="/fr/tools/music-generation" icon="music">
    Paramètres partagés de l’outil musical et sélection du fournisseur.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/config-agents#agent-defaults" icon="gear">
    Valeurs par défaut des agents, notamment la sélection des modèles d’image, de vidéo et de musique.
  </Card>
</CardGroup>
