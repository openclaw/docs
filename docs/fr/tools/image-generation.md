---
read_when:
    - Génération d’images via l’agent
    - Configuration des fournisseurs et modèles de génération d’images
    - Comprendre les paramètres de l’outil image_generate
summary: Générer et modifier des images à l’aide des fournisseurs configurés (OpenAI, Google Gemini, fal, MiniMax, ComfyUI, Vydra, xAI)
title: Génération d’images
x-i18n:
    generated_at: "2026-04-23T07:11:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 228049c74dd3437544cda6418da665aed375c0494ef36a6927d15c28d7783bbd
    source_path: tools/image-generation.md
    workflow: 15
---

# Génération d’images

L’outil `image_generate` permet à l’agent de créer et modifier des images à l’aide de vos fournisseurs configurés. Les images générées sont livrées automatiquement comme pièces jointes média dans la réponse de l’agent.

<Note>
L’outil n’apparaît que lorsqu’au moins un fournisseur de génération d’images est disponible. Si vous ne voyez pas `image_generate` dans les outils de votre agent, configurez `agents.defaults.imageGenerationModel` ou définissez une clé API de fournisseur.
</Note>

## Démarrage rapide

1. Définissez une clé API pour au moins un fournisseur (par exemple `OPENAI_API_KEY` ou `GEMINI_API_KEY`).
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

L’agent appelle automatiquement `image_generate`. Aucun allow-listing d’outil n’est nécessaire — il est activé par défaut lorsqu’un fournisseur est disponible.

## Fournisseurs pris en charge

| Fournisseur | Modèle par défaut                | Prise en charge de l’édition      | Clé API                                               |
| ----------- | -------------------------------- | --------------------------------- | ----------------------------------------------------- |
| OpenAI      | `gpt-image-2`                    | Oui (jusqu’à 5 images)            | `OPENAI_API_KEY`                                      |
| Google      | `gemini-3.1-flash-image-preview` | Oui                               | `GEMINI_API_KEY` ou `GOOGLE_API_KEY`                  |
| fal         | `fal-ai/flux/dev`                | Oui                               | `FAL_KEY`                                             |
| MiniMax     | `image-01`                       | Oui (image de référence de sujet) | `MINIMAX_API_KEY` ou OAuth MiniMax (`minimax-portal`) |
| ComfyUI     | `workflow`                       | Oui (1 image, configurée par workflow) | `COMFY_API_KEY` ou `COMFY_CLOUD_API_KEY` pour le cloud |
| Vydra       | `grok-imagine`                   | Non                               | `VYDRA_API_KEY`                                       |
| xAI         | `grok-imagine-image`             | Oui (jusqu’à 5 images)            | `XAI_API_KEY`                                         |

Utilisez `action: "list"` pour inspecter les fournisseurs et modèles disponibles à l’exécution :

```
/tool image_generate action=list
```

## Paramètres de l’outil

| Paramètre     | Type     | Description                                                                           |
| ------------- | -------- | ------------------------------------------------------------------------------------- |
| `prompt`      | string   | Prompt de génération d’image (obligatoire pour `action: "generate"`)                  |
| `action`      | string   | `"generate"` (par défaut) ou `"list"` pour inspecter les fournisseurs                 |
| `model`       | string   | Surcharge fournisseur/modèle, par ex. `openai/gpt-image-2`                            |
| `image`       | string   | Chemin ou URL d’une image de référence unique pour le mode édition                    |
| `images`      | string[] | Plusieurs chemins ou URL d’images de référence pour le mode édition (jusqu’à 5)       |
| `size`        | string   | Indice de taille : `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`    |
| `aspectRatio` | string   | Ratio d’aspect : `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution`  | string   | Indice de résolution : `1K`, `2K` ou `4K`                                             |
| `count`       | number   | Nombre d’images à générer (1–4)                                                       |
| `filename`    | string   | Indice de nom de fichier de sortie                                                    |

Tous les fournisseurs ne prennent pas en charge tous les paramètres. Lorsqu’un fournisseur de repli prend en charge une option de géométrie proche plutôt que l’option exacte demandée, OpenClaw remappe vers la taille, le ratio d’aspect ou la résolution pris en charge les plus proches avant soumission. Les surcharges réellement non prises en charge sont toujours signalées dans le résultat de l’outil.

Les résultats d’outil signalent les paramètres appliqués. Lorsque OpenClaw remappe la géométrie pendant un repli de fournisseur, les valeurs renvoyées `size`, `aspectRatio` et `resolution` reflètent ce qui a réellement été envoyé, et `details.normalization` capture la traduction entre la valeur demandée et la valeur appliquée.

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

### Ordre de sélection des fournisseurs

Lors de la génération d’une image, OpenClaw essaie les fournisseurs dans cet ordre :

1. Paramètre **`model`** de l’appel d’outil (si l’agent en spécifie un)
2. **`imageGenerationModel.primary`** depuis la configuration
3. **`imageGenerationModel.fallbacks`** dans l’ordre
4. **Détection automatique** — utilise uniquement les valeurs par défaut des fournisseurs appuyées sur l’authentification :
   - d’abord le fournisseur par défaut actuel
   - puis les autres fournisseurs de génération d’images enregistrés dans l’ordre des ID de fournisseur

Si un fournisseur échoue (erreur d’authentification, limite de débit, etc.), le candidat suivant est essayé automatiquement. Si tous échouent, l’erreur inclut les détails de chaque tentative.

Remarques :

- La détection automatique tient compte de l’authentification. Une valeur par défaut de fournisseur n’entre dans la liste des candidats
  que lorsqu’OpenClaw peut réellement authentifier ce fournisseur.
- La détection automatique est activée par défaut. Définissez
  `agents.defaults.mediaGenerationAutoProviderFallback: false` si vous voulez que la génération d’images
  n’utilise que les entrées explicites `model`, `primary` et `fallbacks`.
- Utilisez `action: "list"` pour inspecter les fournisseurs actuellement enregistrés, leurs
  modèles par défaut et les indications de variables d’environnement d’authentification.

### Édition d’image

OpenAI, Google, fal, MiniMax, ComfyUI et xAI prennent en charge l’édition d’images de référence. Passez un chemin ou une URL d’image de référence :

```
"Génère une version aquarelle de cette photo" + image: "/path/to/photo.jpg"
```

OpenAI, Google et xAI prennent en charge jusqu’à 5 images de référence via le paramètre `images`. fal, MiniMax et ComfyUI en prennent en charge 1.

### OpenAI `gpt-image-2`

La génération d’images OpenAI utilise par défaut `openai/gpt-image-2`. L’ancien
modèle `openai/gpt-image-1` peut toujours être sélectionné explicitement, mais les nouvelles
requêtes de génération et d’édition d’images OpenAI devraient utiliser `gpt-image-2`.

`gpt-image-2` prend en charge à la fois la génération texte-vers-image et l’édition
d’image de référence via le même outil `image_generate`. OpenClaw transmet `prompt`,
`count`, `size` et les images de référence à OpenAI. OpenAI ne reçoit pas
directement `aspectRatio` ni `resolution` ; lorsque c’est possible, OpenClaw les mappe vers une
`size` prise en charge, sinon l’outil les signale comme des surcharges ignorées.

Générer une image paysage 4K :

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Une affiche éditoriale propre pour la génération d’images OpenClaw" size=3840x2160 count=1
```

Générer deux images carrées :

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Deux directions visuelles pour une icône d’application de productivité apaisante" size=1024x1024 count=2
```

Modifier une image de référence locale :

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Garde le sujet, remplace l’arrière-plan par une installation de studio lumineuse" image=/path/to/reference.png size=1024x1536
```

Modifier avec plusieurs références :

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine l’identité du personnage de la première image avec la palette de couleurs de la seconde" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

La génération d’images MiniMax est disponible via les deux chemins d’authentification MiniMax intégrés :

- `minimax/image-01` pour les configurations avec clé API
- `minimax-portal/image-01` pour les configurations OAuth

## Capacités des fournisseurs

| Capacité              | OpenAI               | Google               | fal                  | MiniMax                     | ComfyUI                             | Vydra   | xAI                  |
| --------------------- | -------------------- | -------------------- | -------------------- | --------------------------- | ----------------------------------- | ------- | -------------------- |
| Génération            | Oui (jusqu’à 4)      | Oui (jusqu’à 4)      | Oui (jusqu’à 4)      | Oui (jusqu’à 9)             | Oui (sorties définies par workflow) | Oui (1) | Oui (jusqu’à 4)      |
| Édition/référence     | Oui (jusqu’à 5 images) | Oui (jusqu’à 5 images) | Oui (1 image)     | Oui (1 image, réf sujet)    | Oui (1 image, configurée par workflow) | Non  | Oui (jusqu’à 5 images) |
| Contrôle de taille    | Oui (jusqu’à 4K)     | Oui                  | Oui                  | Non                         | Non                                 | Non     | Non                  |
| Ratio d’aspect        | Non                  | Oui                  | Oui (génération uniquement) | Oui                    | Non                                 | Non     | Oui                  |
| Résolution (1K/2K/4K) | Non                  | Oui                  | Oui                  | Non                         | Non                                 | Non     | Oui (1K/2K)          |

### xAI `grok-imagine-image`

Le fournisseur xAI intégré utilise `/v1/images/generations` pour les requêtes
avec prompt uniquement et `/v1/images/edits` lorsque `image` ou `images` est présent.

- Modèles : `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
- Nombre : jusqu’à 4
- Références : une `image` ou jusqu’à cinq `images`
- Ratios d’aspect : `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
- Résolutions : `1K`, `2K`
- Sorties : renvoyées comme pièces jointes image gérées par OpenClaw

OpenClaw n’expose intentionnellement pas `quality`, `mask`, `user` natifs de xAI, ni
des ratios d’aspect natifs supplémentaires tant que ces contrôles n’existent pas dans le contrat partagé
inter-fournisseurs `image_generate`.

## Liens associés

- [Vue d’ensemble des outils](/fr/tools) — tous les outils d’agent disponibles
- [fal](/fr/providers/fal) — configuration du fournisseur image et vidéo fal
- [ComfyUI](/fr/providers/comfy) — configuration locale ComfyUI et Comfy Cloud workflow
- [Google (Gemini)](/fr/providers/google) — configuration du fournisseur d’images Gemini
- [MiniMax](/fr/providers/minimax) — configuration du fournisseur d’images MiniMax
- [OpenAI](/fr/providers/openai) — configuration du fournisseur OpenAI Images
- [Vydra](/fr/providers/vydra) — configuration Vydra image, vidéo et speech
- [xAI](/fr/providers/xai) — configuration Grok image, vidéo, recherche, exécution de code et TTS
- [Référence de configuration](/fr/gateway/configuration-reference#agent-defaults) — configuration `imageGenerationModel`
- [Modèles](/fr/concepts/models) — configuration des modèles et repli
