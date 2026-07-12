---
read_when:
    - Génération ou modification d’images via l’agent
    - Configuration des fournisseurs et des modèles de génération d’images
    - Comprendre les paramètres de l’outil image_generate
sidebarTitle: Image generation
summary: Générez et modifiez des images avec image_generate via OpenAI, Google, fal, Microsoft Foundry, MiniMax, ComfyUI, DeepInfra, OpenRouter, LiteLLM, xAI et Vydra
title: Génération d’images
x-i18n:
    generated_at: "2026-07-12T03:24:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 56d4c9efada07c64fc6aaa92510bf8cad982c098f62d7a71bfdf093cf434c4bc
    source_path: tools/image-generation.md
    workflow: 16
---

L’outil `image_generate` crée et modifie des images par l’intermédiaire des
fournisseurs configurés. Dans les sessions de conversation, il s’exécute de
manière asynchrone : OpenClaw enregistre une tâche en arrière-plan, renvoie
immédiatement l’identifiant de la tâche et réveille l’agent lorsque le
fournisseur a terminé. L’agent d’achèvement suit le mode normal de réponse
visible de la session : envoi automatique de la réponse finale lorsqu’il est
configuré, ou `message(action="send")` lorsque la session exige l’outil de
messagerie. Si la session du demandeur est inactive ou si son réveil actif
échoue, OpenClaw envoie directement une solution de repli idempotente avec les
images générées afin que le résultat ne soit pas perdu.

<Note>
L’outil apparaît uniquement lorsqu’au moins un fournisseur de génération
d’images est disponible. Si `image_generate` ne figure pas parmi les outils de
votre agent, configurez `agents.defaults.imageGenerationModel`, définissez une
clé d’API de fournisseur ou connectez-vous avec OAuth OpenAI ChatGPT/Codex.
</Note>

## Démarrage rapide

<Steps>
  <Step title="Configurer l’authentification">
    Définissez une clé d’API pour au moins un fournisseur (par exemple
    `OPENAI_API_KEY`, `GEMINI_API_KEY`, `OPENROUTER_API_KEY`) ou connectez-vous
    avec OAuth OpenAI Codex.
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

    OAuth ChatGPT/Codex utilise la même référence de modèle
    `openai/gpt-image-2`. Lorsqu’un profil OAuth `openai` est configuré,
    OpenClaw achemine les requêtes d’images par ce profil OAuth au lieu
    d’essayer d’abord `OPENAI_API_KEY`. Une configuration explicite de
    `models.providers.openai` (clé d’API, URL de base personnalisée/Azure)
    réactive l’acheminement direct par l’API OpenAI Images.

  </Step>
  <Step title="Interroger l’agent">
    _« Générez une image représentant une sympathique mascotte robot. »_

    L’agent appelle automatiquement `image_generate`. Aucune liste
    d’autorisation d’outils n’est nécessaire : il est activé par défaut
    lorsqu’un fournisseur est disponible. L’outil renvoie l’identifiant d’une
    tâche en arrière-plan, puis l’agent d’achèvement envoie la pièce jointe
    générée au moyen de l’outil `message` lorsqu’elle est prête.

  </Step>
</Steps>

<Warning>
Pour les points de terminaison de réseau local compatibles avec OpenAI, tels
que LocalAI, conservez la valeur personnalisée de
`models.providers.openai.baseUrl` et activez-la explicitement avec
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`. Les points de
terminaison d’images privés et internes restent bloqués par défaut.
</Warning>

## Acheminements courants

| Objectif                                                       | Référence du modèle                                 | Authentification                        |
| -------------------------------------------------------------- | --------------------------------------------------- | --------------------------------------- |
| Génération d’images OpenAI avec facturation par API            | `openai/gpt-image-2`                                | `OPENAI_API_KEY`                        |
| Génération d’images OpenAI avec l’authentification d’abonnement Codex | `openai/gpt-image-2`                          | OAuth OpenAI ChatGPT/Codex              |
| PNG/WebP OpenAI à arrière-plan transparent                     | `openai/gpt-image-1.5`                              | `OPENAI_API_KEY` ou OAuth OpenAI Codex  |
| Génération d’images DeepInfra                                  | `deepinfra/black-forest-labs/FLUX-1-schnell`        | `DEEPINFRA_API_KEY`                     |
| Génération expressive/orientée par le style avec fal Krea 2    | `fal/krea/v2/medium/text-to-image`                  | `FAL_KEY`                               |
| Génération d’images OpenRouter                                 | `openrouter/google/gemini-3.1-flash-image-preview`  | `OPENROUTER_API_KEY`                    |
| Génération d’images LiteLLM                                    | `litellm/gpt-image-2`                               | `LITELLM_API_KEY`                       |
| Génération d’images Microsoft Foundry MAI                      | `microsoft-foundry/<deployment-name>`               | `AZURE_OPENAI_API_KEY` ou Entra ID      |
| Génération d’images Google Gemini                              | `google/gemini-3.1-flash-image-preview`             | `GEMINI_API_KEY` ou `GOOGLE_API_KEY`    |

Le même outil gère la génération de texte en image et la modification à partir
d’images de référence. Utilisez `image` pour une seule référence ou `images`
pour plusieurs. Pour les modèles Krea 2 sur fal, ces références sont envoyées
comme références de style plutôt que comme entrées à modifier. Les indications
de sortie prises en charge par le fournisseur, telles que `quality`,
`outputFormat` et `background`, sont transmises lorsqu’elles sont disponibles
et signalées comme ignorées lorsqu’un fournisseur ne déclare pas les prendre
en charge. La prise en charge intégrée des arrière-plans transparents est
propre à OpenAI ; les autres fournisseurs peuvent néanmoins préserver le canal
alpha PNG si leur moteur le produit.

## Fournisseurs pris en charge

| Fournisseur       | Modèle par défaut                        | Prise en charge de la modification                  | Authentification                                      |
| ----------------- | ---------------------------------------- | --------------------------------------------------- | ----------------------------------------------------- |
| ComfyUI           | `workflow`                               | Oui (1 image, configurée par le flux de travail)    | `COMFY_API_KEY` ou `COMFY_CLOUD_API_KEY` pour le cloud |
| DeepInfra         | `black-forest-labs/FLUX-1-schnell`       | Oui (1 image)                                       | `DEEPINFRA_API_KEY`                                   |
| fal               | `fal-ai/flux/dev`                        | Oui (limites propres au modèle)                     | `FAL_KEY`                                             |
| Google            | `gemini-3.1-flash-image-preview`         | Oui (jusqu’à 5 images)                              | `GEMINI_API_KEY` ou `GOOGLE_API_KEY`                  |
| LiteLLM           | `gpt-image-2`                            | Oui (jusqu’à 5 images d’entrée)                     | `LITELLM_API_KEY`                                     |
| Microsoft Foundry | `<deployment-name>`                      | Oui (modèles MAI-Image-2.5 uniquement)              | `AZURE_OPENAI_API_KEY` ou Entra ID (`az login`)       |
| MiniMax           | `image-01`                               | Oui (référence du sujet)                            | `MINIMAX_API_KEY` ou OAuth MiniMax (`minimax-portal`) |
| OpenAI            | `gpt-image-2`                            | Oui (jusqu’à 5 images)                              | `OPENAI_API_KEY` ou OAuth OpenAI ChatGPT/Codex        |
| OpenRouter        | `google/gemini-3.1-flash-image-preview`  | Oui (jusqu’à 5 images d’entrée)                     | `OPENROUTER_API_KEY`                                  |
| Vydra             | `grok-imagine`                           | Non                                                 | `VYDRA_API_KEY`                                       |
| xAI               | `grok-imagine-image`                     | Oui (jusqu’à 3 images)                              | `XAI_API_KEY`                                         |

Utilisez `action: "list"` pour examiner les fournisseurs et les modèles
disponibles lors de l’exécution :

```text
/tool image_generate action=list
```

Utilisez `action: "status"` pour examiner la tâche active de génération
d’images de la session actuelle :

```text
/tool image_generate action=status
```

## Capacités des fournisseurs

| Capacité                         | ComfyUI                    | DeepInfra | fal                                                    | Google             | Microsoft Foundry | MiniMax                       | OpenAI             | Vydra | xAI                |
| -------------------------------- | -------------------------- | --------- | ------------------------------------------------------ | ------------------ | ----------------- | ----------------------------- | ------------------ | ----- | ------------------ |
| Génération (nombre maximal)      | 1                          | 4         | 4                                                      | 4                  | 1                 | 9                             | 4                  | 1     | 4                  |
| Modification / référence         | 1 image (flux de travail)  | 1 image   | Flux : 1 ; GPT : 10 ; références de style Krea : 10 ; NB2 : 14 | Jusqu’à 5 images | 1 image           | 1 image (réf. du sujet)       | Jusqu’à 5 images   | -     | Jusqu’à 3 images   |
| Contrôle de la taille            | -                          | ✓         | ✓                                                      | ✓                  | ✓                 | -                             | Jusqu’à 4K         | -     | -                  |
| Rapport d’aspect                 | -                          | -         | ✓                                                      | ✓                  | -                 | ✓                             | -                  | -     | ✓                  |
| Résolution (1K/2K/4K)            | -                          | -         | ✓                                                      | ✓                  | -                 | -                             | -                  | -     | 1K, 2K             |

## Paramètres de l’outil

<ParamField path="prompt" type="string" required>
  Invite de génération d’image. Requise pour `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  Utilisez `"status"` pour examiner la tâche active de la session ou `"list"`
  pour examiner les fournisseurs et les modèles disponibles lors de
  l’exécution.
</ParamField>
<ParamField path="model" type="string">
  Remplacement du fournisseur/modèle (par exemple `openai/gpt-image-2`).
  Utilisez `openai/gpt-image-1.5` pour les arrière-plans OpenAI transparents.
</ParamField>
<ParamField path="image" type="string">
  Chemin ou URL d’une seule image de référence pour le mode de modification.
</ParamField>
<ParamField path="images" type="string[]">
  Plusieurs images de référence pour le mode de modification ou les modèles
  utilisant des références de style (jusqu’à 14 par l’intermédiaire de l’outil
  partagé ; les limites propres au fournisseur continuent de s’appliquer).
</ParamField>
<ParamField path="size" type="string">
  Indication de taille : `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`,
  `3840x2160`.
</ParamField>
<ParamField path="aspectRatio" type="string">
  Rapport d’aspect : `1:1`, `2:1`, `20:9`, `19.5:9`, `2:3`, `3:2`, `2.35:1`,
  `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `9:19.5`, `9:20`, `16:9`, `21:9`, `1:2`,
  `4:1`, `1:4`, `8:1`, `1:8`. Les fournisseurs valident le sous-ensemble propre
  à leur modèle.
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>Indication de résolution.</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  Indication de qualité lorsque le fournisseur la prend en charge.
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  Indication du format de sortie lorsque le fournisseur le prend en charge.
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  Indication d’arrière-plan lorsque le fournisseur la prend en charge. Utilisez
  `transparent` avec `outputFormat: "png"` ou `"webp"` pour les fournisseurs
  prenant en charge la transparence.
</ParamField>
<ParamField path="count" type="number">Nombre d’images à générer (1 à 4).</ParamField>
<ParamField path="timeoutMs" type="number">
  Délai d’expiration facultatif de la requête au fournisseur, en millisecondes.
  Lorsque Codex appelle `image_generate` par l’intermédiaire d’outils
  dynamiques, cette valeur propre à l’appel remplace toujours la valeur par
  défaut configurée et est plafonnée à 600000 ms.
</ParamField>
<ParamField path="filename" type="string">Indication du nom du fichier de sortie.</ParamField>
<ParamField path="openai" type="object">
  Indications propres à OpenAI : `background`, `moderation`,
  `outputCompression` et `user`.
</ParamField>
<ParamField path="fal.creativity" type='"raw" | "low" | "medium" | "high"'>
  Contrôle de la créativité de fal Krea 2. La valeur par défaut est `medium`.
</ParamField>

<Note>
Tous les fournisseurs ne prennent pas en charge tous les paramètres. Lorsqu’un
fournisseur de repli prend en charge une option géométrique proche plutôt que
celle demandée exactement, OpenClaw choisit la taille, le rapport d’aspect ou
la résolution pris en charge les plus proches avant l’envoi. Les indications
de sortie non prises en charge sont supprimées pour les fournisseurs qui ne
déclarent pas les prendre en charge et sont signalées dans le résultat de
l’outil. Les résultats de l’outil indiquent les paramètres appliqués ;
`details.normalization` consigne toute conversion des valeurs demandées vers
les valeurs appliquées.
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

OpenClaw essaie les fournisseurs dans l’ordre suivant :

1. Paramètre **`model`** de l’appel d’outil (si l’agent en spécifie un).
2. **`imageGenerationModel.primary`** dans la configuration.
3. **`imageGenerationModel.fallbacks`** dans l’ordre.
4. **Détection automatique** — uniquement les valeurs par défaut des fournisseurs disposant d’une authentification :
   - le fournisseur par défaut actuel en premier ;
   - les autres fournisseurs de génération d’images enregistrés, dans l’ordre de leur identifiant.

Si un fournisseur échoue (erreur d’authentification, limite de débit, etc.), le
candidat configuré suivant est essayé automatiquement. Si tous échouent,
l’erreur inclut les détails de chaque tentative.

<AccordionGroup>
  <Accordion title="Les substitutions de modèle par appel sont exactes">
    Une substitution de `model` par appel essaie uniquement ce fournisseur et
    ce modèle, sans poursuivre avec le modèle principal, les modèles de repli
    configurés ni les fournisseurs détectés automatiquement.
  </Accordion>
  <Accordion title="La détection automatique tient compte de l’authentification">
    La valeur par défaut d’un fournisseur n’entre dans la liste des candidats
    que lorsqu’OpenClaw peut réellement s’authentifier auprès de ce fournisseur.
    Définissez `agents.defaults.mediaGenerationAutoProviderFallback: false`
    pour utiliser uniquement les entrées explicites `model`, `primary` et
    `fallbacks`.
  </Accordion>
  <Accordion title="Délais d’expiration">
    Définissez `agents.defaults.imageGenerationModel.timeoutMs` pour les
    systèmes dorsaux de génération d’images lents. Un paramètre d’outil
    `timeoutMs` fourni par appel remplace la valeur par défaut configurée, et
    les valeurs par défaut configurées remplacent celles définies par le Plugin
    du fournisseur. Les fournisseurs d’images hébergés par Google et OpenRouter
    utilisent une valeur par défaut de 180 secondes ; la génération d’images
    Microsoft Foundry MAI, xAI et Azure OpenAI utilise 600 secondes. Les appels
    d’outils dynamiques de Codex utilisent une valeur par défaut de 120 secondes
    pour le pont `image_generate` et respectent le même délai configuré, dans
    la limite maximale de 600000 ms du pont d’outils dynamiques d’OpenClaw.
  </Accordion>
  <Accordion title="Inspection à l’exécution">
    Utilisez `action: "list"` pour inspecter les fournisseurs actuellement
    enregistrés, leurs modèles par défaut et les indications relatives aux
    variables d’environnement d’authentification.
  </Accordion>
</AccordionGroup>

### Retouche d’images

OpenAI, OpenRouter, Google, DeepInfra, fal, Microsoft Foundry, MiniMax,
ComfyUI et xAI prennent en charge la retouche d’images de référence. Les
modèles Krea 2 sur fal utilisent les mêmes champs `image` / `images` comme
références de style plutôt que comme entrées de retouche. Transmettez le
chemin ou l’URL d’une image de référence :

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter et Google prennent en charge jusqu’à 5 images de référence
via le paramètre `images` ; xAI en prend en charge jusqu’à 3. fal prend en
charge 1 image de référence pour la conversion image vers image avec Flux,
jusqu’à 10 pour les retouches GPT Image 2, jusqu’à 10 références de style pour
Krea 2 et jusqu’à 14 pour les retouches Nano Banana 2. Microsoft Foundry,
MiniMax et ComfyUI en prennent en charge 1.

## Présentation détaillée des fournisseurs

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (et gpt-image-1.5)">
    La génération d’images OpenAI utilise par défaut
    `openai/gpt-image-2`. Si un profil OAuth `openai` est configuré,
    OpenClaw réutilise le même profil OAuth que celui des modèles de
    conversation de l’abonnement Codex et envoie la requête d’image par
    l’intermédiaire du système dorsal Codex Responses. Les anciennes URL de
    base Codex telles que `https://chatgpt.com/backend-api` sont normalisées
    en `https://chatgpt.com/backend-api/codex` pour les requêtes d’images.
    OpenClaw ne se rabat **pas** silencieusement sur `OPENAI_API_KEY` pour
    cette requête. Pour imposer un acheminement direct par l’API OpenAI Images,
    configurez explicitement `models.providers.openai` avec une clé d’API,
    une URL de base personnalisée ou un point de terminaison Azure.

    Les modèles `openai/gpt-image-1.5`, `openai/gpt-image-1` et
    `openai/gpt-image-1-mini` peuvent toujours être sélectionnés explicitement.
    Utilisez `gpt-image-1.5` pour produire des fichiers PNG/WebP avec un
    arrière-plan transparent ; l’API `gpt-image-2` actuelle rejette
    `background: "transparent"`.

    `gpt-image-2` prend en charge à la fois la génération texte vers image et
    la retouche d’images de référence au moyen du même outil `image_generate`.
    OpenClaw transmet `prompt`, `count`, `size`, `quality`, `outputFormat`
    ainsi que les images de référence à OpenAI. OpenAI ne reçoit **pas**
    directement `aspectRatio` ni `resolution` ; lorsque cela est possible,
    OpenClaw les convertit en une valeur `size` prise en charge, sinon l’outil
    les signale comme substitutions ignorées.

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

    `openai.background` accepte `transparent`, `opaque` ou `auto` ; les
    sorties transparentes nécessitent un `outputFormat` `png` ou `webp` ainsi
    qu’un modèle d’image OpenAI prenant en charge la transparence. OpenClaw
    achemine les requêtes avec arrière-plan transparent destinées par défaut à
    `gpt-image-2` vers `gpt-image-1.5`. `openai.outputCompression` s’applique
    aux sorties JPEG/WebP et est ignoré pour les sorties PNG.

    L’indication de premier niveau `background` est indépendante du fournisseur
    et correspond actuellement au même champ de requête OpenAI `background`
    lorsque le fournisseur OpenAI est sélectionné. Les fournisseurs qui ne
    déclarent pas prendre en charge les arrière-plans la renvoient dans
    `ignoredOverrides` au lieu de recevoir ce paramètre non pris en charge.

    Pour acheminer la génération d’images OpenAI par l’intermédiaire d’un
    déploiement Azure OpenAI plutôt que par `api.openai.com`, consultez
    [les points de terminaison Azure OpenAI](/fr/providers/openai#azure-openai-endpoints).

  </Accordion>
  <Accordion title="Modèles d’image Microsoft Foundry MAI">
    La génération d’images Microsoft Foundry utilise les noms des déploiements
    d’image MAI déployés sous le préfixe de fournisseur `microsoft-foundry/`.
    Il n’existe aucun modèle par défaut au niveau du fournisseur, car l’API MAI
    attend le nom de votre déploiement dans le champ `model` :

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

    Le fournisseur utilise l’API MAI de Microsoft Foundry, et non l’API
    OpenAI Images :

    - Point de terminaison de génération : `/mai/v1/images/generations`
    - Point de terminaison de retouche : `/mai/v1/images/edits`
    - Authentification : `AZURE_OPENAI_API_KEY` / clé d’API du fournisseur, ou Entra ID via `az login`
    - Sortie : une image PNG
    - Taille : `1024x1024` par défaut ; la largeur et la hauteur doivent chacune être d’au moins 768 px,
      et le nombre total de pixels ne doit pas dépasser 1 048 576
    - Retouches : une image de référence PNG ou JPEG, prise en charge uniquement par
      les déploiements `MAI-Image-2.5-Flash` et `MAI-Image-2.5`

    La génération à partir d’une invite seule peut utiliser un nom de
    déploiement personnalisé si seul le point de terminaison Foundry est
    configuré. Les retouches utilisant des noms de déploiement personnalisés
    nécessitent des métadonnées d’intégration ou de modèle afin qu’OpenClaw
    puisse vérifier que le déploiement repose sur `MAI-Image-2.5-Flash` ou
    `MAI-Image-2.5`.

    Les modèles d’image MAI actuels sont `MAI-Image-2.5-Flash`,
    `MAI-Image-2.5`, `MAI-Image-2e` et `MAI-Image-2`. Consultez le
    [Plugin Microsoft Foundry](/fr/plugins/reference/microsoft-foundry) pour
    connaître la configuration et le comportement des modèles de conversation.

  </Accordion>
  <Accordion title="Modèles d’image OpenRouter">
    La génération d’images OpenRouter utilise la même clé
    `OPENROUTER_API_KEY` et passe par l’API d’images des complétions de
    conversation d’OpenRouter. Sélectionnez les modèles d’image OpenRouter
    avec le préfixe `openrouter/` :

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
    OpenRouter. Les raccourcis intégrés actuels vers les modèles d’image
    OpenRouter comprennent `google/gemini-3.1-flash-image-preview`,
    `google/gemini-3-pro-image-preview` et `openai/gpt-5.4-image-2`.
    Utilisez `action: "list"` pour voir ce que votre Plugin configuré expose.

  </Accordion>
  <Accordion title="fal Krea 2">
    Les modèles Krea 2 sur fal utilisent le schéma Krea natif de fal plutôt
    que le schéma générique `image_size` employé par Flux. OpenClaw envoie :

    - `aspect_ratio` pour les indications de rapport d’aspect
    - `creativity`, avec `medium` comme valeur par défaut
    - `image_style_references` lorsque `image` ou `images` est fourni

    Sélectionnez Krea 2 Medium pour des illustrations expressives plus rapides,
    et Krea 2 Large pour des rendus photoréalistes et texturés plus lents mais
    plus détaillés :

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

    Krea 2 renvoie actuellement une image par requête. Privilégiez
    `aspectRatio` pour Krea ; OpenClaw associe `size` au rapport d’aspect Krea
    pris en charge le plus proche et rejette `resolution` pour Krea au lieu de
    l’ignorer. Utilisez `fal.creativity` lorsque vous souhaitez définir un
    niveau de créativité Krea natif :

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
    La génération d’images MiniMax est disponible par les deux modes
    d’authentification MiniMax intégrés :

    - `minimax/image-01` pour les configurations avec clé d’API
    - `minimax-portal/image-01` pour les configurations OAuth

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    Le fournisseur xAI intégré utilise `/v1/images/generations` pour les
    requêtes contenant uniquement une invite et `/v1/images/edits` lorsque
    `image` ou `images` est présent.

    - Modèles : `xai/grok-imagine-image`, `xai/grok-imagine-image-quality`
    - Nombre : jusqu’à 4
    - Références : un champ `image` ou jusqu’à trois éléments dans `images`
    - Rapports d’aspect : `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, `2:1`,
      `1:2`, `19.5:9`, `9:19.5`, `20:9`, `9:20`
    - Résolutions : `1K`, `2K`
    - Sorties : renvoyées sous forme de pièces jointes d’image gérées par OpenClaw

    OpenClaw n’expose volontairement pas les paramètres xAI natifs `quality`,
    `mask`, `user` ni le rapport d’aspect `auto` tant que ces contrôles
    n’existent pas dans le contrat `image_generate` partagé entre les
    fournisseurs.

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
  <Tab title="Générer (faible qualité OpenAI)">
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
  <Tab title="Générer (deux images carrées)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Deux orientations visuelles pour l’icône d’une application de productivité apaisante" size=1024x1024 count=2
```
  </Tab>
  <Tab title="Modifier (une référence)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Conserver le sujet et remplacer l’arrière-plan par un décor de studio lumineux" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="Modifier (plusieurs références)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combiner l’identité du personnage de la première image avec la palette de couleurs de la seconde" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
  <Tab title="Références de style Krea">
```text
/tool image_generate action=generate model=fal/krea/v2/medium/text-to-image prompt="Un portrait éditorial expressif utilisant cette palette de couleurs et cette texture d’impression" images='["/path/to/palette.png","/path/to/texture.jpg"]' aspectRatio=9:16 fal='{"creativity":"high"}'
```
  </Tab>
</Tabs>

Les mêmes options `--output-format`, `--background`, `--quality` et
`--openai-moderation` sont disponibles avec `openclaw infer image edit` ;
`--openai-background` reste un alias propre à OpenAI. À ce jour, les fournisseurs
intégrés autres qu’OpenAI ne déclarent pas de contrôle explicite de l’arrière-plan ;
`background: "transparent"` est donc signalé comme ignoré pour ces fournisseurs.

## Voir aussi

- [Vue d’ensemble des outils](/fr/tools) - tous les outils d’agent disponibles
- [ComfyUI](/fr/providers/comfy) - configuration des workflows locaux ComfyUI et Comfy Cloud
- [fal](/fr/providers/fal) - configuration du fournisseur d’images et de vidéos fal
- [Google (Gemini)](/fr/providers/google) - configuration du fournisseur d’images Gemini
- [Plugin Microsoft Foundry](/fr/plugins/reference/microsoft-foundry) - configuration du chat Microsoft Foundry et des images MAI
- [MiniMax](/fr/providers/minimax) - configuration du fournisseur d’images MiniMax
- [OpenAI](/fr/providers/openai) - configuration du fournisseur OpenAI Images
- [Vydra](/fr/providers/vydra) - configuration des images, des vidéos et de la synthèse vocale Vydra
- [xAI](/fr/providers/xai) - configuration des images, des vidéos, de la recherche, de l’exécution de code et de la synthèse vocale Grok
- [Référence de configuration](/fr/gateway/config-agents#agent-defaults) - configuration de `imageGenerationModel`
- [Modèles](/fr/concepts/models) - configuration des modèles et basculement en cas de défaillance
