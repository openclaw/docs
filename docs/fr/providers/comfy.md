---
read_when:
    - Vous souhaitez utiliser des workflows ComfyUI locaux avec OpenClaw
    - Vous souhaitez utiliser Comfy Cloud avec des workflows d’image, de vidéo ou de musique
    - Vous avez besoin des clés de configuration du plugin comfy inclus.
summary: Configuration de la génération d’images, de vidéos et de musique avec les workflows ComfyUI dans OpenClaw
title: ComfyUI
x-i18n:
    generated_at: "2026-07-12T15:51:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 74150d202a422de8e0f4b2b82d5d12bd42eb46991e8ef688832208e1a2ff7793
    source_path: providers/comfy.md
    workflow: 16
---

OpenClaw fournit un plugin `comfy` intégré pour les exécutions ComfyUI pilotées par des workflows. Le
plugin repose entièrement sur les workflows : OpenClaw ne mappe pas les contrôles génériques `size`,
`aspectRatio`, `resolution`, `durationSeconds` ou de type TTS sur
votre graphe.

| Propriété        | Détail                                                                                         |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| Fournisseur      | `comfy`                                                                                        |
| Modèle           | `comfy/workflow`                                                                               |
| Outils partagés  | `image_generate`, `video_generate`, `music_generate`                                           |
| Authentification | Aucune pour ComfyUI local ; `COMFY_API_KEY` ou `COMFY_CLOUD_API_KEY` pour Comfy Cloud           |
| API              | ComfyUI `/prompt` / `/history` / `/view` ; Comfy Cloud `/api/*`                                 |

## Fonctionnalités prises en charge

- Génération et modification d’images à partir d’un workflow JSON (la modification accepte 1 image de référence téléversée)
- Génération de vidéos à partir d’un workflow JSON, de texte vers vidéo ou d’image vers vidéo (1 image de référence)
- Génération de musique/audio via l’outil partagé `music_generate`, avec 1 image de référence facultative
- Téléchargement de la sortie depuis un Node configuré, ou depuis tous les Nodes de sortie correspondants lorsqu’aucun n’est configuré

## Bien démarrer

Choisissez entre l’exécution de ComfyUI sur votre propre machine et l’utilisation de Comfy Cloud.

<Tabs>
  <Tab title="Local">
    **Idéal pour :** exécuter votre propre instance ComfyUI sur votre machine ou votre réseau local.

    <Steps>
      <Step title="Démarrer ComfyUI localement">
        Assurez-vous que votre instance ComfyUI locale est en cours d’exécution (adresse par défaut : `http://127.0.0.1:8188`).
      </Step>
      <Step title="Préparer votre workflow JSON">
        Exportez ou créez un fichier de workflow JSON ComfyUI. Notez les identifiants des Nodes correspondant au Node d’entrée du prompt et au Node de sortie qu’OpenClaw doit lire.
      </Step>
      <Step title="Configurer le fournisseur">
        Définissez `mode: "local"` et indiquez votre fichier de workflow. Exemple minimal pour les images :

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
        Configurez OpenClaw pour utiliser le modèle `comfy/workflow` pour la fonctionnalité que vous avez configurée :

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
    **Idéal pour :** exécuter des workflows sur Comfy Cloud sans gérer de ressources GPU locales.

    <Steps>
      <Step title="Obtenir une clé API">
        Inscrivez-vous sur [comfy.org](https://comfy.org) et générez une clé API depuis le tableau de bord de votre compte.
      </Step>
      <Step title="Définir la clé API">
        Fournissez votre clé à l’aide de l’une des méthodes suivantes :

        ```bash
        # Option d’intégration
        openclaw onboard --comfy-api-key "your-key"

        # Variable d’environnement (recommandée pour les démons)
        export COMFY_API_KEY="your-key"

        # Autre variable d’environnement
        export COMFY_CLOUD_API_KEY="your-key"

        # Ou directement dans la configuration
        openclaw config set plugins.entries.comfy.config.apiKey "your-key"
        ```
      </Step>
      <Step title="Préparer votre workflow JSON">
        Exportez ou créez un fichier de workflow JSON ComfyUI. Notez les identifiants des Nodes correspondant au Node d’entrée du prompt et au Node de sortie.
      </Step>
      <Step title="Configurer le fournisseur">
        Définissez `mode: "cloud"` et indiquez votre fichier de workflow :

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
        En mode cloud, `baseUrl` vaut par défaut `https://cloud.comfy.org`. Définissez `baseUrl` uniquement pour un point de terminaison cloud personnalisé.
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

Comfy prend en charge des paramètres de connexion partagés au niveau supérieur, ainsi que des sections de workflow propres à chaque fonctionnalité (`image`, `video`, `music`) :

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

| Clé                   | Type                         | Description                                                                                                      |
| --------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `mode`                | `"local"` ou `"cloud"`       | Mode de connexion. Valeur par défaut : `"local"`.                                                               |
| `baseUrl`             | chaîne                       | Valeur par défaut : `http://127.0.0.1:8188` en local ou `https://cloud.comfy.org` dans le cloud.                 |
| `apiKey`              | chaîne                       | Clé facultative définie directement, à la place des variables d’environnement `COMFY_API_KEY` / `COMFY_CLOUD_API_KEY`. |
| `allowPrivateNetwork` | booléen                      | Autorise une `baseUrl` privée/sur le réseau local en mode cloud, ou un FQDN DNS privé local.                     |

<Note>
En mode `local`, les adresses IP littérales de bouclage/privées et les noms de service à une seule étiquette, tels que `http://comfyui:8188`, fonctionnent sans `allowPrivateNetwork`. Les FQDN DNS privés ayant l’apparence d’adresses publiques, tels que `https://comfy.local.example.com`, nécessitent `allowPrivateNetwork: true`. La confiance accordée à l’origine privée reste limitée au schéma, au nom d’hôte et au port configurés ; les redirections locales ne peuvent pas quitter le nom d’hôte configuré, tandis que les redirections cloud vers des CDN publics sont vérifiées avec la politique SSRF par défaut.
</Note>

### Clés propres à chaque fonctionnalité

Ces clés s’appliquent dans les sections `image`, `video` ou `music` :

| Clé                          | Requis | Valeur par défaut | Description                                                                                              |
| ---------------------------- | ------ | ----------------- | -------------------------------------------------------------------------------------------------------- |
| `workflow` ou `workflowPath` | Oui    | --                | Workflow JSON directement intégré, ou chemin vers le fichier de workflow JSON ComfyUI.                  |
| `promptNodeId`               | Oui    | --                | Identifiant du Node qui reçoit le prompt textuel.                                                        |
| `promptInputName`            | Non    | `"text"`          | Nom de l’entrée sur le Node du prompt.                                                                   |
| `outputNodeId`               | Non    | --                | Identifiant du Node dont la sortie doit être lue. S’il est omis, tous les Nodes de sortie correspondants sont utilisés. |
| `pollIntervalMs`             | Non    | `1500`            | Intervalle d’interrogation en millisecondes pour l’achèvement de la tâche.                               |
| `timeoutMs`                  | Non    | `300000`          | Délai d’expiration en millisecondes pour l’exécution du workflow.                                        |

Les sections `image` et `video` prennent également en charge un Node d’entrée pour une image de référence :

| Clé                   | Requis                                           | Valeur par défaut | Description                                                       |
| --------------------- | ------------------------------------------------ | ----------------- | ----------------------------------------------------------------- |
| `inputImageNodeId`    | Oui (lors du passage d’une image de référence)   | --                | Identifiant du Node qui reçoit l’image de référence téléversée.   |
| `inputImageInputName` | Non                                              | `"image"`         | Nom de l’entrée sur le Node d’image.                               |

`apiKey` accepte soit une chaîne littérale, soit un objet de [référence de secret](/fr/gateway/configuration-reference#secrets).

## Détails des workflows

<AccordionGroup>
  <Accordion title="Workflows d’image">
    Définissez le modèle d’image par défaut sur `comfy/workflow` :

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

    **Exemple de modification avec une image de référence :**

    Pour activer la modification d’image avec une image de référence téléversée, ajoutez `inputImageNodeId` à votre configuration d’image :

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
    Définissez le modèle vidéo par défaut sur `comfy/workflow` :

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

    Les workflows vidéo Comfy prennent en charge la conversion de texte en vidéo et d’image en vidéo via le graphe configuré.

    <Note>
    OpenClaw ne transmet pas de vidéos d’entrée aux workflows Comfy. Seuls les prompts textuels et les images de référence uniques sont pris en charge comme entrées.
    </Note>

  </Accordion>

  <Accordion title="Workflows musicaux">
    Le plugin intégré enregistre un fournisseur de génération musicale pour les sorties audio ou musicales définies par un workflow, accessible via l’outil partagé `music_generate`. Il accepte une image de référence facultative (jusqu’à 1) :

    ```text
    /tool music_generate prompt="Boucle de synthétiseur ambiante et chaleureuse avec une douce texture de bande"
    ```

    Utilisez la section de configuration `music` pour indiquer votre workflow JSON audio et votre Node de sortie.

  </Accordion>

  <Accordion title="Rétrocompatibilité">
    La configuration d’image existante au niveau supérieur (sans la section `image` imbriquée) continue de fonctionner :

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

    OpenClaw traite cette ancienne structure comme la configuration du workflow d’image. Vous n’avez pas besoin de migrer immédiatement, mais les sections imbriquées `image` / `video` / `music` sont recommandées pour les nouvelles configurations. Si vous utilisez uniquement la génération d’images, l’ancienne configuration plate et la nouvelle section `image` imbriquée sont fonctionnellement équivalentes.

  </Accordion>

  <Accordion title="Tests en conditions réelles">
    Une couverture de tests en conditions réelles activable est disponible pour le plugin intégré :

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    Le test en conditions réelles ignore les cas individuels d’image, de vidéo ou de musique, sauf si la section correspondante du workflow Comfy est configurée.

  </Accordion>
</AccordionGroup>

## Pages connexes

<CardGroup cols={2}>
  <Card title="Génération d’images" href="/fr/tools/image-generation" icon="image">
    Configuration et utilisation de l’outil de génération d’images.
  </Card>
  <Card title="Génération de vidéos" href="/fr/tools/video-generation" icon="video">
    Configuration et utilisation de l’outil de génération de vidéos.
  </Card>
  <Card title="Génération de musique" href="/fr/tools/music-generation" icon="music">
    Configuration de l’outil de génération de musique et de contenu audio.
  </Card>
  <Card title="Répertoire des fournisseurs" href="/fr/providers/index" icon="layers">
    Présentation de tous les fournisseurs et des références de modèles.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/config-agents#agent-defaults" icon="gear">
    Référence complète de la configuration, y compris les valeurs par défaut des agents.
  </Card>
</CardGroup>
