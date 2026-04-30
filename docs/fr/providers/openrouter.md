---
read_when:
    - Vous souhaitez une seule clé API pour de nombreux LLM
    - Vous souhaitez exécuter des modèles via OpenRouter dans OpenClaw
    - Vous souhaitez utiliser OpenRouter pour la génération d’images
    - Vous souhaitez utiliser OpenRouter pour la génération de vidéos
summary: Utiliser l’API unifiée d’OpenRouter pour accéder à de nombreux modèles dans OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-04-30T07:45:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 47206ce7279eb8a38f71b5c40d34646ad01df2cac25860b629951f9cec73270f
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter fournit une **API unifiée** qui achemine les requêtes vers de nombreux modèles derrière un seul
point de terminaison et une seule clé API. Elle est compatible avec OpenAI, donc la plupart des SDK OpenAI fonctionnent en changeant l’URL de base.

## Premiers pas

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
Les références de modèles suivent le format `openrouter/<provider>/<model>`. Pour la liste complète des
fournisseurs et modèles disponibles, consultez [/concepts/model-providers](/fr/concepts/model-providers).
</Note>

Exemples de secours intégrés :

| Référence de modèle               | Notes                        |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | Routage automatique OpenRouter |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 via MoonshotAI     |

## Génération d’images

OpenRouter peut également prendre en charge l’outil `image_generate`. Utilisez un modèle d’image OpenRouter sous `agents.defaults.imageGenerationModel` :

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

## Génération vidéo

OpenRouter peut également prendre en charge l’outil `video_generate` via son API asynchrone `/videos`. Utilisez un modèle vidéo OpenRouter sous `agents.defaults.videoGenerationModel` :

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
le `polling_url` renvoyé et télécharge la vidéo terminée depuis les
`unsigned_urls` d’OpenRouter ou le point de terminaison documenté du contenu de la tâche.
Les images de référence sont envoyées par défaut comme images de première/dernière image ; les images
marquées avec `reference_image` sont envoyées comme références d’entrée OpenRouter. La valeur par défaut
intégrée `google/veo-3.1-fast` annonce les durées actuellement prises en charge de 4/6/8
secondes, les résolutions `720P`/`1080P` et les rapports
d’aspect `16:9`/`9:16`. La vidéo-vers-vidéo n’est pas enregistrée pour OpenRouter, car l’API
de génération vidéo en amont accepte actuellement le texte et les références d’image.

## Synthèse vocale

OpenRouter peut également être utilisé comme fournisseur TTS via son point de terminaison
compatible OpenAI `/audio/speech`.

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
les en-têtes documentés d’attribution d’application d’OpenRouter :

| En-tête                   | Valeur                |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
Si vous redirigez le fournisseur OpenRouter vers un autre proxy ou une autre URL de base, OpenClaw
n’injecte **pas** ces en-têtes spécifiques à OpenRouter ni les marqueurs de cache Anthropic.
</Warning>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Marqueurs de cache Anthropic">
    Sur les routes OpenRouter vérifiées, les références de modèles Anthropic conservent les
    marqueurs Anthropic `cache_control` spécifiques à OpenRouter qu’OpenClaw utilise pour
    améliorer la réutilisation du cache de prompts sur les blocs de prompts système/développeur.
  </Accordion>

  <Accordion title="Injection de réflexion / raisonnement">
    Sur les routes non-`auto` prises en charge, OpenClaw associe le niveau de réflexion sélectionné aux
    charges utiles de raisonnement du proxy OpenRouter. Les indications de modèle non prises en charge et
    `openrouter/auto` ignorent cette injection de raisonnement. Hunter Alpha ignore également le
    raisonnement du proxy pour les références de modèles configurées obsolètes, car OpenRouter pourrait
    renvoyer le texte de réponse final dans les champs de raisonnement pour cette route retirée.
  </Accordion>

  <Accordion title="Mise en forme des requêtes OpenAI uniquement">
    OpenRouter passe toujours par le chemin proxy compatible OpenAI ; par conséquent,
    la mise en forme de requête native propre à OpenAI, comme `serviceTier`, `store` de Responses,
    les charges utiles de compatibilité avec le raisonnement OpenAI et les indications de cache de prompts, n’est pas transmise.
  </Accordion>

  <Accordion title="Routes reposant sur Gemini">
    Les références OpenRouter reposant sur Gemini restent sur le chemin proxy-Gemini : OpenClaw conserve
    l’assainissement des signatures de pensée Gemini à cet endroit, mais n’active pas la validation native
    de relecture Gemini ni les réécritures de bootstrap.
  </Accordion>

  <Accordion title="Métadonnées de routage du fournisseur">
    Si vous transmettez le routage de fournisseur OpenRouter dans les paramètres du modèle, OpenClaw le transmet
    comme métadonnées de routage OpenRouter avant l’exécution des wrappers de flux partagés.
  </Accordion>
</AccordionGroup>

## Associé

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir des fournisseurs, des références de modèles et le comportement de basculement.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Référence complète de configuration pour les agents, les modèles et les fournisseurs.
  </Card>
</CardGroup>
