---
read_when:
    - Je wilt OpenClaw uitvoeren met een lokale inferrs-server
    - Je serveert Gemma of een ander model via inferrs
    - Je hebt de exacte OpenClaw-compatibiliteitsvlaggen voor inferrs nodig
summary: OpenClaw uitvoeren via inferrs (OpenAI-compatibele lokale server)
title: Leidt af
x-i18n:
    generated_at: "2026-04-29T23:10:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53547c48febe584cf818507b0bf879db0471c575fa8a3ebfec64c658a7090675
    source_path: providers/inferrs.md
    workflow: 16
---

[inferrs](https://github.com/ericcurtin/inferrs) kan lokale modellen aanbieden achter een
OpenAI-compatibele `/v1`-API. OpenClaw werkt met `inferrs` via het generieke
`openai-completions`-pad.

`inferrs` kan momenteel het best worden behandeld als een aangepaste zelfgehoste OpenAI-compatibele
backend, niet als een speciale OpenClaw-provider-Plugin.

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
    Voeg een expliciete providervermelding toe en wijs je standaardmodel ernaar. Zie het volledige configuratievoorbeeld hieronder.
  </Step>
</Steps>

## Volledig configuratievoorbeeld

Dit voorbeeld gebruikt Gemma 4 op een lokale `inferrs`-server.

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

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Waarom requiresStringContent belangrijk is">
    Sommige `inferrs` Chat Completions-routes accepteren alleen tekenreekswaarden voor
    `messages[].content`, geen gestructureerde arrays met inhoudsonderdelen.

    <Warning>
    Als OpenClaw-runs mislukken met een fout zoals:

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    stel dan `compat.requiresStringContent: true` in je modelvermelding in.
    </Warning>

    ```json5
    compat: {
      requiresStringContent: true
    }
    ```

    OpenClaw vlakt pure tekstinhoudsonderdelen af tot gewone tekenreeksen voordat
    het verzoek wordt verzonden.

  </Accordion>

  <Accordion title="Kanttekening bij Gemma en toolschema">
    Sommige huidige combinaties van `inferrs` + Gemma accepteren kleine directe
    `/v1/chat/completions`-verzoeken, maar mislukken nog steeds bij volledige OpenClaw-agent-runtime
    beurten.

    Als dat gebeurt, probeer dan eerst dit:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    Dat schakelt het toolschema-oppervlak van OpenClaw voor het model uit en kan de promptdruk
    op striktere lokale backends verminderen.

    Als zeer kleine directe verzoeken nog steeds werken maar normale OpenClaw-agentbeurten blijven
    crashen binnen `inferrs`, ligt het resterende probleem meestal bij upstream model-/servergedrag
    in plaats van bij de transportlaag van OpenClaw.

  </Accordion>

  <Accordion title="Handmatige smoke-test">
    Test na configuratie beide lagen:

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

    Als de eerste opdracht werkt maar de tweede mislukt, controleer dan de sectie voor probleemoplossing hieronder.

  </Accordion>

  <Accordion title="Proxy-achtig gedrag">
    `inferrs` wordt behandeld als een proxy-achtige OpenAI-compatibele `/v1`-backend, niet als een
    native OpenAI-eindpunt.

    - Native alleen-OpenAI-verzoekvorming is hier niet van toepassing
    - Geen `service_tier`, geen Responses `store`, geen prompt-cache-hints en geen
      OpenAI reasoning-compat-payloadvorming
    - Verborgen OpenClaw-attributieheaders (`originator`, `version`, `User-Agent`)
      worden niet geïnjecteerd op aangepaste `inferrs`-basis-URL's

  </Accordion>
</AccordionGroup>

## Probleemoplossing

<AccordionGroup>
  <Accordion title="curl /v1/models mislukt">
    `inferrs` draait niet, is niet bereikbaar of is niet gebonden aan de verwachte
    host/poort. Zorg ervoor dat de server is gestart en luistert op het adres dat je
    hebt geconfigureerd.
  </Accordion>

  <Accordion title="messages[].content verwacht een tekenreeks">
    Stel `compat.requiresStringContent: true` in de modelvermelding in. Zie de
    sectie `requiresStringContent` hierboven voor details.
  </Accordion>

  <Accordion title="Directe /v1/chat/completions-aanroepen slagen, maar openclaw infer model run mislukt">
    Probeer `compat.supportsTools: false` in te stellen om het toolschema-oppervlak uit te schakelen.
    Zie de kanttekening bij het Gemma-toolschema hierboven.
  </Accordion>

  <Accordion title="inferrs crasht nog steeds bij grotere agentbeurten">
    Als OpenClaw geen schemafouten meer krijgt maar `inferrs` nog steeds crasht bij grotere
    agentbeurten, behandel dit dan als een upstream beperking van `inferrs` of het model. Verminder
    de promptdruk of schakel over naar een andere lokale backend of een ander model.
  </Accordion>
</AccordionGroup>

<Tip>
Zie voor algemene hulp [Probleemoplossing](/nl/help/troubleshooting) en [FAQ](/nl/help/faq).
</Tip>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Lokale modellen" href="/nl/gateway/local-models" icon="server">
    OpenClaw uitvoeren tegen lokale modelservers.
  </Card>
  <Card title="Gateway-probleemoplossing" href="/nl/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    Lokale OpenAI-compatibele backends debuggen die probes doorstaan maar mislukken bij agent-runs.
  </Card>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Overzicht van alle providers, modelverwijzingen en failovergedrag.
  </Card>
</CardGroup>
