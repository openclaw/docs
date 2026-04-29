---
read_when:
    - Je wilt OpenClaw via een LiteLLM-proxy routeren
    - Je hebt kostenregistratie, logging of modelroutering via LiteLLM nodig
summary: Voer OpenClaw uit via LiteLLM Proxy voor uniforme modeltoegang en kostenregistratie
title: LiteLLM
x-i18n:
    generated_at: "2026-04-29T23:11:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 26b5150cfca92c9cd425c864c711efb3ab62ef94377b9d1e5d6476b07bf4c800
    source_path: providers/litellm.md
    workflow: 16
---

[LiteLLM](https://litellm.ai) is een open-source LLM-Gateway die een uniforme API biedt voor meer dan 100 modelproviders. Routeer OpenClaw via LiteLLM voor gecentraliseerde kostenregistratie, logging en de flexibiliteit om backends te wisselen zonder je OpenClaw-configuratie te wijzigen.

<Tip>
**Waarom LiteLLM met OpenClaw gebruiken?**

- **Kostenregistratie** — Zie precies wat OpenClaw uitgeeft aan alle modellen
- **Modelroutering** — Wissel tussen Claude, GPT-4, Gemini, Bedrock zonder configuratiewijzigingen
- **Virtuele sleutels** — Maak sleutels met bestedingslimieten voor OpenClaw
- **Logging** — Volledige aanvraag-/responslogs voor debugging
- **Fallbacks** — Automatische failover als je primaire provider niet beschikbaar is

</Tip>

## Snelstart

<Tabs>
  <Tab title="Onboarding (recommended)">
    **Beste voor:** de snelste route naar een werkende LiteLLM-installatie.

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice litellm-api-key
        ```

        Geef voor een niet-interactieve installatie met een externe proxy expliciet de proxy-URL door:

        ```bash
        openclaw onboard --non-interactive --auth-choice litellm-api-key --litellm-api-key "$LITELLM_API_KEY" --custom-base-url "https://litellm.example/v1"
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Manual setup">
    **Beste voor:** volledige controle over installatie en configuratie.

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

        Dat is alles. OpenClaw routeert nu via LiteLLM.
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Configuratie

### Omgevingsvariabelen

```bash
export LITELLM_API_KEY="sk-litellm-key"
```

### Configuratiebestand

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

## Geavanceerde configuratie

### Afbeeldingen genereren

LiteLLM kan ook de `image_generate`-tool ondersteunen via OpenAI-compatibele
`/images/generations`- en `/images/edits`-routes. Configureer een LiteLLM-afbeeldingsmodel
onder `agents.defaults.imageGenerationModel`:

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

Loopback-LiteLLM-URL's zoals `http://localhost:4000` werken zonder globale
override voor privénetwerken. Stel voor een proxy die op een LAN wordt gehost
`models.providers.litellm.request.allowPrivateNetwork: true` in, omdat de API-sleutel
naar de geconfigureerde proxyhost wordt verzonden.

<AccordionGroup>
  <Accordion title="Virtual keys">
    Maak een speciale sleutel voor OpenClaw met bestedingslimieten:

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

    Gebruik de gegenereerde sleutel als `LITELLM_API_KEY`.

  </Accordion>

  <Accordion title="Model routing">
    LiteLLM kan modelaanvragen naar verschillende backends routeren. Configureer dit in je LiteLLM `config.yaml`:

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

    OpenClaw blijft `claude-opus-4-6` aanvragen — LiteLLM handelt de routering af.

  </Accordion>

  <Accordion title="Viewing usage">
    Controleer het dashboard of de API van LiteLLM:

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
    - LiteLLM draait standaard op `http://localhost:4000`
    - OpenClaw maakt verbinding via het proxy-achtige OpenAI-compatibele `/v1`-endpoint
      van LiteLLM
    - Aanvraagvorming die alleen voor native OpenAI geldt, is niet van toepassing via LiteLLM:
      geen `service_tier`, geen Responses `store`, geen prompt-cache-hints en geen
      OpenAI-reasoning-compat payload-vorming
    - Verborgen OpenClaw-attributieheaders (`originator`, `version`, `User-Agent`)
      worden niet geïnjecteerd op aangepaste LiteLLM-basis-URL's
  </Accordion>
</AccordionGroup>

<Note>
Zie [Modelproviders](/nl/concepts/model-providers) voor algemene providerconfiguratie en failovergedrag.
</Note>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="LiteLLM Docs" href="https://docs.litellm.ai" icon="book">
    Officiële LiteLLM-documentatie en API-referentie.
  </Card>
  <Card title="Model selection" href="/nl/concepts/model-providers" icon="layers">
    Overzicht van alle providers, modelverwijzingen en failovergedrag.
  </Card>
  <Card title="Configuration" href="/nl/gateway/configuration" icon="gear">
    Volledige configuratiereferentie.
  </Card>
  <Card title="Model selection" href="/nl/concepts/models" icon="brain">
    Hoe je modellen kiest en configureert.
  </Card>
</CardGroup>
