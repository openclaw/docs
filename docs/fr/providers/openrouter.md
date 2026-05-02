---
read_when:
    - Vous voulez une seule clé API pour de nombreux LLM
    - Vous souhaitez exécuter des modèles via OpenRouter dans OpenClaw
    - Vous souhaitez utiliser OpenRouter pour la génération d’images
    - Vous souhaitez utiliser OpenRouter pour la génération de vidéos
summary: Utiliser l'API unifiée d'OpenRouter pour accéder à de nombreux modèles dans OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-05-02T07:17:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: f6f7c6f9c77e2a62866fdeaa65667d3871930be2ce22a638accdb8baa76220fd
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter fournit une **API unifiée** qui achemine les requêtes vers de nombreux modèles derrière un seul
point de terminaison et une seule clé API. Elle est compatible avec OpenAI ; la plupart des SDK OpenAI fonctionnent donc en modifiant l’URL de base.

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
Les références de modèles suivent le modèle `openrouter/<provider>/<model>`. Pour la liste complète des
fournisseurs et modèles disponibles, consultez [/concepts/model-providers](/fr/concepts/model-providers).
</Note>

Exemples de repli inclus :

| Référence de modèle              | Notes                        |
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

OpenClaw envoie les requêtes d’image à l’API d’images de chat completions d’OpenRouter avec `modalities: ["image", "text"]`. Les modèles d’image Gemini reçoivent les indications `aspectRatio` et `resolution` prises en charge via l’`image_config` d’OpenRouter. Utilisez `agents.defaults.imageGenerationModel.timeoutMs` pour les modèles d’image OpenRouter plus lents ; le paramètre `timeoutMs` par appel de l’outil `image_generate` reste prioritaire.

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

OpenClaw soumet les tâches texte-vers-vidéo et image-vers-vidéo à OpenRouter, interroge
le `polling_url` renvoyé, puis télécharge la vidéo terminée depuis les
`unsigned_urls` d’OpenRouter ou depuis le point de terminaison documenté du contenu de la tâche.
Les images de référence sont envoyées par défaut comme images de première/dernière frame ; les images
étiquetées avec `reference_image` sont envoyées comme références d’entrée OpenRouter. Le
modèle par défaut inclus `google/veo-3.1-fast` annonce les durées de 4/6/8
secondes actuellement prises en charge, les résolutions `720P`/`1080P` et les
ratios d’aspect `16:9`/`9:16`. Le vidéo-vers-vidéo n’est pas enregistré pour OpenRouter, car l’API
amont de génération vidéo accepte actuellement le texte et les références d’image.

## Synthèse vocale

OpenRouter peut aussi être utilisé comme fournisseur TTS via son point de terminaison
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

Sur les vraies requêtes OpenRouter (`https://openrouter.ai/api/v1`), OpenClaw ajoute aussi
les en-têtes documentés d’attribution d’application d’OpenRouter :

| En-tête                   | Valeur                |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
Si vous redirigez le fournisseur OpenRouter vers un autre proxy ou une autre URL de base, OpenClaw
n’injecte **pas** ces en-têtes propres à OpenRouter ni les marqueurs de cache Anthropic.
</Warning>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Marqueurs de cache Anthropic">
    Sur les routes OpenRouter vérifiées, les références de modèles Anthropic conservent les
    marqueurs Anthropic `cache_control` propres à OpenRouter qu’OpenClaw utilise pour
    une meilleure réutilisation du cache de prompt sur les blocs de prompts system/developer.
  </Accordion>

  <Accordion title="Préremplissage de raisonnement Anthropic">
    Sur les routes OpenRouter vérifiées, les références de modèles Anthropic avec raisonnement activé
    suppriment les derniers tours de préremplissage assistant avant que la requête n’atteigne OpenRouter,
    conformément à l’exigence d’Anthropic selon laquelle les conversations de raisonnement doivent se terminer par un tour
    utilisateur.
  </Accordion>

  <Accordion title="Injection de pensée / raisonnement">
    Sur les routes non-`auto` prises en charge, OpenClaw associe le niveau de pensée sélectionné aux
    charges utiles de raisonnement du proxy OpenRouter. Les indications de modèle non prises en charge et
    `openrouter/auto` ignorent cette injection de raisonnement. Hunter Alpha ignore également le
    raisonnement proxy pour les références de modèles configurées obsolètes, car OpenRouter pourrait
    renvoyer le texte de réponse finale dans les champs de raisonnement pour cette route retirée.
  </Accordion>

  <Accordion title="Façonnage des requêtes propres à OpenAI">
    OpenRouter passe toujours par le chemin de proxy compatible OpenAI ; le
    façonnage natif des requêtes propre à OpenAI, comme `serviceTier`, le `store` des Responses,
    les charges utiles de compatibilité avec le raisonnement OpenAI et les indications de cache de prompt, n’est donc pas transmis.
  </Accordion>

  <Accordion title="Routes adossées à Gemini">
    Les références OpenRouter adossées à Gemini restent sur le chemin proxy-Gemini : OpenClaw y conserve
    le nettoyage des signatures de pensée Gemini, mais n’active pas la validation native de relecture Gemini
    ni les réécritures d’amorçage.
  </Accordion>

  <Accordion title="Métadonnées de routage du fournisseur">
    Si vous transmettez le routage de fournisseur OpenRouter dans les paramètres du modèle, OpenClaw le transmet
    comme métadonnées de routage OpenRouter avant l’exécution des wrappers de flux partagés.
  </Accordion>
</AccordionGroup>

## Associé

<CardGroup cols={2}>
  <Card title="Sélection de modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèles et le comportement de basculement.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Référence de configuration complète pour les agents, les modèles et les fournisseurs.
  </Card>
</CardGroup>
