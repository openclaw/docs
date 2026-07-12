---
read_when:
    - Je wilt OpenClaw uitvoeren met een lokale inferrs-server
    - Je stelt Gemma of een ander model beschikbaar via inferrs
    - Je hebt de exacte OpenClaw-compatibiliteitsvlaggen voor inferrs nodig
summary: Voer OpenClaw uit via inferrs (OpenAI-compatibele lokale server)
title: Leidt af
x-i18n:
    generated_at: "2026-07-12T09:19:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b9b6fe337a2ec6536332dd62840052fd802fad0a5f3d885ce137523266ff3c9
    source_path: providers/inferrs.md
    workflow: 16
---

[inferrs](https://github.com/ericcurtin/inferrs) stelt lokale modellen beschikbaar via een OpenAI-compatibele `/v1`-API. OpenClaw communiceert ermee via de generieke `openai-completions`-adapter.

| Eigenschap          | Waarde                                                                                  |
| ------------------- | --------------------------------------------------------------------------------------- |
| Provider-id         | `inferrs` (aangepast; configureren onder `models.providers.inferrs`)                    |
| Plugin              | geen — geen gebundelde OpenClaw-providerplugin                                          |
| Omgevingsvariabele voor authenticatie | niet vereist; elke waarde werkt als uw inferrs-server geen authenticatie gebruikt |
| API                 | OpenAI-compatibel (`openai-completions`)                                                 |
| Voorgestelde basis-URL | `http://127.0.0.1:8080/v1` (of waar uw inferrs-server ook luistert)                   |

<Note>
  `inferrs` is een aangepaste, zelfgehoste OpenAI-compatibele backend en geen specifieke OpenClaw-providerplugin: u configureert deze onder `models.providers.inferrs` in plaats van een authenticatieoptie tijdens de onboarding te kiezen. Zie voor een gebundelde Plugin met automatische detectie [SGLang](/nl/providers/sglang) of [vLLM](/nl/providers/vllm).
</Note>

## Aan de slag

<Steps>
  <Step title="Start inferrs met een model">
    ```bash
    inferrs serve google/gemma-4-E2B-it \
      --host 127.0.0.1 \
      --port 8080 \
      --device metal
    ```
  </Step>
  <Step title="Controleer of de server bereikbaar is">
    ```bash
    curl http://127.0.0.1:8080/health
    curl http://127.0.0.1:8080/v1/models
    ```
  </Step>
  <Step title="Voeg een OpenClaw-providervermelding toe">
    Voeg een expliciete providervermelding toe en verwijs uw standaardmodel ernaar. Zie het configuratievoorbeeld hieronder.
  </Step>
</Steps>

## Volledig configuratievoorbeeld

Gemma 4 op een lokale `inferrs`-server:

```json5
{
  agents: {
    defaults: {
      model: { primary: "inferrs/google/gemma-4-E2B-it" },
      models: {
        "inferrs/google/gemma-4-E2B-it": {
          alias: "Gemma 4 (inferrs)",
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

## Starten op aanvraag

OpenClaw kan `inferrs` zelf starten, maar alleen wanneer een `inferrs/...`-model is geselecteerd. Voeg `localService` toe aan dezelfde providervermelding:

```json5
{
  models: {
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "/opt/homebrew/bin/inferrs",
          args: [
            "serve",
            "google/gemma-4-E2B-it",
            "--host",
            "127.0.0.1",
            "--port",
            "8080",
            "--device",
            "metal",
          ],
          healthUrl: "http://127.0.0.1:8080/v1/models",
          readyTimeoutMs: 180000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

`command` moet een absoluut pad zijn. Voer `which inferrs` uit op de Gateway-host en gebruik dat pad. Volledig veldoverzicht: [Lokale modelservices](/nl/gateway/local-model-services).

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Waarom requiresStringContent belangrijk is">
    Sommige Chat Completions-routes van `inferrs` accepteren voor `messages[].content` alleen tekenreeksen, geen gestructureerde arrays met inhoudsdelen.

    <Warning>
    Als OpenClaw-uitvoeringen mislukken met:

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    stel dan `compat.requiresStringContent: true` in bij de modelvermelding. OpenClaw zet inhoudsdelen die uitsluitend uit tekst bestaan dan om in gewone tekenreeksen voordat het verzoek wordt verzonden.
    </Warning>

  </Accordion>

  <Accordion title="Kanttekening bij Gemma en het toolschema">
    Sommige combinaties van `inferrs` en Gemma accepteren kleine, rechtstreekse verzoeken aan `/v1/chat/completions`, maar mislukken bij volledige uitvoeringen van de OpenClaw-agentruntime. Probeer eerst het toolschema-oppervlak uit te schakelen:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    Dat verlaagt de promptbelasting voor strengere lokale backends. Als kleine rechtstreekse verzoeken nog steeds werken, maar normale OpenClaw-agentuitvoeringen binnen `inferrs` blijven vastlopen, beschouw dit dan als een beperking van het bovenliggende model of de server en niet als een transportprobleem van OpenClaw.

  </Accordion>

  <Accordion title="Handmatige rooktest">
    Test na de configuratie beide lagen:

    ```bash
    curl http://127.0.0.1:8080/v1/chat/completions \
      -H 'content-type: application/json' \
      -d '{"model":"google/gemma-4-E2B-it","messages":[{"role":"user","content":"What is 2 + 2?"}],"stream":false}'
    ```

    ```bash
    openclaw infer model run \
      --model inferrs/google/gemma-4-E2B-it \
      --prompt "What is 2 + 2? Reply with one short sentence." \
      --json
    ```

    Als de eerste opdracht werkt, maar de tweede mislukt, raadpleeg dan Problemen oplossen hieronder.

  </Accordion>

  <Accordion title="Gedrag als proxy">
    Omdat `inferrs` de generieke `openai-completions`-adapter gebruikt (en niet `openai-responses`), wordt verzoekopmaak die uitsluitend voor de systeemeigen OpenAI-integratie geldt nooit toegepast: er worden geen `service_tier`, geen Responses-`store`, geen aanwijzingen voor promptcaching en geen OpenAI-payloadopmaak voor compatibiliteit met redeneren verzonden.
  </Accordion>
</AccordionGroup>

## Problemen oplossen

<AccordionGroup>
  <Accordion title="curl /v1/models mislukt">
    `inferrs` wordt niet uitgevoerd, is niet bereikbaar of is niet gekoppeld aan de host en poort die u hebt geconfigureerd. Controleer of de server is gestart en op dat adres luistert.
  </Accordion>

  <Accordion title="messages[].content verwachtte een tekenreeks">
    Stel `compat.requiresStringContent: true` in bij de modelvermelding (zie hierboven).
  </Accordion>

  <Accordion title="Rechtstreekse aanroepen van /v1/chat/completions slagen, maar openclaw infer model run mislukt">
    Stel `compat.supportsTools: false` in om het toolschema-oppervlak uit te schakelen (zie de kanttekening bij Gemma hierboven).
  </Accordion>

  <Accordion title="inferrs loopt nog steeds vast bij grotere agentuitvoeringen">
    Als de schemafouten zijn verdwenen, maar `inferrs` nog steeds vastloopt bij grotere agentuitvoeringen, beschouw dit dan als een beperking van het bovenliggende `inferrs` of het model. Verlaag de promptbelasting of stap over op een andere backend of een ander model.
  </Accordion>
</AccordionGroup>

<Tip>
Raadpleeg voor algemene hulp [Problemen oplossen](/nl/help/troubleshooting) en [Veelgestelde vragen](/nl/help/faq).
</Tip>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Lokale modellen" href="/nl/gateway/local-models" icon="server">
    OpenClaw uitvoeren met lokale modelservers.
  </Card>
  <Card title="Lokale modelservices" href="/nl/gateway/local-model-services" icon="play">
    Lokale modelservers op aanvraag starten voor geconfigureerde providers.
  </Card>
  <Card title="Problemen met de Gateway oplossen" href="/nl/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    Problemen opsporen in lokale OpenAI-compatibele backends die controles doorstaan, maar waarbij agentuitvoeringen mislukken.
  </Card>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Overzicht van alle providers, modelverwijzingen en failovergedrag.
  </Card>
</CardGroup>
