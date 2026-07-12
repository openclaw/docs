---
read_when:
    - Vous souhaitez utiliser avec OpenClaw des modèles OSS hébergés sur Bedrock Mantle
    - Vous avez besoin du point de terminaison Mantle compatible avec OpenAI pour GPT-OSS, Qwen, Kimi ou GLM
    - Vous souhaitez utiliser Claude Sonnet 5 ou Mythos 5 via Amazon Bedrock Mantle
summary: Utiliser les modèles compatibles avec OpenAI et Claude Messages d’Amazon Bedrock Mantle avec OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-07-12T15:41:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 107ffdc76e3971a085f7d64d8d766f6cd8706ce882d8bab80d27c72ab545eec1
    source_path: providers/bedrock-mantle.md
    workflow: 16
---

OpenClaw inclut un fournisseur **Amazon Bedrock Mantle** intégré qui se connecte au
point de terminaison Mantle compatible avec OpenAI. Mantle héberge des modèles open source et
tiers (GPT-OSS, Qwen, Kimi, GLM et similaires) via une interface standard
`/v1/chat/completions` reposant sur l’infrastructure Bedrock. Mantle expose également
les modèles Anthropic Claude via une route Anthropic Messages.

| Propriété          | Valeur                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------- |
| ID du fournisseur  | `amazon-bedrock-mantle`                                                                                 |
| API                | `openai-completions` pour les modèles OSS découverts, `anthropic-messages` pour les modèles Claude      |
| Authentification   | `AWS_BEARER_TOKEN_BEDROCK` explicite ou génération d’un jeton porteur via la chaîne d’identifiants IAM |
| Région par défaut  | `us-east-1` (remplacez-la avec `AWS_REGION` ou `AWS_DEFAULT_REGION`)                                    |

## Prise en main

Choisissez votre méthode d’authentification préférée et suivez les étapes de configuration.

<Tabs>
  <Tab title="Jeton porteur explicite">
    **Idéal pour :** les environnements dans lesquels vous disposez déjà d’un jeton porteur Mantle.

    <Steps>
      <Step title="Définir le jeton porteur sur l’hôte du Gateway">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        Vous pouvez également définir une région (`us-east-1` par défaut) :

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Vérifier que les modèles sont découverts">
        ```bash
        openclaw models list
        ```

        Les modèles découverts apparaissent sous le fournisseur `amazon-bedrock-mantle`. Aucune
        configuration supplémentaire n’est requise, sauf si vous souhaitez remplacer les valeurs par défaut.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Identifiants IAM">
    **Idéal pour :** l’utilisation d’identifiants compatibles avec le SDK AWS (configuration partagée, SSO, identité web, rôles d’instance ou de tâche).

    <Steps>
      <Step title="Configurer les identifiants AWS sur l’hôte du Gateway">
        Toute source d’authentification compatible avec le SDK AWS fonctionne :

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Vérifier que les modèles sont découverts">
        ```bash
        openclaw models list
        ```

        OpenClaw génère automatiquement un jeton porteur Mantle à partir de la chaîne d’identifiants.
      </Step>
    </Steps>

    <Tip>
    Lorsque `AWS_BEARER_TOKEN_BEDROCK` n’est pas défini, OpenClaw génère pour vous le jeton porteur à partir de la chaîne d’identifiants AWS par défaut, notamment les profils d’identifiants et de configuration partagés, le SSO, l’identité web ainsi que les rôles d’instance ou de tâche.
    </Tip>

  </Tab>
</Tabs>

## Découverte automatique des modèles

Lorsque `AWS_BEARER_TOKEN_BEDROCK` est défini, OpenClaw l’utilise directement. Sinon,
OpenClaw tente de générer un jeton porteur Mantle à partir de la chaîne
d’identifiants AWS par défaut. Il découvre ensuite les modèles Mantle disponibles en interrogeant le
point de terminaison `/v1/models` de la région.

| Comportement                 | Détail                                                                                                            |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Cache de découverte          | Résultats mis en cache pendant 1 heure par région ; en cas d’échec de récupération, le dernier résultat est renvoyé |
| Actualisation du jeton IAM   | Toutes les 2 heures, mise en cache par région                                                                     |

Pour garder le Plugin Mantle activé tout en désactivant la découverte automatique et la
génération du jeton porteur IAM, désactivez l’option de découverte détenue par le Plugin :

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

Si vous préférez une configuration explicite à la découverte automatique :

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

Une liste `models` explicite et non vide fait autorité et remplace toutes les
entrées découvertes, y compris les entrées Claude ci-dessous. Omettez `models` pour conserver le
catalogue Mantle automatique, ou incluez toutes les entrées de modèles Claude que vous
souhaitez utiliser.

## Configuration avancée

<AccordionGroup>
  <Accordion title="Prise en charge du raisonnement">
    La prise en charge du raisonnement est déduite des ID de modèle contenant des motifs tels que
    `thinking`, `reasoner`, `reasoning`, `deepseek.r`, `gpt-oss-120b` ou
    `gpt-oss-safeguard-120b`. OpenClaw définit automatiquement `reasoning: true` pour
    les modèles correspondants lors de la découverte.
  </Accordion>

  <Accordion title="Indisponibilité du point de terminaison">
    Si le point de terminaison Mantle est indisponible, ne renvoie aucun modèle ou si la résolution
    du jeton porteur échoue, la découverte renvoie un résultat vide et le
    fournisseur implicite est ignoré. OpenClaw ne génère aucune erreur ; les autres fournisseurs configurés
    continuent de fonctionner normalement.
  </Accordion>

  <Accordion title="Claude via la route Anthropic Messages">
    Lorsque la découverte automatique gère la liste des modèles, OpenClaw ajoute quatre modèles Claude
    après une recherche réussie, indépendamment de ce que renvoie `/v1/models` :
    `amazon-bedrock-mantle/anthropic.claude-sonnet-5` (Claude Sonnet 5),
    `amazon-bedrock-mantle/anthropic.claude-opus-4-7` (Claude Opus 4.7) et
    `amazon-bedrock-mantle/anthropic.claude-mythos-5` (Claude Mythos 5), ainsi que
    `amazon-bedrock-mantle/anthropic.claude-mythos-preview` (Claude Mythos
    Preview). Ils utilisent l’interface d’API `anthropic-messages` et diffusent les réponses via
    le même point de terminaison compatible avec Anthropic et authentifié par jeton porteur
    (`<mantle-base>/anthropic`). Le jeton porteur AWS n’est donc pas traité comme une
    clé d’API Anthropic.

    Claude Sonnet 5 utilise toujours la réflexion adaptative avec un niveau d’effort `high`
    par défaut. `/think off` et `/think minimal` correspondent à `low`, car la route Mantle
    ne permet pas de désactiver la réflexion. OpenClaw omet également la température personnalisée dans
    les requêtes Sonnet 5.

    L’accès à Claude Mythos 5 est limité. Il propose une fenêtre de contexte de 1,000,000 jetons
    et une limite de sortie de 128,000 jetons, utilise toujours la réflexion adaptative, associe
    `/think off` et `/think minimal` à `low` et omet les paramètres
    d’échantillonnage sélectionnés par l’appelant.

    Claude Mythos Preview demande toujours le raisonnement, avec un niveau d’effort `high`
    par défaut lorsqu’aucun niveau `/think` n’est défini (`xhigh`/`max` étant ramenés à
    `high`, et `minimal` relevé à `low`). Opus 4.7 sur Mantle diffuse les réponses sans
    raisonnement fourni par le modèle, et OpenClaw omet son paramètre `temperature`,
    car Opus 4.7 n’accepte pas la substitution des paramètres d’échantillonnage sur cette route ; Mythos
    Preview accepte normalement une valeur `temperature` personnalisée.

    Une liste `models.providers["amazon-bedrock-mantle"].models` explicite et non vide
    remplace l’intégralité du catalogue découvert. Omettez cette liste si vous
    souhaitez utiliser ces entrées Claude intégrées.

  </Accordion>

  <Accordion title="Relation avec le fournisseur Amazon Bedrock">
    Bedrock Mantle est un fournisseur distinct du fournisseur
    [Amazon Bedrock](/fr/providers/bedrock) standard. Mantle utilise une
    interface `/v1` compatible avec OpenAI pour son catalogue OSS, tandis que le fournisseur
    Bedrock standard utilise l’API Bedrock Converse native.

    Les deux fournisseurs partagent le même identifiant `AWS_BEARER_TOKEN_BEDROCK` lorsqu’il
    est présent.

  </Accordion>
</AccordionGroup>

## Ressources associées

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/fr/providers/bedrock" icon="cloud">
    Fournisseur Bedrock natif pour Anthropic Claude, Titan et d’autres modèles.
  </Card>
  <Card title="Sélection des modèles" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="OAuth et authentification" href="/fr/gateway/authentication" icon="key">
    Détails de l’authentification et règles de réutilisation des identifiants.
  </Card>
  <Card title="Dépannage" href="/fr/help/troubleshooting" icon="wrench">
    Problèmes courants et méthodes de résolution.
  </Card>
</CardGroup>
