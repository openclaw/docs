---
read_when:
    - Je wilt OpenClaw uitvoeren tegen een lokale vLLM-server
    - Je wilt OpenAI-compatibele /v1-eindpunten met je eigen modellen
summary: OpenClaw uitvoeren met vLLM (OpenAI-compatibele lokale server)
title: vLLM
x-i18n:
    generated_at: "2026-06-27T18:15:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a3a5da5ce359bf62c44cddd0c97d2852d98c996ad6d44552a68d4aeb4d1d2893
    source_path: providers/vllm.md
    workflow: 16
---

vLLM kan open-sourcemodellen (en sommige aangepaste modellen) aanbieden via een **OpenAI-compatibele** HTTP-API. OpenClaw maakt verbinding met vLLM via de `openai-completions`-API.

OpenClaw kan beschikbare modellen ook **automatisch ontdekken** vanuit vLLM wanneer je je aanmeldt met `VLLM_API_KEY` (elke waarde werkt als je server geen authenticatie afdwingt). Gebruik `vllm/*` in `agents.defaults.models` om ontdekking dynamisch te houden wanneer je ook een aangepaste vLLM-basis-URL configureert.

OpenClaw behandelt `vllm` als een lokale OpenAI-compatibele provider die
gestreamde gebruiksboekhouding ondersteunt, zodat status-/contexttokentellingen kunnen worden bijgewerkt vanuit
`stream_options.include_usage`-reacties.

| Eigenschap       | Waarde                                   |
| ---------------- | ---------------------------------------- |
| Provider-ID      | `vllm`                                   |
| API              | `openai-completions` (OpenAI-compatibel) |
| Authenticatie    | `VLLM_API_KEY`-omgevingsvariabele        |
| Standaardbasis-URL | `http://127.0.0.1:8000/v1`             |

## Aan de slag

<Steps>
  <Step title="Start vLLM with an OpenAI-compatible server">
    Je basis-URL moet `/v1`-eindpunten aanbieden (bijv. `/v1/models`, `/v1/chat/completions`). vLLM draait vaak op:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Set the API key environment variable">
    Elke waarde werkt als je server geen authenticatie afdwingt:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Select a model">
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
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

## Modelontdekking (impliciete provider)

Wanneer `VLLM_API_KEY` is ingesteld (of er een authenticatieprofiel bestaat) en je `models.providers.vllm` **niet** definieert, bevraagt OpenClaw:

```
GET http://127.0.0.1:8000/v1/models
```

en zet de geretourneerde ID's om in modelvermeldingen.

<Note>
Als je `models.providers.vllm` expliciet instelt, gebruikt OpenClaw standaard je gedeclareerde modellen. Voeg `"vllm/*": {}` toe aan `agents.defaults.models` wanneer je wilt dat OpenClaw het `/models`-eindpunt van die geconfigureerde provider bevraagt en alle geadverteerde vLLM-modellen opneemt.
</Note>

## Expliciete configuratie (handmatige modellen)

Gebruik expliciete configuratie wanneer:

- vLLM op een andere host of poort draait
- Je `contextWindow`- of `maxTokens`-waarden wilt vastzetten
- Je server een echte API-sleutel vereist (of je headers wilt beheren)
- Je verbinding maakt met een vertrouwd loopback-, LAN- of Tailscale-vLLM-eindpunt

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
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

Om deze provider dynamisch te houden zonder elk model handmatig te vermelden, voeg je een providerjokerteken toe aan de zichtbare modelcatalogus:

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
  <Accordion title="Proxy-style behavior">
    vLLM wordt behandeld als een proxy-achtige OpenAI-compatibele `/v1`-backend, niet als een native
    OpenAI-eindpunt. Dit betekent:

    | Gedrag | Toegepast? |
    |----------|----------|
    | Native OpenAI-aanvraagvorming | Nee |
    | `service_tier` | Niet verzonden |
    | Responses `store` | Niet verzonden |
    | Promptcache-hints | Niet verzonden |
    | OpenAI-redeneercompatibele payloadvorming | Niet toegepast |
    | Verborgen OpenClaw-toeschrijvingsheaders | Niet geïnjecteerd op aangepaste basis-URL's |

  </Accordion>

  <Accordion title="Qwen thinking controls">
    Stel voor Qwen-modellen die via vLLM worden aangeboden
    `compat.thinkingFormat: "qwen-chat-template"` in op de geconfigureerde provider-
    modelrij wanneer de server Qwen-chat-template-kwargs verwacht. Modellen
    die op deze manier zijn geconfigureerd, tonen een binair `/think`-profiel (`off`, `on`), omdat
    Qwen-template-denken een aan/uit-aanvraagvlag is, geen OpenAI-achtige inspanningsladder.

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

    OpenClaw koppelt `/think off` aan:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    Niet-`off` denkniveaus verzenden `enable_thinking: true`. Als je eindpunt
    in plaats daarvan DashScope-achtige vlaggen op topniveau verwacht, gebruik dan
    `compat.thinkingFormat: "qwen"` om `enable_thinking` in de root van de aanvraag te verzenden.

  </Accordion>

  <Accordion title="Nemotron 3 thinking controls">
    vLLM/Nemotron 3 kan chat-template-kwargs gebruiken om te bepalen of redeneren
    wordt geretourneerd als verborgen redenering of zichtbare antwoordtekst. Wanneer een OpenClaw-sessie
    `vllm/nemotron-3-*` gebruikt met denken uit, verzendt de gebundelde vLLM-Plugin:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    Om deze waarden aan te passen, stel je `chat_template_kwargs` in onder de modelparameters.
    Als je ook `params.extra_body.chat_template_kwargs` instelt, heeft die waarde
    de uiteindelijke voorrang omdat `extra_body` de laatste override voor de aanvraagbody is.

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

  <Accordion title="Qwen tool calls appear as text">
    Zorg er eerst voor dat vLLM is gestart met de juiste tool-call-parser en chat-
    template voor het model. vLLM documenteert bijvoorbeeld `hermes` voor Qwen2.5-
    modellen en `qwen3_xml` voor Qwen3-Coder-modellen.

    Symptomen:

    - Skills of tools worden nooit uitgevoerd
    - de assistent print ruwe JSON/XML zoals `{"name":"read","arguments":...}`
    - vLLM retourneert een lege `tool_calls`-array wanneer OpenClaw
      `tool_choice: "auto"` verzendt

    Sommige Qwen/vLLM-combinaties retourneren alleen gestructureerde tool calls wanneer de
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

    Vervang `Qwen-Qwen2.5-Coder-32B-Instruct` door de exacte ID die wordt geretourneerd door:

    ```bash
    openclaw models list --provider vllm
    ```

    Je kunt dezelfde override toepassen vanuit de CLI:

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    Dit is een opt-in compatibiliteitsworkaround. Hierdoor vereist elke modelbeurt met
    tools een tool call, dus gebruik dit alleen voor een specifieke lokale modelvermelding
    waar dat gedrag acceptabel is. Gebruik dit niet als globale standaard voor alle
    vLLM-modellen, en gebruik geen proxy die willekeurige
    assistenttekst blind omzet in uitvoerbare tool calls.

  </Accordion>

  <Accordion title="Custom base URL">
    Als je vLLM-server op een niet-standaard host of poort draait, stel dan `baseUrl` in de expliciete providerconfiguratie in:

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

## Probleemoplossing

<AccordionGroup>
  <Accordion title="Slow first response or remote server timeout">
    Stel voor grote lokale modellen, externe LAN-hosts of tailnet-koppelingen een
    providergebonden aanvraagtimeout in:

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

    `timeoutSeconds` geldt alleen voor HTTP-aanvragen aan vLLM-modellen, inclusief
    verbindingsopbouw, responsheaders, bodystreaming en de totale
    guarded-fetch-afbreking. Geef hier de voorkeur aan voordat je
    `agents.defaults.timeoutSeconds` verhoogt, dat de volledige agent-run beheert.

  </Accordion>

  <Accordion title="Server not reachable">
    Controleer of de vLLM-server draait en toegankelijk is:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Als je een verbindingsfout ziet, controleer dan de host, poort en of vLLM is gestart met de OpenAI-compatibele servermodus.
    Voor expliciete loopback-, LAN- of Tailscale-eindpunten vertrouwt OpenClaw de
    exact geconfigureerde `models.providers.vllm.baseUrl`-origin voor bewaakte modelaanvragen.
    Metadata-/link-local-origins blijven geblokkeerd zonder expliciete
    opt-in. Stel `models.providers.vllm.request.allowPrivateNetwork: true` alleen in
    wanneer vLLM-aanvragen een andere private origin moeten bereiken, en stel dit in op `false`
    om af te zien van vertrouwen op exacte origin.

  </Accordion>

  <Accordion title="Auth errors on requests">
    Als aanvragen mislukken met authenticatiefouten, stel dan een echte `VLLM_API_KEY` in die overeenkomt met je serverconfiguratie, of configureer de provider expliciet onder `models.providers.vllm`.

    <Tip>
    Als je vLLM-server geen authenticatie afdwingt, werkt elke niet-lege waarde voor `VLLM_API_KEY` als opt-in-signaal voor OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="No models discovered">
    Automatische ontdekking vereist dat `VLLM_API_KEY` is ingesteld. Als je `models.providers.vllm` hebt gedefinieerd, gebruikt OpenClaw alleen je gedeclareerde modellen tenzij `agents.defaults.models` `"vllm/*": {}` bevat.
  </Accordion>

  <Accordion title="Tools render as raw text">
    Als een Qwen-model JSON/XML-toolsyntaxis print in plaats van een Skill uit te voeren,
    controleer dan de Qwen-richtlijnen in Geavanceerde configuratie hierboven. De gebruikelijke oplossing is:

    - start vLLM met de juiste parser/template voor dat model
    - bevestig de exacte model-ID met `openclaw models list --provider vllm`
    - voeg alleen een specifieke per-model-override `params.extra_body.tool_choice: "required"`
      toe als `tool_choice: "auto"` nog steeds lege of alleen-tekst-
      tool calls retourneert

  </Accordion>
</AccordionGroup>

<Warning>
Meer hulp: [Probleemoplossing](/nl/help/troubleshooting) en [FAQ](/nl/help/faq).
</Warning>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelverwijzingen en failover-gedrag kiezen.
  </Card>
  <Card title="OpenAI" href="/nl/providers/openai" icon="bolt">
    Native OpenAI-provider en OpenAI-compatibel routegedrag.
  </Card>
  <Card title="OAuth en auth" href="/nl/gateway/authentication" icon="key">
    Auth-details en regels voor hergebruik van inloggegevens.
  </Card>
  <Card title="Probleemoplossing" href="/nl/help/troubleshooting" icon="wrench">
    Veelvoorkomende problemen en hoe u ze oplost.
  </Card>
</CardGroup>
