---
read_when:
    - Vous souhaitez une seule clé API pour de nombreux LLMs
    - Vous souhaitez exécuter des modèles via OpenRouter dans OpenClaw
summary: Utilisez l’API unifiée d’OpenRouter pour accéder à de nombreux modèles dans OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-04-22T04:27:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a8d1e6191d98e3f5284ebc77e0b8b855a04f3fbed09786d6125b622333ac807
    source_path: providers/openrouter.md
    workflow: 15
---

# OpenRouter

OpenRouter fournit une **API unifiée** qui route les requêtes vers de nombreux modèles derrière un seul
point de terminaison et une seule clé API. Elle est compatible OpenAI, donc la plupart des SDK OpenAI fonctionnent en changeant l’URL de base.

## Premiers pas

<Steps>
  <Step title="Obtenez votre clé API">
    Créez une clé API sur [openrouter.ai/keys](https://openrouter.ai/keys).
  </Step>
  <Step title="Exécutez l’intégration initiale">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(Facultatif) Basculer vers un modèle spécifique">
    L’intégration initiale utilise par défaut `openrouter/auto`. Choisissez ensuite un modèle concret :

    ```bash
    openclaw models set openrouter/<provider>/<model>
    ```

  </Step>
</Steps>

## Exemple de config

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
providers et modèles disponibles, consultez [/concepts/model-providers](/fr/concepts/model-providers).
</Note>

Exemples de repli inclus :

| Model ref                            | Notes                            |
| ------------------------------------ | -------------------------------- |
| `openrouter/auto`                    | Routage automatique OpenRouter   |
| `openrouter/moonshotai/kimi-k2.6`    | Kimi K2.6 via MoonshotAI         |
| `openrouter/openrouter/healer-alpha` | Route OpenRouter Healer Alpha    |
| `openrouter/openrouter/hunter-alpha` | Route OpenRouter Hunter Alpha    |

## Authentification et en-têtes

OpenRouter utilise en interne un jeton Bearer avec votre clé API.

Sur les vraies requêtes OpenRouter (`https://openrouter.ai/api/v1`), OpenClaw ajoute aussi
les en-têtes documentés d’attribution d’app d’OpenRouter :

| Header                    | Value                 |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
Si vous redirigez le provider OpenRouter vers un autre proxy ou une autre URL de base, OpenClaw
n’injecte **pas** ces en-têtes spécifiques à OpenRouter ni les marqueurs de cache Anthropic.
</Warning>

## Notes avancées

<AccordionGroup>
  <Accordion title="Marqueurs de cache Anthropic">
    Sur les routes OpenRouter vérifiées, les références de modèles Anthropic conservent les
    marqueurs `cache_control` Anthropic spécifiques à OpenRouter qu’OpenClaw utilise pour
    une meilleure réutilisation du cache de prompt sur les blocs de prompts système / développeur.
  </Accordion>

  <Accordion title="Injection de thinking / reasoning">
    Sur les routes prises en charge autres que `auto`, OpenClaw mappe le niveau de thinking sélectionné vers
    les charges utiles de raisonnement du proxy OpenRouter. Les indications de modèles non prises en charge et
    `openrouter/auto` ignorent cette injection de raisonnement.
  </Accordion>

  <Accordion title="Mise en forme des requêtes réservée à OpenAI">
    OpenRouter passe toujours par le chemin compatible OpenAI de style proxy, donc
    la mise en forme native des requêtes réservée à OpenAI, comme `serviceTier`, `store` de Responses,
    les charges utiles de compatibilité de raisonnement OpenAI et les indications de cache de prompt, n’est pas transmise.
  </Accordion>

  <Accordion title="Routes adossées à Gemini">
    Les références OpenRouter adossées à Gemini restent sur le chemin proxy-Gemini : OpenClaw y conserve
    l’assainissement des signatures de pensée Gemini, mais n’active pas la validation native de rejeu Gemini
    ni les réécritures d’initialisation.
  </Accordion>

  <Accordion title="Métadonnées de routage de provider">
    Si vous transmettez le routage de provider OpenRouter sous les paramètres du modèle, OpenClaw le transmet
    comme métadonnées de routage OpenRouter avant l’exécution des wrappers de flux partagés.
  </Accordion>
</AccordionGroup>

## Liens associés

<CardGroup cols={2}>
  <Card title="Sélection de modèle" href="/fr/concepts/model-providers" icon="layers">
    Choix des providers, des références de modèles et du comportement de repli.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Référence complète de config pour les agents, les modèles et les providers.
  </Card>
</CardGroup>
