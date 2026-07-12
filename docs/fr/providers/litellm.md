---
read_when:
    - Vous souhaitez acheminer OpenClaw via un proxy LiteLLM
    - Vous avez besoin du suivi des coûts, de la journalisation ou du routage des modèles via LiteLLM
summary: Exécutez OpenClaw via LiteLLM Proxy pour un accès unifié aux modèles et le suivi des coûts
title: LiteLLM
x-i18n:
    generated_at: "2026-07-12T15:42:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 797b7d02a80a4cd37b92553665e260532af49e011398202d3504a28c511cee2f
    source_path: providers/litellm.md
    workflow: 16
---

[LiteLLM](https://litellm.ai) est un Gateway LLM open source doté d’une API unifiée pour plus de 100 fournisseurs
de modèles. Faites transiter OpenClaw par LiteLLM afin de centraliser le suivi des coûts, la journalisation, les clés virtuelles avec
des limites de dépenses et le basculement du backend, sans modifier la configuration d’OpenClaw.

## Démarrage rapide

<Tabs>
  <Tab title="Intégration initiale (recommandée)">
    ```bash
    openclaw onboard --auth-choice litellm-api-key
    ```

    Pour une configuration non interactive avec un proxy distant, transmettez explicitement l’URL du proxy :

    ```bash
    openclaw onboard --non-interactive --accept-risk --auth-choice litellm-api-key \
      --litellm-api-key "$LITELLM_API_KEY" --custom-base-url "https://litellm.example/v1"
    ```

  </Tab>

  <Tab title="Configuration manuelle">
    <Steps>
      <Step title="Démarrer le proxy LiteLLM">
        ```bash
        pip install 'litellm[proxy]'
        litellm --model claude-opus-4-6
        ```
      </Step>
      <Step title="Connecter OpenClaw à LiteLLM">
        ```bash
        export LITELLM_API_KEY="your-litellm-key"
        openclaw
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## Configuration

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "claude-opus-4-6",
            name: "Claude Opus 4.6",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 200000,
            maxTokens: 64000,
          },
          {
            id: "gpt-4o",
            name: "GPT-4o",
            reasoning: false,
            input: ["text", "image"],
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "litellm/claude-opus-4-6" },
    },
  },
}
```

Le modèle par défaut écrit par l’intégration initiale est `litellm/claude-opus-4-6`.

## Génération d’images

LiteLLM peut prendre en charge l’outil `image_generate` au moyen des routes compatibles avec OpenAI `/images/generations` et
`/images/edits`. Le modèle d’image par défaut est `gpt-image-2` ; configurez-en un autre sous
`agents.defaults.imageGenerationModel` :

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
      },
    },
  },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "litellm/gpt-image-2",
        timeoutMs: 180_000,
      },
    },
  },
}
```

Les URL LiteLLM de bouclage (`http://localhost:4000`, `127.0.0.1`, `::1`, `host.docker.internal`) fonctionnent
sans dérogation globale pour les réseaux privés. Pour un proxy hébergé sur le réseau local, définissez
`models.providers.litellm.request.allowPrivateNetwork: true`, car la clé API est envoyée à cet hôte.

## Avancé

<AccordionGroup>
  <Accordion title="Clés virtuelles">
    Créez une clé dédiée à OpenClaw avec des limites de dépenses :

    ```bash
    curl -X POST "http://localhost:4000/key/generate" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
      -H "Content-Type: application/json" \
      -d '{
        "key_alias": "openclaw",
        "max_budget": 50.00,
        "budget_duration": "monthly"
      }'
    ```

    Utilisez la clé générée comme `LITELLM_API_KEY`.

  </Accordion>

  <Accordion title="Routage des modèles">
    LiteLLM peut acheminer les requêtes de modèles vers différents backends. Configurez-le dans votre fichier LiteLLM `config.yaml` :

    ```yaml
    model_list:
      - model_name: claude-opus-4-6
        litellm_params:
          model: claude-opus-4-6
          api_key: os.environ/ANTHROPIC_API_KEY

      - model_name: gpt-4o
        litellm_params:
          model: gpt-4o
          api_key: os.environ/OPENAI_API_KEY
    ```

    OpenClaw continue de demander `claude-opus-4-6` ; LiteLLM gère le routage.

  </Accordion>

  <Accordion title="Consulter l’utilisation">
    ```bash
    # Informations sur la clé
    curl "http://localhost:4000/key/info" \
      -H "Authorization: Bearer sk-litellm-key"

    # Journaux des dépenses
    curl "http://localhost:4000/spend/logs" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY"
    ```

  </Accordion>

  <Accordion title="Remarques sur le comportement du proxy">
    - LiteLLM s’exécute par défaut sur `http://localhost:4000`.
    - OpenClaw se connecte par l’intermédiaire du point de terminaison `/v1` compatible avec OpenAI, de type proxy, de LiteLLM.
    - La mise en forme des requêtes réservée à OpenAI natif ne s’applique pas avec une URL de base LiteLLM configurée :
      pas de `service_tier`, pas de `store` pour Responses, pas d’indications de cache de prompts, ni de mise en forme
      de la charge utile relative à l’effort de raisonnement OpenAI.
    - Les en-têtes d’attribution OpenClaw masqués (`originator`, `version`, `User-Agent`) sont uniquement envoyés aux
      points de terminaison OpenAI natifs vérifiés ; ils ne sont donc pas injectés avec une URL de base LiteLLM personnalisée.
  </Accordion>
</AccordionGroup>

<Note>
Pour la configuration générale des fournisseurs et le comportement de basculement, consultez [Fournisseurs de modèles](/fr/concepts/model-providers).
</Note>

## Pages connexes

<CardGroup cols={2}>
  <Card title="Documentation de LiteLLM" href="https://docs.litellm.ai" icon="book">
    Documentation officielle de LiteLLM et référence de l’API.
  </Card>
  <Card title="Sélection des modèles" href="/fr/concepts/model-providers" icon="layers">
    Présentation de tous les fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="Configuration" href="/fr/gateway/configuration" icon="gear">
    Référence complète de la configuration.
  </Card>
  <Card title="Modèles" href="/fr/concepts/models" icon="brain">
    Comment choisir et configurer les modèles.
  </Card>
</CardGroup>
