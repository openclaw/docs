---
read_when:
    - Génération d’images via l’agent
    - Configuration des fournisseurs et des modèles de génération d’images
    - Comprendre les paramètres de l’outil `image_generate`
summary: Générez et modifiez des images à l’aide des fournisseurs configurés (OpenAI, OpenAI Codex OAuth, Google Gemini, OpenRouter, fal, MiniMax, ComfyUI, Vydra, xAI)
title: Génération d’images
x-i18n:
    generated_at: "2026-04-25T13:58:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 02369928fecac147729ca586cd39e1a88791219ffe26d8e94429d0ea4b1af411
    source_path: tools/image-generation.md
    workflow: 15
---

L’outil `image_generate` permet à l’agent de créer et de modifier des images à l’aide de vos fournisseurs configurés. Les images générées sont automatiquement transmises comme pièces jointes multimédias dans la réponse de l’agent.

<Note>
L’outil n’apparaît que lorsqu’au moins un fournisseur de génération d’images est disponible. Si vous ne voyez pas `image_generate` dans les outils de votre agent, configurez `agents.defaults.imageGenerationModel`, définissez une clé d’API de fournisseur, ou connectez-vous avec OpenAI Codex OAuth.
</Note>

## Démarrage rapide

1. Définissez une clé d’API pour au moins un fournisseur (par exemple `OPENAI_API_KEY`, `GEMINI_API_KEY` ou `OPENROUTER_API_KEY`) ou connectez-vous avec OpenAI Codex OAuth.
2. Définissez éventuellement votre modèle préféré :

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

Codex OAuth utilise la même référence de modèle `openai/gpt-image-2`. Lorsqu’un
profil OAuth `openai-codex` est configuré, OpenClaw achemine les requêtes d’image
par ce même profil OAuth au lieu d’essayer d’abord `OPENAI_API_KEY`.
Une configuration d’image personnalisée explicite `models.providers.openai`, comme une clé d’API ou une
URL de base personnalisée/Azure, réactive le chemin direct de l’API OpenAI Images.
Pour des points de terminaison LAN compatibles OpenAI comme LocalAI, conservez la
`models.providers.openai.baseUrl` personnalisée et activez explicitement
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` ; les points de terminaison d’image privés/internes restent bloqués par défaut.

3. Demandez à l’agent : _"Génère une image d’une mascotte robot sympathique."_

L’agent appelle automatiquement `image_generate`. Aucune liste d’autorisation d’outils n’est nécessaire — il est activé par défaut lorsqu’un fournisseur est disponible.

## Itinéraires courants

| Objectif                                             | Référence de modèle                                | Authentification                     |
| ---------------------------------------------------- | -------------------------------------------------- | ------------------------------------ |
| Génération d’images OpenAI avec facturation API      | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                     |
| Génération d’images OpenAI avec auth par abonnement Codex | `openai/gpt-image-2`                          | OpenAI Codex OAuth                   |
| Génération d’images OpenRouter                       | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                 |
| Génération d’images Google Gemini                    | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` ou `GOOGLE_API_KEY` |

Le même outil `image_generate` gère la génération texte-vers-image et la
modification à partir d’images de référence. Utilisez `image` pour une référence ou `images` pour
plusieurs références.
Les indications de sortie prises en charge par le fournisseur, telles que `quality`, `outputFormat`, et
`background` spécifique à OpenAI, sont transmises lorsqu’elles sont disponibles et signalées comme
ignorées lorsqu’un fournisseur ne les prend pas en charge.

## Fournisseurs pris en charge

| Fournisseur | Modèle par défaut                        | Prise en charge de l’édition         | Authentification                                     |
| ----------- | ---------------------------------------- | ------------------------------------ | ---------------------------------------------------- |
| OpenAI      | `gpt-image-2`                            | Oui (jusqu’à 4 images)               | `OPENAI_API_KEY` ou OpenAI Codex OAuth               |
| OpenRouter  | `google/gemini-3.1-flash-image-preview`  | Oui (jusqu’à 5 images d’entrée)      | `OPENROUTER_API_KEY`                                 |
| Google      | `gemini-3.1-flash-image-preview`         | Oui                                  | `GEMINI_API_KEY` ou `GOOGLE_API_KEY`                 |
| fal         | `fal-ai/flux/dev`                        | Oui                                  | `FAL_KEY`                                            |
| MiniMax     | `image-01`                               | Oui (référence de sujet)             | `MINIMAX_API_KEY` ou OAuth MiniMax (`minimax-portal`) |
| ComfyUI     | `workflow`                               | Oui (1 image, configurée par workflow) | `COMFY_API_KEY` ou `COMFY_CLOUD_API_KEY` pour le cloud |
| Vydra       | `grok-imagine`                           | Non                                  | `VYDRA_API_KEY`                                      |
| xAI         | `grok-imagine-image`                     | Oui (jusqu’à 5 images)               | `XAI_API_KEY`                                        |

Utilisez `action: "list"` pour inspecter les fournisseurs et modèles disponibles à l’exécution :

```
/tool image_generate action=list
```

## Paramètres de l’outil

<ParamField path="prompt" type="string" required>
Prompt de génération d’image. Requis pour `action: "generate"`.
</ParamField>

<ParamField path="action" type="'generate' | 'list'" default="generate">
Utilisez `"list"` pour inspecter les fournisseurs et modèles disponibles à l’exécution.
</ParamField>

<ParamField path="model" type="string">
Remplacement fournisseur/modèle, par ex. `openai/gpt-image-2`.
</ParamField>

<ParamField path="image" type="string">
Chemin ou URL d’image de référence unique pour le mode édition.
</ParamField>

<ParamField path="images" type="string[]">
Images de référence multiples pour le mode édition (jusqu’à 5).
</ParamField>

<ParamField path="size" type="string">
Indication de taille : `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>

<ParamField path="aspectRatio" type="string">
Ratio d’aspect : `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`.
</ParamField>

<ParamField path="resolution" type="'1K' | '2K' | '4K'">
Indication de résolution.
</ParamField>

<ParamField path="quality" type="'low' | 'medium' | 'high' | 'auto'">
Indication de qualité lorsque le fournisseur la prend en charge.
</ParamField>

<ParamField path="outputFormat" type="'png' | 'jpeg' | 'webp'">
Indication de format de sortie lorsque le fournisseur la prend en charge.
</ParamField>

<ParamField path="count" type="number">
Nombre d’images à générer (1–4).
</ParamField>

<ParamField path="timeoutMs" type="number">
Expiration optionnelle de la requête fournisseur en millisecondes.
</ParamField>

<ParamField path="filename" type="string">
Indication de nom de fichier de sortie.
</ParamField>

<ParamField path="openai" type="object">
Indications réservées à OpenAI : `background`, `moderation`, `outputCompression`, et `user`.
</ParamField>

Tous les fournisseurs ne prennent pas en charge tous les paramètres. Lorsqu’un fournisseur de repli prend en charge une option de géométrie proche au lieu de l’option exacte demandée, OpenClaw remappe vers la taille, le ratio d’aspect ou la résolution pris en charge les plus proches avant l’envoi. Les indications de sortie non prises en charge, comme `quality` ou `outputFormat`, sont supprimées pour les fournisseurs qui ne déclarent pas leur prise en charge et sont signalées dans le résultat de l’outil.

Les résultats de l’outil indiquent les paramètres appliqués. Lorsque OpenClaw remappe la géométrie lors d’un repli fournisseur, les valeurs renvoyées de `size`, `aspectRatio`, et `resolution` reflètent ce qui a réellement été envoyé, et `details.normalization` capture la traduction entre la demande et la valeur appliquée.

## Configuration

### Sélection du modèle

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: [
          "openrouter/google/gemini-3.1-flash-image-preview",
          "google/gemini-3.1-flash-image-preview",
          "fal/fal-ai/flux/dev",
        ],
      },
    },
  },
}
```

### Ordre de sélection des fournisseurs

Lors de la génération d’une image, OpenClaw essaie les fournisseurs dans cet ordre :

1. le paramètre **`model`** de l’appel d’outil (si l’agent en spécifie un)
2. **`imageGenerationModel.primary`** depuis la config
3. **`imageGenerationModel.fallbacks`** dans l’ordre
4. **Détection automatique** — utilise uniquement les valeurs par défaut des fournisseurs prises en charge par l’authentification :
   - fournisseur par défaut actuel en premier
   - fournisseurs de génération d’images enregistrés restants dans l’ordre des identifiants de fournisseur

Si un fournisseur échoue (erreur d’authentification, limite de débit, etc.), le candidat configuré suivant est essayé automatiquement. Si tous échouent, l’erreur inclut les détails de chaque tentative.

Remarques :

- Un remplacement `model` par appel est exact : OpenClaw essaie uniquement ce fournisseur/modèle
  et ne continue pas vers les fournisseurs primary/fallback configurés ni vers les
  fournisseurs détectés automatiquement.
- La détection automatique tient compte de l’authentification. La valeur par défaut d’un fournisseur n’entre dans la liste des candidats
  que lorsque OpenClaw peut réellement authentifier ce fournisseur.
- La détection automatique est activée par défaut. Définissez
  `agents.defaults.mediaGenerationAutoProviderFallback: false` si vous voulez que la génération d’images
  utilise uniquement les entrées explicites `model`, `primary`, et `fallbacks`.
- Utilisez `action: "list"` pour inspecter les fournisseurs actuellement enregistrés, leurs
  modèles par défaut, et les indications de variables d’environnement d’authentification.

### Édition d’image

OpenAI, OpenRouter, Google, fal, MiniMax, ComfyUI et xAI prennent en charge l’édition d’images de référence. Passez un chemin ou une URL d’image de référence :

```
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google et xAI prennent en charge jusqu’à 5 images de référence via le paramètre `images`. fal, MiniMax et ComfyUI en prennent en charge 1.

### Modèles d’image OpenRouter

La génération d’images OpenRouter utilise la même `OPENROUTER_API_KEY` et passe par l’API d’images des chat completions d’OpenRouter. Sélectionnez les modèles d’image OpenRouter avec le préfixe `openrouter/` :

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

OpenClaw transmet `prompt`, `count`, les images de référence, et les indications `aspectRatio` / `resolution` compatibles Gemini à OpenRouter. Les raccourcis intégrés actuels pour les modèles d’image OpenRouter incluent `google/gemini-3.1-flash-image-preview`, `google/gemini-3-pro-image-preview`, et `openai/gpt-5.4-image-2` ; utilisez `action: "list"` pour voir ce qu’expose votre plugin configuré.

### OpenAI `gpt-image-2`

La génération d’images OpenAI utilise par défaut `openai/gpt-image-2`. Si un
profil OAuth `openai-codex` est configuré, OpenClaw réutilise le même profil OAuth
que celui utilisé par les modèles de chat par abonnement Codex et envoie la requête d’image
via le backend Codex Responses. Les anciennes URL de base Codex telles que
`https://chatgpt.com/backend-api` sont canonisées en
`https://chatgpt.com/backend-api/codex` pour les requêtes d’image. Il n’y a pas de
repli silencieux vers `OPENAI_API_KEY` pour cette requête. Pour forcer le routage direct vers l’API
OpenAI Images, configurez explicitement `models.providers.openai` avec une clé d’API,
une URL de base personnalisée ou un point de terminaison Azure. L’ancien modèle
`openai/gpt-image-1` peut toujours être sélectionné explicitement, mais les nouvelles requêtes OpenAI
de génération et d’édition d’images doivent utiliser `gpt-image-2`.

`gpt-image-2` prend en charge à la fois la génération texte-vers-image et la
modification d’images de référence via le même outil `image_generate`. OpenClaw transmet `prompt`,
`count`, `size`, `quality`, `outputFormat`, et les images de référence à OpenAI.
OpenAI ne reçoit pas directement `aspectRatio` ni `resolution` ; lorsque c’est possible
OpenClaw les mappe vers une `size` prise en charge, sinon l’outil les signale comme
remplacements ignorés.

Les options spécifiques à OpenAI se trouvent sous l’objet `openai` :

```json
{
  "quality": "low",
  "outputFormat": "jpeg",
  "openai": {
    "background": "opaque",
    "moderation": "low",
    "outputCompression": 60,
    "user": "end-user-42"
  }
}
```

`openai.background` accepte `transparent`, `opaque`, ou `auto` ; les sorties transparentes
nécessitent `outputFormat` `png` ou `webp`. `openai.outputCompression`
s’applique aux sorties JPEG/WebP.

Générer une image paysage 4K :

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```

Générer deux images carrées :

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```

Modifier une image de référence locale :

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```

Modifier avec plusieurs références :

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

Pour faire passer la génération d’images OpenAI par un déploiement Azure OpenAI au lieu
de `api.openai.com`, consultez [Azure OpenAI endpoints](/fr/providers/openai#azure-openai-endpoints)
dans la documentation du fournisseur OpenAI.

La génération d’images MiniMax est disponible via les deux chemins d’authentification MiniMax fournis avec OpenClaw :

- `minimax/image-01` pour les configurations avec clé d’API
- `minimax-portal/image-01` pour les configurations OAuth

## Capacités des fournisseurs

| Capacité              | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   | xAI                  |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- | -------------------- |
| Générer               | Oui (jusqu’à 4)      | Oui (jusqu’à 4)      | Oui (jusqu’à 4)     | Oui (jusqu’à 9)            | Oui (sorties définies par workflow) | Oui (1) | Oui (jusqu’à 4)      |
| Éditer/référence      | Oui (jusqu’à 5 images) | Oui (jusqu’à 5 images) | Oui (1 image)    | Oui (1 image, réf. sujet)  | Oui (1 image, configurée par workflow) | Non   | Oui (jusqu’à 5 images) |
| Contrôle de la taille | Oui (jusqu’à 4K)     | Oui                  | Oui                 | Non                        | Non                                 | Non     | Non                  |
| Ratio d’aspect        | Non                  | Oui                  | Oui (génération uniquement) | Oui                  | Non                                 | Non     | Oui                  |
| Résolution (1K/2K/4K) | Non                  | Oui                  | Oui                 | Non                        | Non                                 | Non     | Oui (1K/2K)          |

### xAI `grok-imagine-image`

Le fournisseur xAI fourni avec OpenClaw utilise `/v1/images/generations` pour les requêtes
avec prompt uniquement, et `/v1/images/edits` lorsque `image` ou `images` est présent.

- Modèles : `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
- Nombre : jusqu’à 4
- Références : un `image` ou jusqu’à cinq `images`
- Ratios d’aspect : `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
- Résolutions : `1K`, `2K`
- Sorties : renvoyées sous forme de pièces jointes d’image gérées par OpenClaw

OpenClaw n’expose intentionnellement pas `quality`, `mask`, `user`, ni
les ratios d’aspect supplémentaires réservés au natif xAI tant que ces contrôles n’existent pas dans le contrat
partagé inter-fournisseurs `image_generate`.

## Lié

- [Vue d’ensemble des outils](/fr/tools) — tous les outils d’agent disponibles
- [fal](/fr/providers/fal) — configuration du fournisseur d’images et de vidéos fal
- [ComfyUI](/fr/providers/comfy) — configuration des workflows ComfyUI local et Comfy Cloud
- [Google (Gemini)](/fr/providers/google) — configuration du fournisseur d’images Gemini
- [MiniMax](/fr/providers/minimax) — configuration du fournisseur d’images MiniMax
- [OpenAI](/fr/providers/openai) — configuration du fournisseur OpenAI Images
- [Vydra](/fr/providers/vydra) — configuration Vydra pour l’image, la vidéo et la parole
- [xAI](/fr/providers/xai) — configuration de Grok pour l’image, la vidéo, la recherche, l’exécution de code et la TTS
- [Référence de configuration](/fr/gateway/config-agents#agent-defaults) — configuration `imageGenerationModel`
- [Modèles](/fr/concepts/models) — configuration des modèles et basculement en cas d’échec
