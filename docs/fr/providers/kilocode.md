---
read_when:
    - Vous souhaitez une seule clé API pour plusieurs LLM
    - Vous souhaitez exécuter des modèles via Kilo Gateway dans OpenClaw
summary: Utilisez l’API unifiée de Kilo Gateway pour accéder à de nombreux modèles dans OpenClaw
title: Gateway Kilo
x-i18n:
    generated_at: "2026-07-12T15:53:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2108e1bb5b2430f42bf9e798da1d5e40448f05d396ab1710a0d6708961960756
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway achemine les requêtes vers de nombreux modèles derrière un point de terminaison unique compatible avec OpenAI et une seule clé API.

| Propriété    | Valeur                             |
| ------------ | ---------------------------------- |
| Fournisseur  | `kilocode`                         |
| Authentification | `KILOCODE_API_KEY`             |
| API          | Compatible avec OpenAI             |
| URL de base  | `https://api.kilo.ai/api/gateway/` |

## Installer le Plugin

```bash
openclaw plugins install @openclaw/kilocode-provider
openclaw gateway restart
```

## Configuration

<Steps>
  <Step title="Créer un compte">
    Accédez à [app.kilo.ai](https://app.kilo.ai), connectez-vous ou créez un compte, puis générez une clé API.
  </Step>
  <Step title="Exécuter l’intégration initiale">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    Vous pouvez également définir directement la variable d’environnement :

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="Vérifier que le modèle est disponible">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## Modèle par défaut et catalogue

Le modèle par défaut est `kilocode/kilo/auto`, un modèle de routage intelligent géré par le fournisseur. OpenClaw ne
publie aucune correspondance entre les tâches et les modèles en amont pour celui-ci ; le routage derrière `kilo/auto` est géré par Kilo Gateway.

Au démarrage, OpenClaw interroge `GET https://api.kilo.ai/api/gateway/models` et fusionne les modèles découverts
avant un catalogue de secours statique. Ce catalogue contient uniquement `kilocode/kilo/auto` (`Kilo Auto`,
`input: ["text", "image"]`, `reasoning: true`, `contextWindow: 1000000`, `maxTokens: 128000`).

Tout modèle disponible sur le Gateway est accessible sous la forme `kilocode/<upstream-id>` (par exemple
`kilocode/anthropic/claude-sonnet-4`, `kilocode/openai/gpt-5.5`). Exécutez `/models kilocode` ou
`openclaw models list --provider kilocode` pour afficher la liste complète des modèles découverts.

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

## Remarques sur le comportement

<AccordionGroup>
  <Accordion title="Transport et compatibilité">
    Kilo Gateway est compatible avec OpenRouter ; il utilise donc le chemin de requête de type proxy compatible avec OpenAI
    plutôt que le formatage natif des requêtes OpenAI (pas de `store`, ni de charge utile OpenAI liée à l’effort de raisonnement).

    - Les références Kilo reposant sur Gemini restent sur le chemin proxy-Gemini : OpenClaw y assainit les signatures
      de réflexion Gemini, mais n’active ni la validation native de la relecture Gemini ni les réécritures d’amorçage.
    - Les requêtes utilisent un jeton Bearer construit à partir de votre clé API.

  </Accordion>

  <Accordion title="Enveloppe de flux et raisonnement">
    L’enveloppe de flux Kilo ajoute un en-tête de requête `X-KILOCODE-FEATURE` (`openclaw` par défaut,
    modifiable avec la variable d’environnement `KILOCODE_FEATURE`) et normalise les charges utiles liées à l’effort de raisonnement pour
    les modèles qui le prennent en charge.

    <Warning>
    Les références `kilocode/kilo/auto` et `x-ai/*` n’injectent pas l’effort de raisonnement. Utilisez une référence de modèle précise,
    telle que `kilocode/anthropic/claude-sonnet-4`, si vous avez besoin de la prise en charge du raisonnement.
    </Warning>

  </Accordion>

  <Accordion title="Dépannage">
    - Si la découverte des modèles échoue au démarrage, OpenClaw utilise le catalogue statique de secours contenant `kilocode/kilo/auto`.
    - Vérifiez que votre clé API est valide et que les modèles souhaités sont activés pour votre compte Kilo.
    - Lorsque le Gateway s’exécute en tant que démon, assurez-vous que `KILOCODE_API_KEY` est accessible à ce processus (par exemple dans `~/.openclaw/.env` ou via `env.shellEnv`).

  </Accordion>
</AccordionGroup>

## Ressources associées

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Référence complète de la configuration d’OpenClaw.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Tableau de bord de Kilo Gateway, clés API et gestion du compte.
  </Card>
</CardGroup>
