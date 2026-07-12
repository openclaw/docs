---
read_when:
    - Je wilt OpenClaw via een LiteLLM-proxy routeren
    - Je hebt kostentracering, logboekregistratie of modelroutering via LiteLLM nodig
summary: Voer OpenClaw uit via LiteLLM Proxy voor uniforme modeltoegang en kostenregistratie
title: LiteLLM
x-i18n:
    generated_at: "2026-07-12T09:19:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 797b7d02a80a4cd37b92553665e260532af49e011398202d3504a28c511cee2f
    source_path: providers/litellm.md
    workflow: 16
---

[LiteLLM](https://litellm.ai) is een opensource-LLM-gateway met één uniforme API voor meer dan 100 modelproviders. Leid OpenClaw via LiteLLM voor gecentraliseerde kostentracering, logboekregistratie, virtuele sleutels met bestedingslimieten en failover van backends, zonder de OpenClaw-configuratie te wijzigen.

## Snel aan de slag

<Tabs>
  <Tab title="Onboarding (aanbevolen)">
    ```bash
    openclaw onboard --auth-choice litellm-api-key
    ```

    Geef voor een niet-interactieve configuratie met een externe proxy de proxy-URL expliciet door:

    ```bash
    openclaw onboard --non-interactive --accept-risk --auth-choice litellm-api-key \
      --litellm-api-key "$LITELLM_API_KEY" --custom-base-url "https://litellm.example/v1"
    ```

  </Tab>

  <Tab title="Handmatige configuratie">
    <Steps>
      <Step title="LiteLLM Proxy starten">
        ```bash
        pip install 'litellm[proxy]'
        litellm --model claude-opus-4-6
        ```
      </Step>
      <Step title="OpenClaw naar LiteLLM laten verwijzen">
        ```bash
        export LITELLM_API_KEY="your-litellm-key"
        openclaw
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## Configuratie

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

Het standaardmodel dat de onboarding schrijft, is `litellm/claude-opus-4-6`.

## Afbeeldingen genereren

LiteLLM kan de `image_generate`-tool ondersteunen via OpenAI-compatibele routes voor `/images/generations` en `/images/edits`. Het standaardafbeeldingsmodel is `gpt-image-2`; configureer een ander model onder `agents.defaults.imageGenerationModel`:

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

LiteLLM-URL's via local loopback (`http://localhost:4000`, `127.0.0.1`, `::1`, `host.docker.internal`) werken zonder een algemene uitzondering voor privénetwerken. Stel voor een proxy die op het LAN wordt gehost `models.providers.litellm.request.allowPrivateNetwork: true` in, omdat de API-sleutel naar die host wordt verzonden.

## Geavanceerd

<AccordionGroup>
  <Accordion title="Virtuele sleutels">
    Maak voor OpenClaw een afzonderlijke sleutel met bestedingslimieten:

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

  <Accordion title="Modelroutering">
    LiteLLM kan modelaanvragen naar verschillende backends routeren. Configureer dit in uw LiteLLM-`config.yaml`:

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

    OpenClaw blijft `claude-opus-4-6` aanvragen; LiteLLM verzorgt de routering.

  </Accordion>

  <Accordion title="Gebruik bekijken">
    ```bash
    # Sleutelinformatie
    curl "http://localhost:4000/key/info" \
      -H "Authorization: Bearer sk-litellm-key"

    # Bestedingslogboeken
    curl "http://localhost:4000/spend/logs" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY"
    ```

  </Accordion>

  <Accordion title="Opmerkingen over proxygedrag">
    - LiteLLM draait standaard op `http://localhost:4000`.
    - OpenClaw maakt verbinding via LiteLLM's proxyachtige, OpenAI-compatibele `/v1`-eindpunt.
    - Aanpassing van aanvragen die uitsluitend voor de native OpenAI-integratie geldt, wordt niet toegepast via een geconfigureerde LiteLLM-basis-URL:
      geen `service_tier`, geen Responses-`store`, geen aanwijzingen voor promptcaching en geen OpenAI-specifieke aanpassing van de payload voor de redeneerintensiteit.
    - Verborgen OpenClaw-toeschrijvingsheaders (`originator`, `version`, `User-Agent`) worden alleen naar
      geverifieerde native OpenAI-eindpunten verzonden en worden daarom niet aan een aangepaste LiteLLM-basis-URL toegevoegd.
  </Accordion>
</AccordionGroup>

<Note>
Zie [Modelproviders](/nl/concepts/model-providers) voor algemene providerconfiguratie en failovergedrag.
</Note>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="LiteLLM-documentatie" href="https://docs.litellm.ai" icon="book">
    Officiële LiteLLM-documentatie en API-referentie.
  </Card>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Overzicht van alle providers, modelreferenties en failovergedrag.
  </Card>
  <Card title="Configuratie" href="/nl/gateway/configuration" icon="gear">
    Volledige configuratiereferentie.
  </Card>
  <Card title="Modellen" href="/nl/concepts/models" icon="brain">
    Modellen kiezen en configureren.
  </Card>
</CardGroup>
