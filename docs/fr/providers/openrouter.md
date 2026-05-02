---
read_when:
    - Vous voulez une seule clé API pour plusieurs LLM
    - Vous souhaitez exécuter des modèles via OpenRouter dans OpenClaw
    - Vous souhaitez utiliser OpenRouter pour la génération d’images
    - Vous souhaitez utiliser OpenRouter pour la génération de vidéos
summary: Utilisez l’API unifiée d’OpenRouter pour accéder à de nombreux modèles dans OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-05-02T21:01:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: e98b8b540265b6d11681390c02cb68312f33625bf223823a2dbca17e877c0422
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter fournit une **API unifiée** qui achemine les requêtes vers de nombreux modèles derrière un seul point de terminaison et une seule clé API. Elle est compatible avec OpenAI, donc la plupart des SDK OpenAI fonctionnent en changeant l’URL de base.

## Bien démarrer

<Steps>
  <Step title="Obtenir votre clé API">
    Créez une clé API sur [openrouter.ai/keys](https://openrouter.ai/keys).
  </Step>
  <Step title="Exécuter l’onboarding">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(Facultatif) Passer à un modèle spécifique">
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
Les références de modèles suivent le format `openrouter/<provider>/<model>`. Pour la liste complète des fournisseurs et modèles disponibles, consultez [/concepts/model-providers](/fr/concepts/model-providers).
</Note>

Exemples de secours intégrés :

| Référence de modèle              | Notes                           |
| --------------------------------- | ------------------------------- |
| `openrouter/auto`                 | Routage automatique OpenRouter  |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 via MoonshotAI        |

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

OpenClaw envoie les requêtes d’image à l’API d’images des complétions de chat d’OpenRouter avec `modalities: ["image", "text"]`. Les modèles d’image Gemini reçoivent les indications `aspectRatio` et `resolution` prises en charge via `image_config` d’OpenRouter. Utilisez `agents.defaults.imageGenerationModel.timeoutMs` pour les modèles d’image OpenRouter plus lents ; le paramètre `timeoutMs` par appel de l’outil `image_generate` reste prioritaire.

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

OpenClaw soumet les tâches texte-vers-vidéo et image-vers-vidéo à OpenRouter, interroge l’URL `polling_url` renvoyée et télécharge la vidéo terminée depuis les `unsigned_urls` d’OpenRouter ou depuis le point de terminaison de contenu de tâche documenté. Les images de référence sont envoyées par défaut comme images de première/dernière image ; les images marquées avec `reference_image` sont envoyées comme références d’entrée OpenRouter. La valeur par défaut intégrée `google/veo-3.1-fast` annonce les durées actuellement prises en charge de 4/6/8 secondes, les résolutions `720P`/`1080P` et les formats d’image `16:9`/`9:16`. Le vidéo-vers-vidéo n’est pas enregistré pour OpenRouter, car l’API de génération vidéo en amont accepte actuellement le texte et les références d’images.

## Synthèse vocale

OpenRouter peut aussi être utilisé comme fournisseur TTS via son point de terminaison compatible OpenAI `/audio/speech`.

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

Si `messages.tts.providers.openrouter.apiKey` est omis, TTS réutilise `models.providers.openrouter.apiKey`, puis `OPENROUTER_API_KEY`.

## Authentification et en-têtes

OpenRouter utilise en interne un jeton Bearer avec votre clé API.

Pour les requêtes OpenRouter réelles (`https://openrouter.ai/api/v1`), OpenClaw ajoute aussi les en-têtes d’attribution d’application documentés par OpenRouter :

| En-tête                  | Valeur                |
| ------------------------ | --------------------- |
| `HTTP-Referer`           | `https://openclaw.ai` |
| `X-OpenRouter-Title`     | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`          |

<Warning>
Si vous redirigez le fournisseur OpenRouter vers un autre proxy ou une autre URL de base, OpenClaw n’injecte **pas** ces en-têtes propres à OpenRouter ni les marqueurs de cache Anthropic.
</Warning>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Marqueurs de cache Anthropic">
    Sur les routes OpenRouter vérifiées, les références de modèles Anthropic conservent les marqueurs Anthropic `cache_control` propres à OpenRouter qu’OpenClaw utilise pour une meilleure réutilisation du cache de prompts sur les blocs de prompts système/développeur.
  </Accordion>

  <Accordion title="Préremplissage de raisonnement Anthropic">
    Sur les routes OpenRouter vérifiées, les références de modèles Anthropic avec le raisonnement activé suppriment les tours de préremplissage assistant finaux avant que la requête n’atteigne OpenRouter, conformément à l’exigence d’Anthropic selon laquelle les conversations de raisonnement doivent se terminer par un tour utilisateur.
  </Accordion>

  <Accordion title="Injection de réflexion / raisonnement">
    Sur les routes non-`auto` prises en charge, OpenClaw associe le niveau de réflexion sélectionné aux charges utiles de raisonnement du proxy OpenRouter. Les indications de modèle non prises en charge et `openrouter/auto` ignorent cette injection de raisonnement. Hunter Alpha ignore aussi le raisonnement proxy pour les références de modèles configurées obsolètes, car OpenRouter pourrait renvoyer le texte de réponse finale dans les champs de raisonnement pour cette route retirée.
  </Accordion>

  <Accordion title="Relecture du raisonnement DeepSeek V4">
    Sur les routes OpenRouter vérifiées, `openrouter/deepseek/deepseek-v4-flash` et `openrouter/deepseek/deepseek-v4-pro` remplissent le `reasoning_content` manquant sur les tours assistant relus afin que les conversations réflexion/outil conservent la forme de suivi requise par DeepSeek V4.
  </Accordion>

  <Accordion title="Mise en forme des requêtes OpenAI uniquement">
    OpenRouter passe toujours par le chemin compatible OpenAI de style proxy ; la mise en forme de requêtes native propre à OpenAI, comme `serviceTier`, `store` de Responses, les charges utiles compatibles avec le raisonnement OpenAI et les indications de cache de prompts, n’est donc pas transmise.
  </Accordion>

  <Accordion title="Routes basées sur Gemini">
    Les références OpenRouter basées sur Gemini restent sur le chemin proxy-Gemini : OpenClaw y conserve le nettoyage des signatures de pensée Gemini, mais n’active pas la validation de relecture Gemini native ni les réécritures d’amorçage.
  </Accordion>

  <Accordion title="Métadonnées de routage du fournisseur">
    Si vous transmettez le routage de fournisseur OpenRouter dans les paramètres du modèle, OpenClaw le relaie comme métadonnées de routage OpenRouter avant l’exécution des enveloppes de flux partagées.
  </Accordion>
</AccordionGroup>

## Connexe

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèles et le comportement de basculement.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Référence complète de configuration pour les agents, les modèles et les fournisseurs.
  </Card>
</CardGroup>
