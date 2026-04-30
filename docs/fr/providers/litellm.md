---
read_when:
    - Vous souhaitez acheminer OpenClaw via un proxy LiteLLM
    - Vous avez besoin du suivi des coûts, de la journalisation ou du routage des modèles via LiteLLM
summary: Exécutez OpenClaw via LiteLLM Proxy pour un accès unifié aux modèles et le suivi des coûts
title: LiteLLM
x-i18n:
    generated_at: "2026-04-30T07:44:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 26b5150cfca92c9cd425c864c711efb3ab62ef94377b9d1e5d6476b07bf4c800
    source_path: providers/litellm.md
    workflow: 16
---

[LiteLLM](https://litellm.ai) est un Gateway LLM open source qui fournit une API unifiée pour plus de 100 fournisseurs de modèles. Faites passer OpenClaw par LiteLLM pour bénéficier d’un suivi centralisé des coûts, de la journalisation et de la flexibilité nécessaire pour changer de backend sans modifier votre configuration OpenClaw.

<Tip>
**Pourquoi utiliser LiteLLM avec OpenClaw ?**

- **Suivi des coûts** — Voyez exactement ce qu’OpenClaw dépense sur tous les modèles
- **Routage des modèles** — Passez de Claude, GPT-4, Gemini, Bedrock à un autre sans changement de configuration
- **Clés virtuelles** — Créez des clés avec des limites de dépenses pour OpenClaw
- **Journalisation** — Journaux complets des requêtes/réponses pour le débogage
- **Solutions de repli** — Basculement automatique si votre fournisseur principal est indisponible

</Tip>

## Démarrage rapide

<Tabs>
  <Tab title="Onboarding (recommended)">
    **Idéal pour :** le chemin le plus rapide vers une configuration LiteLLM fonctionnelle.

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice litellm-api-key
        ```

        Pour une configuration non interactive avec un proxy distant, transmettez explicitement l’URL du proxy :

        ```bash
        openclaw onboard --non-interactive --auth-choice litellm-api-key --litellm-api-key "$LITELLM_API_KEY" --custom-base-url "https://litellm.example/v1"
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Manual setup">
    **Idéal pour :** un contrôle complet de l’installation et de la configuration.

    <Steps>
      <Step title="Start LiteLLM Proxy">
        ```bash
        pip install 'litellm[proxy]'
        litellm --model claude-opus-4-6
        ```
      </Step>
      <Step title="Point OpenClaw to LiteLLM">
        ```bash
        export LITELLM_API_KEY="your-litellm-key"

        openclaw
        ```

        C’est tout. OpenClaw passe désormais par LiteLLM.
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Configuration

### Variables d’environnement

```bash
export LITELLM_API_KEY="sk-litellm-key"
```

### Fichier de configuration

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

## Configuration avancée

### Génération d’images

LiteLLM peut également prendre en charge l’outil `image_generate` via les routes
`/images/generations` et `/images/edits` compatibles avec OpenAI. Configurez un modèle d’image LiteLLM
sous `agents.defaults.imageGenerationModel` :

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

Les URL LiteLLM en loopback comme `http://localhost:4000` fonctionnent sans dérogation globale
pour le réseau privé. Pour un proxy hébergé sur le LAN, définissez
`models.providers.litellm.request.allowPrivateNetwork: true`, car la clé API
sera envoyée à l’hôte proxy configuré.

<AccordionGroup>
  <Accordion title="Virtual keys">
    Créez une clé dédiée pour OpenClaw avec des limites de dépenses :

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

  <Accordion title="Model routing">
    LiteLLM peut acheminer les requêtes de modèles vers différents backends. Configurez-le dans votre `config.yaml` LiteLLM :

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

    OpenClaw continue de demander `claude-opus-4-6` — LiteLLM gère le routage.

  </Accordion>

  <Accordion title="Viewing usage">
    Consultez le tableau de bord ou l’API de LiteLLM :

    ```bash
    # Key info
    curl "http://localhost:4000/key/info" \
      -H "Authorization: Bearer sk-litellm-key"

    # Spend logs
    curl "http://localhost:4000/spend/logs" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY"
    ```

  </Accordion>

  <Accordion title="Proxy behavior notes">
    - LiteLLM s’exécute par défaut sur `http://localhost:4000`
    - OpenClaw se connecte via l’endpoint `/v1` compatible OpenAI de style proxy de LiteLLM
    - La mise en forme des requêtes propre à OpenAI ne s’applique pas via LiteLLM :
      pas de `service_tier`, pas de `store` Responses, pas d’indications de cache de prompt, et pas de
      mise en forme de charge utile compatible avec le raisonnement OpenAI
    - Les en-têtes d’attribution OpenClaw masqués (`originator`, `version`, `User-Agent`)
      ne sont pas injectés sur les URL de base LiteLLM personnalisées
  </Accordion>
</AccordionGroup>

<Note>
Pour la configuration générale des fournisseurs et le comportement de basculement, consultez [Fournisseurs de modèles](/fr/concepts/model-providers).
</Note>

## Connexe

<CardGroup cols={2}>
  <Card title="LiteLLM Docs" href="https://docs.litellm.ai" icon="book">
    Documentation officielle de LiteLLM et référence de l’API.
  </Card>
  <Card title="Model selection" href="/fr/concepts/model-providers" icon="layers">
    Vue d’ensemble de tous les fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="Configuration" href="/fr/gateway/configuration" icon="gear">
    Référence complète de la configuration.
  </Card>
  <Card title="Model selection" href="/fr/concepts/models" icon="brain">
    Comment choisir et configurer les modèles.
  </Card>
</CardGroup>
