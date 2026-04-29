---
read_when:
    - Je wilt OpenClaw gebruiken met een lokale vLLM-server
    - Je wilt OpenAI-compatibele /v1-eindpunten met je eigen modellen
summary: OpenClaw uitvoeren met vLLM (OpenAI-compatibele lokale server)
title: vLLM
x-i18n:
    generated_at: "2026-04-29T23:14:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: b638341b5138d085ed3fa781300216d5bae58b9d7e3a9edfe6cbdcdbc379c2ce
    source_path: providers/vllm.md
    workflow: 16
---

vLLM kan open-source (en sommige aangepaste) modellen aanbieden via een **OpenAI-compatibele** HTTP-API. OpenClaw maakt verbinding met vLLM via de `openai-completions`-API.

OpenClaw kan beschikbare modellen ook **automatisch ontdekken** vanuit vLLM wanneer je je hiervoor aanmeldt met `VLLM_API_KEY` (elke waarde werkt als je server geen auth afdwingt) en je geen expliciete `models.providers.vllm`-vermelding definieert.

OpenClaw behandelt `vllm` als een lokale OpenAI-compatibele provider die
gestreamde gebruiksadministratie ondersteunt, zodat status-/contexttokentellingen kunnen worden bijgewerkt vanuit
`stream_options.include_usage`-antwoorden.

| Eigenschap       | Waarde                                   |
| ---------------- | ---------------------------------------- |
| Provider-ID      | `vllm`                                   |
| API              | `openai-completions` (OpenAI-compatibel) |
| Auth             | omgevingsvariabele `VLLM_API_KEY`        |
| Standaardbasis-URL | `http://127.0.0.1:8000/v1`             |

## Aan de slag

<Steps>
  <Step title="Start vLLM met een OpenAI-compatibele server">
    Je basis-URL moet `/v1`-eindpunten aanbieden (bijv. `/v1/models`, `/v1/chat/completions`). vLLM draait vaak op:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Stel de omgevingsvariabele voor de API-sleutel in">
    Elke waarde werkt als je server geen auth afdwingt:

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

## Modeldetectie (impliciete provider)

Wanneer `VLLM_API_KEY` is ingesteld (of er een auth-profiel bestaat) en je **geen** `models.providers.vllm` definieert, vraagt OpenClaw het volgende op:

```
GET http://127.0.0.1:8000/v1/models
```

en zet het de geretourneerde ID's om naar modelvermeldingen.

<Note>
Als je `models.providers.vllm` expliciet instelt, wordt automatische detectie overgeslagen en moet je modellen handmatig definiëren.
</Note>

## Expliciete configuratie (handmatige modellen)

Gebruik expliciete configuratie wanneer:

- vLLM op een andere host of poort draait
- Je `contextWindow`- of `maxTokens`-waarden wilt vastzetten
- Je server een echte API-sleutel vereist (of je headers wilt beheren)
- Je verbinding maakt met een vertrouwd local loopback-, LAN- of Tailscale-vLLM-eindpunt

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        request: { allowPrivateNetwork: true },
        timeoutSeconds: 300, // Optional: extend connect/header/body/request timeout for slow local models
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

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Proxy-achtig gedrag">
    vLLM wordt behandeld als een proxy-achtige OpenAI-compatibele `/v1`-backend, niet als een native
    OpenAI-eindpunt. Dit betekent:

    | Gedrag | Toegepast? |
    |----------|----------|
    | Native OpenAI-aanvraagvorming | Nee |
    | `service_tier` | Niet verzonden |
    | Responses `store` | Niet verzonden |
    | Prompt-cachehints | Niet verzonden |
    | OpenAI-vorming van reasoning-compatibele payload | Niet toegepast |
    | Verborgen OpenClaw-attributieheaders | Niet geïnjecteerd op aangepaste basis-URL's |

  </Accordion>

  <Accordion title="Qwen-denkbesturing">
    Voor Qwen-modellen die via vLLM worden aangeboden, stel je
    `params.qwenThinkingFormat: "chat-template"` in op de modelvermelding wanneer de
    server Qwen chat-template-kwargs verwacht. OpenClaw wijst `/think off` toe aan:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    Niet-`off` denkniveaus verzenden `enable_thinking: true`. Als je eindpunt
    in plaats daarvan DashScope-achtige top-level-vlaggen verwacht, gebruik dan
    `params.qwenThinkingFormat: "top-level"` om `enable_thinking` in de
    requestroot te verzenden. Snake-case `params.qwen_thinking_format` wordt ook geaccepteerd.

  </Accordion>

  <Accordion title="Nemotron 3-denkbesturing">
    vLLM/Nemotron 3 kan chat-template-kwargs gebruiken om te bepalen of reasoning wordt
    geretourneerd als verborgen reasoning of als zichtbare antwoordtekst. Wanneer een OpenClaw-sessie
    `vllm/nemotron-3-*` gebruikt met denken uit, verzendt de meegeleverde vLLM-Plugin:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    Om deze waarden aan te passen, stel je `chat_template_kwargs` in onder de modelparams.
    Als je ook `params.extra_body.chat_template_kwargs` instelt, heeft die waarde
    uiteindelijke voorrang omdat `extra_body` de laatste override voor de requestbody is.

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
    Zorg er eerst voor dat vLLM is gestart met de juiste tool-call-parser en chat-
    template voor het model. vLLM documenteert bijvoorbeeld `hermes` voor Qwen2.5-
    modellen en `qwen3_xml` voor Qwen3-Coder-modellen.

    Symptomen:

    - Skills of tools worden nooit uitgevoerd
    - de assistent drukt ruwe JSON/XML af, zoals `{"name":"read","arguments":...}`
    - vLLM retourneert een lege `tool_calls`-array wanneer OpenClaw
      `tool_choice: "auto"` verzendt

    Sommige Qwen/vLLM-combinaties retourneren gestructureerde toolaanroepen alleen wanneer de
    aanvraag `tool_choice: "required"` gebruikt. Forceer voor die modelvermeldingen het
    OpenAI-compatibele aanvraagveld met `params.extra_body`:

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

    Vervang `Qwen-Qwen2.5-Coder-32B-Instruct` door de exacte id die wordt geretourneerd door:

    ```bash
    openclaw models list --provider vllm
    ```

    Je kunt dezelfde override toepassen via de CLI:

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    Dit is een opt-in compatibiliteitsoplossing. Hierdoor vereist elke modelbeurt met
    tools een toolaanroep, dus gebruik dit alleen voor een specifieke lokale modelvermelding
    waarbij dat gedrag acceptabel is. Gebruik dit niet als globale standaard voor alle
    vLLM-modellen, en gebruik geen proxy die willekeurige
    assistenttekst blind omzet in uitvoerbare toolaanroepen.

  </Accordion>

  <Accordion title="Aangepaste basis-URL">
    Als je vLLM-server op een niet-standaardhost of -poort draait, stel dan `baseUrl` in de expliciete providerconfiguratie in:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            request: { allowPrivateNetwork: true },
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

## Probleemoplossing

<AccordionGroup>
  <Accordion title="Trage eerste reactie of time-out van externe server">
    Stel voor grote lokale modellen, externe LAN-hosts of tailnet-koppelingen een
    providergebonden requesttime-out in:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:8000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            request: { allowPrivateNetwork: true },
            timeoutSeconds: 300,
            models: [{ id: "your-model-id", name: "Local vLLM Model" }],
          },
        },
      },
    }
    ```

    `timeoutSeconds` is alleen van toepassing op HTTP-aanvragen voor vLLM-modellen, inclusief
    het opzetten van de verbinding, responseheaders, bodystreaming en de totale
    guarded-fetch-afbreking. Geef hier de voorkeur aan voordat je
    `agents.defaults.timeoutSeconds` verhoogt, dat de volledige agentrun beheert.

  </Accordion>

  <Accordion title="Server niet bereikbaar">
    Controleer of de vLLM-server draait en toegankelijk is:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Als je een verbindingsfout ziet, controleer dan de host, poort en of vLLM is gestart met de OpenAI-compatibele servermodus.
    Voor expliciete local loopback-, LAN- of Tailscale-eindpunten stel je ook
    `models.providers.vllm.request.allowPrivateNetwork: true` in; provider-
    aanvragen blokkeren standaard URL's op privénetwerken, tenzij de provider
    expliciet wordt vertrouwd.

  </Accordion>

  <Accordion title="Auth-fouten bij aanvragen">
    Als aanvragen mislukken met auth-fouten, stel dan een echte `VLLM_API_KEY` in die overeenkomt met je serverconfiguratie, of configureer de provider expliciet onder `models.providers.vllm`.

    <Tip>
    Als je vLLM-server geen auth afdwingt, werkt elke niet-lege waarde voor `VLLM_API_KEY` als opt-in-signaal voor OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="Geen modellen ontdekt">
    Automatische detectie vereist dat `VLLM_API_KEY` is ingesteld **en** dat er geen expliciete `models.providers.vllm`-configuratievermelding is. Als je de provider handmatig hebt gedefinieerd, slaat OpenClaw detectie over en gebruikt het alleen je gedeclareerde modellen.
  </Accordion>

  <Accordion title="Tools worden als ruwe tekst weergegeven">
    Als een Qwen-model JSON/XML-toolsyntaxis afdrukt in plaats van een Skill uit te voeren,
    controleer dan de Qwen-richtlijnen in Geavanceerde configuratie hierboven. De gebruikelijke oplossing is:

    - start vLLM met de juiste parser/template voor dat model
    - bevestig de exacte model-id met `openclaw models list --provider vllm`
    - voeg alleen een specifieke per-model-override `params.extra_body.tool_choice: "required"` toe
      als `tool_choice: "auto"` nog steeds lege of tekst-only
      toolaanroepen retourneert

  </Accordion>
</AccordionGroup>

<Warning>
Meer hulp: [Probleemoplossing](/nl/help/troubleshooting) en [FAQ](/nl/help/faq).
</Warning>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelrefs en failovergedrag kiezen.
  </Card>
  <Card title="OpenAI" href="/nl/providers/openai" icon="bolt">
    Native OpenAI-provider en OpenAI-compatibel routegedrag.
  </Card>
  <Card title="OAuth en auth" href="/nl/gateway/authentication" icon="key">
    Auth-details en regels voor hergebruik van referenties.
  </Card>
  <Card title="Probleemoplossing" href="/nl/help/troubleshooting" icon="wrench">
    Veelvoorkomende problemen en hoe je ze oplost.
  </Card>
</CardGroup>
