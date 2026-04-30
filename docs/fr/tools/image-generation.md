---
read_when:
    - Génération ou modification d’images via l’agent
    - Configuration des fournisseurs et modèles de génération d’images
    - Comprendre les paramètres de l’outil image_generate
sidebarTitle: Image generation
summary: Générer et modifier des images via image_generate avec OpenAI, Google, fal, MiniMax, ComfyUI, DeepInfra, OpenRouter, LiteLLM, xAI, Vydra
title: Génération d’images
x-i18n:
    generated_at: "2026-04-30T07:51:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2237ad82279d8daf28d70a550727a5900d7a820a0c9ba09de8b7bae5b6575401
    source_path: tools/image-generation.md
    workflow: 16
---

L’outil `image_generate` permet à l’agent de créer et de modifier des images avec vos
fournisseurs configurés. Les images générées sont livrées automatiquement sous forme de pièces
jointes multimédias dans la réponse de l’agent.

<Note>
L’outil n’apparaît que lorsqu’au moins un fournisseur de génération d’images est
disponible. Si vous ne voyez pas `image_generate` dans les outils de votre agent,
configurez `agents.defaults.imageGenerationModel`, définissez une clé d’API de fournisseur
ou connectez-vous avec OpenAI Codex OAuth.
</Note>

## Démarrage rapide

<Steps>
  <Step title="Configurer l’authentification">
    Définissez une clé d’API pour au moins un fournisseur (par exemple `OPENAI_API_KEY`,
    `GEMINI_API_KEY`, `OPENROUTER_API_KEY`) ou connectez-vous avec OpenAI Codex OAuth.
  </Step>
  <Step title="Choisir un modèle par défaut (facultatif)">
    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "openai/gpt-image-2",
            timeoutMs: 180_000,
          },
        },
      },
    }
    ```

    Codex OAuth utilise la même référence de modèle `openai/gpt-image-2`. Lorsqu’un
    profil OAuth `openai-codex` est configuré, OpenClaw achemine les requêtes
    d’images via ce profil OAuth au lieu d’essayer d’abord
    `OPENAI_API_KEY`. Une configuration explicite `models.providers.openai` (clé d’API,
    URL de base personnalisée/Azure) réactive l’itinéraire direct vers l’API OpenAI Images.

  </Step>
  <Step title="Demander à l’agent">
    _« Génère une image d’une mascotte robot sympathique. »_

    L’agent appelle automatiquement `image_generate`. Aucune liste d’autorisation
    d’outils n’est nécessaire : il est activé par défaut lorsqu’un fournisseur est disponible.

  </Step>
</Steps>

<Warning>
Pour les points de terminaison LAN compatibles OpenAI tels que LocalAI, conservez l’URL de base
`models.providers.openai.baseUrl` personnalisée et activez-la explicitement avec
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`. Les points de terminaison d’images privés et
internes restent bloqués par défaut.
</Warning>

## Itinéraires courants

| Objectif                                             | Référence de modèle                                | Authentification                       |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| Génération d’images OpenAI avec facturation API      | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| Génération d’images OpenAI avec authentification par abonnement Codex | `openai/gpt-image-2`                               | OpenAI Codex OAuth                     |
| PNG/WebP OpenAI avec arrière-plan transparent        | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` ou OpenAI Codex OAuth |
| Génération d’images DeepInfra                        | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| Génération d’images OpenRouter                       | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| Génération d’images LiteLLM                          | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| Génération d’images Google Gemini                    | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` ou `GOOGLE_API_KEY`   |

Le même outil `image_generate` gère la conversion texte-image et la modification
d’images de référence. Utilisez `image` pour une référence ou `images` pour plusieurs références.
Les indications de sortie prises en charge par le fournisseur, telles que `quality`, `outputFormat` et
`background`, sont transmises lorsqu’elles sont disponibles et signalées comme ignorées lorsqu’un
fournisseur ne les prend pas en charge. La prise en charge intégrée des arrière-plans transparents est
spécifique à OpenAI ; d’autres fournisseurs peuvent tout de même conserver l’alpha PNG si leur
backend l’émet.

## Fournisseurs pris en charge

| Fournisseur | Modèle par défaut                      | Prise en charge de la modification   | Authentification                                      |
| ---------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI    | `workflow`                              | Oui (1 image, configurée par workflow) | `COMFY_API_KEY` ou `COMFY_CLOUD_API_KEY` pour le cloud |
| DeepInfra  | `black-forest-labs/FLUX-1-schnell`      | Oui (1 image)                      | `DEEPINFRA_API_KEY`                                   |
| fal        | `fal-ai/flux/dev`                       | Oui                                | `FAL_KEY`                                             |
| Google     | `gemini-3.1-flash-image-preview`        | Oui                                | `GEMINI_API_KEY` ou `GOOGLE_API_KEY`                  |
| LiteLLM    | `gpt-image-2`                           | Oui (jusqu’à 5 images d’entrée)    | `LITELLM_API_KEY`                                     |
| MiniMax    | `image-01`                              | Oui (référence de sujet)           | `MINIMAX_API_KEY` ou MiniMax OAuth (`minimax-portal`) |
| OpenAI     | `gpt-image-2`                           | Oui (jusqu’à 4 images)             | `OPENAI_API_KEY` ou OpenAI Codex OAuth                |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | Oui (jusqu’à 5 images d’entrée)    | `OPENROUTER_API_KEY`                                  |
| Vydra      | `grok-imagine`                          | Non                                | `VYDRA_API_KEY`                                       |
| xAI        | `grok-imagine-image`                    | Oui (jusqu’à 5 images)             | `XAI_API_KEY`                                         |

Utilisez `action: "list"` pour inspecter les fournisseurs et modèles disponibles à l’exécution :

```text
/tool image_generate action=list
```

## Capacités des fournisseurs

| Capacité              | ComfyUI            | DeepInfra | fal                       | Google              | MiniMax                 | OpenAI              | Vydra | xAI                 |
| --------------------- | ------------------ | --------- | ------------------------- | ------------------- | ----------------------- | ------------------- | ----- | ------------------- |
| Générer (nombre max.) | Défini par workflow | 4         | 4                         | 4                   | 9                       | 4                   | 1     | 4                   |
| Modification / référence | 1 image (workflow) | 1 image   | 1 image                   | Jusqu’à 5 images    | 1 image (réf. sujet)    | Jusqu’à 5 images    | —     | Jusqu’à 5 images    |
| Contrôle de la taille | —                  | ✓         | ✓                         | ✓                   | —                       | Jusqu’à 4K          | —     | —                   |
| Format d’image        | —                  | —         | ✓ (génération uniquement) | ✓                   | ✓                       | —                   | —     | ✓                   |
| Résolution (1K/2K/4K) | —                  | —         | ✓                         | ✓                   | —                       | —                   | —     | 1K, 2K              |

## Paramètres de l’outil

<ParamField path="prompt" type="string" required>
  Invite de génération d’image. Requise pour `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "list"' default="generate">
  Utilisez `"list"` pour inspecter les fournisseurs et modèles disponibles à l’exécution.
</ParamField>
<ParamField path="model" type="string">
  Remplacement du fournisseur/modèle (par exemple `openai/gpt-image-2`). Utilisez
  `openai/gpt-image-1.5` pour les arrière-plans OpenAI transparents.
</ParamField>
<ParamField path="image" type="string">
  Chemin ou URL d’une seule image de référence pour le mode modification.
</ParamField>
<ParamField path="images" type="string[]">
  Plusieurs images de référence pour le mode modification (jusqu’à 5 chez les fournisseurs compatibles).
</ParamField>
<ParamField path="size" type="string">
  Indication de taille : `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>
<ParamField path="aspectRatio" type="string">
  Format d’image : `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`.
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>Indication de résolution.</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  Indication de qualité lorsque le fournisseur la prend en charge.
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  Indication de format de sortie lorsque le fournisseur la prend en charge.
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  Indication d’arrière-plan lorsque le fournisseur la prend en charge. Utilisez `transparent` avec
  `outputFormat: "png"` ou `"webp"` pour les fournisseurs compatibles avec la transparence.
</ParamField>
<ParamField path="count" type="number">Nombre d’images à générer (1 à 4).</ParamField>
<ParamField path="timeoutMs" type="number">Délai d’expiration facultatif de la requête fournisseur en millisecondes.</ParamField>
<ParamField path="filename" type="string">Indication de nom de fichier de sortie.</ParamField>
<ParamField path="openai" type="object">
  Indications propres à OpenAI : `background`, `moderation`, `outputCompression` et `user`.
</ParamField>

<Note>
Tous les fournisseurs ne prennent pas en charge tous les paramètres. Lorsqu’un fournisseur de secours prend en charge une
option de géométrie proche au lieu de celle demandée exactement, OpenClaw la remappe vers
la taille, le format d’image ou la résolution pris en charge les plus proches avant l’envoi.
Les indications de sortie non prises en charge sont supprimées pour les fournisseurs qui ne déclarent pas cette
prise en charge et sont signalées dans le résultat de l’outil. Les résultats de l’outil indiquent les paramètres
appliqués ; `details.normalization` capture toute traduction de la demande vers l’application.
</Note>

## Configuration

### Sélection du modèle

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        timeoutMs: 180_000,
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

OpenClaw essaie les fournisseurs dans cet ordre :

1. **Paramètre `model`** de l’appel d’outil (si l’agent en spécifie un).
2. **`imageGenerationModel.primary`** depuis la configuration.
3. **`imageGenerationModel.fallbacks`** dans l’ordre.
4. **Détection automatique** — uniquement les valeurs par défaut des fournisseurs adossés à une authentification :
   - fournisseur par défaut actuel en premier ;
   - autres fournisseurs de génération d’images enregistrés, dans l’ordre des identifiants de fournisseur.

Si un fournisseur échoue (erreur d’authentification, limite de débit, etc.), le prochain
candidat configuré est essayé automatiquement. Si tous échouent, l’erreur inclut les détails
de chaque tentative.

<AccordionGroup>
  <Accordion title="Les remplacements de modèle par appel sont exacts">
    Un remplacement `model` par appel essaie uniquement ce fournisseur/modèle et ne
    continue pas vers le fournisseur principal/de secours configuré ni vers les fournisseurs détectés automatiquement.
  </Accordion>
  <Accordion title="La détection automatique tient compte de l’authentification">
    Une valeur par défaut de fournisseur n’entre dans la liste des candidats que lorsqu’OpenClaw peut
    réellement authentifier ce fournisseur. Définissez
    `agents.defaults.mediaGenerationAutoProviderFallback: false` pour utiliser uniquement
    les entrées explicites `model`, `primary` et `fallbacks`.
  </Accordion>
  <Accordion title="Délais d’expiration">
    Définissez `agents.defaults.imageGenerationModel.timeoutMs` pour les backends d’images lents.
    Un paramètre d’outil `timeoutMs` par appel remplace la valeur par défaut configurée.
  </Accordion>
  <Accordion title="Inspecter à l’exécution">
    Utilisez `action: "list"` pour inspecter les fournisseurs actuellement enregistrés,
    leurs modèles par défaut et les indications de variables d’environnement d’authentification.
  </Accordion>
</AccordionGroup>

### Modification d’images

OpenAI, OpenRouter, Google, DeepInfra, fal, MiniMax, ComfyUI et xAI prennent en charge la modification
d’images de référence. Transmettez un chemin ou une URL d’image de référence :

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google et xAI prennent en charge jusqu’à 5 images de référence via le
paramètre `images`. fal, MiniMax et ComfyUI en prennent en charge 1.

## Présentations détaillées des fournisseurs

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (et gpt-image-1.5)">
    La génération d’images OpenAI utilise `openai/gpt-image-2` par défaut. Si un
    profil OAuth `openai-codex` est configuré, OpenClaw réutilise le même
    profil OAuth que celui utilisé par les modèles de chat d’abonnement Codex et envoie la
    requête d’image via le backend Codex Responses. Les anciennes URL de base Codex
    comme `https://chatgpt.com/backend-api` sont canonicalisées en
    `https://chatgpt.com/backend-api/codex` pour les requêtes d’images. OpenClaw
    ne se rabat **pas** silencieusement sur `OPENAI_API_KEY` pour cette requête —
    pour forcer le routage direct via l’API OpenAI Images, configurez
    explicitement `models.providers.openai` avec une clé API, une URL de base personnalisée
    ou un endpoint Azure.

    Les modèles `openai/gpt-image-1.5`, `openai/gpt-image-1` et
    `openai/gpt-image-1-mini` peuvent toujours être sélectionnés explicitement. Utilisez
    `gpt-image-1.5` pour produire des PNG/WebP avec arrière-plan transparent ; l’API
    actuelle `gpt-image-2` rejette `background: "transparent"`.

    `gpt-image-2` prend en charge à la fois la génération texte-vers-image et la
    modification d’images de référence via le même outil `image_generate`.
    OpenClaw transmet `prompt`, `count`, `size`, `quality`, `outputFormat`
    et les images de référence à OpenAI. OpenAI ne reçoit **pas**
    directement `aspectRatio` ni `resolution` ; lorsque c’est possible, OpenClaw
    les convertit en une valeur `size` prise en charge, sinon l’outil les signale comme
    remplacements ignorés.

    Les options propres à OpenAI se trouvent sous l’objet `openai` :

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

    `openai.background` accepte `transparent`, `opaque` ou `auto` ;
    les sorties transparentes nécessitent un `outputFormat` `png` ou `webp` et un
    modèle d’image OpenAI prenant en charge la transparence. OpenClaw route les requêtes
    avec arrière-plan transparent du modèle par défaut `gpt-image-2` vers `gpt-image-1.5`.
    `openai.outputCompression` s’applique aux sorties JPEG/WebP.

    L’indication de premier niveau `background` est neutre vis-à-vis du fournisseur et
    correspond actuellement au même champ de requête OpenAI `background` lorsque le fournisseur OpenAI
    est sélectionné. Les fournisseurs qui ne déclarent pas la prise en charge de l’arrière-plan la renvoient
    dans `ignoredOverrides` au lieu de recevoir le paramètre non pris en charge.

    Pour router la génération d’images OpenAI via un déploiement Azure OpenAI
    au lieu de `api.openai.com`, consultez
    [Endpoints Azure OpenAI](/fr/providers/openai#azure-openai-endpoints).

  </Accordion>
  <Accordion title="Modèles d’images OpenRouter">
    La génération d’images OpenRouter utilise le même `OPENROUTER_API_KEY` et
    passe par l’API d’images de complétions de chat d’OpenRouter. Sélectionnez
    les modèles d’images OpenRouter avec le préfixe `openrouter/` :

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

    OpenClaw transmet `prompt`, `count`, les images de référence et les
    indications `aspectRatio` / `resolution` compatibles avec Gemini à OpenRouter.
    Les raccourcis de modèles d’images OpenRouter intégrés actuels incluent
    `google/gemini-3.1-flash-image-preview`,
    `google/gemini-3-pro-image-preview` et `openai/gpt-5.4-image-2`. Utilisez
    `action: "list"` pour voir ce que votre Plugin configuré expose.

  </Accordion>
  <Accordion title="Double authentification MiniMax">
    La génération d’images MiniMax est disponible via les deux chemins d’authentification MiniMax
    intégrés :

    - `minimax/image-01` pour les configurations avec clé API
    - `minimax-portal/image-01` pour les configurations OAuth

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    Le fournisseur xAI intégré utilise `/v1/images/generations` pour les requêtes
    avec prompt uniquement et `/v1/images/edits` lorsque `image` ou `images` est présent.

    - Modèles : `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
    - Nombre : jusqu’à 4
    - Références : une `image` ou jusqu’à cinq `images`
    - Formats d’image : `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Résolutions : `1K`, `2K`
    - Sorties : renvoyées comme pièces jointes d’image gérées par OpenClaw

    OpenClaw n’expose volontairement pas `quality`, `mask`,
    `user` ou les formats d’image supplémentaires propres à xAI tant que ces contrôles n’existent pas
    dans le contrat `image_generate` partagé entre fournisseurs.

  </Accordion>
</AccordionGroup>

## Exemples

<Tabs>
  <Tab title="Générer (paysage 4K)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```
  </Tab>
  <Tab title="Générer (PNG transparent)">
```text
/tool image_generate action=generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

CLI équivalente :

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

  </Tab>
  <Tab title="Générer (deux carrés)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```
  </Tab>
  <Tab title="Modifier (une référence)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="Modifier (plusieurs références)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
</Tabs>

Les mêmes options `--output-format` et `--background` sont disponibles sur
`openclaw infer image edit` ; `--openai-background` reste un alias
propre à OpenAI. Les fournisseurs intégrés autres qu’OpenAI ne déclarent pas
aujourd’hui de contrôle explicite de l’arrière-plan, donc `background: "transparent"` est signalé
comme ignoré pour eux.

## Connexe

- [Vue d’ensemble des outils](/fr/tools) — tous les outils d’agent disponibles
- [ComfyUI](/fr/providers/comfy) — configuration des workflows ComfyUI local et Comfy Cloud
- [fal](/fr/providers/fal) — configuration du fournisseur d’images et de vidéos fal
- [Google (Gemini)](/fr/providers/google) — configuration du fournisseur d’images Gemini
- [MiniMax](/fr/providers/minimax) — configuration du fournisseur d’images MiniMax
- [OpenAI](/fr/providers/openai) — configuration du fournisseur OpenAI Images
- [Vydra](/fr/providers/vydra) — configuration de Vydra pour l’image, la vidéo et la parole
- [xAI](/fr/providers/xai) — configuration de Grok pour l’image, la vidéo, la recherche, l’exécution de code et le TTS
- [Référence de configuration](/fr/gateway/config-agents#agent-defaults) — configuration `imageGenerationModel`
- [Modèles](/fr/concepts/models) — configuration des modèles et basculement
