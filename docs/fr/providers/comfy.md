---
read_when:
    - Vous voulez utiliser des workflows ComfyUI locaux avec OpenClaw
    - Vous voulez utiliser Comfy Cloud avec des workflows d’image, de vidéo ou de musique
    - Vous avez besoin des clés de configuration du plugin comfy inclus
summary: Configuration de la génération d’images, de vidéos et de musique par workflow ComfyUI dans OpenClaw
title: ComfyUI
x-i18n:
    generated_at: "2026-04-25T13:55:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 41dda4be24d5b2c283fa499a345cf9f38747ec19b4010163ceffd998307ca086
    source_path: providers/comfy.md
    workflow: 15
---

OpenClaw inclut un plugin `comfy` pour les exécutions ComfyUI pilotées par workflow. Le plugin est entièrement piloté par workflow, donc OpenClaw n’essaie pas de mapper des contrôles génériques `size`, `aspectRatio`, `resolution`, `durationSeconds` ou de type TTS sur votre graphe.

| Propriété       | Détail                                                                            |
| ---------------- | --------------------------------------------------------------------------------- |
| Fournisseur      | `comfy`                                                                           |
| Modèles          | `comfy/workflow`                                                                  |
| Surfaces partagées | `image_generate`, `video_generate`, `music_generate`                            |
| Authentification | Aucune pour ComfyUI local ; `COMFY_API_KEY` ou `COMFY_CLOUD_API_KEY` pour Comfy Cloud |
| API              | ComfyUI `/prompt` / `/history` / `/view` et Comfy Cloud `/api/*`                 |

## Ce qui est pris en charge

- Génération d’image à partir d’un JSON de workflow
- Édition d’image avec 1 image de référence uploadée
- Génération vidéo à partir d’un JSON de workflow
- Génération vidéo avec 1 image de référence uploadée
- Génération de musique ou d’audio via l’outil partagé `music_generate`
- Téléchargement de sortie depuis un nœud configuré ou tous les nœuds de sortie correspondants

## Prise en main

Choisissez entre exécuter ComfyUI sur votre propre machine ou utiliser Comfy Cloud.

<Tabs>
  <Tab title="Local">
    **Idéal pour :** exécuter votre propre instance ComfyUI sur votre machine ou votre LAN.

    <Steps>
      <Step title="Démarrer ComfyUI localement">
        Assurez-vous que votre instance ComfyUI locale est en cours d’exécution (par défaut `http://127.0.0.1:8188`).
      </Step>
      <Step title="Préparer votre JSON de workflow">
        Exportez ou créez un fichier JSON de workflow ComfyUI. Notez les identifiants de nœuds du nœud d’entrée de prompt et du nœud de sortie que vous voulez qu’OpenClaw lise.
      </Step>
      <Step title="Configurer le fournisseur">
        Définissez `mode: "local"` et pointez vers votre fichier de workflow. Voici un exemple minimal pour l’image :

        ```json5
        {
          plugins: {
            entries: {
              comfy: {
                config: {
                  mode: "local",
                  baseUrl: "http://127.0.0.1:8188",
                  image: {
                    workflowPath: "./workflows/flux-api.json",
                    promptNodeId: "6",
                    outputNodeId: "9",
                  },
                },
              },
            },
          },
        }
        ```
      </Step>
      <Step title="Définir le modèle par défaut">
        Pointez OpenClaw vers le modèle `comfy/workflow` pour la fonctionnalité que vous avez configurée :

        ```json5
        {
          agents: {
            defaults: {
              imageGenerationModel: {
                primary: "comfy/workflow",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="Vérifier">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Comfy Cloud">
    **Idéal pour :** exécuter des workflows sur Comfy Cloud sans gérer des ressources GPU locales.

    <Steps>
      <Step title="Obtenir une clé API">
        Inscrivez-vous sur [comfy.org](https://comfy.org) et générez une clé API depuis le tableau de bord de votre compte.
      </Step>
      <Step title="Définir la clé API">
        Fournissez votre clé par l’une des méthodes suivantes :

        ```bash
        # Variable d’environnement (préférée)
        export COMFY_API_KEY="your-key"

        # Variable d’environnement alternative
        export COMFY_CLOUD_API_KEY="your-key"

        # Ou directement dans la configuration
        openclaw config set plugins.entries.comfy.config.apiKey "your-key"
        ```
      </Step>
      <Step title="Préparer votre JSON de workflow">
        Exportez ou créez un fichier JSON de workflow ComfyUI. Notez les identifiants de nœuds du nœud d’entrée de prompt et du nœud de sortie.
      </Step>
      <Step title="Configurer le fournisseur">
        Définissez `mode: "cloud"` et pointez vers votre fichier de workflow :

        ```json5
        {
          plugins: {
            entries: {
              comfy: {
                config: {
                  mode: "cloud",
                  image: {
                    workflowPath: "./workflows/flux-api.json",
                    promptNodeId: "6",
                    outputNodeId: "9",
                  },
                },
              },
            },
          },
        }
        ```

        <Tip>
        En mode cloud, `baseUrl` vaut par défaut `https://cloud.comfy.org`. Vous n’avez besoin de définir `baseUrl` que si vous utilisez un point de terminaison cloud personnalisé.
        </Tip>
      </Step>
      <Step title="Définir le modèle par défaut">
        ```json5
        {
          agents: {
            defaults: {
              imageGenerationModel: {
                primary: "comfy/workflow",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="Vérifier">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Configuration

Comfy prend en charge des paramètres de connexion partagés de niveau supérieur plus des sections de workflow par fonctionnalité (`image`, `video`, `music`) :

```json5
{
  plugins: {
    entries: {
      comfy: {
        config: {
          mode: "local",
          baseUrl: "http://127.0.0.1:8188",
          image: {
            workflowPath: "./workflows/flux-api.json",
            promptNodeId: "6",
            outputNodeId: "9",
          },
          video: {
            workflowPath: "./workflows/video-api.json",
            promptNodeId: "12",
            outputNodeId: "21",
          },
          music: {
            workflowPath: "./workflows/music-api.json",
            promptNodeId: "3",
            outputNodeId: "18",
          },
        },
      },
    },
  },
}
```

### Clés partagées

| Clé                   | Type                   | Description                                                                           |
| --------------------- | ---------------------- | ------------------------------------------------------------------------------------- |
| `mode`                | `"local"` ou `"cloud"` | Mode de connexion.                                                                    |
| `baseUrl`             | string                 | Vaut par défaut `http://127.0.0.1:8188` en local ou `https://cloud.comfy.org` en cloud. |
| `apiKey`              | string                 | Clé inline facultative, alternative aux variables d’environnement `COMFY_API_KEY` / `COMFY_CLOUD_API_KEY`. |
| `allowPrivateNetwork` | boolean                | Autoriser une `baseUrl` privée/LAN en mode cloud.                                     |

### Clés par fonctionnalité

Ces clés s’appliquent à l’intérieur des sections `image`, `video` ou `music` :

| Clé                          | Requise | Par défaut | Description                                                                  |
| ---------------------------- | ------- | ---------- | ---------------------------------------------------------------------------- |
| `workflow` ou `workflowPath` | Oui     | --         | Chemin vers le fichier JSON de workflow ComfyUI.                             |
| `promptNodeId`               | Oui     | --         | Identifiant du nœud qui reçoit le prompt texte.                              |
| `promptInputName`            | Non     | `"text"`   | Nom d’entrée sur le nœud de prompt.                                          |
| `outputNodeId`               | Non     | --         | Identifiant du nœud à partir duquel lire la sortie. S’il est omis, tous les nœuds de sortie correspondants sont utilisés. |
| `pollIntervalMs`             | Non     | --         | Intervalle de polling en millisecondes pour la fin de tâche.                 |
| `timeoutMs`                  | Non     | --         | Délai d’expiration en millisecondes pour l’exécution du workflow.            |

Les sections `image` et `video` prennent aussi en charge :

| Clé                   | Requise                               | Par défaut | Description                                        |
| --------------------- | ------------------------------------- | ---------- | -------------------------------------------------- |
| `inputImageNodeId`    | Oui (lors du passage d’une image de référence) | --   | Identifiant du nœud qui reçoit l’image de référence uploadée. |
| `inputImageInputName` | Non                                   | `"image"`  | Nom d’entrée sur le nœud image.                    |

## Détails des workflows

<AccordionGroup>
  <Accordion title="Workflows d’image">
    Définissez le modèle d’image par défaut sur `comfy/workflow` :

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "comfy/workflow",
          },
        },
      },
    }
    ```

    **Exemple d’édition avec image de référence :**

    Pour activer l’édition d’image avec une image de référence uploadée, ajoutez `inputImageNodeId` à votre configuration image :

    ```json5
    {
      plugins: {
        entries: {
          comfy: {
            config: {
              image: {
                workflowPath: "./workflows/edit-api.json",
                promptNodeId: "6",
                inputImageNodeId: "7",
                inputImageInputName: "image",
                outputNodeId: "9",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Workflows vidéo">
    Définissez le modèle vidéo par défaut sur `comfy/workflow` :

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "comfy/workflow",
          },
        },
      },
    }
    ```

    Les workflows vidéo Comfy prennent en charge le texte-vers-vidéo et l’image-vers-vidéo via le graphe configuré.

    <Note>
    OpenClaw ne transmet pas de vidéos d’entrée dans les workflows Comfy. Seuls les prompts texte et les images de référence uniques sont pris en charge en entrée.
    </Note>

  </Accordion>

  <Accordion title="Workflows musicaux">
    Le plugin inclus enregistre un fournisseur de génération musicale pour les sorties audio ou musicales définies par workflow, exposé via l’outil partagé `music_generate` :

    ```text
    /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
    ```

    Utilisez la section de configuration `music` pour pointer vers votre JSON de workflow audio et votre nœud de sortie.

  </Accordion>

  <Accordion title="Rétrocompatibilité">
    La configuration d’image de niveau supérieur existante (sans section imbriquée `image`) fonctionne toujours :

    ```json5
    {
      plugins: {
        entries: {
          comfy: {
            config: {
              workflowPath: "./workflows/flux-api.json",
              promptNodeId: "6",
              outputNodeId: "9",
            },
          },
        },
      },
    }
    ```

    OpenClaw traite cette forme héritée comme la configuration du workflow image. Vous n’avez pas besoin de migrer immédiatement, mais les sections imbriquées `image` / `video` / `music` sont recommandées pour les nouvelles installations.

    <Tip>
    Si vous n’utilisez que la génération d’images, la configuration plate héritée et la nouvelle section imbriquée `image` sont fonctionnellement équivalentes.
    </Tip>

  </Accordion>

  <Accordion title="Tests live">
    Une couverture live opt-in existe pour le plugin inclus :

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    Le test live ignore les cas image, vidéo ou musique individuels sauf si la section de workflow Comfy correspondante est configurée.

  </Accordion>
</AccordionGroup>

## Related

<CardGroup cols={2}>
  <Card title="Génération d’images" href="/fr/tools/image-generation" icon="image">
    Configuration et utilisation de l’outil de génération d’images.
  </Card>
  <Card title="Génération vidéo" href="/fr/tools/video-generation" icon="video">
    Configuration et utilisation de l’outil de génération vidéo.
  </Card>
  <Card title="Génération musicale" href="/fr/tools/music-generation" icon="music">
    Configuration de l’outil de génération de musique et d’audio.
  </Card>
  <Card title="Répertoire des fournisseurs" href="/fr/providers/index" icon="layers">
    Vue d’ensemble de tous les fournisseurs et des références de modèles.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/config-agents#agent-defaults" icon="gear">
    Référence complète de configuration, y compris les valeurs par défaut des agents.
  </Card>
</CardGroup>
