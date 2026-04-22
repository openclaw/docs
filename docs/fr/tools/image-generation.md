---
read_when:
    - Génération d’images via l’agent
    - Configuration des providers et modèles de génération d’images
    - Comprendre les paramètres de l’outil `image_generate`
summary: Générez et modifiez des images à l’aide des providers configurés (OpenAI, Google Gemini, fal, MiniMax, ComfyUI, Vydra)
title: Génération d’images
x-i18n:
    generated_at: "2026-04-22T04:27:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: e365cd23f4f8d8c9ce88d57e65f06ac5ae5285b8b7f9ea37f0b08ab5f6ff7235
    source_path: tools/image-generation.md
    workflow: 15
---

# Génération d’images

L’outil `image_generate` permet à l’agent de créer et modifier des images à l’aide de vos providers configurés. Les images générées sont distribuées automatiquement comme pièces jointes média dans la réponse de l’agent.

<Note>
L’outil n’apparaît que lorsqu’au moins un provider de génération d’images est disponible. Si vous ne voyez pas `image_generate` dans les outils de votre agent, configurez `agents.defaults.imageGenerationModel` ou définissez une clé API de provider.
</Note>

## Démarrage rapide

1. Définissez une clé API pour au moins un provider (par exemple `OPENAI_API_KEY` ou `GEMINI_API_KEY`).
2. Définissez éventuellement votre modèle préféré :

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
      },
    },
  },
}
```

3. Demandez à l’agent : _« Génère une image d’une mascotte homard sympathique. »_

L’agent appelle automatiquement `image_generate`. Aucune allowlist d’outil n’est nécessaire — il est activé par défaut lorsqu’un provider est disponible.

## Providers pris en charge

| Provider | Modèle par défaut               | Prise en charge de l’édition      | Clé API                                                |
| -------- | ------------------------------- | --------------------------------- | ------------------------------------------------------ |
| OpenAI   | `gpt-image-2`                   | Oui (jusqu’à 5 images)            | `OPENAI_API_KEY`                                       |
| Google   | `gemini-3.1-flash-image-preview` | Oui                               | `GEMINI_API_KEY` ou `GOOGLE_API_KEY`                   |
| fal      | `fal-ai/flux/dev`               | Oui                               | `FAL_KEY`                                              |
| MiniMax  | `image-01`                      | Oui (référence de sujet)          | `MINIMAX_API_KEY` ou OAuth MiniMax (`minimax-portal`)  |
| ComfyUI  | `workflow`                      | Oui (1 image, selon le workflow)  | `COMFY_API_KEY` ou `COMFY_CLOUD_API_KEY` pour le cloud |
| Vydra    | `grok-imagine`                  | Non                               | `VYDRA_API_KEY`                                        |

Utilisez `action: "list"` pour inspecter les providers et modèles disponibles à l’exécution :

```
/tool image_generate action=list
```

## Paramètres de l’outil

| Paramètre     | Type      | Description                                                                          |
| ------------- | --------- | ------------------------------------------------------------------------------------ |
| `prompt`      | string    | Prompt de génération d’image (requis pour `action: "generate"`)                     |
| `action`      | string    | `"generate"` (par défaut) ou `"list"` pour inspecter les providers                  |
| `model`       | string    | Remplacement provider/modèle, par ex. `openai/gpt-image-2`                          |
| `image`       | string    | Chemin ou URL d’image de référence unique pour le mode édition                      |
| `images`      | string[]  | Plusieurs images de référence pour le mode édition (jusqu’à 5)                      |
| `size`        | string    | Indication de taille : `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160` |
| `aspectRatio` | string    | Ratio d’aspect : `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution`  | string    | Indication de résolution : `1K`, `2K` ou `4K`                                       |
| `count`       | number    | Nombre d’images à générer (1–4)                                                     |
| `filename`    | string    | Indication de nom de fichier de sortie                                              |

Tous les providers ne prennent pas en charge tous les paramètres. Lorsqu’un provider de repli prend en charge une option de géométrie proche au lieu de l’option exacte demandée, OpenClaw remappe vers la taille, le ratio d’aspect ou la résolution pris en charge les plus proches avant soumission. Les remplacements réellement non pris en charge sont toujours signalés dans le résultat de l’outil.

Les résultats d’outil signalent les paramètres appliqués. Lorsque OpenClaw remappe la géométrie pendant un repli de provider, les valeurs retournées `size`, `aspectRatio` et `resolution` reflètent ce qui a réellement été envoyé, et `details.normalization` capture la traduction de la demande vers l’application.

## Configuration

### Sélection du modèle

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview", "fal/fal-ai/flux/dev"],
      },
    },
  },
}
```

### Ordre de sélection des providers

Lors de la génération d’une image, OpenClaw essaie les providers dans cet ordre :

1. **Paramètre `model`** de l’appel d’outil (si l’agent en spécifie un)
2. **`imageGenerationModel.primary`** depuis la configuration
3. **`imageGenerationModel.fallbacks`** dans l’ordre
4. **Auto-détection** — utilise uniquement les valeurs par défaut de provider adossées à l’auth :
   - provider par défaut actuel en premier
   - providers de génération d’images enregistrés restants par ordre d’ID de provider

Si un provider échoue (erreur d’auth, limite de débit, etc.), le candidat suivant est essayé automatiquement. Si tous échouent, l’erreur inclut des détails de chaque tentative.

Remarques :

- L’auto-détection tient compte de l’authentification. Une valeur par défaut de provider n’entre dans la liste des candidats
  que lorsque OpenClaw peut réellement authentifier ce provider.
- L’auto-détection est activée par défaut. Définissez
  `agents.defaults.mediaGenerationAutoProviderFallback: false` si vous voulez que la génération d’images
  utilise uniquement les entrées explicites `model`, `primary` et `fallbacks`.
- Utilisez `action: "list"` pour inspecter les providers actuellement enregistrés, leurs
  modèles par défaut et les indications de variables d’environnement d’auth.

### Édition d’images

OpenAI, Google, fal, MiniMax et ComfyUI prennent en charge l’édition d’images de référence. Passez un chemin ou une URL d’image de référence :

```
"Génère une version aquarelle de cette photo" + image: "/path/to/photo.jpg"
```

OpenAI et Google prennent en charge jusqu’à 5 images de référence via le paramètre `images`. fal, MiniMax et ComfyUI en prennent en charge 1.

### OpenAI `gpt-image-2`

La génération d’images OpenAI utilise par défaut `openai/gpt-image-2`. L’ancien
modèle `openai/gpt-image-1` peut encore être sélectionné explicitement, mais les nouvelles requêtes OpenAI
de génération et d’édition d’images doivent utiliser `gpt-image-2`.

`gpt-image-2` prend en charge à la fois la génération texte-vers-image et l’édition
d’image de référence via le même outil `image_generate`. OpenClaw transmet `prompt`,
`count`, `size` et les images de référence à OpenAI. OpenAI ne reçoit pas
directement `aspectRatio` ou `resolution` ; lorsque c’est possible, OpenClaw les mappe vers une
`size` prise en charge, sinon l’outil les signale comme remplacements ignorés.

Générer une image paysage 4K :

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Une affiche éditoriale épurée pour la génération d’images OpenClaw" size=3840x2160 count=1
```

Générer deux images carrées :

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Deux directions visuelles pour l’icône d’une application de productivité apaisante" size=1024x1024 count=2
```

Modifier une image de référence locale :

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Conserve le sujet, remplace l’arrière-plan par une configuration studio lumineuse" image=/path/to/reference.png size=1024x1536
```

Modifier avec plusieurs références :

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine l’identité du personnage de la première image avec la palette de couleurs de la seconde" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

La génération d’images MiniMax est disponible via les deux chemins d’auth MiniMax intégrés :

- `minimax/image-01` pour les configurations à clé API
- `minimax-portal/image-01` pour les configurations OAuth

## Capacités des providers

| Capacité              | OpenAI                | Google               | fal                 | MiniMax                     | ComfyUI                             | Vydra   |
| --------------------- | --------------------- | -------------------- | ------------------- | --------------------------- | ----------------------------------- | ------- |
| Génération            | Oui (jusqu’à 4)       | Oui (jusqu’à 4)      | Oui (jusqu’à 4)     | Oui (jusqu’à 9)             | Oui (sorties définies par workflow) | Oui (1) |
| Édition/référence     | Oui (jusqu’à 5 images) | Oui (jusqu’à 5 images) | Oui (1 image)      | Oui (1 image, réf sujet)    | Oui (1 image, selon le workflow)    | Non     |
| Contrôle de taille    | Oui (jusqu’à 4K)      | Oui                  | Oui                 | Non                         | Non                                 | Non     |
| Ratio d’aspect        | Non                   | Oui                  | Oui (génération uniquement) | Oui                 | Non                                 | Non     |
| Résolution (1K/2K/4K) | Non                   | Oui                  | Oui                 | Non                         | Non                                 | Non     |

## Liens associés

- [Vue d’ensemble des outils](/fr/tools) — tous les outils d’agent disponibles
- [fal](/fr/providers/fal) — configuration du provider d’images et de vidéos fal
- [ComfyUI](/fr/providers/comfy) — configuration des workflows ComfyUI local et Comfy Cloud
- [Google (Gemini)](/fr/providers/google) — configuration du provider d’images Gemini
- [MiniMax](/fr/providers/minimax) — configuration du provider d’images MiniMax
- [OpenAI](/fr/providers/openai) — configuration du provider OpenAI Images
- [Vydra](/fr/providers/vydra) — configuration Vydra image, vidéo et parole
- [Référence de configuration](/fr/gateway/configuration-reference#agent-defaults) — configuration `imageGenerationModel`
- [Modèles](/fr/concepts/models) — configuration des modèles et basculement
