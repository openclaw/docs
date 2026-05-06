---
read_when:
    - Je wilt OpenClaw gebruiken met een lokale inferrs-server
    - Je stelt Gemma of een ander model beschikbaar via inferrs
    - Je hebt de exacte OpenClaw-compatibiliteitsvlaggen voor inferrs nodig
summary: OpenClaw uitvoeren via inferrs (OpenAI-compatibele lokale server)
title: Leidt af
x-i18n:
    generated_at: "2026-05-06T09:29:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 216783689527229835acf4f0fb6d2981d1915bd5df28e631b5384c4cbb9ee158
    source_path: providers/inferrs.md
    workflow: 16
---

[inferrs](https://github.com/ericcurtin/inferrs) kan lokale modellen aanbieden achter een OpenAI-compatibele `/v1`-API. OpenClaw werkt met `inferrs` via het generieke `openai-completions`-pad.

| Eigenschap         | Waarde                                                             |
| ------------------ | ------------------------------------------------------------------ |
| Provider-id        | `inferrs` (aangepast; configureer onder `models.providers.inferrs`) |
| Plugin             | geen — `inferrs` is geen meegeleverde OpenClaw-provider-Plugin     |
| Auth-omgevingsvariabele | Optioneel. Elke waarde werkt als je inferrs-server geen auth heeft |
| API                | OpenAI-compatibel (`openai-completions`)                           |
| Voorgestelde basis-URL | `http://127.0.0.1:8080/v1` (of waar je inferrs-server ook draait) |

<Note>
  `inferrs` kan momenteel het best worden behandeld als een aangepaste, zelf gehoste OpenAI-compatibele backend, niet als een specifieke OpenClaw-provider-Plugin. Je configureert dit via `models.providers.inferrs` in plaats van met een onboarding-keuzevlag. Als je een echte meegeleverde Plugin met automatische detectie nodig hebt, zie [SGLang](/nl/providers/sglang) of [vLLM](/nl/providers/vllm).
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
    Voeg een expliciete providervermelding toe en wijs je standaardmodel daarnaar. Zie het volledige configuratievoorbeeld hieronder.
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
    Sommige `inferrs` Chat Completions-routes accepteren alleen string
    `messages[].content`, geen gestructureerde content-part-arrays.

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

    OpenClaw vlakt zuivere tekstcontentdelen af naar gewone strings voordat het
    verzoek wordt verzonden.

  </Accordion>

  <Accordion title="Gemma en aandachtspunt voor tool-schema's">
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

    Dat schakelt OpenClaw's tool-schema-oppervlak voor het model uit en kan de promptdruk
    op striktere lokale backends verminderen.

    Als heel kleine directe verzoeken nog steeds werken maar normale OpenClaw-agentbeurten blijven
    crashen binnen `inferrs`, ligt het resterende probleem meestal bij upstream model-/servergedrag
    in plaats van bij OpenClaw's transportlaag.

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

    Als het eerste commando werkt maar het tweede mislukt, raadpleeg dan de sectie probleemoplossing hieronder.

  </Accordion>

  <Accordion title="Proxy-achtig gedrag">
    `inferrs` wordt behandeld als een proxy-achtige OpenAI-compatibele `/v1`-backend, niet als een
    native OpenAI-eindpunt.

    - Native OpenAI-only request shaping is hier niet van toepassing
    - Geen `service_tier`, geen Responses `store`, geen prompt-cache-hints en geen
      OpenAI reasoning-compat payload shaping
    - Verborgen OpenClaw-attributieheaders (`originator`, `version`, `User-Agent`)
      worden niet geïnjecteerd op aangepaste `inferrs`-basis-URL's

  </Accordion>
</AccordionGroup>

## Probleemoplossing

<AccordionGroup>
  <Accordion title="curl /v1/models mislukt">
    `inferrs` draait niet, is niet bereikbaar of is niet gebonden aan de verwachte
    host/poort. Zorg dat de server is gestart en luistert op het adres dat je
    hebt geconfigureerd.
  </Accordion>

  <Accordion title="messages[].content verwacht een string">
    Stel `compat.requiresStringContent: true` in de modelvermelding in. Zie de
    sectie `requiresStringContent` hierboven voor details.
  </Accordion>

  <Accordion title="Directe /v1/chat/completions-aanroepen slagen, maar openclaw infer model run mislukt">
    Probeer `compat.supportsTools: false` in te stellen om het tool-schema-oppervlak uit te schakelen.
    Zie het aandachtspunt voor Gemma-tool-schema's hierboven.
  </Accordion>

  <Accordion title="inferrs crasht nog steeds bij grotere agentbeurten">
    Als OpenClaw geen schemafouten meer krijgt maar `inferrs` nog steeds crasht bij grotere
    agentbeurten, behandel dit dan als een upstream `inferrs`- of modelbeperking. Verminder
    de promptdruk of schakel over naar een andere lokale backend of een ander model.
  </Accordion>
</AccordionGroup>

<Tip>
Voor algemene hulp, zie [Probleemoplossing](/nl/help/troubleshooting) en [FAQ](/nl/help/faq).
</Tip>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Lokale modellen" href="/nl/gateway/local-models" icon="server">
    OpenClaw uitvoeren met lokale modelservers.
  </Card>
  <Card title="Gateway-probleemoplossing" href="/nl/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    Lokale OpenAI-compatibele backends debuggen die probes doorstaan maar mislukken bij agent-runs.
  </Card>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Overzicht van alle providers, modelrefs en failover-gedrag.
  </Card>
</CardGroup>
