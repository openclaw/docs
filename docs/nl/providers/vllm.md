---
read_when:
    - U wilt OpenClaw uitvoeren met een lokale vLLM-server
    - Je wilt OpenAI-compatibele /v1-eindpunten met je eigen modellen
summary: Voer OpenClaw uit met vLLM (OpenAI-compatibele lokale server)
title: vLLM
x-i18n:
    generated_at: "2026-07-12T09:21:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 98d1044c0a82efb6c9937e961d765d0cfcea8664cbaa043168921b457756512c
    source_path: providers/vllm.md
    workflow: 16
---

vLLM biedt opensourcemodellen (en enkele aangepaste modellen) aan via een **OpenAI-compatibele** HTTP-API. OpenClaw maakt verbinding via de `openai-completions`-API en kan modellen **automatisch detecteren** wanneer je dit inschakelt met `VLLM_API_KEY`.

| Eigenschap          | Waarde                                     |
| ------------------- | ------------------------------------------ |
| Provider-ID         | `vllm`                                     |
| API                 | `openai-completions` (OpenAI-compatibel)   |
| Authenticatie       | Omgevingsvariabele `VLLM_API_KEY`          |
| Standaardbasis-URL  | `http://127.0.0.1:8000/v1`                 |
| Streaminggebruik    | Ondersteund (`stream_options.include_usage`) |

## Aan de slag

<Steps>
  <Step title="Start vLLM met een OpenAI-compatibele server">
    Je basis-URL moet `/v1`-eindpunten beschikbaar stellen (`/v1/models`, `/v1/chat/completions`). vLLM draait doorgaans op:

    ```text
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Stel de omgevingsvariabele voor de API-sleutel in">
    Elke niet-lege waarde werkt als je server geen authenticatie afdwingt:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Selecteer een model">
    Vervang dit door een van je vLLM-model-ID's:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vllm/your-model-id" },
        },
      },
    }
    ```

  </Step>
  <Step title="Controleer of het model beschikbaar is">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

<Tip>
Geef voor niet-interactieve configuratie (CI, scripts) de basis-URL, sleutel en het model rechtstreeks door:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice vllm \
  --custom-base-url "http://127.0.0.1:8000/v1" \
  --custom-api-key "vllm-local" \
  --custom-model-id "your-model-id"
```

</Tip>

## Modeldetectie (impliciete provider)

Wanneer `VLLM_API_KEY` is ingesteld (of er een authenticatieprofiel bestaat) en `models.providers.vllm` **niet** is gedefinieerd, bevraagt OpenClaw `GET http://127.0.0.1:8000/v1/models` en zet het de geretourneerde ID's om in modelvermeldingen.

<Note>
Als je `models.providers.vllm` expliciet instelt, gebruikt OpenClaw alleen de modellen die je hebt gedeclareerd. Voeg `"vllm/*": {}` toe aan `agents.defaults.models` zodat OpenClaw ook het `/models`-eindpunt van die geconfigureerde provider bevraagt en alle aangeboden vLLM-modellen opneemt.
</Note>

## Expliciete configuratie

Configureer dit expliciet wanneer vLLM op een andere host of poort draait, je `contextWindow`/`maxTokens` wilt vastzetten, je server een echte API-sleutel vereist of je verbinding maakt met een vertrouwd local loopback-, LAN- of Tailscale-eindpunt:

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        timeoutSeconds: 300, // Optional: extend request timeout for slow local models
        models: [
          {
            id: "your-model-id",
            name: "Local vLLM Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Voeg een jokerteken toe aan de zichtbare modelcatalogus om de provider dynamisch te houden zonder elk model afzonderlijk te vermelden:

```json5
{
  agents: {
    defaults: {
      models: {
        "vllm/*": {},
      },
    },
  },
}
```

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Proxyachtig gedrag">
    vLLM wordt behandeld als een proxyachtige OpenAI-compatibele `/v1`-backend, niet als een systeemeigen OpenAI-eindpunt:

    | Gedrag                                  | Toegepast?                       |
    | --------------------------------------- | -------------------------------- |
    | Systeemeigen vormgeving van OpenAI-verzoeken | Nee                         |
    | `service_tier`                          | Niet verzonden                   |
    | `store` voor Responses                  | Niet verzonden                   |
    | Aanwijzingen voor promptcaching         | Niet verzonden                   |
    | OpenAI-compatibele vormgeving van redeneerpayloads | Niet toegepast          |
    | Verborgen OpenClaw-toeschrijvingsheaders | Niet geïnjecteerd bij aangepaste basis-URL's |

  </Accordion>

  <Accordion title="Denkbesturing voor Qwen">
    Stel voor Qwen-modellen `compat.thinkingFormat: "qwen-chat-template"` in op de modelregel wanneer de server kwargs voor de Qwen-chatsjabloon verwacht. Deze modellen bieden een binair `/think`-profiel (`off`, `on`), omdat denken via de Qwen-chatsjabloon een aan-uitvlag is en geen OpenAI-achtige inspanningsschaal.

    ```json5
    {
      models: {
        providers: {
          vllm: {
            models: [
              {
                id: "Qwen/Qwen3-8B",
                name: "Qwen3 8B",
                reasoning: true,
                compat: { thinkingFormat: "qwen-chat-template" },
              },
            ],
          },
        },
      },
    }
    ```

    OpenClaw zet `/think off` om in:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    Denkniveaus anders dan `off` verzenden `enable_thinking: true`. Als je eindpunt in plaats daarvan vlaggen op het hoogste niveau in DashScope-stijl verwacht, gebruik je `compat.thinkingFormat: "qwen"` om `enable_thinking` in de hoofdstructuur van het verzoek te verzenden.

  </Accordion>

  <Accordion title="Denkbesturing voor Nemotron 3">
    Voor `vllm/nemotron-3-*`-modellen waarbij denken is uitgeschakeld, verzendt de gebundelde Plugin:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    Stel `chat_template_kwargs` in onder de modelparameters om deze waarden aan te passen. Als je ook `params.extra_body.chat_template_kwargs` instelt, heeft die waarde voorrang omdat `extra_body` de laatste overschrijving van de verzoekbody is.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "vllm/nemotron-3-super": {
              params: {
                chat_template_kwargs: {
                  enable_thinking: false,
                  force_nonempty_content: true,
                },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Qwen-toolaanroepen verschijnen als tekst">
    Controleer eerst of vLLM is gestart met de juiste parser voor toolaanroepen en de juiste chatsjabloon voor het model. De vLLM-documentatie noemt `hermes` voor Qwen2.5-modellen en `qwen3_xml` voor Qwen3-Coder-modellen.

    Symptomen: Skills/tools worden nooit uitgevoerd, de assistent toont onbewerkte JSON/XML zoals `{"name":"read","arguments":...}`, of vLLM retourneert een lege `tool_calls`-array wanneer OpenClaw `tool_choice: "auto"` verzendt.

    Sommige combinaties van Qwen en vLLM retourneren alleen gestructureerde toolaanroepen wanneer het verzoek `tool_choice: "required"` gebruikt. Dwing dit per model af met `params.extra_body`:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "vllm/Qwen-Qwen2.5-Coder-32B-Instruct": {
              params: {
                extra_body: {
                  tool_choice: "required",
                },
              },
            },
          },
        },
      },
    }
    ```

    Vervang het model-ID door het exacte ID uit `openclaw models list --provider vllm`, of pas dezelfde overschrijving toe via de CLI:

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    Dit is een tijdelijke oplossing waarvoor je expliciet kiest: elke beurt met tools wordt gedwongen een toolaanroep uit te voeren. Gebruik dit daarom alleen voor een speciale modelvermelding waarbij dat aanvaardbaar is. Stel dit niet in als algemene standaard voor alle vLLM-modellen en combineer het niet met een proxy die willekeurige assistenttekst omzet in uitvoerbare toolaanroepen.

  </Accordion>

  <Accordion title="Aangepaste basis-URL">
    Als je vLLM-server op een niet-standaardhost of -poort draait, stel je `baseUrl` in bij de expliciete providerconfiguratie:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            timeoutSeconds: 300,
            models: [
              {
                id: "my-custom-model",
                name: "Remote vLLM Model",
                reasoning: false,
                input: ["text"],
                contextWindow: 64000,
                maxTokens: 4096,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## Problemen oplossen

<AccordionGroup>
  <Accordion title="Trage eerste reactie of time-out van externe server">
    Stel voor grote lokale modellen, externe LAN-hosts of tailnet-verbindingen een verzoektime-out op providerniveau in:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:8000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            timeoutSeconds: 300,
            models: [{ id: "your-model-id", name: "Local vLLM Model" }],
          },
        },
      },
    }
    ```

    `timeoutSeconds` is alleen van toepassing op HTTP-verzoeken voor vLLM-modellen: het opzetten van de verbinding, responsheaders, het streamen van de body en het volledig afbreken van de beveiligde ophaalactie. Hiermee wordt voor deze provider ook de limiet van de waakhond voor inactiviteit/streaming van de LLM verhoogd boven de impliciete standaardwaarde van ongeveer 120 seconden. Geef hieraan de voorkeur boven het verhogen van `agents.defaults.timeoutSeconds`, dat de volledige agentuitvoering bestuurt.

  </Accordion>

  <Accordion title="Server niet bereikbaar">
    Controleer of de vLLM-server actief en bereikbaar is:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Als je een verbindingsfout ziet, controleer dan de host en poort en of vLLM in OpenAI-compatibele servermodus is gestart. OpenClaw vertrouwt de exact geconfigureerde oorsprong van `models.providers.vllm.baseUrl` voor beveiligde modelverzoeken naar local loopback-, LAN- en Tailscale-eindpunten. Oorsprongen voor metadata en link-local blijven zonder expliciete inschakeling geblokkeerd. Stel `models.providers.vllm.request.allowPrivateNetwork: true` alleen in wanneer vLLM-verzoeken een andere privé-oorsprong moeten kunnen bereiken, of `false` om het vertrouwen van de exacte oorsprong uit te schakelen.

  </Accordion>

  <Accordion title="Authenticatiefouten bij verzoeken">
    Als verzoeken mislukken door authenticatiefouten, stel dan een echte `VLLM_API_KEY` in die overeenkomt met je serverconfiguratie, of configureer de provider expliciet onder `models.providers.vllm`.

    <Tip>
    Als je vLLM-server geen authenticatie afdwingt, werkt elke niet-lege waarde voor `VLLM_API_KEY` als expliciet inschakelsignaal voor OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="Geen modellen gedetecteerd">
    Voor automatische detectie moet `VLLM_API_KEY` zijn ingesteld. Als je `models.providers.vllm` hebt gedefinieerd, gebruikt OpenClaw alleen de modellen die je hebt gedeclareerd, tenzij `agents.defaults.models` `"vllm/*": {}` bevat.
  </Accordion>

  <Accordion title="Tools worden als onbewerkte tekst weergegeven">
    Als een Qwen-model JSON/XML-syntaxis voor tools weergeeft in plaats van een Skill uit te voeren:

    - Start vLLM met de juiste parser/sjabloon voor dat model.
    - Controleer het exacte model-ID met `openclaw models list --provider vllm`.
    - Voeg alleen een speciale overschrijving per model met `params.extra_body.tool_choice: "required"` toe als `tool_choice: "auto"` nog steeds lege of uitsluitend tekstuele toolaanroepen retourneert.

  </Accordion>
</AccordionGroup>

<Warning>
Meer hulp: [Problemen oplossen](/nl/help/troubleshooting) en [Veelgestelde vragen](/nl/help/faq).
</Warning>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelverwijzingen en failovergedrag kiezen.
  </Card>
  <Card title="OpenAI" href="/nl/providers/openai" icon="bolt">
    Systeemeigen OpenAI-provider en gedrag van OpenAI-compatibele routes.
  </Card>
  <Card title="OAuth en authenticatie" href="/nl/gateway/authentication" icon="key">
    Authenticatiedetails en regels voor het hergebruik van aanmeldgegevens.
  </Card>
  <Card title="Problemen oplossen" href="/nl/help/troubleshooting" icon="wrench">
    Veelvoorkomende problemen en hoe je deze oplost.
  </Card>
</CardGroup>
