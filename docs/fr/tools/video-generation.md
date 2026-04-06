---
read_when:
    - Génération de vidéos via l’agent
    - Configuration des fournisseurs et modèles de génération vidéo
    - Compréhension des paramètres de l’outil video_generate
summary: Générez des vidéos à partir de texte, d’images ou de vidéos existantes à l’aide de 12 backends de fournisseurs
title: Génération de vidéos
x-i18n:
    generated_at: "2026-04-06T06:56:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 90d8a392b35adbd899232b02c55c10895b9d7ffc9858d6ca448f2e4e4a57f12f
    source_path: tools/video-generation.md
    workflow: 15
---

# Génération de vidéos

Les agents OpenClaw peuvent générer des vidéos à partir d’invites textuelles, d’images de référence ou de vidéos existantes. Douze backends de fournisseurs sont pris en charge, chacun avec des options de modèle, des modes d’entrée et des ensembles de fonctionnalités différents. L’agent choisit automatiquement le bon fournisseur en fonction de votre configuration et des clés API disponibles.

<Note>
L’outil `video_generate` n’apparaît que lorsqu’au moins un fournisseur de génération vidéo est disponible. Si vous ne le voyez pas dans les outils de votre agent, définissez une clé API de fournisseur ou configurez `agents.defaults.videoGenerationModel`.
</Note>

## Démarrage rapide

1. Définissez une clé API pour n’importe quel fournisseur pris en charge :

```bash
export GEMINI_API_KEY="your-key"
```

2. Épinglez éventuellement un modèle par défaut :

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
```

3. Demandez à l’agent :

> Génère une vidéo cinématographique de 5 secondes d’un homard amical faisant du surf au coucher du soleil.

L’agent appelle automatiquement `video_generate`. Aucune liste d’autorisation d’outils n’est nécessaire.

## Ce qui se passe lorsque vous générez une vidéo

La génération vidéo est asynchrone. Lorsque l’agent appelle `video_generate` dans une session :

1. OpenClaw soumet la requête au fournisseur et renvoie immédiatement un ID de tâche.
2. Le fournisseur traite la tâche en arrière-plan (généralement de 30 secondes à 5 minutes selon le fournisseur et la résolution).
3. Lorsque la vidéo est prête, OpenClaw réactive la même session avec un événement interne de fin.
4. L’agent publie la vidéo terminée dans la conversation d’origine.

Pendant qu’une tâche est en cours, les appels `video_generate` en double dans la même session renvoient l’état actuel de la tâche au lieu de démarrer une nouvelle génération. Utilisez `openclaw tasks list` ou `openclaw tasks show <taskId>` pour vérifier la progression depuis la CLI.

En dehors des exécutions d’agent adossées à une session (par exemple, des invocations directes d’outils), l’outil revient à la génération en ligne et renvoie le chemin final du média dans le même tour.

## Fournisseurs pris en charge

| Fournisseur | Modèle par défaut               | Texte | Réf. image        | Réf. vidéo       | Clé API                                  |
| ----------- | ------------------------------- | ----- | ----------------- | ---------------- | ---------------------------------------- |
| Alibaba     | `wan2.6-t2v`                    | Oui   | Oui (URL distante) | Oui (URL distante) | `MODELSTUDIO_API_KEY`                    |
| BytePlus    | `seedance-1-0-lite-t2v-250428`  | Oui   | 1 image           | Non              | `BYTEPLUS_API_KEY`                       |
| ComfyUI     | `workflow`                      | Oui   | 1 image           | Non              | `COMFY_API_KEY` or `COMFY_CLOUD_API_KEY` |
| fal         | `fal-ai/minimax/video-01-live`  | Oui   | 1 image           | Non              | `FAL_KEY`                                |
| Google      | `veo-3.1-fast-generate-preview` | Oui   | 1 image           | 1 vidéo          | `GEMINI_API_KEY`                         |
| MiniMax     | `MiniMax-Hailuo-2.3`            | Oui   | 1 image           | Non              | `MINIMAX_API_KEY`                        |
| OpenAI      | `sora-2`                        | Oui   | 1 image           | 1 vidéo          | `OPENAI_API_KEY`                         |
| Qwen        | `wan2.6-t2v`                    | Oui   | Oui (URL distante) | Oui (URL distante) | `QWEN_API_KEY`                           |
| Runway      | `gen4.5`                        | Oui   | 1 image           | 1 vidéo          | `RUNWAYML_API_SECRET`                    |
| Together    | `Wan-AI/Wan2.2-T2V-A14B`        | Oui   | 1 image           | Non              | `TOGETHER_API_KEY`                       |
| Vydra       | `veo3`                          | Oui   | 1 image (`kling`) | Non              | `VYDRA_API_KEY`                          |
| xAI         | `grok-imagine-video`            | Oui   | 1 image           | 1 vidéo          | `XAI_API_KEY`                            |

Certains fournisseurs acceptent des variables d’environnement de clé API supplémentaires ou alternatives. Consultez les pages de [fournisseurs](#related) individuelles pour plus de détails.

Exécutez `video_generate action=list` pour inspecter les fournisseurs et modèles disponibles à l’exécution.

## Paramètres de l’outil

### Obligatoires

| Paramètre | Type   | Description                                                                    |
| --------- | ------ | ------------------------------------------------------------------------------ |
| `prompt`  | string | Description textuelle de la vidéo à générer (obligatoire pour `action: "generate"`) |

### Entrées de contenu

| Paramètre | Type     | Description                            |
| --------- | -------- | -------------------------------------- |
| `image`   | string   | Une seule image de référence (chemin ou URL) |
| `images`  | string[] | Plusieurs images de référence (jusqu’à 5) |
| `video`   | string   | Une seule vidéo de référence (chemin ou URL) |
| `videos`  | string[] | Plusieurs vidéos de référence (jusqu’à 4) |

### Contrôles de style

| Paramètre        | Type    | Description                                                              |
| ---------------- | ------- | ------------------------------------------------------------------------ |
| `aspectRatio`    | string  | `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`  |
| `resolution`     | string  | `480P`, `720P`, ou `1080P`                                               |
| `durationSeconds`| number  | Durée cible en secondes (arrondie à la valeur la plus proche prise en charge par le fournisseur) |
| `size`           | string  | Indication de taille lorsque le fournisseur la prend en charge           |
| `audio`          | boolean | Active l’audio généré lorsque cela est pris en charge                    |
| `watermark`      | boolean | Active ou désactive le filigrane du fournisseur lorsque cela est pris en charge |

### Avancés

| Paramètre  | Type   | Description                                     |
| ---------- | ------ | ----------------------------------------------- |
| `action`   | string | `"generate"` (par défaut), `"status"` ou `"list"` |
| `model`    | string | Surcharge fournisseur/modèle (par exemple `runway/gen4.5`) |
| `filename` | string | Indication de nom de fichier de sortie          |

Tous les fournisseurs ne prennent pas en charge tous les paramètres. Les surcharges non prises en charge sont ignorées dans la mesure du possible et signalées comme avertissements dans le résultat de l’outil. Les limites strictes de capacité (comme un trop grand nombre d’entrées de référence) échouent avant la soumission.

## Actions

- **generate** (par défaut) -- crée une vidéo à partir de l’invite donnée et d’entrées de référence facultatives.
- **status** -- vérifie l’état de la tâche vidéo en cours pour la session actuelle sans démarrer une autre génération.
- **list** -- affiche les fournisseurs, modèles et leurs capacités disponibles.

## Sélection du modèle

Lors de la génération d’une vidéo, OpenClaw résout le modèle dans cet ordre :

1. **Paramètre d’outil `model`** -- si l’agent en spécifie un dans l’appel.
2. **`videoGenerationModel.primary`** -- à partir de la configuration.
3. **`videoGenerationModel.fallbacks`** -- essayés dans l’ordre.
4. **Détection automatique** -- utilise les fournisseurs disposant d’une authentification valide, en commençant par le fournisseur par défaut actuel, puis les autres fournisseurs par ordre alphabétique.

Si un fournisseur échoue, le candidat suivant est essayé automatiquement. Si tous les candidats échouent, l’erreur inclut les détails de chaque tentative.

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
        fallbacks: ["runway/gen4.5", "qwen/wan2.6-t2v"],
      },
    },
  },
}
```

## Notes sur les fournisseurs

| Fournisseur | Notes                                                                                                                                                       |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba     | Utilise le point de terminaison asynchrone DashScope/Model Studio. Les images et vidéos de référence doivent être des URL `http(s)` distantes.              |
| BytePlus    | Une seule image de référence uniquement.                                                                                                                    |
| ComfyUI     | Exécution locale ou cloud pilotée par workflow. Prend en charge la génération de texte vers vidéo et d’image vers vidéo via le graphe configuré.           |
| fal         | Utilise un flux adossé à une file d’attente pour les tâches longues. Une seule image de référence uniquement.                                              |
| Google      | Utilise Gemini/Veo. Prend en charge une image ou une vidéo de référence.                                                                                   |
| MiniMax     | Une seule image de référence uniquement.                                                                                                                    |
| OpenAI      | Seule la surcharge `size` est transmise. Les autres surcharges de style (`aspectRatio`, `resolution`, `audio`, `watermark`) sont ignorées avec un avertissement. |
| Qwen        | Même backend DashScope qu’Alibaba. Les entrées de référence doivent être des URL `http(s)` distantes ; les fichiers locaux sont rejetés d’emblée.          |
| Runway      | Prend en charge les fichiers locaux via des URI de données. La vidéo vers vidéo nécessite `runway/gen4_aleph`. Les exécutions en texte seul exposent les ratios `16:9` et `9:16`. |
| Together    | Une seule image de référence uniquement.                                                                                                                    |
| Vydra       | Utilise directement `https://www.vydra.ai/api/v1` pour éviter les redirections qui suppriment l’authentification. `veo3` est fourni uniquement en texte vers vidéo ; `kling` nécessite une URL d’image distante. |
| xAI         | Prend en charge les flux texte vers vidéo, image vers vidéo et les flux distants de modification/extension vidéo.                                          |

## Configuration

Définissez le modèle de génération vidéo par défaut dans votre configuration OpenClaw :

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-r2v-flash"],
      },
    },
  },
}
```

Ou via la CLI :

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "qwen/wan2.6-t2v"
```

## Voir aussi

- [Vue d’ensemble des outils](/fr/tools)
- [Tâches en arrière-plan](/fr/automation/tasks) -- suivi des tâches pour la génération vidéo asynchrone
- [Alibaba Model Studio](/fr/providers/alibaba)
- [BytePlus](/fr/concepts/model-providers#byteplus-international)
- [ComfyUI](/fr/providers/comfy)
- [fal](/fr/providers/fal)
- [Google (Gemini)](/fr/providers/google)
- [MiniMax](/fr/providers/minimax)
- [OpenAI](/fr/providers/openai)
- [Qwen](/fr/providers/qwen)
- [Runway](/fr/providers/runway)
- [Together AI](/fr/providers/together)
- [Vydra](/fr/providers/vydra)
- [xAI](/fr/providers/xai)
- [Référence de configuration](/fr/gateway/configuration-reference#agent-defaults)
- [Modèles](/fr/concepts/models)
