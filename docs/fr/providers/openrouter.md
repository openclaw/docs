---
read_when:
    - Vous voulez une seule clé API pour de nombreux LLM
    - Vous souhaitez exécuter des modèles via OpenRouter dans OpenClaw
    - Vous souhaitez utiliser OpenRouter pour la génération d’images
    - Vous souhaitez utiliser OpenRouter pour la génération de vidéos
summary: Utilisez l’API unifiée d’OpenRouter pour accéder à de nombreux modèles dans OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-05-04T02:25:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: f6b7299408aa0de7530e2248c7fa5dae8c09095e2d20a0e9d12a64cab83966fc
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter fournit une **API unifiée** qui achemine les requêtes vers de nombreux modèles derrière un seul
point de terminaison et une seule clé API. Elle est compatible avec OpenAI, donc la plupart des SDK OpenAI fonctionnent en changeant l’URL de base.

## Premiers pas

<Steps>
  <Step title="Get your API key">
    Créez une clé API sur [openrouter.ai/keys](https://openrouter.ai/keys).
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(Optional) Switch to a specific model">
    L’onboarding utilise `openrouter/auto` par défaut. Choisissez un modèle concret plus tard :

    ```bash
    openclaw models set openrouter/<provider>/<model>
    ```

  </Step>
</Steps>

## Exemple de configuration

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/auto" },
    },
  },
}
```

## Références de modèles

<Note>
Les références de modèles suivent le modèle `openrouter/<provider>/<model>`. Pour la liste complète des
fournisseurs et modèles disponibles, consultez [/concepts/model-providers](/fr/concepts/model-providers).
</Note>

Exemples de secours intégrés :

| Référence de modèle               | Remarques                    |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | Routage automatique OpenRouter |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 via MoonshotAI     |

## Génération d’images

OpenRouter peut aussi prendre en charge l’outil `image_generate`. Utilisez un modèle d’image OpenRouter sous `agents.defaults.imageGenerationModel` :

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
        timeoutMs: 180_000,
      },
    },
  },
}
```

OpenClaw envoie les requêtes d’image à l’API d’images de complétions de chat d’OpenRouter avec `modalities: ["image", "text"]`. Les modèles d’image Gemini reçoivent les indications `aspectRatio` et `resolution` prises en charge via `image_config` d’OpenRouter. Utilisez `agents.defaults.imageGenerationModel.timeoutMs` pour les modèles d’image OpenRouter plus lents ; le paramètre `timeoutMs` par appel de l’outil `image_generate` reste prioritaire.

## Génération de vidéos

OpenRouter peut aussi prendre en charge l’outil `video_generate` via son API asynchrone `/videos`. Utilisez un modèle vidéo OpenRouter sous `agents.defaults.videoGenerationModel` :

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "openrouter/google/veo-3.1-fast",
      },
    },
  },
}
```

OpenClaw soumet des tâches texte-vers-vidéo et image-vers-vidéo à OpenRouter, interroge
le `polling_url` renvoyé et télécharge la vidéo terminée depuis
les `unsigned_urls` d’OpenRouter ou depuis le point de terminaison de contenu de tâche documenté.
Les images de référence sont envoyées par défaut comme images de première/dernière image ; les images
marquées avec `reference_image` sont envoyées comme références d’entrée OpenRouter. Le
réglage par défaut intégré `google/veo-3.1-fast` annonce les durées de 4/6/8
secondes actuellement prises en charge, les résolutions `720P`/`1080P` et les formats d’image
`16:9`/`9:16`. La vidéo-vers-vidéo n’est pas enregistrée pour OpenRouter car l’API
de génération vidéo en amont accepte actuellement le texte et les références d’image.

## Synthèse vocale

OpenRouter peut aussi être utilisé comme fournisseur TTS via son point de terminaison
`/audio/speech` compatible avec OpenAI.

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

Si `messages.tts.providers.openrouter.apiKey` est omis, TTS réutilise
`models.providers.openrouter.apiKey`, puis `OPENROUTER_API_KEY`.

## Authentification et en-têtes

OpenRouter utilise en interne un jeton Bearer avec votre clé API.

Sur les requêtes OpenRouter réelles (`https://openrouter.ai/api/v1`), OpenClaw ajoute aussi
les en-têtes d’attribution d’application documentés d’OpenRouter :

| En-tête                   | Valeur                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
Si vous redirigez le fournisseur OpenRouter vers un autre proxy ou une autre URL de base, OpenClaw
n’injecte **pas** ces en-têtes propres à OpenRouter ni les marqueurs de cache Anthropic.
</Warning>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Response caching">
    La mise en cache des réponses OpenRouter est optionnelle. Activez-la par modèle OpenRouter avec
    les paramètres de modèle :

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openrouter/auto": {
              params: {
                responseCache: true,
                responseCacheTtlSeconds: 300,
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw envoie `X-OpenRouter-Cache: true` et, lorsqu’il est configuré,
    `X-OpenRouter-Cache-TTL`. `responseCacheClear: true` force une actualisation pour
    la requête actuelle et stocke la réponse de remplacement. Les alias snake_case
    (`response_cache`, `response_cache_ttl_seconds` et
    `response_cache_clear`) sont également acceptés.

    Cela est distinct de la mise en cache des prompts du fournisseur et des marqueurs
    `cache_control` Anthropic d’OpenRouter. Cela n’est appliqué que sur les routes
    `openrouter.ai` vérifiées, et non sur les URL de base de proxy personnalisées.

  </Accordion>

  <Accordion title="Anthropic cache markers">
    Sur les routes OpenRouter vérifiées, les références de modèles Anthropic conservent les
    marqueurs `cache_control` Anthropic propres à OpenRouter qu’OpenClaw utilise pour
    améliorer la réutilisation du cache de prompts sur les blocs de prompts système/développeur.
  </Accordion>

  <Accordion title="Anthropic reasoning prefill">
    Sur les routes OpenRouter vérifiées, les références de modèles Anthropic avec le raisonnement activé
    suppriment les tours de préremplissage assistant finaux avant que la requête n’atteigne OpenRouter,
    conformément à l’exigence d’Anthropic selon laquelle les conversations de raisonnement doivent se terminer par un tour
    utilisateur.
  </Accordion>

  <Accordion title="Thinking / reasoning injection">
    Sur les routes non-`auto` prises en charge, OpenClaw associe le niveau de réflexion sélectionné aux
    charges utiles de raisonnement du proxy OpenRouter. Les indications de modèles non prises en charge et
    `openrouter/auto` ignorent cette injection de raisonnement. Hunter Alpha ignore aussi le
    raisonnement proxy pour les références de modèles configurées obsolètes, car OpenRouter pourrait
    renvoyer le texte de réponse final dans les champs de raisonnement pour cette route retirée.
  </Accordion>

  <Accordion title="DeepSeek V4 reasoning replay">
    Sur les routes OpenRouter vérifiées, `openrouter/deepseek/deepseek-v4-flash` et
    `openrouter/deepseek/deepseek-v4-pro` complètent le `reasoning_content` manquant sur
    les tours assistant rejoués afin que les conversations de réflexion/outils conservent la
    forme de suivi requise par DeepSeek V4.
  </Accordion>

  <Accordion title="OpenAI-only request shaping">
    OpenRouter passe toujours par le chemin proxy compatible avec OpenAI, donc
    la mise en forme native des requêtes propre à OpenAI comme `serviceTier`, `store` de Responses,
    les charges utiles compatibles avec le raisonnement OpenAI et les indications de cache de prompts ne sont pas transmises.
  </Accordion>

  <Accordion title="Gemini-backed routes">
    Les références OpenRouter adossées à Gemini restent sur le chemin proxy-Gemini : OpenClaw y conserve
    l’assainissement des signatures de pensée Gemini, mais n’active pas la validation de relecture Gemini
    native ni les réécritures d’amorçage.
  </Accordion>

  <Accordion title="Provider routing metadata">
    Si vous transmettez le routage de fournisseur OpenRouter sous les paramètres de modèle, OpenClaw le transmet
    comme métadonnées de routage OpenRouter avant l’exécution des wrappers de flux partagés.
  </Accordion>
</AccordionGroup>

## Connexe

<CardGroup cols={2}>
  <Card title="Model selection" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèles et le comportement de basculement.
  </Card>
  <Card title="Configuration reference" href="/fr/gateway/configuration-reference" icon="gear">
    Référence complète de configuration pour les agents, les modèles et les fournisseurs.
  </Card>
</CardGroup>
