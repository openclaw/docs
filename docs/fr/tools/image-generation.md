---
read_when:
    - Générer ou modifier des images via l’agent
    - Configuration des fournisseurs et modèles de génération d’images
    - Comprendre les paramètres de l’outil image_generate
sidebarTitle: Image generation
summary: Générez et modifiez des images via image_generate avec OpenAI, Google, fal, Microsoft Foundry, MiniMax, ComfyUI, DeepInfra, OpenRouter, LiteLLM, xAI, Vydra
title: Génération d’images
x-i18n:
    generated_at: "2026-06-27T18:19:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df8187d3798925cf33ba243ee92c5c402eb4ba754b0c24521e965b60a0add947
    source_path: tools/image-generation.md
    workflow: 16
---

L’outil `image_generate` permet à l’agent de créer et de modifier des images à l’aide de vos
fournisseurs configurés. Dans les sessions de chat, la génération d’images s’exécute de façon asynchrone :
OpenClaw enregistre une tâche en arrière-plan, renvoie immédiatement l’id de tâche et réveille
l’agent lorsque le fournisseur termine. L’agent de complétion suit le mode normal de réponse visible de la
session : livraison automatique de la réponse finale lorsqu’elle est
configurée, ou `message(action="send")` lorsque la session exige l’outil
message. Si la session demandeuse est inactive ou si son réveil actif échoue, et que certaines
images générées sont toujours absentes de la réponse de complétion, OpenClaw envoie un
secours direct idempotent avec uniquement les images manquantes.

<Note>
L’outil n’apparaît que lorsqu’au moins un fournisseur de génération d’images est
disponible. Si vous ne voyez pas `image_generate` dans les outils de votre agent,
configurez `agents.defaults.imageGenerationModel`, ajoutez une clé API de fournisseur,
ou connectez-vous avec OpenAI ChatGPT/Codex OAuth.
</Note>

## Démarrage rapide

<Steps>
  <Step title="Configurer l’authentification">
    Définissez une clé API pour au moins un fournisseur (par exemple `OPENAI_API_KEY`,
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

    ChatGPT/Codex OAuth utilise la même référence de modèle `openai/gpt-image-2`. Lorsqu’un
    profil OAuth `openai` est configuré, OpenClaw achemine les requêtes d’images
    via ce profil OAuth au lieu d’essayer d’abord
    `OPENAI_API_KEY`. Une configuration explicite `models.providers.openai` (clé API,
    URL de base personnalisée/Azure) réactive la route directe de l’API OpenAI Images.

  </Step>
  <Step title="Demander à l’agent">
    _« Génère une image d’une mascotte robot amicale. »_

    L’agent appelle automatiquement `image_generate`. Aucune liste d’autorisation d’outils
    n’est nécessaire : il est activé par défaut lorsqu’un fournisseur est disponible. L’outil
    renvoie un id de tâche en arrière-plan, puis l’agent de complétion envoie la pièce jointe
    générée via l’outil `message` lorsqu’elle est prête.

  </Step>
</Steps>

<Warning>
Pour les points de terminaison LAN compatibles OpenAI tels que LocalAI, conservez l’URL personnalisée
`models.providers.openai.baseUrl` et activez-la explicitement avec
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`. Les points de terminaison d’images privés et
internes restent bloqués par défaut.
</Warning>

## Routes courantes

| Objectif                                             | Réf. de modèle                                    | Authentification                       |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| Génération d’images OpenAI avec facturation API      | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| Génération d’images OpenAI avec auth d’abonnement Codex | `openai/gpt-image-2`                            | OpenAI ChatGPT/Codex OAuth             |
| PNG/WebP OpenAI à arrière-plan transparent           | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` ou OpenAI Codex OAuth |
| Génération d’images DeepInfra                        | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| Génération expressive/orientée style fal Krea 2      | `fal/krea/v2/medium/text-to-image`                 | `FAL_KEY`                              |
| Génération d’images OpenRouter                       | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| Génération d’images LiteLLM                          | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| Génération d’images Microsoft Foundry MAI            | `microsoft-foundry/<deployment-name>`              | `AZURE_OPENAI_API_KEY` ou Entra ID     |
| Génération d’images Google Gemini                    | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` ou `GOOGLE_API_KEY`   |

Le même outil `image_generate` gère la conversion texte-image et la modification avec image de
référence. Utilisez `image` pour une référence ou `images` pour plusieurs références.
Pour les modèles Krea 2 sur fal, ces références sont envoyées comme références de style
au lieu d’entrées de modification.
Les indications de sortie prises en charge par le fournisseur, telles que `quality`, `outputFormat` et
`background`, sont transmises lorsqu’elles sont disponibles et signalées comme ignorées lorsqu’un
fournisseur ne les prend pas en charge. La prise en charge intégrée des arrière-plans transparents est
spécifique à OpenAI ; d’autres fournisseurs peuvent néanmoins préserver l’alpha PNG si leur
backend l’émet.

## Fournisseurs pris en charge

| Fournisseur       | Modèle par défaut                       | Prise en charge de la modification | Authentification                                      |
| ----------------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI           | `workflow`                              | Oui (1 image, configurée par le workflow) | `COMFY_API_KEY` ou `COMFY_CLOUD_API_KEY` pour le cloud |
| DeepInfra         | `black-forest-labs/FLUX-1-schnell`      | Oui (1 image)                      | `DEEPINFRA_API_KEY`                                   |
| fal               | `fal-ai/flux/dev`                       | Oui (limites propres au modèle)    | `FAL_KEY`                                             |
| Google            | `gemini-3.1-flash-image-preview`        | Oui                                | `GEMINI_API_KEY` ou `GOOGLE_API_KEY`                  |
| LiteLLM           | `gpt-image-2`                           | Oui (jusqu’à 5 images d’entrée)    | `LITELLM_API_KEY`                                     |
| Microsoft Foundry | `<deployment-name>`                     | Oui (modèles MAI-Image-2.5 uniquement) | `AZURE_OPENAI_API_KEY` ou Entra ID (`az login`)       |
| MiniMax           | `image-01`                              | Oui (référence de sujet)           | `MINIMAX_API_KEY` ou MiniMax OAuth (`minimax-portal`) |
| OpenAI            | `gpt-image-2`                           | Oui (jusqu’à 4 images)             | `OPENAI_API_KEY` ou OpenAI ChatGPT/Codex OAuth        |
| OpenRouter        | `google/gemini-3.1-flash-image-preview` | Oui (jusqu’à 5 images d’entrée)    | `OPENROUTER_API_KEY`                                  |
| Vydra             | `grok-imagine`                          | Non                                | `VYDRA_API_KEY`                                       |
| xAI               | `grok-imagine-image`                    | Oui (jusqu’à 5 images)             | `XAI_API_KEY`                                         |

Utilisez `action: "list"` pour inspecter les fournisseurs et modèles disponibles à l’exécution :

```text
/tool image_generate action=list
```

Utilisez `action: "status"` pour inspecter la tâche de génération d’images active pour la
session actuelle :

```text
/tool image_generate action=status
```

## Capacités des fournisseurs

| Capacité              | ComfyUI            | DeepInfra | fal                                            | Google         | Microsoft Foundry | MiniMax               | OpenAI         | Vydra | xAI            |
| --------------------- | ------------------ | --------- | ---------------------------------------------- | -------------- | ----------------- | --------------------- | -------------- | ----- | -------------- |
| Générer (nombre max.) | Défini par le workflow | 4      | 4                                              | 4              | 1                 | 9                     | 4              | 1     | 4              |
| Modifier / référence  | 1 image (workflow) | 1 image   | Flux : 1 ; GPT : 10 ; réf. de style Krea : 10 ; NB2 : 14 | Jusqu’à 5 images | 1 image        | 1 image (réf. de sujet) | Jusqu’à 5 images | -   | Jusqu’à 5 images |
| Contrôle de taille    | -                  | ✓         | ✓                                              | ✓              | ✓                 | -                     | Jusqu’à 4K     | -     | -              |
| Format d’image        | -                  | -         | ✓                                              | ✓              | -                 | ✓                     | -              | -     | ✓              |
| Résolution (1K/2K/4K) | -                  | -         | ✓                                              | ✓              | -                 | -                     | -              | -     | 1K, 2K         |

## Paramètres de l’outil

<ParamField path="prompt" type="string" required>
  Prompt de génération d’image. Requis pour `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  Utilisez `"status"` pour inspecter la tâche de session active ou `"list"` pour inspecter
  les fournisseurs et modèles disponibles à l’exécution.
</ParamField>
<ParamField path="model" type="string">
  Remplacement de fournisseur/modèle (par ex. `openai/gpt-image-2`). Utilisez
  `openai/gpt-image-1.5` pour les arrière-plans OpenAI transparents.
</ParamField>
<ParamField path="image" type="string">
  Chemin ou URL d’image de référence unique pour le mode modification.
</ParamField>
<ParamField path="images" type="string[]">
  Plusieurs images de référence pour le mode modification ou les modèles à références de style (jusqu’à 10
  via l’outil partagé ; les limites propres au fournisseur s’appliquent toujours).
</ParamField>
<ParamField path="size" type="string">
  Indication de taille : `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>
<ParamField path="aspectRatio" type="string">
  Format d’image : `1:1`, `2:3`, `3:2`, `2.35:1`, `3:4`, `4:3`, `4:5`,
  `5:4`, `9:16`, `16:9`, `21:9`, `4:1`, `1:4`, `8:1`, `1:8`. Les fournisseurs
  valident leur sous-ensemble propre au modèle.
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>Indication de résolution.</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  Indication de qualité lorsque le fournisseur la prend en charge.
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  Indication de format de sortie lorsque le fournisseur le prend en charge.
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  Indication d’arrière-plan lorsque le fournisseur la prend en charge. Utilisez `transparent` avec
  `outputFormat: "png"` ou `"webp"` pour les fournisseurs compatibles avec la transparence.
</ParamField>
<ParamField path="count" type="number">Nombre d’images à générer (1-4).</ParamField>
<ParamField path="timeoutMs" type="number">
  Délai d’expiration facultatif de la requête fournisseur, en millisecondes. Lorsque Codex appelle
  `image_generate` via des outils dynamiques, cette valeur par appel remplace toujours
  la valeur par défaut configurée et est plafonnée à 600000 ms.
</ParamField>
<ParamField path="filename" type="string">Indication de nom de fichier de sortie.</ParamField>
<ParamField path="openai" type="object">
  Indications propres à OpenAI : `background`, `moderation`, `outputCompression` et `user`.
</ParamField>
<ParamField path="fal.creativity" type='"raw" | "low" | "medium" | "high"'>
  Contrôle de créativité fal Krea 2. La valeur par défaut est `medium`.
</ParamField>

<Note>
Tous les fournisseurs ne prennent pas en charge tous les paramètres. Lorsqu’un fournisseur de repli prend en charge une
option géométrique proche au lieu de celle demandée exactement, OpenClaw remappe vers
la taille, le format d’image ou la résolution pris en charge les plus proches avant l’envoi.
Les indications de sortie non prises en charge sont abandonnées pour les fournisseurs qui ne déclarent pas leur
prise en charge et sont signalées dans le résultat de l’outil. Les résultats de l’outil indiquent les
paramètres appliqués ; `details.normalization` capture toute
traduction de la demande vers l’application.
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

1. **Paramètre `model`** issu de l’appel d’outil (si l’agent en spécifie un).
2. **`imageGenerationModel.primary`** depuis la configuration.
3. **`imageGenerationModel.fallbacks`** dans l’ordre.
4. **Détection automatique** - valeurs par défaut des fournisseurs appuyées par l’authentification uniquement :
   - fournisseur par défaut actuel en premier ;
   - autres fournisseurs de génération d’images enregistrés, dans l’ordre des identifiants de fournisseur.

Si un fournisseur échoue (erreur d’authentification, limite de débit, etc.), le
candidat configuré suivant est essayé automatiquement. Si tous échouent,
l’erreur inclut les détails de chaque tentative.

<AccordionGroup>
  <Accordion title="Les remplacements de modèle par appel sont exacts">
    Un remplacement `model` par appel essaie uniquement ce fournisseur/modèle et
    ne continue pas vers le fournisseur principal/de secours configuré ni vers
    les fournisseurs détectés automatiquement.
  </Accordion>
  <Accordion title="La détection automatique tient compte de l’authentification">
    Une valeur par défaut de fournisseur n’entre dans la liste des candidats que
    lorsque OpenClaw peut réellement authentifier ce fournisseur. Définissez
    `agents.defaults.mediaGenerationAutoProviderFallback: false` pour utiliser
    uniquement les entrées explicites `model`, `primary` et `fallbacks`.
  </Accordion>
  <Accordion title="Délais d’expiration">
    Définissez `agents.defaults.imageGenerationModel.timeoutMs` pour les
    backends d’image lents. Un paramètre d’outil `timeoutMs` par appel remplace
    la valeur par défaut configurée, et les valeurs par défaut configurées
    remplacent les valeurs par défaut de fournisseur définies par le Plugin.
    Les fournisseurs d’images hébergés par Google et OpenRouter utilisent des
    valeurs par défaut de 180 secondes ; la génération d’images Microsoft
    Foundry MAI, xAI et Azure OpenAI utilise 600 secondes. Les appels d’outils
    dynamiques Codex utilisent une valeur par défaut de passerelle
    `image_generate` de 120 secondes et respectent le même budget de délai
    d’expiration lorsqu’il est configuré, borné par le maximum de 600000 ms de
    la passerelle d’outils dynamiques d’OpenClaw.
  </Accordion>
  <Accordion title="Inspecter à l’exécution">
    Utilisez `action: "list"` pour inspecter les fournisseurs actuellement
    enregistrés, leurs modèles par défaut et les indications de variables
    d’environnement d’authentification.
  </Accordion>
</AccordionGroup>

### Modification d’images

OpenAI, OpenRouter, Google, DeepInfra, fal, Microsoft Foundry, MiniMax,
ComfyUI et xAI prennent en charge la modification d’images de référence. Les
modèles Krea 2 sur fal utilisent les mêmes champs `image` / `images` comme
références de style au lieu d’entrées de modification. Transmettez un chemin ou
une URL d’image de référence :

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google et xAI prennent en charge jusqu’à 5 images de
référence via le paramètre `images`. fal prend en charge 1 image de référence
pour Flux image-to-image, jusqu’à 10 pour les modifications GPT Image 2,
jusqu’à 10 références de style pour Krea 2 et jusqu’à 14 pour les modifications
Nano Banana 2. Microsoft Foundry, MiniMax et ComfyUI en prennent en charge 1.

## Analyses approfondies des fournisseurs

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (et gpt-image-1.5)">
    La génération d’images OpenAI utilise par défaut `openai/gpt-image-2`. Si
    un profil OAuth `openai` est configuré, OpenClaw réutilise le même profil
    OAuth que celui utilisé par les modèles de chat par abonnement Codex et
    envoie la requête d’image via le backend Codex Responses. Les anciennes URL
    de base Codex comme `https://chatgpt.com/backend-api` sont canonisées en
    `https://chatgpt.com/backend-api/codex` pour les requêtes d’image.
    OpenClaw ne bascule **pas** silencieusement vers `OPENAI_API_KEY` pour
    cette requête - pour forcer un routage direct par l’API OpenAI Images,
    configurez explicitement `models.providers.openai` avec une clé d’API, une
    URL de base personnalisée ou un endpoint Azure.

    Les modèles `openai/gpt-image-1.5`, `openai/gpt-image-1` et
    `openai/gpt-image-1-mini` peuvent toujours être sélectionnés explicitement.
    Utilisez `gpt-image-1.5` pour une sortie PNG/WebP à arrière-plan
    transparent ; l’API actuelle `gpt-image-2` rejette
    `background: "transparent"`.

    `gpt-image-2` prend en charge à la fois la génération texte-vers-image et
    la modification d’images de référence via le même outil `image_generate`.
    OpenClaw transmet `prompt`, `count`, `size`, `quality`, `outputFormat` et
    les images de référence à OpenAI. OpenAI ne reçoit **pas** directement
    `aspectRatio` ni `resolution` ; lorsque c’est possible, OpenClaw les mappe
    vers un `size` pris en charge, sinon l’outil les signale comme remplacements
    ignorés.

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

    `openai.background` accepte `transparent`, `opaque` ou `auto` ; les sorties
    transparentes nécessitent `outputFormat` `png` ou `webp` et un modèle
    d’image OpenAI compatible avec la transparence. OpenClaw route les requêtes
    à arrière-plan transparent `gpt-image-2` par défaut vers `gpt-image-1.5`.
    `openai.outputCompression` s’applique aux sorties JPEG/WebP et est ignoré
    pour les sorties PNG.

    L’indication de premier niveau `background` est neutre vis-à-vis du
    fournisseur et correspond actuellement au même champ de requête OpenAI
    `background` lorsque le fournisseur OpenAI est sélectionné. Les fournisseurs
    qui ne déclarent pas la prise en charge de l’arrière-plan la renvoient dans
    `ignoredOverrides` au lieu de recevoir le paramètre non pris en charge.

    Pour router la génération d’images OpenAI via un déploiement Azure OpenAI
    au lieu de `api.openai.com`, consultez
    [endpoints Azure OpenAI](/fr/providers/openai#azure-openai-endpoints).

  </Accordion>
  <Accordion title="Modèles d’image Microsoft Foundry MAI">
    La génération d’images Microsoft Foundry utilise les noms de déploiement
    d’images MAI déployées sous le préfixe de fournisseur
    `microsoft-foundry/`. Il n’y a pas de modèle par défaut au niveau du
    fournisseur, car l’API MAI attend le nom de votre déploiement dans le champ
    `model` :

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "microsoft-foundry/<deployment-name>",
            timeoutMs: 600_000,
          },
        },
      },
    }
    ```

    Le fournisseur utilise l’API MAI de Microsoft Foundry, et non l’API OpenAI Images :

    - Endpoint de génération : `/mai/v1/images/generations`
    - Endpoint de modification : `/mai/v1/images/edits`
    - Authentification : `AZURE_OPENAI_API_KEY` / clé d’API du fournisseur, ou Entra ID via `az login`
    - Sortie : une image PNG
    - Taille : `1024x1024` par défaut ; la largeur et la hauteur doivent chacune
      être d’au moins 768 px, et le nombre total de pixels doit être au plus
      1 048 576
    - Modifications : une image de référence PNG ou JPEG, prise en charge
      uniquement par les déploiements `MAI-Image-2.5-Flash` et `MAI-Image-2.5`

    La génération basée uniquement sur un prompt peut utiliser un nom de
    déploiement personnalisé avec seulement l’endpoint Foundry configuré. Les
    modifications avec des noms de déploiement personnalisés nécessitent des
    métadonnées d’intégration/modèle afin qu’OpenClaw puisse vérifier que le
    déploiement repose sur `MAI-Image-2.5-Flash` ou `MAI-Image-2.5`.

    Les modèles d’image MAI actuels sont `MAI-Image-2.5-Flash`,
    `MAI-Image-2.5`, `MAI-Image-2e` et `MAI-Image-2`. Consultez le
    [Plugin Microsoft Foundry](/fr/plugins/reference/microsoft-foundry) pour la
    configuration et le comportement des modèles de chat.

  </Accordion>
  <Accordion title="Modèles d’image OpenRouter">
    La génération d’images OpenRouter utilise la même `OPENROUTER_API_KEY` et
    passe par l’API d’image des complétions de chat d’OpenRouter. Sélectionnez
    les modèles d’image OpenRouter avec le préfixe `openrouter/` :

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
    indications `aspectRatio` / `resolution` compatibles avec Gemini à
    OpenRouter. Les raccourcis intégrés actuels de modèles d’image OpenRouter
    incluent `google/gemini-3.1-flash-image-preview`,
    `google/gemini-3-pro-image-preview` et `openai/gpt-5.4-image-2`. Utilisez
    `action: "list"` pour voir ce que votre Plugin configuré expose.

  </Accordion>
  <Accordion title="fal Krea 2">
    Les modèles Krea 2 sur fal utilisent le schéma Krea natif de fal au lieu du
    schéma générique `image_size` utilisé par Flux. OpenClaw envoie :

    - `aspect_ratio` pour les indications de proportions
    - `creativity`, avec `medium` par défaut
    - `image_style_references` lorsque `image` ou `images` sont fournis

    Sélectionnez Krea 2 Medium pour une illustration expressive plus rapide et
    Krea 2 Large pour des rendus photoréalistes et texturés plus lents et plus
    détaillés :

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

    Krea 2 renvoie actuellement une image par requête. Préférez `aspectRatio`
    pour Krea ; OpenClaw mappe `size` vers la proportion Krea prise en charge la
    plus proche et rejette `resolution` pour Krea au lieu de l’abandonner.
    Utilisez `fal.creativity` lorsque vous voulez un niveau de créativité Krea
    natif :

    ```json
    {
      "model": "fal/krea/v2/medium/text-to-image",
      "prompt": "A cyber zine portrait with risograph texture",
      "aspectRatio": "9:16",
      "fal": {
        "creativity": "high"
      }
    }
    ```

  </Accordion>
  <Accordion title="Double authentification MiniMax">
    La génération d’images MiniMax est disponible via les deux chemins
    d’authentification MiniMax groupés :

    - `minimax/image-01` pour les configurations par clé d’API
    - `minimax-portal/image-01` pour les configurations OAuth

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    Le fournisseur xAI groupé utilise `/v1/images/generations` pour les
    requêtes basées uniquement sur un prompt et `/v1/images/edits` lorsque
    `image` ou `images` est présent.

    - Modèles : `xai/grok-imagine-image`, `xai/grok-imagine-image-quality`
    - Nombre : jusqu’à 4
    - Références : une `image` ou jusqu’à cinq `images`
    - Proportions : `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Résolutions : `1K`, `2K`
    - Sorties : renvoyées comme pièces jointes d’image gérées par OpenClaw

    OpenClaw n’expose intentionnellement pas les options natives xAI `quality`,
    `mask`, `user` ni les proportions supplémentaires uniquement natives tant
    que ces contrôles n’existent pas dans le contrat partagé inter-fournisseurs
    `image_generate`.

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
  <Tab title="Générer (basse qualité OpenAI)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Low-cost draft poster for a quiet productivity app" quality=low openai='{"moderation":"low"}'
```

CLI équivalente :

```bash
openclaw infer image generate \
  --model openai/gpt-image-2 \
  --quality low \
  --openai-moderation low \
  --prompt "Low-cost draft poster for a quiet productivity app" \
  --json
```

  </Tab>
  <Tab title="Generate (two square)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```
  </Tab>
  <Tab title="Edit (one reference)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="Edit (multiple references)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
  <Tab title="Krea style references">
```text
/tool image_generate action=generate model=fal/krea/v2/medium/text-to-image prompt="An expressive editorial portrait using this color palette and print texture" images='["/path/to/palette.png","/path/to/texture.jpg"]' aspectRatio=9:16 fal='{"creativity":"high"}'
```
  </Tab>
</Tabs>

Les mêmes options `--output-format`, `--background`, `--quality` et
`--openai-moderation` sont disponibles sur `openclaw infer image edit` ;
`--openai-background` reste un alias propre à OpenAI. Les fournisseurs intégrés
autres qu’OpenAI ne déclarent pas aujourd’hui de contrôle explicite de l’arrière-plan ; ainsi,
`background: "transparent"` est signalé comme ignoré pour eux.

## Articles connexes

- [Vue d’ensemble des outils](/fr/tools) - tous les outils d’agent disponibles
- [ComfyUI](/fr/providers/comfy) - configuration des workflows ComfyUI local et Comfy Cloud
- [fal](/fr/providers/fal) - configuration du fournisseur d’images et de vidéos fal
- [Google (Gemini)](/fr/providers/google) - configuration du fournisseur d’images Gemini
- [Plugin Microsoft Foundry](/fr/plugins/reference/microsoft-foundry) - configuration du chat Microsoft Foundry et des images MAI
- [MiniMax](/fr/providers/minimax) - configuration du fournisseur d’images MiniMax
- [OpenAI](/fr/providers/openai) - configuration du fournisseur OpenAI Images
- [Vydra](/fr/providers/vydra) - configuration des images, vidéos et de la parole Vydra
- [xAI](/fr/providers/xai) - configuration des images, vidéos, de la recherche, de l’exécution de code et de la TTS Grok
- [Référence de configuration](/fr/gateway/config-agents#agent-defaults) - configuration `imageGenerationModel`
- [Modèles](/fr/concepts/models) - configuration des modèles et basculement
