---
read_when:
    - Vous souhaitez une seule clé API pour de nombreux LLM
    - Vous voulez exécuter des modèles via Kilo Gateway dans OpenClaw
summary: Utilisez l’API unifiée de Kilo Gateway pour accéder à de nombreux modèles dans OpenClaw
title: Kilocode
x-i18n:
    generated_at: "2026-04-30T07:44:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: c51012b94d4b720795356b67c8482ae7ee0b37d401689e923be0b7732d77c4aa
    source_path: providers/kilocode.md
    workflow: 16
---

# Kilo Gateway

Kilo Gateway fournit une **API unifiée** qui achemine les requêtes vers de nombreux modèles derrière un seul
endpoint et une seule clé API. Elle est compatible avec OpenAI, donc la plupart des SDK OpenAI fonctionnent en changeant l’URL de base.

| Propriété | Valeur                             |
| --------- | ---------------------------------- |
| Fournisseur | `kilocode`                       |
| Authentification | `KILOCODE_API_KEY`         |
| API       | Compatible avec OpenAI             |
| URL de base | `https://api.kilo.ai/api/gateway/` |

## Bien démarrer

<Steps>
  <Step title="Create an account">
    Accédez à [app.kilo.ai](https://app.kilo.ai), connectez-vous ou créez un compte, puis allez dans Clés API et générez une nouvelle clé.
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    Ou définissez directement la variable d’environnement :

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## Modèle par défaut

Le modèle par défaut est `kilocode/kilo/auto`, un modèle de routage intelligent
géré par le fournisseur et administré par Kilo Gateway.

<Note>
OpenClaw traite `kilocode/kilo/auto` comme la référence stable par défaut, mais ne
publie pas de correspondance, étayée par une source, entre les tâches et les modèles amont pour cette route. Le routage
amont exact derrière `kilocode/kilo/auto` appartient à Kilo Gateway, il n’est pas
codé en dur dans OpenClaw.
</Note>

## Catalogue intégré

OpenClaw découvre dynamiquement les modèles disponibles depuis Kilo Gateway au démarrage. Utilisez
`/models kilocode` pour voir la liste complète des modèles disponibles avec votre compte.

Tout modèle disponible sur la Gateway peut être utilisé avec le préfixe `kilocode/` :

| Référence du modèle                    | Notes                              |
| -------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                   | Par défaut — routage intelligent   |
| `kilocode/anthropic/claude-sonnet-4`   | Anthropic via Kilo                 |
| `kilocode/openai/gpt-5.5`              | OpenAI via Kilo                    |
| `kilocode/google/gemini-3-pro-preview` | Google via Kilo                    |
| ...et beaucoup d’autres                | Utilisez `/models kilocode` pour tout lister |

<Tip>
Au démarrage, OpenClaw interroge `GET https://api.kilo.ai/api/gateway/models` et fusionne
les modèles découverts avant le catalogue de secours statique. Le secours intégré inclut toujours
`kilocode/kilo/auto` (`Kilo Auto`) avec `input: ["text", "image"]`,
`reasoning: true`, `contextWindow: 1000000` et `maxTokens: 128000`.
</Tip>

## Exemple de configuration

```json5
{
  env: { KILOCODE_API_KEY: "<your-kilocode-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "kilocode/kilo/auto" },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Transport and compatibility">
    Kilo Gateway est documenté dans le source comme compatible avec OpenRouter, il reste donc sur
    le chemin compatible OpenAI de type proxy plutôt que sur une mise en forme native des requêtes OpenAI.

    - Les références Kilo adossées à Gemini restent sur le chemin proxy-Gemini, donc OpenClaw conserve
      l’assainissement des signatures de pensée Gemini à cet endroit sans activer la validation de relecture
      native Gemini ni les réécritures de bootstrap.
    - Kilo Gateway utilise en interne un jeton Bearer avec votre clé API.

  </Accordion>

  <Accordion title="Stream wrapper and reasoning">
    L’enveloppe de flux partagée de Kilo ajoute l’en-tête d’application du fournisseur et normalise
    les charges utiles de raisonnement proxy pour les références de modèles concrètes prises en charge.

    <Warning>
    `kilocode/kilo/auto` et les autres indications non prises en charge par le raisonnement proxy ignorent l’injection de raisonnement.
    Si vous avez besoin de la prise en charge du raisonnement, utilisez une référence de modèle concrète comme
    `kilocode/anthropic/claude-sonnet-4`.
    </Warning>

  </Accordion>

  <Accordion title="Troubleshooting">
    - Si la découverte des modèles échoue au démarrage, OpenClaw revient au catalogue statique intégré contenant `kilocode/kilo/auto`.
    - Vérifiez que votre clé API est valide et que les modèles souhaités sont activés pour votre compte Kilo.
    - Lorsque la Gateway s’exécute comme daemon, assurez-vous que `KILOCODE_API_KEY` est disponible pour ce processus (par exemple dans `~/.openclaw/.env` ou via `env.shellEnv`).

  </Accordion>
</AccordionGroup>

## Associé

<CardGroup cols={2}>
  <Card title="Model selection" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="Configuration reference" href="/fr/gateway/configuration-reference" icon="gear">
    Référence complète de configuration d’OpenClaw.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Tableau de bord Kilo Gateway, clés API et gestion du compte.
  </Card>
</CardGroup>
