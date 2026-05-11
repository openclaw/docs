---
read_when:
    - Vous voulez une seule clé API pour de nombreux grands modèles de langage
    - Vous souhaitez exécuter des modèles via OpenRouter dans OpenClaw
    - Vous souhaitez utiliser OpenRouter pour la génération d’images
    - Vous souhaitez utiliser OpenRouter pour la génération de vidéos
summary: Utilisez l’API unifiée d’OpenRouter pour accéder à de nombreux modèles dans OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-05-11T20:53:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5016c522cb2239dadebbfe63459d0e00f43b3dc76aa49cd5b4acfd542b31be71
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter fournit une **API unifiée** qui achemine les requêtes vers de nombreux modèles derrière un seul
point de terminaison et une seule clé API. Elle est compatible avec OpenAI, donc la plupart des SDK OpenAI fonctionnent en changeant l’URL de base.

## Bien démarrer

<Steps>
  <Step title="Obtenir votre clé API">
    Créez une clé API sur [openrouter.ai/keys](https://openrouter.ai/keys).
  </Step>
  <Step title="Exécuter l’intégration">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(Facultatif) Passer à un modèle spécifique">
    L’intégration utilise `openrouter/auto` par défaut. Choisissez un modèle concret plus tard :

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
Les références de modèles suivent le motif `openrouter/<provider>/<model>`. Pour la liste complète des
fournisseurs et modèles disponibles, consultez [/concepts/model-providers](/fr/concepts/model-providers).
</Note>

Exemples de secours inclus :

| Référence de modèle                | Remarques                    |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | Routage automatique OpenRouter |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 via MoonshotAI     |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 via MoonshotAI     |

## Génération d’images

OpenRouter peut également alimenter l’outil `image_generate`. Utilisez un modèle d’image OpenRouter sous `agents.defaults.imageGenerationModel` :

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

OpenClaw envoie les requêtes d’images à l’API d’images de chat completions d’OpenRouter avec `modalities: ["image", "text"]`. Les modèles d’image Gemini reçoivent les indications `aspectRatio` et `resolution` prises en charge via `image_config` d’OpenRouter. Utilisez `agents.defaults.imageGenerationModel.timeoutMs` pour les modèles d’image OpenRouter plus lents ; le paramètre `timeoutMs` par appel de l’outil `image_generate` reste prioritaire.

## Génération de vidéos

OpenRouter peut également alimenter l’outil `video_generate` via son API asynchrone `/videos`. Utilisez un modèle vidéo OpenRouter sous `agents.defaults.videoGenerationModel` :

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

OpenClaw soumet les tâches de texte vers vidéo et d’image vers vidéo à OpenRouter, interroge
la `polling_url` renvoyée, puis télécharge la vidéo terminée depuis
les `unsigned_urls` d’OpenRouter ou depuis le point de terminaison documenté du contenu de la tâche.
Les images de référence sont envoyées par défaut comme images de première/dernière image ; les images
étiquetées avec `reference_image` sont envoyées comme références d’entrée OpenRouter. Le modèle par défaut
inclus `google/veo-3.1-fast` annonce les durées de 4/6/8 secondes actuellement prises en charge,
les résolutions `720P`/`1080P`, et les rapports d’aspect `16:9`/`9:16`.
La vidéo vers vidéo n’est pas enregistrée pour OpenRouter, car l’API de génération vidéo en amont
accepte actuellement le texte et les références d’images.

## Synthèse vocale

OpenRouter peut également être utilisé comme fournisseur TTS via son point de terminaison compatible OpenAI
`/audio/speech`.

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

OpenRouter utilise en arrière-plan un jeton Bearer avec votre clé API.

Sur les requêtes OpenRouter réelles (`https://openrouter.ai/api/v1`), OpenClaw ajoute également
les en-têtes documentés d’attribution d’application d’OpenRouter :

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
  <Accordion title="Mise en cache des réponses">
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

    OpenClaw envoie `X-OpenRouter-Cache: true` et, quand c’est configuré,
    `X-OpenRouter-Cache-TTL`. `responseCacheClear: true` force une actualisation pour
    la requête actuelle et stocke la réponse de remplacement. Les alias en snake_case
    (`response_cache`, `response_cache_ttl_seconds` et
    `response_cache_clear`) sont également acceptés.

    C’est distinct de la mise en cache des prompts du fournisseur et des marqueurs
    Anthropic `cache_control` d’OpenRouter. Cela ne s’applique qu’aux routes
    `openrouter.ai` vérifiées, pas aux URL de base de proxy personnalisées.

  </Accordion>

  <Accordion title="Marqueurs de cache Anthropic">
    Sur les routes OpenRouter vérifiées, les références de modèles Anthropic conservent les
    marqueurs Anthropic `cache_control` propres à OpenRouter qu’OpenClaw utilise pour
    une meilleure réutilisation du cache de prompts sur les blocs de prompt système/développeur.
  </Accordion>

  <Accordion title="Préremplissage de raisonnement Anthropic">
    Sur les routes OpenRouter vérifiées, les références de modèles Anthropic avec le raisonnement activé
    suppriment les tours finaux de préremplissage de l’assistant avant que la requête n’atteigne OpenRouter,
    conformément à l’exigence d’Anthropic selon laquelle les conversations de raisonnement se terminent par un tour
    utilisateur.
  </Accordion>

  <Accordion title="Injection de réflexion / raisonnement">
    Sur les routes non-`auto` prises en charge, OpenClaw mappe le niveau de réflexion sélectionné vers
    les charges utiles de raisonnement du proxy OpenRouter. Les indications de modèles non prises en charge et
    `openrouter/auto` ignorent cette injection de raisonnement. Hunter Alpha ignore également
    le raisonnement proxy pour les références de modèles configurées obsolètes, car OpenRouter pourrait
    renvoyer le texte de réponse finale dans les champs de raisonnement pour cette route retirée.
  </Accordion>

  <Accordion title="Relecture du raisonnement DeepSeek V4">
    Sur les routes OpenRouter vérifiées, `openrouter/deepseek/deepseek-v4-flash` et
    `openrouter/deepseek/deepseek-v4-pro` complètent le `reasoning_content` manquant sur
    les tours assistant rejoués, afin que les conversations de réflexion/outils conservent la forme de suivi
    requise par DeepSeek V4. OpenClaw envoie les valeurs `reasoning_effort` prises en charge par OpenRouter
    pour ces routes ; `xhigh` est le niveau le plus élevé annoncé,
    et les remplacements obsolètes `max` sont mappés vers `xhigh`.
  </Accordion>

  <Accordion title="Mise en forme des requêtes OpenAI uniquement">
    OpenRouter passe toujours par le chemin compatible OpenAI de style proxy, donc
    la mise en forme native des requêtes propre à OpenAI, comme `serviceTier`, `store` de Responses,
    les charges utiles de compatibilité de raisonnement OpenAI et les indications de cache de prompts ne sont pas transmises.
  </Accordion>

  <Accordion title="Routes adossées à Gemini">
    Les références OpenRouter adossées à Gemini restent sur le chemin proxy-Gemini : OpenClaw y conserve
    l’assainissement des signatures de pensée Gemini, mais n’active pas la validation de relecture Gemini native
    ni les réécritures d’amorçage.
  </Accordion>

  <Accordion title="Métadonnées de routage fournisseur">
    Si vous passez le routage fournisseur OpenRouter dans les paramètres de modèle, OpenClaw le transmet
    comme métadonnées de routage OpenRouter avant l’exécution des wrappers de flux partagés.
  </Accordion>
</AccordionGroup>

## Connexe

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèles et le comportement de basculement.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Référence complète de configuration pour les agents, modèles et fournisseurs.
  </Card>
</CardGroup>
