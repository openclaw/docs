---
read_when:
    - Génération d'images via l'agent
    - Configuration des fournisseurs et modèles de génération d'images
    - Comprendre les paramètres de l'outil image_generate
summary: Générez et modifiez des images à l'aide des fournisseurs configurés (OpenAI, Google Gemini, fal, MiniMax, ComfyUI, Vydra)
title: Génération d'images
x-i18n:
    generated_at: "2026-04-06T06:56:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 903cc522c283a8da2cbd449ae3e25f349a74d00ecfdaf0f323fd8aa3f2107aea
    source_path: tools/image-generation.md
    workflow: 15
---

# Génération d'images

L'outil `image_generate` permet à l'agent de créer et de modifier des images à l'aide de vos fournisseurs configurés. Les images générées sont automatiquement livrées en tant que pièces jointes multimédias dans la réponse de l'agent.

<Note>
L'outil n'apparaît que lorsqu'au moins un fournisseur de génération d'images est disponible. Si vous ne voyez pas `image_generate` dans les outils de votre agent, configurez `agents.defaults.imageGenerationModel` ou définissez une clé API de fournisseur.
</Note>

## Démarrage rapide

1. Définissez une clé API pour au moins un fournisseur (par exemple `OPENAI_API_KEY` ou `GEMINI_API_KEY`).
2. Définissez éventuellement votre modèle préféré :

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
      },
    },
  },
}
```

3. Demandez à l'agent : _"Génère une image d'une mascotte homard sympathique."_

L'agent appelle `image_generate` automatiquement. Aucune autorisation explicite de l'outil n'est nécessaire — il est activé par défaut lorsqu'un fournisseur est disponible.

## Fournisseurs pris en charge

| Fournisseur | Modèle par défaut                | Prise en charge de la modification | Clé API                                                |
| ----------- | -------------------------------- | ---------------------------------- | ------------------------------------------------------ |
| OpenAI      | `gpt-image-1`                    | Oui (jusqu'à 5 images)             | `OPENAI_API_KEY`                                       |
| Google      | `gemini-3.1-flash-image-preview` | Oui                                | `GEMINI_API_KEY` ou `GOOGLE_API_KEY`                   |
| fal         | `fal-ai/flux/dev`                | Oui                                | `FAL_KEY`                                              |
| MiniMax     | `image-01`                       | Oui (référence de sujet)           | `MINIMAX_API_KEY` ou OAuth MiniMax (`minimax-portal`)  |
| ComfyUI     | `workflow`                       | Oui (1 image, configurée par workflow) | `COMFY_API_KEY` ou `COMFY_CLOUD_API_KEY` pour le cloud |
| Vydra       | `grok-imagine`                   | Non                                | `VYDRA_API_KEY`                                        |

Utilisez `action: "list"` pour inspecter les fournisseurs et modèles disponibles à l'exécution :

```
/tool image_generate action=list
```

## Paramètres de l'outil

| Paramètre    | Type     | Description                                                                          |
| ------------ | -------- | ------------------------------------------------------------------------------------ |
| `prompt`     | string   | Prompt de génération d'image (obligatoire pour `action: "generate"`)                 |
| `action`     | string   | `"generate"` (par défaut) ou `"list"` pour inspecter les fournisseurs                |
| `model`      | string   | Remplacement du fournisseur/modèle, par ex. `openai/gpt-image-1`                     |
| `image`      | string   | Chemin ou URL d'une image de référence unique pour le mode modification              |
| `images`     | string[] | Plusieurs images de référence pour le mode modification (jusqu'à 5)                  |
| `size`       | string   | Indication de taille : `1024x1024`, `1536x1024`, `1024x1536`, `1024x1792`, `1792x1024` |
| `aspectRatio` | string  | Ratio d'aspect : `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution` | string   | Indication de résolution : `1K`, `2K` ou `4K`                                        |
| `count`      | number   | Nombre d'images à générer (1–4)                                                      |
| `filename`   | string   | Indication de nom de fichier de sortie                                               |

Tous les fournisseurs ne prennent pas en charge tous les paramètres. L'outil transmet ce que chaque fournisseur prend en charge, ignore le reste et signale les remplacements ignorés dans le résultat de l'outil.

## Configuration

### Sélection du modèle

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
        fallbacks: ["google/gemini-3.1-flash-image-preview", "fal/fal-ai/flux/dev"],
      },
    },
  },
}
```

### Ordre de sélection des fournisseurs

Lors de la génération d'une image, OpenClaw essaie les fournisseurs dans cet ordre :

1. Le paramètre **`model`** de l'appel d'outil (si l'agent en spécifie un)
2. **`imageGenerationModel.primary`** depuis la configuration
3. **`imageGenerationModel.fallbacks`** dans l'ordre
4. **Détection automatique** — utilise uniquement les valeurs par défaut des fournisseurs adossés à une authentification :
   - le fournisseur par défaut actuel d'abord
   - les autres fournisseurs de génération d'images enregistrés dans l'ordre des identifiants de fournisseur

Si un fournisseur échoue (erreur d'authentification, limite de débit, etc.), le candidat suivant est essayé automatiquement. Si tous échouent, l'erreur inclut les détails de chaque tentative.

Remarques :

- La détection automatique tient compte de l'authentification. Une valeur par défaut de fournisseur n'entre dans la liste des candidats
  que lorsque OpenClaw peut réellement authentifier ce fournisseur.
- Utilisez `action: "list"` pour inspecter les fournisseurs actuellement enregistrés, leurs
  modèles par défaut et les indications de variables d'environnement pour l'authentification.

### Modification d'images

OpenAI, Google, fal, MiniMax et ComfyUI prennent en charge la modification d'images de référence. Transmettez un chemin ou une URL d'image de référence :

```
"Génère une version aquarelle de cette photo" + image: "/path/to/photo.jpg"
```

OpenAI et Google prennent en charge jusqu'à 5 images de référence via le paramètre `images`. fal, MiniMax et ComfyUI en prennent en charge 1.

La génération d'images MiniMax est disponible via les deux chemins d'authentification MiniMax intégrés :

- `minimax/image-01` pour les configurations avec clé API
- `minimax-portal/image-01` pour les configurations OAuth

## Capacités des fournisseurs

| Capacité              | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- |
| Génération            | Oui (jusqu'à 4)      | Oui (jusqu'à 4)      | Oui (jusqu'à 4)     | Oui (jusqu'à 9)            | Oui (sorties définies par workflow) | Oui (1) |
| Modification/référence | Oui (jusqu'à 5 images) | Oui (jusqu'à 5 images) | Oui (1 image)     | Oui (1 image, réf. sujet)  | Oui (1 image, configurée par workflow) | Non   |
| Contrôle de la taille | Oui                  | Oui                  | Oui                 | Non                        | Non                                 | Non     |
| Ratio d'aspect        | Non                  | Oui                  | Oui (génération uniquement) | Oui                  | Non                                 | Non     |
| Résolution (1K/2K/4K) | Non                  | Oui                  | Oui                 | Non                        | Non                                 | Non     |

## Liés

- [Vue d'ensemble des outils](/fr/tools) — tous les outils d'agent disponibles
- [fal](/fr/providers/fal) — configuration du fournisseur d'images et de vidéos fal
- [ComfyUI](/fr/providers/comfy) — configuration locale de workflow ComfyUI et Comfy Cloud
- [Google (Gemini)](/fr/providers/google) — configuration du fournisseur d'images Gemini
- [MiniMax](/fr/providers/minimax) — configuration du fournisseur d'images MiniMax
- [OpenAI](/fr/providers/openai) — configuration du fournisseur OpenAI Images
- [Vydra](/fr/providers/vydra) — configuration de Vydra pour l'image, la vidéo et la parole
- [Référence de configuration](/fr/gateway/configuration-reference#agent-defaults) — configuration `imageGenerationModel`
- [Modèles](/fr/concepts/models) — configuration des modèles et basculement
