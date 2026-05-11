---
read_when:
    - Vous voulez utiliser des modèles OSS hébergés par Bedrock Mantle avec OpenClaw
    - Vous avez besoin du point de terminaison Mantle compatible avec OpenAI pour GPT-OSS, Qwen, Kimi ou GLM
summary: Utiliser les modèles Amazon Bedrock Mantle (compatibles avec OpenAI) avec OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-05-11T20:51:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 721eef5b7ff606b8c5e02234dae1b8d846b43ff9f3d7bf871f701bb3136fec0e
    source_path: providers/bedrock-mantle.md
    workflow: 16
---

OpenClaw inclut un fournisseur **Amazon Bedrock Mantle** intégré qui se connecte au
point de terminaison Mantle compatible avec OpenAI. Mantle héberge des modèles
open source et tiers (GPT-OSS, Qwen, Kimi, GLM, et similaires) via une surface
`/v1/chat/completions` standard adossée à l’infrastructure Bedrock.

| Propriété        | Valeur                                                                                         |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| ID du fournisseur | `amazon-bedrock-mantle`                                                                       |
| API              | `openai-completions` (compatible avec OpenAI) ou `anthropic-messages` (route Anthropic Messages) |
| Authentification | `AWS_BEARER_TOKEN_BEDROCK` explicite ou génération de jeton porteur via la chaîne d’identifiants IAM |
| Région par défaut | `us-east-1` (remplacer avec `AWS_REGION` ou `AWS_DEFAULT_REGION`)                             |

## Démarrage

Choisissez votre méthode d’authentification préférée et suivez les étapes de configuration.

<Tabs>
  <Tab title="Explicit bearer token">
    **Idéal pour :** les environnements où vous disposez déjà d’un jeton porteur Mantle.

    <Steps>
      <Step title="Set the bearer token on the gateway host">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        Définissez éventuellement une région (`us-east-1` par défaut) :

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Verify models are discovered">
        ```bash
        openclaw models list
        ```

        Les modèles découverts apparaissent sous le fournisseur `amazon-bedrock-mantle`. Aucune
        configuration supplémentaire n’est requise, sauf si vous souhaitez remplacer les valeurs par défaut.
      </Step>
    </Steps>

  </Tab>

  <Tab title="IAM credentials">
    **Idéal pour :** utiliser des identifiants compatibles avec l’AWS SDK (configuration partagée, SSO, identité web, rôles d’instance ou de tâche).

    <Steps>
      <Step title="Configure AWS credentials on the gateway host">
        Toute source d’authentification compatible avec l’AWS SDK fonctionne :

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Verify models are discovered">
        ```bash
        openclaw models list
        ```

        OpenClaw génère automatiquement un jeton porteur Mantle à partir de la chaîne d’identifiants.
      </Step>
    </Steps>

    <Tip>
    Lorsque `AWS_BEARER_TOKEN_BEDROCK` n’est pas défini, OpenClaw émet pour vous le jeton porteur à partir de la chaîne d’identifiants AWS par défaut, y compris les profils d’identifiants/configuration partagés, le SSO, l’identité web, et les rôles d’instance ou de tâche.
    </Tip>

  </Tab>
</Tabs>

## Découverte automatique des modèles

Lorsque `AWS_BEARER_TOKEN_BEDROCK` est défini, OpenClaw l’utilise directement. Sinon,
OpenClaw tente de générer un jeton porteur Mantle à partir de la chaîne
d’identifiants AWS par défaut. Il découvre ensuite les modèles Mantle disponibles en interrogeant le
point de terminaison `/v1/models` de la région.

| Comportement           | Détail                          |
| ---------------------- | ------------------------------- |
| Cache de découverte    | Résultats mis en cache 1 heure  |
| Actualisation du jeton IAM | Toutes les heures           |

Pour conserver le Plugin Mantle activé tout en supprimant la découverte automatique et la génération
de jeton porteur IAM, désactivez le bouton de découverte appartenant au Plugin :

```bash
openclaw config set plugins.entries.amazon-bedrock-mantle.config.discovery.enabled false
```

<Note>
Le jeton porteur est le même `AWS_BEARER_TOKEN_BEDROCK` que celui utilisé par le fournisseur [Amazon Bedrock](/fr/providers/bedrock) standard.
</Note>

### Régions prises en charge

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## Configuration manuelle

Si vous préférez une configuration explicite plutôt que la découverte automatique :

```json5
{
  models: {
    providers: {
      "amazon-bedrock-mantle": {
        baseUrl: "https://bedrock-mantle.us-east-1.api.aws/v1",
        api: "openai-completions",
        auth: "api-key",
        apiKey: "env:AWS_BEARER_TOKEN_BEDROCK",
        models: [
          {
            id: "gpt-oss-120b",
            name: "GPT-OSS 120B",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32000,
            maxTokens: 4096,
          },
        ],
      },
    },
  },
}
```

## Configuration avancée

<AccordionGroup>
  <Accordion title="Reasoning support">
    La prise en charge du raisonnement est déduite des ID de modèles contenant des motifs comme
    `thinking`, `reasoner` ou `gpt-oss-120b`. OpenClaw définit automatiquement `reasoning: true`
    pour les modèles correspondants pendant la découverte.
  </Accordion>

  <Accordion title="Endpoint unavailability">
    Si le point de terminaison Mantle est indisponible ou ne renvoie aucun modèle, le fournisseur est
    ignoré silencieusement. OpenClaw ne renvoie pas d’erreur ; les autres fournisseurs configurés
    continuent de fonctionner normalement.
  </Accordion>

  <Accordion title="Claude Opus 4.7 via the Anthropic Messages route">
    Mantle expose également une route Anthropic Messages qui transporte les modèles Claude via le même chemin de streaming authentifié par jeton porteur. Claude Opus 4.7 (`amazon-bedrock-mantle/claude-opus-4.7`) peut être appelé via cette route avec un streaming appartenant au fournisseur, de sorte que les jetons porteurs AWS ne sont pas traités comme des clés API Anthropic.

    Lorsque vous épinglez un modèle Anthropic Messages sur le fournisseur Mantle, OpenClaw utilise la surface API `anthropic-messages` au lieu de `openai-completions` pour ce modèle. L’authentification provient toujours de `AWS_BEARER_TOKEN_BEDROCK` (ou du jeton porteur IAM émis).

    ```json5
    {
      models: {
        providers: {
          "amazon-bedrock-mantle": {
            models: [
              {
                id: "claude-opus-4.7",
                name: "Claude Opus 4.7",
                api: "anthropic-messages",
                reasoning: true,
                input: ["text", "image"],
                contextWindow: 1000000,
                maxTokens: 32000,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Relationship to Amazon Bedrock provider">
    Bedrock Mantle est un fournisseur distinct du fournisseur
    [Amazon Bedrock](/fr/providers/bedrock) standard. Mantle utilise une surface
    `/v1` compatible avec OpenAI, tandis que le fournisseur Bedrock standard utilise
    l’API Bedrock native.

    Les deux fournisseurs partagent le même identifiant `AWS_BEARER_TOKEN_BEDROCK` lorsqu’il
    est présent.

  </Accordion>
</AccordionGroup>

## Associé

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/fr/providers/bedrock" icon="cloud">
    Fournisseur Bedrock natif pour Anthropic Claude, Titan et d’autres modèles.
  </Card>
  <Card title="Model selection" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="OAuth and auth" href="/fr/gateway/authentication" icon="key">
    Détails d’authentification et règles de réutilisation des identifiants.
  </Card>
  <Card title="Troubleshooting" href="/fr/help/troubleshooting" icon="wrench">
    Problèmes courants et manière de les résoudre.
  </Card>
</CardGroup>
